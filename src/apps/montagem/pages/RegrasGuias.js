// Sorelly Admin · montagem — pages/RegrasGuias.js
// Setor Regras (05/11/2026, Marcus): um bloco dourado com os dois guias em PDF, cada um com a capa, "Ver guia" e "Copiar link".
// Os guias ficam em domain/folders-cadastro.js; os arquivos em public/regras/. Sem lista e sem tabela.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Pagina } from "@/apps/montagem/components/padrao";
import { FOLDERS, linkDe } from "@/apps/montagem/domain/folders-cadastro";
import { Btn } from "@/apps/montagem/ui/button";
import { e, useState } from "@/shared/react";

var origem = function(){ return typeof window !== "undefined" ? window.location.origin : ""; };
var copiarTexto = function(txt){ try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); }catch(x){} };
var VER = "inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground hover:opacity-90";

function AbaRegrasGuias(){
  var cp = useState(""), copiado = cp[0], setCopiado = cp[1];
  var copiar = function(id, txt){ copiarTexto(txt); setCopiado(id); setTimeout(function(){ setCopiado(function(c){ return c===id ? "" : c; }); }, 2500); };
  var cartao = function(f){
    return e("div",{key:f.id, className:"flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center"},
      e("b",{className:"text-[13px]"}, f.nome),
      e("a",{href:f.arquivo, target:"_blank", rel:"noopener noreferrer", title:"Abrir o guia"},
        e("img",{src:f.capa, alt:f.nome, className:"block w-full max-w-[300px] rounded-md border border-border"})),
      e("div",{className:"flex items-center justify-center gap-2"},
        e("a",{href:f.arquivo, target:"_blank", rel:"noopener noreferrer", className:VER}, "Ver guia"),
        e(Btn,{v:"ghost", sm:true, onClick:function(){ copiar(f.id, linkDe(f, origem())); }}, copiado===f.id ? "Link copiado ✓" : "Copiar link")));
  };
  return e(Pagina,null,
    e(BlocoBarra,{t:"Regras", fixo:true},
      e("div",{className:"grid grid-cols-1 gap-3 p-3 md:grid-cols-2"}, FOLDERS.map(cartao))));
}

export { AbaRegrasGuias };
