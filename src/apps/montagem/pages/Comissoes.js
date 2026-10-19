// Sorelly Admin — pages/Comissoes.js
// Kits → Representantes → Comissões. Aqui ficam os VALORES (contas, Point, link…): o setor de agendamento não vê esta tela.
//   Pix representante → Representante → Mês → 3 datas de pagamento (como as listagens: abre a representante, abre o mês, abre a data).
// Cada valor tem um check do financeiro com o nome de quem confirmou; o que o agendamento ainda não conferiu no Consolidado aparece como pendente.
// Em cada data: combustível (km × gasolina do dia, que a Nayale preenche no Configurador), ajuste do fechamento anterior e o pagamento, tudo ali do lado.
import { relatorioTaxas, chaveFech, comisEfetiva, datasDoMes, dataHora, faltaDe, janelaDe, fmtDataBR, grupoDaRep, itensComissao, pagoDe, pctDaRep, quemNome, repsEfetivas, resumoSituacao } from "@/apps/montagem/domain/comissoes";
import { relatorioPix, textoNegociacao } from "@/apps/montagem/domain/pix-direto";
import { podeConfigComissao, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { AbaConfigComissoes } from "@/apps/montagem/pages/ConfigComissoes";
import { AbaRegrasRepresentantes } from "@/apps/montagem/pages/RegrasRepresentantes";
import { BKC as BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { Icon } from "@/apps/montagem/ui/icon";
import { INPUT, MONO, MoneyInput } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var SEL = INPUT+" h-10! cursor-pointer text-sm!";
var th = function(t, r){ return e("th",{className:"whitespace-nowrap border-b border-border px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide "+(r ? "text-right" : "text-left")}, t); };
var td = function(v, o){ o = o||{}; return e("td",{className:"whitespace-nowrap px-3 py-2 text-sm "+(o.r ? "text-right "+MONO : "")+" "+(o.c||"")}, v); };
var dash = e("span",{className:"text-muted-foreground"},"—");
var nomeMes = function(m){ var p = m.split("-"); return MESES[+p[1]-1]+"/"+p[0]; };

var fmtKm = function(n){ return (Math.round(n*10)/10).toLocaleString("pt-BR")+" km"; };
var arred = function(n){ return (Math.round(n*10)/10).toLocaleString("pt-BR"); };
// Média de km por atendimento: vermelho = acima da média de todas, verde = abaixo
function corMedia(m, geral){ return m==null || !(geral>0) ? "" : m>geral*1.0001 ? "text-[#F87171]" : "text-[#4ADE80]"; }
function ChipMedia(p){ return e("span",{className:"rounded-md bg-black/25 px-2 py-0.5 text-[12px] font-bold "+MONO+" "+(p.m!=null ? corMedia(p.m, p.geral) : "opacity-70")}, p.m!=null ? arred(p.m)+" km/atend." : "sem km"); }

// Aviso fixo: quem paga a comissão atualiza o preço médio da gasolina (ANP, Paraná) antes de pagar
var LINK_ANP = "https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas";
function AvisoGasolina(p){
  var s = p.s, d = p.d, c = p.c, fin = p.fin, g = c.gasolinaPR || {}, hist = c.gasolinaHist || [];
  var st = useState(g.valor||0), v = st[0], setV = st[1], ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var hojeIso = isoDia(new Date()), emIso = g.em ? isoDia(new Date(g.em)) : "", atual = emIso===hojeIso;
  return e("section",{className:"overflow-hidden rounded-xl bg-black ring-2 "+(atual ? "ring-[#E8B84B]/40" : "ring-warning/70")},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"},
      e("div",{className:"flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]"},
        e("b",{className:"font-heading"},"⛽ Gasolina PR (ANP)"),
        g.em ? e("span",null, e("b",{className:MONO+" text-[#F3D98B]"}, BK(g.valor)+"/L"), " · "+dataHora(g.em)+" · "+quemNome(g.por)) : e("span",{className:"text-warning"},"ainda não informada"),
        !atual && e("span",{className:"font-semibold text-warning"},"desatualizado: confira a ANP antes de pagar")),
      e(Btn,{v:"ghost", sm:true, ic:aberto ? "chevrondown" : "chevron", onClick:function(){ setAberto(!aberto); }}, "Atualizações")),
    aberto && e("div",{className:"flex flex-col gap-4 border-t border-border p-4 lg:flex-row lg:justify-between"},
      e("div",{className:"flex min-w-0 flex-col gap-3"},
        e("ol",{className:"list-decimal pl-5 text-[13px] leading-snug"},
          e("li",null,"Abra o ",e("a",{href:LINK_ANP, target:"_blank", rel:"noreferrer", className:"font-bold text-primary underline"},"painel da ANP"),", entre na semana mais recente e abra a planilha ",e("b",null,"Preços médios semanais"),"."),
          e("li",null,"Procure ",e("b",null,"Paraná → Gasolina comum → Preço médio de revenda")," e digite o valor ao lado."),
          e("li",null,"O combustível de cada representante é calculado sozinho: km ÷ "+c.kmPorLitro+" km por litro × preço do litro.")),
        e("div",{className:"flex items-end gap-2"},
          e("label",{className:"flex flex-col gap-1"}, e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"},"Preço médio PR (R$/litro)"),
            e(MoneyInput,{value:v, sm:true, label:"Preço médio da gasolina comum no Paraná", className:"w-36", disabled:!fin, onChange:setV})),
          e(Btn,{v:"primary", sm:true, ic:"check", disabled:!fin || !(v>0) || v===g.valor, onClick:function(){ d({type:"COMIS_GAS", valor:v, por:s.usuario, corteHora:c.corteHora, kmPorLitro:c.kmPorLitro}); }}, "Atualizar"))),
      e("div",{className:"flex max-h-48 min-w-[16rem] flex-col gap-1 overflow-y-auto"},
        e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"},"Todas as atualizações"),
        hist.length===0 ? e("span",{className:"text-[12.5px] text-muted-foreground"},"Nenhuma ainda.") :
        hist.map(function(h,i){ return e("div",{key:i, className:"flex items-center justify-between gap-3 rounded-md bg-muted/30 px-2 py-1 text-[12.5px]"}, e("span",null, dataHora(h.em)+" · "+quemNome(h.por)), e("b",{className:MONO}, BK(h.valor))); }))));
}

function Kpi(p){ return e("div",{className:"flex flex-col items-center gap-0.5 rounded-xl bg-linear-to-b from-[#3A2912]/40 to-card px-3 py-3 text-center ring-1 ring-[#E8B84B]/20"},
  e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide"}, p.t), e("b",{className:MONO+" text-[22px] "+(p.cor||"")}, p.v), p.sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, p.sub)); }

// Cinco números que repetem em todo nível (mesmos nomes no app da representante):
//   Comissão = total do período · Pendente = falta o check do financeiro · A pagar = com check (+ combustível) · Pago = já pago (inclui Pix direto) · Restante = a pagar − pago (negativo = pago a mais)
var COR_NUM = {comis:"text-[#F1E4C6]", pend:"text-[#F3B63F]", apagar:"text-[#F3D98B]", pago:"text-[#4ADE80]"};
function Numeros(p){
  var col = function(t, v, cor){ return e("div",{className:"flex min-w-[5rem] flex-col items-end"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide opacity-80"}, t), e("b",{className:MONO+" text-[14px] "+cor}, BK(v))); };
  return e("div",{className:"flex items-center gap-3.5"}, col("Comissão", p.comis, COR_NUM.comis), col("Pendente", p.pend, COR_NUM.pend), col("A pagar", p.apagar, COR_NUM.apagar), col("Pago", p.pago, COR_NUM.pago),
    col("Restante", p.rest, p.rest<-0.009 ? "text-[#60A5FA]" : p.rest>0.009 ? "text-[#F87171]" : ""));
}
// Legenda: o que cada número quer dizer (fica no alto da lista)
function Legenda(){
  var x = function(cor, nome, txt){ return e("span",{className:"inline-flex items-baseline gap-1"}, e("b",{className:"text-[11.5px] uppercase tracking-wide "+cor}, nome), e("span",{className:"text-[12px] text-muted-foreground"}, txt)); };
  return e("div",{className:"flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg bg-black px-3 py-2 ring-1 ring-[#E8B84B]/20"},
    x(COR_NUM.comis,"Comissão","total do período"), x(COR_NUM.pend,"Pendente","falta o check do financeiro"), x(COR_NUM.apagar,"A pagar","com check, mais o combustível"),
    x(COR_NUM.pago,"Pago","já pago (inclui Pix direto)"), x("text-[#60A5FA]","Restante","a pagar menos pago"));
}
function Faixa(p){   // faixa clicável (abre/fecha) no estilo bronze das listagens
  return e("button",{onClick:p.alt, "aria-expanded":p.aberto, className:"flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left text-[#F1E4C6] shadow-[inset_0_1px_0_rgba(255,255,255,.12)] "+(p.cls||"bg-linear-to-r from-[#3A2912] via-[#5C4322] to-[#86653A]")},
    e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg bg-[#E8B84B] text-[#1B1409]"}, e(Icon,{n:p.aberto ? "chevrondown" : "chevron", s:15})),
    e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate font-heading text-[15px] font-bold"}, p.t), e("span",{className:"block truncate text-[12px] opacity-80"}, p.sub)),
    p.chip, p.dir);
}

// ── Linha final do bloco da data: Comissão total + Combustível = A pagar, e os pagamentos feitos. O km é só da representante (app). ──
function Fechamento(p){
  var s = p.s, d = p.d, c = p.c, rs = p.rs, fin = p.fin, key = chaveFech(p.data, p.rep);
  var formas = s.formasPagamento||[];
  var st = useState({forma:"pix", conta:"", data:isoDia(new Date()), valor:0}), f = st[0], setF = st[1];
  var forma = formas.find(function(x){ return x.k===f.forma; }) || {descricoes:[]};
  var valor = f.valor>0 ? f.valor : Math.max(0, rs.falta);
  var podeAdd = fin && rs.aposCorte && valor>0 && f.conta && rs.falta>0.009 && valor <= rs.falta+0.009;
  var campo = function(t2, filho){ return e("label",{className:"flex flex-col gap-1"}, e("span",{className:"text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"}, t2), filho); };
  var item = function(t2, v, cor, sub){ return e("div",{className:"flex flex-col"}, e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground"}, t2), e("b",{className:MONO+" text-[15px] "+(cor||"")}, v), sub && e("span",{className:"text-[11.5px] text-muted-foreground"}, sub)); };
  var kmTxt = rs.combFixo ? "sem km no prazo · valor fixo"
    : rs.km>0 ? arred(rs.km)+" km "+(rs.kmModo==="dias" ? "dia a dia" : "total")+" · "+(rs.preco>0 ? arred(rs.litros)+" L × "+BK(rs.preco) : "falta o preço da gasolina")
    : "a representante ainda não enviou o km";
  return e("div",{className:"flex flex-col gap-2.5 border-t-2 border-[#C9AA6A]/50 bg-linear-to-r from-[#2A2013] to-[#3A2D18] px-4 py-3"},
    e("div",{className:"flex flex-wrap items-start gap-x-7 gap-y-2"},
      item("Comissão total", BK(rs.comissaoTotal), "text-[#F1E4C6]"), e("span",{className:"pt-4 text-muted-foreground"},"+"),
      item("Combustível", BK(rs.comb), "text-[#60A5FA]", kmTxt), e("span",{className:"pt-4 text-muted-foreground"},"="),
      item("A pagar", BK(rs.aPagar), "text-[#F3D98B]"), item("Pago", BK(rs.pagos), "text-[#4ADE80]"),
      item("Restante", BK(rs.falta), rs.falta<-0.009 ? "text-[#60A5FA]" : rs.falta>0.009 ? "text-[#F87171]" : "", rs.falta<-0.009 ? "pago a mais" : rs.paga ? "quitado" : null)),
    ((rs.lista||[]).length>0 || rs.diretos.length>0) && e("div",{className:"flex flex-wrap gap-1.5"},
      rs.diretos.map(function(it){ return e("span",{key:it.id, className:"inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2 py-1 text-[12px] font-semibold text-success"}, "Pix representante · "+it.rev+" · "+BK(it.valorPago)+" · pago direto"); }),
      rs.lista.map(function(g,i){ return e("span",{key:i, className:"inline-flex items-center gap-1.5 rounded-md bg-success/15 px-2 py-1 text-[12px] font-semibold text-success"},
        ((formas.find(function(x){ return x.k===g.forma; })||{}).label||g.forma)+" · "+g.conta+" · "+fmtDataBR(g.data)+" · "+BK(g.valor)+" · "+quemNome(g.por),
        fin && e("button",{onClick:function(){ d({type:"COMIS_FECH_PAG", key:key, del:i}); }, "aria-label":"Desfazer pagamento", className:"text-[13px] opacity-70 hover:opacity-100"}, "×")); })),
    rs.aPagar>0.009 && !rs.paga && e("div",{className:"flex flex-wrap items-end gap-2"},
      campo("Forma", e("select",{value:f.forma, disabled:!fin, "aria-label":"Forma do pagamento", className:INPUT+" h-9! text-sm!", onChange:function(ev){ setF(Object.assign({}, f, {forma:ev.target.value, conta:""})); }},
        formas.filter(function(x){ return x.k!=="pix_representante" && x.k!=="acerto_loja"; }).map(function(x){ return e("option",{key:x.k, value:x.k}, x.label); }))),
      campo("Conta de saída", e("select",{value:f.conta, disabled:!fin, "aria-label":"Conta de saída", className:INPUT+" h-9! w-56 text-sm!", onChange:function(ev){ setF(Object.assign({}, f, {conta:ev.target.value})); }},
        e("option",{value:""},"Escolha…"), forma.descricoes.map(function(x){ return e("option",{key:x, value:x}, x); }))),
      campo("Data", e("input",{type:"date", value:f.data, disabled:!fin, className:INPUT+" h-9! text-sm! [color-scheme:dark]", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})),
      campo("Valor", e(MoneyInput,{value:valor, sm:true, disabled:!fin, label:"Valor pago", className:"w-32", onChange:function(v){ setF(Object.assign({}, f, {valor:v})); }})),
      e(Btn,{v:"primary", sm:true, ic:"check", disabled:!podeAdd, onClick:function(){ d({type:"COMIS_FECH_PAG", key:key, por:s.usuario, pag:{forma:f.forma, conta:f.conta, data:f.data, valor:valor}}); setF(Object.assign({}, f, {valor:0})); }}, "Registrar pagamento")),
    rs.aPagar>0.009 && !rs.paga && !rs.aposCorte && e("p",{className:"text-[12px] text-warning"},"O corte desta data é "+new Date(rs.corte).toLocaleString("pt-BR",{day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"})+": o pagamento libera depois dele."));
}

// Divergência de uma linha de pagamento: valor diferente, conta errada ou pagamento não identificado (sem comprovante)
function Divergencia(p){
  var it = p.it, d = p.d, s = p.s, fin = p.fin, dv = it.div;
  var st = useState(null), modo = st[0], setModo = st[1], vs = useState(0), val = vs[0], setVal = vs[1], cs = useState(""), conta = cs[0], setConta = cs[1];
  var chip = function(txt, cor){ return e("span",{className:"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-semibold "+cor}, txt,
    fin && e("button",{onClick:function(){ d({type:"COMIS_DIV", id:it.r.id, idx:it.chave, tipo:"limpar"}); }, "aria-label":"Desfazer divergência", title:"Desfazer", className:"opacity-70 hover:opacity-100"}, "×")); };
  if(dv) return dv.tipo==="valor" ? chip("Valor corrigido: "+BK(dv.valorErrado)+" → "+BK(dv.valorCerto), "bg-info/15 text-info")
    : dv.tipo==="conta" ? chip("Conta corrigida: "+dv.contaErrada+" → "+dv.contaCerta, "bg-info/15 text-info")
    : chip("Não identificado · representante avisada", "bg-destructive/15 text-destructive");
  if(!fin || it.motivo || it.loja) return null;
  var btn = function(txt, onClick, cls){ return e("button",{onClick:onClick, className:"rounded-md px-2 py-1 text-[12px] font-semibold "+(cls||"bg-muted hover:bg-muted/70")}, txt); };
  if(modo==="valor") return e("span",{className:"inline-flex items-center gap-1.5"}, e(MoneyInput,{value:val, sm:true, label:"Valor correto que entrou", className:"w-28", onChange:setVal}),
    btn("OK", function(){ if(val>0){ d({type:"COMIS_DIV", id:it.r.id, idx:it.chave, tipo:"valor", valor:val, por:s.usuario}); setModo(null); } }, "bg-primary text-primary-foreground"), btn("Cancelar", function(){ setModo(null); }));
  if(modo==="conta") return e("span",{className:"inline-flex items-center gap-1.5"},
    e("select",{value:conta, "aria-label":"Conta certa", className:INPUT+" h-8! w-48 text-[12.5px]!", onChange:function(ev){ setConta(ev.target.value); }}, e("option",{value:""},"Conta certa…"), p.contas.map(function(x){ return e("option",{key:x, value:x}, x); })),
    btn("OK", function(){ if(conta){ d({type:"COMIS_DIV", id:it.r.id, idx:it.chave, tipo:"conta", conta:conta, por:s.usuario}); setModo(null); } }, "bg-primary text-primary-foreground"), btn("Cancelar", function(){ setModo(null); }));
  if(modo==="menu") return e("span",{className:"inline-flex flex-wrap items-center gap-1.5"},
    btn("Valor diferente", function(){ setVal(it.valorPago); setModo("valor"); }), btn("Conta errada", function(){ setModo("conta"); }),
    btn("Não identificado", function(){ d({type:"COMIS_DIV", id:it.r.id, idx:it.chave, tipo:"nao_ident", por:s.usuario}); setModo(null); }, "bg-destructive/15 text-destructive hover:bg-destructive/25"), btn("×", function(){ setModo(null); }));
  return btn("⚠ Divergência", function(){ setModo("menu"); });
}

// ── Uma data de pagamento ("Pagamento 1/2/3" do mês): um acerto por linha, com o valor total; abrindo, as formas de pagamento para conciliar ──
function Situacao(p){
  var s = p.s, d = p.d, c = p.c, rs = p.rs, fin = p.fin, contas = p.contas, key = chaveFech(p.data, p.rep);
  var chaveAb = "s:"+p.rep+"|"+p.data, aberto = p.ab[chaveAb]===true;   // começa fechado: a funcionária abre para conferir
  var travada = (rs.lista||[]).length>0, jan = janelaDe(c, grupoDaRep(c, p.rep), p.data);
  var status = rs.paga ? e("span",{className:"rounded-md bg-success/20 px-2 py-0.5 text-[12px] font-bold text-[#4ADE80]"},"Paga")
    : rs.aPagar>0.009 ? e("span",{className:"rounded-md px-2 py-0.5 text-[12px] font-bold "+(rs.aposCorte ? "bg-warning/25 text-[#F3B63F]" : "bg-info/20 text-[#93C5FD]")}, rs.aposCorte ? "A pagar" : "Antes do corte")
    : rs.itens.length>0 ? e("span",{className:"rounded-md bg-warning/20 px-2 py-0.5 text-[12px] font-semibold text-[#F3B63F]"},"Aguardando conciliação")
    : e("span",{className:"rounded-md bg-black/20 px-2 py-0.5 text-[12px] font-semibold opacity-80"},"Sem atendimentos");
  var contasDe = function(k, atual){ var f = (s.formasPagamento||[]).find(function(x){ return x.k===k; }), l = f ? f.descricoes.slice() : contas.slice(); if(atual && l.indexOf(atual)<0) l.unshift(atual); return l; };
  var confirma = function(it, conta){ if(!fin) return d({type:"AVISO", txt:"Só o financeiro e a supervisão fazem a conciliação"}); d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, conta:conta, por:s.usuario}); };
  var grupos = {}; rs.itens.forEach(function(it){ (grupos[it.r.id] = grupos[it.r.id] || []).push(it); });
  var acertos = Object.keys(grupos).map(function(k){ return grupos[k]; }).sort(function(x,y){ return x[0].r.data.localeCompare(y[0].r.data) || x[0].r.id.localeCompare(y[0].r.id); });
  var C = "px-3 py-2 text-sm";
  var linha = function(it){
    var formaLb = (((s.formasPagamento||[]).find(function(x){ return x.k===it.forma; })||{}).label)||"";
    var podeMarcar = fin && !it.confirmado && !it.motivo && !it.loja;
    return e("tr",{key:it.id, className:"border-t border-border/50 "+(it.confirmado ? "" : "bg-warning/5")},
      e("td",{className:C}, it.tipo==="pag" ? (it.pixRep ? "Pix representante → "+(it.dest||"?") : e("span",null, formaLb, e("span",{className:"ml-1 text-muted-foreground"},"· "+(it.fin ? it.fin.conta : it.conta)))) : e("span",{className:"font-semibold"}, it.status+" (comissão fixa)"),
        it.extra && e("span",{className:"ml-2 rounded bg-info/15 px-1.5 text-[11px] font-semibold text-info"},"pago depois")),
      e("td",{className:C+" text-right "+MONO}, it.tipo==="pag" ? (it.valorOrig!==it.valorPago ? e("span",null, e("s",{className:"mr-1 text-muted-foreground"}, BK(it.valorOrig)), BK(it.valorPago)) : BK(it.valorPago)) : dash),
      e("td",{className:C+" text-right font-semibold text-success "+MONO}, it.loja || it.pixRep ? dash : BK(it.comissao)),
      e("td",{className:C}, it.pixRep ? e("span",{className:"rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-semibold text-success"},"Pix direto para a representante · entra em Pago")
        : it.loja ? e("span",{className:"rounded-md bg-destructive/15 px-2 py-0.5 text-[12px] font-semibold text-destructive"},"Sem pagamento · vai para Inadimplência")
        : it.confirmado
        ? e("label",{className:"flex items-center gap-2"},
            e("input",{type:"checkbox", checked:true, disabled:!fin || travada, className:"size-5", "aria-label":"Desfazer conciliação", onChange:function(){ d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, ok:false}); }}),
            e("span",{className:"rounded-md bg-success/15 px-2 py-0.5 text-[12px] font-semibold text-success"}, quemNome(it.fin.por)+" · "+dataHora(it.fin.ts)))
        : it.motivo ? e("span",{className:"text-[12.5px] text-muted-foreground"}, it.motivo)
        : e("div",{className:"flex items-center gap-2"},
            e("input",{type:"checkbox", checked:false, disabled:!podeMarcar, className:"size-5", "aria-label":"Conciliação do financeiro: "+it.rev, onChange:function(){
              var el = document.getElementById("conta-"+it.id); confirma(it, el ? el.value : it.conta); }}),
            it.tipo==="pag" && e("select",{id:"conta-"+it.id, defaultValue:it.conta, disabled:!fin, "aria-label":"Conta em que entrou", className:INPUT+" h-8! w-52 text-[12.5px]!"},
              contasDe(it.forma, it.conta).map(function(x){ return e("option",{key:x, value:x}, x); })))),
      e("td",{className:C}, it.tipo==="pag" && !it.pixRep ? e(Divergencia,{it:it, d:d, s:s, fin:fin, contas:contasDe(it.forma, it.conta)}) : null));
  };
  return e("div",{className:"overflow-hidden rounded-lg ring-1 ring-[#C9AA6A]/60"},
    e(Faixa,{t:"Pagamento "+p.n, sub:"Atendimentos "+fmtDataBR(jan.ini).slice(0,5)+" até "+fmtDataBR(jan.fim).slice(0,5)+" · pagamento dia "+fmtDataBR(p.data).slice(0,5),
      aberto:aberto, alt:function(){ p.alt(chaveAb, !aberto); }, cls:"bg-linear-to-r from-[#7C6538] via-[#977D49] to-[#B09660]", chip:status,
      dir:e(Numeros,{comis:rs.comissaoTotal, pend:rs.pendente, apagar:rs.aPagar, pago:rs.pagos, rest:rs.falta})}),
    aberto && e("div",{className:"bg-card/40"},
      acertos.length===0 ? e("p",{className:"px-4 py-3 text-[13px] text-muted-foreground"},"Nenhum atendimento nesta data ainda.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
        e("thead",null, e("tr",{className:"bg-sidebar"}, th(""), th("Revendedora"), th("Data"), th("Status"), th("Valor do acerto",true), th("Comissão",true), th("Conciliação"))),
        e("tbody",null, acertos.map(function(g){
          var r0 = g[0].r, kA = "a:"+r0.id, abA = p.ab[kA]===true, conf = g[0].conferido;
          var linhas = g.filter(function(x){ return !x.loja && !x.pixRep; }), ok = linhas.filter(function(x){ return x.confirmado; }).length, temLoja = g.some(function(x){ return x.loja; });
          var comTot = g.reduce(function(t2,x){ return t2+(x.loja || x.pixRep ? 0 : x.comissao); }, 0);
          var cinza = conf ? "" : "bg-muted/40 text-muted-foreground opacity-70";
          return e(React.Fragment,{key:r0.id},
            e("tr",{className:"cursor-pointer border-t border-border/60 hover:bg-muted/30 "+cinza, onClick:function(){ p.alt(kA, !abA); }},
              e("td",{className:"w-8 px-2 py-2"}, e(Icon,{n:abA ? "chevrondown" : "chevron", s:14})),
              e("td",{className:C+" font-semibold"}, r0.rev), e("td",{className:C}, fmtDataBR(r0.data)),
              e("td",{className:C}, e("span",{className:"rounded-md bg-muted px-2 py-0.5 text-[12px] font-semibold"}, g[0].status)),
              e("td",{className:C+" text-right font-semibold "+MONO}, r0.tipo==="acerto" ? BK(r0.valorAcerto||0) : dash), e("td",{className:C+" text-right font-semibold text-success "+MONO}, BK(comTot)),
              e("td",{className:C}, !conf ? e("span",{className:"text-[12.5px]"},"Aguardando o agendamento confirmar o recebimento")
                : e("span",{className:"inline-flex flex-wrap items-center gap-1.5"},
                    linhas.length>0 && e("span",{className:"rounded-md px-2 py-0.5 text-[12px] font-bold "+(ok===linhas.length ? "bg-success/15 text-success" : "bg-warning/15 text-[#F3B63F]")}, ok+"/"+linhas.length+" conciliados"),
                    temLoja && e("span",{className:"rounded-md bg-destructive/15 px-2 py-0.5 text-[12px] font-bold text-destructive"},"Acerto com loja → Inadimplência")))),
            abA && e("tr",{className:"bg-black/10 "+cinza}, e("td",null), e("td",{colSpan:6, className:"px-2 pb-3 pt-1"},
              e("table",{className:"w-full border-collapse rounded-lg ring-1 ring-border/60"},
                e("thead",null, e("tr",{className:"bg-sidebar/70"}, th("Forma · conta"), th("Valor",true), th("Comissão",true), th("Conciliação (check do financeiro)"), th("Divergência"))),
                e("tbody",null, g.map(linha))))));
        })))),
      e(Fechamento,{s:s, d:d, c:c, rs:rs, fin:fin, rep:p.rep, data:p.data})));
}

// Pix que a revendedora mandou direto para a representante (forma "Pix representante" no app). O financeiro escolhe QUEM recebeu e confirma no OK:
// o valor entra como PAGO na comissão pendente dessa representante. Depois do OK fica no consolidado de Pix representante (com filtro).
function PixRepresentante(p){
  var s = p.s, d = p.d, fin = p.fin, itens = p.itens, nomes = p.nomes;
  var ft = useState("todos"), filtro = ft[0], setFiltro = ft[1];
  var es = useState({}), escolha = es[0], setEscolha = es[1];            // representante escolhida, esperando o OK
  var metas = relatorioPix(comisEfetiva(s), s, isoDia(new Date()).slice(0,7), Date.now(), nomes);
  var lista = itens.filter(function(i){ return i.pixRep; }).filter(function(i){ return filtro==="todos" || !i.dest; })
    .sort(function(a,b){ return (a.dest ? 1 : 0)-(b.dest ? 1 : 0) || b.r.data.localeCompare(a.r.data); });
  var nMarcar = itens.filter(function(i){ return i.pixRep && !i.dest; }).length, soma = lista.reduce(function(t,i){ return t+i.valorPago; }, 0);
  var confirmar = function(it){ var rep = escolha[it.id]; if(!rep) return; if(!fin) return d({type:"AVISO", txt:"Só o financeiro e a supervisão confirmam o Pix representante"});
    d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, conta:"PIX REPRESENTANTE", por:s.usuario, rep:rep}); var o = Object.assign({}, escolha); delete o[it.id]; setEscolha(o); };
  var C = "px-2.5 py-1.5 text-center align-middle";
  return e("section",{className:"flex min-h-0 flex-col overflow-hidden rounded-xl bg-black ring-1 ring-[#E8B84B]/40"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2"},
      e("h2",{className:"font-heading text-[14px] font-bold"},"Pix representante", nMarcar>0 && e("span",{className:"ml-2 rounded-md bg-warning/20 px-1.5 py-0.5 text-[11.5px] font-bold text-warning"}, nMarcar+" a marcar")),
      e("div",{className:"flex items-center gap-2"},
        e(Btn,{v:"secondary", sm:true, ic:"wallet", onClick:function(){ d({type:"ABA", aba:"pixdireto"}); }}, "Metas do Pix direto"),
        e("select",{value:filtro, "aria-label":"Filtro do Pix representante", className:INPUT+" h-8! w-36 cursor-pointer text-[12.5px]!", onChange:function(ev){ setFiltro(ev.target.value); }},
          e("option",{value:"todos"},"Todos"), e("option",{value:"marcar"},"Pendentes")))),
    metas.length>0 && e("div",{className:"flex flex-wrap gap-1.5 border-b border-border px-3 py-2"}, metas.map(function(x){ return e("span",{key:x.rep, title:textoNegociacao(x.neg), className:"inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-semibold "+(x.falta<=0.009 ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}, x.rep+" · meta "+BK(x.meta)+" · "+(x.falta<=0.009 ? "completo" : "falta "+BK(x.falta))); })),
    e("div",{className:"max-h-72 overflow-auto"}, lista.length===0
      ? e("p",{className:"px-3 py-4 text-center text-[13px] text-muted-foreground"}, "Nenhum Pix representante nesse filtro.")
      : e("table",{className:"w-full border-collapse"},
          e("thead",{className:"sticky top-0"}, e("tr",{className:"bg-sidebar"}, ["Revendedora","Representante","Valor"].map(function(t){ return e("th",{key:t, className:"border-b border-r border-border px-2.5 py-1.5 text-center text-[11.5px] font-semibold uppercase tracking-wide last:border-r-0"}, t); }))),
          e("tbody",null, lista.map(function(it){ var esc = escolha[it.id]||"";
            return e("tr",{key:it.id, className:"border-b border-border/60 "+(it.dest ? "" : "bg-warning/5")},
              e("td",{className:C+" border-r border-border/60 text-[13px]"}, e("span",{className:"font-semibold"}, it.rev), e("span",{className:"block text-[11.5px] text-muted-foreground"}, fmtDataBR(it.data)+" · acerto de "+it.repAcerto)),
              e("td",{className:C+" border-r border-border/60"}, it.dest
                ? e("span",{className:"inline-flex flex-wrap items-center justify-center gap-1.5"},
                    e("span",{className:"text-[13px] font-semibold"}, it.dest),
                    e("span",{className:"rounded-md bg-success/15 px-1.5 py-0.5 text-[11.5px] font-bold text-success", title:"Confirmado por "+quemNome(it.fin.por)+" · "+dataHora(it.fin.ts)}, "✓ OK · "+quemNome(it.fin.por)),
                    fin && e("button",{onClick:function(){ d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, ok:false}); }, "aria-label":"Desfazer", title:"Desfazer", className:"text-[13px] text-muted-foreground hover:text-destructive"}, "×"))
                : e("span",{className:"inline-flex items-center justify-center gap-1.5"},
                    e("select",{value:esc, disabled:!fin, "aria-label":"Representante que recebeu o Pix de "+it.rev, className:INPUT+" h-8! w-36 cursor-pointer text-[12.5px]!", onChange:function(ev){ var o = Object.assign({}, escolha); o[it.id] = ev.target.value; setEscolha(o); }},
                      e("option",{value:""},"Escolha…"), nomes.map(function(n){ return e("option",{key:n, value:n}, n); })),
                    e("button",{onClick:function(){ confirmar(it); }, disabled:!fin || !esc, "aria-label":"OK para "+it.rev, className:"h-8 rounded-lg px-3 text-[12.5px] font-bold "+(esc && fin ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground")}, "OK"))),
              e("td",{className:C+" whitespace-nowrap text-[13px] font-semibold "+MONO}, BK(it.valorPago))); })))),
    e("div",{className:"flex items-center justify-between border-t border-border px-3 py-1.5 text-[12.5px]"},
      e("span",{className:"text-muted-foreground"}, lista.length+" Pix"), e("b",{className:MONO}, BK(soma))));
}

// Erros que o financeiro registrou nos pagamentos dos atendimentos desta representante (divergência de valor, conta errada, pagamento não identificado)
function ErrosRep(p){
  var lista = [];
  (p.s.acertosConsignado||[]).filter(function(r){ return r.rep===p.rep && r.divs; }).forEach(function(r){
    Object.keys(r.divs).forEach(function(i){ var dv = r.divs[i]; lista.push({r:r, i:i, dv:dv}); }); });
  if(lista.length===0) return null;
  lista.sort(function(a,b){ return (b.dv.ts||"").localeCompare(a.dv.ts||""); });
  var txt = function(dv){ return dv.tipo==="valor" ? "Valor diferente: lançou "+BK(dv.valorErrado)+", entrou "+BK(dv.valorCerto) : dv.tipo==="conta" ? "Conta errada: "+dv.contaErrada+" → "+dv.contaCerta : "Pagamento não identificado / sem comprovante"; };
  return e("div",{className:"overflow-hidden rounded-lg ring-1 ring-destructive/40"},
    e("div",{className:"flex items-center justify-between bg-destructive/10 px-3 py-1.5"}, e("b",{className:"text-[13px]"},"Erros registrados · "+lista.length)),
    e("div",{className:"flex max-h-40 flex-col gap-1 overflow-y-auto p-2"}, lista.map(function(x){ return e("div",{key:x.r.id+x.i, className:"flex flex-wrap items-center gap-x-3 text-[12.5px]"},
      e("span",{className:MONO+" text-muted-foreground"}, dataHora(x.dv.ts)), e("b",null, x.r.rev), e("span",null, txt(x.dv)), e("span",{className:"text-muted-foreground"},"· "+quemNome(x.dv.por))); })));
}

// Relatório de taxas de deslocamento por representante: quantas teve, quantas a revendedora não pagou (quem "não cobra direito" fica com % alto)
function RelatorioTaxas(p){
  var ab = useState(false), aberto = ab[0], setAberto = ab[1], ex = useState(null), exp = ex[0], setExp = ex[1];
  var lista = relatorioTaxas(p.s, function(r){ return p.noPeriodo(r.data) && (p.repF==="todas" || r.rep===p.repF); });
  var tN = lista.reduce(function(t2,x){ return t2+x.n; }, 0), tNao = lista.reduce(function(t2,x){ return t2+x.naoPagas; }, 0), tAberto = lista.reduce(function(t2,x){ return t2+x.aberto; }, 0);
  var C = "px-3 py-1.5 text-center text-[13px]";
  return e("section",{className:"overflow-hidden rounded-xl bg-black ring-1 ring-[#E8B84B]/25"},
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto, className:"flex w-full flex-wrap items-center justify-between gap-2 px-4 py-2 text-left"},
      e("span",{className:"inline-flex items-center gap-2 font-heading text-[14px] font-bold"}, e(Icon,{n:aberto ? "chevrondown" : "chevron", s:15}), "Relatório de taxas de deslocamento"),
      e("span",{className:"text-[12.5px] text-muted-foreground"}, p.rotulo+" · "+tN+(tN===1 ? " taxa" : " taxas")+" · ", e("b",{className:tNao>0 ? "text-[#F87171]" : "text-[#4ADE80]"}, tNao+" não paga"+(tNao===1 ? "" : "s")), " · "+BK(tAberto)+" não recebido")),
    aberto && (lista.length===0 ? e("p",{className:"border-t border-border px-4 py-3 text-[13px] text-muted-foreground"},"Nenhuma taxa de deslocamento neste período.")
      : e("div",{className:"overflow-x-auto border-t border-border"}, e("table",{className:"w-full border-collapse"},
          e("thead",null, e("tr",{className:"bg-sidebar"}, th("Representante"), th("Taxas",true), th("Pagas",true), th("Não pagas",true), th("% não paga",true), th("Valor das taxas",true), th("Não recebido",true))),
          e("tbody",null, lista.map(function(x, i){ var aExp = exp===x.rep;
            return e(React.Fragment,{key:x.rep},
              e("tr",{className:"cursor-pointer border-t border-border/60 hover:bg-muted/30", onClick:function(){ setExp(aExp ? null : x.rep); }},
                e("td",{className:C+" text-left font-semibold"}, x.rep, i===0 && x.pct>0 && e("span",{className:"ml-2 rounded bg-destructive/20 px-1.5 py-px text-[10.5px] font-bold text-[#F87171]"},"mais taxas não pagas")),
                e("td",{className:C+" "+MONO}, x.n), e("td",{className:C+" text-[#4ADE80] "+MONO}, x.pagas), e("td",{className:C+" font-bold "+MONO+(x.naoPagas>0 ? " text-[#F87171]" : "")}, x.naoPagas),
                e("td",{className:C},
                  e("span",{className:"inline-flex w-28 items-center gap-1.5"}, e("span",{className:"h-2.5 flex-1 overflow-hidden rounded bg-muted/50"}, e("span",{className:"block h-full rounded "+(x.pct>=50 ? "bg-destructive" : x.pct>0 ? "bg-warning" : "bg-success"), style:{width:Math.max(x.pct>0 ? 4 : 0, x.pct)+"%"}})), e("b",{className:MONO+" text-[12px]"}, x.pct+"%"))),
                e("td",{className:C+" "+MONO}, BK(x.valor)), e("td",{className:C+" font-bold "+MONO+(x.aberto>0 ? " text-[#F87171]" : "")}, BK(x.aberto))),
              aExp && e("tr",{className:"bg-black/30"}, e("td",{colSpan:7, className:"px-4 py-2"},
                e("div",{className:"flex flex-wrap gap-1.5"}, x.lista.map(function(y){ return e("span",{key:y.r.id, className:"inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold "+(y.paga ? "bg-success/15 text-success" : "bg-destructive/15 text-[#F87171]")},
                  y.r.rev+" · "+fmtDataBR(y.r.data).slice(0,5)+" · "+BK(y.taxa)+(y.paga ? " ✓ paga" : " · não paga")); })))));
          }))))));
}

function AbaComissoesBase(p){
  var cx = use(), s = cx.state, d = cx.dispatch, c = comisEfetiva(s), fin = podeFinanceiro(s.usuario), agora = Date.now();
  var hoje = new Date(agora), mesAtual = isoDia(hoje).slice(0,7);
  var fr = useState("todas"), repF = fr[0], setRepF = fr[1];
  var ya = useState(mesAtual.slice(0,4)), anoSel = ya[0], setAnoSel = ya[1];
  var mm = useState(mesAtual.slice(5)), mesN = mm[0], setMesN = mm[1];   // "" = o ano todo
  var noPeriodo = function(ym){ return (ym||"").slice(0,4)===anoSel && (mesN==="" || (ym||"").slice(5,7)===mesN); };
  var rotuloPeriodo = mesN==="" ? "Ano "+anoSel : MESES[+mesN-1]+"/"+anoSel;
  var mu = useState(false), modoUma = mu[0], setModoUma = mu[1], iu = useState(0), idxUma = iu[0], setIdxUma = iu[1], es2 = useState("mes"), escopo = es2[0], setEscopo = es2[1];
  var ab = useState({}), abertos = ab[0], setAbertos = ab[1];
  var alt = function(k, v){ var o = Object.assign({}, abertos); o[k] = v; setAbertos(o); };
  var contas = []; (s.formasPagamento||[]).forEach(function(f){ f.descricoes.forEach(function(x){ if(contas.indexOf(x)<0) contas.push(x); }); });
  var itens = itensComissao(c, s, agora);
  var todasReps = repsEfetivas(s).map(function(x){ return x.nome; });
  var reps = todasReps.filter(function(n){ return repF==="todas" || repF===n; });
  var anos = (s.acertosConsignado||[]).map(function(r){ return (r.data||"").slice(0,4); }).concat([mesAtual.slice(0,4)]).filter(function(a,i,x){ return a && x.indexOf(a)===i; }).sort().reverse();

  // totais do mês (tudo que antes ficava no Consolidado): vendido, acerto, pago, inadimplência e o recebido em cada conta
  var doMes = (s.acertosConsignado||[]).filter(function(r){ return r.tipo==="acerto" && noPeriodo(r.data) && (repF==="todas" || r.rep===repF); });
  var tVendido = doMes.reduce(function(t,r){ return t+(r.vendaLiquida||0); }, 0), tAcerto = doMes.reduce(function(t,r){ return t+(r.valorAcerto||0); }, 0),
      tPago = doMes.reduce(function(t,r){ return t+pagoDe(r); }, 0), tInad = doMes.reduce(function(t,r){ return t+faltaDe(r); }, 0);
  var totConta = {}; doMes.forEach(function(r){ (r.pagamentos||[]).forEach(function(p){ totConta[p.descricao] = (totConta[p.descricao]||0)+(p.valor||0); }); });
  var barras = Object.keys(totConta).map(function(k){ return {nome:k, v:totConta[k], inad:false}; }).sort(function(a,b){ return b.v-a.v; }).concat([{nome:"Inadimplência", v:tInad, inad:true}]);
  var maxBarra = Math.max.apply(null, barras.map(function(x){ return x.v; }).concat([1]));
  var nAtend = function(n){ return (s.acertosConsignado||[]).filter(function(r){ return r.rep===n && r.origem!=="interno"; }).length; };

  // totais por representante (todos os meses): confirmado, pendente, combustível, a pagar em aberto — todas as que temos, mesmo sem valores ainda
  var dadosTodos = reps.map(function(n){
    var meses2 = {}; meses2[mesAtual] = true; if(mesN!=="") meses2[anoSel+"-"+mesN] = true;
    itens.filter(function(i){ return i.dest===n; }).forEach(function(i){ meses2[i.dataRem.slice(0,7)] = true; });
    var lista = Object.keys(meses2).filter(noPeriodo).sort().reverse().map(function(m){
      var datas = datasDoMes(c, grupoDaRep(c, n), m), rss = datas.map(function(dt){ return {data:dt, rs:resumoSituacao(c, itens, n, dt, agora)}; });
      var t = function(k){ return rss.reduce(function(a,x){ return a+x.rs[k]; }, 0); };
      var kmOkL = rss.filter(function(x){ return x.rs.kmOk && x.rs.itens.length>0; });
      return {mes:m, datas:rss, km:kmOkL.reduce(function(a,x){ return a+x.rs.km; }, 0), at:kmOkL.reduce(function(a,x){ return a+x.rs.itens.length; }, 0), comis:t("comissaoTotal"), pend:t("pendente"), apagar:t("aPagar"), pago:t("pagos"), rest:t("falta"), n:rss.reduce(function(a,x){ return a+x.rs.itens.length; }, 0)}; });
    var t2 = function(k){ return lista.reduce(function(a,m){ return a+m[k]; }, 0); };
    return {nome:n, meses:lista, km:t2("km"), at:t2("at"), comis:t2("comis"), pend:t2("pend"), apagar:t2("apagar"), pago:t2("pago"), rest:t2("rest"), n:t2("n")};
  });
  var qtd = dadosTodos.length, idx = Math.min(idxUma, Math.max(0, qtd-1)), dadosRep = modoUma && qtd ? [dadosTodos[idx]] : dadosTodos;
  var kmGeral = dadosTodos.reduce(function(a,r){ return a+r.km; }, 0), atGeral = dadosTodos.reduce(function(a,r){ return a+r.at; }, 0), mediaGeral = atGeral>0 ? kmGeral/atGeral : null;
  var mediaDe = function(x){ return x.at>0 ? x.km/x.at : null; };
  var dias = function(g){ return (c.ciclos[g]||[]).join("/"); };
  var abertaRep = function(n){ var a = abertos["r:"+n]; return a!==undefined ? a : repF!=="todas"; };
  var todasAbertas = dadosRep.length>0 && dadosRep.every(function(r){ return abertaRep(r.nome); });
  var alternaTodas = function(){ var o = Object.assign({}, abertos); dadosRep.forEach(function(r){ o["r:"+r.nome] = !todasAbertas; }); setAbertos(o); };
  var hojeIsoB = isoDia(hoje), somaB = {comis:0, pago:0, falta:0};
  dadosRep.forEach(function(r){
    if(escopo==="mes"){ somaB.comis += r.comis; somaB.pago += r.pago; somaB.falta += r.rest; return; }
    var mAtual = r.meses.find(function(x){ return x.mes===mesAtual; }); if(!mAtual) return;
    var dt = mAtual.datas.find(function(x){ return x.data>=hojeIsoB; }) || mAtual.datas[mAtual.datas.length-1]; if(!dt) return;
    somaB.comis += dt.rs.comissaoTotal; somaB.pago += dt.rs.pagos; somaB.falta += dt.rs.falta;
  });
  var pctB = somaB.comis>0 ? Math.min(100, Math.max(0, somaB.pago/somaB.comis*100)) : 0;
  var mini = function(t, v, cor){ return e("div",{className:"flex flex-col rounded-lg bg-black px-3 py-2 ring-1 ring-[#E8B84B]/25"},
    e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground"}, t), e("b",{className:MONO+" text-[17px] "+(cor||"")}, v)); };
  return e(React.Fragment,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-3"},
      e(PageHead,{t:"Comissões", sub:"Valores recebidos e comissões. Escolha uma representante (ou o consolidado geral), o mês e o ano; depois abra o mês e a data de pagamento."}),
      e("div",{className:"flex items-center gap-2"},
        e("select",{value:repF, "aria-label":"Representante", className:SEL, onChange:function(ev){ setRepF(ev.target.value); }},
          e("option",{value:"todas"},"Consolidado geral (todas)"), todasReps.map(function(n){ return e("option",{key:n, value:n}, n); })),
        e("select",{value:mesN, "aria-label":"Mês", className:SEL, onChange:function(ev){ setMesN(ev.target.value); }},
          e("option",{value:""},"Ano todo"), MESES.map(function(m,i){ return e("option",{key:m, value:String(i+1).padStart(2,"0")}, m); })),
        e("select",{value:anoSel, "aria-label":"Ano", className:SEL, onChange:function(ev){ setAnoSel(ev.target.value); }}, anos.map(function(a){ return e("option",{key:a, value:a}, a); })),
        e(Btn,{v:"ghost", sm:true, onClick:alternaTodas}, todasAbertas ? "Fechar todas" : "Abrir todas"),
        podeConfigComissao(s.usuario) && e(Btn,{v:"secondary", sm:true, ic:"config", onClick:p.aoConfig}, "Configurar comissões"))),
    !fin && e("p",{className:"rounded-lg bg-warning/10 px-3 py-2 text-[12.5px] font-semibold text-warning"},"Você só consulta: os checks e pagamentos são do financeiro."),
    e(AvisoGasolina,{s:s, d:d, c:c, fin:fin}),
        e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6"},
          mini("Total vendido", BK(tVendido)), mini("Total acerto", BK(tAcerto), "text-success"), mini("Total pago", BK(tPago), "text-[#F3D98B]"),
          mini("Total inadimplência", BK(tInad), tInad>0.009 ? "text-destructive" : ""),
          mini("Km por atendimento"+(repF!=="todas" ? " · média geral "+(mediaGeral!=null ? arred(mediaGeral) : "—") : ""), (repF==="todas" ? mediaGeral : mediaDe(dadosRep[0]||{km:0,at:0}))!=null ? arred(repF==="todas" ? mediaGeral : mediaDe(dadosRep[0])) : "—", repF==="todas" ? "" : corMedia(mediaDe(dadosRep[0]||{km:0,at:0}), mediaGeral)),
          mini("Representantes", String(todasReps.length))),
        e(RelatorioTaxas,{s:s, noPeriodo:noPeriodo, repF:repF, rotulo:rotuloPeriodo}),
    e("div",{className:"grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"},
      e(PixRepresentante,{s:s, d:d, fin:fin, itens:itens, nomes:todasReps}),
        // valor que entrou em cada conta (antes ficava no Consolidado)
        e("section",{className:"overflow-hidden rounded-xl bg-black ring-1 ring-[#E8B84B]/25"},
          e("div",{className:"flex items-center justify-between border-b border-border px-3 py-1.5"}, e("h2",{className:"font-heading text-[14px] font-bold"},"Recebido por conta"),
            e("span",{className:"text-[12px] text-muted-foreground"}, rotuloPeriodo+" · pago "+BK(tPago))),
          e("div",{className:"flex max-h-[30rem] flex-col gap-1 overflow-y-auto p-3"},
            barras.length===1 && tPago<=0 ? e("p",{className:"text-[13px] text-muted-foreground"},"Nenhum pagamento lançado no mês.") : null,
            barras.map(function(x){
              return e("div",{key:x.nome, className:"grid grid-cols-[minmax(8rem,15rem)_minmax(0,1fr)_7.5rem] items-center gap-3"},
                e("span",{className:"truncate text-[12.5px] font-semibold "+(x.inad ? "text-destructive" : ""), title:x.nome}, x.nome),
                e("div",{className:"h-3.5 overflow-hidden rounded bg-muted/50"}, e("div",{className:"h-full rounded "+(x.inad ? "bg-destructive" : "bg-linear-to-r from-[#B8862B] to-[#E8B84B]"), style:{width:Math.max(x.v>0 ? 1.5 : 0, x.v/maxBarra*100)+"%"}})),
                e("b",{className:MONO+" text-right text-[12.5px] "+(x.inad ? "text-destructive" : "")}, BK(x.v))); })))),
    e(Legenda,null),
    e("section",{className:"flex flex-col gap-2 rounded-xl bg-black p-3 ring-1 ring-[#E8B84B]/25"},
      e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
        e("h2",{className:"font-heading text-[14px] font-bold"}, "Comissões pagas e o que falta"),
        e("div",{className:"flex items-center gap-1.5"},
          [["periodo","Período atual"],["mes","Mês"]].map(function(x){ return e("button",{key:x[0], onClick:function(){ setEscopo(x[0]); }, className:"rounded-lg px-3 py-1 text-[12px] font-semibold ring-1 "+(escopo===x[0] ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x[1]); }),
          e("span",{className:"mx-1 h-5 w-px bg-border"}),
          [[false,"Todas"],[true,"Uma por uma"]].map(function(x){ return e("button",{key:String(x[0]), onClick:function(){ setModoUma(x[0]); }, className:"rounded-lg px-3 py-1 text-[12px] font-semibold ring-1 "+(modoUma===x[0] ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, x[1]); }),
          modoUma && qtd>1 && e("span",{className:"flex items-center gap-1"},
            e("button",{onClick:function(){ setIdxUma((idx-1+qtd)%qtd); }, "aria-label":"Anterior", className:"grid size-7 place-items-center rounded-lg bg-card ring-1 ring-border hover:bg-muted/40"}, "‹"),
            e("b",{className:"min-w-24 text-center text-[12.5px]"}, (dadosRep[0] ? dadosRep[0].nome : "")+" ("+(idx+1)+"/"+qtd+")"),
            e("button",{onClick:function(){ setIdxUma((idx+1)%qtd); }, "aria-label":"Próxima", className:"grid size-7 place-items-center rounded-lg bg-card ring-1 ring-border hover:bg-muted/40"}, "›")))),
      e("div",{className:"h-3.5 overflow-hidden rounded bg-muted/50"}, e("div",{className:"h-full rounded bg-linear-to-r from-[#B8862B] to-[#E8B84B]", style:{width:pctB+"%"}})),
      e("div",{className:"flex flex-wrap items-center justify-between gap-x-4 text-[12.5px]"},
        e("span",null, "Já pago ", e("b",{className:MONO+" text-success"}, BK(somaB.pago))),
        e("span",null, "Falta pagar ", e("b",{className:MONO+" "+(somaB.falta>0.009 ? "text-destructive" : "text-success")}, BK(somaB.falta))),
        e("span",{className:"text-muted-foreground"}, "Comissão total "+BK(somaB.comis)+" · "+(escopo==="mes" ? rotuloPeriodo : "próximo pagamento de cada representante")+(modoUma ? "" : " · "+dadosRep.length+" representantes")))),
    e("div",{className:"flex flex-col gap-3"}, dadosRep.map(function(r){
      var kRep = "r:"+r.nome, abRep = abertaRep(r.nome);
      return e("div",{key:r.nome, className:"overflow-hidden rounded-xl ring-2 ring-[#8C6A3F]/70"},
        e(Faixa,{chip:e(ChipMedia,{m:mediaDe(r), geral:mediaGeral}), t:r.nome, sub:pctDaRep(c, r.nome)+"% · Grupo "+grupoDaRep(c, r.nome)+" (paga "+dias(grupoDaRep(c, r.nome))+")",
          aberto:abRep, alt:function(){ alt(kRep, !abRep); }, dir:e(Numeros,{comis:r.comis, pend:r.pend, apagar:r.apagar, pago:r.pago, rest:r.rest})}),
        abRep && e("div",{className:"flex flex-col gap-2 bg-card/40 p-3"}, e(ErrosRep,{s:s, rep:r.nome}), r.meses.map(function(m){
          var kM = "m:"+r.nome+"|"+m.mes, abM = abertos[kM]!==undefined ? abertos[kM] : m.mes===mesAtual;
          return e("div",{key:m.mes, className:"overflow-hidden rounded-lg ring-1 ring-[#B8923F]/60"},
            e(Faixa,{chip:e(ChipMedia,{m:mediaDe(m), geral:mediaGeral}), t:nomeMes(m.mes), sub:"3 pagamentos no mês", aberto:abM, alt:function(){ alt(kM, !abM); }, cls:"bg-linear-to-r from-[#5E4724] via-[#7D6133] to-[#9A7C45]",
              dir:e(Numeros,{comis:m.comis, pend:m.pend, apagar:m.apagar, pago:m.pago, rest:m.rest})}),
            abM && e("div",{className:"flex flex-col gap-2 p-2"}, m.datas.map(function(x, ix){
              return e(Situacao,{key:x.data, n:ix+1, s:s, d:d, c:c, rs:x.rs, fin:fin, contas:contas, rep:r.nome, data:x.data, ab:abertos, alt:alt}); })));
        })));
    })),
    e(PainelRegras,{usuario:s.usuario, aoConfig:p.aoConfig}));
}

// Regras das comissões: abrem aqui embaixo, na própria tela. O Configurador (só o Marcus) abre em OUTRA tela, com as regras em cima e as configurações embaixo.
function PainelRegras(p){
  var a = useState(false), aberto = a[0], setAberto = a[1], dono = podeConfigComissao(p.usuario);
  return e("section",{className:"flex flex-col gap-3 rounded-xl border border-[#E8B84B]/40 bg-card p-3"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("div",null, e("h2",{className:"font-heading text-[16px] font-bold"}, "Regras das comissões"), e("p",{className:"text-[12px] text-muted-foreground"}, dono ? "Para mudar um número, abra o Configurador." : "Todas as regras de como a comissão é calculada e paga. Só o Marcus altera.")),
      e("div",{className:"flex gap-2"},
        dono && e(Btn,{v:"secondary", sm:true, ic:"config", onClick:p.aoConfig}, "Configurador"),
        e(Btn,{v:aberto ? "ghost" : "secondary", sm:true, onClick:function(){ setAberto(!aberto); }}, aberto ? "Fechar regras" : "Abrir regras"))),
    aberto && e("div",{className:"flex flex-col gap-3"}, e(AbaRegrasRepresentantes)));
}

// A tela das Comissões dos representantes e, em outra tela, as regras (em cima) e as configurações (embaixo)
function AbaComissoes(){
  var t = useState(false), conf = t[0], setConf = t[1], s = use().state;
  if(conf && podeConfigComissao(s.usuario)) return e(React.Fragment,null,
    e("div",{className:"flex items-center gap-3"}, e(Btn,{v:"secondary", sm:true, onClick:function(){ setConf(false); }}, "← Voltar às comissões")),
    e(PageHead,{t:"Configurar comissões dos representantes", sub:"As regras ficam em cima e, embaixo, as configurações para mexer. Só o Marcus altera; o texto das regras muda sozinho."}),
    e(AbaRegrasRepresentantes),
    e("section",{className:"rounded-xl bg-card p-3 ring-2 ring-[#E8B84B]/40"}, e(AbaConfigComissoes,{embutido:true})));
  return e(AbaComissoesBase,{aoConfig:function(){ setConf(true); }});
}
export { AbaComissoes };
