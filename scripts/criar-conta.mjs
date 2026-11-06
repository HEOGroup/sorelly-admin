// Cria (ou atualiza) a conta de uma PESSOA com acesso limitado, rodado pelo próprio Marcus no terminal dele, com a senha que ele escolhe.
// Diferente de definir-login.mjs (que cria conta ADMIN), esta cria perfil MEMBER, com os setores e as telas que você indicar.
//   node --env-file-if-exists=.env.local scripts/criar-conta.mjs login "senha" "Nome completo" idDaPessoa ["setor1,setor2"] ["aba1,aba2"]
//   exemplo: node --env-file-if-exists=.env.local scripts/criar-conta.mjs mariaeduarda "SuaSenhaAqui" "Maria Eduarda de Assunção" 34 "financeiro" "set_financeiro,compras"
// idDaPessoa = id em src/apps/montagem/domain/equipe.js (34 = Maria Eduarda). setores = módulos do servidor (SETORES_VALIDOS em src/server/permissoes.js).
// abas = telas do menu ("set_financeiro" libera todas as telas do setor Financeiro; "compras" é a tela Compras e estoque).
// Se a conta já existir, só troca a senha, os setores e as telas e deixa ativa. A senha NÃO é impressa.
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";
import { SETORES_VALIDOS } from "../src/server/permissoes.js";
import { normalizarLogin } from "../src/server/contas.js";

const [loginBruto, senha, nome, pessoa, setoresTxt = "financeiro", abasTxt = "set_financeiro,compras"] = process.argv.slice(2);
if (!loginBruto || !senha || !nome || !pessoa) { console.error('Uso: node scripts/criar-conta.mjs login "senha" "Nome" idDaPessoa ["setores"] ["abas"]'); process.exit(1); }
if (senha.length < 8) { console.error("A senha precisa ter pelo menos 8 caracteres."); process.exit(1); }
const login = normalizarLogin(loginBruto);
const setores = setoresTxt.split(",").map((x) => x.trim()).filter(Boolean);
const abas = abasTxt.split(",").map((x) => x.trim()).filter(Boolean);
const ruim = setores.filter((x) => !SETORES_VALIDOS.includes(x));
if (ruim.length) { console.error("Setor inválido: " + ruim.join(", ") + ". Válidos: " + SETORES_VALIDOS.join(", ")); process.exit(1); }
if (!abas.every((x) => /^[a-z0-9_]{1,40}$/.test(x))) { console.error("Nome de tela inválido em: " + abas.join(", ")); process.exit(1); }

const hash = await criarHash(senha);
await consulta(
  `insert into sorelly.conta (nome, email, login, senha_hash, senha_provisoria, status, perfil, pessoa_id, setores, abas, aprovado_por)
   values ($1, $2, $2, $3, $7, 'ativo', 'MEMBER', $4, $5, $6, 'criar-conta')
   on conflict (lower(email)) do update set senha_hash = excluded.senha_hash, senha_provisoria = excluded.senha_provisoria, nome = excluded.nome, login = excluded.login, status = 'ativo', perfil = 'MEMBER',
     pessoa_id = excluded.pessoa_id, setores = excluded.setores, abas = excluded.abas, atualizado_em = now()`,
  [nome, login, hash, Number(pessoa), setores, abas, senha]);   // senha_provisoria guarda a senha para o botão "Copiar mensagem" da aba Contas montar o texto (igual ao que a tela já faz)
console.log("Conta pronta. Login: " + login + " | pessoa " + pessoa + " | setores: " + setores.join(", ") + " | telas: " + abas.join(", "));
await pool().end();
