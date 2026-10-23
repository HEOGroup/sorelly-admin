// Estado dos módulos: cada módulo do sistema (rh, cf, ce...) guarda o seu conteúdo todo como um JSON na tabela sorelly.estado_modulo.
// É o ATALHO combinado com o Leonardo: todo mundo passa a ver os mesmos dados já, e depois cada módulo é desmembrado nas tabelas finais (as 168 do schema sorelly), um por vez.
// O conteúdo de um módulo é um objeto com chaves de primeiro nível (ex.: rh = {config, colaboradores, presenca...}). O PUT manda só as chaves que mudaram e o servidor junta com o que já existe:
// duas pessoas mexendo em chaves diferentes não se atrapalham; na mesma chave vale a última gravação.
// Regras: só abre o módulo quem tem o setor dele (permissoes.js); a PRIMEIRA gravação de um módulo (carga inicial) só a Diretoria faz, para um navegador de funcionário com dados de demonstração nunca subir por cima.
import { consulta } from "./db.js";
import { podeModulo } from "./permissoes.js";

const MODULO = { type: "string", pattern: "^[a-z][a-zA-Z0-9_]{0,29}$" };

export async function rotasEstado(app) {
  const auth = { onRequest: [app.autenticar] };
  const nega = (reply) => reply.code(403).send({ erro: "Você não tem acesso a este módulo." });

  // ?desde=<versão que o navegador já tem>: se não mudou, responde só {igual:true} (poupa banda: a consulta roda a cada 20 s)
  app.get("/estado/:modulo", { ...auth, schema: { params: { type: "object", properties: { modulo: MODULO } }, querystring: { type: "object", properties: { desde: { type: "integer" } } } } }, async (req, reply) => {
    if (!podeModulo(req.user, req.params.modulo)) return nega(reply);
    const v = await consulta("select versao from sorelly.estado_modulo where modulo = $1", [req.params.modulo]);
    const versao = v.rows[0] ? v.rows[0].versao : 0;
    if (req.query.desde !== undefined && versao > 0 && versao === req.query.desde) return { modulo: req.params.modulo, versao, igual: true };
    const r = await consulta("select conteudo, versao, atualizado_em from sorelly.estado_modulo where modulo = $1", [req.params.modulo]);
    const l = r.rows[0];
    return { modulo: req.params.modulo, versao: l ? l.versao : 0, conteudo: l ? l.conteudo : {}, atualizadoEm: l ? l.atualizado_em : null };
  });

  app.put("/estado/:modulo", {
    ...auth, bodyLimit: 20 * 1024 * 1024,
    schema: { params: { type: "object", properties: { modulo: MODULO } }, body: { type: "object", required: ["chaves"], properties: { chaves: { type: "object", minProperties: 1 } } } }
  }, async (req, reply) => {
    if (!podeModulo(req.user, req.params.modulo)) return nega(reply);
    if (req.user.perfil !== "ADMIN") {
      const ja = await consulta("select 1 from sorelly.estado_modulo where modulo = $1", [req.params.modulo]);
      if (!ja.rowCount) return reply.code(403).send({ erro: "Este módulo ainda não recebeu a carga inicial. Peça à Diretoria." });
    }
    const r = await consulta(
      `insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ($1, $2::jsonb, 1, $3)
       on conflict (modulo) do update set conteudo = sorelly.estado_modulo.conteudo || excluded.conteudo, versao = sorelly.estado_modulo.versao + 1, atualizado_por = excluded.atualizado_por, atualizado_em = now()
       returning versao`,
      [req.params.modulo, JSON.stringify(req.body.chaves), req.user.id]);
    return { ok: true, versao: r.rows[0].versao };
  });
}
