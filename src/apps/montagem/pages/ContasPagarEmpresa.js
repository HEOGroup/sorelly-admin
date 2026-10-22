// Sorelly Admin · montagem — pages/ContasPagarEmpresa.js
// Financeiro → Contas a pagar. Abre na SORELLY (empresa): total, os 4 CNPJs e Por fora. No topo, um seletor leva para a FAMÍLIA ou para SORELLY + FAMÍLIA.
// O DevMaster já traz as contas da família pagas pela empresa; "Sorelly + família" = Sorelly + só o que está no familiar e não no DevMaster (conciliação). Metas de Pix e salários dos sócios ficam em bloco à parte.
import { BlocoBarra as BlocoBase } from "@/apps/montagem/components/equipe-blocos";
// nesta tela os blocos são fixos (não abrem nem fecham) e o valor vai junto do título, não solto no canto
function BlocoBarra(p){ return e(BlocoBase, Object.assign({}, p, {fixo:true, t:typeof p.t==="string" && p.dir ? p.t+" · "+p.dir : p.t})); }
import { Abas, BarraFiltros, Faixa, Indicador, Pagina, Tab, Td, LINHA, degrade, ESTADO } from "@/apps/montagem/components/padrao";
import { funcionarios } from "@/apps/montagem/domain/pessoas";
import { PessoasRep } from "@/apps/montagem/pages/FolhaFuncionarias";
import { FILIAIS, G, SETOR_PAI, setPf, naturezasConhecidas, agrupar, conciliar, ehFam, filtrar, meses, porFilial, setClasse, setBaixas, setLancamentos, totais, temDados } from "@/apps/montagem/domain/contas-empresa";
import { ACESSO_FF, hojeIso, hojeYm, membrosFamilia, nomeMes, parcelasDe, pixDoMes, totaisPersona } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { AbaFfContas, AbaFfPagas } from "@/apps/montagem/pages/FinFamiliar";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { e, Fragment, useEffect, useState } from "@/shared/react";

var TabN = function(p){ return e(Tab, Object.assign({normal:true}, p)); };
var IndicadorN = function(p){ return e(Indicador, Object.assign({normal:true}, p)); };
var AZUL = "#3B82F6";
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };
var rotMes = function(ym){ return ym ? nomeMes(ym) : "Todos os meses"; };
var SITUACOES = [["", "Todas"], ["pago", "Pagas"], ["apagar", "A pagar"]];
var chip = function(txt, cor){ var c = ESTADO[cor] || cor; return e("span",{className:"inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", style:{background:c+"26", color:c}}, txt); };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var pct = function(v, t){ return (t>0 ? v/t*100 : 0).toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
var ms0 = function(){ var m = meses(); return m.indexOf(hojeYm())>=0 ? hojeYm() : (m[m.length-1] || ""); };   // mês aberto por padrão
var somaT = function(a, b){ return {pago:r2(a.pago+b.pago), apagar:r2(a.apagar+b.apagar), total:r2(a.total+b.total), nPago:a.nPago+b.nPago, nApagar:a.nApagar+b.nApagar, n:a.n+b.n}; };
var parteFam = function(f, status){ return status==="pago" ? {pago:f.pago, apagar:0, total:f.pago, nPago:f.nPago, nApagar:0, n:f.nPago} : status==="apagar" ? {pago:0, apagar:f.apagar, total:f.apagar, nPago:0, nApagar:f.nApagar, n:f.nApagar} : f; };
var botaoCard = function(on, extra){ return "flex min-w-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-center transition hover:brightness-125 "+(on ? "ring-2 ring-[#3B82F6]" : "ring-1 ring-white/10")+" "+(extra||""); };

// ───────────── Grupos → naturezas → contas (com a marcação Sorelly / Família em cada conta) ─────────────
function GruposTabela(p){
  var grupos = agrupar(p.lista), cx = use(), d = cx.dispatch;
  if(!grupos.length) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-5 text-center text-[14px]"}, p.vazio || "Nenhuma conta neste filtro.");
  var base = p.baseTotal || r2(grupos.reduce(function(t, g){ return t+g.total; }, 0));
  var detalhe = function(g, chave){
    return e(BlocoBarra,{key:chave, cor:"azul", compacto:true, t:g.grupo+(p.sufixo||""), dir:BK(g.total)+" · "+pct(g.total, base)},
      e("div",{className:"p-2"}, e(TabN,{cols:["Natureza", "Pago", "Falta pagar", "Total", "% do total"]}, g.nats.map(function(n){
        var k = p.pref+"|"+g.grupo+"|"+n.cod, ab = !!p.abertas[k];
        return [e("tr",{key:k, onClick:function(){ p.alterna(k); }, className:LINHA+" cursor-pointer hover:bg-white/5"},
          e(Td,{forte:true}, n.nome+" ", e("span",{className:"text-[11px] font-normal text-white/50"}, n.cod+(ab ? " ▲" : " ▾"))), e(Td,{dinheiro:true, cor:n.pago>0 ? "ok" : undefined}, BK(n.pago)), e(Td,{dinheiro:true, cor:n.apagar>0 ? "alerta" : undefined}, BK(n.apagar)), e(Td,{dinheiro:true, forte:true}, BK(n.total)), e(Td,null, pct(n.total, base))),
          ab && e("tr",{key:k+"d"}, e("td",{colSpan:5, className:"bg-black/25 p-2"}, e(TabN,{cols:["Situação", "Data", "Título", "Prefixo", "Valor", "De quem é"]}, n.itens.map(function(i){
            var pago = i.status==="pago", atr = !pago && i.atraso>0, fam = ehFam(i);
            return e("tr",{key:i.id, className:LINHA},
              e(Td,null, pago ? chip("Pago", "ok") : atr ? chip("Atrasada "+i.atraso+"d", "ruim") : chip("A pagar", "alerta")),
              e(Td,{cor:i.outroMes ? "alerta" : undefined}, pago ? "Pago em "+br(i.baixa)+(i.outroMes ? " · vence "+br(i.venc) : "") : "Vence "+br(i.venc)),
              e(Td,{className:"max-w-[22rem] truncate"}, i.nome), e(Td,null, i.pref),
              e(Td,{dinheiro:true}, BK(i.valor), !pago && i.valorTitulo-i.valor>0.005 && e("span",{className:"block text-[10.5px] font-normal text-white/50"}, "de "+BK(i.valorTitulo))),
              e(Td,null, p.edita ? e("select",{value:fam ? "familia" : "sorelly", "aria-label":"De quem é esta conta", className:INPUT+" h-8! w-28 cursor-pointer px-2! text-[12px]!", onChange:function(ev){ var v = ev.target.value; d({type:"CPE_CLASSE", chave:i.chave, valor:(v==="familia")===i.pessoalPadrao ? "" : v}); }}, e("option",{value:"sorelly"}, "Sorelly"), e("option",{value:"familia"}, "Família")) : (fam ? "Família" : "Sorelly")));
          }))))];
      }))));
  };
  if(!p.resumo) return grupos.map(function(g){ return detalhe(g, p.pref+g.grupo); });
  // modo "só totais": tudo fechado, uma barra por grupo com o valor e a porcentagem do total; clicar abre o grupo
  return grupos.map(function(g){
    var k = "r|"+p.pref+g.grupo, ab = !!p.abertas[k], largura = base>0 ? Math.max(2, Math.round(g.total/base*100)) : 0;
    return e("div",{key:k, className:"flex flex-col gap-1.5"},
      e("button",{type:"button", onClick:function(){ p.alterna(k); }, title:"Abrir ou fechar o grupo", className:"relative w-full overflow-hidden rounded-xl px-3 py-2 text-left ring-1 ring-[#3B82F6]/40 transition hover:brightness-125", style:degrade(AZUL)},
        e("span",{className:"absolute inset-y-0 left-0 bg-[#3B82F6]/15", style:{width:largura+"%"}}),
        e("span",{className:"relative flex items-center justify-between gap-3"}, e("span",{className:"text-[13.5px] font-bold"}, (ab ? "▲ " : "▾ ")+g.grupo+(p.sufixo||"")), e("span",{className:"flex items-center gap-3"}, e("b",{className:MONO+" text-[14px]"}, BK(g.total)), e("span",{className:MONO+" min-w-[4.5rem] rounded-lg bg-black/30 px-2 py-0.5 text-center text-[13px] font-bold", style:{color:ESTADO.info}}, pct(g.total, base))))),
      ab && detalhe(g, k+"d"));
  });
}

// dono de cada conta da família: Marcus, Anamaria, Marco Antonio, Ana Beatriz; o resto (casas, viagem...) fica em "Casas, viagem e outros"
var PESSOAS = [["Marcus", /MARCUS/i, "marcus"], ["Anamaria", /ANAMARIA/i, "anamaria"], ["Marco Antonio", /MARCO ANTONIO|MARCO ANTÔNIO/i, "marco"], ["Ana Beatriz", /ANA BEATRIZ/i, "anabeatriz"]];
var donoDe = function(i){ var t = PESSOAS.find(function(q){ return q[1].test(i.natNome); }) || PESSOAS.find(function(q){ return q[1].test(i.nome); }); return t ? t[0] : "Casas, viagem e outros"; };
// Pix revendedoras de um sócio no mês, só em 2 grupos: contas do próprio sócio (Nubank, Caixa...) e enviado direto para terceiros (por fornecedor)
function pixDestinos(ff, pid, mes){
  var cb = function(id){ return (ff.contasBanc||[]).find(function(c){ return c.id===id; }) || {}; }, pr = function(id){ return ((ff.prest||[]).find(function(x){ return x.id===id; })||{}).nome; };
  var proprias = {}, terceiros = {}, ok = function(dt){ return !mes || String(dt).slice(0,7)===mes; };
  (ff.pix||[]).filter(function(x){ return x.personaId===pid && ok(x.data) && x.auditoria!=="REJEITADO"; }).forEach(function(x){ var c = cb(x.contaId); if(c.prestadorId){ var n = pr(c.prestadorId) || c.nome; terceiros[n] = (terceiros[n]||0)+x.valor; } else { var n2 = c.nome || "Sem conta informada"; proprias[n2] = (proprias[n2]||0)+x.valor; } });
  (ff.repasses||[]).filter(function(r){ return r.origemPixPersonaId===pid && !r.origemPixLancId && ok(r.data); }).forEach(function(r){ var n = pr(r.prestId) || "Outros"; terceiros[n] = (terceiros[n]||0)+r.valor; });
  var lista = function(o){ return Object.keys(o).map(function(k){ return {nome:k, valor:r2(o[k])}; }).sort(function(a, b){ return b.valor-a.valor; }); };
  var P = lista(proprias), T = lista(terceiros);
  return {proprias:P, terceiros:T, totalProprias:r2(P.reduce(function(t, x){ return t+x.valor; }, 0)), totalTerceiros:r2(T.reduce(function(t, x){ return t+x.valor; }, 0))};
}

// ───────────── Tabela de análise de custos: uma linha por grupo (pago, falta, total, % do total, barra); clicar abre ─────────────
// o que se soma numa linha só dentro de um grupo (clica e abre por fornecedor ou por conta): [chave, título, teste da natureza, abre por natureza (senão por fornecedor)]
var MESCLAS = [["alug", "Aluguéis (total, todas as salas)", function(n){ return /aluguel/i.test(n.nome); }, false], ["viag", "Viagens (Ponta Grossa, Joinville, Balneário Camboriú...)", function(n){ return /^3\.16\.0[1-7]/.test(n.cod); }, true], ["emp", "Empréstimos (total)", function(n){ return /^6\.01/.test(n.cod); }, true], ["equip", "Móveis, equipamentos e informática", function(n){ return /^3\.05/.test(n.cod); }, true], ["veic", "Veículos", function(n){ return /^3\.07/.test(n.cod); }, true]];
// aluguéis: uma linha por CNPJ (34, 46, 59, 67), somando; abrindo, aparecem as contas com a observação das salas
var nomeCnpj = function(id){ var f = FILIAIS.find(function(q){ return q[0]===id; }); return id==="34" ? "CNPJ 34 · Sorelly" : id==="46" ? "CNPJ 46 · Mayz" : f ? f[1] : id; };
var SUPER_GRUPO = {}; SUPER_GRUPO[G.enc] = G.folha; SUPER_GRUPO[G.rep] = G.folha; SUPER_GRUPO[G.bruto] = "Matéria-prima"; SUPER_GRUPO[G.banho] = "Matéria-prima";
var GRUPOS_FORN = [G.bruto, G.banho, G.grafico, G.outros];   // nestes grupos a lista abre POR FORNECEDOR (uma linha cada) e, dentro, com nota / sem nota
function TabelaCustos(p){
  var linhas;
  if(p.porSetor){   // relatório por SETORES: quanto cada setor custa em pessoal (salário, vale, bônus, férias...); clicar abre por funcionária
    var porS = {}; p.lista.filter(function(i){ return i.setor; }).forEach(function(i){ (porS[i.setor] = porS[i.setor] || []).push(i); });
    var mapaS = {}, ordS = [];   // Link de pagamento e Kits novos ficam dentro de Cadastro de revendedoras
    Object.keys(porS).forEach(function(k){
      var pai = SETOR_PAI[k] || k, m = mapaS[pai];
      if(!m){ m = mapaS[pai] = {chave:"setor|"+pai, nome:pai, pago:0, apagar:0, total:0, n:0, lista:[], partes:[], setor:true}; ordS.push(pai); }
      var t = totais(porS[k]); m.pago = r2(m.pago+t.pago); m.apagar = r2(m.apagar+t.apagar); m.total = r2(m.total+t.total); m.n += t.n; m.lista = m.lista.concat(porS[k]); m.partes.push({setor:k, lista:porS[k]});
    });
    linhas = ordS.map(function(k){ return mapaS[k]; });
  } else {
    // grupos que abrem dentro de outro (pedido do Marcus, 20/10/2026): Encargos da folha e Representantes ficam dentro de Folha e pessoal; Bruto e Banho dentro de Matéria-prima
    var mapa = {}, ordemG = [];
    agrupar(p.lista).forEach(function(g){
      var sup = SUPER_GRUPO[g.grupo] || g.grupo, m = mapa[sup];
      if(!m){ m = mapa[sup] = {chave:sup, nome:sup, pago:0, apagar:0, total:0, n:0, lista:[], subs:[]}; ordemG.push(sup); }
      var li = p.lista.filter(function(i){ return i.grupo===g.grupo; });
      m.pago = r2(m.pago+g.pago); m.apagar = r2(m.apagar+g.apagar); m.total = r2(m.total+g.total); m.n += g.n; m.lista = m.lista.concat(li); m.subs.push({grupo:g.grupo, lista:li, total:g.total});
    });
    linhas = ordemG.map(function(k){ return mapa[k]; });
  }
  if(!p.porSetor && p.familia && p.familia.n>0) linhas.push({chave:"__familia", nome:"Família", pago:p.familia.pago, apagar:p.familia.apagar, total:p.familia.total, n:p.familia.n, lista:p.listaFam, familia:true});
  var base = r2(linhas.reduce(function(t, x){ return t+x.total; }, 0));
  linhas.sort(function(a, b){ return p.ordem==="asc" ? a.total-b.total : b.total-a.total; });
  if(!linhas.length) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-5 text-center text-[14px]"}, "Nenhuma conta neste filtro.");
  var maior = Math.max.apply(null, linhas.map(function(x){ return x.total; })) || 1;
  var d = use().dispatch;
  var itensLinhas = function(n, recuo){
    return n.itens.map(function(i){
      var pago = i.status==="pago", atr = !pago && i.atraso>0, fam = ehFam(i);
      var sub = i.natNome+" · "+(pago ? "Pago em "+br(i.baixa)+(i.outroMes ? " · vence "+br(i.venc) : "") : (atr ? "Atrasada "+i.atraso+" dias · vence " : "Vence ")+br(i.venc));
      return e("tr",{key:i.id, className:LINHA+" bg-black/30"},
        e(Td,{className:"w-8 px-1"}, ""),
        e(Td,{className:"text-left"}, e("div",{style:{marginLeft:recuo+"px"}}, e("div",{className:"max-w-[34rem] truncate text-[12.5px]"}, i.nome+(i.obs ? " · "+i.obs : "")), e("div",{className:"text-[11px]", style:{color:atr ? "#F97316" : pago ? ESTADO.ok : ESTADO.ruim}}, sub))),
        e(Td,{dinheiro:true}, BK(i.valor), !pago && i.valorTitulo-i.valor>0.005 && e("span",{className:"block text-[10.5px] font-normal text-white/50"}, "de "+BK(i.valorTitulo))),
        e(Td,{dinheiro:true, cor:"ok"}, pago ? BK(i.valor) : "—"), e(Td,{dinheiro:true, cor:"ruim"}, pago ? "—" : BK(i.valor)),
        e(Td,{cor:"info"}, pct(i.valor, base)),
        e(Td,null, p.edita ? e("select",{value:fam ? "familia" : "sorelly", "aria-label":"De quem é esta conta", className:INPUT+" h-8! w-28 cursor-pointer px-2! text-[12px]!", onChange:function(ev){ var v = ev.target.value; d({type:"CPE_CLASSE", chave:i.chave, valor:(v==="familia")===i.pessoalPadrao ? "" : v}); }}, e("option",{value:"sorelly"}, "Sorelly"), e("option",{value:"familia"}, "Família")) : (fam ? "Família" : "Sorelly")));
    });
  };
  // mantém a linha clicada no mesmo lugar da tela quando algo abre ou fecha (a tela não pula para cima)
  var firme = function(k, fn){ return function(ev){ var tr = ev.currentTarget, topo = tr.getBoundingClientRect().top; fn(); [0, 60, 200].forEach(function(ms){ setTimeout(function(){ var el = document.querySelector('[data-k="'+k+'"]'); if(el){ var dif = el.getBoundingClientRect().top - topo; if(Math.abs(dif)>1) window.scrollBy(0, dif); } }, ms); }); }; };
  var linhaTab = function(chave, rotulo, recuo, t, o){
    o = o || {}; var lg = Math.max(2, Math.round(t.total/maior*100));
    return e("tr",{key:chave, "data-k":chave, onClick:o.aoClicar ? firme(chave, o.aoClicar) : undefined, className:LINHA+(o.aoClicar ? " cursor-pointer hover:bg-white/5" : "")+" "+(o.fundo || "bg-black/20")},
      e(Td,{className:"w-8 px-1"}, ""),
      e(Td,{forte:!!o.forte, className:"text-left"}, e("span",{className:"text-[12.5px]", style:{marginLeft:recuo+"px"}}, rotulo), o.sub && e("span",{className:"ml-2 text-[11px] font-normal text-white/45"}, o.sub)),
      e(Td,{dinheiro:true, forte:!!o.forte}, BK(t.total)), e(Td,{dinheiro:true, cor:t.pago>0 ? "ok" : undefined}, t.pago>0.004 ? BK(t.pago) : "—"), e(Td,{dinheiro:true, cor:t.apagar>0 ? "ruim" : undefined}, t.apagar>0.004 ? BK(t.apagar) : "—"), e(Td,{cor:"info"}, pct(t.total, base)),
      e(Td,null, ""));
  };
  var alt = function(k){ return function(){ p.alterna(k); }; };
  // salário e adiantamento juntos, por funcionário (do que mais ganha ao que menos ganha)
  var funcLinhas = function(n, kn, recuo){
    var por = {}; n.itens.forEach(function(i){ var nome = n.cod==="alug" ? nomeCnpj(i.filial) : n.porNat ? i.natNome : String(i.nome).replace(/^pix\s+/i, "").replace(/\s+·.*$/, "").trim(), k = nome.toLowerCase(); (por[k] = por[k] || {nome:nome, itens:[]}).itens.push(i); });
    var lista = Object.keys(por).map(function(k){ var g = por[k]; return Object.assign({k:k, nome:g.nome, itens:g.itens}, totais(g.itens)); }).sort(function(a, b){ return b.total-a.total; });
    var out = [];
    lista.forEach(function(g){
      var kf = "f|"+kn+"|"+g.k, ab = !!p.abertas[kf], tipos = []; g.itens.forEach(function(i){ if(tipos.indexOf(i.natNome)<0) tipos.push(i.natNome); });
      out.push(linhaTab(kf, (ab ? "▲ " : "▾ ")+g.nome, recuo, g, {aoClicar:alt(kf), sub:n.cod==="emp" ? e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); d({type:"EMP_ABRIR", chave:g.nome}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold hover:bg-white/20"}, "Abrir em Empréstimos ›") : n.porNat ? "" : tipos.join(" + ")}));
      if(ab) out = out.concat(itensLinhas({itens:g.itens}, recuo+20));
    });
    return out;
  };
  // Pix revendedoras de um sócio: só 2 linhas (contas dele; terceiros direto) e cada uma abre
  var pixLinhas = function(ctx, kn, recuo){
    var D = pixDestinos(p.ff, ctx.pid, p.mes), out = [];
    [["proprias", "Para contas do "+ctx.nome.split(" ")[0]+" (Nubank, Caixa...)", D.proprias, D.totalProprias], ["terceiros", "Enviado direto para terceiros", D.terceiros, D.totalTerceiros]].forEach(function(g){
      var k = "x|"+kn+"|"+g[0], ab = !!p.abertas[k];
      out.push(linhaTab(k, (g[3]>0 ? (ab ? "▲ " : "▾ ") : "")+g[1], recuo, {pago:g[3], apagar:0, total:g[3]}, {aoClicar:g[3]>0 ? alt(k) : undefined, forte:true, fundo:"bg-black/25", sub:g[2].length ? g[2].length+(g[2].length===1 ? " destino" : " destinos") : ""}));
      if(ab) g[2].forEach(function(x){ out.push(linhaTab(k+"|"+x.nome, x.nome, recuo+20, {pago:x.valor, apagar:0, total:x.valor}, {fundo:"bg-black/35"})); });
    });
    return out;
  };
  // dentro de um fornecedor: só duas partes, COM nota (pago pelo CNPJ: boleto, cheque, transferência) e SEM nota (Pix revendedora)
  var notaLinhas = function(n, kn, recuo){
    var out = [];
    [["com", "Com nota (pago pelo CNPJ)"], ["sem", "Sem nota (Pix revendedora)"]].forEach(function(x){
      var sub = n.itens.filter(function(i){ return i.nota===x[0]; }); if(!sub.length) return;
      var k = kn+"|"+x[0], ab = !!p.abertas[k], cn = []; sub.forEach(function(i){ var f = (FILIAIS.find(function(q){ return q[0]===i.filial; })||[])[1]; if(f && cn.indexOf(f)<0) cn.push(f); });
      out.push(linhaTab(k, (ab ? "▲ " : "▾ ")+x[1], recuo, totais(sub), {aoClicar:alt(k), forte:true, fundo:"bg-black/25", sub:cn.join(" · ")}));
      if(ab) out = out.concat(itensLinhas({itens:sub}, recuo+20));
    });
    return out;
  };
  var naturezasDe = function(lista, chaveBase, recuo, ctx){
    var nats = []; agrupar(lista).forEach(function(g){ nats = nats.concat(g.nats); });
    var modoForn = GRUPOS_FORN.indexOf(chaveBase)>=0 && !(ctx && ctx.pid), modoSetor = false, semEspecial = !modoForn && !modoSetor;
    if(modoForn){
      var pf = {}; lista.forEach(function(i){ (pf[i.fornCanon] = pf[i.fornCanon] || []).push(i); });
      nats = Object.keys(pf).map(function(k){ return Object.assign({cod:"f|"+k, nome:k, itens:pf[k], porForn:true}, totais(pf[k])); });
    } else if(modoSetor){
      var ps = {}; lista.forEach(function(i){ var st = setorDe(String(i.nome).replace(/^pix\s+/i, "").trim()); (ps[st] = ps[st] || []).push(i); });
      nats = Object.keys(ps).map(function(k){ return Object.assign({cod:"setor|"+k, nome:k, itens:ps[k], func:true}, totais(ps[k])); });
    }
    var folha = nats.filter(function(n){ return n.cod==="3.01.01.02" || n.cod==="3.01.01.11"; });
    if(semEspecial && folha.length && !(ctx && ctx.pid)){ var its = []; folha.forEach(function(n){ its = its.concat(n.itens); }); nats = nats.filter(function(n){ return folha.indexOf(n)<0; }).concat([Object.assign({cod:"folha", nome:"Salário e adiantamento (por funcionário)", itens:its, func:true}, totais(its))]); }
    if(semEspecial && !(ctx && ctx.pid)) MESCLAS.forEach(function(m){
      var gr = nats.filter(function(n){ return m[2](n); }); if(gr.length<2) return;
      var ia = []; gr.forEach(function(n){ ia = ia.concat(n.itens); });
      nats = nats.filter(function(n){ return gr.indexOf(n)<0; }).concat([Object.assign({cod:m[0], nome:m[1], itens:ia, func:true, porNat:m[3]}, totais(ia))]);
    });
    nats.sort(function(a, b){ return p.ordem==="asc" ? a.total-b.total : b.total-a.total; });
    var out = [];
    nats.forEach(function(n){
      var kn = "n|"+p.pref+chaveBase+"|"+n.cod, abn = !!p.abertas[kn];
      out.push(linhaTab(kn, (abn ? "▲ " : "▾ ")+n.nome, recuo, n, {aoClicar:alt(kn), sub:n.func || n.porForn ? "" : n.cod}));
      if(abn){ if(n.porForn) out = out.concat(notaLinhas(n, kn, recuo+20)); else if(n.func) out = out.concat(funcLinhas(n, kn, recuo+20)); else if(ctx && ctx.pid && p.ff && /pix revendedoras/i.test(n.nome)) out = out.concat(pixLinhas(ctx, kn, recuo+20)); else out = out.concat(itensLinhas(n, recuo+20)); }
    });
    return out;
  };
  // grupo que reúne outros: cada parte vira uma linha que abre sozinha (ex.: Matéria-prima → Bruto e Banho)
  var subLinhas = function(x){
    var out = [];
    x.subs.slice().sort(function(a, b){ return b.total-a.total; }).forEach(function(sb){
      var k = "sg|"+p.pref+sb.grupo, ab = !!p.abertas[k];
      out.push(linhaTab(k, (ab ? "▲ " : "▾ ")+(sb.grupo===G.folha ? "Salários e benefícios" : sb.grupo), 6, totais(sb.lista), {aoClicar:alt(k), forte:true, fundo:"bg-black/25", sub:sb.lista.length+" contas"}));
      if(ab) out = out.concat(naturezasDe(sb.lista, sb.grupo, 24));
    });
    return out;
  };
  var linhasNaturezas = function(x){
    if(x.subs && x.subs.length>1) return subLinhas(x);
    if(x.setor){
      if(!x.partes || x.partes.length<2) return funcLinhas({itens:x.lista, cod:"setor"}, "s|"+p.pref+x.chave, 6);
      var outS = [];
      x.partes.forEach(function(pt){
        if(pt.setor===x.nome){ outS = outS.concat(funcLinhas({itens:pt.lista, cod:"setor"}, "s|"+p.pref+x.chave, 6)); return; }
        var ks = "ss|"+p.pref+pt.setor, abs = !!p.abertas[ks];
        outS.push(linhaTab(ks, (abs ? "▲ " : "▾ ")+pt.setor, 6, totais(pt.lista), {aoClicar:alt(ks), forte:true, fundo:"bg-black/25", sub:pt.lista.length+" contas"}));
        if(abs) outS = outS.concat(funcLinhas({itens:pt.lista, cod:"setor"}, ks, 24));
      });
      return outS;
    }
    if(!x.familia) return naturezasDe(x.lista, x.chave, 6);
    var por = {}; x.lista.forEach(function(i){ var n = donoDe(i); (por[n] = por[n] || []).push(i); });
    var nomes = Object.keys(por).map(function(n){ return {nome:n, lista:por[n], t:totais(por[n])}; });
    if(p.ana) nomes.push({nome:"Ana Beatriz", lista:[], t:p.ana, ana:true});
    nomes.sort(function(a, b){ return p.ordem==="asc" ? a.t.total-b.t.total : b.t.total-a.t.total; });
    var out = [];
    nomes.forEach(function(q){
      var kp = "p|"+p.pref+x.chave+"|"+q.nome, abp = !!p.abertas[kp], pes = PESSOAS.find(function(z){ return z[0]===q.nome; });
      out.push(linhaTab(kp, (abp ? "▲ " : "▾ ")+q.nome, 6, q.t, {aoClicar:alt(kp), forte:true, fundo:"bg-[#22D3EE]/10", barra:"bg-[#22D3EE]", sub:q.ana ? "meta de Pix revendedoras" : q.lista.length+" contas"}));
      if(abp){ if(q.ana) out = out.concat(pixLinhas({pid:"anabeatriz", nome:"Ana Beatriz"}, kp, 24)); else out = out.concat(naturezasDe(q.lista, x.chave+"|"+q.nome, 24, pes ? {pid:pes[2], nome:q.nome} : null)); }
    });
    return out;
  };
  var totalLinha = e("tr",{key:"t", className:LINHA+" bg-white/10"}, e(Td,null, ""), e(Td,{forte:true}, "Total"), e(Td,{dinheiro:true, forte:true}, BK(base)), e(Td,{dinheiro:true, cor:"ok", forte:true}, BK(r2(linhas.reduce(function(t, x){ return t+x.pago; }, 0)))), e(Td,{dinheiro:true, cor:"ruim", forte:true}, BK(r2(linhas.reduce(function(t, x){ return t+x.apagar; }, 0)))), e(Td,{forte:true}, "100,0%"), e(Td,null, ""));
  return e(BlocoBarra,{cor:"azul", compacto:true, t:p.porSetor ? "Custo de pessoal por setor" : (p.titulo || "Análise de custos por grupo"), dir:BK(base)}, e("div",{className:"p-2"},
    e(TabN,{cols:["#", p.porSetor ? "Setor" : "Grupo", "Total", "Pago", "Falta pagar", "% do total", "De quem é"]}, linhas.map(function(x, k){
      var ab = !!p.abertas["t|"+p.pref+x.chave], largura = Math.max(2, Math.round(x.total/maior*100));
      return [e("tr",{key:x.chave, "data-k":"t|"+p.pref+x.chave, onClick:firme("t|"+p.pref+x.chave, function(){ p.alterna("t|"+p.pref+x.chave); }), className:LINHA+" cursor-pointer hover:bg-white/5 "+(x.familia ? "bg-[#22D3EE]/5" : "")},
        e(Td,{className:"w-8 px-1 text-white/50"}, k+1), e(Td,{forte:true, className:"text-left"}, (ab ? "▲ " : "▾ ")+x.nome, e("span",{className:"ml-2 text-[11px] font-normal text-white/45"}, x.n+" contas")),
        e(Td,{dinheiro:true, forte:true}, BK(x.total)), e(Td,{dinheiro:true, cor:x.pago>0 ? "ok" : undefined}, BK(x.pago)), e(Td,{dinheiro:true, cor:x.apagar>0 ? "ruim" : undefined}, BK(x.apagar)),
        e(Td,{forte:true, cor:"info"}, pct(x.total, base)),
        e(Td,null, "")),
      ].concat(ab ? linhasNaturezas(x) : []);
    }).concat([totalLinha]))));
}

// ───────────── Visão por dia: o que vence no dia, o que está atrasado, o que foi pago no dia e antes, e os próximos dias ─────────────
function PorDia(p){
  var d = use().dispatch;
  var sd = useState(p.hoje), dia = sd[0], setDia = sd[1];
  var sa = useState({}), ab = sa[0], setAb = sa[1];
  var aberto = function(k, padrao){ return k in ab ? ab[k] : padrao; };
  var alterna = function(k, padrao){ var o = Object.assign({}, ab); o[k] = !aberto(k, padrao); setAb(o); };
  var mover = function(n){ var dt = new Date(dia+"T12:00:00"); dt.setDate(dt.getDate()+n); setDia(dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0")); };
  var fim7 = (function(){ var dt = new Date(dia+"T12:00:00"); dt.setDate(dt.getDate()+7); return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0"); })();
  var it = p.itens;
  var doDia = it.filter(function(i){ return i.status==="apagar" && i.venc===dia; });
  var atrasadas = it.filter(function(i){ return i.status==="apagar" && i.venc<dia; });
  var pagasDia = it.filter(function(i){ return i.status==="pago" && i.baixa===dia; });
  var pagasAntes = it.filter(function(i){ return i.status==="pago" && i.baixa<dia; });
  var proximos = it.filter(function(i){ return i.status==="apagar" && i.venc>dia && i.venc<=fim7; });
  var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
  var nomeFilial = function(id){ return (FILIAIS.find(function(f){ return f[0]===id; })||[])[1] || id; };
  var linhaItem = function(i, mostraDia){
    var pago = i.status==="pago", atr = !pago && i.atraso>0, fam = ehFam(i);
    return e("tr",{key:i.id, className:LINHA+" bg-black/20"},
      e(Td,null, pago ? chip("Pago", "ok") : i.venc<dia ? chip("Atrasada", "ruim") : chip("A pagar", "alerta")),
      e(Td,{className:"text-left"}, e("div",{className:"max-w-[30rem] truncate text-[12.5px]"}, i.nome), e("div",{className:"text-[11px] text-white/50"}, i.natNome+" · "+i.pref+(mostraDia ? (pago ? " · pago em "+br(i.baixa) : " · vence "+br(i.venc)) : ""))),
      e(Td,null, nomeFilial(i.filial)),
      e(Td,{dinheiro:true, forte:true}, BK(i.valor)),
      e(Td,null, p.edita ? e("select",{value:fam ? "familia" : "sorelly", "aria-label":"De quem é esta conta", className:INPUT+" h-8! w-28 cursor-pointer px-2! text-[12px]!", onChange:function(ev){ var v = ev.target.value; d({type:"CPE_CLASSE", chave:i.chave, valor:(v==="familia")===i.pessoalPadrao ? "" : v}); }}, e("option",{value:"sorelly"}, "Sorelly"), e("option",{value:"familia"}, "Família")) : (fam ? "Família" : "Sorelly")));
  };
  var porData = function(l, campo){ var o = {}; l.forEach(function(i){ (o[i[campo]] = o[i[campo]] || []).push(i); }); return Object.keys(o).sort(function(a, b){ return campo==="baixa" ? b.localeCompare(a) : a.localeCompare(b); }).map(function(k){ return {data:k, lista:o[k]}; }); };
  var secao = function(chave, titulo, lista, cor, padrao, agrupaCampo){
    var ok = aberto(chave, padrao), out = [];
    out.push(e("tr",{key:chave, onClick:function(){ alterna(chave, padrao); }, className:"cursor-pointer border-t-2 border-white/15 bg-white/5 hover:bg-white/10"},
      e("td",{colSpan:5, className:"px-2 py-2 text-left"}, e("span",{className:"text-[13.5px] font-bold", style:{color:cor}}, (ok ? "▲ " : "▾ ")+titulo), e("span",{className:"ml-3 text-[12px] text-white/55"}, lista.length+" contas"), e("span",{className:MONO+" float-right text-[14px] font-bold"}, BK(soma(lista))))));
    if(ok && !lista.length) out.push(e("tr",{key:chave+"v"}, e("td",{colSpan:5, className:"px-2 py-3 text-left text-[12.5px] text-white/55"}, "Nada neste grupo.")));
    if(ok && lista.length){
      if(!agrupaCampo) lista.slice().sort(function(a, b){ return b.valor-a.valor; }).forEach(function(i){ out.push(linhaItem(i, false)); });
      else porData(lista, agrupaCampo).forEach(function(g){ var kd = chave+"|"+g.data, okd = aberto(kd, false);
        out.push(e("tr",{key:kd, onClick:function(){ alterna(kd, false); }, className:LINHA+" cursor-pointer bg-black/25 hover:bg-white/5"}, e("td",{colSpan:5, className:"px-2 py-1.5 text-left"}, e("span",{className:"text-[12.5px] font-semibold"}, (okd ? "▲ " : "▾ ")+br(g.data)), e("span",{className:"ml-3 text-[11.5px] text-white/50"}, g.lista.length+" contas"), e("span",{className:MONO+" float-right text-[13px]"}, BK(soma(g.lista))))));
        if(okd) g.lista.slice().sort(function(a, b){ return b.valor-a.valor; }).forEach(function(i){ out.push(linhaItem(i, false)); }); });
    }
    return out;
  };
  var dtBr = function(iso){ var dt = new Date(iso+"T12:00:00"); return dt.toLocaleDateString("pt-BR", {weekday:"long", day:"2-digit", month:"long", year:"numeric"}); };
  var btn = "h-9 rounded-lg bg-white/10 px-3 text-[13px] font-bold hover:bg-white/20";
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e("button",{type:"button", className:btn, onClick:function(){ mover(-1); }, "aria-label":"Dia anterior"}, "‹"),
      e("input",{type:"date", value:dia, "aria-label":"Dia", className:INPUT+" h-9! w-44 text-center", onChange:function(ev){ if(ev.target.value) setDia(ev.target.value); }}),
      e("button",{type:"button", className:btn, onClick:function(){ mover(1); }, "aria-label":"Próximo dia"}, "›"),
      e("button",{type:"button", className:btn, onClick:function(){ setDia(p.hoje); }}, "Hoje"),
      e("span",{className:"ml-2 text-[13px] text-white/70"}, dtBr(dia))),
    e(Faixa,{n:5},
      e(IndicadorN,{t:"A pagar no dia", v:BK(soma(doDia)), cor:"alerta", sub:doDia.length+" contas"}),
      e(IndicadorN,{t:"Vencidas até ontem", v:BK(soma(atrasadas)), cor:atrasadas.length ? "ruim" : "neutro", sub:atrasadas.length+" contas"}),
      e(IndicadorN,{t:"Pagas no dia", v:BK(soma(pagasDia)), cor:"ok", sub:pagasDia.length+" pagamentos"}),
      e(IndicadorN,{t:"Pagas em dias anteriores", v:BK(soma(pagasAntes)), cor:"info", sub:pagasAntes.length+" pagamentos"}),
      e(IndicadorN,{t:"Próximos 7 dias", v:BK(soma(proximos)), cor:"total", sub:proximos.length+" contas"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Contas por dia", dir:BK(soma(doDia)+soma(atrasadas))}, e("div",{className:"p-2"},
      e(TabN,{cols:["Situação", "Conta", "CNPJ", "Valor", "De quem é"]}, [].concat(
        secao("dia", "A pagar no dia", doDia, ESTADO.alerta, true),
        secao("atraso", "Vencidas até ontem", atrasadas, ESTADO.ruim, false),
        secao("pagasdia", "Pagas no dia", pagasDia, ESTADO.ok, true),
        secao("antes", "Pagas em dias anteriores", pagasAntes, ESTADO.info, false, "baixa"),
        secao("prox", "Próximos 7 dias", proximos, "#F3D98B", false, "venc"))))));
}


// ───────────── Lançar conta nova (boleto, nota, conta fixa) e cadastro de fornecedores ─────────────
var TIPOS_CONTA = [["BOL", "Boleto"], ["NF", "Nota fiscal"], ["FIX", "Conta fixa (aluguel, luz...)"], ["PIX", "Pix / transferência"], ["OUT", "Outro"]];
var SAIDAS = ["Débito em conta Sicredi Atacadista", "Débito em conta Sicredi Serenity", "Débito em conta Itaú", "Pix", "Dinheiro", "Cartão", "Ainda não definido"];
var somaMes = function(iso, n){ var d = new Date(iso+"T12:00:00"); var dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); var ult = new Date(d.getFullYear(), d.getMonth()+1, 0).getDate(); d.setDate(Math.min(dia, ult)); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
function NovaConta(p){
  var cx = use(), d = cx.dispatch, forns = ((cx.state.cpe||{}).forn)||[];
  var s0 = useState({tipo:"BOL", fornId:"", numero:"", parcelas:"1", emissao:hojeIso(), venc:"", valor:"", nat:"", filial:"34", quem:"sorelly", saida:SAIDAS[0], centro:"", hist:""}), f = s0[0], setF = s0[1];
  var s1 = useState(false), novoForn = s1[0], setNovoForn = s1[1];
  var s2 = useState({nome:"", doc:"", dono:"cnpj", filial:"34", nat:""}), nf = s2[0], setNf = s2[1];
  var s3 = useState(""), erro = s3[0], setErro = s3[1];
  var nats = naturezasConhecidas();
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; setF(o); };
  var setN = function(k, v){ var o = Object.assign({}, nf); o[k] = v; setNf(o); };
  var forn = forns.find(function(x){ return x.id===f.fornId; });
  var escolheForn = function(id){ var x = forns.find(function(q){ return q.id===id; }), o = Object.assign({}, f, {fornId:id}); if(x){ o.filial = x.dono==="particular" ? "fora" : x.filial; o.quem = x.dono==="particular" ? "familia" : "sorelly"; if(x.nat) o.nat = x.nat; } setF(o); };
  var salvaForn = function(){ if(!nf.nome.trim()){ setErro("Escreva o nome do fornecedor."); return; } var id = "f"+Date.now(); d({type:"CPE_FORN_SET", forn:Object.assign({id:id}, nf, {nome:nf.nome.trim()})}); setNovoForn(false); setErro(""); setF(Object.assign({}, f, {fornId:id, filial:nf.dono==="particular" ? "fora" : nf.filial, quem:nf.dono==="particular" ? "familia" : "sorelly", nat:nf.nat || f.nat})); };
  var salvar = function(){
    var v = parseFloat(String(f.valor).replace(/\./g, "").replace(",", ".")), n = Math.max(1, parseInt(f.parcelas, 10) || 1);
    if(!forn){ setErro("Escolha o fornecedor (ou cadastre um novo)."); return; }
    if(!(v>0)){ setErro("Informe o valor."); return; }
    if(!f.venc){ setErro("Informe o vencimento."); return; }
    var nt = nats.find(function(x){ return x[0]===f.nat; }), tipoNome = (TIPOS_CONTA.find(function(x){ return x[0]===f.tipo; })||[])[1];
    var parcela = Math.round(v/n*100)/100, itens = [];
    for(var k = 0; k<n; k++){
      var valor = k===n-1 ? Math.round((v-parcela*(n-1))*100)/100 : parcela;
      itens.push({id:"n"+Date.now()+"-"+k, filial:f.filial, nat:f.nat || "3.99.99.99", natNome:nt ? nt[1] : "Sem natureza definida", pref:f.tipo, forn:forn.nome, nome:forn.nome+" · "+tipoNome+(f.numero ? " "+f.numero : "")+(n>1 ? " · parcela "+(k+1)+"/"+n : ""), venc:somaMes(f.venc, k), valor:valor, status:"apagar", fam:f.quem==="familia", saida:f.saida, centro:f.centro, hist:f.hist, emissao:f.emissao});
    }
    d({type:"CPE_LANC_ADD", itens:itens}); p.fechar();
  };
  var campo = function(rot, el, larg){ return e("label",{className:"flex flex-col gap-1 "+(larg||""), key:rot}, e("span",{className:"text-[11.5px] font-semibold text-white/70"}, rot), el); };
  var inp = function(k, tipo, extra){ return e("input",Object.assign({type:tipo||"text", value:f[k], className:INPUT+" h-9! w-full", onChange:function(ev){ set(k, ev.target.value); }}, extra||{})); };
  var sel = function(k, ops){ return e("select",{value:f[k], className:INPUT+" h-9! w-full cursor-pointer", onChange:function(ev){ set(k, ev.target.value); }}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var optNat = function(){ return nats.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[0]+" "+x[1]); }); };
  var col = function(n){ return {1:"sm:col-span-1", 2:"sm:col-span-2", 3:"sm:col-span-3", 4:"sm:col-span-4", 5:"sm:col-span-5", 6:"sm:col-span-6", 12:"sm:col-span-12"}[n]; };
  var cel = function(n, rot, el){ return campo(rot, el, col(n)); };
  var CI = INPUT+" h-9! w-full text-[13px]!";
  var optCnpj = FILIAIS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); });
  return e("div",{className:"fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:"w-full max-w-3xl rounded-2xl border border-white/15 bg-[#14171c] p-4 shadow-2xl"},
      e("div",{className:"mb-3 flex items-center"}, e("h3",{className:"text-[16px] font-bold text-white"}, "Lançar conta nova"), e("button",{type:"button", onClick:p.fechar, className:"ml-auto h-8 rounded-lg px-3 text-[12.5px] font-bold ring-1 ring-white/20 hover:bg-white/10"}, "Fechar")),
      e("div",{className:"grid grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-12"},
        cel(2, "Tipo", sel("tipo", TIPOS_CONTA)),
        cel(5, "Fornecedor", e("div",{className:"flex gap-1.5"}, e("select",{value:f.fornId, className:CI+" min-w-0 flex-1 cursor-pointer", onChange:function(ev){ escolheForn(ev.target.value); }}, e("option",{value:""}, forns.length ? "Escolher..." : "Nenhum cadastrado"), forns.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome+(x.dono==="particular" ? " (particular)" : "")); })), e("button",{type:"button", onClick:function(){ setNovoForn(!novoForn); }, className:"h-9 shrink-0 rounded-lg px-2.5 text-[12px] font-bold ring-1 ring-white/20 hover:bg-white/10"}, novoForn ? "Cancelar" : "+ Novo"))),
        cel(3, "Número do título", inp("numero")),
        cel(2, "Parcelas", inp("parcelas", "number", {min:1, max:60})),
        novoForn && e("div",{key:"nf", className:"grid grid-cols-1 gap-x-2 gap-y-2 rounded-xl bg-white/5 p-2.5 sm:col-span-12 sm:grid-cols-12"},
          campo("Nome do fornecedor", e("input",{value:nf.nome, className:CI, onChange:function(ev){ setN("nome", ev.target.value); }}), "sm:col-span-5"),
          campo("CPF ou CNPJ", e("input",{value:nf.doc, className:CI, onChange:function(ev){ setN("doc", ev.target.value); }}), "sm:col-span-3"),
          campo("De quem é", e("select",{value:nf.dono, className:CI+" cursor-pointer", onChange:function(ev){ setN("dono", ev.target.value); }}, e("option",{value:"cnpj"}, "CNPJ da empresa"), e("option",{value:"particular"}, "Particular (família)")), "sm:col-span-2"),
          nf.dono==="cnpj" ? campo("CNPJ", e("select",{value:nf.filial, className:CI+" cursor-pointer", onChange:function(ev){ setN("filial", ev.target.value); }}, FILIAIS.filter(function(x){ return x[0]!=="fora"; }).map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })), "sm:col-span-2") : e("span",{key:"vz", className:"sm:col-span-2"}),
          campo("Natureza usual (opcional)", e("select",{value:nf.nat, className:CI+" cursor-pointer", onChange:function(ev){ setN("nat", ev.target.value); }}, e("option",{value:""}, "—"), optNat()), "sm:col-span-9"),
          e("div",{key:"bt", className:"flex items-end sm:col-span-3"}, e("button",{type:"button", onClick:salvaForn, className:"h-9 w-full rounded-lg px-4 text-[12.5px] font-bold text-white", style:{background:AZUL}}, "Salvar fornecedor"))),
        cel(3, "Valor total (R$)", inp("valor", "text", {placeholder:"2.105,96"})),
        cel(3, "Vencimento", inp("venc", "date")),
        cel(3, "Emissão", inp("emissao", "date")),
        cel(3, "CNPJ", e("select",{value:f.filial, className:CI+" cursor-pointer", onChange:function(ev){ set("filial", ev.target.value); }}, optCnpj)),
        cel(6, "Natureza", e("select",{value:f.nat, className:CI+" cursor-pointer", onChange:function(ev){ set("nat", ev.target.value); }}, e("option",{value:""}, "Escolher..."), optNat())),
        cel(2, "De quem é", sel("quem", [["sorelly", "Sorelly"], ["familia", "Família"]])),
        cel(4, "Centro de custo", inp("centro")),
        e("div",{key:"saida", className:"rounded-xl p-3 sm:col-span-12", style:{background:"linear-gradient(135deg,rgba(255,255,255,.10),rgba(255,255,255,.02) 55%,rgba(0,0,0,.35))", boxShadow:"inset 0 0 0 1px rgba(255,255,255,.14)"}},
          e("div",{className:"mb-2 text-[12.5px] font-bold text-white"}, "De qual conta sai o pagamento"),
          e("select",{value:f.saida, "aria-label":"De qual conta sai o pagamento", className:INPUT+" h-11! w-full cursor-pointer text-[14px]! font-bold", onChange:function(ev){ set("saida", ev.target.value); }}, SAIDAS.map(function(x){ return e("option",{key:x, value:x}, x); }))),
        cel(12, "Histórico (nota, fatura, observação)", e("textarea",{value:f.hist, rows:2, className:INPUT+" w-full text-[13px]!", onChange:function(ev){ set("hist", ev.target.value); }}))),
      erro && e("p",{className:"mt-2 text-[13px] font-semibold", style:{color:ESTADO.ruim}}, erro),
      e("div",{className:"mt-3 flex items-center gap-3"}, e("span",{className:"text-[12px] text-white/55"}, "Com parcelas, o sistema cria uma conta para cada mês."), e("button",{type:"button", onClick:salvar, className:"ml-auto h-10 rounded-lg px-6 text-[13.5px] font-bold text-white", style:{background:AZUL}}, "Lançar conta"))));
}

// ───────────── Tela: Sorelly (empresa) primeiro; Sorelly + família soma a família que o DevMaster já traz ─────────────
// ───────────── Lista de contas a pagar no estilo do DevMaster: uma linha por título, com filial, prefixo, número, parcela, emissão, fornecedor, natureza, vencimento, valor e saldo ─────────────
var ORDENS = [["venc", "Vencimento (mais antigo primeiro)"], ["valor", "Valor (maior primeiro)"], ["forn", "Fornecedor (A a Z)"], ["nat", "Natureza"]];
function ListaContas(p){
  var sn = useState(""), nat = sn[0], setNat = sn[1], so = useState("venc"), ord = so[0], setOrd = so[1], sl = useState(120), lim = sl[0], setLim = sl[1];
  var nomeFilial = function(id){ return (FILIAIS.find(function(f){ return f[0]===id; })||[])[1] || id; };
  var nats = []; p.itens.forEach(function(i){ var k = i.nat+" · "+i.natNome; if(nats.indexOf(k)<0) nats.push(k); }); nats.sort();
  var base = p.itens.filter(function(i){ return !nat || (i.nat+" · "+i.natNome)===nat; });
  var cmp = { venc:function(a, b){ return (a.venc||"").localeCompare(b.venc||"") || a.nome.localeCompare(b.nome); }, valor:function(a, b){ return b.valor-a.valor; }, forn:function(a, b){ return a.nome.localeCompare(b.nome); }, nat:function(a, b){ return (a.nat+a.nome).localeCompare(b.nat+b.nome); } }[ord];
  var ls = base.slice().sort(cmp), vis = ls.slice(0, lim), tot = r2(base.reduce(function(t, i){ return t+i.valor; }, 0)), saldo = r2(base.filter(function(i){ return i.status==="apagar"; }).reduce(function(t, i){ return t+i.valor; }, 0));
  var pontinho = function(i){ var c = i.status==="pago" ? ESTADO.ok : i.atraso>0 ? ESTADO.ruim : ESTADO.alerta; return e("span",{className:"inline-block size-3 rounded-full", style:{background:c}, title:i.status==="pago" ? "Pago" : i.atraso>0 ? "Atrasada" : "A pagar"}); };
  var sel = function(rot, val, set, ops, w){ return e("label",{className:"flex flex-col gap-0.5 "+w}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, rot), e("select",{value:val, "aria-label":rot, className:INPUT+" h-9! w-full cursor-pointer", onChange:function(ev){ set(ev.target.value); }}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); };
  return e(BlocoBarra,{cor:"azul", compacto:true, t:p.titulo, dir:BK(tot)}, e("div",{className:"flex flex-col gap-2 p-2"},
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-3"}, sel("Natureza", nat, function(v){ setNat(v); setLim(120); }, [["", "Todas as naturezas"]].concat(nats.map(function(n){ return [n, n]; })), ""), sel("Ordenar por", ord, setOrd, ORDENS, ""),
      e("div",{className:"flex flex-col justify-end text-[13px] text-white/80"}, e("span",null, base.length+" títulos · total "+BK(tot)), e("span",null, "em aberto "+BK(saldo)))),
    e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse text-[13px]"},
      e("thead",null, e("tr",null, ["", "Filial", "Pref.", "Número", "Parc.", "Emissão", "Fornecedor", "Natureza", "Vencimento", "Valor", "Saldo", "Histórico"].map(function(h, k){ return e("th",{key:k, className:"whitespace-nowrap border-b border-white/15 px-2 py-2 text-"+(k===6 || k===7 || k===11 ? "left" : k>=9 && k<=10 ? "right" : "center")+" text-[11.5px] font-bold uppercase tracking-wide text-white/75"}, h); }))),
      e("tbody",null, vis.map(function(i){ var pago = i.status==="pago";
        return e("tr",{key:i.id, className:"border-b border-white/10 hover:bg-white/5"},
          e("td",{className:"px-2 py-1.5 text-center"}, pontinho(i)), e("td",{className:"whitespace-nowrap px-2 py-1.5 text-center"}, i.filial==="fora" ? "Por fora" : i.filial), e("td",{className:"px-2 py-1.5 text-center"}, i.pref||"—"), e("td",{className:MONO+" px-2 py-1.5 text-center"}, i.num||"—"), e("td",{className:"px-2 py-1.5 text-center"}, i.parc||"—"),
          e("td",{className:"whitespace-nowrap px-2 py-1.5 text-center"}, br(i.emissao)), e("td",{className:"max-w-[24rem] truncate px-2 py-1.5 text-left font-semibold", title:i.nome}, i.nome), e("td",{className:"max-w-[16rem] truncate px-2 py-1.5 text-left text-white/80", title:i.nat+" "+i.natNome}, i.natNome),
          e("td",{className:"whitespace-nowrap px-2 py-1.5 text-center", style:{color:!pago && i.atraso>0 ? ESTADO.ruim : undefined}}, br(i.venc)), e("td",{className:MONO+" whitespace-nowrap px-2 py-1.5 text-right font-bold"}, BK(i.valor)), e("td",{className:MONO+" whitespace-nowrap px-2 py-1.5 text-right", style:{color:pago ? ESTADO.ok : ESTADO.alerta}}, pago ? "R$ 0,00" : BK(i.valor)),
          e("td",{className:"max-w-[16rem] truncate px-2 py-1.5 text-left text-white/70"}, i.obs || (pago ? "Pago em "+br(i.baixa) : i.atraso>0 ? i.atraso+" dias de atraso" : "")), null); })))),
    !vis.length && e("p",{className:"py-4 text-center text-[13px] text-white/70"}, "Nenhuma conta neste filtro."),
    ls.length>vis.length && e("div",{className:"flex justify-center"}, e("button",{type:"button", onClick:function(){ setLim(lim+200); }, className:"h-9 rounded-lg bg-white/10 px-4 text-[13px] font-bold hover:bg-white/20"}, "Mostrar mais ("+(ls.length-vis.length)+" restantes)"))));
}

function Empresa(p){
  var cx = use(), ff = cx.state.ff, vejaFamilia = p.vejaFamilia;
  setClasse((cx.state.cpe||{}).classe); setLancamentos((cx.state.cpe||{}).lanc); setBaixas((cx.state.cpe||{}).baixas); setPf(cx.state.pf);
  var ms = meses(), ini = ms.indexOf(hojeYm())>=0 ? hojeYm() : (ms[ms.length-1] || ""), sm = useState(ini), mes = sm[0], setMes = sm[1];
  var modo = p.modo || "sorelly";
  var sb = useState(""), busca = sb[0], setBusca = sb[1];
  var ss = useState(""), status = ss[0], setStatus = ss[1];
  var sa = useState({}), abertas = sa[0], setAbertas = sa[1];
  var sv = useState("lista"), vista = sv[0], setVista = sv[1];   // embaixo da análise: "lista" (estilo DevMaster) ou "dia" (agenda do financeiro)
  var sr = useState(true), resumo = sr[0], setResumo = sr[1];   // tabela de análise (padrão); desligado mostra os blocos abertos por grupo
  var sn = useState(false), novaAberta = sn[0], setNovaAberta = sn[1];
  var sno = useState(""), nota = sno[0], setNota = sno[1];   // "" = todas, "com" = com nota, "sem" = sem nota
  var ssd = useState(false), porSetor = ssd[0], setPorSetor = ssd[1];   // folha aberta por setor
  var so = useState("desc"), ordem = so[0], setOrdem = so[1];   // ordem da tabela: maiores primeiro ou menores primeiro
  var filial = p.sel, setFilial = p.setSel, juntar = vejaFamilia && modo==="junto";
  if(!temDados()) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px]"}, "Sem contas da empresa neste computador.");
  var tira = juntar && filial==="";   // com a família junta, o salário e o adiantamento dos sócios saem do pessoal e ficam só na Família
  var ehSocioFolha = function(i){ return (i.nat==="3.01.01.02" || i.nat==="3.01.01.11") && /^(MARCUS VINICIUS|ANAMARIA|MARCO ANTONIO|ANA BEATRIZ)/i.test(i.nome); };
  var lista = filtrar(mes, filial, busca, status, "sorelly", nota), fs = porFilial(mes, busca, status, "sorelly", nota);
  if(tira) lista = lista.filter(function(i){ return !ehSocioFolha(i); });
  var listaFamBruta = filtrar(mes, "", busca, status, "familia").concat(tira ? filtrar(mes, "", busca, status, "sorelly").filter(ehSocioFolha) : []);
  var listaFam = listaFamBruta.filter(function(i){ return donoDe(i)!=="Ana Beatriz"; });
  var metaAna = ff && mes ? ((ff.pixMeta||{})["anabeatriz|"+mes]||0) : 0, recAna = ff && mes ? pixDoMes(ff, "anabeatriz", mes) : 0;
  var anaT = metaAna>0 && (!busca || /ana|beatriz|pix|revend/i.test(busca)) ? {pago:recAna, apagar:r2(Math.max(0, metaAna-recAna)), total:metaAna, nPago:recAna>0 ? 1 : 0, nApagar:metaAna>recAna ? 1 : 0, n:1} : null;   // a Ana Beatriz só tem Pix revendedoras: vale a meta do mês
  var TE = totais(filtrar(mes, "", busca, status, "sorelly", nota).filter(function(i){ return !(juntar && ehSocioFolha(i)); })), TF = anaT ? somaT(totais(listaFam), anaT) : totais(listaFam), TG = somaT(TE, TF);
  var T = filial==="" && juntar ? somaT(totais(lista), TF) : totais(lista);
  var soma = function(l){ return r2(l.reduce(function(t, i){ return t+i.valor; }, 0)); };
  var atras = function(l){ return l.filter(function(i){ return i.status==="apagar" && i.atraso>0; }); };
  var atrasoTotal = soma(atras(lista)) + (filial==="" && juntar ? soma(atras(listaFam)) : 0);
  var pagoOutro = lista.filter(function(i){ return i.status==="pago" && i.outroMes; });
  var filNome = filial ? (FILIAIS.find(function(f){ return f[0]===filial; })||[])[1] : (juntar ? "Sorelly + família" : "Sorelly");
  var alterna = function(k){ var o = Object.assign({}, abertas); o[k] = !o[k]; setAbertas(o); };
  var card = function(id, nome, desc, t, tom){
    var on = filial===id, cor = tom || AZUL;
    return e("button",{key:id||"todas", type:"button", onClick:function(){ setFilial(id); }, title:desc, className:botaoCard(on).replace("ring-2 ring-[#3B82F6]", "ring-2").replace("ring-1 ring-white/10", "ring-1"), style:Object.assign(degrade(on || tom ? cor : "neutro"), on ? {boxShadow:"0 0 0 2px "+cor} : {})},
      e("span",{className:"text-[11px] font-bold text-white/85"}, nome),
      e("b",{className:MONO+" text-[17px] leading-tight", style:{color:on ? ESTADO.info : "#fff"}}, BK(t.total)),
      e("span",{className:"text-[10.5px] leading-tight text-white/60"}, "Pago "+BK(t.pago)),
      e("span",{className:"text-[10.5px] leading-tight", style:{color:t.apagar>0 ? ESTADO.ruim : "rgba(255,255,255,.5)"}}, "Falta "+BK(t.apagar)));
  };
  var bloco = function(rot, t, nota, k){ return e("div",{key:k, className:"flex min-w-0 flex-col items-center rounded-lg bg-black/20 px-2 py-1.5"},
    e("span",{className:"text-[10.5px] font-bold text-white/75"}, rot), e("b",{className:MONO+" text-[20px] leading-tight text-white"}, BK(t.total)),
    e("span",{className:"text-[11px] leading-tight text-white/65"}, "Pago "+BK(t.pago)+" · Falta "+BK(t.apagar)), nota && e("span",{className:"mt-0.5 text-[10px] leading-tight text-white/45"}, nota)); };
  var btnBarra = function(on, rot, fn, dica){ return e("button",{type:"button", onClick:fn, title:dica, className:"h-9 w-full rounded-lg px-3 text-[12.5px] font-bold ring-1 "+(on ? "text-white" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,"+AZUL+"66,"+AZUL+"22)", boxShadow:"inset 0 0 0 1px "+AZUL+"cc"} : undefined}, rot); };
  var campoSel = function(rot, val, set, ops, w, dica){ return e("label",{className:"flex flex-col gap-0.5 "+w, title:dica}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, rot), e("select",{value:val, "aria-label":rot, className:INPUT+" h-9! w-full cursor-pointer", onChange:function(ev){ set(ev.target.value); }}, ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); };
  var COR_CNPJ = {"34":"#B8892B", "46":"#BE185D", "59":"#0F766E", "67":"#1D4ED8", "ho":"#6D28D9"};   // mesmas cores da aba CNPJs
  var onP = filial==="";
  var principal = e("button",{type:"button", onClick:function(){ setFilial(""); }, title:"Abrir tudo da Sorelly", className:"w-full rounded-xl px-3 py-2 text-center transition hover:brightness-125 "+(onP ? "ring-2 ring-[#3B82F6]" : "ring-1 ring-white/10"), style:degrade(onP ? AZUL : "neutro")},
    e("div",{className:"mb-1.5 text-[11px] font-bold text-white/85"}, "Principal · "+rotMes(mes)),
    e("div",{className:"grid grid-cols-1 gap-2 "+(juntar ? "sm:grid-cols-3" : "")}, bloco("Sorelly", TE, "empresa, sem as contas da família", "e"), juntar && bloco("Família", TF, "contas da família", "f"), juntar && bloco("Total do mês", TG, "Sorelly + família", "j")));
  var cnpjs = fs.filter(function(f){ return f.id!=="fora"; }).map(function(f){ return card(f.id, f.nome, f.desc, f, COR_CNPJ[f.id]); }).concat([card("fora", "Por fora", "Pagamentos fora dos CNPJs", fs.filter(function(f){ return f.id==="fora"; })[0], "#22D3EE")]);
  var linhaCards = e("div",{className:"flex flex-col gap-2"}, principal, e("div",{className:"grid grid-cols-2 gap-2 sm:grid-cols-6"}, cnpjs));
  // todos os meses lado a lado: total e quanto falta; clicar troca o mês
  var tiraMeses = e("div",{className:"grid grid-cols-3 gap-1.5 sm:grid-cols-6 xl:grid-cols-12"}, ms.map(function(m){ var tm = totais(filtrar(m, "", "", "", "sorelly", nota)), on = m===mes;
    return e("button",{key:m, type:"button", onClick:function(){ setMes(m); }, title:"Ver "+rotMes(m), className:"flex flex-col items-center rounded-lg px-1 py-1.5 text-center ring-1 transition hover:brightness-125 "+(on ? "ring-2 ring-[#3B82F6]" : "ring-white/10"), style:degrade(on ? AZUL : "neutro")},
      e("span",{className:"text-[11px] font-bold text-white/85"}, rotMes(m).slice(0, 3)+"/"+m.slice(2, 4)), e("b",{className:MONO+" text-[12.5px] leading-tight"}, BK(tm.total)), e("span",{className:"text-[10px] leading-tight", style:{color:tm.apagar>0 ? ESTADO.ruim : "rgba(255,255,255,.5)"}}, "Falta "+BK(tm.apagar))); }));
  return e("div",{className:"flex flex-col gap-2.5"},
    novaAberta && e(NovaConta,{fechar:function(){ setNovaAberta(false); }}),
    tiraMeses,
    linhaCards,
    e(BarraFiltros,{ativo:false},
      e("div",{className:"grid w-full grid-cols-2 gap-2 sm:grid-cols-4"},
        campoSel("Mês", mes, setMes, ms.map(function(m){ return [m, rotMes(m)]; }).concat(ms.length>1 ? [["", "Todos os meses"]] : []), ""),
        campoSel("Situação", status, setStatus, SITUACOES, ""),
        campoSel("Nota", nota, setNota, [["", "Todas"], ["com", "Com nota"], ["sem", "Sem nota"]], "", "Com nota = pago pelo CNPJ (boleto, cheque, transferência). Sem nota = Pix revendedora."),
        e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, "Buscar"), e("input",{value:busca, placeholder:"Título, valor, funcionária ou setor", "aria-label":"Buscar", className:INPUT+" h-9! w-full", onChange:function(ev){ setBusca(ev.target.value); }}))),
      e("div",{className:"grid w-full grid-cols-2 gap-2 sm:grid-cols-4"},
        btnBarra(porSetor, porSetor ? "Ver por grupos" : "Ver por setores", function(){ setPorSetor(!porSetor); }, "Troca o relatório: em vez de grupos de custo, mostra quanto cada setor (Encomendas, Montagem, Bipagem...) custa em pessoal; clique no setor para ver cada funcionária"),
        btnBarra(vista==="dia", vista==="dia" ? "Ver lista de contas" : "Ver contas por dia", function(){ setVista(vista==="dia" ? "lista" : "dia"); }, "Embaixo da análise: a lista de contas (como no DevMaster) ou a agenda por dia (o que vence, o que está atrasado e o que foi pago)"),
        e("button",{type:"button", onClick:function(){ setNovaAberta(true); }, className:"h-9 w-full rounded-lg px-3 text-[12.5px] font-bold text-white", style:{background:AZUL}}, "+ Lançar conta"),
        (busca || filial || status || nota) ? e("button",{type:"button", onClick:function(){ setBusca(""); setFilial(""); setStatus(""); setNota(""); }, className:"h-9 w-full rounded-lg bg-white/10 px-3 text-[12.5px] font-bold hover:bg-white/20"}, "Limpar filtros") : e("span",{key:"vz"}))),
    e(Fragment,null,
    e(Faixa,{n:5},
      e(IndicadorN,{t:"Total do mês", v:BK(T.total), cor:"total", sub:filNome}),
      e(IndicadorN,{t:"Pago", v:BK(T.pago), cor:"ok", sub:T.nPago+" pagamentos"}),
      e(IndicadorN,{t:"Falta pagar", v:BK(T.apagar), cor:T.apagar>0 ? "ruim" : "neutro", sub:T.nApagar+" contas"}),
      e(IndicadorN,{t:"Atrasado", v:BK(atrasoTotal), cor:atrasoTotal>0 ? "#F97316" : "neutro", sub:"contas vencidas"}),
      e(IndicadorN,{t:"Pago de outro mês", v:BK(soma(pagoOutro)), cor:pagoOutro.length ? "info" : "neutro", sub:pagoOutro.length+" com vencimento em outro mês"})),
    resumo ? e(TabelaCustos,{porSetor:porSetor, lista:lista, listaFam:listaFam, ana:anaT, ff:ff, mes:mes, familia:(juntar && filial==="") ? TF : null, ordem:ordem, pref:mes+"|"+filial, abertas:abertas, alterna:alterna, edita:vejaFamilia, titulo:(juntar && filial==="") ? "Análise de custos: Sorelly + família" : "Análise de custos: "+filNome})
      : [e(GruposTabela,{key:"a", lista:lista, pref:mes+"|"+filial, resumo:false, abertas:abertas, alterna:alterna, edita:vejaFamilia, vazio:"Nenhuma conta da Sorelly neste filtro."}),
         juntar && filial==="" && e(GruposTabela,{key:"b", lista:listaFam, pref:mes+"|fam", resumo:false, abertas:abertas, alterna:alterna, edita:vejaFamilia, sufixo:" · família", vazio:"Nenhuma conta da família no DevMaster neste filtro."})],
    vista==="dia" ? e(PorDia,{itens:filtrar("", filial, busca, "", juntar ? "" : "sorelly"), hoje:hojeIso(), edita:vejaFamilia})
      : e(ListaContas,{itens:lista.concat(juntar && filial==="" ? listaFam : []), titulo:"Contas a pagar · "+filNome+" · "+rotMes(mes)})));
}

// sócios: meta de Pix revendedoras e salário (pró-labore) do mês, vindos do Financeiro familiar
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
function MetaSocios(p){
  var ff = p.ff, mes = p.mes, socios = ff.personas.filter(function(q){ return q.tipo==="SOCIO" && q.ativo && (q.mostrarProlabore || (ff.pixMeta||{})[q.id+"|"+mes]>0); });
  var pro = parcelasDe(ff, {ym:mes}).filter(function(x){ return x.conta.categoria==="PRO_LABORE"; });
  var dono = function(x){ var id = x.conta.personaId; if(socios.some(function(q){ return q.id===id; })) return id; var d = norm(x.conta.descricao+" "+(x.conta.beneficiario||"")); var q = socios.find(function(z){ return d.indexOf(norm(z.nome))>=0 || d.indexOf(norm(z.nome.split(" ")[0]))>=0; }); return q ? q.id : id; };
  var linhas = socios.map(function(q){
    var meus = pro.filter(function(x){ return dono(x)===q.id; }), meta = (ff.pixMeta||{})[q.id+"|"+mes]||0, rec = pixDoMes(ff, q.id, mes), vg = ((ff.prolabore||{})[q.id]||{vigencias:[]}).vigencias.filter(function(v){ return v.desde<=mes; }).sort(function(x, y){ return y.desde.localeCompare(x.desde); })[0];
    return {id:q.id, nome:q.nome, cor:q.cor, liquido:vg && (meus.length>0) ? vg.liquido : 0, plPago:r2(meus.reduce(function(t, x){ return t+x.pago; }, 0)), plFalta:r2(meus.reduce(function(t, x){ return t+x.restante; }, 0)), meta:meta, rec:rec, falta:r2(Math.max(0, meta-rec))};
  }).filter(function(x){ return x.meta>0 || x.liquido>0 || x.plPago>0 || x.plFalta>0; });
  if(!linhas.length) return null;
  var tot = function(k){ return r2(linhas.reduce(function(t, x){ return t+x[k]; }, 0)); };
  return e(BlocoBarra,{cor:"azul", compacto:true, t:"Sócios: salário e meta de Pix revendedoras", dir:nomeMes(mes)}, e("div",{className:"p-2"}, e(TabN,{cols:["Sócio", "Pró-labore (líquido)", "Salário pago", "Salário a pagar", "Meta de Pix", "Recebido", "Falta"]},
    linhas.map(function(x){ return e("tr",{key:x.id, className:LINHA}, e(Td,{forte:true}, e("span",{className:"mr-1.5 inline-block size-2.5 rounded-full align-middle", style:{background:x.cor}}), x.nome), e(Td,{dinheiro:true}, x.liquido ? BK(x.liquido) : "—"), e(Td,{dinheiro:true, cor:"ok"}, BK(x.plPago)), e(Td,{dinheiro:true, cor:x.plFalta>0 ? "alerta" : undefined}, BK(x.plFalta)), e(Td,{dinheiro:true, forte:true}, x.meta ? BK(x.meta) : "—"), e(Td,{dinheiro:true, cor:"ok"}, BK(x.rec)), e(Td,{dinheiro:true, cor:x.falta>0 ? "alerta" : undefined}, BK(x.falta))); }),
    e("tr",{key:"t", className:LINHA+" bg-white/5"}, e(Td,{forte:true}, "Total"), e(Td,{dinheiro:true}, BK(tot("liquido"))), e(Td,{dinheiro:true, cor:"ok"}, BK(tot("plPago"))), e(Td,{dinheiro:true, cor:"alerta"}, BK(tot("plFalta"))), e(Td,{dinheiro:true, forte:true}, BK(tot("meta"))), e(Td,{dinheiro:true, cor:"ok"}, BK(tot("rec"))), e(Td,{dinheiro:true, cor:"alerta"}, BK(tot("falta")))))));
}

// ───────────── Família: telas completas do Financeiro familiar dentro do Contas a pagar ─────────────
function Familia(){
  var cx = use(), ff = cx.state.ff, sa = useState("pagar"), sub = sa[0], setSub = sa[1], mes = hojeYm(), sab = useState({}), ab = sab[0], setAb = sab[1];
  setClasse((cx.state.cpe||{}).classe); setLancamentos((cx.state.cpe||{}).lanc); setBaixas((cx.state.cpe||{}).baixas);
  var listaFam = filtrar(ms0(), "", "", "", "familia");
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Abas,{abas:[["pagar","A pagar"],["pagas","Pagas"],["socios","Sócios: salário e Pix"],["pessoa","Resumo por pessoa"],["dev","Lançado no DevMaster"],["conc","Conciliação"]], atual:sub, onMudar:setSub, cor:AZUL}),
    sub==="dev" ? e(GruposTabela,{lista:listaFam, pref:"famdev", abertas:ab, alterna:function(k){ var o = Object.assign({}, ab); o[k] = !o[k]; setAb(o); }, edita:true, vazio:"Nenhuma conta da família no DevMaster."}) :
    sub==="pagar" ? e(AbaFfContas) : sub==="pagas" ? e(AbaFfPagas) : sub==="socios" ? e(MetaSocios,{ff:ff, mes:mes}) : sub==="conc" ? e(Conciliacao,{c:conciliar(ff, mes), mes:mes}) : e(ResumoFamilia));
}
function ResumoFamilia(){
  var cx = use(), s = cx.state, ff = s.ff, d = cx.dispatch, ym = hojeYm();
  if(!ff || !(ff.contas||[]).length) return e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px]"}, "Sem contas da família neste computador.");
  var membros = membrosFamilia(ff), ids = membros.concat(ff.personas.filter(function(p){ return p.tipo==="FAMILIAR" && membros.indexOf(p.id)<0; }).map(function(p){ return p.id; }));
  var linhas = ids.map(function(id){ var p = ff.personas.find(function(x){ return x.id===id; }); if(!p) return null; var t = totaisPersona(ff, id, ym); return {p:p, t:t}; }).filter(function(x){ return x && x.t.todasContas>0; });
  var tot = function(k){ return Math.round(linhas.reduce(function(a, x){ return a+x.t.contas[k]; }, 0)*100)/100; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(IndicadorN,{t:"Contas do mês", v:BK(tot("total")), cor:"total", sub:nomeMes(ym)}),
      e(IndicadorN,{t:"Pago", v:BK(tot("pago")), cor:"ok"}),
      e(IndicadorN,{t:"Falta pagar", v:BK(tot("restante")), cor:"alerta"}),
      e(IndicadorN,{t:"Atrasado", v:BK(tot("atrasado")), cor:tot("atrasado")>0 ? "ruim" : "neutro"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Por pessoa e casa (com a parte de cada um nas contas divididas)", dir:nomeMes(ym)}, e("div",{className:"p-2"}, e(TabN,{cols:["Pessoa", "Pago", "Falta pagar", "Total", "Pendentes"]}, linhas.map(function(x){
      return e("tr",{key:x.p.id, className:LINHA}, e(Td,{forte:true}, e("span",{className:"mr-1.5 inline-block size-2.5 rounded-full align-middle", style:{background:x.p.cor}}), x.p.nome), e(Td,{dinheiro:true, cor:"ok"}, BK(x.t.contas.pago)), e(Td,{dinheiro:true, cor:x.t.contas.restante>0 ? "alerta" : undefined}, BK(x.t.contas.restante)), e(Td,{dinheiro:true}, BK(x.t.contas.total)), e(Td,null, x.t.contas.pendentes));
    })))));
}

// ───────────── Conciliação DevMaster × Financeiro familiar ─────────────
function Conciliacao(p){
  var c = p.c, mes = p.mes;
  var nomePessoa = function(x){ return x.conta.personaId; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(IndicadorN,{t:"Nos dois sistemas", v:String(c.pares.length), cor:"ok", sub:BK(c.valorPares)}),
      e(IndicadorN,{t:"Só no DevMaster", v:String(c.soDev.length), cor:c.soDev.length ? "alerta" : "neutro", sub:BK(c.valorSoDev)+" falta no familiar"}),
      e(IndicadorN,{t:"Só no familiar", v:String(c.soFam.length), cor:c.soFam.length ? "alerta" : "neutro", sub:BK(c.valorSoFam)+" não está no DevMaster"}),
      e(IndicadorN,{t:"Mês", v:rotMes(mes).split("/")[0], cor:"info", sub:"Conciliação por valor e mês"})),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Pix revendedoras: DevMaster × familiar", dir:String(c.pix.length)}, e("div",{className:"p-2"}, e(TabN,{cols:["Pessoa", "DevMaster: meta", "DevMaster: pago", "Familiar: meta", "Familiar: pago", "Diferença no pago"]}, c.pix.map(function(x){
      var dif = r2(x.devPago-x.famPago);
      return e("tr",{key:x.id, className:LINHA}, e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true}, BK(x.devMeta)), e(Td,{dinheiro:true}, BK(x.devPago)), e(Td,{dinheiro:true}, BK(x.famMeta)), e(Td,{dinheiro:true}, BK(x.famPago)), e(Td,{dinheiro:true, cor:Math.abs(dif)>0.005 ? "alerta" : "ok"}, BK(dif)));
    })))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Só no DevMaster (falta lançar no familiar)", dir:BK(c.valorSoDev)}, e("div",{className:"p-2"}, c.soDev.length ? e(TabN,{cols:["Natureza", "Título", "Data", "Valor", "Situação"]}, c.soDev.map(function(i){
      return e("tr",{key:i.id, className:LINHA}, e(Td,null, i.natNome), e(Td,{className:"max-w-[20rem] truncate"}, i.nome), e(Td,null, i.status==="pago" ? "Pago em "+br(i.baixa) : "Vence "+br(i.venc)), e(Td,{dinheiro:true}, BK(i.valor)), e(Td,null, i.status==="pago" ? chip("Pago", "ok") : chip("A pagar", "alerta")));
    })) : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nada neste mês."))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Só no Financeiro familiar (não está no DevMaster)", dir:BK(c.valorSoFam)}, e("div",{className:"p-2"}, c.soFam.length ? e(TabN,{cols:["Pessoa", "Conta", "Mês", "Valor", "Situação"]}, c.soFam.map(function(x){
      var pago = x.status==="PAGO";
      return e("tr",{key:x.chave, className:LINHA}, e(Td,null, nomePessoa(x)), e(Td,{className:"max-w-[20rem] truncate"}, x.conta.descricao), e(Td,null, nomeMes(x.ym)), e(Td,{dinheiro:true}, BK(x.valor)), e(Td,null, pago ? chip("Pago", "ok") : x.atrasada ? chip("Atrasada", "ruim") : chip(x.status==="PARCIAL" ? "Parcial" : "A pagar", "alerta")));
    })) : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nada neste mês."))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Nos dois sistemas (já conciliado)", dir:BK(c.valorPares)}, e("div",{className:"p-2"}, c.pares.length ? e(TabN,{cols:["Conta no familiar", "Título no DevMaster", "Mês", "Valor"]}, c.pares.map(function(x, k){
      return e("tr",{key:k, className:LINHA}, e(Td,{className:"max-w-[18rem] truncate"}, x.fam.conta.descricao), e(Td,{className:"max-w-[18rem] truncate"}, x.dev.nome), e(Td,null, nomeMes(x.fam.ym)), e(Td,{dinheiro:true}, BK(x.dev.valor)));
    })) : e("p",{className:"py-3 text-center text-[13px] text-white/70"}, "Nada neste mês."))));
}

function AbaCtaPagar(){
  var cx = use(), s = cx.state, vejaFamilia = temAutorizacao("financeiro_familia", s.usuario);
  var inicial = "sorelly"; try{ var g = sessionStorage.getItem("cta_sel"); if(g==="familia" || g==="junto" || g==="pessoas") inicial = g; sessionStorage.removeItem("cta_sel"); }catch(x){}
  var sm = useState(inicial), modo0 = sm[0], setModo = sm[1], sc = useState(""), sel = sc[0], setSel = sc[1];
  var modo = (vejaFamilia || modo0==="pessoas") ? modo0 : "sorelly";
  // o modo é escolhido no menu do topo (Contas a pagar → Sorelly / Família / Sorelly + Família); o menu avisa pelo evento "cta-modo"
  useEffect(function(){ var ouvir = function(ev){ if(vejaFamilia || ev.detail==="sorelly" || ev.detail==="pessoas"){ setModo(ev.detail); setSel(""); } }; window.addEventListener("cta-modo", ouvir); return function(){ window.removeEventListener("cta-modo", ouvir); }; }, [vejaFamilia]);
  useEffect(function(){ try{ sessionStorage.setItem("cta_modo_atual", modo); }catch(x){} }, [modo]);
  if(modo==="pessoas") return e(PessoasRep);   // aba Funcionários e representantes (tela própria, em pages/FolhaFuncionarias.js)
  var trocar = function(m){ setModo(m); setSel(""); try{ sessionStorage.setItem("cta_modo_atual", m); }catch(x){} };
  var seletorModo = e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"}, e("span",{className:"mr-1 text-[12px] font-bold uppercase tracking-wide text-white/70"}, "Ver"),
    [["sorelly", "Sorelly"], ["familia", "Família"], ["junto", "Sorelly + Família"]].filter(function(x){ return vejaFamilia || x[0]==="sorelly"; }).map(function(x){ var on = modo===x[0]; return e("button",{key:x[0], type:"button", onClick:function(){ trocar(x[0]); }, className:"h-10 rounded-lg px-5 text-[14px] font-bold ring-1 transition "+(on ? "text-white ring-[#3B82F6]" : "bg-muted/40 text-white/85 ring-white/15 hover:bg-white/10"), style:on ? {background:"linear-gradient(135deg,"+AZUL+"77,"+AZUL+"22)"} : undefined}, x[1]); }));
  return e(Pagina,null,
    e(PageHead,{t:"Contas a pagar · "+(modo==="familia" ? "Família" : modo==="junto" ? "Sorelly + Família" : "Sorelly"), sub:modo==="familia" ? "Contas da família" : modo==="junto" ? "A Sorelly com o que só está no financeiro da família" : "Contas da empresa por CNPJ"}),
    seletorModo,
    modo==="familia" ? e(Familia) : e(Empresa,{modo:modo, setModo:setModo, sel:sel, setSel:setSel, vejaFamilia:vejaFamilia}));
}

export { AbaCtaPagar, ListaContas, NovaConta };
