// Sorelly Admin · montagem — lib/enviar-arquivo.js
// Envia um arquivo de criativo (vídeo ou imagem, até 600 MB) direto do navegador para o Vercel Blob (06/11/2026). A licença de envio vem de /api/criativos/upload (app/api/criativos/upload/route.js),
// que confere o login. Devolve {url, nome, tipo, tamanho}; o criativo guarda só esses dados pequenos (o arquivo fica no Blob).
import { upload } from "@vercel/blob/client";
import { apiBase, token } from "@/apps/montagem/lib/api";

var VIDEOS = ["video/mp4", "video/quicktime", "video/webm"], IMAGENS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
var LIMITE_MB = 600;

// "video", "imagem" ou "" (tipo que o sistema não aceita)
function tipoDoArquivo(f){
  var t = String(f.type || "").toLowerCase();
  if(VIDEOS.indexOf(t)>=0) return "video";
  if(IMAGENS.indexOf(t)>=0) return "imagem";
  if(!t && /\.mov$/i.test(f.name)) return "video";
  if(!t && /\.mp4$/i.test(f.name)) return "video";
  return "";
}
function contentType(f, tipo){ if(f.type) return f.type; return /\.mov$/i.test(f.name) ? "video/quicktime" : tipo==="video" ? "video/mp4" : "image/jpeg"; }
var limpa = function(n){ return String(n || "arquivo").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "arquivo"; };
function tamanhoTexto(b){ return b>=1024*1024*1024 ? (b/1024/1024/1024).toFixed(1).replace(".", ",")+" GB" : b>=1024*1024 ? Math.round(b/1024/1024)+" MB" : Math.max(1, Math.round(b/1024))+" KB"; }

async function enviarArquivo(file, aoProgresso){
  var tipo = tipoDoArquivo(file);
  if(!tipo) throw new Error("Tipo não aceito: "+file.name+". Envie vídeo (MP4, MOV, WebM) ou imagem (JPG, PNG, WebP, GIF).");
  if(file.size > LIMITE_MB*1024*1024) throw new Error(file.name+" passa de "+LIMITE_MB+" MB.");
  try {
    var r = await upload("criativos/"+limpa(file.name), file, {
      access:"public", handleUploadUrl:apiBase()+"/criativos/upload", headers:{authorization:"Bearer "+token()},
      contentType:contentType(file, tipo), multipart:file.size > 20*1024*1024,
      onUploadProgress:function(p){ if(aoProgresso) aoProgresso(Math.round(p.percentage)); }
    });
    return {url:r.url, nome:file.name, tipo:tipo, tamanho:file.size};
  } catch(x){
    var msg = (x && x.message) || "";
    if(/client token|token/i.test(msg)) throw new Error("Não consegui a licença de envio de "+file.name+". O armazenamento de arquivos (Blob da Vercel) pode não estar ligado ao projeto, ou o seu login venceu. Saia e entre de novo; se continuar, avise a Tecnologia.");
    throw new Error("Não consegui enviar "+file.name+". "+(msg || "Tente de novo."));
  }
}
export { enviarArquivo, tipoDoArquivo, tamanhoTexto, LIMITE_MB };
