// Sorelly Admin · montagem — components/barra-perguntas.js
// Navegação do Financeiro no padrão do estudo de design (22/10/2026): TOPO = poucas perguntas em texto (Hoje, Entradas, Saídas, Resultado, Família), sem caixinha e sem seta;
// DENTRO = abas visíveis das telas da pergunta (e, se a tela tiver partes, uma segunda linha menor). Nada de lista que abre sobre a tela.
// Cada nó: {nome, aba?, modo?, perm?, itens?} (mesmo desenho do menu em cascata). Itens sem permissão somem.
// BarraPerguntas = as perguntas, na linha de cima da página. SubAbas = as linhas de abas que rolam junto com a página.
import { e } from "@/shared/react";

function filtrar(nos, pode){
  return nos.map(function(n){
    if(n.itens){ var it = filtrar(n.itens, pode); return it.length ? Object.assign({}, n, {itens:it}) : null; }
    return pode(n) ? n : null;
  }).filter(Boolean);
}
var folhas = function(n){ return n.itens ? [].concat.apply([], n.itens.map(folhas)) : [n]; };
// caminho do topo até a tela aberta: [pergunta, tela, parte...]
function caminho(nos, ativo){
  for(var i = 0; i<nos.length; i++){ var n = nos[i];
    if(n.itens){ var sub = caminho(n.itens, ativo); if(sub) return [n].concat(sub); }
    else if(ativo(n)) return [n]; }
  return null;
}
var ULT = {};   // última tela aberta em cada pergunta (voltar a ela ao clicar de novo)

function BarraPerguntas(p){
  var nos = filtrar(p.menu, p.pode), cam = caminho(nos, p.ativo) || [], cor = p.cor || "#3B82F6";
  if(cam.length) ULT[cam[0].nome] = cam[cam.length-1];
  return e("nav",{"aria-label":"Perguntas do setor", className:"flex h-12 min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto"},
    nos.map(function(n){
      var on = cam[0]===n, destino = (ULT[n.nome] && folhas(n).indexOf(ULT[n.nome])>=0) ? ULT[n.nome] : folhas(n)[0];
      return e("button",{key:n.nome, type:"button", onClick:function(ev){ p.abrir(destino, ev); },
        className:"-mb-px h-12 shrink-0 whitespace-nowrap border-b-2 px-3 text-[13px] "+(on ? "font-semibold text-foreground" : "border-transparent text-foreground/80 hover:text-foreground"), style:on ? {borderColor:cor} : undefined}, n.nome); }));
}

function SubAbas(p){
  var nos = filtrar(p.menu, p.pode), cam = caminho(nos, p.ativo) || [], cor = p.cor || "#3B82F6", linhas = [];
  for(var nv = 0; nv<cam.length; nv++){
    if(!cam[nv].itens) break;
    (function(lista, atual, nivel){
      linhas.push(e("div",{key:"l"+nivel, role:"tablist", className:"flex gap-1 overflow-x-auto border-b border-border px-3 md:px-5 "+(nivel>1 ? "bg-white/[.03]" : "")},
        lista.map(function(n){ var on = atual===n;
          return e("button",{key:n.nome, type:"button", role:"tab", "aria-selected":on, onClick:function(ev){ p.abrir(folhas(n)[0], ev); },
            className:"-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 "+(nivel>1 ? "h-8 text-[12.5px] " : "h-9 text-[13px] ")+(on ? "font-semibold text-foreground" : "border-transparent text-foreground/80 hover:text-foreground"), style:on ? {borderColor:cor} : undefined}, n.nome); })));
    })(cam[nv].itens, cam[nv+1], nv+1);
  }
  return linhas.length ? e("div",{className:"flex flex-col"}, linhas) : null;
}

export { BarraPerguntas, SubAbas };
