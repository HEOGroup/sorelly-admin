// Copia do admin antigo (sorelly-admin) para o protótipo os dados da Fila de montagem (18/11/2026):
//   montagem_staff (equipe), montagem_bonus_config (regras do bônus) e montagem_kit_registro (registros de montagem).
// Opcional --avaliacoes: avaliacao_pergunta, avaliacao e avaliacao_resposta (só servem para o fator de avaliação do bônus).
// Também COMPARA os blocos do formulário (kit_block do antigo × módulo pk do protótipo) e mostra o que estiver diferente. Os blocos NÃO são gravados aqui:
// o formulário do protótipo é editado em Kits › Preferências do kit › Formulário do app.
// As tabelas têm o mesmo formato nos dois bancos; a cópia usa o id do antigo (rodar de novo atualiza, não duplica). Nada é apagado.
//
// Uso (no terminal, na pasta sorelly-prototipo):
//   $env:ADMIN_ANTIGO_DATABASE_URL = "postgresql://...banco do admin antigo..."   (PowerShell)
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env scripts/migrar-montagem-admin-antigo.mjs              # só mostra o relatório
//   node --env-file-if-exists=.env.local --env-file-if-exists=.env scripts/migrar-montagem-admin-antigo.mjs --aplicar    # grava no banco do protótipo (DATABASE_URL)
import pg from "pg";
import { consulta, pool } from "../src/server/db.js";
import { configPublica, garantirTabelas } from "../src/server/montagem-kit.js";

const aplicar = process.argv.includes("--aplicar"), comAvaliacoes = process.argv.includes("--avaliacoes");
const urlAntigo = (process.env.ADMIN_ANTIGO_DATABASE_URL || "").trim();
if (!urlAntigo) { console.error("Falta ADMIN_ANTIGO_DATABASE_URL (o banco do admin antigo). Veja o uso no começo do arquivo."); process.exit(1); }
if (urlAntigo === (process.env.DATABASE_URL || "").trim()) { console.error("ADMIN_ANTIGO_DATABASE_URL é o mesmo banco do protótipo. Confira as variáveis."); process.exit(1); }

const antigo = new pg.Client({ connectionString: urlAntigo, ssl: { rejectUnauthorized: true } });
await antigo.connect();
await antigo.query("set default_transaction_read_only = on");   // o antigo só é lido

// em qual schema o antigo guarda as tabelas (public ou sorelly)
const schemaDe = async (tabela) => (await antigo.query("select table_schema from information_schema.tables where table_name = $1 order by (table_schema = 'public') desc limit 1", [tabela])).rows[0]?.table_schema || null;
// linhas do antigo em JSON (datas sem fuso saem como texto, exatamente como estão gravadas)
async function lerAntigo(tabela, ordem) {
  const sc = await schemaDe(tabela);
  if (!sc) return null;
  return (await antigo.query(`select coalesce(json_agg(t order by ${ordem}), '[]'::json) as j from "${sc}"."${tabela}" t`)).rows[0].j;
}
// grava no protótipo pelo tipo da própria tabela (json_populate_recordset converte datas, números e enums); id igual = atualiza
async function gravar(tabela, linhas) {
  const cols = (await consulta("select column_name from information_schema.columns where table_schema = 'sorelly' and table_name = $1 and column_name <> 'id' order by ordinal_position", [tabela])).rows.map((x) => '"' + x.column_name + '"');
  for (let i = 0; i < linhas.length; i += 2000) {
    const lote = linhas.slice(i, i + 2000);
    await consulta(`insert into sorelly."${tabela}" select * from json_populate_recordset(null::sorelly."${tabela}", $1::json)
      on conflict (id) do update set (${cols.join(", ")}) = (${cols.map((c) => "excluded." + c).join(", ")})`, [JSON.stringify(lote)]);
  }
}
const contar = async (tabela) => (await consulta(`select count(*)::int as n from sorelly."${tabela}"`)).rows[0].n;

await garantirTabelas();
console.log(aplicar ? "== GRAVANDO no banco do protótipo ==" : "== SIMULAÇÃO (nada é gravado; use --aplicar para gravar) ==");

// ---------- equipe, regras e registros ----------
const staff = (await lerAntigo("montagem_staff", "position, name")) || [];
const cfg = (await lerAntigo("montagem_bonus_config", "id")) || [];
const regs = (await lerAntigo("montagem_kit_registro", '"concluidoEm"')) || [];
console.log("\nEquipe da montagem (" + staff.length + "): " + staff.map((x) => x.name + (x.active ? "" : " (inativa)")).join(", "));
console.log("Regras do bônus: " + (cfg[0] ? JSON.stringify(cfg[0]) : "o antigo não tem linha (usa os números padrão)"));
console.log("Registros de montagem: " + regs.length + (regs.length ? " (de " + regs[0].concluidoEm + " até " + regs[regs.length - 1].concluidoEm + ", UTC)" : ""));
console.log("No protótipo hoje: equipe " + (await contar("montagem_staff")) + ", registros " + (await contar("montagem_kit_registro")) + ".");

if (aplicar) {
  await gravar("montagem_staff", staff);
  if (cfg.length) await gravar("montagem_bonus_config", cfg);
  await gravar("montagem_kit_registro", regs);
  console.log("Gravado. No protótipo agora: equipe " + (await contar("montagem_staff")) + ", registros " + (await contar("montagem_kit_registro")) + ".");
}

// ---------- avaliações (opcional) ----------
if (comAvaliacoes) {
  const perg = (await lerAntigo("avaliacao_pergunta", "ordem")) || [], av = (await lerAntigo("avaliacao", '"enviadaEm"')) || [], resp = (await lerAntigo("avaliacao_resposta", "id")) || [];
  console.log("\nAvaliações: " + perg.length + " perguntas, " + av.length + " avaliações, " + resp.length + " respostas.");
  if (aplicar) { await gravar("avaliacao_pergunta", perg); await gravar("avaliacao", av); await gravar("avaliacao_resposta", resp); console.log("Avaliações gravadas."); }
}

// ---------- blocos do formulário: só compara ----------
const blocos = (await lerAntigo("kit_block", "position")) || [];
const novo = await configPublica();
const pub = blocos.filter((b) => b.enabled && !(b.key === "observacoes" || (b.data && b.data.systemBlock === "observacoes"))).map((b) => b.key);
const doNovo = novo.blocks.filter((b) => b.type !== "observacoes").map((b) => b.key);
const so = (a, b) => a.filter((k) => !b.includes(k));
console.log("\nFormulário do app: antigo com " + pub.length + " blocos ativos, protótipo com " + doNovo.length + ".");
if (so(pub, doNovo).length) console.log("  Só no antigo: " + so(pub, doNovo).join(", "));
if (so(doNovo, pub).length) console.log("  Só no protótipo: " + so(doNovo, pub).join(", "));
if (pub.join(",") !== doNovo.join(",") && !so(pub, doNovo).length && !so(doNovo, pub).length) console.log("  Mesmos blocos, ordem diferente.");
for (const b of blocos.filter((x) => x.enabled && pub.includes(x.key) && doNovo.includes(x.key))) {
  const n = novo.blocks.find((x) => x.key === b.key), d = Object.assign({}, b.data || {});
  const igual = n.title === b.title && n.accent === b.accent && n.type === b.type && Object.keys(d).every((k) => k === "maxImages" || JSON.stringify(d[k]) === JSON.stringify(n[k]));
  if (!igual) console.log("  Diferente: " + b.key + " (título, cor ou campos)");
}

await antigo.end();
await pool().end();
