// Sorelly Admin · montagem — pages/MetasSetor.js
// Financeiro → Comissões → Cadastro de revendedoras e Inadimplência: meta mensal com bônus (faixas, equipe, fechamento, pagamento). Regras em domain/metas-setor.js.
// A meta muda todo mês: o seletor de mês mostra a de cada mês; "Criar meta do mês" copia a anterior para ajustar. Só a diretoria edita as faixas.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, Faixa, Indicador, Pagina } from "@/apps/montagem/components/padrao";
import { grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { mesesComMeta, resumoMeta, rotuloMes } from "@/apps/montagem/domain/metas-setor";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var SETOR = {
  cadastro:{titulo:"Meta do Cadastro de revendedoras", cor:"#F97316", medida:"Revendedoras ativas", unidade:"", falta:"Falta para a faixa", fmt:int},
  inad:{titulo:"Meta da Inadimplência e cobrança de peças", cor:"#EF4444", medida:"Recebido no mês", unidade:"R$", falta:"Falta para a faixa", fmt:function(v){ return BK(v); }}
};
var TH = function(t){ return e("th",{key:t, className:"whitespace-nowrap px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white/70"}, t); };
var TDC = "px-2 py-1 text-center text-[13px]";

function MetaTela(p){
  var cx = use(), s = cx.state, d = cx.dispatch, cfg = SETOR[p.setor], hoje = new Date(), padrao = hoje.getFullYear()+"-"+String(hoje.getMonth()+1).padStart(2,"0");
  var st = useState(padrao), ym = st[0], setYm = st[1], ed = useState(false), edit = ed[0], setEdit = ed[1], nl = useState({data:hoje.toISOString().slice(0, 10), valor:0, obs:""}), novo = nl[0], setNovo = nl[1];
  var nf = useState({alvo:"", valor:0}), nfx = nf[0], setNfx = nf[1], ne = useState(""), nomeE = ne[0], setNomeE = ne[1];
  var dono = grupoDe(s.usuario)==="supervisao", por = nomeDe(s.usuario);
  var r = resumoMeta(s, p.setor, ym), act = function(op, extra){ d(Object.assign({type:"METAS", op:op, setor:p.setor, ym:ym, por:por}, extra||{})); };
  var seletor = e("input",{type:"month", value:ym, "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) setYm(ev.target.value); }, className:"h-9 rounded-lg bg-black/30 px-3 text-[13px] ring-1 ring-white/15"});
  if(!r) return e(Pagina,null, e(PageHead,{t:cfg.titulo, sub:"A meta muda todo mês."}, seletor),
    e("div",{className:"flex flex-col items-center gap-3 rounded-xl bg-card px-4 py-8 text-center ring-1 ring-[#E8B84B]/30"},
      e("p",{className:"text-[13.5px]"}, "Ainda não há meta de "+rotuloMes(ym)+"."),
      mesesComMeta(s).some(function(k){ return k<ym; }) && dono && e(Btn,{v:"primary", onClick:function(){ act("mes_novo"); }}, "Criar meta de "+rotuloMes(ym)+" a partir da anterior")));
  var m = r.meta, max = r.faixas.length ? r.faixas[r.faixas.length-1].alvo : 1, min = p.setor==="cadastro" ? Math.min(r.inicio, r.faixas.length ? r.faixas[0].alvo : r.inicio) : 0, span = Math.max(1, max-min);
  var pos = function(v){ return Math.max(0, Math.min(100, (v-min)/span*100)); };
  var barra = e("div",{className:"relative mx-2 mt-7 mb-9 h-3 rounded-full bg-black/30"}, e("div",{className:"absolute inset-y-0 left-0 rounded-full", style:{width:pos(r.medido)+"%", background:cfg.cor}}),
    r.faixas.map(function(f, i){ var l = pos(f.alvo), ult = i===r.faixas.length-1;
      return e("div",{key:f.id, className:"absolute top-0 h-full", style:{left:l+"%"}}, e("div",{className:"absolute -top-1 h-5 w-px bg-white/60"}),
        e("span",{className:"absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[11px] "+(f.batida ? "font-bold text-white" : "text-white/65"), style:{left:ult ? "-10px" : "0"}}, p.setor==="inad" ? int(f.alvo/1000)+" mil" : int(f.alvo)),
        e("span",{className:"absolute top-5 -translate-x-1/2 whitespace-nowrap text-[11px] "+MONO+(f.batida ? " font-bold" : ""), style:{left:ult ? "-22px" : "0", color:f.batida ? "#4ADE80" : "rgba(255,255,255,.75)"}}, "R$ "+int(f.total))); }));
  var inp = function(v, cb, w, ph){ return e("input",{key:String(v)+ph, defaultValue:v, placeholder:ph||"", className:INPUT+" h-9! "+(w||"w-28"), onBlur:function(ev){ if(ev.target.value!==String(v)) cb(ev.target.value); }}); };
  var num = function(v, cb, w){ return e("input",{key:"n"+v, type:"number", min:0, defaultValue:v, className:INPUT+" h-9! text-center "+MONO+" "+(w||"w-24"), onBlur:function(ev){ var x = Number(ev.target.value); if(x!==v && x>=0) cb(x); }}); };
  return e(Pagina,null,
    e(PageHead,{t:cfg.titulo, sub:"Fecha em "+(m.fechamento||"—")+(m.pagamento ? " · pagamento "+m.pagamento : "")}, seletor, dono && e(Btn,{v:edit ? "primary" : "secondary", sm:true, onClick:function(){ setEdit(!edit); }}, edit ? "✓ Concluir" : "✎ Editar")),
    e(Faixa,{n:4},
      e(Indicador,{t:cfg.medida, v:cfg.fmt(r.medido), cor:"total", sub:p.setor==="cadastro" ? "início do mês: "+int(r.inicio) : null}),
      e(Indicador,{t:cfg.falta, v:r.prox ? (p.setor==="inad" ? BK(r.falta) : "+"+int(r.falta)) : "—", cor:r.prox ? "aviso" : "ok", sub:r.prox ? "alvo "+(p.setor==="inad" ? BK(r.prox.alvo) : int(r.prox.alvo)) : "todas as faixas batidas"}),
      e(Indicador,{t:"Bônus agora", v:BK(r.total), cor:r.total>0 ? "ok" : "total", sub:r.faixa ? "faixa "+(p.setor==="inad" ? BK(r.faixa.alvo) : int(r.faixa.alvo)) : "abaixo da 1ª faixa"}),
      e(Indicador,{t:"Máximo da meta", v:BK(r.max), cor:"total"})),
    e(BlocoBarra,{cor:p.setor==="inad" ? "vermelho" : "laranja", t:"Faixas", sub:"vale a maior faixa atingida", compacto:true}, barra),
    e("div",{className:"grid grid-cols-1 gap-2.5 lg:grid-cols-2"},
      e(BlocoBarra,{cor:"ouro", t:"Quem recebe", sub:"valor na faixa atual · máximo entre parênteses", compacto:true, dir:BK(r.total)}, e("div",{className:"flex flex-col divide-y divide-white/10 px-4 py-1"},
        r.porPessoa.map(function(x, i){ return e("div",{key:x.nome+i, className:"flex items-center justify-between gap-2 py-1.5 text-[13px]"},
          edit ? e("span",{className:"flex items-center gap-2"}, inp(x.nome, function(v){ act("equipe_set", {idx:i, patch:{nome:v.trim()||x.nome}}); }, "w-36"), num(Math.round(x.parte*100), function(v){ act("equipe_set", {idx:i, patch:{parte:v/100}}); }, "w-20"), e("span",{className:"text-[11px] text-white/60"}, "%"), e("button",{onClick:function(){ act("equipe_del", {idx:i}); }, "aria-label":"Remover", className:"text-white/50 hover:text-red-400"}, "✕"))
            : e("span",null, x.nome, x.parte<1 && p.setor==="cadastro" ? e("span",{className:"ml-1 text-[11px] text-white/55"}, "("+Math.round(x.parte*100)+"%)") : null),
          e("span",{className:MONO}, BK(x.valor)+" ", e("span",{className:"text-[11px] text-white/55"}, "(até "+BK(x.max)+")"))); }),
        edit && e("div",{className:"flex items-center gap-2 py-2"}, e("input",{value:nomeE, placeholder:"Incluir pessoa", className:INPUT+" h-9! w-44", onChange:function(ev){ setNomeE(ev.target.value); }}), e(Btn,{v:"secondary", sm:true, disabled:!nomeE.trim(), onClick:function(){ act("equipe_add", {nome:nomeE, parte:1}); setNomeE(""); }}, "+ Incluir")))),
      p.setor==="inad"
        ? e(BlocoBarra,{cor:"vermelho", t:"Recebido na conta da Sorelly", sub:"lance o que entrou", compacto:true, dir:BK(r.medido)}, e("div",{className:"flex flex-col gap-1.5 px-4 py-2"},
            e("div",{className:"flex flex-wrap items-center gap-2"}, e("input",{type:"date", value:novo.data, className:INPUT+" h-9! w-36", onChange:function(ev){ setNovo(Object.assign({}, novo, {data:ev.target.value})); }}),
              e(Dinheiro,{value:novo.valor||0, label:"Valor recebido", out:"ponto", className:"w-32", onChange:function(v){ setNovo(Object.assign({}, novo, {valor:Number(v)||0})); }}),
              e("input",{value:novo.obs, placeholder:"Observação", className:INPUT+" h-9! min-w-[8rem] flex-1", onChange:function(ev){ setNovo(Object.assign({}, novo, {obs:ev.target.value})); }}),
              e(Btn,{v:"primary", sm:true, disabled:!(novo.valor>0), onClick:function(){ act("lanc_add", {data:novo.data, valor:novo.valor, obs:novo.obs}); setNovo(Object.assign({}, novo, {valor:0, obs:""})); }}, "Lançar")),
            (m.lanc||[]).length===0 ? e("p",{className:"py-2 text-center text-[12.5px] text-white/60"}, "Nada lançado neste mês.") : (m.lanc||[]).slice().sort(function(a, b){ return b.data.localeCompare(a.data); }).map(function(x){
              return e("div",{key:x.id, className:"flex items-center justify-between gap-2 border-t border-white/10 py-1 text-[12.5px]"}, e("span",null, x.data.split("-").reverse().join("/")+(x.obs ? " · "+x.obs : "")+" · "+x.por), e("span",{className:"flex items-center gap-2 "+MONO}, BK(x.valor), edit && e("button",{onClick:function(){ act("lanc_del", {id:x.id}); }, "aria-label":"Excluir", className:"text-white/50 hover:text-red-400"}, "✕"))); })))
        : e(BlocoBarra,{cor:"laranja", t:"Regra", compacto:true}, e("p",{className:"px-4 py-3 text-[12.5px] leading-snug text-white/80"}, m.obs || "—"))),
    edit && e(BlocoBarra,{cor:"ouro", t:"Editar faixas e prazos", sub:"vale só para "+rotuloMes(ym), compacto:true}, e("div",{className:"flex flex-col gap-2 p-3"},
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, [TH(p.setor==="inad" ? "Alvo (R$)" : "Alvo"), TH(p.setor==="cadastro" ? "Valor por pessoa" : "Valor total"), TH("")])),
        e("tbody",null, (m.faixas||[]).slice().sort(function(a, b){ return a.alvo-b.alvo; }).map(function(f){ return e("tr",{key:f.id, className:"border-t border-white/10"},
          e("td",{className:TDC}, num(f.alvo, function(v){ act("faixa_set", {id:f.id, patch:{alvo:v}}); }, "w-28")),
          e("td",{className:TDC}, e(Dinheiro,{value:f.valor, label:"Valor", out:"ponto", className:"w-32", onChange:function(v){ act("faixa_set", {id:f.id, patch:{valor:Number(v)||0}}); }})),
          e("td",{className:TDC}, e("button",{onClick:function(){ act("faixa_del", {id:f.id}); }, "aria-label":"Excluir faixa", className:"text-white/50 hover:text-red-400"}, "✕"))); })))),
      e("div",{className:"flex flex-wrap items-center gap-2"}, e("input",{type:"number", min:0, value:nfx.alvo, placeholder:"Novo alvo", className:INPUT+" h-9! w-28 text-center", onChange:function(ev){ setNfx(Object.assign({}, nfx, {alvo:ev.target.value})); }}),
        e(Dinheiro,{value:nfx.valor||0, label:"Valor da nova faixa", out:"ponto", className:"w-32", onChange:function(v){ setNfx(Object.assign({}, nfx, {valor:Number(v)||0})); }}),
        e(Btn,{v:"secondary", sm:true, disabled:!(Number(nfx.alvo)>0), onClick:function(){ act("faixa_add", {alvo:Number(nfx.alvo), valor:nfx.valor}); setNfx({alvo:"", valor:0}); }}, "+ Faixa")),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Fechamento", inp(m.fechamento||"", function(v){ act("meta_set", {patch:{fechamento:v}}); }, "w-full")),
        e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Pagamento", inp(m.pagamento||"", function(v){ act("meta_set", {patch:{pagamento:v}}); }, "w-full", "ex.: 12 e 13/11"))),
      e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold"}, "Regra", e("textarea",{key:m.obs, defaultValue:m.obs||"", rows:3, className:INPUT+" w-full", onBlur:function(ev){ if(ev.target.value!==(m.obs||"")) act("meta_set", {patch:{obs:ev.target.value}}); }})))),
    e("p",{className:"text-center text-[11.5px] text-white/55"}, "A meta muda todo mês: escolha o mês no alto e ajuste faixas e prazos. O bônus do Link de pagamento (Helen) fica em Comissões → Link de pagamento."));
}
function AbaComCadastro(){ return e(MetaTela,{setor:"cadastro"}); }
function AbaComInad(){ return e(MetaTela,{setor:"inad"}); }
export { AbaComCadastro, AbaComInad };
