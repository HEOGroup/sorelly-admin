// Sorelly Admin · montagem — pages/Informativos.js
// Representantes & Kits → Regras → Folders e informativos: o folder virtual que sobe nos apps da revendedora e da representante.
// Lista (situação, limites e quantas pessoas viram) + editor com pré-visualização no celular. Lógica em domain/informativos.js; visual dos apps em mobile/informativos-app.js.
import { Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, Botao, CAMPO, CampoSel, FaixaTotais, Rotulo, TabelaP, Td, Tr, inteiro } from "@/apps/montagem/components/padrao-fin";
import { PUBLICOS, idNovo, infEstatistica, informativoNovo } from "@/apps/montagem/domain/informativos";
import { IPhone15 } from "@/apps/montagem/mobile/iphone";
import { LeitorInformativo } from "@/apps/montagem/mobile/informativos-app";
import { CabecaTela, FolhaTela } from "@/apps/montagem/mobile/rev-comum";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var TA = "min-h-16 w-full min-w-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";
var TIPOS = [["faixas","Tabela de comissão e brindes"], ["linhas","Linhas (rótulo e valor)"], ["texto","Só texto"]];
var clone = function(x){ return JSON.parse(JSON.stringify(x)); };
var data = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7) : ""; };
var periodo = function(i){ return !i.inicio && !i.fim ? "Sempre" : (i.inicio ? "De "+data(i.inicio) : "")+(i.fim ? " até "+data(i.fim) : ""); };
var publicoTxt = function(i){ return PUBLICOS.filter(function(p){ return i.publico.indexOf(p[0])>=0; }).map(function(p){ return p[1]; }).join(" e ") || "Ninguém"; };
var limiteTxt = function(l){ var v = function(n){ return n==null || n==="" ? "∞" : n; }; return v(l.dia)+" por dia · "+v(l.semana)+" por semana · "+v(l.mes)+" por mês"; };

function Campo(p){
  return e("div",{className:"min-w-0 "+(p.cls||"")}, e(Rotulo,{t:p.t, id:p.id}),
    e("input",{id:p.id, type:p.tipo||"text", value:p.value==null ? "" : p.value, min:p.min, onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO+(p.num ? " text-right tabular-nums" : "")}));
}
function Marca(p){
  return e("label",{className:"flex h-8 items-center gap-2 text-[13px] text-foreground"}, e("input",{type:"checkbox", checked:!!p.on, onChange:function(ev){ p.onChange(ev.target.checked); }, className:"size-4 accent-[var(--primary)]"}), p.t);
}
function Mini(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.desabilitado, "aria-label":p.t, title:p.t, className:"grid size-8 shrink-0 place-items-center rounded-md border border-border bg-card hover:bg-white/10 disabled:opacity-30"}, p.children);
}
var move = function(lista, i, dir){ var j = i+dir; if(j<0 || j>=lista.length) return; var x = lista[i]; lista[i] = lista[j]; lista[j] = x; };

function EditorBloco(p){
  var b = p.b, up = p.up;
  return e("div",{className:"flex flex-col gap-2 rounded-md border border-border bg-white/[.03] p-2.5"},
    e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoSel,{t:"Tipo", id:"tp"+b.id, value:b.tipo, opcoes:TIPOS, onChange:function(v){ up(function(x){ x.tipo = v; if(v==="linhas" && !(x.linhas||[]).length) x.linhas = [{a:"", b:""}]; }); }}),
      e(Campo,{t:"Título", id:"ti"+b.id, value:b.titulo, onChange:function(v){ up(function(x){ x.titulo = v; }); }}),
      e(Campo,{t:"Valor ao lado do título", id:"va"+b.id, value:b.valor, onChange:function(v){ up(function(x){ x.valor = v; }); }}),
      e("div",{className:"flex items-center justify-between gap-2"}, e(Marca,{t:"Abre aberto", on:b.aberto, onChange:function(v){ up(function(x){ x.aberto = v; }); }}),
        e("span",{className:"flex gap-1"}, e(Mini,{t:"Subir", onClick:p.sobe, desabilitado:p.primeiro}, e(Icon,{n:"chevron", s:14, className:"-rotate-90"})), e(Mini,{t:"Descer", onClick:p.desce, desabilitado:p.ultimo}, e(Icon,{n:"chevron", s:14, className:"rotate-90"})),
          e(Mini,{t:"Excluir bloco", onClick:p.exclui}, e(Icon,{n:"trash", s:14}))))),
    b.tipo==="faixas" && e("p",{className:"text-[12px] text-foreground"}, "A tabela vem das regras do Configurador e muda sozinha quando a regra muda."),
    b.tipo==="linhas" && e("div",{className:"flex flex-col gap-1.5"}, (b.linhas||[]).map(function(l, n){
      return e("div",{key:n, className:"grid grid-cols-[1fr_1fr_32px] items-end gap-2"},
        e("input",{value:l.a, placeholder:"Rótulo", "aria-label":"Rótulo", onChange:function(ev){ var v = ev.target.value; up(function(x){ x.linhas[n].a = v; }); }, className:CAMPO}),
        e("input",{value:l.b, placeholder:"Valor", "aria-label":"Valor", onChange:function(ev){ var v = ev.target.value; up(function(x){ x.linhas[n].b = v; }); }, className:CAMPO}),
        e(Mini,{t:"Excluir linha", onClick:function(){ up(function(x){ x.linhas.splice(n, 1); }); }}, e(Icon,{n:"x", s:14})));
    }), e("div",null, e(Botao,{onClick:function(){ up(function(x){ x.linhas.push({a:"", b:""}); }); }}, "+ Linha"))),
    e("div",{className:"min-w-0"}, e(Rotulo,{t:b.tipo==="texto" ? "Texto" : "Texto abaixo (opcional)", id:"tx"+b.id}),
      e("textarea",{id:"tx"+b.id, value:b.texto||"", onChange:function(ev){ var v = ev.target.value; up(function(x){ x.texto = v; }); }, className:TA})));
}

function Editor(p){
  var st = useState(function(){ return clone(p.item); }), it = st[0], set = st[1];
  var ab = useState(0), ai = Math.min(ab[0], it.abas.length-1);
  var up = function(fn){ var c = clone(it); fn(c); set(c); };
  var aba = it.abas[ai];
  var preview = e(IPhone15,null, e(CabecaTela,{key:"h", t:it.titulo||"Informativo", sub:"Informativo", onVoltar:function(){}}), e(FolhaTela,{key:"c"}, aba ? e(LeitorInformativo,{key:it.id+aba.id, inf:it, s:p.s, modalidade:"padrao"}) : null));
  return e("div",{className:"grid gap-3 xl:grid-cols-[minmax(0,1fr)_388px]"},
    e("div",{className:"flex min-w-0 flex-col gap-2.5"},
      e(Bloco,{t:"Dados"},
        e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-4"},
          e(Campo,{t:"Título", id:"inf-t", value:it.titulo, cls:"col-span-2", onChange:function(v){ up(function(x){ x.titulo = v; }); }}),
          e(Campo,{t:"Início (opcional)", id:"inf-i", tipo:"date", value:it.inicio, onChange:function(v){ up(function(x){ x.inicio = v; }); }}),
          e(Campo,{t:"Fim (opcional)", id:"inf-f", tipo:"date", value:it.fim, onChange:function(v){ up(function(x){ x.fim = v; }); }}),
          e("div",{className:"col-span-2 flex flex-wrap gap-x-5"}, PUBLICOS.map(function(pb){ return e(Marca,{key:pb[0], t:pb[1], on:it.publico.indexOf(pb[0])>=0, onChange:function(v){ up(function(x){ x.publico = x.publico.filter(function(k){ return k!==pb[0]; }); if(v) x.publico.push(pb[0]); }); }}); })),
          e("div",{className:"col-span-2"}, e(Marca,{t:"Publicado (aparece nos apps)", on:it.ativo, onChange:function(v){ up(function(x){ x.ativo = v; }); }})))),
      e(Bloco,{t:"Quantas vezes sobe sozinho ao abrir o app"},
        e("div",{className:"grid grid-cols-3 gap-x-3 md:grid-cols-4"},
          [["dia","Por dia"], ["semana","Por semana"], ["mes","Por mês"]].map(function(c){ return e(Campo,{key:c[0], t:c[1], id:"lim-"+c[0], tipo:"number", min:0, num:true, value:it.limite[c[0]], onChange:function(v){ up(function(x){ x.limite[c[0]] = v==="" ? "" : Math.max(0, Math.floor(+v)); }); }}); }))),
      e(Bloco,{t:"Abas e blocos", dir:e("div",{className:"flex gap-1.5"}, e(Botao,{onClick:function(){ up(function(x){ x.abas.push({id:idNovo("a"), nome:"Nova aba", blocos:[]}); }); ab[1](it.abas.length); }}, "+ Aba"))},
        e("div",{className:"flex flex-col gap-2.5"},
          e("div",{role:"tablist", className:"flex flex-wrap gap-1 border-b border-border"}, it.abas.map(function(a, n){ return e("button",{key:a.id, type:"button", role:"tab", "aria-selected":n===ai, onClick:function(){ ab[1](n); },
            className:"-mb-px h-9 border-b-2 px-3 text-[13px] "+(n===ai ? "border-primary font-semibold text-foreground" : "border-transparent text-foreground/80 hover:text-foreground")}, a.nome || "Sem nome"); })),
          aba && e("div",{className:"flex flex-col gap-2.5"},
            e("div",{className:"grid grid-cols-[1fr_auto] items-end gap-2"},
              e(Campo,{t:"Nome da aba", id:"aba-n", value:aba.nome, onChange:function(v){ up(function(x){ x.abas[ai].nome = v; }); }}),
              e("span",{className:"flex gap-1"}, e(Mini,{t:"Aba para a esquerda", desabilitado:ai===0, onClick:function(){ up(function(x){ move(x.abas, ai, -1); }); ab[1](ai-1); }}, e(Icon,{n:"chevron", s:14, className:"rotate-180"})),
                e(Mini,{t:"Aba para a direita", desabilitado:ai===it.abas.length-1, onClick:function(){ up(function(x){ move(x.abas, ai, 1); }); ab[1](ai+1); }}, e(Icon,{n:"chevron", s:14})),
                e(Mini,{t:"Excluir aba", desabilitado:it.abas.length<2, onClick:function(){ up(function(x){ x.abas.splice(ai, 1); }); ab[1](0); }}, e(Icon,{n:"trash", s:14})))),
            aba.blocos.map(function(b, n){ return e(EditorBloco,{key:b.id, b:b, primeiro:n===0, ultimo:n===aba.blocos.length-1,
              up:function(fn){ up(function(x){ fn(x.abas[ai].blocos[n]); }); },
              sobe:function(){ up(function(x){ move(x.abas[ai].blocos, n, -1); }); }, desce:function(){ up(function(x){ move(x.abas[ai].blocos, n, 1); }); },
              exclui:function(){ up(function(x){ x.abas[ai].blocos.splice(n, 1); }); }}); }),
            e("div",null, e(Botao,{onClick:function(){ up(function(x){ x.abas[ai].blocos.push({id:idNovo("b"), tipo:"texto", titulo:"Novo bloco", valor:"", texto:"", linhas:[], aberto:false}); }); }}, "+ Bloco"))))),
      e("div",{className:"flex flex-wrap justify-end gap-2"},
        !p.novo && e(Botao,{onClick:function(){ p.onExcluir(it); }}, "Excluir"), e(Botao,{onClick:p.onCancelar}, "Cancelar"),
        e(Botao,{principal:true, desabilitado:!it.titulo.trim() || !it.publico.length, onClick:function(){ p.onSalvar(it); }}, "Salvar"))),
    e("div",{className:"flex flex-col items-center gap-1.5"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-foreground"}, "Como aparece no app"), preview));
}

function AbaInformativos(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var ed = useState(null), edit = ed[0];
  var lista = (s.inf && s.inf.lista) || [];
  var tot = lista.reduce(function(r, i){ var x = infEstatistica(s, i.id); r.subidas += x.subidas; r.viram += x.viram; r.entenderam += x.entenderam; if(i.ativo) r.pub++; return r; }, {subidas:0, viram:0, entenderam:0, pub:0});
  var salvar = function(it){ d({type:"INF", op:"salvar", item:it}); ed[1](null); };
  var excluir = function(it){ if(window.confirm("Excluir o informativo \""+it.titulo+"\"? Os números de quem viu também saem.")){ d({type:"INF", op:"excluir", id:it.id}); ed[1](null); } };
  return e(Pagina,null,
    e(PageHead,{t:"Folders e informativos", sub:"O folder virtual dos apps da revendedora e da representante, no lugar do papel."},
      !edit && e(Botao,{principal:true, onClick:function(){ ed[1]({item:informativoNovo(), novo:true}); }}, "Novo informativo")),
    e(FaixaTotais,{itens:[{t:"Publicados", v:inteiro(tot.pub)}, {t:"Pausados", v:inteiro(lista.length-tot.pub)}, {t:"Subidas nos apps", v:inteiro(tot.subidas)}, {t:"Pessoas que viram", v:inteiro(tot.viram)}, {t:"Tocaram em Entendi", v:inteiro(tot.entenderam)}]}),
    edit ? e(Editor,{key:edit.item.id, item:edit.item, novo:edit.novo, s:s, onSalvar:salvar, onCancelar:function(){ ed[1](null); }, onExcluir:excluir})
      : e(Bloco,{t:"Informativos"},
        lista.length===0 ? e("p",{className:"py-3 text-center text-[13px] text-foreground"}, "Nenhum informativo criado.")
        : e(TabelaP,{minW:980, cols:[{t:"Título"}, {t:"Público", w:190}, {t:"Período", w:130}, {t:"Sobe sozinho", w:250}, {t:"Subidas", w:80, n:true}, {t:"Viram", w:80, n:true}, {t:"Entendi", w:80, n:true}, {t:"Situação", w:100, c:true}]},
          lista.map(function(i){ var x = infEstatistica(s, i.id);
            return e(Tr,{key:i.id, onClick:function(){ ed[1]({item:i, novo:false}); }, apagado:!i.ativo},
              e(Td,{forte:true}, i.titulo), e(Td,null, publicoTxt(i)), e(Td,null, periodo(i)), e(Td,null, limiteTxt(i.limite)),
              e(Td,{n:true}, inteiro(x.subidas)), e(Td,{n:true}, inteiro(x.viram)), e(Td,{n:true}, inteiro(x.entenderam)),
              e(Td,{c:true, cor:i.ativo ? "text-success" : ""}, i.ativo ? "Publicado" : "Pausado")); }))));
}

export { AbaInformativos };
