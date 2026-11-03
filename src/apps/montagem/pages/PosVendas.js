// Sorelly Admin · montagem — pages/PosVendas.js
// Pós-vendas › Contatos (Marcus, 02/11/2026): só a tabela das revendedoras com kit ativo, para a Letícia chamar pelo WhatsApp.
// Sem bloco de filtro, sem mensagem e sem tarefas: filtrar e ordenar é no título de cada coluna (TabelaPlanilha).
// Dados: GET /api/pos-vendas/contatos (DevMaster + uso real do app, só leitura). Servidor: src/server/pos-vendas.js.
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var data = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7)+"/"+iso.slice(0, 4) : "—"; };

// telefone: tira o 55, põe o 9 quando faltar e devolve o texto e o link do WhatsApp
function fone(t){
  var d = String(t || "").replace(/\D/g, ""); if(d.length > 11 && d.indexOf("55")===0) d = d.slice(2);
  if(d.length===10 && /^[6-9]/.test(d.charAt(2))) d = d.slice(0, 2)+"9"+d.slice(2);
  if(d.length!==11 && d.length!==10) return {txt:"Sem telefone", link:""};
  var txt = d.length===11 ? "("+d.slice(0, 2)+") "+d.slice(2, 7)+"-"+d.slice(7) : "("+d.slice(0, 2)+") "+d.slice(2, 6)+"-"+d.slice(6);
  return {txt:txt, link:"https://wa.me/55"+d};
}

// lê do servidor; enquanto o servidor lê o uso do app em segundo plano, pergunta de novo a cada 5 s (sem aviso na tela)
function useContatos(){
  var sd = useState(null), sx = useState("");
  useEffect(function(){
    if(!apiAtiva()) return undefined;
    var vivo = true, tempo = null;
    var carrega = function(){ chamar("GET", "/pos-vendas/contatos").then(function(j){ if(!vivo) return; sd[1](j); sx[1](""); if(j.uso && j.uso.rodando) tempo = setTimeout(carrega, 5000); }).catch(function(x){ if(vivo) sx[1](x.message || "Não foi possível ler os dados."); }); };
    carrega();
    return function(){ vivo = false; if(tempo) clearTimeout(tempo); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps -- sd/sx são estados fixos
  return {dados:sd[0], erro:sx[0]};
}

function AbaPosVendas(){
  var c = useContatos(), dados = c.dados;
  var tabela = useMemo(function(){ return dados ? dados.linhas.map(function(l){
    return {id:l.cod, nome:l.nome, representante:l.representante, tel:fone(l.celular), media:l.media, prox:l.proximoAcerto,
      app:l.app==="Lendo o app" ? "—" : l.app, ultimo:l.ultimoPedido, dias:l.diasUltimoPedido==null ? "" : l.diasUltimoPedido, pedidos:l.pedidosApp, prefs:l.temPreferencias ? "Preenchidas" : "Não preenchidas"}; }) : []; }, [dados]);
  // blocos de desempenho: quem usa o app, há quantos dias lançou o último pedido e quantos pedidos já lançou
  var blocos = useMemo(function(){
    if(!dados) return null;
    var ls = dados.linhas, n = ls.length, pc = function(q){ return n ? Math.round(q/n*100)+"%" : "0%"; };
    var conta = function(f){ return ls.filter(f).length; };
    var linha = function(r, q, cor){ return {r:r+" ("+inteiro(q)+")", v:pc(q), f:n ? q/n : 0, cor:cor}; };
    var d = function(l){ return l.diasUltimoPedido; }, tem = function(l){ return l.app!=="Sem o app" && l.app!=="Nunca lançou venda" && l.app!=="Lendo o app" && d(l)!=null; };
    return [
      {t:"Uso do app", linhas:[linha("Usando, lançou nos últimos 30 dias", conta(function(l){ return l.app==="Usando"; }), "ok"), linha("Parou de lançar há mais de 30 dias", conta(function(l){ return l.app==="Parou de lançar"; }), "alerta"), linha("Nunca lançou venda", conta(function(l){ return l.app==="Nunca lançou venda"; }), "ruim"), linha("Sem o app", conta(function(l){ return l.app==="Sem o app"; }), "ruim")]},
      {t:"Último pedido lançado", linhas:[linha("Hoje ou ontem", conta(function(l){ return tem(l) && d(l)<=1; }), "ok"), linha("2 a 5 dias atrás", conta(function(l){ return tem(l) && d(l)>=2 && d(l)<=5; }), "ok"), linha("6 a 10 dias atrás", conta(function(l){ return tem(l) && d(l)>=6 && d(l)<=10; })), linha("11 a 30 dias atrás", conta(function(l){ return tem(l) && d(l)>=11 && d(l)<=30; }), "alerta"), linha("Mais de 30 dias atrás", conta(function(l){ return tem(l) && d(l)>30; }), "ruim"), linha("Tem pedidos, mas o app não manda a data", conta(function(l){ return l.app==="Parou de lançar" && d(l)==null; }), "alerta")]},
      {t:"Pedidos lançados no app", linhas:[linha("Nenhum pedido", conta(function(l){ return !l.pedidosApp; }), "ruim"), linha("1 a 5 pedidos", conta(function(l){ return l.pedidosApp>=1 && l.pedidosApp<=5; }), "alerta"), linha("6 a 20 pedidos", conta(function(l){ return l.pedidosApp>=6 && l.pedidosApp<=20; })), linha("Mais de 20 pedidos", conta(function(l){ return l.pedidosApp>20; }), "ok")]}
    ];
  }, [dados]);
  var sub = !apiAtiva() ? "Sem servidor ligado: esta tela precisa do servidor." : c.erro ? "Não foi possível ler os dados: "+c.erro : !dados ? "Carregando as revendedoras." : inteiro(dados.linhas.length)+" revendedoras com kit ativo.";
  var cols = [
    {k:"nome", t:"Revendedora"}, {k:"representante", t:"Representante"},
    {k:"tel", t:"Telefone", render:function(v){ return v.link ? e("a",{href:v.link, target:"_blank", rel:"noopener noreferrer", className:"font-semibold text-primary underline"}, v.txt) : v.txt; }, fmt:function(v){ return v.txt; }},
    {k:"media", t:"Média das 3 últimas vendas", fmt:function(v){ return brl(v); }}, {k:"prox", t:"Próximo acerto", fmt:data}, {k:"app", t:"App"}, {k:"ultimo", t:"Último pedido no app", fmt:data}, {k:"dias", t:"Dias sem lançar", fmt:function(v){ return v==="" ? "—" : String(v); }}, {k:"pedidos", t:"Pedidos no app", fmt:inteiro}, {k:"prefs", t:"Preferências do kit"}];
  return e(Pagina,null,
    e(PageHead,{t:"Contatos", sub:sub}),
    blocos && e("div",{className:"grid grid-cols-1 gap-2.5 lg:grid-cols-3"}, blocos.map(function(b){ return e(BlocoResumo,{key:b.t, t:b.t, barra:true, linhas:b.linhas}); })),
    dados && e(TabelaPlanilha,{key:"contatos", cols:cols, linhas:tabela, chave:"id", centro:true, vazio:"Nenhuma revendedora."}));
}
export { AbaPosVendas };
