// Sorelly Admin · kits novos Curitiba — components/badges.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { nomeEntrada } from "@/apps/kits-novos/domain/config";
import { aberto, atrasado, diasNaEtapa, etapaDe, prazoDe } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { badge } from "@/apps/kits-novos/ui/badge";
import { MONO } from "@/apps/kits-novos/ui/input";
import { e } from "@/shared/react";
import React from "react";

var ST_TP = {cadastrada:"muted", liberado:"purple", solicitado:"primary", bipado:"info", entregue:"success", cancelado:"destructive"};
function StBadge(p){ var c = p.c; if(c.st==="cancelado") return badge("Cancelado","destructive","ban"); var et = etapaDe(c); return badge(et.nome, ST_TP[c.st], et.ic); }
function EntBadge(p){ var s = use().state, c = p.c, n = nomeEntrada(c, s.cfg);
  var tp = c.ent==="Indica\u00e7\u00e3o"?"purple":c.ent==="P\u00f3s venda"?"info":c.ent==="An\u00fancio"?"primary":c.ent?"muted":"muted"; return badge(n||"\u2014", tp); }
function Contatos(p){ var c = p.c; return e("span",{className:"inline-flex gap-1"}, [c.c1,c.c2,c.c3].map(function(b,i){
  return e("span",{key:i, className:MONO+" grid size-5 place-items-center rounded-full text-[11px] font-bold "+(b?"bg-success text-primary-foreground":"bg-muted text-muted-foreground")}, i+1); })); }
function Etiquetas(p){ var s = use().state, c = p.c;
  return e(React.Fragment,null,
    atrasado(c, s.cfg) && badge("Atrasada "+(diasNaEtapa(c)-prazoDe(c,s.cfg))+"d","destructive","alert"),
    (c.desm||0)>0 && badge(c.desm+(c.desm>1?" desmarca\u00e7\u00f5es":" desmarca\u00e7\u00e3o"), c.desm>=s.cfg.maxDesmarcacoes?"destructive":"warning","calendar"),
    c.tipo==="Retornando" && badge("Retornando","purple","refresh"),
    c.rep==="Sorelly" && badge("Vem na empresa","info"),
    c.obs && /EXPOSITOR/i.test(c.obs) && badge("Expositor","warning"),
    c.obs && /FALTA LIGAR/i.test(c.obs) && aberto(c) && badge("Falta ligar","warning","message")); }

export { ST_TP, StBadge, EntBadge, Contatos, Etiquetas };
