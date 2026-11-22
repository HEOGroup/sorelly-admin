// Sorelly Admin · montagem — pages/CadastroFin.js
// Financeiro › Cadastro (Marcus, 20/11/2026: "copiar a DevMaster no nosso sistema, para daqui a pouco sair deles"): duas telas.
//  · Formas de pagamento = os tipos de numerário do PDV: para qual banco cada uma manda o dinheiro, de quem é (dono), quantas vezes foi usada em 90 dias e o que arrumar na DevMaster.
//  · Bancos = as contas da DevMaster: dono, tipo (conta, maquininha, caixa de passagem), agência e conta, quantas formas caem nela e o uso em 90 dias.
// Lido de /api/cadastro-fin (src/server/cadastro-fin.js), só leitura. Ligar e desligar no PDV continua sendo feito na DevMaster; aqui se vê o que fazer.
// Visual igual ao da Contas a receber (components/planilha-cheia.js): tela colada nas bordas, barra azul compacta, letra de 10 px e rolagem por linha inteira.
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { AvisoMini, BarraMini, BuscaMini, CampoMini, CLS_FINA, PAGINA_CHEIA, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { chamar } from "@/apps/montagem/lib/api";
import { BKC } from "@/apps/montagem/lib/format";
import { e, useCallback, useEffect, useState } from "@/shared/react";

var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(2, 4) : "Mais de 180 dias"; };   // a leitura cobre só 180 dias
var hora = function(ts){ var d = new Date(ts); return isNaN(d) ? "" : String(d.getHours()).padStart(2, "0")+":"+String(d.getMinutes()).padStart(2, "0"); };
var semAc = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var INTERNO = /Caixa interno|Registro interno|Acerto loja|Nota de crédito/;
var corUso = function(l){ return l.n90 || (l.situacao && /Inativ/.test(l.situacao)) || INTERNO.test(l.tipo) ? "" : "text-warning"; };   // amarelo só em quem deveria estar em uso
// coluna Arrumar: mostra só a AÇÃO (o que fazer); o texto inteiro aparece ao passar o mouse e abre embaixo da linha ao clicar
var curtoArrumar = function(v){ return String(v || "").split(" · ").map(function(x){ var a = x.split(":")[0], i = a.indexOf(" ("); return i>0 ? a.slice(0, i) : a; }).join(" · "); };
var verArrumar = function(v){ return v ? e("span",{title:v}, curtoArrumar(v)) : ""; };
var detalheArrumar = function(l){ return l.arrumar ? e("div",{className:"px-2 py-1 text-center text-[10px] text-warning"}, l.arrumar) : null; };   // padrao-ok: letra de 10 px da tela fina (20/11/2026)
var corArrumar = function(l){ return l.arrumar ? "text-warning" : ""; };

// lê a DevMaster uma vez e guarda para as duas telas (a troca de tela não lê de novo)
var CACHE = {dados:null};
function useCadastro(){
  var sd = useState(CACHE.dados), dados = sd[0], se = useState(""), erroTxt = se[0], so = useState(false), lendo = so[0];
  var carregar = useCallback(function(agora){
    so[1](true);
    return chamar("GET", "/cadastro-fin"+(agora ? "?agora=1" : "")).then(function(j){ CACHE.dados = j; sd[1](j); se[1](""); })
      .catch(function(x){ se[1](x && x.message || "Não consegui ler a DevMaster."); }).then(function(){ so[1](false); });
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!CACHE.dados) carregar(false); }, [carregar]);
  return {dados:dados, erroTxt:erroTxt, lendo:lendo, carregar:carregar};
}
function Casca(p){
  return e(Pagina,{className:PAGINA_CHEIA},
    e(BlocoPainel,{titulo:p.titulo, compacto:true},
      e(BarraMini,null, p.barra,
        p.c.dados && e(AvisoMini,null, "lido às "+hora(p.c.dados.geradoEm)),
        e("button",{type:"button", disabled:p.c.lendo, onClick:function(){ p.c.carregar(true); }, className:"rounded border text-white disabled:opacity-50"}, p.c.lendo ? "Lendo a DevMaster" : "Atualizar"),
        p.c.erroTxt && e(AvisoMini,{erro:true}, p.c.erroTxt)),
      !p.c.dados ? e("p",{className:"py-4 text-center text-[13px]"}, p.c.lendo ? "Lendo a DevMaster." : "Sem dados.") : p.children));
}

// ── Formas de pagamento (tipos de numerário)
var COLS_FORMAS = [
  {k:"cod", t:"Cód."}, {k:"nome", t:"Forma de pagamento", render:function(v, l){ return e("span",{title:"Na DevMaster: "+(l.nomeDm || v)}, v); }}, {k:"tipo", t:"Tipo"}, {k:"dono", t:"Dono"}, {k:"banco", t:"Cai no banco"},
  {k:"pdv", t:"PDV"}, {k:"situacao", t:"Situação"},
  {k:"n90", t:"Usos 90 d", cor:corUso}, {k:"v90", t:"Valor 90 d", fmt:BKC}, {k:"ult", t:"Último uso", fmt:dm, cor:corUso},
  {k:"arrumar", t:"Arrumar na DevMaster", render:verArrumar, cor:corArrumar}];
var totalFormas = function(ls){ return ["Total", ls.length+" formas", "", "", "", "", "", String(ls.reduce(function(t, l){ return t+l.n90; }, 0)), BKC(ls.reduce(function(t, l){ return /Acerto loja|Nota de crédito/.test(l.tipo) ? t : t+l.v90; }, 0)), "", ls.filter(function(l){ return l.arrumar; }).length+" a arrumar"]; };   // o total não soma Acerto loja (não pagou) nem Nota de crédito
var filtroArrumar = function(l, arr){ return !arr || (arr==="sim" ? !!l.arrumar : !l.n90); };
var OPS_ARRUMAR = [["", "Tudo"], ["sim", "Só a arrumar"], ["uso", "Sem uso em 90 dias"]];

function AbaFinFormas(){
  var c = useCadastro(), sb = useState(""), busca = sb[0], sv = useState("pdv"), vis = sv[0], ss = useState("ativa"), sit = ss[0], sa = useState(""), arr = sa[0];
  var q = semAc(busca.trim());
  var linhas = c.dados ? c.dados.formas.filter(function(f){
    return (vis==="todas" || (vis==="pdv" ? f.pdv==="Sim" : f.pdv==="Não")) && (sit==="todas" || (sit==="ativa" ? f.situacao==="Ativa" : f.situacao==="Inativa")) && filtroArrumar(f, arr)
      && (!q || semAc([f.cod, f.nome, f.nomeDm, f.tipo, f.dono, f.banco, f.arrumar].join(" ")).indexOf(q)>=0);
  }) : [];
  return e(Casca,{titulo:"Formas de pagamento", c:c, barra:[
      e(BuscaMini,{key:"b", valor:busca, aoMudar:sb[1], ph:"Buscar: forma, dono, banco...", rotulo:"Buscar nas formas de pagamento"}),
      e(CampoMini,{key:"v", valor:vis, aoMudar:sv[1], rotulo:"Visível no PDV", ops:[["pdv", "Visíveis no PDV"], ["fora", "Fora do PDV"], ["todas", "Todas"]]}),
      e(CampoMini,{key:"s", valor:sit, aoMudar:ss[1], rotulo:"Situação", ops:[["ativa", "Ativas"], ["inativa", "Inativas"], ["todas", "Todas"]]}),
      e(CampoMini,{key:"a", valor:arr, aoMudar:sa[1], rotulo:"O que arrumar", ops:OPS_ARRUMAR})]},
    e("div",{ref:refCheia({"Usos 90 d":"Títulos lançados com esta forma nos últimos 90 dias (parcelas, pela data de emissão)", "Valor 90 d":"Valor dos títulos lançados em 90 dias", "Cai no banco":"Banco cadastrado na forma, na DevMaster", "Cód.":"Código na DevMaster", "Último uso":"Último título lançado (a leitura cobre 180 dias)"}), className:CLS_FINA},
      e(TabelaPlanilha,{key:vis+sit+arr, fina:true, cols:COLS_FORMAS, linhas:linhas, chave:"id", grade:true, centro:true, semContagem:true, semLimpar:true, semMao:true, limite:500, totalRodape:totalFormas, detalhe:detalheArrumar, vazio:"Nenhuma forma neste filtro."})));
}

// ── Bancos
var COLS_BANCOS = [
  {k:"cod", t:"Cód."}, {k:"nome", t:"Banco"}, {k:"dono", t:"Dono"}, {k:"tipo", t:"Tipo"}, {k:"situacao", t:"Situação"},
  {k:"agencia", t:"Agência"}, {k:"conta", t:"Conta"}, {k:"formas", t:"Formas"},
  {k:"n90", t:"Usos 90 d", cor:corUso}, {k:"v90", t:"Valor 90 d", fmt:BKC}, {k:"ult", t:"Último uso", fmt:dm, cor:corUso},
  {k:"arrumar", t:"Arrumar na DevMaster", render:verArrumar, cor:corArrumar}];
var totalBancos = function(ls){ return ["Total", ls.length+" bancos", "", "", "", "", "", String(ls.reduce(function(t, l){ return t+l.formas; }, 0)), String(ls.reduce(function(t, l){ return t+l.n90; }, 0)), BKC(ls.reduce(function(t, l){ return t+l.v90; }, 0)), "", ls.filter(function(l){ return l.arrumar; }).length+" a arrumar"]; };

function AbaFinBancos(){
  var c = useCadastro(), sb = useState(""), busca = sb[0], ss = useState("ativo"), sit = ss[0], st = useState(""), tipo = st[0], sa = useState(""), arr = sa[0];
  var q = semAc(busca.trim());
  var tipos = c.dados ? c.dados.bancos.map(function(b){ return b.tipo; }).filter(function(t, i, a){ return a.indexOf(t)===i; }).sort() : [];
  var linhas = c.dados ? c.dados.bancos.filter(function(b){
    return (sit==="todos" || (sit==="ativo" ? b.situacao==="Ativo" : b.situacao==="Inativo")) && (!tipo || b.tipo===tipo) && filtroArrumar(b, arr)
      && (!q || semAc([b.cod, b.nome, b.dono, b.tipo, b.agencia, b.conta, b.nomesFormas, b.arrumar].join(" ")).indexOf(q)>=0);
  }) : [];
  return e(Casca,{titulo:"Bancos", c:c, barra:[
      e(BuscaMini,{key:"b", valor:busca, aoMudar:sb[1], ph:"Buscar: banco, dono, conta...", rotulo:"Buscar nos bancos"}),
      e(CampoMini,{key:"s", valor:sit, aoMudar:ss[1], rotulo:"Situação", ops:[["ativo", "Ativos"], ["inativo", "Inativos"], ["todos", "Todos"]]}),
      e(CampoMini,{key:"t", valor:tipo, aoMudar:st[1], rotulo:"Tipo", ops:[["", "Todos os tipos"]].concat(tipos.map(function(t){ return [t, t]; }))}),
      e(CampoMini,{key:"a", valor:arr, aoMudar:sa[1], rotulo:"O que arrumar", ops:OPS_ARRUMAR})]},
    e("div",{ref:refCheia({"Formas":"Quantas formas de pagamento dão baixa neste banco", "Usos 90 d":"Títulos lançados neste banco nos últimos 90 dias", "Valor 90 d":"Valor dos títulos lançados em 90 dias", "Cód.":"Código do banco na DevMaster", "Último uso":"Último título lançado (a leitura cobre 180 dias)"}), className:CLS_FINA},
      e(TabelaPlanilha,{key:sit+tipo+arr, fina:true, cols:COLS_BANCOS, linhas:linhas, chave:"id", grade:true, centro:true, semContagem:true, semLimpar:true, semMao:true, limite:500, totalRodape:totalBancos, detalhe:detalheArrumar, vazio:"Nenhum banco neste filtro."})));
}

export { AbaFinFormas, AbaFinBancos };
