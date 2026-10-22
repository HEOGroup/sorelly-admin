// Sorelly Admin · montagem — pages/cadpecas/Calculadora.js
// Cadastro de peças → aba "Calculadora": uma PLANILHA de cadastro (= uma aba da planilha Bruto/Ouro, pode ter vários pedidos) por vez, no estilo das telas de Pagamentos a fornecedores:
// barra de filtros, resumo neutro, tabela cheia com totais no rodapé. A Rayssa lança as peças do romaneio e o peso; o sistema calcula banho, custo,
// preço sugerido e markup, e manda o preço para aprovação no SorellyChat (grupo "Cadastro de Peças").
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { api, euAgora } from "@/apps/montagem/domain/chat-store";
import { idPorNome } from "@/apps/montagem/domain/chat-contatos";
import { GALVANICAS, brl, calcLinha, pct0, resumoLote } from "@/apps/montagem/domain/cadastro-pecas";
import { Bt, Cel, Ic, NEUTRO, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

// célula compacta (tabelas pequenas, pedido do Marcus em 21/10/2026)
function Tc(p){ return e(Td, Object.assign({}, p, {className:"px-1! py-0.5! text-[12px]! "+(p.className||"")}), p.children); }
var INP = "h-9 rounded-lg bg-black/30 px-2.5 text-[13px] ring-1 ring-white/15 outline-none focus:ring-white/45";
var SITUACOES = [["", "Todas as peças"], ["pend", "Não enviadas ao chat"], ["env", "Enviadas ao chat"], ["semb", "Sem banho"], ["semp", "Sem preço definido"]];

// manda os preços sugeridos para o grupo "Cadastro de Peças" do chat, como cartão de decisão (Marcus, Nickolas e Lucas aprovam)
function enviarAoChat(x, lote, linhas){
  var eu = euAgora() || idPorNome("Rayssa"), decisores = ["Marcus", "Nickolas", "Lucas"].map(function(n){ return idPorNome(n); }).filter(Boolean), ids = [];
  linhas.forEach(function(l){
    var v = calcLinha(l, lote, x.c.config); if(!(v.custo>0) || !(v.preco>0)) return;
    var m = api.sendMessage({conv:"c_preco", eu:eu, tipo:"decisao", dec:{tipo:"preco", titulo:"Preço de peça nova", modelo:l.codigo, foto:null, custo:Math.round(v.custo*100)/100, qtd:l.qtd, fornecedor:l.fornecedor, preco:v.preco, decisores:decisores, estado:"pendente"}});
    if(m) ids.push(l.id);
  });
  if(ids.length) x.exec("linhas_enviadas", {lote:lote.id, ids:ids});
  return ids.length;
}

function AbaCalculadora(p){
  var x = useCpc(), c = x.c, nv = useState(null), colar = useState({forn:"", txt:""}), fl = useState({q:"", forn:"", sit:""}), se = useState([]);
  var lote = c.lotes.find(function(l){ return l.id===p.loteId; }) || c.lotes[0];
  if(!lote) return e(Pagina,null, e(Vazio,{ic:"calculator"}, "Nenhuma planilha ainda."), e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ nv[1]({nome:"", galv:"pontual"}); }}, "Nova planilha")), nv[0] && NovoLote(x, nv, p.onLote));
  var r = resumoLote(lote, c.config), alvo = lote.markup!=null ? lote.markup : c.config.markupAlvo, f = fl[0];
  var fornecedores = lote.linhas.map(function(l){ return l.fornecedor; }).filter(function(v, i, a){ return v && a.indexOf(v)===i; }).sort();
  var vis = lote.linhas.filter(function(l){
    var v = calcLinha(l, lote, c.config), q = f.q.trim().toLowerCase();
    if(q && (l.codigo+" "+l.fornecedor).toLowerCase().indexOf(q)<0) return false;
    if(f.forn && l.fornecedor!==f.forn) return false;
    if(f.sit==="pend") return !l.enviado; if(f.sit==="env") return !!l.enviado; if(f.sit==="semb") return !v.banhoOk; if(f.sit==="semp") return !(l.preco>0);
    return true;
  });
  var marcadas = se[0].filter(function(id){ return lote.linhas.some(function(l){ return l.id===id && !l.enviado; }); });
  var enviaveis = vis.filter(function(l){ return !l.enviado && calcLinha(l, lote, c.config).banhoOk; });
  var alvoEnvio = marcadas.length ? lote.linhas.filter(function(l){ return marcadas.indexOf(l.id)>=0; }) : enviaveis;
  var filtrando = f.q || f.forn || f.sit;

  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Sl,{v:lote.id, set:function(v){ p.onLote(v); se[1]([]); }, rot:"Planilha", opcoes:c.lotes.map(function(l){ return [l.id, l.nome+" · "+GALVANICAS[l.galvanica]]; }), className:"w-60"}),
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ nv[1]({nome:"", galv:"pontual"}); }}, "Nova planilha"),
      e("label",{className:"flex items-center gap-1.5 text-[12.5px] font-bold"}, "Markup alvo da planilha",
        e(Cel,{v:lote.markup!=null ? Math.round(lote.markup*100) : "", dica:Math.round(c.config.markupAlvo*100)+"", rot:"Markup alvo da planilha em porcentagem (vazio = padrão)", w:"w-16", onSet:function(v){ x.exec("lote_edit", {id:lote.id, markup:v}); }}), "%"),
      e(Ic,{ic:"trash", perigo:true, titulo:"Excluir esta planilha", onClick:function(){ if(window.confirm("Excluir a planilha "+lote.nome+" e todas as peças dele?")) { x.exec("lote_del", {id:lote.id}); p.onLote(""); } }})),
    nv[0] && NovoLote(x, nv, p.onLote),
    e(Faixa,{n:6},
      e(Indicador,{t:"Peças", v:String(r.pecas), cor:NEUTRO}),
      e(Indicador,{t:"Bruto", v:brl(r.brutoTotal), cor:NEUTRO}),
      e(Indicador,{t:"Banho", v:brl(r.banhoTotal), cor:NEUTRO}),
      e(Indicador,{t:"A pagar (bruto + banho)", v:brl(r.pagar), cor:NEUTRO}),
      e(Indicador,{t:"Venda total", v:brl(r.vendaTotal), cor:NEUTRO}),
      e(Indicador,{t:"Markup da planilha (alvo "+pct0(alvo)+")", v:pct0(r.markup), cor:r.markup>=alvo ? "ok" : "alerta"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Tabela de banho da fatura", dir:lote.tabela.length+" tipos"}, TabelaBanho(x, lote)),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Lançar peças do romaneio", dir:"colar"}, Colar(x, lote, colar)),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Peças da planilha", dir:vis.length+(filtrando ? " de "+lote.linhas.length : "")},
      e("div",{className:"mb-2 flex flex-wrap items-center justify-center gap-2"},
        e("input",{value:f.q, onChange:function(ev){ fl[1](Object.assign({}, f, {q:ev.target.value})); }, placeholder:"Buscar código ou fornecedor", "aria-label":"Buscar peça", className:INP+" w-60 text-center"}),
        e(Sl,{v:f.forn, set:function(v){ fl[1](Object.assign({}, f, {forn:v})); }, rot:"Fornecedor", opcoes:[["", "Todos os fornecedores"]].concat(fornecedores.map(function(n){ return [n, n]; })), className:"w-52"}),
        e(Sl,{v:f.sit, set:function(v){ fl[1](Object.assign({}, f, {sit:v})); }, rot:"Situação", opcoes:SITUACOES, className:"w-52"}),
        filtrando && e(Bt,{onClick:function(){ fl[1]({q:"", forn:"", sit:""}); }}, "Limpar"),
        e(Bt,{tipo:"forte", ic:"paper-plane-tilt", disabled:!alvoEnvio.length, titulo:"Manda para o Marcus aprovar no SorellyChat (as marcadas, ou todas as que têm banho)",
          onClick:function(){ if(window.confirm("Enviar "+alvoEnvio.length+" preço"+(alvoEnvio.length===1 ? "" : "s")+" para aprovação no SorellyChat?")) { enviarAoChat(x, lote, alvoEnvio); se[1]([]); } }},
          marcadas.length ? "Enviar marcadas ("+marcadas.length+")" : "Enviar ao chat ("+enviaveis.length+")")),
      lote.linhas.length ? Pecas(x, lote, vis, se) : e(Vazio,{ic:"diamond"}, "Nenhuma peça lançada nesta planilha.")));
}

function NovoLote(x, nv, aoCriar){
  var v = nv[0];
  return e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
    e("input",{value:v.nome, onChange:function(ev){ nv[1](Object.assign({}, v, {nome:ev.target.value})); }, placeholder:"Nome da planilha (ex.: 26/10 (Pontual))", "aria-label":"Nome da planilha", className:INP+" w-64 text-center"}),
    e(Sl,{v:v.galv, set:function(g){ nv[1](Object.assign({}, v, {galv:g})); }, rot:"Galvânica", opcoes:[["pontual", "Pontual"], ["ellos", "Ellos"]], className:"w-32"}),
    e(Bt,{tipo:"forte", ic:"check", onClick:function(){ if(x.exec("lote_add", {nome:v.nome, galvanica:v.galv})){ nv[1](null); aoCriar(""); } }}, "Criar planilha"),
    e(Bt,{onClick:function(){ nv[1](null); }}, "Cancelar"));
}

function TabelaBanho(x, lote){
  var nt = useState({tipo:"", rg:""}), v = nt[0];
  return e("div",{className:"flex flex-col items-center gap-1.5"},
    e("p",{className:"text-center text-[11px] text-white/70"}, "R$ por grama de cada banho (já com os 10%) da fatura da "+GALVANICAS[lote.galvanica]+". Ouro 1 = 1 milésimo, Ouro 2 = 2 milésimos, e assim por diante."),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      lote.tabela.map(function(t){ return e("span",{key:t.tipo, className:"inline-flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-0.5 text-[12px] ring-1 ring-white/10"}, e("b",null, t.tipo),
        e(Cel,{v:t.rg, rot:"R$ por grama de "+t.tipo, w:"w-14", onSet:function(n){ x.exec("tabela_set", {lote:lote.id, tipo:t.tipo, rg:n}); }}),
        e(Ic,{ic:"x", perigo:true, titulo:"Remover "+t.tipo, onClick:function(){ x.exec("tabela_del", {lote:lote.id, tipo:t.tipo}); }})); }),
      e("input",{value:v.tipo, onChange:function(ev){ nt[1](Object.assign({}, v, {tipo:ev.target.value})); }, placeholder:"Novo (ex.: Ouro 4)", "aria-label":"Novo tipo de banho", className:"h-7 w-32 rounded-md bg-black/30 px-2 text-center text-[12px] ring-1 ring-white/15 outline-none"}),
      e("input",{value:v.rg, onChange:function(ev){ nt[1](Object.assign({}, v, {rg:ev.target.value})); }, placeholder:"R$/g", inputMode:"decimal", "aria-label":"Valor por grama", className:"h-7 w-16 rounded-md bg-black/30 px-2 text-center text-[12px] ring-1 ring-white/15 outline-none"}),
      e(Bt,{ic:"plus", onClick:function(){ if(x.exec("tabela_set", {lote:lote.id, tipo:v.tipo, rg:v.rg})) nt[1]({tipo:"", rg:""}); }}, "Adicionar")));
}

// cola do Excel/romaneio: uma peça por linha, colunas separadas por tabulação ou ";" → Código · Quantidade · Preço bruto
function Colar(x, lote, st){
  var v = st[0];
  var ler = function(){ return v.txt.split(/\r?\n/).map(function(t){ var p = t.split(/\t|;/).map(function(q){ return q.trim(); }); return p.length>=3 ? {codigo:p[0], qtd:p[1], bruto:p[2], fornecedor:v.forn} : null; }).filter(Boolean); };
  var n = ler().length;
  return e("div",{className:"flex flex-col items-center gap-2"},
    e("p",{className:"text-center text-[12px] text-white/75"}, "Cole do romaneio, uma peça por linha: código, quantidade e preço bruto (separados por tabulação ou ponto e vírgula)."),
    e("input",{value:v.forn, onChange:function(ev){ st[1]({forn:ev.target.value, txt:v.txt}); }, placeholder:"Fornecedor (ex.: Point)", "aria-label":"Fornecedor", className:INP+" w-56 text-center"}),
    e("textarea",{value:v.txt, onChange:function(ev){ st[1]({forn:v.forn, txt:ev.target.value}); }, rows:4, "aria-label":"Peças do romaneio", placeholder:"AB044\t70\t4,55", className:"w-full max-w-2xl rounded-lg bg-black/30 p-2 text-[13px] ring-1 ring-white/15 outline-none focus:ring-white/45"}),
    e(Bt,{tipo:"forte", ic:"plus", disabled:!n || !v.forn.trim(), onClick:function(){ if(x.exec("linha_add", {lote:lote.id, linhas:ler()})) st[1]({forn:v.forn, txt:""}); }}, n ? "Lançar "+n+" peça"+(n===1 ? "" : "s") : "Lançar peças"));
}

function Pecas(x, lote, vis, se){
  var tipos = lote.tabela.map(function(t){ return [t.tipo, t.tipo]; }), cfg = x.c.config, alvo = lote.markup!=null ? lote.markup : cfg.markupAlvo;
  var set = function(l, k){ return function(val){ x.exec("linha_edit", Object.assign({lote:lote.id, id:l.id}, (function(){ var o = {}; o[k] = val; return o; })())); }; };
  var sel = se[0], todasMarcadas = vis.length>0 && vis.every(function(l){ return l.enviado || sel.indexOf(l.id)>=0; });
  var alterna = function(id){ se[1](sel.indexOf(id)>=0 ? sel.filter(function(i){ return i!==id; }) : sel.concat([id])); };
  var tot = {q:0, bruto:0, custo:0, rec:0};
  var corpo = vis.map(function(l){
    var v = calcLinha(l, lote, cfg), baixo = v.markup<alvo-0.05; tot.q += l.qtd||0; tot.bruto += v.brutoTotal; tot.custo += v.custoTotal; tot.rec += v.recebidoTotal;
    return e("tr",{key:l.id, className:"border-t border-white/5 hover:bg-white/5"},
      e(Tc,null, l.enviado ? null : e("input",{type:"checkbox", checked:sel.indexOf(l.id)>=0, onChange:function(){ alterna(l.id); }, "aria-label":"Marcar "+l.codigo, className:"size-3.5 cursor-pointer accent-[#3B82F6]"})),
      e(Tc,null, e(Cel,{v:l.fornecedor, texto:true, rot:"Fornecedor", w:"w-20", onSet:set(l, "fornecedor")})),
      e(Tc,null, e(Cel,{v:l.codigo, texto:true, rot:"Código", w:"w-24", onSet:set(l, "codigo")})),
      e(Tc,null, e(Cel,{v:l.qtd, rot:"Quantidade", w:"w-12", onSet:set(l, "qtd")})),
      e(Tc,null, e(Cel,{v:l.bruto || "", rot:"Preço bruto", w:"w-14", onSet:set(l, "bruto")})),
      e(Tc,null, e(Cel,{v:l.peso || "", dica:"g", rot:"Peso em gramas", w:"w-14", onSet:set(l, "peso")})),
      e(Tc,null, e(Sl,{v:l.banho, set:set(l, "banho"), rot:"Banho", opcoes:[["", "—"]].concat(tipos), className:"w-24 h-7! px-1! text-[12px]!"})),
      e(Tc,null, e(Cel,{v:l.banhoManual || "", dica:"fixo", rot:"Banho com valor fixo por peça (vale no lugar do peso)", w:"w-12", onSet:set(l, "banhoManual")})),
      e(Tc,null, e(Cel,{v:l.descPedra ? Math.round(l.descPedra*100) : "", dica:"%", rot:"Desconto da pedra em porcentagem", w:"w-10", onSet:set(l, "descPedra")})),
      e(Tc,{dinheiro:true, cor:v.banhoOk ? undefined : "ruim"}, v.banhoOk ? brl(v.custo) : "sem banho"),
      e(Tc,{dinheiro:true, className:"text-white/70"}, v.sugerido ? brl(v.sugerido) : "—"),
      e(Tc,null, e(Cel,{v:l.preco || "", dica:v.sugerido ? String(v.sugerido) : "", rot:"Preço de venda (vazio = usa o sugerido)", w:"w-16", onSet:set(l, "preco")})),
      e(Tc,{forte:true, cor:v.custo>0 ? (baixo ? "alerta" : "ok") : undefined}, v.custo>0 ? pct0(v.markup) : "—"),
      e(Tc,null, l.enviado ? e("span",{title:"Já enviado ao chat", className:"font-bold text-[#4ADE80]"}, "✓") : e(Ic,{ic:"paper-plane-tilt", titulo:"Enviar este preço para aprovação no chat", disabled:!(v.custo>0), onClick:function(){ enviarAoChat(x, lote, [l]); }})),
      e(Tc,null, e(Ic,{ic:"x", perigo:true, titulo:"Remover a peça", onClick:function(){ x.exec("linha_del", {lote:lote.id, id:l.id}); }})));
  });
  var mk = tot.custo>0 ? (tot.rec-tot.custo)/tot.custo : 0;
  var rodape = e("tr",{key:"total", className:"border-t-2 border-white/25 bg-black/30"},
    e(Tc,null), e(Tc,{forte:true, colSpan:2}, "Total ("+vis.length+")"), e(Tc,{forte:true}, tot.q), e(Tc,{dinheiro:true, forte:true}, brl(tot.bruto)), e(Tc,null), e(Tc,null), e(Tc,null), e(Tc,null),
    e(Tc,{dinheiro:true, forte:true}, brl(tot.custo)+" (total)"), e(Tc,null), e(Tc,null), e(Tc,{forte:true, cor:mk>=alvo ? "ok" : "alerta"}, pct0(mk)), e(Tc,null), e(Tc,null));
  return e(Tab,{cols:[e("input",{key:"all", type:"checkbox", checked:todasMarcadas, onChange:function(){ se[1](todasMarcadas ? [] : vis.filter(function(l){ return !l.enviado; }).map(function(l){ return l.id; })); }, "aria-label":"Marcar todas as peças da lista", className:"size-3.5 cursor-pointer accent-[#3B82F6]"}),
    "Fornecedor", "Código", "Qtd", "Bruto", "Peso", "Banho", "Fixo", "Pedra %", "Custo un.", "Sugerido", "Preço", "Markup", "Chat", ""], className:"text-[12px]"}, corpo, rodape);
}
export { AbaCalculadora };
