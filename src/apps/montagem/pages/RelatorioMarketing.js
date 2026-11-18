// Sorelly Admin · montagem — pages/RelatorioMarketing.js
// Marketing › Relatório diário (17/11/2026, pedido do Marcus): o que o setor fez em cada dia (artes, stories, vídeos...) e quantas foram feitas.
// Uma linha por dia do mês, uma coluna por atividade, total do dia, quem preencheu e a observação; clicar no dia abre o card para preencher.
// Regras em domain/relatorio-marketing.js; estado s.mr, ação MR. A lista de atividades se muda no botão Atividades.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { DIAS_SEMANA, MESES, br, dataIso, diaSem, hojeIso, ultimoDia } from "@/apps/montagem/domain/rh";
import { mrMigrar, mrTexto } from "@/apps/montagem/domain/relatorio-marketing";
import { CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";
import React from "react";

var SEL_AZUL = "h-7 cursor-pointer rounded-md border border-white/30 bg-white/20 px-1.5 text-center text-[13px] text-white outline-none [text-align-last:center] hover:bg-white/30 focus-visible:ring-2 focus-visible:ring-white";

// card do dia: uma caixa de número para cada atividade, observação e o texto para copiar
function CardDia(pp){
  var m = pp.m, reg = m.dias[pp.data], ini = {}; m.atividades.forEach(function(a){ ini[a.id] = reg && reg.q && reg.q[a.id] ? String(reg.q[a.id]) : ""; });
  var st = useState({q:ini, obs:reg ? reg.obs || "" : ""}), f = st[0], setF = st[1], cp = useState(false), copiou = cp[0], setCopiou = cp[1];
  var setQ = function(id, v){ var q = Object.assign({}, f.q); q[id] = v.replace(/\D/g, "").slice(0, 4); setF(Object.assign({}, f, {q:q})); };
  var total = m.atividades.reduce(function(t, a){ return t+(Number(f.q[a.id])||0); }, 0);
  var copiar = function(){ var tmp = {atividades:m.atividades, dias:{}}; tmp.dias[pp.data] = {q:f.q, obs:f.obs}; var tx = mrTexto(tmp, pp.data);
    (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function(){ setCopiou(true); setTimeout(function(){ setCopiou(false); }, 2000); }, function(){ window.prompt("Copie o relatório:", tx); }); };
  var campos = e("div",{key:"c", className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
    m.atividades.map(function(a){ return e("div",{key:a.id, className:"min-w-0"}, e(Rotulo,{t:a.nome, id:"mr-"+a.id}), e("input",{id:"mr-"+a.id, inputMode:"numeric", value:f.q[a.id], placeholder:"0", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ setQ(a.id, ev.target.value); }})); }),
    e(CampoTexto,{t:"Observação", id:"mr-obs", cls:"col-span-2 md:col-span-4", value:f.obs, maxLength:500, onChange:function(v){ setF(Object.assign({}, f, {obs:v})); }}));
  var dia = DIAS_SEMANA[diaSem(pp.data)];
  return e(Janela,{t:"Relatório do dia · "+br(pp.data), sub:dia+" · total "+total+(reg ? " · preenchido por "+reg.por : ""), fechar:pp.fechar, colunas:[campos],
    rodape:[reg && e(Botao,{key:"x", onClick:function(){ if(window.confirm("Apagar o relatório de "+br(pp.data)+"?")){ pp.op({op:"dia_del", data:pp.data}); pp.fechar(); } }}, "Apagar o dia"),
      e(Botao,{key:"c", onClick:copiar}, copiou ? "Copiado!" : "Copiar relatório"), e(Botao,{key:"n", onClick:pp.fechar}, "Cancelar"),
      e(Botao,{key:"s", principal:true, onClick:function(){ pp.op({op:"dia_set", data:pp.data, q:f.q, obs:f.obs}); pp.fechar(); }}, "Salvar")]});
}

// lista de atividades: criar, renomear e tirar
function JanelaAtividades(pp){
  var m = pp.m, nv = useState(""), nome = nv[0], setNome = nv[1];
  var linhas = m.atividades.map(function(a){ return e("div",{key:a.id+a.nome, className:"flex items-end gap-2"}, e("div",{className:"min-w-0 flex-1"}, e(Rotulo,{t:"Atividade", id:"at-"+a.id}), e("input",{id:"at-"+a.id, defaultValue:a.nome, maxLength:60, className:CAMPO, onBlur:function(ev){ var v = ev.target.value.trim(); if(v && v!==a.nome) pp.op({op:"ativ_set", id:a.id, nome:v}); }})),
    e(Botao,{onClick:function(){ if(window.confirm("Tirar \""+a.nome+"\" da lista? Os números já lançados ficam guardados.")) pp.op({op:"ativ_del", id:a.id}); }}, "Tirar")); });
  return e(Janela,{t:"Atividades do relatório", sub:"As colunas da tabela. Mude o nome clicando e saindo do campo.", fechar:pp.fechar, colunas:[e("div",{key:"l", className:"flex flex-col gap-2"}, linhas)],
    rodape:[e("div",{key:"n", className:"w-64"}, e("input",{value:nome, placeholder:"Nome da nova atividade", "aria-label":"Nome da nova atividade", maxLength:60, className:CAMPO, onChange:function(ev){ setNome(ev.target.value); }})),
      e(Botao,{key:"a", principal:true, desabilitado:!nome.trim(), onClick:function(){ pp.op({op:"ativ_set", nome:nome}); setNome(""); }}, "Nova atividade"), e(Botao,{key:"f", onClick:pp.fechar}, "Fechar")]});
}

function AbaRelatorioMarketing(){
  var cx = use(), s = cx.state, m = mrMigrar(s.mr), hoje = hojeIso(), mesHoje = hoje.slice(0, 7);
  var ms = useState(mesHoje), mes = ms[0], setMes = ms[1], js = useState(""), jan = js[0], setJan = js[1];
  var op = function(o){ cx.dispatch(Object.assign({type:"MR", por:porDe(s)}, o)); };
  // a tabela vai até o fim da tela (mede a posição e refaz ao redimensionar)
  var medidor = React.useRef(null), al = useState(""), altura = al[0], setAltura = al[1];
  React.useEffect(function(){ var med = function(){ var el = medidor.current; if(!el) return; setAltura("calc(100vh - "+Math.round(el.getBoundingClientRect().top + window.scrollY + 14)+"px)"); }; med(); var t1 = setTimeout(med, 300); window.addEventListener("resize", med); return function(){ clearTimeout(t1); window.removeEventListener("resize", med); }; }, [mes]);   // eslint-disable-line react-hooks/exhaustive-deps
  var ano = Number(mes.slice(0, 4)), mm = Number(mes.slice(5, 7)), ate = mes===mesHoje ? Number(hoje.slice(8, 10)) : (mes>mesHoje ? 0 : ultimoDia(ano, mm));
  var linhas = []; for(var dia = ate; dia>=1; dia--){ (function(dia){ var iso = dataIso(ano, mm, dia), reg = m.dias[iso], o = {id:iso, data:iso, dia:DIAS_SEMANA[diaSem(iso)], total:"", por:reg ? reg.por : "", obs:reg ? reg.obs : ""};
    var tot = 0; m.atividades.forEach(function(a){ var n = reg ? (reg.q && reg.q[a.id]) || 0 : ""; o["a_"+a.id] = n; tot += n || 0; }); if(reg) o.total = tot; linhas.push(o); })(dia); }
  var cols = [{k:"data", t:"Data", fmt:function(v){ return br(v); }}, {k:"dia", t:"Dia da semana"}].concat(m.atividades.map(function(a){ return {k:"a_"+a.id, t:a.nome}; }), [{k:"total", t:"Total"}, {k:"por", t:"Preenchido por"}, {k:"obs", t:"Observação"}]);
  var totalLinha = function(ls){ return cols.map(function(c, i){ if(i===0) return "Total"; if(i===1) return ls.filter(function(l){ return l.total!==""; }).length+" dias"; if(/^a_/.test(c.k) || c.k==="total"){ var t = 0; ls.forEach(function(l){ t += Number(l[c.k])||0; }); return String(t); } return ""; }); };
  var meses = []; for(var i = 0; i<12; i++){ var d0 = new Date(Number(mesHoje.slice(0, 4)), Number(mesHoje.slice(5, 7))-1-i, 1), v = d0.getFullYear()+"-"+String(d0.getMonth()+1).padStart(2, "0"); meses.push([v, MESES[d0.getMonth()]+" de "+d0.getFullYear()]); }
  return e("div",{className:"-mx-4 -mt-5 flex flex-col gap-2.5 md:-mx-5"},
    e(BlocoPainel,{titulo:"Relatório diário do Marketing", compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        e("select",{value:mes, "aria-label":"Mês", onChange:function(ev){ setMes(ev.target.value); }, className:SEL_AZUL+" w-44"}, meses.map(function(x){ return e("option",{key:x[0], value:x[0], className:"bg-card"}, x[1]); })),
        e("span",{className:"flex-1"}), e(Botao,{onClick:function(){ setJan("ativ"); }}, "Atividades"), e(Botao,{principal:true, onClick:function(){ setJan("dia:"+hoje); }}, "Preencher hoje")),
      jan.indexOf("dia:")===0 && e(CardDia,{key:jan, m:m, data:jan.slice(4), op:op, fechar:function(){ setJan(""); }}),
      jan==="ativ" && e(JanelaAtividades,{m:m, op:op, fechar:function(){ setJan(""); }}),
      e("div",{ref:medidor}, e(TabelaPlanilha,{key:mes+m.atividades.length, alturaMax:altura || "calc(100vh - 11.5rem)", semMao:true, cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, limite:100, totalLinha:totalLinha, totalSimples:true, aoClicar:function(l){ setJan("dia:"+l.id); }, vazio:"Nenhum dia neste mês."}))));
}

export { AbaRelatorioMarketing };
