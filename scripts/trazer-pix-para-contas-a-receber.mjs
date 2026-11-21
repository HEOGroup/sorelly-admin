// Traz para a tela CONTAS A RECEBER Pix que já estavam no Financeiro familiar (ex.: os 4 Pix da Karine, 20/11/2026), sem criar Pix novo: só passam a aparecer lá (lista `adotados` do módulo contasreceber).
//   node --env-file=.env.local scripts/trazer-pix-para-contas-a-receber.mjs --nome="Karine Thauany" --desde=2026-10-24            → só mostra os Pix que casam (NÃO grava)
//   node --env-file=.env.local scripts/trazer-pix-para-contas-a-receber.mjs --nome="Karine Thauany" --desde=2026-10-24 --gravar   → grava
// Roda no computador que tem o .env.local com DATABASE_URL (banco REAL). Mostrar a lista ao Marcus antes de gravar.
import { consulta } from "../src/server/db.js";
import { adotar } from "../src/server/recebimentos-antecipados.js";
import { nomeParecido } from "../src/apps/montagem/domain/pix-adiantados.js";

const arg = (k) => { const a = process.argv.find((x) => x.startsWith("--" + k + "=")); return a ? a.slice(k.length + 3) : ""; };
const gravar = process.argv.includes("--gravar"), nome = arg("nome"), desde = arg("desde");
if (nome.trim().length < 5 || !/^\d{4}-\d{2}-\d{2}$/.test(desde)) { console.error('Use --nome="Nome Sobrenome" --desde=AAAA-MM-DD'); process.exit(1); }
const reais = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const br = (iso) => iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);

const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'");
const ff = r.rowCount ? r.rows[0].conteudo : null;
if (!ff || !Array.isArray(ff.pix)) { console.error("Financeiro familiar não encontrado no servidor."); process.exit(1); }
const achados = ff.pix.filter((x) => x.data > desde && x.valor > 0 && x.personaId !== "familia" && x.auditoria !== "REJEITADO" && x.auditoria !== "NAOIDENT" && nomeParecido(x.origem, nome)).sort((a, b) => (a.data < b.data ? -1 : 1));
console.log(`Pix de "${nome}" depois de ${br(desde)} no Financeiro familiar: ${achados.length}`);
achados.forEach((x) => console.log(`  ${x.id}  ${br(x.data)}  ${reais(x.valor)}  ${x.origem}  ${x.compKey ? "com comprovante" : "sem comprovante"}`));
console.log("  Total: " + reais(achados.reduce((t, x) => t + x.valor, 0)));
if (!gravar) { console.log("\nRELATÓRIO apenas. Nada foi gravado. Para trazer para Contas a receber: acrescente --gravar (depois do OK do Marcus)."); process.exit(0); }
if (!achados.length) { console.log("Nada para trazer."); process.exit(0); }
const feito = await adotar({ perfil: "ADMIN", nome: "Script (Contas a receber)" }, { ids: achados.map((x) => x.id) });
console.log(feito.erro ? "ERRO: " + feito.erro : "GRAVADO: " + feito.adotados.length + " Pix passam a aparecer em Contas a receber.");
process.exit(feito.erro ? 1 : 0);
