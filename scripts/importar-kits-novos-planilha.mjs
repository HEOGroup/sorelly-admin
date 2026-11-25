// Traz a planilha de kits novos da Michele (Kits Novos 2026.xlsx, 6 regiões) para o módulo kndados do servidor (23/11/2026).
// A planilha continuou em uso depois da carga de 06/11: os kits novos são cadastrados nela e as etapas são mexidas no sistema.
//
// Regras (nada é apagado):
//   1. Kit que só existe na planilha ENTRA (mesmo id da carga de 06/11: prefixo da região + mês da seção + "-" + nº da linha; repetido ganha _2).
//      Se o nome já existe no servidor com cadastro no mesmo mês, é a mesma revendedora com outro número: fica de fora (aparece no relatório).
//   2. Kit que ninguém mexeu no sistema (hist vazio) e que mudou na planilha é ATUALIZADO pela planilha.
//   3. Kit mexido no sistema (hist com alguma linha) NÃO muda: o sistema vale. Diferenças de etapa aparecem no relatório para conferir.
//   4. Kit que só existe no servidor fica como está.
// A gravação usa gravarModulo (transação com o módulo travado + registro em sorelly.estado_modulo_log): se alguém mexer num kit entre a leitura
// e a gravação, aquele kit não é tocado. A meta.versao NÃO muda (mudar faria cada navegador trocar a lista inteira).
//
// Uso (na pasta sorelly-prototipo; DATABASE_URL do servidor no .env/.env.local):
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env scripts/importar-kits-novos-planilha.mjs "Kits Novos 2026.xlsx"             # só o relatório
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env scripts/importar-kits-novos-planilha.mjs "Kits Novos 2026.xlsx" --aplicar   # grava
// A planilha tem dados pessoais: nunca no Git (*.xlsx está no .gitignore).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consulta, pool } from "../src/server/db.js";
import { gravarModulo } from "../src/server/estado-modulo.js";

const aplicar = process.argv.includes("--aplicar");
const arquivo = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!arquivo || !fs.existsSync(arquivo)) { console.error("Informe o caminho da planilha. Veja o uso no começo do arquivo."); process.exit(1); }

// 1. lê a planilha (Python + openpyxl) para um JSON temporário
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "kn-")), "planilha.json");
const py = process.platform === "win32" ? "python" : "python3";
console.log(execFileSync(py, ["-I", path.join(path.dirname(fileURLToPath(import.meta.url)), "ler-planilha-kits-novos.py"), arquivo, tmp], { encoding: "utf8" }).trim());
const plan = JSON.parse(fs.readFileSync(tmp, "utf8"));
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });

// 2. lê o servidor
const lido = (await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'kndados'")).rows[0];
if (!lido) { console.error("Módulo kndados não existe no servidor."); process.exit(1); }
const srv = new Map(Object.keys(lido.conteudo).filter((k) => k.startsWith("r_")).map((k) => [lido.conteudo[k].id, lido.conteudo[k]]));

const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
const diasAte = (d) => Math.round((Date.parse(hoje) - Date.parse(d)) / 86400000);
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const ETAPA = { entregue: "entregue", cancelado: "cancelado", devolvido: "devolvido", bipado: "bipado", solicitado: "solicitado", liberado: "liberado", cadastrada: "liberado", cadastrado: "liberado" };
const etapa = (t) => ETAPA[norm(t)] || null;
const histN = (k) => (Array.isArray(k && k.hist) ? k.hist.length : 0);

// kit no formato do módulo (mesmos campos da carga de 06/11; "Entregue" há 3 dias ou mais já leva a data em dev, como na carga)
function doModulo(p) {
  const st = etapa(p.stPlan) || "liberado";
  return {
    id: p.id, reg: p.reg, mes: p.mes, st, cad: p.cad, lib: p.lib || (st === "liberado" ? p.cad : null), sol: p.sol, bip: p.bip, ret: p.ret,
    dev: st === "entregue" && p.ret && diasAte(p.ret) >= 3 ? p.ret : null,
    nome: p.nome, cid: p.cid, bai: p.bai, rep: p.rep, mod: p.mod === "Misto" || !p.mod ? "Normal" : p.mod, val: p.val || 7000,
    retirada: p.retirada, trab: p.trab, trabEnd: "", disp: p.disp, obs: p.obs, obs2: p.obs2, c1: p.c1, c2: p.c2, c3: p.c3,
    c1n: "", c1r: "", c1t: "", c2n: "", c2r: "", c2t: "", c3n: "", c3r: "", c3t: "", tipo: p.tipo, op: p.op, ent: p.ent, entId: "", desm: 0, hist: [],
  };
}
const CAMPOS = ["st", "cad", "lib", "sol", "bip", "ret", "nome", "cid", "bai", "rep", "mod", "val", "retirada", "trab", "disp", "obs", "obs2", "c1", "c2", "c3", "tipo", "op", "ent", "mes"];
const igual = (a, b) => String(a ?? "").replace(/\s+/g, " ").trim() === String(b ?? "").replace(/\s+/g, " ").trim();   // espaço a mais não é mudança

// 3. compara
const porNome = new Map();
srv.forEach((k) => { const n = norm(k.nome); if (!porNome.has(n)) porNome.set(n, []); porNome.get(n).push(k); });
const R = { entram: [], duplicadas: [], atualizadas: [], sistemaVale: [], soNoServidor: [] };
const chaves = {};
for (const p of plan) {
  const s = srv.get(p.id), novo = doModulo(p);
  if (!s) {
    // 25/11/2026: kit que veio da Kommo (kId, id LK…) com o mesmo nome e cadastro até 120 dias perto também é a mesma revendedora
    const perto = (k) => Math.abs(Date.parse(String(k.cad || "") + "T12:00:00Z") - Date.parse(String(p.cad || "") + "T12:00:00Z")) <= 120 * 86400000;
    const mesmo = (porNome.get(norm(p.nome)) || []).find((k) => String(k.cad || "").slice(0, 7) === String(p.cad || "").slice(0, 7) || (k.kId && perto(k)));
    if (mesmo) { R.duplicadas.push(p.id + " = " + mesmo.id); continue; }
    R.entram.push(p.id); chaves["r_" + p.id] = novo; continue;
  }
  const muda = CAMPOS.filter((c) => !igual(s[c], novo[c]) && !(c === "st" && s.st === "devolvido" && novo.st === "entregue"));
  if (!muda.length) continue;
  if (histN(s)) { if (muda.includes("st")) R.sistemaVale.push(p.id + " (sistema " + s.st + ", planilha " + novo.st + ")"); continue; }
  // atualiza só o que vem da planilha; mantém o resto do kit (e a data dev, se a etapa não mudou)
  const at = Object.assign({}, s);
  muda.forEach((c) => { at[c] = novo[c]; });
  if (muda.includes("st") || muda.includes("ret")) at.dev = novo.dev;
  R.atualizadas.push(p.id + " (" + muda.join(", ") + ")"); chaves["r_" + p.id] = at;
}
const naPlan = new Set(plan.map((p) => p.id));
srv.forEach((k, id) => { if (!naPlan.has(id)) R.soNoServidor.push(id); });

const porRegiao = {};
R.entram.forEach((id) => { const r = chaves["r_" + id].reg; porRegiao[r] = (porRegiao[r] || 0) + 1; });
console.log("\nPlanilha: " + plan.length + " kits | servidor: " + srv.size + " kits (versão " + lido.versao + ")");
console.log("Entram (novos): " + R.entram.length + " " + JSON.stringify(porRegiao));
console.log("Ficam de fora (mesma revendedora com outro número): " + R.duplicadas.length + (R.duplicadas.length ? " → " + R.duplicadas.join("; ") : ""));
console.log("Atualizados pela planilha (ninguém mexeu no sistema): " + R.atualizadas.length);
R.atualizadas.forEach((x) => console.log("   " + x));
console.log("Mexidos no sistema com etapa diferente da planilha (o sistema vale, conferir): " + R.sistemaVale.length);
R.sistemaVale.forEach((x) => console.log("   " + x));
console.log("Só no servidor (ficam como estão): " + R.soNoServidor.length + (R.soNoServidor.length ? " → " + R.soNoServidor.join(" ") : ""));

if (!aplicar) { console.log("\nSIMULAÇÃO: nada foi gravado. Para gravar, rode de novo com --aplicar."); await pool().end(); process.exit(0); }
if (!Object.keys(chaves).length) { console.log("\nNada para gravar."); await pool().end(); process.exit(0); }

// 4. grava. Dentro da trava: kit que ganhou histórico depois da leitura volta para o que está guardado (o sistema vale).
let pulados = 0;
const versao = await gravarModulo("kndados", chaves, "chaves", "importação da planilha " + hoje, (guardado, novo) => {
  Object.keys(chaves).forEach((k) => {
    const g = guardado[k], antes = srv.get(chaves[k].id);
    if (g && (!antes || histN(g) !== histN(antes))) { novo[k] = g; pulados++; }
  });
  novo.meta = Object.assign({}, guardado.meta, { total: Object.keys(novo).filter((k) => k.startsWith("r_")).length, atualizadoDaPlanilha: hoje });
  return novo;
});
console.log("\nGRAVADO: versão " + versao + " do módulo kndados." + (pulados ? " " + pulados + " kit(s) mexido(s) no sistema durante a importação ficaram como estavam." : ""));
await pool().end();
