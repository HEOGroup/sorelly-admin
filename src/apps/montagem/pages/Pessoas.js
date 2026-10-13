// Sorelly Admin · montagem — pages/Pessoas.js
// RH → Funcionários e representantes. Só leitura: lista as pessoas organizadas por setor ou por CNPJ.
// CPF só aparece para a diretoria. Dados em domain/pessoas.js.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { DIRETORIA } from "@/apps/montagem/domain/equipe";
import { FUNCIONARIOS_POR_SETOR, REPRESENTANTES, cpfBR, funcionarios, resumoPessoas } from "@/apps/montagem/domain/pessoas";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";
import React from "react";

var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase(); };

function Numero(p){
  return e("div",{className:"flex flex-col items-center gap-0.5 rounded-xl bg-black/20 px-4 py-3 text-center"},
    e("b",{className:MONO+" text-[26px] leading-none text-primary"}, p.n),
    e("span",{className:"text-[12.5px] font-semibold"}, p.t),
    p.sub && e("span",{className:"text-[11.5px] text-white/70"}, p.sub));
}
function Linha(p){
  var x = p.x;
  return e("tr",{className:"border-b border-border/40 last:border-0"},
    e("td",{className:"px-3 py-1.5 text-left text-[13px] font-medium"}, x.nome,
      x.funcao && e("span",{className:"ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[10.5px] font-semibold"}, x.funcao),
      x.tambemFunc && e("span",{className:"ml-2 rounded-md bg-info/20 px-1.5 py-0.5 text-[10.5px] font-bold text-info"},"também funcionária")),
    p.mostraCpf && e("td",{className:"px-3 py-1.5 text-center "+MONO+" text-[12.5px]"}, x.cpf ? cpfBR(x.cpf) : "a informar"),
    p.coluna==="setor" && e("td",{className:"px-3 py-1.5 text-center text-[12.5px]"}, x.setor),
    p.coluna==="cnpj" && e("td",{className:"px-3 py-1.5 text-center text-[12.5px]"}, x.cnpjTxt || "a informar"));
}
function Grupo(p){
  var th = function(t){ return e("th",{key:t, className:"border-b border-border px-3 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wide text-white/70 first:text-left"}, t); };
  var cab = ["Nome"].concat(p.mostraCpf ? ["CPF"] : [], p.coluna==="setor" ? ["Setor"] : p.coluna==="cnpj" ? ["CNPJ"] : []);
  return e("details",{open:true, className:"group rounded-xl ring-1 ring-[#E8B84B]/30", style:{background:"#E8B84B10"}},
    e("summary",{className:"flex cursor-pointer list-none items-center gap-3 px-3 py-2 [&::-webkit-details-marker]:hidden"},
      e("span",{className:"text-primary transition-transform group-open:rotate-90"},"▶"),
      p.cor && e("span",{className:"size-3 rounded-full", style:{background:p.cor}}),
      e("b",{className:"text-[14px]"}, p.titulo), p.sub && e("span",{className:"text-[12px] text-white/70"}, p.sub),
      e("b",{className:MONO+" ml-auto text-primary"}, p.itens.length)),
    e("div",{className:"overflow-x-auto px-2 pb-2"},
      e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",null, cab.map(th))),
        e("tbody",null, p.itens.map(function(x,i){ return e(Linha,{key:x.nome+i, x:x, mostraCpf:p.mostraCpf, coluna:p.coluna}); })))));
}

function AbaPessoas(){
  var s = use().state, mostraCpf = s.usuario===29 || DIRETORIA.some(function(x){ return x.id===s.usuario; });   // diretoria e a Anamaria
  var por = useState("setor"), modo = por[0], setModo = por[1];
  var bq = useState(""), busca = bq[0], setBusca = bq[1];
  var cn = cnpjsDe(s.cnpjs), nomeCnpj = function(id){ var c = cn.find(function(x){ return x.id===id; }); return c ? (c.num ? c.num+" · " : "")+c.nome : "a informar"; };
  var r = resumoPessoas(), q = semAcento(busca);
  var acha = function(x){ return !q || semAcento(x.nome).indexOf(q)>=0; };
  var fs = funcionarios().map(function(f){ return Object.assign({}, f, {cnpjTxt:nomeCnpj(f.cnpj)}); }).filter(acha);
  var reps = REPRESENTANTES.filter(acha);
  var botao = function(k, t){ return e("button",{key:k, onClick:function(){ setModo(k); }, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ring-1 "+(modo===k ? "bg-primary/15 ring-2 ring-primary" : "bg-card ring-border hover:bg-muted/40")}, t); };
  var gruposFunc = modo==="setor"
    ? FUNCIONARIOS_POR_SETOR.map(function(st){ return {titulo:st[0], itens:fs.filter(function(f){ return f.setor===st[0]; }), coluna:"cnpj"}; })
    : cn.map(function(c){ return {titulo:c.num ? "CNPJ "+c.num+" · "+c.nome : c.nome, cor:c.cor, itens:fs.filter(function(f){ return f.cnpj===c.id; }), coluna:"setor"}; })
      .concat([{titulo:"CNPJ a informar", itens:fs.filter(function(f){ return !f.cnpj; }), coluna:"setor"}]);
  return e(React.Fragment,null,
    e(PageHead,{t:"Funcionários e representantes", sub:"Quem faz parte da Sorelly, organizado por setor ou por CNPJ."}),
    e("div",{className:"mx-auto flex w-full max-w-5xl flex-col gap-4"},
      e("div",{className:"grid grid-cols-2 gap-3 md:grid-cols-5"},
        e(Numero,{n:r.operacao, t:"Pessoas na operação", sub:"sem as representantes"}),
        e(Numero,{n:r.funcionarios, t:"Funcionários", sub:"CLT"}),
        e(Numero,{n:r.socios, t:"Sócios e família"}),
        e(Numero,{n:r.pjs, t:"PJ", sub:"H&O Apps e tráfego"}),
        e(Numero,{n:r.representantes, t:"Representantes", sub:r.repsTambemFunc ? "+ "+r.repsTambemFunc+" que também são funcionárias" : ""}),
        ),
      e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
        e("span",{className:"text-[12.5px] font-semibold"},"Organizar por:"), botao("setor","Setor"), botao("cnpj","CNPJ"),
        e("input",{className:INPUT+" h-9! w-64 text-[13px]!", placeholder:"Buscar pessoa…", value:busca, "aria-label":"Buscar pessoa", onChange:function(ev){ setBusca(ev.target.value); }})),
      e(BlocoBarra,{t:"Pessoas da operação", sub:fs.length+" pessoas · por "+(modo==="setor" ? "setor" : "CNPJ")},
        e("div",{className:"flex flex-col gap-2 p-3"},
          gruposFunc.filter(function(g){ return g.itens.length; }).map(function(g){ return e(Grupo,{key:g.titulo, titulo:g.titulo, cor:g.cor, itens:g.itens, coluna:g.coluna, mostraCpf:mostraCpf}); }),
          !fs.length && e("p",{className:"py-2 text-center text-[13px] text-white/70"},"Ninguém encontrado."))),
      e(BlocoBarra,{cor:"roxo", t:"Representantes", sub:reps.length+" nomes · CPF e CNPJ de cada uma a informar"},
        e("div",{className:"p-3"}, reps.length ? e(Grupo,{titulo:"Representantes", itens:reps, mostraCpf:mostraCpf}) : e("p",{className:"py-2 text-center text-[13px] text-white/70"},"Ninguém encontrado.")))));
}

export { AbaPessoas };
