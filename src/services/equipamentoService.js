import equipamentoRepository from "../database/monitoramento/equipamentoRepository.js";

// ==========================================
// SERVICE - EQUIPAMENTOS
// ==========================================
// Responsável pelas regras de negócio,
// validações e comunicação com o Repository.
//
// Pontos 2 e 1 (extensão) aplicados:
// - Campo "descricao" validado e retornado.
// - Cálculo de "status_conectividade" a
//   partir da última medição e da config.

class EquipamentoService {

    criarErro(mensagem, status = 400) {
        const erro = new Error(mensagem);
        erro.status = status;
        return erro;
    }

    validarId(id, campo = "ID") {
        const numero = Number(id);

        if (!Number.isSafeInteger(numero) || numero <= 0) {
            throw this.criarErro(`${campo} inválido.`);
        }

        return numero;
    }

    textoOpcional(valor) {
        if (valor === undefined || valor === null || valor === "") {
            return null;
        }

        return String(valor).trim() || null;
    }

    numeroOpcional(valor, campo) {
        if (valor === undefined || valor === null || valor === "") {
            return null;
        }

        const numero = Number(valor);

        if (!Number.isFinite(numero) || numero < 0) {
            throw this.criarErro(`${campo} deve ser um número não negativo.`);
        }

        if (numero > 99999999.99) {
            throw this.criarErro(`${campo} excede o limite permitido.`);
        }

        return numero;
    }

    dataOpcional(valor) {
        if (valor === undefined || valor === null || valor === "") {
            return null;
        }

        if (
            typeof valor !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(valor)
        ) {
            throw this.criarErro(
                "data_instalacao deve estar no formato YYYY-MM-DD."
            );
        }

        const data = new Date(`${valor}T00:00:00Z`);

        if (
            Number.isNaN(data.getTime()) ||
            data.toISOString().slice(0, 10) !== valor
        ) {
            throw this.criarErro("data_instalacao inválida.");
        }

        return valor;
    }

    // ======================================
    // CÁLCULO DE STATUS DE CONECTIVIDADE
    // ======================================
    // Converte "ultima_medicao" em:
    //   sem_medicao / online / atencao / offline
    calcularStatusConectividade(ultimaMedicao, config) {
        if (!ultimaMedicao) {
            return "sem_medicao";
        }

        const agora = Date.now();
        const ultima = new Date(ultimaMedicao).getTime();

        if (Number.isNaN(ultima)) {
            return "sem_medicao";
        }

        const diffMinutos = (agora - ultima) / (1000 * 60);

        const thresholdInstavel = config?.tempo_instavel_minutos ?? 2;
        const thresholdOffline  = config?.tempo_offline_minutos  ?? 5;

        if (diffMinutos <= thresholdInstavel) return "online";
        if (diffMinutos <= thresholdOffline)  return "atencao";
        return "offline";
    }

    enriquecerComStatus(equipamento, config) {
        if (!equipamento) return equipamento;

        return {
            ...equipamento,
            status_conectividade: this.calcularStatusConectividade(
                equipamento.ultima_medicao,
                config
            )
        };
    }

    enriquecerListaComStatus(equipamentos, config) {
        return equipamentos.map(e => this.enriquecerComStatus(e, config));
    }

    // ======================================
    // VALIDAÇÃO
    // ======================================
    async validarDados(dados, idAtual = null) {

        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
            throw this.criarErro("Informe os dados do equipamento.");
        }

        const id_setor = this.validarId(dados.id_setor, "ID do setor");

        const codigo = String(dados.codigo ?? "").trim();
        const nome = String(dados.nome ?? "").trim();

        if (!codigo || codigo.length > 20) {
            throw this.criarErro(
                "Código obrigatório, com no máximo 20 caracteres."
            );
        }

        if (!nome || nome.length > 100) {
            throw this.criarErro(
                "Nome obrigatório, com no máximo 100 caracteres."
            );
        }

        const setor = await equipamentoRepository.buscarSetorPorId(id_setor);

        if (!setor) {
            throw this.criarErro("Setor não encontrado.", 404);
        }

        if (
            setor.status !== "Ativo" ||
            setor.status_local !== "Ativo" ||
            setor.status_empresa !== "Ativa"
        ) {
            throw this.criarErro(
                "O setor, local e empresa devem estar ativos."
            );
        }

        const existente = await equipamentoRepository.buscarPorCodigo(codigo);

        if (existente && existente.id !== idAtual) {
            throw this.criarErro(
                "Já existe um equipamento com este código.",
                409
            );
        }

        const camposTexto = {
            tipo_equipamento: 100,
            fabricante: 100,
            modelo: 100,
            numero_serie: 50
        };

        const opcionais = {};

        for (const [campo, tamanho] of Object.entries(camposTexto)) {
            const valor = this.textoOpcional(dados[campo]);

            if (valor && valor.length > tamanho) {
                throw this.criarErro(
                    `${campo} permite no máximo ${tamanho} caracteres.`
                );
            }

            opcionais[campo] = valor;
        }

        // DESCRIÇÃO
        const descricao = this.textoOpcional(dados.descricao);

        if (descricao && descricao.length > 255) {
            throw this.criarErro(
                "descricao permite no máximo 255 caracteres."
            );
        }

        const status = dados.status ?? "Ativo";

        if (!["Ativo", "Inativo"].includes(status)) {
            throw this.criarErro(
                "Status deve ser Ativo ou Inativo."
            );
        }

        return {
            id_setor,
            codigo,
            nome,
            ...opcionais,
            descricao,
            potencia_nominal: this.numeroOpcional(
                dados.potencia_nominal,
                "Potência nominal"
            ),
            tensao_nominal: this.numeroOpcional(
                dados.tensao_nominal,
                "Tensão nominal"
            ),
            data_instalacao: this.dataOpcional(
                dados.data_instalacao
            ),
            status
        };
    }

    // ======================================
    // CONSULTAS
    // ======================================

    async listarTodos() {
        const equipamentos = await equipamentoRepository.listarTodos();
        const config = await equipamentoRepository.buscarConfigComunicacao();
        return this.enriquecerListaComStatus(equipamentos, config);
    }

    async buscarPorId(id) {
        const idValidado = this.validarId(id);

        const equipamento =
            await equipamentoRepository.buscarPorId(idValidado);

        if (!equipamento) {
            throw this.criarErro("Equipamento não encontrado.", 404);
        }

        const config = await equipamentoRepository.buscarConfigComunicacao();

        return this.enriquecerComStatus(equipamento, config);
    }

    async listarPorSetor(idSetor) {
        const idValidado = this.validarId(idSetor, "ID do setor");

        const setor = await equipamentoRepository.buscarSetorPorId(idValidado);

        if (!setor) {
            throw this.criarErro("Setor não encontrado.", 404);
        }

        const equipamentos =
            await equipamentoRepository.listarPorSetor(idValidado);

        const config = await equipamentoRepository.buscarConfigComunicacao();

        return this.enriquecerListaComStatus(equipamentos, config);
    }

    // ======================================
    // CADASTRO
    // ======================================

    async criar(dados) {
        const dadosValidados = await this.validarDados(dados);

        const id = await equipamentoRepository.criar(dadosValidados);

        return this.buscarPorId(id);
    }

    // ======================================
    // ATUALIZAÇÃO
    // ======================================

    async atualizar(id, dados) {
        const idValidado = this.validarId(id);

        await this.buscarPorId(idValidado);

        const dadosValidados =
            await this.validarDados(dados, idValidado);

        await equipamentoRepository.atualizar(
            idValidado,
            dadosValidados
        );

        return this.buscarPorId(idValidado);
    }

    async atualizarStatus(id, status) {
        const idValidado = this.validarId(id);

        await this.buscarPorId(idValidado);

        if (!["Ativo", "Inativo"].includes(status)) {
            throw this.criarErro(
                "Status deve ser Ativo ou Inativo."
            );
        }

        await equipamentoRepository.atualizarStatus(
            idValidado,
            status
        );

        return this.buscarPorId(idValidado);
    }
}

export default new EquipamentoService();