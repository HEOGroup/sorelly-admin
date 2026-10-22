// Sorelly Admin · montagem — pages/expositores/Clientes.js
// Expositores → Clientes: base de clientes dos expositores (nasce das montagens). Busca, edição e exclusão (ações cliente_*).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { exClientes } from "@/apps/montagem/domain/expositores";
import { Bt, BarraFiltros, Busca, Janela } from "@/apps/montagem/pages/indicacoes/visual";
import { Confirmar, Entrada, Vazio, useEx } from "@/apps/montagem/pages/expositores/comum";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var POR_VEZ = 30;
function JanelaCliente(p){
  var c = p.c, x = p.item, st = useState({nome:x.nome, telefone:x.telefone, endereco:x.endereco || ""}), f = st[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  return e(Janela,{t:"Editar cliente", sub:"Base de clientes dos expositores", tam:"sm", fechar:p.fechar},
    e(Entrada,{rot:"Nome", v:f.nome, set:function(v){ set("nome", v); }}), e(Entrada,{rot:"Telefone", v:f.telefone, set:function(v){ set("telefone", v); }, modo:"tel", mono:true}), e(Entrada,{rot:"Endereço", v:f.endereco, set:function(v){ set("endereco", v); }}),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:function(){ if(c.exec({op:"cliente_edit", id:x.id, nome:f.nome, telefone:f.telefone, endereco:f.endereco})) p.fechar(); }}, "Salvar alterações")));
}

var ICO = "grid size-8 place-items-center rounded-lg transition ";
function AbaExClientes(){
  var c = useEx(), st = useState(""), q = st[0], mais = useState(false), jan = useState(null), j = jan[0];
  var lista = exClientes(c.s, q), total = c.s.ex.clientes.length, vis = mais[0] ? lista : lista.slice(0, POR_VEZ), fechar = function(){ jan[1](null); };
  var qtdDe = function(x){ return c.s.ex.condicionais.filter(function(k){ return String(k.telefone).replace(/\D/g, "")===x.telefoneKey; }).length; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BarraFiltros,{limpar:q ? function(){ st[1](""); } : undefined},
      e(Busca,{v:q, set:st[1], ph:"Buscar por nome, telefone ou endereço"}),
      e("span",{className:MONO+" text-[12px] text-white/70"}, lista.length+(lista.length===1 ? " cliente" : " clientes")+(q ? " de "+total : ""))),
    lista.length===0 ? Vazio(total ? "Nenhuma cliente encontrada." : "A base de clientes está vazia. As clientes entram ao montar um expositor.", "users-three")
      : e("div",{className:"rounded-xl bg-black/20 p-1 ring-1 ring-white/10"}, e(Tab,{cols:["Nome", "Telefone", "Endereço", "Expositores", "Ações"]},
          vis.map(function(x){
            return e("tr",{key:x.id, className:LINHA}, e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true}, x.telefone), e(Td,{className:"max-w-72 truncate"}, x.endereco || "—"), e(Td,{dinheiro:true}, qtdDe(x)),
              e(Td,null, e("div",{className:"flex items-center justify-center gap-1"},
                e("button",{type:"button", title:"Editar", "aria-label":"Editar", onClick:function(){ jan[1]({t:"editar", item:x}); }, className:ICO+"bg-white/10 hover:bg-white/20"}, e(Ph,{n:"pencil-simple", s:16})),
                e("button",{type:"button", title:"Excluir", "aria-label":"Excluir", onClick:function(){ jan[1]({t:"excluir", item:x}); }, className:ICO+"bg-[#EF4444]/20 text-[#F87171] hover:bg-[#EF4444]/30"}, e(Ph,{n:"trash", s:16})))));
          }))),
    !mais[0] && lista.length>POR_VEZ && e(Bt,{className:"self-center", onClick:function(){ mais[1](true); }}, "Ver mais "+(lista.length-POR_VEZ)),
    j && j.t==="editar" && e(JanelaCliente,{key:j.item.id, c:c, item:j.item, fechar:fechar}),
    j && j.t==="excluir" && e(Confirmar,{t:"Excluir "+j.item.nome+" da base?", sub:"Os expositores já montados não mudam.", fechar:fechar, ok:function(){ if(c.exec({op:"cliente_del", id:j.item.id})) fechar(); }}));
}

export { AbaExClientes };
