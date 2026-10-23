// Define (ou troca) a senha de uma pessoa que já existe na tabela "user".  Uso:
//   DATABASE_URL=... npm run definir-senha -- email@dela.com "senha nova" [id-da-pessoa-no-sistema]
// O terceiro argumento liga a pessoa ao id dela no sistema novo (ex.: 16 = Marcus), usado na Rotina do dia.
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const [email, senha, pessoa, setoresTxt] = process.argv.slice(2);
const setores = (setoresTxt || "").split(",").map((x) => x.trim()).filter(Boolean);
if (!email || !senha) { console.error('Uso: npm run definir-senha -- email "senha" [pessoaId] [setor1,setor2]'); process.exit(1); }
const u = (await consulta('select id from public."user" where lower(email) = lower($1)', [email])).rows[0];
if (!u) { console.error("Não existe pessoa com esse e-mail na tabela user."); process.exit(1); }
await consulta(
  `insert into sorelly.usuario_login (user_id, senha_hash, pessoa_id, setores) values ($1, $2, $3, $4)
   on conflict (user_id) do update set senha_hash = excluded.senha_hash, setores = case when cardinality(excluded.setores) > 0 then excluded.setores else sorelly.usuario_login.setores end, pessoa_id = coalesce(excluded.pessoa_id, sorelly.usuario_login.pessoa_id), atualizado_em = now()`,
  [u.id, await criarHash(senha), pessoa ? Number(pessoa) : null, setores]);
console.log("Senha definida.");
await pool().end();
