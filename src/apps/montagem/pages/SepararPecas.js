// Sorelly Admin · montagem — pages/SepararPecas.js
// Encomendas e reposições → SEPARAR PEÇAS (13/11/2026, Marcus). No mesmo jeito do Funil de pedidos e do Contas a pagar: um bloco só (BlocoPainel azul), faixa azul no alto com os botões e os números, tabelas na TabelaPlanilha.
// Fluxo: a funcionária tira umas 20 peças do estoque e cola os CÓDIGOS → o sistema busca nome e foto de cada uma na DevMaster (sem foto: ela tira uma na hora) → a IA compara as peças com as FOTOS dos pedidos
// em aberto (Funil, "Separar peças") e sugere qual peça vai para quem → a pessoa confere olhando as duas fotos e confirma. A IA só sugere; confirmar grava em s.er.atencao[].casadas (op aten_casar, domain/encomendas.js).
// Servidor: /api/encomendas/pecas, /api/encomendas/pecas/foto e /api/encomendas/casar (src/server/separar-pecas.js). Precisa de ANTHROPIC_API_KEY no .env.local do servidor.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { chamar } from "@/apps/montagem/lib/api";
import { enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { BTN, SEL } from "@/apps/montagem/pages/Encomendas";
import { urlAnexo } from "@/apps/montagem/pages/encomendas/Atencao";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { e, useEffect, useState } from "@/shared/react";

var CHAVE = "sorelly_separar_pecas_v1";
var MAX_LOTE = 40;
var TAM_TAB = 96;   // foto na tabela: linha alta, para ver a peça sem precisar ampliar (Marcus, 13/11/2026)
var CONF = {alta:"Alta", media:"Média", baixa:"Baixa"};
var BARRA = "flex h-7 items-center justify-between gap-2 border-y border-white/30 bg-[var(--bloco-colunas)] px-2 text-[11px] font-bold uppercase";   // padrao-ok: título de tabela com a altura dos controles da faixa azul, como no Funil
var FOTOS = {};   // código → Promise do data URL da foto da DevMaster (cada foto desce uma vez)
function fotoDevMaster(cod){
  if(!FOTOS[cod]) FOTOS[cod] = chamar("GET", "/encomendas/pecas/foto?cod="+encodeURIComponent(cod)).then(function(r){ return r.url || ""; }, function(x){ delete FOTOS[cod]; throw x; });
  return FOTOS[cod];
}
function lerSalvo(){ try{ var t = window.sessionStorage.getItem(CHAVE); var o = t ? JSON.parse(t) : null; if(o && typeof o==="object") return o; }catch(x){} return {}; }
// a DevMaster guarda o nome em letra maiúscula: aqui aparece normal ("Brinco folheado ouro 18k ...")
function nomeBonito(t){ var s = String(t || "").trim().toLowerCase(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : ""; }
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }

// miniatura: foto de anexo (k), foto da DevMaster (cod) ou nada. Clicável quando recebe aoClicar.
function Miniatura(p){
  var st = useState(""), u = st[0], poe = st[1], sm = useState(false), sem = sm[0], setSem = sm[1];
  useEffect(function(){
    var vivo = true; poe(""); setSem(false);
    var pr = p.k ? urlAnexo(p.k) : p.cod ? fotoDevMaster(p.cod) : Promise.resolve("");
    pr.then(function(x){ if(!vivo) return; if(x) poe(x); else setSem(true); }, function(){ if(vivo) setSem(true); });
    return function(){ vivo = false; };
  }, [p.k, p.cod]);
  var tam = p.tam || 36, cx = p.cheia ? {width:"100%", height:tam} : {width:tam, height:tam};
  // moldura: caixa de tamanho fixo com borda, a foto INTEIRA dentro (object-contain), centralizada, com folga nas bordas
  var moldura = "flex items-center justify-center overflow-hidden rounded-md border border-white/40 bg-black/30 p-1.5 ";
  var corpo = u ? e("span",{style:cx, className:moldura}, e("img",{src:u, alt:p.alt || "Foto", style:{maxWidth:"100%", maxHeight:"100%"}, className:"rounded-sm object-contain"}))
    : e("span",{style:cx, className:moldura+"border-dashed text-[11px]"}, sem ? "Sem foto" : "Abrindo");
  return p.aoClicar && u ? e("button",{type:"button", title:"Ampliar", onClick:p.aoClicar, className:"my-1.5 inline-block cursor-zoom-in"}, corpo) : e("span",{className:"my-1.5 inline-block"}, corpo);
}

function AbaEncSep(){
  var E = useEr(), er = E.er, salvo = lerSalvo();
  var sTx = useState(salvo.texto || ""), texto = sTx[0], setTexto = sTx[1];
  var sPc = useState(salvo.pecas || []), pecas = sPc[0], setPecas = sPc[1];
  var sSg = useState(salvo.sug || {}), sug = sSg[0], setSug = sSg[1];
  var sEs = useState({}), esc = sEs[0], setEsc = sEs[1];
  var sOc = useState(""), ocupado = sOc[0], setOcupado = sOc[1];
  var sAv = useState(""), aviso = sAv[0], setAviso = sAv[1];
  var sRv = useState(""), filtroRev = sRv[0], setFiltroRev = sRv[1];
  var sAm = useState(null), amp = sAm[0], setAmp = sAm[1];
  useEffect(function(){ try{ window.sessionStorage.setItem(CHAVE, JSON.stringify({texto:texto, pecas:pecas, sug:sug})); }catch(x){} }, [texto, pecas, sug]);
  useEffect(function(){ var f = function(ev){ if(ev.key==="Escape") setAmp(null); }; document.addEventListener("keydown", f); return function(){ document.removeEventListener("keydown", f); }; }, []);

  // fotos dos pedidos em aberto (Funil › Separar peças que ainda não foram concluídos)
  var abertos = (er.atencao || []).filter(function(a){ return a.status!=="concluido"; });
  var revs = abertos.map(function(a){ return a.rev; }).filter(function(n, i, l){ return l.indexOf(n)===i; }).sort();
  var fotos = [];
  abertos.forEach(function(a){ if(filtroRev && a.rev!==filtroRev) return; (a.fotos || []).forEach(function(f, i){ fotos.push({itemId:a.id, rev:a.rev, key:f.key, n:i+1, casada:(a.casadas || {})[f.key] || null}); }); });
  var emAberto = fotos.filter(function(x){ return !x.casada; });
  var porCod = {}; pecas.forEach(function(p){ porCod[p.cod] = p; });
  var efetivo = function(x){ if(x.casada) return x.casada.cod; if(esc[x.key]!==undefined) return esc[x.key]; return sug[x.key] && sug[x.key].cod ? sug[x.key].cod : ""; };

  var buscar = function(){
    var lista = texto.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean).filter(function(c, i, l){ return l.indexOf(c)===i; });
    if(!lista.length){ setAviso("Cole os códigos das peças."); return; }
    setOcupado("buscar"); setAviso("");
    chamar("GET", "/encomendas/pecas?cods="+lista.slice(0, MAX_LOTE).join(",")).then(function(r){
      var antes = {}; pecas.forEach(function(p){ antes[p.cod] = p; });
      setPecas(r.pecas.map(function(p){ return Object.assign({}, p, {extra:antes[p.cod] ? (antes[p.cod].extra || "") : ""}); })); setSug({}); setEsc({});
      var nao = r.pecas.filter(function(p){ return !p.existe; }).length;
      setAviso((lista.length>MAX_LOTE ? "Usei só os "+MAX_LOTE+" primeiros códigos. " : "")+(nao ? plural(nao, "código não existe", "códigos não existem")+" na DevMaster." : ""));
    }, function(x){ setAviso(x && x.message ? x.message : "Não consegui buscar as peças."); }).then(function(){ setOcupado(""); });
  };
  var comparar = function(){
    var com = pecas.filter(function(p){ return p.existe; }), lote = emAberto.slice(0, MAX_LOTE);
    if(!com.length){ setAviso("Busque as peças primeiro."); return; }
    if(!lote.length){ setAviso("Não há foto de pedido em aberto para comparar."); return; }
    var extras = {}; com.forEach(function(p){ if(p.extra) extras[p.cod] = p.extra; });
    setOcupado("comparar"); setAviso("");
    chamar("POST", "/encomendas/casar", {fotos:lote.map(function(x){ return {id:x.itemId, rev:x.rev, key:x.key}; }), pecas:com.map(function(p){ return {cod:p.cod, desc:p.desc}; }), extras:extras}).then(function(r){
      var n = Object.assign({}, sug); r.resultados.forEach(function(x){ n[x.key] = x; }); setSug(n);
      var ach = r.resultados.filter(function(x){ return x.cod; }).length;
      setAviso("Comparei "+plural(r.fotosLidas, "foto", "fotos")+": "+plural(ach, "tem peça sugerida", "têm peça sugerida")+"."+(emAberto.length>lote.length ? " Faltam "+(emAberto.length-lote.length)+": confirme e compare de novo." : ""));
    }, function(x){ setAviso(x && x.message ? x.message : "A IA não respondeu."); }).then(function(){ setOcupado(""); });
  };
  var confirmar = function(x, cod, via){ if(!cod) return false; var ok = E.exec("aten_casar", {id:x.itemId, key:x.key, cod:cod, via:via}); if(ok) setEsc(function(o){ var n = Object.assign({}, o); delete n[x.key]; return n; }); return ok; };
  var desfazer = function(x){ E.exec("aten_casar", {id:x.itemId, key:x.key, cod:""}); };
  var confirmarAltas = function(){ var n = 0; emAberto.forEach(function(x){ var sg = sug[x.key]; if(sg && sg.cod && sg.confianca==="alta" && esc[x.key]===undefined && porCod[sg.cod]){ confirmar(x, sg.cod, "ia"); n++; } }); setAviso(n ? plural(n, "peça confirmada", "peças confirmadas")+"." : "Nenhuma sugestão de confiança alta para confirmar."); };
  var limpar = function(){ setTexto(""); setPecas([]); setSug({}); setEsc({}); setAviso(""); };
  var adicionarFoto = function(cod, arq){
    if(!arq) return; setAviso("Enviando a foto de "+cod+".");
    lerArquivo(arq).then(function(l){ return enviarAnexo("er", l); }).then(function(r){ setPecas(function(l){ return l.map(function(p){ return p.cod===cod ? Object.assign({}, p, {extra:r.key}) : p; }); }); setAviso("Foto de "+cod+" guardada. Compare de novo."); }, function(x){ setAviso(x && x.message ? x.message : "Não consegui enviar a foto."); });
  };

  var semFoto = pecas.filter(function(p){ return p.existe && !p.temFoto && !p.extra; }).length;
  var sugeridas = emAberto.filter(function(x){ return sug[x.key] && sug[x.key].cod; }).length;

  // tabela 1: peças na mão
  var destinos = {};
  fotos.forEach(function(x){ var c = efetivo(x); if(c) (destinos[c] = destinos[c] || []).push({rev:x.rev, ok:!!x.casada}); });
  var linhasP = pecas.map(function(p){ var d = destinos[p.cod] || [];
    return {id:p.cod, p:p, cod:p.cod, desc:nomeBonito(p.desc) || (p.existe ? "" : "Não existe na DevMaster"), situ:!p.existe ? "Não existe" : p.temFoto ? "Foto da DevMaster" : p.extra ? "Foto tirada agora" : "Sem foto",
      vai:d.length ? d.map(function(y){ return y.rev+(y.ok ? " ✓" : " (sugestão)"); }).join(" · ") : "—", todosOk:d.length>0 && d.every(function(y){ return y.ok; })}; });
  var colsP = [
    {k:"foto", t:"Foto", render:function(v, l){ return e(Miniatura,{tam:TAM_TAB, cod:l.p.extra ? "" : l.p.temFoto ? l.cod : "", k:l.p.extra || "", alt:l.cod, aoClicar:function(){ setAmp({cod:l.cod, key:""}); }}); }},
    {k:"cod", t:"Código"},
    {k:"vai", t:"Vai para", cor:function(l){ return l.todosOk ? "text-success" : ""; }},
    {k:"desc", t:"Peça"},
    {k:"situ", t:"Foto da peça", cor:function(l){ return l.situ==="Não existe" ? "text-destructive" : l.situ==="Sem foto" ? "text-[var(--negativo)] font-semibold" : ""; },
      render:function(v, l){ if(l.p.existe && !l.p.temFoto && !l.p.extra) return e("label",{className:BTN+" inline-flex cursor-pointer items-center"}, "Tirar foto", e("input",{type:"file", accept:"image/*", capture:"environment", className:"hidden", onChange:function(ev){ adicionarFoto(l.cod, ev.target.files && ev.target.files[0]); ev.target.value = ""; }})); return v; }}];

  // tabela 2: fotos dos pedidos
  var linhasF = fotos.map(function(x){ var sg = sug[x.key], c = efetivo(x), pc = c ? porCod[c] : null;
    return {id:x.itemId+":"+x.key, x:x, rev:x.rev, foto:x.n, sugerida:x.casada ? x.casada.cod : sg ? (sg.cod || "Nenhuma") : "—", conf:x.casada ? "Confirmada" : sg && sg.cod ? CONF[sg.confianca] : "—",
      peca:c, nome:pc ? nomeBonito(pc.desc) : "", situ:x.casada ? "Separada" : "Em aberto"}; });
  var colsF = [
    {k:"rev", t:"Revendedora"},
    {k:"foto", t:"Foto do pedido", render:function(v, l){ return e(Miniatura,{tam:TAM_TAB, k:l.x.key, alt:"Foto "+l.x.n+" de "+l.rev, aoClicar:function(){ setAmp({cod:efetivo(l.x), key:l.x.key}); }}); }},
    {k:"sugerida", t:"Sugestão da IA"},
    {k:"conf", t:"Confiança", cor:function(l){ return l.x.casada ? "text-success" : l.conf==="Baixa" ? "text-[var(--negativo)]" : ""; }},
    {k:"peca", t:"Peça escolhida", render:function(v, l){
      if(l.x.casada) return e("span",{className:"font-semibold text-success"}, l.x.casada.cod);
      return e("select",{"aria-label":"Peça escolhida", value:v || "", onChange:function(ev){ var val = ev.target.value; setEsc(function(o){ var n = Object.assign({}, o); n[l.x.key] = val; return n; }); }, className:SEL},
        e("option",{value:""}, "Nenhuma"), pecas.filter(function(p){ return p.existe; }).map(function(p){ return e("option",{key:p.cod, value:p.cod, title:p.desc}, p.cod); })); }},
    {k:"situ", t:"Situação", render:function(v, l){
      if(l.x.casada) return e("button",{type:"button", onClick:function(){ desfazer(l.x); }, className:BTN}, "Desfazer");
      return e("button",{type:"button", disabled:!l.peca, onClick:function(){ confirmar(l.x, l.peca, esc[l.x.key]!==undefined ? "mao" : "ia"); }, className:BTN+" disabled:opacity-40"}, "Confirmar"); }},
    {k:"nome", t:"Peça"}];

  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("button",{type:"button", disabled:!!ocupado, onClick:buscar, className:BTN+" disabled:opacity-50"}, ocupado==="buscar" ? "Buscando" : "Buscar peças"),
    e("button",{type:"button", disabled:!!ocupado || !pecas.length, onClick:comparar, className:BTN+" !bg-white !text-[#14233f] disabled:opacity-50"}, ocupado==="comparar" ? "Comparando" : "Comparar com os pedidos"),
    e("button",{type:"button", disabled:!!ocupado || !sugeridas, onClick:confirmarAltas, className:BTN+" disabled:opacity-50"}, "Confirmar as de confiança alta"),
    e("select",{"aria-label":"Pedido", value:filtroRev, onChange:function(ev){ setFiltroRev(ev.target.value); }, className:SEL}, e("option",{value:""}, "Pedido: todos"), revs.map(function(n){ return e("option",{key:n, value:n}, n); })),
    (texto || pecas.length>0) && e("button",{type:"button", onClick:limpar, className:BTN}, "Limpar"),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px] tabular-nums"}, "Peças ", e("b",null, String(pecas.length)), " · Sem foto ", e("b",{className:semFoto>0 ? "text-[var(--negativo)]" : ""}, String(semFoto)), " · Fotos em aberto ", e("b",null, String(emAberto.length)), " · Sugeridas ", e("b",null, String(sugeridas))));

  var sg = amp && amp.key ? sug[amp.key] : null, fx = amp && amp.key ? fotos.filter(function(x){ return x.key===amp.key; })[0] : null, pa = amp && amp.cod ? porCod[amp.cod] : null;
  var lupa = amp && e("div",{className:"fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-3", onClick:function(){ setAmp(null); }},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"flex max-h-[94vh] w-full max-w-4xl flex-col gap-2 overflow-y-auto rounded-xl bg-card p-3 ring-1 ring-white/20"},
      e("div",{className:"flex items-center justify-between gap-3"},
        e("b",{className:"text-[13px]"}, fx ? "Pedido de "+fx.rev+" · foto "+fx.n : "Peça "+amp.cod),
        e("button",{type:"button", "aria-label":"Fechar", onClick:function(){ setAmp(null); }, className:"grid size-8 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, "×")),
      e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2"},
        fx && e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-[11px] font-bold uppercase"}, "Foto do pedido"), e(Miniatura,{k:fx.key, tam:400, cheia:true, alt:"Foto do pedido"})),
        (pa || (!fx && amp.cod)) && e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-[11px] font-bold uppercase"}, "Peça "+amp.cod+(pa && pa.desc ? " · "+nomeBonito(pa.desc) : "")), e(Miniatura,{cod:pa && pa.extra ? "" : amp.cod, k:pa && pa.extra ? pa.extra : "", tam:400, cheia:true, alt:"Foto da peça"}))),
      sg && e("p",{className:"text-[13px]"}, (sg.cod ? "Sugestão: "+sg.cod+" · confiança "+(CONF[sg.confianca] || "—").toLowerCase() : "A IA não achou peça igual")+(sg.motivo ? ". "+sg.motivo : "")+(sg.alternativas && sg.alternativas.length ? " Outras opções: "+sg.alternativas.join(", ")+"." : "")),
      fx && !fx.casada && amp.cod && e("div",{className:"flex justify-center"}, e("button",{type:"button", onClick:function(){ if(confirmar(fx, amp.cod, esc[fx.key]!==undefined ? "mao" : "ia")) setAmp(null); }, className:BTN+" !bg-white !text-[#14233f]"}, "Confirmar "+amp.cod+" para "+fx.rev))));

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Separar peças"},
      faixa,
      e("div",{className:"flex flex-col gap-1 border-b border-white/30 p-2"},
        e("textarea",{value:texto, rows:2, onChange:function(ev){ setTexto(ev.target.value); }, "aria-label":"Códigos das peças", placeholder:"Cole os códigos das peças tiradas do estoque (um por linha, ou separados por espaço ou vírgula)", className:CAMPO+" h-auto! w-full resize-none py-1.5"}),
        aviso && e("p",{className:"text-[13px]"}, aviso)),
      pecas.length>0 && e("div",null, e("div",{className:BARRA}, e("span",null, "Peças na mão · "+pecas.length)),
        e(TabelaPlanilha,{key:"pecas", cols:colsP, linhas:linhasP, chave:"id", grade:true, semContagem:true, vazio:"Nenhuma peça."})),
      e("div",null, e("div",{className:BARRA}, e("span",null, "Fotos dos pedidos · "+fotos.length)),
        fotos.length ? e(TabelaPlanilha,{key:"fotos", cols:colsF, linhas:linhasF, chave:"id", grade:true, semContagem:true, limite:300, vazio:"Nenhuma foto."})
          : e("p",{className:"p-3 text-center text-[13px]"}, "Nenhum pedido de Separar peças em aberto. Lance as fotos no Funil de pedidos."))),
    lupa);
}
export { AbaEncSep };
