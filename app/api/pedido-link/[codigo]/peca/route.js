export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Foto de uma peça que o setor encontrou, para a revendedora ver no link dela. GET /api/pedido-link/<codigo>/peca?cod=SP0615 → a imagem
// Se a foto não puder ser lida (DevMaster fora do ar, por exemplo), responde 404 e a página mostra só o texto da peça; o motivo vai no cabeçalho x-motivo.
import { erro, rota } from "@/server/http";
import { fotoPublicaDaPeca } from "@/server/pedido-link";

export const GET = rota(async (req, { params, url }) => {
  try {
    const f = await fotoPublicaDaPeca(String(params.codigo || ""), url.searchParams.get("cod"));
    if (!f) return erro("Sem foto.", 404);
    return new Response(new Uint8Array(f.bytes), { headers: { "content-type": f.mime, "cache-control": "private, max-age=300" } });
  } catch (x) {
    const r = erro("Sem foto.", 404); r.headers.set("x-motivo", String((x && x.message) || x).replace(/[^\x20-\x7e]/g, "?").slice(0, 160)); return r;
  }
}, { publica: true });
