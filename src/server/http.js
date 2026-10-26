// Peças comuns das rotas da API (substituem o Fastify do servidor antigo): resposta JSON, erro, login obrigatório e leitura do corpo.
import { SignJWT, jwtVerify } from "jose";
import { consulta } from "./db.js";

export const json = (corpo, status = 200) => Response.json(corpo, { status });
export const erro = (msg, status) => json({ erro: msg }, status);

function segredo() {
  if (!process.env.JWT_SECRET) throw Object.assign(new Error("Falta a variável JWT_SECRET (veja .env.exemplo)."), { statusCode: 503 });
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export const assinar = (usuario) => new SignJWT(usuario).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("12h").sign(segredo());

// devolve o usuário do token ou null
export async function usuarioDe(req) {
  const h = req.headers.get("authorization") || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, segredo(), { algorithms: ["HS256"] });
    if (payload.conta) {
      // conta do sistema novo: vale o que está no banco agora (liberar, bloquear ou mudar setores tem efeito na hora)
      const r = (await consulta("select id, nome, email, status, perfil, setores, pessoa_id from sorelly.conta where id::text = $1", [String(payload.id)])).rows[0];
      if (!r || r.status !== "ativo") return null;
      return { id: r.id, nome: r.nome, email: r.email, perfil: r.perfil, setores: r.setores || [], pessoaId: r.pessoa_id, conta: true };
    }
    return { id: payload.id, nome: payload.nome, email: payload.email, perfil: payload.perfil, setores: payload.setores || [], pessoaId: payload.pessoaId ?? null };
  } catch (e) {
    if (e && e.statusCode === 503) throw e;
    return null;
  }
}

// Envolve uma rota: exige login (e, se pedido, ser da Diretoria), trata erros no mesmo formato do servidor antigo.
export function rota(fn, { diretoria = false, publica = false } = {}) {
  return async (req, ctx) => {
    try {
      let eu = null;
      if (!publica) {
        eu = await usuarioDe(req);
        if (!eu) return erro("Entre no sistema para continuar.", 401);
        if (diretoria && eu.perfil !== "ADMIN") return erro("Só a Diretoria pode fazer isso.", 403);
      }
      const params = ctx && ctx.params ? await ctx.params : {};
      return await fn(req, { eu, params, url: new URL(req.url) });
    } catch (e) {
      if (e && e.statusCode === 503) return erro(e.message, 503);
      if (e && e.statusCode === 400) return erro(e.message, 400);
      console.error(e);
      return erro("Algo deu errado. Tente de novo.", 500);
    }
  };
}

export const invalido = (msg) => Object.assign(new Error("Dados inválidos: " + msg), { statusCode: 400 });

export async function corpo(req, limite = 1024 * 1024) {
  const tam = Number(req.headers.get("content-length") || 0);
  if (tam > limite) throw invalido("corpo grande demais");
  try { const b = await req.json(); if (b && typeof b === "object" && !Array.isArray(b)) return b; } catch (e) { /* cai no erro abaixo */ }
  throw invalido("corpo precisa ser um objeto JSON");
}

export const ehTexto = (v) => typeof v === "string";
export const ehInteiro = (v) => Number.isInteger(v);
