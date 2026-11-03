// Sorelly Admin · montagem — pages/preferencias-kit/Importar.js
// Aba "Importar": cola tabela ou JSON, mostra a prévia do plano (criar, atualizar, erro por linha) e só então grava.
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { Pagina } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { formatarDataHora, pkModeloTabela, pkPlanejarImportacao } from "@/apps/montagem/domain/preferencias-kit";
import { Area, Bt, Chip, Selo, Vazio, usePk } from "@/apps/montagem/pages/preferencias-kit/visual";
import { e, useMemo, useState } from "@/shared/react";

var MAX_LINHAS = 50;
var ACAO = {criar:["Criar", "#4ADE80", "plus-circle"], atualizar:["Atualizar", "#60A5FA", "arrows-clockwise"], erro:["Erro", "#EF4444", "warning-circle"]};

function AbaPkImportar(){
  var ctx = usePk(), s = ctx.s, pk = ctx.pk;
  var st = useState({texto:"", modo:"mesclar", copiado:false, tudo:false}), v = st[0];
  var set = function(k, x){ var c = Object.assign({}, v); c[k] = x; st[1](c); };
  var plano = useMemo(function(){ return pkPlanejarImportacao(s, v.texto, {modo:v.modo}); }, [s.pk, v.texto, v.modo]);
  var validas = plano.resumo.criar+plano.resumo.atualizar;
  var temTexto = v.texto.trim().length>0;
  var copiar = function(){
    var t = pkModeloTabela(s);
    var ok = function(){ var c = Object.assign({}, v); c.copiado = true; st[1](c); setTimeout(function(){ st[1](function(a){ return Object.assign({}, a, {copiado:false}); }); }, 2200); };
    try { navigator.clipboard.writeText(t).then(ok, function(){ set("texto", t); }); } catch(x){ set("texto", t); }
  };
  var importar = function(){ pk("importar", {texto:v.texto, modo:v.modo}); st[1]({texto:"", modo:v.modo, copiado:false, tudo:false}); };
  var imps = (s.pk.importacoes||[]).slice().reverse();
  var linhas = v.tudo ? plano.linhas : plano.linhas.slice(0, MAX_LINHAS);
  return e(Pagina,null,
    e(BlocoResumo,{t:"Resumo da importação", cab:["Situação", "Revendedoras", ""], linhas:[
      {r:"A criar", v:String(plano.resumo.criar), p:"", cor:"ok"},
      {r:"A atualizar", v:String(plano.resumo.atualizar), p:""},
      {r:"Com erro", v:String(plano.resumo.erros), p:"", cor:plano.resumo.erros ? "ruim" : undefined}]}),
    e("div",{className:"grid items-start gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 22rem), 1fr))"}},
      e(BlocoBarra,{cor:"ouro", t:"Dados para importar", compacto:true}, e("div",{className:"flex flex-col gap-2 p-2.5"},
        e(Area,{v:v.texto, rot:"Tabela ou JSON", ph:"Cole aqui a tabela (com cabeçalho na primeira linha) ou o JSON.", rows:9, className:"font-mono text-[12px]!", set:function(x){ set("texto", x); }}),
        e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, e("span",{className:"text-[12px] font-bold text-white/75"}, "Respostas já existentes:"),
          e(Chip,{on:v.modo==="mesclar", onClick:function(){ set("modo", "mesclar"); }, titulo:"Mantém o que a revendedora já respondeu e acrescenta o novo"}, "Mesclar"),
          e(Chip,{on:v.modo==="substituir", onClick:function(){ set("modo", "substituir"); }, titulo:"Troca todas as respostas pelas da importação"}, "Substituir")),
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
          e(Bt,{ic:v.copiado ? "check" : "copy", onClick:copiar, titulo:"Copia as colunas conforme os blocos atuais do formulário"}, v.copiado ? "Modelo copiado" : "Modelo da tabela"),
          temTexto && e(Bt,{ic:"x-circle", onClick:function(){ set("texto", ""); }}, "Limpar"),
          e(Bt,{tipo:"forte", ic:"upload-simple", disabled:validas===0, onClick:importar}, validas ? "Importar "+validas+(validas===1 ? " linha" : " linhas") : "Importar")))),
      e(BlocoBarra,{cor:"ouro", t:"Prévia da importação", compacto:true}, e("div",{className:"flex flex-col gap-2 p-2.5"},
        !temTexto && e(Vazio,{ic:"file-arrow-up"}, "Cole os dados para ver a prévia."),
        plano.avisosGlobais.map(function(a, i){ return e("p",{key:i, className:"rounded-lg bg-[#FBBF24]/10 px-2 py-1 text-center text-[12px] text-[#FDE68A] ring-1 ring-[#FBBF24]/30"}, a); }),
        plano.linhas.length>0 && e(TabelaPlanilha,{key:"previa", centro:true, semContagem:true, chave:"indice", cols:[{k:"indice", t:"Linha"}, {k:"nome", t:"Nome"}, {k:"acaoTxt", t:"Ação", render:function(_, l){ var a = ACAO[l.acao]; return e(Selo,{cor:a[1], ic:a[2]}, a[0]); }}, {k:"notasTxt", t:"Observações"}],
          linhas:linhas.map(function(l){ var notas = l.erros.concat(l.avisos); return Object.assign({}, l, {nome:l.nome || "—", acaoTxt:ACAO[l.acao][0], notasTxt:notas.length ? notas.join(" ") : "—"}); })}),
        plano.linhas.length>MAX_LINHAS && e("button",{type:"button", onClick:function(){ set("tudo", !v.tudo); }, className:"mx-auto rounded-lg bg-white/10 px-3 py-1 text-[11.5px] font-bold hover:bg-white/20"}, v.tudo ? "Ver menos" : "Ver todas ("+plano.linhas.length+")"))),
      e(BlocoBarra,{cor:"ouro", t:"Histórico das importações", compacto:true}, e("div",{className:"flex flex-col gap-2 p-2.5"},
        imps.length===0 ? e(Vazio,{ic:"clock-counter-clockwise"}, "Nenhuma importação realizada.")
          : e(TabelaPlanilha,{key:"hist", centro:true, semContagem:true, chave:"id", cols:[{k:"quando", t:"Data"}, {k:"por", t:"Por"}, {k:"linhas", t:"Linhas"}, {k:"criadas", t:"Novas"}, {k:"atualizadas", t:"Atualizadas"}, {k:"erros", t:"Erros"}],
            linhas:imps.map(function(i){ return Object.assign({}, i, {quando:formatarDataHora(i.em)}); })})))));
}

export { AbaPkImportar };
