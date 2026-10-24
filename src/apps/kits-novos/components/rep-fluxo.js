// Sorelly Admin · kits novos Curitiba — components/rep-fluxo.js
// Representantes › Fluxo: onde estão os kits que passaram para as representantes (mesmas etapas da listagem: solicitado, agendado, montando, bipado, retirado, entregue e devolvido na empresa)
// e quanto tempo cada uma leva em cada etapa. Passar o mouse em qualquer etapa mostra o tempo. Atraso = a LINHA da representante fica vermelha (sem coluna de atrasados).
import { Bloco, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { atrasado, diasNaEtapa, emCurso, prazoDe } from "@/apps/kits-novos/domain/etapas";
import { diasEntre } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { e } from "@/shared/react";

// onde o kit está agora (etapa do funil que importa para a representante). prazo = o da própria etapa (Configurador)
var NA_REP = [["solicitado","Solicitado"], ["aceito","Aceito"], ["contato","Em contato"], ["agendado","Agendado"], ["montando","Montando"], ["bipado","Bipado"], ["retirado","Retirado"], ["entregue","Entregue"], ["devolvido","Devolvido"]];
// trechos: [nome, data de saída, data de chegada, etapa em que o prazo vale, explicação]
var TRECHOS = [
  ["Aceitar", "sol", "ace", "solicitado", "da solicitação até a representante aceitar"],
  ["Contatar", "ace", "con", "aceito", "do aceite até ela falar com a revendedora"],
  ["Agendar", "con", "age", "contato", "do primeiro contato até marcar dia e horário"],
  ["Iniciar", "age", "mon", "agendado", "do agendamento até a montagem começar o kit"],
  ["Montar", "mon", "bip", "montando", "da montagem até o kit ser bipado"],
  ["Pegar kit", "bip", "rtd", "bipado", "do kit bipado até a representante retirar"],
  ["Entregar", "rtd", "ret", "retirado", "da retirada até a entrega à revendedora"],
  ["Devolver", "ret", "dev", "entregue", "da entrega até a condicional voltar para a empresa"]
];

function media(lista, de, ate){
  var v = lista.map(function(c){ return diasEntre(c[de], c[ate]); }).filter(function(x){ return x!=null && x>=0; });
  return v.length ? v.reduce(function(a, b){ return a+b; }, 0)/v.length : null;
}
var diasTxt = function(n){ return N1(n)+(n===1 ? " dia" : " dias"); };

function RepFluxo(){
  var s = use().state, f = s.filtro, b = f.busca.toLowerCase(), por = {};
  s.dados.forEach(function(c){ if(!c.rep) return; if(b && c.rep.toLowerCase().indexOf(b)<0) return; (por[c.rep] = por[c.rep] || []).push(c); });
  var nomes = Object.keys(por).sort(function(a, b2){ return por[b2].length-por[a].length || a.localeCompare(b2); });
  var todos = [].concat.apply([], nomes.map(function(n){ return por[n]; }));
  var andamento = todos.filter(function(c){ return c.st!=="cancelado" && c.st!=="devolvido"; }), atras = andamento.filter(function(c){ return atrasado(c, s.cfg); });
  var dias = function(v){ return v==null ? "—" : N1(v)+" d"; };
  var prazoTxt = function(k){ var p = s.cfg.prazos[k]; return p ? "prazo "+p+(p>1 ? " dias" : " dia") : "sem prazo"; };
  var cor = function(v, etapa){ return v!=null && v>(s.cfg.prazos[etapa]||0) ? "text-destructive" : ""; };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Em andamento", v:String(andamento.length)}, {t:"Atrasados", v:String(atras.length), cor:atras.length ? "text-destructive" : ""}]
      .concat(TRECHOS.map(function(t){ var m = media(todos, t[1], t[2]); return {t:t[0], v:dias(m), cor:cor(m, t[3])}; }))}),
    e(Bloco,{t:"Onde estão os kits"},
      e(TabelaP,{minW:1000, cols:[{t:"Representante", w:180, d:"Linha vermelha = tem kit atrasado"}].concat(NA_REP.map(function(x){ return {t:x[1], w:92, n:1, d:x[1]+" · "+prazoTxt(x[0])}; }))},
        nomes.map(function(n){ var l = por[n].filter(function(c){ return c.st!=="cancelado"; }), atrasadoDela = l.some(function(c){ return atrasado(c, s.cfg); });
          return e(Tr,{key:n, alerta:atrasadoDela, title:atrasadoDela ? "Tem kit atrasado" : ""},
            e(Td,{forte:true}, n),
            NA_REP.map(function(x){ var q = l.filter(function(c){ return c.st===x[0]; }), at = q.filter(function(c){ return atrasado(c, s.cfg); }).length;
              var parado = q.length ? q.reduce(function(t, c){ return t+diasNaEtapa(c); }, 0)/q.length : null;
              var dica = q.length ? q.length+(q.length===1 ? " kit" : " kits")+" · parado"+(q.length===1 ? "" : "s")+" em média "+diasTxt(parado)+" · "+prazoTxt(x[0])+(at ? " · "+at+(at===1 ? " atrasado" : " atrasados") : "") : x[1]+" · "+prazoTxt(x[0]);
              return e(Td,{key:x[0], n:true, cor:at ? "text-destructive" : q.length ? "" : "text-foreground/40", title:dica}, q.length ? String(q.length) : "—"); }));
        }))),
    e(Bloco,{t:"Tempo médio por etapa (dias)"},
      e(TabelaP,{minW:1100, cols:[{t:"Representante", w:180}].concat(TRECHOS.map(function(t){ return {t:t[0], w:92, n:1, d:t[0]+": "+t[4]+" · "+prazoTxt(t[3])}; })).concat([{t:"Ciclo", w:92, n:1, d:"Da solicitação até a entrega à revendedora"}, {t:"Kits", w:70, n:1}])},
        nomes.map(function(n){ var l = por[n], ciclo = media(l, "sol", "ret");
          return e(Tr,{key:n},
            e(Td,{forte:true}, n),
            TRECHOS.map(function(t){ var m = media(l, t[1], t[2]); return e(Td,{key:t[0], n:true, cor:m==null ? "text-foreground/40" : cor(m, t[3]), title:t[0]+": "+t[4]+(m==null ? " · sem dados ainda" : " · média de "+diasTxt(m))+" · "+prazoTxt(t[3])}, dias(m)); }),
            e(Td,{n:true, forte:true, cor:ciclo==null ? "text-foreground/40" : "", title:"Da solicitação até a entrega"}, dias(ciclo)), e(Td,{n:true}, String(l.length)));
        }))));
}

export { RepFluxo };
