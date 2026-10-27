
import { Router } from "express";

// Importa o Controller responsável pelos equipamentos.
import equipamentoController from "../controllers/equipamentoController.js";

// ==========================================
// ROTAS - EQUIPAMENTOS
// ==========================================
// Define os endpoints HTTP responsáveis
// pelo gerenciamento dos equipamentos.

const router = Router();

// ==========================================
// GET /api/equipamentos
// ==========================================
// Lista todos os equipamentos cadastrados.
router.get("/", (req, res) =>
    equipamentoController.listarTodos(req, res)
);

// ==========================================
// GET /api/equipamentos/setor/:idSetor
// ==========================================
// Lista equipamentos de um setor específico.
// Deve ficar antes da rota genérica "/:id".
router.get("/setor/:idSetor", (req, res) =>
    equipamentoController.listarPorSetor(req, res)
);

// ==========================================
// GET /api/equipamentos/:id
// ==========================================
// Busca um equipamento pelo identificador.
router.get("/:id", (req, res) =>
    equipamentoController.buscarPorId(req, res)
);

// ==========================================
// POST /api/equipamentos
// ==========================================
// Cadastra um novo equipamento.
router.post("/", (req, res) =>
    equipamentoController.criar(req, res)
);

// ==========================================
// PUT /api/equipamentos/:id
// ==========================================
// Atualiza os dados de um equipamento.
router.put("/:id", (req, res) =>
    equipamentoController.atualizar(req, res)
);

// ==========================================
// PATCH /api/equipamentos/:id/status
// ==========================================
// Ativa ou inativa um equipamento.
router.patch("/:id/status", (req, res) =>
    equipamentoController.atualizarStatus(req, res)
);

// Exporta as rotas para o arquivo index.js.
export default router;
