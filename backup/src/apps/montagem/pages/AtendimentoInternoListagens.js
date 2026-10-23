// Sorelly Admin — pages/AtendimentoInternoListagens.js
// Kits → Atendimento interno → Listagens. São as revendedoras que acertam na própria Sorelly (~416 das 2.033).
// MESMO FORMATO das listagens das representantes (Painel): faixa dourada por dia, cabeçalho de colunas e linhas coloridas pela situação. Hoje aberto, outros dias recolhidos.
// Remarcação e multa são lançadas aqui por quem monta a listagem; a Atendimento Sorelly só mostra.
// A funcionária autorizada (Natasha ou outra) puxa os dados na DevMaster e monta a listagem: nome, horário, condicionais, observação.
// Na tela "Atendimento Sorelly" aparece só a agenda do dia.
//
// PARA O LEONARDO: a coluna VENDA vem DIRETO DO APP DA REVENDEDORA (campo `vendaApp` de cada item de s.internos). Não é digitada.
// Enquanto a integração não existe, mostra "do app" e a Atendimento Sorelly deixa o valor para digitar.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TH } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

// o que a revendedora vem fazer (aparece logo depois do nome)
var TIPOS_ATEND = [["acerto","Acerto","#E8B84B"],["kit_novo","Kit novo","#22C55E"],["reposicao","Reposição","#38BDF8"],["premio","Retirada de prêmio","#EC4899"],["indicacao","Indicação","#A78BFA"]];
var VAZIO = {tipo:"acerto", nome:"", fone:"", devmaster:"", hora:"", modalidade:"padrao", obs:""};
var CAMPO = INPUT+" h-10! w-full";
var fmtData = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };
var DIAS = ["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
var diaSemana = function(iso){ return DIAS[new Date(iso+"T12:00:00").getDay()]; };

function Selo(p){ return e("span",{className:"rounded-full bg-slate-600 px-2 py-0.5 text-[10.5px] font-black tracking-wider text-white", title:"Kit 100% Prata"}, p.children || "100% PRATA"); }


function AbaIntListagens(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var hoje = isoDia(new Date());
  var df = useState(hoje), dia = df[0], setDia = df[1];
  var fm = useState(VAZIO), form = fm[0], setForm = fm[1];
  var cn = useState([]), conds = cn[0], setConds = cn[1];
  var cf = useState({numero:"", pecas:""}), cForm = cf[0], setCForm = cf[1];
  var fa = useState(false), formAberto = fa[0], setFormAberto = fa[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var ab = useState({}), abertos = ab[0], setAbertos = ab[1];
  var set = function(c, v){ var o = {}; o[c] = v; setForm(Object.assign({}, form, o)); };
  var condOk = cForm.numero.length>=3 && !conds.some(function(c){ return c.numero===cForm.numero; });
  var addCond = function(){ if(!condOk) return; setConds(conds.concat([{numero:cForm.numero, pecas:Number(cForm.pecas)||0}])); setCForm({numero:"", pecas:""}); };
  var pronto = form.nome.trim().length>=3;
  var adicionar = function(){
    if(!pronto) return;
    d({type:"INT_ADD", nome:form.nome, fone:form.fone, devmaster:form.devmaster, data:dia || hoje, hora:form.hora, condicionais:conds, obs:form.obs,
      modalidade:form.modalidade, tipo:form.tipo, por:nomeDe(s.usuario)});
    setForm(Object.assign({}, VAZIO, {modalidade:"padrao"})); setConds([]);
  };
  var lbl = function(t){ return e("span",{className:"text-[12.5px] font-semibold text-muted-foreground"}, t); };
  var STATUS = {agendado:["Agendado","bg-info/15 text-info"], acertado:["Acertado","bg-success/15 text-success"]};
  var tv = useState(null), termoVisto = tv[0], setTermoVisto = tv[1];       // revendedora cujo termo está aberto
  var termoDe = function(nome){ var p = (s.perfisRev||{})[nome]; return p && p.termoConsignado; };
  var b = busca.trim().toLowerCase();

  // dias com atendimento (mais recente primeiro); o de hoje sempre aparece
  var internos = (s.internos||[]).filter(function(x){ return !b || (x.nome||"").toLowerCase().indexOf(b)>=0; });
  var dias = internos.map(function(x){ return x.data; }).concat(b ? [] : [hoje]).filter(function(x,i,a){ return x && a.indexOf(x)===i; }).sort().reverse();
  var vendaDe = function(x){ return x.status==="acertado" && x.acerto ? x.acerto.vendaLiquida : (x.vendaApp||0); };
  var aberto = function(dt){ return b ? true : abertos[dt]!==undefined ? abertos[dt] : dt===hoje; };
  var alt = function(dt){ var o = Object.assign({}, abertos); o[dt] = !aberto(dt); setAbertos(o); };

  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Atendimento interno · Listagens", sub:"Revendedoras que fazem o acerto aqui na Sorelly, dia a dia. Na Atendimento Sorelly aparece só a agenda do dia."}),
      e("div",{className:"flex items-center gap-2"},
        e("div",{className:"relative"}, e(Icon,{n:"search", s:16, className:"pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"}),
          e("input",{className:INPUT+" h-10! w-56 pl-9 text-sm!", placeholder:"Buscar revendedora", value:busca, onChange:function(ev){ setBusca(ev.target.value); }})),
        e(Btn,{v:formAberto ? "secondary" : "primary", ic:"lista", onClick:function(){ setFormAberto(!formAberto); }}, formAberto ? "Fechar" : "Montar listagem"))),
    e("p",{className:"rounded-lg bg-info/10 px-3 py-2 text-[12.5px] text-info"},
      e("b",null,"Venda: "), "o valor vem direto do app da revendedora (não é digitado aqui). ",
      e("span",{className:"text-muted-foreground"},"Desenvolvimento (Leonardo): gravar o total vendido em `vendaApp` de cada item da agenda; a Atendimento Sorelly já usa esse campo para preencher \"Quanto ela vendeu\".")),
    // formulário para montar a listagem de um dia
    formAberto && e(BlocoBarra,{t:"Nova revendedora na listagem", sub:"dados da DevMaster · digitados à mão"},
      e("div",{className:"grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4"},
        e("label",{className:"flex flex-col gap-1 xl:col-span-2"}, lbl("Nome da revendedora"),
          e("input",{value:form.nome, onChange:function(ev){ set("nome", ev.target.value); }, placeholder:"Ex.: Maria da Silva", className:CAMPO})),
        e("label",{className:"flex flex-col gap-1"}, lbl("Tipo"), e("select",{value:form.tipo, onChange:function(ev){ set("tipo", ev.target.value); }, className:CAMPO}, TIPOS_ATEND.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
        e("label",{className:"flex flex-col gap-1"}, lbl("Telefone"), e("input",{value:form.fone, onChange:function(ev){ set("fone", ev.target.value); }, placeholder:"(41) 90000-0000", className:CAMPO})),
        e("label",{className:"flex flex-col gap-1"}, lbl("Código DevMaster"), e("input",{value:form.devmaster, onChange:function(ev){ set("devmaster", ev.target.value); }, className:CAMPO+" "+MONO})),
        e("label",{className:"flex flex-col gap-1"}, lbl("Data do acerto"), e("input",{type:"date", value:dia, onChange:function(ev){ setDia(ev.target.value); }, className:CAMPO})),
        e("label",{className:"flex flex-col gap-1"}, lbl("Horário"), e("input",{type:"time", value:form.hora, onChange:function(ev){ set("hora", ev.target.value); }, className:CAMPO})),
        e("div",{className:"flex flex-col gap-1 xl:col-span-2"}, lbl("Modalidade do kit"),
          e("div",{className:"grid grid-cols-2 gap-2"}, [["padrao","Kit Padrão"],["prata","Kit 100% Prata"]].map(function(o){ var on = form.modalidade===o[0];
            return e("button",{key:o[0], type:"button", onClick:function(){ set("modalidade", o[0]); }, "aria-pressed":on,
              className:"h-10 rounded-lg text-[13.5px] font-bold ring-1 "+(on ? (o[0]==="prata" ? "bg-slate-600 text-white ring-slate-500" : "bg-primary text-primary-foreground ring-primary") : "bg-muted/40 text-muted-foreground ring-border hover:bg-muted")}, (on?"✓ ":"")+o[1]); }))),
        e("div",{className:"flex flex-col gap-2 md:col-span-2 xl:col-span-2"}, lbl("Condicionais em aberto (número; peças se souber)"),
          conds.map(function(c){ return e("div",{key:c.numero, className:"flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-[13.5px]"},
            e("b",{className:MONO}, "Condicional "+c.numero), e("span",{className:"flex items-center gap-2"}, c.pecas>0 && e("span",{className:MONO+" text-muted-foreground"}, c.pecas+" peças"),
              e("button",{onClick:function(){ setConds(conds.filter(function(x){ return x.numero!==c.numero; })); }, "aria-label":"Remover condicional "+c.numero,
                className:"grid size-6 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"},"×"))); }),
          e("div",{className:"flex items-center gap-2"},
            e("input",{value:cForm.numero, inputMode:"numeric", placeholder:"Nº da condicional", "aria-label":"Número da condicional", className:CAMPO+" "+MONO,
              onChange:function(ev){ setCForm(Object.assign({}, cForm, {numero:ev.target.value.replace(/\D/g,"").slice(0,8)})); }}),
            e("input",{value:cForm.pecas, inputMode:"numeric", placeholder:"Peças", "aria-label":"Quantidade de peças", className:CAMPO+" w-24! text-right "+MONO,
              onChange:function(ev){ setCForm(Object.assign({}, cForm, {pecas:ev.target.value.replace(/\D/g,"").slice(0,4)})); }}),
            e(Btn,{v:"secondary", disabled:!condOk, onClick:addCond}, "+ Adicionar"))),
        e("label",{className:"flex flex-col gap-1 md:col-span-2"}, lbl("Observação (opcional)"), e("input",{value:form.obs, onChange:function(ev){ set("obs", ev.target.value); }, className:CAMPO})),
        e("div",{className:"flex items-end md:col-span-2"}, e(Btn,{v:"primary", ic:"check", disabled:!pronto, onClick:adicionar}, "Adicionar à agenda de "+fmtData(dia || hoje))))),
    termoVisto && termoDe(termoVisto) && e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:function(){ setTermoVisto(null); }},
      e("div",{className:"flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl bg-card p-5 text-center ring-1 ring-[#E8B84B]/40", onClick:function(ev){ ev.stopPropagation(); }},
        e("h3",{className:"font-heading text-lg font-bold"}, termoVisto),
        e("p",{className:"text-[14px] font-semibold text-success"}, "✓ Leu, confirmou e assinou em "+new Date(termoDe(termoVisto).ts).toLocaleDateString("pt-BR")),
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, (termoDe(termoVisto).regras||[]).map(function(r,i){ return e("span",{key:i, className:"rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-semibold text-success"}, "✓ "+r); })),
        termoDe(termoVisto).assinatura && e("img",{src:termoDe(termoVisto).assinatura, alt:"Assinatura", className:"h-28 rounded-lg bg-white p-1"}),
        e(Btn,{v:"secondary", onClick:function(){ setTermoVisto(null); }}, "Fechar"))),
    // MESMO FORMATO das listagens das representantes (Painel): faixa dourada por dia + cabeçalho de colunas + linhas coloridas pela situação
    e("div",{className:"flex flex-col gap-3"}, dias.map(function(dt){
      var lista = internos.filter(function(x){ return x.data===dt; }).sort(function(a,c){ return (a.hora||"99").localeCompare(c.hora||"99"); });
      var feitos = lista.filter(function(x){ return x.status==="acertado"; }).length, total = lista.reduce(function(t,x){ return t+vendaDe(x); }, 0), ac = aberto(dt);
      var C = "text-center!", vazio = e("span",{className:"text-muted-foreground"},"—"), TINTA = "text-[#1B1409]";
      var chip = function(txt, cls){ return e("span",{className:"inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[13px] font-semibold "+(cls||"bg-black/15 "+TINTA)}, txt); };
      var LARG = [36,56,92,230,128,92,92,58,104,70,64,64,58,64,128,80,44];
      var COLUNAS = ["Ord.","Hora","Atender","Nome","Tipo","Condicional","Venda","Chegou","Escolha do kit","Encom.","Bipou","Montou","Kit novo","Termo","Remarc. / multa","Situação",""];
      var BLOCO = "[&_tr.kit>*:first-child]:border-l-2! [&_tr.kit>*:last-child]:border-r-2! [&_tr.kit>*:first-child]:border-l-[#D9A63A]! [&_tr.kit>*:last-child]:border-r-[#D9A63A]! "+
        "[&_tr.fim>td]:border-b-2! [&_tr.fim>td]:border-b-[#D9A63A]! [&_tr.fim>td:first-child]:rounded-bl-xl [&_tr.fim>td:last-child]:rounded-br-xl";
      var linhas = [e("tr",{key:"f"},
        e("td",{colSpan:LARG.length, className:"cursor-pointer px-3! py-2! shadow-[inset_0_1px_0_rgba(255,255,255,.35)] bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] "+TINTA+" "+(ac ? "rounded-t-xl" : "rounded-xl"), onClick:function(){ alt(dt); }},
          e("div",{className:"grid grid-cols-[minmax(0,15rem)_auto_auto_minmax(0,1fr)_auto] items-center gap-2.5"},
            e("span",{className:"inline-flex items-center gap-2 font-heading text-[15px] font-bold", "aria-expanded":ac}, e(Icon,{n:ac ? "chevrondown" : "chevron", s:16}), (dt===hoje ? "Hoje · " : "")+fmtData(dt)+" · "+diaSemana(dt)),
            chip(lista.length+(lista.length===1 ? " atendimento" : " atendimentos")), chip(feitos+" de "+lista.length+" feitos"), e("span",null),
            chip("Total vendido "+BK(total)))))];
      if(ac && lista.length===0) linhas.push(e("tr",{key:"v"}, e("td",{colSpan:LARG.length, className:"bg-card py-6 text-center text-[13px] text-muted-foreground"},"Ninguém na agenda desse dia. Use \"Montar listagem\".")));
      if(ac && lista.length>0){
        linhas.push(e("tr",{key:"cab", className:"kit bg-sidebar"}, COLUNAS.map(function(c,i){ return e(TH,{key:i, className:C+" text-[12px]! tracking-normal! px-1! "+(i===4||i===5 ? "text-warning!" : "")}, c); })));
        lista.forEach(function(x, j){
          var st = STATUS[x.status] || STATUS.agendado, venda = vendaDe(x), feito = x.status==="acertado", conds = (x.condicionais||[]).map(function(c){ return c.numero; }).join(", ");
          var rem = x.remarcacoesLista||[], multas = rem.filter(function(r){ return !r.isenta; }).length;
          linhas.push(e("tr",{key:x.id, className:"kit transition-colors "+(feito ? "bg-success/10 hover:bg-success/15" : "bg-card hover:bg-muted/40")+(j===lista.length-1 ? " fim" : "")},
            e(TD,{className:C+" "+MONO+" text-muted-foreground"}, (j+1)+"º"),
            e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, x.hora || vazio),
            e(TD,{className:C},
              e(Btn,{v:"primary", sm:true, ic:"calc", disabled:feito, onClick:function(){ d({type:"INT_ABRIR", id:x.id}); }}, feito ? "Feito" : "Atender")),
            e(TD,{className:C+" whitespace-normal! break-words font-semibold leading-tight", title:x.nome}, x.nome, modalidadeDe(s, x.nome)==="prata" && e("span",{className:"ml-1.5"}, e(Selo))),
            e(TD,{className:C},
              (function(){ var tp = TIPOS_ATEND.find(function(o){ return o[0]===(x.tipo||"acerto"); }) || TIPOS_ATEND[0];
                return e("select",{value:tp[0], disabled:feito, "aria-label":"Tipo de atendimento de "+x.nome, onChange:function(ev){ d({type:"INT_ATUALIZAR", id:x.id, patch:{tipo:ev.target.value}}); },
                  className:"h-7 w-full cursor-pointer rounded-md border-0 px-1.5 text-[11.5px] font-bold outline-none", style:{background:tp[2]+"30", color:tp[2]}},
                  TIPOS_ATEND.map(function(o){ return e("option",{key:o[0], value:o[0], style:{color:"#111"}}, o[1]); })); })()),
            e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, conds || vazio),
            e(TD,{className:C+" "+MONO}, feito || venda>0 ? BK(venda) : e("span",{className:"whitespace-nowrap rounded-md bg-info/15 px-1.5 py-0.5 text-[11.5px] font-semibold text-info", title:"O valor vendido vem direto do app da revendedora"},"do app")),
            e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, x.chegada || vazio),
            e(TD,{className:C+" "+MONO+" text-[12px]!"}, x.escolhaIni ? (function(){ var n = new Date(x.escolhaIni); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); })()+(x.escolhaFim ? " · "+Math.max(1, Math.round((x.escolhaFim-x.escolhaIni)/60000))+" min" : " · escolhendo") : vazio),
            e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, x.encomenda || vazio),
            e(TD,{className:C+" truncate"}, x.bipou ? x.bipou.split(" ")[0] : vazio),
            e(TD,{className:C+" truncate"}, x.atendeu ? x.atendeu.split(" ")[0] : vazio),
            e(TD,{className:C}, feito ? (x.kitNovo ? e("span",{className:"font-semibold text-success"},"Sim") : "Não") : vazio),
            // termo do consignado assinado pela revendedora (fica registrado aqui)
            e(TD,{className:C}, termoDe(x.nome) ? e("button",{onClick:function(){ setTermoVisto(x.nome); }, title:"Ver o termo assinado", className:"rounded-md bg-success/15 px-1.5 py-0.5 text-[12px] font-semibold text-success hover:bg-success/25"}, "✍ "+new Date(termoDe(x.nome).ts).toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"})) : vazio),
            // remarcação e multa: quem monta a listagem registra aqui
            e(TD,{className:C},
              e("span",{className:"inline-flex items-center gap-1"},
                e("b",{className:MONO+(multas>0 ? " text-destructive" : "")}, rem.length+(multas>0 ? " · "+multas+"m" : "")),
                !feito && e("button",{onClick:function(){ d({type:"INT_REMARCAR", id:x.id, isenta:false}); }, title:"Remarcação com multa", className:"rounded bg-destructive/20 px-1.5 text-[11.5px] font-bold text-destructive hover:bg-destructive/30"},"+multa"),
                !feito && e("button",{onClick:function(){ var m = window.prompt("Remarcação isenta de multa: qual o motivo?"); if(m && m.trim()) d({type:"INT_REMARCAR", id:x.id, isenta:true, motivo:m.trim()}); }, title:"Remarcação isenta", className:"rounded bg-success/20 px-1.5 text-[11.5px] font-bold text-success hover:bg-success/30"},"+isenta"),
                !feito && rem.length>0 && e("button",{onClick:function(){ d({type:"INT_REMARCAR_REMOVER", id:x.id, indice:rem.length-1}); }, title:"Desfazer a última", "aria-label":"Desfazer a última remarcação", className:"rounded bg-muted px-1.5 text-[11.5px] font-bold hover:bg-muted/70"},"−"))),
            e(TD,{className:C}, e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-semibold "+st[1]}, st[0])),
            e(TD,{className:C},
              e("span",{className:"inline-flex items-center gap-1"},
                e("button",{onClick:function(){ if(window.confirm("Remover "+x.nome+" da agenda?")) d({type:"INT_REMOVER", id:x.id}); }, "aria-label":"Remover "+x.nome,
                  className:"grid size-7 place-items-center rounded-full bg-muted text-base font-bold text-muted-foreground hover:bg-destructive/20 hover:text-destructive"},"×")))));
          if(x.obs) linhas.push(e("tr",{key:x.id+"o", className:"kit "+(feito ? "bg-success/5" : "bg-card")+(j===lista.length-1 ? " fim" : "")}, e("td",{colSpan:LARG.length, className:"text-center text-[12px] text-muted-foreground"}, "Obs.: "+x.obs)));
        });
      }
      return e("div",{key:dt, className:"overflow-x-auto"},
        e("table",{className:"w-full min-w-[64rem] table-fixed border-separate border-spacing-0 text-sm [&_td]:px-1.5! [&_td]:py-2! [&_th]:px-1.5! [&_tr.kit>td]:border-b [&_tr.kit>td]:border-border "+BLOCO},
          e("colgroup",null, LARG.map(function(w,i){ return e("col",{key:i, style:{width:w}}); })), e("tbody",null, linhas)));
    })));
}

export { AbaIntListagens, Selo };
