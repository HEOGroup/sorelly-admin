// Sorelly Admin · montagem — pages/indicacoes/ResgatesMoedas.js
// Indicações (setor Cadastro de revendedoras): três CORPOS de aba, sem PageHead (a tela com abas junta).
//   AbaIndResgates     fila de resgates de prêmio em quadro Kanban (solicitado → aprovado → entregue / cancelado)
//   AbaIndRetiradas    agendamentos (faixa de dias) + Retiradas do dia (resumo e CSV)
//   AbaIndRevendedoras ranking, cadastro, crédito manual de moedas, extrato e catálogo de prêmios
// Regras e dados em domain/indicacoes.js (estado s.ind; ações {type:"IND", op, por, ...}). Aqui só o desenho.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, ESTADO, LINHA, Mosaico, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { agoraSP, avisoDeEstorno, avisoDeAtraso, buscaRevendedoraPorId, buscarRevendedoras, contagemPorDia, diferencaDoPremio, estadoDaPaginacao, etapaEmAberto, extratoDe, faixaDeDias, filaPorEtapa, filtrarBrindeMaleta, formatarDataHora, formatarDia, formatarMoedas, formatarReais, formatarTelefone, gerarCsvDoDia, hojeSP, horariosDeRetirada, indicadoresMoedas, indicadoresResgates, linkWhatsapp, motivoFinal, nomeDoArquivoCsv, normalizarCodigosPecas, opcoesDeDia, partirIsoAgendamento, podeConfirmarAgendamento, podeConfirmarEntrega, ranking, resgateDe, resgatesSemHorario, agendamentosDoDia, resumoDoDia, rotuloDoChip, avancarFaixa, saldoDe, somaDias, textoBrindeMaleta, textoDaPaginacao, acoesDaEtapa, ETAPAS_RESGATE, rotuloAba, explicacaoEtapa } from "@/apps/montagem/domain/indicacoes";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Alternar, Avatar, BarraFiltros, Bt, Busca, Chip, Colunas, FiltroData, Janela, Painel, Resumo, Secao, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useState } from "@/shared/react";

// uma cor para o setor (Cadastro de revendedoras); verde, amarelo e vermelho só para estado
var COR_SETOR = "laranja";
var COR_ETAPA = {solicitado:"#F97316", aprovado:"#60A5FA", entregue:"#4ADE80", cancelado:"#94A3B8"};
var COR_NIVEL = {"em-dia":ESTADO.ok, atrasado:ESTADO.alerta, critico:ESTADO.ruim};
var ROTULO_NIVEL = {"em-dia":"Em dia", atrasado:"Atrasado", critico:"Crítico"};
var TIPO_LANC = {indicacao:"Indicação", estorno_indicacao:"Estorno de indicação", resgate:"Resgate", estorno:"Estorno de resgate", credito_manual:"Crédito manual"};

var BTP = "px-2! py-1! text-[12px]!";
function CampoRot(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[12px] font-bold "+(p.className||"")}, p.rot, p.children); }
function Entrada(p){ return e("input",{value:p.v==null ? "" : p.v, type:p.type, min:p.min, placeholder:p.ph, inputMode:p.modo, "aria-label":p.rot, className:INPUT+" h-10! w-full text-center "+(p.className||""), onChange:function(ev){ p.on(ev.target.value); }}); }
function Linha(p){ return e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, p.children); }
function Nota(p){ return e("p",{className:"rounded-lg bg-black/25 px-3 py-1.5 text-center text-[12.5px] text-white/80"}, p.children); }
function Alerta(p){ var c = p.cor || ESTADO.alerta; return e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-[13px] font-bold", style:{background:c+"22", color:c, boxShadow:"inset 0 0 0 1px "+c+"66"}}, e(Ph,{n:p.ic||"warning", s:16}), p.children); }
var soDigitos = function(v){ return String(v||"").replace(/\D/g, ""); };

// ───────────── escolher revendedora (busca por nome, e-mail, telefone ou número) ─────────────
function SeletorRev(p){
  var st = useState(""), q = st[0], ind = p.ind, sel = p.valor!=null && p.valor!=="" ? buscaRevendedoraPorId(ind, p.valor) : null;
  var achados = q.trim().length>=2 ? buscarRevendedoras(ind, q).slice(0, 6) : [];
  if(sel) return e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-lg bg-black/30 px-3 py-1.5 ring-1 ring-[#F97316]/50"},
    e("b",{className:"text-[13.5px]"}, sel.nome), e("span",{className:"text-[12px] text-white/70"}, formatarTelefone(sel.telefone)),
    e(Selo,{cor:"#F3D98B", ic:"coins"}, formatarMoedas(saldoDe(ind, sel.id).saldo)),
    e(Bt,{ic:"x", onClick:function(){ p.onPick(null); st[1](""); }, className:BTP}, "Trocar"));
  return e("div",{className:"flex flex-col gap-1.5"},
    e(Entrada,{v:q, on:st[1], rot:"Revendedora", ph:"Nome, telefone ou número da revendedora"}),
    achados.length>0 && e("div",{className:"flex flex-col gap-1"}, achados.map(function(r){
      return e("button",{key:r.id, type:"button", onClick:function(){ p.onPick(r.id); st[1](""); }, className:"flex flex-wrap items-center justify-center gap-x-3 rounded-lg bg-black/30 px-3 py-1.5 text-[13px] ring-1 ring-white/10 hover:ring-[#F97316]/60"}, e("b",null, r.nome), e("span",{className:"text-white/65"}, formatarTelefone(r.telefone)||"Sem telefone"), e("span",{className:MONO+" text-white/65"}, "Nº "+r.id)); })),
    q.trim().length>=2 && !achados.length && e("p",{className:"text-[12.5px] text-white/65"}, "Nenhuma revendedora encontrada."));
}

// ───────────── janelas do pedido de resgate (compartilhadas pelas duas abas) — largas, em colunas ─────────────
// cartão do pedido (coluna da esquerda): quem pediu, prêmio, moedas e situação
function PedidoInfo(p){
  var r = p.r;
  return e(Painel,{t:"Pedido #"+r.id, ic:"gift", estado:"feito"},
    e("div",{className:"flex flex-col items-center gap-1.5"}, e(Avatar,{nome:r.nomeRevendedora, s:40}), e("b",{className:"text-[14px]"}, r.nomeRevendedora),
      e("span",{className:"flex items-center gap-1 text-[13px] font-semibold"}, e(Ph,{n:"gift", s:14}), r.premioTitulo||"Prêmio"),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, e(Selo,{cor:"#F3D98B", ic:"coins"}, formatarMoedas(r.custoMoedas)), r.premioValor>0 && e(Selo,{cor:"#94A3B8"}, formatarReais(r.premioValor)),
        etapaEmAberto(r.etapa) && e(Selo,{cor:COR_NIVEL[r.nivel], ic:"clock"}, r.esperando), r.horarioAgendado && e(Selo,{cor:"#60A5FA", ic:"calendar-blank"}, r.horarioAgendado))),
    p.children);
}
function FormAgendar(p){
  var r = p.r, cfg = p.ind.config, hoje = hojeSP(), ini = partirIsoAgendamento(r.operacao.dataAgendada), opc = opcoesDeDia(cfg, hoje);
  var st1 = useState(ini ? ini.dia : hoje), dia = st1[0], st2 = useState(ini ? ini.horario : ""), hor = st2[0];
  var st3 = useState(!!ini && !opc.some(function(o){ return o.valor===ini.dia; })), outra = st3[0];
  var reag = r.etapa==="aprovado", pode = podeConfirmarAgendamento(dia, hor, cfg, hoje);
  return e(Janela,{t:reag ? "Reagendar retirada" : "Agendar retirada", sub:r.nomeRevendedora+" · "+r.premioTitulo, fechar:p.fechar, tam:"lg", passos:[{t:"Pedido", estado:"feito"}, {t:"Dia", estado:"feito", sub:formatarDia(dia)}, {t:"Horário", estado:hor ? "feito" : "atual", sub:hor||undefined}, {t:"Confirmar", estado:pode ? "atual" : "futuro"}]},
    e(Colunas,{n:3},
      e(PedidoInfo,{r:r}),
      e(Painel,{t:"Dia da retirada", ic:"calendar-blank", estado:"feito"},
        e(CampoRot,{rot:"Dia"}, e("select",{value:outra ? "outra" : dia, "aria-label":"Dia", className:INPUT+" h-10! w-full text-center", onChange:function(ev){ var v = ev.target.value; if(v==="outra"){ st3[1](true); } else { st3[1](false); st1[1](v); } }},
          opc.map(function(o){ return e("option",{key:o.valor, value:o.valor}, o.rotulo); }), e("option",{value:"outra"}, "Outra data…"))),
        outra && e(CampoRot,{rot:"Data da retirada"}, e(Entrada,{type:"date", min:hoje, v:dia, on:function(v){ st1[1](v); }, rot:"Data da retirada"}))),
      e(Painel,{t:"Horário", ic:"clock", estado:hor ? "feito" : "atual"},
        e("div",{className:"grid grid-cols-4 gap-1.5"}, horariosDeRetirada(cfg).map(function(h){ var sel = h===hor;
          return e("button",{key:h, type:"button", onClick:function(){ st2[1](h); }, className:"rounded-lg py-1.5 text-[13px] font-bold "+MONO+" transition "+(sel ? "bg-[#F97316] text-black" : "bg-black/30 ring-1 ring-white/15 hover:bg-white/10")}, h); })),
        e(Linha,null, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"calendar-blank", disabled:!pode, onClick:function(){ p.dispatch({type:"IND", op:"resgate_agendar", id:r.id, dia:dia, horario:hor, por:p.por}); p.fechar(); }}, reag ? "Confirmar novo horário" : "Confirmar agendamento")))));
}
function FormEntregar(p){
  var r = p.r, op = r.operacao;
  var st1 = useState((op.codigosPecas||[]).join(" ")), pecas = st1[0], st2 = useState(op.valorVenda!=null ? op.valorVenda : r.premioValor), valor = st2[0];
  var st3 = useState(op.valorDiferencaBrinde||0), dif = st3[0], st4 = useState(op.responsavelNome||p.por), resp = st4[0], st5 = useState(op.observacao||""), obs = st5[0], st6 = useState(false), conf = st6[0];
  var n = normalizarCodigosPecas(pecas).length, pode = podeConfirmarEntrega({codigosPecas:pecas, valorVenda:valor, revendedoraConfirmou:conf}), df = diferencaDoPremio(valor, r.premioValor), pecasOk = n>0 && !!valor;
  return e(Janela,{t:"Confirmar retirada", sub:r.nomeRevendedora+" · "+r.premioTitulo+" · "+formatarReais(r.premioValor), tam:"xl", fechar:p.fechar, passos:[{t:"Pedido", estado:"feito"}, {t:"Peças e valores", estado:pecasOk ? "feito" : "atual"}, {t:"Conferência", estado:conf ? "feito" : pecasOk ? "atual" : "futuro"}, {t:"Retirada", estado:pode ? "atual" : "futuro"}]},
    e(Colunas,{n:3},
      e(PedidoInfo,{r:r}),
      e(Painel,{t:"Peças e valores", ic:"diamond", estado:pecasOk ? "feito" : "atual"},
        e(CampoRot,{rot:"Códigos das peças retiradas ("+n+")"}, e("textarea",{value:pecas, "aria-label":"Códigos das peças", rows:3, placeholder:"Separe por espaço, vírgula ou linha", className:INPUT+" h-auto! w-full py-2 text-center", onChange:function(ev){ st1[1](ev.target.value); }})),
        e("div",{className:"grid grid-cols-1 gap-2"},
          e(CampoRot,{rot:"Valor em venda das peças"}, e(Dinheiro,{value:valor, label:"Valor em venda", onChange:function(v){ st2[1](v); }})),
          e(CampoRot,{rot:"Diferença paga no brinde (opcional)"}, e(Dinheiro,{value:dif, label:"Diferença do brinde", onChange:function(v){ st3[1](v); }}))),
        df && e(Selo,{cor:ESTADO.alerta, titulo:"Diferença entre o valor vendido e o do prêmio"}, df)),
      e(Painel,{t:"Conferência", ic:"check-square", estado:conf ? "feito" : pecasOk ? "atual" : undefined},
        e(CampoRot,{rot:"Responsável pela entrega"}, e(Entrada,{v:resp, on:st4[1], rot:"Responsável"})),
        e(CampoRot,{rot:"Observação (opcional)"}, e(Entrada,{v:obs, on:st5[1], rot:"Observação"})),
        e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-[13px] font-bold ring-1 ring-white/10"}, e("input",{type:"checkbox", checked:conf, onChange:function(ev){ st6[1](ev.target.checked); }}), "A revendedora conferiu as peças"),
        e(Linha,null, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"ok", ic:"check-circle", disabled:!pode, onClick:function(){ p.dispatch({type:"IND", op:"resgate_entregar", id:r.id, codigosPecas:pecas, valorVenda:valor, valorDiferencaBrinde:dif||null, responsavelNome:resp, observacao:obs||undefined, revendedoraConfirmou:true, por:p.por}); p.fechar(); }}, "Confirmar retirada")))));
}
function FormCancelar(p){
  var r = p.r, mots = p.ind.config.motivosCancelamento, st1 = useState(""), esc = st1[0], st2 = useState(""), livre = st2[0], mot = motivoFinal(esc, livre);
  return e(Janela,{t:"Cancelar pedido", sub:r.nomeRevendedora+" · "+r.premioTitulo, fechar:p.fechar, tam:"md"},
    e(Colunas,{n:2},
      e(PedidoInfo,{r:r}, e(Nota,null, avisoDeEstorno(p.ind, r))),
      e(Painel,{t:"Motivo do cancelamento", ic:"x-circle", estado:"atual"},
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, mots.map(function(m){ var sel = esc===m;
          return e("button",{key:m, type:"button", onClick:function(){ st1[1](m); }, className:"rounded-lg px-3 py-1.5 text-[13px] font-bold transition "+(sel ? "bg-[#EF4444]/30 text-[#F87171] ring-2 ring-[#EF4444]" : "bg-black/30 ring-1 ring-white/15 hover:bg-white/10")}, m.charAt(0).toUpperCase()+m.slice(1)); })),
        esc==="outro" && e(CampoRot,{rot:"Descreva o motivo"}, e(Entrada,{v:livre, on:st2[1], rot:"Motivo"})),
        e(Linha,null, e(Bt,{onClick:p.fechar}, "Voltar"), e(Bt,{tipo:"perigo", ic:"x-circle", disabled:!mot, onClick:function(){ p.dispatch({type:"IND", op:"resgate_cancelar", id:r.id, motivo:mot, por:p.por}); p.fechar(); }}, "Confirmar cancelamento")))));
}
// dados de balcão (em contato, vendido no sistema, retirada com a maleta etc.)
function FormBalcao(p){
  var r = p.r, op = r.operacao;
  var st = useState({emContato:!!op.emContato, vendidoSistema:!!op.vendidoSistema, pecasNaoVendidas:!!op.pecasNaoVendidas, retiradaMaleta:!!op.retiradaMaleta, dataAcertoMaleta:op.dataAcertoMaleta||"", representanteMaleta:op.representanteMaleta||"", responsavelNome:op.responsavelNome||"", observacao:op.observacao||"", pecas:(op.codigosPecas||[]).join(" ")}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var Chk = function(k, rot, ic){ return e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold ring-1 transition "+(v[k] ? "bg-[#22C55E]/20 ring-[#22C55E]/60" : "bg-black/30 ring-white/10")}, e("input",{type:"checkbox", checked:v[k], onChange:function(ev){ set(k, ev.target.checked); }}), e(Ph,{n:ic, s:14}), rot); };
  var salvar = function(){
    var d = {type:"IND", op:"resgate_set", id:r.id, emContato:v.emContato, vendidoSistema:v.vendidoSistema, pecasNaoVendidas:v.pecasNaoVendidas, retiradaMaleta:v.retiradaMaleta, responsavelNome:v.responsavelNome, observacao:v.observacao, codigosPecas:v.pecas, por:p.por};
    if(v.retiradaMaleta){ d.dataAcertoMaleta = v.dataAcertoMaleta; d.representanteMaleta = v.representanteMaleta; }
    p.dispatch(d); p.fechar();
  };
  return e(Janela,{t:"Dados do balcão", sub:r.nomeRevendedora+" · "+r.premioTitulo, tam:"xl", fechar:p.fechar},
    e(Colunas,{n:3},
      e(PedidoInfo,{r:r}, e("div",{className:"flex flex-col gap-1.5"}, Chk("emContato", "Em contato com a revendedora", "whatsapp-logo"), Chk("vendidoSistema", "Vendido no sistema", "check"), Chk("pecasNaoVendidas", "Peças não vendidas", "package"), Chk("retiradaMaleta", "Retirada com a maleta", "briefcase"))),
      e(Painel,{t:"Peças e responsável", ic:"diamond", estado:v.pecas.trim() ? "feito" : "atual"},
        e(CampoRot,{rot:"Códigos das peças"}, e(Entrada,{v:v.pecas, on:function(x){ set("pecas", x); }, rot:"Códigos das peças"})),
        e(CampoRot,{rot:"Responsável"}, e(Entrada,{v:v.responsavelNome, on:function(x){ set("responsavelNome", x); }, rot:"Responsável"}))),
      e(Painel,{t:v.retiradaMaleta ? "Maleta e observação" : "Observação", ic:"note-pencil"},
        v.retiradaMaleta && e("div",{className:"grid grid-cols-1 gap-2"},
          e(CampoRot,{rot:"Data do acerto"}, e(Entrada,{type:"date", v:v.dataAcertoMaleta, on:function(x){ set("dataAcertoMaleta", x); }, rot:"Data do acerto"})),
          e(CampoRot,{rot:"Representante"}, e(Entrada,{v:v.representanteMaleta, on:function(x){ set("representanteMaleta", x); }, rot:"Representante"}))),
        e(CampoRot,{rot:"Observação"}, e(Entrada,{v:v.observacao, on:function(x){ set("observacao", x); }, rot:"Observação"})),
        e(Linha,null, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Salvar")))));
}
// novo pedido de resgate (lançamento manual de balcão)
function FormNovoPedido(p){
  var ind = p.ind, st1 = useState(null), revId = st1[0], st2 = useState(false), nova = st2[0], st3 = useState(""), nome = st3[0], st4 = useState(""), tel = st4[0];
  var st5 = useState(""), prem = st5[0], st6 = useState(true), deb = st6[0], st7 = useState(""), obs = st7[0];
  var pm = ind.premios.find(function(x){ return x.codigo===prem; }), saldo = revId!=null ? saldoDe(ind, revId).saldo : null;
  var falta = deb && pm && saldo!=null && saldo<pm.custoMoedas;
  var okRev = nova ? nome.trim().length>0 : revId!=null, podeCriar = okRev && !!pm && !falta;
  var enviar = function(){ var d = {type:"IND", op:"resgate_add", premioCodigo:prem, debitar:deb, observacao:obs, por:p.por}; if(nova){ d.revendedoraNome = nome; d.revendedoraTelefone = tel; } else d.revendedoraId = revId; p.dispatch(d); p.fechar(); };
  return e(Janela,{t:"Novo pedido", sub:"Lançamento manual de resgate de prêmio", fechar:p.fechar, tam:"xl", passos:[{t:"Revendedora", estado:okRev ? "feito" : "atual"}, {t:"Prêmio", estado:pm ? "feito" : okRev ? "atual" : "futuro"}, {t:"Confirmar", estado:podeCriar ? "atual" : "futuro"}]},
    e(Colunas,{n:3},
      e(Painel,{t:"Revendedora", ic:"user-circle", estado:okRev ? "feito" : "atual"},
        e(Linha,null, e(Bt,{tipo:!nova ? "marca" : "normal", onClick:function(){ st2[1](false); }, className:BTP}, "Cadastrada"), e(Bt,{tipo:nova ? "marca" : "normal", ic:"user-plus", onClick:function(){ st2[1](true); }, className:BTP}, "Nova revendedora")),
        nova ? e("div",{className:"grid grid-cols-1 gap-2"}, e(CampoRot,{rot:"Nome"}, e(Entrada,{v:nome, on:st3[1], rot:"Nome"})), e(CampoRot,{rot:"Telefone"}, e(Entrada,{v:tel, on:st4[1], rot:"Telefone", modo:"tel"})))
             : e(SeletorRev,{ind:ind, valor:revId, onPick:st1[1]})),
      e(Painel,{t:"Prêmio", ic:"gift", estado:pm ? "feito" : okRev ? "atual" : undefined},
        ind.premios.length ? e(CampoRot,{rot:"Prêmio"}, e("select",{value:prem, "aria-label":"Prêmio", className:INPUT+" h-10! w-full text-center", onChange:function(ev){ st5[1](ev.target.value); }},
            e("option",{value:""}, "Escolha o prêmio"), ind.premios.map(function(x){ return e("option",{key:x.codigo, value:x.codigo}, x.titulo+" · "+formatarMoedas(x.custoMoedas)); })))
          : e(Nota,null, "Nenhum prêmio cadastrado. Cadastre no catálogo de prêmios, na aba Revendedoras."),
        e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-[13px] font-bold ring-1 ring-white/10"}, e("input",{type:"checkbox", checked:deb, onChange:function(ev){ st6[1](ev.target.checked); }}), "Debitar as moedas agora"),
        falta && e(Alerta,{cor:ESTADO.ruim}, "Saldo insuficiente. Ela tem "+saldo.toLocaleString("pt-BR")+" moedas; o prêmio custa "+pm.custoMoedas.toLocaleString("pt-BR")+".")),
      e(Painel,{t:"Confirmação", ic:"check-square", estado:podeCriar ? "atual" : undefined},
        e(CampoRot,{rot:"Observação (opcional)"}, e(Entrada,{v:obs, on:st7[1], rot:"Observação"})),
        e(Linha,null, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"plus", disabled:!podeCriar, onClick:enviar}, "Criar pedido")))));
}
// escolhe a janela certa para o pedido; o domínio continua sendo quem decide (as recusas aparecem no aviso do sistema)
function DialogoResgate(p){
  var cx = use(), s = cx.state, ind = s.ind, por = nomeDe(s.usuario), r = resgateDe(ind, p.id);
  if(!r) return null;
  var base = {r:r, ind:ind, por:por, dispatch:cx.dispatch, fechar:p.fechar};
  if(p.tipo==="agendar") return e(FormAgendar, base);
  if(p.tipo==="entregar") return e(FormEntregar, base);
  if(p.tipo==="cancelar") return e(FormCancelar, base);
  return e(FormBalcao, base);
}

// ───────────── cartão do Kanban ─────────────
function CartaoResgate(p){
  var r = p.it, op = r.operacao, aberto = etapaEmAberto(r.etapa), cor = COR_NIVEL[r.nivel], cc = COR_ETAPA[r.etapa] || "#94A3B8", tel = r.revendedora ? r.revendedora.telefone : "", zap = linkWhatsapp(tel), maleta = textoBrindeMaleta(op);
  var alterna = function(campo){ var d = {type:"IND", op:"resgate_set", id:r.id, por:p.por}; d[campo] = !op[campo]; p.dispatch(d); };
  // fundo em degradê leve na cor da coluna (sem aumentar a altura do cartão)
  return e("div",{className:"flex flex-col items-center gap-1", style:{margin:"-10px -10px 0 -7px", padding:"10px 10px 4px 7px", borderRadius:"8px 8px 0 0", background:"linear-gradient(160deg, "+cc+"2E 0%, "+cc+"0A 70%, transparent 100%)"}},
    e("div",{className:"flex max-w-full items-center justify-center gap-1.5"}, e(Avatar,{nome:r.nomeRevendedora, cor:cc, s:26}), e("b",{className:"min-w-0 text-left text-[13.5px] leading-tight"}, r.nomeRevendedora)),
    e("span",{className:"flex items-center gap-1 text-[12.5px] font-semibold"}, e(Ph,{n:"gift", s:13}), r.premioTitulo||"Prêmio"),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1"},
      e(Selo,{cor:"#F3D98B", ic:"coins"}, formatarMoedas(r.custoMoedas)), r.premioValor>0 && e(Selo,{cor:"#94A3B8"}, formatarReais(r.premioValor)),
      aberto && e(Selo,{cor:cor, ic:"clock", titulo:ROTULO_NIVEL[r.nivel]+" · pedido #"+r.id}, r.esperando+(r.nivel==="em-dia" ? "" : " · "+ROTULO_NIVEL[r.nivel])),
      r.horarioAgendado && e(Selo,{cor:"#60A5FA", ic:"calendar-blank"}, r.horarioAgendado)),
    r.etapa==="entregue" && e("span",{className:"text-[11.5px] text-white/75"}, "Retirado em "+formatarDataHora(r.entregueEm)+(op.valorVenda!=null ? " · "+formatarReais(op.valorVenda) : "")),
    r.etapa==="cancelado" && e("span",{className:"text-[11.5px] text-white/75"}, "Cancelado"+(r.canceladoMotivo ? ": "+r.canceladoMotivo : "")),
    maleta && e("span",{className:"text-[11px] leading-tight text-white/70"}, maleta),
    aberto && e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Bt,{tipo:op.emContato ? "ok" : "normal", ic:"whatsapp-logo", titulo:"Marcar como em contato (mantém o pedido em dia)", onClick:function(){ alterna("emContato"); }, className:BTP}, "Em contato"),
      e(Bt,{tipo:op.vendidoSistema ? "ok" : "normal", ic:"check", titulo:"Peças já vendidas no sistema", onClick:function(){ alterna("vendidoSistema"); }, className:BTP}, "Vendido no sistema")),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      acoesDaEtapa(r.etapa).map(function(a){ var t = a.acao==="cancelar" ? "cancelar" : a.acao==="aprovar" ? "agendar" : "entregar";
        return e(Bt,{key:a.acao, tipo:a.tom==="perigo" ? "perigo" : "forte", ic:a.acao==="cancelar" ? "x-circle" : a.acao==="aprovar" ? "calendar-blank" : "check-circle", onClick:function(){ p.abrir(t, r); }, className:BTP}, a.rotulo); }),
      r.etapa==="aprovado" && e(Bt,{ic:"calendar-blank", onClick:function(){ p.abrir("agendar", r); }, className:BTP}, "Reagendar"),
      aberto && e(Bt,{ic:"pencil-simple", onClick:function(){ p.abrir("balcao", r); }, className:BTP}, "Balcão"),
      zap && e("a",{href:zap, target:"_blank", rel:"noreferrer", title:"Abrir conversa no WhatsApp", className:"inline-flex items-center justify-center rounded-lg bg-muted/50 px-2 py-1 hover:bg-white/15"}, e(Ph,{n:"whatsapp-logo", s:15}))));
}

// ───────────── Fila de resgates (Kanban) ─────────────
function CorpoResgates(){
  var cx = use(), s = cx.state, ind = s.ind, por = nomeDe(s.usuario), hoje = hojeSP(), agora = agoraSP();
  var st1 = useState(""), q = st1[0], st2 = useState(null), dlg = st2[0], st3 = useState(false), novo = st3[0], st4 = useState(null), aviso = st4[0], st5 = useState(false), maleta = st5[0];
  useEffect(function(){ if(!aviso) return; var t = setTimeout(function(){ st4[1](null); }, 7000); return function(){ clearTimeout(t); }; }, [aviso]);
  var ind0 = indicadoresResgates(ind, hoje, agora);
  var abrir = function(tipo, r){ st2[1]({tipo:tipo, id:r.id}); };
  var colunas = ETAPAS_RESGATE.map(function(et){
    return {k:et, titulo:rotuloAba(et), cor:COR_ETAPA[et], dica:explicacaoEtapa(et), aceita:et!=="solicitado", itens:filtrarBrindeMaleta(filaPorEtapa(ind, et, {q:q, agora:agora}), maleta)};
  });
  // só as transições que a lógica permite abrem janela; as outras voltam com a mensagem formal do domínio
  var mover = function(item, de, para){
    var recusar = function(t){ st4[1](t); };
    if(!etapaEmAberto(de)) return recusar("Esse pedido já foi "+(de==="entregue" ? "retirado." : "cancelado.")+" Ele não pode mudar de etapa.");
    if(para==="solicitado") return recusar("Um pedido que já passou pela triagem não volta para a fila.");
    if(para==="aprovado") return abrir("agendar", item);
    if(para==="entregue"){ if(de==="solicitado") return recusar("Agende a retirada antes de confirmar."); return abrir("entregar", item); }
    if(para==="cancelado") return abrir("cancelar", item);
  };
  var corAtraso = ind0.criticos>0 ? ESTADO.ruim : ESTADO.alerta;
  return e(Pagina,null,
    e(Resumo,{itens:[
      {t:"Na fila", v:ind0.naFila, cor:"aberto"}, {t:"Aguardando retirada", v:ind0.aguardando, cor:"info"}, {t:"Retirados", v:ind0.retirados, cor:"ok"},
      {t:"Cancelados", v:ind0.cancelados, cor:"cancelado"}, {t:"Atrasados", v:ind0.atrasados, cor:ind0.atrasados ? "atrasado" : "cancelado", sub:ind0.criticos ? ind0.criticos+" críticos" : undefined},
      {t:"Sem horário", v:ind0.semHorario, cor:ind0.semHorario ? "aberto" : "cancelado"}]}),
    ind0.aviso && e(Alerta,{cor:corAtraso}, ind0.aviso+(ind0.criticos ? " · "+ind0.criticos+(ind0.criticos===1 ? " crítico" : " críticos") : "")),
    aviso && e("div",{onClick:function(){ st4[1](null); }, className:"cursor-pointer"}, e(Alerta,{cor:ESTADO.ruim, ic:"x-circle"}, aviso)),
    e(BarraFiltros,{limpar:q || maleta ? function(){ st1[1](""); st5[1](false); } : null},
      e(Busca,{v:q, ph:"Buscar por nome, telefone, prêmio ou nº", set:st1[1]}),
      e(Alternar,{on:maleta, set:st5[1], ic:"package"}, "Retirada com a maleta"),
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ st3[1](true); }, className:"h-9 py-0!"}, "Novo pedido")),
    e(Secao,{ic:"gift", t:"Fila de resgates", sub:"Arraste o cartão para a etapa seguinte", dir:String(colunas.reduce(function(t, c){ return t+c.itens.length; }, 0))},
      e(Kanban,{colunas:colunas, card:function(it){ return e(CartaoResgate,{it:it, por:por, dispatch:cx.dispatch, abrir:abrir}); }, onMover:mover, vazio:"Nenhum pedido nesta etapa."})),
    dlg && e(DialogoResgate,{key:dlg.tipo+dlg.id, tipo:dlg.tipo, id:dlg.id, fechar:function(){ st2[1](null); }}),
    novo && e(FormNovoPedido,{ind:ind, por:por, dispatch:cx.dispatch, fechar:function(){ st3[1](false); }}));
}

function AbaIndResgates(){
  var s = use().state;
  if(!s.ind) return e(Pagina,null, e(Nota,null, "Os dados das indicações ainda não foram carregados."));
  return e(CorpoResgates);
}

// ───────────── Agendamentos e Retiradas do dia ─────────────
var horaDe = function(iso){ var p = partirIsoAgendamento(iso); return p ? p.horario : "—"; };
function CorpoRetiradas(){
  var cx = use(), s = cx.state, ind = s.ind, por = nomeDe(s.usuario), hoje = hojeSP(), agora = agoraSP(), cfg = ind.config;
  var st1 = useState(hoje), inicio = st1[0], st2 = useState(hoje), diaAg = st2[0], st3 = useState(hoje), diaRet = st3[0], st4 = useState(null), dlg = st4[0];
  var dias = faixaDeDias(inicio, cfg.agendaDias||7), cont = contagemPorDia(ind, dias), ag = agendamentosDoDia(ind, diaAg, agora), sem = resgatesSemHorario(ind, agora);
  var res = resumoDoDia(ind, diaRet, agora), ind0 = indicadoresResgates(ind, hoje, agora);
  var abrir = function(tipo, r){ st4[1]({tipo:tipo, id:r.id}); };
  var baixar = function(){
    try{ var blob = new Blob(["\ufeff"+gerarCsvDoDia(ind, diaRet, agora)], {type:"text/csv;charset=utf-8"}), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = nomeDoArquivoCsv(diaRet); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); }, 1500); }catch(x){}
  };
  var Acoes = function(r, extra){ return e("div",{className:"flex flex-wrap justify-center gap-1"},
    e(Bt,{tipo:"ok", ic:"check-circle", onClick:function(){ abrir("entregar", r); }, className:BTP}, "Confirmar retirada"), e(Bt,{ic:"calendar-blank", onClick:function(){ abrir("agendar", r); }, className:BTP}, extra||"Reagendar"), e(Bt,{tipo:"perigo", ic:"x-circle", onClick:function(){ abrir("cancelar", r); }, className:BTP}, "Cancelar")); };
  return e(Pagina,null,
    e(Resumo,{itens:[{t:"Agendados hoje", v:ind0.agendadosHoje, cor:"info"}, {t:"Sem horário", v:ind0.semHorario, cor:ind0.semHorario ? "aberto" : "cancelado"}, {t:"Retiradas hoje", v:ind0.retiradasHoje, cor:"ok"},
      {t:"Valor em venda hoje", v:formatarReais(ind0.valorHoje), cor:"ouro"}, {t:"Moedas hoje", v:ind0.moedasHoje.toLocaleString("pt-BR"), cor:"ouro"}]}),
    sem.length>0 && e("section",{className:"flex flex-col gap-1.5 rounded-xl p-2.5 text-center", style:{background:"linear-gradient(135deg, "+ESTADO.alerta+"2E, "+ESTADO.alerta+"0F)", boxShadow:"inset 0 0 0 2px "+ESTADO.alerta+"88"}},
      e("b",{className:"flex items-center justify-center gap-1.5 text-[14px]", style:{color:ESTADO.alerta}}, e(Ph,{n:"warning", s:16}), "Resgates sem horário ("+sem.length+")"),
      e(Mosaico,{min:"22rem"}, sem.map(function(r){ return e("div",{key:r.id, className:"flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-black/30 px-3 py-1.5"},
        e(Avatar,{nome:r.nomeRevendedora, s:24}), e("b",{className:"text-[13px]"}, r.nomeRevendedora), e("span",{className:"text-[12.5px] text-white/80"}, r.premioTitulo), e(Selo,{cor:"#F3D98B", ic:"coins"}, formatarMoedas(r.custoMoedas)), e(Selo,{cor:COR_NIVEL[r.nivel]}, r.esperando),
        e(Bt,{tipo:"forte", ic:"calendar-blank", onClick:function(){ abrir("agendar", r); }, className:BTP}, "Agendar")); }))),
    e(Secao,{ic:"calendar-check", t:"Agendamentos", dir:String(ag.length)},
      e("div",{className:"flex items-center justify-center gap-1.5"},
        e(Bt,{ic:"caret-left", onClick:function(){ st1[1](avancarFaixa(inicio, -1, cfg.agendaDias||7)); }, className:BTP+" shrink-0", titulo:"Dias anteriores"}),
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, dias.map(function(d){ var sel = d===diaAg, n = cont[d]||0;
          return e("button",{key:d, type:"button", onClick:function(){ st2[1](d); }, title:formatarDia(d), className:"flex min-w-16 flex-col items-center rounded-lg px-2.5 py-1 text-[12.5px] font-bold transition "+(sel ? "bg-[#F97316] text-black" : "bg-black/30 ring-1 ring-white/15 hover:bg-white/10")},
            rotuloDoChip(d, hoje), e("span",{className:MONO+" text-[11px] "+(sel ? "text-black/75" : n ? "text-[#FDBA74]" : "text-white/45")}, n===0 ? "Livre" : n+(n===1 ? " retirada" : " retiradas"))); })),
        e(Bt,{ic:"caret-right", onClick:function(){ st1[1](avancarFaixa(inicio, 1, cfg.agendaDias||7)); }, className:BTP+" shrink-0", titulo:"Próximos dias"})),
      e(BarraFiltros,{limpar:diaAg!==hoje ? function(){ st2[1](hoje); st1[1](hoje); } : null},
        e(FiltroData,{rot:"Outro dia", v:diaAg, set:function(x){ if(x){ st2[1](x); st1[1](x); } }})),
      ag.length ? e(Tab,{cols:["Horário", "Revendedora", "Prêmio", "Moedas", "Espera", "Ações"]}, ag.map(function(r){ return e("tr",{key:r.id, className:LINHA},
          e(Td,{dinheiro:true, forte:true}, horaDe(r.operacao.dataAgendada)), e(Td,{forte:true}, r.nomeRevendedora), e(Td,null, r.premioTitulo), e(Td,{dinheiro:true}, r.custoMoedas.toLocaleString("pt-BR")), e(Td,{cor:COR_NIVEL[r.nivel]}, r.esperando), e(Td,null, Acoes(r))); }))
        : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nenhuma retirada agendada para "+(diaAg===hoje ? "hoje" : formatarDia(diaAg))+".")),
    e(Secao,{ic:"package", t:"Retiradas do dia", dir:String(res.quantidade)},
      e(BarraFiltros,null,
        e(FiltroData,{rot:"Dia", v:diaRet, set:function(x){ if(x) st3[1](x); }}),
        e(Chip,{on:diaRet===hoje, onClick:function(){ st3[1](hoje); }}, "Hoje"), e(Chip,{on:diaRet===somaDias(hoje, -1), onClick:function(){ st3[1](somaDias(hoje, -1)); }}, "Ontem"),
        e(Bt,{tipo:"forte", ic:"download-simple", disabled:res.quantidade===0, titulo:nomeDoArquivoCsv(diaRet), onClick:baixar, className:"h-9 py-0!"}, "Baixar CSV")),
      e(Resumo,{itens:[{t:"Retiradas", v:res.quantidade, cor:"ok"}, {t:"Valor em venda", v:formatarReais(res.valorTotal), cor:"ouro"}, {t:"Moedas", v:res.moedasTotal.toLocaleString("pt-BR"), cor:"ouro"}]}),
      res.itens.length ? e(Tab,{cols:["Pedido", "Revendedora", "Prêmio", "Valor em venda", "Moedas", "Responsável", "Peças", "Retirado em"]}, res.itens.map(function(r){ var op = r.operacao;
          return e("tr",{key:r.id, className:LINHA}, e(Td,{dinheiro:true}, "#"+r.id), e(Td,{forte:true}, r.nomeRevendedora), e(Td,null, r.premioTitulo), e(Td,{dinheiro:true}, formatarReais(op.valorVenda!=null ? op.valorVenda : r.premioValor)), e(Td,{dinheiro:true}, r.custoMoedas.toLocaleString("pt-BR")),
            e(Td,null, op.responsavelNome||"—"), e(Td,{className:"max-w-48 truncate", dinheiro:true}, (op.codigosPecas||[]).join(" ")||"—"), e(Td,{dinheiro:true}, formatarDataHora(r.entregueEm))); }))
        : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nenhuma retirada em "+formatarDia(diaRet)+".")),
    dlg && e(DialogoResgate,{key:dlg.tipo+dlg.id, tipo:dlg.tipo, id:dlg.id, fechar:function(){ st4[1](null); }}));
}

function AbaIndRetiradas(){
  var s = use().state;
  if(!s.ind) return e(Pagina,null, e(Nota,null, "Os dados das indicações ainda não foram carregados."));
  return e(CorpoRetiradas);
}

// ───────────── Revendedoras: ranking, cadastro, moedas, extrato e prêmios ─────────────
function FormCredito(p){
  var ind = p.ind, cfg = ind.config, st1 = useState(p.revId==null ? null : p.revId), revId = st1[0], st2 = useState(""), mo = st2[0], st3 = useState(""), mot = st3[0];
  var n = Number(mo), pode = revId!=null && mo!=="" && n>=cfg.moedasMin && n<=cfg.moedasMax;
  return e("div",{className:"flex flex-col gap-2"},
    e(SeletorRev,{ind:ind, valor:revId, onPick:st1[1]}),
    e("div",{className:"grid grid-cols-1 gap-2"},
      e(CampoRot,{rot:"Moedas ("+cfg.moedasMin.toLocaleString("pt-BR")+" a "+cfg.moedasMax.toLocaleString("pt-BR")+")"}, e(Entrada,{v:mo, on:function(v){ st2[1](soDigitos(v)); }, rot:"Moedas", modo:"numeric"})),
      e(CampoRot,{rot:"Motivo (opcional)"}, e(Entrada,{v:mot, on:st3[1], rot:"Motivo"}))),
    e(Linha,null, p.fechar && e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"coins", disabled:!pode, onClick:function(){ p.dispatch({type:"IND", op:"moedas_credito", revendedoraId:revId, moedas:n, motivo:mot, por:p.por}); st2[1](""); st3[1](""); if(p.fechar) p.fechar(); }}, "Creditar moedas")));
}
function FormRev(p){   // cadastro e edição
  var r = p.rev, st = useState({nome:r ? r.nome : "", telefone:r ? r.telefone : "", email:r ? r.email : ""}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){ p.dispatch(r ? {type:"IND", op:"rev_set", id:r.id, nome:v.nome, telefone:v.telefone, email:v.email, por:p.por} : {type:"IND", op:"rev_add", nome:v.nome, telefone:v.telefone, email:v.email, por:p.por}); if(!r) st[1]({nome:"", telefone:"", email:""}); if(p.fechar) p.fechar(); };
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-1 gap-2"},
      e(CampoRot,{rot:"Nome"}, e(Entrada,{v:v.nome, on:function(x){ set("nome", x); }, rot:"Nome"})), e(CampoRot,{rot:"Telefone"}, e(Entrada,{v:v.telefone, on:function(x){ set("telefone", x); }, rot:"Telefone", modo:"tel"})), e(CampoRot,{rot:"E-mail"}, e(Entrada,{v:v.email, on:function(x){ set("email", x); }, rot:"E-mail"}))),
    e(Linha,null, p.fechar && e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:r ? "check" : "user-plus", disabled:!v.nome.trim(), onClick:enviar}, r ? "Salvar" : "Cadastrar revendedora")));
}
// saldo da revendedora (usado nas janelas de extrato, crédito e edição)
function SaldoRev(p){
  var sd = saldoDe(p.ind, p.id);
  return e("div",{className:"flex flex-col gap-2"},
    e(Resumo,{itens:[{t:"Saldo", v:sd.saldo.toLocaleString("pt-BR"), cor:"ouro"}, {t:"Total creditado", v:sd.total.toLocaleString("pt-BR"), cor:"info"}, {t:"Vencidas", v:sd.vencidas.toLocaleString("pt-BR"), cor:sd.vencidas ? "aberto" : "cancelado"}]}),
    sd.proximoVencimento && e(Nota,null, "Próximo vencimento: "+formatarMoedas(sd.proximoVencimento.moedas)+" em "+formatarDia(sd.proximoVencimento.dia)+"."));
}
function JanelaExtrato(p){
  var ind = p.ind, rv = buscaRevendedoraPorId(ind, p.id), ls = extratoDe(ind, p.id);
  if(!rv) return null;
  return e(Janela,{t:"Extrato de moedas", sub:rv.nome, tam:"xl", fechar:p.fechar},
    e(Colunas,{n:3},
      e(Painel,{t:"Saldo", ic:"coins", estado:"atual"}, e("div",{className:"flex flex-col items-center gap-1.5"}, e(Avatar,{nome:rv.nome, s:40}), e("b",{className:"text-[14px]"}, rv.nome)), e(SaldoRev,{ind:ind, id:p.id})),
      e(Painel,{t:"Lançamentos", ic:"list-bullets", className:"lg:col-span-2"},
        ls.length ? e(Tab,{cols:["Data", "Tipo", "Moedas", "Motivo", "Registrado por", ""]}, ls.map(function(l){
            return e("tr",{key:l.id, className:LINHA}, e(Td,{dinheiro:true}, formatarDataHora(l.em)), e(Td,null, TIPO_LANC[l.tipo]||l.tipo), e(Td,{dinheiro:true, forte:true, cor:l.moedas<0 ? "ruim" : "ok"}, (l.moedas>0 ? "+" : "")+l.moedas.toLocaleString("pt-BR")), e(Td,{className:"max-w-56 truncate"}, l.motivo||"—"), e(Td,null, l.por),
              e(Td,null, l.tipo==="credito_manual" && e(Bt,{tipo:"perigo", ic:"trash", titulo:"Excluir este crédito manual", onClick:function(){ if(window.confirm("Excluir o crédito de "+formatarMoedas(l.moedas)+"?")) p.dispatch({type:"IND", op:"moedas_del", id:l.id, por:p.por}); }, className:BTP}))); }))
          : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nenhum lançamento de moedas."))));
}
function FormPremio(p){
  var pr = p.premio, st = useState({codigo:pr ? pr.codigo : "", titulo:pr ? pr.titulo : "", custo:pr ? String(pr.custoMoedas) : "", valor:pr ? pr.valor : 0}), v = st[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; st[1](n); };
  var enviar = function(){
    p.dispatch(pr ? {type:"IND", op:"premio_set", codigo:pr.codigo, titulo:v.titulo, custoMoedas:Number(v.custo), valor:v.valor, por:p.por} : {type:"IND", op:"premio_add", codigo:v.codigo, titulo:v.titulo, custoMoedas:Number(v.custo), valor:v.valor, por:p.por});
    if(!pr) st[1]({codigo:"", titulo:"", custo:"", valor:0}); if(p.fechar) p.fechar();
  };
  var acoes = e(Linha,null, p.fechar && e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:pr ? "check" : "plus", disabled:!v.titulo.trim() || !(Number(v.custo)>0), onClick:enviar}, pr ? "Salvar" : "Adicionar prêmio"));
  var titulo = e(CampoRot,{rot:"Prêmio"}, e(Entrada,{v:v.titulo, on:function(x){ set("titulo", x); }, rot:"Prêmio", ph:"Ex.: R$ 400 em semijoias"})),
    custo = e(CampoRot,{rot:"Custo em moedas"}, e(Entrada,{v:v.custo, on:function(x){ set("custo", soDigitos(x)); }, rot:"Custo em moedas", modo:"numeric"})),
    valor = e(CampoRot,{rot:"Valor do prêmio"}, e(Dinheiro,{value:v.valor, label:"Valor do prêmio", onChange:function(x){ set("valor", x); }}));
  if(pr) return e(Colunas,{n:2}, e(Painel,{t:"Prêmio", ic:"gift", estado:v.titulo.trim() ? "feito" : "atual"}, titulo), e(Painel,{t:"Custo e valor", ic:"coins", estado:v.titulo.trim() ? "atual" : undefined}, custo, valor, acoes));
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-2 gap-2"}, e(CampoRot,{rot:"Código (opcional)"}, e(Entrada,{v:v.codigo, on:function(x){ set("codigo", x); }, rot:"Código"})), custo, e("div",{className:"col-span-2"}, titulo), e("div",{className:"col-span-2"}, valor)), acoes);
}
function CorpoRevendedoras(){
  var cx = use(), s = cx.state, ind = s.ind, por = nomeDe(s.usuario), hoje = hojeSP();
  var st1 = useState(""), q = st1[0], st2 = useState(0), pg = st2[0], st3 = useState(null), dlg = st3[0];   // dlg: {tipo:"extrato"|"creditar"|"editar"|"premio", id}
  var rk = ranking(ind, {q:q, pagina:pg, hoje:hoje}); if(!rk.itens.length && pg>0) rk = ranking(ind, {q:q, pagina:0, hoje:hoje});
  var est = estadoDaPaginacao(rk.paginacao, rk.itens.length), mo = indicadoresMoedas(ind, hoje), fecha = function(){ st3[1](null); };
  var base = {ind:ind, por:por, dispatch:cx.dispatch};
  var rvDlg = dlg && (dlg.tipo==="editar" || dlg.tipo==="creditar") ? buscaRevendedoraPorId(ind, dlg.id) : null;
  var premDlg = dlg && dlg.tipo==="premio" ? ind.premios.find(function(x){ return x.codigo===dlg.id; }) : null;
  return e(Pagina,null,
    e(Resumo,{itens:[{t:"Revendedoras", v:mo.revendedoras, cor:"laranja"}, {t:"Moedas em circulação", v:mo.emCirculo.toLocaleString("pt-BR"), cor:"ouro"}, {t:"Moedas vencidas", v:mo.vencidas.toLocaleString("pt-BR"), cor:mo.vencidas ? "aberto" : "cancelado"}, {t:"Prêmios no catálogo", v:ind.premios.length, cor:"info"}]}),
    e(Nota,null, "Pedidos e indicações entram por lançamento manual até a integração com o app da revendedora."),
    e(BarraFiltros,{limpar:q ? function(){ st1[1](""); st2[1](0); } : null}, e(Busca,{v:q, ph:"Buscar por nome, telefone ou número", set:function(x){ st1[1](x); st2[1](0); }})),
    e(Secao,{ic:"trophy", t:"Ranking de revendedoras", dir:String(est.total)},
      rk.itens.length ? e(Tab,{cols:["#", "Revendedora", "Telefone", "Indicações", "Em andamento", "Kits", "Moedas", "Pedidos", "Ações"]}, rk.itens.map(function(r){
          return e("tr",{key:r.id, className:LINHA}, e(Td,{dinheiro:true}, r.posicao), e(Td,{forte:true}, e("span",{className:"inline-flex items-center gap-1.5"}, e(Avatar,{nome:r.nome, s:22}), r.nome)), e(Td,null, formatarTelefone(r.telefone)||"—"), e(Td,{dinheiro:true}, r.indicacoes), e(Td,{dinheiro:true}, r.emAndamento), e(Td,{dinheiro:true, cor:r.kits ? "ok" : undefined}, r.kits),
            e(Td,{dinheiro:true, forte:true, cor:"total"}, r.moedas.toLocaleString("pt-BR")), e(Td,{dinheiro:true}, r.resgates),
            e(Td,null, e("div",{className:"flex justify-center gap-1"}, e(Bt,{ic:"coins", titulo:"Extrato de moedas", onClick:function(){ st3[1]({tipo:"extrato", id:r.id}); }, className:BTP}, "Extrato"), e(Bt,{ic:"hand-coins", titulo:"Creditar moedas", onClick:function(){ st3[1]({tipo:"creditar", id:r.id}); }, className:BTP}, "Creditar"), e(Bt,{ic:"pencil-simple", titulo:"Editar cadastro", onClick:function(){ st3[1]({tipo:"editar", id:r.id}); }, className:BTP})))); }))
        : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, q.trim() ? "Nenhuma revendedora encontrada." : "Nenhuma revendedora cadastrada."),
      est.total>0 && e("div",{className:"flex items-center justify-center gap-2"},
        e(Bt,{ic:"caret-left", disabled:!est.podeVoltar, onClick:function(){ st2[1](Math.max(0, pg-1)); }, className:BTP}), e("span",{className:MONO+" text-[12.5px] text-white/80"}, textoDaPaginacao(est)+" · página "+est.paginaAtual+" de "+est.totalDePaginas), e(Bt,{ic:"caret-right", disabled:!est.podeAvancar, onClick:function(){ st2[1](pg+1); }, className:BTP}))),
    // cadastro, crédito e catálogo lado a lado (mosaico), sem blocos que abrem e fecham
    e(Mosaico,{min:"24rem"},
      e(Secao,{ic:"user-plus", t:"Cadastro de revendedora"}, e(FormRev,base)),
      e(Secao,{ic:"hand-coins", t:"Crédito manual de moedas"}, e(FormCredito,base)),
      e(Secao,{ic:"gift", t:"Catálogo de prêmios", dir:String(ind.premios.length)},
        ind.premios.length ? e(Tab,{cols:["Código", "Prêmio", "Custo em moedas", "Valor", "Ações"]}, ind.premios.map(function(x){
            return e("tr",{key:x.codigo, className:LINHA}, e(Td,{dinheiro:true}, x.codigo), e(Td,{forte:true}, x.titulo), e(Td,{dinheiro:true}, x.custoMoedas.toLocaleString("pt-BR")), e(Td,{dinheiro:true}, formatarReais(x.valor)),
              e(Td,null, e("div",{className:"flex justify-center gap-1"}, e(Bt,{ic:"pencil-simple", onClick:function(){ st3[1]({tipo:"premio", id:x.codigo}); }, className:BTP}, "Editar"), e(Bt,{tipo:"perigo", ic:"trash", titulo:"Excluir prêmio", onClick:function(){ if(window.confirm("Excluir o prêmio "+x.titulo+"? Os pedidos antigos continuam com o nome que tinham.")) cx.dispatch({type:"IND", op:"premio_del", codigo:x.codigo, por:por}); }, className:BTP})))); }))
          : e("p",{className:"py-2 text-center text-[13px] text-white/70"}, "Nenhum prêmio cadastrado."),
        e(FormPremio,base))),
    dlg && dlg.tipo==="extrato" && e(JanelaExtrato,Object.assign({id:dlg.id, fechar:fecha}, base)),
    rvDlg && dlg.tipo==="creditar" && e(Janela,{t:"Creditar moedas", sub:rvDlg.nome, tam:"md", fechar:fecha},
      e(Colunas,{n:2}, e(Painel,{t:"Saldo atual", ic:"coins", estado:"feito"}, e(SaldoRev,{ind:ind, id:rvDlg.id})), e(Painel,{t:"Crédito", ic:"hand-coins", estado:"atual"}, e(FormCredito,Object.assign({revId:rvDlg.id, fechar:fecha}, base))))),
    rvDlg && dlg.tipo==="editar" && e(Janela,{t:"Editar revendedora", sub:rvDlg.nome, tam:"xl", fechar:fecha},
      e(Colunas,{n:3},
        e(Painel,{t:"Cadastro", ic:"identification-card", estado:"atual"}, e(FormRev,Object.assign({rev:rvDlg, fechar:fecha}, base))),
        e(Painel,{t:"Saldo e moedas", ic:"coins"}, e(SaldoRev,{ind:ind, id:rvDlg.id}), e(Bt,{ic:"list-bullets", onClick:function(){ st3[1]({tipo:"extrato", id:rvDlg.id}); }}, "Ver extrato")),
        e(Painel,{t:"Creditar moedas", ic:"hand-coins"}, e(FormCredito,Object.assign({revId:rvDlg.id}, base))))),
    premDlg && e(Janela,{t:"Editar prêmio", sub:premDlg.codigo, tam:"md", fechar:fecha}, e(FormPremio,Object.assign({premio:premDlg, fechar:fecha}, base))));
}

function AbaIndRevendedoras(){
  var s = use().state;
  if(!s.ind) return e(Pagina,null, e(Nota,null, "Os dados das indicações ainda não foram carregados."));
  return e(CorpoRevendedoras);
}

export { AbaIndResgates, AbaIndRetiradas, AbaIndRevendedoras };
