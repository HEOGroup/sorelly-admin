// Sorelly Admin · montagem — pages/equipes/JanelaDepto.js
// Janela em colunas de um departamento: resumo e acesso | pessoas | ações. Também a janela "Novo departamento".
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { Janela, degrade } from "@/apps/montagem/components/padrao";
import { ROTULO_PAPEL, descendentes, eqDepartamento, eqPessoasDisponiveis, eqSetoresAcesso } from "@/apps/montagem/domain/equipes";
import { Bt, ChipPessoa, Confirma, Ic, ROXO, useEquipes } from "@/apps/montagem/pages/equipes/pecas";
import { Campo, Sel, Selo } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var CAIXA = "flex min-w-0 flex-col gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10";
var TIT = "flex items-center justify-center gap-1.5 text-center text-[12px] font-bold uppercase tracking-wide text-white/80";
var H9 = "h-9! text-[13px]! w-full text-center";
// opções de departamento acima: todos, menos ele mesmo e o que está dentro dele
function opcoesPai(eq, s, id){
  var fora = id!=null ? [String(id)].concat(descendentes(s, id).map(String)) : [];
  return eq.departamentos.filter(function(d){ return fora.indexOf(String(d.id))<0; }).map(function(d){ return [String(d.id), d.nome]; });
}
function Titulo(p){ return e("div",{className:TIT}, e(Ph,{n:p.ic, s:14}), p.children); }

// ----- coluna das pessoas -----
function LinhaPessoa(p){
  var m = p.m, st = useState(null), modo = st[0], setModo = st[1], v = useState(""), val = v[0], setVal = v[1];
  var sup = m.papel==="SUPERVISOR";
  var abre = function(x){ setVal(""); setModo(modo===x ? null : x); };
  var ok = function(){ if(!val) return; if(modo==="mover") p.exec("mem_edit", {id:m.id, deptoId:val}); else p.exec("mem_edit", {id:m.id, pessoaId:val==="-" ? null : val}); setModo(null); };
  return e("div",{className:"flex flex-col gap-1.5 rounded-lg bg-white/5 px-2 py-1.5 ring-1 "+(sup ? "ring-[#E8B84B]/40" : "ring-white/10")},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      e("div",{className:"flex min-w-0 flex-1 basis-32 items-center justify-center gap-1.5 text-center"}, e(ChipPessoa,{nome:m.nome, papel:m.papel}),
        e(Ph,{n:m.pessoaId ? "link" : "link-break", s:14, className:m.pessoaId ? "text-[#4ADE80]" : "text-white/35", style:{}}),
        ),
      e("div",{className:"flex flex-wrap justify-center gap-1"},
        e(Ic,{ic:"arrow-up", titulo:"Subir", disabled:!p.pode, semAut:true, onClick:function(){ p.exec("mem_ordem", {id:m.id, dir:-1}); }}),
        e(Ic,{ic:"arrow-down", titulo:"Descer", disabled:!p.pode, semAut:true, onClick:function(){ p.exec("mem_ordem", {id:m.id, dir:1}); }}),
        e(Ic,{ic:"crown", titulo:sup ? "Passar para funcionário(a)" : "Passar para supervisão", disabled:!p.pode, semAut:true, onClick:function(){ p.exec("mem_edit", {id:m.id, papel:sup ? "FUNCIONARIO" : "SUPERVISOR"}); }}),
        e(Ic,{ic:"identification-badge", titulo:"Vincular a uma pessoa do quadro", forte:modo==="vincular", disabled:!p.pode, semAut:true, onClick:function(){ abre("vincular"); }}),
        e(Ic,{ic:"arrows-left-right", titulo:"Mover para outro departamento", forte:modo==="mover", disabled:!p.pode, semAut:true, onClick:function(){ abre("mover"); }}),
        e(Ic,{ic:"trash", titulo:"Remover do departamento", perigo:true, disabled:!p.pode, semAut:true, onClick:function(){ p.exec("mem_del", {id:m.id}); }}))),
    modo && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
      modo==="mover"
        ? e(Sel,{v:val, set:setVal, rot:"Departamento de destino", todos:"Departamento de destino", opcoes:p.deptos.filter(function(o){ return o[0]!==String(m.deptoId); }), className:"min-w-0 flex-1"})
        : e(Sel,{v:val, set:setVal, rot:"Pessoa do quadro", todos:"Pessoa do quadro", opcoes:[["-","Sem vínculo"]].concat(p.quadro.map(function(x){ return [x.id, x.nome]; })), className:"min-w-0 flex-1"}),
      e(Bt,{tipo:"forte", ic:"check", disabled:!val, onClick:ok}, "Aplicar")));
}
function ColunaPessoas(p){
  var d = p.d, nome = useState(""), papel = useState("FUNCIONARIO"), quadro = useState("");
  var deptos = p.eq.departamentos.map(function(x){ return [String(x.id), x.nome]; });
  var disponiveis = eqPessoasDisponiveis(p.s);
  var escolheQuadro = function(id){ quadro[1](id); var x = disponiveis.filter(function(y){ return y.id===id; })[0]; if(x) nome[1](x.nome); };
  var adiciona = function(){ if(!nome[0].trim()) return; if(p.exec("mem_add", {deptoId:d.id, nome:nome[0], papel:papel[0], pessoaId:quadro[0]||null})){ nome[1](""); quadro[1](""); } };
  return e("div",{className:CAIXA},
    e(Titulo,{ic:"users-three"}, "Pessoas ("+d.total+")"),
    d.membros.length ? e("div",{className:"flex flex-col gap-1.5"}, d.membros.map(function(m){ return e(LinhaPessoa,{key:m.id, m:m, exec:p.exec, pode:p.pode, deptos:deptos, quadro:disponiveis}); }))
      : e("p",{className:"rounded-lg bg-black/20 px-3 py-4 text-center text-[12.5px] text-white/65"}, "Nenhuma pessoa neste departamento."),
    e("div",{className:"flex flex-col gap-1.5 border-t border-white/10 pt-2"},
      e(Sel,{v:quadro[0], set:escolheQuadro, rot:"Pessoa do quadro", todos:"Escolher do quadro (opcional)", opcoes:disponiveis.map(function(x){ return [x.id, x.nome+(x.jaNoOrganograma ? " ·  já no organograma" : "")]; }), className:"w-full"}),
      e("input",{value:nome[0], onChange:function(ev){ nome[1](ev.target.value); }, placeholder:"Nome da pessoa", "aria-label":"Nome da pessoa", disabled:!p.pode, className:INPUT+" "+H9}),
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
        e("select",{value:papel[0], onChange:function(ev){ papel[1](ev.target.value); }, "aria-label":"Papel", disabled:!p.pode, className:INPUT+" h-9! cursor-pointer text-center text-[13px]! min-w-0 flex-1"},
          ["FUNCIONARIO","SUPERVISOR"].map(function(k){ return e("option",{key:k, value:k}, ROTULO_PAPEL[k]); })),
        e(Bt,{tipo:"forte", ic:"user-plus", disabled:!p.pode || !nome[0].trim(), semAut:!p.pode, onClick:adiciona}, "Adicionar"))));
}

// ----- coluna de resumo e acesso -----
function ColunaResumo(p){
  var d = p.d;
  return e("div",{className:CAIXA},
    e(Titulo,{ic:"buildings"}, "Dados e acesso"),
    d.caminho.length>1 && e("p",{className:"text-center text-[12px] text-white/65"}, d.caminho.map(function(x){ return x.nome; }).join(" › ")),
    e("div",{className:"grid grid-cols-3 gap-1.5"},
      [["Pessoas", d.total], ["Supervisão", d.supervisores.length], ["Subdeptos.", d.subdepartamentos.length]].map(function(x){
        return e("div",{key:x[0], className:"flex flex-col items-center rounded-lg px-1 py-1", style:degrade(ROXO)}, e("b",{className:MONO+" text-[19px] leading-none"}, x[1]), e("span",{className:"mt-1 text-[10px] font-bold uppercase tracking-wide text-white/75"}, x[0])); })),
    e("div",{className:"flex flex-col items-center gap-1"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/65"}, "Setor de acesso"),
      d.setorAcesso ? e(Selo,{cor:d.setorOrfao ? "alerta" : ROXO, ic:"shield-check", titulo:d.setorOrfao ? "Setor que não existe mais" : "Vínculo informativo"}, d.setorRotulo) : e("span",{className:"text-[12.5px] text-white/55"}, "Nenhum setor vinculado"),
      e("span",{className:"text-center text-[11px] text-white/50"}, "O vínculo é informativo: o acesso é definido em Acessos por setor.")),
    d.supervisores.length>0 && e("div",{className:"flex flex-wrap justify-center gap-1"}, d.supervisores.map(function(m){ return e(ChipPessoa,{key:m.id, nome:m.nome, papel:m.papel}); })),
    d.subdepartamentos.length>0 && e("div",{className:"flex flex-col items-center gap-1"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/65"}, "Subdepartamentos"),
      e("div",{className:"flex flex-wrap justify-center gap-1"}, d.subdepartamentos.map(function(x){ return e("button",{key:x.id, type:"button", onClick:function(){ p.abrir(x.id); }, className:"rounded-full bg-white/10 px-2 py-0.5 text-[11.5px] font-bold hover:bg-white/20"}, x.nome); }))),
    e("div",{className:"flex flex-col items-center gap-1 border-t border-white/10 pt-2"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/65"}, "Quem tem acesso a este setor"),
      d.setorAcesso
        ? d.quemTemAcesso.length ? e("div",{className:"flex flex-wrap justify-center gap-1"}, d.quemTemAcesso.map(function(x, i){ return e("span",{key:i, title:x.motivo, className:"rounded-full bg-white/10 px-2 py-0.5 text-[11.5px]"}, x.nome); }))
          : e("span",{className:"text-[12.5px] text-white/55"}, "Ninguém no momento.")
        : e("span",{className:"text-[12.5px] text-white/55"}, "Vincule um setor para ver.")));
}

// ----- coluna de ações -----
function ColunaAcoes(p){
  var d = p.d, nome = useState(d.nome), setor = useState(d.setorAcesso||""), pai = useState(d.paiId==null ? "" : String(d.paiId)), ex = useState(false);
  var opSetor = eqSetoresAcesso().map(function(x){ return [x.k, x.nome]; });
  var salva = function(){ p.exec("dep_edit", {id:d.id, nome:nome[0], setorAcesso:setor[0]||null, paiId:pai[0]||null}); };
  var mudou = nome[0].trim()!==d.nome || (setor[0]||"")!==(d.setorAcesso||"") || pai[0]!==(d.paiId==null ? "" : String(d.paiId));
  var afetadas = d.total, subs = d.subdepartamentos.length;
  return e("div",{className:CAIXA},
    e(Titulo,{ic:"pencil-simple"}, "Ações"),
    e(Campo,{rot:"Nome do departamento"}, e("input",{value:nome[0], onChange:function(ev){ nome[1](ev.target.value); }, disabled:!p.pode, className:INPUT+" "+H9})),
    e(Campo,{rot:"Setor de acesso"}, e(Sel,{v:setor[0], set:setor[1], rot:"Setor de acesso", todos:"Nenhum setor", opcoes:opSetor, className:"w-full"})),
    e(Campo,{rot:"Departamento acima"}, e(Sel,{v:pai[0], set:pai[1], rot:"Departamento acima", todos:"Nenhum (primeiro nível)", opcoes:opcoesPai(p.eq, p.s, d.id), className:"w-full"})),
    e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.pode || !mudou, semAut:!p.pode, onClick:salva}, "Salvar alterações"),
    e("div",{className:"flex flex-wrap justify-center gap-1.5 border-t border-white/10 pt-2"},
      e(Bt,{ic:d.arquivado ? "arrow-counter-clockwise" : "archive", disabled:!p.pode, semAut:true, onClick:function(){ p.exec("dep_arquivar", {id:d.id}); }}, d.arquivado ? "Reativar" : "Arquivar"),
      e(Bt,{tipo:"perigo", ic:"trash", disabled:!p.pode, semAut:true, onClick:function(){ ex[1](true); }}, "Excluir")),
    ex[0] && e(Confirma,{t:"Excluir departamento", perigo:true, rotulo:"Excluir", texto:"Será excluído o departamento "+d.nome+(afetadas ? ", com "+afetadas+(afetadas===1 ? " pessoa vinculada" : " pessoas vinculadas")+" a ele" : "")+"."+(subs ? " "+subs+(subs===1 ? " subdepartamento passará" : " subdepartamentos passarão")+" para o nível acima." : "")+" Esta ação não pode ser desfeita.",
      fechar:function(){ ex[1](false); }, confirmar:function(){ ex[1](false); p.exec("dep_del", {id:d.id}); p.fechar(); }}));
}

// Janela do departamento (id). Fecha sozinha se ele for excluído.
function JanelaDepto(p){
  var q = useEquipes(), d = eqDepartamento(q.s, p.id);
  if(!d) return null;
  var sub = (d.arquivado ? "Arquivado · " : "")+d.total+(d.total===1 ? " pessoa" : " pessoas");
  return e(Janela,{t:d.nome, sub:sub, fechar:p.fechar, colunas:[
    e(ColunaResumo,{key:"r", d:d, abrir:p.abrir}),
    e(ColunaPessoas,{key:"p", d:d, s:q.s, eq:q.eq, pode:q.pode, exec:q.exec}),
    e(ColunaAcoes,{key:"a", d:d, s:q.s, eq:q.eq, pode:q.pode, exec:q.exec, fechar:p.fechar})]});
}

// Janela "Novo departamento": nome, setor opcional, pai opcional
function JanelaNovo(p){
  var q = useEquipes(), nome = useState(""), setor = useState(""), pai = useState(p.paiId==null ? "" : String(p.paiId));
  var cria = function(){ if(q.exec("dep_add", {nome:nome[0], setorAcesso:setor[0]||null, paiId:pai[0]||null})) p.fechar(); };
  return e(Janela,{t:"Novo departamento", sub:"Informe o nome; o setor de acesso e o departamento acima são opcionais.", fechar:p.fechar, colunas:[
    e("div",{key:"n", className:CAIXA},
      e(Titulo,{ic:"buildings"}, "Dados"),
      e(Campo,{rot:"Nome do departamento"}, e("input",{value:nome[0], autoFocus:true, onChange:function(ev){ nome[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") cria(); }, className:INPUT+" "+H9})),
      e(Campo,{rot:"Setor de acesso (opcional)"}, e(Sel,{v:setor[0], set:setor[1], rot:"Setor de acesso", todos:"Nenhum setor", opcoes:eqSetoresAcesso().map(function(x){ return [x.k, x.nome]; }), className:"w-full"})),
      e(Campo,{rot:"Departamento acima (opcional)"}, e(Sel,{v:pai[0], set:pai[1], rot:"Departamento acima", todos:"Nenhum (primeiro nível)", opcoes:opcoesPai(q.eq, q.s, null), className:"w-full"})))],
    rodape:[e(Bt,{key:"c", onClick:p.fechar}, "Cancelar"), e(Bt,{key:"s", tipo:"forte", ic:"plus", disabled:!q.pode || !nome[0].trim(), semAut:!q.pode, onClick:cria}, "Criar departamento")]});
}

export { JanelaDepto, JanelaNovo };
