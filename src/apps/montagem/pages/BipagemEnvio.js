// Sorelly Admin · montagem — pages/BipagemEnvio.js
// Atendimento interno › Bipagem de envio (18/11/2026, Marcus: "enquanto as listagens não vêm todas do app, uma aba onde elas preenchem o nome da revendedora, o sistema já diz se tem encomenda do setor de Encomendas, e elas dão OK quando bipam").
// Caso que motivou: a funcionária fechou o kit da Solange e esqueceu as peças da encomenda. Agora a bipadora vê as encomendas abertas ANTES de fechar o kit e só dá o OK confirmando que as peças vão junto.
// Estado: s.er.envios (módulo er, junto das encomendas). Regras em domain/encomendas.js (encomendasDaRevendedora, op env_bipar).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROTULO_STATUS, encomendasDaRevendedora, formatarDia } from "@/apps/montagem/domain/encomendas";
import { useEr } from "@/apps/montagem/pages/encomendas/visual";
import { e, useState } from "@/shared/react";

var CAMPO = "h-8 w-full rounded-md border border-border bg-card px-2.5 text-center text-[13px] text-foreground outline-none placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-[var(--bloco-titulo)]";
var semAcento = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };

function AbaBipagemEnvio(){
  var E = useEr(), s = E.s, er = E.er;
  var st = useState({nome:"", conferiu:false}), f = st[0];
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  // nomes sugeridos: revendedoras da agenda do atendimento interno e as que já pediram no setor Encomendas
  var nomes = {};
  (s.internos || []).forEach(function(x){ if(x && x.nome) nomes[x.nome] = 1; });
  (er.pedidos || []).forEach(function(p){ if(p.revendedora) nomes[p.revendedora] = 1; });
  var lista = Object.keys(nomes).sort();
  var nome = f.nome.trim(), pronto = semAcento(nome).length>=3;
  // se digitou só parte do nome e existe um único nome parecido, usa ele
  var parecidos = pronto ? lista.filter(function(n){ return semAcento(n).indexOf(semAcento(nome))>=0; }) : [];
  var nomeFinal = parecidos.length===1 ? parecidos[0] : nome;
  var abertas = pronto ? encomendasDaRevendedora(er, nomeFinal) : [];
  var bloqueia = abertas.length>0 && !f.conferiu;
  var confirmar = function(){
    if(E.exec("env_bipar", {rev:nomeFinal, conferiu:f.conferiu})) st[1]({nome:"", conferiu:false});
  };
  var linhas = (er.envios || []).slice().sort(function(a, b){ return String(b.em).localeCompare(String(a.em)); }).slice(0, 300).map(function(x){
    return {id:x.id, data:String(x.em).slice(0, 10), hora:String(x.em).slice(11, 16), rev:x.revendedora, enc:x.pedidos && x.pedidos.length ? String(x.pedidos.length) : "Nenhuma", por:x.por}; });
  var cols = [{k:"data", t:"Dia", fmt:formatarDia}, {k:"hora", t:"Hora"}, {k:"rev", t:"Revendedora"}, {k:"enc", t:"Encomendas"}, {k:"por", t:"Quem bipou"}];

  var cartao = !pronto ? null
    : abertas.length
      ? e("div",{className:"flex flex-col gap-2 rounded-lg border-2 border-[#fbbf24] bg-[#fbbf24]/10 p-2.5"},
          e("p",{className:"text-center text-[13px] font-bold text-[#fde68a]"}, "Atenção: "+nomeFinal+" tem "+abertas.length+(abertas.length===1 ? " encomenda" : " encomendas")+" do setor de Encomendas para este kit"),
          abertas.map(function(p){
            var itens = (p.itens || []).map(function(i){ return i.txt; }).filter(Boolean);
            return e("div",{key:p.id, className:"flex flex-col gap-0.5 rounded-md bg-black/25 px-2.5 py-1.5 text-center text-[11px]"},
              e("b",{className:"text-[13px]"}, "Pedido "+p.id+" · "+(ROTULO_STATUS[p.status] || p.status)+" · "+(p.pecas || []).length+((p.pecas || []).length===1 ? " peça separada" : " peças separadas")),
              p.descricao && e("span",null, "Pedido: "+p.descricao),
              itens.length>0 && e("span",null, itens.slice(0, 4).join(" · ")+(itens.length>4 ? " · e mais "+(itens.length-4) : "")));
          }),
          e("label",{className:"flex cursor-pointer items-center justify-center gap-2.5 rounded-md bg-black/25 px-2.5 py-2 text-[13px] font-bold"},
            e("input",{type:"checkbox", checked:f.conferiu, onChange:function(ev){ set("conferiu", ev.target.checked); }, className:"size-5 shrink-0"}),
            e("span",null, "Conferi: as peças separadas vão junto com o kit")))
      : e("div",{className:"rounded-lg border border-[#4ade80]/60 bg-[#4ade80]/10 px-2.5 py-2 text-center text-[13px] font-bold text-[#bbf7d0]"}, "Sem encomenda pendente para "+nomeFinal);

  return e(Pagina,{className:PADRAO_BLOCOS},
    e(BlocoPainel,{titulo:"Bipagem de envio", compacto:true},
      e("div",{className:"mx-auto flex w-full max-w-xl flex-col gap-2.5 p-3"},
        e("input",{type:"text", list:"bipenv-nomes", autoComplete:"off", autoFocus:true, "aria-label":"Nome da revendedora", value:f.nome, placeholder:"Nome da revendedora (3 letras ou mais)", onChange:function(ev){ st[1](function(o){ return {nome:ev.target.value, conferiu:false}; }); }, onKeyDown:function(ev){ if(ev.key==="Enter" && pronto && !bloqueia) confirmar(); }, className:CAMPO}),
        e("datalist",{id:"bipenv-nomes"}, lista.map(function(n){ return e("option",{key:n, value:n}); })),
        cartao,
        pronto && e(Botao,{principal:true, desabilitado:bloqueia, onClick:confirmar}, "OK, bipei o kit"),
        bloqueia && e("p",{className:"text-center text-[11px]"}, "Marque a conferência das peças separadas para dar o OK."))),
    e(BlocoPainel,{titulo:"Bipagens registradas", compacto:true},
      e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, limite:300, vazio:"Nenhuma bipagem registrada ainda."})));
}

export { AbaBipagemEnvio };
