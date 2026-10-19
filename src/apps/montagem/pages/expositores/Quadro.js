// Sorelly Admin · montagem — pages/expositores/Quadro.js
// Expositores → Quadro: indicadores, barra única de filtros e o KANBAN de expositores (padrão visual: fluxo por etapas = Kanban).
// Colunas: Na fila → Bipado → Está com a cliente → Devolvido. Arrastar, "Mover para…" e "Concluir etapa ›" chamam as ações do domínio
// e abrem a janela certa quando faltam dados (montar, saída, devolução). Movimento inválido mostra a mensagem formal do domínio.
import { Faixa, Indicador } from "@/apps/montagem/components/padrao";
import { ROTULO_CONDICAO, ROTULO_STATUS, ROTULO_VINCULO, TIPOS_VINCULO, TOM_CONDICAO, exCondicionais, exDiasComCliente, exFila, exPassouDoAviso, exReduz, exResumo, formatarDia, formatarReais, rotuloNumero } from "@/apps/montagem/domain/expositores";
import { Alternar, Bt, BtMini, BarraFiltros, Busca, Chip, FiltroData, Selo } from "@/apps/montagem/pages/indicacoes/visual";
import { JanelaDetalhe, JanelaDevolver, JanelaMontar, JanelaSaida, payloadEdicao } from "@/apps/montagem/pages/expositores/janelas";
import { SeloTom, corTom, textoPecas, textoVinculo, useEx } from "@/apps/montagem/pages/expositores/comum";
import { Kanban } from "@/shared/kanban";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR = {fila:"#94A3B8", BIPADO:"#60A5FA", ESTA_COM_CLIENTE:"#F97316", DEVOLVIDO:"#4ADE80"};
var FILTRO0 = {q:"", pedir:false, de:"", ate:"", vinc:""};
// próxima etapa de cada coluna ("Concluir etapa ›")
var PROXIMA = {fila:"BIPADO", BIPADO:"ESTA_COM_CLIENTE", ESTA_COM_CLIENTE:"DEVOLVIDO"};

function CartaoExpositor(p){
  var it = p.it, c = p.c, s = c.s;
  if(it.tipo==="fila"){ var f = it.fila;
    return e("div",{className:"flex flex-col items-center gap-1"},
      e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, e(Selo,{cor:COR.fila, ic:"hourglass"}, "Na fila"), f.vinculo && f.vinculo.tipo && e(Selo,{cor:"#F97316"}, ROTULO_VINCULO[f.vinculo.tipo])),
      e("b",{className:"text-[13.5px] leading-tight"}, f.nome), e("span",{className:MONO+" text-[12px] text-white/70"}, f.telefone),
      f.dataAcerto && e("span",{className:"text-[11.5px] text-white/65"}, "Acerto em "+formatarDia(f.dataAcerto)),
      e("div",{className:"mt-0.5"}, e(BtMini,{forte:true, titulo:"Montar o expositor", onClick:function(){ p.avancar(it); }}, "Concluir etapa ›")));
  }
  var k = it.cond, dias = exDiasComCliente(k), aviso = exPassouDoAviso(s, k), dan = k.status==="DEVOLVIDO" && k.condicaoDevolucao==="DANIFICADO";
  return e("div",{className:"flex flex-col items-center gap-1"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, e("span",{className:MONO+" rounded-md bg-black/35 px-1.5 py-0.5 text-[11.5px] font-bold"}, "Nº "+rotuloNumero(k)),
      k.pedirDeVolta && e(SeloTom,{tom:"destructive", ic:"bell-ringing"}, "Pedir de volta"),
      dias!=null && e(SeloTom,{tom:aviso ? "warning" : "muted", ic:"hourglass", titulo:aviso ? "Passou do prazo de aviso da devolução" : undefined}, dias+(dias===1 ? " dia" : " dias")),
      k.status==="DEVOLVIDO" && k.condicaoDevolucao && e(SeloTom,{tom:TOM_CONDICAO[k.condicaoDevolucao], ic:dan ? "warning" : undefined}, ROTULO_CONDICAO[k.condicaoDevolucao])),
    e("b",{className:"text-[13.5px] leading-tight"}, k.nome), e("span",{className:MONO+" text-[12px] text-white/70"}, k.telefone),
    e("span",{className:"text-[11.5px] text-white/65"}, textoPecas(k)+" · "+k.itens.length+(k.itens.length===1 ? " item" : " itens")),
    e("span",{className:MONO+" text-[12.5px] font-bold"}, formatarReais(k.valorTotal)),
    k.vinculo && textoVinculo(k.vinculo) && e("span",{className:"text-[11px] text-white/55"}, textoVinculo(k.vinculo)),
    PROXIMA[k.status] && e("div",{className:"mt-0.5"}, e(BtMini,{forte:true, titulo:k.status==="BIPADO" ? "Registrar a saída com a cliente" : "Registrar a devolução", onClick:function(){ p.avancar(it); }}, "Concluir etapa ›")));
}

function AbaExQuadro(){
  var c = useEx(), s = c.s, st = useState(FILTRO0), f = st[0], jan = useState(null), j = jan[0];
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); };
  var ativo = !!(f.q || f.pedir || f.de || f.ate || f.vinc);
  var r = exResumo(s);
  var conds = exCondicionais(s, {busca:f.q, pedirDeVolta:f.pedir, de:f.de || undefined, ate:f.ate || undefined, vinculo:f.vinc ? {tipo:f.vinc} : undefined});
  var fila = exFila(s, {busca:f.q}).filter(function(x){ return (!f.vinc || (x.vinculo && x.vinculo.tipo===f.vinc)) && (!f.de || (x.dataAcerto && x.dataAcerto>=f.de)) && (!f.ate || (x.dataAcerto && x.dataAcerto<=f.ate)); });
  if(f.pedir) fila = [];

  var itensDe = function(st0){ return conds.filter(function(x){ return x.status===st0; }).map(function(x){ return {id:x.id, tipo:"cond", cond:x, arrastavel:st0!=="DEVOLVIDO"}; }); };
  // aceita: fila não recebe nada; devolvido não sai; fila só vai para Bipado ou Está com a cliente; os demais seguem a ordem das etapas
  var aceita = function(para){ return function(it, de){
    if(para==="fila" || de==="DEVOLVIDO") return false;
    if(it.tipo==="fila") return para==="BIPADO" || para==="ESTA_COM_CLIENTE";
    if(para==="BIPADO") return de==="ESTA_COM_CLIENTE";
    return true;
  }; };
  var colunas = [
    {k:"fila", titulo:"Na fila", cor:COR.fila, itens:fila.map(function(x){ return {id:x.id, tipo:"fila", fila:x, arrastavel:true}; }), aceita:aceita("fila")},
    {k:"BIPADO", titulo:ROTULO_STATUS.BIPADO, cor:COR.BIPADO, itens:itensDe("BIPADO"), aceita:aceita("BIPADO")},
    {k:"ESTA_COM_CLIENTE", titulo:ROTULO_STATUS.ESTA_COM_CLIENTE, cor:COR.ESTA_COM_CLIENTE, itens:itensDe("ESTA_COM_CLIENTE"), aceita:aceita("ESTA_COM_CLIENTE")},
    {k:"DEVOLVIDO", titulo:ROTULO_STATUS.DEVOLVIDO, cor:COR.DEVOLVIDO, itens:itensDe("DEVOLVIDO"), aceita:aceita("DEVOLVIDO")}];

  var fechar = function(){ jan[1](null); };
  var mover = function(it, de, para){
    if(it.tipo==="fila"){
      if(para==="BIPADO" || para==="ESTA_COM_CLIENTE") jan[1]({t:"montar", fila:it.fila, status:para}); else c.aviso("Uma entrada da fila só pode ser montada como expositor.");
      return;
    }
    var k = it.cond;
    if(para==="ESTA_COM_CLIENTE" && de==="BIPADO") return jan[1]({t:"saida", id:k.id});
    if(para==="BIPADO" && de==="ESTA_COM_CLIENTE") return void c.exec(payloadEdicao(k, {status:"BIPADO", dataSaida:null, retiradoPorNome:null}));
    if(para==="DEVOLVIDO"){
      if(de==="ESTA_COM_CLIENTE") return jan[1]({t:"devolver", id:k.id});
      return void c.aviso(exReduz(s, {op:"cond_devolver", id:k.id, condicaoDevolucao:"BOM"}).msg || "Movimento não permitido.");   // mensagem formal do domínio
    }
    c.aviso("Movimento não permitido.");
  };
  var avancar = function(it){ var de = it.tipo==="fila" ? "fila" : it.cond.status; if(PROXIMA[de]) mover(it, de, PROXIMA[de]); };
  var total = fila.length+conds.length;

  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:6},
      e(Indicador,{t:"Na fila", v:r.naFila, cor:"#94A3B8"}), e(Indicador,{t:"Bipados", v:r.bipados, cor:"info"}), e(Indicador,{t:"Com a cliente", v:r.comCliente, cor:"#F97316"}),
      e(Indicador,{t:"Devolvidos", v:r.devolvidos, cor:"ok"}), e(Indicador,{t:"Pedir de volta", v:r.pedirDeVolta, cor:"ruim"}), e(Indicador,{t:"Valor na rua", v:formatarReais(r.valorNaRua), cor:"total"})),
    e(BarraFiltros,{limpar:ativo ? function(){ st[1](FILTRO0); } : undefined},
      e(Busca,{v:f.q, set:function(v){ set("q", v); }, ph:"Buscar por nome, telefone ou número"}),
      e(Alternar,{on:f.pedir, set:function(v){ set("pedir", v); }, ic:"bell-ringing"}, "Pedir de volta"),
      e(FiltroData,{rot:"Saída de", v:f.de, set:function(v){ set("de", v); }}), e(FiltroData,{rot:"até", v:f.ate, min:f.de, set:function(v){ set("ate", v); }}),
      TIPOS_VINCULO.map(function(t){ return e(Chip,{key:t, on:f.vinc===t, onClick:function(){ set("vinc", f.vinc===t ? "" : t); }}, ROTULO_VINCULO[t]); }),
      e("span",{className:MONO+" text-[12px] text-white/70"}, total+(total===1 ? " resultado" : " resultados")),
      e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", onClick:function(){ jan[1]({t:"montar"}); }}, "Montar expositor")),
    e(Kanban,{colunas:colunas, unidade:["expositor", "expositores"], vazio:"Nenhum expositor nesta etapa.",
      card:function(it){ return e(CartaoExpositor,{it:it, c:c, avancar:avancar}); },
      onMover:mover,
      onAbrir:function(it){ if(it.tipo==="fila") jan[1]({t:"montar", fila:it.fila, status:"BIPADO"}); else jan[1]({t:"detalhe", id:it.cond.id}); }}),
    j && j.t==="montar" && e(JanelaMontar,{key:"m"+(j.fila ? j.fila.id : "")+(j.status || ""), c:c, fila:j.fila, status:j.status, fechar:fechar}),
    j && j.t==="editar" && e(JanelaMontar,{key:"e"+j.id, c:c, condId:j.id, fechar:function(){ jan[1]({t:"detalhe", id:j.id}); }}),
    j && j.t==="saida" && e(JanelaSaida,{key:"s"+j.id, c:c, condId:j.id, fechar:fechar}),
    j && j.t==="devolver" && e(JanelaDevolver,{key:"d"+j.id, c:c, condId:j.id, fechar:fechar}),
    j && j.t==="detalhe" && e(JanelaDetalhe,{key:"x"+j.id, c:c, condId:j.id, fechar:fechar, editar:function(id){ jan[1]({t:"editar", id:id}); }, devolver:function(id){ jan[1]({t:"devolver", id:id}); }, saida:function(id){ jan[1]({t:"saida", id:id}); }}));
}

export { AbaExQuadro, CartaoExpositor };
