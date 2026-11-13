// Sorelly Admin · montagem — pages/link-pagamento/Comprovantes.js
// Aba Comprovantes: links pagos que ainda não tiveram o comprovante enviado ao grupo da representante (o envio é no dia seguinte ao pagamento), com "Copiar texto do comprovante".
// O texto vem de textoComprovante (domain/link-pagamento.js), no modelo passado pelo Marcus. O print é anexado por quem envia, no WhatsApp.
import { Faixa, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { aguardandoDiaSeguinte, comprovantesPendentes, formatarDia, formatarReais, hojeSP, meioDe, nomeMeio, textoComprovante } from "@/apps/montagem/domain/link-pagamento";
import { Ic, Ind, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { copiar, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useState } from "@/shared/react";

var LIMITE = 100;   // linhas desenhadas por vez (a planilha importada deixa centenas de pagos sem comprovante marcado)
function AbaLpComprovantes(){
  var L = useLp(), s = L.s, hoje = hojeSP(), cp = useState(""), copiado = cp[0], dd = useState({de:"", ate:""}), dt = dd[0];
  // filtro por data do pagamento (data inicial e final; Helen, 03/11/2026)
  var noPeriodo = function(x){ var d = String(x.pagoEm || "").slice(0, 10); return (!dt.de || d>=dt.de) && (!dt.ate || d<=dt.ate); };
  var pend = comprovantesPendentes(s, hoje).filter(function(p){ return noPeriodo(p.sol); }), atrasados = pend.filter(function(x){ return x.diasAtraso>0; }), amanha = aguardandoDiaSeguinte(s, hoje).filter(noPeriodo);
  var copia = function(x){ if(copiar(textoComprovante(x, s))){ cp[1](x.id); setTimeout(function(){ cp[1](""); }, 2500); } };
  var linha = function(x, extra){
    var m = meioDe(s, x.meioId), n = x.parcelas || 1;
    return e("tr",{key:x.id, className:LINHA},
      e(Td,{forte:true}, x.revendedora), e(Td,null, nomeMeio(m)), e(Td,null, x.representante || "—"), e(Td,null, formatarDia(x.pagoEm)), e(Td,{dinheiro:true}, formatarReais(x.valor)),
      e(Td,{dinheiro:true}, n+"x de "+formatarReais(Math.round(x.valor/n*100)/100)), e(Td,null, formatarDia(x.dataAcerto) || "—"), extra.situacao,
      e(Td,null, e("span",{className:"inline-flex gap-1"},
        e(Ic,{ic:copiado===x.id ? "check" : "copy", titulo:"Copiar texto do comprovante", forte:copiado===x.id, onClick:function(){ copia(x); }}),
        extra.enviar && e(Ic,{ic:"paper-plane-tilt", titulo:"Marcar comprovante como enviado", onClick:function(){ L.exec("sol_mover", {id:x.id, para:"comprovante"}); }}))));
  };
  var cols = ["Revendedora", "Link", "Representante", "Pago em", "Valor", "Parcelas", "Acerto", "Situação", "Ações"];
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-end justify-center gap-3"},
      e("label",{className:"grid gap-1"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Data inicial"), e("input",{type:"date", value:dt.de, onChange:function(ev){ dd[1]({de:ev.target.value, ate:dt.ate}); }, className:CAMPO+" w-40"})),
      e("label",{className:"grid gap-1"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Data final"), e("input",{type:"date", value:dt.ate, onChange:function(ev){ dd[1]({de:dt.de, ate:ev.target.value}); }, className:CAMPO+" w-40"})),
      (dt.de || dt.ate) && e("button",{type:"button", onClick:function(){ dd[1]({de:"", ate:""}); }, className:"h-8 rounded-md border border-border px-3 text-[13px] hover:bg-white/10"}, "Limpar datas")),
    e(Faixa,{n:3},
      e(Ind,{t:"Pendentes de envio", v:pend.length, cor:pend.length ? "alerta" : "ok", titulo:"Pagos em dias anteriores"}),
      e(Ind,{t:"Em atraso", v:atrasados.length, cor:atrasados.length ? "ruim" : "ok", titulo:"Passaram do dia seguinte ao pagamento"}),
      e(Ind,{t:"Pagos hoje", v:amanha.length, cor:"info", titulo:"Envio no dia seguinte"})),
    e(BlocoBarra,{cor:"turquesa", t:"Comprovantes pendentes", compacto:true, dir:String(pend.length)},
      pend.length ? e("div",{className:"p-2"}, e(Tab,{cols:cols}, pend.slice(0, LIMITE).map(function(p){ return linha(p.sol, {enviar:true,
        situacao:e(Td,null, e(Selo,{cor:p.diasAtraso>0 ? "#EF4444" : "#FBBF24", ic:p.diasAtraso>0 ? "warning" : "clock"}, p.diasAtraso>0 ? "Atraso de "+p.diasAtraso+(p.diasAtraso===1 ? " dia" : " dias") : "Enviar hoje"))}); })))
        : e("div",{className:"p-2"}, e(Vazio,{ic:"receipt"}, "Nenhum comprovante pendente."))),
    pend.length>LIMITE && e("p",{className:"text-center text-[12px] text-white/70"}, "Mostrando os "+LIMITE+" mais antigos de "+pend.length+" pendentes."),
    e(BlocoBarra,{cor:"turquesa", t:"Pagos hoje (envio no dia seguinte)", compacto:true, dir:String(amanha.length)},
      amanha.length ? e("div",{className:"p-2"}, e(Tab,{cols:cols}, amanha.map(function(x){ return linha(x, {enviar:false, situacao:e(Td,null, e(Selo,{cor:"#60A5FA", ic:"hourglass"}, "Envio amanhã"))}); })))
        : e("div",{className:"p-2"}, e(Vazio,{ic:"hourglass"}, "Nenhum pagamento hoje."))));
}
export { AbaLpComprovantes };
