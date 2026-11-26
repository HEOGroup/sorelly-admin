// Sorelly Admin — pages/ConsolidadoRepresentantes.js
// Representantes & Kits › Consolidado: CONTROLE do que entrou. Tudo que a representante preenche no app (acerto, kit novo, reposição)
// aparece aqui sozinho e fica pendente até trazer na empresa: o agendamento confere e dá o OK. A comissão e as contas (Point, link…) ficam só em Comissões.
// O agendamento vê quantidades e o que precisa conferir, nunca os totais de valores (veTotais em domain/equipe.js).
// VISUAL REFEITO em 23/11/2026 (Marcus: "nas novas regras", igual a Contas a pagar): um bloco azul (BlocoPainel), barra em forma de tabela com menus suspensos
// e UMA TabelaPlanilha com filtro e ordem no nome de cada coluna. Sem blocos de números no topo: o total fica na última linha da tabela.
// As contas (linha, relogio, receber) e as ações (CONSREP_RECEBER, RETORNO_BIPAR, COMIS_TERMO) são as mesmas de antes.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BarraMini, BuscaMini, CLS_FINA_ESPACO, CampoMini, PAGINA_CHEIA } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { analisar, comisEfetiva, itensComissao, pagoDe, prazoPendente, statusDe, taxaDe } from "@/apps/montagem/domain/comissoes";
import { conferirBrindes } from "@/apps/montagem/domain/consignado";
import { GRUPOS_CONTA, grupoDaConta } from "@/apps/montagem/domain/contas-grupos";
import { AGENDAMENTO, BIPADORAS, BIPA_RETORNO_PADRAO, FINANCEIRO, SUPERVISORA, nomeDe, papelDe, podeAgendar, podeBipRetorno, veTotais } from "@/apps/montagem/domain/equipe";
import { corDaFila, podeBiparRetorno, qtdFila } from "@/apps/montagem/domain/retornos";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { nomePropio } from "@/apps/montagem/lib/nome-conta";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MoneyInput } from "@/apps/montagem/ui/input";
import { e, useRef, useState } from "@/shared/react";

var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var r2 = function(n){ return Math.round(n*100)/100; };
var nome = function(t){ return nomePropio(t||""); };   // nome de pessoa nunca em maiúsculas na tela (Marcus, 23/11/2026): "KARINE SOUZA" aparece "Karine Souza"
var fmtData = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var TIPOS = ["acerto","kit_novo_entrega","reposicao","reposicao_especial"];   // tudo que a representante lança no app

// Calcula as colunas derivadas de um atendimento registrado
function linha(r, c){
  var pago = pagoDe(r);   // recebido de verdade (com o dinheiro contado e sem "acerto com loja")
  var ac = r.tipo==="acerto";
  var devido = r2((r.valorDevido!=null ? r.valorDevido : r.valorAcerto||0) + (r.excedenteBrinde||0) + (r.tagsValor||0) + (r.multas||0));   // multas: regras de 27/10/2026, somam no total a pagar
  var falta = ac ? Math.max(0, r2(devido - pago)) : 0;
  var rec = r.recebimento || {};
  var an = analisar(c, r);
  var kitNovo = r.tipo==="kit_novo_entrega", repos = r.tipo.indexOf("reposicao")===0;
  var condNec = kitNovo || (ac && an.promPrec), condOk = !condNec || !!(rec.prom && rec.prom.ok);
  var dinTot = r2((r.pagamentos||[]).filter(function(p){ return p.forma==="dinheiro"; }).reduce(function(t,p){ return t+(p.valor||0); }, 0)), din = rec.din || {};
  var repDinOk = !!(rec.rep && rec.rep.din && rec.rep.din.ok);
  var contaB = conferirBrindes(r.brindesLancados || (r.formSnapshot||{}).brindes, r.brindeNormal||0, r.brindeSelect||0), tx = taxaDe(r);
  return {r:r, ac:ac, repos:repos, condNec:condNec, condOk:condOk, dinTot:dinTot, din:din, repDinOk:repDinOk, brindes:contaB, tx:tx, status:statusDe(r), pago:pago, devido:devido, falta:falta, rec:rec, an:an};
}

// Nome da coluna de cada conta de pagamento: forma + banco ("Pix · Safra"); o CNPJ já está na faixa de cima da coluna
var FORMA_PALAVRA = {pix:"Pix", link:"Link", credito:"Crédito", debito:"Débito", dinheiro:"Dinheiro", pix_representante:"Pix", acerto_loja:"Acerto"};
// dentro de um CNPJ o nome da empresa e o número saem (já estão na faixa de cima); fora de CNPJ (Sem faturamento, Família) ficam, para duas contas não aparecerem com o mesmo nome
var RUIDO = /^(PIX|CRÉDITO|DÉBITO|LINK|ACERTO|-)$/i, RUIDO_CNPJ = /^(SERENITY|SORELLY|MAYZ|AXIS|34|46|59|67)$/i;
function rotuloConta(conta, emCnpj){
  var resto = String(conta).split(/\s+/).filter(function(w){ return !RUIDO.test(w) && !(emCnpj && RUIDO_CNPJ.test(w)); }).map(function(w){ var m = /^(\(?)(.*)$/.exec(w); return m[1]+nomePropio(m[2]); }).join(" ");
  return resto || "—";
}
var hm = function(ts){ return new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit", minute:"2-digit"}); };
var hmd = function(ts){ return new Date(ts).toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"}); };
// tempo entre o atendimento (data e hora do acerto) e o recebimento na empresa
var tempoEntre = function(r, fimTs){ var a = new Date(r.data+"T"+((r.hora||"00:00").slice(0,5))+":00").getTime(), m = Math.max(0, Math.round((new Date(fimTs).getTime()-a)/60000));
  return m>=1440 ? Math.floor(m/1440)+"d "+Math.floor(m%1440/60)+"h" : m>=60 ? Math.floor(m/60)+"h "+String(m%60).padStart(2,"0")+"min" : m+" min"; };
var diasDepois = function(dataAcerto, ts){ var a = new Date(dataAcerto+"T00:00:00").getTime(), b = new Date(ts); b = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime(); return Math.max(0, Math.round((b-a)/86400000)); };
var duracao = function(ini, fim){ var m = Math.max(0, Math.round((new Date(fim).getTime()-new Date(ini).getTime())/60000)); return m>=60 ? Math.floor(m/60)+"h"+String(m%60).padStart(2,"0") : m+" min"; };
var lancadosDe = function(r){ return r.brindesLancados || (r.formSnapshot||{}).brindes || []; };
var somaConta = function(r, k, conta){ return (r.pagamentos||[]).filter(function(pg){ return pg.forma===k && (conta==null || pg.descricao===conta); }).reduce(function(t2,pg){ return t2+pg.valor; }, 0); };
// condicional: true = assinada, false = não assinada, undefined = ainda não conferida; dado antigo sem marcação por número vale pelo check geral
var assinadaDe = function(rec, n){ return rec.condAss ? rec.condAss[n] : ((rec.prom && rec.prom.ok) ? true : undefined); };
var numsCond = function(l){ return l.rec.condNums || l.r.condicionaisSelecionadas || []; };

// Conferência (primeira coluna da tabela): o botão abre a ficha da revendedora; "Iniciar" também começa a conferência (Marcus, 23/11/2026: a tabela só mostra as linhas, a conferência é feita na ficha)
function Relogio(p){
  var rec = p.l.rec, ok = !!rec.ok, rodando = !!rec.inicioTs && !ok;
  return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); p.onClick(); }, "aria-label":ok ? "Conferido: abrir a ficha" : rodando ? "Em conferência: abrir a ficha" : "Abrir a ficha do atendimento",
    title:ok ? "Recebido em "+new Date(rec.fimTs||rec.em).toLocaleString("pt-BR")+(rec.quem ? " · por "+rec.quem : "") : rodando ? "Conferência em andamento desde "+hm(rec.inicioTs) : "Abrir a ficha. A conferência começa no botão da ficha.",
    className:"whitespace-nowrap text-[11px] font-semibold"},
    e("span",{className:"inline-flex items-center gap-1 "+(ok ? "text-success" : rodando ? "text-white" : "underline")}, e(Icon,{n:ok ? "check" : rodando ? "play" : "clock", s:11}),
      ok ? "Conferido"+(rec.inicioTs && rec.fimTs ? " · "+duracao(rec.inicioTs, rec.fimTs) : "") : rodando ? "Em conferência" : "Abrir"));
}

// Condicional: número + menu (A conferir, Assinada, Não assinada). condEstado resume a revendedora inteira para a tabela e para a ficha.
var OPS_ASS = [["", "A conferir"], ["sim", "Assinada"], ["nao", "Não assinada"]];
function condEstado(l){
  var rec = l.rec, nums = numsCond(l), ass = nums.map(function(n){ return assinadaDe(rec, n); }), nA = ass.filter(function(a){ return a===true; }).length, nN = ass.filter(function(a){ return a===false; }).length;
  var estado = !nums.length ? "Sem número" : nA===nums.length ? "Assinada" : nN>0 ? "Não assinada" : nA>0 ? nA+" assinadas" : "A conferir";
  return {n:nums.length, estado:estado, cor:nums.length && nA===nums.length ? "text-success" : nN>0 ? "text-destructive" : "", resumo:!nums.length ? estado : (nums.length===1 ? "1 condicional" : nums.length+" condicionais")+" · "+estado};
}

// DIFERENÇAS DO RETORNO (Marcus, 26/11/2026): a bipadora registra no card o que achou de diferente ao fazer o retorno (relatório de erros de bipagem do grupo de WhatsApp, 151 relatos).
// Os tipos vêm desses relatos. Sem regra por enquanto (nada de aviso, desconto ou punição): só o registro; as regras vêm depois. Montou e bipou na saída vêm do kit; o financeiro é quem trata (não a supervisão da montagem).
var TIPOS_DIF = [
  ["Saída do kit", "A definir", ["Peça bipada e não enviada", "Peça enviada sem bipar", "Peça bipada 2 vezes", "Código trocado", "Maleta errada"]],
  ["Representante", "Representante", ["Cobrou a mais", "Cobrou a menos", "Não cobrou peça", "Cobrou brinde", "Não anotou o brinde", "Não cobrou a rifa", "Não anotou peça de próximo mês", "Valor no campo errado"]],
  ["Revendedora", "Revendedora", ["Peça não retornou", "Peça quebrada ou usada", "Maleta incompleta", "Brinde retornou na maleta"]],
  ["Sistema", "Sistema", ["Condicional de próximo mês não gerada", "Kit sem maleta no sistema"]]];
var ORIGENS_DIF = ["A definir", "Montagem", "Bipagem de saída", "Representante", "Revendedora", "Sistema"];
var DIRS_DIF = [["", "Sem valor"], ["mais", "A mais"], ["menos", "A menos"]];
function origemDoTipo(t){ var g = TIPOS_DIF.find(function(x){ return x[2].indexOf(t)>=0; }); return g ? g[1] : "A definir"; }
function kitDe(kits, r){ return (kits || []).filter(function(k){ return nome(k.rev)===nome(r.rev) && (k.montId!=null || k.bipId!=null); }).sort(function(a, b){ return String(b.retEm || b.criadoEm || "").localeCompare(String(a.retEm || a.criadoEm || "")); })[0]; }
function Diferencas(p){
  var r = p.l.r, lista = (p.l.rec.dif || []);
  var st = useState({tipo:"", cod:"", dir:"", valor:0, origem:"", obs:""}), f = st[0], setF = st[1];
  var set = function(k, v){ setF(Object.assign({}, f, (function(){ var o = {}; o[k] = v; return o; })())); };
  var kit = kitDe(p.kits, r);
  var montou = kit && kit.montId!=null ? nomeDe(kit.montId) : "Sem registro", bipou = kit && kit.bipId!=null ? nomeDe(kit.bipId) : "Sem registro";
  var origem = f.origem || (f.tipo ? origemDoTipo(f.tipo) : "A definir");
  var registra = function(){ if(!f.tipo) return;
    p.onDif({tipo:f.tipo, cod:f.cod.trim().toUpperCase(), dir:f.valor>0 ? (f.dir || "mais") : "", valor:f.valor>0 ? f.valor : 0, origem:origem, obs:f.obs.trim(), montou:montou, bipou:bipou, por:p.usuarioNome});
    setF({tipo:"", cod:"", dir:"", valor:0, origem:"", obs:""}); };
  var campo = function(t, ctl){ return e("div",{className:"grid min-h-6 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-2 border-b border-white/30 px-2 py-px text-center text-[11px]"}, e("span",null, t), ctl); };
  var opc = function(o){ return e("option",{key:o[0], value:o[0], className:"bg-[#1f3358]"}, o[1]); };
  return e(Bloco,{t:"Diferenças · "+lista.length, dir:e("span",{className:lista.length ? "text-destructive" : "text-white"}, lista.length ? "Registradas" : "Nenhuma")},
    e(Par,{t:"Bipou na saída", v:bipou}),
    lista.map(function(x){ var cor = x.dir==="mais" ? "text-success" : x.dir==="menos" ? "text-destructive" : "";
      return e("div",{key:x.id, title:(x.obs ? x.obs+" · " : "")+"Registrado por "+(x.por || "—")+" em "+new Date(x.em).toLocaleString("pt-BR"), className:"grid min-h-6 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.5rem] items-center gap-2 break-words border-b border-white/30 px-2 py-px text-center text-[11px]"},
        e("span",{className:"font-semibold"}, x.tipo+(x.cod ? " · "+x.cod : "")),
        e("span",{className:"tabular-nums"}, e("b",{className:cor}, x.valor>0 ? (x.dir==="menos" ? "−" : "+")+BK(x.valor)+" · " : ""), x.origem+(x.obs ? " · "+x.obs : "")),
        p.podeBip ? e("button",{type:"button", onClick:function(){ p.onDifTira(x.id); }, "aria-label":"Tirar a diferença "+x.tipo, title:"Tirar", className:"mx-auto grid size-5 place-items-center rounded hover:bg-white/20"}, "×") : e("span",null)); }),
    p.podeBip && campo("Tipo", e("select",{value:f.tipo, "aria-label":"Tipo da diferença", className:CAMPO, onChange:function(ev){ set("tipo", ev.target.value); }},
      e("option",{value:"", className:"bg-[#1f3358]"}, "Escolha o tipo"),
      TIPOS_DIF.map(function(g){ return e("optgroup",{key:g[0], label:g[0], className:"bg-[#1f3358]"}, g[2].map(function(t){ return e("option",{key:t, value:t, className:"bg-[#1f3358]"}, t); })); }))),
    p.podeBip && f.tipo && campo("Código da peça", e("input",{value:f.cod, placeholder:"Ex.: CL2419", "aria-label":"Código da peça", className:CAMPO, onChange:function(ev){ set("cod", ev.target.value); }})),
    p.podeBip && f.tipo && campo("Valor", e("div",{className:"grid grid-cols-[6rem_1fr] gap-1"},
      e("select",{value:f.dir, "aria-label":"Direção do valor", className:CAMPO, onChange:function(ev){ set("dir", ev.target.value); }}, DIRS_DIF.map(opc)),
      e(MoneyInput,{value:f.valor, label:"Valor da diferença", className:"w-full h-[22px]! px-1! text-center! text-[11px]! bg-white/10! border-white/40!", onChange:function(v){ set("valor", v); }}))),
    p.podeBip && f.tipo && campo("Origem", e("select",{value:origem, "aria-label":"Origem da diferença", className:CAMPO, onChange:function(ev){ set("origem", ev.target.value); }}, ORIGENS_DIF.map(function(o){ return opc([o, o]); }))),
    p.podeBip && f.tipo && campo("Observação", e("input",{value:f.obs, placeholder:"Texto curto", "aria-label":"Observação", className:CAMPO, onChange:function(ev){ set("obs", ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") registra(); }})),
    p.podeBip && f.tipo && e("div",{className:"flex justify-center border-b border-white/30 px-2 py-1"}, e(Botao,{principal:true, onClick:registra}, "Registrar diferença")),
    !p.podeBip && lista.length===0 && e("p",{className:"border-b border-white/30 px-2 py-1 text-center text-[11px]"}, "Nenhuma diferença registrada."));
}

// FICHA DA REVENDEDORA (Marcus, 23/11/2026): o card onde se confere o acerto; as meninas da conferência usam este mesmo card. Três colunas, blocos ligados numa borda azul só:
// 1) atendimento e conferência | 2) condicionais, dinheiro, pagamentos e retorno | 3) peças, com os brindes normal e BB lado a lado (podem ser muitos), trocas e próximo mês.
var corTxt = function(c){ return function(){ return c; }; };
var PAR = "grid min-h-6 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-2 break-words border-b border-white/30 px-2 py-px text-center text-[11px]";   // responsivo: o nome longo quebra dentro da própria célula (Marcus, 26/11/2026)
function Par(p){ var g = p.grande ? " [&&]:!text-[14px]" : ""; return e("div",{className:PAR+g}, e("span",null, p.t), e("b",{className:"tabular-nums "+(p.cor||"")+g}, p.v)); }   // padrao-ok: grande = nomes em 14 px (Marcus 26/11/2026)
function FichaConferencia(p){
  var l = p.l, r = l.r, rec = l.rec, nums = numsCond(l), ce = condEstado(l), agenda = p.agenda, vc = p.vc;
  var vs = useState(""), v = vs[0], setV = vs[1], cs = useState(null), contado = cs[0], setContado = cs[1];
  var din = l.din, diverge = din.ok && din.contado!=null && Math.abs(din.contado-l.dinTot)>0.009, ok = !!rec.ok, rodando = !!rec.inicioTs && !ok;
  var grava = function(lista, ass){ var todas = lista.length>0 && lista.every(function(n){ return ass[n]===true; });
    p.onSet({condNums:lista, condAss:ass, prom:todas ? {ok:true, em:new Date().toISOString(), por:p.usuario} : {ok:false}}); };
  var assAtual = function(){ var o = {}; nums.forEach(function(n){ var a = assinadaDe(rec, n); if(a!==undefined) o[n] = a; }); return o; };
  var adiciona = function(){ var n = v.trim(); setV(""); if(!n || nums.indexOf(n)>=0) return; grava(nums.concat([n]), assAtual()); };
  var define = function(n, val){ var o = assAtual(); if(val==="") delete o[n]; else o[n] = val==="sim"; grava(nums, o); };
  var tira = function(n){ var o = assAtual(); delete o[n]; grava(nums.filter(function(x){ return x!==n; }), o); };
  var pecasDe = function(n){ var x = (r.condicionaisPecas||[]).filter(function(y){ return y.numero===n; })[0]; return x ? x.pecas : 0; };
  var multa = vc ? partesMulta(r, l.ac ? ((r.descontoRemarcacao||{}).comissaoPct||0)+(r.atrasoPct||0) : 0, l.falta) : [];
  var dinTxt = l.dinTot<=0 ? "Sem dinheiro" : !din.ok ? "Falta receber" : diverge ? "Divergente" : l.repDinOk ? "Recebido" : "Aguarda representante";
  var retTxt = !rec.ok ? "Aguarda recebimento" : rec.bip ? "Bipado por "+nome(rec.bip.por)+" · "+hm(rec.bip.ts) : "Falta bipar";
  var item = function(t, feito, txt){ return e("div",{key:t, className:PAR}, e("span",null, t), e("b",{className:feito ? "text-success" : "text-white"}, (feito ? "✓ " : "")+txt)); };
  // INFORMADO PELA REPRESENTANTE (Marcus, 26/11/2026: "tudo que é registrado no admin da representante precisa aparecer aí"): tudo que o app grava no atendimento e ainda não tinha lugar na ficha
  var linhasInfo = [], pI = function(tt, v, cor){ if(v===null || v===undefined || v==="" || v===false) return; linhasInfo.push(e(Par,{key:tt, t:tt, v:v, cor:cor})); };
  if(l.ac){
    if(vc){ pI("Venda bruta", BK(r.vendaBruta||0)); if(r.vendaDigitada && Math.abs((r.vendaDigitada||0)-(r.vendaBruta||0))>0.009) pI("Venda digitada", BK(r.vendaDigitada)); }
    pI("Motivo da venda baixa", r.motivoVendaBaixa); if(vc && r.garantia>0) pI("Garantia", BK(r.garantia)); if(r.tagsDanificadas>0) pI("Etiquetas danificadas", r.tagsDanificadas+(vc && r.tagsValor>0 ? " · "+BK(r.tagsValor) : ""), "text-destructive");
    if(vc && r.brindeNormal>0) pI("Brinde normal", BK(r.brindeNormal)); if(vc && r.brindeSelect>0) pI("Brinde BB", BK(r.brindeSelect));
    if(vc && r.abatidoDivida>0) pI("Abatido da dívida", BK(r.abatidoDivida), "text-success"); if(r.recusouNegociar) pI("Negociação", "Recusou negociar", "text-destructive");
    if(r.acordo && r.acordo.length>0) pI("Acordo", r.acordo.length+(r.acordo.length===1 ? " parcela" : " parcelas")+(vc ? " · "+BK(r.acordo.reduce(function(t2, x){ return t2+(x.valor||0); }, 0)) : ""));
    if((r.creditosGarantiaUsados||[]).length>0) pI("Crédito de garantia", r.creditosGarantiaUsados.length+(r.creditosGarantiaUsados.length===1 ? " usado" : " usados"), "text-success");
    if(r.pecasProxLiberadas>0) pI("Peças do próximo mês liberadas", r.pecasProxLiberadas);
    pI("Kit novo no acerto", r.kitNovoOk ? "Representante confirmou" : null, "text-success");
  } else {
    var cfA = r.conferencia; if(cfA){ pI("Peças esperadas", cfA.esperadas); pI("Peças contadas", cfA.contadas); if(cfA.faltas>0) pI("Faltaram", cfA.faltas, "text-destructive"); if(cfA.sobras>0) pI("Sobraram", cfA.sobras, "text-destructive"); }
    else if(r.pecasTotal!=null){ pI("Peças do kit", r.pecasTotal); if(r.pecasFaltaram>0) pI("Faltaram", r.pecasFaltaram, "text-destructive"); }
    pI("Observação da divergência", r.obsDivergencia || (cfA && cfA.nota)); if(r.expositorFoto) pI("Foto do expositor", "Enviada", "text-success"); if(r.semCelular) pI("Revendedora", "Sem celular");
  }
  pI("Assinatura no app", r.assinatura ? "Assinou" : "Sem assinatura", r.assinatura ? "text-success" : "text-destructive"); pI("Regras lidas", r.regrasLidas ? "Sim" : null, "text-success");
  var blocoInfo = e(Bloco,{key:"info", t:"Informado pela representante"}, linhasInfo,
    e("p",{className:"border-b border-white/30 px-2 py-1 text-center text-[11px]"}, r.obs ? "Observação: "+r.obs : "Sem observação da representante."));
  var kitA = kitDe(p.kits, r), montouKit = kitA && kitA.montId!=null ? nomeDe(kitA.montId) : "Sem registro";
  var colA = e("div",{key:"a", className:"flex flex-col"},
    e(Bloco,{t:"Atendimento"},
      e(Par,{t:"Representante", v:nome(r.rep)||"—", grande:true}), e(Par,{t:"Revendedora", v:nome(r.rev), grande:true}), e(Par,{t:"Montou o kit", v:montouKit})),   // nomes em letra maior, no lugar das duas linhas do topo, mantendo a tabela (Marcus, 26/11/2026)
    e(Bloco,{t:"Acerto"},
      e(Par,{t:"Status", v:l.status, cor:corStatus(l.status)}), e(Par,{t:"Acerto", v:fmtData(r.data)+(r.hora ? " "+r.hora : "")}),
      vc && l.ac && e(Par,{t:"Vendas", v:BK(r.vendaLiquida||0)}), vc && l.ac && e(Par,{t:"Comissão", v:r.comissaoPct+"%"}), vc && l.ac && e(Par,{t:"Valor do acerto", v:BK(r.valorAcerto||0)}),
      vc && l.ac && r.excedenteBrinde>0 && e(Par,{t:"Brinde a mais", v:BK(r.excedenteBrinde), cor:"text-destructive"}), vc && l.tx.taxa>0 && e(Par,{t:"Taxa", v:BK(l.tx.taxa)+(l.tx.paga ? " · paga" : " · não paga"), cor:l.tx.paga ? "text-success" : "text-destructive"})));
  var blocoMulta = multa.length>0 && e(Bloco,{key:"mu", t:"Multas e prazo"}, multa.map(function(m, i){ return e("div",{key:i, title:m.d, className:PAR}, e("span",null, m.l), e("b",{className:"tabular-nums "+m.c}, m.v)); }));
  // SITUAÇÃO DO PAGAMENTO (Marcus, 26/11/2026): em palavras, o que a revendedora pagou, o que falta e o que a regra manda fazer (multa, prazo, kit bloqueado, parcelas, jurídico)
  var NR = r.regrasNovas || null, pzS = vc && l.ac && l.falta>0.009 ? prazoPendente(r, isoDia(new Date())) : null, nadaPago = l.pago<=0.009, pctPago = l.devido>0 ? Math.round(l.pago/l.devido*100) : 0;
  var sitDir = l.falta<=0.009 ? "Quitado" : nadaPago ? "Não pagou nada" : "Pagou "+pctPago+"%";
  var linhasSit = [];
  if(l.falta>0.009){
    if(nadaPago) linhasSit.push("A revendedora não pagou nada deste acerto. A representante precisa cobrar e avisar a empresa.");
    if(NR){
      linhasSit.push("Multa de "+(NR.multaPendentePct||10)+"% sobre o valor pendente"+((r.multas||0)>0 ? " ("+BK(r.multas)+"). Ela já está somada no total a pagar." : "."));
      linhasSit.push("Prazo para quitar: "+(NR.prazoQuitarDias||30)+" dias corridos e antes do próximo acerto. Passou do prazo: +"+(NR.atrasoQuitacaoPctDia||1)+"% ao dia, até "+(NR.atrasoQuitacaoTetoPct||10)+"%.");
      linhasSit.push("Dá para negociar em até "+(NR.parcelasMax||2)+" parcelas de no mínimo "+BK(NR.parcelaMinima||200)+". Dívida abaixo de "+BK(NR.parcelaUnicaAbaixo||400)+" é parcela única.");
    }
    linhasSit.push("Kit novo: bloqueado até quitar tudo. Quem paga "+(NR && NR.kitNovoMinPct || 80)+"% ou mais e negocia o resto na hora pode levar o kit.");
    linhasSit.push("Comissão da representante: fica retida só sobre o valor pendente.");
    linhasSit.push("Pagou depois? Registre em Inadimplência › Registrar pagamento. O valor quita primeiro a dívida mais antiga.");
    linhasSit.push("Com "+((NR && NR.juridicoDias) || 60)+" dias de atraso perde comissão e brinde e vai ao Jurídico.");
  }
  var blocoSit = vc && l.ac && e(Bloco,{key:"sit", t:"Situação do pagamento", dir:e("span",{className:l.falta<=0.009 ? "text-success" : "text-destructive"}, sitDir)},
    e(Par,{t:"Total a pagar", v:BK(l.devido)}), e(Par,{t:"Pagou", v:BK(l.pago)+" · "+pctPago+"%", cor:l.pago>0.009 ? "text-success" : ""}), l.falta>0.009 && e(Par,{t:"Falta pagar", v:BK(l.falta), cor:"text-destructive"}),
    pzS && e(Par,{t:"Prazo", v:pzS.atraso>0 ? pzS.atraso+" dias de atraso · +"+pzS.pct+"%" : "dia "+pzS.dias+" de "+pzS.prazo, cor:pzS.atraso>0 ? "text-destructive" : ""}),
    linhasSit.length>0 && e("details",{className:"border-b border-white/30 px-2 py-1 text-center text-[11px]"}, e("summary",{className:"cursor-pointer font-semibold"}, "Regras da cobrança"), linhasSit.map(function(x, i){ return e("p",{key:i, className:"py-0.5"}, x); })));
  var blocoConf = e(Bloco,{t:"Conferência", dir:e("span",{className:ok ? "text-success" : "text-white"}, ok ? "Conferido" : rodando ? "Em andamento" : "Não iniciada")},
    rec.inicioTs && e(Par,{t:"Início", v:hmd(rec.inicioTs)+" "+hm(rec.inicioTs)}), rec.fimTs && e(Par,{t:"Fim", v:hmd(rec.fimTs)+" "+hm(rec.fimTs)+" · "+tempoEntre(r, rec.fimTs)}), rec.quem && e(Par,{t:"Conferido por", v:rec.quem}),
    !rec.inicioTs && !ok && e("p",{className:"border-b border-white/30 px-2 py-1 text-center text-[11px]"}, "A conferência ainda não começou."),
    e("div",{className:"flex justify-center px-2 py-1"}, e(Botao,{principal:!ok, desabilitado:!agenda, onClick:p.onRelogio}, ok ? "Desfazer conferência" : rodando ? "Terminar conferência" : "Iniciar conferência")));
  var colB = e("div",{key:"b", className:"flex flex-col"},
    blocoConf,
    !(l.repos || r.tipoKit==="saiu") && e(Bloco,{t:"Condicionais · "+nums.length, dir:e("span",{className:l.condOk ? "text-success" : "text-white"}, ce.resumo)},
      nums.length===0 && e("p",{className:"px-2 py-1 text-center text-[11px]"}, "Nenhuma condicional."),
      nums.map(function(n){ var a = assinadaDe(rec, n), c = a===true ? "text-success" : a===false ? "text-destructive" : "";
        return e("div",{key:n, className:"grid min-h-7 grid-cols-[1fr_6rem_1.5rem] items-center gap-2 border-b border-white/30 px-2 text-center text-[11px]"},
          e("b",{className:"tabular-nums "+c}, n+(pecasDe(n)>0 ? " · "+pecasDe(n)+" peças" : "")),
          agenda ? e("select",{value:a===true ? "sim" : a===false ? "nao" : "", "aria-label":"Assinatura da condicional "+n, className:CAMPO, onChange:function(ev){ define(n, ev.target.value); }}, OPS_ASS.map(function(o){ return e("option",{key:o[0], value:o[0], className:"bg-[#1f3358]"}, o[1]); })) : e("span",{className:c}, a===true ? "Assinada" : a===false ? "Não assinada" : "A conferir"),
          agenda ? e("button",{type:"button", onClick:function(){ tira(n); }, "aria-label":"Tirar a condicional "+n, title:"Tirar a condicional "+n, className:"mx-auto grid size-5 place-items-center rounded hover:bg-white/20"}, "×") : e("span",null)); }),
      agenda && e("div",{className:"grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/30 px-2 py-1"},
        e("input",{value:v, placeholder:"Nº da nova condicional", "aria-label":"Número da condicional", className:CAMPO, onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") adiciona(); }}),
        e(Botao,{onClick:adiciona, desabilitado:!v.trim()}, "Adicionar"))));
  var blocoDin = l.dinTot>0 && e(Bloco,{key:"din", t:"Dinheiro", dir:e("span",{className:din.ok && l.repDinOk && !diverge ? "text-success" : "text-white"}, dinTxt)},
      e(Par,{t:"Valor lançado", v:BK(l.dinTot), cor:"text-success"}),
      din.ok && e(Par,{t:"Empresa", v:"✓ Recebido", cor:"text-success"}), din.ok && e(Par,{t:"Representante", v:l.repDinOk ? "✓ Confirmou" : "Aguarda", cor:l.repDinOk ? "text-success" : "text-white"}),
      diverge && e(Par,{t:"Contado", v:BK(din.contado)+" · falta "+BK(l.dinTot-din.contado), cor:"text-destructive"}),
      !din.ok && agenda && e("div",{className:"grid grid-cols-[1fr_auto] items-center gap-2 border-b border-white/30 px-2 py-1"},
        e(MoneyInput,{value:contado==null ? l.dinTot : contado, label:"Dinheiro contado", className:"w-full h-[22px]! px-1! text-center! text-[11px]! bg-white/10! border-white/40!", onChange:setContado}),
        e(Botao,{principal:true, onClick:function(){ var c2 = contado==null ? l.dinTot : contado; p.onDin(Math.abs(c2-l.dinTot)>0.009 ? c2 : null); }}, "Recebi o dinheiro")),
      din.ok && agenda && !ok && e("div",{className:"flex justify-center px-2 py-1"}, e(Botao,{onClick:p.onDinDesfaz}, "Desfazer")));
  var blocoPag = vc && (r.pagamentos||[]).length>0 && e(Bloco,{key:"pag", t:"Formas de pagamento · "+(r.pagamentos||[]).length},
      (r.pagamentos||[]).map(function(pg, i){ var f = FORMA_PALAVRA[pg.forma] || pg.forma, c = pg.descricao ? rotuloConta(pg.descricao, false) : "";
        return e("div",{key:i, className:PAR}, e("span",null, c && c.toLowerCase()!==String(f).toLowerCase() ? f+" · "+c : f), e("b",{className:"tabular-nums"}, BK(pg.valor||0))); }));
  var colP = e("div",{key:"p", className:"flex flex-col"}, blocoSit, blocoPag, blocoDin, blocoMulta, !blocoSit && !blocoPag && !blocoDin && e(Bloco,{t:"Pagamento"}, e("p",{className:"px-2 py-1 text-center text-[11px]"}, "Este atendimento não tem pagamento.")));
  var colR = e("div",{key:"r", className:"flex flex-col"},
    e(Bloco,{t:"Retorno · bipar", dir:e("span",{className:rec.bip ? "text-success" : "text-white"}, rec.bip ? "Bipado" : !rec.ok ? "Aguarda recebimento" : "Falta bipar")},
      e("p",{className:"px-2 py-1 text-center text-[11px] "+(rec.bip ? "text-success" : "font-semibold text-white")}, retTxt),
      rec.ok && p.podeBip && e("div",{className:"flex justify-center px-2 py-1"}, e(Botao,{principal:!rec.bip, onClick:p.onBipar}, rec.bip ? "Desfazer" : "Bipei"))),
    l.ac && p.podeBip && e(Diferencas,{l:l, kits:p.kits, podeBip:p.podeBip, usuarioNome:p.usuarioNome, onDif:p.onDif, onDifTira:p.onDifTira}));
  var pm = function(parte){ return e(PecasMini,{parte:parte, l:l, agenda:agenda, receber:p.receber, todos:p.todos, usuario:p.usuario, podeProx:p.podeProx}); };
  var col = function(k, c){ return e("div",{key:k, className:"flex flex-col"}, c); };
  var semPecas = e(Bloco,{t:"Peças e brindes"}, e("p",{className:"px-2 py-1 text-center text-[11px]"}, "Este atendimento não tem peças do acerto."));
  var dois = function(k, a, b){ return e("div",{key:k, className:"flex flex-col"}, a, b); };
  var vazio = function(k, titulo, msg){ return col(k, e(Bloco,{t:titulo}, e("p",{className:"px-2 py-1 text-center text-[11px]"}, msg))); };
  // 8 blocos fixos, numerados, 4 em cima e 4 embaixo (Marcus, 26/11/2026). 1 e 2 juntos mostram o acerto e todo o pagamento; os outros ficam como estão até ele melhorar.
  var celulas = [colA, colP, colB, col("info", blocoInfo), colR, l.ac ? col("c5", pm("pecas")) : col("c5", semPecas), l.ac ? col("c6", pm("prox")) : vazio("c6", "Peças do próximo mês", "Não se aplica."), l.ac ? col("c7", pm("trocas")) : vazio("c7", "Trocas", "Não se aplica.")];
  var cheias = celulas.map(function(c, i){ return e("div",{key:"n"+i, className:"relative flex flex-col"}, e("span",{className:"absolute left-1 top-0.5 z-10 grid size-4 place-items-center rounded-full bg-white/20 text-[10px] font-bold"}, i+1), c); });
  return e(FichaJanela,{t:"Ficha do atendimento", fechar:p.fechar, colunas:cheias});
}

// Multa lançada pela representante no app: remarcação com multa ou isenta (com o motivo), atraso do Kit 100% Prata e as regras de 27/10/2026
// (multa do valor pendente, contagem dos 15 dias, kit novo bloqueado e jurídico). Devolve as partes do texto, cada uma com a cor do estado.
function partesMulta(r, pct, falta){
  var rem = r.remarcacoes || [], mu = rem.filter(function(x){ return !x.isenta; }), is = rem.filter(function(x){ return x.isenta; }), atr = r.atrasoDias || 0;
  var pz = falta>0.009 ? prazoPendente(r, isoDia(new Date())) : null, multa = r.multas || 0, o = [];
  if(mu.length>0) o.push({l:"Multa por remarcação", v:mu.length+(mu.length===1 ? " multa" : " multas")+(pct>0 ? " · −"+pct+"% da comissão" : ""), t:mu.length+(mu.length===1 ? " multa" : " multas")+(pct>0 ? " −"+pct+"%" : ""), c:"text-destructive", d:"Remarcação com multa"+(pct>0 ? " · tirou "+pct+"% da comissão" : "")});
  if(is.length>0) o.push({l:"Remarcação isenta", v:is.length+(is.length===1 ? " isenta" : " isentas"), t:is.length+(is.length===1 ? " isenta" : " isentas"), c:"text-success", d:is.map(function(x){ return x.motivo || "isenta"; }).join("\n")});
  if(atr>0) o.push({l:"Atraso no acerto", v:atr+(atr===1 ? " dia" : " dias"), t:"atraso "+atr+"d", c:"text-destructive"});
  if(r.juridico) o.push({l:"Jurídico", v:"Sim", t:"jurídico", c:"text-destructive", d:"60 dias de atraso: perde comissão e brinde e vai ao jurídico"});
  if(multa>0) o.push({l:"Multa de "+(r.regrasNovas ? r.regrasNovas.multaPendentePct : 10)+"% sobre o pendente", v:BK(multa), t:"multa "+BK(multa), c:"text-destructive", d:"Multa de "+(r.regrasNovas ? r.regrasNovas.multaPendentePct : 10)+"% sobre o valor pendente"});
  if(pz) o.push({l:"Prazo para quitar", v:pz.atraso>0 ? pz.atraso+" dias de atraso · +"+pz.pct+"%" : "dia "+pz.dias+" de "+pz.prazo, t:pz.atraso>0 ? pz.atraso+"d de atraso" : pz.dias+"/"+pz.prazo+" dias", c:pz.atraso>0 ? "text-destructive" : "text-white", d:pz.atraso>0 ? "Prazo vencido: multa de atraso de "+pz.pct+"% sobre o pendente" : "Prazo para quitar o valor pendente"});
  if(pz) o.push({l:"Kit novo", v:"Bloqueado", t:"kit bloqueado", c:"text-destructive", d:"Próximo kit só depois de quitar o valor pendente"});
  return o;
}

// Brindes, trocas e peças do próximo mês de um atendimento. A funcionária confere peça por peça: se faltou uma peça que tinha saído como brinde, ela marca aqui que está tudo certo.
// FICHA no padrão do Consolidado (Marcus, 23/11/2026): UMA borda azul em volta, blocos ligados (barra azul de título e linhas brancas de 30%), tudo centralizado, letra de 11 px.
var CAMPO = "h-[22px] w-full min-w-0 rounded border border-white/40 bg-white/10 px-1 text-center text-[11px] text-white outline-none placeholder:text-white/70 focus-visible:ring-2 focus-visible:ring-white";
function Bloco(p){
  return e("section",{className:"flex flex-col"},
    e("div",{className:"flex min-h-6 items-center justify-center gap-3 whitespace-nowrap border-y border-white/30 bg-[var(--bloco-titulo)] px-2 text-center text-[11px] font-bold text-white"}, e("span",null,p.t), p.dir),
    e("div",{className:"flex flex-col"}, p.children));
}
function Botao(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.desabilitado, className:"h-[22px] min-w-20 whitespace-nowrap rounded border px-2 text-[11px] font-semibold "+(p.principal ? "border-primary bg-primary/20 text-primary hover:bg-primary/30" : "border-white/40 bg-white/10 text-white hover:bg-white/20")+(p.desabilitado ? " opacity-50" : "")}, p.children);
}
// ficha compacta como Contas a pagar (Marcus, 23/11/2026): letra de 10 px, linhas de 20 px e controles de 18 px; fundo azul-marinho do sistema, nunca preto
var FICHA_FINA = "[&_*]:!text-[10px] [&_.min-h-6]:!min-h-5 [&_.min-h-7]:!min-h-6 [&_button]:!h-[18px] [&_select]:!h-[18px] [&_input]:!h-[18px] [&_button]:!leading-none";   // padrao-ok: igual à Contas a pagar (10 px, 18 px)
function FichaJanela(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-[#0b1530]/85 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"max-h-[92vh] w-full max-w-[98vw] overflow-y-auto [&_*]:!normal-case "+FICHA_FINA+" "+PADRAO_BLOCOS},
      e(BlocoPainel,{titulo:p.t, dir:e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", title:"Fechar", className:"grid size-6 place-items-center rounded hover:bg-white/20"}, "×")},
        e("div",{className:"bg-[#0f1729]"},
          p.sub && e("p",{className:"px-2 py-1 text-center text-[11px]"}, p.sub),
          e("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 [&>*]:border-b [&>*]:border-white/30 lg:[&>*:not(:nth-child(4n))]:border-r"}, p.colunas)))));
}
function PecasMini(p){
  var cn = useState(""), numNova = cn[0], setNumNova = cn[1];
  var r = p.l.r, rec = p.l.rec, ok = rec.pecasOk || {}, lista = lancadosDe(r);
  var anterior = (p.todos||[]).filter(function(a){ return a.tipo==="acerto" && a.rev===r.rev && a.id!==r.id && (a.data||"")<(r.data||""); }).sort(function(a,b){ return a.data<b.data ? 1 : -1; })[0],
    retiradas = anterior ? lancadosDe(anterior).filter(function(b){ return b.origem==="nova"; }) : [],
    normal = lista.filter(function(b){ return b.cat==="normal"; }), bb = lista.filter(function(b){ return b.cat==="bb"; }), prox = (r.pecasProxCodigos||[]);
  var marca = function(cod){ if(!p.agenda) return p.receber(r.id, {}); var o = Object.assign({}, ok); o[cod] = !o[cod]; p.receber(r.id, {pecasOk:o}); };
  var salvaNova = function(){ if(numNova) p.receber(r.id, {condNova:{numero:numNova, por:p.usuario, em:new Date().toISOString()}}); };
  var somaDe = function(itens){ return r2(itens.reduce(function(t2,i){ return t2+(i.valor||0); }, 0)); };
  var linhaPeca = function(i){ var on = !!ok[i.codigo];
    return e("div",{key:i.codigo, className:"grid min-h-6 grid-cols-[1.25rem_1fr_auto] items-center gap-2 border-b border-white/30 px-2 text-[11px]"},
      e("button",{type:"button", disabled:!p.agenda, onClick:function(){ marca(i.codigo); }, "aria-label":(on ? "Desmarcar " : "Marcar como conferida ")+i.codigo, title:on ? "Conferida" : "Conferir", className:"text-center font-bold disabled:opacity-50"}, e("span",{className:on ? "text-success" : "text-white"}, on ? "✓" : "○")),
      e("span",{className:"text-center font-semibold tabular-nums"+(on ? " text-success" : "")}, i.codigo+(i.origem ? " · "+(i.origem==="antiga" ? "Kit antigo" : "Kit novo") : "")),
      e("span",{className:"tabular-nums"}, i.valor!=null ? BK(i.valor) : "—")); };
  var blocoBr = function(titulo, itens){ var feitas = itens.filter(function(i){ return ok[i.codigo]; }).length;
    return e(Bloco,{key:titulo, t:titulo+" · "+itens.length, dir:e("span",{className:feitas===itens.length && itens.length>0 ? "text-success" : "text-white"}, feitas+"/"+itens.length)},
      itens.length===0 ? e("p",{className:"border-b border-white/30 px-2 py-1 text-center text-[11px]"}, "Nenhum brinde.") : itens.map(linhaPeca),
      e("div",{className:"grid min-h-6 grid-cols-2 items-center gap-2 border-b border-white/30 px-2 text-center text-[11px] font-bold"}, e("span",null,"Lançado"), e("span",{className:"tabular-nums"}, BK(somaDe(itens))))); };
  var celula = function(t, v){ return e("div",{key:t, className:"flex flex-col items-center border-r border-white/30 py-1 last:border-r-0"}, e("span",{className:"text-[11px]"}, t), e("b",{className:"text-[11px] tabular-nums"}, v==null || v==="" ? "—" : v)); };
  var pecas = e(Bloco,{t:"Peças do acerto"}, e("div",{className:"grid grid-cols-5 border-b border-white/30"}, celula("Total", r.pecasCond), celula("Vendidas", r.pecasVendidas), celula("Trocas", r.pecasTrocas||0), celula("Brindes", lista.length), celula("Retornadas", r.pecasADevolver)));
  var brindes = e("div",{className:"flex flex-col"}, blocoBr("Brindes normal", normal), blocoBr("Brindes BB", bb));
  var trocas = (r.trocas||[]).length>0 && e(Bloco,{key:"tr", t:"Trocas · "+r.trocas.length},
    r.trocas.map(function(t, i){ var aj = t.tipo==="anterior" ? (t.novaValor||0)-(t.antigaValor||0) : (t.novaValor||0);
      return e("div",{key:i, className:"grid min-h-6 grid-cols-[1fr_1fr_1fr] items-center gap-2 border-b border-white/30 px-2 text-center text-[11px]"},
        e("span",null, "Voltou "+t.antigaCod+" · "+BK(t.antigaValor)), e("span",null, "Ficou "+t.novaCod+" · "+BK(t.novaValor)), e("b",{className:"tabular-nums"}, (aj>=0 ? "Soma " : "Desconta ")+BK(Math.abs(aj)))); }));
  var blocoProx = prox.length>0 && e(Bloco,{key:"px", t:"Peças do próximo mês · "+prox.length}, prox.map(function(c){ return linhaPeca({codigo:c}); }));
  var condNova = prox.length>0 && e(Bloco,{key:"cn", t:"Condicional nova", dir:e("span",{className:rec.condNova ? "text-success" : "text-white"}, rec.condNova ? "Gerada" : "Pendente")},
    rec.condNova ? e("div",{className:"flex items-center justify-center gap-3 px-2 py-1 text-[11px]"}, e("b",{className:"tabular-nums text-success"}, "✓ "+rec.condNova.numero), p.podeProx && e(Botao,{onClick:function(){ p.receber(r.id, {condNova:null}); }}, "Desfazer"))
      : p.podeProx ? e("div",{className:"grid grid-cols-[1fr_auto] items-center gap-2 px-2 py-1"},
          e("input",{value:numNova, placeholder:"Nº da condicional nova", title:"Faça a nova bipagem na DevMaster e coloque aqui o número da condicional nova", "aria-label":"Número da condicional nova", className:CAMPO, onChange:function(ev){ setNumNova(ev.target.value.replace(/[^0-9]/g,"")); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvaNova(); }}),
          e(Botao,{principal:true, desabilitado:!numNova, onClick:salvaNova}, "Salvar"))
      : e("p",{className:"px-2 py-1 text-center text-[11px] font-semibold text-white"}, "Aguardando quem faz a bipagem do retorno"));
  var tiradas = anterior && retiradas.length>0 && e(Bloco,{key:"mal", t:"Tiradas do kit novo · acerto de "+fmtData(anterior.data)}, retiradas.map(function(i){ return e("div",{key:i.codigo, className:"grid min-h-6 grid-cols-2 items-center gap-2 border-b border-white/30 px-2 text-center text-[11px]"}, e("b",{className:"tabular-nums"}, i.codigo), e("span",{className:"tabular-nums"}, i.valor!=null ? BK(i.valor) : "—")); }));
  if(p.parte==="trocas") return e("div",{className:"flex flex-col"}, trocas || e(Bloco,{t:"Trocas · 0"}, e("p",{className:"px-2 py-1 text-center text-[11px]"}, "Nenhuma troca neste acerto.")));
  if(p.parte==="prox") return e("div",{className:"flex flex-col"}, blocoProx || e(Bloco,{t:"Peças do próximo mês · "+(r.pecasProxLiberadas||0)}, e("p",{className:"px-2 py-1 text-center text-[11px]"}, r.pecasProxLiberadas>0 ? r.pecasProxLiberadas+" peças liberadas pela representante. Os códigos não vieram do app." : "Nenhuma peça para o próximo mês.")), condNova, tiradas);
  return e("div",{className:"flex flex-col"}, pecas, brindes);
}

// Passo a passo para quem atende a representante na empresa (abre pelo botão da barra)
var PASSOS = [
  ["Selecione a representante", "No campo Representante, escolha quem chegou. A tela só mostra os atendimentos dela."],
  ["Inicie a conferência", "Na coluna Conferência, clique em Iniciar em cada atendimento dela."],
  ["Confira as condicionais", "Digite o número e clique em +. Em cada uma, escolha Assinada ou Não assinada."],
  ["Confira o dinheiro", "Conte e clique em Recebi o dinheiro. Se o valor for outro, digite o que contou."],
  ["Confira os pagamentos", "Veja se cada pagamento está na conta da empresa, não na conta da representante."],
  ["A representante dá baixa no app", "Em Comissões › Entrega na empresa, ela marca o dinheiro e as condicionais."],
  ["Termine a conferência", "Clique em Terminar. Só termina com a sua baixa e a baixa dela."]];
function PassoAPasso(p){
  return e(Janela,{t:"Passo a passo", sub:"Quando chegar uma representante", fechar:p.fechar, colunas:[
    e(TabelaPlanilha,{key:"t", cols:[{k:"n", t:"Passo"}, {k:"t", t:"O que fazer"}, {k:"d", t:"Como"}], linhas:PASSOS.map(function(x, i){ return {n:i+1, t:x[0], d:x[1]}; }), chave:"n", grade:true, semFiltro:true, semContagem:true, semCaixaAlta:true, semMao:true})]});
}

var corStatus = function(t){ return t.indexOf("Acerto + kit")===0 ? "text-success" : t==="Acerto + saiu" ? "text-destructive" : t.indexOf("Kit novo")===0 ? "text-info" : t==="Reposição" ? "text-white" : ""; };
var SEMPRE = {venda:1, acerto:1, devido:1, pago:1, falta:1};   // totais que aparecem mesmo zerados; os outros só quando há valor
var somaK = function(ls, k){ return r2(ls.reduce(function(t, x){ return t+(Number(x[k]) || 0); }, 0)); };

function AbaConsolidadoRep(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = new Date();
  var mm = useState(hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0")), mes = mm[0], setMes = mm[1];
  var vv = useState("lista"), vista = vv[0], setVista = vv[1];                 // Atendimentos (uma linha por atendimento) ou Por representante (uma linha por representante)
  var ri = useState(""), repIni = ri[0], setRepIni = ri[1];                    // clicou numa representante na visão Por representante: a tabela abre já filtrada nela
  var pa = useState("todas"), pagModo = pa[0], setPagModo = pa[1];             // colunas das contas de pagamento: começam ABERTAS, uma coluna para cada conta (Marcus, 23/11/2026); dá para deixar só as contas com valor ou fechar
  var pe = useState("aberto"), pecasModo = pe[0], setPecasModo = pe[1];        // colunas de peças e brindes: começam abertas (Marcus, 23/11/2026)
  var ru = useState(""), revUnica = ru[0], setRevUnica = ru[1];                // o filtro das colunas deixou UMA revendedora: os pagamentos mostram só as contas com valor dela e as peças ficam abertas
  var cmS = useState("resumo"), colunasModo = cmS[0], setColunasModo = cmS[1];   // resumo = poucas colunas (o detalhe está no card) · completo = todas
  var kk = useState(false), knAberto = kk[0], setKnAberto = kk[1];
  var dt = useState(null), popId = dt[0], setPopId = dt[1];                    // atendimento com a janela de brindes e peças aberta
  var pc = useState(false), passosAberto = pc[0], setPassosAberto = pc[1];
  var ms = useState("pend"), mostra = ms[0], setMostra = ms[1];               // pend = acertos que a representante fez no app e ainda não foram conferidos na empresa (de qualquer mês) · todos = todos os do mês
  var bu = useState(""), busca = bu[0], setBusca = bu[1];                      // busca da revendedora (acha o atendimento e a representante)
  var filtradas = useRef(null), selRef = useRef(null);
  var selAbertoSt = useState(false), selAberto = selAbertoSt[0], setSelAberto = selAbertoSt[1];
  var digSt = useState(""), dig = digSt[0], setDig = digSt[1];   // a lista da representante está aberta (bloco amarelo com lista azul)                                              // o que está na tabela depois dos filtros das colunas (para exportar)

  var c = comisEfetiva(s), agenda = podeAgendar(s.usuario), ver = veTotais(s.usuario);
  var todos = (s.acertosConsignado||[]).filter(function(r){ return TIPOS.indexOf(r.tipo)>=0 && r.origem!=="interno"; });   // atendimento interno tem consolidado próprio
  var meses = todos.map(function(r){ return (r.data||"").slice(0,7); }).concat([mes]).filter(function(m,i,a){ return m && a.indexOf(m)===i; }).sort().reverse();
  // 25/11/2026 (Marcus): a funcionária SEMPRE escolhe a representante (ou busca a revendedora) antes de ver os atendimentos. Aparecem os PENDENTES: acerto feito no app e ainda não conferido na empresa.
  var doMes = todos.filter(function(r){ return (r.data||"").slice(0,7)===mes; });
  var pendAll = todos.filter(function(r){ return !(r.recebimento && r.recebimento.ok); });
  var exigeRep = vista==="lista", q = semAcento(busca).trim(), semRep = exigeRep && !repIni && !q;
  var TODAS = "__todas__", umaRep = !!repIni && repIni!==TODAS;   // "Todas as representantes" (Marcus, 26/11/2026)
  var daRep = function(x){ return !umaRep || nome(x.rep)===repIni; };
  var cru = (exigeRep && mostra==="pend" ? pendAll : doMes).filter(function(r){ return (!exigeRep || !umaRep || nome(r.rep)===repIni) && (!exigeRep || !q || semAcento(nome(r.rev)).indexOf(q)>=0); });
  var linhas = (semRep ? [] : cru).map(function(r){ return linha(r, c); }).sort(function(a,b2){ return (b2.r.data+(b2.r.hora||"")).localeCompare(a.r.data+(a.r.hora||"")); });
  var porRepPend = {}; pendAll.forEach(function(r){ var k = nome(r.rep) || "—", o = porRepPend[k] || (porRepPend[k] = {id:k, rep:k, qtd:0, desde:""}); o.qtd++; if(r.data && (!o.desde || r.data<o.desde)) o.desde = r.data; });
  var linhasPend = Object.keys(porRepPend).map(function(k){ return porRepPend[k]; }).sort(function(a, b2){ return b2.qtd-a.qtd || a.rep.localeCompare(b2.rep); });
  var repsOps = (mostra==="pend" ? pendAll : doMes).map(function(r){ return nome(r.rep) || "—"; }).filter(function(x, i, a){ return a.indexOf(x)===i; }).sort(function(a, b2){ return a.localeCompare(b2); })
    .map(function(x){ var n = (porRepPend[x]||{}).qtd||0; return [x, x+(n ? " · "+n+(n===1 ? " pendente" : " pendentes") : "")]; });
  if(umaRep && !repsOps.some(function(o){ return o[0]===repIni; })) repsOps.unshift([repIni, repIni]);
  var formasCol = (s.formasPagamento||[]).filter(function(f){ return f.k==="dinheiro"; }).concat((s.formasPagamento||[]).filter(function(f){ return f.k!=="dinheiro"; }));
  var somaForma = function(l, k){ return (l.r.pagamentos||[]).filter(function(p){ return p.forma===k; }).reduce(function(t,p){ return t+(p.valor||0); }, 0); };
  var kn = itensComissao(c, s, Date.now()).filter(function(i){ return i.tipo==="kitnovo" && (i.data||"").slice(0,7)===mes && daRep(i); }).sort(function(a,b2){ return b2.ts-a.ts; });

  var pessoasRecebem = BIPADORAS.concat([SUPERVISORA], AGENDAMENTO, FINANCEIRO);
  var usuarioNome = (pessoasRecebem.find(function(x){ return x.id===s.usuario; })||{}).nome || "";   // quem confere é quem está logada (cada uma tem seu login)
  var podeBip = podeBiparRetorno(s, s.usuario, BIPA_RETORNO_PADRAO(), papelDe(s.usuario)==="supervisao");   // quem bipa (Configurador geral) e a diretoria; o agendamento NÃO bipa nem registra diferença (Marcus, 26/11/2026)
  var vc = ver || podeBip || agenda;   // valores da linha: quem bipa o retorno e o agendamento precisam deles para conferir o acerto; os totais seguem só para quem tem "valores"
  var receber = function(id, patch){ if(!agenda) return d({type:"AVISO", txt:"Só o agendamento e a supervisão conferem os atendimentos"}); d({type:"CONSREP_RECEBER", id:id, patch:patch}); };
  var agora = function(){ return new Date().toISOString(); };
  // conferência: 1º clique começa, 2º clique termina (grava a data de recebimento); clicar no conferido desfaz
  var relogio = function(l){
    var rec = l.rec;
    if(rec.ok){ if(l.an.linhas.some(function(x){ return x.fin; }) || (l.r.fin && l.r.fin.k)) return d({type:"AVISO", txt:"Já tem conciliação do financeiro: não dá para desfazer", tom:"atencao"}); return receber(l.r.id, {ok:false, fimTs:null}); }
    if(!rec.inicioTs) return receber(l.r.id, {inicioTs:agora(), por:s.usuario, quem:usuarioNome});
    if(l.dinTot>0 && !(rec.din && rec.din.ok)) return d({type:"AVISO", txt:"Confirme o dinheiro recebido antes de terminar a conferência", tom:"atencao"});
    if(l.dinTot>0 && !l.repDinOk) return d({type:"AVISO", txt:"Falta a representante confirmar o dinheiro no app dela", tom:"atencao"});
    if((l.r.pagamentos||[]).some(function(p){ return !(p.valor>0); })) return d({type:"AVISO", txt:"Há pagamento com valor zero neste acerto", tom:"atencao"});
    if(l.pago > l.devido + 0.009) return d({type:"AVISO", txt:"O valor recebido é maior que o acerto", tom:"atencao"});
    receber(l.r.id, {ok:true, fimTs:agora(), quem:usuarioNome, por:s.usuario, entrega:isoDia(new Date())});
  };

  var abre = function(l, inicia){ if(inicia && agenda && !l.rec.ok && !l.rec.inicioTs) relogio(l); setPopId(l.r.id); };   // Iniciar = começa a conferência e abre a ficha; clicar na linha só abre
  var exportar = function(){
    var lista = (filtradas.current || []).map(function(x){ return x.l; }).filter(Boolean);
    if(!filtradas.current) lista = linhas;
    var cab = ["Data do acerto","Hora","Início da conferência","Recebido em","Representante/Interno","Revendedora","Status","Vendas","Taxa","Taxa paga","Comissão %","Valor do acerto","Valor pago","Inadimplente"].concat(formasCol.map(function(f){ return f.label; }),
      ["Condicional assinada","Nº condicionais","Peças","Vendidas","Retornadas","Peças de brinde","Próximo mês","Desc. crédito","Brinde normal","Retirado normal","Brinde select","Retirado select","Excedente","Conferido por"]);
    var rows = lista.map(function(l){ var r = l.r, rec = l.rec; return [fmtData(r.data), r.hora||"", rec.inicioTs||"", rec.fimTs||"", r.rep, r.rev, l.status,
      l.ac ? r.vendaLiquida : "", l.tx.taxa||"", l.tx.taxa>0 ? (l.tx.paga ? "Sim" : "Não") : "", l.ac ? r.comissaoPct : "", l.ac ? l.devido : "", l.pago, l.falta].concat(formasCol.map(function(f){ return somaForma(l, f.k); }),
      [l.condNec ? (l.condOk ? "Sim" : "Não") : "", numsCond(l).join(" "), r.pecasCond||"", r.pecasVendidas||"", r.pecasADevolver==null ? "" : r.pecasADevolver, r.pecasBrinde||"", (r.pecasProxCodigos||[]).length||"",
      r.garantia||"", r.brindeNormal||"", l.brindes.lancadoNormal||"", r.brindeSelect||"", l.brindes.lancadoSelect||"", r.excedenteBrinde||"", rec.quem||""]); });
    var csv = [cab].concat(rows).map(function(row){ return row.map(function(x){ return '"'+String(x==null?"":x).replace(/"/g,'""')+'"'; }).join(";"); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿"+csv], {type:"text/csv;charset=utf-8"})); a.download = "consolidado-representantes-"+mes+".csv"; a.click();
  };
  var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };

  // ───────── colunas de pagamento: CNPJs → Sem faturamento → Família; no fim Pix representante e Acerto com loja (cada um UMA coluna) ─────────
  var pagEf = revUnica ? "usadas" : pagModo, pecasAbertas = pecasModo==="aberto" || !!revUnica, linhasUso = revUnica ? linhas.filter(function(l){ return nome(l.r.rev)===revUnica; }) : linhas;
  var usa = function(k, cn){ return pagEf==="todas" || linhasUso.some(function(l){ return somaConta(l.r, k, cn)>0; }); };
  var formasOrd = formasCol.filter(function(f){ return f.k!=="pix_representante" && f.k!=="acerto_loja" && f.k!=="dinheiro"; });   // o dinheiro tem coluna própria no começo de Pagamentos
  var estr = pagEf==="fechado" ? [] : GRUPOS_CONTA.map(function(g){
    var contas = []; formasOrd.forEach(function(f){ (f.descricoes||[]).forEach(function(cn){ if(grupoDaConta(cn)===g.id && usa(f.k, cn)) contas.push({k:f.k, conta:cn, chave:"pg|"+f.k+"|"+cn, t:(FORMA_PALAVRA[f.k] || f.label)+" · "+rotuloConta(cn, g.id!=="sem" && g.id!=="fam")}); }); });
    return {g:g, contas:contas}; }).filter(function(x){ return x.contas.length>0; });
  var fimCols = pagEf==="fechado" ? [] : [{k:"pix_representante", chave:"pg|pix_representante", t:"Pix representante"}, {k:"acerto_loja", chave:"pg|acerto_loja", t:"Acerto com loja"}]
    .filter(function(c2){ return formasCol.some(function(f){ return f.k===c2.k && (f.descricoes||[]).length>0; }) && usa(c2.k, null); });
  var contaCat = function(r, cat){ return lancadosDe(r).filter(function(b){ return b.cat===cat; }).length; };

  // ───────── linhas da tabela: tudo já calculado, um valor por coluna (o filtro e a ordem da coluna usam estes valores) ─────────
  var linhasTab = linhas.map(function(l){ var r = l.r, rec = l.rec, ac = l.ac, x = l.tx, saiu = r.tipoKit==="saiu", nums = numsCond(l), ass = nums.map(function(n){ return assinadaDe(rec, n); });
    var multaPct = ac ? ((r.descontoRemarcacao||{}).comissaoPct||0)+(r.atrasoPct||0) : 0, multa = vc ? partesMulta(r, multaPct, l.falta) : [];
    var lanc = lancadosDe(r), okp = rec.pecasOk||{}, nTr = (r.trocas||[]).length || r.pecasTrocas || 0, prox = r.pecasProxCodigos||[];
    var o = {id:r.id, l:l, multaPartes:multa,
      dif:(rec.dif||[]).length || "",
      conf:rec.ok ? "Conferido" : rec.inicioTs ? "Em conferência" : "A conferir", data:r.data||"", hora:r.hora||"", recebido:rec.fimTs ? isoDia(new Date(rec.fimTs)) : "", rep:nome(r.rep)||"—", rev:nome(r.rev), status:l.status,
      cond:(l.repos || saiu) ? "" : !nums.length ? "Sem número" : ass.every(function(a){ return a===true; }) ? "Assinada" : ass.some(function(a){ return a===false; }) ? "Não assinada" : "A conferir",
      retorno:!rec.ok ? "Aguarda recebimento" : rec.bip ? "Bipado por "+rec.bip.por : "Falta bipar",
      garantia:vc && ac && r.garantia>0 ? r.garantia : "", venda:vc && ac ? (r.vendaLiquida||0) : "", comissao:vc && ac ? r.comissaoPct : "", acerto:vc && ac ? (r.valorAcerto||0) : "",
      taxa:vc && x.taxa>0 ? BK(x.taxa)+(x.paga ? " · paga" : " · não paga") : "", excedente:vc && ac && r.excedenteBrinde>0 ? r.excedenteBrinde : "", tags:vc && ac && r.tagsValor>0 ? r.tagsValor : "",
      devido:vc && ac ? l.devido : "", pago:vc && ac ? l.pago : "", multa:multa.map(function(m){ return m.t; }).join(" · "), falta:vc && l.falta>0.009 ? l.falta : "",
      din:l.dinTot<=0 ? "" : !l.din.ok ? "Falta receber" : (l.din.contado!=null && Math.abs(l.din.contado-l.dinTot)>0.009) ? "Divergente" : l.repDinOk ? "Recebido" : "Aguarda representante",
      pecas:r.pecasCond||"", vendidas:r.pecasVendidas||"", trocas:r.pecasTrocas||"", qNormal:contaCat(r,"normal")||"", qBB:contaCat(r,"bb")||"",
      proxQ:ac && r.pecasProxLiberadas>0 ? prox.length+"/"+r.pecasProxLiberadas : "", retornadas:r.pecasADevolver==null ? "" : r.pecasADevolver,
      bNormal:vc && ac ? (r.brindeNormal||0) : "", bSelect:vc && ac ? (r.brindeSelect||0) : "", rNormal:vc && ac && l.brindes.lancadoNormal>0 ? l.brindes.lancadoNormal : "", rSelect:vc && ac && l.brindes.lancadoSelect>0 ? l.brindes.lancadoSelect : "",
      exced2:vc && r.excedenteBrinde>0 ? r.excedenteBrinde : "",
      brindes:!ac || lanc.length+nTr<=0 ? "" : (lanc.length>0 && lanc.every(function(b2){ return okp[b2.codigo]; })) ? "Conferido" : "Conferir",
      prox:!ac || prox.length===0 ? "" : rec.condNova ? "Condicional "+rec.condNova.numero : "Pendente"};
    estr.forEach(function(g){ g.contas.forEach(function(c2){ var v = somaConta(r, c2.k, c2.conta); o[c2.chave] = vc && v>0 ? v : ""; }); });
    fimCols.forEach(function(c2){ var v = somaConta(r, c2.k, null); o[c2.chave] = vc && v>0 ? v : ""; });
    return o; });

  // ───────── colunas, em 4 grupos: Agendamento · conferência | Vendas | Pagamentos | Peças e brindes ─────────
  var reais = function(k, t, mais){ return Object.assign({k:k, t:t, din:true, fmt:function(v){ return BK(v); }}, mais||{}); };
  var qtd = function(k, t){ return {k:k, t:t, qtd:true}; };
  var g1 = [
    {k:"conf", t:"Conferência", render:function(v, row){ return e(Relogio,{l:row.l, agenda:agenda, onClick:function(){ abre(row.l, false); }}); }},
    {k:"data", t:"Acerto", data:true, fmt:function(v, row){ return fmtData(v).slice(0,5)+(row && row.hora ? " "+row.hora : ""); }},
    {k:"recebido", t:"Recebido", data:true, fmt:function(v){ return fmtData(v).slice(0,5); }, render:function(v, row){ var rec = row.l.rec; if(!rec.fimTs) return "";
      return e("span",{className:"whitespace-nowrap"}, hmd(rec.fimTs)+" "+hm(rec.fimTs)+" · ", e("span",{title:"Tempo entre o atendimento e o recebimento", className:"font-semibold"+(diasDepois(row.l.r.data, rec.fimTs)>0 ? " text-white" : "")}, tempoEntre(row.l.r, rec.fimTs))); }},
    {k:"rep", t:"Representante"}, {k:"rev", t:"Revendedora", titulo:true}, {k:"status", t:"Status", cor:function(row){ return corStatus(row.status)+" font-semibold"; }},
    {k:"cond", t:"Condicional · assinatura", render:function(v, row){ if(v==="") return ""; var ce = condEstado(row.l); return e("span",{className:"font-semibold "+ce.cor}, ce.resumo); }},
    // Retorno: o agendamento já recebeu (OK) → quem bipa dá o OK aqui; sai da fila
    {k:"retorno", t:"Retorno · bipar", render:function(v, row){ var rec = row.l.rec; return e("span",{className:"font-semibold "+(rec.bip ? "text-success" : "text-white"), title:!rec.ok ? "Falta o OK de recebimento do agendamento" : ""}, !rec.ok ? "Aguarda recebimento" : rec.bip ? "✓ "+nome(rec.bip.por)+" · "+hm(rec.bip.ts) : "Falta bipar"); }},
    qtd("dif", "Diferenças")];   // quantas diferenças a bipadora registrou no card (26/11/2026)
  var g2 = [reais("garantia", "Desc. crédito"), reais("venda", "Vendas"), {k:"comissao", t:"Comissão", fmt:function(v){ return v+"%"; }}, reais("acerto", "Valor do acerto"),
    {k:"taxa", t:"Taxa", cor:function(row){ return row.taxa ? (row.l.tx.paga ? "text-success" : "text-destructive") : ""; }}, reais("excedente", "Brinde a mais"), reais("tags", "Tags"), reais("devido", "Total a pagar", {cor:function(){ return "font-semibold"; }}),
    reais("pago", "Valor pago", {cor:function(){ return "text-success font-semibold"; }}),
    {k:"multa", t:"Multa (app)", render:function(v, row){ return !row.multaPartes.length ? "" : e("span",{className:"inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold"}, row.multaPartes.map(function(m, i){ return e("span",{key:i, title:m.d, className:m.c}, m.t); })); }}];
  var g3 = [reais("falta", "Inadimplente", {cor:function(){ return "text-destructive font-semibold"; }}),
    {k:"din", t:"Dinheiro · confirmar", render:function(v, row){ if(v==="") return ""; return e("span",{className:"whitespace-nowrap"}, e("b",{className:"tabular-nums text-success"}, BK(row.l.dinTot)), " · ", e("span",{className:"font-semibold "+(v==="Recebido" ? "text-success" : v==="Divergente" ? "text-destructive" : "text-white")}, v)); }}];
  estr.forEach(function(g){ g.contas.forEach(function(c2, i){ g3.push(reais(c2.chave, c2.t, {sep:i===0, pg:true})); }); });
  fimCols.forEach(function(c2, i){ g3.push(reais(c2.chave, c2.t, {sep:i===0, pg:true})); });
  var g4 = (pecasAbertas ? [qtd("pecas", "Peças"), qtd("vendidas", "Vendidas"), qtd("trocas", "Trocas"), qtd("qNormal", "Brindes normal"), qtd("qBB", "Brindes BB"), {k:"proxQ", t:"Próximo mês"}, qtd("retornadas", "Retornadas"),
      reais("bNormal", "Brinde normal R$"), reais("bSelect", "Brinde BB R$"), reais("rNormal", "Retirado normal"), reais("rSelect", "Retirado select"), reais("exced2", "Excedente")] : []).concat([
    // Brindes e trocas: abre a janela com os brindes, as trocas e as peças do próximo mês
    {k:"brindes", t:"Brindes · trocas", cor:function(row){ return row.brindes==="Conferido" ? "text-success font-semibold" : "text-white font-semibold"; }},
    // Peças do próximo mês: quem bipa o retorno gera a condicional nova e coloca o número (sem número fica pendente)
    {k:"prox", t:"Condicional nova", cor:function(row){ return row.prox==="Pendente" ? "text-white font-semibold" : "text-success font-semibold"; }}]);
  [g2, g3, g4].forEach(function(g){ g[0] = Object.assign({}, g[0], {sep:true}); });
  // Resumo (padrão, Marcus 26/11/2026): tabela curta, o detalhe está dentro do card. Completo: todas as colunas de antes (vendas, pagamentos, peças), para o financeiro.
  var completo = colunasModo==="completo";
  var cols = (completo ? g1.concat(g2, g3, g4) : g1.filter(function(c2){ return c2.k!=="cond"; })).filter(function(c2){ return podeBip || c2.k!=="dif"; });   // agendamento não vê Diferenças (só quem bipa)
  var cabAcima = [[{t:"Agendamento · conferência", span:g1.length}, {t:"Vendas", span:g2.length, sep:true}, {t:"Pagamentos", span:g3.length, sep:true}, {t:"Peças e brindes", span:g4.length, sep:true}]];
  if(estr.length) cabAcima.push([{t:"", span:g1.length+g2.length+2}].concat(estr.map(function(x){ return {t:x.g.nome, span:x.contas.length, sep:true}; }), [{t:"", span:fimCols.length+g4.length, sep:true}]));
  if(!completo) cabAcima = undefined;
  // última linha: total do que está na tabela (já com os filtros das colunas). Quantidades para todos; valores só para quem vê os totais.
  var rodape = function(ls){ return cols.map(function(c2, j){
    if(j===0) return "Total";
    if(c2.k==="rev") return ls.length+(ls.length===1 ? " atendimento" : " atendimentos");
    if(c2.qtd) return somaK(ls, c2.k) || "";
    if(!ver) return "";
    var t = c2.k==="din" ? r2(ls.reduce(function(t2, x){ return t2+x.l.dinTot; }, 0)) : c2.k==="taxa" ? r2(ls.reduce(function(t2, x){ return t2+(x.l.tx.taxa||0); }, 0)) : c2.din ? somaK(ls, c2.k) : null;
    return t===null ? "" : (t>0 || SEMPRE[c2.k]) ? BK(t) : ""; }); };

  // ───────── visão Por representante: uma linha por representante com o resultado do mês (o que antes ficava em cartões no topo) ─────────
  var METRICAS = [
    {k:"at", t:"Atendimentos", f:function(){ return 1; }},
    {k:"kit", t:"Acerto + kit", f:function(l){ return l.status.indexOf("Acerto + kit")===0 ? 1 : 0; }},
    {k:"saiu", t:"Acerto + saiu", f:function(l){ return l.status==="Acerto + saiu" ? 1 : 0; }},
    {k:"kn", t:"Kit novo", f:function(l){ return l.status.indexOf("Kit novo")===0 ? 1 : 0; }},
    {k:"conf", t:"Para conferir", f:function(l){ return l.rec.ok ? 0 : 1; }},
    {k:"tx", t:"Taxas não pagas", f:function(l){ return l.tx.taxa>0 && !l.tx.paga ? 1 : 0; }}].concat(!ver ? [] : [
    {k:"vd", t:"Vendas", din:true, f:function(l){ return l.ac ? (l.r.vendaLiquida||0) : 0; }},
    {k:"dv", t:"Total a pagar", din:true, f:function(l){ return l.ac ? l.devido : 0; }},
    {k:"pg", t:"Valor pago", din:true, f:function(l){ return l.ac ? l.pago : 0; }},
    {k:"in", t:"Inadimplente", din:true, f:function(l){ return l.falta||0; }}]);
  var porRep = {}; linhas.forEach(function(l){ var k = nome(l.r.rep) || "—", o = porRep[k] || (porRep[k] = {id:k, rep:k}); METRICAS.forEach(function(m){ o[m.k] = r2((o[m.k]||0)+m.f(l)); }); });
  var linhasRep = Object.keys(porRep).map(function(k){ return porRep[k]; }).sort(function(a, b){ return b.at-a.at || a.rep.localeCompare(b.rep); });
  var colsRep = [{k:"rep", t:"Representante", titulo:true}].concat(METRICAS.map(function(m){ return m.din ? reais(m.k, m.t) : {k:m.k, t:m.t}; }));
  var rodapeRep = function(ls){ return colsRep.map(function(c2, j){ return j===0 ? "Total" : c2.din ? BK(somaK(ls, c2.k)) : somaK(ls, c2.k); }); };

  // ───────── kits novos entregues: o termo assinado vem do app; sem ele, o agendamento marca aqui quando conferir o papel ─────────
  var linhasKn = kn.map(function(k){ return {id:k.id, k:k, data:k.data||"", rep:nome(k.rep), rev:nome(k.rev), status:k.status, termo:k.termoAuto ? "Assinado no app" : k.termoManual ? "Conferido por "+nomeDe(k.termoManual.por) : "Falta o termo"}; });
  var colsKn = [{k:"data", t:"Data", data:true, fmt:function(v){ return fmtData(v); }}, {k:"rep", t:"Representante"}, {k:"rev", t:"Revendedora", titulo:true}, {k:"status", t:"Status", cor:function(row){ return corStatus(row.status)+" font-semibold"; }},
    {k:"termo", t:"Termo assinado", render:function(v, row){ var k = row.k; if(k.termoAuto) return e("span",{className:"font-semibold text-success"}, v);
      return e("label",{className:"inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap"}, e("input",{type:"checkbox", checked:!!k.termoManual, disabled:!agenda, className:"size-4 accent-[#E8B84B]",
        onChange:function(ev){ d({type:"COMIS_TERMO", id:k.r.id, ok:ev.target.checked, por:s.usuario}); }}), k.termoManual ? v : "Marcar termo assinado"); }}];
  var semTermo = kn.filter(function(k){ return !k.termoOk; }).length;

  // ───────── erros de bipagem achados pela representante na conferência das peças (quem bipou o kit recebe o erro) ─────────
  var erros = (s.errosBipagem || []).filter(daRep), veDesconto = papelDe(s.usuario)==="supervisao", perda = (s.cfg||{}).perdaFalta || 0, totalErros = erros.reduce(function(t, x){ return t+x.erros; }, 0);
  var linhasErro = erros.map(function(x){ var h = new Date(x.em);
    return {id:x.id, data:x.data||"", hora:String(h.getHours()).padStart(2,"0")+":"+String(h.getMinutes()).padStart(2,"0"), rev:nome(x.rev), rep:nome(x.rep)||"—", bipadora:nome(x.bipadora), erros:x.erros, desconto:x.erros*perda,
      faltou:(x.faltas||[]).map(function(f){ return f.codigo+(f.qtd>1 ? " ×"+f.qtd : "")+" "+String(f.desc||"").toLowerCase(); }).join(" · "), sobras:(x.sobras||[]).map(function(y){ return y.codigo; }).join(", "),
      conds:(x.condicionais||[]).join(", "), conferidas:x.lidas+" de "+x.esperadas, montadora:nome(x.montadora)}; });
  var colsErro = [{k:"data", t:"Data", data:true, fmt:function(v, row){ return fmtData(v).slice(0,5)+(row && row.hora ? " "+row.hora : ""); }}, {k:"rev", t:"Revendedora", titulo:true}, {k:"rep", t:"Representante"}, {k:"bipadora", t:"Quem bipou"},
    {k:"erros", t:"Peças com erro", cor:function(){ return "text-destructive font-semibold"; }}].concat(veDesconto ? [reais("desconto", "Desconto", {cor:function(){ return "text-destructive"; }})] : [],
    [{k:"faltou", t:"Faltou"}, {k:"sobras", t:"Peça que não é do kit"}, {k:"conds", t:"Condicionais"}, {k:"conferidas", t:"Peças conferidas"}, {k:"montadora", t:"Montado por"}]);

  var fila = qtdFila(s), lp = popId ? linhas.find(function(x){ return x.r.id===popId; }) : null;
  var tabelaLista = e(TabelaPlanilha,{key:"l"+mes+repIni, fina:true, cols:cols, cabAcima:cabAcima, linhas:linhasTab, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, tracoVazio:"---", limite:300, aoClicar:function(row){ abre(row.l, false); }, alturaMax:"calc(100vh - 6.6rem)",
    onFiltradas:function(ls){ filtradas.current = ls; setRevUnica(ls.length>0 && ls.length<linhasTab.length && ls.every(function(x){ return x.rev===ls[0].rev; }) ? ls[0].rev : ""); }, totalRodape:rodape, vazio:"Nada em "+nomeMes(mes)+". O que a representante preencher no app aparece aqui."});
  var tabelaRep = e(TabelaPlanilha,{key:"r"+mes, tracoVazio:"---", fina:true, cols:colsRep, linhas:linhasRep, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, alturaMax:"calc(100vh - 6.6rem)",
    aoClicar:function(row){ setRepIni(row.rep); setRevUnica(""); setVista("lista"); }, totalRodape:rodapeRep, vazio:"Nada em "+nomeMes(mes)+"."});

  // sem representante escolhida: a funcionária vê as representantes com acerto aguardando a empresa (clicar escolhe) e, embaixo, o passo a passo do que confirmar (Marcus, 25/11/2026)
  var tracoOk = "---";   // célula sem nada aparece com --- (Marcus, 25/11/2026)
  var tabelaPend = e(TabelaPlanilha,{key:"pend", fina:true, cols:[{k:"rep", t:"Representante", titulo:true}, {k:"qtd", t:"Acertos aguardando a empresa", qtd:true}, {k:"desde", t:"Mais antigo", data:true, fmt:function(v){ return fmtData(v); }}], linhas:linhasPend, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true,
    aoClicar:function(row){ setMostra("pend"); setRepIni(row.rep); }, vazio:"Nenhum acerto aguardando a empresa.", tracoVazio:tracoOk});
  var tabelaPassos = e(TabelaPlanilha,{key:"passos", fina:true, cols:[{k:"n", t:"Passo"}, {k:"t", t:"O que confirmar"}, {k:"d", t:"Como"}], linhas:PASSOS.map(function(x, i){ return {n:i+1, t:x[0], d:x[1]}; }), chave:"n", grade:true, semFiltro:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, vazio:"", tracoVazio:tracoOk});
  var textoSel = "Selecione a representante";
  var primeiro = function(n){ return String(n||"").trim().split(/\s+/)[0] || ""; };   // só um nome: "Jessica Castro" vira "Jessica" (pedido do Marcus 25/11/2026)
  var semAc = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim(); };
  var cadReps = ((s.agend && s.agend.config && s.agend.config.representantes) || []).filter(function(r){ return r && r.codigo && r.ativo!==false; });
  var cadDe = function(n){ var nn = semAc(n); if(!nn) return []; var achou = cadReps.filter(function(r){ return [r.nome].concat(r.apelidos||[]).map(semAc).some(function(x){ return x && (x===nn || x.indexOf(nn+" ")===0 || nn.indexOf(x+" ")===0); }); }); var exato = achou.filter(function(r){ return semAc(r.nome)===nn; }); return exato.length ? exato : achou; };   // cadastro do Agendamento (o código gravado no acerto às vezes traz o nome)
  var codDe = function(n){ return cadDe(n).map(function(r){ return String(r.codigo); }).filter(function(x, i, a){ return a.indexOf(x)===i; }).join(" / "); };   // um ou mais códigos
  var doisNomes = function(n){ var c1 = cadDe(n)[0], base = c1 && semAc(c1.nome).indexOf(semAc(n))===0 ? c1.nome : n; return String(base||"").trim().split(/\s+/).slice(0,2).map(function(w){ return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); }).join(" "); };   // primeiro e segundo nome
  var rotuloBotao = repIni===TODAS ? "Todas as representantes" : repIni ? (codDe(repIni) ? codDe(repIni)+" · " : "")+doisNomes(repIni) : textoSel;
  var listaSel = repsOps.map(function(p){ return p[0]; }).filter(function(o){ var q = semAc(dig); return !q || semAc(doisNomes(o)).indexOf(q)>=0 || semAc(o).indexOf(q)>=0 || semAc(codDe(o))===q || semAc(codDe(o)).indexOf(q)===0; });
  var escolheRep = function(v){ setRepIni(v); setRevUnica(""); filtradas.current = null; setSelAberto(false); };
  var rectSel = selAberto && selRef.current ? selRef.current.getBoundingClientRect() : null;   // lista solta da tela (fixed): não é cortada pelo bloco e rola por dentro (Marcus, 26/11/2026)
  var seletorRep = vista==="lista" && e("div",{ref:selRef, className:"relative flex min-w-[180px]"},
    e("button",{type:"button", "aria-haspopup":"listbox", "aria-expanded":selAberto, "aria-label":textoSel, title:textoSel, onClick:function(){ setSelAberto(!selAberto); },
      className:"flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap bg-[#FACC15] px-3 text-[10px] font-extrabold text-[#111111] outline-none focus-visible:ring-2 focus-visible:ring-white"},   // padrao-ok: botão amarelo, pedido do Marcus 25/11/2026
      e("span",{className:"whitespace-nowrap"}, rotuloBotao),
      e("span",{"aria-hidden":"true", className:"text-[10px] leading-none"}, selAberto ? "▲" : "▼")),
    selAberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setSelAberto(false); }}),
    selAberto && e("div",{role:"listbox", style:rectSel ? {position:"fixed", left:rectSel.left, top:rectSel.bottom, width:Math.max(rectSel.width, 220), maxHeight:Math.max(160, window.innerHeight-rectSel.bottom-12)} : undefined, className:"z-50 overflow-y-auto overscroll-contain border border-white bg-[var(--bloco-titulo)] shadow-lg"},
      e("input",{type:"text", autoFocus:true, value:dig, placeholder:"Digite e aperte Enter", "aria-label":"Digitar a representante",
        onChange:function(ev){ setDig(ev.target.value); },
        onKeyDown:function(ev){ if(ev.key==="Escape"){ setSelAberto(false); } if(ev.key!=="Enter") return; ev.preventDefault(); if(!dig.trim()){ escolheRep(TODAS); setDig(""); return; } if(listaSel[0]){ escolheRep(listaSel[0]); setDig(""); } },
        className:"h-[26px] w-full border-b border-white bg-white/10 px-3 text-[12px] text-white outline-none placeholder:text-white/60"}),   // padrao-ok: campo de digitar a representante, pedido do Marcus 25/11/2026
      e("button",{key:TODAS, type:"button", role:"option", "aria-selected":repIni===TODAS, onClick:function(){ escolheRep(TODAS); setDig(""); },
        className:"w-full whitespace-nowrap border-b border-white/40 px-3 py-1.5 text-center text-[12px] font-bold text-white hover:bg-white/15"+(repIni===TODAS ? " bg-white/25" : "")}, "Todas as representantes"),   // padrao-ok: botão Todas, mesma lista de 12 px (Marcus 26/11/2026)
      listaSel.map(function(o){ var ativo = o===repIni; var cods = codDe(o); return e("button",{key:o, type:"button", role:"option", "aria-selected":ativo, onClick:function(){ escolheRep(o); setDig(""); },
        className:"grid w-full grid-cols-[minmax(3.5rem,auto)_1fr] items-center gap-2 whitespace-nowrap border-b border-white/40 px-3 py-1.5 text-[12px] text-white hover:bg-white/15"+(ativo ? " bg-white/25 font-bold" : "")},   // padrao-ok: lista da representante em 12 px, com linha entre as linhas (pedido do Marcus 25/11/2026)
        e("span",{className:"text-left font-bold tabular-nums"}, cods||"—"), e("span",{className:"text-left"}, doisNomes(o))); })));   // padrao-ok: lista da representante em 12 px, para ler melhor (pedido do Marcus 25/11/2026)

  return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case"},
    e(BlocoPainel,{titulo:"Consolidado dos representantes", compacto:true},
      e("div",{className:"flex items-stretch gap-0 bg-[var(--bloco-titulo)] pt-1.5"}, seletorRep, e("div",{className:"min-w-0 flex-1 [&>div]:!justify-start [&_input]:!h-[26px] [&_input]:!text-[12px]"}, e(BarraMini,null,   // padrao-ok: campo Buscar maior e botão de 20 px, pedido do Marcus (25/11/2026)
        vista==="lista" && e(BuscaMini,{valor:busca, aoMudar:function(t){ setBusca(t); setRevUnica(""); filtradas.current = null; }, rotulo:"Buscar revendedora", ph:"Buscar revendedora", larg:"w-64"}),
        vista==="lista" && e(CampoMini,{valor:mostra, aoMudar:function(k){ setMostra(k); filtradas.current = null; }, rotulo:"Mostrar", ops:[["pend", "Aguardando a empresa"], ["todos", "Todos do mês"]]}),
        !(vista==="lista" && mostra==="pend") && e(CampoMini,{valor:mes, aoMudar:function(m){ setMes(m); setRevUnica(""); filtradas.current = null; }, rotulo:"Mês", ops:meses.map(function(m){ return [m, nomeMes(m)]; })}),
        e(CampoMini,{valor:vista, aoMudar:function(k){ setVista(k); setRepIni(""); setBusca(""); setRevUnica(""); }, rotulo:"Visão", ops:[["lista", "Atendimentos"], ["rep", "Por representante"]]}),
        vista==="lista" && !semRep && e(CampoMini,{valor:colunasModo, aoMudar:setColunasModo, rotulo:"Colunas da tabela", ops:[["resumo", "Colunas: resumo"], ["completo", "Colunas: completo"]]}),
        vista==="lista" && !semRep && completo && e(CampoMini,{valor:pagModo, aoMudar:setPagModo, rotulo:"Colunas das contas de pagamento", ops:[["todas", "Contas: todas"], ["usadas", "Contas: com valor"], ["fechado", "Contas: fechado"]]}),
        vista==="lista" && !semRep && completo && e(CampoMini,{valor:pecasModo, aoMudar:setPecasModo, rotulo:"Colunas de peças e brindes", ops:[["aberto", "Peças: abertas"], ["fechado", "Peças: fechadas"]]}),
        e("b",{title:"Kits que o agendamento já recebeu e ainda faltam bipar", className:"whitespace-nowrap px-1 text-[11px] tabular-nums", style:fila>0 ? {color:corDaFila(fila)} : undefined}, "Fila: "+fila+(fila===1 ? " kit" : " kits")),
        e("button",{type:"button", onClick:function(){ setPassosAberto(true); }}, "Passo a passo"),
        ver && vista==="lista" && !semRep && e("button",{type:"button", disabled:!linhas.length, onClick:exportar, className:"disabled:opacity-50"}, "Exportar CSV")))),
      e("div",{className:CLS_FINA_ESPACO+(vista==="lista" && !semRep && !completo ? " [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]" : ""), style:vista==="lista" && !semRep && !completo ? {"--lh":"26px"} : undefined},   // padrao-ok: resumo com linha mais alta e letra 11 px, variante da Home da família (Marcus 26/11/2026)
        vista==="rep" ? tabelaRep : semRep ? tabelaPend : tabelaLista)),
    semRep && vista==="lista" && e(BlocoPainel,{titulo:"O que confirmar, passo a passo", compacto:true},
      e("div",{className:CLS_FINA_ESPACO}, tabelaPassos)),
    (vista==="rep" || !!repIni) && kn.length>0 && e(BlocoPainel,{titulo:"Kits novos · termo assinado · "+kn.length, compacto:true, aoTitulo:function(){ setKnAberto(!knAberto); }, fechado:!knAberto, dir:semTermo>0 ? e("span",{className:"text-[11px] text-white"}, semTermo+" sem termo") : null},
      e("div",{className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{fina:true, cols:colsKn, linhas:linhasKn, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, tracoVazio:"---", vazio:"Nenhum kit novo neste mês."}))),
    (vista==="rep" || !!repIni) && erros.length>0 && e(BlocoPainel,{titulo:"Erros de bipagem · conferência da representante", compacto:true, dir:e("span",{className:"text-[11px]"}, totalErros+(totalErros===1 ? " peça com erro" : " peças com erro"))},
      e("div",{className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{fina:true, cols:colsErro, linhas:linhasErro, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, tracoVazio:"---"}))),
    passosAberto && e(PassoAPasso,{fechar:function(){ setPassosAberto(false); }}),
    // janela por cima de tudo: brindes, trocas e peças do próximo mês do atendimento escolhido
    lp && e(FichaConferencia,{key:lp.r.id, l:lp, agenda:agenda, vc:vc, usuario:s.usuario, podeBip:podeBip, podeProx:podeBipRetorno(s.usuario), todos:todos, receber:receber, fechar:function(){ setPopId(null); },
      onRelogio:function(){ relogio(lp); }, onSet:function(patch){ receber(lp.r.id, patch); },
      onDin:function(contado){ receber(lp.r.id, {din:{ok:true, contado:contado, ts:agora(), por:s.usuario}}); }, onDinDesfaz:function(){ receber(lp.r.id, {din:{ok:false}}); },
      kits:s.kits||[], usuarioNome:usuarioNome, onDif:function(item){ d({type:"RETORNO_DIF", id:lp.r.id, item:item}); }, onDifTira:function(id){ d({type:"RETORNO_DIF", id:lp.r.id, remover:id}); },
      onBipar:function(){ if(lp.rec.bip) d({type:"RETORNO_BIPAR", id:lp.r.id, desfazer:true}); else d({type:"RETORNO_BIPAR", id:lp.r.id, por:nomeDe(s.usuario), porId:s.usuario}); }}));
}

export { AbaConsolidadoRep };
