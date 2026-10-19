// Sorelly Admin · montagem — pages/compras/EstoqueSolicitacoes.js
// Materiais & Estoque → aba "Solicitações": pedidos de compra de material como KANBAN (Pendente de decisão, Segurada, Aprovada, Recebida, Recusada).
// Só quem pode aprovar compras decide (autorização "Aprovar compras"). Arrastar ou "Mover para…" abre a janela da solicitação já com a etapa escolhida.
// Regras no domínio: sol_decidir (uma decisão só, a partir de Pendente) e sol_set (dados da compra e recebimento; o recebimento dá entrada no estoque).
import { BarraFiltros, Dinheiro, ESTADO, Janela, Pagina } from "@/apps/montagem/components/padrao";
import { FORMAS_PAGAMENTO, ROTULO_FORMA, ROTULO_SOL, formatarDia, formatarReais, hojeSP, listarSolicitacoes } from "@/apps/montagem/domain/compras-estoque";
import { Bt, Busca, Campo, Painel, Sel, Selo, Vazio, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { Kanban } from "@/shared/kanban";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var dia = function(iso){ return iso ? String(iso).slice(0, 10) : ""; };
var COR_SOL = {SOLICITADO:"alerta", SEGURAR:"neutro", APROVADO:"info", RECEBIDO:"ok", RECUSADO:"ruim"};
var DECISOES = [["APROVADO", "Aprovar", "check-circle", "ok"], ["SEGURAR", "Segurar", "pause-circle", "neutro"], ["RECUSADO", "Recusar", "x-circle", "perigo"]];

// passos da linha do tempo da solicitação
function passos(s){
  var dec = s.status!=="SOLICITADO", ap = s.status==="APROVADO" || s.status==="RECEBIDO";
  return [{t:"Solicitada", sub:formatarDia(dia(s.solicitadoEm))+" · "+(s.solicitadoPor||"—"), estado:"feito"},
    {t:dec ? ROTULO_SOL[s.status] : "Decisão pendente", sub:dec ? formatarDia(dia(s.decididoEm))+" · "+(s.decididoPor||"—") : "Aguarda quem aprova compras", estado:dec ? (s.status==="RECUSADO" ? "cancelado" : "feito") : "atual"},
    {t:"Compra efetuada", sub:s.dataCompra ? formatarDia(s.dataCompra) : (s.dataPrevisaoChegada ? "Previsão de chegada "+formatarDia(s.dataPrevisaoChegada) : "Sem data"), estado:s.dataCompra || s.status==="RECEBIDO" ? "feito" : ap ? "atual" : "futuro"},
    {t:"Recebida", sub:s.dataRecebimento ? formatarDia(s.dataRecebimento) : "Entrada no estoque ao receber", estado:s.status==="RECEBIDO" ? "feito" : "futuro"}];
}
var COR_PASSO = {feito:"#4ADE80", atual:"#3B82F6", futuro:"#94A3B8", cancelado:"#EF4444"}, IC_PASSO = {feito:"check-circle", atual:"circle-notch", futuro:"circle", cancelado:"x-circle"};
function Linha(p){
  return e("div",{className:"flex flex-col gap-1.5"}, p.passos.map(function(x, i){ var c = COR_PASSO[x.estado];
    return e("div",{key:i, className:"flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left", style:{background:x.estado==="atual" ? "#3B82F626" : "rgba(255,255,255,.05)", boxShadow:"inset 0 0 0 1px "+(x.estado==="atual" ? "#3B82F6AA" : c+"33"), opacity:x.estado==="futuro" ? 0.7 : 1}},
      e(Ph,{n:IC_PASSO[x.estado], s:15, fill:x.estado==="feito", style:{color:c}}), e("span",{className:"flex flex-col leading-tight"}, e("b",{className:"text-[12.5px]", style:{color:x.estado==="futuro" ? undefined : c}}, x.t), e("span",{className:"text-[11px] text-white/65"}, x.sub))); }));
}

// ───────────── janela da solicitação ─────────────
function JanelaSol(p){
  var s = p.s, x = p.x, ce = x.ce, podeDecidir = x.aprova && s.status==="SOLICITADO", podeOperar = (x.caps.length>0 || x.aprova) && (s.status==="APROVADO" || s.status==="RECEBIDO");
  var f = useState({dec:p.sug && p.sug!=="RECEBIDO" ? p.sug : "", obs:"", dataCompra:s.dataCompra||"", prev:s.dataPrevisaoChegada||"", valor:s.valor||0, venc:s.vencimento||"", forma:s.formaPagamento||"", forn:s.fornecedorId==null ? "" : String(s.fornecedorId), pago:!!s.pago, qtd:String(s.quantidade), rec:p.sug==="RECEBIDO" ? hojeSP() : (s.dataRecebimento||"")}), v = f[0];
  var er = useState(""), erro = er[0];
  var set = function(k, val){ f[1](function(o){ var n = Object.assign({}, o); n[k] = val; return n; }); er[1](""); };
  var fornObj = function(id){ return id==="" ? null : ce.fornecedores.filter(function(z){ return String(z.id)===id; })[0]; };
  var dadosCompra = function(){ var fo = fornObj(v.forn); return {id:s.id, quantidade:Number(v.qtd), dataCompra:v.dataCompra, dataPrevisaoChegada:v.prev, vencimento:v.venc, valor:v.valor>0 ? v.valor : "", formaPagamento:v.forma, fornecedorId:fo ? fo.id : "", pago:v.pago}; };
  var decidir = function(){
    if(!v.dec){ er[1]("Escolha a decisão."); return; } if(v.dec==="RECUSADO" && !v.obs.trim()){ er[1]("Informe o motivo da recusa."); return; }
    if(x.exec("sol_decidir", {id:s.id, status:v.dec, observacao:v.obs})) p.fechar();
  };
  var salvar = function(){ if(Number(v.qtd)<1){ er[1]("A quantidade deve ser de 1 em diante."); return; } if(x.exec("sol_set", dadosCompra())) p.fechar(); };
  var receber = function(){ if(!v.rec){ er[1]("Informe a data do recebimento."); return; } if(x.exec("sol_set", Object.assign(dadosCompra(), {dataRecebimento:v.rec}))) p.fechar(); };
  var cx = "w-full text-center "+INPUT;
  var forn = s.fornecedorId!=null ? (ce.fornecedores.filter(function(z){ return String(z.id)===String(s.fornecedorId); })[0]||{}).nome : "";
  var cols = [
    e(Painel,{key:"d", t:"Solicitação", estado:"feito"},
      e("div",{className:"flex flex-col items-center gap-1.5"}, e("b",{className:"text-[14px] leading-tight"}, s.material), e(Selo,{cor:COR_SOL[s.status]}, ROTULO_SOL[s.status]),
        e("div",{className:"flex flex-col items-center rounded-lg bg-black/25 px-3 py-1"}, e("b",{className:MONO+" text-[19px] leading-none"}, s.quantidade), e("span",{className:"text-[10px] font-bold uppercase tracking-wide text-white/70"}, s.unidade || "Quantidade")),
        e("span",{className:"text-[12px] text-white/70"}, "Solicitada por "+(s.solicitadoPor||"—")+" em "+formatarDia(dia(s.solicitadoEm))), forn && e("span",{className:"text-[12px] text-white/70"}, "Fornecedor: "+forn),
        s.valor>0 && e("span",{className:"text-[12px] text-white/70"}, "Valor: "+formatarReais(s.valor)), s.observacao && e("p",{className:"rounded-lg bg-black/25 px-2 py-1.5 text-[12px] text-white/85"}, s.observacao))),
    e(Painel,{key:"l", t:"Etapas", ic:"clock-counter-clockwise", estado:"atual"}, e(Linha,{passos:passos(s)}),
      podeOperar && e("div",{className:"flex flex-col gap-2 border-t border-white/10 pt-2"}, e("span",{className:"text-[11px] font-bold uppercase text-white/70"}, "Dados da compra"),
        e(Campo,{rot:"Quantidade"}, e("input",{type:"number", min:1, step:1, value:v.qtd, onChange:function(ev){ set("qtd", ev.target.value); }, className:cx})),
        e(Campo,{rot:"Data da compra"}, e("input",{type:"date", value:v.dataCompra, onChange:function(ev){ set("dataCompra", ev.target.value); }, className:cx})),
        e(Campo,{rot:"Previsão de chegada"}, e("input",{type:"date", value:v.prev, onChange:function(ev){ set("prev", ev.target.value); }, className:cx})),
        e(Campo,{rot:"Valor da compra"}, e(Dinheiro,{value:v.valor, label:"Valor da compra", onChange:function(val){ set("valor", val); }})),
        e(Campo,{rot:"Vencimento"}, e("input",{type:"date", value:v.venc, onChange:function(ev){ set("venc", ev.target.value); }, className:cx})),
        e(Campo,{rot:"Forma de pagamento"}, e("select",{value:v.forma, onChange:function(ev){ set("forma", ev.target.value); }, className:cx+" cursor-pointer"}, [e("option",{key:"", value:""}, "Não informada")].concat(FORMAS_PAGAMENTO.map(function(k){ return e("option",{key:k, value:k}, ROTULO_FORMA[k]); })))),
        e(Campo,{rot:"Fornecedor"}, e("select",{value:v.forn, onChange:function(ev){ set("forn", ev.target.value); }, className:cx+" cursor-pointer"}, [e("option",{key:"", value:""}, "Sem fornecedor definido")].concat(ce.fornecedores.filter(function(z){ return z.ativo!==false || String(z.id)===v.forn; }).map(function(z){ return e("option",{key:z.id, value:String(z.id)}, z.nome); })))),
        e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold hover:bg-white/15"}, e("input",{type:"checkbox", checked:v.pago, onChange:function(ev){ set("pago", ev.target.checked); }}), "Compra paga"))),
    e(Painel,{key:"a", t:"Ações", ic:"gear", estado:podeDecidir || (podeOperar && s.status==="APROVADO") ? "atual" : undefined},
      erro && e("p",{role:"alert", className:"rounded-lg bg-[#EF4444]/20 px-2 py-1.5 text-[12.5px] font-bold text-[#F87171]"}, erro),
      s.status==="SOLICITADO" && !x.aprova && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12px] font-bold text-[#FBBF24]"}, "Somente quem possui a autorização Aprovar compras decide esta solicitação."),
      podeDecidir && e("div",{className:"flex flex-col gap-2"}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, DECISOES.map(function(d){ var on = v.dec===d[0], c = ESTADO[COR_SOL[d[0]]];
        return e("button",{key:d[0], type:"button", onClick:function(){ set("dec", d[0]); }, className:"inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-bold ring-1 transition "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,"+c+"66,"+c+"22)", boxShadow:"inset 0 0 0 1px "+c+"cc"} : undefined}, e(Ph,{n:d[2], s:15}), d[1]); })),
        e(Campo,{rot:v.dec==="RECUSADO" ? "Motivo da recusa *" : "Observação"}, e("textarea",{value:v.obs, rows:3, onChange:function(ev){ set("obs", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"})),
        e(Bt,{tipo:"forte", ic:"check", onClick:decidir}, "Confirmar decisão")),
      podeOperar && e(Bt,{ic:"floppy-disk", onClick:salvar}, "Salvar dados da compra"),
      podeOperar && s.status==="APROVADO" && e("div",{className:"flex flex-col gap-2 border-t border-white/10 pt-2"}, e(Campo,{rot:"Data do recebimento"}, e("input",{type:"date", max:hojeSP(), value:v.rec, onChange:function(ev){ set("rec", ev.target.value); }, className:cx})),
        e(Bt,{tipo:"ok", ic:"truck", onClick:receber}, "Registrar recebimento")),
      s.status==="RECEBIDO" && e("p",{className:"rounded-lg bg-[#22C55E]/15 px-2 py-1.5 text-[12px] font-bold text-[#4ADE80]"}, "Recebida"+(s.dataRecebimento ? " em "+formatarDia(s.dataRecebimento) : "")+(s.entradaId ? ". Entrada lançada no estoque." : ".")),
      e(Bt,{ic:"x", onClick:p.fechar}, "Fechar"))];
  return e(Janela,{t:"Solicitação de compra", sub:s.material+" · "+s.quantidade, fechar:p.fechar, colunas:cols});
}

// ───────────── tela ─────────────
function AbaEstoqueSolicitacoes(pr){
  var x = useCe(), s = x.s, tipos = x.cfg.tipos, sT = useState(""), sQ = useState(""), sJ = useState((pr && pr.janIni) || null);
  var alvo = norm(sQ[0]), podeOperar = x.caps.length>0 || x.aprova;
  var todas = listarSolicitacoes(s, {tipoId:sT[0] || undefined}).filter(function(r){ return !alvo || norm(r.material).indexOf(alvo)>=0; });
  var fornNome = function(id){ var z = id==null ? null : x.ce.fornecedores.filter(function(f){ return String(f.id)===String(id); })[0]; return z ? z.nome : ""; };
  var de = function(st, arr){ return todas.filter(function(r){ return r.status===st; }).map(function(r){ return Object.assign({}, r, {arrastavel:arr(r)}); }); };
  var colunas = [
    {k:"SOLICITADO", titulo:"Pendente de decisão", cor:ESTADO.alerta, dica:"Aguarda quem aprova compras", itens:de("SOLICITADO", function(){ return x.aprova; }), aceita:false},
    {k:"SEGURAR", titulo:"Segurada", cor:ESTADO.neutro, dica:"Decisão de aguardar", itens:de("SEGURAR", function(){ return false; }), aceita:function(it, d){ return d==="SOLICITADO" && x.aprova; }},
    {k:"APROVADO", titulo:"Aprovada", cor:ESTADO.info, dica:"Aguardando entrega", itens:de("APROVADO", function(){ return podeOperar; }), aceita:function(it, d){ return d==="SOLICITADO" && x.aprova; }},
    {k:"RECEBIDO", titulo:"Recebida", cor:ESTADO.ok, dica:"Entrada no estoque", itens:de("RECEBIDO", function(){ return false; }), aceita:function(it, d){ return d==="APROVADO" && podeOperar; }},
    {k:"RECUSADO", titulo:"Recusada", cor:ESTADO.ruim, dica:"Decisão final", itens:de("RECUSADO", function(){ return false; }), aceita:function(it, d){ return d==="SOLICITADO" && x.aprova; }}];
  var jan = sJ[0] ? s.ce.solicitacoes.filter(function(r){ return String(r.id)===String(sJ[0].id); })[0] : null;
  var janVista = jan ? listarSolicitacoes(s, {}).filter(function(r){ return String(r.id)===String(jan.id); })[0] : null;
  var filtro = !!(sT[0] || sQ[0]);
  return e(Pagina,null,
    e(BarraFiltros,{ativo:filtro, onLimpar:function(){ sT[1](""); sQ[1](""); }},
      e(Busca,{v:sQ[0], set:sQ[1], ph:"Buscar material"}), e(Sel,{v:sT[0], set:sT[1], rot:"Aba do estoque", todos:"Todas as abas", opcoes:tipos.map(function(t){ return [t.id, t.nome]; })}),
      e("span",{className:"inline-flex h-9 items-center gap-1 rounded-lg bg-white/5 px-3 text-[12.5px] font-bold ring-1 ring-white/10"}, e("b",{className:MONO}, todas.length), todas.length===1 ? "solicitação" : "solicitações")),
    s.ce.solicitacoes.length ? e(Kanban,{colunas:colunas, unidade:["solicitação", "solicitações"], vazio:"Nenhuma solicitação nesta etapa.",
      onMover:function(it, de0, para){ sJ[1]({id:it.id, sug:para}); }, onAbrir:function(it){ sJ[1]({id:it.id, sug:null}); },
      card:function(it){ var fn = fornNome(it.fornecedorId);
        return e("div",{className:"flex flex-col items-center gap-1"}, e("b",{className:"text-[13px] leading-tight"}, it.material),
          e("span",{className:"text-[12px] text-white/80"}, it.quantidade+(it.unidade ? " · "+it.unidade : "")),
          e("span",{className:"text-[11px] text-white/55"}, (it.solicitadoPor||"—")+" · "+formatarDia(dia(it.solicitadoEm))),
          fn && e("span",{className:"text-[11px] text-white/55"}, fn), it.valor>0 && e("span",{className:MONO+" text-[11.5px] text-white/80"}, formatarReais(it.valor)),
          it.status==="APROVADO" && it.dataPrevisaoChegada && e(Selo,{cor:"info", ic:"truck"}, "Previsão "+formatarDia(it.dataPrevisaoChegada)),
          it.status==="RECEBIDO" && it.dataRecebimento && e(Selo,{cor:"ok", ic:"check-circle"}, formatarDia(it.dataRecebimento))); }})
      : e(Vazio,{ic:"shopping-cart-simple"}, "Nenhuma solicitação de compra de material registrada. Os pedidos são feitos na tela Estoque de material."),
    janVista && e(JanelaSol,{key:janVista.id+":"+(sJ[0].sug||""), s:janVista, x:x, sug:sJ[0].sug, fechar:function(){ sJ[1](null); }}));
}

export { AbaEstoqueSolicitacoes };
