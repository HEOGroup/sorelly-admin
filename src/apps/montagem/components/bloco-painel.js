// Sorelly Admin · montagem — components/bloco-painel.js
// BLOCO PADRÃO do Financeiro (Marcus, 12/11/2026: "padronizar 100%", a partir do Direcionar): barra de título no azul do sistema (--bloco-titulo),
// borda de 2 px no mesmo azul, linhas internas brancas (30%) e faixa dos nomes das colunas no azul mais fraco (--bloco-colunas). As duas cores ficam em src/styles/theme.css.
// A tabela (TabelaPlanilha) dentro do bloco encosta nas bordas: sem borda nem canto arredondado próprios, fundo do bloco.
// Uso: e("div",{className:PADRAO_BLOCOS}, e(BlocoPainel,{titulo:"Contas das representantes"}, e(TabelaPlanilha,{...})))
// aoTitulo + fechado: a barra azul abre e fecha o bloco; fechado mostra só a barra (Chaves Pix, 12/11/2026).
// Títulos de bloco SEMPRE em letras maiúsculas (Marcus, 12/11/2026), em todas as telas que usam BlocoPainel.
// dir: texto ou peça no lado DIREITO da barra azul (janela de pagamento: situação da conta, 12/11/2026).
// tituloEsq: título alinhado à esquerda (Chaves Pix, 12/11/2026).
// semBarra: true = sem a barra azul de título; fica só a tabela no estilo do bloco (Contas bancárias, 12/11/2026).
// GrupoBtn: botões juntos numa caixa com borda (nada de botão avulso). Cada botão: className BTN_GRUPO, com key.
import { e } from "@/shared/react";

/** Vai na RAIZ da tela: define a cor das linhas (branco 30%) e a cor do topo das tabelas antigas (TabelaP). */
var PADRAO_BLOCOS = "[--topo-tabela:var(--bloco-colunas)] [--border:rgba(255,255,255,0.3)] [--color-border:rgba(255,255,255,0.3)] [--color-success:var(--positivo)] [--color-destructive:var(--negativo)]";
// COMPACTO (Marcus, 12/11/2026: "mais estilo planilha do Google, ver tudo sem rolar"): letra de 11 px, linha de 28 px e campos sem caixa, parecendo célula; só aparece a borda ao passar o mouse.
var COMPACTO = " [&_td]:!h-[26px] [&_td]:!px-2 [&_td]:!text-[11px] [&_td_.py-1]:!py-0 [&_td_input]:!h-[18px] [&_td_input]:!border-0 [&_td_input]:!bg-transparent [&_td_input]:!text-[11px] [&_td_select]:!h-[18px] [&_td_select]:!border-0 [&_td_select]:!text-[11px] [&_td_button]:!min-h-[18px] [&_td_button]:!h-[18px] [&_th]:!h-6 [&_th_button]:!h-6 [&_th_div]:!h-6 [&_td_button]:!py-0 [&_td_button]:leading-none [&_td_button]:!border-0 [&_td_button]:!text-[11px] [&_td_input]:!text-white [&_td_select]:!text-white [&_td_button]:!text-white [&_td_input]:[color-scheme:dark] [&_td_select]:[color-scheme:dark] [&_td_input:hover]:!bg-white/10 [&_td_select:hover]:brightness-125 [&_td_button:hover]:brightness-125";
// ESQUERDA (Marcus, 12/11/2026): toda a escrita das células vai para a esquerda, em todas as colunas; só o topo (nomes das colunas) continua centralizado.
var ESQUERDA = " [&_td]:!text-left [&_td_button]:!justify-start [&_td_button]:!text-left [&_td_input]:!text-left [&_td_select]:!text-left";
var BTN_GRUPO = "grid h-8 place-items-center whitespace-nowrap px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40";

function BlocoPainel(p){
  return e("section",{className:(p.compacto ? "compacto " : "")+"flex min-w-0 flex-col overflow-hidden rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 [&_.overflow-x-auto]:!rounded-none [&_.overflow-x-auto]:!border-0 [&_table]:!bg-transparent [&_thead_th]:!bg-[var(--bloco-colunas)] [&_tbody_tr:last-child_td]:!border-b-0 [&_tr>*:first-child]:!border-l-0 [&_tr>*:last-child]:!border-r-0 [&_table_td]:![border-color:var(--border)] [&_table_th]:![border-color:var(--border)]"+(p.compacto ? COMPACTO : "")+(p.esquerda ? ESQUERDA : "")+(p.cls ? " "+p.cls : "")},
    !p.semBarra && e("div",{onClick:p.aoTitulo, "aria-expanded":p.aoTitulo ? !p.fechado : undefined, title:p.aoTitulo ? (p.fechado ? "Abrir o bloco" : "Fechar o bloco") : undefined, className:"relative flex items-center "+(p.tituloEsq ? "justify-start text-left" : "justify-center text-center")+" bg-[var(--bloco-titulo)] px-4 text-white "+(p.fechado ? "" : "border-b border-border ")+(p.aoTitulo ? "cursor-pointer select-none " : "")+"min-h-6"},
      p.acao && e("div",{className:"absolute inset-y-0 left-2 flex items-center"}, p.acao),
      p.dir && e("div",{className:"absolute inset-y-0 right-2 flex items-center text-[13px] font-semibold"}, p.dir),
      e("h2",{className:"py-0.5 text-[13px] font-bold uppercase leading-tight"}, p.titulo)),
    !p.fechado && e("div",{className:"flex min-h-0 flex-1 flex-col"}, p.children));
}

function GrupoBtn(p){
  return e("div",{className:"inline-flex h-8 items-stretch divide-x divide-border overflow-hidden rounded-md border border-border bg-card"}, p.children);
}

export { PADRAO_BLOCOS, BTN_GRUPO, BlocoPainel, GrupoBtn };
