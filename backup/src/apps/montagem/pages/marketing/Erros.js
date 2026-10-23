// Sorelly Admin · montagem — pages/marketing/Erros.js
// Marketing → Erros em produtos: fila por produto, copiar código e nome, encerrar com desfecho, lançar reporte à mão e histórico.
import { Janela, Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { DESFECHOS, TIPOS_ERRO, errosEncerrados, errosFila, formatarDia, rotuloDesfecho, rotuloTipoErro } from "@/apps/montagem/domain/marketing";
import { Botao, CAMPO, COR, Campo, Chip, Vazio, alternar, porDe, useCopiar } from "@/apps/montagem/pages/marketing/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var dia = function(t){ return formatarDia(String(t||"").slice(0, 10)); };

function JanelaEncerrar(p){
  var cx = use(), por = porDe(cx.state), st = useState("");
  return e(Janela,{t:"Encerrar produto "+p.item.codigo, sub:(p.item.nome||"")+(p.item.nome ? " · " : "")+p.item.qtdReportes+(p.item.qtdReportes===1 ? " reporte" : " reportes"), fechar:p.fechar, colunas:[
    e("div",{key:"a", className:"flex flex-col gap-1.5"}, e("span",{className:"text-center text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, "Desfecho"),
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, DESFECHOS.map(function(d){ return e(Chip,{key:d.valor, on:st[0]===d.valor, onClick:function(){ st[1](d.valor); }}, d.rotulo); })))],
    rodape:[e(Botao,{key:"s", principal:true, desativado:!st[0], onClick:function(){ cx.dispatch({type:"MK", op:"erro_encerrar", codigo:p.item.codigo, desfecho:st[0], por:por}); p.fechar(); }}, "Encerrar"), e(Botao,{key:"c", onClick:p.fechar}, "Cancelar")]});
}
function JanelaReporte(p){
  var cx = use(), por = porDe(cx.state), st = useState({codigo:"", nome:"", tipos:[], revendedora:""}), f = st[0];
  var set = function(c){ st[1](Object.assign({}, f, c)); };
  return e(Janela,{t:"Lançar reporte", fechar:p.fechar, colunas:[
    e("div",{key:"a", className:"flex flex-col gap-2.5"},
      e(Campo,{t:"Código do produto"}, e("input",{value:f.codigo, autoFocus:true, onChange:function(ev){ set({codigo:ev.target.value}); }, className:CAMPO+" text-center uppercase"})),
      e(Campo,{t:"Nome do produto (opcional)"}, e("input",{value:f.nome, onChange:function(ev){ set({nome:ev.target.value}); }, className:CAMPO+" text-center"})),
      e(Campo,{t:"Revendedora (opcional)"}, e("input",{value:f.revendedora, onChange:function(ev){ set({revendedora:ev.target.value}); }, className:CAMPO+" text-center"}))),
    e("div",{key:"b", className:"flex flex-col gap-1.5"}, e("span",{className:"text-center text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, "O que está errado"),
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, TIPOS_ERRO.map(function(t){ return e(Chip,{key:t.valor, on:f.tipos.indexOf(t.valor)!==-1, onClick:function(){ set({tipos:alternar(f.tipos, t.valor)}); }}, t.rotulo); })))],
    rodape:[e(Botao,{key:"s", principal:true, desativado:!f.codigo.trim() || !f.tipos.length, onClick:function(){ cx.dispatch({type:"MK", op:"erro_add", codigo:f.codigo, nome:f.nome, tipos:f.tipos, revendedora:f.revendedora, por:por}); p.fechar(); }}, "Lançar"), e(Botao,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

function AbaMkErros(){
  var s = use().state, sa = useState("fila"), se = useState(null), sl = useState(false), cp = useCopiar();
  var fila = errosFila(s), enc = errosEncerrados(s);
  var copia = function(chave, texto, rotulo){ return e("button",{type:"button", disabled:!texto, onClick:function(){ cp[1](chave, texto); }, title:"Copiar "+rotulo.toLowerCase(), className:"rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold hover:bg-white/20 disabled:opacity-40"}, cp[0]===chave ? "Copiado ✓" : rotulo); };
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e(Chip,{on:sa[0]==="fila", onClick:function(){ sa[1]("fila"); }}, "Pendentes ("+fila.length+")"),
      e(Chip,{on:sa[0]==="enc", onClick:function(){ sa[1]("enc"); }}, "Encerrados ("+enc.length+")"),
      e(Botao,{principal:true, onClick:function(){ sl[1](true); }}, "+ Lançar reporte")),
    sa[0]==="fila" ? (!fila.length ? e(Vazio,null, "Nenhum produto com erro pendente.") :
      e(Tab,{cols:["Código", "Produto", "Reportes", "Problemas", "Desde", "Revendedoras", "Ações"]}, fila.map(function(x){
        return e("tr",{key:x.codigo, className:LINHA},
          e(Td,{dinheiro:true, forte:true}, x.codigo),
          e(Td,null, x.nome || "—"),
          e(Td,{dinheiro:true, cor:x.qtdReportes>2 ? "ruim" : undefined}, String(x.qtdReportes)),
          e(Td,null, x.tipos.map(rotuloTipoErro).join(", ")),
          e(Td,{dinheiro:true}, dia(x.primeiroEm)),
          e(Td,{dinheiro:true}, String(x.revendedoras.length)),
          e(Td,null, e("div",{className:"flex justify-center gap-1"}, copia("c"+x.codigo, x.codigo, "Código"), copia("n"+x.codigo, x.nome, "Nome"),
            e("button",{type:"button", onClick:function(){ se[1](x); }, className:"rounded-md px-2 py-0.5 text-[11px] font-bold text-white", style:{background:COR+"55"}}, "Encerrar"))));
      })))
    : (!enc.length ? e(Vazio,null, "Nenhum produto encerrado.") :
      e(Tab,{cols:["Código", "Produto", "Reportes", "Desfecho", "Encerrado em", "Por"]}, enc.map(function(x, i){
        return e("tr",{key:x.codigo+"|"+i, className:LINHA},
          e(Td,{dinheiro:true, forte:true}, x.codigo), e(Td,null, x.nome || "—"), e(Td,{dinheiro:true}, String(x.qtdReportes)),
          e(Td,{cor:x.desfecho==="corrigido" ? "ok" : "neutro"}, rotuloDesfecho(x.desfecho)), e(Td,{dinheiro:true}, dia(x.em)), e(Td,null, x.por || "—"));
      }))),
    se[0] && e(JanelaEncerrar,{item:se[0], fechar:function(){ se[1](null); }}),
    sl[0] && e(JanelaReporte,{fechar:function(){ sl[1](false); }}));
}
export { AbaMkErros };
