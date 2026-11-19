export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;
// Encomendas › Separar peças: a IA compara as peças na mão com as fotos dos pedidos em aberto e sugere qual peça vai para quem. Quem confirma é a pessoa.
//   POST /api/encomendas/casar  { fotos: [{id, rev, key}], pecas: [{cod, desc}], extras: { COD: "an_chave" } }
import { json, erro, rota, corpo, invalido } from "@/server/http";
import { podeModulo } from "@/server/permissoes";
import { casarComIA, limpaCodigos } from "@/server/separar-pecas";

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "er")) return erro("Você não tem acesso a este módulo.", 403);
  const b = await corpo(req, 256 * 1024);
  const fotos = (Array.isArray(b.fotos) ? b.fotos : []).filter((f) => f && typeof f.key === "string").map((f) => ({ id: String(f.id || ""), rev: String(f.rev || ""), key: f.key }));
  const cods = limpaCodigos((Array.isArray(b.pecas) ? b.pecas : []).map((p) => p && p.cod));
  if (!fotos.length || !cods.length) throw invalido("faltam fotos ou peças");
  const nomes = {}; (b.pecas || []).forEach((p) => { if (p && p.cod) nomes[String(p.cod).toUpperCase()] = String(p.desc || "").slice(0, 120); });
  try {
    return json(await casarComIA({ fotos, pecas: cods.map((cod) => ({ cod, desc: nomes[cod] || "" })), extras: b.extras }));
  } catch (x) {
    if (x && x.statusCode) throw x;
    console.error("[casar]", x && x.message);
    return erro("A IA não respondeu" + (x && x.status ? " (erro " + x.status + ")" : "") + ". Tente de novo em instantes.", 503);
  }
});
