// Sorelly Admin · montagem — pages/indicacoes/FunilHistorico.js
// Indicações (setor Cadastro de revendedoras, cor laranja): duas telas-corpo de aba, sem PageHead (a tela com abas junta).
//   AbaIndFunil     — funil das indicadas em quadro Kanban (arrastar, avançar, voltar, detalhe com etapas e histórico, edição, nova indicação).
//   AbaIndHistorico — histórico paginado (planilha antiga + kits entregues no sistema) com filtros.
// Regras e dados em domain/indicacoes.js (estado s.ind); aqui só o desenho. Moedas: entrar em "Kit entregue" credita a indicadora.
// Peças visuais (faixa de indicadores, barra de filtros, janela em colunas, selos) em pages/indicacoes/visual.js.
// AO VIVO (19/11/2026): com servidor, o funil vem do app e mover um cartão corrige a etapa no app (como o "Mudar etapa" do admin antigo): "Kit entregue" não muda
// e ir para "Kit entregue" credita 1.000 moedas, salvo se desmarcar. Nova indicação busca a indicadora no app e cria o lead na Kommo. A edição da indicada é só do modo navegador.
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { ETAPAS_FUNIL, SITUACOES_TRABALHO, buscarRevendedoras, diasEntre, estadoDaPaginacao, etapaAnterior, explicacaoFunil, formatarDataHora, formatarMoedas, formatarTelefone, funilPagina, hojeSP, historico,
  indicacaoDe, indicadoresFunil, legendaDaTaxa, linkWhatsapp, nomeRev, proximaEtapa, rotuloFunil, semDdi, taxaFormatada, textoDaPaginacao } from "@/apps/montagem/domain/indicacoes";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { Alternar, Avatar, Bt, BtMini, Busca, BuscaFaixa, Chip, Colunas, Espera, FaixaBloco, FiltroData, Janela, Painel, Passos, Resumo, Secao, Selo, cap1 } from "@/apps/montagem/pages/indicacoes/visual";
import { carregarInd, useBuscaRevendedoras } from "@/apps/montagem/lib/indicacoes-servidor";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { COMPACTO } from "@/apps/montagem/components/bloco-painel";
import { PageHead } from "@/apps/montagem/ui/page";
import { Kanban } from "@/shared/kanban";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { e, useMemo, useState } from "@/shared/react";

var COR_ETAPA = {criado:"#94A3B8", em_andamento:"#60A5FA", cadastro_aprovado:"#F97316", finalizado:"#4ADE80", cancelado:"#EF4444"};
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[12px] font-bold "+(p.className||"")}, p.rot, p.children); }
var CAMPO = INPUT+" w-full text-center";
function Entrada(p){ return e(Campo,{rot:p.rot, className:p.className}, e("input",{type:p.type||"text", value:p.v==null ? "" : p.v, placeholder:p.ph, onChange:function(ev){ p.set(ev.target.value); }, className:CAMPO})); }
function Erro(p){ return p.t ? e("p",{className:"rounded-lg bg-[#EF4444]/15 px-3 py-2 text-[13px] font-bold text-[#F87171] ring-1 ring-[#EF4444]/40"}, p.t) : null; }
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
// manda a ação e só fecha a janela se deu certo (ao vivo o app pode recusar; no modo navegador o dispatch não devolve nada)
function despachar(d, a, depois){ return Promise.resolve(d(a)).then(function(ok){ if(ok!==false && depois) depois(); return ok!==false; }); }
var lidoDoApp = function(ind){ return ind && ind.aoVivo && ind.lidoEm ? " · lido do app às "+String(ind.lidoEm).slice(11, 16) : ""; };
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
// ao vivo, a Nova indicação cria o lead na Kommo: os mesmos obrigatórios do admin antigo e do sorelly-forms (o servidor confere de novo, faltaNaIndicacao)
function faltaParaKommo(v){
  var t = function(x){ return String(x==null ? "" : x).trim(); }, dg = function(x){ return String(x==null ? "" : x).replace(/\D/g, ""); }, f = v.form || {}, sit = f.situacao || "nao";
  if(!t(v.cidade)) return "Informe a cidade da indicada."; if(dg(v.cep).length<8) return "Informe o CEP da indicada (8 números)."; if(!t(v.endereco)) return "Informe o endereço da indicada."; if(!t(v.numero)) return "Informe o número da casa da indicada.";
  if(sit==="sim" && !(t(f.nomeEmpresa) && t(f.cargo) && t(f.enderecoEmpresa) && t(f.tempoAtuacaoEmpresa))) return "Preencha empresa, cargo, tempo na empresa e endereço da empresa.";
  if(sit==="autonoma" && !(t(f.areaAutonoma) && t(f.tempoAutonoma))) return "Preencha a área de atuação e o tempo como autônoma.";
  if(sit==="nao" && f.estudaGraduacao==="sim" && !t(f.cursoGraduacao)) return "Informe o curso de graduação.";
  return "";
}
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
  var er = useState(""), erro = er[0], vivo = !!ind.aoVivo, se = useState(false), enviando = se[0];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var bs = useBuscaRevendedoras(v.rev || v.digitar ? "" : v.busca, vivo);   // ao vivo: busca no app inteiro (DevMaster de reserva)
  var achadas = v.rev || v.digitar ? [] : vivo ? bs.itens.slice(0, 6) : buscarRevendedoras(ind, v.busca).slice(0, 6);
  var okRev = !!v.rev || (v.digitar && !!String(v.novaNome).trim()), okDados = !!String(v.nome).trim() && semDdi(v.whatsapp).length>=10;
  var salvar = function(){
    var m = ""; if(v.rev==null && !v.digitar) m = "Escolha a indicadora (busque pelo nome ou digite uma nova)."; else if(v.rev==null && !String(v.novaNome).trim()) m = "Informe o nome da indicadora.";
    if(!m) m = validarIndicada(ind, v, null); if(!m && vivo) m = faltaParaKommo(v); if(m){ er[1](m); return; }
    var a = {type:"IND", op:"ind_add", por:p.por, etapa:v.etapa, nome:v.nome, whatsapp:v.whatsapp, cidade:v.cidade, cep:v.cep, endereco:v.endereco, numero:v.numero, observacao:v.observacao || undefined, form:v.form};
    if(v.rev) a.revendedoraId = v.rev.id; else { a.revendedoraNome = v.novaNome; a.revendedoraTelefone = v.novaTel; }
    er[1](""); se[1](true); despachar(p.dispatch, a, p.fechar).then(function(){ se[1](false); });
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
            vivo && bs.carregando && e("p",{className:"text-[13px] text-white/70"}, "Buscando no app."),
            String(v.busca).trim().length>=2 && !achadas.length && !(vivo && bs.carregando) && e("p",{className:"text-[13px] text-white/70"}, "Nenhuma revendedora encontrada."),
            !vivo && e("div",null, e(BtMini,{onClick:function(){ setV(Object.assign({}, v, {digitar:true, novaNome:v.busca})); }}, "Digitar uma indicadora nova")))),
      e(Painel,{t:"Dados da indicada", ic:"identification-card", estado:okDados ? "feito" : okRev ? "atual" : undefined}, e(CamposIndicada,{v:v, set:set, parte:"dados"})),
      e(Painel,{t:"Perfil e registro", ic:"clipboard-text", estado:okRev && okDados ? "atual" : undefined},
        !vivo && e(Campo,{rot:"Começa em"}, e("select",{value:v.etapa, onChange:function(ev){ set("etapa", ev.target.value); }, className:CAMPO}, e("option",{value:"em_andamento"}, rotuloFunil("em_andamento")), e("option",{value:"criado"}, rotuloFunil("criado")))),
        e(CamposIndicada,{v:v, set:set, parte:"perfil"}),
        e(Erro,{t:erro}),
        vivo && e("p",{className:"text-[11px] text-white/70"}, "Registra no funil do app e cria o lead na Kommo (funil Cadastro, tag INDICAÇÃO)."),
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, e(Bt,{onClick:p.fechar}, "Cancelar"), e(Bt,{tipo:"forte", ic:"check", disabled:enviando, onClick:salvar}, "Registrar indicação")))));
}

// ───────────── confirmação de mudança de etapa (cancelar pede motivo; Kit entregue avisa as moedas) ─────────────
function DialogoMover(p){
  var it = p.item, para = p.para, cfg = p.s.ind.config, nome = it.nome || it.indicadaNome, indicadora = nomeRev(p.s.ind, it.revendedoraId);
  var motivos = cfg.motivosCancelamento || [], st = useState({m:motivos[0]||"outro", livre:"", nota:""}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  // ao vivo (19/11/2026): ir para Kit entregue credita as moedas no app UMA vez; desmarque quando elas já foram dadas à mão (senão ela recebe em dobro). Regra do admin antigo.
  var vivo = !!p.s.ind.aoVivo, cr = useState(true), creditar = cr[0], se = useState(false), enviando = se[0];
  var cancela = para==="cancelado", credita = para==="finalizado" && (vivo ? creditar : cfg.creditarAoFinalizar) && !(it.moedasCreditadas>0), estorna = !vivo && it.etapa==="finalizado" && it.moedasCreditadas>0;
  var motivo = v.m==="outro" ? String(v.livre).trim() : v.m, ok = (!cancela || !!motivo) && !enviando;
  var confirmar = function(){ var a = {type:"IND", op:"ind_etapa", por:p.por, id:it.id, etapa:para}; if(cancela) a.motivo = motivo; else if(v.nota.trim()) a.nota = v.nota; if(vivo && para==="finalizado") a.creditarMoedas = creditar; se[1](true); despachar(p.dispatch, a, p.fechar).then(function(){ se[1](false); }); };
  return e(Janela,{t:cancela ? "Cancelar indicação" : "Mover indicação", sub:nome, fechar:p.fechar, tam:"md"},
    e(Colunas,{n:2},
      e(Painel,{t:"Mudança de etapa", ic:"arrows-left-right", estado:"feito"},
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, e(Selo,{cor:COR_ETAPA[it.etapa]}, rotuloFunil(it.etapa)), e(Ph,{n:"arrow-right", s:16}), e(Selo,{cor:COR_ETAPA[para]}, rotuloFunil(para))),
        credita && e("p",{className:"rounded-lg bg-[#22C55E]/15 px-3 py-2 text-[13px] font-bold text-[#4ADE80] ring-1 ring-[#22C55E]/40"}, "Ao confirmar, "+indicadora+" recebe "+formatarMoedas(cfg.moedasPorKit)+" pela indicação."),
        vivo && para==="finalizado" && !(it.moedasCreditadas>0) && e("label",{className:"flex cursor-pointer items-center justify-center gap-2 text-[13px] font-semibold"}, e("input",{type:"checkbox", checked:creditar, onChange:function(ev){ cr[1](ev.target.checked); }}), "Creditar "+formatarMoedas(cfg.moedasPorKit)+" (desmarque se já foram dadas à mão)"),
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
          !edit && !s.ind.aoVivo && e(Bt,{ic:"note-pencil", onClick:function(){ ed[1](true); }}, "Editar"),
          edit && e(Bt,{tipo:"forte", ic:"check", onClick:salvar}, "Salvar alterações"), edit && e(Bt,{onClick:function(){ setV(ini()); er[1](""); ed[1](false); }}, "Descartar"),
          e(Bt,{onClick:p.fechar}, "Fechar")))));
}

// ───────────── Funil (Kanban) ─────────────
// Menu ⋯ do cartão (mesmo do quadro de Kits novos): lista as outras etapas
function MenuMoverInd(p){
  var st = useState(false), aberto = st[0];
  return e("span",{className:"relative inline-flex", onClick:function(ev){ ev.stopPropagation(); }},
    e("button",{type:"button", "aria-label":"Mover para outra etapa", title:"Mover para outra etapa", onClick:function(){ st[1](!aberto); }, className:"-my-1.5 h-8 w-7 rounded-md text-[13px] leading-none hover:bg-white/10"}, "⋯"),
    aberto && e("span",{className:"fixed inset-0 z-30", onClick:function(){ st[1](false); }}),
    aberto && e("span",{className:"absolute right-0 top-7 z-40 flex min-w-40 flex-col rounded-lg border border-border bg-card p-1 shadow-xl"},
      e("span",{className:"px-2 py-1 text-[11px] font-semibold uppercase tracking-[.05em]"}, "Mover para"),
      p.destinos.map(function(x){ return e("button",{key:x.k, type:"button", onClick:function(){ st[1](false); p.mover(p.it, x.k); }, className:"h-8 rounded-md px-2 text-left text-[13px] hover:bg-white/10"}, x.titulo); })));
}
// ao vivo (19/11/2026): Espera mostra "carregando" até o app responder (pages/indicacoes/visual.js)
function AbaIndFunil(){ return e(Espera,{corpo:CorpoFunil}); }
function CorpoFunil(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario), ind = s.ind, vivo = !!ind.aoVivo;
  // ao vivo: Kit entregue não muda (o app recusa: as moedas já caíram) e "Novas" não é destino (regras do app e do admin antigo)
  var recusaVivo = function(it, para){ if(!vivo) return ""; if(it.etapa==="finalizado") return "Kit entregue não muda: as moedas já foram creditadas no app."; if(para==="criado") return "\"Novas\" não é etapa de destino: escolha Em andamento."; return ""; };
  var avisa = function(t){ d({type:"IND_SERVIDOR", msg:t, tom:"alerta"}); };
  var st = useState({q:"", nova:false, ver:null, mover:null}), v = st[0], setV = st[1];
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); };
  var hoje = hojeSP(), ic = indicadoresFunil(ind), t = ic.totais, c = ic.conversao;
  var colunas = ETAPAS_FUNIL.map(function(k){ var r = funilPagina(ind, {etapa:k, q:v.q, limite:100000}); return {k:k, titulo:rotuloFunil(k), cor:COR_ETAPA[k], itens:r.itens, dica:explicacaoFunil(k)}; });
  var total = ETAPAS_FUNIL.reduce(function(n, k){ return n+(t[k]||0); }, 0);
  // mover direto (sem janela) só quando não cancela nem credita/estorna moedas
  var mover = function(it, para){
    if(para===it.etapa) return;
    var rv = recusaVivo(it, para); if(rv){ avisa(rv); return; }
    var cfg = ind.config, mexeMoeda = para==="finalizado" || (it.etapa==="finalizado" && it.moedasCreditadas>0);
    if(para==="cancelado" || (mexeMoeda && (vivo || cfg.creditarAoFinalizar))){ set("mover", {item:it, para:para}); return; }
    d({type:"IND", op:"ind_etapa", por:por, id:it.id, etapa:para});
  };
  var avancar = function(it){ var pr = proximaEtapa(it.etapa); if(!pr) return; if(pr==="finalizado") set("mover", {item:it, para:pr}); else d({type:"IND", op:"ind_avancar", por:por, id:it.id}); };
  var voltar = function(it){ var an = etapaAnterior(it); if(!an) return; var rv = recusaVivo(it, an); if(rv){ avisa(rv); return; } if(it.etapa==="finalizado") set("mover", {item:it, para:an}); else d({type:"IND", op:"ind_voltar", por:por, id:it.id}); };
  // 17/11/2026 (Marcus: "pegue o funil do cadastro de Kits novos, melhore e compacte"): mesmo desenho do quadro de Kits novos: cartão baixo de duas linhas (nome e dias na etapa; quem indicou e cidade),
  // barra na lateral (verde no prazo, âmbar de 3 a 6 dias, vermelha com 7 ou mais), menu ⋯ para mover. Sem faixa de números no topo (regra de 02/11/2026).
  var destinosDe = function(col){ return colunas.filter(function(x){ return x.k!==col.k; }); };
  var card = function(it, col){
    var link = linkWhatsapp(it.indicadaWhatsapp), dias = Math.max(0, diasEntre(diaDe(it.etapaAlteradaEm), hoje)), aberta = it.etapa!=="finalizado" && it.etapa!=="cancelado";
    var linha2 = ["Indicada por "+it.nomeRevendedora, it.cidade].filter(Boolean).join(" · ");
    return e("div",{className:"flex cursor-pointer flex-col"},
      e("div",{className:"flex items-start justify-between gap-2"},
        e("b",{className:"min-w-0 break-words text-[13px] leading-tight"}, it.nome),
        e("span",{className:"flex shrink-0 items-center gap-0.5"},
          aberta && e("span",{className:"text-[11px] font-semibold tabular-nums", style:{color:corTempo(dias)}, title:"Tempo nesta etapa"}, dias===0 ? "hoje" : dias+" d"),
          e(MenuMoverInd,{it:it, col:col, destinos:destinosDe(col), mover:mover}))),
      e("span",{className:"text-[11px] leading-tight text-white/70", title:"Quem indicou e cidade"}, linha2),
      (it.indicadaWhatsapp || it.moedasCreditadas>0) && e("div",{className:"mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]"},
        it.indicadaWhatsapp && (link ? e("a",{href:link, target:"_blank", rel:"noopener noreferrer", onClick:function(ev){ ev.stopPropagation(); }, className:"inline-flex items-center gap-1 text-[#4ADE80] hover:underline"}, e(Ph,{n:"whatsapp-logo", s:12}), formatarTelefone(it.indicadaWhatsapp)) : e("span",null, formatarTelefone(it.indicadaWhatsapp))),
        it.moedasCreditadas>0 && e("span",{className:"inline-flex items-center gap-1 text-[#4ADE80]"}, e(Ph,{n:"coins", s:12}), formatarMoedas(it.moedasCreditadas))));
  };
  var corBarra = function(it, col){ var dias = Math.max(0, diasEntre(diaDe(it.etapaAlteradaEm), hoje)); return it.etapa==="finalizado" || it.etapa==="cancelado" ? col.cor : corTempo(dias); };
  return e(Pagina,null,
    e(Secao,{t:"Funil das indicações", dir:"Conversão "+taxaFormatada(c.taxa)+" · "+total.toLocaleString("pt-BR")+(total===1 ? " indicação" : " indicações")+lidoDoApp(ind), semPad:true,
      faixa:e(FaixaBloco,null, e(BuscaFaixa,{v:v.q, ph:"Buscar por nome, WhatsApp ou indicadora", set:function(x){ set("q", x); }}), e("span",{className:"flex-1"}), vivo && e(Botao,{onClick:function(){ carregarInd(d, true); }}, "Atualizar"), e(Botao,{principal:true, onClick:function(){ set("nova", true); }}, "Nova indicação"))},
      total===0 && e("p",{className:"py-2 text-center text-[13px]"}, "Nenhuma indicação registrada. Use \"Nova indicação\" para lançar a primeira."),
      e("div",{className:"p-2"}, e(Kanban,{colunas:colunas, card:card, onMover:function(it, de, para){ mover(it, para); }, compacto:true, cabecaFina:true, semMover:true, corBarra:corBarra, onAbrir:function(it){ set("ver", it.id); }, unidade:["indicação","indicações"], vazio:v.q.trim() ? "Nenhuma indicação encontrada nesta etapa." : "Nenhuma indicação nesta etapa."}))),
    v.nova && e(DialogoNova,{s:s, por:por, dispatch:d, fechar:function(){ set("nova", false); }}),
    v.ver!=null && e(DialogoDetalhe,{s:s, id:v.ver, por:por, dispatch:d, fechar:function(){ set("ver", null); }}),
    v.mover && e(DialogoMover,{s:s, item:v.mover.item, para:v.mover.para, por:por, dispatch:d, fechar:function(){ set("mover", null); }}));
}

// ───────────── Histórico ─────────────
// 17/11/2026 (Marcus: "melhore, 3 blocos no topo: quem mais indica, representantes que mais indicam e algo útil; melhore as páginas"): bloco azul com tabela única (TabelaPlanilha), filtro e ordem no cabeçalho de cada coluna e páginas de 50 em 50.
// Planilha antiga e kits entregues no sistema juntos; "Origem" separa. Os 3 blocos do topo são LISTAS (não faixa de números): Top 10 revendedoras, Top 10 representantes e Aguardando documentos (indicadas paradas, da mais antiga para a mais nova).
var limpaNome = function(n){ return String(n || "").replace(/^\s*(rev|rep|revendedora|representante)\s+/i, "").trim(); };
var chaveNome = function(n){ return limpaNome(n).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " "); };
var corSituacao = function(l){ var s = String(l.situacao || "").toLowerCase(); return s==="kit entregue" ? "text-emerald-400 font-semibold" : /documentos/.test(s) ? "text-amber-300 font-semibold" : /reprovad|sem interesse|cancelad/.test(s) ? "text-red-400" : ""; };
var COLS_HIST = [
  {k:"quando", t:"Quando", fmt:function(v){ return formatarDataHora(v) || "—"; }}, {k:"nomeRevendedora", t:"Revendedora"}, {k:"categoria", t:"Categoria"}, {k:"nomeIndicada", t:"Indicada"}, {k:"telefone", t:"Telefone da indicada"},
  {k:"situacao", t:"Situação", cor:corSituacao}, {k:"origem", t:"Origem"}, {k:"moedas", t:"Moedas", cor:function(l){ return l.moedas!=="—" ? "text-primary font-semibold" : ""; }}, {k:"aVerificar", t:"A verificar"}, {k:"detalhe", t:"Detalhe"}];
// lista de ranking: posição, nome e dois números (indicações e kits entregues)
// 17/11/2026 (Marcus: "fonte bem menor, sobe os blocos e joga para a esquerda"): letra de 11 px, linha baixa, blocos estreitos encostados à esquerda.
var COL_TOP = "grid grid-cols-[1.25rem_minmax(0,1fr)_4.5rem_2.75rem] items-center gap-1.5 px-2 text-[11px]";
function ListaTop(p){
  return e("div",{className:"flex flex-col"},
    e("div",{className:COL_TOP+" bg-[var(--bloco-colunas)] py-0.5 font-bold uppercase tracking-[.05em] text-white"}, e("span",{className:"text-center"},"#"), e("span",null,"Nome"), e("span",{className:"text-center"},p.c1), e("span",{className:"text-center"},p.c2)),
    p.itens.length===0 && e("p",{className:"px-2 py-2 text-[11px]"}, "Nada para mostrar ainda."),
    p.itens.map(function(x, i){ return e("div",{key:x.k, className:COL_TOP+" border-t border-white/30 py-0.5 "+(i%2 ? "bg-white/[0.04]" : "")},
      e("span",{className:"text-center tabular-nums"}, i+1), e("span",{className:"min-w-0 break-words"}, x.nome), e("b",{className:"text-center tabular-nums"}, x.a), e("span",{className:"text-center tabular-nums "+(x.b>0 ? "font-semibold text-emerald-400" : "")}, x.b)); }));
}
// uma linha por situação (Aguardando documentos, Cadastradas, Aprovadas no funil...) com a quantidade
function ListaSituacao(p){
  var G = "grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-1.5 px-2 text-[11px]";
  return e("div",{className:"flex flex-col"},
    e("div",{className:G+" bg-[var(--bloco-colunas)] py-0.5 font-bold uppercase tracking-[.05em] text-white"}, e("span",null,"Situação"), e("span",{className:"text-center"},"Indicadas")),
    p.itens.map(function(x, i){ return e("div",{key:x.t, className:G+" border-t border-white/30 py-0.5 "+(i%2 ? "bg-white/[0.04]" : "")}, e("span",{className:x.cor||""}, x.t), e("b",{className:"text-center tabular-nums "+(x.cor||"")}, x.n.toLocaleString("pt-BR"))); }));
}
function AbaIndHistorico(){ return e(Espera,{corpo:CorpoHistorico}); }
function CorpoHistorico(){
  var cx = use(), ind = cx.state.ind, hoje = hojeSP();
  var base = useMemo(function(){
    var out = [], pg = 0;
    for(;;){ var h = historico(ind, {origem:"todas", pagina:pg, limite:100}); out = out.concat(h.itens); if(!h.paginacao.hasMore || pg>300) break; pg++; }
    return out;
  }, [ind]);
  var linhas = useMemo(function(){
    return base.map(function(x){ return {id:x.id, quando:x.quando||"", nomeRevendedora:limpaNome(x.nomeRevendedora), categoria:x.categoria||"—", nomeIndicada:x.nomeIndicada||"—", telefone:x.telefoneIndicada ? formatarTelefone(x.telefoneIndicada) : "—", situacao:x.situacao,
      origem:x.origem==="sistema" ? "Sistema" : "Planilha antiga", moedas:x.contaMoedas ? formatarMoedas(x.moedas) : "—", aVerificar:x.aVerificar ? "Sim" : "Não", detalhe:x.detalhe || "—"}; });
  }, [base]);
  var tops = useMemo(function(){
    var agrupa = function(filtro){ var m = {}; base.filter(filtro).forEach(function(x){ var k = chaveNome(x.nomeRevendedora); if(!k || k==="revendedora sem nome") return; var g = m[k] || (m[k] = {k:k, nome:limpaNome(x.nomeRevendedora), a:0, b:0}); g.a++; if(x.contaMoedas || x.situacao==="Kit entregue") g.b++; });
      return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ return b.a-a.a || b.b-a.b || a.nome.localeCompare(b.nome, "pt-BR"); }).slice(0, 12); };
    var ehRep = function(x){ return String(x.categoria||"").toLowerCase()==="rep"; }, ehFunc = function(x){ return /funcion/i.test(x.categoria||""); };
    // 17/11/2026 (Marcus: "menos coisas, agrupado, no máximo 10"): 8 linhas. Planilha antiga e funil de hoje juntos, agrupados pelo que importa para a Michele.
    var cont = {}; base.forEach(function(x){ var s = String(x.situacao||"").toLowerCase(); cont[s] = (cont[s]||0)+1; });
    var g = function(ks){ return ks.reduce(function(n, k){ return n+(cont[k]||0); }, 0); };
    var tf = indicadoresFunil(ind).totais;
    // 12 linhas (igual aos Top 12): o que estava junto em "Em andamento" (244) era quase tudo "Contato feito" da planilha antiga, parado há mais de 60 dias; agora fica em linha própria.
    var aprov = ind.indicacoes.filter(function(x){ return x.etapa==="cadastro_aprovado"; }), aprovLongo = aprov.filter(function(x){ return diasEntre(diaDe(x.etapaAlteradaEm), hoje)>30; }).length;
    var sit = [
      {t:"Novas", n:g(["entrar em contato", "solicitado"])+(tf.criado||0)},
      {t:"Em andamento (funil de hoje)", n:(tf.em_andamento||0)+g(["contatos de referência"])},
      {t:"Contato feito (planilha antiga)", n:g(["contato feito"])},
      {t:"Aguardando documentos", n:g(["aguardando documentos"]), cor:"text-amber-300"},
      {t:"Aprovadas sem kit · até 30 dias", n:aprov.length-aprovLongo, cor:"text-primary"},
      {t:"Aprovadas sem kit · mais de 30 dias", n:aprovLongo, cor:"text-amber-300"},
      {t:"Cadastradas", n:g(["cadastrada"])},
      {t:"Bipadas e liberadas", n:g(["bipado", "liberado", "retornando"])},
      {t:"Kit entregue", n:g(["kit entregue"]), cor:"text-emerald-400"},
      {t:"Reprovadas", n:g(["reprovada"]), cor:"text-red-400"},
      {t:"Sem interesse", n:g(["sem interesse"]), cor:"text-red-400"},
      {t:"Canceladas", n:g(["cancelado"])+(tf.cancelado||0), cor:"text-red-400"}];
    return {revs:agrupa(function(x){ return !ehRep(x) && !ehFunc(x); }), reps:agrupa(ehRep), sit:sit};
  }, [base]);
  return e(Pagina,null,
    e("div",{className:"-mt-3 grid grid-cols-1 items-start gap-1.5 lg:grid-cols-3"},
      e("div",{className:"min-w-0"}, e(Secao,{t:"Top 12 · revendedoras que mais indicam", semPad:true}, e(ListaTop,{itens:tops.revs, c1:"Indicações", c2:"Kits"}))),
      e("div",{className:"min-w-0"}, e(Secao,{t:"Top 12 · representantes que mais indicam", semPad:true}, e(ListaTop,{itens:tops.reps, c1:"Indicações", c2:"Kits"}))),
      e("div",{className:"min-w-0"}, e(Secao,{t:"Situação das indicadas", semPad:true}, e(ListaSituacao,{itens:tops.sit})))),
    e("div",{className:"-mt-1.5 "+COMPACTO}, e(Secao,{t:"Histórico de indicações", dir:linhas.length.toLocaleString("pt-BR")+" registros", semPad:true},
      e(TabelaPlanilha,{cols:COLS_HIST, linhas:linhas, chave:"id", escura:true, grade:true, limite:50, paginas:true, semContagem:true, semLimpar:true, vazio:"Nenhum registro no histórico ainda. Os kits entregues pelo funil aparecem aqui automaticamente."}))));
}

export { AbaIndFunil, AbaIndHistorico };
