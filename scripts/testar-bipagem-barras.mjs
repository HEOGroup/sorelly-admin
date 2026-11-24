// Teste da bipagem por número de barras (24/11/2026): a câmera lê o número da etiqueta (aaa_codbarras da DevMaster) e a conferência acha a peça; digitar o código escrito também vale.
// Roda as regras de verdade (domain/conferencia-pecas.js), sem navegador, sem servidor e sem banco. Uso: node scripts/testar-bipagem-barras.mjs   (saída 1 = alguma verificação falhou)
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { bipar, resultado } = await jiti.import("@/apps/montagem/domain/conferencia-pecas");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra!==undefined ? " -> "+extra : "")); } };
const it = (codigo, barras, qtd) => ({codigo, barras, desc:"PEÇA "+codigo, valor:88, qtd});
// duas condicionais da mesma revendedora, com as peças e os números de barras reais conferidos na DevMaster em 24/11/2026
const conds = [
  {numero:"A1", grupos:[{cod:"CL", nome:"Colares", itens:[it("CL2542", "00032358", 2), it("CK0571", "00034321", 1)]}]},
  {numero:"B2", grupos:[{cod:"B", nome:"Brincos", itens:[it("B5053", "00034299", 1), it("B4113", "", 1)]}]} ];
let c = {};
c = bipar(conds, c, "00032358");
t("número de barras de uma peça marca a peça certa (CL2542)", (c.lidos||{})["A1|CL2542"]===1 && c.ultimo.tipo==="ok" && c.ultimo.codigo==="CL2542", JSON.stringify(c.ultimo));
c = bipar(conds, c, "32358");
t("o mesmo número sem os zeros da frente também vale", (c.lidos||{})["A1|CL2542"]===2, JSON.stringify(c.lidos));
c = bipar(conds, c, "00032358");
t("peça com todas as unidades lidas, lida de novo: só avisa, não conta", c.ultimo.tipo==="repetida" && c.lidos["A1|CL2542"]===2, JSON.stringify(c.ultimo));
c = bipar(conds, c, "ck0571");
t("código escrito digitado vale, em minúscula também (CK0571)", c.lidos["A1|CK0571"]===1 && c.ultimo.tipo==="ok");
c = bipar(conds, c, "00034299");
t("peça da segunda condicional é achada junto (as condicionais formam um kit só)", c.lidos["B2|B5053"]===1);
c = bipar(conds, c, "00099999");
t("número que não é de nenhuma peça do kit vira peça de fora e fica registrado", c.ultimo.tipo==="fora" && c.erros.length===1 && c.erros[0].codigo==="00099999");
const antes = JSON.stringify(c.lidos); c = bipar(conds, c, "0003");
t("número curto (menos de 4 dígitos) não casa com número de barras por engano", c.ultimo.tipo==="fora" && JSON.stringify(c.lidos)===antes);
c = bipar(conds, c, "B4113");
t("peça sem número de barras no cadastro ainda vale pelo código digitado", c.lidos["B2|B4113"]===1);
const r = resultado(conds, c);
t("resultado: 5 de 5 peças lidas, sem faltas, e duas peças de fora registradas", r.lidas===5 && r.esperadas===5 && r.nFaltas===0 && r.nSobras===2, JSON.stringify({l:r.lidas, e:r.esperadas, f:r.nFaltas, s:r.nSobras}));
const r2 = resultado(conds, bipar(conds, {}, "00032358"));
t("faltou peça: as que não foram lidas viram erro de quem bipou o kit na empresa", r2.nFaltas===4 && r2.erros===4, r2.nFaltas);
console.log("\n"+ok+" certos, "+falha+" falhas"); process.exit(falha ? 1 : 0);
