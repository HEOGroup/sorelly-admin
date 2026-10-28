// Sorelly Admin — pages/ConsolidadoRepresentantes.js
// Kits → Representantes → Consolidado: CONTROLE do que entrou. Tudo que a representante preenche no app (acerto, kit novo, reposição) ou o atendimento interno lança
// aparece aqui sozinho e fica pendente até trazer na empresa: o agendamento confere e dá o OK. A comissão e as contas (Point, link…) ficam só em Comissões.
// O agendamento vê quantidades (atendimentos, por representante) e o que precisa conferir, nunca os totais de valores. Abaixo do cabeçalho há sempre uma linha com o total do que está filtrado.
import { STATUS_LISTA, analisar, comisEfetiva, itensComissao, pagoDe, prazoPendente, statusDe, taxaDe } from "@/apps/montagem/domain/comissoes";
import { conferirBrindes } from "@/apps/montagem/domain/consignado";
import { GRUPOS_CONTA, grupoDaConta } from "@/apps/montagem/domain/contas-grupos";
import { AGENDAMENTO, BIPADORAS, FINANCEIRO, SUPERVISORA, nomeDe, podeAgendar, podeBipRetorno, veTotais } from "@/apps/montagem/domain/equipe";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { BlocoErrosBipagem } from "@/apps/montagem/components/erros-bipagem";
import { FilaRetornos } from "@/apps/montagem/components/fila-retornos";
import { BIPA_RETORNO_PADRAO, papelDe as papelDeCons } from "@/apps/montagem/domain/equipe";
import { podeBiparRetorno } from "@/apps/montagem/domain/retornos";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var r2 = function(n){ return Math.round(n*100)/100; };
var fmtData = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var SEL = INPUT+" h-10! cursor-pointer text-sm!";
var TIPOS = ["acerto","kit_novo_entrega","reposicao","reposicao_especial"];   // tudo que a representante lança no app

// Calcula as colunas derivadas de um atendimento registrado
function linha(r, c){
  var pago = pagoDe(r);   // recebido de verdade (com o dinheiro contado e sem "acerto com loja")
  var ac = r.tipo==="acerto";
  var devido = r2((r.valorDevido!=null ? r.valorDevido : r.valorAcerto||0) + (r.excedenteBrinde||0) + (r.tagsValor||0) + (r.multas||0));   // multas: regras de 27/10/2026, somam no total a pagar
  var falta = ac ? Math.max(0, r2(devido - pago)) : 0;
  var teorico = r.faixa ? (r.faixa.bn + r.faixa.bb) : 0;
  var descBrinde = Math.max(0, r2(teorico - ((r.brindeNormal||0) + (r.brindeSelect||0))));
  var rec = r.recebimento || {};
  var an = analisar(c, r);
  var kitNovo = r.tipo==="kit_novo_entrega", repos = r.tipo.indexOf("reposicao")===0;
  var condNec = kitNovo || (ac && an.promPrec), condOk = !condNec || !!(rec.prom && rec.prom.ok);
  var dinTot = r2((r.pagamentos||[]).filter(function(p){ return p.forma==="dinheiro"; }).reduce(function(t,p){ return t+(p.valor||0); }, 0)), din = rec.din || {};
  var repDinOk = !!(rec.rep && rec.rep.din && rec.rep.din.ok), dinOk = dinTot<=0 || (!!din.ok && repDinOk);
  var contaB = conferirBrindes(r.brindesLancados || (r.formSnapshot||{}).brindes, r.brindeNormal||0, r.brindeSelect||0), tx = taxaDe(r);
  return {r:r, ac:ac, kitNovo:kitNovo, repos:repos, condNec:condNec, condOk:condOk, dinTot:dinTot, din:din, repDinOk:repDinOk, dinOk:dinOk, completo:!!rec.ok && condOk && dinOk, brindes:contaB, tx:tx, status:statusDe(r), pago:pago, devido:devido, falta:falta, descBrinde:descBrinde, rec:rec, an:an,
    temDinheiro:(r.pagamentos||[]).some(function(p){ return p.forma==="dinheiro"; }), promPend:condNec && !condOk,
    comissaoValor: ac ? r2((r.vendaLiquida||0) - (r.valorAcerto||0)) : 0, interno: r.origem==="interno",
    quem: r.origem==="interno" ? "Interno" : (r.rep || "—")};
}

// Arrastar a tabela para o lado: clica em qualquer parte vazia, segura e arrasta (botões e campos continuam funcionando normalmente)
var FORMA_PALAVRA = {pix:"Pix", link:"Link", credito:"Crédito", debito:"Débito", dinheiro:"Dinheiro", pix_representante:"Pix", acerto_loja:"Acerto"};
function rotuloConta(k, conta){
  var ruido = /^(PIX|CRÉDITO|DÉBITO|LINK|ACERTO|SERENITY|SORELLY|MAYZ|AXIS|34|46|59|67|-)$/i;
  var resto = String(conta).split(/\s+/).filter(function(w){ return !ruido.test(w); }).map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); }).join(" ");
  return [resto || "—"];
}
var hexA = function(hex, a){ var n = parseInt(hex.slice(1), 16); return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"; };
var degrade = function(i, n, ini, fim){ return n>1 ? ini-(ini-fim)*(i/(n-1)) : (ini+fim)/2; };   // transparência da coluna i de n
function iniciaArrasto(ev){
  if(ev.button!==0 || (ev.target.closest && ev.target.closest("button,input,select,textarea,a,label"))) return;
  var el = ev.currentTarget, x0 = ev.clientX, sl = el.scrollLeft;
  el.style.cursor = "grabbing"; el.style.userSelect = "none";
  var mv = function(m){ el.scrollLeft = sl-(m.clientX-x0); };
  var up = function(){ el.style.cursor = ""; el.style.userSelect = ""; document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
  document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
}
var hm = function(ts){ return new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}); };
var hmd = function(ts){ return new Date(ts).toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"}); };
// tempo entre o atendimento (data e hora do acerto) e o recebimento na empresa
var tempoEntre = function(r, fimTs){ var a = new Date(r.data+"T"+((r.hora||"00:00").slice(0,5))+":00").getTime(), m = Math.max(0, Math.round((new Date(fimTs).getTime()-a)/60000));
  return m>=1440 ? Math.floor(m/1440)+"d "+Math.floor(m%1440/60)+"h" : m>=60 ? Math.floor(m/60)+"h "+String(m%60).padStart(2,"0")+"min" : m+" min"; };
var diasDepois =function(dataAcerto, ts){ var a = new Date(dataAcerto+"T00:00:00").getTime(), b = new Date(ts); b = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime(); return Math.max(0, Math.round((b-a)/86400000)); };
var duracao = function(ini, fim){ var m = Math.max(0, Math.round((new Date(fim).getTime()-new Date(ini).getTime())/60000)); return m>=60 ? Math.floor(m/60)+"h"+String(m%60).padStart(2,"0") : m+" min"; };

// Relógio da primeira coluna: iniciar a conferência → terminar (fica a data de recebimento e o tempo que levou)
function Relogio(p){
  var rec = p.l.rec, ok = !!rec.ok, rodando = !!rec.inicioTs && !ok;
  var cls = ok ? "bg-success/20 text-success ring-success/40" : rodando ? "bg-warning/20 text-warning ring-warning/50" : "bg-muted text-muted-foreground ring-border";
  return e("button",{onClick:p.onClick, disabled:!p.agenda, "aria-label":ok ? "Conferência concluída (clique para desfazer)" : rodando ? "Terminar conferência" : "Iniciar conferência",
    title:ok ? "Recebido em "+new Date(rec.fimTs||rec.em).toLocaleString("pt-BR")+(rec.quem ? " · por "+rec.quem : "") : rodando ? "Conferência em andamento desde "+hm(rec.inicioTs)+": clique para terminar" : "Iniciar a conferência",
    className:"inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-1.5 text-[11px] font-bold ring-1 "+cls+(p.agenda ? "" : " opacity-50")},
    e(Icon,{n:ok ? "check" : rodando ? "play" : "clock", s:14}), ok && rec.inicioTs && (rec.fimTs ? duracao(rec.inicioTs, rec.fimTs) : null), rodando && duracao(rec.inicioTs, new Date().toISOString()));
}

// Dinheiro: valor + botão "Recebi" (funcionária) + confirmação da representante no app. Se contou diferente, vira divergência (diferença fica em aberto)
function CelDinheiro(p){
  var l = p.l, rec = l.rec, din = l.din, st = useState(false), edit = st[0], setEdit = st[1], vs = useState(l.dinTot), v = vs[0], setV = vs[1];
  if(l.dinTot<=0) return e("span",{className:"text-muted-foreground"},"—");
  var diverge = din.ok && din.contado!=null && Math.abs(din.contado-l.dinTot)>0.009;
  var chip = function(txt, cor){ return e("span",{className:"rounded px-1.5 py-px text-[10px] font-bold "+cor}, txt); };
  return e("div",{className:"flex min-w-[8.5rem] flex-col items-center gap-1"},
    e("b",{className:"text-emerald-300"}, BK(l.dinTot)),
    !din.ok
      ? (edit
          ? e("div",{className:"flex items-center gap-1"}, e(MoneyInput,{value:v, sm:true, label:"Dinheiro contado", className:"w-24", onChange:setV}),
              e("button",{onClick:function(){ p.onOk(Math.abs(v-l.dinTot)>0.009 ? v : null); setEdit(false); }, className:"rounded-md bg-primary px-2 py-1 text-[11px] font-bold text-primary-foreground"},"OK"),
              e("button",{onClick:function(){ setEdit(false); }, className:"text-[12px] text-muted-foreground"},"×"))
          : e("button",{disabled:!p.agenda, onClick:function(){ setV(l.dinTot); setEdit(true); }, className:"rounded-md border border-warning/60 bg-warning/10 px-2 py-0.5 text-[11px] font-bold text-warning disabled:opacity-50"},"Recebi o dinheiro"))
      : e("div",{className:"flex flex-wrap items-center justify-center gap-1"},
          chip("✓ Empresa", "bg-success/20 text-success"),
          l.repDinOk ? chip("✓ Representante", "bg-success/20 text-success") : chip("aguarda representante", "bg-warning/20 text-warning"),
          p.agenda && !rec.ok && e("button",{onClick:p.onDesfaz, "aria-label":"Desfazer", className:"text-[12px] text-muted-foreground hover:text-destructive"},"×")),
    diverge && chip("Contou "+BK(din.contado)+" · falta "+BK(l.dinTot-din.contado), "bg-destructive/20 text-destructive"));
}

// Condicional: uma linha por condicional (número + "Assinada" / "Não assinada"); nada marcado = ainda não conferida
function CelCond(p){
  var l = p.l, r = l.r, rec = l.rec, nums = rec.condNums || r.condicionaisSelecionadas || [];
  var vs = useState(""), v = vs[0], setV = vs[1];
  // true = assinada, false = não assinada, undefined = ainda não conferida; dado antigo sem marcação por número vale pelo check geral
  var assDe = function(n){ return rec.condAss ? rec.condAss[n] : ((rec.prom && rec.prom.ok) ? true : undefined); };
  var grava = function(lista, ass){ var todas = lista.length>0 && lista.every(function(n){ return ass[n]===true; });
    p.onSet({condNums:lista, condAss:ass, prom:todas ? {ok:true, em:new Date().toISOString(), por:p.usuario} : {ok:false}}); };
  var assAtual = function(){ var o = {}; nums.forEach(function(n){ var a = assDe(n); if(a!==undefined) o[n] = a; }); return o; };
  var adiciona = function(){ var n = v.trim(); setV(""); if(!n || nums.indexOf(n)>=0) return; grava(nums.concat([n]), assAtual()); };
  var marca = function(n, val){ var o = assAtual(); if(o[n]===val) delete o[n]; else o[n] = val; grava(nums, o); };
  var tira = function(n){ var o = assAtual(); delete o[n]; grava(nums.filter(function(x){ return x!==n; }), o); };
  var opc = function(n, val, txt, on, cor){ return e("button",{disabled:!p.agenda, onClick:function(){ marca(n, val); }, "aria-pressed":on, className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold disabled:opacity-60 "+(on ? cor : "bg-white/5 text-muted-foreground hover:bg-white/10")}, txt); };
  return e("div",{className:"flex min-w-[14rem] flex-col items-stretch gap-1.5 py-1"},
    nums.map(function(n){ var a = assDe(n);
      return e("div",{key:n, className:"flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 ring-1 "+(a===true ? "ring-success/40" : a===false ? "ring-destructive/40" : "ring-white/10")},
        e("b",{className:MONO+" min-w-[3.2rem] text-left text-[13px]"}, n),
        opc(n, true, "Assinada", a===true, "bg-success/25 text-success"),
        opc(n, false, "Não assinada", a===false, "bg-destructive/25 text-destructive"),
        p.agenda && e("button",{onClick:function(){ tira(n); }, "aria-label":"Tirar a condicional "+n, className:"ml-auto px-1 text-[11px] opacity-60 hover:opacity-100"},"×")); }),
    p.agenda && e("div",{className:"flex items-center gap-1"},
      e("input",{value:v, placeholder:"Nº da condicional", "aria-label":"Número da condicional", className:INPUT+" h-8! min-w-0 flex-1 px-2! text-[12.5px]!", onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") adiciona(); }}),
      e("button",{onClick:adiciona, "aria-label":"Adicionar condicional", title:"Adicionar condicional", className:"grid size-8 shrink-0 place-items-center rounded-lg bg-[#E8B84B] text-[#1B1409] hover:brightness-110"}, e(Icon,{n:"plus", s:14}))));
}

// Multa lançada pela representante no app: remarcação "com multa" (vermelho) ou "isenta" (verde, com o motivo) e o atraso do Kit 100% Prata
function CelMulta(p){
  var r = p.r, rem = r.remarcacoes || [], mu = rem.filter(function(x){ return !x.isenta; }), is = rem.filter(function(x){ return x.isenta; }), atr = r.atrasoDias || 0;
  // regras de 27/10/2026: multa do valor pendente, contagem dos 15 dias, kit novo bloqueado e jurídico
  var pz = p.falta>0.009 ? prazoPendente(r, isoDia(new Date())) : null, multa = r.multas || 0;
  if(!rem.length && !atr && !multa && !pz && !r.juridico) return e("span",{className:"text-muted-foreground"},"—");
  return e("span",{className:"flex flex-col items-center gap-0.5"},
    mu.length>0 && e("span",{className:"rounded bg-destructive/20 px-1.5 py-px text-[11px] font-bold text-destructive", title:"Remarcação com multa"+(p.pct>0 ? " · tirou "+p.pct+"% da comissão" : "")}, mu.length+(mu.length===1 ? " multa" : " multas")+(p.pct>0 ? " · −"+p.pct+"%" : "")),
    is.length>0 && e("span",{className:"rounded bg-success/20 px-1.5 py-px text-[11px] font-bold text-success", title:is.map(function(x){ return x.motivo || "isenta"; }).join("\n")}, is.length+(is.length===1 ? " isenta" : " isentas")),
    atr>0 && e("span",{className:"rounded bg-destructive/20 px-1.5 py-px text-[11px] font-bold text-destructive"}, "atraso "+atr+"d"),
    r.juridico && e("span",{className:"rounded bg-destructive/30 px-1.5 py-px text-[11px] font-bold text-destructive", title:"60 dias de atraso: perde comissão e brinde e vai ao jurídico"}, "jurídico"),
    multa>0 && e("span",{className:"rounded bg-destructive/20 px-1.5 py-px text-[11px] font-bold text-destructive", title:"Multa de "+(r.regrasNovas ? r.regrasNovas.multaPendentePct : 10)+"% sobre o valor pendente"}, "multa "+BK(multa)),
    pz && e("span",{className:"rounded px-1.5 py-px text-[11px] font-bold "+(pz.atraso>0 ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"), title:pz.atraso>0 ? "Prazo vencido: multa de atraso de "+pz.pct+"% sobre o pendente" : "Prazo para quitar o valor pendente"}, pz.atraso>0 ? pz.atraso+"d de atraso" : pz.dias+"/"+pz.prazo+" dias"),
    pz && e("span",{className:"rounded bg-destructive/20 px-1.5 py-px text-[11px] font-bold text-destructive", title:"Próximo kit só depois de quitar o valor pendente"}, "kit bloqueado"));
}

// Bloco de resultado do topo: total + as 3 representantes que mais fizeram; clicando abre a lista completa
function BlocoRep(p){
  var sp = p.sp, top = p.rank.filter(function(x){ return parseFloat(String(x[1]).replace(/[^0-9,-]/g,"").replace(",","."))>0; }).slice(0,3);
  return e("button",{onClick:p.onClick, "aria-expanded":p.aberto, className:"flex min-h-[10rem] flex-col gap-2 overflow-hidden rounded-2xl bg-linear-to-br from-[#1E1912] to-[#0E0C08] p-3 text-left ring-1 transition "+(p.aberto ? "ring-[#E8B84B]/70" : "ring-[#E8B84B]/20 hover:ring-[#E8B84B]/45")},
    e("div",{className:"flex items-center gap-2.5"},
      e("span",{className:"grid size-10 shrink-0 place-items-center rounded-xl text-[#0E0C08] shadow", style:{background:sp.cor}}, e(Icon,{n:sp.ic, s:19})),
      e("div",{className:"min-w-0"}, e("p",{className:"truncate text-[10.5px] font-bold uppercase tracking-wide text-[#C9B98F]"}, sp.t), e("b",{className:MONO+" block truncate text-[20px] leading-tight text-[#F1E4C6]"}, p.total))),
    e("div",{className:"flex flex-col gap-0.5 border-t border-white/10 pt-2"}, top.length===0 ? e("span",{className:"text-[12px] text-[#9A8B63]"},"—") : top.map(function(x, i){
      return e("div",{key:x[0], className:"flex items-baseline justify-between gap-2 text-[12px]"}, e("span",{className:"truncate text-[#E8DCC0]"}, (i+1)+". "+x[0]), e("b",{className:MONO, style:{color:sp.cor}}, x[1])); })),
    e("span",{className:"mt-auto inline-flex items-center gap-1 pt-1 text-[10.5px] font-semibold text-[#E8B84B]"}, e(Icon,{n:p.aberto ? "chevrondown" : "chevron", s:11}), p.aberto ? "fechar lista" : (p.rank.length===1 ? "ver a representante" : "ver as "+p.rank.length+" representantes")));
}

// Mini bloco de peças de um atendimento: códigos e valores dos brindes (normal e BB) e das peças do próximo mês.
// A funcionária confere peça por peça: se faltou uma peça que tinha saído como brinde, ela marca aqui que está tudo certo.
function PecasMini(p){
  var cn = useState(""), numNova = cn[0], setNumNova = cn[1];
  var r = p.l.r, rec = p.l.rec, ok = rec.pecasOk || {}, lista = r.brindesLancados || (r.formSnapshot||{}).brindes || [];
  var anterior = (p.todos||[]).filter(function(a){ return a.tipo==="acerto" && a.rev===r.rev && a.id!==r.id && (a.data||"")<(r.data||""); }).sort(function(a,b){ return a.data<b.data ? 1 : -1; })[0],
    retiradas = anterior ? (anterior.brindesLancados || (anterior.formSnapshot||{}).brindes || []).filter(function(b){ return b.origem==="nova"; }) : [],
    normal = lista.filter(function(b){ return b.cat==="normal"; }), bb = lista.filter(function(b){ return b.cat==="bb"; }), prox = (r.pecasProxCodigos||[]).map(function(c){ return {codigo:c}; });
  var marca = function(cod){ if(!p.agenda) return p.receber(r.id, {}); var o = Object.assign({}, ok); o[cod] = !o[cod]; p.receber(r.id, {pecasOk:o}); };
  var bloco = function(titulo, itens, cor, soma){
    var feitas = itens.filter(function(i){ return ok[i.codigo]; }).length;
    return e("div",{key:titulo, className:"min-w-[13rem] flex-1 overflow-hidden rounded-xl bg-[#14110B] ring-1 ring-[#E8B84B]/20"},
      e("div",{className:"flex items-center justify-between gap-2 px-3 py-1.5", style:{background:cor}}, e("b",{className:"text-[11.5px] uppercase tracking-wide text-white"}, titulo), e("span",{className:"text-[11px] font-bold text-white/90"}, feitas+"/"+itens.length+" conferidas")),
      itens.length===0 ? e("p",{className:"px-3 py-2 text-[12px] text-muted-foreground"},"Nenhuma peça.") :
      itens.map(function(i){ var on = !!ok[i.codigo];
        return e("label",{key:i.codigo, className:"flex cursor-pointer items-center gap-2 border-t border-white/5 px-3 py-1.5 text-[12.5px] "+(on ? "bg-success/10" : "")},
          e("input",{type:"checkbox", checked:on, disabled:!p.agenda, className:"size-4", onChange:function(){ marca(i.codigo); }}),
          e("span",{className:MONO+" font-semibold"}, i.codigo),
          i.origem && e("span",{className:"rounded-full px-1.5 py-px text-[9.5px] font-bold uppercase "+(i.origem==="antiga" ? "bg-amber-400/25 text-amber-200" : "bg-emerald-400/25 text-emerald-200")}, i.origem==="antiga" ? "Kit antigo" : "Kit novo"),
          e("span",{className:"ml-auto "+MONO+" text-[#C9B98F]"}, i.valor!=null ? BK(i.valor) : "—")); }),
      soma!=null && e("div",{className:"flex justify-between border-t border-white/10 px-3 py-1 text-[11.5px] text-[#9A8B63]"}, e("span",null,"Lançado"), e("b",{className:MONO}, BK(soma))));
  };
  var resumo = function(){ var linha = function(n, v){ return e("div",{key:n, className:"flex justify-between border-t border-white/5 px-3 py-1 text-[12.5px]"}, e("span",{className:"text-[#C9B98F]"}, n), e("b",{className:MONO}, v==null ? "—" : v)); };
    return e("div",{key:"res", className:"min-w-[11rem] overflow-hidden rounded-xl bg-[#14110B] ring-1 ring-[#E8B84B]/20"},
      e("div",{className:"bg-[#475569] px-3 py-1.5"}, e("b",{className:"text-[11.5px] uppercase tracking-wide text-white"},"Peças do acerto")),
      linha("Total", r.pecasCond), linha("Vendidas", r.pecasVendidas), linha("Trocas", r.pecasTrocas||0), linha("Brindes", lista.length), linha("Retornadas", r.pecasADevolver)); };
  return e("div",{className:"flex flex-wrap items-start gap-3"},
    e("p",{className:"w-full text-[12px] text-[#C9B98F]"}, e("b",{className:"text-[#F1E4C6]"}, r.rev), " · marque cada peça conferida. Se uma peça não veio mas saiu como brinde, é só confirmar aqui."),
    resumo(), bloco("Brindes normal", normal, "#BE185D", normal.reduce(function(t2,i){ return t2+(i.valor||0); }, 0)), bloco("Brindes BB", bb, "#7C3AED", bb.reduce(function(t2,i){ return t2+(i.valor||0); }, 0)),
    e("div",{key:"tr", className:"min-w-[15rem] flex-1 overflow-hidden rounded-xl bg-[#14110B] ring-1 ring-[#E8B84B]/20"},
      e("div",{className:"flex items-center justify-between bg-[#B45309] px-3 py-1.5"}, e("b",{className:"text-[11.5px] uppercase tracking-wide text-white"},"Trocas"), e("span",{className:"text-[11px] font-bold text-white/90"}, (r.trocas||[]).length || r.pecasTrocas || 0)),
      (r.trocas||[]).length===0 ? e("p",{className:"px-3 py-2 text-[12px] text-muted-foreground"},"Nenhuma troca.") :
      r.trocas.map(function(t,i){ var aj = t.tipo==="anterior" ? (t.novaValor||0)-(t.antigaValor||0) : (t.novaValor||0);
        return e("div",{key:i, className:"flex flex-col gap-0.5 border-t border-white/5 px-3 py-1.5 text-[12.5px]"},
          e("span",{className:"text-[10.5px] font-bold uppercase "+(t.tipo==="anterior" ? "text-sky-300" : "text-orange-300")}, t.tipo==="anterior" ? "Peça de outro mês · já paga" : "Peça deste kit"),
          e("span",null, "Voltou quebrada ", e("b",{className:MONO}, t.antigaCod), " ", BK(t.antigaValor)),
          e("span",null, "Ficou ", e("b",{className:MONO}, t.novaCod), " ", BK(t.novaValor)),
          e("b",{className:MONO+" "+(aj>=0 ? "text-amber-200" : "text-emerald-300")}, (aj>=0 ? "Soma " : "Desconta ")+BK(Math.abs(aj))+" na venda")); })),
    bloco("Peças do próximo mês", prox, "#0F766E", null),
    prox.length>0 && e("div",{key:"cn", className:"min-w-[15rem] flex-1 overflow-hidden rounded-xl bg-[#14110B] ring-1 ring-[#E8B84B]/20"},
      e("div",{className:"flex items-center justify-between bg-[#0F766E] px-3 py-1.5"}, e("b",{className:"text-[11.5px] uppercase tracking-wide text-white"},"Condicional nova"), e("span",{className:"text-[11px] font-bold text-white/90"}, rec.condNova ? "gerada" : "pendente")),
      e("div",{className:"flex flex-col gap-2 px-3 py-2.5"},
        e("p",{className:"text-[12px] text-[#C9B98F]"},"Faça a nova bipagem na DevMaster e coloque aqui o número da condicional nova."),
        rec.condNova ? e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:MONO+" text-[15px] text-success"}, "✓ "+rec.condNova.numero), p.podeProx && e("button",{onClick:function(){ p.receber(r.id, {condNova:null}); }, className:"text-[11px] text-muted-foreground hover:text-destructive"}, "desfazer"))
          : p.podeProx ? e("div",{className:"flex gap-1.5"},
              e("input",{value:numNova, placeholder:"Nº da condicional", "aria-label":"Número da condicional nova", className:INPUT+" h-9! min-w-0 flex-1 px-2! text-[13px]!", onChange:function(ev){ setNumNova(ev.target.value.replace(/[^0-9]/g,"")); }, onKeyDown:function(ev){ if(ev.key==="Enter" && numNova) p.receber(r.id, {condNova:{numero:numNova, por:p.usuario, em:new Date().toISOString()}}); }}),
              e("button",{disabled:!numNova, onClick:function(){ p.receber(r.id, {condNova:{numero:numNova, por:p.usuario, em:new Date().toISOString()}}); }, className:"h-9 shrink-0 rounded-lg bg-[#E8B84B] px-3 text-[12px] font-bold text-[#1B1409] disabled:opacity-40"}, "Salvar"))
          : e("span",{className:"text-[12px] font-semibold text-warning"},"Aguardando quem faz a bipagem do retorno"))),
    anterior && retiradas.length>0 && e("div",{key:"mal", className:"min-w-[13rem] flex-1 overflow-hidden rounded-xl bg-[#14110B] ring-1 ring-emerald-400/30"},
      e("div",{className:"bg-[#047857] px-3 py-1.5"}, e("b",{className:"block text-[11.5px] uppercase tracking-wide text-white"},"Tiradas do kit novo no início do mês"), e("span",{className:"text-[10.5px] text-white/85"},"brindes do acerto anterior ("+fmtData(anterior.data)+") que saíram do kit novo")),
      retiradas.map(function(i){ return e("div",{key:i.codigo, className:"flex items-center gap-2 border-t border-white/5 px-3 py-1.5 text-[12.5px]"}, e("span",{className:MONO+" font-semibold"}, i.codigo), e("span",{className:"ml-auto "+MONO+" text-[#C9B98F]"}, i.valor!=null ? BK(i.valor) : "—")); })));
}

function Kpi(p){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-xl bg-linear-to-b from-[#3A2912]/40 to-card px-3 py-3 text-center ring-1 ring-[#E8B84B]/20"},
  e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide"}, p.t), e("b",{className:MONO+" text-[22px] "+(p.cor||"")}, p.v)); }

// Título estilizado das telas das representantes (letra do tema, em degradê dourado)
var TITULO = "font-heading text-[28px] font-bold uppercase leading-tight tracking-[0.12em] bg-linear-to-r from-[#F8EBC8] via-[#E8B84B] to-[#B8893A] bg-clip-text text-transparent";

// Passo a passo para quem atende a representante na empresa
var PASSOS = [
  ["users", "Escolha a representante", "No filtro \"Representantes\", escolha quem acabou de chegar. A tabela mostra só os atendimentos dela."],
  ["clock", "Inicie o cronômetro de cada atendimento", "No relógio da primeira coluna: um clique inicia a conferência. Só termina quando tudo abaixo estiver conferido."],
  ["check", "Confira as condicionais", "Digite o número de cada condicional e clique em +. Em cada uma, marque \"Assinada\" ou \"Não assinada\"."],
  ["coins", "Confira o dinheiro", "Conte o dinheiro e clique em \"Recebi o dinheiro\". Se o valor contado for diferente do lançado, digite o valor que contou."],
  ["banco", "Confira os pagamentos", "Veja se cada pagamento está na conta da empresa e não na conta particular da representante."],
  ["celular", "A representante dá baixa no app dela", "Ela entra em Comissões, abre \"Entrega na empresa\" e marca que entregou o dinheiro e as condicionais. Sem a baixa dela e a sua, o relógio não termina."]];
function PassoAPasso(p){
  return e("section",{className:"overflow-hidden rounded-2xl bg-black ring-1 ring-[#E8B84B]/40"},
    e("button",{onClick:p.alterna, "aria-expanded":p.aberto, className:"flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left", style:{background:"linear-gradient(90deg,#3A2912,#5C4322 55%,#86653A)"}},
      e("span",{className:"inline-flex items-center gap-2 font-heading text-[15px] font-bold uppercase tracking-widest text-[#F1E4C6]"}, e(Icon,{n:p.aberto ? "chevrondown" : "chevron", s:15}), "Passo a passo: quando chegar uma representante"),
      e("span",{className:"text-[12px] text-[#F1E4C6]"}, p.aberto ? "fechar" : "abrir")),
    p.aberto && e("ol",{className:"grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3"}, PASSOS.map(function(x, i){
      return e("li",{key:i, className:"flex gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-[#E8B84B]/20"},
        e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-[#E8B84B] font-heading text-[15px] font-bold text-[#1B1409]"}, i+1),
        e("div",{className:"min-w-0"}, e("b",{className:"flex items-center gap-1.5 text-[14.5px] text-[#F1E4C6]"}, e(Icon,{n:x[0], s:15}), x[1]), e("p",{className:"mt-0.5 text-[13.5px] leading-snug"}, x[2]))); })));
}

function AbaConsolidadoRep(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date();
  var mm = useState(hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0")), mes = mm[0], setMes = mm[1];
  var fb = useState(""), busca = fb[0], setBusca = fb[1];
  var fo = useState("todas"), origem = fo[0], setOrigem = fo[1];
  var fr = useState("todas"), repF = fr[0], setRepF = fr[1];
  var fs = useState("todas"), sit = fs[0], setSit = fs[1];
  var ft = useState("todos"), statF = ft[0], setStatF = ft[1];
  var kk = useState(false), knAberto = kk[0], setKnAberto = kk[1];
  var pa = useState(false), pagAberto = pa[0], setPagAberto = pa[1];          // pagamentos (menos o dinheiro): começa fechado
  var dt = useState(null), popId = dt[0], setPopId = dt[1];                    // atendimento com o pop-up de brindes e peças aberto
  var bq = useState(null), bl = bq[0], setBl = bq[1];                          // bloco do topo com a lista de representantes aberta
  var pc = useState(false), passosAberto = pc[0], setPassosAberto = pc[1];       // passo a passo do atendimento: começa fechado
  var rs = useState(false), resAberto = rs[0], setResAberto = rs[1];            // resultado do mês: começa fechado
  var pe = useState(false), pecasAberto = pe[0], setPecasAberto = pe[1];      // peças e brindes (bipagem de retorno): começa fechado

  var c = comisEfetiva(s), agenda = podeAgendar(s.usuario), ver = veTotais(s.usuario);
  var todos = (s.acertosConsignado||[]).filter(function(r){ return TIPOS.indexOf(r.tipo)>=0 && r.origem!=="interno"; });   // atendimento interno tem consolidado próprio
  var meses = todos.map(function(r){ return (r.data||"").slice(0,7); }).concat([mes]).filter(function(m,i,a){ return m && a.indexOf(m)===i; }).sort().reverse();
  var linhasMes = todos.filter(function(r){ return (r.data||"").slice(0,7)===mes; }).map(function(r){ return linha(r, c); });
  var quemLista = linhasMes.map(function(l){ return l.interno ? "Interno · "+(l.r.por||"—") : l.r.rep; }).filter(function(x,i,a){ return x && a.indexOf(x)===i; }).sort();
  var b = busca.trim().toLowerCase();
  var passa = function(l, ignoraStatus, ignoraSit){
    if(origem==="app" && l.interno) return false;
    if(origem==="interno" && !l.interno) return false;
    if(repF!=="todas" && (l.interno ? "Interno · "+(l.r.por||"—") : l.r.rep)!==repF) return false;
    if(!ignoraStatus && statF!=="todos" && l.status!==statF) return false;
    if(!ignoraSit){
      if(sit==="receber" && l.rec.ok) return false;
      if(sit==="recebido" && !l.rec.ok) return false;
      if(sit==="aberto" && l.falta<=0.009) return false;
      if(sit==="prom" && !l.promPend) return false;
      if(sit==="ok" && !l.completo) return false;
      if(sit==="pend" && l.completo) return false;
      if(sit==="fin" && !(l.ac && l.rec.ok && l.an.finPend>0)) return false; }
    if(b && (l.r.rev||"").toLowerCase().indexOf(b)<0) return false;
    return true; };
  var linhas = linhasMes.filter(function(l){ return passa(l); }).sort(function(a,b2){ return (b2.r.data+(b2.r.hora||"")).localeCompare(a.r.data+(a.r.hora||"")); });
  // contagens do cabeçalho: respeitam representante, origem e busca, mas não o status nem a situação escolhidos (assim os números não somem ao clicar)
  var base = linhasMes.filter(function(l){ return passa(l, true, true); });
  var contaStatus = function(st){ return base.filter(function(l){ return l.status===st; }).length; };

  // colunas da tabela: uma por forma de pagamento, dinheiro primeiro
  var formasCol = (s.formasPagamento||[]).filter(function(f){ return f.k==="dinheiro"; }).concat((s.formasPagamento||[]).filter(function(f){ return f.k!=="dinheiro"; }));
  var somaForma = function(l, k){ return (l.r.pagamentos||[]).filter(function(p){ return p.forma===k; }).reduce(function(t,p){ return t+(p.valor||0); }, 0); };
  var conta = function(f){ return linhas.filter(f).length; };
  var nAtend = linhas.length, nAcertos = conta(function(l){ return l.ac; }), nKitNovo = conta(function(l){ return l.status.indexOf("Kit novo")===0; }), nRepos = conta(function(l){ return l.status==="Reposição"; });
  var somaBase = function(k){ return base.reduce(function(t2,l){ return t2+(l.ac ? (l.r[k]||0) : 0); }, 0); };
  var comTaxa = base.filter(function(l){ return l.tx.taxa>0; }), taxasN = comTaxa.length, taxasNao = comTaxa.filter(function(l){ return !l.tx.paga; }).length, taxasAberto = comTaxa.reduce(function(t2,l){ return t2+l.tx.aberta; }, 0);
  var specsBloco = [
    {k:"at", t:"Atendimentos", ic:"users", cor:"#A78BFA", f:function(l){ return 1; }},
    {k:"kit", t:"Acerto + kit", ic:"check", cor:"#4ADE80", f:function(l){ return l.status.indexOf("Acerto + kit")===0 ? 1 : 0; }},
    {k:"saiu", t:"Acerto + saiu", ic:"x", cor:"#F87171", f:function(l){ return l.status==="Acerto + saiu" ? 1 : 0; }},
    {k:"kn", t:"Kit novo", ic:"novas", cor:"#60A5FA", f:function(l){ return l.status.indexOf("Kit novo")===0 ? 1 : 0; }},
    {k:"conf", t:"Para conferir", ic:"clock", cor:"#FBBF24", f:function(l){ return l.rec.ok ? 0 : 1; }},
    {k:"tx", t:"Taxas não pagas", ic:"caminhao", cor:"#FB923C", f:function(l){ return l.tx.taxa>0 && !l.tx.paga ? 1 : 0; }}].concat(!ver ? [] : [
    {k:"vd", t:"Vendas", ic:"grafico", cor:"#38BDF8", din:true, f:function(l){ return l.ac ? (l.r.vendaLiquida||0) : 0; }},
    {k:"ac", t:"Valor do acerto", ic:"banco", cor:"#A78BFA", din:true, f:function(l){ return l.ac ? l.devido : 0; }},
    {k:"pg", t:"Valor pago", ic:"coins", cor:"#4ADE80", din:true, f:function(l){ return l.ac ? l.pago : 0; }},
    {k:"in", t:"Inadimplente", ic:"registro", cor:"#F87171", din:true, f:function(l){ return l.falta||0; }}]);
  var rankBloco = function(sp){ var m = {}; base.forEach(function(l){ if(l.interno) return; var k = l.r.rep || "—"; m[k] = (m[k]||0)+sp.f(l); });
    return Object.keys(m).map(function(k){ return [k, Math.round(m[k]*100)/100]; }).sort(function(a2,b2){ return b2[1]-a2[1] || a2[0].localeCompare(b2[0]); }); };
  var nConferir = base.filter(function(l){ return !l.rec.ok; }).length, promPend = base.filter(function(l){ return l.promPend; }).length;
  var porRep = {}; base.forEach(function(l){ var k = l.interno ? "Interno · "+(l.r.por||"—") : (l.r.rep||"—"); porRep[k] = (porRep[k]||0)+1; });
  var repsContagem = Object.keys(porRep).sort();
  var maxStatus = Math.max.apply(null, STATUS_LISTA.map(contaStatus).concat([1])), maxRep = Math.max.apply(null, Object.keys(porRep).map(function(k){ return porRep[k]; }).concat([1]));
  var kn = itensComissao(c, s, Date.now()).filter(function(i){ return i.tipo==="kitnovo" && (i.data||"").slice(0,7)===mes; }).sort(function(a,b2){ return b2.ts-a.ts; });

  var pessoasRecebem = BIPADORAS.concat([SUPERVISORA], AGENDAMENTO, FINANCEIRO);
  var usuarioNome = (pessoasRecebem.find(function(x){ return x.id===s.usuario; })||{}).nome || "";   // quem confere é quem está logada (cada uma tem seu login)
  var podeBip = podeBiparRetorno(s, s.usuario, BIPA_RETORNO_PADRAO(), papelDeCons(s.usuario)==="supervisao" || agenda);   // quem bipa (Configurador geral), o agendamento e a diretoria
  var vc = ver || podeBip || agenda;   // valores da linha: quem bipa o retorno e o agendamento precisam deles para conferir o acerto; totais e placar seguem só para quem tem "valores"
  var receber = function(id, patch){ if(!agenda) return d({type:"AVISO", txt:"Só o agendamento e a supervisão conferem os atendimentos"}); d({type:"CONSREP_RECEBER", id:id, patch:patch}); };
  var agora = function(){ return new Date().toISOString(); };
  // relógio: 1º clique começa a conferência, 2º clique termina (grava a data de recebimento); clicar no feito desfaz
  var relogio = function(l){
    var rec = l.rec;
    if(rec.ok){ if(l.an.linhas.some(function(x){ return x.fin; }) || (l.r.fin && l.r.fin.k)) return d({type:"AVISO", txt:"Já tem conciliação do financeiro: não dá para desfazer", tom:"atencao"}); return receber(l.r.id, {ok:false, fimTs:null}); }
    if(!rec.inicioTs) return receber(l.r.id, {inicioTs:agora(), por:s.usuario, quem:usuarioNome});
    if(l.dinTot>0 && !(rec.din && rec.din.ok)) return d({type:"AVISO", txt:"Confirme o dinheiro recebido antes de terminar a conferência", tom:"atencao"});
    if(l.dinTot>0 && !l.repDinOk) return d({type:"AVISO", txt:"Falta a representante confirmar o dinheiro no app dela", tom:"atencao"});
    if((l.r.pagamentos||[]).some(function(p){ return !(p.valor>0); })) return d({type:"AVISO", txt:"Há pagamento com valor zero neste acerto", tom:"atencao"});
    if(l.pago > l.devido + 0.009) return d({type:"AVISO", txt:"O valor recebido é maior que o acerto", tom:"atencao"});
    receber(l.r.id, {ok:true, fimTs:agora(), quem:usuarioNome, por:s.usuario, entrega:isoDia(new Date())});
  };
  var marcarProm = function(l, ligar){ receber(l.r.id, {prom:ligar ? {ok:true, em:agora(), por:s.usuario} : {ok:false}}); };

  var exportar = function(){
    var cab = ["Data do acerto","Hora","Início da conferência","Recebido em","Representante/Interno","Revendedora","Status","Vendas","Taxa","Taxa paga","Comissão %","Valor do acerto","Valor pago","Inadimplente"].concat(formasCol.map(function(f){ return f.label; }),
      ["Condicional assinada","Nº condicionais","Peças","Vendidas","Retornadas","Peças de brinde","Próximo mês","Desc. crédito","Brinde normal","Retirado normal","Brinde select","Retirado select","Excedente","Conferido por"]);
    var rows = linhas.map(function(l){ var r = l.r, rec = l.rec; return [fmtData(r.data), r.hora||"", rec.inicioTs||"", rec.fimTs||"", l.interno ? "Interno · "+(r.por||"") : r.rep, r.rev, l.status,
      l.ac ? r.vendaLiquida : "", l.tx.taxa||"", l.tx.taxa>0 ? (l.tx.paga ? "Sim" : "Não") : "", l.ac ? r.comissaoPct : "", l.ac ? l.devido : "", l.pago, l.falta].concat(formasCol.map(function(f){ return somaForma(l, f.k); }),
      [l.condNec ? (l.condOk ? "Sim" : "Não") : "", (rec.condNums || r.condicionaisSelecionadas || []).join(" "), r.pecasCond||"", r.pecasVendidas||"", r.pecasADevolver==null ? "" : r.pecasADevolver, r.pecasBrinde||"", (r.pecasProxCodigos||[]).length||"",
      r.garantia||"", r.brindeNormal||"", l.brindes.lancadoNormal||"", r.brindeSelect||"", l.brindes.lancadoSelect||"", r.excedenteBrinde||"", rec.quem||""]); });
    var csv = [cab].concat(rows).map(function(row){ return row.map(function(x){ return '"'+String(x==null?"":x).replace(/"/g,'""')+'"'; }).join(";"); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"})); a.download = "consolidado-representantes-"+mes+".csv"; a.click();
  };

  var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };
  // cores das colunas de dinheiro: azul = vendas e acerto, verde = pago, vermelho = inadimplente, e uma cor para cada forma de pagamento
  // cores: só as LETRAS mudam (as barras ficam na cor normal). Vendas azul · comissão amarelo · valor do acerto violeta · pago verde · inadimplente vermelho · cada forma de pagamento com a sua
  var TH_TXT = {azul:"text-sky-300", amarelo:"text-yellow-300", violeta:"text-violet-300", verde:"text-emerald-300", vermelho:"text-red-300", rosa:"text-pink-300", ambar:"text-amber-200", cinza:"text-slate-200",
    dinheiro:"text-emerald-300", pix:"text-teal-300", link:"text-violet-300", credito:"text-orange-300", debito:"text-sky-300", pix_representante:"text-amber-300", acerto_loja:"text-red-300"};
  var TD_COR = {dinheiro:"text-emerald-300", pix:"text-teal-300", link:"text-violet-300", credito:"text-orange-300", debito:"text-sky-300", pix_representante:"text-amber-300", acerto_loja:"text-red-300"};
  var th = function(t, r, cor, estilo){ return e("th",{style:estilo, className:"whitespace-nowrap border-b border-r border-border px-2 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wide last:border-r-0 "+(TH_TXT[cor]||"")}, t); };
  var barra = function(k, span, filho, cor, nivel){ var hex = cor && cor.charAt(0)==="#"; return e("th",{key:k, colSpan:span, style:hex ? {color:cor, background:"linear-gradient(90deg,"+hexA(cor, nivel===2 ? .20 : .28)+","+hexA(cor, nivel===2 ? .05 : .07)+")"} : undefined, className:"whitespace-nowrap border-b border-r border-border/70 px-2 py-1 text-center text-[11px] font-bold uppercase tracking-wider "+(TH_TXT[cor]||"")}, filho); };
  var thConta = function(c2){ var lab = c2.k==="dinheiro" ? ["Dinheiro","confirmar"] : rotuloConta(c2.k, c2.conta);
    return e("th",{title:c2.conta, style:{color:c2.cor, background:hexA(c2.cor, degrade(c2.i, c2.n, .16, .05))}, className:"min-w-[3.4rem] max-w-[5rem] border-b border-r border-border px-1 py-1 text-center text-[9.5px] font-semibold uppercase leading-tight tracking-tight"},
      lab.map(function(x, i){ return e("span",{key:i, className:"block"+(i===0 ? " font-bold" : "")}, x); })); };
  var vazio = function(k, span){ return e("th",{key:k, colSpan:span, className:"border-0 p-0"}); };
  var td = function(v, o){ o = o||{}; return e("td",{style:o.style, className:"whitespace-nowrap border-b border-r border-border/60 px-2 py-1 text-center text-[13px] last:border-r-0 "+(o.r ? MONO : "")+" "+(o.c||"")}, v); };
  var dash = e("span",{className:"text-muted-foreground"},"—");
  var hm = function(ts){ return new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}); };
  var chipStatus = function(t){ return e("span",{className:"rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold "+(t.indexOf("Acerto + kit")===0 ? "bg-success/20 text-success" : t==="Acerto + saiu" ? "bg-destructive/20 text-destructive" : t.indexOf("Kit novo")===0 ? "bg-info/15 text-info" : t==="Reposição" ? "bg-warning/15 text-warning" : "bg-muted"), }, t); };

  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e("div",{className:"flex min-w-0 flex-col gap-1"},
        e("h1",{className:TITULO}, "Consolidado Representante"),
        e("p",{className:"text-[15px] text-muted-foreground"}, "Controle do que entrou: tudo que a representante preenche no app aparece aqui e fica pendente até trazer na empresa e receber o OK")),
      e("div",{className:"flex items-center gap-2"},
        ver && e(Btn,{v:"secondary", ic:"grafico", onClick:function(){ d({type:"ABA", aba:"placar"}); }}, "Placar das representantes"),
        e("select",{value:mes, "aria-label":"Mês", className:SEL, onChange:function(ev){ setMes(ev.target.value); }}, meses.map(function(m){ return e("option",{key:m, value:m}, nomeMes(m)); })),
        ver && e(Btn,{v:"secondary", ic:"arquivo", disabled:!linhas.length, onClick:exportar}, "Exportar CSV"))),
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"}, e("div",{className:"md:col-span-1"}, e(FilaRetornos)), e("p",{className:"self-center rounded-xl bg-black/20 px-3 py-2 text-[12.5px] text-white/85 md:col-span-2"},"O kit entra na fila quando o agendamento dá o OK de recebimento (dinheiro e condicionais). Quem bipa o retorno dá o OK na coluna \"Retorno · bipar\"; a fila grande dispara alerta (30, 40... 100).")),
    e(BlocoErrosBipagem),
    e(PassoAPasso,{aberto:passosAberto, alterna:function(){ setPassosAberto(!passosAberto); }}),
    // resultado do mês até agora: cada bloco mostra o total e as 3 representantes que mais fizeram; clicar abre a lista com TODAS (com barra para correr)
    e("section",{className:"overflow-hidden rounded-2xl bg-black ring-1 ring-[#E8B84B]/40"},
      e("button",{onClick:function(){ setResAberto(!resAberto); }, "aria-expanded":resAberto, className:"flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left", style:{background:"linear-gradient(90deg,#3A2912,#5C4322 55%,#86653A)"}},
        e("span",{className:"inline-flex items-center gap-2 font-heading text-[15px] font-bold uppercase tracking-widest text-[#F1E4C6]"}, e(Icon,{n:resAberto ? "chevrondown" : "chevron", s:15}), "Resultado de "+nomeMes(mes)+" até agora"+(repF!=="todas" ? " · "+repF : "")+(b!=="" ? " · "+busca : "")),
        e("span",{className:"text-[12px] text-[#F1E4C6]"}, resAberto ? "fechar" : "abrir")),
      resAberto && e("div",{className:"flex flex-col gap-2 p-3"},
      e("div",{className:"grid grid-cols-2 gap-2 xl:grid-cols-5"}, specsBloco.map(function(sp){ var rk = rankBloco(sp), tot = rk.reduce(function(t2,x){ return t2+x[1]; }, 0);
        return e(BlocoRep,{key:sp.k, sp:sp, total:sp.din ? BK(tot) : tot, rank:rk.map(function(x){ return [x[0], sp.din ? BK(x[1]) : x[1]]; }), aberto:bl===sp.k, onClick:function(){ setBl(bl===sp.k ? null : sp.k); }}); })),
      bl && (function(){ var sp = specsBloco.find(function(x){ return x.k===bl; }), rk = rankBloco(sp), max = Math.max.apply(null, rk.map(function(x){ return x[1]; }).concat([1]));
        return e("section",{className:"overflow-hidden rounded-2xl bg-black ring-1 ring-[#E8B84B]/40"},
          e("div",{className:"flex items-center justify-between gap-2 px-4 py-2", style:{background:"linear-gradient(90deg,#3A2912,#5C4322 55%,#86653A)"}},
            e("b",{className:"font-heading text-[14px] text-[#F1E4C6]"}, sp.t+" por representante · "+rk.length), e("button",{onClick:function(){ setBl(null); }, "aria-label":"Fechar lista", className:"grid size-6 place-items-center rounded-full bg-[#E8B84B] text-[#1B1409]"}, e(Icon,{n:"fechar", s:12}))),
          e("div",{className:"max-h-[21rem] overflow-y-auto"}, rk.map(function(x, i){
            return e("button",{key:x[0], onClick:function(){ setRepF(x[0]); setBl(null); }, title:"Filtrar a tabela por "+x[0], className:"grid w-full grid-cols-[1.6rem_minmax(7rem,12rem)_minmax(0,1fr)_6.5rem] items-center gap-2 border-t border-white/5 px-4 py-1.5 text-left hover:bg-white/5"},
              e("span",{className:MONO+" text-[11px] text-[#9A8B63]"}, i+1), e("span",{className:"truncate text-[13px] font-semibold text-[#F1E4C6]"}, x[0]),
              e("span",{className:"h-2.5 overflow-hidden rounded bg-white/10"}, e("span",{className:"block h-full rounded", style:{width:Math.max(x[1]>0 ? 3 : 0, x[1]/max*100)+"%", background:sp.cor}})),
              e("b",{className:MONO+" text-right text-[13px]", style:{color:sp.cor}}, sp.din ? BK(x[1]) : x[1])); })),
          e("p",{className:"border-t border-white/10 px-4 py-1.5 text-[11px] text-[#9A8B63]"},"Clique numa representante para filtrar a tabela."));
      })())),
    // kits novos entregues: o termo assinado vem do app; sem ele, o agendamento marca aqui quando conferir o papel
    kn.length>0 && e("section",{className:"overflow-hidden rounded-xl bg-black ring-1 ring-[#E8B84B]/25"},
      e("button",{onClick:function(){ setKnAberto(!knAberto); }, "aria-expanded":knAberto, className:"flex w-full items-center justify-between gap-2 px-4 py-2 text-left"},
        e("span",{className:"inline-flex items-center gap-2 font-heading text-[14px] font-bold"}, e(Icon,{n:knAberto ? "chevrondown" : "chevron", s:15}), "Kits novos · termo assinado", e("span",{className:"rounded-md bg-muted px-1.5 text-[12px] font-semibold"}, kn.length), kn.some(function(k){ return !k.termoOk; }) && e("span",{className:"rounded-md bg-warning/15 px-1.5 text-[12px] font-semibold text-warning"},"falta termo")),
        e("span",{className:"text-[12px] text-muted-foreground"},"a comissão do kit novo só vale com o termo assinado")),
      knAberto && e("div",{className:"overflow-x-auto border-t border-border"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, th("Data"), th("Representante"), th("Revendedora"), th("Status"), th("Termo assinado"))),
        e("tbody",null, kn.map(function(k){ return e("tr",{key:k.id, className:"border-b border-border last:border-0"},
          td(fmtData(k.data)), td(k.rep,{c:"font-semibold"}), td(k.rev), td(chipStatus(k.status)),
          td(k.termoAuto ? e("span",{className:"rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-semibold text-success"},"Assinado no app")
            : e("label",{className:"flex cursor-pointer items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:!!k.termoManual, disabled:!agenda, className:"size-5",
                onChange:function(ev){ d({type:"COMIS_TERMO", id:k.r.id, ok:ev.target.checked, por:s.usuario}); }}), k.termoManual ? "Conferido por "+nomeDe(k.termoManual.por) : "Marcar termo assinado"))); }))))),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("select",{value:repF, "aria-label":"Representante", className:SEL, onChange:function(ev){ setRepF(ev.target.value); }},
        e("option",{value:"todas"},"Todas as representantes"), quemLista.map(function(q){ return e("option",{key:q, value:q}, q); })),
      e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
        e("input",{className:INPUT+" h-10! w-64 pl-9 text-sm!", placeholder:"Revendedora", list:"consrep-revendedoras", value:busca, onChange:function(ev){ setBusca(ev.target.value); }}),
        e("datalist",{id:"consrep-revendedoras"}, linhasMes.map(function(l){ return l.r.rev; }).filter(function(x,i,a2){ return x && a2.indexOf(x)===i; }).sort().map(function(n){ return e("option",{key:n, value:n}); }))),
      e("span",{className:"ml-auto text-[13px] text-muted-foreground"}, nAtend+(nAtend===1 ? " atendimento" : " atendimentos")+((b!=="" && linhas.length>0 && linhas.every(function(l){ return l.r.rev===linhas[0].r.rev; })) ? " · só os pagamentos preenchidos" : ""))),
    linhas.length===0
      ? e("p",{className:"rounded-xl border border-dashed border-border p-10 text-center text-[14px] text-muted-foreground"},"Nada em "+nomeMes(mes)+" com esse filtro. Quando uma representante ou o atendimento interno preencher no app, aparece aqui.")
      : (function(){
        // ───────── estilo das barras: o mesmo bronze em degradê da tela de Comissões; a cor do grupo aparece só no friso de baixo ─────────
        var BRONZE = "linear-gradient(90deg,#3A2912,#5C4322 55%,#86653A)", BRONZE2 = "linear-gradient(90deg,#2E2315,#46361F 60%,#5E4A2B)", NOMES_BG = "#231B10", CREME = "#F1E4C6";
        var luz = "inset 0 1px 0 rgba(255,255,255,.12)";
        var lado = function(cor, esq, dir){ var o = {}; if(cor && esq) o.borderLeft = "4px solid "+cor; if(cor && dir) o.borderRight = "4px solid "+cor; return o; };   // barra de cor vertical que separa os blocos, de cima a baixo
        var bar1 = function(k, span, rows, filho, acento, tam, lados){ return e("th",{key:k, colSpan:span, rowSpan:rows||1, style:Object.assign({background:BRONZE, color:CREME, boxShadow:luz, borderBottom:acento ? "3px solid "+acento : undefined}, lados ? lado(acento, true, true) : {}),
          className:"whitespace-nowrap border-r border-black/40 px-2 py-1.5 text-center font-heading font-bold uppercase tracking-widest "+(tam||"text-[15px]")}, filho); };
        var bar2 = function(k, span, rows, filho, acento, esq, dir){ return e("th",{key:k, colSpan:span, rowSpan:rows||1, style:Object.assign({background:BRONZE2, color:CREME, boxShadow:luz, borderBottom:acento ? "2px solid "+acento : undefined}, lado(acento, esq, dir)),
          className:"whitespace-nowrap border-r border-black/40 px-1.5 py-1 text-center text-[12.5px] font-bold uppercase tracking-wider"}, filho); };
        var nome = function(k, rows, filho, cls){ return e("th",{key:k, rowSpan:rows||1, style:{background:NOMES_BG}, className:"whitespace-nowrap border-r border-black/40 px-2 py-1 text-center text-[12.5px] font-semibold uppercase tracking-wide "+(TH_TXT[cls]||"")}, filho); };
        var nomeBanco = function(c2){ return e("th",{key:c2.k+c2.conta, title:c2.conta, style:Object.assign({background:NOMES_BG, color:CREME}, lado(c2.cor, c2.ini, c2.fim)), className:"min-w-[3.6rem] max-w-[5.5rem] border-r border-black/40 px-1 py-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-tight"}, rotuloConta(c2.k, c2.conta)[0]); };
        var seta = function(aberto, onClick, rotulo){ return e("button",{onClick:onClick, "aria-expanded":aberto, "aria-label":rotulo, title:rotulo, className:"grid size-6 shrink-0 place-items-center rounded-full bg-[#E8B84B] text-[#1B1409] shadow ring-1 ring-black/30 hover:brightness-110"}, e(Icon,{n:aberto ? "chevrondown" : "chevron", s:13})); };
        var seta2 = function(aberto, onClick, rotulo){ return revUnica ? null : seta(aberto, onClick, rotulo); };   // com uma revendedora escolhida não há abrir/fechar: já mostra tudo
        var duas = function(a2, b2){ return e("span",{className:"flex flex-col leading-tight"}, e("span",null,a2), e("span",{className:"text-[9.5px] font-semibold opacity-90"}, b2)); };

        // ───────── colunas de pagamento: CNPJs → Sem faturamento (inclui o dinheiro) → Família; no fim Pix representante e Acerto com loja (cada um UMA coluna) ─────────
        var revUnica = b!=="" && linhas.length>0 && linhas.every(function(l){ return l.r.rev===linhas[0].r.rev; });   // uma revendedora só: mostra só o que está preenchido
        var pagAbertoX = pagAberto || revUnica, pecasAbertoX = pecasAberto || revUnica;
        var somaConta = function(r, k, conta){ return (r.pagamentos||[]).filter(function(pg){ return pg.forma===k && (conta==null || pg.descricao===conta); }).reduce(function(t2,pg){ return t2+pg.valor; }, 0); };
        var usa = function(k, cn){ return !revUnica || linhas.some(function(l){ return somaConta(l.r, k, cn)>0; }); };
        var formasOrd = formasCol.filter(function(f){ return f.k!=="pix_representante" && f.k!=="acerto_loja" && f.k!=="dinheiro"; });   // o dinheiro tem coluna própria no começo de Pagamentos
        var estr = GRUPOS_CONTA.map(function(g){
          var formas = formasOrd.map(function(f){ return {k:f.k, label:f.label, contas:(f.descricoes||[]).filter(function(cn){ return grupoDaConta(cn)===g.id && usa(f.k, cn); })}; }).filter(function(f){ return f.contas.length>0; });
          return {g:g, formas:formas, n:formas.reduce(function(t2,f){ return t2+f.contas.length; }, 0)}; }).filter(function(x){ return x.n>0; });
        var colsPag = []; estr.forEach(function(x){ var pos = 0; x.formas.forEach(function(f){ f.a = pos; pos += f.contas.length; f.contas.forEach(function(cn, i2){ var idx = f.a+i2; colsPag.push({k:f.k, conta:cn, cor:x.g.cor, ini:idx===0, fim:idx===x.n-1}); }); }); });
        var fimCols = [{k:"pix_representante", l1:"Pix", l2:"representante", cor:"#F59E0B"}, {k:"acerto_loja", l1:"Acerto", l2:"com loja", cor:"#F87171"}]
          .filter(function(c2){ return formasCol.some(function(f){ return f.k===c2.k && (f.descricoes||[]).length>0; }) && usa(c2.k, null); });
        var nPag = colsPag.length + fimCols.length; if(nPag===0) pagAbertoX = false;
        var lancadosDe = function(r){ return r.brindesLancados || (r.formSnapshot||{}).brindes || []; };
        var contaCat = function(r, cat){ return lancadosDe(r).filter(function(b){ return b.cat===cat; }).length; };
        var nPecas = 12;
        var ncolsTot = 7 + 10 + 2 + (pagAbertoX ? nPag : 0) + (pecasAbertoX ? nPecas : 1) + 2;

        // ───────── cabeçalho em 4 linhas (sem linha vaga: os nomes sem subnível ocupam várias linhas) ─────────
        // Pagamentos: UMA barra só, com a palavra escrita 3 vezes dentro; Inadimplente e Dinheiro ficam sempre abertos no começo
        var tresVezes = function(){ return e("span",{className:"flex w-full items-center justify-around gap-6"},
          [0,1,2].map(function(i){ return e("span",{key:i, className:"inline-flex items-center gap-2"}, i===0 && seta2(true, function(){ setPagAberto(false); }, "Fechar pagamentos"), "Pagamentos"); })); };
        var linha1 = [
          bar1("a", 8, 1, "Agendamento · conferência", "#E8B84B", "text-[15px]"),
          bar1("v", 10, 1, "Vendas", "#38BDF8", "text-[15px]"),
          pagAbertoX ? bar1("p", 2+nPag, 1, tresVezes(), "#A8A29E", "text-[16px]")
                    : bar1("p", 2, 1, e("span",{className:"inline-flex items-center gap-2"}, seta2(false, function(){ setPagAberto(true); }, "Abrir pagamentos"), "Pagamentos"), "#A8A29E", "text-[15px]"),
          pecasAbertoX ? bar1("e", nPecas, 1, e("span",{className:"inline-flex items-center gap-2"}, seta2(true, function(){ setPecasAberto(false); }, "Fechar peças e brindes"), "Peças e brindes"), "#A8A29E", "text-[15px]")
                      : bar1("e", 1, 4, e("span",{className:"inline-flex items-center gap-2"}, seta2(false, function(){ setPecasAberto(true); }, "Abrir peças e brindes"), "Peças e brindes"), "#A8A29E", "text-[14px]"),
          bar1("br", 2, 1, "Conferir peças", "#F472B6", "text-[15px]")];
        var linha2 = [
          nome("n0", 3, e(Icon,{n:"clock", s:15})), nome("n1", 3, "Acerto"), nome("n3", 3, "Recebido"), nome("n4", 3, "Representante"), nome("n5", 3, "Revendedora"), nome("n6", 3, "Status"),
          nome("n8", 3, "Condicional · assinatura", "ambar"),
          nome("rt", 3, "Retorno · bipar", "verde"),
          nome("v0", 3, "Desc. crédito", "rosa"), nome("v1", 3, "Vendas", "azul"), nome("v2", 3, "Comissão", "amarelo"), nome("v3", 3, "Valor do acerto", "violeta"), nome("vt", 3, "Taxa", "azul"), nome("vx", 3, "Brinde a mais", "vermelho"), nome("vg", 3, "Tags", "vermelho"), nome("vT", 3, "Total a pagar", "violeta"), nome("v4", 3, "Valor pago", "verde"), nome("v6", 3, "Multa (app)", "vermelho"),
          nome("v5", 3, "Inadimplente", "vermelho"), nome("n7", 3, "Dinheiro · confirmar", "dinheiro"),
          pagAbertoX && estr.map(function(x){ return bar1("g"+x.g.id, x.n, 1, x.g.nome, x.g.cor, "text-[13px]", true); }),
          pagAbertoX && fimCols.map(function(c2){ return bar2("f"+c2.k, 1, 3, duas(c2.l1, c2.l2), c2.cor, true, true); }),
          pecasAbertoX && [bar1("pc", 7, 1, "Peças", "#94A3B8", "text-[13px]"), bar1("bc", 5, 1, "Brindes", "#F472B6", "text-[13px]")],
          nome("c1", 3, "Brindes · trocas", "rosa"), nome("c3", 3, "Próx. mês", "verde")];
        var linha3 = [
          pagAbertoX && estr.map(function(x){ return x.formas.map(function(f){ var esq = f.a===0, dir = f.a+f.contas.length===x.n; return f.k==="dinheiro" ? bar2("d"+x.g.id, 1, 2, "Dinheiro", x.g.cor, esq, dir) : bar2("fm"+x.g.id+f.k, f.contas.length, 1, f.label, x.g.cor, esq, dir); }); }),
          pecasAbertoX && [nome("e1", 2, "Total"), nome("e2", 2, "Vendidas"), nome("e3", 2, "Trocas"), bar2("eb", 2, 1, "Brindes", "#F472B6"), nome("e4", 2, "Próx. mês"), nome("e5", 2, "Retornadas"),
            nome("b1", 2, "Normal R$", "rosa"), nome("b2", 2, "BB R$", "rosa"), nome("b3", 2, "Retirado normal", "rosa"), nome("b4", 2, "Retirado select", "rosa"), nome("b5", 2, "Excedente", "rosa")]];
        var linha4 = [
          pagAbertoX && estr.map(function(x){ return x.formas.map(function(f){ return f.k==="dinheiro" ? null : f.contas.map(function(cn, i2){ var idx = f.a+i2; return nomeBanco({k:f.k, conta:cn, cor:x.g.cor, ini:idx===0, fim:idx===x.n-1}); }); }); }),
          pecasAbertoX && [nome("q1", 1, "Normal"), nome("q2", 1, "BB")]];

        return e(React.Fragment,null, e("div",{className:"cursor-grab overflow-x-auto rounded-xl border border-border bg-card", onMouseDown:iniciaArrasto, title:"Clique no meio da tabela, segure e arraste para o lado"},
          e("table",{className:"w-full min-w-max border-separate border-spacing-0"},
            e("thead",{className:"sticky top-0"}, e("tr",null, linha1), e("tr",null, linha2), e("tr",null, linha3), e("tr",null, linha4)),
            e("tbody",null,
              linhas.map(function(l){ var r = l.r, rec = l.rec, ac = l.ac, x = l.tx, saiu = r.tipoKit==="saiu";
                var multaPct = ac ? ((r.descontoRemarcacao||{}).comissaoPct||0)+(r.atrasoPct||0) : 0;
                var cel = function(v, o){ return td(v, Object.assign({r:true, c:"px-1! text-[12px]!"}, o||{})); };
                var trPrincipal = e("tr",{key:"p", className:"border-b border-border/60 hover:bg-muted/30 "+(rec.ok ? "bg-amber-200/10" : "")},
                  // ── Agendamento: conferência, representante/revendedora, dinheiro e condicional ──
                  td(e(Relogio,{l:l, agenda:agenda, onClick:function(){ relogio(l); }})),
                  td(e("span",{className:"flex flex-col leading-tight"}, e("span",{className:"text-[11.5px] font-semibold"}, fmtData(r.data).slice(0,5)), e("span",{className:"text-[10px] text-muted-foreground"}, r.hora||"—"))),
                  td(rec.fimTs ? e("span",{className:"flex items-center justify-center gap-2"}, e("span",{className:"flex flex-col leading-tight"}, e("span",{className:"text-[11.5px]"}, hmd(rec.fimTs)), e("span",{className:"text-[10px] text-muted-foreground"}, hm(rec.fimTs))),
                      e("span",{title:"Tempo entre o atendimento e o recebimento", className:"rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold "+(diasDepois(r.data, rec.fimTs)>0 ? "text-warning" : "")}, tempoEntre(r, rec.fimTs))) : dash),
                  td(l.interno ? e("span",{className:"rounded-md bg-info/15 px-1.5 py-0.5 text-[12px] font-semibold text-info"},"Interno · "+(r.por||"—")) : (r.rep||"—")),
                  td(e("span",{className:"font-semibold"}, r.rev)), td(chipStatus(l.status)),
                  td(l.repos || saiu ? dash : e(CelCond,{l:l, agenda:agenda, usuario:s.usuario, onSet:function(patch){ receber(r.id, patch); }})),
                  // ── Retorno: o agendamento já recebeu (OK) → quem bipa dá o OK aqui; sai da fila ──
                  td(l.interno ? dash : !rec.ok ? e("span",{className:"text-[11px] text-muted-foreground", title:"Falta o OK de recebimento do agendamento"},"aguarda recebimento")
                    : rec.bip ? e("button",{onClick:function(){ if(podeBip) d({type:"RETORNO_BIPAR", id:r.id, desfazer:true}); }, title:podeBip ? "Toque para desfazer" : "", className:"flex flex-col items-center leading-tight text-success"},
                        e("span",{className:"text-[11.5px] font-bold"},"✓ "+rec.bip.por), e("span",{className:"text-[10px] text-muted-foreground"}, hm(rec.bip.ts)))
                    : podeBip ? e("button",{onClick:function(){ d({type:"RETORNO_BIPAR", id:r.id, por:nomeDe(s.usuario), porId:s.usuario}); }, className:"rounded-md bg-success/20 px-2 py-1 text-[11.5px] font-bold text-success hover:bg-success/30"},"Bipei")
                    : e("span",{className:"text-[11px] font-semibold text-warning"},"falta bipar")),
                  // ── Vendas ──
                  td(vc && ac && r.garantia>0 ? BK(r.garantia) : dash,{r:true}),   // o desconto de crédito já diminui o valor da venda ao lado
                  td(vc && ac ? BK(r.vendaLiquida) : dash,{r:true, c:"font-semibold text-sky-300"}),
                  td(vc && ac ? r.comissaoPct+"%" : dash,{r:true, c:"font-semibold text-yellow-300"}),
                  td(vc && ac ? BK(r.valorAcerto||0) : dash,{r:true, c:"text-violet-300 font-semibold"}),
                  td(vc && x.taxa>0 ? e("span",{className:"flex flex-col leading-tight"}, e("span",{className:"font-semibold"}, BK(x.taxa)), e("span",{className:"text-[10.5px] font-semibold "+(x.paga ? "text-emerald-400" : "text-red-400")}, x.paga ? "paga ✓" : "não paga")) : dash,{r:true}),
                  td(vc && ac && r.excedenteBrinde>0 ? BK(r.excedenteBrinde) : dash,{r:true, c:"text-red-400 font-semibold"}),
                  td(vc && ac && r.tagsValor>0 ? BK(r.tagsValor) : dash,{r:true, c:"text-red-400 font-semibold"}),
                  td(vc && ac ? BK(l.devido) : dash,{r:true, c:"text-violet-300 font-bold", style:undefined}), td(vc && ac ? BK(l.pago) : dash,{r:true, c:"text-emerald-400 font-bold"}),
                  td(vc ? e(CelMulta,{r:r, pct:multaPct, falta:l.falta}) : dash),
                  // ── Pagamentos: Inadimplente e Dinheiro (confirmar) sempre abertos no começo, depois as contas ──
                  td(vc && l.falta>0.009 ? BK(l.falta) : dash,{r:true, c:l.falta>0.009 ? "text-red-400 font-bold" : ""}),
                  td(e(CelDinheiro,{l:l, agenda:agenda, onOk:function(contado){ receber(r.id, {din:{ok:true, contado:contado, ts:agora(), por:s.usuario}}); }, onDesfaz:function(){ receber(r.id, {din:{ok:false}}); }}),{r:true}),
                  pagAbertoX && [
                    colsPag.map(function(c2){ var v = somaConta(r, c2.k, c2.conta); return e(React.Fragment,{key:c2.k+c2.conta}, cel(vc && v>0 ? BK(v) : dash, {c:(v>0 ? "font-semibold " : "")+"px-1! text-[12px]!", style:lado(c2.cor, c2.ini, c2.fim)})); }),
                    fimCols.map(function(c2){ var v = somaConta(r, c2.k, null); return e(React.Fragment,{key:c2.k}, cel(vc && v>0 ? BK(v) : dash, {c:(v>0 ? "font-semibold " : "")+"px-1! text-[12px]!", style:lado(c2.cor, true, true)})); })
                  ],
                  // ── Peças e brindes (setor de bipagem de retorno) ──
                  pecasAbertoX ? [
                    cel(r.pecasCond||dash), cel(r.pecasVendidas||dash), cel(r.pecasTrocas||dash), cel(contaCat(r,"normal")||dash), cel(contaCat(r,"bb")||dash),
                    cel(ac && r.pecasProxLiberadas>0 ? (r.pecasProxCodigos||[]).length+"/"+r.pecasProxLiberadas : dash), cel(r.pecasADevolver==null ? dash : r.pecasADevolver),
                    cel(vc && ac ? BK(r.brindeNormal||0) : dash), cel(vc && ac ? BK(r.brindeSelect||0) : dash),
                    cel(vc && ac && l.brindes.lancadoNormal>0 ? BK(l.brindes.lancadoNormal) : dash), cel(vc && ac && l.brindes.lancadoSelect>0 ? BK(l.brindes.lancadoSelect) : dash),
                    cel(vc && r.excedenteBrinde>0 ? BK(r.excedenteBrinde) : dash, {c:"text-warning px-1! text-[12px]!"})
                  ] : td(""),
                  // ── Brindes (no final): abre o pop-up com os brindes e as peças do próximo mês ──
                  (function(){ var lista = lancadosDe(r), okp = rec.pecasOk||{}, nTr = (r.trocas||[]).length || r.pecasTrocas || 0,
                      tem = lista.length+nTr>0, todasOk = lista.length>0 && lista.every(function(b2){ return okp[b2.codigo]; });
                    return td(!ac || !tem ? dash : e("button",{onClick:function(){ setPopId(r.id); }, "aria-label":"Abrir brindes e trocas", title:"Abrir brindes e trocas", className:"inline-grid size-8 place-items-center rounded-md border "+(todasOk ? "border-success/50 bg-success/15 text-success" : "border-pink-400/50 bg-pink-400/10 text-pink-300")}, e(Icon,{n:"lista", s:16}))); })(),
                  // Peças do próximo mês: botão só quando tem peça; quem bipa o retorno gera a condicional nova e coloca o número (sem número fica pendente)
                  (function(){ var prox = r.pecasProxCodigos||[], nova = rec.condNova;
                    return td(!ac || prox.length===0 ? dash : e("button",{onClick:function(){ setPopId(r.id); }, "aria-label":"Abrir peças do próximo mês", title:nova ? "Condicional nova "+nova.numero : "Falta gerar a condicional nova", className:"inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] font-bold "+(nova ? "border-success/50 bg-success/15 text-success" : "border-warning/60 bg-warning/15 text-warning")}, e(Icon,{n:nova ? "check" : "clock", s:14}), nova ? nova.numero : "Pendente")); })()
                );
                return e(React.Fragment,{key:r.id}, trPrincipal);
              })))),
          // pop-up grande por cima de tudo: brindes e peças do próximo mês do atendimento escolhido (não abre a tabela)
          popId && (function(){ var lp = linhasMes.find(function(x){ return x.r.id===popId; }); if(!lp) return null;
            return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) setPopId(null); }},
              e("div",{role:"dialog", "aria-label":"Brindes e peças", className:"flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-[#14110B] ring-1 ring-[#E8B84B]/50 shadow-2xl"},
                e("div",{className:"flex items-center justify-between gap-3 px-5 py-3", style:{background:"linear-gradient(90deg,#3A2912,#5C4322 55%,#86653A)"}},
                  e("div",{className:"min-w-0"}, e("b",{className:"block font-heading text-[16px] text-[#F1E4C6]"}, "Brindes · Trocas · Próximo mês"), e("span",{className:"block truncate text-[12.5px] text-[#F1E4C6]"}, lp.r.rev+" · "+(lp.r.rep||"—")+" · "+fmtData(lp.r.data))),
                  e("button",{onClick:function(){ setPopId(null); }, "aria-label":"Fechar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#E8B84B] text-[#1B1409]"}, e(Icon,{n:"fechar", s:14}))),
                e("div",{className:"overflow-y-auto p-4"}, e(PecasMini,{l:lp, agenda:agenda, receber:receber, todos:todos, usuario:s.usuario, podeProx:podeBipRetorno(s.usuario)}))));
          })()); })());
}

export { AbaConsolidadoRep };
