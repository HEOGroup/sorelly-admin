// Arquivos anexados aos módulos (04/11/2026), começando pelo ROMANEIO dos pedidos de bruto (Cadastro de peças). Mesmo desenho da mídia do SorellyChat (chat-midia.js):
// o módulo guarda só a CHAVE (an_...) e o conteúdo (data URL) fica na tabela sorelly.anexo_modulo (NÃO usa a tabela sorelly.anexo, que é do desenho final do banco e tem outras colunas); cada navegador busca pela chave quando precisa abrir.
// Quem pode enviar e abrir é quem pode abrir o módulo dono do arquivo (permissoes.js). Só imagem (JPEG, PNG, WebP) e PDF.
import { consulta } from "./db.js";

export const LIMITE_ANEXO = 3.9 * 1024 * 1024;   // caracteres do data URL (≈ 2,9 MB de arquivo); o limite de uma chamada na Vercel é 4,5 MB
export const MODULOS_COM_ANEXO = ["cpc"];
export const chaveAnexoValida = (k) => typeof k === "string" && /^an_[a-z0-9]{6,40}$/.test(k);
export const urlAnexoValida = (u) => typeof u === "string" && /^data:(image\/(jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(u);

let pronta = null;
export function garantirTabelaAnexo() {
  if (!pronta) pronta = consulta(`create table if not exists sorelly.anexo_modulo (
    id text primary key, modulo text not null, nome text, mime text, url text not null, tamanho integer not null, por text, criado_em timestamptz not null default now())`).catch((e) => { pronta = null; throw e; });
  return pronta;
}
