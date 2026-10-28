// Sorelly Admin · montagem e bipagem — pages/VisaoGeral.js
// Extraído de sorelly_admin_montagem_bipagem.html; depois com o gráfico ganhando o mesmo seletor de janela (7 a 90 dias,
// mês atual ou história completa) e projeção da Previsão de faturamento, em vez de mostrar sempre o ano corrente fixo.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { COR_NIVEL, NIVEIS, corDaFila, nivelDe, porDia, qtdFila } from "@/apps/montagem/domain/retornos";
import { BlocoInternoHoje, resumoInterno } from "@/apps/montagem/components/interno-resumo";
import { TabelaCrescimento } from "@/apps/montagem/components/tabela-crescimento";
import { GraficoColunasRevendedoras } from "@/apps/montagem/components/grafico-revendedoras";
import { mesAberto, nomeMes, painelDe, proximoMes } from "@/apps/montagem/domain/agendamento";
import { JANELAS_GRAFICO_REV, metaDoMes, MESES_LONGO, fatEfetivo, pontosRevendedoras, projetarAno, resumoMensalRevendedoras } from "@/apps/montagem/domain/financeiro";
import { comprasDoMes, inadDoMes } from "@/apps/montagem/domain/inadimplencia-fin";
import { resumoFinanceiro } from "@/apps/montagem/domain/resumo-financeiro";
import { cnpjsDe, fiscalAtual, indicadoresFiscais, projecaoCnpj } from "@/apps/montagem/domain/cnpjs";
import { REPRESENTANTES, funcionarios, resumoPessoas } from "@/apps/montagem/domain/pessoas";
import { statusLinhaFin, contasDefinidas, contasEnviadas, statusPedidoFin } from "@/apps/montagem/domain/atendimento-interno";
import { api as chatApi, efem as chatEfem, useChat } from "@/apps/montagem/domain/chat-store";
import { contato, contatoDoLogin } from "@/apps/montagem/domain/chat-contatos";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { podeConferirPag, podeGerirAgend, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { formasPagamentoPadrao } from "@/apps/montagem/domain/consignado";
import { Btn } from "@/apps/montagem/ui/button";
import { APPS_TOPO } from "@/apps/montagem/navigation/setores";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { useContagemNaTela } from "@/apps/montagem/lib/contagem-tela";
import { e, useRef, useState } from "@/shared/react";
import React from "react";

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
  return e(BlocoBarra,{fixo:true, cor:"ouro", t:"Revendedoras mês a mês", sub:"quantas começamos e terminamos cada mês · o mês atual atualiza em tempo real"},
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
  return e(BlocoBarra,{fixo:true, t:"Pessoas da Sorelly", sub:"funcionários e representantes"},
    e("div",{className:"flex flex-col gap-0.5 p-2"},
      e("div",{className:"flex flex-col rounded-lg bg-black/20 px-3 py-1.5"},
        linha("Funcionários", r.funcionarios), linha("Sócios", r.socios), linha("PJ", r.pjs), linha("Representantes", r.representantes),
        e("div",{className:"my-1 h-px bg-border"}),
        e("div",{className:"flex items-center justify-between py-0.5"}, e("b",{className:"text-[13px]"},"Total de pessoas"), e("b",{className:MONO+" text-[18px] leading-none text-primary"}, r.operacao+r.representantes))),
      titulo("Pessoas por CNPJ"),
      cn.map(function(c){ return linha((c.num ? c.num+" · " : "")+c.nome, r.porCnpj[c.id], c.cor); }),
      r.porCnpj[""] ? linha("CNPJ a informar", r.porCnpj[""]) : null,
      titulo("Copiar só os nomes"),
      e("div",{className:"flex gap-1.5"}, [["Representantes", REPRESENTANTES], ["Funcionários", funcionarios()]].map(function(x){
        return e(Btn,{key:x[0], v:"secondary", sm:true, ic:"copiar", className:"flex-1", onClick:function(){ try{ navigator.clipboard.writeText(x[1].map(function(y){ return y.nome; }).join("\n")); p.d({type:"AVISO", txt:x[0]+": "+x[1].length+" nomes copiados"}); }catch(er){} }}, x[0]); })),
      e(Btn,{v:"ghost", sm:true, ic:"chevron", className:"mt-1", onClick:function(){ p.d({type:"ABA", aba:"pessoas"}); }}, "Ver a lista completa")));
}

// ── Topo da Visão geral: 2 blocos de dinheiro (mês e ano, mesmos números da Previsão de faturamento) + revendedoras e fiscal ──
function Linha(p){
  var d = use().dispatch, destino = p.ir || (/^Contas/.test(p.t) ? "contaspagar" : null);
  var corpo = [e("span",{key:"t", className:"min-w-0"}, p.t), e("b",{key:"v", className:MONO+" shrink-0 whitespace-nowrap "+(p.cor||"")}, p.v)];
  var cls = "flex items-center justify-between gap-2 py-px text-[12px] leading-tight "+(p.forte ? "font-bold" : "");
  // linha com destino: passar o mouse destaca e clicar leva para a tela dela (Contas a pagar, Faturamento, Inadimplência...)
  return destino ? e("button",{onClick:function(){ d({type:"ABA", aba:destino}); }, title:"Abrir a tela", className:cls+" w-full cursor-pointer rounded px-1 -mx-1 text-left transition-colors hover:bg-white/15"}, corpo) : e("div",{className:cls}, corpo);
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
  return e(BlocoBarra,{fixo:true, cor:"ouro", t:"Inadimplência e compras internas · "+MESES_LONGO[mes].toLowerCase(), sub:"do dia 1 até hoje"},
    e("div",{className:"grid grid-cols-1 gap-2 p-2 md:grid-cols-2"},
      e(CaixaLinhas,{titulo:"Inadimplência"}, e(Linha,{ir:"inadfin", t:"Valor da dívida", v:BK(i.divida), cor:"text-destructive"}), e(Linha,{ir:"inadfin", t:"Já foi pago", v:BK(i.pago), cor:"text-success"}),
        e(Linha,{ir:"inadfin", t:"Falta receber", v:BK(falta), cor:"text-warning", forte:true}), e("div",{className:"mt-1 h-1.5 overflow-hidden rounded-full bg-black/40"}, e("div",{className:"h-full rounded-full bg-primary", style:{width:Math.min(100,pct)+"%"}})),
        e("span",{className:"text-[10.5px] text-white/65"}, Math.round(pct)+"% recuperado")),
      e(CaixaLinhas,{titulo:"Compras de funcionários"}, e(Linha,{ir:"cfvisao", t:"Valor vendido", v:BK(c.vendido)}), e(Linha,{ir:"cfvisao", t:"Já foi pago", v:BK(c.pago), cor:"text-success"}),
        e(Linha,{ir:"cfvisao", t:"Falta pagar", v:BK(Math.max(0, c.vendido-c.pago)), cor:"text-warning", forte:true}))));
}

// ── Atualizar o faturamento de hoje: painel que abre/fecha pelo ✎ no canto do item "Faturamento até o momento" (V1-C, pedido do Marcus, 27/10/2026) ──
// Provisório durante o dia; "Fixar o dia" quando o valor está certo (sobe sozinho em Contas a pagar → Diário).
function PainelAtualizarHoje(p){
  var s = p.s, d = p.d, iso = isoDia(new Date()), fixado = !!(s.faturamentoDiario||{})[iso];
  var r = useState(null), rec = r[0], setRec = r[1], a = useState(null), ace = a[0], setAce = a[1];
  var vRec = rec===null ? p.m.recebido : rec, vAce = ace===null ? p.m.feitos : ace, fm = (s.fechaMes||{})[iso.slice(0,7)] || {}, c = useState(null), car = c[0], setCar = c[1], vCar = car===null ? p.m.carregar : car;
  if(fixado) return e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg bg-black/25 px-3 py-1.5"},
    e("b",{className:"shrink-0 text-[10px] uppercase leading-none tracking-wide text-white/70"},"Hoje"),
    e("b",{className:"text-[12.5px] text-success"},"✓ Dia fixado"),
    e(Btn,{v:"ghost", sm:true, className:"ml-auto", onClick:function(){ d({type:"FAT_REABRIR", data:iso}); }},"Reabrir"),
    e(Btn,{v:"ghost", sm:true, onClick:p.onFechar},"Fechar"));
  return e("div",{className:"flex flex-wrap items-center gap-1.5 rounded-lg bg-black/25 px-3 py-1.5"},
    e("b",{className:"shrink-0 text-[10px] uppercase leading-none tracking-wide text-white/70"},"Hoje"),
    e("div",{className:"min-w-[9.5rem] flex-1"}, e(MoneyInput,{value:vRec, onChange:setRec, sm:true, className:"w-full", label:"Recebido do mês até agora"})),
    e("div",{className:"w-16 shrink-0"}, e(NumInput,{value:vAce, onChange:setAce, className:"w-full! text-center!", "aria-label":"Acertos do mês até agora"})),
    e("div",{className:"flex shrink-0 items-center gap-1"}, e("span",{className:"text-[10px] font-bold uppercase text-warning"},"Carregar"), e("div",{className:"w-14 shrink-0"}, e(NumInput,{value:vCar, onChange:setCar, className:"w-full! text-center!", "aria-label":"Vendas no Carregar"}))),
    e(Btn,{v:"ghost", sm:true, onClick:p.onFechar},"Fechar"),
    e(Btn,{v:"secondary", sm:true, onClick:function(){ d({type:"FECHA_MES_SET", ym:iso.slice(0,7), aRealizar:fm.aRealizar||0, carregar:vCar}); d({type:"FAT_HOJE", data:iso, recebido:vRec, acertos:vAce}); }},"Atualizar hoje"),
    e(Btn,{v:"primary", sm:true, ic:"save", onClick:function(){ d({type:"FAT_FIXAR", data:iso, recebido:vRec, acertos:vAce}); setRec(null); setAce(null); if(p.onFechar) p.onFechar(); }},"Fixar"));
}

// ── Blocos do meio da Visão geral (todos com BlocoBarra e o botão "Abrir ›" para a tela deles) ──
var num = function(v){ return Math.round(v).toLocaleString("pt-BR"); };
var neg = function(v){ return (v<0 ? "−" : "")+BK(Math.abs(v)); };
var crRes = function(v){ return v<0 ? "text-destructive" : "text-success"; };

// Faturamento (bloco único, pedido do Marcus em 14/10/2026): 1) o mês atual, 2) o ano, 3) a previsão dos meses que faltam (nov e dez) com
// faturamento esperado, média esperada por acerto, contas a pagar e resultado previsto. Mesmas contas da Previsão de faturamento.
function Secao(p){ return e("div",{className:"flex flex-col gap-1.5"}, e("h3",{className:"px-1 pt-1 text-[12px] font-extrabold uppercase tracking-[.14em] text-primary"}, p.t), p.children); }
function LinhaFat(p){ return e(Linha, Object.assign({ir:/^Contas/.test(p.t) ? "contaspagar" : "previsaofat"}, p)); }
function BlocoFaturamento(p){
  var r = resumoFinanceiro(p.s, p.janela), m = r.mes;
  var acertosFalta = Math.max(0, m.metaAlvo-m.acertos), fatTotal = m.recebido+m.aReceber, contasTotal = m.pago+m.aPagar;
  return e(BlocoBarra,{fixo:true, cor:"ouro", t:"Faturamento", sub:m.nome.toLowerCase()+" · previsão e resultado", ir:"previsaofat"},
    e("div",{className:"flex flex-col gap-2 p-2"},
      e(Secao,{t:m.nome},
        e(CaixaLinhas,{titulo:"Previsão do mês · escolha quantos % dos acertos previstos"},
          m.casos.map(function(c){ var on = c.pct===m.metaPct;
            return e("button",{key:c.pct, onClick:function(){ p.d({type:"META_PCT_SET", pct:c.pct}); }, "aria-pressed":on, className:"mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg px-2.5 py-1.5 text-left text-[12px] "+(on ? "bg-primary/20 ring-2 ring-primary" : "bg-black/20 ring-1 ring-border hover:bg-black/35")},
              e("b",{className:MONO+" text-[14px] "+(on ? "text-primary" : "")}, c.pct+"%"),
              e("span",{className:"flex-1 text-white/80"}, num(c.acertos)+" acertos · faltam "+num(c.faltam)), e("b",{className:MONO+" whitespace-nowrap text-success"}, BK(c.fat))); })),
        e(CaixaLinhas,{titulo:"Até o momento"},
          e(LinhaFat,{t:"Faturamento atualizado", v:BK(m.recebido), cor:"text-success", forte:true}), e(LinhaFat,{t:"Acertos realizados", v:num(m.feitos)}), e(LinhaFat,{t:"Carregar (vendas, por fora)", v:num(m.carregar), cor:"text-warning"}), e(LinhaFat,{t:"Média por acerto", v:BK(m.mediaAcerto)}),
          e(LinhaFat,{t:"Contas pagas até o momento", v:BK(m.pago), cor:"text-destructive"}), e(LinhaFat,{t:"Resultado até o momento", v:neg(m.resultadoAgora), cor:crRes(m.resultadoAgora), forte:true})),
        e(CaixaLinhas,{titulo:"Ainda falta em "+m.nome.toLowerCase()+" ("+m.metaPct+"%)"},
          e(LinhaFat,{t:"Acertos esperados", v:num(m.metaAlvo)}), e(LinhaFat,{t:"Acertos que faltam", v:num(acertosFalta)}), e(LinhaFat,{t:"Faturamento previsto", v:BK(m.aReceber), cor:"text-success"}), e(LinhaFat,{t:"Contas a pagar previsto", v:BK(m.aPagar), cor:"text-destructive"})),
        e(CaixaLinhas,{titulo:"Total de "+m.nome.toLowerCase()+" (previsto)"},
          e(LinhaFat,{t:"Faturamento total previsto", v:BK(fatTotal), cor:"text-success"}), e(LinhaFat,{t:"Contas a pagar total previsto", v:BK(contasTotal), cor:"text-destructive"}),
          e("div",{className:"mt-1 flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2"},
            e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-white/70"},"Resultado do mês"),
            e("b",{className:MONO+" whitespace-nowrap text-[20px] leading-none "+crRes(m.resultadoEsperado)}, neg(m.resultadoEsperado)))))));
}

// ILF por CNPJ: quanto já faturou, quanto ainda pode faturar até o sublimite e o ILF — para escolher o CNPJ da nota nova
function BlocoIlf(p){
  var s = p.s, NIVEL = {verde:["Dentro","bg-success/20 text-success"], amarelo:["Perto","bg-warning/20 text-warning"], vermelho:["Passa","bg-destructive/25 text-destructive"]};
  var lista = cnpjsDe(s.cnpjs).filter(function(c){ return c.id!=="ho"; }).map(function(c){ var f = fiscalAtual(s.fiscal, c.id), tem = !!f.data;
    return {c:c, f:f, tem:tem, ind:indicadoresFiscais(f), pr:tem ? projecaoCnpj(c.id, f, s.contasCnpj) : null}; })
    .sort(function(a,b){ return (a.tem ? a.ind.ilf : Infinity)-(b.tem ? b.ind.ilf : Infinity); });   // menor ILF primeiro, como em Limite de faturamento
  var maisFolga = lista.filter(function(x){ return x.tem; }).sort(function(a,b){ return b.ind.falta-a.ind.falta; })[0];
  return e(BlocoBarra,{fixo:true, cor:"ouro", t:"ILF por CNPJ", sub:"quanto ainda pode faturar até o sublimite · ★ = mais folga para nota nova", ir:"limitefat"},
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

// Acertos do mês: previsão (início do mês, previstos, nova previsão e % da meta) e andamento (realizados, carregar, faltam). Atualiza todo dia.
function BlocoAcertosMes(p){
  // 28/10/2026 (Marcus): sem as faixas 94/95/96. Duas colunas no jeito das outras caixas: Previsão (início do mês, previstos, nova previsão, % da meta) e Andamento (realizados, carregar, faltam).
  var LA = function(q){ return e(Linha, Object.assign({ir:"agpainel"}, q)); };   // toda linha leva ao Painel do Agendamento
  var m = resumoFinanceiro(p.s, p.janela).mes, falta = Math.max(0, m.previstos-m.acertos), faltaMeta = Math.max(0, m.metaAlvo-m.acertos), pctReal = m.previstos>0 ? Math.min(100, m.acertos/m.previstos*100) : 0;   // faltam = o que realmente falta (novo previstos − realizados − carregar); a meta de 97/98/99% é sobre o total do mês
  return e(BlocoBarra,{cor:"ouro", t:"Acertos de "+m.nome.toLowerCase(), sub:"previsão do mês × o que já foi", ir:"agpainel"},
    e("div",{className:"flex flex-col gap-2 p-2"},
      e("div",{className:"grid grid-cols-2 gap-2"},
        e(CaixaLinhas,{titulo:"Previsão"},
          LA({t:"Revendedoras no início do mês", v:num(m.base)}), LA({t:"Previstos primeiros", v:num(m.previstosInicio)}),
          LA({t:"Novo previstos", v:num(m.previstos), forte:true}), LA({t:"Acertos adiados até o momento", v:num(Math.max(0, m.previstosInicio-m.previstos)), cor:"text-warning"}), LA({t:m.metaPct+"% dos novos previstos", v:num(m.metaAlvo), forte:true, cor:"text-primary"})),
        e(CaixaLinhas,{titulo:"Andamento"},
          LA({t:"Realizados", v:num(m.feitos), cor:"text-success"}), LA({t:"Carregar", v:num(m.carregar), cor:"text-warning"}),
          LA({t:"Faltam (total)", v:num(falta), forte:true, cor:"text-primary"}), LA({t:"Do mês", v:pctReal.toFixed(1).replace(".",",")+"%"}), LA({t:"Falta para os "+m.metaPct+"%", v:num(faltaMeta)}))),
      e("div",{className:"h-1.5 overflow-hidden rounded-full bg-black/40"}, e("div",{className:"h-full rounded-full bg-primary", style:{width:pctReal+"%"}}))));
}

// Bipagem de retorno (URGENTE): kits bipados hoje e kits aguardando. A cada degrau (20, 30, 40, 50) fica mais vermelho e pisca mais rápido; no 50 é o máximo
function BlocoBipagemRetorno(p){
  var hojeIso = isoDia(new Date()), dia = porDia(p.s).filter(function(x){ return x.dia===hojeIso; })[0], bipados = dia ? dia.bipados : 0, aguardando = qtdFila(p.s);
  var nv = nivelDe(aguardando), cor = corDaFila(aguardando), alerta = nv>=0, pisca = [2.2,1.5,0.9,0.4][Math.max(0,nv)];   // fonte fixa; só a cor e a velocidade de piscar sobem
  return e("section",{className:"overflow-hidden rounded-xl bg-card "+(alerta ? "animate-pulse" : "ring-2 ring-[#E8B84B]/45"), style:alerta ? {animationDuration:pisca+"s", boxShadow:"0 0 0 2px "+cor+", 0 0 "+(14+nv*8)+"px "+cor+"88"} : undefined},
    e("div",{className:"relative flex flex-col items-center px-14 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)] "+(alerta ? "text-white" : "bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409]"), style:alerta ? {background:"linear-gradient(90deg, #7F1D1D, "+cor+")"} : undefined},
      e("h2",{className:"font-heading text-[15px] font-bold leading-tight"}, (alerta ? "⚠ " : "")+"Bipagem de retorno"),
      e("p",{className:"text-[11.5px] font-medium opacity-90"}, alerta ? "Passou de "+NIVEIS[nv]+": chame cadastro, Deysiane e encomendas para ajudar" : "kits que voltaram das representantes"),
      e("button",{onClick:function(){ p.d({type:"ABA", aba:"controlekits"}); }, title:"Abrir a tela completa", className:"absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black/50"}, "Abrir ›")),
    e("div",{className:"grid grid-cols-[1fr_1.6fr] items-center gap-2 p-2"},
      e("div",{className:"flex flex-col items-center rounded-lg bg-black/25 px-2 py-2 text-center"}, e("b",{className:MONO+" text-[20px] leading-none text-success"}, bipados), e("span",{className:"mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/70"},"Bipados hoje")),
      e("div",{className:"flex flex-col items-center justify-center rounded-lg bg-black/35 px-2 py-1.5 text-center", style:alerta ? {boxShadow:"inset 0 0 0 1px "+cor+"99"} : undefined},
        e("b",{className:MONO+" text-[20px] leading-none", style:{color:cor}}, aguardando), e("span",{className:"mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-white/80"},"Aguardando bipagem"))));
}

// Total de revendedoras do dia: AUTOMÁTICO desde 27/10/2026 (às 18h o servidor pergunta à DevMaster e trava sozinho; ver src/server/revendedoras-dia.js).
// Aqui fica só o status (✓ atualizado às... ou "ainda não chegou hoje") e um "Corrigir", fechado por padrão, para a Diretoria usar se a DevMaster cair.
function AtualizarRevendedoras(p){
  var s = p.s, d = p.d, iso = isoDia(new Date()), hist = s.revendedorasDiario || {}, ks = Object.keys(hist).sort(), ultimo = ks.length ? hist[ks[ks.length-1]] : 0;
  var feito = (s.revAtualizadoEm||{})[iso];
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var q = useState(null), edit = q[0], setEdit = q[1], v = edit===null ? (hist[iso]!==undefined ? hist[iso] : ultimo) : edit;
  var hora = feito ? new Date(feito).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}) : "";
  if(!aberto) return e("div",{className:"flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-black/25 px-2 py-0.5"},
    e("b",{className:"shrink-0 text-[10px] uppercase leading-none tracking-wide text-white/70"},"Revendedoras"),
    feito ? e("span",{className:"text-[12px] text-success"},"✓ Atualizado às "+hora+" · automático (DevMaster)")
          : e("span",{className:"text-[12px] text-white/70"},"Atualiza sozinho às 18h · DevMaster"),
    e(Btn,{v:"ghost", sm:true, className:"ml-auto", onClick:function(){ setAberto(true); }},"Corrigir"));
  return e("div",{className:"flex flex-wrap items-center gap-1.5 rounded-lg bg-black/25 px-2 py-0.5"},
    e("b",{className:"shrink-0 text-[10px] uppercase leading-none tracking-wide text-white/70"},"Revendedoras"),
    e("div",{className:"min-w-[5rem] flex-1"}, e(NumInput,{value:v, onChange:setEdit, className:"w-full! text-center!", "aria-label":"Total de revendedoras hoje"})),
    e(Btn,{v:"ghost", sm:true, onClick:function(){ setAberto(false); }},"Fechar"),
    e(Btn,{v:"primary", sm:true, ic:"save", onClick:function(){ d({type:"REV_REABRIR", data:iso}); d({type:"REV_LANCAR", data:iso, quantidade:v, unico:true}); setEdit(null); setAberto(false); }},"Corrigir e travar"));
}
// Faixa do topo (compacta): 3 totais à esquerda e, do lado direito, os campos que se preenchem todo dia.
// O resto de outubro fica no bloco Faturamento. As colunas têm largura mínima, então nada fica um em cima do outro: se faltar espaço, quebra a linha.
function FaixaRevendedoras(p){
  var s = p.s, d = p.d, ano = new Date().getFullYear(), hist = s.revendedorasDiario || {}, ks = Object.keys(hist).sort();
  var total = ks.length ? hist[ks[ks.length-1]] : 0, quando = ks.length ? ks[ks.length-1].split("-").reverse().slice(0,2).join("/") : "";
  var mesRev = resumoMensalRevendedoras(s, ano).filter(function(l){ return l.atual; })[0], delta = mesRev ? mesRev.delta : null;
  var m = resumoFinanceiro(s, p.janela).mes, fatTotal = m.recebido+m.aReceber;
  var ab = useState(false), abertoFat = ab[0], setAbertoFat = ab[1];   // painel de atualizar o faturamento: abre/fecha pelo ✎ no canto do item (V1-C, 27/10/2026)
  var numero = function(rot, valor, cor, nota, centro){ return e("div",{className:"flex min-w-[11rem] flex-col "+(centro ? "items-center text-center" : "")},
    e("span",{className:"text-[10px] font-bold uppercase tracking-[.12em] text-white/75"}, rot),
    e("b",{className:MONO+" whitespace-nowrap text-[20px] leading-tight "+cor}, valor), nota && (typeof nota==="string" ? e("span",{className:"text-[10.5px] leading-tight text-white/65"}, nota) : nota)); };
  // acertos e média do faturamento: letras maiores e fáceis de ler
  var destaque = function(v, rot){ return e("span",{className:"flex items-baseline gap-1.5"}, e("b",{className:MONO+" whitespace-nowrap text-[15px] leading-tight text-white"}, v), e("span",{className:"text-[11px] font-medium text-white/75"}, rot)); };
  return e("div",{className:"flex flex-col gap-2"},
    e("section",{className:"flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl px-3 py-1.5 ring-2 ring-[#E8B84B]/45", style:{background:"linear-gradient(90deg, rgba(232,184,75,.22), rgba(232,184,75,.05) 70%)"}},
      e("div",{className:"flex flex-wrap items-stretch divide-x divide-[#E8B84B]/25"},
        e("div",{className:"pr-7"}, e("button",{type:"button", title:"Abrir o histórico de revendedoras", onClick:function(){ d({type:"ABA", aba:"revendedoras"}); }, className:"cursor-pointer rounded-lg px-1 text-left transition-colors hover:bg-white/10"},
          numero("Revendedoras · total hoje", num(total), "text-primary", (delta!==null && delta!==undefined ? (delta>=0 ? "+" : "")+num(delta)+" no mês · " : "")+(quando ? "em "+quando : ""), true))),
        e("div",{className:"relative px-7"},
          e("button",{type:"button", title:"Abrir a tela Faturamento", onClick:function(){ d({type:"ABA", aba:"previsaofat"}); }, className:"cursor-pointer rounded-lg px-1 text-left transition-colors hover:bg-white/10"},   // clicar no faturamento abre a tela Faturamento (Marcus, 24/10/2026)
            numero("Faturamento até o momento", BK(m.recebido), "text-success", e("div",{className:"mt-0.5 flex flex-wrap justify-center gap-x-5 gap-y-0.5"}, destaque(num(m.feitos), "acertos"), destaque(num(m.carregar), "no Carregar"), destaque(BK(m.mediaAcerto), "de média")), true)),
          e("button",{type:"button", title:"Atualizar o faturamento de hoje", "aria-label":"Atualizar o faturamento de hoje", onClick:function(){ setAbertoFat(!abertoFat); }, className:"absolute -top-1 right-2 grid size-6 place-items-center rounded-full bg-black/30 text-[12px] text-primary ring-1 ring-primary/30 hover:bg-primary/25"}, "✎")),
        e("div",{className:"pl-7"}, e("button",{type:"button", title:"Abrir a tela Faturamento (previsão)", onClick:function(){ d({type:"ABA", aba:"previsaofat"}); }, className:"cursor-pointer rounded-lg px-1 text-left transition-colors hover:bg-white/10"},
          numero("Previsão de faturamento", BK(fatTotal), "text-success", m.nome.toLowerCase()+" · "+m.metaPct+"% dos previstos", true)))),
      papelDe(s.usuario)==="supervisao" && e("div",{className:"ml-auto min-w-[22rem] max-w-[28rem] flex-1 [&_button]:whitespace-nowrap"}, e(AtualizarRevendedoras,{s:s, d:d}))),
    abertoFat && e(PainelAtualizarHoje,{s:s, d:d, m:m, onFechar:function(){ setAbertoFat(false); }}));
}

// Solicitações que esperam a decisão de quem está logado (pagamentos, preços, efetivações…): a mesma lista dos cartões do SorellyChat, num lugar só
function BlocoSolicitacoes(p){
  useChat();
  var s = p.s, cid = contatoDoLogin(s.usuario), todas = cid ? chatApi.pendencias(cid) : [];
  // só aviso: pedidos de pagamento de venda acima de R$ 2.000,00, no máximo 3 na tela (o resto fica no SorellyChat)
  var totalPag = function(x){ var dec = x.msg.dec, lf = dec.tipo==="pagamento" ? (s.lancFin||[]).find(function(l){ return l.id===dec.refId; }) : null; return lf ? lf.linhas.reduce(function(t, l){ return l.isento ? t : t+(l.valor||0); }, 0) : 0; };
  var grandes = todas.filter(function(x){ return totalPag(x)>2000; }), lista = grandes.slice(0, 3), mais = grandes.length-lista.length;
  if(!lista.length) return null;
  var hhmm = function(t){ var n = new Date(t); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
  return e(BlocoBarra,{cor:"ouro", t:"Solicitações para decidir", sub:"vendas acima de R$ 2.000,00"+(mais>0 ? " · mais "+mais+" no SorellyChat" : "")+" · clique para abrir"},
    e("div",{className:"flex max-h-[13rem] flex-col gap-1 overflow-y-auto p-2"}, lista.map(function(x){
      var dec = x.msg.dec, lf = dec.tipo==="pagamento" ? (s.lancFin||[]).find(function(l){ return l.id===dec.refId; }) : null;
      var titulo = dec.tipo==="pagamento" ? "Pagamento · "+dec.nome : dec.tipo==="preco" ? "Preço · "+dec.modelo : dec.titulo+" · "+contato(dec.pessoa).nome;
      return e("button",{key:x.msg.id, onClick:function(){ chatEfem({conversaSel:x.conv, abaInicial:x.msg.aba || "geral"}); p.d({type:"ABA", aba:"whats"}); },
        className:"flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-left text-[12.5px] hover:bg-black/40", style:{boxShadow:"inset 3px 0 0 #f59e0b"}},
        e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate"}, titulo),
          e("span",{className:"text-[11px] text-white/65"}, (lf ? statusPedidoFin(lf).t : "aguardando decisão")+" · "+contato(x.msg.de).nome.split(" ")[0]+" · "+hhmm(x.msg.t))),
        e("span",{className:"shrink-0 text-primary"},"›")); })));
}

// ── Revendedoras que vêm à empresa (atendimento interno): média de vendas de cada uma. Puxa do APP; se o app tiver menos de R$ 500, usa a média
// das vendas anteriores (DevMaster). R$ 3.000 a 3.999 = destaque âmbar · R$ 4.000 ou mais = verde. ──
var MIN_VENDA_APP = 500, FAIXA_ALTA = 3000, FAIXA_TOPO = 4000;
function mediaVendasDe(it){
  var app = it.vendaApp||0, ant = (it.vendasAnt||[]).filter(function(v){ return v>0; });
  var usaApp = app>=MIN_VENDA_APP, base = usaApp ? [app].concat(ant) : ant;
  return {media:base.length ? base.reduce(function(a,b){ return a+b; },0)/base.length : 0, fonte:usaApp ? "app" : "média anterior"};
}
// atrasada = passou 15 min da hora marcada sem chegar (ou chegou depois disso) e ainda não foi atendida nem cancelada
var minDe = function(t){ var q = String(t||"").split(":"); return (+q[0])*60+(+q[1]||0); };
function atrasadaDe(x, dia){
  if(x.status==="acertado" || x.status==="cancelado") return false;
  var limite = minDe(x.hora)+15, hoje = isoDia(new Date());
  if(x.chegada) return minDe(x.chegada)>limite;
  if(dia<hoje) return true; if(dia>hoje) return false;
  var n = new Date(); return n.getHours()*60+n.getMinutes()>limite;
}
function ResumoDia(p){
  var l = p.lista, atend = l.filter(function(x){ return x.status==="acertado"; }).length, canc = l.filter(function(x){ return x.status==="cancelado"; }).length;
  var atras = l.filter(function(x){ return atrasadaDe(x, p.dia); }).length, faltam = l.length-atend-canc;
  var cel = function(t, v, cor){ return e("div",{key:t, className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-1 py-1 text-center"},
    e("span",{className:"text-[9px] font-semibold uppercase leading-tight tracking-wide text-white/65"}, t), e("b",{className:MONO+" text-[17px] leading-tight "+(cor||"")}, v)); };
  return e("div",{className:"grid grid-cols-5 gap-1.5"}, cel("Atendimentos", l.length, "text-primary"), cel("Atendidas", atend, "text-success"), cel("Faltam", faltam, "text-white"), cel("Canceladas", canc, canc ? "text-destructive" : "text-white/70"), cel("Atrasadas", atras, atras ? "text-warning" : "text-white/70"));
}
var MIN_DESTAQUE = 2000;
function ListaRevsEmpresa(p){
  var s = p.s, dia = p.dia, d = p.d;
  var lista = p.lista.filter(function(x){ return mediaVendasDe(x).media>=MIN_DESTAQUE; });   // só quem vende acima de R$ 2.000 (pedido do Marcus, 19/10/2026): a lista inteira fica em Atendimento interno
  var cor = function(m){ return m>=FAIXA_TOPO ? ["#16A34A33","#4ADE80"] : m>=FAIXA_ALTA ? ["#F59E0B33","#FBBF24"] : [null,null]; };
  // só 5 revendedoras aparecem de uma vez; o resto rola
  return e("div",{className:"flex max-h-[13.5rem] flex-col gap-1 overflow-y-auto p-2"}, lista.length===0 ? e("p",{className:"p-3 text-center text-[12.5px] text-white/70"},"Nenhuma revendedora acima de R$ 2.000 neste dia.") : lista.map(function(x){
      var m = mediaVendasDe(x), c = cor(m.media), feito = x.status==="acertado", canc = x.status==="cancelado", atras = atrasadaDe(x, dia);
      return e("div",{key:x.id, className:"flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1 text-[12.5px] "+(canc ? "opacity-50" : ""), style:{background:c[0] || "rgba(0,0,0,.22)", boxShadow:atras ? "inset 3px 0 0 #F59E0B" : c[1] ? "inset 3px 0 0 "+c[1] : undefined}},
        e("b",{className:MONO+" w-12 shrink-0 text-[15px] leading-none"}, x.hora||"—"),
        e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate "+(canc ? "line-through" : "")}, (feito ? "✓ " : "")+x.nome), e("span",{className:"text-[10.5px] "+(atras ? "font-semibold text-warning" : "text-white/65")}, canc ? "cancelada" : atras ? "atrasada" : m.fonte)),
        e("b",{className:MONO+" shrink-0 text-[13px]", style:c[1] ? {color:c[1]} : undefined}, m.media>0 ? BK(m.media) : "—"),
        !feito && d && e("button",{onClick:function(){ d({type:"INT_CANCELAR", id:x.id, cancelar:!canc}); }, title:canc ? "Reativar" : "Cancelar este atendimento", "aria-label":canc ? "Reativar atendimento" : "Cancelar atendimento", className:"grid size-6 shrink-0 place-items-center rounded-md bg-black/30 text-[13px] font-bold hover:bg-black/50"}, canc ? "↺" : "×")); }));
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
  var lista = (p.s.internos||[]).filter(function(x){ return x.data===dia; }).sort(function(a,b){ return (a.hora||"") < (b.hora||"") ? -1 : 1; });
  return e(BlocoInternoHoje,{semLista:true, ir:"intlist", dia:dia}, cab, e(ResumoDia,{lista:lista, dia:dia}), e(ListaRevsEmpresa,{s:p.s, d:p.d, dia:dia, lista:lista}));
}

// acesso rápido à visão de cada app de celular (os apps também ficam dentro dos setores Kits e Representantes)
function AbaVisaoGeral(){
  var cx = use(), s = cx.state, d = cx.dispatch, raiz = useRef(null);
  useContagemNaTela(raiz);   // ao abrir, todos os números começam em zero e correm até o valor
  var hoje = new Date(), ano = hoje.getFullYear(), mes = hoje.getMonth();
  var jg = useState(2), janelaGrafico = jg[0], setJanelaGrafico = jg[1];
  var janelaFat = Math.min(janelaGrafico, 5);   // o seletor de dias (7, 15, 30, 60, 90, mês) comanda a projeção de revendedoras e de faturamento em toda a tela
  return e("div",{ref:raiz, className:"contents"},
    e(PageHead,{t:"Dashboard", sub:"Crescimento de revendedoras e resultado do ano, sempre atualizados."},
      e("button",{onClick:function(){ d({type:"ABA", aba:"previsaofat"}); }, title:"Previsão do ano até dezembro, novembro e dezembro", className:"flex h-8 min-w-24 items-center justify-center gap-1.5 rounded-lg bg-primary/20 px-3 text-[13px] font-semibold ring-1 ring-primary hover:bg-primary/30"}, e(Icon,{n:"config", s:13}), "Previsão do ano ›")),
    e(FaixaRevendedoras,{s:s, d:d, janela:janelaFat}),
    // 3 colunas da mesma altura (os blocos esticam pra ficar alinhados embaixo também)
    e("div",{className:"grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr_0.85fr] xl:[&>div]:flex xl:[&>div]:flex-col xl:[&>div]:gap-4 xl:[&>div>*:last-child]:flex-1"},
      e("div",null,
        // Acertos → Bipagem de retorno → Solicitações → Atendimento interno ("Hoje na empresa" saiu daqui, 27/10/2026, pedido do Marcus)
        e(BlocoAcertosMes,{s:s, d:d, janela:janelaFat}),
        e(BlocoBipagemRetorno,{s:s, d:d}),
        e(BlocoSolicitacoes,{s:s, d:d}),
        e(AtendimentoInternoVG,{s:s, d:d})),
      e("div",null, e(BlocoInadimp,{s:s}), e(BlocoFaturamento,{s:s, d:d, janela:janelaFat})),
      e("div",null, e(BlocoPessoas,{s:s, d:d}), e(BlocoIlf,{s:s}))),
    e("div",{className:"mt-4 grid grid-cols-1 items-start gap-4"},
      e(BlocoBarra,{fixo:true, t:"Crescimento de revendedoras", sub:"escolha quantos dias mostrar — sempre com a projeção até dezembro junto"},
        e("div",{className:"flex flex-col gap-1.5 p-2"},
          e("div",{className:"flex flex-wrap gap-1.5"},
            JANELAS_GRAFICO_REV.map(function(x,i){ return e("button",{key:i, onClick:function(){setJanelaGrafico(i);},
              className:"rounded-lg px-2.5 py-1 text-[11.5px] font-semibold ring-1 "+(janelaGrafico===i ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x.lb); })),
          e(GraficoColunasRevendedoras,{pontos:pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:janelaFat}, JANELAS_GRAFICO_REV[janelaGrafico])),
            opcoes:{janelas:JANELAS_GRAFICO_REV, indice:janelaGrafico, calcular:function(i){ return pontosRevendedoras(s, Object.assign({projetarMeses:11-mes, janela:janelaFat}, JANELAS_GRAFICO_REV[i])); }}}),
          e(TabelaCrescimento,{s:s, ano:ano, janela:janelaFat, dentro:true})))));
}

export { AbaVisaoGeral, TabelaRevendedorasMeses };
