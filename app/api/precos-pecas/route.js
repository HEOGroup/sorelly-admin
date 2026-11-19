export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
// Preço de venda das peças da DevMaster (só leitura, cache de 6 h), para qualquer pessoa logada (17/11/2026: Brinde de indicação do Atendimento Sorelly).
// NUNCA devolve custo: o custo continua só na rota /api/produtos-dm (Diretoria). ?codigos=BB0252,P1826
import { erro, json, rota } from "@/server/http";
import { produtosDaDevmaster } from "@/server/produtos-dm";

export const GET = rota(async (req, { url }) => {
  const codigos = String(url.searchParams.get("codigos") || "").split(",").map((c) => c.trim()).filter(Boolean).slice(0, 50);
  if (!codigos.length) return json({ itens: {} });
  try {
    const todos = await produtosDaDevmaster(codigos);
    const itens = {};
    for (const [c, p] of Object.entries(todos)) itens[c] = { codigo: p.codigo, descricao: p.descricao, preco: p.preco };
    return json({ itens });
  } catch (x) { return erro(x.message, x.statusCode || 500); }
});
