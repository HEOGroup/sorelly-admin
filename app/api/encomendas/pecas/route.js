export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Encomendas › Separar peças: nome e situação da foto de cada código que a funcionária tirou do estoque (DevMaster API 2, só leitura).
//   GET /api/encomendas/pecas?cods=SP0615,AA0031   →  { pecas: [{ cod, desc, existe, temFoto }] }
import { json, erro, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { pecasDaMao } from "@/server/separar-pecas";
import { produtosDaDevmaster } from "@/server/produtos-dm";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const cods = String(url.searchParams.get("cods") || "").split(",");
  const pecas = await pecasDaMao(cods);
  // preço = o da DevMaster (aaa_precobase), nunca o que a funcionária digitou (17/11/2026, Marcus: "ignora os preços, a lista pode ter errado")
  let precos = {};
  try { precos = await produtosDaDevmaster(pecas.map((x) => x.cod)); } catch (x) { precos = {}; }
  return json({ pecas: pecas.map((x) => ({ ...x, preco: precos[x.cod] ? precos[x.cod].preco : null })) });
});
