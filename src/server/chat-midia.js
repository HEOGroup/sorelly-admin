// SorellyChat: fotos, áudios e arquivos (29/10/2026). A mensagem guarda só a chave (md_...) da mídia; o conteúdo (data URL) fica na tabela sorelly.chat_midia
// e cada navegador busca pela chave quando precisa mostrar. Antes só valia para quem enviou (a mídia ficava no navegador dele) e o chat recusava o envio.
import { consulta } from "./db.js";

export const LIMITE_MIDIA = 3.6 * 1024 * 1024;   // caracteres do data URL (≈ 2,6 MB de arquivo); o limite de uma chamada na Vercel é 4,5 MB
export const chaveMidiaValida = (k) => typeof k === "string" && /^md_[a-z0-9]{6,40}$/.test(k);

let pronta = null;
export function garantirTabelaMidia() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.chat_midia (
    id text primary key, url text not null, tamanho integer not null, por text, criado_em timestamptz not null default now())`).catch((e) => { pronta = null; throw e; });
  return pronta;
}
