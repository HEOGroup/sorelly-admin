// Sorelly Admin · montagem — pages/rh/FormularioFunc.js
// RH › Colaboradores › Cadastro › "Formulário dos funcionários" (18/11/2026, pedido do Marcus): cada funcionária recebe um link próprio (/meus-dados/<código>) para preencher os dados pessoais.
// Aqui o RH gera os links, copia a mensagem de WhatsApp de cada pessoa, vê quem já enviou e CONFERE a resposta antes de aplicar no cadastro (a resposta nunca muda o cadastro sozinha).
// Servidor: src/server/ficha-func.js (rotas /api/meus-dados, restritas a diretoria e RH). Os campos são os mesmos da ficha (Contato e endereço, Mais dados pessoais, Documentos e Dados para receber).
import { Janela } from "@/apps/montagem/components/padrao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { br, colaboradoresRh } from "@/apps/montagem/domain/rh";
import { chamar } from "@/apps/montagem/lib/api";
import { e, useState } from "@/shared/react";
import React from "react";

// chave do formulário → rótulo (a mesma chave do cadastro da colaboradora)
var ROTULOS = [["telefone", "Telefone"], ["email", "E-mail"], ["cep", "CEP"], ["rua", "Rua"], ["numero", "Número"], ["complemento", "Complemento"], ["bairro", "Bairro"], ["cidade", "Cidade"], ["uf", "Estado"],
  ["emergNome", "Contato de emergência"], ["emergFone", "Telefone de emergência"], ["emergParentesco", "Parentesco"], ["nascimento", "Nascimento"], ["estadoCivil", "Estado civil"], ["escolaridade", "Escolaridade"], ["nomeMae", "Nome da mãe"], ["naturalidade", "Naturalidade"], ["dependentes", "Dependentes"],
  ["cpf", "CPF"], ["rg", "RG"], ["rgOrgao", "Órgão emissor do RG"], ["ctpsNumero", "CTPS número"], ["ctpsSerie", "CTPS série"], ["tituloEleitor", "Título de eleitor"], ["cnh", "CNH"], ["cnhCategoria", "CNH categoria"],
  ["banco", "Banco"], ["agencia", "Agência"], ["conta", "Conta"], ["tipoConta", "Tipo de conta"], ["pix", "Chave Pix"]];
var SIT = {sem:"Sem link", pendente:"Link gerado", enviada:"Enviou", aplicada:"Aplicada"};
var COR = {sem:"text-white/60", pendente:"", enviada:"text-amber-400", aplicada:"text-emerald-400"};
var valorTxt = function(k, v){ return v===undefined || v===null || v==="" ? "—" : (k==="nascimento" ? br(v) : String(v)); };

// mensagem de WhatsApp com o link próprio da pessoa (curta: oi + pedido de atualização cadastral + link)
export function mensagemFormulario(nome, link){
  return "Oi, "+String(nome||"").split(" ")[0]+"! Tudo bem? Estamos fazendo a atualização cadastral. Preencha seus dados por este link (é só seu, não compartilhe): "+link;
}
// mensagem para a Maria (RH) enviar o formulário a cada pessoa
export var MENSAGEM_MARIA = "Maria, segue a atualização cadastral dos funcionários. Para cada pessoa da lista: copie o telefone, copie a mensagem da mesma linha e envie no WhatsApp particular dela. Depois confira as respostas em Revisar.";
// telefone particular da funcionária (vem do Cadastro › Pessoal): só os números, com o 55 do Brasil na frente quando faltar; formato (41) 99999-0000 para ler
export function foneDigitos(v){ var d = String(v||"").replace(/\D/g, ""); if(d.length===10 || d.length===11) d = "55"+d; return d.length>=12 && d.length<=13 ? d : ""; }
export function foneTexto(v){ var d = foneDigitos(v).slice(2); if(!d) return String(v||"").trim(); return "("+d.slice(0, 2)+") "+(d.length===11 ? d.slice(2, 7)+"-"+d.slice(7) : d.slice(2, 6)+"-"+d.slice(6)); }
export function whatsappLink(fone, mensagem){ var d = foneDigitos(fone); return d ? "https://wa.me/"+d+"?text="+encodeURIComponent(mensagem) : ""; }
var linkDe = function(codigo){ return (typeof window!=="undefined" ? window.location.origin : "")+"/meus-dados/"+codigo; };

function Revisar(pp){
  var c = pp.c, f = pp.ficha, colab = colaboradoresRh(c.s).find(function(x){ return x.id===f.colab_id; }) || {}, dados = f.dados || {};
  var linhas = ROTULOS.filter(function(r){ return dados[r[0]]!==undefined; }).map(function(r){ var atual = colab[r[0]], novo = dados[r[0]]; var igual = String(atual||"")===String(novo||"");
    return {id:r[0], campo:r[1], atual:valorTxt(r[0], atual), enviado:valorTxt(r[0], novo), muda:igual ? "Igual" : (atual ? "Troca" : "Novo")}; });
  var aplicar = function(){ var patch = {}; Object.keys(dados).forEach(function(k){ patch[k] = dados[k]; });
    c.d({type:"RH", op:"colab_set", id:f.colab_id, patch:patch, por:c.por}); pp.aplicou(f.colab_id); };
  var corpo = e("div",{key:"c", className:"flex flex-col gap-2"}, e("span",{className:"text-[13px]"}, "Confira o que "+f.nome+" enviou. Ao aplicar, os campos abaixo são gravados no cadastro dela (os que estão como \"Igual\" não mudam nada)."),
    e(TabelaPlanilha,{cols:[{k:"campo", t:"Campo"}, {k:"atual", t:"No cadastro"}, {k:"enviado", t:"Enviado por ela"}, {k:"muda", t:"O que muda", cor:function(l){ return l.muda==="Troca" ? "text-amber-400" : l.muda==="Novo" ? "text-emerald-400" : "text-white/60"; }}],
      linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, semMao:true, limite:60, vazio:"Nada enviado."}));
  return e(Janela,{t:"Revisar · "+f.nome, sub:"Enviado em "+(f.enviada_em ? br(String(f.enviada_em).slice(0, 10)) : "—"), fechar:pp.fechar, colunas:[corpo],
    rodape:[e(Botao,{key:"c", onClick:pp.fechar}, "Fechar"), e(Botao,{key:"a", principal:true, desabilitado:!linhas.length || f.situacao==="aplicada", onClick:aplicar}, "Aplicar no cadastro")]});
}

function FormularioFuncJanela(pp){
  var c = pp.c, st = useState({fichas:null, erro:"", ocupado:false}), s = st[0], setS = st[1], cp = useState(""), copiado = cp[0], setCopiado = cp[1], rv = useState(""), revisando = rv[0], setRevisando = rv[1];
  React.useEffect(function(){ var falha = function(x){ setS({fichas:[], erro:String((x && x.message) || x || "Não consegui abrir."), ocupado:false}); };
    chamar("GET", "/meus-dados").then(function(r){ var tem = {}; (r.fichas || []).forEach(function(f){ tem[f.colab_id] = 1; });
      var falta = colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO" && !tem[x.id]; }).map(function(x){ return {id:x.id, nome:x.nome}; });
      if(!falta.length){ setS({fichas:r.fichas || [], erro:"", ocupado:false}); return; }
      return chamar("POST", "/meus-dados", {acao:"gerar", pessoas:falta}).then(function(g){ setS({fichas:g.fichas || [], erro:"", ocupado:false}); }); }).catch(falha); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var ativos = colaboradoresRh(c.s).filter(function(x){ return x.status!=="DESLIGADO"; }), por = {}; (s.fichas || []).forEach(function(f){ por[f.colab_id] = f; });
  var linhas = ativos.map(function(x){ var f = por[x.id], sit = !f ? "sem" : f.situacao; return {id:x.id, nome:x.nome, setor:x.setor, telefone:foneTexto(x.telefone), fone:x.telefone || "", sit:sit, situacao:SIT[sit] || sit, enviada:f && f.enviada_em ? br(String(f.enviada_em).slice(0, 10)) : "", acao:"", msg:f ? "Msg para funcionário" : "", texto:f ? mensagemFormulario(x.nome, linkDe(f.codigo)) : "", ficha:f}; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var aplicou = function(id){ chamar("POST", "/meus-dados", {acao:"aplicada", id:id}).then(function(r){ setS({fichas:r.fichas || [], erro:"", ocupado:false}); setRevisando(""); }, function(x){ setS(Object.assign({}, s, {erro:String((x && x.message) || x)})); setRevisando(""); }); };
  var copiarTxt = function(chave, tx, aviso){ (navigator.clipboard ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function(){ setCopiado(chave); setTimeout(function(){ setCopiado(""); }, 2000); }, function(){ window.prompt(aviso, tx); }); };
  var btnCopiar = function(chave, tx, aviso){ return e(Botao,{onClick:function(){ copiarTxt(chave, tx, aviso); }}, copiado===chave ? "✓" : "⧉"); };
  var cols = [{k:"nome", t:"Nome"}, {k:"setor", t:"Setor"},
    {k:"telefone", t:"Telefone", render:function(v, l){ return l.fone ? e("span",{className:"inline-flex items-center gap-2"}, e("span",null, v), btnCopiar("f"+l.id, v, "Copie o telefone:")) : e("span",{className:"text-amber-400"}, "Sem telefone"); }},
    {k:"situacao", t:"Situação", cor:function(l){ return COR[l.sit] || ""; }},
    {k:"msg", t:"Mensagem", render:function(v, l){ return l.ficha ? e("span",{className:"inline-flex items-center gap-2"}, e("span",null, v), btnCopiar("m"+l.id, l.texto, "Copie a mensagem:")) : e("span",null, "Gerando…"); }},
    {k:"acao", t:"Conferir", render:function(v, l){ return l.ficha && l.sit!=="pendente" ? e(Botao,{principal:l.sit==="enviada", onClick:function(){ setRevisando(l.id); }}, "Revisar") : e("span",null, "—"); }}];
  var ficha = revisando && por[revisando];
  var corpo = e("div",{key:"c", className:"flex flex-col gap-2"},
    e("div",{key:"m", className:"flex items-center gap-2"}, e("span",{className:"text-[13px]"}, "Msg para a Maria"), btnCopiar("maria", MENSAGEM_MARIA, "Copie a mensagem:")),
    s.erro && e("span",{className:"text-[13px] text-amber-400"}, s.erro),
    s.fichas===null ? e("span",{className:"text-[13px]"}, "Abrindo…") : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", escura:true, grade:true, semContagem:true, semLimpar:true, semMao:true, limite:100, vazio:"Nenhuma colaboradora ativa."}),
    e("span",{className:"text-[11px]"}, "O link só abre para as funcionárias depois que o sistema estiver publicado. Cada link vale para uma pessoa e some depois que o RH aplica a resposta. O telefone vem do cadastro: quem está sem telefone precisa ter o número preenchido antes."));
  return e("div",null, e(Janela,{t:"Formulário dos funcionários", sub:"Cada pessoa recebe um link próprio, preenche pelo celular e você confere antes de entrar no cadastro.", fechar:pp.fechar, colunas:[corpo],
      rodape:[e(Botao,{key:"f", onClick:pp.fechar}, "Fechar")]}),
    ficha && e(Revisar,{c:c, ficha:ficha, fechar:function(){ setRevisando(""); }, aplicou:aplicou}));
}

export { FormularioFuncJanela };
