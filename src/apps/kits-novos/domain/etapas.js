// Sorelly Admin · kits novos Curitiba — domain/etapas.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { MESES, diasDesde } from "@/apps/kits-novos/lib/datas";

// Funil do kit novo (23/10/2026): do cadastro até a revendedora receber o kit. As etapas Aceito, Em contato, Agendado e Retirado são o caminho da REPRESENTANTE
// (quando passa para ela, é onde o kit mais demora). Bipado = kit pronto na empresa; Retirado = a representante pegou o kit.
var ETAPAS = [
  {k:"liberado",   n:1,  nome:"Liberado",   campo:"lib", ic:"check"},
  {k:"solicitado", n:2,  nome:"Solicitado", campo:"sol", ic:"box"},
  {k:"bipado",     n:3,  nome:"Bipado",     campo:"bip", ic:"scan"},
  {k:"entregue",   n:4,  nome:"Entregue",   campo:"ret", ic:"gem"},
  {k:"devolvido",  n:5,  nome:"Devolvido",  campo:"dev", ic:"undo"}
];
// As etapas antigas (Cadastrada, Aceito, Em contato, Agendado, Montando, Retirado) saíram: a Michele não as usa. Registro antigo passa para a etapa mais próxima.
var LEGADO = {cadastrada:"liberado", aceito:"solicitado", contato:"solicitado", agendado:"solicitado", montando:"solicitado", retirado:"bipado"};
function estadoAtual(st){ return LEGADO[st] || st; }
var ETAPA = {}; ETAPAS.forEach(function(x){ ETAPA[x.k]=x; });
function etapaDe(c){ return ETAPA[c.st]; }
function dataEtapa(c){ var et = etapaDe(c); return et ? c[et.campo] || c.cad : c.cad; }
function diasNaEtapa(c){ return diasDesde(dataEtapa(c)); }
function prazoDe(c, cfg){ return cfg.prazos[c.st] || 0; }
// ainda no funil: só sai quando a condicional volta (Devolvido) ou cancela. Entregue = o kit chegou na revendedora, falta a condicional voltar (prazo de 3 dias em Configurador)
function aberto(c){ return c.st!=="devolvido" && c.st!=="cancelado"; }
// o kit já foi entregue à revendedora (Entregue ou Devolvido)
function entregou(c){ return c.st==="entregue" || c.st==="devolvido"; }
// em andamento antes da entrega (o que está com a Michele, a representante ou a montagem)
function emCurso(c){ return aberto(c) && c.st!=="entregue"; }
// data em que o kit saiu de vez do funil (condicional devolvida; sem ela, a da entrega)
function dataFim(c){ return c.dev || c.ret; }
function atrasado(c, cfg){ return aberto(c) && diasNaEtapa(c) > prazoDe(c, cfg); }
function mesDe(c){ return c.cad ? MESES[+c.cad.split("-")[1]-1] : c.mes; }
function contatosFeitos(c){ return (c.c1?1:0)+(c.c2?1:0)+(c.c3?1:0); }

export { ETAPAS, ETAPA, LEGADO, estadoAtual, etapaDe, dataEtapa, diasNaEtapa, prazoDe, aberto, entregou, emCurso, dataFim, atrasado, mesDe, contatosFeitos };
