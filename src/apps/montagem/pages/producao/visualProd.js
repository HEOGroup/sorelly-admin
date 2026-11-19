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

var COR = "#14B8A6";
var VAZIO_PR = null;

// estado, permissão e execução de ações do módulo
function usePr(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var admin = DIRETORIA.some(function(x){ return x.id===s.usuario; }) || s.usuario===29;
  var leitura = !admin && temAutorizacao("producao_ver", s.usuario);   // só consulta de Premiação e Configurações (Maria Claudia, 12/11/2026): vê, mas não grava
  if(!s.pr && !VAZIO_PR) VAZIO_PR = prMigrar(null);
  var exec = function(op, dados){ if(leitura) return false; var a = Object.assign({type:"PR", op:op, por:por, admin:admin}, dados||{}); var r = prReduz(s, a); d(a); return !!(r.patch && r.patch.pr); };
  return {s:s, pr:s.pr || VAZIO_PR, por:por, admin:admin, leitura:leitura, exec:exec};
}

// casca da tela: mesma de Contas a pagar (sem a margem do topo da página, cores de linha do padrão)
function Raiz(p){ return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"}, p.children); }

// semRaiz: a tela vai DENTRO de outra (Produção externa e Cadastro juntam duas telas numa só, 16/11/2026): só uma coluna de blocos, sem a margem da casca
function casca(semRaiz){ var f = Array.prototype.slice.call(arguments, 1); return semRaiz ? e("div",{className:"flex min-w-0 flex-col gap-2"}, f) : e.apply(null, [Raiz, null].concat(f)); }

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
var GRADE_LIMPA = "[--border:rgba(255,255,255,.12)] [--color-border:rgba(255,255,255,.12)] [&_tbody_td]:!bg-[#17181c] [&_tfoot_td]:!bg-[#1f2128] [&_span.pointer-events-none.absolute.bg-white]:hidden";

export { COR, GRADE_LIMPA, VISOES_PREMIO, usePr, Raiz, casca, FaixaAzul, grupoBtn, BtFaixa, CAMPO_FAIXA, Aviso, pc };
