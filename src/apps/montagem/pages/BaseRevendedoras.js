// Sorelly Admin · montagem — pages/BaseRevendedoras.js
// Cadastro de revendedoras → Base de revendedoras: PLANILHA MÃE (todas as revendedoras numa lista só, com busca, filtros e download) e, na outra aba, o Crescimento (histórico dia a dia do total).
// A lista junta o que o sistema já sabe de cada uma (domain/base-revendedoras.js). Só leitura: ninguém lança nada aqui.
import { AbasTela, Bloco, Botao, BlocoFiltros, CampoBusca, CampoSel, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { baseRevendedoras } from "@/apps/montagem/domain/base-revendedoras";
import { AbaRevendedoras } from "@/apps/montagem/pages/Revendedoras";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var dbr = function(iso){ return iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—"; };
var PASSO = 100;
var COLUNAS = [["Nome","nome"], ["Canal","canal"], ["Representante","rep"], ["Cidade","cidade"], ["Bairro","bairro"], ["Profissão","prof"], ["Telefone","tel"], ["Situação","situacao"], ["Desde","desde"], ["Último acerto","ultimo"], ["Kit","kit"]];

function baixarCsv(linhas){
  var esc = function(v){ return '"'+String(v==null ? "" : v).replace(/"/g, '""')+'"'; };
  var txt = [COLUNAS.map(function(c){ return esc(c[0]); }).join(";")].concat(linhas.map(function(r){ return COLUNAS.map(function(c){ return esc(r[c[1]]); }).join(";"); })).join("\r\n");
  var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿"+txt], {type:"text/csv;charset=utf-8"})); a.download = "base-de-revendedoras.csv"; document.body.appendChild(a); a.click(); a.remove();
}

function PlanilhaMae(){
  var s = use().state, todas = baseRevendedoras(s), st = useState({q:"", canal:"", cidade:""}), f = st[0], vm = useState(PASSO), lim = vm[0];
  var up = function(k, v){ var n = Object.assign({}, f); n[k] = v; st[1](n); vm[1](PASSO); };
  var termos = norm(f.q).split(/\s+/).filter(Boolean);
  var lista = todas.filter(function(r){
    if(f.canal && r.canal!==f.canal) return false; if(f.cidade && r.cidade!==f.cidade) return false;
    var t = norm([r.nome, r.rep, r.cidade, r.bairro, r.prof, r.tel, r.situacao].join(" ")); return termos.every(function(w){ return t.indexOf(w)>=0; });
  });
  var conta = function(c){ return todas.filter(function(r){ return r.canal===c; }).length; };
  var cidades = Object.keys(todas.reduce(function(o, r){ if(r.cidade) o[r.cidade] = 1; return o; }, {})).sort();
  var cols = COLUNAS.map(function(c){ return {t:c[0], w:c[1]==="nome" ? 270 : c[1]==="situacao" ? 200 : c[1]==="rep" || c[1]==="canal" ? 150 : c[1]==="prof" || c[1]==="cidade" ? 150 : c[1]==="bairro" ? 140 : c[1]==="tel" ? 130 : 100, c:1}; });
  return e("div",{className:"flex flex-col gap-3"},
    e(BlocoFiltros,null,
      e(CampoBusca,{key:"q", t:"Buscar", id:"base-q", value:f.q, placeholder:"Nome, representante, cidade, bairro, profissão ou telefone", onChange:function(v){ up("q", v); }}),
      e(CampoSel,{key:"canal", t:"Canal", id:"base-canal", value:f.canal, onChange:function(v){ up("canal", v); }, opcoes:[["", "Todos"], ["Atendimento interno", "Atendimento interno"], ["Representante", "Representante"], ["Kit novo", "Kit novo"]]}),
      e(CampoSel,{key:"cidade", t:"Cidade", id:"base-cidade", value:f.cidade, onChange:function(v){ up("cidade", v); }, opcoes:[["", "Todas"]].concat(cidades.map(function(c){ return [c, c]; }))})),
    e(FaixaTotais,{itens:[{t:"Na base", v:todas.length.toLocaleString("pt-BR")}, {t:"Kit novo", v:String(conta("Kit novo"))}, {t:"Atendimento interno", v:String(conta("Atendimento interno"))}, {t:"Representante", v:String(conta("Representante"))}, {t:"No filtro", v:lista.length.toLocaleString("pt-BR")}]}),
    e(Bloco,{t:"Planilha mãe das revendedoras", dir:e(Botao,{onClick:function(){ baixarCsv(lista); }, desabilitado:!lista.length}, "Baixar planilha")},
      e(TabelaP,{cols:cols, minW:1700},
        lista.length ? lista.slice(0, lim).map(function(r){
          return e(Tr,{key:r.chave},
            e(Td,{c:true, forte:true}, r.nome), e(Td,{c:true}, r.canal || "—"), e(Td,{c:true}, r.rep || "—"), e(Td,{c:true}, r.cidade || "—"), e(Td,{c:true}, r.bairro || "—"), e(Td,{c:true}, r.prof || "—"),
            e(Td,{c:true}, r.tel || "—"), e(Td,{c:true, title:r.fontes.join(" · ")}, r.situacao || "—"), e(Td,{c:true}, dbr(r.desde)), e(Td,{c:true}, dbr(r.ultimo)), e(Td,{c:true}, r.kit || "—"));
        }) : e(Tr,{key:"vazio"}, e(Td,{c:true}, "Nenhuma revendedora neste filtro"), COLUNAS.slice(1).map(function(c){ return e(Td,{key:c[1], c:true}, "—"); }))),
      lista.length>lim && e("div",{className:"flex justify-center pt-2"}, e(Botao,{onClick:function(){ vm[1](lim+PASSO); }}, "Ver mais "+Math.min(PASSO, lista.length-lim)))));
}

function AbaBaseRevendedoras(){
  var ab = useState("mae");
  return e("div",{className:"flex flex-col gap-3"},
    e(PageHead,{t:"Base de revendedoras", sub:"Planilha mãe com todas as revendedoras e o histórico do total, dia a dia."}),
    e(AbasTela,{abas:[["mae","Planilha mãe"], ["crescimento","Crescimento"]], atual:ab[0], onMudar:ab[1]}),
    ab[0]==="mae" ? e(PlanilhaMae) : e(AbaRevendedoras,{semCabecalho:true}));
}

export { AbaBaseRevendedoras };
