// Sorelly Admin · montagem — pages/pedidos/pecas-ui.js
// Peças das telas de pedidos de peças (Pedir peças em Kits e Solicitações no Cadastro de peças): formulário do pedido, selo de situação e urgência.
// Regras em domain/pedidos-pecas.js (estado s.pp). Padrão do Financeiro: campos de 32 px, texto 13 px que corta com "…".
import { Botao, CAMPO, CampoSel, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { BANHOS, MODELOS, PUBLICOS, TIPOS_PECA, URGENCIAS } from "@/apps/montagem/domain/pedidos-pecas";
import { e, useState } from "@/shared/react";

var COR_ST = {aberto:"#FBBF24", ok:"#60A5FA", pronto:"#4ADE80", sem:"#EF4444"};
var COR_URG = {critico:"#EF4444", alta:"#FBBF24", normal:"#94A3B8"};
var VAZIO = {tipo:"", banho:"tanto", publico:"", modelos:"3", urg:"normal", texto:""};

// selo de situação / urgência: texto na cor do estado, em uma linha
function Selo(p){ return e("span",{className:"inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-bold", style:{background:p.cor+"26", color:p.cor}, title:p.t}, p.t); }

// formulário do pedido: peça, banho, público, quantos modelos, urgência e texto livre; onEnviar(dados) devolve true se o cadastro aceitou
function FormPedido(p){
  var st = useState(VAZIO), v = st[0], set = function(k, x){ st[1](Object.assign({}, v, {[k]:x})); };
  var enviar = function(){ if(p.onEnviar(v)) st[1](VAZIO); };
  return e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
    e(CampoSel,{t:"Peça", id:"pp-tipo", value:v.tipo, onChange:function(x){ set("tipo", x); }, opcoes:[["", "Escolha"]].concat(TIPOS_PECA.map(function(t){ return [t, t]; }))}),
    e(CampoSel,{t:"Banho", id:"pp-banho", value:v.banho, onChange:function(x){ set("banho", x); }, opcoes:BANHOS}),
    e(CampoSel,{t:"Público", id:"pp-publico", value:v.publico, onChange:function(x){ set("publico", x); }, opcoes:[["", "Qualquer"]].concat(PUBLICOS)}),
    e(CampoSel,{t:"Modelos", id:"pp-modelos", value:v.modelos, onChange:function(x){ set("modelos", x); }, opcoes:MODELOS.map(function(n){ return [String(n), String(n)]; })}),
    e(CampoSel,{t:"Urgência", id:"pp-urg", value:v.urg, onChange:function(x){ set("urg", x); }, opcoes:URGENCIAS}),
    e("div",{className:"col-span-2 min-w-0"},
      e(Rotulo,{t:"Detalhe", id:"pp-texto"}),
      e("input",{id:"pp-texto", value:v.texto, onChange:function(ev){ set("texto", ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") enviar(); }, placeholder:"Ex.: letras A, M · tamanho 16 · ponto de luz", className:CAMPO})),
    e("div",{className:"flex items-end justify-end"}, e(Botao,{principal:true, onClick:enviar}, "Enviar pedido")));
}

export { COR_ST, COR_URG, Selo, FormPedido };
