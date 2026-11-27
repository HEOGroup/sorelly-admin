// Sorelly Admin — mobile/conf-devolucao.js
// Bipagem das peças que VOLTAM no acerto (Marcus, 24/11/2026: "selecionei as condicionais e não abre para começar a bipar"). A representante marca as condicionais da revendedora
// na calculadora de acertos; aqui elas viram UM kit só (as condicionais formam um kit inteiro): lista de todas as peças que saíram, câmera para bipar a etiqueta de cada uma
// que voltou, campo para digitar o código quando a etiqueta não lê. O que não voltou é o que a revendedora vendeu. O resultado fica no acerto (acertoForm.devolucaoBip);
// nada é gravado como erro de ninguém aqui: peça de fora só fica registrada. As peças vêm da DevMaster (rota /representante/condicionais, com o número de barras).
import { bipar, descBonita, itensDe, totaisDe, totaisKit, unir } from "@/apps/montagem/domain/conferencia-pecas";
import { FAIXAS_OFICIAIS } from "@/apps/montagem/domain/consignado";
import { chamar } from "@/apps/montagem/lib/api";
import { LeitorCamera } from "@/apps/montagem/mobile/leitor-camera";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

var dataBR = function(iso){ return iso ? String(iso).split("-").reverse().join("/") : ""; };
var BR = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var BTN = "h-12 w-full rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco disabled:opacity-40";
var CARD = "rounded-2xl bg-white p-3 ring-1 ring-[#E5E7EB]";
// linha padrão da tela: rótulo à esquerda, valor à direita, uma linha só, separadas por um fio; usada no topo e no resumo de baixo
var linha = function(rot, val, i, forte){ return e("div",{key:rot, className:"flex h-11 items-center justify-between gap-3 text-[13px] text-[#111827] "+(i ? "border-t border-[#E5E7EB]" : "")}, e("span",{className:"whitespace-nowrap"}, rot), e("b",{className:MONO+" whitespace-nowrap text-right text-[16px] "+(forte||"")}, val)); };
// comissão da faixa (régua do Kit Padrão) para o valor vendido
var faixaDe = function(v){ var f = null; FAIXAS_OFICIAIS.forEach(function(x){ if(v>=x.min) f = x; }); return f ? f.pct : 0; };

function ConfDevolucao(p){
  var es = useState(p.pre ? {est:"ok", msg:"", todas:p.pre, conds:[]} : {est:"carregando", msg:"", conds:[]}), carga = es[0], setCarga = es[1];
  // confirmou = condicionais confirmadas (etapa de bipagem). Gravado junto da bipagem; sem o campo (acertos antigos), vale se já há bipagem.
  var cf = useState(function(){ var i0 = p.inicial || {}; return Object.assign({}, i0, {confirmou: i0.confirmou!==undefined ? !!i0.confirmou : !!(Object.keys(i0.lidos||{}).length || i0.resumo)}); }), conf = cf[0], setConf = cf[1];
  var cm = useState(true), camera = cm[0], setCamera = cm[1];
  var cd = useState(""), codigo = cd[0], setCodigo = cd[1];
  var cfm = useState(false), confirma = cfm[0], setConfirma = cfm[1], jaFim = React.useRef(false);   // modal Concluir bipagem e trava de conclusão dupla
  var ab = useState(null), aberta = ab[0], setAberta = ab[1];
  var nt = useState(0), tentativa = nt[0], setTentativa = nt[1];
   // alerta de baixo: peça que NÃO é das condicionais marcadas (e o histórico dela com esta revendedora)
   // o bloco de baixo da câmera troca sozinho a cada peça
  var fl = useState("todas"), fil = fl[0], setFil = fl[1];   // filtro da conferência: todas | vendidas | devolvidas
  var fc = useState({}), fechados = fc[0], setFechados = fc[1];   // categorias recolhidas
  var listaRef = React.useRef(null);
  useEffect(function(){ if(listaRef.current) listaRef.current.scrollTop = 0; }, [fil]);   // trocar Todas/Vendidas/Devolvidas volta ao início da lista
  var dc = useState(""), descAberta = dc[0], setDescAberta = dc[1];   // peça da lista com a descrição aberta
  useEffect(function(){
    if(p.pre && !tentativa) return;   // já veio carregada pela calculadora: não consulta de novo
    var vivo = true; setCarga({est:"carregando", msg:"", conds:[]});
    chamar("GET", "/representante/condicionais?cod="+encodeURIComponent(p.cod)).then(function(r){
      if(!vivo) return;
      setCarga({est:"ok", msg:"", todas:r.condicionais || [], conds:[]});
    }).catch(function(x){ if(vivo) setCarga({est:"erro", msg:(x && x.message) || "Não consegui buscar as peças na DevMaster.", conds:[]}); });
    return function(){ vivo = false; };
  }, [p.cod, tentativa]);   // eslint-disable-line react-hooks/exhaustive-deps
  var conds = React.useMemo(function(){ return (carga.todas||[]).filter(function(c){ return (p.numeros||[]).indexOf(c.numero)>=0; }).map(unir); }, [carga.todas, (p.numeros||[]).join(",")]), tot = totaisKit(conds);   // eslint-disable-line react-hooks/exhaustive-deps
  // mesma peça em duas linhas vira um item só (unir, 25/11/2026). A seleção das condicionais vem do acerto (p.numeros): fonte única.
  var fm = useState(false), formAberto = fm[0], setFormAberto = fm[1], mn = useState({numero:"", pecas:""}), man = mn[0], setMan = mn[1], av = useState(""), aviso = av[0], setAviso = av[1];
  var alternarCond = function(n){ var on = (p.numeros||[]).indexOf(n)>=0; if(on && Object.keys(conf.lidos||{}).some(function(k){ return k.indexOf(n+"|")===0 && (conf.lidos[k]||0)>0; })){ setAviso("A condicional "+n+" já tem peças bipadas. Desmarque as peças antes de retirá-la."); return; } setAviso(""); p.aoAlternar(n); };
  var lido = function(c, i){ return Math.min(i.qtd, (conf.lidos||{})[c.numero+"|"+i.codigo]||0); };
  var voltaram = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+lido(c, i); }, 0); }, 0);
  var vendidas = tot.pecas-voltaram;
  var valorVendido = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+(i.qtd-lido(c, i))*i.valor; }, 0); }, 0);
  var guardar = function(novo){ setConf(novo); p.aoSalvar({lidos:novo.lidos||{}, erros:novo.erros||[], hist:novo.hist||[], maleta:!!novo.maleta, confirmou:!!novo.confirmou, ultimo:null}); };
  var ler = function(c0){
    if(!conds.length) return;
    var antes = JSON.stringify((conf.lidos)||{}), novo = bipar(conds, conf, c0);
    if(JSON.stringify(novo.lidos||{})!==antes){   // contou uma peça nova: guarda a chave dela para o "Desfazer"
      var chave = Object.keys(novo.lidos).find(function(k){ return (novo.lidos[k]||0)!==((conf.lidos||{})[k]||0); });
      novo = Object.assign({}, novo, {hist:(conf.hist||[]).concat([chave])});
    }
    guardar(novo);
  };
  // Materiais MP (Suporte, grupo 08) e MU (Material de uso geral, grupo 14) não geram comissão: não devolvidos são cobrados inteiros e somados ao acerto.
  var ehMat = function(i){ return /^(MP|MU)/i.test(String(i.codigo||"")); };
  var valorMat = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+(ehMat(i) ? (i.qtd-lido(c, i))*i.valor : 0); }, 0); }, 0), valorSemi = valorVendido-valorMat;
  var pctCom = faixaDe(valorSemi), comissao = valorSemi*pctCom/100, valorAcerto = valorSemi-comissao+valorMat;
  if(carga.est==="carregando") return null;   // sem banner: a calculadora já espera os dados antes de abrir esta tela
  if(carga.est!=="ok") return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"rounded-xl bg-[#FEE2E2] px-3 py-2 text-[13px] font-bold text-[#991B1B]"}, carga.msg),
    e("button",{onClick:function(){ setTentativa(tentativa+1); }, className:BTN},"Tentar de novo"),
    e("button",{onClick:p.aoVoltar, className:"h-10 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-[#374151]"},"Voltar ao acerto"));
  var cel = function(rot, val, cor){ return e("div",{key:rot, className:"flex flex-col items-center justify-center py-1.5"}, e("span",{className:"text-[11px] text-[#374151]"}, rot), e("b",{className:"text-[13px] font-semibold "+(cor||"text-[#111827]")}, val)); };
  var divisao = function(t){ return e("div",{className:"flex items-center gap-2"}, e("span",{className:"h-px flex-1 bg-[#C9A13B]/60"}), e("span",{className:"text-[11px] text-[#8A6A12]"}, t), e("span",{className:"h-px flex-1 bg-[#C9A13B]/60"})); };
  var celB = function(rot, val, cor){ return e("div",{key:rot, className:"flex min-w-0 flex-col items-center justify-center bg-white py-1 text-center"}, e("span",{className:"text-[11px] text-[#374151]"}, rot), e("b",{className:"text-[13px] font-semibold "+(cor||"text-[#111827]")}, val)); };
  var concluir = function(){ if(jaFim.current) return; jaFim.current = true;   // uma conclusão só: toque duplo não grava duas vezes
    try{ p.aoSalvar({lidos:conf.lidos||{}, erros:conf.erros||[], hist:conf.hist||[], maleta:!!conf.maleta, confirmou:true, ultimo:null, resumo:{voltaram:voltaram, saiu:tot.pecas, vendidas:vendidas, valorVendido:Math.round(valorSemi*100)/100, materiais:Math.round(valorMat*100)/100, conds:conds.map(function(c){ return c.numero; }), em:Date.now()}}); p.aoVoltar(); }catch(x){ jaFim.current = false; setConfirma(false); } };
  var pares = function(a){ var o = []; for(var k = 0; k<a.length; k += 2) o.push(a.slice(k, k+2)); return o; };
  var alternar = function(i, ok, l, ch){ if(ok){ var l2 = Object.assign({}, conf.lidos); delete l2[ch]; guardar(Object.assign({}, conf, {lidos:l2, hist:(conf.hist||[]).filter(function(k){ return k!==ch; }), ultimo:null})); return; } var falta = i.qtd-l, h = (conf.hist||[]).slice(), lid = Object.assign({}, conf.lidos); for(var q = 0; q<falta; q++) h.push(ch); lid[ch] = i.qtd; guardar(Object.assign({}, conf, {lidos:lid, hist:h, ultimo:null})); };
  // Lista unificada (só apresentação): cada categoria aparece uma vez; cada peça guarda a condicional de origem (chave numero|codigo).
  var cats = [], ixc = {};
  conds.forEach(function(c){ c.grupos.forEach(function(g){ if(!(g.cod in ixc)){ ixc[g.cod] = cats.length; cats.push({cod:g.cod, nome:g.nome, its:[]}); } g.itens.forEach(function(i){ cats[ixc[g.cod]].its.push({c:c, i:i}); }); }); });
  // Suporte (08) e Material de uso geral (14), códigos oficiais da DevMaster, vão para o fim; o resto mantém a ordem recebida
  cats = cats.map(function(g, k){ return {g:g, k:k+((g.cod==="08" || g.cod==="14") ? 1000 : 0)}; }).sort(function(a, b){ return a.k-b.k; }).map(function(x){ return x.g; });
  var vis = cats.map(function(g){ return {cod:g.cod, nome:g.nome, all:g.its, its:g.its.filter(function(x){ var l = lido(x.c, x.i); return fil==="devolvidas" ? l>0 : fil==="vendidas" ? l<x.i.qtd : true; })}; }).filter(function(g){ return g.its.length; });
  var conf0 = !!conf.confirmou, BT = "flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg text-center text-[13px] font-semibold disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]";
  return e("div",{className:"flex h-full min-h-0 flex-col gap-1.5"},
    e("div",{className:"flex max-h-[75%] shrink-0 flex-col gap-1.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"},
    conf0 ? (function(){ var ns = p.numeros||[], pc = function(num){ var d = (p.disponiveis||[]).filter(function(x){ return x.numero===num; })[0], c = conds.filter(function(x){ return x.numero===num; })[0]; return c ? totaisDe(c).pecas : (d ? d.pecas : 0); };
      return e("div",{className:"flex flex-col border border-[#C9A13B]/60 bg-white"},
        e("p",{className:"flex min-h-8 items-center justify-center bg-[#F8F3E8] px-3 text-center text-[18px] font-semibold text-[#5B4410]"}, p.rev || ""),
        e("div",{className:"grid grid-cols-3 gap-px border-t border-[#E4D3A3] bg-[#E4D3A3]"}, celB("Vendeu", BR(valorSemi)), celB("Comissão · "+pctCom+"%", BR(comissao)), celB("Valor do acerto", BR(valorAcerto), "text-[#8A6A12]")),
        e("div",{className:"flex h-7 items-center justify-between border-t border-[#E4D3A3] bg-[#F3EAD3] px-3"}, e("span",{className:"text-[13px] text-[#8A6A12]"},"Condicionais do acerto"), e("button",{type:"button", onClick:function(){ setCamera(false); setAviso(""); guardar(Object.assign({}, conf, {confirmou:false})); }, className:"text-[13px] text-[#8A6A12]"},"Editar")),
        e("div",{className:"grid grid-cols-3 gap-px border-t border-[#E4D3A3] bg-[#E4D3A3]"},
          e("div",{key:"tot", style:{gridColumn:3, gridRow:"1 / span "+Math.max(1, Math.ceil(ns.length/2))}, className:"flex min-w-0 items-center justify-between gap-2 bg-[#F8F3E8] px-3 text-[13px]"}, e("span",{className:"text-[#111827]"},"Total"), e("span",{className:"text-[#8A6A12]"}, tot.pecas)),
          ns.map(function(num){ return e("div",{key:num, className:"flex h-9 min-w-0 items-center justify-between gap-2 bg-white px-3 text-[13px]"}, e("span",{className:"text-[#111827]"}, num), e("span",{className:"text-[#8A6A12]"}, pc(num))); }), ns.length%2===1 && e("div",{key:"vz", className:"bg-white"})),
        e("div",{className:"border-t border-[#E4D3A3] p-1.5"}, e("button",{type:"button", onClick:function(){ setFil("vendidas"); setConfirma(true); }, className:BT+" h-9 border border-[#C9A13B] bg-[#F3E9D0] text-[#3B2F0B]"}, "Concluir bipagem")));
    })()
    : e("div",{className:"flex flex-col border-t border-[#C9A13B]/60 bg-white"},
      e("p",{className:"flex h-8 items-center justify-between border-x border-[#C9A13B]/60 bg-[#F3EAD3] px-3 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null,"Condicionais do acerto"), e("span",{className:"font-normal"}, String((p.disponiveis||[]).filter(function(d){ return (p.numeros||[]).indexOf(d.numero)>=0; }).reduce(function(t, d){ return t+(+d.pecas||0); }, 0))+" peças")),
    e("div",{className:"grid grid grid-cols-2 divide-x divide-[#C9A13B]/40 border-x border-b border-[#C9A13B]/60 bg-white"},
      (p.disponiveis||[]).map(function(d){ var on = (p.numeros||[]).indexOf(d.numero)>=0, c = conds.filter(function(x){ return x.numero===d.numero; })[0], its = c ? itensDe(c) : [], feitas = its.reduce(function(t, i){ return t+lido(c, i); }, 0), tp = its.reduce(function(t, i){ return t+i.qtd; }, 0);
        return e("button",{key:d.numero, type:"button", onClick:function(){ alternarCond(d.numero); }, "aria-pressed":on, className:"flex h-8 min-w-0 touch-manipulation items-center gap-2 bg-white px-3 text-left text-[13px] outline-none"},
          e("span",{className:"grid size-4 shrink-0 place-items-center rounded border border-[#C9A13B] text-[11px] font-bold "+(on ? "bg-[#C9A13B] text-white" : "bg-white")}, on ? "✓" : ""),
          e("b",{className:"font-semibold text-[#111827]"}, d.numero),
          e("span",{className:"ml-auto text-[#8A6A12]"}, d.pecas)); })),
      aviso && e("p",{className:"border-x border-[#C9A13B]/60 px-3 py-1 text-[13px] font-semibold text-[#92400E]"}, aviso),
      e("div",{className:"grid grid-cols-2 gap-[6px] border border-t-0 border-[#C9A13B]/60 p-1.5"},
        e("button",{type:"button", onClick:function(){ setFormAberto(!formAberto); }, className:"flex h-8 w-full items-center justify-center rounded-lg border border-[#C9A13B]/70 bg-[#FBF7EC] text-[13px] text-[#8A6A12]"}, "+ Adicionar condicional"),
        e("button",{type:"button", disabled:!(p.numeros||[]).length, onClick:function(){ setAviso(""); setFormAberto(false); guardar(Object.assign({}, conf, {confirmou:true})); }, className:"flex h-8 w-full items-center justify-center rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-[#1F1B0E] disabled:opacity-40"}, "Continuar")),
    formAberto && e("div",{className:"flex items-center gap-1.5"},
      e("input",{value:man.numero, inputMode:"numeric", placeholder:"Código", "aria-label":"Código da condicional", onChange:function(ev){ setMan(Object.assign({}, man, {numero:ev.target.value.replace(/[^0-9]/g,"").slice(0,8)})); }, className:"h-8 min-w-0 flex-1 rounded-lg bg-white px-2 text-[13px] text-[#111827] outline-none ring-1 ring-[#C9A13B]/70"}),
      e("input",{value:man.pecas, inputMode:"numeric", placeholder:"Peças", "aria-label":"Quantidade de peças", onChange:function(ev){ setMan(Object.assign({}, man, {pecas:ev.target.value.replace(/[^0-9]/g,"").slice(0,4)})); }, className:"h-8 w-[4.2rem] shrink-0 rounded-lg bg-white px-2 text-center text-[13px] text-[#111827] outline-none ring-1 ring-[#C9A13B]/70"}),
      e("button",{type:"button", disabled:!man.numero || !(+man.pecas>0), onClick:function(){ p.aoAdicionar(man.numero, +man.pecas); setMan({numero:"", pecas:""}); setFormAberto(false); }, className:"h-8 shrink-0 rounded-lg bg-[#C9A13B] px-3 text-[13px] font-semibold text-[#1F1B0E] disabled:opacity-40"}, "Adicionar"))),
    !conf0 && e("div",{className:"grid grid-cols-3 divide-x divide-[#E8DCC0] border border-[#E8DCC0] bg-white opacity-60"}, cel("Vendeu", BR(valorSemi)), cel("Comissão · "+pctCom+"%", BR(comissao)), cel("Valor do acerto", BR(valorAcerto), "text-[#8A6A12]")),
    divisao("BIPAGEM DE PEÇAS"),
    conf0 && camera && e(LeitorCamera,{aoLer:ler, aoDesligar:function(){ setCamera(false); }}),
    e("form",{onSubmit:function(ev){ ev.preventDefault(); if(!conf0) return; if(codigo.trim()) ler(codigo); setCodigo(""); setTimeout(function(){ var el = document.getElementById("conf-dev-codigo"); if(el) el.focus(); }, 0); }, className:"grid gap-[6px]", style:{gridTemplateColumns:"minmax(0, 2fr) repeat(2, minmax(0, 1fr))"}},
      e("input",{id:"conf-dev-codigo", disabled:!conf0, enterKeyHint:"go", autoComplete:"off", inputMode:"text", value:codigo, onChange:function(ev){ setCodigo(ev.target.value); }, placeholder:"Código da peça", autoCapitalize:"characters", className:"h-10 w-full min-w-0 rounded-lg bg-white px-3 text-left text-[13px] text-[#111827] outline-none border border-[#C9A13B]/70 disabled:bg-[#E5E7EB]"}),
      e("button",{type:"submit", disabled:!conf0, className:BT+" bg-[#C9A13B] text-[#1F1B0E]"},"Bipar"),
      e("button",{type:"button", disabled:!conf0, onClick:function(){ setCamera(!camera); }, "aria-label":camera ? "Desativar câmera" : "Ativar câmera", title:camera ? "Desativar câmera" : "Ativar câmera", className:BT+" bg-[#C9A13B] text-white"}, e("svg",{viewBox:"0 0 24 24", width:16, height:16, fill:"none", stroke:"currentColor", strokeWidth:2, "aria-hidden":true}, e("path",{d:"M4 8h3l2-2h6l2 2h3v11H4z"}), e("circle",{cx:12, cy:13, r:3.5}), camera && e("path",{d:"M3 3l18 18"})))),
    !conf0 && e("p",{className:"text-center text-[11px] text-[#6B7280]"}, "Confirme as condicionais para iniciar."),
    conf0 && (function(u){ if(!u) return null; var ok = u.tipo==="ok", mot = u.tipo==="repetida" ? "Peça já bipada" : "Peça fora destas condicionais";
      return e("div",{className:"flex flex-col gap-0.5 border px-3 py-1.5 text-[13px] "+(ok ? "border-[#16A34A]/50 bg-[#F0FDF4] text-[#15803D]" : "border-[#DC2626]/40 bg-[#FEF2F2] text-[#991B1B]")},
        e("div",{className:"flex items-center justify-between gap-2 font-semibold"}, e("span",{className:"whitespace-nowrap"}, u.codigo), ok || u.valor ? e("span",{className:"whitespace-nowrap"}, BR(u.valor)) : null),
        e("span",{className:"leading-snug"}, ok ? (descBonita(u.desc) || "Sem descrição") : mot+(u.desc ? " · "+descBonita(u.desc) : ""))); })(conf.ultimo),
    confirma && conf0 && e("div",{className:"flex flex-col gap-1.5 border border-[#C9A13B] bg-[#FBF7EC] px-3 py-2 text-[13px] text-[#3B2F0B]", role:"alertdialog"},
      e("b",{className:"font-semibold"}, "Confira as peças vendidas antes de concluir."),
      e("div",{className:"flex items-center justify-between gap-2"}, e("span",null, vendidas+" peças vendidas"), e("b",{className:"whitespace-nowrap font-semibold text-[#8A6A12]"}, BR(valorSemi))),
      valorMat>0 && e("div",{className:"flex items-center justify-between gap-2"}, e("span",null, "Materiais não devolvidos (sem comissão)"), e("b",{className:"whitespace-nowrap font-semibold text-[#8A6A12]"}, BR(valorMat))),
      e("div",{className:"grid grid-cols-2 gap-[6px]"},
        e("button",{type:"button", onClick:function(){ setConfirma(false); setFil("todas"); }, className:"h-10 rounded-lg border border-[#C9A13B] bg-white text-[13px] font-semibold"}, "Voltar à bipagem"),
        e("button",{type:"button", onClick:concluir, className:"h-10 rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-[#1F1B0E]"}, "Confirmar e concluir"))),
    divisao("CONFERÊNCIA DAS PEÇAS"),
    e("div",{className:"flex flex-col border border-[#C9A13B]/60 bg-white"},
      e("div",{className:"grid grid-cols-3 gap-px bg-[#E4D3A3]"}, [["todas","Todas",tot.pecas],["vendidas","Vendidas",vendidas],["devolvidas","Devolvidas",voltaram]].map(function(o){ var on = fil===o[0];
        return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ setFil(o[0]); }, className:"flex flex-col items-center justify-center py-1 text-[13px] leading-tight "+(on ? "bg-[#C9A13B] text-[#1F1B0E]" : "bg-white text-[#8A6A12]")}, e("span",null,o[1]), e("b",{className:"font-semibold"}, String(o[2]))); })),
      e("div",{className:"grid grid-cols-2 gap-[6px] border-t border-[#E4D3A3] p-1.5"}, (function(){ var todos = vis.length>0 && vis.every(function(g){ return fechados[g.cod]; }), K = "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#C9A13B] text-[13px] font-semibold text-[#3B2F0B] disabled:opacity-50";
        return [e("button",{key:"ft", type:"button", disabled:!vis.length, onClick:function(){ var o = Object.assign({}, fechados); vis.forEach(function(g){ if(todos) delete o[g.cod]; else o[g.cod] = true; }); setFechados(o); }, className:K+" bg-white"}, e("svg",{viewBox:"0 0 24 24", width:14, height:14, fill:"none", stroke:"currentColor", strokeWidth:2, "aria-hidden":true}, todos ? e("path",{d:"M6 9l6 6 6-6M6 4l6 6 6-6"}) : e("path",{d:"M6 15l6-6 6 6M6 20l6-6 6 6"})), todos ? "Abrir todos" : "Fechar todos"),
          e("button",{key:"mv", type:"button", "aria-pressed":fil==="vendidas", onClick:function(){ setFil(fil==="vendidas" ? "todas" : "vendidas"); }, className:K+" bg-[#F3E9D0]"}, e("svg",{viewBox:"0 0 24 24", width:14, height:14, fill:"none", stroke:"currentColor", strokeWidth:2, "aria-hidden":true}, e("path",{d:"M4 6h16M4 12h16M4 18h10"})), fil==="vendidas" ? "Mostrar todas" : "Mostrar vendidos")]; })())),
    ),
    e("div",{ref:listaRef, className:"flex min-h-[96px] flex-1 flex-col gap-1.5 overflow-y-auto border border-[#C9A13B]/60 p-1"+(conf0 ? "" : " pointer-events-none opacity-50"), style:{overscrollBehavior:"contain"}},
      vis.map(function(g){ var gf = g.all.reduce(function(t, x){ return t+lido(x.c, x.i); }, 0), gt = g.all.reduce(function(t, x){ return t+x.i.qtd; }, 0), fech = !!fechados[g.cod];
        return e("div",{key:g.cod, className:"flex flex-col border border-[#C9A13B]/50 bg-white"},
          e("button",{type:"button", "aria-expanded":!fech, onClick:function(){ setFechados(function(o){ var n = Object.assign({}, o); if(n[g.cod]) delete n[g.cod]; else n[g.cod] = true; return n; }); }, className:"flex h-8 w-full items-center justify-between bg-[#F3EAD3] px-3 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null,g.nome), e("span",{className:gf===gt ? "text-[#15803D]" : ""}, gf+"/"+gt)),
          !fech && pares(g.its).map(function(par, pi){ var aberto = par.filter(function(x){ return descAberta===x.c.numero+"|"+x.i.codigo; })[0];
            return e("div",{key:"p"+pi, className:"flex flex-col border-t border-[#E8DCC0]"},
              e("div",{className:"grid grid-cols-1 divide-[#E8DCC0] min-[360px]:grid-cols-2 min-[360px]:divide-x"}, par.map(function(x){ var c = x.c, i = x.i, l = lido(c, i), ok = l>=i.qtd, ch = c.numero+"|"+i.codigo, sel = descAberta===ch;
                return e("div",{key:ch, role:"button", tabIndex:0, "aria-expanded":sel, onClick:function(){ setDescAberta(function(a){ return a===ch ? "" : ch; }); }, className:"flex h-10 min-w-0 cursor-pointer touch-manipulation select-none items-center gap-2 px-3 text-left outline-none "+(sel ? "relative z-10 ring-2 ring-inset ring-[#C9A13B] "+(ok ? "bg-[#F0FDF4]" : "bg-[#F8F4EA]") : ok ? "bg-[#F0FDF4]" : l>0 ? "bg-[#FEF9C3]" : "bg-white")},
                  e("button",{type:"button", "aria-pressed":ok, "aria-label":ok ? "Desmarcar peça" : "Marcar peça como devolvida", onClick:function(ev){ ev.stopPropagation(); alternar(i, ok, l, ch); }, className:"-m-2 grid size-8 shrink-0 place-items-center outline-none"}, e("span",{className:"grid size-4 place-items-center rounded-full text-[11px] font-bold "+(ok ? "text-[#16A34A] ring-1 ring-[#16A34A]" : "bg-[#9CA3AF]")}, ok ? "✓" : "")),
                  e("span",{className:"flex min-w-0 items-center gap-1.5 text-[13px] "+(ok ? "text-[#15803D]" : "text-[#111827]")}, i.codigo+(i.qtd>1 ? "  "+l+"/"+i.qtd : "")),
                  e("span",{className:"ml-auto whitespace-nowrap text-[13px] text-[#111827]"}, BR(i.valor))); })),
              aberto && (function(x){ var c = x.c, i = x.i, l = lido(c, i), ok = l>=i.qtd, ch = c.numero+"|"+i.codigo;
                return e("div",{className:"flex flex-col gap-1 border-t border-[#C9A13B]/60 bg-[#F8F4EA] px-3 py-2"},
                  e("div",{className:"flex items-center justify-between gap-2 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null, i.codigo), e("span",null, BR(i.valor))),
                  e("span",{className:"text-[13px] leading-snug text-[#374151]"}, descBonita(i.desc) || "Sem descrição")); })(aberto)); })); })),
    (conf.erros||[]).length>0 && e("div",{className:"flex flex-col gap-1 rounded-lg bg-[#FEF3C7] px-3 py-2"},
      e("b",{className:"text-[13px] text-[#92400E]"},"Peças que não são destas condicionais ("+conf.erros.length+")"), e("span",{className:MONO+" text-[13px] text-[#92400E]"}, conf.erros.map(function(x){ return x.codigo; }).join(", "))));
}

export { ConfDevolucao };
