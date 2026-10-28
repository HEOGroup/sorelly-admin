// Cria as contas de login das equipes de Bipagem, Montagem e Encomendas (pedido do Marcus, 27/10/2026): login = nome sem espaço, senha provisória simples.
// A senha provisória fica guardada em sorelly.conta.senha_provisoria SÓ para a Diretoria enviar (tela Contas); some quando a pessoa troca a senha.
// Só ACRESCENTA: quem já tem login fica como está. Pode rodar de novo.
//   node --env-file-if-exists=.env.local scripts/criar-contas-setor.mjs
import { randomInt } from "node:crypto";
import { consulta, pool } from "../src/server/db.js";
import { criarHash } from "../src/server/senha.js";

// pessoaId = id em domain/equipe.js; grupo de acesso vem da própria lista (papelDe)
const PESSOAS = [
  ["Natasha Ribeiro", 9, "bipagem", ["montagem"]], ["Edna Pereira", 10, "bipagem", ["montagem"]], ["Natalia Araujo", 12, "bipagem", ["montagem"]],
  ["Nataly Fernanda", 13, "bipagem", ["montagem"]], ["Sthefany Marques", 14, "bipagem", ["montagem"]], ["Kawany Coutinho", 15, "bipagem", ["montagem"]],
  ["Renata", 22, "bipagem", ["montagem"]], ["Gabrielly Morais", 33, "bipagem", ["montagem"]], ["Maria Eduarda de Assunção", 34, "bipagem", ["montagem"]],
  ["Leci", 35, "bipagem", ["montagem"]],
  ["Pamela", 1, "montagem", ["montagem", "producao"]], ["Ivanete", 2, "montagem", ["montagem", "producao"]], ["Paula Melissa", 3, "montagem", ["montagem", "producao"]],
  ["Letícia", 4, "montagem", ["montagem", "producao"]], ["Jenifer", 5, "montagem", ["montagem", "producao"]], ["Eduarda Helena", 6, "montagem", ["montagem", "producao"]],
  ["Maria Vitória", 7, "montagem", ["montagem", "producao"]], ["Larissa", 19, "montagem", ["montagem", "producao"]], ["Rakieli", 20, "montagem", ["montagem", "producao"]],
  ["Taynara", 21, "montagem", ["montagem", "producao"]],
  ["Elen Vitoria Lourenço de Bonfim", 39, "encomendas", ["encomendas", "montagem"]], ["Agatha Kristye Lencioni Mota", 40, "encomendas", ["encomendas", "montagem"]],
  ["Eduarda Gabriela Henrique Lima", 41, "encomendas", ["encomendas", "montagem"]],
];
const semAcento = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
// login = primeiro nome + (se houver) o segundo nome do cadastro curto; ex.: "paulamelissa", "mariaeduarda"; nomes compostos longos usam só os dois primeiros
const loginDe = (nome) => semAcento(nome.split(/\s+/).filter((p) => !["de", "da", "do", "dos", "das"].includes(p.toLowerCase())).slice(0, 2).join(" "));

await consulta("ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS senha_provisoria text");
const linhas = [];
for (const [nome, pessoaId, setor, setores] of PESSOAS) {
  let login = loginDe(nome);
  const ja = (await consulta("select id, status from sorelly.conta where pessoa_id = $1 limit 1", [pessoaId])).rows[0];
  if (ja) { linhas.push([setor, nome, login, "(já tinha conta)", ja.status]); continue; }
  const dono = (await consulta("select 1 from sorelly.conta where login = $1", [login])).rows[0];
  if (dono) login = login + pessoaId;   // nunca repete login
  const senha = "sorelly" + String(randomInt(1000, 10000));
  await consulta(
    `insert into sorelly.conta (nome, email, senha_hash, status, perfil, setores, pessoa_id, login, aprovado_por, senha_provisoria)
     values ($1, $2, $3, 'ativo', 'MEMBER', $4, $5, $6, 'Marcus', $7)`,
    [nome, login + "@interno.sorelly", await criarHash(senha), setores, pessoaId, login, senha]);
  linhas.push([setor, nome, login, senha, "criada"]);
}
for (const l of linhas) console.log(l.join(" | "));
await pool().end();
