// Sorelly Admin — mobile/conf-devolucao.js
// Bipagem das peças que VOLTAM no acerto (Marcus, 24/11/2026: "selecionei as condicionais e não abre para começar a bipar"). A representante marca as condicionais da revendedora
// na calculadora de acertos; aqui elas viram UM kit só (as condicionais formam um kit inteiro): lista de todas as peças que saíram, câmera para bipar a etiqueta de cada uma
// que voltou, campo para digitar o código quando a etiqueta não lê. O que não voltou é o que a revendedora vendeu. O resultado fica no acerto (acertoForm.devolucaoBip);
// nada é gravado como erro de ninguém aqui: peça de fora só fica registrada. As peças vêm da DevMaster (rota /representante/condicionais, com o número de barras).
import { bipar, descBonita, itensDe, totaisKit } from "@/apps/montagem/domain/conferencia-pecas";
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
  var es = useState({est:"carregando", msg:"", conds:[]}), carga = es[0], setCarga = es[1];
  var cf = useState(p.inicial || {}), conf = cf[0], setConf = cf[1];
  var cm = useState(true), camera = cm[0], setCamera = cm[1];
  var cd = useState(""), codigo = cd[0], setCodigo = cd[1];
  var ab = useState(null), aberta = ab[0], setAberta = ab[1];
  var nt = useState(0), tentativa = nt[0], setTentativa = nt[1];
  var inf0 = useState(null), info = inf0[0], setInfo = inf0[1];   // alerta de baixo: peça que NÃO é das condicionais marcadas (e o histórico dela com esta revendedora)
  var dsp = useState(""), dispensado = dsp[0], setDispensado = dsp[1];   // o bloco de baixo da câmera troca sozinho a cada peça
  var dc = useState(""), descAberta = dc[0], setDescAberta = dc[1];   // peça da lista com a descrição aberta
  var ultimoLido = conf.ultimo;
  useEffect(function(){
    if(!ultimoLido || ultimoLido.tipo!=="fora") return;
    var chave = ultimoLido.codigo+"|"+ultimoLido.em, vivo = true;
    setInfo({chave:chave, lido:ultimoLido.codigo, est:"carregando"}); setDispensado("");
    chamar("GET", "/representante/peca?cod="+encodeURIComponent(p.cod)+"&q="+encodeURIComponent(ultimoLido.codigo)).then(function(r){ if(vivo) setInfo({chave:chave, lido:ultimoLido.codigo, est:"ok", dados:r}); })
      .catch(function(){ if(vivo) setInfo({chave:chave, lido:ultimoLido.codigo, est:"erro"}); });
    return function(){ vivo = false; };
  }, [ultimoLido && ultimoLido.em, ultimoLido && ultimoLido.tipo]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){
    var vivo = true; setCarga({est:"carregando", msg:"", conds:[]});
    chamar("GET", "/representante/condicionais?cod="+encodeURIComponent(p.cod)).then(function(r){
      if(!vivo) return;
      var todas = r.condicionais || [], marcadas = todas.filter(function(c){ return (p.numeros||[]).indexOf(c.numero)>=0; });
      if(!marcadas.length) setCarga({est:"vazio", msg:"As condicionais marcadas não têm peças na DevMaster. Volte e confira a lista.", conds:[]});
      else setCarga({est:"ok", msg:"", conds:marcadas});
    }).catch(function(x){ if(vivo) setCarga({est:"erro", msg:(x && x.message) || "Não consegui buscar as peças na DevMaster.", conds:[]}); });
    return function(){ vivo = false; };
  }, [p.cod, (p.numeros||[]).join(","), tentativa]);   // eslint-disable-line react-hooks/exhaustive-deps
  var conds = carga.conds, tot = totaisKit(conds);
  var lido = function(c, i){ return Math.min(i.qtd, (conf.lidos||{})[c.numero+"|"+i.codigo]||0); };
  var voltaram = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+lido(c, i); }, 0); }, 0);
  var vendidas = tot.pecas-voltaram;
  var valorVendido = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+(i.qtd-lido(c, i))*i.valor; }, 0); }, 0);
  var guardar = function(novo){ setConf(novo); p.aoSalvar({lidos:novo.lidos||{}, erros:novo.erros||[], hist:novo.hist||[], ultimo:null}); };
  var ler = function(c0){
    if(!conds.length) return;
    var antes = JSON.stringify((conf.lidos)||{}), novo = bipar(conds, conf, c0);
    if(JSON.stringify(novo.lidos||{})!==antes){   // contou uma peça nova: guarda a chave dela para o "Desfazer"
      var chave = Object.keys(novo.lidos).find(function(k){ return (novo.lidos[k]||0)!==((conf.lidos||{})[k]||0); });
      novo = Object.assign({}, novo, {hist:(conf.hist||[]).concat([chave])});
    }
    guardar(novo);
  };
  var desfazer = function(){
    var h = (conf.hist||[]).slice(), k = h.pop(); if(!k) return;
    var l = Object.assign({}, conf.lidos); l[k] = Math.max(0, (l[k]||0)-1); if(!l[k]) delete l[k];
    guardar(Object.assign({}, conf, {lidos:l, hist:h, ultimo:null}));
  };
  var ult = conf.ultimo;
  var pctCom = faixaDe(valorVendido), comissao = valorVendido*pctCom/100, valorAcerto = valorVendido-comissao;
  // bloco de baixo da câmera: o que acabou de ser bipado (código e preço) ou "não é do kit"
  var bloco = (function(){
    var neutro = {fundo:"#F3F4F6", borda:"#E5E7EB", cor:"#374151", t:"Bipe a primeira peça", d:"", linhas:[]};
    if(!ult) return neutro;
    if(ult.tipo==="ok") return {fundo:"#DCFCE7", borda:"#86EFAC", cor:"#14532D", t:"✓ "+ult.codigo+" · "+BR(ult.valor), d:descBonita(ult.desc), linhas:[]};
    if(ult.tipo==="repetida") return {fundo:"#FEF3C7", borda:"#FCD34D", cor:"#78350F", t:"Já bipada · "+ult.codigo+" · "+BR(ult.valor), d:"Lida de novo, não conta outra vez.", linhas:[]};
    var dd = (info && info.dados) || {}, hist = dd.historico || [], linhas = [];
    if(!info || info.est==="carregando") linhas.push("Procurando na DevMaster...");
    else if(info.est==="erro") linhas.push("Não consegui consultar o histórico dela.");
    else if(!dd.achou) linhas.push("Esse código não existe na DevMaster. Confira a etiqueta.");
    else if(!hist.length) linhas.push("Não achei essa peça em nenhuma condicional dessa revendedora.");
    else hist.slice(0, 2).forEach(function(h){ linhas.push(h.status==="aberta" ? "Está na condicional "+h.numero+" (aberta), não marcada neste acerto." : "Já foi dela: condicional "+h.numero+" de "+dataBR(h.emissao)+" ("+h.status+")."); });
    return {fundo:"#FEE2E2", borda:"#FCA5A5", cor:"#7F1D1D", t:(dd.codigo || ult.codigo)+(dd.valor ? " · "+BR(dd.valor) : "")+" · não é do kit", d:dd.desc ? descBonita(dd.desc) : "", linhas:linhas};
  })();
  if(carga.est==="carregando") return e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-3 text-center text-[13px] font-bold text-[#92400E]"},"Buscando as peças das condicionais na DevMaster...");
  if(carga.est!=="ok") return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"rounded-xl bg-[#FEE2E2] px-3 py-2 text-[13px] font-bold text-[#991B1B]"}, carga.msg),
    e("button",{onClick:function(){ setTentativa(tentativa+1); }, className:BTN},"Tentar de novo"),
    e("button",{onClick:p.aoVoltar, className:"h-10 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-[#374151]"},"Voltar ao acerto"));
  var pct = tot.pecas ? Math.round(voltaram/tot.pecas*100) : 0;
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:CARD+" flex flex-col px-4 py-1"},
      linha("Vendeu", BR(valorVendido), 0),
      linha("Comissão "+pctCom+"%", BR(comissao), 1),
      linha("Valor do acerto", BR(valorAcerto), 1, "text-[#8A6A12]")),
    e("div",{className:"relative h-8 overflow-hidden rounded-full bg-[#D9DCE1]"},
      e("span",{className:"absolute inset-y-0 left-0 rounded-full bg-[#C9A13B]", style:{width:pct+"%"}}),
      e("span",{className:"absolute inset-0 flex items-center justify-between px-4 text-[13px] font-semibold text-[#111827]"}, e("span",null,"Voltaram "+voltaram+" de "+tot.pecas), e("span",null,"Faltam "+(tot.pecas-voltaram)))),
    e(LeitorCamera,{aoLer:ler}),
    e("div",{className:"flex flex-col gap-0.5 rounded-2xl px-3 py-2.5", style:{background:bloco.fundo, color:bloco.cor, boxShadow:"inset 0 0 0 1px "+bloco.borda}},
      e("b",{className:MONO+" text-[16px]"}, bloco.t),
      bloco.d && e("span",{className:"text-[13px]"}, bloco.d),
      bloco.linhas.map(function(l, i){ return e("span",{key:i, className:"text-[13px]"}, l); })),
    e("form",{onSubmit:function(ev){ ev.preventDefault(); if(codigo.trim()) ler(codigo); setCodigo(""); }, className:"flex flex-col gap-1.5"},
      e("b",{className:"text-[13px] text-[#111827]"},"Bipe a peça ou digite o código"),
      e("div",{className:"flex gap-2"},
        e("input",{value:codigo, onChange:function(ev){ setCodigo(ev.target.value); }, placeholder:"Código da peça", autoCapitalize:"characters", className:"h-12 min-w-0 flex-1 rounded-2xl bg-white px-4 text-[13px] text-[#111827] outline-none ring-1 ring-black/15"}),
        e("button",{type:"submit", className:"h-12 flex-1 rounded-2xl bg-[#C9A13B] text-[16px] font-bold text-[#1F1B0E]"},"Bipar")),
      e("button",{type:"button", onClick:desfazer, className:"h-12 w-full rounded-2xl bg-white text-[13px] font-bold text-[#111827] ring-1 ring-black/15"},"Desfazer a última peça")),
    conds.map(function(c){ var its = itensDe(c), feitas = its.reduce(function(t, i){ return t+lido(c, i); }, 0), tp = its.reduce(function(t, i){ return t+i.qtd; }, 0), on = aberta===c.numero || (aberta===null && conds.length===1);
      return e("div",{key:c.numero, className:CARD+" flex flex-col gap-1 p-2!"},
        e("button",{onClick:function(){ setAberta(on ? "" : c.numero); }, className:"flex items-center gap-2 px-1 py-1 text-left"},
          e("b",{className:"flex-1 text-[13px] text-[#111827]"},"Condicional "+c.numero), e("span",{className:MONO+" text-[13px] font-bold "+(feitas===tp ? "text-[#15803D]" : "text-[#374151]")}, feitas+"/"+tp),
          e(Icon,{n:on ? "chevrondown" : "chevron", s:14, className:"text-[#374151]"})),
        on && c.grupos.map(function(g){ var gf = g.itens.reduce(function(t, i){ return t+lido(c, i); }, 0), gt = g.itens.reduce(function(t, i){ return t+i.qtd; }, 0);
          return e("div",{key:g.cod, className:"flex flex-col"},
            e("p",{className:"mt-1 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1 text-[11px] font-bold text-[#374151]"}, e("span",null,g.nome), e("span",{className:MONO}, gf+"/"+gt)),
            g.itens.map(function(i){ var l = lido(c, i), ok = l>=i.qtd, ch = c.numero+"|"+i.codigo, abre = descAberta===ch;
              return e("button",{type:"button", key:i.codigo, onClick:function(){ setDescAberta(abre ? "" : ch); }, className:"flex flex-col rounded-lg px-2 py-1.5 text-left "+(ok ? "bg-[#F0FDF4]" : l>0 ? "bg-[#FEF9C3]" : "bg-white")},
                e("span",{className:"flex items-center gap-2"},
                  e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-black "+(ok ? "bg-[#16A34A] txt-branco" : "bg-[#E5E7EB] text-[#E5E7EB]")}, ok ? "✓" : "·"),
                  e("b",{className:MONO+" flex-1 text-[13px] text-[#111827]"}, i.codigo+(i.qtd>1 ? "  "+l+"/"+i.qtd : "")),
                  e("b",{className:MONO+" text-[13px] text-[#111827]"}, BR(i.valor))),
                abre && e("span",{className:"pl-7 pt-0.5 text-[13px] text-[#374151]"}, descBonita(i.desc))); })); })); }),
    (conf.erros||[]).length>0 && e("div",{className:"flex flex-col gap-1 rounded-xl bg-[#FEF3C7] px-3 py-2"},
      e("b",{className:"text-[12.5px] text-[#92400E]"},"Peças que não são destas condicionais ("+conf.erros.length+")"), e("span",{className:MONO+" text-[12px] text-[#92400E]"}, conf.erros.map(function(x){ return x.codigo; }).join(", "))),
    e("button",{onClick:function(){ p.aoSalvar({lidos:conf.lidos||{}, erros:conf.erros||[], hist:conf.hist||[], ultimo:null, resumo:{voltaram:voltaram, saiu:tot.pecas, vendidas:vendidas, valorVendido:Math.round(valorVendido*100)/100, conds:conds.map(function(c){ return c.numero; }), em:Date.now()}}); p.aoVoltar(); }, className:BTN},"Concluir e voltar ao acerto"));
}

export { ConfDevolucao };
