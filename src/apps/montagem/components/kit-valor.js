// Sorelly Admin · montagem e bipagem — components/kit-valor.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { media3, sugerido } from "@/apps/montagem/domain/vendas";
import { BK, durCurta, hora } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO, brl } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

function KitValor(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var semValor = k.status==="semvalor", padrao = s.cfg.kitInicial;
  var ed = useState(false), editando = ed[0], setEd = ed[1];
  var vl = useState(k.valor||padrao), val = vl[0], setVal = vl[1];
  var editavel = !p.ro && (semValor || k.status==="pendente");
  var salvar = function(){ if(val>0){ d({type:"DEFINIR_VALOR", id:k.id, valor:val}); } setEd(false); };
  if(editando) return e("div",{className:"flex items-center justify-center gap-1"},
    e("input",{inputMode:"numeric", autoFocus:true, value:brl(val), "aria-label":"Valor do kit",
      className:INPUT+" h-8! w-[6.5rem] px-2! text-center text-sm! "+MONO,
      onChange:function(ev){ var n = ev.target.value.replace(/\D/g,"").slice(0,11); setVal(Number(n||0)/100); },
      onKeyDown:function(ev){ if(ev.key==="Enter") salvar(); if(ev.key==="Escape") setEd(false); },
      onBlur:salvar}));
  var txt = e("span",{className:MONO+" font-semibold "+(semValor?"text-destructive":"text-primary")}, BK(semValor ? padrao : k.valor));
  if(!editavel) return e("div",{className:"text-center"}, txt);
  return e("div",{className:"text-center"},
    e("button",{onClick:function(){ setVal(k.valor||padrao); setEd(true); }, title: semValor ? "Sem valor definido, clique para definir" : "Clique para alterar",
      className:"rounded px-1 -mx-1 underline-offset-4 hover:bg-muted hover:underline"}, txt));
}
// Eventos do kit (vendas, valor, montagem, bipagem, retirada) em lista, para a linha do tempo e para a ficha da Listagens. comValor=false (montadora e bipadora) tira todo dinheiro.
function eventosDoKit(s, k, comValor){
  var ev = [], sug = sugerido(k.vendas, s.cfg);
  // vendas[0] = m\u00eas atual (app da representante); vendas[1..2] = meses anteriores (DevMaster)
  // Valor automático (16/11/2026): as 3 vendas vêm TODAS da DevMaster (a mais recente primeiro); só o kit antigo, digitado na representante, tem a venda do mês do app.
  var daDev = !!(k.cond && k.cond.valorBuscaEm);
  var ORIGEM = daDev ? ["venda mais recente (DevMaster)","venda anterior (DevMaster)","venda mais antiga (DevMaster)"] : ["m\u00eas atual (app)","m\u00eas anterior (DevMaster)","2 meses atr\u00e1s (DevMaster)"];
  if(comValor) ev.push(["Vendas", k.vendas.length ? k.vendas.map(function(v,i){return ORIGEM[i]+" "+BK(v);}).join(", ")+". M\u00e9dia "+BK(media3(k.vendas))+", tabela de estoque "+(s.cfg.tabelaAtiva==="baixo"?"baixo":"alto")+", sugerido "+BK(sug)+"."
    +(!daDev && k.vendas[0] < s.cfg.minVendaApp ? " Venda do m\u00eas abaixo de "+BK(s.cfg.minVendaApp)+": a representante pode informar o valor manualmente." : "") : "Revendedora nova, sem vendas"]);
  // (o "O que enviar" não aparece aqui: a lista de peças é da MONTAGEM, no celular da montadora, junto das preferências da revendedora; ver components/etiqueta.js)
  if(comValor && k.valor) ev.push([k.defAuto ? "Valor autom\u00e1tico" : "Valor definido", k.defAuto ? BK(k.valor)+", m\u00e9dia das vendas pela tabela de kit, \u00e0s "+hora(k.defEm) : BK(k.valor)+" por "+nomeDe(k.defPor)+" \u00e0s "+hora(k.defEm)+(k.manual?", diferente da sugest\u00e3o":"")]);
  if(k.designada) ev.push(["Designado","Para "+nomeDe(k.designada)]);
  if(k.iniM) ev.push(["Montagem", nomeDe(k.montId)+", in\u00edcio "+hora(k.iniM)+(k.fimM?", fim "+hora(k.fimM)+", "+durCurta(k.tempoM)+(k.pausaMs>60000?" (pausa de "+durCurta(k.pausaMs)+")":""):", em andamento")]);
  if(k.motivo) ev.push(["Ajuste pedido", k.motivo]);
  if(k.supEm && !k.motivo) ev.push(["Confer\u00eancia","Liberado por "+nomeDe(k.supId)+" \u00e0s "+hora(k.supEm)]);
  if(k.iniB) ev.push(["Bipagem", nomeDe(k.bipId)+", in\u00edcio "+hora(k.iniB)+(k.fimB?", fim "+hora(k.fimB)+(comValor ? ", valor "+BK(k.valorReal)+(k.corrigido?" (corrigido)":"") : ""):", em andamento")]);
  if(k.retEm) ev.push(["Retirada","\u00c0s "+hora(k.retEm)+", entregue por "+nomeDe(k.retPor)+(k.retSozinha?", retirou sozinha":"")+(k.retConf?", confirmada com "+k.retConf:"")]);
  return ev;
}
function LinhaTempo(p){
  var s = use().state, ev = eventosDoKit(s, p.k, true);
  return e("ol",{className:"ml-2 flex flex-col gap-1.5 border-l-2 border-primary pl-4"},
    ev.map(function(x,i){ return e("li",{key:i, className:"flex gap-3 text-sm"}, e("b",{className:"w-32 shrink-0 text-muted-foreground"}, x[0]), e("span",null, x[1])); }));
}

export { KitValor, LinhaTempo, eventosDoKit };
