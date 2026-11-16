// Limpa do servidor (módulo lst: listagens e kits) o que é DEMONSTRAÇÃO. Pedido do Marcus em 16/11/2026: "tudo que é de demonstração precisamos excluir".
// O que sai:  as 3 listagens de exemplo (LEX1, LEX2, LEX3 e os kits KX*) e a listagem de teste da Anamaria (L1794239012864) com os 14 kits de nomes inventados.
// O que FICA: listagens do app real (L Amw...), a listagem real de 07/11 (LR1107-*) e a do Nagela (1 kit com nome real).
// Uso (dentro da pasta do projeto):
//   node --env-file-if-exists=.env.local scripts/limpar-demo-lst.mjs            (só mostra o que sairia; não grava nada)
//   node --env-file-if-exists=.env.local scripts/limpar-demo-lst.mjs --gravar   (faz backup em sorelly.bkp_lst_20261116 e grava, travando pela versão lida)
import { consulta, pool } from "../src/server/db.js";

const GRAVAR = process.argv.includes("--gravar");
const LISTAGENS_DEMO = new Set(["LEX1", "LEX2", "LEX3", "L1794239012864"]);

const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'lst'");
if (!r.rows.length) { console.log("Módulo lst não existe. Nada a fazer."); await pool().end(); process.exit(0); }
const { conteudo, versao } = r.rows[0];
const listagens = conteudo.listagens || [], kits = conteudo.kits || [];

const sai = (k) => LISTAGENS_DEMO.has(k.lid);
const listagensFicam = listagens.filter((l) => !LISTAGENS_DEMO.has(l.id));
const kitsFicam = kits.filter((k) => !sai(k));

console.log(`Versão lida: ${versao}`);
console.log(`Listagens: ${listagens.length} -> ${listagensFicam.length} (saem ${listagens.length - listagensFicam.length})`);
console.log(`Kits: ${kits.length} -> ${kitsFicam.length} (saem ${kits.length - kitsFicam.length})`);
listagens.filter((l) => LISTAGENS_DEMO.has(l.id)).forEach((l) => console.log(`  sai ${l.id} | ${l.rep} | ${l.data} | ${kits.filter((k) => k.lid === l.id).length} kits`));
const orfaos = kitsFicam.filter((k) => !listagensFicam.some((l) => l.id === k.lid));
if (orfaos.length) console.log(`ATENÇÃO: ${orfaos.length} kits que ficam sem listagem (já era assim antes). Não mexi.`);

if (!GRAVAR) { console.log("\nSimulação. Nada foi gravado. Para gravar, rode de novo com --gravar."); await pool().end(); process.exit(0); }

await consulta("create table if not exists sorelly.bkp_lst_20261116 as select * from sorelly.estado_modulo where modulo = 'lst'");
const n = await consulta("select count(*)::int as n from sorelly.bkp_lst_20261116");
if (!n.rows[0].n) throw new Error("Backup vazio: parei sem gravar.");
const novo = Object.assign({}, conteudo, { listagens: listagensFicam, kits: kitsFicam });
const u = await consulta(
  "update sorelly.estado_modulo set conteudo = $1::jsonb, versao = versao + 1, atualizado_em = now(), atualizado_por = 'limpeza-demo-16-11' where modulo = 'lst' and versao = $2 returning versao",
  [JSON.stringify(novo), versao]);
if (!u.rowCount) console.log("Alguém gravou o módulo lst enquanto eu rodava (versão mudou). Nada foi gravado: rode de novo.");
else console.log(`Gravado. Nova versão: ${u.rows[0].versao}. Backup em sorelly.bkp_lst_20261116.`);
await pool().end();
