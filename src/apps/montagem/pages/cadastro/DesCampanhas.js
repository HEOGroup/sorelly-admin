// Sorelly Admin · montagem — pages/cadastro/DesCampanhas.js
// Desempenho do cadastro › Campanhas (Meta Ads, cadastro manual até a Meta ligar): faixa de totais, tabela de campanhas (clique abre os anúncios) e os funis de Facebook Ads e geral.
import { Bloco, Botao, CAMPO, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { FiltrosDesempenho, mesBr, nInt, nPct, paramsDe, textoPeriodo } from "@/apps/montagem/pages/cadastro/des-comum";
import { FunilTabela } from "@/apps/montagem/pages/cadastro/DesFunil";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { anunciosDa, campanhas, funilDesempenho, hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { BKC } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var MINI = "inline-flex h-6 items-center rounded-md border border-border px-2 text-[12px] hover:bg-white/10";
var COLS_CAMP = function(rot, comMes){ return [{t:rot, w:230, c:1}].concat(comMes ? [{t:"Mês", w:80, c:1}] : []).concat([{t:"Gasto", w:120, c:1}, {t:"Impressões", w:110, c:1}, {t:"Cliques", w:90, c:1}, {t:"CPC", w:100, c:1}, {t:"CTR", w:80, c:1}, {t:"", w:150, c:1}]); };

// janela para criar ou editar campanha ou anúncio. alvo = {tipo:"camp"|"anu", campId, id}
function ModalCamp(p){
  var d = use().dispatch, cl = use().state.cl, a = p.alvo, ehAnu = a.tipo==="anu";
  var camp = cl.campanhas.find(function(c){ return c.id===(ehAnu ? a.campId : a.id); });
  var atual = a.id==null ? null : (ehAnu ? ((camp && camp.anuncios)||[]).find(function(x){ return x.id===a.id; }) : camp);
  var st = useState({nome:atual ? atual.nome : "", mes:atual && atual.mes ? atual.mes : hojeSP().slice(0, 7), gasto:atual ? atual.gasto : 0, impressoes:atual ? atual.impressoes : "", cliques:atual ? atual.cliques : ""}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var salvar = function(){
    if(!String(v.nome).trim()){ window.alert("Informe o nome "+(ehAnu ? "do anúncio." : "da campanha.")); return; }
    var dados = {nome:v.nome, gasto:v.gasto||0, impressoes:v.impressoes==="" ? 0 : v.impressoes, cliques:v.cliques==="" ? 0 : v.cliques};
    if(ehAnu) d({type:"CL", op:a.id==null ? "anuncio_add" : "anuncio_set", campanhaId:a.campId, id:a.id, nome:dados.nome, gasto:dados.gasto, impressoes:dados.impressoes, cliques:dados.cliques});
    else d(Object.assign({type:"CL", op:a.id==null ? "campanha_add" : "campanha_set", id:a.id, mes:v.mes}, dados));
    p.fechar();
  };
  var titulo = (a.id==null ? (ehAnu ? "Novo " : "Nova ") : "Editar ")+(ehAnu ? "anúncio" : "campanha");
  var campo = function(rot, id, filho){ return e("div",{className:"min-w-0"}, e(Rotulo,{t:rot, id:id}), filho); };
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-card p-4", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-center justify-between gap-3"}, e("h2",{className:"text-[15px] font-semibold"}, titulo+(ehAnu && camp ? " · "+camp.nome : "")), e(Botao,{onClick:p.fechar}, "Fechar")),
      e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2"},
        e("div",{className:"col-span-2"}, campo("Nome", "dc-nome", e("input",{id:"dc-nome", type:"text", value:v.nome, autoFocus:true, className:CAMPO, onChange:function(ev){ set("nome", ev.target.value); }}))),
        !ehAnu && campo("Mês", "dc-mes", e("input",{id:"dc-mes", type:"month", value:v.mes, className:CAMPO, onChange:function(ev){ set("mes", ev.target.value); }})),
        campo("Gasto", "dc-gasto", e(Dinheiro,{value:v.gasto, label:"Gasto", onChange:function(x){ set("gasto", x||0); }})),
        campo("Impressões", "dc-imp", e("input",{id:"dc-imp", type:"number", min:0, value:v.impressoes, className:CAMPO, onChange:function(ev){ set("impressoes", ev.target.value); }})),
        campo("Cliques", "dc-cli", e("input",{id:"dc-cli", type:"number", min:0, value:v.cliques, className:CAMPO, onChange:function(ev){ set("cliques", ev.target.value); }}))),
      e("div",{className:"flex justify-end gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:salvar}, "Salvar"))));
}

function TabelaMeta(p){
  return e(TabelaP,{cols:COLS_CAMP(p.rotulo, p.comMes), minW:p.comMes ? 960 : 880},
    p.linhas.length ? p.linhas.map(function(l){
      return e(Tr,{key:l.id, onClick:p.abrir ? function(){ p.abrir(l.id); } : undefined, title:p.abrir ? "Ver os anúncios desta campanha" : undefined},
        e(Td,{c:true, forte:true}, l.nome), p.comMes && e(Td,{c:true}, mesBr(l.mes)), e(Td,{c:true}, BKC(l.gasto)), e(Td,{c:true}, nInt(l.impressoes)), e(Td,{c:true}, nInt(l.cliques)), e(Td,{c:true}, BKC(l.cpc)), e(Td,{c:true}, nPct(l.ctr)),
        e(Td,{c:true}, e("span",{className:"flex justify-center gap-1"},
          e("button",{type:"button", className:MINI, onClick:function(ev){ ev.stopPropagation(); p.editar(l.id); }}, "Editar"),
          e("button",{type:"button", className:MINI+" text-destructive", onClick:function(ev){ ev.stopPropagation(); p.excluir(l); }}, "Excluir"))));
    }) : e(Tr,{key:"vazio"}, e(Td,{c:true}, "Nada neste período"), p.comMes && e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "")));
}

function DesCampanhas(p){
  var ctx = use(), d = ctx.dispatch, cl = ctx.state.cl, vs = useState("campanhas"), vista = vs[0], ds = useState(null), detalhe = ds[0], ms = useState(null), modal = ms[0];
  var par = paramsDe(p.f), cp = campanhas(cl, par), fu = funilDesempenho(cl, par), k = cp.kpis, fb = cp.funil;
  var aberta = detalhe ? cp.campanhas.find(function(c){ return c.id===detalhe; }) : null, anuncios = aberta ? anunciosDa(cl, aberta.id) : [];
  var excluirCamp = function(l){ if(!window.confirm("Excluir a campanha \""+l.nome+"\" e os anúncios dela?")) return; d({type:"CL", op:"campanha_del", id:l.id}); if(detalhe===l.id) ds[1](null); };
  var excluirAnu = function(l){ if(!window.confirm("Excluir o anúncio \""+l.nome+"\"?")) return; d({type:"CL", op:"anuncio_del", campanhaId:aberta.id, id:l.id}); };
  var corpo;
  if(vista==="campanhas" && aberta){
    corpo = e(Bloco,{t:"Anúncios · "+aberta.nome, dir:e("div",{className:"flex items-center gap-2"}, e(Botao,{onClick:function(){ ds[1](null); }}, "Voltar"), e(Botao,{onClick:function(){ ms[1]({tipo:"camp", id:aberta.id}); }}, "Editar campanha"), e(Botao,{principal:true, onClick:function(){ ms[1]({tipo:"anu", campId:aberta.id, id:null}); }}, "Novo anúncio"))},
      e(TabelaMeta,{linhas:anuncios, rotulo:"Anúncio", editar:function(id){ ms[1]({tipo:"anu", campId:aberta.id, id:id}); }, excluir:excluirAnu}));
  } else if(vista==="campanhas"){
    corpo = e(Bloco,{t:"Campanhas · "+textoPeriodo(cp.periodo), dir:e(Botao,{principal:true, onClick:function(){ ms[1]({tipo:"camp", id:null}); }}, "Nova campanha")},
      e(TabelaMeta,{linhas:cp.campanhas, rotulo:"Campanha", comMes:true, abrir:ds[1], editar:function(id){ ms[1]({tipo:"camp", id:id}); }, excluir:excluirCamp}));
  } else if(vista==="facebook"){
    corpo = e(Bloco,{t:"Funil de Facebook Ads · leads com a tag "+cl.config.tagsFacebook, dir:e("span",{className:"text-[12px]"}, fb.insight || "")},
      e(FunilTabela,{stages:fb.stages, exits:fb.exits, comCusto:true}));
  } else {
    corpo = e(Bloco,{t:"Funil geral · todos os contatos do período", dir:e("span",{className:"text-[12px]"}, fu.insight || "")}, e(FunilTabela,{stages:fu.stages, exits:fu.exits}));
  }
  return e("div",{className:"flex flex-col gap-3"},
    e(FiltrosDesempenho,{f:p.f, set:p.set}),
    e(FaixaTotais,{itens:[{t:"Gasto", v:BKC(k.gasto)}, {t:"Impressões", v:nInt(k.impressoes)}, {t:"Cliques", v:nInt(k.cliques)}, {t:"CPC", v:BKC(k.cpc)}, {t:"CTR", v:nPct(k.ctr)}, {t:"Campanhas", v:nInt(k.campanhasQtd)}]}),
    e("div",{className:"flex"}, e(Segmentado,{opcoes:[["campanhas","Campanhas"], ["facebook","Funil Facebook Ads"], ["geral","Funil geral"]], atual:vista, onMudar:function(v){ vs[1](v); ds[1](null); }})),
    corpo,
    modal && e(ModalCamp,{alvo:modal, fechar:function(){ ms[1](null); }}));
}

export { DesCampanhas };
