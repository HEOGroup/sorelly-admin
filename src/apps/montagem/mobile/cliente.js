// Sorelly Admin · montagem — mobile/cliente.js
// App da cliente final (29/10/2026): quem compra da revendedora e recebe a entrega do motoboy. Protótipo local (useState), igual ao do motoboy:
// ainda NÃO há servidor. Tela única de acompanhamento: pedido, linha das etapas, motoboy, PIN de entrega (o mesmo do app do motoboy) e avaliação.
// Valores, nomes e endereços são de exemplo.
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { e, useState } from "@/shared/react";

var NAVY = "#0B0B0D", OURO = "#E8B84B", VERDE = "#16A34A", CINZA = "#6B7280", LINHA = "#E5E7EB";   // mesma paleta do app da revendedora (cabeçalho preto, ouro, cinza e verde dela)
var PIN_ENTREGA = "4821";   // mesmo PIN que o motoboy digita em mobile/motoboy.js
var brl = function(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };

var PEDIDO = {cod:"S-3318", rev:"Ana Paula", itens:[["Brinco argola dourado", 1, 69.9], ["Colar ponto de luz", 1, 89.9]], frete:0};
var ETAPAS = [
  {n:"Pedido confirmado", d:"A revendedora confirmou o seu pedido."},
  {n:"Motoboy chamado", d:"Estamos procurando um motoboy."},
  {n:"Pedido coletado", d:"O motoboy já está com o seu pedido."},
  {n:"A caminho", d:"Chegando em cerca de 14 minutos."},
  {n:"Entregue", d:"Informe o código ao motoboy para receber."}];

function AppCliente(){
  var s1 = useState(2), etapa = s1[0], setEtapa = s1[1];
  var s2 = useState(0), nota = s2[0], setNota = s2[1];
  var total = PEDIDO.itens.reduce(function(t, i){ return t + i[1]*i[2]; }, 0) + PEDIDO.frete;
  var feito = etapa >= ETAPAS.length-1;
  return e(IPhone15,null,
    e("div",{className:"-mx-4 -mt-2 rounded-b-[30px] px-5 pb-5 pt-4", style:{background:NAVY, color:"#fff"}},
      e("div",{className:"flex items-center justify-between"},
        e("b",{className:"text-[13px] font-black tracking-[.25em]", style:{color:OURO}}, "SORELLY"),
        e("span",{className:"text-[11px] text-white/70"}, "Pedido "+PEDIDO.cod)),
      e("p",{className:"mt-3 text-[15px] font-bold leading-tight"}, feito ? "Pedido entregue" : "Seu pedido está chegando"),
      e("p",{className:"mt-0.5 text-[12px] text-white/70"}, "Vendido por "+PEDIDO.rev)),
    e("div",{className:"mt-3 rounded-2xl bg-white p-3 shadow-sm"},
      ETAPAS.map(function(x, k){
        var ok = k<=etapa, atual = k===etapa;
        return e("div",{key:x.n, className:"flex gap-3"},
          e("div",{className:"flex flex-col items-center"},
            e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-bold", style:{background:ok ? (k===ETAPAS.length-1 ? VERDE : OURO) : LINHA, color:ok ? "#1B1409" : CINZA}}, ok ? "✓" : String(k+1)),
            k<ETAPAS.length-1 && e("span",{className:"w-px flex-1", style:{background:k<etapa ? OURO : LINHA, minHeight:16}})),
          e("div",{className:"pb-2.5"},
            e("b",{className:"block text-[13px]", style:{color:ok ? "#111827" : CINZA}}, x.n),
            atual && e("span",{className:"block text-[11px]", style:{color:CINZA}}, x.d)));
      })),
    etapa>=3 && !feito && e("div",{className:"mt-2.5 rounded-2xl bg-white p-3 text-center shadow-sm"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wider", style:{color:CINZA}}, "Código de entrega"),
      e("p",{className:"mt-0.5 text-[20px] font-black tracking-[.3em]", style:{color:NAVY}}, PIN_ENTREGA),
      e("span",{className:"text-[11.5px]", style:{color:CINZA}}, "Diga este código ao motoboy.")),
    e("div",{className:"mt-2.5 rounded-2xl bg-white p-3 shadow-sm"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wider", style:{color:CINZA}}, "Itens"),
      PEDIDO.itens.map(function(i){ return e("div",{key:i[0], className:"mt-1 flex items-center justify-between gap-2 text-[13px]", style:{color:"#111827"}}, e("span",{className:"min-w-0 truncate"}, i[1]+"× "+i[0]), e("b",{className:"shrink-0"}, brl(i[1]*i[2]))); }),
      e("div",{className:"mt-2 flex items-center justify-between border-t pt-2 text-[13px]", style:{borderColor:LINHA, color:"#111827"}}, e("b",null, "Total"), e("b",null, brl(total)))),
    feito && e("div",{className:"mt-2.5 rounded-2xl bg-white p-3 text-center shadow-sm"},
      e("b",{className:"block text-[13px]", style:{color:"#111827"}}, nota ? "Obrigada pela avaliação" : "Como foi a entrega?"),
      e("div",{className:"mt-1.5 flex justify-center gap-1"}, [1,2,3,4,5].map(function(k){ return e("button",{key:k, type:"button", "aria-label":k+" estrelas", onClick:function(){ setNota(k); }, className:"text-[20px] leading-none", style:{color:k<=nota ? OURO : LINHA}}, "★"); }))),
    e("div",{className:"mt-3 flex gap-2"},
      e("button",{type:"button", disabled:etapa===0, onClick:function(){ setEtapa(etapa-1); setNota(0); }, className:"h-10 flex-1 rounded-xl border text-[13px] font-semibold disabled:opacity-40", style:{borderColor:LINHA, color:NAVY, background:"#fff"}}, "Etapa anterior"),
      e("button",{type:"button", disabled:feito, onClick:function(){ setEtapa(etapa+1); }, className:"h-10 flex-1 rounded-xl text-[13px] font-extrabold disabled:opacity-40", style:{background:OURO, color:"#1B1409"}}, "Próxima etapa")),
    e("p",{className:"mt-2 text-center text-[10.5px]", style:{color:CINZA}}, "Demonstração: os botões avançam as etapas do pedido."));
}
export { AppCliente };
