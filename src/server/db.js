// Conexão com o Postgres (banco de teste no Neon; na AWS troca só a DATABASE_URL).
// Tudo do sistema novo fica no schema "sorelly"; o login usa a tabela "user" do schema "public".
// O pool fica guardado em globalThis para o modo de desenvolvimento do Next não abrir uma conexão nova a cada recarga.
// MODO SIMULAÇÃO (Marcus, 28/11/2026): com SIMULACAO_ACERTOS=1 no .env.local nada é gravado. Toda gravação roda dentro de uma
// transação que termina em ROLLBACK: a tela recebe a resposta normal, mas o banco não muda. Para gravar de verdade, tirar a linha e religar.
import pg from "pg";

const SIMULA = () => String(process.env.SIMULACAO_ACERTOS || "").trim() === "1";
const ESCRITA = /^\s*(insert|update|delete|truncate|alter|create|drop|merge|copy|with\b[\s\S]*\b(insert|update|delete)\b)/i;
const texto = (a) => (typeof a === "string" ? a : a && a.text) || "";

function criar() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error("Falta a variável DATABASE_URL (veja .env.exemplo)."), { statusCode: 503 });
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: true },
  });
}

// cliente de transação: COMMIT vira ROLLBACK
function simularCliente(cli) {
  const q = cli.query.bind(cli);
  cli.query = (a, ...r) => (/^\s*(commit|end)\s*;?\s*$/i.test(texto(a)) ? q("ROLLBACK") : q(a, ...r));
  return cli;
}

export function pool() {
  if (!globalThis.__sorellyPool) globalThis.__sorellyPool = criar();
  const real = globalThis.__sorellyPool;
  if (!SIMULA()) return real;
  return {
    connect: async () => simularCliente(await real.connect()),
    query: async (a, ...r) => {
      if (!ESCRITA.test(texto(a))) return real.query(a, ...r);
      const cli = await real.connect();
      try { await cli.query("BEGIN"); return await cli.query(a, ...r); } finally { await cli.query("ROLLBACK").catch(() => {}); cli.release(); }
    },
    end: () => real.end(),
    on: (...x) => real.on(...x),
  };
}

export const consulta = (sql, params) => pool().query(sql, params);
