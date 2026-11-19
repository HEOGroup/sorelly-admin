// Sorelly Admin · montagem e bipagem — components/fila-planilha.js
// A FILA das Listagens no padrão do Financeiro (Marcus, 16/11/2026: "a tela de listagens do dia no padrão azul"): UMA tabela (TabelaPlanilha) com uma linha por kit,
// agrupada por listagem (representante, dia, horário), filtro e ordem no cabeçalho de cada coluna, texto de 13 px, sem chips, sem faixa de totais e sem barra de filtros.
// Faz tudo o que a fila antiga (components/fila.js, que continua no projeto só pelo ETAPA) fazia: valor clicável, Montar, Bipar, Ações (⋯) e os botões de cada listagem
// (Confirmar valores, Última hora, Retirada) na linha do grupo. Clicar numa revendedora abre a FICHA dela (janela com barra azul, como a do Contas a pagar e a das Condicionais):
// dados do kit, andamento, condicionais (pegou, conferiu, falta) e, para a supervisão, o valor do kit e o finalizar da bipagem.
// Sem as etiquetas Só Encomendas e Mesa maior (Marcus: "nada a ver"); a regra delas também foi desligada em config.js. A coluna Condicionais é só texto (quantas já foram pegas).
// Dinheiro (média, valor do kit, vendas) só aparece para a supervisão; montadora e bipadora nunca veem valores.
import { LinhaFinalizar } from "@/apps/montagem/components/condicionais";
import { ETAPA, tempoFim } from "@/apps/montagem/components/fila";
import { JanelaMontar } from "@/apps/montagem/components/janela-montar";
import { KitValor, eventosDoKit } from "@/apps/montagem/components/kit-valor";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { tituloAba } from "@/apps/montagem/components/menu-dias";
import { MenuAcoes } from "@/apps/montagem/components/menu-acoes";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { condEstado, condNovas, condNums } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { ehEncomendas, filaMontagem, nomesEncomendas, semMontador, soEncomendas } from "@/apps/montagem/domain/regras";
import { SEM_KIT, STATUS_LB, TIPO_KIT } from "@/apps/montagem/domain/status";
import { media3 } from "@/apps/montagem/domain/vendas";
import { BK, minutos } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio, RelogioB } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";

var parar = function(ev){ ev.stopPropagation(); };   // botão dentro da linha não abre a ficha
// cor SÓ do estado, na letra da coluna Situação (nada de selo colorido)
var COR_SIT = {bipado:"text-success", retirado:"text-success", supervisao:"text-warning", semvalor:"text-warning", ajuste:"text-destructive", montando:"text-primary", bipando:"text-primary"};
// botão pequeno de contorno branco, sem fundo cinza; o principal leva o azul do bloco (o mesmo da tela Condicionais)
var BTN = "inline-flex h-7 min-w-16 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-2.5 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-40 ";   // padrao-ok: botão de 28 px dentro da linha de 32 px (o Marcus aprovou esse tamanho em 16/11/2026)
function Bt(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.off, title:p.titulo, "aria-label":p.rotulo, className:(p.estreito ? BTN.replace("min-w-16", "w-7 min-w-0").replace("px-2.5", "px-0") : BTN)+(p.principal ? "border-white bg-[var(--bloco-titulo)] hover:brightness-125" : "border-white/60 bg-transparent")}, p.children);
}
var vazio = e("span",null,"—");
// chave do grupo de uma listagem: dia | horário | representante | id (a tabela ordena os grupos pela chave, então saem em ordem de data e de horário)
function chaveGrupo(l){ return String(l.data||"sem-data").slice(0, 10)+"|"+String(minutos(l.horario)).padStart(4, "0")+"|"+l.rep+"|"+l.id; }
// quantas condicionais já foram pegas (montadora) ou conferidas (bipadora): da bipagem em diante vale a conferência, antes vale o pegar
function andamentoCond(k){
  var nums = condNums(k), fase = ["bipando","bipado","retirado"].indexOf(k.status)>=0 ? "b" : "m";
  var feitas = nums.filter(function(n){ var st = condEstado(k, n); return fase==="b" ? st.b : st.m; }).length, faltas = nums.filter(function(n){ return condEstado(k, n).falta; }).length;
  return {total:nums.length, feitas:feitas, faltas:faltas, fase:fase};
}

// FICHA do kit: abre ao clicar na revendedora. Mesmo desenho das fichas do Contas a pagar e das Condicionais: overlay, janela com barra azul, faixa de células, faixas de largura inteira e rodapé.
function FichaKit(p){
  var s = p.s, d = p.d, k = p.k, l = p.l, sup = p.sup, lista = p.lista, papel = sup ? "sup" : p.euBip ? "b" : "m";
  var idx = lista.findIndex(function(x){ return x.k.id===k.id; }), ant = idx>0 ? lista[idx-1] : null, prox = idx>=0 && idx<lista.length-1 ? lista[idx+1] : null;
  var tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, semKit = !!SEM_KIT[k.tipoKit], sit = k.pausadoEm ? "Pausado" : STATUS_LB[k.status];
  var cel = function(rot, valor){ return e("div",{key:rot, className:"min-w-0 border-b border-r border-border px-3 py-1 text-center"}, e("p",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot), e("div",{className:"text-[13px] font-semibold"}, valor)); };
  var celulas = [cel("Revendedora", k.rev), cel("Representante", l.rep), cel("Listagem", tituloAba(String(l.data||"sem-data").slice(0, 10))+" · "+l.horario+(l.viagem ? " · viagem para "+l.destino : "")), cel("Tipo", tipo[1]),
    cel("Situação", e("span",{className:k.pausadoEm ? "text-warning" : (COR_SIT[k.status] || "")}, sit)), cel("Montadora", k.montId ? nomeDe(k.montId) : "—"), cel("Bipadora", k.bipId ? nomeDe(k.bipId) : "—"), cel("Horário do atendimento", k.horaAtend || "—")];
  if(sup && !semKit) celulas = celulas.concat([cel("Valor do kit", e(KitValor,{k:k, ro:false, key:k.id+":"+k.valor+":"+k.status})), cel("Média das vendas", k.vendas && k.vendas.length ? BK(media3(k.vendas)) : "Sem vendas")]);
  var ev = eventosDoKit(s, k, sup), nums = condNums(k), novas = condNovas(k);
  var faixa = function(t){ return e("p",{className:"border-b border-t border-border px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, t); };
  var linha = function(a, b, i){ return e("div",{key:i, className:"grid grid-cols-[9rem_1fr] border-b border-border text-[13px]"}, e("div",{className:"border-r border-border px-3 py-1 font-semibold"}, a), e("div",{className:"px-3 py-1"}, b)); };
  return e("div",{className:"fixed inset-0 z-[80] flex justify-center overflow-y-auto bg-black/70 p-3 md:p-6", onClick:function(ev0){ if(ev0.target===ev0.currentTarget) p.fechar(); }},
    e("div",{className:PADRAO_BLOCOS+" m-auto w-full max-w-3xl rounded-lg bg-[#14171c] text-[13px] [&>section]:!bg-[#14171c]"},
      e(BlocoPainel,{titulo:k.rev+" · "+l.rep+" · "+l.horario, dir:e("span",{className:k.pausadoEm ? "text-warning" : (COR_SIT[k.status] || "")}, sit)},
        e("div",{className:"grid grid-cols-2 md:grid-cols-4 [&>div:nth-child(4n)]:md:border-r-0"}, celulas),
        faixa("Andamento"),
        ev.length ? ev.map(function(x, i){ return linha(x[0], x[1], i); }) : e("p",{className:"px-3 py-2 text-center"}, "Ainda sem andamento."),
        nums.length>0 && faixa("Condicionais"),
        nums.map(function(n){ var st = condEstado(k, n), feito = papel==="b" ? st.b : papel==="m" ? st.m : st.m && st.b;
          var marca = function(rot, pp, marcado){ return e("label",{className:"inline-flex cursor-pointer items-center gap-1.5"+(st.falta ? " opacity-60" : "")}, e("input",{type:"checkbox", checked:marcado, disabled:st.falta, onChange:function(){ d({type:"COND_CHK", id:k.id, num:n, papel:pp, v:!marcado, por:s.usuario}); }}), rot); };
          return e("div",{key:n, className:"flex min-h-8 flex-wrap items-center justify-center gap-x-5 gap-y-1 border-b border-border px-3 py-1 text-[13px]"},
            e("b",{className:MONO+" w-24 text-center"}, n),
            e("span",{className:"w-24 text-center font-semibold "+(st.falta ? "text-destructive" : st.imp ? "text-primary" : feito ? "text-success" : "text-warning")}, st.falta ? "Falta" : st.imp ? "Impressa" : feito ? "Conferida" : "A conferir"),
            (papel==="m" || papel==="sup") && marca(papel==="sup" ? "Montadora pegou" : "Peguei", "m", st.m),
            (papel==="b" || papel==="sup") && marca(papel==="sup" ? "Bipadora conferiu" : "Conferi", "b", st.b),
            !st.falta && !st.imp && !feito && e(Bt,{onClick:function(){ d({type:"COND_FALTA", id:k.id, num:n, por:s.usuario}); }}, "Falta"),
            st.falta && sup && e(Bt,{onClick:function(){ d({type:"COND_IMPRESSA", id:k.id, num:n, por:s.usuario}); }}, "Imprimi")); }),
        novas.length>0 && e("p",{className:"border-b border-border px-3 py-1 text-center"}, novas.length>1 ? "Novas condicionais: " : "Nova condicional: ", e("b",{className:MONO+" font-semibold"}, novas.join("   "))),
        sup && k.status==="bipando" && faixa("Finalizar a bipagem"),
        sup && k.status==="bipando" && e("div",{className:"overflow-x-auto border-b border-border px-3 py-2"}, e(LinhaFinalizar,{k:k, fechar:null})),
        e("div",{className:"flex flex-wrap items-center justify-between gap-2 px-3 py-1.5"},
          e("div",{className:"flex gap-2"}, e(Bt,{off:!ant, onClick:function(){ p.ir(ant.k.id); }}, "‹ Anterior"), e(Bt,{off:!prox, onClick:function(){ p.ir(prox.k.id); }}, "Próxima ›")),
          e(Bt,{estreito:true, rotulo:"Fechar", titulo:"Fechar", onClick:p.fechar}, "✕")))));
}

function FilaPlanilha(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var jm = useState(null), janelaKit = jm[0], setJanelaKit = jm[1];   // kit aberto na janela de montagem (botão Montar)
  var fc = useState(null), fichaId = fc[0], setFichaId = fc[1];   // kit aberto na ficha (clique na revendedora)
  var fila = filaMontagem(s);
  var sup = papelDe(s.usuario)==="supervisao", euBip = papelDe(s.usuario)==="bipadora" ? s.usuario : null;
  var euMont = papelDe(s.usuario)==="montadora", podeMontar = sup || euMont;
  var euBipando = euBip && s.kits.some(function(k){ return k.bipId===euBip && k.status==="bipando"; });

  // Montar direto na linha: abre a janela do kit (preferências, condicionais e iniciar). Texto vermelho = kit sem montador informado.
  var celMont = function(k){
    var sem = semMontador(k), grande = soEncomendas(k, s.cfg), proibido = euMont && grande && !ehEncomendas(s, s.usuario);
    var montar = function(txt, off, titulo, principal){ return e(Bt,{principal:principal, off:off, titulo:titulo, onClick:function(){ setJanelaKit(k.id); }}, txt); };
    if(sem) return e("span",{className:"font-semibold text-destructive", title:"Este kit não tem montador informado. A bipagem e a comissão da bipadora só valem com montador."}, "Sem montador");
    if(k.status==="pendente" || k.status==="ajuste") return podeMontar ? montar("Montar", proibido || (k.status==="pendente" && !!k.designada && k.designada!==s.usuario && !sup),
      proibido ? "Kit acima do limite: só o setor Encomendas monta ("+nomesEncomendas(s)+")" : k.designada && k.designada!==s.usuario && !sup ? "Pedido para "+nomeDe(k.designada) : "Abrir a janela do kit e iniciar a montagem", true) : vazio;
    if(k.montId) return e("span",{className:"inline-flex items-center justify-center gap-2"}, e("span",null, nomeDe(k.montId)),
      k.status==="montando" && (k.montId===s.usuario || sup) && montar("Abrir", false, "Abrir a janela deste kit", false));
    return vazio;
  };

  // UMA linha por kit, agrupada por listagem
  var linhas = [], porGrupo = {};
  (p.listagens||[]).forEach(function(l){
    var ks = s.kits.filter(function(k){ return k.lid===l.id && k.status!=="precond"; })
      .sort(function(a, b){
        if(a.prio!==b.prio) return a.prio ? -1 : 1;   // 1) prioritários primeiro; 2) mais adiantados em cima; 3) posição na fila; 4) ordem da listagem
        var ea = ETAPA[a.status], eb = ETAPA[b.status]; if(ea!==eb) return ea-eb;
        var pa = fila.indexOf(a), pb = fila.indexOf(b); if(pa>=0 && pb>=0) return pa-pb;
        return a.ordem-b.ordem; });
    var g = chaveGrupo(l);
    porGrupo[g] = l;
    ks.forEach(function(k){
      var pos = fila.indexOf(k), tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, semKit = !!SEM_KIT[k.tipoKit], ac = andamentoCond(k);
      var media = semKit ? "—" : k.tipoKit.indexOf("kit_novo")===0 ? "Nova" : k.tipoKit==="reposicao" ? "Reposição" : k.status==="semvalor" ? "—" : k.vendas.length ? BK(media3(k.vendas)) : "Sem vendas";
      var sit = k.pausadoEm ? "Pausado" : STATUS_LB[k.status];
      linhas.push({id:k.id, k:k, l:l, grupo:g,
        ordem:k.designada ? "Pedido" : pos>=0 ? (pos+1)+"º" : "—", hora:k.horaAtend || "—", nome:(k.prio ? "★ " : "")+k.rev, tipo:tipo[1],
        media:media, valor:semKit ? "—" : k.status==="semvalor" ? "Sem valor" : (k.valor!=null ? BK(k.valor) : "—"),
        sit:sit, mont:k.montId ? nomeDe(k.montId) : (k.status==="pendente" || k.status==="ajuste" ? "Montar" : "—"),
        tmont:k.status==="montando" ? (k.pausadoEm ? "pausado" : "montando") : (tempoFim(k.tempoM, k.fimM) || "—"),
        cond:ac.total ? (ac.faltas ? ac.faltas+" falta" : ac.feitas+" de "+ac.total) : "—",
        bip:k.bipId ? nomeDe(k.bipId) : "—", tbip:k.status==="bipando" ? "bipando" : (k.fimB ? tempoFim(k.fimB-k.iniB, k.fimB) : "—"),
        nova:condNovas(k).length ? condNovas(k).join(", ") : "—", acao:""});
    });
  });

  var celNome = function(l){
    var k = l.k;
    var tag = function(txt, titulo){ return e("span",{className:"ml-1.5 rounded border border-white/60 px-1 text-[11px] font-semibold", title:titulo}, txt); };
    return e("span",{title:k.rev+(k.atrasado ? " · pedido fora do prazo" : "")+(k.autorizadoPor ? " · autorizado por "+nomeDe(k.autorizadoPor) : "")},
      k.prio && e("span",{title:"Prioritário"}, "★ "), k.rev,
      k.atrasado && tag("Atrasado", "Pedido fora do prazo"),
      modalidadeDe(s, k.rev)==="prata" && tag("Prata", "Kit 100% Prata"));
  };
  var cols = [
    {k:"ordem", t:"Ordem"},
    {k:"hora", t:"Horário", render:function(v){ return e("span",{className:MONO}, v); }},
    {k:"nome", t:"Nome", render:function(v, l){ return celNome(l); }},
    {k:"tipo", t:"Tipo"}]
    .concat(sup ? [{k:"media", t:"Média"}, {k:"valor", t:"Valor do kit", render:function(v, l){ var k = l.k; return SEM_KIT[k.tipoKit] ? vazio : e("div",{onClick:parar}, e(KitValor,{k:k, ro:!sup, key:k.id+":"+k.valor+":"+k.status})); }}] : [])
    .concat([
    {k:"sit", t:"Situação", cor:function(l){ return (l.k.pausadoEm ? "text-warning" : (COR_SIT[l.k.status] || ""))+" font-semibold"; }},
    {k:"mont", t:"Montadora", render:function(v, l){ return e("div",{onClick:parar}, celMont(l.k)); }},
    {k:"tmont", t:"Montagem", render:function(v, l){ var k = l.k; return k.status==="montando" ? (k.pausadoEm ? e("span",{className:"text-warning"}, "pausado") : e(Relogio,{k:k, curto:true, className:"font-semibold text-primary"})) : e("span",{className:MONO}, v); }},
    {k:"cond", t:"Condicionais", cor:function(l){ var ac = andamentoCond(l.k); return ac.faltas ? "text-destructive font-semibold" : ac.total && ac.feitas===ac.total ? "text-success font-semibold" : ""; }},
    {k:"bip", t:"Bipadora", render:function(v, l){ var k = l.k;
      if(k.bipId) return e("span",{className:k.bipId===euBip ? "font-semibold text-primary" : ""}, nomeDe(k.bipId));
      if(euBip && k.status==="montado") return e("div",{onClick:parar}, e(Bt,{principal:true, off:euBipando, titulo:euBipando ? "Finalize o kit atual antes de iniciar outro" : "Iniciar a bipagem deste kit", onClick:function(){ d({type:"INICIAR_B", id:k.id, bipId:euBip}); }}, "Bipar"));
      return vazio; }},
    {k:"tbip", t:"Bipagem", render:function(v, l){ var k = l.k; return k.status==="bipando" ? e(RelogioB,{desde:k.iniB, curto:true, className:"font-semibold text-primary"}) : e("span",{className:MONO}, v); }},
    {k:"nova", t:"Nova condicional"},
    {k:"acao", t:"Ações", render:function(v, l){ return sup ? e("div",{className:"flex justify-center", onClick:parar}, e(MenuAcoes,{k:l.k, abrirRetirada:function(){ p.abrir("ret", l.l.id); }, naLinha:function(){ setFichaId(l.k.id); }})) : vazio; }}]);

  // linha do grupo: representante, dia, horário e, para a supervisão, os botões da listagem (Confirmar valores, Última hora, Retirada)
  var linhaGrupo = function(g, ls){
    var l = porGrupo[g] || ls[0].l, todos = s.kits.filter(function(k){ return k.lid===l.id && k.status!=="precond"; });
    var prontos = todos.filter(function(k){ return k.status==="bipado"; }).length, semValor = todos.filter(function(k){ return k.status==="semvalor"; }).length;
    var txt = e("span",null, l.rep+" · "+tituloAba(String(l.data||"sem-data").slice(0, 10))+" · "+l.horario+(l.viagem ? " · viagem para "+l.destino : "")+" · "+ls.length+(ls.length===1 ? " kit" : " kits"));
    var botoes = sup ? e("div",{className:"flex items-center gap-1.5", onClick:parar},
      semValor>0 && e(Bt,{titulo:"Confirmar os valores sugeridos", onClick:function(){ d({type:"CONFIRMAR_SUGERIDOS", lid:l.id}); }}, "Confirmar valores"),
      e(Bt,{titulo:"Incluir kit de última hora", onClick:function(){ p.abrir("kit", l.id); }}, "Última hora"),
      e(Bt,{principal:true, off:!prontos, titulo:"Fazer retirada dos kits bipados", onClick:function(){ p.abrir("ret", l.id); }}, prontos ? "Retirada ("+prontos+")" : "Nada pronto")) : null;
    return {span:cols.length, rotulo:e("div",{className:"flex items-center justify-between gap-4"}, txt, botoes), resto:[]};
  };

  var aberta = fichaId && linhas.find(function(x){ return x.id===fichaId; });
  return e("div",{className:"[&_td[colspan]]:!bg-[var(--bloco-colunas)] [&_td[colspan]]:!text-white [&_tr]:!cursor-default [&_td]:!cursor-default"},
    janelaKit && e(JanelaMontar,{key:janelaKit, kitId:janelaKit, fechar:function(){ setJanelaKit(null); }}),
    aberta && e(FichaKit,{key:aberta.id, s:s, d:d, k:aberta.k, l:aberta.l, sup:sup, euBip:euBip, lista:linhas, fechar:function(){ setFichaId(null); }, ir:setFichaId}),
    e(TabelaPlanilha,{key:"fila", cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true,
      agrupar:"grupo", linhaGrupo:linhaGrupo, grupoEsquerda:true,
      grupoAberto:function(g){ return !p.fechadas[g]; }, aoGrupo:function(g){ var o = Object.assign({}, p.fechadas); o[g] = !p.fechadas[g]; p.setFechadas(o); },
      aoClicar:function(l){ setFichaId(l.id); },
      vazio:"Nenhum kit nas listagens desse dia."}));
}

export { FilaPlanilha, FichaKit, chaveGrupo };
