export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Decisão de um cadastro (25/11/2026), só Diretoria (como o admin antigo: só ADMIN decide). Grava na Kommo e no admin antigo (src/server/cadastro-aprovacao.js).
//   GET  /api/cadastro/leads/<id>  -> o cadastro completo (fotos, observações), setor Cadastro
//   POST /api/cadastro/leads/<id>  {acao:"aprovar", opcao, valorCasa, valorEmpresa, nota} | {acao:"reprovar", nota} | {acao:"desfazer"}
import { corpo, erro, json, rota } from "@/server/http";
import { buscarLead, decidir } from "@/server/cadastro-aprovacao";
import { podeModulo } from "@/server/permissoes";

// erro com código (404, 409, 502...) volta com a mensagem certa para a tela
const comMensagem = (fn) => async (req, ctx) => { try { return await fn(req, ctx); } catch (e) { if (e && e.statusCode && e.statusCode !== 500) return erro(e.message, e.statusCode); throw e; } };

export const POST = rota(comMensagem(async (req, { eu, params }) => json(await decidir(params.id, await corpo(req), eu))), { diretoria: true });

export const GET = rota(comMensagem(async (req, { eu, params }) => {
  if (!podeModulo(eu, "cl")) return erro("Você não tem acesso ao Cadastro de revendedoras.", 403);
  return json(await buscarLead(params.id));
}));
