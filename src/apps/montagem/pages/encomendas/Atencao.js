// Sorelly Admin · montagem — pages/encomendas/Atencao.js
// Ficha do pedido SEPARAR PEÇAS (09/11/2026, Marcus; layout 2): revendedora que precisa de peças separadas, com FOTOS e OBSERVAÇÃO.
// É um pedido normal: entra em NOVO e anda Novo → Separando → Concluída. Não tem botão no cartão: clica no cartão, a ficha abre e tudo se faz aqui (fotos, observação, responsável, etapa).
// Fotos: vão para o servidor (lib/anexo.js, módulo er); o pedido guarda só as chaves. Cola com Ctrl+V ou escolhe do computador (até 20). Regras em domain/encomendas.js (ops aten_*, estado s.er.atencao).
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { formatarDataHora } from "@/apps/montagem/domain/encomendas";
import { chamar } from "@/apps/montagem/lib/api";
import { enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { e, useEffect, useRef, useState } from "@/shared/react";

var MAX_FOTOS = 20;
var ETAPAS_SEP = [["novo", "Novo"], ["separando", "Separando"], ["concluido", "Concluída"]];
var COR = {fotos:"#A78BFA", pedido:"#5B8DEF", etapa:"#2DD4BF"};
var CACHE = {};   // chave do anexo → Promise do data URL (a foto só desce uma vez)
function urlAnexo(k){
  if(!CACHE[k]) CACHE[k] = chamar("GET", "/anexos/"+encodeURIComponent(k)).then(function(r){ return r.url; }, function(x){ delete CACHE[k]; throw x; });
  return CACHE[k];
}
function Foto(p){
  var st = useState(""), u = st[0], poe = st[1];
  useEffect(function(){ var vivo = true; poe(""); if(p.k) urlAnexo(p.k).then(function(x){ if(vivo) poe(x); }, function(){}); return function(){ vivo = false; }; }, [p.k]);
  return u ? e("img",{src:u, alt:p.alt || "Foto da peça", className:p.cls})
    : e("span",{className:"grid place-items-center rounded-md border border-dashed border-border text-[11px] "+(p.cls||"")}, "Carregando");
}
function Bloco(p){
  return e("section",{className:"flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-2.5 ring-1 ring-white/10", style:{borderTop:"3px solid "+p.cor}},
    e("h3",{className:"border-b border-white/10 pb-1 text-center text-[11px] font-medium uppercase tracking-[.07em]"}, p.t), p.children);
}

// a ficha (novo item ou item existente)
function JanelaSeparar(p){
  var E = p.E, item = p.item, nomes = (E.er.revendedoras || []).map(function(r){ return r.nome; });
  var sr = useState(item ? item.rev : ""), rev = sr[0], setRev = sr[1], so = useState(item ? item.obs : ""), obs = so[0], setObs = so[1], sp = useState(item ? (item.resp || "") : ""), resp = sp[0], setResp = sp[1];
  var sf = useState(item ? item.fotos.slice() : []), fotos = sf[0], setFotos = sf[1], se = useState(""), envio = se[0], setEnvio = se[1], si = useState(0), idx = si[0], setIdx = si[1];
  var ocupado = useRef(false), entrada = useRef(null), fotosRef = useRef(fotos);
  fotosRef.current = fotos;
  var etapa = item ? item.status : "novo", iEt = ETAPAS_SEP.map(function(x){ return x[0]; }).indexOf(etapa);
  var enviar = function(arquivos){
    var lista = Array.prototype.slice.call(arquivos || []).filter(function(a){ return /^image\//.test(a.type || ""); });
    if(!lista.length || ocupado.current) return;
    ocupado.current = true; var total = lista.length, feitas = 0, erros = [];
    (function proxima(){
      if(!lista.length){ ocupado.current = false; setEnvio(erros.length ? erros[0] : ""); return; }
      var a = lista.shift(); feitas++; setEnvio("Enviando foto "+feitas+" de "+total+"…");
      if(fotosRef.current.length>=MAX_FOTOS){ erros.push("Máximo de "+MAX_FOTOS+" fotos por pedido."); ocupado.current = false; setEnvio(erros[0]); return; }
      lerArquivo(a).then(function(l){ return enviarAnexo("er", l); }).then(function(r){ var novo = fotosRef.current.concat([{key:r.key, nome:r.nome}]); fotosRef.current = novo; setFotos(novo); setIdx(novo.length-1); }, function(x){ erros.push(x && x.message ? x.message : "Não consegui enviar a foto."); }).then(proxima);
    })();
  };
  useEffect(function(){
    var cola = function(ev){ var arq = []; Array.prototype.forEach.call((ev.clipboardData && ev.clipboardData.items) || [], function(it){ if(it.kind==="file" && /^image\//.test(it.type)){ var f = it.getAsFile(); if(f) arq.push(f); } }); if(arq.length){ ev.preventDefault(); enviar(arq); } };
    var esc = function(ev){ if(ev.key==="Escape") p.fechar(); };
    document.addEventListener("paste", cola); document.addEventListener("keydown", esc);
    return function(){ document.removeEventListener("paste", cola); document.removeEventListener("keydown", esc); };
  }, []);
  var sujo = !item || rev!==item.rev || obs!==item.obs || resp!==(item.resp || "") || JSON.stringify(fotos.map(function(f){ return f.key; }))!==JSON.stringify(item.fotos.map(function(f){ return f.key; }));
  var salva = function(){ return item ? E.exec("aten_edit", {id:item.id, rev:rev, obs:obs, fotos:fotos, resp:resp}) : E.exec("aten_add", {rev:rev, obs:obs, fotos:fotos, resp:resp}); };
  var salvar = function(){ if(salva()) p.fechar(); };
  var mover = function(para){ if(sujo && !salva()) return; if(E.exec("aten_status", {id:item.id, para:para})) p.fechar(); };
  var atual = fotos[Math.min(idx, Math.max(fotos.length-1, 0))];
  var respOps = p.resps || [];
  var fotosBloco = e(Bloco,{t:"Fotos · "+fotos.length, cor:COR.fotos},
    atual ? e("div",{className:"flex min-h-40 items-center justify-center rounded-lg bg-black/30 p-1"}, e(Foto,{k:atual.key, cls:"max-h-[46vh] w-full rounded-md object-contain", alt:"Foto "+(idx+1)+" de "+rev}))
      : e("div",{className:"grid min-h-40 place-items-center rounded-lg border border-dashed border-border p-3 text-center text-[13px]"}, "Nenhuma foto ainda. Cole com Ctrl+V ou clique em Adicionar fotos."),
    fotos.length>0 && e("div",{className:"grid gap-1.5", style:{gridTemplateColumns:"repeat(auto-fill, minmax(4.5rem, 1fr))"}}, fotos.map(function(f, i){
      return e("button",{key:f.key, type:"button", title:"Foto "+(i+1), onClick:function(){ setIdx(i); }, className:"aspect-square overflow-hidden rounded-md ring-1 "+(i===Math.min(idx, fotos.length-1) ? "ring-2 ring-primary" : "ring-white/15 hover:ring-white/40")}, e(Foto,{k:f.key, cls:"size-full object-cover", alt:"Miniatura "+(i+1)})); })),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      fotos.length>1 && e(Botao,{onClick:function(){ setIdx((idx+fotos.length-1)%fotos.length); }}, "‹ Anterior"),
      fotos.length>1 && e("span",{className:"text-[13px] tabular-nums"}, (Math.min(idx, fotos.length-1)+1)+" de "+fotos.length),
      fotos.length>1 && e(Botao,{onClick:function(){ setIdx((idx+1)%fotos.length); }}, "Próxima ›"),
      atual && e(Botao,{onClick:function(){ setFotos(fotos.filter(function(x){ return x.key!==atual.key; })); setIdx(0); }}, "Tirar esta foto"),
      e(Botao,{onClick:function(){ if(entrada.current) entrada.current.click(); }, desabilitado:fotos.length>=MAX_FOTOS}, "Adicionar fotos"),
      e("input",{ref:entrada, type:"file", accept:"image/*", multiple:true, className:"hidden", onChange:function(ev){ enviar(ev.target.files); ev.target.value = ""; }})),
    e("p",{className:"text-center text-[13px]"}, envio || "Ou cole as fotos com Ctrl+V. "+fotos.length+" de "+MAX_FOTOS+"."));
  var pedidoBloco = e(Bloco,{t:"Pedido", cor:COR.pedido},
    e("div",{className:"min-w-0"}, e(Rotulo,{t:"Revendedora", id:"sep-rev"}),
      e("input",{id:"sep-rev", list:"sep-nomes", value:rev, onChange:function(ev){ setRev(ev.target.value); }, placeholder:"Nome da revendedora", className:CAMPO}),
      e("datalist",{id:"sep-nomes"}, nomes.slice(0, 400).map(function(n){ return e("option",{key:n, value:n}); }))),
    e("div",{className:"min-w-0"}, e(Rotulo,{t:"Responsável", id:"sep-resp"}),
      e("select",{id:"sep-resp", value:resp, onChange:function(ev){ setResp(ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Sem responsável"), respOps.map(function(n){ return e("option",{key:n, value:n}, n); }))),
    e("div",{className:"min-w-0"}, e(Rotulo,{t:"Observação", id:"sep-obs"}),
      e("textarea",{id:"sep-obs", value:obs, rows:3, maxLength:400, onChange:function(ev){ setObs(ev.target.value); }, placeholder:"Ex.: dourado, é para ela mesma", className:CAMPO+" h-auto! w-full resize-none py-2"})),
    item && e("p",{className:"text-center text-[11px]"}, "Aberto por "+(item.por || "—")+" em "+formatarDataHora(item.em)));
  var etapaBloco = e(Bloco,{t:"Etapa", cor:COR.etapa},
    e("ol",{className:"flex flex-col overflow-hidden rounded-md border border-border"}, ETAPAS_SEP.map(function(x, i){
      var atualE = i===iEt, feita = i<iEt;
      return e("li",{key:x[0], className:"flex h-8 items-center gap-2 px-3 text-[13px] "+(i ? "border-t border-border " : "")+(atualE ? "bg-primary/20 font-semibold text-primary" : feita ? "bg-success/10" : "")}, e("span",{className:"w-5 text-center tabular-nums"}, feita ? "✓" : String(i+1)), x[1]); })),
    item && item.hist && item.hist.length>1 && e("ul",{className:"flex flex-col gap-0.5 text-[11px]"}, item.hist.slice().reverse().slice(0, 4).map(function(h, i){ return e("li",{key:i}, formatarDataHora(h.em)+" · "+h.por+" · "+(ETAPAS_SEP.filter(function(x){ return x[0]===h.para; })[0] || [0, h.para])[1]); })));
  var rodape = e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-3"},
    e(Botao,{onClick:p.fechar}, item ? "Fechar" : "Cancelar"),
    item && e(Botao,{onClick:function(){ if(window.confirm("Excluir este pedido?") && E.exec("aten_del", {id:item.id})) p.fechar(); }}, "Excluir"),
    item && iEt>0 && e(Botao,{onClick:function(){ mover(ETAPAS_SEP[iEt-1][0]); }}, "Voltar etapa"),
    e(Botao,{onClick:salvar, principal:!item || (sujo && iEt>=ETAPAS_SEP.length-1), desabilitado:!!item && !sujo}, item ? "Salvar" : "Criar pedido"),
    item && iEt<ETAPAS_SEP.length-1 && e(Botao,{principal:true, onClick:function(){ mover(ETAPAS_SEP[iEt+1][0]); }}, "Avançar › "+ETAPAS_SEP[iEt+1][1]));
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"flex max-h-[94vh] w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 ring-1 ring-white/20"},
      e("div",{className:"flex items-start justify-between gap-3"},
        e("div",null, e("h2",{className:"text-[13px] font-bold"}, item ? item.rev : "Separar peças"), e("p",{className:"text-[11px]"}, item ? "Separar peças · "+ETAPAS_SEP[iEt][1] : "Novo pedido de separar peças. Entra em Novo.")),
        e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"grid size-8 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, "×")),
      e("div",{className:"grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"},
        fotosBloco, e("div",{className:"flex min-w-0 flex-col gap-3"}, pedidoBloco, etapaBloco)),
      rodape));
}
export { JanelaSeparar, ETAPAS_SEP };
