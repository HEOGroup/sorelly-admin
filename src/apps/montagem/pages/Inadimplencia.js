// Sorelly Admin — pages/Inadimplencia.js
// Representantes → Inadimplência. Acerto em que a revendedora pagou menos do que devia: o que falta fica aqui, agrupado por representante.
// Nada é descontado: só a comissão sobre o valor em aberto fica retida até a revendedora pagar. O pagamento feito depois vira linha extra do acerto;
// o financeiro confirma a conta em Comissões e a comissão retida é liberada.
// Visual refeito em 23/11/2026 no padrão atual (PADRAO-VISUAL.md): uma TabelaPlanilha (filtro e ordem no nome de cada coluna), sem blocos de números no topo,
// total na linha de total, ficha do acerto em Janela. As CONTAS não mudaram: quem aparece, valores, prazo, etapa e as ações INAD_NEGOCIAR e INAD_PAGAR são os de antes.
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { BarraTabela, CLS_FINA_ESPACO, CampoMini, CelulaBarra, PAGINA_CHEIA, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { Aviso, Botao, CampoSel, Rotulo, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { analisar, comisEfetiva, dataHora, fmtDataBR, prazoPendente, quemNome } from "@/apps/montagem/domain/comissoes";
import { AGENDAMENTO, BIPADORAS, FINANCEIRO, SUPERVISORA, podeAgendar, veTotais } from "@/apps/montagem/domain/equipe";
import { isoDia } from "@/apps/montagem/lib/format";
import { nomePropio } from "@/apps/montagem/lib/nome-conta";
import { CampoDin, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var R$ = function(v){ return brl(v||0); };
var ouTraco = function(v){ return v>0.009 ? R$(v) : "—"; };   // sem valor = traço, como antes
var soma = function(ls, k){ return r2(ls.reduce(function(t, l){ return t+(l[k]||0); }, 0)); };
var AREA = "min-h-16 w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
var VISTAS = [["abertas", "Abertas"], ["prometidas", "Prometidas"], ["quitadas", "Quitadas"], ["todas", "Todas"]];

// Situação de um acerto que já foi inadimplente
function situacao(r, a, hoje){
  var negs = r.negoc||[], ult = negs.slice().reverse().find(function(n){ return n.promessa; });
  var extras = (r.pagamentos||[]).filter(function(p){ return p.extra; });
  if(a.falta<=0.009){ var q = extras.length ? extras[extras.length-1].data : r.data; return {k:"quitada", txt:"Quitado em "+fmtDataBR(q), tom:"text-success"}; }
  if(ult && ult.promessa){ return ult.promessa < hoje ? {k:"vencida", txt:"Promessa vencida ("+fmtDataBR(ult.promessa)+")", tom:"text-destructive"} : {k:"prometida", txt:"Prometido para "+fmtDataBR(ult.promessa), tom:"text-info"}; }
  return {k:"aberta", txt:"Em aberto", tom:"text-warning"};
}

// Todos os acertos que já tiveram inadimplência, com prazo, multa de atraso, etapa e comissão retida (contas iguais às de antes de 23/11/2026)
function pendencias(s, c, hoje){
  var todosAc = (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto"; });
  var todos = todosAc.map(function(r){ var a = analisar(c, r);
    return {r:r, a:a, quem:r.origem==="interno" ? "Atendimento interno" : (r.rep||"—"), houve:a.falta>0.009 || (r.pagamentos||[]).some(function(p){ return p.extra; }) || (r.negoc||[]).length>0}; })
    .filter(function(x){ return x.houve; });
  // regras de 27/10/2026: prazo para quitar e multa de atraso (1% ao dia, teto 10%) sobre o que falta; a multa de 10% do pendente já está no acerto (r.multas)
  todos.forEach(function(x){ x.pz = x.a.falta>0.009 ? prazoPendente(x.r, hoje) : null; x.multaAt = x.pz ? r2(x.a.falta*x.pz.pct/100) : 0; x.saldo = r2(x.a.falta + x.multaAt); });
  // Etapas da pendência (Marcus, 26/10/2026): No prazo → Atrasado → Jurídico → Retirar kit (veio o próximo acerto e não pagou) → Executar nota (última negociação não cumprida).
  todos.forEach(function(x){ x.sit = situacao(x.r, x.a, hoje);
    if(!x.pz){ x.etapa = null; return; }
    var proximo = todosAc.some(function(o){ return o.rev===x.r.rev && o.id!==x.r.id && (o.data||"")>(x.r.data||""); }), jur = x.pz.dias>=((x.r.regrasNovas||{}).juridicoDias||60);
    x.etapa = x.sit.k==="vencida" && (jur || proximo) ? {t:"Executar nota", tom:"text-destructive"} : proximo ? {t:"Retirar kit", tom:"text-destructive"} : jur ? {t:"Jurídico", tom:"text-destructive"} : x.pz.atraso>0 ? {t:"Atrasado", tom:"text-warning"} : {t:"No prazo", tom:"text-warning"}; });
  // mesma revendedora com mais de uma pendência aberta: as duas ficam juntas
  var porRev = {}; todos.forEach(function(x){ if(x.a.falta>0.009 && x.pz){ (porRev[x.r.rev] = porRev[x.r.rev] || []).push(x); } });
  todos.forEach(function(x){ var l = porRev[x.r.rev]; x.juntas = l && l.length>1 ? {n:l.length, total:r2(l.reduce(function(t,y){ return t+y.saldo; }, 0))} : null; });
  todos.forEach(function(x){ x.comRet = x.a.falta>0.009 ? r2(Math.min(x.a.falta, x.r.valorAcerto||0)*x.a.pct/100) : 0; });
  return todos;
}

// uma linha da tabela (só texto e número; a cor vem das colunas)
function linhaDe(x){
  var r = x.r, negs = r.negoc||[], ult = negs.slice(-1)[0], prom = negs.slice().reverse().find(function(n){ return n.promessa; });
  return {id:r.id, quem:nomePropio(x.quem), rev:nomePropio(r.rev), data:r.data||"", acerto:r.valorAcerto||0, pago:x.a.pago, saldo:x.saldo, falta:x.a.falta, multaAt:x.multaAt,
    prazo:x.pz ? (x.pz.atraso>0 ? x.pz.atraso+" dias de atraso · +"+x.pz.pct+"%" : x.pz.dias+"/"+x.pz.prazo+" dias") : "", atrasado:!!(x.pz && x.pz.atraso>0),
    etapa:x.etapa ? x.etapa.t : "", etapaTom:x.etapa ? x.etapa.tom : "", kit:x.pz ? "Bloqueado" : "",
    juntas:x.juntas ? x.juntas.n+" pendências · "+R$(x.juntas.total) : "", comRet:x.comRet,
    prometido:x.sit.k==="prometida" ? r2(Math.min(x.a.falta, (prom && prom.valor) || x.a.falta)) : 0,
    negData:ult ? String(ult.ts||"").slice(0, 10) : "", negTxt:ult ? (ult.txt || "Promessa") : "", sit:x.sit.txt, sitTom:x.sit.tom};
}

var COLS = [
  {k:"quem", t:"Representante"}, {k:"rev", t:"Revendedora"}, {k:"data", t:"Acerto em", data:true, fmt:fmtDataBR},
  {k:"acerto", t:"Valor do acerto", fmt:R$}, {k:"pago", t:"Pago", fmt:R$},
  {k:"saldo", t:"Saldo devedor", fmt:ouTraco,
    render:function(v, l){ return e("span",{title:l.multaAt>0 ? "Falta "+R$(l.falta)+" (com a multa de 10% do pendente) + multa de atraso "+R$(l.multaAt) : undefined}, ouTraco(v)); }},
  {k:"sit", t:"Situação"}, {k:"prazo", t:"Prazo"},
  {k:"etapa", t:"Etapa"}, {k:"kit", t:"Kit"},
  {k:"juntas", t:"Pendências"},
  {k:"comRet", t:"Comissão retida", fmt:ouTraco},
  {k:"prometido", t:"Prometido", fmt:ouTraco},
  {k:"negData", t:"Última negociação", data:true, fmt:fmtDataBR}, {k:"negTxt", t:"Combinado"}];
var COLS_PAG = [{k:"data", t:"Data"}, {k:"forma", t:"Forma"}, {k:"valor", t:"Valor", fmt:R$},
  {k:"fin", t:"Financeiro"}];

// ---------- ficha do acerto: negociações e pagamentos ----------
function FichaAcerto(p){
  var cx = use(), s = cx.state, d = cx.dispatch, x = p.x, r = x.r, a = x.a, agenda = podeAgendar(s.usuario);
  var nt = useState({txt:"", promessa:"", valor:0}), neg = nt[0], setNeg = nt[1];
  var pg = useState({forma:"pix", descricao:"", valor:0, quem:""}), pag = pg[0], setPag = pg[1];
  var formas = s.formasPagamento||[], forma = formas.find(function(f){ return f.k===pag.forma; }) || {descricoes:[]};
  var contas = forma.descricoes||[], pessoas = BIPADORAS.concat([SUPERVISORA], AGENDAMENTO, FINANCEIRO);
  var aberto = a.falta > 0.009;
  var okNeg = agenda && (neg.txt.trim() || neg.promessa);
  var okPag = agenda && aberto && pag.valor>0 && pag.valor <= a.falta + 0.009 && contas.length>0 && pag.descricao && (pag.forma!=="dinheiro" || pag.quem);
  var negN = function(k, v){ var o = Object.assign({}, neg); o[k] = v; setNeg(o); };
  var nomeForma = function(k){ return (formas.find(function(y){ return y.k===k; }) || {label:k}).label; };
  var pagos = (r.pagamentos||[]).map(function(y, i){ var f = r.fin && r.fin[i];
    return {i:i, data:fmtDataBR(y.data)+(y.extra ? " · depois" : ""), forma:nomeForma(y.forma), valor:y.valor||0, fin:f ? "OK financeiro" : "Sem OK", finOk:!!f}; });
  var registrarNeg = function(){ d({type:"INAD_NEGOCIAR", id:r.id, por:s.usuario, txt:neg.txt.trim(), promessa:neg.promessa, valor:neg.valor}); setNeg({txt:"", promessa:"", valor:0}); };
  var registrarPag = function(){ d({type:"INAD_PAGAR", id:r.id, forma:pag.forma, descricao:pag.descricao, valor:pag.valor, quem:pag.quem}); setPag({forma:"pix", descricao:"", valor:0, quem:""}); };

  var negociacoes = e(BlocoPainel,{key:"n", titulo:"Negociações", compacto:true}, e("div",{className:"px-3 pb-3"},
    (r.negoc||[]).length===0 && e("p",{className:"py-1 text-[13px]"}, "Nenhuma negociação."),
    (r.negoc||[]).slice().reverse().map(function(n, i){ return e("div",{key:i, className:"border-b border-border py-1 text-[13px]"},
      e("p",{className:"text-[11px]"}, quemNome(n.por)+" · "+dataHora(n.ts)), n.txt && e("p",{className:"whitespace-pre-wrap"}, n.txt),
      n.promessa && e("p",{className:"font-semibold"}, "Prometeu pagar "+(n.valor>0 ? R$(n.valor)+" " : "")+"em "+fmtDataBR(n.promessa))); }),
    agenda ? e("div",{className:"mt-2 border-t border-border pt-2"},
      e(Rotulo,{t:"Nova negociação", id:"inNt"}),
      e("textarea",{id:"inNt", value:neg.txt, placeholder:"O que ficou combinado", onChange:function(ev){ negN("txt", ev.target.value); }, className:AREA}),
      e("div",{className:"mt-2 grid grid-cols-2 gap-2"},
        e(CampoTexto,{t:"Prometeu pagar em", id:"inNd", tipo:"date", value:neg.promessa, onChange:function(v){ negN("promessa", v); }}),
        e(CampoDin,{t:"Valor prometido", id:"inNv", value:neg.valor||null, onChange:function(v){ negN("valor", v||0); }})),
      e("div",{className:"mt-2 flex justify-end"}, e(Botao,{desabilitado:!okNeg, onClick:registrarNeg}, "Registrar negociação")))
      : e("div",{className:"mt-2"}, e(Aviso,null, "Só consulta: negociar é com o Agendamento."))));

  var pagamentos = e(BlocoPainel,{key:"p", titulo:"Pagamentos do acerto", compacto:true}, e("div",{className:"px-3 pb-3"},
    e(TabelaPlanilha,{cols:COLS_PAG, linhas:pagos, chave:"i", grade:true, semFiltro:true, semContagem:true, semCaixaAlta:true, vazio:"Nenhum pagamento."}),
    aberto && agenda && e("div",{className:"mt-2 border-t border-border pt-2"},
      e("p",{className:"pb-1 text-[13px] font-semibold"}, "Registrar pagamento · falta "+R$(a.falta)),
      e("div",{className:"grid grid-cols-2 gap-2"},
        e(CampoSel,{t:"Forma", id:"inPf", value:pag.forma, onChange:function(v){ setPag(Object.assign({}, pag, {forma:v, descricao:""})); }, opcoes:formas.map(function(f){ return [f.k, f.label]; })}),
        e(CampoSel,{t:"Conta", id:"inPc", value:pag.descricao, onChange:function(v){ setPag(Object.assign({}, pag, {descricao:v})); }, opcoes:[["", "Escolher"]].concat(contas.map(function(y){ return [y, y]; }))}),
        e(CampoDin,{t:"Valor recebido", id:"inPv", value:pag.valor||null, onChange:function(v){ setPag(Object.assign({}, pag, {valor:v||0})); }}),
        pag.forma==="dinheiro" && e(CampoSel,{t:"Quem recebeu", id:"inPq", value:pag.quem, onChange:function(v){ setPag(Object.assign({}, pag, {quem:v})); }, opcoes:[["", "Escolher"]].concat(pessoas.map(function(y){ return [y.nome, y.nome]; }))})),
      pag.valor > a.falta + 0.009 && e("div",{className:"mt-2"}, e(Aviso,{tom:"vermelho"}, "Maior do que falta pagar.")),
      e("div",{className:"mt-2 flex justify-end"}, e(Botao,{principal:true, desabilitado:!okPag, onClick:registrarPag}, "Registrar pagamento")))));

  return e(Janela,{t:nomePropio(r.rev), sub:nomePropio(x.quem)+" · Acerto de "+fmtDataBR(r.data)+" · "+(aberto ? "Falta "+R$(a.falta) : x.sit.txt), fechar:p.fechar, colunas:[negociacoes, pagamentos]});
}

function AbaInadimplencia(){
  var s = use().state, c = comisEfetiva(s), ver = veTotais(s.usuario);
  var hoje = isoDia(new Date()), mesAtual = hoje.slice(0,7);
  var sv = useState("abertas"), vista = sv[0], setVista = sv[1];
  var sf = useState(null), fichaId = sf[0], setFicha = sf[1];
  var todos = pendencias(s, c, hoje);
  var linhas = todos.filter(function(x){
    if(vista==="abertas" && x.sit.k==="quitada") return false;
    if(vista==="prometidas" && x.sit.k!=="prometida") return false;
    if(vista==="quitadas" && x.sit.k!=="quitada") return false;
    return true; }).sort(function(p,q){ return q.saldo-p.saldo; }).map(linhaDe);
  var recuperado = todos.reduce(function(t,x){ return t+(x.r.pagamentos||[]).filter(function(p){ return p.extra && (p.data||"").slice(0,7)===mesAtual; }).reduce(function(u,p){ return u+(p.valor||0); }, 0); }, 0);
  var ficha = fichaId!=null ? todos.find(function(x){ return x.r.id===fichaId; }) : null;
  var acertos = function(n){ return n.toLocaleString("pt-BR")+(n===1 ? " acerto" : " acertos"); };
  // linha do grupo (uma por representante) e linha de total: as somas ficam embaixo das colunas delas
  var somas = function(ls){ return [R$(soma(ls, "acerto")), R$(soma(ls, "pago")), R$(soma(ls, "saldo")), "", "", "", "", "", R$(soma(ls, "comRet")), R$(soma(ls, "prometido")), "", ""]; };
  var total = function(ls){ return ["Total", acertos(ls.length), ""].concat(somas(ls)); };
  // MESMA ESTRUTURA DA CONTAS A PAGAR (Marcus, 23/11/2026: "100% igual"): página colada nas bordas, bloco azul, barra de filtros em células, tabela fina
  return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case"},
    ficha && e(FichaAcerto,{key:String(ficha.r.id), x:ficha, fechar:function(){ setFicha(null); }}),
    e(BlocoPainel,{titulo:"Inadimplência", compacto:true},
      e(BarraTabela,null,
        e(CelulaBarra,{rotulo:"Situação"}, e(CampoMini,{valor:vista, aoMudar:setVista, rotulo:"Situação", ops:VISTAS})),
        ver && e(CelulaBarra,{rotulo:"Recuperado no mês"}, e("b",{className:"whitespace-nowrap text-[10px] tabular-nums text-white"}, R$(recuperado)))),   // padrao-ok: texto de 10 px da barra compacta, igual à Contas a pagar
      e("div",{ref:refCheia(), className:CLS_FINA_ESPACO},
        e(TabelaPlanilha,{key:vista, fina:true, cols:COLS, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, limite:6000, alturaMax:"calc(100vh - 6.6rem)",
          totalRodape:ver ? total : undefined, aoClicar:function(l){ setFicha(l.id); }, vazio:"Nenhuma inadimplência nesta visão."}))));
}

export { AbaInadimplencia };
