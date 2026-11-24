// Teste: cruzamento Admin x DevMaster para Pix pago adiantado e para prestador (24/11/2026, Marcus: "pendente na DevMaster, mas já somado no pago"). Dados INVENTADOS. Uso: node scripts/testar-casar-pagos.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const cp = await jiti.import("@/apps/montagem/domain/casar-pagos");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };

const titulo = (id, nome, natNome, venc, valor, canon) => ({ id, status:"apagar", nome, natNome, venc, valor, valorTitulo:valor, fornCanon:canon || "", mes:venc.slice(0, 7), atraso:0 });
const lista = [
  titulo("a1", "Xangai Comercio", "Pix Xangai", "2026-11-30", 4801.85, "Xangai"),
  titulo("a2", "Pix Pontual", "Pix Pontual", "2026-11-30", 934.5, "Pontual"),
  titulo("a3", "Pix Higor Fernando Goulart de Oliveira", "Adiantamento", "2026-11-19", 627.2, ""),
  titulo("a4", "Pix Pontual", "Pix Pontual", "2026-12-30", 934.5, "Pontual"),   // mesmo valor, um mês depois: NÃO pode casar
  titulo("a5", "Pix Outra Pessoa", "Pix", "2026-11-19", 627.2, ""),            // mesmo valor e data, outro nome: NÃO pode casar
];
const parcelas = [
  { id:"p1", canon:"Xangai", venc:"2026-11-30", pagoEm:"2026-11-24", valor:4801.85, tipo:"pix", ped:"Pedido 1" },
  { id:"p2", canon:"Pontual", venc:"2026-11-29", pagoEm:"2026-11-24", valor:934.5, tipo:"pix", ped:"Pedido 2" },
  { id:"L9", canon:"", prest:"higor", venc:"2026-11-19", pagoEm:"2026-11-19", valor:627.2, tipo:"pix", ped:"Lançamento 9" },
];
const r = cp.casarPagos(lista, parcelas), por = (id) => r.find((x) => x.id===id);
t("Pix de fornecedor pago adiantado vira PAGO", por("a1").status==="pago" && por("a1").faltaBaixaDm===true);
t("a baixa conta na data em que saiu o dinheiro (24/11), não no vencimento futuro", por("a1").baixa==="2026-11-24" && por("a1").mes==="2026-11", por("a1").baixa);
t("Pix Pontual (parcela de 29/11, título de 30/11) casa", por("a2").status==="pago" && por("a2").faltaBaixaDm===true);
t("prestador casa pelo primeiro nome, valor e data", por("a3").status==="pago" && por("a3").faltaBaixaDm===true && por("a3").baixa==="2026-11-19");
t("título do mês seguinte com o mesmo valor continua em aberto", por("a4").status==="apagar");
t("mesmo valor e data, mas outro nome, continua em aberto", por("a5").status==="apagar");
const r2 = cp.casarPagos(lista, parcelas);
t("rodar de novo dá o mesmo resultado", JSON.stringify(r2.map((x) => x.status)) === JSON.stringify(r.map((x) => x.status)));
const xg = cp.casarPagos([titulo("x1", "Xangai Comercio Importacao e Exportacao de Bijuterias LTDA", "Xangai Comercio Importacao e Exportacao de Bi", "2026-11-30", 4801.85, "Xangai Comercio Importacao e Exportacao de Bi"), titulo("x2", "Xangai Comercio Importacao e Exportacao de Bijuterias LTDA", "Xangai Comercio Importacao e Exportacao de Bi", "2026-11-30", 2057.95, "Xangai Comercio Importacao e Exportacao de Bi")], parcelas);
t("título só com o nome do fornecedor (Xangai) casa pelo valor exato", xg[0].status==="pago" && xg[1].status==="apagar", xg.map((x) => x.status).join());
const so = cp.casarPagos([titulo("b1", "Pix Higor X", "Pix", "2026-11-19", 100, "")], [{ id:"L1", canon:"", prest:"higor", venc:"2026-11-19", pagoEm:"2026-11-19", valor:100, tipo:"pix", ped:"x" }, { id:"L2", canon:"", prest:"higor", venc:"2026-11-19", pagoEm:"2026-11-19", valor:100, tipo:"pix", ped:"y" }]);
t("um lançamento de prestador baixa só UM título", so[0].status==="pago");
t("sem nenhuma parcela, a lista volta igual", cp.casarPagos(lista, []) === lista);
// statusDevmasterLanc (24/11/2026): status de cada Pix lançado em Pagamentos a fornecedores na DevMaster
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener() {}, location: { search: "" } };
const ce = await jiti.import("@/apps/montagem/domain/contas-empresa");
ce.definirContasServidor({
  apagar: [["01", "5.01", "Pix Pontual", "BAN", "1", "01", "000100", "Pix Pontual", "2026-11-10", "2026-11-30", 5000, 5000, 0],
    ["01", "5.01", "Pix Higor", "ADM", "2", "01", "000200", "Pix Higor Fernando", "2026-11-19", "2026-11-19", 627.2, 627.2, 0]],
  pagas: [["01", "5.01", "Pix Pontual", "BAN", "3", "01", "000100", "Pix Pontual", "2026-11-10", "2026-11-10", 3000],
    ["01", "3.06", "Pix Camilly Souza", "ADM", "4", "01", "000300", "Pix Camilly Souza", "2026-11-12", "2026-11-12", 150]],
  geradoEm: "teste" });
const pfx = { fornecedores: [{ id: 1, nome: "Pontual", tipo: "fornecedor" }, { id: 2, nome: "Ellos Galvânica", tipo: "fornecedor" }, { id: 9, nome: "Higor", tipo: "prestador" }, { id: 10, nome: "Camilly", tipo: "prestador" }], pedidos: [],
  lancamentos: [{ id: 1, fornId: 1, data: "2026-11-05", valor: 100, revendedora: "A" }, { id: 2, fornId: 1, data: "2026-11-20", valor: 200, revendedora: "B" }, { id: 3, fornId: 2, data: "2026-11-20", valor: 300, revendedora: "C" },
    { id: 4, fornId: 9, data: "2026-11-19", valor: 627.2 }, { id: 5, fornId: 10, data: "2026-11-12", valor: 150 }, { id: 6, fornId: 10, data: "2026-11-12", valor: 999 }] };
const st = ce.statusDevmasterLanc(pfx);
t("Pix de antes da última baixa de Pix do fornecedor = confirmado", st[1] === "confirmado", st[1]);
t("Pix depois da última baixa e título aberto = falta baixa", st[2] === "falta", st[2]);
t("fornecedor sem nenhum título na DevMaster = sem título", st[3] === "sem", st[3]);
t("prestador com título aberto igual = falta baixa", st[4] === "falta", st[4]);
t("prestador com título já pago igual = confirmado", st[5] === "confirmado", st[5]);
t("prestador sem título que case = sem título", st[6] === "sem", st[6]);
console.log("\n"+ok+" ok, "+falha+" falha(s)");
process.exit(falha ? 1 : 0);
