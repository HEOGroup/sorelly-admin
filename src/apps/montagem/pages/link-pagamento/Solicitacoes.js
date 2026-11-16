// Sorelly Admin · montagem — pages/link-pagamento/Solicitacoes.js
// Aba Solicitações: quadro Kanban (solicitado → link gerado → pago → comprovante enviado), faixa de indicadores e "Nova solicitação".
// O quadro mostra só o que está em andamento; comprovantes enviados, expirados e cancelados aparecem por 3 dias e depois ficam só no Histórico (aba própria, com filtros e paginação).
// Regras (mínimo, parcela mínima, 6x, 12 h, 3 tentativas, dia do acerto) ficam em domain/link-pagamento.js (validarSolicitacao); aqui só desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CANAIS, COR_STATUS, EMISSORES, FLUXO, ROTULO_STATUS, agoraSP, calcularTaxa, expirados, formatarDia, formatarDataHora, BANDEIRAS, formatarReais, hojeSP, indicadoresLp, listaSolicitacoes, somaDias, meioDe, meioSugerido, minutosRestantes, nomeMeio,
  proximaEtapa, proximosStatus, parcelasPermitidas, repDaRevendedora, textoFaixas, textoRestante, validarSolicitacao } from "@/apps/montagem/domain/link-pagamento";
import { Bt, BtMini, Editor, Sel, Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { ImportarEsitef } from "@/apps/montagem/pages/link-pagamento/ImportarEsitef";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var FINAIS = {pago:1, comprovante:1, expirado:1, cancelado:1, recusado:1, negada:1, bloqueada:1, antifraude:1, abandonada:1};
var SEM_ACEITE = {recusado:1, negada:1, bloqueada:1, antifraude:1, abandonada:1};   // coluna "Recusado ou negado" (como no Kommo)
// motivos de cancelamento iguais aos da planilha (Hellen, 03/11/2026)
var MOTIVOS = [["expirado", "Expirada"], ["bloqueada", "Bloqueada"], ["cancelado", "Cancelada"], ["antifraude", "Antifraude"], ["abandonada", "Abandonada"], ["negada", "Negada"]];
var PEDE_MOTIVO = {cancelado:1, recusado:1, expirado:1, bloqueada:1, antifraude:1, abandonada:1, negada:1};
var DIAS_NO_QUADRO = 3;   // finais recentes ainda aparecem no quadro por alguns dias
var ANDAMENTO = {solicitado:1, gerado:1};
// pago e comprovante (registro antigo) ficam no quadro só pelo dia do PAGAMENTO; os outros finais, pela última data que tiverem
var noQuadro = function(x, desde){ var pg = x.status==="pago" || x.status==="comprovante"; return ANDAMENTO[x.status] || (FINAIS[x.status] && String((pg ? (x.pagoEm || x.criadoEm) : (x.comprovanteEm || x.pagoEm || x.geradoEm || x.criadoEm)) || "").slice(0,10)>=desde); };
// cor do selo de tempo: mais de 2 h verde, mais de 30 min âmbar, menos vermelho
var corRestante = function(min){ return min>120 ? "#4ADE80" : min>30 ? "#FBBF24" : "#EF4444"; };

function Cartao(p){
  // cartão COMPACTO e com fontes padronizadas (Marcus, 16/11/2026): nome 13 px; valor, representante, link e selos 11 px a 13 px, tudo alinhado à esquerda em poucas linhas
  var x = p.x, m = meioDe(p.s, x.meioId), min = minutosRestantes(x, p.agora), n = x.parcelas || 1, cor = COR_STATUS[x.status];
  var selo = function(txt, c, t){ return e("span",{title:t, className:"rounded px-1.5 text-[11px] font-bold leading-5", style:{background:c+"26", color:c}}, txt); };
  return e("div",{className:"flex flex-col gap-0.5 text-left"},
    e("b",{className:"break-words text-[13px] leading-tight"}, x.revendedora),
    e("div",{className:"flex flex-wrap items-baseline gap-x-2"}, e("b",{className:MONO+" text-[13px] leading-tight", style:{color:cor}}, formatarReais(x.valor)+" · "+n+"x"), e("span",{className:"text-[11px] leading-tight"}, x.representante || "Sem representante")),
    e("div",{className:"flex flex-wrap items-center gap-1"},
      e("span",{className:"text-[11px] leading-5"}, nomeMeio(m)),
      selo(x.canal==="whatsapp" ? "WhatsApp" : "App", x.canal==="whatsapp" ? "#4ADE80" : "#60A5FA"),
      x.status==="gerado" && min!=null && selo(textoRestante(min), corRestante(min), "Validade do link"),
      x.dataAcerto && selo("Acerto "+formatarDia(x.dataAcerto).slice(0,5), "#F3D98B", "Data do acerto"),
      x.paraAtendimento && selo("Pedido do atendimento", "#60A5FA", "Pedido feito no Atendimento Sorelly: a revendedora está na empresa e o link vale hoje"),
      x.porFora && selo("Pago por fora", "#F3D98B", "Link gerado fora do sistema e já pago (registrado pelo atendimento)"),
      x.tentativa>1 && selo(x.tentativa+"ª tentativa", "#FFFFFF", "Tentativa de gerar o link")),
    x.motivo && e("span",{className:"break-words text-[11px] leading-tight"}, x.motivo));
}

// Detalhe da solicitação (clicar no cartão): dados e andamento já preenchidos à esquerda, campos editáveis no meio, ações à direita (passar para a próxima etapa, cancelar)
function Detalhe(p){
  var L = p.L, s = L.s, lp = L.lp, x = lp.solicitacoes.find(function(y){ return y.id===p.id; }); if(!x) return null;
  var m = meioDe(s, x.meioId), prox = proximaEtapa(x), n = x.parcelas || 1, t = m ? calcularTaxa(m, x.valor, n, m.antecipacao.ativa, hojeSP()) : null, final = !ANDAMENTO[x.status];
  var linha = function(rot, val){ return e("div",{key:rot, className:"flex items-baseline justify-between gap-3 border-b border-white/10 py-1 text-[12.5px]"}, e("span",{className:"text-white/60"}, rot), e("b",{className:"text-right"}, val || "—")); };
  var dados = e("div",{className:"flex flex-col"},
    e("div",{className:"mb-2 flex flex-wrap items-center justify-center gap-2"}, e(Selo,{cor:COR_STATUS[x.status]}, ROTULO_STATUS[x.status]), e("b",{className:MONO+" text-[18px]", style:{color:COR_STATUS[x.status]}}, formatarReais(x.valor))),
    linha("Revendedora", x.revendedora), x.cliente && linha("Cliente (controle da revendedora)", x.cliente), linha("Parcelas", n+"x de "+formatarReais(Math.round(x.valor/n*100)/100)), linha("Canal", x.canal==="whatsapp" ? "WhatsApp" : "Aplicativo"),
    linha("Quem emite", x.emissor==="representante" ? "Representante" : "Atendimento"), x.porFora && linha("Origem", "Pago por fora (gerado fora do sistema)"), x.porFora && x.contaInformada && linha("Conta que recebeu", x.contaInformada), linha("Criada em", formatarDataHora(x.criadoEm)), linha("Link gerado", formatarDataHora(x.geradoEm)),
    linha("Validade até", formatarDataHora(x.expiraEm)), linha("Pago em", formatarDataHora(x.pagoEm)), linha("Comprovante", formatarDataHora(x.comprovanteEm)),
    t && linha("Taxa estimada", formatarReais(t.taxaValor+t.antecipacaoValor)), t && linha("Líquido", formatarReais(t.liquido)),
    x.autorizacao && linha("Autorização", x.autorizacao), x.acertoId && linha("Descontado no acerto", formatarDataHora(x.usadoEm)+(x.excedente>0 ? " · sobrou "+formatarReais(x.excedente) : "")), x.motivo && linha("Motivo", x.motivo),
    x.comprovanteImg && e("img",{src:x.comprovanteImg, alt:"Comprovante do pagamento", className:"mt-2 max-h-72 w-full rounded-md bg-white object-contain"}),
    e("div",{className:"mt-2 flex flex-col gap-1"}, (x.historico||[]).slice(-5).map(function(h, i){ return e("span",{key:i, className:"text-center text-[11px] text-white/60"}, formatarDataHora(h.em)+" · "+(h.por||"")+" · "+(ROTULO_STATUS[h.para]||h.para)+(h.nota ? " ("+h.nota+")" : "")); })));
  var campos = [
    {k:"representante", rot:"Representante", tipo:"select", vazio:"Sem representante", ops:lp.vinculos.map(function(v){ return [v.representante, v.representante]; }).concat(x.representante && !lp.vinculos.some(function(v){ return v.representante===x.representante; }) ? [[x.representante, x.representante]] : [])},
    {k:"meioId", rot:"Link", tipo:"select", vazio:"Selecione", ops:lp.meios.map(function(mm){ return [mm.id, nomeMeio(mm)]; })},
    {k:"dataAcerto", rot:"Data do acerto", tipo:"data"},
    {k:"linkUrl", rot:"Endereço do link (aparece no app da revendedora)", tipo:"texto", ph:"Cole aqui o link gerado"},
    {k:"bandeira", rot:"Bandeira", tipo:"select", vazio:"Não informada", ops:BANDEIRAS.map(function(b){ return [b, b]; })},
    {k:"observacao", rot:"Observação", tipo:"area"}];
  var extras = [
    prox && e(Bt,{key:"prox", tipo:"forte", ic:"arrow-right", onClick:function(){ p.onMover(x, x.status, prox); p.fechar(); }}, "Passar para "+ROTULO_STATUS[prox]),
    e(Sel,{key:"mv", v:"", set:function(v){ if(v){ p.onMover(x, x.status, v); p.fechar(); } }, rot:"Mover para", todos:"Mover para outra etapa", opcoes:FLUXO.filter(function(k){ return k!==x.status; }).map(function(k){ return [k, ROTULO_STATUS[k]]; })}),
    e(Bt,{key:"canc", tipo:"perigo", ic:"prohibit", onClick:function(){ p.fechar(); p.onCancelar(x); }}, "Cancelar ou recusar")];
  return e(Editor,{t:x.revendedora, sub:"Solicitação de link · "+ROTULO_STATUS[x.status], dados:dados, tDados:"Andamento", campos:campos, nc:1, titulos:["Editar"], icSalvar:"floppy-disk", salvarRot:"Salvar alterações", fechar:p.fechar, extras:extras,
    ini:{representante:x.representante||"", meioId:x.meioId||"", dataAcerto:x.dataAcerto||"", linkUrl:x.linkUrl||"", bandeira:x.bandeira||"", observacao:x.observacao||""},
    onSalvar:function(v){ return L.exec("sol_editar", Object.assign({id:x.id}, v)); }});
}

function AbaLpSolicitacoes(p){
  var L = useLp(), s = L.s, lp = L.lp, st = useState({busca:"", canal:"", meioId:""}), f = st[0], md = useState(null), modal = md[0], mo = useState("planilha"), modo = mo[0], tk = useState(0), tick = tk[1];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  // expira os links vencidos e atualiza os selos de tempo a cada minuto
  useEffect(function(){ var f1 = function(){ if(expirados(L.lp).length) L.exec("expirar"); tick(function(n){ return n+1; }); }; f1(); var t = setInterval(f1, 60000); return function(){ clearInterval(t); }; }, [lp.solicitacoes.length]);
  var agora = agoraSP(), ind = indicadoresLp(s), desde = somaDias(hojeSP(), -DIAS_NO_QUADRO);
  var lista = useMemo(function(){ return listaSolicitacoes({lp:{solicitacoes:lp.solicitacoes.filter(function(x){ return noQuadro(x, desde); })}}, f); }, [lp.solicitacoes, f, desde]);
  var mover = function(x, de, para){
    if(PEDE_MOTIVO[para]){ md[1]({tipo:"motivo", id:x.id, para:(para==="recusado" && x.status!=="solicitado") ? "negada" : para}); return; }
    L.exec("sol_mover", {id:x.id, para:para});
  };
  var itens = function(k){ return lista.filter(function(x){ return k==="recusado" ? SEM_ACEITE[x.status] : k==="pago" ? (x.status==="pago" || x.status==="comprovante") : x.status===k; }).map(function(x){ return Object.assign({}, x, {arrastavel:true}); }); };
  var colunas = ["solicitado", "gerado", "pago", "recusado", "expirado", "cancelado"].filter(function(k){ return ANDAMENTO[k] || k==="pago" || k==="recusado" || lista.some(function(x){ return x.status===k; }); }).map(function(k){
    return {k:k, titulo:k==="recusado" ? "Recusado ou negado" : ROTULO_STATUS[k], cor:COR_STATUS[k], itens:itens(k),
      aceita:function(it){ return k==="recusado" ? !SEM_ACEITE[it.status] : it.status!==k; }}; });
  var meiosLink = lp.meios.filter(function(m){ return m.tipo==="LINK"; });
  var ativo = !!(f.busca || f.canal || f.meioId);
  // FAIXA AZUL ÚNICA (Marcus, 16/11/2026: "mesma mentalidade do Contas a pagar, tudo compacto e azul"): abas, números do mês, visão e ações numa linha só, no azul do bloco.
  // Os filtros ficam no título das colunas da Planilha (como o Google Planilhas); no Quadro, Canal e Link continuam em dois menus pequenos.
  var SELQ = "h-8 rounded-md border border-white/50 bg-[#14233f] px-2 text-[13px] font-semibold text-white [color-scheme:dark]";
  var grupoVisao = e("div",{className:"inline-flex overflow-hidden rounded-md border border-white/50"}, [["planilha","Planilha"],["quadro","Quadro"]].map(function(o, i){ var on = modo===o[0];
    return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ mo[1](o[0]); }, className:"h-8 px-3 text-[13px] font-semibold "+(i ? "border-l border-white/50 " : "")+(on ? "bg-white text-[#14233f]" : "text-white hover:bg-white/15")}, o[1]); }));
  var num = function(rot, v, onClick, forte){ var cont = e("span",{className:"whitespace-nowrap text-[13px]"}, rot+" ", e("b",{className:"tabular-nums "+(forte ? "text-[#fca5a5]" : "")}, v));
    return onClick ? e("button",{key:rot, type:"button", onClick:onClick, title:"Abrir", className:"rounded px-1 hover:bg-white/15"}, cont) : e("span",{key:rot, className:"px-1"}, cont); };
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    p.topo,
    e("div",{className:"flex flex-wrap items-center gap-x-1"},
      num("Mês", ind.total), num("App", ind.porCanal.app), num("WhatsApp", ind.porCanal.whatsapp), num("Em aberto", ind.abertas),
      num("Pago no mês", formatarReais(ind.pagoMes)+" · "+ind.qtdPagosMes+" links")),
    e("span",{className:"flex-1"}),
    modo==="quadro" && e("select",{"aria-label":"Canal", value:f.canal, onChange:function(ev){ set("canal", ev.target.value); }, className:SELQ}, [e("option",{key:"x", value:""}, "Todos os canais")].concat(CANAIS.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
    modo==="quadro" && e("select",{"aria-label":"Link", value:f.meioId, onChange:function(ev){ set("meioId", ev.target.value); }, className:SELQ}, [e("option",{key:"x", value:""}, "Todos os links")].concat(meiosLink.map(function(m){ return e("option",{key:m.id, value:m.id}, nomeMeio(m)); }))),
    modo==="quadro" && ativo && e(Botao,{onClick:function(){ st[1]({busca:"", canal:"", meioId:""}); }}, "Limpar"),
    grupoVisao,
    e(Botao,{onClick:function(){ md[1]({tipo:"esitef"}); }}, "Importar e-SiTef"),
    e(Botao,{onClick:function(){ p.onIr("historico"); }}, "Histórico"),
    e(Botao,{principal:true, onClick:function(){ md[1]({tipo:"nova"}); }}, "Nova solicitação"));
  return e("div",{className:"flex flex-col"},
    e(BlocoPainel,{titulo:"Solicitações de link", compacto:true},
      faixa,
      modo==="planilha" ? e(Planilha,{lista:lista, s:s, onMover:mover, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); }}) : e("div",{className:"p-2"}, e(Kanban,{colunas:colunas, compacto:true, cabecaFina:true, semMover:true, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); }, unidade:["solicitação", "solicitações"], vazio:"Nenhuma solicitação nesta etapa.", onMover:mover, card:function(x){ return e(Cartao,{x:x, s:s, agora:agora, onMover:mover}); }}))),
    modal && modal.tipo==="esitef" && e(ImportarEsitef,{L:L, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="nova" && e(NovaSolicitacao,{L:L, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{L:L, id:modal.id, onMover:mover, onCancelar:function(x){ md[1]({tipo:"motivo", id:x.id}); }, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{L:L, id:modal.id, para:modal.para, fechar:function(){ md[1](null); }}));
}

var dia = function(v){ return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };   // colunas de data guardam AAAA-MM-DD (ordenam certo) e mostram DD/MM/AAAA
// Modo planilha (padrão): as mesmas solicitações do quadro, uma por linha, com filtro e ordem no título de cada coluna e a ação de concluir a etapa. Nada some: o que era selo no cartão virou coluna "Origem".
function Planilha(p){
  var agora = agoraSP();
  if(!p.lista.length) return e("p",{className:"py-6 text-center text-[13px]"}, "Nenhuma solicitação.");
  var linhas = p.lista.map(function(x){
    var m = meioDe(p.s, x.meioId), prox = proximaEtapa(x), min = minutosRestantes(x, agora), origem = [];
    if(x.paraAtendimento) origem.push("Pedido do atendimento"); if(x.porFora) origem.push("Pago por fora"); if(x.tentativa>1) origem.push(x.tentativa+"ª tentativa"); if(x.motivo) origem.push(x.motivo);
    return {id:x.id, data:String(x.criadoEm || "").slice(0, 10), revendedora:x.revendedora, representante:x.representante || "Sem representante", link:nomeMeio(m), valor:x.valor, parcelas:(x.parcelas || 1)+"x",
      canal:x.canal==="whatsapp" ? "WhatsApp" : "App", situacao:ROTULO_STATUS[x.status], _cor:COR_STATUS[x.status], validade:x.status==="gerado" && min!=null ? textoRestante(min) : "—", _min:min,
      acerto:String(x.dataAcerto || "").slice(0, 10), origem:origem.join(" · ") || "—", acao:prox ? (prox==="pago" ? "Confirmar pagamento" : "Concluir etapa") : "", _x:x, _prox:prox}; });
  var cols = [{k:"data", t:"Data", fmt:dia, render:dia}, {k:"revendedora", t:"Revendedora"}, {k:"representante", t:"Representante"}, {k:"link", t:"Link"},
    {k:"valor", t:"Valor", fmt:function(v){ return formatarReais(v); }, render:function(v){ return e("b",{className:"tabular-nums"}, formatarReais(v)); }},
    {k:"parcelas", t:"Parcelas"}, {k:"canal", t:"Canal"},
    {k:"situacao", t:"Situação", render:function(v, l){ return e("span",{className:"font-bold", style:{color:l._cor}}, v); }},
    {k:"validade", t:"Validade", render:function(v, l){ return l._min!=null && l._x.status==="gerado" ? e("span",{className:"font-bold tabular-nums", style:{color:corRestante(l._min)}}, v) : v; }},
    {k:"acerto", t:"Acerto", fmt:dia, render:dia}, {k:"origem", t:"Origem"},
    {k:"acao", t:"Ação", render:function(v, l){ return v ? e(BtMini,{forte:true, onClick:function(ev){ ev.stopPropagation(); p.onMover(l._x, l._x.status, l._prox); }}, l._prox==="pago" ? "Confirmar pagamento ›" : "Concluir etapa ›") : ""; }}];
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true, aoClicar:function(l){ p.onAbrir(l._x); }});
}

// Janela "Nova solicitação": canal, revendedora, valor, parcelas e meio (sugerido pelo vínculo da representante). A recusa vem do domínio, em texto formal.
function NovaSolicitacao(p){
  var L = p.L, s = L.s, lp = L.lp, cfg = L.cfg, hoje = hojeSP();
  var links = lp.meios.filter(function(m){ return m.tipo==="LINK" && m.ativo; });
  var parcs = []; for(var i = 1; i<=cfg.maxParcelasSemJuros; i++) parcs.push([String(i), i+"x"]);
  var campos = [
    {k:"canal", rot:"Canal", tipo:"botoes", ops:CANAIS, obrig:true},
    {k:"revendedora", rot:"Revendedora", tipo:"texto", obrig:true, ph:"Nome da revendedora"},
    {k:"representante", rot:"Representante", tipo:"select", vazio:"Selecione", ops:lp.vinculos.map(function(v){ return [v.representante, v.representante]; }), dica:"Vincula a revendedora a esta representante.", se:function(v){ return !!String(v.revendedora||"").trim() && !repDaRevendedora(lp, v.revendedora); }},
    {k:"emissor", rot:"Quem emite o link", tipo:"botoes", ops:EMISSORES},
    {k:"valor", rot:"Valor", tipo:"dinheiro", obrig:true},
    {k:"parcelas", rot:"Parcelas", tipo:"select", vazio:"Selecione", ops:function(v){ var m = Number(v.valor)>0 ? parcelasPermitidas(cfg, Number(v.valor)) : cfg.maxParcelasSemJuros; return parcs.filter(function(o){ return Number(o[0])<=m; }); }, obrig:true, dica:"Só aparecem as parcelas permitidas para o valor."},
    {k:"meioId", rot:"Link", tipo:"select", vazio:"Automático (pelo vínculo da representante)", ops:links.map(function(m){ return [m.id, nomeMeio(m)]; })},
    {k:"dataAcerto", rot:"Data do acerto", tipo:"data", dica:"Opcional. No dia do acerto só a representante emite."},
    {k:"observacao", rot:"Observação", tipo:"area"}];
  return e(Editor,{t:"Nova solicitação de link", sub:"Link de pagamento da revendedora para a cliente final.", campos:campos, nc:2, titulos:["Solicitação", "Valor e link"], icSalvar:"paper-plane-tilt", salvarRot:"Registrar solicitação", fechar:p.fechar,
    ini:{canal:"app", revendedora:"", representante:"", emissor:"atendimento", valor:0, parcelas:"1", meioId:"", dataAcerto:"", observacao:""},
    valida:function(v){ return validarSolicitacao(s, v) || ""; },
    onSalvar:function(v){ return L.exec("sol_criar", v); },
    lateral:function(v){
      var m = v.meioId ? meioDe(s, v.meioId) : meioSugerido(s, v.revendedora, v.representante), t = m && Number(v.valor)>0 ? calcularTaxa(m, v.valor, v.parcelas, m.antecipacao.ativa, hoje) : null;
      var regra = function(ic, tx){ return e("li",{key:ic+tx, className:"flex items-center justify-center gap-1.5 text-[12px] text-white/80"}, e(Ph,{n:ic, s:14, className:"text-[#60A5FA]"}), tx); };
      return e("div",{className:"flex flex-col gap-2"},
        e("ul",{className:"flex flex-col gap-1 rounded-lg bg-black/25 p-2"},
          regra("coins", "Mínimo de "+formatarReais(cfg.minimo)+" por link"), regra("stack", "Parcela mínima de "+formatarReais(cfg.parcelaMinima)),
          textoFaixas(cfg).map(function(f){ return regra("list-numbers", f[0]+": "+f[1]+" sem juros"); }),
          regra("timer", "Validade de "+cfg.validadeHoras+" h (a revendedora é avisada de "+(cfg.avisoHoras || 12)+" h)"), regra("repeat", "Até "+cfg.tentativasDia+" tentativas por dia"), regra("calendar-check", "Vale para o acerto o link emitido e pago até o dia anterior")),
        e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[12px] text-white/85"}, e("b",null, "Link: "), m ? nomeMeio(m) : "Sem link vinculado"),
        t && e("p",{className:"rounded-lg bg-[#3B82F6]/15 px-2 py-1.5 text-[12px] text-white/85"}, "Taxa estimada "+formatarReais(t.taxaValor+t.antecipacaoValor)+" · líquido "+formatarReais(t.liquido)));
    }});
}

// Motivo de cancelamento ou recusa (a recusa só vale para o que ainda está em "Solicitado")
function Motivo(p){
  var x = p.L.lp.solicitacoes.find(function(y){ return y.id===p.id; }); if(!x) return null;
  var ops = MOTIVOS.concat(x.status==="solicitado" ? [["recusado", "Recusado"]] : []);
  return e(Editor,{t:"Cancelar ou recusar solicitação", sub:x.revendedora+" · "+formatarReais(x.valor), nc:1, icSalvar:"check", salvarRot:"Confirmar", fechar:p.fechar,
    campos:[{k:"para", rot:"Ação", tipo:"botoes", ops:ops}, {k:"nota", rot:"Motivo", tipo:"area", ph:"Informe o motivo (obrigatório para Cancelada e Recusado)"}], ini:{para:p.para || "cancelado", nota:""},
    onSalvar:function(v){ return p.L.exec("sol_mover", {id:p.id, para:v.para, nota:v.nota}); }});
}
export { AbaLpSolicitacoes, NovaSolicitacao, Motivo };
