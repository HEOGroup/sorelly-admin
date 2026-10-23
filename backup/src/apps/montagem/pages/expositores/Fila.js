// Sorelly Admin · montagem — pages/expositores/Fila.js
// Expositores → Fila de espera: quem aguarda um expositor, por ordem de entrada. Montar por linha, adicionar, editar e excluir (ações fila_*).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { exFila, formatarDia } from "@/apps/montagem/domain/expositores";
import { Bt, BarraFiltros, Busca, Janela } from "@/apps/montagem/pages/indicacoes/visual";
import { JanelaMontar } from "@/apps/montagem/pages/expositores/janelas";
import { Area, CamposVinculo, Confirmar, Entrada, Vazio, textoVinculo, useEx, vincDe, vincSaida } from "@/apps/montagem/pages/expositores/comum";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function JanelaFila(p){
  var c = p.c, x = p.item, st = useState({nome:x ? x.nome : "", telefone:x ? x.telefone : "", dataAcerto:x && x.dataAcerto ? x.dataAcerto : "", observacao:x && x.observacao ? x.observacao : "", vinc:vincDe(x ? x.vinculo : null)}), f = st[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var ok = function(){
    var ac = {op:x ? "fila_edit" : "fila_add", id:x ? x.id : undefined, nome:f.nome, telefone:f.telefone, dataAcerto:f.dataAcerto, observacao:f.observacao, vinculo:vincSaida(f.vinc)};
    if(c.exec(ac)) p.fechar();
  };
  return e(Janela,{t:x ? "Editar entrada da fila" : "Adicionar à fila", sub:"Cliente que aguarda o expositor", tam:"md", fechar:p.fechar},
    e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2"},
      e(Entrada,{rot:"Nome", v:f.nome, set:function(v){ set("nome", v); }}), e(Entrada,{rot:"Telefone", v:f.telefone, set:function(v){ set("telefone", v); }, modo:"tel", mono:true}),
      e(Entrada,{rot:"Data de acerto", tipo:"date", v:f.dataAcerto, set:function(v){ set("dataAcerto", v); }}), e(Area,{rot:"Observação", v:f.observacao, set:function(v){ set("observacao", v); }, linhas:1})),
    e(CamposVinculo,{v:f.vinc, set:function(v){ set("vinc", v); }}),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:ok}, x ? "Salvar alterações" : "Adicionar")));
}

var ICO = "grid size-8 place-items-center rounded-lg transition ";
function AbaExFila(){
  var c = useEx(), s = c.s, st = useState(""), q = st[0], jan = useState(null), j = jan[0];
  var lista = exFila(s, {busca:q}), fechar = function(){ jan[1](null); };
  var total = s.ex.fila.length;
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BarraFiltros,{limpar:q ? function(){ st[1](""); } : undefined},
      e(Busca,{v:q, set:st[1], ph:"Buscar por nome, telefone ou observação"}),
      e("span",{className:MONO+" text-[12px] text-white/70"}, lista.length+(lista.length===1 ? " entrada" : " entradas")+(q ? " de "+total : "")),
      e(Bt,{tipo:"forte", ic:"user-plus", className:"h-9 py-0!", onClick:function(){ jan[1]({t:"nova"}); }}, "Adicionar à fila")),
    lista.length===0 ? Vazio(total ? "Nenhuma entrada encontrada." : "A fila de espera está vazia.", "hourglass")
      : e("div",{className:"rounded-xl bg-black/20 p-1 ring-1 ring-white/10"}, e(Tab,{cols:["Posição", "Nome", "Telefone", "Data de acerto", "Vínculo", "Observação", "Ações"]},
          lista.map(function(x, i){
            return e("tr",{key:x.id, className:LINHA},
              e(Td,{dinheiro:true, forte:true}, i+1), e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true}, x.telefone), e(Td,null, x.dataAcerto ? formatarDia(x.dataAcerto) : "—"),
              e(Td,null, textoVinculo(x.vinculo) || "—"), e(Td,{className:"max-w-56 truncate"}, x.observacao || "—"),
              e(Td,null, e("div",{className:"flex items-center justify-center gap-1"},
                e("button",{type:"button", title:"Montar expositor", "aria-label":"Montar expositor", onClick:function(){ jan[1]({t:"montar", item:x}); }, className:ICO+"bg-[#F97316]/25 text-[#FDBA74] ring-1 ring-[#F97316]/50 hover:bg-[#F97316]/35"}, e(Ph,{n:"package", s:16})),
                e("button",{type:"button", title:"Editar", "aria-label":"Editar", onClick:function(){ jan[1]({t:"editar", item:x}); }, className:ICO+"bg-white/10 hover:bg-white/20"}, e(Ph,{n:"pencil-simple", s:16})),
                e("button",{type:"button", title:"Excluir", "aria-label":"Excluir", onClick:function(){ jan[1]({t:"excluir", item:x}); }, className:ICO+"bg-[#EF4444]/20 text-[#F87171] hover:bg-[#EF4444]/30"}, e(Ph,{n:"trash", s:16})))));
          }))),
    j && j.t==="nova" && e(JanelaFila,{key:"n", c:c, fechar:fechar}),
    j && j.t==="editar" && e(JanelaFila,{key:"e"+j.item.id, c:c, item:j.item, fechar:fechar}),
    j && j.t==="montar" && e(JanelaMontar,{key:"m"+j.item.id, c:c, fila:j.item, status:"BIPADO", fechar:fechar}),
    j && j.t==="excluir" && e(Confirmar,{t:"Excluir "+j.item.nome+" da fila?", sub:"A entrada sai da fila de espera.", fechar:fechar, ok:function(){ if(c.exec({op:"fila_del", id:j.item.id})) fechar(); }}));
}

export { AbaExFila };
