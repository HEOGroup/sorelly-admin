// Sorelly Admin · montagem — pages/estoque-sorelly/Configurador.js
// Estoque Sorelly → aba "Configurador": parâmetros, textos de ajuda de cada campo e controle dos meses (estimado / travado).
// Só a diretoria altera; os demais veem tudo em leitura, com a linha "Somente a diretoria altera".
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, LINHA, Mosaico, Pagina, Tab, Td, degrade } from "@/apps/montagem/components/padrao";
import { AJUDA_PADRAO, CAMPOS_FECHAMENTO, CAMPOS_POSICAO, ROTULO_FECHAMENTO, ROTULO_POSICAO, esHistorico } from "@/apps/montagem/domain/estoque-sorelly";
import { Bt, Ic, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { useEs } from "@/apps/montagem/pages/estoque-sorelly/util";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var ROTULOS = Object.assign({}, ROTULO_POSICAO, ROTULO_FECHAMENTO);
var CAMPOS = CAMPOS_POSICAO.concat(CAMPOS_FECHAMENTO);

function Rotulo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/80"}, p.t), p.children, p.dica && e("span",{className:"text-[11px] text-white/60"}, p.dica)); }

function BlocoParametros(p){
  var c = p.cfg, st = useState({rec:String(c.recebimentoPct), com:String(c.comissaoRepPct), meta:c.metaKitMedio || 0}), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var num = function(k, rot){ return e(Rotulo,{t:rot}, e("input",{type:"number", min:0, max:100, step:"0.1", disabled:!p.admin, value:v[k], "aria-label":rot, className:INPUT+" h-10! w-full text-center "+MONO, onChange:function(ev){ set(k, ev.target.value); }})); };
  return e(BlocoBarra,{cor:"azul", t:"Parâmetros", compacto:true}, e("div",{className:"flex flex-col gap-2.5 p-2.5"},
    e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(11rem, 1fr))"}},
      num("rec", "Recebimento (% do preço de venda)"), num("com", "Comissão do representante (%)"),
      e(Rotulo,{t:"Meta de kit médio"}, e(Dinheiro,{value:v.meta, label:"Meta de kit médio", disabled:!p.admin, onChange:function(x){ set("meta", x || 0); }}))),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.admin, semAut:true, onClick:function(){ p.exec("config", {recebimentoPct:v.rec, comissaoRepPct:v.com, metaKitMedio:v.meta || 0}); }}, "Salvar parâmetros"))));
}

function BlocoAjuda(p){
  var aj = p.cfg.ajuda, st = useState(function(){ return Object.assign({}, aj); }), v = st[0];
  var alterados = CAMPOS.filter(function(k){ return v[k]!==aj[k]; });
  return e(BlocoBarra,{cor:"azul", t:"Textos de ajuda", sub:"Aparecem no \"?\" de cada campo do Preenchimento", compacto:true}, e("div",{className:"flex flex-col gap-2.5 p-2.5"},
    e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(16rem, 1fr))"}}, CAMPOS.map(function(k){
      return e("div",{key:k, className:"flex min-w-0 flex-col gap-1.5 rounded-xl p-2 text-center", style:{background:"rgba(0,0,0,.22)", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.1)"}},
        e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/85"}, ROTULOS[k]),
        e("textarea",{rows:3, disabled:!p.admin, value:v[k] || "", "aria-label":"Texto de ajuda: "+ROTULOS[k], className:INPUT+" h-auto! w-full resize-none py-2 text-center text-[12.5px]!", onChange:function(ev){ var x = ev.target.value; st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); }}),
        e("div",{className:"flex justify-center"}, e(Bt,{ic:"arrow-counter-clockwise", disabled:!p.admin || v[k]===AJUDA_PADRAO[k] && aj[k]===AJUDA_PADRAO[k], semAut:true, titulo:"Voltar ao texto padrão", className:"px-2! py-1! text-[12px]!", onClick:function(){ p.exec("ajuda_restaurar", {campo:k}); st[1](function(o){ var n = Object.assign({}, o); n[k] = AJUDA_PADRAO[k]; return n; }); }}, "Restaurar")));
    })),
    e("div",{className:"flex flex-wrap justify-center gap-2"},
      e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.admin || !alterados.length, semAut:true, onClick:function(){ var a = {}; alterados.forEach(function(k){ a[k] = v[k]; }); p.exec("config", {ajuda:a}); }}, "Salvar textos"+(alterados.length ? " ("+alterados.length+")" : "")),
      e(Bt,{ic:"arrow-counter-clockwise", disabled:!p.admin, semAut:true, onClick:function(){ if(p.exec("ajuda_restaurar", {})) st[1](Object.assign({}, AJUDA_PADRAO)); }}, "Restaurar todos"))));
}

// controle dos meses: estimado (marcar/desmarcar) e travado, para a foto e para o fechamento de cada mês
function BlocoMeses(p){
  var hist = esHistorico(p.s, 24);
  var cel = function(r, ehPos){
    if(!r) return e(Td,{key:ehPos ? "p" : "f", className:"text-white/50"}, "—");
    var estimado = r.simulados && r.simulados.length>0, op = ehPos ? "editar_posicao" : "editar_fechamento", campos = ehPos ? CAMPOS_POSICAO : CAMPOS_FECHAMENTO;
    return e(Td,{key:ehPos ? "p" : "f"}, e("div",{className:"flex items-center justify-center gap-1"},
      e("button",{type:"button", disabled:!p.admin, onClick:function(){ p.exec(op, estimado ? {id:r.id, desmarcarSimulado:r.simulados.slice()} : {id:r.id, marcarSimulado:campos}); }, title:estimado ? "Desmarcar a estimativa" : "Marcar como estimado",
        className:"rounded-full disabled:cursor-not-allowed disabled:opacity-60"}, e(Selo,{cor:estimado ? "alerta" : "neutro", ic:estimado ? "warning" : "check-circle"}, estimado ? "Estimado" : "Real")),
      e(Ic,{ic:r.travado ? "lock" : "lock-open", titulo:r.travado ? "Destravar o mês" : "Travar o mês", forte:r.travado, disabled:!p.admin, semAut:true, onClick:function(){ p.exec(op, {id:r.id, travado:!r.travado}); }})));
  };
  return e(BlocoBarra,{cor:"azul", t:"Meses: estimativa e trava", sub:"Número estimado aparece com selo no resumo; mês travado só a diretoria altera", compacto:true}, e("div",{className:"p-2"},
    hist.length ? e(Tab,{cols:["Mês","Foto do estoque","Fechamento"]}, hist.map(function(h){ return e("tr",{key:h.anoMes, className:LINHA}, e(Td,{forte:true}, h.rotulo), cel(h.posicao, true), cel(h.fechamento, false)); }))
      : e(Vazio,{ic:"calendar-blank"}, "Nenhum mês lançado ainda.")));
}

function AbaConfigurador(){
  var ctx = useEs(), cfg = ctx.cfg, admin = ctx.admin;
  var assin = JSON.stringify([cfg.recebimentoPct, cfg.comissaoRepPct, cfg.metaKitMedio]), assinAj = JSON.stringify(cfg.ajuda);
  return e(Pagina,null,
    !admin && e("div",{role:"status", className:"flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-[13px] font-bold", style:degrade("alerta")}, e("i",{className:"ph-duotone ph-lock", style:{fontSize:16, color:"#FBBF24"}}), "Somente a diretoria altera"),
    e(Mosaico,{min:"26rem"},
      e(BlocoParametros,{key:"p"+assin, cfg:cfg, admin:admin, exec:ctx.exec}),
      e(BlocoMeses,{s:ctx.s, admin:admin, exec:ctx.exec}),
      e(BlocoAjuda,{key:"a"+assinAj, cfg:cfg, admin:admin, exec:ctx.exec})));
}

export { AbaConfigurador };
