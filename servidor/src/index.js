// Servidor do Sorelly Admin (Node + Fastify). Primeira parte: login e Rotina do dia.
// Configuração por variáveis de ambiente (arquivo .env, que NÃO vai para o Git): DATABASE_URL, JWT_SECRET, PORT, ORIGENS.
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { rotasAuth } from "./auth.js";
import { rotasRotina } from "./rotina.js";
import { rotasEstado } from "./estado.js";
import { rotasDevmaster } from "./devmaster.js";
import { pool } from "./db.js";

for (const k of ["DATABASE_URL", "JWT_SECRET"]) if (!process.env[k]) { console.error(`Falta a variável ${k} (veja servidor/.env.exemplo).`); process.exit(1); }

const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });
await app.register(cors, { origin: (process.env.ORIGENS || "http://localhost:5173").split(",").map((s) => s.trim()), methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] });
await app.register(jwt, { secret: process.env.JWT_SECRET });
app.decorate("autenticar", async (req, reply) => { try { await req.jwtVerify(); } catch { reply.code(401).send({ erro: "Entre no sistema para continuar." }); } });

app.setErrorHandler((erro, req, reply) => {
  if (erro.validation) return reply.code(400).send({ erro: "Dados inválidos: " + erro.message });
  req.log.error(erro);
  reply.code(500).send({ erro: "Algo deu errado. Tente de novo." });
});

app.get("/saude", async () => { await pool.query("select 1"); return { ok: true }; });
await app.register(rotasAuth);
await app.register(rotasRotina);
await app.register(rotasEstado);
await app.register(rotasDevmaster);

await app.listen({ port: Number(process.env.PORT || 3333), host: "0.0.0.0" });
