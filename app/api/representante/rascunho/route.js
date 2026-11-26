export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// RASCUNHO DO ACERTO NO SERVIDOR (26/11/2026, Marcus: a Jessica acertava, a bateria acabou antes de salvar e ficou torcendo que tivesse gravado).
// O app da representante manda o atendimento em andamento (tela, acerto, brindes, peças do próximo mês) a cada mudança; se o celular apagar, outro aparelho continua de onde parou.
//   GET    /api/representante/rascunho?rep=Nome            -> {rascunho: {kitId, rev, dados, em} | null}   o mais novo desta representante (até 48 h)
//   PUT    /api/representante/rascunho   {rep, kitId, rev, dados}  -> {ok, em}
//   DELETE /api/representante/rascunho?rep=Nome&kitId=ID    -> {ok}   (acerto terminado ou saiu de propósito: o registro fica, marcado como encerrado)
// Conta de representante grava sempre no código dela; a Diretoria (atuando como representante) usa o nome que a tela mandar.
import { consulta } from "@/server/db";
import { erro, invalido, json, corpo, rota } from "@/server/http";

let pronta = null;
function garantir() {
  if (!pronta) pronta = (async () => {
    await consulta(`CREATE TABLE IF NOT EXISTS sorelly.rascunho_rep (
      rep text NOT NULL,
      kit_id text NOT NULL,
      rev text,
      dados jsonb NOT NULL,
      por text,
      criado_em timestamptz NOT NULL DEFAULT now(),
      atualizado_em timestamptz NOT NULL DEFAULT now(),
      encerrado_em timestamptz,
      PRIMARY KEY (rep, kit_id))`);
  })().catch((e) => { pronta = null; throw e; });
  return pronta;
}

const chaveRep = (eu, v) => String((eu.repCod ? eu.repCod : v) || "").trim().slice(0, 60);

export const GET = rota(async (req, { eu, url }) => {
  const rep = chaveRep(eu, url.searchParams.get("rep"));
  if (!rep) return erro("Diga a representante (?rep=).", 400);
  await garantir();
  const r = await consulta("select kit_id, rev, dados, atualizado_em from sorelly.rascunho_rep where rep = $1 and encerrado_em is null and atualizado_em > now() - interval '48 hours' order by atualizado_em desc limit 1", [rep]);
  const x = r.rows[0];
  return json({ rascunho: x ? { kitId: x.kit_id, rev: x.rev, dados: x.dados, em: new Date(x.atualizado_em).getTime() } : null });
});

export const PUT = rota(async (req, { eu }) => {
  const b = await corpo(req, 512 * 1024);
  const rep = chaveRep(eu, b.rep), kitId = String(b.kitId || "").slice(0, 80);
  if (!rep || !kitId) throw invalido("faltam rep e kitId");
  if (!b.dados || typeof b.dados !== "object") throw invalido("faltam os dados");
  await garantir();
  // o rascunho mais novo vence: uma gravação atrasada (celular que voltou do offline) não apaga a de outro aparelho
  const em = Number(b.em) || Date.now();
  const r = await consulta(`insert into sorelly.rascunho_rep (rep, kit_id, rev, dados, por, atualizado_em) values ($1, $2, $3, $4::jsonb, $5, to_timestamp($6 / 1000.0))
    on conflict (rep, kit_id) do update set rev = excluded.rev, dados = excluded.dados, por = excluded.por, atualizado_em = excluded.atualizado_em, encerrado_em = null
    where sorelly.rascunho_rep.atualizado_em <= excluded.atualizado_em returning atualizado_em`,
  [rep, kitId, String(b.rev || "").slice(0, 120), JSON.stringify(b.dados), String(eu.nome || ""), em]);
  return json({ ok: true, gravou: r.rowCount > 0, em });
});

export const DELETE = rota(async (req, { eu, url }) => {
  const rep = chaveRep(eu, url.searchParams.get("rep")), kitId = String(url.searchParams.get("kitId") || "");
  if (!rep) return erro("Diga a representante (?rep=).", 400);
  await garantir();
  if (kitId) await consulta("update sorelly.rascunho_rep set encerrado_em = now() where rep = $1 and kit_id = $2", [rep, kitId]);
  else await consulta("update sorelly.rascunho_rep set encerrado_em = now() where rep = $1 and encerrado_em is null", [rep]);
  return json({ ok: true });
});
