// Importa o mysql2 utilizando suporte a Promises.
// Isso permite utilizar async/await nas operações com o banco.
import mysql from "mysql2/promise";

// Importa o dotenv para acessar as variáveis do arquivo .env.
import dotenv from "dotenv";

// Carrega as variáveis de ambiente.
dotenv.config();


// ==============================
// CONEXÃO COM O MYSQL
// ==============================

// Cria um pool de conexões.
//
// Diferente de abrir uma nova conexão para cada operação,
// o pool mantém conexões disponíveis para serem reutilizadas.
// Isso melhora o desempenho e a organização do Backend.
const database = mysql.createPool({

    // Endereço do servidor MySQL.
    host: process.env.DB_HOST,

    // Porta utilizada pelo MySQL.
    port: process.env.DB_PORT,

    // Usuário do banco.
    user: process.env.DB_USER,

    // Senha do banco.
    password: process.env.DB_PASSWORD,

    // Banco utilizado pelo Watt Vision.
    database: process.env.DB_NAME,

    // Aguarda uma conexão ficar disponível caso todas
    // estejam sendo utilizadas.
    waitForConnections: true,

    // Quantidade máxima de conexões simultâneas no pool.
    connectionLimit: 10,

    // Quantidade máxima de requisições aguardando conexão.
    // 0 significa sem limite definido.
    queueLimit: 0
});


// Exporta o pool para que os Repositories possam
// utilizar a conexão com o MySQL.
export default database;