import database from "../../config/database.js";

// ==========================================
// REPOSITORY - EQUIPAMENTOS
// ==========================================
// Responsável pelas consultas SQL da tabela
// tbl_equipamento, conforme o novo banco
// de dados do Watt Vision.
//
// Pontos 2 e 1 (extensão) aplicados:
// - Campo "descricao" incluído em SELECT,
//   INSERT e UPDATE.
// - Subquery de "ultima_medicao" para o
//   Service calcular status_conectividade.

class EquipamentoRepository {

    // ======================================
    // LISTAR TODOS OS EQUIPAMENTOS
    // ======================================
    async listarTodos() {
        const [equipamentos] = await database.query(`
            SELECT
                e.*,
                s.nome AS nome_setor,
                l.nome AS nome_local,
                ult.ultima_medicao
            FROM tbl_equipamento e
            INNER JOIN tbl_setor s
                ON s.id = e.id_setor
            INNER JOIN tbl_local l
                ON l.id = s.id_local
            LEFT JOIN (
                SELECT
                    pm.id_equipamento,
                    MAX(m.data_hora) AS ultima_medicao
                FROM tbl_ponto_medicao pm
                INNER JOIN tbl_pzem p
                    ON p.id_ponto_medicao = pm.id
                INNER JOIN tbl_medicao m
                    ON m.id_pzem = p.id
                WHERE pm.id_equipamento IS NOT NULL
                GROUP BY pm.id_equipamento
            ) ult ON ult.id_equipamento = e.id
            ORDER BY e.nome ASC
        `);

        return equipamentos;
    }

    // ======================================
    // BUSCAR EQUIPAMENTO POR ID
    // ======================================
    async buscarPorId(id) {
        const [equipamentos] = await database.query(
            `
            SELECT
                e.*,
                s.nome AS nome_setor,
                l.nome AS nome_local,
                ult.ultima_medicao
            FROM tbl_equipamento e
            INNER JOIN tbl_setor s
                ON s.id = e.id_setor
            INNER JOIN tbl_local l
                ON l.id = s.id_local
            LEFT JOIN (
                SELECT
                    pm.id_equipamento,
                    MAX(m.data_hora) AS ultima_medicao
                FROM tbl_ponto_medicao pm
                INNER JOIN tbl_pzem p
                    ON p.id_ponto_medicao = pm.id
                INNER JOIN tbl_medicao m
                    ON m.id_pzem = p.id
                WHERE pm.id_equipamento IS NOT NULL
                GROUP BY pm.id_equipamento
            ) ult ON ult.id_equipamento = e.id
            WHERE e.id = ?
            `,
            [id]
        );

        return equipamentos[0] ?? null;
    }

    // ======================================
    // LISTAR EQUIPAMENTOS POR SETOR
    // ======================================
    async listarPorSetor(idSetor) {
        const [equipamentos] = await database.query(
            `
            SELECT
                e.*,
                ult.ultima_medicao
            FROM tbl_equipamento e
            LEFT JOIN (
                SELECT
                    pm.id_equipamento,
                    MAX(m.data_hora) AS ultima_medicao
                FROM tbl_ponto_medicao pm
                INNER JOIN tbl_pzem p
                    ON p.id_ponto_medicao = pm.id
                INNER JOIN tbl_medicao m
                    ON m.id_pzem = p.id
                WHERE pm.id_equipamento IS NOT NULL
                GROUP BY pm.id_equipamento
            ) ult ON ult.id_equipamento = e.id
            WHERE e.id_setor = ?
            ORDER BY e.nome ASC
            `,
            [idSetor]
        );

        return equipamentos;
    }

    // ======================================
    // VERIFICAR SE O SETOR EXISTE
    // ======================================
    async buscarSetorPorId(idSetor) {
        const [setores] = await database.query(
            `
            SELECT
                s.id,
                s.nome,
                s.status,
                l.status AS status_local,
                emp.status AS status_empresa
            FROM tbl_setor s
            INNER JOIN tbl_local l
                ON l.id = s.id_local
            INNER JOIN tbl_empresa emp
                ON emp.id = l.id_empresa
            WHERE s.id = ?
            `,
            [idSetor]
        );

        return setores[0] ?? null;
    }

    // ======================================
    // VERIFICAR CÓDIGO DUPLICADO
    // ======================================
    async buscarPorCodigo(codigo) {
        const [equipamentos] = await database.query(
            `
            SELECT id
            FROM tbl_equipamento
            WHERE codigo = ?
            `,
            [codigo]
        );

        return equipamentos[0] ?? null;
    }

    // ======================================
    // CADASTRAR EQUIPAMENTO
    // ======================================
    async criar(dados) {
        const [resultado] = await database.query(
            `
            INSERT INTO tbl_equipamento (
                id_setor,
                codigo,
                nome,
                tipo_equipamento,
                fabricante,
                modelo,
                numero_serie,
                descricao,
                potencia_nominal,
                tensao_nominal,
                data_instalacao,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                dados.id_setor,
                dados.codigo,
                dados.nome,
                dados.tipo_equipamento,
                dados.fabricante,
                dados.modelo,
                dados.numero_serie,
                dados.descricao,
                dados.potencia_nominal,
                dados.tensao_nominal,
                dados.data_instalacao,
                dados.status
            ]
        );

        return resultado.insertId;
    }

    // ======================================
    // ATUALIZAR EQUIPAMENTO
    // ======================================
    async atualizar(id, dados) {
        const [resultado] = await database.query(
            `
            UPDATE tbl_equipamento
            SET
                id_setor = ?,
                codigo = ?,
                nome = ?,
                tipo_equipamento = ?,
                fabricante = ?,
                modelo = ?,
                numero_serie = ?,
                descricao = ?,
                potencia_nominal = ?,
                tensao_nominal = ?,
                data_instalacao = ?,
                status = ?
            WHERE id = ?
            `,
            [
                dados.id_setor,
                dados.codigo,
                dados.nome,
                dados.tipo_equipamento,
                dados.fabricante,
                dados.modelo,
                dados.numero_serie,
                dados.descricao,
                dados.potencia_nominal,
                dados.tensao_nominal,
                dados.data_instalacao,
                dados.status,
                id
            ]
        );

        return resultado.affectedRows > 0;
    }

    // ======================================
    // ATIVAR OU INATIVAR EQUIPAMENTO
    // ======================================
    async atualizarStatus(id, status) {
        const [resultado] = await database.query(
            `
            UPDATE tbl_equipamento
            SET status = ?
            WHERE id = ?
            `,
            [status, id]
        );

        return resultado.affectedRows > 0;
    }

    // ======================================
    // BUSCAR CONFIGURAÇÃO DE COMUNICAÇÃO
    // ======================================
    // Retorna todos os thresholds usados para
    // classificar a conectividade dos equipamentos.
    //
    // Ponto 4: incluído tempo_reconexao_estavel_minutos
    // que será usado pela Fase 5 (heartbeat) para
    // evitar alarmes de "flapping" (dispositivo que
    // reconecta e cai repetidamente).
    async buscarConfigComunicacao() {
        const [configs] = await database.query(
            `
            SELECT
                tempo_offline_minutos,
                tempo_instavel_minutos,
                tempo_reconexao_estavel_minutos
            FROM tbl_config_comunicacao
            WHERE id = 1
            `
        );

        return configs[0] ?? {
            tempo_offline_minutos: 5,
            tempo_instavel_minutos: 2,
            tempo_reconexao_estavel_minutos: 3
        };
    }
}

export default new EquipamentoRepository();