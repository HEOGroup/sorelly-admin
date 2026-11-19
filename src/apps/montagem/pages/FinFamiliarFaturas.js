// Sorelly Admin · montagem — pages/FinFamiliarFaturas.js
// Financeiro familiar › Faturas do cartão (Marcus, 19/11/2026). Começa com o Itaú Black: cada linha da fatura é comparada com as contas lançadas no cartão,
// para ver o que FALTA no sistema, o que SOBRA e se o total fecha. Só leitura (a conferência nunca cria nem apaga conta). Dados em ff.faturas (servidor).
// Mês da fatura = mês do VENCIMENTO (fecha dia 18, vence dia 25). A de novembro é só prévia: traz as parcelas já listadas na fatura de outubro.
import { Pagina } from "@/apps/montagem/components/padrao";
import { Segmentado } from "@/apps/montagem/components/padrao-fin";
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { conferirFatura } from "@/apps/montagem/domain/faturas-cartao";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useMemo, useState } from "@/shared/react";

var SEM = {};   // estado ainda sem ff (identidade fixa para o useMemo)
var MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
var rotuloMes = function(ym){ return MES[Number(ym.slice(5, 7))-1]+"/"+ym.slice(0, 4); };
var dia = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };
var CORES = {"Lançada":"text-emerald-400 font-semibold", "Falta no sistema":"text-red-400 font-semibold", "Estorno":"text-emerald-400", "Aberta":"text-amber-400 font-semibold", "Parcial":"text-amber-400 font-semibold", "Paga":"text-emerald-400 font-semibold"};
var COLS = [
  {k:"d", t:"Data"}, {k:"est", t:"Estabelecimento"}, {k:"par", t:"Parcela"}, {k:"tipo", t:"Tipo"},
  {k:"v", t:"Valor", fmt:BK, cor:function(l){ return l.v<0 ? "text-emerald-400" : ""; }},
  {k:"situacao", t:"Situação", cor:function(l){ return CORES[l.situacao] || ""; }}, {k:"conta", t:"Conta no sistema"}, {k:"pessoa", t:"Pessoa"}];
var COLS_SOBRA = [
  {k:"desc", t:"Conta lançada no cartão"}, {k:"pessoa", t:"Pessoa"}, {k:"v", t:"Valor", fmt:BK}, {k:"pago", t:"Pago", fmt:BK},
  {k:"status", t:"Situação", cor:function(l){ return CORES[l.status] || ""; }}];

function AbaFfFaturas(){
  var cx = use(), s = cx.state, ff = s.ff || SEM, lista = (ff.faturas && ff.faturas.lista) || [];
  var sv = useState(""), escolhida = sv[0];
  var fat = lista.find(function(f){ return f.ym===escolhida; }) || lista[lista.length-1];
  var conf = useMemo(function(){ return fat ? conferirFatura(ff, fat) : null; }, [ff, fat]);
  var cab = e(PageHead,{t:"Faturas do cartão", sub:"Cada linha da fatura comparada com as contas lançadas no cartão."},
    lista.length>0 && e(Segmentado,{opcoes:lista.map(function(f){ return [f.ym, rotuloMes(f.ym)+(f.previa ? " (prévia)" : "")]; }), atual:fat ? fat.ym : "", onMudar:sv[1]}));
  if(!temAutorizacao("financeiro_familia", s.usuario)) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Só os sócios abrem o Financeiro familiar."));
  if(!fat || !conf) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Nenhuma fatura importada ainda."));
  var r = conf.resumo, cartao = conf.cartao || {};
  var pago = fat.pago ? BK(fat.pago.valor) : "Em aberto";
  var linhasResumo = [
    {r:"Cartão", v:cartao.nome || "—", p:cartao.titular || ""},
    {r:fat.previa ? "Total (só as parcelas)" : "Total da fatura", v:BK(r.total), p:"vence "+dia(fat.venc), total:true},
    {r:"Pagamento", v:pago, p:fat.pago ? dia(fat.pago.em) : "", cor:fat.pago ? "ok" : "alerta"},
    {r:"Linhas da fatura", v:BK(r.somaLinhas), p:r.nLinhas+" linhas"},
    {r:"Já lançadas no sistema", v:BK(r.lancadas), p:r.nLancadas+" linhas", cor:"ok"},
    {r:"Falta no sistema", v:BK(r.falta), p:r.nFalta+" linhas", cor:r.nFalta>0 ? "ruim" : "ok"},
    {r:fat.previa ? "Contas sem parcela na fatura" : "Sobra no sistema", v:BK(r.sobra), p:r.nSobra+" contas", cor:r.nSobra>0 ? "alerta" : "ok"},
    {r:"Diferença (total menos linhas)", v:BK(r.diferenca), p:Math.abs(r.diferenca)<0.005 ? "fecha" : "não fecha", cor:Math.abs(r.diferenca)<0.005 ? "ok" : "ruim"}];
  var rodape = function(ls){ return ["Total", ls.length+" linhas", "", "", BK(ls.reduce(function(t, l){ return t+l.v; }, 0)), "", "", ""]; };
  var rodapeSobra = function(ls){ return ["Total", ls.length+" contas", "", BK(ls.reduce(function(t, l){ return t+l.v; }, 0)), BK(ls.reduce(function(t, l){ return t+l.pago; }, 0)), ""]; };
  return e(Pagina,null, cab,
    e("div",{className:"max-w-xl"}, e(BlocoResumo,{t:"Fatura de "+rotuloMes(fat.ym)+(fat.previa ? " · prévia" : ""), compacto:true, cab:["Item", "Valor", "Detalhe"], linhas:linhasResumo})),
    conf.semSistema && e("p",{className:"py-1 text-center text-[13px] text-foreground"}, "O sistema não tem contas lançadas no cartão em "+rotuloMes(fat.ym)+" (o Financeiro familiar começa em agosto)."),
    e(TabelaPlanilha,{key:fat.id, cols:COLS, linhas:conf.linhas, chave:"id", grade:true, centro:true, semLimpar:true, limite:200, totalRodape:rodape, vazio:"Fatura sem linhas."}),
    conf.sobras.length>0 && e("div",{className:"flex flex-col gap-2"},
      e("h2",{className:"text-center text-[13px] font-semibold"}, "Contas lançadas no cartão sem linha na fatura"),
      e(TabelaPlanilha,{key:fat.id+"-sobra", cols:COLS_SOBRA, linhas:conf.sobras, chave:"id", grade:true, centro:true, semLimpar:true, semContagem:true, totalRodape:rodapeSobra})),
    e("p",{className:"text-center text-[11px] text-foreground"}, fat.fonte || ""));
}

export { AbaFfFaturas };
