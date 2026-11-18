export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Foto de uma peça que o setor encontrou, para a revendedora ver no link dela. GET /api/pedido-link/<codigo>/peca?cod=SP0615 → a imagem
import { erro, rota } from "@/server/http";
import { fotoPublicaDaPeca } from "@/server/pedido-link";

export const GET = rota(async (req, { params, url }) => {
  const f = await fotoPublicaDaPeca(String(params.codigo || ""), url.searchParams.get("cod"));
  if (!f) return erro("Sem foto.", 404);
  return new Response(f.bytes, { headers: { "content-type": f.mime, "cache-control": "private, max-age=300" } });
}, { publica: true });
