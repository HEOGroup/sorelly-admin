// Cliente do backend do app (sorelly-app/apps/backend) para as chamadas que o ADMIN faz ao app (contrato, seção 3):
// kits novos (PUT/DELETE/GET respostas), pedidos de data (GET/PATCH) e aviso "kit pronto" (POST listagens/avisos).
// Base MOBILE_API_URL (já termina em /api) e Authorization: Bearer MOBILE_API_KEY (= ADMIN_SECRET do backend do app).
// SEGURANÇA: toda chamada que GRAVA no app só roda com APP_REP_SINCRONIZAR=1. O .env de desenvolvimento aponta para a API de produção:
// sem a chave ligada de propósito, um servidor de teste nunca manda kit nem decide pedido no app de verdade.
import http from "node:http";
import https from "node:https";
import tls from "node:tls";

const VERSAO_APP = "3.5.0";

export function configurado() { return !!(process.env.MOBILE_API_URL && process.env.MOBILE_API_KEY); }
// 26/11/2026 (Marcus): no site publicado (Vercel, produção) o envio liga sozinho; APP_REP_SINCRONIZAR=0 desliga. Servidor de teste (localhost) continua precisando de =1.
export function podeGravar() { const v = process.env.APP_REP_SINCRONIZAR; return configurado() && (v === "1" || ((process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") && v !== "0")); }

// Avast no PC do Marcus troca o certificado: o fetch do Node falha (UNABLE_TO_VERIFY_LEAF_SIGNATURE). Cliente https com os certificados do sistema (como representantes-app.js). Nunca rejectUnauthorized:false.
let agente = null;
function agenteTls() {
  if (agente) return agente;
  let ca; try { ca = [...tls.getCACertificates("default"), ...tls.getCACertificates("system")]; } catch (x) { ca = undefined; }
  agente = new https.Agent(ca ? { ca, keepAlive: true } : { keepAlive: true });
  return agente;
}
function pedir(metodo, url, cabecalhos, corpo) {
  return new Promise((resolve, reject) => {
    const u = new URL(url), lib = u.protocol === "http:" ? http : https;
    const req = lib.request(u, { method: metodo, headers: cabecalhos, timeout: 15000, ...(lib === https ? { agent: agenteTls() } : {}) }, (res) => {
      const partes = []; res.on("data", (c) => partes.push(c));
      res.on("end", () => resolve({ status: res.statusCode, texto: Buffer.concat(partes).toString("utf8") }));
    });
    req.on("timeout", () => req.destroy(new Error("Tempo esgotado ao falar com o app.")));
    req.on("error", reject);
    if (corpo !== undefined) req.write(corpo);
    req.end();
  });
}

export async function chamarApp(metodo, caminho, corpo) {
  if (!configurado()) throw Object.assign(new Error("Ligação com o app não configurada (MOBILE_API_URL e MOBILE_API_KEY)."), { statusCode: 503 });
  if (metodo !== "GET" && !podeGravar()) throw Object.assign(new Error("Gravação no app desligada neste servidor (APP_REP_SINCRONIZAR=1 liga)."), { statusCode: 503 });
  const base = String(process.env.MOBILE_API_URL).replace(/\/$/, "");
  const dados = corpo !== undefined ? JSON.stringify(corpo) : undefined;
  const cab = { Authorization: "Bearer " + process.env.MOBILE_API_KEY, "X-App-Version": VERSAO_APP, Accept: "application/json" };
  if (dados !== undefined) { cab["Content-Type"] = "application/json"; cab["Content-Length"] = Buffer.byteLength(dados); }
  const r = await pedir(metodo, base + caminho, cab, dados);
  let json = null; try { json = r.texto ? JSON.parse(r.texto) : null; } catch (e) { /* corpo não-JSON */ }
  const ok = r.status >= 200 && r.status < 300;
  return { ok, status: r.status, corpo: json, erro: (json && (json.error || json.erro)) || (ok ? null : "Erro " + r.status) };
}
