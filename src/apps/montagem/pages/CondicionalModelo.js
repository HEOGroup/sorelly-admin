// Sorelly Admin · montagem — pages/CondicionalModelo.js
// Revendedoras › Condicional (Marcus, 28/10/2026): o papel da condicional fixado e editável. Copia o papel que a DevMaster imprime (cabeçalho, lista de peças, termo, folha de anotação do acerto)
// e traz o texto novo do termo e da nota promissória (regras de 27/10/2026). Editor à esquerda, papel à direita; cada Salvar guarda a versão anterior no histórico.
// O papel real é impresso pela DevMaster: o texto daqui serve de modelo oficial para trocar lá. Textos em domain/condicional-modelo.js; estado s.condicionalModelo.
import { AbasTela, Bloco, Botao, H, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { MODELO_PADRAO, TERMO_ANTERIOR } from "@/apps/montagem/domain/condicional-modelo";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["termo", "Termo"], ["nota", "Nota promissória"], ["acerto", "Folha do acerto"], ["cab", "Cabeçalho"], ["anterior", "Modelo anterior"]];
var TITULO = {termo:"Termo de responsabilidade — mercadorias", nota:"Nota promissória", acerto:"Folha de anotação do acerto", cab:"Cabeçalho do papel", anterior:"Termo do papel antigo (21/10/2026)"};
var dh = function(ts){ var d = new Date(ts); return d.toLocaleDateString("pt-BR")+" "+d.toLocaleTimeString("pt-BR", {hour:"2-digit", minute:"2-digit"}); };

// papel: texto com [campos] em destaque; linhas em branco viram espaço
function Linhas(p){
  return p.texto.split("\n").map(function(l, i){
    if(!l.trim()) return e("div", {key:i, className:"h-2.5"});
    var partes = l.split(/(\[[^\]]+\])/g);
    return e("div", {key:i, className:p.cls||""}, partes.map(function(t, j){ return /^\[[^\]]+\]$/.test(t) ? e("span", {key:j, className:"rounded bg-amber-200 px-0.5 text-amber-900"}, t) : t; }));
  });
}
function Cabecalho(p){
  var l = p.texto.split("\n");
  return e("div", {className:"mb-3 flex items-start justify-between border-b border-black/30 pb-2 text-black"},
    e("div", null, e("div", {className:"text-[18px] font-bold tracking-wide"}, l[0]), l.slice(1, 4).map(function(x, i){ return e("div", {key:i, className:"text-[11px]"}, x); })),
    e("div", {className:"text-right text-[11px]"}, l.slice(4).map(function(x, i){ return e("div", {key:i}, x); })));
}
function Folha(p){ return e("div", {className:"mx-auto w-full max-w-[760px] rounded-sm bg-white p-6 text-[12px] leading-snug text-black shadow-lg"}, p.children); }
var LISTA_EXEMPLO = [["A0000000", "1", "R$ 000,00", "ANEL FOLHEADO OURO 18K (exemplo)"], ["B0000", "1", "R$ 000,00", "BRINCO FOLHEADO PRATA (exemplo)"], ["CK0000", "1", "R$ 000,00", "CHOKER FOLHEADA OURO 18K (exemplo)"]];

function Papel(p){
  var cab = p.cab, aba = p.aba, texto = p.texto;
  if(aba==="cab") return e(Folha, null, e(Cabecalho, {texto:texto}), e("div", {className:"text-center text-[15px] font-bold"}, "CONDICIONAL"));
  var titulo = e("div", {className:"my-2 text-center text-[15px] font-bold"}, aba==="nota" ? "NOTA PROMISSÓRIA" : aba==="acerto" ? "CONDICIONAL" : "CONDICIONAL");
  if(aba==="termo" || aba==="anterior") return e(Folha, null, e(Cabecalho, {texto:cab}), titulo,
    e("div", {className:"mb-2 grid grid-cols-2 gap-x-4 text-[11px]"}, e("div", null, "Número: [NÚMERO]   Emissão: [EMISSÃO]"), e("div", null, "Prev. Devolução: [DATA DO ACERTO]"), e("div", null, "Cliente: [NOME]"), e("div", null, "CPF/CNPJ: [CPF]")),
    e("table", {className:"mb-2 w-full text-[11px]"}, e("thead", null, e("tr", {className:"border-y border-black/40 text-left"}, ["Produto", "Qtd.", "Valor", "Descrição"].map(function(c){ return e("th", {key:c, className:"px-1 py-0.5"}, c); }))),
      e("tbody", null, LISTA_EXEMPLO.map(function(r, i){ return e("tr", {key:i}, r.map(function(c, j){ return e("td", {key:j, className:"px-1 py-0.5"}, c); })); }))),
    e("div", {className:"mb-2 text-right text-[11px] font-semibold"}, "Itens: [N]   Valor Total: R$ [VALOR TOTAL DO KIT]"),
    e("div", {className:"border-t border-black/40 pt-2 text-justify"}, e(Linhas, {texto:texto, cls:"mb-1"})));
  if(aba==="nota") return e(Folha, null, e(Linhas, {texto:texto, cls:"mb-1 text-justify"}));
  return e(Folha, null, e(Cabecalho, {texto:cab}), titulo, e("div", {className:"whitespace-pre-wrap font-mono text-[10.5px] leading-snug"}, e(Linhas, {texto:texto})));
}

function imprimir(aba, texto, cab){
  var w = window.open("", "_blank"); if(!w) return;
  var esc = function(x){ return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
  var cabH = aba==="nota" ? "" : "<h2>"+esc(cab.split("\n")[0])+"</h2><div class='sm'>"+esc(cab.split("\n").slice(1).join(" · "))+"</div><hr/>";
  w.document.write("<html><head><title>Condicional</title><style>body{font:13px/1.45 Arial,sans-serif;margin:28px;color:#000}h2{margin:0}.sm{font-size:11px}pre{white-space:pre-wrap;font:12px/1.45 Arial,sans-serif;text-align:justify}</style></head><body>"+cabH+"<pre>"+esc(texto)+"</pre></body></html>");
  w.document.close(); w.focus(); w.print();
}

function AbaCondicionalModelo(){
  var cx = use(), s = cx.state, d = cx.dispatch, cm = s.condicionalModelo || MODELO_PADRAO;
  var sa = useState("termo"), aba = sa[0], setAba = sa[1], sd = useState({}), rasc = sd[0], setRasc = sd[1], sm = useState("");
  var msg = sm[0], setMsg = sm[1];
  var somenteLeitura = aba==="anterior";
  var salvo = somenteLeitura ? TERMO_ANTERIOR : cm[aba];
  var texto = rasc[aba]!==undefined ? rasc[aba] : salvo;
  var sujo = !somenteLeitura && texto!==salvo;
  var aviso = function(t){ setMsg(t); setTimeout(function(){ setMsg(""); }, 2500); };
  var salvar = function(){ d({type:"CONDICIONAL_MODELO_SALVAR", campo:aba, texto:texto, por:nomeDe(s.usuario)}); setRasc(Object.assign({}, rasc, {[aba]:undefined})); aviso("Salvo"); };
  var padrao = function(){ setRasc(Object.assign({}, rasc, {[aba]:MODELO_PADRAO[aba]})); };
  var copiar = function(){ try{ navigator.clipboard.writeText(texto); aviso("Copiado"); }catch(x){ aviso("Não foi possível copiar"); } };
  var hist = (cm.historico||[]).filter(function(h){ return h.campo===aba; }).slice().reverse();
  return e(Pagina, null,
    e(PageHead, {t:"Condicional", sub:"Papel assinado pela revendedora: termo e nota promissória. Vale para kits recebidos a partir de 27/10/2026."}),
    e(AbasTela, {abas:ABAS, atual:aba, onMudar:setAba}),
    e("div", {className:"mt-2.5 grid gap-2.5 xl:grid-cols-2"},
      e(Bloco, {t:TITULO[aba], dir:e("span", {className:"pr-0.5 text-[11px] uppercase "+(sujo ? "text-warning" : "text-foreground")}, somenteLeitura ? "Somente leitura" : sujo ? "Não salvo" : "Salvo")},
        e("textarea", {value:texto, readOnly:somenteLeitura, spellCheck:true, onChange:function(ev){ setRasc(Object.assign({}, rasc, {[aba]:ev.target.value})); },
          className:"min-h-[420px] w-full rounded-md border border-border bg-card p-2.5 text-[13px] leading-snug text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary "+(aba==="acerto" ? "whitespace-pre font-mono" : "")}),
        e("div", {className:"mt-2 flex flex-wrap items-center gap-2"},
          !somenteLeitura && e(Botao, {principal:true, desabilitado:!sujo, onClick:salvar}, "Salvar"),
          !somenteLeitura && e(Botao, {desabilitado:!sujo, onClick:function(){ setRasc(Object.assign({}, rasc, {[aba]:undefined})); }}, "Desfazer"),
          !somenteLeitura && e(Botao, {onClick:padrao, title:"Volta ao texto original desta aba (só vale depois de Salvar)"}, "Texto original"),
          e(Botao, {onClick:copiar}, "Copiar"), e(Botao, {onClick:function(){ imprimir(aba, texto, cm.cab); }}, "Imprimir"),
          msg && e("span", {className:"text-[13px] text-success"}, msg)),
        e("div", {className:"mt-2 text-[11px] text-foreground"}, "Campos entre colchetes, como [NOME], são preenchidos por kit. Mantenha os colchetes.")),
      e(Bloco, {t:"Papel"}, e(Papel, {aba:aba, texto:texto, cab:cm.cab}))),
    aba!=="anterior" && e(Bloco, {t:"Histórico de versões", cls:"mt-2.5"},
      hist.length ? e(TabelaP, {cols:[{t:"Data", w:140}, {t:"Quem", w:160}, {t:"Texto salvo antes"}, {t:"", w:110}]},
        hist.slice(0, 10).map(function(h, i){ return e(Tr, {key:i}, e(Td, null, dh(h.ts)), e(Td, null, h.por || "—"), e(Td, {title:h.texto}, String(h.texto||"").replace(/\n+/g, " ")),
          e(Td, null, e("button", {type:"button", className:H+" text-[13px] underline", onClick:function(){ setRasc(Object.assign({}, rasc, {[aba]:h.texto})); }}, "Carregar"))); }))
      : e("div", {className:"py-1 text-[13px] text-foreground"}, "Nenhuma alteração salva ainda.")));
}

export { AbaCondicionalModelo };
