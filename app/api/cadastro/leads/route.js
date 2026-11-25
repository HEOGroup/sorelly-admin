export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Aprovação de cadastros ao vivo (25/11/2026): os leads da Kommo guardados pelo admin antigo (src/server/cadastro-aprovacao.js).
//   GET /api/cadastro/leads            -> {ligado, gravar, versao, leads:[...]}  (setor Cadastro de revendedoras ou Diretoria)
//   GET /api/cadastro/leads?versao=X   -> {igual:true} quando nada mudou (a tela pergunta a cada poucos segundos)
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { cadastroGrava, cadastroLigado, listarLeads, versaoLeads } from "@/server/cadastro-aprovacao";

// erro com código (404, 409, 502...) volta com a mensagem certa para a tela
const comMensagem = (fn) => async (req, ctx) => { try { return await fn(req, ctx); } catch (e) { if (e && e.statusCode && e.statusCode !== 500) return erro(e.message, e.statusCode); throw e; } };

export const GET = rota(comMensagem(async (req, { eu, url }) => {
  if (!podeModulo(eu, "cl")) return erro("Você não tem acesso ao Cadastro de revendedoras.", 403);
  if (!cadastroLigado()) return json({ ligado: false, gravar: false, leads: [] });
  const versao = await versaoLeads();
  if (url.searchParams.get("versao") === versao) return json({ ligado: true, gravar: cadastroGrava(), versao, igual: true });
  return json({ ligado: true, gravar: cadastroGrava(), versao, leads: await listarLeads() });
}));
