// Sorelly Admin — pages/AtendimentoInternoListagens.js
// Kits → Atendimento interno → Listagens. São as revendedoras que acertam na própria Sorelly (~416 das 2.033).
// Tela SÓ de visualização (03/11/2026, opção B "Planilha por dia" escolhida pelo Marcus): reflete as listagens que a Tamara monta no setor Revendedoras.
// Padrão da Listagens de Montagem (Marcus, 25/11/2026): Dia na barra, um botão que abre/fecha todos os dias, TabelaPlanilha com uma linha de grupo por dia.
// Colunas: Horário, Nome, Tipo, Quem bipou, Quem atende na montagem. Valor, pagamento e tempo ficam no Consolidado Sorelly.
// Quem monta a agenda e define o tipo é a Tamara (Revendedoras); remarcação e multa ficam registradas lá.
// Na tela "Atendimento Sorelly" aparece só a agenda do dia.
import { JanelaIncluirCliente, sincronizarDm } from "@/apps/montagem/pages/RevendedorasInternas";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { BarraTabela, CelulaBarra, CLS_FINA_ESPACO, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { MenuDias, tituloAba } from "@/apps/montagem/components/menu-dias";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";

var TIPOS = {acerto:"Acerto", kit_novo:"Kit novo", reposicao:"Reposição", premio:"Retirada de prêmio", indicacao:"Brinde de indicação", retornando:"Kit retornando", troca:"Troca de peça"};
var SITUACAO = {agendado:"Agendado", atendendo:"Em atendimento", acertado:"Acertado", cancelado:"Cancelado", faltou:"Faltou"};
var BTN_BARRA = "inline-flex h-[18px] items-center justify-center whitespace-nowrap rounded border border-white/50 bg-[#14233f] px-2 text-[10px] font-semibold normal-case text-white hover:bg-white/15";   // controle de 18 px na barra azul, padrão compacto de 25/11/2026
var primeiro = function(n){ return n ? n.split(" ")[0] : "—"; };

function Selo(p){ return e("span",{className:"rounded-full bg-slate-600 px-2 text-[10px] font-semibold text-white", title:"Kit 100% Prata"}, p.children || "100% PRATA"); }   // usado pela Atendimento Sorelly

function AbaIntListagens(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = isoDia(new Date());
  var iv = useState(false), incluindo = iv[0], setIncluindo = iv[1];   // + Incluir cliente: quem chegou e não está na listagem (Marcus, 11/11/2026)
  // as agendadas pela Tamara vêm da DevMaster: atualiza ao abrir e a cada 10 minutos (mesma busca da aba Revendedoras)
  useEffect(function(){ var rodar = function(){ if(apiAtiva()) sincronizarDm(d, true).catch(function(){ /* sem servidor: segue com o que já está salvo */ }); }; rodar(); var t = setInterval(rodar, 600000); return function(){ clearInterval(t); }; }, []);
  var ds = useState(null), diaSel = ds[0], setDiaSel = ds[1], fs = useState({}), fechadas = fs[0], setFechadas = fs[1];   // fechadas: dias fechados (tudo começa aberto, como na Listagens de Montagem)

  // agendadas pela Tamara (lista de Revendedoras) que ainda não viraram atendimento: aparecem aqui como linhas virtuais
  var comInterno = {}; (s.internos||[]).forEach(function(x){ comInterno[x.id] = 1; });
  var virtuais = (s.revInternas||[]).filter(function(r){ return r.agend && r.agend.data && !comInterno[r.internoId]; }).map(function(r){
    return {id:"IRV"+r.id, nome:r.nome, data:r.agend.data, hora:r.agend.hora, status:"agendado", tipo:r.tipoAtend || (r.kitNovo ? "kit_novo" : "acerto")}; });
  // começa do zero em novembro/2026 (Marcus, 04/11/2026): nada antes de 01/11/2026, e só aparecem os meses até o mês de hoje
  var INICIO = "2026-11-01";
  var todos = (s.internos||[]).concat(virtuais).filter(function(x){ return x.data && x.data>=INICIO && x.data.slice(0,7)<=hoje.slice(0,7); })
  var vistos = {}; todos = todos.filter(function(x){ if(vistos[x.id]) return false; vistos[x.id] = 1; return true; });   // o mesmo atendimento não entra duas vezes (id repetido deixava linha fantasma ao fechar)
  var dias = []; todos.forEach(function(x){ if(dias.indexOf(x.data)<0) dias.push(x.data); }); dias.sort();
    var diasAtivos = (diaSel||[]).filter(function(x){ return dias.indexOf(x)>=0; }); if(!diasAtivos.length) diasAtivos = dias;   // abre com TODOS os dias do mês (Marcus, 25/11/2026: "fechar todas" tem que fechar todas)
  var linhas = todos.filter(function(x){ return diasAtivos.indexOf(x.data)>=0; }).sort(function(p, q){ return p.data!==q.data ? p.data.localeCompare(q.data) : (p.hora||"99").localeCompare(q.hora||"99"); })
    .map(function(x){
      // venda e acerto vêm do registro do acerto (mesma fonte do Consolidado Sorelly); só existem depois que o atendimento foi acertado
      var reg = (s.acertosConsignado||[]).find(function(a){ return a.internoId===x.id; }) || x.acerto || {};
      return {id:x.id, grupo:x.data, hora:x.hora || "—", nome:x.nome, tipo:TIPOS[x.tipo||"acerto"] || "Acerto", sit:SITUACAO[x.status] || x.status || "Agendado", bipou:primeiro(x.bipou), atendeu:primeiro(x.atendeu),
        venda:reg.vendaLiquida!=null ? BK(reg.vendaLiquida) : "—", acerto:reg.valorAcerto!=null ? BK(reg.valorAcerto) : "—"}; });
  var todasAbertas = diasAtivos.every(function(dt){ return !fechadas[dt]; });   // um botão só: abre tudo ou fecha tudo (Marcus, 25/11/2026)
  var abreTodas = function(v){ var o = {}; if(!v) diasAtivos.forEach(function(dt){ o[dt] = true; }); setFechadas(o); };
  var cols = [{k:"hora", t:"Horário"}, {k:"nome", t:"Nome"}, {k:"tipo", t:"Tipo"}, {k:"sit", t:"Situação"}, {k:"bipou", t:"Quem bipou"}, {k:"atendeu", t:"Quem atende na montagem"}, {k:"venda", t:"Valor da venda"}, {k:"acerto", t:"Valor do acerto"}];
  var linhaGrupo = function(g, ls){ return {span:cols.length, rotulo:e("span",null, tituloAba(g)+" · "+ls.length+(ls.length===1 ? " atendimento" : " atendimentos")), resto:[]}; };

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3 [&_*]:!normal-case"},
    e(BlocoPainel,{titulo:"Atendimento interno · Listagens", compacto:true},
      e(BarraTabela,null,
        dias.length>0 && e(CelulaBarra,{rotulo:"Dia"}, e(MenuDias,{dias:dias, sel:diasAtivos, onChange:setDiaSel})),
        dias.length>0 && e(CelulaBarra,{rotulo:"Listagens"}, e("div",{className:"flex items-center px-1"}, e("button",{type:"button", className:BTN_BARRA, onClick:function(){ abreTodas(!todasAbertas); }}, todasAbertas ? "Fechar todas" : "Abrir todas"))),
        e(CelulaBarra,{rotulo:"Cliente"}, e("div",{className:"flex items-center px-1"}, e("button",{type:"button", className:BTN_BARRA, onClick:function(){ setIncluindo(true); }}, "Incluir cliente")))),
      e("div",{className:"flex min-h-0 flex-1 flex-col bg-[#0f1729]"},
        e("div",{ref:refCheia(), className:CLS_FINA_ESPACO+" [&_td[colspan]]:!bg-[var(--bloco-colunas)] [&_td[colspan]]:!text-white [&_tr]:!cursor-default [&_td]:!cursor-default"},
          e(TabelaPlanilha,{key:"intlist", fina:true, semFiltro:true, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true, semMao:true,
            agrupar:"grupo", linhaGrupo:linhaGrupo, grupoEsquerda:true,
            grupoAberto:function(g){ return !fechadas[g]; }, aoGrupo:function(g){ var o = Object.assign({}, fechadas); o[g] = !fechadas[g]; setFechadas(o); },
            vazio:"Nenhuma listagem da Tamara por enquanto."})))),
    incluindo && e(JanelaIncluirCliente,{imediato:true, lista:s.revInternas||[], hojeIso:hoje, dispatch:d, abrir:function(){}, irParaDia:function(){}, fechar:function(){ setIncluindo(false); }}));
}

export { AbaIntListagens, Selo };
