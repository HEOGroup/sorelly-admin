// Sorelly Admin · montagem — pages/indicacoes/FunilHistorico.js
// Indicações (setor Cadastro de revendedoras, cor laranja): duas telas-corpo de aba, sem PageHead (a tela com abas junta).
//   AbaIndFunil     — funil das indicadas em quadro Kanban (arrastar, avançar, voltar, detalhe com etapas e histórico, edição, nova indicação).
//   AbaIndHistorico — histórico paginado (planilha antiga + kits entregues no sistema) com filtros.
// Regras e dados em domain/indicacoes.js (estado s.ind); aqui só o desenho. Moedas: entrar em "Kit entregue" credita a indicadora.
// Peças visuais (faixa de indicadores, barra de filtros, janela em colunas, selos) em pages/indicacoes/visual.js.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { ETAPAS_FUNIL, SITUACOES_TRABALHO, buscarRevendedoras, diasEntre, estadoDaPaginacao, etapaAnterior, explicacaoFunil, formatarDataHora, formatarMoedas, formatarTelefone, funilPagina, hojeSP, historico,
  indicacaoDe, indicadoresFunil, legendaDaTaxa, linkWhatsapp, nomeRev, proximaEtapa, rotuloFunil, semDdi, taxaFormatada, textoDaPaginacao } from "@/apps/montagem/domain/indicacoes";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { Alternar, Avatar, BarraFiltros, Bt, BtMini, Busca, Chip, Colunas, FiltroData, Janela, Painel, Passos, Resumo, Secao, Selo, cap1 } from "@/apps/montagem/pages/indicacoes/visual";
import { Kanban } from "@/shared/kanban";
import { e, useState } from "@/shared/react";

var COR_ETAPA = {criado:"#94A3B8", em_andamento:"#60A5FA", cadastro_aprovado:"#F97316", finalizado:"#4ADE80", cancelado:"#EF4444"};
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[12px] font-bold "+(p.className||"")}, p.rot, p.children); }
var CAMPO = INPUT+" w-full text-center";
function Entrada(p){ return e(Campo,{rot:p.rot, className:p.className}, e("input",{type:p.type||"text", value:p.v==null ? "" : p.v, placeholder:p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO})); }
function Erro(p){ return p.t ? e("p",{className:"rounded-lg bg-[#EF4444]/15 px-3 py-2 text-[13px] font-bold text-[#F87171] ring-1 ring-[#EF4444]/40"}, p.t) : null; }
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
// cor do selo de tempo na etapa: até 2 dias verde, até 6 âmbar, 7 ou mais vermelho
var corTempo = function(dias){ return dias<=2 ? "#4ADE80" : dias<=6 ? "#FBBF24" : "#EF4444"; };

// ───────────── campos do formulário da indicada (usado em Nova indicação e na edição) ─────────────
// v = valores {nome, whatsapp, cidade, cep, endereco, numero, observacao, form:{...}}; parte = "dados" | "perfil" (sem parte: tudo)
function CamposIndicada(p){
  var v = p.v, f = v.form, setF = function(k, x){ var n = Object.assign({}, f); n[k] = x; p.set("form", n); }, par = p.parte;
  var dados = e("div",{className:"grid grid-cols-2 gap-2"},
    e(Entrada,{rot:"Nome da indicada", v:v.nome, className:"col-span-2", set:function(x){ p.set("nome", x); }}),
    e(Entrada,{rot:"WhatsApp", v:v.whatsapp, ph:"(41) 99999-9999", className:"col-span-2", set:function(x){ p.set("whatsapp", x); }}),
    e(Entrada,{rot:"Cidade", v:v.cidade, set:function(x){ p.set("cidade", x); }}),
    e(Entrada,{rot:"CEP", v:v.cep, set:function(x){ p.set("cep", x); }}),
    e(Entrada,{rot:"Endereço", v:v.endereco, set:function(x){ p.set("endereco", x); }}),
    e(Entrada,{rot:"Número", v:v.numero, set:function(x){ p.set("numero", x); }}));
  var perfil = e("div",{className:"flex flex-col gap-2"},
    e(Campo,{rot:"Situação de trabalho"}, e("select",{value:f.situacao||"nao", onChange:function(ev){ setF("situacao", ev.target.value); }, className:CAMPO}, SITUACOES_TRABALHO.map(function(o){ return e("option",{key:o.valor, value:o.valor}, o.rotulo); }))),
    f.situacao==="sim" && e("div",{className:"grid grid-cols-2 gap-2"},
      e(Entrada,{rot:"Empresa", v:f.nomeEmpresa, set:function(x){ setF("nomeEmpresa", x); }}), e(Entrada,{rot:"Cargo", v:f.cargo, set:function(x){ setF("cargo", x); }}),
      e(Entrada,{rot:"Tempo na empresa", v:f.tempoAtuacaoEmpresa, set:function(x){ setF("tempoAtuacaoEmpresa", x); }}), e(Entrada,{rot:"Cidade da empresa", v:f.cidadeEmpresa, set:function(x){ setF("cidadeEmpresa", x); }}),
      e(Entrada,{rot:"Endereço da empresa", v:f.enderecoEmpresa, set:function(x){ setF("enderecoEmpresa", x); }}), e(Entrada,{rot:"Número da empresa", v:f.numeroEmpresa, set:function(x){ setF("numeroEmpresa", x); }})),
    f.situacao==="autonoma" && e("div",{className:"grid grid-cols-2 gap-2"},
      e(Entrada,{rot:"Área de atuação", v:f.areaAutonoma, set:function(x){ setF("areaAutonoma", x); }}), e(Entrada,{rot:"Tempo de atuação", v:f.tempoAutonoma, set:function(x){ setF("tempoAutonoma", x); }})),
    (f.situacao==="nao" || !f.situacao) && e("div",{className:"grid grid-cols-2 gap-2"},
      e(Campo,{rot:"Estuda graduação?"}, e("select",{value:f.estudaGraduacao||"", onChange:function(ev){ setF("estudaGraduacao", ev.target.value); }, className:CAMPO}, e("option",{value:""}, "Não informado"), e("option",{value:"sim"}, "Sim"), e("option",{value:"nao"}, "Não"))),
      f.estudaGraduacao==="sim" && e(Entrada,{rot:"Curso", v:f.cursoGraduacao, set:function(x){ setF("cursoGraduacao", x); }})),
    e(Campo,{rot:"Observação"}, e("textarea",{value:v.observacao||"", rows:2, onChange:function(ev){ p.set("observacao", ev.target.value); }, className:INPUT+" h-auto! w-full py-2 text-center"})));
  if(par==="dados") return dados;
  if(par==="perfil") return perfil;
  return e("div",{className:"flex flex-col gap-2"}, dados, perfil);
}
var FORM_VAZIO = function(){ return {situacao:"nao", nomeEmpresa:"", cargo:"", tempoAtuacaoEmpresa:"", enderecoEmpresa:"", numeroEmpresa:"", cidadeEmpresa:"", areaAutonoma:"", tempoAutonoma:"", estudaGraduacao:"", cursoGraduacao:""}; };
// mesma recusa do domínio, antes de enviar (a janela só fecha se estiver tudo certo)
function validarIndicada(ind, v, ignorarId){
  if(!String(v.nome||"").trim()) return "Informe o nome da indicada.";
  var d = semDdi(v.whatsapp); if(d.length<10) return "WhatsApp inválido: informe o DDD e o número.";
  var rep = ind.indicacoes.find(function(x){ return String(x.id)!==String(ignorarId) && x.etapa!=="cancelado" && semDdi(x.indicadaWhatsapp)===d; });
  if(rep) return "Esse WhatsApp já foi indicado ("+(rep.indicadaNome||"indicação #"+rep.id)+", em "+rotuloFunil(rep.etapa)+").";
  return "";
}

// ───────────── Nova indicação (3 colunas: quem indicou | dados da indicada | perfil e registro) ─────────────
function DialogoNova(p){
  var s = p.s, ind = s.ind, st = useState({busca:"", rev:null, novaNome:"", novaTel:"", digitar:false, etapa:"em_andamento", nome:"", whatsapp:"", cidade:"", cep:"", endereco:"", numero:"", observacao:"", form:FORM_VAZIO()}), v = st[0], setV = st[1];
  var er = useState(""), erro = er[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var achadas = v.rev || v.digitar ? [] : buscarRevendedoras(ind, v.busca).slice(0, 6);
  var okRev = !!v.rev || (v.digitar && !!String(v.novaNome).trim()), okDados = !!String(v.nome).trim() && semDdi(v.whatsapp).length>=10;
  var salvar = function(){
    var m = ""; if(v.rev==null && !v.digitar) m = "Escolha a indicadora (busque pelo nome ou digite uma nova)."; else if(v.rev==null && !String(v.novaNome).trim()) m = "Informe o nome da indicadora.";
    if(!m) m = validarIndicada(ind, v, null); if(m){ er[1](m); return; }
    var a = {type:"IND", op:"ind_add", por:p.por, etapa:v.etapa, nome:v.nome, whatsapp:v.whatsapp, cidade:v.cidade, cep:v.cep, endereco:v.endereco, numero:v.numero, observacao:v.observacao || undefined, form:v.form};
    if(v.rev) a.revendedoraId = v.rev.id; else { a.revendedoraNome = v.novaNome; a.revendedoraTelefone = v.novaTel; }
    p.dispatch(a); p.fechar();
  };
  var passos = [{t:"Indicadora", estado:okRev ? "feito" : "atual"}, {t:"Dados da indicada", estado:okDados ? "feito" : okRev ? "atual" : "futuro"}, {t:"Perfil", estado:okRev && okDados ? "atual" : "futuro"}, {t:"Registrar", estado:"futuro"}];
  return e(Janela,{t:"Nova indicação", sub:"Lançamento manual de uma indicação", fechar:p.fechar, tam:"xl", passos:passos},
    e(Colunas,{n:3},
      e(Painel,{t:"Quem indicou", ic:"user-circle", estado:okRev ? "feito" : "atual"},
        v.rev ? e("div",{className:"flex flex-col items-center gap-1.5"}, e(Avatar,{nome:v.rev.nome, s:40}), e("b",{className:"text-[14px]"}, v.rev.nome), v.rev.telefone && e("span",{className:"text-[12.5px] text-white/70"}, formatarTelefone(v.rev.telefone)), e(BtMini,{onClick:function(){ set("rev", null); }}, "Trocar"))
        : v.digitar ? e("div",{className:"flex flex-col gap-2"}, e(Entrada,{rot:"Nome da indicadora", v:v.novaNome, set:function(x){ set("novaNome", x); }}), e(Entrada,{rot:"WhatsApp da indicadora", v:v.novaTel, set:function(x){ set("novaTel", x); }}),
            e("div",null, e(BtMini,{onClick:function(){ set("digitar", false); }}, "Voltar para a busca")))
        : e("div",{className:"flex flex-col gap-2"}, e("div",{className:"flex"}, e(Busca,{v:v.busca, ph:"Buscar revendedora por nome ou telefone", set:function(x){ set("busca", x); }})),
            achadas.map(function(r){ return e("button",{key:r.id, type:"button", onClick:function(){ set("rev", r); }, className:"flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[13px] hover:bg-white/15"}, e(Avatar,{nome:r.nome, s:22}), r.nome+(r.telefone ? " · "+formatarTelefone(r.telefone) : "")); }),
            String(v.busca).trim().length>=2 && !achadas.length && e("p",{className:"text-[12.5px] text-white/60"}, "Nenhuma revendedora encontrada."),
            e("div",null, e(BtMini,{onClick:function(){ setV(Object.assign({}, v, {digitar:true, novaNome:v.busca})); }}, "Digitar uma indicadora nova")))),
      e(Painel,{t:"Dados da indicada", ic:"identification-card", estado:okDados ? "feito" : okRev ? "atual" : undefined}, e(CamposIndicada,{v:v, set:set, parte:"dados"})),
      e(Painel,{t:"Perfil e registro", ic:"clipboard-text", estado:okRev && okDados ? "atual" : undefined},
        e(Campo,{rot:"Começa em"}, e("select",{value:v.etapa, onChange:function(ev){ set("etapa", ev.target.value); }, className:CAMPO}, e("option",{value:"em_andamento"}, rotuloFunil("em_andamento")), e("option",{value:"criado"}, rotuloFunil("criado")))),
        e(CamposIndicada,{v:v, set:set, parte:"perfil"}),
        e(Erro,{t:erro}),
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Registrar indicação")))));
}

// ───────────── confirmação de mudança de etapa (cancelar pede motivo; Kit entregue avisa as moedas) ─────────────
function DialogoMover(p){
  var it = p.item, para = p.para, cfg = p.s.ind.config, nome = it.nome || it.indicadaNome, indicadora = nomeRev(p.s.ind, it.revendedoraId);
  var motivos = cfg.motivosCancelamento || [], st = useState({m:motivos[0]||"outro", livre:"", nota:""}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var cancela = para==="cancelado", credita = para==="finalizado" && cfg.creditarAoFinalizar && !(it.moedasCreditadas>0), estorna = it.etapa==="finalizado" && it.moedasCreditadas>0;
  var motivo = v.m==="outro" ? String(v.livre).trim() : v.m, ok = !cancela || !!motivo;
  var confirmar = function(){ var a = {type:"IND", op:"ind_etapa", por:p.por, id:it.id, etapa:para}; if(cancela) a.motivo = motivo; else if(v.nota.trim()) a.nota = v.nota; p.dispatch(a); p.fechar(); };
  return e(Janela,{t:cancela ? "Cancelar indicação" : "Mover indicação", sub:nome, fechar:p.fechar, tam:"md"},
    e(Colunas,{n:2},
      e(Painel,{t:"Mudança de etapa", ic:"arrows-left-right", estado:"feito"},
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, e(Selo,{cor:COR_ETAPA[it.etapa]}, rotuloFunil(it.etapa)), e(Ph,{n:"arrow-right", s:16}), e(Selo,{cor:COR_ETAPA[para]}, rotuloFunil(para))),
        credita && e("p",{className:"rounded-lg bg-[#22C55E]/15 px-3 py-2 text-[13px] font-bold text-[#4ADE80] ring-1 ring-[#22C55E]/40"}, "Ao confirmar, "+indicadora+" recebe "+formatarMoedas(cfg.moedasPorKit)+" pela indicação."),
        estorna && e("p",{className:"rounded-lg bg-[#FBBF24]/15 px-3 py-2 text-[13px] font-bold text-[#FBBF24] ring-1 ring-[#FBBF24]/40"}, "As "+formatarMoedas(it.moedasCreditadas)+" creditadas a "+indicadora+" serão estornadas.")),
      e(Painel,{t:cancela ? "Motivo" : "Confirmação", ic:"check-square", estado:"atual"},
        cancela && e("div",{className:"flex flex-col gap-2"},
          e(Campo,{rot:"Motivo do cancelamento"}, e("select",{value:v.m, onChange:function(ev){ set("m", ev.target.value); }, className:CAMPO}, motivos.map(function(m){ return e("option",{key:m, value:m}, cap1(m)); }), motivos.indexOf("outro")<0 && e("option",{value:"outro"}, "Outro"))),
          v.m==="outro" && e(Entrada,{rot:"Descreva o motivo", v:v.livre, set:function(x){ set("livre", x); }})),
        !cancela && e(Entrada,{rot:"Nota (opcional)", v:v.nota, set:function(x){ set("nota", x); }}),
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Voltar"), e(Bt,{tipo:cancela ? "perigo" : "forte", ic:"check", disabled:!ok, onClick:confirmar}, cancela ? "Cancelar indicação" : "Confirmar")))));
}

// ───────────── detalhe (3 colunas: dados | etapas e histórico | ações) ─────────────
var ORDEM = ["criado", "em_andamento", "cadastro_aprovado", "finalizado"];
function DialogoDetalhe(p){
  var s = p.s, i = indicacaoDe(s.ind, p.id);
  var ini = function(){ return i ? {nome:i.indicadaNome, whatsapp:i.indicadaWhatsapp, cidade:i.cidade, cep:i.cep, endereco:i.endereco, numero:i.numero, observacao:i.observacao, form:Object.assign(FORM_VAZIO(), i.form)} : null; };
  var st = useState(ini), v = st[0], setV = st[1], er = useState(""), erro = er[0], ed = useState(false), edit = ed[0];
  if(!i || !v) return null;
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var link = linkWhatsapp(i.indicadaWhatsapp), cor = COR_ETAPA[i.etapa], hoje = hojeSP();
  var salvar = function(){ var m = validarIndicada(s.ind, v, i.id); if(m){ er[1](m); return; } p.dispatch(Object.assign({type:"IND", op:"ind_set", por:p.por, id:i.id}, v)); er[1](""); ed[1](false); };
  var Dado = function(q){ return q.v ? e("div",{className:"flex min-w-0 flex-col items-center rounded-lg bg-black/25 px-2 py-1.5 "+(q.className||"")}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/60"}, q.t), e("span",{className:"break-words text-[13.5px] font-semibold"}, q.v)) : null; };
  var sit = SITUACOES_TRABALHO.find(function(o){ return o.valor===(i.form && i.form.situacao); });
  var hist = i.historico||[], quando = function(k){ var h = hist.slice().reverse().find(function(x){ return x.para===k; }); return h ? formatarDataHora(h.em) : (k===i.etapa ? formatarDataHora(i.etapaAlteradaEm) : undefined); };
  // etapas: o que já passou fica "feito" (passa para o lado), a atual em destaque
  var cancelada = i.etapa==="cancelado", ate = cancelada ? ORDEM.indexOf(i.etapaAntesCancelar || "em_andamento") : ORDEM.indexOf(i.etapa);
  var passos = ORDEM.map(function(k, n){ return {t:rotuloFunil(k), sub:n<=ate || (!cancelada && n===ate) ? quando(k) : undefined, estado:cancelada ? (n<=ate ? "feito" : "futuro") : (n<ate || (k==="finalizado" && i.etapa===k) ? "feito" : n===ate ? "atual" : "futuro")}; });
  if(cancelada) passos.push({t:rotuloFunil("cancelado"), sub:quando("cancelado"), estado:"cancelado"});
  return e(Janela,{t:i.nome, sub:"Indicação #"+i.id+" · indicada por "+i.nomeRevendedora, fechar:p.fechar, tam:"xl"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, e(Selo,{cor:cor}, rotuloFunil(i.etapa)), e("span",{className:"text-[12.5px] text-white/70"}, explicacaoFunil(i.etapa)),
      i.moedasCreditadas>0 && e(Selo,{cor:"#4ADE80", ic:"coins"}, formatarMoedas(i.moedasCreditadas)+" creditadas")),
    e(Colunas,{n:3},
      !edit ? e(Painel,{t:"Dados da indicada", ic:"identification-card"},
        e("div",{className:"grid grid-cols-2 gap-2"},
          e(Dado,{t:"WhatsApp", v:i.indicadaWhatsapp ? formatarTelefone(i.indicadaWhatsapp) : ""}), e(Dado,{t:"Indicadora", v:i.nomeRevendedora}), e(Dado,{t:"Cidade", v:i.cidade}), e(Dado,{t:"CEP", v:i.cep}),
          e(Dado,{t:"Endereço", v:[i.endereco, i.numero].filter(Boolean).join(", "), className:"col-span-2"}), e(Dado,{t:"Situação", v:sit ? sit.rotulo : ""}), e(Dado,{t:"Profissão", v:i.profissao}), e(Dado,{t:"Empresa", v:i.empresa}),
          e(Dado,{t:"Tempo de atuação", v:i.tempoAtuacao}), e(Dado,{t:"Endereço da empresa", v:i.enderecoEmpresa, className:"col-span-2"}), e(Dado,{t:"Registrada em", v:formatarDataHora(i.criadoEm)}), e(Dado,{t:"Na etapa desde", v:formatarDataHora(i.etapaAlteradaEm)+" ("+Math.max(0, diasEntre(diaDe(i.etapaAlteradaEm), hoje))+" d)"})))
      : e(Painel,{t:"Dados da indicada", ic:"identification-card", estado:"atual"}, e(CamposIndicada,{v:v, set:set, parte:"dados"})),
      edit ? e(Painel,{t:"Perfil e observação", ic:"clipboard-text", estado:"atual"}, e(CamposIndicada,{v:v, set:set, parte:"perfil"}))
      : e(Painel,{t:"Etapas e histórico", ic:"path"},
        e(Passos,{passos:passos}),
        e("p",{className:"mt-1 flex items-center justify-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-white/70"}, e(Ph,{n:"clock-counter-clockwise", s:14}), "Histórico de mudanças"),
        hist.length ? e("div",{className:"flex flex-col gap-1"}, hist.slice().reverse().map(function(h, k){
          return e("div",{key:k, className:"rounded-lg bg-black/25 px-2 py-1 text-[12px]"}, e("div",{className:"flex flex-wrap items-center justify-center gap-1"}, h.de ? e(Selo,{cor:COR_ETAPA[h.de]}, rotuloFunil(h.de)) : e("span",{className:"text-white/60"}, "—"), e(Ph,{n:"arrow-right", s:12}), e(Selo,{cor:COR_ETAPA[h.para]}, rotuloFunil(h.para))),
            e("span",{className:"block text-[11px] text-white/65"}, formatarDataHora(h.em)+" · "+(h.por||"—")), h.nota && e("span",{className:"block text-white/80"}, h.nota)); }))
        : e("p",{className:"py-2 text-[12.5px] text-white/60"}, "Nenhuma mudança registrada (indicação vinda do arquivo antigo).")),
      e(Painel,{t:"Ações", ic:"lightning", estado:"atual"},
        i.motivoReprovacao && e("p",{className:"rounded-lg bg-[#EF4444]/10 px-2 py-1.5 text-[12.5px] text-[#F87171]"}, "Motivo do cancelamento: "+i.motivoReprovacao),
        !edit && i.observacao && e("p",{className:"rounded-lg bg-black/25 px-3 py-2 text-[12.5px] text-white/80"}, i.observacao),
        edit && e(Erro,{t:erro}),
        e("div",{className:"flex flex-col items-stretch gap-2"},
          !edit && link && e("a",{href:link, target:"_blank", rel:"noopener noreferrer", className:"inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#22C55E]/25 px-3 py-2 text-[13px] font-bold text-[#4ADE80] ring-1 ring-[#22C55E]/50 hover:bg-[#22C55E]/35"}, e(Ph,{n:"whatsapp-logo", s:15}), "Chamar no WhatsApp"),
          !edit && e(Bt,{ic:"note-pencil", onClick:function(){ ed[1](true); }}, "Editar"),
          edit && e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Salvar alterações"), edit && e(Bt,{onClick:function(){ setV(ini()); er[1](""); ed[1](false); }}, "Descartar"),
          e(Bt,{onClick:p.fechar}, "Fechar")))));
}

// ───────────── Funil (Kanban) ─────────────
function AbaIndFunil(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario), ind = s.ind;
  var st = useState({q:"", nova:false, ver:null, mover:null}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var hoje = hojeSP(), ic = indicadoresFunil(ind), t = ic.totais, c = ic.conversao;
  var colunas = ETAPAS_FUNIL.map(function(k){ var r = funilPagina(ind, {etapa:k, q:v.q, limite:100000}); return {k:k, titulo:rotuloFunil(k), cor:COR_ETAPA[k], itens:r.itens, dica:explicacaoFunil(k)}; });
  var total = ETAPAS_FUNIL.reduce(function(n, k){ return n+(t[k]||0); }, 0);
  // mover direto (sem janela) só quando não cancela nem credita/estorna moedas
  var mover = function(it, para){
    if(para===it.etapa) return;
    var cfg = ind.config, mexeMoeda = para==="finalizado" || (it.etapa==="finalizado" && it.moedasCreditadas>0);
    if(para==="cancelado" || (mexeMoeda && cfg.creditarAoFinalizar)){ set("mover", {item:it, para:para}); return; }
    d({type:"IND", op:"ind_etapa", por:por, id:it.id, etapa:para});
  };
  var avancar = function(it){ var pr = proximaEtapa(it.etapa); if(!pr) return; if(pr==="finalizado") set("mover", {item:it, para:pr}); else d({type:"IND", op:"ind_avancar", por:por, id:it.id}); };
  var voltar = function(it){ var an = etapaAnterior(it); if(!an) return; if(it.etapa==="finalizado") set("mover", {item:it, para:an}); else d({type:"IND", op:"ind_voltar", por:por, id:it.id}); };
  var card = function(it){
    var link = linkWhatsapp(it.indicadaWhatsapp), dias = Math.max(0, diasEntre(diaDe(it.etapaAlteradaEm), hoje)), pr = it.etapa!=="cancelado" ? proximaEtapa(it.etapa) : null, an = etapaAnterior(it), cc = COR_ETAPA[it.etapa], aberta = it.etapa!=="finalizado" && it.etapa!=="cancelado";
    // fundo em degradê leve na cor da coluna (sem aumentar a altura do cartão)
    return e("div",{className:"flex flex-col items-center gap-1", style:{margin:"-10px -10px 0 -7px", padding:"10px 10px 4px 7px", borderRadius:"8px 8px 0 0", background:"linear-gradient(160deg, "+cc+"2E 0%, "+cc+"0A 70%, transparent 100%)"}},
      e("div",{className:"flex max-w-full items-center justify-center gap-1.5"}, e(Avatar,{nome:it.nome, cor:cc, s:26}),
        e("button",{type:"button", onClick:function(){ set("ver", it.id); }, title:"Abrir os detalhes", className:"min-w-0 break-words text-left text-[13.5px] font-bold leading-tight hover:underline"}, it.nome)),
      e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 text-[11.5px] text-white/70"},
        it.indicadaWhatsapp && (link ? e("a",{href:link, target:"_blank", rel:"noopener noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"inline-flex items-center gap-1 text-[#4ADE80] hover:underline"}, e(Ph,{n:"whatsapp-logo", s:13}), formatarTelefone(it.indicadaWhatsapp)) : e("span",null, formatarTelefone(it.indicadaWhatsapp))),
        it.cidade && e("span",{className:"inline-flex items-center gap-0.5"}, e(Ph,{n:"map-pin", s:12}), it.cidade)),
      e("span",{className:"text-[11.5px] text-white/65"}, "Indicada por ", e("b",{className:"text-white/90"}, it.nomeRevendedora)),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1"},
        e(Selo,{cor:aberta ? corTempo(dias) : "#94A3B8", ic:"clock", titulo:"Tempo nesta etapa"}, dias===0 ? "Hoje" : dias+(dias===1 ? " dia" : " dias")),
        it.moedasCreditadas>0 && e(Selo,{cor:"#4ADE80", ic:"coins"}, formatarMoedas(it.moedasCreditadas)),
        an && e(BtMini,{onClick:function(){ voltar(it); }, titulo:"Voltar para "+rotuloFunil(an)}, e(Ph,{n:"arrow-left", s:11}), "Voltar"),
        pr && e(BtMini,{forte:true, onClick:function(){ avancar(it); }, titulo:"Avançar para "+rotuloFunil(pr)}, "Avançar", e(Ph,{n:"arrow-right", s:11}))));
  };
  return e(Pagina,null,
    e(Resumo,{itens:[
      {t:rotuloFunil("criado"), v:t.criado, cor:"info"}, {t:rotuloFunil("em_andamento"), v:t.em_andamento, cor:"aberto"}, {t:rotuloFunil("cadastro_aprovado"), v:t.cadastro_aprovado, cor:"laranja"},
      {t:rotuloFunil("finalizado"), v:t.finalizado, cor:"ok"}, {t:rotuloFunil("cancelado"), v:t.cancelado, cor:"cancelado"},
      {t:"Conversão", v:taxaFormatada(c.taxa), cor:"ouro", sub:legendaDaTaxa(c), titulo:"Kit entregue ÷ (Kit entregue + Canceladas)"}]}),
    e(BarraFiltros,{limpar:v.q ? function(){ set("q", ""); } : null},
      e(Busca,{v:v.q, ph:"Buscar por nome, WhatsApp ou indicadora", set:function(x){ set("q", x); }}),
      e(Bt,{tipo:"forte", ic:"user-plus", onClick:function(){ set("nova", true); }, className:"h-9 py-0!"}, "Nova indicação")),
    e(Secao,{ic:"funnel", t:"Funil das indicações", sub:"Arraste o cartão para outra coluna ou use Avançar", dir:total+(total===1 ? " indicação" : " indicações")},
      total===0 && e("p",{className:"py-2 text-center text-[13px] text-white/70"}, "Nenhuma indicação registrada. Use \"Nova indicação\" para lançar a primeira."),
      e(Kanban,{colunas:colunas, card:card, onMover:mover, vazio:v.q.trim() ? "Nenhuma indicação encontrada nesta etapa." : "Nenhuma indicação nesta etapa."})),
    v.nova && e(DialogoNova,{s:s, por:por, dispatch:d, fechar:function(){ set("nova", false); }}),
    v.ver!=null && e(DialogoDetalhe,{s:s, id:v.ver, por:por, dispatch:d, fechar:function(){ set("ver", null); }}),
    v.mover && e(DialogoMover,{s:s, item:v.mover.item, para:v.mover.para, por:por, dispatch:d, fechar:function(){ set("mover", null); }}));
}

// ───────────── Histórico ─────────────
var ORIGENS = [{k:"todas", t:"Todas"}, {k:"planilha", t:"Planilha antiga"}, {k:"sistema", t:"Sistema"}];
function AbaIndHistorico(){
  var cx = use(), ind = cx.state.ind;
  var st = useState({origem:"todas", soMoedas:false, q:"", from:"", to:"", pg:0}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v, {pg:0}); n[k] = x; setV(n); };
  var h = historico(ind, {origem:v.origem, soMoedas:v.soMoedas, q:v.q, from:v.from||null, to:v.to||null, pagina:v.pg}), pg = estadoDaPaginacao(h.paginacao, h.itens.length), r = h.resumo;
  var vazioGeral = r.planilha+r.sistema===0, filtrado = v.from || v.to || v.q || v.soMoedas || v.origem!=="todas";
  var linhas = h.itens.map(function(x){
    return e("tr",{key:x.id, className:LINHA},
      e(Td,null, formatarDataHora(x.quando) || "—"),
      e(Td,{forte:true}, x.nomeRevendedora, x.categoria && e("span",{className:"block text-[11px] font-normal text-white/55"}, x.categoria)),
      e(Td,null, x.nomeIndicada || "—", x.telefoneIndicada && e("span",{className:"block text-[11px] text-white/55"}, formatarTelefone(x.telefoneIndicada))),
      e(Td,null, e(Selo,{cor:x.situacao==="Kit entregue" ? "#4ADE80" : "#94A3B8"}, x.situacao), x.aVerificar && e("span",{className:"ml-1"}, e(Selo,{cor:"#FBBF24"}, "A verificar"))),
      e(Td,null, e(Selo,{cor:x.origem==="sistema" ? "#F97316" : "#60A5FA"}, x.origem==="sistema" ? "Sistema" : "Planilha")),
      e(Td,{dinheiro:true, cor:x.contaMoedas ? "ok" : undefined}, x.contaMoedas ? formatarMoedas(x.moedas) : "—"),
      e(Td,{className:"max-w-[16rem] whitespace-normal!"}, x.detalhe || "—"));
  });
  return e(Pagina,null,
    e(Resumo,{itens:[{t:"Na planilha antiga", v:r.planilha, cor:"info"}, {t:"Planilha com moedas", v:r.planilhaComMoedas, cor:"ouro"}, {t:"Kits entregues no sistema", v:r.sistema, cor:"ok"}, {t:"Repetidas no sistema", v:r.repetidasNoSistema, cor:"aberto", sub:"mostradas só uma vez em Todas"}]}),
    e(BarraFiltros,{limpar:filtrado ? function(){ setV({origem:"todas", soMoedas:false, q:"", from:"", to:"", pg:0}); } : null},
      ORIGENS.map(function(o){ return e(Chip,{key:o.k, on:v.origem===o.k, onClick:function(){ set("origem", o.k); }}, o.t, e("span",{className:"font-mono text-[11.5px] opacity-80"}, h.contagem[o.k])); }),
      e(Alternar,{on:v.soMoedas, set:function(x){ set("soMoedas", x); }, ic:"coins"}, "Só com moedas"),
      e(Busca,{v:v.q, ph:"Buscar por nome, telefone ou situação", set:function(x){ set("q", x); }}),
      e(FiltroData,{rot:"De", v:v.from, set:function(x){ set("from", x); }}), e(FiltroData,{rot:"Até", v:v.to, set:function(x){ set("to", x); }})),
    e(Secao,{ic:"clock-counter-clockwise", t:"Histórico de indicações", sub:"Planilha antiga e kits entregues no sistema", dir:h.paginacao.total+(h.paginacao.total===1 ? " registro" : " registros")},
      h.itens.length ? e(Tab,{cols:["Quando", "Revendedora", "Indicada", "Situação", "Origem", "Moedas", "Detalhe"]}, linhas)
        : e("p",{className:"py-4 text-center text-[13px] text-white/70"}, vazioGeral ? "Nenhum registro no histórico ainda. Os kits entregues pelo funil aparecem aqui automaticamente." : "Nenhum registro encontrado com esses filtros."),
      h.itens.length>0 && e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
        e(Bt,{ic:"arrow-left", disabled:!pg.podeVoltar, onClick:function(){ setV(Object.assign({}, v, {pg:v.pg-1})); }}, "Anterior"),
        e("span",{className:"text-[12.5px] text-white/75"}, textoDaPaginacao(pg)+" · página "+pg.paginaAtual+" de "+pg.totalDePaginas),
        e(Bt,{disabled:!pg.podeAvancar, onClick:function(){ setV(Object.assign({}, v, {pg:v.pg+1})); }}, "Próxima", e(Ph,{n:"arrow-right", s:15})))));
}

export { AbaIndFunil, AbaIndHistorico };
