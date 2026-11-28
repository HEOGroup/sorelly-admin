// Sorelly Admin — mobile/conf-entrega-kit.js
// Conferência das peças do NOVO KIT que saem para a revendedora (28/11/2026, Marcus). Mesmo desenho e mesma câmera de "Peças que voltaram" (mobile/bip-comum.js + leitor-camera.js),
// ligada ao estado da conferência do kit que já existe (CONF_LIBERAR, CONF_INICIAR, CONF_BIPAR, CONF_QTD, CONF_FINALIZAR, CONF_NOTA, CONF_REINICIAR): nada de fluxo novo, só o desenho.
// Todas as fases ficam aqui: liberar, escolher (câmera ou contagem), bipar, contar e resultado. Esta tela NÃO grava acerto, pagamento, assinatura nem entrega: só a conferência das peças.
// Bipando: contadores Todas / Pendentes / Conferidas, câmera de 190 px que abre sozinha, uma coluna por padrão, bip só quando a peça é registrada, rodapé fixo.
import { bipar, condicionaisDoKit, descBonita, itensDe, totaisDe, totaisKit, unir } from "@/apps/montagem/domain/conferencia-pecas";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { AvisoBip, CameraBipagem, conhecido, indexar, useNomes } from "@/apps/montagem/mobile/bip-comum";
import { useCondsReais } from "@/apps/montagem/mobile/conds-reais";
import { bipeErro, bipeOk } from "@/apps/montagem/mobile/leitor-camera";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

var BR = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var BT = "flex h-8 w-full min-w-0 items-center justify-center gap-2 rounded-lg text-center text-[13px] font-semibold";
var B1 = "h-10 w-full rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-[#1F1B0E] disabled:opacity-40", B2 = "h-10 w-full rounded-lg border border-[#C9A13B] bg-white text-[13px] font-semibold text-[#3B2F0B]";
var CAIXA = "flex flex-col border border-[#C9A13B]/60 bg-white", LIN = "flex min-h-8 items-center justify-between gap-2 border-t border-[#E8DCC0] px-3 text-[13px] text-[#111827]";

function ConfEntregaKit(p){
  var s = p.s, d = p.d, k = p.k, conf = (s.confBip||{})[k.id] || {};
  var real = useCondsReais(s, d, k);   // busca as condicionais reais do kit na DevMaster (só leitura)
  var reais = condicionaisDoKit(k), conds = React.useMemo(function(){ return reais.map(unir); }, [reais]), tot = totaisKit(conds);
  React.useMemo(function(){ indexar(reais); }, [reais]);   // número de barras -> código comercial das peças deste kit
  var nome = useNomes();
  var cd = useState(""), codigo = cd[0], setCodigo = cd[1];
  var cfm = useState(false), confirma = cfm[0], setConfirma = cfm[1];
  var fl = useState("todas"), fil = fl[0], setFil = fl[1];
  var fc = useState({}), fechados = fc[0], setFechados = fc[1];
  var cl = useState(1), colunas = cl[0], setColunas = cl[1];
  var dc = useState(""), descAberta = dc[0], setDescAberta = dc[1];
  var sc = useState(false), soContagem = sc[0], setSoContagem = sc[1];
  var qt = useState(""), contadas = qt[0], setContadas = qt[1];
  var nt = useState(""), notaTxt = nt[0], setNotaTxt = nt[1];
  var listaRef = React.useRef(null);
  useEffect(function(){ if(listaRef.current) listaRef.current.scrollTop = 0; }, [fil]);
  var lido = function(c, i){ return Math.min(i.qtd, (conf.lidos||{})[c.numero+"|"+i.codigo]||0); };
  var conferidas = conds.reduce(function(t, c){ return t+itensDe(c).reduce(function(x, i){ return x+lido(c, i); }, 0); }, 0), pendentes = tot.pecas-conferidas;
  var bipadora = k.bipId ? nomeDe(k.bipId) : "";
  var topo = function(extra){ return e("div",{className:CAIXA+" shrink-0"}, e("p",{className:"flex min-h-8 items-center justify-center bg-[#F8F3E8] px-3 text-center text-[18px] font-semibold text-[#5B4410]"}, k.rev || ""), extra || null); };
  var resumo = e("div",{className:CAIXA+" shrink-0"},
    conds.map(function(c, ix){ var t = totaisDe(c); return e("div",{key:c.numero, className:LIN+(ix ? "" : " border-t-0")}, e("span",null,"Condicional "+c.numero), e("span",null, t.pecas+" peças · "+BR(t.valor))); }),
    e("div",{className:LIN+" bg-[#F3EAD3] font-semibold text-[#5B4410]"}, e("span",null,"Total"), e("span",null, tot.pecas+" peças · "+BR(tot.valor))));
  var pagina = function(){ return e.apply(null, ["div",{className:"flex h-full min-h-0 flex-col gap-1.5 overflow-y-auto"}].concat(Array.prototype.slice.call(arguments))); };

  // sem condicional real da DevMaster não há o que conferir (nada de peça inventada)
  if(!conds.length) return pagina(topo(), e("p",{key:"av", className:"border border-[#DC2626] bg-[#FEF2F2] px-3 py-2 text-[13px] font-semibold text-[#991B1B]"}, real.aviso || "Sem condicional da DevMaster para este kit."));
  // 1) liberar
  if(!conf.lib) return pagina(topo(), resumo,
    e("button",{key:"lib", type:"button", onClick:function(){ d({type:"CONF_LIBERAR", kitId:k.id}); }, className:B1}, "Liberar kit"));
  // 2) só por contagem: a representante conta tudo junto e digita o total
  if(!conf.ini && !conf.fim && soContagem){
    var temTotal = contadas!=="", muda = function(v){ setContadas(v==="" ? "" : String(Math.max(0, parseInt(v, 10)||0))); };
    return pagina(topo(),
      e("div",{key:"ct", className:CAIXA+" shrink-0"},
        e("div",{className:LIN+" border-t-0"}, e("span",null,"Peças esperadas"), e("b",{className:"font-semibold"}, String(tot.pecas))),
        e("div",{className:LIN+" py-1.5"}, e("span",null,"Peças contadas"),
          e("span",{className:"flex shrink-0 items-center gap-1.5"},
            e("button",{type:"button", "aria-label":"Menos uma peça", onClick:function(){ muda(String((parseInt(contadas, 10)||0)-1)); }, className:"grid size-8 place-items-center rounded-lg border border-[#C9A13B] bg-white text-[16px] font-semibold text-[#3B2F0B]"},"−"),
            e("input",{value:contadas, inputMode:"numeric", placeholder:"0", "aria-label":"Total de peças contadas", onChange:function(ev){ muda(ev.target.value.replace(/\D/g,"")); }, className:"h-8 w-16 rounded-lg border border-[#C9A13B]/70 bg-white px-2 text-center text-[16px] font-semibold text-[#111827] outline-none"}),
            e("button",{type:"button", "aria-label":"Mais uma peça", onClick:function(){ muda(String((parseInt(contadas, 10)||0)+1)); }, className:"grid size-8 place-items-center rounded-lg border border-[#C9A13B] bg-white text-[16px] font-semibold text-[#3B2F0B]"},"+")))),
      e("button",{key:"okq", type:"button", disabled:!temTotal, onClick:function(){ d({type:"CONF_QTD", kitId:k.id, total:parseInt(contadas, 10)||0}); }, className:B1}, "Confirmar a quantidade"),
      e("button",{key:"vq", type:"button", onClick:function(){ setSoContagem(false); }, className:B2}, "Voltar"));
  }
  // 2) kit liberado: escolher como conferir
  if(!conf.ini && !conf.fim) return pagina(topo(), resumo,
    e("button",{key:"ini", type:"button", onClick:function(){ d({type:"CONF_INICIAR", kitId:k.id}); }, className:B1}, "Bipar com a câmera"),
    e("button",{key:"cont", type:"button", onClick:function(){ setSoContagem(true); }, className:B2}, "Conferir por contagem"));
  // 4) resultado
  if(conf.fim){ var r = conf.resultado || {}, bom = !r.erros;
    return pagina(topo(),
      e("div",{key:"res", className:"flex shrink-0 flex-col gap-0.5 border px-3 py-1.5 text-[13px] leading-snug "+(bom ? "border-[#16A34A]/50 bg-[#F0FDF4] text-[#15803D]" : "border-[#DC2626] bg-[#FEF2F2] text-[#991B1B]")},
        e("b",{className:"font-semibold"}, "Conferidas "+(r.lidas||0)+" de "+(r.esperadas||0)+" peças"),
        r.nFaltas>0 && e("span",null, r.porQuantidade ? "Faltaram "+r.nFaltas+" peça(s) no total." : "Faltaram "+r.nFaltas+" peça(s): "+(r.faltas||[]).map(function(f){ return f.codigo+(f.qtd>1 ? " (×"+f.qtd+")" : ""); }).join(", ")),
        r.nSobras>0 && e("span",null, r.porQuantidade ? "Sobraram "+r.nSobras+" peça(s) no total." : "Peça(s) de outro kit, só registradas: "+(r.sobras||[]).map(function(x){ return nome(x.codigo).codigo; }).join(", ")),
        !bom && bipadora && e("span",null, "Registrado como erro de "+bipadora+", que bipou o kit.")),
      r.porQuantidade && r.erros>0 && e("div",{key:"nota", className:CAIXA+" shrink-0 gap-1.5 px-3 py-2"},
        conf.nota ? e("span",{className:"text-[13px] text-[#111827]"}, "Peças que faltaram: "+conf.nota)
          : e(React.Fragment,null,
              e("input",{value:notaTxt, maxLength:200, placeholder:"Peças que faltaram (opcional)", "aria-label":"Peças que faltaram", onChange:function(ev){ setNotaTxt(ev.target.value); }, className:"h-8 w-full rounded-lg border border-[#C9A13B]/70 bg-white px-3 text-[13px] text-[#111827] outline-none"}),
              e("button",{type:"button", disabled:!notaTxt.trim(), onClick:function(){ d({type:"CONF_NOTA", kitId:k.id, nota:notaTxt.trim()}); setNotaTxt(""); }, className:B2+" disabled:opacity-40"}, "Salvar anotação"))),
      p.onContinuar && e("button",{key:"segue", type:"button", onClick:p.onContinuar, className:B1}, "Continuar"),
      e("button",{key:"denovo", type:"button", onClick:function(){ setSoContagem(false); setContadas(""); d({type:"CONF_REINICIAR", kitId:k.id}); }, className:B2}, "Conferir de novo"));
  }
  // 3) bipando
  var ler = function(c0){
    var cod = String(c0||"").trim().toUpperCase().replace(/\s+/g, ""); if(!cod) return;
    var sei = conhecido(cod), cod2 = sei && sei.codigo ? sei.codigo : cod, novo = bipar(conds, conf, cod2);
    if(novo.ultimo && novo.ultimo.tipo==="ok") bipeOk(); else bipeErro();   // bip de sucesso só quando a peça é reconhecida e registrada
    d({type:"CONF_BIPAR", kitId:k.id, codigo:cod2});
  };
  var pares = function(a, n){ var m = n===1 ? 1 : 2, o = []; for(var q = 0; q<a.length; q += m) o.push(a.slice(q, q+m)); return o; };
  var cats = [], ixc = {};
  conds.forEach(function(c){ c.grupos.forEach(function(g){ if(!(g.cod in ixc)){ ixc[g.cod] = cats.length; cats.push({cod:g.cod, nome:g.nome, its:[]}); } g.itens.forEach(function(i){ cats[ixc[g.cod]].its.push({c:c, i:i}); }); }); });
  var vis = cats.map(function(g){ return {cod:g.cod, nome:g.nome, all:g.its, its:g.its.filter(function(x){ var l = lido(x.c, x.i); return fil==="conferidas" ? l>0 : fil==="pendentes" ? l<x.i.qtd : true; })}; }).filter(function(g){ return g.its.length; });
  var ult = conf.ultimo;
  return e("div",{className:"flex h-full min-h-0 flex-col gap-1"},
    e("div",{className:"flex shrink-0 flex-col gap-1"},
      topo(e("div",{className:"grid grid-cols-3 gap-px border-t border-[#E4D3A3] bg-[#E4D3A3]"}, [["todas","Todas",tot.pecas],["pendentes","Pendentes",pendentes],["conferidas","Conferidas",conferidas]].map(function(o){ var on = fil===o[0];
        return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ setFil(o[0]); }, className:"flex h-7 min-w-0 items-center justify-center gap-1.5 text-[13px] "+(on ? "bg-[#C9A13B] text-[#1F1B0E]" : "bg-white text-[#8A6A12]")}, e("span",null,o[1]), e("b",{className:"font-semibold"}, String(o[2]))); }))),
      e(CameraBipagem,{aoLer:ler}),
      e("form",{onSubmit:function(ev){ ev.preventDefault(); if(codigo.trim()) ler(codigo); setCodigo(""); setTimeout(function(){ var el = document.getElementById("conf-kit-codigo"); if(el) el.focus(); }, 0); }, className:"grid gap-[6px]", style:{gridTemplateColumns:"minmax(0, 3fr) repeat(2, minmax(0, 1fr))"}},
        e("input",{id:"conf-kit-codigo", enterKeyHint:"go", autoComplete:"off", inputMode:"text", value:codigo, onChange:function(ev){ setCodigo(ev.target.value); }, placeholder:"Código da peça", autoCapitalize:"characters", className:"h-8 w-full min-w-0 rounded-lg bg-white px-3 text-left text-[13px] text-[#111827] outline-none border border-[#C9A13B]/70"}),
        e("button",{type:"submit", className:BT+" bg-[#C9A13B] text-[#1F1B0E]"},"Bipar"),
        e("button",{type:"button", onClick:function(){ setColunas(colunas===1 ? 2 : 1); }, className:BT+" border border-[#C9A13B] bg-white text-[#3B2F0B]"}, colunas===1 ? "2 colunas" : "1 coluna")),
      (function(u){ if(!u) return null;
        if(u.tipo==="ok") return e(AvisoBip,{aviso:{tipo:"ok", codigo:u.codigo, valor:u.valor, texto:descBonita(u.desc) || "Sem descrição"}});
        if(u.tipo==="repetida") return e(AvisoBip,{aviso:{tipo:"repetida", codigo:u.codigo, texto:"Peça já conferida"}});
        var n = nome(u.codigo);
        return e(AvisoBip,{aviso: n.achou===null ? {tipo:"buscando", codigo:u.codigo, texto:"Identificando a peça"} : n.achou ? {tipo:"fora", codigo:n.codigo, texto:"Peça fora deste kit"} : {tipo:"nao", codigo:u.codigo, texto:"Código não localizado no cadastro"}}); })(ult)),
    e("div",{ref:listaRef, className:"flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto border border-[#C9A13B]/60 p-1", style:{overscrollBehavior:"contain"}},
      vis.map(function(g){ var gf = g.all.reduce(function(t, x){ return t+lido(x.c, x.i); }, 0), gt = g.all.reduce(function(t, x){ return t+x.i.qtd; }, 0), fech = !!fechados[g.cod];
        return e("div",{key:g.cod, className:"flex shrink-0 flex-col border border-[#C9A13B]/50 bg-white"},
          e("button",{type:"button", "aria-expanded":!fech, onClick:function(){ setFechados(function(o){ var n = Object.assign({}, o); if(n[g.cod]) delete n[g.cod]; else n[g.cod] = true; return n; }); }, className:"flex h-8 w-full items-center justify-between bg-[#F3EAD3] px-3 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null,g.nome), e("span",{className:gf===gt ? "text-[#15803D]" : ""}, gf+"/"+gt)),
          !fech && pares(g.its, colunas).map(function(par, pi){ var aberto = par.filter(function(x){ return descAberta===x.c.numero+"|"+x.i.codigo; })[0];
            return e("div",{key:"p"+pi, className:"flex flex-col border-t border-[#E8DCC0]"},
              e("div",{className:"grid divide-[#E8DCC0] "+(colunas===2 ? "grid-cols-1 min-[360px]:grid-cols-2 min-[360px]:divide-x" : "grid-cols-1")}, par.map(function(x){ var c = x.c, i = x.i, l = lido(c, i), ok = l>=i.qtd, ch = c.numero+"|"+i.codigo, sel = descAberta===ch;
                return e("div",{key:ch, role:"button", tabIndex:0, "aria-expanded":sel, onClick:function(){ setDescAberta(function(a){ return a===ch ? "" : ch; }); }, className:"flex h-10 min-w-0 cursor-pointer touch-manipulation select-none items-center gap-2 px-3 text-left outline-none "+(sel ? "relative z-10 ring-2 ring-inset ring-[#C9A13B] bg-[#F8F4EA]" : ok ? "bg-[#F0FDF4]" : l>0 ? "bg-[#FEF9C3]" : "bg-white")},
                  e("span",{className:"grid size-4 shrink-0 place-items-center rounded-full text-[11px] font-bold "+(ok ? "bg-[#16A34A] text-white" : "bg-white ring-1 ring-[#9CA3AF]")}, ok ? "✓" : ""),
                  e("span",{className:"flex min-w-0 items-center gap-1.5 text-[13px] text-[#111827]"}, i.codigo+(i.qtd>1 ? "  "+l+"/"+i.qtd : "")),
                  e("span",{className:"ml-auto whitespace-nowrap text-[13px] text-[#111827]"}, BR(i.valor))); })),
              aberto && (function(x){ var i = x.i;
                return e("div",{className:"flex flex-col gap-1 border-t border-[#C9A13B]/60 bg-[#F8F4EA] px-3 py-2"},
                  e("div",{className:"flex items-center justify-between gap-2 text-[13px] font-semibold text-[#8A6A12]"}, e("span",null, i.codigo), e("span",null, BR(i.valor))),
                  e("span",{className:"text-[13px] leading-snug text-[#374151]"}, descBonita(i.desc) || "Sem descrição")); })(aberto)); })); }),
      (conf.erros||[]).length>0 && e("div",{className:"flex shrink-0 flex-col gap-1 border border-[#DC2626]/50 bg-[#FEF2F2] px-3 py-1.5"},
        e("b",{className:"text-[13px] font-semibold text-[#991B1B]"},"Peças de outro kit, só registradas ("+conf.erros.length+")"), e("span",{className:"text-[13px] text-[#991B1B]"}, conf.erros.map(function(x){ return nome(x.codigo).codigo; }).join(", ")))),
    e("div",{className:"flex shrink-0 flex-col gap-1 border-t border-[#C9A13B]/60 bg-[#F0F1F3] pt-1"},
      confirma && e("div",{className:"flex flex-col gap-1.5 border border-[#C9A13B] bg-[#FBF7EC] px-3 py-2 text-[13px] text-[#3B2F0B]", role:"alertdialog"},
        e("b",{className:"font-semibold"}, pendentes>0 ? "Ainda faltam "+pendentes+" peça(s). Ao finalizar, elas viram erro de quem bipou o kit." : "Tudo conferido. Finalizar a conferência?"),
        e("div",{className:"grid grid-cols-2 gap-[6px]"},
          e("button",{type:"button", onClick:function(){ setConfirma(false); setFil("todas"); }, className:"h-10 rounded-lg border border-[#C9A13B] bg-white text-[13px] font-semibold"}, "Voltar à bipagem"),
          e("button",{type:"button", onClick:function(){ setConfirma(false); d({type:"CONF_FINALIZAR", kitId:k.id}); }, className:"h-10 rounded-lg bg-[#C9A13B] text-[13px] font-semibold text-[#1F1B0E]"}, "Confirmar e finalizar"))),
      !confirma && e("button",{type:"button", onClick:function(){ setConfirma(true); }, className:BT+" border border-[#C9A13B] bg-[#F3E9D0] text-[#3B2F0B]"}, "Finalizar conferência")));
}

export { ConfEntregaKit };
