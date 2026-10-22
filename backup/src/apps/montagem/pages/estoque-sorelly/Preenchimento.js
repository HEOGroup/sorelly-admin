// Sorelly Admin · montagem — pages/estoque-sorelly/Preenchimento.js
// Estoque Sorelly → aba "Preenchimento": escolhe o mês, lança a "Foto do estoque" e o "Fechamento do mês" (cada bloco salva separado) e mostra o histórico dos últimos 24 meses.
// A foto é do mês escolhido; o fechamento lançado junto vale para o mês ANTERIOR (o rótulo diz isso). Mês travado: só a diretoria altera.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { LINHA, Mosaico, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { CAMPOS_FECHAMENTO, CAMPOS_POSICAO, ROTULO_FECHAMENTO, ROTULO_POSICAO, esFormularioDoMes, esHistorico, lerMes, mesAnterior, mesSeguinte } from "@/apps/montagem/domain/estoque-sorelly";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { Bt, Ic, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { CONTAGEM, CampoEs, din, pt, useEs } from "@/apps/montagem/pages/estoque-sorelly/util";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var ROT_MES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
var nomeMes = function(am){ var m = lerMes(am); return m ? ROT_MES[m.mes-1]+" de "+m.ano : am; };
var chave = function(m){ return m.ano+"-"+(m.mes<10 ? "0" : "")+m.mes; };

// um bloco de campos (foto ou fechamento). inicial = valores já salvos; salvar(valores, dia) → true se aceito
function BlocoCampos(p){
  var st = useState(function(){ return Object.assign({}, p.inicial); }), v = st[0];
  var dst = useState(p.diaInicial || 1), dia = dst[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var bloq = p.travado && !p.admin;
  return e(BlocoBarra,{cor:"azul", t:p.titulo, sub:p.sub, compacto:true},
    e("div",{className:"flex flex-col gap-2.5 p-2.5"},
      p.travado && e("p",{className:"flex items-center justify-center gap-1.5 rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-center text-[12px] font-bold text-[#FBBF24]"}, e("i",{className:"ph-duotone ph-lock", style:{fontSize:14}}),
        p.admin ? "Mês travado. A diretoria pode alterar." : "Mês travado. Somente a diretoria altera."),
      p.comDia && e("div",{className:"mx-auto flex w-full max-w-40 flex-col gap-1 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/80"}, "Dia da foto"),
        e("input",{type:"number", min:1, max:31, step:1, disabled:bloq, value:dia, "aria-label":"Dia da foto", className:INPUT+" h-10! w-full text-center", onChange:function(ev){ dst[1](ev.target.value); }})),
      e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(10.5rem, 1fr))"}}, p.campos.map(function(k){
        return e(CampoEs,{key:k, rot:p.rotulos[k], valor:v[k], dinheiro:!CONTAGEM[k], disabled:bloq, ajuda:p.ajuda[k], onChange:function(x){ set(k, x); }}); })),
      e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:bloq, onClick:function(){ p.salvar(v, dia); }}, p.botao))));
}

function Historico(p){
  var ex = useState(null), conf = ex[0];
  var linhas = p.linhas.filter(function(h){ return p.pegar(h); });
  if(!linhas.length) return e(Vazio,{ic:"clipboard-text"}, p.vazio);
  return e(Tab,{cols:p.cols.concat(["Estado"])}, linhas.map(function(h){
    var r = p.pegar(h), id = r.id, estimado = r.simulados && r.simulados.length>0;
    return e("tr",{key:id, className:LINHA}, e(Td,{forte:true}, h.rotulo), p.celulas(r),
      e(Td,null, e("div",{className:"flex items-center justify-center gap-1"},
        estimado && e(Selo,{cor:"alerta", titulo:"Mês com número estimado"}, "Estimado"),
        e(Ic,{ic:r.travado ? "lock" : "lock-open", titulo:r.travado ? (p.admin ? "Destravar o mês" : "Mês travado") : (p.admin ? "Travar o mês" : "Mês aberto"), disabled:!p.admin, semAut:true, forte:r.travado, onClick:function(){ p.travar(id, !r.travado); }}),
        e(Ic,{ic:"trash", titulo:conf===id ? "Confirmar a remoção" : "Remover o lançamento", perigo:true, disabled:!p.admin, semAut:true, onClick:function(){ if(conf!==id){ ex[1](id); return; } ex[1](null); p.remover(id); }}),
        conf===id && e("span",{className:"text-[11px] font-bold text-[#F87171]"}, "Clique de novo")))); }));
}

function AbaPreenchimento(p){
  var ctx = useEs(), s = ctx.s, admin = ctx.admin, hoje = hojeSP();
  var st = useState(p.mesInicial || hoje.slice(0, 7)), am = st[0];
  var m = lerMes(am) || lerMes(hoje), anoMes = chave(m), fm = esFormularioDoMes(s, anoMes);
  var ant = mesAnterior(m.ano, m.mes), posSalva = s.es.posicoes.filter(function(x){ return x.id===anoMes; })[0];
  var diaPadrao = posSalva ? posSalva.dia : (anoMes===hoje.slice(0, 7) ? Number(hoje.slice(8, 10)) : 1);
  var ir = function(mm){ st[1](chave(mm)); };
  var hist = esHistorico(s, 24);
  var assinatura = JSON.stringify([fm.posicao, fm.fechamento, diaPadrao, s.es.config.ajuda]);

  var seletor = e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
    e(Ic,{ic:"caret-left", titulo:"Mês anterior", onClick:function(){ ir(ant); }}),
    e("label",{className:"inline-flex items-center gap-2 text-[12px] font-bold"}, "Mês da foto",
      e("input",{type:"month", value:anoMes, "aria-label":"Mês do lançamento", onChange:function(ev){ if(lerMes(ev.target.value)) st[1](ev.target.value); }, className:INPUT+" h-9! w-44 text-center text-[13px]!"})),
    e(Ic,{ic:"caret-right", titulo:"Próximo mês", onClick:function(){ ir(mesSeguinte(m.ano, m.mes)); }}),
    e("span",{className:"text-[12.5px] font-bold text-white/85"}, nomeMes(anoMes).replace(/^./, function(c){ return c.toUpperCase(); })));

  var blocoFoto = e(BlocoCampos,{key:"f"+assinatura, titulo:"Foto do estoque de "+fm.rotuloFoto, campos:CAMPOS_POSICAO, rotulos:ROTULO_POSICAO, inicial:fm.posicao, ajuda:fm.ajuda, admin:admin, travado:fm.posicaoTravada, comDia:true, diaInicial:diaPadrao, botao:"Salvar a foto",
    salvar:function(v, dia){ ctx.exec("lancar", {anoMes:anoMes, dia:dia, posicao:v, fechamento:{}}); }});
  var blocoFech = e(BlocoCampos,{key:"c"+assinatura, titulo:"Fechamento de "+fm.rotuloFechamento+" (preenchido em "+fm.rotuloFoto+")", campos:CAMPOS_FECHAMENTO, rotulos:ROTULO_FECHAMENTO, inicial:fm.fechamento, ajuda:fm.ajuda, admin:admin, travado:fm.fechamentoTravado, botao:"Salvar o fechamento",
    salvar:function(v){ ctx.exec("lancar", {anoMes:anoMes, posicao:{}, fechamento:v}); }});

  var travarPos = function(id, t){ ctx.exec("editar_posicao", {id:id, travado:t}); }, travarFec = function(id, t){ ctx.exec("editar_fechamento", {id:id, travado:t}); };
  var histFotos = e(BlocoBarra,{cor:"azul", t:"Histórico das fotos (24 meses)", compacto:true}, e("div",{className:"p-2"}, e(Historico,{linhas:hist, admin:admin, vazio:"Nenhuma foto lançada ainda.",
    cols:["Mês","Interno (peças)","Revendedoras (peças)","Custo total","Venda total","Rev. ativas"], pegar:function(h){ return h.posicao; },
    celulas:function(r){ var t = hist.filter(function(h){ return h.posicao===r; })[0].totais; return [e(Td,{key:"a", dinheiro:true}, pt(r.internoPecas)), e(Td,{key:"b", dinheiro:true}, pt(r.revPecas)), e(Td,{key:"c", dinheiro:true}, din(t && t.custo)), e(Td,{key:"d", dinheiro:true}, din(t && t.venda)), e(Td,{key:"e", dinheiro:true}, pt(r.qtdRevendedoras))]; },
    travar:travarPos, remover:function(id){ ctx.exec("remover_posicao", {id:id}); }})));
  var histFech = e(BlocoBarra,{cor:"azul", t:"Histórico dos fechamentos (24 meses)", compacto:true}, e("div",{className:"p-2"}, e(Historico,{linhas:hist, admin:admin, vazio:"Nenhum fechamento lançado ainda.",
    cols:["Mês","Vendido","Recebido","Custo do vendido","Brindes","Início","Entraram","Saíram"], pegar:function(h){ return h.fechamento; },
    celulas:function(r){ return [e(Td,{key:"a", dinheiro:true}, din(r.vendido)), e(Td,{key:"b", dinheiro:true}, din(r.recebido)), e(Td,{key:"c", dinheiro:true}, din(r.custoVendido)), e(Td,{key:"d", dinheiro:true}, din(r.brindeValor)), e(Td,{key:"e", dinheiro:true}, pt(r.revInicio)), e(Td,{key:"f", dinheiro:true}, pt(r.revEntraram)), e(Td,{key:"g", dinheiro:true}, pt(r.revSairam))]; },
    travar:travarFec, remover:function(id){ ctx.exec("remover_fechamento", {id:id}); }})));

  return e(Pagina,null, seletor, e(Mosaico,{min:"26rem"}, blocoFoto, blocoFech), e(Mosaico,{min:"30rem"}, histFotos, histFech));
}

export { AbaPreenchimento };
