// Sorelly Admin · montagem — components/ir-para.js
// Campo na barra de cima. Duas funções (pedido do Marcus, 26/10/2026):
//  · BUSCA: escreve o nome de uma tela (ex.: "maqui"); a partir de 4 letras aparecem embaixo as telas de TODOS os setores que têm o texto; clicar ou Enter abre.
//  · ENDEREÇO: cola o endereço (completo, ou só o final, com ou sem /montagem; ex.: /app-revendedora) e Enter leva direto para a tela.
// A lista de telas vem do menu (navigation/setores.js) e respeita o acesso da pessoa (prop pode). abrir(no) é o mesmo que o menu usa.
import { SETORES } from "@/apps/montagem/navigation/setores";
import { e, useRef, useState } from "@/shared/react";
import { createPortal } from "react-dom";

var MIN_LETRAS = 4, MAX_ITENS = 10;
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

// todas as telas do sistema, com o caminho de menus até elas (setor › grupo › tela)
function todasAsTelas(){
  var r = [], visto = {};
  var poe = function(n, trilha){
    if(!n || n.breve || !n.aba || !n.nome) return;
    var k = n.aba+"|"+(n.modo||"")+"|"+n.nome; if(visto[k]) return; visto[k] = 1;
    r.push({no:{aba:n.aba, nome:n.nome, modo:n.modo, perm:n.perm}, trilha:trilha});
  };
  var desce = function(nos, trilha){ (nos||[]).forEach(function(n){ if(n.itens) desce(n.itens, trilha.concat(n.nome)); else poe(n, trilha); }); };
  SETORES.forEach(function(st){
    var setor = String(st.nome||"").replace("\n", " ");
    if(st.menu) desce(st.menu, [setor]);
    (st.areas||[]).forEach(function(ar){ (ar.telas||[]).forEach(function(t){ poe(t, [setor, String(ar.nome||"").replace("\n", " ")]); }); });
    if(st.direto) poe(st.direto, [setor]);
  });
  return r;
}
var TELAS = null;

function IrPara(p){
  var st = useState(""), v = st[0], setV = st[1], si = useState(0), idx = si[0], setIdx = si[1], sf = useState(false), foco = sf[0], setFoco = sf[1];
  var ref = useRef(null);
  var texto = String(v||"").trim();
  var ehEndereco = texto.charAt(0)==="/" || /^https?:/i.test(texto) || texto.indexOf("/")>=0;
  var achadas = [];
  if(!ehEndereco && texto.length>=MIN_LETRAS && p.abrir){
    if(!TELAS) TELAS = todasAsTelas();
    var termos = norm(texto).split(/\s+/).filter(Boolean);
    achadas = TELAS.filter(function(x){ var t = norm(x.trilha.join(" ")+" "+x.no.nome);
      return termos.every(function(w){ return t.indexOf(w)>=0; }) && (!p.pode || p.pode(x.no)); })
      .sort(function(a, b){ var pa = norm(a.no.nome).indexOf(termos[0])<0 ? 1 : 0, pb = norm(b.no.nome).indexOf(termos[0])<0 ? 1 : 0; return pa-pb; })
      .slice(0, MAX_ITENS);
  }
  var abre = function(x){ setV(""); setIdx(0); setFoco(false); if(ref.current) ref.current.blur(); p.abrir(x.no); };
  var irEndereco = function(){
    if(!texto) return;
    var caminho = texto;
    try{ var u = new URL(texto, window.location.origin); if(u.origin!==window.location.origin){ caminho = u.pathname+u.search; } else caminho = u.pathname+u.search+u.hash; }catch(x){}
    if(caminho.charAt(0)!=="/") caminho = "/"+caminho;
    p.navigate(caminho); setV("");
  };
  var r = ref.current ? ref.current.getBoundingClientRect() : null;
  var mostra = foco && !ehEndereco && texto.length>=MIN_LETRAS && r;
  var largura = 340;
  return [e("input",{key:"i", ref:ref, value:v, placeholder:"Buscar tela ou colar endereço", title:"Escreva o nome de uma tela (a partir de 4 letras) ou cole o endereço que o Claude mandou e aperte Enter", "aria-label":"Buscar tela ou ir para o endereço",
    autoComplete:"off", onFocus:function(){ setFoco(true); }, onBlur:function(){ setTimeout(function(){ setFoco(false); }, 150); },
    className:"hidden h-9 w-44 shrink-0 rounded-lg bg-white/10 px-3 text-[12.5px] text-white placeholder:text-white/60 outline-none focus:bg-white/15 focus:ring-1 focus:ring-primary md:block lg:w-56",
    onChange:function(ev){ setV(ev.target.value); setIdx(0); },
    onKeyDown:function(ev){
      if(ev.key==="ArrowDown" && achadas.length){ ev.preventDefault(); setIdx(Math.min(idx+1, achadas.length-1)); }
      else if(ev.key==="ArrowUp" && achadas.length){ ev.preventDefault(); setIdx(Math.max(idx-1, 0)); }
      else if(ev.key==="Escape"){ setV(""); ev.target.blur(); }
      else if(ev.key==="Enter"){ if(achadas[idx]) abre(achadas[idx]); else irEndereco(); } }}),
    mostra && createPortal(e("div",{key:"l", role:"listbox", className:"fixed z-[70] max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg",
      style:{top:r.bottom+4, left:Math.max(8, Math.min(r.left, window.innerWidth-largura-8)), width:largura}},
      achadas.length ? achadas.map(function(x, i){
        return e("button",{key:i, type:"button", role:"option", "aria-selected":i===idx, onMouseDown:function(ev){ ev.preventDefault(); abre(x); }, onMouseEnter:function(){ setIdx(i); },
          className:"flex w-full flex-col justify-center border-b border-border px-3 py-1 text-left text-white last:border-b-0", style:i===idx ? {background:"#B8862B", minHeight:38} : {minHeight:38}},
          e("span",{className:"truncate text-[13px] font-medium"}, x.no.nome), e("span",{className:"truncate text-[11px]"}, x.trilha.join(" › "))); })
        : e("p",{className:"px-3 py-2 text-[13px] text-white"}, "Nenhuma tela com esse nome")), document.body)];
}

export { IrPara };
