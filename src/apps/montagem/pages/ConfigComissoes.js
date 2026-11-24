// Sorelly Admin — pages/ConfigComissoes.js
// Financeiro › Representantes › Comissões › Configurar: tudo que mexe no cálculo e nas datas de pagamento das comissões das representantes.
//   · Representantes: % de comissão e grupo de pagamento (A: dias 1/11/21 · B: dias 6/16/26), com sorteio e balanceamento pelo volume
//   · Pagamento e corte: dias de pagamento de cada grupo e o corte (hora e quantos dias antes)
//   · Regras: comissão padrão, kit novo, reposição e promissória
//   · Novo fluxo (teste de 60 dias), Combustível e Próximas remessas
// As contas onde o dinheiro entra continuam em Representantes → Configurações → Formas de pagamento.
// VISUAL (23/11/2026): blocos azuis (BlocoPainel) e a TabelaPlanilha em tudo; cada configuração é uma linha (nome | valor), campos de 32 px, blocos lado a lado com a mesma altura.
// A explicação de cada linha aparece ao passar o mouse no nome (nada de parágrafo na tela).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Botao, CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { analisar, comisEfetiva, fmtDataBR, proximasDatas, repsEfetivas } from "@/apps/montagem/domain/comissoes";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MoneyInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";
import React from "react";

var copia = function(x){ return JSON.parse(JSON.stringify(x)); };
var diasTxt = function(v){ return (v||[]).join(", "); };
var lerDias = function(t){ return String(t).split(/[^0-9]+/).map(Number).filter(function(n){ return n>=1 && n<=31; }).filter(function(n,i,a){ return a.indexOf(n)===i; }).sort(function(a,b){ return a-b; }); };
var LINHA = "flex min-h-8 flex-wrap items-center justify-center gap-x-3 gap-y-2 px-3 py-2 text-center text-[13px]";
var LINK = "cursor-pointer whitespace-nowrap font-semibold underline underline-offset-2 hover:text-primary";
// tela aberta sozinha (endereço próprio): cola nas bordas, linhas brancas dos blocos e nada em caixa alta
var RAIZ = "-mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3 flex flex-col gap-2.5 [&_*]:!normal-case "+PADRAO_BLOCOS;
var FAIXA = "grid grid-cols-1 items-stretch gap-2.5 lg:grid-cols-2";
var TABELA = {chave:"id", grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true};
var tabela = function(o){ return e(TabelaPlanilha, Object.assign({}, TABELA, o)); };
// Tabela de configurações: uma linha por configuração (nome | valor). linhas = [{id, nome, dica, campo}]
var COLS_CFG = [{k:"nome", t:"Configuração", render:function(v, l){ return e("span",{title:l.dica}, v); }}, {k:"campo", t:"Valor", render:function(v, l){ return l.campo; }}];
var config = function(linhas){ return tabela({cols:COLS_CFG, linhas:linhas, semFiltro:true}); };
// campos de 32 px, texto no meio
var numero = function(o){ return e("input",{type:"number", step:o.step||"1", value:o.value, "aria-label":o.label, className:CAMPO+" w-24! text-center tabular-nums", onChange:function(ev){ o.onChange(parseFloat(ev.target.value)||0); }}); };
var texto = function(o){ return e("input",{value:o.value, "aria-label":o.label, placeholder:o.placeholder, list:o.list, className:CAMPO+" "+(o.w||"w-40!")+" text-center", onChange:function(ev){ o.onChange(ev.target.value); }, onKeyDown:o.onEnter ? function(ev){ if(ev.key==="Enter") o.onEnter(); } : undefined}); };
var escolha = function(o){ return e("select",{value:o.value, "aria-label":o.label, className:CAMPO+" "+(o.w||"w-24!")+" cursor-pointer text-center", onChange:function(ev){ o.onChange(ev.target.value); }}, o.opcoes.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })); };
var dinheiro = function(o){ return e(MoneyInput,{value:o.value, label:o.label, sm:true, className:"w-32 text-center!", onChange:o.onChange}); };
var SIM_NAO = [["sim", "Sim"], ["nao", "Não"]];

function AbaConfigComissoes(props){
  // embutido: dentro de Comissões (botão Configurar); a tela de fora já traz o título e o botão de voltar
  var embutido = !!(props && props.embutido);
  var cx = use(), s = cx.state, d = cx.dispatch, atual = comisEfetiva(s);
  var base = function(){ return {reps:repsEfetivas(s).map(function(x){ return {nome:x.nome, pct:x.pct, grupo:x.grupo}; }), pctPadrao:atual.pctPadrao,
    A:diasTxt(atual.ciclos.A), B:diasTxt(atual.ciclos.B), corteHora:atual.corteHora, corteDias:atual.corteDias, kitNovo:atual.kitNovo, kitNovoExpo:atual.kitNovoExpo, reposicao:atual.reposicao, exigirProm:atual.exigirProm, kmPorLitro:atual.kmPorLitro, combSemEnvio:atual.combSemEnvio, gasolina:copia(atual.gasolina||{}), nf:copia(atual.nf)}; };
  var st = useState(base), f = st[0], setF = st[1];
  var nn = useState(""), novoNome = nn[0], setNovoNome = nn[1], nr = useState(""), novaRev = nr[0], setNovaRev = nr[1], nk = useState(""), novaKit = nk[0], setNovaKit = nk[1];
  var mudaNf = function(patch){ muda({nf:Object.assign({}, f.nf, patch)}); };
  var revsConhecidas = (function(){ var o = {}; (s.acertosConsignado||[]).forEach(function(r){ if(r.origem!=="interno" && r.rev) o[r.rev] = 1; }); return Object.keys(o).sort(); })();
  var addNf = function(){ var rv = novaRev.trim(), kn = (novaKit || (f.reps[0] && f.reps[0].nome) || "").trim(); if(!rv || !kn || (f.nf.revs||[]).some(function(x){ return x.rev.toLowerCase()===rv.toLowerCase(); })) return;
    mudaNf({revs:(f.nf.revs||[]).concat([{rev:rv, repKitNovo:kn, desde:isoDia(new Date())}])}); setNovaRev(""); };
  var alterou = JSON.stringify(f) !== JSON.stringify(base());
  var muda = function(patch){ setF(Object.assign({}, f, patch)); };
  var mudaRep = function(nome, patch){ muda({reps:f.reps.map(function(x){ return x.nome===nome ? Object.assign({}, x, patch) : x; })}); };
  var addRep = function(){ var n = novoNome.trim(); if(!n || f.reps.some(function(x){ return x.nome.toLowerCase()===n.toLowerCase(); })) return; muda({reps:f.reps.concat([{nome:n, pct:f.pctPadrao, grupo:"A"}]).sort(function(a,b){ return a.nome.localeCompare(b.nome); })}); setNovoNome(""); };
  var sortear = function(){ var ord = f.reps.map(function(x,i){ return {i:i, k:Math.random()}; }).sort(function(a,b){ return a.k-b.k; }), r = f.reps.slice();
    ord.forEach(function(o,j){ r[o.i] = Object.assign({}, r[o.i], {grupo: j%2===0 ? "A" : "B"}); }); muda({reps:r}); };
  // divide para que os dois grupos tenham quase o mesmo valor de comissão a pagar (últimos 60 dias)
  var balancear = function(){
    var corte = isoDia(new Date(Date.now()-60*86400000)), vol = {};
    (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && r.origem!=="interno" && (r.data||"")>=corte; }).forEach(function(r){ vol[r.rep] = (vol[r.rep]||0)+analisar(Object.assign({}, atual, {reps:f.reps}), r).total; });
    var tot = {A:0, B:0}, r = f.reps.slice();
    f.reps.map(function(x,i){ return {i:i, v:vol[x.nome]||0}; }).sort(function(a,b){ return b.v-a.v; }).forEach(function(o){ var g = tot.A<=tot.B ? "A" : "B"; tot[g] += o.v; r[o.i] = Object.assign({}, r[o.i], {grupo:g}); });
    muda({reps:r}); };
  var salvar = function(){
    var A = lerDias(f.A), B = lerDias(f.B);
    if(!A.length || !B.length) return d({type:"AVISO", txt:"Cada grupo precisa de pelo menos um dia de pagamento"});
    d({type:"COMIS_CONFIG", aviso:"Configurador de comissões salvo", patch:{reps:f.reps.map(function(x){ return {nome:x.nome, pct:x.pct, grupo:x.grupo}; }), pctPadrao:f.pctPadrao, ciclos:{A:A, B:B},
      corteHora:f.corteHora, corteDias:f.corteDias, kitNovo:f.kitNovo, kitNovoExpo:f.kitNovoExpo, reposicao:f.reposicao, exigirProm:f.exigirProm, kmPorLitro:f.kmPorLitro, combSemEnvio:f.combSemEnvio, gasolina:f.gasolina, nf:f.nf, v2:true}});
  };
  var cfgPrev = Object.assign({}, atual, {ciclos:{A:lerDias(f.A), B:lerDias(f.B)}, corteHora:f.corteHora, corteDias:f.corteDias});
  var agora = Date.now(), nA = f.reps.filter(function(x){ return x.grupo==="A"; }).length, nB = f.reps.length-nA;
  var retirar = function(rotulo, onClick){ return e("button",{type:"button", "aria-label":rotulo, title:rotulo, onClick:onClick, className:LINK}, "Retirar"); };
  var colsRep = [{k:"nome", t:"Representante"},
    {k:"pct", t:"Comissão %", render:function(v, l){ return numero({value:v, step:"0.5", label:"Comissão de "+l.nome, onChange:function(n){ mudaRep(l.nome, {pct:n}); }}); }},
    {k:"grupo", t:"Grupo", render:function(v, l){ return escolha({value:v, label:"Grupo de "+l.nome, opcoes:[["A", "A"], ["B", "B"]], onChange:function(g){ mudaRep(l.nome, {grupo:g}); }}); }},
    {k:"acao", t:"Retirar", semFiltro:true, render:function(v, l){ return retirar("Retirar "+l.nome, function(){ muda({reps:f.reps.filter(function(y){ return y.nome!==l.nome; })}); }); }}];
  var linhasRep = f.reps.map(function(x){ return {id:x.nome, nome:x.nome, pct:x.pct, grupo:x.grupo}; });
  var proxA = proximasDatas(cfgPrev, "A", agora, 4), proxB = proximasDatas(cfgPrev, "B", agora, 4), linhasProx = [];
  for(var i = 0; i<Math.max(proxA.length, proxB.length); i++) linhasProx.push({id:i, a:proxA[i] ? fmtDataBR(proxA[i]) : "—", b:proxB[i] ? fmtDataBR(proxB[i]) : "—"});
  var revsNf = (f.nf.revs||[]).map(function(x, k){ return {id:x.rev, k:k, rev:x.rev, rep:x.repKitNovo, desde:x.desde ? fmtDataBR(x.desde) : "—"}; });
  var corpo = e(React.Fragment,null,
    e(BlocoPainel,{titulo:embutido ? "Configurações das comissões" : "Configurador de comissões", dir:alterou ? "Alterações não salvas" : ""},
      e("div",{className:LINHA},
        e(Botao,{desabilitado:!alterou, onClick:function(){ setF(base()); }}, "Descartar"),
        e(Botao,{principal:true, desabilitado:!alterou, onClick:salvar}, "Salvar"))),
    e(BlocoPainel,{titulo:"Representantes", dir:f.reps.length+" no total · grupo A: "+nA+" · grupo B: "+nB},
      e("div",{className:LINHA+" border-b border-border"},
        e(Botao,{onClick:sortear, title:"Sorteia os grupos A e B. Só preenche a tabela: vale depois de Salvar."}, "Sortear A/B"),
        e(Botao,{onClick:balancear, title:"Divide os grupos pelo volume de comissão dos últimos 60 dias. Só preenche a tabela: vale depois de Salvar."}, "Balancear pelo volume"),
        texto({value:novoNome, label:"Nova representante", placeholder:"Nova representante", w:"w-56!", onChange:setNovoNome, onEnter:addRep}),
        e(Botao,{onClick:addRep}, "+ Adicionar")),
      tabela({cols:colsRep, linhas:linhasRep, alturaMax:"28rem", vazio:"Nenhuma representante ainda. Adicione acima."})),
    e("div",{className:FAIXA},
      e(BlocoPainel,{titulo:"Pagamento e corte"}, config([
        {id:"a", nome:"Dias de pagamento do grupo A", campo:texto({value:f.A, label:"Dias de pagamento do grupo A", onChange:function(v){ muda({A:v}); }})},
        {id:"b", nome:"Dias de pagamento do grupo B", campo:texto({value:f.B, label:"Dias de pagamento do grupo B", onChange:function(v){ muda({B:v}); }})},
        {id:"h", nome:"Hora do corte", dica:"Com 12h e 1 dia antes: o que for liberado até 12h do dia anterior entra no pagamento; depois disso, no próximo.", campo:numero({value:f.corteHora, label:"Hora do corte", onChange:function(v){ muda({corteHora:Math.max(0, Math.min(23, Math.round(v)))}); }})},
        {id:"d", nome:"Dias antes do pagamento", dica:"Com 12h e 1 dia antes: o que for liberado até 12h do dia anterior entra no pagamento; depois disso, no próximo.", campo:numero({value:f.corteDias, label:"Dias antes", onChange:function(v){ muda({corteDias:Math.max(0, Math.round(v))}); }})}])),
      e(BlocoPainel,{titulo:"Próximas remessas"}, tabela({cols:[{k:"a", t:"Grupo A"}, {k:"b", t:"Grupo B"}], linhas:linhasProx, semFiltro:true, vazio:"Sem datas."}))),
    e("div",{className:FAIXA},
      e(BlocoPainel,{titulo:"Regras"}, config([
        {id:"p", nome:"Comissão padrão (%)", dica:"Para a representante que não tem percentual próprio.", campo:numero({value:f.pctPadrao, step:"0.5", label:"Comissão padrão", onChange:function(v){ muda({pctPadrao:v}); }})},
        {id:"k", nome:"Kit novo com termo assinado", dica:"Valor provisório: confirmar.", campo:dinheiro({value:f.kitNovo, label:"Kit novo", onChange:function(v){ muda({kitNovo:v}); }})},
        {id:"e", nome:"Kit novo + expositor", dica:"Valor provisório: confirmar.", campo:dinheiro({value:f.kitNovoExpo, label:"Kit novo com expositor", onChange:function(v){ muda({kitNovoExpo:v}); }})},
        {id:"r", nome:"Reposição entregue (com condicional assinada)", campo:dinheiro({value:f.reposicao, label:"Comissão da reposição", onChange:function(v){ muda({reposicao:v}); }})},
        {id:"x", nome:"Exigir promissória assinada para liberar a comissão", campo:escolha({value:f.exigirProm ? "sim" : "nao", label:"Exigir promissória", opcoes:SIM_NAO, onChange:function(v){ muda({exigirProm:v==="sim"}); }})}]),
        e("div",{className:LINHA+" border-t border-border font-semibold text-warning"}, "R$ 20 e R$ 35 são valores provisórios: confirmar.")),
      e(BlocoPainel,{titulo:"Combustível"}, config([
        {id:"c", nome:"Consumo (km por litro)", dica:"O preço do litro (média da ANP no Paraná) é atualizado por quem paga, na tela Comissões. O combustível sai de km × preço ÷ km por litro.", campo:numero({value:f.kmPorLitro, step:"0.5", label:"Km por litro", onChange:function(v){ muda({kmPorLitro:v}); }})}]))),
    e(BlocoPainel,{titulo:"Novo fluxo (teste de 60 dias)", dir:f.nf.ativo ? (f.nf.revs||[]).length+" revendedoras marcadas" : "Desligado"},
      config([
        {id:"l", nome:"Teste do novo fluxo", dica:"Sem a revendedora na lista abaixo, nada muda.", campo:escolha({value:f.nf.ativo ? "sim" : "nao", label:"Ligar o teste do novo fluxo", w:"w-32!", opcoes:[["sim", "Ligado"], ["nao", "Desligado"]], onChange:function(v){ mudaNf({ativo:v==="sim"}); }})},
        {id:"n", nome:"Entrega do kit pela Rep. Kit Novo (condicional assinada)", dica:"A gasolina segue o mesmo esquema das outras representantes.", campo:dinheiro({value:f.nf.entrega, label:"Entrega do kit novo", onChange:function(v){ mudaNf({entrega:v}); }})},
        {id:"q", nome:"1º acerto · Rep. Kit Novo (%)", campo:numero({value:f.nf.pctKitNovo, step:"0.5", label:"Percentual da Rep. Kit Novo", onChange:function(v){ mudaNf({pctKitNovo:v}); }})},
        {id:"t", nome:"1º acerto · Rep. Acerto (%)", dica:"Do 2º acerto em diante a Rep. Acerto leva a % normal dela.", campo:numero({value:f.nf.pctAcerto1, step:"0.5", label:"Percentual da Rep. Acerto no 1º acerto", onChange:function(v){ mudaNf({pctAcerto1:v}); }})}]),
      e("div",{className:LINHA+" border-y border-border"},
        texto({value:novaRev, label:"Revendedora do teste", placeholder:"Revendedora do teste", list:"nf-revs", w:"w-72!", onChange:setNovaRev}),
        e("datalist",{id:"nf-revs"}, revsConhecidas.map(function(n){ return e("option",{key:n, value:n}); })),
        escolha({value:novaKit, label:"Representante Kit Novo", w:"w-56!", opcoes:[["", "Rep. Kit Novo"]].concat(f.reps.map(function(x){ return [x.nome, x.nome]; })), onChange:setNovaKit}),
        e(Botao,{onClick:addNf}, "+ Marcar")),
      tabela({cols:[{k:"rev", t:"Revendedora"}, {k:"rep", t:"Rep. Kit Novo"}, {k:"desde", t:"Desde"},
        {k:"acao", t:"Retirar", semFiltro:true, render:function(v, l){ return retirar("Retirar "+l.rev, function(){ mudaNf({revs:f.nf.revs.filter(function(_, k){ return k!==l.k; })}); }); }}], linhas:revsNf, vazio:"Nenhuma revendedora marcada."})));
  return embutido ? corpo : e("div",{className:RAIZ}, corpo);
}

export { AbaConfigComissoes };
