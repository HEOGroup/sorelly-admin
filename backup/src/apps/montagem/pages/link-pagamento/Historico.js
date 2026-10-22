// Sorelly Admin · montagem — pages/link-pagamento/Historico.js
// Aba Histórico: tudo o que já terminou (pago, negado, abandonado, expirado, cancelado...), em tabela filtrável por mês, status, representante, link e busca, com paginação.
// O quadro de Solicitações mostra só o que está em andamento; os milhares de registros antigos (inclusive os da planilha de 2026) ficam aqui.
import { BarraFiltros, Faixa, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { CANAIS, COR_STATUS, EM_ANDAMENTO, ROTULO_STATUS, STATUS, formatarDia, formatarReais, listaSolicitacoes, meioDe, mesDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { Busca, Ind, Sel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e, useMemo, useState } from "@/shared/react";

var POR_PAGINA = 50;
var VAZIO = {mes:"", status:"", representante:"", meioId:"", canal:"", busca:""};
var NOME_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var rotuloMes = function(m){ var p = String(m).split("-"); return NOME_MES[+p[1]-1]+"/"+p[0]; };

function AbaLpHistorico(){
  var L = useLp(), s = L.s, lp = L.lp, st = useState(VAZIO), f = st[0], pg = useState(0), pagina = pg[0];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); pg[1](0); };
  var n = lp.solicitacoes.length;
  var base = useMemo(function(){
    var meses = {}, reps = {};
    lp.solicitacoes.forEach(function(x){ meses[mesDe(x.criadoEm)] = 1; if(x.representante) reps[x.representante] = 1; });
    return {meses:Object.keys(meses).sort().reverse(), reps:Object.keys(reps).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); })};
  }, [n]);
  var lista = useMemo(function(){
    return listaSolicitacoes(s, f).filter(function(x){ return f.status ? true : !EM_ANDAMENTO[x.status]; });
  }, [n, lp.solicitacoes, f]);
  var tot = useMemo(function(){ var o = {pagos:0, valor:0, semSucesso:0}; lista.forEach(function(x){ if(x.status==="pago" || x.status==="comprovante"){ o.pagos++; o.valor += x.valor; } else o.semSucesso++; }); return o; }, [lista]);
  var paginas = Math.max(1, Math.ceil(lista.length/POR_PAGINA)), pag = Math.min(pagina, paginas-1), fatia = lista.slice(pag*POR_PAGINA, (pag+1)*POR_PAGINA);
  var ativo = !!(f.mes || f.status || f.representante || f.meioId || f.canal || f.busca);
  var meiosLink = lp.meios.map(function(m){ return [m.id, nomeMeio(m)]; });
  var aviso = function(x){ return [x.suspeitaDuplicada ? "Possível duplicada (mesma data, revendedora, valor e parcelas)" : "", x.suspeitaDados || ""].filter(Boolean).join(" · "); };
  var cols = ["Data", "Revendedora", "Representante", "Link", "Valor", "Parcelas", "Bandeira", "Canal", "Situação", "Pago em", "Acerto", "Aviso"];
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(Ind,{t:"Registros", v:lista.length, cor:"total", titulo:"Registros que atendem aos filtros"}),
      e(Ind,{t:"Pagos", v:tot.pagos, cor:"ok"}),
      e(Ind,{t:"Valor pago", v:formatarReais(tot.valor), cor:"ok"}),
      e(Ind,{t:"Sem pagamento", v:tot.semSucesso, cor:"neutro", titulo:"Negados, abandonados, expirados, cancelados e demais finais"})),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ st[1](VAZIO); pg[1](0); }},
      e(Busca,{v:f.busca, set:function(v){ set("busca", v); }, ph:"Buscar revendedora, representante ou autorização"}),
      e(Sel,{v:f.mes, set:function(v){ set("mes", v); }, rot:"Mês", todos:"Todos os meses", opcoes:base.meses.map(function(m){ return [m, rotuloMes(m)]; })}),
      e(Sel,{v:f.status, set:function(v){ set("status", v); }, rot:"Situação", todos:"Todas as finalizadas", opcoes:STATUS.map(function(k){ return [k, ROTULO_STATUS[k]]; })}),
      e(Sel,{v:f.representante, set:function(v){ set("representante", v); }, rot:"Representante", todos:"Todas as representantes", opcoes:base.reps.map(function(r){ return [r, r]; })}),
      e(Sel,{v:f.meioId, set:function(v){ set("meioId", v); }, rot:"Link", todos:"Todos os links", opcoes:meiosLink}),
      e(Sel,{v:f.canal, set:function(v){ set("canal", v); }, rot:"Canal", todos:"Todos os canais", opcoes:CANAIS})),
    e(BlocoBarra,{cor:"turquesa", t:"Histórico de solicitações", compacto:true, dir:String(lista.length)},
      fatia.length ? e("div",{className:"p-2"},
        e(Tab,{cols:cols}, fatia.map(function(x){
          var m = meioDe(s, x.meioId), av = aviso(x), cor = COR_STATUS[x.status], pago = x.status==="pago" || x.status==="comprovante";
          return e("tr",{key:x.id, className:LINHA},
            e(Td,null, formatarDia(x.criadoEm)), e(Td,{forte:true}, x.revendedora), e(Td,null, x.representante || "—"), e(Td,null, m ? m.nome : "—"),
            e(Td,{dinheiro:true, cor:pago ? "ok" : undefined}, formatarReais(x.valor)), e(Td,{dinheiro:true}, (x.parcelas || 1)+"x"), e(Td,null, x.bandeira || "—"),
            e(Td,null, x.canal==="whatsapp" ? "WhatsApp" : "App"), e(Td,null, e(Selo,{cor:cor}, ROTULO_STATUS[x.status])),
            e(Td,null, formatarDia(x.pagoEm) || "—"), e(Td,null, formatarDia(x.dataAcerto) || "—"),
            e(Td,null, av ? e(Selo,{cor:"#FBBF24", ic:"warning", titulo:av}, "Conferir") : ""));
        })),
        e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-2"},
          e("button",{type:"button", disabled:pag===0, onClick:function(){ pg[1](pag-1); }, className:"h-8 rounded-lg bg-white/10 px-3 text-[12.5px] font-bold hover:bg-white/20 disabled:opacity-35"}, "‹ Anterior"),
          e("span",{className:"text-[12.5px] font-bold text-white/80"}, "Página "+(pag+1)+" de "+paginas),
          e("button",{type:"button", disabled:pag>=paginas-1, onClick:function(){ pg[1](pag+1); }, className:"h-8 rounded-lg bg-white/10 px-3 text-[12.5px] font-bold hover:bg-white/20 disabled:opacity-35"}, "Próxima ›")))
        : e("div",{className:"p-2"}, e(Vazio,{ic:"clock-counter-clockwise"}, "Nenhum registro para os filtros escolhidos."))));
}
export { AbaLpHistorico };
