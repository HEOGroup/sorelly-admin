// Teste: lista de CONTA PAGADORA da Família (Marcus, 22/11/2026): escrita padrão, sem conta de prestador e sem repetida. Dados INVENTADOS.
// Uso: node scripts/testar-conta-pagadora.mjs
import fs from "node:fs";
import path from "node:path";
const raiz = process.cwd();
const src = fs.readFileSync(path.join(raiz, "src/apps/montagem/pages/FinFamiliar.js"), "utf8");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
// o teste lê as regras direto do arquivo da tela: confere que existem e que a lista usa a função certa
t("contaLabel usa a escrita padrão (bancoDeConta e rotuloPrestadorFamilia)", /var contaLabel = function[^]*bancoDeConta\([^]*rotuloPrestadorFamilia\(/.test(src));
t("existe contasPagadoras que tira prestador e repetida", /var contasPagadoras = function\(ff\)[^]*b\.prestadorId[^]*vistos\[n\]/.test(src));
t("Pagar usa contasPagadoras", /opContas = \[\["", "Não definida"\]\]\.concat\(contasPagadoras\(c\.ff\)/.test(src));
t("pagamento editado usa contasPagadoras", /opContas = \[\["", "Não definida"\]\]\.concat\(contasPagadoras\(p\.c\.ff\)/.test(src));
t("Editar conta usa contasPagadoras", /var ctas = contasPagadoras\(ff\)/.test(src));
t("não sobrou o rótulo antigo Banco — Nome", !/c\.banco\+" — "\+c\.nome/.test(src));
console.log("\n"+ok+" ok, "+falha+" com falha");
process.exit(falha ? 1 : 0);
