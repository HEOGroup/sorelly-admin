// Sorelly Admin · montagem — pages/RHContratos.js
// Contratos do RH, trazidos do SorellyAdmin: representantes, funcionários (CLT), terceiros, particulares do Marcus e os Modelos (texto com variáveis que vira .docx do Word).
// Regras em domain/rh.js; o .docx é gerado aqui no navegador (lib/docx-mini.js) e os arquivos anexados ficam no navegador (lib/arquivos.js). Só neste computador por enquanto.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { REPRESENTANTES } from "@/apps/montagem/domain/pessoas";
import { STATUS_BY_TIPO, STATUS_LB, TIPOS_CONTRATO, br, colaboradoresRh, hojeIso, diasEntre } from "@/apps/montagem/domain/rh";
import { apagarArquivo, baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { baixarBlob, htmlParaDocx, mesclarVariaveis } from "@/apps/montagem/lib/docx-mini";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return v ? Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}) : ""; };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-2 py-1.5 text-[13.5px] align-top";
var CARD = "rounded-xl bg-linear-to-br from-[#8B5CF6]/20 via-card to-card px-4 py-3 ring-1 ring-[#8B5CF6]/40";
var STATUS_COR = {antigo:"#EF4444", feito:"#F59E0B", assinado:"#22C55E", encerrado:"#94A3B8", nao_revisado:"#EF4444", em_revisao:"#F59E0B", atualizado:"#22C55E", ativo:"#22C55E"};
var slugKey = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""); };

function useRh(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, rh:s.rh, por:nomeDe(s.usuario), sensivel:grupoDe(s.usuario)==="supervisao"}; }
function acao(c, op, extra){ c.d(Object.assign({type:"RH", op:op, por:c.por}, extra)); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{value:p.value, type:p.type||"text", placeholder:p.ph||"", "aria-label":p.label, className:INPUT+" h-10! "+(p.className||"w-full"), onChange:function(ev){ p.onChange(ev.target.value); }}); }
function Tile(p){ return e("div",{className:CARD+" flex flex-col items-center text-center"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-[.12em] text-muted-foreground"}, p.t), e("b",{className:MONO+" text-[22px]", style:{color:p.cor}}, p.v)); }
function Modal(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full "+(p.largo ? "max-w-3xl" : "max-w-2xl")+" flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#8B5CF6]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h2",{className:"font-heading text-xl font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-muted-foreground"}, p.sub)), e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))), p.children));
}
var chip = function(st){ var cor = STATUS_COR[st]||"#94A3B8"; return e("span",{className:"inline-flex w-fit whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-bold", style:{background:cor+"26", color:cor, boxShadow:"inset 0 0 0 1px "+cor+"55"}}, STATUS_LB[st]||st); };
function Texto(p){ return e("input",{key:p.v, defaultValue:p.v||"", placeholder:p.ph||"", className:INPUT+" h-9! "+(p.cls||"w-full min-w-[9rem]")+(p.mono ? " "+MONO : ""), onBlur:function(ev){ if(ev.target.value!==(p.v||"")) p.save(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); }
function Dinheiro(p){ return e("input",{key:p.v, defaultValue:fmtN(p.v), placeholder:"0,00", className:INPUT+" h-9! w-32 "+MONO, onBlur:function(ev){ var v = num(ev.target.value); if(v!==(p.v||0)) p.save(v||null); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); }
function CelulaStatus(p){ var c = p.c, ct = p.ct; return e("div",{className:"flex flex-col gap-1"}, e(Sel,{value:ct.status, label:"Status", className:"h-8! w-40", onChange:function(v){ acao(c, "contr_set", {id:ct.id, patch:{status:v}}); }}, STATUS_BY_TIPO[ct.tipo].map(function(k){ return e("option",{key:k, value:k}, STATUS_LB[k]); })), chip(ct.status)); }
function CelulaAnexo(p){
  var c = p.c, ct = p.ct, an = ct.anexos.find(function(a){ return a.tipo===p.tipo; });
  var enviar = function(ev){ var arq = ev.target.files[0]; ev.target.value = ""; if(!arq) return; if(arq.size>15*1048576){ c.d({type:"AVISO", txt:"Arquivo maior que 15 MB.", tom:"alerta"}); return; }
    var id = "ar"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36); salvarArquivo(id, arq).then(function(){ if(an) apagarArquivo(an.id); acao(c, "contr_anexo_add", {id:ct.id, anexo:{id:id, tipo:p.tipo, nome:arq.name, tam:arq.size}}); }); };
  if(an) return e("div",{className:"flex items-center gap-1.5"}, e("button",{onClick:function(){ baixarArquivo(an.id, an.nome).catch(function(){ c.d({type:"AVISO", txt:"Esse arquivo não está neste computador.", tom:"alerta"}); }); }, title:an.nome+" · "+br(new Date(an.em).toISOString().slice(0,10)), className:"max-w-[9rem] truncate rounded-lg bg-success/15 px-2 py-1 text-[12.5px] font-semibold text-success hover:bg-success/25"}, "📎 "+an.nome),
    e("button",{onClick:function(){ if(window.confirm("Remover o arquivo \""+an.nome+"\"?")){ apagarArquivo(an.id); acao(c, "contr_anexo_del", {id:ct.id, anexoId:an.id}); } }, "aria-label":"Remover arquivo", className:"grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"x", s:13})));
  if(p.dica) return e("span",{className:"text-[12px] text-muted-foreground"}, p.dica);
  return e("label",{className:"inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[12.5px] font-semibold hover:bg-white/20"}, "＋ Anexar", e("input",{type:"file", className:"hidden", onChange:enviar}));
}
function CelulaGerado(p){ var ct = p.ct; return ct.documentoId ? e("button",{onClick:function(){ baixarArquivo(ct.documentoId, ct.nome+".docx").catch(function(){ p.c.d({type:"AVISO", txt:"Esse arquivo não está neste computador.", tom:"alerta"}); }); }, className:"rounded-lg bg-primary/15 px-2 py-1 text-[12px] font-bold text-primary hover:bg-primary/25"}, "⬇ .docx gerado") : null; }
function BotaoExcluir(p){ var ct = p.ct; return e("button",{onClick:function(){ if(window.confirm("Remover "+ct.nome+"?")){ ct.anexos.forEach(function(a){ apagarArquivo(a.id); }); if(ct.documentoId) apagarArquivo(ct.documentoId); acao(p.c, "contr_del", {id:ct.id}); } }, "aria-label":"Remover", className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"}, e(Ph,{n:"trash", s:15})); }

// ───────────────── Assistente: gerar contrato de um modelo ─────────────────
function Gerar(p){
  var c = p.c, tipo = p.tipo, modelos = c.rh.modelos.filter(function(m){ return m.tipo===tipo; }), st = useState(p.modeloId ? "dados" : "modelo"), passo = st[0], setPasso = st[1], mi = useState(p.modeloId||""), modeloId = mi[0], setModeloId = mi[1];
  var dd = useState({status:STATUS_BY_TIPO[tipo][0], nome:"", cpf:"", cnpj:"", documento:"", valor:"", vigenciaInicio:"", vigenciaFim:"", obs:""}), d = dd[0], setD = function(o){ dd[1](Object.assign({}, d, o)); }, vv = useState({}), vals = vv[0], setVals = vv[1];
  var modelo = c.rh.modelos.find(function(m){ return m.id===modeloId; }), pj = tipo==="TERCEIRO" || tipo==="PARTICULAR";
  var gerar = function(){ var html = mesclarVariaveis(modelo.conteudo, vals), blob = htmlParaDocx(html), docId = "ar"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36), nomeArq = (modelo.nome+" - "+d.nome.trim()+".docx").replace(/[\\/:*?"<>|]/g, "-");
    salvarArquivo(docId, blob).then(function(){ acao(c, "contr_gerar", {tipo:tipo, modeloId:modelo.id, docId:docId, dados:{status:d.status, nome:d.nome.trim(), cpf:d.cpf.trim(), cnpj:d.cnpj.trim(), documento:d.documento.trim(), valor:num(d.valor)||null, vigenciaInicio:d.vigenciaInicio, vigenciaFim:d.vigenciaFim, obs:d.obs.trim()}}); baixarBlob(blob, nomeArq); p.fechar(); }); };
  return e(Modal,{t:"Gerar contrato a partir de um modelo", sub:passo==="modelo" ? "Escolha o modelo que serve de base." : passo==="dados" ? "Preencha os dados e as variáveis do modelo." : "Confira o texto antes de gerar o arquivo do Word.", largo:true, fechar:p.fechar},
    passo==="modelo" && e("div",{className:"flex flex-col gap-2"}, modelos.length===0 ? e("p",{className:"text-[13.5px] text-muted-foreground"}, "Nenhum modelo para "+TIPOS_CONTRATO[tipo]+" ainda. Crie em Contratos → Modelos de contrato.") :
      e(Sel,{value:modeloId, label:"Modelo", className:"w-full", onChange:setModeloId}, e("option",{value:""}, "Selecione um modelo…"), modelos.map(function(m){ return e("option",{key:m.id, value:m.id}, m.nome); }))),
    passo==="dados" && modelo && e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"},
      e(Campo,{rot:"Nome", className:"sm:col-span-2"}, e(Txt,{value:d.nome, ph:"Nome completo", label:"Nome", onChange:function(v){ setD({nome:v}); }})),
      e(Campo,{rot:"Status"}, e(Sel,{value:d.status, label:"Status", className:"w-full", onChange:function(v){ setD({status:v}); }}, STATUS_BY_TIPO[tipo].map(function(k){ return e("option",{key:k, value:k}, STATUS_LB[k]); }))),
      e(Campo,{rot:"CPF"}, e(Txt,{value:d.cpf, label:"CPF", ph:"000.000.000-00", onChange:function(v){ setD({cpf:v}); }})), e(Campo,{rot:"CNPJ"}, e(Txt,{value:d.cnpj, label:"CNPJ", onChange:function(v){ setD({cnpj:v}); }})),
      pj && e(React.Fragment,null, e(Campo,{rot:"Razão social (se PJ/MEI)"}, e(Txt,{value:d.documento, label:"Razão social", onChange:function(v){ setD({documento:v}); }})), e(Campo,{rot:"Valor (R$)"}, e(Txt,{value:d.valor, label:"Valor", onChange:function(v){ setD({valor:v.replace(/[^\d,.]/g,"")}); }})),
        e(Campo,{rot:"Vigência — início"}, e(Txt,{value:d.vigenciaInicio, type:"date", label:"Início", onChange:function(v){ setD({vigenciaInicio:v}); }})), e(Campo,{rot:"Vigência — fim"}, e(Txt,{value:d.vigenciaFim, type:"date", label:"Fim", onChange:function(v){ setD({vigenciaFim:v}); }}))),
      e(Campo,{rot:"Observações", className:"sm:col-span-2"}, e(Txt,{value:d.obs, label:"Observações", onChange:function(v){ setD({obs:v}); }})),
      modelo.variaveis.length>0 && e("div",{className:"flex flex-col gap-2 border-t border-white/10 pt-3 sm:col-span-2"}, e("b",{className:"text-[13px]"}, "Variáveis do modelo"), e("div",{className:"grid grid-cols-1 gap-3 sm:grid-cols-2"}, modelo.variaveis.map(function(v){
        return e(Campo,{key:v.key, rot:v.label}, e(Txt,{value:vals[v.key]||"", label:v.label, onChange:function(x){ var o = Object.assign({}, vals); o[v.key] = x; setVals(o); }})); })))),
    passo==="previa" && modelo && e("div",{className:"contrato-doc max-h-[420px] overflow-y-auto rounded-lg bg-white p-6 text-[14px] text-black", dangerouslySetInnerHTML:{__html:mesclarVariaveis(modelo.conteudo, vals)}}),
    e("div",{className:"flex justify-end gap-2 pt-1"}, passo==="modelo" && e(React.Fragment,null, e(Btn,{v:"ghost", onClick:p.fechar}, "Cancelar"), e(Btn,{v:"primary", disabled:!modeloId, onClick:function(){ setPasso("dados"); }}, "Continuar →")),
      passo==="dados" && e(React.Fragment,null, !p.modeloId && e(Btn,{v:"ghost", onClick:function(){ setPasso("modelo"); }}, "← Voltar"), e(Btn,{v:"primary", disabled:!d.nome.trim(), onClick:function(){ setPasso("previa"); }}, "Ver prévia →")),
      passo==="previa" && e(React.Fragment,null, e(Btn,{v:"ghost", onClick:function(){ setPasso("dados"); }}, "← Voltar"), e(Btn,{v:"primary", onClick:gerar}, "Gerar contrato (.docx)"))));
}
var ESTILO_DOC = ".contrato-doc h1{font-size:1.5rem;font-weight:700;margin:.6rem 0}.contrato-doc h2{font-size:1.25rem;font-weight:700;margin:.5rem 0}.contrato-doc h3{font-size:1.1rem;font-weight:700;margin:.4rem 0}.contrato-doc p{margin:.4rem 0}.contrato-doc ul{list-style:disc;padding-left:1.4rem;margin:.4rem 0}.contrato-doc ol{list-style:decimal;padding-left:1.4rem;margin:.4rem 0}";

// ───────────────── Página de lista (serve os 4 tipos) ─────────────────
function Pagina(p){
  var c = useRh(), rh = c.rh, tipo = p.tipo, es = useState({q:"", status:"todos", vinc:"todas"}), f = es[0], set = function(o){ es[1](Object.assign({}, f, o)); }, gm = useState(false), gerarAberto = gm[0], setGerar = gm[1];
  if(p.restrito && !c.sensivel) return e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:p.titulo, sub:p.sub}), e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px] text-muted-foreground"}, "Só os sócios abrem esta tela."));
  var todos = rh.contratos.filter(function(x){ return x.tipo===tipo; }), q = f.q.trim().toLowerCase();
  var lista = todos.filter(function(x){ return (f.status==="todos" || x.status===f.status) && (!q || (x.nome+" "+x.documento+" "+x.cnpj+" "+(x.obs||"")).toLowerCase().indexOf(q)>=0) && (!p.filtro || p.filtro(x, f)); });
  var novo = function(){ var nm = window.prompt(p.addPergunta||"Nome:"); if(nm && nm.trim()) acao(c, "contr_add", {tipo:tipo, nome:nm}); };
  var cols = p.colunas(c);
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-start justify-between gap-3"}, e(PageHead,{t:p.titulo, sub:p.sub}), e("div",{className:"flex flex-wrap gap-2"}, p.lote && e(Btn,{v:"ghost", onClick:function(){ acao(c, "contr_lote", {tipo:tipo, itens:p.lote(c)}); }}, p.loteRotulo), e(Btn,{v:"secondary", onClick:function(){ setGerar(true); }}, "Gerar de modelo"), p.extraBotao && p.extraBotao(c), e(Btn,{v:"primary", onClick:novo}, p.addRotulo))),
    p.topo && p.topo(c),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-5"}, e(Tile,{t:"Total", v:int(todos.length), cor:"#C4B5FD"}), STATUS_BY_TIPO[tipo].map(function(k){ return e(Tile,{key:k, t:STATUS_LB[k], v:int(todos.filter(function(x){ return x.status===k; }).length), cor:STATUS_COR[k]}); }), p.statExtra && p.statExtra(todos)),
    e("div",{className:"flex flex-wrap items-center gap-3"}, e(Txt,{value:f.q, ph:"Buscar…", label:"Buscar", className:"w-64", onChange:function(v){ set({q:v}); }}),
      e(Sel,{value:f.status, label:"Status", className:"w-52", onChange:function(v){ set({status:v}); }}, e("option",{value:"todos"}, "Todos os status"), STATUS_BY_TIPO[tipo].map(function(k){ return e("option",{key:k, value:k}, STATUS_LB[k]); })), p.filtros && p.filtros(f, set)),
    e(BlocoBarra,{cor:"roxo", t:p.titulo, sub:lista.length+" na lista", dir:String(lista.length)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, todos.length===0 ? "Nenhum contrato cadastrado ainda." : "Nenhum contrato para esse filtro.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, cols.map(function(k){ return th(k.h); }).concat([th("")]))),
        e("tbody",null, lista.map(function(ct){ return e("tr",{key:ct.id, className:"border-b border-border/60 "+(p.alerta && p.alerta(ct) ? "bg-destructive/10" : "")}, cols.map(function(k){ return e("td",{key:k.h, className:TD}, k.cel(ct)); }), e("td",{className:TD}, e(BotaoExcluir,{c:c, ct:ct}))); }))))),
    gerarAberto && e(Gerar,{c:c, tipo:tipo, fechar:function(){ setGerar(false); }}),
    e("style",null, ESTILO_DOC));
}
var save = function(c, ct, patch){ acao(c, "contr_set", {id:ct.id, patch:patch}); };

function AbaRhContrRep(){
  return e(Pagina,{tipo:"REPRESENTANTE", titulo:"Contratos de representantes", sub:"Controle da migração para o novo modelo de contrato (Axis): antigo → novo feito → assinado e anexado.", addRotulo:"+ Nova representante", loteRotulo:"Trazer as representantes da lista", addPergunta:"Nome da representante:",
    lote:function(){ return REPRESENTANTES.map(function(r){ return {nome:r.nome, extra:{}, obs:r.tambemFunc ? "Também é funcionária CLT" : ""}; }); },
    filtro:function(x, f){ var clt = (x.obs||"").indexOf("CLT")>=0; return f.vinc==="todas" || (f.vinc==="clt" ? clt : !clt); },
    filtros:function(f, set){ return e(React.Fragment,null, e(Sel,{value:f.vinc, label:"Vínculo", className:"w-44", onChange:function(v){ set({vinc:v}); }}, e("option",{value:"todas"}, "Todas"), e("option",{value:"clt"}, "Só também CLT"), e("option",{value:"sem"}, "Só sem vínculo")), null); },
    topo:function(c){ return e("div",{className:CARD+" flex flex-wrap items-center justify-between gap-3"}, e("p",{className:"text-[13.5px]"}, e("b",{className:"text-primary"}, "⛽ Referência de combustível — ANP. "), "Preço médio de revenda da gasolina, direto no levantamento da ANP."),
      e("a",{href:"https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas", target:"_blank", rel:"noreferrer", className:"rounded-lg bg-primary/15 px-3 py-1.5 text-[13px] font-bold text-primary hover:bg-primary/25"}, "Abrir painel da ANP")); },
    extraBotao:function(c){ return e(Btn,{v:"ghost", onClick:function(){ var n = window.prompt("Nome da nova coluna:"); if(n && n.trim()) acao(c, "contr_coluna_add", {nome:n}); }}, "+ Nova coluna"); },
    colunas:function(c){ var ex = [{h:"Testemunha 1", cel:function(ct){ return e(Texto,{v:ct.extra.testemunha1, ph:"a preencher", save:function(v){ acao(c, "contr_extra", {id:ct.id, chave:"testemunha1", valor:v}); }}); }}, {h:"Testemunha 2", cel:function(ct){ return e(Texto,{v:ct.extra.testemunha2, ph:"a preencher", save:function(v){ acao(c, "contr_extra", {id:ct.id, chave:"testemunha2", valor:v}); }}); }}];
      return [{h:"Representante", cel:function(ct){ return e(Texto,{v:ct.nome, save:function(v){ save(c, ct, {nome:v}); }}); }}, {h:"Status", cel:function(ct){ return e(CelulaStatus,{c:c, ct:ct}); }}].concat(ex, [{h:"CNPJ", cel:function(ct){ return e(Texto,{v:ct.cnpj, mono:true, ph:"—", save:function(v){ save(c, ct, {cnpj:v}); }}); }},
        {h:"Contrato", cel:function(ct){ return e("div",{className:"flex flex-col gap-1"}, e(CelulaAnexo,{c:c, ct:ct, tipo:"CONTRATO"}), e(CelulaGerado,{c:c, ct:ct})); }}, {h:"Termo Equip.", cel:function(ct){ return e(CelulaAnexo,{c:c, ct:ct, tipo:"EQUIPAMENTO"}); }},
        {h:"Link da conversa", cel:function(ct){ return e(Texto,{v:ct.extra.link, ph:"link", save:function(v){ acao(c, "contr_extra", {id:ct.id, chave:"link", valor:v}); }}); }}], (c.rh.colunasRep||[]).map(function(nome){ return {h:nome, cel:function(ct){ return e(Texto,{v:ct.extra[nome], save:function(v){ acao(c, "contr_extra", {id:ct.id, chave:nome, valor:v}); }}); }}; })); }});
}
function AbaRhContrFunc(){
  var emp = function(c){ return cnpjsDe(c.s.cnpjs).filter(function(x){ return x.num; }).map(function(x){ return x.nome; }); };
  return e(Pagina,{tipo:"CLT", titulo:"Contratos de funcionários (CLT)", sub:"Revisão à luz da CCT 2026/2027 e das políticas internas.", addRotulo:"+ Novo funcionário", loteRotulo:"Trazer as funcionárias do cadastro", addPergunta:"Nome do funcionário:",
    lote:function(c){ var nomes = {}; cnpjsDe(c.s.cnpjs).forEach(function(x){ nomes[x.id] = x.nome; }); return colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO"; }).map(function(x){ return {nome:x.nome, documento:x.funcao||"", cnpj:nomes[x.cnpj]||"", valor:c.sensivel ? (x.salario||null) : null}; }); },
    colunas:function(c){ return [{h:"Nome", cel:function(ct){ return e(Texto,{v:ct.nome, save:function(v){ save(c, ct, {nome:v}); }}); }}, {h:"Cargo", cel:function(ct){ return e(Texto,{v:ct.documento, ph:"Cargo", save:function(v){ save(c, ct, {documento:v}); }}); }},
      {h:"Empresa", cel:function(ct){ return e(Sel,{value:ct.cnpj||"", label:"Empresa", className:"h-8! w-44", onChange:function(v){ save(c, ct, {cnpj:v}); }}, e("option",{value:""}, "Selecione"), emp(c).map(function(n){ return e("option",{key:n, value:n}, n); })); }}].concat(c.sensivel ? [{h:"Salário", cel:function(ct){ return e(Dinheiro,{v:ct.valor, save:function(v){ save(c, ct, {valor:v}); }}); }}] : [],
      [{h:"Status", cel:function(ct){ return e(CelulaStatus,{c:c, ct:ct}); }}, {h:"Observação", cel:function(ct){ return e(Texto,{v:ct.obs, save:function(v){ save(c, ct, {obs:v}); }}); }},
       {h:"Contrato", cel:function(ct){ return e("div",{className:"flex flex-col gap-1"}, e(CelulaAnexo,{c:c, ct:ct, tipo:"CONTRATO"}), e(CelulaGerado,{c:c, ct:ct})); }}, {h:"Aditivos", cel:function(ct){ return e(CelulaAnexo,{c:c, ct:ct, tipo:"ADITIVO"}); }}]); }});
}
function Terceiros(tipo, titulo, sub, addRotulo, restrito){
  return e(Pagina,{tipo:tipo, titulo:titulo, sub:sub, addRotulo:addRotulo, restrito:restrito,
    alerta:function(ct){ return avencer(ct); },
    statExtra:function(todos){ return e(Tile,{key:"venc", t:"Vencendo (≤30 dias)", v:int(todos.filter(avencer).length), cor:"#EF4444"}); },
    colunas:function(c){ return [{h:"Nome", cel:function(ct){ return e(Texto,{v:ct.nome, save:function(v){ save(c, ct, {nome:v}); }}); }}, {h:"Função", cel:function(ct){ return e(Texto,{v:ct.documento, ph:"Função", save:function(v){ save(c, ct, {documento:v}); }}); }},
      {h:"CNPJ", cel:function(ct){ return e(Texto,{v:ct.cnpj, mono:true, ph:"—", save:function(v){ save(c, ct, {cnpj:v}); }}); }}].concat(c.sensivel ? [{h:"Valor", cel:function(ct){ return e(Dinheiro,{v:ct.valor, save:function(v){ save(c, ct, {valor:v}); }}); }}] : [],
      [{h:"Vigência (fim)", cel:function(ct){ var dias = ct.vigenciaFim ? diasEntre(hojeIso(), ct.vigenciaFim) : null; return e("div",{className:"flex items-center gap-2"}, e("input",{type:"date", value:ct.vigenciaFim||"", "aria-label":"Fim da vigência", className:INPUT+" h-9! w-40", onChange:function(ev){ save(c, ct, {vigenciaFim:ev.target.value}); }}), avencer(ct) && e("span",{className:"text-[12.5px] font-bold text-destructive"}, "⚠ "+dias+"d")); }},
       {h:"Status", cel:function(ct){ return e(CelulaStatus,{c:c, ct:ct}); }}, {h:"Contrato", cel:function(ct){ return e("div",{className:"flex flex-col gap-1"}, e(CelulaAnexo,{c:c, ct:ct, tipo:"CONTRATO"}), e(CelulaGerado,{c:c, ct:ct})); }},
       {h:"Termo de encerramento", cel:function(ct){ return e(CelulaAnexo,{c:c, ct:ct, tipo:"ENCERRAMENTO", dica:ct.status==="encerrado" ? null : "só se encerrado"}); }}]); }});
}
var avencer = function(ct){ if(ct.status!=="ativo" || !ct.vigenciaFim) return false; var d = diasEntre(hojeIso(), ct.vigenciaFim); return d>=0 && d<=30; };
function AbaRhContrTerc(){ return Terceiros("TERCEIRO", "Contratos de terceiros", "Prestadores de serviço e parceiros. O sistema avisa quando a vigência vence em até 30 dias.", "+ Novo terceiro", false); }
function AbaRhContrMarcus(){ return Terceiros("PARTICULAR", "Contratos particulares do Marcus", "Contratos pessoais (casa, prestadores particulares). Só os sócios abrem.", "+ Novo contrato", true); }

// ───────────────── Modelos de contrato (editor) ─────────────────
function Editor(p){
  var ref = useRef(null);
  useEffect(function(){ if(ref.current) ref.current.innerHTML = p.inicial||""; }, [p.chave]);
  var cmd = function(c, v){ return function(ev){ ev.preventDefault(); if(ref.current) ref.current.focus(); document.execCommand(c, false, v); }; };
  var bt = function(rot, titulo, fn, cls){ return e("button",{key:rot, type:"button", title:titulo, onMouseDown:fn, className:"h-8 min-w-8 rounded-md bg-white/10 px-2 text-[13px] font-bold hover:bg-white/20 "+(cls||"")}, rot); };
  var inserir = function(k){ if(ref.current) ref.current.focus(); document.execCommand("insertHTML", false, "<span data-variable-key=\""+k+"\" contenteditable=\"false\" style=\"background:#fde68a;color:#78350f;border-radius:4px;padding:0 4px;font-family:monospace\">{{"+k+"}}</span>&nbsp;"); };
  p.refExterno.current = function(){ return ref.current ? ref.current.innerHTML : ""; };
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-wrap items-center gap-1.5 rounded-xl bg-black/25 p-2"}, bt("N","Negrito", cmd("bold"), "font-black"), bt("I","Itálico", cmd("italic"), "italic"), bt("S","Sublinhado", cmd("underline"), "underline"), e("span",{className:"mx-1 h-5 w-px bg-white/20"}),
      bt("T1","Título grande", cmd("formatBlock","h1")), bt("T2","Título médio", cmd("formatBlock","h2")), bt("T3","Título pequeno", cmd("formatBlock","h3")), bt("¶","Parágrafo normal", cmd("formatBlock","p")), e("span",{className:"mx-1 h-5 w-px bg-white/20"}),
      bt("◧","Alinhar à esquerda", cmd("justifyLeft")), bt("☰","Centralizar", cmd("justifyCenter")), bt("▤","Justificar", cmd("justifyFull")), bt("• Lista","Lista com marcadores", cmd("insertUnorderedList")), bt("1. Lista","Lista numerada", cmd("insertOrderedList")), e("span",{className:"mx-1 h-5 w-px bg-white/20"}), bt("↶","Desfazer", cmd("undo")), bt("↷","Refazer", cmd("redo"))),
    e("div",{className:"flex flex-wrap items-center gap-1.5 text-[12px]"}, e("span",{className:"font-semibold text-muted-foreground"}, "Inserir variável no texto:"), p.variaveis.length===0 ? e("span",{className:"text-muted-foreground"}, "crie uma variável abaixo") : p.variaveis.map(function(v){ return e("button",{key:v.key, type:"button", onMouseDown:function(ev){ ev.preventDefault(); inserir(v.key); }, className:"rounded-full bg-[#fde68a] px-2.5 py-0.5 font-mono font-bold text-[#78350f] hover:brightness-110"}, "{{"+v.key+"}}"); })),
    e("div",{ref:ref, contentEditable:true, suppressContentEditableWarning:true, className:"contrato-doc min-h-[22rem] rounded-xl bg-white p-6 text-[14px] leading-relaxed text-black outline-none ring-2 ring-[#8B5CF6]/40 focus:ring-[#8B5CF6]"}));
}
function AbaRhContrModelos(){
  var c = useRh(), rh = c.rh, ed = useState(null), edit = ed[0], setEdit = ed[1], gm = useState(null), gerar = gm[0], setGerar = gm[1], vs = useState([]), vars = vs[0], setVars = vs[1], nv = useState(""), novaVar = nv[0], setNovaVar = nv[1], lb = useState(""), nome = lb[0], setNome = lb[1], tp = useState("TERCEIRO"), tipo = tp[0], setTipo = tp[1];
  var lerHtml = useRef(null);
  var abrir = function(m){ setEdit(m ? m.id : "novo"); setNome(m ? m.nome : ""); setTipo(m ? m.tipo : "TERCEIRO"); setVars(m ? m.variaveis : []); setNovaVar(""); };
  var addVar = function(){ var label = novaVar.trim(), key = slugKey(label); if(!label || !key || vars.some(function(v){ return v.key===key; })) return; setVars(vars.concat([{key:key, label:label}])); setNovaVar(""); };
  var salvar = function(){ var html = lerHtml.current ? lerHtml.current() : ""; acao(c, "modelo_save", {id:edit==="novo" ? null : edit, tipo:tipo, nome:nome, conteudo:html, variaveis:vars}); setEdit(null); };
  var modelo = edit && edit!=="novo" ? rh.modelos.find(function(m){ return m.id===edit; }) : null;
  if(edit){
    return e("div",{className:"flex flex-col gap-4"},
      e(PageHead,{t:edit==="novo" ? "Novo modelo de contrato" : "Editar modelo", sub:"Escreva o contrato e marque o que muda de pessoa para pessoa como variável (aparece em amarelo). Ao gerar, o sistema pergunta o valor de cada uma."}),
      e("div",{className:"flex flex-wrap items-end gap-3"}, e(Campo,{rot:"Nome do modelo", className:"min-w-[16rem] flex-1"}, e(Txt,{value:nome, label:"Nome", ph:"Ex.: Prestação de serviço PJ", onChange:setNome})), e(Campo,{rot:"Para qual tipo de contrato"}, e(Sel,{value:tipo, label:"Tipo", className:"w-56", onChange:setTipo}, Object.keys(TIPOS_CONTRATO).map(function(k){ return e("option",{key:k, value:k}, TIPOS_CONTRATO[k]); })))),
      e(BlocoBarra,{cor:"roxo", t:"Texto do contrato", sub:"clique no texto para escrever; use a barra para formatar"}, e("div",{className:"p-4"}, e(Editor,{chave:edit, inicial:modelo ? modelo.conteudo : "", variaveis:vars, refExterno:lerHtml}))),
      e(BlocoBarra,{cor:"roxo", t:"Variáveis do modelo", sub:"ex.: Nome do contratado, Valor mensal, Data de início"}, e("div",{className:"flex flex-col gap-3 p-4"}, vars.length>0 && e("div",{className:"flex flex-wrap gap-2"}, vars.map(function(v){ return e("span",{key:v.key, className:"flex items-center gap-1.5 rounded-full bg-black/30 py-1 pr-1 pl-3 text-[13px]"}, e("span",{className:"font-mono text-muted-foreground"}, "{{"+v.key+"}}"), v.label,
        e("button",{onClick:function(){ setVars(vars.filter(function(x){ return x.key!==v.key; })); }, "aria-label":"Remover variável", className:"grid size-6 place-items-center rounded-full hover:bg-destructive/25"}, e(Ph,{n:"x", s:12}))); })),
        e("div",{className:"flex gap-2"}, e(Txt,{value:novaVar, ph:"Ex.: Nome do contratado", label:"Nova variável", className:"w-72", onChange:setNovaVar}), e(Btn,{v:"secondary", onClick:addVar}, "+ Variável")))),
      e("div",{className:"flex justify-end gap-2"}, e(Btn,{v:"ghost", onClick:function(){ setEdit(null); }}, "Cancelar"), e(Btn,{v:"primary", disabled:!nome.trim(), onClick:salvar}, "Salvar modelo")),
      e("style",null, ESTILO_DOC));
  }
  return e("div",{className:"flex flex-col gap-4"},
    e("div",{className:"flex flex-wrap items-start justify-between gap-3"}, e(PageHead,{t:"Modelos de contrato", sub:"Textos prontos com variáveis. Em cada lista de contratos, \"Gerar de modelo\" preenche e baixa o arquivo do Word."}), e(Btn,{v:"primary", onClick:function(){ abrir(null); }}, "+ Novo modelo")),
    Object.keys(TIPOS_CONTRATO).map(function(k){ var ms = rh.modelos.filter(function(m){ return m.tipo===k; });
      return e(BlocoBarra,{key:k, cor:"roxo", t:TIPOS_CONTRATO[k], sub:ms.length+(ms.length===1 ? " modelo" : " modelos"), dir:String(ms.length)}, ms.length===0 ? e("p",{className:"px-4 py-5 text-center text-[13px] text-muted-foreground"}, "Nenhum modelo para este tipo.") :
        e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"}, ms.map(function(m){ return e("div",{key:m.id, className:"flex flex-wrap items-center justify-between gap-2 py-2.5"}, e("span",null, e("b",{className:"text-[14px]"}, m.nome), e("span",{className:"block text-[12px] text-muted-foreground"}, m.variaveis.length+" variável(is) · alterado em "+new Date(m.atualizadoEm).toLocaleDateString("pt-BR")+(m.por ? " por "+m.por : ""))),
          e("span",{className:"flex items-center gap-2"}, e(Btn,{v:"secondary", sm:true, onClick:function(){ setGerar(m); }}, "Gerar contrato"), e(Btn,{v:"ghost", sm:true, onClick:function(){ abrir(m); }}, "Editar"), e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Excluir o modelo \""+m.nome+"\"?")) acao(c, "modelo_del", {id:m.id}); }}, "Excluir"))); }))); }),
    gerar && e(Gerar,{c:c, tipo:gerar.tipo, modeloId:gerar.id, fechar:function(){ setGerar(null); }}),
    e("style",null, ESTILO_DOC));
}

export { AbaRhContrRep, AbaRhContrFunc, AbaRhContrTerc, AbaRhContrMarcus, AbaRhContrModelos };
