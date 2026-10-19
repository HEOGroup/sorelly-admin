// Sorelly Admin · montagem — pages/equipes/Departamentos.js
// Aba Departamentos: lista compacta com filtros numa barra única; reordenar com setas; clicar na linha abre a janela do departamento.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BarraFiltros, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { eqLista, eqSetoresAcesso } from "@/apps/montagem/domain/equipes";
import { Bt, Ic, ROXO, useEquipes } from "@/apps/montagem/pages/equipes/pecas";
import { Busca, Sel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

function AbaDepartamentos(p){
  var q = useEquipes(), f = useState({busca:"", setor:"", semSup:false, arq:false}), v = f[0];
  var muda = function(k, x){ var n = Object.assign({}, v); n[k] = x; f[1](n); };
  var lista = eqLista(q.s, {busca:v.busca, setorAcesso:v.setor||undefined, soSemSupervisor:v.semSup, arquivados:v.arq});
  var ativo = !!(v.busca || v.setor || v.semSup || v.arq);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ f[1]({busca:"", setor:"", semSup:false, arq:false}); }},
      e(Busca,{v:v.busca, set:function(x){ muda("busca", x); }, ph:"Buscar departamento, setor ou pessoa"}),
      e(Sel,{v:v.setor, set:function(x){ muda("setor", x); }, rot:"Setor de acesso", todos:"Todos os setores", opcoes:eqSetoresAcesso().map(function(x){ return [x.k, x.nome]; })}),
      e(Bt,{tipo:v.semSup ? "marca" : "normal", ic:"warning", className:"h-9 py-0!", onClick:function(){ muda("semSup", !v.semSup); }}, "Só sem supervisor"),
      e(Bt,{tipo:v.arq ? "marca" : "normal", ic:"archive", className:"h-9 py-0!", onClick:function(){ muda("arq", !v.arq); }}, "Arquivados"),
      e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", disabled:!q.pode, semAut:true, onClick:p.novo}, "Novo departamento")),
    lista.length
      ? e("div",{className:"rounded-xl bg-black/20 p-1 ring-1 ring-white/10"}, e(Tab,{cols:["Ordem", "Departamento", "Setor de acesso", "Supervisão", "Pessoas", "Situação", ""]},
          lista.map(function(d){
            return e("tr",{key:d.id, onClick:function(){ p.abrir(d.id); }, className:LINHA+" cursor-pointer hover:bg-white/5 "+(d.arquivado ? "opacity-60" : "")},
              e(Td,null, e("div",{className:"flex justify-center gap-1"},
                e(Ic,{ic:"arrow-up", titulo:"Subir", disabled:!q.pode, semAut:true, onClick:function(){ q.exec("dep_ordem", {id:d.id, dir:-1}); }}),
                e(Ic,{ic:"arrow-down", titulo:"Descer", disabled:!q.pode, semAut:true, onClick:function(){ q.exec("dep_ordem", {id:d.id, dir:1}); }}))),
              e(Td,{forte:true}, e("span",{className:"inline-flex items-center gap-1.5"}, e("span",{className:"size-2.5 rounded-full", style:{background:d.cor}}), d.caminho)),
              e(Td,null, d.setorAcesso ? e(Selo,{cor:d.setorOrfao ? "alerta" : ROXO, ic:"shield-check"}, d.setorRotulo) : e("span",{className:"text-white/45"}, "—")),
              e(Td,null, d.temSupervisor ? d.supervisores.map(function(m){ return m.nome; }).join(", ") : e(Selo,{cor:"alerta", ic:"warning"}, "Sem supervisor")),
              e(Td,{dinheiro:true}, d.total),
              e(Td,null, d.arquivado ? e(Selo,{cor:"neutro", ic:"archive"}, "Arquivado") : e(Selo,{cor:"ok", ic:"check"}, "Ativo")),
              e(Td,null, e(Ph,{n:"pencil-simple", s:15, className:"text-white/60"})));
          })))
      : e(Vazio,{ic:"buildings"}, ativo ? "Nenhum departamento encontrado com esses filtros." : "Nenhum departamento cadastrado."));
}

export { AbaDepartamentos };
