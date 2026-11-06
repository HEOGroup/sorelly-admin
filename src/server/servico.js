// Rotas de SERVIÇO (05/11/2026): o backend do app da representante (sorelly-app/apps/backend) chama o admin servidor a servidor.
// Contrato: sorelly-app/docs/app-representante/CONTRATOS.md. Diferenças das rotas de pessoa (http.js):
//  - autenticação pela chave x-ingest-key = CONSIGNADO_INGEST_KEY (a mesma do backend do app), comparada em tempo constante; não há login de pessoa;
//  - erro SEMPRE em {error} (o backend lê body.error e mostra a frase à representante);
//  - 4xx só para rejeição definitiva (o backend descarta o acerto e NÃO reenvia); falha passageira (banco fora, timeout) = 503, e o backend repesca.
import { timingSafeEqual } from "node:crypto";

export const ok = (corpo, status = 200) => Response.json(corpo, { status });
export const falha = (msg, status) => Response.json({ error: msg }, { status });

// erro de regra de negócio com status (409/422/404) e frase para a representante
export class ErroServico extends Error {
  constructor(msg, status = 422) { super(msg); this.status = status; }
}
export const recusa = (msg, status = 422) => new ErroServico(msg, status);

function chaveOk(req) {
  const esperada = String(process.env.CONSIGNADO_INGEST_KEY || "").trim();
  if (!esperada) return null;   // sem chave configurada: ninguém entra
  const veio = req.headers.get("x-ingest-key") || "";
  const a = Buffer.from(veio), b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

// lê o corpo JSON com limite (padrão 6 MB: assinatura + foto do expositor; o backend do app aceita até 5 MB, então nada que ele mande é recusado aqui)
export async function corpoServico(req, limite = 6 * 1024 * 1024) {
  const tam = Number(req.headers.get("content-length") || 0);
  if (tam > limite) throw recusa("Envio grande demais.", 413);
  let b = null;
  try { b = await req.json(); } catch (e) { /* cai abaixo */ }
  if (!b || typeof b !== "object" || Array.isArray(b)) throw recusa("Corpo inválido: precisa ser um objeto JSON.", 400);
  return b;
}

// Envolve a rota de serviço: confere a chave, trata erros no formato do contrato.
export function rotaServico(fn) {
  return async (req, ctx) => {
    try {
      const c = chaveOk(req);
      if (c === null) return falha("Ligação com o app não configurada (CONSIGNADO_INGEST_KEY).", 503);
      if (!c) return falha("Chave de ingestão inválida.", 401);
      const params = ctx && ctx.params ? await ctx.params : {};
      return await fn(req, { params, url: new URL(req.url) });
    } catch (e) {
      if (e instanceof ErroServico) return falha(e.message, e.status);
      if (e && e.statusCode === 400) return falha(e.message, 400);
      console.error("[servico]", e);
      return falha("Sem conexão com a empresa agora. Tente de novo em instantes.", 503);
    }
  };
}

// validações simples
export const ehData = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T12:00:00Z"));
export const ehHora = (v) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const ehId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(v);
export const texto = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const numero = (v) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
export const novoId = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// hoje em Brasília (AAAA-MM-DD) e hora HH:MM
export const hojeSP = () => new Date(Date.now() - 3 * 3600000).toISOString().slice(0, 10);
export const horaSP = () => new Date(Date.now() - 3 * 3600000).toISOString().slice(11, 16);
