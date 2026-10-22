// Sorelly Admin · montagem — pages/Faturamento.js
// TELA DE REFERÊNCIA do padrão do Financeiro (regra fixa do Marcus, 22/10/2026; texto no fim de PADRAO-VISUAL.md). Toda tela do Financeiro copia esta estrutura:
//   título + botão de ação · bloco Filtros (grade de 4 colunas, 32 px) · faixa de totais (rótulo + valor) · abas visíveis · tabela(s) no padrão (components/padrao-fin.js).
// Abas: Dia a dia (faturamento × contas, só resultado) · Mês a mês (12 meses lado a lado + detalhe editável) · Previsão (tudo previsão, separada) · Lançar (formulário do dia).
// Os números vêm das mesmas fontes de sempre (faturamentoDiario, contasPagasDiario, contasPagar, fechaMes), então batem com a Visão geral. Quem edita: autorização faturamento_edita.
import { AbasTela, BlocoFiltros, Botao, COR, CampoSel, FaixaTotais, Rotulo, corSinal, brl } from "@/apps/montagem/components/padrao-fin";
import { FluxoMensal } from "@/apps/montagem/components/fluxo-mensal";
import { PrevisaoMeses, ResumoMesAno } from "@/apps/montagem/components/previsao-meses";
import { DiaADia } from "@/apps/montagem/components/tabela-faturamento-dia";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { contasDoMes, fatEfetivo, MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { BKC } from "@/apps/montagem/lib/format";
import { AbaConsolidadoFaturamento } from "@/apps/montagem/pages/ConsolidadoFaturamento";
import { use } from "@/apps/montagem/state/context";
import { MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var n0 = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var ABAS = [["dia","Dia a dia"],["mes","Mês a mês"],["prev","Previsão"]];

// aba Lançar: o que o Marcus (ou quem tiver a autorização) lança no dia. Mesmas ações de sempre: FAT_HOJE (provisório), FAT_FIXAR (valor certo), FECHA_MES_SET (previstos), REV_LANCAR.
function Lancar(p){
  var s = p.s, d = p.d, hoje = iso(new Date()), fd = fatEfetivo(s), ks = Object.keys(fd).sort(), ult = ks.length ? fd[ks[ks.length-1]] : {};
  var ym = hoje.slice(0,7), fm = (s.fechaMes||{})[ym] || {};
  var revs = Object.keys(s.revendedorasDiario||{}).sort(), revAtual = revs.length ? s.revendedorasDiario[revs[revs.length-1]] : 0;
  var a = useState(ult.recebido||0), rec = a[0], setRec = a[1], b = useState(ult.acertos||0), ace = b[0], setAce = b[1];
  var c = useState(fm.carregar||0), car = c[0], setCar = c[1], f = useState(fm.aRealizar||0), arz = f[0], setArz = f[1], g = useState(revAtual), rev = g[0], setRev = g[1];
  var fixado = !!(s.faturamentoDiario||{})[hoje];
  var campo = function(t, id, el){ return e("div",{className:"min-w-0"}, e(Rotulo,{t:t, id:id}), el); };
  return e("div",{className:"flex flex-col gap-2"},
    e("h3",{className:"text-[13px] font-semibold text-foreground"}, "Lançar · "+hoje.split("-").reverse().slice(0,2).join("/")+(fixado ? " · dia fixado" : "")),
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
  var ab = useState("dia"), aba = ab[0], setAba = ab[1];
  var pode = temAutorizacao("faturamento_edita", s.usuario);
  var abas = pode ? ABAS.concat([["lanc","Lançar"]]) : ABAS;
  // totais do mês escolhido (último lançamento do mês; contas pagas = soma dos dias)
  var fd = fatEfetivo(s), pref = ref.ano+"-"+String(ref.mes+1).padStart(2,"0"), ks = Object.keys(fd).filter(function(k){ return k.slice(0,7)===pref; }).sort(), reg = ks.length ? fd[ks[ks.length-1]] : {};
  var rec = reg.recebido||0, ace = reg.acertos||0, pago = contasDoMes(s, String(ref.ano), ref.mes).pago||0, res = rec-pago;
  var anos = [agora.getFullYear()-1, agora.getFullYear(), agora.getFullYear()+1];
  var limpar = ref.ano!==agora.getFullYear() || ref.mes!==agora.getMonth();
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex h-10 items-center justify-between gap-2"},
      e("h1",{className:"truncate text-[16px] font-semibold text-foreground"}, "Faturamento")),
    aba!=="lanc" && e(BlocoFiltros,{onLimpar:limpar ? function(){ setRef({ano:agora.getFullYear(), mes:agora.getMonth()}); } : null},
      e(CampoSel,{t:"Mês", id:"f-mes", value:String(ref.mes), onChange:function(v){ setRef({ano:ref.ano, mes:Number(v)}); }, opcoes:MESES_LONGO.map(function(m, i){ return [String(i), m]; })}),
      e(CampoSel,{t:"Ano", id:"f-ano", value:String(ref.ano), onChange:function(v){ setRef({ano:Number(v), mes:ref.mes}); }, opcoes:anos.map(function(a){ return [String(a), String(a)]; })})),
    e(FaixaTotais,{itens:[{t:"Recebido", v:BKC(rec), cor:COR.entra},{t:"Pago", v:BKC(pago), cor:COR.sai},{t:"Resultado", v:brl(res), cor:corSinal(res)},{t:"Acertos", v:n0(ace)},{t:"Média", v:ace>0 ? BKC(rec/ace) : "—"}]}),
    e(AbasTela,{abas:abas, atual:aba, onMudar:setAba}),
    aba==="dia" && e(DiaADia,{s:s, ano:ref.ano, mes:ref.mes}),
    aba==="mes" && e("div",{className:"flex flex-col gap-3"}, e(FluxoMensal,{s:s, ano:ref.ano}), e(AbaConsolidadoFaturamento,{ano:ref.ano})),
    aba==="prev" && e("div",{className:"flex flex-col gap-3"}, e(ResumoMesAno,{s:s}), e(PrevisaoMeses,{s:s}), p.extraPrevisao),
    aba==="lanc" && pode && e(Lancar,{s:s, d:d}));
}

export { AbaFaturamento };
