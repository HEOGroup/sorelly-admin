// Atualiza as chaves Pix dos fornecedores com a lista que o Marcus mandou em 26/11/2026 (favorecido, banco e chave).
// A regra (fixa / pedido) NÃO muda. O "Escrever na folha" vem do numerário do destino (R3), por isso a folha solta sai do Point.
// Uso: node --env-file-if-exists=.env.local scripts/chaves-fornecedores-26-11.mjs [--gravar]
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
const GRAVAR = process.argv.includes("--gravar");
const AGORA = Date.now();
const POR = "Marcus (WhatsApp 26/11/2026)";
// id -> campos novos. "chave" só entra quando a chave muda (a anterior fica em chaveAnterior).
const NOVO = {
  "forn|Point": { favorecido: "Prime Brutos Ltda", banco: "Bradesco" },
  "forn|Art Ello": { favorecido: "Janete Maria Fabris Cavasin", banco: "Sicredi" },
  "forn|Ellos Galvânica": { favorecido: "Vanilsa Neida Dalmas Teochi", banco: "Sicredi" },
  "forn|Xangai": { favorecido: "LT Serviços e Soluções Ltda", banco: "Sicredi" },
  "forn|Devmaster": { favorecido: "Jaime Machado Rodrigues" },
  "forn|MegaSul": { favorecido: "Full Acessórios Moda", banco: "Santander", chave: "57771337000110", chaveTipo: "CNPJ" },
  "forn|Pontual": { favorecido: "Nisis Joias Ltda", banco: "Itaú", chave: "19933003804", chaveTipo: "TELEFONE" },
};
const lido = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
const chaves = Object.assign({}, lido.chaves || {});
for (const id of Object.keys(NOVO)) {
  const atual = chaves[id];
  if (!atual) { console.log("Falta o cadastro", id, ". Parei."); await pool().end(); process.exit(1); }
  const n = Object.assign({}, NOVO[id]);
  const mudaChave = n.chave && n.chave !== String(atual.chave || "").replace(/\D/g, "");
  const novo = Object.assign({}, atual, n);
  if (id === "forn|Point") delete novo.folha;
  if (mudaChave) { novo.chaveAnterior = { chave: atual.chave || "", banco: atual.banco || "", chaveTipo: atual.chaveTipo || "", favorecido: atual.favorecido || "" }; novo.chaveEm = AGORA; novo.chavePor = POR; }
  else if (!n.chave) { novo.chave = atual.chave; }
  else { novo.chave = atual.chave; }
  chaves[id] = novo;
  console.log((mudaChave ? "CHAVE NOVA  " : "só favorecido") + " | " + id + " | " + (novo.favorecido || "") + " | " + (novo.banco || "-") + " | " + novo.chave + (mudaChave ? "  (antes: " + atual.chave + " " + (atual.banco || "") + ")" : ""));
}
if (!GRAVAR) { console.log("Simulação. Nada gravado. Rode com --gravar."); await pool().end(); process.exit(0); }
await gravarModulo("cp", {}, "patch", "chaves-fornecedores-26-11", (g, n) => Object.assign({}, n, { chaves: Object.assign({}, (g && g.chaves) || {}, Object.fromEntries(Object.keys(NOVO).map((id) => [id, chaves[id]]))) }));
const dep = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'cp'")).rows[0].conteudo;
for (const id of Object.keys(NOVO)) console.log("Conferido", id, JSON.stringify(dep.chaves[id]));
console.log("Total de chaves:", Object.keys(dep.chaves).length, "(antes:", Object.keys(lido.chaves).length + ")");
await pool().end();
