// Teste: Pix ADIANTADO da revendedora (19/11/2026). O Pix que ela manda a um prestador ANTES do acerto entra no acerto como JÁ PAGO,
// não volta à fila do Direcionar, não cria segundo repasse e não pode ser usado duas vezes. Também: comprovante do Pix/repasse (ff). Dados INVENTADOS.
// Uso: node scripts/testar-pix-adiantado.mjs
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
let ok = 0, falha = 0;
const t = (n, c, x) => { if(c){ ok++; console.log("  OK   "+n); } else { falha++; console.log("  FALHA "+n+(x ? " -> "+x : "")); } };

// ---------- 1) nome parecido ----------
console.log("1) nome parecido");
t("nome igual", pa.nomeParecido("Rev Teste Silva", "REV TESTE SILVA"));
t("nome curto dentro do longo", pa.nomeParecido("Rev Teste", "Rev Teste Silva de Souza"));
t("acento e 'de' não atrapalham", pa.nomeParecido("Rév Têste Silvá", "rev teste silva de souza"));
t("uma palavra só NÃO casa (evita duas Karines)", !pa.nomeParecido("Rev", "Rev Teste Silva"));
t("outra pessoa não casa", !pa.nomeParecido("Rev Outra Pessoa", "Rev Teste Silva"));

// ---------- 2) lista de Pix que o acerto pode consumir ----------
console.log("2) lista do acerto");
const ff0 = JSON.parse(JSON.stringify(ffm.ffDemo()));
ff0.personas = [{id:"p1", nome:"Sócio Um", ativo:true, tipo:"SOCIO"}];
ff0.prest = [{id:"pr1", nome:"Prestador Alfa", ativo:true, servico:"", chavePix:"", responsavelId:"p1"}, {id:"pr2", nome:"Prestador Beta", ativo:true, servico:"", chavePix:"", responsavelId:"p1"}];
ff0.contasBanc = [{id:"cb1", nome:"Banco Alfa", prestadorId:"pr1", ativo:true, chavePix:"x"}, {id:"cb2", nome:"Banco Beta", prestadorId:"pr2", ativo:true, chavePix:"y"}];
ff0.dividas = []; ff0.repasses = []; ff0.pix = [];
let s = Object.assign({}, inicial(), {ff:ff0});
const lanca = (o) => { s = reducer(s, Object.assign({type:"FF", op:"pix_add", personaId:"p1", forma:"PIX", por:"Teste"}, o)); };
lanca({data:"2026-10-20", valor:300, origem:"REV TESTE SILVA DE SOUZA", contaId:"cb1"});   // ANTES do último acerto: fica de fora
lanca({data:"2026-11-13", valor:500, origem:"Rev Teste", contaId:"cb1"});
lanca({data:"2026-11-13", valor:150, origem:"Rev Teste Silva", contaId:"cb2"});
lanca({data:"2026-11-18", valor:634.55, origem:"REV TESTE SILVA DE SOUZA", contaId:"cb1"});
lanca({data:"2026-11-19", valor:1000, origem:"Rev Teste Silva de Souza", contaId:"cb2"});
lanca({data:"2026-11-15", valor:77, origem:"Outra Pessoa Qualquer", contaId:"cb1"});          // outra revendedora
lanca({data:"2026-11-16", valor:90, origem:"Rev Teste Silva", contaId:"cb1"});                // vai ser rejeitado
const idRej = s.ff.pix[s.ff.pix.length-1].id;
s = reducer(s, {type:"FF", op:"pix_aud", id:idRej, auditoria:"REJEITADO", por:"Teste"});
t("7 Pix lançados, cada um com 1 repasse automático", s.ff.pix.length===7 && s.ff.repasses.length===7, s.ff.pix.length+" pix / "+s.ff.repasses.length+" repasses");
const nome = "Rev Teste Silva de Souza";
let l = pa.pixAdiantadosDe(s.ff, nome, {desde:"2026-10-23", internoId:"A1", hoje:"2026-11-19"});
t("acha os 4 Pix depois do último acerto", l.length===4, l.map(x => x.valor).join(","));
t("total R$ 2.284,55", Math.round(l.reduce((a, x) => a+x.valor, 0)*100)/100===2284.55);
t("fora: antes do acerto, de outra pessoa e rejeitado", !l.some(x => x.valor===300 || x.valor===77 || x.valor===90));
t("do mais antigo para o mais novo", l[0].data<=l[1].data && l[1].data<=l[2].data && l[2].data<=l[3].data);
t("traz o nome da conta, nunca o do prestador", l[0].conta==="Banco Alfa" && !JSON.stringify(l).includes("Prestador"));
t("sem acerto anterior: só os últimos 45 dias (aos 31/12 sobram só 2; aos 10/03/2027 nenhum)", pa.pixAdiantadosDe(s.ff, nome, {internoId:"A1", hoje:"2026-12-31"}).length===2 && pa.pixAdiantadosDe(s.ff, nome, {internoId:"A1", hoje:"2027-03-10"}).length===0);

// ---------- 3) o acerto CONSOME o Pix ----------
console.log("3) usar no acerto");
const nRepAntes = s.ff.repasses.length, idsAcerto = l.map(x => x.id);
let r = pa.sincronizarUso(s.ff, {internoId:"A1", rev:nome, ids:idsAcerto, por:"Edna"});
t("marca os 4", r.marcados.length===4 && r.recusados.length===0);
t("NÃO cria segundo repasse (continua 1 por Pix)", r.ff.repasses.length===nRepAntes);
t("a marca guarda atendimento, revendedora e valor", r.ff.pixUsados[idsAcerto[0]].internoId==="A1" && r.ff.pixUsados[idsAcerto[0]].valor===500 && !JSON.stringify(r.ff.pix).includes("usadoAcerto"));
const r2 = pa.sincronizarUso(r.ff, {internoId:"A1", rev:nome, ids:idsAcerto, por:"Edna"});
t("repetir é idempotente (nada muda)", r2.marcados.length===0 && r2.soltos.length===0 && r2.recusados.length===0);
const r3 = pa.sincronizarUso(r.ff, {internoId:"A2", rev:nome, ids:[idsAcerto[0]], por:"Outra"});
t("outro acerto NÃO usa o mesmo Pix", r3.recusados.length===1 && /outro acerto/.test(r3.recusados[0].motivo));
t("outro acerto não vê os Pix já usados", pa.pixAdiantadosDe(r.ff, nome, {desde:"2026-10-23", internoId:"A2", hoje:"2026-11-19"}).length===0);
t("o mesmo acerto continua vendo (meu)", pa.pixAdiantadosDe(r.ff, nome, {desde:"2026-10-23", internoId:"A1", hoje:"2026-11-19"}).every(x => x.meu));
const r4 = pa.sincronizarUso(s.ff, {internoId:"A3", rev:"Outra Pessoa Qualquer", ids:[idsAcerto[1]], por:"X"});   // s.ff = ainda sem marcas
t("Pix de outra revendedora é recusado", r4.recusados.length===1 && /não é desta/.test(r4.recusados[0].motivo));
const r5 = pa.sincronizarUso(r.ff, {internoId:"A1", rev:nome, ids:idsAcerto.slice(0, 3), por:"Edna"});
t("tirou uma linha do acerto: o Pix é solto", r5.soltos.length===1 && r5.soltos[0]===idsAcerto[3] && !r5.ff.pixUsados[idsAcerto[3]]);
t("sem atendimento não marca nada", pa.sincronizarUso(s.ff, {internoId:"", rev:nome, ids:idsAcerto}).marcados.length===0);

// ---------- 4) Financeiro familiar: Pix usado não se exclui nem muda de valor; soltar libera ----------
console.log("4) Financeiro familiar");
s = Object.assign({}, s, {ff:r.ff});
let s2 = reducer(s, {type:"FF", op:"pix_del", id:idsAcerto[0], por:"Teste"});
t("Pix usado no acerto não se exclui", s2.ff.pix.length===7 && s2.ff.pix.some(x => x.id===idsAcerto[0]));
s2 = reducer(s, {type:"FF", op:"pix_set", id:idsAcerto[0], patch:{valor:999}, por:"Teste"});
t("Pix usado não muda de valor (pix_set)", s2.ff.pix.find(x => x.id===idsAcerto[0]).valor===500);
s2 = reducer(s, {type:"FF", op:"pix_editar", id:idsAcerto[0], patch:{valor:999}, por:"Teste"});
t("Pix usado não muda de valor (pix_editar)", s2.ff.pix.find(x => x.id===idsAcerto[0]).valor===500);
s2 = reducer(s, {type:"FF", op:"pix_soltar", id:idsAcerto[0], por:"Teste"});
t("soltar tira a marca e o Pix volta à lista", !s2.ff.pixUsados[idsAcerto[0]] && pa.pixAdiantadosDe(s2.ff, nome, {desde:"2026-10-23", internoId:"A9", hoje:"2026-11-19"}).some(x => x.id===idsAcerto[0]));
t("soltar não mexe no repasse", s2.ff.repasses.length===7);
t("a mudança de um Pix NÃO apaga a marca dos outros", Object.keys(s2.ff.pixUsados).length===3);

// ---------- 5) comprovante ----------
console.log("5) comprovante");
let sc = reducer(s, {type:"FF", op:"pix_comp", id:idsAcerto[3], key:"an_abc123def456", nome:"E18189547202611191646e5UYTHUbtVR.jpg", tipo:"image/jpeg", por:"Teste"});
const pxC = sc.ff.pix.find(x => x.id===idsAcerto[3]);
t("anexa o comprovante ao Pix (só a chave, a imagem fica no servidor)", pxC.compKey==="an_abc123def456" && pxC.compNome.endsWith(".jpg") && JSON.stringify(pxC).length<600);
t("comprovante vale mesmo com o Pix usado no acerto", !!sc.ff.pixUsados[idsAcerto[3]]);
t("o repasse automático continua 1 e sem imagem", sc.ff.repasses.filter(x => x.origemPixLancId===idsAcerto[3]).length===1 && !JSON.stringify(sc.ff.repasses).includes("an_abc123"));
t("chave inválida é recusada", !reducer(s, {type:"FF", op:"pix_comp", id:idsAcerto[3], key:"http://x", por:"T"}).ff.pix.find(x => x.id===idsAcerto[3]).compKey);
sc = reducer(sc, {type:"FF", op:"pix_comp", id:idsAcerto[3], key:"", por:"Teste"});
t("retirar o comprovante", !sc.ff.pix.find(x => x.id===idsAcerto[3]).compKey);
let sm = reducer(s, {type:"FF", op:"repasse_add", prestId:"pr1", data:"2026-11-10", valor:50, origem:"Pago à mão", forma:"PIX", por:"Teste"});
const rpMao = sm.ff.repasses.find(x => !x.origemPixLancId);
sm = reducer(sm, {type:"FF", op:"repasse_comp", id:rpMao.id, key:"an_zzz999yyy888", nome:"mao.pdf", tipo:"application/pdf", por:"Teste"});
t("pago lançado à mão guarda o comprovante no próprio repasse", sm.ff.repasses.find(x => x.id===rpMao.id).compKey==="an_zzz999yyy888");
const rpAuto = sm.ff.repasses.find(x => x.origemPixLancId);
t("repasse automático recusa comprovante (fica no Pix)", !reducer(sm, {type:"FF", op:"repasse_comp", id:rpAuto.id, key:"an_zzz999yyy888", por:"T"}).ff.repasses.find(x => x.id===rpAuto.id).compKey);
// o comprovante sobrevive a editar o Pix (o repasse automático é refeito, o comprovante está no Pix)
sc = reducer(s, {type:"FF", op:"pix_comp", id:idsAcerto[1], key:"an_keep111keep", nome:"k.jpg", tipo:"image/jpeg", por:"T"});
sc = reducer(sc, {type:"FF", op:"pix_set", id:idsAcerto[1], patch:{data:"2026-11-14"}, por:"T"});
t("o comprovante continua depois de editar o Pix", sc.ff.pix.find(x => x.id===idsAcerto[1]).compKey==="an_keep111keep");

// ---------- 6) envio ao financeiro: o Pix já pago NÃO vai para o Direcionar ----------
console.log("6) envio ao financeiro (Direcionar)");
let se = Object.assign({}, inicial(), {ff:s.ff});
const linhaPix = {tipo:"pagamento", forma:"pix", valor:500, pixFfId:idsAcerto[0], partes:[{descricao:"Banco Alfa", valor:500, comprovante:null, ok:true}], enviada:true, auto:"Pix já pago antes do acerto"};
const linhaAberta = {tipo:"pagamento", forma:"pix", valor:200, partes:[{descricao:"", valor:200, comprovante:null, ok:false}]};
se = reducer(se, {type:"FIN_ENVIAR", internoId:"INT-T1", nome:"Rev Teste Silva de Souza", linhas:[linhaPix, linhaAberta], por:"Edna", vendas:1000, aPagar:700});
const lf = (se.lancFin||[]).find(x => x.internoId==="INT-T1");
const filaDp = ((se.dp && se.dp.pix) || []).filter(x => x.internoId==="INT-T1");
t("o lançamento guarda a linha do Pix com a marca pixFfId", lf && lf.linhas[0].pixFfId===idsAcerto[0]);
t("a linha do Pix já pago está com conta definida e enviada", lf && ffm && lf.linhas[0].enviada===true && lf.linhas[0].partes[0].ok===true);
t("só a linha ABERTA (R$ 200) vai para o Direcionar", filaDp.length===1 && filaDp[0].valor===200 && (filaDp[0].linhas||[]).length===1 && filaDp[0].linhas[0]===1, JSON.stringify(filaDp.map(x => [x.valor, x.linhas])));
t("o Pix já pago aparece como pago no pedido (contexto), não como pedido", filaDp[0] && (filaDp[0].pagos||[]).some(p => p.forma==="pix" && p.valor===500));
// só o Pix já pago: nada vai para a fila
let se2 = Object.assign({}, inicial(), {ff:s.ff});
se2 = reducer(se2, {type:"FIN_ENVIAR", internoId:"INT-T2", nome:"Rev Teste Silva de Souza", linhas:[linhaPix], por:"Edna", vendas:500, aPagar:500});
t("acerto pago só com o Pix adiantado: nada entra na fila do Direcionar", ((se2.dp && se2.dp.pix) || []).filter(x => x.internoId==="INT-T2").length===0);
t("e o repasse do ff continua o mesmo (1 por Pix)", se2.ff.repasses.length===7);

// ---------- 6b) Contas a pagar: a dívida do prestador mostra os comprovantes dos pagamentos que a quitaram ----------
console.log("6b) Contas a pagar");
{
  let sd = Object.assign({}, inicial(), {ff:s.ff});
  sd = reducer(sd, {type:"FF", op:"divida_add", prestId:"pr2", data:"2026-11-01", valor:1150, prazo:"", descricao:"Serviço teste", por:"T"});
  sd = reducer(sd, {type:"FF", op:"pix_comp", id:idsAcerto[3], key:"an_conta1pagar9", nome:"c.jpg", tipo:"image/jpeg", por:"T"});   // o Pix de R$ 1.000,00 (Beta) tem comprovante; o de R$ 150,00 não
  const it = ffm.itensDividasPrestadores(sd.ff, "2026-11-19").find(x => x.id.startsWith("ffd|") && x.nome.includes("Prestador Beta"));
  t("a dívida quitada aparece em Contas a pagar como paga", it && it.status==="pago", JSON.stringify(it && it.status));
  t("traz o comprovante do Pix de R$ 1.000,00 (e só ele)", it && it.comps.length===1 && it.comps[0].key==="an_conta1pagar9" && it.comps[0].valor===1000, JSON.stringify(it && it.comps));
  t("sabe que foi paga por Pix (para mostrar Falta anexar quando não houver)", it && it.pagoPorPix===true);
  const sd2 = reducer(sd, {type:"FF", op:"pix_comp", id:idsAcerto[3], key:"", por:"T"});
  const it2 = ffm.itensDividasPrestadores(sd2.ff, "2026-11-19").find(x => x.id.startsWith("ffd|") && x.nome.includes("Prestador Beta"));
  t("sem comprovante: lista vazia", it2 && it2.comps.length===0 && it2.pagoPorPix===true);
}

// ---------- 7) a tela do prestador (bloco Pago) desenha a coluna Comprovante ----------
console.log("7) tela do prestador (desenho no Node)");
{
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { e } = await jiti.import("@/shared/react");
  const { Ctx } = await jiti.import("@/apps/montagem/state/context");
  const tela = await jiti.import("@/apps/montagem/pages/FinFamiliar");
  let sv = Object.assign({}, inicial(), {ff:s.ff});
  sv = reducer(sv, {type:"FF", op:"pix_comp", id:idsAcerto[2], key:"an_abc123def456", nome:"c.jpg", tipo:"image/jpeg", por:"T"});   // este Pix (Alfa, R$ 634,55) tem comprovante e está usado no acerto
  const cx = {state:sv, dispatch(){}};
  const c = {s:sv, d(){}, ff:sv.ff, por:"Teste", pode:true};
  const desenha = (prest) => renderToStaticMarkup(e(Ctx.Provider, {value:cx}, e(tela.DetPrest, {c, x:sv.ff.prest.find(p => p.id===prest)})));
  const html = desenha("pr1");
  t("NÃO há mais coluna Comprovante: o valor é o link", !html.includes(">Comprovante<") && !html.includes(">Anexar<"));
  t("Pix COM comprovante: o valor é um botão sublinhado que abre o comprovante", (() => { const i = html.indexOf('aria-label="Abrir o comprovante de'); return i>0 && html.slice(i, i+260).includes("underline") && html.slice(i, i+260).includes("634,55"); })());
  t("Pix SEM comprovante: valor normal que oferece anexar (foto ou PDF)", html.includes('aria-label="Anexar comprovante de R$ 500,00"') && html.includes("image/*,application/pdf"));
  t("o Pix usado no acerto aparece marcado", html.includes("usado no acerto") && html.includes("Soltar"));
  t("o outro prestador (Beta) também desenha sem erro", desenha("pr2").includes("R$ 1.150,00") || desenha("pr2").includes("Anexar comprovante de"));
}

// ---------- 8) importação dos comprovantes que já estão no Atendimento ----------
console.log("8) importar comprovantes do Atendimento (só casa par único)");
{
  const imp = await jiti.import("@/apps/montagem/domain/comprovantes-importar");
  const IMG = "data:image/jpeg;base64,AAAA";
  const ts = (iso) => Date.parse(iso+"T15:00:00-03:00");
  const lf = (id, nome, dia, valor, comp) => ({id, nome, enviadoTs:ts(dia), linhas:[{tipo:"pagamento", forma:"pix", valor, partes:[{descricao:"Conta X", valor, comprovante:comp}]}]});
  const pag = {
    lf_a: lf("LFa", "Rev Teste Silva de Souza", "2026-11-13", 500, {nome:"a.jpg", url:IMG}),
    lf_b: lf("LFb", "Rev Teste Silva", "2026-11-18", 634.55, {nome:"b.jpg", url:IMG}),
    lf_c: lf("LFc", "Outra Pessoa Qualquer", "2026-11-15", 999, {nome:"c.jpg", url:IMG}),
    lf_d: lf("LFd", "Rev Teste Silva", "2026-11-13", 150, {nome:"d.pdf", url:"data:application/pdf;base64,AAAA"}),
    lf_e: lf("LFe", "Rev Teste Silva", "2026-11-19", 1000, null),
    outra: {id:"x", linhas:[]},
  };
  const ffi = JSON.parse(JSON.stringify(s.ff));
  let rr = imp.casarComprovantes(pag, ffi);
  t("casa os 2 pares únicos", rr.casados.length===2, JSON.stringify(rr.casados.map(c => [c.lfId, c.pixId])));
  t("o de R$ 500,00 vai para o Pix de 13/11", rr.casados.some(c => c.lfId==="LFa" && ffi.pix.find(x => x.id===c.pixId).valor===500));
  t("o sem Pix correspondente fica em semPix", rr.semPix.length===1 && rr.semPix[0].lfId==="LFc");
  t("PDF e sem foto não entram", rr.total===3 && rr.semImagem===1);
  t("a imagem NUNCA aparece no resultado", !JSON.stringify(rr).includes("base64"));
  const ffd = JSON.parse(JSON.stringify(ffi)); ffd.pix.push(Object.assign({}, ffd.pix.find(x => x.valor===500 && x.data==="2026-11-13"), {id:"pxcopia"}));
  rr = imp.casarComprovantes(pag, ffd);
  t("dois Pix iguais: NÃO grava (ambíguo)", rr.ambiguos.length===1 && rr.ambiguos[0].lfId==="LFa" && !rr.casados.some(c => c.lfId==="LFa"));
  const pag2 = Object.assign({}, pag, {lf_a2: lf("LFa2", "Rev Teste Silva", "2026-11-13", 500, {nome:"a2.jpg", url:IMG})});
  rr = imp.casarComprovantes(pag2, ffi);
  t("dois comprovantes para o mesmo Pix: NÃO grava nenhum", rr.ambiguos.filter(c => c.valor===500).length===2 && !rr.casados.some(c => c.valor===500));
  const ffc = JSON.parse(JSON.stringify(ffi)); ffc.pix.find(x => x.valor===500 && x.data==="2026-11-13").compKey = "an_jatem00001";
  t("Pix que já tem comprovante não é trocado", !imp.casarComprovantes(pag, ffc).casados.some(c => c.lfId==="LFa"));
  t("data muito diferente não casa", imp.casarComprovantes({lf_z: lf("LFz", "Rev Teste Silva de Souza", "2026-12-20", 500, {nome:"z.jpg", url:IMG})}, ffi).casados.length===0);
}

console.log("\n"+(falha ?"FALHOU: "+falha+" de "+(ok+falha) : "TUDO CERTO: "+ok+" verificações"));
process.exit(falha ? 1 : 0);
