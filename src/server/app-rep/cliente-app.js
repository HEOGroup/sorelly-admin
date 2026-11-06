// Cliente do backend do app (sorelly-app/apps/backend) para as chamadas que o ADMIN faz ao app (contrato, seção 3):
// kits novos (PUT/DELETE/GET respostas), pedidos de data (GET/PATCH) e aviso "kit pronto" (POST listagens/avisos).
// Base MOBILE_API_URL (já termina em /api) e Authorization: Bearer MOBILE_API_KEY (= ADMIN_SECRET do backend do app).
// SEGURANÇA: toda chamada que GRAVA no app só roda com APP_REP_SINCRONIZAR=1. O .env de desenvolvimento aponta para a API de produção:
// sem a chave ligada de propósito, um servidor de teste nunca manda kit nem decide pedido no app de verdade.
const VERSAO_APP = "3.5.0";

export function configurado() { return !!(process.env.MOBILE_API_URL && process.env.MOBILE_API_KEY); }
export function podeGravar() { return configurado() && process.env.APP_REP_SINCRONIZAR === "1"; }

export async function chamarApp(metodo, caminho, corpo) {
  if (!configurado()) throw Object.assign(new Error("Ligação com o app não configurada (MOBILE_API_URL e MOBILE_API_KEY)."), { statusCode: 503 });
  if (metodo !== "GET" && !podeGravar()) throw Object.assign(new Error("Gravação no app desligada neste servidor (APP_REP_SINCRONIZAR=1 liga)."), { statusCode: 503 });
  const base = String(process.env.MOBILE_API_URL).replace(/\/$/, "");
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(base + caminho, {
      method: metodo,
      headers: { Authorization: "Bearer " + process.env.MOBILE_API_KEY, "X-App-Version": VERSAO_APP, ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: ctrl.signal,
    });
    const txt = await r.text();
    let json = null; try { json = txt ? JSON.parse(txt) : null; } catch (e) { /* corpo não-JSON */ }
    return { ok: r.ok, status: r.status, corpo: json, erro: (json && (json.error || json.erro)) || (r.ok ? null : "Erro " + r.status) };
  } finally {
    clearTimeout(timer);
  }
}
