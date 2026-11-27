// Sorelly Admin · montagem — pages/AprovacaoCadastros.js
// Aprovação de cadastros (candidatas a revendedora) em QUADRO KANBAN: Em análise → Aprovadas | Reprovadas.
// AO VIVO desde 25/11/2026 (pedido do Leonardo): os cadastros vêm da Kommo (guardados pelo admin antigo, com as fotos no CDN) por lib/cadastro-real.js,
// e aprovar, reprovar e desfazer gravam na Kommo e no admin antigo (src/server/cadastro-aprovacao.js), como o admin antigo. Só a Diretoria decide.
// "Analisar fila" = o jeito do admin antigo: um cadastro por vez, com as fotos, e os atalhos A (aprovar), R (reprovar), P (pular) e Z (desfazer a última).
// Decididos aparecem por 7 dias; os anteriores ficam em Desempenho do cadastro › Registros.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, Pagina } from "@/apps/montagem/components/padrao";
import { KIT_OPCOES, diasEntre, formatarValorKit, hojeSP, mensagemKit, rotuloKit, valorDoKit } from "@/apps/montagem/domain/cadastro-leads";
import { nomeDe, podeDecidirCadastro } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { ehAdmin } from "@/apps/montagem/lib/api";
import { buscarCadastro, decidirCadastro, useCadastroReal } from "@/apps/montagem/lib/cadastro-real";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Kanban } from "@/shared/kanban";
import { e, useEffect, useState } from "@/shared/react";

var PALETA = ["#3B82F6", "#A855F7", "#06B6D4", "#F59E0B", "#EC4899", "#22C55E", "#F97316", "#94A3B8"];
var corTag = function(t){ if(t.color && /^#|^rgb|^hsl/i.test(t.color)) return t.color; var h = 0, n = String(t.name); for(var i=0; i<n.length; i++) h = (h*31+n.charCodeAt(i))>>>0; return PALETA[h%PALETA.length]; };
// cor de cada coluna (por slug; etapa nova cai na paleta)
var COR_COL = {"contato-inicial":"#94A3B8", "responderam":"#3B82F6", "iniciou-cadastro":"#06B6D4", "enviou-dados":"#A855F7", "iniciou-análise":"#F97316", "aprovada":"#22C55E", "cadastradas":"#16A34A", "nao-respondem":"#64748B", "reprovadas":"#EF4444"};
var BT = {normal:"bg-muted/50 hover:bg-white/15", ok:"bg-[#22C55E]/25 text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35", perigo:"bg-[#EF4444]/20 text-[#F87171] ring-1 ring-[#EF4444]/50 hover:bg-[#EF4444]/30", forte:"bg-[#F97316] text-black hover:bg-[#FDBA74]"};
function Bt(p){ return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition "+BT[p.tipo||"normal"]+(p.disabled ? " opacity-40" : "")+" "+(p.className||"")}, p.ic && e(Ph,{n:p.ic, s:15}), p.children); }
function Selo(p){ var c = p.cor || "#94A3B8"; return e("span",{className:"inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:c+"26", color:c, boxShadow:"inset 0 0 0 1px "+c+"55"}}, p.children); }
var dbr = function(iso){ if(!iso) return "—"; var d = String(iso).slice(0,10).split("-").reverse().join("/"), h = String(iso).slice(11,16); return h ? d+" "+h : d; };
var nomeIndicadora = function(l){ return !l.indicadora ? "" : typeof l.indicadora==="string" ? l.indicadora : (l.indicadora.nome||""); };

// janela simples centralizada
function Janela(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/65 p-3", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full "+(p.largo ? "max-w-2xl" : "max-w-lg")+" flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-4 text-center ring-2 ring-[#F97316]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"relative"}, e("h2",{className:"font-heading text-lg font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-white/70"}, p.sub),
        e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", className:"absolute right-0 top-0 grid size-8 place-items-center rounded-lg bg-muted/50 hover:bg-white/15"}, e(Ph,{n:"x", s:15}))),
      p.children));
}
function CampoRot(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[12px] font-bold "+(p.className||"")}, p.rot, p.children); }

// dado do cadastro: ícone + rótulo + valor
function Dado(p){
  if(!p.v) return null;
  return e("div",{className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-2 py-1.5 text-center"},
    e("span",{className:"flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, e(Ph,{n:p.ic, s:12}), p.t),
    e("span",{className:"break-words text-[13.5px] font-semibold"}, p.v));
}

// ───────────── janela de confirmação da decisão ─────────────
function DialogoDecisao(p){
  var tipo = p.tipo, l = p.lead, cfg = p.cfg;
  var st = useState({opcao:"", vc:cfg.kitCasaPadrao, ve:cfg.kitEmpresaPadrao, nota:"", copiado:false}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  // 27/11/2026 (Leonardo: "tem no admin antigo, precisa ter no novo"): a aprovação ficou igual à do admin antigo. A mensagem aparece desde o começo
  // (o texto não depende do kit escolhido), com "Copiar mensagem" ao lado do título; o botão Aprovar só libera depois de escolher o kit.
  var msg = tipo==="aprovar" ? mensagemKit(v.opcao, v.vc, v.ve) : "";
  var copiar = function(){ try{ navigator.clipboard.writeText(msg).then(function(){ set("copiado", true); }); }catch(x){} };
  var ok = tipo!=="aprovar" || !!v.opcao;
  var titulo = tipo==="aprovar" ? "Confirmar aprovação" : tipo==="reprovar" ? "Reprovar cadastro" : "Voltar à análise";
  return e(Janela,{t:titulo, sub:tipo==="aprovar" ? null : l.nome, fechar:p.fechar, largo:tipo==="aprovar"},
    tipo==="desfazer" && e("p",{className:"text-[13.5px]"}, "O cadastro de "+l.nome+" ("+(l.reviewStatus==="APPROVED" ? "aprovado" : "reprovado")+") volta para a etapa Em análise."),
    tipo==="reprovar" && e("p",{className:"text-[13.5px]"}, "Confirma a reprovação do cadastro de "+l.nome+"?"),
    tipo==="aprovar" && e("div",{className:"flex flex-col gap-3 text-left"},
      e("p",{className:"text-[13px]"}, "Aprovar o cadastro de ", e("b",null, l.nome), ". Escolha como ela recebe o kit e copie a mensagem."),
      e("div",{className:"flex flex-col gap-1.5"},
        e("b",{className:"text-[13px]"}, "Kit"),
        e("div",{role:"radiogroup", "aria-label":"Kit", className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, KIT_OPCOES.map(function(o){ var sel = v.opcao===o.valor;
          return e("button",{key:o.valor, type:"button", role:"radio", "aria-checked":sel, onClick:function(){ set("opcao", o.valor); }, className:"flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[13px] font-bold transition "+(sel ? "bg-[#22C55E]/20 text-[#4ADE80] ring-2 ring-[#22C55E]" : "bg-black/30 ring-1 ring-white/15 hover:bg-white/10")},
            e("span",{className:"grid size-4 shrink-0 place-items-center rounded-full ring-2 "+(sel ? "ring-[#4ADE80]" : "ring-white/60")}, sel && e("span",{className:"size-2 rounded-full bg-[#4ADE80]"})), o.rotulo); }))),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
        e("label",{className:"flex min-w-0 flex-col gap-1 text-[13px] font-bold"}, "Kit em casa (até)", e(Dinheiro,{value:v.vc, label:"Kit em casa", onChange:function(x){ set("vc", x); }})),
        e("label",{className:"flex min-w-0 flex-col gap-1 text-[13px] font-bold"}, "Kit na empresa (até)", e(Dinheiro,{value:v.ve, label:"Kit na empresa", onChange:function(x){ set("ve", x); }}))),
      e("div",{className:"flex flex-col gap-1.5"},
        e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"text-[13px]"}, "Mensagem"),
          e(Bt,{ic:v.copiado ? "check" : "copy", tipo:v.copiado ? "ok" : "normal", onClick:copiar, className:"px-2.5! py-1.5!"}, v.copiado ? "Mensagem copiada" : "Copiar mensagem")),
        e("pre",{className:"max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-black/30 p-3 text-left font-sans text-[13px] ring-1 ring-white/15"}, msg))),
    tipo==="reprovar" && e(CampoRot,{rot:"Observação (opcional)"}, e("input",{value:v.nota, "aria-label":"Observação", className:INPUT+" h-8! text-center", onChange:function(ev){ set("nota", ev.target.value); }})),
    e("div",{className:"flex flex-wrap justify-end gap-2"},
      e(Bt,{onClick:p.fechar}, "Cancelar"),
      e(Bt,{tipo:tipo==="reprovar" ? "perigo" : "ok", ic:tipo==="reprovar" ? "x-circle" : tipo==="aprovar" ? "check" : "arrow-counter-clockwise", disabled:!ok, titulo:ok ? undefined : "Escolha o kit", onClick:function(){ p.confirmar(v); }},
        tipo==="aprovar" ? "Aprovar" : tipo==="reprovar" ? "Confirmar reprovação" : "Voltar à análise")));
}

// ───────────── janela de detalhe: todos os dados, fotos e observações ─────────────
function DialogoDetalhe(p){
  var l = p.lead, fotos = (l.fotos||[]).filter(function(f){ return f.url; }), dec = l.reviewStatus!=="PENDING", ap = l.reviewStatus==="APPROVED";
  return e(Janela,{t:l.nome, sub:"Etapa: "+p.etapa, fechar:p.fechar, largo:true},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      l.tags.length ? l.tags.map(function(t){ return e(Selo,{key:t.id, cor:corTag(t)}, t.name); }) : e(Selo,null, "Sem origem"),
      nomeIndicadora(l) && e(Selo,{cor:"#F59E0B"}, "Indicada por "+nomeIndicadora(l)),
      dec && e(Selo,{cor:ap ? "#4ADE80" : "#F87171"}, ap ? "Aprovada" : "Reprovada")),
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
      e(Dado,{ic:"phone", t:"Telefone", v:l.telefone}), e(Dado,{ic:"map-pin", t:"Cidade", v:l.cidade}), e(Dado,{ic:"map-pin", t:"Endereço", v:l.endereco}), e(Dado,{ic:"identification", t:"CEP", v:l.cep}),
      e(Dado,{ic:"briefcase", t:"Profissão", v:l.profissao}), e(Dado,{ic:"buildings", t:"Empresa", v:l.empresa}), e(Dado,{ic:"user-circle", t:"Entrou na fila", v:dbr(l.entrouNaFilaEm)}),
      dec && e(Dado,{ic:"check-circle", t:ap ? "Aprovada em" : "Reprovada em", v:dbr(l.reviewedAt)+(l.reviewedBy ? " · "+l.reviewedBy : "")}),
      ap && l.kitOpcao && e(Dado,{ic:"package", t:"Kit", v:rotuloKit(l.kitOpcao)+" · casa "+formatarValorKit(l.kitValorCasa||0)+" · empresa "+formatarValorKit(l.kitValorEmpresa||0)})),
    l.observacoes && e("div",{className:"rounded-lg bg-black/25 px-3 py-2 text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, "Observações"), e("p",{className:"whitespace-pre-wrap break-words text-[13.5px]"}, l.observacoes)),
    dec && l.reviewNote && e("div",{className:"rounded-lg bg-black/25 px-3 py-2 text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, "Observação da decisão"), e("p",{className:"whitespace-pre-wrap break-words text-[13.5px]"}, l.reviewNote)),
    fotos.length>0 && e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-3"}, fotos.map(function(f, i){
      return e("button",{key:i, type:"button", title:"Ampliar a foto", onClick:function(){ p.ampliar(f); }, className:"group relative overflow-hidden rounded-lg bg-black/30 ring-1 ring-white/15 hover:ring-white/40"},
        e("img",{src:f.url, alt:f.rotulo||f.campo||"Foto", className:"h-28 w-full object-cover"}),
        e("span",{className:"absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 px-1 py-0.5 text-[11px] font-bold"}, e(Ph,{n:"magnifying-glass-plus", s:12}), f.rotulo||f.campo||"Foto")); })),
    p.children);
}
// cadastro antigo vem resumido na lista: ao abrir, busca o completo (fotos e observações)
function useCompleto(l){
  var st = useState(null), cheio = st[0], set = st[1];
  useEffect(function(){ set(null); if(l && l.completo===false) buscarCadastro(l.id).then(set).catch(function(){}); }, [l && l.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  return l && l.completo===false ? (cheio || l) : l;
}

var SEMANA = 7;   // decididos aparecem no quadro por 7 dias
var COLS = [{slug:"iniciou-análise", nome:"Em análise"}, {slug:"aprovada", nome:"Aprovadas"}, {slug:"reprovadas", nome:"Reprovadas"}];
function AbaAprovacaoCadastros(){
  var cx = use(), s = cx.state, hoje = hojeSP(), cad = useCadastroReal(s.cl, 5000), cl = cad.cl;
  var pode = ehAdmin() || podeDecidirCadastro(s.usuario);
  var st3 = useState(null), dlg = st3[0], setDlg = st3[1];             // {tipo, id}
  var st5 = useState(null), foto = st5[0], setFoto = st5[1];
  var st6 = useState(null), det = st6[0], setDet = st6[1];             // id do cadastro aberto no detalhe
  var st7 = useState(""), aviso = st7[0], setAviso = st7[1];
  var st8 = useState(false), analisar = st8[0], setAnalisar = st8[1];  // modo "Analisar fila": um cadastro por vez
  var st9 = useState([]), pulados = st9[0], setPulados = st9[1];       // "Pular" manda para o fim da fila (só nesta tela)
  var st10 = useState(null), ultima = st10[0], setUltima = st10[1];    // última decisão desta sessão (Z desfaz)
  var st11 = useState(false), salvando = st11[0], setSalvando = st11[1];
  useEffect(function(){ if(!aviso) return; var t = setTimeout(function(){ setAviso(""); }, 4500); return function(){ clearTimeout(t); }; }, [aviso]);

  var defs = COLS, primeira = COLS[0].slug;
  var nomeCol = function(sl){ var d = defs.find(function(x){ return x.slug===sl; }); return d ? d.nome : sl; };
  var leadDe = function(id){ return id==null ? null : cl.leads.find(function(x){ return String(x.id)===String(id); }) || null; };
  var colDe = function(l){ return l.reviewStatus==="APPROVED" ? "aprovada" : l.reviewStatus==="REJECTED" ? "reprovadas" : primeira; };
  var recente = function(l){ return l.reviewStatus==="PENDING" || (l.reviewedAt && diasEntre(String(l.reviewedAt).slice(0, 10), hoje) < SEMANA); };
  var porCol = {}; defs.forEach(function(d){ porCol[d.slug] = []; });
  cl.leads.forEach(function(l){ if(recente(l)) porCol[colDe(l)].push(l); });
  Object.keys(porCol).forEach(function(k){ porCol[k].sort(function(a, b){
    var da = a.reviewStatus!=="PENDING", db = b.reviewStatus!=="PENDING";
    if(da && db) return (b.reviewedAt||"").localeCompare(a.reviewedAt||"");
    return (a.entrouNaFilaEm||"").localeCompare(b.entrouNaFilaEm||"") || (Number(a.id)-Number(b.id) || 0); }); });
  // fila do modo Analisar: pendentes, mais antigo primeiro; os pulados vão para o fim, na ordem em que foram pulados
  var fila = porCol[primeira].slice().sort(function(a, b){ return pulados.indexOf(a.id)-pulados.indexOf(b.id); });

  var leadDlg = dlg ? leadDe(dlg.id) : null, leadDet = useCompleto(det!=null ? leadDe(det) : (analisar ? fila[0] || null : null));
  var abrir = function(tipo, lead){ if(pode && lead) setDlg({tipo:tipo, id:lead.id}); };
  var setEtapa = function(){ setAviso("As etapas vêm da Kommo: aqui só se aprova ou reprova."); };
  var confirmar = function(v){
    var l = leadDlg; if(!l || salvando) return;
    var tipo = dlg.tipo, dados = tipo==="aprovar" ? {acao:"aprovar", opcao:v.opcao, valorCasa:v.vc, valorEmpresa:v.ve, nota:v.nota} : tipo==="reprovar" ? {acao:"reprovar", nota:v.nota} : {acao:"desfazer"};
    setSalvando(true);
    decidirCadastro(l.id, dados).then(function(){
      setAviso(tipo==="aprovar" ? l.nome+" aprovada. A Kommo já foi atualizada." : tipo==="reprovar" ? l.nome+" reprovada. A Kommo já foi atualizada." : l.nome+" voltou para a análise.");
      setUltima(tipo==="desfazer" ? null : l.id); setDlg(null); if(det!=null && tipo!=="desfazer") setDet(null);
    }).catch(function(x){ setAviso(x.message); setDlg(null); }).then(function(){ setSalvando(false); });
  };
  var pular = function(l){ if(l) setPulados(pulados.filter(function(x){ return x!==l.id; }).concat([l.id])); };

  // atalhos do modo Analisar (como o admin antigo): A aprova, R reprova, P pula, Z desfaz a última decisão desta tela, Esc sai
  useEffect(function(){
    if(!analisar) return undefined;
    var tecla = function(ev){
      if(dlg || foto || ev.ctrlKey || ev.metaKey || ev.altKey || /input|textarea|select/i.test((ev.target && ev.target.tagName) || "")) return;
      var k = String(ev.key||"").toLowerCase(), l = fila[0];
      if(k==="a" && l){ ev.preventDefault(); abrir("aprovar", l); }
      else if(k==="r" && l){ ev.preventDefault(); abrir("reprovar", l); }
      else if(k==="p" && l){ ev.preventDefault(); pular(l); }
      else if(k==="z" && ultima!=null){ ev.preventDefault(); abrir("desfazer", leadDe(ultima)); }
      else if(k==="escape") setAnalisar(false);
    };
    window.addEventListener("keydown", tecla);
    return function(){ window.removeEventListener("keydown", tecla); };
  });

  // soltar o cartão em outra coluna (ou "Mover para…"): só decisões
  var mover = function(l, de, para){
    if(para===de) return;
    if(l.reviewStatus!=="PENDING"){ setAviso("Cadastro já decidido: use Voltar à análise."); return; }
    if(para==="aprovada"){ if(pode) abrir("aprovar", l); return; }
    if(para==="reprovadas"){ if(pode) abrir("reprovar", l); return; }
  };

  // botão principal do cartão: aprovar (em análise)
  var proximo = function(l){ return l.reviewStatus==="PENDING" ? {decide:true, t:"Aprovar"} : null; };

  var colunas = defs.map(function(d, i){
    var decide = d.slug==="aprovada" || d.slug==="reprovadas";
    return {k:d.slug, titulo:d.nome, cor:COR_COL[d.slug] || PALETA[i%PALETA.length], itens:porCol[d.slug]||[], aceita:decide ? pode : false};
  });

  // Cartão: nome, cidade e profissão, origem, telefone, tempo na etapa e (se aprovada) o kit. Um botão principal por vez; "Voltar à análise" só aparece em cadastro já decidido
  // (desfaz a aprovação ou a reprovação: o cadastro volta para Em análise, para corrigir um erro).
  var card = function(l, col){
    var c = col.k, dec = l.reviewStatus!=="PENDING", nx = proximo(l);
    var base = String(l.etapaCriadaEm || l.entrouNaFilaEm || l.criadoEm || "").slice(0,10), dias = base ? Math.max(0, diasEntre(base, hoje)) : 0;
    var ind = nomeIndicadora(l), atraso = !dec && dias>=3, kit = l.reviewStatus==="APPROVED" && l.kitOpcao ? rotuloKit(l.kitOpcao)+" · "+formatarValorKit(valorDoKit(l.kitOpcao, l.kitValorCasa, l.kitValorEmpresa)) : "";
    var local = [l.cidade, l.profissao].filter(Boolean).join(" · ");
    return e("div",{className:"flex w-full flex-col items-center gap-1.5"},
      e("button",{type:"button", title:"Abrir os dados do cadastro", onClick:function(){ setDet(l.id); }, className:"w-full truncate font-heading text-[14px] font-bold leading-tight hover:underline"}, l.nome),
      local && e("span",{className:"flex w-full items-center justify-center gap-1 text-[12px] text-white/80", title:local}, e(Ph,{n:"map-pin", s:12}), e("span",{className:"truncate"}, local)),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1"},
        l.tags.length ? l.tags.map(function(t){ return e(Selo,{key:t.id, cor:corTag(t)}, t.name); }) : e(Selo,null, "Sem origem"),
        ind && e(Selo,{cor:"#F59E0B"}, "Indicada por "+ind)),
      e("div",{className:"flex w-full items-center justify-center gap-3 text-[11.5px] text-white/70"},
        l.telefone && e("span",{className:"flex items-center gap-1", title:"Telefone"}, e(Ph,{n:"phone", s:12}), l.telefone),
        e("span",{className:"flex items-center gap-1 "+(atraso ? "font-semibold text-[#F87171]" : ""), title:atraso ? "Parado há "+dias+" dias nesta etapa" : "Tempo nesta etapa"}, e(Ph,{n:"clock", s:12}), dias===0 ? "hoje" : dias+(dias===1 ? " dia" : " dias"))),
      kit && e("span",{className:"w-full truncate text-center text-[11.5px] text-white/85", title:kit}, kit),
      dec && l.reviewedAt && e("span",{className:"text-[11px] text-white/60"}, dbr(l.reviewedAt)+(l.reviewedBy ? " · "+l.reviewedBy : "")),
      (l.fotos||[]).length>0 && e("span",{className:"flex items-center gap-1 text-[11px]"}, e(Ph,{n:"image", s:12}), l.fotos.length+(l.fotos.length===1 ? " foto" : " fotos")),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
        nx && (nx.decide
          ? (pode && e(Bt,{tipo:"ok", ic:"check-circle", onClick:function(){ abrir("aprovar", l); }, className:"px-2.5! py-1.5!"}, "Aprovar"))
          : e(Bt,{tipo:"forte", onClick:function(){ setEtapa(l, nx.sl); }, className:"px-2.5! py-1.5!"}, nx.t+" ›")),
        !dec && pode && e(Bt,{tipo:"perigo", ic:"x-circle", onClick:function(){ abrir("reprovar", l); }, className:"px-2.5! py-1.5!"}, "Reprovar")),
      dec && pode && e("button",{type:"button", onClick:function(){ abrir("desfazer", l); }, title:"Desfaz a decisão: o cadastro volta para Em análise (use se aprovou ou reprovou por engano)", className:"text-[11px] text-white/55 underline decoration-dotted hover:text-white"}, "Voltar à análise"));
  };

  var lf = fila[0] || null, emAnalise = porCol[primeira].length;
  var hojeAp = cl.leads.filter(function(l){ return l.reviewStatus==="APPROVED" && String(l.reviewedAt||"").slice(0, 10)===hoje; }).length;
  var hojeRp = cl.leads.filter(function(l){ return l.reviewStatus==="REJECTED" && String(l.reviewedAt||"").slice(0, 10)===hoje; }).length;
  return e(Pagina,null,
    e(PageHead,{t:"Aprovação de cadastros", sub:"Cadastros da Kommo: em análise, aprovados e reprovados (últimos 7 dias)"},
      e(Bt,{tipo:"forte", ic:"play", disabled:!emAnalise, onClick:function(){ setDet(null); setAnalisar(true); }}, "Analisar fila ("+emAnalise+")")),
    cad.ligado===false && e("p",{className:"text-center text-[13px] text-destructive"}, "Ligação com a Kommo desligada no servidor (falta ADMIN_ANTIGO_DATABASE_URL)."),
    cad.erro && e("p",{className:"text-center text-[13px] text-destructive"}, cad.erro),
    cad.carregando && e("p",{className:"text-center text-[13px]"}, "Lendo os cadastros da Kommo…"),
    pode && cad.ligado && !cad.gravar && e("p",{className:"text-center text-[13px] text-warning"}, "Decisões desligadas no servidor: aprovar e reprovar precisam de CADASTRO_GRAVAR=1."),
    !pode && e("p",{className:"text-center text-[13px]"}, "Somente a Diretoria aprova ou reprova."),
    aviso && e("p",{role:"status", className:"mx-auto w-fit rounded-lg bg-[#F97316]/20 px-3 py-1.5 text-center text-[13px] font-bold text-[#FDBA74] ring-1 ring-[#F97316]/50"}, aviso),
    e(Kanban,{colunas:colunas, card:card, onMover:function(l, de, para){ mover(l, de, para); }, vazio:"Nenhum cadastro nesta etapa."}),
    dlg && leadDlg && e(DialogoDecisao,{key:dlg.tipo+dlg.id, tipo:dlg.tipo, lead:leadDlg, cfg:cl.config, fechar:function(){ setDlg(null); }, confirmar:confirmar}),
    leadDet && e(DialogoDetalhe,{lead:leadDet, etapa:analisar && det==null ? "Em análise · "+fila.length+" na fila" : nomeCol(colDe(leadDet)), fechar:function(){ setDet(null); setAnalisar(false); }, ampliar:setFoto},
      analisar && det==null && lf && pode && e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
        e(Bt,{tipo:"ok", ic:"check-circle", disabled:salvando, onClick:function(){ abrir("aprovar", lf); }}, "Aprovar (A)"),
        e(Bt,{tipo:"perigo", ic:"x-circle", disabled:salvando, onClick:function(){ abrir("reprovar", lf); }}, "Reprovar (R)"),
        e(Bt,{ic:"skip-forward", disabled:fila.length<2, onClick:function(){ pular(lf); }}, "Pular (P)"),
        ultima!=null && e(Bt,{ic:"arrow-counter-clockwise", onClick:function(){ abrir("desfazer", leadDe(ultima)); }}, "Desfazer a última (Z)"))),
    analisar && det==null && !lf && e(Janela,{t:"Fila vazia", sub:"Nenhum cadastro em análise agora.", fechar:function(){ setAnalisar(false); }},
      e("p",{className:"text-[13px]"}, "Hoje: "+hojeAp+(hojeAp===1 ? " aprovada" : " aprovadas")+" e "+hojeRp+(hojeRp===1 ? " reprovada." : " reprovadas."))),
    foto && e("div",{className:"fixed inset-0 z-[60] grid place-items-center bg-black/85 p-3", onClick:function(){ setFoto(null); }},
      e("div",{className:"flex max-h-full flex-col items-center gap-2"}, e("img",{src:foto.url, alt:foto.rotulo||"Foto", className:"max-h-[85vh] max-w-full rounded-lg object-contain"}), e("span",{className:"text-[13px] font-bold"}, (foto.rotulo||foto.campo||"Foto")+" · clique para fechar"))));
}

export { AbaAprovacaoCadastros };
