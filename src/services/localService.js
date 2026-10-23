// Importa o Repository responsável
// pelas operações da tabela tbl_local.
import localRepository from "../database/monitoramento/localRepository.js";

// ==========================================
// SERVICE - LOCAIS
// ==========================================
// Contém as validações e regras de negócio.

class LocalService {

    // Cria erros com código HTTP definido.
    criarErro(mensagem, status = 400) {
        const erro = new Error(mensagem);
        erro.status = status;
        return erro;
    }

    // Valida um identificador positivo.
    validarId(valor) {
        const id = Number(valor);

        if (!Number.isSafeInteger(id) || id <= 0) {
            throw this.criarErro("Identificador inválido.");
        }

        return id;
    }

    // Valida e prepara os dados de um local.
    // O parâmetro "idAtual" serve para não
    // conflitar com o próprio registro na edição.
    async validarDados(dados, idAtual = null) {

        // CÓDIGO
        const codigo = dados?.codigo?.trim();

        if (!codigo || codigo.length > 20) {
            throw this.criarErro(
                "O código deve conter entre 1 e 20 caracteres."
            );
        }

        // NOME
        const nome = dados?.nome?.trim();

        if (!nome || nome.length > 100) {
            throw this.criarErro(
                "O nome deve conter entre 1 e 100 caracteres."
            );
        }

        // ENDEREÇO
        const endereco = dados.endereco ?? null;

        if (
            endereco !== null &&
            (typeof endereco !== "string" ||
             endereco.length > 255)
        ) {
            throw this.criarErro("Endereço inválido.");
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

        // EMPRESA
        const idEmpresa = this.validarId(dados.id_empresa);

        const empresa = await localRepository.buscarEmpresaPorId(idEmpresa);

        if (!empresa) {
            throw this.criarErro("Empresa não encontrada.", 404);
        }

        // CÓDIGO ÚNICO
        const existente = await localRepository.buscarPorCodigo(codigo);

        if (existente && existente.id !== idAtual) {
            throw this.criarErro(
                `Já existe um local com o código "${codigo}".`,
                409
            );
        }

        return {
            id_empresa: idEmpresa,
            codigo,
            nome,
            endereco,
            responsavel,
            status
        };
    }

    // Lista todos os locais.
    async listarTodos() {
        return localRepository.listarTodos();
    }

    // Consulta um local específico.
    async buscarPorId(id) {
        const local = await localRepository.buscarPorId(this.validarId(id));

        if (!local) {
            throw this.criarErro("Local não encontrado.", 404);
        }

        return local;
    }

    // Cadastra um novo local.
    async criar(dados) {
        const local = await this.validarDados(dados);
        return localRepository.criar(local);
    }

    // Atualiza um local existente.
    async atualizar(id, dados) {
        const idValidado = this.validarId(id);

        await this.buscarPorId(idValidado);

        const local = await this.validarDados(dados, idValidado);

        await localRepository.atualizar(idValidado, local);

        return localRepository.buscarPorId(idValidado);
    }

    // Ativa ou desativa um local.
    async atualizarStatus(id, status) {
        const idValidado = this.validarId(id);

        await this.buscarPorId(idValidado);

        if (!["Ativo", "Inativo"].includes(status)) {
            throw this.criarErro("Status inválido.");
        }

        await localRepository.atualizarStatus(idValidado, status);

        return localRepository.buscarPorId(idValidado);
    }
}

export default new LocalService();