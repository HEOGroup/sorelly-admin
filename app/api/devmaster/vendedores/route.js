export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, rota } from "@/server/http";
import { listaDevmaster } from "@/server/devmaster";

// quais valores existem no campo "vendedor" (para saber como a representante Sorelly 02 aparece)
export const GET = rota(async () => {
  const c = {}; (await listaDevmaster()).forEach((i) => { c[i.vendedor || "(vazio)"] = (c[i.vendedor || "(vazio)"] || 0) + 1; });
  return json({ vendedores: Object.entries(c).map(([vendedor, revendedoras]) => ({ vendedor, revendedoras })).sort((a, b) => b.revendedoras - a.revendedoras) });
});
