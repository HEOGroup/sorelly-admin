// Cria (ou atualiza) uma conta da Diretoria que entra por LOGIN simples, sem e-mail (Marcus, 04/11/2026: Lucas entra com "lucasoliveira").
// O campo de entrada do sistema aceita e-mail ou login, então o login é guardado no lugar do e-mail. Se a conta já existir, só troca a senha e deixa ativa.
//   node --env-file-if-exists=.env.local scripts/definir-login.mjs lucasoliveira 141516 "Lucas" 28
// O último número é o id da pessoa no sistema (src/apps/montagem/domain/equipe.js; 28 = Lucas).
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const [login, senha, nome, pessoa] = process.argv.slice(2);
if (!login || !senha || !nome) { console.error('Uso: node scripts/definir-login.mjs login "senha" "Nome" idDaPessoa'); process.exit(1); }
const hash = await criarHash(senha);
await consulta(
  `insert into sorelly.conta (nome, email, senha_hash, status, perfil, pessoa_id, aprovado_por)
   values ($1, lower($2), $3, 'ativo', 'ADMIN', $4, 'definir-login')
   on conflict (lower(email)) do update set senha_hash = excluded.senha_hash, nome = excluded.nome, status = 'ativo', perfil = 'ADMIN', pessoa_id = excluded.pessoa_id, atualizado_em = now()`,
  [nome, login, hash, pessoa ? Number(pessoa) : null]);
console.log("Login pronto: " + login.toLowerCase());
await pool().end();
