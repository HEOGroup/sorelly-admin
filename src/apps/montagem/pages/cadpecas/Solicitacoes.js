// Sorelly Admin · montagem — pages/cadpecas/Solicitacoes.js
// Cadastro de peças → aba "Solicitações" (Rayssa e Graziella): pedidos de peças da produção. Respostas: OK (vai produzir), Pronto e Não temos.
// Quem pediu recebe aviso (alerta com som). Regras em domain/pedidos-pecas.js (estado s.pp); quem responde: Configurações → "Responder pedidos de peças da produção".
import { Bloco, CampoSel, FaixaTotais, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { contagem, filaCadastro, podeResponder, resumoPedido, STATUS, URGENCIAS, rot } from "@/apps/montagem/domain/pedidos-pecas";
import { COR_ST, COR_URG, Selo } from "@/apps/montagem/pages/pedidos/pecas-ui";
import { use } from "@/apps/montagem/state/context";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { e, useState } from "@/shared/react";

var dataBr = function(iso){ return String(iso||"").split("-").reverse().join("/"); };
var VISOES = [["abertos", "Em aberto"], ["prontos", "Prontos"], ["todos", "Todos"]];

function AbaSolicitacoes(){
  var x = useCpc(), cx = use(), s = cx.state, disp = cx.dispatch, pp = s.pp || {pedidos:[]}, vs = useState("abertos"), ug = useState("");
  var pode = podeResponder(s, x.por, x.admin), c = contagem(pp);
  var lista = filaCadastro(pp, false).filter(function(p){
    if(ug[0] && p.urg!==ug[0]) return false;
    return vs[0]==="abertos" ? (p.status==="aberto" || p.status==="ok") : vs[0]==="prontos" ? (p.status==="pronto" || p.status==="sem") : true;
  });
  var responder = function(p, status){
    var motivo = "";
    if(status==="sem"){ motivo = window.prompt("Por que não temos? (texto curto, a produção vai ler)", ""); if(motivo===null) return; }
    disp({type:"PP", op:"responder", id:p.id, status:status, resposta:motivo, por:x.por, admin:x.admin});
  };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(FaixaTotais,{itens:[{t:"Novos", v:String(c.aberto), cor:c.aberto ? "text-[#FBBF24]" : undefined}, {t:"Vai produzir", v:String(c.ok), cor:"text-[#60A5FA]"}, {t:"Críticos", v:String(c.criticos), cor:c.criticos ? "text-[#EF4444]" : undefined}, {t:"Prontos", v:String(c.pronto), cor:"text-[#4ADE80]"}, {t:"Não temos", v:String(c.sem)}]}),
    e("div",{className:"flex flex-wrap items-end justify-between gap-2"},
      e(Segmentado,{opcoes:VISOES, atual:vs[0], onMudar:vs[1]}),
      e(CampoSel,{t:"Urgência", id:"sol-urg", cls:"w-40", value:ug[0], onChange:ug[1], opcoes:[["", "Todas"]].concat(URGENCIAS)})),
    e(Bloco,{t:"Solicitações da produção", dir:String(lista.length)},
      !pode && e("p",{className:"mb-2 text-center text-[12px] text-foreground"}, "Você pode ver os pedidos. Só quem cuida do cadastro responde."),
      lista.length ? e(TabelaP,{minW:880, cols:[{t:"Peça"}, {t:"Ação", w:150}, {t:"Mod.", w:48, n:true}, {t:"Urgência", w:90}, {t:"Situação", w:110}, {t:"Quem", w:90}, {t:"Data", w:64}, {t:"Resposta", w:150}]},
        lista.map(function(p){
          var aberto = p.status==="aberto", ok = p.status==="ok", fim = p.status==="pronto" || p.status==="sem";
          var bt = function(rotulo, st, forte){ return e("button",{type:"button", onClick:function(){ responder(p, st); }, className:"h-7 whitespace-nowrap rounded-md border px-2.5 text-[12px] "+(forte ? "border-primary bg-primary/20 font-semibold text-primary hover:bg-primary/30" : "border-border bg-card text-foreground hover:bg-white/10")}, rotulo); };
          return e(Tr,{key:p.id, alerta:p.urg==="critico" && !fim},
            e(Td,{forte:true, title:resumoPedido(p)+(p.texto ? " · "+p.texto : "")}, resumoPedido(p).replace(/ · d+ modelos?$/, "")+(p.texto ? " · "+p.texto : "")),
            e("td",{className:"h-8 border-b border-border px-2.5"}, pode && !fim && e("div",{className:"flex items-center gap-1.5"},
              aberto && bt("OK", "ok", true), ok && bt("Pronto", "pronto", true), bt("Não temos", "sem", false))),
            e(Td,{n:true}, p.modelos ? String(p.modelos) : "—"),
            e(Td,null, e(Selo,{t:rot(URGENCIAS, p.urg), cor:COR_URG[p.urg]})), e(Td,null, e(Selo,{t:STATUS[p.status], cor:COR_ST[p.status]})),
            e(Td,null, p.por), e(Td,null, dataBr(p.em).slice(0, 5)), e(Td,{title:p.resposta}, p.resposta || "—"));
        })) : e("p",{className:"py-2 text-center text-[13px] text-foreground"}, vs[0]==="abertos" ? "Nada em aberto." : "Nenhum pedido aqui.")));
}
export { AbaSolicitacoes };
