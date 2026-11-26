// Sorelly Admin · kits novos Curitiba — pages/Kits.js
// Telas do Kits novos: Kits novos (Quadro e Planilha), Representantes e Entregues (cada uma com a sua entrada no menu).
// KITS NOVOS REFEITA NO PADRÃO DA CONTAS A PAGAR (24/11/2026, pedido do Marcus: "mesmas regras das telas do Financeiro, fontes tudo alinhado"): os dois blocos (Resumo do mês e Por etapa) em cima,
// e embaixo UM bloco azul com a barra de menus (Buscar, Visão, Etapa, Região, Representante, Mês, Situação) e a tabela da planilha da Michele com TODAS as colunas dela, filtro e ordem em cada coluna.
// O botão Nova revendedora fica no canto esquerdo da barra azul do bloco. O Quadro (cartões por etapa) continua na visão Quadro.
import { AbasTela, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { BarraTabela, BuscaMini, CampoMini, CelulaBarra, CLS_FINA_ESPACO, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { nomePropio as np } from "@/apps/montagem/lib/nome-conta";
import { BKC } from "@/apps/montagem/lib/format";
import { Filtros, REGIOES, anoDe, filtrar, regiaoDe } from "@/apps/kits-novos/components/filtros";
import { Entregues } from "@/apps/kits-novos/components/entregues";
import { KPIs, PorEtapa, ResumoAno } from "@/apps/kits-novos/components/kpis";
import { Quadro } from "@/apps/kits-novos/components/quadro";
import { Representantes } from "@/apps/kits-novos/components/representantes";
import { ETAPAS, aberto, atrasado, colunasQuadro, diasNaEtapa, seguro } from "@/apps/kits-novos/domain/etapas";
import { dataBR, tsDe } from "@/apps/kits-novos/lib/datas";
import { enderecoDe, foneContato, titulo, trabalhoDe } from "@/apps/kits-novos/domain/padroniza";
import { use } from "@/apps/kits-novos/state/context";
import { PageHead } from "@/apps/kits-novos/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var MODOS = ["quadro","planilha"];
// raiz da tela: cola nas bordas, nada em caixa alta, linhas brancas e azul padrão do Financeiro
// os três blocos colados e separados por linhas brancas em T: uma vertical entre os dois de cima e uma horizontal entre eles e o bloco de baixo
var RAIZ = "-mx-4 -mb-4 -mt-4 md:-mx-6 md:-mb-6 md:-mt-6 flex flex-col gap-0 [&_*]:!normal-case [&>div>section]:!rounded-none [&>div>section]:!border-0 [&>div>section:not(:last-child)]:md:!border-r-2 [&>div>section:not(:last-child)]:!border-white [&>section]:!rounded-none [&>section]:!border-0 [&>section]:!border-t-2 [&>section]:!border-white [&>section:first-child>div]:!min-h-8 [&>section:first-child>div]:!border-b-2 [&>section:first-child>div]:!border-white [&>section:first-child_h2]:!text-[16px] "+PADRAO_BLOCOS;   // padrao-ok: título da tela maior, pedido do Marcus em 26/11/2026
var sn = function(v){ return v===true || v==="True" || v==="true" ? "Sim" : v===false || v==="False" || v==="false" ? "Não" : ""; };
var dtx = function(v){ return v ? dataBR(v) : "—"; };
// Datas das etapas só com dia e mês (Marcus, 24/11/2026): o ano vem do seletor Ano da barra. Ordenar continua pela data inteira.
var diaMes = function(v){ if(!v) return "—"; var p = String(v).split("-"); return p.length===3 ? p[2]+"/"+p[1] : String(v); };
var tx = function(v){ return v || "—"; };

// LETRA NORMAL (Marcus, 24/11/2026: "não quero caixa alta em nenhum lugar"): a planilha tem campos inteiros em maiúscula (VEM NA EMPRESA, FALTA LIGAR E COLOCAR NO CRM, 06/01 ÀS 13:30...).
// normal() deixa em letra normal só o que veio TODO em maiúscula (frase com a primeira letra grande; siglas voltam em maiúscula); o que já veio normal fica como está.
var SIGLAS = /\b(crm|cnpj|cpf|pf|pj|mei|bb|pix|pr|sc|sp|rs|ltda|epp)\b/gi;
// Palavras que vêm de vários jeitos na planilha viram um só (24/11/2026, pedido do Marcus: "Pós venda tem várias coisas assim"): Pós Venda / Pós venda / pos-venda -> Pós-venda; Link Tree / LinkTree -> Linktree;
// "30/09 AS 10:00" e "06/03 ÁS 09:00" -> "30/09 às 10:00"; só traços ("-----") -> vazio; ponto final solto sai.
function uniforme(s){
  if(/^[-–—_.\s]+$/.test(s)) return "";
  return s.replace(/\bp[oó]s[\s-]*venda\b/gi, "Pós-venda").replace(/\blink\s*tree\b/gi, "Linktree").replace(/(\d)\s*[aàá]s\s*(\d)/gi, "$1 às $2").replace(/\.$/, "");
}
function normal(v){ var s = String(v == null ? "" : v).trim().replace(/\s+/g, " "); if(!s) return ""; if(s===s.toUpperCase() && /[A-ZÀ-Ú]{2}/.test(s)){ var l = s.toLowerCase().replace(SIGLAS, function(m){ return m.toUpperCase(); }); s = l.charAt(0).toUpperCase()+l.slice(1); } return uniforme(s); }
// Observação: separa o que vem misturado (expositor, falta ligar e colocar no CRM) do resto
function obsDe(v){ var partes = String(v || "").split("|").map(function(x){ return x.trim(); }).filter(Boolean), r = {expo:"", pend:"", resto:[]};
  partes.forEach(function(x){ if(/falta ligar/i.test(x)) r.pend = normal(x); else if(/expositor/i.test(x)) r.expo = normal(x); else r.resto.push(normal(x)); }); r.resto = r.resto.join(" · "); return r; }
// Disponibilidade: "Kit novo - Disponibilidade 23/11 a 01/12" vira só "23/11 a 01/12"
function dispDe(v){ var s = normal(v); return s.replace(/^kit novo\s*[-–]\s*disponibilidade\s*/i, ""); }
// Entrada: o número comprido é o código do anúncio; Linktree e LinkTree viram um só
function entradaDe(v){ var s = String(v || "").trim(); if(/^\d{10,}$/.test(s)) return {ent:"Anúncio", anuncio:s}; if(/^link\s*tree$/i.test(s)) return {ent:"Linktree", anuncio:""}; return {ent:normal(s), anuncio:""}; }
// Observação da entrada: separa quem INDICOU, o protocolo (Cadastro ou Pós-venda) e o resto
function nomeBonito(v){ return String(v || "").trim().split(/ +/).map(function(w, i){ var l = w.toLowerCase(); return i>0 && /^(de|da|do|dos|das|e)$/.test(l) ? l : l.charAt(0).toUpperCase()+l.slice(1); }).join(" "); }
function origemDe(v, ent){ var s = String(v || "").trim(), r = {indicada:"", protocolo:"", resto:""};
  if(/^indica[cç][aã]o/i.test(s)){ var q = s.replace(/^indica[cç][aã]o\s*[-:]?\s*(rev\.?|revendedora)?\s*[-:]?\s*/i, ""); r.indicada = q ? nomeBonito(q) : "Sem nome"; }
  else if(/^(cadastro|p[oó]s[- ]?venda)$/i.test(s)) r.protocolo = normal(s);
  else if(s && ent==="Indicação" && /^[A-Za-zÀ-ú .'-]+$/.test(s)) r.indicada = nomeBonito(s);   // entrada por indicação e só um nome na observação: é quem indicou
  else r.resto = s ? nomeBonito(normal(s)) : "";
  return r; }

// Grupos de colunas (barra em cima dos nomes): a soma dos spans é o número de colunas (39)
var GRUPOS = [[{t:"Revendedora", span:4}, {t:"Fluxo das etapas (dia/mês)", span:6}, {t:"Andamento", span:3}, {t:"Kit", span:4}, {t:"Trabalho", span:4}, {t:"Disponibilidade e observações", span:4}, {t:"Contatos de referência", span:6}, {t:"Endereço e telefone (DevMaster)", span:4}, {t:"Origem do cadastro", span:7}]];
// "cor sim, cor não": os grupos 1º, 3º, 5º... ganham um tom de azul-céu (na barra do grupo e nos nomes das colunas dele); os outros ficam sem cor
var TOM = "rgba(14,165,233,.40)";
function comTons(cols){ var i = 0; GRUPOS[0].forEach(function(g, gi){ for(var q = 0; q<g.span; q++){ if(gi%2===0) cols[i].corFundo = TOM; i++; } g.cor = gi%2===0 ? TOM : undefined; }); return cols; }
// As colunas da planilha da Michele, na ordem dela, com a observação e a entrada separadas em colunas próprias
// Dados que a DevMaster já tem (campo dm, anexado pelo script anexar-devmaster-kitsnovos.mjs)
function dmx(c, k){ return c && c.dm && c.dm[k] ? String(c.dm[k]) : ""; }
function cepx(v){ return v.length===8 ? v.slice(0, 5)+"-"+v.slice(5) : v; }
function telx(v){ return v.length===11 ? "("+v.slice(0, 2)+") "+v.slice(2, 7)+"-"+v.slice(7) : v.length===10 ? "("+v.slice(0, 2)+") "+v.slice(2, 6)+"-"+v.slice(6) : v; }
function colunas(){
  return [{k:"dmCod", t:"Código DevMaster", render:tx}, {k:"nome", t:"Nome"}, {k:"cid", t:"Cidade", render:tx}, {k:"bai", t:"Bairro", render:tx}, {k:"cad", t:"Cadastro", fmt:diaMes, render:diaMes}, {k:"lib", t:"Liberado", fmt:diaMes, render:diaMes}, {k:"sol", t:"Solicitado", fmt:diaMes, render:diaMes}, {k:"bip", t:"Bipado", fmt:diaMes, render:diaMes},
    {k:"ret", t:"Entregue", fmt:diaMes, render:diaMes}, {k:"dev", t:"Retorno", fmt:diaMes, render:diaMes}, {k:"etapa", t:"Status"}, {k:"dias", t:"Dias na etapa", render:tx},
    {k:"prazo", t:"Prazo", cor:function(l){ return l.prazo==="Atrasado" ? "text-[#F87171]" : ""; }, render:tx},
    {k:"rep", t:"Representante", render:function(v){ return v || "Sem representante"; }},
    {k:"mod", t:"Modelo do kit", render:tx}, {k:"val", t:"Valor do kit", fmt:BKC}, {k:"retirada", t:"Retirada na empresa", render:tx}, {k:"sit", t:"Situação", render:tx}, {k:"prof", t:"Profissão", render:tx, max:220}, {k:"trab", t:"Local de trabalho", render:tx, max:240}, {k:"trabEnd", t:"Endereço do trabalho", render:tx, max:260},
    {k:"disp", t:"Disponibilidade", render:tx}, {k:"expo", t:"Expositor", render:tx}, {k:"pend", t:"Pendência", render:tx}, {k:"obs", t:"Observação", render:tx},
    {k:"c1n", t:"Contato 1", render:tx}, {k:"c1t", t:"Telefone 1", render:tx}, {k:"c2n", t:"Contato 2", render:tx}, {k:"c2t", t:"Telefone 2", render:tx}, {k:"c3n", t:"Contato 3", render:tx}, {k:"c3t", t:"Telefone 3", render:tx},
    {k:"dmEnd", t:"Endereço", render:tx}, {k:"dmBai", t:"Bairro", render:tx}, {k:"dmCep", t:"CEP", render:tx}, {k:"dmTel", t:"Telefone", render:tx},
    {k:"tipo", t:"Tipo", render:tx}, {k:"op", t:"Operador", render:tx}, {k:"ent", t:"Entrada", render:tx}, {k:"anuncio", t:"Código do anúncio", render:tx}, {k:"indicada", t:"Indicada por", render:tx}, {k:"protocolo", t:"Protocolo", render:tx}, {k:"obs2", t:"Observação da entrada", render:tx}];
}

function linhasDe(dados, cfg){
  return dados.slice().sort(function(a, b){ return (tsDe(b.cad)||0)-(tsDe(a.cad)||0); }).map(function(c){
    var et = ETAPAS.find(function(x){ return x.k===c.st; }), ob = obsDe(c.obs), en = entradaDe(c.ent), og = origemDe(c.obs2, en.ent), tr = trabalhoDe(c);
    return {id:String(c.id), reg:c.reg || REGIOES[0], cad:c.cad || "", lib:c.lib || "", sol:c.sol || "", bip:c.bip || "", ret:c.ret || "", dev:c.dev || "",
      etapa:c.st==="cancelado" ? "Cancelado" : seguro(c) ? "Aguardando peça" : et ? et.nome : String(c.st || ""), dias:aberto(c) ? diasNaEtapa(c)+(diasNaEtapa(c)===1 ? " dia" : " dias") : "", prazo:aberto(c) ? (seguro(c) ? "Aguardando peça" : atrasado(c, cfg) ? "Atrasado" : "No prazo") : "",
      nome:titulo(c.nome), cid:titulo(c.cid), bai:titulo(c.bai), rep:c.rep ? titulo(c.rep) : "", mod:normal(c.mod), val:c.val || 0, retirada:normal(c.retirada), sit:c.sit || "", prof:tr.prof, trab:tr.local, trabEnd:tr.end,
      disp:dispDe(c.disp), expo:ob.expo, pend:ob.pend, obs:[ob.resto, c.trabAviso].filter(Boolean).join(" · "), c1n:titulo(c.c1n), c1t:telx(foneContato(c.c1t)), c2n:titulo(c.c2n), c2t:telx(foneContato(c.c2t)), c3n:titulo(c.c3n), c3t:telx(foneContato(c.c3t)), dmCod:dmx(c,"cod"), dmEnd:enderecoDe(dmx(c,"end")), dmBai:titulo(dmx(c,"bai")), dmCep:cepx(dmx(c,"cep")), dmTel:telx(foneContato(dmx(c,"tel"))), tipo:normal(c.tipo), op:np(normal(c.op)), ent:en.ent, anuncio:en.anuncio, indicada:og.indicada, protocolo:og.protocolo, obs2:og.resto}; });
}

// Tela Kits novos
function AbaKits(p){
  var rs = useState(true), resumos = rs[0], setResumos = rs[1];
  var cx = use(), s = cx.state, d = cx.dispatch, modo =MODOS.indexOf(s.modo)>=0 ? s.modo : "quadro"; // modos antigos (fluxo, representantes, entregues) valem como quadro
  var anoAtual = String(new Date().getFullYear()), anoSel = s.filtro.ano===undefined ? anoAtual : s.filtro.ano;
  var sa = Object.assign({}, s, {filtro:Object.assign({}, s.filtro, {ano:anoSel})});
  var anos = []; s.dados.forEach(function(c){ var a = anoDe(c); if(a && anos.indexOf(a)<0) anos.push(a); }); if(anos.indexOf(anoAtual)<0) anos.push(anoAtual); anos.sort().reverse();
  var dados = filtrar(sa), plan = modo==="planilha", f = s.filtro, up = function(k, v){ var o = {}; o[k] = v; d({type:"FILTRO", f:o}); };
  var base = filtrar(Object.assign({}, sa, {filtro:Object.assign({}, sa.filtro, {st:""})}));
  var contar = function(k){ return base.filter(function(c){ return !k || c.st===k; }).length; };
  var etapas = [["", "Todas "+contar("")]].concat(colunasQuadro().map(function(x){ return [x.k, x.nome+" "+contar(x.k)]; }));
  var regs = REGIOES.filter(function(r){ return s.dados.some(function(c){ return regiaoDe(c)===r; }); });
  var ops = function(lista, todos){ return [["", todos]].concat(lista.map(function(o){ return [o, o]; })); };
  var atras = s.dados.filter(function(c){ return atrasado(c, s.cfg); }).length;
  var algum = f.busca || f.st || f.reg || f.rep || f.cid || f.mes || f.ent || f.so || anoSel!==anoAtual;
  var barra = e(BarraTabela,null,
    e(CelulaBarra,{rotulo:"Cadastro"}, e("button",{type:"button", onClick:function(){ d({type:"DIALOGO", d:{tipo:"nova"}}); }, className:"whitespace-nowrap rounded border font-semibold text-white"}, "Nova revendedora")),
    e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{valor:f.busca, aoMudar:function(v){ up("busca", v); }, ph:"Nome, bairro, cidade ou representante", rotulo:"Buscar nos kits novos"})),
    e(CelulaBarra,{rotulo:"Visão"}, e(CampoMini,{valor:modo, aoMudar:function(m){ d({type:"MODO", modo:m}); }, rotulo:"Visão", ops:[["quadro", "Quadro"], ["planilha", "Planilha"]]})),
    plan && e(CelulaBarra,{rotulo:"Etapa"}, e(CampoMini,{valor:f.st || "", aoMudar:function(v){ up("st", v); }, rotulo:"Etapa", ops:etapas})),
    regs.length>1 && e(CelulaBarra,{rotulo:"Região"}, e(CampoMini,{valor:f.reg || "", aoMudar:function(v){ up("reg", v); }, rotulo:"Região", ops:ops(regs, "Todas")})),
    e(CelulaBarra,{rotulo:"Representante"}, e(CampoMini,{valor:f.rep || "", aoMudar:function(v){ up("rep", v); }, rotulo:"Representante", ops:ops(p.listas.reps, "Todas")})),
    e(CelulaBarra,{rotulo:"Ano"}, e(CampoMini,{valor:anoSel, aoMudar:function(v){ up("ano", v); }, rotulo:"Ano", ops:[["", "Todos"]].concat(anos.map(function(a){ return [a, a]; }))})),
    e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:f.mes || "", aoMudar:function(v){ up("mes", v); }, rotulo:"Mês", ops:ops(p.listas.meses, "Todos")})),
    e(CelulaBarra,{rotulo:"Situação"}, e(CampoMini,{valor:f.so || "", aoMudar:function(v){ up("so", v); }, rotulo:"Situação", ops:[["", "Todas"], ["abertos", "Em aberto"], ["atrasadas", "Atrasadas ("+atras+")"], ["aguardando", "Aguardando peça ("+s.dados.filter(seguro).length+")"]]})),
    algum && e(CelulaBarra,{rotulo:"Filtros"}, e("button",{type:"button", onClick:function(){ d({type:"FILTRO", f:{busca:"", st:"", reg:"", rep:"", cid:"", mes:"", ent:"", so:"", ano:anoAtual}}); }, className:"whitespace-nowrap rounded border font-semibold text-white"}, "Limpar")));
  var cols = comTons(colunas());
  var rodape = function(ls){ var r = []; for(var i = 0; i<cols.length; i++) r.push(""); r[0] = "Total · "+ls.length+(ls.length===1 ? " kit" : " kits"); r[cols.findIndex(function(c){ return c.k==="val"; })] = BKC(ls.reduce(function(t, l){ return t+l.val; }, 0)); return r; };
  return e("div",{className:RAIZ},
    e(BlocoPainel,{titulo:"Kits novos", compacto:true, fechado:true, aoTitulo:function(){ setResumos(!resumos); }, dir:resumos ? "Fechar resumos ▴" : "Abrir resumos ▾"}),   // a linha do topo é o nome da tela; clicar nela abre e fecha os 3 blocos (sempre abre aberto)
    resumos && e("div",{className:"grid grid-cols-1 items-stretch gap-0 md:grid-cols-3 [&>section]:h-full"}, e(KPIs), e(PorEtapa), e(ResumoAno,{ano:anoSel || anoAtual})),
    e(BlocoPainel,{titulo:"Revendedoras novas", compacto:true},
      barra,
      plan ? e("div",{ref:refCheia(), className:CLS_FINA_ESPACO+" [&_table_thead_tr:first-child]:[scroll-snap-align:start]"}, e(TabelaPlanilha,{cols:cols, cabAcima:GRUPOS, alturaMax:"calc(100vh - 12rem)", linhas:linhasDe(dados, s.cfg), chave:"id", fina:true, grade:true, semContagem:true, semLimpar:true, semCaixaAlta:true, semMao:true, limite:300, totalRodape:rodape,
          aoClicar:function(l){ d({type:"DIALOGO", d:{tipo:"detalhe", id:l.id}}); }, linhaCls:function(){ return "!cursor-pointer"; }, vazio:"Nenhum kit novo neste filtro."}))
        : e(Quadro,{dados:dados})));
}

// Telas próprias no menu Kits novos (antes eram botões dentro da tela Kits novos)
function AbaKitsRepresentantes(p){
  return e(React.Fragment,null,
    e(PageHead,{t:"Representantes", sub:"Controle de kits e recusas, fluxo, regiões, horários, viagens e indicação."}),
    e(Representantes,{listas:p.listas}));
}
function AbaKitsEntregues(p){
  var s = use().state;
  return e(React.Fragment,null,
    e(PageHead,{t:"Entregues", sub:"Kits novos já entregues, do mais recente para o mais antigo."}),
    e(Filtros,{listas:p.listas, ocultar:["so"]}),
    e(Entregues,{dados:filtrar(s)}));
}

export { AbaKits, AbaKitsRepresentantes, AbaKitsEntregues };
