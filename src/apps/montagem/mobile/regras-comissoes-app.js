// Sorelly Admin · montagem — mobile/regras-comissoes-app.js
// Botão "Regras e comissões" dos apps da representante e da revendedora (pedido do Marcus, 26/10/2026).
//  · App da REPRESENTANTE: tela com seletor no topo (Representante | Revendedora). A versão da representante (manual) é só para ler: NÃO tem botão de salvar,
//    para ela nunca mandar o documento errado. A versão da revendedora tem "Salvar PDF": é esse arquivo que ela envia quando a revendedora pede as regras.
//  · App da REVENDEDORA: só a versão da revendedora, com "Salvar PDF".
// As páginas são imagens em public/regras/ (rev-1.png... rep-1.png...) geradas dos PDFs da pasta folders/; o PDF da revendedora fica em public/regras/GUIA-DA-REVENDEDORA.pdf.
// O manual da representante NÃO tem PDF publicado (de propósito). Regras mudaram? Gere os PDFs e as imagens de novo (ver folders/).
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";

var BASE = "/regras/";
var VERSOES = {
  representante:{rotulo:"Representante", prefixo:"rep-", paginas:12, titulo:"Manual da representante"},
  revendedora:{rotulo:"Revendedora", prefixo:"rev-", paginas:8, titulo:"Regulamento da revendedora"}};
var PDF_REVENDEDORA = BASE+"GUIA-DA-REVENDEDORA.pdf";
var INK = "text-[#161616]", MUT = "text-[#6a6a6a]";

function Paginas(p){
  var v = VERSOES[p.versao], bloqueia = p.versao==="representante";
  var lista = []; for(var n = 1; n<=v.paginas; n++) lista.push(n);
  return e("div",{className:"flex flex-col gap-2 "+(bloqueia ? "select-none" : "")},
    lista.map(function(n){
      return e("img",{key:p.versao+n, src:BASE+v.prefixo+n+".png", alt:v.titulo+", página "+n+" de "+v.paginas, loading:"lazy", draggable:false,
        onContextMenu:bloqueia ? function(ev){ ev.preventDefault(); } : undefined,
        style:{aspectRatio:"1118 / 1588"},
        className:"w-full rounded-lg bg-white ring-1 ring-[#e4e1da]"}); }));
}

function TelaRegrasComissoes(p){
  var ehRep = p.publico==="representante";
  var st = useState(ehRep ? "representante" : "revendedora"), versao = st[0], v = VERSOES[versao];
  var marca = useRef(null);
  useEffect(function(){ var c = marca.current && marca.current.closest("#app-screen"); if(c) c.scrollTop = 0; }, []);   // abre sempre no topo (a lista anterior deixa a rolagem no meio)
  return [e("span",{key:"m", ref:marca, className:"hidden"}), e(CabecaTela,{key:"h", t:"Regras e comissões", sub:v.titulo, onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"},
      ehRep && e("div",{role:"group", "aria-label":"Versão do documento", className:"flex overflow-hidden rounded-xl border border-[#e4e1da]"},
        ["representante", "revendedora"].map(function(k, i){ var on = k===versao;
          return e("button",{key:k, type:"button", "aria-pressed":on, onClick:function(){ st[1](k); },
            className:"h-9 flex-1 text-[13px] "+(i ? "border-l border-[#e4e1da] " : "")+(on ? "bg-[#161616] font-bold txt-branco" : "bg-white font-semibold "+MUT)}, VERSOES[k].rotulo); })),
      versao==="revendedora"
        ? e("a",{href:PDF_REVENDEDORA, download:"Regulamento-da-revendedora-Sorelly.pdf", className:"flex h-10 items-center justify-center gap-2 rounded-xl bg-[#C9A13B] text-[13.5px] font-bold txt-branco"},
            e(Icon,{n:"save", s:16}), "Salvar PDF para enviar")
        : e("p",{className:"truncate whitespace-nowrap rounded-xl bg-[#f6efdf] px-3 py-2 text-center text-[12px] font-semibold "+INK}, "Manual interno: não pode ser salvo nem enviado"),
      e(Paginas,{key:versao, versao:versao}))];
}

export { TelaRegrasComissoes };
