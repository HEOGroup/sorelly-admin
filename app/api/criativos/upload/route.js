export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Envio de arquivos grandes dos Criativos (Marketing › Criativos), 06/11/2026, pedido do Marcus: o Diego guarda vídeo, imagem e carrossel no sistema.
// O arquivo NÃO passa por aqui (a Vercel limita o pedido a 4,5 MB): o navegador envia direto para o Vercel Blob e esta rota só entrega a licença de envio,
// depois de conferir o login e o acesso ao módulo "tp" (Marketing). Pede a variável BLOB_READ_WRITE_TOKEN (criada ao ligar o Blob ao projeto na Vercel).
//   POST /api/criativos/upload   corpo: o que o `upload` do @vercel/blob/client manda
import { handleUpload } from "@vercel/blob/client";
import { erro, json, rota } from "@/server/http";
import { podeModulo } from "@/server/permissoes";

const TIPOS = ["video/mp4", "video/quicktime", "video/webm", "image/jpeg", "image/png", "image/webp", "image/gif"];
const LIMITE = 600 * 1024 * 1024;   // 600 MB por arquivo

export const POST = rota(async (req, { eu }) => {
  if (!podeModulo(eu, "tp")) return erro("Você não tem acesso aos criativos.", 403);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return erro("O armazenamento de arquivos ainda não foi ligado. Falta criar o Blob na Vercel e ligar ao projeto.", 503);
  const body = await req.json();
  const r = await handleUpload({
    request: req,
    body,
    onBeforeGenerateToken: async (pathname) => {
      if (!/^criativos\/[A-Za-z0-9._-]{1,150}$/.test(pathname)) throw new Error("Nome de arquivo inválido.");
      return { allowedContentTypes: TIPOS, maximumSizeInBytes: LIMITE, addRandomSuffix: true };
    },
  });
  return json(r);
});
