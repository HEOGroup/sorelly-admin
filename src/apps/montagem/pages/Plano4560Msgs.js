// Sorelly Admin · montagem — pages/Plano4560Msgs.js
// Agendamento → Plano 45/60 → Mensagens: as 20 mensagens prontas para copiar e colar no WhatsApp (domain/plano45-60-mensagens.js). Campos NOME, N, VALOR e X preenchem os [colchetes].
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, BlocoFiltros, Botao, CAMPO, CampoBusca, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { GRUPOS, MENSAGENS, preencher } from "@/apps/montagem/domain/plano45-60-mensagens";
import { norm } from "@/apps/montagem/domain/plano45-60";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function Campo(p){
  return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t, id:p.id}), e("input",{id:p.id, value:p.value, placeholder:p.placeholder||"", onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}

function AbaP45Msg(){
  var cx = use(), s = cx.state, cfg = s.p45.config;
  var gs = useState("rep"), grupo = gs[0], qs = useState(""), busca = qs[0], fs = useState({nome:"", n:"", valor:"", x:String(cfg.teto)}), campos = fs[0], cs = useState(0), copiada = cs[0];
  var set = function(k, v){ var o = Object.assign({}, campos); o[k] = v; fs[1](o); };
  var q = norm(busca), lista = MENSAGENS.filter(function(m){ return q ? norm(m.t+" "+m.txt(cfg)).indexOf(q)>=0 : m.g===grupo; });
  var copiar = function(m, texto){
    var ok = function(){ cs[1](m.n); cx.dispatch({type:"AVISO", txt:"Mensagem "+m.n+" copiada. Já pode colar no WhatsApp.", tom:"ok"}); };
    var falhou = function(){ cx.dispatch({type:"AVISO", txt:"Não consegui copiar. Selecione o texto e copie.", tom:"atencao"}); };
    // alternativa para navegador que bloqueia a área de transferência
    var antigo = function(){ try { var ta = document.createElement("textarea"); ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); var r = document.execCommand("copy"); document.body.removeChild(ta); r ? ok() : falhou(); } catch(x){ falhou(); } };
    try { navigator.clipboard.writeText(texto).then(ok, antigo); } catch(x){ antigo(); }
  };
  return e(Pagina,null,
    e(PageHead,{t:"Mensagens do plano 45/60", sub:"20 mensagens prontas para o WhatsApp. Preencha os campos e copie."}),
    e(BlocoFiltros,{titulo:"Preencher [colchetes]"},
      e(Campo,{t:"Nome da revendedora", id:"p45mnome", value:campos.nome, onChange:function(v){ set("nome", v); }}),
      e(Campo,{t:"N (acertos)", id:"p45mn", value:campos.n, onChange:function(v){ set("n", v); }}),
      e(Campo,{t:"Valor (R$)", id:"p45mvalor", value:campos.valor, onChange:function(v){ set("valor", v); }}),
      e(Campo,{t:"X (teto)", id:"p45mx", value:campos.x, onChange:function(v){ set("x", v); }}),
      e(CampoBusca,{t:"Buscar mensagem", id:"p45mbusca", value:busca, placeholder:"Título ou texto", onChange:function(v){ qs[1](v); }})),
    !q && e(AbasTela,{abas:GRUPOS.map(function(g){ return [g[0], g[1]+" ("+MENSAGENS.filter(function(m){ return m.g===g[0]; }).length+")"]; }), atual:grupo, onMudar:function(k){ gs[1](k); }}),
    e("p",{className:"rounded-lg border border-border bg-card/60 px-3 py-2 text-[13px]"}, "À revendedora, nunca falar em falta de peça ou de estoque: o argumento é \"você foi escolhida\" e \"mais tempo para vender\"."),
    lista.length ? e("div",{className:"grid grid-cols-1 gap-2.5 xl:grid-cols-2"}, lista.map(function(m){
      var texto = preencher(m.txt(cfg), campos), falta = /\[(NOME|N|VALOR|X|DD\/MM)\]/.test(texto);
      return e(Bloco,{key:m.n, t:m.n+". "+m.t, dir:e(Botao,{principal:true, onClick:function(){ copiar(m, texto); }}, copiada===m.n ? "Copiada" : "Copiar")},
        m.obs && e("p",{className:"mb-1.5 text-[12px] text-warning"}, m.obs),
        e("pre",{className:"max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-black/20 p-2.5 font-sans text-[13px] leading-snug"}, texto),
        falta && e("p",{className:"mt-1.5 text-[12px] text-foreground/80"}, "Ainda há campos entre [colchetes] para preencher antes de enviar.")); }))
      : e("p",{className:"rounded-lg border border-border bg-card/60 px-3 py-4 text-center text-[13px]"}, "Nenhuma mensagem encontrada."));
}

export { AbaP45Msg };
