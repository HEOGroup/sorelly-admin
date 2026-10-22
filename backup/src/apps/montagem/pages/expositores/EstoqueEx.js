// Sorelly Admin · montagem — pages/expositores/EstoqueEx.js
// Expositores → Estoque de expositores: itens usados na montagem. Cartões em mosaico (foto, código, nome, saldo, mínimo com alerta, valor) e cadastro em janela (ações estoque_*).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, Faixa, Indicador, Mosaico } from "@/apps/montagem/components/padrao";
import { exEstoque, formatarReais } from "@/apps/montagem/domain/expositores";
import { Alternar, Bt, BarraFiltros, Busca, Colunas, Janela, Painel, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { Confirmar, Entrada, FotoSlot, Vazio, useEx } from "@/apps/montagem/pages/expositores/comum";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function JanelaItem(p){
  var c = p.c, x = p.item, min = c.ex.config.estoqueMinimoPadrao;
  var st = useState({codigo:x ? x.codigo : "", nome:x ? x.nome : "", valor:x ? x.valorUnitario : 0, qtd:x ? String(x.quantidade) : "", minimo:x ? String(x.estoqueMinimo) : String(min), foto:x ? x.foto : null}), f = st[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var ok = function(){
    var ac = {op:x ? "estoque_edit" : "estoque_add", id:x ? x.id : undefined, codigo:f.codigo, nome:f.nome, valorUnitario:f.valor || 0, quantidade:f.qtd===""  ? 0 : f.qtd, estoqueMinimo:f.minimo, foto:f.foto || ""};
    if(c.exec(ac)) p.fechar();
  };
  var num = function(k){ return function(v){ set(k, v.replace(/\D/g, "")); }; };
  return e(Janela,{t:x ? "Editar item do estoque" : "Novo item do estoque", sub:x ? "Código "+x.codigo : "Item de expositor", tam:"lg", fechar:p.fechar},
    e(Colunas,{n:2},
      e(Painel,{t:"Dados do item", ic:"package", estado:f.codigo.trim() && f.nome.trim() ? "feito" : "atual"},
        e(Entrada,{rot:"Código", v:f.codigo, set:function(v){ set("codigo", v); }, mono:true}), e(Entrada,{rot:"Nome", v:f.nome, set:function(v){ set("nome", v); }}),
        e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-center text-[12px] font-bold"}, "Valor unitário"), e(Dinheiro,{value:f.valor || 0, label:"Valor unitário", onChange:function(v){ set("valor", v || 0); }})),
        e("div",{className:"grid grid-cols-2 gap-2"}, e(Entrada,{rot:"Quantidade", v:f.qtd, set:num("qtd"), modo:"numeric", mono:true, ph:"0"}), e(Entrada,{rot:"Estoque mínimo", v:f.minimo, set:num("minimo"), modo:"numeric", mono:true}))),
      e(Painel,{t:"Foto", ic:"camera"}, e("div",{className:"flex justify-center"}, e(FotoSlot,{valor:f.foto, tam:150, onChange:function(v){ set("foto", v); }})))),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:ok}, x ? "Salvar alterações" : "Cadastrar item")));
}

function CartaoItem(p){
  var i = p.i;
  return e("div",{className:"flex flex-col items-center gap-1.5 rounded-xl bg-black/25 p-2.5 text-center ring-1 "+(i.baixo ? "ring-[#FBBF24]/60" : "ring-white/10"), style:i.baixo ? {boxShadow:"inset 3px 0 0 #FBBF24"} : undefined},
    e("div",{className:"grid size-24 place-items-center overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/15"}, i.foto ? e("img",{src:i.foto, alt:i.nome, className:"size-full object-cover"}) : e(Ph,{n:"image", s:28, className:"text-white/40"})),
    e("span",{className:MONO+" rounded-md bg-black/35 px-1.5 py-0.5 text-[11.5px] font-bold"}, i.codigo),
    e("b",{className:"text-[13.5px] leading-tight"}, i.nome),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      e("div",{className:"flex flex-col items-center rounded-lg px-2.5 py-1", style:{background:"linear-gradient(135deg,"+(i.baixo ? "#FBBF24" : "#F97316")+"38,"+(i.baixo ? "#FBBF24" : "#F97316")+"0d 78%)"}}, e("b",{className:MONO+" text-[18px] leading-none "+(i.baixo ? "text-[#FBBF24]" : "")}, i.quantidade), e("span",{className:"text-[10px] font-bold uppercase tracking-wide text-white/75"}, "Saldo")),
      e("div",{className:"flex flex-col items-center rounded-lg bg-white/5 px-2.5 py-1"}, e("b",{className:MONO+" text-[18px] leading-none"}, i.estoqueMinimo), e("span",{className:"text-[10px] font-bold uppercase tracking-wide text-white/75"}, "Mínimo"))),
    i.baixo && e(Selo,{cor:"#FBBF24", ic:"warning"}, "Estoque baixo"),
    e("span",{className:MONO+" text-[12.5px]"}, formatarReais(i.valorUnitario)+" cada · "+formatarReais(i.valorTotal)),
    e("div",{className:"flex items-center justify-center gap-1.5"},
      e(Bt,{ic:"pencil-simple", onClick:p.editar}, "Editar"),
      e(Bt,{tipo:"perigo", ic:"trash", disabled:i.usado, titulo:i.usado ? "Este item já foi usado em expositores e não pode ser excluído" : "Excluir o item", onClick:p.excluir}, "Excluir")));
}

function AbaExEstoque(){
  var c = useEx(), st = useState({q:"", baixo:false}), f = st[0], jan = useState(null), j = jan[0];
  var r = exEstoque(c.s, {busca:f.q, soBaixo:f.baixo}), t = r.totais, ativo = !!(f.q || f.baixo), fechar = function(){ jan[1](null); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4}, e(Indicador,{t:"Produtos", v:t.totalProdutos, cor:"total"}), e(Indicador,{t:"Peças em estoque", v:t.totalPecas, cor:"info"}), e(Indicador,{t:"Valor em estoque", v:formatarReais(t.valorEmEstoque), cor:"ok"}), e(Indicador,{t:"Itens em alerta", v:t.emAlerta, cor:t.emAlerta ? "alerta" : "neutro"})),
    e(BarraFiltros,{limpar:ativo ? function(){ st[1]({q:"", baixo:false}); } : undefined},
      e(Busca,{v:f.q, set:function(v){ st[1](Object.assign({}, f, {q:v})); }, ph:"Buscar por nome ou código"}),
      e(Alternar,{on:f.baixo, set:function(v){ st[1](Object.assign({}, f, {baixo:v})); }, ic:"warning"}, "Só estoque baixo"),
      e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", onClick:function(){ jan[1]({t:"novo"}); }}, "Novo item")),
    r.lista.length===0 ? Vazio(t.totalProdutos ? "Nenhum item encontrado." : "O estoque de expositores está vazio.", "package")
      : e(Mosaico,{min:"15rem"}, r.lista.map(function(i){ return e(CartaoItem,{key:i.id, i:i, editar:function(){ jan[1]({t:"editar", item:i}); }, excluir:function(){ jan[1]({t:"excluir", item:i}); }}); })),
    j && j.t==="novo" && e(JanelaItem,{key:"n", c:c, fechar:fechar}),
    j && j.t==="editar" && e(JanelaItem,{key:"e"+j.item.id, c:c, item:j.item, fechar:fechar}),
    j && j.t==="excluir" && e(Confirmar,{t:"Excluir o item "+j.item.codigo+"?", sub:j.item.nome, fechar:fechar, ok:function(){ if(c.exec({op:"estoque_del", id:j.item.id})) fechar(); }}));
}

export { AbaExEstoque };
