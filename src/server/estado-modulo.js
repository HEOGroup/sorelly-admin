// Estado dos módulos (sorelly.estado_modulo): gravação SEGURA, registro de toda gravação e cópia diária (11/11/2026).
//
// Por quê: em 11/11/2026 sumiram os PIX de novembro do Financeiro familiar (ff.pix) e os materiais do Estoque de material (ce.materiais).
// A tela mandava a lista inteira e uma tela desatualizada gravava a cópia velha por cima. Agora:
//   1. gravarDiferenca: a tela manda só o que mudou ({patches}, ver lib/estado-patch.js) e o servidor aplica no que está guardado, dentro de uma
//      transação com o módulo travado (duas gravações juntas não se perdem).
//   2. gravarChaves: tela antiga (manda a chave inteira, {chaves}) junta SEM APAGAR itens que ela não traz. Vale até todas as telas serem atualizadas.
//   3. sorelly.estado_modulo_log: TODA gravação fica registrada (quem, quando, o que mudou), por 45 dias. Dá para refazer qualquer módulo.
//   4. sorelly.estado_modulo_copia: cópia de todos os módulos uma vez por dia (chamada pela rotina diária), por 30 dias.
import { consulta, pool } from "./db.js";
import { aplicar, juntarSemApagar, seqNuncaVolta } from "../apps/montagem/lib/estado-patch.js";

let pronta = null;
export function garantirTabelas() {
  if (!pronta) pronta = (async () => {
    await consulta(`CREATE TABLE IF NOT EXISTS sorelly.estado_modulo_log (
      id bigserial PRIMARY KEY,
      modulo text NOT NULL,
      versao integer,
      tipo text NOT NULL,
      dados jsonb NOT NULL,
      por text,
      em timestamptz NOT NULL DEFAULT now())`);
    await consulta("CREATE INDEX IF NOT EXISTS estado_modulo_log_modulo_em ON sorelly.estado_modulo_log (modulo, em)");
    await consulta(`CREATE TABLE IF NOT EXISTS sorelly.estado_modulo_copia (
      dia date NOT NULL,
      modulo text NOT NULL,
      versao integer,
      conteudo jsonb NOT NULL,
      PRIMARY KEY (dia, modulo))`);
  })().catch((e) => { pronta = null; throw e; });
  return pronta;
}

// junta o que chegou no conteúdo guardado, chave de 1º nível por chave
function juntar(conteudo, chegou, modo) {
  const novo = Object.assign({}, conteudo);
  Object.keys(chegou).forEach((k) => {
    const v = modo === "patch" ? aplicar(novo[k], chegou[k]) : juntarSemApagar(novo[k], chegou[k]);
    novo[k] = k === "seq" ? seqNuncaVolta(novo[k], v) : v;
  });
  return novo;
}

// grava dentro de uma transação, com a linha do módulo travada. modo = "patch" (tela nova) | "chaves" (tela antiga). Devolve a versão nova.
export async function gravarModulo(modulo, chegou, modo, por, ajustar) {
  await garantirTabelas();
  const c = await pool().connect();
  try {
    await c.query("begin");
    await c.query("insert into sorelly.estado_modulo (modulo, conteudo, versao, atualizado_por) values ($1, '{}'::jsonb, 0, $2) on conflict (modulo) do nothing", [modulo, por]);
    const at = await c.query("select conteudo, versao from sorelly.estado_modulo where modulo = $1 for update", [modulo]);
    const guardado = (at.rows[0] && at.rows[0].conteudo) || {};
    let novo = juntar(guardado, chegou, modo);
    if (ajustar) novo = ajustar(guardado, novo);
    const r = await c.query("update sorelly.estado_modulo set conteudo = $2::jsonb, versao = versao + 1, atualizado_por = $3, atualizado_em = now() where modulo = $1 returning versao", [modulo, JSON.stringify(novo), por]);
    const versao = r.rows[0].versao;
    await c.query("insert into sorelly.estado_modulo_log (modulo, versao, tipo, dados, por) values ($1, $2, $3, $4::jsonb, $5)", [modulo, versao, modo, JSON.stringify(chegou), por]);
    await c.query("commit");
    if (Math.random() < 0.005) consulta("delete from sorelly.estado_modulo_log where em < now() - interval '45 days'").catch(() => {});   // limpeza de vez em quando
    return versao;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

// cópia diária de todos os módulos (idempotente: uma por dia). Chamada pela rotina diária (automatico-dia.js).
export async function copiaDiaria(dia) {
  await garantirTabelas();
  const r = await consulta("insert into sorelly.estado_modulo_copia (dia, modulo, versao, conteudo) select $1::date, modulo, versao, conteudo from sorelly.estado_modulo on conflict do nothing", [dia]);
  await consulta("delete from sorelly.estado_modulo_copia where dia < $1::date - 30", [dia]);
  return { modulos: r.rowCount ?? r.affectedRows ?? 0 };
}
