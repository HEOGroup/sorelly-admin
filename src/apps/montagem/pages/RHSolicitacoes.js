// Sorelly Admin · montagem — pages/RHSolicitacoes.js
// RH → Solicitações (01/11/2026, pedido do Marcus): a supervisão do setor (hoje Deysiane) pede mudança de setor, função, escala ou horário de entrada de uma colaboradora; o RH confirma ou recusa.
// Só vale depois que o RH aprova: ao aprovar, o cadastro da colaboradora muda na hora (ação RH colab_set). Estado em s.rhsol (módulo "rhsol", uma chave por pedido).
// Quem pede: autorização rh_solicita_mudanca. Quem confirma: rh_confirma_mudanca (domain/autorizacoes.js).
import { Aviso, Bloco, Botao, CAMPO, CampoSel, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { FUNCIONARIOS_POR_SETOR } from "@/apps/montagem/domain/pessoas";
import { colaboradoresRh } from "@/apps/montagem/domain/rh";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var CAMPOS = [["setor", "Setor"], ["funcao", "Função"], ["escalaId", "Escala"], ["entrada", "Horário de entrada"]];
var br = function(ms){ var d = new Date(ms); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"); };
var ROT = {pendente: "Pendente", aprovada: "Aprovada", recusada: "Recusada"};
var COR_ST = {pendente: "text-warning", aprovada: "text-success", recusada: "text-destructive"};

function AbaRhSolic(){
  var cx = use(), s = cx.state, d = cx.dispatch, eu = s.usuario;
  var pede = temAutorizacao("rh_solicita_mudanca", eu), confirma = temAutorizacao("rh_confirma_mudanca", eu);
  var todos = colaboradoresRh(s).filter(function(x){ return x.status !== "DESLIGADO"; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
  var escalas = (s.rh.config.escalas || []), setores = FUNCIONARIOS_POR_SETOR.map(function(x){ return x[0]; }).filter(function(n){ return n !== "Sócios e família" && n.indexOf("PJ") < 0; });
  var f0 = useState({colabId: "", campo: "setor", para: "", motivo: ""}), f = f0[0], setF = f0[1], v0 = useState("pendentes"), vista = v0[0], setVista = v0[1];
  var colab = todos.find(function(x){ return x.id === f.colabId; });
  var nomeEscala = function(id){ var k = escalas.find(function(y){ return y.id === id; }); return k ? k.nome : "—"; };
  var atual = function(x, campo){ return !x ? "—" : campo === "setor" ? x.setor : campo === "funcao" ? (x.funcao || "—") : campo === "escalaId" ? nomeEscala(x.escalaId) : (x.entrada || "—"); };
  var txtPara = function(campo, v){ return campo === "escalaId" ? nomeEscala(v) : v; };
  var lista = Object.keys(s.rhsol || {}).map(function(k){ return s.rhsol[k]; }).sort(function(a, b){ return b.em - a.em; }), pend = lista.filter(function(x){ return x.estado === "pendente"; }).length;
  var vis = vista === "pendentes" ? lista.filter(function(x){ return x.estado === "pendente"; }) : lista;
  var enviar = function(){
    var item = {id: "sol-" + Date.now().toString(36), colabId: colab.id, nome: colab.nome, campo: f.campo, de: f.campo === "escalaId" ? colab.escalaId : atual(colab, f.campo), para: f.para.trim(), motivo: f.motivo.trim(), por: nomeDe(eu), porId: eu, em: Date.now(), estado: "pendente"};
    d({type: "RHSOL", op: "add", item: item}); setF({colabId: "", campo: f.campo, para: "", motivo: ""});
  };
  var aprovar = function(x){
    var patch = {}; patch[x.campo] = x.para;
    d({type: "RH", op: "colab_set", id: x.colabId, patch: patch, por: nomeDe(eu)});
    d({type: "RHSOL", op: "set", id: x.id, patch: {estado: "aprovada", decididoPor: nomeDe(eu), decididoEm: Date.now()}});
  };
  var recusar = function(x){
    var m = window.prompt("Motivo da recusa (a supervisão vai ver):", ""); if(m === null) return;
    d({type: "RHSOL", op: "set", id: x.id, patch: {estado: "recusada", decididoPor: nomeDe(eu), decididoEm: Date.now(), motivoRh: String(m).trim()}});
  };
  var podeEnviar = !!colab && !!f.para.trim() && f.motivo.trim().length > 2;
  var campoPara = f.campo === "setor" ? e(CampoSel,{t: "Novo setor", id: "sol-para", value: f.para, onChange: function(v){ setF(Object.assign({}, f, {para: v})); }, opcoes: [["", "Escolha…"]].concat(setores.map(function(n){ return [n, n]; }))})
    : f.campo === "escalaId" ? e(CampoSel,{t: "Nova escala", id: "sol-para", value: f.para, onChange: function(v){ setF(Object.assign({}, f, {para: v})); }, opcoes: [["", "Escolha…"]].concat(escalas.map(function(y){ return [y.id, y.nome]; }))})
    : e("div",{className: "min-w-0"}, e(Rotulo,{t: f.campo === "funcao" ? "Nova função" : "Novo horário de entrada", id: "sol-para"}), e("input",{id: "sol-para", type: f.campo === "entrada" ? "time" : "text", value: f.para, className: CAMPO, onChange: function(ev){ setF(Object.assign({}, f, {para: ev.target.value})); }}));
  return e("div",{className: "flex flex-col gap-3"},
    e(PageHead,{t: "Solicitações de mudança", sub: "A supervisão pede a mudança de setor, função, escala ou horário. O RH confirma. Só vale depois da confirmação."}),
    pede ? e(Bloco,{t: "Nova solicitação"},
      e("div",{className: "grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
        e(CampoSel,{t: "Colaboradora", id: "sol-colab", cls: "col-span-2", value: f.colabId, onChange: function(v){ setF(Object.assign({}, f, {colabId: v, para: ""})); }, opcoes: [["", "Escolha…"]].concat(todos.map(function(x){ return [x.id, x.nome + " · " + x.setor]; }))}),
        e(CampoSel,{t: "O que muda", id: "sol-campo", value: f.campo, onChange: function(v){ setF(Object.assign({}, f, {campo: v, para: ""})); }, opcoes: CAMPOS}),
        e("div",{className: "min-w-0"}, e(Rotulo,{t: "Hoje", id: "sol-hoje"}), e("div",{id: "sol-hoje", className: CAMPO + " flex items-center truncate", title: atual(colab, f.campo)}, atual(colab, f.campo))),
        campoPara,
        e("div",{className: "col-span-2 min-w-0"}, e(Rotulo,{t: "Motivo", id: "sol-motivo"}), e("input",{id: "sol-motivo", value: f.motivo, className: CAMPO, onChange: function(ev){ setF(Object.assign({}, f, {motivo: ev.target.value})); }})),
        e("div",{className: "flex items-end justify-end"}, e(Botao,{principal: true, desabilitado: !podeEnviar, onClick: enviar}, "Enviar ao RH")))) : e(Aviso,null, "Você pode ver as solicitações, mas só a supervisão do setor pede mudança."),
    e("div",{className: "flex items-center justify-between gap-2"}, e(Segmentado,{atual: vista, onMudar: setVista, opcoes: [["pendentes", "Pendentes (" + pend + ")"], ["todas", "Todas (" + lista.length + ")"]]}),
      confirma ? e("span",{className: "text-[13px] text-foreground"}, "Você pode aprovar ou recusar.") : e("span",{className: "text-[13px] text-foreground"}, "O RH confirma e você vê a resposta aqui.")),
    e(TabelaP,{minW: 760, cols: [{t: "Data", w: 64}, {t: "Colaboradora", w: 200}, {t: "Mudança"}, {t: "Pedido por", w: 110}, {t: "Situação", w: 90}, {t: "", w: 170}]},
      vis.length === 0 ? e("tr",null, e("td",{colSpan: 6, className: "h-8 px-2.5 text-center text-[13px] text-foreground"}, "Nenhuma solicitação.")) : vis.map(function(x){
        var campoNome = (CAMPOS.find(function(k){ return k[0] === x.campo; }) || [])[1] || x.campo, txt = campoNome + ": " + (x.campo === "escalaId" ? nomeEscala(x.de) : x.de) + " → " + txtPara(x.campo, x.para) + (x.motivo ? " · " + x.motivo : "");
        return e(Tr,{key: x.id},
          e(Td,{}, br(x.em)), e(Td,{forte: true}, x.nome), e(Td,{title: txt}, txt), e(Td,{}, x.por),
          e(Td,{cor: COR_ST[x.estado], forte: true, title: x.motivoRh || ""}, ROT[x.estado] + (x.estado !== "pendente" && x.decididoPor ? " · " + x.decididoPor.split(" ")[0] : "")),
          e(Td,{}, x.estado === "pendente" && confirma ? e("span",{className: "flex gap-1"}, e(Botao,{principal: true, onClick: function(){ aprovar(x); }}, "Aprovar"), e(Botao,{onClick: function(){ recusar(x); }}, "Recusar")) : x.estado === "recusada" && x.motivoRh ? x.motivoRh : "")); }))
  );
}
export { AbaRhSolic };
