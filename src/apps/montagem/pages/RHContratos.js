// Sorelly Admin · montagem — pages/RHContratos.js
// Contratos do RH: representantes, funcionários (CLT), terceiros (prestadores, advogados, contador...), particulares do Marcus, crédito bancário, aluguéis, consórcios e os Modelos (texto com variáveis que vira .docx do Word).
// Refeito em 19/11/2026 no padrão do sistema (pedido do Marcus): TabelaPlanilha com filtro e ordem em cada coluna, escolha em menu suspenso, sem blocos de totais no topo, sem chips, nada abreviado, campos de 32 px.
// Regras em domain/rh.js; o .docx é gerado aqui no navegador (lib/docx-mini.js) e os arquivos anexados ficam no navegador (lib/arquivos.js). Só neste computador por enquanto.
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao, BotaoRemover, CAMPO, CampoSel, Rotulo, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { nomeDe, veSalarios } from "@/apps/montagem/domain/equipe";
import { REPRESENTANTES } from "@/apps/montagem/domain/pessoas";
import { STATUS_BY_TIPO, STATUS_LB, TIPOS_CONTRATO, bancosDe, br, colaboradoresRh, hojeIso, diasEntre } from "@/apps/montagem/domain/rh";
import { apagarArquivo, baixarArquivo, salvarArquivo } from "@/apps/montagem/lib/arquivos";
import { baixarBlob, htmlParaDocx, mesclarVariaveis } from "@/apps/montagem/lib/docx-mini";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return v ? Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}) : ""; };
var STATUS_COR = {antigo:"#EF4444", feito:"#F59E0B", assinado:"#22C55E", encerrado:"#94A3B8", nao_revisado:"#EF4444", em_revisao:"#F59E0B", atualizado:"#22C55E", ativo:"#22C55E", quitado:"#22C55E", contemplado:"#3B82F6"};
var slugKey = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""); };
// tipos de prestador (Terceiros e Particulares): serve para filtrar a lista (advogado, contador...)
var TIPOS_PRESTADOR = ["Advogado", "Contador", "Segurança do trabalho", "Medicina do trabalho", "Tecnologia", "Marketing", "Consultoria", "Manutenção", "Limpeza", "Outros"];

function useRh(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, rh:s.rh, por:nomeDe(s.usuario), sensivel:veSalarios(s.usuario)}; }
function acao(c, op, extra){ c.d(Object.assign({type:"RH", op:op, por:c.por}, extra)); }
var save = function(c, ct, patch){ acao(c, "contr_set", {id:ct.id, patch:patch}); };
var extra = function(ct, chave){ return (ct.extra||{})[chave]; };
var avencer = function(ct){ if(ct.status!=="ativo" || !ct.vigenciaFim) return false; var d = diasEntre(hojeIso(), ct.vigenciaFim); return d>=0 && d<=30; };

// ───────────────── campos que ficam dentro das células ─────────────────
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:CAMPO+" cursor-pointer "+(p.cls||"min-w-[9rem]"), style:p.cor ? {color:p.cor} : undefined, onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Texto(p){ return e("input",{key:p.v, defaultValue:p.v||"", placeholder:p.ph||"", "aria-label":p.label||p.ph||"Campo", className:CAMPO+" "+(p.cls||"min-w-[10rem]")+(p.mono ? " "+MONO : ""), onBlur:function(ev){ if(ev.target.value!==(p.v||"")) p.save(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); }
function Dinheiro(p){ return e("input",{key:p.v, defaultValue:fmtN(p.v), placeholder:"R$ 0,00", "aria-label":p.label||"Valor em reais", className:CAMPO+" w-32 "+MONO, onBlur:function(ev){ var v = num(ev.target.value); if(v!==(p.v||0)) p.save(v||null); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); }
function CelulaStatus(p){ var c = p.c, ct = p.ct; return e(Sel,{value:ct.status, label:"Status", cls:"min-w-[10rem]", cor:STATUS_COR[ct.status], onChange:function(v){ acao(c, "contr_set", {id:ct.id, patch:{status:v}}); }}, STATUS_BY_TIPO[ct.tipo].map(function(k){ return e("option",{key:k, value:k}, STATUS_LB[k]); })); }
var BTN_TXT = "inline-flex h-8 items-center rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10";
function CelulaAnexo(p){
  var c = p.c, ct = p.ct, an = ct.anexos.find(function(a){ return a.tipo===p.tipo; });
  var enviar = function(ev){ var arq = ev.target.files[0]; ev.target.value = ""; if(!arq) return; if(arq.size>15*1048576){ c.d({type:"AVISO", txt:"Arquivo maior que 15 MB.", tom:"alerta"}); return; }
    var id = "ar"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36); salvarArquivo(id, arq).then(function(){ if(an) apagarArquivo(an.id); acao(c, "contr_anexo_add", {id:ct.id, anexo:{id:id, tipo:p.tipo, nome:arq.name, tam:arq.size}}); }); };
  if(an) return e("div",{className:"flex items-center justify-center gap-2"}, e("button",{type:"button", onClick:function(){ baixarArquivo(an.id, an.nome).catch(function(){ c.d({type:"AVISO", txt:"Esse arquivo não está neste computador.", tom:"alerta"}); }); }, title:"Anexado em "+br(new Date(an.em).toISOString().slice(0,10)), className:"h-8 text-[13px] text-success underline hover:brightness-125"}, an.nome),
    e(BotaoRemover,{label:"Remover arquivo", onClick:function(){ if(window.confirm("Remover o arquivo \""+an.nome+"\"?")){ apagarArquivo(an.id); acao(c, "contr_anexo_del", {id:ct.id, anexoId:an.id}); } }}));
  if(p.dica) return e("span",{className:"text-[13px]"}, p.dica);
  return e("label",{className:BTN_TXT+" cursor-pointer"}, "Anexar", e("input",{type:"file", className:"hidden", onChange:enviar}));
}
function CelulaGerado(p){ var ct = p.ct; return ct.documentoId ? e("button",{type:"button", onClick:function(){ baixarArquivo(ct.documentoId, ct.nome+".docx").catch(function(){ p.c.d({type:"AVISO", txt:"Esse arquivo não está neste computador.", tom:"alerta"}); }); }, className:"h-8 text-[13px] text-primary underline hover:brightness-125"}, "Baixar .docx gerado") : null; }
function CelulaContrato(p){ return e("div",{className:"flex flex-col items-center gap-1"}, e(CelulaAnexo,{c:p.c, ct:p.ct, tipo:"CONTRATO"}), e(CelulaGerado,{c:p.c, ct:p.ct})); }
function CelulaFim(p){ var c = p.c, ct = p.ct, dias = ct.vigenciaFim ? diasEntre(hojeIso(), ct.vigenciaFim) : null;
  return e("div",{className:"flex items-center justify-center gap-2"}, e("input",{type:"date", value:ct.vigenciaFim||"", "aria-label":"Fim da vigência", className:CAMPO+" w-40", onChange:function(ev){ save(c, ct, {vigenciaFim:ev.target.value}); }}), avencer(ct) && e("span",{className:"text-[13px] font-bold text-destructive"}, "Vence em "+dias+(dias===1 ? " dia" : " dias"))); }

// ───────────────── definição de coluna: {h, cel(ct), v(ct) = texto para filtrar e ordenar, soma(ct) = número para o total} ─────────────────
function K(h, cel, v, soma){ return {h:h, cel:cel, v:v, soma:soma}; }
function colTexto(c, h, campo, ph, mono){ return K(h, function(ct){ return e(Texto,{v:ct[campo], ph:ph||"", label:h, mono:mono, save:function(v){ save(c, ct, (function(){ var o = {}; o[campo] = v; return o; })()); }}); }, function(ct){ return ct[campo]||""; }); }
function colExtra(c, h, chave, ph, mono){ return K(h, function(ct){ return e(Texto,{v:extra(ct, chave), ph:ph||"", label:h, mono:mono, save:function(v){ acao(c, "contr_extra", {id:ct.id, chave:chave, valor:v}); }}); }, function(ct){ return extra(ct, chave)||""; }); }
function colDinExtra(c, h, chave){ return K(h, function(ct){ return e(Dinheiro,{v:extra(ct, chave), label:h, save:function(v){ acao(c, "contr_extra", {id:ct.id, chave:chave, valor:v}); }}); }, function(ct){ return extra(ct, chave) ? brl(Number(extra(ct, chave))) : ""; }, function(ct){ return Number(extra(ct, chave))||0; }); }
function colValor(c, h, somar){ return K(h, function(ct){ return e(Dinheiro,{v:ct.valor, label:h, save:function(v){ save(c, ct, {valor:v}); }}); }, function(ct){ return ct.valor ? brl(Number(ct.valor)) : ""; }, somar || function(ct){ return Number(ct.valor)||0; }); }
function colFim(c, h){ return K(h||"Fim da vigência", function(ct){ return e(CelulaFim,{c:c, ct:ct}); }, function(ct){ return ct.vigenciaFim ? br(ct.vigenciaFim) : ""; }); }
function colStatus(c){ return K("Status", function(ct){ return e(CelulaStatus,{c:c, ct:ct}); }, function(ct){ return STATUS_LB[ct.status]||ct.status; }); }
function colContrato(c){ return K("Contrato", function(ct){ return e(CelulaContrato,{c:c, ct:ct}); }, function(ct){ return ct.anexos.some(function(a){ return a.tipo==="CONTRATO"; }) || ct.documentoId ? "Anexado" : "Falta anexar"; }); }
function colAnexo(c, h, tipo, dica){ return K(h, function(ct){ return e(CelulaAnexo,{c:c, ct:ct, tipo:tipo, dica:dica && ct.status!=="encerrado" ? dica : null}); }, function(ct){ return ct.anexos.some(function(a){ return a.tipo===tipo; }) ? "Anexado" : "Falta anexar"; }); }
function colArq(c){ return [colContrato(c), colExtra(c, "Drive", "drive", "Link do Drive")]; }

// ───────────────── Assistente: gerar contrato de um modelo ─────────────────
function CampoLinha(p){ return e("div",{className:"min-w-0 "+(p.cls||"")}, e(Rotulo,{t:p.t, id:p.id}), p.children); }
function Entrada(p){ return e("input",{id:p.id, value:p.value, type:p.type||"text", placeholder:p.ph||"", className:CAMPO, onChange:function(ev){ p.onChange(ev.target.value); }}); }
var ESTILO_DOC = ".contrato-doc h1{font-size:1.5rem;font-weight:700;margin:.6rem 0}.contrato-doc h2{font-size:1.25rem;font-weight:700;margin:.5rem 0}.contrato-doc h3{font-size:1.1rem;font-weight:700;margin:.4rem 0}.contrato-doc p{margin:.4rem 0}.contrato-doc ul{list-style:disc;padding-left:1.4rem;margin:.4rem 0}.contrato-doc ol{list-style:decimal;padding-left:1.4rem;margin:.4rem 0}";
function Gerar(p){
  var c = p.c, tipo = p.tipo, modelos = c.rh.modelos.filter(function(m){ return m.tipo===tipo; }), st = useState(p.modeloId ? "dados" : "modelo"), passo = st[0], setPasso = st[1], mi = useState(p.modeloId||""), modeloId = mi[0], setModeloId = mi[1];
  var dd = useState({status:STATUS_BY_TIPO[tipo][0], nome:"", cpf:"", cnpj:"", documento:"", valor:"", vigenciaInicio:"", vigenciaFim:"", obs:""}), d = dd[0], setD = function(o){ dd[1](Object.assign({}, d, o)); }, vv = useState({}), vals = vv[0], setVals = vv[1];
  var modelo = c.rh.modelos.find(function(m){ return m.id===modeloId; }), pj = tipo==="TERCEIRO" || tipo==="PARTICULAR";
  var gerar = function(){ var html = mesclarVariaveis(modelo.conteudo, vals), blob = htmlParaDocx(html), docId = "ar"+Date.now().toString(36)+Math.floor(Math.random()*999).toString(36), nomeArq = (modelo.nome+" - "+d.nome.trim()+".docx").replace(/[\\/:*?"<>|]/g, "-");
    salvarArquivo(docId, blob).then(function(){ acao(c, "contr_gerar", {tipo:tipo, modeloId:modelo.id, docId:docId, dados:{status:d.status, nome:d.nome.trim(), cpf:d.cpf.trim(), cnpj:d.cnpj.trim(), documento:d.documento.trim(), valor:num(d.valor)||null, vigenciaInicio:d.vigenciaInicio, vigenciaFim:d.vigenciaFim, obs:d.obs.trim()}}); baixarBlob(blob, nomeArq); p.fechar(); }); };
  var corpo = passo==="modelo" ? e("div",{key:"m", className:"flex flex-col gap-2"}, modelos.length===0 ? e("span",{className:"text-[13px]"}, "Nenhum modelo para "+TIPOS_CONTRATO[tipo]+" ainda. Crie em Contratos > Modelos de contrato.") :
      e(CampoSel,{t:"Modelo", id:"ger-modelo", value:modeloId, onChange:setModeloId, opcoes:[["", "Selecione um modelo"]].concat(modelos.map(function(m){ return [m.id, m.nome]; }))}))
    : passo==="dados" && modelo ? e("div",{key:"d", className:"grid grid-cols-1 gap-2 sm:grid-cols-2"},
      e(CampoLinha,{t:"Nome", id:"ger-nome", cls:"sm:col-span-2"}, e(Entrada,{id:"ger-nome", value:d.nome, ph:"Nome completo", onChange:function(v){ setD({nome:v}); }})),
      e(CampoSel,{t:"Status", id:"ger-status", value:d.status, onChange:function(v){ setD({status:v}); }, opcoes:STATUS_BY_TIPO[tipo].map(function(k){ return [k, STATUS_LB[k]]; })}),
      e(CampoLinha,{t:"CPF", id:"ger-cpf"}, e(Entrada,{id:"ger-cpf", value:d.cpf, ph:"000.000.000-00", onChange:function(v){ setD({cpf:v}); }})), e(CampoLinha,{t:"CNPJ", id:"ger-cnpj"}, e(Entrada,{id:"ger-cnpj", value:d.cnpj, onChange:function(v){ setD({cnpj:v}); }})),
      pj && e(React.Fragment,null, e(CampoLinha,{t:"Razão social (se PJ ou MEI)", id:"ger-doc"}, e(Entrada,{id:"ger-doc", value:d.documento, onChange:function(v){ setD({documento:v}); }})), e(CampoLinha,{t:"Valor (R$)", id:"ger-valor"}, e(Entrada,{id:"ger-valor", value:d.valor, ph:"R$ 0,00", onChange:function(v){ setD({valor:v.replace(/[^\d,.]/g,"")}); }})),
        e(CampoLinha,{t:"Vigência: início", id:"ger-ini"}, e(Entrada,{id:"ger-ini", value:d.vigenciaInicio, type:"date", onChange:function(v){ setD({vigenciaInicio:v}); }})), e(CampoLinha,{t:"Vigência: fim", id:"ger-fim"}, e(Entrada,{id:"ger-fim", value:d.vigenciaFim, type:"date", onChange:function(v){ setD({vigenciaFim:v}); }}))),
      e(CampoLinha,{t:"Observações", id:"ger-obs", cls:"sm:col-span-2"}, e(Entrada,{id:"ger-obs", value:d.obs, onChange:function(v){ setD({obs:v}); }})),
      modelo.variaveis.length>0 && e("div",{className:"flex flex-col gap-2 border-t border-white/10 pt-2 sm:col-span-2"}, e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Variáveis do modelo"), e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, modelo.variaveis.map(function(v){
        return e(CampoLinha,{key:v.key, t:v.label, id:"ger-v-"+v.key}, e(Entrada,{id:"ger-v-"+v.key, value:vals[v.key]||"", onChange:function(x){ var o = Object.assign({}, vals); o[v.key] = x; setVals(o); }})); }))))
    : passo==="previa" && modelo ? e("div",{key:"p", className:"contrato-doc max-h-[420px] overflow-y-auto rounded-lg bg-white p-6 text-[13px] text-black", dangerouslySetInnerHTML:{__html:mesclarVariaveis(modelo.conteudo, vals)}}) : null;
  var rodape = passo==="modelo" ? [e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"n", principal:true, desabilitado:!modeloId, onClick:function(){ setPasso("dados"); }}, "Continuar")]
    : passo==="dados" ? [!p.modeloId && e(Botao,{key:"v", onClick:function(){ setPasso("modelo"); }}, "Voltar"), e(Botao,{key:"p", principal:true, desabilitado:!d.nome.trim(), onClick:function(){ setPasso("previa"); }}, "Ver prévia")]
    : [e(Botao,{key:"v", onClick:function(){ setPasso("dados"); }}, "Voltar"), e(Botao,{key:"g", principal:true, onClick:gerar}, "Gerar contrato (.docx)")];
  return e(Janela,{t:"Gerar contrato de um modelo", sub:passo==="modelo" ? "Escolha o modelo." : passo==="dados" ? "Preencha os dados e as variáveis." : "Confira o texto antes de gerar o arquivo do Word.", fechar:p.fechar, colunas:[corpo], rodape:rodape});
}

// ───────────────── Página de lista (serve todos os tipos de contrato) ─────────────────
function Pagina(p){
  var c = useRh(), rh = c.rh, tipo = p.tipo, gm = useState(false), gerarAberto = gm[0], setGerar = gm[1];
  if(p.restrito && !c.sensivel) return e("div",{className:"flex flex-col gap-2"}, e(PageHead,{t:p.titulo}), e("span",{className:"text-[13px]"}, "Só os sócios abrem esta tela."));
  var todos = rh.contratos.filter(function(x){ return x.tipo===tipo; });
  var novo = function(){ var nm = window.prompt(p.addPergunta||"Nome:"); if(nm && nm.trim()) acao(c, "contr_add", {tipo:tipo, nome:nm}); };
  var colsDef = p.colunas(c);
  var cols = colsDef.map(function(k, i){ return {k:"c"+i, t:k.h, render:function(v, l){ return k.cel(l.ct); }}; }).concat([{k:"rem", t:"Remover", render:function(v, l){ var ct = l.ct; return e(BotaoRemover,{label:"Remover "+ct.nome, onClick:function(){ if(window.confirm("Remover "+ct.nome+"?")){ ct.anexos.forEach(function(a){ apagarArquivo(a.id); }); if(ct.documentoId) apagarArquivo(ct.documentoId); acao(c, "contr_del", {id:ct.id}); } }}); }}]);
  var linhas = todos.map(function(ct){ var l = {id:ct.id, ct:ct, rem:""}; colsDef.forEach(function(k, i){ l["c"+i] = k.v ? k.v(ct) : ""; }); return l; });
  var somas = colsDef.some(function(k){ return k.soma; });
  var totalRodape = somas ? function(ls){ return colsDef.map(function(k, i){ return i===0 ? "Total" : k.soma ? brl(ls.reduce(function(t, l){ return t+(k.soma(l.ct)||0); }, 0)) : ""; }).concat([""]); } : undefined;
  return e("div",{className:"flex flex-col gap-2"},
    e(PageHead,{t:p.titulo, sub:p.sub}, p.lote && e(Botao,{onClick:function(){ acao(c, "contr_lote", {tipo:tipo, itens:p.lote(c)}); }}, p.loteRotulo), e(Botao,{onClick:function(){ setGerar(true); }}, "Gerar de modelo"), p.extraBotao && p.extraBotao(c), e(Botao,{principal:true, onClick:novo}, p.addRotulo)),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semMao:true, limite:100, totalRodape:totalRodape, linhaCls:function(l){ return p.alerta && p.alerta(l.ct) ? "bg-destructive/10" : ""; }, vazio:"Nenhum contrato cadastrado ainda."}),
    p.depois && p.depois(c),
    gerarAberto && e(Gerar,{c:c, tipo:tipo, fechar:function(){ setGerar(false); }}),
    e("style",null, ESTILO_DOC));
}

// ───────────────── Representantes ─────────────────
function AbaRhContrRep(){
  return e(Pagina,{tipo:"REPRESENTANTE", titulo:"Contratos de representantes", sub:"Migração para o novo contrato (Axis): antigo, novo feito, assinado e anexado.", addRotulo:"Nova representante", loteRotulo:"Trazer as representantes da lista", addPergunta:"Nome da representante:",
    lote:function(){ return REPRESENTANTES.map(function(r){ return {nome:r.nome, extra:{}, obs:r.tambemFunc ? "Também é funcionária CLT" : ""}; }); },
    extraBotao:function(c){ return [e(Botao,{key:"anp", onClick:function(){ window.open("https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas", "_blank", "noopener"); }}, "Gasolina (ANP)"), e(Botao,{key:"col", onClick:function(){ var n = window.prompt("Nome da nova coluna:"); if(n && n.trim()) acao(c, "contr_coluna_add", {nome:n}); }}, "Nova coluna")]; },
    colunas:function(c){ return [colTexto(c, "Representante", "nome"), colStatus(c), colExtra(c, "Testemunha 1", "testemunha1", "A preencher"), colExtra(c, "Testemunha 2", "testemunha2", "A preencher"), colTexto(c, "CNPJ", "cnpj", "CNPJ", true),
      colContrato(c), colAnexo(c, "Termo de equipamento", "EQUIPAMENTO"), colExtra(c, "Link da conversa", "link", "Link"),
      K("Vínculo", function(ct){ return e("span",{className:"text-[13px]"}, (ct.obs||"").indexOf("CLT")>=0 ? "Também CLT" : "Sem vínculo"); }, function(ct){ return (ct.obs||"").indexOf("CLT")>=0 ? "Também CLT" : "Sem vínculo"; })]
      .concat((c.rh.colunasRep||[]).map(function(nome){ return colExtra(c, nome, nome); })); }});
}

// ───────────────── Funcionários (CLT) ─────────────────
function AbaRhContrFunc(){
  var emp = function(c){ return cnpjsDe(c.s.cnpjs).filter(function(x){ return x.num; }).map(function(x){ return x.nome; }); };
  return e(Pagina,{tipo:"CLT", titulo:"Contratos de funcionários (CLT)", sub:"Revisão pela convenção coletiva 2026/2027 e pelas políticas internas.", addRotulo:"Novo funcionário", loteRotulo:"Trazer as funcionárias do cadastro", addPergunta:"Nome do funcionário:",
    lote:function(c){ var nomes = {}; cnpjsDe(c.s.cnpjs).forEach(function(x){ nomes[x.id] = x.nome; }); return colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO"; }).map(function(x){ return {nome:x.nome, documento:x.funcao||"", cnpj:nomes[x.cnpj]||"", valor:c.sensivel ? (x.salario||null) : null}; }); },
    colunas:function(c){ return [colTexto(c, "Nome", "nome"), colTexto(c, "Cargo", "documento", "Cargo"),
      K("Empresa", function(ct){ return e(Sel,{value:ct.cnpj||"", label:"Empresa", cls:"min-w-[11rem]", onChange:function(v){ save(c, ct, {cnpj:v}); }}, e("option",{value:""}, "Selecione"), emp(c).map(function(n){ return e("option",{key:n, value:n}, n); })); }, function(ct){ return ct.cnpj||""; })]
      .concat(c.sensivel ? [colValor(c, "Salário")] : [], [colStatus(c), colTexto(c, "Observação", "obs"), colContrato(c), colAnexo(c, "Aditivos", "ADITIVO")]); }});
}

// ───────────────── Terceiros e Particulares: prestadores, advogados, contador e outros ─────────────────
// Terceiros que já temos (23/10/2026, pedido do Marcus): Leonardo (H&O Apps), Lucas Castilho (prestador dentro da empresa) e Igor (função a confirmar). Nomes só; o contrato assinado entra pelo Anexar.
var TERCEIROS_INICIAIS = [{nome:"Leonardo", documento:"Desenvolvedor (H&O Apps)", cnpj:"H&O Apps", extra:{tipo:"Tecnologia"}}, {nome:"Lucas Castilho", documento:"Prestador dentro da empresa"}, {nome:"Igor", documento:"A confirmar", obs:"Função e empresa a confirmar"}];
function Terceiros(tipo, titulo, sub, addRotulo, restrito, lote){
  return e(Pagina,{tipo:tipo, titulo:titulo, sub:sub, addRotulo:addRotulo, restrito:restrito, lote:lote ? function(){ return lote; } : undefined, loteRotulo:"Trazer Leonardo, Castilho e Igor", addPergunta:"Nome do prestador (pessoa ou escritório):",
    alerta:avencer,
    colunas:function(c){ return [colTexto(c, "Nome", "nome"),
      K("Tipo", function(ct){ return e(Sel,{value:extra(ct, "tipo")||"", label:"Tipo de prestador", cls:"min-w-[12rem]", onChange:function(v){ acao(c, "contr_extra", {id:ct.id, chave:"tipo", valor:v}); }}, e("option",{value:""}, "Escolha o tipo"), TIPOS_PRESTADOR.map(function(n){ return e("option",{key:n, value:n}, n); })); }, function(ct){ return extra(ct, "tipo")||"Sem tipo"; }),
      colTexto(c, "Função", "documento", "Função"), colTexto(c, "CNPJ", "cnpj", "CNPJ", true), colExtra(c, "Registro (OAB, CRC...)", "registro", "Número", true)]
      .concat(c.sensivel ? [colValor(c, "Honorário mensal")] : [], [colFim(c, "Vigência (fim)"), colStatus(c), colContrato(c), colAnexo(c, "Termo de encerramento", "ENCERRAMENTO", "Só se encerrado"), colExtra(c, "Drive", "drive", "Link do Drive")]); }});
}
function AbaRhContrTerc(){ return Terceiros("TERCEIRO", "Contratos de terceiros", "Prestadores, advogados, contador e parceiros. Avisa quando a vigência vence em até 30 dias.", "Novo terceiro", false, TERCEIROS_INICIAIS); }
function AbaRhContrMarcus(){ return Terceiros("PARTICULAR", "Contratos particulares do Marcus", "Contratos pessoais (casa, prestadores particulares). Só os sócios abrem.", "Novo contrato", true); }

// ───────────────── Crédito bancário, aluguéis e consórcios (23/10/2026) ─────────────────
// Mesma tabela dos outros contratos; o PDF fica no Drive (link na coluna "Drive") e a tela guarda os números. Só os sócios abrem (tem valor).
function Dinheiros(tipo, titulo, sub, addRotulo, addPergunta, colunas, depois){
  return e(Pagina,{tipo:tipo, titulo:titulo, sub:sub, addRotulo:addRotulo, addPergunta:addPergunta, restrito:true, alerta:avencer, depois:depois, colunas:colunas});
}
function Gerentes(c){
  var lista = bancosDe(c.rh), campo = function(b, chave, ph, mono){ return e(Texto,{v:b[chave], ph:ph, label:ph, mono:mono, cls:"min-w-[10rem]", save:function(v){ var o = {}; o[chave] = v; acao(c, "banco_set", {id:b.id, patch:o}); }}); };
  var cols = [{k:"banco", t:"Banco", render:function(v, l){ return campo(l.b, "banco", "Banco"); }}, {k:"contato", t:"Contato", render:function(v, l){ return campo(l.b, "contato", "Contato"); }}, {k:"cargo", t:"Cargo", render:function(v, l){ return campo(l.b, "cargo", "Cargo"); }},
    {k:"telefone", t:"Telefone", render:function(v, l){ return campo(l.b, "telefone", "+55", true); }}, {k:"obs", t:"Observação", render:function(v, l){ return campo(l.b, "obs", "Observação"); }},
    {k:"rem", t:"Remover", render:function(v, l){ return e(BotaoRemover,{label:"Remover "+l.b.banco, onClick:function(){ if(window.confirm("Remover "+l.b.banco+"?")) acao(c, "banco_del", {id:l.b.id}); }}); }}];
  var linhas = lista.map(function(b){ return {id:b.id, b:b, banco:b.banco||"", contato:b.contato||"", cargo:b.cargo||"", telefone:b.telefone||"", obs:b.obs||"", rem:""}; });
  return e("div",{className:"flex flex-col gap-2"}, e(PageHead,{t:"Gerentes dos bancos", sub:"Contatos para pedir contrato, parcelas e saldo."}, e(Botao,{onClick:function(){ var n = window.prompt("Nome do banco:"); if(n && n.trim()) acao(c, "banco_add", {banco:n}); }}, "Novo banco")),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semMao:true, limite:100, vazio:"Nenhum banco cadastrado."}));
}
function AbaRhContrCredito(){
  return Dinheiros("CREDITO", "Crédito bancário", "Empréstimos e financiamentos. O PDF fica no Drive; aqui ficam os números e o link.", "Novo crédito", "Banco e tipo (ex.: Santander capital de giro):",
    function(c){ return [colTexto(c, "Banco", "nome", "Banco e tipo"), colTexto(c, "Número do contrato", "documento", "Número"), colTexto(c, "Empresa", "cnpj", "Empresa ou pessoa"), colValor(c, "Valor"), colDinExtra(c, "Parcela", "parcela"), colDinExtra(c, "Saldo devedor", "saldo"), colFim(c),
      K("Pronampe", function(ct){ return e(Sel,{value:extra(ct, "pronampe")||"", label:"Pronampe", cls:"min-w-[9rem]", onChange:function(v){ acao(c, "contr_extra", {id:ct.id, chave:"pronampe", valor:v}); }}, e("option",{value:""}, "A perguntar"), e("option",{value:"sim"}, "Sim"), e("option",{value:"nao"}, "Não"), e("option",{value:"analise"}, "Em análise")); }, function(ct){ return {sim:"Sim", nao:"Não", analise:"Em análise"}[extra(ct, "pronampe")] || "A perguntar"; }),
      colStatus(c)].concat(colArq(c), [colExtra(c, "Observação", "obs2", "Observação")]); }, Gerentes);
}
function AbaRhContrAluguel(){
  return Dinheiros("ALUGUEL", "Aluguéis", "Imóveis e salas. Avisa quando a vigência vence em até 30 dias. O total mensal conta só os ativos.", "Novo aluguel", "Imóvel ou sala:",
    function(c){ return [colTexto(c, "Imóvel", "nome", "Imóvel ou sala"), colTexto(c, "Locador", "documento", "Locador"), colTexto(c, "Empresa", "cnpj", "Empresa ou pessoa"), colValor(c, "Valor mensal", function(ct){ return ct.status==="ativo" ? (Number(ct.valor)||0) : 0; }), colExtra(c, "Reajuste (mês)", "reajuste", "Mês"), colFim(c), colStatus(c)].concat(colArq(c)); });
}
function AbaRhContrConsorcio(){
  return Dinheiros("CONSORCIO", "Consórcios", "Cotas de consórcio (Ademicon e outros). Marque quando a cota for contemplada.", "Novo consórcio", "Administradora e bem (ex.: Ademicon, celular do Marcus):",
    function(c){ return [colTexto(c, "Consórcio", "nome", "Administradora e bem"), colTexto(c, "Cota", "documento", "Número da cota"), colTexto(c, "Quem contratou", "cnpj", "Empresa ou pessoa"), colValor(c, "Valor da carta"), colDinExtra(c, "Parcela", "parcela"), colDinExtra(c, "Saldo a pagar", "saldo"), colFim(c), colStatus(c)].concat(colArq(c)); });
}

// ───────────────── Modelos de contrato (editor) ─────────────────
function Editor(p){
  var ref = useRef(null);
  useEffect(function(){ if(ref.current) ref.current.innerHTML = p.inicial||""; }, [p.chave]);   // eslint-disable-line react-hooks/exhaustive-deps
  var cmd = function(c, v){ return function(ev){ ev.preventDefault(); if(ref.current) ref.current.focus(); document.execCommand(c, false, v); }; };
  var bt = function(rot, titulo, fn, cls){ return e("button",{key:rot, type:"button", title:titulo, "aria-label":titulo, onMouseDown:fn, className:"h-8 min-w-8 rounded-md border border-border bg-card px-2 text-[13px] font-bold hover:bg-white/10 "+(cls||"")}, rot); };
  var inserir = function(k){ if(!k) return; if(ref.current) ref.current.focus(); document.execCommand("insertHTML", false, "<span data-variable-key=\""+k+"\" contenteditable=\"false\" style=\"background:#fde68a;color:#78350f;border-radius:4px;padding:0 4px;font-family:monospace\">{{"+k+"}}</span>&nbsp;"); };
  p.refExterno.current = function(){ return ref.current ? ref.current.innerHTML : ""; };
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-wrap items-center gap-2"}, bt("N","Negrito", cmd("bold"), "font-black"), bt("I","Itálico", cmd("italic"), "italic"), bt("S","Sublinhado", cmd("underline"), "underline"),
      bt("T1","Título grande", cmd("formatBlock","h1")), bt("T2","Título médio", cmd("formatBlock","h2")), bt("T3","Título pequeno", cmd("formatBlock","h3")), bt("Texto","Parágrafo normal", cmd("formatBlock","p")),
      bt("Esq.","Alinhar à esquerda", cmd("justifyLeft")), bt("Centro","Centralizar", cmd("justifyCenter")), bt("Justif.","Justificar", cmd("justifyFull")), bt("Lista","Lista com marcadores", cmd("insertUnorderedList")), bt("1. 2. 3.","Lista numerada", cmd("insertOrderedList")), bt("Desfazer","Desfazer", cmd("undo")), bt("Refazer","Refazer", cmd("redo")),
      e("select",{value:"", "aria-label":"Inserir variável no texto", className:CAMPO+" w-56 cursor-pointer", onChange:function(ev){ inserir(ev.target.value); ev.target.value = ""; }}, e("option",{value:""}, p.variaveis.length ? "Inserir variável no texto" : "Crie uma variável abaixo"), p.variaveis.map(function(v){ return e("option",{key:v.key, value:v.key}, v.label); }))),
    e("div",{ref:ref, contentEditable:true, suppressContentEditableWarning:true, className:"contrato-doc min-h-[22rem] rounded-xl bg-white p-6 text-[13px] leading-relaxed text-black outline-none ring-2 ring-primary/40 focus:ring-primary"}));
}
function AbaRhContrModelos(){
  var c = useRh(), rh = c.rh, ed = useState(null), edit = ed[0], setEdit = ed[1], gm = useState(null), gerar = gm[0], setGerar = gm[1], vs = useState([]), vars = vs[0], setVars = vs[1], nv = useState(""), novaVar = nv[0], setNovaVar = nv[1], lb = useState(""), nome = lb[0], setNome = lb[1], tp = useState("TERCEIRO"), tipo = tp[0], setTipo = tp[1];
  var lerHtml = useRef(null);
  var abrir = function(m){ setEdit(m ? m.id : "novo"); setNome(m ? m.nome : ""); setTipo(m ? m.tipo : "TERCEIRO"); setVars(m ? m.variaveis : []); setNovaVar(""); };
  var addVar = function(){ var label = novaVar.trim(), key = slugKey(label); if(!label || !key || vars.some(function(v){ return v.key===key; })) return; setVars(vars.concat([{key:key, label:label}])); setNovaVar(""); };
  var salvar = function(){ var html = lerHtml.current ? lerHtml.current() : ""; acao(c, "modelo_save", {id:edit==="novo" ? null : edit, tipo:tipo, nome:nome, conteudo:html, variaveis:vars}); setEdit(null); };
  var modelo = edit && edit!=="novo" ? rh.modelos.find(function(m){ return m.id===edit; }) : null;
  if(edit){
    var colsVar = [{k:"label", t:"Variável"}, {k:"cod", t:"Código no texto"}, {k:"rem", t:"Remover", render:function(v, l){ return e(BotaoRemover,{label:"Remover variável "+l.label, onClick:function(){ setVars(vars.filter(function(x){ return x.key!==l.id; })); }}); }}];
    return e("div",{className:"flex flex-col gap-2"},
      e(PageHead,{t:edit==="novo" ? "Novo modelo de contrato" : "Editar modelo", sub:"Marque o que muda de pessoa para pessoa como variável (aparece em amarelo)."}, e(Botao,{onClick:function(){ setEdit(null); }}, "Cancelar"), e(Botao,{principal:true, desabilitado:!nome.trim(), onClick:salvar}, "Salvar modelo")),
      e("div",{className:"grid grid-cols-1 items-end gap-2 md:grid-cols-[1fr_16rem]"}, e(CampoLinha,{t:"Nome do modelo", id:"mod-nome"}, e(Entrada,{id:"mod-nome", value:nome, ph:"Ex.: Prestação de serviço PJ", onChange:setNome})), e(CampoSel,{t:"Para qual tipo de contrato", id:"mod-tipo", value:tipo, onChange:setTipo, opcoes:Object.keys(TIPOS_CONTRATO).map(function(k){ return [k, TIPOS_CONTRATO[k]]; })})),
      e(Editor,{chave:edit, inicial:modelo ? modelo.conteudo : "", variaveis:vars, refExterno:lerHtml}),
      e("div",{className:"flex items-end gap-2"}, e(CampoLinha,{t:"Nova variável", id:"mod-var", cls:"w-72"}, e(Entrada,{id:"mod-var", value:novaVar, ph:"Ex.: Nome do contratado", onChange:setNovaVar})), e(Botao,{onClick:addVar}, "Adicionar variável")),
      vars.length>0 && e(TabelaPlanilha,{cols:colsVar, linhas:vars.map(function(v){ return {id:v.key, label:v.label, cod:"{{"+v.key+"}}", rem:""}; }), chave:"id", escura:true, grade:true, semMao:true, semContagem:true, semLimpar:true, vazio:"Nenhuma variável."}),
      e("style",null, ESTILO_DOC));
  }
  var cols = [{k:"nome", t:"Modelo"}, {k:"tipo", t:"Tipo de contrato"}, {k:"vars", t:"Variáveis"}, {k:"em", t:"Alterado em"}, {k:"por", t:"Alterado por"},
    {k:"acoes", t:"Ações", render:function(v, l){ var m = l.m; return e("span",{className:"inline-flex gap-2"}, e(Botao,{onClick:function(){ setGerar(m); }}, "Gerar contrato"), e(Botao,{onClick:function(){ abrir(m); }}, "Editar"), e(Botao,{onClick:function(){ if(window.confirm("Excluir o modelo \""+m.nome+"\"?")) acao(c, "modelo_del", {id:m.id}); }}, "Excluir")); }}];
  var linhas = rh.modelos.map(function(m){ return {id:m.id, m:m, nome:m.nome, tipo:TIPOS_CONTRATO[m.tipo]||m.tipo, vars:m.variaveis.length, em:m.atualizadoEm ? new Date(m.atualizadoEm).toLocaleDateString("pt-BR") : "", por:m.por||"", acoes:""}; });
  return e("div",{className:"flex flex-col gap-2"},
    e(PageHead,{t:"Modelos de contrato", sub:"Textos prontos com variáveis. Em cada lista, Gerar de modelo preenche e baixa o arquivo do Word."}, e(Botao,{principal:true, onClick:function(){ abrir(null); }}, "Novo modelo")),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semMao:true, limite:100, vazio:"Nenhum modelo cadastrado."}),
    gerar && e(Gerar,{c:c, tipo:gerar.tipo, modeloId:gerar.id, fechar:function(){ setGerar(null); }}),
    e("style",null, ESTILO_DOC));
}

export { AbaRhContrRep, AbaRhContrFunc, AbaRhContrTerc, AbaRhContrMarcus, AbaRhContrCredito, AbaRhContrAluguel, AbaRhContrConsorcio, AbaRhContrModelos };
