# HANDOFF — Backend Watt Vision (Fases 4-6)

## Contexto

**Projeto:** TCC Watt Vision — monitoramento de energia industrial.
**Arquitetura:** ESP32 + PZEM-004T → MQTT → Backend Node.js/Express → MySQL → Frontend React.

**Stack:** Node.js (ES Modules), Express 5, mysql2/promise, mqtt, dotenv, cors.
**Padrão:** Repository → Service → Controller → Routes.
**Banco:** `db_watt_vision` (novo schema, 3FN).

## O que JÁ está pronto (Fases 1-3)

- **Fase 1:** `.env` com `DB_NAME=db_watt_vision`, `routes/index.js` com imports no topo.
- **Fase 2:** `localRepository`, `localService`, `setorRepository`, `setorService` adaptados ao novo schema (campos `codigo`, `endereco`, `responsavel`; sem `descricao`; status `Ativo`/`Inativo`).
- **Fase 3:** `medicaoRepository`, `medicaoService` — o `id_ponto_medicao` é resolvido a partir do `id_pzem` antes do INSERT.
- **Banco:** DDL, 12 views, 2 procedures (`sp_reconhecer_alerta`, `sp_resolver_alerta`), 1 trigger (`trg_atualizar_comunicacao_iot`), seed operacional.

**Endpoints funcionando:** `GET/POST/PUT/PATCH /api/locais`, `/api/setores`, `/api/medicoes/*`.

## O que FALTA (Fases 4-6)

### Fase 4 — Motor de Alertas

**Por que existe:** a antiga trigger `trg_gerar_alertas_medicao` foi **removida**. Regras agora vivem em `tbl_limite` (severidade: `meta`, `informativo`, `atencao`, `critico`). O backend compara cada medição com os limites ativos do escopo.

**Arquivos a criar:**

#### `src/database/monitoramento/alertaRepository.js`

```js
// Importa a conexão com o banco de dados MySQL.
import database from "../../config/database.js";

// ==========================================
// REPOSITORY - ALERTAS
// ==========================================

class AlertaRepository {

    async buscarLimitesAtivosParaPonto(ponto) {
        const [limites] = await database.query(
            `
            SELECT id, grandeza, operador, valor, severidade,
                   periodo_inicial, periodo_final
            FROM tbl_limite
            WHERE ativa = 1
              AND (
                    (id_local IS NOT NULL       AND id_local = ?)
                 OR (id_setor IS NOT NULL       AND id_setor = ?)
                 OR (id_equipamento IS NOT NULL AND id_equipamento = ?)
              )
            `,
            [ponto.id_local, ponto.id_setor, ponto.id_equipamento]
        );
        return limites;
    }

    async existeAlertaAtivo(id_limite, id_ponto_medicao) {
        const [rows] = await database.query(
            `
            SELECT a.id
            FROM tbl_alerta a
            INNER JOIN tbl_medicao m ON m.id = a.id_medicao
            INNER JOIN tbl_pzem p    ON p.id = m.id_pzem
            WHERE a.id_limite = ?
              AND a.status = 'ativo'
              AND p.id_ponto_medicao = ?
            LIMIT 1
            `,
            [id_limite, id_ponto_medicao]
        );
        return rows[0] ?? null;
    }

    async buscarIdTipoAlertaPorNome(nome) {
        const [rows] = await database.query(
            "SELECT id FROM tbl_tipo_alerta WHERE nome = ? LIMIT 1",
            [nome]
        );
        return rows[0]?.id ?? null;
    }

    async criar(alerta) {
        const [resultado] = await database.query(
            `
            INSERT INTO tbl_alerta
                (id_tipo_alerta, id_limite, id_medicao, valor_detectado,
                 valor_limite, severidade, mensagem, data_hora, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'ativo')
            `,
            [
                alerta.id_tipo_alerta, alerta.id_limite,
                alerta.id_medicao, alerta.valor_detectado,
                alerta.valor_limite, alerta.severidade, alerta.mensagem
            ]
        );
        return resultado.insertId;
    }

    async listarAtivos() {
        const [rows] = await database.query(
            "SELECT * FROM vw_alarmes_ativos ORDER BY data_hora DESC"
        );
        return rows;
    }
}

export default new AlertaRepository();