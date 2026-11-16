// Sorelly Admin · montagem — pages/link-pagamento/Meios.js
// Tela Meios e acessos: UMA planilha, um meio de recebimento por linha (link ou maquininha), com as regras do link na faixa azul; acessos e passo a passo abrem ao clicar na linha.
// REFEITA em 16/11/2026 (Marcus: "arruma as outras telas conforme as nossas regras"): blocos azuis e planilha com filtro nas colunas no lugar dos cartões e dos blocos de números. Nada saiu; a janela de edição do meio continua igual.
// Edição numa janela de 3 colunas: dados | taxas e antecipação | acessos e passo a passo. NUNCA digitar senha: só URL, identificação e uma nota de onde a senha está guardada.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Janela } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ADQUIRENTES, BANDEIRAS, MAX_PARCELAS, TIPOS_MEIO, adquirenteVira, avisoFornecedor, formatarReais, isencaoDoMes, opcoesCnpj, resumoAluguel, rotuloCnpj, taxaDe, textoFaixas, validarMeio } from "@/apps/montagem/domain/link-pagamento";
import { Bt, Campo, Editor, Painel } from "@/apps/montagem/pages/compras/visualCompras";
import { pct, useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var AZUL = "#3B82F6";
var CAMPO = INPUT+" w-full text-center";
var nParc = (function(){ var a = []; for(var i = 1; i<=MAX_PARCELAS; i++) a.push(i); return a; })();
var NOVO = {tipo:"LINK", nome:"", cnpjId:"", adquirente:"Sicredi", aluguel:"", grupoIsencao:"", ativo:true, viraPagamentoFornecedor:false, taxas:{todas:{}}, antecipacao:{ativa:false, modo:"mes", pctMes:"", pctParcela:{}}, prazoCredito:{primeira:30, intervalo:30, antecipado:1}, acessos:{url:"", identificacao:"", notaSenha:""}, passoAPasso:""};

function Chip(p){ return e("button",{type:"button", onClick:p.onClick, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-bold ring-1 transition "+(p.on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"),
  style:p.on ? {background:"linear-gradient(135deg,"+AZUL+"66,"+AZUL+"22)", boxShadow:"inset 0 0 0 1px "+AZUL+"cc"} : undefined}, p.children); }
function Txt(p){ return e(Campo,{rot:p.rot, dica:p.dica}, e("input",{type:"text", inputMode:p.num ? "decimal" : undefined, value:p.v==null ? "" : p.v, placeholder:p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO})); }
function Marca(p){ return e("label",{className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold hover:bg-white/15"}, e("input",{type:"checkbox", checked:!!p.v, onChange:function(ev){ p.set(ev.target.checked); }}), p.rot); }
// grade de números por quantidade de parcelas (taxa em % simples)
function Grade(p){
  return e("div",{className:"grid grid-cols-4 gap-1.5"}, nParc.map(function(n){
    return e("label",{key:n, className:"flex flex-col items-center gap-0.5 text-[10.5px] font-bold text-white/70"}, n+"x",
      e("input",{type:"text", inputMode:"decimal", "aria-label":p.rot+" "+n+"x", value:(p.v||{})[n]==null ? "" : (p.v||{})[n], onChange:function(ev){ var o = Object.assign({}, p.v); o[n] = ev.target.value; p.set(o); }, className:INPUT+" h-9! w-full px-1! text-center text-[13px]! "+MONO})); }));
}

function MeioJanela(p){
  var L = p.L, st = useState(function(){ return JSON.parse(JSON.stringify(p.ini)); }), v = st[0], er = useState(""), erro = er[0], cf = useState(false), conf = cf[0], bd = useState("todas"), band = bd[0];
  var up = function(fn){ st[1](function(o){ var n = JSON.parse(JSON.stringify(o)); fn(n); return n; }); er[1](""); };
  var salvar = function(){
    var m = validarMeio(L.lp, v); if(m){ er[1](m); return; }
    if(L.exec("meio_salvar", {meio:v})) p.fechar();
  };
  var dados = e(Painel,{key:"d", t:"Dados", ic:"credit-card", estado:"atual"},
    e(Campo,{rot:"Tipo"}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, TIPOS_MEIO.map(function(t){ return e(Chip,{key:t[0], on:v.tipo===t[0], onClick:function(){ up(function(n){ n.tipo = t[0]; }); }}, t[1]); }))),
    e(Txt,{rot:"Nome", v:v.nome, ph:"Ex.: Link Sicredi", set:function(x){ up(function(n){ n.nome = x; }); }}),
    e(Campo,{rot:"CNPJ"}, e("select",{value:v.cnpjId, onChange:function(ev){ var x = ev.target.value; up(function(n){ n.cnpjId = x; }); }, className:CAMPO+" cursor-pointer"}, [e("option",{key:"", value:""}, "Sem CNPJ")].concat(opcoesCnpj().map(function(c){ return e("option",{key:c.id, value:c.id}, c.rotulo); })))),
    e(Campo,{rot:"Adquirente"}, e("select",{value:v.adquirente, onChange:function(ev){ var x = ev.target.value; up(function(n){ n.adquirente = x; n.viraPagamentoFornecedor = adquirenteVira(x); }); }, className:CAMPO+" cursor-pointer"}, ADQUIRENTES.map(function(a){ return e("option",{key:a, value:a}, a); }))),
    v.adquirente==="Axis" && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12px] font-bold text-[#FBBF24]"}, "A Axis ainda não está em operação."),
    v.tipo==="MAQUININHA" && e(Txt,{rot:"Aluguel por mês (R$)", num:true, dica:"Vazio = não informado. 0 = sem aluguel.", v:v.aluguel, set:function(x){ up(function(n){ n.aluguel = x; }); }}),
    e(Marca,{rot:"Meio ativo", v:v.ativo, set:function(x){ up(function(n){ n.ativo = x; }); }}),
    e(Marca,{rot:"Vira pagamento de fornecedor", v:v.viraPagamentoFornecedor, set:function(x){ up(function(n){ n.viraPagamentoFornecedor = x; }); }}),
    v.viraPagamentoFornecedor && e("p",{className:"rounded-lg bg-[#3B82F6]/15 px-2 py-1.5 text-[12px] font-bold text-[#BFDBFE]"}, "O valor passado vai para Pagamentos a fornecedores (desconto da maquininha)."),
    e("div",{className:"grid grid-cols-3 gap-1.5"},
      e(Txt,{rot:"1º crédito (dias)", num:true, v:v.prazoCredito.primeira, set:function(x){ up(function(n){ n.prazoCredito.primeira = x; }); }}),
      e(Txt,{rot:"Entre parcelas", num:true, v:v.prazoCredito.intervalo, set:function(x){ up(function(n){ n.prazoCredito.intervalo = x; }); }}),
      e(Txt,{rot:"Antecipado", num:true, v:v.prazoCredito.antecipado, set:function(x){ up(function(n){ n.prazoCredito.antecipado = x; }); }})));
  var linhaB = v.taxas[band] || {};
  var taxas = e(Painel,{key:"t", t:"Taxas e antecipação", ic:"percent"},
    e(Campo,{rot:"Bandeira"}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, ["todas"].concat(BANDEIRAS).map(function(b){ return e(Chip,{key:b, on:band===b, onClick:function(){ bd[1](b); }}, b==="todas" ? "Todas" : b); }))),
    e(Campo,{rot:"Taxa por parcelas (%)", dica:band==="todas" ? "Vale para toda bandeira sem taxa própria." : "Vazio usa a taxa de Todas."}, e(Grade,{rot:"Taxa", v:linhaB, set:function(o){ up(function(n){ n.taxas[band] = o; }); }})),
    e(Marca,{rot:"Antecipação ligada", v:v.antecipacao.ativa, set:function(x){ up(function(n){ n.antecipacao.ativa = x; }); }}),
    v.antecipacao.ativa && e("div",{className:"flex flex-col gap-2"},
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, [["mes", "% ao mês"], ["parcela", "% por parcelas"]].map(function(o){ return e(Chip,{key:o[0], on:v.antecipacao.modo===o[0], onClick:function(){ up(function(n){ n.antecipacao.modo = o[0]; }); }}, o[1]); })),
      v.antecipacao.modo==="mes" ? e(Txt,{rot:"Antecipação (% ao mês)", num:true, v:v.antecipacao.pctMes, set:function(x){ up(function(n){ n.antecipacao.pctMes = x; }); }})
        : e(Campo,{rot:"Antecipação por parcelas (%)"}, e(Grade,{rot:"Antecipação", v:v.antecipacao.pctParcela, set:function(o){ up(function(n){ n.antecipacao.pctParcela = o; }); }}))));
  var acessos = e(Painel,{key:"a", t:"Acessos e passo a passo", ic:"key"},
    e("p",{className:"rounded-lg bg-[#EF4444]/15 px-2 py-1.5 text-[12px] font-bold text-[#F87171]"}, "Não digite senhas neste sistema. Registre apenas o endereço, o usuário e onde a senha está guardada."),
    e(Txt,{rot:"Endereço (URL)", v:v.acessos.url, ph:"https://", set:function(x){ up(function(n){ n.acessos.url = x; }); }}),
    e(Txt,{rot:"Usuário ou identificação", v:v.acessos.identificacao, set:function(x){ up(function(n){ n.acessos.identificacao = x; }); }}),
    e(Txt,{rot:"Onde está a senha", v:v.acessos.notaSenha, ph:"Ex.: gerenciador de senhas do Financeiro", set:function(x){ up(function(n){ n.acessos.notaSenha = x; }); }}),
    e(Campo,{rot:"Passo a passo para gerar o link"}, e("textarea",{value:v.passoAPasso, rows:6, placeholder:"1. Acessar o endereço\n2. ...", onChange:function(ev){ var x = ev.target.value; up(function(n){ n.passoAPasso = x; }); }, className:INPUT+" h-auto! w-full resize-none py-2"})),
    erro && e("p",{role:"alert", className:"rounded-lg bg-[#EF4444]/20 px-2 py-1.5 text-[12.5px] font-bold text-[#F87171]"}, erro));
  return e(Janela,{t:v.id ? "Editar meio de recebimento" : "Novo meio de recebimento", sub:"Link de pagamento ou maquininha, com taxas e acessos.", fechar:p.fechar, colunas:[dados, taxas, acessos],
    rodape:[e(Bt,{key:"s", tipo:"forte", ic:"floppy-disk", onClick:salvar}, "Salvar"),
      v.id && e(Bt,{key:"x", tipo:"perigo", ic:"trash", onClick:function(){ if(!conf){ cf[1](true); return; } if(L.exec("meio_excluir", {id:v.id})) p.fechar(); }}, conf ? "Confirmar exclusão" : "Excluir"),
      e(Bt,{key:"c", ic:"x", onClick:p.fechar}, "Cancelar")]});
}

var temTaxa = function(m){ var tx = m.taxas || {}; return Object.keys(tx).some(function(b){ return Object.keys(tx[b]||{}).length; }); };
var dinR = function(x){ return formatarReais(x || 0); };

function AbaLpMeios(){
  var L = useLp(), lp = L.lp, cfg = L.cfg, md = useState(null), modal = md[0], rg = useState(false);
  var ini = function(m){ return m ? JSON.parse(JSON.stringify(m)) : JSON.parse(JSON.stringify(NOVO)); };
  var ra = resumoAluguel(lp), isens = (lp.isencoes||[]).map(function(i){ return isencaoDoMes(lp, i.grupo); }).filter(Boolean);
  var num = function(rot, v, cor){ return e("span",{key:rot, className:"whitespace-nowrap px-1 text-[13px]"}, rot+" ", e("b",{className:"tabular-nums "+(cor || "")}, v)); };
  var BTN = "h-8 whitespace-nowrap rounded-md border px-3 text-[13px] font-semibold ";
  // ── faixa azul: regras do link, aluguel e ações ──
  var faixa = e("div",{className:"flex flex-col border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("div",{className:"flex flex-wrap items-center gap-x-1"}, e("b",{className:"px-1 text-[11px] uppercase"}, "Regras do link"),
      num("Valor mínimo", formatarReais(cfg.minimo)), num("Parcela mínima", formatarReais(cfg.parcelaMinima)), num("Sem juros até", cfg.maxParcelasSemJuros+"x"), num("Validade", cfg.validadeHoras+" h"), num("Tentativas por dia", cfg.tentativasDia),
      textoFaixas(cfg).map(function(f){ return num(f[0], f[1].replace("até ", "")); }),
      e("span",{className:"flex-1"}),
      e("button",{type:"button", className:BTN+"border-primary bg-primary/20 text-primary hover:bg-primary/30", onClick:function(){ md[1]({m:null}); }}, "Novo meio"),
      e("button",{type:"button", className:BTN+"ml-2 border-white/50 hover:bg-white/15", onClick:function(){ rg[1](true); }}, "Editar regras do link")),
    e("div",{className:"flex flex-wrap items-center gap-x-1"}, e("b",{className:"px-1 text-[11px] uppercase"}, "Maquininhas"),
      num("Ativas", ra.maquinas), num("Aluguel por mês", formatarReais(ra.total)), num("Se a isenção for atingida", formatarReais(ra.seIsento), "text-success"), num("Aluguel sem informação", ra.semInfo, ra.semInfo ? "text-[#FBBF24]" : "")));
  // ── planilha dos meios: um por linha; acessos e passo a passo abrem ao clicar na linha ──
  var linhas = lp.meios.map(function(m){ var a = m.acessos || {}, t1 = taxaDe(m, "", 1), tN = taxaDe(m, "", cfg.maxParcelasSemJuros);
    return {id:m.id, meio:m.nome, tipo:m.tipo==="LINK" ? "Link" : "Maquininha", cnpj:rotuloCnpj(m.cnpjId), adquirente:m.adquirente, situacao:m.ativo ? "Ativo" : "Inativo", antecipa:m.antecipacao.ativa ? "Sim" : "Não",
      fornecedor:m.viraPagamentoFornecedor ? "Sim" : "Não",
      aluguel:m.tipo==="MAQUININHA" ? (m.aluguel==null ? "Não informado" : (m.aluguel>0 ? formatarReais(m.aluguel)+"/mês" : "Sem aluguel")) : "—",
      maquina:m.tipo==="MAQUININHA" ? [m.dono ? "Máquina do "+m.dono : "", m.uso ? "Uso: "+m.uso : ""].filter(Boolean).join(" · ") || "—" : "—",
      pix:m.taxaPix ? m.taxaPix.rotulo+" "+pct(m.taxaPix.pct) : "—", debito:m.debito ? pct(m.debito.vm)+(m.debito.dem!==m.debito.vm ? " | "+pct(m.debito.dem) : "") : "—",
      avista:temTaxa(m) ? pct(t1) : "—", ate:temTaxa(m) ? pct(tN) : (m.viraPagamentoFornecedor ? "Taxa do fornecedor" : "—"), acesso:a.url || "—", _m:m, _a:a}; });
  var cols = [{k:"meio", t:"Meio"}, {k:"tipo", t:"Tipo"}, {k:"cnpj", t:"CNPJ"}, {k:"adquirente", t:"Adquirente"},
    {k:"situacao", t:"Situação", render:function(v){ return e("span",{className:"font-bold "+(v==="Ativo" ? "text-success" : "text-destructive")}, v); }},
    {k:"antecipa", t:"Antecipa"}, {k:"fornecedor", t:"Vira pagamento de fornecedor"}, {k:"aluguel", t:"Aluguel"}, {k:"maquina", t:"Máquina"}, {k:"pix", t:"Pix"}, {k:"debito", t:"Débito"},
    {k:"avista", t:"À vista"}, {k:"ate", t:cfg.maxParcelasSemJuros+"x"},
    {k:"acesso", t:"Endereço", render:function(v){ return v==="—" ? v : e("a",{href:v, target:"_blank", rel:"noopener noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"font-bold text-[#BFDBFE] underline"}, "Abrir"); }},
    {k:"acoes", t:"Ações", render:function(v, l){ return e("span",{className:"inline-flex gap-1"},
      e("button",{type:"button", title:"Editar meio", onClick:function(ev){ ev.stopPropagation(); md[1]({m:l._m}); }, className:"h-8 rounded-md border border-white/30 px-2 text-[13px] font-semibold hover:bg-white/10"}, "Editar"),
      e("button",{type:"button", title:l._m.ativo ? "Desativar meio" : "Ativar meio", onClick:function(ev){ ev.stopPropagation(); L.exec("meio_ativo", {id:l._m.id, ativo:!l._m.ativo}); }, className:"h-8 rounded-md border border-white/30 px-2 text-[13px] font-semibold hover:bg-white/10"}, l._m.ativo ? "Desativar" : "Ativar")); }}];
  var detalhe = function(l){ var m = l._m, a = l._a;
    if(!(a.url || a.identificacao || a.notaSenha || m.passoAPasso || (m.viraPagamentoFornecedor && avisoFornecedor(m)))) return null;
    return e("div",{className:"flex flex-col gap-1 px-3 py-2 text-left text-[13px]"},
      m.viraPagamentoFornecedor && avisoFornecedor(m) && e("span",{className:"font-semibold text-[#BFDBFE]"}, avisoFornecedor(m)),
      a.url && e("span",null, e("b",null, "Endereço: "), e("a",{href:a.url, target:"_blank", rel:"noopener noreferrer", className:"break-all font-bold text-[#BFDBFE] underline"}, a.url)),
      a.identificacao && e("span",null, e("b",null, "Usuário: "), a.identificacao), a.notaSenha && e("span",null, e("b",null, "Senha: "), a.notaSenha),
      m.passoAPasso && e("span",{className:"whitespace-pre-line break-words"}, e("b",null, "Passo a passo: "), m.passoAPasso)); };
  return e("div",{className:"flex flex-col gap-2"},
    e(BlocoPainel,{titulo:"Meios e acessos dos links", compacto:true, dir:String(lp.meios.length)},
      faixa,
      lp.meios.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, maozinha:true, semLimpar:true, semContagem:true, detalhe:detalhe, linhaCls:function(l){ return l._m.ativo ? "" : "opacity-60"; }})
        : e("p",{className:"py-6 text-center text-[13px]"}, "Nenhum meio de recebimento cadastrado.")),
    ra.porBanco.length>0 && e(BlocoPainel,{titulo:"Aluguel por banco", compacto:true, dir:formatarReais(ra.total)},
      e(TabelaPlanilha,{cols:[{k:"banco", t:"Banco"}, {k:"qtd", t:"Maquininhas"}, {k:"valor", t:"Aluguel por mês", fmt:dinR, render:dinR}], linhas:ra.porBanco.map(function(b){ return {id:b.rotulo, banco:b.rotulo, qtd:b.qtd, valor:b.valor}; }), chave:"id", centro:true, grade:true, semFiltro:true, semLimpar:true, semContagem:true})),
    isens.map(function(i){ return e(BlocoPainel,{key:i.grupo, titulo:"Isenção do aluguel · "+i.rotulo, compacto:true, dir:i.atingida ? "Atingida" : "Falta "+formatarReais(i.falta)},
      e("div",{className:"flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 py-1.5"},
        num("Vendido no mês (todas as máquinas)", formatarReais(i.vendido)), num("Meta para isentar", formatarReais(i.meta)),
        e("button",{type:"button", className:BTN+"border-white/50 hover:bg-white/15", onClick:function(){ md[1]({iso:i}); }}, "Atualizar vendas do mês"))); }),
    modal && modal.iso && e(Editor,{t:"Vendas do mês · "+modal.iso.rotulo, sub:"Soma de todas as maquininhas do banco. Zera sozinho na virada do mês.", nc:1, fechar:function(){ md[1](null); }, ini:{vendido:modal.iso.vendido}, campos:[{k:"vendido", rot:"Vendido no mês (R$)", tipo:"dinheiro"}],
      onSalvar:function(v){ return L.exec("isencao_vendido", {grupo:modal.iso.grupo, vendido:v.vendido}); }}),
    modal && !modal.iso && e(MeioJanela,{key:modal.m ? modal.m.id : "novo", L:L, ini:ini(modal.m), fechar:function(){ md[1](null); }}),
    rg[0] && e(Editor,{t:"Regras do link de pagamento", sub:"Valem para todas as solicitações.", nc:3, titulos:["Valores e prazos", "Faixas 1 e 2", "Faixa 3 e teto"], fechar:function(){ rg[1](false); },
      ini:{minimo:cfg.minimo, parcelaMinima:cfg.parcelaMinima, maxParcelasSemJuros:String(cfg.maxParcelasSemJuros), validadeHoras:String(cfg.validadeHoras), avisoHoras:String(cfg.avisoHoras), tentativasDia:String(cfg.tentativasDia),
        f1ate:cfg.faixas[0].ate, f1max:String(cfg.faixas[0].max), f2ate:cfg.faixas[1].ate, f2max:String(cfg.faixas[1].max), f3ate:cfg.faixas[2].ate, f3max:String(cfg.faixas[2].max)},
      campos:[{k:"minimo", rot:"Valor mínimo do link", tipo:"dinheiro"}, {k:"parcelaMinima", rot:"Parcela mínima", tipo:"dinheiro"}, {k:"validadeHoras", rot:"Validade do link (horas)", tipo:"num", min:1}, {k:"avisoHoras", rot:"Aviso à revendedora (horas)", tipo:"num", min:1}, {k:"tentativasDia", rot:"Tentativas por dia", tipo:"num", min:1},
        {k:"f1ate", rot:"Faixa 1: até (R$)", tipo:"dinheiro"}, {k:"f1max", rot:"Faixa 1: parcelas", tipo:"num", min:1}, {k:"f2ate", rot:"Faixa 2: até (R$)", tipo:"dinheiro"}, {k:"f2max", rot:"Faixa 2: parcelas", tipo:"num", min:1},
        {k:"f3ate", rot:"Faixa 3: até (R$)", tipo:"dinheiro"}, {k:"f3max", rot:"Faixa 3: parcelas", tipo:"num", min:1}, {k:"maxParcelasSemJuros", rot:"Acima da faixa 3: parcelas", tipo:"num", min:1, max:MAX_PARCELAS}],
      onSalvar:function(v){ return L.exec("config_salvar", {config:Object.assign({}, v, {faixas:[{ate:v.f1ate, max:v.f1max}, {ate:v.f2ate, max:v.f2max}, {ate:v.f3ate, max:v.f3max}]})}); }}));
}
export { AbaLpMeios, MeioJanela };
