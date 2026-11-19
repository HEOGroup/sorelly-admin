// Apaga do servidor os registros de TESTE da conta "app:BI" (Thalita Torazzi) feitos de 06 a 12/11/2026. Pedido do Marcus em 16/11/2026.
// O que sai: 2 acertos de teste (R$ 25,00 e R$ 250,00), 2 reposições de R$ 0,00, 2 listagens do app, 1 kit, e a conferência do acerto de R$ 25,00.
// Apagar = lápide {_apagado:true} (apagar a linha não chegaria aos navegadores). Backup das linhas em sorelly.bkp_item_bi_20261116; o módulo lst tem backup próprio.
// Uso (dentro da pasta do projeto):
//   node --env-file-if-exists=.env.local scripts/limpar-teste-bi.mjs            (só mostra)
//   node --env-file-if-exists=.env.local scripts/limpar-teste-bi.mjs --gravar
import { consulta, pool } from "../src/server/db.js";
import { gravarItens } from "../src/server/estado-itens.js";
import { LAPIDE, donoDaChave } from "../src/apps/montagem/domain/app-rep.js";

const GRAVAR = process.argv.includes("--gravar");
const CHAVES = {
  rpf: ["a_rep-mw5e3lo7-rwzyixv6akk9", "a_rep-mw5hnlhz-n4r9lyxx81tp", "a_acerto-mwaygq55-x4n8q", "a_acerto-mwawnb5h-czyi6", "ax_acerto-mwaygq55-x4n8q"],
  rpo: ["l_LAmw5hxio2ig6l", "k_UAmw5hxpz4wvxi", "l_LAmwdpfum90ohy"],
};
const LST_LISTAGENS = new Set(["LAmw5hxio2ig6l", "LAmwdpfum90ohy"]);
const LST_KITS = new Set(["UAmw5hxpz4wvxi"]);

const linhas = [];
for (const [modulo, chaves] of Object.entries(CHAVES)) {
  const r = await consulta("select modulo, chave, valor from sorelly.estado_item where modulo = $1 and chave = any($2::text[])", [modulo, chaves]);
  r.rows.forEach((x) => linhas.push(x));
}
console.log(`Linhas encontradas: ${linhas.length} de ${Object.values(CHAVES).flat().length}`);
linhas.forEach((x) => console.log(`  ${x.modulo} ${x.chave} ${x.valor && x.valor._apagado ? "(já apagada)" : ""}`));
const m = (await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'lst'")).rows[0];
const lst = m.conteudo, listagensFicam = lst.listagens.filter((l) => !LST_LISTAGENS.has(l.id)), kitsFicam = lst.kits.filter((k) => !LST_KITS.has(k.id) && !LST_LISTAGENS.has(k.lid));
console.log(`lst: listagens ${lst.listagens.length} -> ${listagensFicam.length}; kits ${lst.kits.length} -> ${kitsFicam.length}`);
if (!GRAVAR) { console.log("\nSimulação. Nada foi gravado. Para gravar, rode de novo com --gravar."); await pool().end(); process.exit(0); }

await consulta("create table if not exists sorelly.bkp_item_bi_20261116 as select * from sorelly.estado_item where false");
for (const x of linhas) {
  await consulta("insert into sorelly.bkp_item_bi_20261116 select * from sorelly.estado_item where modulo = $1 and chave = $2 and not exists (select 1 from sorelly.bkp_item_bi_20261116 b where b.modulo = $1 and b.chave = $2)", [x.modulo, x.chave]);
}
await consulta("create table if not exists sorelly.bkp_lst_20261116b as select * from sorelly.estado_modulo where modulo = 'lst'");
for (const x of linhas) {
  if (x.valor && x.valor._apagado) continue;
  await gravarItens(x.modulo, { [x.chave]: LAPIDE("teste da conta BI apagado em 16/11/2026") }, donoDaChave(x.chave) || "app", "limpeza-teste-bi-16-11");
}
const u = await consulta(
  "update sorelly.estado_modulo set conteudo = $1::jsonb, versao = versao + 1, atualizado_em = now(), atualizado_por = 'limpeza-teste-bi-16-11' where modulo = 'lst' and versao = $2 returning versao",
  [JSON.stringify(Object.assign({}, lst, { listagens: listagensFicam, kits: kitsFicam })), m.versao]);
console.log(u.rowCount ? `lst gravado. Nova versão: ${u.rows[0].versao}.` : "lst: alguém gravou enquanto eu rodava (versão mudou). Rode de novo.");
console.log("Linhas do app apagadas com lápide. Backup em sorelly.bkp_item_bi_20261116.");
await pool().end();
