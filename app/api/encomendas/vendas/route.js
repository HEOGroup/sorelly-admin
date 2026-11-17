export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Encomendas › Top 50: vendas por mês e média de cada revendedora do setor, lidas da DevMaster (só leitura; cache de 10 min).
//   GET /api/encomendas/vendas  →  { pronto, itens: { [idDaRevendedoraNoSetor]: { cod, nome, vm: {"2026-10": 5119}, v: [{d, v}], media, meses } }, semCadastro: [ids] }
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { vendasDoSetor } from "@/server/encomendas-vendas";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  return json(await vendasDoSetor({ forcar: url.searchParams.get("atualizar") === "1" }));
});
