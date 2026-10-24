// Sorelly Admin · montagem — pages/AprovacaoCadastros.js
// Aprovação de cadastros (candidatas a revendedora) em QUADRO KANBAN: cada coluna é uma etapa do funil (s.cl.etapasFunil + saídas) e cada cartão é uma candidata.
// Arrastar o cartão (ou "Concluir etapa ›") muda o campo desempenho dela; soltar em "Aprovadas" ou "Reprovadas" abre a janela de decisão.
// Regras e dados em domain/cadastro-leads.js (estado s.cl); aqui só o desenho. Só quem pode decidir (podeDecidirCadastro) aprova, reprova e desfaz.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Dinheiro, Pagina } from "@/apps/montagem/components/padrao";
import { KIT_OPCOES, diasEntre, formatarValorKit, hojeSP, mensagemKit, rotuloKit, valorDoKit } from "@/apps/montagem/domain/cadastro-leads";
import { nomeDe, podeDecidirCadastro } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
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
  var msg = tipo==="aprovar" && v.opcao ? mensagemKit(v.opcao, v.vc, v.ve) : "";
  var copiar = function(){ try{ navigator.clipboard.writeText(msg).then(function(){ set("copiado", true); }); }catch(x){} };
  var ok = tipo!=="aprovar" || !!v.opcao;
  var titulo = tipo==="aprovar" ? "Aprovar cadastro" : tipo==="reprovar" ? "Reprovar cadastro" : "Voltar à análise";
  return e(Janela,{t:titulo, sub:l.nome, fechar:p.fechar, largo:tipo==="aprovar"},
    tipo==="desfazer" && e("p",{className:"text-[13.5px]"}, "O cadastro de "+l.nome+" ("+(l.reviewStatus==="APPROVED" ? "aprovado" : "reprovado")+") volta para a etapa Em análise."),
    tipo==="reprovar" && e("p",{className:"text-[13.5px]"}, "Confirma a reprovação do cadastro de "+l.nome+"?"),
    tipo==="aprovar" && e("div",{className:"flex flex-col gap-2"},
      e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-white/70"}, "Como ela recebe o kit"),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, KIT_OPCOES.map(function(o){ var sel = v.opcao===o.valor;
        return e("button",{key:o.valor, type:"button", onClick:function(){ set("opcao", o.valor); }, className:"flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-bold transition "+(sel ? "bg-[#22C55E]/25 text-[#4ADE80] ring-2 ring-[#22C55E]" : "bg-black/30 ring-1 ring-white/15 hover:bg-white/10")}, sel && e(Ph,{n:"check-circle", s:15}), o.rotulo); })),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
        e(CampoRot,{rot:"Kit em casa (até)"}, e(Dinheiro,{value:v.vc, label:"Kit em casa", onChange:function(x){ set("vc", x); }})),
        e(CampoRot,{rot:"Kit na empresa (até)"}, e(Dinheiro,{value:v.ve, label:"Kit na empresa", onChange:function(x){ set("ve", x); }}))),
      msg && e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/30 p-2.5"},
        e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-white/70"}, "Mensagem para o WhatsApp"),
        e("pre",{className:"whitespace-pre-wrap break-words text-left font-sans text-[13px]"}, msg),
        e(Bt,{ic:v.copiado ? "check" : "copy", tipo:v.copiado ? "ok" : "normal", onClick:copiar, className:"self-center"}, v.copiado ? "Mensagem copiada" : "Copiar mensagem"))),
    tipo!=="desfazer" && e(CampoRot,{rot:"Observação (opcional)"}, e("input",{value:v.nota, "aria-label":"Observação", className:INPUT+" h-10! text-center", onChange:function(ev){ set("nota", ev.target.value); }})),
    e("div",{className:"flex flex-wrap justify-center gap-2"},
      e(Bt,{onClick:p.fechar}, "Cancelar"),
      e(Bt,{tipo:tipo==="reprovar" ? "perigo" : "ok", ic:tipo==="reprovar" ? "x-circle" : tipo==="aprovar" ? "check-circle" : "arrow-counter-clockwise", disabled:!ok, onClick:function(){ p.confirmar(v); }},
        tipo==="aprovar" ? "Confirmar aprovação" : tipo==="reprovar" ? "Confirmar reprovação" : "Voltar à análise")));
}

// ───────────── janela de novo lead (lançamento manual) ─────────────
function DialogoNovo(p){
  var st = useState({nome:"", telefone:"", cidade:"", endereco:"", cep:"", profissao:"", empresa:"", observacoes:"", tags:"", indicadora:""}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var T = function(k, rot, cls){ return e(CampoRot,{rot:rot, className:cls}, e("input",{value:v[k], "aria-label":rot, className:INPUT+" h-10! text-center", onChange:function(ev){ set(k, ev.target.value); }})); };
  return e(Janela,{t:"Novo lead", sub:"Lançamento manual na etapa Em análise", fechar:p.fechar, largo:true},
    e("p",{className:"rounded-lg bg-black/25 px-3 py-2 text-[12.5px] text-white/80"}, "A entrada automática dos cadastros será feita pela integração com o CRM, ainda não conectada. Enquanto isso, os cadastros são lançados manualmente."),
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, T("nome","Nome"), T("telefone","Telefone"), T("cidade","Cidade"), T("cep","CEP"), T("endereco","Endereço","sm:col-span-2"), T("profissao","Profissão"), T("empresa","Empresa"), T("indicadora","Indicada por"), T("tags","Origem (separe por vírgula)"), T("observacoes","Observações","sm:col-span-2")),
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Cancelar"),
      e(Bt,{tipo:"forte", ic:"user-plus", disabled:!v.nome.trim(), onClick:function(){ p.salvar(Object.assign({}, v, {tags:v.tags.split(",").map(function(t){ return t.trim(); }).filter(Boolean), indicadora:v.indicadora.trim()||null})); }}, "Lançar no quadro")));
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
        e("span",{className:"absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/60 px-1 py-0.5 text-[11px] font-bold"}, e(Ph,{n:"magnifying-glass-plus", s:12}), f.rotulo||f.campo||"Foto")); })));
}

function AbaAprovacaoCadastros(){
  var cx = use(), s = cx.state, cl = s.cl, hoje = hojeSP(), por = nomeDe(s.usuario);
  var pode = podeDecidirCadastro(s.usuario);
  var st3 = useState(null), dlg = st3[0], setDlg = st3[1];             // {tipo, id}
  var st4 = useState(false), novo = st4[0], setNovo = st4[1];
  var st5 = useState(null), foto = st5[0], setFoto = st5[1];
  var st6 = useState(null), det = st6[0], setDet = st6[1];             // id do cadastro aberto no detalhe
  var st7 = useState(""), aviso = st7[0], setAviso = st7[1];
  useEffect(function(){ if(!aviso) return; var t = setTimeout(function(){ setAviso(""); }, 4500); return function(){ clearTimeout(t); }; }, [aviso]);

  var etapas = cl.etapasFunil || [], saidas = cl.saidasFunil || [];
  var defs = etapas.concat(saidas), primeira = defs.length ? defs[0].slug : "";
  var temCol = function(sl){ return defs.some(function(d){ return d.slug===sl; }); };
  var nomeCol = function(sl){ var d = defs.find(function(x){ return x.slug===sl; }); return d ? d.nome : sl; };
  var leadDe = function(id){ return id==null ? null : cl.leads.find(function(x){ return String(x.id)===String(id); }) || null; };

  // coluna de cada candidata: decidida = aprovadas/reprovadas (ou cadastradas); em análise nunca fica em coluna de decisão
  var colDe = function(l){
    var d = l.desempenho, ok = temCol(d);
    if(l.reviewStatus==="APPROVED") return d==="cadastradas" && ok ? d : (temCol("aprovada") ? "aprovada" : primeira);
    if(l.reviewStatus==="REJECTED") return temCol("reprovadas") ? "reprovadas" : primeira;
    if(!ok || d==="aprovada" || d==="cadastradas" || d==="reprovadas") return temCol("iniciou-análise") ? "iniciou-análise" : primeira;
    return d;
  };
  var porCol = {}; defs.forEach(function(d){ porCol[d.slug] = []; });
  cl.leads.forEach(function(l){ var c = colDe(l); if(porCol[c]) porCol[c].push(l); });
  Object.keys(porCol).forEach(function(k){ porCol[k].sort(function(a, b){
    var da = a.reviewStatus!=="PENDING", db = b.reviewStatus!=="PENDING";
    if(da && db) return (b.reviewedAt||"").localeCompare(a.reviewedAt||"");
    return (a.entrouNaFilaEm||"").localeCompare(b.entrouNaFilaEm||"") || (Number(a.id)-Number(b.id) || 0); }); });

  var leadDlg = dlg ? leadDe(dlg.id) : null, leadDet = det!=null ? leadDe(det) : null;
  var abrir = function(tipo, lead){ if(pode && lead) setDlg({tipo:tipo, id:lead.id}); };
  var setEtapa = function(l, para){ cx.dispatch({type:"CL", op:"lead_set", id:l.id, desempenho:para, etapaCriadaEm:hoje}); };
  var confirmar = function(v){
    var l = leadDlg; if(!l) return;
    if(dlg.tipo==="aprovar") cx.dispatch({type:"CL", op:"aprovar", id:l.id, opcao:v.opcao, valorCasa:v.vc, valorEmpresa:v.ve, nota:v.nota, por:por});
    else if(dlg.tipo==="reprovar") cx.dispatch({type:"CL", op:"reprovar", id:l.id, nota:v.nota, por:por});
    else cx.dispatch({type:"CL", op:"desfazer", id:l.id, por:por});
    setDlg(null);
  };

  // soltar o cartão em outra coluna (ou "Mover para…")
  var mover = function(l, de, para){
    if(para===de) return;
    if(l.reviewStatus==="REJECTED"){ setAviso("Cadastro reprovado: use Desfazer para voltar à análise."); return; }
    if(l.reviewStatus==="APPROVED"){
      if(para==="aprovada" || para==="cadastradas") setEtapa(l, para);
      else setAviso("Cadastro aprovado: use Desfazer para voltar à análise.");
      return;
    }
    if(para==="aprovada"){ if(pode) abrir("aprovar", l); return; }
    if(para==="reprovadas"){ if(pode) abrir("reprovar", l); return; }
    if(para==="cadastradas"){ setAviso("Aprove o cadastro antes de concluir."); return; }
    setEtapa(l, para);
  };

  // botão principal do cartão: avança a etapa (ou abre a aprovação na última etapa de análise)
  var proximo = function(l, c){
    if(l.reviewStatus==="REJECTED") return null;
    if(l.reviewStatus==="APPROVED") return c==="aprovada" && temCol("cadastradas") ? {sl:"cadastradas", t:"Concluir etapa"} : null;
    if(c==="nao-respondem") return temCol("contato-inicial") ? {sl:"contato-inicial", t:"Retomar contato"} : null;
    var i = etapas.findIndex(function(x){ return x.slug===c; });
    if(i<0) return null;
    var nx = etapas[i+1];
    if(!nx || nx.slug==="aprovada") return {decide:true, t:"Aprovar"};
    return {sl:nx.slug, t:"Concluir etapa"};
  };

  var colunas = defs.map(function(d, i){
    var decide = d.slug==="aprovada" || d.slug==="reprovadas";
    return {k:d.slug, titulo:d.nome, cor:COR_COL[d.slug] || PALETA[i%PALETA.length], itens:porCol[d.slug]||[], aceita:decide ? pode : true};
  });

  // Cartão: nome, cidade e profissão, origem, telefone, tempo na etapa e (se aprovada) o kit. Um botão principal por vez; "Voltar à análise" só aparece em cadastro já decidido
  // (desfaz a aprovação ou a reprovação: o cadastro volta para Em análise, para corrigir um erro).
  var card = function(l, col){
    var c = col.k, dec = l.reviewStatus!=="PENDING", nx = proximo(l, c);
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
      c==="cadastradas" && e(Selo,{cor:"#4ADE80"}, "Já está com a Michele"),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
        nx && (nx.decide
          ? (pode && e(Bt,{tipo:"ok", ic:"check-circle", onClick:function(){ abrir("aprovar", l); }, className:"px-2.5! py-1.5!"}, "Aprovar"))
          : e(Bt,{tipo:"forte", onClick:function(){ setEtapa(l, nx.sl); }, className:"px-2.5! py-1.5!"}, nx.t+" ›")),
        !dec && pode && e(Bt,{tipo:"perigo", ic:"x-circle", onClick:function(){ abrir("reprovar", l); }, className:"px-2.5! py-1.5!"}, "Reprovar")),
      dec && pode && e("button",{type:"button", onClick:function(){ abrir("desfazer", l); }, title:"Desfaz a decisão: o cadastro volta para Em análise (use se aprovou ou reprovou por engano)", className:"text-[11px] text-white/55 underline decoration-dotted hover:text-white"}, "Voltar à análise"));
  };

  return e(Pagina,null,
    e(PageHead,{t:"Aprovação de cadastros", sub:"Quadro das candidatas a revendedora: arraste o cartão ou conclua a etapa"},
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ setNovo(true); }}, "Novo lead")),
    !pode && e("p",{className:"text-center text-[12.5px] text-white/70"}, "Somente quem decide aprova ou reprova. Você move os cartões entre as etapas intermediárias."),
    aviso && e("p",{role:"status", className:"mx-auto w-fit rounded-lg bg-[#F97316]/20 px-3 py-1.5 text-center text-[13px] font-bold text-[#FDBA74] ring-1 ring-[#F97316]/50"}, aviso),
    e(Kanban,{colunas:colunas, card:card, onMover:function(l, de, para){ mover(l, de, para); }, vazio:"Nenhum cadastro nesta etapa."}),
    dlg && leadDlg && e(DialogoDecisao,{key:dlg.tipo+dlg.id, tipo:dlg.tipo, lead:leadDlg, cfg:cl.config, fechar:function(){ setDlg(null); }, confirmar:confirmar}),
    leadDet && e(DialogoDetalhe,{lead:leadDet, etapa:nomeCol(colDe(leadDet)), fechar:function(){ setDet(null); }, ampliar:setFoto}),
    novo && e(DialogoNovo,{fechar:function(){ setNovo(false); }, salvar:function(d){ cx.dispatch(Object.assign({type:"CL", op:"lead_add"}, d)); setNovo(false); }}),
    foto && e("div",{className:"fixed inset-0 z-[60] grid place-items-center bg-black/85 p-3", onClick:function(){ setFoto(null); }},
      e("div",{className:"flex max-h-full flex-col items-center gap-2"}, e("img",{src:foto.url, alt:foto.rotulo||"Foto", className:"max-h-[85vh] max-w-full rounded-lg object-contain"}), e("span",{className:"text-[13px] font-bold"}, (foto.rotulo||foto.campo||"Foto")+" · clique para fechar"))));
}

export { AbaAprovacaoCadastros };
