// Sorelly Admin · montagem — pages/link-pagamento/Descontados.js
// Tela Descontados no acerto (Hellen, 03/11/2026): os links pagos que já abateram um acerto, para conferir como na planilha dela.
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): bloco azul como o Contas a pagar e planilha com filtro em cada coluna (TabelaPlanilha); nenhuma coluna saiu.
// 19/11/2026 (Hellen: "como eu incluo os links que foram descontados no acerto"): botão "Incluir link" lança à mão um link pago como descontado (escolhe o link, a data do acerto e, se quiser, o valor usado);
// a linha lançada à mão abre de novo ao clicar, para corrigir ou tirar.
import { BTN_GRUPO, BlocoPainel, GrupoBtn } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { foiPago, formatarReais, hojeSP, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { Editor } from "@/apps/montagem/pages/compras/visualCompras";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useMemo, useState } from "@/shared/react";

var dia = function(v){ return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };   // as colunas de data guardam AAAA-MM-DD (ordenam certo) e mostram DD/MM/AAAA

var sem = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };   // busca sem acento nem maiúscula

// Janela "Incluir link": escolhe um link pago que ainda não abateu acerto (busca pelo nome) + data do acerto + valor usado (R$ 0,00 = o valor inteiro do link).
function JanelaIncluir(p){
  var L = p.L, lp = L.lp;
  var pagos = useMemo(function(){
    return lp.solicitacoes.filter(function(x){ return foiPago(x) && !x.acertoId && !x.descontado; }).sort(function(a, b){ return String(b.pagoEm || "") < String(a.pagoEm || "") ? -1 : 1; });
  }, [lp.solicitacoes]);   // eslint-disable-line react-hooks/exhaustive-deps
  var opcoes = function(v){
    var b = sem(v.busca), r = pagos.filter(function(x){ return !b || sem(x.revendedora).indexOf(b)>=0; }).slice(0, 80);
    return r.map(function(x){ return [x.id, x.revendedora+" · "+formatarReais(Number(x.valor) || 0)+" · "+(x.parcelas || 1)+"x · pago em "+dia(x.pagoEm)]; });
  };
  return e(Editor,{t:"Incluir link descontado no acerto", sub:"Escolha o link pago e a data do acerto em que ele abateu.", nc:2, titulos:["Link", "Acerto"], fechar:p.fechar, salvarRot:"Incluir", icSalvar:"check",
    ini:{busca:"", sol:"", data:hojeSP(), valor:0},
    campos:[{k:"busca", rot:"Buscar revendedora", ph:"Nome da revendedora"}, {k:"sol", rot:"Link pago", tipo:"select", ops:opcoes, vazio:"Escolha o link", obrig:true},
      {k:"data", rot:"Data do acerto", tipo:"data", obrig:true}, {k:"valor", rot:"Valor descontado", tipo:"dinheiro", dica:"R$ 0,00 = valor inteiro do link"}],
    onSalvar:function(v){ return L.exec("sol_descontar", {id:v.sol, dataAcerto:v.data, valor:v.valor}); }});
}
// Janela de uma linha lançada à mão: corrigir a data e o valor, ou tirar dos descontados.
function JanelaLancada(p){
  var L = p.L, x = p.x;
  return e(Editor,{t:"Link lançado à mão · "+x.revendedora, sub:"Link de "+formatarReais(Number(x.valor) || 0)+" pago em "+dia(x.pagoEm)+". Corrija o acerto ou tire dos descontados.", nc:1, titulos:["Acerto"], fechar:p.fechar, salvarRot:"Salvar",
    ini:{data:String(x.usadoEm || x.dataAcerto || "").slice(0, 10), valor:Number(x.usadoValor) || 0},
    campos:[{k:"data", rot:"Data do acerto", tipo:"data", obrig:true}, {k:"valor", rot:"Valor descontado", tipo:"dinheiro", dica:"R$ 0,00 = valor inteiro do link"}],
    onSalvar:function(v){ return L.exec("sol_descontar", {id:x.id, dataAcerto:v.data, valor:v.valor}); },
    onExcluir:function(){ return L.exec("sol_descontar_desfazer", {id:x.id}); }});
}

function AbaLpDescontados(){
  var L = useLp(), s = L.s, lp = L.lp;
  var md = useState(null), modal = md[0];
  var linhas = useMemo(function(){
    // Marcus, 16/11/2026: mostra também os links da planilha antiga que já abateram acerto (x.descontado, com a data do acerto), além dos descontados pelo Atendimento interno (x.acertoId).
    var dia0 = function(x){ return String(x.usadoEm || x.dataAcerto || "").slice(0, 10); };
    return lp.solicitacoes.filter(function(x){ return x.acertoId || x.descontado; }).sort(function(a, b){ return dia0(b) < dia0(a) ? -1 : dia0(b) > dia0(a) ? 1 : 0; }).map(function(x){
      return {id:x.id, usado:dia0(x), origem:x.acertoId==="manual" ? "Lançado à mão" : x.acertoId ? "Atendimento interno" : "Planilha antiga", autorizacao:x.autorizacao || "—", vendaComLink:Number(x.vendaComLink) || 0, revendedora:x.revendedora, representante:x.representante || "Sem representante", link:nomeMeio(meioDe(s, x.meioId)), valor:Number(x.valor) || 0,
        parcelas:(x.parcelas || 1)+"x", pagoEm:String(x.pagoEm || "").slice(0, 10), sobrou:Number(x.excedente) || 0, acerto:String(x.dataAcerto || "").slice(0, 10)}; });
  }, [lp.solicitacoes]);   // eslint-disable-line react-hooks/exhaustive-deps
  var din = function(v){ return formatarReais(v || 0); };
  var cols = [{k:"usado", t:"Descontado em", data:true, fmt:dia, render:dia}, {k:"origem", t:"Origem"}, {k:"revendedora", t:"Revendedora"}, {k:"representante", t:"Representante"}, {k:"link", t:"Link"},
    {k:"valor", t:"Valor do link", fmt:din, render:function(v){ return e("b",{className:"tabular-nums"}, din(v)); }}, {k:"parcelas", t:"Parcelas"},
    {k:"pagoEm", t:"Pago em", fmt:dia, render:dia}, {k:"sobrou", t:"Sobrou", fmt:din, render:function(v){ return v>0 ? e("b",{className:"tabular-nums text-[#FBBF24]"}, din(v)) : din(v); }}, {k:"acerto", t:"Data do acerto", fmt:dia, render:dia}, {k:"autorizacao", t:"Autorização"}, {k:"vendaComLink", t:"Venda com link", fmt:din, render:din}];
  var abrir = function(l){ if(l.origem!=="Lançado à mão") return; var x = lp.solicitacoes.find(function(y){ return y.id===l.id; }); if(x) md[1]({x:x}); };
  return e(BlocoPainel,{titulo:"Links descontados no acerto", compacto:true, alta:true, dir:linhas.length.toLocaleString("pt-BR"),
    acao:e(GrupoBtn,null, e("button",{type:"button", className:BTN_GRUPO, onClick:function(){ md[1]({novo:true}); }}, "Incluir link"))},
    linhas.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true, limite:50, paginas:true, aoClicar:abrir})
      : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum link foi descontado em acerto ainda."),
    modal && modal.novo && e(JanelaIncluir,{L:L, fechar:function(){ md[1](null); }}),
    modal && modal.x && e(JanelaLancada,{key:modal.x.id, L:L, x:modal.x, fechar:function(){ md[1](null); }}));
}
export { AbaLpDescontados };
