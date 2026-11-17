// Teste: a conta direcionada volta ao Atendimento com a chave Pix (17/11/2026). Dados INVENTADOS. Uso: node scripts/testar-chave-da-parte.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { chaveDaParte } = await jiti.import("@/apps/montagem/lib/chave-da-parte");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const s = {
  px:{contas:[{id:"PIX - SICREDI - SERENITY - 59", label:"PIX - SICREDI - SERENITY - 59", caixaId:"c1", chave:"teste.serenity@exemplo.com", chaveTipo:"EMAIL"}]},
  saldosContas:{blocos:[{id:"59", nome:"Serenity · 59"}], contas:[{id:"c1", nome:"Sicredi Serenity 59", bloco:"59"}]},
  cp:{destinos:[{id:"d1", nome:"CNPJ 59", tipo:"CNPJ", cnpjId:"59"}, {id:"d2", nome:"Fornecedor Teste", tipo:"FORNECEDOR", cnpjId:""}], chaves:{f1:{nome:"Fornecedor Teste", chave:"11111111000191", chaveTipo:"CNPJ", banco:"Banco Teste"}}, func:{}}
};
const a = chaveDaParte(s, "CNPJ 59 · PIX - SICREDI - SERENITY - 59");
t("conta da empresa devolve a chave", a && a.chave==="teste.serenity@exemplo.com" && a.empresa===true, JSON.stringify(a));
const b = chaveDaParte(s, "Fornecedor Teste");
t("fornecedor devolve a chave do cadastro", b && b.chave==="11111111000191" && b.dados && b.dados.nome==="Fornecedor Teste", JSON.stringify(b));
t("sem conta devolve nada", chaveDaParte(s, "—")===null && chaveDaParte(s, "")===null);
t("destino desconhecido devolve nada", chaveDaParte(s, "Ninguém · conta x")===null);
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
