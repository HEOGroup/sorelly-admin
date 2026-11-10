// Sorelly Admin · montagem — mobile/listagens-rep.js
// App da representante › Listagens (Marcus, 09/11/2026; desenho aprovado em docs/design/testes-de-layout/listagem-representante-opcao1-v3.html):
//   Lista (um bloco por dia) ou Calendário (mês inteiro) → toca no dia → TELA DO DIA (resumo, revendedoras, menu "Ações") → Excluir (quem desmarcou e motivo).
// O nome do dia aparece por extenso ("Quinta-feira, 12/11"). Toda escolha é menu suspenso. A representante NUNCA vê valor do kit.
// Regras (prazo, uma listagem por dia, uma revendedora por dia, avisos): domain/listagem-regras.js e state/reducer.js (CRIAR_LISTAGEM, ADD_KIT, REMOVER_KIT).
// A barra preta de cima, com a seta ‹, fica em mobile/representante.js; o estado `sub` ({t, v, mes, dia}) vem de lá para a seta voltar uma tela por vez.
import { ETAPA } from "@/apps/montagem/components/fila";
import { NovaListagemRep } from "@/apps/montagem/mobile/nova-listagem-rep";
import { MOTIVOS_EXCLUSAO, NOMES_DIA, NOMES_MES, QUEM_DESMARCOU, acaoDoKitExcluido, dataDe, ddmm, isoDeData, passouPrazo, prazoDaListagem, tituloDoDia } from "@/apps/montagem/domain/listagem-regras";
import { capacidadeListagem } from "@/apps/montagem/domain/regras";
import { codigoRetirada } from "@/apps/montagem/components/dialogos";
import { MONO } from "@/apps/montagem/ui/input";
import { isoDia } from "@/apps/montagem/lib/format";
import { e, useState } from "@/shared/react";

var CARD = "rounded-2xl bg-white shadow-sm ring-1 ring-black/5";
var CAMPO = "h-8 w-full rounded-xl bg-white px-2.5 text-[13px] font-semibold text-[#111827] outline-none ring-1 ring-black/10";
var ROTULO = "flex min-w-0 flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-[#A67C12]";
var BT_OURO = "flex h-8 w-full items-center justify-center rounded-xl text-[13px] font-bold txt-branco bg-[#C9A13B]";
var BT_BRANCO = "flex h-8 w-full items-center justify-center rounded-xl bg-white text-[13px] font-bold text-[#111827] ring-1 ring-black/10";
var NOME_ETAPA = {semvalor:"Na fila", pendente:"Na fila", montando:"Montando", supervisao:"Montando", ajuste:"Montando", montado:"Montado", bipando:"Bipando", bipado:"Pronto", retirado:"Retirado", condicional:"Condicional", precond:"Conferindo"};
var COR_ETAPA = {semvalor:"#6B7280", pendente:"#6B7280", montando:"#D97706", supervisao:"#D97706", ajuste:"#D97706", montado:"#2563EB", bipando:"#2563EB", bipado:"#16A34A", retirado:"#16A34A", condicional:"#6B7280", precond:"#6B7280"};
var TIPO_NOME = {acerto_kit:"Acerto + kit", reposicao:"Reposição", kit_novo:"Kit novo", kit_novo_exp:"Kit novo + expositor", condicional:"Condicional", saiu:"Saiu"};

// valor de venda da revendedora (o que ela vendeu): sempre com R$ e centavos. Valor do KIT a representante nunca vê.
function reais(v){ return v>0 ? "R$ "+Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}) : "Sem venda"; }
function Situacao(p){ return e("span",{className:"inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-bold", style:{color:COR_ETAPA[p.status]||"#6B7280"}},
  e("span",{className:"size-2 rounded-full", style:{background:COR_ETAPA[p.status]||"#6B7280"}}), NOME_ETAPA[p.status]||p.status); }
function Linha(p){ return e("div",{className:"flex items-center justify-between gap-2 border-t border-[#F3E8C8] px-3 py-1.5 text-[13px] first:border-t-0"}, e("span",{className:"text-[#4B5563]"}, p.r), e("b",{className:MONO+" text-right text-[13px] text-[#111827]"}, p.v)); }

// os dados do dia: listagens abertas da representante nesta data, os kits delas e as contas de vagas
function doDia(s, minhas, iso){
  var ls = minhas.filter(function(x){ return x.data===iso && !x.fechada; }), ids = ls.map(function(x){ return x.id; });
  var kits = s.kits.filter(function(k){ return ids.indexOf(k.lid)>=0; }).sort(function(a,b){ return (ETAPA[a.status]||0)-(ETAPA[b.status]||0) || (a.ordem||0)-(b.ordem||0); });
  var viagem = ls.some(function(x){ return x.viagem; }), cap = ls.reduce(function(t,x){ return t+capacidadeListagem(x); }, 0);
  return {iso:iso, ls:ls, kits:kits, viagem:viagem, cap:cap, vagas:kits.length+"/"+(viagem ? "∞" : cap), cheia:!viagem && ls.length>0 && kits.length>=cap, prazo:prazoDaListagem(ls[0] || {data:iso}, s.cfg), fechou:passouPrazo(ls[0] || {data:iso}, Date.now(), s.cfg)};   // dia sem listagem também tem prazo (09/11/2026)
}
function horarios(ls){ return ls.map(function(x){ return x.horario+(x.horario2 ? " e "+x.horario2 : ""); }).join(" e "); }

// bloco do dia (linha da Lista): toca e abre a tela do dia
function BlocoDia(p){
  var dia = p.dia, vazio = dia.ls.length===0, sub = vazio ? (dia.fechou ? "Sem listagem · prazo encerrado" : "Aberto · sem listagem · criar até "+dia.prazo.texto) : dia.fechou ? "Prazo encerrado · "+dia.vagas : dia.cheia ? "Cheia · "+dia.vagas : dia.vagas+" · incluir até "+dia.prazo.texto;
  var marca = dia.fechou ? {bg:"#E5E7EB", cor:"#9CA3AF", t:"🔒"} : dia.cheia ? {bg:"#FEE2E2", cor:"#DC2626", t:"!"} : {bg:"#F7E8BF", cor:"#B8862B", t:"✓"};
  return e("button",{type:"button", onClick:p.onClick, className:"flex w-full items-center gap-2.5 px-3 py-2.5 text-left "+CARD},
    e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl text-[16px]", style:{background:"#F7E8BF"}}, "📅"),
    e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13.5px] leading-tight text-[#111827]"}, tituloDoDia(dia.iso)), e("span",{className:"block text-[11px] font-semibold leading-tight text-[#4B5563]"}, (dia.ls.length ? horarios(dia.ls)+" · " : "")+sub)),
    e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold", style:{background:marca.bg, color:marca.cor}}, marca.t),
    e("span",{className:"text-[13px] text-[#6B7280]"}, "▸"));
}

function Calendario(p){
  var s = p.s, minhas = p.minhas, hojeIso = isoDia(new Date()), mes = p.mes || hojeIso.slice(0,7), ano = +mes.slice(0,4), m = +mes.slice(5,7)-1;
  var primeiro = new Date(ano, m, 1), vazios = (primeiro.getDay()+6)%7, ultimo = new Date(ano, m+1, 0).getDate();
  var opcoes = []; for(var i=-1;i<=3;i++){ var dm = new Date(+hojeIso.slice(0,4), +hojeIso.slice(5,7)-1+i, 1); opcoes.push([isoDeData(dm).slice(0,7), NOMES_MES[dm.getMonth()]+" de "+dm.getFullYear()]); }
  var cab = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"].map(function(x){ return e("div",{key:x, className:"py-0.5 text-center text-[8px] font-extrabold uppercase text-[#B8862B]"}, x); });
  var cels = []; for(var v=0; v<vazios; v++) cels.push(e("div",{key:"v"+v}));
  for(var n=1;n<=ultimo;n++){ (function(n){
    var iso = mes+"-"+String(n).padStart(2,"0"), dia = doDia(s, minhas, iso), tem = dia.ls.length>0, passado = iso<hojeIso;
    var fundo = dia.fechou && tem ? "#ECECEE" : dia.cheia ? "#FFF5F5" : "#FFFFFF", borda = dia.cheia ? "#FCA5A5" : "#E5E7EB", barra = dia.cheia ? "#DC2626" : dia.fechou ? "#9CA3AF" : "#C9A13B";
    var pct = tem && !dia.viagem ? Math.min(100, Math.round(dia.kits.length/dia.cap*100)) : 0;
    cels.push(e("button",{key:iso, type:"button", onClick:function(){ p.aoEscolher(iso); }, disabled:false, className:"flex h-[46px] flex-col items-center justify-between rounded-xl px-0.5 py-0.5 text-[12px] font-extrabold "+(iso===hojeIso ? "text-[#B8862B]" : passado ? "text-[#9CA3AF]" : "text-[#111827]"), style:{background:fundo, border:"1px solid "+borda}},
      n, e("span",{className:"min-h-[11px] text-[9px] font-bold text-[#4B5563]"}, tem ? (dia.cheia ? "cheia" : dia.vagas) : ""),
      e("span",{className:"h-1 w-[70%] overflow-hidden rounded bg-[#E5E7EB]"}, e("i",{className:"block h-full", style:{width:pct+"%", background:barra}}))));
  })(n); }
  return e("div",{className:"flex flex-col gap-2"},
    e("label",{className:ROTULO}, "Mês", e("select",{value:mes, onChange:function(ev){ p.aoMes(ev.target.value); }, className:CAMPO}, opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
    e("div",{className:CARD+" p-2"},
      e("div",{className:"grid grid-cols-7 gap-[3px]"}, cab.concat(cels)),
      e("div",{className:"mt-1.5 flex justify-between px-1 text-[11px] font-semibold text-[#4B5563]"}, e("span",null,"● Aberta"), e("span",{style:{color:"#DC2626"}},"● Cheia"), e("span",{style:{color:"#9CA3AF"}},"● Prazo encerrado"))));
}

function TelaDia(p){
  var s = p.s, dia = doDia(s, p.minhas, p.iso), hojeIso = isoDia(new Date());
  var sem = dia.ls.length===0, podeCriar = sem && p.iso>=hojeIso && !passouPrazo({data:p.iso}, Date.now(), s.cfg);
  var tabela = dia.kits.length===0 ? e("p",{className:"px-3 py-2 text-[13px] font-semibold text-[#4B5563]"}, sem ? "Nenhuma listagem neste dia." : "Nenhuma revendedora na listagem ainda.")
    : dia.kits.map(function(k){ return e("button",{key:k.id, type:"button", onClick:function(){ if(p.abrirRev) p.abrirRev(k); }, className:"flex w-full items-center gap-2 border-t border-[#F3E8C8] px-3 py-1.5 text-left first:border-t-0"},
        e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13px] text-[#111827]"}, k.rev), e("span",{className:"block text-[11px] font-medium text-[#4B5563]"}, (TIPO_NOME[k.tipoKit]||"Kit")+(k.horaAtend ? " · "+k.horaAtend : ""))),
        e("span",{className:"flex shrink-0 flex-col items-end gap-0.5"}, e("b",{className:MONO+" text-[12px] text-[#8A6A12]", title:"Venda da revendedora"}, reais((k.vendas||[])[0])), e(Situacao,{status:k.status}))); });
  var temBipado = dia.kits.some(function(k){ return k.status==="bipado"; });
  var acoes = [["", "Ações da listagem…"]];
  if(!sem && !dia.fechou && !dia.cheia) acoes.push(["add","Adicionar da minha carteira"]);
  if(dia.kits.length>0) acoes.push(["excluir","Excluir uma revendedora…"]);
  var aviso = dia.fechou && !sem ? "Prazo encerrado: só a Deysiane inclui mais revendedoras." : dia.cheia ? "Listagem cheia ("+dia.vagas.replace("/"," de ")+"). Crie outra listagem em outro dia." : "";
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"rounded-2xl bg-[#202023] p-3 text-white"},
      e("b",{className:"mb-1.5 block text-[15px]", style:{color:"#FFFFFF"}}, tituloDoDia(p.iso)),
      !sem && e("div",{className:"flex items-baseline justify-between py-0.5 text-[12px] text-[#E5E7EB]"}, e("span",null,"Retirada"), e("b",{className:MONO+" text-[14px]", style:{color:"#FFFFFF"}}, horarios(dia.ls))),
      !sem && e("div",{className:"flex items-baseline justify-between py-0.5 text-[12px] text-[#E5E7EB]"}, e("span",null,"Kits"), e("b",{className:MONO+" text-[14px]", style:{color:"#FFFFFF"}}, dia.vagas.replace("/"," / "))),
      !sem && dia.ls[0] && e("div",{className:"mt-1.5 flex items-baseline justify-between gap-2 border-t border-[#C9A13B] pt-1.5"}, e("span",{className:"text-[12px] font-bold text-[#F0D58A]"}, dia.fechou ? "Prazo" : "Incluir até"), e("b",{className:MONO+" text-right text-[13px]", style:{color:"#F0D58A"}}, dia.fechou ? "encerrado" : dia.prazo.texto)),
      sem && e("p",{className:"text-[12px] text-[#E5E7EB]"}, podeCriar ? "Você ainda não tem listagem neste dia." : "Não dá para criar listagem neste dia (prazo encerrado ou dia passado).")),
    e("div",{className:CARD+" overflow-hidden"}, e("div",{className:"border-[#F3E8C8]"}, tabela)),
    temBipado && dia.ls[0] && e("div",{className:CARD+" flex items-center justify-between gap-2 px-3 py-2"}, e("span",{className:"text-[13px] font-semibold text-[#111827]"}, "Código de retirada"), e("b",{className:MONO+" text-[20px] tracking-[.3em] text-[#8A6A12]"}, codigoRetirada(dia.ls[0]))),
    aviso && e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[12px] font-semibold text-[#92400E]"}, aviso),
    acoes.length>1 && e("select",{value:"", "aria-label":"Ações da listagem", onChange:function(ev){ var v = ev.target.value; if(v==="add") p.irAdicionar(dia.ls[0].id); else if(v==="excluir") p.irExcluir(p.iso); }, className:CAMPO}, acoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
    podeCriar && e("button",{type:"button", onClick:function(){ p.irNova(p.iso); }, className:BT_OURO}, "Criar listagem neste dia"));
}

function TelaExcluir(p){
  var s = p.s, dia = doDia(s, p.minhas, p.iso), cand = dia.kits.filter(function(k){ return k.status!=="retirado"; });
  var st = useState({id:cand[0] ? cand[0].id : "", quem:"revendedora", motivo:MOTIVOS_EXCLUSAO[0]}), f = st[0], set = function(k,v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var kitSel = cand.find(function(k){ return k.id===f.id; }) || cand[0];
  if(!kitSel) return e("div",{className:"flex flex-col gap-2.5"}, e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[12px] font-semibold text-[#92400E]"}, "Não há revendedora para excluir neste dia."), e("button",{type:"button", onClick:p.voltar, className:BT_BRANCO}, "Voltar"));
  var ac = acaoDoKitExcluido(kitSel.status), nome = (QUEM_DESMARCOU.find(function(q){ return q[0]===f.quem; }) || [])[1];
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"rounded-2xl bg-[#202023] p-3 text-white"}, e("b",{className:"mb-1.5 block text-[15px]", style:{color:"#FFFFFF"}}, "Excluir da listagem"),
      e("div",{className:"flex items-baseline justify-between py-0.5 text-[12px] text-[#E5E7EB]"}, e("span",null,"Listagem"), e("b",{className:MONO+" text-[13px]", style:{color:"#FFFFFF"}}, tituloDoDia(p.iso))),
      e("div",{className:"mt-1.5 flex items-baseline justify-between border-t border-[#C9A13B] pt-1.5"}, e("span",{className:"text-[12px] font-bold text-[#F0D58A]"}, "Kit"), e("b",{className:MONO+" text-[14px]", style:{color:"#F0D58A"}}, NOME_ETAPA[kitSel.status]||kitSel.status))),
    e("div",{className:CARD+" flex flex-col gap-2 p-2.5"},
      e("label",{className:ROTULO}, "Revendedora", e("select",{value:kitSel.id, onChange:function(ev){ set("id", ev.target.value); }, className:CAMPO}, cand.map(function(k){ return e("option",{key:k.id, value:k.id}, k.rev); }))),
      e("label",{className:ROTULO}, "Quem desmarcou", e("select",{value:f.quem, onChange:function(ev){ set("quem", ev.target.value); }, className:CAMPO}, QUEM_DESMARCOU.map(function(q){ return e("option",{key:q[0], value:q[0]}, q[1]); }))),
      e("label",{className:ROTULO}, "Motivo", e("select",{value:f.motivo, onChange:function(ev){ set("motivo", ev.target.value); }, className:CAMPO}, MOTIVOS_EXCLUSAO.map(function(m){ return e("option",{key:m, value:m}, m); }))),
      e("div",{className:"overflow-hidden rounded-xl border border-[#F0D58A]"},
        e(Linha,{r:"Desmarcou", v:nome}),
        e(Linha,{r:"Multa", v:f.quem==="revendedora" ? "Conforme as regras" : "Não se aplica"}),
        e(Linha,{r:"Aviso para", v:"Deysiane"}),
        ac.k==="montadora" && e(Linha,{r:"Aviso para", v:"Montadora (kit montando)"})),
      e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[12px] font-semibold text-[#92400E]"}, ac.texto),
      e("button",{type:"button", onClick:function(){ p.d({type:"REMOVER_KIT", id:kitSel.id, quem:f.quem, motivo:f.motivo, por:p.rep}); p.voltar(); }, className:"flex h-8 w-full items-center justify-center rounded-xl bg-[#DC2626] text-[13px] font-bold txt-branco"}, "Excluir da listagem"),
      e("button",{type:"button", onClick:p.voltar, className:BT_BRANCO}, "Cancelar")));
}

// p: {s, d, rep, ouro, minhas, sub, setSub, irAdicionar(lid), abrirRev(kit)}
function ListagensRep(p){
  var s = p.s, sub = p.sub, setSub = p.setSub, minhas = p.minhas;
  var vai = function(patch){ setSub(Object.assign({}, sub, patch)); };
  if(sub.t==="nova") return e(NovaListagemRep,{s:s, d:p.d, rep:p.rep, ouro:p.ouro, data:sub.dia || undefined, aoCancelar:function(){ setSub({t:sub.dia ? "dia" : "lista", v:sub.v, mes:sub.mes, dia:sub.dia}); }, aoCriar:function(f){ setSub({t:"dia", v:sub.v, mes:sub.mes, dia:f.data}); }});
  if(sub.t==="dia") return e(TelaDia,{s:s, d:p.d, minhas:minhas, iso:sub.dia, abrirRev:p.abrirRev, irAdicionar:p.irAdicionar, irExcluir:function(iso){ vai({t:"excluir", dia:iso}); }, irNova:function(iso){ vai({t:"nova", dia:iso}); }});
  if(sub.t==="excluir") return e(TelaExcluir,{s:s, d:p.d, rep:p.rep, minhas:minhas, iso:sub.dia, voltar:function(){ vai({t:"dia"}); }});
  // Lista ou Calendário
  var hojeIso = isoDia(new Date()), proximos = [], dt = dataDe(hojeIso);
  for(var q=0;q<14;q++){ if(dt.getDay()!==0) proximos.push(isoDeData(dt)); dt.setDate(dt.getDate()+1); }
  var datas = Array.from(new Set(minhas.filter(function(x){ return !x.fechada; }).map(function(x){ return x.data; }).concat(proximos))).sort(), comListagem = datas.filter(function(iso){ return minhas.some(function(x){ return x.data===iso && !x.fechada; }); }).length;
  var botao = function(v, rot){ var on = sub.v===v; return e("button",{type:"button", onClick:function(){ vai({v:v}); }, className:"flex h-8 items-center whitespace-nowrap rounded-xl px-2.5 text-[12px] font-extrabold ring-1 "+(on ? "bg-[#C9A13B] txt-branco ring-[#C9A13B]" : "bg-white text-[#111827] ring-black/10")}, rot); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-[13px] text-[#111827]"}, "Próximos 14 dias · "+comListagem+(comListagem===1 ? " com listagem" : " com listagem")), e("div",{className:"flex gap-1.5"}, botao("lista","☰ Lista"), botao("cal","📅 Calendário"))),
    sub.v==="cal" ? e(Calendario,{s:s, minhas:minhas, mes:sub.mes, aoMes:function(m){ vai({mes:m}); }, aoEscolher:function(iso){ vai({t:"dia", dia:iso}); }})
            : datas.map(function(iso){ return e(BlocoDia,{key:iso, dia:doDia(s, minhas, iso), onClick:function(){ vai({t:"dia", dia:iso}); }}); }),
    e("button",{type:"button", onClick:function(){ vai({t:"nova", dia:null}); }, className:BT_OURO}, "+ Nova listagem"),
    e("button",{type:"button", onClick:function(){ p.irAdicionar(""); }, className:BT_BRANCO}, "+ Adicionar revendedora numa listagem"));
}

export { ListagensRep };
