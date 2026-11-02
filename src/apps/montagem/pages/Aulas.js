// Sorelly Admin · montagem — pages/Aulas.js
// AULAS DO SETOR (02/11/2026, opção B aprovada pelo Marcus; desenho em docs/design/aulas-3-opcoes-pagina-geral.html): lista de setores em duas colunas; clicar abre o curso (módulos de um lado, vídeo do outro).
// Cada pessoa vê só os cursos do próprio setor; quem é responsável por mais de um setor vê todos (regra em domain/aulas.js). O que já foi assistido fica neste navegador.
import { Aviso, Botao } from "@/apps/montagem/components/padrao-fin";
import { AULAS, SETORES_AULAS, aulasDoSetor, lerVistas, marcarVista, minutos, setoresDaPessoa } from "@/apps/montagem/domain/aulas";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var LINHA = "flex w-full items-center gap-3 rounded-lg border border-border bg-card/60 px-3 py-2 text-left hover:border-primary";

function Selo(p){ return e("span",{className:"grid shrink-0 place-items-center rounded-md text-[13px] font-bold text-black "+(p.g ? "size-9" : "size-8"), style:{background:p.cor}}, String(p.nome).charAt(0)); }
function Barra(p){ return e("span",{className:"block h-1.5 w-full overflow-hidden rounded bg-white/10"}, e("i",{className:"block h-full bg-primary", style:{width:p.pct+"%"}})); }

function Curso(p){
  var st = p.setor, eu = p.eu, lista = aulasDoSetor(st.id), vistas = p.vistas;
  var ini = useState(null), aulaId = ini[0], setAulaId = ini[1];
  var modulos = []; lista.forEach(function(a){ if(modulos.indexOf(a.modulo)<0) modulos.push(a.modulo); });
  var atual = lista.find(function(a){ return a.id===aulaId; }) || lista.find(function(a){ return vistas.indexOf(a.id)<0; }) || lista[0];
  var feita = atual && vistas.indexOf(atual.id)>=0, prox = atual ? lista[lista.indexOf(atual)+1] : null;
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-3"}, e(Botao,{onClick:p.voltar}, "← Voltar às aulas"), e(Selo,{cor:st.cor, nome:st.nome, g:true}),
      e("div",{className:"min-w-0"}, e("h2",{className:"truncate text-[13px] font-semibold text-foreground"}, st.nome), e("p",{className:"text-[11px] uppercase tracking-wide text-foreground"}, lista.length+" aula"+(lista.length===1 ? "" : "s")+" · "+minutos(lista)+" min · "+lista.filter(function(a){ return vistas.indexOf(a.id)>=0; }).length+" assistida"+(lista.length===1 ? "" : "s")))),
    !lista.length ? e(Aviso,null, "Ainda não há aulas neste setor. Peça uma aula nova em Melhorias.") :
    e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-[18rem_minmax(0,1fr)]"},
      e("div",{className:"overflow-hidden rounded-lg border border-border bg-card/60"}, modulos.map(function(m){ return e("div",{key:m, className:"border-t border-border first:border-t-0"},
        e("p",{className:"bg-white/5 px-3 py-2 text-[13px] font-semibold text-foreground"}, m),
        lista.filter(function(a){ return a.modulo===m; }).map(function(a){ var ok = vistas.indexOf(a.id)>=0, on = atual && atual.id===a.id;
          return e("button",{key:a.id, type:"button", onClick:function(){ setAulaId(a.id); }, className:"flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-foreground hover:bg-white/10 "+(on ? "bg-primary/15" : "")},
            e("span",{className:"grid size-5 shrink-0 place-items-center rounded-full border text-[11px] "+(ok ? "border-success bg-success text-black" : on ? "border-primary text-primary" : "border-border")}, ok ? "✓" : on ? "▶" : ""),
            e("span",{className:"min-w-0 flex-1 truncate", title:a.titulo}, a.titulo), e("span",{className:"shrink-0 text-[11px] tabular-nums"}, a.dur)); })); })),
      atual && e("div",{className:"flex min-w-0 flex-col gap-3"},
        e("h3",{className:"text-[13px] font-semibold text-foreground"}, atual.titulo),
        atual.video ? e("video",{key:atual.id, controls:true, preload:"metadata", src:atual.video, className:"w-full max-w-[520px] rounded-lg border border-border bg-black"})
          : atual.url ? e("iframe",{key:atual.id, src:atual.url, title:atual.titulo, className:"h-[300px] w-full max-w-[520px] rounded-lg border border-border bg-black"})
          : e(Aviso,null, "O vídeo desta aula ainda não foi gravado."),
        e("div",{className:"flex flex-wrap items-center gap-2"},
          e(Botao,{principal:!feita, onClick:function(){ marcarVista(eu, atual.id, !feita); }}, feita ? "Desmarcar como assistida" : "Marcar como assistida"),
          prox && e(Botao,{onClick:function(){ setAulaId(prox.id); }}, "Próxima aula →"),
          atual.url && e("a",{href:atual.url, target:"_blank", rel:"noreferrer", className:"text-[13px] text-primary underline"}, "Abrir demonstração com legendas")),
        atual.passos && e("div",{className:"rounded-lg border border-border bg-card/60 p-3"}, e("p",{className:"mb-1 text-[13px] font-semibold text-foreground"}, "Passo a passo"),
          e("ol",{className:"flex list-decimal flex-col gap-1 pl-5 text-[13px] text-foreground"}, atual.passos.map(function(t, i){ return e("li",{key:i}, t); }))))));
}

function AbaAulas(){
  var cx = use(), s = cx.state, eu = s.usuario, tk = useState(0), setTk = tk[1], se = useState(null), sel = se[0], setSel = se[1];
  useEffect(function(){ var f = function(){ setTk(function(x){ return x+1; }); }; window.addEventListener("sorelly-aulas", f); return function(){ window.removeEventListener("sorelly-aulas", f); }; }, []);
  var vistas = lerVistas(eu), ver = setoresDaPessoa(s), setores = SETORES_AULAS.filter(function(x){ return ver.indexOf(x.id)>=0; });
  var st = sel && SETORES_AULAS.find(function(x){ return x.id===sel; });
  if(st) return e(Curso,{key:st.id, setor:st, eu:eu, vistas:vistas, voltar:function(){ setSel(null); }});
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Aulas do setor", sub:setores.length>2 ? "Escolha o setor para ver as aulas." : "Aulas do seu setor e aulas para todos."}),
    e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2"}, setores.map(function(x){
      var lista = aulasDoSetor(x.id), feitas = lista.filter(function(a){ return vistas.indexOf(a.id)>=0; }).length, pct = lista.length ? Math.round(feitas/lista.length*100) : 0;
      return e("button",{key:x.id, type:"button", onClick:function(){ setSel(x.id); }, className:LINHA+(lista.length ? "" : " opacity-70")},
        e(Selo,{cor:x.cor, nome:x.nome, g:true}),
        e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13px] font-semibold text-foreground"}, x.nome),
          e("span",{className:"block text-[11px] uppercase tracking-wide text-foreground"}, lista.length ? lista.length+" aula"+(lista.length===1 ? "" : "s")+" · "+minutos(lista)+" min · "+feitas+" assistida"+(feitas===1 ? "" : "s") : "Em breve"),
          lista.length>0 && e("span",{className:"mt-1 block"}, e(Barra,{pct:pct}))),
        e("span",{className:"shrink-0 text-[13px] text-primary"}, lista.length ? "Abrir" : "Ver")); })),
    AULAS.length===0 && e(Aviso,null, "Ainda não há aulas publicadas."));
}
export { AbaAulas };
