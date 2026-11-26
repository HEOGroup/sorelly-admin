// Sorelly Admin · montagem — pages/link-pagamento/Solicitacoes.js
// Aba Solicitações: quadro Kanban (solicitado → link gerado → pago → comprovante enviado), faixa de indicadores e "Nova solicitação".
// O quadro mostra só o que está em andamento; comprovantes enviados, expirados e cancelados aparecem por 3 dias e depois ficam só no Histórico (aba própria, com filtros e paginação).
// Regras (mínimo, parcela mínima, 6x, 12 h, 3 tentativas, dia do acerto) ficam em domain/link-pagamento.js (validarSolicitacao); aqui só desenho.
// COMPROVANTE (26/11/2026, Leonardo): coluna "Comprovante" (Anexado · Falta) e janela para anexar a foto ou o PDF (servidor de anexos, módulo lp). Confirmar o pagamento à mão pede o comprovante antes.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CANAIS, COR_STATUS, EMISSORES, FLUXO, ROTULO_STATUS, agoraSP, calcularTaxa, expirados, formatarDia, formatarDataHora, BANDEIRAS, formatarReais, hojeSP, indicadoresLp, listaSolicitacoes, somaDias, meioDe, meioSugerido, minutosRestantes, nomeMeio,
  proximaEtapa, proximosStatus, retentativa, agruparTentativas, indicePorNome, parcelasPermitidas, repDaRevendedora, textoFaixas, textoRestante, validarSolicitacao, foiPago, temComprovante } from "@/apps/montagem/domain/link-pagamento";
import { abrirAnexo, enviarAnexo, lerAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { Bt, BtMini, Editor, Sel, Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { ImportarEsitef } from "@/apps/montagem/pages/link-pagamento/ImportarEsitef";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useMemo, useRef, useState } from "@/shared/react";

var FINAIS = {pago:1, comprovante:1, expirado:1, cancelado:1, recusado:1, negada:1, bloqueada:1, antifraude:1, abandonada:1};
var SEM_ACEITE = {recusado:1, negada:1, bloqueada:1, antifraude:1, abandonada:1};   // coluna "Recusado ou negado" (como no Kommo)
// motivos de cancelamento iguais aos da planilha (Hellen, 03/11/2026)
var MOTIVOS = [["expirado", "Expirada"], ["bloqueada", "Bloqueada"], ["cancelado", "Cancelada"], ["antifraude", "Antifraude"], ["abandonada", "Abandonada"], ["negada", "Negada"]];
var PEDE_MOTIVO = {cancelado:1, recusado:1, expirado:1, bloqueada:1, antifraude:1, abandonada:1, negada:1};
var DIAS_NO_QUADRO = 3;   // finais recentes ainda aparecem no quadro por alguns dias
var ANDAMENTO = {solicitado:1, gerado:1};
// pago e comprovante (registro antigo) ficam no quadro só pelo dia do PAGAMENTO; os outros finais, pela última data que tiverem
// Só o QUADRO usa este corte (andamento + finais dos últimos dias). A PLANILHA mostra tudo: é a planilha infinita (Marcus, 16/11/2026), sem aba de Histórico.
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
// CARD da solicitação (Marcus, 16/11/2026: "muda as cores tudo do card pra ficar mais padronizado"): mesma janela azul do resto do setor, texto 13 px branco, três blocos (Andamento, Editar, Ações).
function Detalhe(p){
  var L = p.L, s = L.s, lp = L.lp, x = lp.solicitacoes.find(function(y){ return y.id===p.id; }); var forma = useState(function(){ return x ? {representante:x.representante||"", meioId:x.meioId||"", dataAcerto:x.dataAcerto||"", linkUrl:x.linkUrl||"", bandeira:x.bandeira||"", observacao:x.observacao||""} : {}; }), v = forma[0]; if(!x) return null;
  var tentativasDaCompra = x ? ((agruparTentativas(lp.solicitacoes).find(function(g){ return g.itens.some(function(y){ return y.id===x.id; }); }) || {}).itens || []) : [];
  var m = meioDe(s, x.meioId), prox = proximaEtapa(x), n = x.parcelas || 1, t = m ? calcularTaxa(m, x.valor, n, m.antecipacao.ativa, hojeSP()) : null;
  var set = function(k, val){ forma[1](function(o){ var r = Object.assign({}, o); r[k] = val; return r; }); };
  var BLOCO = "flex flex-col border border-white/20 bg-[#14233f]", CAB = "border-b border-white/20 bg-[var(--bloco-titulo)] px-2 py-1 text-center text-[11px] font-bold uppercase text-white", IN = "h-8 w-full rounded-md border border-white/40 bg-[#0f1a2e] px-2 text-center text-[13px] font-semibold text-white [color-scheme:dark]";
  var linha = function(rot, val){ return e("div",{key:rot, className:"flex items-center justify-between gap-3 border-b border-white/10 px-2 py-1 text-[13px]"}, e("span",null, rot), e("b",{className:"text-right"}, val || "—")); };
  var campo = function(rot, ctl){ return e("label",{key:rot, className:"flex flex-col gap-0.5 px-2 py-1 text-[11px] font-bold uppercase"}, rot, ctl); };
  var selc = function(k, vazio, ops){ return e("select",{value:v[k], onChange:function(ev){ set(k, ev.target.value); }, className:IN}, [e("option",{key:"_", value:""}, vazio)].concat(ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); };
  var repOps = lp.vinculos.map(function(q){ return [q.representante, q.representante]; }).concat(x.representante && !lp.vinculos.some(function(q){ return q.representante===x.representante; }) ? [[x.representante, x.representante]] : []);
  var salvar = function(){ if(L.exec("sol_editar", Object.assign({id:x.id}, v))) p.fechar(); };
  var andamento = [linha("Revendedora", x.revendedora), x.cliente && linha("Cliente (controle da revendedora)", x.cliente), linha("Parcelas", n+"x de "+formatarReais(Math.round(x.valor/n*100)/100)), linha("Canal", x.canal==="whatsapp" ? "WhatsApp" : "Aplicativo"),
    linha("Quem emite", x.emissor==="representante" ? "Representante" : "Atendimento"), x.porFora && linha("Origem", "Pago por fora (gerado fora do sistema)"), x.porFora && x.contaInformada && linha("Conta que recebeu", x.contaInformada),
    linha("Criada em", formatarDataHora(x.criadoEm)), linha("Link gerado", formatarDataHora(x.geradoEm)), linha("Validade até", formatarDataHora(x.expiraEm)), linha("Pago em", formatarDataHora(x.pagoEm)),
    t && linha("Taxa estimada", formatarReais(t.taxaValor+t.antecipacaoValor)), t && linha("Líquido", formatarReais(t.liquido)),
    x.autorizacao && linha("Autorização", x.autorizacao), x.esitefNsu && linha("NSU do e-SiTef", x.esitefNsu), x.acertoId && linha("Descontado no acerto", formatarDataHora(x.usadoEm)+(x.excedente>0 ? " · sobrou "+formatarReais(x.excedente) : "")), x.motivo && linha("Motivo", x.motivo)];
  return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{className:"flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-lg border border-white/30 bg-[#0f1a2e] text-white", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex flex-wrap items-center justify-center gap-3 border-b border-white/20 bg-[var(--bloco-titulo)] px-3 py-2"},
        e("b",{className:"text-[13px] uppercase"}, x.revendedora), e("b",{className:"text-[13px]", style:{color:COR_STATUS[x.status]}}, ROTULO_STATUS[x.status]), e("b",{className:MONO+" text-[18px]"}, formatarReais(x.valor)), e("span",{className:"flex-1"}),
        e(Botao,{onClick:p.fechar}, "Fechar")),
      e("div",{className:"grid gap-2 overflow-auto p-2 md:grid-cols-3"},
        e("div",{className:BLOCO}, e("div",{className:CAB}, "Andamento"), andamento,
          (x.status==="gerado" || foiPago(x)) && linha("Comprovante", temComprovante(x) ? "Anexado"+(x.comprovante && x.comprovante.por ? " por "+x.comprovante.por+" em "+formatarDataHora(x.comprovante.em) : "") : "Falta"),
          x.comprovante && x.comprovante.key ? e(FotoComprovante,{k:x.comprovante.key}) : x.comprovanteImg && e("img",{src:x.comprovanteImg, alt:"Comprovante do pagamento", className:"m-2 max-h-72 rounded-md bg-white object-contain"}),
          tentativasDaCompra.length>1 && e("span",{key:"tt", className:"border-t border-white/20 px-2 pt-1 text-center text-[11px] font-bold uppercase"}, "Tentativas desta compra"),
          tentativasDaCompra.length>1 && tentativasDaCompra.map(function(y){ return e("span",{key:y.id, className:"px-2 py-0.5 text-center text-[13px]"}, formatarDataHora(y.criadoEm)+" · "+formatarReais(y.valor)+" · ", e("b",{style:{color:COR_STATUS[y.status]}}, ROTULO_STATUS[y.status]+(y.id===x.id ? " (esta)" : ""))); }),
          (x.historico||[]).slice(-5).map(function(h, i){ return e("span",{key:i, className:"px-2 py-0.5 text-center text-[11px]"}, formatarDataHora(h.em)+" · "+(h.por||"")+" · "+(ROTULO_STATUS[h.para]||h.para)+(h.nota ? " ("+h.nota+")" : "")); })),
        e("div",{className:BLOCO}, e("div",{className:CAB}, "Editar"),
          campo("Representante", selc("representante", "Sem representante", repOps)), campo("Link", selc("meioId", "Selecione", lp.meios.map(function(mm){ return [mm.id, nomeMeio(mm)]; }))),
          campo("Data do acerto", e("input",{type:"date", value:v.dataAcerto, onChange:function(ev){ set("dataAcerto", ev.target.value); }, className:IN})),
          campo("Endereço do link (aparece no app da revendedora)", e("input",{type:"text", value:v.linkUrl, placeholder:"Cole aqui o link gerado", onChange:function(ev){ set("linkUrl", ev.target.value); }, className:IN})),
          campo("Bandeira", selc("bandeira", "Não informada", BANDEIRAS.map(function(b){ return [b, b]; }))),
          campo("Observação", e("textarea",{value:v.observacao, rows:2, onChange:function(ev){ set("observacao", ev.target.value); }, className:IN+" h-auto resize-none py-1"}))),
        e("div",{className:BLOCO}, e("div",{className:CAB}, "Ações"),
          e("div",{className:"flex flex-col gap-2 p-2"},
            e(Botao,{principal:true, onClick:salvar}, "Salvar alterações"),
            prox && e(Botao,{onClick:function(){ p.fechar(); p.onMover(x, x.status, prox); }}, prox==="pago" ? "Confirmar pagamento" : "Passar para "+ROTULO_STATUS[prox]),
            (x.status==="gerado" || foiPago(x)) && e(Botao,{onClick:function(){ p.fechar(); p.onComprovante(x); }}, temComprovante(x) ? "Trocar comprovante" : "Anexar comprovante"),
            x.comprovante && x.comprovante.key && e(Botao,{onClick:function(){ verComprovante(x); }}, "Abrir comprovante"),
            e("select",{value:"", "aria-label":"Mover para", onChange:function(ev){ var k = ev.target.value; if(k){ p.fechar(); p.onMover(x, x.status, k); } }, className:IN}, [e("option",{key:"_", value:""}, "Mover para outra etapa")].concat(FLUXO.filter(function(k){ return k!==x.status; }).map(function(k){ return e("option",{key:k, value:k}, ROTULO_STATUS[k]); }))),
            e(Botao,{onClick:function(){ p.fechar(); p.onCancelar(x); }}, "Cancelar ou recusar"))))));
}

function AbaLpSolicitacoes(p){
  var L = useLp(), s = L.s, lp = L.lp, st = useState({busca:"", canal:"", meioId:""}), f = st[0], md = useState(null), modal = md[0], mo = useState("planilha"), modo = mo[0], tk = useState(0), tick = tk[1];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  // expira os links vencidos e atualiza os selos de tempo a cada minuto
  // 22/11/2026: o ajuste único (validade 48 h e parcelas pela regra) roda ANTES de expirar e grava no servidor; a migração sozinha não grava (ver "ajustar" em domain/link-pagamento.js)
  useEffect(function(){ var f1 = function(){ if(L.lp.ajusteV!==1) L.exec("ajustar"); if(expirados(L.lp).length) L.exec("expirar"); tick(function(n){ return n+1; }); }; f1(); var t = setInterval(f1, 60000); return function(){ clearInterval(t); }; }, [lp.solicitacoes.length]);
  var agora = agoraSP(), desde = somaDias(hojeSP(), -DIAS_NO_QUADRO);
  var lista = useMemo(function(){ return listaSolicitacoes({lp:{solicitacoes:lp.solicitacoes.filter(function(x){ return noQuadro(x, desde); })}}, f); }, [lp.solicitacoes, f, desde]);
  var mover = function(x, de, para){
    if(PEDE_MOTIVO[para]){ md[1]({tipo:"motivo", id:x.id, para:(para==="recusado" && x.status!=="solicitado") ? "negada" : para}); return; }
    if(para==="pago" && !temComprovante(x)){ md[1]({tipo:"comprovante", id:x.id, confirmar:true}); return; }   // sem comprovante não confirma (26/11/2026)
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
  var faixa = e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    p.topo,
    e("span",{className:"flex-1"}),
    modo==="quadro" && e("select",{"aria-label":"Canal", value:f.canal, onChange:function(ev){ set("canal", ev.target.value); }, className:SELQ}, [e("option",{key:"x", value:""}, "Todos os canais")].concat(CANAIS.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
    modo==="quadro" && e("select",{"aria-label":"Link", value:f.meioId, onChange:function(ev){ set("meioId", ev.target.value); }, className:SELQ}, [e("option",{key:"x", value:""}, "Todos os links")].concat(meiosLink.map(function(m){ return e("option",{key:m.id, value:m.id}, nomeMeio(m)); }))),
    modo==="quadro" && ativo && e(Botao,{onClick:function(){ st[1]({busca:"", canal:"", meioId:""}); }}, "Limpar"),
    grupoVisao,
    e(Botao,{onClick:function(){ md[1]({tipo:"esitef"}); }}, "Importar e-SiTef"),
    e(Botao,{principal:true, onClick:function(){ md[1]({tipo:"nova"}); }}, "Nova solicitação"));
  return e("div",{className:"flex flex-col"},
    e(BlocoPainel,{titulo:"Solicitações de link", compacto:true},
      faixa,
      modo==="planilha" ? e(Planilha,{lista:lista, s:s, onMover:mover, onComprovante:function(x){ md[1]({tipo:"comprovante", id:x.id}); }, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); }}) : e("div",{className:"p-2"}, e(Kanban,{colunas:colunas, compacto:true, cabecaFina:true, semMover:true, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); }, unidade:["solicitação", "solicitações"], vazio:"Nenhuma solicitação nesta etapa.", onMover:mover, card:function(x){ return e(Cartao,{x:x, s:s, agora:agora, onMover:mover}); }}))),
    modal && modal.tipo==="esitef" && e(ImportarEsitef,{L:L, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="nova" && e(NovaSolicitacao,{L:L, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{L:L, id:modal.id, onMover:mover, onComprovante:function(x){ md[1]({tipo:"comprovante", id:x.id}); }, onCancelar:function(x){ md[1]({tipo:"motivo", id:x.id}); }, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="comprovante" && e(JanelaComprovante,{L:L, id:modal.id, confirmar:!!modal.confirmar, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{L:L, id:modal.id, para:modal.para, fechar:function(){ md[1](null); }}));
}

// Comprovante do link (26/11/2026). verComprovante abre o arquivo numa aba nova; FotoComprovante mostra a foto no detalhe.
function verComprovante(x){ abrirAnexo(x.comprovante.key).catch(function(er){ window.alert((er && er.message) || "Não consegui abrir o comprovante."); }); }
function FotoComprovante(p){
  var st = useState(null), a = st[0];
  useEffect(function(){ var vivo = true; lerAnexo(p.k).then(function(r){ if(vivo) st[1](r); }, function(){}); return function(){ vivo = false; }; }, [p.k]);   // eslint-disable-line react-hooks/exhaustive-deps
  return a && /^image\//.test(a.mime || "") ? e("img",{src:a.url, alt:"Comprovante do pagamento", className:"m-2 max-h-72 rounded-md bg-white object-contain"}) : null;
}
// Janela "Comprovante do pagamento": escolhe a foto ou o PDF, envia ao servidor (módulo lp) e grava a chave no link. confirmar = true: o mesmo passo confirma o pagamento.
function JanelaComprovante(p){
  var L = p.L, x = L.lp.solicitacoes.find(function(y){ return y.id===p.id; }), ref = useRef(null);
  var ar = useState(null), arq = ar[0], st = useState(""), estado = st[0];
  if(!x) return null;
  var n = x.parcelas || 1;
  var escolher = function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!f) return;
    st[1]("Lendo o arquivo"); lerArquivo(f).then(function(a){ ar[1](a); st[1](""); }, function(er){ st[1](""); window.alert(er.message); }); };
  var salvar = function(){ if(!arq || estado) return; st[1]("Enviando o comprovante");
    enviarAnexo("lp", arq).then(function(r){ var cp = {key:r.key, nome:r.nome, mime:r.mime};
      var feito = p.confirmar ? L.exec("sol_mover", {id:x.id, para:"pago", comprovante:cp}) : L.exec("sol_comprovante", {id:x.id, comprovante:cp});
      st[1](""); if(feito) p.fechar(); }, function(er){ st[1](""); window.alert((er && er.message) || "Não consegui enviar o comprovante."); }); };
  return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{className:"flex max-h-[90vh] w-full max-w-[460px] flex-col overflow-hidden rounded-lg border border-white/30 bg-[#0f1a2e] text-white", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-center justify-center gap-3 border-b border-white/20 bg-[var(--bloco-titulo)] px-3 py-2"},
        e("b",{className:"text-[13px]"}, p.confirmar ? "Confirmar pagamento" : "Comprovante do pagamento")),
      e("div",{className:"flex flex-col items-center gap-2 overflow-auto p-3 text-center text-[13px]"},
        e("b",null, x.revendedora), e("span",{className:"tabular-nums"}, formatarReais(x.valor)+" · "+n+"x de "+formatarReais(Math.round(x.valor/n*100)/100)),
        p.confirmar && e("span",null, "Sem comprovante o pagamento não é confirmado."),
        e("input",{ref:ref, type:"file", accept:"image/*,application/pdf,.pdf", className:"hidden", "aria-label":"Escolher o comprovante", onChange:escolher}),
        e(Botao,{onClick:function(){ if(ref.current) ref.current.click(); }}, arq ? "Trocar arquivo" : "Escolher foto ou PDF"),
        arq && (/^image\//.test(arq.mime) ? e("img",{src:arq.url, alt:"Comprovante escolhido", className:"max-h-72 rounded-md bg-white object-contain"}) : e("span",null, "PDF: "+arq.nome)),
        estado && e("span",{className:"font-semibold"}, estado),
        e("div",{className:"flex flex-wrap justify-center gap-2 pt-1"},
          e(Botao,{onClick:p.fechar}, "Cancelar"),
          e(Botao,{principal:true, desabilitado:!arq || !!estado, onClick:salvar}, p.confirmar ? "Anexar e confirmar" : "Anexar comprovante")))));
}

var tomDoDia = function(iso){ var q = String(iso || "").slice(0, 10).split("-").map(Number); return q.length===3 && Math.floor(Date.UTC(q[0], q[1]-1, q[2])/86400000)%2 ? "bg-white/[0.07]" : ""; };   // cor sim, cor não: um tom leve alterna a cada DIA
var dia = function(v){ return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };   // colunas de data guardam AAAA-MM-DD (ordenam certo) e mostram DD/MM/AAAA
// Modo planilha (padrão): as mesmas solicitações do quadro, uma por linha, com filtro e ordem no título de cada coluna e a ação de concluir a etapa. Nada some: o que era selo no cartão virou coluna "Origem".
function Planilha(p){
  var agora = agoraSP(), grupos = useMemo(function(){ var mapa = {}; agruparTentativas(p.s.lp.solicitacoes).forEach(function(g){ g.itens.forEach(function(y){ mapa[y.id] = g; }); }); return mapa; }, [p.s.lp.solicitacoes]);
  var compras = useMemo(function(){ return agruparTentativas(p.s.lp.solicitacoes).map(function(g){ return {x:g.rep, n:g.tentativas}; }).sort(function(a, b){ return String(b.x.criadoEm || "")<String(a.x.criadoEm || "") ? -1 : String(b.x.criadoEm || "")>String(a.x.criadoEm || "") ? 1 : 0; }); }, [p.s.lp.solicitacoes]);
  var recente = somaDias(hojeSP(), -30), idxNome = useMemo(function(){ return indicePorNome(p.s.lp.solicitacoes); }, [p.s.lp.solicitacoes]);
  if(!compras.length) return e("p",{className:"py-6 text-center text-[13px]"}, "Nenhuma solicitação.");
  var linhas = compras.map(function(cp){ var x = cp.x;
    var m = meioDe(p.s, x.meioId), prox = proximaEtapa(x), min = minutosRestantes(x, agora), origem = [];
    if(x.paraAtendimento) origem.push("Pedido do atendimento"); if(x.porFora) origem.push("Pago por fora"); if(x.tentativa>1) origem.push(x.tentativa+"ª tentativa"); if(x.motivo) origem.push(x.motivo);
    return {id:x.id, data:String(x.criadoEm || "").slice(0, 10), revendedora:x.revendedora, representante:x.representante || "Sem representante", link:nomeMeio(m), valor:x.valor, parcelas:(x.parcelas || 1)+"x",
      canal:x.canal==="whatsapp" ? "WhatsApp" : "App", situacao:ROTULO_STATUS[x.status], _cor:COR_STATUS[x.status], validade:x.status==="gerado" && min!=null ? textoRestante(min) : "—", _min:min,
      tentativas:cp.n, retentativa:String(x.criadoEm || "").slice(0, 10)>=recente ? (retentativa(p.s.lp, x, idxNome) || "—") : "—", bandeira:x.bandeira || "—", pagoEm:String(x.pagoEm || "").slice(0, 10), autorizacao:x.autorizacao || "—", acerto:String(x.dataAcerto || "").slice(0, 10), origem:origem.join(" · ") || "—", comprovante:temComprovante(x) ? "Anexado" : foiPago(x) ? "Falta" : "—", acao:prox ? (prox==="pago" ? "Confirmar pagamento" : "Concluir etapa") : "", _x:x, _prox:prox}; });
  var cols = [{k:"data", t:"Data", data:true, fmt:dia, render:dia}, {k:"revendedora", t:"Revendedora"}, {k:"representante", t:"Representante"}, {k:"link", t:"Link"},
    {k:"valor", t:"Valor", fmt:function(v){ return formatarReais(v); }, render:function(v){ return e("b",{className:"tabular-nums"}, formatarReais(v)); }},
    {k:"parcelas", t:"Parcelas"}, {k:"bandeira", t:"Bandeira"}, {k:"canal", t:"Canal"},
    {k:"situacao", t:"Situação", render:function(v, l){ return e("span",{className:"font-bold", style:{color:l._cor}}, v); }},
    {k:"comprovante", t:"Comprovante", render:function(v, l){ var x = l._x, pode = x.status==="gerado" || foiPago(x);
      if(v==="Anexado") return e("span",{className:"inline-flex items-center gap-1"}, e("span",{className:"font-bold text-success"}, "Anexado"), e(BtMini,{onClick:function(){ if(x.comprovante && x.comprovante.key) verComprovante(x); else p.onAbrir(x); }}, "Ver"));
      if(!pode) return v;
      return e("span",{className:"inline-flex items-center gap-1"}, v==="Falta" && e("span",{className:"font-bold text-destructive", title:"Pago sem comprovante (ex.: confirmado pelo e-SiTef). Anexe para o comprovante chegar ao acerto da representante."}, "Falta"), e(BtMini,{forte:v==="Falta", onClick:function(){ p.onComprovante(x); }}, "Anexar")); }},
    {k:"validade", t:"Validade", render:function(v, l){ return l._min!=null && l._x.status==="gerado" ? e("span",{className:"font-bold tabular-nums", style:{color:corRestante(l._min)}}, v) : v; }},
    {k:"pagoEm", t:"Pago em", fmt:dia, render:dia}, {k:"autorizacao", t:"Autorização"}, {k:"tentativas", t:"Tentativas"}, {k:"retentativa", t:"Nova tentativa", render:function(v){ return e("span",{className:"font-bold "+(v==="Pago depois" ? "text-success" : v==="Sem novo link" ? "text-[#FBBF24]" : "")}, v); }}, {k:"acerto", t:"Acerto", fmt:dia, render:dia}, {k:"origem", t:"Origem"},
    {k:"acao", t:"Ação", render:function(v, l){ return v ? e(BtMini,{forte:true, onClick:function(){ p.onMover(l._x, l._x.status, l._prox); }}, l._prox==="pago" ? "Confirmar pagamento ›" : "Concluir etapa ›") : ""; }}];
  return e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true, limite:50, paginas:true, linhaCls:function(l){ return "cursor-default! "+tomDoDia(l.data); }, aoClicar:function(l){ p.onAbrir(l._x); }});
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
      var regra = function(ic, tx){ return e("li",{key:ic+tx, className:"flex items-center justify-center gap-1.5 text-[13px] text-white/80"}, e(Ph,{n:ic, s:14, className:"text-[#60A5FA]"}), tx); };
      return e("div",{className:"flex flex-col gap-2"},
        e("ul",{className:"flex flex-col gap-1 rounded-lg bg-black/25 p-2"},
          regra("coins", "Mínimo de "+formatarReais(cfg.minimo)+" por link"), regra("stack", "Parcela mínima de "+formatarReais(cfg.parcelaMinima)),
          textoFaixas(cfg).map(function(f){ return regra("list-numbers", f[0]+": "+f[1]+" sem juros"); }),
          regra("timer", "Validade de "+cfg.validadeHoras+" h (a revendedora é avisada de "+(cfg.avisoHoras || 12)+" h)"), regra("repeat", "Até "+cfg.tentativasDia+" tentativas por dia"), regra("calendar-check", "Vale para o acerto o link emitido e pago até o dia anterior")),
        e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[13px] text-white/85"}, e("b",null, "Link: "), m ? nomeMeio(m) : "Sem link vinculado"),
        t && e("p",{className:"rounded-lg bg-[#3B82F6]/15 px-2 py-1.5 text-[13px] text-white/85"}, "Taxa estimada "+formatarReais(t.taxaValor+t.antecipacaoValor)+" · líquido "+formatarReais(t.liquido)));
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
