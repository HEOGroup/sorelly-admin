// Sorelly Admin · montagem — components/janela-montar.js
// Janela do kit na listagem do dia (19/10/2026): quem vai montar, preferências da revendedora (módulo Preferências do Kit), condicionais e o botão de iniciar.
// Dinheiro (valor do kit e venda) só aparece para a supervisão e a diretoria; montadora nunca vê valor.
import { Janela } from "@/apps/montagem/components/padrao";
import { CondChips, CondLista } from "@/apps/montagem/components/condicionais";
import { condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe, papelDe, podeLiberarExcecao } from "@/apps/montagem/domain/equipe";
import { AVISO_CONFIANCA, ROTULO_FONTE, formatarDataHora, pkDetalhe } from "@/apps/montagem/domain/preferencias-kit";
import { listagemDe, motivoNaoMonta, nomesEncomendas, pecasPara, semMontador, soEncomendas, ehEncomendas } from "@/apps/montagem/domain/regras";
import { TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK } from "@/apps/montagem/lib/format";
import { RespostaView } from "@/apps/montagem/pages/preferencias-kit/resposta";
import { Aviso, BarraMetal, Painel, Selo } from "@/apps/montagem/pages/preferencias-kit/visual";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Relogio } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";

var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\s+/g," ").trim(); };
// preferências da revendedora do kit, procuradas pelo nome no módulo Preferências do Kit (nada é inventado: sem resposta = null)
function prefsDoKit(s, k){
  var pk = s.pk; if(!pk || !pk.revendedoras) return null;
  var r = pk.revendedoras.find(function(x){ return semAcento(x.nome)===semAcento(k.rev); }); if(!r) return null;
  var det = pkDetalhe(s, r.id); return det && det.preferencias.temPreferencias ? det : null;
}
var SELO_SEM = e("span",{className:"inline-flex items-center rounded-full bg-[#7A1F1F] px-2 py-0.5 text-[11px] font-bold text-white", title:"Este kit não tem montador informado"}, "Sem montador");

function JanelaMontar(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = s.kits.find(function(x){ return x.id===p.kitId; });
  var sup = papelDe(s.usuario)==="supervisao", euMont = papelDe(s.usuario)==="montadora";
  var podeExc = podeLiberarExcecao(s.usuario);
  var grande = k ? soEncomendas(k, s.cfg) : false;
  var ocupada = function(id){ return s.kits.some(function(x){ return x.montId===id && x.status==="montando"; }); };
  // quem monta: montadora = ela mesma; supervisão escolhe (começa em quem a regra permite)
  var qs = useState(function(){
    if(euMont) return s.usuario;
    if(!k) return s.usuario;
    if(!grande) return s.usuario;
    var enc = s.montadoras.find(function(m){ return m.encomendas && !ocupada(m.id); }) || s.montadoras.find(function(m){ return m.encomendas; });
    return enc ? enc.id : s.usuario;
  }), quem = qs[0];
  var ex = useState(false), excecao = ex[0];
  if(!k) return null;
  var l = listagemDe(s, k), prefs = prefsDoKit(s, k), tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit;
  var conds = condNums(k), pecas = pecasPara(k.valor, s.cfg);
  var montando = k.status==="montando", podeIniciar = k.status==="pendente" || k.status==="ajuste";
  var minha = montando && (k.montId===s.usuario || sup);
  var motivo = podeIniciar ? motivoNaoMonta(s, k, quem, excecao) : "";
  if(podeIniciar && !motivo && k.status==="pendente" && k.designada && k.designada!==quem && !sup) motivo = "Este kit foi pedido para "+nomeDe(k.designada);
  if(podeIniciar && !motivo && ocupada(quem)) motivo = nomeDe(quem)+" já está montando outro kit";
  var iniciar = function(){ d({type:"INICIAR_M", id:k.id, montId:quem, forcar:sup, excecao:excecao}); };
  var selo = function(txt, cor, titulo){ return e(Selo,{key:txt, cor:cor, titulo:titulo}, txt); };

  var colKit = e(Painel,{key:"k", t:"Kit", ic:"package"},
    e("b",{className:"text-[15px]"}, k.rev),
    e("span",{className:"text-[12.5px] text-white/75"}, l ? l.rep+" · retirada às "+l.horario : ""),
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      selo(tipo[0], "#38BDF8"),
      modalidadeDe(s, k.rev)==="prata" && selo("Kit 100% Prata", "#CBD5E1"),
      k.prio && selo("Prioritário", "#E8B84B"),
      k.ultimaHora && selo("Última hora", "#FB923C"),
      grande && selo("Só Encomendas", "#A78BFA", "Kit acima do limite de Encomendas"),
      semMontador(k) && SELO_SEM),
    k.status==="ajuste" && e("p",{className:"rounded-lg bg-[#EF4444]/20 px-2 py-1 text-[12.5px] font-bold text-[#F87171]"}, "Voltou para ajuste: "+k.motivo),
    sup && e("div",{className:"flex items-center justify-center gap-4 text-[12.5px]"},
      e("span",null, "Valor do kit ", e("b",null, k.valor ? BK(k.valor) : "—")),
      e("span",null, "Venda atual ", e("b",null, k.vendas && k.vendas[0]!==undefined ? BK(k.vendas[0]) : "—"))),
    grande && e("p",{className:"rounded-lg bg-[#A78BFA]/15 px-2 py-1 text-[12px] font-bold text-[#C4B5FD]"}, "Kit acima do limite: só o setor Encomendas monta ("+nomesEncomendas(s)+")."+(k.excecaoEnc ? " Exceção liberada por "+nomeDe(k.excecaoEnc)+"." : "")),
    pecas && e("div",{className:"flex flex-col gap-1 rounded-lg bg-white/5 p-2"},
      e("b",{className:"text-[12px] uppercase tracking-wide text-white/75"}, "O que enviar · "+pecas.itens.reduce(function(t, x){ return t+x.q; }, 0)+" peças"),
      e("div",{className:"flex flex-wrap justify-center gap-1"}, pecas.itens.map(function(x){ return e("span",{key:x.nome, className:"rounded-full bg-white/10 px-2 py-0.5 text-[11.5px]"}, e("b",null, x.q), " "+x.nome.toLowerCase()); }))));

  var colPref = e(Painel,{key:"p", t:"Preferências da revendedora", ic:"list-checks"},
    !prefs ? e("p",{className:"text-[13px] font-semibold text-white/70"}, "Sem preferências informadas")
    : e("div",{className:"flex flex-col gap-2"},
        prefs.preferencias.fonte && prefs.preferencias.fonte!=="app" && e(Aviso,null, AVISO_CONFIANCA),
        e("div",{className:"flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2 text-[12px]"},
          prefs.preferencias.resumoGeral ? e(BarraMetal,{ouro:prefs.preferencias.resumoGeral.ouro, prata:prefs.preferencias.resumoGeral.prata}) : e("span",{className:"text-white/55"}, "Sem proporção ouro e prata"),
          prefs.preferencias.atualizadoEm && e("span",{className:"text-white/65"}, "Atualizado em "+formatarDataHora(prefs.preferencias.atualizadoEm)),
          prefs.preferencias.fonte && e("span",{className:"text-white/65"}, ROTULO_FONTE[prefs.preferencias.fonte])),
        prefs.blocos.filter(function(x){ return !x.exibir.vazio; }).map(function(x){ var b = x.bloco;
          return e("div",{key:b.key, className:"flex flex-col items-center gap-1.5 rounded-lg p-2", style:{background:"linear-gradient(135deg,"+b.accent+"26,rgba(0,0,0,.18))", boxShadow:"inset 3px 0 0 "+b.accent+", inset 0 0 0 1px rgba(255,255,255,.08)"}},
            e("span",{className:"text-[12.5px] font-bold"}, x.numero+". "+b.title), e(RespostaView,{exibir:x.exibir})); }),
        prefs.preferencias.observacoes && e("div",{className:"flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2"}, e("b",{className:"text-[12.5px]"}, "Observações"), e("p",{className:"whitespace-pre-wrap text-[12.5px] text-white/85"}, prefs.preferencias.observacoes))));

  var colAcao = e(Painel,{key:"a", t: montando ? "Montagem em andamento" : "Montagem", ic:"hammer"},
    conds.length>0 && e("div",{className:"flex flex-col gap-1.5 rounded-lg bg-white/5 p-2"},
      e("div",{className:"flex items-center justify-center gap-2 text-[12.5px] font-bold"}, conds.length>1 ? conds.length+" condicionais" : "1 condicional", e(CondChips,{k:k, papel:"m"})),
      montando && minha ? e(CondLista,{k:k, papel:"m"}) : e("p",{className:"text-[11.5px] text-white/60"}, "Só dá para marcar depois de iniciar a montagem")),
    conds.length===0 && e("p",{className:"text-[12.5px] text-white/65"}, "Sem condicionais neste kit."),
    podeIniciar && (euMont
      ? e("p",{className:"text-[12.5px]"}, "Montando como ", e("b",null, nomeDe(s.usuario)))
      : e("div",{className:"flex flex-col gap-1.5"},
          e("label",{className:"flex flex-col gap-1 text-center"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/75"}, "Quem vai montar"),
            e("select",{value:quem, onChange:function(ev){ qs[1](+ev.target.value); }, "aria-label":"Quem vai montar", className:"h-9 w-full cursor-pointer rounded-lg border border-input bg-black/30 px-2 text-center text-[13px] font-semibold outline-none"},
              e("option",{value:s.usuario}, nomeDe(s.usuario)+" (eu mesmo)"),
              s.montadoras.some(function(m){ return m.encomendas; }) && e("optgroup",{label:"Encomendas"}, s.montadoras.filter(function(m){ return m.encomendas; }).map(function(m){ return e("option",{key:m.id, value:m.id}, m.nome+(ocupada(m.id) ? " (montando)" : "")); })),
              e("optgroup",{label:"Montagem"}, s.montadoras.filter(function(m){ return !m.encomendas; }).map(function(m){ return e("option",{key:m.id, value:m.id}, m.nome+(ocupada(m.id) ? " (montando)" : "")); })))),
          grande && podeExc && e("label",{className:"flex cursor-pointer items-center justify-center gap-1.5 text-[12px] font-bold"}, e("input",{type:"checkbox", checked:excecao, onChange:function(ev){ ex[1](ev.target.checked); }, className:"size-4 accent-[#A78BFA]"}), "Liberar exceção (montar fora de Encomendas)"))),
    podeIniciar && motivo && e("p",{role:"alert", className:"rounded-lg bg-[#FBBF24]/15 px-2 py-1.5 text-[12px] font-bold text-[#FBBF24]"}, motivo),
    podeIniciar && e(Btn,{v:"primary", ic:"play", disabled:!!motivo, onClick:iniciar}, k.status==="ajuste" ? "Iniciar ajuste" : "Iniciar montagem"),
    montando && e("div",{className:"flex flex-col gap-1.5"},
      e("p",{className:"text-[12.5px]"}, nomeDe(k.montId), " · ", k.pausadoEm ? "pausado em " : "montando há ", e(Relogio,{k:k, className:"font-bold text-[#C4B5FD]"})),
      minha && e("div",{className:"flex flex-col gap-1.5"},
        e(Btn,{v:"success", ic:"check", disabled:!condOk(k, "m"), title: condOk(k, "m") ? "" : "Marque as condicionais antes de concluir", onClick:function(){ d({type:"CONCLUIR_M", id:k.id}); p.fechar(); }}, "Concluir montagem"),
        e("div",{className:"flex gap-1.5"},
          e(Btn,{sm:true, ic:k.pausadoEm?"play":"pause", className:"flex-1", onClick:function(){ d({type: k.pausadoEm?"RETOMAR":"PAUSAR", id:k.id}); }}, k.pausadoEm ? "Retomar" : "Pausar"),
          e(Btn,{sm:true, ic:"undo", className:"flex-1", onClick:function(){ d({type:"DEVOLVER", id:k.id}); p.fechar(); }}, "Devolver")))),
    !montando && !podeIniciar && e("p",{className:"text-[12.5px] font-semibold text-white/70"}, k.montId ? "Montagem de "+nomeDe(k.montId)+" já registrada." : "Sem montador informado."),
    e(Btn,{v:"ghost", ic:"x", onClick:p.fechar}, "Fechar"));

  return e(Janela,{t:k.rev, sub:"Janela do kit · "+(l ? l.rep+" · "+l.horario : ""), fechar:p.fechar, colunas:[colKit, colPref, colAcao]});
}

export { JanelaMontar, prefsDoKit };
