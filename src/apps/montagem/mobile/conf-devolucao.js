// Sorelly Admin — mobile/conf-devolucao.js
// Bipagem das peças que VOLTAM no acerto. TELA REFEITA em 28/11/2026 (Marcus): sem seleção de condicionais (vêm da calculadora, p.numeros), sem botão Continuar
// e sem valores de venda, comissão e acerto. Fica fixo: nome da revendedora, contadores (Todas, Não devolvidas, Devolvidas), câmera de 190 px (mobile/bip-comum.js, a mesma das outras bipagens) e a linha Código/Bipar/colunas.
// A lista rola no meio e "Concluir bipagem" fica no rodapé fixo. A conferência é gravada no acerto (acertoForm.devolucaoBip) a cada peça: voltar não perde nada.
// As condicionais selecionadas formam UM kit só. O que não voltou foi vendido. Nada é gravado como erro de ninguém: peça de fora só fica registrada.
import { bipar, descBonita, itensDe, totaisKit, unir } from "@/apps/montagem/domain/conferencia-pecas";
import { chamar } from "@/apps/montagem/lib/api";
import { AvisoBip, CameraBipagem, conhecido, indexar, useNomes } from "@/apps/montagem/mobile/bip-comum";
import { bipeOk, bipeErro } from "@/apps/montagem/mobile/leitor-camera";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

var BR = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var BTN = "h-12 w-full rounded-2xl bg-[#C9A13B] text-[14px] font-bold txt-branco disabled:opacity-40";
var BT = "flex h-8 w-full min-w-0 items-center justify-center gap-2 rounded-lg text-center text-[13px] font-semibold disabled:bg-[#E5E7EB] disabled:text-[#9CA3AF]";

function ConfDevolucao(p){
  var es = useState(p.pre ? {est:"ok", msg:"", todas:p.pre, conds:[]} : {est:"carregando", msg:"", conds:[]}), carga = es[0], setCarga = es[1];
  var cf = useState(function(){ return Object.assign({}, p.inicial || {}, {confirmou:true}); }), conf = cf[0], setConf = cf[1];   // sem etapa de confirmar condicionais: já nasce confirmada
  var cd = useState(""), codigo = cd[0], setCodigo = cd[1];
  var cfm = useState(false), confirma = cfm[0], setConfirma = cfm[1], jaFim = React.useRef(false);   // confirmação de Concluir bipagem e trava de conclusão dupla
  var nt = useState(0), tentativa = nt[0], setTentativa = nt[1];
  var fl = useState("todas"), fil = fl[0], setFil = fl[1];   // filtro: todas | vendidas (Não devolvidas) | devolvidas
  var fc = useState({}), fechados = fc[0], setFechados = fc[1];   // categorias recolhidas
  var listaRef = React.useRef(null);
  useEffect(function(){ if(listaRef.current) listaRef.current.scrollTop = 0; }, [fil]);   // trocar o filtro volta ao início da lista
  var cl = useState(1), colunas = cl[0], setColunas = cl[1];   // 1 ou 2 peças por linha: sempre abre com uma
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
  // mesma peça em duas linhas vira um item só (unir). A seleção das condicionais vem do acerto (p.numeros): fonte única.
  var conds = React.useMemo(function(){ return (carga.todas||[]).filter(function(c){ return (p.numeros||[]).indexOf(c.numero)>=0; }).map(unir); }, [carga.todas, (p.numeros||[]).join(",")]), tot = totaisKit(conds);   // eslint-disable-line react-hooks/exhaustive-deps
  // 28/11/2026 (Marcus): a etiqueta traz o número de barras (00033139); a tela mostra sempre o código comercial (COL0088). Todas as condicionais dela entram no índice, não só as marcadas.
  React.useMemo(function(){ indexar(carga.todas); }, [carga.todas]);
  var nome = useNomes();
  var lido = function(c, i){ return Math.min(i.qtd, (conf.lidos||{})[c.numero+"|"+i.codigo]||0); };
  var voltaram = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+lido(c, i); }, 0); }, 0);
  // 28/11/2026 (Marcus, definição final): material sujeito a cobrança (MP, MU, maleta, bolsa, expositor, kit de apoio) é conferido pela BIPAGEM. Não bipado = não devolvido = cobrado inteiro, sem comissão e sem desconto.
  var cobrado = function(c, i){ return i.qtd-lido(c, i); };
  var vendidas = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+cobrado(c, i); }, 0); }, 0);
  var valorVendido = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+cobrado(c, i)*i.valor; }, 0); }, 0);
  // Materiais MP (Suporte, grupo 08) e MU (Material de uso geral, grupo 14) não geram comissão nem desconto: o que é cobrado entra inteiro e soma ao acerto. (Os valores só alimentam o acerto; não aparecem aqui.)
  var ehMat = function(i){ return /^(MP|MU)/i.test(String(i.codigo||"")); };
  var valorMat = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+(ehMat(i) ? cobrado(c, i)*i.valor : 0); }, 0); }, 0), valorSemi = valorVendido-valorMat;
  var guardar = function(novo){ novo = Object.assign({}, novo, {confirmou:true}); setConf(novo); p.aoSalvar({lidos:novo.lidos||{}, erros:novo.erros||[], hist:novo.hist||[], maleta:!!novo.maleta, confirmou:true, ultimo:null}); };
  var ler = function(c0){
    if(!conds.length) return;
    var c1 = String(c0||"").trim().toUpperCase().replace(/\s+/g, ""), sei = conhecido(c1);
    var antes = JSON.stringify((conf.lidos)||{}), novo = bipar(conds, conf, sei && sei.codigo ? sei.codigo : c1);
    if(JSON.stringify(novo.lidos||{})!==antes){   // contou uma peça nova: guarda a chave dela para o "Desfazer"
      var chave = Object.keys(novo.lidos).find(function(k){ return (novo.lidos[k]||0)!==((conf.lidos||{})[k]||0); });
      novo = Object.assign({}, novo, {hist:(conf.hist||[]).concat([chave])});
    }
    if(novo===conf) return;
    if(novo.ultimo && novo.ultimo.tipo==="ok") bipeOk(); else bipeErro();   // bip de sucesso só quando a peça é reconhecida e registrada
    guardar(novo);
  };
  if(carga.est==="carregando") return null;   // sem banner: a calculadora já espera os dados antes de abrir esta tela
  if(carga.est!=="ok") return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"rounded-xl bg-[#FEE2E2] px-3 py-2 text-[13px] font-bold text-[#991B1B]"}, carga.msg),
    e("button",{onClick:function(){ setTentativa(tentativa+1); }, className:BTN},"Tentar de novo"),
    e("button",{onClick:p.aoVoltar, className:"h-10 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-[#374151]"},"Voltar ao acerto"));
  if(!(p.numeros||[]).length) return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"border border-[#C9A13B]/60 bg-[#F8F3E8] px-3 py-2 text-center text-[13px] font-semibold text-[#5B4410]"}, "Selecione as condicionais na calculadora."),
    e("button",{onClick:p.aoVoltar, className:BTN},"Voltar ao acerto"));
  var concluir = function(){ if(jaFim.current) return; jaFim.current = true;   // uma conclusão só: toque duplo não grava duas vezes
    try{ p.aoSalvar({lidos:conf.lidos||{}, erros:(conf.erros||[]).map(function(x){ var c = conhecido(x.codigo); return c && c.codigo ? Object.assign({}, x, {codigo:c.codigo, barras:x.codigo}) : x; }), hist:conf.hist||[], maleta:!!conf.maleta, confirmou:true, ultimo:null, resumo:{voltaram:voltaram, saiu:tot.pecas, vendidas:vendidas, valorVendido:Math.round(valorSemi*100)/100, materiais:Math.round(valorMat*100)/100, conds:conds.map(function(c){ return c.numero; }), em:Date.now()}}); p.aoVoltar(); }catch(x){ jaFim.current = false; setConfirma(false); } };
  var pares = function(a, n){ var m = n===1 ? 1 : 2, o = []; for(var k = 0; k<a.length; k += m) o.push(a.slice(k, k+m)); return o; };
  var alternar = function(i, ok, l, ch){ if(ok){ var l2 = Object.assign({}, conf.lidos); delete l2[ch]; guardar(Object.assign({}, conf, {lidos:l2, hist:(conf.hist||[]).filter(function(k){ return k!==ch; }), ultimo:null})); return; } var falta = i.qtd-l, h = (conf.hist||[]).slice(), lid = Object.assign({}, conf.lidos); for(var q = 0; q<falta; q++) h.push(ch); lid[ch] = i.qtd; guardar(Object.assign({}, conf, {lidos:lid, hist:h, ultimo:null})); };
  // Lista unificada (só apresentação): cada categoria aparece uma vez; cada peça guarda a condicional de origem (chave numero|codigo).
  var cats = [], ixc = {};
  conds.forEach(function(c){ c.grupos.forEach(function(g){ if(!(g.cod in ixc)){ ixc[g.cod] = cats.length; cats.push({cod:g.cod, nome:g.nome, its:[]}); } g.itens.forEach(function(i){ cats[ixc[g.cod]].its.push({c:c, i:i}); }); }); });
  // Suporte (08) e Material de uso geral (14), códigos oficiais da DevMaster, vão para o fim; o resto mantém a ordem recebida
  cats = cats.map(function(g, k){ return {g:g, k:k+((g.cod==="08" || g.cod==="14") ? 1000 : 0)}; }).sort(function(a, b){ return a.k-b.k; }).map(function(x){ return x.g; });
  var vis = cats.map(function(g){ return {cod:g.cod, nome:g.nome, all:g.its, its:g.its.filter(function(x){ var l = lido(x.c, x.i); return fil==="devolvidas" ? l>0 : fil==="vendidas" ? cobrado(x.c, x.i)>0 : true; })}; }).filter(function(g){ return g.its.length; });
  var ult = conf.ultimo;
  return e("div",{className:"flex h-full min-h-0 flex-col gap-1"},
    // TOPO FIXO: nome, contadores, câmera (125 px) e linha Código/Bipar/colunas
    e("div",{className:"flex shrink-0 flex-col gap-1"},
      e("div",{className:"flex flex-col border border-[#C9A13B]/60 bg-white"},
        e("p",{className:"flex min-h-8 items-center justify-center bg-[#F8F3E8] px-3 text-center text-[18px] font-semibold text-[#5B4410]"}, p.rev || ""),
        e("div",{className:"grid grid-cols-3 gap-px border-t border-[#E4D3A3] bg-[#E4D3A3]"}, [["todas","Todas",tot.pecas],["vendidas","Não devolvidas",vendidas],["devolvidas","Devolvidas",voltaram]].map(function(o){ var on = fil===o[0];
          return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ setFil(o[0]); }, className:"flex h-7 min-w-0 items-center justify-center gap-1.5 text-[13px] "+(on ? "bg-[#C9A13B] text-[#1F1B0E]" : "bg-white text-[#8A6A12]")}, e("span",null,o[1]), e("b",{className:"font-semibold"}, String(o[2]))); }))),
      e(CameraBipagem,{aoLer:ler}),
      e("form",{onSubmit:function(ev){ ev.preventDefault(); if(codigo.trim()) ler(codigo); setCodigo(""); setTimeout(function(){ var el = document.getElementById("conf-dev-codigo"); if(el) el.focus(); }, 0); }, className:"grid gap-[6px]", style:{gridTemplateColumns:"minmax(0, 3fr) repeat(2, minmax(0, 1fr))"}},
        e("input",{id:"conf-dev-codigo", enterKeyHint:"go", autoComplete:"off", inputMode:"text", value:codigo, onChange:function(ev){ setCodigo(ev.target.value); }, placeholder:"Código da peça", autoCapitalize:"characters", className:"h-8 w-full min-w-0 rounded-lg bg-white px-3 text-left text-[13px] text-[#111827] outline-none border border-[#C9A13B]/70"}),
        e("button",{type:"submit", className:BT+" bg-[#C9A13B] text-[#1F1B0E]"},"Bipar"),
        e("button",{type:"button", onClick:function(){ setColunas(colunas===1 ? 2 : 1); }, className:BT+" border border-[#C9A13B] bg-white text-[#3B2F0B]"}, colunas===1 ? "2 colunas" : "1 coluna")),
      (function(u){ if(!u) return null;
        if(u.tipo==="ok") return e(AvisoBip,{aviso:{tipo:"ok", codigo:u.codigo, valor:u.valor, texto:descBonita(u.desc) || "Sem descrição"}});
        if(u.tipo==="repetida") return e(AvisoBip,{aviso:{tipo:"repetida", codigo:u.codigo, texto:"Peça já bipada"}});
        var n = nome(u.codigo);
        return e(AvisoBip,{aviso: n.achou===null ? {tipo:"buscando", codigo:u.codigo, texto:"Identificando a peça"} : n.achou ? {tipo:"fora", codigo:n.codigo, texto:"Peça fora destas condicionais"} : {tipo:"nao", codigo:u.codigo, texto:"Código não localizado no cadastro"}}); })(ult)),
    // LISTA: rola sozinha entre o topo e o rodapé
    e("div",{ref:listaRef, className:"flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto border border-[#C9A13B]/60 p-1", style:{overscrollBehavior:"contain"}},
      vis.map(function(g){ var gf = g.all.reduce(function(t, x){ return t+lido(x.c, x.i); }, 0), gt = g.all.reduce(function(t, x){ return t+x.i.qtd; }, 0), fech = !!fechados[g.cod];
        return e("div",{key:g.cod, className:"flex shrink-0 flex-col border border-[#C9A13B]/50 bg-white"},
          e("button",{type:"button", "aria-expanded":!fech, onClick:function(){ setFechados(function(o){ var n = Object.assign({}, o); if(n[g.cod]) delete n[g.cod]; else n[g.cod] = true; return n; }); }, className:"flex h-8 w-full items-center justify-between bg-[#F3EAD3] px-3 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null,g.nome), e("span",{className:gf===gt ? "text-[#15803D]" : ""}, gf+"/"+gt)),
          !fech && pares(g.its, colunas).map(function(par, pi){ var aberto = par.filter(function(x){ return descAberta===x.c.numero+"|"+x.i.codigo; })[0];
            return e("div",{key:"p"+pi, className:"flex flex-col border-t border-[#E8DCC0]"},
              e("div",{className:"grid divide-[#E8DCC0] "+(colunas===2 ? "grid-cols-1 min-[360px]:grid-cols-2 min-[360px]:divide-x" : "grid-cols-1")}, par.map(function(x){ var c = x.c, i = x.i, l = lido(c, i), ok = l>=i.qtd, ch = c.numero+"|"+i.codigo, sel = descAberta===ch;
                return e("div",{key:ch, role:"button", tabIndex:0, "aria-expanded":sel, onClick:function(){ setDescAberta(function(a){ return a===ch ? "" : ch; }); }, className:"flex h-10 min-w-0 cursor-pointer touch-manipulation select-none items-center gap-2 px-3 text-left outline-none "+(sel ? "relative z-10 ring-2 ring-inset ring-[#C9A13B] "+(ok ? "bg-[#E5E7EB]" : "bg-[#F8F4EA]") : ok ? "bg-[#E5E7EB]" : l>0 ? "bg-[#FEF9C3]" : "bg-white")},
                  e("button",{type:"button", "aria-pressed":!ok, "aria-label":ok ? "Marcar peça como não devolvida" : "Marcar peça como devolvida", onClick:function(ev){ ev.stopPropagation(); alternar(i, ok, l, ch); }, className:"-m-2 grid size-8 shrink-0 place-items-center outline-none"}, e("span",{className:"grid size-4 place-items-center rounded-full text-[11px] font-bold "+(ok ? "bg-[#9CA3AF]" : cobrado(c, i)>0 ? "bg-[#16A34A] text-white" : "bg-white ring-1 ring-[#9CA3AF]")}, !ok && cobrado(c, i)>0 ? "✓" : "")),
                  e("span",{className:"flex min-w-0 items-center gap-1.5 text-[13px] "+(ok ? "text-[#6B7280]" : "text-[#111827]")}, i.codigo+(i.qtd>1 ? "  "+l+"/"+i.qtd : "")),
                  e("span",{className:"ml-auto whitespace-nowrap text-[13px] "+(ok ? "text-[#6B7280]" : "text-[#111827]")}, BR(i.valor))); })),
              aberto && (function(x){ var i = x.i;
                return e("div",{className:"flex flex-col gap-1 border-t border-[#C9A13B]/60 bg-[#F8F4EA] px-3 py-2"},
                  e("div",{className:"flex items-center justify-between gap-2 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null, i.codigo), e("span",null, BR(i.valor))),
                  e("span",{className:"text-[13px] leading-snug text-[#374151]"}, descBonita(i.desc) || "Sem descrição")); })(aberto)); })); }),
      (conf.erros||[]).length>0 && e("div",{className:"flex shrink-0 flex-col gap-1 border border-[#DC2626]/50 bg-[#FEF2F2] px-3 py-1.5"},
        e("b",{className:"text-[13px] font-semibold text-[#991B1B]"},"Peças fora destas condicionais ("+conf.erros.length+")"), e("span",{className:MONO+" text-[13px] text-[#991B1B]"}, conf.erros.map(function(x){ return nome(x.codigo).codigo; }).join(", ")))),
    // RODAPÉ FIXO: Concluir bipagem (a lista termina acima dele, sem sobrepor)
    e("div",{className:"flex shrink-0 flex-col gap-1 border-t border-[#C9A13B]/60 bg-[#F0F1F3] pt-1"},
      confirma && e("div",{className:"flex flex-col gap-1.5 border border-[#C9A13B] bg-[#FBF7EC] px-3 py-2 text-[13px] text-[#3B2F0B]", role:"alertdialog"},
        e("b",{className:"font-semibold"}, "Confira as peças antes de concluir."),
        e("div",{className:"flex items-center justify-between gap-2"}, e("span",null, "Devolvidas"), e("b",{className:"font-semibold text-[#8A6A12]"}, String(voltaram))),
        e("div",{className:"flex items-center justify-between gap-2"}, e("span",null, "Não devolvidas"), e("b",{className:"font-semibold text-[#8A6A12]"}, String(vendidas))),
        e("div",{className:"grid grid-cols-2 gap-[6px]"},
          e("button",{type:"button", onClick:function(){ setConfirma(false); setFil("todas"); }, className:"h-10 rounded-lg border border-[#C9A13B] bg-white text-[13px] font-semibold"}, "Voltar à bipagem"),
          e("button",{type:"button", onClick:concluir, className:"h-10 rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-[#1F1B0E]"}, "Confirmar e concluir"))),
      !confirma && e("button",{type:"button", onClick:function(){ setConfirma(true); }, className:BT+" border border-[#C9A13B] bg-[#F3E9D0] text-[#3B2F0B]"}, "Concluir bipagem")));
}

export { ConfDevolucao };
