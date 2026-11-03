// Sorelly Admin · montagem — pages/AgendamentoAtividades.js
// Agendamento › Atividades (Marcus, 02/11/2026): o que o setor precisa CONFERIR vira atividade com dono, prazo de 1 dia útil e resposta obrigatória; fica aberta até concluir.
// O Admin cria sozinho a cada leitura da DevMaster (domain/atividades.js: acerto atrasado e nota que não bate com a data). Quem cuida de cada representante se escolhe no bloco de baixo;
// representante sem responsável = o setor inteiro vê. Guarda no módulo agrev (chaves "at_..." e "atdono").
import { Botao, CAMPO, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { BTN_OURO, CARD_ESTILO, ROTULO, TOPO_ESTILO } from "@/apps/montagem/pages/AgendamentoRevendedoras";
import { diaEfetivo } from "@/apps/montagem/domain/feriados";
import { RESULTADOS, atualizar, diaUtilSeguinte, diasEntre, donoAutomatico, donoDe, quemDoDetalhe, rotuloResultado } from "@/apps/montagem/domain/atividades";
import { nomeProprio } from "@/apps/montagem/domain/agendamento";
import { nomeDe, podeGerirAgend } from "@/apps/montagem/domain/equipe";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useRef, useState } from "@/shared/react";

var dBR = function(i){ return i ? String(i).slice(8, 10)+"/"+String(i).slice(5, 7) : "—"; };
var dBRA = function(i){ return i ? String(i).slice(8, 10)+"/"+String(i).slice(5, 7)+"/"+String(i).slice(0, 4) : "—"; };
var curto = function(t){ return String(t||""); };   // nada abreviado (regra de 02/11/2026): o texto aparece inteiro
var ROT = ROTULO;

function AbaAgAtividades(){
  var cx = use(), s = cx.state, eu = nomeDe(s.usuario), gerente = podeGerirAgend(s.usuario, s.agend), hoje = isoDia(new Date());
  var st = useState({itens:[], ativ:{}, dono:{}, pronto:false, msg:"Carregando da DevMaster…"}), d = st[0], setD = st[1];
  var vs = useState("abertas"), vis = vs[0], setVis = vs[1], ab = useState(null), aberto = ab[0], setAberto = ab[1];
  var f1 = useState({res:"acerto_marcado", data:"", txt:""}), form = f1[0], setForm = f1[1], er = useState(""), erro = er[0], setErro = er[1];
  var c1 = useState({com:"representante", ate:"", txt:""}), ct = c1[0], setCt = c1[1];
  var carregar = function(){
    if(!apiAtiva()){ setD(function(x){ return Object.assign({}, x, {msg:"Precisa do servidor ligado."}); }); return; }
    Promise.all([chamar("GET", "/agenda-revendedoras"), chamar("GET", "/estado/agrev")]).then(function(v){
      var itens = v[0].itens || [], c = (v[1] && v[1].conteudo) || {}, ativ = {}; Object.keys(c).forEach(function(k){ if(k.indexOf("at_")===0 && c[k] && c[k].id) ativ[k] = c[k]; });
      var base = {itens:itens, ativ:ativ, dono:c.atdono || {}, pronto:true, msg:""};
      if(itens.length<500){ setD(base); return; }   // leitura parcial da DevMaster: não cria nem fecha nada
      var mud = atualizar(itens, ativ, hoje);
      if(!Object.keys(mud).length){ setD(base); return; }
      chamar("PUT", "/estado/agrev", {chaves:mud}).then(function(){ var novo = Object.assign({}, ativ, mud); Object.keys(mud).forEach(function(k){ if(mud[k]===null) delete novo[k]; }); setD(Object.assign({}, base, {ativ:novo})); }).catch(function(x){ setD(Object.assign({}, base, {msg:x.message})); });
    }).catch(function(x){ setD(function(p){ return Object.assign({}, p, {msg:x.message}); }); });
  };
  var ref = useRef(null); ref.current = carregar;
  useEffect(function(){ ref.current(); var t = setInterval(function(){ ref.current(); }, 600000); return function(){ clearInterval(t); }; }, []);

  var gravar = function(rec){ return chamar("PUT", "/estado/agrev", {chaves:{[rec.id]:rec}}).then(function(){ setD(function(x){ var n = Object.assign({}, x.ativ); n[rec.id] = rec; return Object.assign({}, x, {ativ:n}); }); }).catch(function(x){ setErro(x.message); }); };
  var auto = donoAutomatico(d.itens);
  var linhas = Object.keys(d.ativ).map(function(k){ var a = d.ativ[k], aberta = a.status==="aberta", atrasoDias = a.tipo==="atrasada" ? diasEntre(diaEfetivo(a.prev), hoje) : 0, dono = donoDe(d.dono, a.repCod) || quemDoDetalhe(a.detalhe) || auto[a.repCod] || "";
    return Object.assign({}, a, {aberta:aberta, atrasada:aberta && a.prazo<hoje, dono:dono || "Setor", tituloVivo:a.tipo==="atrasada" ? (atrasoDias>=60 ? "Enviar para Inadimplência / Jurídico (atrasada há "+atrasoDias+" dias)" : atrasoDias>=31 ? "Negociar antes dos 60 dias (atrasada há "+atrasoDias+" dias)" : "Acerto atrasado há "+atrasoDias+(atrasoDias===1 ? " dia" : " dias")) : a.titulo, nomeP:nomeProprio(a.nome), repP:nomeProprio(a.rep), aberta_dias:diasEntre(a.reabertaEm || a.criadaEm, hoje)}); })
    .sort(function(a, b){ return a.prazo.localeCompare(b.prazo) || a.nomeP.localeCompare(b.nomeP, "pt-BR"); });
  linhas.forEach(function(l){ l.aguardando = l.aberta && !!l.aguarda && l.aguarda.ate>hoje; l.atrasada = l.aberta && !l.aguardando && l.prazo<hoje; });   // aguardando retorno só volta para Abertas no dia combinado
  var abertas = linhas.filter(function(l){ return l.aberta && !l.aguardando; }), aguard = linhas.filter(function(l){ return l.aguardando; }), conclu = linhas.filter(function(l){ return !l.aberta && l.por!=="Sistema"; }).sort(function(a, b){ return String(b.concluidaEm).localeCompare(String(a.concluidaEm)); });
  var lista = vis==="abertas" ? abertas : vis==="aguardando" ? aguard : conclu, sel = aberto ? linhas.find(function(l){ return l.id===aberto; }) : null;

  var histRev = sel ? d.itens.find(function(i){ return i.cod===sel.cod; }) : null;
  var histCasos = histRev ? (histRev.caso ? [histRev.caso].concat(histRev.casos || []) : []) : [];
  var COM = {representante:"representante", revendedora:"revendedora"};
  var ultimo = function(l){ var c = (l.contatos || [])[(l.contatos || []).length-1]; return c ? "Falou com "+COM[c.com]+" em "+dBR(String(c.em).slice(0, 10))+" ("+c.por+")" : "Sem contato"; };
  var situacao = function(l){ return !l.aberta ? "Concluída" : l.aguardando ? "Aguardando retorno" : l.atrasada ? "Atrasada" : "Aberta"; };
  var colAbertas = [
    {k:"prazo", t:"Prazo", tipo:"data", v:function(l){ return l.prazo; }, exib:function(l){ return dBR(l.prazo); }, cor:function(l){ return l.atrasada ? "text-destructive" : ""; }},
    {k:"sit", t:"Situação", v:situacao, cor:function(l){ return l.atrasada ? "text-destructive" : ""; }},
    {k:"nome", t:"Revendedora", forte:true, v:function(l){ return l.nomeP; }},
    {k:"rep", t:"Representante", v:function(l){ return l.repP; }},
    {k:"dono", t:"Responsável", v:function(l){ return l.dono; }},
    {k:"tit", t:"Atividade", v:function(l){ return l.tituloVivo; }},
    {k:"dias", t:"Aberta há", tipo:"num", v:function(l){ return l.aberta_dias; }, exib:function(l){ return l.aberta_dias+(l.aberta_dias===1 ? " dia" : " dias"); }},
    {k:"ctt", t:"Contato", v:ultimo},
    {k:"caso", t:"Caso na DevMaster", v:function(l){ return l.detalhe; }, exib:function(l){ return curto(l.detalhe, 70); }}];
  var colConc = [
    {k:"em", t:"Concluída em", tipo:"data", v:function(l){ return String(l.concluidaEm||"").slice(0, 10); }, exib:function(l){ return dBR(l.concluidaEm); }},
    {k:"por", t:"Por", v:function(l){ return l.por || "—"; }},
    {k:"nome", t:"Revendedora", forte:true, v:function(l){ return l.nomeP; }},
    {k:"rep", t:"Representante", v:function(l){ return l.repP; }},
    {k:"tit", t:"Atividade", v:function(l){ return l.titulo; }},
    {k:"res", t:"Resultado", v:function(l){ return rotuloResultado(l.resultado); }},
    {k:"resp", t:"Resposta", v:function(l){ return l.resposta || ""; }, exib:function(l){ return curto(l.resposta, 70) || "—"; }}];


  var abrir = function(l){ setAberto(l.id); setErro(""); setCt({com:"representante", ate:diaUtilSeguinte(diaUtilSeguinte(hoje)), txt:""}); setForm({res:l.tipo==="nota" ? "nota_velha" : "acerto_marcado", data:"", txt:""}); };
  var valido = form.txt.trim().length>=5 && (form.res!=="acerto_marcado" || /^\d{4}-\d{2}-\d{2}$/.test(form.data));
  var concluir = function(l){
    if(!valido){ setErro(form.res==="acerto_marcado" && !form.data ? "Informe a data do acerto." : "Escreva a resposta (pelo menos 5 letras)."); return; }
    var resposta = (form.res==="acerto_marcado" ? "Acerto marcado para "+dBRA(form.data)+". " : "")+form.txt.trim();
    var orig = d.ativ[l.id]; gravar(Object.assign({}, orig, {status:"concluida", resultado:form.res, resposta:resposta, por:eu, concluidaEm:new Date().toISOString()})).then(function(){ setAberto(null); });
  };
  // Entrei em contato e aguardo (Marcus, 03/11/2026): a atividade continua aberta, sai de Abertas até o dia combinado e guarda quem falou com quem
  var contatar = function(l){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(ct.ate) || ct.ate<=hoje){ setErro("Informe o dia do retorno, depois de hoje."); return; }
    if(ct.txt.trim().length<5){ setErro("Escreva o que foi dito (pelo menos 5 letras)."); return; }
    var orig = d.ativ[l.id], reg = {em:new Date().toISOString(), por:eu, com:ct.com, ate:ct.ate, txt:ct.txt.trim()};
    gravar(Object.assign({}, orig, {contatos:(orig.contatos || []).concat([reg]), aguarda:{com:ct.com, ate:ct.ate, por:eu}, prazo:ct.ate})).then(function(){ setAberto(null); });
  };
  var reabrir = function(l){ var orig = d.ativ[l.id]; gravar(Object.assign({}, orig, {status:"aberta", prazo:diaUtilSeguinte(hoje), reaberturas:(orig.reaberturas||0)+1, reabertaEm:hoje})).then(function(){ setAberto(null); }); };

  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e(Segmentado,{opcoes:[["abertas", "Abertas ("+abertas.length+")"], ["aguardando", "Aguardando retorno ("+aguard.length+")"], ["concluidas", "Concluídas ("+conclu.length+")"]], atual:vis, onMudar:setVis}),
      e("span",{className:"flex-1"}), d.msg && e("span",{className:"text-[13px] text-foreground", title:d.msg}, d.msg), e(Botao,{onClick:carregar}, "Atualizar")),
    e(GradeFiltro,{key:vis, chave:"ativ"+vis, rows:lista, cols:vis==="concluidas" ? colConc : colAbertas, onRow:abrir, vazio:d.pronto ? (vis==="abertas" ? "Nenhuma atividade aberta." : vis==="aguardando" ? "Nenhuma atividade aguardando retorno." : "Nenhuma atividade concluída ainda.") : "Carregando da DevMaster…"}),
    sel && e("div",{className:"fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/65 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget) setAberto(null); }},
      e("div",{className:"my-auto w-full max-w-[1240px] overflow-hidden rounded-2xl text-[13px] text-[#fbf4e4]", style:CARD_ESTILO},
        e("div",{className:"flex items-center gap-2.5 border-b border-[rgba(241,213,138,.16)] py-2 pl-4 pr-3", style:TOPO_ESTILO}, e("b",{className:"min-w-0 flex-1 text-[13px] font-bold text-white"}, sel.nomeP+" · "+sel.cod), e("button",{type:"button", "aria-label":"Fechar", onClick:function(){ setAberto(null); }, className:"h-8 shrink-0 rounded-lg px-3 text-[13px] font-semibold text-[#fbf4e4] ring-1 ring-[rgba(241,213,138,.35)] hover:bg-black/30"}, "Fechar ✕")),
        e("div",{className:"flex flex-col p-4"},
        e("div",{className:"grid grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-[minmax(0,2.4fr)_1fr_1fr_1.6fr]"},
          [["Atividade", sel.tituloVivo], ["Prazo", dBRA(sel.prazo)], ["Responsável", sel.dono], ["Representante", sel.repP]].map(function(x){ return e("div",{key:x[0], className:"min-w-0"}, e("div",{className:ROT}, x[0]), e("div",{className:x[0]==="Representante" ? "text-[13px] font-extrabold text-[#fde68a] md:whitespace-nowrap" : "text-[13px] text-white md:whitespace-nowrap", title:x[1]}, x[1])); })),
        histRev && e("div",{className:"mt-3 rounded-lg border border-[rgba(241,213,138,.2)] p-2.5"}, e("div",{className:"text-[13px] font-bold text-[#fde68a]"}, "Situação na DevMaster"),
          e("div",{className:"mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-4"},
            [["Acerto previsto", dBRA(histRev.prev)], ["Agendado", histRev.agendaEm ? dBRA(histRev.agendaEm) : "Não"], ["Kits", String(histRev.kits || 0)], ["Valor", "R$ "+Number(histRev.valor || 0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2})]].map(function(x){ return e("div",{key:x[0], className:"min-w-0"}, e("div",{className:ROT}, x[0]), e("div",{className:"text-[13px] text-white"}, x[1])); })),
          e("div",{className:"mt-2 flex flex-col gap-0.5"}, (histRev.conds || []).map(function(c){ return e("div",{key:c.n, className:"text-[13px] text-white md:whitespace-nowrap"}, c.t+" "+c.n+" · saiu "+dBRA(c.e)+" · acerto "+dBRA(c.d)+" · R$ "+Number(c.v || 0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2})); }))),
        e("div",{className:"mt-3 rounded-lg border border-[rgba(251,191,36,.35)] bg-[rgba(251,191,36,.12)] p-2.5"}, e("div",{className:"text-[13px] font-bold text-[#fde68a]"}, "Todas as anotações na DevMaster ("+histCasos.length+")"),
          histCasos.length ? e("div",{className:"mt-1.5 flex flex-col gap-1.5"}, histCasos.map(function(c, i){ return e("p",{key:i, className:"text-[13px] leading-snug text-white"}, e("b",{className:"font-bold"}, dBRA(c.iso)+(c.quem ? " · "+c.quem : "")+": "), c.txt); })) : e("p",{className:"mt-1 text-[13px] leading-snug text-white"}, "Sem anotação na DevMaster.")),
        sel.aberta && e("div",{className:"mt-3 rounded-lg border border-[rgba(241,213,138,.2)] p-2.5"}, e("div",{className:"text-[13px] font-bold text-[#fde68a]"}, "Contatos ("+(sel.contatos || []).length+")"),
          (sel.contatos || []).length>0 && e("div",{className:"mt-1.5 flex flex-col gap-1"}, (sel.contatos || []).map(function(c, i){ return e("p",{key:i, className:"text-[13px] leading-snug text-white"}, e("b",{className:"font-bold"}, dBRA(String(c.em).slice(0, 10))+" · "+c.por+" falou com a "+COM[c.com]+": "), c.txt+" (retorno em "+dBRA(c.ate)+")"); })),
          e("div",{className:"mt-2 grid grid-cols-1 gap-2 md:grid-cols-[180px_160px_minmax(0,1fr)_auto] md:items-end"},
            e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "Entrei em contato com"), e("select",{value:ct.com, className:CAMPO+" cursor-pointer", onChange:function(ev){ setCt(Object.assign({}, ct, {com:ev.target.value})); }}, e("option",{value:"representante"}, "Representante"), e("option",{value:"revendedora"}, "Revendedora"))),
            e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "Aguardar até"), e("input",{type:"date", value:ct.ate, className:CAMPO, onChange:function(ev){ setCt(Object.assign({}, ct, {ate:ev.target.value})); }})),
            e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "O que foi dito"), e("input",{value:ct.txt, placeholder:"Ex.: representante vai trazer o acerto na sexta", className:CAMPO, onChange:function(ev){ setCt(Object.assign({}, ct, {txt:ev.target.value})); }})),
            e("button",{type:"button", onClick:function(){ contatar(sel); }, className:"h-8 rounded-lg px-4 text-[13px] font-bold text-[#17110a]", style:BTN_OURO}, "Entrei em contato e aguardo"))),
        sel.aberta ? e("div",{className:"mt-3 flex flex-col gap-2"},
          e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "Resultado"), e("select",{value:form.res, className:CAMPO+" cursor-pointer", onChange:function(ev){ setForm(Object.assign({}, form, {res:ev.target.value})); }}, RESULTADOS.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
          form.res==="acerto_marcado" && e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "Data do acerto"), e("input",{type:"date", value:form.data, className:CAMPO+" w-44!", onChange:function(ev){ setForm(Object.assign({}, form, {data:ev.target.value})); }})),
          e("label",{className:"flex flex-col gap-1"}, e("span",{className:ROT}, "Resposta (obrigatória)"), e("input",{value:form.txt, placeholder:"Ex.: kit saiu em 20/10, acerto marcado com a representante", className:CAMPO, onChange:function(ev){ setForm(Object.assign({}, form, {txt:ev.target.value})); }})),
          e("div",{className:"flex flex-wrap items-center gap-3"}, e("button",{type:"button", onClick:function(){ concluir(sel); }, className:"h-8 rounded-lg px-4 text-[13px] font-bold text-[#17110a]", style:BTN_OURO}, "Concluir"), erro && e("span",{className:"text-[#fca5a5]"}, erro)))
        : e("div",{className:"mt-3 flex flex-col gap-2"},
          e("div",{className:"rounded-lg border border-[rgba(241,213,138,.2)] p-2.5"}, e("div",{className:ROT}, "Concluída por "+(sel.por || "—")+" em "+dBRA(String(sel.concluidaEm||"").slice(0, 10))), e("p",{className:"mt-1 text-[13px]"}, rotuloResultado(sel.resultado)), e("p",{className:"mt-1 text-[13px] leading-snug"}, sel.resposta || "—")),
          gerente && e("div",{className:"flex items-center gap-3"}, e(Botao,{onClick:function(){ reabrir(sel); }}, "Reabrir"), erro && e("span",{className:"text-[#fca5a5]"}, erro)))))));
}
export { AbaAgAtividades };
