// Sorelly Admin · montagem — pages/MetasNotificacoes.js
// Metas › Notificações (Marcus, 03/11/2026; protótipo aprovado em docs/ideias/metas-notificacoes-app.html): em cima o desempenho da revendedora escolhida e o celular (iPhone 15) com
// duas telas, Notificação e Minha Meta; embaixo a tabela com os textos. Só leitura, revendedoras reais (lib/metas-dados.js). O envio do push é do backend do app.
// A venda mostrada é a do acerto já lançado (DevMaster). O tempo real do app (último acesso, vendas do dia) entra quando o backend tiver a rota de admin (pendência com o Leonardo).
import { Pagina } from "@/apps/montagem/components/padrao";
import { CAMPO, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CAMPANHAS, MES_PADRAO } from "@/apps/montagem/domain/metas";
import { LIMITE_TEXTO, LIMITE_TITULO, PROGRAMA, TEXTOS, dadosDe, medidor, preenche, situacaoNotif } from "@/apps/montagem/domain/metas-notificacoes";
import { useMetas } from "@/apps/montagem/lib/metas-dados";
import { e, useMemo, useState } from "@/shared/react";

var TOPO = "-mt-4 gap-2";
var VERDE = "font-semibold text-[#4ADE80]", VERMELHO = "font-semibold text-[#EF4444]", AMARELO = "font-semibold text-[#FBBF24]";
var CORES = {ok:VERDE, alerta:AMARELO, ruim:VERMELHO};
var hojeIso = function(){ var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
var dm = function(iso){ return iso ? iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4) : "Sem data"; };
var TITULO_BLOCO = "rounded-t-lg border-b border-border px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[.05em] text-[#1a1306]";
var DEGRADE = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)"};

function Bloco(p){
  return e("section",{className:"flex min-w-0 flex-col rounded-lg border border-border bg-card/60"},
    e("h2",{className:TITULO_BLOCO, style:DEGRADE}, p.t), p.children);
}
function Linha(r, v){
  return e("div",{key:r, className:"grid min-h-8 grid-cols-2 items-center gap-2 border-b border-border px-3 py-0.5 text-center text-[13px] last:border-b-0"}, e("span",null, r), e("span",{className:"font-semibold tabular-nums"}, v));
}

// o celular: iPhone 15, 291 x 630 (proporção da tela real)
function Celular(p){
  var caixa = "mx-auto flex h-[630px] w-[291px] flex-col overflow-hidden rounded-[38px] border-[6px] border-[#2a2a2e] bg-black";
  if(p.vis === "n"){
    return e("div",{className:caixa},
      e("div",{className:"mx-auto mt-2 h-5 w-20 rounded-full bg-[#2a2a2e]"}),
      e("div",{className:"flex flex-1 flex-col items-center gap-1 bg-gradient-to-b from-[#241a0a] to-black px-3 pt-8 text-center"},
        e("div",{className:"text-[13px] font-semibold"}, p.data),
        e("div",{className:"text-[20px] font-semibold tabular-nums"}, p.hora),
        e("div",{className:"mt-4 flex w-full items-start gap-2 rounded-2xl bg-white/15 p-2 text-left"},
          e("div",{className:"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black text-[13px] font-semibold text-[#E8B84B]"}, "S"),
          e("div",{className:"min-w-0 flex-1"},
            e("div",{className:"flex gap-1.5"}, e("div",{className:"min-w-0 flex-1 text-[11px] font-semibold"}, p.titulo), e("div",{className:"text-[11px]"}, "agora")),
            e("div",{className:"text-[11px] leading-snug"}, p.texto)))));
  }
  var d = p.d, r = p.r;
  return e("div",{className:caixa},
    e("div",{className:"mx-auto mt-2 h-5 w-20 rounded-full bg-[#2a2a2e]"}),
    e("div",{className:"flex items-center justify-between px-4 py-2 text-[13px] font-semibold"}, e("span",null, "Minha Meta"), e("span",null, "🎯")),
    e("div",{className:"flex flex-1 flex-col gap-2 overflow-hidden px-3 text-[11px]"},
      e("div",{className:"rounded-xl bg-white/10 p-3 text-center"},
        e("div",{className:"text-[11px]"}, "Seu progresso"),
        e("div",{className:"mx-auto my-2 flex h-20 w-20 items-center justify-center rounded-full", style:{background:"conic-gradient(#E8B84B " + (d.pct * 3.6) + "deg,#2a2a2e 0)"}},
          e("span",{className:"flex h-14 w-14 items-center justify-center rounded-full bg-black text-[13px] font-semibold tabular-nums"}, d.pct + "%")),
        d.bateu2 ? "Meta 2 conquistada!" : "Faltam " + brl(d.falta) + " para o brinde extra"),
      e("div",{className:"rounded-xl bg-white/10 p-3 text-center"}, e("div",{className:"font-semibold"}, "Meta 1: " + brl(r.m1) + (d.vend >= r.m1 ? " ✓" : "")), "Brinde extra: BB " + brl(r.br1Bb) + " + Normal " + brl(r.br1No)),
      e("div",{className:"rounded-xl bg-white/10 p-3 text-center"}, e("div",{className:"font-semibold"}, "Meta 2: " + brl(r.m2) + (d.vend >= r.m2 ? " ✓" : "")), "Brinde extra maior: BB " + brl(r.br2Bb) + " + Normal " + brl(r.br2No)),
      e("div",{className:"flex h-8 items-center justify-center rounded-xl bg-[#E8B84B] text-[13px] font-semibold text-[#1a1306]"}, "Como bater minha meta")),
    e("div",{className:"grid h-12 grid-cols-4 items-center border-t border-white/15 text-center text-[11px]"},
      ["Início", "Pedidos", "Minha Meta", "Perfil"].map(function(n){
        return e("span",{key:n, className:n === "Minha Meta" ? "font-semibold text-[#E8B84B] [text-shadow:0_0_8px_#E8B84B]" : ""}, n); })));
}

function AbaMetasNotificacoes(){
  var m = useMetas(MES_PADRAO), dados = m.dados;
  var sb = useState(""), busca = sb[0], setBusca = sb[1], sc = useState(""), cod = sc[0], setCod = sc[1];
  var sv = useState("n"), vis = sv[0], setVis = sv[1], ss = useState(-1), sel = ss[0], setSel = ss[1];
  var lista = useMemo(function(){
    if(!dados) return [];
    var q = busca.trim().toLowerCase();
    return dados.itens.filter(function(i){ return !q || i.nome.toLowerCase().indexOf(q) >= 0 || String(i.cod).indexOf(q) >= 0; }).slice(0, 60);
  }, [dados, busca]);
  var titulo = e("h1",{className:"font-heading text-xl font-semibold leading-none"}, "Notificações - Metas de " + (CAMPANHAS[MES_PADRAO] ? CAMPANHAS[MES_PADRAO].nome.replace(" de ", " ") : MES_PADRAO));
  if(!m.ligado) return e(Pagina,{className:TOPO}, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));
  if(m.erro) return e(Pagina,{className:TOPO}, titulo, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, m.erro));
  if(!dados) return e(Pagina,{className:TOPO}, titulo, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo as revendedoras e as vendas… na primeira vez pode levar alguns segundos."));
  var r = dados.itens.filter(function(i){ return String(i.cod) === cod; })[0] || lista[0] || dados.itens[0];
  if(!r) return e(Pagina,{className:TOPO}, titulo, e("p",{className:"text-center text-[13px]"}, "Nenhuma revendedora."));
  var d = dadosDe(r, hojeIso()), s = situacaoNotif(r, d), idx = sel < 0 ? s.sug : sel;
  var t = preenche(TEXTOS[idx][2], r, d), b = preenche(TEXTOS[idx][3], r, d), med = medidor(t, b);
  var agora = new Date(), hora = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");
  var linhas = TEXTOS.map(function(x, i){
    var tt = preenche(x[2], r, d), bb = preenche(x[3], r, d);
    return {i:i, k:String(i), quando:x[0] + (i === s.sug ? " (sugerido)" : ""), tec:x[1], tit:tt, txt:bb, letras:tt.length + " / " + bb.length, tl:tt.length, bl:bb.length};
  });
  var cols = [{k:"quando", t:"Quando"}, {k:"tec", t:"Técnica de copy"}, {k:"tit", t:"Título"}, {k:"txt", t:"Texto"},
    {k:"letras", t:"Letras (título / texto)", cor:function(l){ return l.tl > LIMITE_TITULO || l.bl > 140 ? VERMELHO : l.bl > LIMITE_TEXTO ? AMARELO : VERDE; }},
    {k:"ver", t:"Ver no celular", render:function(v, l){ return e("button",{type:"button", onClick:function(){ setSel(l.i); setVis("n"); window.scrollTo({top:0, behavior:"smooth"}); }, className:CAMPO + " w-24 font-semibold hover:bg-white/10"}, "Ver"); }}];
  return e(Pagina,{className:TOPO}, titulo,
    e("div",{className:"grid items-start gap-2.5 lg:grid-cols-[360px_minmax(0,1fr)_300px]"},
      e("div",{className:"flex min-w-0 flex-col gap-2"},
        e("div",{className:"flex flex-col gap-2"},
          e("input",{type:"search", value:busca, placeholder:"Buscar revendedora por nome ou código", "aria-label":"Buscar revendedora", onChange:function(ev){ setBusca(ev.target.value); setSel(-1); }, className:CAMPO}),
          e("select",{value:String(r.cod), "aria-label":"Revendedora", onChange:function(ev){ setCod(ev.target.value); setSel(-1); }, className:CAMPO},
            lista.map(function(i){ return e("option",{key:i.cod, value:String(i.cod)}, i.nome + " · " + i.classeNome); }))),
        e(Bloco,{t:"Desempenho da revendedora"},
          Linha("Categoria", r.classeNome), Linha("Meta 1 / Meta 2", brl(r.m1) + " / " + brl(r.m2)), Linha("Vendido no app até o momento", d.vend ? brl(d.vend) : "Sem venda"),
          Linha("Falta para " + (d.bateu1 ? "a Meta 2" : "a Meta 1"), brl(d.falta)), Linha("Progresso", d.pct + "%"),
          e("div",{key:"sit", className:"grid min-h-8 grid-cols-2 items-center gap-2 border-b border-border px-3 py-0.5 text-center text-[13px]"}, e("span",null, "Situação"), e("b",{className:s.sit.indexOf("Bateu") === 0 ? VERDE : AMARELO}, s.sit)),
          Linha("Acerto previsto", r.acertoEm ? "Acertou em " + dm(r.acertoEm) : dm(r.prev)), Linha("Último acesso ao app", "Sem leitura ainda"), Linha("Texto sugerido", t))),
      e("div",{className:"flex min-w-0 flex-col gap-2.5"},
          e(Bloco,{t:"Medidor de letras"},
            Linha("Título", t.length + " / " + LIMITE_TITULO), Linha("Texto", b.length + " / " + LIMITE_TEXTO),
            e("p",{className:"px-3 py-2 text-center text-[13px] " + CORES[med.cor]}, med.aviso)),
          e(Bloco,{t:"3 por dia"},
            PROGRAMA.map(function(x){ return Linha(x.h, x.t); }),
            e("p",{className:"px-3 py-2 text-center text-[13px]"}, "Silêncio das 21:00 às 08:00. Nunca 2 sobre a meta seguidas."))),
      e("div",{className:"flex flex-col items-center gap-2"},
        e(Segmentado,{opcoes:[["n", "Notificação"], ["m", "Minha Meta"]], atual:vis, onMudar:setVis}),
        e(Celular,{vis:vis, titulo:t, texto:b, d:d, r:r, hora:hora, data:agora.toLocaleDateString("pt-BR", {weekday:"short", day:"numeric", month:"short"})}))),
    e("h2",{className:"text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, "Notificações (textos)"),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"k", centro:true, semContagem:true, semFiltro:true, vazio:"Nenhum texto."}),
    e("p",{className:"text-center text-[13px]"}, "Por enquanto o valor vendido vem do acerto já lançado na DevMaster. O tempo real do app entra quando o backend tiver a rota de leitura. O envio das notificações é do backend do app."));
}
export { AbaMetasNotificacoes };
