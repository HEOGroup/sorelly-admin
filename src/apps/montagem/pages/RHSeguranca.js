// Sorelly Admin · montagem — pages/RHSeguranca.js
// RH › Segurança do trabalho: acompanhamento do plano de ação da NR-1 (17/11/2026, pedido do Marcus a partir do plano que a Maria alinhou com o técnico de Segurança do Trabalho).
// Padrão azul do Financeiro (barra azul, BlocoPainel, TabelaPlanilha, janela em colunas). Regras em domain/nr1.js; os dados ficam em s.rh.nr1 (mesma gravação do RH).
// Só RH e diretoria abrem (a tela não está em nenhuma lista de perfil e o módulo "rh" do servidor é restrito). Documentos vão para o servidor (/api/anexos, módulo rh).
// Não é aconselhamento jurídico: o que a NR-1 exige da Sorelly quem confirma é o técnico de Segurança do Trabalho e o contador.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { CAMPO, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { diaBr, nr1Atividades, nr1Estado, nr1EstadoAt, nr1Padrao, SITUACOES, SITUACOES_AT } from "@/apps/montagem/domain/nr1";
import { colaboradoresRh } from "@/apps/montagem/domain/rh";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { abrirAnexo, enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { Bt, Campo, Janela, Painel, Selo } from "@/apps/montagem/pages/compras/pecas";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useRef, useState } from "@/shared/react";

var FAIXA = "flex min-w-0 [&>section]:min-w-0 [&>section]:flex-1";   // bloco estica até a altura da faixa: bordas alinhadas com o vizinho
var dataHora = function(ms){ var d = new Date(ms), z = function(n){ return (n<10 ? "0" : "")+n; }; return z(d.getDate())+"/"+z(d.getMonth()+1)+"/"+d.getFullYear()+" "+z(d.getHours())+":"+z(d.getMinutes()); };

// campo de texto que grava ao sair (ou no Enter)
function Txt(p){
  var st = useState(p.value || ""), v = st[0];
  useEffect(function(){ st[1](p.value || ""); }, [p.value]);   // eslint-disable-line react-hooks/exhaustive-deps
  return e("input",{value:v, "aria-label":p.label, placeholder:p.ph, className:CAMPO+" text-center", onChange:function(ev){ st[1](ev.target.value); },
    onBlur:function(){ if(v!==(p.value || "")) p.salvar(v); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }});
}
function Bloco(p){
  return e("div",{className:FAIXA}, e(BlocoPainel,{titulo:p.t, compacto:true, dir:p.dir},
    e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:p.cols, linhas:p.linhas, chave:"id", grade:true, semFiltro:p.semFiltro, semContagem:true, semLimpar:true, cheia:true, aoClicar:p.aoClicar, vazio:p.vazio}))));
}
function Nota(p){
  var st = useState(""), t = st[0];
  return e("div",{className:"flex gap-1.5"},
    e("input",{value:t, "aria-label":"Anotação", placeholder:"O que foi feito", className:CAMPO, onChange:function(ev){ st[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter" && t.trim()){ p.salvar(t); st[1](""); } }}),
    e(Bt,{tipo:"forte", disabled:!t.trim(), onClick:function(){ p.salvar(t); st[1](""); }}, "Registrar anotação"));
}

function Ficha(p){
  var c = p.c, a = p.a, fileiro = useRef(null), env = useState(false), enviando = env[0];
  var aviso = function(t){ c.d({type:"AVISO", txt:t, tom:"alerta"}); };
  var salva = function(patch){ c.acao("nr1_set", {id:a.id, patch:patch}); };
  var anexar = function(ev){
    var arq = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(!arq) return;
    env[1](true);
    lerArquivo(arq).then(function(x){ return enviarAnexo("rh", x); }).then(function(r){ c.acao("nr1_anexo_add", {id:a.id, anexo:r}); }).catch(function(er){ aviso(er && er.message || "Não consegui enviar o arquivo."); }).then(function(){ env[1](false); });
  };
  var dados = e(Painel,{key:"dados", t:"Ação "+a.n+" · "+a.titulo, ic:"shield-check"},
    e("div",{className:"flex flex-col gap-1.5"},
      e("p",{className:"text-[13px]"}, a.fazer),
      e(Campo,{rot:"Situação"}, e("select",{value:a.situacao, onChange:function(ev){ salva({situacao:ev.target.value}); }, className:CAMPO}, SITUACOES.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
      e(Campo,{rot:"Prazo"}, e("input",{type:"date", value:a.prazo || "", onChange:function(ev){ salva({prazo:ev.target.value}); }, className:CAMPO+" text-center"})),
      e(Campo,{rot:"Responsável"}, e(Txt,{value:a.resp, label:"Responsável", ph:"Quem acompanha", salvar:function(v){ salva({resp:v}); }}))));
  var docs = e(Painel,{key:"docs", t:"Documentos", ic:"file-text"},
    e("div",{className:"flex flex-col gap-1.5"},
      a.anexos.length===0 && e("p",{className:"text-[13px]"}, "Nenhum documento anexado."),
      a.anexos.map(function(x){ return e("div",{key:x.key, className:"flex items-center justify-between gap-2 rounded-md border border-white/20 px-2 py-1"},
        e("button",{type:"button", onClick:function(){ abrirAnexo(x.key).catch(function(er){ aviso(er && er.message || "Não consegui abrir."); }); }, title:"Abrir o documento", className:"min-w-0 flex-1 text-left text-[13px] font-semibold hover:underline"}, x.nome,
          e("span",{className:"block text-[11px] font-normal"}, dataHora(x.em)+" · "+x.por)),
        e(Bt,{tipo:"perigo", titulo:"Tirar o documento", onClick:function(){ c.acao("nr1_anexo_del", {id:a.id, key:x.key}); }}, "Tirar documento")); }),
      e("input",{ref:fileiro, type:"file", accept:"application/pdf,image/*", className:"hidden", onChange:anexar}),
      e(Bt,{tipo:"forte", disabled:enviando, onClick:function(){ fileiro.current && fileiro.current.click(); }}, enviando ? "Enviando documento" : "Anexar documento")));
  var hist = e(Painel,{key:"hist", t:"Histórico", ic:"clock"},
    e("div",{className:"flex flex-col gap-1.5"},
      e(Nota,{salvar:function(t){ c.acao("nr1_nota", {id:a.id, txt:t}); }}),
      a.hist.length===0 && e("p",{className:"text-[13px]"}, "Sem registros."),
      a.hist.slice().reverse().map(function(h, i){ return e("div",{key:i, className:"rounded-md border border-white/20 px-2 py-1 text-left"},
        e("span",{className:"block text-[11px] font-semibold"}, dataHora(h.em)+" · "+h.por), e("span",{className:"text-[13px]"}, h.txt)); })));
  return e(Janela,{t:"Segurança do trabalho", sub:"NR-1 · "+a.titulo, fechar:p.fechar, colunas:[dados, docs, hist]});
}

// ATIVIDADES (17/11/2026): tarefas pequenas de cada ação, que o RH passa para as pessoas fazerem. Responsável vem do cadastro do RH; "Copiar mensagem" gera o texto para o WhatsApp.
function Atividades(p){
  var c = p.c, n = p.n, acoes = n.acoes, ats = nr1Atividades(n), nova = useState({acaoId:acoes[0].id, txt:""}), nv = nova[0];
  var nomes = colaboradoresRh(p.s).filter(function(x){ return x.status==="ATIVO"; }).map(function(x){ return x.nome; }).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); });
  var tituloDe = function(id){ var a = acoes.find(function(x){ return x.id===id; }); return a ? a.n+" · "+a.titulo : "—"; };
  var salva = function(id, patch){ c.acao("nr1_at_set", {idAt:id, patch:patch}); };
  var copiar = function(x){
    var t = "*Segurança do trabalho (NR-1)*\nAtividade: "+x.txt+"\nAção: "+tituloDe(x.acaoId)+"\nResponsável: "+(x.resp || "A definir")+"\nPrazo: "+diaBr(x.prazo);
    try{ navigator.clipboard.writeText(t).then(function(){ c.d({type:"AVISO", txt:"Mensagem copiada", tom:"ok"}); }, function(){ c.d({type:"AVISO", txt:"Não consegui copiar a mensagem.", tom:"alerta"}); }); }catch(er){ c.d({type:"AVISO", txt:"Não consegui copiar a mensagem.", tom:"alerta"}); }
  };
  var linhas = ats.map(function(x){ var st = nr1EstadoAt(x); return {id:x.id, x:x, acao:tituloDe(x.acaoId), txt:x.txt, resp:x.resp || "A definir", prazo:diaBr(x.prazo), sit:x.situacao==="feita" ? "Feita" : "Pendente", estado:st.t, st:st}; });
  var cols = [{k:"acao", t:"Ação"}, {k:"txt", t:"Atividade"},
    {k:"resp", t:"Responsável", render:function(v, l){ var cur = l.x.resp, lista = cur && nomes.indexOf(cur)<0 ? [cur].concat(nomes) : nomes;
      return e("select",{value:cur, "aria-label":"Responsável", onChange:function(ev){ salva(l.id, {resp:ev.target.value}); }, className:CAMPO+" w-auto"}, e("option",{value:""}, "A definir"), lista.map(function(nm){ return e("option",{key:nm, value:nm}, nm); })); }},
    {k:"prazo", t:"Prazo", render:function(v, l){ return e("input",{type:"date", value:l.x.prazo || "", "aria-label":"Prazo", onChange:function(ev){ salva(l.id, {prazo:ev.target.value}); }, className:CAMPO+" w-auto text-center"}); }},
    {k:"sit", t:"Situação", render:function(v, l){ return e("select",{value:l.x.situacao, "aria-label":"Situação", onChange:function(ev){ salva(l.id, {situacao:ev.target.value}); }, className:CAMPO+" w-auto"}, SITUACOES_AT.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); }},
    {k:"estado", t:"Estado", render:function(v, l){ return e(Selo,{cor:l.st.cor}, v); }},
    {k:"msg", t:"Mensagem", render:function(v, l){ return e(Bt,{tipo:"forte", onClick:function(){ copiar(l.x); }}, "Copiar mensagem"); }},
    {k:"del", t:"Remover", render:function(v, l){ return e(Bt,{tipo:"perigo", onClick:function(){ c.acao("nr1_at_del", {idAt:l.id}); }}, "Tirar atividade"); }}];
  var adiciona = function(){ if(!nv.txt.trim()) return; c.acao("nr1_at_add", {acaoId:nv.acaoId, txt:nv.txt}); nova[1]({acaoId:nv.acaoId, txt:""}); };
  var faixa = e("div",{className:"flex flex-wrap items-center gap-2 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("select",{"aria-label":"Ação da atividade", value:nv.acaoId, onChange:function(ev){ nova[1]({acaoId:ev.target.value, txt:nv.txt}); }, className:CAMPO+" w-auto shrink-0"}, acoes.map(function(a){ return e("option",{key:a.id, value:a.id}, a.n+" · "+a.titulo); })),
    e("input",{value:nv.txt, "aria-label":"Nova atividade", placeholder:"O que precisa ser feito", className:CAMPO+" min-w-48 flex-1", onChange:function(ev){ nova[1]({acaoId:nv.acaoId, txt:ev.target.value}); }, onKeyDown:function(ev){ if(ev.key==="Enter") adiciona(); }}),
    e(Bt,{tipo:"forte", disabled:!nv.txt.trim(), onClick:adiciona}, "Adicionar atividade"));
  return e(BlocoPainel,{titulo:"Atividades para a equipe", compacto:true, dir:ats.filter(function(x){ return x.situacao!=="feita"; }).length+" pendentes"},
    faixa, e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Nenhuma atividade."})));
}

// FICHA POR PESSOA (18/11/2026): uma linha por colaborador ativo do cadastro do RH, com a data em que recebeu o EPI e a data em que assinou a ordem de serviço.
// Data vazia = Pendente. Quem registrou e quando fica gravado (domain/nr1.js, op nr1_pessoa). Serve de prova da entrega e da assinatura.
function FichaPessoas(p){
  var c = p.c, fp = p.n.pessoas || {};
  var lista = colaboradoresRh(p.s).filter(function(x){ return x.status==="ATIVO"; });
  var marca = function(x, campo){ return fp[x.id] && fp[x.id][campo] ? fp[x.id][campo] : null; };
  var linhas = lista.map(function(x){
    var e1 = marca(x, "epi"), o1 = marca(x, "os"), ult = e1 && o1 ? (o1.em > e1.em ? o1 : e1) : (e1 || o1);
    return {id:x.id, nome:x.nome, setor:x.setor || "—", cnpj:x.cnpj ? "CNPJ "+x.cnpj : "—", epi:e1 ? diaBr(e1.data) : "Pendente", os:o1 ? diaBr(o1.data) : "Pendente", reg:ult ? ult.por : "—", e1:e1, o1:o1};
  });
  var data = function(campo){ return function(v, l){ var m = campo==="epi" ? l.e1 : l.o1;
    return e("input",{type:"date", value:m ? m.data : "", "aria-label":(campo==="epi" ? "Data do EPI de " : "Data da ordem de serviço de ")+l.nome, className:CAMPO+" w-auto text-center",
      onChange:function(ev){ c.acao("nr1_pessoa", {id:l.id, campo:campo, data:ev.target.value}); }}); }; };
  var cols = [{k:"nome", t:"Colaborador"}, {k:"setor", t:"Setor"}, {k:"cnpj", t:"CNPJ"}, {k:"epi", t:"EPI entregue em", render:data("epi")}, {k:"os", t:"Ordem de serviço assinada em", render:data("os")}, {k:"reg", t:"Registrado por"}];
  var comEpi = lista.filter(function(x){ return marca(x, "epi"); }).length, comOs = lista.filter(function(x){ return marca(x, "os"); }).length;
  return e(BlocoPainel,{titulo:"Ficha por pessoa", compacto:true, dir:"EPI "+comEpi+" de "+lista.length+" · Ordem de serviço "+comOs+" de "+lista.length},
    e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Nenhum colaborador ativo no cadastro do RH."})));
}

function AbaRhSeguranca(){
  var cx = use(), s = cx.state, d = cx.dispatch, n = (s.rh && s.rh.nr1) || nr1Padrao(), por = nomeDe(s.usuario), ab = useState(null), aberta = ab[0];
  var c = {d:d, acao:function(op, extra){ d(Object.assign({type:"RH", op:op, por:por}, extra)); }};
  var vi = useState("plano"), vista = vi[0];
  var feitas = n.acoes.filter(function(a){ return a.situacao==="concluida"; }).length;

  var linhas = n.acoes.map(function(a){ var st = nr1Estado(a); return {id:a.id, n:String(a.n), titulo:a.titulo, fazer:a.fazer, resp:a.resp || "A definir", prazo:diaBr(a.prazo), sit:st.t, st:st, docs:String(a.anexos.length)}; });
  var cols = [{k:"n", t:"Nº"}, {k:"titulo", t:"Ação"}, {k:"fazer", t:"O que fazer"}, {k:"resp", t:"Responsável"}, {k:"prazo", t:"Prazo"},
    {k:"sit", t:"Situação", render:function(v, l){ return e(Selo,{cor:l.st.cor}, v); }}, {k:"docs", t:"Documentos"}];

  var porCnpj = n.cnpjs.map(function(x){ return {id:x.cnpj, cnpj:"CNPJ "+x.cnpj, cipa:x.cipa, incendio:x.incendio}; });
  var colsCnpj = [{k:"cnpj", t:"CNPJ"},
    {k:"cipa", t:"Responsável CIPA", render:function(v, l){ return e(Txt,{value:v, label:"Responsável pela CIPA do "+l.cnpj, ph:"Nome", salvar:function(t){ c.acao("nr1_cnpj", {cnpj:l.id, campo:"cipa", valor:t}); }}); }},
    {k:"incendio", t:"Responsável incêndios", render:function(v, l){ return e(Txt,{value:v, label:"Responsável por incêndios do "+l.cnpj, ph:"Nome", salvar:function(t){ c.acao("nr1_cnpj", {cnpj:l.id, campo:"incendio", valor:t}); }}); }}];

  var mov = [];
  n.acoes.forEach(function(a){ a.hist.forEach(function(h, i){ mov.push({id:a.id+"-"+i, em:h.em, quando:dataHora(h.em), acao:a.titulo, por:h.por, txt:h.txt}); }); });
  mov.sort(function(x, y){ return y.em - x.em; });
  var colsMov = [{k:"quando", t:"Quando"}, {k:"acao", t:"Ação"}, {k:"por", t:"Quem"}, {k:"txt", t:"O que foi feito"}];

  var topo = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "Segurança do trabalho · NR-1"),
    e(Segmentado,{opcoes:[["plano", "Plano de ação"], ["pessoas", "Ficha por pessoa"]], atual:vista, onMudar:function(v){ vi[1](v); }}),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px] tabular-nums"}, vista==="plano" ? feitas+" de "+n.acoes.length+" concluídas" : ""));
  var ficha = aberta && n.acoes.find(function(a){ return a.id===aberta; });

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    vista=="pessoas" && e(FichaPessoas,{c:c, n:n, s:s}),
    vista=="plano" && e(Bloco,{t:"Plano de ação", cols:cols, linhas:linhas, aoClicar:function(l){ ab[1](l.id); }, vazio:"Nenhuma ação."}),
    vista=="plano" && e("div",{className:"grid grid-cols-1 gap-2 lg:grid-cols-2"},
      e(Bloco,{t:"Responsável por CNPJ", cols:colsCnpj, linhas:porCnpj, semFiltro:true, vazio:"Nenhum CNPJ."}),
      e(Bloco,{t:"Últimas movimentações", cols:colsMov, linhas:mov.slice(0, 8), vazio:"Nenhuma movimentação ainda."})),
    vista=="plano" && e(Atividades,{c:c, n:n, s:s}),
    ficha && e(Ficha,{c:c, a:ficha, fechar:function(){ ab[1](null); }}));
}

export { AbaRhSeguranca };
