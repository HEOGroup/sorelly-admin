// Sorelly Admin — pages/AtendimentoInternoCalculadora.js
// Kits → Atendimento Interno (Novo) → Calculadora de acertos. Mesma conta do app da representante (domain/acerto-derivado.js),
// em tela COMPLETA para o balcão: agenda de hoje à esquerda e todas as etapas do acerto à direita, na ordem, para ir preenchendo (Enter adiciona a linha);
// resumo fixo no topo. O valor vendido vem direto do app da revendedora (campo vendaApp do atendimento).
import { BARRAS } from "@/apps/montagem/components/equipe-blocos";
import { Aviso, BotaoRemover as Remover, LinhaCampo, Secao, TabelaSimples as Tab, TdSimples as Td, Tile } from "@/apps/montagem/components/padrao-fin";
import { FORM_ACERTO_VAZIO, derivarAcerto } from "@/apps/montagem/domain/acerto-derivado";
import { totalDividaAnterior } from "@/apps/montagem/domain/comissoes";
import { AVISO_BB, PARCELAS_CARTAO, codigoBrindeValido, comissaoEspecialDe, formasPagamentoPadrao, modalidadeDe, normalizarCodigo, textoRegras, vezCobravel, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { ATENDENTE_PECAS, BIPADORAS, MONTADORAS, nomeDe } from "@/apps/montagem/domain/equipe";
import { mensagemFechamento } from "@/apps/montagem/domain/mensagem-fechamento";
import { BK, N1, isoDia } from "@/apps/montagem/lib/format";
import { CampoDinheiro, CampoReais, rotuloPagamento } from "@/apps/montagem/mobile/campos";
import { Selo } from "@/apps/montagem/pages/AtendimentoInternoListagens";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { formatarDia, linksParaAcertoPorNome, meioDe } from "@/apps/montagem/domain/link-pagamento";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { avaliarKit, histDemoDe } from "@/apps/montagem/domain/revendedoras-internas";
import { chamar } from "@/apps/montagem/lib/api";
import { statusLinhaFin } from "@/apps/montagem/domain/atendimento-interno";
import { DESCONTO_BRINDE_ATRASO, TOLERANCIA_CHEGADA_MIN, tempoMaxEscolhaMin, textoAntesEscolha, textoFimEscolha } from "@/apps/montagem/domain/atendimento-interno";
import { e as eBase, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

// Kit 100% Prata: tudo que é dourado nesta tela vira prata. O `e` daqui troca as cores douradas pelas prateadas
// (classes e estilos) enquanto PRATA estiver ligado; as cores do tema (text-primary, bg-primary…) mudam pelas variáveis do tema.
// Classes prateadas que o Tailwind precisa gerar (não tirar): bg-[#CBD5E1] bg-[#CBD5E1]/10 bg-[#CBD5E1]/20 bg-[#CBD5E1]/25 from-[#64748B] ring-[#CBD5E1]/25 ring-[#CBD5E1]/30 ring-[#CBD5E1]/40 text-[#F1F5F9] to-[#F1F5F9] via-[#CBD5E1]
var PRATA = false;
var TROCA_PRATA = {E8B84B:"CBD5E1", B8862B:"64748B", F1E4C6:"F1F5F9"};
var PRATA_COR = "oklch(0.86 0.02 255)", PRATA_TXT = "oklch(0.2 0.02 255)";
var VARS_PRATA = {"--primary":PRATA_COR, "--color-primary":PRATA_COR, "--ring":PRATA_COR, "--color-ring":PRATA_COR, "--primary-foreground":PRATA_TXT, "--color-primary-foreground":PRATA_TXT};
var emPrata = function(t){ return typeof t==="string" ? t.replace(/E8B84B|B8862B|F1E4C6/g, function(m){ return TROCA_PRATA[m]; }) : t; };
function e(tipo, props){
  var args = arguments;
  if(PRATA && props && typeof props==="object" && !Array.isArray(props) && !props.$$typeof){
    var np = Object.assign({}, props);
    if(typeof np.className==="string") np.className = emPrata(np.className);
    if(np.style && typeof np.style==="object"){ var ns = {}; Object.keys(np.style).forEach(function(k){ ns[k] = emPrata(np.style[k]); }); np.style = ns; }
    args = Array.prototype.slice.call(arguments); args[1] = np;
  }
  return eBase.apply(null, args);
}

var QUEM_MONTA = [ATENDENTE_PECAS].concat(MONTADORAS);   // quem acompanha a revendedora na montagem do kit: Leci e as meninas da produção
var LANC_VAZIO = {forma:"", descricao:"", parcelas:1, data:isoDia(new Date()), valor:null, anexo:null};
var BRINDE_VAZIO = {cat:"normal", codigo:"", valor:null, origem:"nova"};
var COND_VAZIO = {numero:"", valor:null, pecas:"", vendidas:""};
var CP = INPUT+" h-10! w-full";                       // campo padrão: todos do mesmo tamanho
var CPD = CP+" text-right "+MONO;
var fmtData = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };
var din = function(n){ return BK(n); };
var PASSOS = [["cond","Condicionais"],["vendas","Vendas"],["pag","Pagamentos"],["brindes","Brindes"],["nova","Condicional nova"],["regras","Regras do consignado"]];

// Tile, Aviso, LinhaCampo, Secao, BotaoRemover (Remover) e TabelaSimples (Tab, Td) agora são peças de components/padrao-fin.js (01/11/2026, mesmo visual).
function Linha(p){
  return e("div",{className:"flex items-baseline justify-between gap-3 "+(p.topo ? "border-t border-border pt-2" : "")},
    e("span",{className:"text-[13px] "+(p.rotCor || "text-muted-foreground")}, p.rot),
    e("span",{className:MONO+" whitespace-nowrap font-bold "+(p.grande ? "text-[26px] leading-none" : "text-[15px]")+" "+(p.cor || "")}, p.val));
}
var TONS_REGRA = ["#E8B84B","#3B82F6","#EC4899","#22C55E","#8B5CF6","#F97316","#14B8A6","#EF4444"];
var iconeRegra = function(t){ var x = String(t).toLowerCase();
  return /prata/.test(x) ? "🥈" : /comiss/.test(x) ? "💰" : /deslocamento/.test(x) ? "🚗" : /remarca/.test(x) ? "📅" : /negocia/.test(x) ? "🤝" : /brinde|pr[eê]mio/.test(x) ? "🎁" : /kit novo/.test(x) ? "✨" : /pagamento|formas/.test(x) ? "💳" : /pe[cç]as/.test(x) ? "💎" : /m[ií]nimo/.test(x) ? "📈" : /agenda/.test(x) ? "🗓️" : /cancel|atraso/.test(x) ? "⏰" : /troca/.test(x) ? "🔄" : "📌"; };
var COLS_AGENDA = "grid-cols-[2.6rem_minmax(0,1fr)_3.2rem_4.4rem_3rem_3.2rem_1.6rem_3.4rem_3.4rem]";   // hora · nome · chegada · situação · início · espera · feito · bipou · atendeu
var horaAgora = function(){ var n = new Date(); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
var emMin = function(hhmm){ var p = String(hhmm||"").split(":"); return p.length===2 && p[0]!=="" ? Number(p[0])*60+Number(p[1]) : null; };
var minutosAtraso = function(hora, chegada){ var h = emMin(hora), c = emMin(chegada); return h===null || c===null ? 0 : Math.max(0, c-h); };   // minutos depois do horário marcado
var hhmmDeTs = function(ts){ var n = new Date(ts); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
var minutosEspera = function(chegada, inicio){ var c = emMin(chegada), i = emMin(inicio); return c===null || i===null ? null : Math.max(0, i-c); };   // quanto ela esperou até começar
// comprovante: foto vira JPEG pequeno (cabe no armazenamento do navegador); PDF só se for pequeno
var lerComprovante = function(arq, fim){
  if(!arq) return;
  if(arq.type.indexOf("image/")===0){ var img = new Image(), url = URL.createObjectURL(arq);
    img.onload = function(){ var k = Math.min(1, 900/Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); fim({nome:arq.name, url:c.toDataURL("image/jpeg", 0.6)}); };
    img.onerror = function(){ URL.revokeObjectURL(url); }; img.src = url; return; }
  if(arq.size>350*1024){ window.alert("Arquivo grande demais. Envie uma foto ou print do comprovante."); return; }
  var r = new FileReader(); r.onload = function(){ fim({nome:arq.name, url:r.result}); }; r.readAsDataURL(arq);
};
var onEnter = function(fn){ return function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); fn(); } }; };

// o conteúdo cresce junto com a largura disponível (muda quando o menu lateral abre ou fecha): a partir de 1500 px, até 1,5x
// 10/11/2026 (Marcus: "a tela está gigante, no admin normal é bem menor"): o zoom automático saiu; o tamanho é o padrão (13 px fixo) e quem quiser maior usa o botão de tamanho do sistema no topo.
var zoomDaLargura = function(){ return 1; };
// bloco com cabeçalho em degradê (mesmo padrão do BlocoBarra) que abre e fecha ao clicar; fechado, só sobra a barra
// Mesma revendedora duas vezes na fila (10/11/2026: Rian e Adryelle): o cadastro avulso nasceu em um computador e a funcionária, em outro, criou o segundo atendimento. Fica o mais adiantado (começou > aberto > criado pela agenda); cancelado só some se houver outro.
function dedupeRev(lista){
  var grupos = {}; lista.forEach(function(x){ if(x.revIntId){ (grupos[x.revIntId] = grupos[x.revIntId] || []).push(x); } });
  var pontos = function(x){ return (x.status==="acertado" ? 16 : 0)+(x.inicioTs ? 8 : 0)+(x.bipou ? 4 : 0)+(x.status==="cancelado" ? -32 : 0)+(String(x.id).indexOf("IRV")===0 ? 1 : 0); };
  var fora = {}; Object.keys(grupos).forEach(function(k){ var g = grupos[k]; if(g.length<2) return; var melhor = g.slice().sort(function(a,b){ return pontos(b)-pontos(a); })[0]; g.forEach(function(x){ if(x!==melhor) fora[x.id] = 1; }); });
  return lista.filter(function(x){ return !fora[x.id]; });
}
function BlocoRecolhivel(p){
  return e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("button",{type:"button", onClick:p.onToggle, "aria-expanded":p.aberto, "aria-label":(p.aberto ? "Fechar " : "Abrir ")+p.t,
      className:"relative flex w-full flex-col items-center px-11 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)] "+BARRAS[p.cor||"ouro"]},
      e("h2",{className:"font-heading text-[16px] font-bold leading-tight"}, p.t),
      p.sub && e("p",{className:"mt-0.5 text-[13px] font-medium opacity-85"}, p.sub),
      e("span",{"aria-hidden":true, className:"absolute right-3 top-1/2 -translate-y-1/2 text-[16px] font-bold"}, p.aberto ? "▾" : "▸")),
    p.aberto && p.children);
}

function AbaIntCalculadora(){
  var zs = useState(1), zoom = zs[0], setZoom = zs[1], ref = useRef(null);
  useEffect(function(){
    var pai = ref.current && ref.current.parentElement; if(!pai) return;
    var ajustar = function(){ setZoom(zoomDaLargura(pai.clientWidth-48)); };
    ajustar(); var ro = new ResizeObserver(ajustar); ro.observe(pai); return function(){ ro.disconnect(); };
  }, []);
  return e("div",{ref:ref, className:"flex flex-col gap-5", style:zoom>1 ? {zoom:zoom} : undefined}, e(AtendimentoInterno));
}
// Bloco no MEIO da tela com o aviso do tempo de escolha do kit, que a FUNCIONÁRIA LÊ EM VOZ ALTA para a revendedora. Só fecha no botão "Li para ela": o texto é para ser lido, não pulado.
function AvisoLeitura(p){
  return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3", role:"dialog", "aria-modal":"true", "aria-label":p.titulo},
    e("div",{className:"flex w-full max-w-[560px] flex-col gap-3 rounded-xl border border-[#E8B84B]/40 bg-[#131315] p-4"},
      e("b",{className:"text-[13px] text-[#E8B84B]"}, p.titulo),
      e("p",{className:"text-[13px] leading-relaxed"}, "“"+p.texto+"”"),
      e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
        p.onCancelar && e("button",{type:"button", onClick:p.onCancelar, className:"h-8 rounded-lg px-3 text-[13px] font-semibold ring-1 ring-[rgba(241,213,138,.3)] hover:bg-white/10"}, "Voltar"),
        e("button",{type:"button", onClick:p.onOk, className:"h-8 rounded-lg px-4 text-[13px] font-bold text-[#17110a]", style:{background:"linear-gradient(135deg,#F1D58A,#C9962F)"}}, p.botao))));
}

function AtendimentoInterno(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = isoDia(new Date());
  var dia = hoje;                                  // só a agenda de hoje aparece aqui (os outros dias ficam em Listagens)
  var af = useState(FORM_ACERTO_VAZIO), form = af[0], setForm = af[1];
  var bi = useState(BRINDE_VAZIO), brindeIn = bi[0], setBrindeIn = bi[1];
  var lv = useState(LANC_VAZIO), lancForm = lv[0], setLancForm = lv[1];
  var ng = useState(false), negociarAberto = ng[0], setNegociarAberto = ng[1];
  var rg = useState({isenta:false, motivo:""}), regForm = rg[0], setRegForm = rg[1];
  var ci = useState(false), ciente = ci[0], setCiente = ci[1];
  var cm = useState(COND_VAZIO), condManual = cm[0], setCondManual = cm[1];
  var cpx = useState(""), codProx = cpx[0], setCodProx = cpx[1];
  var mc = useState(null), msgCopiada = mc[0], setMsgCopiada = mc[1];
  var ma = useState(false), mAberto = ma[0], setMAberto = ma[1];                 // incluir atendimento à mão
  var mf = useState({nome:"", hora:"", cond:""}), mForm = mf[0], setMForm = mf[1];
  var ml = useState("padrao"), modLocal = ml[0], setModLocal = ml[1];             // kit mostrado na tabela quando ninguém está selecionada
  var vk = useState(null), verKit = vk[0], setVerKit = vk[1];                    // kit da tabela de comissões escolhido na barrinha (null = o da revendedora)
  var rk = useState({}), regrasOk = rk[0], setRegrasOk = rk[1];                  // regra por regra passada para a revendedora
  var bn = useState({codigo:"", valor:null}), bnIn = bn[0], setBnIn = bn[1];       // lançar brinde Normal
  var bb = useState({codigo:"", valor:null}), bbIn = bb[0], setBbIn = bb[1];       // lançar brinde Select (BB)
  var ar = useState("agora"), abaRegras = ar[0], setAbaRegras = ar[1];             // regras: passar agora ou ver o termo do mês anterior
  var rm = useState({}), regraMais = rm[0], setRegraMais = rm[1];                  // "ver mais" de cada regra
  var up = function(patch){ setForm(function(f){ return Object.assign({}, f, patch); }); };

  var internos = s.internos || [];
  var tk = useState(0), tick = tk[1];                       // faz o relógio da escolha do kit andar a cada segundo
  var aiS = useState(false), avisoIni = aiS[0], setAvisoIni = aiS[1];   // janela "leia antes de começar a escolher" (09/11/2026)
  var agenda = dedupeRev(internos.filter(function(x){ return x.data===dia; }).sort(function(a,b){ return (a.hora||"99").localeCompare(b.hora||"99"); }));
  var sel = internos.find(function(x){ return x.id===s.intSel; }) || null;
  useEffect(function(){ if(!(sel && sel.escolhaIni && !sel.escolhaFim)) return; var i = setInterval(function(){ tick(function(n){ return n+1; }); }, 1000); return function(){ clearInterval(i); }; },
    [sel ? sel.id : null, sel ? sel.escolhaIni : null, sel ? sel.escolhaFim : null]);
  useEffect(function(){
    setForm(FORM_ACERTO_VAZIO); setBrindeIn(BRINDE_VAZIO); setLancForm(LANC_VAZIO); setNegociarAberto(false); setRegForm({isenta:false, motivo:""});
    setCiente(false); setRegrasOk({}); setBnIn({codigo:"", valor:null}); setBbIn({codigo:"", valor:null}); setAbaRegras("agora"); setRegraMais({});
    if(sel && sel.status==="acertado" && sel.formSnapshot) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.formSnapshot));
    else if(sel && sel.rascunho) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.rascunho));   // volta de onde parou (ex.: esperando o financeiro confirmar)
    else if(sel && sel.vendaApp>0) setForm(Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:sel.vendaApp}));   // o valor vendido vem direto do app da revendedora
  }, [sel ? sel.id : null]);
  // guarda o que a funcionária já preencheu deste atendimento (se sair da tela ou atender outra pessoa, ao voltar está tudo lá)
  useEffect(function(){ if(!sel || visor || form===FORM_ACERTO_VAZIO || sel.status==="acertado") return; d({type:"INT_ATUALIZAR", id:sel.id, patch:{rascunho:form}}); }, [form]);
  useEffect(function(){ setVerKit(null); }, [sel ? sel.id : null, sel ? sel.nome : null]);
  // agenda e tabela do kit ficam à direita em dropdown; ao iniciar um atendimento os dois fecham (dá para abrir de novo)
  var ga = useState(true), agendaAberta = ga[0], setAgendaAberta = ga[1];
  var gk = useState(true), kitAberto = gk[0], setKitAberto = gk[1];
  useEffect(function(){ if(sel && sel.inicioTs){ setAgendaAberta(false); setKitAberto(false); } }, [sel ? sel.id : null, sel ? !!sel.inicioTs : false]);
  var rs = useState(0), regraSel = rs[0], setRegraSel = rs[1];                     // regra aberta na estação Regras
  var pq = useState(false), popAt = pq[0], setPopAt = pq[1];
  var po = useState(false), popObs = po[0], setPopObs = po[1];     // ícone de avisos ao lado do nome
  var cnv = useState(false), condNovaAberta = cnv[0], setCondNovaAberta = cnv[1];     // linha de condicional à mão (abre no botão +)
  var ps =useState(0), passoAt = ps[0], setPassoAt = ps[1];                       // etapa aberta (uma de cada vez)
  var ta = useState("comissao"), apoioAba = ta[0], setApoioAba = ta[1];           // aba do bloco de apoio: Comissões, Valor do kit ou Regras
  useEffect(function(){ setPassoAt(sel && sel.inicioTs && sel.condOk ? 1 : 0); }, [sel ? sel.id : null]);   // abre na etapa em que parou
  useEffect(function(){ if(sel && sel.atrasoDias!=null) up({atrasoDias:Number(sel.atrasoDias)||0}); }, [sel ? sel.id : null, sel ? sel.atrasoDias : null]);   // dias de atraso: quem preenche é a Tamara (agendamento)

  var formas = (s.formasPagamento || formasPagamentoPadrao()).filter(function(f){ return f.k!=="pix_representante"; });   // sem representante no atendimento interno
  var formaDe = function(k){ return formas.find(function(f){return f.k===k;}) || {k:k, label:k, parcelas:false, descricoes:[]}; };
  var modalidade = sel ? modalidadeDe(s, sel.nome) : "padrao", ehPrata = modalidade==="prata";
  var especialRev = sel ? comissaoEspecialDe(s, sel.nome) : null;   // comissão especial da revendedora (ficha em Revendedoras internas; Edna, 09/11/2026): muda só a % de comissão, brindes iguais
  var versaoBase = sel ? ((s.regrasConsignado.versoes||[]).find(function(v){ return v.id===sel.regrasVersaoId; }) || versaoVigente(s)) : null;
  var remarcs = sel ? (sel.remarcacoesLista||[]) : [];
  var condicionais = sel ? (sel.condicionais||[]) : [];
  // atendimento interno: toda condicional lançada na tela vale como conferida (a funcionária digita número, valor e peças à mão)
  var vendasAntD = (sel && sel.vendasAnt) || [null, null];   // [anterior, mais antiga]; a média das regras novas quer da mais antiga para a mais nova
  var formD = Object.assign({}, form, {vendasAnteriores:[vendasAntD[1], vendasAntD[0]], condicionaisSelecionadas: condicionais.map(function(c){ return c.numero; }), pecasVendidas: (sel && sel.vendidasTotal!=null ? sel.vendidasTotal : condicionais.reduce(function(t,c){ return t+(c.vendidas||0); }, 0)) || null});
  var atrasoChegada = sel ? minutosAtraso(sel.hora, sel.chegada) : 0, chegouMuitoAtrasada = atrasoChegada>TOLERANCIA_CHEGADA_MIN;
  var fatorBrindeAtraso = chegouMuitoAtrasada ? 1-DESCONTO_BRINDE_ATRASO : 1;
  var dv = derivarAcerto({finalizado:!!(sel && sel.status==="acertado"), brindeFator:fatorBrindeAtraso, versaoBase:versaoBase, modalidade:modalidade, especial:especialRev, vez:vezCobravel(remarcs), form:formD, condicionais:condicionais, semTaxa:true, dividaAnterior:sel ? totalDividaAnterior(s.acertosConsignado, sel.nome) : 0});   // atendimento interno: sem taxa de deslocamento
  var pa = dv.previaAcerto, versao = dv.versao, pxm = dv.pecasProx;
  // dívida de acerto ANTERIOR (Marcus, 09/11/2026, regra A): aparece assim que o atendimento abre, antes de lançar a venda; o que ela pagar quita primeiro a dívida mais antiga
  var avisoDivida = dv.dividaAnterior>0 ? "Dívida anterior de "+din(dv.dividaAnterior)+": o que ela pagar quita primeiro a dívida antiga"+(dv.abateDivida>0 ? " ("+din(dv.abateDivida)+" já abatidos)." : ".") : "";
  var jaFeito = !!sel && sel.status==="acertado";
  // venda R$ 0,00 é permitida (botão "Não teve venda"): 0 sozinho não basta, precisa do aviso explícito (form.semVenda)
  // Kit retornando (Marcus, 10/11/2026): é como kit novo; não tem etapas de acerto. Fluxo curto: Escolha do kit (60 min) → Regras → finalizar (ninguém assina nada no sistema, 11/11/2026)
  var simples = !!sel && (sel.tipo==="indicacao" || sel.tipo==="reposicao" || sel.tipo==="troca");   // Brinde de indicação, Reposição e Troca de peça (Marcus, 11/11/2026): atendimento simples, sem acerto, sem escolha de kit
  var retornando = !!sel && (sel.tipo==="retornando" || sel.tipo==="kit_novo");   // fluxo curto: Kit retornando e Kit novo (Marcus, 10/11/2026: kit novo precisa de outra tela; a revendedora já assina a condicional, então não assina aqui)
  var temVenda = retornando || simples || form.vendaBruta>0 || form.semVenda===true;
  var semVendaOk = !!sel && !retornando && !simples && form.semVenda===true;   // venda R$ 0,00 (Marcus, 11/11/2026): não renova kit; a revendedora não passa as regras nem assina; só finalizar
  // Kit novo: o valor do kit é o que a Michele lançou nos Kits novos (módulo kn, pelo nome da revendedora); aparece como valor liberado (Marcus, 10/11/2026)
  var normNome = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
  var knDela = sel && sel.tipo==="kit_novo" ? (Object.keys(s.kn||{}).map(function(k){ return s.kn[k]; }).filter(function(x){ return x && x.nome && normNome(x.nome)===normNome(sel.nome); }).sort(function(a,b){ return String(b.cadastro||"").localeCompare(String(a.cadastro||"")); })[0] || null) : null;
  var valorKitNovo = knDela && knDela.valor>0 ? knDela.valor : 0;
  // Só acompanhar (10/11/2026, Marcus: "se eu clicar na aba posso ver o atendimento em tempo real"): atendimento que OUTRA pessoa começou abre somente leitura e acompanha o que ela preenche
  var quemAtende = sel ? (sel.iniciadoPor || (((s.lancFin||[]).find(function(l){ return l.internoId===sel.id; })||{}).por) || "") : "";
  var visor = !!sel && !jaFeito && !!quemAtende && String(quemAtende).split(" ")[0]!==String(nomeDe(s.usuario)).split(" ")[0];
  // média das vendas: venda de agora (vem da tela) + até 2 anteriores digitadas; divide pelas que existem. Só a venda de agora = ela é a média.
  var cfg = s.cfg || {}, estoqueAtivo = cfg.tabelaAtiva==="baixo" ? "baixo" : "alto";
  var MESES_CURTO = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  var tabKit = ((estoqueAtivo==="baixo" ? cfg.tabelaKitBaixo : cfg.tabelaKit) || []).slice().sort(function(a,b){ return b.min-a.min; });
  var vendasAnt = (sel && sel.vendasAnt) || [null, null];
  // histórico de vendas da revendedora (aba Revendedoras): média dos últimos 5 meses, mínimo R$ 500, duas seguidas abaixo de R$ 500 bloqueiam
  var rInt = sel ? (s.revInternas||[]).find(function(r){ return r.id===sel.revIntId || r.nome===sel.nome; }) : null;
  var temHist = !!rInt && rInt.hist.some(function(h){ return h.data && h.venda>0; });
  var histFallback = vendasAnt.map(function(v, i){ var dt = new Date(hoje+"T12:00:00"); dt.setMonth(dt.getMonth()-(i+1)); return {data:dt.toISOString().slice(0,10), venda:v}; });
  var temAnt = vendasAnt.some(function(v){ return v>0; });
  var avKit = avaliarKit(temHist ? rInt.hist : temAnt ? histFallback : (sel ? histDemoDe(sel.nome) : histFallback), form.vendaBruta, cfg, hoje.slice(0,7));   // toda revendedora tem vendas anteriores para a média
  var vendasMedia = avKit.lista;
  var mediaVendas = avKit.media;
  var faixaKit = avKit.liberado ? tabKit.find(function(x){ return mediaVendas>=x.min; }) : null;
  var kitLiberado = faixaKit ? faixaKit.kit : null;
  // Kit retornando (Marcus, 10/11/2026): média das 3 últimas vendas da revendedora = valor do kit. Só dado REAL: DevMaster (rota /vendas) ou histórico da agenda; nunca o histórico de demonstração
  var codDm = rInt && rInt.devmaster ? String(rInt.devmaster) : (sel && sel.devmaster ? String(sel.devmaster) : "");
  var histRet = sel && sel.tipo==="retornando" ? (sel.vendasDm && sel.vendasDm.length ? sel.vendasDm.map(function(x){ return {data:x.d, venda:x.v}; }) : (temHist ? rInt.hist : null)) : null;
  var avRet = histRet ? avaliarKit(histRet, null, cfg, hoje.slice(0,7)) : null;
  var kitRet = avRet && avRet.liberado ? ((tabKit.find(function(x){ return avRet.media>=x.min; }) || {}).kit || null) : null;
  // média acima do limite do Marcus: não aparece aviso na tela, vai alerta direto para quem estiver em Tecnologia → Avisos (uma vez por atendimento)
  useEffect(function(){
    if(sel && !jaFeito && mediaVendas!==null && cfg.limiteMarcus && mediaVendas>cfg.limiteMarcus)
      d({type:"ALERTA_ADD", tipo:"media_alta", chave:"media_alta:"+sel.id, ref:sel.id, titulo:"Média de vendas acima de "+BK(cfg.limiteMarcus), texto:sel.nome+" · média "+BK(mediaVendas)});
  }, [sel ? sel.id : null, mediaVendas, cfg.limiteMarcus]);
  var modTab = sel ? modalidade : modLocal;                                       // kit da tabela de comissões = kit escolhido no topo
  PRATA = modTab==="prata";
  var escolherMod = function(m){ if(sel && !jaFeito){ if(m!==modalidade) d({type:"SET_MODALIDADE", chave:sel.nome, modalidade:m, por:nomeDe(s.usuario), origem:"interno"}); } else setModLocal(m); };

  // ── Agenda de hoje (só hoje): hora, nome, quando começou, quem bipou e se levou kit novo ──
  var abasUI = (s.intAbas||[]).concat(sel && (s.intAbas||[]).indexOf(sel.id)<0 ? [sel.id] : []).map(function(id){ return internos.find(function(x){ return x.id===id; }); }).filter(Boolean).slice(0,2);
  var feitosDia = agenda.filter(function(x){ return x.status==="acertado"; }).length;
  var primeiro = function(n){ return (n||"").split(" ")[0]; };
  var doisNomes = function(n){ return (n||"").split(" ").filter(function(w){ return !/^(d[aeo]s?|e)$/i.test(w); }).slice(0,2).join(" "); };
  // primeiro e segundo nome ("Maria de Fátima Souza" → "Maria de Fátima"; ligação "de/da/do..." não conta como nome)
  var doisNomes = function(n){ var p = String(n||"").trim().split(/\s+/).filter(Boolean), lig = /^(d[aeo]s?|e)$/i;
    if(p.length<=1) return p.join(" ");
    var fim = 2; if(lig.test(p[1]) && p.length>2) fim = 3;
    return p.slice(0, fim).join(" "); };
  // a funcionária da listagem pode errar: aqui dá para incluir alguém na agenda de hoje à mão
  var manualOk = mForm.nome.trim().length>=3;
  var addManual = function(){ if(!manualOk) return;
    var cs = mForm.cond.split(/[^0-9]+/).filter(function(x){ return x.length>=3; }).map(function(n){ return {numero:n, pecas:0}; });
    d({type:"INT_ADD", nome:mForm.nome, fone:"", devmaster:"", data:hoje, hora:mForm.hora, condicionais:cs, obs:"Incluída à mão na Atendimento Sorelly", modalidade:modalidadeDe(s, mForm.nome.trim()), por:nomeDe(s.usuario)});
    setMForm({nome:"", hora:"", cond:""}); setMAberto(false); };
  // tabela de comissões da modalidade escolhida lá em cima; dá para abrir a do outro kit também
  var tabelaComissao = function(mod){
    var vb = versaoBase || versaoVigente(s), ve = vb ? versaoEfetiva(vb, mod, especialRev) : null; if(!ve) return null;
    var faixas = ve.faixas.slice().sort(function(a,b){ return a.min-b.min; });
    var corTab = mod==="prata" ? "#64748B" : "#B8862B";
    return e("div",{key:mod, className:"overflow-hidden rounded-xl ring-1", style:{boxShadow:"0 0 0 1px "+corTab+"66", background:corTab+"12"}},
      ve.comissaoEspecial && e("div",{className:"px-2 py-1 text-center text-[13px] font-bold text-warning"}, "Comissão especial desta revendedora (os brindes seguem a tabela normal)"),
      e("table",{className:"w-full border-collapse text-center"},
        e("thead",null, e("tr",null, ["Venda a partir de","Comissão","Brinde normal","Brinde select"].map(function(t){ return e("th",{key:t, className:"border-b border-r border-border/60 px-1.5 py-1.5 text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground last:border-r-0"}, t); }))),
        e("tbody",null, faixas.map(function(f,i){
          return e("tr",{key:i, className:"border-b border-border/40 last:border-0"},
            e("td",{className:"border-r border-border/40 px-1.5 py-1 text-[13px] "+MONO}, din(f.min)), e("td",{className:"border-r border-border/40 px-1.5 py-1 text-[13px] font-bold text-success "+MONO}, f.pct+"%"),
            e("td",{className:"border-r border-border/40 px-1.5 py-1 text-[13px] "+MONO}, f.bn>0 ? din(f.bn) : "—"), e("td",{className:"px-1.5 py-1 text-[13px] "+MONO}, f.bb>0 ? din(f.bb) : "—")); }))));
  };
  var kitVisto = verKit || modTab;
  // barras em degradê: douradas no Kit Normal, prateadas quando o Kit 100% Prata está escolhido
  var GRAD_BARRA = modTab==="prata" ? "bg-linear-to-r from-[#64748B] via-[#CBD5E1] to-[#F1F5F9]" : "bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6]";
  var COR_BARRA = modTab==="prata" ? "#CBD5E1" : "#E8B84B";
  var barraKits = e("div",{className:"relative grid min-w-0 flex-1 grid-cols-2 "+GRAD_BARRA+" p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]", role:"group", "aria-label":"Tabela de comissão do kit"},
    e("span",{"aria-hidden":true, className:"absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#1B1409] transition-transform duration-300 ease-out "+(kitVisto==="prata" ? "translate-x-full" : ""), style:{boxShadow:"0 2px 8px rgba(0,0,0,.35)"}}),
    [["padrao","KIT NORMAL"],["prata","KIT 100% PRATA"]].map(function(o){ var on = kitVisto===o[0];
      return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ setVerKit(o[0]); },
        className:"relative z-10 h-9 rounded-lg text-[13px] font-extrabold tracking-wide transition-colors "+(on ? "text-[#F1E4C6]" : "text-[#1B1409]/80 hover:text-[#1B1409]")}, o[1]); }));
  // valor do kit: a tabela em uso hoje (estoque alto ou baixo, definida no Configurador), destaca a faixa da média
  var faixaKitTxt = function(i, x){ return i===0 ? BK(x.min)+" ou mais" : x.min===0 ? "abaixo de "+BK(tabKit[i-1].min) : BK(x.min)+" a "+BK(tabKit[i-1].min-0.01); };
  var blocoValorKit = e("div",{className:"overflow-hidden rounded-xl ring-1 ring-[#E8B84B]/40"},
    e("div",{className:GRAD_BARRA+" px-3 py-2 text-center text-[13px] font-bold text-[#1B1409]"}, "Valor do kit · estoque "+estoqueAtivo),
    e("table",{className:"w-full border-collapse text-center"},
      e("thead",null, e("tr",null, ["Média das vendas","Kit liberado"].map(function(h){ return e("th",{key:h, className:"border-b border-border/60 px-1.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"}, h); }))),
      e("tbody",null, tabKit.map(function(x,i){ var on = faixaKit && faixaKit.min===x.min;
        return e("tr",{key:i, className:"border-b border-border/40 last:border-0 "+(on ? "bg-primary/20 font-bold" : "")},
          e("td",{className:"px-1.5 py-1 text-[13px] "+MONO}, faixaKitTxt(i,x)), e("td",{className:"px-1.5 py-1 text-[13px] font-bold text-primary "+MONO}, BK(x.kit))); }))));
  var seletorKit = e("div",{className:"grid grid-cols-2 gap-1 rounded-xl bg-card p-1 ring-1 ring-[#E8B84B]/30", role:"group", "aria-label":"Kit da revendedora"},
    [["padrao","Kit Normal"],["prata","Kit 100% Prata"]].map(function(o){ var on = modTab===o[0];
      return e("button",{key:o[0], type:"button", onClick:function(){ escolherMod(o[0]); }, "aria-pressed":on, disabled:!!sel && jaFeito,
        className:"h-8 rounded-lg px-2 text-[13px] font-bold disabled:opacity-60 "+(on ? (o[0]==="prata" ? "bg-slate-500 text-white" : "bg-primary text-primary-foreground") : "text-muted-foreground hover:bg-muted/60")}, (on ? "✓ " : "")+o[1]); }));
  var colAgenda = e("aside",{className:"flex flex-col gap-3"},
    // a agenda de hoje fica em Listagens (Atender abre aqui); nesta coluna só a tabela do kit
    // tabela de comissões: barrinha deslizante Kit Normal / Kit 100% Prata (começa no kit da revendedora)
    // a barrinha deslizante é o cabeçalho do bloco (encostada, igual à da agenda) e tem botão para fechar/abrir
    e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
      e("div",{className:"flex items-stretch"}, barraKits,
        e("button",{type:"button", onClick:function(){ setKitAberto(!kitAberto); }, "aria-expanded":kitAberto, "aria-label":kitAberto ? "Fechar a tabela do kit" : "Abrir a tabela do kit",
          className:"grid w-11 shrink-0 place-items-center text-[16px] font-bold text-[#1B1409] shadow-[inset_0_1px_0_rgba(255,255,255,.35)] "+GRAD_BARRA}, kitAberto ? "▾" : "▸")),
      kitAberto && e("div",{className:"flex flex-col gap-2 p-2"}, tabelaComissao(kitVisto), blocoValorKit)));

  // ── Tela nova (29/10/2026): fila do dia à esquerda, comissões / valor do kit / regras embaixo dela, atendimento à direita ──
  var virtuaisHoje = (s.revInternas||[]).filter(function(r){ return r.agend && r.agend.data===hoje && !agenda.some(function(x){ return x.id===r.internoId || x.id==="IRV"+r.id || x.revIntId===r.id; }); })
    .map(function(r){ return {id:"IRV"+r.id, revId:r.id, virtual:true, nome:r.nome, hora:r.agend.hora, status:"agendado"}; });
  var listaDia = agenda.concat(virtuaisHoje).sort(function(a,b){ return (a.hora||"99").localeCompare(b.hora||"99"); });
  var feitosHoje = listaDia.filter(function(x){ return x.status==="acertado"; }).length;
  var itemFila = function(x){
    var on = !!sel && sel.id===x.id, feito = x.status==="acertado";
    var lfDe = (s.lancFin||[]).find(function(l){ return l.internoId===x.id; });   // 10/11/2026: o pedido de pagamento que a atendente já mandou prova que o atendimento está em andamento (vale também para tela antiga, que não manda o atendimento)
    var canc = x.status==="cancelado";
    var st = canc ? ["Cancelada","bg-destructive/20 text-destructive"] : feito ? ["Feita","bg-success/20 text-success"] : (on || !!x.inicioTs || !!lfDe) ? ["Atendendo"+(lfDe && lfDe.por ? " · "+String(lfDe.por).split(" ")[0] : ""),"bg-primary/25 text-primary"] : (x.bipou && !x.chegada) ? ["Aberta · "+String(x.bipou).split(" ")[0],"bg-warning/20 text-warning"] : x.chegada ? ["Chegou","bg-warning/20 text-warning"] : ["Agendada","bg-info/15 text-info"];
    return e("button",{key:x.id, type:"button", onClick:function(){ if(canc) return; if(x.virtual) d({type:"REVINT_ATENDER", id:x.revId, internoId:x.id}); d({type:"INT_ABRIR", id:x.id}); },
      className:"flex h-8 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] ring-1 "+(on ? "bg-primary/15 ring-primary" : "bg-muted/30 ring-border hover:bg-muted/50")},
      e("b",{className:"w-12 shrink-0 text-primary "+MONO}, x.hora || "—"),
      e("span",{className:"min-w-0 flex-1 truncate font-semibold", title:x.nome}, doisNomes(x.nome)),
      !feito && totalDividaAnterior(s.acertosConsignado, x.nome)>0.009 && e("span",{className:"shrink-0 rounded-md bg-destructive/20 px-2 py-1 text-[11px] font-bold text-destructive", title:"Dívida de acerto anterior: o pagamento quita primeiro essa dívida"}, "Dívida "+din(totalDividaAnterior(s.acertosConsignado, x.nome))),
      e("span",{className:"shrink-0 rounded-md px-2 py-1 text-[11px] font-bold "+st[1]}, st[0]));
  };
  var CABEC = "flex h-8 items-center justify-between gap-2 bg-linear-to-r from-primary/75 via-primary/30 to-primary/60 px-3 text-[13px] font-semibold";
  var filaDia = e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:CABEC}, e("h2",{className:"text-[13px] font-semibold"}, "Hoje · "+hoje.split("-").reverse().slice(0,2).join("/")), e("span",{className:"text-[13px] font-bold"}, feitosHoje+" de "+listaDia.filter(function(x){ return x.status!=="cancelado"; }).length+" feitos")),
    e("div",{className:"flex flex-col gap-1 p-2"},
      listaDia.length ? listaDia.map(itemFila) : e("p",{className:"py-3 text-center text-[13px] text-muted-foreground"}, "Ninguém na agenda de hoje.")));
  var vApoio = versaoBase || versaoVigente(s);
  var regrasApoio = vApoio ? textoRegras(vApoio, modalidade).filter(function(r){ return !/deslocamento|pe[cç]as/i.test(r.t); }) : [];
  var listaRegras = e("ul",{className:"flex flex-col gap-1.5 p-2.5 text-[13px] leading-snug"}, regrasApoio.map(function(r,i){ return e("li",{key:i, className:"flex gap-2"}, e("span",{className:"shrink-0 font-bold text-primary"}, (i+1)+"."), e("span",null, r.t)); }));
  var apoioTabs = e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:"grid grid-cols-3 gap-1 p-1 "+GRAD_BARRA, role:"tablist"}, [["comissao","Comissões"],["kit","Valor do kit"],["regras","Regras"]].map(function(o){ var on = apoioAba===o[0];
      return e("button",{key:o[0], type:"button", role:"tab", "aria-selected":on, onClick:function(){ setApoioAba(o[0]); }, className:"h-8 rounded-lg text-[13px] font-extrabold "+(on ? "bg-[#1B1409] text-[#F1E4C6]" : "text-[#1B1409]/80 hover:text-[#1B1409]")}, o[1]); })),
    apoioAba==="comissao" ? e("div",{className:"p-2"}, tabelaComissao(kitVisto)) : apoioAba==="kit" ? e("div",{className:"p-2"}, blocoValorKit) : listaRegras);
  var pagina = function(centro){
    return e("div",{className:"-mx-3 -mt-3 grid grid-cols-1 items-start gap-3 xl:grid-cols-[23rem_minmax(0,1fr)]"},
      e("div",{className:"flex min-w-0 flex-col gap-3"}, filaDia, apoioTabs), centro);
  };

  // Fica antes do "if(!sel) return": hook depois de um return condicional muda a ordem dos hooks e derruba a tela (erro #300 do React) ao fechar a aba do atendimento.
  useEffect(function(){ if(sel && !jaFeito && !sel.bipou && !visor) d({type:"INT_ATUALIZAR", id:sel.id, patch:{bipou:nomeDe(s.usuario)}}); }, [sel ? sel.id : null, visor]);
  useEffect(function(){ if(visor && sel) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.rascunho||{})); }, [visor, sel ? JSON.stringify(sel.rascunho||{}) : ""]);
  // Kit retornando: busca as 3 últimas vendas na DevMaster uma vez e guarda no atendimento
  useEffect(function(){
    if(!sel || sel.tipo!=="retornando" || visor || sel.vendasDm || sel.vendasDmErro || !codDm) return;
    chamar("GET", "/revendedoras/"+encodeURIComponent(codDm)+"/vendas").then(function(j){ var v = (j && Array.isArray(j.vendas)) ? j.vendas.slice(0, 3) : []; d({type:"INT_ATUALIZAR", id:sel.id, patch: v.length ? {vendasDm:v} : {vendasDmErro:true}}); }).catch(function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendasDmErro:true}}); });
  }, [sel ? sel.id : null, sel ? sel.tipo : null, codDm, visor]);   // acompanha ao vivo o que a atendente preenche
  if(!sel) return e("div",{className:"contents", style:PRATA ? VARS_PRATA : undefined},
    pagina(e("div",{className:"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-16 text-center text-[13px] text-muted-foreground"},
      "Nenhum atendimento aberto.", e("span",{className:"font-semibold text-foreground"}, "Escolha o nome da cliente na fila do dia."))));

  // ── 1 · Condicionais: SÓ número, valor e quantidade de peças, tudo digitado à mão pela funcionária ──
  var condsSel = formD.condicionaisSelecionadas;
  var setConds = function(lista){ if(jaFeito) return; d({type:"INT_ATUALIZAR", id:sel.id, patch:{condicionais:lista}}); };
  var editCond = function(i, patch){ setConds(condicionais.map(function(c,j){ return j===i ? Object.assign({}, c, patch) : c; })); };
  var condOk = condManual.numero.length>=3 && !condicionais.some(function(c){ return c.numero===condManual.numero; });
  var addCond = function(){ if(!condOk || jaFeito) return;
    setConds(condicionais.concat([{numero:condManual.numero, valor:condManual.valor||0, pecas:Number(condManual.pecas)||0}])); setCondManual(COND_VAZIO); };
  // peças vendidas: UM total só, no fim (a funcionária junta as condicionais); sem total digitado vale a soma por condicional dos dados antigos de demonstração
  var totalCondValor = condicionais.reduce(function(t,c){ return t+(c.valor||0); }, 0), totalCondPecas = condicionais.reduce(function(t,c){ return t+(c.pecas||0); }, 0);
  var totalVendidas = sel.vendidasTotal!=null ? sel.vendidasTotal : condicionais.reduce(function(t,c){ return t+(c.vendidas||0); }, 0);
  var GRID_COND = "grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_4.2rem_1.75rem] items-center gap-1.5";
  var CPK = CP+" h-8! text-[20px]! font-medium! "+MONO;   // mesma altura dos campos de Vendas e Desconto crédito
  var soDigitos = function(t, n){ return t.replace(/\D/g,"").slice(0,n); };
  // tudo centralizado: Nº · Valor · Peças; o total de peças vendidas fica uma vez só, embaixo
  var CC = " text-center! ";
  // devolução: peças das condicionais − vendidas (a maleta não entra na conta)
  var pecasRetornar = Math.max(0, totalCondPecas - totalVendidas);
  var linhaCond = function(rotulo, campo){ return e("div",{className:GRID_COND}, e("span",{className:"col-span-2 text-right text-[13px] font-semibold"}, rotulo), campo, e("span")); };
  var pCond =e(React.Fragment,null,
    e("div",{className:GRID_COND+" h-[30px] rounded-md bg-white/10 px-1 text-center text-[11px] font-medium uppercase tracking-[.05em] text-foreground"},
      e("span",null,"Nº"), e("span",null,"Valor"), e("span",null,"Peças"), e("span")),
    condicionais.map(function(c,i){
      return e("div",{key:i, className:GRID_COND},
        e("input",{value:c.numero, disabled:jaFeito, inputMode:"numeric", "aria-label":"Número da condicional "+(i+1), className:CPK+CC+MONO, onChange:function(ev){ editCond(i,{numero:soDigitos(ev.target.value,8)}); }}),
        e(CampoDinheiro,{value:c.valor, disabled:jaFeito, label:"Valor da condicional "+(i+1), className:CPK+CC+MONO, onChange:function(v){ editCond(i,{valor:v||0}); }}),
        e("input",{value:c.pecas>0 ? c.pecas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Peças da condicional "+(i+1), className:CPK+" px-1! "+CC+MONO, onChange:function(ev){ editCond(i,{pecas:Number(soDigitos(ev.target.value,4))||0}); }}),
        jaFeito ? e("span") : e(Remover,{label:"Remover condicional "+c.numero, onClick:function(){ setConds(condicionais.filter(function(x,j){ return j!==i; })); }})); }),
    !jaFeito && e("div",{className:GRID_COND+" border-t border-border/50 pt-1.5"},
      e("input",{value:condManual.numero, inputMode:"numeric", placeholder:"Nº", "aria-label":"Número da nova condicional", className:CPK+CC+MONO, onKeyDown:onEnter(addCond), onChange:function(ev){ setCondManual(Object.assign({}, condManual, {numero:soDigitos(ev.target.value,8)})); }}),
      e(CampoDinheiro,{value:condManual.valor, label:"Valor da nova condicional", className:CPK+CC+MONO, onChange:function(v){ setCondManual(Object.assign({}, condManual, {valor:v})); }}),
      e("input",{value:condManual.pecas, inputMode:"numeric", placeholder:"0", "aria-label":"Peças da nova condicional", className:CPK+" px-1! "+CC+MONO, onKeyDown:onEnter(addCond), onChange:function(ev){ setCondManual(Object.assign({}, condManual, {pecas:soDigitos(ev.target.value,4)})); }}),
      e("button",{type:"button", disabled:!condOk, onClick:addCond, "aria-label":"Adicionar condicional", className:"grid size-7 place-items-center rounded-full bg-primary text-base font-bold text-primary-foreground disabled:opacity-40"},"+")),
    condicionais.length>0 && e("div",{className:GRID_COND+" border-t border-border/50 pt-1.5 text-center text-[13px] font-medium"},
      e("span",{className:"text-[13px]"},"Total"), e("span",{className:MONO+" text-[20px] text-primary"}, din(totalCondValor)), e("span",{className:MONO+" text-[20px]"}, totalCondPecas), e("span")),
    // fechamento das condicionais: total vendido (ela digita), peças que precisam voltar (calculado, a maleta conta como 1 peça) e observação
    e("div",{className:"flex flex-col gap-2 rounded-lg bg-black/20 p-2.5"},
      linhaCond("Peças vendidas (total)",
        e("input",{value:totalVendidas>0 ? totalVendidas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Total de peças vendidas das condicionais", className:CPK+" w-full! px-1! "+CC+MONO,
          onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendidasTotal:Number(soDigitos(ev.target.value,4))||0}}); }})),
      e("div",{className:"flex flex-col items-center gap-0.5 border-t border-border/50 pt-2 text-center"},
        e("span",{className:"text-[13px] font-semibold"}, "Peças que devem retornar"),
        e("b",{className:MONO+" text-[20px] font-medium leading-tight text-primary", "aria-label":"Peças que devem retornar"}, totalCondPecas>0 ? pecasRetornar : "—"))));

  // ── Média das últimas vendas e valor do kit (mesma tabela da Calculadora de kits) ──
  var setVendaAnt = function(i, v){ if(jaFeito) return; var o = [vendasAnt[0]||null, vendasAnt[1]||null]; o[i] = v; d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendasAnt:o}}); };
  var linhaMedia = function(nome, campo){ return e(LinhaCampo,{key:nome, nome:nome}, campo); };
  var avisoMedia = mediaVendas!==null && cfg.limiteAnaliseVendas && mediaVendas>cfg.limiteAnaliseVendas ? "Média acima de "+BK(cfg.limiteAnaliseVendas)+": obrigatório mandar a análise de vendas" : null;
  var blocoMedia = e("section",{className:"flex min-w-0 flex-col gap-2.5 rounded-lg border border-foreground/25 bg-card/60 p-4"},
    e("h2",{className:"text-[13px] font-semibold"}, "Média das vendas e valor do kit"),
    linhaMedia("Venda atual", e("input",{readOnly:true, value:form.vendaBruta>0 ? din(form.vendaBruta) : "", placeholder:"vem de Vendas", "aria-label":"Venda atual", className:CP+" text-[17px]! text-center! "+MONO+" text-primary!"})),
    temHist
      ? vendasMedia.filter(function(x){ return !x.atual; }).map(function(x){ return linhaMedia(MESES_CURTO[+x.mes.slice(5,7)-1]+"/"+x.mes.slice(2,4), e("input",{readOnly:true, value:din(x.venda), "aria-label":"Venda de "+x.mes, className:CP+" text-[17px]! text-center! "+MONO+" text-white!"})); })
      : [linhaMedia("Venda anterior", e(CampoDinheiro,{key:"a0", value:vendasAnt[0], disabled:jaFeito, label:"Venda anterior", className:CP+" text-[17px]! text-center! "+MONO+" text-white!", onChange:function(v){ setVendaAnt(0, v); }})),
         linhaMedia("Venda mais antiga", e(CampoDinheiro,{key:"a1", value:vendasAnt[1], disabled:jaFeito, label:"Venda mais antiga", className:CP+" text-[17px]! text-center! "+MONO+" text-white!", onChange:function(v){ setVendaAnt(1, v); }}))],
    e("div",{className:"flex flex-col items-center gap-0.5 border-t border-foreground/25/50 pt-2 text-center"},
      e("span",{className:"text-[13px] font-semibold"}, "Média ("+vendasMedia.length+(vendasMedia.length===1 ? " venda" : " vendas")+" · até "+avKit.nMeses+")"), e("b",{className:MONO+" text-[20px] text-primary"}, mediaVendas!==null ? din(mediaVendas) : "—"),
      !temHist && e("span",{className:"text-[13px] text-muted-foreground"},"Cadastre as vendas anteriores em Revendedoras para a média ficar automática")),
    e("div",{className:"flex items-center justify-between gap-2 rounded-lg bg-primary/15 px-3 py-2 ring-1 ring-primary/40"},
      e("span",{className:"text-[13px] font-semibold"}, "Kit a liberar"), e("b",{className:MONO+" text-[20px] text-primary"}, kitLiberado ? din(kitLiberado) : avKit.motivo ? "Não libera" : "•••")),
    avKit.motivo && mediaVendas!==null && e("p",{className:"rounded-lg bg-destructive/15 px-3 py-1.5 text-center text-[13px] font-bold text-destructive"}, avKit.motivo),
    avisoMedia && e("p",{className:"rounded-lg bg-destructive/15 px-3 py-1.5 text-center text-[13px] font-bold text-destructive"}, avisoMedia));

  // ── 2 · Vendas e pagamentos ──
  var fl = formaDe(lancForm.forma), pm = versao.gerais.parcelaMinimaCredito;
  var lancOk = lancForm.forma && lancForm.valor>0;   // só a forma e o valor exato; a conta quem define é o financeiro (Visão geral)
  var addPag = function(){ if(!lancOk || jaFeito) return; up({pagamentos:form.pagamentos.concat([lancForm])}); setLancForm(Object.assign({}, LANC_VAZIO, {forma:lancForm.forma})); };
  var editarPag = function(i){ if(jaFeito) return; var p = form.pagamentos[i]; setLancForm(Object.assign({}, LANC_VAZIO, p)); up({pagamentos:form.pagamentos.filter(function(x,j){ return j!==i; })}); };
  var cancelarPag = function(i){ if(jaFeito) return; up({pagamentos:form.pagamentos.filter(function(x,j){ return j!==i; })}); };
  var rot = function(t){ return e("span",{className:"text-[13px] font-semibold text-muted-foreground"}, t); };
  var LINHA_PAG = "grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_5.5rem] items-center gap-2";   // forma e conta têm a mesma largura (as linhas se alinham)
  var campoLado = function(nome, campo){ return e("label",{className:"flex min-w-0 items-center gap-2"}, e("span",{className:"w-12 shrink-0 text-[13px] font-semibold text-muted-foreground"}, nome), e("span",{className:"min-w-0 flex-1"}, campo)); };
  // colunas fixas: tudo alinhado na mesma direção (forma · valor · situação/ações), igual em todas as linhas de pagamento
  var GRID_PAG = "grid grid-cols-[1.5rem_9.5rem_8.5rem_minmax(0,1fr)] items-center gap-3";
  var CG = INPUT+" h-10! w-full text-[14px]!";                // campos do pagamento (uma linha só)
  // cartão da conta: rótulo pequeno em cima, valor grande embaixo (alguns são campos digitados, outros só mostram)
  // todos os cartões iguais (mesma cor, mesmo tamanho): nome à esquerda, informação à direita; só a cor da letra do valor muda
  var ICONE_TILE = {"Vendas":"🛍️","Líquida":"🧮","Comissão":"💰","Brinde que libera":"🎁","Diferença do brinde":"⚖️","Desconto crédito":"🏷️","Valor do acerto":"💵"};
  var tile = function(tit, conteudo){ return e(Tile,{tit:tit}, conteudo); };
  var numTile = function(v){ return e("b",{className:MONO+" text-[20px] font-medium leading-tight"}, v); };
  // brinde que ela poderá liberar (já aparece antes do pagamento): faixa da venda líquida, com os descontos de atraso e remarcação
  var faixaBr = pa ? (versao.faixas||[]).slice().sort(function(a,b){ return b.min-a.min; }).find(function(x){ return pa.vendaLiquida>=x.min; }) : null;
  var fatorBr = fatorBrindeAtraso*(1-((pa && pa.descontoRemarcacao && pa.descontoRemarcacao.brindePct)||0)/100);
  // bloco da direita, de cima para baixo: Desconto crédito · Vendas | Líquida · Comissão · Brinde · Valor a pagar (e as formas de pagamento logo abaixo)
  var heroVendas = e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-col gap-2"},
      tile("Desconto crédito", e(CampoDinheiro,{value:form.garantia, label:"Desconto de crédito (garantia)", onChange:function(v){ up({garantia:v||0}); }, className:CPD+" h-8! w-52! text-right! text-[17px]! text-white!"}), "#E8B84B"),
      tile("Vendas", e(CampoDinheiro,{value:form.vendaBruta, label:"Valor total vendido", onChange:function(v){ up({vendaBruta:v, semVenda:false}); }, className:CPD+" h-8! w-52! text-right! text-[17px]! text-white!"}), "#E8B84B"),
      tile("Líquida", numTile(pa ? din(pa.vendaLiquida) : "—"), "#E8B84B"),
      tile("Comissão", numTile(pa ? pa.comissaoPct+"%" : "—"), "#E8B84B"),
      tile("Brinde que libera", pa ? e("span",{className:"flex items-center gap-3 text-[14px] font-bold"}, "Normal "+din(faixaBr ? Math.round(faixaBr.bn*fatorBr) : 0), e("span",{className:"text-muted-foreground"},"·"), "Select "+din(faixaBr ? Math.round(faixaBr.bb*fatorBr) : 0)) : numTile("—"), "#E8B84B"),
      tile("Valor do acerto", pa ? e("span",{className:"flex flex-wrap items-center gap-x-4 gap-y-0.5"}, e("b",{className:MONO+" text-[20px] font-medium leading-tight"}, din(dv.totalAPagar)),
          dv.restanteTotal>0.009 ? e("span",{className:MONO+" text-[19px] font-medium text-destructive"},"pendente "+din(dv.restanteTotal)) : e("span",{className:"text-[15px] font-bold text-success"},"✓ quitado")) : numTile("—"), "#E8B84B")),
    (ehPrata || dv.novas) && e("label",{className:"flex items-center justify-end gap-2 text-[13px] font-semibold text-muted-foreground"}, dv.novas ? "Dias de atraso do acerto" : "Dias de atraso (Kit 100% Prata)",
      e("input",{type:"number", value:form.atrasoDias||0, disabled:true, readOnly:true, title:"Quem preenche é a Tamara (agendamento)", "aria-label":"Dias de atraso (a Tamara preenche)", className:CPD+" h-8! w-16! cursor-not-allowed px-1! text-center! opacity-60"})),
    avisoDivida && e("p",{className:"text-center text-[13px] font-semibold text-destructive"}, avisoDivida),
    dv.novas && pa && (form.atrasoDias||0)>0 && e("p",{className:"text-center text-[13px] font-semibold text-destructive"},
      pa.juridico ? "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico."
        : "Atraso: perde "+pa.atrasoPct+"% da comissão e "+(pa.atrasoBrindePct||0)+"% do brinde."),
    dv.novas && pa && dv.faltaAtual>0.009 && dv.multaAplica && e("div",{className:"flex flex-col items-end gap-1"},
      e("label",{className:"flex items-center justify-end gap-2 text-[13px] font-semibold text-muted-foreground"}, "Dias com valor pendente (prazo "+((versao.novas||{}).prazoQuitarDias||15)+")",
        e("input",{type:"number", min:0, value:form.diasQuitacao||0, "aria-label":"Dias com valor pendente", className:CPD+" h-8! w-16! px-1! text-center!", onChange:function(ev){ up({diasQuitacao:Math.max(0, parseInt(ev.target.value,10)||0)}); }})),
      e("p",{className:"text-[13px] font-semibold text-destructive"}, "Multa de "+din(pa.multaPendente)+(pa.multaAtrasoQuitacao>0 ? " + "+din(pa.multaAtrasoQuitacao)+" de atraso" : "")+" sobre "+din(pa.pendente)+" pendente. Próximo kit só depois de quitar.")),
    pa && (pa.descontoRemarcacao.comissaoPct>0 || pa.descontoRemarcacao.brindePct>0 || pa.atrasoPct>0) && e("p",{className:"text-center text-[13px] font-semibold text-destructive"},
      "Comissão −"+(pa.descontoRemarcacao.comissaoPct+pa.atrasoPct)+"%"+(pa.descontoRemarcacao.brindePct>0 ? " · brinde −"+pa.descontoRemarcacao.brindePct+"%" : "")),
    pa && pa.semFaixa && e(Aviso,null,"Abaixo de "+din(versao.gerais.minRenovar)+" de venda: sem comissão."+(ehPrata ? " Kit 100% Prata não renova." : "")));
  // pagamento: só a FORMA e o VALOR exato (ex.: pix 7.000, ou dois pix); a conta o financeiro divide na Visão geral
  var cartaoPag = !dv.previaBase ? null : e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3"},
    !jaFeito && e("div",{role:"group", "aria-label":"Forma de pagamento", className:"flex flex-wrap gap-1.5"}, formas.map(function(f){ var on = lancForm.forma===f.k;
      return e("button",{key:f.k, type:"button", "aria-pressed":on, onClick:function(){ setLancForm(Object.assign({}, lancForm, {forma:f.k})); }, className:"h-8 rounded-lg px-3 text-[13px] font-bold ring-1 "+(on ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/30 text-foreground ring-border hover:bg-muted/50")}, f.label); })),
    !jaFeito && e("div",{className:"grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2"},
      campoLado("Valor", e(CampoDinheiro,{value:lancForm.valor, label:"Valor do pagamento", className:CPD+" h-10! font-bold", placeholder:"R$ 0,00", onChange:function(v){ setLancForm(Object.assign({}, lancForm, {valor:v})); }})),
      e(Btn,{v:"primary", ic:"check", className:"h-10!", disabled:!lancOk, onClick:addPag}, "OK")),
    form.pagamentos.length>0 && e("div",{className:"flex flex-col gap-1"}, form.pagamentos.map(function(p,i){
      return e("div",{key:i, className:GRID_PAG+" rounded-lg bg-black/20 px-2.5 py-1.5 text-[13px]"},
        e("span",{className:"grid size-5 place-items-center rounded-full bg-[#E8B84B]/25 text-[11px] font-bold text-primary"}, i+1),
        e("b",{className:"text-center"}, formaDe(p.forma).label), e("b",{className:MONO+" text-center text-primary"}, din(p.valor)),
        !jaFeito ? e("span",{className:"flex justify-end gap-1.5"},
          e("button",{onClick:function(){ editarPag(i); }, className:"w-20 rounded-md bg-black/20 py-0.5 text-center text-[13px] font-semibold hover:bg-black/30"},"Editar"),
          e("button",{onClick:function(){ cancelarPag(i); }, className:"w-20 rounded-md bg-destructive/20 py-0.5 text-center text-[13px] font-semibold text-destructive hover:bg-destructive/30"},"Cancelar")) : e("span")); })));
  cartaoPag = null;   // desenho novo: forma e valor ficam na tabela da esquerda (estação Pagamentos)
  // ── Envio ao financeiro: só depois de fechar TODAS as formas de pagamento (e a negociação). O financeiro divide em contas, a funcionária anexa os comprovantes ──
  var lancFin = (s.lancFin||[]).find(function(x){ return x.internoId===sel.id; }) || null;
  var parteVazia = function(v){ return [{descricao:"", valor:v, comprovante:null, ok:false}]; };
  var linhasPagEnvio = form.pagamentos.filter(function(p){ return p.forma && p.valor>0; }).map(function(p){ var base = {tipo:"pagamento", forma:p.forma, valor:p.valor, partes:parteVazia(p.valor)};
    return p.linkSolId ? Object.assign(base, {parcelas:p.parcelas || 1, linkSolId:p.linkSolId, partes:[{descricao:p.descricao || "LINK", valor:p.valor, comprovante:null, ok:true}], enviada:true, auto:"Link já pago (setor Link de pagamento)"}) : base; });
  var linhasEnvio = linhasPagEnvio.concat(dv.excedenteBrinde>0 ? [{tipo:"brinde", forma:"", valor:dv.excedenteBrinde, partes:parteVazia(dv.excedenteBrinde)}] : []);
  var chaveLinhas = function(ls){ return JSON.stringify(ls.map(function(l){ return [l.tipo, l.forma, l.valor]; })); };
  var alterado = !!lancFin && chaveLinhas(linhasEnvio)!==chaveLinhas(lancFin.linhas);
  var fechouPagamentos = dv.quitado || dv.acordoValido || form.recusouNegociar;
  var podeEnviar = linhasEnvio.length>0 && fechouPagamentos && (!lancFin || alterado) && !jaFeito;
  var linhasPagFin = lancFin ? lancFin.linhas.filter(function(l){ return l.tipo==="pagamento"; }) : [];
  // os campos de brinde só abrem quando o financeiro confirmou TODOS os pagamentos enviados (e nada mudou depois)
  var pagLiberados = !!lancFin && !!lancFin.etapaComprovantes && linhasPagFin.length>0 && chaveLinhas(linhasPagEnvio)===chaveLinhas(linhasPagFin);
  var semPendencia = function(ls){ return ls.length>0 && ls.every(function(l){ return l.isento || (statusLinhaFin(l)!=="aguardando" && (l.partes||[]).every(function(q){ return !!q.comprovante; })); }); };
  var comprovantesPagOk = semPendencia(linhasPagFin);                                  // todas as contas dos pagamentos com comprovante
  var tudoComComprovante = !!lancFin && !alterado && semPendencia(lancFin.linhas);     // inclui a diferença do brinde, se houver
  var etapa = function(patch){ d({type:"FIN_ETAPA", id:lancFin.id, patch:patch}); };
  var STATUS_FIN = {aguardando:["Aguardando o financeiro definir e enviar as contas","#F59E0B"], conta:["Contas definidas: anexe os comprovantes","#38BDF8"], ok:["✓ Conferido","#22C55E"], isento:["Isento","#9CA3AF"]};
  var trocaParte = function(i, j, patch){ var l = lancFin.linhas[i]; d({type:"FIN_LINHA", id:lancFin.id, i:i, patch:{partes:l.partes.map(function(p,k){ return k===j ? Object.assign({}, p, patch) : p; })}}); };
  var caixaFinanceiro = linhasEnvio.length===0 && !lancFin ? null : e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("b",{className:"text-[13px] uppercase tracking-wide"}, "Financeiro"+(lancFin ? (lancFin.conferido ? " · tudo conferido" : " · enviado às "+hhmmDeTs(lancFin.enviadoTs)) : "")),
      (!lancFin || alterado) && linhasEnvio.length>0 && e(Btn,{v:"primary", ic:"check", sm:true, disabled:!podeEnviar, onClick:function(){ d({type:"FIN_ENVIAR", internoId:sel.id, nome:sel.nome, linhas:linhasEnvio, por:nomeDe(s.usuario), vendas:form.vendaBruta||0, aPagar:dv.totalAPagar||0}); }}, alterado ? "Reenviar com as alterações" : "OK, enviar ao financeiro")),
    (!lancFin || alterado) && linhasEnvio.length>0 && !fechouPagamentos && e("p",{className:"text-[13px] font-semibold text-muted-foreground"},"Para enviar: feche todas as formas de pagamento (sem valor pendente) ou resolva a negociação."),
    alterado && e("p",{className:"text-[13px] font-semibold text-warning"},"Os pagamentos mudaram depois do envio: reenvie para o financeiro conferir de novo."),
    // etapa 1: comprovantes dos pagamentos anexados → OK libera os brindes · etapa 2: depois dos brindes (e da diferença, se houver) → finaliza e o financeiro confere
    lancFin && !lancFin.etapaComprovantes && e("div",{className:"flex flex-wrap items-center gap-3"},
      e(Btn,{v:"primary", ic:"check", sm:true, disabled:!comprovantesPagOk || alterado, onClick:function(){ etapa({etapaComprovantes:true}); }}, "OK, comprovantes anexados"),
      e("span",{className:"text-[13px] text-muted-foreground"}, comprovantesPagOk ? "Ao dar OK, os brindes são liberados." : "Anexe o comprovante de cada conta definida pelo financeiro.")),
    lancFin && lancFin.etapaComprovantes && !lancFin.finalizado && e("div",{className:"flex flex-wrap items-center gap-3"},
      e(Btn,{v:"primary", ic:"check", sm:true, disabled:!tudoComComprovante, onClick:function(){ etapa({finalizado:true, finalizadoTs:Date.now()}); }}, "Finalizar pagamentos e enviar para conferência"),
      e("span",{className:"text-[13px] text-muted-foreground"}, alterado ? "Há diferença de brinde nova: reenvie ao financeiro, espere a conta e anexe o comprovante." : tudoComComprovante ? "Tudo anexado: o financeiro já pode conferir." : "Falta anexar algum comprovante.")),
    lancFin && lancFin.finalizado && !lancFin.conferido && e("p",{className:"text-[13px] font-semibold text-primary"},"Comprovantes enviados: aguardando o financeiro conferir."),
    lancFin && lancFin.linhas.map(function(l,i){ var sk = statusLinhaFin(l), st = STATUS_FIN[sk];
      return e("div",{key:i, className:"flex flex-col gap-1 rounded-lg bg-black/20 px-2.5 py-1.5 text-[13px]"},
        e("div",{className:GRID_PAG},
          e("span"), e("b",{className:"text-center"}, l.tipo==="brinde" ? "Diferença do brinde" : formaDe(l.forma).label), e("b",{className:MONO+" text-center text-primary"}, din(l.valor)),
          e("span",{className:"justify-self-start rounded-md px-2 py-0.5 text-[13px] font-bold", style:{background:st[1]+"26", color:st[1]}}, st[0])),
        sk!=="isento" && sk!=="aguardando" && (l.partes||[]).map(function(p,j){
          return e("div",{key:j, className:GRID_PAG+" text-[13px]"},
            e("span"), e("span",{className:"truncate text-center text-muted-foreground", title:p.descricao}, p.descricao), e("b",{className:MONO+" text-center"}, din(p.valor)),
            e("span",{className:"flex flex-wrap items-center gap-2"},
              p.ok ? e("span",{className:"font-bold text-success"},"✓ conferido") : lancFin.finalizado ? null : e("label",{className:"inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 text-[13px] font-semibold hover:bg-white/15"},
                p.comprovante ? "✓ Comprovante: trocar" : "Anexar comprovante",
                e("input",{type:"file", accept:"image/*,application/pdf", className:"sr-only", "aria-label":"Anexar comprovante", onChange:function(ev){ lerComprovante(ev.target.files[0], function(cmp){ trocaParte(i, j, {comprovante:cmp}); }); ev.target.value = ""; }})),
              p.comprovante && e("a",{href:p.comprovante.url, target:"_blank", rel:"noreferrer", className:"text-[13px] font-semibold text-primary underline"},"ver"))); })); }));
  var pVendas = heroVendas;
  var pPag = e(React.Fragment,null,
    !dv.previaBase ? e(React.Fragment,null, e("p",{className:"rounded-lg border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground"},"Digite o valor vendido para lançar os pagamentos."), caixaFinanceiro)
    : e(React.Fragment,null,
        cartaoPag,
        caixaFinanceiro,
        // negociar é um caso ou outro: só aparece (pequeno) se faltar algum valor depois de lançar pagamento
        form.pagamentos.length>0 && dv.faltaAtual>0.009 && !dv.acordoExistente && !negociarAberto && !form.recusouNegociar && e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
          e("span",{className:"text-[13px] font-semibold"}, "Falta "+din(dv.faltaAtual)+":"),
          e(Btn,{v:"secondary", sm:true, onClick:function(){ setNegociarAberto(true); if(!form.acordoParcelas.length) up({acordoParcelas:[{data:isoDia(new Date()), valor:null}]}); }}, "Negociar"),
          e(Btn,{v:"destructive", sm:true, onClick:function(){ up({recusouNegociar:true}); }}, "Não quis negociar")),
        form.recusouNegociar && e(Aviso,{tom:"vermelho"},"Não quis negociar: sem brinde; o jurídico entra em contato; sem negociação em 24 h depois do contato com o setor, a nota promissória vai para execução no valor pendente. ",
          e("button",{className:"underline", onClick:function(){ up({recusouNegociar:false}); }},"Desfazer")),
        (negociarAberto || dv.acordoExistente) && e(Secao,{t:"Parcelas negociadas · falta "+din(dv.faltaAtual)},
          e(Tab,{cols:[{t:"Parcela", w:"6rem"},{t:"Data"},{t:"Valor", r:true, w:"10rem"},{t:"", w:"3rem"}]},
            form.acordoParcelas.map(function(p,i){ return e("tr",{key:i, className:"border-b border-border/50"},
              e(Td,null,(i+1)+"ª"),
              e(Td,null, e("input",{type:"date", value:p.data, "aria-label":"Data da parcela", className:CP, onChange:function(ev){ var o = form.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {data:ev.target.value}); up({acordoParcelas:o, acordoSalvo:false}); }})),
              e(Td,null, e(CampoDinheiro,{value:p.valor, label:"Valor da parcela", className:CPD, onChange:function(v){ var o = form.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {valor:v}); up({acordoParcelas:o, acordoSalvo:false}); }})),
              e(Td,null, e(Remover,{label:"Remover parcela", onClick:function(){ up({acordoParcelas:form.acordoParcelas.filter(function(x,j){ return j!==i; }), acordoSalvo:false}); }}))); })),
          e("div",{className:"flex items-center justify-between gap-2"},
            e(Btn,{v:"ghost", sm:true, onClick:function(){ up({acordoParcelas:form.acordoParcelas.concat([{data:isoDia(new Date()), valor:null}])}); }}, "+ Parcela"),
            e("b",{className:MONO+" text-[13px] "+(Math.abs(dv.acordoSoma-dv.faltaAtual)<=0.01 ? "text-success" : "text-destructive")}, "Soma "+din(dv.acordoSoma)+" / "+din(dv.faltaAtual)),
            e("span",{className:"flex gap-2"},
              e(Btn,{v:"primary", sm:true, onClick:function(){ var v = form.acordoParcelas.filter(function(p){ return p.data && p.valor>0; }); up({acordoParcelas:v, acordoSalvo:v.length>0}); }}, "Salvar acordo"),
              e(Btn,{v:"destructive", sm:true, onClick:function(){ setNegociarAberto(false); up({acordoParcelas:[], acordoSalvo:false}); }}, "Remover"))),
          form.acordoSalvo && ehPrata && e(Aviso,null,"Kit 100% Prata: acordo não libera brinde."),
          dv.acordoValido && e(Aviso,{tom:"verde"},"Acordo cobre o que falta: brinde liberado.")),
        dv.quitado && dv.acordoExistente && e(Aviso,{tom:"vermelho"},"Quitado, mas existe acordo salvo. Remova o acordo.")));

  // ── 3 · Brindes: Normal e Select (BB) no mesmo bloco, cada um com o seu lançamento e o restante ──
  var cb = dv.confBrinde;
  var addBrinde = function(cat, st, setSt){ if(jaFeito) return; var ok = codigoBrindeValido(cat, st.codigo) && st.valor>0; if(!ok) return;
    up({brindes:form.brindes.concat([{cat:cat, codigo:normalizarCodigo(st.codigo), valor:st.valor, origem:"nova"}])}); setSt({codigo:"", valor:null, cod:false}); };
  var travaBrinde = !jaFeito && !pagLiberados;                     // campos de brinde só depois dos pagamentos confirmados
  // por que o brinde diminuiu (remarcação, chegada atrasada, pagamento incompleto)
  var motivosBr = [];
  if(pa && pa.descontoRemarcacao && pa.descontoRemarcacao.brindePct>0) motivosBr.push("Remarcação −"+pa.descontoRemarcacao.brindePct+"%");
  if(chegouMuitoAtrasada) motivosBr.push("Chegou "+atrasoChegada+" min atrasada −"+Math.round(DESCONTO_BRINDE_ATRASO*100)+"%");
  if(pa && pa.fatorPagamento<1) motivosBr.push(pa.fatorPagamento===0 ? "Faltou mais de "+dv.tetoFalta+"% do pagamento: sem brinde" : "Pagamento incompleto: recebe "+Math.round(pa.fatorPagamento*100)+"% do brinde");
  var colBrinde = function(cat, titulo, lib, lanc, rest, st, setSt, cor){
    var base = faixaBr ? (cat==="bb" ? faixaBr.bb : faixaBr.bn) : 0;
    var minhas = form.brindes.map(function(b,i){ return {b:b, i:i}; }).filter(function(x){ return x.b.cat===cat; });
    var codOk = codigoBrindeValido(cat, st.codigo);
    return e("div",{className:"flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-3"},
      e("b",{className:"text-[14px]"}, titulo),
      e("div",{className:"flex flex-col gap-0.5 rounded-lg bg-black/15 px-2.5 py-1.5 text-[13px]"},
        e("div",{className:"flex items-baseline justify-between gap-2"}, e("span",{className:"text-muted-foreground"},"Valor da categoria"), e("b",{className:MONO}, din(base))),
        e("div",{className:"flex flex-wrap items-baseline justify-between gap-x-2"}, e("span",{className:"font-semibold"},"Novo valor"), e("b",{className:MONO+" text-[17px] text-primary"}, din(lib))),
        lib<base && motivosBr.length>0 && e("p",{className:"text-[13px] font-semibold text-destructive"}, "Diminuiu por: "+motivosBr.join(" · "))),
      minhas.length>0 && e("div",{className:"flex flex-col gap-1"}, minhas.map(function(x){
        return e("div",{key:x.i, className:"flex items-center justify-between gap-2 rounded-lg bg-black/15 px-2.5 py-1 text-[13px]"}, e("b",{className:MONO}, x.b.codigo), e("span",{className:"flex items-center gap-2"}, e("b",{className:MONO}, din(x.b.valor)),
          !jaFeito && e(Remover,{label:"Remover peça "+x.b.codigo, onClick:function(){ up({brindes:form.brindes.filter(function(y,j){ return j!==x.i; })}); }}))); })),
      // passo 1: código da peça + OK (pula para o valor) · passo 2: valor + OK (a peça sobe para a lista). Código BB sempre começa com BB.
      !jaFeito && e("div",{className:"grid grid-cols-[minmax(0,1fr)_auto_8rem_auto] items-center gap-2"},
        e("input",{value:st.codigo, placeholder:cat==="bb" ? "BB0001" : "Código da peça", "aria-label":"Código da peça "+titulo, autoCapitalize:"characters", className:CP+" uppercase "+MONO,
          onKeyDown:onEnter(function(){ if(codOk){ setSt(Object.assign({}, st, {cod:true})); setTimeout(function(){ var el = document.getElementById("bv-"+cat); if(el) el.focus(); }, 30); } }),
          onFocus:function(){ if(cat==="bb" && !st.codigo) setSt(Object.assign({}, st, {codigo:"BB"})); },
          onChange:function(ev){ var c = normalizarCodigo(ev.target.value).slice(0,12); if(cat==="bb" && c) c = "BB"+c.replace(/^B{1,2}/,""); setSt(Object.assign({}, st, {codigo:c, cod:false})); }}),
        e(Btn,{v:st.cod ? "secondary" : "primary", sm:true, disabled:!codOk, onClick:function(){ setSt(Object.assign({}, st, {cod:true})); setTimeout(function(){ var el = document.getElementById("bv-"+cat); if(el) el.focus(); }, 30); }}, st.cod ? "✓" : "OK"),
        e(CampoReais,{id:"bv-"+cat, value:st.valor, disabled:!st.cod, label:"Valor da peça "+titulo, className:CPD+" disabled:opacity-40", onChange:function(v){ setSt(Object.assign({}, st, {valor:v})); }}),
        e(Btn,{v:"primary", sm:true, disabled:!(codOk && st.cod && st.valor>0), onClick:function(){ addBrinde(cat, st, setSt); }}, "OK")),
      st.codigo && !codOk && e("p",{className:"text-[13px] font-semibold text-destructive"}, cat==="bb" ? "BB + 4 números (ex.: BB0001 brinco, BBA0001 anel)" : "Informe o código"),
      e("div",{className:"flex justify-between border-t border-border/50 pt-1.5 text-[13px] font-bold"}, e("span",null,"Lançado "+din(lanc)), e("span",{className:rest>0 ? "text-success" : "text-muted-foreground"},"Restante "+din(rest))));
  };
  var pBrindes = !pa ? e("p",{className:"rounded-lg border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground"},"Lance as vendas e os pagamentos primeiro.")
    : dv.brindeBloqueio ? e(Aviso,{tom:"vermelho"},"Brinde bloqueado — "+dv.brindeBloqueio.frase+(dv.faltaAtual>0.009 ? " (falta "+din(dv.faltaAtual)+")" : ""))
    : e(React.Fragment,null,
        travaBrinde && e("p",{className:"rounded-lg bg-[#E8B84B]/10 px-3 py-1.5 text-center text-[13px] font-semibold text-primary"},"Os campos de brinde abrem quando o financeiro confirmar todos os pagamentos."),
        e("p",{className:"rounded-lg border border-[#E8B84B]/60 bg-[#E8B84B]/15 px-3 py-1.5 text-center text-[13px] font-bold text-white"},"⚠ "+AVISO_BB+" Pode ser brinco, anel, colar ou qualquer outra peça."),
        e("div",{className:"grid grid-cols-1 gap-2.5 md:grid-cols-2 "+(travaBrinde ? "pointer-events-none opacity-50" : "")},
          colBrinde("normal","Brinde Normal", dv.libN, cb.lancadoNormal, cb.restanteNormal, bnIn, setBnIn, "#E8B84B"),
          colBrinde("bb","Brinde Select (BB)", dv.libS, cb.lancadoSelect, cb.restanteSelect, bbIn, setBbIn, "#E8B84B")),
        // diferença do brinde: o que passou do liberado entra no valor a pagar (mesmo cartão e mesma situação dos pagamentos)
        (function(){ var lb = lancFin && lancFin.linhas.find(function(l){ return l.tipo==="brinde"; }), sb = lb ? STATUS_FIN[statusLinhaFin(lb)] : null;
          return tile("Diferença do brinde", dv.excedenteBrinde>0
            ? e("span",{className:"flex flex-wrap items-center gap-x-4 gap-y-1"}, numTile(din(dv.excedenteBrinde)),
                e("span",{className:"rounded-md px-2 py-0.5 text-[13px] font-bold", style:{background:(sb ? sb[1] : "#F59E0B")+"26", color:sb ? sb[1] : "#F59E0B"}}, sb ? sb[0] : "A enviar ao financeiro"))
            : e("span",{className:"text-[14px] font-bold"},"Sem diferença a pagar"), "#E8B84B"); })(),
        e("p",{className:"text-center text-[13px] text-muted-foreground"},"O brinde só é entregue depois do pagamento."));

  // ── 4 · Condicional nova: só no final. Ela continua vendendo? Se não: por causa das regras ou porque não quis ──
  var semPag = !dv.previaBase || (!form.pagamentos.length && !form.semVenda);   // venda R$ 0,00 não tem pagamento
  var condFicam = condicionais.filter(function(c){ return condsSel.indexOf(c.numero)<0; });
  var continuaEf = retornando ? "retornando" : !dv.previaBase ? "" : !dv.kitNovoLiberado ? "nao_regras" : (form.continua||"");
  var escolhas = [["sim","✓ Continua vendendo","#16A34A", !dv.kitNovoLiberado],["nao_regras","✗ Não pode (regras)","#DC2626", false],["nao_quer","✗ Não quer continuar","#D97706", false]];
  var pNova = semPag ? e("p",{className:"rounded-lg border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground"},"Lance vendas e pagamentos primeiro.")
    : e(React.Fragment,null,
        // regra do kit novo (a mesma do app da representante): precisa ter pago o mínimo % do acerto
        e("div",{className:"flex flex-col gap-1.5 rounded-xl p-3 ring-1 "+(dv.kitNovoLiberado ? "bg-success/10 ring-success/40" : "bg-destructive/10 ring-destructive/40")},
          e("div",{className:"flex items-baseline justify-between gap-3"},
            e("b",{className:"text-[14px] "+(dv.kitNovoLiberado ? "text-success" : "text-destructive")}, dv.kitNovoLiberado ? "✓ Kit novo liberado" : "✗ Kit novo não liberado"),
            e("span",{className:"text-[13px]"}, e("b",{className:MONO+" text-[18px]"}, N1(dv.pctPagoAcerto)+"%"), " do acerto pago · mínimo ", e("b",{className:MONO}, dv.kitNovoMin+"%"))),
          e("div",{className:"relative h-3 overflow-hidden rounded-full bg-black/30", role:"progressbar", "aria-valuenow":Math.round(dv.pctPagoAcerto), "aria-valuemin":0, "aria-valuemax":100},
            e("div",{className:"h-full rounded-full transition-all duration-500 "+(dv.kitNovoLiberado ? "bg-success" : "bg-destructive"), style:{width:Math.min(100, dv.pctPagoAcerto)+"%"}}),
            e("span",{className:"absolute inset-y-0 w-0.5 bg-white", style:{left:dv.kitNovoMin+"%"}, title:"Mínimo para liberar o kit novo"})),
          dv.novas && dv.minimo.regra && e("p",{className:"text-[13px] font-semibold "+(dv.minimo.abaixo ? "text-destructive" : "text-success")},
            "Média de "+dv.minimo.qtd+" venda(s): "+din(dv.minimo.media)+" · mínimo "+din(dv.minimo.ref)+(dv.minimo.abaixo ? ". Abaixo do mínimo: kit novo não liberado e cadastro bloqueado." : ".")),
          !dv.kitNovoLiberado && e("p",{className:"text-[13px] font-semibold text-destructive"},
            dv.blocoDivida ? dv.blocoDivida
            : dv.novas && dv.kitNovoRegra && !dv.kitNovoRegra.liberado ? dv.kitNovoRegra.texto+"."
            : !dv.previaBase.podeRenovar ? "Vendas abaixo de "+din(versao.gerais.minRenovar)+": não renova o kit." : "Falta pagar para liberar. Abaixo de "+dv.kitNovoMin+"% só com autorização do financeiro.")),
        e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-3"}, escolhas.map(function(x){ var on = continuaEf===x[0];
          return e("button",{key:x[0], disabled:x[3] || jaFeito, onClick:function(){ up({continua:x[0]}); }, "aria-pressed":on,
            className:"h-11 rounded-lg text-[13px] font-bold ring-1 disabled:opacity-40 "+(on ? "text-white ring-transparent" : "bg-white/5 ring-white/15 hover:bg-white/10"), style:on ? {background:x[2]} : undefined}, x[1]); })),
        continuaEf==="sim" && e("div",{className:"flex flex-col gap-2 rounded-xl bg-success/10 p-3 ring-1 ring-success/30"},
          e("label",{className:"flex flex-col items-center gap-1"}, e("span",{className:"text-[13px] font-semibold text-muted-foreground"},"Número da condicional nova"),
            e("input",{value:form.novaCond||"", disabled:jaFeito, inputMode:"numeric", placeholder:"000000", "aria-label":"Número da condicional nova", className:CG+" w-56! text-center "+MONO, onChange:function(ev){ up({novaCond:ev.target.value.replace(/\D/g,"").slice(0,8)}); }})),
          condFicam.length>0 && e("p",{className:"text-center text-[13px] text-muted-foreground"},"Continua com: ", condFicam.map(function(c){ return e("b",{key:c.numero, className:MONO+" mx-1 text-foreground"}, c.numero); }))));

  // ── 5 · Regras do consignado: tópico por tópico (curto), a funcionária passa uma a uma; a revendedora NÃO assina ──
  var dvRegra = dv;
  var regras = versaoBase ? textoRegras(versaoBase, modalidade).filter(function(r){ return !/deslocamento|pe[cç]as/i.test(r.t); }) : [];   // interno: sem taxa de deslocamento nem peças do próximo mês
  if(versaoBase) regras = regras.concat([
    {t:"Redução do brinde", x:"O valor do brinde da sua categoria pode diminuir por 3 motivos, e as reduções se somam: (1) remarcação do acerto; (2) chegar com mais de "+TOLERANCIA_CHEGADA_MIN+" minutos de atraso: −"+Math.round(DESCONTO_BRINDE_ATRASO*100)+"%; (3) não pagar o valor total: faltando até "+(dvRegra ? dvRegra.tetoFalta : 10)+"% o brinde diminui, e acima disso perde o brinde todo. Na tela do atendimento aparece o valor da categoria, o novo valor e o motivo."},
    {t:"Peças fora do kit", x:"Tudo que não estiver no kit, com etiqueta, no momento do acerto é considerado vendido. Não existe a opção de ter tirado a peça como brinde."},
    {t:"Horário do acerto", x:"O acerto é no horário marcado, com tolerância de "+TOLERANCIA_CHEGADA_MIN+" minutos. Chegando depois disso, perde "+Math.round(DESCONTO_BRINDE_ATRASO*100)+"% do brinde."}]);
  var curto = function(x){ var p = String(x||"").split(/(?<=[.!?])\s/)[0]; return p.length>110 ? p.slice(0,107)+"…" : p; };
  var cienteOk = regras.length>0 && regras.every(function(r,i){ return !!regrasOk[i]; });
  var nRegras = regras.filter(function(r,i){ return !!regrasOk[i]; }).length;
  var termoAnt = (s.perfisRev||{})[sel.nome] && (s.perfisRev||{})[sel.nome].termoConsignado;
  var pronto = !jaFeito && temVenda && (semVendaOk || (cienteOk && (retornando ? !!sel.escolhaFim : !!continuaEf)));
  var registrar = function(){ if(retornando){ d({type:"INT_RETORNANDO_FIM", id:sel.id, assinatura:null, regrasPassadas:regras.map(function(r){ return r.t; }), por:nomeDe(s.usuario)}); return; }
    d({type:"INT_ACERTO_REGISTRAR", id:sel.id, vendaBruta:form.vendaBruta, devolvida:0, garantia:form.garantia||0,
      valorPago: dv.acordoValido ? dv.previaBase.valorDevido : dv.totalPagoAtual, pagamentos:form.pagamentos.filter(function(p){ return p.forma && p.valor>0; }), acordo:dv.acordoExistente ? form.acordoParcelas : null,
      recusouNegociar:form.recusouNegociar, brindesLancados:form.brindes, excedenteBrinde:dv.excedenteBrinde,
      pecasVendidas:formD.pecasVendidas, pecasBrinde:form.pecasBrinde, pecasTrocas:form.pecasTrocas, pecasADevolver:dv.pecasADevolver,
      condicionaisSelecionadas:formD.condicionaisSelecionadas, modalidade:modalidade, atrasoDias:(ehPrata || dv.novas) ? (form.atrasoDias||0) : 0, diasQuitacao:form.diasQuitacao||0,
      assinatura:null, regrasLidas:!semVendaOk, regrasPassadas:semVendaOk ? [] : regras.map(function(r){ return r.t; }), por:nomeDe(s.usuario), bipou:sel.bipou||"",
      pecasProxCodigos:[], pecasProxLiberadas:0, kitNovoOk:continuaEf==="sim", continuidade:continuaEf, novaCond:form.novaCond||"",
      pecasCond:dv.pecasCondSelecionadas, formSnapshot:form});
  };
  var msgs = jaFeito && temVenda && pa ? mensagemFechamento({nome:sel.nome, origem:"interno", data:isoDia(new Date()), dv:dv, form:formD, condFicam:condFicam, expFicam:[],
    remarcacoes:remarcs.length ? remarcs.length+" ("+vezCobravel(remarcs)+" com multa)" : ""}) : null;
  var copiarMsg = function(chave, txt){ try{ navigator.clipboard.writeText(txt); }catch(x){} setMsgCopiada(chave); setTimeout(function(){ setMsgCopiada(null); }, 1600); };
  var dataBR = function(ts){ return new Date(ts).toLocaleDateString("pt-BR"); };
  // termo assinado antes (mês anterior): leu, confirmou e assinou todas as informações
  var painelTermo = termoAnt ? e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-success/10 p-3 ring-1 ring-success/30"},
      e("b",{className:"text-[14px] text-success"},"✓ Leu, confirmou e assinou em "+dataBR(termoAnt.ts)),
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, (termoAnt.regras||[]).map(function(t,i){ return e("span",{key:i, className:"rounded-md bg-success/15 px-2 py-0.5 text-[13px] font-semibold text-success"}, "✓ "+t); })),
      termoAnt.assinatura && e("img",{src:termoAnt.assinatura, alt:"Assinatura de "+sel.nome, className:"h-24 rounded-lg bg-white p-1"}),
      e("p",{className:"text-[13px] text-muted-foreground"}, "Assinatura registrada"+(termoAnt.por ? " · atendida por "+termoAnt.por : ""))) : null;
  var pRegras = msgs ? e(React.Fragment,null,
      e("p",{className:"text-center text-[13.5px] font-semibold text-success"},"✓ Acerto registrado · acerto "+din(sel.acerto.valorAcerto)+" · comissão "+din(sel.acerto.comissao)),
      painelTermo,
      e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2"}, [["cliente","Para a revendedora", msgs.cliente],["grupo","Para o grupo da empresa", msgs.grupo]].map(function(m){
        return e("div",{key:m[0], className:"flex flex-col gap-2"}, e("b",{className:"text-center text-[13.5px]"}, m[1]),
          e("textarea",{readOnly:true, value:m[2], rows:Math.min(14, m[2].split("\n").length+1), className:INPUT+" h-auto! w-full resize-none py-2! text-[13px]! leading-snug"}),
          e("div",{className:"flex justify-center gap-2"}, e(Btn,{v:"primary", ic:"copiar", onClick:function(){ copiarMsg(m[0], m[2]); }}, msgCopiada===m[0] ? "✓ Copiado" : "Copiar"),
            m[0]==="cliente" && sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(m[2]), target:"_blank", rel:"noreferrer",
              className:"inline-flex h-10 items-center rounded-lg bg-success/15 px-3 text-[15px] font-medium text-success hover:bg-success/25"}, "Abrir no WhatsApp"))); })))
    : jaFeito ? e(React.Fragment,null, e("p",{className:"text-center text-[13.5px] font-semibold text-success"},"✓ Acerto registrado · acerto "+din(sel.acerto.valorAcerto)+" · comissão "+din(sel.acerto.comissao)), painelTermo)
    : semVendaOk ? e("div",{className:"flex flex-col items-center gap-3 p-4 text-center text-[13px]"}, e("p",{className:"font-semibold"}, "Sem venda: o kit não renova. Não precisa passar as regras."), e(Btn,{v:"primary", ic:"check", className:"h-12!", disabled:!pronto, onClick:registrar}, "Finalizar atendimento"))
    : e(React.Fragment,null,
        termoAnt && e("div",{className:"flex justify-center gap-1.5"}, [["agora","Passar as regras agora"],["anterior","Termo do mês anterior"]].map(function(x){ var on = abaRegras===x[0];
          return e("button",{key:x[0], onClick:function(){ setAbaRegras(x[0]); }, "aria-pressed":on, className:"h-9 rounded-lg px-4 text-[13px] font-bold ring-1 "+(on ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/40 ring-border hover:bg-muted")}, x[1]); })),
        termoAnt && abaRegras==="anterior" ? painelTermo : e(React.Fragment,null,
          // panfleto: cada regra é um cartão colorido com ícone grande; tocar no cartão marca como passada
          e("div",{className:"flex flex-col gap-1.5"}, regras.map(function(r,i){ var on = !!regrasOk[i], aberta = !!regraMais[i];
            var alternar = function(){ var o = Object.assign({}, regrasOk); o[i] = !on; setRegrasOk(o); };
            return e("div",{key:i, role:"checkbox", "aria-checked":on, "aria-label":"Regra passada: "+r.t, tabIndex:0, onClick:alternar, onKeyDown:function(ev){ if(ev.target===ev.currentTarget && (ev.key==="Enter" || ev.key===" ")){ ev.preventDefault(); alternar(); } },
              className:"flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 ring-1 "+(on ? "bg-success/10 ring-success/40" : "bg-black/20 ring-white/10 hover:bg-white/5")},
              e("span",{className:"mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-[13px] font-bold "+(on ? "bg-success text-white" : "ring-1 ring-white/30")}, on ? "✓" : ""),
              e("div",{className:"flex min-w-0 flex-1 flex-col gap-0.5"}, e("b",{className:"text-[13px]"}, r.t),
                e("span",{className:"text-[13px] leading-snug text-foreground/80"}, aberta ? r.x : curto(r.x)),
                r.x.length>curto(r.x).length && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); var o = Object.assign({}, regraMais); o[i] = !aberta; setRegraMais(o); }, className:"self-start text-[13px] font-bold text-primary hover:underline"}, aberta ? "menos" : "ver mais"))); })),
          e("p",{className:"text-center text-[13px] font-semibold "+(cienteOk ? "text-success" : "text-muted-foreground")}, cienteOk ? "✓ Todas as regras passadas" : nRegras+" de "+regras.length+" regras passadas"),
          e(Btn,{v:"primary", ic:"check", className:"h-12!", disabled:!pronto, onClick:registrar}, retornando ? "Finalizar atendimento" : "Confirmar e registrar acerto"),
          !pronto && e("p",{className:"text-center text-[13px] text-muted-foreground"}, !temVenda ? "Falta o valor vendido (ou marque Não teve venda)." : !continuaEf ? "Falta escolher se ela continua (condicional nova)." : !cienteOk ? "Marque todas as regras para finalizar." : "Confira o que falta antes de finalizar.")));

  var conteudos = [null, null, null, null, null, null];
  // situação de cada seção: ✓ concluída
  var feitoPasso = [condicionais.length>0 && condicionais.every(function(c){ return c.pecas>0; }), temVenda, !!dv.previaBase && (dv.quitado || dv.acordoValido || form.recusouNegociar), !!pa && (!!dv.brindeBloqueio || form.brindes.length>0), !!continuaEf && (continuaEf!=="sim" || !!form.novaCond), jaFeito];
  var nFeitos = feitoPasso.filter(Boolean).length;
  var temPa = !!pa && temVenda;
  var iniciar = function(){ var n = new Date(); d({type:"INT_ATUALIZAR", id:sel.id, patch:{inicio:hhmmDeTs(n.getTime()), inicioTs:n.getTime(), chegada:sel.chegada||horaAgora(), iniciadoPor:nomeDe(s.usuario)}}); };
  // relógio da escolha do kit: a funcionária dá OK quando a revendedora começa a escolher; o tempo máximo depende do valor do kit
  var maxEscolhaMin = retornando ? 60 : tempoMaxEscolhaMin(kitLiberado);   // kit retornando: 1 hora fixa
  var escolhendo = !!sel.escolhaIni && !sel.escolhaFim, decorridoSeg = sel.escolhaIni ? Math.max(0, Math.floor(((sel.escolhaFim || Date.now())-sel.escolhaIni)/1000)) : 0;
  var relogio = function(seg){ return String(Math.floor(seg/60)).padStart(2,"0")+":"+String(seg%60).padStart(2,"0"); };
  var estourou = !!maxEscolhaMin && sel.escolhaIni && decorridoSeg>maxEscolhaMin*60 && !sel.escolhaFim;
  var iniciarEscolha = function(){ setAvisoIni(true); };   // primeiro a funcionária lê o aviso do tempo; o relógio só liga depois do "Li e expliquei"
  var confirmaInicioEscolha = function(){ setAvisoIni(false); d({type:"INT_ATUALIZAR", id:sel.id, patch:{escolhaIni:Date.now(), escolhaFim:null, escolhaAvisoIni:Date.now(), escolhaAvisoFim:null}}); };
  var confirmaFimEscolha = function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{escolhaAvisoFim:Date.now()}}); };
  var terminarEscolha = function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{escolhaFim:Date.now()}}); };
  var durMin = sel && sel.inicioTs && sel.fimTs ? Math.max(1, Math.round((sel.fimTs-sel.inicioTs)/60000)) : null;
  // ENTER avança para o próximo campo (sem usar o mouse)
  var enterProximo = function(ev){
    if(ev.key!=="Enter" || ev.shiftKey || ev.nativeEvent && ev.nativeEvent.isComposing) return;
    var t = ev.target; if(!t || (t.tagName!=="INPUT" && t.tagName!=="SELECT")) return;
    if(["button","submit","file","reset"].indexOf(t.type)>=0) return;
    var campos = [].slice.call(ev.currentTarget.querySelectorAll("input:not([type=hidden]):not([type=file]):not([type=button]):not([disabled]):not([readonly]), select:not([disabled])")).filter(function(el){ return el.offsetParent!==null && el.tabIndex!==-1; });
    var i = campos.indexOf(t); if(i<0) return;
    ev.preventDefault();
    var prox = campos[i+1]; if(!prox) return;
    prox.focus(); if(prox.tagName==="INPUT" && prox.select){ try{ prox.select(); }catch(x){} }
  };

  // ── peças visuais do desenho novo (tabelas com borda, títulos neutros, números centralizados) ──
  var BORDA = "border-foreground/25";
  var CAP = "text-[11px] font-medium uppercase tracking-[.05em]";
  var CTB = "flex min-w-0 flex-1 flex-col overflow-hidden rounded-md border border-primary/45 [&>div:nth-child(even)]:bg-white/[0.04]";
  var CTP = "flex min-w-0 flex-1 flex-col [&>div:nth-child(even)]:bg-white/[0.04]";   // tabela solta, sem borda própria (a do bloco já separa)
  var CABT = "grid h-[30px] items-center gap-1.5 bg-primary/15 px-2.5 text-center text-[11px] font-medium uppercase tracking-[.05em]";
  var LIN = "grid min-h-9 items-center gap-1.5 border-t border-primary/20 px-2.5 py-0.5 text-center text-[13px] leading-none tabular-nums";
  // barra de título dos blocos: dourado em degradê (o mesmo do topo das tabelas). Blocos lado a lado dividem UM degradê só, do mais escuro (esquerda) ao mais claro (direita): --i = posição do bloco, --n = quantos blocos.
  var barraT = function(t){ return e("div",{className:"flex h-8 shrink-0 items-center justify-center border-b-2 border-primary/50 text-[11px] font-semibold uppercase tracking-[.05em] text-[#1a1306]", style:{backgroundImage:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)", backgroundSize:"calc(var(--n,1)*100%) 100%", backgroundPosition:"calc(var(--i,0)/max(var(--n,1) - 1,1)*100%) 0", backgroundRepeat:"no-repeat"}}, t); };
  var degradeEm = function(els){ return els.map(function(el, i){ return React.cloneElement(el, {key:el.key!=null ? el.key : "f"+i, style:Object.assign({}, el.props.style, {"--i":i, "--n":els.length})}); }); };
  var lado = function(titulo, filhos, cls, pad){ return e("div",{className:"flex min-w-0 flex-col border-l-2 border-primary/50 first:border-l-0 "+(cls||"")}, barraT(titulo), e("div",{className:"flex min-w-0 flex-1 flex-col gap-2 "+(pad||"p-1.5")}, filhos)); };
  var metades = function(cols, a, b){ return e("div",{className:"grid min-w-0 flex-1 "+cols}, degradeEm([a, b])); };
  var CPT = INPUT+" h-7! w-full px-1! text-center! text-[13px]! "+MONO;   // padrao-ok: campos das tabelas do atendimento com 28 px (pedido do Marcus, 30/10/2026)
  var pilula = function(t, cls){ return e("span",{className:"inline-flex h-5 items-center rounded-full border px-2 text-[11px] font-medium leading-none "+(cls||"border-foreground/25")}, t); };
  var faixaCel = function(cel){ return e("div",{className:"grid gap-1.5 p-1.5", style:{gridTemplateColumns:"repeat("+cel.length+", minmax(0, 1fr))"}}, cel.map(function(x,i){
    return e("div",{key:x.t, className:"flex min-w-0 flex-col items-center gap-0.5 rounded-md border border-primary/35 bg-muted/30 px-1 py-1.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, x.t), x.el || e("b",{className:"whitespace-nowrap text-[13px] font-semibold tabular-nums "+(x.cor||"")}, x.v)); })); };
  var faixaSolta = function(cel){ return e("div",{className:"grid border-t-2 border-primary/50", style:{gridTemplateColumns:"repeat("+cel.length+", minmax(0, 1fr))"}}, cel.map(function(x,i){
    return e("div",{key:x.t, className:"flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 "+(i ? "border-l border-primary/20" : "")}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, x.t), x.el || e("b",{className:"whitespace-nowrap text-[13px] font-semibold tabular-nums "+(x.cor||"")}, x.v)); })); };
  var linhaKV = function(rot, val, op){ op = op||{}; return e("div",{key:rot, className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] whitespace-nowrap "+(op.z ? "bg-white/[0.03] " : "")+(op.forte ? "border-primary bg-primary/10 font-semibold min-h-10" : "")}, e("span",{className:"flex items-center justify-center gap-1.5 whitespace-nowrap"}, rot, op.pill && pilula(op.pill, "border-primary text-primary")), val); };
  var n15 = function(v, cor){ return e("b",{className:"whitespace-nowrap text-[13px] font-semibold tabular-nums "+(cor||"")}, v); };

  // ── cabeçalho do atendimento: uma faixa de células ──
  // cabeçalho: toda célula tem rótulo de 11 px em cima e uma caixa de 32 px embaixo (mesmo tamanho, mesma borda)
  var CX = "flex h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-md border px-2 text-[13px] font-medium whitespace-nowrap ";
  var CXN = CX+"border-primary/40 bg-card hover:bg-white/10 ";
  var BRILHO = "animate-pulse shadow-[0_0_0_3px_#E8B84B,0_0_14px_3px_rgba(232,184,75,.7)] ";   // brilho no próximo passo: a funcionária só segue o que brilha
  var celula = function(rot, conteudo, grow){ return e("div",{className:"flex min-w-0 flex-col items-center justify-center gap-0.5 border-l border-primary/30 px-2 py-1 first:border-l-0 "+(grow||"flex-1")}, e("span",{className:CAP+" whitespace-nowrap"}, rot || "\u00a0"), conteudo); };
  var tipoSit = jaFeito ? "Acerto registrado" : sel.inicioTs ? "Em atendimento" : "Aguardando";
  var nMulta = vezCobravel(remarcs);
  var cSit = e("span",{className:CX+(sel.inicioTs || jaFeito ? "border-success text-success" : "border-foreground/25")}, tipoSit);
  var cRem = remarcs.length>0 && e("span",{title:remarcs.map(function(r){ return (r.isenta ? "Isenta ("+(r.motivo||"")+")" : "Com multa")+(r.autorizadoPor ? " · autorizada por "+r.autorizadoPor : ""); }).join(" | "), className:CX+"border-primary text-primary"}, "↻ "+remarcs.length+"× "+(nMulta ? "multa" : "isenta"));
  var cAtende = e("div",{className:"relative w-full"},
    e("button",{type:"button", onClick:function(){ setPopAt(!popAt); }, "aria-label":"Quem atende na montagem do kit", className:CXN+(jaFeito && !sel.atendeu ? BRILHO : "")}, (sel.atendeu||"Escolher")+" ▾"),
    popAt && e("button",{type:"button", "aria-label":"Fechar a lista", className:"fixed inset-0 z-20 cursor-default", onClick:function(){ setPopAt(false); }}),
    popAt && e("div",{className:"absolute left-0 top-9 z-30 flex w-full flex-col rounded-md border border-foreground/25 bg-card p-1 shadow-lg"}, QUEM_MONTA.map(function(b){
      return e("button",{key:b.id, type:"button", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{atendeu:b.nome}}); setPopAt(false); }, className:"h-8 rounded px-3 text-left text-[13px] hover:bg-white/10 "+(sel.atendeu===b.nome ? "font-semibold text-primary" : "")}, b.nome); })));
  var cEscolha = !sel.escolhaIni ? (jaFeito ? e("span",{className:CX+"border-primary/40"},"—") : e("button",{type:"button", onClick:iniciarEscolha, title:"A revendedora começou a escolher o kit", className:CXN+(fechouPagamentos ? BRILHO : "")}, "⏱ Começou"))
    : e("span",{className:CX+(estourou ? "border-destructive text-destructive" : "border-foreground/25")}, e("b",{className:"font-semibold tabular-nums"}, relogio(decorridoSeg)), maxEscolhaMin>0 && e("span",{className:"text-[11px] uppercase"}, "/ "+maxEscolhaMin+" min"),
        escolhendo && e("button",{type:"button", onClick:terminarEscolha, title:"Terminou de escolher", className:"grid h-8 w-8 place-items-center rounded-md border border-foreground/25 text-[13px] hover:bg-white/10"}, "■"));
  var cInicio = jaFeito ? (durMin ? e("span",{className:CX+"border-primary/40"}, "Bipagem · "+durMin+" min") : sel.fimTs ? e("span",{className:CX+"border-primary/40"}, "Finalizada às "+sel.fim)
        : e("button",{type:"button", onClick:function(){ d({type:"INT_FINALIZAR", id:sel.id}); }, className:CXN}, "■ Finalizar bipagem"))
    : sel.inicioTs ? e("span",{className:CX+"border-success text-success"}, "✓ Iniciado "+hhmmDeTs(sel.inicioTs))
    : e("button",{type:"button", onClick:function(){ iniciar(); setPassoAt(0); }, className:CX+BRILHO+"border-primary bg-background font-semibold text-primary hover:bg-card"}, "▶ Iniciar atendimento");
  var topoCard = React.Children.toArray([
        // até 2 atendimentos abertos ao mesmo tempo (uma escolhe o kit enquanto a outra é atendida)
        e("div",{className:"flex items-center gap-1.5 border-b-2 border-primary/50 bg-sidebar px-2 pt-2"},
          abasUI.map(function(x){ var on = x.id===sel.id;
            return e("div",{key:x.id, className:"flex items-center gap-1 rounded-t-lg px-3 py-1.5 text-[13px] font-bold "+(on ? "bg-[#E8B84B] text-[#1B1409]" : "bg-white/5 text-foreground hover:bg-white/10")},
              e("button",{type:"button", onClick:function(){ d({type:"INT_SEL", id:x.id}); }}, primeiro(x.nome)+(x.escolhaIni && !x.escolhaFim ? " ⏱" : "")),
              e("button",{type:"button", "aria-label":"Fechar a aba de "+x.nome, title:"Fechar a aba (o que foi preenchido fica guardado)", onClick:function(){ d({type:"INT_FECHAR_ABA", id:x.id}); if(abasUI.length<2) d({type:"ABA", aba:"intlist"}); }, className:"grid size-5 place-items-center rounded-full text-[13px] leading-none hover:bg-black/20"}, "×")); }),
          e("span",{className:"ml-auto pb-1.5 text-[13px] text-muted-foreground"}, abasUI.length<2 ? "Dá para abrir mais 1 atendimento ao mesmo tempo" : "2 abertos · para trocar, clique na outra aba")),
        (function(){
          // topo em tabela fina (versão 4): rótulos em cima, valores embaixo
          var kitSel = e("span",{role:"group", "aria-label":"Kit da revendedora", className:"flex h-8 w-full overflow-hidden rounded-md border border-primary/40"}, [["padrao","Ouro"],["prata","Prata"]].map(function(o){ var on = modTab===o[0];
            return e("button",{key:o[0], type:"button", "aria-pressed":on, disabled:jaFeito, onClick:function(){ escolherMod(o[0]); }, className:"flex-1 px-3 text-[13px] font-medium disabled:opacity-60 "+(on ? (o[0]==="prata" ? "bg-slate-500 text-white" : "bg-primary text-primary-foreground") : "bg-card hover:bg-white/10")}, o[1]); }));
          // Tipo em menu suspenso (Marcus, 11/11/2026): cabe mais tipos sem alargar o cabeçalho
          var TIPOS_AT = [["acerto","Acerto"],["retornando","Kit retornando"],["kit_novo","Kit novo"],["indicacao","Brinde de indicação"],["reposicao","Reposição"],["troca","Troca de peça"]];
          var tipoSel = e("select",{"aria-label":"Tipo de atendimento", value:sel.tipo||"acerto", disabled:jaFeito, onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{tipo:ev.target.value}}); }, className:CXN+"cursor-pointer disabled:opacity-60"}, TIPOS_AT.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
          var avisosTopo = [];
          if(sel.obs) avisosTopo.push(["Observação", sel.obs+(sel.encomenda ? " · Encomenda "+sel.encomenda : "")]);
          if(remarcs.length) avisosTopo.push(["Remarcação", remarcs.length+"× "+(nMulta ? "com multa" : "isenta")+remarcs.map(function(rm){ return " · "+(rm.isenta ? "isenta ("+(rm.motivo||"")+")" : "com multa")+(rm.autorizadoPor ? ", autorizada por "+rm.autorizadoPor : ""); }).join("")]);
          if(chegouMuitoAtrasada) avisosTopo.push(["Chegada", "Chegou "+atrasoChegada+" min depois do horário (tolerância de "+TOLERANCIA_CHEGADA_MIN+" min): perde "+Math.round(DESCONTO_BRINDE_ATRASO*100)+"% do brinde."]);
          var iconeAvisos = e("span",{className:"relative shrink-0"},
            e("button",{type:"button", onClick:function(){ setPopObs(!popObs); }, "aria-label":"Observação e multas", title:"Observação e multas", className:"grid size-8 place-items-center rounded-md border text-[13px] font-bold "+(avisosTopo.length ? "border-primary text-primary" : "border-primary/40")}, "!"),
            popObs && e("button",{type:"button", "aria-label":"Fechar", className:"fixed inset-0 z-20 cursor-default", onClick:function(){ setPopObs(false); }}),
            popObs && e("div",{className:"absolute left-0 top-9 z-30 flex w-72 flex-col rounded-md border border-primary/50 bg-card text-left text-[13px] shadow-lg"},
              avisosTopo.length ? avisosTopo.map(function(x,i){ return e("div",{key:i, className:"px-3 py-2 "+(i ? "border-t border-primary/20" : "")}, e("b",null, x[0]+": "), x[1]); }) : e("p",{className:"px-3 py-2"}, "Sem observação nem multa.")));
          var cols = [
            ["Revendedora", e("span",{className:"flex h-8 w-full min-w-0 items-center justify-center gap-1.5 text-[13px] font-semibold", title:sel.nome}, e("span",{className:"truncate"}, sel.nome), iconeAvisos), "minmax(6rem,1fr)"],
            ["Horário", e("span",{className:"flex h-8 items-center text-[13px] font-semibold tabular-nums"}, sel.hora || "—"), "auto"],
            ["Situação", cSit, "auto"],
            ["Kit", kitSel, "auto"]
          ];
          if(!jaFeito) cols.push(["Tipo", tipoSel, "auto"]);
          cols.push(["Atendimento", cInicio, "auto"]);
          if(sel.inicioTs || jaFeito) cols.push(["Escolha do kit", cEscolha, "auto"]);
          if(jaFeito) cols.push(["Quem atende na montagem", cAtende, "auto"]);   // só depois de finalizar o acerto
          var gradeTopo = e("div",{className:"grid border-b-2 border-primary/50", style:{gridTemplateColumns:cols.map(function(c){ return c[2]; }).join(" ")}},
            cols.map(function(c,i){ return e("div",{key:"h"+i, className:"flex h-[30px] items-center justify-center overflow-hidden whitespace-nowrap border-b border-primary/40 bg-primary/15 px-1 "+(i ? "border-l border-l-primary/30 " : "")+CAP}, c[0]); }),
            cols.map(function(c,i){ return e("div",{key:"v"+i, className:"flex items-center justify-center px-1 py-1.5 "+(i ? "border-l border-primary/30 " : "")+(i<3 ? "bg-primary/15" : "")}, c[1]); }));   // nome, horário e situação: só leitura, com fundo colorido
          // relógio do atendimento (Marcus, 11/11/2026): chegada, início, escolha do kit (começo e fim) e saída
          var hh = function(ts){ return ts ? hhmmDeTs(ts) : "—"; };
          var relogioItens = [["Chegou na empresa", sel.chegada || "—"], ["Atendimento iniciou", hh(sel.inicioTs)], ["Escolha do kit iniciou", hh(sel.escolhaIni)], ["Escolha do kit terminou", hh(sel.escolhaFim)], ["Finalizou e saiu", sel.fim || (sel.fimTs ? hh(sel.fimTs) : "—")]];
          var relogioTopo = e("div",{className:"grid grid-cols-5 border-b-2 border-primary/50"}, relogioItens.map(function(x,i){ return e("div",{key:i, className:"flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1 "+(i ? "border-l border-primary/30" : "")}, e("span",{className:CAP+" whitespace-nowrap"}, x[0]), e("span",{className:"flex h-8 items-center text-[13px] font-semibold tabular-nums"}, x[1])); }));
          return e(React.Fragment,null, gradeTopo, relogioTopo);
        })(),
        estourou && e("p",{role:"alert", className:"border-b border-destructive/50 bg-destructive/20 px-4 py-2 text-center text-[13px] font-bold text-destructive"},"⏰ O tempo para escolher o kit acabou ("+maxEscolhaMin+" min). Chame a revendedora: há outro atendimento aguardando."),
        avisoIni && e(AvisoLeitura,{key:"avIni", titulo:"Leia para a revendedora antes de começar", texto:textoAntesEscolha(maxEscolhaMin), botao:"Li para ela · começar o tempo", onOk:confirmaInicioEscolha, onCancelar:function(){ setAvisoIni(false); }}),
        estourou && !sel.escolhaAvisoFim && e(AvisoLeitura,{key:"avFim", titulo:"O tempo acabou. Leia para a revendedora", texto:textoFimEscolha(maxEscolhaMin), botao:"Li para ela", onOk:confirmaFimEscolha})
  ]);
  var cartao = function(corpo){ return e("div",{className:"@container flex min-w-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"}, topoCard, corpo); };

  // ── estação 1: condicionais (esquerda) e vendas (direita) ──
  var GCOND = " grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_4.5rem_2rem]";
  var tabCond = e("div",{className:CTP},
    e("div",{className:CABT+GCOND}, e("span",null,"Nº"), e("span",null,"Valor"), e("span",null,"Peças"), e("span")),
    condicionais.map(function(c,i){ return e("div",{key:i, className:LIN+GCOND},
      e("input",{value:c.numero, disabled:jaFeito, inputMode:"numeric", "aria-label":"Número da condicional "+(i+1), className:CPT, onChange:function(ev){ editCond(i,{numero:soDigitos(ev.target.value,8)}); }}),
      e(CampoDinheiro,{value:c.valor, disabled:jaFeito, label:"Valor da condicional "+(i+1), className:CPT, onChange:function(v){ editCond(i,{valor:v||0}); }}),
      e("input",{value:c.pecas>0 ? c.pecas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Peças da condicional "+(i+1), className:CPT, onChange:function(ev){ editCond(i,{pecas:Number(soDigitos(ev.target.value,4))||0}); }}),
      jaFeito ? e("span") : e(Remover,{label:"Remover condicional "+c.numero, onClick:function(){ setConds(condicionais.filter(function(x,j){ return j!==i; })); }})); }),
    e("div",{className:"flex-1"}),
    !jaFeito && condNovaAberta && e("div",{className:LIN+GCOND+" bg-primary/15!"},
      e("input",{value:condManual.numero, inputMode:"numeric", placeholder:"Nº", "aria-label":"Número da nova condicional", className:CPT, onKeyDown:onEnter(addCond), onChange:function(ev){ setCondManual(Object.assign({}, condManual, {numero:soDigitos(ev.target.value,8)})); }}),
      e(CampoDinheiro,{value:condManual.valor, label:"Valor da nova condicional", className:CPT, onChange:function(v){ setCondManual(Object.assign({}, condManual, {valor:v})); }}),
      e("input",{value:condManual.pecas, inputMode:"numeric", placeholder:"0", "aria-label":"Peças da nova condicional", className:CPT, onKeyDown:onEnter(addCond), onChange:function(ev){ setCondManual(Object.assign({}, condManual, {pecas:soDigitos(ev.target.value,4)})); }}),
      e("button",{type:"button", disabled:!condOk, onClick:function(){ addCond(); setCondNovaAberta(false); }, "aria-label":"Adicionar condicional", className:"grid h-8 w-8 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground disabled:opacity-40"},"+")),
    !jaFeito && !condNovaAberta && e("button",{type:"button", onClick:function(){ setCondNovaAberta(true); }, className:"h-8 w-full border-t border-primary/20 text-[13px] font-medium hover:bg-white/5 hover:text-primary"}, "+ Condicional a mais (à mão)"),
    faixaSolta([{t:"Total", v:din(totalCondValor), cor:"text-primary"}, {t:"Peças", v:String(totalCondPecas)},
      {t:"Vendidas", v:totalVendidas>0 ? String(totalVendidas) : "—"},   // a funcionária preenche em Vendas › Peças vendidas
      {t:"Voltam", v:totalCondPecas>0 ? String(pecasRetornar) : "—", cor:"text-primary"}]));
  var pctDesc = pa ? pa.descontoRemarcacao.comissaoPct+pa.atrasoPct : 0;
  var tabVendas = e("div",{className:CTP},
    e("div",{className:CABT+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Item"), e("span",null,"Valor")),
    linhaKV("Quanto vendeu", e(CampoDinheiro,{value:form.vendaBruta, mostraZero:true, label:"Valor total vendido", className:CPT, onChange:function(v){ up({vendaBruta:v, semVenda:v===0}); }})),   // digitar 0 também vale como "sem venda" (10/11/2026, Estela)
    !jaFeito && e("button",{key:"sv", type:"button", onClick:function(){ if(!form.semVenda) setPassoAt(6); up(form.semVenda ? {vendaBruta:null, semVenda:false} : {vendaBruta:0, semVenda:true}); }, className:(form.semVenda ? "" : BRILHO)+"m-2 h-8 rounded-md border border-primary/60 bg-primary/10 px-3 text-[13px] font-semibold text-primary hover:bg-primary/20"}, form.semVenda ? "✓ Sem venda (R$ 0,00) · desfazer" : "Não teve venda (R$ 0,00)"),
    !jaFeito && !temVenda && e("p",{key:"svh", className:"px-3 pb-2 text-center text-[13px] font-semibold"}, "Para continuar: digite o valor vendido ou clique em Não teve venda."),
    linhaKV("Peças vendidas", e("input",{value:totalVendidas>0 ? totalVendidas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Quantidade de peças vendidas", className:CPT, onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendidasTotal:Number(soDigitos(ev.target.value,4))||0}}); }}), {z:true}),
    form.vendaBruta>0 && !sel.creditoVisto && !jaFeito && e("div",{key:"cc", className:"m-2 flex flex-col items-center gap-1.5 rounded-md border-2 border-primary bg-primary/15 p-2 text-center text-[13px] "+BRILHO},
      e("b",null,"Desconto de crédito"), e("span",null,"Esse crédito vem do setor de Trocas. Preencha só se o setor informar."),
      e("button",{type:"button", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{creditoVisto:true}}); }, className:"h-8 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground"}, "Entendi")),
    form.vendaBruta>0 && linhaKV("Desconto de crédito", e(CampoDinheiro,{value:form.garantia, label:"Desconto de crédito (garantia)", className:CPT, onChange:function(v){ up({garantia:v||0}); }}), {z:true, pill:"Trocas"}),
    (ehPrata || dv.novas) && linhaKV(dv.novas ? "Dias de atraso do acerto" : "Dias de atraso (Prata)", e("input",{type:"number", value:form.atrasoDias||0, disabled:true, readOnly:true, title:"Quem preenche é a Tamara (agendamento)", "aria-label":"Dias de atraso (a Tamara preenche)", className:CPT+" cursor-not-allowed opacity-60"}), {pill:"Tamara"}));
  var tabAcerto = e("div",{className:CTP},
    e("div",{className:CABT+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Item"), e("span",null,"Valor")),
    linhaKV("Venda líquida", n15(pa ? din(pa.vendaLiquida) : "—"), {z:true}),
    pctDesc>0 && linhaKV("Remarcação / atraso", pilula("−"+pctDesc+"% comissão"+(pa.descontoRemarcacao.brindePct>0 ? " · brinde −"+pa.descontoRemarcacao.brindePct+"%" : ""), "border-primary text-primary"), {z:true}),
    linhaKV("Brinde normal libera", n15(pa ? din(faixaBr ? Math.round(faixaBr.bn*fatorBr) : 0) : "—")),
    linhaKV("Brinde select libera", n15(pa ? din(faixaBr ? Math.round(faixaBr.bb*fatorBr) : 0) : "—"), {z:true}),
    e("div",{className:"flex-1"}),
    linhaKV("Comissão", n15(pa ? din(pa.comissao) : "—"), {pill:pa ? pa.comissaoPct+"%" : ""}),
    e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Valor do acerto"), e("b",{className:"text-[15px] font-semibold tabular-nums text-primary"}, pa ? din(dv.totalAPagar) : "—")),
    dv.restanteTotal>0.009 && pa && linhaKV("Falta pagar", e("b",{className:"text-[15px] font-semibold tabular-nums text-destructive"}, din(dv.restanteTotal))));
  var notasVendas = e("div",{className:"flex flex-col gap-1"},
    avisoDivida && e("p",{className:"text-center text-[13px] font-semibold text-destructive"}, avisoDivida),
    dv.novas && pa && (form.atrasoDias||0)>0 && e("p",{className:"text-center text-[13px] font-semibold text-destructive"}, pa.juridico ? "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico." : "Atraso: perde "+pa.atrasoPct+"% da comissão e "+(pa.atrasoBrindePct||0)+"% do brinde."),
    pa && pa.semFaixa && e(Aviso,null,"Abaixo de "+din(versao.gerais.minRenovar)+" de venda: sem comissão."+(ehPrata ? " Kit 100% Prata não renova." : "")));

  // ── estação 2: pagamentos (forma e valor; o financeiro define as contas) ──
  var BANDEIRAS = ["Visa","Mastercard","Elo","Amex","Hipercard"];
  var pedeBand = /cr[eé]dito|d[eé]bito|link/i.test(fl.label||"");
  var addPagB = function(){ if(pedeBand && !lancForm.bandeira) return; addPag(); };
  // Links de pagamento JÁ PAGOS desta revendedora (setor Link de pagamento): entram como pagamento já resolvido, sem esperar o financeiro definir conta (Marcus, 11/11/2026)
  var infoLinks = s.lp && sel ? linksParaAcertoPorNome(s, sel.nome) : null;
  var linksEmUso = {}; form.pagamentos.forEach(function(q){ if(q.linkSolId) linksEmUso[q.linkSolId] = 1; });
  var linksPagos = infoLinks ? infoLinks.pagos.filter(function(x){ return !linksEmUso[x.sol.id]; }) : [];
  var linksAguardando = infoLinks ? infoLinks.aguardando : [];
  var contaDoLink = function(sol){ var m = meioDe(s, sol.meioId), lista = formaDe("link").descricoes || [], dsc = m && m.cnpjId ? lista.find(function(c){ return String(c).replace(/\s+/g, " ").endsWith(" - "+m.cnpjId); }) : null; return dsc || (lista.length===1 ? lista[0] : (m ? m.nome : "LINK")); };
  var usarLinkPago = function(x){
    var sol = x.sol, falta = Math.max(0, Math.round((dv.restanteTotal||0)*100)/100), valor = Math.min(sol.valor, falta); if(!(valor>0) || jaFeito) return;
    up({pagamentos:form.pagamentos.concat([{forma:"link", valor:valor, parcelas:sol.parcelas || 1, bandeira:sol.bandeira || "", linkSolId:sol.id, jaPagoLink:true, descricao:contaDoLink(sol)}])}); };
  var blocoLinks = !jaFeito && (linksPagos.length>0 || linksAguardando.length>0) && e("div",{className:"flex flex-col border-t border-foreground/25"},
    e("span",{className:CAP+" px-2 pt-2 text-center"}, "Links de pagamento desta revendedora"),
    linksPagos.map(function(x){ var sol = x.sol; return e("div",{key:sol.id, className:"flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 text-[13px]"},
      e("span",{className:"font-semibold"}, "Já pago · "+din(sol.valor)+(sol.parcelas>1 ? " em "+sol.parcelas+"x" : "")+" · "+formatarDia(sol.pagoEm)+(x.usavel ? "" : " · pago hoje: conta só no próximo acerto")),
      x.usavel && e("button",{type:"button", disabled:!(dv.restanteTotal>0.009), onClick:function(){ usarLinkPago(x); }, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, "Usar como pagamento")); }),
    linksAguardando.map(function(sol){ return e("p",{key:sol.id, className:"px-2 py-1 text-center text-[13px]"}, "Link aguardando pagamento · "+din(sol.valor)+": só conta depois de pago."); }));
  var listaFormas = e("div",{className:"flex flex-col"}, formas.map(function(f,i){ var on = lancForm.forma===f.k;
    return e("button",{key:f.k, type:"button", disabled:jaFeito, onClick:function(){ setLancForm(Object.assign({}, lancForm, {forma:f.k, parcelas:1, bandeira:""})); },
      className:"flex min-h-8 items-center justify-center text-[13px] hover:bg-white/5 "+(on ? "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]" : (i%2 ? "bg-white/[0.03]" : ""))}, f.label); }));
  var linhaBand = pedeBand && !jaFeito && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5 border-t border-foreground/25 px-2 pt-2"}, e("span",{className:CAP}, "Bandeira"),
    BANDEIRAS.map(function(b){ var on = lancForm.bandeira===b; return e("button",{key:b, type:"button", onClick:function(){ setLancForm(Object.assign({}, lancForm, {bandeira:b})); }, className:"h-8 rounded-md border px-2.5 text-[13px] font-medium "+(on ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25 bg-card hover:bg-white/10")}, b); }));
  var linhaEntrada = !jaFeito && e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-foreground/25 p-2"}, e("span",{className:CAP}, fl.label||"Forma"),
    e(CampoDinheiro,{value:lancForm.valor, label:"Valor do pagamento", className:CPT+" w-28!", placeholder:"R$ 0,00", onChange:function(v){ setLancForm(Object.assign({}, lancForm, {valor:v})); }}),
    fl.parcelas && e("span",{className:"inline-flex items-center gap-1"}, e("button",{type:"button", onClick:function(){ setLancForm(Object.assign({}, lancForm, {parcelas:Math.max(1,(lancForm.parcelas||1)-1)})); }, className:"h-8 w-8 rounded-md border border-foreground/25 bg-card"}, "−"), e("b",{className:"min-w-8 text-center text-[13px] tabular-nums"}, (lancForm.parcelas||1)+"x"), e("button",{type:"button", onClick:function(){ setLancForm(Object.assign({}, lancForm, {parcelas:Math.min(6,(lancForm.parcelas||1)+1)})); }, className:"h-8 w-8 rounded-md border border-foreground/25 bg-card"}, "+")),
    e("button",{type:"button", disabled:!lancOk || (pedeBand && !lancForm.bandeira), onClick:addPagB, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, "Adicionar"));
  var GPAG = " grid-cols-[minmax(0,1.5fr)_3.5rem_6.5rem_2rem]";
  var tabPag = e("div",{className:CTB+" flex-none"}, e("div",{className:CABT+GPAG}, e("span",null,"Forma"), e("span",null,"Parc."), e("span",null,"Valor"), e("span")),
    form.pagamentos.length ? form.pagamentos.map(function(q,i){ return e("div",{key:i, className:LIN+GPAG+(i%2 ? " bg-white/[0.03]" : "")},
      e("span",{className:"flex flex-col items-center"}, formaDe(q.forma).label, q.bandeira && e("span",{className:CAP}, q.bandeira), q.jaPagoLink && e("span",{className:CAP}, "já pago no link")), e("span",null, q.parcelas>1 ? q.parcelas+"x" : "À vista"), n15(din(q.valor)),
      jaFeito ? e("span") : e(Remover,{label:"Remover pagamento", onClick:function(){ cancelarPag(i); }})); })
    : e("div",{className:LIN},e("span",{className:CAP},"Nenhuma forma selecionada")));
  var tabTotPag = e("div",{className:CTB+" flex-none"}, e("div",{className:CABT+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Totais"), e("span")),
    linhaKV("Valor do acerto", n15(pa ? din(dv.totalAPagar) : "—")), linhaKV("Pagamentos", n15(din(dv.totalPagoAtual), "text-success"), {z:true}),
    e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Falta pagar"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(dv.restanteTotal>0.009 ? "text-destructive" : "text-success")}, din(dv.restanteTotal))));
  var est1 = metades("@[52rem]:grid-cols-2 grid-cols-1", lado("Selecione a forma de pagamento", e("div",{className:CTB}, e("div",{className:"flex-1"}, listaFormas), blocoLinks, linhaBand, linhaEntrada)), lado("Formas de pagamento selecionadas", [tabPag, tabTotPag, pPag]));

  // ── estação 3: brindes normal e select (código da peça + valor) ──
  var blocoBr = function(cat, titulo, lib, lanc, st, setSt){
    var lista = form.brindes.map(function(b,i){ return {b:b, i:i}; }).filter(function(x){ return x.b.cat===cat; });
    var codOk = codigoBrindeValido(cat, st.codigo), travado = travaBrinde || jaFeito;
    var GB = " grid-cols-[minmax(0,1fr)_6.5rem_2rem]";
    return lado(titulo, e("div",{className:CTB},
      e("div",{className:CABT+GB}, e("span",null,"Código"), e("span",null,"Valor"), e("span")),
      lista.length ? lista.map(function(x,k){ return e("div",{key:x.i, className:LIN+GB+(k%2 ? " bg-white/[0.03]" : "")}, e("b",{className:MONO}, x.b.codigo), n15(din(x.b.valor)),
        jaFeito ? e("span") : e(Remover,{label:"Remover peça "+x.b.codigo, onClick:function(){ up({brindes:form.brindes.filter(function(y,j){ return j!==x.i; })}); }})); })
      : e("div",{className:LIN},e("span",{className:CAP},"Nenhuma peça lançada")),
      !travado && e("div",{className:LIN+GB+" bg-primary/15!"},
        e("input",{value:st.codigo, placeholder:cat==="bb" ? "BB0001" : "Código", "aria-label":"Código da peça "+titulo, autoCapitalize:"characters", className:CPT+" uppercase",
          onFocus:function(){ if(cat==="bb" && !st.codigo) setSt(Object.assign({}, st, {codigo:"BB"})); },
          onChange:function(ev){ var c = normalizarCodigo(ev.target.value).slice(0,12); if(cat==="bb" && c) c = "BB"+c.replace(/^B{1,2}/,""); setSt(Object.assign({}, st, {codigo:c})); }}),
        e(CampoReais,{id:"bv-"+cat, value:st.valor, label:"Valor da peça "+titulo, className:CPT, placeholder:"R$ 0,00", onChange:function(v){ setSt(Object.assign({}, st, {valor:v})); }}),
        e("button",{type:"button", disabled:!(codOk && st.valor>0), onClick:function(){ addBrinde(cat, st, setSt); }, "aria-label":"Lançar peça", className:"grid h-8 w-8 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground disabled:opacity-40"}, "+")),
      e("div",{className:"flex-1"}),
      faixaCel([{t:"Libera", v:din(lib)}, {t:"Lançado", v:din(lanc)}, {t:"Resta", v:din(Math.max(0, lib-lanc)), cor:"text-primary"}]),
      cat==="normal" && motivosBr.length>0 && e("div",{className:"border-t border-foreground/25 px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-[.05em]"}, "Redução: "+motivosBr.join(" · "))));
  };
  var est2 = !pa ? e("div",{className:"flex flex-1 items-center justify-center p-6 text-[13px] text-muted-foreground"}, "Lance as vendas e os pagamentos primeiro.")
    : dv.brindeBloqueio ? e("div",{className:"p-3"}, e(Aviso,{tom:"vermelho"},"Brinde bloqueado — "+dv.brindeBloqueio.frase+(dv.faltaAtual>0.009 ? " (falta "+din(dv.faltaAtual)+")" : "")))
    : e("div",{className:"flex min-w-0 flex-1 flex-col"},
        travaBrinde && e("p",{className:"border-b border-foreground/25 bg-primary/10 px-3 py-1.5 text-center text-[13px] font-semibold text-primary"},"Os campos de brinde abrem quando o financeiro confirmar todos os pagamentos."),
        metades("@[52rem]:grid-cols-2 grid-cols-1", blocoBr("normal","Brinde normal", dv.libN, cb.lancadoNormal, bnIn, setBnIn), blocoBr("bb","Brinde select (BB)", dv.libS, cb.lancadoSelect, bbIn, setBbIn)),
        dv.excedenteBrinde>0 && e("p",{className:"border-t border-foreground/25 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, "Diferença do brinde: "+din(dv.excedenteBrinde)+" soma no valor a pagar (financeiro define a conta)."));

  // ── estação: valor do kit (venda atual, 2 anteriores, média e a faixa da tabela) ──
  var tabMedia = e("div",{className:CTP},
    e("div",{className:CABT+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Item"), e("span",null,"Valor")),
    linhaKV("Venda atual", n15(form.vendaBruta>0 ? din(form.vendaBruta) : "—")),
    temHist ? vendasMedia.filter(function(x){ return !x.atual; }).map(function(x,i){ return linhaKV(MESES_CURTO[+x.mes.slice(5,7)-1]+"/"+x.mes.slice(2,4), n15(din(x.venda)), {z:i%2===0}); })
      : [linhaKV("Venda anterior", e(CampoDinheiro,{value:vendasAnt[0], disabled:jaFeito, label:"Venda anterior", className:CPT, onChange:function(v){ setVendaAnt(0, v); }}), {z:true}),
         linhaKV("Venda mais antiga", e(CampoDinheiro,{value:vendasAnt[1], disabled:jaFeito, label:"Venda mais antiga", className:CPT, onChange:function(v){ setVendaAnt(1, v); }}))],
    linhaKV("Média ("+vendasMedia.length+(vendasMedia.length===1 ? " venda" : " vendas")+")"+(dv.novas && dv.minimo.regra ? " · mínimo "+din(dv.minimo.ref) : ""), n15(mediaVendas!==null ? din(mediaVendas) : "—"), {z:true}),
    e("div",{className:"flex-1"}),
    e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] min-h-10 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Kit a liberar"), e("b",{className:"text-[15px] font-semibold tabular-nums text-primary"}, kitLiberado ? din(kitLiberado) : avKit.motivo ? "Não libera" : "—")),
    !temHist && e("p",{className:"border-t border-primary/20 px-3 py-2 text-center text-[13px]"}, "Sem histórico cadastrado: digite as 2 vendas anteriores."),
    avKit.motivo && mediaVendas!==null && e("p",{className:"border-t border-destructive px-3 py-2 text-center text-[13px] font-bold text-destructive"}, avKit.motivo),
    avisoMedia && e("p",{className:"border-t border-destructive px-3 py-2 text-center text-[13px] font-bold text-destructive"}, avisoMedia));
  var tabFaixas = e("div",{className:CTP},
    e("div",{className:CABT+" grid-cols-2"}, e("span",null,"Média das vendas"), e("span",null,"Kit liberado")),
    tabKit.map(function(x,i){ var on = faixaKit && faixaKit.min===x.min;
      return e("div",{key:i, className:LIN+" grid-cols-2 "+(on ? "border-primary bg-primary/15! font-semibold text-primary" : "")}, e("span",null,faixaKitTxt(i,x)), e("b",{className:"font-semibold"}, BK(x.kit))); }));
  var estKit = metades("@[52rem]:grid-cols-2 grid-cols-1", lado("Média das vendas", tabMedia, "", "p-0"), lado("Valor do kit · estoque "+estoqueAtivo, tabFaixas, "", "p-0"));

  // ── estação 4: condicional nova (liberação do kit novo e escolha) ──
  var okKit = dv.kitNovoLiberado;
  var rotKit = !okKit ? (dv.blocoDivida ? dv.blocoDivida : dv.novas && dv.kitNovoRegra && !dv.kitNovoRegra.liberado ? dv.kitNovoRegra.texto+"." : "Falta pagar para liberar. Abaixo de "+dv.kitNovoMin+"% só com autorização do financeiro.") : "";
  var tabKit = e("div",{className:CTB},
    e("div",{className:CABT+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Item"), e("span",null,"Valor")),
    linhaKV("Pago do acerto (mínimo "+dv.kitNovoMin+"%)", n15(N1(dv.pctPagoAcerto)+"%", okKit ? "text-success" : "text-destructive")),
    linhaKV("Kit a liberar", n15(kitLiberado ? din(kitLiberado) : avKit.motivo ? "Não libera" : "—")),
    linhaKV("Dívida anterior", n15(din(dv.dividaAnterior||0)), {z:true}),
    e("div",{className:"flex-1"}),
    e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] min-h-10 font-semibold "+(okKit ? "border-y border-success bg-success/15!" : "border-y border-destructive bg-destructive/15!")}, e("span",null,"Kit novo"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(okKit ? "text-success" : "text-destructive")}, okKit ? "✓ Liberado" : "✗ Não liberado")));
  var listaEsc = e("div",{className:"flex flex-col"}, escolhas.map(function(x,i){ var on = continuaEf===x[0], bloq = x[3] || jaFeito;
    return e("button",{key:x[0], type:"button", disabled:bloq, onClick:function(){ up({continua:x[0]}); }, "aria-pressed":on,
      className:"flex min-h-8 items-center justify-center gap-2 text-[13px] disabled:opacity-40 hover:bg-white/5 "+(on ? "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]" : (i%2 ? "bg-white/[0.03]" : ""))}, x[1].replace(/^[✓✗] /,""), x[3] && e("span",{className:CAP},"bloqueado")); }));
  var tabEsc = e("div",{className:CTB},
    e("div",{className:"flex-none"}, listaEsc),
    continuaEf==="sim" && e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] bg-primary/10"}, e("span",null,"Nº da condicional nova"), e("input",{value:form.novaCond||"", disabled:jaFeito, inputMode:"numeric", placeholder:"000000", "aria-label":"Número da condicional nova", className:CPT, onChange:function(ev){ up({novaCond:ev.target.value.replace(/\D/g,"").slice(0,8)}); }})),
    e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Condicionais que continuam"), e("span",{className:CAP}, condFicam.length ? condFicam.map(function(c){ return c.numero; }).join(", ") : "Nenhuma")),
    e("div",{className:"flex-1"}),
    e("p",{className:"border-t border-foreground/25 px-3 py-2 text-center text-[13px] "+(okKit ? "font-semibold text-success" : "font-semibold text-destructive")}, okKit ? "Kit novo liberado: ela pode continuar." : rotKit));
  var est3 = semPag ? e("div",{className:"flex flex-1 items-center justify-center p-6 text-[13px] text-muted-foreground"}, "Lance vendas e pagamentos primeiro.")
    : metades("@[52rem]:grid-cols-2 grid-cols-1", lado("Kit novo · liberação", tabKit), lado("Continua vendendo?", tabEsc));

  // ── estação 5: regras do consignado, lidas uma a uma com os números da regra em vigor ──
  var efReg = versaoBase ? versaoEfetiva(versaoBase, modalidade) : null, NV = versaoBase && versaoBase.novas ? versaoBase.novas : null;
  var NOVAS_T = {"Venda mínima":1, "Acerto na data":1, "Pagamento":1, "Brinde":1, "Kit novo":1};
  var numerosRegra = function(t){ var g = efReg ? efReg.gerais : {}, lst = [];
    if(!efReg) return lst;
    if(t==="Comissão") efReg.faixas.slice().sort(function(a,b){ return a.min-b.min; }).forEach(function(f){ lst.push(["Venda a partir de "+din(f.min), f.pct+"%"]); });
    else if(t==="Taxa de deslocamento") lst.push(["Venda abaixo de "+din(g.taxaAbaixoDe), din(((efReg.taxaBaixa||[])[0]||{}).taxa||0)], ["Atendimento na Sorelly","Sem taxa"]);
    else if(t==="Venda mínima" && NV) lst.push(["Média mínima (representante)", din(NV.minimoRepresentante)], ["Média mínima (Sorelly)", din(NV.minimoInterno)], ["Vendas na média", String(NV.mediaVendas)]);
    else if(t==="Acerto na data" && NV){ var ant = 0; NV.atrasoAcerto.slice().sort(function(a,b){ return a.ate-b.ate; }).forEach(function(x){ lst.push([(ant+1)+" a "+x.ate+" dias", "−"+x.comissaoPct+"% comissão e −"+x.brindePct+"% brinde"]); ant = x.ate; }); lst.push([NV.juridicoDias+" dias","Perde tudo"]); }
    else if(t==="Remarcação") efReg.remarcacao.forEach(function(x,i,arr){ lst.push([(i+1)+"ª vez"+(i===arr.length-1 ? " em diante" : ""), "−"+x.comissaoPct+"% comissão · "+(x.brindePct>=100 ? "sem brinde" : "−"+x.brindePct+"% brinde")]); });
    else if(t==="Pagamento" && NV) lst.push(["Multa sobre o pendente", NV.multaPendentePct+"%"], ["Prazo para quitar", NV.prazoQuitarDias+" dias"], ["Depois do prazo","+"+NV.atrasoQuitacaoPctDia+"% ao dia, até "+NV.atrasoQuitacaoTetoPct+"%"]);
    else if(t==="Brinde"){ (efReg.pagamentoBrinde||[]).filter(function(x){ return x.max>0; }).forEach(function(x,i,arr){ lst.push(["Faltou "+(i>0 ? "de "+arr[i-1].max+"% até " : "até ")+x.max+"%", Math.round(x.fator*100)+"% do brinde"]); }); var ult = (efReg.pagamentoBrinde||[]); if(ult.length) lst.push(["Faltou mais de "+ult[ult.length-1].max+"%","Sem brinde"]); }
    else if(t==="Kit novo") lst.push(["Acerto pago", g.kitNovoMinPct+"% ou mais"]);
    else if(t==="Peças") lst.push(["Tag riscada ou extraviada", din(g.taxaTagExtraviada)]);
    else if(t==="Horário do acerto") lst.push(["Tolerância de chegada", TOLERANCIA_CHEGADA_MIN+" min"], ["Depois da tolerância","−"+Math.round(DESCONTO_BRINDE_ATRASO*100)+"% do brinde"]);
    return lst; };
  var rSel = Math.min(regraSel, Math.max(0, regras.length-1)), regA = regras[rSel] || {t:"", x:""};
  var marcarLida = function(){ var o = Object.assign({}, regrasOk); o[rSel] = !o[rSel]; setRegrasOk(o); if(o[rSel]){ for(var k=1;k<=regras.length;k++){ var q = (rSel+k)%regras.length; if(!o[q]){ setRegraSel(q); break; } } } };
  var listaRegras2 = e("div",{className:"flex flex-1 flex-col"}, regras.map(function(r,i){ var on = i===rSel, lida = !!regrasOk[i];
    return e("button",{key:i, type:"button", onClick:function(){ setRegraSel(i); }, className:"flex min-h-8 flex-1 items-center gap-2 px-2.5 text-left text-[13px] hover:bg-white/5 "+(on ? "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]" : (i%2 ? "bg-white/[0.03]" : ""))},
      e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold "+(lida ? "border-success bg-success text-white" : "border-foreground/25")}, lida ? "✓" : i+1),
      e("span",{className:"min-w-0 flex-1 truncate"}, r.t), versaoBase && versaoBase.novas && NOVAS_T[r.t] && pilula("Nova","border-primary text-primary")); }));
  var nums = numerosRegra(regA.t);
  var tabRegra = e("div",{className:CTB},
    e("div",{className:"flex-none p-3 text-left text-[13px] leading-relaxed"}, versaoBase && versaoBase.novas && NOVAS_T[regA.t] && e("span",{className:"mb-1.5 inline-flex"}, pilula("Regra nova (27/10/2026)","border-primary text-primary")), e("p",null, regA.x)),
    nums.length>0 && e("div",{className:CABT+" grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"}, e("span",null,"Em números"), e("span",null,"Valor")),
    nums.map(function(x,i){ return e("div",{key:i, className:LIN+" grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"+(i%2 ? " bg-white/[0.03]" : "")}, e("span",{className:"whitespace-nowrap"},x[0]), e("b",{className:"text-[13px] font-semibold"}, x[1])); }),
    e("div",{className:"flex-1"}),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t-2 border-primary/50 p-2"}, e("button",{type:"button", onClick:marcarLida, className:"h-8 rounded-md border px-4 text-[13px] font-semibold "+(regrasOk[rSel] ? "border-foreground/25 bg-card" : "border-primary bg-primary text-primary-foreground")}, regrasOk[rSel] ? "✓ Regra lida · desfazer" : "Li e expliquei esta regra"),
      cienteOk && e("button",{type:"button", disabled:!pronto, onClick:registrar, title:!temVenda ? "Falta o valor vendido." : !continuaEf ? "Falta escolher se ela continua (condicional nova)." : "Registra o atendimento", className:"h-8 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, retornando ? "Finalizar atendimento" : "Registrar acerto")));
  var est4 = (jaFeito || msgs) ? e("div",{className:"flex flex-1 flex-col gap-3 p-3"}, pRegras)
    : e("div",{className:"flex min-w-0 flex-1 flex-col"},
        termoAnt && e("div",{className:"flex justify-center gap-1.5 border-b border-foreground/25 p-2"}, [["agora","Passar as regras agora"],["anterior","Termo do mês anterior"]].map(function(x){ var on = abaRegras===x[0];
          return e("button",{key:x[0], type:"button", onClick:function(){ setAbaRegras(x[0]); }, "aria-pressed":on, className:"h-8 rounded-md px-4 text-[13px] font-semibold border "+(on ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25 bg-card hover:bg-white/10")}, x[1]); })),
        termoAnt && abaRegras==="anterior" ? e("div",{className:"p-3"}, painelTermo)
        : e(React.Fragment,null, metades("@[52rem]:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] grid-cols-1", lado("Regras do consignado · "+regras.length, e("div",{className:CTB}, listaRegras2)), lado((rSel+1)+" · "+regA.t, tabRegra))));

  // ── lateral de estações + navegação ──
  // etapas travadas em ordem: Atendimento → Condicionais → Vendas → o resto. Travada = apagada, com "Bloqueada"; a etapa de agora tem fundo dourado.
  var condPronta = condicionais.length>0 && condicionais.every(function(c){ return c.pecas>0; });
  var confCond = function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{condOk:true}}); setPassoAt(1); };
  var estCond = e("div",{className:"flex min-w-0 flex-1 flex-col"}, lado("Condicionais", tabCond, "flex-1", "p-0"),
    e("div",{className:"flex justify-center gap-2 border-t-2 border-primary/50 p-2"},
      sel.condOk || jaFeito ? e("span",{className:CX+"w-auto! border-success text-success"}, "✓ Condicionais confirmadas") : e("button",{type:"button", disabled:!condPronta, onClick:confCond, title:condPronta ? "" : "Falta o número, o valor e as peças de cada condicional.", className:"h-8 min-w-48 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-40 "+(condPronta ? BRILHO : "")}, "Confirmar condicionais"),
      sel.condOk && !jaFeito && e("button",{type:"button", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{condOk:false}}); }, className:"h-8 rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "Corrigir")));
  var estVendas = e("div",{className:"flex min-w-0 flex-1 flex-col"}, metades("@[52rem]:grid-cols-2 grid-cols-1", lado("Vendas", [tabVendas, notasVendas], "", "gap-0! p-0"), lado("Acerto", tabAcerto, "", "gap-0! p-0")));
  var estEscolha = e("div",{className:"flex min-w-0 flex-1 flex-col"}, lado("Escolha do kit · "+(sel.tipo==="kit_novo" ? "Kit novo" : "Kit retornando"), e("div",{className:"flex flex-col items-center justify-center gap-3 p-6 text-center text-[13px]"},
    e("p",{className:"font-semibold"}, "A revendedora escolhe as peças do kit. Tempo máximo: 60 minutos."),
    sel.tipo==="retornando" && e("div",{className:"flex w-full max-w-md flex-col gap-1 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-left font-semibold"},
      !histRet ? e("span",null, !codDm ? "Sem código DevMaster desta revendedora: defina o valor do kit à mão." : sel.vendasDmErro ? "Sem vendas anteriores na DevMaster: defina o valor do kit à mão." : "Buscando as últimas vendas na DevMaster…") : [
        e("div",{key:"t", className:"flex justify-between"}, e("span",null,"Média das últimas "+avRet.lista.length+" vendas"), e("b",null, avRet.media!=null ? din(avRet.media) : "—")),
        avRet.lista.map(function(x,i){ return e("div",{key:i, className:"flex justify-between pl-3 font-medium"}, e("span",null, x.mes.slice(5)+"/"+x.mes.slice(0,4)), e("span",null, din(x.venda))); }),
        e("div",{key:"k", className:"flex justify-between border-t border-primary/40 pt-1 text-primary"}, e("span",null,"Valor do kit liberado"), e("b",null, kitRet ? din(kitRet) : "Não libera"+(avRet.motivo ? " · "+avRet.motivo : "")))]),
    sel.tipo==="kit_novo" && (valorKitNovo>0 ? e("p",{className:"rounded-md border border-primary/50 bg-primary/10 px-3 py-2 font-semibold"}, "Valor do kit liberado: "+din(valorKitNovo)+" · definido pela Michele") : e("p",{className:"font-semibold text-destructive"}, "A Michele ainda não lançou o valor deste kit novo.")),
    !sel.escolhaIni ? e("p",null, "Clique em ⏱ Começou, no topo, quando ela começar a escolher.") : sel.escolhaFim ? e("p",{className:"font-semibold text-success"}, "✓ Escolha terminada em "+relogio(decorridoSeg)+". Clique em Próxima e explique as regras.") : e("p",{className:"font-semibold"}, "Escolhendo há "+relogio(decorridoSeg)+" de 60:00. Clique em ■, no topo, quando ela terminar.")), "flex-1", "p-0"));
  var ESTS = simples ? [["Atendimento",[]]] : retornando ? [["Escolha do kit",[]], ["Regras",[5]]] : [["Condicionais",[0]], ["Vendas",[1]], ["Pagamentos",[2]], ["Valor do kit",[]], ["Brindes",[3]], ["Condicional nova",[4]], ["Regras",[5]]];
  var feitoE = ESTS.map(function(x){ return x[0]==="Atendimento" ? jaFeito : x[0]==="Escolha do kit" ? (!!sel.escolhaFim || jaFeito) : x[0]==="Condicionais" ? (!!sel.condOk || jaFeito) : x[0]==="Valor do kit" ? (mediaVendas!==null && !!kitLiberado) : x[1].every(function(j){ return feitoPasso[j]; }); });
  var libE = ESTS.map(function(x,i){ return jaFeito || (simples ? !!sel.inicioTs : retornando ? (i===0 ? !!sel.inicioTs : !!sel.escolhaFim) : (i===0 ? !!sel.inicioTs : i===1 ? !!sel.condOk : temVenda)); });
  var valE = ["", temVenda ? din(form.vendaBruta||0) : "", form.pagamentos.length ? din(dv.totalPagoAtual) : "", kitLiberado ? din(kitLiberado) : "", form.brindes.length ? din(cb.lancadoNormal+cb.lancadoSelect) : "", "", nRegras>0 ? nRegras+"/"+regras.length+(cienteOk || jaFeito ? " · passadas" : "") : ""];
  if(retornando) valE = [sel.escolhaFim ? relogio(decorridoSeg) : "", valE[6]];
  if(simples) valE = [sel.inicioTs ? hhmmDeTs(sel.inicioTs) : ""];
  var estAt = Math.min(passoAt, ESTS.length-1);
  var lateral = e("div",{className:"flex flex-col border-2 border-primary/50"},
    ESTS.map(function(x,i){ var on = i===estAt, liv = libE[i], ok = feitoE[i] && liv && (i<4 || feitoE[2]);
      return e("button",{key:x[0], type:"button", disabled:!liv, onClick:function(){ setPassoAt(i); }, className:"flex min-h-14 flex-1 flex-col justify-center gap-0.5 border-b border-l-4 border-b-primary/20 px-3 py-1.5 text-left "+(!liv ? "cursor-not-allowed border-l-transparent bg-black/40 opacity-50" : on ? "border-l-primary bg-primary/30" : ok ? "border-l-success bg-success/10 hover:bg-success/15" : "border-l-transparent hover:bg-white/5")},
        e("span",{className:"flex items-center gap-2 text-[13px] font-semibold"}, e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-semibold "+(ok ? "border-success bg-success text-white" : on ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25")}, ok ? "✓" : i+1), x[0]),
        !liv ? e("span",{className:"pl-7 text-[11px] font-medium uppercase tracking-[.05em]"}, "Bloqueada") : valE[i] && e("span",{className:"pl-7 text-[11px] font-medium uppercase tracking-[.05em] tabular-nums"}, valE[i])); }),
    e("div",{className:"flex justify-center gap-2 border-t-2 border-primary/50 p-2"},
      e("button",{type:"button", disabled:estAt===0, onClick:function(){ setPassoAt(estAt-1); }, className:"h-8 w-[5.5rem] rounded-md border-2 border-primary/50 bg-card text-[13px] font-medium hover:bg-white/10 disabled:opacity-40"}, "‹ Voltar"),
      e("button",{type:"button", disabled:estAt===ESTS.length-1 || !libE[estAt+1], onClick:function(){ setPassoAt(estAt+1); }, className:"h-8 w-[5.5rem] rounded-md bg-primary text-[13px] font-semibold text-primary-foreground disabled:opacity-40 "+(feitoE[estAt] && libE[estAt+1] && estAt<ESTS.length-1 ? BRILHO : "")}, "Próxima ›")));
  var ROT_SIMPLES = {indicacao:"Brinde de indicação", reposicao:"Reposição", troca:"Troca de peça"}[sel.tipo] || "";
  var estSimples = e("div",{className:"flex min-w-0 flex-1 flex-col"}, lado("Atendimento · "+ROT_SIMPLES, e("div",{className:"flex flex-col items-center justify-center gap-3 p-6 text-center text-[13px]"},
    e("p",{className:"font-semibold"}, sel.tipo==="indicacao" ? "Entregue o brinde da indicação à cliente." : sel.tipo==="reposicao" ? "Entregue a reposição à cliente." : "Faça a troca da peça da cliente."),
    !jaFeito && e("textarea",{value:sel.anotacao||"", rows:3, "aria-label":"Anotação do atendimento", placeholder:"Anotação (opcional): o que foi entregue ou trocado", onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{anotacao:ev.target.value}}); }, className:INPUT+" h-auto! w-full max-w-md resize-none py-2! text-[13px]!"}),
    jaFeito ? e("p",{className:"font-semibold text-success"}, "✓ Atendimento finalizado"+(sel.fim ? " às "+sel.fim : "")+(sel.anotacao ? " · "+sel.anotacao : ""))
      : e(Btn,{v:"primary", ic:"check", className:"h-12!", disabled:!sel.inicioTs, onClick:function(){ d({type:"INT_SIMPLES_FIM", id:sel.id, por:nomeDe(s.usuario)}); }}, "Finalizar atendimento")), "flex-1", "p-0"));
  var estFn = !sel.inicioTs && !jaFeito ? e("div",{className:"flex flex-1 items-center justify-center p-6 text-center text-[13px] font-semibold"}, "Clique em ▶ Iniciar atendimento, no topo, para começar.") : (simples ? [estSimples] : retornando ? [estEscolha, est4] : [estCond, estVendas, est1, estKit, est2, est3, est4])[estAt];
  var SHELL = "grid min-h-[402px] grid-cols-[14rem_minmax(0,1fr)]";
  // 10/11/2026 (Marcus: "a tela tem que ser responsiva"): o @container fica NA ÁREA DE CONTEÚDO (sem a coluna das etapas), assim "duas colunas" só vale quando cabem de verdade; antes media o cartão inteiro e apertava as tabelas em notebook
  var corpo = e("div",{className:SHELL, onKeyDown:enterProximo}, lateral, e("div",{className:"@container flex min-w-0 flex-col"}, estFn));

  // ── resumo do acerto: condicionais, brinde normal, brinde select e conta; sai em PDF ──
  var GRES = " grid-cols-[minmax(0,1fr)_3rem_6rem]";
  var G2 = " grid-cols-[minmax(0,1fr)_6rem]";
  var rodaKV = function(rot, val, cls){ return e("div",{className:LIN+G2+" "+(cls||"")}, e("span",{className:CAP}, rot), val); };
  var blocoRes = function(titulo, filhos){ return lado(titulo, e("div",{className:CTP}, filhos), "", "p-0"); };
  var resCond = blocoRes("Condicionais", [e("div",{key:"h", className:CABT+GRES}, e("span",null,"Nº"), e("span",null,"Peças"), e("span",null,"Valor")),
    condicionais.map(function(c,i){ return e("div",{key:i, className:LIN+GRES+(i%2 ? " bg-white/[0.03]" : "")}, e("span",null,c.numero), e("span",null,c.pecas), n15(din(c.valor||0))); }),
    e("div",{key:"sp", className:"flex-1"}),
    e("div",{key:"t", className:LIN+GRES+" border-t border-foreground/40"}, e("span",{className:CAP},"Total"), e("b",null,totalCondPecas), n15(din(totalCondValor), "text-primary")),
    e("div",{key:"v", className:LIN+GRES+" bg-white/[0.03]"}, e("span",{className:CAP},"Vendidas"), e("b",null,totalVendidas), e("span")),
    e("div",{key:"r", className:LIN+GRES+" min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Retornadas"), e("b",{className:"text-primary"}, totalCondPecas>0 ? pecasRetornar : "—"), e("span"))]);
  var resBr = function(cat, titulo, lib, lanc){ var L = form.brindes.filter(function(b){ return b.cat===cat; });
    return blocoRes(titulo, [e("div",{key:"h", className:CABT+G2}, e("span",null,"Código"), e("span",null,"Valor")),
      L.length ? L.map(function(b,i){ return e("div",{key:i, className:LIN+G2+(i%2 ? " bg-white/[0.03]" : "")}, e("b",{className:MONO}, b.codigo), n15(din(b.valor))); }) : e("div",{key:"n", className:LIN},e("span",{className:CAP},"Nenhuma peça")),
      e("div",{key:"sp", className:"flex-1"}), rodaKV("Libera", n15(din(lib))), e("div",{key:"l", className:LIN+G2+" min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Lançado"), e("b",{className:"text-[15px] font-semibold tabular-nums text-primary"}, din(lanc)))]); };
  var pdfResumo = function(){
    var w = window.open("","_blank"); if(!w) return;
    var tb = function(cab, linhas){ return "<table><tr>"+cab.map(function(c){ return "<th>"+c+"</th>"; }).join("")+"</tr>"+linhas.map(function(l){ return "<tr>"+l.map(function(c){ return "<td>"+c+"</td>"; }).join("")+"</tr>"; }).join("")+"</table>"; };
    w.document.write("<html><head><meta charset='utf-8'><title>Resumo do acerto</title><style>body{font:13px Inter,Arial,sans-serif;margin:32px;color:#111}h1{font-size:18px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #bbb;padding:6px 8px;text-align:center}th{background:#eee;font-size:11px;text-transform:uppercase}</style></head><body><h1>Resumo do acerto · Sorelly Joias</h1><div>Revendedora: <b>"+sel.nome+"</b> · Data: "+new Date().toLocaleDateString("pt-BR")+"</div>"
      + tb(["Condicional","Peças","Valor"], condicionais.map(function(c){ return [c.numero, c.pecas, din(c.valor||0)]; }).concat([["Total", totalCondPecas, din(totalCondValor)], ["Vendidas", totalVendidas, ""], ["Retornadas", pecasRetornar, ""]]))
      + (pa ? tb(["Item","Valor"], [["Venda líquida", din(pa.vendaLiquida)], ["Comissão ("+pa.comissaoPct+"%)", din(pa.comissao)], ["Valor do acerto", din(dv.totalAPagar)], ["Pago", din(dv.totalPagoAtual)], ["Falta pagar", din(dv.restanteTotal)]]) : "")
      + (form.brindes.length ? tb(["Brinde","Tipo","Valor"], form.brindes.map(function(b){ return [b.codigo, b.cat==="bb" ? "Select" : "Normal", din(b.valor)]; })) : "")
      + (form.pagamentos.length ? "<div>Pagamentos: "+form.pagamentos.map(function(q){ return formaDe(q.forma).label+(q.bandeira ? " "+q.bandeira : "")+(q.parcelas>1 ? " "+q.parcelas+"x" : "")+" "+din(q.valor); }).join(" + ")+"</div>" : "")
      + "</body></html>");
    w.document.close(); setTimeout(function(){ w.print(); }, 300);
  };
  var resConta = blocoRes("Conta do acerto", [e("div",{key:"h", className:CABT+G2}, e("span",null,"Item"), e("span",null,"Valor")),
    rodaKV("Venda líquida", n15(pa ? din(pa.vendaLiquida) : "—")), rodaKV("Comissão", n15(pa ? din(pa.comissao) : "—"), "bg-white/[0.03]"),
    e("div",{key:"ap", className:LIN+G2+" min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Valor do acerto"), e("b",{className:"text-[15px] font-semibold tabular-nums text-primary"}, pa ? din(dv.totalAPagar) : "—")),
    rodaKV("Pago", n15(din(dv.totalPagoAtual), "text-success")),
    e("div",{key:"sd", className:LIN+G2+" min-h-9 border-t border-foreground/40 font-semibold"}, e("span",null,"Falta pagar"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(dv.restanteTotal>0.009 ? "text-destructive" : "text-success")}, din(dv.restanteTotal))),
    e("div",{key:"sp", className:"flex-1"}),
    e("div",{key:"bt", className:"flex flex-wrap justify-center gap-2 border-t-2 border-primary/50 p-2"},
      e("button",{type:"button", disabled:!temPa, onClick:pdfResumo, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, "Gerar PDF"),
      msgs && sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(msgs.cliente), target:"_blank", rel:"noreferrer", className:"inline-flex h-8 items-center rounded-md border border-foreground/25 bg-card px-3 text-[13px] font-medium hover:bg-white/10"}, "Enviar no WhatsApp"))]);
  var resumoBloco = e("section",{className:"@container overflow-hidden rounded-lg border border-foreground/25 bg-card/60"},
    e("div",{className:"grid h-8 grid-cols-[1fr_auto_1fr] items-center bg-linear-to-r from-primary/75 via-primary/30 to-primary/60 px-3 text-[13px] font-semibold"}, e("span",{className:CAP}, nFeitos+" de "+PASSOS.length+" etapas"), e("span",null,"Resumo do acerto · "+sel.nome), e("span",{className:CAP+" justify-self-end"}, new Date().toLocaleDateString("pt-BR"))),
    e("div",{className:"grid grid-cols-1 @[34rem]:grid-cols-2 @[52rem]:grid-cols-[minmax(0,1.25fr)_minmax(0,.8fr)_minmax(0,.8fr)_minmax(0,1.05fr)]"}, degradeEm([resCond, resBr("normal","Brinde normal", dv.libN||0, cb.lancadoNormal||0), resBr("bb","Brinde select", dv.libS||0, cb.lancadoSelect||0), resConta])));
  var janelaAss = null;   // a revendedora NÃO assina nada no sistema (Marcus, 11/11/2026)
  return e("div",{className:"contents", style:PRATA ? VARS_PRATA : undefined}, pagina(e("div",{className:"flex min-w-0 flex-col gap-3"},
    visor && e("div",{role:"status", className:"flex flex-wrap items-center justify-center gap-3 rounded-lg border border-primary bg-primary/15 px-3 py-2 text-center text-[13px] font-semibold"}, e("span",null,"Só acompanhando · "+String(quemAtende).split(" ")[0]+" está atendendo. A tela atualiza sozinha."), e("button",{type:"button", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{iniciadoPor:nomeDe(s.usuario), bipou:nomeDe(s.usuario)}}); }, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground"}, "Assumir atendimento")),
    e("div",{className:"contents", style:visor ? {pointerEvents:"none"} : undefined}, cartao(corpo), retornando ? null : resumoBloco))), janelaAss);
}

export { AbaIntCalculadora };
