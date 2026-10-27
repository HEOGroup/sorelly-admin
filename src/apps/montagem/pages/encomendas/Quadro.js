// Sorelly Admin · montagem — pages/encomendas/Quadro.js
// Encomendas e reposições → Quadro de pedidos: indicadores clicáveis, filtros numa barra, KANBAN (solicitado → em análise → aprovado → separando → entrega ou retirada agendada → concluído, mais recusado/cancelado),
// "Novo pedido" (janela em colunas, com o direito calculado e a recusa formal), detalhe do pedido (histórico, foto do local, agendamento) e cadastro simples das revendedoras.
// Regras (faixas, expositor, bloqueio) ficam em domain/encomendas.js (config editável); aqui só desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BarraFiltros, Dinheiro, Faixa, Janela, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { CANAIS, COR_STATUS, COR_TIPO, FINAIS, FORMAS, ICONE_TIPO, ROTULO_CANAL, ROTULO_FORMA, ROTULO_STATUS, ROTULO_TIPO, STATUS, TIPOS, acessoReposicao, agoraSP, bloqueadaNaData, faltaComprovante, formatarDataHora, formatarDia, formatarReais, hojeSP,
  indicadoresEr, listaPedidos, minutosNaEtapa, proximaEtapa, proximosStatus, reposicoesDoMes, representantesEr, revDe, textoTempo, validarPedido } from "@/apps/montagem/domain/encomendas";
import { Bt, BtMini, Escolha, Painel, TURQ, copiar, useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Busca, Campo, Ind, Sel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { qtdMes, valorMaximo } from "@/apps/montagem/domain/encomendas";
import { baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { minutosDe } from "@/apps/montagem/domain/encomendas";
import { e, useState } from "@/shared/react";

var CAMPO = INPUT+" w-full text-center";

// Janela "Novo pedido": tipo, revendedora, representante, média dos 3 meses, valor; mostra o direito calculado e a mensagem formal de recusa.
function NovoPedido(p){
  var E = p.E, s = E.s, er = E.er, cfg = E.cfg, agora = agoraSP();
  var st = useState({tipo:"reposicao", revendedoraId:"", revendedora:"", representante:"", media3m:"", maiorVenda:"", valor:0, descricao:"", observacao:"", fotoLocal:"", forma:"", canal:"", dataAgendada:""}), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var escolhe = function(id){ var r = revDe(er, id); st[1](function(o){ return Object.assign({}, o, r ? {revendedoraId:id, revendedora:r.nome, representante:r.representante || o.representante, media3m:r.media3m, maiorVenda:r.maiorVenda} : {revendedoraId:""}); }); };
  var t = v.tipo, mes = hojeSP().slice(0, 7), nome = String(v.revendedora||"").trim();
  var erro = validarPedido(s, v, agora), usadas = nome ? reposicoesDoMes(er, nome, mes) : 0;
  var rev = nome ? er.revendedoras.find(function(r){ return r.nome.trim().toLowerCase()===nome.toLowerCase(); }) : null;
  var ac = t==="reposicao" ? acessoReposicao(cfg, rev, v.media3m) : null, taxaRev = t==="reposicao" && v.canal==="entrega" ? cfg.reposicao.taxa : 0, taxaRp = t==="reposicao" && v.canal==="representante" ? cfg.reposicao.taxaRepresentante : 0;
  var mxv = ac ? valorMaximo(cfg, v.media3m, ac.top50) : 0, lim = ac ? qtdMes(cfg, v.media3m, ac.top50) : 0, EQUIPE = ["Agatha", "Elen", "Eduarda Gabriela"];
  var criar = function(registrarRecusa){ if(E.exec("ped_criar", {pedido:Object.assign({}, v, {responsavel:v.responsavel || (EQUIPE.indexOf(E.por)>=0 ? E.por : "Agatha")}), registrarRecusa:!!registrarRecusa})) p.fechar(); };
  var texto = function(){ return erro ? "Prezada revendedora, informamos que não foi possível atender à sua solicitação. "+erro.msg : ""; };
  var c1 = [e(Campo,{key:"t", rot:"Tipo do pedido"}, e(Escolha,{v:t, set:function(x){ set("tipo", x); }, ops:TIPOS.filter(function(t){ return t[0]!=="expositor"; })})),
    er.revendedoras.length>0 && e(Campo,{key:"rc", rot:"Revendedora cadastrada", dica:"Opcional: preenche os dados do cadastro."}, e("select",{value:v.revendedoraId, onChange:function(ev){ if(ev.target.value) escolhe(ev.target.value); else set("revendedoraId", ""); }, className:CAMPO+" cursor-pointer"},
      [e("option",{key:"", value:""}, "Selecione")].concat(er.revendedoras.map(function(r){ return e("option",{key:r.id, value:r.id}, r.nome); })))),
    e(Campo,{key:"rv", rot:"Revendedora *"}, e("input",{type:"text", value:v.revendedora, placeholder:"Nome da revendedora", onChange:function(ev){ st[1](function(o){ return Object.assign({}, o, {revendedora:ev.target.value, revendedoraId:""}); }); }, className:CAMPO})),
    t==="reposicao" && e(Campo,{key:"cn", rot:"Como a revendedora recebe *"}, ac && ac.tem ? e(Escolha,{v:v.canal, set:function(x){ set("canal", x); }, ops:CANAIS.filter(function(c){ return ac.canais.indexOf(c[0])>=0; })}) : e("p",{className:"text-[12px] text-white/65"}, "Informe a revendedora (Top 50) ou a média de vendas.")),
    e(Campo,{key:"rs", rot:"Responsável"}, e("select",{value:v.responsavel || (EQUIPE.indexOf(E.por)>=0 ? E.por : ""), onChange:function(ev){ set("responsavel", ev.target.value); }, className:CAMPO+" cursor-pointer"},
      EQUIPE.map(function(n){ return e("option",{key:n, value:n}, n); }))),
    e(Campo,{key:"rp", rot:"Representante"+(v.canal==="representante" ? " *" : "")}, e("input",{type:"text", value:v.representante, placeholder:"Nome da representante", onChange:function(ev){ set("representante", ev.target.value); }, className:CAMPO}))];
  var c2 = [(t==="reposicao" || t==="expositor") && e(Campo,{key:"m", rot:"Média de vendas", dica:"Tirada pela equipe com a revendedora; vira automática quando as vendas forem exportadas."}, e(Dinheiro,{value:v.media3m==="" ? 0 : v.media3m, label:"Média dos 3 meses", onChange:function(x){ set("media3m", x); }})),
    t==="expositor" && e(Campo,{key:"mv", rot:"Maior venda"}, e(Dinheiro,{value:v.maiorVenda==="" ? 0 : v.maiorVenda, label:"Maior venda", onChange:function(x){ set("maiorVenda", x); }})),
    t!=="expositor" && e(Campo,{key:"vl", rot:t==="encomenda" ? "Valor estimado" : "Valor da reposição"}, e(Dinheiro,{value:v.valor, label:"Valor", onChange:function(x){ set("valor", x); }})),
    t==="encomenda" && e(Campo,{key:"d", rot:"Descrição *"}, e("textarea",{value:v.descricao, rows:2, placeholder:"Peça ou produto encomendado", onChange:function(ev){ set("descricao", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"})),
    t==="expositor" && e(Campo,{key:"f", rot:"Foto do local", dica:"Referência da foto enviada (obrigatória para aprovar)."}, e("input",{type:"text", value:v.fotoLocal, placeholder:"Ex.: foto enviada no WhatsApp em 16/10", onChange:function(ev){ set("fotoLocal", ev.target.value); }, className:CAMPO})),
    e(Campo,{key:"o", rot:"Observação"}, e("textarea",{value:v.observacao, rows:2, onChange:function(ev){ set("observacao", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}))];
  var c3 = e(Painel,{key:"c3", t:"Direito e ações", ic:"gear"},
    rev && bloqueadaNaData(rev.bloqueadaAte) && e(Selo,{cor:"#EF4444", ic:"lock-key"}, "Bloqueada até "+formatarDia(rev.bloqueadaAte)),
    ac && e("div",{className:"grid grid-cols-2 gap-1.5"},
      e(Ind,{t:"Top 50", v:ac.top50 ? "Sim" : "Não", cor:ac.top50 ? "info" : "neutro"}), e(Ind,{t:"Valor máximo", v:mxv>0 ? formatarReais(mxv) : "—", cor:mxv>0 ? "total" : "neutro"}),
      e(Ind,{t:"Taxa da revendedora", v:formatarReais(taxaRev), cor:taxaRev ? "alerta" : "neutro"}), e(Ind,{t:"Pago à representante", v:formatarReais(taxaRp), cor:taxaRp ? "info" : "neutro"})),
    ac && ac.tem && e("p",{className:"text-[12px] text-white/70"}, usadas+" de "+lim+(lim===1 ? " reposição" : " reposições")+" no mês"),
    taxaRev>0 && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12.5px] font-bold text-[#FBBF24]"}, "Taxa de "+formatarReais(taxaRev)+" paga antes por Pix, com comprovante: sem ele a reposição não é liberada."),
    t==="reposicao" && !ac.tem && (v.media3m!=="" || rev) && e("p",{className:"text-[12px] text-white/65"}, ac.motivo),
    erro ? e("p",{role:"alert", className:"rounded-lg px-2 py-1.5 text-[12.5px] font-bold "+(erro.formal ? "bg-[#EF4444]/20 text-[#F87171]" : "bg-[#FBBF24]/15 text-[#FBBF24]")}, (erro.formal ? "Recusa formal: " : "")+erro.msg)
      : e("p",{className:"rounded-lg bg-[#22C55E]/15 px-2 py-1.5 text-[12.5px] font-bold text-[#4ADE80]"}, "Pedido dentro das regras."),
    e(Bt,{tipo:"forte", ic:"paper-plane-tilt", disabled:!!erro, onClick:function(){ criar(false); }}, "Registrar pedido"),
    erro && erro.formal && e(Bt,{tipo:"perigo", ic:"prohibit", onClick:function(){ criar(true); }, titulo:"Grava o pedido já como Recusado, com o motivo"}, "Registrar recusa"),
    erro && erro.formal && e(Bt,{ic:"copy", onClick:function(){ copiar(texto()); }}, "Copiar mensagem de recusa"),
    e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"));
  return e(Janela,{t:"Novo pedido", sub:"Reposição ou encomenda: o direito é calculado pelas regras do setor.", fechar:p.fechar,
    colunas:[e(Painel,{key:"c1", t:"Pedido", ic:"clipboard-text", estado:"atual"}, c1), e(Painel,{key:"c2", t:"Valores", ic:"coins"}, c2), c3]});
}

// Motivo de recusa ou cancelamento
function Motivo(p){
  var x = p.E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState({para:"cancelado", nota:""}), v = st[0];
  if(!x) return null;
  var ops = [["cancelado", "Cancelar"]].concat(proximosStatus(x).indexOf("recusado")>=0 ? [["recusado", "Recusar"]] : []);
  var ok = function(){ if(p.E.exec("ped_mover", {id:p.id, para:v.para, nota:v.nota})) p.fechar(); };
  return e(Janela,{t:"Recusar ou cancelar pedido", sub:x.revendedora+" · "+ROTULO_TIPO[x.tipo], fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Motivo", ic:"note-pencil", estado:"atual"}, e(Campo,{rot:"Ação"}, e(Escolha,{v:v.para, set:function(y){ st[1](Object.assign({}, v, {para:y})); }, ops:ops})),
        e(Campo,{rot:"Motivo *"}, e("textarea",{value:v.nota, rows:3, placeholder:"Informe o motivo", onChange:function(ev){ st[1](Object.assign({}, v, {nota:ev.target.value})); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}))),
      e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"check", disabled:!v.nota.trim(), onClick:ok}, "Confirmar"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// Agendar: data e hora (entrega pelo João ou ida na empresa)
function Agendar(p){
  var x = p.E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState({data:x ? x.dataAgendada : "", hora:x ? x.hora : ""}), v = st[0];
  if(!x) return null;
  var ok = function(){ var r = p.mover ? p.E.exec("ped_mover", {id:p.id, para:"agendado", data:v.data, hora:v.hora}) : p.E.exec("ped_agendar", {id:p.id, data:v.data, hora:v.hora}); if(r) p.fechar(); };
  return e(Janela,{t:x.canal==="empresa" ? "Agendar ida na empresa" : "Agendar entrega", sub:x.revendedora+" · "+ROTULO_TIPO[x.tipo], fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Agendamento", ic:"calendar-check", estado:"atual"},
        e(Campo,{rot:"Data *"}, e("input",{type:"date", value:v.data, min:hojeSP(), onChange:function(ev){ st[1](Object.assign({}, v, {data:ev.target.value})); }, className:CAMPO})),
        e(Campo,{rot:"Hora"}, e("input",{type:"time", value:v.hora, onChange:function(ev){ st[1](Object.assign({}, v, {hora:ev.target.value})); }, className:CAMPO})),
        x.canal==="empresa" && e(Selo,{cor:"#94A3B8", ic:"clock"}, "Tempo máximo de "+p.E.cfg.reposicao.minutosEscolha+" minutos")),
      e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"check", disabled:!v.data, onClick:ok}, p.mover ? "Agendar e avançar" : "Salvar agendamento"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// Iniciar atendimento (ida na empresa): escolhe quem atende e começa o cronômetro
function Atender(p){
  var x = p.E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState(""), at = st[0];
  if(!x) return null;
  var lista = p.E.cfg.atendentes || [];
  var ok = function(){ if(p.E.exec("ped_mover", {id:p.id, para:"atendimento", atendente:at})) p.fechar(); };
  return e(Janela,{t:"Iniciar atendimento", sub:x.revendedora+" · tempo máximo de "+p.E.cfg.reposicao.minutosEscolha+" minutos", fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Quem atende", ic:"user-circle", estado:"atual"}, e(Escolha,{v:at, set:st[1], ops:lista.map(function(n){ return [n, n]; })})),
      e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"play", disabled:!at, onClick:ok}, "Iniciar cronômetro"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// avançar um pedido de etapa: abre a janela certa quando a etapa pede dados (agenda, atendente, conferência)
function avancarPedido(E, x, ir){
  var prox = proximaEtapa(x); if(!prox) return;
  if(x.status==="conferindo" && !x.conferido){ ir({tipo:"detalhe", id:x.id}); return; }
  if(prox==="agendado") ir({tipo:"agendar", id:x.id, mover:true});
  else if(prox==="atendimento") ir({tipo:"atender", id:x.id});
  else E.exec("ped_mover", {id:x.id, para:prox});
}

// Detalhe do pedido: dados | histórico | ações (foto do local, anotação, agendamento, avaliação do bloqueio)
function Detalhe(p){
  var E = p.E, x = E.er.pedidos.find(function(y){ return y.id===p.id; }), st = useState({foto:"", nota:"", vendas:0, media:0}), v = st[0];
  if(!x) return null;
  var set = function(k, y){ st[1](function(o){ var n = Object.assign({}, o); n[k] = y; return n; }); };
  var lin = function(r, val){ return val || val===0 ? e("div",{key:r, className:"flex flex-col items-center rounded-lg bg-black/25 px-2 py-1"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/65"}, r), e("b",{className:"break-words text-[13px]"}, val)) : null; };
  var dados = e(Painel,{key:"d", t:"Dados do pedido", estado:"feito"},
    e("div",{className:"flex flex-wrap justify-center gap-1"}, e(Selo,{cor:COR_TIPO[x.tipo], ic:ICONE_TIPO[x.tipo]}, ROTULO_TIPO[x.tipo]), e(Selo,{cor:COR_STATUS[x.status]}, ROTULO_STATUS[x.status])),
    lin("Revendedora", x.revendedora), lin("Representante", x.representante), lin("Média dos 3 meses", x.media3m!=null ? formatarReais(x.media3m) : ""), lin("Maior venda", x.maiorVenda!=null ? formatarReais(x.maiorVenda) : ""),
    lin(x.tipo==="encomenda" ? "Valor estimado" : "Valor", x.valor>0 ? formatarReais(x.valor) : ""), lin("Descrição", x.descricao), lin("Observação", x.observacao),
    lin("Como recebe", x.canal ? ROTULO_CANAL[x.canal] : x.forma ? ROTULO_FORMA[x.forma] : ""), lin("Responsável", x.responsavel), lin("Valor máximo", x.valorMax>0 ? formatarReais(x.valorMax) : ""), lin("Conferido", x.conferido ? x.conferido.por+" · "+formatarDataHora(x.conferido.em) : ""), lin("Data agendada", formatarDia(x.dataAgendada)+(x.hora ? " às "+x.hora : "")), lin("Atendente", x.atendente), lin("Tempo de atendimento", x.atendInicio ? (x.atendFim ? Math.max(0, Math.round((minutosDe(x.atendFim)-minutosDe(x.atendInicio)))) : "em andamento")+(x.atendFim ? " min" : "") : ""), lin("Taxa da revendedora", x.taxa>0 ? formatarReais(x.taxa)+(x.comprovante ? " (paga)" : " (falta comprovante)") : ""), lin("Pago à representante", x.taxaRep>0 ? formatarReais(x.taxaRep) : ""), lin("Foto do local", x.fotoLocal),
    lin("Motivo", x.motivo), lin("Aberto em", formatarDataHora(x.criadoEm)+" · "+x.criadoPor),
    x.bloqueio && lin("Bloqueio", x.bloqueio.bloqueia ? "Até "+formatarDia(x.bloqueio.ate)+" ("+x.bloqueio.pct.toLocaleString("pt-BR")+"%)" : "Sem bloqueio ("+x.bloqueio.pct.toLocaleString("pt-BR")+"%)"));
  var historico = e(Painel,{key:"h", t:"Histórico", ic:"clock"}, e("ol",{className:"flex flex-col gap-1.5"}, x.historico.slice().reverse().map(function(h, i){
    return e("li",{key:i, className:"rounded-lg bg-black/25 px-2 py-1 text-[12px]"}, e("b",null, formatarDataHora(h.em)+" · "+h.por), e("div",{className:"text-white/75"}, (h.para && h.de!==h.para ? ROTULO_STATUS[h.para]+(h.nota ? " · " : "") : "")+(h.nota || ""))); })));
  var fim = FINAIS[x.status];
  var acoes = e(Painel,{key:"a", t:"Ações", ic:"gear", estado:"atual"},
    x.tipo==="expositor" && !fim && e(Campo,{rot:"Foto do local"}, e("input",{type:"text", value:v.foto, placeholder:"Referência da foto", onChange:function(ev){ set("foto", ev.target.value); }, className:CAMPO}),
      e(BtMini,{ic:"camera", disabled:!v.foto.trim(), onClick:function(){ if(E.exec("ped_foto", {id:x.id, foto:v.foto})) set("foto", ""); }}, "Registrar foto")),
    x.tipo==="reposicao" && x.taxa>0 && e("div",{className:"flex flex-col items-center gap-1.5 rounded-lg bg-black/25 p-2"},
      e("b",{className:"text-[12px] uppercase tracking-wide text-white/75"}, "Taxa de "+formatarReais(x.taxa)),
      e("p",{className:"text-[12.5px]"}, "Pix para ", e("b",null, E.cfg.pix.recebedor || "o recebedor"), (E.cfg.pix.titular ? " (conta de "+E.cfg.pix.titular+")" : "")+": ", e("b",{className:"break-all"}, (E.cfg.pix.tipo ? E.cfg.pix.tipo+" " : "")+(E.cfg.pix.chave || "chave não cadastrada"))),
      e(BtMini,{ic:"copy", disabled:!E.cfg.pix.chave, onClick:function(){ copiar(E.cfg.pix.chave); }}, "Copiar chave"),
      x.comprovante ? e("div",{className:"flex flex-col items-center gap-1"}, e(Selo,{cor:"#4ADE80", ic:"check-circle"}, "Comprovante anexado"), e("span",{className:"break-all text-[11.5px] text-white/65"}, x.comprovante.nome+" · "+formatarDataHora(x.comprovante.em)),
          e(BtMini,{ic:"download-simple", onClick:function(){ baixarArquivo(x.comprovante.arquivoId, x.comprovante.nome || "comprovante"); }}, "Abrir comprovante"))
        : e(Selo,{cor:"#EF4444", ic:"warning"}, "Sem comprovante: não libera"),
      !fim && e("label",{className:"cursor-pointer rounded-lg bg-muted/50 px-3 py-1.5 text-center text-[12.5px] font-bold hover:bg-white/15"}, x.comprovante ? "Trocar comprovante" : "Anexar comprovante",
        e("input",{type:"file", accept:"image/*,application/pdf", className:"hidden", onChange:function(ev){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return; var id = "er"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36);
          salvarArquivo(id, arq).then(function(){ E.exec("ped_comprovante", {id:x.id, arquivoId:id, nome:arq.name}); }); ev.target.value = ""; }}))),
    !fim && e(Bt,{ic:"calendar-check", onClick:function(){ p.ir({tipo:"agendar", id:x.id}); }}, x.dataAgendada ? "Reagendar" : "Agendar"),
    x.status==="conferindo" && !fim && e("div",{className:"flex flex-col items-center gap-1.5 rounded-lg bg-black/25 p-2"},
      e("b",{className:"text-[12px] uppercase tracking-wide text-white/75"}, x.conferido ? "Média conferida" : "Conferir média e valor"),
      !x.conferido && e(Campo,{rot:"Média de vendas"}, e(Dinheiro,{value:v.media || (x.media3m || 0), label:"Média", onChange:function(y){ set("media", y); }})),
      !x.conferido && e(BtMini,{ic:"check", onClick:function(){ E.exec("ped_conferir", {id:x.id, media:v.media || x.media3m}); }}, "Confirmar média e valor"),
      x.conferido && e(Selo,{cor:"#4ADE80", ic:"check-circle"}, "Conferido por "+x.conferido.por)),
    !fim && proximaEtapa(x) && e(Bt,{tipo:"forte", ic:"arrow-right", disabled:(x.status==="conferindo" && !x.conferido) || (x.status==="comprovante" && x.taxa>0 && !x.comprovante), onClick:function(){ avancarPedido(E, x, p.ir); }}, "Concluir etapa ›"),
    x.status==="atendimento" && e(Selo,{cor:"#F472B6", ic:"timer"}, "Atendimento em andamento: "+x.atendente),
    !fim && e(Bt,{tipo:"perigo", ic:"prohibit", onClick:function(){ p.ir({tipo:"motivo", id:x.id}); }}, "Recusar ou cancelar"),
    e(Campo,{rot:"Anotação"}, e("textarea",{value:v.nota, rows:2, onChange:function(ev){ set("nota", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}),
      e(BtMini,{ic:"note-pencil", disabled:!v.nota.trim(), onClick:function(){ if(E.exec("ped_nota", {id:x.id, nota:v.nota})) set("nota", ""); }}, "Registrar anotação")),
    x.tipo==="reposicao" && x.status==="concluido" && e(Campo,{rot:"Vendas depois da reposição", dica:"Abaixo de "+E.cfg.bloqueio.pctMinimo+"% do valor, bloqueia por "+E.cfg.bloqueio.meses+" meses."}, e(Dinheiro,{value:v.vendas, label:"Vendas", onChange:function(y){ set("vendas", y); }}),
      e(BtMini,{ic:"lock-key", onClick:function(){ E.exec("bloqueio_avaliar", {id:x.id, vendas:v.vendas}); }}, "Avaliar bloqueio")),
    e(Bt,{ic:"x", onClick:p.fechar}, "Fechar"));
  return e(Janela,{t:"Pedido de "+ROTULO_TIPO[x.tipo].toLowerCase(), sub:x.revendedora, fechar:p.fechar, colunas:[dados, historico, acoes]});
}

// Cadastro simples das revendedoras (média dos 3 meses digitada; o dado real vem de outro módulo) e situação de bloqueio
function Revendedoras(p){
  var E = p.E, er = E.er, st = useState({id:"", nome:"", representante:"", telefone:"", top50:false, media3m:0, maiorVenda:0}), v = st[0];
  var set = function(k, y){ st[1](function(o){ var n = Object.assign({}, o); n[k] = y; return n; }); };
  var novo = function(){ st[1]({id:"", nome:"", representante:"", telefone:"", top50:false, media3m:0, maiorVenda:0}); };
  var lista = e(Painel,{key:"l", t:"Revendedoras cadastradas", ic:"user-circle", estado:"feito"}, er.revendedoras.length ? e(Tab,{cols:["Revendedora", "Telefone", "Grupo", "Média", "Situação", ""]}, er.revendedoras.slice().sort(function(a, b){ return (b.top50?1:0)-(a.top50?1:0) || a.nome.localeCompare(b.nome); }).map(function(r){ var bl = bloqueadaNaData(r.bloqueadaAte);
      return e("tr",{key:r.id, className:LINHA}, e(Td,{forte:true}, r.nome), e(Td,null, r.telefone || "—"), e(Td,null, r.top50 ? e(Selo,{cor:TURQ, ic:"star"}, "Top 50") : "—"), e(Td,{dinheiro:true}, formatarReais(r.media3m)),
        e(Td,{cor:bl ? "ruim" : "ok"}, bl ? "Bloqueada até "+formatarDia(r.bloqueadaAte) : "Liberada"),
        e(Td,null, e("span",{className:"inline-flex gap-1"}, e(BtMini,{ic:"note-pencil", onClick:function(){ st[1]({id:r.id, nome:r.nome, representante:r.representante, telefone:r.telefone||"", top50:!!r.top50, media3m:r.media3m, maiorVenda:r.maiorVenda}); }}, "Editar"),
          bl && e(BtMini,{ic:"lock-simple", disabled:!E.pode, titulo:E.pode ? "Liberar a revendedora" : "Só a diretoria libera", onClick:function(){ E.exec("bloqueio_remover", {id:r.id}); }}, "Liberar")))); }))
    : e(Vazio,{ic:"user-circle"}, "Nenhuma revendedora cadastrada."));
  var form = e(Painel,{key:"f", t:v.id ? "Editar revendedora" : "Nova revendedora", ic:"plus", estado:"atual"},
    e(Campo,{rot:"Nome *"}, e("input",{type:"text", value:v.nome, onChange:function(ev){ set("nome", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Telefone"}, e("input",{type:"text", value:v.telefone, onChange:function(ev){ set("telefone", ev.target.value); }, className:CAMPO})),
    e(Campo,{rot:"Representante"}, e("input",{type:"text", value:v.representante, onChange:function(ev){ set("representante", ev.target.value); }, className:CAMPO})),
    e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold"}, e("input",{type:"checkbox", checked:!!v.top50, onChange:function(ev){ set("top50", ev.target.checked); }}), "Top 50 (reposição por entrega)"),
    e(Campo,{rot:"Média de vendas dos 3 meses"}, e(Dinheiro,{value:v.media3m, label:"Média", onChange:function(y){ set("media3m", y); }})),
    e(Campo,{rot:"Maior venda"}, e(Dinheiro,{value:v.maiorVenda, label:"Maior venda", onChange:function(y){ set("maiorVenda", y); }})),
    e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:function(){ if(E.exec("rev_salvar", v)) novo(); }}, "Salvar"),
    v.id && e(Bt,{tipo:"perigo", ic:"trash", onClick:function(){ if(E.exec("rev_excluir", {id:v.id})) novo(); }}, "Excluir"),
    v.id && e(Bt,{ic:"plus", onClick:novo}, "Nova"));
  return e(Janela,{t:"Revendedoras", sub:"Top 50 e média de vendas: quem pode pedir reposição, e o bloqueio de 3 meses.", fechar:p.fechar, colunas:[lista, form]});
}
export { NovoPedido, Motivo, Agendar, Atender, Detalhe, Revendedoras, avancarPedido };
