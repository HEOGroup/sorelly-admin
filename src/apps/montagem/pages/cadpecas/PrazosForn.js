// Sorelly Admin · montagem — pages/cadpecas/PrazosForn.js
// Pedidos Banho/Bruto › bloco "Prazos dos fornecedores" (17/11/2026, modelo 3 do Marcus, depois "bem compacto, só os prazos"), à ESQUERDA do Resumo por mês.
// No alto, um menu suspenso troca o fornecedor (Pontual, Ellos, Point, Mega Sul...); embaixo, UMA LINHA POR ETAPA com o prazo em dias (digita e Enter) e se tem pedido atrasado ou não. Os pedidos em si ficam no quadro, mais abaixo.
// O botão do canto copia a mensagem de cobrança (do fornecedor escolhido, se ele tem atrasado; senão, de todos). Contas em domain/prazos-forn.js. Quem muda o prazo: quem lança os pedidos de bruto e a diretoria.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { mensagemCobranca, resumoAbas } from "@/apps/montagem/domain/prazos-forn";
import { e, useState } from "@/shared/react";

var VERMELHO = "#F87171";
var CAMPO_P = "h-7 rounded-md border border-border bg-card px-2 text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";   // padrao-ok: controle de 28 px e letra de 11 px, como no Pedidos e no Controle de compras (Marcus, 17/11/2026: bem compacto)
var BOTAO_P = "h-7 shrink-0 whitespace-nowrap rounded-md border border-primary bg-primary/20 px-2.5 text-[11px] font-semibold text-primary hover:bg-primary/30";   // padrao-ok: botão de 28 px, mesmo motivo

// copia o texto; se o navegador negar a cópia moderna, tenta o método antigo (mesmo cuidado do botão Copiar da chave Pix)
function copiarTexto(txt, fim){
  var antigo = function(){ var ta = document.createElement("textarea"), certo = false; ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { certo = document.execCommand("copy"); } catch(x){ certo = false; } document.body.removeChild(ta); fim(certo); };
  try { navigator.clipboard.writeText(txt).then(function(){ fim(true); }, antigo); } catch(x){ antigo(); }
}

// campo do prazo: grava ao sair do campo (ou Enter) só se mudou; vazio = sem prazo próprio
function CampoPrazo(p){
  var ini = p.valor>0 ? String(p.valor) : "";
  return e("input",{key:p.id+"-"+ini, type:"text", inputMode:"numeric", defaultValue:ini, placeholder:"—", readOnly:!p.pode, "aria-label":p.rot, title:p.dica || p.rot,
    onBlur:function(ev){ if(!p.pode) return; var v = ev.target.value.replace(/\D/g, ""); if(v!==ini) p.salvar(v==="" ? 0 : parseInt(v, 10)); },
    onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }, className:CAMPO_P+" w-12 shrink-0 text-center tabular-nums"});
}

// uma linha só por etapa: nome, situação (atrasado ou não) e o prazo
function Linha(p){
  var l = p.l, atr = l.atrasados>0;
  return e("div",{className:"flex items-center gap-2 border-t border-white/20 px-2 py-0.5 "+(atr ? "bg-[#EF4444]/15" : "")},
    e("b",{className:"min-w-0 flex-1 text-[11px] uppercase leading-tight tracking-[.03em]"}, l.nome),
    e("span",{className:"shrink-0 whitespace-nowrap text-[11px] tabular-nums", style:atr ? {color:VERMELHO, fontWeight:700} : undefined}, atr ? l.atrasados+(l.atrasados===1 ? " atrasado" : " atrasados") : l.prazo>0 ? "no prazo" : "sem prazo"),
    e("div",{className:"flex shrink-0 items-center gap-1"}, e(CampoPrazo,{id:p.id, valor:l.prazo, pode:p.pode, rot:"Prazo de "+l.nome+" em dias", dica:l.padrao && l.prazo>0 ? "Prazo geral. Digite para definir o prazo deste fornecedor." : "Prazo em dias", salvar:p.salvar}), e("span",{className:"text-[11px]"}, "dias")));
}

function PrazosForn(p){
  var abas = resumoAbas(p.c, p.hoje), sa = useState(abas[0].k), k = sa[0], aba = abas.find(function(a){ return a.k===k; }) || abas[0];
  var cp = useState(0), copiou = cp[0], d = aba.det;
  var soEsta = aba.atrasados>0;   // com atrasado no fornecedor escolhido, copia só dele; sem atrasado, copia o de todos
  var copiar = function(){
    var txt = mensagemCobranca(abas, p.hoje, soEsta ? aba.k : "");
    if(!txt){ cp[1](3); setTimeout(function(){ cp[1](0); }, 1800); return; }
    copiarTexto(txt, function(certo){ cp[1](certo ? 1 : 2); setTimeout(function(){ cp[1](0); }, 1800); });
  };
  var topo = e("div",{className:"flex items-center gap-1.5 px-2 py-1"},
    e("select",{"aria-label":"Fornecedor", value:aba.k, onChange:function(ev){ sa[1](ev.target.value); }, className:CAMPO_P+" min-w-0 flex-1 cursor-pointer"},
      abas.map(function(a){ return e("option",{key:a.k, value:a.k}, a.nome+(a.atrasados>0 ? " · "+a.atrasados+(a.atrasados===1 ? " atrasado" : " atrasados") : " · no prazo")); })),
    e("button",{type:"button", onClick:copiar, title:"Copia a mensagem de cobrança com os pedidos atrasados", className:BOTAO_P},
      copiou===1 ? "Copiado" : copiou===2 ? "Não copiou" : copiou===3 ? "Nada atrasado" : soEsta ? "Copiar cobrança" : "Copiar cobrança · todos"));
  var linhas = d.linhas.map(function(l){ return e(Linha,{key:l.etapa, id:aba.k+"-"+l.etapa, l:l, pode:p.pode, salvar:function(dias){ p.exec("prazo", {forn:aba.nome, etapa:l.etapa, dias:dias}); }}); });
  // Pontual e Ellos: o prazo de sempre no banho inteiro (da chegada até sair), com o mesmo cálculo que marca os cartões em vermelho
  var totalBanho = d.total && e(Linha,{key:"total", id:aba.k+"-total", pode:p.pode, salvar:function(dias){ p.exec("prazo", {galv:aba.galv, dias:dias}); },
    l:{nome:"Total no banho", prazo:d.total.prazo, padrao:false, pedidos:d.total.pedidos, atrasados:d.total.atrasados}});
  return e(BlocoPainel,{titulo:"Prazos dos fornecedores", compacto:true}, topo, linhas, totalBanho);
}

export { PrazosForn };
