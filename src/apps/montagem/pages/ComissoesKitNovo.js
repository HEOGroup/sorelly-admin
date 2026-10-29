// Sorelly Admin — pages/ComissoesKitNovo.js
// Comissões › Kit novo (teste do novo fluxo, 28/10/2026): UMA LINHA POR REVENDEDORA que a Representante Kit Novo entregou, com a história toda: entrega (R$ 25), 1º acerto e os 2%.
// Os números vêm de itensComissao (domain/comissoes.js); aqui só se junta por revendedora. A gasolina segue o esquema das outras representantes (km do período, em Comissões). Desistência: kit volta, só gasolina.
import { FaixaTotais, Botao, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { comisEfetiva, fmtDataBR, itensComissao } from "@/apps/montagem/domain/comissoes";
import { podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var nm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var soma = function(l){ return r2(l.reduce(function(t, i){ return t+(i.comissao||0); }, 0)); };
var COR = {ok:"text-success", espera:"text-warning", ruim:"text-destructive"};

function ComissoesKitNovo(){
  var cx = use(), s = cx.state, d = cx.dispatch, c = comisEfetiva(s), fin = podeFinanceiro(s.usuario);
  var rf = useState("todas"), repF = rf[0], setRepF = rf[1];
  var itens = itensComissao(c, s, Date.now());
  var revs = (c.nf.revs||[]);
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
    return {rev:x.rev, repKit:x.repKitNovo, rec:rec, entrega:entrega, prim:prim, dois:soma(dois), total:total, desist:desist, sit:sit, repAcerto:prim ? prim.rep : ""};
  }).filter(function(l){ return repF==="todas" || l.repKit===repF; });
  var repsKit = []; revs.forEach(function(x){ if(repsKit.indexOf(x.repKitNovo)<0) repsKit.push(x.repKitNovo); });
  var nEsp = linhas.filter(function(l){ return l.sit[1]==="espera"; }).length, nDes = linhas.filter(function(l){ return l.desist; }).length;
  var aReceber = r2(linhas.reduce(function(t, l){ return t+l.total; }, 0)), confirmado = r2(linhas.filter(function(l){ return l.sit[1]==="ok"; }).reduce(function(t, l){ return t+l.total; }, 0));
  if(!c.nf.ativo && !revs.length) return e("p",{className:"rounded-lg border border-border px-4 py-8 text-center text-[13px] text-foreground"}, "O teste do novo fluxo está desligado. Ligue em Configurar comissões › Novo fluxo.");
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      repsKit.length>1 ? e(Segmentado,{opcoes:[["todas", "Todas"]].concat(repsKit.map(function(n){ return [n, n]; })), atual:repF, onMudar:setRepF}) : e("span",{className:"text-[13px] font-semibold text-foreground"}, repsKit[0] ? "Rep. Kit Novo · "+repsKit[0] : ""),
      e("span",{className:"text-[13px] text-foreground"}, c.nf.ativo ? "Teste ligado" : "Teste desligado")),
    e(FaixaTotais,{itens:[{t:"Revendedoras", v:String(linhas.length)}, {t:"A receber", v:BKC(aReceber)}, {t:"Confirmado", v:BKC(confirmado), cor:confirmado ? "text-success" : ""},
      {t:"Esperando", v:String(nEsp), cor:nEsp ? "text-warning" : ""}, {t:"Desistências", v:String(nDes), cor:nDes ? "text-destructive" : ""}]}),
    e(TabelaP,{minW:1020, cols:[{t:"Revendedora"}, {t:"Rep. Kit Novo", w:140}, {t:"Entrega", w:150}, {t:"1º acerto", w:130}, {t:"Rep. Acerto", w:120}, {t:"Valor do acerto", n:true, w:130}, {t:"2%", n:true, w:100}, {t:"Total", n:true, w:110}, {t:"Situação", w:170}, {t:"", w:130}]},
      linhas.length ? linhas.map(function(l){
        return e(Tr,{key:l.rev, apagado:l.desist},
          e(Td,{forte:true, title:l.rev}, l.rev), e(Td,{title:l.repKit}, l.repKit),
          e(Td,{title:l.rec ? "Entregue em "+fmtDataBR(l.rec.data) : ""}, l.desist ? "Desistiu" : l.entrega ? fmtDataBR(l.rec.data)+" · "+BKC(l.entrega.comissao) : l.rec ? fmtDataBR(l.rec.data) : "—"),
          e(Td,null, l.prim ? fmtDataBR(l.prim.data) : "—"), e(Td,{title:l.repAcerto}, l.repAcerto || "—"),
          e(Td,{n:true}, l.prim ? BKC(l.prim.valorAcerto||0) : "—"), e(Td,{n:true}, l.prim ? BKC(l.dois) : "—"),
          e(Td,{n:true, forte:true}, l.desist ? "só gasolina" : BKC(l.total)),
          e(Td,{cor:COR[l.sit[1]], forte:true}, l.sit[0]),
          e("td",{className:"h-8 border-b border-border px-2 text-right"}, fin && l.rec ? e(Botao,{onClick:function(){ d({type:"COMIS_DESIST", id:l.rec.id, valor:!l.desist}); }}, l.desist ? "Desfazer" : "Desistência") : null)); })
      : e("tr",null, e("td",{colSpan:10, className:"px-3 py-6 text-center text-[13px] text-foreground"}, "Nenhuma revendedora marcada. Marque em Configurar comissões › Novo fluxo."))),
    e("p",{className:"text-[13px] text-foreground"}, "A gasolina da Rep. Kit Novo entra no pagamento dela (dias 1, 11 e 21), pelo km do período, como as outras representantes. Desistência: o kit volta, a bipagem se desfaz no mesmo dia e ela recebe só a gasolina."));
}

export { ComissoesKitNovo };
