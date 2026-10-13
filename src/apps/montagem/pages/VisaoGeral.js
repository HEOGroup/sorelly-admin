// Sorelly Admin · montagem e bipagem — pages/VisaoGeral.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois com o gráfico ganhando o mesmo seletor de janela (7 a 90 dias,
// mês atual ou história completa) e projeção da Previsão de faturamento, em vez de mostrar sempre o ano corrente fixo.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { COR_NIVEL, NIVEIS, corDaFila, nivelDe, porDia, qtdFila } from "@/apps/montagem/domain/retornos";
import { BlocoInternoHoje, resumoInterno } from "@/apps/montagem/components/interno-resumo";
import { TabelaCrescimento } from "@/apps/montagem/components/tabela-crescimento";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { JANELAS_GRAFICO_REV, MESES_LONGO, pontosRevendedoras, projetarAno, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { comprasDoMes, inadDoMes } from "@/apps/montagem/domain/inadimplencia-fin";
import { resumoFinanceiro, tabelaMeses } from "@/apps/montagem/domain/resumo-financeiro";
import { cnpjsDe, fiscalAtual, indicadoresFiscais, projecaoCnpj } from "@/apps/montagem/domain/cnpjs";
import { resumoPessoas } from "@/apps/montagem/domain/pessoas";
import { statusLinhaFin, contasDefinidas, contasEnviadas } from "@/apps/montagem/domain/atendimento-interno";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { podeConferirPag, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { formasPagamentoPadrao } from "@/apps/montagem/domain/consignado";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

// ── Pagamentos do atendimento interno para conferir: a diretoria e a Ana Maria definem a conta de cada pagamento, esperam o comprovante e confirmam ──
var hm = function(ts){ var n = new Date(ts); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
function PagamentosAConferir(p){
  var cx = use(), s = cx.state, d = cx.dispatch, quem = nomeDe(s.usuario);
  var formas = (s.formasPagamento || formasPagamentoPadrao()).filter(function(f){ return f.k!=="pix_representante"; });
  var formaDe = function(k){ return formas.find(function(f){ return f.k===k; }) || {k:k, label:k, descricoes:[]}; };
  var lista = s.lancFin || [], pend = lista.filter(function(x){ return !x.conferido; }), feitos = lista.filter(function(x){ return x.conferido; });
  var CP = INPUT+" h-9! w-full text-[13px]!";
  // etapas do ponto de vista do financeiro: definir contas → OK, enviar ao atendimento → (atendimento anexa) → confirmar
  var SK = {definir:["Definir as contas","#F59E0B"], enviar:["Pronto: enviar ao atendimento","#A78BFA"], enviado:["Enviado ao atendimento","#38BDF8"], recebido:["Comprovante recebido","#38BDF8"], ok:["✓ Conferido","#22C55E"], isento:["Isento","#9CA3AF"]};
  var etapaFin = function(l){
    if(l.isento) return "isento";
    if(!contasDefinidas(l)) return "definir";
    if(statusLinhaFin(l)==="ok") return "ok";
    if(!contasEnviadas(l)) return "enviar";
    return (l.partes||[]).every(function(q){ return q.comprovante; }) ? "recebido" : "enviado";
  };
  // todas as formas de pagamento com todas as contas (a da própria linha vem primeiro)
  var opcoesContas = function(forma){ var ordem = formas.filter(function(fm){ return fm.k===forma; }).concat(formas.filter(function(fm){ return fm.k!==forma; }));
    return ordem.map(function(fm){ return e("optgroup",{key:fm.k, label:fm.label}, (fm.descricoes||[]).map(function(c){ return e("option",{key:fm.k+c, value:c}, c); })); }); };
  // uma linha enviada (ex.: Pix R$ 7.000) pode ser dividida em várias contas; o comprovante quem anexa é a funcionária que bipa
  var linha = function(x, l, i){
    var sk = etapaFin(l), brinde = l.tipo==="brinde", ps = l.partes || [];
    var soma = ps.reduce(function(t,q){ return t+(q.valor||0); }, 0), difere = Math.abs(soma-l.valor)>0.009;
    var linhaPatch = function(pt){ d({type:"FIN_LINHA", id:x.id, i:i, patch:pt, por:quem}); };
    // mexer nas contas (trocar, mudar valor, dividir, remover) cancela o envio: precisa de novo OK; confirmar/desfazer não mexe no envio
    var partePatch = function(j, pt){ var mexeu = !("ok" in pt); linhaPatch(Object.assign({partes:ps.map(function(q,k){ return k===j ? Object.assign({}, q, pt) : q; })}, mexeu ? {enviada:false} : {})); };
    return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-lg bg-black/20 px-3 py-2 text-left text-[13px]"},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"},
        e("b",{className:"text-[14px]"}, brinde ? "Diferença do brinde" : formaDe(l.forma).label), e("b",{className:MONO+" text-[15px] text-primary"}, BK(l.valor)),
        e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold", style:{background:SK[sk][1]+"26", color:SK[sk][1]}}, SK[sk][0]),
        brinde && sk!=="ok" && e(Btn,{v:l.isento ? "secondary" : "ghost", sm:true, onClick:function(){ linhaPatch({isento:!l.isento}); }}, l.isento ? "Desfazer isenção" : "Isentar")),
      !l.isento && ps.map(function(q,j){ var fechado = q.ok;
        // cada conta é um cartãozinho em coluna (conta · valor + comprovante · ação), pra nunca estourar a largura do bloco
        return e("div",{key:j, className:"flex min-w-0 flex-col gap-1.5 rounded-lg bg-black/20 p-2"},
          e("select",{value:q.descricao||"", disabled:fechado, "aria-label":"Conta de entrada", className:CP, onChange:function(ev){ partePatch(j, {descricao:ev.target.value}); }},
            e("option",{value:""},"Definir a conta…"), opcoesContas(l.forma || (formas[0] && formas[0].k))),
          e("div",{className:"flex min-w-0 items-center gap-2"},
            e("div",{className:"w-36 shrink-0"}, e(CampoDinheiro,{value:q.valor, disabled:fechado, label:"Valor desta conta", className:CP+" font-mono", onChange:function(v){ partePatch(j, {valor:v||0}); }})),
            e("span",{className:"min-w-0 text-[12px] leading-tight"}, q.comprovante ? e("a",{href:q.comprovante.url, target:"_blank", rel:"noreferrer", className:"font-semibold text-primary underline"},"Ver comprovante") : null)),
          e("span",{className:"flex flex-wrap items-center gap-1.5"},
            fechado ? e(React.Fragment,null, e("span",{className:"font-bold text-success"},"✓ Conferido"), e("button",{onClick:function(){ partePatch(j, {ok:false}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/15"},"Desfazer"))
            : e(React.Fragment,null,
                e(Btn,{v:"primary", sm:true, ic:"check", disabled:!(x.finalizado && q.descricao && q.comprovante && q.valor>0 && !difere), onClick:function(){ partePatch(j, {ok:true}); }}, "Confirmar"),
                ps.length>1 && e("button",{onClick:function(){ linhaPatch({partes:ps.filter(function(z,k){ return k!==j; }), enviada:false}); }, "aria-label":"Remover esta conta", className:"grid size-7 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"},"×"))));
      }),
      !l.isento && sk!=="ok" && e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"},
        e(Btn,{v:"ghost", sm:true, onClick:function(){ linhaPatch({partes:ps.concat([{descricao:"", valor:Math.max(0, Math.round((l.valor-soma)*100)/100), comprovante:null, ok:false}]), enviada:false}); }}, "+ Dividir em outra conta"),
        e("b",{className:MONO+" text-[12.5px] "+(difere ? "text-destructive" : "text-success")}, "Soma "+BK(soma)+" / "+BK(l.valor)),
        // contas definidas e somando certo: o financeiro dá o OK e as contas seguem para o atendimento anexar os comprovantes
        sk==="enviar" && e(Btn,{v:"primary", sm:true, ic:"check", onClick:function(){ linhaPatch({enviada:true}); }}, "OK, enviar ao atendimento")));
  };
  // cada acerto é um dropdown fechado (resumo na linha); clica para abrir e definir as contas
  var card = function(x, aberto){
    var nDef = x.linhas.filter(function(l){ return etapaFin(l)==="definir"; }).length, nEnv = x.linhas.filter(function(l){ return etapaFin(l)==="enviar"; }).length;
    var nCmp = x.linhas.filter(function(l){ return etapaFin(l)==="enviado"; }).length;
    var total = x.linhas.reduce(function(t,l){ return l.isento ? t : t+l.valor; },0);
    return e("details",{key:x.id, open:aberto || undefined, className:"group rounded-xl ring-1 ring-[#E8B84B]/30", style:{background:"#E8B84B10"}},
      e("summary",{className:"flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 [&::-webkit-details-marker]:hidden"},
        e("span",{className:"text-primary transition-transform group-open:rotate-90"},"▶"), e("b",{className:"text-[14px]"}, x.nome), e("span",{className:"text-[12px] text-muted-foreground"},"enviado às "+hm(x.enviadoTs)+(x.por ? " por "+x.por : "")),
        nDef>0 && e("span",{className:"rounded-md bg-warning/20 px-2 py-0.5 text-[11.5px] font-bold text-warning"}, nDef+(nDef===1 ? " forma sem conta" : " formas sem conta")),
        nEnv>0 && e("span",{className:"rounded-md bg-primary/20 px-2 py-0.5 text-[11.5px] font-bold text-primary"}, "falta enviar ao atendimento"),
        nCmp>0 && e("span",{className:"rounded-md bg-info/20 px-2 py-0.5 text-[11.5px] font-bold text-info"}, "com o atendimento"),
        x.conferido ? e("span",{className:"rounded-md bg-success/20 px-2 py-0.5 text-[11.5px] font-bold text-success"},"✓ conferido")
          : e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold "+(x.finalizado ? "bg-primary/20 text-primary" : "bg-white/10 text-muted-foreground")}, x.finalizado ? "Pronto para conferir" : "Bipagem ainda não finalizou"),
        e("b",{className:MONO+" ml-auto text-primary"}, BK(total))),
      e("div",{className:"flex flex-col gap-1.5 px-2.5 pb-2.5"}, x.linhas.map(function(l,i){ return linha(x,l,i); })));
  };
  var corpo = e("div",{className:"flex max-h-[20rem] min-w-0 flex-col gap-2 overflow-x-hidden overflow-y-auto p-3"},
    e("p",{className:"text-[13px] font-semibold"}, pend.length ? pend.length+(pend.length===1 ? " acerto pendente" : " acertos pendentes") : "Nada pendente por enquanto."),
    pend.map(function(x){ return card(x, false); }));
  // p.dentro: faz parte do bloco do Atendimento interno (mesmo setor), só com uma faixa de título; senão, bloco próprio
  if(p.dentro) return e("div",{className:"flex flex-col border-t border-[#E8B84B]/30"},
    e("div",{className:"flex flex-col items-center bg-black/25 px-3 py-1.5 text-center"}, e("b",{className:"font-heading text-[14px] leading-tight text-primary"},"Pagamentos para conferir"),
      e("span",{className:"text-[11px] text-white/65"},"defina as contas, dê OK para enviar ao atendimento")), corpo);
  return e(BlocoBarra,{t:"Pagamentos para conferir", sub:"defina as contas, dê OK para enviar ao atendimento · depois de conferido, fica só no Consolidado do atendimento"}, corpo);
}

// ── Visão geral (visível pra toda a equipe): crescimento de revendedoras + resultado do ano (30 dias de janela) ──
// atualização diária do total de revendedoras: UMA por dia (às 10h da manhã); sábado e domingo ficam no último valor
function AtualizacaoHoje(p){
  var s = p.s, d = p.d, hojeIso = isoDia(new Date()), hist = s.revendedorasDiario || {}, ks = Object.keys(hist).sort();
  var ultimo = ks.length ? hist[ks[ks.length-1]] : 0;
  var q = useState(ultimo), qtd = q[0], setQtd = q[1];
  var feito = (s.revAtualizadoEm||{})[hojeIso], hora = feito ? new Date(feito).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}) : "";
  return e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg bg-black/15 px-3 py-2"},
    e("b",{className:"text-[12.5px]"}, "Hoje, "+hojeIso.split("-").reverse().slice(0,2).join("/")+" · total de revendedoras"),
    e(NumInput,{value:feito ? hist[hojeIso] : qtd, onChange:setQtd, className:"w-28! text-center!"+(feito ? " opacity-60" : "")}),
    e(Btn,{v:"primary", sm:true, ic:"save", disabled:!!feito || !(qtd>0), onClick:function(){ d({type:"REV_LANCAR", data:hojeIso, quantidade:qtd, unico:true}); }}, feito ? "✓ Atualizado às "+hora : "Atualizar hoje"),
    e("span",{className:"text-[11.5px] text-muted-foreground"}, feito ? "Só uma atualização por dia." : "Uma por dia, às 10h da manhã. Fim de semana fica no último valor."));
}

// tabela mês a mês (1 a 12): quantas revendedoras o mês começou e terminou, e o aumento ou a queda; o mês atual vai até hoje, em tempo real
function TabelaRevendedorasMeses(p){
  var linhas = resumoMensalRevendedoras(p.s, p.ano);
  var n = function(v){ return v===null || v===undefined ? "—" : Math.round(v).toLocaleString("pt-BR"); };
  var th = function(t){ return e("th",{key:t, className:"border-b border-r border-border px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
  var td = function(v, c){ return e("td",{className:"border-r border-border/60 px-2 py-1.5 text-center text-[13px] last:border-r-0 "+(c||"")}, v); };
  return e(BlocoBarra,{cor:"ouro", t:"Revendedoras mês a mês", sub:"quantas começamos e terminamos cada mês · o mês atual atualiza em tempo real"},
    e("div",{className:"overflow-x-auto p-3"},
      e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, ["Mês","Começou com","Terminou com","Aumento / queda","%"].map(th))),
        e("tbody",null, linhas.map(function(l){
          var cor = l.delta>0 ? "text-success" : l.delta<0 ? "text-destructive" : "text-muted-foreground";
          return e("tr",{key:l.mes, className:"border-b border-border/50 "+(l.atual ? "bg-primary/10 font-bold" : l.futuro ? "opacity-45" : "")},
            td(e("span",{className:"inline-flex items-center gap-1.5"}, (l.mes+1)+" · "+MESES_LONGO[l.mes], l.atual && e("span",{className:"rounded bg-success/20 px-1.5 text-[10.5px] font-bold text-success"},"ao vivo")), "text-left! "),
            td(n(l.ini), MONO), td(n(l.fim), MONO),
            td(l.delta===null ? "—" : (l.delta>0 ? "+" : "")+n(l.delta), MONO+" font-bold "+cor),
            td(l.pct===null ? "—" : (l.pct>0 ? "+" : "")+l.pct.toFixed(1).replace(".",",")+"%", MONO+" "+cor)); })))));
}

// Pessoas da Sorelly: só totais (sem CPF) de funcionários por CNPJ e por setor, mais o total de representantes
function BlocoPessoas(p){
  var r = resumoPessoas(), cn = cnpjsDe(p.s.cnpjs).filter(function(c){ return r.porCnpj[c.id]; });
  var linha = function(lb, v, cor){ return e("div",{key:lb, className:"flex items-center justify-between gap-2 py-px text-[12px] leading-tight"},
    e("span",{className:"flex min-w-0 items-center gap-1.5"}, cor && e("span",{className:"size-2.5 shrink-0 rounded-full", style:{background:cor}}), e("span",{className:"truncate"}, lb)), e("b",{className:MONO+" shrink-0"}, v)); };
  var titulo = function(t){ return e("span",{className:"mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70"}, t); };
  return e(BlocoBarra,{t:"Pessoas da Sorelly", sub:"funcionários e representantes"},
    e("div",{className:"flex flex-col gap-0.5 p-2"},
      e("div",{className:"flex flex-col rounded-lg bg-black/20 px-3 py-1.5"},
        linha("Funcionários", r.funcionarios), linha("Sócios", r.socios), linha("PJ", r.pjs), linha("Representantes", r.representantes),
        e("div",{className:"my-1 h-px bg-border"}),
        e("div",{className:"flex items-center justify-between py-0.5"}, e("b",{className:"text-[13px]"},"Total de pessoas"), e("b",{className:MONO+" text-[18px] leading-none text-primary"}, r.operacao+r.representantes))),
      titulo("Pessoas por CNPJ"),
      cn.map(function(c){ return linha((c.num ? c.num+" · " : "")+c.nome, r.porCnpj[c.id], c.cor); }),
      r.porCnpj[""] ? linha("CNPJ a informar", r.porCnpj[""]) : null,
      e(Btn,{v:"ghost", sm:true, ic:"chevron", className:"mt-1", onClick:function(){ p.d({type:"ABA", aba:"pessoas"}); }}, "Ver a lista completa")));
}

// ── Topo da Visão geral: 2 blocos de dinheiro (mês e ano, mesmos números da Previsão de faturamento) + revendedoras e fiscal ──
function Linha(p){
  return e("div",{className:"flex items-center justify-between gap-2 py-px text-[12px] leading-tight "+(p.forte ? "font-bold" : "")},
    e("span",{className:"min-w-0"}, p.t), e("b",{className:MONO+" shrink-0 whitespace-nowrap "+(p.cor||"")}, p.v));
}
function CaixaLinhas(p){
  return e("div",{className:"flex flex-col rounded-lg bg-black/20 px-3 py-2"},
    p.titulo && e("span",{className:"mb-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/70"}, p.titulo), p.children);
}
function BlocoMini(p){
  var corpo = [e("div",{key:"t", className:"flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-white/70"},
      e("span",{className:"size-2 shrink-0 rounded-full", style:{background:p.ponto}}), p.t, p.ir && e("span",{className:"ml-auto text-primary"},"›")),
    e("b",{key:"v", className:MONO+" whitespace-nowrap text-[16px] leading-tight "+(p.cor||"")}, p.v),
    p.nota && e("span",{key:"n", className:"truncate text-[10.5px] text-white/65"}, p.nota)];
  var cls = "flex min-w-0 flex-col gap-0.5 rounded-xl border border-border bg-black/25 px-3 py-1.5 text-left";
  return p.ir ? e("button",{onClick:p.ir, className:cls+" hover:bg-black/40"}, corpo) : e("div",{className:cls}, corpo);
}

// ── Inadimplência e compras internas do mês (valores de Financeiro → Inadimplência) ──
function BlocoInadimp(p){
  var s = p.s, ano = new Date().getFullYear(), mes = new Date().getMonth(), i = inadDoMes(s, ano, mes), c = comprasDoMes(s, ano, mes);
  var falta = Math.max(0, i.divida-i.pago), pct = i.divida>0 ? i.pago/i.divida*100 : 0;
  return e(BlocoBarra,{cor:"ouro", t:"Inadimplência e compras internas · "+MESES_LONGO[mes].toLowerCase(), sub:"do dia 1 até hoje"},
    e("div",{className:"grid grid-cols-1 gap-2 p-2 md:grid-cols-2"},
      e(CaixaLinhas,{titulo:"Inadimplência"}, e(Linha,{t:"Valor da dívida", v:BK(i.divida), cor:"text-destructive"}), e(Linha,{t:"Já foi pago", v:BK(i.pago), cor:"text-success"}),
        e(Linha,{t:"Falta receber", v:BK(falta), cor:"text-warning", forte:true}), e("div",{className:"mt-1 h-1.5 overflow-hidden rounded-full bg-black/40"}, e("div",{className:"h-full rounded-full bg-primary", style:{width:Math.min(100,pct)+"%"}})),
        e("span",{className:"text-[10.5px] text-white/65"}, Math.round(pct)+"% recuperado")),
      e(CaixaLinhas,{titulo:"Compras de funcionários"}, e(Linha,{t:"Valor vendido", v:BK(c.vendido)}), e(Linha,{t:"Já foi pago", v:BK(c.pago), cor:"text-success"}),
        e(Linha,{t:"Falta pagar", v:BK(Math.max(0, c.vendido-c.pago)), cor:"text-warning", forte:true}))));
}

// ── Atualizar o faturamento de hoje direto na primeira tela: provisório durante o dia; "Fixar o dia" quando o valor está certo (sobe sozinho em Contas a pagar → Diário) ──
function AtualizarHoje(p){
  var s = p.s, d = p.d, iso = isoDia(new Date()), fixado = !!(s.faturamentoDiario||{})[iso];
  var r = useState(null), rec = r[0], setRec = r[1], a = useState(null), ace = a[0], setAce = a[1];
  var vRec = rec===null ? p.m.recebido : rec, vAce = ace===null ? p.m.acertos : ace;
  // tudo numa linha só: título pequeno, valor recebido, acertos e os dois botões
  return e("div",{className:"flex flex-nowrap items-center gap-1.5 rounded-lg bg-black/25 px-2 py-1.5"},
    e("b",{className:"shrink-0 text-[10px] uppercase leading-none tracking-wide text-white/70"},"Hoje"),
    fixado ? e(React.Fragment,null, e("b",{className:"flex-1 text-[12px] text-success"},"✓ Dia fixado"), e(Btn,{v:"ghost", sm:true, onClick:function(){ d({type:"FAT_REABRIR", data:iso}); }},"Reabrir"))
    : e(React.Fragment,null,
        e("div",{className:"min-w-[7.5rem] flex-1"}, e(MoneyInput,{value:vRec, onChange:setRec, sm:true, className:"w-full", label:"Recebido do mês até agora"})),
        e("div",{className:"w-16 shrink-0"}, e(NumInput,{value:vAce, onChange:setAce, className:"w-full! text-center!", "aria-label":"Acertos do mês até agora"})),
        e(Btn,{v:"secondary", sm:true, onClick:function(){ d({type:"FAT_HOJE", data:iso, recebido:vRec, acertos:vAce}); }},"Atualizar"),
        e(Btn,{v:"primary", sm:true, ic:"save", onClick:function(){ d({type:"FAT_FIXAR", data:iso, recebido:vRec, acertos:vAce}); setRec(null); setAce(null); }},"Fixar")));
}

// ── Blocos do meio da Visão geral (todos com BlocoBarra e o botão "Abrir ›" para a tela deles) ──
var num = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var neg = function(v){ return (v<0 ? "−" : "")+BK(Math.abs(v)); };
var crRes = function(v){ return v<0 ? "text-destructive" : "text-success"; };

// Faturamento do mês, na ordem que o Marcus pediu: 1) como o mês começou e o que já aconteceu, 2) o que falta, 3) o total previsto e o resultado do mês
function BlocoFaturamentoMes(p){
  var r = resumoFinanceiro(p.s, p.janela), m = r.mes, t = tabelaMeses(p.s, p.janela);
  var mesAtual = new Date().getMonth(), prev = t.rows.filter(function(x){ return x.mes>mesAtual && x.previsao; });
  var acertosFalta = Math.max(0, m.metaAlvo-m.acertos), fatTotal = m.recebido+m.aReceber, contasTotal = m.pago+m.aPagar;
  return e(BlocoBarra,{cor:"ouro", t:"Faturamento de "+m.nome.toLowerCase(), sub:"como o mês começou, o que já aconteceu e o que falta", ir:"previsaofat"},
    e("div",{className:"flex flex-col gap-1.5 p-2"},
      e(CaixaLinhas,{titulo:"Até o momento"},
        e(Linha,{t:"Revendedoras no início do mês", v:num(m.base)}), e(Linha,{t:"Previstos dentro do mês", v:num(m.previstos)}),
        e(Linha,{t:"95% sobre o previsto (acertos esperados)", v:num(m.metaAlvo)}), e(Linha,{t:"Média por acerto", v:BK(m.mediaAcerto)}),
        e(Linha,{t:"Faturamento até o momento", v:BK(m.recebido), cor:"text-success"}), e(Linha,{t:"Contas pagas até o momento", v:BK(m.pago), cor:"text-destructive"}),
        e(Linha,{t:"Resultado até o momento", v:neg(m.resultadoAgora), cor:crRes(m.resultadoAgora), forte:true})),
      e(CaixaLinhas,{titulo:"Ainda falta"},
        e(Linha,{t:"Acertos previstos", v:num(acertosFalta)}), e(Linha,{t:"Faturamento previsto", v:BK(m.aReceber), cor:"text-success"}),
        e(Linha,{t:"Contas a pagar previsto", v:BK(m.aPagar), cor:"text-destructive"})),
      e(CaixaLinhas,{titulo:"Total do mês"},
        e(Linha,{t:"Faturamento total previsto", v:BK(fatTotal), cor:"text-success"}), e(Linha,{t:"Contas a pagar total previsto", v:BK(contasTotal), cor:"text-destructive"}),
        e("div",{className:"mt-1 flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2"},
          e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-white/70"},"Resultado do mês"),
          e("b",{className:MONO+" whitespace-nowrap text-[28px] leading-none "+crRes(m.resultadoEsperado)}, neg(m.resultadoEsperado)))),
      prev.length ? e(CaixaLinhas,{titulo:"Previsão dos próximos meses"}, prev.map(function(x){
        return e(Linha,{key:x.mes, t:x.nome+" · média "+BK(x.media)+" por acerto", v:BK(x.fat), cor:"text-success"}); })) : null,
      e(AtualizarHoje,{s:p.s, d:p.d, m:m})));
}

// Faturamento do ano, no mesmo padrão
function BlocoAno(p){
  var a = resumoFinanceiro(p.s, p.janela).ano;
  return e(BlocoBarra,{cor:"ouro", t:"Faturamento do ano "+a.ano, sub:"o ano até o momento e a previsão até dezembro", ir:"previsaofat"},
    e("div",{className:"flex flex-col gap-1.5 p-2"},
      e(CaixaLinhas,null, e(Linha,{t:"Faturamento do ano atualizado", v:BK(a.recebido), cor:"text-success"}), e(Linha,{t:"Contas pagas até o momento", v:BK(a.pago), cor:"text-destructive"}),
        e(Linha,{t:"Resultado do ano", v:neg(a.resultadoAgora), cor:crRes(a.resultadoAgora), forte:true})),
      e(CaixaLinhas,null, e(Linha,{t:"Faturamento do ano previsto", v:BK(a.previsto), cor:"text-success"}), e(Linha,{t:"Contas do ano previstas", v:BK(a.contasTotal), cor:"text-destructive"}),
        e(Linha,{t:"Resultado do ano previsto", v:neg(a.resultadoEsperado), cor:crRes(a.resultadoEsperado), forte:true}))));
}

// ILF por CNPJ: quanto já faturou, quanto ainda pode faturar até o sublimite e o ILF — para escolher o CNPJ da nota nova
function BlocoIlf(p){
  var s = p.s, NIVEL = {verde:["Dentro","bg-success/20 text-success"], amarelo:["Perto","bg-warning/20 text-warning"], vermelho:["Passa","bg-destructive/25 text-destructive"]};
  var lista = cnpjsDe(s.cnpjs).filter(function(c){ return c.id!=="ho"; }).map(function(c){ var f = fiscalAtual(s.fiscal, c.id), tem = !!f.data;
    return {c:c, f:f, tem:tem, ind:indicadoresFiscais(f), pr:tem ? projecaoCnpj(c.id, f, s.contasCnpj) : null}; })
    .sort(function(a,b){ return (a.tem ? a.ind.ilf : Infinity)-(b.tem ? b.ind.ilf : Infinity); });   // menor ILF primeiro, como em Limite de faturamento
  var maisFolga = lista.filter(function(x){ return x.tem; }).sort(function(a,b){ return b.ind.falta-a.ind.falta; })[0];
  return e(BlocoBarra,{cor:"ouro", t:"ILF por CNPJ", sub:"quanto ainda pode faturar até o sublimite · ★ = mais folga para nota nova", ir:"limitefat"},
    e("div",{className:"flex flex-col gap-1.5 p-2"}, lista.map(function(x){ var nv = x.pr ? NIVEL[x.pr.nivel] : null;
      return e("div",{key:x.c.id, className:"flex flex-col gap-1 rounded-lg bg-black/20 px-3 py-1.5", style:{boxShadow:"inset 3px 0 0 "+x.c.cor}},
        e("div",{className:"flex items-center justify-between gap-2"},
          e("b",{className:"min-w-0 truncate text-[12.5px]"}, (maisFolga && maisFolga.c.id===x.c.id ? "★ " : "")+(x.c.num ? x.c.num+" " : "")+x.c.nome),
          nv && e("span",{className:"shrink-0 rounded px-1.5 text-[9.5px] font-bold "+nv[1]}, nv[0]),
          e("b",{className:MONO+" shrink-0 text-[13px] text-primary"}, x.tem ? "ILF "+x.ind.ilf.toLocaleString("pt-BR",{minimumFractionDigits:1, maximumFractionDigits:1})+"%" : "—")),
        x.tem ? e(React.Fragment,null,
          e("div",{className:"flex items-center justify-between text-[11.5px]"}, e("span",null,"Pode faturar"), e("b",{className:MONO+" text-primary"}, BK(x.ind.falta))),
          e("div",{className:"h-1.5 overflow-hidden rounded-full bg-black/40"}, e("div",{className:"h-full rounded-full "+(x.ind.pctSublimite>100 ? "bg-destructive" : "bg-primary"), style:{width:Math.min(100,x.ind.pctSublimite)+"%"}})))
        : e("span",{className:"text-[11px] text-white/60"},"sem lançamento fiscal")); })));
}

// Bipagem de retorno (URGENTE): kits bipados hoje e kits aguardando. A cada degrau (20, 30, 40, 50) fica mais vermelho e pisca mais rápido; no 50 é o máximo
function BlocoBipagemRetorno(p){
  var hojeIso = isoDia(new Date()), dia = porDia(p.s).filter(function(x){ return x.dia===hojeIso; })[0], bipados = dia ? dia.bipados : 0, aguardando = qtdFila(p.s);
  var nv = nivelDe(aguardando), cor = corDaFila(aguardando), tam = 44, alerta = nv>=0, pisca = [2.2,1.5,0.9,0.4][Math.max(0,nv)];   // fonte fixa; só a cor e a velocidade de piscar sobem
  return e("section",{className:"overflow-hidden rounded-xl bg-card "+(alerta ? "animate-pulse" : "ring-1 ring-[#E8B84B]/25"), style:alerta ? {animationDuration:pisca+"s", boxShadow:"0 0 0 2px "+cor+", 0 0 "+(14+nv*8)+"px "+cor+"88"} : undefined},
    e("div",{className:"relative flex flex-col items-center px-14 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)] "+(alerta ? "text-white" : "bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409]"), style:alerta ? {background:"linear-gradient(90deg, #7F1D1D, "+cor+")"} : undefined},
      e("h2",{className:"font-heading text-[15px] font-bold leading-tight"}, (alerta ? "⚠ " : "")+"Bipagem de retorno"),
      e("p",{className:"text-[11.5px] font-medium opacity-90"}, alerta ? "Passou de "+NIVEIS[nv]+": chame cadastro, Deysiane e encomendas para ajudar" : "kits que voltaram das representantes"),
      e("button",{onClick:function(){ p.d({type:"ABA", aba:"controlekits"}); }, title:"Abrir a tela completa", className:"absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/50"}, "Abrir ›")),
    e("div",{className:"grid grid-cols-[1fr_1.6fr] items-center gap-2 p-2"},
      e("div",{className:"flex flex-col items-center rounded-lg bg-black/25 px-2 py-2 text-center"}, e("b",{className:MONO+" text-[28px] leading-none text-success"}, bipados), e("span",{className:"mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/70"},"Bipados hoje")),
      e("div",{className:"flex flex-col items-center justify-center rounded-lg bg-black/35 px-2 py-1 text-center", style:alerta ? {boxShadow:"inset 0 0 0 1px "+cor+"99"} : undefined},
        e("b",{className:MONO+" leading-none", style:{color:cor, fontSize:tam+"px"}}, aguardando), e("span",{className:"mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/80"},"Aguardando bipagem"))));
}

// Revendedoras e acertos do mês (cada um leva à sua tela)
function NumerosRapidos(p){
  var s = p.s, d = p.d, ano = new Date().getFullYear(), m = resumoFinanceiro(s, p.janela).mes;
  var mesRev = resumoMensalRevendedoras(s, ano).filter(function(l){ return l.atual; })[0];
  var revDatas = Object.keys(s.revendedorasDiario||{}).sort(), revTotal = revDatas.length ? s.revendedorasDiario[revDatas[revDatas.length-1]] : 0;
  return e("div",{className:"grid grid-cols-2 gap-3"},
    e(BlocoMini,{t:"Revendedoras", v:num(revTotal), cor:"text-primary", ponto:"#60a5fa", nota:mesRev && mesRev.delta!==null ? (mesRev.delta>=0?"+":"")+num(mesRev.delta)+" no mês" : "total hoje"}),
    e(BlocoMini,{t:"Acertos do mês", v:num(m.acertos), ponto:"#E8B84B", nota:"média "+BK(m.mediaAcerto), ir:function(){ d({type:"ABA", aba:"consrep"}); }}));
}

// ── Revendedoras que vêm à empresa (atendimento interno): média de vendas de cada uma. Puxa do APP; se o app tiver menos de R$ 500, usa a média
// das vendas anteriores (DevMaster). R$ 3.000 a 3.999 = destaque âmbar · R$ 4.000 ou mais = verde. ──
var MIN_VENDA_APP = 500, FAIXA_ALTA = 3000, FAIXA_TOPO = 4000;
function mediaVendasDe(it){
  var app = it.vendaApp||0, ant = (it.vendasAnt||[]).filter(function(v){ return v>0; });
  var usaApp = app>=MIN_VENDA_APP, base = usaApp ? [app].concat(ant) : ant;
  return {media:base.length ? base.reduce(function(a,b){ return a+b; },0)/base.length : 0, fonte:usaApp ? "app" : "média anterior"};
}
function ListaRevsEmpresa(p){
  var s = p.s, dia = p.dia;
  var lista = (s.internos||[]).filter(function(x){ return x.data===dia; })
    .sort(function(a,b){ return (a.hora||"") < (b.hora||"") ? -1 : 1; }).slice(0,12);
  var cor = function(m){ return m>=FAIXA_TOPO ? ["#16A34A33","#4ADE80"] : m>=FAIXA_ALTA ? ["#F59E0B33","#FBBF24"] : [null,null]; };
  return e("div",{className:"flex flex-col gap-1 p-2"}, lista.length===0 ? e("p",{className:"p-3 text-center text-[12.5px] text-white/70"},"Nenhuma revendedora agendada neste dia.") : lista.map(function(x){
      var m = mediaVendasDe(x), c = cor(m.media), feito = x.status==="acertado";
      return e("div",{key:x.id, className:"flex items-center gap-2 rounded-lg px-2.5 py-1 text-[12.5px]", style:{background:c[0] || "rgba(0,0,0,.22)", boxShadow:c[1] ? "inset 3px 0 0 "+c[1] : undefined}},
        e("b",{className:MONO+" w-12 shrink-0 text-[15px] leading-none"}, x.hora||"—"),
        e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate"}, (feito ? "✓ " : "")+x.nome), e("span",{className:"text-[10.5px] text-white/65"}, m.fonte)),
        e("b",{className:MONO+" shrink-0 text-[13px]", style:c[1] ? {color:c[1]} : undefined}, m.media>0 ? BK(m.media) : "—")); }));
}

// Atendimento interno da Visão geral: o dia aparece grande UMA vez (com setas e o botão Alterar); a lista mostra só o horário e o nome
function AtendimentoInternoVG(p){
  var hojeIso = isoDia(new Date()), st = useState(hojeIso), dia = st[0], setDia = st[1], ref = React.useRef(null);
  var soma = function(n){ var x = new Date(dia+"T12:00:00"); x.setDate(x.getDate()+n); setDia(isoDia(x)); };
  var dt = new Date(dia+"T12:00:00"), sem = dt.toLocaleDateString("pt-BR",{weekday:"long"}).replace("-feira","");
  var rotulo = (dia===hojeIso ? "Hoje" : sem.charAt(0).toUpperCase()+sem.slice(1))+" · "+dia.split("-").reverse().slice(0,2).join("/");
  var seta = function(t, n){ return e("button",{onClick:function(){ soma(n); }, "aria-label":n<0 ? "Dia anterior" : "Próximo dia", className:"grid size-7 place-items-center rounded-lg bg-black/30 text-[15px] font-bold hover:bg-black/50"}, t); };
  var cab = e("div",{className:"flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2.5 py-1"},
    e("div",{className:"flex items-center gap-1"}, seta("‹",-1), seta("›",1)),
    e("b",{className:"font-heading text-[19px] leading-none text-primary"}, rotulo),
    e("div",{className:"relative"},
      e("button",{onClick:function(){ try{ ref.current.showPicker(); }catch(err){ ref.current.focus(); ref.current.click(); } }, className:"rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-bold hover:bg-black/50"}, "Alterar"),
      e("input",{ref:ref, type:"date", value:dia, "aria-label":"Escolher o dia", onChange:function(ev){ if(ev.target.value) setDia(ev.target.value); }, className:"pointer-events-none absolute right-0 top-full h-0 w-0 opacity-0"})));
  return e(BlocoInternoHoje,{semLista:true, ir:"intlist", dia:dia}, cab, e(ListaRevsEmpresa,{s:p.s, dia:dia}), podeConferirPag(p.s.usuario) ? e(PagamentosAConferir,{dentro:true}) : null);
}

function AbaVisaoGeral(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth();
  var jg = useState(2), janelaGrafico = jg[0], setJanelaGrafico = jg[1];
  var janelaFat = 2;   // crescimento de revendedoras que calcula nov/dez (índice de CRESCIMENTO_REVENDEDORAS; 2 = 30 dias)
  return e(React.Fragment,null,
    e(PageHead,{t:"Visão geral", sub:"Crescimento de revendedoras e resultado do ano, sempre atualizados."}),
    // 3 colunas da mesma altura (os blocos esticam pra ficar alinhados embaixo também)
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr_0.85fr] xl:[&>div]:flex xl:[&>div]:flex-col xl:[&>div]:gap-4 xl:[&>div>*:last-child]:flex-1"},
      e("div",null,
        // atendimento interno no topo (valores + listagem com a média), com os pagamentos para conferir logo abaixo; inadimplência no pé da coluna
        e(BlocoBipagemRetorno,{s:s, d:d}),
        e(AtendimentoInternoVG,{s:s}),
        e(BlocoInadimp,{s:s})),
      e("div",null, e(BlocoFaturamentoMes,{s:s, d:d, janela:janelaFat}), e(BlocoAno,{s:s, janela:janelaFat}), e(NumerosRapidos,{s:s, d:d, janela:janelaFat})),
      e("div",null, e(BlocoPessoas,{s:s, d:d}), e(BlocoIlf,{s:s}))),
    e("div",{className:"mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.9fr_1fr]"},
      e(BlocoBarra,{t:"Crescimento de revendedoras", sub:"escolha quantos dias mostrar — sempre com a projeção até dezembro junto"},
        e("div",{className:"flex flex-col gap-1.5 p-2"},
          papelDe(s.usuario)==="supervisao" && e(AtualizacaoHoje,{s:s, d:d}),
          e("div",{className:"flex flex-wrap gap-1.5"},
            JANELAS_GRAFICO_REV.map(function(x,i){ return e("button",{key:i, onClick:function(){setJanelaGrafico(i);},
              className:"rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 "+(janelaGrafico===i ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); })),
          e(GraficoColunasRevendedoras,{pontos:pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:janelaFat}, JANELAS_GRAFICO_REV[janelaGrafico])),
            opcoes:{janelas:JANELAS_GRAFICO_REV, indice:janelaGrafico, calcular:function(i){ return pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:janelaFat}, JANELAS_GRAFICO_REV[i])); }}}))),
      e(TabelaCrescimento,{s:s, ano:ano})));
}

export { AbaVisaoGeral };
