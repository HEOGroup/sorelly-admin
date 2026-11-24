// Sorelly Admin — mobile/conf-devolucao.js
// Bipagem das peças que VOLTAM no acerto (Marcus, 24/11/2026: "selecionei as condicionais e não abre para começar a bipar"). A representante marca as condicionais da revendedora
// na calculadora de acertos; aqui elas viram UM kit só (as condicionais formam um kit inteiro): lista de todas as peças que saíram, câmera para bipar a etiqueta de cada uma
// que voltou, campo para digitar o código quando a etiqueta não lê. O que não voltou é o que a revendedora vendeu. O resultado fica no acerto (acertoForm.devolucaoBip);
// nada é gravado como erro de ninguém aqui: peça de fora só fica registrada. As peças vêm da DevMaster (rota /representante/condicionais, com o número de barras).
import { bipar, descBonita, itensDe, totaisKit } from "@/apps/montagem/domain/conferencia-pecas";
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
var linha = function(rot, val, i, forte){ return e("div",{key:rot, className:"flex min-h-8 items-center justify-between gap-3 text-[13px] text-[#111827] "+(i ? "border-t border-[#E5E7EB]" : "")}, e("span",{className:"whitespace-nowrap"}, rot), e("b",{className:MONO+" whitespace-nowrap text-right "+(forte||"")}, val)); };

function ConfDevolucao(p){
  var es = useState({est:"carregando", msg:"", conds:[]}), carga = es[0], setCarga = es[1];
  var cf = useState(p.inicial || {}), conf = cf[0], setConf = cf[1];
  var cm = useState(true), camera = cm[0], setCamera = cm[1];
  var cd = useState(""), codigo = cd[0], setCodigo = cd[1];
  var ab = useState(null), aberta = ab[0], setAberta = ab[1];
  var nt = useState(0), tentativa = nt[0], setTentativa = nt[1];
  var inf0 = useState(null), info = inf0[0], setInfo = inf0[1];   // alerta de baixo: peça que NÃO é das condicionais marcadas (e o histórico dela com esta revendedora)
  var dsp = useState(""), dispensado = dsp[0], setDispensado = dsp[1];
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
  var aviso = !ult ? null : ult.tipo==="ok" ? ["#DCFCE7","#15803D","✓ Voltou · "+ult.codigo+" · "+descBonita(ult.desc)]
    : ult.tipo==="repetida" ? ["#FEF3C7","#92400E","Já conferida: "+ult.codigo+". Peça lida de novo, não conta."]
    : null;
  if(carga.est==="carregando") return e("p",{className:"rounded-xl bg-[#FEF3C7] px-3 py-3 text-center text-[13px] font-bold text-[#92400E]"},"Buscando as peças das condicionais na DevMaster...");
  if(carga.est!=="ok") return e("div",{className:"flex flex-col gap-2.5"},
    e("p",{className:"rounded-xl bg-[#FEE2E2] px-3 py-2 text-[13px] font-bold text-[#991B1B]"}, carga.msg),
    e("button",{onClick:function(){ setTentativa(tentativa+1); }, className:BTN},"Tentar de novo"),
    e("button",{onClick:p.aoVoltar, className:"h-10 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-[#374151]"},"Voltar ao acerto"));
  var pct = tot.pecas ? Math.round(voltaram/tot.pecas*100) : 0;
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:CARD+" flex flex-col"},
      linha("Voltaram", voltaram+" de "+tot.pecas+" peças", 0, "text-[#15803D]"),
      e("span",{className:"my-1.5 h-2 overflow-hidden rounded-full bg-[#E5E7EB]"}, e("span",{className:"block h-full rounded-full bg-[#16A34A]", style:{width:pct+"%"}})),
      linha("Faltam voltar", (tot.pecas-voltaram)+" peças", 1),
      linha("Condicionais juntas", conds.map(function(c){ return c.numero; }).join(" · "), 1)),
    camera ? e(LeitorCamera,{aoLer:ler, aoFechar:function(){ setCamera(false); }})
      : e("button",{type:"button", onClick:function(){ setCamera(true); }, className:BTN},"Abrir a câmera para bipar"),
    e("p",{className:"text-[12px] text-[#6B7280]"},"Aponte a câmera para as listras da etiqueta de cada peça que voltou. Se a etiqueta não ler, digite o código da peça (ex.: CL2542)."),
    e("form",{onSubmit:function(ev){ ev.preventDefault(); ler(codigo); setCodigo(""); }, className:"flex gap-1.5"},
      e("input",{value:codigo, onChange:function(ev){ setCodigo(ev.target.value); }, placeholder:"ou digite o código da peça", autoCapitalize:"characters", className:"h-10 min-w-0 flex-1 rounded-lg bg-white px-3 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}),
      e("button",{type:"submit", className:"h-10 shrink-0 rounded-lg bg-[#C9A13B] px-4 text-[12.5px] font-bold txt-branco"},"Bipar")),
    aviso && e("p",{className:"rounded-xl px-3 py-2 text-[12.5px] font-bold", style:{background:aviso[0], color:aviso[1]}}, aviso[2]),
    (conf.hist||[]).length>0 && e("button",{type:"button", onClick:desfazer, className:"h-9 rounded-xl bg-[#F3F4F6] text-[12.5px] font-semibold text-[#374151]"},"Desfazer a última peça"),
    conds.map(function(c){ var its = itensDe(c), feitas = its.reduce(function(t, i){ return t+lido(c, i); }, 0), tp = its.reduce(function(t, i){ return t+i.qtd; }, 0), on = aberta===c.numero || (aberta===null && conds.length===1);
      return e("div",{key:c.numero, className:CARD+" flex flex-col gap-1.5 p-2!"},
        e("button",{onClick:function(){ setAberta(on ? "" : c.numero); }, className:"flex items-center gap-2 px-1 py-1 text-left"},
          e("b",{className:"flex-1 text-[13px] text-[#111827]"},"Condicional "+c.numero), e("span",{className:MONO+" text-[12px] font-bold "+(feitas===tp ? "text-[#15803D]" : "text-[#6B7280]")}, feitas+"/"+tp),
          e(Icon,{n:on ? "chevrondown" : "chevron", s:14, className:"text-[#6B7280]"})),
        on && c.grupos.map(function(g){ var gf = g.itens.reduce(function(t, i){ return t+lido(c, i); }, 0), gt = g.itens.reduce(function(t, i){ return t+i.qtd; }, 0);
          return e("div",{key:g.cod, className:"flex flex-col gap-1"},
            e("p",{className:"mt-1 flex items-center justify-between rounded-lg bg-[#F3F4F6] px-2 py-1 text-[11px] font-bold text-[#6B7280]"}, e("span",null,g.nome), e("span",{className:MONO}, gf+"/"+gt)),
            g.itens.map(function(i){ var l = lido(c, i), ok = l>=i.qtd;
              return e("div",{key:i.codigo, className:"flex items-start gap-2 rounded-lg px-2 py-1.5 "+(ok ? "bg-[#F0FDF4]" : l>0 ? "bg-[#FEF9C3]" : "bg-white ring-1 ring-[#F3F4F6]")},
                e("span",{className:"mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[11px] font-black "+(ok ? "bg-[#16A34A] txt-branco" : "bg-[#E5E7EB] text-[#9CA3AF]")}, ok ? "✓" : ""),
                e("span",{className:"min-w-0 flex-1"}, e("b",{className:MONO+" block text-[12px] text-[#111827]"}, i.codigo), e("span",{className:"block text-[11px] leading-tight text-[#6B7280]"}, descBonita(i.desc))),
                e("span",{className:"flex shrink-0 flex-col items-end"}, e("b",{className:MONO+" text-[11.5px] "+(ok ? "text-[#15803D]" : "text-[#6B7280]")}, l+"/"+i.qtd), e("span",{className:MONO+" text-[10.5px] text-[#6B7280]"}, BR(i.valor)))); })); })); }),
    (conf.erros||[]).length>0 && e("div",{className:"flex flex-col gap-1 rounded-xl bg-[#FEF3C7] px-3 py-2"},
      e("b",{className:"text-[12.5px] text-[#92400E]"},"Peças que não são destas condicionais ("+conf.erros.length+")"), e("span",{className:MONO+" text-[12px] text-[#92400E]"}, conf.erros.map(function(x){ return x.codigo; }).join(", "))),
    e("div",{className:CARD+" flex flex-col"},
      linha("Voltaram", voltaram+" peças", 0), linha("Não voltaram (vendidas)", vendidas+" peças", 1), linha("Valor do que não voltou", BR(valorVendido), 2)),
    info && info.chave!==dispensado && (function(){
      var dd = info.dados || {}, cod = dd.codigo || info.lido, hist = dd.historico || [], linhas = [];
      if(info.est==="carregando") linhas.push("Procurando essa peça na DevMaster...");
      else if(info.est==="erro") linhas.push("Não consegui consultar o histórico dessa peça. Ela fica registrada como peça de fora.");
      else if(!dd.achou) linhas.push("Esse código não existe na DevMaster. Confira a etiqueta.");
      else if(!hist.length) linhas.push("Não achei essa peça em nenhuma condicional dessa revendedora.");
      else hist.slice(0, 3).forEach(function(h){ linhas.push((h.status==="aberta" ? "Está na condicional "+h.numero+" (aberta), que não foi marcada neste acerto." : "Já foi dela: condicional "+h.numero+" de "+dataBR(h.emissao)+" ("+h.status+"): "+h.enviada+" enviada, "+h.vendida+" vendida, "+h.devolvida+" devolvida.")); });
      return e("div",{key:"alerta", className:"sticky bottom-2 z-10 flex flex-col gap-1 rounded-2xl bg-[#FEF3C7] px-3 py-2.5 shadow-lg ring-1 ring-[#F59E0B]"},
        e("b",{className:"text-[13px] text-[#92400E]"}, "Peça "+cod+" não está nas condicionais marcadas"),
        dd.desc && e("span",{className:"text-[12px] text-[#92400E]"}, descBonita(dd.desc)),
        linhas.map(function(l, i){ return e("span",{key:i, className:"text-[12px] text-[#92400E]"}, l); }),
        e("button",{type:"button", onClick:function(){ setDispensado(info.chave); }, className:"mt-1 h-9 rounded-xl bg-white text-[12.5px] font-bold text-[#92400E] ring-1 ring-[#F59E0B]"},"Entendi"));
    })(),
    e("button",{onClick:function(){ p.aoSalvar({lidos:conf.lidos||{}, erros:conf.erros||[], hist:conf.hist||[], ultimo:null, resumo:{voltaram:voltaram, saiu:tot.pecas, vendidas:vendidas, valorVendido:Math.round(valorVendido*100)/100, conds:conds.map(function(c){ return c.numero; }), em:Date.now()}}); p.aoVoltar(); }, className:BTN},"Concluir e voltar ao acerto"));
}

export { ConfDevolucao };
