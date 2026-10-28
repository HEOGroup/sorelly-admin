// Sorelly Admin · montagem — mobile/venda-rev.js
// Janela da VENDA no app da revendedora (sobe de baixo, 19/10/2026; fluxo desenhado com o Marcus): 3 passos (28/10/2026): 1 Peças e cliente → 2 Valor e pagamento (desconto + forma de pagar na mesma tela) → 3 Confirmar venda.
// Ordem das formas: À vista, Combinado (entrada hoje + o resto em datas), link Sorelly, Mercado Pago (por último). O desconto é livre (a revendedora escolhe) e SAI DA COMISSÃO DELA: o app mostra quanto ela ganha.
// No fim: "Registrar venda" (grava em s.lp.vendasApp; no link Sorelly já pede o link ao setor) ou "Enviar proposta" (texto pronto para o WhatsApp). Pagamentos combinados em Pix ou dinheiro viram COBRANÇA: o app avisa no dia.
import { createPortal } from "react-dom";
import { calcularAcerto, modalidadeDe, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { BANDEIRAS, agoraSP, formatarDia, hojeSP, parcelasPermitidas, somaDias, validarSolicitacao, vendidoNoApp } from "@/apps/montagem/domain/link-pagamento";
import { tipoDoCodigo } from "@/apps/montagem/domain/catalogo-rev";
import { listagemDe } from "@/apps/montagem/domain/regras";
import { BKC } from "@/apps/montagem/lib/format";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useState } from "@/shared/react";

var BR = "txt-branco";
var CAMPO = "h-11 w-full rounded-xl bg-white px-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#E5E7EB] focus:ring-[#C9A13B]";
var DOURADO = "linear-gradient(135deg,#B8862B 0%,#E8B84B 55%,#F1E4C6 100%)";
var ROT = "text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]";
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var inicial = function(n){ return String(n||"?").trim().charAt(0).toUpperCase() || "?"; };
var dataOk = function(d){ return /^\d{4}-\d{2}-\d{2}$/.test(String(d||"")); };
// ordem pedida pelo Marcus: à vista, combinado, link Sorelly, Mercado Pago por último
var FORMAS = [
  {k:"vista", t:"À vista", d:"Pix ou dinheiro", ic:"wallet"},
  {k:"combinado", t:"Combinado", d:"Entrada hoje e o resto em outra data", ic:"calendario"},
  {k:"sorelly", t:"Link de pagamento Sorelly", d:"Parcelamento e crédito Sorelly", ic:"banco"},
  {k:"mp", t:"Link Mercado Pago", d:"Receba direto na sua conta", ic:"coins", pequeno:true}];
var ROTULO = {vista:"à vista", combinado:"combinado", sorelly:"link Sorelly", mp:"link Mercado Pago"};
var CHIPS = [0, 3, 5, 10];

function JanelaVenda(p){
  var cx = use(), s = cx.state, disp = cx.dispatch, k = p.k, cfg = s.lp.config, hoje = hojeSP();
  var et = useState("carrinho"), etapa = et[0], setEtapa = et[1];
  var bq = useState(""), busca = bq[0], setBusca = bq[1];
  var nv = useState(null), novaCli = nv[0], setNovaCli = nv[1];
  var ds = useState({modo:"pct", pct:0, outro:false, rs:0, outroPct:""}), desc = ds[0], setDesc = ds[1];
  var fm = useState(""), forma = fm[0], setForma = fm[1];
  var bd = useState(""), bandeira = bd[0], setBandeira = bd[1];                      // link Sorelly: bandeira do cartão (necessária para gerar o link)
  var pr = useState(1), parcelasSel = pr[0], setParcelas = pr[1];                    // link Sorelly: 1x até o máximo da faixa de valor
  var cb = useState({entrada:0, formaEnt:"pix", formaRest:"pix", n:1, datas:{}}), comb = cb[0], setComb = cb[1];
  var rs = useState(null), resultado = rs[0], setResultado = rs[1];
  var cliente = p.clientes.find(function(c){ return c.id===p.clienteSel; });

  // ---------- desconto e comissão ----------
  var bruto = p.total;
  var descRS = r2(Math.min(bruto, desc.modo==="pct" ? bruto*(desc.outro ? Number(String(desc.outroPct).replace(",", ".")) || 0 : desc.pct)/100 : desc.rs || 0));
  var liquido = r2(bruto-descRS), descPct = bruto>0 ? r2(descRS/bruto*100) : 0;
  var parcelas = liquido>0 ? Math.min(parcelasSel, parcelasPermitidas(cfg, liquido)) : parcelasSel;   // o desconto muda o valor: a escolha anterior pode deixar de valer
  var vig = versaoVigente(s), versao = vig ? versaoEfetiva(vig, modalidadeDe(s, k.rev)) : null, base = ((k.vendas||[])[0] || 0) + vendidoNoApp(s.lp, k.rev, hoje.slice(0, 7));
  var calc = function(v){ return versao ? calcularAcerto({vendaBruta:v, devolvida:0, garantia:0, vez:0, valorPago:null, atrasoDias:0}, versao) : null; };
  var r0 = calc(base), rSem = calc(base+bruto), rCom = calc(base+liquido);
  var metaMin = versao ? Math.min.apply(null, versao.faixas.filter(function(f){ return f.pct>0; }).map(function(f){ return f.min; }).concat([Infinity])) : 0;   // vendas do mês para começar a ganhar comissão
  var comSem = r0 ? r2(rSem.comissao-r0.comissao) : 0, comCom = r0 ? r2(rCom.comissao-r0.comissao) : 0, pctCom = rCom ? rCom.comissaoPct : 0;

  // ---------- forma de pagamento ----------
  var rep = k.interno ? "" : (k.rep || (listagemDe(s, k) || {}).rep || "");
  var perfil = (s.perfisRev||{})[k.rev] || {};
  var dataAcerto = /^\d{4}-\d{2}-\d{2}$/.test(perfil.dataAcerto || "") && perfil.dataAcerto>=hoje ? perfil.dataAcerto : "";
  var dadosLink = {revendedora:k.rev, canal:"app", valor:liquido, parcelas:parcelas, representante:rep, dataAcerto:dataAcerto, emissor:"atendimento", semMeio:true, bandeira:bandeira, cliente:cliente ? cliente.nome : ""};
  var erroLink = forma==="sorelly" && liquido>0 ? validarSolicitacao(s, dadosLink, agoraSP()) : "";
  var depoisDoHorario = new Date().getHours() >= (cfg.horaLimite || 18);
  var resto = Math.max(0, r2(liquido-(comb.entrada||0))), nR = resto>0 ? comb.n : 0, vp = nR ? r2(resto/nR) : 0;
  var restantes = []; for(var i = 1; i<=nR; i++) restantes.push({n:i, data:comb.datas[i] || somaDias(hoje, 7*i), valor:i<nR ? vp : r2(resto-vp*(nR-1))});
  var erroComb = forma==="combinado" ? ((comb.entrada||0)<=0 ? "Informe quanto a cliente paga hoje." : (comb.entrada||0)>=liquido ? "A entrada cobre tudo: use À vista." : restantes.some(function(x){ return !dataOk(x.data) || x.data<hoje; }) ? "Confira as datas: precisam ser de hoje em diante." : "") : "";
  var formaOk = forma==="vista" || forma==="mp" || (forma==="sorelly" && !erroLink) || (forma==="combinado" && !erroComb);

  // plano de pagamentos que fica gravado (pago = já recebido)
  var plano = forma==="vista" ? [{valor:liquido, forma:"vista", data:hoje, pago:true}]
    : forma==="combinado" ? [{valor:comb.entrada, forma:comb.formaEnt, data:hoje, pago:true}].concat(restantes.map(function(x){ return {valor:x.valor, forma:comb.formaRest, data:x.data, pago:false}; }))
    : forma==="sorelly" ? [{valor:liquido, forma:"link", data:hoje, pago:false}] : forma==="mp" ? [{valor:liquido, forma:"mp", data:hoje, pago:false}] : [];
  var codigos = p.itens.map(function(x){ return x.codigo; });
  var textoForma = function(){
    if(forma==="vista") return "À vista, no Pix ou em dinheiro: "+BKC(liquido);
    if(forma==="combinado") return "Hoje "+BKC(comb.entrada)+" no "+(comb.formaEnt==="pix" ? "Pix" : "dinheiro")+(restantes.length ? " e o restante "+restantes.map(function(x){ return BKC(x.valor)+" até "+formatarDia(x.data).slice(0, 5); }).join(", ") : "");
    if(forma==="sorelly") return "Link de pagamento Sorelly no cartão em "+parcelas+"x de "+BKC(r2(liquido/parcelas));
    if(forma==="mp") return "Link do Mercado Pago: "+BKC(liquido);
    return "";
  };
  var mensagem = function(){
    return "Olá, "+(cliente ? cliente.nome : "")+"! Segue a sua proposta Sorelly:\n"+p.itens.map(function(x){ return "• "+x.codigo+" ("+tipoDoCodigo(x.codigo).toLowerCase()+") "+BKC(x.preco); }).join("\n")+"\nTotal das peças: "+BKC(bruto)+(descRS>0 ? "\nDesconto: "+BKC(descRS)+" ("+String(descPct).replace(".", ",")+"%)" : "")+"\nTotal: "+BKC(liquido)+"\nPagamento: "+textoForma()+".";
  };
  var registrar = function(tipo){
    disp({type:"LP", op:"venda_app", por:k.rev+" (app)", revendedora:k.rev, cliente:cliente.nome, tipo:tipo, formas:[forma], bruto:bruto, desconto:descRS, valor:liquido, parcelas:forma==="sorelly" ? parcelas : (forma==="combinado" ? nR||1 : 1),
      plano:tipo==="venda" ? plano : plano.map(function(x){ return Object.assign({}, x, {pago:false}); }), comissaoPct:pctCom, comissao:comCom, itens:codigos});
    if(tipo==="venda" && forma==="sorelly") disp(Object.assign({type:"LP", op:"sol_criar", por:k.rev+" (app)", observacao:"Venda para "+cliente.nome+": "+codigos.join(", ")+(descRS>0 ? " (com desconto de "+BKC(descRS)+")" : "")}, dadosLink));
    if(tipo==="venda"){
      var extra = forma==="sorelly" ? " O link de "+BKC(liquido)+" em "+parcelas+"x foi pedido ao setor; acompanhe em Meus links." : forma==="mp" ? " Gere o link no seu Mercado Pago e envie à cliente." : forma==="combinado" && restantes.length ? " O app vai avisar você no dia de cobrar o restante." : "";
      setResultado({t:"Venda registrada!", d:"Venda de "+BKC(liquido)+" para "+cliente.nome+" finalizada. Pagamento: "+ROTULO[forma]+"."+extra});
    } else setResultado({t:"Proposta pronta", d:"Copie o texto e mande para "+cliente.nome+" no WhatsApp.", texto:mensagem()});
  };

  // ---------- peças da tela ----------
  var voltar = {cliente:"carrinho", pagamento:"carrinho", resumo:"pagamento"}[etapa];
  var TITULO = {carrinho:"Peças e cliente", cliente:"Escolher cliente", pagamento:"Valor e pagamento", resumo:"Confirmar venda"};
  var passo = {carrinho:1, cliente:1, pagamento:2, resumo:3}[etapa];
  var cab = e("div",{className:"flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3"},
    voltar && e("button",{onClick:function(){ setEtapa(voltar); setNovaCli(null); }, "aria-label":"Voltar", className:"grid size-9 place-items-center rounded-full bg-[#F3F4F6] text-[#111827]"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
    e("div",{className:"flex min-w-0 flex-col"}, e("b",{className:"text-[18px] leading-tight text-[#111827]"}, TITULO[etapa]),
      e("div",{className:"mt-1 flex items-center gap-1", "aria-label":"Passo "+passo+" de 3"}, [1, 2, 3].map(function(n){ return e("span",{key:n, className:"h-1 w-6 rounded-full", style:{background:n<=passo ? "#C9A13B" : "#E5E7EB"}}); }), e("span",{className:"ml-1 text-[11px] font-semibold text-[#9CA3AF]"}, "Passo "+passo+" de 3"))),
    etapa==="carrinho" && e("span",{className:"rounded-full bg-[#F3F4F6] px-2.5 py-1 text-[12.5px] font-bold text-[#374151]"}, BKC(bruto)),
    e("button",{onClick:p.onFechar, "aria-label":"Fechar", className:"ml-auto grid size-9 place-items-center rounded-full bg-[#F3F4F6] text-[#374151]"}, e(Icon,{n:"x", s:15})));
  var rodape = function(texto, ok, acao, extra){
    return e("div",{className:"flex flex-col gap-2 border-t border-[#E5E7EB] bg-white px-4 pb-6 pt-3"},
      extra,
      e("button",{onClick:acao, disabled:!ok, className:"flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold transition "+(ok ? "text-[#1B1409] shadow-md" : "bg-[#D1D5DB] "+BR), style:ok ? {background:DOURADO} : undefined}, texto));
  };
  var linhaTotal = function(rot, val, forte, cor){ return e("div",{className:"flex items-baseline justify-between"}, e("span",{className:(forte ? "text-[14px] font-semibold " : "text-[13px] ")+"text-[#6B7280]"}, rot), e("b",{className:(forte ? "text-[22px] " : "text-[14px] ")+(cor || "text-[#111827]")}, val)); };
  var corpo;
  // desconto e comissão ficam no começo da tela de pagamento (antes eram uma tela só para isso): chips, e UMA linha com o que a revendedora ganha
  var escolher = function(pct){ setDesc({modo:"pct", pct:pct, outro:false, rs:0, outroPct:""}); };
  var chipDesc = function(on, texto, acao, k){ return e("button",{key:k, onClick:acao, className:"h-9 rounded-xl text-[13px] font-bold ring-1 "+(on ? "bg-[#1A1A2E] ring-[#1A1A2E] "+BR : "bg-white text-[#374151] ring-[#E5E7EB]")}, texto); };
  var blocoDesc = e("div",{key:"desc", className:"flex flex-col gap-2 rounded-2xl bg-[#F6F7F9] p-3"},
    e("div",{className:"flex items-baseline justify-between"}, e("span",{className:ROT}, "Desconto"), e("span",{className:"text-[12px] text-[#6B7280]"}, "Peças "+BKC(bruto))),
    e("div",{className:"grid grid-cols-5 gap-1.5"}, CHIPS.map(function(c){ return chipDesc(!desc.outro && desc.modo==="pct" && desc.pct===c, c===0 ? "Sem" : c+"%", function(){ escolher(c); }, c); })
      .concat([chipDesc(desc.outro, "Outro", function(){ setDesc({modo:"pct", pct:0, outro:true, rs:0, outroPct:""}); }, "o")])),
    desc.outro && e("div",{className:"flex gap-2"},
      e("div",{className:"grid w-28 shrink-0 grid-cols-2 overflow-hidden rounded-xl ring-1 ring-[#E5E7EB]"}, [["pct", "%"], ["rs", "R$"]].map(function(m){ var on = desc.modo===m[0];
        return e("button",{key:m[0], onClick:function(){ setDesc(Object.assign({}, desc, {modo:m[0]})); }, className:"h-11 text-[13px] font-semibold "+(on ? "bg-[#1A1A2E] "+BR : "bg-white text-[#374151]")}, m[1]); })),
      desc.modo==="pct"
        ? e("input",{value:desc.outroPct, inputMode:"decimal", placeholder:"Quanto de desconto", "aria-label":"Percentual de desconto", onChange:function(ev){ setDesc(Object.assign({}, desc, {outroPct:ev.target.value.replace(/[^0-9,\.]/g, "")})); }, className:CAMPO})
        : e(CampoDinheiro,{value:desc.rs||null, label:"Desconto em reais", onChange:function(v){ setDesc(Object.assign({}, desc, {rs:v||0})); }, className:CAMPO+" text-left font-bold"})),
    e("div",{className:"flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-2 ring-[#C9A13B]"},
      e("span",{className:"whitespace-nowrap text-[13px] font-semibold text-[#6B7280]"}, "Cliente paga"), e("b",{className:"whitespace-nowrap text-[20px] text-[#B8862B]"}, BKC(liquido))),
    versao && e("div",{className:"flex flex-col gap-0.5"}, e("p",{className:"text-[12.5px] font-semibold "+(pctCom>0 ? "text-[#047857]" : "text-[#B45309]")},
      pctCom>0 ? "Você ganha "+BKC(comCom)+" ("+pctCom+"%)" : "Ainda sem comissão: faltam "+BKC(Math.max(0, r2(metaMin-(base+liquido))))+" em vendas no mês"),
      pctCom>0 && descRS>0 && comSem>comCom && e("p",{className:"text-[11.5px] text-[#6B7280]"}, "Desconto de "+BKC(descRS)+" sai da sua comissão (sem ele: "+BKC(comSem)+").")));

  if(etapa==="cliente"){
    var q = busca.trim().toLowerCase(), lista = p.clientes.filter(function(c){ return !q || c.nome.toLowerCase().indexOf(q)>=0 || (c.fone||"").indexOf(q)>=0; });
    var salvar = function(){ var nome = (novaCli.nome||"").trim(); if(!nome) return; p.onNovaCliente({nome:nome, fone:(novaCli.fone||"").trim()}); setNovaCli(null); setEtapa("carrinho"); };
    corpo = e("div",{className:"flex flex-col gap-3 overflow-y-auto p-4"},
      novaCli
        ? e("div",{className:"flex flex-col gap-2 rounded-xl bg-[#F9FAFB] p-3 ring-1 ring-[#E5E7EB]"}, e("b",{className:"text-[13px] text-[#111827]"}, "Nova cliente"),
            e("input",{value:novaCli.nome, onChange:function(ev){ setNovaCli({nome:ev.target.value, fone:novaCli.fone}); }, placeholder:"Nome da cliente", "aria-label":"Nome da cliente", className:CAMPO}),
            e("input",{value:novaCli.fone, inputMode:"tel", onChange:function(ev){ setNovaCli({nome:novaCli.nome, fone:ev.target.value}); }, placeholder:"WhatsApp (opcional)", "aria-label":"WhatsApp da cliente", className:CAMPO}),
            e("div",{className:"flex gap-2"},
              e("button",{onClick:function(){ setNovaCli(null); }, className:"h-10 flex-1 rounded-xl bg-[#E5E7EB] text-[13px] font-semibold text-[#374151]"}, "Cancelar"),
              e("button",{onClick:salvar, disabled:!(novaCli.nome||"").trim(), className:"h-10 flex-1 rounded-xl text-[13px] font-bold text-[#1B1409] disabled:opacity-40", style:{background:DOURADO}}, "Salvar cliente")))
        : e("div",{className:"flex gap-2"},
            e("label",{className:"flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#E5E7EB]"}, e(Icon,{n:"search", s:15, className:"shrink-0 text-[#9CA3AF]"}),
              e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar cliente...", "aria-label":"Buscar cliente", className:"min-w-0 flex-1 bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF]"})),
            e("button",{onClick:function(){ setNovaCli({nome:"", fone:""}); }, "aria-label":"Nova cliente", className:"grid size-11 shrink-0 place-items-center rounded-xl bg-[#1A1A2E] "+BR}, e(Icon,{n:"plus", s:18}))),
      !novaCli && (lista.length===0
        ? e("p",{className:"rounded-xl bg-[#F9FAFB] p-4 text-center text-[13px] text-[#6B7280]"}, p.clientes.length ? "Nenhuma cliente encontrada." : "Nenhuma cliente cadastrada. Toque no + para cadastrar.")
        : e("div",{className:"flex flex-col"}, lista.map(function(c){
            return e("button",{key:c.id, onClick:function(){ p.onEscolher(c.id); setEtapa("carrinho"); }, className:"flex items-center gap-3 border-b border-[#F3F4F6] py-2.5 text-left"},
              e("span",{className:"grid size-10 shrink-0 place-items-center rounded-full bg-[#F3F4F6] text-[14px] font-semibold text-[#6B7280]"}, inicial(c.nome)),
              e("span",{className:"flex min-w-0 flex-col"}, e("b",{className:"text-[14px] font-medium text-[#111827]"}, c.nome), c.fone && e("span",{className:"text-[12px] text-[#6B7280]"}, c.fone)),
              c.id===p.clienteSel && e(Icon,{n:"check", s:16, className:"ml-auto text-[#15803D]"})); }))));
  }
  else if(etapa==="carrinho"){
    corpo = [e("div",{key:"b", className:"flex flex-1 flex-col overflow-y-auto"},
        e("button",{onClick:function(){ setEtapa("cliente"); }, className:"flex items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 text-left"},
          e("span",{className:"grid size-11 shrink-0 place-items-center rounded-full "+(cliente ? "bg-[#1A1A2E] text-[15px] font-semibold "+BR : "bg-[#F3F4F6] text-[#9CA3AF]")}, cliente ? inicial(cliente.nome) : e(Icon,{n:"users", s:18})),
          e("span",{className:"flex min-w-0 flex-1 flex-col"}, cliente && e("span",{className:"text-[10.5px] font-semibold uppercase tracking-wide text-[#9CA3AF]"}, "Cliente"), e("b",{className:"text-[16px] "+(cliente ? "text-[#111827]" : "font-medium text-[#9CA3AF]")}, cliente ? cliente.nome : "Selecionar cliente")),
          e(Icon,{n:"chevron", s:16, className:"text-[#9CA3AF]"})),
        e("div",{className:"flex flex-col gap-2 bg-[#F6F7F9] px-4 py-3"}, e("span",{className:ROT}, "Itens selecionados"),
          p.itens.length===0 ? e("p",{className:"py-4 text-center text-[13px] text-[#6B7280]"}, "O carrinho está vazio.")
          : p.itens.map(function(x){ return e("div",{key:x.codigo, className:"flex items-center gap-3 rounded-xl bg-white p-2.5 ring-1 ring-[#E5E7EB]"},
              e("img",{src:x.foto, alt:x.codigo, className:"size-16 shrink-0 rounded-lg object-cover"}),
              e("div",{className:"flex min-w-0 flex-1 flex-col gap-0.5"}, e("b",{className:"text-[15px] text-[#111827]"}, x.codigo), e("b",{className:"text-[15px] text-[#B8862B]"}, BKC(x.preco))),
              e("button",{onClick:function(){ p.onRemover(x); }, "aria-label":"Remover "+x.codigo, className:"grid size-8 place-items-center rounded-full bg-[#FEF2F2] text-[#B91C1C]"}, e(Icon,{n:"trash", s:14}))); }))),
      e("div",{key:"f"}, rodape("Escolher pagamento", !!cliente && p.itens.length>0, function(){ setEtapa("pagamento"); }, e("div",{className:"flex flex-col gap-1"}, linhaTotal("Total", BKC(bruto), true, "text-[#B8862B]"), !cliente && e("p",{className:"text-center text-[12px] font-semibold text-[#B45309]"}, "Escolha a cliente para continuar."))))];
  }
  else if(etapa==="pagamento"){
    corpo = [e("div",{key:"b", className:"flex flex-1 flex-col gap-2 overflow-y-auto p-4"},
        blocoDesc,
        e("span",{className:ROT+" mt-1"}, "Como a cliente vai pagar?"),
        FORMAS.map(function(f){ var on = forma===f.k;
          return e("div",{key:f.k, className:"flex flex-col gap-2"},
            e("button",{onClick:function(){ setForma(f.k); }, className:"flex items-center gap-3 rounded-xl text-left ring-1 "+(f.pequeno ? "p-2 " : "p-2.5 ")+(on ? "bg-[#FBF3DC] ring-[#C9A13B]" : "bg-white ring-[#E5E7EB]")},
              e("span",{className:"grid shrink-0 place-items-center rounded-lg "+(f.pequeno ? "size-8 " : "size-9 ")+(on ? "bg-[#1A1A2E] "+BR : "bg-[#F3F4F6] text-[#6B7280]")}, e(Icon,{n:f.ic, s:f.pequeno ? 14 : 16})),
              e("span",{className:"flex min-w-0 flex-1 flex-col"}, e("b",{className:(f.pequeno ? "text-[12.5px]" : "text-[13.5px]")+" text-[#111827]"}, f.t), e("span",{className:"truncate whitespace-nowrap text-[11.5px] text-[#6B7280]"}, f.d)),
              e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full ring-2 "+(on ? "bg-[#C9A13B] ring-[#C9A13B] "+BR : "ring-[#D1D5DB]")}, on && e(Icon,{n:"check", s:11}))),
            on && f.k==="vista" && e("p",{className:"rounded-xl bg-[#F6F7F9] p-2.5 text-[12.5px] text-[#374151]"}, "A cliente paga "+BKC(liquido)+" agora, no Pix ou em dinheiro."),
            on && f.k==="combinado" && e("div",{className:"flex flex-col gap-2 rounded-xl bg-[#F6F7F9] p-2.5"},
              e("span",{className:"text-[12px] font-semibold text-[#374151]"}, "Quanto a cliente paga hoje?"),
              e(CampoDinheiro,{value:comb.entrada||null, label:"Entrada de hoje", onChange:function(v){ setComb(Object.assign({}, comb, {entrada:v||0})); }, className:CAMPO+" text-left font-bold"}),
              e("div",{className:"grid grid-cols-2 gap-1.5"}, [["pix", "Pix"], ["dinheiro", "Dinheiro"]].map(function(m){ var o = comb.formaEnt===m[0];
                return e("button",{key:m[0], onClick:function(){ setComb(Object.assign({}, comb, {formaEnt:m[0]})); }, className:"h-9 rounded-lg text-[12.5px] font-semibold ring-1 "+(o ? "bg-[#1A1A2E] ring-[#1A1A2E] "+BR : "bg-white text-[#374151] ring-[#E5E7EB]")}, m[1]); })),
              e("div",{className:"flex items-center justify-between"}, e("span",{className:"text-[12px] font-semibold text-[#374151]"}, "Restante"), e("b",{className:"text-[14px] text-[#111827]"}, BKC(resto))),
              e("div",{className:"flex items-center justify-between rounded-xl bg-white p-1.5 ring-1 ring-[#E5E7EB]"},
                e("button",{onClick:function(){ setComb(Object.assign({}, comb, {n:Math.max(1, comb.n-1)})); }, "aria-label":"Menos uma parcela", className:"grid size-8 place-items-center rounded-lg text-[18px] font-bold text-[#374151] ring-1 ring-[#E5E7EB]"}, "−"),
                e("span",{className:"text-[13px] font-semibold text-[#111827]"}, "Restante em "+comb.n+"x"),
                e("button",{onClick:function(){ setComb(Object.assign({}, comb, {n:Math.min(6, comb.n+1)})); }, "aria-label":"Mais uma parcela", className:"grid size-8 place-items-center rounded-lg text-[18px] font-bold text-[#374151] ring-1 ring-[#E5E7EB]"}, "+")),
              restantes.map(function(x){ return e("div",{key:x.n, className:"flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-[#E5E7EB]"},
                e("span",{className:"w-5 text-center text-[12px] font-bold text-[#6B7280]"}, x.n),
                e("input",{type:"date", value:x.data, min:hoje, onChange:function(ev){ var o = Object.assign({}, comb.datas); o[x.n] = ev.target.value; setComb(Object.assign({}, comb, {datas:o})); }, "aria-label":"Data da parcela "+x.n, className:"h-9 min-w-0 flex-1 rounded-lg bg-white px-2 text-[13px] text-[#111827] outline-none ring-1 ring-[#E5E7EB]"}),
                e("b",{className:"text-[13px] text-[#111827]"}, BKC(x.valor))); }),
              e("div",{className:"grid grid-cols-2 gap-1.5"}, [["pix", "Resto no Pix"], ["dinheiro", "Resto em dinheiro"]].map(function(m){ var o = comb.formaRest===m[0];
                return e("button",{key:m[0], onClick:function(){ setComb(Object.assign({}, comb, {formaRest:m[0]})); }, className:"h-9 rounded-lg text-[12px] font-semibold ring-1 "+(o ? "bg-[#1A1A2E] ring-[#1A1A2E] "+BR : "bg-white text-[#374151] ring-[#E5E7EB]")}, m[1]); })),
              erroComb && e("p",{className:"text-[12px] font-semibold text-[#B91C1C]"}, erroComb),
              e("p",{className:"text-[11.5px] text-[#6B7280]"}, "O app avisa você no dia de cobrar o restante.")),
            on && f.k==="sorelly" && e("div",{className:"flex flex-col gap-1.5 rounded-xl bg-[#F6F7F9] p-2.5"},
              e("span",{className:"text-[12px] font-semibold text-[#374151]"}, "Parcelas no cartão, sem juros"),
              e("div",{className:"grid grid-cols-5 gap-1"}, Array.from({length:cfg.maxParcelasSemJuros}, function(z, i){ var n = i+1, ok = !liquido || n<=parcelasPermitidas(cfg, liquido);
                return e("button",{key:n, disabled:!ok, onClick:function(){ setParcelas(n); }, className:"h-9 rounded-lg text-[12.5px] font-bold ring-1 "+(parcelas===n ? "bg-[#1A1A2E] ring-[#1A1A2E] "+BR : "bg-white text-[#374151] ring-[#E5E7EB]")+(ok ? "" : " opacity-35")}, n+"x"); })),
              e("span",{className:"text-[12px] font-semibold text-[#374151]"}, "Bandeira do cartão"),
              e("div",{className:"grid grid-cols-3 gap-1"}, BANDEIRAS.map(function(b){ return e("button",{key:b, onClick:function(){ setBandeira(b); }, className:"h-9 rounded-lg text-[12px] font-bold ring-1 "+(bandeira===b ? "bg-[#1A1A2E] ring-[#1A1A2E] "+BR : "bg-white text-[#374151] ring-[#E5E7EB]")}, b); })),
              erroLink ? e("p",{className:"text-[12px] font-semibold text-[#B91C1C]"}, erroLink)
                : e("p",{className:"text-[11.5px] "+(depoisDoHorario ? "font-semibold text-[#B45309]" : "text-[#6B7280]")}, depoisDoHorario ? "Já passou das "+cfg.horaLimite+"h: o link só será gerado no próximo dia útil." : "Os links são gerados em horário comercial, até as "+cfg.horaLimite+"h.")),
            on && f.k==="mp" && e("p",{className:"rounded-xl bg-[#F6F7F9] p-2.5 text-[11.5px] text-[#6B7280]"}, "O link do Mercado Pago você gera na sua própria conta e envia à cliente.")); }))
      , e("div",{key:"f"}, rodape("Revisar venda", formaOk && liquido>0, function(){ setEtapa("resumo"); }, !forma && e("p",{className:"text-center text-[12px] text-[#6B7280]"}, "Escolha como a cliente vai pagar.")))];
  }
  else {   // resumo
    corpo = [e("div",{key:"b", className:"flex flex-1 flex-col gap-3 overflow-y-auto p-4"},
        e("div",{className:"flex flex-col gap-2 rounded-2xl bg-white p-3.5 shadow-sm ring-2 ring-[#C9A13B]"},
          e("div",{className:"flex items-center gap-3"}, e("span",{className:"grid size-10 place-items-center rounded-full bg-[#1A1A2E] text-[14px] font-semibold "+BR}, inicial(cliente && cliente.nome)), e("div",{className:"flex flex-col"}, e("b",{className:"text-[15px] text-[#111827]"}, cliente ? cliente.nome : ""), e("span",{className:"text-[12px] text-[#6B7280]"}, p.itens.length+(p.itens.length===1 ? " peça" : " peças")))),
          e("div",{className:"flex gap-1.5 overflow-x-auto"}, p.itens.map(function(x){ return e("img",{key:x.codigo, src:x.foto, alt:x.codigo, className:"size-14 shrink-0 rounded-lg object-cover"}); })),
          e("div",{className:"flex flex-col gap-1 border-t border-[#E5E7EB] pt-2"},
            linhaTotal("Total das peças", BKC(bruto)), descRS>0 && linhaTotal("Desconto ("+String(descPct).replace(".", ",")+"%)", "− "+BKC(descRS), false, "text-[#B91C1C]"),
            linhaTotal("Total", BKC(liquido), true, "text-[#B8862B]")),
          e("div",{className:"rounded-xl bg-[#FBF3DC] p-2.5"}, e("span",{className:ROT}, "Pagamento"), e("p",{className:"text-[13.5px] font-semibold text-[#111827]"}, textoForma()))),
        versao && e("div",{className:"flex items-center justify-between rounded-xl bg-[#ECFDF5] p-3 ring-1 ring-[#A7F3D0]"},
          e("span",{className:"text-[12.5px] font-semibold text-[#047857]"}, pctCom>0 ? "Sua comissão ("+pctCom+"%)" : "Sua comissão (abaixo da 1ª faixa)"), e("b",{className:"text-[17px] text-[#047857]"}, BKC(comCom))))
      , e("div",{key:"f", className:"flex flex-col gap-2 border-t border-[#E5E7EB] bg-white px-4 pb-6 pt-3"},
        e("button",{onClick:function(){ registrar("venda"); }, className:"flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-bold text-[#1B1409] shadow-md", style:{background:DOURADO}}, e(Icon,{n:"check", s:17}), "Registrar venda"),
        e("button",{onClick:function(){ registrar("proposta"); }, className:"flex h-10 w-full items-center justify-center gap-2 rounded-2xl text-[13.5px] font-bold text-[#B8862B]"}, e(Icon,{n:"send", s:14}), "Ainda vai decidir? Enviar proposta"))];
  }

  var dialogo = resultado && e("div",{className:"absolute inset-0 z-50 grid place-items-center bg-black/35 px-5"},
    e("div",{className:"flex w-full flex-col gap-2 rounded-3xl bg-white p-5 text-[#111827] shadow-2xl"},
      e("b",{className:"text-[18px]"}, resultado.t), e("p",{className:"text-[13.5px] leading-snug text-[#4B5563]"}, resultado.d),
      resultado.texto && e("pre",{className:"max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F6F7F9] p-2.5 font-sans text-[12.5px] leading-snug text-[#111827]"}, resultado.texto),
      resultado.texto && e("button",{onClick:function(){ try { navigator.clipboard.writeText(resultado.texto); } catch(x){} setResultado(Object.assign({}, resultado, {copiado:true})); }, className:"h-10 w-full rounded-xl text-[13.5px] font-bold text-[#1B1409]", style:{background:DOURADO}}, resultado.copiado ? "Copiado ✓" : "Copiar mensagem"),
      e("p",{className:"text-[11.5px] text-[#9CA3AF]"}, "Protótipo: ainda não grava como venda do acerto nem emite garantia."),
      e("button",{onClick:function(){ setResultado(null); p.onConcluir(); }, className:"mt-1 h-11 w-full rounded-2xl bg-[#F3F4F6] text-[15px] font-semibold"}, "OK")));
  var folha = e("div",{className:"absolute inset-0 z-40 flex flex-col justify-end"},
    e("div",{onClick:p.onFechar, className:"absolute inset-0 bg-black/45"}),
    e("div",{className:"relative flex max-h-[90%] min-h-[40%] flex-col overflow-hidden rounded-t-[28px] bg-white text-[#111827] shadow-2xl"},
      e("div",{className:"mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D1D5DB]"}), cab, corpo),
    dialogo);
  return p.host ? createPortal(folha, p.host) : null;
}
export { JanelaVenda };
