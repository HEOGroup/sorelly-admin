// Sorelly Admin — mobile/bip-comum.js
// Peças COMPARTILHADAS da bipagem pela câmera (28/11/2026, Marcus: "não criar cinco tecnologias diferentes de leitura").
// Usadas em: peças que voltaram, brindes (Normal e BB), peças do próximo mês e conferência do novo kit.
//   CameraBipagem  = a câmera (leitor-camera.js) que abre sozinha, com 190 px; fechada ou bloqueada, o mesmo espaço vira o botão de reabrir.
//   AvisoBip       = o aviso do resultado da leitura, sempre do mesmo tamanho (não empurra a lista).
//   indexar / conhecido / identificar / useNomes = troca o NÚMERO DE BARRAS da etiqueta (00033139) pelo CÓDIGO COMERCIAL da peça (COL0088).
// Cada tela faz as suas validações comerciais; aqui não há regra de negócio nem valor.
import { chamar } from "@/apps/montagem/lib/api";
import { ALTURA_CAMERA, LeitorCamera } from "@/apps/montagem/mobile/leitor-camera";
import { e, useState } from "@/shared/react";

var BR = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };

function CameraBipagem(p){
  var cm = useState(true), on = cm[0], setOn = cm[1], alt = p.altura || ALTURA_CAMERA;
  return on ? e(LeitorCamera,{aoLer:p.aoLer, altura:alt, semBip:true, aoDesligar:function(){ setOn(false); }})
    : e("button",{type:"button", onClick:function(){ setOn(true); }, "aria-label":"Abrir câmera", className:"flex w-full shrink-0 items-center justify-center border border-[#C9A13B]/60 bg-[#F8F3E8] text-[13px] font-semibold text-[#8A6A12]", style:{height:alt+"px"}}, "Toque para abrir a câmera");
}

// aviso = {tipo:"ok"|"repetida"|"buscando"|"fora"|"nao"|"limite", codigo, texto, valor}. Vermelho só para peça recusada; âmbar para repetida; verde para registrada.
function AvisoBip(p){
  var u = p.aviso; if(!u) return null;
  var cor = u.tipo==="ok" ? "border-[#16A34A]/50 bg-[#F0FDF4] text-[#15803D]" : u.tipo==="repetida" || u.tipo==="buscando" ? "border-[#C9A13B] bg-[#FBF3DC] text-[#6B4A06]" : "border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]";
  return e("div",{role:"status", className:"flex shrink-0 flex-col border px-3 py-1 text-left text-[13px] leading-snug "+cor},
    e("div",{className:"flex items-center justify-between gap-2 font-semibold"}, e("span",{className:"whitespace-nowrap"}, u.codigo), u.valor ? e("span",{className:"whitespace-nowrap"}, BR(u.valor)) : null),
    e("span",null, u.texto));
}

// ── Número de barras -> código comercial ──
// 1º: o que já está carregado (as condicionais da revendedora trazem o número de barras de cada peça): sem ida ao servidor.
// 2º: peça de fora das condicionais: UMA consulta ao cadastro oficial de produtos da DevMaster (rota /representante/peca?leve=1), e a resposta fica guardada.
// Nunca inventa código: sem correspondência no cadastro, a peça fica como "código não localizado".
var CACHE = {}, PEND = {};
var sz = function(x){ return String(x||"").replace(/^0+/, ""); };
var numero = function(c){ return /^\d{4,}$/.test(String(c||"")); };
function indexar(conds){
  (conds||[]).forEach(function(c){ (c.grupos||[]).forEach(function(g){ (g.itens||[]).forEach(function(i){
    if(i.barras && sz(i.barras) && i.codigo) CACHE[sz(i.barras)] = {codigo:String(i.codigo).trim().toUpperCase(), desc:i.desc||""}; }); }); });
}
// Já sei que peça é? Devolve {codigo, desc}, {nao:true} (não existe no cadastro) ou null (ainda não consultado).
function conhecido(cod){ var k = sz(cod), c = numero(cod) ? CACHE[k] : null; if(c && c.falhou && Date.now()-c.em > 20000){ delete CACHE[k]; return null; } return c || null; }
function identificar(cod){
  cod = String(cod||"").trim().toUpperCase();
  if(!numero(cod)) return Promise.resolve({codigo:cod});
  var k = sz(cod), c = conhecido(cod); if(c) return Promise.resolve(c);
  if(PEND[k]) return PEND[k];
  PEND[k] = chamar("GET", "/representante/peca?leve=1&q="+encodeURIComponent(cod)).then(function(r){
    delete PEND[k]; CACHE[k] = r && r.achou && r.codigo ? {codigo:String(r.codigo).trim().toUpperCase(), desc:r.desc||""} : {nao:true}; return CACHE[k];
  }).catch(function(){ delete PEND[k]; CACHE[k] = {nao:true, falhou:true, em:Date.now()}; return CACHE[k]; });   // sem resposta do servidor: tenta de novo depois de 20 segundos
  return PEND[k];
}
// Para as telas de conferência: nome(cod) devolve {codigo, achou} na hora; se ainda não sabe, consulta e redesenha a tela quando a resposta chega (achou = null enquanto busca).
function useNomes(){
  var t = useState(0), setT = t[1];
  return function(cod){
    cod = String(cod||"");
    if(!numero(cod)) return {codigo:cod, achou:true};
    var c = conhecido(cod);
    if(c) return c.nao ? {codigo:cod, achou:false} : {codigo:c.codigo, desc:c.desc, achou:true};
    identificar(cod).then(function(){ setT(function(n){ return n+1; }); });
    return {codigo:cod, achou:null};
  };
}

export { CameraBipagem, AvisoBip, indexar, conhecido, identificar, useNomes };
