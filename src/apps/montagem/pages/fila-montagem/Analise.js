// Sorelly Admin · montagem — pages/fila-montagem/Analise.js
// Botão "Análise geral" da Fila de montagem (era o diálogo de análise do admin antigo): números das preferências de TODAS as revendedoras,
// calculados pelo próprio app e lidos agora (GET /api/montagem/analise). Sem valores em dinheiro: a montadora também vê.
import { Janela } from "@/apps/montagem/components/padrao";
import { Aviso, Bloco, Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { dataHoraBR, pct, useServidor } from "@/apps/montagem/pages/fila-montagem/comum";
import { e } from "@/shared/react";

var n0 = function(v){ return v==null ? "" : Number(v).toLocaleString("pt-BR", {maximumFractionDigits:1}); };
var ROT_TIPO = {slider:"Preferências", id:"Cores", filhos:"Composições", vend:"Disponibilidade", vendsimple:"Disponibilidade", vendmetal:"Variações", letras:"Letras", observacoes:"Observações"};

function AnaliseGeral(p){
  var a = useServidor("/montagem/analise"), d = a.dados, m = d && (d.resumoGeral || [])[0];
  var resumo = d ? [
    {i:"Revendedoras", v:n0(d.totalRevendedoras)}, {i:"Com preferências", v:n0(d.totalComPreferencias)}, {i:"Sem preferências", v:n0(d.totalSemPreferencias)},
    {i:"Taxa de preenchimento", v:pct(d.taxaPreenchimento)}, {i:"Categorias respondidas", v:n0(d.totalCategoriasRespondidas)}, {i:"Média por revendedora", v:n0(d.mediaCategoriasPorRevendedora)},
    {i:"Ouro (geral)", v:m ? pct(m.ouro) : "Sem resposta"}, {i:"Prata (geral)", v:m ? pct(m.prata) : "Sem resposta"}, {i:"Atualizado em", v:dataHoraBR(d.ultimaAtualizacao)}] : [];
  var cats = d ? (d.categoriasMaisRespondidas || []).map(function(c){ var x = (c.resumoGeral || [])[0];
    return {cat:c.title || c.key, tipo:ROT_TIPO[c.type] || "", total:c.total || 0, ouro:x ? x.ouro : null, prata:x ? x.prata : null}; }) : [];
  var corpo = a.erro ? e(Aviso,{tom:"vermelho"}, "Não foi possível carregar a análise: "+a.erro)
    : !d ? e("p",{className:"py-2 text-center text-[13px]"}, "Lendo a análise do app…")
    : e("div",{className:"flex flex-col gap-2.5"},
        d.configSync===false && e(Aviso,null, "A configuração do kit não respondeu: os números podem incluir blocos já removidos."),
        e("div",{className:"grid gap-2.5 lg:grid-cols-2"},
          e(Bloco,{t:"Resumo"}, e(TabelaPlanilha,{semContagem:true, semLimpar:true, cols:[{k:"i", t:"Indicador"}, {k:"v", t:"Valor"}], linhas:resumo})),
          e(Bloco,{t:"Preferência de metal por categoria"}, e(TabelaPlanilha,{semContagem:true,
            cols:[{k:"cat", t:"Categoria"}, {k:"tipo", t:"Tipo"}, {k:"total", t:"Respostas", fmt:n0}, {k:"ouro", t:"Ouro", fmt:pct}, {k:"prata", t:"Prata", fmt:pct}],
            linhas:cats, vazio:"Nenhuma categoria respondida."}))));
  return e(Janela,{t:"Análise geral", sub:"Preferências do kit de todas as revendedoras do app", fechar:p.fechar,
    colunas:[e("div",{key:"c", className:"col-span-full"}, corpo)],
    rodape:[e(Botao,{key:"a", onClick:a.recarregar, desabilitado:a.carregando}, "Atualizar análise"), e(Botao,{key:"f", principal:true, onClick:p.fechar}, "Fechar")]});
}

export { AnaliseGeral };
