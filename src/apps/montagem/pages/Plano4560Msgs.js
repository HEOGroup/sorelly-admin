// Sorelly Admin · montagem — pages/Plano4560Msgs.js
// Agendamento → Plano 45/60 → aba Mensagens: as 20 mensagens prontas em LISTAGEM (uma linha por mensagem, como o glossário de Cadastro → Mensagens prontas); clicar na linha mostra o texto e Copiar leva ao WhatsApp.
// Textos em domain/plano45-60-mensagens.js. Os campos NOME, N, VALOR e X preenchem os [colchetes].
import { Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, BlocoFiltros, Botao, CAMPO, CampoBusca, CampoSel, FaixaTotais, Rotulo, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { GRUPOS, MENSAGENS, preencher } from "@/apps/montagem/domain/plano45-60-mensagens";
import { norm } from "@/apps/montagem/domain/plano45-60";
import { AbasPlano } from "@/apps/montagem/pages/Plano4560";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

function Campo(p){
  return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t, id:p.id}), e("input",{id:p.id, value:p.value, placeholder:p.placeholder||"", onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}
var rotGrupo = function(g){ return (GRUPOS.filter(function(x){ return x[0]===g; })[0] || ["", g])[1]; };

function AbaP45Msg(){
  var cx = use(), s = cx.state, cfg = s.p45.config;
  var gs = useState(""), grupo = gs[0], qs = useState(""), busca = qs[0], sl = useState(1), sel = sl[0];
  var fs = useState({nome:"", n:"", valor:"", x:String(cfg.teto)}), campos = fs[0], cs = useState(0), copiada = cs[0];
  var set = function(k, v){ var o = Object.assign({}, campos); o[k] = v; fs[1](o); };
  var q = norm(busca), lista = MENSAGENS.filter(function(m){ return (!grupo || m.g===grupo) && (!q || norm(m.t+" "+m.txt(cfg)).indexOf(q)>=0); });
  var atual = MENSAGENS.filter(function(m){ return m.n===sel; })[0], texto = atual ? preencher(atual.txt(cfg), campos) : "";
  var copiar = function(m){
    var t = preencher(m.txt(cfg), campos);
    var ok = function(){ cs[1](m.n); cx.dispatch({type:"AVISO", txt:"Mensagem "+m.n+" copiada. Já pode colar no WhatsApp.", tom:"ok"}); };
    var falhou = function(){ cx.dispatch({type:"AVISO", txt:"Não consegui copiar. Selecione o texto e copie.", tom:"atencao"}); };
    // alternativa para navegador que bloqueia a área de transferência
    var antigo = function(){ try { var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); var r = document.execCommand("copy"); document.body.removeChild(ta); r ? ok() : falhou(); } catch(x){ falhou(); } };
    try { navigator.clipboard.writeText(t).then(ok, antigo); } catch(x){ antigo(); }
  };
  return e(Pagina,null,
    e(PageHead,{t:"Plano 45/60", sub:"20 mensagens prontas para o WhatsApp. Preencha os campos, escolha na lista e copie."}),
    e(AbasPlano,{atual:"p45msg"}),
    e(FaixaTotais,{itens:GRUPOS.map(function(g){ return {t:g[1], v:String(MENSAGENS.filter(function(m){ return m.g===g[0]; }).length)}; })}),
    e(BlocoFiltros,{titulo:"Filtros", onLimpar:(grupo || busca) ? function(){ gs[1](""); qs[1](""); } : null},
      e(CampoBusca,{t:"Buscar", id:"p45mbusca", value:busca, placeholder:"Título ou texto", onChange:function(v){ qs[1](v); }}),
      e(CampoSel,{t:"Para", id:"p45mgrupo", value:grupo, onChange:function(v){ gs[1](v); }, opcoes:[["", "Todos"]].concat(GRUPOS)}),
      e(Campo,{t:"Nome da revendedora", id:"p45mnome", value:campos.nome, onChange:function(v){ set("nome", v); }}),
      e(Campo,{t:"N (acertos)", id:"p45mn", value:campos.n, onChange:function(v){ set("n", v); }}),
      e(Campo,{t:"Valor (R$)", id:"p45mvalor", value:campos.valor, onChange:function(v){ set("valor", v); }}),
      e(Campo,{t:"X (teto)", id:"p45mx", value:campos.x, onChange:function(v){ set("x", v); }})),
    e(Bloco,{t:"Listagem · "+lista.length+(lista.length===1 ? " mensagem" : " mensagens")},
      lista.length ? e(TabelaP,{minW:760, cols:[{t:"Nº", w:48, c:1}, {t:"Mensagem", w:380}, {t:"Para", w:150}, {t:"Aviso"}, {t:"", w:100}]}, lista.map(function(m){
        return e("tr",{key:m.n, onClick:function(){ sl[1](m.n); }, className:"cursor-pointer hover:bg-white/10 "+(sel===m.n ? "bg-white/10" : "")},
          e(Td,{c:true}, String(m.n)), e(Td,{forte:true, title:m.t}, m.t), e(Td,null, rotGrupo(m.g)), e(Td,{cor:m.obs ? "text-warning" : "", title:m.obs||""}, m.obs || "—"),
          e("td",{className:"h-8 border-b border-border px-2.5"}, e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); copiar(m); }, className:"h-6 rounded border border-primary bg-primary/20 px-2 text-[12px] font-semibold text-primary hover:bg-primary/30"}, copiada===m.n ? "Copiada" : "Copiar"))); }))
        : e("p",{className:"py-3 text-center text-[13px]"}, "Nenhuma mensagem encontrada.")),
    atual && e(Bloco,{t:atual.n+". "+atual.t, dir:e(Botao,{principal:true, onClick:function(){ copiar(atual); }}, copiada===atual.n ? "Copiada" : "Copiar")},
      atual.obs && e("p",{className:"mb-1.5 text-[12px] text-warning"}, atual.obs),
      e("pre",{className:"max-h-80 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-black/20 p-3 font-sans text-[13px] leading-relaxed"}, texto),
      /\[(NOME|N|VALOR|X|DD\/MM)\]/.test(texto) && e("p",{className:"mt-1.5 text-[12px]"}, "Ainda há campos entre [colchetes] para preencher antes de enviar.")));
}

export { AbaP45Msg };
