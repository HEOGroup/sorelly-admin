// Sorelly Admin — mobile/kn-conteudo.js
// Conteúdo VISUAL das 16 etapas da entrega do kit novo (checklist do Marcus, 07/10/2026). Usado pelo app da representante (lê e dá o check)
// e pelo app da revendedora (lê junto e dá o OK): as duas telas mostram a mesma coisa. Números vêm das regras do sistema (versão vigente)
// e de domain/kit-novo-regras.js. Reposição NÃO aparece. A conferência e a assinatura entram por `ctx.conferencia` e `ctx.assinatura` (só no app da representante).
import { calcularAcerto } from "@/apps/montagem/domain/consignado";
import { contatosRevendedora } from "@/apps/montagem/domain/contatos";
import { KIT_NOVO_REGRAS as KR, LINK_PAGAMENTO as LK } from "@/apps/montagem/domain/kit-novo-regras";
import { BKC } from "@/apps/montagem/lib/format";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";
import React from "react";

var TXT = "#111827", SUB = "#6B7280", ANEL = "ring-1 ring-[#E5E7EB]";
var VENDAS_SIM = [1000, 2000, 3000, 4000, 5000, 10000];
var R = function(n){ return BKC(n).replace(",00",""); };

// Título, ícone e cor de cada etapa (o app mostra isso no cabeçalho do bloco)
var PASSOS_KN = [
  {n:1, id:"dados", t:"Seus dados", ic:"cadastro", cor:"#2563EB"},
  {n:2, id:"consignado", t:"Como funciona o consignado", ic:"maleta", cor:"#7C3AED"},
  {n:3, id:"acerto", t:"Acerto, prazo e renovação", ic:"calendario", cor:"#EA580C"},
  {n:4, id:"remarcacao", t:"Remarcação do acerto", ic:"agenda", cor:"#DC2626"},
  {n:5, id:"comissoes", t:"Comissões, brindes e taxa", ic:"coins", cor:"#DB2777"},
  {n:6, id:"brindes", t:"Retirada dos brindes", ic:"presente", cor:"#BE185D"},
  {n:7, id:"cuidados", t:"Cuidados com o kit", ic:"gem", cor:"#0891B2"},
  {n:8, id:"formas", t:"Formas de pagamento do acerto", ic:"wallet", cor:"#16A34A"},
  {n:9, id:"clientes", t:"Suas clientes e o link de pagamento", ic:"banco", cor:"#CA8A04"},
  {n:10, id:"app", t:"Uso do aplicativo", ic:"celular", cor:"#4F46E5"},
  {n:11, id:"garantia", t:"Garantia das peças", ic:"escudo", cor:"#9333EA"},
  {n:12, id:"indique", t:"Indique e Ganhe", ic:"presente", cor:"#D97706"},
  {n:13, id:"expositores", t:"Expositores", ic:"coroa", cor:"#B45309"},
  {n:14, id:"contatos", t:"Contatos e canais", ic:"whats", cor:"#16A34A"},
  {n:15, id:"conferencia", t:"Conferência final do kit", ic:"check", cor:"#0F766E"},
  {n:16, id:"assinatura", t:"Assinatura", ic:"pencil", cor:"#0891B2"}
];

// ── blocos visuais ──
function cartao(ic, cor, titulo, filhos, key){
  return e("div",{key:key||titulo, className:"overflow-hidden rounded-xl bg-white "+ANEL},
    e("div",{className:"flex items-center gap-2 px-3 py-2", style:{background:cor+"14"}},
      e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style:{background:cor+"26", color:cor}}, e(Icon,{n:ic, s:15})),
      e("b",{className:"text-[13.5px] leading-tight", style:{color:TXT}}, titulo)),
    e("div",{className:"flex flex-col gap-1.5 px-3 py-2.5"}, filhos));
}
function par(txt, key){ return e("p",{key:key||txt.slice(0,24), className:"text-[12.5px] leading-relaxed", style:{color:"#374151"}}, txt); }
function lista(itens, cor){
  return e("div",{className:"flex flex-col gap-1.5"}, itens.map(function(t,i){ return e("div",{key:i, className:"flex items-start gap-2 text-[12.5px] leading-snug", style:{color:"#374151"}},
    e("span",{className:"mt-0.5 shrink-0", style:{color:cor||"#16A34A"}}, e(Icon,{n:"check", s:13})), e("span",null, t)); }));
}
// Fluxo numerado na vertical, com a linha ligando os passos
function fluxo(itens, cor){
  return e("div",{className:"flex flex-col"}, itens.map(function(it,i){ return e("div",{key:i, className:"flex gap-2.5"},
    e("div",{className:"flex flex-col items-center"}, e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full text-[11.5px] font-black txt-branco", style:{background:cor}}, i+1),
      i<itens.length-1 && e("span",{className:"my-0.5 w-0.5 flex-1", style:{background:cor+"55"}})),
    e("div",{className:"pb-2.5 text-[12.5px] leading-snug", style:{color:"#374151"}}, it[0] && e("b",{className:"block", style:{color:TXT}}, it[0]), it[1])); }));
}
function destaque(cor, fundo, titulo, txt, ic, key){
  return e("div",{key:key||titulo, className:"flex gap-2.5 rounded-xl px-3 py-2.5", style:{background:fundo}},
    e("span",{className:"mt-0.5 shrink-0", style:{color:cor}}, e(Icon,{n:ic||"alert", s:17})),
    e("div",null, e("b",{className:"block text-[13px] leading-tight", style:{color:cor}}, titulo), txt && e("span",{className:"mt-0.5 block text-[12.5px] leading-snug", style:{color:cor}}, txt)));
}
function tabela(cab, linhas, grid){
  var g = {gridTemplateColumns:grid || "repeat("+cab.length+",minmax(0,1fr))"};
  return e("div",{className:"overflow-hidden rounded-xl "+ANEL},
    e("div",{className:"grid gap-1 bg-[#1F2937] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide", style:g},
      cab.map(function(c,i){ return e("span",{key:i, className:i ? "text-right" : "", style:{color:"#fff"}}, c); })),
    linhas.map(function(l,j){ return e("div",{key:j, className:"grid items-center gap-1 px-2.5 py-2 text-[12.5px] "+(j%2 ? "bg-[#F9FAFB]" : "bg-white"), style:Object.assign({color:TXT}, g)},
      l.map(function(c,i){ return e("span",{key:i, className:i ? "text-right" : "font-semibold"}, c); })); }));
}

// ── Etapa 1: confirmar só o NOME e o ENDEREÇO (referências à vista). A representante pode corrigir; o que estava antes fica no histórico. ──
var foneMask = function(v){ var x = (v||"").replace(/\D/g,"").slice(0,11); if(x.length<=2) return x.length ? "("+x : x; if(x.length<=6) return "("+x.slice(0,2)+") "+x.slice(2);
  if(x.length<=10) return "("+x.slice(0,2)+") "+x.slice(2,6)+"-"+x.slice(6); return "("+x.slice(0,2)+") "+x.slice(2,7)+"-"+x.slice(7); };
function DadosKN(p){
  var k = p.k, pf = p.perfil || {};
  var nome = pf.nomeCompleto || k.rev, end = pf.enderecoCasa!==undefined ? pf.enderecoCasa : (k.endereco || k.bairro || "");
  var refs = [0,1,2].map(function(i){ return Object.assign({nome:"", rel:"", fone:""}, (pf.refs||[])[i]); });
  var ed = useState(false), edita = ed[0], setEdita = ed[1];
  var dr = useState(null), rascunho = dr[0], setRascunho = dr[1];
  var abre = function(){ setRascunho({nome:nome, end:end, refs:refs.map(function(r){ return Object.assign({}, r); })}); setEdita(true); };
  var salva = function(){
    var mudou = rascunho.nome!==nome || rascunho.end!==end || JSON.stringify(rascunho.refs)!==JSON.stringify(refs);
    if(mudou) p.d({type:"SALVAR_PERFIL_REV", chave:k.rev, patch:{nomeCompleto:rascunho.nome, enderecoCasa:rascunho.end, refs:rascunho.refs,
      historicoDados:[{em:new Date().toISOString(), antes:{nome:nome, endereco:end, refs:refs}, depois:{nome:rascunho.nome, endereco:rascunho.end, refs:rascunho.refs}}].concat(pf.historicoDados||[])}});
    setEdita(false); };
  var CAMPO = "h-9 w-full rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10";
  var linha = function(ic, rot, val){ return e("div",{key:rot, className:"flex items-start gap-2 border-b border-[#F3F4F6] py-1.5 last:border-0"},
    e("span",{className:"grid size-6 shrink-0 place-items-center rounded-md bg-[#EFF6FF] text-[#2563EB]"}, e(Icon,{n:ic, s:13})),
    e("div",{className:"min-w-0"}, e("span",{className:"block text-[10px] font-bold uppercase tracking-wide", style:{color:SUB}}, rot), e("b",{className:"block text-[13px] leading-tight", style:{color:TXT}}, val || "—"))); };
  var ultima = (pf.historicoDados||[])[0];
  return e("div",{className:"flex flex-col gap-2"},
    !edita
      ? e("div",{className:"rounded-xl bg-white px-2.5 py-1 "+ANEL},
          linha("user","Confirme o nome", nome), linha("lista","Confirme o endereço", end),
          e("div",{key:"refs", className:"py-1.5"}, e("span",{className:"mb-1 block text-[10px] font-bold uppercase tracking-wide", style:{color:SUB}},"Telefones de referência"),
            refs.filter(function(r){ return r.nome || r.fone; }).map(function(r,i){ return e("div",{key:i, className:"flex items-baseline justify-between gap-2 text-[12.5px] leading-snug", style:{color:TXT}},
              e("span",{className:"min-w-0 truncate"}, e("b",null,r.nome), r.rel ? " ("+r.rel+")" : ""), e("b",{className:"shrink-0 text-[12px]", style:{color:"#15803D"}}, r.fone)); })))
      : e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-white p-2.5 "+ANEL},
          e("input",{value:rascunho.nome, "aria-label":"Nome", placeholder:"Nome completo", onChange:function(ev){ setRascunho(Object.assign({}, rascunho, {nome:ev.target.value})); }, className:CAMPO}),
          e("input",{value:rascunho.end, "aria-label":"Endereço", placeholder:"Rua, número - bairro, cidade - UF", onChange:function(ev){ setRascunho(Object.assign({}, rascunho, {end:ev.target.value})); }, className:CAMPO}),
          rascunho.refs.map(function(r,i){ var up = function(campo, v){ var n2 = rascunho.refs.map(function(x){ return Object.assign({}, x); }); n2[i][campo] = v; setRascunho(Object.assign({}, rascunho, {refs:n2})); };
            return e("div",{key:i, className:"flex gap-1.5"},
              e("input",{value:r.nome, "aria-label":"Referência "+(i+1), placeholder:"Nome", onChange:function(ev){ up("nome", ev.target.value); }, className:CAMPO+" min-w-0 flex-[1.2]"}),
              e("input",{value:r.fone, inputMode:"tel", "aria-label":"Telefone da referência "+(i+1), placeholder:"(41) 90000-0000", onChange:function(ev){ up("fone", foneMask(ev.target.value)); }, className:CAMPO+" min-w-0 flex-1"})); }),
          e("div",{className:"flex gap-2"},
            e("button",{onClick:function(){ setEdita(false); }, className:"h-9 flex-1 rounded-lg bg-[#F3F4F6] text-[12.5px] font-bold", style:{color:TXT}}, "Cancelar"),
            e("button",{onClick:salva, className:"h-9 flex-1 rounded-lg bg-[#16A34A] text-[12.5px] font-bold txt-branco"}, "Salvar"))),
    p.editavel && !edita && e("button",{onClick:abre, className:"flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white text-[12.5px] font-bold ring-1 ring-[#E5E7EB]", style:{color:"#2563EB"}}, e(Icon,{n:"pencil", s:13}), "Alterar dados"),
    !p.editavel && e("p",{className:"text-[11.5px] leading-snug", style:{color:SUB}}, "Se algo estiver errado, avise a sua representante: ela altera na hora."),
    ultima && e("p",{className:"text-[11px]", style:{color:SUB}}, "Dados alterados em "+ultima.em.slice(0,10).split("-").reverse().join("/")+" (os dados antigos ficam guardados)."));
}

// Simulação para a revendedora se animar: quanto ela ganha de comissão e de brinde em cada faixa de venda
function simulacao(v){
  var linhas = VENDAS_SIM.map(function(venda){
    var r = calcularAcerto({vendaBruta:venda, devolvida:0, garantia:0, vez:0, valorPago:null, atrasoDias:0}, v);
    var brinde = (r.brindeNormal||0)+(r.brindeSelect||0);
    return {venda:venda, pct:r.comissaoPct, com:r.comissao, brinde:brinde, total:r.comissao+brinde};
  });
  var G = "1.05fr 1.05fr 0.95fr 1.3fr";
  return e("div",{className:"flex flex-col gap-1.5"},
    e("div",{className:"overflow-hidden rounded-xl "+ANEL},
      e("div",{className:"grid gap-1 bg-[#1F2937] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide", style:{gridTemplateColumns:G}},
        e("span",{style:{color:"#fff"}},"Vendeu"), e("span",{className:"text-right", style:{color:"#fff"}},"Comissão"), e("span",{className:"text-right", style:{color:"#fff"}},"Brinde"), e("span",{className:"text-right", style:{color:"#fff"}},"Você ganha")),
      linhas.map(function(l,j){ return e("div",{key:l.venda, className:"grid items-center gap-1 px-2.5 py-2.5 "+(j%2 ? "bg-[#F9FAFB]" : "bg-white"), style:{gridTemplateColumns:G, color:TXT}},
        e("b",{className:"whitespace-nowrap text-[12.5px]"}, R(l.venda)),
        e("span",{className:"whitespace-nowrap text-right"}, e("b",{className:"text-[12px]", style:{color:"#16A34A"}}, R(l.com)), e("span",{className:"block text-[10px]", style:{color:SUB}}, l.pct+"%")),
        e("b",{className:"whitespace-nowrap text-right text-[12px]", style:{color:"#DB2777"}}, l.brinde>0 ? R(l.brinde) : "—"),
        e("b",{className:"whitespace-nowrap text-right text-[15.5px] font-black leading-none", style:{color:"#B8862B"}}, R(l.total))); })),
    e("p",{className:"text-[11px] leading-snug", style:{color:SUB}}, "Simulação com as regras de hoje. Brinde = Normal + Select (BB). A comissão é calculada na hora do acerto, sobre o que você vendeu."));
}

function conteudoPasso(n, ctx){
  var meta = PASSOS_KN.find(function(x){ return x.n===n; }) || {};
  var v = ctx.v || {}, g = v.gerais || {}, k = ctx.k || {}, perfil = ctx.perfil || {};
  var taxa = ((v.taxaBaixa||[])[0]||{}).taxa, tag = g.taxaTagExtraviada!=null ? g.taxaTagExtraviada : 5;
  var contatos = contatosRevendedora();
  var porId = function(id){ return contatos.find(function(c){ return c.id===id; }); };
  var contato = function(c){ return e("div",{key:c.id, className:"flex items-center gap-2.5 rounded-xl bg-white p-2.5 "+ANEL},
    e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-[#DCFCE7] text-[#15803D]"}, e(Icon,{n:"whats", s:18})),
    e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[13px]", style:{color:TXT}}, c.nome), e("span",{className:"block text-[11.5px] leading-snug", style:{color:SUB}}, c.para)),
    e("b",{className:"shrink-0 text-[12px]", style:{color:"#15803D"}}, c.fone)); };

  switch(meta.id){
  case "dados": return e(DadosKN,{k:k, perfil:perfil, d:ctx.d, editavel:!!ctx.editavel});

  case "consignado": return e("div",{className:"flex flex-col gap-3"},
    cartao("maleta","#7C3AED","O que é consignado?",[
      par("Consignado quer dizer que as peças do kit continuam sendo da Sorelly e ficam com você para vender. Você não compra o kit e não paga nada para recebê-lo: você só paga pelo que vender.", "c1"),
      par("O que você não vender, você devolve no dia do acerto.", "c2")]),
    cartao("calendario","#EA580C","Como é o ciclo, mês a mês",[
      fluxo([["Você recebe o kit","O primeiro é o kit base, preparado pela Sorelly com antecedência para você."],
        ["Você vende","Para as suas clientes, combinando com elas a forma e o prazo de pagamento. Cada venda é registrada no aplicativo."],
        ["Chega o dia do acerto","A cada 30 dias. A representante confere o kit com você, peça por peça."],
        ["Você paga o que vendeu","Valor das peças vendidas, já descontada a sua comissão."],
        ["Você devolve o que sobrou e recebe o novo kit","Montado com base nas suas vendas, e você ainda leva o brinde."]], "#7C3AED")]),
    cartao("star","#16A34A","O que você ganha",[par("Comissão sobre tudo o que vender e brinde conforme o valor das suas vendas. Quanto mais você vende, mais você ganha (veja nas próximas etapas).")]),
    cartao("lista","#0D9488","A partir do segundo kit",[par("Você poderá fazer encomendas e escolher as suas preferências direto no aplicativo, na aba Preferências.")]));

  case "acerto": return e("div",{className:"flex flex-col gap-3"},
    cartao("calendario","#EA580C","O acerto é a cada "+KR.prazoAcertoDias+" dias",[
      ctx.dataAcerto && destaque("#92400E","#FEF3C7","Seu primeiro acerto está PRÉ-AGENDADO para "+ctx.dataAcerto,"Essa data ainda vai ser enquadrada conforme a rota da sua representante.","calendario"),
      par((g.agendarAntecedenciaDias||KR.agendarDias)+" dias antes do acerto, a sua representante vai te mandar uma mensagem para confirmar o dia e o horário certinhos.")]),
    cartao("wallet","#16A34A","No dia, o pagamento é por inteiro",[
      lista(["Todo o valor das peças vendidas é pago no dia do acerto.","Não é permitido deixar valor pendente para o próximo acerto.","O novo kit só é liberado depois do pagamento integral."])]),
    cartao("grafico","#2563EB","Para ficar com o kit",[
      lista(["Para ter um novo kit, você precisa ter vendido pelo menos "+R(KR.minRenovarKit)+" até o acerto.","A partir do mês seguinte, olhamos a média das suas vendas dos últimos "+KR.mediaMeses+" meses (ou dos últimos 2, se você ainda não tiver 3) para decidir se você continua vendendo.","Quanto mais você vende e registra no aplicativo, melhor é o kit seguinte."])]));

  case "remarcacao": return e("div",{className:"flex flex-col gap-3"},
    destaque("#991B1B","#FEE2E2","Remarcar atrapalha toda a empresa","Os kits são montados com antecedência e as rotas das representantes são montadas por região. Quando um acerto é remarcado, o fluxo inteiro atrasa. Por isso a empresa não quer dar multa, mas precisa aplicá-la.","alert"),
    cartao("agenda","#DC2626","Multa por remarcação",[
      tabela(["Remarcação","Comissão","Brinde"], (v.remarcacao||[]).map(function(t,i,arr){ return [(i+1)+"ª"+(i===arr.length-1 && arr.length>1 ? " em diante" : ""), "−"+t.comissaoPct+"%", t.brindePct>=100 ? "sem brinde" : "−"+t.brindePct+"%"]; })),
      par("A multa tira uma parte da sua comissão e do seu brinde, e fica maior a cada nova remarcação.")]),
    cartao("check","#16A34A","Quando não tem multa",[par("Remarcação com motivo justificado (por exemplo, falecimento na família) é registrada como isenta e não conta.")]));

  case "comissoes": return e("div",{className:"flex flex-col gap-3"},
    cartao("coins","#DB2777","Comissão e brindes por faixa de venda",[
      tabela(["Vendas","Comissão","Brinde BB","Normal"], (v.faixas||[]).filter(function(f){ return f.pct>0; }).map(function(f,i,arr){ var prox = arr[i+1];
        return [R(f.min)+(prox ? " a "+R(prox.min-0.01).replace(",99","") : " ou mais"), f.pct+"%", f.bb>0 ? R(f.bb) : "—", f.bn>0 ? R(f.bn) : "—"]; }), "1.5fr 0.8fr 0.9fr 0.8fr"),
      par("A comissão é calculada na hora do acerto, sobre o valor que você vendeu. O brinde começa a partir de uma venda mínima e tem dois tipos: o Normal e o Select (BB).")]),
    cartao("caminhao","#EA580C","Taxa de deslocamento",[
      tabela(["Venda do acerto","Taxa"], [["Abaixo de "+R(g.taxaAbaixoDe||300), R(taxa||35)], [R(g.taxaAbaixoDe||300)+" em diante","sem taxa"]]),
      par("A taxa soma no valor que você paga no acerto. Se você devolver o kit no meio do mês e a venda for abaixo de "+R(g.taxaAbaixoDe||300)+", a taxa também é cobrada.")]),
    cartao("star","#B8862B","Veja quanto você pode ganhar",[simulacao(v)]));

  case "brindes": return e("div",{className:"flex flex-col gap-3"},
    destaque("#991B1B","#FEE2E2","O que não estiver no acerto é considerado VENDIDO","Muita revendedora chega no dia do acerto querendo dizer \"essas eu vendi e essas eu peguei de brinde\". Isso não vale: o brinde precisa ser retirado com a representante, na hora do acerto.","alert"),
    cartao("presente","#BE185D","Como funciona a retirada do brinde",[
      fluxo([["No dia do acerto","A representante confere o kit e separa o que foi vendido."],
        ["Escolha os brindes na hora","Você escolhe o brinde Normal e o brinde Select (BB) junto com a representante, ali, no acerto."],
        ["Só vale o que a representante viu","Peça que não estiver no acerto é considerada vendida e entra na sua conta."]], "#BE185D")]),
    cartao("gem","#7C3AED","Dois tipos de brinde",[
      lista(["Brinde Normal: peças comuns do kit.","Brinde Select (BB): peças select, com código que começa com BB."]),
      par("O brinde tem a mesma qualidade das peças do catálogo, mas não tem garantia. Ele só é entregue depois do pagamento do acerto.")]),
    cartao("coins","#16A34A","Se passar do valor do brinde",[par("O que passar do valor liberado soma no total que você paga no acerto.")]));

  case "cuidados": return e("div",{className:"flex flex-col gap-3"},
    cartao("gem","#0891B2","As peças",[lista(["Toda peça devolvida precisa estar em perfeitas condições.","Guarde e transporte as peças com cuidado."])]),
    cartao("scan","#CA8A04","Etiquetas e tags",[lista(["Peça sem a etiqueta fixada é considerada vendida automaticamente.","Não tire etiqueta de peça que ainda não foi vendida.","Tag riscada, danificada ou extraviada: "+R(tag)+" por unidade."])]),
    destaque("#92400E","#FEF3C7","Peças de prata amarelam com a luz","Se ficarem muito tempo expostas à luz, as peças de prata ficam amareladas. Evite deixar as peças dias seguidos expostas à luz, principalmente no expositor.","alert"),
    cartao("maleta","#7C3AED","A maleta",[lista(["Cuide da maleta como cuida do kit.","Se a maleta for extraviada, será cobrado o valor dela.","A maleta conta como uma peça na contagem do kit."])]));

  case "formas": return e("div",{className:"flex flex-col gap-3"},
    cartao("wallet","#16A34A","Como você pode pagar o acerto",[
      e("div",{key:"fp", className:"flex flex-col gap-1.5"}, [["coins","#16A34A","Dinheiro",""],["send","#0891B2","Pix",""],["banco","#7C3AED","Cartão de crédito","em até "+LK.parcelasMax+"x sem juros"],["wallet","#2563EB","Cartão de débito",""]].map(function(f){
        return e("div",{key:f[2], className:"flex items-center gap-2.5 rounded-lg px-2.5 py-2 ring-1 ring-[#E5E7EB]"}, e("span",{className:"grid size-8 place-items-center rounded-lg", style:{background:f[1]+"1F", color:f[1]}}, e(Icon,{n:f[0], s:16})),
          e("b",{className:"flex-1 text-[13px]", style:{color:TXT}}, f[2]), f[3] && e("span",{className:"text-[11.5px]", style:{color:SUB}}, f[3])); })),
      par("Todas as formas respeitam a parcela mínima vigente.", "pm")]),
    destaque("#1E40AF","#DBEAFE","O link de pagamento não é uma forma de pagar o acerto","Ele é uma forma de VENDA, uma ajuda para você vender para as suas clientes. Veja a próxima etapa para entender como funciona.","banco"));

  case "clientes": return e("div",{className:"flex flex-col gap-3"},
    cartao("users","#CA8A04","Suas clientes",[par("A forma de negociar com as suas clientes e o prazo de pagamento ficam a seu critério. Mesmo que a cliente ainda não tenha pago, no prazo de "+KR.prazoAcertoDias+" dias você paga o acerto inteiro para a Sorelly.")]),
    cartao("banco","#2563EB","O link de pagamento",[
      par("É uma ferramenta de apoio na hora da venda: você fecha a venda e a cliente paga pelo link, com mais segurança e agilidade no recebimento. Você solicita direto no aplicativo.", "l1"),
      lista(["Não tem nenhuma taxa para a revendedora.","O valor pago pelo link já conta como pagamento: abate o seu acerto.","Use com cautela."])]),
    cartao("lista","#4F46E5","Regras para gerar o link",[
      tabela(["Regra","Valor"], [["Valor mínimo do link", R(LK.valorMinimo)], ["Parcela mínima", R(LK.parcelaMinima)], ["Parcelamento", "até "+LK.parcelasMax+"x sem juros"], ["Validade", LK.validadeHoras+" horas depois de gerado"], ["Pagamento recusado", "até "+LK.tentativasPorDia+" tentativas por dia"]], "1.4fr 1fr"),
      par("Depois que o link expira (ou o pagamento é negado e as tentativas acabam), é preciso pedir um novo.")]),
    cartao("calendario","#EA580C","Link e fechamento do acerto",[
      lista(["Só são descontados os links emitidos e pagos até o dia anterior ao acerto.","No dia do acerto, se precisar gerar um link, só a representante pode emitir (os sistemas são diferentes)."])]),
    destaque("#92400E","#FEF3C7","Link não devolve dinheiro","Se o valor pago em links for maior que o seu acerto, o dinheiro não é devolvido: o que sobrar fica de crédito para o próximo acerto. Se você for sair, pode usar o crédito para retirar semijoias.","coins"));

  case "app": return e("div",{className:"flex flex-col gap-3"},
    destaque("#3730A3","#E0E7FF","Registre todas as vendas no aplicativo","É assim que a garantia das suas clientes é gerada. Venda que não for registrada no app não gera garantia para ela.","celular"),
    cartao("grafico","#16A34A","O seu próximo kit depende das suas vendas",[
      par("O próximo kit é montado com base no valor das vendas do kit atual. Quanto mais você registra, melhor o kit que você recebe.", "a1"),
      par("Se você não registrar vendas no aplicativo, enviamos o kit básico, no valor de "+R(KR.kitBasico)+".", "a2")]),
    cartao("celular","#4F46E5","O que você faz no app",[lista(["Cadastrar as vendas.","Consultar as peças da maleta.","Pedir o link de pagamento.","Acompanhar pedidos, avisos e informações importantes."])]),
    cartao("lista","#0D9488","A partir do segundo kit",[par("Você coloca as suas encomendas e preferências direto no app, na aba Preferências.")]));

  case "garantia": return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex items-center gap-3 rounded-xl bg-[#F3E8FF] px-3 py-2.5"}, e("b",{className:"text-[26px] leading-none", style:{color:"#7E22CE"}},"12"), e("span",{className:"text-[13px] font-semibold", style:{color:"#6B21A8"}},"meses de garantia nas peças")),
    cartao("check","#16A34A","A garantia cobre",[lista(["Problemas de banho.","Defeito de fabricação."])]),
    cartao("x","#DC2626","A garantia não cobre",[lista(["Peça arrebentada.","Brindes (não têm garantia)."], "#DC2626")]),
    cartao("escudo","#9333EA","Como pedir",[par("A garantia é pedida pelo aplicativo, e só é gerada se a venda foi registrada no app. Dúvidas e acompanhamento: Setor de Garantias, "+((porId("garantias")||{}).fone||"")+".")]));

  case "indique": return e("div",{className:"flex flex-col gap-3"},
    cartao("presente","#D97706","Programa Indique e Ganhe",[par("Você pode indicar novas revendedoras e ganhar conforme as regras da campanha vigente. As indicações ficam registradas no aplicativo, na aba Indicação, e você acompanha ali.", "i1"), par("A representante apresenta as regras e os benefícios atuais da campanha.", "i2")]),
    porId("indicacao") && contato(porId("indicacao")));

  case "expositores": return e("div",{className:"flex flex-col gap-3"},
    destaque("#92400E","#FEF3C7","Mesmo sem expositor, é importante saber","Se você vier a ter um expositor, já conhece as regras.","coroa"),
    cartao("coroa","#B45309","Se algo acontecer com o expositor",[tabela(["Ocorrência","Você paga"], [["Coroa quebrada","R$ 100"], ["Chave perdida","R$ 100"], ["Expositor quebrado","preço da condicional"]], "1.3fr 1fr")]),
    cartao("caixa","#0D9488","Como o expositor é entregue",[par("A representante arruma o expositor e tira uma foto dele. As fotos de todos os expositores ficam guardadas na Sorelly.", "e1"), ctx.expositorUI]));

  case "contatos": return e("div",{className:"flex flex-col gap-2"}, contatos.map(contato),
    e("div",{key:"rh", className:"flex items-center gap-2.5 rounded-xl bg-white p-2.5 "+ANEL}, e("span",{className:"grid size-9 shrink-0 place-items-center rounded-full bg-[#FEF3C7] text-[#B45309]"}, e(Icon,{n:"users", s:18})),
      e("div",{className:"min-w-0"}, e("b",{className:"block text-[13px]", style:{color:TXT}},"RH"), e("span",{className:"block text-[11.5px]", style:{color:SUB}},"Para enviar currículo e trabalhar na empresa"))),
    e("div",{key:"cn", className:"flex flex-col gap-1.5 rounded-xl bg-[#F0FDF4] p-2.5"}, e("b",{className:"text-[12.5px]", style:{color:"#166534"}},"Você será adicionada a:"),
      ["Canal Oficial da Sorelly","Grupo de Revendedoras","Grupo do Leilão"].map(function(c){ return e("span",{key:c, className:"flex items-center gap-2 text-[12.5px]", style:{color:"#166534"}}, e(Icon,{n:"check", s:14}), c); }),
      e("span",{className:"text-[11.5px]", style:{color:"#15803D"}},"Acompanhe os comunicados de cada um.")));

  case "conferencia": return ctx.conferencia || e("div",{className:"flex flex-col gap-2"},
    cartao("check","#0F766E","A representante confere o kit com você",[par("Ela soma as peças de todas as condicionais do seu kit e confere com você o total. Se faltar alguma peça, ela registra quantas faltaram.")]),
    cartao("presente","#DB2777","Caixinhas de presente",[par("Você recebe as caixinhas de presente do kit.")]));

  case "assinatura": return ctx.assinatura || e("div",{className:"flex flex-col gap-2"},
    cartao("pencil","#0891B2","Assinatura no app da representante",[par("Você confirma o recebimento do kit e das orientações assinando na tela da sua representante.")]));
  }
  return null;
}

// Data do primeiro acerto: hoje + 30 dias (o acerto é a cada 30 dias)
function dataPrimeiroAcerto(){ var d = new Date(); d.setDate(d.getDate()+KR.prazoAcertoDias); return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear(); }

export { PASSOS_KN, conteudoPasso, VENDAS_SIM, dataPrimeiroAcerto };
