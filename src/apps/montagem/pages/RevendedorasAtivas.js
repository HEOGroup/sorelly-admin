// Sorelly Admin · montagem — pages/RevendedorasAtivas.js
// Setor "Revendedoras" (base de todos os setores): quem tem condicional aberto com previsão de devolução em 2026, lido da DevMaster (só leitura, servidor: src/server/revendedoras.js).
// Lista no estilo da DevMaster/planilha, UMA tabela só (sem páginas), centralizada, com linhas finas e a linha TOTAL DO FILTRO acima do cabeçalho; filtro e ordem NA coluna; botão para agrupar por representante.
// Em cima (Marcus, 26/10/2026): 4 blocos com listas (Revendedoras por representante, Condicionais por tipo, Médias, Devolução), abas por tipo e bloco Filtros. Os números mudam com abas e filtros.
// Expositores (26/10/2026): a lista traz também as condicionais com previsão no ano 3000 (expositor). "Todas" continua só com kits (2.105); abas Expositor e "Só expositor · sem kit" mostram os esquecidos; modelos agrupados (todos os "dois andares" juntos); média das 3 últimas vendas (dmach).
// Clicou na revendedora: abre a ficha em bloco inteiro (cadastro + condicionais da última para a primeira, com o tipo de cada uma). Decisões de 26/10/2026 em docs/DECISOES.md.
import { AbasTela, Botao, Bloco, BlocoFiltros, CampoBusca, CampoSel, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var hojeIso = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var maisDias = function(n){ var d = new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
var SEM_PREV = "9999-99-99";
var classeDev = function(d){ var h = hojeIso(); return !d ? "sem" : d<h ? "vencida" : d<=maisDias(7) ? "7" : d<=maisDias(30) ? "30" : "depois"; };
var tipoCurto = function(x){ return /^Reposi/.test(x||"") ? "Reposição" : x==="Kit principal" ? "Principal" : x==="Kit novo" ? "Novo" : (x||"Outro"); };
var TIPOS = [["Principal","Kit principal"],["Novo","Kit novo"],["Reposição","Reposição"],["Encomenda","Encomenda"],["Expositor","Expositor"]];
// só o primeiro e o segundo nome (pula "de/da/do": "Ana da Silva" fica "Ana da Silva" = 3 palavras)
var doisNomes = function(n){ var w = String(n||"").trim().split(/\s+/); if(w[1]==="-") return w.join(" ");   // "Thalita - Sc", "Anne - Joinville": são representantes diferentes, ficam inteiros
  var k = (w.length>2 && /^(de|da|do|dos|das|e)$/i.test(w[1])) ? 3 : 2; return w.slice(0, k).join(" "); };
var fone = function(v){ var d = String(v||"").replace(/\D/g, ""); if(d.length>11 && d.slice(0, 2)==="55") d = d.slice(2); return d.length===11 ? "("+d.slice(0, 2)+") "+d.slice(2, 7)+"-"+d.slice(7) : d.length===10 ? "("+d.slice(0, 2)+") "+d.slice(2, 6)+"-"+d.slice(6) : String(v||""); };
var soma = function(l, k){ return l.reduce(function(tt, x){ return tt+(x[k]||0); }, 0); };
var norm = function(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var rs = function(v){ return "R$ "+Math.round(v||0).toLocaleString("pt-BR"); };
var dec = function(v){ return (Math.round((v||0)*100)/100).toLocaleString("pt-BR"); };
var diasDe = function(iso){ return Math.max(0, Math.round((Date.now()-new Date(iso+"T12:00:00"))/86400000)); };
var tempoTxt = function(d){ return d<60 ? d+" dias" : Math.floor(d/30)+" meses"; };
var ROT_TIPO = {Principal:"Principal", Novo:"Kit novo", "Reposição":"Reposição", Encomenda:"Encomenda", Expositor:"Expositor"};
var dm = function(iso){ return iso>=SEM_PREV ? "Sem previsão" : iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4); };
var REP_COLS = [{k:"repCod", t:"Cód."}, {k:"representante", t:"Representante"}, {k:"n", t:"Revendedoras ativas"}, {k:"atrasadas", t:"Atrasadas"}, {k:"novos", t:"Kits novos"}, {k:"reposicoes", t:"Reposições"}, {k:"valor", t:"Valor em aberto", fmt:function(v){ return brl(v); }}];
var COLUNAS = [{k:"repCod", t:"Cód."}, {k:"representante", t:"Representante", max:150}, {k:"nome", t:"Revendedora", max:170}, {k:"celular", t:"Celular"}, {k:"cidadeUf", t:"Cidade / UF", max:120}, {k:"situacao", t:"Situação", cor:function(l){ return l.situacao==="Ativa" ? "text-success" : ""; }},
  {k:"cond", t:"Condicionais"}, {k:"pecas", t:"Peças", fmt:inteiro}, {k:"valor", t:"Valor total", fmt:function(v){ return brl(v); }}, {k:"media", t:"Média por kit", fmt:function(v){ return brl(v); }},
  {k:"devolucao", t:"Devolução", fmt:dm, cor:function(l){ return l.devolucao>=SEM_PREV ? "" : l.devolucao<hojeIso() ? "text-destructive font-semibold" : l.devolucao<=maisDias(7) ? "text-warning font-semibold" : ""; }}, {k:"tipo", t:"Tipo", max:150},
  {k:"expUn", t:"Expositores"}, {k:"expModelos", t:"Modelos de expositor", max:200},
  {k:"expDias", t:"Tempo com expositor", fmt:tempoTxt, cor:function(l){ return l.expDias==="" ? "" : l.expDias>365 ? "text-destructive font-semibold" : l.expDias>180 ? "text-warning font-semibold" : ""; }},
  {k:"mediaVendas", t:"Média das 3 últimas vendas", fmt:function(v, l){ return brl(v)+(l.nVendas<3 ? " ("+l.nVendas+(l.nVendas===1 ? " venda)" : " vendas)") : ""); }, cor:function(l){ return l.mediaVendas===0 ? "text-destructive" : ""; }}];
var ITEM_COLS = [{k:"condicional", t:"Condicional"}, {k:"grupo", t:"Grupo"}, {k:"modelo", t:"Modelo", max:320}, {k:"codigo", t:"Código"}, {k:"qtd", t:"Quantidade"}, {k:"valor", t:"Valor unitário", fmt:function(v){ return brl(v); }}];
var dia = function(s){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ""); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; };
var Campo = function(rotulo, valor, largo){ return e("div",{className:"min-w-0 break-words "+(largo ? "col-span-full" : "")}, e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em] text-muted-foreground"}, rotulo), e("div",{className:"text-[13px]"}, valor || "—")); };
var th = "h-[30px] whitespace-nowrap border-b border-border bg-white/5 px-2.5 text-left text-[11px] font-medium uppercase tracking-[.05em]";
var td = "h-8 whitespace-nowrap border-b border-border px-2.5 text-[13px]";

// Ficha (Marcus, 26/10/2026): 4 blocos com listas (Em condicional, Acerto, Devolução, Cadastro) e UMA tabela com todas as condicionais, TOTAL acima do cabeçalho, centralizada, linhas finas.
// Previsão de acerto = a próxima previsão de devolução (a DevMaster não traz outra data de acerto); horário agendado e último acerto ainda não estão ligados.
var FICHA_COLS = [{k:"codigo", t:"Condicional"}, {k:"emissao", t:"Emissão", fmt:function(v){ return dm(v); }}, {k:"vendedor", t:"Vendedor", max:170}, {k:"tipo", t:"Tipo", max:150}, {k:"pecas", t:"Peças", fmt:inteiro},
  {k:"valor", t:"Valor", fmt:function(v){ return brl(v); }}, {k:"saldo", t:"Saldo", fmt:function(v){ return brl(v); }},
  {k:"prev", t:"Previsão de devolução", fmt:dm, cor:function(l){ return l.prev>=SEM_PREV ? "" : l.prev<hojeIso() ? "text-destructive font-semibold" : l.prev<=maisDias(7) ? "text-warning font-semibold" : ""; }},
  {k:"dias", t:"Dias", cor:function(l){ return l.dias==="" ? "" : l.dias<0 ? "text-destructive font-semibold" : l.dias<=7 ? "text-warning font-semibold" : ""; }}, {k:"agenda", t:"Agenda"}];
function Ficha(p){
  var f = p.ficha, cs = f.condicionais || [], hoje = hojeIso(), n = cs.length;
  var vTot = soma(cs, "valor"), pTot = soma(cs, "pecas"), sTot = soma(cs, "saldo");
  var dias = function(d){ return Math.round((new Date(d+"T12:00:00")-new Date(hoje+"T12:00:00"))/86400000); };
  var datas = cs.filter(function(c){ return c.previsao; }).map(function(c){ return c.previsao; }).sort(), prox = datas.filter(function(d){ return d>=hoje; })[0] || "", venc = datas.filter(function(d){ return d<hoje; });
  var semPrev = cs.filter(function(c){ return !c.previsao; }).length;
  var unicos = function(l){ var o = []; l.forEach(function(x){ if(x && o.indexOf(x)<0) o.push(x); }); return o; };
  var tipos = unicos(cs.map(function(c){ return tipoCurto(c.tipo); })).join(" · ") || "—", vendedores = unicos(cs.map(function(c){ return c.vendedor; })).join(" · ") || "—", agendas = unicos(cs.map(function(c){ return c.agenda; })).join(" · ") || "—";
  var linhas = cs.map(function(c){ return {id:c.codigo, codigo:c.codigo, emissao:c.emissao, vendedor:c.vendedor, tipo:c.tipo, pecas:c.pecas, valor:c.valor, saldo:c.saldo, prev:c.previsao || SEM_PREV, dias:c.previsao ? dias(c.previsao) : "", agenda:c.agenda || ""}; });
  var obs = cs.filter(function(c){ return c.observacao; });
  var vendas = f.vendas || [], mediaV = vendas.length ? soma(vendas, "v")/vendas.length : 0;
  var itensExp = [].concat.apply([], cs.map(function(c){ return (c.itens || []).map(function(i, k){ return {id:c.codigo+"-"+k, condicional:c.codigo, grupo:i.g, modelo:i.m, codigo:i.c, qtd:i.q, valor:i.v}; }); }));
  var L = function(a, b, k){ return Ln("1.1fr 1.5fr", [a, b], false, k); };
  var copiar = function(){ var tx = f.nome+" · cód. "+f.cod+" · "+doisNomes(f.representante)+"\n"+n+" condicionais · "+inteiro(pTot)+" peças · "+brl(vTot)+" · média "+(n ? brl(vTot/n) : "R$ 0,00")+"\nPróxima devolução: "+(prox ? dm(prox) : "—")+"\n"+cs.map(function(c){ return c.codigo+" · "+dm(c.emissao)+" · "+c.tipo+" · "+c.pecas+" peças · "+brl(c.valor)+" · devolução "+(c.previsao ? dm(c.previsao) : "sem previsão"); }).join("\n");
    try{ navigator.clipboard.writeText(tx); }catch(x){} };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e("div",{className:"flex flex-col"}, e("h2",{className:"text-[16px] font-semibold"}, f.nome), e("span",{className:"text-[13px] text-muted-foreground"}, "Cód. "+f.cod+" · Representante: "+(f.repCod ? f.repCod+" · " : "")+doisNomes(f.representante)+" · "+f.situacaoCadastro)),
      e("div",{className:"flex gap-2"}, e(Botao,{onClick:copiar}, "Copiar resumo"), e(Botao,{onClick:p.aoVoltar, principal:true}, "Voltar à lista"))),
    e("div",{className:"grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]"},
      e(Painel,{t:"Em condicional", v:brl(vTot)}, L("Condicionais abertas", inteiro(n), "a"), L("Peças", inteiro(pTot), "b"), L("Média por kit", n ? brl(vTot/n) : "R$ 0,00", "c"), L("Saldo a devolver", brl(sTot), "d")),
      e(Painel,{t:"Acerto", v:prox ? dm(prox)+" · em "+dias(prox)+(dias(prox)===1 ? " dia" : " dias") : venc.length ? "Vencido" : "Sem previsão", cor:prox && dias(prox)<=7 ? "text-warning" : venc.length && !prox ? "text-destructive" : ""},
        L("Previsão de acerto", prox ? dm(prox) : "—", "a"), L("Agenda", agendas, "b"), L("Vendedores", vendedores, "c"), L("Tipos", tipos, "d")),
      e(Painel,{t:"Devolução", v:venc.length+(venc.length===1 ? " vencida" : " vencidas"), cor:venc.length ? "text-destructive" : ""},
        L("Próxima devolução", prox ? dm(prox)+" ("+dias(prox)+" d)" : "—", "a"), L("Vencida há", venc.length ? Math.abs(dias(venc[0]))+" dias · "+dm(venc[0]) : "—", "b"), L("Sem previsão", inteiro(semPrev), "c"), L("Condicionais", inteiro(n), "d")),
      e(Painel,{t:"Cadastro", v:f.situacaoCadastro || "—"},
        L("Celular · WhatsApp", unicos([fone(f.celular), fone(f.whatsapp), fone(f.telefone)].filter(function(x){ return x; })).join(" · ") || "—", "a"), L("Cidade / UF · bairro", [f.cidade ? f.cidade+" / "+f.uf : "", f.bairro].filter(Boolean).join(" · ") || "—", "b"),
        L("E-mail · Instagram", [f.email ? "E-mail: "+f.email : "", f.instagram ? "Instagram: "+f.instagram : ""].filter(Boolean).join(" · ") || "—", "c"), L("Cadastrada em", f.cadastradaEm ? dm(f.cadastradaEm) : "—", "d"), L("Endereço · CEP", [f.endereco, f.cep].filter(Boolean).join(" · ") || "—", "e")),
      e(Painel,{t:"Últimas vendas", v:vendas.length ? brl(mediaV)+" de média" : "Sem vendas"}, vendas.length ? vendas.map(function(x, k){ return L(dm(x.d), brl(x.v), "v"+k); }) : L("Últimas 3 vendas", "Nenhuma encontrada", "v0"))),
    e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Condicionais em aberto · da última para a primeira"),
    e(TabelaPlanilha,{cols:FICHA_COLS, linhas:linhas, chave:"id", centro:true,
      totalLinha:function(ls){ var v = soma(ls, "valor"); return [{span:4, t:"TOTAL · "+inteiro(ls.length)+(ls.length===1 ? " condicional" : " condicionais")}, inteiro(soma(ls, "pecas")), brl(v), brl(soma(ls, "saldo")), {span:3, t:ls.length ? "média "+brl(v/ls.length) : ""}]; },
      vazio:"Nenhuma condicional em aberto."}),
    itensExp.length>0 && e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Modelos de expositor"),
    itensExp.length>0 && e(TabelaPlanilha,{cols:ITEM_COLS, linhas:itensExp, chave:"id", centro:true, totalLinha:function(ls){ return [{span:4, t:"TOTAL · "+inteiro(ls.length)+(ls.length===1 ? " modelo" : " modelos")}, inteiro(soma(ls, "qtd")), ""]; }, vazio:""}),
    obs.length>0 && e(Bloco,{t:"Observações das condicionais"}, e("div",{className:"flex flex-col gap-1 text-[13px]"}, obs.map(function(c){ return e("div",{key:c.codigo}, e("b",null, c.codigo+" · "), c.observacao); }))));
}

// bloco com borda dourada: título pequeno + total em cima, lista dentro (mesmo desenho do Direcionar pagamento)
function Painel(p){
  return e("section",{className:"min-w-0 overflow-hidden rounded-lg border-2 border-[#d9a63a]/85 bg-card/60"},
    e("div",{className:"border-b border-border bg-[#B8862B]/20 px-2 py-1 text-center"}, e("div",{className:"truncate text-[11px] font-medium uppercase tracking-[.05em]", style:{color:"#f5d68a"}}, p.t), e("div",{className:"truncate text-[18px] font-medium tabular-nums "+(p.cor||"")}, p.v)),
    e("div",{className:"flex flex-col"}, p.children));
}
var Ln = function(cols, vals, cab, k, onClick, extra){ return e("div",{key:k, onClick:onClick, className:"grid min-h-8 items-center border-b border-border text-center text-[13px] last:border-b-0 "+(cab ? "bg-white/5 text-[11px] font-medium uppercase tracking-[.05em] " : "")+(onClick ? "cursor-pointer hover:bg-white/10 " : "")+(extra || ""), style:{gridTemplateColumns:cols}},
  vals.map(function(v, i){ return e("span",{key:i, className:"min-w-0 truncate px-1 tabular-nums", title:typeof v==="string" ? v : undefined}, v); })); };

var FIL0 = {q:"", rep:"", uf:"", sit:"", dev:"", nc:"", grupo:"", modelo:""};
function AbaRevendedorasAtivas(){
  var sd = useState(null), dados = sd[0], setDados = sd[1], se = useState(""), erro = se[0], setErro = se[1];
  var sg = useState(true), agrupar = sg[0], setAgrupar = sg[1];
  var sf = useState(null), ficha = sf[0], setFicha = sf[1], sc = useState(false), carregandoFicha = sc[0], setCarregandoFicha = sc[1];
  var st = useState("todas"), tab = st[0], setTab = st[1];
  var sfi = useState(FIL0), fil = sfi[0], setFil = sfi[1];
  var sv = useState(null), vis = sv[0], setVis = sv[1], sr = useState(false), todasRep = sr[0], setTodasRep = sr[1], sgb = useState({}), grAb = sgb[0], setGrAb = sgb[1];
  var carrega = function(forcar){ setErro(""); chamar("GET", "/revendedoras"+(forcar ? "?atualizar=1" : "")).then(setDados).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(false); }, []);
  var base = useMemo(function(){ return dados ? dados.itens.map(function(r){
    var conds = (r.conds || []).map(function(c){ return {t:tipoCurto(c.t), p:c.p, v:c.v, d:c.d, e:c.e || "", it:c.it || []}; });
    var expC = conds.filter(function(c){ return c.t==="Expositor"; }), its = [].concat.apply([], expC.map(function(c){ return c.it; })), un = its.reduce(function(a, i){ return a+i.q; }, 0);
    var gr = {}; its.forEach(function(i){ gr[i.g] = (gr[i.g] || 0)+i.q; });
    var modelos = Object.keys(gr).sort(function(a, b){ return gr[b]-gr[a]; }).map(function(g){ return g+" ×"+gr[g]; }).join(" · ");
    var em = expC.map(function(c){ return c.e; }).filter(Boolean).sort()[0] || "", vs = r.vendas || null;
    var tp = []; conds.forEach(function(c){ var n = ROT_TIPO[c.t] || c.t; if(tp.indexOf(n)<0) tp.push(n); });
    return {id:r.cod, repCod:r.repCod, representante:doisNomes(r.representante), repCompleta:r.representante, nome:r.nome, celular:fone(r.celular), cidadeUf:r.cidade ? r.cidade+" / "+r.uf : "", uf:r.uf, situacao:r.situacao || "",
      conds:conds, its:its, soExp:expC.length>0 && expC.length===conds.length, tipo:tp.join(" + "), expUn:un || "", expModelos:modelos, expDias:em ? diasDe(em) : "", mediaVendas:vs ? (vs.length ? soma(vs, "v")/vs.length : 0) : "", nVendas:vs ? vs.length : 0}; }) : []; }, [dados]);
  // linhas da tabela: aba + bloco Filtros; cada linha soma as condicionais que sobraram. "Todas" = só kits (sem expositor); Expositor e "Só expositor" mostram os expositores.
  var tabEf = (fil.grupo || fil.modelo) && tab==="todas" ? "Expositor" : tab;
  var linhas = useMemo(function(){ var q = norm(fil.q), out = [];
    base.forEach(function(r){ var cs = tabEf==="todas" ? r.conds.filter(function(c){ return c.t!=="Expositor"; }) : tabEf==="so" ? (r.soExp ? r.conds : []) : r.conds.filter(function(c){ return c.t===tabEf; }); if(!cs.length) return;
      if(fil.rep && r.representante!==fil.rep) return; if(fil.uf && r.uf!==fil.uf) return; if(fil.sit && r.situacao!==fil.sit) return;
      if(q && norm(r.nome+" "+r.repCod+" "+r.celular+" "+r.representante).indexOf(q)<0) return;
      if(fil.nc==="1" && cs.length!==1) return; if(fil.nc==="2" && cs.length!==2) return; if(fil.nc==="3" && cs.length<3) return;
      if(fil.dev && !cs.some(function(c){ return classeDev(c.d)===fil.dev; })) return;
      if(fil.grupo && !r.its.some(function(i){ return i.g===fil.grupo; })) return; if(fil.modelo && !r.its.some(function(i){ return i.c===fil.modelo; })) return;
      var valor = soma(cs, "v"), ds = cs.map(function(c){ return c.d; }).filter(Boolean).sort();
      out.push(Object.assign({}, r, {cs:cs, cond:cs.length, pecas:soma(cs, "p"), valor:valor, media:valor/cs.length, devolucao:ds[0] || SEM_PREV})); });
    return out; }, [base, tabEf, fil]);
  var porRepLinhas = useMemo(function(){ var m = {}, ordem = [], hoje = hojeIso();
    linhas.forEach(function(l){ var k = l.repCompleta; if(!m[k]){ m[k] = {id:k, repCod:l.repCod, representante:k, linhas:[]}; ordem.push(k); } m[k].linhas.push(l); });
    return ordem.map(function(k){ var g = m[k], ls = g.linhas, cs = [].concat.apply([], ls.map(function(l){ return l.cs; }));
      return Object.assign(g, {n:ls.length, atrasadas:ls.filter(function(l){ return l.cs.some(function(c){ return c.d && c.d<hoje; }); }).length, novos:cs.filter(function(c){ return c.t==="Novo"; }).length, reposicoes:cs.filter(function(c){ return c.t==="Reposição"; }).length, valor:soma(cs, "v")}); }); }, [linhas]);
  // expositores: grupos de modelos (dois andares juntos) e quem está com cada modelo; e os "só expositor" por tempo
  var exp = useMemo(function(){ var gs = {}, so = {a:{n:0, v:0}, b:{n:0, v:0}, c:{n:0, v:0}}, tot = 0;
    base.forEach(function(r){ r.its.forEach(function(i){ var g = gs[i.g] || (gs[i.g] = {nome:i.g, un:0, rev:{}, mod:{}}); g.un += i.q; g.rev[r.id] = 1; tot += i.q; var m = g.mod[i.c] || (g.mod[i.c] = {cod:i.c, nome:i.m, un:0, rev:{}}); m.un += i.q; m.rev[r.id] = 1; });
      if(r.soExp){ var d = r.expDias===""  ? 0 : r.expDias, k = d>365 ? "a" : d>180 ? "b" : "c"; so[k].n++; so[k].v += soma(r.conds, "v"); } });
    var lista = Object.keys(gs).map(function(k){ var g = gs[k]; return {nome:g.nome, un:g.un, rev:Object.keys(g.rev).length, mod:Object.keys(g.mod).map(function(c){ var m = g.mod[c]; return {cod:m.cod, nome:m.nome, un:m.un, rev:Object.keys(m.rev).length}; }).sort(function(a, b){ return b.un-a.un; })}; }).sort(function(a, b){ return (a.nome==="Outros")-(b.nome==="Outros") || b.un-a.un; });
    return {lista:lista, tot:tot, so:so, nSo:so.a.n+so.b.n+so.c.n}; }, [base]);
  var abre = function(l){ setCarregandoFicha(true); setErro(""); chamar("GET", "/revendedoras/"+l.id).then(function(f){ setFicha(f); setCarregandoFicha(false); }).catch(function(x){ setErro(x.message); setCarregandoFicha(false); }); };
  if(!apiAtiva()) return e(Pagina,null, e(PageHead,{t:"Revendedoras", sub:"Quem tem condicional aberto com previsão de devolução em 2026."}), e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "Esta tela lê a DevMaster pelo servidor. Entre no sistema com o servidor ligado."));

  // números dos blocos: o que a tabela mostra agora (aba + filtros + filtros das colunas)
  var vl = vis || linhas, cs = [].concat.apply([], vl.map(function(l){ return l.cs; })), nCond = cs.length, vTot = soma(cs, "v"), pTot = soma(cs, "p"), nRev = vl.length;
  var porRep = {}; vl.forEach(function(l){ var o = porRep[l.representante] || (porRep[l.representante] = {n:0, c:0}); o.n++; o.c += l.cond; });
  var reps = Object.keys(porRep).sort(function(a, b){ return porRep[b].n-porRep[a].n || a.localeCompare(b, "pt-BR"); });
  var porTipo = TIPOS.map(function(x){ var q = cs.filter(function(c){ return c.t===x[0]; }); return {nome:x[1], n:q.length, p:soma(q, "p"), v:soma(q, "v")}; }).filter(function(x){ return x.n>0; });
  var dev = {vencida:0, "7":0, "30":0, depois:0, sem:0}; cs.forEach(function(c){ dev[classeDev(c.d)]++; });
  var contaTipo = function(k){ return base.reduce(function(tt, r){ return tt+r.conds.filter(function(c){ return c.t===k; }).length; }, 0); };
  var nKits = base.reduce(function(tt, r){ return tt+r.conds.filter(function(c){ return c.t!=="Expositor"; }).length; }, 0);
  var abas = [["todas", "Todas "+nKits.toLocaleString("pt-BR")]].concat(TIPOS.filter(function(x){ return x[0]!=="Expositor" && contaTipo(x[0])>0; }).map(function(x){ return [x[0], x[1]+" "+contaTipo(x[0]).toLocaleString("pt-BR")]; }))
    .concat([["Expositor", "Expositor "+contaTipo("Expositor").toLocaleString("pt-BR")], ["so", "Só expositor · sem kit "+exp.nSo]]);
  var opRep = [["", "Todas"]].concat(Array.from(new Set(base.map(function(r){ return r.representante; }))).sort(function(a, b){ return a.localeCompare(b, "pt-BR"); }).map(function(x){ return [x, x]; }));
  var opUf = [["", "Todos"]].concat(Array.from(new Set(base.map(function(r){ return r.uf; }).filter(Boolean))).sort().map(function(x){ return [x, x]; }));
  var opSit = [["", "Todas"]].concat(Array.from(new Set(base.map(function(r){ return r.situacao; }).filter(Boolean))).sort().map(function(x){ return [x, x]; }));
  var opGrupo = [["", "Todos"]].concat(exp.lista.map(function(g){ return [g.nome, g.nome+" · "+inteiro(g.un)]; }));
  var opModelo = [["", "Todos"]].concat([].concat.apply([], exp.lista.map(function(g){ return g.mod.map(function(m){ return [m.cod, g.nome+" · "+m.nome+" ("+m.cod+") · "+inteiro(m.un)]; }); })));
  var mud = function(k){ return function(v){ var n = Object.assign({}, fil); n[k] = v; if(k==="grupo" && v) n.modelo = ""; if(k==="modelo" && v) n.grupo = ""; setFil(n); }; };
  var temFiltro = JSON.stringify(fil)!==JSON.stringify(FIL0);
  var G4 = "1.5fr .7fr .8fr .9fr";

  return e(Pagina,null,
    e(PageHead,{t:"Revendedoras", sub:"Quem tem condicional aberto com previsão de devolução em 2026, mais os expositores."},
      !ficha && e(Botao,{onClick:function(){ setAgrupar(!agrupar); }, principal:agrupar}, "Agrupar por representante: "+(agrupar ? "sim" : "não")),
      !ficha && e(Botao,{onClick:function(){ setDados(null); carrega(true); }}, "Atualizar")),
    erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
    ficha && e(Ficha,{ficha:ficha, aoVoltar:function(){ setFicha(null); }}),
    // a lista fica montada (escondida) enquanto a ficha está aberta: filtros e ordem não se perdem ao voltar
    e("div",{className:"flex flex-col gap-2.5 "+(ficha ? "hidden" : "")},
      !dados && !erro ? e("p",{className:"text-[13px]"}, "Carregando da DevMaster… (a primeira vez demora cerca de 30 segundos)")
      : dados ? e("div",{className:"flex flex-col gap-2.5"},
        e("div",{className:"grid items-start gap-2.5 grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]"},
          e(Painel,{t:"Revendedoras", v:inteiro(nRev)},
            Ln("1.4fr .9fr .9fr", ["Representante", "Revendedoras", "Condicionais"], true, "h"),
            (todasRep ? reps : reps.slice(0, 5)).map(function(k){ return Ln("1.4fr .9fr .9fr", [k, inteiro(porRep[k].n), inteiro(porRep[k].c)], false, k, function(){ mud("rep")(k); }); }),
            reps.length>5 && Ln("1fr", [e("button",{type:"button", onClick:function(){ setTodasRep(!todasRep); }, className:"h-8 w-full text-[13px] font-semibold text-primary hover:bg-white/10"}, todasRep ? "Mostrar só as 5 maiores" : "Ver todas as "+reps.length+" representantes")], false, "mais")),
          e(Painel,{t:"Condicionais por tipo", v:brl(vTot)},
            Ln("1.1fr 1fr .8fr 1.3fr", ["Tipo", "Condicionais", "Peças", "Valor"], true, "h"),
            porTipo.map(function(x){ return Ln("1.1fr 1fr .8fr 1.3fr", [x.nome, inteiro(x.n), inteiro(x.p), rs(x.v)], false, x.nome); }),
            Ln("1.1fr 1fr .8fr 1.3fr", ["Total", inteiro(nCond), inteiro(pTot), rs(vTot)], false, "t")),
          e(Painel,{t:"Média por revendedora", v:nRev ? brl(vTot/nRev) : "R$ 0,00"},
            Ln("1.6fr 1fr", ["Peças por revendedora", nRev ? dec(pTot/nRev) : "0"], false, "a"),
            Ln("1.6fr 1fr", ["Kits por revendedora", nRev ? dec(nCond/nRev) : "0"], false, "b"),
            Ln("1.6fr 1fr", ["Valor por kit", nCond ? brl(vTot/nCond) : "R$ 0,00"], false, "c"),
            Ln("1.6fr 1fr", ["Peças por kit", nCond ? dec(pTot/nCond) : "0"], false, "d")),
          e(Painel,{t:"Devolução", v:inteiro(dev.vencida)+(dev.vencida===1 ? " vencida" : " vencidas"), cor:dev.vencida ? "text-destructive" : ""},
            Ln("1.6fr 1fr", ["Vencem em 7 dias", e("span",{className:dev["7"] ? "font-semibold text-warning" : ""}, inteiro(dev["7"]))], false, "a"),
            Ln("1.6fr 1fr", ["Vencem em 30 dias", inteiro(dev["30"])], false, "b"),
            Ln("1.6fr 1fr", ["Depois de 30 dias", inteiro(dev.depois)], false, "c"),
            Ln("1.6fr 1fr", ["Sem previsão", inteiro(dev.sem)], false, "d")),
          e(Painel,{t:"Expositores · grupos de modelos", v:inteiro(exp.tot)+" unidades"},
            Ln(G4, ["Grupo", "Modelos", "Unidades", "Revendedoras"], true, "h"),
            [].concat.apply([], exp.lista.map(function(g){ var ab = !!grAb[g.nome];
              return [Ln(G4, [(ab ? "▾ " : "▸ ")+g.nome, inteiro(g.mod.length), inteiro(g.un), inteiro(g.rev)], false, g.nome, function(){ var n = Object.assign({}, grAb); if(ab) delete n[g.nome]; else n[g.nome] = true; setGrAb(n); }, g.nome==="Dois andares" ? "bg-[#B8862B]/20 font-semibold" : "")]
                .concat(ab ? g.mod.map(function(m){ return Ln(G4, [m.nome+" ("+m.cod+")", "—", inteiro(m.un), inteiro(m.rev)], false, g.nome+m.cod, function(){ var n = Object.assign({}, FIL0, fil, {modelo:m.cod, grupo:""}); setFil(n); }, "bg-black/30"); }) : []); }))),
          e(Painel,{t:"Só expositor · sem kit", v:inteiro(exp.nSo)+(exp.nSo===1 ? " revendedora" : " revendedoras"), cor:exp.nSo ? "text-destructive" : ""},
            Ln("1.6fr 1fr 1.2fr", ["Tempo com o expositor", "Revendedoras", "Valor"], true, "h"),
            Ln("1.6fr 1fr 1.2fr", ["Mais de 1 ano", e("span",{className:exp.so.a.n ? "font-semibold text-destructive" : ""}, inteiro(exp.so.a.n)), rs(exp.so.a.v)], false, "a", function(){ setTab("so"); }),
            Ln("1.6fr 1fr 1.2fr", ["De 6 meses a 1 ano", e("span",{className:exp.so.b.n ? "font-semibold text-warning" : ""}, inteiro(exp.so.b.n)), rs(exp.so.b.v)], false, "b", function(){ setTab("so"); }),
            Ln("1.6fr 1fr 1.2fr", ["Menos de 6 meses", inteiro(exp.so.c.n), rs(exp.so.c.v)], false, "c", function(){ setTab("so"); }))),
        e(AbasTela,{abas:abas, atual:tabEf, onMudar:function(k){ setTab(k); if(fil.grupo || fil.modelo) setFil(Object.assign({}, fil, {grupo:"", modelo:""})); }}),
        e(BlocoFiltros,{onLimpar:temFiltro ? function(){ setFil(FIL0); } : undefined},
          e(CampoBusca,{t:"Buscar", id:"rv-q", value:fil.q, placeholder:"Nome, código, celular…", onChange:mud("q")}),
          e(CampoSel,{t:"Representante", id:"rv-rep", value:fil.rep, opcoes:opRep, onChange:mud("rep")}),
          e(CampoSel,{t:"UF", id:"rv-uf", value:fil.uf, opcoes:opUf, onChange:mud("uf")}),
          e(CampoSel,{t:"Situação", id:"rv-sit", value:fil.sit, opcoes:opSit, onChange:mud("sit")}),
          e(CampoSel,{t:"Devolução", id:"rv-dev", value:fil.dev, opcoes:[["", "Todas"], ["vencida", "Vencidas"], ["7", "Em 7 dias"], ["30", "Em 30 dias"], ["depois", "Depois de 30 dias"], ["sem", "Sem previsão"]], onChange:mud("dev")}),
          e(CampoSel,{t:"Condicionais", id:"rv-nc", value:fil.nc, opcoes:[["", "Qualquer"], ["1", "1 condicional"], ["2", "2 condicionais"], ["3", "3 ou mais"]], onChange:mud("nc")}),
          e(CampoSel,{t:"Grupo de expositor", id:"rv-gr", value:fil.grupo, opcoes:opGrupo, onChange:mud("grupo")}),
          e(CampoSel,{t:"Modelo de expositor", id:"rv-mo", value:fil.modelo, opcoes:opModelo, onChange:mud("modelo")})),
        agrupar ? e(TabelaPlanilha,{key:"reps", cols:REP_COLS, linhas:porRepLinhas, chave:"id", centro:true,
          onFiltradas:function(rs2){ setVis([].concat.apply([], rs2.map(function(x){ return x.linhas; }))); },
          totalLinha:function(rs2){ return [{span:2, t:"TOTAL DO FILTRO · "+inteiro(rs2.length)+(rs2.length===1 ? " representante" : " representantes")}, inteiro(soma(rs2, "n")), inteiro(soma(rs2, "atrasadas")), inteiro(soma(rs2, "novos")), inteiro(soma(rs2, "reposicoes")), brl(soma(rs2, "valor"))]; },
          detalhe:function(rep){ return e(TabelaPlanilha,{cols:COLUNAS, linhas:rep.linhas, chave:"id", aoClicar:abre, centro:true}); },
          vazio:"Nenhuma representante com esses filtros."})
        : e(TabelaPlanilha,{key:"revs", cols:COLUNAS, linhas:linhas, chave:"id", aoClicar:abre, centro:true, onFiltradas:setVis,
          totalLinha:function(ls){ var c = soma(ls, "cond"), v = soma(ls, "valor"), mv = ls.filter(function(x){ return x.mediaVendas!==""; }); return [{span:6, t:"TOTAL DO FILTRO · "+inteiro(ls.length)+" revendedoras"}, inteiro(c), inteiro(soma(ls, "pecas")), brl(v), c ? brl(v/c) : "—", {span:2, t:""}, inteiro(soma(ls, "expUn")), "", "", mv.length ? brl(soma(mv, "mediaVendas")/mv.length) : ""]; },
          vazio:"Nenhuma revendedora com esses filtros."})) : null),
    carregandoFicha && e("p",{className:"text-[13px]"}, "Abrindo a ficha…"));
}
export { AbaRevendedorasAtivas };
