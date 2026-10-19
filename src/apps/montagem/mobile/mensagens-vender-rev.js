// Sorelly Admin · montagem — mobile/mensagens-vender-rev.js
// Tela "Mensagens para vender" do app da revendedora: modelos prontos (domain/mensagens-vender.js, editável) por categoria.
// Escolhendo uma cliente da lista, o nome e o telefone entram sozinhos. "Copiar" copia o texto; "WhatsApp" só ABRE a conversa com o texto pronto (nada é enviado sozinho).
// Props: k (a revendedora), onVoltar.
import { lerClientes, linkWhats } from "@/apps/montagem/domain/clientes-rev";
import { CATEGORIAS_MENSAGEM, MENSAGENS_VENDER, preencherMensagem } from "@/apps/montagem/domain/mensagens-vender";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var BR = "txt-branco";
function copiar(txt, depois){ try { if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(txt).then(depois, depois); return; } } catch(x){} depois(); }

function CartaoMsg(p){
  var m = p.m, cs = useState(false), copiado = cs[0], setCopiado = cs[1];
  var texto = preencherMensagem(m.texto, p.cliente ? p.cliente.nome.trim().split(/\s+/)[0] : "", p.rev);
  var wa = p.cliente ? linkWhats(p.cliente.fone, texto) : "https://wa.me/?text="+encodeURIComponent(texto);
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-[#E5E7EB]"},
    e("b",{className:"text-[14px] text-[#111827]"}, m.titulo),
    e("p",{className:"rounded-lg bg-[#F9FAFB] p-2.5 text-[12.5px] leading-snug text-[#374151]"}, texto),
    e("div",{className:"flex gap-2"},
      e("button",{onClick:function(){ copiar(texto, function(){ setCopiado(true); setTimeout(function(){ setCopiado(false); }, 1800); }); }, className:"flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-white text-[13px] font-bold text-[#374151] ring-1 ring-[#E5E7EB]"}, e(Icon,{n:copiado ? "check" : "list", s:14}), copiado ? "Copiado" : "Copiar"),
      wa ? e("a",{href:wa, target:"_blank", rel:"noreferrer", className:"flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#15803D] text-[13px] font-bold "+BR}, e(Icon,{n:"phone", s:14}), "WhatsApp")
        : e("span",{className:"flex h-10 flex-1 items-center justify-center whitespace-nowrap rounded-xl bg-[#F3F4F6] text-[12px] font-semibold text-[#9CA3AF]"}, "Cliente sem WhatsApp")));
}

function TelaMensagensVenderRev(p){
  var k = p.k, cs = useState(lerClientes), clientes = cs[0];
  var ab = useState("Todas"), aba = ab[0], setAba = ab[1];
  var sel = useState(""), selId = sel[0], setSelId = sel[1];
  var cliente = clientes.find(function(c){ return c.id===selId; }) || null;
  var lista = MENSAGENS_VENDER.filter(function(m){ return aba==="Todas" || m.cat===aba; });
  return [e(CabecaTela,{key:"h", t:"Mensagens para vender", onVoltar:p.onVoltar}), e(FolhaTela,{key:"c"},
    e("select",{value:selId, onChange:function(x){ setSelId(x.target.value); }, className:"h-11 w-full rounded-xl bg-white px-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#E5E7EB] focus:ring-[#C9A13B]"},
      e("option",{value:""}, "Para qual cliente? (opcional)"), clientes.map(function(c){ return e("option",{key:c.id, value:c.id}, c.nome); })),
    e("div",{className:"-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1"}, ["Todas"].concat(CATEGORIAS_MENSAGEM).map(function(c){
      return e("button",{key:c, onClick:function(){ setAba(c); }, className:"shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold "+(aba===c ? "bg-[#B8862B] "+BR : "bg-[#F3F4F6] text-[#374151]")}, c); })),
    !cliente && e("p",{className:"text-[11.5px] text-[#6B7280]"}, "Escolha uma cliente para o nome e o WhatsApp entrarem sozinhos."),
    lista.map(function(m){ return e(CartaoMsg,{key:m.id, m:m, cliente:cliente, rev:k.rev}); }))];
}
export { TelaMensagensVenderRev };
