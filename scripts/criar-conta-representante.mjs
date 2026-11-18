// Conta de REPRESENTANTE no Admin normal (17/11/2026, Marcus). Ela entra como qualquer funcionária (login e senha), mas o servidor só mostra o que é dela:
// listagens, kits, acertos e comissões com o código dela (src/server/rep-filtro.js). O menu fica só nas 4 telas abaixo.
// Uso (na pasta do projeto, PowerShell):
//   node --env-file-if-exists=.env.local scripts/criar-conta-representante.mjs <login> <senha> <código do vendedor> "<Nome completo>"
//   ex.: node --env-file-if-exists=.env.local scripts/criar-conta-representante.mjs vanessa 010203 9S "Vanessa Alves Lapa"
// Repetir o comando troca a senha. Para desligar: node ... --desligar <login>.
import { consulta } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

const ABAS = ["celrep", "painel", "consrep", "comissoes"];   // as 4 telas: App da representante (calculadora), Listagens, Consolidado e Comissões
const args = process.argv.slice(2);
await consulta("alter table sorelly.conta add column if not exists rep_cod text");

if (args[0] === "--desligar") {
  const r = await consulta("update sorelly.conta set status = 'bloqueado' where login = $1 and rep_cod is not null", [String(args[1] || "").toLowerCase()]);
  console.log(r.rowCount ? "Conta desligada." : "Nenhuma conta de representante com esse login.");
  process.exit(0);
}
const [login0, senha, cod0, nome] = args;
if (!login0 || !senha || !cod0 || !nome) { console.log('Uso: criar-conta-representante.mjs <login> <senha> <código> "<Nome completo>"'); process.exit(1); }
const login = login0.toLowerCase().replace(/[^a-z0-9._-]/g, ""), cod = cod0.trim().toUpperCase();
const hash = await criarHash(senha);
const email = login + "." + cod.toLowerCase() + "@representante.sorelly";   // só para a tabela (não é e-mail de verdade)
const ja = (await consulta("select id from sorelly.conta where login = $1", [login])).rows[0];
if (ja) {
  await consulta("update sorelly.conta set senha_hash = $2, nome = $3, status = 'ativo', perfil = 'MEMBER', setores = $4::text[], abas = $5::text[], grupo = 'representante', rep_cod = $6 where login = $1", [login, hash, nome, [], ABAS, cod]);
  console.log("Conta atualizada: " + login + " (código " + cod + ").");
} else {
  await consulta("insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, abas, grupo, login, rep_cod) values ($1, $2, $3, 'ativo', 'MEMBER', $4::text[], $5::text[], 'representante', $6, $7)", [nome, email, hash, [], ABAS, login, cod]);
  console.log("Conta criada: " + login + " (código " + cod + ").");
}
process.exit(0);
