// Sorelly Admin · montagem — mobile/catalogo-rev.js
// Tela "Catálogo" do app da REVENDEDORA (19/10/2026): busca, abas (Disponíveis / Em pedidos / Vendidos) e grade de 2 colunas com foto, código, preço,
// "Reportar problema" e "Adicionar no carrinho". Peças em domain/catalogo-rev.js. Carrinho só conta, ainda sem pedido de verdade.
import { CATALOGO_REV, tipoDoCodigo } from "@/apps/montagem/domain/catalogo-rev";
import { lerClientes, gravarClientes } from "@/apps/montagem/domain/clientes-rev";
import { JanelaVenda } from "@/apps/montagem/mobile/venda-rev";
import { BKC } from "@/apps/montagem/lib/format";
import { Icon } from "@/apps/montagem/ui/icon";
import { createPortal } from "react-dom";
import { use } from "@/apps/montagem/state/context";
import { e, useRef, useState } from "@/shared/react";

var BR = "txt-branco";
var ABAS = ["Disponíveis", "Em pedidos", "Vendidos"];

function CartaoPeca(p){
  var x = p.x, tipo = tipoDoCodigo(x.codigo);
  // cartão de altura igual na grade: o bloco dos botões desce até o fundo (mt-auto) e os dois botões ficam sempre alinhados
  return e("div",{className:"flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-2 ring-[#C9A13B]"},
    e("div",{className:"relative"}, e("img",{src:x.foto, alt:x.codigo, loading:"lazy", className:"aspect-square w-full object-cover"}),
      e("button",{onClick:p.onProblema, "aria-label":"Algo errado nesta peça?", title:"Algo errado nesta peça?", className:"absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/45 "+BR}, e(Icon,{n:"alert", s:14}))),
    e("div",{className:"flex flex-1 flex-col gap-2 p-2.5"},
      e("div",{className:"flex items-center justify-between gap-1.5"},
        e("b",{className:"text-[14px] leading-none text-[#111827]"}, x.codigo),
        tipo && e("span",{className:"truncate rounded-full bg-[#FBF3DC] px-2 py-0.5 text-[10px] font-bold text-[#8A6A1F]"}, tipo)),
      e("div",{className:"flex items-center justify-between"},
        e("b",{className:"text-[17px] leading-none text-[#B8862B]"}, BKC(x.preco)),
        e("span",{className:"flex items-center gap-1 rounded-full bg-[#F3F4F6] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#6B7280]"}, e(Icon,{n:"box", s:11}), x.estoque)),
      e("div",{className:"mt-auto flex flex-col gap-1.5 pt-1"},
        p.noCarrinho
          ? e("button",{onClick:p.onCarrinho, "aria-label":"Tirar do carrinho", className:"flex h-9 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-[#15803D] px-1 text-[11.5px] font-bold shadow-sm transition active:scale-[.98] "+BR}, e(Icon,{n:"check", s:13}), "No carrinho")
          : e("button",{onClick:p.onCarrinho, className:"flex h-9 w-full items-center justify-center whitespace-nowrap rounded-xl px-1 text-[11.5px] font-bold text-[#1B1409] shadow-sm transition active:scale-[.98]", style:{background:"linear-gradient(135deg,#B8862B 0%,#E8B84B 55%,#F1E4C6 100%)"}}, "Adicionar no carrinho"))));
}

// clientes da revendedora para a venda (guardadas só neste navegador; o cadastro de clientes de verdade vem com o servidor)
// clientes da revendedora: fonte única em domain/clientes-rev.js (a tela Clientes usa a mesma lista)
var CAMPO = "h-11 w-full rounded-xl bg-white px-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#E5E7EB] focus:ring-[#C9A13B]";
var DOURADO = "linear-gradient(135deg,#B8862B 0%,#E8B84B 55%,#F1E4C6 100%)";
// Aviso de peça com problema: um ícone na foto abre esta janelinha. Vai para Marketing → Erros em produtos (foto, nome ou preço incorreto), com o código e quem avisou.
var MOTIVOS = [["foto", "Foto incorreta", "A foto não é desta peça ou está errada"], ["nome", "Nome incorreto", "O nome ou o tipo da peça está errado"], ["preco", "Preço incorreto", "O preço não confere"]];
function JanelaProblema(p){
  var cx = use(), ms = useState([]), marcados = ms[0], setMarcados = ms[1], ok = useState(false), enviado = ok[0], setEnviado = ok[1];
  var alternar = function(k){ setMarcados(marcados.indexOf(k)>=0 ? marcados.filter(function(x){ return x!==k; }) : marcados.concat([k])); };
  var enviar = function(){ cx.dispatch({type:"MK", op:"erro_add", por:p.k.rev+" (app)", codigo:p.x.codigo, nome:tipoDoCodigo(p.x.codigo), tipos:marcados, revendedora:p.k.rev}); setEnviado(true); };
  var folha = e("div",{className:"absolute inset-0 z-40 flex flex-col justify-end"},
    e("div",{onClick:p.onFechar, className:"absolute inset-0 bg-black/45"}),
    e("div",{className:"relative flex flex-col gap-3 rounded-t-[28px] bg-white px-4 pb-7 pt-3 text-[#111827] shadow-2xl"},
      e("div",{className:"mx-auto h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB]"}),
      e("div",{className:"flex items-center gap-3"}, e("img",{src:p.x.foto, alt:p.x.codigo, className:"size-14 shrink-0 rounded-lg object-cover"}),
        e("div",{className:"flex min-w-0 flex-col"}, e("b",{className:"whitespace-nowrap text-[16px]"}, "Algo errado?"), e("span",{className:"text-[12.5px] text-[#6B7280]"}, p.x.codigo+" · "+BKC(p.x.preco))),
        e("button",{onClick:p.onFechar, "aria-label":"Fechar", className:"ml-auto grid size-9 shrink-0 place-items-center rounded-full bg-[#F3F4F6] text-[#374151]"}, e(Icon,{n:"x", s:15}))),
      enviado
        ? e("div",{className:"flex flex-col items-center gap-2 py-3 text-center"}, e("b",{className:"text-[16px] text-[#15803D]"}, "Obrigada! Já avisamos o Marketing."), e("button",{onClick:p.onFechar, className:"h-11 w-full rounded-2xl bg-[#F3F4F6] text-[15px] font-semibold"}, "Fechar"))
        : [e("div",{key:"m", className:"flex flex-col gap-2"}, MOTIVOS.map(function(m){ var on = marcados.indexOf(m[0])>=0;
            return e("button",{key:m[0], onClick:function(){ alternar(m[0]); }, className:"flex items-center gap-3 rounded-xl p-2.5 text-left ring-1 "+(on ? "bg-[#FBF3DC] ring-[#C9A13B]" : "bg-white ring-[#E5E7EB]")},
              e("span",{className:"flex min-w-0 flex-1 flex-col"}, e("b",{className:"text-[14px]"}, m[1]), e("span",{className:"truncate whitespace-nowrap text-[11.5px] text-[#6B7280]"}, m[2])),
              e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full ring-2 "+(on ? "bg-[#C9A13B] ring-[#C9A13B] "+BR : "ring-[#D1D5DB]")}, on && e(Icon,{n:"check", s:11}))); })),
          e("button",{key:"e", onClick:enviar, disabled:!marcados.length, className:"flex h-12 w-full items-center justify-center rounded-2xl text-[15px] font-bold transition "+(marcados.length ? "text-[#1B1409] shadow-md" : "bg-[#D1D5DB] "+BR), style:marcados.length ? {background:"linear-gradient(135deg,#B8862B 0%,#E8B84B 55%,#F1E4C6 100%)"} : undefined}, "Enviar aviso")]));
  return p.host ? createPortal(folha, p.host) : null;
}

function TelaCatalogoRev(p){
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var as = useState(0), aba = as[0], setAba = as[1];
  var cs = useState([]), carrinho = cs[0], setCarrinho = cs[1];   // códigos das peças no carrinho
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];      // janela do carrinho aberta
  var cl = useState(lerClientes), clientes = cl[0], setClientes = cl[1];
  var ss = useState(""), clienteSel = ss[0], setClienteSel = ss[1];
  var av = useState(""), aviso = av[0], setAviso = av[1];
  var marca = useRef(null);
  var pb = useState(null), problema = pb[0], setProblema = pb[1];   // peça com aviso aberto
  var dica = function(t){ setAviso(t); setTimeout(function(){ setAviso(""); }, 2500); };
  var pecaDe = function(c){ return CATALOGO_REV.find(function(y){ return y.codigo===c; }); };
  var itens = carrinho.map(pecaDe).filter(Boolean);
  var totalCarrinho = itens.reduce(function(t, x){ return t+x.preco; }, 0);
  var alternar = function(x){ var tem = carrinho.indexOf(x.codigo)>=0; setCarrinho(tem ? carrinho.filter(function(c){ return c!==x.codigo; }) : carrinho.concat([x.codigo])); };
  var novaCliente = function(d){ var c = {id:"c"+Date.now().toString(36), nome:d.nome, fone:d.fone}; var l = clientes.concat([c]); setClientes(l); gravarClientes(l); setClienteSel(c.id); };
  var q = busca.trim().toLowerCase();
  var lista = aba===0 ? CATALOGO_REV.filter(function(x){ return !q || x.codigo.toLowerCase().indexOf(q)>=0 || tipoDoCodigo(x.codigo).toLowerCase().indexOf(q)>=0; }) : [];
  var cabeca = e("div",{key:"h", className:"flex items-center justify-between gap-2 "+BR},
    e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:p.onVoltar, "aria-label":"Voltar", className:"grid size-8 place-items-center rounded-full bg-[#2A2A2E]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:"text-[16px]"}, "Catálogo")),
    e("button",{onClick:function(){ dica("Compartilhar o catálogo ainda não está ligado."); }, className:"flex h-8 items-center gap-1.5 rounded-full bg-[#2A2A2E] px-3 text-[12px] font-semibold"}, "Compartilhar", e(Icon,{n:"send", s:13})));
  var corpo = e("div",{className:"-mx-4 -mb-10 flex min-h-[calc(100%-3.5rem)] flex-col gap-2 bg-white px-4 pb-10 pt-3"},
    e("div",{className:"flex items-center gap-2"},
      e("label",{className:"flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-2.5 ring-1 ring-[#E5E7EB]"},
        e(Icon,{n:"search", s:14, className:"shrink-0 text-[#9CA3AF]"}),
        e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar por código ou tipo (anel, brinco...)", className:"min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"})),
      e("button",{onClick:function(){ dica("Filtros em breve."); }, "aria-label":"Filtros", className:"grid size-9 shrink-0 place-items-center rounded-xl text-[#374151] ring-1 ring-[#E5E7EB]"}, e(Icon,{n:"menu", s:15}))),
    e("div",{className:"flex border-b border-[#E5E7EB]"}, ABAS.map(function(t, i){
      return e("button",{key:t, onClick:function(){ setAba(i); }, className:"flex flex-1 items-center justify-center gap-1 border-b-2 pb-1.5 text-[12.5px] font-bold "+(aba===i ? "border-[#C9A13B] text-[#B8862B]" : "border-transparent text-[#6B7280]")},
        t, i===0 && e("span",{className:"rounded-full bg-[#C9A13B] px-1.5 text-[9.5px] font-black "+BR}, CATALOGO_REV.length)); })),
    aviso && e("p",{className:"rounded-lg bg-[#FEF3C7] px-2.5 py-1.5 text-center text-[12px] font-semibold text-[#92400E]"}, aviso),
    lista.length===0
      ? e("p",{className:"rounded-xl bg-[#F9FAFB] p-4 text-center text-[13px] text-[#6B7280]"}, aba===0 ? "Nenhuma peça encontrada." : "Nada por aqui ainda.")
      : e("div",{className:"grid grid-cols-2 items-stretch gap-2"}, lista.map(function(x){
          return e(CartaoPeca,{key:x.codigo, x:x, noCarrinho:carrinho.indexOf(x.codigo)>=0, onCarrinho:function(){ alternar(x); }, onProblema:function(){ setProblema(x); }}); })));
  // barra de baixo (só com peça no carrinho): quantidade, "Ver carrinho" e a soma; fica bem no pé da tela e faz subir a janela do carrinho
  var barra = itens.length>0 && e("div",{key:"b", className:"sticky z-10 mt-3", style:{bottom:"-1.9rem"}},
    e("button",{onClick:function(){ setAberto(true); }, className:"flex h-11 w-full items-center gap-3 rounded-xl px-4 text-left shadow-lg "+BR, style:{background:"#1A1A2E"}},
      e("span",{className:"relative grid size-7 shrink-0 place-items-center"}, e(Icon,{n:"revendedora", s:20}), e("span",{className:"absolute -right-2 -top-2 grid size-[18px] place-items-center rounded-full bg-[#C9A13B] text-[10px] font-black text-[#1B1409]"}, itens.length)),
      e("b",{className:"flex-1 text-[14.5px]"}, "Fechar venda"), e("b",{className:"text-[14.5px]"}, BKC(totalCarrinho))));
  var host = marca.current && marca.current.closest(".app-claro");
  var janela = aberto && e(JanelaVenda,{key:"j", host:host, k:p.k, itens:itens, total:totalCarrinho, clientes:clientes, clienteSel:clienteSel,
    onFechar:function(){ setAberto(false); }, onEscolher:setClienteSel, onNovaCliente:novaCliente, onRemover:alternar,
    onConcluir:function(){ setCarrinho([]); setClienteSel(""); setAberto(false); }});
  var janelaProblema = problema && e(JanelaProblema,{key:"p", host:host, k:p.k, x:problema, onFechar:function(){ setProblema(null); }});
  return [cabeca, e("div",{key:"c"}, corpo), barra, e("span",{key:"m", ref:marca, className:"hidden"}), janela, janelaProblema];
}

export { TelaCatalogoRev };
