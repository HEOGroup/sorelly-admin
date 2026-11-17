// Sorelly Admin · montagem — components/janela-montar.js
// Janela do kit na listagem do dia (botão Montar), REFEITA em 16/11/2026 no padrão azul (Marcus: "tem umas meninas que montam no computador": a tela do computador primeiro, o celular depois).
// UMA tela de montagem, de cima para baixo: dados do kit → ANTES DE COMEÇAR (encomenda sim ou não, ajuste, observações e avisos da revendedora) → O QUE ENVIAR JUNTO COM AS PREFERÊNCIAS
// (uma tabela: cada peça com Ouro, Prata e a preferência dela na mesma linha, com OK por linha) → condicionais → montagem (quem monta, iniciar, concluir, pausar, devolver).
// As quantidades são as mesmas do celular (components/etiqueta.js: tabela por valor do kit ajustada pelo mix de vendas). As preferências vêm do módulo Preferências do Kit, ligadas à peça pelo nome do bloco.
// Dinheiro (valor do kit e venda) só aparece para a supervisão e a diretoria; montadora nunca vê valor. Sem as etiquetas Só Encomendas e Mesa maior (regra desligada em config.js).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { agrupar } from "@/apps/montagem/components/etiqueta";
import { Fotos } from "@/apps/montagem/components/fotos-pref";
import { blocosDaPeca, semAcento } from "@/apps/montagem/domain/peca-blocos";
import { tituloAba } from "@/apps/montagem/components/menu-dias";
import { condEstado, condNovas, condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe, papelDe, podeLiberarExcecao } from "@/apps/montagem/domain/equipe";
import { AVISO_CONFIANCA, pkResumoRevendedora, pkSituacao } from "@/apps/montagem/domain/preferencias-kit";
import { prefDoApp, usePrefsApp } from "@/apps/montagem/lib/prefs-app";
import { pkResumoParaMontagem } from "@/apps/montagem/domain/preferencias-relatorio";
import { listagemDe, motivoNaoMonta, pecasPara, semMontador, soEncomendas } from "@/apps/montagem/domain/regras";
import { STATUS_LB, TIPO_KIT } from "@/apps/montagem/domain/status";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio } from "@/apps/montagem/ui/relogio";
import { e, useState } from "@/shared/react";

// preferências da revendedora do kit, procuradas pelo nome no módulo Preferências do Kit (nada é inventado: sem resposta = null)
// 16/11/2026: lê primeiro do app (todas as revendedoras, lib/prefs-app.js); o módulo local s.pk (31) é só reserva
function prefsDoKit(s, k){
  var pk = s.pk, r = prefDoApp(k.rev) || (pk && pk.revendedoras && pk.revendedoras.find(function(x){ return semAcento(x.nome)===semAcento(k.rev); }));
  if(!r || !r.preferencias || pkSituacao(s, r)==="sem") return null;
  return {preferencias:{resumoGeral:pkResumoRevendedora(s, r).resumoGeral, fonte:r.preferencias.fonte || "app"}};
}
// botão pequeno de contorno branco, sem fundo cinza; o principal leva o azul do bloco (o mesmo das telas Condicionais e Listagens)
var BTN = "inline-flex h-7 min-w-20 items-center justify-center gap-1 whitespace-nowrap rounded-md border px-3 text-[13px] font-semibold text-white hover:bg-white/10 disabled:opacity-40 ";   // padrao-ok: botão de 28 px (o Marcus aprovou esse tamanho em 16/11/2026)
function Bt(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.off, title:p.titulo, "aria-label":p.rotulo, className:(p.estreito ? BTN.replace("min-w-20", "w-7 min-w-0").replace("px-3", "px-0") : BTN)+(p.principal ? "border-white bg-[var(--bloco-titulo)] hover:brightness-125" : "border-white/60 bg-transparent")}, p.children);
}
var CAMPO_SEL = "h-8 min-w-0 rounded-md border border-white/60 bg-[#14233f] px-2.5 text-[13px] text-white outline-none";

function JanelaMontar(p){
  var cx = use(), s = cx.state, d = cx.dispatch, k = s.kits.find(function(x){ return x.id===p.kitId; });
  usePrefsApp();   // lê as preferências do app (todas as revendedoras) e refaz a janela quando chegam
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
  var ok = useState({}), oks = ok[0], setOks = ok[1];   // OK de cada peça enquanto a janela está aberta (ajuda para quem monta; não trava a conclusão)
  if(!k) return null;
  var l = listagemDe(s, k), prefs = prefsDoKit(s, k), tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit;
  var conds = condNums(k), novas = condNovas(k), pecas = pecasPara(k.valor, s.cfg), grupos = pecas ? agrupar(pecas, k.mix) : [];
  var montando = k.status==="montando", podeIniciar = k.status==="pendente" || k.status==="ajuste";
  var minha = montando && (k.montId===s.usuario || sup);
  var motivo = podeIniciar ? motivoNaoMonta(s, k, quem, excecao) : "";
  if(podeIniciar && !motivo && k.status==="pendente" && k.designada && k.designada!==quem && !sup) motivo = "Este kit foi pedido para "+nomeDe(k.designada);
  if(podeIniciar && !motivo && ocupada(quem)) motivo = nomeDe(quem)+" já está montando outro kit";
  var iniciar = function(){ d({type:"INICIAR_M", id:k.id, montId:quem, forcar:sup, excecao:excecao}); };
  var sit = k.pausadoEm ? "Pausado" : STATUS_LB[k.status];

  // preferências: o que é de uma peça vai na linha dela; o resto (observações, identificação, material de apoio...) vai para "Antes de começar"
  var resumo = pkResumoParaMontagem(s, k.rev), usados = {};
  var prefDaPeca = function(base){ var alvo = blocosDaPeca(base), achados = resumo.filter(function(x){ return alvo.indexOf(semAcento(x.titulo))>=0; }); achados.forEach(function(x){ usados[x.titulo] = true; }); return achados; };
  var linhasPeca = grupos.map(function(g){
    var ouro = g.partes.find(function(x){ return x.metal==="ouro"; }), prata = g.partes.find(function(x){ return x.metal==="prata"; }), solo = g.partes.find(function(x){ return !x.metal; });
    return {g:g, ouro:ouro ? ouro.env : null, prata:prata ? prata.env : null, solo:solo ? solo.env : null, prefs:prefDaPeca(g.base)};
  });
  var gerais = resumo.filter(function(x){ return !usados[x.titulo]; });
  var enc = (k.encomendas || []).filter(Boolean);
  var feitos = linhasPeca.filter(function(x){ return oks[x.g.base]; }).length;

  var cel = function(rot, valor){ return e("div",{key:rot, className:"min-w-0 border-b border-r border-border px-3 py-1 text-center"}, e("p",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot), e("div",{className:"text-[13px] font-semibold"}, valor)); };
  var celulas = [cel("Revendedora", k.rev), cel("Representante", l ? l.rep : "—"), cel("Retirada", l ? tituloAba(String(l.data||"sem-data").slice(0, 10))+" · "+l.horario+(l.viagem ? " · viagem para "+l.destino : "") : "—"), cel("Tipo do kit", tipo[1]+(modalidadeDe(s, k.rev)==="prata" ? " · 100% Prata" : "")+(k.prio ? " · prioritário" : "")+(k.ultimaHora ? " · última hora" : ""))];
  if(sup) celulas = celulas.concat([cel("Valor do kit", k.valor ? BK(k.valor) : "—"), cel("Venda atual", k.vendas && k.vendas[0]!==undefined ? BK(k.vendas[0]) : "—")]);
  var faixa = function(t, dir){ return e("div",{className:"relative border-b border-t border-border px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-[.05em]"}, t, dir && e("span",{className:"absolute inset-y-0 right-3 flex items-center normal-case tracking-normal"}, dir)); };
  var linha = function(a, b, i){ return e("div",{key:i, className:"grid grid-cols-[11rem_1fr] border-b border-border text-[13px]"}, e("div",{className:"border-r border-border px-3 py-1 font-semibold"}, a), e("div",{className:"whitespace-pre-wrap px-3 py-1"}, b)); };
  var GRADE = "grid grid-cols-[2.5rem_11rem_4.5rem_4.5rem_1fr] items-stretch border-b border-border text-[13px]";
  var cabCol = function(t, i){ return e("div",{key:i, className:"flex h-[30px] items-center justify-center border-r border-border bg-[var(--bloco-colunas)] px-2 text-[11px] font-semibold uppercase tracking-[.05em] last:border-r-0"}, t); };
  var celCol = function(c, i, cls){ return e("div",{key:i, className:"flex items-center justify-center border-r border-border px-2 py-1 last:border-r-0 "+(cls||"")}, c); };

  return e("div",{className:"fixed inset-0 z-[80] flex justify-center overflow-y-auto bg-black/70 p-3 md:p-6", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:PADRAO_BLOCOS+" m-auto w-full max-w-4xl rounded-lg bg-[#14171c] text-[13px] [&>section]:!bg-[#14171c]"},
      e(BlocoPainel,{titulo:k.rev+(l ? " · "+l.rep+" · retirada às "+l.horario : ""), dir:e("span",{className:k.pausadoEm ? "text-warning" : ""}, sit)},
        e("div",{className:"grid grid-cols-2 md:grid-cols-4 [&>div:nth-child(4n)]:md:border-r-0"}, celulas),

        faixa("Antes de começar"),
        linha("Encomenda", enc.length ? "Sim · nº "+enc.join(", ") : "Sem encomenda", "enc"),
        k.status==="ajuste" && linha("Voltou para ajuste", k.motivo || "—", "ajuste"),
        semMontador(k) && linha("Atenção", "Este kit não tem montador informado: a bipagem e a comissão da bipadora só valem com montador.", "sm"),
        prefs && prefs.preferencias.resumoGeral && linha("Ouro e prata", "Ouro "+Math.round(prefs.preferencias.resumoGeral.ouro)+"% · Prata "+Math.round(prefs.preferencias.resumoGeral.prata)+"%", "mix"),
        prefs && prefs.preferencias.fonte && prefs.preferencias.fonte!=="app" && linha("Atenção", AVISO_CONFIANCA, "conf"),
        gerais.map(function(x, i){ return linha(x.titulo, e("span",{className:"inline-flex flex-wrap items-center gap-2"}, x.texto, e(Fotos,{lista:x.fotos})), "g"+i); }),
        !prefs && linha("Preferências", "A revendedora ainda não informou as preferências do kit.", "semp"),

        faixa("O que enviar e preferências dela", pecas ? e("span",null, feitos+" de "+linhasPeca.length+" · "+pecas.totalTxt+" peças") : null),
        pecas ? e("div",null,
          e("div",{className:GRADE}, ["OK", "Peça", "Ouro", "Prata", "Preferência dela"].map(cabCol)),
          linhasPeca.map(function(x){
            var base = x.g.base, on = !!oks[base];
            return e("div",{key:base, className:GRADE},
              celCol(e("input",{type:"checkbox", checked:on, "aria-label":"OK de "+base, onChange:function(){ var o = Object.assign({}, oks); o[base] = !on; setOks(o); }})),
              celCol(e("b",{className:"font-semibold"}, base), "text-center"),
              x.solo!=null ? e("div",{className:"col-span-2 flex items-center justify-center border-r border-border px-2 py-1"}, e("b",{className:MONO+" tabular-nums"}, x.solo))
                : [celCol(e("b",{className:MONO+" tabular-nums"}, x.ouro || "—"), 1), celCol(e("b",{className:MONO+" tabular-nums"}, x.prata || "—"), 2)],
              celCol(x.prefs.length ? e("div",{className:"flex w-full flex-col gap-0.5 py-0.5 text-left"}, x.prefs.map(function(pr, i){ return e("span",{key:i, className:"flex flex-wrap items-center gap-1.5"}, x.prefs.length>1 ? e("b",{className:"font-semibold"}, pr.titulo+": ") : null, pr.texto, e(Fotos,{lista:pr.fotos})); })) : e("span",null, "—"), "text-left")); }))
          : e("p",{className:"border-b border-border px-3 py-3 text-center"}, "A tabela de peças ainda não tem este valor de kit. Defina o valor do kit em Listagens."),

        conds.length>0 && faixa("Condicionais", montando && minha ? null : "Só dá para marcar depois de iniciar a montagem"),
        conds.map(function(n){ var st = condEstado(k, n);
          return e("div",{key:n, className:"flex min-h-8 flex-wrap items-center justify-center gap-x-5 gap-y-1 border-b border-border px-3 py-1"},
            e("b",{className:MONO+" w-24 text-center"}, n),
            e("span",{className:"w-24 text-center font-semibold "+(st.falta ? "text-destructive" : st.imp ? "text-primary" : st.m ? "text-success" : "text-warning")}, st.falta ? "Falta" : st.imp ? "Impressa" : st.m ? "Pega" : "A pegar"),
            e("label",{className:"inline-flex items-center gap-1.5"+(st.falta || !(montando && minha) ? " opacity-60" : " cursor-pointer")}, e("input",{type:"checkbox", checked:st.m, disabled:st.falta || !(montando && minha), onChange:function(){ d({type:"COND_CHK", id:k.id, num:n, papel:"m", v:!st.m, por:s.usuario}); }}), "Peguei"),
            montando && minha && !st.falta && !st.imp && !st.m && e(Bt,{onClick:function(){ d({type:"COND_FALTA", id:k.id, num:n, por:s.usuario}); }}, "Falta")); }),
        conds.length===0 && e("p",{className:"border-b border-border px-3 py-2 text-center"}, "Sem condicionais neste kit."),
        novas.length>0 && e("p",{className:"border-b border-border px-3 py-1 text-center"}, novas.length>1 ? "Novas condicionais: " : "Nova condicional: ", e("b",{className:MONO+" font-semibold"}, novas.join("   "))),

        faixa(montando ? "Montagem em andamento" : "Montagem"),
        podeIniciar && !euMont && e("div",{className:"flex flex-wrap items-center justify-center gap-3 border-b border-border px-3 py-2"},
          e("label",{htmlFor:"jm-quem", className:"text-[11px] font-semibold uppercase tracking-[.05em]"}, "Quem vai montar"),
          e("select",{id:"jm-quem", value:quem, onChange:function(ev){ qs[1](+ev.target.value); }, className:CAMPO_SEL},
            e("option",{value:s.usuario}, nomeDe(s.usuario)+" (eu mesmo)"),
            s.montadoras.some(function(m){ return m.encomendas; }) && e("optgroup",{label:"Encomendas"}, s.montadoras.filter(function(m){ return m.encomendas; }).map(function(m){ return e("option",{key:m.id, value:m.id}, m.nome+(ocupada(m.id) ? " (montando)" : "")); })),
            e("optgroup",{label:"Montagem"}, s.montadoras.filter(function(m){ return !m.encomendas; }).map(function(m){ return e("option",{key:m.id, value:m.id}, m.nome+(ocupada(m.id) ? " (montando)" : "")); }))),
          grande && podeExc && e("label",{className:"inline-flex cursor-pointer items-center gap-1.5"}, e("input",{type:"checkbox", checked:excecao, onChange:function(ev){ ex[1](ev.target.checked); }}), "Liberar exceção (montar fora de Encomendas)")),
        podeIniciar && euMont && e("p",{className:"border-b border-border px-3 py-2 text-center"}, "Montando como ", e("b",null, nomeDe(s.usuario))),
        podeIniciar && motivo && e("p",{role:"alert", className:"border-b border-border px-3 py-2 text-center font-semibold text-warning"}, motivo),
        montando && e("p",{className:"border-b border-border px-3 py-2 text-center"}, nomeDe(k.montId), " · ", k.pausadoEm ? "pausado em " : "montando há ", e(Relogio,{k:k, className:"font-semibold text-primary"})),
        !montando && !podeIniciar && e("p",{className:"border-b border-border px-3 py-2 text-center font-semibold"}, k.montId ? "Montagem de "+nomeDe(k.montId)+" já registrada." : "Sem montador informado."),
        e("div",{className:"flex flex-wrap items-center justify-between gap-2 px-3 py-1.5"},
          e("div",{className:"flex flex-wrap gap-2"},
            podeIniciar && e(Bt,{principal:true, off:!!motivo, onClick:iniciar}, k.status==="ajuste" ? "Iniciar ajuste" : "Iniciar montagem"),
            montando && minha && e(Bt,{principal:true, off:!condOk(k, "m"), titulo:condOk(k, "m") ? "" : "Marque as condicionais antes de concluir", onClick:function(){ d({type:"CONCLUIR_M", id:k.id}); p.fechar(); }}, "Concluir montagem"),
            montando && minha && e(Bt,{onClick:function(){ d({type: k.pausadoEm ? "RETOMAR" : "PAUSAR", id:k.id}); }}, k.pausadoEm ? "Retomar" : "Pausar"),
            montando && minha && e(Bt,{onClick:function(){ d({type:"DEVOLVER", id:k.id}); p.fechar(); }}, "Devolver")),
          e(Bt,{estreito:true, rotulo:"Fechar", titulo:"Fechar", onClick:p.fechar}, "✕")))));
}

export { JanelaMontar, prefsDoKit };
