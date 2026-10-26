// Cria a tabela de contas de acesso (sorelly.conta) se ainda não existir. Pode rodar quantas vezes quiser: não apaga nada.
//   npm run migrar-contas
import { consulta, pool } from "../src/server/db.js";

await consulta(`CREATE TABLE IF NOT EXISTS sorelly.conta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  senha_hash text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'ativo', 'bloqueado')),
  perfil text NOT NULL DEFAULT 'MEMBER' CHECK (perfil IN ('ADMIN', 'MEMBER')),
  setores text[] NOT NULL DEFAULT '{}',
  pessoa_id integer,
  aprovado_por text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
)`);
await consulta("CREATE UNIQUE INDEX IF NOT EXISTS conta_email_uq ON sorelly.conta (lower(email))");
const n = (await consulta("select count(*)::int n from sorelly.conta")).rows[0].n;
console.log(`Tabela de contas pronta (${n} conta(s)).`);
await pool().end();
