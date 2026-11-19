// Teste: o Direcionar/Atendimento puxam a chave Pix do prestador da família e de fornecedor com nome escrito diferente (18/11/2026). Dados INVENTADOS. Uso: node scripts/testar-chaves-destinos.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const cd = await jiti.import("@/apps/montagem/lib/chave-do-destino");
const cdp = await jiti.import("@/apps/montagem/lib/chave-da-parte");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const s = {
  ff:{ prest:[{id:"p1", nome:"Prestadora Alfa", ativo:true, chavePix:"alfa@teste.com", responsavelId:"a"}, {id:"p2", nome:"Prestadora Alfa Dois", ativo:true, chavePix:"CPF", responsavelId:"b"},
              {id:"p3", nome:"Prestador Gama", ativo:true, chavePix:"", responsavelId:"a"}, {id:"p4", nome:"Prestador Delta", ativo:true, chavePix:"", responsavelId:"a"}],
       contasBanc:[{id:"cb1", nome:"Conta Gama", banco:"Banco Teste", chavePix:"gama-chave-conta", prestadorId:"p3"}], dividas:[], repasses:[] },
  cp:{ destinos:[{id:"d1", nome:"Prestadora Alfa", tipo:"PRESTADOR", prestFamId:"p1"}, {id:"d2", nome:"Prestadora Alfa Dois", tipo:"PRESTADOR", prestFamId:"p2"}, {id:"d3", nome:"Prestador Gama", tipo:"PRESTADOR", prestFamId:"p3"},
        {id:"d4", nome:"Prestador Delta", tipo:"PRESTADOR", prestFamId:"p4"}, {id:"d5", nome:"Mega Teste", tipo:"FORNECEDOR"}, {id:"d6", nome:"Arte Teste Bruto", tipo:"FORNECEDOR"}, {id:"d7", nome:"Fornecedor Sem Cadastro", tipo:"FORNECEDOR"}],
       chaves:{ f1:{nome:"MegaTeste", chave:"11222333000144", chaveTipo:"CNPJ", banco:"Banco A"}, f2:{nome:"Arte Teste", chave:"arte@teste.com", banco:"Banco B"} }, func:{} },
  px:{contas:[]}, saldosContas:{contas:[], blocos:[]} };
const g = (id) => cd.chavesDoDestino(s, s.cp.destinos.find(d => d.id===id));
t("prestador da família: chave do cadastro dele", g("d1").length===1 && g("d1")[0].chave==="alfa@teste.com", JSON.stringify(g("d1")));
t("não confunde Alfa com Alfa Dois (cada um a sua)", g("d2").length===0, JSON.stringify(g("d2")));   // chave 'CPF' é placeholder: sem chave
t("texto CPF não conta como chave", !cd.chaveValida("CPF") && !cd.chaveValida("A preencher") && !cd.chaveValida("") && cd.chaveValida("alfa@teste.com"));
t("sem chave no prestador: usa a da conta ligada a ele", g("d3").length===1 && g("d3")[0].chave==="gama-chave-conta" && g("d3")[0].banco==="Banco Teste", JSON.stringify(g("d3")));
t("sem nenhuma chave: devolve vazio (não inventa)", g("d4").length===0);
t("fornecedor com nome escrito diferente (Mega Teste x MegaTeste)", g("d5").length===1 && g("d5")[0].chave==="11222333000144", JSON.stringify(g("d5")));
t("fornecedor com nome mais longo (Arte Teste Bruto x Arte Teste)", g("d6").length===1 && g("d6")[0].chave==="arte@teste.com", JSON.stringify(g("d6")));
t("fornecedor sem cadastro: vazio", g("d7").length===0);
// no Atendimento: a conta direcionada vem como "Destino · conta"
const a = cdp.chaveDaParte(s, "Prestadora Alfa");
t("Atendimento mostra a chave da conta direcionada ao prestador da família", a && a.chave==="alfa@teste.com", JSON.stringify(a));
t("Atendimento mostra a chave de fornecedor com nome diferente", (cdp.chaveDaParte(s, "Mega Teste") || {}).chave==="11222333000144");
t("sem chave: Atendimento não mostra nada", cdp.chaveDaParte(s, "Prestador Delta")===null);
// Greicy universal e gravação das chaves
const s2 = JSON.parse(JSON.stringify(s)); s2.ff.prest.push({id:"p5", nome:"Greicy", ativo:true, chavePix:"universal-chave", responsavelId:"a"}, {id:"p6", nome:"Greicy Anamaria", ativo:true, chavePix:"", responsavelId:"b"}, {id:"p7", nome:"Greyci Ana Beatriz", ativo:true, chavePix:"CPF", responsavelId:"c"});
const h = (nome) => cd.chavesDoDestino(s2, {nome, tipo:"PRESTADOR", prestFamId:s2.ff.prest.find(x => x.nome===nome).id});
t("Greicy de outro sócio usa a chave universal", h("Greicy Anamaria")[0] && h("Greicy Anamaria")[0].chave==="universal-chave" && h("Greyci Ana Beatriz")[0].chave==="universal-chave", JSON.stringify(h("Greicy Anamaria")));
const gr = cd.chavesParaGravar(s2).map(x => x.nome).sort();
t("chaves a gravar no servidor: só quem não tem chave válida e tem por outro caminho", JSON.stringify(gr)===JSON.stringify(["Greicy Anamaria","Greyci Ana Beatriz","Prestador Gama","Prestadora Alfa Dois"].filter(n => n!=="Prestadora Alfa Dois")), JSON.stringify(gr));
// nomes padronizados em 19/11/2026: Greicy Marcus, Greicy Anamaria, Greicy Ana Beatriz (a chave universal e o arquivo local pelo nome antigo continuam valendo)
const s3 = JSON.parse(JSON.stringify(s)); s3.ff.prest.push({id:"q5", nome:"Greicy Marcus", ativo:true, chavePix:"universal-nova", responsavelId:"a"}, {id:"q6", nome:"Greicy Anamaria", ativo:true, chavePix:"", responsavelId:"b"}, {id:"q7", nome:"Greicy Ana Beatriz", ativo:true, chavePix:"CPF", responsavelId:"c"});
const h3 = (nome) => cd.chavesDoDestino(s3, {nome, tipo:"PRESTADOR", prestFamId:s3.ff.prest.find(x => x.nome===nome).id});
t("nomes padronizados: Greicy Anamaria e Greicy Ana Beatriz usam a chave da Greicy Marcus", h3("Greicy Anamaria")[0] && h3("Greicy Anamaria")[0].chave==="universal-nova" && h3("Greicy Ana Beatriz")[0] && h3("Greicy Ana Beatriz")[0].chave==="universal-nova", JSON.stringify([h3("Greicy Anamaria"), h3("Greicy Ana Beatriz")]));
console.log(ok+" ok, "+falha+" falha"); process.exit(falha ? 1 : 0);
