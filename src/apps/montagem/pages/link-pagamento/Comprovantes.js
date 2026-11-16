// Sorelly Admin · montagem — pages/link-pagamento/Comprovantes.js
// Tela Comprovantes: links pagos que ainda não tiveram o comprovante enviado ao grupo da representante (o envio é no dia seguinte ao pagamento), com "Copiar texto do comprovante".
// O texto vem de textoComprovante (domain/link-pagamento.js), no modelo passado pelo Marcus. O print é anexado por quem envia, no WhatsApp.
// REFEITA em 16/11/2026 (Marcus: "melhora a aba de comprovantes com as novas regras"): UM bloco azul como o Contas a pagar, números e período na faixa azul, UMA planilha com filtro em cada coluna.
// As duas listas de antes (pendentes e pagos hoje) viraram a coluna Situação (Atraso de N dias · Enviar hoje · Envio amanhã); nada foi tirado: período, copiar texto e marcar como enviado continuam.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { aguardandoDiaSeguinte, comprovantesPendentes, formatarDia, formatarReais, hojeSP, meioDe, nomeMeio, textoComprovante } from "@/apps/montagem/domain/link-pagamento";
import { BtMini } from "@/apps/montagem/pages/compras/visualCompras";
import { copiar, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useState } from "@/shared/react";

var dia = function(v){ return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };   // colunas de data guardam AAAA-MM-DD (ordenam certo) e mostram DD/MM/AAAA
var LIMITE = 100;   // linhas desenhadas por vez (a planilha importada deixa centenas de pagos sem comprovante marcado)
var CAMPO_AZUL = "h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]";
function AbaLpComprovantes(){
  var L = useLp(), s = L.s, hoje = hojeSP(), cp = useState(""), copiado = cp[0], dd = useState({de:"", ate:""}), dt = dd[0];
  // período pela data do pagamento (data inicial e final; Hellen, 03/11/2026)
  var noPeriodo = function(x){ var d = String(x.pagoEm || "").slice(0, 10); return (!dt.de || d>=dt.de) && (!dt.ate || d<=dt.ate); };
  var pend = comprovantesPendentes(s, hoje).filter(function(p){ return noPeriodo(p.sol); }), atrasados = pend.filter(function(x){ return x.diasAtraso>0; }), amanha = aguardandoDiaSeguinte(s, hoje).filter(noPeriodo);
  var copia = function(x){ if(copiar(textoComprovante(x, s))){ cp[1](x.id); setTimeout(function(){ cp[1](""); }, 2500); } };
  var linhaDe = function(x, situacao, cor, enviar, ordem){
    var m = meioDe(s, x.meioId), n = x.parcelas || 1;
    return {id:x.id, revendedora:x.revendedora, link:nomeMeio(m), representante:x.representante || "—", pagoEm:String(x.pagoEm || "").slice(0, 10), valor:x.valor, parcelas:n+"x de "+formatarReais(Math.round(x.valor/n*100)/100),
      acerto:String(x.dataAcerto || "").slice(0, 10), situacao:situacao, _cor:cor, _ordem:ordem, _x:x, _enviar:enviar};
  };
  // pendentes primeiro (os mais atrasados no começo), depois os pagos de hoje
  var linhas = pend.slice(0, LIMITE).map(function(p){ return linhaDe(p.sol, p.diasAtraso>0 ? "Atraso de "+p.diasAtraso+(p.diasAtraso===1 ? " dia" : " dias") : "Enviar hoje", p.diasAtraso>0 ? "#EF4444" : "#FBBF24", true, 0); })
    .concat(amanha.map(function(x){ return linhaDe(x, "Envio amanhã", "#60A5FA", false, 1); }));
  var cols = [{k:"revendedora", t:"Revendedora"}, {k:"link", t:"Link"}, {k:"representante", t:"Representante"}, {k:"pagoEm", t:"Pago em", fmt:dia, render:dia},
    {k:"valor", t:"Valor", fmt:function(v){ return formatarReais(v); }, render:function(v){ return e("b",{className:"tabular-nums"}, formatarReais(v)); }},
    {k:"parcelas", t:"Parcelas"}, {k:"acerto", t:"Acerto", fmt:dia, render:dia},
    {k:"situacao", t:"Situação", render:function(v, l){ return e("span",{className:"font-bold", style:{color:l._cor}}, v); }},
    {k:"acoes", t:"Ações", render:function(v, l){ return e("span",{className:"inline-flex gap-1"},
      e(BtMini,{forte:copiado===l.id, onClick:function(){ copia(l._x); }}, copiado===l.id ? "✓ Copiado" : "Copiar texto"),
      l._enviar && e(BtMini,{onClick:function(){ L.exec("sol_mover", {id:l.id, para:"comprovante"}); }}, "Marcar enviado")); }}];
  var num = function(rot, v, forte){ return e("span",{key:rot, className:"whitespace-nowrap px-1 text-[13px]"}, rot+" ", e("b",{className:"tabular-nums "+(forte ? "text-[#fca5a5]" : "")}, v)); };
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("div",{className:"flex flex-wrap items-center gap-x-1"}, num("Pendentes de envio", pend.length, pend.length>0), num("Em atraso", atrasados.length, atrasados.length>0), num("Pagos hoje (envio amanhã)", amanha.length)),
    e("span",{className:"flex-1"}),
    e("label",{className:"flex items-center gap-1.5 text-[13px] font-semibold"}, "Pago de", e("input",{type:"date", "aria-label":"Data inicial", value:dt.de, onChange:function(ev){ dd[1]({de:ev.target.value, ate:dt.ate}); }, className:CAMPO_AZUL})),
    e("label",{className:"flex items-center gap-1.5 text-[13px] font-semibold"}, "até", e("input",{type:"date", "aria-label":"Data final", value:dt.ate, onChange:function(ev){ dd[1]({de:dt.de, ate:ev.target.value}); }, className:CAMPO_AZUL})),
    (dt.de || dt.ate) && e("button",{type:"button", onClick:function(){ dd[1]({de:"", ate:""}); }, className:"h-8 rounded-md border border-white/50 px-3 text-[13px] font-semibold hover:bg-white/15"}, "Limpar datas"));
  return e(BlocoPainel,{titulo:"Comprovantes dos links", compacto:true},
    faixa,
    linhas.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true})
      : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum comprovante pendente."),
    pend.length>LIMITE && e("p",{className:"px-2 py-1.5 text-center text-[13px]"}, "Mostrando os "+LIMITE+" mais antigos de "+pend.length+" pendentes."));
}
export { AbaLpComprovantes };
