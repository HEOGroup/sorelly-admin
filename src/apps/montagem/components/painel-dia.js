// Sorelly Admin — components/painel-dia.js
// "Hoje na empresa", em tempo real: quantos kits tem a listagem de hoje, quantos estão sendo montados, quantos já foram montados, bipados, quantos restam,
// quantas revendedoras vão sair e quantos kits de retorno esperam bipagem. Sem nenhum valor em dinheiro (serve para a bipagem e para a Direção).
import { qtdFila } from "@/apps/montagem/domain/retornos";
import { e } from "@/shared/react";

var EM = {fila:["semvalor","pendente","ajuste","condicional","precond"], montando:["montando","supervisao"], montados:["montado"], bipando:["bipando"], bipados:["bipado"], retirados:["retirado"]};

function contagemDia(s){
  var ls = (s.listagens||[]).filter(function(l){ return !l.fechada; }), ids = ls.map(function(l){ return l.id; });
  var ks = (s.kits||[]).filter(function(k){ return ids.indexOf(k.lid)>=0; });
  var n = function(k){ return ks.filter(function(x){ return EM[k].indexOf(x.status)>=0; }).length; };
  var c = {listagens:ls.length, total:ks.length, fila:n("fila"), montando:n("montando"), montados:n("montados"), bipando:n("bipando"), bipados:n("bipados"), retirados:n("retirados"),
    saem:ks.filter(function(k){ return k.tipoKit==="saiu"; }).length, retorno:qtdFila(s)};
  c.restantes = Math.max(0, c.total - c.bipados - c.retirados);   // ainda falta bipar
  c.prontos = c.bipados + c.retirados;
  return c;
}

function PainelDia(p){
  var cp = !!p.compacto, c = contagemDia(p.s), pct = c.total>0 ? Math.round(c.prontos/c.total*100) : 0;
  var tile = function(t, v, cor, sub){ return e("div",{key:t, className:"flex flex-col items-center justify-center rounded-xl bg-black/30 px-2 py-2 text-center ring-1 ring-white/10"},
    e("b",{className:"font-mono text-[20px] leading-none", style:{color:cor}}, v), e("span",{className:"mt-1 text-[10.5px] font-bold uppercase leading-tight tracking-wide text-white/75"}, t), sub && e("span",{className:"text-[10.5px] text-white/50"}, sub)); };
  var itens = [
    ["Kits da listagem de hoje", c.total, "#F3D98B"],
    ["Na fila", c.fila, "#94A3B8"],
    ["Sendo montados", c.montando, "#C084FC"],
    ["Montados · para bipar", c.montados+c.bipando, "#60A5FA", c.bipando ? c.bipando+" bipando agora" : null],
    ["Bipados", c.bipados, "#4ADE80"],
    ["Restantes para bipar", c.restantes, c.restantes>0 ? "#FBBF24" : "#4ADE80"],
    ["Revendedoras que vão sair", c.saem, "#F87171"],
    ["Retornos para bipar", c.retorno, c.retorno>=20 ? "#EF4444" : c.retorno>0 ? "#FBBF24" : "#4ADE80", "kits das representantes"]];
  // Dashboard (p.compacto): mesma grade de quadradinhos, só mais enxuta (menos espaço); versão em lista foi tirada a pedido do Marcus, 26/10/2026
  return e("section",{className:"flex flex-col gap-2 overflow-hidden rounded-2xl border border-[#E8B84B]/40 bg-card "+(cp ? "p-2" : "p-3")},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("h2",{className:"font-heading text-[15px] font-bold"}, "Hoje na empresa ", e("span",{className:"text-[12px] font-semibold text-muted-foreground"}, "· em tempo real")),
      e("span",{className:"text-[12.5px] font-semibold text-muted-foreground"}, c.listagens+(c.listagens===1 ? " listagem" : " listagens")+" · "+pct+"% pronto")),
    e("div",{className:"h-2.5 overflow-hidden rounded-full bg-muted/50"}, e("div",{className:"h-full rounded-full bg-linear-to-r from-[#B8862B] to-[#E8B84B]", style:{width:pct+"%"}})),
    e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8"}, itens.map(function(x){ return tile(x[0], x[1], x[2], x[3]); })));
}
export { PainelDia, contagemDia };
