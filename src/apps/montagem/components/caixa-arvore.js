// Sorelly Admin · montagem — components/caixa-arvore.js
// MENU POR NÍVEIS da janela azul (Marcus, 24/11/2026): cópia da CaixaArvore da janela "Lançar recebimento" (Contas a receber) para a janela "Lançar pagamento" do Resumo - Pagamentos.
// Clicou em Empresa ou Sócios, some tudo e aparece só o nível de baixo (Sócios › Marcus › 68 Gang Performance); "Voltar" sobe um nível; com texto na busca mostra o caminho inteiro. Abre para baixo (ou para cima se não couber).
// arvore = [{t, filhos?:[...], itens?:[[id, texto, textoCompleto?]]}]. Props: rot, valor, arvore, vazio, aoMudar, cls, estilo, fundo, campoCls.
import { e, useEffect, useRef, useState } from "@/shared/react";

var semAc = function(t){ return String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

function CaixaArvore(p){
  var so = useState(false), aberto = so[0], setAberto = so[1], sb = useState(""), busca = sb[0], setBusca = sb[1], sc = useState([]), caminho = sc[0], setCaminho = sc[1], ref = useRef(null);
  useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    var esc = function(ev){ if(ev.key==="Escape"){ ev.stopPropagation(); setAberto(false); } };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc, true);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc, true); };
  }, [aberto]);   // eslint-disable-line react-hooks/exhaustive-deps -- setAberto não muda
  var folhas = [];
  var anda = function(nos, trilha){ nos.forEach(function(n){ var t2 = trilha.concat([n.t]); (n.itens || []).forEach(function(it){ folhas.push({id:it[0], t:it[1], cheio:it[2] || it[1], trilha:t2}); }); if(n.filhos) anda(n.filhos, t2); }); };
  anda(p.arvore, []);
  var atual = folhas.filter(function(x){ return x.id===p.valor; })[0];
  var termos = semAc(busca).split(/\s+/).filter(Boolean);
  var achados = termos.length ? folhas.filter(function(x){ var n = semAc(x.t+" "+x.trilha.join(" ")); return termos.every(function(y){ return n.indexOf(y)>=0; }); }) : null;
  var escolhe = function(id){ p.aoMudar(id); setAberto(false); setBusca(""); };
  // o que mostrar agora: desce pelo caminho até o nível atual
  var nos = p.arvore, itens = [];
  caminho.forEach(function(titulo){ var n = nos.filter(function(x){ return x.t===titulo; })[0]; if(n){ nos = n.filhos || []; itens = n.itens || []; } else { nos = []; itens = []; } });
  var LINHA = "flex w-full items-center border-b border-white/15 last:border-b-0 px-2 text-left text-[13px] hover:bg-[var(--bloco-titulo)] active:brightness-125 ";   // padrao-ok: letra de 13 px na lista da janela, igual à Lançar recebimento
  var ALTURA = {height:"26px", scrollSnapAlign:"start"};
  var CAIXA = {maxHeight:"210px", scrollSnapType:"y mandatory"};   // 8 linhas de 26 px + a borda: nunca sobra meia linha
  var sa = useState(false), acima = sa[0], setAcima = sa[1];   // sem lugar embaixo (tela baixa), a lista abre PARA CIMA em vez de ficar cortada
  var abrir = function(){ if(!aberto){ setCaminho(atual ? atual.trilha : []); if(ref.current) setAcima(ref.current.getBoundingClientRect().bottom+260>window.innerHeight); } setAberto(!aberto); setBusca(""); };
  var lista = achados
    ? [e("div",{key:"cxb", className:"m-1 overflow-y-auto rounded border border-white/40", style:CAIXA}, achados.length ? achados.map(function(x){ return e("button",{type:"button", key:"b"+x.id, role:"option", onClick:function(){ escolhe(x.id); }, className:LINHA+"justify-between", style:ALTURA}, e("span",null, x.t), e("span",{className:"text-white/70"}, x.trilha.join(" › "))); }) : e("div",{className:"flex items-center px-2 text-[12px]", style:ALTURA}, "Nada encontrado"))]   // padrao-ok: letra de 12 px
    : [].concat(
        caminho.length ? [e("button",{type:"button", key:"voltar", onClick:function(){ setCaminho(caminho.slice(0, -1)); }, className:LINHA+"font-semibold", style:ALTURA}, "Voltar")] : [],
        [e("div",{key:"caixa", className:"m-1 overflow-y-auto rounded border border-white/40", style:CAIXA}, [].concat(nos.map(function(n){ return e("button",{type:"button", key:"n"+n.t, onClick:function(){ setCaminho(caminho.concat([n.t])); }, className:LINHA, style:ALTURA}, n.t); }),
        itens.map(function(it){ var sel = it[0]===p.valor; return e("button",{type:"button", key:"f"+it[0], role:"option", "aria-selected":sel, onClick:function(){ escolhe(it[0]); }, className:LINHA+(sel ? "bg-[#3f6bb8]" : ""), style:ALTURA}, it[1]); })))]);
  return e("div",{ref:ref, className:"relative w-full"},
    e("button",{type:"button", "aria-label":p.rot, "aria-haspopup":"listbox", "aria-expanded":aberto, onClick:abrir, className:p.cls+" relative flex items-center justify-center", style:p.estilo}, atual ? atual.cheio : p.vazio),
    aberto && e("div",{role:"listbox", className:"absolute left-0 right-0 z-20 overflow-hidden rounded border border-white/40 text-white shadow-lg", style:acima ? {bottom:"24px", background:p.fundo} : {top:"24px", background:p.fundo}},
      e("div",null, lista)));
}

export { CaixaArvore };
