export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Ficha Montar kit › Anéis: quantos anéis a revendedora vendeu nos últimos 4 meses, por tamanho (DevMaster, só leitura).
//   GET /api/montagem/revendedoras/:id/aneis?nome=NOME  →  { meses, vendas, total, tamanhos:[{tam, qtd}], semCadastro }
import { erro, json, rota } from "@/server/http";
import { podeMontagem } from "@/server/montagem-kit";
import { aneisDaRevendedora } from "@/server/encomendas-vendas";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeMontagem(eu)) return erro("Só o setor Montagem e a Diretoria abrem a Fila de montagem.", 403);
  const nome = String(url.searchParams.get("nome") || "").trim();
  if (!nome) return erro("Informe o nome da revendedora.", 400);
  return json(await aneisDaRevendedora(nome, 4));
});
