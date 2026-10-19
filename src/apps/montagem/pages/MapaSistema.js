// Sorelly Admin · montagem — pages/MapaSistema.js
// Tecnologia → Mapa do sistema: uma tela só para ver tudo o que existe, setor por setor, em que pé está cada tela e o que precisa ser trocado.
// O status vem do próprio menu (navigation/setores.js): pronto, integrado do admin antigo, a trazer ou em breve. A anotação "o que trocar" fica
// salva neste navegador (por tela) até existir servidor.
import { SETORES, SETORES_BAIXO } from "@/apps/montagem/navigation/setores";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var CHAVE = "sorelly_mapa_notas_v1";
var STATUS = {
  pronto:["Pronto","#E8B84B","A tela existe e funciona"], integrado:["Integrado","#22C55E","Veio do admin antigo e já foi integrado"],
  trazer:["A trazer","#3B82F6","Existe no admin antigo, falta integrar"], breve:["Em breve","#94A3B8","Só o espaço no menu"]};
function statusDe(t){ return t.breve ? (t.enviar ? "trazer" : "breve") : (t.integrado ? "integrado" : "pronto"); }
function carregar(){ try{ return JSON.parse(localStorage.getItem(CHAVE)||"{}") || {}; }catch(x){ return {}; } }
var sem = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); };

function AbaMapa(){
  var cx = use(), d = cx.dispatch, nt = useState(carregar), notas = nt[0], setNotas = nt[1];
  var fl = useState("todos"), filtro = fl[0], setFiltro = fl[1], bq = useState(""), busca = bq[0], setBusca = bq[1];
  var salvar = function(chave, texto){ var n = Object.assign({}, notas); if(texto.trim()) n[chave] = texto; else delete n[chave]; setNotas(n); try{ localStorage.setItem(CHAVE, JSON.stringify(n)); }catch(x){} };
  var setores = SETORES.concat(SETORES_BAIXO).map(function(st){
    var telas = st.direto ? [{area:st.nome, t:st.direto}] : [].concat.apply([], st.areas.map(function(ar){ return ar.telas.map(function(t){ return {area:ar.nome, t:t}; }); }));
    return {st:st, telas:telas.map(function(x){ return {area:String(x.area).replace(/\n/g," "), t:x.t, k:statusDe(x.t), chave:st.id+"|"+x.t.nome}; })};
  });
  var todas = [].concat.apply([], setores.map(function(s){ return s.telas; }));
  var cont = {pronto:0, integrado:0, trazer:0, breve:0}; todas.forEach(function(x){ cont[x.k]++; });
  var comNota = todas.filter(function(x){ return notas[x.chave]; }).length, q = sem(busca);
  var visivel = function(x){ return (filtro==="todos" || (filtro==="notas" ? !!notas[x.chave] : x.k===filtro)) && (!q || sem(x.t.nome+" "+x.area+" "+(notas[x.chave]||"")).indexOf(q)>=0); };
  var chip = function(k, rot, n, cor){ var on = filtro===k;
    return e("button",{key:k, onClick:function(){ setFiltro(k); }, className:"flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold ring-1 "+(on ? "ring-2 ring-primary bg-primary/15" : "bg-card ring-border hover:bg-muted/40")},
      cor && e("span",{className:"size-2.5 rounded-full", style:{background:cor}}), rot, e("span",{className:"rounded-full bg-black/30 px-2 text-[11.5px]"}, n)); };
  return e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Mapa do sistema", sub:"Tudo o que já foi feito, o que falta trazer e o que precisa ser trocado, setor por setor."}),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      chip("todos","Tudo",todas.length), Object.keys(STATUS).map(function(k){ return chip(k, STATUS[k][0], cont[k], STATUS[k][1]); }), chip("notas","Com anotação",comNota),
      e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar tela, área ou anotação", "aria-label":"Buscar", className:"h-9 min-w-48 flex-1 rounded-lg border border-border bg-black/20 px-3 text-[13px] outline-none focus:border-primary"})),
    setores.map(function(sx){ var linhas = sx.telas.filter(visivel); if(!linhas.length) return null;
      var feitas = sx.telas.filter(function(x){ return x.k==="pronto" || x.k==="integrado"; }).length;
      return e("section",{key:sx.st.id, className:"overflow-hidden rounded-xl bg-card ring-2 ring-[#E8B84B]/30"},
        e("div",{className:"flex items-center gap-3 px-4 py-2.5", style:{background:sx.st.cor+"26", boxShadow:"inset 4px 0 0 "+sx.st.cor}},
          e("span",{className:"grid size-8 place-items-center rounded-lg text-white", style:{background:sx.st.cor}}, e(Icon,{n:sx.st.ic, s:16, peso:"fill"})),
          e("b",{className:"flex-1 text-[15px]"}, String(sx.st.nome).replace(/\n/g," ")), e("span",{className:"text-[12px] text-white/70"}, feitas+" de "+sx.telas.length+" prontas")),
        e("div",{className:"flex flex-col"}, linhas.map(function(x){ var stt = STATUS[x.k];
          return e("div",{key:x.chave, className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 px-4 py-2 text-[13px]"},
            e("span",{className:"w-24 shrink-0 rounded-md px-2 py-0.5 text-center text-[11px] font-bold", style:{background:stt[1]+"26", color:stt[1]}, title:stt[2]}, stt[0]),
            e("span",{className:"min-w-[12rem] flex-1"}, e("b",null, x.t.nome), e("span",{className:"ml-2 text-[11.5px] text-white/60"}, x.area!==x.t.nome ? x.area : ""), x.t.origem && x.t.origem.length>0 && e("span",{className:"block text-[11px] text-white/55"}, "Vem de: "+x.t.origem.join(" · "))),
            e("input",{defaultValue:notas[x.chave]||"", onBlur:function(ev){ salvar(x.chave, ev.target.value); }, placeholder:"O que precisa trocar ou ajustar nesta tela…", "aria-label":"Anotação de "+x.t.nome,
              className:"h-8 min-w-[14rem] flex-[1.4] rounded-md border border-border bg-black/20 px-2.5 text-[12.5px] outline-none focus:border-primary"}),
            !x.t.breve && e("button",{onClick:function(){ d({type:"ABA", aba:x.t.aba}); }, className:"rounded-md bg-black/30 px-2.5 py-1 text-[11.5px] font-bold hover:bg-black/50"}, "Abrir ›")); })));
    }));
}
export { AbaMapa };
