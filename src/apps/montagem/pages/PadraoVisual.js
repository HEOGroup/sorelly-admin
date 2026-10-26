// Sorelly Admin · montagem — pages/PadraoVisual.js
// Tecnologia → Padrão visual. Duas visões (abas): "Prompt para novos sistemas" (UM botão copia o texto completo) e "Padrão visual" (as peças ao vivo: cores, degradês, indicadores, tabela, kanban, janela).
// O texto do prompt vem dos arquivos de docs/: docs/prompts/PROMPT-MESTRE.md (prompt geral de criação de sistemas) + docs/design/PADRAO-VISUAL.md (anexo com as regras e as peças).
import { BARRAS } from "@/apps/montagem/components/equipe-blocos";
import { Abas, BarraFiltros, ESTADO, Faixa, Indicador, Janela, LINHA, Mosaico, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import { Kanban } from "@/shared/kanban";
import PROMPT_MESTRE from "../../../../docs/prompts/PROMPT-MESTRE.md?raw";
import PADRAO_MD from "../../../../docs/design/PADRAO-VISUAL.md?raw";

// O mega texto: prompt geral + anexo com o padrão visual completo (tudo o que está escrito aqui, num clique)
var TEXTO_COMPLETO = PROMPT_MESTRE.trim() + "\n\n════════════════════════════════════════\nANEXO · PADRAO-VISUAL.md (regras e peças do padrão visual, texto integral)\n════════════════════════════════════════\n" + PADRAO_MD.trim() + "\n";

function copiarTexto(txt){ try{ navigator.clipboard.writeText(txt); return true; }catch(x){ window.prompt("Copie o texto:", txt); return false; } }

// Seção simples (barra de título em degradê, sem abrir e fechar)
function Secao(p){
  return e("section",{className:"overflow-hidden rounded-xl bg-card ring-1 ring-white/15"},
    e("div",{className:"flex flex-col items-center px-3 py-1.5 text-center "+BARRAS[p.cor||"azul"]}, e("h2",{className:"font-heading text-[14px] font-bold leading-tight"}, p.t), p.sub && e("p",{className:"text-[11.5px] opacity-85"}, p.sub)),
    e("div",{className:"p-3"}, p.children));
}

function VisaoPrompt(){
  var st = useState(false), ok = st[0];
  var copiar = function(){ copiarTexto(TEXTO_COMPLETO); st[1](true); setTimeout(function(){ st[1](false); }, 2500); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-col items-center gap-2 rounded-xl p-4 text-center ring-1 ring-[#E8B84B]/40", style:{background:"linear-gradient(135deg,#E8B84B33,#E8B84B0d 78%)"}},
      e("h2",{className:"font-heading text-[16px] font-bold"}, "Prompt geral para criação de novos sistemas"),
      e("p",{className:"max-w-2xl text-[13px] text-white/80"}, "Um único botão copia o texto completo: papel, empresa, tecnologia, identidade visual, as 22 regras de tela, padrões de negócio, critérios de aceite e o anexo com o padrão visual. Cole no início da conversa e descreva o que deseja criar no último item."),
      e("button",{type:"button", onClick:copiar, className:"rounded-lg bg-linear-to-br from-[#E8B84B] to-[#B8862B] px-8 py-2.5 text-[14px] font-bold text-[#1B1409]"}, ok ? "✓ Copiado" : "Copiar prompt completo"),
      e("span",{className:"font-mono text-[11.5px] text-white/60"}, TEXTO_COMPLETO.split("\n").length+" linhas · "+Math.round(TEXTO_COMPLETO.length/1000)+" mil caracteres")),
    e("pre",{"data-sem-arrastar":true, className:"select-text whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-left text-[12px] leading-snug text-white/85 ring-1 ring-white/10"}, TEXTO_COMPLETO));
}

var CORES_ESTADO = {ok:"Concluído ou pago", alerta:"Atenção ou vencendo", ruim:"Atrasado ou erro", info:"Informativo", neutro:"Neutro ou cancelado", total:"Total", cian:"Complementar"};
var NOMES_CORES = {ouro:"Ouro", azul:"Azul", roxo:"Roxo", prata:"Prata", vermelho:"Vermelho", verde:"Verde", laranja:"Laranja", rosa:"Rosa", turquesa:"Turquesa"};

function VisaoPadrao(){
  var sj = useState(false), janela = sj[0];
  return e(Pagina,null,
    e(Secao,{t:"Indicadores", sub:"Números que sobem até o valor, com degradê claro"}, e(Faixa,{n:4}, e(Indicador,{t:"A pagar", v:"R$ 12.500,00", cor:"total"}), e(Indicador,{t:"Pago", v:"R$ 8.000,00", cor:"ok"}), e(Indicador,{t:"Falta", v:"R$ 4.500,00", cor:"ruim", sub:"Vence em 5 dias"}), e(Indicador,{t:"Atenção", v:"12", cor:"alerta"}))),
    e(Secao,{t:"Abas e barra de filtros", sub:"Visões na mesma tela e filtros alinhados"}, e("div",{className:"flex flex-col gap-2"},
      e(Abas,{abas:[["a","Primeira visão"],["b","Segunda visão"],["c","Terceira visão"]], atual:"a", onMudar:function(){}, cor:"#3B82F6"}),
      e(BarraFiltros,{ativo:true, onLimpar:function(){}}, e("input",{placeholder:"Buscar…", className:"h-9 w-48 rounded-lg bg-black/30 px-3 text-[13px] ring-1 ring-white/15"}), e("select",{className:"h-9 rounded-lg bg-black/30 px-2 text-[13px] ring-1 ring-white/15"}, e("option",null,"Todas as etapas")), e("select",{className:"h-9 rounded-lg bg-black/30 px-2 text-[13px] ring-1 ring-white/15"}, e("option",null,"Este mês"))))),
    e(Secao,{t:"Tabela padrão", sub:"Tudo centralizado"}, e(Tab,{cols:["Nome","Situação","Valor"]},
      e("tr",{className:LINHA}, e(Td,{forte:true}, "Exemplo"), e(Td,{cor:"ok"}, "Pago"), e(Td,{dinheiro:true}, "R$ 1.000,00")),
      e("tr",{className:LINHA}, e(Td,{forte:true}, "Outro"), e(Td,{cor:"ruim"}, "Atrasado"), e(Td,{dinheiro:true}, "R$ 250,00")))),
    e(Secao,{t:"Kanban", sub:"Cartões que se arrastam entre as etapas"}, e(Kanban,{colunas:[
        {k:"a", titulo:"Solicitada", cor:"#FBBF24", itens:[{id:1, nome:"Cadeiras de escritório"}, {id:2, nome:"Etiquetas"}]},
        {k:"b", titulo:"Aprovada", cor:"#60A5FA", itens:[{id:3, nome:"Embalagens"}]},
        {k:"c", titulo:"Recebida", cor:"#4ADE80", itens:[]}],
      card:function(it){ return e("b",{className:"text-[13px]"}, it.nome); }, onMover:function(){}, unidade:["Cartão","Cartões"], vazio:"Nenhum cartão nesta etapa."})),
    e(Secao,{t:"Janela em colunas", sub:"Detalhe, edição e cadastro lado a lado"}, e("div",{className:"flex justify-center"},
      e("button",{type:"button", onClick:function(){ sj[1](true); }, className:"rounded-lg bg-[#3B82F6]/30 px-5 py-2 text-[13px] font-bold ring-1 ring-[#3B82F6]/70"}, "Abrir exemplo"))),
    janela && e(Janela,{t:"Detalhe do registro", sub:"Dados, etapas e ações em colunas", fechar:function(){ sj[1](false); }, colunas:[
      e("div",{key:"1",className:"rounded-xl bg-black/25 p-3 text-center"}, e("b",null,"Dados"), e("p",{className:"mt-1 text-[12.5px] text-white/70"},"Informações do registro.")),
      e("div",{key:"2",className:"rounded-xl bg-black/25 p-3 text-center"}, e("b",null,"Etapas"), e("p",{className:"mt-1 text-[12.5px] text-white/70"},"O que já foi preenchido passa para o lado.")),
      e("div",{key:"3",className:"rounded-xl bg-black/25 p-3 text-center"}, e("b",null,"Ações"), e("p",{className:"mt-1 text-[12.5px] text-white/70"},"Botões permitidos ao usuário."))]}),
    e(Secao,{t:"Mosaico", sub:"Blocos de alturas diferentes se encaixam sem buraco"}, e(Mosaico,{min:"14rem"}, ["Curto","Médio\nMédio\nMédio","Longo\nLongo\nLongo\nLongo\nLongo","Curto","Médio\nMédio\nMédio"].map(function(t, i){ return e("div",{key:i, className:"whitespace-pre-line rounded-lg bg-black/30 p-3 text-center text-[12px] ring-1 ring-white/10"}, t); }))),
    e(Secao,{t:"Cores das barras", sub:"Uma cor por setor", cor:"ouro"}, e("div",{className:"flex flex-wrap justify-center gap-2"},
      Object.keys(BARRAS).map(function(k){ return e("span",{key:k, className:"rounded-lg px-4 py-1.5 text-[12px] font-bold "+BARRAS[k]}, NOMES_CORES[k]||k); }))),
    e(Secao,{t:"Cores de estado", sub:"Somente para dizer como está", cor:"ouro"}, e("div",{className:"flex flex-wrap justify-center gap-2"},
      Object.keys(CORES_ESTADO).map(function(k){ var c = ESTADO[k]; return e("span",{key:k, className:"rounded-lg px-3 py-1.5 text-[12px] font-bold", style:{color:c, background:"linear-gradient(135deg,"+c+"38,"+c+"0d 78%)", boxShadow:"inset 0 0 0 1px "+c+"44"}}, CORES_ESTADO[k]); }))));
}

function AbaPadraoVisual(){
  var st = useState("prompt"), aba = st[0];
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Padrão visual", sub:"Prompt para criar novos sistemas e as peças do padrão da Sorelly."}),
    e(Abas,{abas:[["prompt","Prompt para novos sistemas"],["visual","Padrão visual"]], atual:aba, onMudar:st[1], cor:"#0EA5E9"}),
    aba==="prompt" ? e(VisaoPrompt,null) : e(VisaoPadrao,null));
}
export { AbaPadraoVisual };
