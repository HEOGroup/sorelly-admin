// Apaga do servidor os registros de TESTE do app da representante dentro do Admin (revendedora "TESTE CLAUDE IGNORAR" e chaves com "TESTE" no id).
// Criado em 23/11/2026, depois do teste completo pedido pelo Marcus (listagem, pré-acerto, acerto, Pix pelo Direcionar, inadimplência, entrega na empresa).
// Apagar = lápide {_apagado:true} nos módulos por item (rpo, rpf); no módulo pag o pedido vira null (é assim que a equipe apaga); no espelho lst a listagem e o kit saem da lista.
// Uso (dentro da pasta do projeto):
//   node --env-file-if-exists=.env.local scripts/limpar-teste-representante.mjs            (só mostra)
//   node --env-file-if-exists=.env.local scripts/limpar-teste-representante.mjs --gravar
import { consulta, pool } from "../src/server/db.js";
import { gravarItens } from "../src/server/estado-itens.js";
import { gravarModulo } from "../src/server/estado-modulo.js";
import { LAPIDE, donoDaChave } from "../src/apps/montagem/domain/app-rep.js";

const GRAVAR = process.argv.includes("--gravar");
const NOME = "TESTE CLAUDE IGNORAR", NOME2 = "TESTE NAO MONTAR";
const ehTeste = (v) => v && typeof v === "object" && [v.rev, v.nome, v.revendedora].some((x) => x === NOME || x === NOME2);

// 1) módulos por item: tudo que é do teste (pelo nome da revendedora ou pelo id TESTE...), mais as chaves irmãs do mesmo id (ke_, kx_, en_, lx_, ax_, ar_)
const todas = (await consulta("select modulo, chave, valor from sorelly.estado_item where modulo in ('rpo','rpf')")).rows;
const ids = { rpo: new Set(), rpf: new Set() };
todas.forEach((x) => { const id = x.chave.slice(x.chave.indexOf("_") + 1); if (ehTeste(x.valor) || /^TESTE/.test(id)) ids[x.modulo].add(id); });
todas.forEach((x) => { if (x.modulo === "rpo" && x.chave.startsWith("k_") && x.valor && ids.rpo.has(String(x.valor.lid))) ids.rpo.add(x.chave.slice(2)); });   // kits das listagens de teste
const linhas = todas.filter((x) => ids[x.modulo].has(x.chave.slice(x.chave.indexOf("_") + 1)) && !(x.valor && x.valor._apagado));
console.log(`Chaves de teste ainda vivas (rpo/rpf): ${linhas.length}`);
linhas.forEach((x) => console.log(`  ${x.modulo} ${x.chave}`));

// 2) pedidos de conta (módulo pag)
const pag = (await consulta("select conteudo from sorelly.estado_modulo where modulo = 'pag'")).rows[0];
const pagChaves = Object.entries((pag && pag.conteudo) || {}).filter(([k, v]) => ehTeste(v) || (v && typeof v === "object" && (ids.rpo.has(String(v.kitId || v.pedidoRep || "")) || ids.rpf.has(String(v.repAcertoId || ""))))).map(([k]) => k);
console.log(`Pedidos de conta de teste (pag): ${pagChaves.length}`); pagChaves.forEach((k) => console.log("  pag " + k));

// 3) espelho das listagens da equipe (módulo lst)
const m = (await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'lst'")).rows[0];
const lst = (m && m.conteudo) || {}, L = lst.listagens || [], K = lst.kits || [];
const Lf = L.filter((l) => !ids.rpo.has(String(l.id))), Kf = K.filter((k) => !ids.rpo.has(String(k.id)) && !ids.rpo.has(String(k.lid)) && !ehTeste(k));
console.log(`lst: listagens ${L.length} -> ${Lf.length}; kits ${K.length} -> ${Kf.length}`);

if (!GRAVAR) { console.log("\nSimulação. Nada foi gravado. Para gravar, rode de novo com --gravar."); await pool().end(); process.exit(0); }

for (const x of linhas) await gravarItens(x.modulo, { [x.chave]: LAPIDE("teste do app da representante apagado em 23/11/2026") }, donoDaChave(x.chave) || "app", "limpeza-teste-rep-23-11");
if (pagChaves.length) { const nulos = {}; pagChaves.forEach((k) => { nulos[k] = null; }); await gravarModulo("pag", nulos, "chaves", "limpeza-teste-rep-23-11"); }
if (m && (Lf.length !== L.length || Kf.length !== K.length)) {
  const u = await consulta("update sorelly.estado_modulo set conteudo = $1::jsonb, versao = versao + 1, atualizado_em = now(), atualizado_por = 'limpeza-teste-rep-23-11' where modulo = 'lst' and versao = $2 returning versao",
    [JSON.stringify(Object.assign({}, lst, { listagens: Lf, kits: Kf })), m.versao]);
  console.log(u.rowCount ? `lst gravado. Nova versão: ${u.rows[0].versao}.` : "lst: alguém gravou enquanto eu rodava. Rode de novo.");
}
console.log("Teste apagado.");
await pool().end();
