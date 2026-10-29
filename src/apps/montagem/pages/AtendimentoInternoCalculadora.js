// Sorelly Admin — pages/AtendimentoInternoCalculadora.js
// Kits → Atendimento Interno (Novo) → Calculadora de acertos. Mesma conta do app da representante (domain/acerto-derivado.js),
// em tela COMPLETA para o balcão: agenda de hoje à esquerda e todas as etapas do acerto à direita, na ordem, para ir preenchendo (Enter adiciona a linha);
// resumo fixo no topo. O valor vendido vem direto do app da revendedora (campo vendaApp do atendimento).
import { BARRAS } from "@/apps/montagem/components/equipe-blocos";
import { FORM_ACERTO_VAZIO, derivarAcerto } from "@/apps/montagem/domain/acerto-derivado";
import { totalDividaAnterior } from "@/apps/montagem/domain/comissoes";
import { AVISO_BB, PARCELAS_CARTAO, codigoBrindeValido, formasPagamentoPadrao, modalidadeDe, normalizarCodigo, textoRegras, vezCobravel, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { ATENDENTE_PECAS, BIPADORAS, MONTADORAS, nomeDe } from "@/apps/montagem/domain/equipe";
import { mensagemFechamento } from "@/apps/montagem/domain/mensagem-fechamento";
import { BK, N1, isoDia } from "@/apps/montagem/lib/format";
import { AssinaturaDigital, CampoDinheiro, CampoReais, rotuloPagamento } from "@/apps/montagem/mobile/campos";
import { Selo } from "@/apps/montagem/pages/AtendimentoInternoListagens";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { avaliarKit, histDemoDe } from "@/apps/montagem/domain/revendedoras-internas";
import { statusLinhaFin } from "@/apps/montagem/domain/atendimento-interno";
import { DESCONTO_BRINDE_ATRASO, TOLERANCIA_CHEGADA_MIN, tempoMaxEscolhaMin } from "@/apps/montagem/domain/atendimento-interno";
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

function Th(p){ return e("th",{className:"px-2 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground "+(p.r ? "text-right" : "text-left"), style:p.w ? {width:p.w} : undefined}, p.children); }
function Td(p){ return e("td",{className:"px-2 py-1.5 align-middle "+(p.r ? "text-right" : "text-left")+" "+(p.className||"")}, p.children); }
function Tab(p){
  return e("div",{className:"overflow-x-auto rounded-lg border border-border"},
    e("table",{className:"w-full table-fixed border-collapse text-sm"},
      e("thead",null, e("tr",{className:"border-b border-border bg-muted/40"}, p.cols.map(function(c,i){ return e(Th,{key:i, r:c.r, w:c.w}, c.t); }))),
      e("tbody",null, p.children)));
}
function Remover(p){ return e("button",{type:"button", onClick:p.onClick, "aria-label":p.label, className:"grid size-8 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"},"×"); }
function Aviso(p){ return e("p",{className:"rounded-lg px-3 py-2 text-[13px] font-semibold "+(p.tom==="vermelho" ? "bg-destructive/15 text-destructive" : p.tom==="verde" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}, p.children); }
function Secao(p){ return e("div",{className:"flex flex-col gap-2"}, p.t && e("h3",{className:"text-[13px] font-bold uppercase tracking-wide text-muted-foreground"}, p.t), React.Children.toArray(p.children)); }
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
var zoomDaLargura = function(w){ return w>1500 ? Math.min(1.5, Math.round(w/1500*100)/100) : 1; };
// bloco com cabeçalho em degradê (mesmo padrão do BlocoBarra) que abre e fecha ao clicar; fechado, só sobra a barra
function BlocoRecolhivel(p){
  return e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("button",{type:"button", onClick:p.onToggle, "aria-expanded":p.aberto, "aria-label":(p.aberto ? "Fechar " : "Abrir ")+p.t,
      className:"relative flex w-full flex-col items-center px-11 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,.3)] "+BARRAS[p.cor||"ouro"]},
      e("h2",{className:"font-heading text-[16px] font-bold leading-tight"}, p.t),
      p.sub && e("p",{className:"mt-0.5 text-[12px] font-medium opacity-85"}, p.sub),
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
function AtendimentoInterno(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = isoDia(new Date());
  var dia = hoje;                                  // só a agenda de hoje aparece aqui (os outros dias ficam em Listagens)
  var af = useState(FORM_ACERTO_VAZIO), form = af[0], setForm = af[1];
  var bi = useState(BRINDE_VAZIO), brindeIn = bi[0], setBrindeIn = bi[1];
  var lv = useState(LANC_VAZIO), lancForm = lv[0], setLancForm = lv[1];
  var ng = useState(false), negociarAberto = ng[0], setNegociarAberto = ng[1];
  var rg = useState({isenta:false, motivo:""}), regForm = rg[0], setRegForm = rg[1];
  var as = useState(null), assinatura = as[0], setAssinatura = as[1];
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
  var agenda = internos.filter(function(x){ return x.data===dia; }).sort(function(a,b){ return (a.hora||"99").localeCompare(b.hora||"99"); });
  var sel = internos.find(function(x){ return x.id===s.intSel; }) || null;
  useEffect(function(){ if(!(sel && sel.escolhaIni && !sel.escolhaFim)) return; var i = setInterval(function(){ tick(function(n){ return n+1; }); }, 1000); return function(){ clearInterval(i); }; },
    [sel ? sel.id : null, sel ? sel.escolhaIni : null, sel ? sel.escolhaFim : null]);
  useEffect(function(){
    setForm(FORM_ACERTO_VAZIO); setBrindeIn(BRINDE_VAZIO); setLancForm(LANC_VAZIO); setNegociarAberto(false); setRegForm({isenta:false, motivo:""});
    setAssinatura(null); setCiente(false); setRegrasOk({}); setBnIn({codigo:"", valor:null}); setBbIn({codigo:"", valor:null}); setAbaRegras("agora"); setRegraMais({});
    if(sel && sel.status==="acertado" && sel.formSnapshot) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.formSnapshot));
    else if(sel && sel.rascunho) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.rascunho));   // volta de onde parou (ex.: esperando o financeiro confirmar)
    else if(sel && sel.vendaApp>0) setForm(Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:sel.vendaApp}));   // o valor vendido vem direto do app da revendedora
  }, [sel ? sel.id : null]);
  // guarda o que a funcionária já preencheu deste atendimento (se sair da tela ou atender outra pessoa, ao voltar está tudo lá)
  useEffect(function(){ if(!sel || form===FORM_ACERTO_VAZIO || sel.status==="acertado") return; d({type:"INT_ATUALIZAR", id:sel.id, patch:{rascunho:form}}); }, [form]);
  useEffect(function(){ setVerKit(null); }, [sel ? sel.id : null, sel ? sel.nome : null]);
  // agenda e tabela do kit ficam à direita em dropdown; ao iniciar um atendimento os dois fecham (dá para abrir de novo)
  var ga = useState(true), agendaAberta = ga[0], setAgendaAberta = ga[1];
  var gk = useState(true), kitAberto = gk[0], setKitAberto = gk[1];
  useEffect(function(){ if(sel && sel.inicioTs){ setAgendaAberta(false); setKitAberto(false); } }, [sel ? sel.id : null, sel ? !!sel.inicioTs : false]);
  // layout novo (29/10/2026): 4 modos de tela para o Marcus escolher; a escolha fica salva neste navegador
  var ly = useState(function(){ try{ var v = Number(localStorage.getItem("sorelly_atend_layout")); return v>=1 && v<=4 ? v : 1; }catch(x){ return 1; } }), lay = ly[0], setLayRaw = ly[1];
  var setLay = function(n){ setLayRaw(n); try{ localStorage.setItem("sorelly_atend_layout", String(n)); }catch(x){} };
  var ps = useState(0), passoAt = ps[0], setPassoAt = ps[1];                       // etapa aberta (uma de cada vez)
  var ta = useState("comissao"), apoioAba = ta[0], setApoioAba = ta[1];           // aba do bloco de apoio: Comissões, Valor do kit ou Regras
  useEffect(function(){ setPassoAt(0); }, [sel ? sel.id : null]);

  var formas = (s.formasPagamento || formasPagamentoPadrao()).filter(function(f){ return f.k!=="pix_representante"; });   // sem representante no atendimento interno
  var formaDe = function(k){ return formas.find(function(f){return f.k===k;}) || {k:k, label:k, parcelas:false, descricoes:[]}; };
  var modalidade = sel ? modalidadeDe(s, sel.nome) : "padrao", ehPrata = modalidade==="prata";
  var versaoBase = sel ? ((s.regrasConsignado.versoes||[]).find(function(v){ return v.id===sel.regrasVersaoId; }) || versaoVigente(s)) : null;
  var remarcs = sel ? (sel.remarcacoesLista||[]) : [];
  var condicionais = sel ? (sel.condicionais||[]) : [];
  // atendimento interno: toda condicional lançada na tela vale como conferida (a funcionária digita número, valor e peças à mão)
  var vendasAntD = (sel && sel.vendasAnt) || [null, null];   // [anterior, mais antiga]; a média das regras novas quer da mais antiga para a mais nova
  var formD = Object.assign({}, form, {vendasAnteriores:[vendasAntD[1], vendasAntD[0]], condicionaisSelecionadas: condicionais.map(function(c){ return c.numero; }), pecasVendidas: (sel && sel.vendidasTotal!=null ? sel.vendidasTotal : condicionais.reduce(function(t,c){ return t+(c.vendidas||0); }, 0)) || null});
  var atrasoChegada = sel ? minutosAtraso(sel.hora, sel.chegada) : 0, chegouMuitoAtrasada = atrasoChegada>TOLERANCIA_CHEGADA_MIN;
  var fatorBrindeAtraso = chegouMuitoAtrasada ? 1-DESCONTO_BRINDE_ATRASO : 1;
  var dv = derivarAcerto({brindeFator:fatorBrindeAtraso, versaoBase:versaoBase, modalidade:modalidade, vez:vezCobravel(remarcs), form:formD, condicionais:condicionais, semTaxa:true, dividaAnterior:sel ? totalDividaAnterior(s.acertosConsignado, sel.nome) : 0});   // atendimento interno: sem taxa de deslocamento
  var pa = dv.previaAcerto, versao = dv.versao, pxm = dv.pecasProx;
  var jaFeito = !!sel && sel.status==="acertado";
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
  // a funcionária da listagem pode errar: aqui dá para incluir alguém na agenda de hoje à mão
  var manualOk = mForm.nome.trim().length>=3;
  var addManual = function(){ if(!manualOk) return;
    var cs = mForm.cond.split(/[^0-9]+/).filter(function(x){ return x.length>=3; }).map(function(n){ return {numero:n, pecas:0}; });
    d({type:"INT_ADD", nome:mForm.nome, fone:"", devmaster:"", data:hoje, hora:mForm.hora, condicionais:cs, obs:"Incluída à mão na Atendimento Sorelly", modalidade:modalidadeDe(s, mForm.nome.trim()), por:nomeDe(s.usuario)});
    setMForm({nome:"", hora:"", cond:""}); setMAberto(false); };
  // tabela de comissões da modalidade escolhida lá em cima; dá para abrir a do outro kit também
  var tabelaComissao = function(mod){
    var vb = versaoBase || versaoVigente(s), ve = vb ? versaoEfetiva(vb, mod) : null; if(!ve) return null;
    var faixas = ve.faixas.slice().sort(function(a,b){ return a.min-b.min; });
    var corTab = mod==="prata" ? "#64748B" : "#B8862B";
    return e("div",{key:mod, className:"overflow-hidden rounded-xl ring-1", style:{boxShadow:"0 0 0 1px "+corTab+"66", background:corTab+"12"}},
      e("table",{className:"w-full border-collapse text-center"},
        e("thead",null, e("tr",null, ["Venda a partir de","Comissão","Brinde normal","Brinde select"].map(function(t){ return e("th",{key:t, className:"border-b border-r border-border/60 px-1.5 py-1.5 text-[10.5px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground last:border-r-0"}, t); }))),
        e("tbody",null, faixas.map(function(f,i){
          return e("tr",{key:i, className:"border-b border-border/40 last:border-0"},
            e("td",{className:"border-r border-border/40 px-1.5 py-1 text-[12px] "+MONO}, din(f.min)), e("td",{className:"border-r border-border/40 px-1.5 py-1 text-[12.5px] font-bold text-success "+MONO}, f.pct+"%"),
            e("td",{className:"border-r border-border/40 px-1.5 py-1 text-[12px] "+MONO}, f.bn>0 ? din(f.bn) : "—"), e("td",{className:"px-1.5 py-1 text-[12px] "+MONO}, f.bb>0 ? din(f.bb) : "—")); }))));
  };
  var kitVisto = verKit || modTab;
  // barras em degradê: douradas no Kit Normal, prateadas quando o Kit 100% Prata está escolhido
  var GRAD_BARRA = modTab==="prata" ? "bg-linear-to-r from-[#64748B] via-[#CBD5E1] to-[#F1F5F9]" : "bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6]";
  var COR_BARRA = modTab==="prata" ? "#CBD5E1" : "#E8B84B";
  var barraKits = e("div",{className:"relative grid min-w-0 flex-1 grid-cols-2 "+GRAD_BARRA+" p-1 shadow-[inset_0_1px_0_rgba(255,255,255,.35)]", role:"group", "aria-label":"Tabela de comissão do kit"},
    e("span",{"aria-hidden":true, className:"absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#1B1409] transition-transform duration-300 ease-out "+(kitVisto==="prata" ? "translate-x-full" : ""), style:{boxShadow:"0 2px 8px rgba(0,0,0,.35)"}}),
    [["padrao","KIT NORMAL"],["prata","KIT 100% PRATA"]].map(function(o){ var on = kitVisto===o[0];
      return e("button",{key:o[0], type:"button", "aria-pressed":on, onClick:function(){ setVerKit(o[0]); },
        className:"relative z-10 h-9 rounded-lg text-[12.5px] font-extrabold tracking-wide transition-colors "+(on ? "text-[#F1E4C6]" : "text-[#1B1409]/80 hover:text-[#1B1409]")}, o[1]); }));
  // valor do kit: a tabela em uso hoje (estoque alto ou baixo, definida no Configurador), destaca a faixa da média
  var faixaKitTxt = function(i, x){ return i===0 ? BK(x.min)+" ou mais" : x.min===0 ? "abaixo de "+BK(tabKit[i-1].min) : BK(x.min)+" a "+BK(tabKit[i-1].min-0.01); };
  var blocoValorKit = e("div",{className:"overflow-hidden rounded-xl ring-1 ring-[#E8B84B]/40"},
    e("div",{className:GRAD_BARRA+" px-3 py-2 text-center text-[13px] font-bold text-[#1B1409]"}, "Valor do kit · estoque "+estoqueAtivo),
    e("table",{className:"w-full border-collapse text-center"},
      e("thead",null, e("tr",null, ["Média das vendas","Kit liberado"].map(function(h){ return e("th",{key:h, className:"border-b border-border/60 px-1.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground"}, h); }))),
      e("tbody",null, tabKit.map(function(x,i){ var on = faixaKit && faixaKit.min===x.min;
        return e("tr",{key:i, className:"border-b border-border/40 last:border-0 "+(on ? "bg-primary/20 font-bold" : "")},
          e("td",{className:"px-1.5 py-1 text-[12px] "+MONO}, faixaKitTxt(i,x)), e("td",{className:"px-1.5 py-1 text-[12.5px] font-bold text-primary "+MONO}, BK(x.kit))); }))));
  var seletorKit = e("div",{className:"flex items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-[#E8B84B]/30"},
    e("span",{className:"text-[12px] font-bold uppercase tracking-wide text-muted-foreground"},"Kit da revendedora"),
    e("div",{className:"flex gap-1 rounded-lg bg-black/20 p-1"}, [["padrao","Kit Normal"],["prata","Kit 100% Prata"]].map(function(o){ var on = modTab===o[0];
      return e("button",{key:o[0], onClick:function(){ escolherMod(o[0]); }, "aria-pressed":on, disabled:!!sel && jaFeito,
        className:"h-9 rounded-lg px-4 text-[13.5px] font-bold disabled:opacity-60 "+(on ? (o[0]==="prata" ? "bg-slate-500 text-white" : "bg-primary text-primary-foreground") : "text-muted-foreground hover:bg-muted/60")}, (on ? "✓ " : "")+o[1]); })));
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
  var virtuaisHoje = (s.revInternas||[]).filter(function(r){ return r.agend && r.agend.data===hoje && !agenda.some(function(x){ return x.id===r.internoId; }); })
    .map(function(r){ return {id:"IRV"+r.id, revId:r.id, virtual:true, nome:r.nome, hora:r.agend.hora, status:"agendado"}; });
  var listaDia = agenda.concat(virtuaisHoje).sort(function(a,b){ return (a.hora||"99").localeCompare(b.hora||"99"); });
  var feitosHoje = listaDia.filter(function(x){ return x.status==="acertado"; }).length;
  var itemFila = function(x){
    var on = !!sel && sel.id===x.id, feito = x.status==="acertado";
    var st = feito ? ["Feita","bg-success/20 text-success"] : on ? ["Atendendo","bg-primary/25 text-primary"] : x.chegada ? ["Chegou","bg-warning/20 text-warning"] : ["Agendada","bg-info/15 text-info"];
    return e("button",{key:x.id, type:"button", onClick:function(){ if(x.virtual) d({type:"REVINT_ATENDER", id:x.revId, internoId:x.id}); d({type:"INT_ABRIR", id:x.id}); },
      className:"flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] ring-1 "+(on ? "bg-primary/15 ring-primary" : "bg-muted/30 ring-border hover:bg-muted/50")},
      e("b",{className:"w-11 shrink-0 text-primary "+MONO}, x.hora || "—"),
      e("span",{className:"min-w-0 flex-1 truncate font-semibold", title:x.nome}, x.nome),
      e("span",{className:"shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold "+st[1]}, st[0]));
  };
  var CABEC = "flex items-center justify-between gap-2 px-3 py-2 text-[#1B1409] shadow-[inset_0_1px_0_rgba(255,255,255,.35)] "+GRAD_BARRA;
  var filaDia = e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:CABEC}, e("h2",{className:"font-heading text-[14px] font-bold"}, "Hoje · "+hoje.split("-").reverse().slice(0,2).join("/")), e("span",{className:"text-[12px] font-bold"}, feitosHoje+" de "+listaDia.length+" feitos")),
    e("div",{className:"flex flex-col gap-1 p-2"},
      listaDia.length ? listaDia.map(itemFila) : e("p",{className:"py-3 text-center text-[13px] text-muted-foreground"}, "Ninguém na agenda de hoje."),
      e("button",{type:"button", onClick:function(){ setMAberto(!mAberto); }, className:"mt-1 h-8 rounded-lg bg-black/20 text-[12.5px] font-bold text-muted-foreground hover:bg-muted/50"}, mAberto ? "Fechar" : "+ Incluir cliente à mão"),
      mAberto && e("div",{className:"flex flex-col gap-1.5 rounded-lg bg-black/15 p-2"},
        e("input",{value:mForm.nome, placeholder:"Nome da cliente", "aria-label":"Nome da cliente", className:CP+" h-8!", onChange:function(ev){ setMForm(Object.assign({}, mForm, {nome:ev.target.value})); }}),
        e("div",{className:"grid grid-cols-2 gap-1.5"},
          e("input",{type:"time", value:mForm.hora, "aria-label":"Horário", className:CP+" h-8!", onChange:function(ev){ setMForm(Object.assign({}, mForm, {hora:ev.target.value})); }}),
          e("input",{value:mForm.cond, placeholder:"Nº condicional", "aria-label":"Números das condicionais", className:CP+" h-8! "+MONO, onChange:function(ev){ setMForm(Object.assign({}, mForm, {cond:ev.target.value})); }})),
        e(Btn,{v:"primary", ic:"check", disabled:!manualOk, onClick:addManual}, "Adicionar à fila"))));
  var vApoio = versaoBase || versaoVigente(s);
  var regrasApoio = vApoio ? textoRegras(vApoio, modalidade).filter(function(r){ return !/deslocamento|pe[cç]as/i.test(r.t); }) : [];
  var listaRegras = e("ul",{className:"flex flex-col gap-1.5 p-2.5 text-[12.5px] leading-snug"}, regrasApoio.map(function(r,i){ return e("li",{key:i, className:"flex gap-2"}, e("span",{className:"shrink-0 font-bold text-primary"}, (i+1)+"."), e("span",null, r.t)); }));
  var apoioKit = e("section",{key:"k", className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"}, barraKits, e("div",{className:"flex flex-col gap-2 p-2"}, tabelaComissao(kitVisto), blocoValorKit));
  var apoioRegras = e("section",{key:"r", className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"}, e("div",{className:CABEC}, e("h2",{className:"font-heading text-[14px] font-bold"}, "Regras do consignado")), listaRegras);
  var apoioTabs = e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:"grid grid-cols-3 gap-1 p-1 "+GRAD_BARRA, role:"tablist"}, [["comissao","Comissões"],["kit","Valor do kit"],["regras","Regras"]].map(function(o){ var on = apoioAba===o[0];
      return e("button",{key:o[0], type:"button", role:"tab", "aria-selected":on, onClick:function(){ setApoioAba(o[0]); }, className:"h-8 rounded-lg text-[12.5px] font-extrabold "+(on ? "bg-[#1B1409] text-[#F1E4C6]" : "text-[#1B1409]/80 hover:text-[#1B1409]")}, o[1]); })),
    apoioAba==="comissao" ? e("div",{className:"flex flex-col gap-2 p-2"}, barraKits, tabelaComissao(kitVisto)) : apoioAba==="kit" ? e("div",{className:"p-2"}, blocoValorKit) : listaRegras);
  var seletorLayout = e("div",{className:"flex items-center gap-1.5 rounded-xl bg-card px-3 py-1.5 ring-1 ring-[#E8B84B]/30"},
    e("span",{className:"text-[12px] font-bold uppercase tracking-wide text-muted-foreground"}, "Layout"),
    [1,2,3,4].map(function(n){ var on = lay===n;
      return e("button",{key:n, type:"button", "aria-pressed":on, onClick:function(){ setLay(n); }, title:["Um passo por vez, tabelas embaixo da fila","Um passo por vez, com resumo ao lado e abas","Ficha em seções, só a atual aberta","Três colunas: fila, passo e apoio"][n-1],
        className:"grid size-8 place-items-center rounded-lg text-[13px] font-bold "+(on ? "bg-primary text-primary-foreground" : "bg-black/20 text-muted-foreground hover:bg-muted/60")}, n); }));
  var cabecaPagina = function(sub){ return e("div",{className:"flex flex-wrap items-end justify-between gap-3"}, e(PageHead,{t:"Atendimento Sorelly", sub:sub}), e("div",{className:"flex flex-wrap items-center gap-2"}, seletorLayout, seletorKit)); };
  var pagina = function(centro, midiaEsq, midiaDir){
    if(lay===4) return e("div",{className:"grid grid-cols-1 items-start gap-4 xl:grid-cols-[17rem_minmax(0,1fr)] 2xl:grid-cols-[17rem_minmax(0,1fr)_22rem]"},
      e("div",{className:"flex min-w-0 flex-col gap-3"}, filaDia), centro,
      e("div",{className:"flex min-w-0 flex-col gap-3 xl:col-span-2 2xl:col-span-1"}, midiaDir, apoioTabs));
    return e("div",{className:"grid grid-cols-1 items-start gap-4 xl:grid-cols-[19rem_minmax(0,1fr)]"},
      e("div",{className:"flex min-w-0 flex-col gap-3"}, filaDia, midiaEsq, lay===2 ? apoioTabs : React.Children.toArray([apoioKit, apoioRegras])), centro);
  };

  // Fica antes do "if(!sel) return": hook depois de um return condicional muda a ordem dos hooks e derruba a tela (erro #300 do React) ao fechar a aba do atendimento.
  useEffect(function(){ if(sel && !jaFeito && !sel.bipou) d({type:"INT_ATUALIZAR", id:sel.id, patch:{bipou:nomeDe(s.usuario)}}); }, [sel ? sel.id : null]);
  if(!sel) return e("div",{className:"contents", style:PRATA ? VARS_PRATA : undefined},
    cabecaPagina("Toque na cliente que chegou, na fila do dia, para iniciar o atendimento."),
    pagina(e("div",{className:"flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-16 text-center text-[14px] text-muted-foreground"},
      "Nenhum atendimento aberto.", e("span",{className:"font-semibold text-foreground"}, "Escolha o nome da cliente na fila do dia.")), null, null));

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
  var CPK = CP+" h-8! text-[14px]!";   // mesma altura dos campos de Vendas e Desconto crédito
  var soDigitos = function(t, n){ return t.replace(/\D/g,"").slice(0,n); };
  // tudo centralizado: Nº · Valor · Peças; o total de peças vendidas fica uma vez só, embaixo
  var CC = " text-center! ";
  // devolução: peças das condicionais − vendidas (a maleta não entra na conta)
  var pecasRetornar = Math.max(0, totalCondPecas - totalVendidas);
  var linhaCond = function(rotulo, campo){ return e("div",{className:"flex items-center justify-between gap-2 text-[12px] font-bold uppercase tracking-wide"}, e("span",null,rotulo), campo); };
  var pCond =e(React.Fragment,null,
    e("div",{className:GRID_COND+" px-0.5 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground"},
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
    condicionais.length>0 && e("div",{className:GRID_COND+" border-t border-border/50 pt-1.5 text-center text-[13px] font-bold"},
      e("span",{className:"text-muted-foreground"},"Total"), e("span",{className:MONO+" text-primary"}, din(totalCondValor)), e("span",{className:MONO}, totalCondPecas), e("span")),
    // fechamento das condicionais: total vendido (ela digita), peças que precisam voltar (calculado, a maleta conta como 1 peça) e observação
    e("div",{className:"flex flex-col gap-2 rounded-lg bg-black/20 p-2.5"},
      linhaCond("Peças vendidas (total)",
        e("input",{value:totalVendidas>0 ? totalVendidas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Total de peças vendidas das condicionais", className:CPK+" w-24! px-1! "+CC+MONO,
          onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendidasTotal:Number(soDigitos(ev.target.value,4))||0}}); }})),
      e("div",{className:"flex flex-col items-center gap-0.5 border-t border-border/50 pt-2 text-center"},
        e("span",{className:"text-[12px] font-bold uppercase tracking-wide"}, "Peças que devem retornar"),
        e("b",{className:MONO+" text-[24px] leading-tight text-primary", "aria-label":"Peças que devem retornar"}, totalCondPecas>0 ? pecasRetornar : "—"))));

  // ── Média das últimas vendas e valor do kit (mesma tabela da Calculadora de kits) ──
  var setVendaAnt = function(i, v){ if(jaFeito) return; var o = [vendasAnt[0]||null, vendasAnt[1]||null]; o[i] = v; d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendasAnt:o}}); };
  var linhaMedia = function(nome, campo){ return e("div",{key:nome, className:"grid grid-cols-[9rem_minmax(0,1fr)] items-center gap-2"}, e("span",{className:"text-[12px] font-bold uppercase tracking-wide text-foreground"}, nome), campo); };
  var avisoMedia = mediaVendas!==null && cfg.limiteAnaliseVendas && mediaVendas>cfg.limiteAnaliseVendas ? "Média acima de "+BK(cfg.limiteAnaliseVendas)+": obrigatório mandar a análise de vendas" : null;
  var blocoMedia = e("section",{className:"relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border px-3 pb-3 pt-3.5", style:{background:"#E8B84B12", borderColor:"#E8B84B55"}},
    e("span",{"aria-hidden":true, className:"absolute inset-x-0 top-0 h-1.5", style:{background:"linear-gradient(90deg,"+COR_BARRA+","+COR_BARRA+"00)"}}),
    e("h2",{className:"text-center font-heading text-[14px] font-bold"}, "Média das vendas e valor do kit"),
    linhaMedia("Venda atual", e("input",{readOnly:true, value:form.vendaBruta>0 ? din(form.vendaBruta) : "", placeholder:"vem de Vendas", "aria-label":"Venda atual", className:CP+" text-center! "+MONO+" text-primary!"})),
    temHist
      ? vendasMedia.filter(function(x){ return !x.atual; }).map(function(x){ return linhaMedia(MESES_CURTO[+x.mes.slice(5,7)-1]+"/"+x.mes.slice(2,4), e("input",{readOnly:true, value:din(x.venda), "aria-label":"Venda de "+x.mes, className:CP+" text-center! "+MONO+" text-white!"})); })
      : [linhaMedia("Venda anterior", e(CampoDinheiro,{key:"a0", value:vendasAnt[0], disabled:jaFeito, label:"Venda anterior", className:CP+" text-center! "+MONO+" text-white!", onChange:function(v){ setVendaAnt(0, v); }})),
         linhaMedia("Venda mais antiga", e(CampoDinheiro,{key:"a1", value:vendasAnt[1], disabled:jaFeito, label:"Venda mais antiga", className:CP+" text-center! "+MONO+" text-white!", onChange:function(v){ setVendaAnt(1, v); }}))],
    e("div",{className:"flex flex-col items-center gap-0.5 border-t border-border/50 pt-2 text-center"},
      e("span",{className:"text-[12px] font-bold uppercase tracking-wide"}, "Média ("+vendasMedia.length+(vendasMedia.length===1 ? " venda" : " vendas")+" · até "+avKit.nMeses+")"), e("b",{className:MONO+" text-[20px] text-primary"}, mediaVendas!==null ? din(mediaVendas) : "—"),
      !temHist && e("span",{className:"text-[11.5px] text-muted-foreground"},"Cadastre as vendas anteriores em Revendedoras para a média ficar automática")),
    e("div",{className:"flex flex-col items-center gap-0.5 rounded-lg "+GRAD_BARRA+" px-3 py-2 text-center text-[#1B1409]"},
      e("span",{className:"text-[12px] font-extrabold uppercase tracking-wide"}, "Kit a liberar"), e("b",{className:MONO+" text-[22px]"}, kitLiberado ? din(kitLiberado) : avKit.motivo ? "Não libera" : "•••")),
    avKit.motivo && mediaVendas!==null && e("p",{className:"rounded-lg bg-destructive/15 px-3 py-1.5 text-center text-[12.5px] font-bold text-destructive"}, avKit.motivo),
    avisoMedia && e("p",{className:"rounded-lg bg-destructive/15 px-3 py-1.5 text-center text-[12.5px] font-bold text-destructive"}, avisoMedia));

  // ── 2 · Vendas e pagamentos ──
  var fl = formaDe(lancForm.forma), pm = versao.gerais.parcelaMinimaCredito;
  var lancOk = lancForm.forma && lancForm.valor>0;   // só a forma e o valor exato; a conta quem define é o financeiro (Visão geral)
  var addPag = function(){ if(!lancOk || jaFeito) return; up({pagamentos:form.pagamentos.concat([lancForm])}); setLancForm(Object.assign({}, LANC_VAZIO, {forma:lancForm.forma})); };
  var editarPag = function(i){ if(jaFeito) return; var p = form.pagamentos[i]; setLancForm(Object.assign({}, LANC_VAZIO, p)); up({pagamentos:form.pagamentos.filter(function(x,j){ return j!==i; })}); };
  var cancelarPag = function(i){ if(jaFeito) return; up({pagamentos:form.pagamentos.filter(function(x,j){ return j!==i; })}); };
  var rot = function(t){ return e("span",{className:"text-[12px] font-semibold text-muted-foreground"}, t); };
  var LINHA_PAG = "grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_5.5rem] items-center gap-2";   // forma e conta têm a mesma largura (as linhas se alinham)
  var campoLado = function(nome, campo){ return e("label",{className:"flex min-w-0 items-center gap-2"}, e("span",{className:"w-12 shrink-0 text-[12px] font-semibold text-muted-foreground"}, nome), e("span",{className:"min-w-0 flex-1"}, campo)); };
  // colunas fixas: tudo alinhado na mesma direção (forma · valor · situação/ações), igual em todas as linhas de pagamento
  var GRID_PAG = "grid grid-cols-[1.5rem_9.5rem_8.5rem_minmax(0,1fr)] items-center gap-3";
  var CG = INPUT+" h-10! w-full text-[14px]!";                // campos do pagamento (uma linha só)
  // cartão da conta: rótulo pequeno em cima, valor grande embaixo (alguns são campos digitados, outros só mostram)
  // todos os cartões iguais (mesma cor, mesmo tamanho): nome à esquerda, informação à direita; só a cor da letra do valor muda
  var ICONE_TILE = {"Vendas":"🛍️","Líquida":"🧮","Comissão":"💰","Brinde que libera":"🎁","Diferença do brinde":"⚖️","Desconto crédito":"🏷️","Valor a pagar":"💵"};
  var tile = function(tit, conteudo, cor, estreito){ var nome = tit.split(" · ")[0]; return e("div",{className:"relative flex min-h-10 min-w-0 items-center gap-3 overflow-hidden rounded-lg px-3 py-1 pl-4", style:{background:"#E8B84B14", color:"#E8B84B"}},
    e("span",{"aria-hidden":true, className:"absolute inset-y-0 left-0 w-1.5", style:{background:"linear-gradient(180deg,"+COR_BARRA+","+COR_BARRA+"33)"}}),
    e("span",{className:"flex shrink-0 items-center gap-2 whitespace-nowrap text-[12px] font-bold uppercase tracking-wide text-foreground "+(estreito ? "w-28" : "w-44")}, e("span",{className:"grid size-6 place-items-center rounded-full bg-[#E8B84B]/20 text-[13px]", "aria-hidden":true}, ICONE_TILE[nome]||"•"), tit),
    e("span",{className:"flex min-w-0 flex-1 items-center gap-3 whitespace-nowrap"}, conteudo)); };
  var numTile = function(v){ return e("b",{className:MONO+" text-[18px] leading-tight"}, v); };
  // brinde que ela poderá liberar (já aparece antes do pagamento): faixa da venda líquida, com os descontos de atraso e remarcação
  var faixaBr = pa ? (versao.faixas||[]).slice().sort(function(a,b){ return b.min-a.min; }).find(function(x){ return pa.vendaLiquida>=x.min; }) : null;
  var fatorBr = fatorBrindeAtraso*(1-((pa && pa.descontoRemarcacao && pa.descontoRemarcacao.brindePct)||0)/100);
  // bloco da direita, de cima para baixo: Desconto crédito · Vendas | Líquida · Comissão · Brinde · Valor a pagar (e as formas de pagamento logo abaixo)
  var heroVendas = e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-col gap-2"},
      tile("Desconto crédito", e(CampoDinheiro,{value:form.garantia, label:"Desconto de crédito (garantia)", onChange:function(v){ up({garantia:v||0}); }, className:CPD+" h-8! w-full! text-left! text-[17px]! text-white!"}), "#E8B84B"),
      tile("Vendas", e(CampoDinheiro,{value:form.vendaBruta, label:"Valor total vendido", onChange:function(v){ up({vendaBruta:v}); }, className:CPD+" h-8! w-full! text-left! text-[17px]! text-white!"}), "#E8B84B"),
      tile("Líquida", numTile(pa ? din(pa.vendaLiquida) : "—"), "#E8B84B"),
      tile("Comissão", numTile(pa ? pa.comissaoPct+"%" : "—"), "#E8B84B"),
      tile("Brinde que libera", pa ? e("span",{className:"flex items-center gap-3 text-[14px] font-bold"}, "Normal "+din(faixaBr ? Math.round(faixaBr.bn*fatorBr) : 0), e("span",{className:"text-muted-foreground"},"·"), "Select "+din(faixaBr ? Math.round(faixaBr.bb*fatorBr) : 0)) : numTile("—"), "#E8B84B"),
      tile("Valor a pagar", pa ? e("span",{className:"flex flex-wrap items-center gap-x-4 gap-y-0.5"}, e("b",{className:MONO+" text-[20px] leading-tight"}, din(dv.totalAPagar)),
          dv.restanteTotal>0.009 ? e("span",{className:MONO+" text-[19px] font-extrabold text-destructive"},"pendente "+din(dv.restanteTotal)) : e("span",{className:"text-[15px] font-bold text-success"},"✓ quitado")) : numTile("—"), "#E8B84B")),
    (ehPrata || dv.novas) && e("label",{className:"flex items-center justify-end gap-2 text-[12px] font-semibold text-muted-foreground"}, dv.novas ? "Dias de atraso do acerto" : "Dias de atraso (Kit 100% Prata)",
      e("input",{type:"number", min:0, value:form.atrasoDias||0, "aria-label":"Dias de atraso", className:CPD+" h-8! w-16! px-1! text-center!", onChange:function(ev){ up({atrasoDias:Math.max(0, parseInt(ev.target.value,10)||0)}); }})),
    dv.dividaAnterior>0 && pa && e("p",{className:"text-center text-[12px] font-semibold text-destructive"},
      "Dívida anterior de "+din(dv.dividaAnterior)+": o pagamento quita primeiro a dívida antiga ("+din(dv.abateDivida)+" já abatidos)."),
    dv.novas && pa && (form.atrasoDias||0)>0 && e("p",{className:"text-center text-[12px] font-semibold text-destructive"},
      pa.juridico ? "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico."
        : "Atraso: perde "+pa.atrasoPct+"% da comissão e "+(pa.atrasoBrindePct||0)+"% do brinde."),
    dv.novas && pa && dv.faltaAtual>0.009 && e("div",{className:"flex flex-col items-end gap-1"},
      e("label",{className:"flex items-center justify-end gap-2 text-[12px] font-semibold text-muted-foreground"}, "Dias com valor pendente (prazo "+((versao.novas||{}).prazoQuitarDias||15)+")",
        e("input",{type:"number", min:0, value:form.diasQuitacao||0, "aria-label":"Dias com valor pendente", className:CPD+" h-8! w-16! px-1! text-center!", onChange:function(ev){ up({diasQuitacao:Math.max(0, parseInt(ev.target.value,10)||0)}); }})),
      e("p",{className:"text-[12px] font-semibold text-destructive"}, "Multa de "+din(pa.multaPendente)+(pa.multaAtrasoQuitacao>0 ? " + "+din(pa.multaAtrasoQuitacao)+" de atraso" : "")+" sobre "+din(pa.pendente)+" pendente. Próximo kit só depois de quitar.")),
    pa && (pa.descontoRemarcacao.comissaoPct>0 || pa.descontoRemarcacao.brindePct>0 || pa.atrasoPct>0) && e("p",{className:"text-center text-[12px] font-semibold text-destructive"},
      "Comissão −"+(pa.descontoRemarcacao.comissaoPct+pa.atrasoPct)+"%"+(pa.descontoRemarcacao.brindePct>0 ? " · brinde −"+pa.descontoRemarcacao.brindePct+"%" : "")),
    pa && pa.semFaixa && e(Aviso,null,"Abaixo de "+din(versao.gerais.minRenovar)+" de venda: sem comissão."+(ehPrata ? " Kit 100% Prata não renova." : "")));
  // pagamento: só a FORMA e o VALOR exato (ex.: pix 7.000, ou dois pix); a conta o financeiro divide na Visão geral
  var cartaoPag = !dv.previaBase ? null : e("div",{className:"flex flex-col gap-2 rounded-xl p-2.5", style:{background:"#E8B84B12"}},
    !jaFeito && e("div",{role:"group", "aria-label":"Forma de pagamento", className:"flex flex-wrap gap-1.5"}, formas.map(function(f){ var on = lancForm.forma===f.k;
      return e("button",{key:f.k, type:"button", "aria-pressed":on, onClick:function(){ setLancForm(Object.assign({}, lancForm, {forma:f.k})); }, className:"h-9 rounded-lg px-3 text-[13px] font-bold ring-1 "+(on ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/30 text-foreground ring-border hover:bg-muted/50")}, f.label); })),
    !jaFeito && e("div",{className:"grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-2"},
      campoLado("Valor", e(CampoDinheiro,{value:lancForm.valor, label:"Valor do pagamento", className:CPD+" h-10! font-bold", placeholder:"R$ 0,00", onChange:function(v){ setLancForm(Object.assign({}, lancForm, {valor:v})); }})),
      e(Btn,{v:"primary", ic:"check", className:"h-10!", disabled:!lancOk, onClick:addPag}, "OK")),
    form.pagamentos.length>0 && e("div",{className:"flex flex-col gap-1"}, form.pagamentos.map(function(p,i){
      return e("div",{key:i, className:GRID_PAG+" rounded-lg bg-[#E8B84B]/10 px-2.5 py-1.5 text-[13px]"},
        e("span",{className:"grid size-5 place-items-center rounded-full bg-[#E8B84B]/25 text-[11px] font-bold text-primary"}, i+1),
        e("b",{className:"text-center"}, formaDe(p.forma).label), e("b",{className:MONO+" text-center text-primary"}, din(p.valor)),
        !jaFeito ? e("span",{className:"flex justify-end gap-1.5"},
          e("button",{onClick:function(){ editarPag(i); }, className:"w-20 rounded-md bg-black/20 py-0.5 text-center text-[12px] font-semibold hover:bg-black/30"},"Editar"),
          e("button",{onClick:function(){ cancelarPag(i); }, className:"w-20 rounded-md bg-destructive/20 py-0.5 text-center text-[12px] font-semibold text-destructive hover:bg-destructive/30"},"Cancelar")) : e("span")); })));
  // ── Envio ao financeiro: só depois de fechar TODAS as formas de pagamento (e a negociação). O financeiro divide em contas, a funcionária anexa os comprovantes ──
  var lancFin = (s.lancFin||[]).find(function(x){ return x.internoId===sel.id; }) || null;
  var parteVazia = function(v){ return [{descricao:"", valor:v, comprovante:null, ok:false}]; };
  var linhasPagEnvio = form.pagamentos.filter(function(p){ return p.forma && p.valor>0; }).map(function(p){ return {tipo:"pagamento", forma:p.forma, valor:p.valor, partes:parteVazia(p.valor)}; });
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
  var caixaFinanceiro = linhasEnvio.length===0 && !lancFin ? null : e("div",{className:"flex flex-col gap-2 rounded-xl p-2.5", style:{background:"#E8B84B12"}},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("b",{className:"text-[13px] uppercase tracking-wide"}, "Financeiro"+(lancFin ? (lancFin.conferido ? " · tudo conferido" : " · enviado às "+hhmmDeTs(lancFin.enviadoTs)) : "")),
      (!lancFin || alterado) && linhasEnvio.length>0 && e(Btn,{v:"primary", ic:"check", sm:true, disabled:!podeEnviar, onClick:function(){ d({type:"FIN_ENVIAR", internoId:sel.id, nome:sel.nome, linhas:linhasEnvio, por:nomeDe(s.usuario)}); }}, alterado ? "Reenviar com as alterações" : "OK, enviar ao financeiro")),
    (!lancFin || alterado) && linhasEnvio.length>0 && !fechouPagamentos && e("p",{className:"text-[12px] font-semibold text-muted-foreground"},"Para enviar: feche todas as formas de pagamento (sem valor pendente) ou resolva a negociação."),
    alterado && e("p",{className:"text-[12px] font-semibold text-warning"},"Os pagamentos mudaram depois do envio: reenvie para o financeiro conferir de novo."),
    // etapa 1: comprovantes dos pagamentos anexados → OK libera os brindes · etapa 2: depois dos brindes (e da diferença, se houver) → finaliza e o financeiro confere
    lancFin && !lancFin.etapaComprovantes && e("div",{className:"flex flex-wrap items-center gap-3"},
      e(Btn,{v:"primary", ic:"check", sm:true, disabled:!comprovantesPagOk || alterado, onClick:function(){ etapa({etapaComprovantes:true}); }}, "OK, comprovantes anexados"),
      e("span",{className:"text-[12px] text-muted-foreground"}, comprovantesPagOk ? "Ao dar OK, os brindes são liberados." : "Anexe o comprovante de cada conta definida pelo financeiro.")),
    lancFin && lancFin.etapaComprovantes && !lancFin.finalizado && e("div",{className:"flex flex-wrap items-center gap-3"},
      e(Btn,{v:"primary", ic:"check", sm:true, disabled:!tudoComComprovante, onClick:function(){ etapa({finalizado:true, finalizadoTs:Date.now()}); }}, "Finalizar pagamentos e enviar para conferência"),
      e("span",{className:"text-[12px] text-muted-foreground"}, alterado ? "Há diferença de brinde nova: reenvie ao financeiro, espere a conta e anexe o comprovante." : tudoComComprovante ? "Tudo anexado: o financeiro já pode conferir." : "Falta anexar algum comprovante.")),
    lancFin && lancFin.finalizado && !lancFin.conferido && e("p",{className:"text-[12.5px] font-semibold text-primary"},"Comprovantes enviados: aguardando o financeiro conferir."),
    lancFin && lancFin.linhas.map(function(l,i){ var sk = statusLinhaFin(l), st = STATUS_FIN[sk];
      return e("div",{key:i, className:"flex flex-col gap-1 rounded-lg bg-black/20 px-2.5 py-1.5 text-[13px]"},
        e("div",{className:GRID_PAG},
          e("span"), e("b",{className:"text-center"}, l.tipo==="brinde" ? "Diferença do brinde" : formaDe(l.forma).label), e("b",{className:MONO+" text-center text-primary"}, din(l.valor)),
          e("span",{className:"justify-self-start rounded-md px-2 py-0.5 text-[11.5px] font-bold", style:{background:st[1]+"26", color:st[1]}}, st[0])),
        sk!=="isento" && sk!=="aguardando" && (l.partes||[]).map(function(p,j){
          return e("div",{key:j, className:GRID_PAG+" text-[12.5px]"},
            e("span"), e("span",{className:"truncate text-center text-muted-foreground", title:p.descricao}, p.descricao), e("b",{className:MONO+" text-center"}, din(p.valor)),
            e("span",{className:"flex flex-wrap items-center gap-2"},
              p.ok ? e("span",{className:"font-bold text-success"},"✓ conferido") : lancFin.finalizado ? null : e("label",{className:"inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/15"},
                p.comprovante ? "✓ Comprovante: trocar" : "Anexar comprovante",
                e("input",{type:"file", accept:"image/*,application/pdf", className:"sr-only", "aria-label":"Anexar comprovante", onChange:function(ev){ lerComprovante(ev.target.files[0], function(cmp){ trocaParte(i, j, {comprovante:cmp}); }); ev.target.value = ""; }})),
              p.comprovante && e("a",{href:p.comprovante.url, target:"_blank", rel:"noreferrer", className:"text-[12px] font-semibold text-primary underline"},"ver"))); })); }));
  var pVendas = heroVendas;
  var pPag = e(React.Fragment,null,
    !dv.previaBase ? e(React.Fragment,null, e("p",{className:"rounded-lg border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground"},"Digite o valor vendido para lançar os pagamentos."), caixaFinanceiro)
    : e(React.Fragment,null,
        cartaoPag,
        caixaFinanceiro,
        !dv.quitado && !dv.acordoExistente && !negociarAberto && !form.recusouNegociar && e("div",{className:"flex gap-2"},
          e(Btn,{v:"secondary", className:"flex-1", onClick:function(){ setNegociarAberto(true); if(!form.acordoParcelas.length) up({acordoParcelas:[{data:isoDia(new Date()), valor:null}]}); }}, "Negociar o que falta"),
          e(Btn,{v:"destructive", className:"flex-1", onClick:function(){ up({recusouNegociar:true}); }}, "Não quis negociar")),
        form.recusouNegociar && e(Aviso,{tom:"vermelho"},"Não quis negociar: sem brinde e nota promissória em 48h úteis. ",
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
    return e("div",{className:"flex min-w-0 flex-col gap-2 rounded-xl p-3 ring-1", style:{background:cor+"14", boxShadow:"inset 0 0 0 1px "+cor+"55"}},
      e("b",{className:"text-[14px]"}, titulo),
      e("div",{className:"flex flex-col gap-0.5 rounded-lg bg-black/15 px-2.5 py-1.5 text-[13px]"},
        e("div",{className:"flex items-baseline justify-between gap-2"}, e("span",{className:"text-muted-foreground"},"Valor da categoria"), e("b",{className:MONO}, din(base))),
        e("div",{className:"flex flex-wrap items-baseline justify-between gap-x-2"}, e("span",{className:"font-semibold"},"Novo valor"), e("b",{className:MONO+" text-[17px] text-primary"}, din(lib))),
        lib<base && motivosBr.length>0 && e("p",{className:"text-[11.5px] font-semibold text-destructive"}, "Diminuiu por: "+motivosBr.join(" · "))),
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
      st.codigo && !codOk && e("p",{className:"text-[11.5px] font-semibold text-destructive"}, cat==="bb" ? "BB + 4 números (ex.: BB0001 brinco, BBA0001 anel)" : "Informe o código"),
      e("div",{className:"flex justify-between border-t border-border/50 pt-1.5 text-[13px] font-bold"}, e("span",null,"Lançado "+din(lanc)), e("span",{className:rest>0 ? "text-success" : "text-muted-foreground"},"Restante "+din(rest))));
  };
  var pBrindes = !pa ? e("p",{className:"rounded-lg border border-dashed border-border p-3 text-center text-[13px] text-muted-foreground"},"Lance as vendas e os pagamentos primeiro.")
    : dv.brindeBloqueio ? e(Aviso,{tom:"vermelho"},"Brinde bloqueado — "+dv.brindeBloqueio.frase+(dv.faltaAtual>0.009 ? " (falta "+din(dv.faltaAtual)+")" : ""))
    : e(React.Fragment,null,
        travaBrinde && e("p",{className:"rounded-lg bg-[#E8B84B]/10 px-3 py-1.5 text-center text-[12.5px] font-semibold text-primary"},"Os campos de brinde abrem quando o financeiro confirmar todos os pagamentos."),
        e("p",{className:"rounded-lg border border-[#E8B84B]/60 bg-[#E8B84B]/15 px-3 py-1.5 text-center text-[13px] font-bold text-white"},"⚠ "+AVISO_BB+" Pode ser brinco, anel, colar ou qualquer outra peça."),
        e("div",{className:"grid grid-cols-1 gap-2.5 md:grid-cols-2 "+(travaBrinde ? "pointer-events-none opacity-50" : "")},
          colBrinde("normal","Brinde Normal", dv.libN, cb.lancadoNormal, cb.restanteNormal, bnIn, setBnIn, "#E8B84B"),
          colBrinde("bb","Brinde Select (BB)", dv.libS, cb.lancadoSelect, cb.restanteSelect, bbIn, setBbIn, "#E8B84B")),
        // diferença do brinde: o que passou do liberado entra no valor a pagar (mesmo cartão e mesma situação dos pagamentos)
        (function(){ var lb = lancFin && lancFin.linhas.find(function(l){ return l.tipo==="brinde"; }), sb = lb ? STATUS_FIN[statusLinhaFin(lb)] : null;
          return tile("Diferença do brinde", dv.excedenteBrinde>0
            ? e("span",{className:"flex flex-wrap items-center gap-x-4 gap-y-1"}, numTile(din(dv.excedenteBrinde)),
                e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold", style:{background:(sb ? sb[1] : "#F59E0B")+"26", color:sb ? sb[1] : "#F59E0B"}}, sb ? sb[0] : "A enviar ao financeiro"))
            : e("span",{className:"text-[14px] font-bold"},"Sem diferença a pagar"), "#E8B84B"); })(),
        e("p",{className:"text-center text-[11.5px] text-muted-foreground"},"O brinde só é entregue depois do pagamento."));

  // ── 4 · Condicional nova: só no final. Ela continua vendendo? Se não: por causa das regras ou porque não quis ──
  var semPag = !dv.previaBase || !form.pagamentos.length;
  var condFicam = condicionais.filter(function(c){ return condsSel.indexOf(c.numero)<0; });
  var continuaEf = !dv.previaBase ? "" : !dv.kitNovoLiberado ? "nao_regras" : (form.continua||"");
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
          dv.novas && dv.minimo.regra && e("p",{className:"text-[12.5px] font-semibold "+(dv.minimo.abaixo ? "text-destructive" : "text-success")},
            "Média de "+dv.minimo.qtd+" venda(s): "+din(dv.minimo.media)+" · mínimo "+din(dv.minimo.ref)+(dv.minimo.abaixo ? ". Abaixo do mínimo: kit novo não liberado e cadastro bloqueado." : ".")),
          !dv.kitNovoLiberado && e("p",{className:"text-[12.5px] font-semibold text-destructive"},
            dv.blocoDivida ? dv.blocoDivida
            : dv.novas && dv.kitNovoRegra && !dv.kitNovoRegra.liberado ? dv.kitNovoRegra.texto+"."
            : !dv.previaBase.podeRenovar ? "Vendas abaixo de "+din(versao.gerais.minRenovar)+": não renova o kit." : "Falta pagar para liberar. Abaixo de "+dv.kitNovoMin+"% só com autorização do financeiro.")),
        e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-3"}, escolhas.map(function(x){ var on = continuaEf===x[0];
          return e("button",{key:x[0], disabled:x[3] || jaFeito, onClick:function(){ up({continua:x[0]}); }, "aria-pressed":on,
            className:"h-12 rounded-xl text-[14px] font-bold ring-1 disabled:opacity-40 "+(on ? "text-white" : "hover:bg-muted"), style:on ? {background:x[2], boxShadow:"0 0 0 1px "+x[2]} : {background:x[2]+"18", boxShadow:"inset 0 0 0 1px "+x[2]+"66"}}, x[1]); })),
        continuaEf==="sim" && e("div",{className:"flex flex-col gap-2 rounded-xl bg-success/10 p-3 ring-1 ring-success/30"},
          e("label",{className:"flex flex-col items-center gap-1"}, e("span",{className:"text-[12px] font-semibold text-muted-foreground"},"Número da condicional nova"),
            e("input",{value:form.novaCond||"", disabled:jaFeito, inputMode:"numeric", placeholder:"000000", "aria-label":"Número da condicional nova", className:CG+" w-56! text-center "+MONO, onChange:function(ev){ up({novaCond:ev.target.value.replace(/\D/g,"").slice(0,8)}); }})),
          condFicam.length>0 && e("p",{className:"text-center text-[12.5px] text-muted-foreground"},"Continua com: ", condFicam.map(function(c){ return e("b",{key:c.numero, className:MONO+" mx-1 text-foreground"}, c.numero); }))));

  // ── 5 · Regras do consignado: tópico por tópico (curto), a funcionária passa uma a uma, a revendedora assina com o mouse ──
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
  var pronto = !jaFeito && !!form.vendaBruta && cienteOk && !!assinatura && !!continuaEf;
  var registrar = function(){
    d({type:"INT_ACERTO_REGISTRAR", id:sel.id, vendaBruta:form.vendaBruta, devolvida:0, garantia:form.garantia||0,
      valorPago: dv.acordoValido ? dv.previaBase.valorDevido : dv.totalPagoAtual, pagamentos:form.pagamentos.filter(function(p){ return p.forma && p.valor>0; }), acordo:dv.acordoExistente ? form.acordoParcelas : null,
      recusouNegociar:form.recusouNegociar, brindesLancados:form.brindes, excedenteBrinde:dv.excedenteBrinde,
      pecasVendidas:formD.pecasVendidas, pecasBrinde:form.pecasBrinde, pecasTrocas:form.pecasTrocas, pecasADevolver:dv.pecasADevolver,
      condicionaisSelecionadas:formD.condicionaisSelecionadas, modalidade:modalidade, atrasoDias:(ehPrata || dv.novas) ? (form.atrasoDias||0) : 0, diasQuitacao:form.diasQuitacao||0,
      assinatura:assinatura, regrasLidas:true, regrasPassadas:regras.map(function(r){ return r.t; }), por:nomeDe(s.usuario), bipou:sel.bipou||"",
      pecasProxCodigos:[], pecasProxLiberadas:0, kitNovoOk:continuaEf==="sim", continuidade:continuaEf, novaCond:form.novaCond||"",
      pecasCond:dv.pecasCondSelecionadas, formSnapshot:form});
  };
  var msgs = jaFeito && form.vendaBruta && pa ? mensagemFechamento({nome:sel.nome, origem:"interno", data:isoDia(new Date()), dv:dv, form:formD, condFicam:condFicam, expFicam:[],
    remarcacoes:remarcs.length ? remarcs.length+" ("+vezCobravel(remarcs)+" com multa)" : ""}) : null;
  var copiarMsg = function(chave, txt){ try{ navigator.clipboard.writeText(txt); }catch(x){} setMsgCopiada(chave); setTimeout(function(){ setMsgCopiada(null); }, 1600); };
  var dataBR = function(ts){ return new Date(ts).toLocaleDateString("pt-BR"); };
  // termo assinado antes (mês anterior): leu, confirmou e assinou todas as informações
  var painelTermo = termoAnt ? e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-success/10 p-3 ring-1 ring-success/30"},
      e("b",{className:"text-[14px] text-success"},"✓ Leu, confirmou e assinou em "+dataBR(termoAnt.ts)),
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, (termoAnt.regras||[]).map(function(t,i){ return e("span",{key:i, className:"rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-semibold text-success"}, "✓ "+t); })),
      termoAnt.assinatura && e("img",{src:termoAnt.assinatura, alt:"Assinatura de "+sel.nome, className:"h-24 rounded-lg bg-white p-1"}),
      e("p",{className:"text-[11.5px] text-muted-foreground"}, "Assinatura registrada"+(termoAnt.por ? " · atendida por "+termoAnt.por : ""))) : null;
  var pRegras = msgs ? e(React.Fragment,null,
      e("p",{className:"text-center text-[13.5px] font-semibold text-success"},"✓ Acerto registrado · acerto "+din(sel.acerto.valorAcerto)+" · comissão "+din(sel.acerto.comissao)),
      painelTermo,
      e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2"}, [["cliente","Para a revendedora", msgs.cliente],["grupo","Para o grupo da empresa", msgs.grupo]].map(function(m){
        return e("div",{key:m[0], className:"flex flex-col gap-2"}, e("b",{className:"text-center text-[13.5px]"}, m[1]),
          e("textarea",{readOnly:true, value:m[2], rows:Math.min(14, m[2].split("\n").length+1), className:INPUT+" h-auto! w-full resize-none py-2! text-[12.5px]! leading-snug"}),
          e("div",{className:"flex justify-center gap-2"}, e(Btn,{v:"primary", ic:"copiar", onClick:function(){ copiarMsg(m[0], m[2]); }}, msgCopiada===m[0] ? "✓ Copiado" : "Copiar"),
            m[0]==="cliente" && sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(m[2]), target:"_blank", rel:"noreferrer",
              className:"inline-flex h-10 items-center rounded-lg bg-success/15 px-3 text-[15px] font-medium text-success hover:bg-success/25"}, "Abrir no WhatsApp"))); })))
    : jaFeito ? e(React.Fragment,null, e("p",{className:"text-center text-[13.5px] font-semibold text-success"},"✓ Acerto registrado · acerto "+din(sel.acerto.valorAcerto)+" · comissão "+din(sel.acerto.comissao)), painelTermo)
    : e(React.Fragment,null,
        termoAnt && e("div",{className:"flex justify-center gap-1.5"}, [["agora","Passar as regras agora"],["anterior","Termo do mês anterior"]].map(function(x){ var on = abaRegras===x[0];
          return e("button",{key:x[0], onClick:function(){ setAbaRegras(x[0]); }, "aria-pressed":on, className:"h-9 rounded-lg px-4 text-[13px] font-bold ring-1 "+(on ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/40 ring-border hover:bg-muted")}, x[1]); })),
        termoAnt && abaRegras==="anterior" ? painelTermo : e(React.Fragment,null,
          // panfleto: cada regra é um cartão colorido com ícone grande; tocar no cartão marca como passada
          e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3"}, regras.map(function(r,i){ var on = !!regrasOk[i], aberta = !!regraMais[i], cor = TONS_REGRA[i % TONS_REGRA.length];
            var alternar = function(){ var o = Object.assign({}, regrasOk); o[i] = !on; setRegrasOk(o); };
            return e("div",{key:i, role:"checkbox", "aria-checked":on, "aria-label":"Regra passada: "+r.t, tabIndex:0, onClick:alternar, onKeyDown:function(ev){ if(ev.target===ev.currentTarget && (ev.key==="Enter" || ev.key===" ")){ ev.preventDefault(); alternar(); } },
              className:"relative flex cursor-pointer flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5", style:{background:cor+(on ? "30" : "1A"), boxShadow:"inset 0 0 0 2px "+(on ? "#22C55E" : cor+"66")}},
              e("div",{className:"flex items-center gap-3 px-3.5 py-3", style:{background:cor+"38"}},
                e("span",{className:"grid size-12 shrink-0 place-items-center rounded-2xl text-[26px]", style:{background:cor+"55"}, "aria-hidden":true}, iconeRegra(r.t)),
                e("b",{className:"flex-1 font-heading text-[15px] font-extrabold uppercase leading-tight tracking-wide"}, r.t),
                e("span",{className:"grid size-8 shrink-0 place-items-center rounded-full text-[16px] font-bold "+(on ? "bg-success text-white" : "bg-black/25 text-transparent ring-2 ring-white/30")}, "✓")),
              e("div",{className:"flex flex-1 flex-col gap-1 px-3.5 py-3"},
                e("span",{className:"text-[13.5px] leading-snug"}, aberta ? r.x : curto(r.x)),
                r.x.length>curto(r.x).length && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); var o = Object.assign({}, regraMais); o[i] = !aberta; setRegraMais(o); }, className:"self-start text-[12px] font-bold text-primary hover:underline"}, aberta ? "menos" : "ver mais"))); })),
          e("p",{className:"text-center text-[13px] font-semibold "+(cienteOk ? "text-success" : "text-muted-foreground")}, cienteOk ? "✓ Todas as regras passadas" : nRegras+" de "+regras.length+" regras passadas"),
          cienteOk && e("div",{className:"flex flex-col items-center gap-1"}, e(AssinaturaDigital,{onChange:setAssinatura, legenda:"Assinatura de "+sel.nome+" (com o mouse)"})),
          e(Btn,{v:"primary", ic:"check", className:"h-12!", disabled:!pronto, onClick:registrar}, "Confirmar e registrar acerto"),
          !pronto && e("p",{className:"text-center text-[12.5px] text-muted-foreground"}, !form.vendaBruta ? "Falta o valor vendido." : !continuaEf ? "Falta escolher se ela continua (condicional nova)." : !cienteOk ? "Marque todas as regras para liberar a assinatura." : "Falta a assinatura da revendedora.")));

  var conteudos = [pCond, pVendas, pPag, pBrindes, pNova, pRegras];
  // situação de cada seção: ✓ concluída
  var feitoPasso = [condicionais.length>0 && condicionais.every(function(c){ return c.pecas>0; }), form.vendaBruta>0, !!dv.previaBase && (dv.quitado || dv.acordoValido || form.recusouNegociar), !!pa && (!!dv.brindeBloqueio || form.brindes.length>0), !!continuaEf && (continuaEf!=="sim" || !!form.novaCond), jaFeito];
  var nFeitos = feitoPasso.filter(Boolean).length;
  var iniciar = function(){ var n = new Date(); d({type:"INT_ATUALIZAR", id:sel.id, patch:{inicio:hhmmDeTs(n.getTime()), inicioTs:n.getTime()}}); };
  // cada funcionária está na sua sessão: quem bipou é quem abriu o atendimento, sem escolher
  // relógio da escolha do kit: a funcionária dá OK quando a revendedora começa a escolher; o tempo máximo depende do valor do kit
  var maxEscolhaMin = tempoMaxEscolhaMin(kitLiberado);
  var escolhendo = !!sel.escolhaIni && !sel.escolhaFim, decorridoSeg = sel.escolhaIni ? Math.max(0, Math.floor(((sel.escolhaFim || Date.now())-sel.escolhaIni)/1000)) : 0;
  var relogio = function(seg){ return String(Math.floor(seg/60)).padStart(2,"0")+":"+String(seg%60).padStart(2,"0"); };
  var estourou = !!maxEscolhaMin && sel.escolhaIni && decorridoSeg>maxEscolhaMin*60 && !sel.escolhaFim;
  var iniciarEscolha = function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{escolhaIni:Date.now(), escolhaFim:null}}); };
  var terminarEscolha = function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{escolhaFim:Date.now()}}); };
  var durMin = sel && sel.inicioTs && sel.fimTs ? Math.max(1, Math.round((sel.fimTs-sel.inicioTs)/60000)) : null;

  // Uma seção da calculadora: tudo aparece de uma vez, na ordem, com ✓ quando está completa
  var TONS = ["#E8B84B","#E8B84B","#E8B84B","#E8B84B","#E8B84B","#E8B84B"];
  var secao = function(i){
    var ok = feitoPasso[i], tom = TONS[i];
    return e("section",{key:PASSOS[i][0], id:"sec-"+PASSOS[i][0], className:"relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border px-3 pb-2 pt-3.5", style:{background:tom+"12", borderColor:tom+"55"}},
      e("span",{"aria-hidden":true, className:"absolute inset-x-0 top-0 h-1.5", style:{background:"linear-gradient(90deg,"+tom+","+tom+"00)"}}),
      e("div",{className:"flex items-center justify-center gap-2"},
        e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-bold "+(ok ? "bg-success/25 text-success" : "bg-primary/20 text-primary")}, ok ? "✓" : i+1),
        e("h2",{className:"font-heading text-[14px] font-bold"}, PASSOS[i][1])),
      React.Children.toArray(conteudos[i]));
  };
  // ENTER avança para o próximo campo da calculadora (sem usar o mouse): cada Enter vai direto para o que falta preencher
  var enterProximo = function(ev){
    if(ev.key!=="Enter" || ev.shiftKey || ev.nativeEvent && ev.nativeEvent.isComposing) return;
    var t = ev.target; if(!t || (t.tagName!=="INPUT" && t.tagName!=="SELECT")) return;
    if(["button","submit","file","reset"].indexOf(t.type)>=0) return;
    var campos = [].slice.call(ev.currentTarget.querySelectorAll("input:not([type=hidden]):not([type=file]):not([type=button]):not([disabled]):not([readonly]), select:not([disabled])")).filter(function(el){ return el.offsetParent!==null && el.tabIndex!==-1; });
    var i = campos.indexOf(t); if(i<0) return;
    ev.preventDefault();
    var prox = campos[i+1]; if(!prox) return;
    prox.focus(); if(prox.tagName==="INPUT" && prox.select){ try{ prox.select(); }catch(x){} }
    if(prox.scrollIntoView) prox.scrollIntoView({block:"center", behavior:"smooth"});
  };
  var topoCard = React.Children.toArray([
        // até 2 atendimentos abertos ao mesmo tempo (uma escolhe o kit enquanto a outra é atendida)
        e("div",{className:"flex items-center gap-1.5 border-b border-border bg-sidebar px-2 pt-2"},
          abasUI.map(function(x){ var on = x.id===sel.id;
            return e("div",{key:x.id, className:"flex items-center gap-1 rounded-t-lg px-3 py-1.5 text-[13px] font-bold "+(on ? "bg-[#E8B84B] text-[#1B1409]" : "bg-white/5 text-foreground hover:bg-white/10")},
              e("button",{type:"button", onClick:function(){ d({type:"INT_SEL", id:x.id}); }}, primeiro(x.nome)+(x.escolhaIni && !x.escolhaFim ? " ⏱" : "")),
              e("button",{type:"button", "aria-label":"Fechar a aba de "+x.nome, title:"Fechar a aba (o que foi preenchido fica guardado)", onClick:function(){ d({type:"INT_FECHAR_ABA", id:x.id}); }, className:"grid size-5 place-items-center rounded-full text-[14px] leading-none hover:bg-black/20"}, "×")); }),
          e("span",{className:"ml-auto pb-1.5 text-[11.5px] text-muted-foreground"}, abasUI.length<2 ? "Dá para abrir mais 1 atendimento ao mesmo tempo" : "2 abertos · para trocar, clique na outra aba")),
        e("div",{className:"flex flex-wrap items-center gap-2 border-b border-border "+GRAD_BARRA+" px-4 py-2.5 text-[#1B1409]"},
          e("h2",{className:"font-heading text-[17px] font-bold"}, sel.nome), sel.hora && e("span",{className:"text-[12px] font-medium opacity-80"},"Horário "+sel.hora),
          sel.chegada && e("span",{className:"rounded-md bg-black/15 px-2 py-0.5 text-[12px] font-semibold"},"Chegou "+sel.chegada),
          sel.inicioTs ? e("span",{className:"rounded-md bg-black/15 px-2 py-0.5 text-[12px] font-semibold"},"Início "+hhmmDeTs(sel.inicioTs))
            : !jaFeito && e("button",{onClick:iniciar, className:"rounded-md bg-[#1B1409] px-2.5 py-0.5 text-[12px] font-bold text-white hover:opacity-90"},"▶ Iniciar atendimento"),
          sel.devmaster && e("span",{className:"text-[12px] font-medium opacity-80"},"DevMaster "+sel.devmaster),
          !sel.chegada && !jaFeito && e("button",{type:"button", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{chegada:horaAgora()}}); }, title:"A revendedora chegou agora", className:"rounded-md bg-[#1B1409] px-2.5 py-0.5 text-[12px] font-bold text-white hover:opacity-90"},"✓ Chegou agora"),
          e("label",{className:"flex items-center gap-1.5 text-[12px] font-semibold"}, "Quem montou",
            e("select",{value:sel.atendeu||"", disabled:jaFeito, "aria-label":"Quem montou o kit", className:"h-7 rounded-md border-0 bg-black/20 px-1.5 text-[12px] font-semibold text-white outline-none", onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{atendeu:ev.target.value}}); }},
              e("option",{value:""},"—"), QUEM_MONTA.map(function(b){ return e("option",{key:b.id, value:b.nome}, b.nome); }))),
          // escolha do kit: OK quando começa; o relógio anda e mostra o limite
          !sel.escolhaIni ? !jaFeito && e("button",{onClick:iniciarEscolha, title:"A revendedora começou a escolher o kit", className:"rounded-md bg-[#1B1409] px-2.5 py-0.5 text-[12px] font-bold text-white hover:opacity-90"},"⏱ Começou a escolher o kit")
            : e("span",{className:"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-bold "+(estourou ? "bg-destructive text-white" : "bg-black/20")},
                "⏱ "+relogio(decorridoSeg)+(maxEscolhaMin ? " / "+maxEscolhaMin+" min" : ""),
                escolhendo && e("button",{onClick:terminarEscolha, className:"rounded bg-[#1B1409] px-1.5 py-0.5 text-[11px] font-bold text-white"},"■ Terminou")),
          e("span",{className:"rounded-md bg-black/15 px-2 py-0.5 text-[12px] font-semibold"}, nFeitos+" de "+PASSOS.length+" etapas"),
          e("span",{className:"ml-auto flex items-center gap-2"},
            durMin ? e("span",{className:"rounded-md bg-black/20 px-2 py-0.5 text-[12px] font-bold"},"Bipagem finalizada · durou "+durMin+" min")
              : sel.fimTs ? e("span",{className:"rounded-md bg-black/20 px-2 py-0.5 text-[12px] font-bold"},"Bipagem finalizada às "+sel.fim)
              : jaFeito && e("button",{onClick:function(){ d({type:"INT_FINALIZAR", id:sel.id}); }, className:"rounded-md bg-[#1B1409] px-3 py-1 text-[12.5px] font-bold text-white hover:opacity-90"},"■ Finalizar bipagem"))),
        estourou && e("p",{role:"alert", className:"border-b border-destructive/50 bg-destructive/20 px-4 py-2 text-center text-[13.5px] font-bold text-destructive"},"⏰ O tempo para escolher o kit acabou ("+maxEscolhaMin+" min). Chame a revendedora: há outro atendimento aguardando."),
        chegouMuitoAtrasada && e("p",{className:"border-b border-border bg-[#E8B84B]/10 px-4 py-1.5 text-center text-[12.5px] font-semibold text-primary"},"Chegou "+atrasoChegada+" min depois do horário (tolerância de "+TOLERANCIA_CHEGADA_MIN+" min): perde "+Math.round(DESCONTO_BRINDE_ATRASO*100)+"% do brinde."),
        sel.obs && e("p",{className:"border-b border-border bg-muted/20 px-4 py-1.5 text-center text-[12.5px] text-muted-foreground"}, e("b",null,"Observação: "), sel.obs, sel.encomenda ? " · Encomenda "+sel.encomenda : "")
  ]);
  var cartao = function(corpo){ return e("div",{className:"@container flex min-w-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"}, topoCard, corpo); };
  // etapas: uma de cada vez, com botões (nada de lista suspensa)
  var stepper = e("div",{className:"grid grid-cols-3 gap-1 @[44rem]:grid-cols-6", role:"tablist"}, PASSOS.map(function(p,i){ var on = i===passoAt, ok = feitoPasso[i];
    return e("button",{key:p[0], type:"button", role:"tab", "aria-selected":on, onClick:function(){ setPassoAt(i); },
      className:"flex h-8 min-w-0 items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold uppercase ring-1 "+(on ? "bg-primary text-primary-foreground ring-primary" : ok ? "bg-success/15 text-success ring-success/40" : "bg-muted/30 text-muted-foreground ring-border hover:bg-muted/50")},
      e("span",null, ok && !on ? "✓" : String(i+1)), e("span",{className:"truncate"}, p[1])); }));
  var nav = e("div",{className:"flex items-center justify-between gap-2"},
    e(Btn,{v:"secondary", disabled:passoAt===0, onClick:function(){ setPassoAt(passoAt-1); }}, "‹ Voltar"),
    passoAt<PASSOS.length-1 ? e(Btn,{v:"primary", className:"h-10!", onClick:function(){ setPassoAt(passoAt+1); }}, "Confirmar e seguir ›") : e("span",null));
  var avisoFeito = jaFeito && e("p",{className:"rounded-lg bg-success/10 px-3 py-1.5 text-center text-[12.5px] font-semibold text-success"},"Acerto já registrado — somente consulta.");
  var bloqueio = jaFeito && passoAt<PASSOS.length-1 ? " [&>section]:pointer-events-none" : "";
  var passoUnico = e("div",{className:"flex min-w-0 flex-col gap-3 p-3"+bloqueio, onKeyDown:enterProximo}, avisoFeito, stepper, secao(passoAt), nav);
  var resumoLado = e("aside",{className:"flex min-w-0 flex-col gap-2"}, blocoMedia,
    e("div",{className:"flex flex-col gap-1 rounded-xl bg-black/15 p-2.5"}, PASSOS.map(function(p,i){
      return e("div",{key:p[0], className:"flex items-center gap-2 text-[12.5px] "+(feitoPasso[i] ? "text-success" : "text-muted-foreground")}, e("span",{className:"w-4 text-center font-bold"}, feitoPasso[i] ? "✓" : String(i+1)), p[1]); })));
  var sequencia = e("div",{className:"flex min-w-0 flex-col gap-2 p-3", onKeyDown:enterProximo}, avisoFeito, blocoMedia, PASSOS.map(function(p,i){
    if(i===passoAt) return e("div",{key:p[0], className:"flex flex-col gap-2"}, secao(i), nav);
    var ok = feitoPasso[i];
    return e("button",{key:p[0], type:"button", onClick:function(){ setPassoAt(i); }, className:"flex h-9 items-center gap-2 rounded-xl px-3 text-left text-[13px] ring-1 "+(ok ? "bg-success/10 ring-success/40" : "bg-muted/20 opacity-60 ring-border hover:opacity-100")},
      e("span",{className:"grid size-6 place-items-center rounded-full text-[12px] font-bold "+(ok ? "bg-success/25 text-success" : "bg-primary/20 text-primary")}, ok ? "✓" : String(i+1)),
      e("b",null, p[1]), ok && e("span",{className:"ml-auto text-[12px] text-success"}, "feito")); }));
  var corpo = lay===3 ? sequencia : lay===2 ? e("div",{className:"grid grid-cols-1 items-start @[52rem]:grid-cols-[minmax(0,1fr)_17rem]"}, passoUnico, e("div",{className:"p-3 @[52rem]:pl-0"}, resumoLado)) : passoUnico;
  return e("div",{className:"contents", style:PRATA ? VARS_PRATA : undefined},
    cabecaPagina("Fila do dia à esquerda e o atendimento à direita, um passo por vez."),
    pagina(cartao(corpo), lay===1 ? blocoMedia : null, lay===4 ? blocoMedia : null));
}

export { AbaIntCalculadora };
