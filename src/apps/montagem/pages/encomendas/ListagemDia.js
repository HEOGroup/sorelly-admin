// Sorelly Admin · montagem — pages/encomendas/ListagemDia.js
// LISTAGEM DE HORÁRIOS da ida na empresa (23/10/2026): a equipe preenche hora, revendedora e representante; os pedidos de ida na empresa agendados entram sozinhos.
// Todo dia de manhã a Agatha clica em "Enviar ao Agendamento" (tarefa da Rotina do dia às 08:30): a listagem fica guardada e aparece no Painel do Agendamento (ListagemLeitura).
import { Bloco, Botao, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { agoraSP, formatarDataHora, formatarDia, hojeSP, listagemDoDia, textoListagem } from "@/apps/montagem/domain/encomendas";
import { copiar } from "@/apps/montagem/pages/encomendas/visual";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { e, useState } from "@/shared/react";

var VAZIO = {hora:"", revendedora:"", representante:"", obs:""};

function ListagemDia(p){
  var E = p.E, er = E.er, st = useState(hojeSP()), data = st[0], fm = useState(VAZIO), f = fm[0], ms = useState("");
  var itens = listagemDoDia(er, data), texto = textoListagem(data, itens), envio = er.agendaEnvios[data];
  var set = function(k, v){ fm[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var add = function(){ if(E.exec("agenda_add", {data:data, hora:f.hora, revendedora:f.revendedora, representante:f.representante, obs:f.obs})) fm[1](VAZIO); };
  var enviar = function(){ E.exec("agenda_enviar", {data:data, texto:texto}); };
  var copia = function(){ if(copiar(texto)){ ms[1]("Copiado"); setTimeout(function(){ ms[1](""); }, 2000); } };
  var campo = function(k, ph, w){ return e("input",{type:k==="hora" ? "time" : "text", value:f[k], placeholder:ph, "aria-label":ph, onChange:function(ev){ set(k, ev.target.value); }, className:CAMPO+" "+(w || "")}); };
  return e(Bloco,{t:"Listagem de horários", dir:e("div",{className:"flex items-center gap-2"},
      e("input",{type:"date", value:data, "aria-label":"Dia", onChange:function(ev){ if(ev.target.value) st[1](ev.target.value); }, className:CAMPO+" w-40"}),
      e("span",{className:"hidden text-[12px] sm:inline "+(envio ? "text-success" : "text-foreground/80")}, envio ? "Enviada às "+formatarDataHora(envio.em).slice(11)+" · "+envio.por : "Ainda não enviada"))},
    e("div",{className:"grid grid-cols-2 items-end gap-2 pb-2 md:grid-cols-[100px_1fr_1fr_1fr_auto]"},
      campo("hora", "Hora"), campo("revendedora", "Revendedora"), campo("representante", "Representante"), campo("obs", "Observação"),
      e(Botao,{principal:true, desabilitado:!f.revendedora.trim(), onClick:add}, "Adicionar")),
    itens.length ? e(TabelaP,{minW:640, cols:[{t:"Hora", w:80}, {t:"Revendedora"}, {t:"Representante", w:170}, {t:"Observação", w:190}, {t:"", w:84}]},
      itens.map(function(x){ return e(Tr,{key:x.id}, e(Td,null, x.hora || "—"), e(Td,{forte:true}, x.revendedora), e(Td,null, x.representante || "—"), e(Td,{cor:x.origem==="pedido" ? "text-foreground/80" : ""}, x.obs || (x.origem==="pedido" ? "Pedido" : "—")),
        e(Td,null, x.origem==="lista" ? e("button",{type:"button", onClick:function(){ E.exec("agenda_del", {id:x.id}); }, className:"h-6 rounded border border-border px-2 text-[12px] hover:bg-white/10"}, "Remover") : "")); }))
      : e(Vazio,{ic:"calendar-check"}, "Nenhum horário neste dia."),
    e("div",{className:"flex flex-wrap justify-end gap-2 pt-2"}, e(Botao,{onClick:copia}, ms[0] || "Copiar listagem"), e(Botao,{principal:true, onClick:enviar}, envio ? "Enviar de novo ao Agendamento" : "Enviar ao Agendamento")));
}

// leitura para o Agendamento: a listagem do dia (enviada pelas Encomendas)
function ListagemLeitura(p){
  var er = p.er, data = hojeSP(), itens = listagemDoDia(er, data), envio = er.agendaEnvios[data];
  return e(Bloco,{t:"Idas na empresa de hoje (Encomendas)", dir:e("span",{className:"text-[12px] "+(envio ? "text-success" : "text-foreground/80")}, envio ? "Enviada às "+formatarDataHora(envio.em).slice(11)+" por "+envio.por : "Ainda não enviada hoje")},
    itens.length ? e(TabelaP,{minW:520, cols:[{t:"Hora", w:80}, {t:"Revendedora"}, {t:"Representante", w:170}, {t:"Observação", w:190}]},
      itens.map(function(x){ return e(Tr,{key:x.id}, e(Td,null, x.hora || "—"), e(Td,{forte:true}, x.revendedora), e(Td,null, x.representante || "—"), e(Td,null, x.obs || "—")); }))
      : e("p",{className:"py-1 text-[13px] text-foreground/80"}, "Nenhuma ida na empresa marcada para "+formatarDia(data)+"."));
}
export { ListagemDia, ListagemLeitura };
