// Importa a conexão com o banco de dados MySQL.
import database from "../../config/database.js";


// ==========================================
// REPOSITORY - MEDIÇÃO
// ==========================================
// Responsável pelas operações SQL da
// tabela tbl_medicao.
//
// Alterações para o novo schema:
// - id_ponto_medicao é obrigatório em
//   tbl_medicao (denormalizado a partir
//   do PZEM).
// - Método buscarPontoMedicaoDoPzem
//   resolve esse vínculo antes do INSERT.

class MedicaoRepository {

    // ======================================
    // LISTAR TODAS AS MEDIÇÕES
    // ======================================

    async listarTodas() {

        const [medicoes] = await database.query(`
            SELECT *
            FROM tbl_medicao
            ORDER BY data_hora DESC
        `);

        return medicoes;
    }


    // ======================================
    // VERIFICAR SE O PZEM EXISTE
    // ======================================

    async buscarPzemPorId(id_pzem) {

        const [resultado] = await database.query(
            `
            SELECT id, id_ponto_medicao
            FROM tbl_pzem
            WHERE id = ?
            `,
            [id_pzem]
        );

        if (resultado.length === 0) {
            return null;
        }

        return resultado[0];
    }


    // ======================================
    // RESOLVER PONTO DE MEDIÇÃO DO PZEM
    // ======================================
    // O novo schema exige id_ponto_medicao em
    // tbl_medicao. Este método busca esse valor
    // a partir do PZEM que enviou a leitura.

    async buscarPontoMedicaoDoPzem(id_pzem) {

        const [rows] = await database.query(
            "SELECT id_ponto_medicao FROM tbl_pzem WHERE id = ?",
            [id_pzem]
        );

        return rows[0] ?? null;
    }


    // ==========================================
    // ÚLTIMAS MEDIÇÕES POR PONTO DE MEDIÇÃO
    // ==========================================
    // Retorna a leitura mais recente de cada PZEM
    // associado ao ponto de medição informado.

    async buscarUltimasPorPonto(idPonto) {

        const [medicoes] = await database.query(
            `
            SELECT
                m.id,
                m.id_pzem,
                m.data_hora,
                m.tensao,
                m.corrente,
                m.potencia_ativa,
                m.energia_acumulada,
                m.frequencia,
                m.fator_potencia
            FROM tbl_medicao m
            INNER JOIN tbl_pzem p
                ON p.id = m.id_pzem
            WHERE p.id_ponto_medicao = ?
            AND m.id = (
                SELECT m2.id
                FROM tbl_medicao m2
                WHERE m2.id_pzem = m.id_pzem
                ORDER BY m2.data_hora DESC, m2.id DESC
                LIMIT 1
            )
            ORDER BY m.id_pzem
            `,
            [idPonto]
        );

        return medicoes;
    }


    // ==========================================
    // CONSULTAR MEDIÇÕES PARA CÁLCULO DE CONSUMO
    // ==========================================
    // Busca as leituras de um PZEM dentro de um
    // período, mantendo a ordem cronológica.

    async buscarMedicoesParaConsumo(idPzem, inicio, fim) {

        const [medicoes] = await database.query(
            `
            SELECT
                id,
                id_pzem,
                data_hora,
                energia_acumulada
            FROM tbl_medicao
            WHERE id_pzem = ?
              AND data_hora >= ?
              AND data_hora < DATE_ADD(?, INTERVAL 1 DAY)
            ORDER BY data_hora ASC, id ASC
            `,
            [idPzem, inicio, fim]
        );

        return medicoes;
    }


    // ==========================================
    // CONSULTAR TARIFA VIGENTE DO PZEM
    // ==========================================
    // Alteração para o novo schema:
    // - A empresa não está mais apenas em tbl_local.
    // - O ponto pode monitorar Local, Setor OU Equipamento.
    // - Utilizamos COALESCE para resolver o caminho.

    async buscarTarifaParaPeriodo(idPzem, inicio, fim) {

        const [tarifas] = await database.query(
            `
            SELECT
                t.id,
                t.descricao,
                t.valor_kwh,
                t.data_inicial,
                t.data_final
            FROM tbl_tarifa t
            WHERE t.id_empresa = (
                SELECT l.id_empresa
                FROM tbl_pzem p
                INNER JOIN tbl_ponto_medicao pm
                    ON pm.id = p.id_ponto_medicao
                LEFT JOIN tbl_equipamento e
                    ON e.id = pm.id_equipamento
                LEFT JOIN tbl_setor s
                    ON s.id = COALESCE(pm.id_setor, e.id_setor)
                LEFT JOIN tbl_local l
                    ON l.id = COALESCE(pm.id_local, s.id_local)
                WHERE p.id = ?
            )
            AND t.status = 'Ativa'
            AND t.data_inicial <= ?
            AND (
                t.data_final IS NULL
                OR t.data_final >= ?
            )
            ORDER BY t.data_inicial DESC, t.id DESC
            `,
            [idPzem, inicio, fim]
        );

        return tarifas;
    }


    // ======================================
    // CRIAR UMA NOVA MEDIÇÃO
    // ======================================
    // O id_ponto_medicao é obrigatório
    // e vem do Service (que resolve a partir
    // do id_pzem).

    async criar(medicao) {

        const {
            id_pzem,
            id_ponto_medicao,
            data_hora,
            tensao,
            corrente,
            potencia_ativa,
            energia_acumulada,
            frequencia,
            fator_potencia
        } = medicao;

        const [resultado] = await database.query(
            `
            INSERT INTO tbl_medicao
            (
                id_pzem,
                id_ponto_medicao,
                data_hora,
                tensao,
                corrente,
                potencia_ativa,
                energia_acumulada,
                frequencia,
                fator_potencia
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                id_pzem,
                id_ponto_medicao,
                data_hora,
                tensao,
                corrente,
                potencia_ativa,
                energia_acumulada,
                frequencia,
                fator_potencia
            ]
        );

        return resultado.insertId;
    }


    // ======================================
    // BUSCAR A ÚLTIMA MEDIÇÃO NO MYSQL
    // ======================================

    async buscarUltima() {

        const [resultado] = await database.query(`
            SELECT
                id,
                id_pzem,
                data_hora,
                tensao,
                corrente,
                potencia_ativa,
                energia_acumulada,
                frequencia,
                fator_potencia
            FROM tbl_medicao
            ORDER BY data_hora DESC, id DESC
            LIMIT 1
        `);

        if (resultado.length === 0) {
            return null;
        }

        return resultado[0];
    }


    // ==========================================
    // CONSULTAR HISTÓRICO POR PZEM E PERÍODO
    // ==========================================

    async obterSerieTemporal(idPzem, horas) {

        const [medicoes] = await database.query(
            `
            SELECT
                id,
                id_pzem,
                data_hora,
                tensao,
                corrente,
                potencia_ativa,
                energia_acumulada,
                frequencia,
                fator_potencia
            FROM tbl_medicao
            WHERE id_pzem = ?
            AND data_hora >= DATE_SUB(
                NOW(),
                INTERVAL ? HOUR
            )
            ORDER BY data_hora ASC, id ASC
            LIMIT 10000
            `,
            [idPzem, horas]
        );

        return medicoes;
    }
}


// Exporta uma instância do Repository.
export default new MedicaoRepository();