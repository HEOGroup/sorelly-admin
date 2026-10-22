// Sorelly Admin · montagem — pages/preferencias-kit/Formulario.js
// Aba "Formulário do app": blocos que a revendedora responde no app (lista com arrastar, interruptor, editor em Janela com prévia ao vivo e "Prévia do app").
import { Faixa, Indicador, Janela, LINHA, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { DICA_TIPO, ROTULO_TIPO, PRESETS_COR, TIPOS, OBS_KEY, pkAvisoExcluir, pkBlocos, pkConfigPublica, pkExibirResposta, pkMontarBloco, pkBloco } from "@/apps/montagem/domain/preferencias-kit";
import { PreviaBloco, RespostaView, amostraResposta } from "@/apps/montagem/pages/preferencias-kit/resposta";
import { Area, Bolinha, Bt, Campo, Chip, Ic, Interruptor, Painel, Selo, Txt, Vazio, usePk } from "@/apps/montagem/pages/preferencias-kit/visual";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Fragment, e, useState } from "@/shared/react";

var ICONE_TIPO = {slider:"sliders-horizontal", id:"palette", filhos:"list-checks", vend:"check-circle", vendsimple:"check-circle", vendmetal:"diamond", letras:"text-aa", observacoes:"note-pencil"};
var DEF_CAMPO = function(){ return {label:"", kind:"multi", opts:""}; };

// resumo curto do conteúdo de um bloco para a lista
function resumoBloco(b){
  var n = function(q, um, mais){ return q+" "+(q===1 ? um : mais); };
  if(b.type==="slider") return n(b.fields.length, "pergunta", "perguntas");
  if(b.type==="id") return n(b.colorField.options.length, "cor", "cores");
  if(b.type==="filhos") return n(b.options.length, "opção", "opções");
  if(b.type==="vend") return b.fields.length ? n(b.fields.length, "pergunta extra", "perguntas extras") : "Pergunta simples";
  if(b.type==="vendmetal") return n(b.items.length, "variação", "variações");
  if(b.type==="letras") return "Até "+(b.maxLetters || 26)+" letras";
  return "Campo livre";
}

// o que a revendedora vê em cada bloco, por extenso (as opções inteiras: malha lisa, cordão baiano...)
function opcoesBloco(b){
  var lista = function(f){ return f.label+": "+f.options.join(", "); };
  if(b.type==="observacoes") return "Texto livre.";
  if(b.type==="slider") return ["Barra de ouro e prata."].concat(b.fields.map(lista)).join(" ");
  if(b.type==="id") return b.colorField.label+": "+b.colorField.options.map(function(o){ return o.value; }).join(", ")+".";
  if(b.type==="filhos") return "Escolhe a composição e o metal de cada uma: "+b.options.join(", ")+".";
  if(b.type==="vend") return ["Vendo ou não vendo."].concat(b.hasSlider ? ["Barra de ouro e prata."] : [], b.metalField ? [b.metalField.label+"? Ouro, prata ou ouro + prata."] : [], b.fields.map(lista)).join(" ");
  if(b.type==="vendmetal") return "Cada variação com vendo ou não vendo e o metal: "+b.items.join(", ")+".";
  if(b.type==="letras") return "Escolhe até "+(b.maxLetters || 26)+" letras e o metal de cada uma.";
  return "";
}

// ---------- estado do editor ----------
function dadosIniciais(b){
  if(!b) return {accent:"", title:"", allowImages:false, fields:[DEF_CAMPO()], colorLabel:"Cores preferidas", colorKey:"cores", colors:[], opts:"", items:"", maxLetters:10, hasSlider:false, metalOn:false, metalLabel:"Metal"};
  return {accent:b.accent, title:b.title, allowImages:!!b.allowImages,
    fields:(b.fields||[]).map(function(f){ return {key:f.key, label:f.label, kind:f.kind, opts:(f.options||[]).join("\n")}; }),
    colorLabel:b.colorField ? b.colorField.label : "Cores preferidas", colorKey:b.colorField ? b.colorField.key : "cores", colors:b.colorField ? b.colorField.options.map(function(o){ return {value:o.value, hex:o.hex}; }) : [],
    opts:(b.options||[]).join("\n"), items:(b.items||[]).join("\n"), maxLetters:b.maxLetters || 10, hasSlider:!!b.hasSlider, metalOn:!!b.metalField, metalLabel:b.metalField ? b.metalField.label : "Metal"};
}
// vira a entrada que pkMontarBloco e as ações aceitam
function entrada(d){
  return {title:d.title, accent:d.accent || undefined, allowImages:d.allowImages,
    fields:d.fields.filter(function(f){ return f.label.trim() || f.opts.trim(); }).map(function(f){ return {key:f.key, label:f.label, kind:f.kind, options:f.opts}; }),
    colorField:{key:d.colorKey, label:d.colorLabel, options:d.colors}, options:d.opts, items:d.items, maxLetters:d.maxLetters,
    hasSlider:d.hasSlider, metalField:d.metalOn ? {label:d.metalLabel || "Metal"} : null};
}

// lista de perguntas (slider e vend): rótulo, tipo de escolha e opções
function Perguntas(p){
  var fs = p.v;
  var mud = function(i, k, x){ var c = fs.slice(); c[i] = Object.assign({}, c[i]); c[i][k] = x; p.set(c); };
  return e("div",{className:"flex flex-col gap-2"}, fs.map(function(f, i){
    return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-lg bg-white/5 p-2"},
      e("div",{className:"flex items-center gap-1.5"}, e(Txt,{v:f.label, set:function(x){ mud(i, "label", x); }, rot:"Nome da pergunta", ph:"Nome da pergunta"}), e(Ic,{ic:"trash", perigo:true, titulo:"Remover a pergunta", onClick:function(){ p.set(fs.filter(function(_, j){ return j!==i; })); }})),
      e("div",{className:"flex justify-center gap-1"}, e(Chip,{on:f.kind==="multi", onClick:function(){ mud(i, "kind", "multi"); }}, "Várias opções"), e(Chip,{on:f.kind==="grade", onClick:function(){ mud(i, "kind", "grade"); }}, "Grade")),
      e(Area,{v:f.opts, rot:"Opções, uma por linha", ph:"Opções, uma por linha", rows:3, set:function(x){ mud(i, "opts", x); }}));
  }), e(Bt,{ic:"plus", onClick:function(){ p.set(fs.concat([DEF_CAMPO()])); }}, "Adicionar pergunta"));
}
function Cores(p){
  var cs = p.v;
  var mud = function(i, k, x){ var c = cs.slice(); c[i] = Object.assign({}, c[i]); c[i][k] = x; p.set(c); };
  return e("div",{className:"flex flex-col gap-1.5"}, cs.map(function(c, i){
    return e("div",{key:i, className:"flex items-center gap-1.5"}, e("input",{type:"color", value:/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000", "aria-label":"Código da cor", onChange:function(ev){ mud(i, "hex", ev.target.value.toUpperCase()); }, className:"h-9 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"}),
      e(Txt,{v:c.value, set:function(x){ mud(i, "value", x); }, rot:"Nome da cor", ph:"Nome da cor"}), e(Ic,{ic:"trash", perigo:true, titulo:"Remover a cor", onClick:function(){ p.set(cs.filter(function(_, j){ return j!==i; })); }}));
  }), e(Bt,{ic:"plus", onClick:function(){ p.set(cs.concat([{value:"", hex:"#C9A24B"}])); }}, "Adicionar cor"));
}

// ---------- editor do bloco (criar ou editar) ----------
function EditorBloco(p){
  var ctx = usePk(), s = ctx.s, pk = ctx.pk, ex = p.bloco;
  var st = useState(function(){ return {tipo:ex ? ex.type : "slider", d:dadosIniciais(ex)}; }), v = st[0], tipo = v.tipo, d = v.d;
  var set = function(k, x){ var c = Object.assign({}, d); c[k] = x; st[1]({tipo:tipo, d:c}); };
  var setTipo = function(t){ st[1]({tipo:t, d:d}); };
  var m = pkMontarBloco(tipo, entrada(d)), erro = m.erro || "";
  if(!erro && !ex){ var k = m.bloco.key; if(k===OBS_KEY || pkBloco(s, k)) erro = "Já existe um bloco com esse nome."; }
  var salvar = function(){
    var x = entrada(d);
    if(ex) pk("bloco_edit", Object.assign({key:ex.key}, x)); else pk("bloco_add", Object.assign({tipo:tipo}, x));
    p.fechar();
  };
  var amostra = !erro ? amostraResposta(m.bloco) : null;
  var colTipo = e(Painel,{key:"t", t:"Tipo e identificação", ic:"shapes"},
    ex ? e("div",{className:"flex flex-col items-center gap-1"}, e(Selo,{cor:"#E8B84B", ic:ICONE_TIPO[tipo]}, ROTULO_TIPO[tipo]), e("span",{className:"text-[11.5px] text-white/60"}, DICA_TIPO[tipo]), e("span",{className:"text-[11px] text-white/45"}, "O tipo não pode ser alterado depois de criado."))
      : e("div",{className:"flex flex-col gap-1.5"}, TIPOS.map(function(t){ var on = t.valor===tipo;
          return e("button",{key:t.valor, type:"button", "aria-pressed":on, onClick:function(){ setTipo(t.valor); }, className:"flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition "+(on ? "bg-[#E8B84B]/25 ring-2 ring-[#E8B84B]" : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10")},
            e(Ph,{n:ICONE_TIPO[t.valor], s:20, className:on ? "text-[#E8B84B]" : "text-white/60"}), e("span",{className:"flex flex-col"}, e("b",{className:"text-[12.5px]"}, t.rotulo), e("span",{className:"text-[11px] text-white/60"}, t.dica))); })),
    e(Campo,{rot:"Nome do bloco"}, e(Txt,{v:d.title, set:function(x){ set("title", x); }, rot:"Nome do bloco", ph:"Ex.: Anéis"})),
    e(Campo,{rot:"Cor do bloco"}, e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      e(Chip,{on:!d.accent, onClick:function(){ set("accent", ""); }}, "Automática"),
      PRESETS_COR.map(function(c){ return e("button",{key:c, type:"button", "aria-label":"Cor "+c, "aria-pressed":d.accent===c, onClick:function(){ set("accent", c); }, className:"size-7 rounded-full transition "+(d.accent===c ? "ring-2 ring-white" : "ring-1 ring-white/30"), style:{background:c}}); }))),
    tipo!=="id" && e("label",{className:"flex cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-bold"}, e("input",{type:"checkbox", checked:d.allowImages, onChange:function(ev){ set("allowImages", ev.target.checked); }, className:"size-4 accent-[#E8B84B]"}), "Permitir anexar imagens"));
  var camposDoTipo = [];
  if(tipo==="slider") camposDoTipo.push(e(Perguntas,{key:"p", v:d.fields, set:function(x){ set("fields", x); }}));
  if(tipo==="id") camposDoTipo.push(e(Campo,{key:"r", rot:"Título do campo de cores"}, e(Txt,{v:d.colorLabel, set:function(x){ set("colorLabel", x); }, rot:"Título do campo de cores"})), e(Cores,{key:"c", v:d.colors, set:function(x){ set("colors", x); }}));
  if(tipo==="filhos") camposDoTipo.push(e(Campo,{key:"o", rot:"Opções, uma por linha", dica:"Cada opção pede o metal."}, e(Area,{v:d.opts, rot:"Opções", rows:6, set:function(x){ set("opts", x); }})));
  if(tipo==="vendmetal") camposDoTipo.push(e(Campo,{key:"i", rot:"Variações, uma por linha", dica:"Cada variação pede disponibilidade e metal."}, e(Area,{v:d.items, rot:"Variações", rows:6, set:function(x){ set("items", x); }})));
  if(tipo==="letras") camposDoTipo.push(e(Campo,{key:"l", rot:"Quantidade máxima de letras", dica:"De 1 a 26 (A a Z)."}, e(Txt,{tipo:"number", min:1, maxv:26, v:d.maxLetters, set:function(x){ set("maxLetters", x); }, rot:"Quantidade máxima de letras"})));
  if(tipo==="vend"){
    camposDoTipo.push(
      e("label",{key:"hs", className:"flex cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-bold"}, e("input",{type:"checkbox", checked:d.hasSlider, onChange:function(ev){ set("hasSlider", ev.target.checked); }, className:"size-4 accent-[#E8B84B]"}), "Perguntar a proporção de ouro e prata"),
      e("label",{key:"mo", className:"flex cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-bold"}, e("input",{type:"checkbox", checked:d.metalOn, onChange:function(ev){ set("metalOn", ev.target.checked); }, className:"size-4 accent-[#E8B84B]"}), "Perguntar o metal"),
      d.metalOn && e(Campo,{key:"ml", rot:"Título da pergunta de metal"}, e(Txt,{v:d.metalLabel, set:function(x){ set("metalLabel", x); }, rot:"Título da pergunta de metal"})),
      e("b",{key:"pt", className:"text-[12px] text-white/75"}, "Perguntas extras (opcionais)"),
      e(Perguntas,{key:"p", v:d.fields, set:function(x){ set("fields", x); }}));
  }
  var colCampos = e(Painel,{key:"c", t:"Campos do bloco", ic:"list-checks"}, camposDoTipo);
  var colPrevia = e(Painel,{key:"v", t:"Prévia ao vivo", ic:"eye"},
    erro ? e("p",{className:"rounded-lg bg-[#EF4444]/15 px-2 py-1.5 text-[12.5px] font-bold text-[#FCA5A5]"}, erro)
      : e(Fragment,null, e(PreviaBloco,{b:m.bloco}), amostra && e("div",{className:"flex flex-col gap-1 rounded-lg bg-white/5 p-2"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/60"}, "Exemplo de resposta"), e(RespostaView,{exibir:pkExibirResposta(m.bloco, amostra)}))));
  return e(Janela,{t:ex ? "Editar bloco" : "Novo bloco", sub:"Formulário do app da revendedora", fechar:p.fechar, colunas:[colTipo, colCampos, colPrevia],
    rodape:[e(Bt,{key:"s", tipo:"forte", ic:"floppy-disk", disabled:!!erro, onClick:salvar}, ex ? "Salvar bloco" : "Criar bloco"), e(Bt,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

// ---------- prévia do app (só blocos ativos, em moldura de celular) ----------
function PreviaApp(p){
  var cfg = pkConfigPublica(p.s);
  var corpo = e("div",{key:"cel", className:"mx-auto w-[300px] max-w-full rounded-[2rem] bg-black p-2 ring-2 ring-white/25"},
    e("div",{className:"flex flex-col gap-2 rounded-[1.5rem] bg-[#F7F1E3] p-3 text-center text-[#1B1409]"},
      e("div",{className:"font-heading text-[15px] font-bold"}, "Preferências do kit"),
      cfg.blocks.length===0 && e("p",{className:"py-6 text-[12.5px] text-black/60"}, "Nenhum bloco ativo no formulário."),
      cfg.blocks.map(function(b, i){ return e(PreviaBloco,{key:b.key, b:b, numero:i+1}); }),
      cfg.blocks.length>0 && e("div",{className:"rounded-lg bg-[#1B1409] py-2 text-[13px] font-bold text-white"}, "Salvar preferências")));
  return e(Janela,{t:"Prévia do app", sub:"Versão "+cfg.version+" da configuração · "+cfg.blocks.length+(cfg.blocks.length===1 ? " bloco ativo" : " blocos ativos"), fechar:p.fechar, colunas:[corpo]});
}

// ---------- aba ----------
function AbaPkFormulario(){
  var ctx = usePk(), s = ctx.s, pk = ctx.pk;
  var sj = useState(null), jan = sj[0];                  // {tipo:"novo"|"editar"|"excluir"|"previa", bloco?}
  var sd = useState({de:null, sobre:null}), dr = sd[0];  // arrastar
  var bl = pkBlocos(s), reais = bl.filter(function(b){ return !b.sistema; });
  var ativos = bl.filter(function(b){ return b.enabled; }).length;
  var ordenar = function(de, para){
    if(de==null || para==null || de===para) return;
    var ks = bl.map(function(b){ return b.key; }), x = ks.splice(de, 1)[0]; ks.splice(para, 0, x); pk("reordenar", {keys:ks});
  };
  var excluir = jan && jan.tipo==="excluir" ? pkAvisoExcluir(s, jan.bloco.key) : null;
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("p",{className:"text-[13.5px] text-white/80"}, e("b",null, reais.length+" blocos"), " no formulário · ", e("b",{className:"text-[#4ADE80]"}, ativos+" ligados"), " aparecem no app da revendedora · versão "+s.pk.config.versao),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ sj[1]({tipo:"novo"}); }}, "Novo bloco"),
        e(Bt,{ic:"arrows-clockwise", titulo:"Aumenta a versão da configuração lida pelo app", onClick:function(){ pk("versao_subir"); }}, "Subir versão"))),
    reais.length===0 && e(Vazio,{ic:"list-checks"}, "Nenhum bloco criado. O formulário do app está sem perguntas."),
    e(Tab,{cols:["Ordem", "Bloco", "Tipo", "O que a revendedora responde", "Fotos", "No app", ""]}, bl.map(function(b, i){
      return e("tr",{key:b.key, className:LINHA+(b.enabled ? "" : " opacity-60")},
        e(Td,{forte:true}, b.numero),
        e(Td,{forte:true, className:"whitespace-normal! text-left! min-w-32"}, e("span",{className:"inline-flex items-center gap-2"}, e(Bolinha,{cor:b.accent, s:12}), b.title)),
        e(Td,{className:"text-left!"}, e(Selo,{cor:b.sistema ? "#94A3B8" : "#E8B84B", ic:ICONE_TIPO[b.type]}, b.sistema ? "Do sistema" : ROTULO_TIPO[b.type])),
        e(Td,{className:"whitespace-normal! text-left! text-white/85 min-w-56 max-w-[22rem] leading-snug"}, opcoesBloco(b)),
        e(Td,null, b.allowImages ? "Sim" : "Não"),
        e(Td,null, e("span",{className:"inline-flex items-center gap-2"}, e(Interruptor,{on:b.enabled, rot:b.enabled ? "Desligar "+b.title : "Ligar "+b.title, onClick:function(){ pk("bloco_enabled", {key:b.key, enabled:!b.enabled}); }}), e("span",{className:"w-16 text-left text-[12px] font-bold "+(b.enabled ? "text-[#E8B84B]" : "text-white/50")}, b.enabled ? "Ligado" : "Desligado"))),
        e(Td,null, e("span",{className:"inline-flex items-center gap-1"},
          e(Ic,{ic:"caret-up", titulo:"Subir", disabled:i===0, onClick:function(){ ordenar(i, i-1); }}), e(Ic,{ic:"caret-down", titulo:"Descer", disabled:i===bl.length-1, onClick:function(){ ordenar(i, i+1); }}),
          !b.sistema && e(Ic,{ic:"pencil-simple", titulo:"Editar o bloco", onClick:function(){ sj[1]({tipo:"editar", bloco:b}); }}),
          !b.sistema && e(Ic,{ic:"trash", perigo:true, titulo:"Excluir o bloco", onClick:function(){ sj[1]({tipo:"excluir", bloco:b}); }}))));
    })),
    jan && jan.tipo==="novo" && e(EditorBloco,{key:"novo", fechar:function(){ sj[1](null); }}),
    jan && jan.tipo==="editar" && e(EditorBloco,{key:jan.bloco.key, bloco:jan.bloco, fechar:function(){ sj[1](null); }}),
    jan && jan.tipo==="previa" && e(PreviaApp,{s:s, fechar:function(){ sj[1](null); }}),
    jan && jan.tipo==="excluir" && e(Janela,{t:"Excluir bloco", sub:jan.bloco.title, fechar:function(){ sj[1](null); },
      colunas:[e(Painel,{key:"x", t:"Confirmação", ic:"warning"}, e("p",{className:"text-[13px]"}, "Esta ação é definitiva. O bloco deixa de aparecer no app."), excluir && excluir.texto && e("p",{className:"text-[12.5px] font-bold text-[#FDE68A]"}, excluir.texto))],
      rodape:[e(Bt,{key:"e", tipo:"perigo", ic:"trash", onClick:function(){ pk("bloco_del", {key:jan.bloco.key}); sj[1](null); }}, "Excluir bloco"), e(Bt,{key:"c", onClick:function(){ sj[1](null); }}, "Cancelar")]}));
}

export { AbaPkFormulario, EditorBloco, PreviaApp };
