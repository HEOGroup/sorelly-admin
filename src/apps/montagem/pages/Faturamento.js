// Sorelly Admin · montagem — pages/Faturamento.js
// Financeiro › Receber › Faturamento, REFEITA no padrão do Financeiro de 12/11/2026 (o mesmo da tela Contas a pagar): UM bloco com a barra azul de título, uma faixa azul de controles no alto
// (abas, mês e ano, e as visões do Dia a dia) e a tabela encostada nas bordas. Sem bloco de filtros e sem faixa de totais: o filtro fica no nome de cada coluna.
// Abas: Dia a dia (Faturamento · Contas pagas · Saldo) · Acertos · Mês a mês (12 meses lado a lado + detalhe editável) · Previsão (tudo previsão, separada) · Lançar (formulário do dia).
// Os números vêm das mesmas fontes de sempre (faturamentoDiario, restanteDia, contasPagasDiario, fechaMes), então batem com a Visão geral. Quem edita: autorização faturamento_edita.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BarraTabela, CelulaBarra, CampoMini } from "@/apps/montagem/components/planilha-cheia";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { DiaADia } from "@/apps/montagem/components/tabela-faturamento-dia";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { fatEfetivo, MESES_LONGO } from "@/apps/montagem/domain/financeiro";
import { use } from "@/apps/montagem/state/context";
import { MoneyInput, NumInput } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

var iso = function(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };

// TELA COMPACTA NO PADRÃO DAS OUTRAS TABELAS (Marcus, 23/11/2026: "muda a estrutura igual às outras tabelas, linhas mais simples, alinhadas, os botões"): UMA barra azul em forma de tabela (a mesma da Contas a pagar da Família),
// cada controle numa célula com o título em cima: Visão · Mês · Ano · Recebido por · os 5 campos do dia · os botões. Campos e botões de 18 px, letra de 10 px.
// Mesmas ações de sempre: FAT_HOJE (provisório), FAT_FIXAR (valor certo), FECHA_MES_SET (previstos), REV_LANCAR. Só quem tem a autorização faturamento_edita vê os campos e os botões.
var FUNDO_FAT = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c]";   // azul-marinho da Home do Financeiro familiar
var NUM = "!h-[18px] !w-20 !px-1 !text-center !text-[10px] !leading-none";   // padrao-ok: campo de 18 px e letra de 10 px, como a barra da Contas a receber (20/11/2026)
function CamposDia(p){
  var s = p.s, d = p.d, hoje = iso(new Date()), fd = fatEfetivo(s), ks = Object.keys(fd).sort(), ult = ks.length ? fd[ks[ks.length-1]] : {};
  var ym = hoje.slice(0,7), fm = (s.fechaMes||{})[ym] || {};
  var revs = Object.keys(s.revendedorasDiario||{}).sort(), revAtual = revs.length ? s.revendedorasDiario[revs[revs.length-1]] : 0;
  var a = useState(ult.recebido||0), rec = a[0], setRec = a[1], b = useState(ult.acertos||0), ace = b[0], setAce = b[1];
  var c = useState(fm.carregar||0), car = c[0], setCar = c[1], f = useState(fm.aRealizar||0), arz = f[0], setArz = f[1], g = useState(revAtual), rev = g[0], setRev = g[1];
  var fixado = !!(s.faturamentoDiario||{})[hoje];
  // 16/11/2026 (Marcus: "tá errado isso aparecendo lá em cima"): os campos refazem quando o dado de origem muda (dia lançado, Carregar, a realizar, revendedoras).
  useEffect(function(){ setRec(ult.recebido||0); setAce(ult.acertos||0); }, [ult.recebido, ult.acertos]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ setCar(fm.carregar||0); setArz(fm.aRealizar||0); }, [fm.carregar, fm.aRealizar]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ setRev(revAtual); }, [revAtual]);   // eslint-disable-line react-hooks/exhaustive-deps
  var cel = function(t, el){ return e(CelulaBarra,{key:t, rotulo:t}, el); };
  var dia = hoje.split("-").reverse().slice(0,2).join("/");
  return [
    cel("Recebido no mês", e(MoneyInput,{value:rec, onChange:setRec, label:"Recebido no mês", className:NUM+" !w-28"})),
    cel("Acertos no mês", e(NumInput,{value:ace, onChange:setAce, label:"Acertos no mês", className:NUM})),
    cel("Vendas no Carregar", e(NumInput,{value:car, onChange:setCar, label:"Vendas no Carregar", className:NUM})),
    cel("Acertos a realizar", e(NumInput,{value:arz, onChange:setArz, label:"Acertos a realizar", className:NUM})),
    cel("Revendedoras", e(NumInput,{value:rev, onChange:setRev, label:"Revendedoras", className:NUM})),
    cel("Lançar "+dia+(fixado ? " · fixado" : ""), e("div",{className:"flex gap-1"},
      e("button",{type:"button", onClick:function(){ d({type:"FECHA_MES_SET", ym:ym, aRealizar:arz, carregar:car}); d({type:"REV_LANCAR", data:hoje, quantidade:rev}); }}, "Salvar previstos"),
      fixado
        ? e("button",{type:"button", onClick:function(){ d({type:"FAT_REABRIR", data:hoje}); }}, "Reabrir dia")
        : [e("button",{key:"h", type:"button", onClick:function(){ d({type:"FAT_HOJE", data:hoje, recebido:rec, acertos:ace}); }}, "Atualizar hoje"), e("button",{key:"f", type:"button", onClick:function(){ d({type:"FAT_FIXAR", data:hoje, recebido:rec, acertos:ace}); }}, "Fixar dia")]))
  ];
}

function AbaFaturamento(p){
  p = p || {};
  var cx = use(), s = cx.state, d = cx.dispatch, agora = new Date();
  var st = useState({ano:agora.getFullYear(), mes:agora.getMonth()}), ref = st[0], setRef = st[1];
  var sv = useState("fat"), visao = sv[0], setVisao = sv[1], sb = useState("nf"), base = sb[0], setBase = sb[1];
  var pode = temAutorizacao("faturamento_edita", s.usuario);
  var anos = [agora.getFullYear()-1, agora.getFullYear(), agora.getFullYear()+1];
  // UMA tela só (Marcus, 16/11/2026): faturamento e acertos por dia, com contas pagas e resultado do mês.
  var barra = e(BarraTabela,null,
    e(CelulaBarra,{rotulo:"Visão"}, e(CampoMini,{valor:visao, aoMudar:setVisao, rotulo:"Visão", ops:[["fat", "Faturamento"], ["res", "Resultado do mês"]]})),
    e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:String(ref.mes), aoMudar:function(v){ setRef({ano:ref.ano, mes:Number(v)}); }, rotulo:"Mês", ops:MESES_LONGO.map(function(m, i){ return [String(i), m]; })})),
    e(CelulaBarra,{rotulo:"Ano"}, e(CampoMini,{valor:String(ref.ano), aoMudar:function(v){ setRef({ano:Number(v), mes:ref.mes}); }, rotulo:"Ano", ops:anos.map(function(a){ return [String(a), String(a)]; })})),
    visao==="res" && e(CelulaBarra,{rotulo:"Recebido por"}, e(CampoMini,{valor:base, aoMudar:setBase, rotulo:"Recebido por", ops:[["nf", "Notas fiscais"], ["cr", "Contas a receber"]]})),
    pode && e(CamposDia,{s:s, d:d}));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Faturamento", compacto:true, cls:FUNDO_FAT},
      barra,
      e(DiaADia,{s:s, d:d, ano:ref.ano, mes:ref.mes, visao:visao, base:base})));
}

export { AbaFaturamento };
