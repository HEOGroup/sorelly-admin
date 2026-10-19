// Sorelly Admin · montagem e bipagem — components/fila.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { CondCampo, LinhaFinalizar } from "@/apps/montagem/components/condicionais";
import { JanelaMontar } from "@/apps/montagem/components/janela-montar";
import { KitValor, LinhaTempo } from "@/apps/montagem/components/kit-valor";
import { MenuAcoes } from "@/apps/montagem/components/menu-acoes";
import { condNovas } from "@/apps/montagem/domain/condicionais";
import { modalidadeDe } from "@/apps/montagem/domain/consignado";
import { nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { ehEncomendas, filaMontagem, nomesEncomendas, semMontador, soEncomendas } from "@/apps/montagem/domain/regras";
import { SEM_KIT, SITUACOES, StatusBadge, TIPO_KIT } from "@/apps/montagem/domain/status";
import { media3 } from "@/apps/montagem/domain/vendas";
import { BK, hora, isoDia, minutos } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { BADGE } from "@/apps/montagem/ui/badge";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { Relogio, RelogioB } from "@/apps/montagem/ui/relogio";
import { TD, TH } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";

var ETAPA = {bipado:0, bipando:1, montado:2, supervisao:3, montando:4, ajuste:5, pendente:6, condicional:6.5, semvalor:7, retirado:8};
var TOM_LINHA = {bipado:"bg-success/10 hover:bg-success/15", montado:"bg-info/10 hover:bg-info/15", supervisao:"bg-warning/12 hover:bg-warning/18",
  retirado:"bg-muted/50 text-muted-foreground hover:bg-muted/70"};
function tempoFim(ms, ts){ if(!ts) return null; var m = Math.round((ms||0)/60000); return (m<1?"<1":m)+"m · "+hora(ts); }
var FAIXA_GRADE = "grid items-center gap-2.5 grid-cols-[9rem_11rem_7.5rem_8rem_4.5rem_minmax(0,1fr)_26rem]";
function Fila(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var la = useState(null), linhaAb = la[0], setLinhaAb = la[1];   // kit que a Deysiane está finalizando na linha
  var jm = useState(null), janelaKit = jm[0], setJanelaKit = jm[1];   // kit aberto na janela de montagem (botão Montar)
  var fila = filaMontagem(s);
  // Listagens concluídas saem do Painel (ficam no Consolidado)
  var hojeISO = isoDia(new Date());
  var lists = s.listagens.slice().sort(function(a,b){return minutos(a.horario)-minutos(b.horario);})
    .filter(function(l){return !l.fechada && (!l.data || l.data===hojeISO) && (p.filtroRep==="todas" || l.id===p.filtroRep);});
  var busca = (p.busca||"").toLowerCase();
  var sit = SITUACOES.find(function(x){return x.id===p.sit;});
  var mostrados = 0;
  // Perfil logado: supervisão vê as ações; bipadora vê o botão de bipar nos kits aguardando bipagem
  var sup = papelDe(s.usuario)==="supervisao", euBip = papelDe(s.usuario)==="bipadora" ? s.usuario : null;
  var euMont = papelDe(s.usuario)==="montadora", podeMontar = sup || euMont;   // quem vê o botão Montar na linha: supervisão, diretoria e montadoras
  var euBipando = euBip && s.kits.some(function(k){return k.bipId===euBip && k.status==="bipando";});
  var COLS = 13;
  var vazio = e("span",{className:"text-muted-foreground"},"—");
  // Montar direto na linha (19/10/2026): abre a janela do kit (preferências, condicionais e iniciar). Selo vermelho = kit sem montador informado.
  var celMont = function(k){
    var sem = semMontador(k), grande = soEncomendas(k, s.cfg), proibido = euMont && grande && !ehEncomendas(s, s.usuario);
    var btn = function(txt, ic, off, titulo){ return e("button",{onClick:function(){ setJanelaKit(k.id); }, disabled:off, title:titulo,
      className:"inline-flex h-7 items-center justify-center gap-1 rounded-md bg-[#E8B84B] px-2 text-[12px] font-bold text-[#1B1409] hover:bg-[#F3D98B] disabled:bg-muted disabled:text-muted-foreground"}, e(Icon,{n:ic, s:12}), txt); };
    if(sem) return e("span",{className:"inline-flex items-center rounded-md bg-[#7A1F1F] px-1.5 py-0.5 text-[11.5px] font-bold text-white", title:"Este kit não tem montador informado. A bipagem e a comissão da bipadora só valem com montador."}, "Sem montador");
    if(k.status==="pendente" || k.status==="ajuste") return podeMontar ? btn("Montar", "play", proibido || (k.status==="pendente" && !!k.designada && k.designada!==s.usuario && !sup),
      proibido ? "Kit acima do limite: só o setor Encomendas monta ("+nomesEncomendas(s)+")" : k.designada && k.designada!==s.usuario && !sup ? "Pedido para "+nomeDe(k.designada) : "Abrir a janela do kit e iniciar a montagem") : vazio;
    if(k.montId) return e("span",{className:"inline-flex max-w-full items-center justify-center gap-1"}, e("span",{className:"truncate"}, nomeDe(k.montId)),
      k.status==="montando" && (k.montId===s.usuario || sup) && btn("Abrir", "chevron", false, "Abrir a janela deste kit"));
    return vazio;
  };
  var C = "text-center!";
  // Colunas na ordem do fluxo: kit → montagem → condicionais pegas → bipagem → nova condicional
  // Dinheiro (média de venda e valor do kit) só aparece para a supervisão; montadora e bipadora não veem valores
  // todas as colunas com largura: a tabela distribui o espaço proporcionalmente (o nome não fica gigante)
  var LARG = [36,52,140,120].concat(sup ? [70,86] : []).concat([112,124,76,76,76,76,70,34]);
  COLS = LARG.length;
  var TINTA = "text-[#1B1409]";
  var chip = function(txt, ic, cls, titulo){ return e("span",{title:titulo, className:"inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-[13px] font-semibold "+(cls||"bg-black/15 "+TINTA)}, ic && e(Icon,{n:ic, s:13}), txt); };
  var gbtn = function(txt, ic, onClick, prim, off, larg, titulo){ return e("button",{onClick:onClick, disabled:off, title:titulo,
    className:"inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-45 "+(larg||"")+" "+
      (prim ? "bg-[#1B1409] text-[#F1E4C6] hover:bg-[#1B1409]/85" : "bg-black/10 "+TINTA+" hover:bg-black/20")}, e(Icon,{n:ic, s:14}), txt); };
  var BLOCO = "[&_tr.kit>*:first-child]:border-l-2! [&_tr.kit>*:last-child]:border-r-2! [&_tr.kit>*:first-child]:border-l-[#D9A63A]! [&_tr.kit>*:last-child]:border-r-[#D9A63A]! "+
    "[&_tr.fim>td]:border-b-2! [&_tr.fim>td]:border-b-[#D9A63A]! [&_tr.fim>td:first-child]:rounded-bl-xl [&_tr.fim>td:last-child]:rounded-br-xl";
  var COLUNAS = [["Ordem"],["Horário"],["Nome"],["Tipo"],["Média"],["Valor kit"],["Situação"],
    ["Montadora","text-purple!"],["Tempo · fim","text-purple!"],["Cond.","text-warning!"],
    ["Bipadora","text-info!"],["Tempo · fim","text-info!"],["Nova cond.","text-warning!"],[""]]
    .filter(function(c){ return sup || (c[0]!=="Média" && c[0]!=="Valor kit"); });
  var cabecalho = function(key){ return e("tr",{key:key, className:"kit bg-sidebar"},
    COLUNAS.map(function(c,i){ return e(TH,{key:i, className:C+" text-[12px]! tracking-normal! px-1! "+(c[1]||"")}, c[0]); })); };
  // Condicionais: campo que abre com o check de cada uma (montadora pegou / bipadora conferiu); a supervisão vê e marca as duas
  var papelC = sup ? "sup" : papelDe(s.usuario)==="bipadora" ? "b" : "m";
  var celCond = function(k){ return e(CondCampo,{k:k, papel:papelC, vazio:vazio}); };
  var celCondAntigo = function(k){
    var n = (k.cond && k.cond.nums) || [];
    if(!n.length) return vazio;
    var tit = "Condicionais: "+n.join(", ")+(k.cond.pegas ? " · pegas"+(k.cond.pegasPor?" por "+nomeDe(k.cond.pegasPor):"") : " · falta pegar");
    if(k.cond.pegas) return e("span",{title:tit, className:"inline-flex items-center gap-1 text-[13px] font-semibold text-success"}, e(Icon,{n:"check", s:13}), n.length);
    // a montadora pega as condicionais ao final da montagem; antes disso só mostra quantas são
    var hora_de_pegar = k.status==="condicional" || ["montando","supervisao","montado","bipando","bipado"].indexOf(k.status)>=0;
    return sup && hora_de_pegar ? e("button",{title:tit+" (clique para confirmar)", onClick:function(){d({type:"PEGAR_COND", id:k.id, por:s.usuario});},
        className:"inline-flex h-7 items-center gap-1 rounded-md border border-warning/50 bg-warning/10 px-2 text-[12px] font-semibold text-warning hover:bg-warning/20"}, "Pegar "+n.length)
      : e("span",{title:tit, className:"text-[13px] font-semibold "+(hora_de_pegar?"text-warning":"text-muted-foreground")}, "○ "+n.length);
  };
  return e("div",{className:"overflow-hidden rounded-xl"},
    janelaKit && e(JanelaMontar,{key:janelaKit, kitId:janelaKit, fechar:function(){ setJanelaKit(null); }}),
    e("div",{className:"max-h-[44rem] overflow-auto"},
      e("table",{className:"w-full min-w-[70rem] table-fixed border-separate border-spacing-0 text-sm [&_td]:px-1.5! [&_td]:py-2! [&_th]:px-1.5! [&_tr.kit_span.rounded-md.border]:text-[12px]! [&_tr.kit_span.rounded-md.border]:px-1.5! [&_tr.kit>td]:border-b [&_tr.kit>td]:border-border "+BLOCO},
        e("colgroup",null, LARG.map(function(w,i){ return e("col",{key:i, style:w?{width:w}:undefined}); })),
        e("tbody",null, lists.map(function(l){
          // Aguardando condicional (precond) não conta pra montagem ainda: some daqui até a funcionária de condicionais liberar
          var ks = s.kits.filter(function(k){return k.lid===l.id && k.status!=="precond" && (!busca || k.rev.toLowerCase().indexOf(busca)>=0) && (!sit || sit.st.indexOf(k.status)>=0);})
            .sort(function(a,b){
              // Ordenar por: horário de atendimento, situação ou (padrão) prioridade + etapa + fila
              if(p.ordem==="horario"){ var ha = a.horaAtend||"99", hb = b.horaAtend||"99"; if(ha!==hb) return ha<hb ? -1 : 1; return a.ordem-b.ordem; }
              if(p.ordem==="situacao"){ var sa = ETAPA[a.status], sb = ETAPA[b.status]; if(sa!==sb) return sa-sb; return (a.horaAtend||"")<(b.horaAtend||"") ? -1 : 1; }
              // 1) prioritários primeiro; 2) mais adiantados em cima; 3) posição na fila; 4) ordem da listagem
              if(a.prio!==b.prio) return a.prio ? -1 : 1;
              var ea = ETAPA[a.status], eb = ETAPA[b.status]; if(ea!==eb) return ea-eb;
              var pa = fila.indexOf(a), pb = fila.indexOf(b); if(pa>=0&&pb>=0) return pa-pb;
              return a.ordem-b.ordem; });
          var todos = s.kits.filter(function(k){return k.lid===l.id && k.status!=="precond";});
          var prontos = todos.filter(function(k){return k.status==="bipado";}).length;
          var semValor = todos.filter(function(k){return k.status==="semvalor";}).length;
          var atras = todos.filter(function(k){return k.atrasado;}).length;
          var aberta = !!s.abertas[l.id], comLinhas = aberta && ks.length>0, ultimo = ks[ks.length-1];
          var linhas = [];
          if(sit && !ks.length) return linhas;
          var retirados = todos.filter(function(k){return k.status==="retirado";}).length;
          if(mostrados++>0) linhas.push(e("tr",{key:l.id+"esp", "aria-hidden":true}, e("td",{colSpan:COLS, className:"h-3 p-0!"})));
          linhas.push(e("tr",{key:l.id},
            e("td",{colSpan:COLS, className:"px-3! py-2! shadow-[inset_0_1px_0_rgba(255,255,255,.35)] bg-linear-to-r from-[#B8862B] via-[#E8B84B] to-[#F1E4C6] "+TINTA+" "+(comLinhas?"rounded-t-xl":"rounded-xl")},
              e("div",{className:FAIXA_GRADE},
                e("button",{onClick:function(){d({type:"TOGGLE", id:l.id});}, "aria-expanded":aberta, className:"inline-flex min-w-0 items-center gap-2 font-heading text-[15px] font-bold"},
                  e(Icon,{n: aberta?"chevrondown":"chevron", s:16}), e("span",{className:"truncate"}, l.rep)),
                chip(l.horario+(l.viagem ? " · "+l.destino : ""), l.viagem?"send":"clock", null, (l.viagem?"Viagem para "+l.destino+", ":"")+"retirada às "+l.horario),
                e("div",{className:"flex min-w-0 gap-1"},
                  semValor>0 && chip(semValor+" sem valor",null,"bg-[#7A1F1F] text-white"),
                  !semValor && atras>0 && chip(atras+(atras>1?" atrasados":" atrasado"),"clock","bg-[#9A4A00] text-white", "Pedidos fora do prazo")),
                e("span",{className:"text-[13px] font-medium opacity-85", title:prontos+" bipados esperando retirada, "+retirados+" retirados de "+todos.length},
                  prontos+" bip. · "+retirados+"/"+todos.length+" ret."),
                e("span",{className:"flex h-1.5 overflow-hidden rounded-full bg-black/15", title:"escuro = retirados, médio = bipados"},
                  e("i",{className:"block h-full bg-[#1B1409]", style:{width:(retirados/todos.length*100)+"%"}}),
                  e("i",{className:"block h-full bg-[#1B1409]/45", style:{width:(prontos/todos.length*100)+"%"}})),
                e("span",null),
                // botões em posições fixas (o espaço fica reservado mesmo quando um botão não aparece)
                e("div",{className:"flex justify-end gap-1.5"},
                  sup && (semValor>0 ? gbtn("Confirmar "+semValor,"check",function(){d({type:"CONFIRMAR_SUGERIDOS", lid:l.id});},false,false,"w-[8.5rem]","Confirmar "+semValor+" valores sugeridos")
                    : e("span",{className:"w-[8.5rem]"})),
                  sup && gbtn("Última hora","plus",function(){p.abrir("kit", l.id);},false,false,"w-[8rem]","Incluir kit de última hora"),
                  sup && gbtn(prontos ? "Retirada ("+prontos+")" : "Nada pronto","send",function(){p.abrir("ret", l.id);}, true, !prontos,"w-[8.5rem]","Fazer retirada dos kits bipados"))))));
          if(comLinhas) linhas.push(cabecalho(l.id+"cab"));
          if(aberta) ks.forEach(function(k){
            var pos = fila.indexOf(k), ab = s.kitAberto===k.id, fim = k===ultimo, tipo = TIPO_KIT[k.tipoKit] || TIPO_KIT.acerto_kit, semKit = !!SEM_KIT[k.tipoKit];
            linhas.push(e("tr",{key:k.id, className:"kit transition-colors "+(ab ? "bg-primary/10" : (TOM_LINHA[k.status] || "bg-card hover:bg-muted/40"))+(fim && !ab?" fim":"")},
              e(TD,{className:C+" "+MONO+" text-muted-foreground"}, k.designada ? e("span",{className:"text-primary", title:"Pedido para "+nomeDe(k.designada)},"Ped.") : pos>=0 ? (pos+1)+"º" : "—"),
              e(TD,{className:C+" "+MONO+" text-[12.5px]!", title:"Horário de atendimento (a representante organiza pelo app)"}, k.horaAtend || vazio),
              e(TD,{className:C+" truncate font-medium"}, e("span",{title:k.rev+(k.atrasado?" · pedido fora do prazo":"")+(k.autorizadoPor?" · autorizado por "+nomeDe(k.autorizadoPor):"")},
                k.prio && e("span",{className:"text-primary", title:"Prioritário"},"★ "), k.rev),
                k.atrasado && e("span",{className:"ml-1 rounded bg-[#9A4A00]/85 px-1 py-px text-[10px] font-semibold text-white", title:"Pedido fora do prazo"},"atras."),
                modalidadeDe(s, k.rev)==="prata" && e("span",{className:"ml-1 rounded bg-slate-600 px-1 py-px text-[10px] font-bold text-white", title:"Kit 100% Prata"},"PRATA"),
                soEncomendas(k, s.cfg) && e("span",{className:"ml-1 rounded bg-[#7C3AED] px-1 py-px text-[10px] font-bold text-white", title:"Kit acima do limite de Encomendas: só "+nomesEncomendas(s)+" montam"+(k.excecaoEnc ? " (exceção liberada por "+nomeDe(k.excecaoEnc)+")" : "")},"Só Encomendas")),
              e(TD,{className:C}, e("span",{title:tipo[0], className:"inline-block max-w-full truncate rounded-md border px-1.5 py-0.5 text-[11.5px] font-semibold "+BADGE[tipo[2]]}, tipo[1])),
              sup && e(TD,{className:C+" "+MONO}, semKit ? vazio
                : k.tipoKit.indexOf("kit_novo")===0 ? e("span",{className:"text-muted-foreground", title:"Revendedora nova (valor definido pelo setor Kit novo)"},"nova")
                : k.tipoKit==="reposicao" ? e("span",{className:"text-muted-foreground", title:"Reposição: sem valor de venda, até "+BK(s.cfg.reposicaoMax)},"reposição")
                : k.status==="semvalor" ? e("span",{className:"text-muted-foreground", title:"Ainda não calculada"},"—")
                : k.vendas.length ? BK(media3(k.vendas)) : e("span",{className:"text-muted-foreground", title:"Sem vendas: kit padrão a confirmar"},"sem vendas")),
              sup && e(TD,{className:C}, semKit ? vazio
                : k.status==="semvalor" ? gbtn("Definir","calc",function(){d({type:"ABRIR_CALC", id:k.id});}, true, false, "w-[5.5rem]", "Ir para a Calculadora de kits")
                : e(KitValor,{k:k, ro:!sup, key:k.id+":"+k.valor+":"+k.status})),
              e(TD,{className:C}, e(StatusBadge,{k:k})),
              e(TD,{className:C+" truncate"}, celMont(k)),
              e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, k.status==="montando"
                ? (k.pausadoEm ? e("span",{className:"text-warning"},"pausado") : e(Relogio,{k:k, curto:true, className:"font-semibold text-purple"}))
                : tempoFim(k.tempoM, k.fimM) || vazio),
              e(TD,{className:C}, celCond(k)),
              e(TD,{className:C+" truncate"}, k.bipId ? e("span",{className:k.bipId===euBip?"font-semibold text-info":""}, nomeDe(k.bipId))
                : euBip && k.status==="montado"
                  ? e("button",{disabled:euBipando, title: euBipando ? "Finalize o kit atual antes de iniciar outro" : "Iniciar a bipagem deste kit",
                      onClick:function(){d({type:"INICIAR_B", id:k.id, bipId:euBip});},
                      className:"inline-flex h-7 items-center gap-1 rounded-md bg-success px-2 text-[12px] font-semibold text-[#06210F] hover:bg-success/85 disabled:bg-muted disabled:text-muted-foreground"},
                      e(Icon,{n:"play", s:12}), "Bipar")
                  : vazio),
              e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, k.status==="bipando" ? e(RelogioB,{desde:k.iniB, curto:true, className:"font-semibold text-info"})
                : k.fimB ? tempoFim(k.fimB-k.iniB, k.fimB) : vazio),
              e(TD,{className:C+" "+MONO+" text-[12.5px]!"}, condNovas(k).length ? e("span",{className:"text-warning", title:"Nova(s) condicional(is), digitada(s) na bipagem: "+condNovas(k).join(", ")}, condNovas(k)[0], condNovas(k).length>1 && e("b",{className:"ml-1 rounded bg-warning/20 px-1 text-[10.5px]"}, "+"+(condNovas(k).length-1))) : vazio),
              e(TD,{className:"px-0.5! py-1!"}, sup && e(MenuAcoes,{k:k, abrirRetirada:function(){p.abrir("ret", l.id);}, naLinha:function(){ setLinhaAb(k.id); }}))));
            if(sup && k.status==="bipando" && (k.bipId===s.usuario || linhaAb===k.id)) linhas.push(e("tr",{key:k.id+"fb", className:"kit bg-info/10"+(fim && !ab?" fim":"")},
              e("td",{colSpan:COLS, className:"px-4! py-2!"}, e(LinhaFinalizar,{k:k, fechar: k.bipId===s.usuario ? null : function(){ setLinhaAb(null); }}))));
            if(ab) linhas.push(e("tr",{key:k.id+"tl", className:"kit bg-muted/20"+(fim?" fim":"")}, e("td",{colSpan:COLS, className:"px-4 py-3"}, e(LinhaTempo,{k:k}))));
          });
          return linhas;
        })))));
}

export { ETAPA, TOM_LINHA, tempoFim, FAIXA_GRADE, Fila };
