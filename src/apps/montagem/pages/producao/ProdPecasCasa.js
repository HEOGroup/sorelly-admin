// Sorelly Admin · montagem — pages/producao/ProdPecasCasa.js
// Produção externa › PEÇAS POR CÓDIGO (Marcus, 18/11/2026: "tem que anotar o que é enviado para ela também, não só o que é feito, para termos controle").
//   Bloco 1 — Com ela, por código: enviado a ela, feitas (ela informa), devolvido à Sorelly (vem da grade, filial Casa), feitas a devolver, falta fazer e o que está com ela.
//   Bloco 2 — Envios a ela: cada envio (dia, código, quantidade, feitas). Botão "+ Enviada" anota um envio novo; clicar na linha atualiza as feitas ou apaga.
// Contas em domain/producao-casa.js (testes: scripts/testar-producao-casa.mjs); regras em domain/producao.js (mov_add, mov_feitas, mov_del).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { chamar } from "@/apps/montagem/lib/api";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CASA_CONTROLE_DESDE, categoriaDaLinha, eCasa, formatarDia, formatarInteiro, formatarReais, hojeSP, precoPorCodigo, situacaoCasa } from "@/apps/montagem/domain/producao";
import { BtFaixa, casca, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useEffect, useState } from "@/shared/react";

var cacheDm = {};   // CÓDIGO → dados da DevMaster (preço, descrição) ou null se ela não conhece; vale enquanto a página estiver aberta
var limpa = function(c){ return String(c || "").toUpperCase().replace(/\s+/g, ""); };
var n0 = function(v){ return formatarInteiro(v); };
var traco = function(v){ return v ? n0(v) : "—"; };

function AbaProdPecasCasa(props){
  var x = usePr(), sJ = useState(null), j = sJ[0], editaNum = !x.leitura;
  var func = (props && props.func) || "", mesmo = function(n){ return !func || String(n || "Davila Aline").trim().toLowerCase()===func.trim().toLowerCase(); };   // a tela mostra UMA pessoa que faz em casa (Dávila, Leci, Didi...)
  var sit = situacaoCasa(x.pr, func), hoje = hojeSP(), sVer = useState(0), sAb = useState({});   // sAb = dias abertos nas Movimentações
  var chaveCod = j && j.modo==="novo" ? j.linhas.map(function(l){ return limpa(l.codigo); }).filter(function(c){ return c.length>=3; }).join(",") : "";
  useEffect(function(){   // digitou o código: busca o PREÇO na DevMaster (só leitura, a mesma consulta da Produção por tipo)
    if(!chaveCod) return;
    var faltam = chaveCod.split(",").filter(function(c){ return cacheDm[c]===undefined; }); if(!faltam.length) return;
    var vivo = true, t = setTimeout(function(){
      chamar("GET", "/produtos-dm?codigos="+encodeURIComponent(faltam.join(","))).then(function(r){ faltam.forEach(function(c){ cacheDm[c] = (r.itens || {})[c] || null; }); if(vivo) sVer[1](function(v){ return v+1; }); })
        .catch(function(){ faltam.forEach(function(c){ cacheDm[c] = null; }); if(vivo) sVer[1](function(v){ return v+1; }); });
    }, 350);
    return function(){ vivo = false; clearTimeout(t); };
  }, [chaveCod]);   // eslint-disable-line react-hooks/exhaustive-deps
  var codigos = (x.pr.codigos || []).map(function(c){ return c.codigo; }).filter(Boolean);
  var setJ = function(c){ sJ[1](Object.assign({}, j, c)); };
  var linhaVazia = function(k){ return {k:k, codigo:"", qtd:""}; };
  var novo = function(){ sJ[1]({modo:"novo", dia:hoje, obs:"", seq:2, linhas:[linhaVazia(1)]}); };   // abre com UMA linha; "+ Nova linha" (ou Enter na quantidade) acrescenta a próxima
  var setL = function(k, c){ sJ[1](Object.assign({}, j, {linhas:j.linhas.map(function(l){ return l.k===k ? Object.assign({}, l, c) : l; })})); };
  var maisLinha = function(){ sJ[1](Object.assign({}, j, {seq:j.seq+1, linhas:j.linhas.concat([linhaVazia(j.seq)])})); };
  var tiraLinha = function(k){ sJ[1](Object.assign({}, j, {linhas:j.linhas.length>1 ? j.linhas.filter(function(l){ return l.k!==k; }) : j.linhas})); };
  var abrir = function(r){ sJ[1]({modo:"editar", id:r.id, dia:r.dia, codigo:r.codigo, qtd:String(r.qtd), feitas:String(r.feitas || 0), obs:r.obs || ""}); };
  var salvar = function(){
    var ok = j.modo==="novo" ? x.exec("mov_lote", {func:func, dia:j.dia, obs:j.obs, itens:j.linhas.filter(function(l){ return String(l.codigo).trim() && Number(l.qtd)>0; })}) : x.exec("mov_feitas", {id:j.id, feitas:j.feitas});
    if(ok) sJ[1](null); else window.alert("Não foi possível gravar. Confira a data e, em cada linha, o código e a quantidade.");
  };
  var apagar = function(){ if(window.confirm("Apagar este envio de "+j.qtd+" peças ("+j.codigo+")?") && x.exec("mov_del", {id:j.id})) sJ[1](null); };

  // ESTOQUE COM A DÁVILA (Marcus, 19/11/2026: "é estoque, algo assim"): saldo por código (entrou, voltou, saldo) e, ao lado, as movimentações em ordem de data (entrou = a Sorelly mandou; voltou = ela devolveu pronta, vem da grade)
  var saldo = sit.linhas.slice().sort(function(a, b){ return b.comEla-a.comEla || (a.codigo<b.codigo ? -1 : 1); }).map(function(l){ return {id:l.codigo, codigo:l.codigo, cat:categoriaDaLinha(x.pr, l.codigo).rotulo, entrou:l.enviado, voltou:l.devolvido, saldo:l.comEla, aMais:l.aMais}; });
  var colsC = [{k:"codigo", t:"Código", w:"22%"}, {k:"cat", t:"Categoria", w:"26%"}, {k:"entrou", t:"Entrou", w:"17%", fmt:n0}, {k:"voltou", t:"Voltou", w:"17%", fmt:traco},
    {k:"saldo", t:"Saldo", w:"18%", fmt:n0, cor:function(r){ return r.aMais ? "text-danger" : r.saldo>0 ? "font-bold" : "text-success"; }}];
  var rodapeC = function(ls){ var s = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); }; return ["TOTAL · "+ls.length+(ls.length===1 ? " código" : " códigos"), "", n0(s("entrou")), traco(s("voltou")), n0(s("saldo"))]; };

  var movs = (x.pr.movCasa || []).filter(function(m){ return mesmo(m.func); }).map(function(m){ return {id:"e"+m.id, dia:m.dia, codigo:m.codigo, entrou:m.qtd, voltou:0, mov:m}; }), vol = {};
  Object.keys(x.pr.lancamentos || {}).forEach(function(d){ if(d<CASA_CONTROLE_DESDE) return; (x.pr.lancamentos[d] || []).forEach(function(l){ var q = Number(l.qtd) || 0; if(eCasa(l) && q>0 && l.codigo && mesmo(l.func)){ var k = d+"|"+l.codigo; vol[k] = vol[k] || {id:"v"+k, dia:d, codigo:l.codigo, entrou:0, voltou:0}; vol[k].voltou += q; } }); });
  movs = movs.concat(Object.keys(vol).map(function(k){ return vol[k]; })).sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : (a.voltou ? 1 : 0)-(b.voltou ? 1 : 0) || (a.codigo<b.codigo ? -1 : 1); });
  // MOVIMENTAÇÕES POR DIA (Marcus, 22/11/2026: "nas movimentações faz por dia, ali total"): uma linha por dia com o total que entrou e voltou; clicar no dia abre os códigos dele (e clicar num envio abre para alterar)
  var porDiaM = {}; movs.forEach(function(m){ var g = porDiaM[m.dia] || (porDiaM[m.dia] = {dia:m.dia, entrou:0, voltou:0, itens:[]}); g.entrou += m.entrou || 0; g.voltou += m.voltou || 0; g.itens.push(m); });
  var movsDia = []; Object.keys(porDiaM).sort().reverse().forEach(function(d){ var g = porDiaM[d], aberto = !!sAb[0][d];
    movsDia.push({id:"d"+d, tipo:"dia", dia:d, quando:(aberto ? "▾ " : "▸ ")+formatarDia(d), codigo:g.itens.length+(g.itens.length===1 ? " código" : " códigos"), entrou:g.entrou, voltou:g.voltou});
    if(aberto) g.itens.forEach(function(m){ movsDia.push({id:"i"+m.id, tipo:"item", dia:d, quando:"", codigo:m.codigo, entrou:m.entrou, voltou:m.voltou, mov:m.mov}); }); });
  var abreDia = function(r){ if(r.tipo==="dia"){ var n = Object.assign({}, sAb[0]); if(n[r.dia]) delete n[r.dia]; else n[r.dia] = 1; sAb[1](n); } else if(r.mov && editaNum) abrir(r.mov); };
  var colsE = [{k:"quando", t:"Data", w:"28%"}, {k:"codigo", t:"Código", w:"24%"}, {k:"entrou", t:"Entrou", w:"24%", fmt:traco}, {k:"voltou", t:"Voltou", w:"24%", fmt:traco, cor:function(r){ return r.voltou ? "text-success" : ""; }}];
  var rodapeE = function(ls){ var d = ls.filter(function(r){ return r.tipo==="dia"; }), s = function(k){ return d.reduce(function(t, r){ return t+(r[k]||0); }, 0); }; return ["TOTAL · "+d.length+(d.length===1 ? " dia" : " dias"), "", traco(s("entrou")), traco(s("voltou"))]; };

  // JANELA COMPACTA (Marcus, 19/11/2026: "mais compacta, mais cor, mais alinhada"): título azul, fundo em degradê, UMA linha de campos alinhados (data, código, quantidade, observação) e os botões embaixo à direita
  var fecha = function(){ sJ[1](null); }, ehNovo = j && j.modo==="novo";
  var CAMPO = "h-8 w-full min-w-0 rounded-md border border-white/20 bg-white/10 px-2 text-center text-[13px] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#5BB8FF]";
  var rot = function(t, filho){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-white"}, t, filho); };
  var tabPrecos = j ? precoPorCodigo(x.pr) : {}, totalPecas = 0, totalValor = 0;
  var precoDe = function(cd){ var dm = cacheDm[cd]; return dm && dm.preco>0 ? dm.preco : ((tabPrecos[cd] || {}).valor || 0); };
  if(ehNovo) j.linhas.forEach(function(l){ var q = Number(l.qtd) || 0; if(String(l.codigo).trim() && q>0){ totalPecas += q; totalValor += q*precoDe(limpa(l.codigo)); } });
  var janela = j && e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-3", onClick:fecha},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, style:{background:"linear-gradient(160deg,#22396b 0%,#16264a 45%,#0c1428 100%)"}, className:"flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-white/15 shadow-2xl"},
      e("div",{className:"flex h-[34px] shrink-0 items-center justify-between gap-3 px-3 text-white", style:{background:"linear-gradient(90deg,#2f5fb3,#1d3f7d)"}},
        e("b",{className:"text-[13px] font-semibold"}, ehNovo ? "Estoque enviado" : "Envio de "+j.codigo),
        e("span",{className:"text-[11px] font-semibold uppercase tracking-[.05em]"}, (func || "")+" · "+formatarDia(j.dia))),
      ehNovo ? e("div",{className:"flex min-h-0 flex-col gap-2 overflow-y-auto p-3"},
        e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-[9rem_1fr]"},
          rot("Data do envio", e("input",{type:"date", value:j.dia, "aria-label":"Data", onChange:function(ev){ setJ({dia:ev.target.value}); }, className:CAMPO})),
          rot("Observação", e("input",{value:j.obs, "aria-label":"Observação", onChange:function(ev){ setJ({obs:ev.target.value}); }, className:CAMPO}))),
        e("datalist",{id:"casa-codigos"}, codigos.map(function(c){ return e("option",{key:c, value:c}); })),
        e("div",{className:"grid grid-cols-[1.4fr_1fr_1fr_1fr_2rem] items-center gap-2 px-1 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-white"}, e("span",null, "Código"), e("span",null, "Quantidade"), e("span",null, "Preço"), e("span",null, "Valor"), e("span",null, "")),
        j.linhas.map(function(l, ix){
          var cd = limpa(l.codigo), pc = cd ? precoDe(cd) : 0, q = Number(l.qtd) || 0, noCom = sit.linhas.find(function(z){ return z.codigo===cd; }), buscando = cd.length>=3 && cacheDm[cd]===undefined, dmL = cacheDm[cd];
          return e("div",{key:l.k, className:"grid grid-cols-[1.4fr_1fr_1fr_1fr_2rem] items-center gap-2"},
            e("input",{list:"casa-codigos", value:l.codigo, "aria-label":"Código "+(ix+1), placeholder:"Código", autoFocus:ix===0, onChange:function(ev){ setL(l.k, {codigo:ev.target.value.toUpperCase()}); }, className:CAMPO}),
            e("input",{type:"number", min:1, value:l.qtd, "aria-label":"Quantidade "+(ix+1), placeholder:"Qtd.", onChange:function(ev){ setL(l.k, {qtd:ev.target.value}); }, onKeyDown:function(ev){ if(ev.key==="Enter" && ix===j.linhas.length-1 && cd && q>0) maisLinha(); }, className:CAMPO+" tabular-nums"}),
            e("span",{title:dmL ? dmL.descricao : "", className:"text-center text-[13px] font-semibold tabular-nums "+(buscando ? "text-[#5BB8FF]" : cd && !pc ? "text-[#ff9f43]" : "text-[#4ade80]")}, !cd ? "—" : buscando ? "Buscando" : pc ? formatarReais(pc) : "Sem preço"),
            e("span",{className:"text-center text-[13px] font-semibold tabular-nums text-white"}, pc && q ? formatarReais(pc*q) : "—"),
            e("button",{type:"button", onClick:function(){ tiraLinha(l.k); }, "aria-label":"Tirar a linha "+(ix+1), title:noCom ? "Já com ela: "+n0(noCom.comEla) : "Tirar a linha", className:"h-8 rounded-md border border-white/20 text-[13px] font-semibold text-white hover:bg-white/10 hover:text-[#ff6b6b]"}, "×"));
        })) : e("div",{className:"grid grid-cols-2 items-end gap-2 p-3 md:grid-cols-[1fr_2fr]"},
        rot("Feitas (ela informa)", e("input",{type:"number", min:0, value:j.feitas, "aria-label":"Feitas", autoFocus:true, placeholder:"0", onChange:function(ev){ setJ({feitas:ev.target.value}); }, className:CAMPO+" tabular-nums"})),
        e("span",{className:"pb-1 text-center text-[13px] font-semibold text-white"}, j.qtd+" peças enviadas")),
      e("div",{className:"flex shrink-0 items-center gap-2 border-t border-white/15 px-3 py-2"},
        ehNovo && e("button",{type:"button", onClick:maisLinha, className:"h-8 rounded-md border border-[#5BB8FF] px-4 text-[13px] font-semibold text-[#5BB8FF] hover:bg-[#5BB8FF]/15"}, "+ Nova linha"),
        ehNovo && e("span",{className:"text-[13px] font-semibold text-white"}, n0(totalPecas)+" peças · "+formatarReais(totalValor)),
        e("span",{className:"flex-1"}),
        !ehNovo && e("button",{type:"button", onClick:apagar, className:"h-8 rounded-md border border-[#ff6b6b] px-4 text-[13px] font-semibold text-[#ff6b6b] hover:bg-[#ff6b6b]/15"}, "Apagar envio"),
        e("button",{type:"button", onClick:fecha, className:"h-8 rounded-md border border-white/30 px-4 text-[13px] font-semibold text-white hover:bg-white/10"}, "Cancelar"),
        e("button",{type:"button", onClick:salvar, className:"h-8 rounded-md bg-[#2f7bd6] px-5 text-[13px] font-semibold text-white hover:bg-[#3b8be8]"}, "Salvar"))));

  return casca(props && props.semRaiz,
    e(BlocoPainel,{titulo:"Estoque e movimentações · "+(func ? func.split(" ")[0] : "elas"), dir:"Saldo "+n0(sit.tot.comEla), compacto:true, acao:e(BtFaixa,{onClick:novo, disabled:!editaNum || !func, titulo:"Anotar o estoque que a Sorelly enviou para "+(func || "ela")}, "+ Estoque enviado")},
      e("div",{className:"grid grid-cols-1 items-start lg:grid-cols-2"},
        e("div",{className:"min-w-0 lg:border-r-[3px] lg:border-white"},
          e(TabelaPlanilha,{key:"pc", fina:true, cols:colsC, linhas:saldo, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeC, vazio:"Nenhuma peça enviada a ela desde 16/11."})),
        e("div",{className:"min-w-0"},
          e(TabelaPlanilha,{key:"pe"+JSON.stringify(sAb[0]), fina:true, cols:colsE, linhas:movsDia, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:rodapeE, aoClicar:abreDia, vazio:"Nenhuma movimentação."})))),
    janela);
}
export { AbaProdPecasCasa };
