// Conexão com o Postgres (banco de teste no Neon; na AWS troca só a DATABASE_URL).
// Tudo do sistema novo fica no schema "sorelly"; o login usa a tabela "user" do schema "public".
// O pool fica guardado em globalThis para o modo de desenvolvimento do Next não abrir uma conexão nova a cada recarga.
import pg from "pg";

function criar() {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error("Falta a variável DATABASE_URL (veja .env.exemplo)."), { statusCode: 503 });
  return new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: true },
  });
}

export function pool() {
  if (!globalThis.__sorellyPool) globalThis.__sorellyPool = criar();
  return globalThis.__sorellyPool;
}

export const consulta = (sql, params) => pool().query(sql, params);
