// Teste: PIX ANTES DO ACERTO lançado em CONTAS A RECEBER (20/11/2026). Dados INVENTADOS (nada de revendedora real, nada de banco).
// Confere: validação do lançamento, Pix da empresa que o acerto consome (e não consome duas vezes), cópia na Família igual à ação pix_add do reducer
// (Pix "Aguardando" + UM repasse), comprovante, linhas da tela (com e sem acesso à Família) e os 4 Pix que já estavam na Família (adotados).
// Uso: node scripts/testar-recebimento-antecipado.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, location:{ search:"" } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const { reducer } = await jiti.import("@/apps/montagem/state/reducer");
const { novo: inicial } = await jiti.import("@/apps/montagem/state/store");
const ffm = await jiti.import("@/apps/montagem/domain/financeiro-familiar");
const pa = await jiti.import("@/apps/montagem/domain/pix-adiantados");
const ra = await jiti.import("@/apps/montagem/domain/recebimentos-antecipados");
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };
const HOJE = "2026-11-20";

// ---------- 1) validação do lançamento ----------
console.log("1) validação");
const base = {data:"2026-11-19", valor:1000, rev:"Rev Teste Silva de Souza", destino:"empresa", contaTxt:"Sicredi 34"};
t("lançamento certo passa", !!ra.validarLancamento(base, HOJE, []).item);
t("data futura recusada", /futura/.test(ra.validarLancamento(Object.assign({}, base, {data:"2026-12-01"}), HOJE, []).erro || ""));
t("data vazia recusada", !!ra.validarLancamento(Object.assign({}, base, {data:""}), HOJE, []).erro);
t("valor zero recusado", !!ra.validarLancamento(Object.assign({}, base, {valor:0}), HOJE, []).erro);
t("valor negativo recusado", !!ra.validarLancamento(Object.assign({}, base, {valor:-5}), HOJE, []).erro);
t("nome com uma palavra só recusado", !!ra.validarLancamento(Object.assign({}, base, {rev:"Karine"}), HOJE, []).erro);
t("nome vazio recusado", !!ra.validarLancamento(Object.assign({}, base, {rev:" "}), HOJE, []).erro);
t("sócio sem pessoa recusado", !!ra.validarLancamento(Object.assign({}, base, {destino:"socio"}), HOJE, []).erro);
t("sócio sem conta específica é aceito (Pix para o próprio sócio)", !!ra.validarLancamento(Object.assign({}, base, {destino:"socio", personaId:"p1"}), HOJE, []).item);
t("sócio com pessoa e conta passa", !!ra.validarLancamento(Object.assign({}, base, {destino:"socio", personaId:"p1", contaId:"cb1"}), HOJE, []).item);
const um = ra.validarLancamento(base, HOJE, []).item;
t("o mesmo Pix de novo (mesma pessoa, data e valor) é recusado", /já está lançado/.test(ra.validarLancamento(base, HOJE, [um]).erro || ""));
t("nome parecido também conta como duplicado", !!ra.validarLancamento(Object.assign({}, base, {rev:"REV TESTE SILVA"}), HOJE, [um]).erro);
t("mesmo valor em outro dia não é duplicado", !!ra.validarLancamento(Object.assign({}, base, {data:"2026-11-18"}), HOJE, [um]).item);
t("valor com centavos fica certo", ra.validarLancamento(Object.assign({}, base, {valor:634.55}), HOJE, []).item.valor===634.55);
t("espaços a mais saem do nome", ra.validarLancamento(Object.assign({}, base, {rev:"  Rev   Teste  Silva "}), HOJE, []).item.rev==="Rev Teste Silva");
t("conta de texto só vale para a empresa", ra.validarLancamento(Object.assign({}, base, {destino:"socio", personaId:"p1", contaId:"cb1", contaTxt:"x"}), HOJE, []).item.contaTxt==="");

// ---------- 2) Pix da empresa que o acerto consome ----------
console.log("2) acerto consome o Pix da empresa");
const mk = (o) => Object.assign(ra.validarLancamento(Object.assign({}, base, o), HOJE, []).item, {por:"Teste"});
let rcb = {antecipados:[
  mk({data:"2026-10-20", valor:300}),                       // antes do último acerto: fica de fora
  mk({data:"2026-11-13", valor:500, rev:"Rev Teste Silva"}),
  mk({data:"2026-11-19", valor:1000}),
  mk({data:"2026-11-15", valor:77, rev:"Outra Pessoa Qualquer"}),   // outra revendedora
], usados:{}, adotados:[]};
const lista = ra.antecipadosDe(rcb, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE, internoId:"A1"});
t("lista só os Pix dela, depois do último acerto", lista.length===2 && lista[0].valor===500 && lista[1].valor===1000, JSON.stringify(lista.map((x) => x.valor)));
t("do mais antigo para o mais novo", lista[0].data<lista[1].data);
t("a lista não traz Pix de sócio (esses saem de ff.pix)", ra.antecipadosDe({antecipados:[Object.assign({}, rcb.antecipados[2], {destino:"socio"})], usados:{}, adotados:[]}, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE}).length===0);
const ids = lista.map((x) => x.id);
const m1 = ra.sincronizarUsoRcb(rcb, {internoId:"A1", rev:"Rev Teste Silva de Souza", ids, por:"Teste", em:"2026-11-24T10:00:00Z"});
t("marca os dois", m1.marcados.length===2 && m1.recusados.length===0);
const m2 = ra.sincronizarUsoRcb(m1.rcb, {internoId:"A1", rev:"Rev Teste Silva de Souza", ids, por:"Teste"});
t("repetir a chamada não muda nada (idempotente)", m2.marcados.length===0 && m2.soltos.length===0);
const m3 = ra.sincronizarUsoRcb(m1.rcb, {internoId:"A2", rev:"Rev Teste Silva de Souza", ids, por:"Teste"});
t("outro acerto NÃO usa o mesmo Pix", m3.marcados.length===0 && m3.recusados.length===2);
t("outro acerto nem vê o Pix na lista", ra.antecipadosDe(m1.rcb, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE, internoId:"A2"}).length===0);
t("o próprio acerto continua vendo (meu = true)", ra.antecipadosDe(m1.rcb, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE, internoId:"A1"}).every((x) => x.meu));
const m4 = ra.sincronizarUsoRcb(m1.rcb, {internoId:"A1", rev:"Rev Teste Silva de Souza", ids:[ids[1]], por:"Teste"});
t("tirar a linha do acerto solta o Pix", m4.soltos.length===1 && m4.soltos[0]===ids[0] && !m4.rcb.usados[ids[0]] && !!m4.rcb.usados[ids[1]]);
const m5 = ra.sincronizarUsoRcb(rcb, {internoId:"A1", rev:"Rev Totalmente Outra", ids, por:"Teste"});
t("Pix de outra revendedora é recusado", m5.marcados.length===0 && m5.recusados.length===2);
t("Pix que não existe é recusado", ra.sincronizarUsoRcb(rcb, {internoId:"A1", rev:"Rev Teste Silva de Souza", ids:["ra_nao_existe"], por:"T"}).recusados.length===1);
t("sem atendimento nada marca", ra.sincronizarUsoRcb(rcb, {internoId:"", rev:"Rev Teste Silva de Souza", ids, por:"T"}).marcados.length===0);
t("a cópia de entrada não é alterada", Object.keys(rcb.usados).length===0);

// ---------- 3) cópia na Família = mesma coisa que a ação pix_add ----------
console.log("3) cópia na Família");
const ff0 = JSON.parse(JSON.stringify(ffm.ffDemo()));
ff0.personas = [{id:"p1", nome:"Sócio Um", ativo:true, tipo:"SOCIO"}];
ff0.prest = [{id:"pr1", nome:"Prestador Alfa", ativo:true, servico:"", chavePix:"", responsavelId:"p1"}];
ff0.contasBanc = [{id:"cb1", nome:"Banco Alfa", prestadorId:"pr1", ativo:true, chavePix:"chave-alfa"}, {id:"cb2", nome:"Conta Solta", prestadorId:"", ativo:true, chavePix:""}];
ff0.dividas = []; ff0.repasses = []; ff0.pix = []; ff0.hist = [];
const args = {personaId:"p1", contaId:"cb1", data:"2026-11-19", valor:1000, origem:"Rev Teste Silva de Souza"};
const viaReducer = reducer(Object.assign({}, inicial(), {ff:JSON.parse(JSON.stringify(ff0))}), Object.assign({type:"FF", op:"pix_add", forma:"PIX", por:"Teste"}, args)).ff;
const esp = ra.espelharNaFamilia(ff0, Object.assign({por:"Teste"}, args));
const campos = (x) => ["personaId", "data", "valor", "origem", "contaId", "forma", "auditoria", "auditadoPor"].map((k) => k+"="+x[k]).join("|");
t("o Pix da cópia tem os mesmos campos do pix_add", !esp.erro && campos(esp.ff.pix[0])===campos(viaReducer.pix[0]), esp.erro || campos(esp.ff.pix[0])+" x "+campos(viaReducer.pix[0]));
const rp = (ff) => ff.repasses.map((r) => ["prestId", "valor", "data", "origem", "forma", "conta", "chavePixDestino", "origemPixPersonaId"].map((k) => k+"="+r[k]).join("|"));
t("gera UM repasse igual ao do pix_add", esp.ff.repasses.length===1 && rp(esp.ff)[0]===rp(viaReducer)[0], JSON.stringify(rp(esp.ff))+" x "+JSON.stringify(rp(viaReducer)));
t("o repasse aponta para o Pix", esp.ff.repasses[0].origemPixLancId===esp.pixId && esp.ff.pix[0].id===esp.pixId);
t("grava no histórico da Família", esp.ff.hist.length===1 && esp.ff.hist[0].area==="PIX revendedoras");
t("a entrada não é alterada", ff0.pix.length===0 && ff0.repasses.length===0);
const esp2 = ra.espelharNaFamilia(ff0, Object.assign({por:"Teste"}, args, {contaId:"cb2"}));
t("conta sem prestador: entra o Pix e NÃO gera repasse", esp2.ff.pix.length===1 && esp2.ff.repasses.length===0);
t("conta que não existe é recusada", !!ra.espelharNaFamilia(ff0, Object.assign({por:"T"}, args, {contaId:"nao"})).erro);
t("pessoa que não existe é recusada", !!ra.espelharNaFamilia(ff0, Object.assign({por:"T"}, args, {personaId:"nao"})).erro);
t("Família vazia é recusada", !!ra.espelharNaFamilia({}, Object.assign({por:"T"}, args)).erro);
const espC = ra.espelharNaFamilia(ff0, Object.assign({por:"Teste"}, args, {compKey:"an_abc123def4", compNome:"c.jpg", compTipo:"image/jpeg"}));
const viaComp = reducer(Object.assign({}, inicial(), {ff:JSON.parse(JSON.stringify(viaReducer))}), {type:"FF", op:"pix_comp", id:viaReducer.pix[0].id, key:"an_abc123def4", nome:"c.jpg", tipo:"image/jpeg", por:"Teste"}).ff.pix[0];
t("comprovante na cópia = o da ação pix_comp", espC.ff.pix[0].compKey===viaComp.compKey && espC.ff.pix[0].compNome===viaComp.compNome && espC.ff.pix[0].compTipo===viaComp.compTipo);
const cc = ra.comprovanteNaFamilia(espC.ff, {pixId:espC.pixId, key:""});
t("tirar o comprovante limpa os três campos", !cc.erro && cc.ff.pix[0].compKey===undefined && cc.ff.pix[0].compNome===undefined);
t("comprovante com chave estranha é recusado", !!ra.comprovanteNaFamilia(espC.ff, {pixId:espC.pixId, key:"../etc"}).erro);
t("comprovante de Pix que não existe é recusado", !!ra.comprovanteNaFamilia(espC.ff, {pixId:"nao", key:"an_abc123def4"}).erro);
// o Pix copiado na Família continua valendo para o acerto (regra do Pix adiantado de 19/11)
t("o Pix de sócio aparece para o acerto pela regra da Família", pa.pixAdiantadosDe(espC.ff, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE}).length===1);

// ---------- 4) linhas da tela ----------
console.log("4) linhas da tela");
let ffT = JSON.parse(JSON.stringify(esp.ff));
const itemSocio = Object.assign(ra.validarLancamento(Object.assign({}, base, {destino:"socio", personaId:"p1", contaId:"cb1", valor:1000}), HOJE, []).item, {ffPixId:esp.pixId, por:"Dir", compKey:"an_rcbkey0001"});
const itemEmp = Object.assign(ra.validarLancamento(Object.assign({}, base, {valor:500, data:"2026-11-13"}), HOJE, []).item, {por:"Fin"});
// um Pix que JÁ estava na Família (caso da Karine): vem pela lista de adotados
ffT.pix.push({id:"pxantigo0001", personaId:"p1", data:"2026-11-18", valor:634.55, origem:"Rev Teste Silva de Souza", contaId:"cb1", forma:"PIX", auditoria:"PENDENTE", compKey:"an_ffkey00001"});
const rcbT = {antecipados:[itemSocio, itemEmp], usados:{}, adotados:["pxantigo0001", "pxnaoexiste"]};
const comFf = ra.linhasAntecipados(rcbT, ffT, {verFf:true}), semFf = ra.linhasAntecipados(rcbT, ffT, {verFf:false});
t("mostra os 3 Pix (2 lançados aqui + 1 que já estava na Família)", comFf.length===3, String(comFf.length));
t("adotado que não existe na Família é ignorado", !comFf.some((x) => x.id==="pxnaoexiste"));
t("do mais novo para o mais antigo", comFf[0].data>=comFf[1].data && comFf[1].data>=comFf[2].data);
t("Pix de sócio mostra a conta da Família para quem abre a Família", comFf.find((x) => x.id===itemSocio.id).conta.indexOf("Banco Alfa")===0);
t("quem NÃO abre a Família vê só 'Pix direto' (nunca o nome da conta)", semFf.filter((x) => x.destino==="socio").every((x) => x.conta==="Pix direto"));
t("Pix da empresa mostra a conta digitada", comFf.find((x) => x.id===itemEmp.id).conta==="Sicredi 34");
t("comprovante do Pix que já estava na Família só aparece para quem abre a Família", comFf.find((x) => x.id==="pxantigo0001").compKey==="an_ffkey00001" && semFf.find((x) => x.id==="pxantigo0001").compKey==="");
t("cada linha diz de que módulo é o comprovante", comFf.find((x) => x.id==="pxantigo0001").compModulo==="ff" && comFf.find((x) => x.id===itemEmp.id).compModulo==="contasreceber");
t("sem uso: ninguém consumiu ainda", comFf.every((x) => x.uso===null));
// uso: o acerto consome o Pix da empresa (módulo contasreceber) e o de sócio (ff.pixUsados)
rcbT.usados[itemEmp.id] = {internoId:"A1", rev:"Rev Teste Silva de Souza", em:"2026-11-24T10:00:00Z"};
ffT.pixUsados = {[esp.pixId]:{internoId:"A1", rev:"Rev Teste Silva de Souza", em:"2026-11-24T10:00:00Z"}};
const usadas = ra.linhasAntecipados(rcbT, ffT, {verFf:true});
t("Pix da empresa usado aparece como usado", !!usadas.find((x) => x.id===itemEmp.id).uso);
t("Pix de sócio usado (marca na Família) aparece como usado", !!usadas.find((x) => x.id===itemSocio.id).uso);
t("o que não foi usado continua livre", usadas.find((x) => x.id==="pxantigo0001").uso===null);
t("módulo vazio não quebra", ra.linhasAntecipados(null, null, {}).length===0 && ra.antecipadosDe(undefined, "Rev Teste Silva", {}).length===0);
t("garantir cria as três chaves", (() => { const g = ra.garantir({}); return Array.isArray(g.antecipados) && typeof g.usados==="object" && Array.isArray(g.adotados); })());

// ---------- 5) tipo: Pix antes do acerto x outro recebimento ----------
console.log("5) tipo do lançamento");
t("sem tipo = antes do acerto", ra.validarLancamento(base, HOJE, []).item.tipo==="antes");
t("tipo outro é guardado", ra.validarLancamento(Object.assign({}, base, {tipo:"outro"}), HOJE, []).item.tipo==="outro");
t("tipo estranho vira antes do acerto", ra.validarLancamento(Object.assign({}, base, {tipo:"qualquer"}), HOJE, []).item.tipo==="antes");
const rcbO = {antecipados:[Object.assign(ra.validarLancamento(Object.assign({}, base, {tipo:"outro"}), HOJE, []).item, {por:"T"}), Object.assign(ra.validarLancamento(Object.assign({}, base, {valor:500, data:"2026-11-13"}), HOJE, []).item, {por:"T"})], usados:{}, adotados:[]};
t("a lista do acerto NÃO traz o outro recebimento", ra.antecipadosDe(rcbO, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE}).map((x) => x.valor).join()==="500");
const idOutro = rcbO.antecipados[0].id;
const mO = ra.sincronizarUsoRcb(rcbO, {internoId:"A1", rev:"Rev Teste Silva de Souza", ids:[idOutro], por:"T"});
t("o acerto não consegue marcar o outro recebimento", mO.marcados.length===0 && mO.recusados.length===1);
t("a tela mostra o tipo de cada linha", ra.linhasAntecipados(rcbO, null, {}).map((x) => x.tipo).sort().join()==="antes,outro");
const ffS = ra.espelharNaFamilia(ff0, Object.assign({por:"T", semAcerto:true}, args));
t("cópia na Família de outro recebimento leva a marca semAcerto", ffS.ff.pix[0].semAcerto===true && esp.ff.pix[0].semAcerto===undefined);
t("o acerto não vê o Pix da Família marcado como outro recebimento", pa.pixAdiantadosDe(ffS.ff, "Rev Teste Silva de Souza", {desde:"2026-10-23", hoje:HOJE}).length===0);
t("o acerto não consegue marcar o Pix da Família de outro recebimento", pa.sincronizarUso(ffS.ff, {internoId:"A1", rev:"Rev Teste Silva de Souza", ids:[ffS.pixId], por:"T"}).marcados.length===0);

// ---------- 6) lista de contas da janela ----------
console.log("6) lista de contas");
const C = (id, nome) => ({id, nome, personaId:"marcus", banco:""});
const real = [C("a","Conta +55"), C("b","Conta Amanda Bonus"), C("c","Conta FHC Tenda"), C("d","Pix rev. Marcus"), C("e","Conta Rebel Mode"), C("f","Conta G8 Gang Performace"), C("g","Conta Higor Seguraça"), C("h","Conta Marcus — Nubank"), C("i","Conta Greicy"), C("j","Conta Greicy Anamaria"), C("k","Nubank — Conta Diego"), C("l","Conta Lucas Castilho"), C("m","Conta Marcus — Caixa"), C("n","Conta Marcus"), C("o","Conta Julia Marketing"), C("p","Conta Breno")];
const lc = ra.contasParaLista(real), nomes = lc.map((x) => x.nome);
t("as 5 primeiras seguem a ordem do Marcus", nomes.slice(0, 5).join("|")==="Nubank Marcus|Higor|68 Gang|Rebel Mode|Greicy", nomes.slice(0, 5).join("|"));
t("saem +55, Bônus Amanda, FHC Tenda, Pix rev. Marcus, Julia Marketing e Breno", nomes.length===real.length-6 && !lc.some((x) => ["a","b","c","d","o","p"].includes(x.id)));
t("nenhum nome fica com a palavra Conta", nomes.every((n) => !/\bconta\b/i.test(n)), nomes.join("|"));
t("as outras vêm em ordem alfabética depois das 5", nomes.slice(5).join("|")===nomes.slice(5).slice().sort((a, b) => a.localeCompare(b, "pt-BR")).join("|"));
t("Greicy Anamaria não é confundida com Greicy (fica depois)", nomes.indexOf("Greicy")===4 && nomes.indexOf("Greicy Anamaria")>4);
t("a conta continua com o mesmo id e o mesmo sócio", lc.find((x) => x.nome==="Higor").id==="g" && lc.every((x) => x.personaId==="marcus"));
t("Nubank — Diego perde só a palavra Conta", nomes.includes("Nubank — Diego"));
t("lista vazia ou sem nome não quebra", ra.contasParaLista([]).length===0 && ra.contasParaLista(null).length===0 && ra.contasParaLista([{id:"x"}]).length===0);

// ---------- 7) destino escolhido no menu do Direcionar ----------
console.log("7) destino do Direcionar");
const rot = (d) => (d.tipo==="PRESTADOR" || d.tipo==="FORNECEDOR" ? "Sorelly · " : d.tipo==="FAMILIA" ? "PF · " : "")+d.nome;
const FFX = {personas:[{id:"p1"}], prest:[{id:"pr1", nome:"Higor"}, {id:"pr2", nome:"Sem Conta"}], contasBanc:[{id:"cb2", prestadorId:"pr1", personaId:"p9", ativo:true}, {id:"cb1", prestadorId:"pr1", personaId:"p1", ativo:true}]};
const rd = (d, ff) => ra.resolverDestino(d, ff === undefined ? FFX : ff, rot);
t("conta da empresa fica só em Contas a receber", rd({tipo:"CNPJ", nome:"CNPJ 34", cnpjId:"34"}).destino==="empresa" && rd({tipo:"CNPJ", nome:"CNPJ 34"}).contaTxt==="CNPJ 34");
t("fornecedor e representante ficam só em Contas a receber", rd({tipo:"FORNECEDOR", nome:"Pontual"}).destino==="empresa" && rd({tipo:"REPRESENTANTE", nome:"Thalita"}).destino==="empresa");
t("o nome mostrado é o rótulo do Direcionar", rd({tipo:"PRESTADOR", nome:"Sem Conta"}).nome==="Sorelly · Sem Conta");
const fam = rd({tipo:"FAMILIA", nome:"Marcus", personaId:"p1"});
t("sócio entra na Família sem conta definida", fam.destino==="socio" && fam.personaId==="p1" && fam.contaId==="");
t("sócio com pessoa que não existe na Família fica só aqui", rd({tipo:"FAMILIA", nome:"Fantasma", personaId:"zz"}).destino==="empresa");
const pf1 = rd({tipo:"PRESTADOR", nome:"Higor", personaId:"p1", prestFamId:"pr1"});
t("prestador da família: usa a conta dele e o sócio do vínculo", pf1.destino==="socio" && pf1.contaId==="cb1" && pf1.personaId==="p1");
const pf2 = rd({tipo:"PRESTADOR", nome:"HIGOR"});
t("sem vínculo no Direcionar: acha o prestador da Família pelo nome (sem acento e maiúscula)", pf2.destino==="socio" && !!pf2.contaId);
t("prestador sem conta na Família fica só em Contas a receber", rd({tipo:"PRESTADOR", nome:"Sem Conta", prestFamId:"pr2", personaId:"p1"}).destino==="empresa");
t("Família ausente: tudo fica só em Contas a receber", rd({tipo:"PRESTADOR", nome:"Higor", personaId:"p1", prestFamId:"pr1"}, null).destino==="empresa" && rd({tipo:"FAMILIA", nome:"Marcus", personaId:"p1"}, null).destino==="empresa");
t("sem destino escolhido dá erro", !!ra.resolverDestino(null, FFX, rot).erro);
const ffSemConta = ra.espelharNaFamilia(ff0, {por:"T", personaId:"p1", contaId:"", data:"2026-11-19", valor:50, origem:"Rev Teste Silva de Souza"});
t("cópia na Família sem conta: entra o Pix e não gera repasse", !ffSemConta.erro && ffSemConta.ff.pix.length===1 && ffSemConta.ff.pix[0].contaId==="" && ffSemConta.ff.repasses.length===0, ffSemConta.erro);
const lDest = ra.linhasAntecipados({antecipados:[Object.assign(ra.validarLancamento(Object.assign({}, base, {destinoId:"d1", destinoNome:"Sorelly · Higor"}), HOJE, []).item, {por:"T"})], usados:{}, adotados:[]}, null, {});
t("a tela mostra o nome do destino escolhido no Direcionar", lDest[0].conta==="Sorelly · Higor");

// ---------- 8) escrita padrão das contas de cada CNPJ ----------
console.log("8) escrita das contas do CNPJ");
const nc = await jiti.import("@/apps/montagem/lib/nome-conta");
const L = (n, id) => nc.rotuloContaCnpj(n, id);
t("Sicredi Sorelly 34 → Sicredi · 34 (sem o nome da empresa)", L("Sicredi Sorelly 34", "34")==="Sicredi · 34", L("Sicredi Sorelly 34", "34"));
t("Itaú Empresas 34 → Itaú Empresas · 34 (bolinha no lugar do espaço)", L("Itaú Empresas 34", "34")==="Itaú Empresas · 34", L("Itaú Empresas 34", "34"));
t("Caixa Econômica 34 → Caixa Econômica · 34", L("Caixa Econômica 34", "34")==="Caixa Econômica · 34", L("Caixa Econômica 34", "34"));
t("Safra 46 e Unicred 34 só ganham a bolinha", L("Safra 46", "46")==="Safra · 46" && L("Unicred 34", "34")==="Unicred · 34");
t("sem número no nome, o número do CNPJ entra no fim (Safra Serenity → Safra · 59)", L("Safra Serenity", "59")==="Safra · 59" && L("Sicredi Serenity", "59")==="Sicredi · 59", L("Safra Serenity", "59"));
t("Itaú Empresas Axis 67 → Itaú Empresas · 67", L("Itaú Empresas Axis 67", "67")==="Itaú Empresas · 67", L("Itaú Empresas Axis 67", "67"));
t("Sicredi H&O App → Sicredi · H&O", L("Sicredi H&O App", "HO")==="Sicredi · H&O", L("Sicredi H&O App", "HO"));
t("Itaú Marco PJ fica como está", L("Itaú Marco PJ", "ITM")==="Itaú Marco PJ");
t("Sicredi Shopping 46 mantém o Shopping", L("Sicredi Shopping 46", "46")==="Sicredi Shopping · 46", L("Sicredi Shopping 46", "46"));
t("Rotativo e Conta Garantida não são conta", !nc.contaRecebePix("Sicredi Rotativo 34") && !nc.contaRecebePix("Safra Serenity Conta Garantida") && !nc.contaRecebePix("Itaú Empresas 59 Conta Garantida"));
t("conta de verdade recebe Pix", nc.contaRecebePix("Sicredi Sorelly 34") && nc.contaRecebePix("Safra 34"));
t("nome vazio não quebra", L("", "34")==="" && L(null, "34")==="");

// ---------- 9) nome do destino com o dono e bolinha ----------
console.log("9) nome do destino");
const libN = {rotuloDestino:nc.rotuloDestino, rotuloPrestadorFamilia:nc.rotuloPrestadorFamilia, nomePropio:nc.nomePropio};
const TODOS = [{id:"s1", nome:"Marcus", tipo:"FAMILIA", personaId:"marcus"}, {id:"e1", nome:"Higor (segurança)", tipo:"PRESTADOR"}, {id:"f1", nome:"Higor", tipo:"PRESTADOR", personaId:"marcus"}, {id:"f2", nome:"Rebel Mode", tipo:"PRESTADOR", personaId:"marcus"}, {id:"p1", nome:"Pontual", tipo:"FORNECEDOR"}, {id:"r1", nome:"Thalita - Litoral Pr", tipo:"REPRESENTANTE"}];
const RL = (id) => ra.rotuloLeaf(TODOS.find((x) => x.id===id), TODOS, libN, "");
t("prestador da empresa: Sorelly · Higor (Segurança)", RL("e1")==="Sorelly · Higor (Segurança)", RL("e1"));
t("prestador da família: Marcus · Higor (Segurança) (o serviço vem do homônimo)", RL("f1")==="Marcus · Higor (Segurança)", RL("f1"));
t("prestador da família sem homônimo: Marcus · Rebel Mode", RL("f2")==="Marcus · Rebel Mode", RL("f2"));
t("fornecedor segue o padrão: Sorelly · Pontual", RL("p1")==="Sorelly · Pontual", RL("p1"));
t("traço vira bolinha no representante", RL("r1")==="Thalita · Litoral Pr", RL("r1"));
t("sócio: PF · Marcus", RL("s1")==="PF · Marcus", RL("s1"));

// ---------- 10) nome curto na lista e nome inteiro no campo ----------
console.log("10) nome curto x nome inteiro");
const T2 = TODOS.concat([{id:"g1", nome:"Greicy Marcus", tipo:"PRESTADOR", personaId:"marcus"}, {id:"g2", nome:"68 Gang Performance", tipo:"PRESTADOR", personaId:"marcus"}]);
const CL = (id) => ra.nomeCurtoLeaf(T2.find((x) => x.id===id), T2, libN), RL2 = (id) => ra.rotuloLeaf(T2.find((x) => x.id===id), T2, libN, "");
t("na lista o prestador da família aparece só com o nome (sem o dono)", CL("f2")==="Rebel Mode" && CL("g2")==="68 Gang Performance", CL("f2")+" | "+CL("g2"));
t("Greicy Marcus dentro do Marcus fica só Greicy, no campo Marcus · Greicy", CL("g1")==="Greicy" && RL2("g1")==="Marcus · Greicy", CL("g1")+" | "+RL2("g1"));
t("Higor da família na lista: Higor (Segurança); no campo: Marcus · Higor (Segurança)", CL("f1")==="Higor (Segurança)" && RL2("f1")==="Marcus · Higor (Segurança)", CL("f1")+" | "+RL2("f1"));
t("prestador da empresa na lista: Higor (Segurança); no campo: Sorelly · Higor (Segurança)", CL("e1")==="Higor (Segurança)" && RL2("e1")==="Sorelly · Higor (Segurança)");
t("fornecedor na lista só Pontual; no campo Sorelly · Pontual", CL("p1")==="Pontual" && RL2("p1")==="Sorelly · Pontual");
t("sócio na lista: Conta pessoal; no campo PF · Marcus", CL("s1")==="Conta pessoal" && RL2("s1")==="PF · Marcus");
t("representante na lista com bolinha", CL("r1")==="Thalita · Litoral Pr", CL("r1"));

console.log("\n"+ok+" ok, "+falha+" com falha");
process.exit(falha ? 1 : 0);
