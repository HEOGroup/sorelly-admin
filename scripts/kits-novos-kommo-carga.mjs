// Carga da Kommo nos Kits novos (25/11/2026): traz as aprovações e liberações de um período (as que aconteceram antes de ligar o agendador).
// Mesmas regras do agendador (src/server/kits-novos-kommo-regras.js). Sem --aplicar só mostra o relatório; nada é gravado.
// Com --aplicar grava no kndados e guarda o ponto onde parou (o agendador continua dali).
//
// Uso (na pasta sorelly-prototipo; DATABASE_URL, KOMMO_API_URL e KOMMO_ACCESS_TOKEN no .env/.env.local):
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env --import ./scripts/registrar-carregador.mjs scripts/kits-novos-kommo-carga.mjs --desde=2026-11-20
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env --import ./scripts/registrar-carregador.mjs scripts/kits-novos-kommo-carga.mjs --desde=2026-11-20 --aplicar
import { pool } from "../src/server/db.js";

const arg = (n) => { const a = process.argv.find((x) => x.startsWith("--" + n + "=")); return a ? a.split("=")[1] : ""; };
const aplicar = process.argv.includes("--aplicar"), desdeDia = arg("desde"), ateDia = arg("ate");
if (!/^\d{4}-\d{2}-\d{2}$/.test(desdeDia)) { console.error("Informe --desde=AAAA-MM-DD (dia da primeira aprovação a trazer)."); process.exit(1); }
const seg = (dia, fim) => Math.floor(Date.parse(dia + (fim ? "T23:59:59-03:00" : "T00:00:00-03:00")) / 1000);
if (aplicar) process.env.KITS_NOVOS_KOMMO = "1";
const { sincronizarKommoKitsNovos } = await import("../src/server/kits-novos-kommo.js");

const r = await sincronizarKommoKitsNovos({ desde: seg(desdeDia), ate: ateDia ? seg(ateDia, true) : undefined, simular: !aplicar });
console.log("\nPeríodo: " + new Date(r.de * 1000).toLocaleString("pt-BR") + " até " + new Date(r.ate * 1000).toLocaleString("pt-BR"));
console.log("Eventos da Kommo que interessam: " + r.eventos);
console.log("Kits novos criados: " + (r.criados || 0) + " · liberados pela Kommo: " + (r.liberados || 0) + " · ligados a kit da planilha: " + (r.vinculados || 0) + " · aprovação desfeita: " + (r.desfeitos || 0) + " · etapa da Kommo: " + (r.etiquetas || 0));
if (r.semDados && r.semDados.length) console.log("Leads sem dados na Kommo (apagados?): " + r.semDados.join(", "));
if (r.exemplos) {
  const porSt = {}, porReg = {}, porEnt = {};
  r.exemplos.forEach((k) => { porSt[k.st] = (porSt[k.st] || 0) + 1; porReg[k.reg] = (porReg[k.reg] || 0) + 1; porEnt[k.ent] = (porEnt[k.ent] || 0) + 1; });
  console.log("Kits que mudam: " + r.gravados + " · por etapa " + JSON.stringify(porSt) + " · por região " + JSON.stringify(porReg));
  console.log("Por entrada: " + JSON.stringify(porEnt));
  console.log("Sem telefone: " + r.exemplos.filter((k) => !k.temTel).length + " · vem na empresa: " + r.exemplos.filter((k) => k.rep === "Sorelly").length);
}
if (r.erros.length) console.log("ERROS: " + r.erros.join(" | "));
console.log(aplicar ? "\nGRAVADO: " + (r.gravados || 0) + " kit(s) (versão " + (r.versao || "-") + " do kndados)." : "\nSIMULAÇÃO: nada foi gravado. Para gravar, rode de novo com --aplicar.");
await pool().end().catch(() => {});
process.exit(r.erros.length ? 1 : 0);
