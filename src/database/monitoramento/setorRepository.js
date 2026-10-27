// Importa a conexão com o banco de dados MySQL.
import database from "../../config/database.js";

// ==========================================
// REPOSITORY - SETORES
// ==========================================
// Responsável pelas operações SQL na
// tabela tbl_setor.

class SetorRepository {

    async listarTodos() {
        const [setores] = await database.query(`
            SELECT
                s.id,
                s.id_local,
                s.codigo,
                s.nome,
                s.responsavel,
                s.descricao,
                s.status,
                l.nome AS nome_local
            FROM tbl_setor s
            INNER JOIN tbl_local l
                ON l.id = s.id_local
            ORDER BY s.nome ASC
        `);

        return setores;
    }

    async buscarPorId(id) {
        const [setores] = await database.query(
            `
            SELECT
                s.id,
                s.id_local,
                s.codigo,
                s.nome,
                s.responsavel,
                s.descricao,
                s.status,
                l.nome AS nome_local
            FROM tbl_setor s
            INNER JOIN tbl_local l
                ON l.id = s.id_local
            WHERE s.id = ?
            `,
            [id]
        );

        return setores[0] ?? null;
    }

    async listarPorLocal(idLocal) {
        const [setores] = await database.query(
            `
            SELECT id, id_local, codigo, nome, responsavel, descricao, status
            FROM tbl_setor
            WHERE id_local = ?
            ORDER BY nome ASC
            `,
            [idLocal]
        );

        return setores;
    }

    async buscarLocalPorId(idLocal) {
        const [locais] = await database.query(
            `
            SELECT id, nome, status
            FROM tbl_local
            WHERE id = ?
            `,
            [idLocal]
        );

        return locais[0] ?? null;
    }

    async buscarPorCodigo(codigo) {
        const [setores] = await database.query(
            "SELECT id FROM tbl_setor WHERE codigo = ?",
            [codigo]
        );

        return setores[0] ?? null;
    }

    async criar(dados) {
        const [resultado] = await database.query(
            `
            INSERT INTO tbl_setor
                (id_local, codigo, nome, responsavel, descricao, status)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                dados.id_local,
                dados.codigo,
                dados.nome,
                dados.responsavel,
                dados.descricao,
                dados.status
            ]
        );

        return resultado.insertId;
    }

    async atualizar(id, dados) {
        const [resultado] = await database.query(
            `
            UPDATE tbl_setor
            SET id_local = ?,
                codigo = ?,
                nome = ?,
                responsavel = ?,
                descricao = ?,
                status = ?
            WHERE id = ?
            `,
            [
                dados.id_local,
                dados.codigo,
                dados.nome,
                dados.responsavel,
                dados.descricao,
                dados.status,
                id
            ]
        );

        return resultado.affectedRows > 0;
    }

    async atualizarStatus(id, status) {
        const [resultado] = await database.query(
            `
            UPDATE tbl_setor
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );

        return resultado.affectedRows > 0;
    }
}

export default new SetorRepository();