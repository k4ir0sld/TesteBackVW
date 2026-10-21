// Importa o Router do Express.
// O Router permite organizar as rotas da API
// em arquivos separados.
import { Router } from "express";

// Importa as rotas relacionadas às medições.
import medicaoRoutes from "./medicaoRoutes.js";

// Importa as rotas do módulo de Locais.
import localRoutes from "./localRoutes.js";

// Importa as rotas do módulo de Setores.
import setorRoutes from "./setorRoutes.js";


// ==========================================
// ROTAS PRINCIPAIS DA API
// ==========================================

// Cria o roteador principal da aplicação.
const router = Router();

// Todas as requisições que começarem com
// /medicoes serão encaminhadas para
// o arquivo medicaoRoutes.js.
router.use("/medicoes", medicaoRoutes);

// Todas as requisições que começarem com
// /locais serão encaminhadas para
// o arquivo localRoutes.js.
router.use("/locais", localRoutes);

// Todas as requisições que começarem com
// /setores serão encaminhadas para
// o arquivo setorRoutes.js.
router.use("/setores", setorRoutes);


// ==========================================
// EXPORTAÇÃO
// ==========================================

// Exporta o router como exportação padrão.
//
// Isso permite que o app.js utilize:
//
// import routes from "./routes/index.js";
export default router;