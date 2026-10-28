// Sorelly Admin · montagem e bipagem — ui/page.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { badge } from "@/apps/montagem/ui/badge";
import { chaveDeNo, gravarFavoritas, lerFavoritas } from "@/apps/montagem/lib/favoritas";
import { abaDoCaminho, setorDaAba } from "@/apps/montagem/router/slugs";
import { use } from "@/apps/montagem/state/context";
import { useLocation } from "react-router-dom";
import { e, useEffect, useState } from "@/shared/react";

function AlertaBadge(p){
  if(p.a==="vermelho") return badge(p.curto?"Risco de sa\u00edda":"Abaixo de 3, risco de sa\u00edda","destructive","alert");
  if(p.a==="amarelo") return badge(p.curto?"Aten\u00e7\u00e3o":"Abaixo de 4, aten\u00e7\u00e3o","warning","alert");
  if(p.a==="sem") return badge("Aguardando notas","muted");
  return badge("Em dia","success","check");
}
// Favoritar a tela (28/10/2026, pedido do Marcus): saiu da faixa de abas do topo (ficava cheia de estrela) e virou um bot\u00e3o aqui, no canto do t\u00edtulo.
// Sem favorita: "\u2606 Favoritar aba". J\u00e1 favorita: s\u00f3 a \u2605 (sem o texto, para n\u00e3o ocupar espa\u00e7o \u00e0 toa).
function BotaoFavoritar(p){
  var cx = use(), s = cx && cx.state;
  var loc = useLocation();
  var aba = abaDoCaminho(loc.pathname).aba;
  var st = aba==="breve" ? null : setorDaAba(aba);
  var setorNome = st ? String(st.nome||"").replace(/\n/g," ") : "Sorelly Admin";
  var visao = s && s.visaoMenu==="marcus" && s.usuario===16 ? "marcus" : "admin";
  var k = chaveDeNo({aba:aba, nome:p.t}, setorNome);
  var fs = useState(function(){ return lerFavoritas(visao); }), favs = fs[0], setFavs = fs[1];
  useEffect(function(){ var f = function(){ setFavs(lerFavoritas(visao)); }; window.addEventListener("sorelly-favoritas", f); return function(){ window.removeEventListener("sorelly-favoritas", f); }; }, [visao]);
  var fav = favs.some(function(x){ return x.k===k; });
  var alternar = function(){
    if(fav) gravarFavoritas(visao, favs.filter(function(x){ return x.k!==k; }));
    else gravarFavoritas(visao, favs.concat([{k:k, nome:p.t, aba:aba, setor:setorNome, cor:st ? st.cor : undefined}]));
  };
  if(!aba || aba==="inicio") return null;   // In\u00edcio j\u00e1 fica sempre fixo na faixa; n\u00e3o precisa favoritar
  return fav
    ? e("button",{type:"button", onClick:alternar, title:"Tirar dos favoritos", "aria-label":"Tirar "+p.t+" dos favoritos", className:"shrink-0 text-[17px] leading-none text-[#D9A63A]"}, "\u2605")
    : e("button",{type:"button", onClick:alternar, title:"Fixar nos favoritos", "aria-label":"Fixar "+p.t+" nos favoritos", className:"flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted-foreground hover:text-foreground"},
        e("span",{className:"text-[15px] leading-none"}, "\u2606"), "Favoritar aba");
}
function PageHead(p){
  return e("div",{className:"flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"},
    e("div",{className:"flex min-w-0 flex-col gap-1"},
      e("h1",{className:"font-heading text-2xl font-semibold tracking-wide"}, p.t),
      e("p",{className:"text-[15px] text-muted-foreground"}, p.sub)),
    e("div",{className:"flex flex-wrap items-center gap-3"},
      e(BotaoFavoritar,{t:p.t}),
      p.children && e("div",{className:"flex flex-wrap gap-2"}, p.children)));
}
function Secao(p){
  return e("section",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-baseline justify-between gap-2"},
      e("h2",{className:"font-heading text-lg font-semibold"}, p.t),
      p.sub && e("span",{className:"text-sm text-muted-foreground"}, p.sub)),
    p.children);
}

export { AlertaBadge, PageHead, Secao };
