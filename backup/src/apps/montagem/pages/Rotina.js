// Sorelly Admin · montagem — pages/Rotina.js
// ROTINA DO DIA: a Diretoria vê o que cada pessoa tem que fazer no dia (com horário e check de feito) e edita os combinados; cada pessoa vê só os dela e marca como feito.
// Lógica em domain/rotina.js (s.rot, ação ROT). Quando passa do horário sem o check, a pessoa recebe o alerta com som (App.js).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, LINHA, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { DIAS_SEMANA, SEG_SAB, daPessoa, rotAtrasado, rotDoDia, rotResumo } from "@/apps/montagem/domain/rotina";
import { EQUIPE, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { ABAS } from "@/apps/montagem/navigation/abas";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";

var pad = function(n){ return String(n).padStart(2, "0"); };
var hmDe = function(ts){ var x = new Date(ts); return pad(x.getHours())+":"+pad(x.getMinutes()); };
var rotuloDia = function(iso, hojeIso){ var dt = new Date(iso+"T12:00:00"), nome = dt.toLocaleDateString("pt-BR", {weekday:"long"}).replace("-feira", ""); return (iso===hojeIso ? "Hoje" : nome.charAt(0).toUpperCase()+nome.slice(1))+" · "+iso.split("-").reverse().slice(0, 2).join("/"); };
var NOME_TELA = {}; ABAS.forEach(function(a){ NOME_TELA[a[0]] = a[1]; });

function LinhaItem(p){
  var i = p.i, atras = rotAtrasado(i, p.dia, p.hojeIso, p.hm), pode = p.podeMarcar;
  var cor = i.feito ? "#22C55E" : atras ? "#EF4444" : "#9CA3AF";
  return e("tr",{className:LINHA},
    e(Td,null, e("button",{type:"button", disabled:!pode, "aria-label":(i.feito ? "Desfazer: " : "Marcar como feito: ")+i.nome, title:pode ? (i.feito ? "Desfazer" : "Marcar como feito") : "Só quem faz marca este item",
      onClick:function(){ p.marcar(i, !i.feito); }, className:"grid size-8 place-items-center rounded-full text-white disabled:opacity-40", style:{background:i.feito ? "#16A34A" : "transparent", boxShadow:"inset 0 0 0 2px "+cor}}, i.feito && e(Icon,{n:"check", s:16}))),
    e(Td,{forte:true, className:"whitespace-normal! text-left! min-w-56"}, i.nome),
    e(Td,null, i.hora || "—"),
    e(Td,{className:"text-white/80"}, i.setor || "—"),
    e(Td,null, i.rota ? e("button",{type:"button", onClick:function(){ p.abrir(i.rota); }, className:"rounded-lg bg-white/10 px-2.5 py-1 text-[12px] font-bold hover:bg-white/20"}, NOME_TELA[i.rota] || "Abrir tela") : "—"),
    e(Td,{className:"text-left!", cor:i.feito ? "#4ADE80" : atras ? "#F87171" : undefined}, i.feito ? "Feito às "+hmDe(i.feito.em)+(i.feito.por ? " por "+i.feito.por : "") : atras ? "Atrasado" : "Pendente"));
}
var COLS = ["Feito", "O que fazer", "Horário", "Setor", "Tela", "Situação"];

function Combinados(p){
  var s = p.s, itens = (s.rot||{}).itens || [], nf = useState({nome:"", setor:"", quem:"", hora:"", rota:""}), f = nf[0], setF = nf[1];
  var set = function(k){ return function(ev){ var c = Object.assign({}, f); c[k] = ev.target.value; setF(c); }; };
  var servidor = apiAtiva(), falha = function(x){ window.alert(x.message); };
  var add = function(){
    var dados = {nome:f.nome, setor:f.setor, quem:f.quem ? [Number(f.quem)] : [], hora:f.hora, dias:SEG_SAB, rota:f.rota};
    if(servidor) chamar("POST", "/rotina/itens", dados).then(p.sync).catch(falha); else p.d(Object.assign({type:"ROT", op:"item_add", diretoria:true}, dados));
    setF({nome:"", setor:"", quem:"", hora:"", rota:""});
  };
  var op = function(id, patch){ if(servidor) chamar("PATCH", "/rotina/itens/"+id, patch).then(p.sync).catch(falha); else p.d({type:"ROT", op:"item_set", diretoria:true, id:id, patch:patch}); };
  var remover = function(id){ if(servidor) chamar("DELETE", "/rotina/itens/"+id).then(p.sync).catch(falha); else p.d({type:"ROT", op:"item_del", diretoria:true, id:id}); };
  var pessoas = EQUIPE.slice().sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  return e(BlocoBarra,{cor:"ouro", t:"Combinados da rotina", sub:"o que cada pessoa tem que fazer por dia · só a Diretoria muda"},
    e("div",{className:"flex flex-col gap-3 p-3"},
      e(Tab,{cols:["Ligado", "O que fazer", "Quem", "Horário", "Dias", "Tela", ""]}, itens.map(function(i){
        return e("tr",{key:i.id, className:LINHA+(i.ativo===false ? " opacity-50" : "")},
          e(Td,null, e("input",{type:"checkbox", checked:i.ativo!==false, "aria-label":"Ligar ou desligar "+i.nome, onChange:function(ev){ op(i.id, {ativo:ev.target.checked}); }, className:"size-4 cursor-pointer accent-[#E8B84B]"})),
          e(Td,{forte:true, className:"whitespace-normal! text-left! min-w-56"}, i.nome),
          e(Td,{className:"whitespace-normal! text-left!"}, (i.quem||[]).map(nomeDe).join(", ")),
          e(Td,null, e("input",{type:"time", value:i.hora||"", "aria-label":"Horário de "+i.nome, onChange:function(ev){ op(i.id, {hora:ev.target.value}); }, className:INPUT+" h-8! w-28 text-center"})),
          e(Td,{className:"text-white/80"}, (i.dias||[]).length===6 && (i.dias||[]).indexOf(0)<0 ? "seg a sáb" : (i.dias||[]).length===5 && (i.dias||[]).indexOf(0)<0 && (i.dias||[]).indexOf(6)<0 ? "seg a sex" : (i.dias||[]).map(function(x){ return DIAS_SEMANA[x]; }).join(", ")),
          e(Td,{className:"text-white/80"}, NOME_TELA[i.rota] || "—"),
          e(Td,null, e("button",{type:"button", "aria-label":"Remover "+i.nome, title:"Remover", onClick:function(){ if(window.confirm("Remover \""+i.nome+"\" da rotina?")) remover(i.id); }, className:"grid size-8 place-items-center rounded-lg bg-[#EF4444]/20 text-[#F87171] hover:bg-[#EF4444]/30"}, e(Icon,{n:"trash", s:15}))));
      })),
      e("div",{className:"grid grid-cols-1 items-end gap-2 sm:grid-cols-[2fr_1fr_1fr_8rem_1.4fr_auto]"},
        e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Novo combinado", e("input",{value:f.nome, placeholder:"O que fazer", onChange:set("nome"), className:INPUT+" h-10!"})),
        e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Setor", e("input",{value:f.setor, placeholder:"Financeiro", onChange:set("setor"), className:INPUT+" h-10!"})),
        e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Quem faz", e("select",{value:f.quem, onChange:set("quem"), className:INPUT+" h-10! cursor-pointer"}, e("option",{value:""}, "Escolha"), pessoas.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))),
        e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Horário", e("input",{type:"time", value:f.hora, onChange:set("hora"), className:INPUT+" h-10!"})),
        e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Tela", e("select",{value:f.rota, onChange:set("rota"), className:INPUT+" h-10! cursor-pointer"}, e("option",{value:""}, "Nenhuma"), ABAS.slice().sort(function(a, b){ return a[1].localeCompare(b[1], "pt-BR"); }).map(function(a){ return e("option",{key:a[0], value:a[0]}, a[1]); }))),
        e(Btn,{v:"primary", disabled:!f.nome.trim() || !f.quem, onClick:add}, "Adicionar"))));
}

function AbaRotina(){
  var cx = use(), s = cx.state, d = cx.dispatch, eu = s.usuario;
  var hojeIso = isoDia(new Date()), sd = useState(hojeIso), dia = sd[0], setDia = sd[1], ref = useState(false), editar = ref[0], setEditar = ref[1];
  var agora = new Date(), hm = pad(agora.getHours())+":"+pad(agora.getMinutes());
  var diretor = papelDe(eu)==="supervisao", lista = rotDoDia(s.rot, dia), minhas = daPessoa(lista, eu), ver = diretor ? lista : minhas;
  var res = rotResumo(ver, dia, hojeIso, hm);
  var soma = function(n){ var x = new Date(dia+"T12:00:00"); x.setDate(x.getDate()+n); setDia(isoDia(x)); };
  var local = function(i, feito){ d({type:"ROT", op:"marcar", id:i.id, data:dia, feito:feito, por:nomeDe(eu), porId:eu, diretoria:diretor, em:Date.now()}); };
  var marcar = function(i, feito){ if(!apiAtiva()) return local(i, feito); chamar("PUT", "/rotina/registros", {itemId:i.id, data:dia, feito:feito}).then(function(){ local(i, feito); }).catch(function(x){ window.alert(x.message); }); };
  var sync = function(){ return chamar("GET", "/rotina/itens").then(function(r){ d({type:"ROT", op:"sync", itens:r.itens}); }).catch(function(){}); };
  useEffect(function(){ if(!apiAtiva()) return; chamar("GET", "/rotina/registros?data="+dia).then(function(r){ d({type:"ROT", op:"sync", dia:dia, reg:r.reg}); }).catch(function(){}); }, [dia]);
  var abrir = function(aba){ d({type:"ABA", aba:aba}); };
  var seta = function(t, n, rot){ return e("button",{type:"button", onClick:function(){ soma(n); }, "aria-label":rot, className:"grid size-8 place-items-center rounded-lg bg-black/30 text-[16px] font-bold hover:bg-black/50"}, t); };
  var podeMarcar = function(i){ return diretor || ((i.quem||[]).indexOf(eu)>=0 && dia===hojeIso); };
  var pessoas = [], vistos = {}; if(diretor) lista.forEach(function(i){ (i.quem||[]).forEach(function(id){ if(!vistos[id]){ vistos[id] = 1; pessoas.push(id); } }); });
  pessoas.sort(function(a, b){ return nomeDe(a).localeCompare(nomeDe(b), "pt-BR"); });
  var bloco = function(titulo, itens, chave){
    var r = rotResumo(itens, dia, hojeIso, hm);
    return e(BlocoBarra,{key:chave, cor:r.atrasados>0 ? "vermelho" : r.pendentes===0 && r.total>0 ? "verde" : "ouro", t:titulo, sub:r.feitos+" de "+r.total+" feitos"+(r.atrasados>0 ? " · "+r.atrasados+(r.atrasados===1 ? " atrasado" : " atrasados") : ""), compacto:true},
      itens.length===0 ? e("p",{className:"px-4 py-5 text-center text-[13px] text-white/70"}, "Nada para este dia.")
        : e(Tab,{cols:COLS}, itens.map(function(i){ return e(LinhaItem,{key:i.id+"-"+chave, i:i, dia:dia, hojeIso:hojeIso, hm:hm, podeMarcar:podeMarcar(i), marcar:marcar, abrir:abrir}); })));
  };
  return e(Pagina,null,
    e(PageHead,{t:"Rotina do dia", sub:diretor ? "O que cada pessoa tem que fazer hoje, com horário. Marque quando estiver feito." : "O que você tem que fazer hoje. Marque quando terminar."},
      diretor && e(Btn,{v:editar ? "primary" : "secondary", ic:"config", onClick:function(){ setEditar(!editar); }}, editar ? "Fechar combinados" : "Editar combinados")),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2"},
      seta("‹", -1, "Dia anterior"), e("b",{className:"min-w-44 text-center font-heading text-[18px] text-primary"}, rotuloDia(dia, hojeIso)), seta("›", 1, "Próximo dia"),
      dia!==hojeIso && e("button",{type:"button", onClick:function(){ setDia(hojeIso); }, className:"rounded-lg bg-primary px-3 py-1 text-[12px] font-bold text-primary-foreground"}, "Voltar para hoje")),
    e(Faixa,{n:4}, e(Indicador,{t:"Para fazer", v:res.total, cor:"total"}), e(Indicador,{t:"Feitos", v:res.feitos, cor:"ok", sub:res.pct+"% do dia"}), e(Indicador,{t:"Pendentes", v:res.pendentes, cor:"neutro"}), e(Indicador,{t:"Atrasados", v:res.atrasados, cor:res.atrasados>0 ? "alerta" : "neutro"})),
    diretor && editar && e(Combinados,{s:s, d:d, sync:sync}),
    diretor ? (pessoas.length===0 ? e("p",{className:"rounded-xl bg-black/20 px-4 py-6 text-center text-[13px] text-white/70"}, "Nenhum item para este dia.") : pessoas.map(function(id){ return bloco(nomeDe(id), daPessoa(lista, id), "p"+id); }))
      : bloco("Minha rotina", minhas, "eu"));
}
export { AbaRotina };
