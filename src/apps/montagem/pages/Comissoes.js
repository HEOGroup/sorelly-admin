// Sorelly Admin — pages/Comissoes.js
// Kits → Representantes → Comissões. Aqui ficam os VALORES (contas, Point, link…): o setor de agendamento não vê esta tela.
//   TELA NOVA (Opção A, Marcus, 12/11/2026): escolhe a DATA de pagamento no topo; cada representante é um bloco com as revendedoras dela e a linha de pagar embaixo.
//   UMA LINHA POR REVENDEDORA: quem pagou de uma forma só confere na própria linha; quem tem 2, 3, 4 pagamentos mostra o total e abre os pagamentos ao clicar (já nasce aberta se falta conferir).
//   Três etapas: 1 Conferir o que entrou → 2 Pagar a comissão → 3 Pagas. O próximo passo BRILHA (o check a marcar; com tudo marcado, o botão Registrar pagamento).
//   Resumo do mês (totais, recebido por conta, taxas, erros, regras) e Pix representante ficam em visões à parte, no Segmentado do topo.
// Cada valor tem um check do financeiro com o nome de quem confirmou; o que o agendamento ainda não conferiu no Consolidado aparece como pendente.
// Em cada data: combustível (km × gasolina do dia, que a Nayale preenche no Configurador), ajuste do fechamento anterior e o pagamento, tudo ali do lado.
import { relatorioTaxas, chaveFech, comisEfetiva, datasDoMes, dataHora, faltaDe, janelaDe, fmtDataBR, grupoDaRep, itensComissao, pagoDe, pctDaRep, quemNome, repsEfetivas, resumoSituacao } from "@/apps/montagem/domain/comissoes";
import { relatorioPix, textoNegociacao } from "@/apps/montagem/domain/pix-direto";
import { podeConfigComissao, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { AbaConfigComissoes } from "@/apps/montagem/pages/ConfigComissoes";
import { ComissoesKitNovo } from "@/apps/montagem/pages/ComissoesKitNovo";
import { Botao, CAMPO, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
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
    e("div",{className:"flex min-h-8 flex-wrap items-center justify-between gap-2 px-3 py-0.5"},
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

// ── OPÇÃO A (12/11/2026) ──
// O brilho mostra por onde começar: fica em UM lugar só da tela (o próximo check; com tudo marcado, o botão de pagar).
var ESTILO_BRILHO = "@keyframes comisBrilho{0%,100%{box-shadow:0 0 0 1px #E8B84B,0 0 0 0 rgba(232,184,75,0)}50%{box-shadow:0 0 0 1px #E8B84B,0 0 14px 4px rgba(232,184,75,.75)}}.comis-brilha{animation:comisBrilho 1.3s ease-in-out infinite;border-radius:6px}";
var COR_OK = "#34D399", COR_FALTA = "#FBBF24", COR_RUIM = "#F87171", COR_OURO = "#F3D98B", FIO = "border-[#2a2c31]";
function marcavel(it){ return !it.confirmado && !it.motivo && !it.loja && !it.pixRep; }   // linha que o financeiro ainda pode conferir
// Etapa da representante numa data: 1 conferir · 2 pagar · 3 paga · 0 nada a fazer agora (antes do corte ou aguardando outro setor)
function etapaDe(rs){
  var normais = rs.itens.filter(function(i){ return !i.loja && !i.pixRep; }), falta = rs.itens.filter(marcavel).length;
  if(falta>0) return {n:1, txt:"Conferir "+normais.filter(function(i){ return i.confirmado; }).length+" de "+normais.length, cor:COR_FALTA, falta:falta};
  if(rs.paga) return {n:3, txt:rs.falta<-0.009 ? "Paga a mais" : "Paga", cor:COR_OK, falta:0};
  if(rs.falta>0.009) return rs.aposCorte ? {n:2, txt:"A pagar", cor:COR_RUIM, falta:0} : {n:0, txt:"Antes do corte", cor:"", falta:0};
  return {n:0, txt:rs.itens.some(function(i){ return i.motivo && !i.confirmado; }) ? "Aguardando" : "Sem valor a pagar", cor:"", falta:0};
}

// Divergência de uma linha: a célula mostra o que foi registrado ou o botão; o editor abre numa linha logo abaixo (EditorDiv)
function Divergencia(p){
  var it = p.it, dv = it.div;
  if(dv) return e("span",{className:"inline-flex items-center gap-2", style:{color:dv.tipo==="valor" || dv.tipo==="conta" ? COR_FALTA : COR_RUIM},
      title:dv.tipo==="valor" ? "Lançou "+BK(dv.valorErrado)+", entrou "+BK(dv.valorCerto) : dv.tipo==="conta" ? dv.contaErrada+" → "+dv.contaCerta : "Pagamento não identificado · representante avisada"},
    dv.tipo==="valor" ? "Valor corrigido" : dv.tipo==="conta" ? "Conta corrigida" : "Não identificado",
    p.fin && e("button",{type:"button", onClick:function(){ p.d({type:"COMIS_DIV", id:it.r.id, idx:it.chave, tipo:"limpar"}); }, "aria-label":"Desfazer divergência", title:"Desfazer", className:"text-[13px] text-foreground hover:text-primary"}, "×"));
  if(!p.fin || it.motivo || it.loja || it.tipo!=="pag" || it.pixRep) return "—";
  return e("button",{type:"button", onClick:p.abrir, "aria-expanded":p.aberto, className:"h-8 px-2 text-[13px] underline underline-offset-2 hover:text-primary"}, p.aberto ? "Fechar" : "Divergência");
}
function EditorDiv(p){
  var it = p.it, d = p.d, s = p.s, ms = useState("menu"), modo = ms[0], setModo = ms[1], vs = useState(it.valorPago), val = vs[0], setVal = vs[1], cs = useState(""), conta = cs[0], setConta = cs[1];
  var grava = function(a){ d(Object.assign({type:"COMIS_DIV", id:it.r.id, idx:it.chave, por:s.usuario}, a)); p.fechar(); };
  return e("div",{className:"flex h-10 items-center justify-center gap-2 whitespace-nowrap bg-[#1c1d21] px-3 text-[13px]"},
    e("b",null, "Divergência · "+it.rev),
    modo==="menu" && e(Botao,{onClick:function(){ setModo("valor"); }}, "Valor diferente"),
    modo==="menu" && e(Botao,{onClick:function(){ setModo("conta"); }}, "Conta errada"),
    modo==="menu" && e(Botao,{onClick:function(){ grava({tipo:"nao_ident"}); }}, "Não identificado"),
    modo==="valor" && e(MoneyInput,{value:val, sm:true, label:"Valor correto que entrou", className:"w-32", onChange:setVal}),
    modo==="valor" && e(Botao,{principal:true, desabilitado:!(val>0), onClick:function(){ grava({tipo:"valor", valor:val}); }}, "Confirmar"),
    modo==="conta" && e("select",{value:conta, "aria-label":"Conta certa", className:CAMPO+" w-64! cursor-pointer", onChange:function(ev){ setConta(ev.target.value); }}, e("option",{value:""},"Conta certa"), p.contas.map(function(x){ return e("option",{key:x, value:x}, x); })),
    modo==="conta" && e(Botao,{principal:true, desabilitado:!conta, onClick:function(){ grava({tipo:"conta", conta:conta}); }}, "Confirmar"),
    e(Botao,{onClick:p.fechar}, "Cancelar"));
}

// Linha de pagar, embaixo das revendedoras: o que já foi pago e, quando há valor liberado, forma · conta · data · valor · Registrar pagamento
function LinhaPagar(p){
  var s = p.s, d = p.d, rs = p.rs, fin = p.fin, et = p.et, key = chaveFech(p.data, p.rep), formas = s.formasPagamento||[];
  var st = useState({forma:"pix", conta:"", data:isoDia(new Date()), valor:0}), f = st[0], setF = st[1];
  var forma = formas.find(function(x){ return x.k===f.forma; }) || {descricoes:[]};
  var valor = f.valor>0 ? f.valor : Math.max(0, rs.falta);
  var podeAdd = fin && rs.aposCorte && valor>0 && f.conta && rs.falta>0.009 && valor <= rs.falta+0.009;
  var jan = p.jan, kmTxt = rs.itens.length===0 ? "sem atendimentos no período"
    : rs.kmTarde ? "km enviado fora do prazo: paga na próxima data"
    : rs.kmAtras>0 && !(rs.km>0) ? "inclui o km do período anterior, enviado fora do prazo"
    : rs.km>0 ? arred(rs.km)+" km · "+(rs.preco>0 ? arred(rs.litros)+" litros × "+BK(rs.preco) : "falta o preço da gasolina")
    : "a representante ainda não enviou o km";
  var corteTxt = new Date(rs.corte).toLocaleString("pt-BR",{day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"});
  var mostraForm = rs.aPagar>0.009 && !rs.paga && rs.aposCorte;
  return e("div",{className:"flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2 text-[13px]"},
    e("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-1"},
      e("span",{className:"whitespace-nowrap"}, "Atendimentos de "+fmtDataBR(jan.ini).slice(0,5)+" a "+fmtDataBR(jan.fim).slice(0,5)+" · Combustível: "+kmTxt),
      rs.diretos.map(function(it){ return e("span",{key:it.id, className:"whitespace-nowrap", style:{color:COR_OK}}, "Pix direto de "+it.rev+" · "+BK(it.valorPago)); }),
      rs.lista.map(function(g,i){ return e("span",{key:i, className:"inline-flex items-center gap-2 whitespace-nowrap", style:{color:COR_OK}},
        "Pago: "+((formas.find(function(x){ return x.k===g.forma; })||{}).label||g.forma)+" · "+g.conta+" · "+fmtDataBR(g.data)+" · "+BK(g.valor)+" · "+quemNome(g.por),
        fin && e("button",{type:"button", onClick:function(){ d({type:"COMIS_FECH_PAG", key:key, del:i}); }, "aria-label":"Desfazer pagamento", title:"Desfazer pagamento", className:"text-[13px] text-foreground hover:text-primary"}, "×")); })),
    e("div",{className:"flex flex-wrap items-center justify-end gap-2"},
      et.n===1 && e("span",{className:"whitespace-nowrap", style:{color:COR_FALTA}}, (et.falta===1 ? "Falta 1 conferência" : "Faltam "+et.falta+" conferências")+" para liberar tudo"),
      rs.aPagar>0.009 && !rs.paga && !rs.aposCorte && e("span",{className:"whitespace-nowrap", style:{color:COR_FALTA}}, "O pagamento libera depois do corte: "+corteTxt),
      rs.paga && e("span",{className:"whitespace-nowrap font-semibold", style:{color:COR_OK}}, "● Paga"),
      mostraForm && e("select",{value:f.forma, disabled:!fin, "aria-label":"Forma do pagamento", className:CAMPO+" w-32! cursor-pointer", onChange:function(ev){ setF(Object.assign({}, f, {forma:ev.target.value, conta:""})); }},
        formas.filter(function(x){ return x.k!=="pix_representante" && x.k!=="acerto_loja"; }).map(function(x){ return e("option",{key:x.k, value:x.k}, x.label); })),
      mostraForm && e("select",{value:f.conta, disabled:!fin, "aria-label":"Conta de saída", className:CAMPO+" w-64! cursor-pointer", onChange:function(ev){ setF(Object.assign({}, f, {conta:ev.target.value})); }},
        e("option",{value:""},"Conta de saída"), forma.descricoes.map(function(x){ return e("option",{key:x, value:x}, x); })),
      mostraForm && e("input",{type:"date", value:f.data, disabled:!fin, "aria-label":"Data do pagamento", className:CAMPO+" w-36! [color-scheme:dark]", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }}),
      mostraForm && e(MoneyInput,{value:valor, sm:true, disabled:!fin, label:"Valor pago", className:"w-32", onChange:function(v){ setF(Object.assign({}, f, {valor:v})); }}),
      mostraForm && e("span",{className:"inline-flex "+(p.brilha && f.conta ? "comis-brilha" : "")},
        e(Botao,{principal:true, desabilitado:!podeAdd, title:!f.conta ? "Escolha a conta de saída" : "Registrar pagamento",
          onClick:function(){ d({type:"COMIS_FECH_PAG", key:key, por:s.usuario, pag:{forma:f.forma, conta:f.conta, data:f.data, valor:valor}}); setF(Object.assign({}, f, {valor:0})); }}, "Registrar pagamento"))));
}

// Bloco de uma representante numa data de pagamento: fileira com os números dela, as revendedoras (uma linha por pagamento) e a linha de pagar
function BlocoRep(p){
  var s = p.s, d = p.d, c = p.c, rs = p.rs, fin = p.fin, et = p.et, dv = useState(null), divAb = dv[0], setDivAb = dv[1];
  var formas = s.formasPagamento||[], travada = (rs.lista||[]).length>0, pct = pctDaRep(c, p.rep);
  var contasDe = function(k, atual){ var f = formas.find(function(x){ return x.k===k; }), l = f ? f.descricoes.slice() : p.contas.slice(); if(atual && l.indexOf(atual)<0) l.unshift(atual); return l; };
  var confirma = function(it, conta){ if(!fin) return d({type:"AVISO", txt:"Só o financeiro e a supervisão fazem a conciliação"}); d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, conta:conta, por:s.usuario}); };
  var itens = rs.itens.slice().sort(function(x, y){ return x.r.data.localeCompare(y.r.data) || x.r.id.localeCompare(y.r.id); });
  var nRev = itens.map(function(i){ return i.r.id; }).filter(function(x, i, a){ return a.indexOf(x)===i; }).length;
  var cel = "flex h-8 items-center justify-center whitespace-nowrap border-l px-3 text-[13px] tabular-nums first:border-l-0 "+FIO;
  var par = function(r, v, cor, title){ return e("div",{className:cel, title:title}, r, e("b",{className:"ml-1.5", style:cor ? {color:cor} : undefined}, v)); };
  var cab = e("div",{role:"button", tabIndex:0, "aria-expanded":p.aberto, onClick:p.alt, onKeyDown:function(ev){ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); p.alt(); } },
      className:"grid cursor-pointer bg-[#1c1d21] hover:bg-white/5", style:{gridTemplateColumns:"minmax(11rem,1fr) 8rem 10rem 10.5rem 9.5rem 8.5rem 10.5rem 9.5rem"}},
    e("div",{className:cel+" font-semibold text-primary", style:{boxShadow:"inset 4px 0 0 "+(et.cor || "#4b4e57")}}, (p.aberto ? "▾ " : "▸ ")+p.rep),   // barra na cor da situação
    e("div",{className:cel}, nRev+(nRev===1 ? " revendedora" : " revendedoras")),
    par("Comissão", BK(rs.comissaoTotal), COR_OURO),
    par("Combustível", rs.comb>0.009 ? BK(rs.comb) : "sem km"),
    par("A pagar", BK(rs.aPagar), null, "Comissão já conferida mais o combustível"),
    par("Pago", BK(rs.pagos), rs.pagos>0.009 ? COR_OK : null),
    rs.falta<-0.009 ? par("Pago a mais", BK(-rs.falta)) : par("Restante", BK(Math.max(0, rs.falta)), rs.falta>0.009 ? COR_RUIM : null),
    e("div",{className:cel+" font-semibold", style:et.cor ? {color:et.cor} : undefined}, et.cor ? "● " : "", et.txt));
  // Tabela das revendedoras: TabelaPlanilha (filtro e ordem em cada coluna). Cada célula tem largura mínima fixa, para as colunas ficarem alinhadas de um bloco para o outro.
  // UMA LINHA POR REVENDEDORA (acerto). Um pagamento só: confere na própria linha. Dois ou mais: a linha mostra o total e os pagamentos abrem ao clicar.
  var para = function(ev){ ev.stopPropagation(); };   // clicar num campo não abre nem fecha a linha
  var cx = function(larg, filho, brilha){ return e("span",{className:"inline-flex items-center justify-center gap-2 "+larg+(brilha ? " comis-brilha" : "")}, filho); };
  var contaTxt = function(it){ return it.tipo!=="pag" ? it.status+" · comissão fixa" : it.pixRep ? "Pix para "+(it.dest||"a representante") : (it.fin ? it.fin.conta : it.conta)+(it.extra ? " · pago depois" : ""); };
  var confTxt = function(it){ return it.pixRep ? "Pix direto · entra em Pago" : it.loja ? "Sem pagamento · Inadimplência" : it.confirmado ? "Conferido" : it.motivo ? it.motivo.replace("Aguardando o agendamento conferir", "Aguardando o agendamento") : "Falta conferir"; };
  var contaCel = function(it){ var pode = fin && marcavel(it) && it.tipo==="pag";   // a forma não tem coluna: o nome da conta já diz (PIX, LINK, DINHEIRO)
    return pode ? e("select",{id:"conta-"+it.id, defaultValue:it.conta, onClick:para, "aria-label":"Conta em que entrou", className:CAMPO+" cursor-pointer border-0 bg-transparent text-center"}, contasDe(it.forma, it.conta).map(function(x){ return e("option",{key:x, value:x}, x); })) : contaTxt(it); };
  var confCel = function(it){
    if(it.pixRep || it.loja || (it.motivo && !it.confirmado)) return e("span",{style:{color:it.pixRep ? COR_OK : it.loja ? COR_RUIM : COR_FALTA}}, confTxt(it));
    if(it.confirmado) return e("label",{onClick:para, className:"inline-flex items-center gap-2", style:{color:COR_OK}},
      e("input",{type:"checkbox", checked:true, disabled:!fin || travada, className:"size-[18px] cursor-pointer accent-primary", "aria-label":"Desfazer conferência de "+it.rev, title:travada ? "Já tem pagamento registrado nesta data" : "Desfazer",
        onChange:function(){ d({type:"COMIS_FIN", id:it.r.id, idx:it.chave, ok:false}); }}), quemNome(it.fin.por)+" · "+dataHora(it.fin.ts));
    return e("label",{onClick:para, className:"inline-flex items-center gap-2", style:{color:COR_FALTA}},
      e("span",{className:"inline-flex "+(p.brilhaId===it.id ? "comis-brilha" : "")}, e("input",{type:"checkbox", checked:false, disabled:!fin, className:"size-[18px] cursor-pointer accent-primary", "aria-label":"Conferir o pagamento de "+it.rev,
        onChange:function(){ var el = document.getElementById("conta-"+it.id); confirma(it, el ? el.value : it.conta); }})), "Falta conferir"); };
  var divCel = function(it){ return e("span",{onClick:para, className:"inline-flex"}, e(Divergencia,{it:it, d:d, fin:fin, aberto:divAb===it.id, abrir:function(){ setDivAb(divAb===it.id ? null : it.id); }})); };
  var grupos = {}, ordemAc = []; itens.forEach(function(it){ if(!grupos[it.r.id]){ grupos[it.r.id] = []; ordemAc.push(it.r.id); } grupos[it.r.id].push(it); });
  var linhas = ordemAc.map(function(id){ var its = grupos[id], um = its.length===1 ? its[0] : null, normais = its.filter(function(i){ return !i.loja && !i.pixRep; }), ok = normais.filter(function(i){ return i.confirmado; }).length;
    var pags = its.filter(function(i){ return i.tipo==="pag"; }), nDiv = its.filter(function(i){ return i.div; }).length, bloq = its.filter(function(i){ return i.motivo && !i.confirmado; })[0];
    return {id:id, its:its, um:um, rev:its[0].rev, data:fmtDataBR(its[0].r.data).slice(0,5), conta:um ? contaTxt(um) : its.length+" pagamentos",
      valor:pags.length ? pags.reduce(function(t, i){ return t+i.valorPago; }, 0) : "", comissao:normais.length ? normais.reduce(function(t, i){ return t+i.comissao; }, 0) : "",
      conf:um ? confTxt(um) : its.some(marcavel) || !bloq ? ok+" de "+normais.length+" conferidos" : confTxt(bloq), okTudo:normais.length>0 && ok===normais.length, falta:its.some(marcavel),
      div:um ? (um.div ? (um.div.tipo==="valor" ? "Valor corrigido" : um.div.tipo==="conta" ? "Conta corrigida" : "Não identificado") : "") : nDiv ? nDiv+(nDiv===1 ? " divergência" : " divergências") : ""}; });
  var cols = [
    {k:"rev", t:"Revendedora", render:function(v, l, ab2){ return cx("min-w-[19.5rem]", (l.um ? "" : ab2 ? "▾ " : "▸ ")+v); }},
    {k:"data", t:"Data", render:function(v){ return cx("min-w-[3.5rem]", v); }},
    {k:"conta", t:"Conta em que entrou", render:function(v, l){ return cx("min-w-[14.5rem]", l.um ? contaCel(l.um) : e("b",null, v)); }},
    {k:"valor", t:"Valor", render:function(v){ return cx("min-w-[6.5rem] tabular-nums", v==="" ? "—" : BK(v)); }},
    {k:"comissao", t:"Comissão "+pct+"%", render:function(v){ return cx("min-w-[6.5rem] tabular-nums text-[#F3D98B]", v==="" ? "—" : BK(v)); }},
    {k:"conf", t:"Conferido", render:function(v, l, ab2){ return cx("min-w-[14rem]", l.um ? confCel(l.um) : e("span",{style:{color:l.okTudo ? COR_OK : COR_FALTA}}, v),
      !l.um && !ab2 && l.its.some(function(i){ return i.id===p.brilhaId; })); }},   // linha fechada com o próximo check dentro: o brilho fica no resumo dela
    {k:"div", t:"Divergência", render:function(v, l){ return cx("min-w-[8rem]", l.um ? divCel(l.um) : (v ? e("span",{style:{color:COR_FALTA}}, v) : "—")); }}];
  // os pagamentos de quem tem mais de um: abre embaixo da linha da revendedora
  var celD = "flex h-8 items-center justify-center whitespace-nowrap px-2.5 text-[13px] tabular-nums";
  var detalhe = function(l){ if(l.um) return null;
    return e("div",{className:"overflow-x-auto rounded-md border "+FIO}, l.its.map(function(it, i){
      return e("div",{key:it.id, className:"grid "+(i ? "border-t "+FIO : "")+(marcavel(it) ? " bg-[#FBBF24]/10" : ""), style:{gridTemplateColumns:"minmax(10rem,1fr) 16rem 8rem 8rem 16rem 10rem", minWidth:"68rem"}},
        e("div",{className:celD}, "Pagamento "+(i+1)+" de "+l.its.length), e("div",{className:celD}, contaCel(it)), e("div",{className:celD}, it.tipo==="pag" ? BK(it.valorPago) : "—"),
        e("div",{className:celD+" text-[#F3D98B]"}, it.loja || it.pixRep ? "—" : BK(it.comissao)), e("div",{className:celD}, confCel(it)), e("div",{className:celD}, divCel(it))); })); };
  var itDiv = divAb ? itens.filter(function(i){ return i.id===divAb; })[0] : null;
  return e("div",{className:"flex flex-col gap-1 rounded-lg "+(p.foco ? "ring-1 ring-primary ring-offset-2 ring-offset-background" : "")},
    e("div",{className:"overflow-x-auto rounded-lg border "+FIO}, e("div",{style:{minWidth:"78rem"}}, cab)),
    p.aberto && e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, centro:true, semContagem:true, vazio:"Nenhum atendimento nesta data.",
      detalhe:detalhe, detAberto:function(l){ return !l.um && l.falta; },
      linhaCls:function(l){ return l.falta ? "bg-[#FBBF24]/10" : l.okTudo ? "bg-[#34D399]/[.07]" : ""; }}),
    p.aberto && itDiv && e("div",{className:"overflow-hidden rounded-lg border "+FIO}, e(EditorDiv,{it:itDiv, d:d, s:s, contas:contasDe(itDiv.forma, itDiv.conta), fechar:function(){ setDivAb(null); }})),
    p.aberto && e("div",{className:"rounded-lg border "+FIO}, e(LinhaPagar,{s:s, d:d, rs:rs, fin:fin, et:et, rep:p.rep, data:p.data, jan:p.jan, brilha:p.brilhaPagar})));
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
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto, className:"flex min-h-8 w-full flex-wrap items-center justify-between gap-2 px-3 py-0.5 text-left"},
      e("span",{className:"inline-flex items-center gap-2 font-heading text-[13px] font-bold"}, e(Icon,{n:aberto ? "chevrondown" : "chevron", s:15}), "Relatório de taxas de deslocamento"),
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
  var vz = useState("pagar"), visao = vz[0], setVisao = vz[1], dz = useState(""), dataSel = dz[0], setDataSel = dz[1], gz = useState(false), gasAberto = gz[0], setGasAberto = gz[1];
  var mudaVisao = function(v){ if(v==="pagar" && mesN==="") setMesN(mesAtual.slice(5)); setVisao(v); };
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
  var kmGeral = dadosTodos.reduce(function(a,r){ return a+r.km; }, 0), atGeral = dadosTodos.reduce(function(a,r){ return a+r.at; }, 0), mediaGeral = atGeral>0 ? kmGeral/atGeral : null;
  var mediaDe = function(x){ return x.at>0 ? x.km/x.at : null; };
  // ── visão Pagar (Opção A): as datas de pagamento do mês e, na data escolhida, um bloco por representante que tem algo nessa data ──
  var ymSel = anoSel+"-"+(mesN || mesAtual.slice(5)), hojeIso = isoDia(hoje), gruposDaData = {};
  todasReps.forEach(function(n){ var g = grupoDaRep(c, n); datasDoMes(c, g, ymSel).forEach(function(dt){ var l = gruposDaData[dt] = gruposDaData[dt] || []; if(l.indexOf(g)<0) l.push(g); }); });
  var datasMes = Object.keys(gruposDaData).sort(), variosGrupos = datasMes.some(function(dt){ return gruposDaData[dt].join()!==gruposDaData[datasMes[0]].join(); });
  var linhasDe = function(dt){ return todasReps.filter(function(n){ return datasDoMes(c, grupoDaRep(c, n), ymSel).indexOf(dt)>=0; })
    .map(function(n){ var rs = resumoSituacao(c, itens, n, dt, agora); return {nome:n, rs:rs, et:etapaDe(rs)}; })
    .filter(function(x){ return x.rs.itens.length>0 || x.rs.aPagar>0.009 || x.rs.pagos>0.009; }); };
  var porData = {}; if(visao==="pagar") datasMes.forEach(function(dt){ porData[dt] = linhasDe(dt); });
  var comTrabalho = datasMes.filter(function(dt){ return (porData[dt]||[]).some(function(x){ return x.et.n===1 || x.et.n===2; }); });
  var passadas = datasMes.filter(function(dt){ return dt<=hojeIso; });
  var dataAtual = datasMes.indexOf(dataSel)>=0 ? dataSel : comTrabalho[0] || passadas[passadas.length-1] || datasMes[0] || "";
  var ordemEt = function(x){ return x.et.n===1 || x.et.n===2 ? 0 : x.et.n===0 ? 1 : 2; };
  var linhasPag = (porData[dataAtual]||[]).slice().sort(function(a, b){ return ordemEt(a)-ordemEt(b); });
  var guia = fin ? linhasPag.filter(function(x){ return ordemEt(x)===0; })[0] : null, guiaItem = guia ? guia.rs.itens.slice().sort(function(x, y){ return x.r.data.localeCompare(y.r.data) || x.r.id.localeCompare(y.r.id); }).filter(marcavel)[0] : null;
  var conta = function(k){ return linhasPag.filter(function(x){ return x.et.n===k; }).length; }, plural = function(k){ return k+(k===1 ? " representante" : " representantes"); };
  var etapaAgora = guia ? guia.et.n : 0, gas = c.gasolinaPR || {}, gasAtual = gas.em && isoDia(new Date(gas.em))===hojeIso;
  var opDatas = datasMes.map(function(dt){ return [dt, "Dia "+fmtDataBR(dt).slice(0,5)+(variosGrupos ? " · Grupo "+gruposDaData[dt].join(" e ") : "")]; });
  var abertoRep = function(x){ var a = abertos["p:"+dataAtual+"|"+x.nome]; return a!==undefined ? a : x.et.n!==3; };
  // 05/11/2026 (Marcus: "compacte e suba tudo"): filtros no topo, gasolina em uma linha, totais num BlocoResumo (lista escrita, sem faixa de cartões)
  var kmRep = repF==="todas" ? mediaGeral : mediaDe(dadosTodos[0]||{km:0,at:0});
  var corKm = repF==="todas" ? null : corMedia(kmRep, mediaGeral);
  var linhasResumo = [
    {r:"Vendido", v:BK(tVendido)}, {r:"Acerto", v:BK(tAcerto), cor:"ok"}, {r:"Pago", v:BK(tPago), cor:"ouro"},
    {r:"Inadimplência", v:BK(tInad), cor:tInad>0.009 ? "ruim" : undefined},
    {r:"Km por atendimento", v:kmRep!=null ? arred(kmRep) : "—", p:repF!=="todas" && mediaGeral!=null ? "geral "+arred(mediaGeral) : "", cor:corKm==="text-[#4ADE80]" ? "ok" : corKm==="text-[#F87171]" ? "ruim" : undefined},
    {r:"Representantes", v:String(todasReps.length)}];
  var passo = function(i, txt){ var on = etapaAgora===i, cor = [COR_FALTA, COR_RUIM, COR_OK][i-1];   // cada etapa tem a sua cor: amarelo conferir, vermelho pagar, verde pagas
    return e("div",{key:i, className:"flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-[13px] "+(on ? "border-primary bg-primary/10 font-semibold" : FIO), style:{boxShadow:"inset 0 -2px 0 "+cor}},
      e("span",{className:"grid size-[18px] place-items-center rounded-full text-[11px] font-bold text-[#111111]", style:{background:cor}}, i), txt); };
  return e(React.Fragment,null,
    e("style",null, ESTILO_BRILHO),
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e(PageHead,{t:"Comissões"}),
      e("div",{className:"flex flex-wrap items-center gap-2"},
        e(Segmentado,{opcoes:[["pagar", "Pagar"], ["resumo", "Resumo do mês"], ["pix", "Pix representante"]], atual:visao, onMudar:mudaVisao}),
        visao==="pagar" && opDatas.length>0 && (opDatas.length<=5 ? e(Segmentado,{opcoes:opDatas, atual:dataAtual, onMudar:setDataSel})
          : e("select",{value:dataAtual, "aria-label":"Data de pagamento", className:CAMPO+" w-48! cursor-pointer", onChange:function(ev){ setDataSel(ev.target.value); }}, opDatas.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
        visao==="resumo" && e("select",{value:repF, "aria-label":"Representante", className:CAMPO+" w-44! cursor-pointer", onChange:function(ev){ setRepF(ev.target.value); }},
          e("option",{value:"todas"},"Todas"), todasReps.map(function(n){ return e("option",{key:n, value:n}, n); })),
        visao!=="pix" && e("select",{value:mesN, "aria-label":"Mês", className:CAMPO+" w-32! cursor-pointer", onChange:function(ev){ setMesN(ev.target.value); setDataSel(""); }},
          visao==="resumo" && e("option",{value:""},"Ano todo"), MESES.map(function(m,i){ return e("option",{key:m, value:String(i+1).padStart(2,"0")}, m); })),
        visao!=="pix" && e("select",{value:anoSel, "aria-label":"Ano", className:CAMPO+" w-24! cursor-pointer", onChange:function(ev){ setAnoSel(ev.target.value); setDataSel(""); }}, anos.map(function(a){ return e("option",{key:a, value:a}, a); })),
        visao==="pagar" && e(Botao,{onClick:function(){ setGasAberto(!gasAberto); }, title:gasAtual ? "Preço da gasolina de hoje" : "Preço desatualizado: confira a ANP antes de pagar"}, gasAtual ? "Gasolina "+BK(gas.valor) : "Atualizar gasolina"),
        podeConfigComissao(s.usuario) && e(Botao,{onClick:p.aoConfig}, "Configurar"))),
    !fin && e("p",{className:"rounded-lg bg-warning/10 px-3 py-1.5 text-[13px] font-semibold text-warning"},"Você só consulta: os checks e pagamentos são do financeiro."),
    visao==="pagar" && gasAberto && e(AvisoGasolina,{s:s, d:d, c:c, fin:fin}),
    visao==="pagar" && e("div",{className:"grid grid-cols-3 gap-2"}, passo(1, "Conferir o que entrou · "+plural(conta(1))), passo(2, "Pagar a comissão · "+plural(conta(2))), passo(3, "Pagas · "+plural(conta(3)))),
    visao==="pagar" && fin && linhasPag.length>0 && e("div",{className:"flex h-8 items-center justify-center whitespace-nowrap rounded-md border px-3 text-[13px] font-semibold "+(guia ? "border-primary bg-primary/10" : FIO)},
      !guia ? (linhasPag.some(function(x){ return x.et.txt==="Aguardando"; }) ? "Nada a conferir agora: falta o agendamento confirmar o recebimento no Consolidado." : linhasPag.some(function(x){ return x.et.txt==="Antes do corte"; }) ? "Nada a pagar agora: o pagamento libera depois do corte." : "Tudo pago nesta data.")
      : guiaItem ? "▶ Comece aqui: "+guia.nome+" · marque o check de "+guiaItem.rev+" se o dinheiro entrou na conta"
      : "▶ Agora pague: "+guia.nome+" · "+BK(Math.max(0, guia.rs.falta))+" · escolha a conta de saída e clique em Registrar pagamento"),
    visao==="pagar" && (linhasPag.length===0 ? e("p",{className:"rounded-lg border px-3 py-3 text-center text-[13px] "+FIO}, "Nenhuma comissão nesta data.")
      : e("div",{className:"flex flex-col gap-2.5"}, linhasPag.map(function(x){ var ab2 = abertoRep(x), chave = "p:"+dataAtual+"|"+x.nome;
          return e(BlocoRep,{key:chave, s:s, d:d, c:c, rs:x.rs, et:x.et, fin:fin, contas:contas, rep:x.nome, data:dataAtual, jan:janelaDe(c, grupoDaRep(c, x.nome), dataAtual), aberto:ab2, alt:function(){ alt(chave, !ab2); },
            foco:guia===x, brilhaId:guia===x && guiaItem ? guiaItem.id : null, brilhaPagar:guia===x && !guiaItem}); }))),
    visao==="resumo" && e("div",{className:"grid grid-cols-1 items-start gap-2.5 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]"},
      e(BlocoResumo,{t:"Resumo · "+rotuloPeriodo, linhas:linhasResumo}),
      // valor que entrou em cada conta (antes ficava no Consolidado)
      e("section",{className:"overflow-hidden rounded-xl bg-black ring-1 ring-[#E8B84B]/25"},
        e("div",{className:"flex items-center justify-between border-b border-border px-3 py-1.5"}, e("h2",{className:"font-heading text-[13px] font-bold"},"Recebido por conta"),
          e("span",{className:"text-[13px]"}, rotuloPeriodo+" · pago "+BK(tPago))),
        e("div",{className:"flex max-h-[16rem] flex-col gap-1 overflow-y-auto p-3"},
          barras.length===1 && tPago<=0 ? e("p",{className:"text-[13px]"},"Nenhum pagamento lançado no mês.") : null,
          barras.map(function(x){
            return e("div",{key:x.nome, className:"grid grid-cols-[minmax(8rem,17rem)_minmax(0,1fr)_7.5rem] items-center gap-3"},
              e("span",{className:"whitespace-nowrap text-[13px] font-semibold "+(x.inad ? "text-destructive" : "")}, x.nome),
              e("div",{className:"h-3.5 overflow-hidden rounded bg-muted/50"}, e("div",{className:"h-full rounded "+(x.inad ? "bg-destructive" : "bg-primary"), style:{width:Math.max(x.v>0 ? 1.5 : 0, x.v/maxBarra*100)+"%"}})),
              e("b",{className:"text-right text-[13px] tabular-nums "+(x.inad ? "text-destructive" : "")}, BK(x.v))); })))),
    visao==="resumo" && e(RelatorioTaxas,{s:s, noPeriodo:noPeriodo, repF:repF, rotulo:rotuloPeriodo}),
    visao==="resumo" && reps.map(function(n){ return e(ErrosRep,{key:n, s:s, rep:n}); }),
    visao==="resumo" && e(PainelRegras,{usuario:s.usuario, aoConfig:p.aoConfig}),
    visao==="pix" && e(PixRepresentante,{s:s, d:d, fin:fin, itens:itens, nomes:todasReps}));
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
  var vs = useState("rep"), visao = vs[0], setVisao = vs[1];   // antes do return condicional (ordem dos hooks)
  if(conf && podeConfigComissao(s.usuario)) return e(React.Fragment,null,
    e("div",{className:"flex items-center gap-3"}, e(Btn,{v:"secondary", sm:true, onClick:function(){ setConf(false); }}, "← Voltar às comissões")),
    e(PageHead,{t:"Configurar comissões dos representantes", sub:"As regras ficam em cima e, embaixo, as configurações para mexer. Só o Marcus altera; o texto das regras muda sozinho."}),
    e(AbaRegrasRepresentantes),
    e("section",{className:"rounded-xl bg-card p-3 ring-2 ring-[#E8B84B]/40"}, e(AbaConfigComissoes,{embutido:true})));
  // Kit novo (teste do novo fluxo): aba ao lado das comissões, só aparece com o teste ligado ou revendedoras marcadas
  var cN = comisEfetiva(s), temNf = !!(cN.nf && (cN.nf.ativo || (cN.nf.revs||[]).length));
  return e(React.Fragment,null,
    temNf && e("div",{className:"mb-3 flex"}, e(Segmentado,{opcoes:[["rep", "Representantes"], ["kitnovo", "Kit novo"]], atual:visao, onMudar:setVisao})),
    temNf && visao==="kitnovo" ? e(ComissoesKitNovo) : e(AbaComissoesBase,{aoConfig:function(){ setConf(true); }}));
}
export { AbaComissoes };
