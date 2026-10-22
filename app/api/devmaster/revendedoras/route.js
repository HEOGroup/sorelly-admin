export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { json, rota } from "@/server/http";
import { listaDevmaster, casaVendedor, norm } from "@/server/devmaster";

// lista (opcional: ?vendedor=02&busca=ana&atualizar=1)
export const GET = rota(async (req, { url }) => {
  const g = (k) => url.searchParams.get(k) || "";
  const b = norm(g("busca")), d = g("busca").replace(/\D/g, "");
  const todas = await listaDevmaster(g("atualizar") === "1");
  const itens = todas.filter((i) => casaVendedor(i, g("vendedor")) && (!b || norm(i.nome).includes(b) || (d.length >= 3 && (i.documento.replace(/\D/g, "").includes(d) || i.celular.replace(/\D/g, "").includes(d)))));
  return json({ total: itens.length, totalDevmaster: todas.length, itens });
});
