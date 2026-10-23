// Sorelly Admin · montagem — pages/expositores/Danificados.js
// Expositores → Danificados: expositores devolvidos com avaria. Totais em Indicadores, filtros e edição da avaria em janela (ação cond_avaria).
import { Dinheiro, Faixa, Indicador, Mosaico } from "@/apps/montagem/components/padrao";
import { ROTULO_AVARIA, ROTULO_SLOT, ROTULO_STATUS_AVARIA, STATUS_AVARIA, TIPOS_AVARIA, TOM_STATUS_AVARIA, exCondicional, exDanificados, formatarDia, formatarReais, rotuloNumero, rotuloAvaria } from "@/apps/montagem/domain/expositores";
import { Bt, BarraFiltros, Busca, Chip, Colunas, Janela, Painel, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { Area, Chips, Entrada, FotoSlot, SeloTom, Vazio, corTom, useEx } from "@/apps/montagem/pages/expositores/comum";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function JanelaAvaria(p){
  var c = p.c, k = exCondicional(c.s, p.id);
  var st = useState(function(){ return k ? {tipo:k.tipoAvaria || "", resp:k.responsavelDevolucao || "", motivo:k.motivoDevolucao || "", desc:k.descricaoAvaria || "", valor:k.valorEstimadoReparo, status:k.statusAvaria || "ABERTO"} : {}; }), f = st[0];
  if(!k) return null;
  var set = function(x, v){ var n = Object.assign({}, f); n[x] = v; st[1](n); };
  var ok = function(){ if(c.exec({op:"cond_avaria", id:k.id, tipoAvaria:f.tipo || null, responsavelDevolucao:f.resp, motivoDevolucao:f.motivo, descricaoAvaria:f.desc, valorEstimadoReparo:f.valor, statusAvaria:f.status})) p.fechar(); };
  var onFoto = function(sl, foto){ if(foto) c.exec({op:"cond_foto", id:k.id, slot:sl, foto:foto}); else c.exec({op:"cond_foto_del", id:k.id, slot:sl}); };
  return e(Janela,{t:"Avaria do expositor nº "+rotuloNumero(k), sub:k.nome+(k.dataDevolucao ? " · devolvido em "+formatarDia(k.dataDevolucao) : ""), tam:"xl", fechar:p.fechar},
    e(Colunas,{n:3},
      e(Painel,{t:"Avaria", ic:"warning", estado:f.tipo ? "feito" : "atual"},
        e(Chips,{rot:"Tipo", v:f.tipo, set:function(v){ set("tipo", v); }, opcoes:TIPOS_AVARIA.map(function(t){ return [t, ROTULO_AVARIA[t]]; })}),
        e(Entrada,{rot:"Responsável", v:f.resp, set:function(v){ set("resp", v); }}), e(Entrada,{rot:"Motivo", v:f.motivo, set:function(v){ set("motivo", v); }}),
        e(Area,{rot:"Descrição", v:f.desc, set:function(v){ set("desc", v); }})),
      e(Painel,{t:"Reparo", ic:"wrench", estado:f.status==="RESOLVIDO" ? "feito" : undefined},
        e(Chips,{rot:"Situação do reparo", v:f.status, set:function(v){ set("status", v); }, opcoes:STATUS_AVARIA.map(function(t){ return [t, ROTULO_STATUS_AVARIA[t], corTom(TOM_STATUS_AVARIA[t])]; })}),
        e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-center text-[12px] font-bold"}, "Valor estimado do reparo"), e(Dinheiro,{value:f.valor || 0, label:"Valor estimado do reparo", onChange:function(v){ set("valor", v || null); }}))),
      e(Painel,{t:"Fotos da avaria", ic:"camera"},
        e("div",{className:"grid grid-cols-2 justify-items-center gap-2"}, ["avaria", "avaria2"].map(function(sl){ return e(FotoSlot,{key:sl, rot:ROTULO_SLOT[sl], valor:k.fotos && k.fotos[sl], onChange:function(foto){ onFoto(sl, foto); }}); })))),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:ok}, "Salvar avaria")));
}

function CartaoAvaria(p){
  var k = p.k, fotos = ["avaria", "avaria2"].filter(function(sl){ return k.fotos && k.fotos[sl]; });
  return e("div",{className:"flex flex-col items-center gap-1.5 rounded-xl bg-black/25 p-2.5 text-center ring-1 ring-white/10", style:{boxShadow:"inset 3px 0 0 "+corTom(TOM_STATUS_AVARIA[k.statusAvaria])}},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, e("span",{className:MONO+" rounded-md bg-black/35 px-1.5 py-0.5 text-[11.5px] font-bold"}, "Nº "+rotuloNumero(k)),
      e(SeloTom,{tom:TOM_STATUS_AVARIA[k.statusAvaria]}, ROTULO_STATUS_AVARIA[k.statusAvaria] || "Aberto"), k.tipoAvaria && e(Selo,{cor:"#F97316"}, rotuloAvaria(k.tipoAvaria))),
    e("b",{className:"text-[13.5px] leading-tight"}, k.nome),
    e("span",{className:"text-[11.5px] text-white/65"}, "Devolvido em "+(formatarDia(k.dataDevolucao) || "—")+(k.responsavelDevolucao ? " · Responsável: "+k.responsavelDevolucao : "")),
    k.motivoDevolucao && e("span",{className:"text-[12px] text-white/80"}, k.motivoDevolucao),
    k.descricaoAvaria && e("span",{className:"text-[12px] text-white/70"}, k.descricaoAvaria),
    e("span",{className:MONO+" text-[13px] font-bold"}, k.valorEstimadoReparo!=null ? formatarReais(k.valorEstimadoReparo) : "Reparo sem valor"),
    fotos.length>0 && e("div",{className:"flex justify-center gap-1.5"}, fotos.map(function(sl){ return e("img",{key:sl, src:k.fotos[sl], alt:ROTULO_SLOT[sl], className:"size-14 rounded-md object-cover ring-1 ring-white/15"}); })),
    e(Bt,{ic:"pencil-simple", onClick:p.editar}, "Editar avaria"));
}

var FILTRO0 = {q:"", status:"", tipo:""};
function AbaExDanificados(){
  var c = useEx(), st = useState(FILTRO0), f = st[0], jan = useState(null), j = jan[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var r = exDanificados(c.s, {busca:f.q, statusAvaria:f.status || undefined, tipoAvaria:f.tipo || undefined}), t = r.totais, ativo = !!(f.q || f.status || f.tipo);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:5},
      e(Indicador,{t:"Danificados", v:t.total, cor:"total"}), e(Indicador,{t:"Abertos", v:t.aberto, cor:"ruim"}), e(Indicador,{t:"Em reparo", v:t.emReparo, cor:"alerta"}),
      e(Indicador,{t:"Resolvidos", v:t.resolvido, cor:"ok"}), e(Indicador,{t:"Reparo estimado em aberto", v:formatarReais(t.valorEstimadoAberto), cor:"ruim"})),
    e(BarraFiltros,{limpar:ativo ? function(){ st[1](FILTRO0); } : undefined},
      e(Busca,{v:f.q, set:function(v){ set("q", v); }, ph:"Buscar por nome, número ou responsável"}),
      STATUS_AVARIA.map(function(x){ return e(Chip,{key:x, on:f.status===x, onClick:function(){ set("status", f.status===x ? "" : x); }}, ROTULO_STATUS_AVARIA[x]); }),
      TIPOS_AVARIA.map(function(x){ return e(Chip,{key:x, on:f.tipo===x, onClick:function(){ set("tipo", f.tipo===x ? "" : x); }}, ROTULO_AVARIA[x]); })),
    r.lista.length===0 ? Vazio(ativo ? "Nenhum expositor danificado encontrado." : "Nenhum expositor devolvido com avaria.", "warning")
      : e(Mosaico,{min:"19rem"}, r.lista.map(function(k){ return e(CartaoAvaria,{key:k.id, k:k, editar:function(){ jan[1](k.id); }}); })),
    j && e(JanelaAvaria,{key:j, c:c, id:j, fechar:function(){ jan[1](null); }}));
}

export { AbaExDanificados, JanelaAvaria };
