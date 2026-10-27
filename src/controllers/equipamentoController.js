
import equipamentoService from "../services/equipamentoService.js";

// ==========================================
// CONTROLLER - EQUIPAMENTOS
// ==========================================
// Recebe as requisições HTTP, chama o Service
// e devolve as respostas em formato JSON.

class EquipamentoController {

    // ======================================
    // TRATAMENTO PADRONIZADO DE ERROS
    // ======================================
    tratarErro(erro, res) {
        console.error("[EQUIPAMENTO]", erro);

        return res.status(erro.status || 500).json({
            sucesso: false,
            mensagem: erro.status
                ? erro.message
                : "Erro interno ao processar o equipamento."
        });
    }

    // ======================================
    // GET /api/equipamentos
    // ======================================
    async listarTodos(req, res) {
        try {
            // Solicita todos os equipamentos.
            const equipamentos =
                await equipamentoService.listarTodos();

            return res.status(200).json({
                sucesso: true,
                quantidade: equipamentos.length,
                dados: equipamentos
            });

        } catch (erro) {
            return this.tratarErro(erro, res);
        }
    }

    // ======================================
    // GET /api/equipamentos/:id
    // ======================================
    async buscarPorId(req, res) {
        try {
            // Consulta um equipamento pelo ID.
            const equipamento =
                await equipamentoService.buscarPorId(
                    req.params.id
                );

            return res.status(200).json({
                sucesso: true,
                dados: equipamento
            });

        } catch (erro) {
            return this.tratarErro(erro, res);
        }
    }

    // ======================================
    // GET /api/equipamentos/setor/:idSetor
    // ======================================
    async listarPorSetor(req, res) {
        try {
            // Consulta equipamentos de um setor.
            const equipamentos =
                await equipamentoService.listarPorSetor(
                    req.params.idSetor
                );

            return res.status(200).json({
                sucesso: true,
                quantidade: equipamentos.length,
                dados: equipamentos
            });

        } catch (erro) {
            return this.tratarErro(erro, res);
        }
    }

    // ======================================
    // POST /api/equipamentos
    // ======================================
    async criar(req, res) {
        try {
            // Encaminha o JSON para validação.
            const id = await equipamentoService.criar(
                req.body
            );

            return res.status(201).json({
                sucesso: true,
                mensagem: "Equipamento cadastrado com sucesso.",
                id_equipamento: id
            });

        } catch (erro) {
            return this.tratarErro(erro, res);
        }
    }

    // ======================================
    // PUT /api/equipamentos/:id
    // ======================================
    async atualizar(req, res) {
        try {
            // Atualiza os dados do equipamento.
            const equipamento =
                await equipamentoService.atualizar(
                    req.params.id,
                    req.body
                );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Equipamento atualizado com sucesso.",
                dados: equipamento
            });

        } catch (erro) {
            return this.tratarErro(erro, res);
        }
    }

    // ======================================
    // PATCH /api/equipamentos/:id/status
    // ======================================
    async atualizarStatus(req, res) {
        try {
            // Altera somente o status.
            const equipamento =
                await equipamentoService.atualizarStatus(
                    req.params.id,
                    req.body?.status
                );

            return res.status(200).json({
                sucesso: true,
                mensagem: "Status atualizado com sucesso.",
                dados: equipamento
            });

        } catch (erro) {
            return this.tratarErro(erro, res);
        }
    }
}

// Exporta uma instância do Controller.
export default new EquipamentoController();
