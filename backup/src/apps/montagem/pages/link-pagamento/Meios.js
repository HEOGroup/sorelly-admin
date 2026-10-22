// Sorelly Admin · montagem — pages/link-pagamento/Meios.js
// Aba Meios e acessos: cartões em mosaico, um por meio de recebimento (link ou maquininha), com as regras do link no alto.
// Edição numa janela de 3 colunas: dados | taxas e antecipação | acessos e passo a passo. NUNCA digitar senha: só URL, identificação e uma nota de onde a senha está guardada.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Janela, LINHA, Mosaico, Tab, Td } from "@/apps/montagem/components/padrao";
import { ADQUIRENTES, BANDEIRAS, MAX_PARCELAS, TIPOS_MEIO, adquirenteVira, avisoFornecedor, formatarReais, isencaoDoMes, opcoesCnpj, resumoAluguel, rotuloCnpj, taxaDe, textoFaixas, validarMeio } from "@/apps/montagem/domain/link-pagamento";
import { Bt, Campo, Editor, Ic, Ind, Painel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
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
function CartaoMeio(p){
  var m = p.m, L = p.L, a = m.acessos, t1 = taxaDe(m, "", 1), tN = taxaDe(m, "", L.cfg.maxParcelasSemJuros);
  var cor = m.tipo==="LINK" ? "#60A5FA" : "#F3D98B";
  return e("div",{className:"flex flex-col items-center gap-1.5 rounded-xl p-3 text-center "+(m.ativo ? "" : "opacity-60"), style:{background:"linear-gradient(135deg,"+cor+"22,"+cor+"06 78%)", boxShadow:"inset 0 0 0 1px "+cor+"44"}},
    e("div",{className:"flex items-center gap-1.5"}, e(Ph,{n:m.tipo==="LINK" ? "link" : "credit-card", s:18, style:{color:cor}}), e("b",{className:"break-words text-[14.5px]"}, m.nome)),
    e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Selo,{cor:cor}, m.tipo==="LINK" ? "Link" : "Maquininha"), e(Selo,{cor:"#94A3B8"}, rotuloCnpj(m.cnpjId)), e(Selo,{cor:"#94A3B8"}, m.adquirente),
      !m.ativo && e(Selo,{cor:"#EF4444", ic:"pause"}, "Inativo"),
      m.antecipacao.ativa && e(Selo,{cor:"#4ADE80", ic:"lightning"}, "Antecipa"),
      m.viraPagamentoFornecedor && e(Selo,{cor:"#60A5FA", ic:"truck", titulo:avisoFornecedor(m)}, "Vira pagamento de fornecedor")),
    m.tipo==="MAQUININHA" && e("div",{className:"flex flex-wrap justify-center gap-1"},
      e(Selo,{cor:m.aluguel==null ? "#FBBF24" : "#F3D98B"}, m.aluguel==null ? "Aluguel não informado" : (m.aluguel>0 ? "Aluguel "+formatarReais(m.aluguel)+"/mês" : "Sem aluguel")),
      m.dono && e(Selo,{cor:"#60A5FA", ic:"truck"}, "Máquina do "+m.dono), m.uso && e(Selo,{cor:"#94A3B8"}, "Uso: "+m.uso)),
    m.taxaPix && e(Selo,{cor:"#4ADE80"}, m.taxaPix.rotulo+" "+pct(m.taxaPix.pct)),
    m.debito && e(Selo,{cor:"#94A3B8"}, "Débito "+pct(m.debito.vm)+(m.debito.dem!==m.debito.vm ? " | "+pct(m.debito.dem) : "")),
    temTaxa(m) ? e("div",{className:"grid w-full grid-cols-2 gap-1.5"},
      e("div",{className:"rounded-lg bg-black/25 px-1 py-1"}, e("b",{className:MONO+" text-[15px]"}, pct(t1)), e("div",{className:"text-[10px] font-bold uppercase text-white/65"}, "À vista")),
      e("div",{className:"rounded-lg bg-black/25 px-1 py-1"}, e("b",{className:MONO+" text-[15px]"}, pct(tN)), e("div",{className:"text-[10px] font-bold uppercase text-white/65"}, L.cfg.maxParcelasSemJuros+"x")))
      : e("p",{className:"w-full rounded-lg bg-black/25 px-2 py-1.5 text-[12px] font-bold text-white/70"}, m.viraPagamentoFornecedor ? "Taxa definida pelo fornecedor (desconto no fim do mês)" : "Taxas não informadas"),
    (a.url || a.identificacao || a.notaSenha) && e("div",{className:"flex w-full flex-col gap-0.5 rounded-lg bg-black/25 px-2 py-1.5 text-[12px] text-white/80"},
      a.url && e("a",{href:a.url, target:"_blank", rel:"noopener noreferrer", className:"break-all font-bold text-[#BFDBFE] underline"}, a.url),
      a.identificacao && e("span",null, "Usuário: "+a.identificacao), a.notaSenha && e("span",{className:"text-white/65"}, "Senha: "+a.notaSenha)),
    m.passoAPasso && e("details",{className:"w-full rounded-lg bg-black/25 px-2 py-1.5 text-[12px]"}, e("summary",{className:"cursor-pointer font-bold text-white/85"}, "Passo a passo"), e("p",{className:"mt-1 whitespace-pre-line break-words text-left text-white/80"}, m.passoAPasso)),
    e("div",{className:"flex gap-1.5"},
      e(Ic,{ic:"pencil-simple", titulo:"Editar meio", onClick:function(){ p.onEditar(m); }}),
      e(Ic,{ic:m.ativo ? "pause" : "play", titulo:m.ativo ? "Desativar meio" : "Ativar meio", onClick:function(){ L.exec("meio_ativo", {id:m.id, ativo:!m.ativo}); }})));
}

function AbaLpMeios(){
  var L = useLp(), lp = L.lp, cfg = L.cfg, md = useState(null), modal = md[0], rg = useState(false);
  var ini = function(m){ return m ? JSON.parse(JSON.stringify(m)) : JSON.parse(JSON.stringify(NOVO)); };
  var ra = resumoAluguel(lp), isens = (lp.isencoes||[]).map(function(i){ return isencaoDoMes(lp, i.grupo); }).filter(Boolean);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:5},
      e(Ind,{t:"Valor mínimo do link", v:formatarReais(cfg.minimo), cor:"info"}), e(Ind,{t:"Parcela mínima", v:formatarReais(cfg.parcelaMinima), cor:"info"}),
      e(Ind,{t:"Sem juros até", v:cfg.maxParcelasSemJuros+"x", cor:"info"}), e(Ind,{t:"Validade do link", v:cfg.validadeHoras+" h", cor:"info"}), e(Ind,{t:"Tentativas por dia", v:cfg.tentativasDia, cor:"info"})),
    e(Faixa,{n:4}, textoFaixas(cfg).map(function(f){ return e(Ind,{key:f[0], t:f[0], v:f[1].replace("até ", ""), cor:"info"}); })),
    e(Faixa,{n:4},
      e(Ind,{t:"Maquininhas ativas", v:ra.maquinas, cor:"total"}), e(Ind,{t:"Aluguel por mês", v:formatarReais(ra.total), cor:"info", titulo:"Só o aluguel informado; não é o custo total das transações"}),
      e(Ind,{t:"Se a isenção for atingida", v:formatarReais(ra.seIsento), cor:"ok"}), e(Ind,{t:"Aluguel sem informação", v:ra.semInfo, cor:ra.semInfo ? "alerta" : "ok", titulo:"Maquininhas ativas sem aluguel informado"})),
    ra.porBanco.length>0 && e(BlocoBarra,{cor:"azul", t:"Aluguel por banco", compacto:true, dir:formatarReais(ra.total)},
      e("div",{className:"p-2"}, e(Tab,{cols:["Banco", "Maquininhas", "Aluguel por mês"]}, ra.porBanco.map(function(b){ return e("tr",{key:b.rotulo, className:LINHA}, e(Td,{forte:true}, b.rotulo), e(Td,null, b.qtd), e(Td,{dinheiro:true}, formatarReais(b.valor))); })))),
    isens.map(function(i){ return e(BlocoBarra,{key:i.grupo, cor:i.atingida ? "verde" : "azul", t:"Isenção do aluguel · "+i.rotulo, compacto:true, dir:i.atingida ? "Atingida" : "Falta "+formatarReais(i.falta)},
      e("div",{className:"flex flex-wrap items-center justify-center gap-3 p-2"},
        e(Ind,{t:"Vendido no mês (todas as máquinas)", v:formatarReais(i.vendido), cor:"info"}), e(Ind,{t:"Meta para isentar", v:formatarReais(i.meta), cor:"info"}),
        e(Bt,{ic:"pencil-simple", onClick:function(){ md[1]({iso:i}); }}, "Atualizar vendas do mês"))); }),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ md[1]({m:null}); }}, "Novo meio"),
      e(Bt,{ic:"sliders-horizontal", onClick:function(){ rg[1](true); }}, "Editar regras do link")),
    lp.meios.length ? e(Mosaico,{min:"19rem"}, lp.meios.map(function(m){ return e(CartaoMeio,{key:m.id, m:m, L:L, onEditar:function(x){ md[1]({m:x}); }}); }))
      : e(Vazio,{ic:"credit-card"}, "Nenhum meio de recebimento cadastrado."),
    modal && modal.iso && e(Editor,{t:"Vendas do mês · "+modal.iso.rotulo, sub:"Soma de todas as maquininhas do banco. Zera sozinho na virada do mês.", nc:1, fechar:function(){ md[1](null); }, ini:{vendido:modal.iso.vendido}, campos:[{k:"vendido", rot:"Vendido no mês (R$)", tipo:"dinheiro"}],
      onSalvar:function(v){ return L.exec("isencao_vendido", {grupo:modal.iso.grupo, vendido:v.vendido}); }}),
    modal && !modal.iso && e(MeioJanela,{key:modal.m ? modal.m.id : "novo", L:L, ini:ini(modal.m), fechar:function(){ md[1](null); }}),
    rg[0] && e(Editor,{t:"Regras do link de pagamento", sub:"Valem para todas as solicitações.", nc:3, titulos:["Valores e prazos", "Faixas 1 e 2", "Faixa 3 e teto"], fechar:function(){ rg[1](false); },
      ini:{minimo:cfg.minimo, parcelaMinima:cfg.parcelaMinima, maxParcelasSemJuros:String(cfg.maxParcelasSemJuros), validadeHoras:String(cfg.validadeHoras), tentativasDia:String(cfg.tentativasDia),
        f1ate:cfg.faixas[0].ate, f1max:String(cfg.faixas[0].max), f2ate:cfg.faixas[1].ate, f2max:String(cfg.faixas[1].max), f3ate:cfg.faixas[2].ate, f3max:String(cfg.faixas[2].max)},
      campos:[{k:"minimo", rot:"Valor mínimo do link", tipo:"dinheiro"}, {k:"parcelaMinima", rot:"Parcela mínima", tipo:"dinheiro"}, {k:"validadeHoras", rot:"Validade do link (horas)", tipo:"num", min:1}, {k:"tentativasDia", rot:"Tentativas por dia", tipo:"num", min:1},
        {k:"f1ate", rot:"Faixa 1: até (R$)", tipo:"dinheiro"}, {k:"f1max", rot:"Faixa 1: parcelas", tipo:"num", min:1}, {k:"f2ate", rot:"Faixa 2: até (R$)", tipo:"dinheiro"}, {k:"f2max", rot:"Faixa 2: parcelas", tipo:"num", min:1},
        {k:"f3ate", rot:"Faixa 3: até (R$)", tipo:"dinheiro"}, {k:"f3max", rot:"Faixa 3: parcelas", tipo:"num", min:1}, {k:"maxParcelasSemJuros", rot:"Acima da faixa 3: parcelas", tipo:"num", min:1, max:MAX_PARCELAS}],
      onSalvar:function(v){ return L.exec("config_salvar", {config:Object.assign({}, v, {faixas:[{ate:v.f1ate, max:v.f1max}, {ate:v.f2ate, max:v.f2max}, {ate:v.f3ate, max:v.f3max}]})}); }}));
}
export { AbaLpMeios, MeioJanela };
