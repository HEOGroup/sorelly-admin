// Sorelly Admin · montagem — pages/PedirPecas.js
// Kits (interno) → "Pedir peças" (Deysiane e Milene): pedido de peças ao Cadastro de peças, com a resposta do cadastro (vai produzir, pronto, não temos).
// Regras em domain/pedidos-pecas.js (estado s.pp). As montadoras pedem pelo app da montadora (mobile/montadora-pedido.js).
import { Bloco, Botao, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { avisosDe, contagem, filaCadastro, resumoPedido, STATUS, URGENCIAS, rot } from "@/apps/montagem/domain/pedidos-pecas";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { COR_ST, COR_URG, FormPedido, Selo } from "@/apps/montagem/pages/pedidos/pecas-ui";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

var dataBr = function(iso){ return String(iso||"").split("-").reverse().join("/"); };

function AbaPedirPecas(){
  var cx = use(), s = cx.state, d = cx.dispatch, pp = s.pp || {pedidos:[]}, por = nomeDe(s.usuario);
  var c = contagem(pp), avisos = avisosDe(pp, s.usuario), todos = filaCadastro(pp, false);
  var enviar = function(v){
    if(!v.tipo && !v.texto.trim()){ d({type:"PP", op:"add", por:por, porId:s.usuario, tipo:"", texto:""}); return false; }
    d({type:"PP", op:"add", por:por, porId:s.usuario, origem:"admin", tipo:v.tipo, banho:v.banho, publico:v.publico, modelos:v.modelos, urg:v.urg, texto:v.texto}); return true;
  };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Pedir peças", sub:"Peça ao cadastro as peças que a produção precisa. A resposta chega aqui e como aviso."}),
    e(FaixaTotais,{itens:[{t:"Pedidos", v:String(c.aberto)}, {t:"Vai produzir", v:String(c.ok), cor:"text-[#60A5FA]"}, {t:"Prontos", v:String(c.pronto), cor:"text-[#4ADE80]"}, {t:"Não temos", v:String(c.sem), cor:c.sem ? "text-[#EF4444]" : undefined}]}),
    avisos.length>0 && e(Bloco,{t:"Respostas do cadastro", dir:e(Botao,{onClick:function(){ d({type:"PP", op:"visto_todos", porId:s.usuario}); }}, "Entendi tudo")},
      e("div",{className:"flex flex-col gap-1"}, avisos.map(function(p){
        return e("div",{key:p.id, className:"flex min-h-8 items-center justify-between gap-2 text-[13px]"},
          e("span",{className:"min-w-0 truncate", title:resumoPedido(p)+" · "+(p.resposta||"")},
            e("b",null, resumoPedido(p)), p.resposta ? " · "+p.resposta : ""),
          e("span",{className:"flex shrink-0 items-center gap-2"}, e(Selo,{t:p.status==="pronto" ? "Pronto, pode buscar" : STATUS[p.status], cor:COR_ST[p.status]}),
            e(Botao,{onClick:function(){ d({type:"PP", op:"visto", id:p.id}); }}, "Entendi")));
      }))),
    e(Bloco,{t:"Novo pedido"}, e(FormPedido,{onEnviar:enviar})),
    e(Bloco,{t:"Pedidos", dir:String(todos.length)},
      todos.length ? e(TabelaP,{minW:980, cols:[{t:"Data", w:90}, {t:"Peça"}, {t:"Modelos", w:80, n:true}, {t:"Urgência", w:100}, {t:"Quem", w:110}, {t:"Situação", w:130}, {t:"Resposta", w:220}]},
        todos.map(function(p){
          var meu = p.porId===s.usuario;
          return e(Tr,{key:p.id},
            e(Td,null, dataBr(p.em)), e(Td,{forte:meu, title:resumoPedido(p)+(p.texto ? " · "+p.texto : "")}, resumoPedido(p).replace(/ · \d+ modelos?$/, "")+(p.texto ? " · "+p.texto : "")),
            e(Td,{n:true}, p.modelos ? String(p.modelos) : "—"),
            e(Td,null, e(Selo,{t:rot(URGENCIAS, p.urg), cor:COR_URG[p.urg]})), e(Td,null, p.por),
            e(Td,null, e(Selo,{t:STATUS[p.status], cor:COR_ST[p.status]})), e(Td,{title:p.resposta}, p.resposta || "—"));
        })) : e("p",{className:"py-2 text-center text-[13px] text-foreground"}, "Nenhum pedido ainda.")));
}
export { AbaPedirPecas };
