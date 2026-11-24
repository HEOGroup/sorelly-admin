// Teste (23/11/2026): ficha da revendedora e pedido de nova data da representante vão para o servidor (pr_, pd_) e voltam para a equipe.
// Uso: node scripts/testar-ficha-pedido-rep.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti"; import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { espelharRep, aplicarAppNoEstado } = await jiti.import("@/apps/montagem/domain/app-rep");
let ok = 0, falha = 0; const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
// navegador da representante: ficha preenchida e um pedido de data
const s = {rpo:{}, rpf:{}, _rpoPronto:true, _rpfPronto:true, listagens:[], kits:[], acertosConsignado:[], entregasKN:{},
  perfisRev:{"Maria Teste":{revCod:"123456", fone2:"41999990000", enderecoCasa:"Rua A, 1", enderecoTrabalho:"", profissao:"Manicure", refs:[{nome:"Ana", rel:"Irmã", fone:"41988887777"},{nome:"",rel:"",fone:""},{nome:"",rel:"",fone:""}]}},
  p45:{pedidos:[{id:"d1", rep:"Vanessa", nome:"Maria Teste", dataAtual:"2026-11-25", novaData:"2026-12-05", status:"analise", motivo:"Doença"}]}};
const m = espelharRep(s, "9S", "Vanessa");
t("ficha sobe como pr_123456", m && m.rpo && m.rpo.pr_123456 && m.rpo.pr_123456.fone2==="41999990000" && m.rpo.pr_123456.rev==="Maria Teste", JSON.stringify(m && m.rpo));
t("ficha leva também o formato do app da loja (telefone2, referencias)", m.rpo.pr_123456.telefone2==="41999990000" && m.rpo.pr_123456.referencias[0].relacao==="Irmã");
t("pedido de data sobe como pd_9S-d1", m.rpo["pd_9S-d1"] && m.rpo["pd_9S-d1"].novaData==="2026-12-05" && m.rpo["pd_9S-d1"].repCod==="9S");
// segunda passada com o servidor já igual: não manda de novo
const s2 = Object.assign({}, s, {rpo:Object.assign({}, m.rpo)});
t("nada novo para enviar quando o servidor já tem igual", espelharRep(s2, "9S", "Vanessa")===null);
// navegador da equipe: recebe do servidor
const eq = {rpo:m.rpo, rpf:{}, listagens:[], kits:[], acertosConsignado:[], perfisRev:{}, p45:{pedidos:[]}};
const p = aplicarAppNoEstado(eq, false);
t("equipe vê a ficha no nome da revendedora", p.perfisRev && p.perfisRev["Maria Teste"] && p.perfisRev["Maria Teste"].profissao==="Manicure" && p.perfisRev["Maria Teste"].refs[0].nome==="Ana", JSON.stringify(p.perfisRev));
t("equipe vê o pedido de data em Plano 45/60", p.p45 && p.p45.pedidos.length===1 && p.p45.pedidos[0].id==="pd-9S-d1" && p.p45.pedidos[0].status==="analise");
const p2 = aplicarAppNoEstado(Object.assign({}, eq, {p45:p.p45, perfisRev:p.perfisRev}), false);
t("segunda chegada não duplica", !p2.p45 && !p2.perfisRev);
console.log(ok+" certos, "+falha+" falhas"); process.exit(falha ? 1 : 0);
