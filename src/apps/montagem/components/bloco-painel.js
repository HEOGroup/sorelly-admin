// Sorelly Admin · montagem — components/bloco-painel.js
// BLOCO PADRÃO do Financeiro (Marcus, 12/11/2026: "padronizar 100%", a partir do Direcionar): barra de título no azul do sistema (--bloco-titulo),
// borda de 2 px no mesmo azul, linhas internas brancas (30%) e faixa dos nomes das colunas no azul mais fraco (--bloco-colunas). As duas cores ficam em src/styles/theme.css.
// A tabela (TabelaPlanilha) dentro do bloco encosta nas bordas: sem borda nem canto arredondado próprios, fundo do bloco.
// Uso: e("div",{className:PADRAO_BLOCOS}, e(BlocoPainel,{titulo:"Contas das representantes"}, e(TabelaPlanilha,{...})))
// GrupoBtn: botões juntos numa caixa com borda (nada de botão avulso). Cada botão: className BTN_GRUPO, com key.
import { e } from "@/shared/react";

/** Vai na RAIZ da tela: define a cor das linhas (branco 30%) e a cor do topo das tabelas antigas (TabelaP). */
var PADRAO_BLOCOS = "[--topo-tabela:var(--bloco-colunas)] [--border:rgba(255,255,255,0.3)] [--color-border:rgba(255,255,255,0.3)] [--color-success:var(--positivo)] [--color-destructive:var(--negativo)]";
var BTN_GRUPO = "grid h-8 place-items-center whitespace-nowrap px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40";

function BlocoPainel(p){
  return e("section",{className:"flex min-w-0 flex-col overflow-hidden rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 [&_.overflow-x-auto]:!rounded-none [&_.overflow-x-auto]:!border-0 [&_table]:!bg-transparent [&_thead_th]:!bg-[var(--bloco-colunas)] [&_tbody_tr:last-child_td]:!border-b-0"},
    e("div",{className:"flex min-h-8 items-center justify-center border-b border-border bg-[var(--bloco-titulo)] px-4 text-center text-white"},
      e("h2",{className:"py-1.5 text-[13px] font-bold leading-tight"}, p.titulo)),
    e("div",{className:"flex min-h-0 flex-1 flex-col"}, p.children));
}

function GrupoBtn(p){
  return e("div",{className:"inline-flex h-8 items-stretch divide-x divide-border overflow-hidden rounded-md border border-border bg-card"}, p.children);
}

export { PADRAO_BLOCOS, BTN_GRUPO, BlocoPainel, GrupoBtn };
