// Sorelly Admin · montagem — pages/BonusMontagem.js
// Financeiro › Comissões › Montagem de kits (12/11/2026, Marcus): bônus das montadoras pela regra da planilha (meta por dia) com a nota do kit dada pela revendedora.
// UMA tela com abas: Resumo do mês, Dia a dia, Lançar dia e Regras. Contas em domain/bonus-montagem.js (estado s.bm, ação BM). Tabelas no layout D.
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Botao, CAMPO, CampoSel, FileiraCampos, Rotulo, TabelaCampos, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { notasDoMes } from "@/apps/montagem/domain/avaliacoes-kits";
import { bonusDoDia, diasDoMes, lancadoNoDia, mesesDe, resumoMes } from "@/apps/montagem/domain/bonus-montagem";
import { hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { papelDe } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var VERDE = "#22C55E", AMARELO = "#FBBF24", VERMELHO = "#EF4444";
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
var nomeMes = function(m){ return MESES[+m.slice(5, 7)-1]+" de "+m.slice(0, 4); };
var dataBr = function(d){ return d.slice(8, 10)+"/"+d.slice(5, 7)+"/"+d.slice(0, 4); };
var diaSemana = function(d){ return SEMANA[new Date(d+"T12:00:00Z").getUTCDay()]; };
var nota1 = function(n){ return n.toFixed(2).replace(".", ","); };
var reais = function(v){ return brl(v); };
var texto = function(t){ return e("p",{className:"text-center text-[13px] text-foreground"}, t); };

// ── Resumo do mês: uma fileira por colaboradora ──
// "Bônus" = normal + especial antes da nota (a separação aparece no Dia a dia); "Bônus a pagar" = depois do corte pela nota. Larguras medidas para caber sem rolar em tela de 1600 px.
var COLS_RESUMO = [{t:"Colaboradora", w:"11.3%"}, {t:"Kits normais", w:"9.1%"}, {t:"Kits especiais", w:"9.6%"}, {t:"Dias com bônus", w:"10.6%"}, {t:"Bônus", w:"8.8%"},
  {t:"Avaliações", w:"8.2%"}, {t:"Nota do kit", w:"8.3%"}, {t:"Pela nota", w:"7.5%"}, {t:"Bônus a pagar", w:"9.9%"}, {t:"Supervisão", w:"8.2%"}, {t:"Total"}];
function AbaResumo(p){
  var r = resumoMes(p.bm, p.mes, p.notas), c = p.bm.cfg, temNotas = Object.keys(p.notas || {}).length>0;
  if(!r.linhas.length) return texto("Nenhum kit lançado em "+nomeMes(p.mes)+".");
  var corNota = function(o){ return o.nota===null ? undefined : o.fator===1 ? VERDE : o.fator===0 ? VERMELHO : AMARELO; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(TabelaCampos,{cols:COLS_RESUMO, minW:"78rem"},
      r.linhas.map(function(o){ return e(FileiraCampos,{key:o.c, cells:[o.c, inteiro(o.n), inteiro(o.e), inteiro(o.diasBonus), reais(o.bruto),
        o.aval ? inteiro(o.aval) : "—", {v:o.nota===null ? "Sem nota" : nota1(o.nota), cor:corNota(o)}, {v:Math.round(o.fator*100)+"%", cor:o.fator<1 ? corNota(o) : undefined},
        reais(o.pagar), o.sup ? reais(o.sup) : "—", reais(o.total)]}); }),
      e(FileiraCampos,{total:true, cells:["Total", inteiro(r.tot.n), inteiro(r.tot.e), inteiro(r.tot.diasBonus), reais(r.tot.bruto), inteiro(r.tot.aval), "", "", reais(r.tot.pagar), reais(r.tot.sup), reais(r.tot.total)]})),
    r.supSemDestino>0 && texto("Supervisão dos kits especiais sem destinatária definida: "+reais(r.supSemDestino)+"."),
    r.fonte && texto("Kits: "+r.fonte+"."),
    texto(temNotas ? "Notas: as mesmas da tela Cadastro de revendedoras › Avaliações › Kits"+(p.lidoEm ? ", lidas em "+dataBr(p.lidoEm.slice(0, 10)) : "")+"." : "Notas: nenhuma avaliação das revendedoras neste mês. Sem nota, o bônus não é cortado."),
    c.supNormalPara && texto("A supervisão dos kits normais vai para "+c.supNormalPara+"."));
}

// ── Dia a dia: todas somadas (um dia por fileira) ou os dias de uma colaboradora ──
var COLS_DIA_TODAS = [{t:"Data", w:"12%"}, {t:"Dia da semana", w:"14%"}, {t:"Colaboradoras", w:"12%"}, {t:"Com bônus", w:"11%"}, {t:"Kits normais", w:"12%"}, {t:"Kits especiais", w:"12%"}, {t:"Bônus do dia", w:"13%"}, {t:"Supervisão"}];
var COLS_DIA_UMA = [{t:"Data", w:"12%"}, {t:"Dia da semana", w:"14%"}, {t:"Kits normais", w:"12%"}, {t:"Kits especiais", w:"12%"}, {t:"Bônus normal", w:"12.5%"}, {t:"Bônus especial", w:"12.5%"}, {t:"Bônus do dia", w:"12.5%"}, {t:"Supervisão"}];
function AbaDias(p){
  var st = useState(""), quem = st[0], nomes = resumoMes(p.bm, p.mes).linhas.filter(function(o){ return o.n+o.e>0; }).map(function(o){ return o.c; }).sort(function(a, b){ return a.localeCompare(b); });
  var sel = nomes.indexOf(quem)>=0 ? quem : "", r = diasDoMes(p.bm, p.mes, sel);
  if(!nomes.length) return texto("Nenhum kit lançado em "+nomeMes(p.mes)+".");
  var seletor = e("div",{className:"flex justify-center"}, e(CampoSel,{t:"Colaboradora", id:"bm-quem", cls:"w-56", value:sel, onChange:st[1], opcoes:[["", "Todas"]].concat(nomes.map(function(n){ return [n, n]; }))}));
  var tabela = sel
    ? e(TabelaCampos,{cols:COLS_DIA_UMA, minW:"64rem"},
        r.linhas.map(function(o){ return e(FileiraCampos,{key:o.d, cells:[dataBr(o.d), diaSemana(o.d), inteiro(o.n), inteiro(o.e), reais(o.bNormal), reais(o.bEspecial), {v:reais(o.bonus), cor:o.bonus>0 ? VERDE : undefined}, reais(o.sup)]}); }),
        e(FileiraCampos,{total:true, cells:["Total", r.linhas.length+" dias", inteiro(r.tot.n), inteiro(r.tot.e), reais(r.tot.bNormal), reais(r.tot.bEspecial), reais(r.tot.bonus), reais(r.tot.sup)]}))
    : e(TabelaCampos,{cols:COLS_DIA_TODAS, minW:"64rem"},
        r.linhas.map(function(o){ return e(FileiraCampos,{key:o.d, cells:[dataBr(o.d), diaSemana(o.d), inteiro(o.pessoas), inteiro(o.comBonus), inteiro(o.n), inteiro(o.e), reais(o.bonus), reais(o.sup)]}); }),
        e(FileiraCampos,{total:true, cells:["Total", r.linhas.length+" dias", "", inteiro(r.tot.comBonus), inteiro(r.tot.n), inteiro(r.tot.e), reais(r.tot.bonus), reais(r.tot.sup)]}));
  return e("div",{className:"flex flex-col gap-2.5"}, seletor, tabela);
}

// ── Lançar dia: kits normais e especiais de cada colaboradora numa data ──
var COLS_LANCAR = [{t:"Colaboradora", w:"34%"}, {t:"Kits normais", w:"22%"}, {t:"Kits especiais", w:"22%"}, {t:"Bônus do dia"}];
var CAMPO_NUM = "h-[30px] w-20 rounded-md border border-border bg-card text-center text-[13px] tabular-nums text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
function FormDia(p){
  var ja = lancadoNoDia(p.bm, p.data), ini = {};
  p.bm.pessoas.forEach(function(n){ ini[n] = {n:ja[n] ? String(ja[n].n) : "", e:ja[n] ? String(ja[n].e) : ""}; });
  var st = useState(ini), v = st[0], c = p.bm.cfg;
  var muda = function(nome, campo, valor){ var o = Object.assign({}, v); o[nome] = Object.assign({}, o[nome]); o[nome][campo] = valor.replace(/\D/g, "").slice(0, 2); st[1](o); };
  var campo = function(nome, k, rot){ return e("input",{type:"text", inputMode:"numeric", "aria-label":rot+" de "+nome, value:v[nome][k], placeholder:"0", onChange:function(ev){ muda(nome, k, ev.target.value); }, className:CAMPO_NUM}); };
  var total = 0;
  var fileiras = p.bm.pessoas.map(function(nome){ var b = bonusDoDia(v[nome].n, v[nome].e, c).total; total += b;
    return e(FileiraCampos,{key:nome, cells:[nome, campo(nome, "n", "Kits normais"), campo(nome, "e", "Kits especiais"), {v:reais(b), cor:b>0 ? VERDE : undefined}]}); });
  var salvar = function(){ p.d({type:"BM", op:"dia_set", data:p.data, hoje:p.hoje, itens:p.bm.pessoas.map(function(nome){ return {c:nome, n:Number(v[nome].n||0), e:Number(v[nome].e||0)}; })}); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(TabelaCampos,{cols:COLS_LANCAR, minW:"40rem"}, fileiras, e(FileiraCampos,{total:true, cells:["Total", "", "", reais(total)]})),
    e("div",{className:"flex justify-center"}, e(Botao,{principal:true, onClick:salvar}, "Salvar dia")));
}
function AbaLancar(p){
  var st = useState(p.hoje), data = st[0];
  return e("div",{className:"mx-auto flex w-full max-w-3xl flex-col gap-2.5"},
    e("div",{className:"flex justify-center"}, e("div",{className:"w-44"}, e(Rotulo,{t:"Data", id:"bm-data"}),
      e("input",{id:"bm-data", type:"date", value:data, max:p.hoje, onChange:function(ev){ if(ev.target.value) st[1](ev.target.value); }, className:CAMPO+" text-center"}))),
    e(FormDia,{key:data, bm:p.bm, data:data, hoje:p.hoje, d:p.d}));
}

// ── Regras: duas colunas (Regra | O que vale), lidas da configuração ──
function AbaRegras(p){
  var c = p.bm.cfg, n = function(x){ return String(x).replace(".", ","); };
  var linhas = [
    ["Contagem", "Por dia e por colaboradora. Os dias não se somam."],
    ["Kit normal", "Kit de até "+reais(c.limiteEspecial)+"."],
    ["Kit especial", "Kit acima de "+reais(c.limiteEspecial)+"."],
    ["Bônus do kit normal", c.metaNormal+" kits no dia = "+reais(c.baseNormal)+". Cada kit acima de "+c.metaNormal+" = "+reais(c.extraNormal)+"."],
    ["Bônus do kit especial", c.metaEspecial+" kits no dia = "+reais(c.baseEspecial)+". Cada kit acima de "+c.metaEspecial+" = "+reais(c.extraEspecial)+"."],
    ["Abaixo da meta do dia", reais(0)+" naquele dia."],
    ["Nota do kit", "A revendedora avalia o kit no aplicativo quando recebe. Nota de 1 a 5 estrelas."],
    ["Corte pela nota", "Abaixo de "+n(c.notaZero)+" não paga. Abaixo de "+n(c.notaMetade)+" paga metade. De "+n(c.notaMetade)+" em diante paga tudo."],
    ["Sem avaliação no mês", "O bônus não é cortado."],
    ["Supervisão do kit normal", reais(c.supBaseNormal)+" por colaboradora que bate a meta no dia. Cada kit acima de "+c.metaNormal+" = "+reais(c.supExtraNormal)+"."],
    ["Supervisão do kit especial", reais(c.supBaseEspecial)+" por colaboradora que bate a meta no dia. Cada kit acima de "+c.metaEspecial+" = "+reais(c.supExtraEspecial)+"."],
    ["Quem recebe a supervisão", "Kit normal: "+(c.supNormalPara || "a definir")+". Kit especial: "+(c.supEspecialPara || "a definir")+"."],
    ["A nota e a supervisão", "A nota corta só o bônus da colaboradora. A supervisão não muda."]];
  return e(TabelaCampos,{cols:[{t:"Regra", w:"15rem"}, {t:"O que vale"}], minW:"58rem"}, linhas.map(function(l){ return e(FileiraCampos,{key:l[0], cells:[l[0], l[1]]}); }));
}

function AbaBonusMontagem(){
  var cx = use(), s = cx.state, bm = s.bm, hoje = hojeSP(), stAba = useState("resumo"), stMes = useState("");
  var cab = function(filhos){ return e(PageHead,{t:"Bônus da montagem", sub:"Kits montados por dia, nota do kit dada pela revendedora e valor a pagar."}, filhos); };
  if(!bm) return e(Pagina,null, cab(null), texto("Dados do bônus da montagem indisponíveis."));
  var podeLancar = papelDe(s.usuario)==="supervisao";   // Diretoria e supervisão da montagem (Deysiane) lançam os kits do dia
  var meses = mesesDe(bm); if(meses.indexOf(hoje.slice(0, 7))<0) meses = [hoje.slice(0, 7)].concat(meses);
  var comDados = mesesDe(bm), mes = meses.indexOf(stMes[0])>=0 ? stMes[0] : (comDados[0] || meses[0]);
  var abas = [["resumo", "Resumo do mês"], ["dias", "Dia a dia"]].concat(podeLancar ? [["lancar", "Lançar dia"]] : [], [["regras", "Regras"]]);
  var aba = abas.some(function(a){ return a[0]===stAba[0]; }) ? stAba[0] : "resumo";
  var corpo = aba==="resumo" ? e(AbaResumo,{bm:bm, mes:mes, notas:notasDoMes(s.avk, mes), lidoEm:(s.avk && s.avk.lidoEm) || ""}) : aba==="dias" ? e(AbaDias,{bm:bm, mes:mes}) : aba==="lancar" ? e(AbaLancar,{bm:bm, hoje:hoje, d:cx.dispatch}) : e(AbaRegras,{bm:bm});
  var seletorMes = (aba==="resumo" || aba==="dias") && e(CampoSel,{t:"Mês", id:"bm-mes", cls:"w-52", value:mes, onChange:stMes[1], opcoes:meses.map(function(m){ return [m, nomeMes(m)]; })});
  return e(Pagina,null, cab(seletorMes), e(AbasTela,{abas:abas, atual:aba, onMudar:stAba[1]}), e("div",{key:aba+mes, className:"flex flex-col gap-2.5"}, corpo));
}

export { AbaBonusMontagem };
