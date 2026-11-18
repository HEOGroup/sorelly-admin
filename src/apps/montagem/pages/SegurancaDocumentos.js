// Sorelly Admin · montagem — pages/SegurancaDocumentos.js
// PGR e PCMSO por CNPJ (17/11/2026, pedido da Maria (RH) e do Marcus): aba só para os documentos de segurança, aberta a todos os colaboradores.
// Cada colaborador vê somente os documentos do CNPJ dele; RH e diretoria (autorização sg_gerir) veem os de todos os CNPJs e anexam, trocam e tiram.
// O arquivo vai para o servidor (/api/anexos, módulo sg) e o estado (s.sg) guarda só a chave. Regras em domain/seguranca-docs.js.
// Limite: a divisão por CNPJ é da tela; o servidor libera o módulo sg para todo colaborador logado.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { chaveDoc, cnpjDaPessoa, CNPJS_SG, empresaDe, NOME_TIPO, sgMigrar, TIPOS_SG } from "@/apps/montagem/domain/seguranca-docs";
import { abrirAnexo, enviarAnexo, lerArquivo } from "@/apps/montagem/lib/anexo";
import { ehAdmin } from "@/apps/montagem/lib/api";
import { Bt, Selo } from "@/apps/montagem/pages/compras/pecas";
import { use } from "@/apps/montagem/state/context";
import { e, useRef, useState } from "@/shared/react";

var dia = function(t){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t || ""); return m ? m[3]+"/"+m[2]+"/"+m[1] : "—"; };

function AbaSegurancaDocs(){
  var cx = use(), s = cx.state, d = cx.dispatch, g = sgMigrar(s.sg), uid = s.usuario, por = nomeDe(uid);
  var gere = ehAdmin() || temAutorizacao("sg_gerir", uid), meu = cnpjDaPessoa(uid), fileiro = useRef(null), alvo = useRef(null), env = useState(""), enviando = env[0];
  var aviso = function(t, tom){ d({type:"AVISO", txt:t, tom:tom || "alerta"}); };
  var acao = function(op, extra){ d(Object.assign({type:"SG", op:op, por:por, podeGerir:gere}, extra)); };

  var cnpjs = gere ? CNPJS_SG : (meu ? [meu] : []);
  var linhas = [];
  cnpjs.forEach(function(c){ TIPOS_SG.forEach(function(t){
    var emp = empresaDe(c), doc = g.docs[chaveDoc(c, t)];
    linhas.push({id:chaveDoc(c, t), c:c, t:t, empresa:emp.nome+" · CNPJ "+c, doc:t, nome:NOME_TIPO[t], arquivo:doc ? doc.nome : "Ainda não enviado", atualizado:doc ? dia(doc.em) : "—", situacao:doc ? "Disponível" : "Pendente", tem:!!doc, d:doc});
  }); });

  var anexar = function(ev){
    var arq = ev.target.files && ev.target.files[0], a = alvo.current; ev.target.value = ""; if(!arq || !a) return;
    env[1](a.c+"|"+a.t);
    lerArquivo(arq).then(function(x){ return enviarAnexo("sg", x); }).then(function(r){ acao("doc_set", {cnpj:a.c, tipo:a.t, anexo:r}); }).catch(function(er){ aviso(er && er.message || "Não consegui enviar o arquivo."); }).then(function(){ env[1](""); });
  };
  var cols = [{k:"empresa", t:"Empresa"}, {k:"doc", t:"Documento"}, {k:"nome", t:"Nome completo"}, {k:"arquivo", t:"Arquivo"}, {k:"atualizado", t:"Atualizado"},
    {k:"situacao", t:"Situação", render:function(v, l){ return e(Selo,{cor:l.tem ? "ok" : "alerta"}, v); }},
    {k:"abrir", t:"Abrir", render:function(v, l){ return l.tem ? e(Bt,{tipo:"forte", onClick:function(){ abrirAnexo(l.d.key).catch(function(er){ aviso(er && er.message || "Não consegui abrir o documento."); }); }}, "Abrir "+l.t) : e("span",{className:"text-[13px]"}, "—"); }}];
  if(gere) cols.push({k:"gerir", t:"RH e diretoria", render:function(v, l){
    return e("span",{className:"inline-flex gap-1.5"},
      e(Bt,{tipo:"normal", disabled:enviando===l.id, onClick:function(){ alvo.current = {c:l.c, t:l.t}; fileiro.current && fileiro.current.click(); }}, enviando===l.id ? "Enviando documento" : l.tem ? "Trocar documento" : "Anexar documento"),
      l.tem && e(Bt,{tipo:"perigo", onClick:function(){ acao("doc_del", {cnpj:l.c, tipo:l.t}); }}, "Tirar documento")); }});

  var topo = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    e("h2",{className:"shrink-0 whitespace-nowrap text-[13px] font-bold uppercase"}, "PGR e PCMSO"),
    e("span",{className:"ml-auto whitespace-nowrap text-[13px]"}, gere ? "Todos os CNPJs" : (meu ? "CNPJ "+meu+" · "+empresaDe(meu).nome : "")));

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    topo,
    cnpjs.length===0
      ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Seu CNPJ ainda não foi identificado. Fale com o RH para liberar os seus documentos.")
      : e(BlocoPainel,{titulo:"Documentos de segurança do trabalho", compacto:true},
          e("div",{className:"min-h-0 flex-1"}, e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:"Nenhum documento."}))),
    e("input",{ref:fileiro, type:"file", accept:"application/pdf,image/*", className:"hidden", onChange:anexar}));
}

export { AbaSegurancaDocs };
