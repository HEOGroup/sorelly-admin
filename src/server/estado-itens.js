// Módulos "por item" (05/11/2026, integração com o app real da representante).
// Problema do atalho estado_modulo: o módulo inteiro é UM JSON e o PUT junta só as chaves de 1º nível (jsonb ||). Uma lista dentro de uma chave
// é trocada inteira e vale a última gravação. Com o app da representante gravando pelo servidor e a equipe gravando pelo navegador, isso apagaria dados.
// Solução: os módulos de ITENS_MODULOS (rpo = operação: listagens e kits do app; rpf = financeiro: acertos, entregas, reposições) guardam UMA LINHA
// POR CHAVE na tabela sorelly.estado_item. Cada chave tem um DONO pelo prefixo: o app (gravado só pelas rotas de serviço, server-to-server) ou o admin
// (gravado pelo navegador, via PUT /api/estado). O navegador vê o módulo do mesmo jeito de sempre ({chave: valor}); a tela junta as partes.
// A versão do módulo é a maior "seq" das linhas: o GET ?desde=<versão> devolve SÓ as chaves que mudaram depois (leitura incremental: assinatura e foto
// descem uma vez por navegador). Apagar = gravar a lápide {_apagado:true} (apagar a linha não chegaria aos navegadores).
import { consulta, pool } from "./db.js";
import { donoDaChave, ITENS_MODULOS } from "../apps/montagem/domain/app-rep.js";

export { ITENS_MODULOS, donoDaChave };
export const ehModuloItens = (m) => ITENS_MODULOS.includes(m);

let pronta = null;
// cria a tabela na primeira vez (o mesmo SQL de scripts/migrar-app-representante.mjs e de banco/schema.sql)
export function garantirTabela() {
  if (!pronta) pronta = (async () => {
    await consulta("CREATE SEQUENCE IF NOT EXISTS sorelly.estado_item_seq");
    await consulta(`CREATE TABLE IF NOT EXISTS sorelly.estado_item (
      modulo text NOT NULL,
      chave text NOT NULL,
      valor jsonb NOT NULL,
      dono text NOT NULL,
      seq bigint NOT NULL DEFAULT nextval('sorelly.estado_item_seq'),
      atualizado_por text,
      atualizado_em timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (modulo, chave))`);
    await consulta("CREATE INDEX IF NOT EXISTS estado_item_seq_idx ON sorelly.estado_item (modulo, seq)");
  })().catch((e) => { pronta = null; throw e; });
  return pronta;
}

// versão atual do módulo (0 = vazio)
export async function versaoItens(modulo) {
  await garantirTabela();
  const r = await consulta("select coalesce(max(seq), 0)::bigint as v from sorelly.estado_item where modulo = $1", [modulo]);
  return Number(r.rows[0].v);
}

// {versao, conteudo:{chave: valor}} — com desde, só o que mudou depois dessa versão.
// Duas gravações quase juntas podem terminar fora da ordem da sequência (uma seq menor aparece depois): por isso a leitura parcial devolve também
// o que mudou no último minuto. Mandar de novo não faz mal: o navegador compara pelo conteúdo e só aplica o que é diferente.
export async function lerItens(modulo, desde) {
  await garantirTabela();
  const r = desde != null && desde > 0
    ? await consulta("select chave, valor, seq from sorelly.estado_item where modulo = $1 and (seq > $2 or atualizado_em > now() - interval '1 minute')", [modulo, desde])
    : await consulta("select chave, valor, seq from sorelly.estado_item where modulo = $1", [modulo]);
  const conteudo = {}; let versao = desde || 0;
  r.rows.forEach((l) => { conteudo[l.chave] = l.valor; versao = Math.max(versao, Number(l.seq)); });
  if (!r.rows.length) versao = Math.max(versao, await versaoItens(modulo));
  return { versao, conteudo, vazio: !r.rows.length };
}

// lê só algumas chaves (ou as de um prefixo) — usado pelas rotas de serviço
export async function lerChaves(modulo, chaves) {
  await garantirTabela();
  if (!chaves.length) return {};
  const r = await consulta("select chave, valor from sorelly.estado_item where modulo = $1 and chave = any($2::text[])", [modulo, chaves]);
  const o = {}; r.rows.forEach((l) => { o[l.chave] = l.valor; }); return o;
}
export async function lerPrefixos(modulo, prefixos) {
  await garantirTabela();
  const r = await consulta("select chave, valor from sorelly.estado_item where modulo = $1 and split_part(chave, '_', 1) || '_' = any($2::text[])", [modulo, prefixos]);
  const o = {}; r.rows.forEach((l) => { o[l.chave] = l.valor; }); return o;
}

// grava várias chaves de uma vez (upsert). dono = "app" ou "admin". Devolve a nova versão.
// cli = cliente de transação (opcional). Sem cli, usa o pool.
export async function gravarItens(modulo, chaves, dono, por, cli) {
  await garantirTabela();
  const q = cli ? (sql, p) => cli.query(sql, p) : consulta;
  let versao = 0;
  for (const [chave, valor] of Object.entries(chaves)) {
    const r = await q(
      `insert into sorelly.estado_item (modulo, chave, valor, dono, atualizado_por) values ($1, $2, $3::jsonb, $4, $5)
       on conflict (modulo, chave) do update set valor = excluded.valor, dono = excluded.dono, seq = nextval('sorelly.estado_item_seq'),
         atualizado_por = excluded.atualizado_por, atualizado_em = now()
       returning seq`,
      [modulo, chave, JSON.stringify(valor === undefined ? null : valor), dono, String(por || "")]);
    versao = Math.max(versao, Number(r.rows[0].seq));
  }
  return versao;
}

// transação com trava do módulo (regras que dependem do estado atual: listagem cheia, duplicada, kit já entregue...).
// pg_advisory_xact_lock serializa quem mexe no mesmo módulo; a trava sai sozinha no fim da transação.
export async function emTransacao(modulo, fn) {
  await garantirTabela();
  const cli = await pool().connect();
  try {
    await cli.query("begin");
    await cli.query("select pg_advisory_xact_lock(hashtext($1))", ["estado_item:" + modulo]);
    const r = await fn(cli);
    await cli.query("commit");
    return r;
  } catch (e) {
    await cli.query("rollback").catch(() => {});
    throw e;
  } finally {
    cli.release();
  }
}

// dentro da transação: lê chaves pelo prefixo
export async function lerPrefixosCli(cli, modulo, prefixos) {
  const r = await cli.query("select chave, valor from sorelly.estado_item where modulo = $1 and split_part(chave, '_', 1) || '_' = any($2::text[])", [modulo, prefixos]);
  const o = {}; r.rows.forEach((l) => { o[l.chave] = l.valor; }); return o;
}

// resposta do GET de um módulo por item (rota /api/estado/<módulo> e leitura em lote /api/estado?m=...)
export async function respostaItens(modulo, desde) {
  const v = await versaoItens(modulo);
  const parcial = desde !== undefined && desde > 0 && desde <= v;
  const r = await lerItens(modulo, parcial ? desde : undefined);
  if (parcial && r.vazio) return { modulo, versao: Math.max(v, desde), igual: true };
  return { modulo, versao: Math.max(r.versao, v), conteudo: r.conteudo, parcial };
}
