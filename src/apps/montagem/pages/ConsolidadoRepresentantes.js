// Sorelly Admin — pages/ConsolidadoRepresentantes.js
// Representantes & Kits › Consolidado: CONTROLE do que entrou. Tudo que a representante preenche no app (acerto, kit novo, reposição)
// aparece aqui sozinho e fica pendente até trazer na empresa: o agendamento confere e dá o OK. A comissão e as contas (Point, link…) ficam só em Comissões.
// O agendamento vê quantidades e o que precisa conferir, nunca os totais de valores (veTotais em domain/equipe.js).
// VISUAL REFEITO em 23/11/2026 (Marcus: "nas novas regras", igual a Contas a pagar): um bloco azul (BlocoPainel), barra em forma de tabela com menus suspensos
// e UMA TabelaPlanilha com filtro e ordem no nome de cada coluna. Sem blocos de números no topo: o total fica na última linha da tabela.
// As contas (linha, relogio, receber) e as ações (CONSREP_RECEBER, RETORNO_BIPAR, COMIS_TERMO) são as mesmas de antes.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BarraMini, BarraTabela, CelulaBarra, BuscaMini, CLS_FINA_ESPACO, CampoMini, PAGINA_CHEIA } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { analisar, comisEfetiva, itensComissao, pagoDe, prazoPendente, statusDe, taxaDe } from "@/apps/montagem/domain/comissoes";
import { conferirBrindes } from "@/apps/montagem/domain/consignado";
import { GRUPOS_CONTA, grupoDaConta } from "@/apps/montagem/domain/contas-grupos";
import { AGENDAMENTO, BIPADORAS, BIPA_RETORNO_PADRAO, FINANCEIRO, SUPERVISORA, nomeDe, papelDe, podeAgendar, podeBipRetorno, veTotais } from "@/apps/montagem/domain/equipe";
import { corDaFila, podeBiparRetorno, qtdFila } from "@/apps/montagem/domain/retornos";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { buscarAnexo } from "@/apps/montagem/lib/anexo";
import { pedeConta, pedidoDe } from "@/apps/montagem/domain/pagamento-rep";
import { dadosDaConta } from "@/apps/montagem/lib/chave-da-parte";
import { nomePropio } from "@/apps/montagem/lib/nome-conta";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MoneyInput } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";

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

// Etapa atual do atendimento, só com registros reais (Marcus, 27/11/2026): conferência (recebimento), bipagem (retorno) e faturamento (conciliação). "Com a representante" e "Em bipagem" ainda não têm registro próprio.
function etapaDe(l){
  var rec = l.rec, fat = (l.r.fin && l.r.fin.k) || (l.an && l.an.linhas && l.an.linhas.some(function(x){ return x.fin; }));
  if(fat) return {txt:"Faturado", cor:"text-success", dica:"Faturado: conciliação lançada. Clique para abrir a ficha."};
  if(rec.bip) return {txt:"Aguardando faturamento", cor:"text-success", dica:"Bipado por "+nome(rec.bip.por)+". Clique para abrir a ficha."};
  if(rec.ok) return {txt:"Aguardando bipagem", cor:"text-info", dica:"Conferido: falta bipar. Clique para abrir a ficha."};
  if(rec.inicioTs) return {txt:"Em conferência", cor:"text-info", dica:"Conferência em andamento desde "+hm(rec.inicioTs)+". Clique para abrir a ficha."};
  return {txt:"Aguardando conferência", cor:"text-warning", dica:"Falta a conferência da empresa. Clique para abrir a ficha."};
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
// MENU DE ESCOLHA da ficha (Marcus, 26/11/2026): no lugar do select nativo. Lista à esquerda, grupos separados por linha, seta azul, altura máxima com rolagem e posição calculada para nunca passar da tela.
// opcoes: [valor, texto] ou ["#", título do grupo]
function MenuSel(p){
  var st = useState(null), pos = st[0], setPos = st[1], ref = useRef(null);
  useEffect(function(){
    if(!pos) return undefined;
    var fecha = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setPos(null); };
    var fecha2 = function(){ setPos(null); };
    document.addEventListener("mousedown", fecha); window.addEventListener("resize", fecha2); window.addEventListener("scroll", fecha2, true);
    return function(){ document.removeEventListener("mousedown", fecha); window.removeEventListener("resize", fecha2); window.removeEventListener("scroll", fecha2, true); };
  }, [pos]);
  var abre = function(ev){ if(pos){ setPos(null); return; }
    var b = ev.currentTarget.getBoundingClientRect(), abaixo = window.innerHeight-b.bottom-8, acima = b.top-8, sobe = abaixo<160 && acima>abaixo, alt = Math.max(96, Math.min(260, sobe ? acima : abaixo));
    setPos({left:b.left, width:Math.max(b.width, 176), maxH:alt, top:sobe ? null : b.bottom+2, bottom:sobe ? window.innerHeight-b.top+2 : null}); };
  var atual = p.opcoes.filter(function(o){ return o[0]!=="#" && o[0]===p.value; })[0];
  return e("div",{ref:ref, className:"relative flex w-full min-w-0"},
    e("button",{type:"button", "aria-label":p.label, "aria-expanded":!!pos, onClick:abre, className:p.className+" flex items-center justify-between gap-1 text-left"}, e("span",{className:"whitespace-nowrap"}, atual ? atual[1] : p.vazio || ""), e("span",{"aria-hidden":"true", className:"shrink-0 text-[10px] leading-none text-info"}, "▼")),
    pos && e("div",{role:"listbox", style:{position:"fixed", left:pos.left, width:pos.width, maxHeight:pos.maxH, top:pos.top==null ? undefined : pos.top, bottom:pos.bottom==null ? undefined : pos.bottom}, className:"z-[200] overflow-y-auto rounded border border-white/40 bg-[#1f3358] text-left text-[11px] shadow-lg"},
      p.opcoes.map(function(o, i){
        if(o[0]==="#") return e("div",{key:"g"+i, className:"border-y border-white/30 bg-white/10 px-2 py-0.5 text-left text-[10px] font-bold first:border-t-0"}, o[1]);
        return e("button",{key:o[0]+i, type:"button", role:"option", "aria-selected":o[0]===p.value, onClick:function(){ p.onChange(o[0]); setPos(null); }, className:"block min-h-5 w-full border-b border-white/10 px-2 py-0.5 text-left hover:bg-white/20"+(o[0]===p.value ? " font-bold text-info" : "")}, o[1]); })));
}

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
  var campo = function(t, ctl){ return e("div",{className:PAR}, e("span",{className:PAR_ROT}, t), e("div",{className:"flex items-center px-2"}, ctl)); };
  var CAMPO_E = CAMPO.replace("text-center","text-left")+" appearance-none pl-2 pr-5";   // lista à esquerda; a seta é a nossa, em azul
  return e(Bloco,{t:"Diferenças"},
    e(Par,{t:"Registradas", v:lista.length ? String(lista.length) : "Nenhuma", cor:lista.length ? "text-destructive" : ""}),
    e(Par,{t:"Bipou na saída", v:bipou}),
    lista.map(function(x){ var cor = x.dir==="mais" ? "text-success" : x.dir==="menos" ? "text-destructive" : "";
      return e("div",{key:x.id, title:(x.obs ? x.obs+" · " : "")+"Registrado por "+(x.por || "—")+" em "+new Date(x.em).toLocaleString("pt-BR"), className:"grid min-h-6 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_1.5rem] items-center gap-2 break-words border-b border-white/30 px-2 text-center text-[11px]"},
        e("span",{className:"font-semibold"}, x.tipo+(x.cod ? " · "+x.cod : "")),
        e("span",{className:"tabular-nums"}, e("b",{className:cor}, x.valor>0 ? (x.dir==="menos" ? "−" : "+")+BK(x.valor)+" · " : ""), x.origem+(x.obs ? " · "+x.obs : "")),
        p.podeBip ? e("button",{type:"button", onClick:function(){ p.onDifTira(x.id); }, "aria-label":"Tirar a diferença "+x.tipo, title:"Tirar", className:"mx-auto grid size-5 place-items-center rounded hover:bg-white/20"}, "×") : e("span",null)); }),
    p.podeBip && campo("Tipo", e(MenuSel,{value:f.tipo, label:"Tipo da diferença", vazio:"Escolha o tipo", className:CAMPO_E, onChange:function(v){ set("tipo", v); }, opcoes:[["", "Escolha o tipo"]].concat(TIPOS_DIF.reduce(function(o, g){ return o.concat([["#", g[0]]], g[2].map(function(t){ return [t, t]; })); }, []))})),
    p.podeBip && e("div",{className:"flex items-center border-b border-white/30 px-2 py-1"}, e("textarea",{value:f.obs, rows:2, placeholder:"Observação", "aria-label":"Observação", className:CAMPO_E.replace("h-[22px]","min-h-9 !h-auto resize-none py-1")+" w-full", onChange:function(ev){ set("obs", ev.target.value); }})),
    p.podeBip && f.tipo && campo("Código da peça", e("input",{value:f.cod, placeholder:"Ex.: CL2419", "aria-label":"Código da peça", className:CAMPO, onChange:function(ev){ set("cod", ev.target.value); }})),
    p.podeBip && f.tipo && campo("Valor", e("div",{className:"grid w-full grid-cols-[6rem_1fr] gap-1"},
      e(MenuSel,{value:f.dir || DIRS_DIF[0][0], label:"Direção do valor", className:CAMPO_E, onChange:function(v){ set("dir", v); }, opcoes:DIRS_DIF}),
      e(MoneyInput,{value:f.valor, label:"Valor da diferença", className:"w-full h-[22px]! px-1! text-center! text-[11px]! bg-white/10! border-white/40!", onChange:function(v){ set("valor", v); }}))),
    p.podeBip && f.tipo && campo("Origem", e(MenuSel,{value:origem, label:"Origem da diferença", className:CAMPO_E, onChange:function(v){ set("origem", v); }, opcoes:ORIGENS_DIF.map(function(o){ return [o, o]; })})),
    p.podeBip && f.tipo && e("div",{className:LIN}, e(Botao,{principal:true, onClick:registra}, "Registrar diferença")),
    !p.podeBip && lista.length===0 && e("div",{className:MSG}, "Nenhuma diferença registrada."));
}

// FICHA DA REVENDEDORA (Marcus, 23/11/2026): o card onde se confere o acerto; as meninas da conferência usam este mesmo card. Três colunas, blocos ligados numa borda azul só:
// 1) atendimento e conferência | 2) condicionais, dinheiro, pagamentos e retorno | 3) peças, com os brindes normal e BB lado a lado (podem ser muitos), trocas e próximo mês.
var corTxt = function(c){ return function(){ return c; }; };
// ESTILO DA FICHA (Marcus, 26/11/2026: "precisão milimétrica no alinhamento das tabelas"). UM LUGAR SÓ para mexer no visual da ficha.
// Regras: (1) toda linha tem a mesma altura (min-h-6, que a FICHA_FINA transforma em 20 px) e uma borda de baixo de 1 px; (2) NADA quebra de linha dentro da célula;
// (3) a barra azul do título não tem borda de cima: a borda de baixo da linha anterior já é a linha, e assim as linhas horizontais caem na mesma altura nas colunas vizinhas;
// (4) botão e campo ficam em células sem folga vertical, para a linha não passar de 20 px.
var LINHA = "min-h-6 border-b border-white/30 text-center text-[11px]";                                     // altura e borda de toda linha
var CEL = "flex items-center justify-center whitespace-nowrap px-2";                                         // célula: uma linha só, centralizada
var CAB = "bg-[#1f3358] font-bold";                                                                          // cabeçalho de tabela
var PAR = "grid grid-cols-[minmax(min-content,1fr)_var(--vcol,60%)] items-stretch "+LINHA;                    // linha nome | valor (a 2ª coluna é --vcol; sem ela, 60%)
var PAR_ROT = CEL+" border-r border-white/30";                                                               // célula do nome (linha vertical à direita)
var PAR_VAL = CEL;                                                                                           // célula do valor
var LIN = "flex items-center justify-center gap-2 px-2 "+LINHA;                                              // linha inteira com um texto ou um botão
var MSG = "flex items-center justify-center px-2 py-px "+LINHA;                                              // mensagem de uma linha (texto livre pode quebrar)
var SUB = "flex items-center justify-center bg-[#19263d] font-bold "+LINHA;                                  // sub-barra dentro de um bloco
// Coluna 1: as três últimas colunas do pagamento (DevMaster, Valor, Comprovante) e a coluna do valor das linhas Par têm a MESMA largura (22 rem; o nome da DevMaster mais comprido, "Pix - Santander - Anamaria", pede 9,5 rem): a linha vertical do meio é uma só, do topo ao fim.
var VCOL = "[--c-dm:9.5rem] [--c-vl:6rem] [--c-cp:7.5rem] [--vcol:23rem]";
var COLS_PAG = "minmax(min-content,1fr) var(--c-dm) var(--c-vl) var(--c-cp)";
var COLS_BRINDE = "4rem minmax(4.4rem,1fr) 3.4rem 5.4rem";   // Conferência | Código da peça | Origem | Valor. CAUSA das linhas quebradas: cabeçalho, corpo, área vazia e rodapé são grades separadas e "minmax(min-content,1fr)" dava larguras diferentes em cada uma; agora só medidas que não dependem do conteúdo, então as 4 grades têm as mesmas colunas (e o rodapé "Sem diferença" cabe)
var COLS_COND = "minmax(min-content,1fr) 6rem 11rem";                                                       // Número | Qtd. de peças | Conferência (condicionais)
var COLS_CONF = "4.75rem minmax(min-content,1fr)";                                                           // Conferência | Código da peça (peças do próximo mês)
// abre o comprovante do pagamento (data URL ou chave de anexo) em outra aba
// mostra o comprovante NA TELA (imagem ou PDF), sem baixar nem abrir outra aba (Marcus, 27/11/2026)
function mostraComp(url, mime){
  var fundo = document.createElement("div"); fundo.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;padding:16px";
  var pdf = /pdf/i.test(mime||"") || url.indexOf("data:application/pdf")===0;
  var el = document.createElement(pdf ? "iframe" : "img"); el.src = url; el.style.cssText = pdf ? "width:min(900px,96vw);height:92vh;background:#fff;border:0" : "max-width:96vw;max-height:92vh;object-fit:contain;background:#fff";
  var fecha = function(){ fundo.remove(); document.removeEventListener("keydown", tecla); };
  var tecla = function(ev){ if(ev.key==="Escape") fecha(); };
  fundo.onclick = function(ev){ if(ev.target===fundo) fecha(); }; document.addEventListener("keydown", tecla);
  var x = document.createElement("button"); x.textContent = "Fechar"; x.style.cssText = "position:absolute;top:12px;right:16px;padding:4px 12px;border-radius:5px;background:#FACC15;color:#111;font-weight:700;font-size:13px"; x.onclick = fecha;
  fundo.appendChild(el); fundo.appendChild(x); document.body.appendChild(fundo);
}
function abreComp(u){ var c = typeof u==="string" && u.indexOf("an_")===0 ? buscarAnexo(u).then(function(r){ mostraComp(r.url, r.mime); }) : fetch(u).then(function(b){ return b.blob(); }).then(function(blob){ mostraComp(URL.createObjectURL(blob), blob.type); }); return c.catch(function(){}); }
// tabela da ficha: cabeçalho + linhas; as colunas vêm em "cols" (modelo CSS) e todas as células seguem o mesmo padrão (altura, borda, uma linha só). A última coluna não tem linha vertical.
function GradeFicha(p){
  var n = p.cab.length, k = 0;
  var cel = function(c, j, cab){ return e("div",{key:k++, className:(p.junto ? CEL.replace("px-2", "px-1") : CEL)+" min-h-6 border-b border-white/30 text-center text-[11px]"+(j<n-1 ? " border-r" : "")+(cab ? " "+CAB : "")}, c); };
  return e("div",{className:"grid", style:{gridTemplateColumns:p.cols}},
    p.cab.map(function(h, j){ return cel(h, j, true); }),
    p.linhas.map(function(ln){ return ln.map(function(c, j){ return cel(c, j, false); }); }));
}
function Par(p){ var g = p.grande ? " [&&]:!text-[12px]" : ""; return e("div",{className:PAR+g}, e("span",{className:PAR_ROT}, p.t), e("b",{className:"tabular-nums "+PAR_VAL+(p.grande ? " whitespace-nowrap" : "")+" "+(p.cor||"")}, p.v)); }   // padrao-ok: grande = nomes em 14 px (Marcus 26/11/2026); nome de pessoa nunca quebra a linha
function FichaConferencia(p){
  var l = p.l, r = l.r, rec = l.rec, nums = numsCond(l), ce = condEstado(l), agenda = p.agenda, vc = p.vc;
  var vs = useState(""), v = vs[0], setV = vs[1], as = useState(false), abre = as[0], setAbre = as[1];
  var din = l.din, diverge = din.ok && din.contado!=null && Math.abs(din.contado-l.dinTot)>0.009, ok = !!rec.ok, rodando = !!rec.inicioTs && !ok;
  var grava = function(lista, ass){ var todas = lista.length>0 && lista.every(function(n){ return ass[n]===true; });
    p.onSet({condNums:lista, condAss:ass, prom:todas ? {ok:true, em:new Date().toISOString(), por:p.usuario} : {ok:false}}); };
  var assAtual = function(){ var o = {}; nums.forEach(function(n){ var a = assinadaDe(rec, n); if(a!==undefined) o[n] = a; }); return o; };
  var adiciona = function(){ var n = v.trim(); setV(""); setAbre(false); if(!n || nums.indexOf(n)>=0) return; grava(nums.concat([n]), assAtual()); };
  var define = function(n, val){ var o = assAtual(); if(val==="") delete o[n]; else o[n] = val==="sim"; grava(nums, o); };
  var tira = function(n){ var o = assAtual(); delete o[n]; grava(nums.filter(function(x){ return x!==n; }), o); };
  var pecasDe = function(n){ var x = (r.condicionaisPecas||[]).filter(function(y){ return y.numero===n; })[0]; return x ? x.pecas : 0; };
  var multa = vc ? partesMulta(r, l.ac ? ((r.descontoRemarcacao||{}).comissaoPct||0)+(r.atrasoPct||0) : 0, l.falta) : [];
  var kitA = kitDe(p.kits, r), montouKit = kitA && kitA.montId!=null ? nomeDe(kitA.montId) : "Sem registro";
  // COLUNA 1 (Marcus, 26/11/2026): botão da conferência no topo; Informações (revendedora, representante, montagem, status, datas); Acerto (venda, comissão, valor do acerto); Pagamento
  var recebidoTxt = rec.fimTs ? hmd(rec.fimTs)+" "+hm(rec.fimTs) : "Ainda não recebido";
  var colA = e("div",{key:"a", className:"flex flex-col"},
    e(Bloco,{t:"Informações"},
      e(Par,{t:"Revendedora", v:nome(r.rev), grande:true}), e(Par,{t:"Representante", v:nome(r.rep)||"—", grande:true}), e(Par,{t:"Montou o kit", v:montouKit}),
      e(Par,{t:"Status do atendimento", v:l.status, cor:corStatus(l.status)}), e(Par,{t:"Data da venda", v:fmtData(r.data)+(r.hora ? " "+r.hora : "")}), e(Par,{t:"Recebido na empresa", v:recebidoTxt, cor:rec.fimTs ? "" : "text-white"})),
    vc && l.ac && e(Bloco,{t:"Acerto"},
      e(Par,{t:"Valor de venda", v:BK(r.vendaLiquida||0)}), e(Par,{t:"Comissão", v:r.comissaoPct+"%"}), e(Par,{t:"Valor do acerto", v:BK(r.valorAcerto||0), cor:"font-semibold"})));
  var blocoMulta = multa.length>0 && e(Bloco,{key:"mu", t:"Multas e prazo"}, multa.map(function(m, i){ return e("div",{key:i, title:m.d, className:PAR}, e("span",{className:PAR_ROT}, m.l), e("b",{className:"tabular-nums "+PAR_VAL+" "+m.c}, m.v)); }));
  // SITUAÇÃO DO PAGAMENTO (Marcus, 26/11/2026): em palavras, o que a revendedora pagou, o que falta e o que a regra manda fazer (multa, prazo, kit bloqueado, parcelas, jurídico)
  var NR = r.regrasNovas || null, pzS = vc && l.ac && l.falta>0.009 ? prazoPendente(r, isoDia(new Date())) : null, nadaPago = l.pago<=0.009, pctPago = l.devido>0 ? Math.round(l.pago/l.devido*100) : 0;
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
  var pags = r.pagamentos||[];
  // FORMAS DE PAGAMENTO (Marcus, 26/11/2026): Conta | DevMaster | Valor | Comprovante, uma linha para cada pagamento e nada quebra de linha
  // DINHEIRO NA TABELA (Marcus, 26/11/2026): a confirmação do recebimento fica na coluna Comprovante da linha Dinheiro; depois de confirmada mostra "Recebido" e o mesmo clique desfaz. As regras de recebimento (p.onDin, p.onDinDesfaz) não mudaram.
  var primDin = pags.filter(function(x){ return x.forma==="dinheiro"; })[0];
  var celDin = function(pg){
    if(pg!==primDin) return "—";
    if(!din.ok) return agenda ? e(Botao,{principal:true, onClick:function(){ p.onDin(null); }}, "Recebi o dinheiro") : "Falta receber";
    var txt = diverge ? "Divergente" : "✓ Recebido", cor = diverge ? "text-destructive" : "text-success", tit = (diverge ? "Contado "+BK(din.contado)+" · " : "")+(l.repDinOk ? "Representante confirmou" : "Aguarda a representante");
    return agenda && !ok ? e("button",{type:"button", onClick:p.onDinDesfaz, title:tit+" · clique para desfazer", className:"whitespace-nowrap font-bold underline "+cor}, txt) : e("span",{title:tit, className:"font-bold "+cor}, txt); };
  var tabPag = pags.length>0 && e(GradeFicha,{key:"tp", cols:COLS_PAG, cab:["Conta", "DevMaster", "Valor", "Comprovante"], linhas:pags.map(function(pg){
    var f = FORMA_PALAVRA[pg.forma] || pg.forma, c = pg.descricao ? rotuloConta(pg.descricao, false) : "", conta = c && c.toLowerCase()!==String(f).toLowerCase() ? f+" · "+c : f,
      dc = pg.descricao ? dadosDaConta(p.estado, pg.descricao) : null, sis = dc && dc.numerario ? dc.numerario : "—";   // DevMaster = o numerário: o que se escreve na DevMaster (Marcus, 26/11/2026: Pix Greice entra no sistema como Pix Marcus Hess)
    var an = pg.anexo, pedL = pedidoDe(p.estado && p.estado.lancFin, r.kitId), lnh = pedL && (pedL.linhas||[]).filter(function(x){ return x.pid===pg.pid; })[0],
      cmp = lnh ? (lnh.partes||[]).map(function(q){ return q.comprovante; }).filter(Boolean)[0] : null, u = (an && an.dados) || (cmp && cmp.url) || null,   // comprovante anexado pela representante no admin dela (Marcus, 26/11/2026)
      cel = pg.forma==="dinheiro" ? celDin(pg) : !pedeConta(pg.forma) ? "—" : u ? e("button",{type:"button", onClick:function(){ abreComp(u); }, className:"font-bold text-success underline"}, "Ver comprovante") : (an || cmp) ? "Anexado" : e("span",{className:"text-destructive"}, "Sem comprovante");
    return [conta, e("b",null, sis), e("b",{className:"tabular-nums text-success"}, BK(pg.valor||0)), cel]; })});
  var blocoSit = vc && l.ac && e(Bloco,{key:"sit", t:"Pagamento"},
    pags.length===0 && e("div",{className:MSG}, "Nenhum pagamento registrado."),
    tabPag,
    e("div",{className:PAR},
      e("span",{className:PAR_ROT+" gap-1"}, "Pagou", e("b",{className:"tabular-nums "+(l.pago>0.009 ? "text-success" : "")}, BK(l.pago)+" · "+pctPago+"%")),
      e("span",{className:PAR_VAL+" gap-1"}, "Falta pagar", e("b",{className:"tabular-nums "+(l.falta>0.009 ? "text-destructive" : "")}, BK(Math.max(l.falta, 0))))));
  // prazo e regras da cobrança vão para a coluna do lado (Marcus, 26/11/2026: o bloco 2 termina nas formas de pagamento)
  var blocoRegras = vc && l.ac && l.falta>0.009 && e(Bloco,{key:"reg", t:"Prazo e cobrança"},
    pzS && e(Par,{t:"Prazo", v:pzS.atraso>0 ? pzS.atraso+" dias de atraso · +"+pzS.pct+"%" : "dia "+pzS.dias+" de "+pzS.prazo, cor:pzS.atraso>0 ? "text-destructive" : ""}),
    linhasSit.length>0 && e("details",null, e("summary",{className:LIN+" cursor-pointer font-semibold"}, "Regras da cobrança"), linhasSit.map(function(x, i){ return e("p",{key:i, className:MSG}, x); })));
  // CONFERÊNCIA (Marcus, 26/11/2026): só o título na barra azul; o status e o botão ficam na linha logo abaixo
  var confRec = e(Bloco,{t:"Conferência do recebimento"},
    e("div",{className:PAR},
      e("span",{className:PAR_ROT+" font-semibold "+(ok ? "text-success" : "text-white")}, ok ? "Conferido" : rodando ? "Em andamento" : "Não iniciada"),
      e("div",{className:CEL}, e(Botao,{principal:!ok, desabilitado:!agenda, onClick:p.onRelogio}, ok ? "Desfazer conferência" : rodando ? "Terminar conferência" : "Iniciar conferência"))),
    rec.inicioTs && e(Par,{t:"Início", v:hmd(rec.inicioTs)+" "+hm(rec.inicioTs)}), rec.fimTs && e(Par,{t:"Fim", v:hmd(rec.fimTs)+" "+hm(rec.fimTs)+" · "+tempoEntre(r, rec.fimTs)}), rec.quem && e(Par,{t:"Conferido por", v:rec.quem}));
  // CONFERÊNCIA DO ACERTO (Marcus, 26/11/2026): o Retorno · bipar veio para cá; fica travada até terminar a conferência do recebimento
  var confAc = e(Bloco,{t:"Conferência do acerto"},
    e("div",{className:PAR},
      e("span",{className:PAR_ROT+" font-semibold "+(rec.bip ? "text-success" : "text-white")}, !rec.ok ? "Aguarda recebimento" : rec.bip ? "Bipado" : "Falta bipar"),
      e("div",{className:CEL}, p.podeBip ? e(Botao,{principal:!rec.bip, desabilitado:!rec.ok, onClick:p.onBipar}, rec.bip ? "Desfazer bipagem" : "Bipei") : e("span",null, "—"))),
    rec.bip && e(Par,{t:"Bipado por", v:nome(rec.bip.por)+" · "+hm(rec.bip.ts)}));
  var blocoConf = e("div",{key:"conf", className:"grid grid-cols-2 items-stretch gap-[2px] bg-white/50 [--vcol:50%]"}, e("div",{key:"cr", className:"flex min-w-0 flex-col bg-[#0f1729]"}, confRec), e("div",{key:"ca", className:"flex min-w-0 flex-col bg-[#0f1729]"}, confAc));
  // CONDICIONAIS EM TABELA (Marcus, 26/11/2026): Número | Qtd. de peças | Conferência; o campo de nova condicional só abre depois de conferir as que já existem
  var todasOk = nums.length===0 || nums.every(function(n){ return assinadaDe(rec, n)===true; });
  var blocoCond = !(l.repos || r.tipoKit==="saiu") && e(Bloco,{key:"cond", t:"Condicionais"},
      nums.length===0 ? e("div",{className:MSG}, "Nenhuma condicional.") : e(GradeFicha,{cols:COLS_COND, cab:["Número da condicional", "Qtd. de peças", "Conferência"], linhas:nums.map(function(n){ var a = assinadaDe(rec, n), c = a===true ? "text-success" : a===false ? "text-destructive" : "";
        return [e("b",{className:"tabular-nums "+c}, n), e("span",{className:"tabular-nums"}, pecasDe(n)>0 ? pecasDe(n) : "—"),
          agenda ? e("div",{className:"flex w-full items-center gap-1"},
            e("div",{className:"relative flex min-w-0 flex-1"}, e("select",{value:a===true ? "sim" : a===false ? "nao" : "", "aria-label":"Assinatura da condicional "+n, className:CAMPO.replace("text-center","text-left")+" appearance-none pl-2 pr-5 [color-scheme:dark]", onChange:function(ev){ define(n, ev.target.value); }}, OPS_ASS.map(function(o){ return e("option",{key:o[0], value:o[0], className:"bg-[#1f3358]"}, o[1]); })), e("span",{"aria-hidden":"true", className:"pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] leading-none text-info"}, "▼")),
            e("button",{type:"button", onClick:function(){ tira(n); }, "aria-label":"Tirar a condicional "+n, title:"Tirar a condicional "+n, className:"grid size-4 shrink-0 place-items-center rounded hover:bg-white/20"}, "×")) : e("span",{className:c}, a===true ? "Assinada" : a===false ? "Não assinada" : "A conferir")]; })}),
      agenda && abre && e("div",{className:PAR},
        e("div",{className:CEL+" border-r border-white/30"}, e("input",{value:v, placeholder:"Nº da nova condicional", "aria-label":"Número da condicional", className:CAMPO, autoFocus:true, onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") adiciona(); }})),
        e("div",{className:CEL+" gap-1"}, e(Botao,{onClick:adiciona, desabilitado:!v.trim()}, "Adicionar"), e(Botao,{onClick:function(){ setV(""); setAbre(false); }}, "Cancelar"))),
      agenda && !abre && todasOk && e("div",{className:LIN}, e("button",{type:"button", onClick:function(){ setAbre(true); }, className:"font-semibold text-white/80 underline hover:text-white"}, "+ Adicionar condicional")));
  var colP = blocoSit || e(Bloco,{key:"pag", t:"Pagamento"}, tabPag || e("div",{className:MSG}, "Este atendimento não tem pagamento."));
  var pm = function(parte){ return e(PecasMini,{parte:parte, l:l, agenda:agenda, receber:p.receber, todos:p.todos, usuario:p.usuario, podeProx:p.podeProx, podeBip:p.podeBip}); };
  var col = function(k, c){ return e("div",{key:k, className:"flex flex-1 flex-col"}, c); };   // enche a altura da coluna: lançados e resumo dos brindes ficam fixos embaixo
  var semPecas = e(Bloco,{t:"Peças e brindes"}, e("div",{className:MSG}, "Este atendimento não tem peças do acerto."));
  var vazio = function(titulo, msg){ return e(Bloco,{t:titulo}, e("div",{className:MSG}, msg)); };
  var colR = e("div",{key:"r", className:"flex flex-1 flex-col"},
    l.ac ? pm("trocas") : vazio("Trocas", "Não se aplica."),
    l.ac ? pm("prox") : vazio("Peças do próximo mês", "Não se aplica."),
    l.ac && p.podeBip && e("div",{className:"mt-auto flex flex-col"}, e(Diferencas,{l:l, kits:p.kits, podeBip:p.podeBip, usuarioNome:p.usuarioNome, onDif:p.onDif, onDifTira:p.onDifTira})));
  // 4 COLUNAS, cada uma da altura toda (Marcus, 26/11/2026; o bloco de dinheiro separado acabou, o dinheiro está no Pagamento):
  // 1) conferência, informações, acerto, pagamento (com o dinheiro), prazo e cobrança, multas e, no fim, as condicionais (parte do agendamento) | 2) peças do acerto e brindes | 3) retorno e diferenças | 4) peças do próximo mês e trocas
  var celulas = [e("div",{key:"c1", className:"flex flex-col "+VCOL}, blocoConf, colA, colP, blocoRegras, blocoMulta, blocoCond, l.ac && pm("condnova")),
    l.ac ? col("c2", pm("pecas")) : col("c2", semPecas),
    colR];
  var cheias = celulas.map(function(c, i){ return e("div",{key:"n"+i, className:"relative flex min-w-0 flex-col overflow-x-auto bg-[#0f1729]"}, c); });
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
  return e("section",{className:"flex flex-col"+(p.cresce ? " flex-1" : "")},
    e("div",{className:"flex min-h-6 items-center justify-center gap-3 whitespace-nowrap border-b border-white/30 bg-[var(--bloco-titulo)] px-2 text-center text-[11px] font-bold text-white"}, e("span",null,p.t), p.dir),
    e("div",{className:"flex flex-col"+(p.cresce ? " flex-1" : "")}, p.children));
}
function Botao(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.desabilitado, className:"h-[22px] min-w-20 whitespace-nowrap rounded border px-2 text-[11px] font-semibold "+((p.cheio ? "w-full " : "")+(p.principal ? "border-primary bg-primary/20 text-primary hover:bg-primary/30" : "border-white/40 bg-white/10 text-white hover:bg-white/20"))+(p.desabilitado ? " opacity-50" : "")}, p.children);
}
// ficha compacta como Contas a pagar (Marcus, 23/11/2026): letra de 10 px, linhas de 20 px e controles de 18 px; fundo azul-marinho do sistema, nunca preto
var FICHA_FINA = "[&_*]:!text-[10px] [&_.min-h-7]:!min-h-6 [&_button]:!h-4 [&_select]:!h-4 [&_input]:!h-4 [&_button]:!leading-none";   // padrao-ok: igual à Contas a pagar (10 px, 18 px)
function FichaJanela(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-[#0b1530]/85 p-3", onClick:p.fechar},
    e("div",{onClick:function(ev){ ev.stopPropagation(); }, className:"max-h-[92vh] w-full max-w-[min(98vw,1700px)] overflow-y-auto [&_*]:!normal-case "+FICHA_FINA+" "+PADRAO_BLOCOS},
      e(BlocoPainel,{titulo:p.t, dir:e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", title:"Fechar", className:"grid size-6 place-items-center rounded hover:bg-white/20"}, "×")},
        e("div",{className:"bg-[#0f1729]"},
          p.sub && e("p",{className:"px-2 py-1 text-center text-[11px]"}, p.sub),
          e("div",{className:"grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-[minmax(34rem,2.2fr)_minmax(36rem,1.9fr)_minmax(22rem,1.2fr)] gap-[2px] bg-white/50"}, p.colunas)))));
}
function PecasMini(p){
  var cn = useState(""), numNova = cn[0], setNumNova = cn[1], pv = useState({}), precos = pv[0], setPrecos = pv[1];
  var r = p.l.r, rec = p.l.rec, ok = rec.pecasOk || {}, lista = lancadosDe(r);
  var anterior = (p.todos||[]).filter(function(a){ return a.tipo==="acerto" && a.rev===r.rev && a.id!==r.id && (a.data||"")<(r.data||""); }).sort(function(a,b){ return a.data<b.data ? 1 : -1; })[0],
    retiradas = anterior ? lancadosDe(anterior).filter(function(b){ return b.origem==="nova"; }) : [],
    normal = lista.filter(function(b){ return b.cat==="normal"; }), bb = lista.filter(function(b){ return b.cat==="bb"; }), prox = (r.pecasProxCodigos||[]);
  // valor de cada peça do próximo mês: preço de venda da DevMaster pelo código (mesma rota da calculadora); sem preço mostra traço
  var chaveProx = prox.join(",");
  useEffect(function(){ if(!chaveProx || !apiAtiva()) return; var vivo = true;
    chamar("GET", "/precos-pecas?codigos="+encodeURIComponent(chaveProx)).then(function(x){ if(vivo && x && x.itens) setPrecos(x.itens); }).catch(function(){});
    return function(){ vivo = false; }; }, [chaveProx]);
  var marca = function(cod){ if(!p.podeBip || !(rec.ok)) return; var o = Object.assign({}, ok); o[cod] = !o[cod]; p.receber(r.id, {pecasOk:o}); };
  var salvaNova = function(){ if(numNova) p.receber(r.id, {condNova:{numero:numNova, por:p.usuario, em:new Date().toISOString()}}); };
  var somaDe = function(itens){ return r2(itens.reduce(function(t2,i){ return t2+(i.valor||0); }, 0)); };
  // células das tabelas de peças: Conferência (marca ✓), Código da peça, Origem e Valor, cada uma na sua coluna (Marcus, 26/11/2026: o código nunca vem junto com a origem)
  var btnConf = function(i){ var on = !!ok[i.codigo];
    return e("button",{type:"button", disabled:!p.podeBip || !rec.ok, title:!rec.ok ? "Aguarda a conferência do recebimento" : on ? "Conferida" : "Conferir", onClick:function(){ marca(i.codigo); }, "aria-label":(on ? "Desmarcar " : "Marcar como conferida ")+i.codigo, className:"w-full font-bold disabled:opacity-50"}, e("span",{className:on ? "text-success" : "text-info"}, on ? "✓" : "○")); };
  var codPeca = function(i){ return e("b",{className:"tabular-nums"+(ok[i.codigo] ? " text-success" : "")}, i.codigo); };
  var origemTxt = function(i){ return i.origem==="antiga" ? "Kit antigo" : i.origem==="nova" ? "Kit novo" : "—"; };
  // cada tabela de brindes: itens, área vazia com as linhas verticais continuando e, no rodapé fixo, 3 linhas (lançado, total da categoria, diferença); valores vêm das contas de antes (l.brindes e o acerto)
  var blocoBr = function(titulo, itens, lanc, total){ var feitas = itens.filter(function(i){ return ok[i.codigo]; }).length, dif = r2((lanc||0)-(total||0));
    var cj = CEL.replace("px-2", "px-1")+" min-h-6 border-b border-white/30 text-center text-[11px] font-bold";
    var rod = function(rot, val, cor){ return [e("div",{key:rot+"r", className:cj+" col-span-3 border-r"}, rot), e("div",{key:rot+"v", className:cj+" tabular-nums "+(cor||"")}, val)]; };
    return e(Bloco,{key:titulo, cresce:true, t:titulo},
      e("div",{className:"flex flex-1 flex-col"},
        e(GradeFicha,{junto:true, cols:COLS_BRINDE, cab:["Conferência", "Código", "Origem", "Valor"], linhas:itens.map(function(i){ return [btnConf(i), codPeca(i), origemTxt(i), i.valor!=null ? e("span",{className:"tabular-nums"}, BK(i.valor)) : "—"]; })}),
        e("div",{className:"grid flex-1", style:{gridTemplateColumns:COLS_BRINDE}}, [0, 1, 2, 3].map(function(i){ return e("div",{key:i, className:i<3 ? "border-r border-white/30" : ""}); }))),
      e("div",{className:"grid border-t border-white/30", style:{gridTemplateColumns:COLS_BRINDE}},
        rod("Conferidas", feitas+"/"+itens.length, feitas===itens.length && itens.length>0 ? "text-success" : ""), rod("Valor lançado", BK(lanc||0)), rod("Total dos brindes", BK(total||0)),
        rod("Diferença", dif>0.009 ? "+"+BK(dif) : dif<-0.009 ? "−"+BK(-dif) : "Sem diferença", dif>0.009 ? "text-destructive" : dif<-0.009 ? "text-success" : ""))); };
  var pecas = e(Bloco,{t:"Peças do acerto"}, e(GradeFicha,{cols:"repeat(5,auto)", cab:["Total", "Vendidas", "Trocas", "Brindes", "Retornadas"],
    linhas:[[r.pecasCond, r.pecasVendidas, r.pecasTrocas||0, lista.length, r.pecasADevolver].map(function(v){ return e("b",{className:"tabular-nums"}, v==null || v==="" ? "—" : v); })]}));
  // resumo dos brindes (regras financeiras de antes: lançado e permitido vêm de l.brindes e do acerto; "a pagar a mais" é o excedente já somado no total a pagar)
  var lancTot = r2((p.l.brindes.lancadoNormal||0)+(p.l.brindes.lancadoSelect||0)), brindesTot = r2((r.brindeNormal||0)+(r.brindeSelect||0)), maisBr = r.excedenteBrinde||0, menosBr = maisBr>0 ? 0 : Math.max(0, r2(brindesTot-lancTot));
  var resumoBr = e(Bloco,{t:"Resumo dos brindes"},
    e(Par,{t:"Valor total lançado", v:BK(lancTot)}), e(Par,{t:"Valor total dos brindes", v:BK(brindesTot)}),
    maisBr>0 ? e(Par,{t:"A pagar a mais", v:BK(maisBr), cor:"text-destructive"}) : menosBr>0.009 ? e(Par,{t:"A pagar a menos", v:BK(menosBr), cor:"text-success"}) : e(Par,{t:"Diferença", v:"Sem diferença"}));
  var brindes = e("div",{className:"@container flex flex-1 flex-col"}, e("div",{className:"grid flex-1 grid-cols-1 items-stretch gap-[2px] bg-white/50 @min-[35rem]:grid-cols-2"}, e("div",{key:"bn", className:"flex min-w-0 flex-col bg-[#0f1729]"}, blocoBr("Brindes", normal, p.l.brindes.lancadoNormal, r.brindeNormal)), e("div",{key:"bb", className:"flex min-w-0 flex-col bg-[#0f1729]"}, blocoBr("Brindes BB", bb, p.l.brindes.lancadoSelect, r.brindeSelect))), resumoBr);
  var trocas = (r.trocas||[]).length>0 && e(Bloco,{key:"tr", t:"Trocas"}, e(GradeFicha,{cols:"4.5rem minmax(min-content,1fr) 5.5rem", cab:["Troca", "Código da peça", "Valor"], linhas:r.trocas.reduce(function(o, t){ var aj = t.tipo==="anterior" ? (t.novaValor||0)-(t.antigaValor||0) : (t.novaValor||0);   // cada troca vira 3 linhas: a peça que voltou, a que ficou e o ajuste
    return o.concat([["Voltou", e("b",{className:"tabular-nums"}, t.antigaCod), e("span",{className:"tabular-nums"}, BK(t.antigaValor))], ["Ficou", e("b",{className:"tabular-nums"}, t.novaCod), e("span",{className:"tabular-nums"}, BK(t.novaValor))], [aj>=0 ? "Soma" : "Desconta", "—", e("b",{className:"tabular-nums"}, BK(Math.abs(aj)))]]); }, [])}));
  var blocoProx = prox.length>0 && e(Bloco,{key:"px", t:"Peças do próximo mês"}, e(GradeFicha,{cols:"3.75rem minmax(min-content,1fr) 5.5rem", cab:["Conferência", "Código", "Valor"], linhas:prox.map(function(c){ var vl = precos[c]; return [btnConf({codigo:c}), codPeca({codigo:c}), vl && vl.preco>0 ? e("span",{className:"tabular-nums"}, BK(vl.preco)) : "—"]; })}));
  var condNova = prox.length>0 && e(Bloco,{key:"cn", t:"Condicional nova"},
    e(Par,{t:"Situação", v:rec.condNova ? "Gerada" : "Pendente", cor:rec.condNova ? "text-success" : ""}),
    rec.condNova ? e("div",{className:LIN}, e("b",{className:"tabular-nums text-success"}, "✓ "+rec.condNova.numero), p.podeProx && e(Botao,{onClick:function(){ p.receber(r.id, {condNova:null}); }}, "Desfazer"))
      : p.podeProx ? e("div",{className:"grid grid-cols-[minmax(0,1fr)_auto] items-stretch "+LINHA},
          e("div",{className:"flex items-center border-r border-white/30 px-2"}, e("input",{value:numNova, placeholder:"Nº da condicional nova", title:"Faça a nova bipagem na DevMaster e coloque aqui o número da condicional nova", "aria-label":"Número da condicional nova", className:CAMPO, onChange:function(ev){ setNumNova(ev.target.value.replace(/[^0-9]/g,"")); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvaNova(); }})),
          e("div",{className:"flex items-center px-2"}, e(Botao,{principal:true, desabilitado:!numNova, onClick:salvaNova}, "Salvar")))
      : e("div",{className:MSG+" font-semibold text-white"}, "Aguardando quem faz a bipagem do retorno"));
  var tiradas = anterior && retiradas.length>0 && e(Bloco,{key:"mal", t:"Tiradas do kit novo"}, e(Par,{t:"Acerto de", v:fmtData(anterior.data)}), e(GradeFicha,{cols:"minmax(min-content,1fr) 5.5rem", cab:["Código da peça", "Valor"], linhas:retiradas.map(function(i){ return [e("b",{className:"tabular-nums"}, i.codigo), i.valor!=null ? e("span",{className:"tabular-nums"}, BK(i.valor)) : "—"]; })}));
  if(p.parte==="condnova") return condNova || null;
  if(p.parte==="trocas") return e("div",{className:"flex flex-col"}, trocas || e(Bloco,{t:"Trocas"}, e("div",{className:MSG}, "Nenhuma troca neste acerto.")));
  if(p.parte==="prox") return e("div",{className:"flex flex-col"}, blocoProx || e(Bloco,{t:"Peças do próximo mês"}, r.pecasProxLiberadas>0 ? [e("div",{key:"a", className:MSG}, r.pecasProxLiberadas+" peças liberadas pela representante."), e("div",{key:"b", className:MSG}, "Os códigos não vieram do admin dela.")] : e("div",{className:MSG}, "Nenhuma peça para o próximo mês.")), condNova, tiradas);
  return e("div",{className:"flex flex-1 flex-col"}, pecas, brindes);
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
  var vista = "rep";                 // Atendimentos (uma linha por atendimento) ou Por representante (uma linha por representante)
  var ri = useState(""), repIni = ri[0], setRepIni = ri[1];                    // clicou numa representante na visão Por representante: a tabela abre já filtrada nela
  var pa = useState("todas"), pagModo = pa[0], setPagModo = pa[1];             // colunas das contas de pagamento: começam ABERTAS, uma coluna para cada conta (Marcus, 23/11/2026); dá para deixar só as contas com valor ou fechar
  var pe = useState("aberto"), pecasModo = pe[0], setPecasModo = pe[1];        // colunas de peças e brindes: começam abertas (Marcus, 23/11/2026)
  var ru = useState(""), revUnica = ru[0], setRevUnica = ru[1];                // o filtro das colunas deixou UMA revendedora: os pagamentos mostram só as contas com valor dela e as peças ficam abertas
  var cmS = useState("resumo"), colunasModo = cmS[0], setColunasModo = cmS[1];   // resumo = poucas colunas (o detalhe está no card) · completo = todas
  var kk = useState(false), knAberto = kk[0], setKnAberto = kk[1];
  var dt = useState(null), popId = dt[0], setPopId = dt[1];                    // atendimento com a janela de brindes e peças aberta
  var pc = useState(false), passosAberto = pc[0], setPassosAberto = pc[1];
  var ms = useState("pend"), mostra = ms[0], setMostra = ms[1];               // pend = acertos que a representante fez no app e ainda não foram conferidos na empresa (de qualquer mês) · todos = todos os do mês
  var agS = useState("dia"), agrDia = agS[0], setAgrDia = agS[1], dfS = useState(""), diaSel = dfS[0], setDiaSel = dfS[1], fcS = useState({}), diasFechados = fcS[0], setDiasFechados = fcS[1];   // atendimentos agrupados por dia (Marcus, 27/11/2026)
  var br = useState(""), buscaRep = br[0], setBuscaRep = br[1];
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
  var exigeRep = !!repIni, q = semAcento(busca).trim(), semRep = exigeRep && !repIni && !q;
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
  // permissões separadas (Marcus, 26/11/2026): peças e brindes só quem bipa; recebimento (condicionais e dinheiro) só o agendamento e a supervisão; a gravação também confere
  var receber = function(id, patch){ var bipa = "pecasOk" in patch || "condNova" in patch;
    if(bipa ? !(podeBip || podeBipRetorno(s.usuario)) : !agenda) return d({type:"AVISO", txt:bipa ? "Só quem bipa o retorno confere as peças e os brindes" : "Só o agendamento e a supervisão conferem os atendimentos"}); d({type:"CONSREP_RECEBER", id:id, patch:patch}); };
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
    receber(l.r.id, {ok:true, fimTs:agora(), quem:usuarioNome, por:s.usuario, entrega:isoDia(new Date())}); setPopId(null);   // terminou: fecha a ficha já atualizada (Marcus, 27/11/2026)
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
      conf:rec.ok ? "Conferido" : rec.inicioTs ? "Em conferência" : "A conferir", data:r.data||"", dia:"d"+String(99999999-(parseInt(String(r.data||"").replace(/-/g,""),10)||0)), hora:r.hora||"", recebido:rec.fimTs ? isoDia(new Date(rec.fimTs)) : "", rep:nome(r.rep)||"—", rev:nome(r.rev), status:l.status,
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
    {k:"data", t:"Data", data:true, fmt:function(v){ return fmtData(v).slice(0,5); }, render:function(v, row){ return e("span",{className:"whitespace-nowrap", title:fmtData(v)+(row && row.hora ? " "+row.hora : "")}, fmtData(v).slice(0,5)); }},
    {k:"rev", t:"Revendedora", titulo:true},
    {k:"conf", t:"Etapa atual", render:function(v, row){ var x = etapaDe(row.l); return e("button",{type:"button", title:x.dica, onClick:function(ev){ ev.stopPropagation(); abre(row.l, false); }, className:"whitespace-nowrap font-semibold "+x.cor}, x.txt); }},
    {k:"status", t:"Tipo de atendimento", cor:function(row){ return corStatus(row.status)+" font-semibold"; }},
    {k:"cond", t:"Condicional · assinatura", render:function(v, row){ if(v==="") return ""; var ce = condEstado(row.l); return e("span",{className:"font-semibold "+ce.cor}, ce.resumo); }},
    ];   // quantas diferenças a bipadora registrou no card (26/11/2026)
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
  var cols = (completo ? g1.concat(g2, g3, g4) : g1.filter(function(c2){ return c2.k!=="cond"; }).concat(g2.filter(function(c2){ return c2.k==="venda" || c2.k==="comissao" || c2.k==="acerto"; }))).filter(function(c2){ return podeBip || c2.k!=="dif"; });   // agendamento não vê Diferenças (só quem bipa)
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
    {k:"tx", t:"Reposição taxas", f:function(l){ return l.tx.taxa>0 && !l.tx.paga ? 1 : 0; }}].concat(!ver ? [] : [
    {k:"vd", t:"Vendas", din:true, f:function(l){ return l.ac ? (l.r.vendaLiquida||0) : 0; }},
    {k:"dv", t:"Total a pagar", din:true, f:function(l){ return l.ac ? l.devido : 0; }},
    {k:"pg", t:"Valor pago", din:true, f:function(l){ return l.ac ? l.pago : 0; }},
    {k:"in", t:"Inadimplente", din:true, f:function(l){ return l.falta||0; }}]);
  var linhasMes = doMes.map(function(r){ return linha(r, c); });
  var porRep = {}; linhasMes.forEach(function(l){ var k = nome(l.r.rep) || "—", o = porRep[k] || (porRep[k] = {id:k, rep:k}); METRICAS.forEach(function(m){ o[m.k] = r2((o[m.k]||0)+m.f(l)); }); });
  var sa0 = function(x){ return String(x||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim(); };
  ((s.agend && s.agend.config && s.agend.config.representantes) || []).filter(function(r0){ return r0 && r0.codigo && r0.nome && r0.ativo!==false; }).forEach(function(r0){   // toda representante ativa aparece, mesmo com 0 atendimentos (Marcus, 27/11/2026)
    var nn = sa0(String(r0.nome).replace(/[^A-Za-zÀ-ÿ ].*$/, "").trim()), ja = Object.keys(porRep).some(function(k){ var x = sa0(k); return x && (x===nn || x.indexOf(nn+" ")===0 || nn.indexOf(x+" ")===0); });
    if(!ja){ var o0 = {id:nome(String(r0.nome).replace(/[^A-Za-zÀ-ÿ ].*$/, "").trim()), rep:nome(String(r0.nome).replace(/[^A-Za-zÀ-ÿ ].*$/, "").trim())}; METRICAS.forEach(function(m){ o0[m.k] = 0; }); porRep[o0.id] = o0; } });
  var baseNm = function(x){ return sa0(String(x||"").replace(/[^A-Za-zÀ-ÿ ].*$/, "")); };
  var codsRep = function(n){ var b = baseNm(n); if(!b) return ""; var cs = []; ((s.agend && s.agend.config && s.agend.config.representantes) || []).forEach(function(r0){ if(!r0 || !r0.codigo || r0.ativo===false) return; var x = baseNm(r0.nome); if(x && (x===b || x.indexOf(b+" ")===0 || b.indexOf(x+" ")===0) && cs.indexOf(String(r0.codigo))<0) cs.push(String(r0.codigo)); }); return cs.join(" / "); };
  Object.keys(porRep).forEach(function(k){ if(baseNm(k)==="sorelly") delete porRep[k]; });   // Sorelly = atendimento interno, fora da lista (Marcus, 27/11/2026)
  var linhasRep = Object.keys(porRep).map(function(k){ return porRep[k]; }).sort(function(a, b){ return b.at-a.at || a.rep.localeCompare(b.rep); });
  var colsRep = [{k:"rep", t:"Representante", titulo:true}, {k:"cod", t:"Código", render:function(v, row){ return codsRep(row.rep) || codDe(row.rep) || "---"; }}].concat(METRICAS.map(function(m){ return m.din ? reais(m.k, m.t) : {k:m.k, t:m.t}; }));
  var rodapeRep = function(ls){ return colsRep.map(function(c2, j){ return j===0 ? "Total" : c2.k==="cod" ? "" : c2.din ? BK(somaK(ls, c2.k)) : somaK(ls, c2.k); }); };

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
  var diasOps = [["", "Todos os dias"]].concat(linhasTab.map(function(x){ return x.data; }).filter(function(d, k, a){ return d && a.indexOf(d)===k; }).sort().reverse().map(function(d){ return [d, fmtData(d).slice(0,5)]; }));
  var tabelaLista = e(TabelaPlanilha,{key:"l"+mes+repIni, fina:true, cols:cols, cabAcima:cabAcima, linhas:linhasTab.filter(function(x){ return !diaSel || x.data===diaSel; }), chave:"id", agrupar:agrDia==="dia" ? "dia" : undefined, faixaFina:true, grupoEsquerda:true, grupoAberto:function(v){ return !diasFechados[v]; }, aoGrupo:function(v){ var o = Object.assign({}, diasFechados); o[v] = !o[v]; setDiasFechados(o); }, linhaGrupo:function(v, rs){ var n = rs.length, tot = linhasTab.filter(function(x){ return x.dia===v && (!diaSel || x.data===diaSel); }).length; return {span:cols.length, rotulo:(diasFechados[v] ? "▸ " : "▾ ")+fmtData(rs[0].data).slice(0,5)+" · "+tot+(tot===1 ? " atendimento" : " atendimentos")}; }, grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, tracoVazio:"---", limite:300, aoClicar:function(row){ abre(row.l, false); }, alturaMax:"calc(100vh - 6.6rem)",
    onFiltradas:function(ls){ filtradas.current = ls; setRevUnica(ls.length>0 && ls.length<linhasTab.length && ls.every(function(x){ return x.rev===ls[0].rev; }) ? ls[0].rev : ""); }, totalRodape:rodape, vazio:"Nada em "+nomeMes(mes)+". O que a representante preencher no app aparece aqui."});
  var tabelaRep = e(TabelaPlanilha,{key:"r"+mes+(repIni ? "a" : ""), tracoVazio:"---", fina:true, cols:colsRep, linhas:linhasRep.filter(function(x){ if(repIni && x.rep!==repIni) return false; var q = String(buscaRep||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim(); return !q || String(x.rep||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().indexOf(q)>=0; }), chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, alturaMax:repIni ? "30vh" : "calc(100vh - 6.6rem)",
    aoClicar:function(row){ setRepIni(row.rep===repIni ? "" : row.rep); setMostra("todos"); setBusca(""); setRevUnica(""); filtradas.current = null; }, totalRodape:rodapeRep, vazio:"Nada em "+nomeMes(mes)+"."});

  // sem representante escolhida: a funcionária vê as representantes com acerto aguardando a empresa (clicar escolhe) e, embaixo, o passo a passo do que confirmar (Marcus, 25/11/2026)
  var tracoOk = "---";   // célula sem nada aparece com --- (Marcus, 25/11/2026)
  var tabelaPend = e(TabelaPlanilha,{key:"pend", fina:true, cols:[{k:"rep", t:"Representante", titulo:true}, {k:"qtd", t:"Acertos aguardando a empresa", qtd:true}, {k:"desde", t:"Mais antigo", data:true, fmt:function(v){ return fmtData(v); }}], linhas:linhasPend, chave:"id", grade:true, semFiltro:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true,
    aoClicar:function(row){ setMostra("pend"); setRepIni(row.rep); }, vazio:"Nenhum acerto aguardando a empresa.", tracoVazio:tracoOk});
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
  var seletorRep = false && e("div",{ref:selRef, className:"relative flex min-w-[220px]"},
    e("button",{type:"button", "aria-haspopup":"listbox", "aria-expanded":selAberto, "aria-label":textoSel, title:textoSel, onClick:function(){ setSelAberto(!selAberto); },
      className:"flex h-[18px] flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded border border-white/25 bg-white/10 px-1 text-[10px] font-medium text-white outline-none focus-visible:ring-2 focus-visible:ring-white"},
      e("span",{className:"whitespace-nowrap"}, rotuloBotao),
      e("span",{"aria-hidden":"true", className:"text-[11px] leading-none"}, selAberto ? "▲" : "▼")),
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

  var rot = function(t, ctl){ return e("div",{className:"flex flex-col items-stretch border-r border-white/25 [&_:is(select,input,button,b)]:!text-[11px]"}, e("span",{className:"min-h-[11px] border-b border-white/25 px-2 py-0.5 text-center text-[11px] font-semibold leading-none text-white"}, t), e("div",{className:"flex flex-1 items-center justify-center px-1.5 py-0.5"}, ctl)); };   // célula da barra em forma de tabela, igual à Contas a receber
  return e(Pagina,{className:PAGINA_CHEIA+" [&_*]:!normal-case [&>section:first-child_h2]:!text-[16px] [&>section:first-child_h2]:!font-bold"},   // padrao-ok: título de 16 px, pedido do Marcus (27/11/2026)
    e(BlocoPainel,{titulo:"Consolidado dos representantes", compacto:true},
      e(BarraTabela,null,
        seletorRep && rot("Representante", seletorRep),   // padrao-ok: campo Buscar maior e botão de 20 px, pedido do Marcus (25/11/2026)
        rot("Mês", e(CampoMini,{valor:mes, aoMudar:function(m){ setMes(m); setRevUnica(""); filtradas.current = null; }, rotulo:"Mês", ops:meses.map(function(m){ return [m, nomeMes(m)]; })})),
        vista==="rep" && e("div",{className:"flex items-stretch border-r border-white/25 p-0.5 [&_input]:!h-auto [&_input]:!text-[13px] [&_input]:!font-semibold"}, e(BuscaMini,{valor:buscaRep, aoMudar:setBuscaRep, rotulo:"Buscar representante", ph:"Buscar representante", larg:"w-56"}))),
      e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[12px] [&_table_th]:!text-[12px] [&_table_th]:!font-bold [&_table_th]:!h-[25px]", style:{"--lh":"25px"}},   // padrao-ok: tabela com letra de 14 px e linha de 25 px, pedido do Marcus (27/11/2026)   // padrao-ok: resumo com linha mais alta e letra 11 px, variante da Home da família (Marcus 26/11/2026)
        tabelaRep)),
    !!repIni && e(BlocoPainel,{titulo:"Atendimentos · "+repIni, compacto:true},
      e(BarraTabela,null, rot("Dia", e(CampoMini,{valor:diaSel, aoMudar:setDiaSel, rotulo:"Dia", ops:diasOps})), rot("Agrupar", e(CampoMini,{valor:agrDia, aoMudar:setAgrDia, rotulo:"Agrupar", ops:[["dia", "Por dia"], ["", "Sem agrupar"]]}))),
      e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[12px] [&_table_th]:!text-[12px] [&_table_th]:!font-bold [&_table_th]:!h-[25px]", style:{"--lh":"25px"}}, tabelaLista)),   // padrao-ok: tabela dos atendimentos igual à de cima: letra de 12 px e linha de 25 px, pedido do Marcus (27/11/2026)
    (vista==="rep" || !!repIni) && kn.length>0 && e(BlocoPainel,{titulo:"Kits novos · termo assinado · "+kn.length, compacto:true, aoTitulo:function(){ setKnAberto(!knAberto); }, fechado:!knAberto, dir:semTermo>0 ? e("span",{className:"text-[11px] text-white"}, semTermo+" sem termo") : null},
      e("div",{className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{fina:true, cols:colsKn, linhas:linhasKn, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, tracoVazio:"---", vazio:"Nenhum kit novo neste mês."}))),
    (vista==="rep" || !!repIni) && erros.length>0 && e(BlocoPainel,{titulo:"Erros de bipagem · conferência da representante", compacto:true, dir:e("span",{className:"text-[11px]"}, totalErros+(totalErros===1 ? " peça com erro" : " peças com erro"))},
      e("div",{className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{fina:true, cols:colsErro, linhas:linhasErro, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, semCaixaAlta:true, tracoVazio:"---"}))),
    // janela por cima de tudo: brindes, trocas e peças do próximo mês do atendimento escolhido
    lp && e(FichaConferencia,{key:lp.r.id, estado:s, l:lp, agenda:agenda, vc:vc, usuario:s.usuario, podeBip:podeBip, podeProx:podeBipRetorno(s.usuario), todos:todos, receber:receber, fechar:function(){ setPopId(null); },
      onRelogio:function(){ relogio(lp); }, onSet:function(patch){ receber(lp.r.id, patch); },
      onDin:function(contado){ receber(lp.r.id, {din:{ok:true, contado:contado, ts:agora(), por:s.usuario}}); }, onDinDesfaz:function(){ receber(lp.r.id, {din:{ok:false}}); },
      kits:s.kits||[], usuarioNome:usuarioNome, onDif:function(item){ d({type:"RETORNO_DIF", id:lp.r.id, item:item}); }, onDifTira:function(id){ d({type:"RETORNO_DIF", id:lp.r.id, remover:id}); },
      onBipar:function(){ if(lp.rec.bip) d({type:"RETORNO_BIPAR", id:lp.r.id, desfazer:true}); else d({type:"RETORNO_BIPAR", id:lp.r.id, por:nomeDe(s.usuario), porId:s.usuario}); }}));
}

export { AbaConsolidadoRep };
