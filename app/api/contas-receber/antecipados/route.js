export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pix que a revendedora pagou ANTES do acerto, na tela Contas a receber (20/11/2026). Financeiro e Diretoria.
//   GET  /api/contas-receber/antecipados                       →  {itens, destinos:{pessoas, contas}, verFf}
//   POST /api/contas-receber/antecipados  {acao:"lancar", data, valor, cod (código da revendedora ativa, da lista), destino:"empresa"|"socio", personaId, contaId, contaTxt, key?, nome?, tipo?}
//                                         {acao:"anexar", id, key, nome, tipo}   {acao:"remover", id}   {acao:"adotar", ids:[...]} (só Diretoria)
// O arquivo do comprovante sobe antes por /api/anexos (modulo "contasreceber", ou "ff" para o Pix que já estava na Família) e aqui chega só a chave.
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { adotar, anexar, lancar, listar, remover } from "@/server/recebimentos-antecipados";

export const GET = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  return json(await listar(eu));
});

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  const b = await corpo(req, 16 * 1024);
  const feito = b.acao === "lancar" ? await lancar(eu, b) : b.acao === "anexar" ? await anexar(eu, b) : b.acao === "remover" ? await remover(eu, b) : b.acao === "adotar" ? await adotar(eu, b) : { erro: "Ação desconhecida." };
  return feito.erro ? erro(feito.erro, 400) : json(feito);
});
