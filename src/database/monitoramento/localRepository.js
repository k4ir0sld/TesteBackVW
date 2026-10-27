// Importa a conexão com o banco de dados MySQL.
import database from "../../config/database.js";

// ==========================================
// REPOSITORY - LOCAIS
// ==========================================
// Responsável pelas consultas SQL da tabela
// tbl_local, utilizando parâmetros seguros.

class LocalRepository {

    // Lista os locais cadastrados.
    async listarTodos() {
        const [locais] = await database.query(`
            SELECT id, id_empresa, codigo, nome, endereco, responsavel,
                   descricao, status
            FROM tbl_local
            ORDER BY nome ASC
        `);

        return locais;
    }

    // Busca um local pelo identificador.
    async buscarPorId(id) {
        const [locais] = await database.query(
            `
            SELECT id, id_empresa, codigo, nome, endereco, responsavel,
                   descricao, status
            FROM tbl_local
            WHERE id = ?
            `,
            [id]
        );

        return locais[0] ?? null;
    }

    // Verifica se a empresa informada existe.
    async buscarEmpresaPorId(idEmpresa) {
        const [empresas] = await database.query(
            "SELECT id FROM tbl_empresa WHERE id = ?",
            [idEmpresa]
        );

        return empresas[0] ?? null;
    }

    // Verifica se já existe um local com o código informado.
    async buscarPorCodigo(codigo) {
        const [locais] = await database.query(
            "SELECT id FROM tbl_local WHERE codigo = ?",
            [codigo]
        );

        return locais[0] ?? null;
    }

    // Insere um novo local.
    async criar(dados) {
        const [resultado] = await database.query(
            `
            INSERT INTO tbl_local
                (id_empresa, codigo, nome, endereco, responsavel, descricao, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                dados.id_empresa,
                dados.codigo,
                dados.nome,
                dados.endereco,
                dados.responsavel,
                dados.descricao,
                dados.status
            ]
        );

        return resultado.insertId;
    }

    // Atualiza os dados de um local existente.
    async atualizar(id, dados) {
        const [resultado] = await database.query(
            `
            UPDATE tbl_local
            SET id_empresa = ?,
                codigo = ?,
                nome = ?,
                endereco = ?,
                responsavel = ?,
                descricao = ?,
                status = ?
            WHERE id = ?
            `,
            [
                dados.id_empresa,
                dados.codigo,
                dados.nome,
                dados.endereco,
                dados.responsavel,
                dados.descricao,
                dados.status,
                id
            ]
        );

        return resultado.affectedRows > 0;
    }

    // Atualiza somente o status do local.
    async atualizarStatus(id, status) {
        const [resultado] = await database.query(
            `
            UPDATE tbl_local
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );

        return resultado.affectedRows > 0;
    }
}

export default new LocalRepository();