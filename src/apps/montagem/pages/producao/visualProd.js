// Sorelly Admin · montagem — pages/producao/visualProd.js
// Peças das telas do setor Produção, refeitas em 16/11/2026 no padrão do Financeiro (o mesmo de Contas bancárias e Contas a pagar):
// UM bloco com barra azul de título, uma faixa azul de controles no alto e a tabela (TabelaPlanilha) encostada nas bordas. Sem faixa de totais e sem bloco de filtros.
// Regras de negócio NÃO ficam aqui (estão em domain/producao.js).
//   usePr()      estado s.pr, quem está logado, se é diretoria e exec(op, dados) → true se o domínio aceitou
//   Raiz         casca da tela (mesma margem negativa e mesmas cores de linha das telas do Financeiro)
//   FaixaAzul    faixa de controles dentro do bloco; grupoBtn = botões juntos numa caixa; BtFaixa = botão da faixa; CAMPO_FAIXA = campo da faixa
//   Aviso        linha formal para quem não tem acesso
import { Pagina } from "@/apps/montagem/components/padrao";
import { PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { formatarInteiro, prMigrar, prReduz } from "@/apps/montagem/domain/producao";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";
import React from "react";

var COR = "#14B8A6";
var VAZIO_PR = null;

// estado, permissão e execução de ações do módulo
function usePr(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var admin = DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===29;
  var envia = !admin && temAutorizacao("producao_envio", s.usuario);   // preenche só a tela Envio e devolução (Crisbele, Deysiane...): não é só consulta e não vê o resto da produção externa
  var leitura = !admin && !envia && (temAutorizacao("producao_ver", s.usuario) || temAutorizacao("producao_externa", s.usuario));   // só consulta de Premiação e Configurações (Maria Claudia, 12/11/2026): vê, mas não grava
  if(!s.pr && !VAZIO_PR) VAZIO_PR = prMigrar(null);
  var exec = function(op, dados){ if(leitura) return false; var a = Object.assign({type:"PR", op:op, por:por, admin:admin}, dados||{}); var r = prReduz(s, a); d(a); return !!(r.patch && r.patch.pr); };
  return {s:s, pr:s.pr || VAZIO_PR, por:por, admin:admin, envia:envia, leitura:leitura, exec:exec};
}

// casca da tela: mesma de Contas a pagar (sem a margem do topo da página, cores de linha do padrão)
// VISUAL PLANO (Marcus, 22/11/2026: "as telas do financeiro tipo Negociações... as cores de fundo, as linhas brancas grossas; faz todas as telas da produção nesse formato, compacto"):
// blocos colados (sem espaço preto), fundo azul, faixa branca de 3 px entre um bloco e o outro e no fim, borda de 4 px dos lados, cabeçalho de coluna azul claro, célula com margem mínima.
// A divisão é feita AQUI (Raiz e casca): as telas só entregam os blocos, uma atrás da outra.
var PLANA = PADRAO_BLOCOS+" flex min-w-0 flex-col gap-0 [&_section]:!rounded-none [&_section]:!border-x-[4px] [&_section]:!border-y-0 [&_section]:!bg-[var(--bloco-colunas)] [&_tbody_td]:!bg-[var(--bloco-colunas)] [&_tfoot_td]:!bg-[var(--bloco-titulo)] [&_tbody_td]:!border-white/45 [&_td]:!px-0.5 [&_thead_th]:!bg-[#3b6bb5] [&_table]:border [&_table]:border-white/70";   // padrao-ok: igual Negociações (Marcus, 22/11/2026)
var plana = function(filhos, comFim){
  var lista = [], achatar = function(f){ if(Array.isArray(f)) f.forEach(achatar); else if(f) lista.push(f); };
  achatar(filhos);
  var saida = [];
  lista.forEach(function(f, i){ if(i) saida.push(e("div",{key:"sep"+i, className:"h-[3px] bg-white"})); saida.push(e("div",{key:"b"+i, className:"contents"}, f)); });
  if(comFim && lista.length) saida.push(e("div",{key:"sepfim", className:"h-[3px] bg-white"}));
  return saida;
};
// p.cls: classes extras só desta tela (ex.: letra menor na Produção externa)
// letra pequena e linhas de 18 px (igual à Home do Financeiro familiar e à Negociações; Marcus, 22/11/2026): só dentro dos blocos (section); a janela de lançar fica como está
var MIUDA = "[&_section_td]:!text-[10px] [&_section_td_*]:!text-[10px] [&_section_th]:!text-[10px] [&_section_th_*]:!text-[10px] [&_section_label]:!text-[10px] [&_section_select]:!text-[10px] [&_section_select]:!h-5 [&_section_input]:!text-[10px] [&_section_input]:!h-5 [&_section_button]:!text-[10px] [&_section_button]:!h-5 [&_section_button]:!py-0 [&_section_tbody_td]:!h-[22px] [&_section_tfoot_td]:!h-[24px] [&_section_td]:!leading-none [&_section_tbody_td_button]:!h-[22px] [&_section_td_span]:!leading-none";   // padrao-ok: letra de 10 px e linha de 22 px (Marcus, 22/11/2026; subiu de 18 para 22 px em 24/11/2026: "um pouquinho mais alta")
function Raiz(p){ return e(Pagina,{className:"-mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"}, e("div",{className:PLANA+(p.cls ? " "+p.cls : "")}, plana(p.children, true))); }

// semRaiz: a tela vai DENTRO de outra (Produção externa e Cadastro juntam duas telas numa só, 16/11/2026): só uma coluna de blocos, sem a margem da casca
function casca(semRaiz){ var f = Array.prototype.slice.call(arguments, 1); return semRaiz ? e("div",{className:"flex min-w-0 flex-col gap-0"}, plana(f, false)) : e.apply(null, [Raiz, null].concat(f)); }

// faixa azul de controles (fica logo abaixo da barra de título do bloco)
function FaixaAzul(p){
  return e("div",{className:"flex flex-wrap items-center gap-x-1.5 gap-y-1 border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 [&_label]:!text-white [&_label]:!text-[11px]"}, p.children);
}
// MENU SUSPENSO no lugar dos botões lado a lado (Marcus, 18/11/2026: "tudo com menu suspenso, não é para ter aquele negócio que clica do lado"): ops = [[chave, texto], ...]
var grupoBtn = function(ops, atual, aoMudar){
  return e("select",{value:atual, "aria-label":"Escolher", onChange:function(ev){ aoMudar(ev.target.value); }, className:CAMPO_FAIXA+" min-w-[6.5rem] cursor-pointer"}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }));
};
// botão avulso da faixa azul
function BtFaixa(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:"h-[30px] whitespace-nowrap rounded-md border border-white/60 bg-white/10 px-2.5 text-[11px] font-semibold text-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-40 "+(p.className||"")}, p.children);
}
// campo (texto, número, data, mês) e lista da faixa azul
// 18/11/2026 (Marcus: "os filtros mais claros, mais junto sem encostar e menores"): fundo claro (branco a 20% sobre o azul), 30 px de altura e letra de 11 px
var CAMPO_FAIXA = "h-[30px] rounded-md border border-white/60 bg-white/20 px-2 text-center text-[11px] font-semibold text-white [color-scheme:dark] placeholder:text-white/70";

// MENU SUSPENSO DA FAIXA com o fundo da própria tela (Marcus, 24/11/2026: "não quero fundo preto, padroniza com a tela"): o <select> nativo e o calendário nativo abrem pretos e não dá para pintar;
// este abre uma lista com o azul dos blocos. grupos = [{t:"Título do grupo", itens:[[chave, texto], ...]}]; valor = chave marcada; larg = largura do campo
function MenuFaixa(p){
  var st = React.useState(false), aberto = st[0], setAberto = st[1], ref = React.useRef(null), pos = React.useState(null), posicao = pos[0], setPosicao = pos[1];
  React.useEffect(function(){
    if(!aberto) return undefined;
    var fora = function(ev){ if(ref.current && !ref.current.contains(ev.target)) setAberto(false); };
    var fecha = function(){ setAberto(false); };
    document.addEventListener("mousedown", fora); window.addEventListener("resize", fecha);
    return function(){ document.removeEventListener("mousedown", fora); window.removeEventListener("resize", fecha); };
  }, [aberto]);
  // a lista abre em posição fixa, para o bloco (overflow escondido) não cortar
  var alterna = function(){ if(!aberto && ref.current){ var r = ref.current.getBoundingClientRect(); setPosicao({left:r.left, top:r.bottom+4, minWidth:r.width}); } setAberto(!aberto); };
  var rotulo = ""; p.grupos.forEach(function(g){ g.itens.forEach(function(o){ if(o[0]===p.valor) rotulo = o[1]; }); });
  return e("div",{ref:ref, className:"relative"},
    e("button",{type:"button", "aria-label":p.aria, "aria-expanded":aberto, onClick:alterna, className:CAMPO_FAIXA+" flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap "+(p.larg || "w-48")}, e("span",null, rotulo), e("span",{"aria-hidden":"true"}, aberto ? "▴" : "▾")),
    aberto && e("div",{style:posicao, className:"fixed z-50 max-h-72 overflow-y-auto rounded-md border border-white/60 bg-[var(--bloco-colunas)] p-1 shadow-lg"},
      p.grupos.map(function(g){ return e("div",{key:g.t},
        g.t && e("div",{className:"px-2 pb-0.5 pt-1.5 text-[11px] font-semibold text-white/70"}, g.t),   // padrao-ok: título do grupo de 11 px
        g.itens.map(function(o){ var on = o[0]===p.valor;
          return e("button",{key:o[0], type:"button", onClick:function(){ p.onChange(o[0]); setAberto(false); }, className:"flex w-full items-center justify-center whitespace-nowrap rounded px-2 text-[11px] text-white hover:bg-white/15 "+(on ? "bg-white/25 font-semibold" : "")}, o[1]); })); })));
}

// linha formal para quem não tem acesso (sem dados)
function Aviso(p){
  return e("div",{className:"flex items-center justify-center px-4 py-8 text-center text-[13px] font-semibold"}, p.children || "Somente a diretoria acessa.");
}

// resumo curto "N pç"
var pc = function(n){ return formatarInteiro(n)+" pç"; };

// as visões da tela Premiação (Premiação e Configurações são uma tela só desde 16/11/2026): o ranking do mês e os três cadastros que alimentam o bônus
var VISOES_PREMIO = [["premio", "Premiação"], ["func", "Funcionárias"], ["cod", "Códigos e categorias"], ["faixa", "Faixas do bônus"]];

// VISUAL LIMPO das tabelas largas da Produção (Marcus, 16/11/2026: "melhora esse fundo, linhas branca com cinza, esses espaços"): UMA cor de linha (cinza suave, em vez de branco forte misturado com cinza),
// fundo igual em todas as células (a coluna do nome deixa de ter outro tom), total um tom acima e sem as barras brancas grossas que a coluna travada desenhava. Vai numa div em volta do bloco.
var GRADE_LIMPA = "";   // aposentado em 22/11/2026: o visual plano (PLANA, em Raiz) cuida das cores; fica vazio para não quebrar quem ainda importa

export { COR, MIUDA, GRADE_LIMPA, VISOES_PREMIO, usePr, Raiz, casca, FaixaAzul, grupoBtn, BtFaixa, CAMPO_FAIXA, MenuFaixa, Aviso, pc };
