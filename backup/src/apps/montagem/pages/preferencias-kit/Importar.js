// Sorelly Admin · montagem — pages/preferencias-kit/Importar.js
// Aba "Importar": cola tabela ou JSON, mostra a prévia do plano (criar, atualizar, erro por linha) e só então grava.
import { Faixa, Indicador, Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
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
    e(Faixa,{n:3}, e(Indicador,{t:"A criar", v:plano.resumo.criar, cor:"ok"}), e(Indicador,{t:"A atualizar", v:plano.resumo.atualizar, cor:"info"}), e(Indicador,{t:"Com erro", v:plano.resumo.erros, cor:plano.resumo.erros ? "ruim" : "neutro"})),
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
        plano.linhas.length>0 && e(Tab,{cols:["Linha", "Nome", "Ação", "Observações"]}, linhas.map(function(l){ var a = ACAO[l.acao], notas = l.erros.concat(l.avisos);
          return e("tr",{key:l.indice, className:LINHA}, e(Td,{dinheiro:true}, l.indice), e(Td,{forte:true, className:"max-w-40 truncate!"}, l.nome || "—"), e(Td,null, e(Selo,{cor:a[1], ic:a[2]}, a[0])),
            e(Td,{className:"min-w-48 max-w-72 whitespace-normal! text-[12px]!", cor:l.erros.length ? "ruim" : undefined}, notas.length ? notas.join(" ") : "—")); })),
        plano.linhas.length>MAX_LINHAS && e("button",{type:"button", onClick:function(){ set("tudo", !v.tudo); }, className:"mx-auto rounded-lg bg-white/10 px-3 py-1 text-[11.5px] font-bold hover:bg-white/20"}, v.tudo ? "Ver menos" : "Ver todas ("+plano.linhas.length+")"))),
      e(BlocoBarra,{cor:"ouro", t:"Histórico das importações", compacto:true}, e("div",{className:"flex flex-col gap-2 p-2.5"},
        imps.length===0 ? e(Vazio,{ic:"clock-counter-clockwise"}, "Nenhuma importação realizada.")
          : e(Tab,{cols:["Data", "Por", "Linhas", "Novas", "Atualizadas", "Erros"]}, imps.map(function(i){ return e("tr",{key:i.id, className:LINHA}, e(Td,null, formatarDataHora(i.em)), e(Td,null, i.por), e(Td,{dinheiro:true}, i.linhas), e(Td,{dinheiro:true, cor:"ok"}, i.criadas), e(Td,{dinheiro:true, cor:"info"}, i.atualizadas), e(Td,{dinheiro:true, cor:i.erros ? "ruim" : undefined}, i.erros)); }))))));
}

export { AbaPkImportar };
