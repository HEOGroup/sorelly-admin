// Sorelly Admin · montagem e bipagem — mobile/montadora.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { Etiqueta } from "@/apps/montagem/components/etiqueta";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { proximoPara, resumoMontadora } from "@/apps/montagem/domain/regras";
import { kit } from "@/apps/montagem/domain/seed";
import { STATUS_LB, STATUS_TP, TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK, N1 } from "@/apps/montagem/lib/format";
import { TelaLogin } from "@/apps/montagem/components/tela-login";
import { avisosDe } from "@/apps/montagem/domain/pedidos-pecas";
import { CelPedir } from "@/apps/montagem/mobile/montadora-pedido";
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

var BORDA_CEL = "border border-[#E9DDBB]";
function Stat(p){ return e("div",{className:"flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-white px-2 py-3 text-center shadow-sm "+BORDA_CEL},
  e("b",{className:MONO+" text-[26px] leading-none", style:{color:p.cor}}, p.v), e("span",{className:"text-[13px] font-semibold leading-tight text-[#4B5563]"}, p.l)); }
function Aviso(p){ return e("div",{className:"rounded-2xl px-3.5 py-3 text-[14px] font-semibold leading-snug", style:{background:p.cor+"1A", color:p.cor}}, p.children); }
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
  var corNota = r.alerta==="vermelho" ? "#DC2626" : r.alerta==="amarelo" ? "#D97706" : "#15803D";
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"grid grid-cols-3 gap-2"},
      e(Stat,{v:r.hoje, l:"Kits hoje", cor:"#2563EB"}), e(Stat,{v:r.m.mes.aval ? N1(r.media) : "—", l:"Sua nota", cor:corNota}), e(Stat,{v:r.total, l:"Kits no mês", cor:"#8A6A12"})),
    r.alerta==="amarelo" && e(Aviso,{cor:"#D97706"}, "Sua nota está abaixo de "+N1(s.cfg.alertaAmarelo)+". Confira as preferências antes de concluir."),
    r.alerta==="vermelho" && e(Aviso,{cor:"#DC2626"}, "Sua nota está abaixo de "+N1(s.cfg.alertaVermelho)+". Procure a Deysiane hoje."),
    aguardando>0 && e(Aviso,{cor:"#2563EB"}, aguardando+(aguardando>1 ? " kits seus aguardam" : " kit seu aguarda")+" conferência."),
    passou && e(Aviso,{cor:"#B45309"}, "O kit de "+passou.rev+" passou para "+passou.por+", que ficou livre antes. "+(passou.novo ? "Seu próximo agora é "+passou.novo+"." : "")),
    r.atual
      ? e(React.Fragment,null, e("p",{className:"text-[17px] font-extrabold text-[#111827]"},"Você está montando"), e(Etiqueta,{k:r.atual, montId:id}))
      : prox.kit
        ? e(React.Fragment,null,
            e("div",{className:"flex items-baseline justify-between"},
              e("p",{className:"text-[17px] font-extrabold text-[#111827]"}, prox.tipo==="ajuste" ? "Ajuste para fazer" : "Próximo kit"),
              prox.tipo==="fila" && e("span",{className:"rounded-full bg-[#F6EBCB] px-3 py-1 text-[13px] font-bold text-[#6B5B2A]"}, prox.posicao+"º da fila")),
            e(Etiqueta,{k:prox.kit, montId:id, tipo:prox.tipo}),
            prox.pulou && e("p",{className:"text-[13px] leading-snug text-[#6B7280]"},"Kits acima de "+BK(s.cfg.limiteEncomendas)+" ficam com o setor Encomendas; acima de "+BK(s.cfg.limiteMelhores)+", com as "+s.cfg.topN+" montadoras mais bem avaliadas."))
        : e(Vazio,{txt: semValor ? semValor+" kits aguardam a Deysiane definir o valor." : "Todos os kits do dia estão montados ou em andamento."}));
}
// tela de entrada (a mesma do painel): o usuário digitado abre a montadora correspondente
function CelLogin(p){ return e(TelaLogin,{compacto:true, titulo:"App da montagem", teste:false, onEntrar:p.onEntrar}); }
function CelResultados(){
  var s = use().state, id = s.celular;
  var m = s.montadoras.find(function(x){return x.id===id;}), r = resumoMontadora(m, s);
  var avals = (s.registros||[]).filter(function(x){return x.tipo==="aval" && x.montId===id;});
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-[17px] font-extrabold text-[#111827]"}, "Meus resultados do mês"),
    e("div",{className:"grid grid-cols-2 gap-2"},
      e(Stat,{v:r.total, l:"Kits no mês", cor:"#8A6A12"}), e(Stat,{v:m.mes.tempoMedioMin ? m.mes.tempoMedioMin+" min" : "—", l:"Tempo médio por kit", cor:"#2563EB"}),
      e(Stat,{v:r.m.mes.aval ? N1(r.media) : "—", l:"Sua nota", cor:"#15803D"}), e(Stat,{v:avals.length, l:"Avaliações recebidas", cor:"#7C3AED"})),
    e("p",{className:"mt-1 text-[15px] font-bold text-[#111827]"}, "Últimas avaliações"),
    avals.length===0 ? e("div",{className:"rounded-2xl bg-white px-4 py-6 text-center text-[14px] text-[#6B7280] "+BORDA_CEL}, "Nenhuma avaliação ainda este mês.")
      : e("div",{className:"flex flex-col gap-2"}, avals.slice(0,8).map(function(a,i){
          return e("div",{key:i, className:"flex flex-col gap-1 rounded-2xl bg-white p-3.5 shadow-sm "+BORDA_CEL},
            e("div",{className:"flex items-start justify-between gap-3"}, e("b",{className:"min-w-0 text-[15px] leading-tight text-[#111827]"}, a.rev),
              e("span",{className:"flex shrink-0 items-center gap-1 rounded-full bg-[#FEF5DC] px-2.5 py-1 text-[#A67C12]"}, e(Icon,{n:"star", s:14, peso:"fill"}), e("b",{className:"text-[14px]"}, a.nota))),
            a.obs && e("p",{className:"text-[14px] leading-snug text-[#4B5563]"}, "“"+a.obs+"”"), e("p",{className:"text-[12.5px] text-[#9CA3AF]"}, a.dia));
        })));
}
var COR_SIT = {semvalor:"#B45309", pendente:"#4B5563", montando:"#6D28D9", supervisao:"#B45309", ajuste:"#B91C1C", montado:"#1D4ED8", bipando:"#1D4ED8", bipado:"#15803D", retirado:"#15803D", condicional:"#B45309", precond:"#B45309"};
function CelListagens(){
  var s = use().state;
  return e("div",{className:"flex flex-col gap-2.5"}, s.listagens.map(function(l, i){
    var ks = s.kits.filter(function(k){return k.lid===l.id;}).sort(function(a,b){return a.ordem-b.ordem;});
    var prontos = ks.filter(function(k){return ["montado","bipando","bipado","retirado"].indexOf(k.status)>=0;}).length;
    return e("details",{key:l.id, open:i===0 || undefined, className:"group overflow-hidden rounded-2xl border border-[#E9DDBB] bg-white shadow-sm"},
      e("summary",{className:"flex cursor-pointer list-none items-center gap-2.5 bg-[#F6EBCB] px-3 py-2.5 [&::-webkit-details-marker]:hidden"},
        e(Avatar,{nome:l.rep, i:i, className:"size-9 shrink-0 text-[13px]"}),
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[16px] leading-tight text-[#111827]"}, "Representante "+l.rep),
          e("span",{className:"block text-[13px] leading-tight text-[#6B5B2A]"}, "Retirada às "+l.horario+(l.viagem ? ", viagem para "+l.destino : ""))),
        e("div",{className:"flex shrink-0 flex-col items-end"}, e("b",{className:"text-[15px] text-[#15803D]"}, prontos+" de "+ks.length), e("span",{className:"text-[11.5px] leading-tight text-[#6B5B2A]"}, ks.length===1 ? "kit pronto" : "kits prontos")),
        e(Icon,{n:"chevrondown", s:15, className:"shrink-0 text-[#6B5B2A] transition-transform group-open:rotate-180"})),
      e("div",{className:"h-1.5 bg-[#EEF0F4]"}, e("i",{className:"block h-full bg-[#15803D]", style:{width:(ks.length ? prontos/ks.length*100 : 0)+"%"}})),
      e("div",{className:"flex flex-col divide-y divide-[#EEF0F4]"}, ks.map(function(k){
        var tipo = (TIPO_KIT[k.tipoKit]||TIPO_KIT.acerto_kit)[0];
        return e("div",{key:k.id, className:"flex flex-col gap-1 px-3 py-2.5"},
          e("div",{className:"flex items-start justify-between gap-2"},
            e("b",{className:"min-w-0 text-[15px] leading-tight text-[#111827]"}, k.rev),
            e("span",{className:"shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-bold", style:{background:COR_SIT[k.status]+"1F", color:COR_SIT[k.status]}}, STATUS_LB[k.status])),
          e("div",{className:"flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-[#4B5563]"},
            e("span",null, tipo), k.prio && e("b",{className:"text-[#B45309]"}, "Prioridade"),
            modalidadeDe(s, k.rev)==="prata" && e("b",{className:"text-[#475569]"}, "Kit 100% Prata")));
      })));
  }));
}
function Celular(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var lg = useState(false), logado = p && p.logado!==undefined ? p.logado : lg[0], setLogado = p && p.setLogado ? p.setLogado : lg[1];   // a página pode controlar (lista "Conectar como")
  var avisosPeca = avisosDe(s.pp, s.celular).length;   // respostas do cadastro ainda não vistas
  var idx = s.montadoras.findIndex(function(x){return x.id===s.celular;}), m = s.montadoras[idx];
  var seg = function(t, lb){ return e("button",{onClick:function(){d({type:"TELACEL", t:t});},
    className:"flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors "+(s.telaCel===t?"bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] text-[#1B1409] shadow":"text-[#8E8E93]")}, lb); };
  if(!logado) return e(IPhone15,null, e(CelLogin,{onEntrar:function(pes){ setLogado(true); if(pes && s.montadoras.some(function(x){ return x.id===pes.id; })) d({type:"CEL", id:pes.id}); d({type:"TELACEL", t:"resultados"}); }}));
  return e(p && p.semMoldura ? React.Fragment : IPhone15,null,
    e("div",{className:"mb-4 flex items-center gap-3"},
      e(Avatar,{nome:m.nome, i:idx}),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Conectada como"), e("p",{className:"truncate text-xl font-bold"}, m.nome)),
      e("button",{onClick:function(){setLogado(false);}, title:"Sair", className:"grid size-9 place-items-center rounded-full bg-[#1C1C1E]"}, e(Icon,{n:"user", s:18, className:"text-[#8E8E93]"}))),
    e("div",{className:"mb-4 flex gap-1 rounded-xl bg-[#1C1C1E] p-1"}, seg("resultados","Resultados"), seg("proximo","Próximo kit"), seg("listagens","Listagens"), seg("pedir", avisosPeca ? "Peça ("+avisosPeca+")" : "Pedir peça")),
    s.telaCel==="proximo" ? e(CelProximo) : s.telaCel==="listagens" ? e(CelListagens) : s.telaCel==="pedir" ? e(CelPedir) : e(CelResultados));
}

export { CelProximo, CelListagens, CelResultados, CelLogin, Celular };
