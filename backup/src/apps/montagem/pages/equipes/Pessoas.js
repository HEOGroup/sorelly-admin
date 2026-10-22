// Sorelly Admin · montagem — pages/equipes/Pessoas.js
// Aba Pessoas: busca, onde cada pessoa aparece, pessoas do quadro sem departamento e as duas ações em lote (importar setores, vincular automaticamente).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BarraFiltros, Faixa, Indicador, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { eqBusca, eqDepartamentosDaPessoa, eqIndicadores, eqPessoasSemDepartamento } from "@/apps/montagem/domain/equipes";
import { Bt, ChipPessoa, Confirma, useEquipes } from "@/apps/montagem/pages/equipes/pecas";
import { Busca, Sel, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { norm } from "@/apps/montagem/pages/compras/pecas";
import { e, useState } from "@/shared/react";

var LIMITE = 30;
var AVISOS = {
  importar_setores:{t:"Importar setores do quadro", rotulo:"Importar", texto:"Serão criados os departamentos e as pessoas dos setores da tela Pessoas que ainda não constam no organograma. O que já existe não será duplicado."},
  vincular_auto:{t:"Vincular automaticamente", rotulo:"Vincular", texto:"Cada pessoa do organograma será ligada à pessoa do quadro quando o nome corresponder a uma única pessoa. Nomes ambíguos permanecem sem vínculo."}};

// pessoas do organograma, uma linha por pessoa (pessoaId ou nome), com todos os departamentos em que aparece
function pessoasDoOrganograma(eq, s){
  var vistos = {}, r = [];
  eq.membros.forEach(function(m){ var k = m.pessoaId || norm(m.nome); if(vistos[k]) return; vistos[k] = 1;
    var onde = {}; eqDepartamentosDaPessoa(s, m.nome).concat(m.pessoaId ? eqDepartamentosDaPessoa(s, m.pessoaId) : []).forEach(function(x){ onde[x.membroId] = x; });
    r.push({nome:m.nome, vinculada:!!m.pessoaId, onde:Object.keys(onde).map(function(i){ return onde[i]; })}); });
  return r.sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
}

function AbaPessoas(p){
  var q = useEquipes(), bu = useState(""), esc = useState({}), mais = useState(false), conf = useState(null);
  var ind = eqIndicadores(q.s), texto = bu[0].trim();
  var achados = texto ? eqBusca(q.s, texto) : null;
  var todas = pessoasDoOrganograma(q.eq, q.s);
  var visiveis = texto ? todas.filter(function(x){ return norm(x.nome).indexOf(norm(texto))>=0; }) : todas;
  var sem = eqPessoasSemDepartamento(q.s).filter(function(x){ return !texto || norm(x.nome).indexOf(norm(texto))>=0; });
  var semVer = mais[0] ? sem : sem.slice(0, LIMITE);
  var deptos = q.eq.departamentos.filter(function(d){ return !d.arquivado; }).map(function(d){ return [String(d.id), d.nome]; });
  var adiciona = function(x){ var dep = esc[0][x.id]; if(!dep) return; q.exec("mem_add", {deptoId:dep, nome:x.nome, papel:"FUNCIONARIO", pessoaId:x.id}); };
  var roda = function(op){ conf[1](null); q.exec(op, {}); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(Indicador,{t:"Pessoas no organograma", v:ind.pessoasUnicas, cor:"info"}),
      e(Indicador,{t:"Vinculadas ao quadro", v:ind.vinculados, cor:"ok"}),
      e(Indicador,{t:"Sem departamento", v:ind.pessoasSemDepartamento, cor:ind.pessoasSemDepartamento ? "alerta" : "ok"}),
      e(Indicador,{t:"Departamentos", v:ind.departamentos, cor:"#8B5CF6"})),
    e(BarraFiltros,{ativo:!!texto, onLimpar:function(){ bu[1](""); }},
      e(Busca,{v:bu[0], set:bu[1], ph:"Buscar pessoa, departamento ou setor"}),
      e(Bt,{ic:"download-simple", className:"h-9 py-0!", disabled:!q.pode, semAut:true, onClick:function(){ conf[1]("importar_setores"); }}, "Importar setores do quadro"),
      e(Bt,{ic:"link", className:"h-9 py-0!", disabled:!q.pode, semAut:true, onClick:function(){ conf[1]("vincular_auto"); }}, "Vincular automaticamente")),
    achados && e("div",{className:"flex flex-col gap-1 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
      e("div",{className:"text-center text-[12px] font-bold uppercase tracking-wide text-white/70"}, "Resultado da busca ("+achados.length+")"),
      achados.length
        ? e("div",{className:"flex flex-wrap justify-center gap-1.5"}, achados.map(function(x){ return e("span",{key:x.tipo+x.id, className:"inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[12px] ring-1 ring-white/10 "+(x.arquivado ? "opacity-60" : "")},
            e(Ph,{n:x.tipo==="depto" ? "buildings" : "user", s:13, className:"text-white/60"}), e("b",null, x.nome), x.tipo==="membro" && e("span",{className:"text-white/60"}, "em "+x.deptoNome)); }))
        : e("div",{className:"text-center text-[12.5px] text-white/60"}, "Nada encontrado.")),
    visiveis.length
      ? e("div",{className:"rounded-xl bg-black/20 p-1 ring-1 ring-white/10"}, e(Tab,{cols:["Pessoa", "Vínculo", "Aparece em"]},
          visiveis.map(function(x){ return e("tr",{key:x.nome, className:LINHA},
            e(Td,{forte:true}, x.nome),
            e(Td,null, e(Ph,{n:x.vinculada ? "link" : "link-break", s:15, className:x.vinculada ? "text-[#4ADE80]" : "text-white/35", style:{}})),
            e("td",{className:"px-2 py-1.5 align-middle"}, e("div",{className:"flex flex-wrap justify-center gap-1"}, x.onde.map(function(o){ return e("span",{key:o.membroId, className:"inline-flex"}, e(ChipPessoa,{nome:o.deptoNome, papel:o.papel})); })))); })))
      : e(Vazio,{ic:"users-three"}, texto ? "Nenhuma pessoa encontrada." : "Nenhuma pessoa no organograma."),
    sem.length>0 && e("div",{className:"flex flex-col gap-1.5"},
      e("div",{className:"flex items-center justify-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[#FBBF24]"}, e(Ph,{n:"warning", s:14}), "Pessoas do quadro sem departamento ("+sem.length+")"),
      e("div",{className:"rounded-xl bg-black/20 p-1 ring-1 ring-white/10"}, e(Tab,{cols:["Pessoa", "Setor no quadro", "Departamento", ""]},
        semVer.map(function(x){ return e("tr",{key:x.id, className:LINHA},
          e(Td,{forte:true}, x.nome),
          e(Td,null, x.setor || "—"),
          e("td",{className:"px-2 py-1 align-middle"}, e(Sel,{v:esc[0][x.id]||"", set:function(d){ var n = Object.assign({}, esc[0]); n[x.id] = d; esc[1](n); }, rot:"Departamento", todos:"Escolher departamento", opcoes:deptos, className:"w-full min-w-44"})),
          e(Td,null, e(Bt,{tipo:"forte", ic:"user-plus", className:"py-1.5!", disabled:!q.pode || !esc[0][x.id], semAut:!q.pode, onClick:function(){ adiciona(x); }}, "Adicionar"))); }))),
      !mais[0] && sem.length>LIMITE && e("div",{className:"flex justify-center"}, e(Bt,{onClick:function(){ mais[1](true); }}, "Ver mais ("+(sem.length-LIMITE)+")"))),
    conf[0] && e(Confirma,{t:AVISOS[conf[0]].t, texto:AVISOS[conf[0]].texto, rotulo:AVISOS[conf[0]].rotulo, ic:"warning", fechar:function(){ conf[1](null); }, confirmar:function(){ roda(conf[0]); }}));
}

export { AbaPessoas };
