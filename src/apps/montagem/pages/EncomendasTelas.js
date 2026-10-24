// Sorelly Admin · montagem — pages/EncomendasTelas.js
// Telas do setor Encomendas e reposições além do Funil (22/10/2026): Ida na empresa, Top 50, Representantes. Regras e mensagens ficam em pages/encomendas/Regras.js.
// Todas no padrão dos Kits novos / Financeiro (PageHead, faixa de totais, bloco Filtros, tabela de layout fixo). Lógica em domain/encomendas.js (estado s.er).
import { Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, BlocoFiltros, Botao, CampoBusca, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { FINAIS, ROTULO_STATUS, agoraSP, bloqueadaNaData, formatarDataHora, formatarDia, formatarReais, hojeSP, minutosDe, qtdMes, reposicoesDoMes, resumoRepresentantes } from "@/apps/montagem/domain/encomendas";
import { Janelas } from "@/apps/montagem/pages/encomendas/janelas";
import { ListagemDia } from "@/apps/montagem/pages/encomendas/ListagemDia";
import { PlanilhaRev } from "@/apps/montagem/pages/encomendas/PlanilhaRev";
import { AbaErRegras } from "@/apps/montagem/pages/encomendas/Regras";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { avancarPedido } from "@/apps/montagem/pages/encomendas/Quadro";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var PASSOS = ["A bipagem recebe a revendedora.", "A bipagem encaminha à sala de Encomendas.", "Encomendas confere a média de vendas e o valor da reposição.", "Encomendas chama a atendente.",
  "Atendimento das peças: frente, ajuda de Encomendas, gavetas da produção e mesa de produção.", "A atendente conclui e chama a Deysiane.", "A Deysiane define quem bipa a reposição."];
var BTN_MINI = "h-6 rounded border border-border px-2 text-[12px] hover:bg-white/10 disabled:opacity-40";

// ---------- Ida na empresa ----------
function AbaEncIda(){
  var E = useEr(), er = E.er, cfg = E.cfg, md = useState(null), tk = useState(0), lim = cfg.reposicao.minutosEscolha;
  useEffect(function(){ var t = setInterval(function(){ tk[1](function(n){ return n+1; }); }, 30000); return function(){ clearInterval(t); }; }, []);
  var agora = agoraSP(), hoje = hojeSP(), ir = function(m){ md[1](m); };
  var todos = er.pedidos.filter(function(x){ return x.tipo==="reposicao" && x.canal==="empresa"; });
  var abertos = todos.filter(function(x){ return !FINAIS[x.status]; }).sort(function(a, b){ return String(a.dataAgendada || "9")+(a.hora || "")<String(b.dataAgendada || "9")+(b.hora || "") ? -1 : 1; });
  var feitos = todos.filter(function(x){ return x.atendInicio && x.atendFim; });
  var dur = function(x){ return Math.max(0, Math.round(minutosDe(x.atendFim)-minutosDe(x.atendInicio))); };
  var media = feitos.length ? Math.round(feitos.reduce(function(t, x){ return t+dur(x); }, 0)/feitos.length) : 0;
  var acima = feitos.filter(function(x){ return dur(x)>lim; }).length;
  var ocupadas = abertos.filter(function(x){ return x.status==="atendimento"; }).map(function(x){ return x.atendente; });
  var minAt = function(x){ return x.atendInicio ? Math.max(0, Math.round(minutosDe(agora)-minutosDe(x.atendInicio))) : null; };
  return e(Pagina,null,
    e(PageHead,{t:"Ida na empresa", sub:"Agenda do dia e atendimento em até "+lim+" minutos."}, e(Botao,{principal:true, onClick:function(){ ir({tipo:"novo"}); }}, "Novo pedido")),
    e("div",{className:"mx-auto w-full max-w-6xl"}, e(FaixaTotais,{itens:[
      {t:"Agendados hoje", v:String(abertos.filter(function(x){ return x.status==="agendado" && x.dataAgendada===hoje; }).length)},
      {t:"Em atendimento", v:String(ocupadas.length)},
      {t:"Bipagem", v:String(abertos.filter(function(x){ return x.status==="bipagem"; }).length)},
      {t:"Concluídas", v:String(todos.filter(function(x){ return x.status==="concluido"; }).length), cor:"text-success"},
      {t:"Tempo médio", v:feitos.length ? media+" min" : "—"},
      {t:"Acima de "+lim+" min", v:String(acima), cor:acima>0 ? "text-destructive" : ""}]})),
    e(Bloco,{t:"Agenda", dir:e("span",{className:"text-[12px] text-foreground/80"}, abertos.length+(abertos.length===1 ? " pedido" : " pedidos"))},
      abertos.length ? e(TabelaP,{minW:900, cols:[{t:"Data", w:90}, {t:"Hora", w:60}, {t:"Revendedora"}, {t:"Valor máximo", w:110, n:true}, {t:"Etapa", w:160}, {t:"Atendente", w:140}, {t:"Cronômetro", w:110, n:true}, {t:"", w:110}]},
        abertos.map(function(x){ var m = minAt(x), sem = x.status==="conferindo" && !x.conferido;
          return e(Tr,{key:x.id, onClick:function(){ ir({tipo:"detalhe", id:x.id}); }},
            e(Td,null, x.dataAgendada ? formatarDia(x.dataAgendada) : "—"), e(Td,null, x.hora || "—"), e(Td,{forte:true}, x.revendedora),
            e(Td,{n:true}, x.valorMax>0 ? formatarReais(x.valorMax) : "—"), e(Td,null, ROTULO_STATUS[x.status]), e(Td,null, x.atendente || "—"),
            e(Td,{n:true, cor:m!=null && !x.atendFim && m>lim ? "text-destructive" : m!=null && !x.atendFim ? "text-success" : ""}, m!=null && !x.atendFim ? m+" de "+lim+" min" : "—"),
            e(Td,null, e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); avancarPedido(E, x, ir); }, className:BTN_MINI}, sem ? "Conferir ›" : x.status==="agendado" ? "Iniciar ›" : "Avançar ›")));
        })) : e(Vazio,{ic:"calendar-check"}, "Nenhuma ida na empresa em aberto.")),
    e(ListagemDia,{E:E}),
    e("div",{className:"grid grid-cols-1 gap-2.5 md:grid-cols-2"},
      e(Bloco,{t:"Passo a passo", dir:e("span",{className:"text-[12px] text-foreground/80"}, "máximo "+lim+" min")},
        e("ol",{className:"flex flex-col gap-1 text-[13px]"}, PASSOS.map(function(t, i){ return e("li",{key:i, className:"flex gap-2"}, e("b",{className:"w-5 shrink-0 text-center text-primary"}, (i+1)+"."), e("span",null, t)); })),
        e("p",{className:"mt-2 text-[12px] text-foreground/80"}, "Média de "+formatarReais(cfg.reposicao.mediaMinima)+" ou mais: pode ver as peças de luxo na sala do Marcus.")),
      e(Bloco,{t:"Atendentes", dir:e("span",{className:"text-[12px] text-foreground/80"}, (cfg.atendentes||[]).length+" no setor")},
        e("ul",{className:"flex flex-col gap-1 text-[13px]"}, (cfg.atendentes||[]).map(function(n){ var oc = ocupadas.indexOf(n)>=0;
          return e("li",{key:n, className:"flex items-center justify-between gap-2 border-b border-border py-1"}, e("span",{className:"truncate"}, n), e(Selo,{cor:oc ? "#F472B6" : "#4ADE80"}, oc ? "Atendendo" : "Livre")); })))),
    e(Janelas,{E:E, modal:md[0], ir:ir}));
}

// ---------- Top 50 ----------
function AbaEncTop50(){
  var E = useEr(), er = E.er, md = useState(null), ir = function(m){ md[1](m); };
  var sols = er.top50Sol.slice().sort(function(x, y){ return (x.status==="pendente" ? 0 : 1)-(y.status==="pendente" ? 0 : 1) || (String(x.em)<String(y.em) ? 1 : -1); }).slice(0, 12);
  var snap = er.top50Snap[er.top50Snap.length-1];
  useEffect(function(){ if(window.location.hash==="#pedidos"){ var t = setTimeout(function(){ var el = document.getElementById("pedidos"); if(el) el.scrollIntoView({behavior:"smooth", block:"start"}); }, 400); return function(){ clearTimeout(t); }; } }, []);
  return e(Pagina,null,
    e(PageHead,{t:"Top 50", sub:"Vendas por mês, média e alerta das revendedoras com reposição por entrega e encomenda."},
      e(Botao,{principal:true, desabilitado:!E.pode, title:E.pode ? "Registra a lista de hoje como aprovada" : "Só a diretoria aprova a lista", onClick:function(){ E.exec("top50_registrar", {}); }}, "Aprovar lista do mês")),
    e(PlanilhaRev,{E:E, grupo:"top50", ir:ir}),
    e("div",{id:"pedidos"}, e(Bloco,{t:"Pedidos ao Marcus", dir:e("span",{className:"text-[12px] text-foreground/80"}, "entrar ou sair do Top 50")},
      sols.length ? e(TabelaP,{minW:860, cols:[{t:"Data", w:88}, {t:"Pedido", w:80}, {t:"Revendedora", w:200}, {t:"Representante", w:140}, {t:"Motivo"}, {t:"Situação", w:110}, {t:"", w:230}]},
        sols.map(function(x){ var pend = x.status==="pendente";
          return e(Tr,{key:x.id}, e(Td,null, formatarDia(String(x.em).slice(0, 10))), e(Td,null, x.tipo==="entrar" ? "Entrada" : "Saída"), e(Td,{forte:true}, x.nome), e(Td,null, x.representante || "—"), e(Td,null, x.motivo),
            e(Td,{cor:pend ? "text-warning" : x.status==="autorizado" ? "text-success" : "text-destructive"}, pend ? "Aguardando" : x.status==="autorizado" ? "Autorizado" : "Recusado"),
            e(Td,null, e("span",{className:"inline-flex gap-1"}, e("button",{type:"button", onClick:function(){ ir({tipo:"msgsol", id:x.id}); }, className:BTN_MINI}, "Mensagem"),
              pend && e("button",{type:"button", disabled:!E.pode, title:E.pode ? "Autoriza e aplica" : "Só a diretoria decide", onClick:function(){ E.exec("top50_decidir", {id:x.id, ok:true}); }, className:BTN_MINI}, "Autorizar"),
              pend && e("button",{type:"button", disabled:!E.pode, onClick:function(){ E.exec("top50_decidir", {id:x.id, ok:false}); }, className:BTN_MINI}, "Recusar"))));
        })) : e(Vazio,{ic:"paper-plane-tilt"}, "Nenhum pedido ao Marcus."))),
    e("div",{className:"grid grid-cols-1 gap-2.5 md:grid-cols-2"},
      e(Bloco,{t:"Entradas e saídas"},
        er.top50Hist.length ? e("ul",{className:"flex flex-col gap-1 text-[13px]"}, er.top50Hist.slice(-12).reverse().map(function(h, i){
          return e("li",{key:i, className:"flex items-start justify-between gap-2 border-b border-border py-1"}, e("span",{className:"min-w-0"}, e("b",null, h.nome), h.motivo && e("span",{className:"block truncate text-[12px] text-foreground/80", title:h.motivo}, h.motivo)),
            e("span",{className:"shrink-0 "+(h.acao==="entrou" ? "text-success" : "text-destructive")}, (h.acao==="entrou" ? "Entrou" : "Saiu")+" · "+formatarDia(String(h.em).slice(0, 10)))); }))
          : e("p",{className:"text-[13px] text-foreground/80"}, "Nenhuma mudança registrada.")),
      e(Bloco,{t:"Atualização mensal"},
        e("ol",{className:"flex list-decimal flex-col gap-1 pl-5 text-[13px]"}, ["Lance a venda do mês de cada revendedora na planilha (a coluna do mês novo abre no dia 1).", "A média dos últimos 3 meses é calculada sozinha.", "Média abaixo do mínimo gera alerta: avalie se ela sai.", "Para sair, clique em Retirar e escreva o motivo.", "Para entrar, use Pedir entrada: a mensagem vai para o Marcus autorizar.", "A diretoria aprova a lista do mês."].map(function(t, i){ return e("li",{key:i}, t); })),
        snap && e("p",{className:"mt-2 text-[12px] text-foreground/80"}, "Última aprovação: "+formatarDataHora(snap.em)+" · "+snap.por))),
    e(Janelas,{E:E, modal:md[0], ir:ir}));
}

// ---------- Representantes ----------
function AbaEncRep(){
  var E = useEr(), er = E.er, cfg = E.cfg, md = useState(null), ir = function(m){ md[1](m); }, linhas = resumoRepresentantes(er), max = cfg.reposicao.repPorSemana;
  var soma = function(k){ return linhas.reduce(function(t, r){ return t+r[k]; }, 0); };
  return e(Pagina,null,
    e(PageHead,{t:"Representantes", sub:"Reposições levadas, limite por semana e valor a receber."}, e(Botao,{principal:true, onClick:function(){ ir({tipo:"novo"}); }}, "Novo pedido")),
    e("div",{className:"mx-auto w-full max-w-6xl"}, e(FaixaTotais,{itens:[
      {t:"Representantes", v:String(linhas.length)}, {t:"Na semana", v:String(soma("semana"))}, {t:"No mês", v:String(soma("mes"))}, {t:"Em aberto", v:String(soma("abertos"))},
      {t:"Entregues", v:String(soma("entregues")), cor:soma("entregues")>0 ? "text-success" : ""}, {t:"A receber", v:formatarReais(linhas.reduce(function(t, r){ return t+r.receber; }, 0))}]})),
    e(Bloco,{t:"Por representante", dir:e("span",{className:"text-[12px] text-foreground/80"}, "limite de "+max+" por semana · "+formatarReais(cfg.reposicao.taxaRepresentante)+" por entrega")},
      linhas.length ? e(TabelaP,{minW:720, cols:[{t:"Representante"}, {t:"Semana", w:110, n:true}, {t:"Mês", w:90, n:true}, {t:"Em aberto", w:100, n:true}, {t:"Entregues", w:100, n:true}, {t:"A receber", w:130, n:true}]},
        linhas.map(function(r){ return e(Tr,{key:r.nome}, e(Td,{forte:true}, r.nome), e(Td,{n:true, cor:r.semana>=max ? "text-destructive" : ""}, r.semana+" de "+max), e(Td,{n:true}, String(r.mes)), e(Td,{n:true}, String(r.abertos)), e(Td,{n:true, cor:r.entregues>0 ? "text-success" : ""}, String(r.entregues)), e(Td,{n:true}, formatarReais(r.receber))); }))
      : e(Vazio,{ic:"users"}, "Nenhuma reposição por representante ainda.")),
    e(Janelas,{E:E, modal:md[0], ir:ir}));
}

// ---------- Regras e mensagens ----------
function AbaEncRegras(){ return e(Pagina,null, e(PageHead,{t:"Regras e mensagens", sub:"Regras do setor, tabela de valores e mensagens prontas."}), e(AbaErRegras,null)); }

export { AbaEncIda, AbaEncTop50, AbaEncRep, AbaEncRegras };
