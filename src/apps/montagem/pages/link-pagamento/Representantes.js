// Sorelly Admin · montagem — pages/link-pagamento/Representantes.js
// Aba Representantes: vínculo representante → maquininha, link de crédito, confirmação e informações (o controle da planilha de hoje) e vínculo revendedora → representante.
// A revendedora usa o link/maquininha da representante dela. Edição em janela (Editor). Regras em domain/link-pagamento.js.
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): dois blocos azuis com planilha e filtro em cada coluna; os números ficam na faixa azul e a busca virou o filtro das colunas.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { INFORMACOES, ROTULO_INFO, formatarDia, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { Editor } from "@/apps/montagem/pages/compras/visualCompras";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useState } from "@/shared/react";

var COR_INFO = {nao_informado:"#EF4444", enviado:"#FBBF24", ciente:"#4ADE80"};

function AbaLpRepresentantes(){
  var L = useLp(), lp = L.lp, md = useState(null), modal = md[0];
  var maqs = lp.meios.filter(function(m){ return m.tipo==="MAQUININHA"; }), links = lp.meios.filter(function(m){ return m.tipo==="LINK"; });
  var qtdRev = function(rep){ return lp.revendedoras.filter(function(r){ return r.representante===rep; }).length; };
  var semInfo = lp.vinculos.filter(function(v){ return v.informacoes!=="ciente"; }).length;
  var reps = lp.vinculos.map(function(v){ return [v.representante, v.representante]; });
  var ini = function(v){ return v ? {id:v.id, representante:v.representante, maquininhaId:v.maquininhaId, linkId:v.linkId, confirmacao:v.confirmacao, informacoes:v.informacoes} : {representante:"", maquininhaId:"", linkId:"", confirmacao:"", informacoes:"nao_informado"}; };
  var num = function(rot, v, forte){ return e("span",{key:rot, className:"whitespace-nowrap px-1 text-[13px]"}, rot+" ", e("b",{className:"tabular-nums "+(forte ? "text-[#fca5a5]" : "")}, v)); };
  var linhasVinc = lp.vinculos.map(function(v){
    var mq = v.maquininhaId ? meioDe(L.s, v.maquininhaId) : null, lk = v.linkId ? meioDe(L.s, v.linkId) : null;
    return {id:v.id, representante:v.representante, maquininha:mq ? nomeMeio(mq) : (v.semDados ? "Sem dados (conferir)" : "Sem maquininha"), link:lk ? nomeMeio(lk) : "—", confirmacao:String(v.confirmacao || "").slice(0, 10),
      informacoes:ROTULO_INFO[v.informacoes], _cor:COR_INFO[v.informacoes], revendedoras:qtdRev(v.representante), acoes:"Editar", _v:v}; });
  var linhasRev = lp.revendedoras.map(function(r){
    var v = lp.vinculos.find(function(x){ return x.representante===r.representante; }), lk = v && v.linkId ? meioDe(L.s, v.linkId) : null;
    return {id:r.id, revendedora:r.nome, representante:r.representante || (r.antiga ? "Sem representante (era "+r.antiga+")" : "Sem representante"), link:lk ? nomeMeio(lk) : "Sem link vinculado", acoes:"Remover"}; });
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("div",{className:"flex flex-wrap items-center gap-x-1"},
      num("Representantes", lp.vinculos.length), num("Com maquininha", lp.vinculos.filter(function(v){ return v.maquininhaId; }).length), num("Com link de crédito", lp.vinculos.filter(function(v){ return v.linkId; }).length), num("Informações pendentes", semInfo, semInfo>0)),
    e("span",{className:"flex-1"}),
    e(Botao,{principal:true, onClick:function(){ md[1]({tipo:"vinc", v:null}); }}, "Nova representante"),
    e(Botao,{desabilitado:!lp.vinculos.length, title:lp.vinculos.length ? "" : "Cadastre uma representante primeiro", onClick:function(){ md[1]({tipo:"rev"}); }}, "Vincular revendedora"));
  var colsVinc = [{k:"representante", t:"Representante"}, {k:"maquininha", t:"Maquininha"}, {k:"link", t:"Link de crédito"},
    {k:"confirmacao", t:"Confirmação", fmt:function(v){ return v ? String(v).split("-").reverse().join("/") : "—"; }, render:function(v){ return v ? String(v).split("-").reverse().join("/") : "—"; }},
    {k:"informacoes", t:"Informações", render:function(v, l){ return e("span",{className:"font-bold", style:{color:l._cor}}, v); }}, {k:"revendedoras", t:"Revendedoras"},
    {k:"acoes", t:"Ações", render:function(v, l){ return e("button",{type:"button", title:"Editar vínculo", onClick:function(ev){ ev.stopPropagation(); md[1]({tipo:"vinc", v:l._v}); }, className:"h-8 rounded-md border border-white/30 px-2 text-[13px] font-semibold hover:bg-white/10"}, "Editar"); }}];
  var colsRev = [{k:"revendedora", t:"Revendedora"}, {k:"representante", t:"Representante"}, {k:"link", t:"Link usado"},
    {k:"acoes", t:"Ações", render:function(v, l){ return e("button",{type:"button", title:"Remover vínculo da revendedora", onClick:function(ev){ ev.stopPropagation(); L.exec("rev_remover", {id:l.id}); }, className:"h-8 rounded-md border border-white/30 px-2 text-[13px] font-semibold text-destructive hover:bg-white/10"}, "Remover"); }}];
  return e("div",{className:"flex flex-col gap-2"},
    e(BlocoPainel,{titulo:"Representantes, maquininhas e links", compacto:true, dir:String(lp.vinculos.length)},
      faixa,
      lp.vinculos.length ? e(TabelaPlanilha,{cols:colsVinc, linhas:linhasVinc, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true})
        : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhuma representante vinculada.")),
    e(BlocoPainel,{titulo:"Revendedoras vinculadas", compacto:true, dir:String(lp.revendedoras.length)},
      lp.revendedoras.length ? e(TabelaPlanilha,{cols:colsRev, linhas:linhasRev, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true, limite:100})
        : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhuma revendedora vinculada.")),
    modal && modal.tipo==="vinc" && e(Editor,{t:modal.v ? "Editar representante" : "Nova representante", sub:"Maquininha e link de crédito que as revendedoras dela usam.", nc:1, fechar:function(){ md[1](null); }, ini:ini(modal.v), icSalvar:"floppy-disk",
      campos:[{k:"representante", rot:"Representante", tipo:"texto", obrig:true}, {k:"maquininhaId", rot:"Maquininha", tipo:"select", vazio:"Sem maquininha", ops:maqs.map(function(m){ return [m.id, nomeMeio(m)]; })},
        {k:"linkId", rot:"Link de crédito", tipo:"select", vazio:"Sem link", ops:links.map(function(m){ return [m.id, nomeMeio(m)]; })}, {k:"confirmacao", rot:"Confirmação (data de envio das informações)", tipo:"data"},
        {k:"informacoes", rot:"Informações", tipo:"botoes", ops:INFORMACOES}],
      onSalvar:function(v){ return L.exec("vinc_salvar", v); }, onExcluir:modal.v ? function(){ return L.exec("vinc_excluir", {id:modal.v.id}); } : undefined}),
    modal && modal.tipo==="rev" && e(Editor,{t:"Vincular revendedora", sub:"A revendedora usa o link da representante.", nc:1, fechar:function(){ md[1](null); }, ini:{revendedora:"", representante:""}, icSalvar:"link",
      campos:[{k:"revendedora", rot:"Revendedora", tipo:"texto", obrig:true}, {k:"representante", rot:"Representante", tipo:"select", vazio:"Selecione", ops:reps, obrig:true}],
      onSalvar:function(v){ return L.exec("rev_vincular", v); }}));
}
export { AbaLpRepresentantes };
