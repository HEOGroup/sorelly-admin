// Sorelly Admin — pages/AtendimentoInternoCalculadora.js
// Kits → Atendimento Interno (Novo) → Calculadora de acertos. Mesma conta do app da representante (domain/acerto-derivado.js),
// em tela COMPLETA para o balcão: agenda de hoje à esquerda e todas as etapas do acerto à direita, na ordem, para ir preenchendo (Enter adiciona a linha);
// resumo fixo no topo. O valor vendido vem direto do app da revendedora (campo vendaApp do atendimento).
import { BARRAS } from "@/apps/montagem/components/equipe-blocos";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { JanelaIncluirCliente, sincronizarDm } from "@/apps/montagem/pages/RevendedorasInternas";
import { Aviso, BotaoRemover as Remover, LinhaCampo, Secao, TabelaSimples as Tab, TdSimples as Td, Tile } from "@/apps/montagem/components/padrao-fin";
import { FORM_ACERTO_VAZIO, derivarAcerto } from "@/apps/montagem/domain/acerto-derivado";
import { totalDividaAnterior } from "@/apps/montagem/domain/comissoes";
import { AVISO_BB, PARCELAS_CARTAO, linhasAtraso, codigoBrindeValido, comissaoEspecialDe, formasPagamentoPadrao, modalidadeDe, normalizarCodigo, textoRegras, vezCobravel, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { ATENDENTE_PECAS, BIPADORAS, MONTADORAS, nomeDe } from "@/apps/montagem/domain/equipe";
import { creditoDisponivel } from "@/apps/montagem/domain/garantias-rev";
import { mensagemFechamento } from "@/apps/montagem/domain/mensagem-fechamento";
import { BK, N1, isoDia } from "@/apps/montagem/lib/format";
import { CampoDinheiro, CampoReais, rotuloPagamento } from "@/apps/montagem/mobile/campos";
import { Selo } from "@/apps/montagem/pages/AtendimentoInternoListagens";
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { chaveDaParte } from "@/apps/montagem/lib/chave-da-parte";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { agoraSP, formatarDia, linksParaAcertoPorNome, meioDe } from "@/apps/montagem/domain/link-pagamento";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { atrasoUteisDe, avaliarKit, condsDaDevmaster } from "@/apps/montagem/domain/revendedoras-internas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { nomeParecido as nomeParecidoPx } from "@/apps/montagem/domain/pix-adiantados";
import { abrirAnexo } from "@/apps/montagem/lib/anexo";
import { useIndAoVivo } from "@/apps/montagem/lib/indicacoes-servidor";
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

// Quadro de assinatura da ciência das regras (12/11/2026, Edna): a revendedora que não quis esperar a explicação assina que está ciente.
function QuadroCiencia(p){
  var ref = useRef(null), des = useRef(false);
  var ponto = function(ev){ var c = ref.current, r = c.getBoundingClientRect(); return [(ev.clientX-r.left)*c.width/r.width, (ev.clientY-r.top)*c.height/r.height]; };
  var limpar = function(){ var c = ref.current; c.getContext("2d").clearRect(0,0,c.width,c.height); p.onChange(null); };
  return e("div",{className:"flex w-full max-w-md flex-col gap-1.5"},
    e("canvas",{ref:ref, width:560, height:150, "aria-label":"Quadro de assinatura da revendedora", className:"h-[110px] w-full touch-none rounded-md border border-dashed border-primary/60 bg-white",
      onPointerDown:function(ev){ des.current = true; ev.currentTarget.setPointerCapture(ev.pointerId); var g = ref.current.getContext("2d"), pt = ponto(ev);
        g.lineWidth = 2.5; g.lineCap = "round"; g.strokeStyle = "#1B1409"; g.beginPath(); g.moveTo(pt[0], pt[1]); },
      onPointerMove:function(ev){ if(!des.current) return; var g = ref.current.getContext("2d"), pt = ponto(ev); g.lineTo(pt[0], pt[1]); g.stroke(); },
      onPointerUp:function(){ if(!des.current) return; des.current = false; p.onChange(ref.current.toDataURL("image/png")); }}),
    e("button",{type:"button", onClick:limpar, className:"h-8 self-center rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "Limpar assinatura"));
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
  var pin = useState({codigo:"", carregando:false, aviso:""}), pecaIn = pin[0], setPecaIn = pin[1];   // Brinde de indicação: código da peça que está sendo lançada
  var mc = useState(null), msgCopiada = mc[0], setMsgCopiada = mc[1];
  var ma = useState(false), mAberto = ma[0], setMAberto = ma[1];                 // incluir atendimento à mão
  var mf = useState({nome:"", hora:"", cond:""}), mForm = mf[0], setMForm = mf[1];
  var ml = useState("padrao"), modLocal = ml[0], setModLocal = ml[1];             // kit mostrado na tabela quando ninguém está selecionada
  // PIX ADIANTADO: antes de enviar ao financeiro, o servidor MARCA os Pix usados neste atendimento (idempotente; se o Pix já foi usado em outro acerto, recusa e a linha sai). Sem Pix adiantado, envia direto.
  var enviarFin = function(){
    var seguir = function(){ d({type:"FIN_ENVIAR", internoId:sel.id, nome:sel.nome, linhas:linhasEnvio, por:nomeDe(s.usuario), vendas:ehInd ? 0 : (form.vendaBruta||0), aPagar:ehInd ? excInd : (dv.totalAPagar||0)}); };
    var ids = linhasEnvio.filter(function(l){ return l.pixFfId; }).map(function(l){ return l.pixFfId; }), tinha = !!lancFin && lancFin.linhas.some(function(l){ return l.pixFfId; });
    if(!ids.length && !tinha) return seguir();
    chamar("POST", "/pix-adiantados", {internoId:sel.id, rev:sel.nome, ids:ids}).then(function(r){
      var rec = (r && r.recusados) || [];
      if(rec.length){ var fora = rec.map(function(x){ return x.id; }); up({pagamentos:form.pagamentos.filter(function(q){ return fora.indexOf(q.pixFfId)<0; }), pixAuto:(form.pixAuto||[]).concat(fora)}); d({type:"AVISO", txt:"Um Pix já pago não pôde ser usado: "+rec[0].motivo+" Ele saiu da lista; confira os pagamentos."}); return; }
      seguir();
    }, function(){ d({type:"AVISO", txt:"Não consegui confirmar o Pix já pago com o servidor. Tente de novo."}); });
  };
  var vk = useState(null), verKit = vk[0], setVerKit = vk[1];                  // kit da tabela de comissões escolhido na barrinha (null = o da revendedora)
  var rk = useState({}), regrasOk = rk[0], setRegrasOk = rk[1];                  // regra por regra passada para a revendedora
  var bn = useState({codigo:"", valor:null}), bnIn = bn[0], setBnIn = bn[1];       // lançar brinde Normal
  var bb = useState({codigo:"", valor:null}), bbIn = bb[0], setBbIn = bb[1];       // lançar brinde Select (BB)
  var ar = useState("agora"), abaRegras = ar[0], setAbaRegras = ar[1];             // regras: passar agora ou ver o termo do mês anterior
  var ac = useState(null), assCiente = ac[0], setAssCiente = ac[1];               // assinatura de ciência (revendedora não quis esperar a explicação)
  var inc = useState(false), incluindo = inc[0], setIncluindo = inc[1];             // "Chegou agora": inclui na agenda de hoje quem chegou sem a Tamara marcar (Edna, 16/11/2026)
  var ao = useState(false), cienteAberta = ao[0], setCienteAberta = ao[1];
  var sa = useState(false), saiu = sa[0], setSaiu = sa[1];                          // 16/11/2026: revendedora saiu sem assinar a ciência (só avisa, não trava)
  var rm = useState({}), regraMais = rm[0], setRegraMais = rm[1];                  // "ver mais" de cada regra
  var up = function(patch){ setForm(function(f){ return Object.assign({}, f, patch); }); };

  var internos = s.internos || [];
  // 17/11/2026 (Natasha e Edna: "a Gabrielle estava na Listagem e não estava aqui"): as agendadas pela Tamara vêm da DevMaster. Só a Listagens buscava; agora esta tela busca ao abrir e a cada 5 minutos, igual
  useEffect(function(){ var rodar = function(){ if(apiAtiva()) sincronizarDm(d, true).catch(function(){ /* sem servidor: segue com o que já está salvo */ }); }; rodar(); var t = setInterval(rodar, 300000); return function(){ clearInterval(t); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var tk = useState(0), tick = tk[1];                       // faz o relógio da escolha do kit andar a cada segundo
  var aiS = useState(false), avisoIni = aiS[0], setAvisoIni = aiS[1];   // janela "leia antes de começar a escolher" (09/11/2026)
  var agenda = dedupeRev(internos.filter(function(x){ return x.data===dia; }).sort(function(a,b){ return (a.hora||"99").localeCompare(b.hora||"99"); }));
  var sel = internos.find(function(x){ return x.id===s.intSel; }) || null;
  // 12/11/2026: diferença do brinde que ficou fora da fila do Direcionar volta para a fila (o reducer só age se faltar mesmo)
  useEffect(function(){ if(sel && (s.lancFin||[]).some(function(x){ return x.internoId===sel.id && !x.conferido; })) d({type:"FIN_FILA", internoId:sel.id}); }, [sel && sel.id, s.lancFin]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!(sel && sel.escolhaIni && !sel.escolhaFim)) return; var i = setInterval(function(){ tick(function(n){ return n+1; }); }, 1000); return function(){ clearInterval(i); }; },
    [sel ? sel.id : null, sel ? sel.escolhaIni : null, sel ? sel.escolhaFim : null]);
  useIndAoVivo(!!(sel && sel.tipo==="indicacao"));   // Brinde de indicação (19/11/2026): o pedido aprovado vem do app ao vivo e a retirada é confirmada lá
  useEffect(function(){
    setForm(FORM_ACERTO_VAZIO); setBrindeIn(BRINDE_VAZIO); setLancForm(LANC_VAZIO); setNegociarAberto(false); setRegForm({isenta:false, motivo:""});
    setCiente(false); setRegrasOk({}); setBnIn({codigo:"", valor:null}); setBbIn({codigo:"", valor:null}); setAbaRegras("agora"); setRegraMais({}); setAssCiente(null); setCienteAberta(false); setSaiu(false);
    if(sel && sel.status==="acertado" && sel.formSnapshot) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.formSnapshot));
    else if(sel && sel.rascunho) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.rascunho));   // volta de onde parou (ex.: esperando o financeiro confirmar)
    else if(sel && sel.vendaApp>0) setForm(Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:sel.vendaApp}));   // o valor vendido vem direto do app da revendedora
  }, [sel ? sel.id : null]);
  // guarda o que a funcionária já preencheu deste atendimento (se sair da tela ou atender outra pessoa, ao voltar está tudo lá)
  useEffect(function(){ if(!sel || visor || form===FORM_ACERTO_VAZIO || sel.status==="acertado") return; d({type:"INT_ATUALIZAR", id:sel.id, patch:{rascunho:form}}); }, [form]);
  // RESTAURA os pagamentos perdidos (Edna, 16/11/2026, Emilli): se o rascunho voltou SEM pagamentos (outra janela gravou por cima) mas o financeiro já confirmou os pagamentos deste atendimento, a tela refaz as linhas a partir do que o financeiro tem. Sem isso o botão "OK, comprovantes anexados" ficava travado ("os pagamentos mudaram depois do envio").
  useEffect(function(){
    // 16/11/2026: vale também com o formulário ainda vazio (Edna, Emilli: a tela mostrava "Nenhuma forma selecionada" mesmo com o financeiro já tendo confirmado o Pix)
    if(!sel || visor || sel.status==="acertado" || (form.pagamentos||[]).length>0) return;
    var lf = (s.lancFin||[]).find(function(x){ return x.internoId===sel.id; }); if(!lf) return;
    var linhas = (lf.linhas||[]).filter(function(l){ return l.tipo==="pagamento" && l.forma && l.valor>0; }); if(!linhas.length) return;
    up({pagamentos:linhas.map(function(l){ var o = {data:hoje, anexo:null, forma:l.forma, valor:l.valor, bandeira:l.bandeira || "", parcelas:l.parcelas || 1, descricao:(l.partes && l.partes[0] && l.partes[0].descricao) || ""}; if(l.linkSolId){ o.linkSolId = l.linkSolId; o.jaPagoLink = true; } if(l.pixFfId){ o.pixFfId = l.pixFfId; o.jaPagoPix = true; } return o; })});
  }, [sel ? sel.id : "", (form.pagamentos||[]).length, (s.lancFin||[]).length]);   // eslint-disable-line react-hooks/exhaustive-deps
  // 16/11/2026 (Marcus/Edna): crédito lançado pela Garantia (Garantia → Créditos) entra sozinho em "Desconto de crédito" assim que existe valor vendido; só uma vez por atendimento (se a funcionária apagar, não volta)
  useEffect(function(){ if(!sel || visor || sel.status==="acertado" || form===FORM_ACERTO_VAZIO || form.creditoPuxado || !(form.vendaBruta>0)) return;
    var cd = creditoDisponivel(s, sel.nome); if(!(cd>0)) return;
    up(form.garantia>0 ? {creditoPuxado:true} : {garantia:cd, creditoPuxado:true, creditoPuxadoValor:cd}); }, [sel ? sel.id : null, form.vendaBruta>0, s.gr]);   // eslint-disable-line react-hooks/exhaustive-deps
  // LINKS JÁ PAGOS entram SOZINHOS como pagamento (Marcus, 16/11/2026): o setor Link de pagamento manda, a funcionária não precisa clicar. A função vem de mais abaixo (precisa do valor do acerto); um link por vez, e o que a funcionária tirar não volta (form.linksAuto)
  // PIX ADIANTADO (Marcus, 19/11/2026): o Pix que a revendedora já mandou a um prestador ANTES do acerto entra sozinho como pagamento já resolvido (mesmo modelo do link já pago). Um por vez, depois dos links: duas mudanças na mesma volta se apagariam.
  var autoLinks = useRef(null), autoPix = useRef(null), pxs = useState({chave:"", lista:[]}), pxAd = pxs[0], setPxAd = pxs[1];
  useEffect(function(){ var fn = autoLinks.current, fp = autoPix.current; autoLinks.current = null; autoPix.current = null; var fez = fn ? fn() : false; if(!fez && fp) fp(); });
  useEffect(function(){ setVerKit(null); }, [sel ? sel.id : null, sel ? sel.nome : null]);
  // agenda e tabela do kit ficam à direita em dropdown; ao iniciar um atendimento os dois fecham (dá para abrir de novo)
  var ga = useState(true), agendaAberta = ga[0], setAgendaAberta = ga[1];
  var gk = useState(true), kitAberto = gk[0], setKitAberto = gk[1];
  useEffect(function(){ if(sel && sel.inicioTs){ setAgendaAberta(false); setKitAberto(false); } }, [sel ? sel.id : null, sel ? !!sel.inicioTs : false]);
  var rs = useState(0), regraSel = rs[0], setRegraSel = rs[1];                     // regra aberta na estação Regras
  var pq = useState(false), popAt = pq[0], setPopAt = pq[1];
  var po = useState(false), popObs = po[0], setPopObs = po[1];     // ícone de avisos ao lado do nome
  var cnv = useState(false), condNovaAberta = cnv[0], setCondNovaAberta = cnv[1];     // linha de condicional à mão (abre no botão +)
  useEffect(function(){   // funcionárias ativas no RH (código e nome na DevMaster): a comissão delas é outra (Marcus, 11/11/2026)
    if(!apiAtiva()) return undefined; var vivo = true;
    var rodar = function(){ chamar("GET", "/funcionarias").then(function(r){ if(vivo && r && r.codigos) d({type:"FUNC_SET", dados:{codigos:r.codigos, nomes:r.nomes || {}, em:Date.now()}}); }).catch(function(){ /* sem servidor ou sem acesso: segue com a última lista */ }); };
    rodar(); var t = setInterval(rodar, 600000); return function(){ vivo = false; clearInterval(t); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var sPN = useState(null), formPN = sPN[0], setFormPN = sPN[1];   // pedido de link novo à Hellen
  var sPF = useState(null), formPF = sPF[0], setFormPF = sPF[1];   // formulário do link já pago por fora (estação Pagamentos)
  var ps =useState(0), passoAt = ps[0], setPassoAt = ps[1];                       // etapa aberta (uma de cada vez)
  var ta = useState("comissao"), apoioAba = ta[0], setApoioAba = ta[1];           // aba do bloco de apoio: Comissões, Valor do kit ou Regras
  useEffect(function(){ setPassoAt(sel && sel.inicioTs && sel.condOk ? 1 : 0); }, [sel ? sel.id : null]);   // abre na etapa em que parou
  useEffect(function(){ if(sel && sel.atrasoDias!=null) up({atrasoDias:Number(sel.atrasoDias)||0}); }, [sel ? sel.id : null, sel ? sel.atrasoDias : null]);   // dias de atraso: quem preenche é a Tamara (agendamento)

  // 16/11/2026 (Marcus: "deixa o link de pagamento somente como Link"): nesta tela a forma "link" aparece só como Link
  var rotForma = function(k, rot){ return k==="link" ? "Link" : rot; };
  var formas = (s.formasPagamento || formasPagamentoPadrao()).filter(function(f){ return f.k!=="pix_representante"; }).concat([{k:"credito_cliente", label:"Crédito da cliente", parcelas:false, descricoes:[]}]);   // sem representante no atendimento interno; "Crédito da cliente" = saldo a favor dela (Stefany, 23/11/2026): conta como pago, não vai ao financeiro
  var formaDe = function(k){ return formas.find(function(f){return f.k===k;}) || {k:k, label:k, parcelas:false, descricoes:[]}; };
  var modalidade = sel ? modalidadeDe(s, sel.nome) : "padrao", ehPrata = modalidade==="prata";
  var especialRev = sel ? comissaoEspecialDe(s, sel.nome) : null;   // comissão especial da revendedora (ficha em Revendedoras internas; Edna, 09/11/2026): muda só a % de comissão, brindes iguais
  var versaoBase = sel ? ((s.regrasConsignado.versoes||[]).find(function(v){ return v.id===sel.regrasVersaoId; }) || versaoVigente(s)) : null;
  var remarcs = sel ? (sel.remarcacoesLista||[]) : [];
  // 18/11/2026 (Marcus): as condicionais vêm da DevMaster (todas); a funcionária marca as que está COBRANDO. Só as marcadas entram nas contas (sem a marca = não entra; condicional digitada à mão antes disso, sem o campo, vale como cobrada).
  var condicionaisTodas = sel ? (sel.condicionais||[]) : [];
  var condicionais = condicionaisTodas.filter(function(c){ return c.cobrar!==false; });
  // atendimento interno: toda condicional lançada na tela vale como conferida (a funcionária digita número, valor e peças à mão)
  var vendasAntD = (sel && sel.vendasAnt) || [null, null];   // [anterior, mais antiga]; a média das regras novas quer da mais antiga para a mais nova
  var formD = Object.assign({}, form, {vendasAnteriores:[vendasAntD[1], vendasAntD[0]], condicionaisSelecionadas: condicionais.map(function(c){ return c.numero; }), pecasVendidas: (sel && sel.vendidasTotal!=null ? sel.vendidasTotal : condicionais.reduce(function(t,c){ return t+(c.vendidas||0); }, 0)) || null});
  var atrasoChegada = sel ? minutosAtraso(sel.hora, sel.chegada) : 0, atrasoBruto = atrasoChegada>TOLERANCIA_CHEGADA_MIN, atrasoIsento = !!(sel && sel.atrasoIsento), chegouMuitoAtrasada = atrasoBruto && !atrasoIsento;   // 19/11/2026 (Marcus: "elas podem alterar isso"): quem atende pode isentar o desconto do brinde por atraso de chegada (a cliente avisou)
  var fatorBrindeAtraso = chegouMuitoAtrasada ? 1-DESCONTO_BRINDE_ATRASO : 1;
  var dv = derivarAcerto({finalizado:!!(sel && sel.status==="acertado"), regraAntiga:!!form.regraAntiga, brindeFator:fatorBrindeAtraso, versaoBase:versaoBase, modalidade:modalidade, especial:especialRev, vez:vezCobravel(remarcs), form:formD, condicionais:condicionais, semTaxa:true, dividaAnterior:sel ? totalDividaAnterior(s.acertosConsignado, sel.nome) : 0});   // atendimento interno: sem taxa de deslocamento
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
  // dias úteis de atraso (regra de 11/11/2026): o sistema conta do primeiro dia marcado até o dia deste atendimento; ninguém digita mais
  var atrasoAuto = rInt && sel ? atrasoUteisDe(rInt, sel.data || hoje) : null;
  useEffect(function(){ if(sel && atrasoAuto!=null && (form.atrasoDias||0)!==atrasoAuto) up({atrasoDias:atrasoAuto}); }, [sel ? sel.id : null, atrasoAuto]);   // eslint-disable-line react-hooks/exhaustive-deps
  var temHist = !!rInt && rInt.hist.some(function(h){ return h.data && h.venda>0; });
  var histFallback = vendasAnt.map(function(v, i){ var dt = new Date(hoje+"T12:00:00"); dt.setMonth(dt.getMonth()-(i+1)); return {data:dt.toISOString().slice(0,10), venda:v}; });
  // 16/11/2026 (Marcus: "se tem 1 venda só a média é só dessa venda"): NADA inventado. Sem histórico, valem só a venda de agora e as vendas anteriores digitadas (o histórico de demonstração por nome saiu; tinha entrado R$ 3.620,00 de média numa venda de R$ 7.000,00)
  var avKit = avaliarKit(temHist ? rInt.hist : histFallback, form.vendaBruta, cfg, hoje.slice(0,7));
  var vendasMedia = avKit.lista;
  var mediaVendas = avKit.media;
  // média abaixo do mínimo (11/11/2026): a atendente pede a autorização do kit novo ao Financeiro (Direcionar). Aceito = libera pela faixa da média (ou a menor da tabela).
  var pedKit = sel ? ((s.dp && s.dp.kits)||[]).find(function(x){ return x.id==="KP"+sel.id; }) : null, abaixoMedia = !!avKit.motivo && mediaVendas!==null && mediaVendas<avKit.minimo, autKit = !!pedKit && pedKit.status==="aceito";
  var faixaKit = avKit.liberado || (autKit && abaixoMedia) ? (tabKit.find(function(x){ return mediaVendas>=x.min; }) || tabKit[tabKit.length-1] || null) : null;
  var blocoPedidoKit = abaixoMedia && sel && sel.status!=="acertado" ? e("div",{className:"flex flex-wrap items-center justify-center gap-2 px-3 py-1.5 text-center text-[13px]"},
    !pedKit || pedKit.status==="negado" ? e(React.Fragment,null, pedKit && e("b",{className:"text-destructive"}, "O Financeiro não autorizou"+(pedKit.motivo ? ": "+pedKit.motivo : "")+"."),
        !pedKit && e(Btn,{v:"secondary", sm:true, onClick:function(){ d({type:"DP", op:"kit_pedir", internoId:sel.id, nome:sel.nome, vendas:vendasMedia.map(function(x){ return {mes:x.mes, venda:x.venda}; }), media:mediaVendas, minimo:avKit.minimo, divida:totalDividaAnterior(s.acertosConsignado, sel.nome), por:nomeDe(s.usuario)}); }}, "Pedir autorização do kit novo ao Financeiro"))
      : pedKit.status==="pedido" ? e("b",{className:"text-warning"}, "Pedido enviado ao Financeiro. Aguarde a resposta do Direcionar.")
      : e("b",{className:"text-success"}, "Kit novo autorizado por "+pedKit.decididoPor+".")) : null;
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
  // LISTA DO DIA EM TABELA (Marcus, 16/11/2026): colunas alinhadas (hora, revendedora, tipo, situação), filtro no título de cada coluna, como as outras planilhas do sistema. "Retorno" é o novo kit (kit que volta).
  var TIPO_DIA = {acerto:"Acerto", kit_novo:"Kit novo", reposicao:"Reposição", premio:"Brinde", indicacao:"Brinde", retornando:"Novo kit", troca:"Troca"};
  var linhaDia = function(x){
    var on = !!sel && sel.id===x.id, feito = x.status==="acertado";
    var lfDe = (s.lancFin||[]).find(function(l){ return l.internoId===x.id; });   // 10/11/2026: o pedido de pagamento que a atendente já mandou prova que o atendimento está em andamento (vale também para tela antiga, que não manda o atendimento)
    var canc = x.status==="cancelado";
    var st = canc ? ["Cancelada","bg-destructive/20 text-destructive"] : feito ? ["Feita","bg-success/20 text-success"] : (on || !!x.inicioTs || !!lfDe) ? ["At."+(((lfDe && lfDe.por) || x.iniciadoPor || x.bipou) ? " - "+String((lfDe && lfDe.por) || x.iniciadoPor || x.bipou).split(" ")[0] : ""),"bg-primary/25 text-primary"] : (x.bipou && !x.chegada) ? ["Aberta · "+String(x.bipou).split(" ")[0],"bg-warning/20 text-warning"] : x.chegada ? ["Aguardando · "+x.chegada,"bg-warning/20 text-warning"] : ["Agendada","bg-info/15 text-info"];
    // 16/11/2026 (Marcus: "não é pra ter nada aí"): o acerto DESTE atendimento (ex.: R$ 2,00 de diferença do brinde, ainda sem finalizar) não é dívida anterior
    var div = !feito ? totalDividaAnterior((s.acertosConsignado||[]).filter(function(r){ return r.internoId!==x.id; }), x.nome) : 0;
    return {id:x.id, hora:x.hora || "—", nome:doisNomes(x.nome), tipo:TIPO_DIA[x.tipo || "acerto"] || "Acerto", sit:st[0], _cls:st[1], _aguardar:st[0]==="Agendada", divida:div>0.009 ? div : null, _x:x, _on:on, _canc:canc};
  };
  var linhasDia = listaDia.map(linhaDia);
  var temDividaDia = linhasDia.some(function(l){ return l.divida; });
  var colsDia = [{k:"hora", t:"Hora"}, {k:"nome", t:"Revendedora"}, {k:"tipo", t:"Tipo"}, {k:"sit", t:"Situação", render:function(v, l){ var pt = String(v).split(" · ");
    return e("span",{className:"inline-block whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold "+l._cls, title:v}, pt[0], pt[1] ? e("span",{className:"hidden 2xl:inline"}, " · "+pt[1]) : null); }}]
    .concat(temDividaDia ? [{k:"divida", t:"Dívida", render:function(v){ return v ? e("span",{className:"whitespace-nowrap font-bold text-destructive", title:"Dívida de acerto anterior: o pagamento quita primeiro essa dívida"}, din(v)) : ""; }}] : []);
  var CABEC = "flex h-8 items-center justify-between gap-2 bg-linear-to-r from-primary/75 via-primary/30 to-primary/60 px-3 text-[13px] font-semibold";
  var filaDia = e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:CABEC}, e("h2",{className:"text-[13px] font-semibold"}, "Hoje · "+hoje.split("-").reverse().slice(0,2).join("/")), e("span",{className:"text-[13px] font-bold"}, feitosHoje+" de "+listaDia.filter(function(x){ return x.status!=="cancelado"; }).length+" feitos")),
    incluindo && e(JanelaIncluirCliente,{imediato:true, lista:s.revInternas||[], hojeIso:hoje, dispatch:d, abrir:function(){}, irParaDia:function(){}, fechar:function(){ setIncluindo(false); }}),
    e("div",{className:"p-1"},
      listaDia.length ? e(TabelaPlanilha,{cols:colsDia, linhas:linhasDia, chave:"id", centro:true, grade:true, semContagem:true, semLimpar:true, maozinha:true, linhaCls:function(l){ return l._on ? "bg-primary/15" : ""; }, aoClicar:function(l){ var x = l._x; if(l._canc) return; if(x.virtual) d({type:"REVINT_ATENDER", id:x.revId, internoId:x.id}); d({type:"INT_ABRIR", id:x.id}); }}) : e("p",{className:"py-3 text-center text-[13px] text-muted-foreground"}, "Ninguém na agenda de hoje."),
      e("button",{type:"button", onClick:function(){ setIncluindo(true); }, className:"mt-1 flex h-8 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-bold text-[#1B1409] transition hover:brightness-110"}, "+ Chegou sem agendar? Incluir agora")));
  var vApoio = versaoBase || versaoVigente(s);
  var regrasApoio = vApoio ? textoRegras(vApoio, modalidade).filter(function(r){ return !/deslocamento|pe[cç]as/i.test(r.t); }) : [];
  var listaRegras = e("ul",{className:"flex flex-col gap-1.5 p-2.5 text-[13px] leading-snug"}, regrasApoio.map(function(r,i){ return e("li",{key:i, className:"flex gap-2"}, e("span",{className:"shrink-0 font-bold text-primary"}, (i+1)+"."), e("span",null, r.t)); }));
  var apoioTabs = e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"},
    e("div",{className:"grid grid-cols-3 gap-1 p-1 "+GRAD_BARRA, role:"tablist"}, [["comissao","Comissões"],["kit","Valor do kit"],["regras","Regras"]].map(function(o){ var on = apoioAba===o[0];
      return e("button",{key:o[0], type:"button", role:"tab", "aria-selected":on, onClick:function(){ setApoioAba(o[0]); }, className:"h-8 rounded-lg text-[13px] font-extrabold "+(on ? "bg-[#1B1409] text-[#F1E4C6]" : "text-[#1B1409]/80 hover:text-[#1B1409]")}, o[1]); })),
    apoioAba==="comissao" ? e("div",{className:"p-2"}, tabelaComissao(kitVisto)) : apoioAba==="kit" ? e("div",{className:"p-2"}, blocoValorKit) : listaRegras);
  var pagina = function(centro){
    return e("div",{className:"-mx-3 -mt-3 grid grid-cols-1 items-start gap-3 xl:grid-cols-[28rem_minmax(0,1fr)] 2xl:grid-cols-[32rem_minmax(0,1fr)]"},
      e("div",{className:"flex min-w-0 flex-col gap-3"}, filaDia, apoioTabs), centro);
  };

  // Fica antes do "if(!sel) return": hook depois de um return condicional muda a ordem dos hooks e derruba a tela (erro #300 do React) ao fechar a aba do atendimento.
  useEffect(function(){ if(sel && !jaFeito && !sel.bipou && !visor) d({type:"INT_ATUALIZAR", id:sel.id, patch:{bipou:nomeDe(s.usuario)}}); }, [sel ? sel.id : null, visor]);
  useEffect(function(){ if(visor && sel) setForm(Object.assign({}, FORM_ACERTO_VAZIO, sel.rascunho||{})); }, [visor, sel ? JSON.stringify(sel.rascunho||{}) : ""]);
  // Pix adiantado (19/11/2026): busca no servidor os Pix que a revendedora já mandou antes do acerto (o ff é só dos sócios). Fica ANTES do `if(!sel) return` (regra dos hooks).
  var chavePx = sel && !jaFeito && !visor ? sel.id+"|"+sel.nome : "";
  useEffect(function(){
    if(!chavePx || !apiAtiva()){ if(pxAd.chave) setPxAd({chave:"", lista:[]}); return; }
    var vivo = true, desde = ""; (s.acertosConsignado||[]).forEach(function(r){ if(r && !r.demo && r.data && r.data>desde && nomeParecidoPx(r.rev || r.nome || "", sel.nome)) desde = r.data; });   // último acerto da revendedora no sistema
    chamar("GET", "/pix-adiantados?nome="+encodeURIComponent(sel.nome)+"&internoId="+encodeURIComponent(sel.id)+(desde ? "&desde="+desde : "")).then(function(r){ if(vivo) setPxAd({chave:chavePx, lista:(r && r.pix) || []}); }).catch(function(){ if(vivo) setPxAd({chave:chavePx, lista:[]}); });   // sem acesso ou sem servidor: segue sem Pix adiantado
    return function(){ vivo = false; };
  }, [chavePx]);   // eslint-disable-line react-hooks/exhaustive-deps
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
  var editCond = function(i, patch){ setConds(condicionaisTodas.map(function(c,j){ return j===i ? Object.assign({}, c, patch) : c; })); };
  var condOk = condManual.numero.length>=3 && !condicionaisTodas.some(function(c){ return c.numero===condManual.numero; });
  var addCond = function(){ if(!condOk || jaFeito) return;
    setConds(condicionaisTodas.concat([{numero:condManual.numero, valor:condManual.valor||0, pecas:Number(condManual.pecas)||0, cobrar:true}])); setCondManual(COND_VAZIO); };
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
        jaFeito ? e("span") : e(Remover,{label:"Remover condicional "+c.numero, onClick:function(){ setConds(condicionaisTodas.filter(function(x,j){ return j!==i; })); }})); }),
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
    avKit.motivo && mediaVendas!==null && !autKit && e("p",{className:"rounded-lg bg-destructive/15 px-3 py-1.5 text-center text-[13px] font-bold text-destructive"}, avKit.motivo),
    blocoPedidoKit,
    avisoMedia && e("p",{className:"rounded-lg bg-destructive/15 px-3 py-1.5 text-center text-[13px] font-bold text-destructive"}, avisoMedia));

  // ── 2 · Vendas e pagamentos ──
  var fl = formaDe(lancForm.forma), pm = versao.gerais.parcelaMinimaCredito;
  var lancOk = lancForm.forma && lancForm.valor>0;   // só a forma e o valor exato; a conta quem define é o financeiro (Visão geral)
  // crédito da cliente: guardado na ficha dela (revInternas.credito); usar tira do saldo, cancelar devolve
  var revCred = sel ? (s.revInternas||[]).find(function(r){ return r.id===sel.revIntId; }) : null, credDisp = (revCred && revCred.credito) || 0;
  var mexeCredito = function(valor, motivo){ if(revCred) d({type:"REVINT_CREDITO", id:revCred.id, valor:valor, motivo:motivo, por:nomeDe(s.usuario), internoId:sel.id}); };
  var addPag = function(){ if(!lancOk || jaFeito) return; if(lancForm.forma==="credito_cliente") mexeCredito(-lancForm.valor, "Usado no acerto de "+hoje.split("-").reverse().join("/")); up({pagamentos:form.pagamentos.concat([lancForm])}); setLancForm(Object.assign({}, LANC_VAZIO, {forma:lancForm.forma})); };
  var editarPag = function(i){ if(jaFeito) return; var p = form.pagamentos[i]; if(p.forma==="credito_cliente") mexeCredito(p.valor, "Devolvido (pagamento editado)"); setLancForm(Object.assign({}, LANC_VAZIO, p)); up({pagamentos:form.pagamentos.filter(function(x,j){ return j!==i; })}); };
  var cancelarPag = function(i){ if(jaFeito) return; var pc = form.pagamentos[i]; if(pc && pc.forma==="credito_cliente") mexeCredito(pc.valor, "Devolvido (pagamento cancelado)"); up({pagamentos:form.pagamentos.filter(function(x,j){ return j!==i; })}); };
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
    (ehPrata || dv.novas) && e("label",{className:"flex items-center justify-end gap-2 text-[13px] font-semibold text-muted-foreground"}, dv.novas ? "Dias úteis de atraso do acerto" : "Dias de atraso (Kit 100% Prata)",
      e("input",{type:"number", value:form.atrasoDias||0, disabled:true, readOnly:true, title:"Contado pelo sistema: dias úteis desde o primeiro dia marcado", "aria-label":"Dias úteis de atraso (contado pelo sistema)", className:CPD+" h-8! w-16! cursor-not-allowed px-1! text-center! opacity-60"})),
    avisoDivida && e("p",{className:"text-center text-[13px] font-semibold text-destructive"}, avisoDivida),
    dv.novas && pa && (form.atrasoDias||0)>0 && e("p",{className:"text-center text-[13px] font-semibold text-destructive"},
      pa.juridico ? "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico."
        : "Atraso: perde "+pa.atrasoPct+"% da comissão e "+(pa.atrasoBrindePct||0)+"% do brinde."),
    dv.novas && pa && dv.faltaAtual>0.009 && dv.multaAplica && e("div",{className:"flex flex-col items-end gap-1"},
      e("label",{className:"flex items-center justify-end gap-2 text-[13px] font-semibold text-muted-foreground"}, "Dias com valor pendente (prazo "+((versao.novas||{}).prazoQuitarDias||30)+")",
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
    if((p.forma==="credito" || p.forma==="debito" || p.forma==="link") && p.bandeira){ base.bandeira = p.bandeira; base.parcelas = p.forma==="debito" ? 1 : (p.parcelas || 1); }   // bandeira e parcelas do cartão seguem para a Maquininha Banho (Lucas, 25/11/2026)
    if(p.forma==="credito_cliente") return Object.assign(base, {isento:true, enviada:true, partes:[{descricao:"Crédito da cliente", valor:p.valor, comprovante:null, ok:true}]});   // saldo a favor: não é dinheiro novo, não passa pelo Direcionar
    if(p.pixFfId) return Object.assign(base, {pixFfId:p.pixFfId, partes:[{descricao:p.descricao || "PIX DIRETO", valor:p.valor, comprovante:null, ok:true}], enviada:true, auto:"Pix já pago antes do acerto (Financeiro familiar): não volta ao Direcionar"});   // 19/11/2026: já está em ff.pix com o repasse; o acerto só CONSOME o Pix
    return p.linkSolId ? Object.assign(base, {parcelas:p.parcelas || 1, linkSolId:p.linkSolId, partes:[{descricao:p.descricao || "LINK", valor:p.valor, comprovante:null, ok:true}], enviada:true, auto:"Link já pago (setor Link de pagamento)"}) : base; });
  // Brinde de indicação (Marcus, 17/11/2026): o que passar do valor liberado é pago na hora, pela mesma diferença do brinde (financeiro define a conta, a funcionária anexa o comprovante)
  // 17/11/2026 (Marcus: "valor liberado deve vir do setor de indicação"): o valor liberado é o do prêmio do pedido APROVADO (aguardando retirada) da revendedora em Cadastro de revendedoras › Indicações; ao finalizar, a retirada é confirmada lá
  var normNome = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\s+/g," ").trim(); };
  var ehInd = sel.tipo==="indicacao", pecasInd = sel.pecasInd || [], totalInd = pecasInd.reduce(function(t,x){ return t + (Number(x.valor)||0); }, 0);
  var indDados = s.ind || {resgates:[], revendedoras:[]};
  var idsRevInd = (indDados.revendedoras||[]).filter(function(r){ return normNome(r.nome)===normNome(sel.nome); }).map(function(r){ return String(r.id); });
  var resgatesDela = ehInd ? (indDados.resgates||[]).filter(function(r){ return idsRevInd.indexOf(String(r.revendedoraId))>=0 && (r.etapa==="aprovado" || r.etapa==="solicitado"); }) : [];
  var resgateInd = resgatesDela.find(function(r){ return r.etapa==="aprovado"; }) || null;
  var liberadoInd = resgateInd ? (Number(resgateInd.premioValor)||0) : (Number(sel.valorLiberado)||0);
  var excInd = ehInd ? Math.max(0, Math.round((totalInd-liberadoInd)*100)/100) : 0;
  var linhasEnvio = ehInd ? (excInd>0 ? [{tipo:"brinde", forma:sel.formaDifInd||"", valor:excInd, partes:parteVazia(excInd)}] : [])
    : linhasPagEnvio.concat(dv.excedenteBrinde>0 ? [{tipo:"brinde", forma:"", valor:dv.excedenteBrinde, partes:parteVazia(dv.excedenteBrinde)}] : []);
  var chaveLinhas = function(ls){ return JSON.stringify(ls.map(function(l){ return [l.tipo, l.forma, l.valor, l.pixFfId || ""]; })); };
  var alterado = !!lancFin && chaveLinhas(linhasEnvio)!==chaveLinhas(lancFin.linhas);
  var fechouPagamentos = ehInd || dv.quitado || dv.acordoValido || form.recusouNegociar;
  var podeEnviar = linhasEnvio.length>0 && fechouPagamentos && (!lancFin || alterado) && !jaFeito && (!ehInd || !excInd || !!sel.formaDifInd);   // brinde de indicação: a funcionária escolhe COMO a revendedora pagou a diferença (Edna, 19/11/2026: ia sempre como Pix e ela pagou no crédito)
  var linhasPagFin = lancFin ? lancFin.linhas.filter(function(l){ return l.tipo==="pagamento"; }) : [];
  var semPendencia = function(ls){ return ls.length>0 && ls.every(function(l){ return l.isento || (statusLinhaFin(l)!=="aguardando" && (l.partes||[]).every(function(q){ return !!q.comprovante || !!q.ok; })); }); };   // 17/11/2026 (Edna, Gislaine): conta já conferida pelo financeiro não trava o OK, mesmo sem comprovante anexado
  var comprovantesPagOk = semPendencia(linhasPagFin);                                  // todas as contas dos pagamentos com comprovante
  var tudoComComprovante = !!lancFin && !alterado && semPendencia(lancFin.linhas);     // inclui a diferença do brinde, se houver
  var etapa = function(patch){ d({type:"FIN_ETAPA", id:lancFin.id, patch:patch}); };
  // 16/11/2026 (Marcus): na conta, em cima o CNPJ e a empresa (ex.: CNPJ 34 · Sorelly Atacadista) e embaixo a conta (ex.: Safra 34)
  var contaEmDuasLinhas = function(txt){ var pt = String(txt||"").split(" · "); if(pt.length<3) return e("span",{className:"break-words"}, txt || "—");
    return e("span",{className:"flex flex-col leading-tight", title:txt}, e("span",null, pt.slice(0, pt.length-1).join(" · ")), e("b",{className:"text-[11px]"}, pt[pt.length-1])); };
  var GRID_FIN = "grid min-h-8 grid-cols-[minmax(0,.7fr)_minmax(0,3fr)_6rem_minmax(0,1.9fr)] items-center gap-2 px-2 py-1 text-center text-[13px]";   // 19/11/2026 (Marcus, opção C): Forma · Conta e chave Pix · Valor · Comprovante
  var STATUS_FIN = {aguardando:["Aguardando o financeiro definir e enviar as contas","#F59E0B"], conta:["Contas definidas: anexe os comprovantes","#38BDF8"], ok:["✓ Conferido","#22C55E"], isento:["Isento","#9CA3AF"]};
  // MAQUININHA BANHO (Lucas, 23/11/2026): cartão ou link que foi para a maquininha da Pontual pede bandeira e parcelas antes do comprovante (mesma lista da Maquininha Banho)
  var MQ_BAND = ["MASTERCARD","VISA","ELO","HIPERCARD","AMEX","OUTRA"], MQ_PARC = ["DÉBITO"].concat(Array.from({length:12}, function(_, n){ return (n+1)+"x"; }));
  var faltaMq = function(p){ return !!p.mqBanho && !(p.band && p.parc); };
  var campoMq = function(i, j, p){ if(!p.mqBanho) return null;
    if(p.ok || (lancFin && lancFin.finalizado)) return e("span",{className:"font-semibold"}, (p.band||"Bandeira a informar")+" · "+(p.parc||"parcelas a informar"));
    var sel = function(rot, campo, lista){ return e("select",{"aria-label":rot, value:p[campo]||"", onChange:function(ev){ var pt = {}; pt[campo] = ev.target.value; trocaParte(i, j, pt); }, className:INPUT+" h-8! w-32 text-center text-[13px]!"}, e("option",{value:""}, rot), lista.map(function(o){ return e("option",{key:o, value:o}, o); })); };
    return e(React.Fragment,null, sel("Bandeira", "band", MQ_BAND), sel("Parcelas", "parc", MQ_PARC)); };
  var trocaParte = function(i, j, patch){ var l = lancFin.linhas[i]; d({type:"FIN_LINHA", id:lancFin.id, i:i, patch:{partes:l.partes.map(function(p,k){ return k===j ? Object.assign({}, p, patch) : p; })}}); };
  // 16/11/2026 (Marcus: "compacta melhor"): título, botões e avisos na MESMA linha (os filhos entram direto na linha, "contents"); só a tabela de contas ocupa a largura toda
  var caixaFinanceiro = linhasEnvio.length===0 && !lancFin ? null : // 16/11/2026 (Marcus: "é um bloco só"): a barra do Financeiro é o título da tabela de contas, tudo no mesmo bloco
    e("div",{className:"flex flex-col border-t border-foreground/25"},
    e("div",{className:"flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 bg-black/30 px-2 py-1"},
    e("div",{className:"contents"},
      e("b",{className:"text-[13px] uppercase tracking-wide"}, "Financeiro"+(lancFin ? (lancFin.conferido ? " · tudo conferido" : " · enviado às "+hhmmDeTs(lancFin.enviadoTs)) : "")),
      (!lancFin || alterado) && linhasEnvio.length>0 && e(Btn,{v:"primary", ic:"check", sm:true, disabled:!podeEnviar, className:(dv.excedenteBrinde>0 && podeEnviar ? "animate-pulse shadow-[0_0_0_3px_#E8B84B,0_0_14px_3px_rgba(232,184,75,.7)]" : ""), onClick:enviarFin}, alterado ? "Reenviar com as alterações" : "OK, enviar ao financeiro")),
    (!lancFin || alterado) && linhasEnvio.length>0 && !fechouPagamentos && e("p",{className:"text-[13px] font-semibold text-muted-foreground"},"Para enviar: feche todas as formas de pagamento (sem valor pendente) ou resolva a negociação."),
    alterado && e("p",{className:"text-[13px] font-semibold text-warning"},"Os pagamentos mudaram depois do envio: reenvie para o financeiro conferir de novo."),
    // etapa 1: comprovantes dos pagamentos anexados → OK libera os brindes · etapa 2: depois dos brindes (e da diferença, se houver) → finaliza e o financeiro confere
    lancFin && !lancFin.etapaComprovantes && e("div",{className:"contents"},
      e(Btn,{v:"primary", ic:"check", sm:true, disabled:!comprovantesPagOk || alterado, onClick:function(){ etapa({etapaComprovantes:true}); }}, "OK, comprovantes anexados"),
      e("span",{className:"text-[13px] text-muted-foreground"}, comprovantesPagOk ? "OK libera os brindes." : "Anexe os comprovantes.")),
    lancFin && lancFin.etapaComprovantes && !lancFin.finalizado && e("div",{className:"contents"},
      e(Btn,{v:"primary", ic:"check", sm:true, disabled:!tudoComComprovante, onClick:function(){ etapa({finalizado:true, finalizadoTs:Date.now()}); }}, "Finalizar pagamentos e enviar para conferência"),
      e("span",{className:"text-[13px] text-muted-foreground"}, alterado ? "Há diferença de brinde nova: reenvie ao financeiro, espere a conta e anexe o comprovante." : tudoComComprovante ? "Tudo anexado: o financeiro já pode conferir." : "Falta anexar algum comprovante.")),
    lancFin && lancFin.finalizado && !lancFin.conferido && e("p",{className:"text-[13px] font-semibold text-primary"},"Comprovantes enviados: aguardando o financeiro conferir.")),
    // 16/11/2026 (Marcus: "fora do padrão, compactar"): uma linha por conta, tudo em tabela única (Forma, Conta inteira, Valor, Situação), sem cartão dentro de cartão, sem corte "..." e sem valor dourado
    // 19/11/2026 (Marcus, opção C): quatro colunas (Forma, Conta e chave Pix, Valor, Comprovante); a chave Pix da conta direcionada fica COLADA na conta, com o botão Copiar, e continua visível até o financeiro conferir
    lancFin && e("div",{className:"flex w-full flex-col"},
      e("div",{className:GRID_FIN+" bg-primary/[0.18] text-[11px] font-bold uppercase tracking-[.05em]"}, e("span",null,"Forma"), e("span",null,"Conta e chave Pix"), e("span",null,"Valor"), e("span",null,"Comprovante")),
      lancFin.linhas.reduce(function(acc,l,i){ var sk = statusLinhaFin(l), st = STATUS_FIN[sk], nomeF = l.tipo==="brinde" ? "Diferença do brinde" : formaDe(l.forma).label;
        var partes = (sk!=="isento" && sk!=="aguardando") ? (l.partes||[]) : [];
        var linha = function(chave, contaNo, valor, acao){ return e("div",{key:chave, className:GRID_FIN+" border-t border-primary/20 py-1.5 "+(acc.length%2 ? "bg-primary/[0.12]" : "bg-primary/[0.07]")}, e("b",null,nomeF), contaNo, e("b",{className:MONO+" whitespace-nowrap"}, din(valor)), acao); };
        var contaNo = function(txt, ck){ var pt = String(txt||"").split(" · "), dupla = pt.length>=3;
          return e("span",{className:"flex flex-col items-center gap-1.5 py-0.5", title:txt||""}, e("span",{className:"leading-tight"}, dupla ? pt.slice(0, pt.length-1).join(" · ") : (txt || "—"), dupla && e("b",{className:"text-[11px]"}, " · "+pt[pt.length-1])),
            ck && e("span",{className:"inline-flex max-w-full items-center gap-2 overflow-hidden rounded-md border border-primary/25 bg-primary/[0.14] pl-2.5"}, e("span",{className:"break-all font-bold "+MONO, "aria-label":"Chave Pix da conta"}, ck.chave), e(CopiarChave,{texto:ck.chave, dados:ck.dados}))); };
        var marca = e("span",{className:"justify-self-center rounded-md px-2 py-0.5 text-[11px] font-bold", style:{background:st[1]+"26", color:st[1]}}, st[0]);
        if(!partes.length){ acc.push(linha(i+"-s", contaNo("—", null), l.valor, marca)); return acc; }
        partes.forEach(function(p,j){
          var ckP = p.ok ? null : chaveDaParte(s, p.descricao);   // chave Pix da conta direcionada, para passar à revendedora: fica visível até o financeiro conferir (19/11/2026)
          acc.push(linha(i+"-"+j, contaNo(p.descricao||"—", ckP), p.valor, e("span",{className:"flex flex-wrap items-center justify-center gap-1.5"},
            campoMq(i, j, p),
            p.ok ? e("span",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e("span",{className:"font-bold text-success"},"✓ conferido"),
              !p.comprovante && !lancFin.finalizado && e("label",{className:"inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2 text-[13px] font-semibold hover:bg-white/15"}, "Anexar comprovante",
                e("input",{type:"file", accept:"image/*,application/pdf", className:"sr-only", "aria-label":"Anexar comprovante", onChange:function(ev){ lerComprovante(ev.target.files[0], function(cmp){ trocaParte(i, j, {comprovante:cmp}); }); ev.target.value = ""; }}))) : lancFin.finalizado ? e("span",{className:"font-semibold text-primary"},"Aguardando conferência") : faltaMq(p) ? e("span",{className:"font-semibold text-warning"}, "Informe bandeira e parcelas") : e("label",{className:"inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2 text-[13px] font-semibold hover:bg-white/15"},
              p.comprovante ? "✓ Trocar comprovante" : "Anexar comprovante",
              e("input",{type:"file", accept:"image/*,application/pdf", className:"sr-only", "aria-label":"Anexar comprovante", onChange:function(ev){ lerComprovante(ev.target.files[0], function(cmp){ trocaParte(i, j, {comprovante:cmp}); }); ev.target.value = ""; }})),
            p.comprovante && e("a",{href:p.comprovante.url, target:"_blank", rel:"noreferrer", className:"text-[13px] font-semibold text-primary underline"},(p.extras||[]).length ? "ver 1" : "ver"),
            // 17/11/2026 (Natasha e Edna: "mais de 1 comprovante"): a mesma conta pode ter vários comprovantes (a revendedora pagou em duas vezes)
            (p.extras||[]).map(function(x, k){ return e("a",{key:"x"+k, href:x.url, target:"_blank", rel:"noreferrer", className:"text-[13px] font-semibold text-primary underline"}, "ver "+(k+2)); }),
            p.comprovante && !p.ok && !lancFin.finalizado && e("label",{className:"inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2 text-[13px] font-semibold hover:bg-white/15"}, "+ Outro comprovante",
              e("input",{type:"file", accept:"image/*,application/pdf", className:"sr-only", "aria-label":"Anexar outro comprovante", onChange:function(ev){ lerComprovante(ev.target.files[0], function(cmp){ trocaParte(i, j, {extras:(p.extras||[]).concat([cmp])}); }); ev.target.value = ""; }})),
            (p.extras||[]).length>0 && !p.ok && !lancFin.finalizado && e("button",{type:"button", onClick:function(){ trocaParte(i, j, {extras:(p.extras||[]).slice(0, -1)}); }, className:"inline-flex h-8 items-center rounded-md bg-white/10 px-2 text-[13px] font-semibold hover:bg-white/15"}, "Tirar o último")))); });
        return acc; }, [])));
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
        form.recusouNegociar && e(Aviso,{tom:"vermelho"},"Não quis negociar: sem brinde; o jurídico entra em contato; sem kit novo; o caso vai para o setor de Inadimplência, e sem negociação em 48 horas depois do aviso final a nota promissória vai para execução no valor pendente. ",
          e("button",{className:"underline", onClick:function(){ up({recusouNegociar:false}); }},"Desfazer")),
        (negociarAberto || dv.acordoExistente) && e(Secao,{t:"Parcelas negociadas · falta "+din(dv.faltaAtual)},
          e(Tab,{cols:[{t:"Parcela", w:"6rem"},{t:"Data"},{t:"Valor", r:true, w:"10rem"},{t:"", w:"3rem"}]},
            form.acordoParcelas.map(function(p,i){ return e("tr",{key:i, className:"border-b border-border/50"},
              e(Td,null,(i+1)+"ª"),
              e(Td,null, e("input",{type:"date", value:p.data, "aria-label":"Data da parcela", className:CP, onChange:function(ev){ var o = form.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {data:ev.target.value}); up({acordoParcelas:o, acordoSalvo:false}); }})),
              e(Td,null, e(CampoDinheiro,{value:p.valor, label:"Valor da parcela", className:CPD, onChange:function(v){ var o = form.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {valor:v}); up({acordoParcelas:o, acordoSalvo:false}); }})),
              e(Td,null, e(Remover,{label:"Remover parcela", onClick:function(){ up({acordoParcelas:form.acordoParcelas.filter(function(x,j){ return j!==i; }), acordoSalvo:false}); }}))); })),
          e("div",{className:"flex items-center justify-between gap-2"},
            form.acordoParcelas.length<2 && dv.faltaAtual>=400 ? e(Btn,{v:"ghost", sm:true, onClick:function(){ up({acordoParcelas:form.acordoParcelas.concat([{data:isoDia(new Date()), valor:null}])}); }}, "+ Parcela") : e("span",{className:"text-[13px]"}, dv.faltaAtual<400 ? "Abaixo de R$ 400,00: parcela única" : "Máximo de 2 parcelas"),
            e("b",{className:MONO+" text-[13px] "+(Math.abs(dv.acordoSoma-dv.faltaAtual)<=0.01 ? "text-success" : "text-destructive")}, "Soma "+din(dv.acordoSoma)+" / "+din(dv.faltaAtual)),
            e("span",{className:"flex gap-2"},
              e(Btn,{v:"primary", sm:true, onClick:function(){ var v = form.acordoParcelas.filter(function(p){ return p.data && p.valor>0; }); up({acordoParcelas:v, acordoSalvo:v.length>0}); }}, "Salvar acordo"),
              e(Btn,{v:"destructive", sm:true, onClick:function(){ setNegociarAberto(false); up({acordoParcelas:[], acordoSalvo:false}); }}, "Remover"))),
          dv.acordoFora && e(Aviso,{tom:"vermelho"}, "Fora da regra: "+dv.acordoFora+" Para levar kit novo: até 2 parcelas de R$ 200,00 ou mais, em até 30 dias. Fora disso o caso vai para o setor de Inadimplência."),
          form.acordoSalvo && ehPrata && e(Aviso,null,"Kit 100% Prata: acordo não libera brinde."),
          dv.acordoValido && e(Aviso,{tom:"verde"},"Acordo cobre o que falta: brinde liberado.")),
        dv.quitado && dv.acordoExistente && e(Aviso,{tom:"vermelho"},"Quitado, mas existe acordo salvo. Remova o acordo.")));

  // ── 3 · Brindes: Normal e Select (BB) no mesmo bloco, cada um com o seu lançamento e o restante ──
  var cb = dv.confBrinde;
  var addBrinde = function(cat, st, setSt){ if(jaFeito) return; var ok = codigoBrindeValido(cat, st.codigo) && st.valor>0; if(!ok) return;
    up({brindes:form.brindes.concat([{cat:cat, codigo:normalizarCodigo(st.codigo), valor:st.valor, origem:"nova"}])}); setSt({codigo:"", valor:null, cod:false}); };
  var travaBrinde = false;                                         // 12/11/2026: brinde se lança ANTES do pagamento (o financeiro demora); a entrega continua só depois de pagar
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
  // Marcus, 16/11/2026: pode haver mais de uma condicional nova; a lista fica em form.novasCond e o texto junto (vírgula) em form.novaCond, que o resto do sistema já lê
  var novasLista = Array.isArray(form.novasCond) && form.novasCond.length ? form.novasCond : [form.novaCond||""];
  var setNovas = function(a){ up({novasCond:a, novaCond:a.map(function(x){ return String(x).trim(); }).filter(Boolean).join(", ")}); };
  var escolhas = [["sim","✓ Continua vendendo","#16A34A", !dv.kitNovoLiberado],["nao_regras","✗ Não pode (regras)","#DC2626", false],["nao_quer","✗ Não quer continuar","#D97706", false],["outro_dia","↻ Renova outro dia","#2563EB", false]];   // Sthefany/Edna, 16/11/2026: a cliente não quis renovar hoje, vai agendar para outro dia
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
        e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-4"}, escolhas.map(function(x){ var on = continuaEf===x[0];
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
  var cienteOk = regras.length>0 && (!!assCiente || saiu || regras.every(function(r,i){ return !!regrasOk[i]; }));   // ou todas explicadas, ou a revendedora assinou a ciência
  var nRegras = regras.filter(function(r,i){ return !!regrasOk[i]; }).length;
  var termoAnt = (s.perfisRev||{})[sel.nome] && (s.perfisRev||{})[sel.nome].termoConsignado;
  var pronto = !jaFeito && temVenda && (semVendaOk || (cienteOk && (retornando ? !!sel.escolhaFim : (!!continuaEf && (continuaEf!=="outro_dia" || !!form.renovaDia)))));
  var registrar = function(){ if(retornando){ d({type:"INT_RETORNANDO_FIM", id:sel.id, assinatura:assCiente, semExplicacao:!!assCiente || saiu, saiuSemAssinar:saiu, regrasPassadas:regras.map(function(r){ return r.t; }), por:nomeDe(s.usuario)}); return; }
    d({type:"INT_ACERTO_REGISTRAR", id:sel.id, regraAntiga:!!form.regraAntiga && !ehPrata, vendaBruta:form.vendaBruta, devolvida:0, garantia:form.garantia||0,
      valorPago: dv.acordoValido ? dv.previaBase.valorDevido : dv.totalPagoAtual, pagamentos:form.pagamentos.filter(function(p){ return p.forma && p.valor>0; }), acordo:dv.acordoExistente ? form.acordoParcelas : null,
      recusouNegociar:form.recusouNegociar, brindesLancados:form.brindes, excedenteBrinde:dv.excedenteBrinde,
      pecasVendidas:formD.pecasVendidas, pecasBrinde:form.pecasBrinde, pecasTrocas:form.pecasTrocas, pecasADevolver:dv.pecasADevolver,
      condicionaisSelecionadas:formD.condicionaisSelecionadas, modalidade:modalidade, atrasoDias:(ehPrata || dv.novas) ? (form.atrasoDias||0) : 0, diasQuitacao:form.diasQuitacao||0,
      assinatura:assCiente, semExplicacao:!!assCiente || saiu, saiuSemAssinar:saiu, regrasLidas:!semVendaOk, regrasPassadas:semVendaOk ? [] : regras.map(function(r){ return r.t; }), por:nomeDe(s.usuario), bipou:sel.bipou||"",
      pecasProxCodigos:[], pecasProxLiberadas:0, kitNovoOk:continuaEf==="sim", continuidade:continuaEf, renovaDia:continuaEf==="outro_dia" ? (form.renovaDia||"") : "", novaCond:form.novaCond||"",
      pecasCond:dv.pecasCondSelecionadas, formSnapshot:form});
    if(form.creditoPuxadoValor>0 && form.garantia>0) d({type:"GR", op:"credito_usar", revendedora:sel.nome, kitId:sel.id, por:nomeDe(s.usuario)});   // o crédito da Garantia foi usado neste acerto
  };
  var msgs = jaFeito && temVenda && pa ? mensagemFechamento({nome:sel.nome, origem:"interno", data:isoDia(new Date()), dv:dv, form:formD, condFicam:condFicam, expFicam:[],
    remarcacoes:remarcs.length ? remarcs.length+" ("+vezCobravel(remarcs)+" com multa)" : ""}) : null;
  var copiarMsg = function(chave, txt){ try{ navigator.clipboard.writeText(txt); }catch(x){} setMsgCopiada(chave); setTimeout(function(){ setMsgCopiada(null); }, 1600); };
  var dataBR = function(ts){ return new Date(ts).toLocaleDateString("pt-BR"); };
  // termo assinado antes (mês anterior): leu, confirmou e assinou todas as informações
  var painelTermo = termoAnt ? e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-success/10 p-3 ring-1 ring-success/30"},
      e("b",{className:"text-[13px] text-success"},(termoAnt.saiuSemAssinar ? "Ciência pendente: ela saiu sem assinar em " : termoAnt.semExplicacao ? "✓ Assinou a ciência das regras (sem a explicação) em " : "✓ Leu, confirmou e assinou em ")+dataBR(termoAnt.ts)),
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, (termoAnt.regras||[]).map(function(t,i){ return e("span",{key:i, className:"rounded-md bg-success/15 px-2 py-0.5 text-[13px] font-semibold text-success"}, "✓ "+t); })),
      termoAnt.assinatura && e("img",{src:termoAnt.assinatura, alt:"Assinatura de "+sel.nome, className:"h-24 rounded-lg bg-white p-1"}),
      e("p",{className:"text-[13px] text-muted-foreground"}, "Assinatura registrada"+(termoAnt.por ? " · atendida por "+termoAnt.por : ""))) : null;
  var pRegras = msgs ? e(React.Fragment,null,
      e("p",{className:"text-center text-[13px] font-semibold text-success"},"✓ Acerto registrado · acerto "+din(sel.acerto.valorAcerto)+" · comissão "+din(sel.acerto.comissao)),
      // 16/11/2026 (Marcus: "tira essa merda, só o copiar e enviar no grupo"): depois de registrar não aparece o termo assinado nem o texto das mensagens, só os botões Copiar
      e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-2"}, [["cliente","Para a revendedora", msgs.cliente],["grupo","Para o grupo da empresa", msgs.grupo]].map(function(m){
        return e("div",{key:m[0], className:"flex flex-col gap-2"}, e("b",{className:"text-center text-[13px]"}, m[1]),
          e("div",{className:"flex justify-center gap-2"}, e(Btn,{v:"primary", ic:"copiar", onClick:function(){ copiarMsg(m[0], m[2]); }}, msgCopiada===m[0] ? "✓ Copiado" : "Copiar"),
            m[0]==="cliente" && sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(m[2]), target:"_blank", rel:"noreferrer",
              className:"inline-flex h-10 items-center rounded-lg bg-success/15 px-3 text-[15px] font-medium text-success hover:bg-success/25"}, "Abrir no WhatsApp"))); })))
    : jaFeito ? e(React.Fragment,null, e("p",{className:"text-center text-[13px] font-semibold text-success"},"✓ Acerto registrado · acerto "+din(sel.acerto.valorAcerto)+" · comissão "+din(sel.acerto.comissao)))
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
  var linhaKV = function(rot, val, op){ op = op||{}; return e("div",{key:rot, className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] "+(op.z ? "bg-white/[0.03] " : "")+(op.forte ? "border-primary bg-primary/10 font-semibold min-h-10" : "")}, e("span",{className:"flex min-w-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-1 py-0.5 leading-tight"}, rot, op.pill && pilula(op.pill, "border-primary text-primary")), val); };   // 19/11/2026 (Marcus: "tudo quebrada, nada responsivo"): o rótulo quebra de linha em vez de passar por cima do campo
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
          var gradeTopoEstreito = e("div",{className:"flex flex-wrap border-b-2 border-primary/50 @[56rem]:hidden"}, cols.map(function(c,i){ return e("div",{key:"n"+i, className:"flex min-w-[8rem] flex-1 flex-col items-center justify-center gap-1 border-b border-l border-primary/30 px-1 py-1.5 "+(i<3 ? "bg-primary/15" : "")}, e("span",{className:CAP+" text-center"}, c[0]), c[1]); }));   // 19/11/2026 (Marcus: "nada responsivo")
          var gradeTopo = e("div",{className:"hidden border-b-2 border-primary/50 @[56rem]:grid", style:{gridTemplateColumns:cols.map(function(c){ return c[2]; }).join(" ")}},
            cols.map(function(c,i){ return e("div",{key:"h"+i, className:"flex h-[30px] items-center justify-center overflow-hidden whitespace-nowrap border-b border-primary/40 bg-primary/15 px-1 "+(i ? "border-l border-l-primary/30 " : "")+CAP}, c[0]); }),
            cols.map(function(c,i){ return e("div",{key:"v"+i, className:"flex items-center justify-center px-1 py-1.5 "+(i ? "border-l border-primary/30 " : "")+(i<3 ? "bg-primary/15" : "")}, c[1]); }));   // nome, horário e situação: só leitura, com fundo colorido
          // relógio do atendimento (Marcus, 11/11/2026): chegada, início, escolha do kit (começo e fim) e saída
          var hh = function(ts){ return ts ? hhmmDeTs(ts) : "—"; };
          var relogioItens = [["Chegou na empresa", sel.chegada || "—"], ["Atendimento iniciou", hh(sel.inicioTs)], ["Escolha do kit iniciou", hh(sel.escolhaIni)], ["Escolha do kit terminou", hh(sel.escolhaFim)], ["Finalizou e saiu", sel.fim || (sel.fimTs ? hh(sel.fimTs) : "—")]];
          var relogioTopo = e("div",{className:"grid grid-cols-2 border-b-2 border-primary/50 bg-primary/[0.09] @[36rem]:grid-cols-3 @[56rem]:grid-cols-5"}, relogioItens.map(function(x,i){ return e("div",{key:i, className:"flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1 "+(i ? "border-l border-primary/30" : "")}, e("span",{className:CAP+" text-center leading-tight"}, x[0]), (i===0 && !sel.chegada && !jaFeito) ? e("button",{type:"button", title:"Cliente aguardando atendimento: marca a chegada agora, para ela não perder brinde por atraso", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{chegada:horaAgora(), chegadaTs:Date.now()}}); }, className:"flex h-8 items-center rounded-md px-2 text-[13px] font-semibold text-primary underline"}, "Marcar agora") : e("span",{className:"flex h-8 items-center text-[13px] font-semibold tabular-nums"}, x[1])); }));
          return e(React.Fragment,null, gradeTopoEstreito, gradeTopo, relogioTopo);
        })(),
        estourou && e("p",{role:"alert", className:"border-b border-destructive/50 bg-destructive/20 px-4 py-2 text-center text-[13px] font-bold text-destructive"},"⏰ O tempo para escolher o kit acabou ("+maxEscolhaMin+" min). Chame a revendedora: há outro atendimento aguardando."),
        avisoIni && e(AvisoLeitura,{key:"avIni", titulo:"Leia para a revendedora antes de começar", texto:textoAntesEscolha(maxEscolhaMin), botao:"Li para ela · começar o tempo", onOk:confirmaInicioEscolha, onCancelar:function(){ setAvisoIni(false); }}),
        estourou && !sel.escolhaAvisoFim && e(AvisoLeitura,{key:"avFim", titulo:"O tempo acabou. Leia para a revendedora", texto:textoFimEscolha(maxEscolhaMin), botao:"Li para ela", onOk:confirmaFimEscolha})
  ]);
  var cartao = function(corpo){ return e("div",{className:"@container flex min-w-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-[#E8B84B]/25"}, topoCard, corpo); };

  // ── estação 1: condicionais (esquerda) e vendas (direita) ──
  var GCOND = " grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_minmax(0,1.2fr)_3.5rem_2rem]";   // Cobrar · Nº · Data de saída · Valor · Peças · remover
  var revDm = sel ? (s.revInternas||[]).find(function(r){ return r.id===sel.revIntId; }) : null;
  var faltamDm = revDm ? condsDaDevmaster(revDm.conds).filter(function(c){ return !condicionaisTodas.some(function(x){ return x.numero===c.numero; }); }) : [];
  var dataCurta = function(iso){ return iso ? String(iso).slice(0,10).split("-").reverse().join("/") : "—"; };
  var tabCond = e("div",{className:CTP},
    e("div",{className:CABT+GCOND}, e("span",null,"Cobrar"), e("span",null,"Nº"), e("span",null,"Saída"), e("span",null,"Valor"), e("span",null,"Peças"), e("span")),
    condicionaisTodas.length===0 && e("div",{className:LIN+" grid-cols-1 min-h-9"}, e("span",null,"Nenhuma condicional")),
    condicionaisTodas.map(function(c,i){ var cobra = c.cobrar!==false; return e("div",{key:c.numero+"-"+i, className:LIN+GCOND+(cobra ? "" : " opacity-60")},
      e("input",{type:"checkbox", checked:cobra, disabled:jaFeito, "aria-label":"Cobrar a condicional "+c.numero, title:cobra ? "Cobrando esta condicional" : "Marque para cobrar esta condicional", className:"size-5 justify-self-center accent-[#E8B84B]", onChange:function(ev){ editCond(i,{cobrar:ev.target.checked}); }}),
      e("input",{value:c.numero, disabled:jaFeito, inputMode:"numeric", "aria-label":"Número da condicional "+(i+1), className:CPT, onChange:function(ev){ editCond(i,{numero:soDigitos(ev.target.value,8)}); }}),
      e("span",{className:"text-[13px] tabular-nums", title:(c.tipo ? c.tipo : "")+(c.prevista ? " · devolução prevista "+dataCurta(c.prevista) : "")}, dataCurta(c.saida)),
      e(CampoDinheiro,{value:c.valor, disabled:jaFeito, label:"Valor da condicional "+(i+1), className:CPT, onChange:function(v){ editCond(i,{valor:v||0}); }}),
      e("input",{value:c.pecas>0 ? c.pecas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Peças da condicional "+(i+1), className:CPT, onChange:function(ev){ editCond(i,{pecas:Number(soDigitos(ev.target.value,4))||0}); }}),
      jaFeito ? e("span") : e(Remover,{label:"Remover condicional "+c.numero, onClick:function(){ setConds(condicionaisTodas.filter(function(x,j){ return j!==i; })); }})); }),
    e("div",{className:"flex-1"}),
    !jaFeito && faltamDm.length>0 && e("button",{type:"button", onClick:function(){ setConds(condicionaisTodas.concat(faltamDm)); }, className:"h-8 w-full border-t border-primary/20 text-[13px] font-semibold hover:bg-white/5 hover:text-primary"}, "Trazer condicionais da DevMaster ("+faltamDm.length+")"),
    !jaFeito && condNovaAberta && e("div",{className:LIN+GCOND+" bg-primary/15!"}, e("span"),
      e("input",{value:condManual.numero, inputMode:"numeric", placeholder:"Nº", "aria-label":"Número da nova condicional", className:CPT, onKeyDown:onEnter(addCond), onChange:function(ev){ setCondManual(Object.assign({}, condManual, {numero:soDigitos(ev.target.value,8)})); }}), e("span"),
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
    !jaFeito && !temVenda && e("p",{key:"svh", className:"px-3 pb-2 text-center text-[13px] font-semibold"}, "Para continuar: digite o valor vendido ou clique em Não teve venda."),
    linhaKV("Peças vendidas", e("input",{value:totalVendidas>0 ? totalVendidas : "", disabled:jaFeito, inputMode:"numeric", placeholder:"0", "aria-label":"Quantidade de peças vendidas", className:CPT, onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{vendidasTotal:Number(soDigitos(ev.target.value,4))||0}}); }}), {z:true}),
    form.vendaBruta>0 && !jaFeito && e("p",{key:"cc", className:"px-3 py-1 text-center text-[11px]"}, "Crédito do setor de Trocas: preencha só se o setor informar."),   // 19/11/2026 (Marcus): sem caixa, sem borda e sem botão
    form.vendaBruta>0 && linhaKV("Desconto de crédito", e(CampoDinheiro,{value:form.garantia, label:"Desconto de crédito (garantia)", className:CPT, onChange:function(v){ up({garantia:v||0}); }}), {z:true, pill:"Trocas"}),
    (ehPrata || dv.novas) && linhaKV(dv.novas ? "Dias úteis de atraso do acerto" : "Dias de atraso (Prata)", e("input",{type:"number", value:form.atrasoDias||0, disabled:true, readOnly:true, title:"Contado pelo sistema: dias úteis desde o primeiro dia marcado", "aria-label":"Dias úteis de atraso (contado pelo sistema)", className:CPT+" cursor-not-allowed opacity-60"}), {pill:"Sistema"}),
    e("div",{key:"svsp", className:"flex-1"}),
    // Não teve venda: discreto e lá embaixo, sem brilho (Marcus, 16/11/2026: "é 1 a cada 50, não é o foco")
    // COMISSÃO ANTIGA (Marcus, 16/11/2026): se a revendedora questionar, um botão cobra ESTE acerto pela tabela antiga; o próximo acerto volta à regra nova e o uso fica registrado na ficha
    // dois botões lado a lado, pequenos e sem texto extra (Marcus, 16/11/2026): comissão antiga (ela questionou) e não teve venda. A comissão antiga vale só neste acerto; o próximo volta à regra nova e o uso fica na ficha.
    (!jaFeito || form.regraAntiga) && e("div",{key:"ra", className:"flex flex-nowrap items-center justify-center gap-2 p-2 text-[13px]"},
      !ehPrata && e("button",{type:"button", disabled:jaFeito, onClick:function(){ up({regraAntiga:!form.regraAntiga}); }, title:"Use quando a revendedora questionar. Cobra só ESTE acerto pela tabela antiga (brinde de R$ 500,00 a R$ 699,99: Normal R$ 48 e Select R$ 68). O próximo acerto vale a regra nova e o uso fica registrado na ficha da revendedora.", className:"h-8 shrink-0 whitespace-nowrap rounded-md border px-2.5 font-medium disabled:opacity-60 "+(form.regraAntiga ? "border-primary bg-primary/20 text-primary" : "border-foreground/25 bg-card hover:bg-white/10")}, form.regraAntiga ? "✓ Comissão antiga" : "Comissão antiga"),
      !jaFeito && e("button",{type:"button", onClick:function(){ if(!form.semVenda) setPassoAt(6); up(form.semVenda ? {vendaBruta:null, semVenda:false} : {vendaBruta:0, semVenda:true}); }, title:"Venda de R$ 0,00 (clique de novo para desfazer)", className:"h-8 shrink-0 whitespace-nowrap rounded-md border border-foreground/25 bg-card px-2.5 font-medium hover:bg-white/10"}, form.semVenda ? "✓ Sem venda" : "Não teve venda")));
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
    especialRev && especialRev._origem==="funcionaria" && e("p",{className:"text-center text-[13px] font-semibold text-primary"}, "Funcionária: comissão da tabela "+especialRev._nome+"."),
    avisoDivida && e("p",{className:"text-center text-[13px] font-semibold text-destructive"}, avisoDivida),
    dv.novas && pa && (form.atrasoDias||0)>0 && e("p",{className:"text-center text-[13px] font-semibold text-destructive"}, pa.juridico ? "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico." : "Atraso: perde "+pa.atrasoPct+"% da comissão e "+(pa.atrasoBrindePct||0)+"% do brinde."),
    pa && pa.semFaixa && e(Aviso,null,"Abaixo de "+din(versao.gerais.minRenovar)+" de venda: sem comissão."+(ehPrata ? " Kit 100% Prata não renova." : "")));

  // ── estação 2: pagamentos (forma e valor; o financeiro define as contas) ──
  var BANDEIRAS = ["Visa","Mastercard","Elo","Amex","Hipercard"];
  // 16/11/2026 (Marcus): a bandeira só era pedida no LINK. 25/11/2026 (Lucas): cartão de crédito e débito também pedem a bandeira (obrigatória) e o crédito as parcelas, para a Maquininha Banho lançar sozinha com tudo
  var pedeBand = /link/i.test(fl.label||"") || fl.k==="credito" || fl.k==="debito";
  var addPagB = function(){ if(pedeBand && !lancForm.bandeira) return; addPag(); };
  // Links de pagamento JÁ PAGOS desta revendedora (setor Link de pagamento): entram como pagamento já resolvido, sem esperar o financeiro definir conta (Marcus, 11/11/2026)
  var infoLinks = s.lp && sel ? linksParaAcertoPorNome(s, sel.nome) : null;
  var linksEmUso = {}; form.pagamentos.forEach(function(q){ if(q.linkSolId) linksEmUso[q.linkSolId] = 1; });
  var linksPagos = infoLinks ? infoLinks.pagos.filter(function(x){ return !linksEmUso[x.sol.id]; }) : [];
  var linksAguardando = infoLinks ? infoLinks.aguardando : [];
  var contaDoLink = function(sol){ var m = meioDe(s, sol.meioId), lista = formaDe("link").descricoes || [], dsc = m && m.cnpjId ? lista.find(function(c){ return String(c).replace(/\s+/g, " ").endsWith(" - "+m.cnpjId); }) : null; return dsc || (lista.length===1 ? lista[0] : (m ? m.nome : "LINK")); };
  autoLinks.current = function(){
    if(!sel || visor || jaFeito || sel.status==="acertado" || !dv.previaBase || form===FORM_ACERTO_VAZIO) return;
    var ja = form.linksAuto || [], falta = Math.max(0, Math.round((dv.restanteTotal||0)*100)/100); if(!(falta>0.009)) return;
    var x = linksPagos.find(function(y){ return y.usavel && ja.indexOf(y.sol.id)<0; }); if(!x) return;
    var sol = x.sol, valor = Math.min(sol.valor, falta); if(!(valor>0)) return;
    up({linksAuto:ja.concat([sol.id]), pagamentos:form.pagamentos.concat([{forma:"link", valor:valor, parcelas:sol.parcelas || 1, bandeira:sol.bandeira || "", linkSolId:sol.id, jaPagoLink:true, descricao:contaDoLink(sol)}])}); return true; };
  // PIX ADIANTADO (Marcus, 19/11/2026, caso Karine: 4 Pix a prestadores antes do acerto): a lista vem do servidor (o ff é só dos sócios). O Pix entra como pagamento JÁ PAGO, vai ao financeiro com a conta definida e NUNCA volta à fila do Direcionar nem gera segundo repasse.
  var pixLista = pxAd.chave===chavePx && chavePx ? pxAd.lista : [];
  var pixEmUso = {}; form.pagamentos.forEach(function(q){ if(q.pixFfId) pixEmUso[q.pixFfId] = 1; });
  var faltaPx = Math.max(0, Math.round((dv.restanteTotal||0)*100)/100);
  autoPix.current = function(){
    if(!sel || visor || jaFeito || sel.status==="acertado" || !dv.previaBase || form===FORM_ACERTO_VAZIO || !(faltaPx>0.009)) return;
    var ja = form.pixAuto || [], x = pixLista.find(function(y){ return ja.indexOf(y.id)<0 && !pixEmUso[y.id] && y.valor<=faltaPx+0.009; }); if(!x) return;
    up({pixAuto:ja.concat([x.id]), pagamentos:form.pagamentos.concat([{forma:"pix", valor:x.valor, parcelas:1, bandeira:"", data:x.data, pixFfId:x.id, jaPagoPix:true, descricao:x.conta}])}); };
  // Link já pago POR FORA (gerado fora do sistema): registra no setor Link de pagamento como pago e já entra como pagamento (Marcus, 11/11/2026)
  var meioPorConta = function(conta){ var ms = (s.lp && s.lp.meios) || [], m = ms.find(function(x){ return x.tipo==="LINK" && x.cnpjId && String(conta||"").replace(/\s+/g, " ").endsWith(" - "+x.cnpjId); }); return m ? m.id : ""; };
  var registrarPorFora = function(){
    var f = formPF; if(!f || !(f.valor>0) || !f.conta || !f.bandeira || !f.data || jaFeito) return;
    var dup = ((s.lp && s.lp.solicitacoes) || []).find(function(y){ return y.porFora && normNome(y.revendedora)===normNome(sel.nome) && Math.round(y.valor*100)===Math.round(f.valor*100) && String(y.pagoEm||"").slice(0, 10)===f.data; });
    var idF = dup ? dup.id : "SF"+Date.now();
    if(!dup) d({type:"LP", op:"sol_por_fora", id:idF, revendedora:sel.nome, valor:f.valor, parcelas:f.parcelas, bandeira:f.bandeira, pagoEm:f.data===hoje ? agoraSP() : f.data+"T12:00:00", meioId:meioPorConta(f.conta), conta:f.conta, comprovanteImg:f.img || "", por:nomeDe(s.usuario)});
    var falta = Math.max(0, Math.round((dv.restanteTotal||0)*100)/100), valorLinha = Math.min(f.valor, falta);
    if(valorLinha>0) up({pagamentos:form.pagamentos.concat([{forma:"link", valor:valorLinha, parcelas:f.parcelas, bandeira:f.bandeira, linkSolId:idF, jaPagoLink:true, descricao:f.conta}])});
    setFormPF(null); };
  // foto vira JPEG pequeno (mesmo cuidado do comprovante dos pagamentos): fica no pedido do setor Link de pagamento
  var lerFotoComp = function(arq, fim){ if(!arq) return; var rd = new FileReader(); rd.onload = function(){ var img = new Image(); img.onload = function(){ var k = Math.min(1, 800/Math.max(img.width, img.height)), cv = document.createElement("canvas"); cv.width = Math.round(img.width*k); cv.height = Math.round(img.height*k); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); fim(cv.toDataURL("image/jpeg", 0.55)); }; img.src = rd.result; }; rd.readAsDataURL(arq); };
  var contasLink = formaDe("link").descricoes || [];
  var campoPF = function(rot, el){ return e("label",{className:"flex min-w-0 flex-col gap-0.5"}, e("span",{className:CAP}, rot), el); };
  var SELPF = "h-8 w-full rounded-md border border-foreground/25 bg-card px-2 text-[13px]";
  // Links de pagamento (Marcus, 16/11/2026): TUDO vem do setor Link de pagamento, direto. Aqui não há botão para pedir link nem para registrar link por fora; o que já foi pago entra sozinho (acima) e o que está esperando aparece só como aviso.
  var blocoLinks = !jaFeito && !!s.lp && (linksPagos.length>0 || linksAguardando.length>0) ? e("div",{className:"flex flex-col border-t border-foreground/25"},
    e("span",{className:CAP+" px-2 pt-2 text-center"}, "Links de pagamento desta revendedora (vêm do setor Link de pagamento)"),
    linksPagos.map(function(x){ var sol = x.sol; return e("div",{key:sol.id, className:"flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 text-[13px]"},
      e("span",{className:"font-semibold"}, "Já pago · "+din(sol.valor)+(sol.parcelas>1 ? " em "+sol.parcelas+"x" : "")+" · "+formatarDia(sol.pagoEm)+(x.usavel ? "" : " · pago hoje: conta só no próximo acerto")),
      x.usavel && e("span",{className:"whitespace-nowrap text-[11px] font-semibold uppercase tracking-[.03em] text-primary"}, dv.previaBase ? ((form.linksAuto||[]).indexOf(sol.id)>=0 ? "Tirado do acerto" : "Entra sozinho") : "Entra quando lançar a venda")); }),
    linksAguardando.map(function(sol){ var gerado = sol.status==="gerado";
      return e("div",{key:sol.id, className:"px-2 py-1 text-center text-[13px]"},
        (sol.paraAtendimento ? (gerado ? "Link gerado pela Hellen" : "Pedido enviado à Hellen") : "Link aguardando pagamento")+" · "+din(sol.valor)+(sol.parcelas>1 ? " em "+sol.parcelas+"x" : "")+(gerado ? ": aguardando o pagamento da revendedora." : (sol.paraAtendimento ? ": aguardando ela gerar o link." : ": só conta depois de pago."))); })) : null;
  // Pix que a revendedora JÁ mandou antes do acerto (Marcus, 19/11/2026): aparecem como já pagos, sem lançar de novo. O nome do prestador não aparece aqui; o comprovante só abre para quem vê o Financeiro familiar.
  var diaBr = function(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : iso; };
  var blocoPix = !jaFeito && pixLista.length>0 ? e("div",{className:"flex flex-col border-t border-foreground/25"},
    e("span",{className:CAP+" px-2 pt-2 text-center"}, "Pix já pagos antes do acerto"),
    pixLista.map(function(x){ var entrou = !!pixEmUso[x.id], coube = x.valor<=faltaPx+0.009;
      return e("div",{key:x.id, className:"flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 px-2 py-1.5 text-[13px]"},
        e("span",{className:"font-semibold"}, "Já pago · "+din(x.valor)+" · "+diaBr(x.data)),
        e("span",{className:"whitespace-nowrap text-[11px] font-semibold uppercase tracking-[.03em] text-primary"}, entrou ? "Entrou no acerto" : !dv.previaBase ? "Entra quando lançar a venda" : coube ? "Entra sozinho" : "Maior que o valor a pagar: fica para o próximo acerto"),
        x.compKey && s.ff ? e("button",{type:"button", className:"h-8 rounded-md border border-foreground/25 px-2 text-[11px] font-semibold hover:bg-white/10", onClick:function(){ abrirAnexo(x.compKey).catch(function(){ d({type:"AVISO", txt:"Não consegui abrir o comprovante."}); }); }}, "Ver comprovante") : null); })) : null;
  var listaFormas = e("div",{className:"flex flex-col"}, formas.map(function(f,i){ var on = lancForm.forma===f.k;
    return e("button",{key:f.k, type:"button", disabled:jaFeito, onClick:function(){ setLancForm(Object.assign({}, lancForm, {forma:f.k, parcelas:1, bandeira:""})); },
      className:"flex min-h-8 items-center justify-center text-[13px] hover:bg-white/5 "+(on ? "bg-primary/10 font-semibold text-primary shadow-[inset_3px_0_0_var(--primary)]" : (i%2 ? "bg-white/[0.03]" : ""))}, f.label); }));
  var linhaBand = pedeBand && !jaFeito && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5 border-t border-foreground/25 px-2 pt-2"}, e("span",{className:CAP}, "Bandeira"),
    BANDEIRAS.map(function(b){ var on = lancForm.bandeira===b; return e("button",{key:b, type:"button", onClick:function(){ setLancForm(Object.assign({}, lancForm, {bandeira:b})); }, className:"h-8 rounded-md border px-2.5 text-[13px] font-medium "+(on ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25 bg-card hover:bg-white/10")}, b); }));
  var linhaEntrada = !jaFeito && e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-foreground/25 p-2"}, e("span",{className:CAP}, rotForma(fl.k, fl.label)||"Forma"),
    e(CampoDinheiro,{value:lancForm.valor, label:"Valor do pagamento", className:CPT+" w-28!", placeholder:"R$ 0,00", onChange:function(v){ setLancForm(Object.assign({}, lancForm, {valor:v})); }}),
    fl.parcelas && e("span",{className:"inline-flex items-center gap-1"}, e("button",{type:"button", onClick:function(){ setLancForm(Object.assign({}, lancForm, {parcelas:Math.max(1,(lancForm.parcelas||1)-1)})); }, className:"h-8 w-8 rounded-md border border-foreground/25 bg-card"}, "−"), e("b",{className:"min-w-8 text-center text-[13px] tabular-nums"}, (lancForm.parcelas||1)+"x"), e("button",{type:"button", onClick:function(){ setLancForm(Object.assign({}, lancForm, {parcelas:Math.min(6,(lancForm.parcelas||1)+1)})); }, className:"h-8 w-8 rounded-md border border-foreground/25 bg-card"}, "+")),
    e("button",{type:"button", disabled:!lancOk || (pedeBand && !lancForm.bandeira), onClick:addPagB, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, "Adicionar"));
  var GPAG = " grid-cols-[minmax(0,1.5fr)_3.5rem_6.5rem_2rem]";
  var tabPag = e("div",{className:CTB+" flex-none"}, e("div",{className:CABT+GPAG}, e("span",null,"Forma"), e("span",null,"Parc."), e("span",null,"Valor"), e("span")),
    form.pagamentos.length ? form.pagamentos.map(function(q,i){ return e("div",{key:i, className:LIN.replace("min-h-9","min-h-8")+GPAG+(i%2 ? " bg-white/[0.03]" : "")},
      e("span",{className:"whitespace-nowrap"}, rotForma(q.forma, formaDe(q.forma).label)+(q.bandeira ? " · "+q.bandeira : "")+(q.jaPagoLink ? " · já pago no link" : "")+(q.jaPagoPix ? " · já pago antes do acerto" : "")), e("span",null, q.parcelas>1 ? q.parcelas+"x" : "À vista"), n15(din(q.valor)),
      jaFeito ? e("span") : e(Remover,{label:"Remover pagamento", onClick:function(){ cancelarPag(i); }})); })
    : e("div",{className:LIN},e("span",{className:CAP},"Nenhuma forma selecionada")));
  var tabTotPag = e("div",{className:CTB+" flex-none"}, e("div",{className:CABT+" grid-cols-[minmax(0,1fr)_7.5rem]"}, e("span",null,"Totais"), e("span")),
    linhaKV("Valor do acerto", n15(pa ? din(dv.totalAPagar) : "—")), linhaKV("Pagamentos", n15(din(dv.totalPagoAtual), "text-success"), {z:true}),
    e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Falta pagar"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(dv.restanteTotal>0.009 ? "text-destructive" : "text-success")}, din(dv.restanteTotal))));
  // Marcus, 16/11/2026: a etapa Pagamentos é UMA coluna: blocos de totais no topo, a escolha da forma em uma barra e depois tudo em linhas indo para baixo (pode haver muitos pagamentos)
  var cartaoPg = function(k, el){ return e("div",{key:k, className:"flex min-w-0 overflow-hidden rounded-lg border-2 border-primary/50 [&>*]:flex-1"}, el); };
  // 16/11/2026 (Marcus: "tem que aparecer que é botão"): cada forma é um botão com borda; o escolhido fica dourado cheio
  // 23/11/2026 (Stefany): crédito disponível da cliente (para usar) e o que sobrou do pagamento (para guardar)
  var sobraLivre = Math.max(0, Math.round(((dv.totalPagoAtual||0)-(dv.totalAPagar||0)-(sel.creditoGuardado||0))*100)/100);
  var usarCredito = function(){ var v = Math.min(credDisp, dv.faltaAtual); if(!(v>0.009) || jaFeito) return; mexeCredito(-v, "Usado no acerto de "+hoje.split("-").reverse().join("/")); up({pagamentos:form.pagamentos.concat([{forma:"credito_cliente", valor:v, parcelas:1, data:hoje, descricao:"Crédito da cliente", anexo:null}])}); };
  var guardarSobra = function(){ if(!revCred || !(sobraLivre>0.009) || jaFeito) return; mexeCredito(sobraLivre, "Pagou a mais no acerto de "+hoje.split("-").reverse().join("/")); d({type:"INT_ATUALIZAR", id:sel.id, patch:{creditoGuardado:(sel.creditoGuardado||0)+sobraLivre}}); };
  var linhaCredito = !jaFeito && !!revCred && (credDisp>0.009 || sobraLivre>0.009) && e("div",{className:"flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 border-t border-foreground/25 bg-primary/[0.07] px-2 py-1.5 text-[13px]"},
    credDisp>0.009 && e("span",{className:"font-semibold"}, "Crédito da cliente: "+din(credDisp)),
    credDisp>0.009 && dv.faltaAtual>0.009 && e(Btn,{v:"secondary", sm:true, onClick:usarCredito}, "Usar "+din(Math.min(credDisp, dv.faltaAtual))),
    sobraLivre>0.009 && e("span",{className:"font-semibold"}, "Sobrou "+din(sobraLivre)),
    sobraLivre>0.009 && e(Btn,{v:"secondary", sm:true, onClick:guardarSobra}, "Guardar como crédito"));
  var formasBarra = e("div",{className:"grid grid-cols-3 gap-1.5 border-t border-primary/20 p-1.5 @[40rem]:grid-cols-6"}, formas.map(function(f){ var on = lancForm.forma===f.k;
    return e("button",{key:f.k, type:"button", disabled:jaFeito, onClick:function(){ setLancForm(Object.assign({}, lancForm, {forma:f.k, parcelas:1, bandeira:""})); },
      className:"flex h-8 items-center justify-center whitespace-nowrap rounded-md border px-2 text-[13px] font-medium disabled:opacity-60 "+(on ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-foreground/30 bg-card hover:bg-white/10")}, rotForma(f.k, f.label)); }));
  var totaisPg = (e("div",{className:"grid grid-cols-3 gap-px bg-foreground/25"}, [["Valor do acerto", pa ? din(dv.totalAPagar) : "—", ""], ["Pagamentos", din(dv.totalPagoAtual), "text-success"], ["Falta pagar", din(dv.restanteTotal), dv.restanteTotal>0.009 ? "text-destructive" : "text-success"]].map(function(c){
    return e("div",{key:c[0], className:"flex min-h-8 flex-wrap items-center justify-center gap-x-2 bg-card px-2"}, e("span",{className:CAP+" whitespace-nowrap"}, c[0]), e("b",{className:"whitespace-nowrap text-[13px] font-semibold tabular-nums "+c[2]}, c[1])); })));
  var est1 = e("div",{className:"flex min-w-0 flex-1 flex-col gap-2 p-2"},
    // 16/11/2026 (Marcus: "compactar, tem que ter linhas de tabela"): totais, forma, entrada, pagamentos lançados e Financeiro num bloco só, linhas de 32 px
    cartaoPg("u", lado("Pagamentos", e("div",{className:CTB}, totaisPg, formasBarra, linhaBand, linhaEntrada, linhaCredito, blocoLinks, blocoPix, tabPag, pPag), "", "p-0")));

  // ── estação 3: brindes normal e select (código da peça + valor) ──
  var blocoBr = function(cat, titulo, lib, lanc, st, setSt){
    var lista = form.brindes.map(function(b,i){ return {b:b, i:i}; }).filter(function(x){ return x.b.cat===cat; });
    var codOk = codigoBrindeValido(cat, st.codigo), travado = travaBrinde || jaFeito, nLista = lista.length;
    var GB = " grid-cols-[minmax(0,1fr)_6.5rem_2rem]";
    return lado(titulo, e("div",{className:CTB},
      // 16/11/2026 (Marcus: "10 a 14 linhas de brinde... fonte menor conforme a quantidade, sem quebrar"): com mais de 4 peças a lista vira 2 colunas e acima de 8 a letra passa de 13 para 11 px
      lista.length ? e("div",{className:"grid "+(nLista>4 ? "grid-cols-2" : "grid-cols-1")}, lista.map(function(x,k){ return e("div",{key:x.i, className:LIN+" grid-cols-[minmax(0,1fr)_2rem]"+(nLista>8 ? " text-[11px]" : "")+(k%2 ? " bg-white/[0.03]" : "")}, e("b",{className:MONO+" whitespace-nowrap"}, x.b.codigo+" - "+din(x.b.valor)),
        jaFeito ? e("span") : e(Remover,{label:"Remover peça "+x.b.codigo, onClick:function(){ up({brindes:form.brindes.filter(function(y,j){ return j!==x.i; })}); }})); }))
      : e("div",{className:LIN},e("span",{className:CAP},"Nenhuma peça lançada")),
      !travado && e("div",{className:LIN+GB+" bg-primary/15!"},
        e("input",{value:st.codigo, placeholder:cat==="bb" ? "BB0001" : "Código", "aria-label":"Código da peça "+titulo, autoCapitalize:"characters", className:CPT+" uppercase",
          onFocus:function(){ if(cat==="bb" && !st.codigo) setSt(Object.assign({}, st, {codigo:"BB"})); },
          onChange:function(ev){ var c = normalizarCodigo(ev.target.value).slice(0,12); if(cat==="bb" && c) c = "BB"+c.replace(/^B{1,2}/,""); setSt(Object.assign({}, st, {codigo:c})); }}),
        e(CampoReais,{id:"bv-"+cat, value:st.valor, label:"Valor da peça "+titulo, className:CPT, placeholder:"R$ 0,00", onChange:function(v){ setSt(Object.assign({}, st, {valor:v})); }}),
        e("button",{type:"button", disabled:!(codOk && st.valor>0), onClick:function(){ addBrinde(cat, st, setSt); }, "aria-label":"Lançar peça", className:"grid h-8 w-8 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground disabled:opacity-40"}, "+")),
      e("div",{className:"flex-1"}),
      faixaCel([{t:"Libera", v:din(lib)}, {t:"Lançado", v:din(lanc)}, {t:"Saldo", v:(lanc>lib ? "−"+din(lanc-lib) : din(lib-lanc)), cor:(lanc>lib ? "text-destructive" : "text-primary")}]),
      cat==="normal" && motivosBr.length>0 && e("div",{className:"border-t border-foreground/25 px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-[.05em]"}, "Redução: "+motivosBr.join(" · "))));
  };
  var est2 = !pa ? e("div",{className:"flex flex-1 items-center justify-center p-6 text-[13px] text-muted-foreground"}, "Lance as vendas e os pagamentos primeiro.")
    : dv.brindeBloqueio ? e("div",{className:"p-3"}, e(Aviso,{tom:"vermelho"},"Brinde bloqueado — "+dv.brindeBloqueio.frase+(dv.faltaAtual>0.009 ? " (falta "+din(dv.faltaAtual)+")" : "")))
    : e("div",{className:"flex min-w-0 flex-1 flex-col"},
        metades("@[56rem]:grid-cols-2 grid-cols-1", blocoBr("normal","Brinde normal", dv.libN, cb.lancadoNormal, bnIn, setBnIn), blocoBr("bb","Brinde select (BB)", dv.libS, cb.lancadoSelect, bbIn, setBbIn)),
        atrasoBruto && e("label",{className:"flex cursor-pointer items-center justify-center gap-2 border-t border-foreground/25 bg-primary/[0.07] px-3 py-2 text-center text-[13px] font-semibold"},
          e("input",{type:"checkbox", checked:atrasoIsento, disabled:jaFeito, "aria-label":"Não descontar o brinde pelo atraso de chegada", onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{atrasoIsento:ev.target.checked, atrasoIsentoPor:ev.target.checked ? nomeDe(s.usuario) : ""}}); }, className:"size-5 shrink-0 accent-[#E8B84B]"}),
          "Chegou "+atrasoChegada+" min depois do horário. Não descontar o brinde"+(atrasoIsento && sel.atrasoIsentoPor ? " (isentado por "+String(sel.atrasoIsentoPor).split(" ")[0]+")" : " (a cliente avisou)")),
        dv.excedenteBrinde>0 && e("p",{className:"border-t border-foreground/25 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, "Diferença do brinde: "+din(dv.excedenteBrinde)+" soma no valor a pagar (financeiro define a conta)."),
        dv.excedenteBrinde>0 && caixaFinanceiro && e("div",{className:"p-2"}, caixaFinanceiro));

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
    avKit.motivo && mediaVendas!==null && !autKit && e("p",{className:"border-t border-destructive px-3 py-2 text-center text-[13px] font-bold text-destructive"}, avKit.motivo),
    blocoPedidoKit,
    avisoMedia && e("p",{className:"border-t border-destructive px-3 py-2 text-center text-[13px] font-bold text-destructive"}, avisoMedia));
  var tabFaixas = e("div",{className:CTP},
    e("div",{className:CABT+" grid-cols-2"}, e("span",null,"Média das vendas"), e("span",null,"Kit liberado")),
    tabKit.map(function(x,i){ var on = faixaKit && faixaKit.min===x.min;
      return e("div",{key:i, className:LIN+" grid-cols-2 "+(on ? "border-primary bg-primary/15! font-semibold text-primary" : "")}, e("span",null,faixaKitTxt(i,x)), e("b",{className:"font-semibold"}, BK(x.kit))); }));
  var estKit = metades("@[28rem]:grid-cols-2 grid-cols-1", lado("Média das vendas", tabMedia, "", "p-0"), lado("Valor do kit · estoque "+estoqueAtivo, tabFaixas, "", "p-0"));

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
    continuaEf==="sim" && novasLista.map(function(v, i){ return e("div",{key:"nc"+i, className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] bg-primary/10"},
      e("span",{className:"flex items-center justify-center gap-2"}, "Nº da condicional nova"+(novasLista.length>1 ? " "+(i+1) : ""), !jaFeito && novasLista.length>1 && e("button",{type:"button", "aria-label":"Tirar esta condicional nova", onClick:function(){ setNovas(novasLista.filter(function(_, k){ return k!==i; })); }, className:"h-8 rounded-md px-2 text-[13px] hover:bg-white/10"}, "×")),
      e("input",{value:v, disabled:jaFeito, inputMode:"numeric", placeholder:"000000", "aria-label":"Número da condicional nova "+(i+1), className:CPT, onChange:function(ev){ setNovas(novasLista.map(function(x, k){ return k===i ? ev.target.value.replace(/\D/g,"").slice(0,8) : x; })); }})); }),
    continuaEf==="outro_dia" && e("div",{className:LIN+" grid-cols-[minmax(0,1fr)_7.5rem] bg-primary/10"}, e("span",{className:"flex items-center justify-center"}, "Quando vai renovar?"), e("input",{type:"date", value:form.renovaDia||"", min:hoje, disabled:jaFeito, "aria-label":"Data para renovar o kit", className:CPT, onChange:function(ev){ up({renovaDia:ev.target.value}); }})),
    continuaEf==="sim" && !jaFeito && e("button",{type:"button", onClick:function(){ setNovas(novasLista.concat([""])); }, className:"h-8 w-full border-t border-primary/20 text-[13px] font-medium hover:bg-white/5 hover:text-primary"}, "+ Outra condicional nova"),
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
    if(t==="Comissão"){ var fxs = efReg.faixas.slice().sort(function(a,b){ return a.min-b.min; }); fxs.forEach(function(f,i){ var prox = fxs[i+1]; lst.push([prox ? din(f.min)+" a "+din(Math.round((prox.min-0.01)*100)/100) : din(f.min)+" em diante", f.pct+"%"]); }); }   // faixas escritas como o Marcus fala: 300 a 499,99 (13/11/2026), não "a partir de"
    else if(t==="Taxa de deslocamento") lst.push(["Venda abaixo de "+din(g.taxaAbaixoDe), din(((efReg.taxaBaixa||[])[0]||{}).taxa||0)], ["Atendimento na Sorelly","Sem taxa"]);
    else if(t==="Venda mínima" && NV) lst.push(["Média mínima (representante)", din(NV.minimoRepresentante)], ["Média mínima (Sorelly)", din(NV.minimoInterno)], ["Vendas na média", String(NV.mediaVendas)]);
    else if(t==="Acerto na data" && NV) linhasAtraso(NV).forEach(function(l){ lst.push(l); });   // dias úteis (regra de 11/11/2026), sem a escada antiga
    else if(t==="Remarcação") efReg.remarcacao.forEach(function(x,i,arr){ lst.push([(i+1)+"ª vez"+(i===arr.length-1 ? " em diante" : ""), "−"+x.comissaoPct+"% comissão · "+(x.brindePct>=100 ? "sem brinde" : "−"+x.brindePct+"% brinde")]); });
    else if(t==="Pagamento" && NV) lst.push(["Multa sobre o pendente", NV.multaPendentePct+"%"], ["Negociação", "até "+(NV.parcelasMax||2)+" parcelas de no mínimo R$ "+(NV.parcelaMinima||200)+",00"], ["Dívida abaixo de R$ "+(NV.parcelaUnicaAbaixo||400)+",00", "parcela única"], ["Prazo para quitar", NV.prazoQuitarDias+" dias corridos"], ["Parcela atrasada","+"+NV.atrasoQuitacaoPctDia+"% ao dia, até "+NV.atrasoQuitacaoTetoPct+"%"]);
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
  // 12/11/2026 (Edna): PDF com TODAS as regras e os números, para a revendedora que não quer esperar a explicação
  var pdfRegras = function(){
    var w = window.open("","_blank"); if(!w) return;
    var esc = function(t){ return String(t==null ? "" : t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
    var corpoR = regras.map(function(r,i){ var n = numerosRegra(r.t);
      return "<section><h2>"+(i+1)+" · "+esc(r.t)+"</h2><p>"+esc(r.x)+"</p>"
        + (n.length ? "<div class='g c'><span>Em números</span><span>Valor</span></div>"+n.map(function(l){ return "<div class='g'><span>"+esc(l[0])+"</span><b>"+esc(l[1])+"</b></div>"; }).join("") : "")+"</section>"; }).join("");
    w.document.write("<html><head><meta charset='utf-8'><title>Regras do consignado</title><style>body{font:13px Inter,Arial,sans-serif;margin:32px;color:#111}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:0 0 4px}section{margin:14px 0;page-break-inside:avoid}p{margin:0 0 6px;line-height:1.5}.g{display:grid;grid-template-columns:1.5fr 1fr;border:1px solid #bbb;border-top:0;text-align:center}.g>*{padding:6px 8px}.g>*+*{border-left:1px solid #bbb}.c{background:#eee;font-size:11px;text-transform:uppercase;font-weight:700;border-top:1px solid #bbb}</style></head><body><h1>Regras do consignado · Sorelly Joias</h1><div>Revendedora: <b>"+esc(sel.nome)+"</b> · Data: "+new Date().toLocaleDateString("pt-BR")+(modalidade==="prata" ? " · Kit 100% Prata" : "")+"</div>"+corpoR+"</body></html>");
    w.document.close(); setTimeout(function(){ w.print(); }, 300);
  };
  var tabRegra = e("div",{className:CTB},
    e("div",{className:"flex-none p-3 text-left text-[13px] leading-relaxed"}, versaoBase && versaoBase.novas && NOVAS_T[regA.t] && e("span",{className:"mb-1.5 inline-flex"}, pilula("Regra nova (27/10/2026)","border-primary text-primary")), e("p",null, regA.x)),
    nums.length>0 && e("div",{className:CABT+" grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"}, e("span",null,"Em números"), e("span",null,"Valor")),
    nums.map(function(x,i){ return e("div",{key:i, className:LIN+" grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"+(i%2 ? " bg-white/[0.03]" : "")}, e("span",{className:"whitespace-nowrap"},x[0]), e("b",{className:"text-[13px] font-semibold"}, x[1])); }),
    e("div",{className:"flex-1"}),
    !jaFeito && e("div",{className:"flex flex-col items-center gap-2 border-t border-foreground/25 px-3 py-2 text-center text-[13px]"},
      assCiente ? e("p",{className:"font-semibold text-success"}, "✓ Ciência assinada: a revendedora declarou estar ciente de todas as regras.")
      : !cienteAberta ? e("button",{type:"button", onClick:function(){ setCienteAberta(true); }, className:"h-8 rounded-md border border-primary px-4 text-[13px] font-semibold text-primary hover:bg-primary/10"}, "Não quis esperar a explicação · assinar ciência")
      : e(React.Fragment,null,
          e("p",{className:"font-semibold"}, "As regras estão no app da revendedora. Ela precisa assinar que está ciente de todas as regras do consignado."),
          e(QuadroCiencia,{onChange:setAssCiente})),
      (assCiente || cienteAberta) && e("button",{type:"button", onClick:function(){ setAssCiente(null); setCienteAberta(false); }, className:"h-8 rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "Cancelar e explicar as regras")),
    e("div",{className:"flex flex-wrap justify-center gap-2 border-t-2 border-primary/50 p-2"}, e("button",{type:"button", onClick:pdfRegras, className:"h-8 rounded-md border border-foreground/25 bg-card px-4 text-[13px] font-medium hover:bg-white/10"}, "Gerar PDF das regras"), e("button",{type:"button", onClick:marcarLida, className:"h-8 rounded-md border px-4 text-[13px] font-semibold "+(regrasOk[rSel] ? "border-foreground/25 bg-card" : "border-primary bg-primary text-primary-foreground")}, regrasOk[rSel] ? "✓ Regra lida · desfazer" : "Li e expliquei esta regra"),
      cienteOk && e("button",{type:"button", disabled:!pronto, onClick:registrar, title:!temVenda ? "Falta o valor vendido." : !continuaEf ? "Falta escolher se ela continua (condicional nova)." : "Registra o atendimento", className:"h-8 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, retornando ? "Finalizar atendimento" : "Registrar acerto")));
  // Marcus, 16/11/2026: "se a vendedora não quis ler as regras, aparece um botão e vai para a tela de assinatura, para a última tela somente": o botão troca a tela das regras por esta, só com a assinatura
  var telaCiencia = e("div",{className:"flex min-w-0 flex-1 flex-col"}, lado("Ciência das regras · assinatura",
    e("div",{className:CTB},
      e("div",{className:"flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-[13px]"},
        e("p",{className:"font-semibold"}, "As regras estão no app da revendedora. Ela precisa assinar que está ciente de todas as regras do consignado."),
        e(QuadroCiencia,{onChange:setAssCiente}),
        assCiente && e("p",{className:"font-semibold text-success"}, "✓ Ciência assinada: a revendedora declarou estar ciente de todas as regras."),
        saiu && e("p",{className:"font-semibold text-[#FBBF24]"}, "Registrado: a revendedora saiu sem assinar. A ciência fica pendente na ficha dela."),
        !assCiente && e("button",{type:"button", onClick:function(){ setSaiu(!saiu); }, className:"h-8 rounded-md border px-4 text-[13px] font-semibold "+(saiu ? "border-foreground/25 bg-card" : "border-primary text-primary hover:bg-primary/10")}, saiu ? "Desfazer: revendedora saiu sem assinar" : "Revendedora saiu sem assinar")),
      e("div",{className:"flex flex-wrap justify-center gap-2 border-t-2 border-primary/50 p-2"},
        e("button",{type:"button", onClick:function(){ setAssCiente(null); setCienteAberta(false); }, className:"h-8 rounded-md border border-foreground/25 bg-card px-3 text-[13px] hover:bg-white/10"}, "Cancelar e explicar as regras"),
        e("button",{type:"button", onClick:pdfRegras, className:"h-8 rounded-md border border-foreground/25 bg-card px-4 text-[13px] font-medium hover:bg-white/10"}, "Gerar PDF das regras"),
        cienteOk && e("button",{type:"button", disabled:!pronto, onClick:registrar, title:!temVenda ? "Falta o valor vendido." : !continuaEf ? "Falta escolher se ela continua (condicional nova)." : "Registra o atendimento", className:"h-8 rounded-md bg-primary px-4 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, retornando ? "Finalizar atendimento" : "Registrar acerto"))), "flex-1", "p-0"));
  var est4 = (jaFeito || msgs) ? e("div",{className:"flex flex-1 flex-col gap-3 p-3"}, pRegras)
    : cienteAberta ? telaCiencia
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
  var estVendas = e("div",{className:"flex min-w-0 flex-1 flex-col"}, metades("@[56rem]:grid-cols-2 grid-cols-1", lado("Vendas", [tabVendas, notasVendas], "", "gap-0! p-0"), lado("Acerto", tabAcerto, "", "gap-0! p-0")));
  var estEscolha = e("div",{className:"flex min-w-0 flex-1 flex-col"}, lado("Escolha do kit · "+(sel.tipo==="kit_novo" ? "Kit novo" : "Kit retornando"), e("div",{className:"flex flex-col items-center justify-center gap-3 p-6 text-center text-[13px]"},
    e("p",{className:"font-semibold"}, "A revendedora escolhe as peças do kit. Tempo máximo: 60 minutos."),
    sel.tipo==="retornando" && e("div",{className:"flex w-full max-w-md flex-col gap-1 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-left font-semibold"},
      !histRet ? e("span",null, !codDm ? "Sem código DevMaster desta revendedora: defina o valor do kit à mão." : sel.vendasDmErro ? "Sem vendas anteriores na DevMaster: defina o valor do kit à mão." : "Buscando as últimas vendas na DevMaster…") : [
        e("div",{key:"t", className:"flex justify-between"}, e("span",null,"Média das últimas "+avRet.lista.length+" vendas"), e("b",null, avRet.media!=null ? din(avRet.media) : "—")),
        avRet.lista.map(function(x,i){ return e("div",{key:i, className:"flex justify-between pl-3 font-medium"}, e("span",null, x.mes.slice(5)+"/"+x.mes.slice(0,4)), e("span",null, din(x.venda))); }),
        e("div",{key:"k", className:"flex justify-between border-t border-primary/40 pt-1 text-primary"}, e("span",null,"Valor do kit liberado"), e("b",null, kitRet ? din(kitRet) : "Não libera"+(avRet.motivo ? " · "+avRet.motivo : "")))]),
    sel.tipo==="kit_novo" && (valorKitNovo>0 ? e("p",{className:"rounded-md border border-primary/50 bg-primary/10 px-3 py-2 font-semibold"}, "Valor do kit liberado: "+din(valorKitNovo)+" · definido pela Michele") : e("p",{className:"font-semibold text-destructive"}, "A Michele ainda não lançou o valor deste kit novo.")),
    !sel.escolhaIni ? e("p",null, "Clique em ⏱ Começou, no topo, quando ela começar a escolher.") : sel.escolhaFim ? e("p",{className:"font-semibold text-success"}, "✓ Escolha terminada em "+relogio(decorridoSeg)+". Clique em Próxima e explique as regras.") : e("p",{className:"font-semibold"}, "Escolhendo há "+relogio(decorridoSeg)+" de 60:00. Clique em ■, no topo, quando ela terminar.")), "flex-1", "p-0"));
  var ESTS = simples ? [["Atendimento",[]]] : retornando ? [["Escolha do kit",[]], ["Regras",[5]]] : [["Condicionais",[0]], ["Vendas",[1]], ["Pagamentos",[2]], ["Valor do kit",[]], ["Brindes",[3]], ["Condicional nova",[4]], ["Regras",[5]], ["Resumo do acerto",[]]];   // 8ª etapa (Marcus, 16/11/2026): o resumo fica sempre à mão, para a funcionária conferir a qualquer momento
  var feitoE = ESTS.map(function(x){ return x[0]==="Atendimento" || x[0]==="Resumo do acerto" ? jaFeito : x[0]==="Escolha do kit" ? (!!sel.escolhaFim || jaFeito) : x[0]==="Condicionais" ? (!!sel.condOk || jaFeito) : x[0]==="Valor do kit" ? (mediaVendas!==null && !!kitLiberado) : x[1].every(function(j){ return feitoPasso[j]; }); });
  var libE = ESTS.map(function(x,i){ return jaFeito || (simples ? !!sel.inicioTs : retornando ? (i===0 ? !!sel.inicioTs : !!sel.escolhaFim) : (i===0 || i===7 ? !!sel.inicioTs : i===1 ? !!sel.condOk : temVenda)); });
  var valE = ["", temVenda ? din(form.vendaBruta||0) : "", form.pagamentos.length ? din(dv.totalPagoAtual) : "", kitLiberado ? din(kitLiberado) : "", form.brindes.length ? din(cb.lancadoNormal+cb.lancadoSelect) : "", "", nRegras>0 ? nRegras+"/"+regras.length+(cienteOk || jaFeito ? " · passadas" : "") : "", ""];
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
      e("button",{type:"button", disabled:estAt===ESTS.length-1 || !libE[estAt+1], onClick:function(){ setPassoAt(estAt+1); }, className:"h-8 w-[5.5rem] rounded-md bg-primary text-[13px] font-semibold text-primary-foreground disabled:opacity-40 "+(feitoE[estAt] && libE[estAt+1] && estAt<ESTS.length-1 && !(dv.excedenteBrinde>0 && podeEnviar) ? BRILHO : "")}, "Próxima ›")));
  var ROT_SIMPLES = {indicacao:"Brinde de indicação", reposicao:"Reposição", troca:"Troca de peça"}[sel.tipo] || "";
  // 17/11/2026 (Marcus, sugestão da Kawany): Brinde de indicação lança as peças pelo CÓDIGO, o preço vem da DevMaster sozinho, o print das peças fica anexado e o que passar do valor liberado é pago na hora (diferença do brinde, igual ao acerto)
  var salvaInd = function(lista){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{pecasInd:lista}}); };
  var addPecaInd = function(){
    var cod = normalizarCodigo(pecaIn.codigo); if(!cod || jaFeito || pecaIn.carregando) return;
    if(pecasInd.some(function(x){ return x.codigo===cod; })){ setPecaIn({codigo:"", carregando:false, aviso:"Esse código já está na lista."}); return; }
    var entra = function(desc, preco, aviso){ salvaInd(pecasInd.concat([{codigo:cod, descricao:desc||"", valor:preco||0}])); setPecaIn({codigo:"", carregando:false, aviso:aviso||""}); };
    if(!apiAtiva()){ entra("", 0, "Sem ligação com o servidor: digite o valor."); return; }
    setPecaIn(Object.assign({}, pecaIn, {carregando:true, aviso:""}));
    chamar("GET", "/precos-pecas?codigos="+encodeURIComponent(cod)).then(function(r){ var p = r && r.itens && r.itens[cod];
      if(p && p.preco>0) entra(p.descricao, p.preco); else entra(p ? p.descricao : "", 0, p ? "Peça sem preço na DevMaster: digite o valor." : "Código não achado na DevMaster: digite o valor.");
    }).catch(function(){ entra("", 0, "Não consegui buscar o preço: digite o valor."); });
  };
  var pagouInd = excInd<=0 || (!!lancFin && !alterado && tudoComComprovante);
  var podeFinalizarSimples = !!sel.inicioTs && (!ehInd || (pecasInd.length>0 && pagouInd));
  var finalizaSimples = function(){ if(ehInd && lancFin) etapa({etapaComprovantes:true, finalizado:true});
    if(ehInd && resgateInd) d({type:"IND", op:"resgate_entregar", id:resgateInd.id, codigosPecas:pecasInd.map(function(x){ return x.codigo; }).join(" "), valorVenda:totalInd, valorDiferencaBrinde:excInd>0 ? excInd : null, responsavelNome:nomeDe(s.usuario), revendedoraConfirmou:true, por:nomeDe(s.usuario)});
    d({type:"INT_SIMPLES_FIM", id:sel.id, por:nomeDe(s.usuario)}); };
  var GRID_IND = " grid-cols-[7.5rem_minmax(0,1fr)_8rem_2.5rem]";
  var G_KV = " grid-cols-[minmax(0,1fr)_9rem]";
  var corpoInd = e("div",{className:"flex w-full flex-col bg-primary/[0.07]"},
    !jaFeito && e("div",{className:"grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2"},
      e("input",{value:pecaIn.codigo, disabled:pecaIn.carregando, placeholder:"Código da peça", "aria-label":"Código da peça do brinde", autoCapitalize:"characters", className:INPUT+" h-8! w-full bg-primary/[0.12]! text-center uppercase "+MONO,
        onKeyDown:onEnter(addPecaInd), onChange:function(ev){ setPecaIn({codigo:normalizarCodigo(ev.target.value).slice(0,14), carregando:false, aviso:""}); }}),
      e(Btn,{v:"primary", sm:true, disabled:!pecaIn.codigo || pecaIn.carregando, onClick:addPecaInd}, pecaIn.carregando ? "Buscando" : "Adicionar")),
    pecaIn.aviso && e("p",{className:"px-3 pb-2 text-center text-[13px] font-semibold text-warning"}, pecaIn.aviso),
    !jaFeito && !resgateInd && e("p",{className:"px-3 pb-2 text-center text-[13px] font-semibold text-warning"}, resgatesDela.length ? "O pedido desta revendedora em Indicações ainda não foi agendado (aprovado): agende lá. Por enquanto, digite o valor liberado." : "Não achei pedido aprovado desta revendedora em Indicações. Digite o valor liberado."),
    e("div",{className:CTP},
      e("div",{className:CABT+GRID_IND}, e("span",null,"Código"), e("span",null,"Peça"), e("span",null,"Valor"), e("span")),
      pecasInd.length===0 && e("div",{className:LIN+" grid-cols-1 min-h-9"}, e("span",null,"Nenhuma peça lançada")),
      pecasInd.map(function(x,i){ return e("div",{key:x.codigo, className:LIN+GRID_IND},
        e("b",{className:MONO}, x.codigo), e("span",{className:"min-w-0 truncate text-[11px]", title:x.descricao || ""}, x.descricao || "—"),   // padrao-ok: Marcus pediu o nome da peça em uma linha só, com "..." (19/11/2026)
        
        (x.valor>0 || jaFeito) ? n15(din(x.valor)) : e(CampoReais,{value:x.valor||null, label:"Valor da peça "+x.codigo, className:INPUT+" h-8! w-full bg-primary/[0.12]! text-right "+MONO, onChange:function(v){ salvaInd(pecasInd.map(function(y,j){ return j===i ? Object.assign({}, y, {valor:v||0}) : y; })); }}),
        !jaFeito ? e(Remover,{label:"Remover peça "+x.codigo, onClick:function(){ salvaInd(pecasInd.filter(function(y,j){ return j!==i; })); }}) : e("span")); }),
      // 17/11/2026 (Marcus: "mais centralizado, está tudo errado"): três células iguais lado a lado, rótulo em cima e valor embaixo, tudo centralizado
      e("div",{className:"grid grid-cols-1 border-t border-foreground/40 sm:grid-cols-3"},
        e("div",{className:"flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-1.5"}, e("span",{className:CAP},"Lançado"), n15(din(totalInd))),
        e("div",{className:"flex min-h-14 flex-col items-center justify-center gap-1 border-t border-foreground/25 px-2 py-1.5 sm:border-l sm:border-t-0", title:resgateInd ? resgateInd.premioTitulo+" (pedido "+resgateInd.id+" de Indicações)" : ""}, e("span",{className:CAP}, "Valor liberado"+(resgateInd ? " · pedido "+resgateInd.id : "")),
          (jaFeito || resgateInd) ? n15(din(liberadoInd)) : e(CampoReais,{value:liberadoInd||null, label:"Valor liberado do brinde", className:INPUT+" h-8! w-36 bg-primary/[0.12]! text-center "+MONO, onChange:function(v){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{valorLiberado:v||0}}); }})),
        e("div",{className:"flex min-h-14 flex-col items-center justify-center gap-1 border-t px-2 py-1.5 font-semibold sm:border-l sm:border-t-0 "+(excInd>0 ? "border-destructive bg-destructive/15" : "border-success bg-success/15")},
          e("span",{className:CAP}, excInd>0 ? "Diferença a pagar" : "Dentro do valor liberado"), n15(din(excInd), excInd>0 ? "text-destructive" : "text-success")))),
    excInd>0 && !jaFeito && e("div",{className:"flex flex-wrap items-center justify-center gap-2 border-t border-foreground/25 p-2"},
      e("label",{htmlFor:"formaDifInd", className:CAP}, "Forma de pagamento da diferença"),
      e("select",{id:"formaDifInd", value:sel.formaDifInd||"", onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{formaDifInd:ev.target.value}}); }, className:INPUT+" h-8! w-56 bg-primary/[0.12]! text-center text-[13px]!"},
        e("option",{value:""}, "Escolha a forma"), formas.map(function(f){ return e("option",{key:f.k, value:f.k}, rotForma(f.k, f.label)); }))),
    excInd>0 && caixaFinanceiro,
    excInd>0 && !jaFeito && e("p",{className:"border-t border-foreground/25 px-3 py-2 text-center text-[13px] font-semibold text-destructive"},
      !lancFin ? "Envie a diferença ao financeiro para ele definir a conta." : alterado ? "A diferença mudou: reenvie ao financeiro." : tudoComComprovante ? "Comprovante anexado: pode finalizar." : "Anexe o comprovante da diferença."),
    e("div",{className:"flex flex-col items-center gap-2 border-t border-foreground/25 p-2"},
      !jaFeito && e("textarea",{value:sel.anotacao||"", rows:2, "aria-label":"Anotação do atendimento", placeholder:"Anotação (opcional)", onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{anotacao:ev.target.value}}); }, className:INPUT+" h-auto! w-full resize-none bg-primary/[0.12]! py-2! text-[13px]!"}),
      jaFeito ? e("p",{className:"font-semibold text-success"}, "✓ Atendimento finalizado"+(sel.fim ? " às "+sel.fim : "")+" · "+pecasInd.length+" peça"+(pecasInd.length>1 ? "s" : "")+" · "+din(totalInd)+(sel.anotacao ? " · "+sel.anotacao : ""))
        : e(Btn,{v:"primary", ic:"check", disabled:!podeFinalizarSimples, onClick:finalizaSimples}, "Finalizar atendimento")));
  var estSimples = e("div",{className:"flex min-w-0 flex-1 flex-col"}, ehInd ? lado("Atendimento · "+ROT_SIMPLES, corpoInd, "flex-1", "p-0")
    : lado("Atendimento · "+ROT_SIMPLES, e("div",{className:"flex flex-col items-center justify-center gap-3 p-6 text-center text-[13px]"},
    e("p",{className:"font-semibold"}, sel.tipo==="reposicao" ? "Entregue a reposição à cliente." : "Faça a troca da peça da cliente."),
    !jaFeito && e("textarea",{value:sel.anotacao||"", rows:3, "aria-label":"Anotação do atendimento", placeholder:"Anotação (opcional): o que foi entregue ou trocado", onChange:function(ev){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{anotacao:ev.target.value}}); }, className:INPUT+" h-auto! w-full max-w-md resize-none py-2! text-[13px]!"}),
    jaFeito ? e("p",{className:"font-semibold text-success"}, "✓ Atendimento finalizado"+(sel.fim ? " às "+sel.fim : "")+(sel.anotacao ? " · "+sel.anotacao : ""))
      : e(Btn,{v:"primary", ic:"check", disabled:!podeFinalizarSimples, onClick:finalizaSimples}, "Finalizar atendimento")), "flex-1", "p-0"));

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
  // Marcus, 16/11/2026: o resumo tem só 4 blocos; Brinde normal e Brinde select ficam JUNTOS num bloco só (duas colunas)
  var resBr = function(cat, titulo, lib, lanc){ var L = form.brindes.filter(function(b){ return b.cat===cat; });
    return e("div",{key:cat, className:CTP+(cat==="normal" ? " border-r border-foreground/25" : "")}, [
      e("div",{key:"h", className:CABT+" grid-cols-1"}, titulo),
      // 16/11/2026 (Marcus: "o resumo tem que ter um limite, barra de rolagem, não expande pra baixo"): a lista de peças tem altura máxima e rola por dentro; com mais de 8 peças a letra passa para 11 px
      // linhas compactas (11 px, sem altura mínima) e barra de rolagem fina visível; cada linha "encaixa" no topo ao rolar
      L.length ? e("div",{key:"lista", className:"barra-fina min-h-24 flex-1 basis-0 snap-y snap-mandatory overflow-y-auto"}, L.map(function(b,i){ return e("div",{key:i, className:"grid snap-start grid-cols-1 items-center border-t border-primary/20 px-2.5 py-1 text-center text-[11px] leading-none tabular-nums"+(i%2 ? " bg-white/[0.03]" : "")}, e("b",{className:MONO+" whitespace-nowrap"}, b.codigo+" - "+din(b.valor))); })) : e("div",{key:"n", className:LIN},e("span",{className:CAP},"Nenhuma peça")),
      !L.length && e("div",{key:"sp", className:"flex-1"}), rodaKV("Libera", n15(din(lib))), e("div",{key:"l", className:LIN+G2+" min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Lançado"), e("b",{className:"text-[15px] font-semibold tabular-nums text-primary"}, din(lanc)))]); };
  var resBrindes = lado("Brindes", e("div",{className:"grid min-w-0 flex-1 grid-cols-2"}, resBr("normal","Normal", dv.libN||0, cb.lancadoNormal||0), resBr("bb","Select", dv.libS||0, cb.lancadoSelect||0)), "", "p-0");
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
    rodaKV("Venda líquida", n15(pa ? din(pa.vendaLiquida) : "—")), rodaKV(form.regraAntiga ? "Comissão antiga" : "Comissão", n15(pa ? din(pa.comissao) : "—"), "bg-white/[0.03]"),
    e("div",{key:"ap", className:LIN+G2+" min-h-9 border-y border-primary bg-primary/15! font-semibold"}, e("span",null,"Valor do acerto"), e("b",{className:"text-[15px] font-semibold tabular-nums text-primary"}, pa ? din(dv.totalAPagar) : "—")),
    rodaKV("Pago", n15(din(dv.totalPagoAtual), "text-success")),
    e("div",{key:"sd", className:LIN+G2+" min-h-9 border-t border-foreground/40 font-semibold"}, e("span",null,"Falta pagar"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(dv.restanteTotal>0.009 ? "text-destructive" : "text-success")}, din(dv.restanteTotal))),
    e("div",{key:"sp", className:"flex-1"}),
    e("div",{key:"bt", className:"flex flex-wrap justify-center gap-2 border-t-2 border-primary/50 p-2"},
      e("button",{type:"button", disabled:!temPa, onClick:pdfResumo, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground disabled:opacity-40"}, "Gerar PDF"),
      msgs && sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(msgs.cliente), target:"_blank", rel:"noreferrer", className:"inline-flex h-8 items-center rounded-md border border-foreground/25 bg-card px-3 text-[13px] font-medium hover:bg-white/10"}, "Enviar no WhatsApp"))]);
  // Pagamentos do acerto (Marcus, 16/11/2026): cada forma lançada, o total pago e a diferença do brinde (que vai para o financeiro definir a conta)
  var inadRes = Math.max(0, Math.round(((dv.restanteTotal||0)-(dv.excedenteBrinde||0))*100)/100);
  var pagsRes = form.pagamentos.filter(function(q){ return q.forma && q.valor>0; });
  // Marcus, 16/11/2026: Pagamentos em UMA coluna, uma forma por linha; Total pago, Inadimplência e Diferença do brinde descem logo abaixo
  var resPag = blocoRes("Pagamentos", [e("div",{key:"h", className:CABT+G2}, e("span",null,"Forma"), e("span",null,"Valor")),
    // 16/11/2026 (Marcus: "ali a forma de pagamento não é pix, tem que ter exatamente a conta que foi pago"): com o pagamento direcionado pelo financeiro, a linha mostra a CONTA (ex.: Sicredi Sorelly 34); sem conta definida ainda, mostra a forma
    pagsRes.length ? pagsRes.map(function(q,i){
      var lfPg = lancFin ? lancFin.linhas.filter(function(l){ return l.tipo==="pagamento"; })[i] : null;
      var contasPg = lfPg && lfPg.partes ? lfPg.partes.map(function(p){ return String(p.descricao||"").split(" · ").pop(); }).filter(Boolean) : [];
      var rotPg = contasPg.length ? contasPg.join(" + ") : formaDe(q.forma).label+(q.bandeira ? " "+q.bandeira : "")+(q.parcelas>1 ? " "+q.parcelas+"x" : "");
      return e("div",{key:i, className:LIN+G2+(i%2 ? " bg-white/[0.03]" : "")}, e("span",{title:contasPg.length ? lfPg.partes.map(function(p){ return p.descricao; }).join(" + ") : ""}, rotPg), n15(din(q.valor))); }) : e("div",{key:"n", className:LIN},e("span",{className:CAP},"Nenhum pagamento")),
    e("div",{key:"sp", className:"flex-1"}),
    e("div",{key:"tp", className:LIN+G2+" min-h-9 border-y border-success/60 bg-success/10! font-semibold"}, e("span",null,"Total pago"), e("b",{className:"text-[15px] font-semibold tabular-nums text-success"}, din(dv.totalPagoAtual))),
    // Inadimplência = o que ficou do ACERTO em aberto (a diferença do brinde é outra linha); mostra se houve acordo ou se não quis negociar
    e("div",{key:"in", className:LIN+G2+" min-h-9 "+(inadRes>0.009 ? "border-y border-destructive bg-destructive/15!" : "")+" font-semibold"}, e("span",null,"Inadimplência"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(inadRes>0.009 ? "text-destructive" : "text-success")}, din(inadRes))),
    inadRes>0.009 && e("div",{key:"ni", className:LIN+" grid-cols-1 min-h-9"}, e("span",{className:"font-semibold "+(dv.acordoValido ? "text-success" : "text-destructive")}, dv.acordoValido ? "Acordo fechado"+(Array.isArray(form.acordoParcelas) && form.acordoParcelas.length ? " em "+form.acordoParcelas.length+" parcela"+(form.acordoParcelas.length>1 ? "s" : "") : "") : form.recusouNegociar ? "Não quis negociar" : "Sem negociação")),
    e("div",{key:"db", className:LIN+G2+" min-h-9 border-y "+(dv.excedenteBrinde>0 ? "border-destructive bg-destructive/15!" : "border-primary bg-primary/15!")+" font-semibold"}, e("span",null,"Diferença do brinde"), e("b",{className:"text-[15px] font-semibold tabular-nums "+(dv.excedenteBrinde>0 ? "text-destructive" : "text-primary")}, din(dv.excedenteBrinde||0)))]);
  // 2 blocos em cima e 2 embaixo, cada um com borda própria e espaço entre eles (Marcus, 16/11/2026: "melhore a borda")
  var cartaoRes = function(el, i){ return e("div",{key:"cr"+i, className:"flex min-w-0 overflow-hidden rounded-lg border-2 border-primary/60 bg-card shadow-[0_2px_10px_rgba(0,0,0,.45)] [&>*]:flex-1"}, el); };
  var resumoBloco = e("section",{className:"@container flex flex-1 flex-col overflow-hidden rounded-lg border-2 border-primary/50 bg-card/60"},
    e("div",{className:"grid h-8 grid-cols-[1fr_auto_1fr] items-center bg-linear-to-r from-primary/75 via-primary/30 to-primary/60 px-3 text-[13px] font-semibold"}, e("span",{className:CAP}, nFeitos+" de "+PASSOS.length+" etapas"), e("span",null,"Resumo do acerto · "+sel.nome), e("span",{className:CAP+" justify-self-end"}, new Date().toLocaleDateString("pt-BR"))),
    e("div",{className:"grid flex-1 grid-cols-1 gap-2 p-2 @[34rem]:grid-cols-2 @[34rem]:auto-rows-fr"}, degradeEm([resCond, resBrindes, resPag, resConta].map(cartaoRes))));
  var estResumo = e("div",{className:"flex min-w-0 flex-1 flex-col"}, resumoBloco);   // etapa 8: o resumo todo, aberto a qualquer momento (o financeiro às vezes demora e as etapas não saem na ordem)
  var estFn = !sel.inicioTs && !jaFeito ? e("div",{className:"flex flex-1 items-center justify-center p-6 text-center text-[13px] font-semibold"}, "Clique em ▶ Iniciar atendimento, no topo, para começar.") : (simples ? [estSimples] : retornando ? [estEscolha, est4] : [estCond, estVendas, est1, estKit, est2, est3, est4, estResumo])[estAt];
  var SHELL = "grid min-h-[402px] grid-cols-[14rem_minmax(0,1fr)]";
  // 10/11/2026 (Marcus: "a tela tem que ser responsiva"): o @container fica NA ÁREA DE CONTEÚDO (sem a coluna das etapas), assim "duas colunas" só vale quando cabem de verdade; antes media o cartão inteiro e apertava as tabelas em notebook
  var corpo = e("div",{className:SHELL, onKeyDown:enterProximo}, lateral, e("div",{className:"@container flex min-w-0 flex-col"}, estFn));
  var janelaAss = null;   // a revendedora NÃO assina nada no sistema (Marcus, 11/11/2026)
  return e("div",{className:"contents", style:PRATA ? VARS_PRATA : undefined}, pagina(e("div",{className:"flex min-w-0 flex-col gap-3"},
    visor && e("div",{role:"status", className:"flex flex-wrap items-center justify-center gap-3 rounded-lg border border-primary bg-primary/15 px-3 py-2 text-center text-[13px] font-semibold"}, e("span",null,"Só acompanhando · "+String(quemAtende).split(" ")[0]+" está atendendo. A tela atualiza sozinha."), e("button",{type:"button", onClick:function(){ d({type:"INT_ATUALIZAR", id:sel.id, patch:{iniciadoPor:nomeDe(s.usuario), bipou:nomeDe(s.usuario)}}); }, className:"h-8 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground"}, "Assumir atendimento")),
    e("div",{className:"contents", style:visor ? {pointerEvents:"none"} : undefined}, cartao(corpo)))), janelaAss);
}

export { AbaIntCalculadora };
