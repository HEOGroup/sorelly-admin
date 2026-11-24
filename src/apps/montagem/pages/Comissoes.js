// Sorelly Admin — pages/Comissoes.js
// Financeiro › Representantes › Comissões. Aqui ficam os VALORES (contas, Point, link…): o setor de agendamento não vê esta tela.
//   TELA (Opção A, Marcus, 12/11/2026): escolhe a DATA de pagamento no topo; cada representante é um bloco com as revendedoras dela e a linha de pagar embaixo.
//   UMA LINHA POR REVENDEDORA: quem pagou de uma forma só confere na própria linha; quem tem 2, 3, 4 pagamentos mostra o total e abre os pagamentos ao clicar (já nasce aberta se falta conferir).
//   Três etapas: 1 Conferir o que entrou → 2 Pagar a comissão → 3 Pagas. O próximo passo BRILHA (o check a marcar; com tudo marcado, o botão Registrar pagamento).
//   Resumo do mês (por representante, recebido por conta, taxas, erros, regras) e Pix representante ficam em visões à parte, no menu Visão da barra.
// Cada valor tem um check do financeiro com o nome de quem confirmou; o que o agendamento ainda não conferiu no Consolidado aparece como pendente.
// Em cada data: combustível (km × gasolina do dia), ajuste do fechamento anterior e o pagamento, tudo ali do lado.
// VISUAL (23/11/2026, padrão da Contas a pagar): bloco azul (BlocoPainel), menus na barra (BarraTabela + CampoMini), toda tabela é a TabelaPlanilha (filtro no nome da coluna),
// total na última linha da tabela, letra de 11 e 13 px e nada em caixa alta. As regras e os valores continuam vindo do domínio (domain/comissoes.js): esta tela só desenha.
import { unico, relatorioTaxas, chaveFech, comisEfetiva, corteDe, datasDoMes, dataHora, faltaDe, janelaDe, fmtDataBR, grupoDaRep, itensComissao, pagoDe, pctDaRep, quemNome, r2, repsEfetivas, resumoSituacao } from "@/apps/montagem/domain/comissoes";
import { podeConfigComissao, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { AbaConfigComissoes } from "@/apps/montagem/pages/ConfigComissoes";
import { ComissoesKitNovo } from "@/apps/montagem/pages/ComissoesKitNovo";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { nomePropio } from "@/apps/montagem/lib/nome-conta";
import { BarraTabela, BuscaMini, CampoMini, CelulaBarra, CLS_FINA_ESPACO } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { AbaRegrasRepresentantes } from "@/apps/montagem/pages/RegrasRepresentantes";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { reducer } from "@/apps/montagem/state/reducer";
import { MoneyInput } from "@/apps/montagem/ui/input";
import { e, useMemo, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
// Raiz da tela: cola nas bordas como a Comissão interna, linhas brancas dos blocos e nada em caixa alta (Marcus, 20/11/2026)
var MARGEM = "-mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3 flex flex-col";
// a tela ocupa a janela até embaixo (sem faixa preta): a altura mínima vai até o fim da janela e o bloco marcado com "preenche" ocupa a sobra
var refTela = function(el){ if(!el) return; var aj = function(){ el.style.minHeight = Math.max(200, window.innerHeight-el.getBoundingClientRect().top)+"px"; }; aj(); setTimeout(aj, 200); if(!el.__aj){ el.__aj = aj; window.addEventListener("resize", function(){ if(el.__aj) el.__aj(); }); } else el.__aj = aj; };
var np = nomePropio;
var BLOCOS = "flex flex-1 flex-col gap-0 bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_*]:!normal-case [&>section]:!rounded-none [&>section]:!border-x-0 [&>section]:!border-t-0 [&>section]:!border-b-2 [&>section]:!border-white [&>section.preenche]:flex-1 [&>section.preenche]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] "+PADRAO_BLOCOS;
var LINK = "cursor-pointer whitespace-nowrap font-semibold underline underline-offset-2 hover:text-primary";
var BTN_TITULO = "h-5 cursor-pointer whitespace-nowrap rounded border border-white/45 bg-white/10 px-2 text-[11px] font-semibold leading-none text-white hover:bg-white/20";
var TABELA = {chave:"id", fina:true, grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true};
var tabela = function(o){ return e(TabelaPlanilha, Object.assign({}, TABELA, o)); };
var SEP = "\u0001";
var SEM_REP = "Sem representante";

var arred = function(n){ return (Math.round(n*10)/10).toLocaleString("pt-BR"); };
var noPeriodoDe = function(ano, mes){ return function(ym){ return (ym||"").slice(0,4)===ano && (mes==="" || (ym||"").slice(5,7)===mes); }; };
// Média de km por atendimento: vermelho = acima da média de todas, verde = abaixo
function corMedia(m, geral){ return m==null || m==="" || !(geral>0) ? "" : m>geral*1.0001 ? "text-[#F87171]" : ""; }
// Botão dentro da barra azul dos menus (a barra já dá a altura e a letra)
function BotaoBarra(p){ return e("button",{type:"button", onClick:p.onClick, title:p.title, className:"whitespace-nowrap rounded border font-semibold "+(p.alerta ? "text-warning" : "text-white")}, p.children); }

// Preço médio da gasolina (ANP, Paraná): quem paga a comissão atualiza antes de pagar
var LINK_ANP = "https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas";
function BlocoGasolina(p){
  var s = p.s, d = p.d, c = p.c, fin = p.fin, g = c.gasolinaPR || {}, hist = c.gasolinaHist || [];
  var st = useState(g.valor||0), v = st[0], setV = st[1];
  var atual = !!g.em && isoDia(new Date(g.em))===isoDia(new Date());
  var linhas = hist.map(function(h, i){ return {id:i, em:dataHora(h.em), por:quemNome(h.por), valor:h.valor}; });
  var campo = [{id:"g"}];
  return e(BlocoPainel,{titulo:"Gasolina PR (ANP)", compacto:true, dir:g.em ? BK(g.valor)+" por litro" : "Ainda não informada"},
    tabela({semFiltro:true, linhas:campo, cols:[
      {k:"sit", t:"Situação", render:function(){ return atual ? "Atualizada em "+dataHora(g.em)+" · "+quemNome(g.por) : g.em ? "Desatualizado desde "+dataHora(g.em) : "Ainda não informada"; }, cor:function(){ return atual ? "" : "text-[#FBBF24]"; }},
      {k:"anp", t:"Painel da ANP", render:function(){ return e("a",{href:LINK_ANP, target:"_blank", rel:"noreferrer", className:LINK, title:"Semana mais recente › planilha Preços médios semanais › Paraná › Gasolina comum › Preço médio de revenda"}, "Abrir o painel da ANP"); }},
      {k:"preco", t:"Preço médio PR (R$ por litro)", render:function(){ return e(MoneyInput,{value:v, sm:true, label:"Preço médio da gasolina comum no Paraná", className:"w-28", disabled:!fin, onChange:setV}); }},
      {k:"acao", t:"Atualizar", render:function(){ var off = !fin || !(v>0) || v===g.valor; return e("button",{type:"button", disabled:off, className:LINK+(off ? " opacity-50" : ""), title:"O combustível de cada representante: km ÷ "+c.kmPorLitro+" km por litro × preço do litro", onClick:function(){ d({type:"COMIS_GAS", valor:v, por:s.usuario, corteHora:c.corteHora, kmPorLitro:c.kmPorLitro}); }}, "Atualizar"); }}]}),
    tabela({cols:[{k:"em", t:"Data e hora"}, {k:"por", t:"Quem atualizou"}, {k:"valor", t:"Preço por litro", fmt:BK}], linhas:linhas, vazio:"Nenhuma atualização ainda."}));
}


// SIMULAÇÃO (23/11/2026, pedido do Marcus: "simula como se fosse tudo vários erros"): copia os acertos da tela e finge a conferência do Consolidado, com erros de propósito.
// NADA É GRAVADO: a simulação roda num estado só da tela, com o mesmo reducer, e some ao voltar para "Reais". Cenários, em rodízio pelos acertos:
//   conferido e financeiro ok · conferido SEM assinatura (fica pendente a assinatura) · valor diferente · ainda não conferido · conta errada · não identificado.
// Também simula o km: no prazo, fora do prazo e sem km.
function montaSimulacao(real0){
  var real = real0;
  var modelos = (real0.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && r.origem!=="interno"; });
  if(modelos.length){
    var reps = [], vistos = {}; repsEfetivas(real0).forEach(function(x){ var k = String(x.nome).toLowerCase().trim(); if(!vistos[k]){ vistos[k] = 1; reps.push(x.nome); } });
    var hoje = new Date(), ymA = isoDia(hoje).slice(0, 7), ymP = isoDia(new Date(hoje.getFullYear(), hoje.getMonth()-1, 15)).slice(0, 7);
    var descDe = function(k){ var f0 = (real0.formasPagamento||[]).find(function(x){ return x.k===k; }); return f0 && f0.descricoes[0] || ""; };
    var formasSim = ["pix", "link", "dinheiro", "credito", "pix"].filter(function(k){ return descDe(k); });
    var extra = [];
    for(var i = 0; i<180 && reps.length && formasSim.length; i++){
      var m0 = modelos[i % modelos.length], dia = 1 + (i*7) % 28, valor = 300 + (i*137) % 2600, np0 = 1 + i % 3, pags = [], resto = valor;
      for(var q = 0; q<np0; q++){ var v = q===np0-1 ? resto : Math.round(valor/np0*100)/100; resto = Math.round((resto-v)*100)/100; var fk = formasSim[(i+q) % formasSim.length]; pags.push({forma:fk, descricao:descDe(fk), valor:v}); }
      extra.push(Object.assign({}, m0, {id:"sim-"+i, tipo:"acerto", rev:"Revendedora Simulada "+(i+1), rep:reps[i % reps.length], data:(i%5===0 ? ymP : ymA)+"-"+String(dia).padStart(2, "0"),
        valorAcerto:valor, valorDevido:valor, vendaLiquida:Math.round(valor*1.6), pagamentos:pags, recebimento:{}, fin:{}, divs:{}, abatidoDivida:0, excedenteBrinde:0, multas:0, remarcacoes:[], kitNovoOk:false, desistencia:false, tipoKit:undefined, assinatura:undefined}));
    }
    real = Object.assign({}, real0, {acertosConsignado:(real0.acertosConsignado||[]).concat(extra)});
  }
  var iso = new Date(Date.now()-86400000).toISOString(), por = real.usuario;
  var contasTodas = []; (real.formasPagamento||[]).forEach(function(f0){ f0.descricoes.forEach(function(x){ if(contasTodas.indexOf(x)<0) contasTodas.push(x); }); });
  var cen = {}, n = 0;
  (real.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && r.origem!=="interno"; }).sort(function(a, b){ return String(a.id).localeCompare(String(b.id)); }).forEach(function(r){ cen[r.id] = n++ % 6; });
  var st = Object.assign({}, real, {comis:Object.assign({}, real.comis, {exigirProm:true}), acertosConsignado:(real.acertosConsignado||[]).map(function(r){
    if(cen[r.id]===undefined) return r;
    var k = cen[r.id], rec = k===3 ? {} : {ok:true, em:iso, semCond:false, prom:{ok:k!==1, em:iso}};
    return Object.assign({}, r, {recebimento:Object.assign({}, r.recebimento||{}, rec), fin:{}, divs:{}}); })});
  var passos = [];
  (st.acertosConsignado||[]).forEach(function(r){
    var k = cen[r.id]; if(k===undefined) return;
    var pgs = r.pagamentos||[], idxs = pgs.map(function(p, i){ return i; }).filter(function(i){ return pgs[i].forma!=="acerto_loja" && pgs[i].forma!=="pix_representante"; });
    if(!idxs.length) return;
    if(k===0) passos.push({type:"COMIS_FIN", id:r.id, idxs:idxs, por:por});
    if(k===2 && pgs[idxs[0]].valor>0) passos.push({type:"COMIS_DIV", id:r.id, idx:idxs[0], tipo:"valor", valor:Math.round(pgs[idxs[0]].valor*90)/100, por:por});
    if(k===4){ var outra = contasTodas.filter(function(x){ return x!==pgs[idxs[0]].descricao; })[0]; if(outra) passos.push({type:"COMIS_DIV", id:r.id, idx:idxs[0], tipo:"conta", conta:outra, por:por}); }
    if(k===5) passos.push({type:"COMIS_DIV", id:r.id, idx:idxs[0], tipo:"nao_ident", por:por});
  });
  passos.forEach(function(a){ st = reducer(st, a); });
  // km: um terço no prazo, um terço fora do prazo, um terço sem km
  var c1 = comisEfetiva(st), chaves = {}, ordem = [];
  itensComissao(c1, st, Date.now()).forEach(function(i){ if(i.dest && i.dataRem && !chaves[i.dest+"|"+i.dataRem]){ chaves[i.dest+"|"+i.dataRem] = 1; ordem.push([i.dest, i.dataRem]); } });
  ordem.forEach(function(x, j){ if(j%3===2) return;
    var corte = corteDe(c1, x[1]);
    st = reducer(st, {type:"COMIS_FECH", key:chaveFech(x[1], x[0]), patch:{km:100+j*7, kmPor:"rep", kmTs:new Date(j%3===0 ? corte-3600000 : corte+3600000).toISOString(), kmModo:"total"}}); });
  return st;
}

// O brilho mostra por onde começar: fica em UM lugar só da tela (o próximo check; com tudo marcado, o botão de pagar).
var ESTILO_BRILHO = "@keyframes comisBrilho{0%,100%{box-shadow:0 0 0 1px #E8B84B,0 0 0 0 rgba(232,184,75,0)}50%{box-shadow:0 0 0 1px #E8B84B,0 0 14px 4px rgba(232,184,75,.75)}}.comis-brilha{animation:comisBrilho 1.3s ease-in-out infinite;border-radius:6px}";
var COR_OK = "#FFFFFF", COR_FALTA = "#FBBF24", COR_RUIM = "#F87171";
// linha que o financeiro ainda pode conferir
function marcavel(it){ return !it.confirmado && !it.motivo && !it.loja && !it.pixRep; }
// Etapa da representante numa data: 1 conferir · 2 pagar · 3 paga · 0 nada a fazer agora (antes do corte ou aguardando outro setor)
function etapaDe(rs){
  var normais = rs.itens.filter(function(i){ return !i.loja && !i.pixRep; }), falta = rs.itens.filter(marcavel).length;
  if(falta>0) return {n:1, txt:"Conferir "+normais.filter(function(i){ return i.confirmado; }).length+" de "+normais.length, cor:COR_FALTA, falta:falta};
  if(rs.paga) return {n:3, txt:rs.falta<-0.009 ? "Paga a mais" : "Paga", cor:COR_OK, falta:0};
  if(rs.falta>0.009) return rs.aposCorte ? {n:2, txt:"A pagar", cor:COR_RUIM, falta:0} : {n:0, txt:"Antes do corte", cor:"", falta:0};
  return {n:0, txt:rs.itens.some(function(i){ return i.motivo && !i.confirmado; }) ? "Aguardando" : "Sem valor a pagar", cor:"", falta:0};
}

// Divergência de uma linha: a célula mostra o que foi registrado ou o botão; o editor abre numa tabela logo abaixo (EditorDiv)
function Divergencia(p){
  var it = p.it, dv = it.div;
  if(dv) return e("span",{className:"inline-flex items-center gap-2", style:{color:dv.tipo==="valor" || dv.tipo==="conta" ? COR_FALTA : COR_RUIM},
      title:dv.tipo==="valor" ? "Lançou "+BK(dv.valorErrado)+", entrou "+BK(dv.valorCerto) : dv.tipo==="conta" ? dv.contaErrada+" → "+dv.contaCerta : "Pagamento não identificado · representante avisada"},
    dv.tipo==="valor" ? "Valor corrigido" : dv.tipo==="conta" ? "Conta corrigida" : "Não identificado",
    p.fin && e("button",{type:"button", onClick:function(){ p.d({type:"COMIS_DIV", id:it.r.id, idx:it.chave, tipo:"limpar"}); }, "aria-label":"Desfazer divergência", title:"Desfazer", className:"text-foreground hover:text-primary"}, "×"));
  if(!p.fin || it.motivo || it.loja || it.tipo!=="pag" || it.pixRep) return "—";
  return e("button",{type:"button", onClick:p.abrir, "aria-expanded":p.aberto, className:LINK}, p.aberto ? "Fechar" : "Divergência");
}
// editor da divergência: uma tabela de uma linha (Revendedora | Divergência | Ação), sem faixa solta
function EditorDiv(p){
  var it = p.it, d = p.d, s = p.s, ms = useState("menu"), modo = ms[0], setModo = ms[1], vs = useState(it.valorPago), val = vs[0], setVal = vs[1], cs = useState(""), conta = cs[0], setConta = cs[1];
  var grava = function(a){ d(Object.assign({type:"COMIS_DIV", id:it.r.id, idx:it.chave, por:s.usuario}, a)); p.fechar(); };
  var lk = function(txt, onClick, off){ return e("button",{key:txt, type:"button", disabled:off, onClick:onClick, className:LINK+(off ? " opacity-50" : "")}, txt); };
  var campoDiv = function(){
    if(modo==="valor") return e(MoneyInput,{value:val, sm:true, label:"Valor correto que entrou", className:"w-32", onChange:setVal});
    if(modo==="conta") return e("select",{value:conta, "aria-label":"Conta certa", className:CAMPO+" w-64! cursor-pointer", onChange:function(ev){ setConta(ev.target.value); }}, e("option",{value:""},"Conta certa"), p.contas.map(function(x){ return e("option",{key:x, value:x}, x); }));
    return e("span",{className:"inline-flex items-center gap-4"}, lk("Valor diferente", function(){ setModo("valor"); }), lk("Conta errada", function(){ setModo("conta"); }), lk("Não identificado", function(){ grava({tipo:"nao_ident"}); }));
  };
  var acao = function(){ return e("span",{className:"inline-flex items-center gap-4"},
    modo==="valor" && lk("Confirmar", function(){ grava({tipo:"valor", valor:val}); }, !(val>0)),
    modo==="conta" && lk("Confirmar", function(){ grava({tipo:"conta", conta:conta}); }, !conta),
    lk("Cancelar", p.fechar)); };
  return tabela({semFiltro:true, cols:[{k:"rev", t:"Divergência de"}, {k:"campo", t:"Divergência", render:campoDiv}, {k:"acao", t:"Ação", render:acao}], linhas:[{id:"div", rev:np(it.rev), campo:"", acao:""}]});
}

// Fim do bloco da representante, tudo em tabela: resumo (atendimentos, combustível, a pagar, pago, restante, situação), pagamentos já feitos e o formulário de pagar (uma linha)
function PagarTabelas(p){
  var s = p.s, d = p.d, rs = p.rs, fin = p.fin, et = p.et, key = chaveFech(p.data, p.rep), formas = s.formasPagamento||[];
  var st = useState({forma:"pix", conta:"", data:isoDia(new Date()), valor:0}), f = st[0], setF = st[1];
  var forma = formas.find(function(x){ return x.k===f.forma; }) || {descricoes:[]};
  var valor = f.valor>0 ? f.valor : Math.max(0, rs.falta);
  var podeAdd = fin && rs.aposCorte && valor>0 && f.conta && rs.falta>0.009 && valor <= rs.falta+0.009;
  var jan = p.jan, kmTxt = rs.itens.length===0 ? "sem atendimentos no período"
    : rs.kmTarde ? "km fora do prazo: paga na próxima data"
    : rs.kmAtras>0 && !(rs.km>0) ? "inclui km do período anterior"
    : rs.km>0 ? arred(rs.km)+" km · "+(rs.preco>0 ? arred(rs.litros)+" litros × "+BK(rs.preco) : "falta o preço da gasolina")
    : "km não enviado";
  var corteTxt = new Date(rs.corte).toLocaleString("pt-BR",{day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"});
  var mostraForm = fin && rs.aPagar>0.009 && !rs.paga && rs.aposCorte;
  var kt = useState(rs.kmTotal ? String(rs.kmTotal) : ""), kmV = kt[0], setKmV = kt[1], kmN = parseFloat(String(kmV).replace(",", "."))||0;
  var para = function(ev){ ev.stopPropagation(); };
  var muda = function(patch){ setF(Object.assign({}, f, patch)); };
  var faltaConf = et.n===1, antesCorte = rs.aPagar>0.009 && !rs.paga && !rs.aposCorte;
  var sit = faltaConf ? (et.falta===1 ? "Falta 1 conferência" : "Faltam "+et.falta+" conferências")+" para liberar tudo" : antesCorte ? "O pagamento libera depois do corte: "+corteTxt : et.txt;
  var resumo = [{id:"res", atend:fmtDataBR(jan.ini).slice(0,5)+" a "+fmtDataBR(jan.fim).slice(0,5), comb:(rs.comb>0.009 ? BK(rs.comb)+" · " : "")+kmTxt, aPagar:rs.aPagar, pago:rs.pagos, rest:rs.falta, sit:sit}];
  var colsRes = [{k:"atend", t:"Atendimentos de"}, {k:"comb", t:"Combustível"}, {k:"aPagar", t:"A pagar", fmt:BK}, {k:"pago", t:"Pago", fmt:BK, cor:function(l){ return l.pago>0.009 ? "" : ""; }},
    {k:"rest", t:"Restante", render:function(v){ return v<-0.009 ? "Pago a mais "+BK(-v) : BK(Math.max(0, v)); }, cor:function(l){ return l.rest>0.009 ? "text-[#F87171]" : ""; }},
    {k:"sit", t:"Situação", cor:function(){ return faltaConf || antesCorte ? "text-[#FBBF24]" : ""; }}];
  if(fin && rs.itens.length>0) colsRes.splice(2, 0,
    {k:"km", t:"Km do período", semFiltro:true, render:function(){ return e("input",{type:"number", inputMode:"decimal", min:0, step:"0.1", value:kmV, placeholder:"Ex.: 110", "aria-label":"Km total do período", onClick:para, className:CAMPO+" w-24! border-0 bg-transparent text-center", onChange:function(ev){ setKmV(ev.target.value); }}); }},
    {k:"lanca", t:"Lançar km", semFiltro:true, render:function(){ var off = !(kmN>0) || kmN===rs.kmTotal; return e("button",{type:"button", disabled:off, title:(rs.kmTs ? "Km enviado em "+dataHora(rs.kmTs)+". " : "Km ainda não enviado. ")+"O financeiro lança ou corrige aqui; vale como enviado no prazo", className:LINK+(off ? " opacity-50" : ""), onClick:function(){ d({type:"COMIS_FECH", key:key, patch:{km:kmN, kmPor:"admin", kmTs:new Date().toISOString(), kmModo:"total"}}); }}, rs.kmTotal ? "Atualizar km" : "Lançar km"); }});
  var feitos = rs.diretos.map(function(it){ return {id:"d"+it.id, pag:"Pix direto de "+np(it.rev), conta:"—", data:it.data, valor:it.valorPago, por:"—", i:-1}; })
    .concat(rs.lista.map(function(g, i){ return {id:"p"+i, pag:(formas.find(function(x){ return x.k===g.forma; })||{}).label||g.forma, conta:np(g.conta), data:g.data, valor:g.valor, por:quemNome(g.por), i:i}; }));
  var colsFeitos = [{k:"pag", t:"Pagamento feito"}, {k:"conta", t:"Conta"}, {k:"data", t:"Data", fmt:fmtDataBR}, {k:"valor", t:"Valor", fmt:BK, cor:function(){ return ""; }}, {k:"por", t:"Quem"},
    {k:"acao", t:"Desfazer", semFiltro:true, render:function(v, l){ return fin && l.i>=0 ? e("button",{type:"button", onClick:function(){ d({type:"COMIS_FECH_PAG", key:key, del:l.i}); }, "aria-label":"Desfazer pagamento", title:"Desfazer pagamento", className:LINK}, "Desfazer") : "—"; }}];
  var colsForm = [
    {k:"forma", t:"Forma", semFiltro:true, render:function(){ return e("select",{value:f.forma, "aria-label":"Forma do pagamento", onClick:para, className:CAMPO+" cursor-pointer border-0 bg-transparent text-center", onChange:function(ev){ muda({forma:ev.target.value, conta:""}); }},
      formas.filter(function(x){ return x.k!=="pix_representante" && x.k!=="acerto_loja"; }).map(function(x){ return e("option",{key:x.k, value:x.k}, x.label); })); }},
    {k:"conta", t:"Conta de saída", semFiltro:true, render:function(){ return e("select",{value:f.conta, "aria-label":"Conta de saída", onClick:para, className:CAMPO+" cursor-pointer border-0 bg-transparent text-center", onChange:function(ev){ muda({conta:ev.target.value}); }},
      e("option",{value:""},"Escolha a conta"), forma.descricoes.map(function(x){ return e("option",{key:x, value:x}, np(x)); })); }},
    {k:"data", t:"Data do pagamento", semFiltro:true, render:function(){ return e("input",{type:"date", value:f.data, "aria-label":"Data do pagamento", onClick:para, className:CAMPO+" border-0 bg-transparent text-center [color-scheme:dark]", onChange:function(ev){ muda({data:ev.target.value}); }}); }},
    {k:"valor", t:"Valor pago", semFiltro:true, render:function(){ return e(MoneyInput,{value:valor, sm:true, label:"Valor pago", className:"w-32", onChange:function(v){ muda({valor:v}); }}); }},
    {k:"acao", t:"Registrar", semFiltro:true, render:function(){ return e("span",{className:"inline-flex "+(p.brilha && f.conta ? "comis-brilha" : "")},
      e("button",{type:"button", disabled:!podeAdd, title:!f.conta ? "Escolha a conta de saída" : "Registrar pagamento", className:LINK+(podeAdd ? "" : " opacity-50"),
        onClick:function(){ d({type:"COMIS_FECH_PAG", key:key, por:s.usuario, pag:{forma:f.forma, conta:f.conta, data:f.data, valor:valor}}); muda({valor:0}); }}, "Registrar pagamento")); }}];
  return e(React.Fragment,null,
    tabela({cols:colsRes, linhas:resumo, semFiltro:true}),
    feitos.length>0 && tabela({cols:colsFeitos, linhas:feitos, semFiltro:true}),
    mostraForm && tabela({cols:colsForm, linhas:[{id:"form"}], semFiltro:true}));
}

// O corpo da representante numa data de pagamento (tudo em tabela): as revendedoras (uma linha por acerto, total na última linha), a divergência, o resumo, os pagamentos e o formulário de pagar.
// É usado no bloco da visão Pagar e abre para baixo, dentro da linha, na visão Pix representante.
function CorpoRep(p){
  var s = p.s, d = p.d, c = p.c, rs = p.rs, fin = p.fin, et = p.et, dv = useState(null), divAb = dv[0], setDivAb = dv[1];
  var formas = s.formasPagamento||[], travada = (rs.lista||[]).length>0, pct = pctDaRep(c, p.rep);
  var contasDe = function(k, atual){ var f = formas.find(function(x){ return x.k===k; }), l = f ? f.descricoes.slice() : p.contas.slice(); if(atual && l.indexOf(atual)<0) l.unshift(atual); return l; };
  var confirma = function(it, conta){ if(!fin) return d({type:"AVISO", txt:"Só o financeiro e a supervisão fazem a conciliação"}); d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, conta:conta, por:s.usuario}); };
  var itens = rs.itens.slice().sort(function(x, y){ return x.r.data.localeCompare(y.r.data) || x.r.id.localeCompare(y.r.id); });
  var nRev = itens.map(function(i){ return i.r.id; }).filter(function(x, i, a){ return a.indexOf(x)===i; }).length;
  // UMA LINHA POR REVENDEDORA (acerto). Um pagamento só: confere na própria linha. Dois ou mais: a linha mostra o total e os pagamentos abrem ao clicar.
  // Cada célula tem largura mínima fixa, para as colunas ficarem alinhadas de um bloco para o outro. Clicar num campo não abre nem fecha a linha.
  var para = function(ev){ ev.stopPropagation(); };
  var cx = function(larg, filho, brilha){ return e("span",{className:"inline-flex items-center justify-center gap-2 "+larg+(brilha ? " comis-brilha" : "")}, filho); };
  var contaTxt = function(it){ return it.tipo!=="pag" ? it.status+" · comissão fixa" : it.pixRep ? "Pix para "+(it.dest ? np(it.dest) : "a representante") : np(it.fin ? it.fin.conta : it.conta)+(it.extra ? " · pago depois" : ""); };
  var confTxt = function(it){ return it.pixRep ? "Pix direto · entra em Pago" : it.loja ? "Sem pagamento · Inadimplência" : it.confirmado ? "Conferido" : it.motivo ? it.motivo.replace("Aguardando o agendamento conferir", "Aguardando o agendamento") : "Falta conferir"; };
  // a forma não tem coluna: o nome da conta já diz (PIX, LINK, DINHEIRO)
  var contaCel = function(it){ var pode = fin && marcavel(it) && it.tipo==="pag";
    return pode ? e("select",{id:"conta-"+it.id, defaultValue:it.conta, onClick:para, "aria-label":"Conta em que entrou", className:CAMPO+" cursor-pointer border-0 bg-transparent text-center"}, contasDe(it.forma, it.conta).map(function(x){ return e("option",{key:x, value:x}, x); })) : contaTxt(it); };
  var confCel = function(it){
    if(it.pixRep || it.loja || (it.motivo && !it.confirmado)) return e("span",{style:{color:it.pixRep ? COR_OK : it.loja ? COR_RUIM : COR_FALTA}}, confTxt(it));
    if(it.confirmado) return e("label",{onClick:para, className:"inline-flex items-center gap-2", style:{color:COR_OK}},
      e("input",{type:"checkbox", checked:true, disabled:!fin || travada, className:"size-4 cursor-pointer accent-primary", "aria-label":"Desfazer conferência de "+it.rev, title:travada ? "Já tem pagamento registrado nesta data" : "Desfazer",
        onChange:function(){ d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, ok:false}); }}), quemNome(it.fin.por)+" · "+dataHora(it.fin.ts));
    return e("label",{onClick:para, className:"inline-flex items-center gap-2", style:{color:COR_FALTA}},
      e("span",{className:"inline-flex "+(p.brilhaId===it.id ? "comis-brilha" : "")}, e("input",{type:"checkbox", checked:false, disabled:!fin, className:"size-4 cursor-pointer accent-primary", "aria-label":"Conferir o pagamento de "+it.rev,
        onChange:function(){ var el = document.getElementById("conta-"+it.id); confirma(it, el ? el.value : it.conta); }})), "Falta conferir"); };
  var divCel = function(it){ return e("span",{onClick:para, className:"inline-flex"}, e(Divergencia,{it:it, d:d, fin:fin, aberto:divAb===it.id, abrir:function(){ setDivAb(divAb===it.id ? null : it.id); }})); };
  var grupos = {}, ordemAc = []; itens.forEach(function(it){ if(!grupos[it.r.id]){ grupos[it.r.id] = []; ordemAc.push(it.r.id); } grupos[it.r.id].push(it); });
  var linhas = ordemAc.map(function(id){ var its = grupos[id], um = its.length===1 ? its[0] : null, normais = its.filter(function(i){ return !i.loja && !i.pixRep; }), ok = normais.filter(function(i){ return i.confirmado; }).length;
    var pags = its.filter(function(i){ return i.tipo==="pag"; }), nDiv = its.filter(function(i){ return i.div; }).length, bloq = its.filter(function(i){ return i.motivo && !i.confirmado; })[0];
    return {id:id, its:its, um:um, rev:np(its[0].rev), data:fmtDataBR(its[0].r.data).slice(0,5), conta:um ? contaTxt(um) : its.length+" pagamentos",
      valor:pags.length ? pags.reduce(function(t, i){ return t+i.valorPago; }, 0) : "", comissao:normais.length ? normais.reduce(function(t, i){ return t+i.comissao; }, 0) : "",
      conf:um ? confTxt(um) : its.some(marcavel) || !bloq ? ok+" de "+normais.length+" conferidos" : confTxt(bloq), okTudo:normais.length>0 && ok===normais.length, falta:its.some(marcavel),
      div:um ? (um.div ? (um.div.tipo==="valor" ? "Valor corrigido" : um.div.tipo==="conta" ? "Conta corrigida" : "Não identificado") : "") : nDiv ? nDiv+(nDiv===1 ? " divergência" : " divergências") : ""}; });
  var cols = [
    {k:"rev", t:"Revendedora", render:function(v, l, ab2){ return cx("min-w-[17rem]", (l.um ? "" : ab2 ? "▾ " : "▸ ")+v); }},
    {k:"data", t:"Data", render:function(v){ return cx("min-w-[3rem]", v); }},
    {k:"conta", t:"Conta em que entrou", render:function(v, l){ return cx("min-w-[15rem]", l.um ? contaCel(l.um) : e("b",null, v)); }},
    {k:"valor", t:"Valor", render:function(v){ return cx("min-w-[6rem] tabular-nums", v==="" ? "—" : BK(v)); }},
    {k:"comissao", t:"Comissão "+pct+"%", render:function(v){ return cx("min-w-[6rem] tabular-nums text-[#F3D98B]", v==="" ? "—" : BK(v)); }},
    {k:"conf", t:"Conferido", render:function(v, l, ab2){ return cx("min-w-[13rem]", l.um ? confCel(l.um) : e("span",{style:{color:l.okTudo ? COR_OK : COR_FALTA}}, v), !l.um && !ab2 && l.its.some(function(i){ return i.id===p.brilhaId; })); }},
    {k:"div", t:"Divergência", render:function(v, l){ return cx("min-w-[7rem]", l.um ? divCel(l.um) : (v ? e("span",{style:{color:COR_FALTA}}, v) : "—")); }}];
  // os pagamentos de quem tem mais de um: abrem embaixo da linha da revendedora, na mesma peça de tabela (sem filtro: são 2 a 4 linhas)
  var colsDet = [
    {k:"n", t:"Pagamento"},
    {k:"conta", t:"Conta em que entrou", render:function(v, l){ return contaCel(l.it); }},
    {k:"valor", t:"Valor", render:function(v, l){ return e("span",{className:"tabular-nums"}, l.it.tipo==="pag" ? BK(l.it.valorPago) : "—"); }},
    {k:"comissao", t:"Comissão "+pct+"%", render:function(v, l){ return e("span",{className:"tabular-nums text-[#F3D98B]"}, l.it.loja || l.it.pixRep ? "—" : BK(l.it.comissao)); }},
    {k:"conf", t:"Conferido", render:function(v, l){ return confCel(l.it); }},
    {k:"div", t:"Divergência", render:function(v, l){ return divCel(l.it); }}];
  var detalhe = function(l){ if(l.um) return null;
    return tabela({cols:colsDet, semFiltro:true, linhas:l.its.map(function(it, i){ return {id:it.id, it:it, n:"Pagamento "+(i+1)+" de "+l.its.length}; }), linhaCls:function(x){ return marcavel(x.it) ? "bg-[#FBBF24]/10" : ""; }}); };
  var rodape = function(ls){ var nOk = 0, nTot = 0; ls.forEach(function(l){ l.its.forEach(function(i){ if(!i.loja && !i.pixRep){ nTot++; if(i.confirmado) nOk++; } }); });
    var somaValor = ls.reduce(function(t, l){ return t+(l.valor==="" ? 0 : l.valor); }, 0);
    return ["Total · "+nRev+(nRev===1 ? " revendedora" : " revendedoras"), "", "", BK(somaValor), BK(rs.comissaoTotal), nTot ? nOk+" de "+nTot+(nTot===1 ? " conferido" : " conferidos") : "—", ""]; };
  var itDiv = divAb ? itens.filter(function(i){ return i.id===divAb; })[0] : null;
  return e(React.Fragment,null,
    e("div",{className:p.cheia ? "flex min-h-0 flex-1 flex-col" : ""}, tabela({cols:cols, linhas:linhas, cheia:!!p.cheia, vazio:"Nenhum atendimento nesta data.", detalhe:detalhe, totalRodape:rodape,
      linhaCls:function(l){ return l.falta ? "bg-[#FBBF24]/10" : ""; }})),
    itDiv && e(EditorDiv,{it:itDiv, d:d, s:s, contas:contasDe(itDiv.forma, itDiv.conta), fechar:function(){ setDivAb(null); }}),
    e(PagarTabelas,{s:s, d:d, rs:rs, fin:fin, et:et, rep:p.rep, data:p.data, jan:p.jan, brilha:p.brilhaPagar}));
}

// PIX REPRESENTANTE (23/11/2026, pedido do Marcus: "exatamente igual a tela do Resumo geral"): a mesma tela do Pagamentos › Resumo geral, no lugar dos fornecedores e prestadores ficam as representantes.
// Um bloco com faixas de título e tabelas Tipo | Nome | A pagar | Pago | Saldo | Data (uma linha por representante em cada data de pagamento, e uma linha por Pix que a revendedora mandou direto).
// Clicar numa linha abre PARA BAIXO, dentro da própria tabela: na representante, a conferência dos atendimentos, a divergência e o Registrar pagamento (as mesmas ações de Pagar); no Pix, a escolha de quem recebeu e o Confirmar. Tudo em tabela.
var RAIZ_PIX = "[&_table_tbody_tr:last-child_td]:!border-b [&_table]:!border [&_table]:!border-solid [&_table]:!border-white [&_tbody_td]:!bg-[color-mix(in_srgb,var(--bloco-colunas)_38%,transparent)] [&_tr.rg-sel_td]:!bg-[var(--bloco-titulo)] [&_tr.rg-sel_td]:!h-[34px] [&_table_tfoot_td]:!bg-[var(--bloco-titulo)] [&_tbody_td[colspan]]:!p-0 "+CLS_FINA_ESPACO;
// o que abre embaixo da linha começa na mesma borda da tabela, sem fundo preto, com moldura branca grossa (3 px)
var MOLDURA = "flex flex-col gap-1 border-[3px] border-white";
var ddmm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : ""; };
var normTxt = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var subTitulo = function(t){ return e("div",{className:"flex min-h-6 items-center justify-center border-y border-white/25 bg-[var(--bloco-titulo)] px-4 py-0.5 text-center text-[13px] font-bold leading-tight text-white"}, t); };
function PixRepresentante(p){
  var s = p.s, d = p.d, fin = p.fin, itens = p.itens, nomes = p.nomes, c = p.c, agora = p.agora, hoje = isoDia(new Date(agora));
  var es = useState({}), escolha = es[0], setEscolha = es[1], sd0 = useState(null), selId = sd0[0], setSelId = sd0[1];
  var termos = normTxt(p.busca).split(/\s+/).filter(Boolean);
  var passa = function(l){
    if(p.sit==="aberto" && l.aberto<=0.005) return false;
    if(p.sit==="quitado" && l.aberto>0.005) return false;
    if(p.sit==="atraso" && !(l.data && l.data<hoje && l.aberto>0.005)) return false;
    if(!termos.length) return true;
    var tx = normTxt([l.nome, l.tipo, l.periodo, ddmm(l.data), BK(l.total), BK(l.pago), BK(l.aberto)].join(" "));
    return termos.every(function(t0){ return tx.indexOf(t0)>=0; });
  };
  var linhasA = p.linhas.filter(passa);
  var pixAll = itens.filter(function(i){ return i.pixRep && (!i.dest || (i.data||"").slice(0,7)===p.ym); }).map(function(it){
    return {id:"x|"+it.id, it:it, tipo:"Pix", nome:np(it.rev), total:it.valorPago, pago:it.dest ? it.valorPago : 0, aberto:it.dest ? 0 : it.valorPago, data:it.data}; });
  var pixLinhas = pixAll.filter(passa);
  var soma = function(rows, k){ return rows.reduce(function(t, x){ return t+x[k]; }, 0); };
  var confirmar = function(it){ var rep = escolha[it.id]; if(!rep) return; if(!fin) return d({type:"AVISO", txt:"Só o financeiro e a supervisão confirmam o Pix representante"});
    d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, conta:"PIX REPRESENTANTE", por:s.usuario, rep:rep}); var o = Object.assign({}, escolha); delete o[it.id]; setEscolha(o); };
  var repCel = function(v, l){ var it = l.it, esc = escolha[it.id]||"";
    if(it.dest) return e("span",{className:"inline-flex items-center justify-center gap-2"}, e("b",null, np(it.dest)),
      fin && e("button",{type:"button", onClick:function(){ d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, ok:false}); }, "aria-label":"Desfazer", title:"Desfazer", className:"text-foreground hover:text-primary"}, "×"));
    return e("span",{className:"inline-flex items-center justify-center gap-2"},
      e("select",{value:esc, disabled:!fin, "aria-label":"Representante que recebeu o Pix de "+it.rev, className:CAMPO+" w-48! cursor-pointer", onChange:function(ev){ var o = Object.assign({}, escolha); o[it.id] = ev.target.value; setEscolha(o); }},
        e("option",{value:""},"Escolha a representante"), nomes.map(function(n){ return e("option",{key:n, value:n}, np(n)); })),
      e("button",{type:"button", onClick:function(){ confirmar(it); }, disabled:!fin || !esc, "aria-label":"Confirmar o Pix de "+it.rev, className:LINK+" disabled:opacity-50"}, "Confirmar")); };
  var colsPix = [{k:"rev", t:"Revendedora"}, {k:"data", t:"Data", fmt:fmtDataBR}, {k:"acerto", t:"Acerto de"}, {k:"rep", t:"Representante que recebeu", render:repCel},
    {k:"sit", t:"Situação", cor:function(l){ return l.it.dest ? "" : "text-[#FBBF24]"; }}, {k:"por", t:"Confirmado por", render:function(v){ return v || "—"; }}, {k:"valor", t:"Valor", fmt:BK}];
  var linhaDoPix = function(it){ return {id:it.id, it:it, rev:np(it.rev), data:it.data, acerto:np(it.repAcerto), rep:it.dest || "", sit:it.dest ? "Confirmado" : "Pendente", por:it.dest && it.fin ? quemNome(it.fin.por)+" · "+dataHora(it.fin.ts) : "", valor:it.valorPago}; };
  // as mesmas colunas e cores do Resumo geral: Tipo, Nome, A pagar, Pago, Saldo, Data
  var colsRes = [{k:"tipo", t:"Tipo", w:"6.5rem"}, {k:"nome", t:"Nome", w:"15rem"}, {k:"periodo", t:"Período", w:"9rem", render:function(v){ return v || "—"; }}, {k:"total", t:"A pagar", w:"8rem", fmt:BK}, {k:"pago", t:"Pago", w:"8rem", fmt:BK, cor:function(l){ return l.pago>0.005 ? "" : ""; }},
    {k:"aberto", t:"Saldo", w:"8rem", fmt:BK, cor:function(l){ return l.aberto>0.005 ? "text-red-400" : ""; }}, {k:"data", t:"Data", w:"4.5rem", fmt:ddmm, cor:function(l){ return l.data && l.data<hoje && l.aberto>0.005 ? "text-warning" : ""; }}];
  var detalhe = function(l){
    if(l.rs) return e(React.Fragment,null, e(CorpoRep,{s:s, d:d, c:c, rs:l.rs, et:l.et, fin:fin, contas:p.contas, rep:l.rep, data:l.data, jan:l.jan, brilhaId:null, brilhaPagar:false, cheia:false}));
    if(l.it) return e(React.Fragment,null, e(TabelaPlanilha,{cols:colsPix, linhas:[linhaDoPix(l.it)], chave:"id", fina:true, grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true, semFiltro:true}));
    return null;
  };
  var tabelaRes = function(chave, lista, rotuloTotal){
    return e(TabelaPlanilha,{key:chave+p.ym, cols:colsRes, linhas:lista, chave:"id", grade:true, semCaixaAlta:true, semContagem:true, semLimpar:true, semMao:true, aoClicar:function(l){ setSelId(selId===l.id ? null : l.id); }, linhaCls:function(l){ return l.id===selId ? "rg-sel font-bold !cursor-pointer" : "!cursor-pointer"; },
      totalRodape:function(){ return ["", rotuloTotal, "", BK(soma(lista, "total")), BK(soma(lista, "pago")), BK(soma(lista, "aberto")), ""]; }, vazio:"Nada a pagar neste mês."});
  };
  var linhaSel = selId ? linhasA.concat(pixLinhas).find(function(l){ return l.id===selId; }) : null, corpoSel = linhaSel ? detalhe(linhaSel) : null;
  return e(React.Fragment,null,
    e(BlocoPainel,{titulo:"Resumo - Pix representantes", compacto:true, cls:corpoSel ? "" : "preenche"},
      subTitulo("Representantes · "+p.rotulo), tabelaRes("r", linhasA, "Total representantes"),
      subTitulo("Pix das revendedoras para as representantes"), tabelaRes("x", pixLinhas, "Total Pix")),
    corpoSel && e(BlocoPainel,{titulo:linhaSel.rs ? linhaSel.nome+" · "+linhaSel.periodo : "Pix de "+linhaSel.nome, compacto:true, cls:"preenche", dir:e("button",{type:"button", onClick:function(){ setSelId(null); }, className:BTN_TITULO}, "Fechar")}, corpoSel));
}

// Resumo do mês: uma linha por representante (o filtro da coluna Representante vale para os blocos de baixo), recebido por conta, taxas de deslocamento, erros e regras
function ResumoMes(p){
  var s = p.s, c = p.c, itens = p.itens, agora = p.agora, todasReps = p.todasReps, anoSel = p.anoSel, mesN = p.mesN, mesAtual = p.mesAtual;
  var fv = useState(null), chaveVis = fv[0], setChaveVis = fv[1], tx = useState(false), taxasAb = tx[0], setTaxasAb = tx[1], rg = useState(false), regrasAb = rg[0], setRegrasAb = rg[1];
  var noPeriodo = noPeriodoDe(anoSel, mesN), dono = podeConfigComissao(s.usuario);
  // km e atendimentos de cada representante no período (só para a média de km por atendimento): guardado, porque recalcula todas as datas de pagamento
  var km = useMemo(function(){
    var noPer = noPeriodoDe(anoSel, mesN), o = {};
    todasReps.forEach(function(n){
      var meses2 = {}; meses2[mesAtual] = true; if(mesN!=="") meses2[anoSel+"-"+mesN] = true;
      itens.filter(function(i){ return i.dest===n; }).forEach(function(i){ meses2[i.dataRem.slice(0,7)] = true; });
      var k0 = 0, at = 0;
      Object.keys(meses2).filter(noPer).forEach(function(m){ datasDoMes(c, grupoDaRep(c, n), m).forEach(function(dt){ var rs = resumoSituacao(c, itens, n, dt, agora); if(rs.kmOk && rs.itens.length>0){ k0 += rs.km; at += rs.itens.length; } }); });
      o[n] = {km:k0, at:at}; });
    return o;
  }, [c, itens, agora, todasReps, anoSel, mesN, mesAtual]);
  var mediaDe = function(nomesM){ var k0 = 0, at = 0; nomesM.forEach(function(n){ if(km[n]){ k0 += km[n].km; at += km[n].at; } }); return at>0 ? k0/at : null; };
  var mediaGeral = mediaDe(todasReps);
  var repDe = function(r){ return unico(c, r.rep) || SEM_REP; };   // cadastros do mesmo grupo (Thalita: BI, CU, CV) = uma representante
  var doMes = (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && noPeriodo(r.data); });
  var grupos = {}, ordem = [];
  doMes.forEach(function(r){ var k = repDe(r); if(!grupos[k]){ grupos[k] = {id:k, rep:k, n:0, vendido:0, acerto:0, pago:0, inad:0}; ordem.push(k); }
    var o = grupos[k]; o.n++; o.vendido += r.vendaLiquida||0; o.acerto += r.valorAcerto||0; o.pago += pagoDe(r); o.inad += faltaDe(r); });
  var linhasRep = ordem.sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(k){ var m = km[k]; return Object.assign(grupos[k], {media:m && m.at>0 ? m.km/m.at : ""}); });
  var vis = chaveVis===null ? null : chaveVis.split(SEP), ehVis = function(n){ return !vis || vis.indexOf(n)>=0; };
  var aoFiltrar = function(ls){ var k = ls.length===linhasRep.length ? null : ls.map(function(l){ return l.rep; }).sort().join(SEP); setChaveVis(function(a){ return a===k ? a : k; }); };
  // os totais somam os acertos na mesma ordem de sempre (os valores não mudam com o desenho da tela)
  var somaDe = function(recs){ return {vendido:recs.reduce(function(t,r){ return t+(r.vendaLiquida||0); }, 0), acerto:recs.reduce(function(t,r){ return t+(r.valorAcerto||0); }, 0), pago:recs.reduce(function(t,r){ return t+pagoDe(r); }, 0), inad:recs.reduce(function(t,r){ return t+faltaDe(r); }, 0)}; };
  var rodapeRep = function(ls){ var nomesV = ls.map(function(l){ return l.rep; }), recs = doMes.filter(function(r){ return nomesV.indexOf(repDe(r))>=0; }), t = somaDe(recs), m = ls.length===linhasRep.length ? mediaGeral : mediaDe(nomesV);
    return ["Total · "+ls.length+(ls.length===1 ? " representante" : " representantes"), recs.length, BK(t.vendido), BK(t.acerto), BK(t.pago), BK(t.inad), m!=null ? arred(m) : "—"]; };
  var colsRep = [{k:"rep", t:"Representante", fmt:np}, {k:"n", t:"Acertos"}, {k:"vendido", t:"Vendido", fmt:BK}, {k:"acerto", t:"Acerto", fmt:BK},
    {k:"pago", t:"Pago", fmt:BK, cor:function(l){ return l.pago>0.009 ? "" : ""; }}, {k:"inad", t:"Inadimplência", fmt:BK, cor:function(l){ return l.inad>0.009 ? "text-[#F87171]" : ""; }},
    {k:"media", t:"Km por atendimento", fmt:arred, render:function(v){ return v==="" ? "—" : arred(v); }, cor:function(l){ return corMedia(l.media, mediaGeral); }}];
  // valor que entrou em cada conta, das representantes que estão na tabela de cima
  var recsVis = doMes.filter(function(r){ return ehVis(repDe(r)); }), tot = somaDe(recsVis), totConta = {};
  recsVis.forEach(function(r){ (r.pagamentos||[]).forEach(function(pg){ totConta[pg.descricao] = (totConta[pg.descricao]||0)+(pg.valor||0); }); });
  var somaContas = Object.keys(totConta).reduce(function(t, k){ return t+totConta[k]; }, 0);
  var linhasConta = Object.keys(totConta).map(function(k){ return {id:"c:"+k, nome:k && k!=="undefined" ? k : "Sem conta informada", v:totConta[k], pct:somaContas>0 ? totConta[k]/somaContas*100 : "", inad:false}; })
    .sort(function(a, b){ return b.v-a.v; }).concat([{id:"inad", nome:"Inadimplência", v:tot.inad, pct:"", inad:true}]);
  var pctTxt = function(v){ return v==="" ? "—" : v.toFixed(1).replace(".", ",")+"%"; };
  var corInad = function(l){ return l.inad ? "text-[#F87171]" : ""; };
  // taxas de deslocamento: quantas teve e quantas a revendedora não pagou (quem "não cobra direito" fica com % alto)
  var taxas = relatorioTaxas(s, function(r){ return noPeriodo(r.data) && ehVis(repDe(r)); });
  var tN = taxas.reduce(function(t2,x){ return t2+x.n; }, 0), tNao = taxas.reduce(function(t2,x){ return t2+x.naoPagas; }, 0), tAberto = taxas.reduce(function(t2,x){ return t2+x.aberto; }, 0);
  var linhasTaxa = taxas.map(function(x){ return {id:x.rep, rep:x.rep, n:x.n, pagas:x.pagas, naoPagas:x.naoPagas, pct:x.pct, valor:x.valor, aberto:x.aberto, lista:x.lista}; });
  var colsTaxa = [{k:"rep", t:"Representante", fmt:np}, {k:"n", t:"Taxas"}, {k:"pagas", t:"Pagas", cor:function(){ return ""; }}, {k:"naoPagas", t:"Não pagas", cor:function(l){ return l.naoPagas>0 ? "text-[#F87171]" : ""; }},
    {k:"pct", t:"% não paga", fmt:function(v){ return v+"%"; }, cor:function(l){ return l.pct>=50 ? "text-[#F87171]" : l.pct>0 ? "text-[#FBBF24]" : ""; }},
    {k:"valor", t:"Valor das taxas", fmt:BK}, {k:"aberto", t:"Não recebido", fmt:BK, cor:function(l){ return l.aberto>0 ? "text-[#F87171]" : ""; }}];
  var detTaxa = function(l){ return tabela({semFiltro:true, cols:[{k:"rev", t:"Revendedora", fmt:np}, {k:"data", t:"Data"}, {k:"taxa", t:"Taxa", fmt:BK}, {k:"sit", t:"Situação", cor:function(y){ return y.paga ? "" : "text-[#F87171]"; }}],
    linhas:l.lista.map(function(y){ return {id:y.r.id, rev:y.r.rev, data:fmtDataBR(y.r.data).slice(0,5), taxa:y.taxa, paga:y.paga, sit:y.paga ? "Paga" : "Não paga"}; })}); };
  var rodapeTaxa = function(ls){ var n = ls.reduce(function(t, l){ return t+l.n; }, 0), nao = ls.reduce(function(t, l){ return t+l.naoPagas; }, 0);
    return ["Total", n, ls.reduce(function(t, l){ return t+l.pagas; }, 0), nao, n>0 ? Math.round(nao/n*100)+"%" : "—", BK(ls.reduce(function(t, l){ return t+l.valor; }, 0)), BK(ls.reduce(function(t, l){ return t+l.aberto; }, 0))]; };
  // erros que o financeiro registrou nos pagamentos (divergência de valor, conta errada, pagamento não identificado)
  var erros = [];
  (s.acertosConsignado||[]).filter(function(r){ return r.divs && todasReps.indexOf(unico(c, r.rep))>=0 && ehVis(unico(c, r.rep)); }).forEach(function(r){ Object.keys(r.divs).forEach(function(i){ erros.push({r:r, i:i, dv:r.divs[i]}); }); });
  erros.sort(function(a,b){ return (b.dv.ts||"").localeCompare(a.dv.ts||""); });
  var erroTxt = function(dv){ return dv.tipo==="valor" ? "Valor diferente: lançou "+BK(dv.valorErrado)+", entrou "+BK(dv.valorCerto) : dv.tipo==="conta" ? "Conta errada: "+dv.contaErrada+" → "+dv.contaCerta : "Pagamento não identificado / sem comprovante"; };
  var linhasErro = erros.map(function(x){ return {id:x.r.id+"|"+x.i, quando:dataHora(x.dv.ts), rep:unico(c, x.r.rep), rev:x.r.rev, erro:erroTxt(x.dv), por:quemNome(x.dv.por)}; });
  var nCom = linhasRep.length;
  return e(React.Fragment,null,
    e(BlocoPainel,{titulo:"Resumo por representante · "+p.rotulo, compacto:true, dir:todasReps.length+" no cadastro · "+nCom+" com acerto"},
      tabela({cols:colsRep, linhas:linhasRep, vazio:"Nenhum acerto neste período.", totalRodape:rodapeRep, onFiltradas:aoFiltrar})),
    e(BlocoPainel,{titulo:"Recebido por conta · "+p.rotulo, compacto:true, cls:"preenche", dir:"Pago "+BK(tot.pago)},
      e("div",{className:"flex min-h-0 flex-1 flex-col"}, tabela({cheia:true, cols:[{k:"nome", t:"Conta", fmt:np, cor:corInad}, {k:"v", t:"Valor", fmt:BK, cor:corInad}, {k:"pct", t:"% das contas", fmt:pctTxt, render:pctTxt}], linhas:linhasConta}))),
    e(BlocoPainel,{titulo:"Taxas de deslocamento · "+p.rotulo, compacto:true, aoTitulo:function(){ setTaxasAb(!taxasAb); }, fechado:!taxasAb,
        dir:tN+(tN===1 ? " taxa" : " taxas")+" · "+tNao+(tNao===1 ? " não paga" : " não pagas")+" · "+BK(tAberto)+" não recebido"},
      tabela({cols:colsTaxa, linhas:linhasTaxa, vazio:"Nenhuma taxa de deslocamento neste período.", detalhe:detTaxa, totalRodape:rodapeTaxa})),
    linhasErro.length>0 && e(BlocoPainel,{titulo:"Erros registrados", compacto:true, dir:String(linhasErro.length)},
      tabela({cols:[{k:"quando", t:"Data e hora"}, {k:"rep", t:"Representante", fmt:np}, {k:"rev", t:"Revendedora", fmt:np}, {k:"erro", t:"Erro"}, {k:"por", t:"Registrado por"}], linhas:linhasErro})),
    // Regras das comissões: abrem aqui embaixo, na própria tela. O Configurador (só o Marcus) abre em OUTRA tela.
    e(BlocoPainel,{titulo:"Regras das comissões", aoTitulo:function(){ setRegrasAb(!regrasAb); }, fechado:!regrasAb, dir:regrasAb ? "Fechar" : "Abrir",
        acao:dono ? e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.aoConfig(); }, className:BTN_TITULO}, "Configurador") : null},
      e("div",{className:"flex flex-col gap-3 p-3"}, e(AbaRegrasRepresentantes))));
}

function AbaComissoesBase(p){
  var cx = use(), real = cx.state, fin = podeFinanceiro(real.usuario);
  var sl0 = useState(null), selId = sl0[0], setSelId = sl0[1];
  var sm = useState(false), simulando = sm[0], setSimulando = sm[1], ssm = useState(null), simS = ssm[0], setSimS = ssm[1];
  var s = simulando && simS ? simS : real, d = simulando ? function(a){ setSimS(function(cur){ return reducer(cur, a); }); } : cx.dispatch;
  // o cálculo das comissões só refaz quando os dados mudam ou vira o minuto (o corte depende da hora), não a cada clique na tela
  var relogio = Math.floor(Date.now()/60000);
  var base = useMemo(function(){ var c0 = comisEfetiva(s), ag = Math.max(Date.now(), relogio*60000);
    return {c:c0, agora:ag, itens:itensComissao(c0, s, ag), todasReps:repsEfetivas(s).map(function(x){ return x.nome; })}; }, [s, relogio]);
  var c = base.c, agora = base.agora, itens = base.itens, todasReps = base.todasReps;
  var hoje = new Date(agora), mesAtual = isoDia(hoje).slice(0,7);
  var ya = useState(mesAtual.slice(0,4)), anoSel = ya[0], setAnoSel = ya[1];
  // "" = o ano todo (só no Resumo do mês)
  var mm = useState(mesAtual.slice(5)), mesN = mm[0], setMesN = mm[1];
  var rotuloPeriodo = mesN==="" ? "Ano "+anoSel : MESES[+mesN-1]+"/"+anoSel;
  var vz = useState("pagar"), visao = vz[0], setVisao = vz[1], dz = useState(""), dataSel = dz[0], setDataSel = dz[1], gz = useState(false), gasAberto = gz[0], setGasAberto = gz[1];
  var mudaVisao = function(v){ if(v!=="resumo" && mesN==="") setMesN(mesAtual.slice(5)); setVisao(v); };
  var bz = useState(""), busca = bz[0], setBusca = bz[1], sz = useState(""), sitSel = sz[0], setSitSel = sz[1];
  var contas = []; (s.formasPagamento||[]).forEach(function(f){ f.descricoes.forEach(function(x){ if(contas.indexOf(x)<0) contas.push(x); }); });
  var anos = (s.acertosConsignado||[]).map(function(r){ return (r.data||"").slice(0,4); }).concat([mesAtual.slice(0,4)]).filter(function(a,i,x){ return a && x.indexOf(a)===i; }).sort().reverse();

  // ── visão Pagar (Opção A): as datas de pagamento do mês e, na data escolhida, um bloco por representante que tem algo nessa data ──
  var ymSel = anoSel+"-"+(mesN || mesAtual.slice(5)), hojeIso = isoDia(hoje), gruposDaData = {};
  todasReps.forEach(function(n){ var g = grupoDaRep(c, n); datasDoMes(c, g, ymSel).forEach(function(dt){ var l = gruposDaData[dt] = gruposDaData[dt] || []; if(l.indexOf(g)<0) l.push(g); }); });
  var datasMes = Object.keys(gruposDaData).sort(), variosGrupos = datasMes.some(function(dt){ return gruposDaData[dt].join()!==gruposDaData[datasMes[0]].join(); });
  var linhasDe = function(dt){ return todasReps.filter(function(n){ return datasDoMes(c, grupoDaRep(c, n), ymSel).indexOf(dt)>=0; })
    .map(function(n){ var rs = resumoSituacao(c, itens, n, dt, agora); return {nome:n, rs:rs, et:etapaDe(rs)}; })
    .filter(function(x){ return x.rs.itens.length>0 || x.rs.aPagar>0.009 || x.rs.pagos>0.009; }); };
  var porData = {}; if(visao!=="resumo") datasMes.forEach(function(dt){ porData[dt] = linhasDe(dt); });
  var comTrabalho = datasMes.filter(function(dt){ return (porData[dt]||[]).some(function(x){ return x.et.n===1 || x.et.n===2; }); });
  var passadas = datasMes.filter(function(dt){ return dt<=hojeIso; });
  var dataAtual = datasMes.indexOf(dataSel)>=0 ? dataSel : comTrabalho[0] || passadas[passadas.length-1] || datasMes[0] || "";
  var ordemEt = function(x){ return x.et.n===1 || x.et.n===2 ? 0 : x.et.n===0 ? 1 : 2; };
  var linhasPag = (porData[dataAtual]||[]).slice().sort(function(a, b){ return ordemEt(a)-ordemEt(b); });
  var guia = fin ? linhasPag.filter(function(x){ return ordemEt(x)===0; })[0] : null, guiaItem = guia ? guia.rs.itens.slice().sort(function(x, y){ return x.r.data.localeCompare(y.r.data) || x.r.id.localeCompare(y.r.id); }).filter(marcavel)[0] : null;
  // visão Pix representante: uma linha por representante em cada data de pagamento do mês (igual às janelas do Resumo geral)
  var linhasPix = []; if(visao==="pix") datasMes.forEach(function(dt){ (porData[dt]||[]).forEach(function(x){ var tot = r2(x.rs.comissaoTotal+(x.rs.comb>0.009 ? x.rs.comb : 0));
    linhasPix.push({id:"r|"+dt+"|"+x.nome, tipo:"Representante", nome:np(x.nome), periodo:ddmm(janelaDe(c, grupoDaRep(c, x.nome), dt).ini)+" à "+ddmm(janelaDe(c, grupoDaRep(c, x.nome), dt).fim), total:tot, pago:x.rs.pagos, aberto:Math.max(0, r2(tot-x.rs.pagos)), data:dt, rep:x.nome, rs:x.rs, et:x.et, jan:janelaDe(c, grupoDaRep(c, x.nome), dt)}); }); });
  var conta = function(k){ return linhasPag.filter(function(x){ return x.et.n===k; }).length; }, plural = function(k){ return k+(k===1 ? " representante" : " representantes"); };
  var etapaAgora = guia ? guia.et.n : 0, gas = c.gasolinaPR || {}, gasAtual = gas.em && isoDia(new Date(gas.em))===hojeIso;
  var opDatas = datasMes.map(function(dt){ return [dt, "Dia "+fmtDataBR(dt).slice(0,5)+(variosGrupos ? " · Grupo "+gruposDaData[dt].join(" e ") : "")]; });
  var opMes = (visao==="resumo" ? [["", "Ano todo"]] : []).concat(MESES.map(function(m, i){ return [String(i+1).padStart(2,"0"), m]; }));
  // VISÃO PAGAR (23/11/2026, pedido do Marcus: "igual à Contas a pagar", sem passo a passo): UMA tabela com uma linha por representante na data escolhida; clicar abre para baixo (uma por vez) a conferência, a divergência, o km e o pagamento.
  var linhasPagTab = visao==="pagar" ? linhasPag.map(function(x){
    var nRev = x.rs.itens.map(function(i){ return i.r.id; }).filter(function(v, i, a){ return a.indexOf(v)===i; }).length;
    return {id:"p|"+dataAtual+"|"+x.nome, nome:np(x.nome), revs:nRev, comissao:x.rs.comissaoTotal, comb:x.rs.comb>0.009 ? x.rs.comb : 0, aPagar:x.rs.aPagar, pago:x.rs.pagos, rest:x.rs.falta, sit:x.et.txt, n:x.et.n, rs:x.rs, et:x.et, rep:x.nome, jan:janelaDe(c, grupoDaRep(c, x.nome), dataAtual)}; }) : [];
  var colsPagar = [{k:"nome", t:"Representante"}, {k:"revs", t:"Revendedoras"}, {k:"comissao", t:"Comissão", fmt:BK}, {k:"comb", t:"Combustível", fmt:BK}, {k:"aPagar", t:"A pagar", fmt:BK}, {k:"pago", t:"Pago", fmt:BK},
    {k:"rest", t:"Restante", render:function(v){ return v<-0.009 ? "Pago a mais "+BK(-v) : BK(Math.max(0, v)); }, cor:function(l){ return l.rest>0.009 ? "text-[#F87171]" : ""; }},
    {k:"sit", t:"Situação", cor:function(l){ return l.n===1 ? "text-[#FBBF24]" : l.n===2 ? "text-[#F87171]" : ""; }}];
  var somaP = function(ls, k){ return ls.reduce(function(a, l){ return a+l[k]; }, 0); };
  var tabelaPagar = tabela({key:dataAtual+ymSel, cols:colsPagar, linhas:linhasPagTab, vazio:"Nenhuma comissão nesta data.",
    aoClicar:function(l){ setSelId(selId===l.id ? null : l.id); }, linhaCls:function(l){ return l.id===selId ? "rg-sel font-bold !cursor-pointer" : "!cursor-pointer"; },
    totalRodape:function(ls){ return ["Total · "+ls.length+(ls.length===1 ? " representante" : " representantes"), somaP(ls, "revs"), BK(somaP(ls, "comissao")), BK(somaP(ls, "comb")), BK(somaP(ls, "aPagar")), BK(somaP(ls, "pago")), BK(somaP(ls, "rest")), ""]; }});
  var linhaSelP = visao==="pagar" && selId ? linhasPagTab.find(function(l){ return l.id===selId; }) : null;
  return e("div",{className:BLOCOS+" "+RAIZ_PIX},
    e("style",null, ESTILO_BRILHO),
    e(BlocoPainel,{titulo:"Comissões dos representantes", compacto:true, dir:simulando ? "Simulação: nada é gravado" : !fin ? "Só consulta" : undefined},
      e(BarraTabela,null,
        p.troca,
        visao==="pix" && e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{valor:busca, aoMudar:setBusca, ph:"Nome, data, valor...", rotulo:"Buscar no resumo"})),
        e(CelulaBarra,{rotulo:"Dados"}, e(CampoMini,{valor:simulando ? "sim" : "real", aoMudar:function(v){ if(v==="sim"){ setSimS(montaSimulacao(real)); setSimulando(true); } else setSimulando(false); }, rotulo:"Dados", ops:[["real", "Reais"], ["sim", "Simulação"]]})),
        e(CelulaBarra,{rotulo:"Visão"}, e(CampoMini,{valor:visao, aoMudar:mudaVisao, rotulo:"Visão", ops:[["pagar", "Pagar"], ["resumo", "Resumo do mês"], ["pix", "Pix representante"]]})),
        visao==="pagar" && opDatas.length>0 && e(CelulaBarra,{rotulo:"Pagamento"}, e(CampoMini,{valor:dataAtual, aoMudar:setDataSel, rotulo:"Data de pagamento", ops:opDatas})),
        e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:mesN, aoMudar:function(v){ setMesN(v); setDataSel(""); }, rotulo:"Mês", ops:opMes})),
        e(CelulaBarra,{rotulo:"Ano"}, e(CampoMini,{valor:anoSel, aoMudar:function(v){ setAnoSel(v); setDataSel(""); }, rotulo:"Ano", ops:anos.map(function(a){ return [a, a]; })})),
        visao==="pix" && e(CelulaBarra,{rotulo:"Situação"}, e(CampoMini,{valor:sitSel, aoMudar:setSitSel, rotulo:"Situação", ops:[["", "Todas"], ["aberto", "Em aberto"], ["atraso", "Em atraso"], ["quitado", "Quitadas"]]})),
        visao==="pagar" && e(CelulaBarra,{rotulo:"Gasolina"}, e(BotaoBarra,{alerta:!gasAtual, onClick:function(){ setGasAberto(!gasAberto); }, title:gasAtual ? "Preço da gasolina de hoje" : "Preço desatualizado: confira a ANP antes de pagar"}, gasAtual ? BK(gas.valor) : "Atualizar gasolina")),
        podeConfigComissao(s.usuario) && e(CelulaBarra,{rotulo:"Regras"}, e(BotaoBarra,{onClick:p.aoConfig, title:"Configurar comissões dos representantes"}, "Configurar"))),
      visao==="pagar" && tabelaPagar),
    visao==="pagar" && gasAberto && e(BlocoGasolina,{s:s, d:d, c:c, fin:fin}),
    linhaSelP && e(BlocoPainel,{titulo:linhaSelP.nome+" · "+fmtDataBR(linhaSelP.jan.ini).slice(0, 5)+" a "+fmtDataBR(linhaSelP.jan.fim).slice(0, 5)+" · "+linhaSelP.revs+(linhaSelP.revs===1 ? " revendedora" : " revendedoras"), compacto:true, cls:"preenche", dir:e("button",{type:"button", onClick:function(){ setSelId(null); }, className:BTN_TITULO}, "Fechar")},
      e(CorpoRep,{s:s, d:d, c:c, rs:linhaSelP.rs, et:linhaSelP.et, fin:fin, contas:contas, rep:linhaSelP.rep, data:dataAtual, jan:linhaSelP.jan, brilhaId:null, brilhaPagar:false, cheia:false})),
    visao==="resumo" && e(ResumoMes,{s:s, c:c, itens:itens, agora:agora, todasReps:todasReps, anoSel:anoSel, mesN:mesN, mesAtual:mesAtual, rotulo:rotuloPeriodo, aoConfig:p.aoConfig}),
    visao==="pix" && e(PixRepresentante,{s:s, d:d, c:c, agora:agora, fin:fin, itens:itens, nomes:todasReps, linhas:linhasPix, contas:contas, ym:ymSel, rotulo:MESES[+ymSel.slice(5, 7)-1]+"/"+ymSel.slice(0, 4), busca:busca, sit:sitSel}));
}

// A tela das Comissões dos representantes e, em outra tela (só quem pode configurar), as regras em cima e as configurações embaixo
function AbaComissoes(){
  var t = useState(false), conf = t[0], setConf = t[1], s = use().state;
  // antes do return condicional (ordem dos hooks)
  var vs = useState("rep"), visao = vs[0], setVisao = vs[1];
  if(conf && podeConfigComissao(s.usuario)) return e("div",{ref:refTela, className:MARGEM},
    e("div",{className:BLOCOS},
      e(BlocoPainel,{titulo:"Regras das comissões dos representantes", acao:e("button",{type:"button", onClick:function(){ setConf(false); }, className:BTN_TITULO}, "← Voltar às comissões")},
        e("div",{className:"flex flex-col gap-3 p-3"}, e(AbaRegrasRepresentantes))),
      e(AbaConfigComissoes,{embutido:true})));
  // Kit novo (teste do novo fluxo): menu ao lado da Visão, só aparece com o teste ligado ou revendedoras marcadas
  var cN = comisEfetiva(s), temNf = !!(cN.nf && (cN.nf.ativo || (cN.nf.revs||[]).length));
  var troca = temNf ? e(CelulaBarra,{rotulo:"Comissão"}, e(CampoMini,{valor:visao, aoMudar:setVisao, rotulo:"Comissão", ops:[["rep", "Representantes"], ["kitnovo", "Kit novo"]]})) : null;
  return e("div",{ref:refTela, className:MARGEM},
    temNf && visao==="kitnovo" ? e("div",{className:BLOCOS}, e(ComissoesKitNovo,{troca:troca})) : e(AbaComissoesBase,{troca:troca, aoConfig:function(){ setConf(true); }}));
}
export { AbaComissoes };
