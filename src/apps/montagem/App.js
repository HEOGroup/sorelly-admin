// Sorelly Admin · montagem e bipagem — App.js (casca)
//
// Mesma casca do HTML original (menu por setores, cabeçalho, apps do topo).
// A única diferença: a tela ativa deixou de ser escolhida por um mapa
// `aba -> componente` aqui dentro e passou a vir da rota — o conteúdo entra
// pelo <Outlet/>, e cada página é um chunk carregado sob demanda.
import { isoDia } from "@/apps/montagem/lib/format";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { rotAlertas } from "@/apps/montagem/domain/rotina";
import * as srv from "@/apps/montagem/lib/api";
import { setoresLigados, urlAdminAntigo } from "@/apps/montagem/lib/fase";
import { useSyncModulos } from "@/apps/montagem/lib/sync-modulos";
import { TelaEntrar } from "@/apps/montagem/components/tela-entrar";
import { chaveMes, precisaVirar } from "@/apps/montagem/domain/agendamento";
import { p45Alertas } from "@/apps/montagem/domain/plano45-60";
import { ACESSO_FF } from "@/apps/montagem/domain/financeiro-familiar";
import { ACESSO_COBRANCA_BASE } from "@/apps/montagem/domain/cobranca-func";
import { e, useEffect, useState, useReducer } from "@/shared/react";
import React from "react";
// Ícones Phosphor (pacote npm, mesma versão 2.1.1 que vinha do CDN): só este app usa, por isso o import fica aqui
// e o app de kits novos (que desenha SVG inline) não baixa as fontes. Servidos pelo próprio sistema, sem depender do jsDelivr.
import "@phosphor-icons/web/duotone";
import "@phosphor-icons/web/fill";
import "@/apps/montagem/styles/montagem.css";
import { abaDoCaminho, caminhoDaAba } from "@/apps/montagem/router/slugs";
import { useRotaAba } from "@/router/use-rota-aba";
import { Aviso } from "@/apps/montagem/components/aviso";
import { definirAutorizacoes, temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { BarraCascata } from "@/apps/montagem/components/barra-cascata";
import { MenuSetor } from "@/apps/montagem/components/barra-menu";
import { setPlano } from "@/apps/montagem/lib/estilo-plano";
import { BuscaTela } from "@/apps/montagem/components/busca-tela";
import { iniciarAtalhos } from "@/apps/montagem/lib/atalhos-tela";
import { AvisoAlertas } from "@/apps/montagem/components/aviso-alertas";
import { BotaoNotificacoes } from "@/apps/montagem/components/botao-notificacoes";
import { SeletorAcesso } from "@/apps/montagem/components/seletor-acesso";
import { IrPara } from "@/apps/montagem/components/ir-para";
import { TelaLogin } from "@/apps/montagem/components/tela-login";
import { ABAS, COR_ABA, GRUPOS_MENU } from "@/apps/montagem/navigation/abas";
import { MARCAS, MarcaTela, marcaDe } from "@/apps/montagem/navigation/marcas";
import { LogoChat } from "@/apps/montagem/components/chat/chat-ui";
import { abasDoPapel, PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { APPS_TOPO, SETORES, SETORES_BAIXO, ondeEsta } from "@/apps/montagem/navigation/setores";
import { BIPA_RETORNO_PADRAO, definirBlocos, grupoDe, nomeDe, papelDe, podeGerirAgend } from "@/apps/montagem/domain/equipe";
import { quemBipa } from "@/apps/montagem/domain/retornos";
import { CHAVE, inicial } from "@/apps/montagem/state/store";
import { Ctx } from "@/apps/montagem/state/context";
import { reducer } from "@/apps/montagem/state/reducer";
import { Icon } from "@/apps/montagem/ui/icon";
import { ChatGlobal, ChatMini, useEu } from "@/apps/montagem/components/chat/chat-app";
import { ehDirecao } from "@/apps/montagem/domain/chat-contatos";
import { api, efem, definirHorariosRh } from "@/apps/montagem/domain/chat-store";
import { horariosDoRh } from "@/apps/montagem/domain/rh";
import { contato } from "@/apps/montagem/domain/chat-contatos";
import * as sons from "@/apps/montagem/lib/sons";

// cor de cada botão da barra de cima (mais cores em degradê para achar rápido); sem cor aqui, vale a cor do setor
var ACESSO_COB = ACESSO_COBRANCA_BASE.concat([32]);   // sócios + Amanda de Miranda (id 32): quem opera a cobrança de funcionárias
var COR_AREA = {};   // Financeiro usa uma cor só (a do setor); cores diferentes ficam só para estado (pago, atrasado...)
// agrupa os botões da barra do topo (áreas com "grupo"): o nome do grupo fica em cima dos botões; sem grupo, lista simples
// menu em cascata montado das áreas do setor: área com uma tela só vira botão direto; área com grupos abre grupo → tela; as demais abrem a lista de telas
function menuAuto(st){
  var nm = function(t){ return String(t||"").replace(/\n/g, " "); };
  var tela = function(t){ return t.breve ? {nome:nm(t.nome), breve:true} : {nome:nm(t.nome), aba:t.aba}; };
  return st.areas.map(function(ar){
    var nome = nm(ar.nome);
    if(ar.telas.length===1) return Object.assign(tela(ar.telas[0]), {nome:nome});
    if(ar.grupos && ar.grupos.length>1) return {nome:nome, itens:ar.grupos.map(function(g){ return g.telas.length===1 ? tela(g.telas[0]) : {nome:nm(g.titulo), itens:g.telas.map(tela)}; })};
    return {nome:nome, itens:ar.telas.map(tela)};
  });
}
function botoesAgrupados(areas, fazer, cor){
  if(!areas.some(function(a){ return a.grupo; })) return areas.map(fazer);
  var ordem = [], mapa = {};
  areas.forEach(function(ar, i){ var g = ar.grupo || "Outros"; if(!mapa[g]){ mapa[g] = []; ordem.push(g); } mapa[g].push(fazer(ar, i)); });
  return ordem.map(function(g){ return e("div",{key:g, className:"flex flex-col gap-0.5"},
    e("span",{className:"px-1 text-[10px] font-bold uppercase leading-none tracking-[.14em]", style:{color:cor+"cc"}}, g),
    e("div",{className:"flex flex-wrap items-center gap-1"}, mapa[g])); });
}
function App(){
  var r = useReducer(reducer, null, inicial), s = r[0], d = r[1];
  var navigate = useNavigate();
  var euChat = useEu(s.usuario);
  // Servidor ligado (lib/api.js): sem login pede e-mail e senha; com login restaura quem é (pessoaId) e guarda no sistema. O token vencido ou a saída voltam para a entrada.
  var sn = useState(0), recarregar = function(){ sn[1](function(x){ return x+1; }); };
  useEffect(function(){ window.addEventListener("sorelly-saiu", recarregar); return function(){ window.removeEventListener("sorelly-saiu", recarregar); }; }, []);
  useEffect(function(){ if(!srv.apiAtiva() || !srv.token()) return; srv.chamar("GET", "/auth/eu").then(function(j){ if(j.usuario && j.usuario.pessoaId!=null && j.usuario.pessoaId!==s.usuario) d({type:"LOGIN", id:j.usuario.pessoaId}); }).catch(function(){}); }, [sn[0]]);
  // Rotina do dia vinda do servidor: combinados e checks de hoje, a cada minuto
  useEffect(function(){ if(!srv.apiAtiva() || !srv.token()) return; var t = function(){ var n = new Date(), p = function(x){ return String(x).padStart(2, "0"); }, dia = n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate());
      Promise.all([srv.chamar("GET", "/rotina/itens"), srv.chamar("GET", "/rotina/registros?data="+dia)]).then(function(r){ d({type:"ROT", op:"sync", itens:r[0].itens, dia:dia, reg:r[1].reg}); }).catch(function(){}); }; t(); var iv = setInterval(t, 60000); return function(){ clearInterval(iv); }; }, [sn[0], s.usuario]);
  useSyncModulos(s, d);   // módulos que ficam no servidor (RH por padrão)
  useEffect(function(){ sons.iniciar(); iniciarAtalhos(); }, []);   // sons, arrastar para o lado e Ctrl+F valem em todas as telas
  // pagamentos do atendimento interno para conferir viram um cartão no grupo "Atendimento Interno"; confirmar lá confirma aqui (e vice-versa)
  useEffect(function(){ (s.lancFin||[]).forEach(function(lf){ api.syncPayment(lf); }); }, [s.lancFin]);
  // virada do mês do Agendamento: fecha o mês que passou com o que valia no último dia e abre o novo (confere ao abrir e a cada 10 minutos)
  // Rotina do dia: a cada minuto confere se algum item seu passou do horário sem o check e avisa (um alerta por item por dia)
  useEffect(function(){ var t = function(){ if(!s.logado || !s.rot) return; var n = new Date(), p = function(x){ return String(x).padStart(2, "0"); };
      rotAlertas(s.rot, s.usuario, n.getFullYear()+"-"+p(n.getMonth()+1)+"-"+p(n.getDate()), p(n.getHours())+":"+p(n.getMinutes())).forEach(function(al){ d(Object.assign({type:"ALERTA_ADD"}, al)); }); }; t(); var iv = setInterval(t, 60000); return function(){ clearInterval(iv); }; }, [s.rot, s.usuario, s.logado]);
  useEffect(function(){ var t = function(){ if(s.logado && s.agend && precisaVirar(s.agend, chaveMes(new Date()))) d({type:"AG", op:"virar", por:"Automático"}); }; t(); var iv = setInterval(t, 600000); return function(){ clearInterval(iv); }; }, [s.agend, s.logado]);
  // Plano 45/60: aprovada sem contato em 24 h e nova data sem venda lançada (um alerta por tipo por dia)
  useEffect(function(){ var t = function(){ if(!s.logado || !s.p45) return; p45Alertas(s).forEach(function(al){ d(Object.assign({type:"ALERTA_ADD"}, al)); }); }; t(); var iv = setInterval(t, 600000); return function(){ clearInterval(iv); }; }, [s.p45, s.logado]);
  useEffect(function(){ d({type:"FIN_REP_SYNC"}); }, [s.acertosConsignado]);   // pagamentos dos acertos das representantes → grupo Financeiro Representantes
  useEffect(function(){ api.avisoAgenda(isoDia(new Date()), s.internos||[]); }, [s.internos]);   // aviso diário do grupo Agendamento (atendimentos do dia e cancelamentos)
  var loc = useLocation();
  var naURL = abaDoCaminho(loc.pathname), abaURL = naURL.aba, breveURL = naURL.breve;
  var mn = useState(false), menu = mn[0], setMenu = mn[1];
  // botão flutuante do SorellyChat: desligado por padrão; só aparece depois que o Marcus liga no botão do topo (lembra a escolha)
  var cbs = useState(function(){ try{ return localStorage.getItem("sorelly_chat_botao")==="1"; }catch(x){ return false; } }), chatBotao = cbs[0], setChatBotao = cbs[1];
  var alternaChatBotao = function(){ var v = !chatBotao; setChatBotao(v); try{ localStorage.setItem("sorelly_chat_botao", v ? "1" : "0"); }catch(x){} };
  // menu lateral recolhido (quem passa o dia numa tela só ganha espaço); lembra a escolha neste navegador
  var rcs = useState(function(){ try{ return localStorage.getItem("sorelly_menu_recolhido")==="1"; }catch(x){ return false; } }), recolhido = rcs[0], setRecolhido = rcs[1];
  // largura do menu lateral: arrastar a borda direita aumenta ou diminui; lembra a escolha neste navegador
  var mws = useState(function(){ try{ var n = Number(localStorage.getItem("sorelly_menu_largura")); return n>=200 && n<=480 ? n : 232; }catch(x){ return 232; } }), menuW = mws[0], setMenuW = mws[1];
  var arr = useState(false), arrastando = arr[0], setArrastando = arr[1];
  var arrastarMenu = function(ev){
    ev.preventDefault(); setArrastando(true);
    var ultimo = menuW;
    var mover = function(m){ ultimo = Math.max(200, Math.min(480, m.clientX)); setMenuW(ultimo); };
    var soltar = function(){ window.removeEventListener("mousemove", mover); window.removeEventListener("mouseup", soltar); setArrastando(false); try{ localStorage.setItem("sorelly_menu_largura", String(ultimo)); }catch(x){} };
    window.addEventListener("mousemove", mover); window.addEventListener("mouseup", soltar);
  };
  var alternarMenu = function(v){ setRecolhido(v); if(v) setColArea(null); try{ localStorage.setItem("sorelly_menu_recolhido", v ? "1" : "0"); }catch(x){} };
  var ga = useState({}), gruposAb = ga[0], setGruposAb = ga[1];
  var so = useState(function(){ var o = ondeEsta(abaURL); return o ? o.setor.id : "kits"; }), setorAb = so[0], setSetorAb = so[1];
  var ca = useState(null), colArea = ca[0], setColArea = ca[1];
  // barra do topo aberta 100% (todas as telas do setor à vista) ou recolhida (listas suspensas); lembra a escolha neste navegador
  var ba = useState(function(){ try{ return localStorage.getItem("sorelly_barra_aberta")!=="0"; }catch(x){ return true; } }), barraAberta = ba[0], setBarraAberta = ba[1];
  var alternarBarra = function(v){ setBarraAberta(v); setAreaTopo(null); try{ localStorage.setItem("sorelly_barra_aberta", v ? "1" : "0"); }catch(x){} };
  var at = useState(null), areaTopo = at[0], setAreaTopo = at[1];   // lista de telas aberta na barra do topo ({i, x, y})
  var gg = useState(0), grupoAb = gg[0], setGrupoAb = gg[1];   // grupo aberto dentro da coluna (um de cada vez)   // {setor, i}: área com a coluna lateral aberta
  useEffect(function(){ try{ localStorage.setItem(CHAVE, JSON.stringify(Object.assign({}, s, {aviso:null}))); }catch(x){} }, [s]);
  useEffect(function(){ document.documentElement.classList.add("app-montagem");
    return function(){ document.documentElement.classList.remove("app-montagem"); }; }, []);
  definirAutorizacoes(s.autoriz);   // quem pode fazer cada ação (RH → Acessos e autorizações)
  definirBlocos(s.acessosBlocos);   // partes de cada tela que o RH liberou por grupo
  definirHorariosRh(horariosDoRh(s));   // horário de trabalho do SorellyChat = entrada e escala do cadastro do RH
  var papel = grupoDe(s.usuario), permitidas = abasDoPapel(papel, s.acessos);
  // quem bipa os retornos (Configurador geral) também abre o Consolidado e o Controle de kits, mesmo sendo de outro setor
  if(permitidas && quemBipa(s, BIPA_RETORNO_PADRAO()).indexOf(s.usuario)>=0) permitidas = permitidas.concat(["consrep","controlekits"].filter(function(t){ return permitidas.indexOf(t)<0; }));
  if(permitidas && permitidas.indexOf("whats")<0) permitidas = permitidas.concat(["whats"]);
  if(permitidas && permitidas.indexOf("rotina")<0) permitidas = permitidas.concat(["rotina"]);   // a Rotina do dia é de todo mundo (cada um vê a sua)   // o SorellyChat é de todo mundo
  if(permitidas && permitidas.indexOf("apps")<0) permitidas = permitidas.concat(["apps"]);   // a página Apps está liberada para todos por enquanto (o Marcus bloqueia na versão oficial)
  var abas = ABAS.filter(function(a){ return !permitidas || permitidas.indexOf(a[0])>=0; });
  var aba = abaURL==="breve" && !permitidas ? "breve" : abas.some(function(a){return a[0]===abaURL;}) ? abaURL : abas[0][0];
  useRotaAba({aba:aba, abaURL:abaURL, breve:breveURL, estado:s, dispatch:d, caminhoDaAba:caminhoDaAba});
  var titulo = aba==="breve" ? (breveURL||s.breveNome||"Em breve") : ABAS.find(function(a){return a[0]===aba;})[1];
  var onde = ondeEsta(aba);
  // telas que este perfil pode abrir (as "em breve" só a supervisão vê)
  var visao = s.visaoMenu==="marcus" && s.usuario===16 ? "marcus" : "admin";   // dois modos: Admin (a Sorelly) e Marcus (sistema particular, só ele)
  var gerAg = podeGerirAgend(s.usuario, s.agend);
  var pode = function(t){ if(t.aba && t.aba.indexOf("marcus")===0 && s.usuario!==16) return false; if((t.aba==="agabertura" || t.aba==="agconfig") && !gerAg) return false; if(t.aba && ["cfvisao","cfdevendo","cfquitados","cfrelatorio","cffunc","cfconfig"].indexOf(t.aba)>=0 && ACESSO_COB.indexOf(s.usuario)<0) return false; if(t.aba && t.aba.indexOf("ff")===0 && ["ffhome","ffalertas","ffcontas","ffpagas","ffpix","ffprest","ffprolab","ffrelatorio","ffhist","ffconfig"].indexOf(t.aba)>=0 && !temAutorizacao("financeiro_familia", s.usuario)) return false;   // Financeiro Familiar: só os sócios if(visao==="admin" && t.breve && !t.enviar) return false; if(visao==="sistema" && t.breve) return false;
    return t.breve ? !permitidas : (!permitidas || permitidas.indexOf(t.aba)>=0); };
  var setoresV = SETORES.map(function(st){ if(st.direto) return pode(st.direto) ? st : null;
    var ars = st.areas.map(function(ar){ var ts = ar.telas.filter(pode); if(!ts.length) return null;
      var gs = ar.grupos ? ar.grupos.map(function(g){ return {titulo:g.titulo, telas:g.telas.filter(pode)}; }).filter(function(g){ return g.telas.length; }) : null;
      return Object.assign({}, ar, {telas:ts, grupos:gs}); }).filter(Boolean);
    return ars.length ? Object.assign({}, st, {areas:ars}) : null; }).filter(Boolean).filter(function(st){ return visao==="marcus" ? st.id.indexOf("marcus")===0 : st.id.indexOf("marcus")!==0; }).filter(function(st){ var lig = setoresLigados(); return !lig || visao==="marcus" || lig.indexOf(st.id)>=0; });   // fase de subida: só os setores ligados
  var abrirTela = function(t){ navigate(t.breve ? caminhoDaAba("breve", t.nome) : caminhoDaAba(t.aba)); setMenu(false); };
  // menu em cascata (Financeiro): Contas a pagar leva junto o modo escolhido (Sorelly, Família ou Sorelly + Família)
  var abrirMenu = function(n){ if(n.modo){ try{ sessionStorage.setItem("cta_sel", n.modo); }catch(x){} window.dispatchEvent(new CustomEvent("cta-modo", {detail:n.modo})); } abrirTela({aba:n.aba, nome:n.nome, breve:n.breve}); };
  var podeMenu = function(n){ return n.perm ? temAutorizacao(n.perm, s.usuario) : pode({aba:n.aba, nome:n.nome, breve:n.breve}); };
  var ativoMenu = function(n){ if(n.breve) return aba==="breve" && s.breveNome===n.nome; if(n.aba!==aba && !(n.aba && caminhoDaAba(n.aba)===window.location.pathname)) return false; if(!n.modo) return true; var m = "sorelly"; try{ m = sessionStorage.getItem("cta_modo_atual") || "sorelly"; }catch(x){} return m===n.modo; };
  var ativaTela = function(t){ return t.breve ? (aba==="breve" && s.breveNome===t.nome) : t.aba===aba; };
  var tileSetor = function(st, on){ if(st.id==="whats") return e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style:{background:"#24180a", boxShadow:on ? "0 0 0 1.5px #E8B84B" : "inset 0 0 0 1px #E8B84B88"}}, e(LogoChat,{s:20}));
    return e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style: on ? {background:st.cor, color:"#fff", boxShadow:"0 2px 8px "+st.cor+"55"} : {background:st.cor+"33", color:st.cor, boxShadow:"inset 0 0 0 1px "+st.cor+"55"}},
    e(Icon,{n:st.ic, s:15, peso: on ? "fill" : "duotone"})); };
  // abre a primeira tela de verdade do setor (as "em breve" ficam por último); as outras telas ficam na barra do topo
  var primeiraTela = function(st){ var todas = [].concat.apply([], st.areas.map(function(ar){ return ar.telas; })); return todas.find(function(t){ return !t.breve; }) || todas[0]; };
  var linhaSetor = function(st){ var ativo = st.direto ? ativaTela(st.direto) : st.areas.some(function(ar){ return ar.telas.some(ativaTela); });
    return e("button",{key:st.id, onClick:function(){ var t = st.direto || primeiraTela(st); setSetorAb(st.id); if(t) abrirTela(t); setAreaTopo(null); },
      className:"flex min-h-9 w-full items-center gap-2.5 rounded-lg px-1.5 py-0.5 text-left text-[13px] leading-tight "+(soBreve(st) ? "opacity-50 grayscale " : "")+(ativo ? "bg-sidebar-accent font-medium" : "text-foreground/85 hover:bg-white/5")},
      tileSetor(st, ativo), e("span",{className:"min-w-0 flex-1 whitespace-pre-line"}, st.nome)); };
  var APPS_SETOR = {};   // apps de celular que ficam dentro de cada setor
  var soBreve = function(st){ var ts = st.direto ? [st.direto] : [].concat.apply([], st.areas.map(function(ar){ return ar.telas; })); return ts.length>0 && ts.every(function(t){ return t.breve; }); };
  // setor da tela aberta (para a barra do topo)
  var setorAtual = (function(){ var ach = []; setoresV.forEach(function(st){ if(st.direto) return; var f = null; st.areas.forEach(function(ar){ ar.telas.forEach(function(t){ if(!f && ativaTela(t)) f = {st:st, ar:ar}; }); }); if(f) ach.push(f); });
    return ach.find(function(x){ return x.st.id===setorAb; }) || ach[0] || null; })();
  setPlano(!!(setorAtual && setorAtual.st.id==="financeiro"));   // visual plano nas peças compartilhadas (lib/estilo-plano.js)
  var navPerg = !!(setorAtual && setorAtual.st.menu);
  // caminho no topo = o caminho REAL do menu (ex.: Financeiro / Contas / Fornecedores / Cadastro), não a organização antiga das áreas
  if(navPerg){ var achaTrilha = function(nos, pre){ for(var q = 0; q<nos.length; q++){ var no = nos[q]; if(no.itens){ var r = achaTrilha(no.itens, pre.concat([no.nome])); if(r) return r; } else if(ativoMenu(no)) return pre.concat([no.nome]); } return null; };
    var trilhaMenu = achaTrilha(setorAtual.st.menu, []); if(trilhaMenu){ onde = {setor:setorAtual.st, area:{nome:trilhaMenu.slice(0, -1).join(" / ") || setorAtual.st.nome}}; titulo = trilhaMenu[trilhaMenu.length-1]; } }   // setor com menu em texto (Financeiro): MenuSetor = menu + abas abertas + busca (components/barra-menu.js)
  var colSt = colArea && setoresV.find(function(x){return x.id===colArea.setor;}), colAr = colSt && colSt.areas[colArea.i];
  // largura da coluna pelo maior texto (tela, sistema ou título), entre 13 e 22 rem
  var colW = colAr ? 216 : 0;   // coluna estreita: os nomes longos quebram em duas linhas (ex.: "Faturamento & / contas a pagar")
  var toggleTema = function(){ document.documentElement.classList.toggle("dark"); };
  var navItem = function(key, lb, ic, on, onClick){ var cor = COR_ABA[key] || "#D9A63A";
    return e("button",{key:key, onClick:onClick,
    className:"flex h-9 w-full items-center gap-2.5 rounded-lg px-1.5 text-left text-sm "+(on?"bg-sidebar-accent font-medium text-sidebar-accent-foreground":"text-foreground/85 hover:bg-white/5 hover:text-foreground")},
    e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style: on ? {background:cor, color:"#fff", boxShadow:"0 2px 8px "+cor+"55"} : {background:cor+"33", color:cor, boxShadow:"inset 0 0 0 1px "+cor+"55"}},
      e(Icon,{n:ic, s:15, peso: on ? "fill" : "duotone"})), e("span",{className:"min-w-0 truncate whitespace-nowrap"}, lb)); };
  // App da bipagem no celular: só o telefone, sem menu lateral nem cabeçalho (como o app de verdade). A diretoria tem um botão pequeno para voltar ao admin.
  if(srv.apiAtiva() && !srv.token()) return e(TelaEntrar,{onEntrou:function(u){ d({type:"LOGIN", id:u.pessoaId}); recarregar(); }});
  if(s.logado && aba==="celbip") return e(Ctx.Provider,{value:{state:s, dispatch:d}},
    e("div",{className:"min-h-screen bg-background"},
      !permitidas && e("button",{onClick:function(){ navigate(caminhoDaAba("visaogeral")); }, className:"fixed left-3 top-3 z-50 rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/20"},"← Voltar ao admin"),
      e("main",{className:"flex flex-col gap-5 p-4 pt-12 md:p-6 md:pt-12"}, e(Outlet))),
    e(Aviso));
  // sem entrar, só a tela de usuário e senha (a senha é ignorada no protótipo)
  // (a tela de usuário e senha saiu a pedido do Marcus, 16/10/2026: o sistema já abre aberto; a troca de pessoa é no seletor de acesso do topo)
  return e(Ctx.Provider,{value:{state:s, dispatch:d}},
    e("aside",{className:"fixed inset-y-0 left-0 z-40 flex-col border-r border-sidebar-border bg-sidebar "+(menu?"flex":recolhido?"hidden":"hidden md:flex"), style:{width:menuW}},
      // logo da Sorelly (símbolo + nome, sem o "joias"), grande e centralizada no canto de cima à esquerda
      e("div",{className:"relative flex h-28 items-center justify-center border-b border-sidebar-border px-4"},
        e("img",{src:("/"||"/")+"logo-sorelly.png", alt:"Sorelly", draggable:false, className:"h-24 w-auto select-none"}),
        e("button",{title:"Recolher o menu", "aria-label":"Recolher o menu", onClick:function(){ alternarMenu(true); setMenu(false); }, className:"absolute right-2 top-2 hidden size-8 place-items-center rounded-md hover:bg-white/10 md:grid"}, e(Icon,{n:"fechar", s:15}))),
      !permitidas && s.usuario===16 && e("div",{className:"flex items-center gap-1.5 border-b border-sidebar-border px-3 py-2.5 text-[12px] font-semibold"},
        [["admin","Admin","O sistema da Sorelly"],["marcus","Marcus","Meu sistema particular"]].map(function(x){
          return e("button",{key:x[0], title:x[2], onClick:function(){ d({type:"VISAO_MENU", v:x[0]}); navigate(caminhoDaAba(x[0]==="marcus" ? "marcus" : "visaogeral")); setMenu(false); }, className:"flex-1 rounded-lg px-2 py-1.5 whitespace-nowrap ring-1 "+(visao===x[0] ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/60 ring-border hover:bg-muted")}, x[1]); })),
      e("nav",{className:"flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-2 pt-3"},
        setoresV.filter(function(st){ return !soBreve(st); }).concat(setoresV.filter(soBreve)).map(linhaSetor),
        !permitidas && e("div",{className:"my-2 border-t border-sidebar-border"}),
        !permitidas && SETORES_BAIXO.filter(function(st){ var lig = setoresLigados(); return pode(st.direto) && (!lig || lig.indexOf(st.id)>=0); }).map(linhaSetor),
        urlAdminAntigo() && e("a",{href:urlAdminAntigo(), target:"_blank", rel:"noreferrer", className:"mt-2 flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold hover:bg-white/15"}, "↗ Admin antigo"),
        e("p",{className:(permitidas ? "mt-auto " : "mt-2 ")+"px-2.5 text-xs text-muted-foreground"},"Acesso de "+nomeDe(s.usuario)+" · "+PAPEL_LB[papel]))),
    menu && e("div",{className:"fixed inset-0 z-30 bg-black/60 md:hidden", onClick:function(){setMenu(false);}}),
    !recolhido && e("div",{onMouseDown:arrastarMenu, title:"Arraste para aumentar ou diminuir o menu", "aria-label":"Mudar a largura do menu",
      className:"group fixed inset-y-0 z-50 hidden w-2 cursor-col-resize md:block", style:{left:menuW-4}},
      e("div",{className:"mx-auto h-full w-0.5 transition-colors "+(arrastando ? "bg-primary" : "group-hover:bg-primary/70")})),
    e("div",{className:(arrastando ? "" : "transition-[margin] duration-200 ")+(recolhido ? "md:ml-0" : "md:ml-[var(--mw)]"), style:{"--mw":menuW+"px"}},
      e("header",{className:"sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6"},
        e("button",{className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50 "+(recolhido ? "" : "md:hidden"), "aria-label":"Menu", title:recolhido ? "Abrir o menu" : "Menu", onClick:function(){ if(recolhido) alternarMenu(false); else setMenu(!menu); }}, e(Icon,{n:"menu"})),
        window.history.state && window.history.state.idx>0 && e("button",{type:"button", title:"Voltar para a tela anterior", "aria-label":"Voltar para a tela anterior", onClick:function(){ navigate(-1); }, className:"flex h-9 shrink-0 items-center gap-1 rounded-lg bg-white/10 px-3 text-[12.5px] font-bold hover:bg-white/20"}, e(Icon,{n:"chevron", s:14, className:"rotate-180"}), "Voltar"),
        setorAtual && !navPerg ? e("div",{className:"min-w-0 flex-1"}, e(BarraCascata,{menu:setorAtual.st.menu || menuAuto(setorAtual.st), cor:setorAtual.st.cor, pode:podeMenu, ativo:ativoMenu, abrir:abrirMenu})) : e("span",{className:"flex min-w-0 flex-1 items-center gap-2.5 text-sm whitespace-nowrap"}, navPerg && tileSetor(setorAtual.st, true), e("span",{className:"truncate"}, titulo)),
        e("span",{className:"hidden whitespace-nowrap text-sm text-muted-foreground "+(colAr ? "min-[2200px]:inline" : "min-[1800px]:inline")}, new Date().toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"})),
        e("div",{className:"flex shrink-0 items-center gap-1.5"}, APPS_TOPO.filter(function(x){ return !!permitidas && permitidas.indexOf(x[0])>=0; }).map(function(x){ var on = aba===x[0];
          return e("button",{key:x[0], title:x[1], onClick:function(){ navigate(caminhoDaAba(x[0])); setColArea(null); },
            className:"flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[12.5px] font-bold transition-transform hover:-translate-y-px", style: on ? {background:x[3], color:"#fff", boxShadow:"0 2px 10px "+x[3]+"66"} : {background:x[3]+"26", color:x[3], boxShadow:"inset 0 0 0 1px "+x[3]+"55"}},
            e(Icon,{n:x[2], s:15, peso:"fill"}), x[1]); })),

        e(IrPara,{navigate:navigate}),
        e(BotaoNotificacoes),
        e(SeletorAcesso),
        e("button",{className:"grid size-9 place-items-center rounded-lg "+(chatBotao ? "bg-[#E8B84B]/25 ring-1 ring-[#E8B84B]" : "hover:bg-muted/50"), "aria-label":chatBotao ? "Esconder o botão do SorellyChat" : "Mostrar o botão do SorellyChat", title:chatBotao ? "Esconder o botão do SorellyChat" : "Mostrar o botão do SorellyChat", onClick:alternaChatBotao}, e(LogoChat,{s:22})),
        e("button",{className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50", "aria-label":"Alternar tema", onClick:toggleTema}, e(Icon,{n:"sunmoon"}))),
      navPerg && e(MenuSetor,{menu:setorAtual.st.menu, semAbas:!!setorAtual.st.semAbas, setor:setorAtual.st.nome.replace("\n"," "), cor:setorAtual.st.cor, pode:podeMenu, ativo:ativoMenu, abrir:abrirMenu}),
      setorAtual && !navPerg && (APPS_SETOR[setorAtual.st.id]||[]).length>0 && e("div",{className:"z-20 flex gap-x-3 gap-y-1.5 border-b border-border bg-background/95 px-3 backdrop-blur md:px-5 "+"sticky top-12 items-center py-1.5"},
        false && botoesAgrupados(setorAtual.st.areas, function(ar, i){ var ativa = ar===setorAtual.ar || ar.nome===setorAtual.ar.nome, unica = ar.telas.length===1 ? ar.telas[0] : null, cc = ar.cor || COR_AREA[ar.nome] || setorAtual.st.cor;
          return e("button",{key:i, onClick:function(ev){ if(unica){ abrirTela(unica); setAreaTopo(null); return; } var r = ev.currentTarget.getBoundingClientRect(); setAreaTopo(areaTopo && areaTopo.i===i ? null : {i:i, x:r.left, y:r.bottom+4}); },
            style:{background:"linear-gradient(135deg,"+cc+(ativa ? "66" : "33")+","+cc+(ativa ? "26" : "0d")+")", boxShadow:"inset 0 0 0 1px "+cc+(ativa ? "bb" : "55")},
            className:(ar.grupo ? "flex h-9 shrink-0 items-center justify-center gap-1 whitespace-pre-line rounded-md px-2.5 text-center text-[11.5px] leading-[1.15] " : "flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-[13.5px] ")+"leading-tight transition hover:brightness-125 "+(ativa ? "font-bold text-white" : "text-foreground/90")},
            ar.grupo ? ar.nome : ar.nome.replace(/\n/g," "), !unica && e(Icon,{n:"chevrondown", s:11, className:"opacity-60"})); }, setorAtual.st.cor),
        (APPS_SETOR[setorAtual.st.id]||[]).map(function(k){ var ap = APPS_TOPO.find(function(x){ return x[0]===k; }); if(!ap) return null;
          return e("button",{key:k, onClick:function(){ navigate(caminhoDaAba(k)); }, title:ap[1], className:"flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11.5px] font-bold", style:{background:ap[3]+"26", color:ap[3], boxShadow:"inset 0 0 0 1px "+ap[3]+"55"}}, e(Icon,{n:ap[2], s:12, peso:"fill"}), ap[1]); }),
        null),   // o total de revendedoras fica só na Visão geral e na Base de revendedoras (Cadastro); saiu da barra de cima a pedido do Marcus (19/10/2026)
      setorAtual && areaTopo && (function(){ var ar = setorAtual.st.areas[areaTopo.i]; if(!ar) return null;
        var itens = ar.grupos && ar.grupos.length>1 ? [].concat.apply([], ar.grupos.map(function(g){ return [{titulo:g.titulo}].concat(g.telas.map(function(t){ return {t:t}; })); })) : ar.telas.map(function(t){ return {t:t}; });
        return e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAreaTopo(null); }},
          e("div",{className:"absolute max-h-[70vh] w-80 overflow-y-auto rounded-2xl border bg-card p-2 shadow-2xl", style:{left:Math.min(areaTopo.x, window.innerWidth-340), top:areaTopo.y, borderColor:setorAtual.st.cor+"66", boxShadow:"0 18px 40px -12px rgba(0,0,0,.6), 0 0 0 1px "+setorAtual.st.cor+"22"}, onClick:function(ev){ ev.stopPropagation(); }},
            e("p",{className:"mb-1 flex items-center gap-2 border-b border-border px-2.5 pb-2 pt-1 text-[11px] font-extrabold uppercase tracking-[.14em]", style:{color:setorAtual.st.cor}}, e("span",{className:"size-2 rounded-full", style:{background:setorAtual.st.cor}}), ar.nome.replace(/\n/g," ")),
            itens.map(function(x, k){ if(x.titulo) return e("p",{key:"g"+k, className:"px-2.5 pb-0.5 pt-2 text-[10.5px] font-bold uppercase tracking-wider", style:{color:setorAtual.st.cor}}, x.titulo.replace(/\n/g," "));
              var t = x.t, on = ativaTela(t);
              return e("button",{key:t.nome+k, onClick:function(){ abrirTela(t); setAreaTopo(null); }, className:"flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2.5 py-1 text-left text-[13px] leading-tight "+(t.breve ? "opacity-55 " : "")+(on ? "bg-primary/15 font-semibold text-primary" : "hover:bg-white/5")},
                t.ic ? e("span",{className:"grid size-6 shrink-0 place-items-center rounded-md", style:{background:t.icCor+"26", color:t.icCor, boxShadow:"inset 0 0 0 1px "+t.icCor+"55"}}, e(Icon,{n:t.ic, s:13, peso:"fill"})) : e(MarcaTela,{t:t}), e("span",{className:"min-w-0 flex-1"}, t.nome.replace(/\n/g," "))); }))); })(),
      e("main",{className:"flex flex-col gap-5 p-4 md:p-6"}, e(Outlet))),
    e(Aviso), e(BuscaTela),
    chatBotao && aba!=="whats" && aba!=="apps" && e(ChatMini,{eu:euChat, direcao:ehDirecao(s.usuario), abrirCompleto:function(){ navigate(caminhoDaAba("whats")); setColArea(null); }}),
    e(ChatGlobal,{eu:euChat, abrir:function(){ if(aba!=="whats") efem({mini:true}); }}),
    // o aviso "pagamento para conferir" (components/aviso-pagamentos.js) está desligado a pedido do Marcus (14/10/2026); religar quando o assunto voltar
    e(AvisoAlertas,{abrirAtendimento:function(id){ d({type:"INT_SEL", id:id}); navigate(caminhoDaAba("intcalc")); setColArea(null); }, abrirTela:function(aba){ navigate(caminhoDaAba(aba)); setColArea(null); }}));
}

export default App;
