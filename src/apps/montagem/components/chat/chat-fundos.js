// Sorelly Admin · montagem — components/chat/chat-fundos.js
// Fundos de conversa (estilo WhatsApp): desenhos repetidos sobre uma cor. Cada pessoa escolhe o seu; o padrão é "Joias douradas".
// A escolha fica por pessoa (state.usuarios[cid].fundo). Cada fundo também define a cor das mensagens, para combinar.
import { api, euAgora, useChat } from "@/apps/montagem/domain/chat-store";
import { Ph, W } from "@/apps/montagem/components/chat/chat-ui";
import { e } from "@/shared/react";

var ICONES = {
  dia:'<path d="M3 7l3.5-4h7L17 7l-7 10z M3 7h14"/>', cor:'<path d="M10 17C3 12 3 6 6.5 5 8.5 4.5 10 6 10 7c0-1 1.5-2.5 3.5-2C17 6 17 12 10 17z"/>',
  est:'<path d="M10 2l2.4 5 5.4.7-4 3.7 1 5.4L10 14l-4.8 2.8 1-5.4-4-3.7 5.4-.7z"/>', ane:'<circle cx="10" cy="13" r="5"/><path d="M8 5l2-3 2 3-2 2z"/>',
  coa:'<path d="M3 15l-1-9 4.5 4L10 4l3.5 6L18 6l-1 9z M3 17h14"/>', fol:'<path d="M4 16C4 8 9 4 16 4 16 11 12 16 4 16z M4 16L12 8"/>',
  bri:'<path d="M10 2l1.5 6.5L18 10l-6.5 1.5L10 18l-1.5-6.5L2 10l6.5-1.5z"/>'};
var POS = [[6,8,-14],[36,4,10],[10,38,8],[40,36,-12],[24,22,0],[50,20,16]];
// id, nome, cor de fundo, cor do desenho, desenhos, mensagem recebida, mensagem enviada, texto
var TEMAS = [
  {id:"joias-ouro", nome:"Joias douradas", fundo:"#0b141a", traco:"rgba(232,184,75,.30)", icones:["dia","ane","coa","bri"], entrada:"#202c33", saida:"#005c4b", texto:"#e9edef"},
  {id:"joias-rosa", nome:"Joias rosa", fundo:"#1c0f14", traco:"rgba(255,150,180,.30)", icones:["dia","ane","coa","bri"], entrada:"#2f1a22", saida:"#7a2d4b", texto:"#f6e6ea"},
  {id:"coracoes-rosa", nome:"Corações rosa", fundo:"#1c0f14", traco:"rgba(255,150,180,.28)", icones:["cor","est","cor","bri"], entrada:"#2f1a22", saida:"#7a2d4b", texto:"#f6e6ea"},
  {id:"folhas-verde", nome:"Folhas verdes", fundo:"#0b1a14", traco:"rgba(120,220,170,.26)", icones:["fol","bri","fol","cor"], entrada:"#14291f", saida:"#1f6b4a", texto:"#e6f4ec"},
  {id:"liso-grafite", nome:"Liso grafite", fundo:"#15181b", traco:null, icones:[], entrada:"#23282d", saida:"#2f5d50", texto:"#e9edef"},
  {id:"pontinhos", nome:"Pontinhos clássico", fundo:"#0b141a", traco:null, pontos:true, icones:[], entrada:"#202c33", saida:"#005c4b", texto:"#e9edef"}
];
var PADRAO = "joias-ouro";
function tema(id){ return TEMAS.find(function(t){ return t.id===id; }) || TEMAS[0]; }
function svgFundo(t){
  var g = t.icones.map(function(n, k){ var p = POS[k]; return '<g transform="translate('+p[0]+' '+p[1]+') rotate('+p[2]+' 7.5 7.5) scale(.75)">'+ICONES[n]+'</g>'; }).join("");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><g fill="none" stroke="'+t.traco+'" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+g+'</g></svg>';
}
/** estilo CSS do fundo (a cor + o desenho repetido) */
function estiloFundo(id){
  var t = tema(id);
  if(t.pontos) return {backgroundColor:t.fundo, backgroundImage:"radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize:"22px 22px"};
  if(!t.traco) return {backgroundColor:t.fundo};
  return {backgroundColor:t.fundo, backgroundImage:'url("data:image/svg+xml,'+encodeURIComponent(svgFundo(t))+'")', backgroundSize:"64px 64px"};
}
function SeletorFundo(p){
  var st = useChat(), eu = p.eu || euAgora(), atual = (st.usuarios[eu] && st.usuarios[eu].fundo) || PADRAO;
  return e("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-3"}, TEMAS.map(function(t){ var on = atual===t.id;
    return e("button",{key:t.id, onClick:function(){ api.setFundo(eu, t.id); }, "aria-label":"Fundo "+t.nome, "aria-pressed":on, className:"text-left"},
      e("span",{className:"relative flex h-28 flex-col justify-center gap-1.5 overflow-hidden rounded-xl p-2.5", style:Object.assign({outline:on ? "3px solid "+W.ouro : "1px solid "+W.borda, outlineOffset:on ? 1 : 0}, estiloFundo(t.id))},
        e("span",{className:"self-start rounded-md px-2 py-1 text-[11px]", style:{background:t.entrada, color:t.texto}}, "Bom dia!"),
        e("span",{className:"self-end rounded-md px-2 py-1 text-[11px]", style:{background:t.saida, color:t.texto}}, "Já vi aqui"),
        on && e("span",{className:"absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full", style:{background:W.ouro, color:"#24180a"}}, e(Ph,{n:"check", s:12}))),
      e("span",{className:"mt-1 block text-center text-[12.5px]"}, t.nome+(t.id===PADRAO ? " (padrão)" : ""))); }));
}
export { TEMAS, PADRAO, tema, estiloFundo, SeletorFundo };
