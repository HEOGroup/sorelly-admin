// Sorelly Admin · montagem — pages/producao/ProdEditorDia.js
// Produção › JANELA DE LANÇAMENTO (abre ao clicar num número da grade, no total de um dia ou em Adicionar lançamento): edita os lançamentos de UM dia.
// Marcus, 16/11/2026: "essa parte de fazer lançamento precisa melhorar, não existe adicionar linha". Agora: (1) a barra de cima da janela tem Adicionar linha (antes ficava embaixo, fora da tela quando o dia tinha muitas linhas),
// o dia (setas e data, qualquer dia do mês, inclusive os que ainda não têm lançamento) e a funcionária (uma ou todas); (2) a linha nova entra NO TOPO com o cursor na primeira caixa; (3) ao digitar um código que já foi
// lançado antes, a unidade e o valor da peça aparecem sozinhos; (4) campos com caixa visível (alterar = clicar e digitar, salva sozinho) e Remover é um botão em cada linha (pede confirmação se já tem quantidade).
// Uma linha = um tipo de peça (código, unidade, quantidade e valor da peça). Salvamento automático 600 ms depois de editar (remover salva na hora); o dia inteiro é regravado, então as linhas das outras funcionárias ficam
// como estavam. O dia só é salvo depois de carregado (nunca apaga o dia por engano). Linha vazia nunca é salva.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROTULO_UNIDADE, diaAbertoFuncionaria, UNIDADES, categoriaDaLinha, diaAnterior, diaDaSemana, diaSeguinte, formatarDia, formatarInteiro, formatarReais, hojeSP, ehExterna, limparLinhas, nomesParaLancamento, precoPorCodigo, resumoDoDia, travadasDoDia, valorLinha } from "@/apps/montagem/domain/producao";
import { nomesProducaoRh, padronizarNome } from "@/apps/montagem/domain/producao-nomes";
import { BtFaixa, CAMPO_FAIXA, FaixaAzul, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useEffect, useRef, useState } from "@/shared/react";

var seq = 0;
var comChave = function(ls){ return (ls||[]).map(function(l){ return Object.assign({k:"l"+(++seq)}, l); }); };
var semChave = function(ls){ return ls.map(function(l){ return {func:l.func, codigo:l.codigo, qtd:l.qtd, valor:l.valor, unidade:l.unidade}; }); };   // "novo" e "k" nunca vão para o servidor
var cap = function(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; };
var igual = function(a, b){ return String(a || "").trim().toLowerCase()===String(b || "").trim().toLowerCase(); };
// fundo em degradê (Marcus, 18/11/2026): as células da tabela ficam transparentes para o degradê aparecer; letra 11 px e linha de 30 px (compacto)
var GRADE_DEGRADE = "[--border:rgba(255,255,255,.14)] [--color-border:rgba(255,255,255,.14)] [&_table]:!text-[11px] [&_tbody_td]:!bg-transparent [&_tbody_td]:!py-0 [&_tfoot_td]:!bg-black/30 [&_span.pointer-events-none.absolute.bg-white]:hidden";
var CEL = "h-[22px] w-full min-w-0 rounded-md border border-border bg-transparent px-2 text-center text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-primary";

// linhas do dia para abrir a janela: se pediu linha nova, ou se a pessoa (ou o dia) ainda não tem nada, já vem uma linha vazia no topo para digitar
function abrirLinhas(pr, dia, func, nova, restrito){
  var ls = comChave(pr.lancamentos[dia]).filter(function(l){ return !restrito || (l.unidade!=="CASA" && !ehExterna(l.func)); }), tem = func ? ls.some(function(l){ return igual(l.func, func); }) : ls.length>0;
  // funcionária (não é da Diretoria): só abre linha nova se escolheu a funcionária e o dia dela ainda não foi lançado; dia lançado fica travado
  if(restrito) return func && !travadasDoDia(pr, dia)[String(func).trim().toLowerCase()] ? ls.concat(comChave([{func:func, codigo:"", qtd:0, valor:0, unidade:"SORELLY", novo:true}])) : ls;
  return nova ? ls.concat(comChave([{func:func || "", codigo:"", qtd:0, valor:0, unidade:"SORELLY", novo:true}])) : ls;   // Diretoria: nada de linha vazia sozinha; só com + Adicionar linha
}

function EditorDia(p){
  var x = usePr(), pr = x.pr;
  var restrito = !x.admin;   // funcionária: lança de UMA funcionária (código e quantidade), o preço vem sozinho, "Lançar" trava o dia dela; só a Diretoria corrige (18/11/2026)
  var st = useState(function(){ return {dia:p.dia, func:p.func || "", linhas:abrirLinhas(pr, p.dia, p.func || "", !!p.nova, !x.admin), carregado:true}; }), ed = st[0];
  var sEd = useState({}), edK = sEd[0];   // linhas gravadas que a Diretoria abriu para editar (botão Editar)
  var sSalvo = useState(""), sCopia = useState(false), sUn = useState(""), unid = sUn[0];   // unidade escolhida UMA vez para todas as linhas do lançamento (funcionária)
  var timer = useRef(null), pend = useRef(null), execRef = useRef(x.exec);
  execRef.current = x.exec;

  var gravar = function(q){ execRef.current("dia_salvar", {dia:q.dia, linhas:semChave(q.linhas)}); sSalvo[1]("salvo"); };
  var descarregar = function(){ if(timer.current){ clearTimeout(timer.current); timer.current = null; } if(pend.current){ var q = pend.current; pend.current = null; gravar(q); } };
  useEffect(function(){ return function(){ if(timer.current){ clearTimeout(timer.current); timer.current = null; } if(pend.current){ var q = pend.current; pend.current = null; execRef.current("dia_salvar", {dia:q.dia, linhas:semChave(q.linhas)}); } }; }, []);
  var agendar = function(linhas, imediato){
    if(!ed.carregado || restrito) return;   // funcionária não salva sozinha: só com o botão Lançar
    pend.current = {dia:ed.dia, linhas:linhas}; sSalvo[1]("pendente");
    if(timer.current){ clearTimeout(timer.current); timer.current = null; }
    if(imediato) descarregar(); else timer.current = setTimeout(descarregar, 600);
  };
  var mudar = function(linhas, imediato){ st[1](Object.assign({}, ed, {linhas:linhas})); agendar(linhas, imediato); };
  var edita = function(k, campos){ mudar(ed.linhas.map(function(l){ return l.k===k ? Object.assign({}, l, campos) : l; })); };
  var remove = function(l){ if((Number(l.qtd) || 0)>0 && !window.confirm("Remover esta linha? ("+(l.func || "sem nome")+", "+(l.codigo || "sem código")+", "+formatarInteiro(l.qtd)+" peças)")) return; mudar(ed.linhas.filter(function(o){ return o.k!==l.k; }), true); };
  var visiveis = ed.linhas.filter(function(l){ return restrito ? !!ed.func && igual(l.func, ed.func) : (!ed.func || igual(l.func, ed.func)); });
  var diaFechado = restrito && !diaAbertoFuncionaria(ed.dia, hojeSP());   // dia antigo: só a Diretoria mexe
  var travado = restrito && (diaFechado || (!!ed.func && !!travadasDoDia(pr, ed.dia)[String(ed.func).trim().toLowerCase()]));   // dia dessa funcionária já lançado
  var escolhe = function(n){ st[1](Object.assign({}, ed, {func:n, linhas:restrito ? abrirLinhas(pr, ed.dia, n, false, true) : ed.linhas})); };
  var precos = restrito ? precoPorCodigo(pr) : null;
  var novasValidas = restrito ? ed.linhas.filter(function(l){ return l.novo && igual(l.func, ed.func) && l.codigo && Number(l.qtd)>0; }) : [];
  var podeLancar = !travado && !!unid && novasValidas.length>0;
  var lancar = function(){
    if(!novasValidas.length) return;
    var tot = novasValidas.reduce(function(t, l){ return t+(Number(l.qtd) || 0); }, 0);
    if(!window.confirm("Lançar "+formatarInteiro(tot)+" peças de "+ed.func+" no dia "+formatarDia(ed.dia)+"?\n\nDepois de lançar o dia não pode mais ser alterado. Se errar, peça a correção ao Marcus.")) return;
    var vazias = ed.linhas.filter(function(l){ return l.novo && !novasValidas.some(function(v){ return v.k===l.k; }); });
    var final = ed.linhas.filter(function(l){ return vazias.indexOf(l)<0; }).map(function(l){ return l.novo ? Object.assign({}, l, {unidade:unid}) : l; });
    if(execRef.current("dia_salvar", {dia:ed.dia, linhas:semChave(final)})) p.aoFechar();
    else window.alert("Não foi possível lançar. Confira se o dia dessa funcionária já foi lançado.");
  };
  var copia = function(t){ var ok = function(){ sCopia[1](true); setTimeout(function(){ sCopia[1](false); }, 1800); }; try{ navigator.clipboard.writeText(t).then(ok, function(){ fallback(t); ok(); }); }catch(er){ fallback(t); ok(); } };
  var pedirCorrecao = function(){
    var feitas = (pr.lancamentos[ed.dia] || []).filter(function(l){ return igual(l.func, ed.func) && l.unidade!=="CASA"; });
    copia(["⚠️ *Correção de produção*", "", "Dia: "+formatarDia(ed.dia), "Funcionária: "+ed.func, "", "*Lançado:*"].concat(feitas.map(function(l){ return "• "+l.codigo+" — "+formatarInteiro(l.qtd)+" peças"; }), ["", "O que está errado: "]).join("\n"));
  };
  // linha nova NO TOPO, já com o cursor na primeira caixa; repete a unidade da linha de cima
  var adiciona = function(){ if(restrito && (!ed.func || travado)) return; var u =visiveis.length ? visiveis[0] : null; st[1](Object.assign({}, ed, {linhas:ed.linhas.concat(comChave([{func:ed.func || "", codigo:"", qtd:0, valor:0, unidade:u ? u.unidade : "SORELLY", novo:true}]))})); };
  // trocar de dia grava o que estava pendente e carrega o dia novo
  var ir = function(dia){ if(!dia || dia===ed.dia) return; descarregar(); sSalvo[1](""); st[1]({dia:dia, func:ed.func, linhas:abrirLinhas(pr, dia, ed.func, false, !x.admin), carregado:true}); };
  var fechar = function(){ descarregar(); p.aoFechar(); };
  var fecharRef = useRef(fechar); fecharRef.current = fechar;
  useEffect(function(){ var h = function(ev){ if(ev.key==="Escape") fecharRef.current(); }; window.addEventListener("keydown", h); return function(){ window.removeEventListener("keydown", h); }; }, []);

  // último valor e unidade de cada código já lançado (do dia mais antigo para o mais novo, o último vence): ao digitar o código, a linha se completa sozinha
  var ultimos = {}, uso = {};
  Object.keys(pr.lancamentos).sort().forEach(function(d){ (pr.lancamentos[d] || []).forEach(function(l){ if(l.codigo){ uso[l.codigo] = (uso[l.codigo] || 0)+1; if(Number(l.valor)>0) ultimos[l.codigo] = {valor:l.valor, unidade:l.unidade}; } }); });
  var codigos = Object.keys(uso).sort(function(a, b){ return uso[b]-uso[a]; }).slice(0, 300);

  // texto do WhatsApp com o que está na tela (sem esperar o salvamento)
  var ls = {}; Object.keys(pr.lancamentos).forEach(function(d){ ls[d] = pr.lancamentos[d]; });
  var limpas = limparLinhas(semChave(ed.linhas)); if(limpas.length) ls[ed.dia] = limpas; else delete ls[ed.dia];
  var rs = resumoDoDia(Object.assign({}, pr, {lancamentos:ls}), ed.dia, null), a = rs.agg;
  var fallback = function(t){ try{ var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }catch(er){} };
  var copiar = function(){
    var t = rs.texto, ok = function(){ sCopia[1](true); setTimeout(function(){ sCopia[1](false); }, 1800); };
    try{ navigator.clipboard.writeText(t).then(ok, function(){ fallback(t); ok(); }); }catch(er){ fallback(t); ok(); }
  };

  var linhasTab = visiveis.map(function(l){
    var cat = categoriaDaLinha(pr, l.codigo);
    return {k:l.k, l:l, func:l.func, codigo:l.codigo, unidade:ROTULO_UNIDADE[l.unidade] || l.unidade, qtd:l.qtd, valor:l.valor, cat:l.codigo ? (cat.desconhecida ? "Sem categoria" : cat.rotulo) : "—", ruim:!!(l.codigo && cat.desconhecida), total:valorLinha(l)};
  });
  var porNome = !ed.func;   // com uma funcionária escolhida, a coluna do nome some (já se sabe quem é)
  // linha gravada = texto; só vira campo quando a Diretoria clica em Editar. Linha nova (+ Adicionar linha) já nasce em campo. Funcionária nunca edita linha gravada: pede ao Marcus.
  var campo = function(r){ return !!r.l.novo || (!restrito && !!edK[r.l.k]); };
  var texto = function(t, aviso){ return e("span",{className:"tabular-nums"+(aviso ? " text-warning" : "")}, t); };
  var cols = (porNome && !restrito ? [{k:"func", t:"Funcionária", render:function(v, r){ if(!campo(r)) return texto(r.l.func); return e("input",{list:"prod-nomes", value:r.l.func, placeholder:"Funcionária", "aria-label":"Funcionária", autoFocus:!!r.l.novo, onChange:function(ev){ edita(r.k, {func:ev.target.value}); }, onBlur:function(ev){ var n = padronizarNome(x.s, ev.target.value); if(n!==ev.target.value) edita(r.k, {func:n}); }, className:CEL}); }}] : []).concat([
    {k:"codigo", t:"Código", render:function(v, r){ if(!campo(r)) return texto(r.l.codigo); return e("input",{list:"prod-codigos", value:r.l.codigo, placeholder:"Código", "aria-label":"Código", autoFocus:!porNome && !!r.l.novo, onChange:function(ev){ var cod = ev.target.value.toUpperCase(), ref = restrito ? precos[cod] : ultimos[cod], campos = {codigo:cod}; if(restrito){ campos.valor = ref ? ref.valor : 0; if(ref) campos.unidade = ref.unidade || r.l.unidade; } else if(ref && !(Number(r.l.valor)>0)){ campos.valor = ref.valor; campos.unidade = ref.unidade || r.l.unidade; } edita(r.k, campos); }, className:CEL+" tabular-nums"}); }},
    {k:"unidade", t:"Unidade", w:"7rem", render:function(v, r){ if(!campo(r)) return texto(ROTULO_UNIDADE[r.l.unidade] || r.l.unidade); return e("select",{value:r.l.unidade, "aria-label":"Unidade", onChange:function(ev){ edita(r.k, {unidade:ev.target.value}); }, className:CEL+" cursor-pointer"}, UNIDADES.filter(function(u){ return x.admin || u!=="CASA"; }).map(function(u){ return e("option",{key:u, value:u}, ROTULO_UNIDADE[u]); })); }},
    {k:"qtd", t:"Quantidade", render:function(v, r){ if(!campo(r)) return texto(formatarInteiro(r.l.qtd || 0)); return e("input",{type:"number", min:0, inputMode:"numeric", value:r.l.qtd || "", placeholder:"Qtd.", "aria-label":"Quantidade", onChange:function(ev){ edita(r.k, {qtd:Math.max(0, parseInt(ev.target.value, 10) || 0)}); }, onKeyDown:function(ev){ if(ev.key==="Enter" && restrito && r.l.codigo && Number(r.l.qtd)>0) adiciona(); }, className:CEL+" tabular-nums"}); }},
    {k:"valor", t:"Valor unitário", render:function(v, r){ var sem = !!r.l.codigo && !(Number(r.l.valor)>0); if(restrito || !campo(r)) return texto(sem ? "Sem preço" : formatarReais(r.l.valor || 0), sem); return e(Dinheiro,{value:r.l.valor || 0, label:"Valor unitário", className:"w-full h-[22px]! text-[11px]!", onChange:function(nv){ edita(r.k, {valor:nv || 0}); }}); }},
    {k:"total", t:"Valor", fmt:formatarReais},
    {k:"x", t:"Ação", render:function(v, r){
      var bt = "h-[22px] rounded-md border border-border px-3 text-[11px] font-semibold hover:bg-white/10";
      if(restrito && !r.l.novo) return e("span",{className:"text-[11px]"}, "Lançado");
      if(!r.l.novo && !edK[r.l.k]) return e("button",{type:"button", onClick:function(){ var o = Object.assign({}, edK); o[r.l.k] = true; sEd[1](o); }, "aria-label":"Editar linha", className:bt}, "Editar");
      return e("span",{className:"inline-flex gap-1"},
        !r.l.novo && e("button",{type:"button", onClick:function(){ var o = Object.assign({}, edK); delete o[r.l.k]; sEd[1](o); }, "aria-label":"Concluir edição", className:bt}, "Pronto"),
        e("button",{type:"button", onClick:function(){ remove(r.l); }, "aria-label":"Remover linha", className:bt+" hover:text-destructive"}, "Remover")); }}
  ]);
  if(restrito) cols = cols.filter(function(c){ return c.k!=="unidade"; });   // a unidade vem do código (último lançamento); a funcionária só digita código e quantidade
  var iq = cols.findIndex(function(c){ return c.k==="qtd"; }), iv = cols.findIndex(function(c){ return c.k==="total"; });
  var totalRodape = function(l2){ return cols.map(function(c, i){ return i===0 ? "TOTAL · "+l2.length : i===iq ? formatarInteiro(l2.reduce(function(t, r){ return t+(Number(r.qtd) || 0); }, 0)) : i===iv ? formatarReais(l2.reduce(function(t, r){ return t+r.total; }, 0)) : ""; }); };
  var status = restrito ? (diaFechado ? "Dia travado" : travado ? "Lançado e travado" : "Rascunho") : sSalvo[0]==="pendente" ? "Salvando" : sSalvo[0]==="salvo" ? "Salvo" : "Salvamento automático";
  // quem aparece na lista de funcionárias: o cadastro e quem já tem linha no dia
  var nomes = nomesProducaoRh(x.s).slice(); nomesParaLancamento(pr).concat(ed.linhas.map(function(l){ return l.func; })).forEach(function(n){ if(n && !nomes.some(function(m){ return igual(m, n); })) nomes.push(n); });
  if(!x.admin) nomes = nomes.filter(function(n){ return !ehExterna(n); });   // nomes do RH (setor Produção) primeiro; depois quem já está no cadastro ou na tela

  // MESMO VISUAL da tela Produção (Marcus, 16/11/2026: "fontes mais padronizadas, as cores"): barra azul de título, faixa azul de controles com os mesmos campos e botões, tabela de 13 px.
  var branco = " bg-white !text-[#14233f] hover:!bg-white/90";
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-3", onClick:fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, style:{background:"linear-gradient(160deg,#22396b 0%,#16264a 42%,#0c1428 100%)"}, className:PADRAO_BLOCOS+" flex max-h-[92vh] w-full max-w-5xl flex-col overflow-y-auto rounded-lg border border-white/15 shadow-2xl"},
      e("div",{className:GRADE_DEGRADE},
      e(BlocoPainel,{titulo:"Lançamento da produção", dir:formatarDia(ed.dia)+" · "+cap(diaDaSemana(ed.dia))+" · "+status},
        e(FaixaAzul,null,
          e(BtFaixa,{titulo:"Dia anterior", onClick:function(){ ir(diaAnterior(ed.dia)); }}, "‹"),
          e("input",{type:"date", value:ed.dia, "aria-label":"Dia", onChange:function(ev){ ir(ev.target.value); }, className:CAMPO_FAIXA}),
          e(BtFaixa,{titulo:"Próximo dia", onClick:function(){ ir(diaSeguinte(ed.dia)); }}, "›"),
          e(BtFaixa,{disabled:ed.dia===hojeSP(), onClick:function(){ ir(hojeSP()); }}, "Hoje"),
          e("select",{value:ed.func, "aria-label":"Funcionária", onChange:function(ev){ if(restrito) escolhe(ev.target.value); else st[1](Object.assign({}, ed, {func:ev.target.value})); }, className:CAMPO_FAIXA+" w-56 cursor-pointer"},
            e("option",{value:""}, restrito ? "Escolha a funcionária" : "Todas as funcionárias"), nomes.map(function(n){ return e("option",{key:n, value:n}, n); })),
          restrito && e("select",{value:unid, "aria-label":"Unidade", disabled:travado, onChange:function(ev){ sUn[1](ev.target.value); }, className:CAMPO_FAIXA+" w-36 cursor-pointer"},
            e("option",{value:""}, "Unidade"), UNIDADES.filter(function(u){ return u!=="CASA"; }).map(function(u){ return e("option",{key:u, value:u}, ROTULO_UNIDADE[u]); })),
          e(BtFaixa,{className:branco, disabled:restrito && (!ed.func || travado), titulo:"Põe uma linha nova no fim da lista", onClick:adiciona}, "+ Adicionar linha"),
          restrito && e(BtFaixa,{className:branco, disabled:!podeLancar, titulo:"Lança o dia dessa funcionária. Depois de lançar, não dá para alterar", onClick:lancar}, "Lançar"),
          restrito && travado && !!ed.func && e(BtFaixa,{titulo:"Copia o pedido de correção para você mandar ao Marcus", onClick:pedirCorrecao}, sCopia[0] ? "Copiado, envie ao Marcus" : "Pedir correção"),
          e("span",{className:"flex-1"}),
          e(BtFaixa,{disabled:!a.pecas && !a.valor, onClick:copiar}, sCopia[0] ? "Copiado" : "Copiar resumo do dia"),
          e(BtFaixa,{onClick:fechar}, "Fechar")),
        e("datalist",{id:"prod-nomes"}, nomes.map(function(n){ return e("option",{key:n, value:n}); })),
        e("datalist",{id:"prod-codigos"}, codigos.map(function(c){ return e("option",{key:c, value:c}); })),
        e(TabelaPlanilha,{key:"ed"+(ed.func ? "f" : "t"), fina:true, cols:cols, linhas:linhasTab, chave:"k", grade:true, compacta:true, barraFina:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:restrito && !ed.func ? "Escolha a funcionária." : "Nenhum lançamento neste dia. Clique em + Adicionar linha."})))));
}
export { EditorDia };
