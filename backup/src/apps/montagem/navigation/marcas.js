// Sorelly Admin · montagem e bipagem — navigation/marcas.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Icon } from "@/apps/montagem/ui/icon";
import { e } from "@/shared/react";

var MARCAS = {admin:{ic:"m_admin", cor:"#3B82F6", lb:"Tem no admin", sub:"falta mandar"}, pronto:{ic:"m_pronto", cor:"#A855F7", lb:"Pronto + admin", sub:"admin a mandar"},
  integ:{ic:"m_integ", cor:"#22C55E", lb:"Integrado", sub:"veio do admin"}, proto:{ic:"m_proto", cor:"#D9A63A", lb:"Protótipo", sub:"feito aqui"}, criar:{ic:"m_criar", cor:"#94A3B8", lb:"A criar", sub:"não existe ainda"}};
function marcaDe(t){ return t.enviar ? "admin" : t.adm ? "pronto" : t.integrado ? "integ" : t.breve ? "criar" : "proto"; }
function MarcaTela(p){ var m = MARCAS[p.k || marcaDe(p.t)];
  return e("span",{title:m.lb+" · "+m.sub, className:"grid shrink-0 place-items-center rounded-md "+(p.mini ? "size-4" : "size-6"), style:{background:m.cor+"26", color:m.cor, boxShadow:"inset 0 0 0 1px "+m.cor+"55"}},
    e(Icon,{n:m.ic, s:p.mini ? 10 : 13, peso:"fill"})); }

export { MARCAS, marcaDe, MarcaTela };
