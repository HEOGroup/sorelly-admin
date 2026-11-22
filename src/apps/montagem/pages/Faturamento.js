// Sorelly Admin · montagem — pages/Faturamento.js
// Financeiro › Receber › Faturamento, REFEITA no padrão do Financeiro de 12/11/2026 (o mesmo da tela Contas a pagar): UM bloco com a barra azul de título, uma faixa azul de controles no alto
// (abas, mês e ano, e as visões do Dia a dia) e a tabela encostada nas bordas. Sem bloco de filtros e sem faixa de totais: o filtro fica no nome de cada coluna.
// Abas: Dia a dia (Faturamento · Contas pagas · Saldo) · Acertos · Mês a mês (12 meses lado a lado + detalhe editável) · Previsão (tudo previsão, separada) · Lançar (formulário do dia).
// Os números vêm das mesmas fontes de sempre (faturamentoDiario, restanteDia, contasPagasDiario, fechaMes), então batem com a Visão geral. Quem edita: autorização faturamento_edita.
import { Botao, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { DiaADia } from "@/apps/montagem/components/tabela-faturamento-dia";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { fatEfetivo, MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { use } from "@/apps/montagem/state/context";
import { MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

// grupo de botões juntos sobre a faixa azul (mesmo desenho da tela Contas a pagar)
var grupoBtn = function(ops, atual, aoMudar){ return e("div",{className:"inline-flex overflow-hidden rounded-md border border-white/50"}, ops.map(function(o, i){ var on = atual===o[0]; return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ aoMudar(o[0]); }, className:"h-8 px-3 text-[13px] font-semibold normal-case "+(i ? "border-l border-white/50 " : "")+(on ? "bg-white text-[#14233f]" : "text-white hover:bg-white/15")}, o[1]); })); };
var SEL = "h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]";

// LANÇAR (Marcus, 16/11/2026): faixa azul única e organizada. Em cima: o botão Faturamento | Resultado do mês, o mês, o ano e as 3 ações à direita. Embaixo: "Lançar dd/mm" e os 5 campos do MESMO tamanho, centralizados.
// Mesmas ações de sempre: FAT_HOJE (provisório), FAT_FIXAR (valor certo), FECHA_MES_SET (previstos), REV_LANCAR. Só quem tem a autorização faturamento_edita vê esta parte.
function LancarLinha(p){
  var s = p.s, d = p.d, hoje = iso(new Date()), fd = fatEfetivo(s), ks = Object.keys(fd).sort(), ult = ks.length ? fd[ks[ks.length-1]] : {};
  var ym = hoje.slice(0,7), fm = (s.fechaMes||{})[ym] || {};
  var revs = Object.keys(s.revendedorasDiario||{}).sort(), revAtual = revs.length ? s.revendedorasDiario[revs[revs.length-1]] : 0;
  var a = useState(ult.recebido||0), rec = a[0], setRec = a[1], b = useState(ult.acertos||0), ace = b[0], setAce = b[1];
  var c = useState(fm.carregar||0), car = c[0], setCar = c[1], f = useState(fm.aRealizar||0), arz = f[0], setArz = f[1], g = useState(revAtual), rev = g[0], setRev = g[1];
  var fixado = !!(s.faturamentoDiario||{})[hoje];
  // 16/11/2026 (Marcus: "tá errado isso aparecendo lá em cima"): os campos nasciam com os valores de quando a tela abriu e não acompanhavam o que chega do servidor (dia lançado, Carregar, a realizar, revendedoras). Agora refazem quando o dado de origem muda.
  useEffect(function(){ setRec(ult.recebido||0); setAce(ult.acertos||0); }, [ult.recebido, ult.acertos]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ setCar(fm.carregar||0); setArz(fm.aRealizar||0); }, [fm.carregar, fm.aRealizar]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ setRev(revAtual); }, [revAtual]);   // eslint-disable-line react-hooks/exhaustive-deps
  var campo = function(t, id, el){ return e("div",{className:"min-w-0"}, e("div",{className:"text-center"}, e(Rotulo,{t:t, id:id})), el); };
  var NUM = "h-8! w-full! px-2! text-center! text-[13px]!";
  return e("div",{className:"border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] [&_label]:!text-white"},
    e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1"}, p.topo, e("span",{className:"flex-1"}),
      e("div",{className:"flex shrink-0 gap-2"},
        e(Botao,{onClick:function(){ d({type:"FECHA_MES_SET", ym:ym, aRealizar:arz, carregar:car}); d({type:"REV_LANCAR", data:hoje, quantidade:rev}); }}, "Salvar previstos"),
        fixado
          ? e(Botao,{onClick:function(){ d({type:"FAT_REABRIR", data:hoje}); }}, "Reabrir dia")
          : [e(Botao,{key:"h", onClick:function(){ d({type:"FAT_HOJE", data:hoje, recebido:rec, acertos:ace}); }}, "Atualizar hoje"), e(Botao,{key:"f", principal:true, onClick:function(){ d({type:"FAT_FIXAR", data:hoje, recebido:rec, acertos:ace}); }}, "Fixar dia")])),
    e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-1 border-t border-white/25 px-2 py-2 lg:grid-cols-[7rem_repeat(5,minmax(0,1fr))]"},
      e("b",{className:"col-span-2 self-center text-[13px] font-semibold text-white lg:col-span-1"}, "Lançar "+hoje.split("-").reverse().slice(0,2).join("/")+(fixado ? " · dia fixado" : "")),
      campo("Recebido no mês", "l-rec", e(MoneyInput,{value:rec, onChange:setRec, sm:true, className:"w-full text-center! text-[13px]!", label:"Recebido no mês"})),
      campo("Acertos no mês", "l-ace", e(NumInput,{value:ace, onChange:setAce, label:"Acertos no mês", className:NUM})),
      campo("Vendas no Carregar", "l-car", e(NumInput,{value:car, onChange:setCar, label:"Vendas no Carregar", className:NUM})),
      campo("Acertos a realizar", "l-arz", e(NumInput,{value:arz, onChange:setArz, label:"Acertos a realizar", className:NUM})),
      campo("Revendedoras", "l-rev", e(NumInput,{value:rev, onChange:setRev, label:"Revendedoras", className:NUM}))));
}

function AbaFaturamento(p){
  p = p || {};
  var cx = use(), s = cx.state, d = cx.dispatch, agora = new Date();
  var st = useState({ano:agora.getFullYear(), mes:agora.getMonth()}), ref = st[0], setRef = st[1];
  var sv = useState("fat"), visao = sv[0], setVisao = sv[1];
  var pode = temAutorizacao("faturamento_edita", s.usuario);
  var anos = [agora.getFullYear()-1, agora.getFullYear(), agora.getFullYear()+1];
  // UMA tela só (Marcus, 16/11/2026): faturamento e acertos por dia, com contas pagas e resultado do mês. Saíram Acertos, Mês a mês e Previsão.
  var topo = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"},
    grupoBtn([["fat","Faturamento"], ["res","Resultado do mês"]], visao, setVisao),
    e("select",{"aria-label":"Mês", value:String(ref.mes), onChange:function(ev){ setRef({ano:ref.ano, mes:Number(ev.target.value)}); }, className:SEL}, MESES_LONGO.map(function(m, i){ return e("option",{key:i, value:String(i)}, m); })),
    e("select",{"aria-label":"Ano", value:String(ref.ano), onChange:function(ev){ setRef({ano:Number(ev.target.value), mes:ref.mes}); }, className:SEL}, anos.map(function(a){ return e("option",{key:a, value:String(a)}, a); })));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Faturamento", compacto:true},
      pode ? e(LancarLinha,{s:s, d:d, topo:topo}) : e("div",{className:"border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1"}, topo),
      e(DiaADia,{s:s, ano:ref.ano, mes:ref.mes, visao:visao})));
}

export { AbaFaturamento };
