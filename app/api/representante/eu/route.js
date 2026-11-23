export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Quem é a representante desta conta (23/11/2026): o código do vendedor e o NOME que as telas usam (o do Agendamento, ex.: "Vanessa"),
// para o app dela gravar listagens e acertos com o mesmo nome que a Montagem e o Consolidado já leem.
//   GET /api/representante/eu -> {cod, nome}
import { erro, json, rota } from "@/server/http";
import { nomeDaRep } from "@/server/rep-filtro";

export const GET = rota(async (req, { eu }) => {
  if (!eu.repCod) return erro("Esta conta não é de representante.", 404);
  const nome = (await nomeDaRep(eu.repCod)) || String(eu.nome || "").trim().split(/ +/).slice(0, 2).join(" ");
  return json({ cod: eu.repCod, nome });
});
