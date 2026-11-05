// Sorelly Admin · montagem — pages/RepresentantesApp.js
// Representantes & Kits › Painel das representantes (Marcus, 05/11/2026): cada representante com QUANTAS revendedoras tem e QUANTO vendeu, tudo REAL, vindo do app.
// Fonte: API do app (só leitura) pelo servidor src/server/representantes-app.js, rota /api/representantes/painel (cache de 5 minutos). Só a Diretoria.
// "Ver no app" abre a tela Apps já no app dessa representante (a carteira dela vem da DevMaster; ver mobile/representante.js).
import { Pagina } from "@/apps/montagem/components/padrao";
import { brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var TOPO = "-mt-4 gap-2";
var N = function(v){ return v===null || v===undefined ? "-" : Number(v).toLocaleString("pt-BR"); };
var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "-"; };
var bonito = function(t){ return String(t||"").toLowerCase().replace(/(^|\s)([a-zà-ú])/g, function(m, a, b){ return a+b.toUpperCase(); }).replace(/\b(Da|De|Do|Das|Dos)\b/g, function(x){ return x.toLowerCase(); }); };
var sem = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var VERDE = "font-semibold text-[#4ADE80]", VERMELHO = "font-semibold text-[#EF4444]", OURO = "font-semibold text-[#F3D98B]";
// chave que o app usa para abrir já numa representante (lida em pages/Apps.js)
var CHAVE_REP_APP = "sorelly_app_rep";

function AbaRepresentantesApp(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var sd = useState(null), dados = sd[0], setDados = sd[1], se = useState(""), erro = se[0], setErro = se[1], sc = useState(false), carregando = sc[0], setCarregando = sc[1];
  var carrega = function(forcar){
    setCarregando(true); setErro("");
    chamar("GET", "/representantes/painel"+(forcar ? "?atualizar=1" : "")).then(function(r){ setDados(r); setCarregando(false); }).catch(function(x){ setErro(x.message); setCarregando(false); });
  };
  useEffect(function(){ if(apiAtiva()) carrega(false); }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  // representantes que o app da tela Apps conhece (lista do Agendamento, com o código da DevMaster = código do app)
  var conhecidas = ((s.agend && s.agend.config && s.agend.config.representantes) || []).filter(function(r){ return r.ativo; });
  var abrirNoApp = function(l){
    var r = conhecidas.find(function(x){ return String(x.codigo)===l.cod; }) || conhecidas.find(function(x){ return sem(x.nome).split(" ")[0]===sem(l.nome).split(" ")[0]; });
    if(!r) return;
    try { localStorage.setItem(CHAVE_REP_APP, r.nome); } catch(x) {}
    d({type:"ABA", aba:"apps"});
  };
  var linhas = useMemo(function(){
    return dados ? dados.itens.map(function(i){
      var r = conhecidas.find(function(x){ return String(x.codigo)===i.cod; });
      return Object.assign({}, i, {nomeBonito:bonito(i.nome), situacao:i.ativo ? "Ativa" : "Bloqueada", comissao:i.comissaoPct+"%", noApp:!!r, acerto:dm(i.acertoMaisCedo)});
    }) : [];
  }, [dados, s.agend]);   // eslint-disable-line react-hooks/exhaustive-deps
  var cols = [
    {k:"nomeBonito", t:"Representante"}, {k:"cod", t:"Código"}, {k:"situacao", t:"Situação", cor:function(l){ return l.situacao==="Ativa" ? VERDE : VERMELHO; }}, {k:"comissao", t:"Comissão"},
    {k:"revendedorasNoApp", t:"Revendedoras no app", fmt:N}, {k:"revendedorasComVenda", t:"Com vendas no app", fmt:N},
    {k:"vendido", t:"Vendido no app", fmt:function(v){ return v===null ? "-" : brl(v); }, cor:function(){ return OURO; }},
    {k:"valorAcerto", t:"Valor de acerto", fmt:function(v){ return v===null ? "-" : brl(v); }},
    {k:"pecas", t:"Peças vendidas", fmt:N}, {k:"condicionais", t:"Condicionais ativas", fmt:N}, {k:"acerto", t:"Acerto mais cedo"},
    {k:"ver", t:"App da representante", render:function(v, l){
      if(!l.noApp) return "Sem acesso no app";
      return e("button",{type:"button", onClick:function(){ abrirNoApp(l); }, "aria-label":"Ver no app de "+l.nomeBonito, className:"h-8 rounded-lg bg-[#C9A13B] px-3 text-[13px] font-bold txt-branco"}, "Ver no app"); }}];
  var total = function(ls){
    var soma = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); };
    return ["Total", N(ls.length)+" representantes", "", "", N(soma("revendedorasNoApp")), N(soma("revendedorasComVenda")), brl(soma("vendido")), brl(soma("valorAcerto")), N(soma("pecas")), N(soma("condicionais")), "", ""];
  };
  var cabeca = e("div",{className:"flex items-center justify-between gap-2"},
    e("h1",{className:"font-heading text-xl font-semibold leading-none"}, "Painel das representantes"),
    e("button",{type:"button", disabled:carregando, onClick:function(){ carrega(true); }, className:"h-8 rounded-lg bg-[#C9A13B] px-3 text-[13px] font-bold txt-branco disabled:opacity-50"}, carregando ? "Lendo o app…" : "Atualizar do app"));
  if(!apiAtiva()) return e(Pagina,{className:TOPO}, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a API do app pelo servidor. Entre no sistema com o servidor ligado."));
  if(erro) return e(Pagina,{className:TOPO}, cabeca, e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro));
  if(!dados) return e(Pagina,{className:TOPO}, cabeca, e("p",{role:"status", className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Lendo as representantes e as vendas do app…"));
  return e(Pagina,{className:TOPO}, cabeca,
    e("p",{className:"text-[13px]"}, "Dados reais do app, lidos em "+new Date(dados.atualizadoEm).toLocaleString("pt-BR")+(dados.falhas ? " · "+dados.falhas+" sem leitura das vendas" : "")+". Valores do ciclo atual de cada revendedora."),
    e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"cod", centro:true, semContagem:true, totalLinha:total, vazio:"Nenhuma representante encontrada."}));
}
export { AbaRepresentantesApp };
