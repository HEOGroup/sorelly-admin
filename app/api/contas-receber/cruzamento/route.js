export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
// Cruzamento do Pix da DevMaster com o Pix da Família, na tela Contas a receber (21/11/2026). Financeiro e Diretoria. Só lê a DevMaster; grava só a cópia derivada (tabelas sorelly.cruzamento_pix_*).
//   GET  /api/contas-receber/cruzamento                       →  o resultado gravado: {pronto, atualizando, geradoEm, desde, ate, resumo, mapa:{chaveDoTitulo:{pixId, conta, dono, data, certeza, motivo, ...}}, semTitulo:[...], verFf}
//                                                                 (sem resultado ainda: começa a ler a DevMaster e devolve {pronto:false, atualizando:true, etapa, pct})
//   POST /api/contas-receber/cruzamento {acao:"atualizar", tudo?:true, desde?:"AAAA-MM"}   →  lê de novo (só os 2 últimos meses, ou tudo) e refaz o cruzamento em segundo plano
import { corpo, erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { atualizar, resultado } from "@/server/cruzamento-pix";

export const GET = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  return json(await resultado(eu));
});

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "contasreceber")) return erro("Só o Financeiro e a Diretoria abrem Contas a receber.", 403);
  const b = await corpo(req, 4 * 1024);
  if (b.acao !== "atualizar") return erro("Ação desconhecida.", 400);
  return json(await atualizar({ tudo: !!b.tudo, desde: b.desde }));
});
