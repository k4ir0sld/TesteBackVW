// Importa o Repository responsável
// pelas operações da tabela tbl_setor.
import setorRepository from "../database/monitoramento/setorRepository.js";

// ==========================================
// SERVICE - SETORES
// ==========================================
// Valida os dados e aplica as regras
// de negócio dos setores.

class SetorService {

    // Cria erros com códigos HTTP.
    criarErro(mensagem, status = 400) {
        const erro = new Error(mensagem);
        erro.status = status;
        return erro;
    }

    // Valida IDs recebidos nas requisições.
    validarId(valor) {
        const id = Number(valor);

        if (!Number.isSafeInteger(id) || id <= 0) {
            throw this.criarErro("Identificador inválido.");
        }

        return id;
    }

    // Valida os campos do setor.
    async validarDados(dados, idAtual = null) {

        // CÓDIGO
        const codigo = dados?.codigo?.trim();

        if (!codigo || codigo.length > 20) {
            throw this.criarErro(
                "O código deve conter entre 1 e 20 caracteres."
            );
        }

        // NOME
        if (
            typeof dados?.nome !== "string" ||
            !dados.nome.trim() ||
            dados.nome.trim().length > 100
        ) {
            throw this.criarErro(
                "O nome deve conter entre 1 e 100 caracteres."
            );
        }

        // RESPONSÁVEL
        const responsavel = dados.responsavel ?? null;

        if (
            responsavel !== null &&
            (typeof responsavel !== "string" ||
             responsavel.length > 100)
        ) {
            throw this.criarErro("Responsável inválido.");
        }

        // STATUS
        const status = dados.status ?? "Ativo";

        if (!["Ativo", "Inativo"].includes(status)) {
            throw this.criarErro(
                "O status deve ser Ativo ou Inativo."
            );
        }

        // LOCAL
        const idLocal = this.validarId(dados.id_local);

        const local = await setorRepository.buscarLocalPorId(idLocal);

        if (!local) {
            throw this.criarErro("Local não encontrado.", 404);
        }

        if (status === "Ativo" && local.status !== "Ativo") {
            throw this.criarErro(
                "Não é possível manter um setor ativo em um local inativo."
            );
        }

        // CÓDIGO ÚNICO
        const existente = await setorRepository.buscarPorCodigo(codigo);

        if (existente && existente.id !== idAtual) {
            throw this.criarErro(
                `Já existe um setor com o código "${codigo}".`,
                409
            );
        }

        return {
            id_local: idLocal,
            codigo,
            nome: dados.nome.trim(),
            responsavel,
            status
        };
    }

    // Lista todos os setores.
    async listarTodos() {
        return setorRepository.listarTodos();
    }

    // Busca um setor pelo ID.
    async buscarPorId(id) {
        const setor = await setorRepository.buscarPorId(this.validarId(id));

        if (!setor) {
            throw this.criarErro("Setor não encontrado.", 404);
        }

        return setor;
    }

    // Lista os setores de determinado local.
    async listarPorLocal(idLocal) {
        const id = this.validarId(idLocal);

        const local = await setorRepository.buscarLocalPorId(id);

        if (!local) {
            throw this.criarErro("Local não encontrado.", 404);
        }

        return setorRepository.listarPorLocal(id);
    }

    // Cadastra um novo setor.
    async criar(dados) {
        const setor = await this.validarDados(dados);
        return setorRepository.criar(setor);
    }

    // Atualiza os dados de um setor.
    async atualizar(id, dados) {
        const idValidado = this.validarId(id);

        await this.buscarPorId(idValidado);

        const setor = await this.validarDados(dados, idValidado);

        await setorRepository.atualizar(idValidado, setor);

        return setorRepository.buscarPorId(idValidado);
    }

    // Altera o status de um setor.
    async atualizarStatus(id, status) {
        const idValidado = this.validarId(id);

        const setor = await this.buscarPorId(idValidado);

        if (!["Ativo", "Inativo"].includes(status)) {
            throw this.criarErro("Status inválido.");
        }

        if (status === "Ativo") {
            const local = await setorRepository.buscarLocalPorId(setor.id_local);

            if (local.status !== "Ativo") {
                throw this.criarErro(
                    "Ative o local antes de reativar o setor."
                );
            }
        }

        await setorRepository.atualizarStatus(idValidado, status);

        return setorRepository.buscarPorId(idValidado);
    }
}

export default new SetorService();