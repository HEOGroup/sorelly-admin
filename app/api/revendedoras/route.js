export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Lista das revendedoras (condicional aberto com previsão em 2026), lida da DevMaster API 2. Só a Diretoria nesta primeira versão; leitura somente; cache de 10 min.
//   GET /api/revendedoras            lista    |    ?atualizar=1 ignora o cache
import { json, rota } from "@/server/http";
import { VENDEDORES_SORELLY, listaRevendedoras } from "@/server/revendedoras";

//   GET /api/revendedoras?rep=02     só as revendedoras cujo vendedor do kit principal é o código dado (02 = Sorelly, atendimento interno)
export const GET = rota(async (req, { url }) => {
  const dados = await listaRevendedoras({ forcar: url.searchParams.get("atualizar") === "1" });
  const rep = url.searchParams.get("rep");
  if (!rep) return json(dados);
  // Regra do Marcus (27/10/2026), igual à tela "retorno de condicionais" da DevMaster: revendedora com ao menos um condicional ABERTO do vendedor, previsão até 31/12/2026
  // (expositor, sem previsão, não conta). Não depende de quem é a representante do kit principal.
  const vend = rep === "02" ? VENDEDORES_SORELLY : [rep];   // 02 = grupo Sorelly (02, FE e BY)
  const itens = dados.itens.filter((i) => i.conds.some((c) => vend.includes(c.vd) && c.d));
  return json({ ...dados, total: itens.length, itens, vendedores: vend });
}, { diretoria: true });
