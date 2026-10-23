// Sorelly Admin · montagem — pages/cadpecas/Outras.js
// Cadastro de peças → abas "Fornecedores" (comparação de custo), "DevMaster" (pedidos de alteração, em Kanban) e "Configurações" (só diretoria).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { Kanban } from "@/shared/kanban";
import { ATIVIDADES, ESTADOS_SOL, GALVANICAS, brl, pct0, porFornecedor } from "@/apps/montagem/domain/cadastro-pecas";
import { Bt, Cel, Ic, NEUTRO, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var INP = "h-9 rounded-lg bg-black/30 px-2.5 text-[13px] ring-1 ring-white/15 outline-none focus:ring-white/45";

function AbaFornecedores(){
  var x = useCpc(), c = x.c, f = useState("");
  var linhas = porFornecedor(c, f[0] || null), menor = linhas.length ? linhas[0] : null, tot = linhas.reduce(function(t, l){ return t + l.pecas; }, 0);
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Sl,{v:f[0], set:f[1], rot:"Planilha", opcoes:[["", "Todas as planilhas"]].concat(c.lotes.map(function(l){ return [l.id, l.nome+" · "+GALVANICAS[l.galvanica]]; })), className:"w-64"})),
    e(Faixa,{n:3},
      e(Indicador,{t:"Fornecedores", v:String(linhas.length), cor:NEUTRO}),
      e(Indicador,{t:"Peças", v:String(tot), cor:NEUTRO}),
      e(Indicador,{t:"Menor custo por peça", v:menor ? brl(menor.custoMedio) : "—", cor:NEUTRO})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Custo médio por peça (bruto + banho)", dir:linhas.length},
      linhas.length ? e(Tab,{cols:["Fornecedor", "Peças", "Bruto médio", "Banho médio", "Custo médio", "Preço médio de venda", "Markup"]},
        linhas.map(function(l, i){ return e("tr",{key:l.fornecedor, className:"border-t border-white/5"},
          e(Td,{forte:true, cor:i===0 ? "ok" : undefined}, l.fornecedor), e(Td,null, l.pecas), e(Td,{dinheiro:true}, brl(l.brutoMedio)), e(Td,{dinheiro:true}, brl(l.banhoMedio)),
          e(Td,{dinheiro:true, forte:true, cor:i===0 ? "ok" : undefined}, brl(l.custoMedio)), e(Td,{dinheiro:true}, brl(l.precoMedio)), e(Td,null, pct0(l.markup))); })) :
      e(Vazio,{ic:"scales"}, "Sem peças lançadas.")),
    e("p",{className:"text-center text-[12px] text-white/70"}, "A média mistura tipos de peça diferentes; para comparar de verdade, use o mesmo tipo de peça. A comparação por tipo entra quando o cadastro tiver o grupo de cada peça."));
}

function AbaDevMaster(){
  var x = useCpc(), c = x.c, nv = useState({titulo:"", texto:""}), v = nv[0];
  var cores = {pedido:"#F59E0B", enviado:"#60A5FA", feito:"#4ADE80"};
  var colunas = ESTADOS_SOL.map(function(s){ return {k:s[0], titulo:s[1], cor:cores[s[0]], itens:c.solic.filter(function(q){ return q.estado===s[0]; }).map(function(q){ return Object.assign({}, q); })}; });
  var conta = function(est){ return String(c.solic.filter(function(q){ return q.estado===est; }).length); };
  return e(Pagina,null,
    e(Faixa,{n:3},
      e(Indicador,{t:"Para pedir", v:conta("pedido"), cor:NEUTRO}),
      e(Indicador,{t:"Enviados, aguardando", v:conta("enviado"), cor:NEUTRO}),
      e(Indicador,{t:"Feitos", v:conta("feito"), cor:NEUTRO})),
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e("input",{value:v.titulo, onChange:function(ev){ nv[1](Object.assign({}, v, {titulo:ev.target.value})); }, placeholder:"O que precisa mudar na DevMaster", "aria-label":"O que precisa mudar", className:INP+" w-72 text-center"}),
      e("input",{value:v.texto, onChange:function(ev){ nv[1](Object.assign({}, v, {texto:ev.target.value})); }, placeholder:"Detalhe (opcional)", "aria-label":"Detalhe", className:INP+" w-72 text-center"}),
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ if(x.exec("sol_add", {titulo:v.titulo, texto:v.texto})) nv[1]({titulo:"", texto:""}); }}, "Novo pedido")),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Pedidos de alteração para a DevMaster", dir:c.solic.filter(function(q){ return q.estado!=="feito"; }).length+" em aberto"},
      e("p",{className:"mb-2 text-center text-[12px] text-white/75"}, "A Rayssa leva estes pedidos à DevMaster e arrasta o cartão conforme andam."),
      e(Kanban,{colunas:colunas, vazio:"Nenhum pedido nesta etapa.", unidade:["pedido", "pedidos"],
        card:function(q){ return e("div",{className:"flex flex-col gap-1 text-left"},
          e("div",{className:"flex items-start justify-between gap-1"}, e("b",{className:"text-[13px] leading-snug"}, q.titulo), e(Ic,{ic:"x", perigo:true, titulo:"Remover o pedido", onClick:function(){ if(window.confirm("Remover este pedido?")) x.exec("sol_del", {id:q.id}); }})),
          q.texto && e("p",{className:"text-[12px] leading-snug text-white/80"}, q.texto),
          e("p",{className:"text-[11px] text-white/55"}, q.por+" · "+q.em.split("-").reverse().join("/"))); },
        onMover:function(q, de, para){ x.exec("sol_estado", {id:q.id, estado:para}); }})));
}

function AbaConfigCad(){
  var x = useCpc(), cfg = x.c.config;
  if(!x.admin) return e(Pagina,null, e(Vazio,{ic:"lock"}, "Somente a diretoria acessa as configurações."));
  var linha = function(r, el, nota){ return e("tr",{key:r, className:"border-t border-white/5"}, e(Td,{forte:true}, r), e(Td,null, el), e(Td,{className:"whitespace-normal! text-white/70"}, nota)); };
  return e(Pagina,null,
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Preço e markup"},
      e(Tab,{cols:["Regra", "Valor", "Como funciona"]},
        linha("Sorelly recebe (%)", e(Cel,{v:Math.round(cfg.recebido*10000)/100, rot:"Percentual do preço que a Sorelly recebe", w:"w-20", onSet:function(v){ x.exec("config", {recebido:v}); }}), "Parte do preço de venda que fica com a Sorelly depois da comissão da revendedora. O markup é calculado sobre ela."),
        linha("Markup alvo (%)", e(Cel,{v:Math.round(cfg.markupAlvo*100), rot:"Markup alvo em porcentagem", w:"w-20", onSet:function(v){ x.exec("config", {markupAlvo:v}); }}), "Usado para sugerir o preço. Cada planilha pode ter o seu na Calculadora."),
        linha("Preço termina em 8", e("input",{type:"checkbox", checked:!!cfg.arred8, onChange:function(ev){ x.exec("config", {arred8:ev.target.checked}); }, "aria-label":"Preço termina em 8", className:"size-4 cursor-pointer accent-[#3B82F6]"}), "Arredonda o preço sugerido para cima, até o próximo valor terminado em 8 (28, 38, 48...)."))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Quem faz cada atividade", dir:"responsáveis"},
      e("p",{className:"mb-1 text-center text-[12px] text-white/75"}, "Só quem está na lista edita (a diretoria sempre pode). Escreva os primeiros nomes separados por vírgula."),
      e(Tab,{cols:["Atividade", "Quem faz"]}, ATIVIDADES.map(function(a){ return e("tr",{key:a[0], className:"border-t border-white/5"}, e(Td,{forte:true}, a[1]),
        e(Td,null, e(Cel,{v:((cfg.quem||{})[a[0]]||[]).join(", "), texto:true, rot:"Quem faz: "+a[1], w:"w-64", onSet:function(v){ x.exec("quem", {atividade:a[0], nomes:v}); }}))); }))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Banho padrão por tipo de peça", dir:"referência"},
      e(Tab,{cols:["Tipo de peça", "Banho"]}, cfg.banhoPadrao.map(function(b){ return e("tr",{key:b[0], className:"border-t border-white/5"}, e(Td,{forte:true}, b[0]), e(Td,null, b[1])); })),
      e("p",{className:"mt-2 text-center text-[12px] text-white/70"}, "Todo ouro da Pontual leva verniz, menos peça com rivieira. Os valores por grama vêm da fatura de cada lote (Calculadora). Ainda não aplicado sozinho: depende do tipo da peça no cadastro.")),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Custos que entram só na DevMaster"},
      e("p",{className:"text-center text-[13px]"}, "Etiqueta R$ 0,04 e embalagem R$ 0,10 por peça são lançadas pela DevMaster; o custo aqui é bruto + banho.")));
}
export { AbaFornecedores, AbaDevMaster, AbaConfigCad };
