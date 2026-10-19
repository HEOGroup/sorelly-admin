// Sorelly Admin · montagem — pages/link-pagamento/Solicitacoes.js
// Aba Solicitações: quadro Kanban (solicitado → link gerado → pago → comprovante enviado), faixa de indicadores e "Nova solicitação".
// O quadro mostra só o que está em andamento; comprovantes enviados, expirados e cancelados aparecem por 3 dias e depois ficam só no Histórico (aba própria, com filtros e paginação).
// Regras (mínimo, parcela mínima, 6x, 12 h, 3 tentativas, dia do acerto) ficam em domain/link-pagamento.js (validarSolicitacao); aqui só desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BarraFiltros, Faixa, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { CANAIS, COR_STATUS, EMISSORES, ROTULO_STATUS, agoraSP, calcularTaxa, expirados, formatarDia, formatarDataHora, BANDEIRAS, formatarReais, hojeSP, indicadoresLp, listaSolicitacoes, somaDias, meioDe, meioSugerido, minutosRestantes, nomeMeio,
  proximaEtapa, proximosStatus, parcelasPermitidas, repDaRevendedora, textoFaixas, textoRestante, validarSolicitacao } from "@/apps/montagem/domain/link-pagamento";
import { Bt, BtMini, Busca, Editor, Ind, Sel, Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var FINAIS = {comprovante:1, expirado:1, cancelado:1, recusado:1};
var DIAS_NO_QUADRO = 3;   // finais recentes ainda aparecem no quadro por alguns dias
var ANDAMENTO = {solicitado:1, gerado:1, pago:1};
var noQuadro = function(x, desde){ return ANDAMENTO[x.status] || (FINAIS[x.status] && String(x.comprovanteEm || x.pagoEm || x.geradoEm || x.criadoEm || "").slice(0,10)>=desde); };
// cor do selo de tempo: mais de 2 h verde, mais de 30 min âmbar, menos vermelho
var corRestante = function(min){ return min>120 ? "#4ADE80" : min>30 ? "#FBBF24" : "#EF4444"; };

function Cartao(p){
  var x = p.x, m = meioDe(p.s, x.meioId), min = minutosRestantes(x, p.agora), n = x.parcelas || 1, cor = COR_STATUS[x.status];
  return e("div",{className:"flex flex-col items-center gap-1 text-center"},
    e("b",{className:"break-words text-[13px] leading-tight"}, x.revendedora),
    e("b",{className:MONO+" text-[16px] leading-none", style:{color:cor}}, formatarReais(x.valor)+" · "+n+"x"),
    e("span",{className:"break-words text-[11.5px] leading-tight text-white/70"}, (x.representante || "Sem representante")),
    e("span",{className:"text-[11px] leading-tight text-white/55"}, nomeMeio(m)),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1"},
      e("span",{className:"rounded px-1.5 text-[10.5px] font-bold leading-5", style:{background:(x.canal==="whatsapp" ? "#4ADE80" : "#60A5FA")+"26", color:x.canal==="whatsapp" ? "#4ADE80" : "#60A5FA"}}, x.canal==="whatsapp" ? "WhatsApp" : "App"),
      x.status==="gerado" && min!=null && e("span",{title:"Validade do link", className:MONO+" rounded px-1.5 text-[10.5px] font-bold leading-5", style:{background:corRestante(min)+"26", color:corRestante(min)}}, textoRestante(min)),
      x.dataAcerto && e("span",{title:"Data do acerto", className:"rounded bg-[#F3D98B]/15 px-1.5 text-[10.5px] font-bold leading-5 text-[#F3D98B]"}, "Acerto "+formatarDia(x.dataAcerto).slice(0,5)),
      x.tentativa>1 && e("span",{className:"rounded bg-white/10 px-1.5 text-[10.5px] leading-5 text-white/65"}, x.tentativa+"ª tentativa")),
    x.motivo && e("span",{className:"break-words text-[10.5px] text-white/55"}, x.motivo));
}

// Detalhe da solicitação (clicar no cartão): dados e andamento já preenchidos à esquerda, campos editáveis no meio, ações à direita (passar para a próxima etapa, cancelar)
function Detalhe(p){
  var L = p.L, s = L.s, lp = L.lp, x = lp.solicitacoes.find(function(y){ return y.id===p.id; }); if(!x) return null;
  var m = meioDe(s, x.meioId), prox = proximaEtapa(x), n = x.parcelas || 1, t = m ? calcularTaxa(m, x.valor, n, m.antecipacao.ativa, hojeSP()) : null, final = !ANDAMENTO[x.status];
  var linha = function(rot, val){ return e("div",{key:rot, className:"flex items-baseline justify-between gap-3 border-b border-white/10 py-1 text-[12.5px]"}, e("span",{className:"text-white/60"}, rot), e("b",{className:"text-right"}, val || "—")); };
  var dados = e("div",{className:"flex flex-col"},
    e("div",{className:"mb-2 flex flex-wrap items-center justify-center gap-2"}, e(Selo,{cor:COR_STATUS[x.status]}, ROTULO_STATUS[x.status]), e("b",{className:MONO+" text-[18px]", style:{color:COR_STATUS[x.status]}}, formatarReais(x.valor))),
    linha("Revendedora", x.revendedora), x.cliente && linha("Cliente (controle da revendedora)", x.cliente), linha("Parcelas", n+"x de "+formatarReais(Math.round(x.valor/n*100)/100)), linha("Canal", x.canal==="whatsapp" ? "WhatsApp" : "Aplicativo"),
    linha("Quem emite", x.emissor==="representante" ? "Representante" : "Atendimento"), linha("Criada em", formatarDataHora(x.criadoEm)), linha("Link gerado", formatarDataHora(x.geradoEm)),
    linha("Validade até", formatarDataHora(x.expiraEm)), linha("Pago em", formatarDataHora(x.pagoEm)), linha("Comprovante", formatarDataHora(x.comprovanteEm)),
    t && linha("Taxa estimada", formatarReais(t.taxaValor+t.antecipacaoValor)), t && linha("Líquido", formatarReais(t.liquido)),
    x.autorizacao && linha("Autorização", x.autorizacao), x.acertoId && linha("Descontado no acerto", formatarDataHora(x.usadoEm)+(x.excedente>0 ? " · sobrou "+formatarReais(x.excedente) : "")), x.motivo && linha("Motivo", x.motivo),
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
    !final && e(Bt,{key:"canc", tipo:"perigo", ic:"prohibit", onClick:function(){ p.fechar(); p.onCancelar(x); }}, "Cancelar ou recusar")];
  return e(Editor,{t:x.revendedora, sub:"Solicitação de link · "+ROTULO_STATUS[x.status], dados:dados, tDados:"Andamento", campos:campos, nc:1, titulos:["Editar"], icSalvar:"floppy-disk", salvarRot:"Salvar alterações", fechar:p.fechar, extras:extras,
    ini:{representante:x.representante||"", meioId:x.meioId||"", dataAcerto:x.dataAcerto||"", linkUrl:x.linkUrl||"", bandeira:x.bandeira||"", observacao:x.observacao||""},
    onSalvar:function(v){ return L.exec("sol_editar", Object.assign({id:x.id}, v)); }});
}

function AbaLpSolicitacoes(p){
  var L = useLp(), s = L.s, lp = L.lp, st = useState({busca:"", canal:"", meioId:""}), f = st[0], md = useState(null), modal = md[0], mo = useState("quadro"), modo = mo[0], tk = useState(0), tick = tk[1];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  // expira os links vencidos e atualiza os selos de tempo a cada minuto
  useEffect(function(){ var f1 = function(){ if(expirados(L.lp).length) L.exec("expirar"); tick(function(n){ return n+1; }); }; f1(); var t = setInterval(f1, 60000); return function(){ clearInterval(t); }; }, [lp.solicitacoes.length]);
  var agora = agoraSP(), ind = indicadoresLp(s), desde = somaDias(hojeSP(), -DIAS_NO_QUADRO);
  var lista = useMemo(function(){ return listaSolicitacoes({lp:{solicitacoes:lp.solicitacoes.filter(function(x){ return noQuadro(x, desde); })}}, f); }, [lp.solicitacoes, f, desde]);
  var mover = function(x, de, para){
    if(para==="cancelado"){ md[1]({tipo:"motivo", id:x.id}); return; }
    L.exec("sol_mover", {id:x.id, para:para});
  };
  var itens = function(k){ return lista.filter(function(x){ return k==="cancelado" ? (x.status==="cancelado" || x.status==="recusado") : x.status===k; }).map(function(x){ return Object.assign({}, x, {arrastavel:!FINAIS[x.status]}); }); };
  var colunas = ["solicitado", "gerado", "pago", "comprovante", "expirado", "cancelado"].filter(function(k){ return ANDAMENTO[k] || lista.some(function(x){ return k==="cancelado" ? (x.status==="cancelado" || x.status==="recusado") : x.status===k; }) || k==="comprovante"; }).map(function(k){
    return {k:k, titulo:k==="cancelado" ? "Cancelado ou recusado" : ROTULO_STATUS[k], cor:COR_STATUS[k], itens:itens(k),
      aceita:function(it){ var t = proximosStatus(it); return k==="cancelado" ? t.indexOf("cancelado")>=0 : t.indexOf(k)>=0; }}; });
  var meiosLink = lp.meios.filter(function(m){ return m.tipo==="LINK"; });
  var ativo = !!(f.busca || f.canal || f.meioId);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:6},
      e(Ind,{t:"Solicitações do mês", v:ind.total, cor:"total", titulo:"Todas as solicitações do mês", onClick:function(){ st[1]({busca:"", canal:"", meioId:""}); }, on:!ativo}),
      e(Ind,{t:"Pelo aplicativo", v:ind.porCanal.app, cor:"info", onClick:function(){ set("canal", f.canal==="app" ? "" : "app"); }, on:f.canal==="app"}),
      e(Ind,{t:"Pelo WhatsApp", v:ind.porCanal.whatsapp, cor:"ok", onClick:function(){ set("canal", f.canal==="whatsapp" ? "" : "whatsapp"); }, on:f.canal==="whatsapp"}),
      e(Ind,{t:"Em aberto", v:ind.abertas, cor:"alerta", titulo:"Solicitados e links gerados"}),
      e(Ind,{t:"Pago no mês", v:formatarReais(ind.pagoMes), cor:"ok", sub:ind.qtdPagosMes+" links"}),
      e(Ind,{t:"Comprovantes pendentes", v:ind.comprovantesPendentes, cor:ind.comprovantesPendentes ? "ruim" : "neutro", titulo:"Abrir a aba Comprovantes", onClick:function(){ p.onIr("comprovantes"); }})),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ st[1]({busca:"", canal:"", meioId:""}); }},
      e(Busca,{v:f.busca, set:function(v){ set("busca", v); }, ph:"Buscar revendedora ou representante"}),
      e(Sel,{v:f.canal, set:function(v){ set("canal", v); }, rot:"Canal", todos:"Todos os canais", opcoes:CANAIS}),
      e(Sel,{v:f.meioId, set:function(v){ set("meioId", v); }, rot:"Link", todos:"Todos os links", opcoes:meiosLink.map(function(m){ return [m.id, nomeMeio(m)]; })}),
      e("span",{className:"text-[12.5px] font-bold text-white/70"}, lista.length+(lista.length===1 ? " resultado" : " resultados")),
      e("div",{className:"inline-flex rounded-lg bg-white/10 p-0.5"},
        [["quadro","Quadro"],["planilha","Planilha"]].map(function(o){ return e("button",{key:o[0], type:"button", onClick:function(){ mo[1](o[0]); }, className:"h-8 rounded-md px-3 text-[12.5px] font-bold "+(modo===o[0] ? "bg-white/25 text-white" : "text-white/70 hover:bg-white/10")}, o[1]); })),
      e(Bt,{ic:"clock-counter-clockwise", titulo:"Registros que já terminaram", onClick:function(){ p.onIr("historico"); }}, "Histórico"),
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ md[1]({tipo:"nova"}); }}, "Nova solicitação")),
    modo==="planilha" ? e(Planilha,{lista:lista, s:s, onMover:mover, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); }}) : e(Kanban,{colunas:colunas, semMover:true, onAbrir:function(x){ md[1]({tipo:"detalhe", id:x.id}); }, unidade:["solicitação", "solicitações"], vazio:"Nenhuma solicitação nesta etapa.", onMover:mover, card:function(x){ return e(Cartao,{x:x, s:s, agora:agora, onMover:mover}); }}),
    modal && modal.tipo==="nova" && e(NovaSolicitacao,{L:L, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="detalhe" && e(Detalhe,{L:L, id:modal.id, onMover:mover, onCancelar:function(x){ md[1]({tipo:"motivo", id:x.id}); }, fechar:function(){ md[1](null); }}),
    modal && modal.tipo==="motivo" && e(Motivo,{L:L, id:modal.id, fechar:function(){ md[1](null); }}));
}

// Modo planilha: as mesmas solicitações do quadro, em linhas compactas, com a ação de concluir a etapa
function Planilha(p){
  var cols = ["Data", "Revendedora", "Representante", "Link", "Valor", "Parcelas", "Canal", "Situação", "Validade", "Acerto", ""];
  var agora = agoraSP();
  if(!p.lista.length) return e("p",{className:"py-6 text-center text-[13px] text-white/60"}, "Nenhuma solicitação para os filtros escolhidos.");
  return e("div",{className:"overflow-x-auto rounded-xl ring-1 ring-white/10 p-2"},
    e(Tab,{cols:cols}, p.lista.map(function(x){
      var m = meioDe(p.s, x.meioId), prox = proximaEtapa(x), min = minutosRestantes(x, agora);
      return e("tr",{key:x.id, className:LINHA+" cursor-pointer", onClick:function(){ p.onAbrir(x); }},
        e(Td,null, formatarDia(x.criadoEm)), e(Td,{forte:true}, x.revendedora), e(Td,null, x.representante || "—"), e(Td,null, nomeMeio(m)),
        e(Td,{dinheiro:true}, formatarReais(x.valor)), e(Td,{dinheiro:true}, (x.parcelas || 1)+"x"), e(Td,null, x.canal==="whatsapp" ? "WhatsApp" : "App"),
        e(Td,null, e(Selo,{cor:COR_STATUS[x.status]}, ROTULO_STATUS[x.status])),
        e(Td,null, x.status==="gerado" && min!=null ? e("span",{style:{color:corRestante(min)}}, textoRestante(min)) : "—"),
        e(Td,null, formatarDia(x.dataAcerto) || "—"),
        e(Td,null, prox ? e(BtMini,{forte:true, onClick:function(ev){ ev.stopPropagation(); p.onMover(x, x.status, prox); }}, "Concluir etapa ›") : ""));
    })));
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
          regra("timer", "Validade de "+cfg.validadeHoras+" h"), regra("repeat", "Até "+cfg.tentativasDia+" tentativas por dia"), regra("calendar-check", "Vale para o acerto o link emitido e pago até o dia anterior")),
        e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[12px] text-white/85"}, e("b",null, "Link: "), m ? nomeMeio(m) : "Sem link vinculado"),
        t && e("p",{className:"rounded-lg bg-[#3B82F6]/15 px-2 py-1.5 text-[12px] text-white/85"}, "Taxa estimada "+formatarReais(t.taxaValor+t.antecipacaoValor)+" · líquido "+formatarReais(t.liquido)));
    }});
}

// Motivo de cancelamento ou recusa (a recusa só vale para o que ainda está em "Solicitado")
function Motivo(p){
  var x = p.L.lp.solicitacoes.find(function(y){ return y.id===p.id; }); if(!x) return null;
  var ops = [["cancelado", "Cancelar"]].concat(x.status==="solicitado" ? [["recusado", "Recusar"]] : []);
  return e(Editor,{t:"Cancelar ou recusar solicitação", sub:x.revendedora+" · "+formatarReais(x.valor), nc:1, icSalvar:"check", salvarRot:"Confirmar", fechar:p.fechar,
    campos:[{k:"para", rot:"Ação", tipo:"botoes", ops:ops}, {k:"nota", rot:"Motivo", tipo:"area", obrig:true, ph:"Informe o motivo"}], ini:{para:"cancelado", nota:""},
    onSalvar:function(v){ return p.L.exec("sol_mover", {id:p.id, para:v.para, nota:v.nota}); }});
}
export { AbaLpSolicitacoes, NovaSolicitacao, Motivo };
