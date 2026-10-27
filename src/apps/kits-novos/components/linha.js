// Sorelly Admin · kits novos Curitiba — components/linha.js
// Linha da planilha de kits novos no padrão do Financeiro (TabelaP: linha de 32 px, texto corta com "…", datas e valores à direita).
// Bairro, cidade e profissão ficam em colunas próprias, logo depois do nome, para a Michele ver a região e quem é a revendedora sem abrir o cadastro.
import { Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { nomeEntrada } from "@/apps/kits-novos/domain/config";
import { ETAPAS, aberto, atrasado, diasNaEtapa, etapaDe, prazoDe } from "@/apps/kits-novos/domain/etapas";
import { dataBR, diasEntre } from "@/apps/kits-novos/lib/datas";
import { BK } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { e } from "@/shared/react";

var PEQ = "inline-flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-semibold ";

function Linha(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = p.c, atr = atrasado(c,s.cfg), et = etapaDe(c), prox = aberto(c) && ETAPAS[et.n];
  var abrir = function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); };
  // Situação e alertas em TEXTO (padrão do Financeiro: sem selos soltos no meio da tabela; cor só no valor)
  var sit = c.st==="cancelado" ? "Cancelado" : et.nome, sitCor = (c.st==="entregue" || c.st==="devolvido") ? "text-success" : (c.st==="cancelado" || atr) ? "text-destructive" : "";
  var al = []; if((c.desm||0)>0) al.push(c.desm+(c.desm>1 ? " desmarcações" : " desmarcação")); if(c.tipo==="Retornando") al.push("Retornando"); if(c.rep==="Sorelly") al.push("Vem na empresa");
  if(c.obs && /EXPOSITOR/i.test(c.obs)) al.push("Expositor"); if(c.obs && /FALTA LIGAR/i.test(c.obs) && aberto(c)) al.push("Falta ligar");
  var feitos = (c.c1?1:0)+(c.c2?1:0)+(c.c3?1:0);
  // passar o mouse numa etapa mostra o tempo dela: quanto levou desde a etapa anterior (e o prazo), ou há quantos dias está parada nela
  var tempo = function(x){
    var i = ETAPAS.indexOf(x), v = c[x.campo], prev = null; for(var j = i-1; j>=0; j--){ if(c[ETAPAS[j].campo]){ prev = ETAPAS[j]; break; } }
    var prazo = s.cfg.prazos[x.k], txt = x.nome;
    if(v){ txt += ": "+dataBR(v); if(prev){ var n = diasEntre(c[prev.campo], v); if(n!=null) txt += " · "+n+(n===1 ? " dia" : " dias")+" depois de "+prev.nome.toLowerCase(); } }
    else if(c.st===x.k && c.st!=="cancelado"){ txt += ": está há "+diasNaEtapa(c)+(diasNaEtapa(c)===1 ? " dia" : " dias")+" nesta etapa"; }
    else return "";
    var proxN = ETAPAS[i+1]; if(prazo && proxN) txt += " (prazo "+prazo+(prazo>1 ? " dias" : " dia")+" até "+proxN.nome.toLowerCase()+")";
    return txt;
  };
  var dt = function(x){ var v = c[x.campo]; return e(Td,{c:true, cor:v ? "" : "text-foreground/50", title:tempo(x)}, v ? dataBR(v).slice(0,5) : "—"); };
  var E = function(k){ return ETAPAS.find(function(x){ return x.k===k; }); };
  return e(Tr,{alerta:atr, onClick:abrir},
    e(Td,{c:true, cor:atr ? "text-destructive font-semibold" : ""}, aberto(c) ? diasNaEtapa(c)+"d" : "—"),
    e(Td,{c:true}, dataBR(c.cad).slice(0,5)),
    e(Td,{c:true, forte:true}, (c.tipo==="Retornando" ? "↻ " : "")+c.nome),
    e(Td,{c:true}, c.bai || "—"),
    e(Td,{c:true}, c.cid || "—"),
    e(Td,{c:true}, c.prof || "—"),
    e(Td,{c:true}, nomeEntrada(c, s.cfg) || "—"),
    e(Td,{c:true, cor:c.rep ? "" : "text-warning"}, c.rep || "sem representante"),
    e(Td,{c:true, title:c.mod+" "+BK(c.val)}, c.mod+" "+BK(c.val)),
    e(Td,{c:true, cor:sitCor, forte:atr, title:atr ? sit+", atrasada "+(diasNaEtapa(c)-prazoDe(c, s.cfg))+" dias" : sit}, atr ? sit+" · atrasada "+(diasNaEtapa(c)-prazoDe(c, s.cfg))+"d" : sit),
    e(Td,{c:true, cor:(c.desm||0)>=s.cfg.maxDesmarcacoes ? "text-destructive" : al.length ? "text-warning" : "text-foreground/40"}, al.length ? al.join(" · ") : "—"),
    dt(E("liberado")), dt(E("solicitado")), dt(E("aceito")), dt(E("contato")), dt(E("agendado")),
    e(Td,{c:true, title:c.agDia ? "Marcada com a revendedora: "+dataBR(c.agDia)+(c.agPer ? ", "+c.agPer.toLowerCase() : "") : ""}, c.agDia ? dataBR(c.agDia).slice(0,5)+(c.agPer ? " "+c.agPer.charAt(0) : "") : "—"),
    dt(E("montando")), dt(E("bipado")), dt(E("retirado")), dt(E("entregue")), dt(E("devolvido")),
    e(Td,{c:true}, c.retirada || "—"),
    e(Td,{c:true, cor:feitos===3 ? "text-success" : "", title:"Contatos de referência confirmados"}, feitos+"/3"),   // só o cadastro usa, até liberar (fica no fim da tabela)
    e(Td,{c:true}, e("span",{className:"flex justify-center gap-1"},
      prox && e("button",{type:"button", title:"Avançar para "+prox.nome.toLowerCase(), onClick:function(ev){ ev.stopPropagation(); d({type:"DIALOGO", d:{tipo:"avancar", id:c.id}}); },
        className:PEQ+"bg-primary text-primary-foreground hover:bg-primary/80"}, e(Icon,{n:"arrowright", s:13}), prox.nome),
      e("button",{type:"button", "aria-label":"Mais ações", onClick:function(ev){ ev.stopPropagation(); abrir(); }, className:"grid size-6 place-items-center rounded-md hover:bg-white/10"}, e(Icon,{n:"dots", s:15})))));
}
var COLS = [{t:"Dias", w:52, c:1}, {t:"Cadastro", w:84, c:1}, {t:"Nome", w:220, c:1}, {t:"Bairro", w:140, c:1}, {t:"Cidade", w:160, c:1}, {t:"Profissão", w:170, c:1}, {t:"Entrada", w:104, c:1}, {t:"Representante", w:150, c:1},
  {t:"Kit", w:140, c:1}, {t:"Situação", w:210, c:1}, {t:"Alertas", w:200, c:1}, {t:"Liberado", w:80, c:1}, {t:"Solicitado", w:100, c:1}, {t:"Aceito", w:68, c:1}, {t:"Contato", w:74, c:1}, {t:"Agendado", w:88, c:1}, {t:"Marcada", w:84, c:1}, {t:"Montando", w:84, c:1}, {t:"Bipado", w:70, c:1}, {t:"Retirado", w:80, c:1}, {t:"Entrega", w:76, c:1}, {t:"Devolvido", w:86, c:1}, {t:"Retirada", w:140, c:1}, {t:"Contatos", w:80, c:1}, {t:"", w:130, c:1}];
var LARGURA = COLS.reduce(function(t, c){ return t + c.w; }, 0);

export { Linha, COLS, LARGURA };
