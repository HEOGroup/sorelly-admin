// Sorelly Admin · montagem — mobile/informativos-app.js
// Folders e informativos DENTRO dos apps (revendedora e representante). Sem papel, sem imagem: o conteúdo é editado no admin (Folders e informativos).
//  · FolderAoAbrir: o folder sobe por cima da tela ao abrir o app, respeitando o limite por dia, semana e mês (domain/informativos.js).
//  · TelaInformativos: cartão "Informativos" da tela inicial; lista (novos em cima) e o informativo aberto, com abas e blocos FECHADOS que abrem ao toque.
//  · LeitorInformativo: o miolo (abas + blocos), usado também na pré-visualização do admin.
// Visual simples (Marcus, 23/10/2026): fundo branco, letra preta, linhas finas, dourado só nos números. Nada de degradê, etiqueta ou ícone enfeitando.
import { modalidadeDe, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { infDoPublico, infLido, infNaoLidos, infParaAbrir, linhasFaixas } from "@/apps/montagem/domain/informativos";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";
import { createPortal } from "react-dom";

var INK = "text-[#161616]", MUT = "text-[#6a6a6a]", OURO = "text-[#9a7424]", LIN = "border-[#e4e1da]";

function TabelaFaixas(p){
  var vig = versaoVigente(p.s), versao = vig ? versaoEfetiva(vig, p.modalidade || "padrao") : null;
  if(!versao) return e("p",{className:"text-[12.5px] "+MUT}, "Tabela indisponível no momento.");
  var linhas = linhasFaixas(versao.faixas.filter(function(f){ return f.pct>0; }));
  var th = "pb-1.5 pl-1.5 text-[11px] font-semibold border-b border-[#161616] "+MUT;
  return e("table",{className:"w-full border-collapse text-[12px] tabular-nums"},
    e("thead",null, e("tr",null, e("th",{className:th+" text-left"}, "Venda"), e("th",{className:th+" text-right"}, "Comissão"), e("th",{className:th+" text-right"}, "Normal"), e("th",{className:th+" text-right"}, "Select"))),
    e("tbody",null, linhas.map(function(l){
      var td = "border-b py-2 pl-1.5 whitespace-nowrap "+LIN, tr = td+" text-right";
      return e("tr",{key:l.venda},
        e("td",{className:td+" text-left "+INK}, l.venda),
        e("td",{className:tr+" font-bold "+OURO}, l.comissao),
        l.normal || l.select ? [e("td",{key:"n", className:tr+" font-medium "+INK}, l.normal || "—"), e("td",{key:"s", className:tr+" font-medium "+INK}, l.select || "—")]
          : e("td",{colSpan:2, className:tr+" "+MUT}, "sem brinde")); })));
}
function Linhas(p){
  return e("div",{className:"flex flex-col gap-1"}, p.linhas.map(function(l, i){
    return e("div",{key:i, className:"flex items-baseline justify-between gap-3 text-[13px]"}, e("span",{className:"min-w-0 "+INK}, l.a), e("b",{className:"shrink-0 text-right "+INK}, l.b)); }));
}
// bloco fechado: título e valor sempre visíveis; o conteúdo abre ao toque
function BlocoFolder(p){
  var b = p.b, st = useState(!!b.aberto), aberto = st[0];
  var corpo = [b.tipo==="faixas" && e(TabelaFaixas,{key:"f", s:p.s, modalidade:p.modalidade}),
    b.tipo==="linhas" && (b.linhas||[]).length>0 && e(Linhas,{key:"l", linhas:b.linhas}),
    b.texto && e("p",{key:"t", className:"text-[13px] leading-snug "+(b.tipo==="texto" ? INK : MUT)}, b.texto)].filter(Boolean);
  return e("div",{className:"border-b "+LIN},
    e("button",{type:"button", onClick:function(){ st[1](!aberto); }, "aria-expanded":aberto, className:"flex w-full items-center gap-2 py-3 text-left"},
      e("b",{className:"min-w-0 flex-1 truncate text-[14.5px] "+INK}, b.titulo),
      b.valor && e("b",{className:"shrink-0 text-[14px] "+OURO}, b.valor),
      e(Icon,{n:"chevrondown", s:15, className:"shrink-0 "+MUT+" "+(aberto ? "rotate-180" : "")})),
    aberto && e("div",{className:"flex flex-col gap-2 pb-3"}, corpo));
}
// abas (linha fina embaixo da aba ativa) + blocos
function LeitorInformativo(p){
  var st = useState(0), i = Math.min(st[0], Math.max(0, p.inf.abas.length-1)), aba = p.inf.abas[i];
  return e("div",{className:"flex flex-col"},
    p.inf.abas.length>1 && e("div",{role:"tablist", className:"mb-1 flex border-b "+LIN}, p.inf.abas.map(function(a, n){
      return e("button",{key:a.id, type:"button", role:"tab", "aria-selected":n===i, onClick:function(){ st[1](n); },
        className:"-mb-px flex-1 truncate border-b-2 py-2.5 text-center text-[14px] "+(n===i ? "border-[#161616] font-bold "+INK : "border-transparent font-medium "+MUT)}, a.nome); })),
    aba ? aba.blocos.map(function(b){ return e(BlocoFolder,{key:b.id, b:b, s:p.s, modalidade:p.modalidade}); }) : null);
}

// ----- tela Informativos (cartão da tela inicial) -----
function TelaInformativos(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var st = useState(null), selId = st[0], lista = infDoPublico(s, p.publico);
  var sel = selId ? lista.find(function(i){ return i.id===selId; }) : null;
  var modalidade = p.modalidade || "padrao";
  useEffect(function(){ if(sel) d({type:"INF", op:"visto", id:sel.id, quem:p.quem, publico:p.publico, tipo:"aberto"}); }, [selId]);
  if(sel) return [e(CabecaTela,{key:"h", t:sel.titulo, sub:"Informativo", onVoltar:function(){ st[1](null); }}),
    e(FolhaTela,{key:"c"}, e(LeitorInformativo,{inf:sel, s:s, modalidade:modalidade}))];
  return [e(CabecaTela,{key:"h", t:"Informativos", sub:"Regras, avisos e novidades", onVoltar:p.onVoltar}),
    e(FolhaTela,{key:"c"}, lista.length===0
      ? e("p",{className:"py-6 text-center text-[13px] "+MUT}, "Nenhum informativo no momento.")
      : lista.map(function(i){
          var lido = infLido(s, i.id, p.quem);
          return e("button",{key:i.id, type:"button", onClick:function(){ st[1](i.id); }, className:"flex w-full items-center gap-2 border-b py-3 text-left "+LIN},
            e("span",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-[14.5px] "+INK}, i.titulo),
              e("span",{className:"block truncate whitespace-nowrap text-[12px] "+MUT}, i.abas.map(function(a){ return a.nome; }).join(" · "))),
            !lido && e("b",{className:"shrink-0 text-[12px] "+OURO}, "Novo"),
            e(Icon,{n:"chevron", s:15, className:"shrink-0 "+MUT})); }))];
}
// quantos informativos novos mostrar no cartão da tela inicial
function useNaoLidos(publico, quem){ var s = use().state; return infNaoLidos(s, publico, quem); }

// ----- folder que sobe ao abrir o app -----
function FolderAoAbrir(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var ini = useState(function(){ return infParaAbrir(s, p.publico, p.quem); }), inf = ini[0];
  var fe = useState(true), aberto = fe[0];
  var ref = useRef(null), al = useState(null);
  useEffect(function(){
    if(ref.current) al[1](ref.current.closest(".app-claro"));
    if(inf) d({type:"INF", op:"visto", id:inf.id, quem:p.quem, publico:p.publico, tipo:"popup"});
  }, []);
  var fechar = function(entendi){ if(entendi) d({type:"INF", op:"visto", id:inf.id, quem:p.quem, publico:p.publico, tipo:"entendi"}); fe[1](false); };
  var marca = e("span",{key:"m", ref:ref, className:"hidden"});
  if(!inf || !aberto || !al[0]) return marca;
  return [marca, createPortal(e("div",{key:"p", className:"absolute inset-0 z-50 flex flex-col justify-end bg-black/55", role:"dialog", "aria-modal":true, "aria-label":inf.titulo},
    e("div",{className:"mx-2 mb-3 mt-16 flex min-h-0 flex-1 flex-col rounded-3xl bg-white"},
      e("div",{className:"flex items-start justify-between gap-3 px-5 pb-1 pt-4"},
        e("div",{className:"min-w-0"}, e("p",{className:"text-[12px] font-medium "+MUT}, "Informativo"), e("h2",{className:"text-[23px] font-bold leading-tight tracking-tight "+INK}, inf.titulo)),
        e("button",{type:"button", onClick:function(){ fechar(false); }, "aria-label":"Fechar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-[#f1f0ec] "+MUT}, e(Icon,{n:"x", s:15}))),
      e("div",{className:"min-h-0 flex-1 overflow-y-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}, e(LeitorInformativo,{inf:inf, s:s, modalidade:p.modalidade})),
      e("div",{className:"px-5 pb-4 pt-2"}, e("button",{type:"button", onClick:function(){ fechar(true); }, className:"h-12 w-full rounded-xl bg-[#161616] text-[16px] font-semibold txt-branco"}, "Entendi")))), al[0])];
}

export { LeitorInformativo, TelaInformativos, FolderAoAbrir, useNaoLidos, modalidadeDe };
