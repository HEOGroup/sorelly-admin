// Sorelly Admin · montagem — pages/FoldersCadastro.js
// Cadastro de revendedoras → Folders: lista dos folders em PDF (resumido para candidatas e regulamento completo) com Abrir, Copiar link e Copiar mensagem para o WhatsApp.
// A lista e os textos ficam em domain/folders-cadastro.js; os arquivos em public/regras/.
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { Pagina } from "@/apps/montagem/components/padrao";
import { FOLDERS, dataBr, linkDe, mensagemDe } from "@/apps/montagem/domain/folders-cadastro";
import { Btn } from "@/apps/montagem/ui/button";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var origem = function(){ return typeof window !== "undefined" ? window.location.origin : ""; };
var copiarTexto = function(txt){ try{ if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt); }catch(x){} };

function AbaFoldersCadastro(){
  var cp = useState(""), copiado = cp[0], setCopiado = cp[1];
  var copiar = function(chave, txt){ copiarTexto(txt); setCopiado(chave); setTimeout(function(){ setCopiado(function(c){ return c===chave ? "" : c; }); }, 2500); };
  var botao = function(chave, rot, aoClicar){ return e(Btn,{v:"ghost", sm:true, onClick:aoClicar}, copiado===chave ? "Copiado ✓" : rot); };
  return e(Pagina,null,
    e(PageHead,{t:"Folders", sub:"Os folders para enviar. Abra o PDF ou copie o link e a mensagem para o WhatsApp."}),
    e(GradeFiltro,{chave:"folderscad", vazio:"Nenhum folder cadastrado.", rows:FOLDERS, cols:[
      {k:"nome", t:"Folder", forte:true, v:function(f){ return f.nome; }},
      {k:"publico", t:"Para quem", v:function(f){ return f.publico; }},
      {k:"quando", t:"Quando enviar", v:function(f){ return f.quando; }},
      {k:"paginas", t:"Páginas", tipo:"num", v:function(f){ return f.paginas; }},
      {k:"atual", t:"Atualizado", v:function(f){ return dataBr(f.atualizado); }},
      {k:"abrir", t:"Abrir", min:110, semFiltro:true, v:function(){ return ""; }, cel:function(f){ return e("a",{href:f.arquivo, target:"_blank", rel:"noopener noreferrer", className:"inline-flex h-8 items-center justify-center rounded-md border border-border bg-card px-3 text-[13px] font-semibold hover:bg-white/10"}, "Abrir PDF"); }},
      {k:"link", t:"Link", min:130, semFiltro:true, v:function(){ return ""; }, cel:function(f){ return botao("l"+f.id, "Copiar link", function(){ copiar("l"+f.id, linkDe(f, origem())); }); }},
      {k:"msg", t:"Mensagem", min:160, semFiltro:true, v:function(){ return ""; }, cel:function(f){ return botao("m"+f.id, "Copiar mensagem", function(){ copiar("m"+f.id, mensagemDe(f, origem())); }); }}]}));
}

export { AbaFoldersCadastro };
