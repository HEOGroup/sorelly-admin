// Sorelly Admin — pages/RevendedorasInternas.js
// Kits → Atendimento interno → Revendedoras. Controle das revendedoras que acertam na própria Sorelly:
// tabela (ciclo, vendas, próxima data, situação) e calendário em tela cheia com o que está agendado por dia.
// A agendadora trabalha por aqui: contata, agenda, confirma na véspera e manda o lembrete (textos prontos).
import { modalidadeDe, versaoEfetiva, versaoVigente } from "@/apps/montagem/domain/consignado";
import { DIRETORIA, nomeDe } from "@/apps/montagem/domain/equipe";
import { feriadoDe, CAP_HORA, HORAS_AGENDA, diaDaSemana, horasDoDia, capacidadeDia, marcadasDoDia, motivoNaoMarcar, parteData, CICLOS, SITUACOES, TIPOS_REG, MOTIVOS_REG, AUTORIZADORES, tipoReg, resumoMulta, multaDaVez, avisoRemarcacao, mensagemRegras, avaliarKit, MEDIA_MINIMA_SORELLY, mediaTres, kitDaMedia, diasEntre, fmtDataBR, isoDe, mensagens, proximoAcerto, emAlerta } from "@/apps/montagem/domain/revendedoras-internas";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { FileiraCampos, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { PageHead } from "@/apps/montagem/ui/page";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
var COR_CICLO = {30:"#22C55E", 45:"#F59E0B", 60:"#8B5CF6"};
var th = function(t){ return e("th",{key:t, className:"whitespace-nowrap border-b border-r border-border px-3 py-3 text-center text-[12.5px] font-semibold uppercase tracking-wide last:border-r-0"}, t); };
var td = function(v, c){ return e("td",{className:"whitespace-nowrap border-r border-border/60 px-3 py-3 text-center text-[14px] last:border-r-0 "+(c||"")}, v); };
var dash = e("span",{className:"text-muted-foreground"},"—");
var dinheiro = function(v){ return v==null ? dash : BK(v); };

// bolinha colorida do ciclo (30 verde · 45 âmbar · 60 roxo)
function IconeCiclo(p){
  return e("span",{title:"Ciclo de "+p.n+" dias"+(p.manual ? " · data digitada à mão" : ""), className:"inline-flex items-center gap-1"},
    e("span",{className:"grid size-8 place-items-center rounded-full text-[13px] font-extrabold text-[#111]", style:{background:COR_CICLO[p.n]}}, p.n),
    p.manual && e("span",{className:"text-[11px] text-muted-foreground"},"✎"));
}
// ouro (Kit Normal) ou prata (Kit 100% Prata)
function IconeKit(p){
  var prata = p.prata;
  return e("span",{title:prata ? "Kit 100% Prata" : "Kit Normal", className:"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 "+(prata ? "bg-slate-300/20 text-slate-200 ring-slate-300/50" : "bg-primary/15 text-primary ring-primary/40")},
    e("span",{className:"size-3 rounded-full", style:{background:prata ? "linear-gradient(135deg,#F1F5F9,#94A3B8)" : "linear-gradient(135deg,#F1E4C6,#B8862B)"}}), prata ? "Prata" : "Normal");
}
// variação da venda em relação ao mês anterior
function Variacao(p){
  if(p.novo==null || p.ant==null || !p.ant) return null;
  var pct = Math.round((p.novo/p.ant-1)*100); if(pct===0) return e("span",{className:"text-[11.5px] text-muted-foreground"},"=");
  return e("span",{className:"text-[11.5px] font-bold "+(pct>0 ? "text-success" : "text-destructive")}, (pct>0 ? "▲ " : "▼ ")+Math.abs(pct)+"%");
}
function Par(p){   // venda e acerto de um mês, lado a lado
  return e("div",{className:"flex flex-col items-center leading-tight"},
    e("span",{className:MONO+" text-[13px]"}, dinheiro(p.h && p.h.venda)),
    e("span",{className:MONO+" text-[12px] text-muted-foreground"}, dinheiro(p.h && p.h.acerto)));
}

function copiar(txt){ try { navigator.clipboard.writeText(txt); } catch(err){ /* sem permissão: o texto continua na caixa para copiar à mão */ } }

// Card das vendas de 2026 (Marcus, 28/10/2026): todas as vendas (acertos fechados) da revendedora no ano, lidas da DevMaster, no mesmo lugar do cadastro.
// Valor de venda e valor de acerto SEM brinde (brinde, troca, indicação e premiação ficam de fora, como na média). Só leitura. A ficha vem do card (uma busca só).
function VendasAno(p){
  var ficha = p.ficha, f = ficha.f, calculando = !!f && f.brinde && f.brinde.pronto===false;
  var vendas = ((f && f.vendasTodas) || []).filter(function(v){ return v.situacao==="Fechada" && String(v.dia||v.emissao||"").slice(0,4)==="2026" && v.liquida!=null; })
    .sort(function(a,b){ return String(b.dia||b.emissao).localeCompare(String(a.dia||a.emissao)); });
  var totV = vendas.reduce(function(t,v){ return t+(v.liquida||0); }, 0), totA = vendas.reduce(function(t,v){ return t+(v.acertoLiq||0); }, 0);
  var cab = function(t, i){ return e("th",{key:t, className:"px-3 py-2 text-[12px] font-semibold uppercase tracking-wide "+(i===0 ? "text-left" : "text-right")}, t); };
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("b",{className:"text-[12.5px] uppercase tracking-wide text-primary"}, "Vendas de 2026"+(ficha.estado==="ok" && !calculando ? " ("+vendas.length+")" : "")),
      e("span",{className:"text-[12.5px] text-muted-foreground"}, "Sem brinde, troca, indicação e premiação · vem da DevMaster")),
    ficha.estado==="carregando" ? e("p",{className:"text-[13px] text-muted-foreground"},"Buscando as vendas na DevMaster…")
    : ficha.estado==="sem" ? e("p",{className:"text-[13px] text-muted-foreground"},"Sem código da DevMaster ou servidor desligado: não dá para buscar as vendas.")
    : ficha.estado==="erro" ? e("p",{className:"text-[13px] text-destructive"}, ficha.msg || "Não consegui buscar as vendas.")
    : calculando ? e("p",{className:"text-[13px] text-muted-foreground"},"O sistema ainda está separando os brindes das vendas ("+f.brinde.pct+"%). Abra de novo em instantes.")
    : vendas.length===0 ? e("p",{className:"text-[13px] text-muted-foreground"},"Nenhuma venda fechada em 2026.")
    : e("div",{className:"max-h-64 overflow-y-auto rounded-lg border border-border/60"},
        e("table",{className:"w-full border-collapse text-[13px]"},
          e("thead",{className:"sticky top-0 bg-sidebar"}, e("tr",null, ["Data","Valor de venda","Valor de acerto"].map(cab))),
          e("tbody",null, vendas.map(function(v){ return e("tr",{key:v.codigo, className:"border-t border-border/50"},
            e("td",{className:"px-3 py-1.5 text-left "+MONO}, fmtDataBR(v.dia||v.emissao), !(v.liquida>0) && e("span",{className:"ml-2 rounded bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground", title:"Só troca, brinde, indicação ou premiação: não conta como venda"},"sem venda")),
            e("td",{className:"px-3 py-1.5 text-right "+MONO}, dinheiro(v.liquida)),
            e("td",{className:"px-3 py-1.5 text-right "+MONO+" text-primary"}, dinheiro(v.acertoLiq))); })),
          e("tfoot",null, e("tr",{className:"border-t-2 border-border bg-muted/30 font-bold"},
            e("td",{className:"px-3 py-1.5 text-left"}, "Total"), e("td",{className:"px-3 py-1.5 text-right "+MONO}, dinheiro(totV)), e("td",{className:"px-3 py-1.5 text-right "+MONO+" text-primary"}, dinheiro(totA)))))));
}

// Histórico de vendas da cliente: SEM limite (serve para anos). Cada acerto novo entra aqui e a média dos últimos 5 meses sai sozinha na Atendimento Sorelly.
function Historico(p){
  var r = p.r, d = p.d, f0 = useState({data:"", venda:null, acerto:null}), f = f0[0], setF = f0[1], ed0 = useState(null), editando = ed0[0], setEditando = ed0[1];   // editando = posição da linha em edição
  var lista = r.hist.map(function(h, i){ return {h:h, i:i}; }).filter(function(x){ return x.h.data || x.h.venda!=null; });
  var av = avaliarKit(r.hist, 0, p.cfg, p.hojeIso.slice(0,7));
  var ok = f.data && f.venda>0;
  var add = function(){ if(!ok) return; d({type:"REVINT_VENDA_ADD", id:r.id, data:f.data, venda:f.venda, acerto:f.acerto}); setF({data:"", venda:null, acerto:null}); };
  var CP = INPUT+" h-9! text-sm! text-center! "+MONO;
  return e("div",{className:"flex flex-col gap-2 rounded-xl bg-card p-3 ring-1 ring-border md:col-span-2 xl:col-span-4"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("b",{className:"text-[12.5px] uppercase tracking-wide text-primary"}, "Histórico de vendas ("+lista.length+")"),
      e("span",{className:"text-[12.5px] "+(av.motivo ? "text-destructive" : "text-muted-foreground")}, av.media!==null ? "Média dos últimos meses anteriores: "+BK(av.media)+(av.motivo ? " · "+av.motivo : "") : "Sem vendas cadastradas")),
    e("div",{className:"grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]"},
      e("div",{className:"max-h-60 overflow-y-auto rounded-lg border border-border/60"},
        lista.length===0 ? e("p",{className:"p-3 text-[13px] text-muted-foreground"},"Nenhuma venda ainda: lance as últimas vendas (pode ser quantas quiser) para a média ficar automática.")
        : e("table",{className:"w-full border-collapse text-[13.5px]"},
            e("thead",null, e("tr",{className:"bg-sidebar"}, ["Data","Valor de venda","Valor de acerto",""].map(function(t){ return e("th",{key:t, className:"px-3 py-2 text-center text-[12px] font-semibold uppercase"}, t); }))),
            e("tbody",null, lista.map(function(x){ var set = function(patch){ d({type:"REVINT_VENDA_SET", id:r.id, idx:x.i, patch:patch}); }, CE = INPUT+" h-8! w-32 text-[13px]! text-center! "+MONO, on = editando===x.i;
              return e("tr",{key:x.i, className:"border-t border-border/50 "+(on ? "bg-primary/10" : "")},
                e("td",{className:"px-3 py-1.5 text-center "+MONO}, on ? e("input",{type:"date", value:x.h.data||"", "aria-label":"Data da venda", className:INPUT+" h-8! w-36 text-[13px]! "+MONO, onChange:function(ev){ set({data:ev.target.value||null}); }}) : fmtDataBR(x.h.data)),
                e("td",{className:"px-3 py-1.5 text-center "+MONO}, on ? e(CampoDinheiro,{value:x.h.venda, label:"Valor de venda", className:CE, onChange:function(v){ set({venda:v}); }}) : dinheiro(x.h.venda)),
                e("td",{className:"px-3 py-1.5 text-center "+MONO+" text-primary"}, on ? e(CampoDinheiro,{value:x.h.acerto, label:"Valor de acerto", className:CE+" text-primary!", onChange:function(v){ set({acerto:v}); }}) : dinheiro(x.h.acerto)),
                e("td",{className:"whitespace-nowrap px-2 py-1.5 text-center"},
                  on ? e("button",{type:"button", onClick:function(){ setEditando(null); d({type:"REVINT_VENDA_ORDENAR", id:r.id}); }, className:"h-8 rounded-lg bg-primary px-3 text-[12.5px] font-bold text-primary-foreground"}, "OK")
                     : e("button",{type:"button", onClick:function(){ setEditando(x.i); }, className:"h-8 rounded-lg bg-white/10 px-3 text-[12.5px] font-semibold hover:bg-white/15"}, "Editar"),
                  e("button",{type:"button", "aria-label":"Remover venda", onClick:function(){ if(on) setEditando(null); d({type:"REVINT_VENDA_DEL", id:r.id, idx:x.i}); }, className:"ml-1 px-1.5 text-[13px] text-muted-foreground hover:text-destructive"}, "×"))); })))),
      e("div",{className:"flex flex-col gap-2"},
        e("span",{className:"text-[12px] text-muted-foreground"},"Acrescentar venda anterior"),
        e("input",{type:"date", value:f.data, "aria-label":"Data da venda", className:CP, onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }}),
        e(CampoDinheiro,{value:f.venda, label:"Valor de venda", className:CP, onChange:function(v){ setF(Object.assign({}, f, {venda:v})); }}),
        e(CampoDinheiro,{value:f.acerto, label:"Valor de acerto", className:CP, onChange:function(v){ setF(Object.assign({}, f, {acerto:v})); }}),
        e("button",{type:"button", disabled:!ok, onClick:add, className:"h-9 rounded-lg bg-primary px-3 text-[13px] font-bold text-primary-foreground disabled:opacity-50"}, "Adicionar ao histórico"))));
}

// ── Card da revendedora (versão aprovada pelo Marcus em 28/10/2026, docs/rascunhos/card-revendedora-ouro-v1-meio.html; compacto e em janela por cima da lista) ──
// Nome + bolinha + número · resumo à esquerda · REGISTROS no meio (lista em cima; embaixo UM bloco que vai trocando de opções, passo a passo, sem campo grande) · condicionais ativas embaixo.
// Registro e multa: domain/revendedoras-internas.js (TIPOS_REG, escada 5/8/15). Regras novas: botão Enviar regras novas (PDF + carimbo da versão).
var foneDe = function(r){ var c = (r.contatos||[]).find(function(x){ return x.fone; }); var n = c ? String(c.fone).replace(/D/g,"") : ""; return n ? (n.length<=11 ? "55"+n : n) : ""; };
var foneBonito = function(r){ var n = foneDe(r).replace(/^55/,""); return n.length===11 ? "("+n.slice(0,2)+") "+n.slice(2,7)+"-"+n.slice(7) : n.length===10 ? "("+n.slice(0,2)+") "+n.slice(2,6)+"-"+n.slice(6) : n; };
var linkZap = function(r, texto){ var n = foneDe(r); return n ? "https://wa.me/"+n+(texto ? "?text="+encodeURIComponent(texto) : "") : ""; };
var BotaoZap = function(r, cls){ var l = linkZap(r); return l ? e("a",{href:l, target:"_blank", rel:"noreferrer", title:"Chamar no WhatsApp", "aria-label":"WhatsApp de "+r.nome, onClick:function(ev){ ev.stopPropagation(); }, className:"inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-[#04210f] hover:brightness-110 "+(cls||"")}, "W") : null; };
var CARD_ESTILO = {background:"radial-gradient(900px 260px at 0% -10%, rgba(241,213,138,.13), transparent 60%), radial-gradient(500px 300px at 100% 110%, rgba(241,213,138,.13), transparent 60%), linear-gradient(150deg,#33260f,#120d06)", border:"1px solid rgba(241,213,138,.30)", boxShadow:"0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.06)"};
var TOPO_ESTILO = {background:"linear-gradient(90deg, rgba(241,213,138,.30), rgba(241,213,138,0))"};
var BTN_OURO = {background:"linear-gradient(135deg,#F1D58A,#C9962F)"};
var CLASSE_TIPO = {"k-ag":"bg-success/15 text-success ring-success/40", "k-des":"bg-warning/15 text-warning ring-warning/40", "k-falt":"bg-destructive/15 text-destructive ring-destructive/40", "k-t":"bg-primary/15 text-primary ring-primary/40",
  "k-rep":"bg-info/15 text-info ring-info/40", "k-extra":"bg-violet-500/15 text-violet-300 ring-violet-400/40", "k-out":"bg-white/10 text-foreground ring-border"};
var chip = function(txt, cls, title){ return e("span",{className:"inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-[11px] font-bold ring-1 "+cls, title:title||null}, txt); };
var ROTULO = "text-[11px] font-semibold uppercase tracking-[.07em] text-[#cdbf9f]";
var CAMPO = INPUT+" h-8! w-full text-[13px]! ";
var TIPO_COND = function(t){ return t==="Reposição / peças do próximo mês" ? "Kit extra" : t; };   // no Atendimento interno não existe "peças do próximo mês"
var CLASSE_COND = function(t){ return t==="Kit principal" ? "k-t" : t==="Kit extra" || t==="Kit novo" ? "k-extra" : t==="Expositor" ? "k-out" : "k-rep"; };
// passos de cada tipo (o bloco de registrar mostra um por vez; o que já foi escolhido vira uma etiqueta que dá para trocar)
var PASSOS = {marcado:["quando"], remarcado:["motivo","quando","autorizado"], nao_veio:["motivo","autorizado"], desmarcado:["motivo","autorizado"], ciclo:["ciclo"]};
var PASSO_ROTULO = {motivo:"Por quê?", quando:"Novo dia e hora", autorizado:"Quem autorizou?", ciclo:"Novo ciclo"};

// COMISSÃO ESPECIAL (Edna, 09/11/2026): algumas revendedoras têm comissão diferente da tabela (ex.: Lorena Barbosa, 40% até R$ 999,99 e 50% de R$ 1.000,00 em diante). Fica fixa na ficha e a Atendimento Sorelly já calcula com ela.
// Só a % de comissão muda; os brindes, a taxa e as multas seguem a tabela normal. Quem vê: o setor todo. Quem muda: só a Diretoria.
function ComissaoEspecial(p){
  var r = p.r, s = p.s, esp = r.comissaoEspecial || null, vig = versaoVigente(s), ef = vig ? versaoEfetiva(vig, "padrao") : null;
  var faixasBase = ef ? ef.faixas.slice().sort(function(a, b){ return a.min-b.min; }) : [];
  var ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var vs = useState(function(){ return Object.assign({}, esp || {}); }), vals = vs[0], setVals = vs[1];
  var ns = useState(""), novaFaixa = ns[0], setNovaFaixa = ns[1];
  // linhas = faixas da tabela + pontos de corte extras (ex.: acima de R$ 1.500,00); a coluna Tabela normal mostra a % da faixa em que o corte cai
  var extras = Object.keys(vals).filter(function(k){ return k!=="mais"; }).map(Number).filter(function(m){ return isFinite(m) && faixasBase.every(function(f){ return f.min!==m; }); });
  var faixas = faixasBase.concat(extras.map(function(m){ var dentro = faixasBase.filter(function(f){ return f.min<=m; }).pop(); return {min:m, pct:dentro ? dentro.pct : 0, extra:true}; })).sort(function(a, b){ return a.min-b.min; });
  var maisV = vals.mais==null ? "" : String(vals.mais), trocaMais = function(v){ var n = Object.assign({}, vals); n.mais = v.replace(/[^\d.,]/g, "").replace(",", "."); setVals(n); };
  var addFaixa = function(){ var n = Number(String(novaFaixa).replace(",", ".")); if(!isFinite(n) || n<=0) return; var k = String(n); if(vals[k]!==undefined) return; var v = Object.assign({}, vals); v[k] = ""; setVals(v); setNovaFaixa(""); };
  var podeEditar = DIRETORIA.some(function(x){ return x.id===s.usuario; });
  var resumo = esp ? (esp.mais>0 ? "mais "+esp.mais+" pontos" : faixas.filter(function(f){ return esp[String(f.min)]!=null; }).map(function(f){ return esp[String(f.min)]+"%"; }).filter(function(x, i, a){ return a.indexOf(x)===i; }).join(" · ")) : "";
  var troca = function(min, v){ var n = Object.assign({}, vals); n[String(min)] = v.replace(/[^\d.,]/g, "").replace(",", "."); setVals(n); };
  var repetir = function(i){ var n = Object.assign({}, vals), v = n[String(faixas[i].min)]; faixas.slice(i+1).forEach(function(f){ n[String(f.min)] = v; }); setVals(n); };
  var salvar = function(){ p.d({type:"REVINT_COM_ESPECIAL", id:r.id, faixas:vals}); setAberto(false); };
  var normal = function(){ if(!window.confirm("Voltar "+r.nome+" para a tabela normal de comissões?")) return; setVals({}); p.d({type:"REVINT_COM_ESPECIAL", id:r.id, faixas:null}); setAberto(false); };
  return e("div",{className:"border-t border-[rgba(241,213,138,.16)] px-4 py-2"},
    e("button",{type:"button", onClick:function(){ setAberto(!aberto); }, className:"flex items-center gap-2 text-[13px] font-semibold text-[#F1D58A]"},
      "Comissão especial "+(aberto ? "▴" : "▾"), e("span",{className:"font-normal text-foreground"}, esp ? "· Especial ("+resumo+")" : "· Tabela normal")),
    aberto && e("div",{className:"mt-2 flex flex-col gap-2"},
      e("p",{className:"text-[13px]"}, "Só a comissão muda. Os brindes seguem a tabela normal. Deixe em branco a faixa que fica igual à tabela."),
      podeEditar ? e("label",{className:"flex flex-wrap items-center gap-2 text-[13px]"}, "Ou some pontos em TODAS as faixas (ex.: 5 faz 15% virar 20%):", e("input",{value:maisV, inputMode:"decimal", maxLength:4, placeholder:"0", "aria-label":"Pontos a mais em todas as faixas", className:CAMPO+"w-16! text-center!", onChange:function(ev){ trocaMais(ev.target.value); }}), e("span",null,"pontos"))
        : (maisV!=="" && Number(maisV)>0 && e("p",{className:"text-[13px] font-bold"}, "Mais "+maisV+" pontos em todas as faixas.")),
      e("div",{className:"max-w-[460px]"}, e(TabelaCampos,{cols:[{t:"Venda a partir de", w:"36%"}, {t:"Tabela normal", w:"24%"}, {t:"Comissão especial"}], minW:"24rem"}, faixas.map(function(f, i){ var v = vals[String(f.min)]; v = v==null ? "" : String(v);
        return e(FileiraCampos,{key:f.min, cells:[BK(f.min), f.pct+"%", podeEditar
          ? e("span",{className:"inline-flex items-center gap-1"}, e("input",{value:v, inputMode:"decimal", maxLength:5, "aria-label":"Comissão especial a partir de "+BK(f.min), placeholder:"—", className:CAMPO+"w-20! text-center!", onChange:function(ev){ troca(f.min, ev.target.value); }}), e("span",null,"%"),
              e("button",{type:"button", title:"Repetir este valor nas faixas de baixo", "aria-label":"Repetir este valor nas faixas de baixo", disabled:v==="", onClick:function(){ repetir(i); }, className:"h-8 rounded-md px-2 text-[13px] font-bold text-[#E8B84B] hover:bg-white/10 disabled:opacity-40"}, "↓"))
          : e("b",{className:MONO}, v==="" ? "—" : v+"%")]}); }))),
      podeEditar && e("div",{className:"flex flex-wrap items-center gap-2"},
        e("span",{className:"text-[13px]"}, "Outro ponto de corte, a partir de R$"),
        e("input",{value:novaFaixa, inputMode:"decimal", maxLength:9, placeholder:"1500,01", "aria-label":"Novo ponto de corte", className:CAMPO+"w-28! text-center!", onChange:function(ev){ setNovaFaixa(ev.target.value.replace(/[^\d.,]/g, "")); }, onKeyDown:function(ev){ if(ev.key==="Enter") addFaixa(); }}),
        e("button",{type:"button", disabled:!novaFaixa, onClick:addFaixa, className:"h-8 rounded-lg px-3 text-[13px] font-bold ring-1 ring-[rgba(241,213,138,.4)] hover:bg-white/10 disabled:opacity-40"}, "Adicionar")),
      podeEditar
        ? e("div",{className:"flex flex-wrap items-center gap-2"},
            e("button",{type:"button", onClick:salvar, className:"h-8 rounded-lg px-3 text-[13px] font-bold text-[#17110a]", style:BTN_OURO}, "Salvar comissão especial"),
            esp && e("button",{type:"button", onClick:normal, className:"h-8 rounded-lg px-3 text-[13px] font-bold ring-1 ring-[rgba(241,213,138,.4)] hover:bg-white/10"}, "Voltar à tabela normal"),
            esp && r.comissaoEspecialPor && e("span",{className:"text-[13px]"}, "Salva por "+r.comissaoEspecialPor+(r.comissaoEspecialEm ? " em "+fmtDataBR(isoDia(new Date(r.comissaoEspecialEm))) : "")))
        : e("p",{className:"text-[13px]"}, "Só a Diretoria muda a comissão especial.")));
}

function Detalhes(p){
  var r = p.r, cx = p.cx, s = cx.state, d = cx.dispatch, hojeIso = p.hojeIso, eu = nomeDe(s.usuario);
  var ag = useState({data:(r.agend && r.agend.data) || proximoAcerto(r), hora:(r.agend && r.agend.hora) || "10:00", tipo:r.tipoAtend || (r.kitNovo ? "kit_novo" : "acerto"), quer:r.quer || "", valor:r.valorLiberado || null}), form = ag[0], setForm = ag[1];
  var NOVO0 = {tipo:"", motivo:"", quando:null, autorizado:"", ciclo:"", quem:"eu", texto:"", dia:(r.agend && r.agend.data) || proximoAcerto(r), hora:(r.agend && r.agend.hora) || "10:00"};
  var nf = useState(NOVO0), novo = nf[0], setNovo = nf[1];
  var tg = useState(false), todos = tg[0], setTodos = tg[1], ve = useState(false), verExpo = ve[0], setVerExpo = ve[1], vd = useState(false), verVendas = vd[0], setVerVendas = vd[1];
  var cc = useState(null), copiado = cc[0], setCopiado = cc[1];
  var fc = useState({estado:"carregando", f:null}), ficha = fc[0], setFicha = fc[1];
  var prata = modalidadeDe(s, r.nome)==="prata";
  var set = function(patch){ d({type:"REVINT_SET", id:r.id, patch:patch}); };
  var cod = String(r.devmaster||"").replace(/\D/g,"").padStart(6,"0");
  // ficha da DevMaster (uma busca só): vendas de 2026 e o histórico completo das anotações (todas as condicionais, também as já fechadas)
  useEffect(function(){
    if(!r.devmaster || !apiAtiva()){ setFicha({estado:"sem", f:null}); return undefined; }
    var vivo = true; setFicha({estado:"carregando", f:null});
    chamar("GET", "/revendedoras/"+cod).then(function(f){
      if(!vivo) return; setFicha({estado:"ok", f:f});
      if(!r.histDmEm || Date.now()-r.histDmEm>6*3600000) d({type:"REVINT_HIST_DM", id:r.id, obs:(f.historico||[]).map(function(h){ return h.obs; }).filter(Boolean)});
    }).catch(function(x){ if(vivo) setFicha({estado:"erro", f:null, msg:x.message}); });
    return function(){ vivo = false; };
  }, [cod]);

  var prox = proximoAcerto(r), dias = diasEntre(hojeIso, prox), m3 = mediaTres(r.hist), kit = m3 ? kitDaMedia(m3.media, s.cfg) : null, sit = SITUACOES.find(function(x){ return x.k===r.situacao; }) || SITUACOES[0];
  var registro = r.registro || [], tp = novo.tipo ? tipoReg(novo.tipo) : null, res = resumoMulta(registro, (r.hist && r.hist[0] && r.hist[0].data) || null, hojeIso);
  // bloco de registrar: passo atual = primeiro passo ainda sem resposta
  var passos = (novo.tipo && PASSOS[novo.tipo]) || [], feito = function(ps){ return ps==="motivo" ? !!novo.motivo : ps==="quando" ? !!novo.quando : ps==="autorizado" ? novo.autorizado!=="" : ps==="ciclo" ? !!novo.ciclo : true; };
  var passoAtual = passos.find(function(ps){ return !feito(ps); }), pronto = !!novo.tipo && !passoAtual;
  var isenta = !!novo.autorizado && novo.autorizado!=="ninguem", vaiCobrar = !!(tp && tp.multa) && !isenta, multaNova = vaiCobrar ? multaDaVez(res.cobraveis+1) : null;
  var voltaPasso = function(ps){ var i = passos.indexOf(ps), z = {}; passos.slice(i).forEach(function(x){ if(x==="motivo") z.motivo = ""; if(x==="quando") z.quando = null; if(x==="autorizado") z.autorizado = ""; if(x==="ciclo") z.ciclo = ""; }); setNovo(Object.assign({}, novo, z)); };
  var registrar = function(){
    if(!pronto || (tp.k==="outro" && !novo.texto.trim())) return;
    d({type:"REVINT_REG", id:r.id, tipo:novo.tipo, motivo:novo.motivo, quem:novo.quem==="eu" ? eu : novo.quem, por:eu, autorizado:isenta ? novo.autorizado : "", isenta:isenta, dia:novo.quando ? novo.quando.dia : "", hora:novo.quando ? novo.quando.hora : "", ciclo:novo.ciclo, texto:novo.texto});
    setNovo(Object.assign({}, NOVO0, {quem:novo.quem}));
  };
  var enviarRegras = function(){
    if(!window.confirm("Registrar que as regras e comissões novas foram enviadas para "+r.nome+"? A partir de agora o PRÓXIMO acerto dela vale com as regras novas.")) return;
    var msgRegras = mensagemRegras(r, window.location.origin); copiar(msgRegras); try{ var zap = linkZap(r, msgRegras); window.open(zap || "/regras/GUIA-DA-REVENDEDORA.pdf", "_blank"); }catch(x){ /* o navegador pode bloquear a janela: o texto já foi copiado */ }
    d({type:"REVINT_REGRAS_ENVIAR", id:r.id, por:eu, quem:eu}); setCopiado("regras");
  };
  var lista = todos ? registro : registro.slice(0, 3);
  var conds = (r.conds||[]).filter(function(c){ return c.t!=="Expositor"; }).sort(function(a,b){ return (a.e||"").localeCompare(b.e||""); }), expos = (r.conds||[]).filter(function(c){ return c.t==="Expositor"; });
  var tot = conds.reduce(function(a,c){ return {p:a.p+(c.p||0), v:a.v+(c.v||0)}; }, {p:0, v:0}), totE = expos.reduce(function(a,c){ return a+(c.v||0); }, 0);
  var kv = function(rot, val, cls){ return e("div",{className:"flex flex-wrap items-baseline justify-between gap-x-2"}, e("span",{className:ROTULO}, rot), e("b",{className:MONO+" text-[13.5px] "+(cls||"")}, val)); };
  var optQuem = ["eu"].concat(["Tamara","Nickolas","Marcus","Ana Maria","Nayale","Rebeca","Mariana","Outra pessoa"].filter(function(n){ return n!==eu; }));
  var SELECT = CAMPO+"w-auto! min-w-[10rem] ";
  var etiqueta = function(txt, onClick, k){ return e("button",{key:k, type:"button", onClick:onClick, title:"Trocar", className:"inline-flex h-6 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[12px] font-semibold ring-1 ring-[rgba(241,213,138,.3)] hover:bg-white/15"}, txt, e("span",{className:"text-[#cdbf9f]"},"✕")); };

  // o passo que está na tela (um só por vez)
  var passoTela = function(){
    if(!novo.tipo) return e("select",{autoFocus:true, value:"", "aria-label":"O que aconteceu", className:SELECT+"flex-1", onChange:function(ev){ setNovo(Object.assign({}, NOVO0, {quem:novo.quem, tipo:ev.target.value})); }},
      e("option",{value:""},"O que aconteceu?"), TIPOS_REG.filter(function(x){ return x.k!=="regras" && x.k!=="marca"; }).map(function(x){ return e("option",{key:x.k, value:x.k}, x.t); }));
    if(passoAtual==="motivo") return e("select",{autoFocus:true, value:"", "aria-label":"Motivo", className:SELECT, onChange:function(ev){ setNovo(Object.assign({}, novo, {motivo:ev.target.value})); }}, e("option",{value:""}, PASSO_ROTULO.motivo), MOTIVOS_REG.map(function(mo){ return e("option",{key:mo, value:mo}, mo); }));
    if(passoAtual==="autorizado") return e("select",{autoFocus:true, value:"", "aria-label":"Quem autorizou", className:SELECT, onChange:function(ev){ setNovo(Object.assign({}, novo, {autorizado:ev.target.value})); }}, e("option",{value:""}, PASSO_ROTULO.autorizado), e("option",{value:"ninguem"},"Ninguém (com multa)"), AUTORIZADORES.map(function(n){ return e("option",{key:n, value:n}, n+" (sem multa)"); }));
    if(passoAtual==="ciclo") return e("select",{autoFocus:true, value:"", "aria-label":"Novo ciclo", className:SELECT, onChange:function(ev){ setNovo(Object.assign({}, novo, {ciclo:ev.target.value})); }}, e("option",{value:""}, PASSO_ROTULO.ciclo), [30,45,60,90].map(function(n){ return e("option",{key:n, value:n}, n+" dias"); }));
    if(passoAtual==="quando") return e(React.Fragment,null,
      e("input",{type:"date", autoFocus:true, value:novo.dia, "aria-label":"Novo dia", className:CAMPO+"w-36!", onChange:function(ev){ setNovo(Object.assign({}, novo, {dia:ev.target.value})); }}),
      e("input",{type:"time", value:novo.hora, "aria-label":"Hora", className:CAMPO+"w-24!", onChange:function(ev){ setNovo(Object.assign({}, novo, {hora:ev.target.value})); }}),
      e("button",{type:"button", disabled:!novo.dia||!novo.hora, onClick:function(){ setNovo(Object.assign({}, novo, {quando:{dia:novo.dia, hora:novo.hora}})); }, className:"h-8 rounded-lg px-3 text-[13px] font-bold text-[#17110a] disabled:opacity-50", style:BTN_OURO}, "OK"));
    return e(React.Fragment,null,   // pronto: quem falou, uma frase só se precisar (campo normal, com corretor) e Registrar
      e("select",{value:novo.quem, "aria-label":"Quem falou com ela", title:"Quem falou com ela", className:CAMPO+"w-auto! min-w-[8.5rem] shrink-0", onChange:function(ev){ setNovo(Object.assign({}, novo, {quem:ev.target.value})); }}, optQuem.map(function(n){ return e("option",{key:n, value:n}, n==="eu" ? "Eu ("+eu+")" : n); })),
      e("input",{value:novo.texto, spellCheck:true, lang:"pt-BR", autoCorrect:"on", autoCapitalize:"sentences", autoComplete:"off", placeholder:tp.k==="outro" ? "Escreva o que aconteceu" : "Só se precisar: uma frase curta", className:CAMPO+"min-w-0 flex-1", onChange:function(ev){ setNovo(Object.assign({}, novo, {texto:ev.target.value})); }, onKeyDown:function(ev){ if(ev.key==="Enter") registrar(); }}),
      e("button",{type:"button", disabled:tp.k==="outro" && !novo.texto.trim(), onClick:registrar, className:"h-8 shrink-0 rounded-lg px-4 text-[13px] font-bold text-[#17110a] disabled:opacity-50", style:BTN_OURO}, "Registrar"));
  };

  return e("div",{className:"overflow-hidden rounded-2xl text-[#fbf4e4]", style:CARD_ESTILO},
    // topo: nome em outra fonte, bolinha e número da cliente
    e("div",{className:"flex items-center gap-2.5 border-b border-[rgba(241,213,138,.16)] py-2 pl-4 pr-24", style:TOPO_ESTILO},
      e("b",{className:"min-w-0 truncate text-[15px] text-white"}, r.nome), BotaoZap(r),
      e("span",{className:"size-[6px] shrink-0 rounded-full bg-white"}),
      e("span",{className:MONO+" text-[13px] font-semibold text-white"}, cod),
      e("span",{className:"flex-1"}),
      r.agend ? chip("Marcado · "+fmtDataBR(r.agend.data)+" às "+r.agend.hora, CLASSE_TIPO["k-ag"]) : chip(sit.t, sit.cor)),
    e("div",{className:"grid md:grid-cols-[260px_minmax(0,1fr)]"},
      // resumo (esquerda)
      e("div",{className:"flex flex-col gap-1.5 border-b border-[rgba(241,213,138,.16)] p-3 md:border-b-0 md:border-r", style:{background:"linear-gradient(180deg, rgba(241,213,138,.07), transparent)"}},
        kv("Acerto previsto", fmtDataBR(prox)), kv("Faltam", dias<0 ? Math.abs(dias)+" d atrasada" : dias===0 ? "hoje" : dias+" d", dias<0 ? "text-[#fca5a5]" : ""),
        kv("Média 3 vendas", m3 ? BK(m3.media) : "—"), kv("Próximo kit", kit!=null ? BK(kit) : m3 ? "Não libera" : "—", kit!=null ? "text-[16px]! text-[#F1D58A]" : "text-[#fca5a5]"),
        e("select",{value:r.situacao, "aria-label":"Situação", className:CAMPO+"mt-1", onChange:function(ev){ set({situacao:ev.target.value}); }}, SITUACOES.map(function(x){ return e("option",{key:x.k, value:x.k}, x.t); })),
        e("div",{className:"flex gap-1.5"},
          e("input",{type:"date", value:form.data, "aria-label":"Data agendada", className:CAMPO+"min-w-[8.5rem] flex-1", onChange:function(ev){ setForm(Object.assign({}, form, {data:ev.target.value})); }}),
          e("input",{type:"time", value:form.hora, "aria-label":"Hora", className:CAMPO+"w-[92px]! shrink-0", onChange:function(ev){ setForm(Object.assign({}, form, {hora:ev.target.value})); }})),
        e("select",{value:form.tipo, "aria-label":"Tipo de atendimento", className:CAMPO+"mt-1", onChange:function(ev){ setForm(Object.assign({}, form, {tipo:ev.target.value})); }}, [["acerto", "Acerto"], ["kit_novo", "Kit novo"], ["reposicao", "Reposição"], ["indicacao", "Brinde de indicação"], ["retornando", "Kit retornando"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
        e("input",{value:form.quer, maxLength:200, placeholder:"O que a cliente quer", "aria-label":"O que a cliente quer", className:CAMPO, onChange:function(ev){ setForm(Object.assign({}, form, {quer:ev.target.value})); }}),
        e(CampoDinheiro,{value:form.valor, label:"Valor liberado (reposição ou kit novo)", className:CAMPO, onChange:function(v){ setForm(Object.assign({}, form, {valor:v})); }}),
        e("button",{type:"button", disabled:!form.data||!form.hora, onClick:function(){ d({type:"REVINT_AGENDAR", id:r.id, data:form.data, hora:form.hora, tipo:form.tipo, quer:form.quer, valor:form.valor}); }, className:"h-8 rounded-lg px-3 text-[13px] font-bold text-[#17110a] disabled:opacity-50", style:BTN_OURO}, r.agend && r.internoId ? "Atualizar na listagem" : "Incluir na listagem"),
        r.agend && r.internoId && e("span",{className:"text-[11.5px] text-[#bbf7d0]"},"✓ Na listagem do dia "+fmtDataBR(r.agend.data)),
        e("div",{className:"flex gap-1.5"},
          e("select",{value:r.ciclo, "aria-label":"Ciclo", className:CAMPO+"min-w-[5.5rem]", onChange:function(ev){ set({ciclo:Number(ev.target.value), proximoManual:null}); }}, CICLOS.map(function(n){ return e("option",{key:n, value:n}, n+" d"); })),
          e("select",{value:prata ? "prata" : "padrao", "aria-label":"Kit", className:CAMPO+"min-w-[6.5rem]", onChange:function(ev){ d({type:"SET_MODALIDADE", chave:r.nome, modalidade:ev.target.value, por:"agendamento", origem:"interno"}); }}, e("option",{value:"padrao"},"Normal"), e("option",{value:"prata"},"Prata"))),
        e("button",{type:"button", onClick:enviarRegras, title:r.regrasEnviadas ? "Enviadas em "+fmtDataBR(r.regrasEnviadas.em)+". O próximo acerto vale com as regras novas." : "Ainda não enviadas: o próximo acerto segue as regras antigas.", className:"h-8 rounded-lg px-2 text-[12.5px] font-bold ring-1 "+(r.regrasEnviadas ? "text-[#bbf7d0] ring-success/40" : "ring-[rgba(241,213,138,.4)] hover:bg-white/10")},
          copiado==="regras" ? (foneDe(r) ? "✓ WhatsApp aberto" : "✓ Copiada, PDF aberto") : r.regrasEnviadas ? "✓ Regras novas enviadas" : (foneDe(r) ? "Enviar regras no WhatsApp" : "Enviar regras novas"))),

      // MEIO: registros em cima; embaixo UM bloco que troca de opções, passo a passo
      e("div",{className:"flex min-w-0 flex-col gap-2 px-3.5 py-3"},
        e("div",{className:"flex items-center justify-between"}, e("span",{className:ROTULO},"Registros"),
          registro.length>3 && e("button",{type:"button", onClick:function(){ setTodos(!todos); }, className:"text-[12px] text-[#F1D58A]"}, todos ? "ver menos ▴" : "ver todos ("+registro.length+") ▾")),
        registro.length===0 ? e("p",{className:"text-[13px] text-[#cdbf9f]"},"Nenhum registro ainda.")
        : e("div",{className:"flex max-h-56 flex-col overflow-y-auto pr-1"}, lista.map(function(c, i){
            var t = tipoReg(c.tipo||"outro"), quem = c.quem || c.autor || "", por = c.por || "", mesmo = !por || por===quem;
            return e("div",{key:i, className:"grid grid-cols-[40px_minmax(0,1fr)] gap-2 border-t border-[rgba(241,213,138,.16)] py-1.5 first:border-t-0"},
              e("div",{className:MONO+" pt-0.5 text-[12px] text-[#cdbf9f]"}, c.data ? c.data.slice(8)+"/"+c.data.slice(5,7) : "—"),
              e("div",{className:"min-w-0"},
                e("div",{className:"flex flex-wrap items-center gap-1.5"},
                  e("b",{className:"text-[13px]"}, quem || "—"), chip(t.t.replace(" para acerto","").replace("Representante pediu o kit","Rep. pediu o kit").replace(" (funcionária, Veneziana…)","").replace(" (sem data)",""), CLASSE_TIPO[t.cor]),
                  c.dia && e("b",{className:"text-[12.5px] text-[#bbf7d0]"}, fmtDataBR(c.dia)+(c.hora ? " às "+c.hora : "")),
                  c.motivo && chip(c.motivo, CLASSE_TIPO["k-out"]),
                  c.isenta && chip("Sem multa"+(c.autorizado ? " · "+c.autorizado : ""), CLASSE_TIPO["k-ag"]),
                  c.ciclo>0 && chip(c.ciclo+" dias", CLASSE_TIPO["k-extra"]),
                  !mesmo && e("small",{className:"text-[11px] text-[#cdbf9f]"}, "reg. por "+por),
                  c.origem==="devmaster" && e("small",{className:"rounded bg-white/10 px-1 text-[10.5px] text-[#cdbf9f]", title:"Veio das observações da condicional na DevMaster"}, "DevMaster"),
                  c.origem==="sistema" && e("button",{type:"button", "aria-label":"Apagar registro", onClick:function(){ d({type:"REVINT_CONTATO_DEL", id:r.id, ts:c.ts}); }, className:"ml-auto px-1 text-[#cdbf9f] hover:text-destructive"}, "×")),
                c.texto && e("div",{className:"text-[12.5px] opacity-95 "+(c.origem==="devmaster" ? "line-clamp-1" : "")}, c.texto),
                (c.tipo==="remarcado" || c.tipo==="desmarcado" || c.tipo==="nao_veio") && c.origem==="sistema" && e("button",{type:"button", onClick:function(){ copiar(avisoRemarcacao(r, c, hojeIso)); setCopiado("av"+c.ts); }, className:"text-[13px] text-[#F1D58A]"}, copiado==="av"+c.ts ? "✓ Aviso de multa copiado" : (c.tipo==="remarcado" ? "Copiar aviso de remarcação" : "Copiar aviso de multa")))); })),
        (res.total>0) && e("div",{className:"rounded-lg px-2.5 py-1 text-[12px] ring-1 "+(res.cobraveis>0 ? "bg-warning/10 text-warning ring-warning/30" : "bg-success/10 text-success ring-success/30")},
          "Remarcações no ciclo: "+res.total+" ("+res.cobraveis+" com multa, "+res.isentas+" isenta"+(res.isentas===1 ? "" : "s")+")"+(res.cobraveis>0 ? " · no acerto: −"+res.atual.comissaoPct+" pontos de comissão e −"+res.atual.brindePct+"% do brinde" : "")),
        // registrar: um bloco só, as opções vão mudando aqui mesmo
        e("div",{className:"flex min-h-[3.2rem] flex-wrap items-center gap-1.5 rounded-xl p-2 ring-1 ring-[rgba(241,213,138,.2)]", style:{background:"rgba(241,213,138,.06)"}},
          novo.tipo && etiqueta(tp.t.replace(" para acerto","").replace(" (sem data)",""), function(){ setNovo(Object.assign({}, NOVO0, {quem:novo.quem})); }, "t"),
          novo.motivo && etiqueta(novo.motivo, function(){ voltaPasso("motivo"); }, "m"),
          novo.quando && etiqueta(fmtDataBR(novo.quando.dia)+" às "+novo.quando.hora, function(){ voltaPasso("quando"); }, "q"),
          novo.autorizado && etiqueta(novo.autorizado==="ninguem" ? "Sem autorização" : "Aut. "+novo.autorizado, function(){ voltaPasso("autorizado"); }, "a"),
          novo.ciclo && etiqueta(novo.ciclo+" dias", function(){ voltaPasso("ciclo"); }, "c"),
          passoTela()),
        pronto && tp.multa && e("span",{className:"text-[12px] "+(vaiCobrar ? "text-warning" : "text-[#bbf7d0]")}, vaiCobrar ? "Conta como a "+(res.cobraveis+1)+"ª remarcação com multa: −"+multaNova.comissaoPct+" pontos de comissão e −"+multaNova.brindePct+"% do brinde." : "Sem multa: não conta na escada."))),

    // condicionais ativas (todas as da cliente) e expositores
    e("div",{className:"border-t border-[rgba(241,213,138,.16)] px-4 pb-2.5 pt-2"},
      e("span",{className:ROTULO},"Condicionais ativas"),
      (r.conds||[]).length===0 ? e("p",{className:"mt-1 text-[13px] text-[#cdbf9f]"},"Clique em Buscar da DevMaster para trazer as condicionais desta revendedora.")
      : e(React.Fragment,null,
          e("table",{className:"mt-0.5 w-full border-collapse text-[13px]"},
            e("thead",null, e("tr",null, ["Condicional","Tipo","Emissão","Previsão","Peças","Valor"].map(function(t, i){ return e("th",{key:t, className:"px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[#cdbf9f] "+(i<2 ? "text-left" : "text-right")}, t); }))),
            e("tbody",null, conds.map(function(c, i){ var tt = TIPO_COND(c.t); return e("tr",{key:(c.n||"")+i, className:"border-t border-[rgba(241,213,138,.16)]"},
              e("td",{className:"px-2 py-1 font-bold "+MONO}, c.n||"—"), e("td",{className:"px-2 py-1"}, chip(tt, CLASSE_TIPO[CLASSE_COND(tt)], tt==="Kit extra" ? "Segunda condicional bipada depois do kit principal (no Atendimento interno não existe peças do próximo mês)" : null)),
              e("td",{className:"px-2 py-1 text-right "+MONO}, c.e ? c.e.slice(8)+"/"+c.e.slice(5,7) : "—"), e("td",{className:"px-2 py-1 text-right "+MONO}, c.d ? c.d.slice(8)+"/"+c.d.slice(5,7) : "—"),
              e("td",{className:"px-2 py-1 text-right "+MONO}, c.p), e("td",{className:"px-2 py-1 text-right "+MONO}, BK(c.v))); })),
            e("tfoot",null, e("tr",{className:"border-t-2 border-[rgba(241,213,138,.3)] font-bold"}, e("td",{className:"px-2 py-1", colSpan:4}, conds.length+(conds.length===1 ? " condicional ativa" : " condicionais ativas")), e("td",{className:"px-2 py-1 text-right "+MONO}, tot.p), e("td",{className:"px-2 py-1 text-right "+MONO}, BK(tot.v))))),
          expos.length>0 && e("div",{className:"mt-1.5 flex flex-col gap-1"},
            e("button",{type:"button", onClick:function(){ setVerExpo(!verExpo); }, className:"self-start rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-semibold text-[#cdbf9f] ring-1 ring-[rgba(241,213,138,.16)]"}, expos.length+(expos.length===1 ? " expositor" : " expositores")+" · sem previsão · "+BK(totE)+(verExpo ? " ▴" : " ▾")),
            verExpo && e("table",{className:"w-full border-collapse text-[13px]"},
              e("tbody",null, expos.map(function(c, i){ return e("tr",{key:(c.n||"")+i, className:"border-t border-[rgba(241,213,138,.16)]"},
                e("td",{className:"px-2 py-0.5 font-bold "+MONO}, c.n||"—"), e("td",{className:"px-2 py-0.5 text-[#cdbf9f]"}, c.e ? "emitido "+c.e.slice(8)+"/"+c.e.slice(5,7)+"/"+c.e.slice(0,4) : ""),
                e("td",{className:"px-2 py-0.5 text-right "+MONO}, c.p+(c.p===1 ? " peça" : " peças")), e("td",{className:"px-2 py-0.5 text-right "+MONO}, BK(c.v))); })))))),

    // comissão especial (só a % de comissão; brindes iguais)
    e(ComissaoEspecial,{r:r, s:s, d:d}),

    // vendas de 2026 e histórico (fechado: abre quando precisar)
    e("div",{className:"border-t border-[rgba(241,213,138,.16)] px-4 py-2"},
      e("button",{type:"button", onClick:function(){ setVerVendas(!verVendas); }, className:"text-[12.5px] font-semibold text-[#F1D58A]"}, "Vendas de 2026 e histórico "+(verVendas ? "▴" : "▾")),
      verVendas && e("div",{className:"mt-2 flex flex-col gap-3"}, e(VendasAno,{r:r, ficha:ficha}), e(Historico,{r:r, d:d, cfg:s.cfg, hojeIso:hojeIso}))));
}

// ── Tela Revendedoras internas (modelo 1 aprovado pelo Marcus em 28/10/2026, docs/rascunhos/revendedoras-internas-calendario-neutro.html) ──
// Em cima (Lista): calendário do mês (segunda a domingo, dia da semana escrito dentro do dia) e a lista de horários do dia escolhido, com a MESMA altura; embaixo, a tabela.
// Botão Calendário: mês inteiro, com a listagem de cada dia. Regras da agenda em domain/revendedoras-internas.js: 3 por horário, 15 por dia, sábado até 11h, domingo fechado.
var NDIA = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
var ALTURA_AGENDA = 304;
var BARRA_OURO = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)", color:"#1a1306"};
var BORDA = "border-[rgba(232,184,75,.22)]";
var BTN_OURO2 = {background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)", color:"#1a1306"};
var segundaDe = function(dt){ var x = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); x.setDate(x.getDate()-((x.getDay()+6)%7)); return x; };
var curto = function(nome){ var p = String(nome||"").split(/\s+/).filter(function(w){ return ["da","de","do","dos","das","e"].indexOf(w.toLowerCase())<0; }); return p.slice(0,2).join(" "); };
var corVagas = function(v, cap){ return v<=0 ? "text-[#f87171]" : v/cap<0.2 ? "text-[#f87171]" : v/cap<0.45 ? "text-[#fbbf24]" : "text-[#4ade80]"; };
var textoVagas = function(v){ return v<=0 ? "lotado" : v+(v===1 ? " vaga" : " vagas"); };

// semanas (segunda a domingo) que cobrem o mês; dia fora do mês = null
function semanasDoMesAgenda(ano, mes){
  var p = segundaDe(new Date(ano, mes, 1)), fim = new Date(ano, mes+1, 0), out = [];
  while(p<=fim){ var dias = []; for(var i=0;i<7;i++){ var d = new Date(p.getFullYear(), p.getMonth(), p.getDate()+i); dias.push(d.getMonth()===mes ? d : null); } out.push(dias); p = new Date(p.getFullYear(), p.getMonth(), p.getDate()+7); }
  return out;
}

// Calendário do topo (modelo 1): dia da semana, número, vagas e contagem; domingo fechado
function CalendarioTopo(p){
  var ano = p.mes[0], mes = p.mes[1], sem = semanasDoMesAgenda(ano, mes), lista = p.lista, hoje = p.hojeIso;
  return e("div",{className:"flex flex-col rounded-xl border bg-[#131315] px-2 pb-2 pt-1.5 "+BORDA, style:{height:"100%"}},
    e("div",{className:"mb-1 flex items-center justify-between"},
      e("button",{type:"button", "aria-label":"Mês anterior", onClick:function(){ var t = new Date(ano, mes-1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-[26px] rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]"}, "◀"),
      e("b",{className:"text-[13.5px]"}, MESES[mes]+" de "+ano),
      e("button",{type:"button", "aria-label":"Próximo mês", onClick:function(){ var t = new Date(ano, mes+1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-[26px] rounded-md border border-border bg-[#1d1d21] px-2.5 text-[13px]"}, "▶")),
    e("div",{className:"grid min-h-0 flex-1 grid-cols-7 gap-[3px]", style:{gridAutoRows:"minmax(0,1fr)"}},
      [].concat.apply([], sem).map(function(d, i){
        if(!d) return e("div",{key:i});
        var iso = isoDe(d), w = d.getDay(), cap = capacidadeDia(iso), n = marcadasDoDia(lista, iso).length, v = cap-n, sel = iso===p.dia, hj = iso===hoje;
        if(w!==0 && feriadoDe(iso)) return e("div",{key:i, title:"Feriado: "+feriadoDe(iso)+" (sem atendimento)", className:"flex flex-col justify-center gap-px rounded-md border border-dashed border-border bg-card/40 px-1.5"}, e("span",{className:"text-[11px] font-bold text-foreground"}, "Feriado"), e("span",{className:"text-[13px] font-bold text-foreground"}, d.getDate()), e("span",{className:"text-[11px] text-foreground"}, "sem atend."));
        if(w===0) return e("div",{key:i, className:"flex flex-col justify-center gap-px rounded-[7px] border border-dashed border-[#2c2c32] bg-[#0f0f11] px-1.5", title:"Domingo: sem atendimento"},
          e("span",{className:"text-[10.5px] font-bold"},"Domingo"), e("span",{className:"text-[15px] font-extrabold leading-none"}, d.getDate()), e("span",{className:"text-[10px] font-semibold"},"sem atend."));
        return e("button",{key:i, type:"button", onClick:function(){ p.setDia(iso); }, title:NDIA[w]+" "+fmtDataBR(iso)+" · "+n+" de "+cap+" marcadas",
          className:"flex flex-col justify-center rounded-[7px] border bg-[#18181b] px-1.5 text-left hover:border-[rgba(232,184,75,.55)] hover:bg-[#1c1c20] "+(sel ? "border-transparent ring-2 ring-[#E8B84B]" : "border-[#2c2c32]")},
          e("span",{className:"flex w-full items-baseline justify-between"}, e("span",{className:"text-[10.5px] font-bold"}, NDIA[w]), e("span",{className:"text-[16px] font-extrabold leading-none "+(hj ? "text-[#E8B84B]" : "")}, d.getDate())),
          e("span",{className:"mt-0.5 flex w-full items-baseline justify-between text-[11px] font-bold"}, e("span",{className:corVagas(v, cap)}, textoVagas(v)), e("span",{className:"text-[10.5px] font-semibold"}, n+"/"+cap)));
      })));
}

// Horários do dia escolhido: até 3 por horário; "+ livre" abre a escolha da revendedora
function HorariosDoDia(p){
  var iso = p.dia, lista = p.lista, w = diaDaSemana(iso), cap = capacidadeDia(iso), marc = marcadasDoDia(lista, iso), v = cap-marc.length;
  var es = useState(null), escolhendo = es[0], setEscolhendo = es[1], bq = useState(""), busca = bq[0], setBusca = bq[1];
  useEffect(function(){ setEscolhendo(null); setBusca(""); }, [iso]);
  var cab = e("div",{className:"mb-1 flex flex-wrap items-center gap-3"},
    e("b",{className:"text-[13.5px]"}, fmtDataBR(iso)+" · "+NDIA[w].toLowerCase()),
    cap>0 && e("span",{className:"inline-flex items-center gap-1.5"}, e("span",null, marc.length+" de "+cap+" marcadas"), e("i",{className:"block h-2 w-[90px] overflow-hidden rounded bg-[#2a2a30]"}, e("u",{className:"block h-2", style:{width:Math.round(marc.length/cap*100)+"%", background:BARRA_OURO.background}}))),
    cap>0 && e("span",{className:corVagas(v, cap)}, v<=0 ? "Dia lotado" : v+" vagas no dia"));
  if(w!==0 && feriadoDe(iso)) return e("div",null, cab, e("div",{className:"rounded-md border border-warning/40 bg-warning/10 px-2 py-1 text-[13px] text-foreground"}, "Feriado ("+feriadoDe(iso)+"): sem atendimento. Não é possível marcar."));
  if(w===0) return e("div",null, cab, e("div",{className:"rounded-md border border-[rgba(251,191,36,.45)] bg-[rgba(251,191,36,.12)] px-2 py-1 text-[12px]"},"Domingo: sem atendimento. Não é possível marcar."));
  var horas = horasDoDia(iso);
  var candidatas = escolhendo ? lista.filter(function(r){ return !r.agend && (!busca || r.nome.toLowerCase().indexOf(busca.toLowerCase())>=0); }).sort(function(a,b){ return proximoAcerto(a).localeCompare(proximoAcerto(b)); }).slice(0,7) : [];
  return e("div",{className:"flex h-full flex-col"}, cab,
    w===6 && e("div",{className:"mb-1 rounded-md border border-[rgba(251,191,36,.45)] bg-[rgba(251,191,36,.12)] px-2 py-0.5 text-[13px]"},"Sábado: só marca até as 11h (das 08:00 às 10:30)."),
    e("div",{className:"min-h-0 flex-1 overflow-y-auto"}, horas.map(function(h, i){
      var no = marc.filter(function(x){ return x.hora===h; }), fim = HORAS_AGENDA[HORAS_AGENDA.indexOf(h)+1] || "18:00", cheio = no.length>=CAP_HORA, motivo = motivoNaoMarcar(lista, iso, h, null);
      return e(React.Fragment,{key:h},
        e("div",{className:"grid grid-cols-[150px_repeat(3,minmax(0,1fr))] items-center gap-1 border-t "+BORDA+" py-px", style:{minHeight:24}},
          e("b",{className:"whitespace-nowrap text-[13px]"}, h+"–"+fim+" ", e("small",{className:"text-[11px] "+(cheio ? "text-[#f87171]" : no.length ? "text-[#fbbf24]" : "text-[#4ade80]")}, no.length+"/"+CAP_HORA)),
          [0,1,2].map(function(j){ var x = no[j];
            if(x) return e("button",{key:j, type:"button", onClick:function(){ p.abrir(x.r.id); }, title:x.r.nome, className:"flex h-[21px] items-center justify-center truncate rounded-[5px] px-1.5 text-[11.5px] font-semibold", style:BARRA_OURO}, curto(x.r.nome));
            if(motivo) return e("div",{key:j, title:motivo, className:"flex h-[21px] items-center justify-center rounded-[5px] border border-dashed border-[#3b3b42] bg-[#1b1b1f] text-[11.5px] opacity-50"}, v<=0 ? "dia lotado" : "—");
            return e("button",{key:j, type:"button", onClick:function(){ setEscolhendo(escolhendo===h ? null : h); setBusca(""); }, className:"flex h-[21px] items-center justify-center rounded-[5px] border border-dashed border-[rgba(74,222,128,.6)] bg-[rgba(74,222,128,.10)] text-[11.5px] text-[#bbf7d0] hover:bg-[rgba(74,222,128,.22)]"}, "+ livre"); })),
        escolhendo===h && e("div",{className:"my-1 flex flex-col gap-1 rounded-lg border bg-[#1b1b1f] p-2 "+BORDA},
          e("div",{className:"flex items-center gap-2"}, e("span",{className:"text-[12px] font-semibold"},"Marcar às "+h.slice(0,2)+"h: escolha a revendedora"), e("span",{className:"flex-1"}), e("button",{type:"button", onClick:function(){ setEscolhendo(null); }, className:"text-[12px]"},"Fechar ✕")),
          e("input",{autoFocus:true, value:busca, placeholder:"Digite o nome para filtrar", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ setBusca(ev.target.value); }}),
          candidatas.length===0 ? e("span",{className:"text-[12px]"},"Nenhuma revendedora sem data marcada com esse nome.")
          : candidatas.map(function(r){ var prev = proximoAcerto(r), dd = diasEntre(p.hojeIso, prev);
              return e("button",{key:r.id, type:"button", onClick:function(){ p.dispatch({type:"REVINT_AGENDAR", id:r.id, data:iso, hora:h}); setEscolhendo(null); }, className:"flex items-center justify-between gap-2 rounded-md bg-[#25252b] px-2 py-1 text-left text-[12.5px] hover:bg-[#2c2c33]"},
                e("b",{className:"truncate"}, r.nome), e("span",{className:"shrink-0 "+(dd<0 ? "text-[#f87171]" : "")}, "acerto previsto "+fmtDataBR(prev)+(dd<0 ? " · "+Math.abs(dd)+" d atrasada" : ""))); })));
    })));
}

// Calendário inteiro (botão Calendário): mês com a listagem dentro de cada dia
function CalendarioGrande(p){
  var ano = p.mes[0], mes = p.mes[1], sem = semanasDoMesAgenda(ano, mes), lista = p.lista, hoje = p.hojeIso;
  return e("div",{className:"overflow-hidden rounded-xl border bg-[#111113] "+BORDA},
    e("div",{className:"flex flex-wrap items-center gap-2 border-b px-3 py-2 "+BORDA},
      e("button",{type:"button", onClick:function(){ var t = new Date(ano, mes-1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-8 rounded-lg border border-border bg-[#1d1d21] px-3 text-[13px]"}, "◀ Mês anterior"),
      e("h3",{className:"min-w-[170px] text-center text-[15px] font-bold"}, MESES[mes]+" de "+ano),
      e("button",{type:"button", onClick:function(){ var t = new Date(ano, mes+1, 1); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-8 rounded-lg border border-border bg-[#1d1d21] px-3 text-[13px]"}, "Próximo mês ▶"),
      e("button",{type:"button", onClick:function(){ var t = parteData(hoje); p.setMes([t.getFullYear(), t.getMonth()]); }, className:"h-8 rounded-lg border border-border bg-[#1d1d21] px-3 text-[13px]"}, "Hoje"),
      e("span",{className:"flex-1"}), e("span",{className:"text-[12.5px]"},"Clique no dia para abrir os horários. Domingo não marca. Sábado só até 11h.")),
    e("div",{className:"grid grid-cols-7 gap-[5px] p-2.5"}, [].concat.apply([], sem).map(function(d, i){
      if(!d) return e("div",{key:i});
      var iso = isoDe(d), w = d.getDay();
      if(w!==0 && feriadoDe(iso)) return e("div",{key:i, title:"Feriado: "+feriadoDe(iso), className:"flex min-h-[118px] flex-col rounded-lg border border-dashed border-border bg-card/40 p-1.5"}, e("div",{className:"flex items-baseline justify-between"}, e("b",{className:"text-[13px]"}, d.getDate()), e("span",{className:"text-[11px] font-bold text-foreground"}, "Feriado")), e("span",{className:"mt-auto text-center text-[11px] font-bold text-foreground"}, feriadoDe(iso)));
      if(w===0) return e("div",{key:i, className:"flex min-h-[118px] flex-col rounded-[10px] border border-dashed border-[#2c2c32] bg-[#0e0e10] p-1.5 opacity-80"},
        e("div",{className:"flex items-baseline justify-between"}, e("b",{className:"text-[15px]"}, d.getDate()), e("span",{className:"text-[10.5px] font-bold"},"Domingo")), e("span",{className:"mt-auto text-center text-[11.5px] font-bold"},"sem atendimento"));
      var marc = marcadasDoDia(lista, iso).sort(function(a,b){ return a.hora.localeCompare(b.hora); }), cap = capacidadeDia(iso), v = cap-marc.length;
      return e("div",{key:i, onClick:function(){ p.irParaDia(iso); }, className:"flex min-h-[118px] min-w-0 cursor-pointer flex-col gap-[3px] rounded-[10px] border bg-[#141416] p-1.5 hover:bg-[#1a1a1e] "+(iso===hoje ? "border-[#E8B84B]" : "border-[rgba(232,184,75,.2)]")},
        e("div",{className:"flex items-baseline justify-between"}, e("span",null, e("b",{className:"text-[15px] "+(iso===hoje ? "text-[#E8B84B]" : "")}, d.getDate()), " ", e("span",{className:"text-[10.5px] font-bold"}, NDIA[w])), e("span",{className:"text-[11px] font-bold "+corVagas(v, cap)}, marc.length+"/"+cap)),
        marc.slice(0,5).map(function(x){ return e("button",{key:x.r.id, type:"button", onClick:function(ev){ ev.stopPropagation(); p.abrir(x.r.id); }, title:x.r.nome, className:"grid h-[21px] grid-cols-[32px_1fr] items-center rounded-[5px] border bg-[#25252b] text-[11.5px] "+BORDA},
          e("i",{className:"text-center font-bold not-italic text-[#E8B84B]"}, x.hora.slice(0,2)+"h"), e("span",{className:"truncate pr-8 text-center"}, curto(x.r.nome))); }),
        marc.length>5 && e("div",{className:"text-center text-[11.5px] font-bold"},"+"+(marc.length-5)+" marcadas"),
        e("div",{className:"mt-auto text-center text-[11.5px] font-bold "+corVagas(v, cap)}, (v<=0 ? "Dia lotado" : v+" vagas")+(w===6 ? " · até 11h" : "")));
    })));
}

// Tabela: tudo centralizado, barra de degradê com linhas de corte, coluna Qtd., filtro ao clicar no título da coluna
var kitDe = function(r){ var c = (r.conds||[]).filter(function(x){ return x.t!=="Expositor"; }).sort(function(a,b){ return (a.e||"").localeCompare(b.e||""); }); var kp = c.find(function(x){ return x.t==="Kit principal"; }) || c[0]; return kp && kp.e ? kp.e : ""; };
var qtdCond = function(r){ return (r.conds||[]).filter(function(x){ return x.t!=="Expositor"; }).length; };
var ultimoDe = function(r){ var c = (r.registro||[])[0]; if(!c) return ""; var t = tipoReg(c.tipo||"outro").t.replace(" para acerto","").replace(" (sem data)","").replace(" (funcionária, Veneziana…)","").replace("Representante pediu o kit","Rep. pediu o kit"); return (c.data ? fmtDataBR(c.data).slice(0,5)+" · " : "")+(c.quem||c.autor||"—")+" · "+t; };
var COLUNAS = [
  {k:"qtd", t:"Qtd.", tipo:"seq", v:qtdCond}, {k:"nome", t:"Nome", tipo:"txt", v:function(r){ return r.nome; }}, {k:"zap", t:"WhatsApp", tipo:"txt", v:function(r){ return foneBonito(r); }}, {k:"cod", t:"Cód.", tipo:"txt", v:function(r){ var c = String(r.devmaster||"").replace(/\D/g,""); return c ? c.padStart(6,"0") : ""; }},
  {k:"kit", t:"Data do kit", tipo:"data", v:kitDe}, {k:"prev", t:"Acerto previsto", tipo:"data", v:proximoAcerto}, {k:"falt", t:"Faltam", tipo:"falt", v:function(r, h){ return diasEntre(h, proximoAcerto(r)); }},
  {k:"ag", t:"Data agendada", tipo:"data", v:function(r){ return r.agend ? r.agend.data : ""; }}, {k:"hora", t:"Hora", tipo:"txt", v:function(r){ return r.agend ? r.agend.hora : ""; }},
  {k:"sit", t:"Situação", tipo:"sit", v:function(r){ return r.situacao; }}, {k:"ult", t:"Último contato", tipo:"txt", v:ultimoDe}, {k:"ciclo", t:"Ciclo", tipo:"ciclo", v:function(r){ return r.ciclo; }}];
var dBR = function(iso){ return iso ? fmtDataBR(iso).slice(0,5) : "—"; };

function TabelaAgenda(p){
  var lista = p.lista, hoje = p.hojeIso, s = p.s, ref = React.useRef(null), pr = React.useRef(null);
  var fs = useState({}), fil = fs[0], setFil = fs[1], pp = useState(null), pop = pp[0], setPop = pp[1];
  var passa = function(r){ var ok = true;
    COLUNAS.forEach(function(c){ var f = fil[c.k]; if(!f || !ok) return; var x = c.v(r, hoje);
      if(c.tipo==="txt"){ if(f.q && String(x).toLowerCase().indexOf(f.q.toLowerCase())<0) ok = false; }
      else if(c.tipo==="num"){ if(f.q!=="" && f.q!=null && !(Number(x)>=Number(f.q))) ok = false; }
      else if(c.tipo==="data"){ if(f.a && !f.b && x!==f.a) ok = false; else if(f.a && f.b && !(x>=f.a && x<=f.b)) ok = false; else if(!f.a && f.b && !(x && x<=f.b)) ok = false; }
      else if(c.tipo==="falt"){ if(f.q==="atr" && !(x<0)) ok = false; if(f.q==="7" && !(x>=0 && x<=7)) ok = false; if(f.q==="fut" && !(x>7)) ok = false; }
      else if(f.q && String(x)!==String(f.q)) ok = false; });
    return ok; };
  var ativo = function(c){ var f = fil[c.k]; return !!f && !!(f.q || f.a || f.b); };
  var algum = COLUNAS.some(ativo);
  var linhas = lista.filter(passa).sort(function(a,b){ return proximoAcerto(a).localeCompare(proximoAcerto(b)); });
  var troca = function(col, parte, valor){ var n = Object.assign({}, fil), f = Object.assign({}, n[col]); f[parte] = valor; n[col] = f; setFil(n); };
  useEffect(function(){
    if(!pop) return undefined;
    var fora = function(ev){ if(pr.current && pr.current.contains(ev.target)) return; if(ev.target.closest && ev.target.closest("th[data-col]")) return; setPop(null); };
    var esc = function(ev){ if(ev.key==="Escape") setPop(null); };
    document.addEventListener("mousedown", fora); document.addEventListener("keydown", esc);
    return function(){ document.removeEventListener("mousedown", fora); document.removeEventListener("keydown", esc); };
  }, [pop]);
  var abrirPop = function(c, ev){ if(pop && pop.col===c.k){ setPop(null); return; } var t = ev.currentTarget.getBoundingClientRect(), w = ref.current.getBoundingClientRect(); setPop({col:c.k, top:t.bottom-w.top+4, left:Math.max(0, Math.min(t.left-w.left, w.width-250))}); };
  var cPop = pop ? COLUNAS.find(function(c){ return c.k===pop.col; }) : null, fPop = cPop ? (fil[cPop.k]||{}) : {};
  var rot = "flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.05em]";
  var popCorpo = !cPop ? null : cPop.tipo==="txt" ? e("label",{className:rot}, cPop.t+" contém", e("input",{autoFocus:true, value:fPop.q||"", placeholder:"Digite para filtrar", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}))
    : cPop.tipo==="num" ? e("label",{className:rot}, cPop.t+" a partir de", e("input",{autoFocus:true, type:"number", min:0, value:fPop.q||"", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}))
    : cPop.tipo==="data" ? e(React.Fragment,null, e("label",{className:rot},"Data (ou de)", e("input",{autoFocus:true, type:"date", value:fPop.a||"", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "a", ev.target.value); }})),
        e("label",{className:rot},"até", e("input",{type:"date", value:fPop.b||"", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "b", ev.target.value); }})),
        e("span",{className:"text-[11.5px]"},"Só a primeira: aquele dia. As duas: de … até …. Só a segunda: até aquele dia."))
    : cPop.tipo==="falt" ? e("label",{className:rot},"Faltam", e("select",{value:fPop.q||"", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}, e("option",{value:""},"Todas"), e("option",{value:"atr"},"Atrasadas"), e("option",{value:"7"},"Próximos 7 dias"), e("option",{value:"fut"},"Depois de 7 dias")))
    : cPop.tipo==="sit" ? e("label",{className:rot},"Situação", e("select",{value:fPop.q||"", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}, e("option",{value:""},"Todas"), SITUACOES.map(function(x){ return e("option",{key:x.k, value:x.k}, x.t); })))
    : e("label",{className:rot},"Ciclo", e("select",{value:fPop.q||"", className:INPUT+" h-8! w-full text-[13px]!", onChange:function(ev){ troca(cPop.k, "q", ev.target.value); }}, e("option",{value:""},"Todos"), CICLOS.map(function(n){ return e("option",{key:n, value:n}, n+" d"); })));
  var cel = "whitespace-nowrap border-b border-r px-2 text-center tabular-nums "+BORDA+" last:border-r-0";
  return e("div",{ref:ref, className:"relative"},
    algum && e("button",{type:"button", onClick:function(){ setFil({}); setPop(null); }, className:"absolute right-2 top-[-24px] text-[12px] text-[#E8B84B]"}, "Limpar todos os filtros"),
    e("div",{className:"overflow-x-auto"},
      e("table",{className:"w-full min-w-max border-separate border-spacing-0 border text-[12px] "+BORDA},
        e("thead",null, e("tr",{style:BARRA_OURO}, COLUNAS.map(function(c){ return e("th",{key:c.k, "data-col":c.k, title:c.tipo==="seq" ? "Número da linha" : "Clique para filtrar", onClick:c.tipo==="seq" ? null : function(ev){ abrirPop(c, ev); }, className:(c.tipo==="seq" ? "" : "cursor-pointer ")+"h-8 select-none whitespace-nowrap border-r border-[rgba(0,0,0,.42)] px-2 text-center text-[11px] font-extrabold uppercase tracking-[.06em] last:border-r-0 hover:bg-white/15 "+(ativo(c) ? "underline decoration-2 underline-offset-4" : "")}, c.t); }))),
        e("tbody",null, linhas.length===0 ? e("tr",null, e("td",{colSpan:COLUNAS.length, className:"p-4 text-center"}, lista.length===0 ? "Nenhuma revendedora ainda. Clique em Buscar da DevMaster." : "Nenhuma revendedora com esses filtros."))
          : linhas.map(function(r, i){
              var prox = proximoAcerto(r), dd = diasEntre(hoje, prox), sit = SITUACOES.find(function(x){ return x.k===r.situacao; }) || SITUACOES[0], at = dd<0 && !r.agend;
              return e("tr",{key:r.id, onClick:function(){ p.abrir(r.id); }, className:"h-8 cursor-pointer hover:bg-[rgba(232,184,75,.12)] "+(i%2 ? "bg-white/[.025]" : "")},
                e("td",{className:cel, style:at ? {boxShadow:"inset 3px 0 #f87171"} : null}, i+1), e("td",{className:cel+" font-semibold"}, r.nome, r.kitNovo && e("span",{className:"ml-2 rounded-full bg-[rgba(232,184,75,.2)] px-2 text-[10.5px] font-bold text-[#E8B84B] ring-1 ring-[rgba(232,184,75,.5)]", title:"Kit novo direcionado pela Michele em "+fmtDataBR(r.kitNovo.desde)+": entrar em contato e agendar"}, "Kit novo")), e("td",{className:cel}, e("span",{className:"inline-flex items-center justify-center gap-1.5"}, foneBonito(r) || "—", BotaoZap(r))), e("td",{className:cel}, COLUNAS[3].v(r)||"—"),
                e("td",{className:cel}, dBR(kitDe(r))), e("td",{className:cel}, dBR(prox)),
                e("td",{className:cel+" "+(dd<0 ? "text-[#f87171]" : "")}, dd<0 ? Math.abs(dd)+" d atrasada" : dd===0 ? "hoje" : dd+" d"),
                e("td",{className:cel+" "+(r.agend ? "text-[#E8B84B]" : "text-[#fbbf24]")}, r.agend ? dBR(r.agend.data) : "Aguardando"), e("td",{className:cel}, r.agend ? r.agend.hora : "—"),
                e("td",{className:cel}, chip(sit.t, sit.cor)), e("td",{className:cel}, ultimoDe(r) || "—"), e("td",{className:cel}, r.ciclo+" d")); })))),
    pop && cPop && e("div",{ref:pr, className:"absolute z-20 flex min-w-[220px] flex-col gap-1.5 rounded-xl border bg-[#1b1b1f] p-2.5 shadow-2xl "+BORDA, style:{top:pop.top, left:pop.left}},
      popCorpo, e("button",{type:"button", onClick:function(){ var n = Object.assign({}, fil); delete n[cPop.k]; setFil(n); setPop(null); }, className:"self-start text-[12px] text-[#E8B84B]"}, "Limpar este filtro")));
}

// Busca na DevMaster (servidor) as revendedoras do vendedor Sorelly e entrega à lista (REVINT_ADD_LOTE). Usada por esta tela e pela aba Listagens.
function sincronizarDm(dispatch, auto){
  return chamar("GET", "/revendedoras?rep=02"+(auto ? "" : "&atualizar=1")).then(function(r){
    var itens = (r.itens||[]).map(function(i){ var kp = (i.conds||[]).filter(function(c){ return (r.vendedores||["02"]).indexOf(c.vd)>=0 && c.d; }).sort(function(a,b){ return (a.e||"").localeCompare(b.e||""); })[0];   // o condicional aberto do vendedor 02 (o mais antigo) dá a previsão e o plano
      return {cod:i.cod, nome:i.nome, celular:i.celular, cidade:i.cidade, vendas:i.vendas||[], prevDevol:kp && kp.d || "", emissao:kp && kp.e || "", obs:(i.conds||[]).map(function(c){ return c.ob; }).filter(Boolean),
        conds:(i.conds||[]).map(function(c){ return {n:c.n, t:c.t, e:c.e, d:c.d, p:c.p, v:c.v, vd:c.vd}; })}; });
    dispatch({type:"REVINT_ADD_LOTE", itens:itens}); return {itens:itens, brinde:r.brinde};
  });
}

// KITS NOVOS PARA AGENDAR (Marcus aprovou o desenho em 03/11/2026): lista no alto da tela com os kits que o setor Kits novos (Michele) mandou para a Sorelly e ainda não têm dia marcado.
// Cada kit entra sozinho (bridge-montagem.js › direcionarParaSorelly marca kitNovo na revendedora); a Tamara escolhe dia e hora e a revendedora entra na listagem do dia como Kit novo.
// Para ver o desenho sem kit real: abrir a tela com ?exemplo=kits (3 linhas de exemplo, sem gravar nada).
// etiqueta no canto de cima de cada tabela (Marcus, 03/11/2026): "Kits novos · 3 para agendar" e "Revendedoras internas · 210 total"
function Etiqueta(p){ return e("div",{className:"flex flex-wrap items-end gap-2"}, e("span",{className:"inline-flex h-8 items-center gap-2 rounded-t-lg px-3 text-[13px] font-semibold", style:BARRA_OURO}, e("b",null, p.nome), e("span",null, "· "+p.info)), p.extra && e("span",{className:"pb-1 text-[13px]"}, p.extra)); }
var exemploKitsAtivo = function(){ return typeof window!=="undefined" && /[?&]exemplo=kits/.test(window.location.search); };
function kitsExemplo(){
  var h = {data:null, venda:null, acerto:null};
  return [["EX1", "Camili Exemplo da Silva", "Curitiba", false, 7000, 1], ["EX2", "Gabriela Exemplo Alves", "São José dos Pinhais", false, 5000, 2], ["EX3", "Ingrid Exemplo Moura", "Curitiba", true, 7000, 0]].map(function(x){
    return {id:x[0], nome:x[1], cidade:x[2], prata:x[3], exemplo:true, ciclo:30, proximoManual:null, proximoDm:null, situacao:"contatar", agend:null, internoId:null, hist:[h, h, h], contatos:[{nome:"WhatsApp da revendedora", fone:"(41) 90000-0000"}], devmaster:"", obs:"", registro:[], conds:[], kitNovo:{id:x[0], valor:x[4], desde:isoDia(new Date(Date.now()-x[5]*86400000))}};
  });
}
function KitsNovosParaAgendar(p){
  var ex = exemploKitsAtivo();
  var reais = p.lista.filter(function(r){ return r.kitNovo && !r.agend; }).sort(function(a, b){ return String(a.kitNovo.desde || "").localeCompare(String(b.kitNovo.desde || "")); });
  var lista = reais.length ? reais : ex ? kitsExemplo() : [];
  var quando = function(r){ var n = Math.max(0, diasEntre(r.kitNovo.desde || p.hojeIso, p.hojeIso)); return n===0 ? "hoje" : "há "+n+(n===1 ? " dia" : " dias"); };
  var linhas = lista.map(function(r, k){ return Object.assign({}, r, {n:k+1}); });
  var colunas = [
    {k:"n", t:"Nº", tipo:"num", semFiltro:true, v:function(r){ return r.n; }},
    {k:"nome", t:"Revendedora", forte:true, v:function(r){ return r.nome; }},
    {k:"cid", t:"Cidade", v:function(r){ return r.cidade || "—"; }},
    {k:"kit", t:"Kit", v:function(r){ return (r.prata ? "Prata " : "Normal ")+BK(r.kitNovo.valor); }},
    {k:"cheg", t:"Chegou", v:function(r){ return quando(r); }},
    {k:"ag", t:"", semFiltro:true, v:function(){ return ""; }, exib:function(){ return "Agendar"; }, cel:function(r){ return e("button",{type:"button", title:"Abrir a ficha da revendedora para agendar", onClick:function(){ p.abrir(r.id); }, className:"h-6 rounded-md px-2 text-[13px] font-bold", style:BTN_OURO2}, "Agendar"); }}   // padrao-ok: botão menor, pedido do Marcus (03/11/2026)
  ];
  return e("div",{className:"flex flex-col"},
    e(Etiqueta,{nome:"Kits novos", info:lista.length+" para agendar", extra:"Vêm direto do setor Kits novos"+(ex && !reais.length ? " · EXEMPLO, nada é gravado" : "")}),
    lista.length===0 ? null : e(GradeFiltro,{chave:"kitsnovos", rows:linhas, cols:colunas, vazio:"Nenhum kit novo para agendar. Quando a Michele mandar um kit para a Sorelly, ele aparece aqui."}));
}

// INCLUIR CLIENTE (Tamara, 03 e 09/11/2026): quem vem à Sorelly sem condicional aberta na DevMaster (kit retornando, kit novo, brinde de indicação) não aparece na lista.
// O NOME vem sempre de uma busca nas clientes cadastradas (DevMaster, rota /api/clientes-busca): aparece nome, código, cidade e situação, e a Tamara escolhe uma. Nada de nome digitado à mão (Marcus, 09/11/2026).
// Única exceção: Brinde de indicação, que pode ser de pessoa sem cadastro; ali aparece a opção "Usar o nome digitado". Escolhida a cliente, tipo, dia e hora, ela entra já agendada na listagem do dia, sem condicional inventada.
var TIPOS_AVULSA = [["kit_novo", "Kit novo"], ["indicacao", "Brinde de indicação"], ["retornando", "Kit retornando"], ["reposicao", "Reposição"], ["troca", "Troca de peça"], ["acerto", "Acerto"]];
var horaDeAgora = function(){ var n = new Date(); return String(n.getHours()).padStart(2, "0")+":"+String(n.getMinutes()).padStart(2, "0"); };
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var semZeros = function(c){ return String(c||"").replace(/\D/g, "").replace(/^0+/, ""); };
function JanelaIncluirCliente(p){
  var fs = useState({tipo:p.imediato ? "acerto" : "kit_novo", data:p.hojeIso, hora:p.imediato ? horaDeAgora() : "", quer:"", valor:0, fone:""}), form = fs[0], setForm = fs[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1], ss = useState(null), sel = ss[0], setSel = ss[1];
  var rs = useState({itens:[], buscando:false, aviso:""}), res = rs[0], setRes = rs[1], cont = React.useRef(0);
  var set = function(k, v){ var n = Object.assign({}, form); n[k] = v; if(k==="data") n.hora = ""; if(k==="tipo" && v!=="indicacao" && sel && sel.semCadastro){ setSel(null); } setForm(n); };
  var escolher = function(c){ setSel(c); setBusca(""); setRes({itens:[], buscando:false, aviso:""}); if(c.celular) setForm(Object.assign({}, form, {fone:c.celular})); };
  // busca com espera de meio segundo depois da última letra; resposta antiga é jogada fora
  useEffect(function(){
    var q = busca.trim(), num = /^\d+$/.test(q);
    if(sel || (!num && q.length<3)){ setRes({itens:[], buscando:false, aviso:""}); return undefined; }
    var minha = ++cont.current;
    var t = setTimeout(function(){
      if(!apiAtiva()){   // sem servidor: só as clientes que já estão na lista do sistema
        var l = p.lista.filter(function(r){ return num ? semZeros(r.devmaster)===semZeros(q) : semAcento(r.nome).indexOf(semAcento(q))>=0; }).slice(0, 15).map(function(r){ return {cod:r.devmaster||"", nome:r.nome, cidade:r.cidade||"", celular:((r.contatos||[])[0]||{}).fone||"", situacao:"Na lista"}; });
        setRes({itens:l, buscando:false, aviso:"Servidor desligado: mostrando só as clientes que já estão na lista."}); return; }
      setRes({itens:[], buscando:true, aviso:""});
      chamar("GET", "/clientes-busca?q="+encodeURIComponent(q)).then(function(r){ if(minha===cont.current) setRes({itens:r.itens||[], buscando:false, aviso:""}); })
        .catch(function(x){ if(minha===cont.current) setRes({itens:[], buscando:false, aviso:x.message || "Não consegui buscar."}); });
    }, 450);
    return function(){ clearTimeout(t); };
  }, [busca, sel]);
  var naListaDe = function(c){ var cod = semZeros(c.cod); return p.lista.find(function(r){ return (cod && semZeros(r.devmaster)===cod) || (!cod && semAcento(r.nome)===semAcento(c.nome)); }); };
  var jaNaLista = sel ? naListaDe(sel) : null;
  var horas = form.data ? horasDoDia(form.data) : [];
  var motivo = form.data && form.hora ? motivoNaoMarcar(p.lista, form.data, form.hora, null) : (form.data && horas.length===0 ? motivoNaoMarcar(p.lista, form.data, "08:00", null) : "");
  var pronto = p.imediato ? !!sel : (!!sel && !jaNaLista && !!form.data && !!form.hora && !motivo);   // imediato = quem chegou agora (Listagem): sem dia, hora nem limite de vagas
  var campo = function(rot, el){ return e("label",{className:"flex min-w-0 flex-col gap-1"}, e("span",{className:ROTULO}, rot), el); };
  var q0 = busca.trim(), mostraLista = !sel && (/^\d+$/.test(q0) || q0.length>=3);
  return e("div",{className:"fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:"relative my-auto flex w-full max-w-[640px] flex-col gap-3 rounded-xl border bg-[#131315] p-4 "+BORDA},
      e("div",{className:"flex items-center justify-between"}, e("b",{className:"text-[13px]"}, p.imediato ? "Incluir cliente que chegou agora" : "Incluir cliente na listagem"), e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"h-8 rounded-lg px-2.5 text-[13px] font-semibold ring-1 ring-[rgba(241,213,138,.3)] hover:bg-white/10"}, "Fechar ✕")),
      e("p",{className:"text-[13px]"}, p.imediato ? "Para quem chegou e não está na listagem de hoje (inclusive funcionária). Entra agora, com a hora de agora. Escolha a cliente entre as cadastradas." : "Para quem vem à Sorelly e não está na lista: kit retornando, kit novo ou brinde de indicação. Escolha a cliente entre as cadastradas."),
      sel
        ? campo("Cliente", e("div",{className:"flex min-h-8 flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-1 "+BORDA},
            e("span",{className:"text-[13px]"}, e("b",null, sel.nome), sel.cod ? e("span",{className:MONO+" ml-2 font-bold text-[#E8B84B]"}, "Cód. "+sel.cod) : e("span",{className:"ml-2 font-bold text-[#E8B84B]"}, "Sem cadastro"), sel.cidade ? e("span",{className:"ml-2"}, sel.cidade+(sel.uf ? "/"+sel.uf : "")) : null),
            e("button",{type:"button", onClick:function(){ setSel(null); }, className:"h-8 rounded-md px-2.5 text-[13px] font-bold text-[#E8B84B] hover:bg-white/10"}, "Trocar")))
        : campo("Cliente (nome ou código)", e("input",{value:busca, autoFocus:true, maxLength:80, placeholder:"Digite o nome (3 letras) ou o código", className:CAMPO, onChange:function(ev){ setBusca(ev.target.value); }})),
      mostraLista && e("div",{className:"flex max-h-[240px] flex-col overflow-y-auto rounded-lg border "+BORDA},
        res.buscando && e("p",{className:"px-2.5 py-2 text-[13px]"}, "Buscando nas clientes cadastradas…"),
        !res.buscando && res.aviso && e("p",{className:"px-2.5 py-2 text-[13px] text-[#fca5a5]"}, res.aviso),
        !res.buscando && res.itens.length===0 && !res.aviso && e("p",{className:"px-2.5 py-2 text-[13px]"}, "Nenhuma cliente cadastrada com esse nome ou código."),
        res.itens.map(function(c){ var nl = naListaDe(c);
          return e("button",{key:c.cod||c.nome, type:"button", onClick:function(){ if(nl && !p.imediato){ p.abrir(nl.id); p.fechar(); } else escolher(c); }, className:"grid min-h-8 grid-cols-[minmax(0,1fr)_70px_150px_90px] items-center gap-2 border-b px-2.5 text-left text-[13px] last:border-b-0 hover:bg-white/10 "+BORDA},
            e("span",{className:"font-semibold"}, c.nome), e("span",{className:MONO+" text-[#E8B84B]"}, c.cod), e("span",null, c.cidade||"—"), e("span",{className:"text-[11px] font-bold "+(c.situacao==="Ativa" ? "text-[#bbf7d0]" : c.situacao==="Na lista" ? "" : "text-[#fca5a5]")}, nl ? "Já na lista" : c.situacao)); }),
        form.tipo==="indicacao" && q0.length>=3 && !/^\d+$/.test(q0) && e("button",{type:"button", onClick:function(){ escolher({cod:"", nome:q0.toUpperCase(), cidade:"", celular:"", semCadastro:true}); }, className:"flex min-h-8 items-center gap-2 px-2.5 text-left text-[13px] font-bold text-[#E8B84B] hover:bg-white/10"}, "Não está cadastrada? Usar “"+q0.toUpperCase()+"” só para retirar o brinde")),
      jaNaLista && !p.imediato && e("div",{className:"flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] text-[#fca5a5] "+BORDA}, e("span",null, "Essa cliente já está na lista. Agende pela ficha dela."), e("button",{type:"button", onClick:function(){ p.abrir(jaNaLista.id); p.fechar(); }, className:"h-8 rounded-md px-2.5 font-bold text-[#E8B84B] hover:bg-white/10"}, "Abrir a ficha")),
      e("div",{className:"grid gap-2 md:grid-cols-2"},
        campo("Tipo", e("select",{value:form.tipo, className:CAMPO, onChange:function(ev){ set("tipo", ev.target.value); }}, TIPOS_AVULSA.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
        campo("Telefone (opcional)", e("input",{value:form.fone, maxLength:20, placeholder:"(41) 90000-0000", className:CAMPO, onChange:function(ev){ set("fone", ev.target.value); }})),
        campo("O que a cliente quer", e("input",{value:form.quer, maxLength:200, placeholder:"Ex.: retirar o brinde", className:CAMPO, onChange:function(ev){ set("quer", ev.target.value); }})),
        campo("Valor liberado (reposição ou kit novo)", e(CampoDinheiro,{value:form.valor, label:"Valor liberado (reposição ou kit novo)", className:CAMPO, onChange:function(v){ set("valor", v); }})),
        !p.imediato && campo("Dia", e("input",{type:"date", value:form.data, className:CAMPO, onChange:function(ev){ set("data", ev.target.value); }})),
        !p.imediato && campo("Hora", e("select",{value:form.hora, className:CAMPO, onChange:function(ev){ set("hora", ev.target.value); }}, e("option",{value:""}, "Escolha"), horas.map(function(h){ return e("option",{key:h, value:h}, h); })))),
      motivo && !p.imediato && e("p",{className:"text-[13px] text-[#fca5a5]"}, motivo),
      e("button",{type:"button", disabled:!pronto, onClick:function(){ if(p.imediato){ var hAgora = horaDeAgora();
          if(jaNaLista) p.dispatch({type:"REVINT_AGENDAR", id:jaNaLista.id, data:p.hojeIso, hora:hAgora, tipo:form.tipo, quer:form.quer, valor:form.valor, imediato:true});   // já é cliente da lista: entra no dia de hoje, agora
          else p.dispatch({type:"REVINT_AVULSA", nome:sel.nome, fone:form.fone, cod:sel.cod, cidade:sel.cidade, tipo:form.tipo, data:p.hojeIso, hora:hAgora, quer:form.quer, valor:form.valor, imediato:true});
          p.fechar(); return; }
        p.dispatch({type:"REVINT_AVULSA", nome:sel.nome, fone:form.fone, cod:sel.cod, cidade:sel.cidade, tipo:form.tipo, data:form.data, hora:form.hora, quer:form.quer, valor:form.valor}); p.irParaDia(form.data); p.fechar(); }, className:"h-8 rounded-lg px-3 text-[13px] font-bold text-[#17110a] disabled:opacity-50", style:BTN_OURO}, "Incluir na listagem")));
}

function AbaRevendedorasInternas(){
  var cx = use(), s = cx.state, hojeIso = isoDia(new Date());
  var iv = useState(false), incluindo = iv[0], setIncluindo = iv[1];
  // DevMaster: busca no servidor as revendedoras do vendedor Sorelly (02, FE e BY) e cadastra aqui as que ainda não existem
  var sdm = useState(""), msgDm = sdm[0], setMsgDm = sdm[1], cdm = useState(false), buscandoDm = cdm[0], setBuscandoDm = cdm[1];
  var buscarDm = function(auto){
    if(!apiAtiva()){ if(auto!==true) setMsgDm("Precisa do servidor ligado (veja com o Leonardo)."); return; }
    setBuscandoDm(true); setMsgDm(auto===true ? "Atualizando da DevMaster…" : "Buscando na DevMaster…");
    sincronizarDm(cx.dispatch, auto===true).then(function(r){ setMsgDm(r.itens.length+" revendedoras do vendedor Sorelly (02)"+(r.brinde && r.brinde.pronto===false ? " · vendas ainda calculando, busque de novo em 1 minuto" : ""));
    }).catch(function(x){ setMsgDm(x.message); }).finally(function(){ setBuscandoDm(false); });
  };
  var todas = s.revInternas || [];
  // atualização automática: ao abrir a tela e a cada 10 minutos; quem virar vendedor Sorelly (02) na DevMaster entra sozinha na lista
  var refDm = React.useRef(null); refDm.current = buscarDm;
  useEffect(function(){ refDm.current(true); var t = setInterval(function(){ refDm.current(true); }, 600000); return function(){ clearInterval(t); }; }, []);
  var vs = useState("lista"), visao = vs[0], setVisao = vs[1];
  var h0 = parteData(hojeIso), ms = useState([h0.getFullYear(), h0.getMonth()]), mes = ms[0], setMes = ms[1], mg = useState([h0.getFullYear(), h0.getMonth()]), mesG = mg[0], setMesG = mg[1];
  var ds = useState(hojeIso), dia = ds[0], setDia = ds[1], ab = useState(null), aberto = ab[0], setAberto = ab[1];
  useEffect(function(){ if(!aberto) return undefined; var f = function(ev){ if(ev.key==="Escape") setAberto(null); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [aberto]);
  var rSel = todas.find(function(r){ return r.id===aberto; }) || (exemploKitsAtivo() ? kitsExemplo().find(function(r){ return r.id===aberto; }) : null);   // o exemplo abre a ficha só para ver; nada é gravado
  var escolherDia = function(iso){ setDia(iso); var t = parteData(iso); setMes([t.getFullYear(), t.getMonth()]); };
  var irParaDia = function(iso){ escolherDia(iso); setVisao("lista"); };
  var segBtn = function(k, t){ var on = visao===k; return e("button",{key:k, type:"button", onClick:function(){ setVisao(k); }, "aria-pressed":on, className:"h-8 px-3.5 text-[13px] font-semibold "+(on ? "" : "hover:bg-white/10"), style:on ? BTN_OURO2 : null}, t); };
  // Lista/Calendário e Buscar da DevMaster ficam no lado esquerdo, em cima do calendário; a coluna dos horários sobe até o alto da tela (Marcus, 03/11/2026)
  var cabecalho = e("div",{className:"flex flex-col gap-2"},
    e(PageHead,{t:"Revendedoras internas", sub:"203 revendedoras do vendedor Sorelly · agenda, registro de contatos e multa de remarcação"}),
    e("div",{className:"flex flex-wrap items-center gap-2"},
        e("div",{className:"inline-flex overflow-hidden rounded-lg border "+BORDA}, segBtn("lista","Lista"), segBtn("calendario","Calendário")),
        e("button",{type:"button", disabled:buscandoDm, onClick:function(){ buscarDm(); }, title:"Busca na DevMaster as revendedoras do vendedor Sorelly (02, FE e BY) e cadastra as que faltam", className:"h-8 rounded-lg px-3.5 text-[13px] font-bold disabled:opacity-50", style:BTN_OURO2}, "↻ Buscar da DevMaster"),
        e("button",{type:"button", onClick:function(){ setIncluindo(true); }, title:"Para quem vem à Sorelly e não está na lista (kit retornando, kit novo, brinde de indicação)", className:"h-8 rounded-lg px-3.5 text-[13px] font-bold", style:BTN_OURO2}, "+ Incluir cliente"),
        msgDm && e("span",{className:"text-[13px]"}, msgDm)));
  return e(React.Fragment,null,
    incluindo && e(JanelaIncluirCliente,{lista:todas, hojeIso:hojeIso, dispatch:cx.dispatch, abrir:setAberto, irParaDia:irParaDia, fechar:function(){ setIncluindo(false); }}),
    visao==="lista"
      ? e("div",{className:"flex flex-col gap-3"},
          e("div",{className:"grid gap-3 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]"},
            e("div",{className:"flex flex-col gap-2"}, cabecalho, e("div",{className:"flex-1", style:{minHeight:ALTURA_AGENDA}}, e(CalendarioTopo,{lista:todas, dia:dia, setDia:escolherDia, mes:mes, setMes:setMes, hojeIso:hojeIso}))),
            e("div",{className:"min-h-[560px] overflow-hidden"}, e(HorariosDoDia,{lista:todas, dia:dia, hojeIso:hojeIso, abrir:setAberto, dispatch:cx.dispatch}))),
          e(KitsNovosParaAgendar,{lista:todas, hojeIso:hojeIso, abrir:setAberto}),
          e("div",{className:"flex flex-col"}, e(Etiqueta,{nome:"Revendedoras internas", info:todas.length+" total"}), e(TabelaAgenda,{lista:todas, hojeIso:hojeIso, s:s, abrir:setAberto})))
      : e(React.Fragment,null, cabecalho, e(CalendarioGrande,{lista:todas, mes:mesG, setMes:setMesG, hojeIso:hojeIso, abrir:setAberto, irParaDia:irParaDia})),
    rSel && e("div",{className:"fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) setAberto(null); }},
      e("div",{className:"relative my-auto w-full max-w-[880px]"},
        e("button",{type:"button", "aria-label":"Fechar", onClick:function(){ setAberto(null); }, className:"absolute right-3 top-2.5 z-10 h-7 rounded-lg bg-black/40 px-2.5 text-[12.5px] font-semibold text-[#fbf4e4] ring-1 ring-[rgba(241,213,138,.3)] hover:bg-black/60"}, "Fechar ✕"),
        e(Detalhes,{key:rSel.id, r:rSel, cx:cx, hojeIso:hojeIso}))));
}

export { AbaRevendedorasInternas, JanelaIncluirCliente, sincronizarDm, BotaoZap, foneBonito, foneDe };
