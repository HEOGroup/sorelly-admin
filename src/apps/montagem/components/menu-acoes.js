// Sorelly Admin · montagem e bipagem — components/menu-acoes.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { CondLista, NovasCond, novasOk } from "@/apps/montagem/components/condicionais";
import { condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { MOTIVOS } from "@/apps/montagem/domain/config";
import { BIPADORAS, nomeDe, podeLiberarExcecao } from "@/apps/montagem/domain/equipe";
import { semMontador, soEncomendas } from "@/apps/montagem/domain/regras";
import { SEM_KIT } from "@/apps/montagem/domain/status";
import { sugerido } from "@/apps/montagem/domain/vendas";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { MoneyInput } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";

function MenuAcoes(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = p.k;
  var st = useState(null), pos = st[0], setPos = st[1];
  var mo = useState(false), corrigindo = mo[0], setCorr = mo[1];   // false | true (corrigir valor) | "finalizar" (finalizar bipagem)
  var cv = useState(k.valorReal||k.valor||0), vc = cv[0], setVc = cv[1];
  var nc = useState([""]), novaC = nc[0], setNovaC = nc[1];
  var ref = useRef(null);
  useEffect(function(){
    if(!pos) return;
    var fechar = function(ev){ if(ref.current && ref.current.contains(ev.target)) return; setPos(null); };
    var sair = function(){ setPos(null); };
    document.addEventListener("mousedown", fechar); window.addEventListener("scroll", sair, true); window.addEventListener("resize", sair);
    return function(){ document.removeEventListener("mousedown", fechar); window.removeEventListener("scroll", sair, true); window.removeEventListener("resize", sair); };
  }, [pos]);
  var fazer = function(a){ return function(){ if(a) d(a); else if(p.naLinha) p.naLinha(); setPos(null); }; };
  var item = function(key, txt, onClick, cls){ return e("button",{key:key, onClick:onClick, className:"flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted "+(cls||"")}, txt); };
  var titulo = function(key, txt){ return e("p",{key:key, className:"px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"}, txt); };
  var itens = [];
  // A supervisão pode fazer tudo pela listagem: montar ela mesma, pôr uma montadora para começar, concluir, bipar
  var livresM = s.montadoras.filter(function(m){ return !s.kits.some(function(x){return x.montId===m.id && x.status==="montando";}); });
  var livresB = BIPADORAS.filter(function(b){ return !s.kits.some(function(x){return x.bipId===b.id && x.status==="bipando";}); });
  // Kit grande (acima do limite de Encomendas): só o setor Encomendas; fora dele é EXCEÇÃO e só Marcus e Deysiane liberam
  var grande = soEncomendas(k, s.cfg), podeExc = podeLiberarExcecao(s.usuario);
  var listaMont = function(pref, fonte, acaoDe, marcada){
    var out = [], enc = fonte.filter(function(m){ return m.encomendas; }), outros = fonte.filter(function(m){ return !m.encomendas; });
    var it = function(m, exc){ return item(pref+m.id, m.nome, fazer(acaoDe(m, exc)), marcada && marcada(m) ? "font-semibold text-primary" : ""); };
    if(!grande) return fonte.map(function(m){ return it(m, false); });
    out.push(titulo(pref+"te","Setor Encomendas (kit acima de "+BK(s.cfg.limiteEncomendas)+")"));
    enc.forEach(function(m){ out.push(it(m, false)); });
    if(podeExc){ out.push(titulo(pref+"tx","Exceção liberada por "+nomeDe(s.usuario))); outros.forEach(function(m){ out.push(it(m, true)); }); }
    return out;
  };
  if(k.status==="pendente" || k.status==="ajuste"){
    itens.push(titulo("tq","Quem vai montar"));
    if(!grande || podeExc) itens.push(item("eu","▶ Montar eu mesma ("+nomeDe(s.usuario)+")"+(grande ? " · exceção" : ""), fazer({type:"INICIAR_M", id:k.id, montId:s.usuario, forcar:true, excecao:grande}), "font-semibold text-purple"));
    itens.push(titulo("tm","Ou escolher quem começa a montagem"));
    listaMont("im", livresM, function(m, exc){ return {type:"INICIAR_M", id:k.id, montId:m.id, forcar:true, excecao:exc}; }).forEach(function(x){ itens.push(x); });
  }
  // Kit sem montador (antigo ou de demonstração): a supervisão informa quem montou, senão ele não segue
  if(semMontador(k)){ itens.push(titulo("tsm","Informar quem montou"));
    s.montadoras.forEach(function(m){ itens.push(item("sm"+m.id, m.nome, fazer({type:"INFORMAR_MONT", id:k.id, montId:m.id, excecao:true}), "text-[#F87171]")); }); }
  if(k.status==="montando") itens.push(item("cm", condNums(k).length && !condOk(k,"m") ? "✓ Concluir montagem (marca as condicionais como pegas)" : "✓ Concluir montagem", fazer({type:"CONCLUIR_M", id:k.id, condPegas:true}), "font-semibold text-success"));
  if(k.status==="montado"){
    itens.push(item("be","▶ Bipar eu mesma ("+nomeDe(s.usuario)+")", fazer({type:"INICIAR_B", id:k.id, bipId:s.usuario}), "font-semibold text-info"));
    itens.push(titulo("tb","Começar a bipagem com"));
    livresB.forEach(function(b){ itens.push(item("ib"+b.id, b.nome, fazer({type:"INICIAR_B", id:k.id, bipId:b.id}))); });
  }
  if(k.status==="bipando" && k.bipId!==s.usuario && p.naLinha) itens.push(item("fb","✓ Finalizar bipagem na linha", fazer(null), "font-semibold text-success"));
  if(k.status==="pendente"){
    if(k.designada) itens.push(item("dev","Devolver à fila", fazer({type:"DESIGNAR", id:k.id, montId:null})));
    itens.push(titulo("t1","Designar para"));
    listaMont("m", s.montadoras, function(m, exc){ return {type:"DESIGNAR", id:k.id, montId:m.id, excecao:exc}; }, function(m){ return k.designada===m.id; }).forEach(function(x){ itens.push(x); });
  }
  if(k.status==="semvalor") itens.push(item("sug","Usar sugerido, "+BK(sugerido(k.vendas, s.cfg)), fazer({type:"DEFINIR_VALOR", id:k.id, valor:sugerido(k.vendas, s.cfg)})));
  if((k.status==="semvalor" || k.status==="pendente") && !SEM_KIT[k.tipoKit]) itens.push(item("calc","Calcular na calculadora de kits", fazer({type:"ABRIR_CALC", id:k.id}), "text-primary"));
  if(k.status==="supervisao"){
    itens.push(item("lib","Conferido, liberar para bipagem", fazer({type:"APROVAR", id:k.id}), "font-medium text-success"));
    itens.push(titulo("t2","Voltar para ajuste"));
    MOTIVOS.forEach(function(m){ itens.push(item("r"+m, m, fazer({type:"REPROVAR", id:k.id, motivo:m}), "text-destructive")); });
  }
  if(k.fimB) itens.push(item("corr","Corrigir valor bipado ("+BK(k.valorReal)+")", function(){ setVc(k.valorReal||k.valor); setCorr(true); }));
  itens.push(item("hist", s.kitAberto===k.id ? "Esconder histórico" : "Ver histórico", fazer({type:"KIT_ABERTO", id:k.id}), "text-muted-foreground"));
  // Retirada só pelo botão "Fazer retirada" da faixa, que exige o código da representante e a assinatura
  if(k.status==="bipado" && p.abrirRetirada) itens.push(e("div",{key:"sep", className:"my-1 border-t border-border"}),
    item("ret","Fazer retirada…", function(){ setPos(null); p.abrirRetirada(); }, "font-medium text-success"));
  return e("div",{ref:ref, className:"flex justify-center"},
    e("button",{"aria-label":"Ações do kit", "aria-expanded":!!pos,
        onClick:function(ev){ if(pos){ setPos(null); return; } setCorr(false); var r = ev.currentTarget.getBoundingClientRect(); setPos({top:r.bottom+4, right:window.innerWidth-r.right}); },
        className:"grid size-7 place-items-center rounded-md text-lg leading-none text-muted-foreground hover:bg-muted hover:text-foreground "+(pos?"bg-muted text-foreground":"")+(k.status==="supervisao"?" text-warning":"")},"⋯"),
    pos && e("div",{className:"fixed z-50 max-h-[32rem] "+(corrigindo==="finalizar"?"w-96":"w-64")+" overflow-auto rounded-lg bg-popover p-1 shadow-xl ring-1 ring-foreground/10", style:{top:pos.top, right:pos.right}},
      corrigindo==="finalizar"
        ? e("div",{className:"flex flex-col gap-2 p-2"},
            e("p",{className:"text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"},"Finalizar bipagem de "+k.rev),
            e(MoneyInput,{value:vc, onChange:setVc, sm:true, autoFocus:true, label:"Total bipado", className:"w-full"}),
            condNums(k).length>0 && e(CondLista,{k:k, papel:"b"}),
            e(NovasCond,{v:novaC, onChange:setNovaC, alto:"h-8!", larg:"w-36"}),
            e("div",{className:"flex gap-1.5"},
              e(Btn,{v:"primary", sm:true, ic:"check", disabled:!(vc>0) || !novasOk(novaC) || !condOk(k, "b"), className:"flex-1", onClick:function(){ d({type:"CONCLUIR_B", id:k.id, real:vc, novas:novaC}); setPos(null); }},"Finalizar"),
              e(Btn,{v:"ghost", sm:true, onClick:function(){setCorr(false);}},"Voltar")))
      : corrigindo
        ? e("div",{className:"flex flex-col gap-2 p-2"},
            e("p",{className:"text-[12px] font-semibold uppercase tracking-wide text-muted-foreground"},"Valor bipado de "+k.rev),
            e(MoneyInput,{value:vc, onChange:setVc, sm:true, autoFocus:true, label:"Novo valor bipado", className:"w-full"}),
            e("div",{className:"flex gap-1.5"},
              e(Btn,{v:"primary", sm:true, ic:"save", disabled:!(vc>0), className:"flex-1", onClick:function(){ d({type:"CORRIGIR_B", id:k.id, real:vc}); setPos(null); }},"Salvar"),
              e(Btn,{v:"ghost", sm:true, onClick:function(){setCorr(false);}},"Voltar")))
        : itens));
}

export { MenuAcoes };
