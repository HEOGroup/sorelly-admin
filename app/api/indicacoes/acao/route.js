export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Indicações ao vivo (19/11/2026): as mesmas ações das telas ({op, ...} de domain/indicacoes.js), executadas no app (etapas, moedas, pedidos) e no banco deste sistema (balcão).
//   POST /api/indicacoes/acao  {op, ...}  →  {msg, ind}   (ind = estado novo, já com a mudança)
// Gravar no app só com INDICACOES_GRAVAR=1 no servidor; a indicação manual também grava na Kommo e pede INDICACOES_KOMMO_GRAVAR=1.
import { corpo, erro, json, rota } from "@/server/http";
import { executarAcao, montarEstado, podeAcao, podeIndicacoes } from "@/server/indicacoes";

const CODIGOS = [400, 403, 404, 409, 422, 502, 503];

export const POST = rota(async (req, { eu }) => {
  const a = await corpo(req);
  if (!podeAcao(eu, a.op)) return erro("Seu acesso não faz esta ação nas Indicações.", 403);
  let msg;
  try { msg = await executarAcao(a, eu); }
  catch (e) { if (e && CODIGOS.includes(e.statusCode)) return erro(e.message, e.statusCode); throw e; }
  let ind = null;
  try { ind = (await montarEstado({ arquivoVersao: a.arquivoVersao || "", soAbertos: !podeIndicacoes(eu) })).ind; } catch (e) { ind = null; }   // a ação já valeu; a tela relê depois
  return json({ msg, ind });
});
