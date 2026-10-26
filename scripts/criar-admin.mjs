// Cria (ou atualiza) uma conta da Diretoria, já liberada. É a primeira conta do sistema: depois dela, as demais são liberadas pela tela.
//   npm run criar-admin -- email@dela.com "senha com 8 ou mais letras" "Nome" 16
// O último número é o id da pessoa no sistema (src/apps/montagem/domain/equipe.js; 16 = Marcus).
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const [email, senha, nome, pessoa] = process.argv.slice(2);
if (!email || !senha || !nome || senha.length < 8) { console.error('Uso: npm run criar-admin -- email "senha (8 ou mais)" "Nome" idDaPessoa'); process.exit(1); }
const hash = await criarHash(senha);
await consulta(
  `insert into sorelly.conta (nome, email, senha_hash, status, perfil, pessoa_id, aprovado_por)
   values ($1, lower($2), $3, 'ativo', 'ADMIN', $4, 'criar-admin')
   on conflict (lower(email)) do update set senha_hash = excluded.senha_hash, nome = excluded.nome, status = 'ativo', perfil = 'ADMIN', pessoa_id = excluded.pessoa_id, atualizado_em = now()`,
  [nome, email, hash, pessoa ? Number(pessoa) : null]);
console.log("Conta da Diretoria pronta para " + email + ".");
await pool().end();
