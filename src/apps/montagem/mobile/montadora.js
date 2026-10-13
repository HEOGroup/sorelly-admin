// Sorelly Admin · montagem e bipagem — mobile/montadora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Etiqueta } from "@/apps/montagem/components/etiqueta";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { proximoPara, resumoMontadora } from "@/apps/montagem/domain/regras";
import { kit } from "@/apps/montagem/domain/seed";
import { STATUS_LB, STATUS_TP } from "@/apps/montagem/domain/status";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { TelaLogin } from "@/apps/montagem/components/tela-login";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { Avatar, PONTO_CEL, corDe } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { kitDe, novo } from "@/apps/montagem/state/store";
import { BADGE } from "@/apps/montagem/ui/badge";
import { Vazio } from "@/apps/montagem/ui/card";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

function CelProximo(){
  var cx = use(), s = cx.state, id = s.celular;
  var r = resumoMontadora(s.montadoras.find(function(m){return m.id===id;}), s);
  var prox = proximoPara(id, s);
  var aguardando = s.kits.filter(function(k){return k.montId===id && k.status==="supervisao";}).length;
  var semValor = s.kits.filter(function(k){return k.status==="semvalor";}).length;
  // Fila viva: se outra montadora ficou livre antes e pegou o kit que aparecia aqui, avisa e mostra o próximo na ordem
  var visto = useRef({mont:id, kit:null}), pv = useState(null), passou = pv[0], setPassou = pv[1];
  var proxId = !r.atual && prox.kit ? prox.kit.id : null;
  useEffect(function(){
    var ant = visto.current;
    if(ant.mont===id && ant.kit && ant.kit!==proxId){
      var k = kitDe(s, ant.kit);
      if(k && k.montId && k.montId!==id && k.status!=="pendente") setPassou({rev:k.rev, por:nomeDe(k.montId), novo: prox.kit ? prox.kit.rev : null});
    }
    if(ant.mont!==id) setPassou(null);
    visto.current = {mont:id, kit: r.atual ? null : proxId};
  }, [id, proxId, !!r.atual]);
  useEffect(function(){ if(!passou) return; var t = setTimeout(function(){setPassou(null);}, 6000); return function(){clearTimeout(t);}; }, [passou]);
  var tomNota = r.alerta==="vermelho" ? "rose" : r.alerta==="amarelo" ? "amber" : "emerald";
  var TONS = {sky:"from-sky-500/30 to-sky-500/5 ring-sky-400/25 text-sky-300", emerald:"from-emerald-500/30 to-emerald-500/5 ring-emerald-400/25 text-emerald-300",
    amber:"from-amber-500/30 to-amber-500/5 ring-amber-400/25 text-amber-300", rose:"from-rose-500/30 to-rose-500/5 ring-rose-400/25 text-rose-300",
    violet:"from-amber-500/30 to-amber-500/5 ring-amber-400/25 text-amber-200"};
  var stat = function(v,l,tom){ return e("div",{className:"rounded-2xl bg-linear-to-b p-2.5 text-center ring-1 "+TONS[tom]},
    e("p",{className:MONO+" text-base font-bold"}, v), e("p",{className:"text-[11px] text-white/60"}, l)); };
  var aviso = function(txt, tipo){ return e("div",{className:"rounded-xl border px-3 py-2 text-[13px] font-medium "+BADGE[tipo]}, txt); };
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"grid grid-cols-3 gap-2"},
      stat(r.hoje,"kits hoje","sky"), stat(r.m.mes.aval?N1(r.media):"—","sua nota",tomNota), stat(r.total,"kits no mês","violet")),
    r.alerta==="amarelo" && aviso("Sua nota está abaixo de "+N1(s.cfg.alertaAmarelo)+". Confira as preferências antes de concluir.","warning"),
    r.alerta==="vermelho" && aviso("Sua nota está abaixo de "+N1(s.cfg.alertaVermelho)+". Procure a Deysiane hoje.","destructive"),
    aguardando>0 && aviso(aguardando+(aguardando>1?" kits seus aguardam":" kit seu aguarda")+" conferência.","info"),
    passou && e("div",{className:"rounded-xl border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-[13px] font-medium text-amber-200"},
      "O kit de "+passou.rev+" passou para "+passou.por+", que ficou livre antes. "+(passou.novo ? "Seu próximo agora é "+passou.novo+"." : "")),
    r.atual
      ? e(React.Fragment,null, e("p",{className:"text-[15px] font-semibold"},"Você está montando"), e(Etiqueta,{k:r.atual, montId:id}))
      : prox.kit
        ? e(React.Fragment,null,
            e("div",{className:"flex items-baseline justify-between"},
              e("p",{className:"text-[15px] font-semibold"}, prox.tipo==="ajuste" ? "Ajuste para fazer" : "Próximo kit"),
              prox.tipo==="fila" && e("span",{className:"rounded-full bg-white/10 px-2 py-0.5 text-[12px] font-semibold"}, prox.posicao+"º da fila")),
            e(Etiqueta,{k:prox.kit, montId:id, tipo:prox.tipo}),
            prox.pulou && e("p",{className:"text-[12px] text-[#8E8E93]"},"Kits acima de "+BK(s.cfg.limiteMelhores)+" ficam com as "+s.cfg.topN+" montadoras mais bem avaliadas."))
        : e(Vazio,{txt: semValor ? semValor+" kits aguardam a Deysiane definir o valor." : "Todos os kits do dia estão montados ou em andamento."}));
}
// tela de entrada (a mesma do painel): o usuário digitado abre a montadora correspondente
function CelLogin(p){ return e(TelaLogin,{compacto:true, titulo:"App da montagem", teste:false, onEntrar:p.onEntrar}); }
function CelResultados(){
  var s = use().state, id = s.celular;
  var m = s.montadoras.find(function(x){return x.id===id;}), r = resumoMontadora(m, s);
  var avals = (s.registros||[]).filter(function(x){return x.tipo==="aval" && x.montId===id;});
  var stat = function(v,l){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-2xl bg-[#1C1C1E] p-3 text-center"},
    e("p",{className:MONO+" text-xl font-bold"}, v), e("p",{className:"text-[11px] text-[#8E8E93]"}, l)); };
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-[15px] font-semibold"},"Meus resultados do mês"),
    e("div",{className:"grid grid-cols-2 gap-2"},
      stat(r.total,"kits no mês"), stat(m.mes.tempoMedioMin?m.mes.tempoMedioMin+" min":"—","tempo médio"),
      stat(r.m.mes.aval?N1(r.media):"—","sua nota"), stat(avals.length,"avaliações")),
    e("p",{className:"mt-1 text-[13px] font-semibold"},"Últimas avaliações"),
    avals.length===0 ? e(Vazio,{txt:"Nenhuma avaliação ainda este mês."})
      : e("div",{className:"flex flex-col gap-2"}, avals.slice(0,8).map(function(a,i){
          return e("div",{key:i, className:"flex flex-col gap-1 rounded-2xl bg-[#1C1C1E] p-3"},
            e("div",{className:"flex items-center justify-between"}, e("b",{className:"truncate text-[13.5px]"}, a.rev),
              e("span",{className:"flex items-center gap-0.5 text-amber-300"}, e(Icon,{n:"star", s:13}), e("b",{className:"text-[13px]"}, a.nota))),
            a.obs && e("p",{className:"text-[12.5px] text-[#8E8E93]"}, "“"+a.obs+"”"), e("p",{className:"text-[11px] text-[#8E8E93]"}, a.dia));
        })));
}
function CelListagens(){
  var s = use().state;
  return e("div",{className:"flex flex-col gap-2.5"}, s.listagens.map(function(l, i){
    var c = corDe(i);
    var ks = s.kits.filter(function(k){return k.lid===l.id;}).sort(function(a,b){return a.ordem-b.ordem;});
    var prontos = ks.filter(function(k){return ["montado","bipando","bipado","retirado"].indexOf(k.status)>=0;}).length;
    return e("div",{key:l.id, className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"},
      e("div",{className:"h-1 bg-linear-to-r "+c.grad}),
      e("div",{className:"p-3"},
        e("div",{className:"mb-1.5 flex items-center gap-2"},
          e(Avatar,{nome:l.rep, i:i, className:"size-7 text-[12px]"}),
          e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-sm"}, l.rep),
            e("span",{className:"text-[12px] text-[#8E8E93]"}, l.horario+(l.viagem?", "+l.destino:""))),
          e("span",{className:"rounded-full bg-emerald-400/15 px-2 py-0.5 text-[12px] font-semibold text-emerald-300"}, prontos+" de "+ks.length)),
        e("div",{className:"mb-1 h-1 overflow-hidden rounded-full bg-white/10"}, e("i",{className:"block h-full bg-linear-to-r "+c.grad, style:{width:(ks.length?prontos/ks.length*100:0)+"%"}})),
        ks.map(function(k){ return e("div",{key:k.id, className:"flex items-center gap-2 border-t border-white/5 py-1.5 text-[13px]"},
          e("span",{className:"size-2 shrink-0 rounded-full "+PONTO_CEL[STATUS_TP[k.status]], title:STATUS_LB[k.status]}),
          e("span",{className:"flex-1 truncate"}, k.prio && e("span",{className:"text-amber-300"},"★ "), k.rev,
            modalidadeDe(s, k.rev)==="prata" && e("span",{className:"ml-1.5 rounded-full bg-slate-300 px-1.5 py-px align-middle text-[9px] font-black tracking-wider text-slate-900"},"100% PRATA")),
          e("span",{className:"text-[12px] text-[#8E8E93]"}, STATUS_LB[k.status])); })));
  }));
}
function Celular(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var lg = useState(false), logado = p && p.logado!==undefined ? p.logado : lg[0], setLogado = p && p.setLogado ? p.setLogado : lg[1];   // a página pode controlar (lista "Conectar como")
  var idx = s.montadoras.findIndex(function(x){return x.id===s.celular;}), m = s.montadoras[idx];
  var seg = function(t, lb){ return e("button",{onClick:function(){d({type:"TELACEL", t:t});},
    className:"flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors "+(s.telaCel===t?"bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409] shadow":"text-[#8E8E93]")}, lb); };
  if(!logado) return e(IPhone15,null, e(CelLogin,{onEntrar:function(pes){ setLogado(true); if(pes && s.montadoras.some(function(x){ return x.id===pes.id; })) d({type:"CEL", id:pes.id}); d({type:"TELACEL", t:"resultados"}); }}));
  return e(IPhone15,null,
    e("div",{className:"mb-4 flex items-center gap-3"},
      e(Avatar,{nome:m.nome, i:idx}),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Conectada como"), e("p",{className:"truncate text-xl font-bold"}, m.nome)),
      e("button",{onClick:function(){setLogado(false);}, title:"Sair", className:"grid size-9 place-items-center rounded-full bg-[#1C1C1E]"}, e(Icon,{n:"user", s:18, className:"text-[#8E8E93]"}))),
    e("div",{className:"mb-4 flex gap-1 rounded-xl bg-[#1C1C1E] p-1"}, seg("resultados","Meus resultados"), seg("proximo","Próximo kit"), seg("listagens","Listagens do dia")),
    s.telaCel==="proximo" ? e(CelProximo) : s.telaCel==="listagens" ? e(CelListagens) : e(CelResultados));
}

export { CelProximo, CelListagens, CelResultados, CelLogin, Celular };
