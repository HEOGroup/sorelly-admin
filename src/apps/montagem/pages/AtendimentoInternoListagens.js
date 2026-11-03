// Sorelly Admin — pages/AtendimentoInternoListagens.js
// Kits → Atendimento interno → Listagens. São as revendedoras que acertam na própria Sorelly (~416 das 2.033).
// Tela SÓ de visualização (03/11/2026, opção B "Planilha por dia" escolhida pelo Marcus): reflete as listagens que a Tamara monta no setor Revendedoras.
// Cada dia é uma barra dourada leve (texto no começo) que abre e fecha; o cabeçalho das colunas fica logo acima da primeira linha de cada dia aberto.
// Colunas: Horário, Nome, Tipo, Quem bipou, Quem atende na montagem. Valor, pagamento e tempo ficam no Consolidado Sorelly.
// Quem monta a agenda e define o tipo é a Tamara (Revendedoras); remarcação e multa ficam registradas lá.
// Na tela "Atendimento Sorelly" aparece só a agenda do dia.
import { sincronizarDm } from "@/apps/montagem/pages/RevendedorasInternas";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { apiAtiva } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

var TIPOS = {acerto:"Acerto", kit_novo:"Kit novo", reposicao:"Reposição", premio:"Retirada de prêmio", indicacao:"Brinde de indicação", retornando:"Kit retornando"};
var COLUNAS = [["Horário", 96], ["Nome", 300], ["Tipo", 180], ["Quem bipou", 180], ["Quem atende na montagem", 240]];
var TOPO = "linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)";   // um degradê só, do começo ao fim da barra
var DIAS = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
var fmtData = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };
var diaSemana = function(iso){ return DIAS[new Date(iso+"T12:00:00").getDay()]; };
var primeiro = function(n){ return n ? n.split(" ")[0] : "—"; };

function Selo(p){ return e("span",{className:"rounded-full bg-slate-600 px-2 py-0.5 text-[11px] font-black tracking-wider text-white", title:"Kit 100% Prata"}, p.children || "100% PRATA"); }   // usado pela Atendimento Sorelly

function AbaIntListagens(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = isoDia(new Date());
  // as agendadas pela Tamara vêm da DevMaster: atualiza ao abrir e a cada 10 minutos (mesma busca da aba Revendedoras)
  useEffect(function(){ var rodar = function(){ if(apiAtiva()) sincronizarDm(d, true).catch(function(){ /* sem servidor: segue com o que já está salvo */ }); }; rodar(); var t = setInterval(rodar, 600000); return function(){ clearInterval(t); }; }, []);
  var ab = useState({}), abertos = ab[0], setAbertos = ab[1];   // meses e dias abertos (tudo começa fechado)

  // agendadas pela Tamara (lista de Revendedoras) que ainda não viraram atendimento: aparecem aqui como linhas virtuais
  var comInterno = {}; (s.internos||[]).forEach(function(x){ comInterno[x.id] = 1; });
  var virtuais = (s.revInternas||[]).filter(function(r){ return r.agend && r.agend.data && !comInterno[r.internoId]; }).map(function(r){
    return {id:"IRV"+r.id, nome:r.nome, data:r.agend.data, hora:r.agend.hora, status:"agendado", tipo:r.kitNovo ? "kit_novo" : "acerto"}; });
  // começa do zero em novembro/2026 (Marcus, 04/11/2026): nada antes de 01/11/2026, e só aparecem os meses até o mês de hoje
  var INICIO = "2026-11-01";
  var todos = (s.internos||[]).concat(virtuais).filter(function(x){ return x.data && x.data>=INICIO && x.data.slice(0,7)<=hoje.slice(0,7); });
  var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  var mesDe = function(dt){ return dt.slice(0,7); };   // AAAA-MM
  var nomeMes = function(m){ return MESES[+m.slice(5,7)-1]+" "+m.slice(0,4); };
  var unico = function(x, i, arr){ return x && arr.indexOf(x)===i; };
  var ordem = function(ref){ return function(p, q){ var gp = p>=ref, gq = q>=ref; return gp!==gq ? (gp ? -1 : 1) : gp ? p.localeCompare(q) : q.localeCompare(p); }; };   // agora e o futuro primeiro (em ordem); depois o passado, do mais recente
  var datas = todos.map(function(x){ return x.data; }).filter(unico).sort(ordem(hoje));
  var meses = datas.map(mesDe).filter(unico).sort(ordem(mesDe(hoje)));
  // tudo começa fechado: abre o mês e, dentro dele, o dia (abre para baixo)
  var aberto = function(chave){ return !!abertos[chave]; };
  var alterna = function(chave){ var o = Object.assign({}, abertos); o[chave] = !aberto(chave); setAbertos(o); };

  var corpo = [];
  meses.forEach(function(m){
    var abM = aberto("m"+m);
    corpo.push(e("tr",{key:"m"+m, onClick:function(){ alterna("m"+m); }, className:"cursor-pointer hover:brightness-125"},
      e("td",{colSpan:COLUNAS.length, "aria-expanded":abM, className:"h-8 border-b border-border bg-[#B8862B]/45 px-2.5 text-left text-[13px] font-semibold"}, // padrao-ok: linha do mês com o texto no começo, pedido do Marcus em 04/11/2026
        (abM ? "▾ " : "▸ ")+nomeMes(m))));
    if(!abM) return;
    datas.filter(function(dt){ return mesDe(dt)===m; }).forEach(function(dt){
      var ls = todos.filter(function(x){ return x.data===dt; }).sort(function(p, q){ return (p.hora||"99").localeCompare(q.hora||"99"); });
      var ab2 = aberto(dt);
      corpo.push(e("tr",{key:"d"+dt, onClick:function(){ alterna(dt); }, className:"cursor-pointer hover:brightness-125"},
        e("td",{colSpan:COLUNAS.length, "aria-expanded":ab2, className:"h-8 border-b border-border bg-[#B8862B]/20 pl-8 pr-2.5 text-left text-[13px] font-semibold"}, // padrao-ok: linha do dia com o texto no começo, pedido do Marcus em 04/11/2026
          (ab2 ? "▾ " : "▸ ")+fmtData(dt)+" · "+diaSemana(dt))));
      if(!ab2) return;
      // cabeçalho das colunas logo acima da primeira linha do dia aberto
      corpo.push(e("tr",{key:"c"+dt, style:{background:TOPO}}, COLUNAS.map(function(c){ return e("th",{key:c[0], className:"h-[30px] px-2.5 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-[#1a1306]"}, c[0]); })));
      ls.forEach(function(x){
        corpo.push(e("tr",{key:x.id},
          e("td",{className:"h-8 border-b border-border px-2.5 text-center text-[13px]"}, x.hora || "—"),
          e("td",{className:"h-8 border-b border-border px-2.5 text-center text-[13px] font-semibold"}, x.nome),
          e("td",{className:"h-8 border-b border-border px-2.5 text-center text-[13px]"}, TIPOS[x.tipo||"acerto"] || "Acerto"),
          e("td",{className:"h-8 border-b border-border px-2.5 text-center text-[13px]"}, primeiro(x.bipou)),
          e("td",{className:"h-8 border-b border-border px-2.5 text-center text-[13px]"}, primeiro(x.atendeu))));
      });
    });
  });

  return e(React.Fragment,null,
    e(PageHead,{t:"Atendimento interno · Listagens", sub:"Só reflete as listagens que a Tamara monta no setor Revendedoras. Quem define o dia, a hora e o tipo é ela, não esta tela."}),
    corpo.length ? e("div",{className:"overflow-x-auto rounded-lg border border-border"},
      e("table",{className:"w-full table-fixed border-collapse text-[13px]", style:{minWidth:COLUNAS.reduce(function(t, c){ return t+c[1]; }, 0)}}, // padrao-ok: o cabeçalho das colunas fica dentro de cada dia aberto (opção B, pedido do Marcus em 03/11/2026); a peça TabelaPlanilha só tem cabeçalho no topo
        e("colgroup",null, COLUNAS.map(function(c){ return e("col",{key:c[0], style:{width:c[1]}}); })),
        e("tbody",null, corpo)))
    : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhuma listagem da Tamara por enquanto."));
}

export { AbaIntListagens, Selo };
