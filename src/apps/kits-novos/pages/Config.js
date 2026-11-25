// Sorelly Admin · kits novos Curitiba — pages/Config.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ehIdAnuncio, listaDe, recusasDosKits, repBloqueada } from "@/apps/kits-novos/domain/config";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { ETAPAS } from "@/apps/kits-novos/domain/etapas";
import { use } from "@/apps/kits-novos/state/context";
import { Btn } from "@/apps/kits-novos/ui/button";
import { Card } from "@/apps/kits-novos/ui/card";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { INPUT, MONO, MoneyInput, NumInput } from "@/apps/kits-novos/ui/input";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e, useEffect, useState } from "@/shared/react";

// Kommo → Kits novos (25/11/2026): situação da busca automática e botão para buscar agora (rota /api/kommo/kits-novos)
function BlocoKommo(p){
  var st = useState(null), info = st[0], set = st[1], ocup = useState(false), busy = ocup[0], setBusy = ocup[1];
  var ler = function(){ if(apiAtiva()) chamar("GET", "/kommo/kits-novos").then(set).catch(function(){ set({erro:true}); }); };
  useEffect(function(){ ler(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var u = info && (info.ultima || (info.estado && Object.assign({em:info.estado.em}, info.estado.ultima)));
  var li = function(r, v){ return e("div",{key:r, className:"flex items-center justify-between gap-3 text-[13px]"}, e("span",null, r), e("b",null, v)); };
  return e(p.Bloco,{t:"Kommo (entrada dos kits novos)"},
    e("p",{className:"text-[13px]"}, "A revendedora aprovada na Kommo entra sozinha em Cadastrada. Quando o Cadastro move o lead para \"kit liberado\" na Kommo, o kit passa para Liberado."),
    !info ? li("Situação", "Lendo…") : info.erro ? li("Situação", "Sem acesso") : li("Situação", info.ligado ? "Ligada (a cada 2 minutos)" : "Desligada no servidor"),
    u && li("Última busca", new Date(u.em).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"})),
    u && li("Na última busca", (u.criados||0)+" novas · "+(u.liberados||0)+" liberadas · "+(u.vinculados||0)+" ligadas à planilha"),
    u && (u.erros||[]).length>0 && e("p",{className:"text-[13px] text-destructive"}, (u.erros||[]).join(" | ")),
    e("div",{className:"flex justify-end"}, e(Btn,{ic:"refresh", disabled:busy || !info || !info.ligado, onClick:function(){ setBusy(true); chamar("POST", "/kommo/kits-novos").then(function(r){ set(Object.assign({}, info, {ultima:r})); }).catch(function(){}).then(function(){ setBusy(false); }); }}, busy ? "Buscando…" : "Buscar na Kommo agora")));
}
// Representantes: bloqueio para kits novos (como no admin antigo). Bloqueada = recusas desde o último desbloqueio >= limite, ou bloqueio manual.
function BlocoReps(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = s.cfg, recs = recusasDosKits(s.dados);
  var nomes = listaDe(s.dados.filter(function(c){ return c.rep && !/^Sorelly/.test(c.rep); }), "rep");
  recs.forEach(function(r){ if(nomes.indexOf(r.rep)<0) nomes.push(r.rep); });
  return e(p.Bloco,{t:"Representantes (bloqueio para kits novos)"},
    e("label",{className:"flex items-center justify-between gap-3"}, e("span",{className:"text-[13px] font-medium"}, "Recusas que bloqueiam"), e(NumInput,{value:cfg.recusasBloqueio||2, label:"Recusas", onChange:function(v){ d({type:"CFG", campo:"recusasBloqueio", valor:v}); }})),
    e("div",{className:"flex max-h-72 flex-col gap-1 overflow-auto pr-1"}, nomes.map(function(n){
      var aj = (cfg.repBloq||{})[n] || {}, qt = recs.filter(function(r){ return r.rep===n && (!aj.desde || String(r.iso||"")>=aj.desde); }).length, bl = repBloqueada(n, cfg, recs);
      return e("div",{key:n, className:"flex h-8 items-center justify-between gap-2 text-[13px]"},
        e("span",{className:"flex-1"}, n), e("span",{className:"w-24 text-center"}, qt+(qt===1 ? " recusa" : " recusas")),
        e("b",{className:"w-24 text-center "+(bl ? "text-destructive" : "text-success")}, bl ? (aj.bloq===true ? "Bloqueada" : "Bloqueada (recusas)") : "Livre"),
        e(Btn,{v:bl ? "secondary" : "destructive", onClick:function(){ d({type:"REP_BLOQ", nome:n, modo:bl ? "desbloquear" : "bloquear"}); }}, bl ? "Desbloquear" : "Bloquear")); })),
    e("p",{className:"text-[13px]"}, "Desbloquear zera a contagem de recusas da representante."));
}
import React from "react";

function AbaConfig(){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = s.cfg;
  var cf = useState(false), conf = cf[0], setConf = cf[1], nm = useState(""), nov = nm[0], setNov = nm[1];
  var Bloco = function(p){ return e(Card,{className:"flex flex-col gap-3 p-5"}, e("h2",{className:"font-heading text-base font-semibold"}, p.t), p.children); };
  var linha = function(l, ctrl){ return e("label",{className:"flex items-center justify-between gap-3"}, e("span",{className:"text-sm font-medium"}, l), ctrl); };
  // anúncios: o ID vem em entId ou direto na entrada (planilha e Kommo gravam o ID do anúncio do Meta na entrada)
  var idDe = function(c){ return c.entId || (ehIdAnuncio(c.ent) ? c.ent : ""); };
  var campanhas = listaDe(s.dados.map(function(c){ return {id:idDe(c)}; }).filter(function(x){ return x.id; }), "id");
  return e(React.Fragment,null,
    e(PageHead,{t:"Configurador", sub:"Vale para toda a equipe (fica no servidor). Prazos, meta, motivos, campanhas, representantes e Kommo."}),
    e("div",{className:"grid grid-cols-1 gap-4 lg:grid-cols-2"},
      e(Bloco,{t:"Prazos e meta (dias)"}, ETAPAS.slice(0, ETAPAS.length-1).map(function(et){ return linha(et.nome+" at\u00e9 "+ETAPAS[et.n].nome.toLowerCase(), e(NumInput,{value:cfg.prazos[et.k], label:et.nome, onChange:function(v){d({type:"CFG", prazo:et.k, valor:v});}})); }),
        linha("Meta do cadastro \u00e0 entrega", e(NumInput,{value:cfg.metaDias, label:"Meta", onChange:function(v){d({type:"CFG", campo:"metaDias", valor:v});}})),
        linha("Desmarca\u00e7\u00f5es antes de cancelar", e(NumInput,{value:cfg.maxDesmarcacoes, label:"Desmarca\u00e7\u00f5es", onChange:function(v){d({type:"CFG", campo:"maxDesmarcacoes", valor:v});}})),
        linha("Ocultar entregues e canceladas ap\u00f3s", e(NumInput,{value:cfg.ocultarApos, label:"Dias", onChange:function(v){d({type:"CFG", campo:"ocultarApos", valor:v});}}))),
      e(Bloco,{t:"Motivos de cancelamento"},
        e("ul",{className:"flex flex-col gap-1"}, cfg.motivosCancel.map(function(m,i){ return e("li",{key:i, className:"flex items-center justify-between gap-2 text-sm"}, m,
          e("button",{"aria-label":"Remover "+m, onClick:function(){d({type:"CFG", lista:"motivosCancel", valor:cfg.motivosCancel.filter(function(x,j){return j!==i;})});}, className:"grid size-8 place-items-center rounded-lg hover:bg-muted/50"}, e(Icon,{n:"x", s:14}))); })),
        e("div",{className:"flex gap-2"}, e("input",{className:INPUT+" flex-1", placeholder:"Novo motivo", value:nov, onChange:function(ev){setNov(ev.target.value);}}),
          e(Btn,{ic:"plus", disabled:!nov.trim(), onClick:function(){d({type:"CFG", lista:"motivosCancel", valor:cfg.motivosCancel.concat([nov.trim()])}); setNov("");}},"Adicionar"))),
      e(Bloco,{t:"Nome das campanhas (an\u00fancios do Meta)"},
        e("p",{className:"text-[13px] text-muted-foreground"},"Os IDs v\u00eam da planilha e da Kommo. D\u00ea um nome a cada campanha para aparecer no lugar do n\u00famero."),
        e("div",{className:"flex max-h-72 flex-col gap-2 overflow-auto pr-1"}, campanhas.map(function(id){ var n = s.dados.filter(function(c){return idDe(c)===id;}).length;
          return e("div",{key:id, className:"flex items-center gap-2"}, e("span",{className:MONO+" w-44 shrink-0 text-xs text-muted-foreground"}, id), e("span",{className:MONO+" w-8 text-right text-xs"}, n),
            e("input",{className:INPUT+" h-8! flex-1 text-sm!", placeholder:"Nome da campanha", value:cfg.campanhas[id]||"", onChange:function(ev){d({type:"CFG", campanha:id, valor:ev.target.value});}})); }))),
      e(BlocoKommo,{Bloco:Bloco}),
      e(BlocoReps,{Bloco:Bloco}),
      e(Bloco,{t:"Valores e dados"},
        linha("Valor padr\u00e3o do kit novo", e(MoneyInput,{value:cfg.valorPadrao, label:"Valor padr\u00e3o", className:"w-36", onChange:function(v){d({type:"CFG", campo:"valorPadrao", valor:v});}})),
        e("p",{className:"text-[13px] text-muted-foreground"},"Kits at\u00e9 23/11/2026: planilha Kits Novos 2026 (todas as regi\u00f5es). Desde 25/11/2026: aprovados na Kommo."),
        e("div",{className:"flex justify-end"}, e(Btn,{v:"destructive", ic:"trash", onClick:function(){setConf(true);}},"Recarregar planilha original")))),
    e(Modal,{open:conf, titulo:"Recarregar planilha original", sub:"Tudo o que foi alterado no sistema ser\u00e1 perdido.", confirmar:"Recarregar", icone:"trash", perigo:true, onClose:function(){setConf(false);}, onConfirmar:function(){d({type:"RESET"}); setConf(false);}},
      e("p",{className:"text-sm"},"Os 2.005 registros voltam exatamente como est\u00e3o na planilha.")));
}

export { AbaConfig };
