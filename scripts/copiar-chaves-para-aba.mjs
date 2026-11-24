// Fase 2 da unificação das chaves Pix (Marcus, 24/11/2026: "a aba Chaves Pix é a tela principal").
// Copia para a aba Financeiro › Pagamentos › Chaves Pix (módulo `cp`, chave `chaves`) as chaves que hoje só existem numa cópia:
//   prestador da Família (ff.prest[].chavePix) → "ffp|nome";  destino do Direcionar (cp.destinos[].chavePix) → "forn|nome".
// Não apaga nada, não troca chave que já existe, ignora texto que não é chave ("CPF", "A preencher"). Pula quem a aba já acha por nome (mesma regra da lib/chave-central.js).
// Uso:  node --env-file-if-exists=.env.local scripts/copiar-chaves-para-aba.mjs           (só mostra)
//       node --env-file-if-exists=.env.local scripts/copiar-chaves-para-aba.mjs --gravar  (grava, com cópia de segurança)
import fs from "node:fs";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
import { acharChaveCentral, chaveValidaCentral } from "../src/apps/montagem/lib/chave-central.js";

const GRAVAR = process.argv.includes("--gravar");
const POR = "Copia das chaves para a aba Chaves Pix 24/11/2026";
const le = async (m) => (await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = $1", [m])).rows[0];
const cpL = await le("cp"), ffL = await le("ff");
if (!cpL) { console.log("Módulo cp não encontrado."); await pool().end(); process.exit(1); }
const cp = cpL.conteudo || {}, ff = (ffL && ffL.conteudo) || {};
const tipoDe = (ch) => { const s = String(ch || "").trim(), d = s.replace(/\D/g, ""); if (s.includes("@")) return "EMAIL"; if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return "ALEATORIA"; if (d.length === 14) return "CNPJ"; if (d.length === 11) return "CPF"; return "TELEFONE"; };
const slug = (n) => String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();

const estado = { cp, ff };
const aGravar = {};
const tenta = (grupo, nome, chave, tipo, banco, origem) => {
  if (!chaveValidaCentral(chave)) { console.log(`IGNORA ${nome}: "${chave}" não é chave (${origem}).`); return; }
  const jaTem = acharChaveCentral(estado, nome, { copias: false });
  if (jaTem) { console.log(`OK     ${nome}: a aba já tem (${jaTem.nome}).`); return; }
  const id = `${grupo}|${slug(nome)}`;
  if (aGravar[id]) return;
  aGravar[id] = { nome, banco: banco || "", chave: String(chave).trim(), chaveTipo: tipo || tipoDe(chave), grupo, servico: origem, chaveEm: Date.now(), chavePor: POR };
  console.log(`COPIA  ${nome} (${origem}) → ${id}`);
};
for (const p of ff.prest || []) tenta("ffp", p.nome, p.chavePix, p.chavePixTipo, "", "Prestador da Família");
for (const d of cp.destinos || []) tenta("forn", d.nome, d.chavePix, "", d.banco, "Destino do Direcionar");

if (!Object.keys(aGravar).length) { console.log("\nNada para copiar."); await pool().end(); process.exit(0); }
if (!GRAVAR) { console.log(`\nSimulação: ${Object.keys(aGravar).length} chave(s) seriam copiadas. Nada foi gravado. Rode de novo com --gravar.`); await pool().end(); process.exit(0); }
const copia = `scripts/_copia-cp-chaves-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
fs.writeFileSync(copia, JSON.stringify(cp, null, 1));
console.log(`\nCópia do módulo cp guardada em ${copia} (não vai para o Git).`);
await gravarModulo("cp", {}, "patch", "copia-chaves-24-11", (guardado, novo) => Object.assign({}, novo, { chaves: Object.assign({}, aGravar, (guardado && guardado.chaves) || {}) }));
console.log(`Gravado: ${Object.keys(aGravar).length} chave(s).`);
await pool().end();
