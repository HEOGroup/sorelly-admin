// Sorelly Admin · montagem — pages/producao/ProdPecasCasa.js
// Produção externa › PEÇAS POR CÓDIGO (Marcus, 18/11/2026: "tem que anotar o que é enviado para ela também, não só o que é feito, para termos controle").
//   Bloco 1 — Com ela, por código: enviado a ela, feitas (ela informa), devolvido à Sorelly (vem da grade, filial Casa), feitas a devolver, falta fazer e o que está com ela.
//   Bloco 2 — Envios a ela: cada envio (dia, código, quantidade, feitas). Botão "+ Enviada" anota um envio novo; clicar na linha atualiza as feitas ou apaga.
// Contas em domain/producao-casa.js (testes: scripts/testar-producao-casa.mjs); regras em domain/producao.js (mov_add, mov_feitas, mov_del).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { Janela } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CASA_CONTROLE_DESDE, categoriaDaLinha, eCasa, formatarDia, formatarInteiro, hojeSP, situacaoCasa } from "@/apps/montagem/domain/producao";
import { Campo, Painel } from "@/apps/montagem/pages/compras/visualCompras";
import { GRADE_LIMPA, casca, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var IN = INPUT+" w-full text-center";
var n0 = function(v){ return formatarInteiro(v); };
var traco = function(v){ return v ? n0(v) : "—"; };

function AbaProdPecasCasa(props){
  var x = usePr(), sJ = useState(null), j = sJ[0], editaNum = !x.leitura;
  var sit = situacaoCasa(x.pr);
  var codigos = (x.pr.codigos || []).map(function(c){ return c.codigo; }).filter(Boolean);
  var setJ = function(c){ sJ[1](Object.assign({}, j, c)); };
  var abrir = function(r){ sJ[1]({modo:"editar", id:r.id, dia:r.dia, codigo:r.codigo, qtd:String(r.qtd), feitas:String(r.feitas || 0), obs:r.obs || ""}); };
  var salvar = function(){
    var ok = j.modo==="novo" ? x.exec("mov_add", {dia:j.dia, codigo:j.codigo, qtd:j.qtd, feitas:j.feitas, obs:j.obs}) : x.exec("mov_feitas", {id:j.id, feitas:j.feitas});
    if(ok) sJ[1](null); else window.alert("Não foi possível gravar. Confira o dia, o código, a quantidade e as feitas (não podem passar do enviado).");
  };
  var apagar = function(){ if(window.confirm("Apagar este envio de "+j.qtd+" peças ("+j.codigo+")?") && x.exec("mov_del", {id:j.id})) sJ[1](null); };

  // ESTOQUE COM A DÁVILA (Marcus, 19/11/2026: "é estoque, algo assim"): saldo por código (entrou, voltou, saldo) e, ao lado, as movimentações em ordem de data (entrou = a Sorelly mandou; voltou = ela devolveu pronta, vem da grade)
  var saldo = sit.linhas.slice().sort(function(a, b){ return b.comEla-a.comEla || (a.codigo<b.codigo ? -1 : 1); }).map(function(l){ return {id:l.codigo, codigo:l.codigo, cat:categoriaDaLinha(x.pr, l.codigo).rotulo, entrou:l.enviado, voltou:l.devolvido, saldo:l.comEla, aMais:l.aMais}; });
  var colsC = [{k:"codigo", t:"Código", w:"22%"}, {k:"cat", t:"Categoria", w:"26%"}, {k:"entrou", t:"Entrou", w:"17%", fmt:n0}, {k:"voltou", t:"Voltou", w:"17%", fmt:traco},
    {k:"saldo", t:"Saldo", w:"18%", fmt:n0, cor:function(r){ return r.aMais ? "text-danger" : r.saldo>0 ? "font-bold" : "text-success"; }}];
  var rodapeC = function(ls){ var s = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); }; return ["TOTAL · "+ls.length+(ls.length===1 ? " código" : " códigos"), "", n0(s("entrou")), traco(s("voltou")), n0(s("saldo"))]; };

  var movs = (x.pr.movCasa || []).map(function(m){ return {id:"e"+m.id, dia:m.dia, codigo:m.codigo, entrou:m.qtd, voltou:0, mov:m}; }), vol = {};
  Object.keys(x.pr.lancamentos || {}).forEach(function(d){ if(d<CASA_CONTROLE_DESDE) return; (x.pr.lancamentos[d] || []).forEach(function(l){ var q = Number(l.qtd) || 0; if(eCasa(l) && q>0 && l.codigo){ var k = d+"|"+l.codigo; vol[k] = vol[k] || {id:"v"+k, dia:d, codigo:l.codigo, entrou:0, voltou:0}; vol[k].voltou += q; } }); });
  movs = movs.concat(Object.keys(vol).map(function(k){ return vol[k]; })).sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : (a.voltou ? 1 : 0)-(b.voltou ? 1 : 0) || (a.codigo<b.codigo ? -1 : 1); });
  var colsE = [{k:"dia", t:"Data", w:"28%", fmt:function(v){ return formatarDia(v); }}, {k:"codigo", t:"Código", w:"24%"}, {k:"entrou", t:"Entrou", w:"24%", fmt:traco}, {k:"voltou", t:"Voltou", w:"24%", fmt:traco, cor:function(r){ return r.voltou ? "text-success" : ""; }}];
  var rodapeE = function(ls){ var s = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); }; return ["TOTAL · "+ls.length+(ls.length===1 ? " movimento" : " movimentos"), "", traco(s("entrou")), traco(s("voltou"))]; };

  var janela = j && e(Janela,{t:j.modo==="novo" ? "Enviada a ela" : "Envio de "+j.codigo, sub:j.modo==="novo" ? "Anote o que a Sorelly mandou para ela fazer" : formatarDia(j.dia)+" · "+j.qtd+" peças", fechar:function(){ sJ[1](null); }, colunas:[
    e(Painel,{key:"e", t:j.modo==="novo" ? "Envio" : "Feitas", ic:"box"},
      j.modo==="novo" && e(Campo,{rot:"Data"}, e("input",{type:"date", value:j.dia, "aria-label":"Data", onChange:function(ev){ setJ({dia:ev.target.value}); }, className:IN})),
      j.modo==="novo" && e(Campo,{rot:"Código da peça"}, e("input",{list:"casa-codigos", value:j.codigo, "aria-label":"Código da peça", placeholder:"Ex.: BB1517", autoFocus:true, onChange:function(ev){ setJ({codigo:ev.target.value.toUpperCase()}); }, className:IN}), e("datalist",{id:"casa-codigos"}, codigos.map(function(c){ return e("option",{key:c, value:c}); }))),
      j.modo==="novo" && e(Campo,{rot:"Quantidade enviada"}, e("input",{type:"number", min:1, value:j.qtd, "aria-label":"Quantidade enviada", onChange:function(ev){ setJ({qtd:ev.target.value}); }, className:IN+" tabular-nums"})),
      e(Campo,{rot:"Feitas (ela informa)"}, e("input",{type:"number", min:0, value:j.feitas, "aria-label":"Feitas", autoFocus:j.modo==="editar", placeholder:"0", onChange:function(ev){ setJ({feitas:ev.target.value}); }, className:IN+" tabular-nums"})),
      j.modo==="novo" && e(Campo,{rot:"Observação"}, e("input",{value:j.obs, "aria-label":"Observação", onChange:function(ev){ setJ({obs:ev.target.value}); }, className:IN}))),
    e(Painel,{key:"a", t:"Ações", ic:"gear"}, e("div",{className:"flex flex-col gap-2"}, e(Botao,{principal:true, onClick:salvar}, "Salvar"), e(Botao,{onClick:function(){ sJ[1](null); }}, "Cancelar"), j.modo==="editar" && e(Botao,{onClick:apagar}, "Apagar envio")))]});

  return casca(props && props.semRaiz,
    e("div",{className:GRADE_LIMPA+" grid grid-cols-1 items-start gap-2 lg:grid-cols-2"},
      e(BlocoPainel,{titulo:"Estoque com a Dávila", dir:"Saldo "+n0(sit.tot.comEla), compacto:true},
        e(TabelaPlanilha,{key:"pc", cols:colsC, linhas:saldo, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeC, vazio:"Nenhuma peça enviada a ela desde 16/11."})),
      e(BlocoPainel,{titulo:"Movimentações", dir:movs.length || "", compacto:true},
        e(TabelaPlanilha,{key:"pe", cols:colsE, linhas:movs, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeE, aoClicar:editaNum ? function(r){ if(r.mov) abrir(r.mov); } : undefined, vazio:"Nenhuma movimentação."}))),
    janela);
}
export { AbaProdPecasCasa };
