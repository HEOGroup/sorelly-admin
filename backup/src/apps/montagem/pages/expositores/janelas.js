// Sorelly Admin · montagem — pages/expositores/janelas.js
// Janelas do módulo Expositores (janela larga em colunas, padrão visual):
//   JanelaMontar   montar (a partir da fila ou do zero) e editar o expositor: cliente | itens do estoque | status, data, retirada, observações e fotos
//   JanelaDetalhe  detalhe do cartão: dados | linha do tempo, itens e fotos | ações (editar, pedir de volta, devolver, excluir)
//   JanelaSaida    saída com a cliente (data e quem retirou)
//   JanelaDevolver devolução com a condição e, se danificado, a avaria completa
//   payloadEdicao  campos atuais do expositor no formato de "cond_edit" (para mudar só o status)
// As regras estão em domain/expositores.js; aqui só desenho e chamo as ações (EX).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { CONDICOES, CONDICOES_QUE_VOLTAM, ROTULO_AVARIA, ROTULO_CONDICAO, ROTULO_SLOT, ROTULO_STATUS, SLOTS_FOTO, TIPOS_AVARIA, TOM_CONDICAO, exClientesBusca, exCondicional, exDiasComCliente, exEstoque, exPadraoSaida, exPassouDoAviso, exPreviaMontagem, formatarDataHora, formatarDia, formatarReais, rotuloNumero, rotuloStatusAvaria, tomStatus, tomStatusAvaria } from "@/apps/montagem/domain/expositores";
import { Bt, Colunas, Janela, Painel, Passos, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { Area, Chips, CamposVinculo, Confirmar, Entrada, FotoSlot, SeloTom, corTom, textoPecas, textoVinculo, vincDe, vincSaida } from "@/apps/montagem/pages/expositores/comum";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var LARANJA = "#F97316";
var diaCurto = function(v){ return v ? String(v).slice(0, 10) : ""; };

// campos atuais do expositor no formato que "cond_edit" espera (mantém tudo, muda só o que vier em mud)
function payloadEdicao(cond, mud){
  return Object.assign({op:"cond_edit", id:cond.id, nome:cond.nome, telefone:cond.telefone, endereco:cond.endereco, observacoes:cond.observacoes,
    itens:cond.itens.map(function(i){ return {estoqueItemId:i.estoqueItemId, quantidade:i.quantidade}; }), status:cond.status, dataSaida:cond.dataSaida, retiradoPorNome:cond.retiradoPorNome}, mud || {});
}

// ───────────── fotos de um expositor ─────────────
// valores = {slot: foto}; onSet(slot, foto|null)
function Fotos(p){
  return e("div",{className:"grid grid-cols-2 justify-items-center gap-2"}, p.slots.map(function(sl){ return e(FotoSlot,{key:sl, rot:ROTULO_SLOT[sl], valor:p.valores[sl], onChange:function(f){ p.onSet(sl, f); }}); }));
}

// ───────────── montar / editar ─────────────
function inicial(c, p, cond){
  var f = p.fila, base = cond || f || {}, st = cond ? cond.status : (p.status || "BIPADO"), pad = exPadraoSaida(st, c.por, c.hoje), qtd = {};
  if(cond) cond.itens.forEach(function(i){ qtd[i.estoqueItemId] = i.quantidade; });
  var cli = !cond && f ? c.ex.clientes.find(function(x){ return x.telefoneKey===String(f.telefone||"").replace(/\D/g, ""); }) : null;
  return {nome:base.nome || "", telefone:base.telefone || "", endereco:cond ? (cond.endereco || "") : (cli && cli.endereco) || "", numero:cond ? String(cond.numero) : "", status:st,
    dataSaida:cond && cond.dataSaida ? diaCurto(cond.dataSaida) : (pad.dataSaida || ""), retirado:cond && cond.retiradoPorNome ? cond.retiradoPorNome : (pad.retiradoPorNome || ""),
    obs:cond ? (cond.observacoes || "") : (f && f.observacao) || "", vinc:vincDe(base.vinculo), qtd:qtd, fotos:{endereco:null, expositor:null, avaria:null, avaria2:null}, bc:"", bi:""};
}
function JanelaMontar(p){
  var c = p.c, s = c.s, cond = p.condId ? exCondicional(s, p.condId) : null, st = useState(function(){ return inicial(c, p, cond); }), f = st[0];
  if(p.condId && !cond) return null;
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var setQtd = function(id, v){ var q = Object.assign({}, f.qtd); q[id] = Math.max(0, Math.floor(Number(v) || 0)); set("qtd", q); };
  var itens = Object.keys(f.qtd).filter(function(k){ return Number(f.qtd[k])>0; }).map(function(k){ return {estoqueItemId:k, quantidade:Number(f.qtd[k])}; });
  var previa = exPreviaMontagem(s, itens, cond ? cond.id : null);
  var est = exEstoque(s, {busca:f.bi}).lista;
  var sugestoes = f.bc.trim() ? exClientesBusca(s, f.bc, 5) : [];
  var escolheCliente = function(cl){ var n = Object.assign({}, f, {nome:cl.nome, telefone:cl.telefone, endereco:cl.endereco || f.endereco, bc:""}); st[1](n); };
  var mudaStatus = function(v){ var pad = exPadraoSaida(v, c.por, c.hoje), n = Object.assign({}, f, {status:v}); if(v==="ESTA_COM_CLIENTE"){ if(!f.dataSaida) n.dataSaida = pad.dataSaida; if(!f.retirado) n.retirado = pad.retiradoPorNome; } st[1](n); };
  var comCliente = f.status==="ESTA_COM_CLIENTE";
  var enviar = function(){
    var ac = {op:cond ? "cond_edit" : "cond_montar", id:cond ? cond.id : undefined, nome:f.nome, telefone:f.telefone, endereco:f.endereco, observacoes:f.obs, numero:f.numero, status:f.status,
      dataSaida:comCliente ? f.dataSaida : null, retiradoPorNome:comCliente ? f.retirado : null, itens:itens, vinculo:vincSaida(f.vinc), filaId:p.fila ? p.fila.id : undefined};
    var r = c.exec(ac); if(!r) return;
    if(!cond){   // fotos escolhidas antes de existir o expositor: grava no que acabou de nascer
      var antes = {}; s.ex.condicionais.forEach(function(x){ antes[x.id] = 1; });
      var novo = r.patch.ex.condicionais.find(function(x){ return !antes[x.id]; });
      if(novo) SLOTS_FOTO.forEach(function(sl){ if(f.fotos[sl]) c.direto({op:"cond_foto", id:novo.id, slot:sl, foto:f.fotos[sl]}); });
    }
    p.fechar();
  };
  var fotosAtuais = cond ? cond.fotos : f.fotos;
  var onFoto = function(sl, foto){
    if(cond){ if(foto) c.exec({op:"cond_foto", id:cond.id, slot:sl, foto:foto}); else c.exec({op:"cond_foto_del", id:cond.id, slot:sl}); return; }
    var n = Object.assign({}, f.fotos); n[sl] = foto; set("fotos", n);
  };
  var saldoDe = function(i){ var meu = cond && cond.status!=="DEVOLVIDO" ? cond.itens.filter(function(x){ return x.estoqueItemId===i.id; }).reduce(function(t, x){ return t+x.quantidade; }, 0) : 0; return i.quantidade+meu; };
  var btn = "grid size-8 place-items-center rounded-lg bg-white/10 text-[16px] font-bold hover:bg-white/20";
  return e(Janela,{t:cond ? "Editar expositor nº "+rotuloNumero(cond) : "Montar expositor", sub:p.fila ? "A partir da fila de espera" : cond ? "Dados, itens e fotos" : "Cliente, itens e saída", tam:"xl", fechar:p.fechar},
    e(Colunas,{n:3},
      e(Painel,{t:"Cliente", ic:"user", estado:f.nome.trim() && f.telefone.trim() ? "feito" : "atual"},
        e(Entrada,{rot:"Buscar na base de clientes", v:f.bc, set:function(v){ set("bc", v); }, ph:"Nome, telefone ou endereço"}),
        sugestoes.length>0 && e("div",{className:"flex flex-col gap-1"}, sugestoes.map(function(cl){ return e("button",{key:cl.id, type:"button", onClick:function(){ escolheCliente(cl); }, className:"flex flex-col items-center rounded-lg bg-white/10 px-2 py-1 text-[12.5px] hover:bg-white/20"}, e("b",null, cl.nome), e("span",{className:MONO+" text-[11.5px] text-white/70"}, cl.telefone)); })),
        e(Entrada,{rot:"Nome da cliente", v:f.nome, set:function(v){ set("nome", v); }}),
        e(Entrada,{rot:"Telefone", v:f.telefone, set:function(v){ set("telefone", v); }, modo:"tel", mono:true}),
        e(Entrada,{rot:"Endereço", v:f.endereco, set:function(v){ set("endereco", v); }}),
        e(Entrada,{rot:cond ? "Número do expositor" : "Número (opcional)", v:f.numero, set:function(v){ set("numero", v.replace(/\D/g, "")); }, modo:"numeric", mono:true, ph:"Automático"}),
        e(CamposVinculo,{v:f.vinc, set:function(v){ set("vinc", v); }})),
      e(Painel,{t:"Itens do estoque", ic:"package", estado:itens.length ? "feito" : "atual"},
        e(Entrada,{rot:"Buscar item", v:f.bi, set:function(v){ set("bi", v); }, ph:"Nome ou código"}),
        est.length===0 && e("p",{className:"rounded-lg bg-black/20 px-2 py-3 text-[12.5px] text-white/70"}, f.bi ? "Nenhum item encontrado." : "O estoque de expositores está vazio. Cadastre os itens na aba Estoque de expositores."),
        est.map(function(i){ var q = Number(f.qtd[i.id]) || 0, saldo = saldoDe(i);
          return e("div",{key:i.id, className:"flex flex-col items-center gap-1 rounded-lg bg-black/25 px-2 py-1.5 "+(q>0 ? "ring-1 ring-[#F97316]/60" : "")},
            e("b",{className:"text-[13px] leading-tight"}, i.nome),
            e("span",{className:"text-[11.5px] text-white/65"}, "Código "+i.codigo+" · "+formatarReais(i.valorUnitario)),
            e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
              e(Selo,{cor:i.baixo ? "#FBBF24" : "#94A3B8"}, "Saldo "+saldo),
              e("button",{type:"button", "aria-label":"Tirar uma unidade", onClick:function(){ setQtd(i.id, q-1); }, className:btn}, "−"),
              e("input",{type:"number", min:0, value:q || "", placeholder:"0", "aria-label":"Quantidade de "+i.nome, onChange:function(ev){ setQtd(i.id, ev.target.value); }, className:INPUT+" h-8! w-16 text-center "+MONO+" text-[13px]!"}),
              e("button",{type:"button", "aria-label":"Acrescentar uma unidade", onClick:function(){ setQtd(i.id, q+1); }, className:btn}, "+"))); }),
        e("div",{className:"flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5", style:{background:"linear-gradient(135deg,"+LARANJA+"33,"+LARANJA+"0d 78%)", boxShadow:"inset 0 0 0 1px "+LARANJA+"55"}},
          e("b",{className:MONO+" text-[17px] leading-none"}, previa.totalPecas+(previa.totalPecas===1 ? " peça" : " peças")+" · "+formatarReais(previa.valorTotal)),
          e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, "Prévia da montagem"),
          previa.erros.map(function(m, i){ return e("span",{key:i, className:"text-[12px] font-bold text-[#F87171]"}, m); }))),
      e(Painel,{t:"Saída e fotos", ic:"truck", estado:comCliente && f.dataSaida ? "feito" : undefined},
        e(Chips,{rot:"Status", v:f.status, set:mudaStatus, opcoes:[["BIPADO", ROTULO_STATUS.BIPADO, corTom(tomStatus("BIPADO"))], ["ESTA_COM_CLIENTE", ROTULO_STATUS.ESTA_COM_CLIENTE, corTom(tomStatus("ESTA_COM_CLIENTE"))]]}),
        comCliente && e(Entrada,{rot:"Data de saída", tipo:"date", v:f.dataSaida, set:function(v){ set("dataSaida", v); }}),
        comCliente && e(Entrada,{rot:"Retirado por", v:f.retirado, set:function(v){ set("retirado", v); }}),
        e(Area,{rot:"Observações", v:f.obs, set:function(v){ set("obs", v); }}),
        e(Fotos,{slots:SLOTS_FOTO, valores:fotosAtuais || {}, onSet:onFoto}))),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:cond ? "check" : "package", onClick:enviar}, cond ? "Salvar alterações" : "Montar expositor")));
}

// ───────────── saída com a cliente ─────────────
function JanelaSaida(p){
  var c = p.c, cond = exCondicional(c.s, p.condId), pad = exPadraoSaida("ESTA_COM_CLIENTE", c.por, c.hoje), st = useState({data:pad.dataSaida, quem:pad.retiradoPorNome}), f = st[0];
  if(!cond) return null;
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var ok = function(){ if(c.exec(payloadEdicao(cond, {status:"ESTA_COM_CLIENTE", dataSaida:f.data, retiradoPorNome:f.quem}))) p.fechar(); };
  return e(Janela,{t:"Saída com a cliente", sub:"Nº "+rotuloNumero(cond)+" · "+cond.nome, tam:"sm", fechar:p.fechar},
    e(Entrada,{rot:"Data de saída", tipo:"date", v:f.data, set:function(v){ set("data", v); }}),
    e(Entrada,{rot:"Retirado por", v:f.quem, set:function(v){ set("quem", v); }}),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"truck", onClick:ok}, "Registrar saída")));
}

// ───────────── devolução ─────────────
function JanelaDevolver(p){
  var c = p.c, cond = exCondicional(c.s, p.condId);
  var st = useState({condicao:"", data:c.hoje, obs:"", tipo:"", resp:"", motivo:"", desc:"", valor:null, fotos:{avaria:null, avaria2:null}}), f = st[0];
  if(!cond) return null;
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var dan = f.condicao==="DANIFICADO", volta = CONDICOES_QUE_VOLTAM.indexOf(f.condicao)>=0;
  var ok = function(){
    var r = c.exec({op:"cond_devolver", id:cond.id, condicaoDevolucao:f.condicao, dataDevolucao:f.data, observacaoDevolucao:f.obs, tipoAvaria:f.tipo || null, responsavelDevolucao:f.resp, motivoDevolucao:f.motivo, descricaoAvaria:f.desc, valorEstimadoReparo:f.valor});
    if(!r) return;
    if(dan) ["avaria", "avaria2"].forEach(function(sl){ if(f.fotos[sl]) c.direto({op:"cond_foto", id:cond.id, slot:sl, foto:f.fotos[sl]}); });
    p.fechar();
  };
  return e(Janela,{t:"Devolução do expositor", sub:"Nº "+rotuloNumero(cond)+" · "+cond.nome+" · "+textoPecas(cond), tam:dan ? "xl" : "md", fechar:p.fechar},
    e(Colunas,{n:dan ? 2 : 1},
      e(Painel,{t:"Condição na devolução", ic:"seal-check", estado:f.condicao ? "feito" : "atual"},
        e(Chips,{v:f.condicao, set:function(v){ set("condicao", v); }, opcoes:CONDICOES.map(function(k){ return [k, ROTULO_CONDICAO[k], corTom(TOM_CONDICAO[k])]; })}),
        f.condicao && e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[12px] text-white/80"}, volta ? "As peças voltam ao estoque." : "As peças não voltam ao estoque."),
        e(Entrada,{rot:"Data da devolução", tipo:"date", v:f.data, set:function(v){ set("data", v); }}),
        e(Area,{rot:"Observações da devolução", v:f.obs, set:function(v){ set("obs", v); }})),
      dan && e(Painel,{t:"Avaria", ic:"warning", estado:f.tipo ? "feito" : "atual"},
        e(Chips,{rot:"Tipo de avaria", v:f.tipo, set:function(v){ set("tipo", v); }, opcoes:TIPOS_AVARIA.map(function(k){ return [k, ROTULO_AVARIA[k]]; })}),
        e(Entrada,{rot:"Responsável", v:f.resp, set:function(v){ set("resp", v); }}),
        e(Entrada,{rot:"Motivo", v:f.motivo, set:function(v){ set("motivo", v); }}),
        e(Area,{rot:"Descrição da avaria", v:f.desc, set:function(v){ set("desc", v); }}),
        e("div",{className:"flex flex-col gap-1"}, e("span",{className:"text-center text-[12px] font-bold"}, "Valor estimado do reparo"), e(Dinheiro,{value:f.valor || 0, label:"Valor estimado do reparo", onChange:function(v){ set("valor", v || null); }})),
        e(Fotos,{slots:["avaria", "avaria2"], valores:f.fotos, onSet:function(sl, foto){ var n = Object.assign({}, f.fotos); n[sl] = foto; set("fotos", n); }}))),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t border-white/10 pt-2.5"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"arrow-u-up-left", disabled:!f.condicao, onClick:ok}, "Registrar devolução")));
}

// ───────────── detalhe ─────────────
function Dado(p){
  if(p.v==null || p.v==="") return null;
  return e("div",{className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-2 py-1 text-center"},
    e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, p.t), e("span",{className:"break-words text-[13px] font-semibold "+(p.mono ? MONO : "")}, p.v));
}
function JanelaDetalhe(p){
  var c = p.c, s = c.s, cond = exCondicional(s, p.condId), st = useState({motivo:"", excluir:false}), f = st[0];
  if(!cond) return null;
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var dev = cond.status==="DEVOLVIDO", fora = cond.status==="ESTA_COM_CLIENTE", dias = exDiasComCliente(cond), aviso = exPassouDoAviso(s, cond);
  var passos = [{t:"Montado", sub:formatarDataHora(cond.criadoEm)+(cond.criadoPor ? " · "+cond.criadoPor : ""), estado:"feito"},
    {t:"Saiu com a cliente", sub:cond.dataSaida ? formatarDia(cond.dataSaida)+(cond.retiradoPorNome ? " · "+cond.retiradoPorNome : "") : "Aguardando a saída", estado:cond.status==="BIPADO" ? "atual" : "feito"}];
  if(cond.pedirDeVolta) passos.push({t:"Pedido de devolução", sub:formatarDataHora(cond.pedirDeVoltaData)+(cond.pedirDeVoltaMotivo ? " · "+cond.pedirDeVoltaMotivo : ""), estado:"atual"});
  passos.push({t:"Devolvido", sub:dev ? formatarDataHora(cond.dataDevolucao)+" · "+ROTULO_CONDICAO[cond.condicaoDevolucao] : fora ? "Aguardando a devolução" : "", estado:dev ? (TOM_CONDICAO[cond.condicaoDevolucao]==="destructive" ? "cancelado" : "feito") : fora ? "atual" : "futuro"});
  var onFoto = function(sl, foto){ if(foto) c.exec({op:"cond_foto", id:cond.id, slot:sl, foto:foto}); else c.exec({op:"cond_foto_del", id:cond.id, slot:sl}); };
  var pedir = function(on){ if(c.exec({op:"cond_pedir_volta", id:cond.id, pedirDeVolta:on, motivo:f.motivo})) set("motivo", ""); };
  var del = function(){ if(c.exec({op:"cond_del", id:cond.id})) p.fechar(); };
  return e(Janela,{t:"Expositor nº "+rotuloNumero(cond), sub:cond.nome, tam:"xl", fechar:p.fechar},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e(SeloTom,{tom:tomStatus(cond.status)}, ROTULO_STATUS[cond.status]),
      cond.pedirDeVolta && e(SeloTom,{tom:"destructive", ic:"bell-ringing"}, "Pedir de volta"),
      aviso && e(SeloTom,{tom:"warning", ic:"hourglass"}, "Com a cliente há "+dias+" dias"),
      dev && cond.condicaoDevolucao && e(SeloTom,{tom:TOM_CONDICAO[cond.condicaoDevolucao]}, ROTULO_CONDICAO[cond.condicaoDevolucao])),
    e(Colunas,{n:3},
      e(Painel,{t:"Dados", ic:"identification-card"},
        e(Dado,{t:"Cliente", v:cond.nome}), e(Dado,{t:"Telefone", v:cond.telefone, mono:true}), e(Dado,{t:"Endereço", v:cond.endereco}), e(Dado,{t:"Vínculo", v:textoVinculo(cond.vinculo)}),
        e(Dado,{t:"Peças", v:textoPecas(cond)}), e(Dado,{t:"Valor", v:formatarReais(cond.valorTotal), mono:true}),
        e(Dado,{t:"Data de saída", v:formatarDia(cond.dataSaida)}), e(Dado,{t:"Retirado por", v:cond.retiradoPorNome}),
        !aviso && dias!=null && e(Dado,{t:"Com a cliente há", v:dias+(dias===1 ? " dia" : " dias")}),
        e(Dado,{t:"Observações", v:cond.observacoes}),
        dev && e(Dado,{t:"Observações da devolução", v:cond.observacaoDevolucao}),
        dev && cond.condicaoDevolucao==="DANIFICADO" && e("div",{className:"flex flex-col gap-1.5 rounded-lg p-1.5", style:{boxShadow:"inset 0 0 0 1px #EF444455"}},
          e(Dado,{t:"Tipo de avaria", v:cond.tipoAvaria ? ROTULO_AVARIA[cond.tipoAvaria] : ""}), e(Dado,{t:"Responsável", v:cond.responsavelDevolucao}), e(Dado,{t:"Motivo", v:cond.motivoDevolucao}), e(Dado,{t:"Descrição", v:cond.descricaoAvaria}),
          e(Dado,{t:"Reparo estimado", v:cond.valorEstimadoReparo!=null ? formatarReais(cond.valorEstimadoReparo) : "", mono:true}), e(Dado,{t:"Situação do reparo", v:cond.statusAvaria ? rotuloStatusAvaria(cond.statusAvaria) : ""}))),
      e(Painel,{t:"Linha do tempo, itens e fotos", ic:"clock-counter-clockwise"},
        e(Passos,{passos:passos}),
        cond.itens.length>0 ? e("div",{className:"flex flex-col gap-1"}, cond.itens.map(function(i){ return e("div",{key:i.estoqueItemId, className:"flex flex-wrap items-center justify-center gap-x-2 rounded-lg bg-black/25 px-2 py-1 text-[12.5px]"}, e("b",null, i.nome), e("span",{className:MONO+" text-white/75"}, i.quantidade+" × "+formatarReais(i.valorUnitario))); }))
          : e("p",{className:"rounded-lg bg-black/20 px-2 py-2 text-[12.5px] text-white/65"}, "Sem itens do estoque registrados."),
        e(Fotos,{slots:SLOTS_FOTO, valores:cond.fotos || {}, onSet:onFoto})),
      e(Painel,{t:"Ações", ic:"lightning"},
        !dev && e(Bt,{ic:"pencil-simple", onClick:function(){ p.editar(cond.id); }}, "Editar expositor"),
        fora && e(Bt,{tipo:"forte", ic:"arrow-u-up-left", onClick:function(){ p.devolver(cond.id); }}, "Registrar devolução"),
        cond.status==="BIPADO" && e(Bt,{tipo:"forte", ic:"truck", onClick:function(){ p.saida(cond.id); }}, "Registrar saída"),
        !dev && (cond.pedirDeVolta
          ? e(Bt,{ic:"bell-slash", onClick:function(){ pedir(false); }}, "Desmarcar pedido de devolução")
          : e("div",{className:"flex flex-col gap-1.5 rounded-lg bg-black/20 p-2"}, e(Area,{rot:"Motivo do pedido de devolução", v:f.motivo, set:function(v){ set("motivo", v); }}), e(Bt,{tipo:"marca", ic:"bell-ringing", onClick:function(){ pedir(true); }}, "Pedir de volta"))),
        e(Bt,{tipo:"perigo", ic:"trash", onClick:function(){ set("excluir", true); }}, "Excluir expositor"))),
    f.excluir && e(Confirmar,{t:"Excluir o expositor nº "+rotuloNumero(cond)+"?", sub:fora || cond.status==="BIPADO" ? "As peças voltam ao estoque." : "Esta ação não pode ser desfeita.", fechar:function(){ set("excluir", false); }, ok:del}));
}

export { payloadEdicao, Fotos, JanelaMontar, JanelaSaida, JanelaDevolver, JanelaDetalhe, Dado };
