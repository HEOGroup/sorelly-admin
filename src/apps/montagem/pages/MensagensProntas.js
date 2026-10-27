// Sorelly Admin · montagem — pages/MensagensProntas.js
// Cadastro de revendedoras → Mensagens prontas: textos do setor para copiar e colar no WhatsApp, por assunto (começa por Kits novos).
// Preenche o nome da revendedora e da representante no topo e o texto de cada mensagem já sai pronto. Editar guarda a versão deste navegador; "Restaurar" volta ao texto original.
import { AbasTela, Bloco, Botao, BlocoFiltros, CAMPO, CampoSel, Rotulo, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { ETAPAS_MSG, GRUPOS, MENSAGENS, preencher } from "@/apps/montagem/domain/mensagens-cadastro";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var CHAVE = "sorelly_msgs_cadastro";
var selo = function(txt, cor){ return e("span",{key:txt, className:"inline-flex h-5 items-center rounded-md border px-2 text-[11px] font-semibold "+cor}, txt); };
var SELO_ETAPA = "border-border bg-white/5 text-foreground";
var SELO_ALERTA = "border-warning/40 bg-warning/15 text-warning", SELO_INFO = "border-info/40 bg-info/15 text-info";
var lerEditadas = function(){ try{ return JSON.parse(localStorage.getItem(CHAVE)||"{}") || {}; }catch(x){ return {}; } };
var gravar = function(o){ try{ localStorage.setItem(CHAVE, JSON.stringify(o)); }catch(x){} };
function copiarTexto(txt){
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function(ok){ var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(x){} ta.remove(); ok(); });
}

function Mensagem(p){
  var m = p.m, d = p.d, ed = useState(false), editando = ed[0], rs = useState(""), rascunho = rs[0];
  var original = m.texto, atual = p.editadas[m.id] != null ? p.editadas[m.id] : original, mudou = p.editadas[m.id] != null;
  var texto = preencher(atual, p.v);
  var copiar = function(){ copiarTexto(texto).then(function(){ d({type:"AVISO", txt:"Mensagem copiada: "+m.titulo, tom:"ok"}); }); };
  var salvar = function(){ var o = Object.assign({}, p.editadas); o[m.id] = rascunho; gravar(o); p.setEditadas(o); ed[1](false); };
  var restaurar = function(){ var o = Object.assign({}, p.editadas); delete o[m.id]; gravar(o); p.setEditadas(o); ed[1](false); };
  return e("div",{id:"msg-"+m.id, className:"scroll-mt-4 rounded-lg transition-shadow duration-500", style:{boxShadow:p.brilho===m.id ? "0 0 0 2px #E8C766, 0 0 20px 4px rgba(232,199,102,.5)" : "0 0 0 0 transparent"}}, e(Bloco,{t:m.titulo+" · para "+m.para.toLowerCase(), dir:e("div",{className:"flex items-center gap-2"},
      selo((ETAPAS_MSG.find(function(x){ return x[0]===m.etapa; })||["", m.etapa])[1], SELO_ETAPA), m.sugerida && selo("Sugerida", SELO_ALERTA), mudou && selo("Editada", SELO_INFO),
      !editando && e(Botao,{onClick:function(){ rs[1](atual); ed[1](true); }}, "Editar"),
      !editando && e(Botao,{principal:true, onClick:copiar}, "Copiar"))},
    e("p",{className:"mb-2 text-[12px]"}, "Quando usar: "+m.quando),
    editando
      ? e("div",{className:"flex flex-col gap-2"},
          e("textarea",{value:rascunho, onChange:function(ev){ rs[1](ev.target.value); }, rows:Math.min(18, rascunho.split("\n").length+2), className:CAMPO+" h-auto py-2 leading-relaxed", "aria-label":"Texto da mensagem"}),
          e("div",{className:"flex justify-end gap-2"}, mudou && e(Botao,{onClick:restaurar}, "Restaurar original"), e(Botao,{onClick:function(){ ed[1](false); }}, "Cancelar"), e(Botao,{principal:true, onClick:salvar}, "Salvar")))
      : e("pre",{className:"whitespace-pre-wrap rounded-md border border-border bg-black/20 p-3 font-sans text-[13px] leading-relaxed"}, texto)));
}

// Glossário: uma linha por mensagem pronta; clicar leva até a mensagem e dá um brilho nela
function Glossario(p){
  var lista = MENSAGENS.filter(function(m){ return m.grupo===p.grupo; });
  var ir = function(id){ var el = document.getElementById("msg-"+id); if(el) el.scrollIntoView({behavior:"smooth", block:"center"}); p.aoBrilhar(id); };
  return e(Bloco,{t:"Glossário · "+lista.length+" mensagens"},
    e(TabelaP,{minW:640, cols:[{t:"Mensagem", w:300}, {t:"Etapa", w:130}, {t:"Quando usar"}]},
      lista.map(function(m){ return e(Tr,{key:m.id, onClick:function(){ ir(m.id); }},
        e(Td,{forte:true, title:m.titulo}, m.titulo), e(Td,null, (ETAPAS_MSG.find(function(x){ return x[0]===m.etapa; })||["", m.etapa])[1]), e(Td,{title:m.quando}, m.quando)); })));
}

// Fluxo e resumo das mensagens que as representantes usam (cada uma escreve do seu jeito; aqui está o que cada modelo faz, para escolher o padrão)
var FLUXO_REP = [["1","Aceitou o kit novo","Se apresenta e pede endereço e disponibilidade"], ["2","Combinou a entrega","Confirma dia e horário (ou já propõe uma data)"], ["3","Uma semana depois","Pergunta como estão as vendas (acompanhamento)"], ["4","5 a 1 dia antes do acerto","Uma mensagem por dia: data, valor de vendas, app e encomendas"]];
var OK = "✓", NAO = "—";
var APRES = [["Francieli", OK, OK, OK, NAO], ["Edlaine", OK, OK, OK, NAO], ["Dayanne", OK, NAO, OK, OK], ["Veridiana", OK, OK, OK, NAO], ["Bruna", OK, OK, OK, OK], ["Thainá", OK, NAO, NAO, OK]];
var ACERTO = [["Modelo do Marcus", OK, OK, OK, NAO, NAO], ["Edlaine", OK, OK, OK, NAO, OK], ["Dayanne", OK, OK, OK, NAO, OK], ["Veridiana", OK, OK, NAO, OK, NAO], ["Bruna", OK, OK, OK, NAO, NAO], ["Thainá", OK, OK, NAO, OK, NAO]];
function FluxoRepresentantes(){
  return e("div",{className:"flex flex-col gap-3"},
    e(Bloco,{t:"Fluxo das representantes"},
      e("div",{className:"flex flex-col gap-2 md:flex-row"}, FLUXO_REP.map(function(x, i){ return e("div",{key:x[0], className:"flex min-w-0 flex-1 items-center gap-2"},
        e("div",{className:"min-w-0 flex-1 rounded-md border border-border bg-black/20 p-2.5"}, e("b",{className:"block text-[13px]"}, x[0]+". "+x[1]), e("span",{className:"text-[12px]"}, x[2])),
        i<FLUXO_REP.length-1 && e("span",{className:"hidden text-[16px] md:inline"}, "→")); })),
      e("p",{className:"mt-2 text-[12px]"}, "As mensagens abaixo são as que cada representante usa hoje. Cada uma escreve do seu jeito. As tabelas mostram o que cada modelo inclui, para você escolher o padrão.")),
    e(Bloco,{t:"Apresentação ao aceitar o kit novo"},
      e(TabelaP,{minW:560, cols:[{t:"Modelo", w:140}, {t:"Se apresenta", c:1}, {t:"Pede o endereço", c:1}, {t:"Pede a disponibilidade", c:1}, {t:"Propõe uma data", c:1}]},
        APRES.map(function(l){ return e(Tr,{key:l[0]}, e(Td,{forte:true}, l[0]), l.slice(1).map(function(v, i){ return e(Td,{key:i, c:true, cor:v===OK ? "text-success" : ""}, v); })); }))),
    e(Bloco,{t:"Aviso do acerto"},
      e(TabelaP,{minW:700, cols:[{t:"Modelo", w:140}, {t:"Data do acerto", c:1}, {t:"Valor de vendas", c:1}, {t:"Preferências (app)", c:1}, {t:"Encomendas (app)", c:1}, {t:"Sem hora marcada", c:1}]},
        ACERTO.map(function(l){ return e(Tr,{key:l[0]}, e(Td,{forte:true}, l[0]), l.slice(1).map(function(v, i){ return e(Td,{key:i, c:true, cor:v===OK ? "text-success" : ""}, v); })); }))));
}

function AbaMensagensProntas(){
  var d = use().dispatch, gp = useState(GRUPOS[0][0]), grupo = gp[0], vs = useState({nome:"", representante:"", data:""}), v = vs[0], et = useState(""), etapa = et[0], bl = useState(""), brilho = bl[0], es = useState(lerEditadas), editadas = es[0];
  var campo = function(rot, id, k){ return e("div",{key:k, className:"min-w-0"}, e(Rotulo,{t:rot, id:id}), e("input",{id:id, type:"text", value:v[k], placeholder:"Escreva para preencher as mensagens", onChange:function(ev){ var n = Object.assign({}, v); n[k] = ev.target.value; vs[1](n); }, className:CAMPO})); };
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Mensagens prontas", sub:"Textos do setor de Cadastro para copiar e colar no WhatsApp."}),
    e(AbasTela,{abas:GRUPOS, atual:grupo, onMudar:gp[1]}),
    grupo==="representantes" && e(FluxoRepresentantes,null),
    e(Glossario,{grupo:grupo, aoBrilhar:function(id){ bl[1](id); setTimeout(function(){ bl[1](""); }, 2000); }}),
    e(BlocoFiltros,{titulo:"Preencher"}, campo("Nome da revendedora", "msg-nome", "nome"), campo("Nome da representante", "msg-rep", "representante"), campo("Dia e horário combinados", "msg-data", "data"),
      e(CampoSel,{key:"etapa", t:"Etapa", id:"msg-etapa", value:etapa, onChange:et[1], opcoes:[["", "Todas"]].concat(ETAPAS_MSG)})),
    MENSAGENS.filter(function(m){ return m.grupo===grupo && (!etapa || m.etapa===etapa); }).map(function(m){ return e(Mensagem,{key:m.id, m:m, brilho:brilho, v:v, d:d, editadas:editadas, setEditadas:es[1]}); }));
}

export { AbaMensagensProntas };
