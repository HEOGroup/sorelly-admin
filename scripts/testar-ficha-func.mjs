// Teste do formulário dos funcionários (sem banco e sem navegador): validação das respostas, permissão, código do link, mensagem de WhatsApp e desenho das telas. Uso: node scripts/testar-ficha-func.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"", origin:"https://sorelly.exemplo" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const srv = await jiti.import("@/server/ficha-func");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
const recusa = (b) => { try { srv.validarFicha(b); return ""; } catch(x){ return String(x.message); } };

// validação
const bom = srv.validarFicha({ telefone:" 41 99999-0000 ", email:"a@b.com", cep:"80.000-000", cpf:"123.456.789-00", nascimento:"1990-05-20", uf:"PR", estadoCivil:"Casada(o)", dependentes:"2", rua:"  Rua   A  ", desconhecido:"x", salario:"99999", cbo:"1234" });
t("limpa e aceita as respostas certas", bom.telefone==="41 99999-0000" && bom.cep==="80000000" && bom.cpf==="12345678900" && bom.rua==="Rua A" && bom.dependentes==="2" && bom.uf==="PR");
t("ignora o que não é do formulário (salário, CBO, campos soltos)", !("salario" in bom) && !("cbo" in bom) && !("desconhecido" in bom));
t("CPF com menos de 11 números é recusado", /11 números/.test(recusa({ cpf:"123" })));
t("CEP com menos de 8 números é recusado", /8 números/.test(recusa({ cep:"800" })));
t("e-mail errado é recusado", /e-mail/i.test(recusa({ email:"sem-arroba" })));
t("opção fora da lista é recusada", /opção válida/.test(recusa({ uf:"XX" })));
t("data de nascimento no futuro ou inventada é recusada", /data/i.test(recusa({ nascimento:"2999-01-01" })) && /data/i.test(recusa({ nascimento:"20/05/1990" })));
t("formulário vazio é recusado", /pelo menos um/.test(recusa({})) && /pelo menos um/.test(recusa({ telefone:"   " })));
t("texto muito grande é cortado no limite", srv.validarFicha({ rua:"a".repeat(500) }).rua.length===120);
// permissão e código
t("diretoria e RH abrem; outros setores e visitante não", srv.podeFicha({ perfil:"ADMIN", setores:[] }) && srv.podeFicha({ perfil:"USER", setores:["rh"] }) && !srv.podeFicha({ perfil:"USER", setores:["financeiro"] }) && !srv.podeFicha(null));
const c1 = srv.novoCodigo(), c2 = srv.novoCodigo();
t("código do link: 16 letras, aleatório e diferente a cada vez", /^[A-Za-z0-9]{16}$/.test(c1) && c1!==c2);
t("limite de envios por endereço", (() => { const ch = "teste-"+Date.now(); let n = 0; for(let i = 0; i < 12; i++) if(srv.limiteFicha(ch)) n++; return n===10; })());
// mensagem e telas
const form = await jiti.import("@/apps/montagem/pages/rh/FormularioFunc");
const msg = form.mensagemFormulario("Ana Paula de Almeida", "https://sorelly.exemplo/meus-dados/ABC");
t("mensagem de WhatsApp: oi, atualização cadastral e o link", /^Oi, Ana!/.test(msg) && /atualização cadastral/.test(msg) && msg.includes("https://sorelly.exemplo/meus-dados/ABC") && msg.split(String.fromCharCode(10)).length===1);
t("mensagem para a Maria existe", /Maria/.test(form.MENSAGEM_MARIA) && /telefone/.test(form.MENSAGEM_MARIA));
t("telefone: põe o 55 e formata para ler", form.foneDigitos("(41) 99529-4031")==="5541995294031" && form.foneTexto("41995294031")==="(41) 99529-4031" && form.foneTexto("4133334444")==="(41) 3333-4444");
t("telefone: aceita o que já vem com 55 e recusa número incompleto", form.foneDigitos("+55 41 99529-4031")==="5541995294031" && form.foneDigitos("12345")==="" && form.foneDigitos("")==="");
t("link do WhatsApp com a mensagem pronta", form.whatsappLink("41995294031", "Oi *Ana*")==="https://wa.me/5541995294031?text=Oi%20*Ana*" && form.whatsappLink("", "x")==="");
const rhm = await jiti.import("@/apps/montagem/domain/rh");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const rh = rhm.rhDemo(), c = { s:{ usuario:16, rh }, rh, d(){}, por:"Teste", veSalario:true };
try { const html = renderToString(React.createElement(form.FormularioFuncJanela, { c, fechar(){} })); t("janela do RH desenha", /Formulário dos funcionários/.test(html) &&  /Msg para a Maria/.test(html)); } catch(x){ t("janela do RH desenha", false, String(x && x.stack || x).slice(0, 300)); }
// a página pública (JSX) é conferida pelo build do Next (npm run conferir)
console.log("\n"+ok+" verificações OK, "+falha+" com falha."); process.exit(falha ? 1 : 0);
