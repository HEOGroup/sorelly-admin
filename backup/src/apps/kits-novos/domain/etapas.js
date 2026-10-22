// Sorelly Admin · kits novos Curitiba — domain/etapas.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { MESES, diasDesde } from "@/apps/kits-novos/lib/datas";

var ETAPAS = [
  {k:"cadastrada", n:1, nome:"Cadastrada", campo:"cad", ic:"user"},
  {k:"liberado",   n:2, nome:"Liberado",   campo:"lib", ic:"check"},
  {k:"solicitado", n:3, nome:"Solicitado", campo:"sol", ic:"box"},
  {k:"bipado",     n:4, nome:"Bipado",     campo:"bip", ic:"scan"},
  {k:"entregue",   n:5, nome:"Entregue",   campo:"ret", ic:"gem"}
];
var ETAPA = {}; ETAPAS.forEach(function(x){ ETAPA[x.k]=x; });
function etapaDe(c){ return ETAPA[c.st]; }
function dataEtapa(c){ var et = etapaDe(c); return et ? c[et.campo] || c.cad : c.cad; }
function diasNaEtapa(c){ return diasDesde(dataEtapa(c)); }
function prazoDe(c, cfg){ return cfg.prazos[c.st] || 0; }
function aberto(c){ return c.st!=="entregue" && c.st!=="cancelado"; }
function atrasado(c, cfg){ return aberto(c) && diasNaEtapa(c) > prazoDe(c, cfg); }
function mesDe(c){ return c.cad ? MESES[+c.cad.split("-")[1]-1] : c.mes; }
function contatosFeitos(c){ return (c.c1?1:0)+(c.c2?1:0)+(c.c3?1:0); }

export { ETAPAS, ETAPA, etapaDe, dataEtapa, diasNaEtapa, prazoDe, aberto, atrasado, mesDe, contatosFeitos };
