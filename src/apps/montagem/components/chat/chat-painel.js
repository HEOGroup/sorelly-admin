// Sorelly Admin · montagem — components/chat/chat-painel.js
// Painel de tempo de resposta: ranking por pessoa e por setor, média, mais rápido, mais lento, sem resposta. Filtro hoje / 7 dias / mês / ano.
import { api, useChat } from "@/apps/montagem/domain/chat-store";
import { Avatar, Ph, W, tempoCurto, Vazio } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

function Cartao(p){
  return e("div",{className:"flex flex-col gap-1 rounded-xl p-4", style:{background:W.painel, border:"1px solid "+W.borda}},
    e("span",{className:"flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-wide", style:{color:W.sec}}, e(Ph,{n:p.ic, s:16, fill:true, style:{color:p.cor||W.verde}}), p.t),
    e("span",{className:"text-[26px] font-bold leading-tight", style:{color:p.cor||W.texto}}, p.v), p.sub && e("span",{className:"truncate text-[12.5px]", style:{color:W.sec}}, p.sub));
}
function Barra(p){
  var pc = p.max ? Math.max(4, Math.round(p.v/p.max*100)) : 0;
  return e("div",{className:"h-2 w-full overflow-hidden rounded-full", style:{background:W.campo}}, e("div",{className:"h-full rounded-full", style:{width:pc+"%", background:p.cor}}));
}

function PainelTempo(){
  var st = useChat(), fl = useState("7d"), filtro = fl[0], setFiltro = fl[1], vs = useState("pessoa"), visao = vs[0], setVisao = vs[1];
  var r = api.getResponseStats(filtro), lista = visao==="pessoa" ? r.pessoas : r.setores, max = Math.max.apply(null, lista.map(function(x){ return x.media||0; }).concat([1]));
  var cor = function(x){ return x.media==null ? W.sec : x.media<=15*60000 ? "#25d366" : x.media<=30*60000 ? "#f5c542" : W.vermelho; };
  return e("div",{className:"flex flex-col gap-4", style:{color:W.texto}},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      [["hoje","Hoje"],["7d","7 dias"],["mes","Este mês"],["ano","Este ano"]].map(function(f){ var on = filtro===f[0];
        return e("button",{key:f[0], onClick:function(){ setFiltro(f[0]); }, className:"rounded-full px-4 py-1.5 text-[13.5px] font-medium", style:{background:on ? W.verde : W.campo, color:on ? "#0b141a" : W.texto}}, f[1]); }),
      e("span",{className:"ml-auto flex items-center gap-1.5 text-[12.5px]", style:{color:W.sec}}, e(Ph,{n:"clock", s:15}), "Conta só o horário de expediente e tira o tempo em que a pessoa ficou ocupada")),
    e("div",{className:"grid grid-cols-2 gap-3 lg:grid-cols-5"},
      e(Cartao,{t:"Marcações", ic:"at", v:r.total, sub:r.respondidas+" respondidas"}),
      e(Cartao,{t:"Tempo médio", ic:"timer", v:tempoCurto(r.media), sub:"entre marcar e responder"}),
      e(Cartao,{t:"Mais rápido", ic:"lightning", cor:"#25d366", v:r.maisRapido ? r.maisRapido.rotulo : "—", sub:r.maisRapido ? tempoCurto(r.maisRapido.media)+" de média" : ""}),
      e(Cartao,{t:"Mais lento", ic:"hourglass-medium", cor:"#f5c542", v:r.maisLento ? r.maisLento.rotulo : "—", sub:r.maisLento ? tempoCurto(r.maisLento.media)+" de média" : ""}),
      e(Cartao,{t:"Sem resposta", ic:"warning", cor:r.semResposta ? W.vermelho : W.texto, v:r.semResposta, sub:"marcações sem retorno"})),
    e("div",{className:"flex items-center gap-2"},
      [["pessoa","Por pessoa"],["setor","Por setor"]].map(function(f){ var on = visao===f[0];
        return e("button",{key:f[0], onClick:function(){ setVisao(f[0]); }, className:"rounded-lg px-3 py-1.5 text-[13.5px] font-medium", style:{background:on ? "#103529" : W.campo, color:on ? "#25d366" : W.sec}}, f[1]); })),
    !lista.length ? e(Vazio,{n:"chart-bar"}, "Nenhuma marcação neste período.") :
    e("div",{className:"overflow-x-auto rounded-xl", style:{background:W.painel, border:"1px solid "+W.borda}},
      e("table",{className:"w-full min-w-[640px] text-[14px]"},
        e("thead",null, e("tr",{className:"text-left text-[12px] uppercase tracking-wide", style:{color:W.sec, borderBottom:"1px solid "+W.borda}},
          ["#", visao==="pessoa" ? "Pessoa" : "Setor", "Marcações", "Respondidas", "Sem resposta", "Fora do prazo", "Média", "Mais rápido", "Mais lento", ""].map(function(h, i){ return e("th",{key:i, className:"px-3 py-2.5 font-semibold"}, h); }))),
        e("tbody",null, lista.map(function(x, i){
          return e("tr",{key:x.chave, style:{borderBottom:"1px solid "+W.borda}},
            e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:W.sec}}, x.media==null ? "—" : (i+1)+"º"),
            e("td",{className:"px-3 py-2.5"}, e("span",{className:"flex items-center gap-2.5"}, visao==="pessoa" && e(Avatar,{id:x.chave, s:30}), e("span",{className:"font-medium"}, x.rotulo))),
            e("td",{className:"px-3 py-2.5 tabular-nums"}, x.n), e("td",{className:"px-3 py-2.5 tabular-nums"}, x.resp),
            e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:x.semResp ? W.vermelho : W.sec}}, x.semResp),
            e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:x.estourou ? "#f5c542" : W.sec}}, x.estourou),
            e("td",{className:"px-3 py-2.5 font-semibold tabular-nums", style:{color:cor(x)}}, tempoCurto(x.media)),
            e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:W.sec}}, tempoCurto(x.min)), e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:W.sec}}, tempoCurto(x.max)),
            e("td",{className:"w-40 px-3 py-2.5"}, x.media!=null && e(Barra,{v:x.media, max:max, cor:cor(x)}))); })))),
    e("p",{className:"text-[12.5px]", style:{color:W.sec}}, "Verde: até 15 min · Amarelo: até 30 min · Vermelho: acima disso. O prazo de cada setor se configura na aba Configurações."));
}
// Consolidado dos setores: quantas conversas estão em aberto, há quanto tempo, quantas passaram de 2h, 4h, 8h e 24h, quantas foram resolvidas e o tempo médio de resposta
function PainelSetores(){
  useChat();
  var fl = useState("7d"), filtro = fl[0], setFiltro = fl[1], lista = api.sectorSummary(filtro);
  var tot = lista.reduce(function(t, o){ return {abertas:t.abertas+o.abertas, aguardando:t.aguardando+o.aguardando, resolvidas:t.resolvidas+o.resolvidas, f:t.f.map(function(v, i){ return v+o.faixas[i]; })}; }, {abertas:0, aguardando:0, resolvidas:0, f:[0,0,0,0]});
  var cores = ["#f5c542","#fb923c","#ef4444","#b91c1c"], corMedia = function(ms){ return ms==null ? W.sec : ms<=30*60000 ? "#25d366" : ms<=2*3600000 ? "#f5c542" : W.vermelho; };
  return e("div",{className:"flex flex-col gap-4", style:{color:W.texto}},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      [["hoje","Hoje"],["7d","7 dias"],["mes","Este mês"],["ano","Este ano"]].map(function(f){ var on = filtro===f[0];
        return e("button",{key:f[0], onClick:function(){ setFiltro(f[0]); }, className:"rounded-full px-4 py-1.5 text-[13.5px] font-medium", style:{background:on ? W.verde : W.campo, color:on ? "#0b141a" : W.texto}}, f[1]); }),
      e("span",{className:"ml-auto flex items-center gap-1.5 text-[12.5px]", style:{color:W.sec}}, e(Ph,{n:"clock", s:15}), "Espera conta só o horário de expediente. Em aberto e alertas são de agora; resolvidas e tempo médio seguem o período.")),
    e("div",{className:"grid grid-cols-2 gap-3 lg:grid-cols-6"},
      e(Cartao,{t:"Em aberto", ic:"chat-circle-dots", cor:tot.abertas ? "#f5c542" : W.texto, v:tot.abertas, sub:"esperando resposta"}),
      e(Cartao,{t:"Aguardando", ic:"hourglass-medium", cor:"#53bdeb", v:tot.aguardando, sub:"falta a representante"}),
      e(Cartao,{t:"Resolvidas", ic:"check-circle", cor:"#25d366", v:tot.resolvidas, sub:"no período"}),
      [2,4,8,24].map(function(h, i){ return e(Cartao,{key:h, t:"Mais de "+h+"h", ic:"clock-countdown", cor:tot.f[i] ? cores[i] : W.texto, v:tot.f[i], sub:"sem resposta"}); })),
    !lista.length ? e(Vazio,{n:"chart-bar"}, "Nenhuma conversa de setor ainda.") :
    e("div",{className:"overflow-x-auto rounded-xl", style:{background:W.painel, border:"1px solid "+W.borda}},
      e("table",{className:"w-full min-w-[820px] text-[14px]"},
        e("thead",null, e("tr",{className:"text-left text-[12px] uppercase tracking-wide", style:{color:W.sec, borderBottom:"1px solid "+W.borda}},
          ["Setor","Em aberto","Mais antiga esperando","+2h","+4h","+8h","+24h","Aguardando","Resolvidas","Tempo médio de resposta"].map(function(h, i){ return e("th",{key:i, className:"px-3 py-2.5 font-semibold"}, h); }))),
        e("tbody",null, lista.map(function(o){
          return e("tr",{key:o.setor, style:{borderBottom:"1px solid "+W.borda}},
            e("td",{className:"px-3 py-2.5 font-medium"}, o.setor),
            e("td",{className:"px-3 py-2.5 font-bold tabular-nums", style:{color:o.abertas ? "#f5c542" : W.sec}}, o.abertas),
            e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:o.abertas ? "#f5c542" : W.sec}}, o.abertas ? tempoCurto(o.maisAntiga) : "—"),
            o.faixas.map(function(v, i){ return e("td",{key:i, className:"px-3 py-2.5 tabular-nums", style:{color:v ? cores[i] : W.sec, fontWeight:v ? 700 : 400}}, v); }),
            e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:W.sec}}, o.aguardando), e("td",{className:"px-3 py-2.5 tabular-nums", style:{color:W.sec}}, o.resolvidas),
            e("td",{className:"px-3 py-2.5 font-semibold tabular-nums", style:{color:corMedia(o.media)}}, o.media==null ? "—" : tempoCurto(o.media))); })))),
    e("p",{className:"text-[12.5px]", style:{color:W.sec}}, "Verde: resposta média até 30 min · Amarelo: até 2h · Vermelho: acima disso. Conversas diretas entram no setor de quem deveria responder."));
}
export { PainelTempo, PainelSetores };
