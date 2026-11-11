// Sorelly Admin · montagem — pages/FinanceiroAtividades.js
// Financeiro › Atividades (pedido do Marcus, 03/11/2026): lista do que fica para FAZER DEPOIS ("quando tiver um pouco mais de tempo"). Qualquer pessoa do Financeiro anota, escolhe quando e quem faz, e conclui com uma resposta opcional.
// Diferente das Atividades do Agendamento (que nascem sozinhas da DevMaster): aqui a pessoa escreve. Guarda no módulo "finativ" (chaves "fa_..." uma por atividade), só do setor Financeiro e da Diretoria.
// Quando: "Quando tiver tempo" (sem data), "Esta semana", "Este mês" ou "Em uma data" (fica vermelha depois da data). A lista abre ordenada pelo que é mais urgente.
import { Botao, CAMPO, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { BTN_OURO, CARD_ESTILO, ROTULO, TOPO_ESTILO } from "@/apps/montagem/pages/AgendamentoRevendedoras";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { abaVisivel } from "@/apps/montagem/lib/aba-visivel";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useRef, useState } from "@/shared/react";

var QUANDO = [["tempo", "Quando tiver tempo"], ["semana", "Esta semana"], ["mes", "Este mês"], ["data", "Em uma data"]];
var ORDEM = {data:0, semana:1, mes:2, tempo:3};
var rotuloQuando = function(a){ return a.quando==="data" ? "Até "+dBRA(a.data) : (QUANDO.find(function(q){ return q[0]===a.quando; }) || ["", "Quando tiver tempo"])[1]; };
var dBRA = function(i){ return i ? String(i).slice(8, 10)+"/"+String(i).slice(5, 7)+"/"+String(i).slice(0, 4) : "—"; };
var novoId = function(){ return "fa_"+Date.now().toString(36)+Math.random().toString(36).slice(2, 6); };
var CAIXA = "w-full min-h-[72px] rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary";

function AbaFinAtividades(){
  var cx = use(), s = cx.state, eu = nomeDe(s.usuario), hoje = isoDia(new Date());
  var st = useState({itens:{}, pronto:false, msg:""}), d = st[0], setD = st[1];
  var vs = useState("abertas"), vis = vs[0], setVis = vs[1];
  var ed = useState(null), edit = ed[0], setEdit = ed[1];   // atividade aberta na janela (id null = nova)
  var er = useState(""), erro = er[0], setErro = er[1], co = useState(""), como = co[0], setComo = co[1], ex = useState(false), confirma = ex[0], setConfirma = ex[1];

  var carregar = function(){
    if(!apiAtiva()){ setD(function(x){ return Object.assign({}, x, {pronto:true, msg:"Precisa do servidor ligado."}); }); return; }
    chamar("GET", "/estado/finativ").then(function(r){
      var c = (r && r.conteudo) || {}, itens = {}; Object.keys(c).forEach(function(k){ if(k.indexOf("fa_")===0 && c[k] && c[k].id) itens[k] = c[k]; });
      setD({itens:itens, pronto:true, msg:""});
    }).catch(function(x){ setD(function(p){ return Object.assign({}, p, {pronto:true, msg:x.message}); }); });
  };
  var ref = useRef(null); ref.current = carregar;
  useEffect(function(){ ref.current(); var t = setInterval(function(){ if(abaVisivel()) ref.current(); }, 60000); return function(){ clearInterval(t); }; }, []);

  var gravar = function(rec){
    return chamar("PUT", "/estado/finativ", {chaves:{[rec.id]:rec}}).then(function(){ setD(function(x){ var n = Object.assign({}, x.itens); n[rec.id] = rec; return Object.assign({}, x, {itens:n}); }); return true; }).catch(function(x){ setErro(x.message); return false; });
  };
  var linhas = Object.keys(d.itens).map(function(k){ var a = d.itens[k], aberta = a.status!=="concluida";
    return Object.assign({}, a, {aberta:aberta, atrasada:aberta && a.quando==="data" && a.data<hoje, quandoTxt:rotuloQuando(a), ordem:(ORDEM[a.quando]===undefined ? 3 : ORDEM[a.quando])+(a.quando==="data" ? a.data : "9999-99-99")}); })
    .sort(function(a, b){ return a.ordem.localeCompare(b.ordem) || String(a.criadaEm).localeCompare(String(b.criadaEm)); });
  var abertas = linhas.filter(function(l){ return l.aberta; }), conclu = linhas.filter(function(l){ return !l.aberta; }).sort(function(a, b){ return String(b.concluidaEm).localeCompare(String(a.concluidaEm)); });
  var lista = vis==="abertas" ? abertas : conclu;
  var colAbertas = [
    {k:"q", t:"Quando", v:function(l){ return l.quandoTxt; }, cor:function(l){ return l.atrasada ? "text-destructive" : ""; }},
    {k:"t", t:"Atividade", forte:true, v:function(l){ return l.titulo; }},
    {k:"d", t:"Detalhes", v:function(l){ return l.detalhe || "—"; }},
    {k:"r", t:"Responsável", v:function(l){ return l.quem || "Financeiro"; }},
    {k:"c", t:"Criada em", tipo:"data", v:function(l){ return String(l.criadaEm || "").slice(0, 10); }, exib:function(l){ return dBRA(String(l.criadaEm || "").slice(0, 10)); }},
    {k:"p", t:"Criada por", v:function(l){ return l.criadaPor || "—"; }}];
  var colConc = [
    {k:"e", t:"Concluída em", tipo:"data", v:function(l){ return String(l.concluidaEm || "").slice(0, 10); }, exib:function(l){ return dBRA(String(l.concluidaEm || "").slice(0, 10)); }},
    {k:"p", t:"Por", v:function(l){ return l.concluidaPor || "—"; }},
    {k:"t", t:"Atividade", forte:true, v:function(l){ return l.titulo; }},
    {k:"h", t:"Como ficou", v:function(l){ return l.resposta || "—"; }},
    {k:"r", t:"Responsável", v:function(l){ return l.quem || "Financeiro"; }}];

  var abrir = function(l){ setErro(""); setComo(""); setConfirma(false); setEdit(l ? Object.assign({}, l) : {id:null, titulo:"", detalhe:"", quando:"tempo", data:"", quem:eu, aberta:true}); };
  var fechar = function(){ setEdit(null); setErro(""); setConfirma(false); };
  var muda = function(c){ setEdit(Object.assign({}, edit, c)); };
  var base = function(){ return {id:edit.id || novoId(), titulo:edit.titulo.trim(), detalhe:edit.detalhe.trim(), quando:edit.quando, data:edit.quando==="data" ? edit.data : "", quem:(edit.quem || "").trim()}; };
  var confere = function(){
    if(edit.titulo.trim().length<3){ setErro("Escreva a atividade (pelo menos 3 letras)."); return false; }
    if(edit.quando==="data" && !/^\d{4}-\d{2}-\d{2}$/.test(edit.data)){ setErro("Informe a data."); return false; }
    return true;
  };
  var salvar = function(){
    if(!confere()) return;
    var orig = edit.id ? d.itens[edit.id] : null, rec = Object.assign({}, orig || {status:"aberta", criadaEm:new Date().toISOString(), criadaPor:eu}, base());
    gravar(rec).then(function(ok){ if(ok) fechar(); });
  };
  var concluir = function(){
    if(!confere()) return;
    var orig = d.itens[edit.id], rec = Object.assign({}, orig, base(), {status:"concluida", resposta:como.trim(), concluidaEm:new Date().toISOString(), concluidaPor:eu});
    gravar(rec).then(function(ok){ if(ok) fechar(); });
  };
  var reabrir = function(){ var orig = d.itens[edit.id], rec = Object.assign({}, orig, {status:"aberta"}); delete rec.concluidaEm; delete rec.concluidaPor; gravar(rec).then(function(ok){ if(ok) fechar(); }); };
  // apagar no servidor = gravar null na chave (a leitura ignora chave nula)
  var excluirReal = function(){ chamar("PUT", "/estado/finativ", {chaves:{[edit.id]:null}}).then(function(){ setD(function(x){ var n = Object.assign({}, x.itens); delete n[edit.id]; return Object.assign({}, x, {itens:n}); }); fechar(); }).catch(function(x){ setErro(x.message); }); };

  var concluida = edit && edit.id && edit.status==="concluida";
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e(Segmentado,{opcoes:[["abertas", "Abertas ("+abertas.length+")"], ["concluidas", "Concluídas ("+conclu.length+")"]], atual:vis, onMudar:setVis}),
      e("span",{className:"flex-1"}), d.msg && e("span",{className:"text-[13px] text-destructive"}, d.msg),
      e(Botao,{onClick:carregar}, "Atualizar"), e(Botao,{principal:true, onClick:function(){ abrir(null); }}, "Nova atividade")),
    e(GradeFiltro,{key:vis, chave:"fa"+vis, rows:lista, cols:vis==="abertas" ? colAbertas : colConc, onRow:abrir, vazio:d.pronto ? (vis==="abertas" ? "Nenhuma atividade aberta. Use Nova atividade para anotar o que fica para depois." : "Nenhuma atividade concluída ainda.") : "Carregando…"}),
    edit && e("div",{className:"fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) fechar(); }},
      e("div",{className:"my-auto w-full max-w-[760px] overflow-hidden rounded-2xl text-[13px] text-[#fbf4e4]", style:CARD_ESTILO},
        e("div",{className:"flex items-center gap-2.5 border-b border-[rgba(241,213,138,.16)] py-2 pl-4 pr-3", style:TOPO_ESTILO}, e("b",{className:"min-w-0 flex-1 text-[13px] font-bold text-white"}, edit.id ? (concluida ? "Atividade concluída" : "Atividade") : "Nova atividade"), e("button",{type:"button", "aria-label":"Fechar", onClick:fechar, className:"h-8 shrink-0 rounded-lg px-3 text-[13px] font-semibold text-[#fbf4e4] ring-1 ring-[rgba(241,213,138,.35)] hover:bg-black/30"}, "Fechar ✕")),
        e("div",{className:"flex flex-col gap-3 p-4"},
          e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Atividade"), e("input",{value:edit.titulo, autoFocus:!edit.id, placeholder:"Ex.: Conferir as maquininhas da Stone", className:CAMPO, onChange:function(ev){ muda({titulo:ev.target.value}); }})),
          e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Detalhes"), e("textarea",{value:edit.detalhe, placeholder:"O que precisa ser feito, onde achar, com quem falar", className:CAIXA, onChange:function(ev){ muda({detalhe:ev.target.value}); }})),
          e("div",{className:"grid grid-cols-1 gap-3 md:grid-cols-3"},
            e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Quando"), e("select",{value:edit.quando, className:CAMPO+" cursor-pointer", onChange:function(ev){ muda({quando:ev.target.value}); }}, QUANDO.map(function(q){ return e("option",{key:q[0], value:q[0]}, q[1]); }))),
            edit.quando==="data" ? e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Data"), e("input",{type:"date", value:edit.data || "", className:CAMPO, onChange:function(ev){ muda({data:ev.target.value}); }})) : e("span",null),
            e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Responsável"), e("input",{value:edit.quem || "", placeholder:"Financeiro", className:CAMPO, onChange:function(ev){ muda({quem:ev.target.value}); }}))),
          edit.id && edit.criadaEm && e("p",{className:"text-[13px]"}, "Criada em "+dBRA(String(edit.criadaEm).slice(0, 10))+" por "+(edit.criadaPor || "—")+(concluida ? ". Concluída em "+dBRA(String(edit.concluidaEm || "").slice(0, 10))+" por "+(edit.concluidaPor || "—")+"." : ".")),
          concluida && edit.resposta && e("p",{className:"rounded-lg border border-[rgba(241,213,138,.2)] p-2.5"}, e("b",null, "Como ficou: "), edit.resposta),
          !concluida && edit.id && e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROTULO}, "Como ficou (opcional, ao concluir)"), e("input",{value:como, placeholder:"Ex.: resolvido com o gerente do banco", className:CAMPO, onChange:function(ev){ setComo(ev.target.value); }})),
          e("div",{className:"flex flex-wrap items-center gap-2"},
            !concluida && e("button",{type:"button", onClick:salvar, className:"h-8 rounded-lg px-4 text-[13px] font-bold text-[#17110a]", style:BTN_OURO}, "Salvar"),
            !concluida && edit.id && e(Botao,{onClick:concluir}, "Concluir"),
            concluida && e(Botao,{onClick:reabrir}, "Reabrir"),
            edit.id && (confirma ? e(Botao,{onClick:excluirReal}, "Confirmar exclusão") : e(Botao,{onClick:function(){ setConfirma(true); }}, "Excluir")),
            erro && e("span",{className:"text-[#fca5a5]"}, erro))))));
}
export { AbaFinAtividades };
