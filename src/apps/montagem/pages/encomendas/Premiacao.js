// Sorelly Admin · montagem — pages/encomendas/Premiacao.js
// Encomendas e reposições › Premiação do mês (Marcus, 23/11/2026): só o Top 10 do mês pelo VALOR DE ACERTO, com a foto do prêmio e a descrição ao lado de cada colocação.
// Visual igual ao da Home do Financeiro familiar (bloco azul-marinho, letra de 11 px), 1º, 2º e 3º em ouro, prata e bronze, faixa de regras da campanha em cima e as 10 linhas dividindo a altura até o fim da página.
// Os prêmios do mês ficam em domain/premiacao-mes.js (fotos em public/premiacao/AAAA-MM/). Mês novo = a tela vira sozinha para o mês atual; sem campanha cadastrada, mostra o Top 10 sem prêmio.
// Dados: GET /api/encomendas/ranking (campo premiacao). Filtro e ordem no título de cada coluna.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { ESTADO, Pagina } from "@/apps/montagem/components/padrao";
import { PAGINA_CHEIA, CLS_FINA_ESPACO } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarReais } from "@/apps/montagem/domain/encomendas";
import { premiacaoDoMes } from "@/apps/montagem/domain/premiacao-mes";
import { useRanking } from "@/apps/montagem/pages/encomendas/Ranking";
import { e } from "@/shared/react";

var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
var nomeMes = function(ym){ return MESES[Number(String(ym).slice(5, 7))-1] || ""; };
var dia = function(iso){ var t = String(iso || "").slice(0, 10).split("-"); return t.length===3 ? t[2]+"/"+t[1] : ""; };
var PART = {da:1, de:1, do:1, das:1, dos:1, e:1};
var PART2 = {da:1, de:1, do:1, das:1, dos:1, e:1};
var nomeCurto = function(t){ var w = String(t || "").trim().split(" ").filter(Boolean); if(w.length<2) return w.join(" "); var o = [w[0]]; if(PART2[w[1].toLowerCase()] && w[2]){ o.push(w[1], w[2]); } else o.push(w[1]); return o.join(" "); };
var doisNomes = function(t){ var p = String(t || "").split(" - ")[0].trim().split(" ").filter(function(w, k){ return w && (k===0 || !PART[w.toLowerCase()]); }); return p.slice(0, 2).join(" "); };
var R = function(v){ return formatarReais(v); };
var COR_LUGAR = {1:"#E8B84B", 2:"#C9D1DC", 3:"#D98A4B"};   // ouro, prata e bronze; do 4º em diante, azul
var corLugar = function(n){ return COR_LUGAR[n] || "#6C8CD5"; };
var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c]";   // azul-marinho da Home do Financeiro familiar
var BORDA_LUGAR = {1:"[&>td:first-child]:!border-l-[#E8B84B]", 2:"[&>td:first-child]:!border-l-[#C9D1DC]", 3:"[&>td:first-child]:!border-l-[#D98A4B]"};   // classes escritas por inteiro para o Tailwind gerar

// A tabela ocupa até o fim da janela: as 10 linhas dividem a altura que sobra (mínimo de 56 px por linha)
var ajustaAltura = function(el){
  if(!el) return;
  var ajusta = function(){
    var sc = el.querySelector(".overflow-x-auto"); if(!sc) return;
    var t = sc.getBoundingClientRect().top, th0 = sc.querySelector("thead th"), hh = th0 ? th0.getBoundingClientRect().height : 30;
    var av = Math.max(300, window.innerHeight-t-6), lh = Math.max(28, (av-hh)/10);
    el.style.setProperty("--lh", lh.toFixed(2)+"px"); sc.style.height = av+"px"; sc.style.maxHeight = av+"px";
  };
  ajusta(); setTimeout(ajusta, 150);
  if(!el.__aj){ el.__aj = ajusta; window.addEventListener("resize", function(){ if(el.__aj) el.__aj(); }); } else el.__aj = ajusta;
};

function AbaEncPremiacao(){
  var rk = useRanking(), d = rk.dados, pr = d && d.premiacao ? d.premiacao : null;
  var camp = pr ? premiacaoDoMes(pr.ym) : null;
  var linhas = [];
  for(var i = 1; i<=10; i++){
    var x = pr ? pr.itens.filter(function(y){ return y.pos===i; })[0] : null, pz = camp ? camp.premios.filter(function(y){ return y.lugar===i; })[0] : null;
    linhas.push({id:"l"+i, pos:i, cod:x ? x.cod : "", nome:x ? nomeCurto(x.nome) : "—", rep:x ? doisNomes(x.rep) : "", venda:x ? x.venda : "", acerto:x ? x.acerto : "", foto:pz ? pz.foto : "", premio:pz ? pz : null});
  }
  var cols = [
    {k:"pos", t:"#", w:"3rem", render:function(v){ return e("span",{style:{color:corLugar(v), fontSize:"20px"}}, v+"º"); }},   // padrao-ok: número do lugar em 20 px (regra: número até 20 px)
    {k:"cod", t:"Código", w:"5rem"},
    {k:"nome", t:"Revendedora", w:"11rem"},
    {k:"rep", t:"Representante", w:"7.5rem"},
    {k:"venda", t:"Venda do mês", w:"8.5rem", render:function(v){ return e("span",{className:"text-[18px] tabular-nums text-white"}, v==="" ? "—" : R(v)); }},
    {k:"acerto", t:"Acerto do mês", w:"8.5rem", render:function(v){ return e("span",{className:"text-[15px] tabular-nums text-success"}, v==="" ? "—" : R(v)); }},
    {k:"foto", t:"Prêmio", w:"17rem", render:function(v, l){ return v ? e("img",{src:v, alt:"Prêmio do "+l.pos+"º lugar", style:{height:"calc(var(--lh, 52px) - 8px)", width:"100%", objectFit:"contain", background:"#000"}, className:"mx-auto block rounded"}) : e("span",null, "—"); }},
    {k:"premio", t:"Descrição do prêmio", render:function(v){ return v ? e("span",{className:"block whitespace-normal px-2 text-left text-[11px] leading-tight"},
      e("span",{className:"text-warning"}, "Porta-joias "+v.portaJoias.toLowerCase()), " + "+v.semijoias.join(" + ").toLowerCase(), v.extra ? e("span",{className:"text-success"}, " + "+v.extra) : null) : e("span",null, "—"); }}];
  var titulo = pr ? "Premiação de "+nomeMes(pr.ym)+" · Top 10 pelo acerto até "+dia(pr.ate) : "Premiação do mês";
  var regras = camp ? [
    ["Quem participa", "Revendedoras Sorelly"], ["Critério", "Maior soma de valores em acertos"], ["Período", "01/"+pr.ym.slice(5, 7)+" a "+dia(pr.ym+"-"+String(new Date(Number(pr.ym.slice(0, 4)), Number(pr.ym.slice(5, 7)), 0).getDate()))],
    ["Premiadas", "1º ao 10º lugar"], ["Divulgação", camp.divulgacao], ["Onde estão as regras", "Post fixado do Instagram @sorellyoficial"]] : [];
  var CICLO = ["ok", "info", "alerta", "info", "ok", "info"];
  return e(Pagina,{className:PAGINA_CHEIA},
    e(BlocoPainel,{titulo:titulo, compacto:true, cls:FUNDO},
      regras.length>0 && e("div",{className:"grid grid-cols-2 divide-x divide-white/30 border-b-2 border-[var(--bloco-titulo)] md:grid-cols-3 xl:grid-cols-6"}, regras.map(function(r, k){
        return e("div",{key:r[0], className:"flex min-w-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-center"},
          e("span",{className:"text-[11px]", style:{color:ESTADO[CICLO[k]]}}, r[0]), e("span",{className:"text-[11px] leading-tight text-white"}, r[1])); })),
      e("div",{ref:function(el){ ajustaAltura(el); }, className:CLS_FINA_ESPACO+" [&_table]:!min-w-[56rem] [&_th]:!font-normal [&_th]:!text-[11px] [&_td]:!text-[13px] [&_td]:!font-normal [&_td]:!h-[var(--lh)]", style:{"--lh":"52px"}},   // padrao-ok: linhas altas para caber a foto do prêmio; as 10 linhas dividem a altura que sobra
        e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", semCaixaAlta:true, grade:true, semMao:true, centro:true, semContagem:true, alturaMax:"calc(100vh - 12rem)",
          linhaCls:function(l){ return BORDA_LUGAR[l.pos] ? "[&>td:first-child]:!border-l-4 "+BORDA_LUGAR[l.pos] : "[&>td:first-child]:!border-l-4 [&>td:first-child]:!border-l-[#6C8CD5]"; },
          vazio:!d ? "Carregando a premiação." : d.erro ? "Não foi possível ler as vendas agora." : "Sem vendas no mês."}))));
}
export { AbaEncPremiacao };
