// Sorelly Admin · montagem — pages/ProdutividadeMontagem.js
// Kits › Produtividade da montagem (era a aba Produtividade da Montagem de Kits no admin antigo; migrada em 18/11/2026).
// Três abas: Bônus (relatório por colaboradora, dia e período, calculado dos registros da Fila de montagem), Regras do bônus e Equipe (quem aparece em "Quem montou").
// Regras do bônus (as mesmas do antigo, no servidor src/server/montagem-kit.js): manhã 8h–12h e tarde 13h–17h pelo horário de INÍCIO; kit acima do limite = especial;
// abaixo da meta = R$ 0, na meta = base, cada kit acima soma o extra; fator da avaliação das representantes (< 50% = 0, 50–70% = metade, ≥ 70% = inteiro, sem avaliação = inteiro).
// Ver: setor Montagem e Diretoria (com dinheiro: só supervisão e diretoria abrem esta tela). Mudar regras e equipe: só a Diretoria.
import { Janela, Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Aviso, Bloco, Botao, Segmentado, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar, ehAdmin } from "@/apps/montagem/lib/api";
import { PageHead } from "@/apps/montagem/ui/page";
import { SemServidor, dataBR, hojeSP, pct, useServidor } from "@/apps/montagem/pages/fila-montagem/comum";
import { CampoDin, CampoNum, CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { e, useState } from "@/shared/react";

var ABAS = [["bonus","Bônus"], ["regras","Regras do bônus"], ["equipe","Equipe"]];
var PERIODO = {MANHA:"Manhã", TARDE:"Tarde"};
var diasAtras = function(n){ var d = new Date(hojeSP()+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()-n); return d.toISOString().slice(0, 10); };
var soma = function(l, k){ return l.reduce(function(a, x){ return a+(Number(x[k]) || 0); }, 0); };

// ---------- Bônus ----------
function AbaBonus(){
  var sj = useState("90"), de = diasAtras(Number(sj[0])-1), ate = hojeSP();
  var r = useServidor("/montagem/bonus?de="+de+"&ate="+ate), d = r.dados;
  var linhas = ((d && d.rows) || []).map(function(x, i){ return {id:i, data:x.data, quem:x.staffNome, periodo:PERIODO[x.periodo] || x.periodo, normais:x.kitsNormais, especiais:x.kitsEspeciais,
    bn:x.bonusNormal, be:x.bonusEspecial, aval:x.mediaAvaliacaoPct, fator:x.fatorAvaliacao, total:x.bonusTotal}; });
  var cfg = d && d.config;
  return e(Bloco,{t:"Bônus por período", dir:e(Segmentado,{opcoes:[["7","7 dias"], ["30","30 dias"], ["90","90 dias"], ["365","12 meses"]], atual:sj[0], onMudar:sj[1]})},
    r.erro ? e(Aviso,{tom:"vermelho"}, "Não foi possível calcular o bônus: "+r.erro)
    : e(TabelaPlanilha,{vazio:r.carregando ? "Calculando…" : "Nenhuma montagem nesse período.",
        cols:[{k:"data", t:"Data", data:true, fmt:dataBR}, {k:"quem", t:"Colaboradora"}, {k:"periodo", t:"Período"}, {k:"normais", t:"Kits normais"}, {k:"especiais", t:"Kits especiais"},
          {k:"bn", t:"Bônus normal", fmt:brl}, {k:"be", t:"Bônus especial", fmt:brl}, {k:"aval", t:"Avaliação", fmt:function(v){ return v==null ? "Sem avaliação" : pct(v); }},
          {k:"fator", t:"Fator", fmt:function(v){ return pct((v||0)*100); }}, {k:"total", t:"Total", fmt:brl, cor:function(l){ return l.total>0 ? "text-emerald-400 font-semibold" : ""; }}],
        linhas:linhas,
        totalRodape:function(l){ return ["Total", "", "", String(soma(l, "normais")), String(soma(l, "especiais")), brl(soma(l, "bn")), brl(soma(l, "be")), "", "", brl(soma(l, "total"))]; }}),
    cfg && e("p",{className:"pt-2 text-center text-[13px]"}, "Kit especial acima de "+brl(cfg.limiteKitEspecial)+". Normal: meta "+cfg.metaKitsNormal+" kits, "+brl(cfg.bonusBaseNormal)+" + "+brl(cfg.bonusExtraNormal)+" por kit extra. Especial: meta "+cfg.metaKitsEspecial+" kits, "+brl(cfg.bonusBaseEspecial)+" + "+brl(cfg.bonusExtraEspecial)+" por kit extra. Filtro da avaliação "+(cfg.usarFiltroAvaliacao ? "ligado" : "desligado")+"."));
}

// ---------- Regras do bônus ----------
var CAMPOS = [["metaKitsNormal", "Kits normais: meta por período", "n"], ["bonusBaseNormal", "Kits normais: bônus base", "r"], ["bonusExtraNormal", "Kits normais: por kit extra", "r"],
  ["limiteKitEspecial", "Acima disto é kit especial", "r"], ["metaKitsEspecial", "Kits especiais: meta por período", "n"], ["bonusBaseEspecial", "Kits especiais: bônus base", "r"], ["bonusExtraEspecial", "Kits especiais: por kit extra", "r"]];
function AbaRegras(){
  // f = o que está sendo editado; sem edição, vale o que veio do servidor
  var r = useServidor("/montagem/bonus/regras"), sf = useState(null), f = sf[0] || r.dados, sm = useState(""), sg = useState(false), pode = ehAdmin();
  if(r.erro) return e(Aviso,{tom:"vermelho"}, "Não foi possível ler as regras: "+r.erro);
  if(!f) return e("p",{className:"py-2 text-center text-[13px]"}, "Lendo as regras…");
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; sf[1](o); sm[1](""); };
  var salvar = function(){
    var b = {usarFiltroAvaliacao:f.usarFiltroAvaliacao};
    CAMPOS.forEach(function(c){ b[c[0]] = c[2]==="n" ? (parseInt(f[c[0]], 10) || 0) : (Number(f[c[0]]) || 0); });
    sg[1](true);
    chamar("PUT", "/montagem/bonus/regras", b).then(function(){ sm[1]("Regras do bônus salvas."); sf[1](null); r.recarregar(); }).catch(function(x){ sm[1](x.message || "Não foi possível salvar."); }).finally(function(){ sg[1](false); });
  };
  return e(Bloco,{t:"Regras do bônus"},
    e("div",{className:"grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4"}, CAMPOS.map(function(c){
      return c[2]==="n" ? e(CampoNum,{key:c[0], t:c[1], id:"rb"+c[0], value:f[c[0]], onChange:function(v){ set(c[0], v); }})
        : e(CampoDin,{key:c[0], t:c[1], id:"rb"+c[0], value:f[c[0]], onChange:function(v){ set(c[0], v); }}); }),
      e("div",{className:"min-w-0"}, e("p",{className:"mb-0.5 text-[11px] font-medium uppercase tracking-[.05em]"}, "Filtro da avaliação"),
        e(Segmentado,{opcoes:[["sim","Ligado"], ["nao","Desligado"]], atual:f.usarFiltroAvaliacao ? "sim" : "nao", onMudar:function(v){ set("usarFiltroAvaliacao", v==="sim"); }}))),
    e("p",{className:"pt-2 text-center text-[13px]"}, "Filtro da avaliação: o bônus do período vale inteiro com a avaliação das representantes de 70% ou mais, metade de 50% a 70% e nada abaixo de 50%. Sem avaliação, vale inteiro."),
    !pode && e("div",{className:"pt-2"}, e(Aviso,null, "Só a Diretoria muda as regras do bônus.")),
    sm[0] && e("div",{className:"pt-2"}, e(Aviso,{tom:/salvas/.test(sm[0]) ? "verde" : "vermelho"}, sm[0])),
    e("div",{className:"flex justify-center pt-2"}, e(Botao,{principal:true, desabilitado:!pode || sg[0], onClick:salvar}, sg[0] ? "Salvando…" : "Salvar regras")));
}

// ---------- Equipe ----------
function JanelaNome(p){
  var sn = useState(p.nome || ""), se = useState("");
  var salvar = function(){ var n = sn[0].trim(); if(!n){ se[1]("Informe o nome."); return; } p.salvar(n).catch(function(x){ se[1](x.message || "Não foi possível salvar."); }); };
  return e(Janela,{t:p.t, sub:p.sub, fechar:p.fechar,
    colunas:[e("div",{key:"n", className:"col-span-full mx-auto w-full max-w-sm"}, e(CampoTexto,{t:"Nome", id:"eqNome", value:sn[0], maxLength:120, onChange:sn[1]}), se[0] && e("div",{className:"pt-2"}, e(Aviso,{tom:"vermelho"}, se[0])))],
    rodape:[e(Botao,{key:"c", onClick:p.fechar}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:salvar}, "Salvar")]});
}
function AbaEquipe(){
  var r = useServidor("/montagem/equipe"), pode = ehAdmin(), sj = useState(null), sm = useState("");
  var faz = function(metodo, caminho, corpo){ sm[1](""); return chamar(metodo, caminho, corpo).then(function(){ r.recarregar(); sj[1](null); }).catch(function(x){ sm[1](x.message || "Não foi possível salvar."); throw x; }); };
  var linhas = (r.dados || []).map(function(x){ return {id:x.id, p:x, nome:x.name, sit:x.active ? "Ativa" : "Inativa"}; });
  var cols = [{k:"nome", t:"Colaboradora"}, {k:"sit", t:"Situação", cor:function(l){ return l.p.active ? "text-emerald-400 font-semibold" : ""; }}];
  if(pode) cols.push({k:"acoes", t:"Ações", render:function(v, l){ return e("span",{className:"inline-flex gap-1.5"},
    e(Botao,{onClick:function(){ faz("PATCH", "/montagem/equipe/"+l.id, {active:!l.p.active}).catch(function(){}); }}, l.p.active ? "Desativar" : "Ativar"),
    e(Botao,{onClick:function(){ sj[1]({t:"Renomear", p:l.p}); }}, "Renomear"),
    e(Botao,{onClick:function(){ if(window.confirm("Tirar "+l.nome+" da equipe? Os registros de montagem dela continuam guardados.")) faz("DELETE", "/montagem/equipe/"+l.id).catch(function(){}); }}, "Tirar da equipe")); }});
  return e(Bloco,{t:"Equipe da montagem", dir:pode && e(Botao,{principal:true, onClick:function(){ sj[1]({t:"Nova colaboradora"}); }}, "Adicionar")},
    r.erro ? e(Aviso,{tom:"vermelho"}, "Não foi possível ler a equipe: "+r.erro)
      : e(TabelaPlanilha,{semContagem:true, cols:cols, linhas:linhas, vazio:r.carregando ? "Lendo…" : "Ninguém na equipe ainda."}),
    !pode && e("div",{className:"pt-2"}, e(Aviso,null, "Só a Diretoria muda a equipe da montagem.")),
    sm[0] && e("div",{className:"pt-2"}, e(Aviso,{tom:"vermelho"}, sm[0])),
    e("p",{className:"pt-2 text-center text-[13px]"}, "Só as colaboradoras ativas aparecem em Quem montou. Renomear separa o histórico do bônus, porque o registro guarda o nome."),
    sj[0] && e(JanelaNome,{t:sj[0].t, sub:sj[0].p ? "Nome atual: "+sj[0].p.name : "Ela passa a aparecer em Quem montou.", nome:sj[0].p ? sj[0].p.name : "", fechar:function(){ sj[1](null); },
      salvar:function(n){ return sj[0].p ? faz("PATCH", "/montagem/equipe/"+sj[0].p.id, {name:n}) : faz("POST", "/montagem/equipe", {name:n}); }}));
}

function AbaProdutividadeMontagem(){
  var sa = useState("bonus"), aba = sa[0];
  return e(Pagina,null,
    e(PageHead,{t:"Produtividade da montagem", sub:"Bônus da equipe calculado dos registros da Fila de montagem."}),
    !apiAtiva() ? e(SemServidor,null) : [
      e(AbasTela,{key:"a", abas:ABAS, atual:aba, onMudar:sa[1]}),
      aba==="bonus" ? e(AbaBonus,{key:"b"}) : aba==="regras" ? e(AbaRegras,{key:"r"}) : e(AbaEquipe,{key:"e"})]);
}

export { AbaProdutividadeMontagem };
