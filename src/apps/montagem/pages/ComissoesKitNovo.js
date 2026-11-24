// Sorelly Admin — pages/ComissoesKitNovo.js
// Comissões › Kit novo (teste do novo fluxo, 28/10/2026): UMA LINHA POR REVENDEDORA que a Representante Kit Novo entregou, com a história toda: entrega (R$ 25), 1º acerto e os 2%.
// Os números vêm de itensComissao (domain/comissoes.js); aqui só se junta por revendedora. A gasolina segue o esquema das outras representantes (km do período, em Comissões). Desistência: kit volta, só gasolina.
// VISUAL (23/11/2026): bloco azul com a barra de menus, TabelaPlanilha (filtro no nome da coluna, inclusive por Rep. Kit Novo) e o total na última linha, no lugar da faixa de números.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { BarraTabela, CelulaBarra } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { comisEfetiva, fmtDataBR, itensComissao } from "@/apps/montagem/domain/comissoes";
import { nomePropio as np } from "@/apps/montagem/lib/nome-conta";
import { podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useMemo } from "@/shared/react";

var nm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+(i.comissao||0); }, 0)); };
var COR = {ok:"text-[#4ADE80]", espera:"text-[#FBBF24]", ruim:"text-[#F87171]"};
var LINK = "cursor-pointer whitespace-nowrap font-semibold underline underline-offset-2 hover:text-primary";

function ComissoesKitNovo(p){
  var cx = use(), s = cx.state, d = cx.dispatch, fin = podeFinanceiro(s.usuario);
  var base = useMemo(function(){ var c0 = comisEfetiva(s); return {c:c0, itens:itensComissao(c0, s, Date.now())}; }, [s]);
  var c = base.c, itens = base.itens, revs = (c.nf.revs||[]);
  var linhas = revs.map(function(x){
    var rec = (s.acertosConsignado||[]).filter(function(r){ return nm(r.rev)===nm(x.rev) && (r.tipo==="kit_novo_entrega" || r.tipo==="acerto" && r.kitNovoOk); })[0] || null;
    var entrega = itens.filter(function(i){ return i.nfKitNovo && i.tipo==="kitnovo" && nm(i.rev)===nm(x.rev); })[0] || null;
    var dois = itens.filter(function(i){ return i.nfKitNovo && i.tipo==="pag" && nm(i.rev)===nm(x.rev); });
    var idPrim = Object.keys(c._nfPrim||{}).filter(function(k){ return nm(c._nfPrim[k].rev)===nm(x.rev); })[0];
    var prim = idPrim ? (s.acertosConsignado||[]).filter(function(r){ return String(r.id)===String(idPrim); })[0] : null;
    var desist = !!(rec && rec.desistencia);
    var todos = (entrega ? [entrega] : []).concat(dois);
    var total = desist ? 0 : soma(todos), conf = todos.length>0 && todos.every(function(i){ return i.confirmado; });
    var sit = desist ? ["Desistência", "ruim"] : !rec ? ["Esperando a entrega", "espera"] : !prim ? ["Esperando o 1º acerto", "espera"] : conf ? ["Confirmado", "ok"] : ["Falta confirmar", "espera"];
    return {id:x.rev, rev:x.rev, repKit:x.repKitNovo, rec:rec, desist:desist, sitCor:sit[1], sit:sit[0], total:total, doisV:soma(dois),
      entrega:desist ? "Desistiu" : entrega ? fmtDataBR(rec.data)+" · "+BKC(entrega.comissao) : rec ? fmtDataBR(rec.data) : "", prim:prim ? fmtDataBR(prim.data) : "", repAcerto:prim ? prim.rep : "", acerto:prim ? (prim.valorAcerto||0) : "", dois:prim ? soma(dois) : ""};
  });
  if(!c.nf.ativo && !revs.length) return e(BlocoPainel,{titulo:"Comissões · Kit novo", compacto:true}, p.troca && e(BarraTabela,null, p.troca),
    e("div",{className:"flex min-h-8 items-center justify-center px-3 py-1 text-center text-[13px]"}, "O teste do novo fluxo está desligado. Ligue em Configurar comissões › Novo fluxo."));
  var dinheiro = function(v){ return v==="" ? "—" : BKC(v); };
  var cols = [{k:"rev", t:"Revendedora", fmt:np}, {k:"repKit", t:"Rep. Kit Novo", fmt:np}, {k:"entrega", t:"Entrega", render:function(v){ return v || "—"; }}, {k:"prim", t:"1º acerto", render:function(v){ return v || "—"; }},
    {k:"repAcerto", t:"Rep. Acerto", render:function(v){ return v ? np(v) : "—"; }}, {k:"acerto", t:"Valor do acerto", fmt:dinheiro, render:dinheiro}, {k:"dois", t:"2%", fmt:dinheiro, render:dinheiro},
    {k:"total", t:"Total", render:function(v, l){ return l.desist ? "Só gasolina" : BKC(v); }}, {k:"sit", t:"Situação", cor:function(l){ return COR[l.sitCor]; }},
    {k:"acao", t:"Desistência", semFiltro:true, render:function(v, l){ return fin && l.rec ? e("button",{type:"button", onClick:function(){ d({type:"COMIS_DESIST", id:l.rec.id, valor:!l.desist}); }, className:LINK}, l.desist ? "Desfazer" : "Marcar desistência") : "—"; }}];
  var rodape = function(ls){ var aReceber = r2(ls.reduce(function(t, l){ return t+l.total; }, 0)), confirmado = r2(ls.filter(function(l){ return l.sitCor==="ok"; }).reduce(function(t, l){ return t+l.total; }, 0));
    var nEsp = ls.filter(function(l){ return l.sitCor==="espera"; }).length, nDes = ls.filter(function(l){ return l.desist; }).length;
    return ["Total · "+ls.length+(ls.length===1 ? " revendedora" : " revendedoras"), "", "", "", "", "", "", BKC(aReceber), "Confirmado "+BKC(confirmado)+" · "+nEsp+" esperando · "+nDes+(nDes===1 ? " desistência" : " desistências"), ""]; };
  return e(BlocoPainel,{titulo:"Comissões · Kit novo", compacto:true, cls:"preenche", dir:c.nf.ativo ? "Teste ligado" : "Teste desligado"},
    p.troca && e(BarraTabela,null, p.troca),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", fina:true, cheia:true, grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true, totalRodape:rodape, linhaCls:function(l){ return l.desist ? "opacity-60" : ""; },
      vazio:"Nenhuma revendedora marcada. Marque em Configurar comissões › Novo fluxo."}));
}

export { ComissoesKitNovo };
