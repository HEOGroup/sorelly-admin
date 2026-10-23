// Sorelly Admin · montagem — pages/producao/ProdConfig.js
// Produção → aba "Configurações" (só diretoria): funcionárias, códigos → categoria e faixas do bônus, em blocos lado a lado. Edição em janela com colunas.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, Janela, Mosaico, Pagina } from "@/apps/montagem/components/padrao";
import { FAIXAS_PADRAO, formatarInteiro, formatarReais } from "@/apps/montagem/domain/producao";
import { Aviso, Bt, Ic, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { Campo, Painel, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var IN = INPUT+" w-full text-center";
var faixaTxt = function(f){ return formatarInteiro(f.min)+(f.max==null ? " pç ou mais" : " a "+formatarInteiro(f.max)+" pç"); };
var Linha = function(p){ return e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5"}, p.children); };

function AbaProdConfig(){
  var x = usePr(), pr = x.pr;
  var sFn = useState(""), sCod = useState({codigo:"", rotulo:""}), sJ = useState(null), sConf = useState("");
  if(!x.admin) return e(Pagina,null, e(Aviso,null, "Somente a diretoria acessa."));
  var j = sJ[0], setJ = function(c){ sJ[1](Object.assign({}, j, c)); }, fechar = function(){ sJ[1](null); };
  var pede = function(chave, fazer){ if(sConf[0]!==chave){ sConf[1](chave); return; } sConf[1](""); fazer(); };
  var funcs = pr.funcionarias.slice().sort(function(a, b){ return a.posicao-b.posicao; });
  var cods = pr.codigos.slice().sort(function(a, b){ return a.codigo<b.codigo ? -1 : 1; });
  var faixas = pr.faixas.slice().sort(function(a, b){ return a.min-b.min; });

  var addFunc = function(){ if(x.exec("func_add", {nome:sFn[0]})) sFn[1](""); };
  var addCod = function(){ if(x.exec("cod_add", {codigo:sCod[0].codigo, rotulo:sCod[0].rotulo})) sCod[1]({codigo:"", rotulo:""}); };

  var salvarFunc = function(propagar){ if(x.exec("func_edit", {id:j.id, nome:j.nome, propagar:propagar})) fechar(); };
  var salvarCod = function(){ if(x.exec("cod_edit", {id:j.id, codigo:j.codigo, rotulo:j.rotulo})) fechar(); };
  var salvarFaixa = function(){
    var d = {min:j.min, max:j.max, valor:j.valor || 0};
    if(j.id ? x.exec("faixa_edit", Object.assign({id:j.id}, d)) : x.exec("faixa_add", d)) fechar();
  };

  var janela = null;
  if(j && j.tipo==="func"){
    var mudou = j.nome.trim()!==j.orig;
    janela = e(Janela,{t:"Funcionária", sub:j.orig, fechar:fechar, colunas:[
      e(Painel,{key:"n", t:"Nome", ic:"pencil-simple"}, e(Campo,{rot:"Nome"}, e("input",{value:j.nome, autoFocus:true, onChange:function(ev){ setJ({nome:ev.target.value, perg:false}); }, className:IN}))),
      e(Painel,{key:"a", t:"Ações", ic:"gear"},
        j.perg ? e("div",{className:"flex flex-col gap-2"}, e("p",{className:"text-[13px] font-bold"}, "Propagar o novo nome para os lançamentos antigos?"),
          e(Bt,{tipo:"forte", ic:"check", onClick:function(){ salvarFunc(true); }}, "Sim, propagar"), e(Bt,{ic:"clock-counter-clockwise", onClick:function(){ salvarFunc(false); }}, "Não, manter o histórico"))
        : e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:function(){ if(mudou) setJ({perg:true}); else fechar(); }}, "Salvar"),
        e(Bt,{ic:"x", onClick:fechar}, "Cancelar"))]});
  } else if(j && j.tipo==="cod"){
    janela = e(Janela,{t:"Código", sub:j.orig, fechar:fechar, colunas:[
      e(Painel,{key:"n", t:"Código e categoria", ic:"pencil-simple"}, e(Campo,{rot:"Prefixo do código"}, e("input",{value:j.codigo, onChange:function(ev){ setJ({codigo:ev.target.value.toUpperCase()}); }, className:IN+" "+MONO})), e(Campo,{rot:"Categoria"}, e("input",{value:j.rotulo, onChange:function(ev){ setJ({rotulo:ev.target.value}); }, className:IN}))),
      e(Painel,{key:"a", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:salvarCod}, "Salvar"), e(Bt,{ic:"x", onClick:fechar}, "Cancelar"))]});
  } else if(j && j.tipo==="faixa"){
    janela = e(Janela,{t:j.id ? "Faixa do bônus" : "Nova faixa do bônus", sub:"Peças no mês e valor do bônus", fechar:fechar, colunas:[
      e(Painel,{key:"n", t:"Peças no mês", ic:"pencil-simple"},
        e(Campo,{rot:"Mínimo de peças"}, e("input",{type:"number", min:0, inputMode:"numeric", value:j.min, onChange:function(ev){ setJ({min:ev.target.value}); }, className:IN+" "+MONO})),
        e(Campo,{rot:"Máximo de peças", dica:"Vazio = sem teto"}, e("input",{type:"number", min:0, inputMode:"numeric", value:j.max==null ? "" : j.max, onChange:function(ev){ setJ({max:ev.target.value}); }, className:IN+" "+MONO}))),
      e(Painel,{key:"v", t:"Bônus", ic:"coins"}, e(Campo,{rot:"Valor do bônus"}, e(Dinheiro,{value:j.valor || 0, label:"Valor do bônus", onChange:function(v){ setJ({valor:v || 0}); }}))),
      e(Painel,{key:"a", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:salvarFaixa}, "Salvar"), e(Bt,{ic:"x", onClick:fechar}, "Cancelar"))]});
  }

  return e(Pagina,null,
    e(Mosaico,{min:"24rem"},
      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Funcionárias", dir:funcs.length},
        e("div",{className:"flex flex-wrap items-center justify-center gap-2 p-2"},
          e("input",{value:sFn[0], placeholder:"Nome da funcionária", "aria-label":"Nome da funcionária", onChange:function(ev){ sFn[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") addFunc(); }, className:INPUT+" h-9! w-56 text-center text-[13px]!"}),
          e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", onClick:addFunc}, "Adicionar")),
        funcs.length ? funcs.map(function(f){ var ch = "f"+f.id;
          return e(Linha,{key:f.id}, e("b",{className:"min-w-0 flex-1 truncate text-[13px] "+(f.ativa ? "" : "text-white/50")}, f.nome),
            e("button",{type:"button", onClick:function(){ x.exec("func_edit", {id:f.id, ativa:!f.ativa}); }, title:f.ativa ? "Marcar como inativa" : "Marcar como ativa"}, e(Selo,{cor:f.ativa ? "ok" : "neutro"}, f.ativa ? "Ativa" : "Inativa")),
            e(Ic,{ic:"pencil-simple", titulo:"Renomear", onClick:function(){ sJ[1]({tipo:"func", id:f.id, orig:f.nome, nome:f.nome, perg:false}); }}),
            sConf[0]===ch ? e(Bt,{tipo:"perigo", mini:true, ic:"trash", onClick:function(){ pede(ch, function(){ x.exec("func_del", {id:f.id}); }); }}, "Confirmar") : e(Ic,{ic:"trash", perigo:true, titulo:"Excluir (os lançamentos antigos ficam)", onClick:function(){ pede(ch, function(){}); }})); })
        : e("div",{className:"p-2"}, e(Vazio,{ic:"users"}, "Nenhuma funcionária cadastrada."))),

      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Códigos e categorias", dir:cods.length},
        e("div",{className:"flex flex-wrap items-center justify-center gap-2 p-2"},
          e("input",{value:sCod[0].codigo, placeholder:"Prefixo", "aria-label":"Prefixo do código", onChange:function(ev){ sCod[1](Object.assign({}, sCod[0], {codigo:ev.target.value.toUpperCase()})); }, className:INPUT+" h-9! w-24 text-center text-[13px]! "+MONO}),
          e("input",{value:sCod[0].rotulo, placeholder:"Categoria", "aria-label":"Categoria", onChange:function(ev){ sCod[1](Object.assign({}, sCod[0], {rotulo:ev.target.value})); }, onKeyDown:function(ev){ if(ev.key==="Enter") addCod(); }, className:INPUT+" h-9! w-44 text-center text-[13px]!"}),
          e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", onClick:addCod}, "Adicionar"),
          e(Bt,{ic:"books", className:"h-9 py-0!", onClick:function(){ x.exec("cod_padrao"); }}, "Carregar códigos padrão")),
        cods.length ? cods.map(function(c){ var ch = "c"+c.id;
          return e(Linha,{key:c.id}, e("b",{className:MONO+" w-16 text-[13px]"}, c.codigo), e("span",{className:"min-w-0 flex-1 truncate text-[13px]"}, c.rotulo),
            e(Ic,{ic:"pencil-simple", titulo:"Editar código", onClick:function(){ sJ[1]({tipo:"cod", id:c.id, orig:c.codigo, codigo:c.codigo, rotulo:c.rotulo}); }}),
            sConf[0]===ch ? e(Bt,{tipo:"perigo", mini:true, ic:"trash", onClick:function(){ pede(ch, function(){ x.exec("cod_del", {id:c.id}); }); }}, "Confirmar") : e(Ic,{ic:"trash", perigo:true, titulo:"Excluir código", onClick:function(){ pede(ch, function(){}); }})); })
        : e("div",{className:"p-2"}, e(Vazio,{ic:"list-bullets"}, "Nenhum código cadastrado."))),

      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Faixas do bônus", dir:(faixas.length || FAIXAS_PADRAO.length)},
        e("div",{className:"flex flex-wrap items-center justify-center gap-2 p-2"},
          e(Bt,{tipo:"forte", ic:"plus", className:"h-9 py-0!", onClick:function(){ sJ[1]({tipo:"faixa", id:null, min:"", max:"", valor:0}); }}, "Nova faixa"),
          !faixas.length && e(Selo,{cor:"info", titulo:"Sem faixas cadastradas, vale o padrão abaixo."}, "Padrão em uso")),
        faixas.length ? faixas.map(function(f){ var ch = "b"+f.id;
          return e(Linha,{key:f.id}, e("span",{className:"min-w-0 flex-1 text-[13px] font-bold"}, faixaTxt(f)), e("b",{className:MONO+" text-[13px]"}, formatarReais(f.valor)),
            e(Ic,{ic:"pencil-simple", titulo:"Editar faixa", onClick:function(){ sJ[1]({tipo:"faixa", id:f.id, min:f.min, max:f.max, valor:f.valor}); }}),
            sConf[0]===ch ? e(Bt,{tipo:"perigo", mini:true, ic:"trash", onClick:function(){ pede(ch, function(){ x.exec("faixa_del", {id:f.id}); }); }}, "Confirmar") : e(Ic,{ic:"trash", perigo:true, titulo:"Excluir faixa", onClick:function(){ pede(ch, function(){}); }})); })
        : FAIXAS_PADRAO.map(function(f, i){ return e(Linha,{key:i}, e("span",{className:"min-w-0 flex-1 text-[13px] font-bold text-white/75"}, faixaTxt(f)), e("b",{className:MONO+" text-[13px] text-white/75"}, formatarReais(f.valor))); }))),
    janela);
}
export { AbaProdConfig };
