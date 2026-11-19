export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Formulário dos funcionários (18/11/2026). RESTRITO a diretoria e ao setor RH (conferido aqui no servidor).
//   GET  /api/meus-dados                          lista de links e respostas
//   POST /api/meus-dados {acao:"gerar", pessoas:[{id, nome}]}   cria o link de quem ainda não tem e devolve a lista
//   POST /api/meus-dados {acao:"aplicada", id}    marca a resposta como aplicada no cadastro (o RH aplica pelo navegador e avisa aqui)
import { erro, json, rota, corpo } from "@/server/http";
import { gerarLinks, listarFichas, marcarAplicada, podeFicha } from "@/server/ficha-func";

export const GET = rota(async (req, { eu }) => {
  if (!podeFicha(eu)) return erro("Só a diretoria e o RH abrem o formulário dos funcionários.", 403);
  return json({ fichas: await listarFichas() });
});

export const POST = rota(async (req, { eu }) => {
  if (!podeFicha(eu)) return erro("Só a diretoria e o RH abrem o formulário dos funcionários.", 403);
  const b = await corpo(req, 256 * 1024);
  if (b.acao === "gerar") return json({ fichas: await gerarLinks(b.pessoas) });
  if (b.acao === "aplicada") { await marcarAplicada(b.id, eu.nome || eu.login || ""); return json({ fichas: await listarFichas() }); }
  return erro("Ação desconhecida.", 400);
});
