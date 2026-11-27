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
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { tudoNoBanco } from "@/apps/montagem/lib/sync-modulos";
import { e, useEffect, useState } from "@/shared/react";

var CARD = "rounded-md border border-[#BFA064] bg-white";
var CAMPO = "h-8 w-full rounded-xl bg-white px-2.5 text-[13px] font-semibold text-[#111827] outline-none ring-1 ring-[#BFA064]";
var ROTULO = "flex min-w-0 flex-col gap-1 text-[11px] font-bold text-[#957321]";
var BT_OURO = "flex h-8 w-full items-center justify-center rounded-lg text-[13px] font-bold txt-branco bg-[#C9A13B]";
var BT_BRANCO = "flex h-8 w-full items-center justify-center rounded-lg bg-white text-[13px] font-bold text-[#111827] ring-1 ring-[#BFA064]";
var NOME_ETAPA = {semvalor:"Recebida", pendente:"Recebida", montando:"Em montagem", supervisao:"Em montagem", ajuste:"Em montagem", montado:"Em montagem", bipando:"Em bipagem", bipado:"Disponível para retirada", retirado:"Retirado", condicional:"Condicional", precond:"Conferindo"};
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

// FERIADOS 2026 (nacionais e de Curitiba): o dia aparece em roxo no calendário e a tela avisa (Marcus, 23/11/2026: "os dias que são feriado")
var FERIADOS = {"2026-01-01":"Confraternização Universal", "2026-02-16":"Carnaval", "2026-02-17":"Carnaval", "2026-04-03":"Sexta-feira Santa", "2026-04-21":"Tiradentes", "2026-05-01":"Dia do Trabalho", "2026-06-04":"Corpus Christi", "2026-09-07":"Independência", "2026-09-08":"Nossa Senhora da Luz (Curitiba)", "2026-10-12":"Nossa Senhora Aparecida", "2026-11-02":"Finados", "2026-11-15":"Proclamação da República", "2026-11-20":"Consciência Negra", "2026-12-25":"Natal"};

// CALENDÁRIO DA PRIMEIRA TELA (modelo 2 aprovado): mês compacto no topo; o dia tocado abre logo abaixo, na mesma tela
function Calendario(p){
  var s = p.s, minhas = p.minhas, hojeIso = isoDia(new Date()), mes = p.mes || (p.sel ? p.sel.slice(0,7) : hojeIso.slice(0,7)), ano = +mes.slice(0,4), m = +mes.slice(5,7)-1;
  var primeiro = new Date(ano, m, 1), vazios = (primeiro.getDay()+6)%7, ultimo = new Date(ano, m+1, 0).getDate();
  var opcoes = []; for(var i=-1;i<=3;i++){ var dm = new Date(+hojeIso.slice(0,4), +hojeIso.slice(5,7)-1+i, 1); opcoes.push([isoDeData(dm).slice(0,7), NOMES_MES[dm.getMonth()]+" de "+dm.getFullYear()]); }
  var idx = opcoes.findIndex(function(o){ return o[0]===mes; });
  var seta = function(rot, alvo){ return e("button",{type:"button", disabled:!alvo, onClick:function(){ if(alvo) p.aoMes(alvo[0]); }, className:"grid size-8 shrink-0 place-items-center rounded-full bg-white text-[13px] font-extrabold text-[#111827] ring-1 ring-black/10 "+(alvo ? "" : "opacity-30")}, rot); };
  var cab = ["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].map(function(x){ return e("div",{key:x, className:"bg-white py-0.5 text-center text-[11px] font-semibold text-[#957321]"}, x); });
  var cels = []; for(var v=0; v<vazios; v++) cels.push(e("div",{key:"v"+v}));
  for(var n=1;n<=ultimo;n++){ (function(n){
    var iso = mes+"-"+String(n).padStart(2,"0"), dia = doDia(s, minhas, iso), tem = dia.ls.length>0, dow = new Date(ano, m, n).getDay(), fer = !!FERIADOS[iso], sel = iso===p.sel;
    var passadoSem = !tem && (iso<hojeIso || dia.fechou), fundo = sel ? "#C9A13B" : fer ? "#EDE9FE" : dia.cheia ? "#FEE2E2" : tem ? "#F8F3E8" : dow===0 || passadoSem ? "#F3F4F6" : "#FFFFFF";
    var cor = sel ? "#FFFFFF" : fer ? "#6D28D9" : dow===0 || passadoSem ? "#9CA3AF" : "#111827";
    var nota = fer ? "" : tem ? (dia.cheia ? "cheia" : dia.kits.length+(dia.kits.length===1 ? " kit" : " kits")) : "";
    cels.push(e("button",{key:iso, type:"button", onClick:function(){ p.aoEscolher(iso); }, className:"flex h-10 flex-col items-center justify-center text-[13px] font-semibold "+(iso===hojeIso ? "ring-2 ring-[#C9A13B]" : "border border-[#E4D3A3]"), style:{background:fundo, color:cor}},
      n, nota && e("span",{className:"text-[11px] font-bold leading-none", style:{color:sel ? "#FFFFFF" : fer ? "#6D28D9" : "#8A6A12"}}, nota)));
  })(n); }
  return e("div",{className:CARD+" flex flex-col gap-2 p-2.5"},
    e("div",{className:"flex items-center justify-between gap-2"}, seta("‹", opcoes[idx-1]),
      e("select",{value:mes, onChange:function(ev){ p.aoMes(ev.target.value); }, className:CAMPO+" text-center"}, opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })), seta("›", opcoes[idx+1])),
    e("div",{className:"grid grid-cols-7 gap-px bg-[#E4D3A3] p-px"}, cab.concat(cels)));
}

// statuses reais (vêm do estado sincronizado com o Admin): Enviada · Recebida · Em montagem · Em bipagem · Disponível para retirada
function statusListagem(s, l){
  if(!l.enviadaEm) return "Rascunho";
  if(!l.recebidaEm) return "Enviada";
  var ks = s.kits.filter(function(k){ return k.lid===l.id; });
  if(ks.length && ks.every(function(k){ return k.status==="bipado" || k.status==="retirado"; })) return "Disponível para retirada";
  if(ks.some(function(k){ return k.status==="bipando" || k.status==="bipado"; })) return "Em bipagem";
  if(ks.some(function(k){ return k.status==="montando" || k.status==="supervisao" || k.status==="ajuste" || k.status==="montado"; })) return "Em montagem";
  return "Recebida";
}
var ETAPAS_LISTAGEM = ["Enviada", "Recebida", "Em montagem", "Em bipagem", "Disponível para retirada"];

// confirmação REAL: só vira "Recebida" quando o banco do Admin já tem a listagem e os kits (tudoNoBanco)
function ConfirmaEnvio(p){
  var l = p.l, st = useState(0), tick = st[1];
  useEffect(function(){
    if(l.recebidaEm) return undefined;
    var iv = setInterval(function(){ if(tudoNoBanco()){ p.d({type:"LISTAGEM_RECEBIDA", lid:l.id}); } tick(function(n){ return n+1; }); }, 1500);
    return function(){ clearInterval(iv); };
  }, [l.id, l.recebidaEm]);
  var atual = statusListagem(p.s, l), idx = ETAPAS_LISTAGEM.indexOf(atual);
  return e("div",{className:CARD+" flex flex-col gap-1 px-3 py-2"},
    e("b",{className:"text-[13px] text-[#5B4410]"}, l.recebidaEm ? "Registrada no sistema · "+atual : "Enviada · aguardando confirmação do sistema…"),
    l.recebidaEm && e("p",{className:"text-[11px] text-[#374151]"}, "Solicitação registrada no Admin. Não precisa enviar pelo WhatsApp."),
    e("div",{className:"flex flex-wrap gap-x-2 text-[11px]"}, ETAPAS_LISTAGEM.map(function(n, i){ return e("span",{key:n, className:i<=idx ? "font-bold text-[#957321]" : "text-[#9CA3AF]"}, (i<=idx ? "✓ " : "")+n); })));
}

// revendedora em bloco compacto: nome no cabeçalho · Atendimento | Vendas | Tipo de kit · observações (Marcus, 27/11/2026)
function BlocoRev(p){
  var k = p.k, s = p.s, st = useState(false), ed = st[0], setEd = st[1], tx = useState(k.obsMontagem||""), txt = tx[0], setTxt = tx[1];
  var venda = (k.vendas||[])[0], prata = modalidadeDe(s, k.rev)==="prata";
  var cel = function(r, v){ return e("div",{key:r, className:"flex min-w-0 flex-col items-center justify-center bg-white px-1 py-1 text-center"}, e("span",{className:"text-[11px] text-[#374151]"}, r), e("b",{className:"text-[13px] font-semibold text-[#111827]"}, v)); };
  var cels = [cel("Atendimento", TIPO_NOME[k.tipoKit]||"Kit")]; if(venda>0) cels.push(cel("Vendas", reais(venda))); cels.push(cel("Tipo de kit", prata ? "100% Prata" : "Ouro"));
  return e("div",{className:"border-t border-[#DCC99A] first:border-t-0"},
    e("div",{className:"flex items-center justify-between gap-2 bg-[#F0E7D0] px-3 py-1.5"},
      e("button",{type:"button", onClick:function(){ if(p.abrirRev) p.abrirRev(k); }, className:"min-w-0 flex-1 text-left text-[13px] font-semibold text-[#5B4410]"}, k.rev),
      e(Situacao,{status:k.status})),
    e("div",{className:"grid gap-px bg-[#E4D3A3]", style:{gridTemplateColumns:"repeat("+cels.length+",minmax(0,1fr))"}}, cels),
    !ed && k.obsMontagem && e("p",{className:"border-t border-[#E4D3A3] bg-white px-3 py-1.5 text-[12px] text-[#111827]"}, e("b",{className:"text-[#957321]"}, "Observações: "), k.obsMontagem),
    ed && e("div",{className:"flex flex-col gap-1.5 border-t border-[#E4D3A3] bg-white p-2"},
      e("textarea",{value:txt, maxLength:400, rows:2, onChange:function(ev){ setTxt(ev.target.value); }, placeholder:"Ex.: priorizar anéis, evitar peças grandes", "aria-label":"Observações para montagem", className:"w-full rounded-lg bg-white px-2 py-1 text-[13px] text-[#111827] outline-none ring-1 ring-[#BFA064]"}),
      e("button",{type:"button", onClick:function(){ p.d({type:"KIT_OBS", id:k.id, lid:k.lid, obs:txt.trim()}); setEd(false); }, className:BT_OURO}, "Salvar observações")),
    !ed && !p.enviada && e("button",{type:"button", onClick:function(){ setTxt(k.obsMontagem||""); setEd(true); }, className:"w-full border-t border-[#E4D3A3] bg-white px-3 py-1 text-left text-[12px] font-semibold text-[#957321]"}, k.obsMontagem ? "Editar observações" : "+ Observações e preferências de peças"));
}

function TelaDia(p){
  var s = p.s, dia = doDia(s, p.minhas, p.iso), hojeIso = isoDia(new Date()), l0 = dia.ls[0];
  var sem = dia.ls.length===0, podeCriar = sem && p.iso>=hojeIso && !passouPrazo({data:p.iso}, Date.now(), s.cfg), enviada = !!(l0 && l0.enviadaEm);
  var gs = useState(l0 ? (l0.obsGeral||"") : ""), geral = gs[0], setGeral = gs[1];
  var tabela = dia.kits.length===0 ? (sem ? null : e("p",{className:"px-3 py-2 text-[13px] font-semibold text-[#4B5563]"}, "Nenhuma revendedora na listagem ainda."))
    : dia.kits.map(function(k){ return e(BlocoRev,{key:k.id, k:k, s:s, d:p.d, enviada:enviada, abrirRev:p.abrirRev}); });
  var acoes = [["", "Ações da listagem…"]];
  if(!sem && !dia.fechou && !dia.cheia) acoes.push(["add","Adicionar da minha carteira"]);
  if(dia.kits.length>0) acoes.push(["excluir","Excluir uma revendedora…"]);
  var aviso = dia.fechou && !sem ? "Prazo encerrado: só a Deysiane inclui mais revendedoras." : dia.cheia ? "Listagem cheia ("+dia.vagas.replace("/"," de ")+"). Crie outra listagem em outro dia." : "";
  var temBipado = dia.kits.some(function(k){ return k.status==="bipado"; });
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-col border border-[#BFA064] bg-white"},
      e("div",{className:"flex items-baseline justify-between gap-2 bg-[#F0E7D0] px-3 py-1.5"}, e("b",{className:"text-[13px] text-[#5B4410]"}, tituloDoDia(p.iso)),
        !sem && e("span",{className:"text-[12px] text-[#374151]"}, horarios(dia.ls))),
      !sem && l0 && e("div",{className:"flex items-baseline justify-between gap-2 border-t border-[#DCC99A] px-3 py-1 text-[12px]"}, e("span",{className:"text-[#374151]"}, dia.fechou ? "Prazo" : "Incluir até"), e("b",{className:"text-[#957321]"}, dia.fechou ? "encerrado" : String(dia.prazo.texto).replace(/([A-Za-zÀ-ú]{3})[A-Za-zÀ-ú]*-feira, /,"$1 "))),
      !sem && tabela && e("div",{className:"border-t border-[#BFA064]"}, tabela),
      !sem && e("div",{className:"flex items-center justify-between border-t border-[#BFA064] bg-[#F3EAD3] px-3 py-1.5 text-[13px]"}, e("span",{className:"text-[#5B4410]"}, "Total de kits solicitados"), e("b",{className:"text-[#5B4410]"}, dia.kits.length))),
    !sem && l0 && (enviada
      ? (l0.obsGeral && e("p",{className:"border border-[#E4D3A3] bg-white px-3 py-1.5 text-[12px] text-[#111827]"}, e("b",{className:"text-[#957321]"}, "Observação geral: "), l0.obsGeral))
      : e("input",{value:geral, maxLength:400, onChange:function(ev){ setGeral(ev.target.value); }, onBlur:function(){ p.d({type:"LISTAGEM_OBS", lid:l0.id, obs:geral.trim()}); }, placeholder:"Observação geral da listagem (opcional)", "aria-label":"Observação geral", className:CAMPO})),
    !sem && l0 && !enviada && dia.kits.length>0 && e("button",{type:"button", onClick:function(){ if(geral.trim()!==(l0.obsGeral||"")) p.d({type:"LISTAGEM_OBS", lid:l0.id, obs:geral.trim()}); p.d({type:"ENVIAR_LISTAGEM", lid:l0.id, por:p.rep}); }, className:BT_OURO}, "Enviar listagem para montagem"),
    !sem && l0 && enviada && e(ConfirmaEnvio,{s:s, d:p.d, l:l0}),
    temBipado && l0 && e("div",{className:CARD+" flex items-center justify-between gap-2 px-3 py-2"}, e("span",{className:"text-[13px] font-semibold text-[#111827]"}, "Código de retirada"), e("b",{className:MONO+" text-[20px] tracking-[.3em] text-[#957321]"}, codigoRetirada(l0))),
    aviso && e("p",{className:"border border-[#E4D3A3] bg-[#F3EAD3] px-3 py-2 text-[12px] font-semibold text-[#5B4410]"}, aviso),
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

// BUSCADOR NA PRÓPRIA TELA (Marcus, 27/11/2026): escolhe a revendedora; código, vendas e tipo de kit já vêm do cadastro. Só falta o tipo de atendimento e as observações.
function BuscaAdicionar(p){
  var st = useState(""), q = st[0], setQ = st[1], dia = doDia(p.s, p.minhas, p.iso), lid = dia.ls[0] && dia.ls[0].id;
  var es = useState(null), r = es[0], setR = es[1], fs = useState({tipoKit:"acerto_kit", mod:"padrao", obs:""}), f = fs[0], setF = fs[1];
  var ja = {}; dia.kits.forEach(function(k){ ja[k.rev] = 1; });
  var norm = q.trim().toLowerCase(), lista = (p.carteira || []).filter(function(x){ return !ja[x.rev] && (!norm || String(x.rev).toLowerCase().indexOf(norm)>=0 || String(x.cod||"").indexOf(norm)>=0); }).slice(0, 8);
  var bloqueio = !lid ? "Crie a listagem deste dia primeiro." : dia.fechou ? "Prazo encerrado: só a Deysiane inclui mais revendedoras." : dia.cheia ? "Listagem cheia." : "";
  var escolher = function(x){ setR(x); setF({tipoKit:"acerto_kit", mod:modalidadeDe(p.s, x.rev), obs:""}); };
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; setF(o); };
  var cab = e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-[13px] text-[#5B4410]"}, "Adicionar em "+tituloDoDia(p.iso)), e("button",{type:"button", onClick:p.fechar, className:"h-8 px-2 text-[13px] font-bold text-[#957321]"}, "Fechar"));
  if(r && !bloqueio) return e("div",{className:CARD+" flex flex-col gap-2 p-2.5"}, cab,
    e("div",{className:"flex items-baseline justify-between gap-2 bg-[#F0E7D0] px-3 py-1.5"}, e("b",{className:"text-[13px] text-[#5B4410]"}, r.rev), e("span",{className:"text-[12px] text-[#374151]"}, (r.cod ? "Cód. "+r.cod+" · " : "")+reais((r.vendas||[])[0]))),
    e("div",{className:"grid grid-cols-2 gap-2"},
      e("label",{className:ROTULO}, "Atendimento", e("select",{value:f.tipoKit, onChange:function(ev){ set("tipoKit", ev.target.value); }, className:CAMPO}, ["acerto_kit","reposicao","condicional"].map(function(t){ return e("option",{key:t, value:t}, TIPO_NOME[t]); }))),
      e("label",{className:ROTULO}, "Tipo de kit", e("select",{value:f.mod, onChange:function(ev){ set("mod", ev.target.value); }, className:CAMPO}, [e("option",{key:"o", value:"padrao"}, "Ouro"), e("option",{key:"p", value:"prata"}, "100% Prata")]))),
    e("label",{className:ROTULO}, "Observações e preferências de peças", e("textarea",{value:f.obs, maxLength:400, rows:2, onChange:function(ev){ set("obs", ev.target.value); }, placeholder:"Ex.: priorizar anéis, brincos pequenos, evitar peças grandes", className:"w-full rounded-lg bg-white px-2 py-1 text-[13px] font-normal text-[#111827] outline-none ring-1 ring-[#BFA064]"})),
    e("div",{className:"grid grid-cols-2 gap-2"}, e("button",{type:"button", onClick:function(){ setR(null); }, className:BT_BRANCO}, "Voltar"),
      e("button",{type:"button", onClick:function(){ p.adicionar(r, lid, {tipoKit:f.tipoKit, obs:f.obs.trim(), modalidade:f.mod!==modalidadeDe(p.s, r.rev) ? f.mod : ""}); setR(null); setQ(""); }, className:BT_OURO}, "Adicionar")));
  return e("div",{className:CARD+" flex flex-col gap-2 p-2.5"}, cab,
    bloqueio ? e("p",{className:"border border-[#E4D3A3] bg-[#F3EAD3] px-3 py-2 text-[12px] font-semibold text-[#5B4410]"}, bloqueio) : [
      e("input",{key:"q", autoFocus:true, value:q, onChange:function(ev){ setQ(ev.target.value); }, placeholder:"Buscar revendedora pelo nome", "aria-label":"Buscar revendedora", className:CAMPO}),
      e("div",{key:"l", className:"overflow-hidden border border-[#E4D3A3]"},
        lista.length===0 ? e("p",{className:"px-3 py-2 text-[13px] font-semibold text-[#4B5563]"}, "Nenhuma revendedora encontrada.")
          : lista.map(function(x){ return e("button",{key:x.id, type:"button", onClick:function(){ escolher(x); }, className:"flex w-full items-center justify-between gap-2 border-t border-[#DCC99A] px-3 py-1.5 text-left first:border-t-0"},
              e("span",{className:"min-w-0 flex-1 text-[13px] font-semibold text-[#111827]"}, x.rev), e("span",{className:"shrink-0 text-[13px] font-bold text-[#957321]"}, "Escolher")); }))]);
}

// MINHAS LISTAGENS: todas as listagens com o status real
function MinhasListagens(p){
  var ls = p.minhas.slice().sort(function(a,b){ return (b.data||"").localeCompare(a.data||""); });
  return e("div",{className:CARD+" overflow-hidden"},
    ls.length===0 ? e("p",{className:"px-3 py-2 text-[13px] text-[#4B5563]"}, "Nenhuma listagem criada ainda.")
      : ls.map(function(l){ var n = p.s.kits.filter(function(k){ return k.lid===l.id; }).length;
        return e("button",{key:l.id, type:"button", onClick:function(){ p.abrir(l.data); }, className:"flex w-full items-center justify-between gap-2 border-t border-[#DCC99A] px-3 py-2 text-left first:border-t-0"},
          e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13px] text-[#111827]"}, tituloDoDia(l.data)), e("span",{className:"block text-[11px] text-[#374151]"}, l.horario+" · "+n+(n===1 ? " kit" : " kits"))),
          e("b",{className:"shrink-0 text-[12px] "+(l.recebidaEm ? "text-[#15803D]" : l.enviadaEm ? "text-[#C2410C]" : "text-[#6B7280]")}, statusListagem(p.s, l))); }));
}

// p: {s, d, rep, ouro, minhas, sub, setSub, carteira, adicionar(rev, lid, extra), abrirRev(kit)}
function ListagensRep(p){
  var s = p.s, sub = p.sub, setSub = p.setSub, minhas = p.minhas, bs = useState(false), buscaAberta = bs[0], setBuscaAberta = bs[1];
  var vai = function(patch){ setSub(Object.assign({}, sub, patch)); };
  if(sub.t==="nova") return e(NovaListagemRep,{s:s, d:p.d, rep:p.rep, ouro:p.ouro, data:sub.dia || undefined, aoCancelar:function(){ setSub({t:sub.dia ? "dia" : "lista", v:sub.v, mes:sub.mes, dia:sub.dia}); }, aoCriar:function(f){ setSub({t:"dia", v:sub.v, mes:sub.mes, dia:f.data}); }});
  if(sub.t==="excluir") return e(TelaExcluir,{s:s, d:p.d, rep:p.rep, minhas:minhas, iso:sub.dia, voltar:function(){ vai({t:"dia"}); }});
  if(sub.t==="minhas") return e(MinhasListagens,{s:s, minhas:minhas, abrir:function(iso){ setSub({t:"lista", v:sub.v, dia:iso, mes:iso.slice(0,7)}); }});
  var hojeIso = isoDia(new Date()), selIso = sub.dia || hojeIso;
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-2 gap-2"},
      e("button",{type:"button", onClick:function(){ vai({t:"minhas"}); }, className:BT_BRANCO}, "Minhas listagens"),
      e("button",{type:"button", onClick:function(){ vai({t:"nova", dia:null}); }, className:BT_OURO}, "+ Nova listagem")),
    e(Calendario,{s:s, minhas:minhas, mes:sub.mes || selIso.slice(0,7), sel:selIso, aoMes:function(m){ vai({mes:m}); }, aoEscolher:function(iso){ vai({t:"lista", dia:iso, mes:iso.slice(0,7)}); }}),
    e(TelaDia,{s:s, d:p.d, rep:p.rep, minhas:minhas, iso:selIso, abrirRev:p.abrirRev, irAdicionar:function(){ setBuscaAberta(true); }, irExcluir:function(iso){ vai({t:"excluir", dia:iso}); }, irNova:function(iso){ vai({t:"nova", dia:iso}); }}),
    buscaAberta && e(BuscaAdicionar,{s:s, minhas:minhas, iso:selIso, carteira:p.carteira, adicionar:p.adicionar, fechar:function(){ setBuscaAberta(false); }}),
    !buscaAberta && e("button",{type:"button", onClick:function(){ setBuscaAberta(true); }, className:BT_BRANCO}, "+ Adicionar revendedora numa listagem"));
}

export { ListagensRep };
