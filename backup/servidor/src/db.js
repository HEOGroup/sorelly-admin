// Conexão com o Postgres (banco de teste no Neon; na AWS troca só a DATABASE_URL).
// Tudo do sistema novo fica no schema "sorelly"; o login usa a tabela "user" do schema "public".
import pg from "pg";

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: true }
});

export const consulta = (sql, params) => pool.query(sql, params);
