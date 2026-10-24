// Sorelly Admin · montagem — pages/encomendas/Regras.js
// Encomendas e reposições → Regras e mensagens (22/10/2026): três abas visíveis — Regras (reposição, Pix, bloqueio, atendentes, expositor), Valores (quantidade por mês e valor máximo por média)
// e Mensagens prontas (texto gerado das regras, com botão Copiar; a diretoria pode trocar o texto). Só a diretoria edita (domain/encomendas.js → podeConfigurar); os demais só leem.
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { MENSAGENS, mensagemPadrao } from "@/apps/montagem/domain/encomendas";
import { copiar, useEr } from "@/apps/montagem/pages/encomendas/visual";
import { Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var ABAS = [["regras", "Regras"], ["valores", "Valores"], ["mensagens", "Mensagens prontas"]];
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
function Cp(p){ return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t}), p.children); }
function Num(p){ return e("input",{type:"number", min:p.min===undefined ? 0 : p.min, step:p.step || 1, disabled:p.off, value:p.v, onChange:function(ev){ p.on(Number(ev.target.value)||0); }, className:CAMPO}); }
function Txt(p){ return e("input",{type:"text", disabled:p.off, value:p.v, onChange:function(ev){ p.on(ev.target.value); }, className:CAMPO}); }
function Grade(p){ return e("div",{className:"grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2 md:grid-cols-4"}, p.children); }

function Mensagem(p){
  var k = p.k, E = p.E, cfg = E.cfg, ov = p.ov, texto = ov!==undefined ? ov : mensagemPadrao(cfg, k), st = useState(false);
  var editada = ov!==undefined && ov!==mensagemPadrao(cfg, k);
  return e(Bloco,{t:p.titulo, dir:editada ? e(Selo,{cor:"#FBBF24"}, "Texto editado") : null},
    e("textarea",{value:texto, readOnly:!E.pode, rows:Math.min(18, Math.max(5, texto.split("\n").length+1)), onChange:function(ev){ p.set(k, ev.target.value); },
      className:"w-full resize-y rounded-md border border-border bg-card p-2.5 text-[13px] leading-snug text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}),
    e("div",{className:"mt-2 flex flex-wrap justify-end gap-2"},
      E.pode && editada && e(Botao,{onClick:function(){ p.set(k, undefined); }}, "Restaurar padrão"),
      e(Botao,{principal:true, onClick:function(){ if(copiar(texto)){ st[1](true); setTimeout(function(){ st[1](false); }, 2000); } }}, st[0] ? "Copiado" : "Copiar")));
}

function AbaErRegras(){
  var E = useEr(), cfg = E.cfg, pode = E.pode, off = !pode;
  var ini = function(){ return clone({reposicao:cfg.reposicao, pix:cfg.pix, expositor:cfg.expositor, bloqueio:cfg.bloqueio, top50:cfg.top50, valores:cfg.valores, qtd:cfg.qtd, atendentes:(cfg.atendentes||[]).join("\n"), prazoHoras:cfg.prazoHoras}); };
  var ab = useState("regras"), st = useState(ini), d = st[0], ms = useState(function(){ return clone(cfg.mensagens || {}); }), mg = ms[0];
  var mut = function(fn){ st[1](function(o){ var n = clone(o); fn(n); return n; }); };
  var sujo = JSON.stringify(d)!==JSON.stringify(ini()), sujoM = JSON.stringify(mg)!==JSON.stringify(cfg.mensagens || {});
  var salvar = function(){ E.exec("config_salvar", {config:{reposicao:d.reposicao, pix:d.pix, expositor:d.expositor, bloqueio:d.bloqueio, top50:d.top50, valores:d.valores, qtd:d.qtd, prazoHoras:d.prazoHoras, atendentes:d.atendentes.split("\n")}}); };
  var setMsg = function(k, v){ ms[1](function(o){ var n = clone(o); if(v===undefined || v===mensagemPadrao(cfg, k)) delete n[k]; else n[k] = v; return n; }); };
  var din = function(val, on, rot){ return e(Dinheiro,{value:val, label:rot, disabled:off, className:"w-full", onChange:on}); };
  var barra = function(sj, onSalvar, onDescartar, rot){ return pode && sj && e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2"}, e("b",{className:"text-[13px]"}, "Há alterações não salvas"), e(Botao,{principal:true, onClick:onSalvar}, rot), e(Botao,{onClick:onDescartar}, "Descartar")); };
  var corpo;
  if(ab[0]==="regras") corpo = e("div",{className:"flex flex-col gap-2.5"},
    barra(sujo, salvar, function(){ st[1](ini()); }, "Salvar regras"),
    e(Bloco,{t:"Reposição"}, e(Grade,null,
      e(Cp,{t:"Taxa da revendedora"}, din(d.reposicao.taxa, function(x){ mut(function(n){ n.reposicao.taxa = x; }); }, "Taxa")),
      e(Cp,{t:"Pago à representante"}, din(d.reposicao.taxaRepresentante, function(x){ mut(function(n){ n.reposicao.taxaRepresentante = x; }); }, "Pago à representante")),
      e(Cp,{t:"Média para ir à empresa"}, din(d.reposicao.mediaMinima, function(x){ mut(function(n){ n.reposicao.mediaMinima = x; }); }, "Média para ir à empresa")),
      e(Cp,{t:"Média mínima (representante)"}, din(d.reposicao.mediaMinimaRep, function(x){ mut(function(n){ n.reposicao.mediaMinimaRep = x; }); }, "Média mínima")),
      e(Cp,{t:"Por semana (representante)"}, e(Num,{v:d.reposicao.repPorSemana, off:off, on:function(x){ mut(function(n){ n.reposicao.repPorSemana = x; }); }})),
      e(Cp,{t:"Minutos na empresa"}, e(Num,{v:d.reposicao.minutosEscolha, off:off, on:function(x){ mut(function(n){ n.reposicao.minutosEscolha = x; }); }})),
      e(Cp,{t:"Alerta de atraso (horas)"}, e(Num,{v:d.prazoHoras, off:off, on:function(x){ mut(function(n){ n.prazoHoras = x; }); }})),
      e(Cp,{t:"Média mínima do Top 50"}, din(d.top50.mediaMinima, function(x){ mut(function(n){ n.top50.mediaMinima = x; }); }, "Média mínima do Top 50")))),
    e("div",{className:"grid grid-cols-1 gap-2.5 md:grid-cols-2"},
      e(Bloco,{t:"Pix da taxa"}, e("div",{className:"grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"},
        e(Cp,{t:"Quem recebe"}, e(Txt,{v:d.pix.recebedor, off:off, on:function(x){ mut(function(n){ n.pix.recebedor = x; }); }})), e(Cp,{t:"Tipo da chave"}, e(Txt,{v:d.pix.tipo, off:off, on:function(x){ mut(function(n){ n.pix.tipo = x; }); }})),
        e(Cp,{t:"Chave Pix"}, e(Txt,{v:d.pix.chave, off:off, on:function(x){ mut(function(n){ n.pix.chave = x; }); }})), e(Cp,{t:"Titular da conta"}, e(Txt,{v:d.pix.titular, off:off, on:function(x){ mut(function(n){ n.pix.titular = x; }); }})))),
      e(Bloco,{t:"Bloqueio"}, e("div",{className:"grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"},
        e(Cp,{t:"Vendas mínimas (% da reposição)"}, e(Num,{v:d.bloqueio.pctMinimo, off:off, on:function(x){ mut(function(n){ n.bloqueio.pctMinimo = x; }); }})),
        e(Cp,{t:"Meses de bloqueio"}, e(Num,{v:d.bloqueio.meses, off:off, on:function(x){ mut(function(n){ n.bloqueio.meses = x; }); }})))),
      e(Bloco,{t:"Atendentes da ida na empresa", dir:e("span",{className:"text-[12px] text-foreground/80"}, "uma por linha")},
        e("textarea",{value:d.atendentes, readOnly:off, rows:6, onChange:function(ev){ var v = ev.target.value; mut(function(n){ n.atendentes = v; }); }, className:"w-full resize-y rounded-md border border-border bg-card p-2.5 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary"})),
      e(Bloco,{t:"Expositor"}, e("div",{className:"grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2"},
        e(Cp,{t:"Média exigida (3 meses)"}, din(d.expositor.media3m, function(x){ mut(function(n){ n.expositor.media3m = x; }); }, "Média exigida")),
        e(Cp,{t:"Ou uma venda de"}, din(d.expositor.vendaMinima, function(x){ mut(function(n){ n.expositor.vendaMinima = x; }); }, "Venda mínima")),
        e(Cp,{t:"Taxa de entrega"}, din(d.expositor.taxaEntrega, function(x){ mut(function(n){ n.expositor.taxaEntrega = x; }); }, "Taxa de entrega")),
        e("label",{className:"flex h-8 cursor-pointer items-center gap-2 self-end text-[13px]"}, e("input",{type:"checkbox", disabled:off, checked:!!d.expositor.exigeFoto, onChange:function(ev){ var v = ev.target.checked; mut(function(n){ n.expositor.exigeFoto = v; }); }}), "Exige foto do local")))));
  else if(ab[0]==="valores") corpo = e("div",{className:"flex flex-col gap-2.5"},
    barra(sujo, salvar, function(){ st[1](ini()); }, "Salvar valores"),
    e(Bloco,{t:"Quantidade por mês"}, e(Grade,null,
      e(Cp,{t:"Limite da média"}, din(d.qtd.limiteMedia, function(x){ mut(function(n){ n.qtd.limiteMedia = x; }); }, "Limite da média")),
      e(Cp,{t:"Abaixo do limite"}, e(Num,{v:d.qtd.abaixo, off:off, on:function(x){ mut(function(n){ n.qtd.abaixo = x; }); }})),
      e(Cp,{t:"No limite ou acima"}, e(Num,{v:d.qtd.acima, off:off, on:function(x){ mut(function(n){ n.qtd.acima = x; }); }})),
      e(Cp,{t:"Top 50"}, e(Num,{v:d.qtd.top50, off:off, on:function(x){ mut(function(n){ n.qtd.top50 = x; }); }})))),
    e(Bloco,{t:"Valor máximo por média", dir:e("span",{className:"text-[12px] text-foreground/80"}, "abaixo da 1ª faixa: sem direito")},
      e("div",{className:"flex flex-col gap-1.5"}, d.valores.map(function(f, i){
        return e("div",{key:i, className:"grid grid-cols-[1fr_1fr_auto] items-end gap-3"},
          e(Cp,{t:"A partir da média"}, din(f.de, function(x){ mut(function(n){ n.valores[i].de = x; }); }, "A partir da média")),
          e(Cp,{t:"Valor máximo"}, din(f.max, function(x){ mut(function(n){ n.valores[i].max = x; }); }, "Valor máximo")),
          pode ? e(Botao,{onClick:function(){ mut(function(n){ n.valores.splice(i, 1); }); }}, "Remover") : e("span",null)); }),
        pode && e("div",{className:"flex justify-start pt-1"}, e(Botao,{onClick:function(){ mut(function(n){ var u = n.valores[n.valores.length-1]; n.valores.push({de:(u ? u.de : 0)+500, max:u ? u.max : 2500}); }); }}, "Adicionar faixa")))),
    e("p",{className:"text-[12px] text-foreground/80"}, "Top 50 sem média usa o maior valor da tabela. Top 50 abaixo da primeira faixa usa o menor valor."));
  else corpo = e("div",{className:"flex flex-col gap-2.5"},
    barra(sujoM, function(){ E.exec("config_salvar", {config:{mensagens:mg}}); }, function(){ ms[1](clone(cfg.mensagens || {})); }, "Salvar mensagens"),
    MENSAGENS.map(function(m){ return e(Mensagem,{key:m[0], k:m[0], titulo:m[1], E:E, ov:mg[m[0]], set:setMsg}); }));
  return e("div",{className:"flex flex-col gap-2.5"},
    !pode && e("div",{className:"flex justify-center"}, e(Selo,{cor:"#FBBF24", ic:"lock-key"}, "Somente a diretoria altera as regras")),
    e(AbasTela,{abas:ABAS, atual:ab[0], onMudar:ab[1]}), corpo);
}
export { AbaErRegras };
