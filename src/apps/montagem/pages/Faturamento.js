// Sorelly Admin · montagem — pages/Faturamento.js
// Financeiro › Receber › Faturamento, REFEITA no padrão do Financeiro de 12/11/2026 (o mesmo da tela Contas a pagar): UM bloco com a barra azul de título, uma faixa azul de controles no alto
// (abas, mês e ano, e as visões do Dia a dia) e a tabela encostada nas bordas. Sem bloco de filtros e sem faixa de totais: o filtro fica no nome de cada coluna.
// Abas: Dia a dia (Faturamento · Contas pagas · Saldo) · Acertos · Mês a mês (12 meses lado a lado + detalhe editável) · Previsão (tudo previsão, separada) · Lançar (formulário do dia).
// Os números vêm das mesmas fontes de sempre (faturamentoDiario, restanteDia, contasPagasDiario, fechaMes), então batem com a Visão geral. Quem edita: autorização faturamento_edita.
import { Botao, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { AcertosRestantes } from "@/apps/montagem/components/acertos-restantes";
import { FluxoMensal } from "@/apps/montagem/components/fluxo-mensal";
import { CarregarMes, PrevisaoMeses, ResumoMesAno } from "@/apps/montagem/components/previsao-meses";
import { DiaADia, VISOES } from "@/apps/montagem/components/tabela-faturamento-dia";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { fatEfetivo, MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { AbaConsolidadoFaturamento } from "@/apps/montagem/pages/ConsolidadoFaturamento";
import { use } from "@/apps/montagem/state/context";
import { MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var ABAS = [["dia","Dia a dia"],["acertos","Acertos"],["mes","Mês a mês"],["prev","Previsão"]];

// grupo de botões juntos sobre a faixa azul (mesmo desenho da tela Contas a pagar)
var grupoBtn = function(ops, atual, aoMudar){ return e("div",{className:"inline-flex overflow-hidden rounded-md border border-white/50"}, ops.map(function(o, i){ var on = atual===o[0]; return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ aoMudar(o[0]); }, className:"h-8 px-3 text-[13px] font-semibold normal-case "+(i ? "border-l border-white/50 " : "")+(on ? "bg-white text-[#14233f]" : "text-white hover:bg-white/15")}, o[1]); })); };
var SEL = "h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]";

// aba Lançar: o que o Marcus (ou quem tiver a autorização) lança no dia. Mesmas ações de sempre: FAT_HOJE (provisório), FAT_FIXAR (valor certo), FECHA_MES_SET (previstos), REV_LANCAR.
function Lancar(p){
  var s = p.s, d = p.d, hoje = iso(new Date()), fd = fatEfetivo(s), ks = Object.keys(fd).sort(), ult = ks.length ? fd[ks[ks.length-1]] : {};
  var ym = hoje.slice(0,7), fm = (s.fechaMes||{})[ym] || {};
  var revs = Object.keys(s.revendedorasDiario||{}).sort(), revAtual = revs.length ? s.revendedorasDiario[revs[revs.length-1]] : 0;
  var a = useState(ult.recebido||0), rec = a[0], setRec = a[1], b = useState(ult.acertos||0), ace = b[0], setAce = b[1];
  var c = useState(fm.carregar||0), car = c[0], setCar = c[1], f = useState(fm.aRealizar||0), arz = f[0], setArz = f[1], g = useState(revAtual), rev = g[0], setRev = g[1];
  var fixado = !!(s.faturamentoDiario||{})[hoje];
  var campo = function(t, id, el){ return e("div",{className:"min-w-0"}, e(Rotulo,{t:t, id:id}), el); };
  return e("div",{className:"flex flex-col gap-2 p-2"},
    e("h3",{className:"text-center text-[13px] font-semibold text-foreground"}, "Lançar · "+hoje.split("-").reverse().slice(0,2).join("/")+(fixado ? " · dia fixado" : "")),
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      campo("Recebido no mês", "l-rec", e(MoneyInput,{value:rec, onChange:setRec, sm:true, className:"w-full text-[13px]!", label:"Recebido no mês"})),
      campo("Acertos no mês", "l-ace", e(NumInput,{value:ace, onChange:setAce, label:"Acertos no mês", className:"h-8! w-full! px-2! text-[13px]!"})),
      campo("Vendas no Carregar", "l-car", e(NumInput,{value:car, onChange:setCar, label:"Vendas no Carregar", className:"h-8! w-full! px-2! text-[13px]!"})),
      campo("Acertos a realizar", "l-arz", e(NumInput,{value:arz, onChange:setArz, label:"Acertos a realizar", className:"h-8! w-full! px-2! text-[13px]!"})),
      campo("Revendedoras", "l-rev", e(NumInput,{value:rev, onChange:setRev, label:"Revendedoras", className:"h-8! w-full! px-2! text-[13px]!"})),
      e("div",{className:"col-span-2 flex flex-wrap items-end justify-end gap-2 md:col-start-3"},
        e(Botao,{onClick:function(){ d({type:"FECHA_MES_SET", ym:ym, aRealizar:arz, carregar:car}); d({type:"REV_LANCAR", data:hoje, quantidade:rev}); }}, "Salvar previstos"),
        fixado
          ? e(Botao,{onClick:function(){ d({type:"FAT_REABRIR", data:hoje}); }}, "Reabrir dia")
          : [e(Botao,{key:"h", onClick:function(){ d({type:"FAT_HOJE", data:hoje, recebido:rec, acertos:ace}); }}, "Atualizar hoje"), e(Botao,{key:"f", principal:true, onClick:function(){ d({type:"FAT_FIXAR", data:hoje, recebido:rec, acertos:ace}); }}, "Fixar dia")])));
}

function AbaFaturamento(p){
  p = p || {};
  var cx = use(), s = cx.state, d = cx.dispatch, agora = new Date();
  var st = useState({ano:agora.getFullYear(), mes:agora.getMonth()}), ref = st[0], setRef = st[1];
  var ab = useState("dia"), aba = ab[0], setAba = ab[1], sv = useState("fat"), visao = sv[0], setVisao = sv[1];
  var pode = temAutorizacao("faturamento_edita", s.usuario);
  var abas = pode ? ABAS.concat([["lanc","Lançar"]]) : ABAS;
  var anos = [agora.getFullYear()-1, agora.getFullYear(), agora.getFullYear()+1];
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Faturamento", compacto:true},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"},
        grupoBtn(abas, aba, setAba),
        aba==="dia" && grupoBtn(VISOES, visao, setVisao),
        aba!=="lanc" && e("select",{"aria-label":"Mês", value:String(ref.mes), onChange:function(ev){ setRef({ano:ref.ano, mes:Number(ev.target.value)}); }, className:SEL}, MESES_LONGO.map(function(m, i){ return e("option",{key:i, value:String(i)}, m); })),
        aba!=="lanc" && e("select",{"aria-label":"Ano", value:String(ref.ano), onChange:function(ev){ setRef({ano:Number(ev.target.value), mes:ref.mes}); }, className:SEL}, anos.map(function(a){ return e("option",{key:a, value:String(a)}, a); }))),
      aba==="dia" && e(DiaADia,{s:s, ano:ref.ano, mes:ref.mes, visao:visao}),
      aba==="acertos" && e("div",{className:"p-2"}, e(AcertosRestantes,{s:s, ano:ref.ano, mes:ref.mes})),
      aba==="mes" && e("div",{className:"flex flex-col gap-3 p-2"}, e(FluxoMensal,{s:s, ano:ref.ano}), e(AbaConsolidadoFaturamento,{ano:ref.ano})),
      aba==="prev" && e("div",{className:"flex flex-col gap-3 p-2"}, e(ResumoMesAno,{s:s}), e(CarregarMes,{s:s, d:pode ? d : null}), e(PrevisaoMeses,{s:s}), p.extraPrevisao),
      aba==="lanc" && pode && e(Lancar,{s:s, d:d})));
}

export { AbaFaturamento };
