// Sorelly Admin · montagem — pages/expositores/FotosKitNovo.js
// Expositores → Fotos dos kits novos: fotos dos expositores arrumados na entrega do kit novo (as mesmas da tela "Controle de expositores").
// Quando o kit novo ainda não está na fila nem virou expositor, há o botão para criar a entrada na fila (fila_add com vínculo "kit_novo").
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { exFilaDoKitNovo, exFotosKitNovo } from "@/apps/montagem/domain/expositores";
import { Bt, Janela, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { Entrada, Vazio, dataBr, useEx } from "@/apps/montagem/pages/expositores/comum";
import { e, useState } from "@/shared/react";

function JanelaParaFila(p){
  var c = p.c, x = p.foto, st = useState({nome:x.rev || "", telefone:""}), f = st[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var ok = function(){ if(c.exec({op:"fila_add", nome:f.nome, telefone:f.telefone, vinculo:{tipo:"kit_novo", kitNovoId:x.kitId, revendedoraNome:x.rev || null, representante:x.rep || null}})) p.fechar(); };
  return e(Janela,{t:"Enviar para a fila de expositores", sub:"Kit novo de "+(x.rev || "revendedora"), tam:"sm", fechar:p.fechar},
    e(Entrada,{rot:"Nome", v:f.nome, set:function(v){ set("nome", v); }}), e(Entrada,{rot:"Telefone", v:f.telefone, set:function(v){ set("telefone", v); }, modo:"tel", mono:true}),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"hourglass", onClick:ok}, "Entrar na fila")));
}

function AbaExFotosKN(){
  var c = useEx(), s = c.s, lista = exFotosKitNovo(s), jan = useState(null), j = jan[0], ampla = useState(null);
  return e("div",{className:"flex flex-col gap-2.5"},
    lista.length===0 ? Vazio("Nenhuma foto de expositor ainda. Quando a representante anexar a foto na entrega do kit novo, ela aparece aqui.", "camera")
      : e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fill, minmax(13rem, 1fr))"}}, lista.map(function(x){
          var ja = exFilaDoKitNovo(s, x.kitId), naFila = ja && !ja.itens;
          return e("div",{key:x.kitId, className:"flex flex-col overflow-hidden rounded-xl bg-black/25 text-center ring-1 ring-white/10"},
            e("button",{type:"button", title:"Ampliar a foto", onClick:function(){ ampla[1](x); }, className:"block"}, e("img",{src:x.foto, alt:"Expositor de "+x.rev, className:"h-44 w-full object-cover"})),
            e("div",{className:"flex flex-col items-center gap-1 p-2.5"},
              e("b",{className:"text-[13.5px] leading-tight"}, x.rev || "—"),
              e("span",{className:"text-[12px] text-white/70"}, "Representante "+(x.rep || "—")),
              e("span",{className:"text-[11.5px] text-white/55"}, dataBr(x.em)),
              ja ? e(Selo,{cor:ja.itens ? "#4ADE80" : "#F97316", ic:ja.itens ? "check-circle" : "hourglass"}, ja.itens ? "Expositor nº "+(ja.codigoDevmaster!=null ? String(ja.codigoDevmaster).padStart(6, "0") : String(ja.numero).padStart(4, "0")) : "Na fila")
                : e(Bt,{ic:"hourglass", tipo:"marca", onClick:function(){ jan[1](x); }}, "Enviar para a fila"))); })),
    j && e(JanelaParaFila,{key:j.kitId, c:c, foto:j, fechar:function(){ jan[1](null); }}),
    ampla[0] && e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/80 p-3", onClick:function(){ ampla[1](null); }},
      e("div",{className:"relative flex max-h-[94vh] max-w-3xl flex-col items-center gap-2", onClick:function(ev){ ev.stopPropagation(); }},
        e("img",{src:ampla[0].foto, alt:"Expositor de "+ampla[0].rev, className:"max-h-[84vh] rounded-xl object-contain"}),
        e("b",{className:"text-[14px]"}, (ampla[0].rev || "")+(ampla[0].rep ? " · Representante "+ampla[0].rep : "")),
        e("button",{type:"button", "aria-label":"Fechar", onClick:function(){ ampla[1](null); }, className:"absolute right-1 top-1 grid size-9 place-items-center rounded-lg bg-black/60 hover:bg-black/80"}, e(Ph,{n:"x", s:16})))));
}

export { AbaExFotosKN };
