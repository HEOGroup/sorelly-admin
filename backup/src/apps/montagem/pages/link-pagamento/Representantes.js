// Sorelly Admin · montagem — pages/link-pagamento/Representantes.js
// Aba Representantes: vínculo representante → maquininha, link de crédito, confirmação e informações (o controle da planilha de hoje) e vínculo revendedora → representante.
// A revendedora usa o link/maquininha da representante dela. Edição em janela (Editor). Regras em domain/link-pagamento.js.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { INFORMACOES, ROTULO_INFO, formatarDia, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { Bt, Busca, Editor, Ic, Ind, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useState } from "@/shared/react";

var COR_INFO = {nao_informado:"#EF4444", enviado:"#FBBF24", ciente:"#4ADE80"};

function AbaLpRepresentantes(){
  var L = useLp(), lp = L.lp, md = useState(null), modal = md[0], bs = useState(""), busca = bs[0];
  var norm1 = function(x){ return String(x||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
  var revsFiltradas = lp.revendedoras.filter(function(r){ return !busca || norm1(r.nome).indexOf(norm1(busca))>=0 || norm1(r.representante).indexOf(norm1(busca))>=0; }), revsMostradas = revsFiltradas.slice(0, 100);
  var maqs = lp.meios.filter(function(m){ return m.tipo==="MAQUININHA"; }), links = lp.meios.filter(function(m){ return m.tipo==="LINK"; });
  var qtdRev = function(rep){ return lp.revendedoras.filter(function(r){ return r.representante===rep; }).length; };
  var semInfo = lp.vinculos.filter(function(v){ return v.informacoes!=="ciente"; }).length;
  var reps = lp.vinculos.map(function(v){ return [v.representante, v.representante]; });
  var ini = function(v){ return v ? {id:v.id, representante:v.representante, maquininhaId:v.maquininhaId, linkId:v.linkId, confirmacao:v.confirmacao, informacoes:v.informacoes} : {representante:"", maquininhaId:"", linkId:"", confirmacao:"", informacoes:"nao_informado"}; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(Ind,{t:"Representantes", v:lp.vinculos.length, cor:"total"}), e(Ind,{t:"Com maquininha", v:lp.vinculos.filter(function(v){ return v.maquininhaId; }).length, cor:"info"}),
      e(Ind,{t:"Com link de crédito", v:lp.vinculos.filter(function(v){ return v.linkId; }).length, cor:"info"}), e(Ind,{t:"Informações pendentes", v:semInfo, cor:semInfo ? "alerta" : "ok", titulo:"Ainda não confirmadas como ciente"})),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ md[1]({tipo:"vinc", v:null}); }}, "Nova representante"),
      e(Bt,{ic:"user-plus", disabled:!lp.vinculos.length, titulo:lp.vinculos.length ? "" : "Cadastre uma representante primeiro", onClick:function(){ md[1]({tipo:"rev"}); }}, "Vincular revendedora")),
    e(BlocoBarra,{cor:"turquesa", t:"Representantes, maquininhas e links", compacto:true, dir:String(lp.vinculos.length)},
      lp.vinculos.length ? e("div",{className:"p-2"}, e(Tab,{cols:["Representante", "Maquininha", "Link de crédito", "Confirmação", "Informações", "Revendedoras", "Ações"]}, lp.vinculos.map(function(v){
        var mq = v.maquininhaId ? meioDe(L.s, v.maquininhaId) : null, lk = v.linkId ? meioDe(L.s, v.linkId) : null;
        return e("tr",{key:v.id, className:LINHA}, e(Td,{forte:true}, v.representante), e(Td,null, mq ? nomeMeio(mq) : (v.semDados ? "Sem dados (conferir)" : "Sem maquininha")), e(Td,null, lk ? nomeMeio(lk) : "—"), e(Td,null, formatarDia(v.confirmacao) || "—"),
          e(Td,null, e(Selo,{cor:COR_INFO[v.informacoes]}, ROTULO_INFO[v.informacoes])), e(Td,{dinheiro:true}, qtdRev(v.representante)),
          e(Td,null, e(Ic,{ic:"pencil-simple", titulo:"Editar vínculo", onClick:function(){ md[1]({tipo:"vinc", v:v}); }}))); })))
        : e("div",{className:"p-2"}, e(Vazio,{ic:"users"}, "Nenhuma representante vinculada."))),
    e(BlocoBarra,{cor:"turquesa", t:"Revendedoras vinculadas", compacto:true, dir:String(lp.revendedoras.length)},
      lp.revendedoras.length ? e("div",{className:"flex flex-col gap-2 p-2"}, e("div",{className:"flex justify-center"}, e(Busca,{v:busca, set:bs[1], ph:"Buscar revendedora ou representante"})), e(Tab,{cols:["Revendedora", "Representante", "Link usado", "Ações"]}, revsMostradas.map(function(r){
        var v = lp.vinculos.find(function(x){ return x.representante===r.representante; }), lk = v && v.linkId ? meioDe(L.s, v.linkId) : null;
        return e("tr",{key:r.id, className:LINHA}, e(Td,{forte:true}, r.nome), e(Td,null, r.representante || (r.antiga ? "Sem representante (era "+r.antiga+")" : "Sem representante")), e(Td,null, lk ? nomeMeio(lk) : "Sem link vinculado"),
          e(Td,null, e(Ic,{ic:"trash", perigo:true, titulo:"Remover vínculo da revendedora", onClick:function(){ L.exec("rev_remover", {id:r.id}); }}))); })))
        : e("div",{className:"p-2"}, e(Vazio,{ic:"user-plus"}, "Nenhuma revendedora vinculada."))),
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
