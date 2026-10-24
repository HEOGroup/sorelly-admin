// Sorelly Admin · kits novos Curitiba — components/representantes.js
// Representantes dentro de Kits novos, em abas: Controle (kits e recusas), Fluxo (tempo em cada etapa), Regiões (mapa), Horários (dias e períodos) e Indicação (quem recebe o kit novo).
import { AbasTela, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { Filtros } from "@/apps/kits-novos/components/filtros";
import { RepFluxo } from "@/apps/kits-novos/components/rep-fluxo";
import { RepHorarios } from "@/apps/kits-novos/components/rep-horarios";
import { RepIndicar } from "@/apps/kits-novos/components/rep-indicar";
import { RepRegioes } from "@/apps/kits-novos/components/rep-regioes";
import { atrasado, entregou, mesDe } from "@/apps/kits-novos/domain/etapas";
import { diasEntre } from "@/apps/kits-novos/lib/datas";
import { recusasDaRep, recusasPorRep } from "@/apps/kits-novos/lib/bridge-montagem";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { Vazio } from "@/apps/kits-novos/ui/card";
import { Modal } from "@/apps/kits-novos/ui/modal";
import { e, useState } from "@/shared/react";

var SUBS = [["controle","Controle"], ["fluxo","Fluxo"], ["regioes","Regiões"], ["horarios","Horários"], ["indicar","Indicação"]];

function estatisticas(s){
  var f = s.filtro, b = f.busca.toLowerCase(), rec = recusasPorRep(f.mes), m = {};
  s.dados.forEach(function(c){
    if(!c.rep) return; if(f.mes && mesDe(c)!==f.mes) return; if(b && c.rep.toLowerCase().indexOf(b)<0) return;
    var r = m[c.rep] || (m[c.rep] = {nome:c.rep, pegou:0, abertos:0, atrasados:0, entregues:0, cancelados:0, noPrazo:0, medidos:0, recusas:rec[c.rep]||0});
    r.pegou++;
    if(atrasado(c, s.cfg)) r.atrasados++;   // atrasado em qualquer etapa (inclui a condicional que não voltou)
    if(c.st==="cancelado") r.cancelados++;
    else if(!entregou(c)) r.abertos++;
    else { r.entregues++; var dd = diasEntre(c.cad, c.ret); if(dd!=null && dd>=0){ r.medidos++; if(dd<=s.cfg.metaDias) r.noPrazo++; } }
  });
  return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a,b){ return b.pegou-a.pegou || a.nome.localeCompare(b.nome); });
}

// Janela compacta com as recusas da representante (data, revendedora, motivo), respeitando o filtro de mês.
function ListaRecusas(p){
  var itens = recusasDaRep(p.rep, p.mes);
  return e(Modal,{open:true, titulo:"Recusas de "+p.rep, sub:itens.length+(itens.length===1?" recusa":" recusas")+(p.mes?" em "+p.mes:" no total"), confirmar:"Fechar", icone:"check", onClose:p.fechar, onConfirmar:p.fechar},
    e(TabelaP,{minW:420, cols:[{t:"Data", w:80}, {t:"Revendedora", w:170}, {t:"Motivo"}]}, itens.map(function(r, i){ return e(Tr,{key:i}, e(Td,{n:true}, r.data), e(Td,null, r.rev), e(Td,null, r.motivo)); })));
}

function Controle(){
  var cx = use(), s = cx.state, d = cx.dispatch, lista = estatisticas(s), vr = useState(""), verRec = vr[0];
  if(!lista.length) return e(Vazio,{txt:"Nenhuma representante encontrada neste filtro."});
  var soma = function(k){ return lista.reduce(function(a, r){ return a+r[k]; }, 0); };
  var abrir = function(nome){ d({type:"FILTRO", f:{rep:nome, busca:""}}); d({type:"MODO", modo:"quadro"}); };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Representantes", v:String(lista.length)}, {t:"Kits recebidos", v:String(soma("pegou"))}, {t:"Em aberto", v:String(soma("abertos"))},
      {t:"Atrasados", v:String(soma("atrasados")), cor:soma("atrasados") ? "text-destructive" : ""}, {t:"Entregues", v:String(soma("entregues")), cor:soma("entregues") ? "text-success" : ""}, {t:"Recusas", v:String(soma("recusas")), cor:soma("recusas") ? "text-warning" : ""}]}),
    e(TabelaP,{minW:860, cols:[{t:"Representante", w:200}, {t:"Recebidos", w:92, n:1}, {t:"Em aberto", w:92, n:1}, {t:"Atrasados", w:92, n:1}, {t:"Entregues", w:92, n:1}, {t:"Cancelados", w:96, n:1}, {t:"Recusas", w:84, n:1}, {t:"No prazo", w:92, n:1}]},
      lista.map(function(r){ var pct = r.medidos ? r.noPrazo/r.medidos*100 : null;
        return e(Tr,{key:r.nome, onClick:function(){ abrir(r.nome); }, title:"Ver os kits desta representante no quadro"},
          e(Td,{forte:true}, r.nome), e(Td,{n:true}, String(r.pegou)), e(Td,{n:true}, String(r.abertos)),
          e(Td,{n:true, cor:r.atrasados ? "text-destructive" : ""}, String(r.atrasados)), e(Td,{n:true, cor:r.entregues ? "text-success" : ""}, String(r.entregues)), e(Td,{n:true}, String(r.cancelados)),
          e(Td,{n:true}, r.recusas ? e("button",{type:"button", title:"Ver as recusas", onClick:function(ev){ ev.stopPropagation(); vr[1](r.nome); }, className:"font-semibold text-warning underline"}, String(r.recusas)) : "0"),
          e(Td,{n:true, cor:pct==null ? "text-foreground/40" : ""}, pct==null ? "—" : N1(pct)+"%"));
      })),
    verRec && e(ListaRecusas,{rep:verRec, mes:s.filtro.mes, fechar:function(){ vr[1](""); }}));
}

function Representantes(p){
  var cx = use(), s = cx.state, d = cx.dispatch, sub = SUBS.some(function(x){ return x[0]===s.subRep; }) ? s.subRep : "controle";
  return e("div",{className:"flex flex-col gap-3"},
    e(AbasTela,{abas:SUBS, atual:sub, onMudar:function(k){ d({type:"SUBREP", sub:k}); }}),
    (sub==="controle" || sub==="fluxo") && e(Filtros,{listas:p.listas, ocultar:["rep","cid","ent","so"], placeholder:"Buscar representante"}),
    sub==="controle" ? e(Controle) : sub==="fluxo" ? e(RepFluxo) : sub==="regioes" ? e(RepRegioes) : sub==="horarios" ? e(RepHorarios) : e(RepIndicar));
}

export { Representantes, estatisticas, SUBS };
