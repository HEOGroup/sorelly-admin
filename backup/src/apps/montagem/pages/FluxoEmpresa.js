// Sorelly Admin · montagem — pages/FluxoEmpresa.js
// Diretoria → Fluxo da empresa: mapa da empresa em blocos robustos, com zoom (roda do mouse) e arrasto, estilo TradingView.
// Modos: Fluxo geral (todos os setores) e 4 fluxos passo a passo (Kit novo representante / interno, Acerto + kit representante / empresa),
// cada um uma fila de etapas numeradas (INÍCIO → FIM) com a Revendedora dentro. Regras e líderes: FLUXO-DA-EMPRESA.md (raiz).
// Zoom afastado = bloco compacto (nome, quantidade, líder, progresso); zoom perto = bloco completo. Clicar abre embaixo as telas do setor e os nomes.
// Os bonequinhos são SEMPRE a quantidade real de pessoas (domain/pessoas.js). Progresso e telas do setor: lista TELAS abaixo (manter em dia com navigation/setores.js).
// Ainda sem números ao vivo (filas, gargalos). Só sócios, direção e família abrem esta tela por padrão.
import { REPRESENTANTES, funcionarios } from "@/apps/montagem/domain/pessoas";
import { PageHead } from "@/apps/montagem/ui/page";
import { Icon } from "@/apps/montagem/ui/icon";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

var FONTE = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
var HOMENS = ["Higor","Joao","Nickolas","Marco","Lucas","Leonardo","Juan","Diego","Marcus"];
var ehHomem = function(nome){ return HOMENS.indexOf(String(nome).split(" ")[0])>=0; };
var DOS = function(){ var a = [].slice.call(arguments); return function(f){ return a.indexOf(f.setor)>=0; }; };
var hex = function(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; };
var rgb = function(a){ return "#"+a.map(function(v){ return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0"); }).join(""); };
var mistura = function(a, b, t){ var x = hex(a), y = hex(b); return rgb([x[0]+(y[0]-x[0])*t, x[1]+(y[1]-x[1])*t, x[2]+(y[2]-x[2])*t]); };
var claro = function(h){ var c = hex(h); return (0.299*c[0]+0.587*c[1]+0.114*c[2])/255>0.62; };

// bloco: nome, cores do degradê, ícone, líder, resumo do setor e quem trabalha lá
var NOS = {
  mkt:{nome:"Marketing", ic:"megafone", c:["#F472B6","#9D174D"], lider:"Julia", resumo:"Faz as artes e os conteúdos que atraem novas revendedoras.", gente:function(f){ return f.setor==="Marketing"; }},
  leads:{nome:"Leads", ic:"grafico", c:["#FB7185","#9F1239"], lider:"Diego", resumo:"Contatos de quem quer revender, vindos do tráfego pago.", gente:function(f){ return f.funcao==="Gestor de tráfego"; }},
  cad:{nome:"Cadastro de revendedoras", ic:"cadastro", c:["#FB923C","#9A3412"], lider:"Nickolas", resumo:"Aprova o cadastro e transforma o lead em revendedora.", gente:DOS("Cadastro de revendedoras")},
  kn:{nome:"Kits novos", ic:"kitnovo", c:["#2DD4BF","#115E59"], lider:"Nickolas", resumo:"Encaminha a revendedora nova: para uma representante ou para o Agendamento.", gente:DOS("Kits novos e indicação")},
  rev:{nome:"Revendedora", ic:"revendedora", c:["#F9A8D4","#BE185D"], lider:null, resumo:"Recebe o kit, vende às clientes dela e faz o acerto, na rua ou na empresa.", gente:null, qtd:"~2.000"},
  rep:{nome:"Representantes", ic:"representante", c:["#A78BFA","#5B21B6"], lider:"Marcus", resumo:"Gera a listagem, retira os kits, faz o acerto na rua e traz o retorno.", gente:null, extra:REPRESENTANTES.map(function(r){ return {nome:r.nome, setor:"Representante", vinculo:"rep"}; })},
  agend:{nome:"Agendamento", ic:"calendario", c:["#60A5FA","#1E3A8A"], lider:"Ana Maria", resumo:"Marca o dia da revendedora na empresa e recebe as representantes.", gente:DOS("Agendamento")},
  cond:{nome:"Condicionais", ic:"scan", c:["#FBBF24","#92400E"], lider:"Majorry", resumo:"Entrega as condicionais antes da montagem e guarda quando elas voltam.", gente:DOS("Condicionais")},
  mont:{nome:"Montagem de kits", ic:"montadora", c:["#F5C453","#92651A"], lider:"Deysiane", resumo:"Monta os kits conforme a listagem e as condicionais.", gente:DOS("Montagem de kits")},
  bip:{nome:"Bipagem de kits", ic:"bipagem", c:["#FCD34D","#A16207"], lider:"Deysiane", resumo:"Bipa cada kit montado antes do envio ou da retirada.", gente:DOS("Bipagem","Atendimento de kits")},
  enc:{nome:"Encomendas", ic:"caminhao", c:["#2DD4BF","#0F766E"], lider:"Agatha", resumo:"Separa as peças pedidas pelo WhatsApp e envia as reposições.", gente:DOS("Encomendas")},
  aten:{nome:"Atendimento Sorelly", ic:"equipe", c:["#FDE047","#A16207"], lider:null, resumo:"Atende a revendedora na empresa: bipa o acerto e acompanha o kit novo.", gente:DOS("Atendimento de kits")},
  ret:{nome:"Bipagem de retorno", ic:"arquivo", c:["#38BDF8","#075985"], lider:"Deysiane", resumo:"Confere o que a representante bipou na rua quando os kits voltam.", gente:function(f){ return ["Bipagem","Atendimento de kits","Cadastro de revendedoras"].indexOf(f.setor)>=0 || ["Michele","Helen","Rayssa"].indexOf(f.nome.split(" ")[0])>=0; }},
  fin:{nome:"Financeiro", ic:"banco", c:["#4ADE80","#166534"], lider:null, resumo:"Fatura a condicional, concilia os pagamentos e paga as comissões.", gente:DOS("Financeiro")},
  gar:{nome:"Garantia", ic:"escudo", c:["#34D399","#065F46"], lider:"Marcus", resumo:"Recebe as peças com problema encontradas depois da bipagem.", gente:DOS("Trocas")},
  inad:{nome:"Inadimplência", ic:"alert", c:["#F87171","#7F1D1D"], lider:"Amanda", resumo:"Resolve os acertos em que faltou pagamento.", gente:DOS("Inadimplência")},
  prod:{nome:"Produção", ic:"cubos", c:["#FBBF24","#B45309"], lider:"Deysiane", resumo:"Prepara as peças liberadas e entrega prontas para a Montagem.", gente:DOS("Produção")},
  pecas:{nome:"Cadastro de peças", ic:"gem", c:["#818CF8","#3730A3"], lider:"Rayssa", resumo:"Cadastra as peças novas e libera para a produção.", gente:DOS("Cadastro de peças")},
  rh:{nome:"RH", ic:"maleta", c:["#C084FC","#6B21A8"], lider:"Maria Claudia", resumo:"Cuida das pessoas, dos acessos e do ponto.", gente:DOS("RH")},
  comp:{nome:"Compras", ic:"coins", c:["#F87171","#991B1B"], lider:"Nickolas", resumo:"Compra materiais e peças e cuida do link de pagamento.", gente:DOS("Compras")},
  sac:{nome:"SAC", ic:"chamado", c:["#22D3EE","#155E75"], lider:"Marcus", resumo:"Atende as clientes e resolve as reclamações.", gente:DOS("SAC")},
  fac:{nome:"Facilities", ic:"vassoura", c:["#94A3B8","#334155"], lider:"Marco Antonio", resumo:"Limpeza, manutenção e as reposições levadas pelo tio João.", gente:DOS("Facilities")},
  tec:{nome:"Tecnologia · H&O", ic:"celular", c:["#38BDF8","#1E40AF"], lider:"Marcus", resumo:"Desenvolve o sistema e leva para produção (H&O Apps).", gente:function(f){ return f.funcao.indexOf("Desenvolvedor")===0; }},
  dir:{nome:"Direção e sócios", ic:"coroa", c:["#F5C453","#78350F"], lider:"Marcus", resumo:"Decisões e acompanhamento da empresa.", gente:function(f){ return f.setor==="Equipe direção" || f.setor==="Sócios e família"; }}};

// telas do setor no sistema: [nome, status (pronto · quase · trazer · breve), % concluído]. Progresso do setor = média dos %.
var TELAS = {
  mkt:[["Campanhas","breve",0],["Tráfego pago","breve",0]], leads:[["Painel de leads","breve",0]],
  cad:[["Revendedoras (ficha única)","trazer",0],["Revendedoras diárias","trazer",0],["Aprovação de cadastro","trazer",0],["Origem e campanhas","trazer",0],["Registros do cadastro","trazer",0]],
  kn:[["Kits novos","pronto",100],["Pendências","pronto",100],["Consolidado","pronto",100],["Regras","pronto",100],["Configurador","pronto",100]],
  rev:[["Ficha única da revendedora","trazer",0],["App da revendedora","pronto",100]],
  rep:[["App da representante","pronto",100],["Consolidado das representantes","quase",90],["Comissões","pronto",100],["Placar","pronto",100],["Regras e configurações","pronto",100],["Compras de joias","pronto",100]],
  agend:[["Consolidado das representantes","quase",90],["Inadimplência","pronto",100],["Atendimento interno · Revendedoras","pronto",100],["Atendimento interno · Listagens","pronto",100]],
  cond:[["Condicionais","pronto",100],["App das condicionais","pronto",100]],
  mont:[["Listagens","pronto",100],["App da montadora","pronto",100],["Calculadora de kits","pronto",100],["Equipe e comissões","pronto",100]],
  bip:[["App da bipagem","pronto",100],["Listagens (bipagem)","pronto",100]],
  enc:[["Regras de reposição","pronto",100],["Controle de expositores","pronto",100],["Encomendas","breve",0],["Reposições","breve",0]],
  aten:[["Atendimento Sorelly","pronto",100],["Consolidado Sorelly","pronto",100],["Listagens do atendimento","pronto",100]],
  ret:[["Consolidado das representantes","quase",90]],
  fin:[["Faturamento","pronto",100],["Contas a pagar","pronto",100],["Histórico de contas","trazer",0],["Saldos bancários","trazer",0],["Fiscal","trazer",0],["Cobrança","trazer",0]],
  gar:[["Garantias","breve",0],["Pós-vendas","breve",0]], inad:[["Inadimplência","pronto",100]],
  prod:[["Produção Sorelly","breve",0],["Produção Serenity","breve",0]], pecas:[["Cadastro de peças","breve",0]],
  rh:[["Funcionários e representantes","pronto",100],["Acessos por setor","pronto",100],["Ponto e horas extras","breve",0]],
  comp:[["Compras Sorelly","breve",0],["Fornecedores","breve",0],["Compras de joias das representantes","pronto",100]],
  sac:[["Chamados","breve",0]], fac:[["Segurança","breve",0],["Limpeza e zeladoria","breve",0]],
  tec:[["Configurador geral","pronto",100],["Avisos","pronto",100],["Projetos (dev)","breve",0]], dir:[["Fluxo da empresa","pronto",100],["Comissões e desempenho","breve",0]]};
var ST = {pronto:["#4ADE80","Pronto"], quase:["#FBBF24","Quase pronto"], trazer:["#FB923C","A trazer"], breve:["#94A3B8","Em breve"]};
var pct = function(id){ var t = TELAS[id] || []; return t.length ? Math.round(t.reduce(function(s,x){ return s+x[2]; },0)/t.length) : 0; };

// ── Medidas (bloco largo 560 × 300, para aproveitar telas grandes; setas longas entre os blocos) ──
var BW = 560, BH = 300;
var GXG = 170, GYG = 240, X = [60,790,1520,2250,2980], Y = [120,660,1200,1740,2280];
var GW = 3700, GH = 3260, APY = 2820;
// ── Mapa do fluxo geral ──
var POS = {mkt:[0,0], leads:[1,0], cad:[2,0], kn:[3,0], rep:[0,1], enc:[4,1], agend:[3,1], cond:[1,2], mont:[2,2], bip:[4,2], aten:[1,3], prod:[2,3], ret:[3,3], fin:[4,3], pecas:[2,4], gar:[3,4], inad:[4,4]};
var APOIO = ["rh","comp","sac","fac","tec","dir"];
var gpos = function(id){ if(POS[id]) return {x:X[POS[id][0]], y:Y[POS[id][1]]}; return {x:60+APOIO.indexOf(id)*604, y:APY}; };
var GIDS = Object.keys(POS).concat(APOIO);
var T = function(id,f){ var p = gpos(id); return [p.x+BW*f, p.y]; }, B = function(id,f){ var p = gpos(id); return [p.x+BW*f, p.y+BH]; };
var R = function(id,f){ var p = gpos(id); return [p.x+BW, p.y+BH*f]; }, L = function(id,f){ var p = gpos(id); return [p.x, p.y+BH*f]; };
var gut = function(r, f){ return Y[r]+BH+GYG*f; };
var SETAS = {
  "mkt>leads":[R("mkt",.5),L("leads",.5)], "leads>cad":[R("leads",.5),L("cad",.5)], "cad>kn":[R("cad",.5),L("kn",.5)],
  "kn>agend":[B("kn",.5),T("agend",.5)],
  "kn>rep":[B("kn",.15),[B("kn",.15)[0],gut(0,.5)],[T("rep",.5)[0],gut(0,.5)],T("rep",.5)],
  "rep>cond":[B("rep",.5),[B("rep",.5)[0],L("cond",.5)[1]],L("cond",.5)],
  "agend>cond":[B("agend",.3),[B("agend",.3)[0],gut(1,.35)],[T("cond",.5)[0],gut(1,.35)],T("cond",.5)],
  "cond>mont":[R("cond",.5),L("mont",.5)],
  "mont>bip":[R("mont",.5),L("bip",.5)],
  "cond>aten":[B("cond",.5),T("aten",.5)],
  "aten>mont":[R("aten",.5),[R("aten",.5)[0]+GXG/2,R("aten",.5)[1]],[R("aten",.5)[0]+GXG/2,L("mont",.72)[1]],L("mont",.72)],
  "bip>rep":[T("bip",.7),[T("bip",.7)[0],gut(1,.7)],[B("rep",.82)[0],gut(1,.7)],B("rep",.82)],
  "rep>agend":[R("rep",.7),L("agend",.7)],
  "agend>ret":[B("agend",.7),T("ret",.7)],
  "ret>fin":[R("ret",.5),L("fin",.5)],
  "bip>fin":[B("bip",.5),T("fin",.5)],
  "enc>mont":[B("enc",.3),[B("enc",.3)[0],gut(1,.6)],[T("mont",.5)[0],gut(1,.6)],T("mont",.5)],
  "fin>cond":[R("fin",.75),[R("fin",.75)[0]+60,R("fin",.75)[1]],[R("fin",.75)[0]+60,Y[4]+BH+70],[X[0]+BW*.25,Y[4]+BH+70],[X[0]+BW*.25,L("cond",.78)[1]],L("cond",.78)],
  "ret>gar":[B("ret",.5),T("gar",.5)], "fin>inad":[B("fin",.5),T("inad",.5)],
  "prod>mont":[T("prod",.5),B("mont",.5)], "pecas>prod":[T("pecas",.5),B("prod",.5)]};

// ── Fluxos passo a passo ──
var P = function(n, t, r){ return {n:n, t:t, r:r}; };
var DEV_ENC = {n:"enc", l:"E", t:"Separa as peças e as reposições pelo WhatsApp; o tio João leva"}, DEV_PROD = {n:"prod", l:"P", t:"A Produção abastece a montagem"}, DEV_PECAS = {n:"pecas", l:"C", t:"O Cadastro de peças libera as peças para a produção"};
var dv = function(i, d){ return Object.assign({i:i}, d); };
var RAMOS_TRONCO = [P("mkt","Gera os contatos pelo tráfego pago do Diego","1"), P("leads","Interessadas em revender entram todo dia","2"), P("cad","Aprova o cadastro e vira revendedora","3"), P("kn","A Michele decide: representante ou empresa","4")], RAMOS_A = [P("rep","Coloca o kit novo na listagem dela","A1"), P("cond","Para nas condicionais e pega a do kit","A2"), P("mont","Monta o kit novo","A3"), P("bip","Bipa o kit montado","A4"), P("rep","Retira o kit","A5"), P("rev","Recebe o kit novo, na empresa ou em casa","A6"), P("agend","A representante devolve ao Agendamento","A7"), P("cond","A condicional volta para a menina guardar","A8")], RAMOS_B = [P("agend","Marca o dia da revendedora vir à empresa","B1"), P("rev","Vai até a empresa no dia marcado","B2"), P("aten","A bipagem recebe e faz o kit novo com a Leci","B3"), P("mont","Monta o kit novo","B4"), P("bip","Bipa o kit novo","B5"), P("rev","Leva o kit novo para casa","B6")];
var MODOS = [
  {id:"geral", nome:"Fluxo geral", resumo:"Todos os setores e como se ligam. Escolha um dos fluxos acima para ver cada caminho etapa por etapa, do início ao fim.", passos:null},
  {id:"kn", nome:"Kit novo · interno + representante", ramos:true, resumo:"O mesmo começo e duas saídas depois da Michele: A pela representante e B na empresa (interno).", passos:RAMOS_TRONCO.concat(RAMOS_A, RAMOS_B),
    desvios:[dv(6,DEV_ENC), dv(6,DEV_PROD), dv(6,DEV_PECAS)]},
  {id:"knrep", nome:"Representante · kit novo", resumo:"A revendedora nova recebe o primeiro kit pela representante.", passos:[
    P("mkt","Gera os contatos pelo tráfego pago do Diego"), P("leads","Interessadas em revender entram todo dia"), P("cad","Aprova o cadastro e vira revendedora"),
    P("kn","A Michele encaminha para uma representante"), P("rep","Coloca o kit novo na listagem dela"), P("cond","Para nas condicionais e pega a do kit"),
    P("mont","Monta o kit novo"), P("bip","Bipa o kit montado"), P("rep","Retira o kit"), P("rev","Recebe o kit novo, na empresa ou em casa"),
    P("agend","A representante devolve ao Agendamento"), P("cond","A condicional volta para a menina guardar")],
    desvios:[dv(6,DEV_ENC), dv(6,DEV_PROD), dv(6,DEV_PECAS)]},
  {id:"knint", nome:"Interno · kit novo", resumo:"A revendedora nova vem à empresa buscar o primeiro kit.", passos:[
    P("mkt","Gera os contatos pelo tráfego pago do Diego"), P("leads","Interessadas em revender entram todo dia"), P("cad","Aprova o cadastro e vira revendedora"),
    P("kn","A Michele encaminha ao Agendamento"), P("agend","Marca o dia da revendedora vir à empresa"), P("rev","Vai até a empresa no dia marcado"),
    P("aten","A bipagem recebe e faz o kit novo com a Leci"), P("mont","Monta o kit novo"), P("bip","Bipa o kit novo"), P("rev","Leva o kit novo para casa")],
    desvios:[dv(7,DEV_ENC), dv(7,DEV_PROD), dv(7,DEV_PECAS)]},
  {id:"acrep", nome:"Representante · acerto + kit", resumo:"A revendedora já tem kit: a representante faz o acerto na rua e o kit volta.", passos:[
    P("rep","Gera a listagem das revendedoras"), P("cond","Pega as condicionais (app das condicionais)"), P("mont","Monta o kit (app da montagem)"), P("bip","Bipa o kit (app da bipagem)"),
    P("rep","Retira o kit montado"), P("rev","Acerto na rua, pelo app da representante"), P("rep","Volta à empresa com os kits"),
    P("agend","Entrega no Consolidado das representantes"), P("ret","As bipadoras confirmam o que a representante bipou"),
    P("fin","Recebe a condicional para faturar"), P("cond","O Financeiro devolve e a menina guarda")],
    desvios:[dv(8,{n:"gar", l:"G", t:"Peças de garantia, depois da bipagem, vão para a Garantia"}), dv(9,{n:"inad", l:"$", t:"Quem não pagou ou faltou dinheiro vai para a Inadimplência"}), dv(2,DEV_ENC), dv(2,DEV_PROD), dv(2,DEV_PECAS)]},
  {id:"acemp", nome:"Interno · acerto + kit", resumo:"A revendedora já tem kit e faz o acerto na empresa.", passos:[
    P("agend","Gera a listagem do dia"), P("cond","Pega as condicionais"), P("rev","Vai à empresa no dia marcado"),
    P("aten","A bipagem bipa o acerto (cerca de 20 min)"), P("aten","A Leci acompanha a escolha das peças do kit novo"), P("mont","Monta o kit novo"), P("bip","Bipa o kit novo"),
    P("rev","Leva o kit novo"), P("fin","A condicional do acerto vai para faturar"), P("cond","O Financeiro devolve e a menina guarda")],
    desvios:[dv(3,{n:"gar", l:"G", t:"Peças de garantia, depois da bipagem, vão para a Garantia"}), dv(8,{n:"inad", l:"$", t:"Quem não pagou ou faltou dinheiro vai para a Inadimplência"}), dv(5,DEV_ENC), dv(5,DEV_PROD), dv(5,DEV_PECAS)]}];
var COR_ETAPA = {"$":"#F87171", "G":"#34D399", "E":"#2DD4BF", "P":"#FBBF24", "C":"#818CF8"};

var COLS = 5, GX = 160, GY = 230, MX = 80, MY = 130;
var xc = function(c){ return MX+c*(BW+GX); };
// layout em fila (da esquerda para a direita; no fim da linha uma seta desce e volta ao começo da próxima)
function layoutModo(m){
  if(m.ramos) return layoutRamos(m);
  var itens = m.passos.map(function(s,i){ var lin = Math.floor(i/COLS);
    return {i:i, n:s.n, t:s.t, r:s.r, lin:lin, x:xc(i%COLS), y:MY+lin*(BH+GY), tags:[]}; });
  var setas = [];
  for(var i=0;i<itens.length-1;i++){ var a = itens[i], b = itens[i+1], de = a.n, para = b.n;
    if(a.lin===b.lin) setas.push({pts:[[a.x+BW,a.y+BH/2],[b.x,b.y+BH/2]], de:de, para:para});
    else { var gy = a.y+BH+GY/2; setas.push({pts:[[a.x+BW/2,a.y+BH],[a.x+BW/2,gy],[b.x+BW/2,gy],[b.x+BW/2,b.y]], de:de, para:para}); } }
  var linhas = Math.ceil(itens.length/COLS), yd = MY+linhas*(BH+GY)-80, ds = m.desvios||[];
  var desv = ds.map(function(d,j){ if(itens[d.i]) itens[d.i].tags.push(d.l); return Object.assign({}, d, {x:xc(j%COLS), y:yd+80+Math.floor(j/COLS)*(BH+80)}); });
  var nl = Math.ceil(ds.length/COLS);
  return {itens:itens, setas:setas, trilhas:[setas.map(function(s,k){ return k; })], bandas:[], fins:[itens[itens.length-1]], desv:desv, yd:yd, CW:MX*2+COLS*BW+(COLS-1)*GX, CH:ds.length ? yd+80+nl*(BH+80)+30 : yd+60};
}
// kit novo com bifurcação: tronco comum (1 a 4) e duas saídas empilhadas: A pela representante, B na empresa
function layoutRamos(m){
  var itens = [], setas = [], i = 0, tronco = m.passos.slice(0,4), ra = m.passos.slice(4,12), rb = m.passos.slice(12);
  var poe = function(s, col, y, lin){ var it = {i:i++, n:s.n, t:s.t, r:s.r, lin:lin, x:xc(col), y:y, tags:[]}; itens.push(it); return it; };
  var yT = MY, hA = BH+GY, yA = yT+BH+GY+70;
  var T = tronco.map(function(s,c){ return poe(s, c, yT, 0); });
  var A = ra.map(function(s,k){ return poe(s, k%COLS, yA+Math.floor(k/COLS)*hA, 1+Math.floor(k/COLS)); });
  var yB = yA+2*hA+30;
  var Bq = rb.map(function(s,k){ return poe(s, k%COLS, yB+Math.floor(k/COLS)*hA, 3+Math.floor(k/COLS)); });
  var liga = function(a, b, via){ var pts = via ? via : (a.y===b.y ? [[a.x+BW,a.y+BH/2],[b.x,b.y+BH/2]] : (function(){ var gy = a.y+BH+GY/2; return [[a.x+BW/2,a.y+BH],[a.x+BW/2,gy],[b.x+BW/2,gy],[b.x+BW/2,b.y]]; })());
    setas.push({pts:pts, de:a.n, para:b.n}); return setas.length-1; };
  var trilhaA = [], trilhaB = [], tr = [];
  for(var k=0;k<3;k++) tr.push(liga(T[k], T[k+1]));
  var k4 = T[3], gA = yT+BH+GY/2;
  var bifA = liga(k4, A[0], [[k4.x+BW/2-80,k4.y+BH],[k4.x+BW/2-80,gA],[A[0].x+BW/2,gA],[A[0].x+BW/2,A[0].y]]);
  var gB = yA+2*hA-GY/2+10, mgd = xc(COLS-1)+BW+70;
  var bifB = liga(k4, Bq[0], [[k4.x+BW,k4.y+BH/2],[mgd,k4.y+BH/2],[mgd,gB],[Bq[0].x+BW/2,gB],[Bq[0].x+BW/2,Bq[0].y]]);
  var aA = [], aB = [];
  for(k=0;k<A.length-1;k++) aA.push(liga(A[k], A[k+1]));
  for(k=0;k<Bq.length-1;k++) aB.push(liga(Bq[k], Bq[k+1]));
  var ds = m.desvios||[], yd = yB+2*hA-90;
  var mont = A[2];   // as letras dos desvios ficam na montagem do ramo A
  var desv = ds.map(function(d,j){ if(mont) mont.tags.push(d.l); return Object.assign({}, d, {x:xc(j%COLS), y:yd+80}); });
  var bandas = [{x:MX-40, y:yA-86, w:COLS*BW+(COLS-1)*GX+80, h:2*hA+10, cor:"#A78BFA", txt:"A · PELA REPRESENTANTE (RUA)"}, {x:MX-40, y:yB-86, w:COLS*BW+(COLS-1)*GX+80, h:hA+(rb.length>COLS ? hA : 0)+0, cor:"#FDE047", txt:"B · NA EMPRESA (INTERNO)"}];
  return {itens:itens, setas:setas, trilhas:[tr.concat([bifA], aA), tr.concat([bifB], aB)], bandas:bandas, fins:[A[A.length-1], Bq[Bq.length-1]], desv:desv, yd:yd, CW:MX*2+COLS*BW+(COLS-1)*GX+160, CH:yd+80+BH+60};
}

var caminho = function(pts){ return "M"+pts.map(function(p){ return p[0]+" "+p[1]; }).join(" L"); };
var linhasDe = function(t, max, n){ var pal = String(t).split(" "), r = [], atual = ""; pal.forEach(function(w){ if((atual+" "+w).trim().length>max){ r.push(atual); atual = w; } else atual = (atual+" "+w).trim(); }); if(atual) r.push(atual);
  if(r.length>n){ r = r.slice(0,n); r[n-1] = r[n-1].replace(/\s*\S*$/, "")+"…"; } return r; };

var TONS = [["#e8b48f","#2b1a10"],["#f0c3a3","#5a2d14"],["#e8b48f","#5a2d14"],["#f0c3a3","#2b1a10"],["#e8b48f","#5a2d14"]];
function Boneco(p){   // busto simples: homem ou mulher, camiseta na cor do setor (tom da pele e do cabelo varia)
  var h = ehHomem(p.nome), t = TONS[(p.i||0)%5], s = p.s || 20;
  return e("svg",{x:p.x, y:p.y, width:s, height:s, viewBox:"0 0 20 20", "aria-hidden":true, style:{overflow:"visible"}},
    e("circle",{cx:10, cy:10, r:11, fill:"#E9E2D3", stroke:p.anel||"none", strokeWidth:1.6}),
    e("rect",{x:3, y:12, width:14, height:8, rx:3, fill:p.cor}),
    e("circle",{cx:10, cy:8, r:4.6, fill:t[0]}),
    h ? e("path",{d:"M5.2 8 Q10 1.5 14.8 8 L14.8 6 Q10 0 5.2 6 Z", fill:t[1]})
      : e("path",{d:"M4.6 9 Q4.2 1.5 10 1.8 Q15.8 1.5 15.4 9 L15.4 14 L13.8 14 L13.8 7 L6.2 7 L6.2 14 L4.6 14 Z", fill:t[1]}));
}
function pessoasDe(id, todas){ var n = NOS[id], vistos = {}, r = n.gente ? todas.filter(n.gente) : []; r = r.concat(n.extra||[]);
  return r.filter(function(f){ if(vistos[f.nome]) return false; vistos[f.nome] = 1; return true; }); }
// grade dos bonequinhos: até 8 numa fileira; acima disso 2 fileiras iguais e, se sobra um, ele fica à direita, entre as duas fileiras
function grade(n){ var q = [], i;
  if(n<=8){ for(i=0;i<n;i++) q.push([i,0,false]); return {q:q, cols:n, duas:false}; }
  var m = Math.floor(n/2), sobra = n%2;
  for(i=0;i<m;i++) q.push([i,0,false]); for(i=0;i<m;i++) q.push([i,1,false]);
  if(sobra) q.push([m,0,true]); return {q:q, cols:m+(sobra?1:0), duas:true}; }

// ── Bloco largo e completo (padrão) ou resumido (botão no topo). O texto se ajusta sozinho ao espaço (nunca sai do bloco) ──
var cabe = function(txt, tam, maxW, pesoBold){ var est = String(txt).length*tam*(pesoBold ? 0.6 : 0.52); return est>maxW ? Math.max(9, tam*maxW/est) : tam; };
function Bloco(p){
  var n = NOS[p.id], x = p.x, y = p.y, on = p.sel===p.k, c0 = n.c[0], c1 = n.c[1], borda = mistura(c1, "#000000", .55),
      escuro = !claro(c0), ink = escuro ? "#FFFFFF" : mistura(c1, "#000000", .7), ink2 = escuro ? "rgba(255,255,255,.85)" : mistura(c1, "#000000", .45), gente = p.gente, qt = gente.length, pc = pct(p.id);
  var resumido = p.resumido, rotuloTop = p.num!=null ? "ETAPA "+p.num : "SETOR", qtTxt = n.qtd ? n.qtd : String(qt), qtLb = n.qtd ? "revendedoras" : (qt===1 ? "pessoa" : "pessoas");
  var base = [
    e("rect",{key:"s", x:7, y:17, width:BW, height:BH, rx:28, fill:"#000", opacity:.45}),
    e("rect",{key:"e", x:0, y:11, width:BW, height:BH, rx:28, fill:borda}),
    e("rect",{key:"b", x:0, y:0, width:BW, height:BH, rx:28, fill:"url(#g-"+p.id+")", stroke:on ? "#FFFFFF" : "rgba(255,255,255,.4)", strokeWidth:on ? 5 : 1.6}),
    e("rect",{key:"h", x:1.5, y:1.5, width:BW-3, height:BH*0.36, rx:26, fill:"url(#brilho)"})];
  var tile = resumido ? 112 : 76, tx = resumido ? 26 : 20, ty = resumido ? 26 : 20, nx = tx+tile+20, nw = BW-nx-22;
  var icone = [
    e("rect",{key:"te", x:tx, y:ty+5, width:tile, height:tile, rx:tile*0.27, fill:mistura(c1,"#000000",.35)}),
    e("rect",{key:"t", x:tx, y:ty, width:tile, height:tile, rx:tile*0.27, fill:"url(#t-"+p.id+")"}),
    e("foreignObject",{key:"ti", x:tx, y:ty, width:tile, height:tile}, e("div",{style:{width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", color:mistura(c1,"#000000",.5)}}, e(Icon,{n:n.ic, s:resumido ? 60 : 40, peso:"fill"})))];
  var corpo, rodape;
  if(resumido){
    var nome = linhasDe(n.nome, 17, 2), t0 = nome.length>1 ? 40 : 48;
    corpo = [
      e("text",{key:"r", x:nx, y:62, fontSize:24, fontWeight:800, letterSpacing:3.5, fill:ink2, style:{fontFamily:FONTE}}, rotuloTop)].concat(
      nome.map(function(l,i){ return e("text",{key:"n"+i, x:nx, y:(nome.length>1 ? 108 : 118)+i*46, fontSize:cabe(l, t0, nw, true), fontWeight:800, fill:ink, style:{fontFamily:FONTE}}, l); }),
      [e("text",{key:"q", x:28, y:216, fontSize:68, fontWeight:800, fill:ink, style:{fontFamily:FONTE}}, qtTxt),
       e("text",{key:"ql", x:28+qtTxt.length*40+14, y:216, fontSize:30, fontWeight:600, fill:ink2, style:{fontFamily:FONTE}}, qtLb),
       e("text",{key:"l", x:28, y:262, fontSize:cabe(n.lider ? "Líder: "+n.lider : "Líder: a definir", 30, BW-56+140, true), fontWeight:700, fill:ink, style:{fontFamily:FONTE}}, n.lider ? "Líder: "+n.lider : "Líder: a definir"),
       e("text",{key:"pt", x:BW-28, y:262, textAnchor:"end", fontSize:28, fontWeight:800, fill:ink, style:{fontFamily:FONTE}}, pc ? pc+"% pronto" : "em breve")]);
    rodape = [
      e("rect",{key:"pb", x:24, y:BH-28, width:BW-48, height:16, rx:8, fill:"rgba(0,0,0,.32)"}),
      e("rect",{key:"pf", x:24, y:BH-28, width:Math.max(0,(BW-48)*pc/100), height:16, rx:8, fill:"url(#prog)"})];
  } else {
    var resumo = linhasDe(n.resumo, 62, 2), g = n.qtd ? null : grade(qt), sz = g && g.cols>9 ? 24 : 28, gap = g && g.cols>9 ? 5 : 7, ax = 28, aw = BW-32-160, ay = 164, bon = [];
    if(g){ var totalW = g.cols*sz+(g.cols-1)*gap, x0 = ax+(aw-totalW)/2, linhasH = g.duas ? 2*sz+gap : sz, y0 = ay+(84-linhasH)/2;
      g.q.forEach(function(q,idx){ var yy = g.duas ? y0+q[1]*(sz+gap) : y0; if(q[2]) yy = y0+(sz+gap)/2;
        bon.push(e(Boneco,{key:idx, x:x0+q[0]*(sz+gap), y:yy, s:sz, i:idx, nome:gente[idx] ? gente[idx].nome : "", cor:c1, anel:c0})); }); }
    corpo = [
      e("text",{key:"r", x:nx, y:44, fontSize:14, fontWeight:800, letterSpacing:2.6, fill:ink2, style:{fontFamily:FONTE}}, rotuloTop),
      e("text",{key:"n", x:nx, y:80, fontSize:cabe(n.nome, 32, nw, true), fontWeight:800, fill:ink, style:{fontFamily:FONTE}}, n.nome)].concat(
      resumo.map(function(l,i){ return e("text",{key:"rs"+i, x:24, y:126+i*23, fontSize:cabe(l, 16.5, BW-48, false), fontWeight:500, fill:ink, style:{fontFamily:FONTE}}, l); }),
      [e("rect",{key:"ap", x:16, y:ay, width:BW-32, height:84, rx:16, fill:"rgba(0,0,0,.25)"}), bon,
       e("line",{key:"ln", x1:BW-148, y1:ay+10, x2:BW-148, y2:ay+74, stroke:"rgba(255,255,255,.3)", strokeWidth:2}),
       e("text",{key:"q", x:BW-84, y:ay+50, textAnchor:"middle", fontSize:n.qtd ? 30 : 46, fontWeight:800, fill:"#FFF", style:{fontFamily:FONTE}}, qtTxt),
       e("text",{key:"ql", x:BW-84, y:ay+71, textAnchor:"middle", fontSize:13, fill:"rgba(255,255,255,.85)", style:{fontFamily:FONTE}}, qtLb)]);
    var ly = 258;
    rodape = [
      e("rect",{key:"ls", x:16, y:ly, width:258, height:34, rx:12, fill:"#1f1208"}),
      n.lider ? e(Boneco,{key:"lb", x:24, y:ly+4, s:26, i:1, nome:n.lider, cor:"#FBBF24", anel:"#F59E0B"}) : e("circle",{key:"lb", cx:37, cy:ly+17, r:12, fill:"none", stroke:"#94A3B8", strokeDasharray:"3 3"}),
      e("text",{key:"l1", x:60, y:ly+21, fontSize:10.5, fontWeight:700, letterSpacing:1.5, fill:"#FBBF24", style:{fontFamily:FONTE}}, "LÍDER"),
      e("text",{key:"l2", x:108, y:ly+22, fontSize:cabe(n.lider || "a definir", 16, 158, true), fontWeight:700, fill:n.lider ? "#FFF" : "#94A3B8", style:{fontFamily:FONTE}}, n.lider || "a definir"),
      e("text",{key:"p1", x:292, y:ly+11, fontSize:12, fontWeight:600, fill:ink2, style:{fontFamily:FONTE}}, "No sistema"),
      e("text",{key:"p2", x:BW-18, y:ly+11, textAnchor:"end", fontSize:12, fontWeight:700, fill:ink, style:{fontFamily:FONTE}}, pc ? pc+"% pronto" : "em breve · 0%"),
      e("rect",{key:"pb", x:292, y:ly+19, width:BW-292-16, height:11, rx:5.5, fill:"rgba(0,0,0,.32)"}),
      e("rect",{key:"pf", x:292, y:ly+19, width:Math.max(0,(BW-292-16)*pc/100), height:11, rx:5.5, fill:"url(#prog)"})];
  }
  var marcas = [];
  if(p.num!=null) marcas.push(e("g",{key:"nm", pointerEvents:"none"}, e("circle",{r:String(p.num).length>1 ? 32 : 28, fill:"#E8B84B", stroke:"#1B1409", strokeWidth:4}), e("text",{y:10, textAnchor:"middle", fontSize:String(p.num).length>1 ? 24 : 28, fontWeight:900, fill:"#1B1409", style:{fontFamily:FONTE}}, String(p.num))));
  if(p.letra) marcas.push(e("g",{key:"lt", pointerEvents:"none"}, e("circle",{r:28, fill:COR_ETAPA[p.letra], stroke:"#1B1409", strokeWidth:4}), e("text",{y:10, textAnchor:"middle", fontSize:28, fontWeight:900, fill:"#1B1409", style:{fontFamily:FONTE}}, p.letra)));
  (p.tags||[]).forEach(function(l,j){ marcas.push(e("g",{key:"tg"+j, transform:"translate("+(BW-26-j*50)+",0)", pointerEvents:"none"}, e("circle",{r:21, fill:COR_ETAPA[l], stroke:"#1B1409", strokeWidth:3.5}), e("text",{y:8, textAnchor:"middle", fontSize:22, fontWeight:900, fill:"#1B1409", style:{fontFamily:FONTE}}, l))); });
  return e("g",{transform:"translate("+x+","+y+")", className:"cursor-pointer", onClick:function(){ if(p.pode()) p.onSel(on ? null : p.k, on ? null : {id:p.id, x:x, y:y}); }, role:"button", "aria-label":n.nome+", "+(n.qtd ? n.qtd+" revendedoras" : qt+" pessoas")},
    base, icone, corpo, rodape, marcas);
}

// painel que abre embaixo do bloco: telas do setor (e o que falta) e os nomes, no mesmo tom do bloco
function Aberto(p){
  var n = NOS[p.id], c0 = n.c[0], c1 = n.c[1], escuro = !claro(c0), ink = escuro ? "#FFF" : mistura(c1,"#000000",.7), ink2 = escuro ? "rgba(255,255,255,.85)" : mistura(c1,"#000000",.45),
      chip = escuro ? "rgba(0,0,0,.28)" : "rgba(255,255,255,.4)", telas = TELAS[p.id] || [], falta = telas.filter(function(t){ return t[1]!=="pronto"; });
  var cap = {fontSize:12, letterSpacing:1, fontWeight:700, color:ink2, margin:"0 0 6px"};
  return e("foreignObject",{x:p.x, y:p.y+BH+34, width:1100, height:900, style:{overflow:"visible"}},
    e("div",{onPointerDown:function(ev){ ev.stopPropagation(); }, style:{fontFamily:FONTE, borderRadius:28, padding:22, color:ink, cursor:"default", background:"linear-gradient(145deg,"+mistura(c0,"#FFFFFF",.18)+","+mistura(c0,c1,.5)+" 55%,"+c1+")", boxShadow:"0 3px 0 rgba(255,255,255,.4) inset, 0 11px 0 "+mistura(c1,"#000000",.55)+", 0 24px 34px rgba(0,0,0,.55)"}},
      e("div",{style:{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}},
        e("div",{style:{fontSize:22, fontWeight:800}}, n.nome+" · no sistema e quem trabalha aqui"),
        e("button",{onClick:p.onFechar, style:{width:34, height:34, borderRadius:17, border:"none", background:chip, color:ink, fontSize:20, fontWeight:800, cursor:"pointer"}}, "×")),
      e("div",{style:{display:"grid", gridTemplateColumns:"1fr 1.25fr", gap:26}},
        e("div",null,
          e("p",{style:cap}, "TELAS DO SETOR NO SISTEMA"),
          telas.length ? telas.map(function(t,i){ var s = ST[t[1]]; return e("div",{key:i, style:{display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderTop:"1px solid "+(escuro ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)"), fontSize:15}},
            e("span",{style:{width:11, height:11, borderRadius:6, background:s[0], flex:"none", boxShadow:"0 0 0 2px rgba(0,0,0,.25)"}}),
            e("span",{style:{flex:1, fontWeight:600}}, t[0]),
            e("span",{style:{width:70, height:7, borderRadius:4, background:"rgba(0,0,0,.25)", overflow:"hidden"}}, e("span",{style:{display:"block", width:t[2]+"%", height:"100%", background:s[0]}})),
            e("span",{style:{fontSize:12.5, minWidth:96, textAlign:"right", fontWeight:700}}, s[1]+(t[1]==="quase" ? " "+t[2]+"%" : ""))); }) : e("p",{style:{fontSize:14}}, "Sem telas neste setor ainda."),
          falta.length>0 && e("div",{style:{marginTop:12, padding:"9px 12px", borderRadius:12, background:chip, fontSize:14, fontWeight:600}}, "Falta concluir: "+falta.map(function(t){ return t[0]; }).join(", "))),
        e("div",null,
          e("p",{style:cap}, n.qtd ? "AS REVENDEDORAS FICAM NO CADASTRO" : "QUEM TRABALHA AQUI · "+p.gente.length+(p.gente.length===1 ? " PESSOA" : " PESSOAS")),
          e("div",{style:{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:7}},
            p.gente.map(function(f,i){ var pn = f.nome.split(" "), tn = TONS[i%5]; return e("div",{key:f.nome+i, title:f.nome, style:{display:"flex", alignItems:"center", gap:8, background:chip, borderRadius:12, padding:"6px 10px", fontSize:14, fontWeight:600, minWidth:0}},
              e("svg",{width:26, height:26, viewBox:"0 0 20 20", style:{flex:"none"}}, e("circle",{cx:10, cy:10, r:11, fill:"#E9E2D3"}), e("rect",{x:3, y:12, width:14, height:8, rx:3, fill:c1}), e("circle",{cx:10, cy:8, r:4.6, fill:tn[0]}),
                ehHomem(f.nome) ? e("path",{d:"M5.2 8 Q10 1.5 14.8 8 L14.8 6 Q10 0 5.2 6 Z", fill:tn[1]}) : e("path",{d:"M4.6 9 Q4.2 1.5 10 1.8 Q15.8 1.5 15.4 9 L15.4 14 L13.8 14 L13.8 7 L6.2 7 L6.2 14 L4.6 14 Z", fill:tn[1]})),
              e("span",{style:{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}, pn[0]+" "+(pn.length>2 ? pn[pn.length-1] : (pn[1]||""))));
            }))))));
}

function PainelPassos(p){
  var m = p.modo;
  return e("div",{className:"flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-2xl bg-card p-3 ring-1 ring-[#E8B84B]/30"},
    e("div",{className:"flex items-start justify-between gap-2"}, e("h3",{className:"text-[16px] font-bold text-white"}, m.nome), p.onFechar && e("button",{onClick:p.onFechar, "aria-label":"Fechar a lista de etapas", className:"grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-[16px] font-bold text-white hover:bg-white/20"}, "×")),
    e("p",{className:"text-[12.5px] leading-snug text-white/85"}, m.resumo),
    m.passos ? e("div",{className:"flex min-h-0 flex-col gap-1.5 overflow-y-auto"},
      m.passos.map(function(s,i){ return e("button",{key:i, onClick:function(){ p.onIr(i); }, className:"flex items-start gap-2 rounded-lg bg-black/20 px-2 py-1.5 text-left hover:bg-black/35"},
        e("span",{className:"grid min-w-6 shrink-0 place-items-center rounded-full bg-[#E8B84B] px-1 text-[12px] font-extrabold text-[#1B1409]"}, s.r || (i+1)),
        e("span",{className:"text-[12.5px] leading-snug text-white"}, e("b",null, NOS[s.n].nome+": "), s.t)); })
      .concat((m.desvios||[]).map(function(d,i){ return e("div",{key:"d"+i, className:"flex items-start gap-2 rounded-lg bg-black/10 px-2 py-1.5"},
        e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-[#1B1409]", style:{background:COR_ETAPA[d.l]}}, d.l),
        e("span",{className:"text-[12.5px] leading-snug text-white"}, e("b",null, NOS[d.n].nome+": "), d.t)); })))
    : e("p",{className:"text-[12.5px] text-white/70"}, "Afastado, os blocos ficam compactos. Aproxime com a roda do mouse para ver o bloco completo e clique nele para abrir as telas do setor e os nomes. Arraste o fundo para mover o mapa."));
}

function AbaFluxoEmpresa(){
  var s1 = useState(null), sel = s1[0], setSel = s1[1];
  var s1b = useState(null), selInfo = s1b[0], setSelInfo = s1b[1];
  var s2 = useState(true), anda = s2[0], setAnda = s2[1];
  var s3 = useState("geral"), modoId = s3[0], setModoId = s3[1];
  var s4 = useState(false), cheia = s4[0], setCheia = s4[1];
  var s5 = useState({x:0, y:0, k:0.3}), view = s5[0], setView = s5[1];
  var s6 = useState(false), resumido = s6[0], setResumido = s6[1];
  var s7 = useState(true), painel = s7[0], setPainel = s7[1];
  var s8 = useState(false), menu = s8[0], setMenu = s8[1];
  var cont = useRef(null), svg = useRef(null), vref = useRef(view), moveu = useRef(false), arrasto = useRef(null);
  vref.current = view;
  var todas = funcionarios(), modo = MODOS.find(function(m){ return m.id===modoId; });
  var lay = modo.passos ? layoutModo(modo) : null, CW = lay ? lay.CW : GW, CH = lay ? lay.CH : GH;
  var dimRef = useRef([CW, CH, !!lay]); dimRef.current = [CW, CH, !!lay];
  var ajustar = function(){ var el = cont.current; if(!el) return; var r = el.getBoundingClientRect(), d = dimRef.current, k = Math.min(r.width/d[0], r.height/d[1])*0.97;
    setView({k:k, x:(r.width-d[0]*k)/2, y:(r.height-d[1]*k)/2}); };
  var ajustarLargura = function(){ var el = cont.current; if(!el) return; var r = el.getBoundingClientRect(), d = dimRef.current, lay0 = !!dimRef.current[2], k;
    if(lay0){ k = Math.max(0.2, Math.min(r.width/d[0], (r.height-40)/d[1])*0.97); setView({k:k, x:(r.width-d[0]*k)/2, y:Math.max(70, (r.height-d[1]*k)/2+10)}); }
    else { k = Math.max(0.2, r.width/d[0]*0.98); setView({k:k, x:(r.width-d[0]*k)/2, y:12}); } };
  var zoom = function(f, px, py){ var v = vref.current, nk = Math.max(0.12, Math.min(2.5, v.k*f)), r = nk/v.k; setView({k:nk, x:px-(px-v.x)*r, y:py-(py-v.y)*r}); };
  var irPara = function(x, y){ var el = cont.current; if(!el) return; var r = el.getBoundingClientRect(), k = Math.max(vref.current.k, 0.75); setView({k:k, x:r.width/2-(x+BW/2)*k, y:r.height/2-(y+BH/2)*k}); };
  useEffect(function(){ ajustarLargura(); setSel(null); setSelInfo(null); }, [modoId, cheia, painel]);
  useEffect(function(){ var f = function(){ ajustarLargura(); }; window.addEventListener("resize", f); return function(){ window.removeEventListener("resize", f); }; }, []);
  useEffect(function(){   // roda do mouse = zoom no ponto do cursor (listener não passivo para segurar a rolagem da página)
    var el = cont.current; if(!el) return;
    var f = function(ev){ ev.preventDefault(); var r = el.getBoundingClientRect(); zoom(Math.exp(-ev.deltaY*0.0016), ev.clientX-r.left, ev.clientY-r.top); };
    el.addEventListener("wheel", f, {passive:false}); return function(){ el.removeEventListener("wheel", f); }; }, [cheia]);
  useEffect(function(){ var el = svg.current; if(el && el.pauseAnimations){ if(anda) el.unpauseAnimations(); else el.pauseAnimations(); } }, [anda, modoId]);
  useEffect(function(){ if(!cheia) return; var f = function(ev){ if(ev.key==="Escape") setCheia(false); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [cheia]);
  var baixar = function(ev){ if(ev.button!==0) return; moveu.current = false; var v = vref.current; arrasto.current = {sx:ev.clientX, sy:ev.clientY, ox:v.x, oy:v.y};
    var mv = function(m){ var a = arrasto.current; if(!a) return; var dx = m.clientX-a.sx, dy = m.clientY-a.sy; if(Math.abs(dx)+Math.abs(dy)>4) moveu.current = true; setView({k:vref.current.k, x:a.ox+dx, y:a.oy+dy}); };
    var up = function(){ arrasto.current = null; window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); };
  var botao = function(txt, fn, on, t){ return e("button",{key:txt, onClick:fn, title:t, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-semibold ring-1 "+(on ? "bg-primary/20 text-white ring-2 ring-primary" : "bg-white/10 text-white ring-white/15 hover:bg-white/20")}, txt); };
  var centro = function(){ var r = cont.current.getBoundingClientRect(); return [r.width/2, r.height/2]; };
  var pode = function(){ return !moveu.current; };
  var escolher = function(k, info){ setSel(k); setSelInfo(info||null); };
    var arrow = function(key, pts, grosso, i){ var d = caminho(pts);
    return e("g",{key:key},
      e("path",{d:d, fill:"none", stroke:"#000", strokeOpacity:.45, strokeWidth:grosso+6, strokeLinecap:"round", strokeLinejoin:"round"}),
      e("path",{d:d, fill:"none", stroke:"url(#a-"+key+")", strokeWidth:grosso, strokeLinecap:"round", strokeLinejoin:"round", markerEnd:"url(#ponta)"})); };
  // UMA bolinha por fluxo: anda por todas as setas do caminho, em ordem (passa por baixo dos blocos)
  var bolinha = function(chave, pontos, cor){ var d = caminho(pontos), len = 0; for(var q=1;q<pontos.length;q++) len += Math.abs(pontos[q][0]-pontos[q-1][0])+Math.abs(pontos[q][1]-pontos[q-1][1]);
    return e("circle",{key:chave, r:15, fill:cor||"#FDE68A", stroke:"#fff", strokeWidth:3}, e("animateMotion",{dur:Math.max(10, len/190)+"s", repeatCount:"indefinite", path:d})); };
  var CADEIA_GERAL = ["mkt>leads","leads>cad","cad>kn","kn>rep","rep>cond","cond>mont","mont>bip","bip>rep","rep>agend","agend>ret","ret>fin"];
  var cadeia = function(lista){ var pts = []; lista.forEach(function(pp){ pts = pts.concat(pp); }); return pts; };
  var setasDef = lay ? lay.setas.map(function(s,i){ return ["m"+i, s.pts, s.de, s.para]; }) : Object.keys(SETAS).map(function(k){ var q = k.split(">"); return ["s"+q[0]+"_"+q[1], SETAS[k], q[0], q[1]]; });
  var bbtn = function(txt, fn, on, t){ return e("button",{key:txt, onClick:fn, title:t, className:"whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold "+(on ? "bg-primary/25 text-white ring-1 ring-primary" : "bg-white/10 text-white hover:bg-white/20")}, txt); };
  var barra = e("div",{className:"relative z-20 flex flex-wrap items-center gap-1.5 border-b border-white/15 bg-[#0e0b08] px-2.5 py-2"},
    e("div",{className:"relative"},
      e("button",{onClick:function(){ setMenu(!menu); }, "aria-expanded":menu, className:"flex items-center gap-2 rounded-lg bg-[#E8B84B] px-3 py-1.5 text-[13px] font-bold text-[#1B1409] hover:brightness-110"}, "Fluxo: "+modo.nome, e("span",null, menu ? "▴" : "▾")),
      menu && e("div",{className:"absolute left-0 top-full z-20 mt-1.5 flex w-72 flex-col gap-1 rounded-xl bg-[#1d1812] p-1.5 shadow-2xl ring-1 ring-[#E8B84B]/40"},
        MODOS.map(function(m){ return e("button",{key:m.id, onClick:function(){ setModoId(m.id); setMenu(false); }, className:"rounded-lg px-3 py-2 text-left text-[13px] font-semibold "+(m.id===modoId ? "bg-primary/25 text-white" : "text-white hover:bg-white/10")}, m.nome); }))),
    bbtn("−", function(){ var c = centro(); zoom(0.8, c[0], c[1]); }, false, "Afastar"), bbtn("+", function(){ var c = centro(); zoom(1.25, c[0], c[1]); }, false, "Aproximar"),
    bbtn("Ajustar", ajustar, false, "Mostrar o mapa todo"),
    bbtn(resumido ? "Ver completo" : "Resumido", function(){ setResumido(!resumido); }, resumido, "Alterna entre o bloco completo e o resumido"),
    bbtn(anda ? "⏸" : "▶", function(){ setAnda(!anda); }, false, anda ? "Pausar as setas" : "Continuar as setas"),
    bbtn(painel ? "Etapas ✕" : "Etapas", function(){ setPainel(!painel); }, painel, "Mostrar ou fechar a lista de etapas"),
    bbtn(cheia ? "✕ Sair" : "⛶ Tela cheia", function(){ setCheia(!cheia); }, cheia),
    e("span",{className:"rounded-md bg-warning/25 px-2 py-1 text-[11px] font-bold text-warning"},"Demonstração"),
    e("div",{className:"ml-2 min-w-[14rem] flex-1 border-l border-white/15 pl-3"}, e("div",{className:"text-[16px] font-extrabold leading-tight text-[#F1E4C6]"}, modo.nome), e("div",{className:"text-[11.5px] leading-snug text-white/70"}, modo.resumo+(lay ? " Leia da esquerda para a direita, seguindo os números." : ""))));
  var alt = cheia ? "calc(100vh - 1.5rem)" : "calc(100vh - 8.5rem)";
  return e(React.Fragment,null,
    !cheia && e(PageHead,{t:"Fluxo da empresa", sub:"O mapa da Sorelly. Roda do mouse aproxima, arrastar move, clicar num bloco abre as telas do setor e as pessoas."}),
    e("div",{className:cheia ? "fixed inset-0 z-[60] bg-background p-3" : "mx-auto w-full max-w-[120rem]"},
      e("div",{className:"grid min-h-0 gap-2 "+(painel ? "xl:grid-cols-[minmax(0,1fr)_21rem]" : "grid-cols-1")},
        e("div",{className:"flex min-w-0 flex-col overflow-visible rounded-2xl ring-1 ring-[#E8B84B]/30", style:{height:alt, minHeight:"30rem", background:"#15110d"}}, barra,
        e("div",{ref:cont, onPointerDown:baixar, className:"relative min-h-0 flex-1 select-none overflow-hidden rounded-b-2xl", style:{cursor:arrasto.current ? "grabbing" : "grab", touchAction:"none"}},
          e("svg",{ref:svg, width:"100%", height:"100%", role:"img", "aria-label":"Mapa da empresa Sorelly em blocos"},
            e("defs",null,
              e("pattern",{id:"grade", width:60, height:60, patternUnits:"userSpaceOnUse", patternTransform:"translate("+view.x+" "+view.y+") scale("+view.k+")"},
                e("path",{d:"M60 0H0V60", fill:"none", stroke:"rgba(232,184,75,.20)", strokeWidth:1.2})),
              e("linearGradient",{id:"brilho", x1:0, y1:0, x2:0, y2:1}, e("stop",{offset:"0%", stopColor:"#fff", stopOpacity:.34}), e("stop",{offset:"100%", stopColor:"#fff", stopOpacity:0})),
              e("linearGradient",{id:"prog", x1:0, y1:0, x2:1, y2:0}, e("stop",{offset:"0%", stopColor:"#16A34A"}), e("stop",{offset:"100%", stopColor:"#86EFAC"})),
              Object.keys(NOS).map(function(id){ var c = NOS[id].c; return [
                e("linearGradient",{key:id, id:"g-"+id, x1:0, y1:0, x2:1, y2:1}, e("stop",{offset:"0%", stopColor:c[0]}), e("stop",{offset:"45%", stopColor:mistura(c[0],c[1],.45)}), e("stop",{offset:"100%", stopColor:c[1]})),
                e("linearGradient",{key:"t"+id, id:"t-"+id, x1:0, y1:0, x2:1, y2:1}, e("stop",{offset:"0%", stopColor:mistura(c[0],"#FFFFFF",.75)}), e("stop",{offset:"100%", stopColor:mistura(c[0],"#FFFFFF",.15)}))]; }),
              setasDef.map(function(a){ var p = a[1], b = p[p.length-1];
                return e("linearGradient",{key:a[0], id:"a-"+a[0], gradientUnits:"userSpaceOnUse", x1:p[0][0], y1:p[0][1], x2:b[0]+0.01, y2:b[1]+0.01}, e("stop",{offset:"0%", stopColor:NOS[a[2]].c[0]}), e("stop",{offset:"100%", stopColor:NOS[a[3]].c[0]})); }),
              e("marker",{id:"ponta", viewBox:"0 0 10 10", refX:6, refY:5, markerWidth:4, markerHeight:4, orient:"auto-start-reverse"}, e("path",{d:"M1 1 L9 5 L1 9 Z", fill:"#F1E4C6"}))),
            e("rect",{width:"100%", height:"100%", fill:"url(#grade)"}),
            e("g",{transform:"translate("+view.x+","+view.y+") scale("+view.k+")"},
              !lay && [0,1,2,3,4].map(function(r){ return e("rect",{key:"fx"+r, x:30, y:Y[r]-76, width:GW-60, height:BH+150, rx:30, fill:"rgba(255,255,255,.035)", stroke:"rgba(232,184,75,.20)", strokeWidth:2}); }),
              !lay && [["1 · ENTRADA DE REVENDEDORAS", Y[0]], ["2 · LISTAGEM E ENCOMENDAS", Y[1]], ["3 · CONDICIONAIS, MONTAGEM E BIPAGEM", Y[2]], ["4 · ATENDIMENTO, RETORNO E DINHEIRO", Y[3]], ["5 · PEÇAS, GARANTIA E INADIMPLÊNCIA", Y[4]], ["APOIO E SUPORTE", APY]].map(function(t){
                return e("text",{key:t[0], x:60, y:t[1]-34, fontSize:26, fontWeight:800, letterSpacing:6, fill:"#E8B84B", opacity:.9, style:{fontFamily:FONTE}}, t[0]); }),
              !lay && e("g",{key:"start", transform:"translate("+(X[0]+BW-330)+","+(Y[0]-96)+")", pointerEvents:"none"}, e("rect",{x:0, y:0, width:330, height:46, rx:23, fill:"#22C55E", stroke:"#052E16", strokeWidth:3}), e("text",{x:165, y:31, textAnchor:"middle", fontSize:24, fontWeight:900, fill:"#052E16", style:{fontFamily:FONTE}}, "▶ COMEÇA AQUI")),
              !lay && e("rect",{x:30, y:APY-76, width:GW-60, height:BH+150, rx:30, fill:"none", stroke:"rgba(232,184,75,.35)", strokeWidth:3, strokeDasharray:"14 12"}),
              !lay && setasDef.map(function(a,i){ return arrow(a[0], a[1], 9, i); }),
              !lay && bolinha("bg", cadeia(CADEIA_GERAL.map(function(k){ return SETAS[k]; })), "#FDE68A"),
              !lay && GIDS.map(function(id){ var q = gpos(id); return e(Bloco,{key:id, k:id, id:id, x:q.x, y:q.y, resumido:resumido, sel:sel, onSel:escolher, pode:pode, gente:pessoasDe(id, todas)}); }),
              lay && [lay.bandas.map(function(b,j){ return e("g",{key:"bd"+j, pointerEvents:"none"}, e("rect",{x:b.x, y:b.y, width:b.w, height:b.h, rx:30, fill:b.cor+"14", stroke:b.cor+"55", strokeWidth:3}), e("text",{x:b.x+28, y:b.y+46, fontSize:30, fontWeight:800, letterSpacing:3, fill:b.cor, style:{fontFamily:FONTE}}, b.txt)); }),
                setasDef.map(function(a,i){ return arrow(a[0], a[1], 10, i); }),
                lay.trilhas.map(function(tr,j){ return bolinha("bo"+j, cadeia(tr.map(function(ix){ return lay.setas[ix].pts; })), j ? "#BFDBFE" : "#FDE68A"); }),
                lay.itens.map(function(it){ return e(Bloco,{key:"i"+it.i, k:"i"+it.i, id:it.n, x:it.x, y:it.y, num:it.i+1, tags:it.tags, resumido:resumido, sel:sel, onSel:escolher, pode:pode, gente:pessoasDe(it.n, todas)}); }),
                e("g",{key:"ini", transform:"translate("+lay.itens[0].x+","+(lay.itens[0].y-64)+")", pointerEvents:"none"}, e("rect",{x:50, y:0, width:260, height:46, rx:23, fill:"#22C55E", stroke:"#052E16", strokeWidth:3}), e("text",{x:180, y:31, textAnchor:"middle", fontSize:24, fontWeight:900, fill:"#052E16", style:{fontFamily:FONTE}}, "▶ COMEÇA AQUI")),
                lay.fins.map(function(u,fi){ return e("g",{key:"fim"+fi, transform:"translate("+(u.x+BW-170)+","+(u.y+BH+26)+")", pointerEvents:"none"}, e("rect",{x:0, y:0, width:170, height:44, rx:22, fill:"#EF4444", stroke:"#450A0A", strokeWidth:3}), e("text",{x:85, y:30, textAnchor:"middle", fontSize:24, fontWeight:900, fill:"#FFF", style:{fontFamily:FONTE}}, "■ FIM")); }),
                lay.desv.length>0 && e("text",{key:"dt", x:MX, y:lay.yd+40, fontSize:26, fontWeight:800, letterSpacing:5, fill:"#E8B84B", style:{fontFamily:FONTE}}, "DESVIOS E APOIO · A LETRA LIGA À ETAPA"),
                lay.desv.map(function(d,j){ return e(Bloco,{key:"d"+j, k:"d"+j, id:d.n, x:d.x, y:d.y, letra:d.l, resumido:resumido, sel:sel, onSel:escolher, pode:pode, gente:pessoasDe(d.n, todas)}); })],
              sel && selInfo && e(Aberto,{id:selInfo.id, x:selInfo.x, y:selInfo.y, gente:pessoasDe(selInfo.id, todas), onFechar:function(){ setSel(null); setSelInfo(null); }}))),
          e("div",{className:"pointer-events-none absolute bottom-2 left-3 rounded bg-black/40 px-1.5 py-0.5 text-[11px] text-white/70"}, Math.round(view.k*100)+"% · roda do mouse = zoom · arrastar = mover"))),
        painel && e("div",{className:"flex min-h-0 flex-col gap-2", style:{maxHeight:alt}},
          e(PainelPassos,{modo:modo, onFechar:function(){ setPainel(false); }, onIr:function(i){ var it = lay && lay.itens[i]; if(it){ irPara(it.x, it.y); escolher("i"+i, {id:it.n, x:it.x, y:it.y}); } }})))));
}

export { AbaFluxoEmpresa };
