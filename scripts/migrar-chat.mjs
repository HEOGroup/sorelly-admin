// Cria as tabelas do SorellyChat de verdade (conversas e mensagens guardadas no servidor). Pode rodar quantas vezes quiser: só cria o que falta.
//   node --env-file-if-exists=.env.local scripts/migrar-chat.mjs
import { consulta, pool } from "../src/server/db.js";

await consulta("CREATE SEQUENCE IF NOT EXISTS sorelly.chat_seq");
await consulta(`CREATE TABLE IF NOT EXISTS sorelly.chat_conv (
  id text PRIMARY KEY,
  dados jsonb NOT NULL,
  membros text[] NOT NULL,
  seq bigint NOT NULL DEFAULT nextval('sorelly.chat_seq'),
  criado_em timestamptz NOT NULL DEFAULT now()
)`);
await consulta("CREATE INDEX IF NOT EXISTS chat_conv_seq ON sorelly.chat_conv (seq)");
await consulta(`CREATE TABLE IF NOT EXISTS sorelly.chat_msg (
  id text PRIMARY KEY,
  conv text NOT NULL REFERENCES sorelly.chat_conv(id) ON DELETE CASCADE,
  de text NOT NULL,
  t bigint NOT NULL,
  dados jsonb NOT NULL,
  seq bigint NOT NULL DEFAULT nextval('sorelly.chat_seq')
)`);
await consulta("CREATE INDEX IF NOT EXISTS chat_msg_seq ON sorelly.chat_msg (seq)");
await consulta("CREATE INDEX IF NOT EXISTS chat_msg_conv ON sorelly.chat_msg (conv, t)");
const n = (await consulta("select (select count(*) from sorelly.chat_conv)::int c, (select count(*) from sorelly.chat_msg)::int m")).rows[0];
console.log(`Tabelas do chat prontas (${n.c} conversa(s), ${n.m} mensagem(ns)).`);
await pool().end();
