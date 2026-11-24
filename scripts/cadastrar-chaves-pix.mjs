// Cadastra chaves Pix na aba Financeiro › Pagamentos › Chaves Pix (módulo `cp`, chave `chaves`), sem apagar nada do que já existe.
// Criado em 23/11/2026 (pedido do Marcus: "cadastra as chaves que faltam"). A tela Chaves Pix é só de leitura desde 12/11/2026; as chaves entram por este script, uma lista por vez.
// Regras: só ACRESCENTA ou COMPLETA a linha (nunca troca uma chave que já existe com valor diferente: avisa e pula); grava um arquivo de cópia antes; usa a trava de versão do servidor (gravarModulo).
// Cada linha de NOVAS é uma chave que o Marcus passou. A chave da linha é "grupo|Nome" (rep = representante, forn = fornecedor, prest = prestador, pes = sócio "pes|Pessoa|Banco").
// Uso (dentro da pasta do projeto):
//   node --env-file-if-exists=.env.local scripts/cadastrar-chaves-pix.mjs            (só mostra o que faria)
//   node --env-file-if-exists=.env.local scripts/cadastrar-chaves-pix.mjs --gravar
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";

const GRAVAR = process.argv.includes("--gravar");
const POR = "Marcus (WhatsApp 23/11/2026)";

// id da chave → dados. chaveTipo: CPF, CNPJ, EMAIL, TELEFONE ou ALEATORIA.
const NOVAS = {
  "rep|Mariana Ribeiro Amaral": { nome: "Mariana Ribeiro Amaral", banco: "Nubank", chave: "50278157000151", chaveTipo: "CNPJ", grupo: "rep", servico: "Representante" },
};

const lido = (await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'cp'")).rows[0];
if (!lido) { console.log("Módulo cp não encontrado."); await pool().end(); process.exit(1); }
const chaves = (lido.conteudo && lido.conteudo.chaves) || {};
console.log(`Chaves hoje no módulo cp: ${Object.keys(chaves).length} (versão ${lido.versao}).\n`);

const aGravar = {};
for (const [id, d] of Object.entries(NOVAS)) {
  const atual = chaves[id];
  if (atual && atual.chave && String(atual.chave).replace(/\D/g, "") !== String(d.chave).replace(/\D/g, "")) { console.log(`PULA  ${id}: já existe outra chave diferente. Confira antes de trocar.`); continue; }
  if (atual && atual.chave) { console.log(`OK    ${id}: já está cadastrada igual. Nada a fazer.`); continue; }
  aGravar[id] = Object.assign({}, atual || {}, d, { chaveEm: Date.now(), chavePor: POR });
  console.log(`NOVA  ${id}: ${d.chaveTipo} · ${d.banco}`);
}

if (!Object.keys(aGravar).length) { console.log("\nNada para gravar."); await pool().end(); process.exit(0); }
if (!GRAVAR) { console.log("\nSimulação. Nada foi gravado. Para gravar, rode de novo com --gravar."); await pool().end(); process.exit(0); }

const copia = `scripts/_copia-cp-chaves-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
fs.writeFileSync(copia, JSON.stringify(lido.conteudo, null, 1));
console.log(`\nCópia do módulo cp guardada em ${copia} (não vai para o Git).`);
await gravarModulo("cp", {}, "patch", "cadastro-chaves-23-11", (guardado, novo) => Object.assign({}, novo, { chaves: Object.assign({}, (guardado && guardado.chaves) || {}, aGravar) }));
console.log(`Gravado: ${Object.keys(aGravar).length} chave(s).`);
await pool().end();
