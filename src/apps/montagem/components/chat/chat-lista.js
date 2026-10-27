// Sorelly Admin · montagem — components/chat/chat-lista.js
// Lista de conversas (estilo WhatsApp): faixa dourada "SorellyChat" com menu, perfil, busca global em conversas e mensagens, filtros, fixadas e não lidas.
// A Direção ainda pode ver o WhatsApp de qualquer funcionário (só leitura) e todas as conversas da empresa.
import { api, efem, estaOcupado, motivoOcupado, fotoDe, useChat, textoPrevia } from "@/apps/montagem/domain/chat-store";
import { CONTATOS, contato, sem } from "@/apps/montagem/domain/chat-contatos";
import { NovoGrupo, FotoEditavel } from "@/apps/montagem/components/chat/chat-info";
import { SeletorFundo } from "@/apps/montagem/components/chat/chat-fundos";
import { Avatar, EtiquetaEspera, LogoChat, Ph, Tique, W, Janela, Popover, ItemMenu, Vazio, horaLista } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

// dourado mais refinado, com degradê (marca "SorellyChat")
var OURO = "linear-gradient(135deg, #6b4f12 0%, #b8892b 28%, #f6dc8c 52%, #d4a63a 74%, #8a6420 100%)";
var OURO_TXT = "#24180a";

function Perfil(p){
  var ocupado = estaOcupado(p.eu), fd = useState(false), fundos = fd[0], setFundos = fd[1];
  if(fundos) return e(Janela,{titulo:"Fundo das conversas", fechar:p.fechar, largura:480}, e("div",{className:"p-4"}, e(SeletorFundo,{eu:p.eu})));
  return e(Popover,{className:"left-0 top-14", fechar:p.fechar, largura:250},
    e("div",{className:"flex items-center gap-3 px-4 pb-2 pt-1"}, e(FotoEditavel,{pode:true, fotoAtual:fotoDe(p.eu), titulo:"Minha foto", aoSalvar:function(u){ api.setFoto(p.eu, u); }, aoRemover:function(){ api.setFoto(p.eu, null); }, trigger:function(abrir){ return e("button",{onClick:abrir, "aria-label":"Ver ou trocar minha foto", className:"relative"}, e(Avatar,{id:p.eu, s:56}), e("span",{className:"absolute -bottom-0.5 -right-0.5 grid size-6 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"camera", s:13, fill:true, style:{color:"#fff"}}))); }}),
      e("div",{className:"min-w-0"}, e("p",{className:"truncate text-[14px] font-semibold"}, contato(p.eu).nome), e("p",{className:"truncate text-[11px]", style:{color:W.sec}}, contato(p.eu).setorCurto))),
    e(ItemMenu,{n:"image", onClick:function(){ setFundos(true); }}, "Fundo das conversas"),
    e(ItemMenu,{n:ocupado ? "check-circle" : "minus-circle", onClick:function(){ api.setBusy(p.eu, !ocupado); p.fechar(); }}, ocupado ? "Voltar a ficar disponível" : "Ficar ocupado (pausa o relógio)"),
    e("p",{className:"px-4 pt-1 text-[10.5px]", style:{color:W.sec}}, ocupado ? "Ocupado: o tempo de resposta não conta." : "Disponível."));
}

// Direção: escolher de quem ver o SorellyChat, numa lista pequena logo abaixo da faixa. Primeiro os setores; clicando no setor, as pessoas dele
function VerComo(p){
  var stC = useChat(), bq = useState(""), busca = bq[0], setBusca = bq[1], sc = useState(null), setor = sc[0], setSetor = sc[1], q = sem(busca);
  var todos = CONTATOS.filter(function(c){ return c.id!==p.euReal && (!p.nova || stC.config.representantes || c.tipo!=="rep"); });
  var nomeSetor = function(c){ return c.tipo==="rep" ? "Representantes" : (c.setorCurto || c.setor || "Outros"); };
  var grupos = {}, ordem = []; todos.forEach(function(c){ var k = nomeSetor(c); if(!grupos[k]){ grupos[k] = []; ordem.push(k); } grupos[k].push(c); });
  ordem.sort(function(x, y){ return (x==="Representantes")-(y==="Representantes") || x.localeCompare(y); });
  var ir = function(cid, todas){ if(p.nova){ p.aoPessoa(cid); return; } efem({verComo:cid, verTodas:!!todas, conversaSel:null}); p.fechar(); };
  var pessoas = q ? todos.filter(function(c){ return sem(c.completo).indexOf(q)>=0 || sem(c.setorCurto).indexOf(q)>=0; }) : setor ? grupos[setor] : null;
  var linha = "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] hover:bg-white/10";
  return e(Popover,{className:p.className, fechar:p.fechar, largura:p.largura},
    e("div",{className:"max-h-[58vh] overflow-y-auto"},
      e("div",{className:"px-2 pb-1"}, e("input",{autoFocus:true, value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar pessoa ou setor", "aria-label":"Buscar", className:"h-8 w-full rounded-lg px-3 text-[12px] outline-none", style:{background:W.campo, color:W.texto}})),
      !pessoas && p.nova && e("button",{onClick:p.aoGrupo, className:linha}, e("span",{className:"grid size-[26px] place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"users-three", s:15, fill:true, style:{color:"#fff"}})), e("span",{className:"font-medium"}, "Novo grupo")),
      !pessoas && !p.nova && e("button",{onClick:function(){ ir(null, false); }, className:linha}, e(Avatar,{id:p.euReal, s:26}), e("span",{className:"font-medium"}, "O meu SorellyChat")),
      !pessoas && !p.nova && e("button",{onClick:function(){ ir(null, true); }, className:linha}, e("span",{className:"grid size-[26px] place-items-center rounded-full", style:{background:OURO}}, e(Ph,{n:"eye", s:15, fill:true, style:{color:OURO_TXT}})), e("span",{className:"font-medium"}, "Todas as conversas")),
      !pessoas && e("p",{className:"px-3 pb-0.5 pt-1.5 text-[9.5px] font-extrabold uppercase tracking-wide", style:{color:W.ouro}}, "Setores"),
      !pessoas && ordem.map(function(k){ return e("button",{key:k, onClick:function(){ setSetor(k); }, className:linha},
        e(Ph,{n:k==="Representantes" ? "users-three" : "users", s:17, fill:true, style:{color:W.ouro}}), e("span",{className:"min-w-0 flex-1 truncate font-medium"}, k), e("span",{className:"text-[10.5px]", style:{color:W.sec}}, grupos[k].length), e(Ph,{n:"caret-right", s:13, style:{color:W.sec}})); }),
      pessoas && !q && e("button",{onClick:function(){ setSetor(null); }, className:linha+" font-semibold", style:{color:W.ouro}}, e(Ph,{n:"arrow-left", s:14}), setor),
      pessoas && pessoas.map(function(c){ return e("button",{key:c.id, onClick:function(){ ir(c.id, false); }, className:linha}, e(Avatar,{id:c.id, s:26, presenca:true}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate"}, c.nome), q && e("span",{className:"block truncate text-[10px]", style:{color:W.sec}}, c.setorCurto))); })));
}

// Topo: faixa dourada com o nome grande + faixa dourada de baixo com "Ver como" (Direção) e "Opções" lado a lado, cada um abrindo uma lista pequena
var CURTO = {setores:"Setores", tempo:"Tempo", fotos:"Fotos", config:"Configurações", configurador:"Configurador"};
function BarraChat(p){
  var ab = useState(null), aberto = ab[0], setAberto = ab[1], pg = p.paginas, eu = p.eu, stB = useChat();
  var mostrarTodas = !!(p.direcao && !p.leitura && stB.efem.verTodas);
  var opcoes = pg ? pg.abas.filter(function(a){ return a[0]!=="conversas"; }) : [];
  var fechar = function(){ setAberto(null); };
  var celula = function(id, ic, txt, on, onClick){ return e("button",{onClick:onClick, className:"flex h-10 flex-1 items-center justify-center gap-2 text-[12px] font-bold", style:{background:on ? "rgba(36,24,10,.92)" : "transparent", color:on ? "#f6dc8c" : OURO_TXT}}, e(Ph,{n:ic, s:20, fill:true}), txt, e(Ph,{n:"caret-down", s:12, fill:true})); };
  var cels = [];
  if(p.direcao) cels.push(celula("ver", "eye", p.leitura ? "Vendo "+contato(eu).nome.split(" ")[0] : mostrarTodas ? "Vendo todas" : "Ver como", aberto==="ver" || p.leitura || mostrarTodas, function(){ setAberto(aberto==="ver" ? null : "ver"); }));
  if(opcoes.length>0) cels.push(celula("op", "gear-six", "Opções", aberto==="op" || opcoes.some(function(a){ return pg.aba===a[0]; }), function(){ setAberto(aberto==="op" ? null : "op"); }));
  var comSep = []; cels.forEach(function(c, i){ if(i) comSep.push(e("span",{key:"s"+i, className:"my-2 w-px shrink-0", style:{background:"rgba(36,24,10,.35)"}})); comSep.push(e("div",{key:"c"+i, className:"flex flex-1"}, c)); });
  return e("div",{className:"relative shrink-0"},
    e("div",{className:"flex items-center gap-2.5 px-3 py-2", style:{background:OURO, color:OURO_TXT}},
      p.aoVoltarApp && e("button",{onClick:p.aoVoltarApp, "aria-label":"Voltar ao início do app", className:"grid size-7 shrink-0 place-items-center rounded-full hover:bg-black/10"}, e(Ph,{n:"arrow-left", s:17})),
      e("span",{className:"grid size-7 shrink-0 place-items-center rounded-xl", style:{background:"rgba(36,24,10,.94)", boxShadow:"0 2px 8px rgba(0,0,0,.3)"}}, e(LogoChat,{s:20})),
      e("h2",{className:"min-w-0 flex-1 truncate font-extrabold tracking-tight text-[15px]"}, "SorellyChat"),
      p.ajuda && e("div",{className:"relative"}, e("button",{onClick:function(){ setAberto(aberto==="ajuda" ? null : "ajuda"); }, "aria-label":"Ajuda: falar com a Sorelly", title:"Ajuda: falar com a Sorelly", className:"flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-bold", style:{background:"rgba(36,24,10,.92)", color:"#f6dc8c"}}, e(Ph,{n:"lifebuoy", s:18, fill:true}), "Ajuda"),
        aberto==="ajuda" && e(Popover,{className:"right-0 top-11", fechar:fechar, largura:250}, p.ajuda.canais.map(function(c){ return e(ItemMenu,{key:c.id, n:c.ic, onClick:function(){ fechar(); p.ajuda.abrir(c.id); }}, c.nome); }))),
      !pg && e("button",{onClick:function(){ p.abrirCompleto && p.abrirCompleto(); }, "aria-label":"Abrir em tela cheia", title:"Tela cheia", className:"grid size-9 place-items-center rounded-full hover:bg-black/10"}, e(Ph,{n:"arrows-out-simple", s:20, fill:true}))),
    comSep.length>0 && e("div",{className:"flex", style:{background:OURO, color:OURO_TXT, borderTop:"1px solid rgba(36,24,10,.35)", boxShadow:"inset 0 -1px 0 rgba(0,0,0,.25)"}}, comSep),
    aberto==="ver" && e(VerComo,{euReal:p.euReal, className:"left-2 top-[7.1rem]", largura:300, fechar:fechar}),
    aberto==="op" && e(Popover,{className:"right-2 top-[7.1rem]", fechar:fechar, largura:230},
      opcoes.map(function(a){ return e(ItemMenu,{key:a[0], n:a[2], onClick:function(){ fechar(); pg.mudar(a[0]); }}, CURTO[a[0]] || a[1], pg.aba===a[0] && e(Ph,{n:"check", s:15, className:"ml-auto", style:{color:W.verde}})); })));
}

// pede como foi resolvido e dá o OK na conversa (para depois poder arquivar)
function ResolverConversa(p){
  var nt = useState(""), nota = nt[0], setNota = nt[1], er = useState(false), erro = er[0], setErro = er[1];
  var ok = function(){ if(nota.trim().length<5){ setErro(true); return; } api.resolveConv(p.id, p.eu, nota.trim()); p.fechar(); };
  return e(Janela,{titulo:"Marcar como resolvida", fechar:p.fechar, largura:420},
    e("div",{className:"flex flex-col gap-3 p-4"},
      e("p",{className:"text-[12.5px]", style:{color:W.sec}}, "Diga em poucas palavras como foi resolvido. Fica registrado na conversa."),
      e("input",{autoFocus:true, value:nota, onChange:function(ev){ setNota(ev.target.value); setErro(false); }, onKeyDown:function(ev){ if(ev.key==="Enter") ok(); }, placeholder:"Como foi resolvido?", "aria-label":"Como foi resolvido", className:"h-10 rounded-lg px-3 text-[13px] outline-none", style:{background:W.campo, color:W.texto, border:erro ? "1px solid "+W.vermelho : "1px solid transparent"}}),
      erro && e("span",{className:"text-[11.5px]", style:{color:W.vermelho}}, "Escreva em poucas palavras como resolveu."),
      e("button",{onClick:ok, className:"self-end rounded-full px-5 py-2 text-[13px] font-bold", style:{background:W.verde, color:"#0b141a"}}, "Dar OK")));
}

function ListaConversas(p){
  var st = useChat(), eu = p.eu, bq = useState(""), busca = bq[0], setBusca = bq[1], ft = useState("todas"), filtro = ft[0], setFiltro = ft[1];
  var nv = useState(false), nova = nv[0], setNova = nv[1], pf = useState(false), perfil = pf[0], setPerfil = pf[1];
  var vc = useState(false), escolhendo = vc[0], setEscolhendo = vc[1], cm = useState(null), ctx = cm[0], setCtx = cm[1], gn = useState(false), grupoNovo = gn[0], setGrupoNovo = gn[1], rs = useState(null), resolvendo = rs[0], setResolvendo = rs[1];   // false, "func" ou "rep"
  var mo = useState(false), mais = mo[0], setMais = mo[1];   // "⋯" com Decidir/Espera/Marcado/Arquivadas/Grupos (saíram da fileira de filtros, 27/10/2026)
  var lm = useState(40), limite = lm[0], setLimite = lm[1];
  var q = sem(busca), mostrarTodas = !!p.direcao && !p.leitura && !!st.efem.verTodas, euReal = p.euReal || eu;
  var todasL = api.getConversations(eu, {todas:mostrarTodas});
  var arqs = todasL.filter(function(x){ return x.arq && !x.pendentes; }), lista = todasL.filter(function(x){ return !(x.arq && !x.pendentes); });
  var naoLidasTotal = lista.reduce(function(t,x){ return t + x.naoLidas; }, 0);
  var urgentesTotal = lista.reduce(function(t,x){ return t + x.pendentes; }, 0);
  // acompanhamento: conversas em que eu sou quem deve responder, e há quanto tempo esperam
  var od = useState("recentes"), ordem = od[0], setOrdem = od[1];
  var thDe = {}; lista.forEach(function(x){ thDe[x.conv.id] = api.statusConv(x.conv.id); });
  var devo = function(x){ var t = thDe[x.conv.id]; return !!t && t.estado==="aberta" && t.resp.indexOf(eu)>=0; };
  var aguardando = lista.filter(devo).length;
  var marcadoTotal = lista.filter(function(x){ return x.marcado; }).length;
  var filtrada = (filtro==="arq" ? arqs : lista).filter(function(x){ return filtro==="arq" ? true : filtro==="marcado" ? x.marcado : filtro==="espera" ? devo(x) : filtro==="naolidas" ? x.naoLidas>0 : filtro==="grupos" ? x.conv.tipo==="grupo" : filtro==="decidir" ? x.pendentes>0 : true; });
  if(ordem==="antigas") filtrada = filtrada.slice().sort(function(a, b){ var ma = devo(a), mb = devo(b); if(ma!==mb) return ma ? -1 : 1; var ta = ma ? thDe[a.conv.id].desde : (a.ultima ? a.ultima.t : 0), tb = mb ? thDe[b.conv.id].desde : (b.ultima ? b.ultima.t : 0); return ta-tb; });
  var porNome = q ? lista.filter(function(x){ return sem(x.titulo).indexOf(q)>=0; }) : [];
  var porTexto = [];
  if(q.length>=2){ lista.forEach(function(x){ api.getMessages(x.conv.id, eu).forEach(function(m){ if(m.apag!=="todos" && m.texto && sem(m.texto).indexOf(q)>=0) porTexto.push({x:x, m:m}); }); });
    porTexto.sort(function(a,b){ return b.m.t-a.m.t; }); porTexto = porTexto.slice(0,40); }
  var abrir = function(id, msgId){ efem({conversaSel:id, irPara:msgId||null}); setBusca(""); p.aoAbrir && p.aoAbrir(id); };
  var linha = function(x){
    var u = x.ultima, ativa = st.efem.conversaSel===x.conv.id, minha = u && u.de===eu, outro = x.conv.tipo==="dm" ? (x.conv.membros.find(function(i){ return i!==eu; }) || x.conv.membros[0]) : x.conv.tipo==="setor" ? x.conv.repId : null;
    var dig = (st.efem.digitando[x.conv.id]||[]).filter(function(i){ return i!==eu; });
    return e("button",{key:x.conv.id, onClick:function(){ abrir(x.conv.id); }, onContextMenu:function(ev){ if(p.leitura) return; ev.preventDefault(); setCtx({px:ev.clientX, py:ev.clientY, it:x}); }, className:"flex w-full items-center gap-2.5 px-3 py-2 text-left", style:{background:x.pendentes ? (W.painel==="#FFFFFF" ? (ativa ? "#FFE9B8" : "#FFF4DC") : (ativa ? "#3d2d0f" : "#2a2010")) : ativa ? W.sel : "transparent", borderBottom:"1px solid "+W.borda, boxShadow:x.pendentes ? "inset 4px 0 0 #f59e0b" : "none"}},
      x.conv.tipo==="grupo" ? e(Avatar,{grupo:true, nome:x.conv.nome, foto:x.conv.foto, s:44}) : e(Avatar,{id:outro, s:44, presenca:true}),
      e("span",{className:"min-w-0 flex-1"},
        e("span",{className:"flex items-baseline gap-2"}, e("span",{className:"min-w-0 flex-1 truncate text-[13px] font-semibold"}, x.titulo, x.conv.tipo==="setor" && !x.conv.atendente && e("span",{className:"ml-1.5 rounded px-1 text-[9px] font-semibold", style:{background:"#4a3410", color:"#f5c542"}}, "na fila"), mostrarTodas && !x.membro && e("span",{className:"ml-1.5 rounded px-1 text-[9px] font-normal", style:{background:"#3a2f12", color:W.ouro}}, "só leitura")),
          u && e("span",{className:"shrink-0 text-[10.5px]", style:{color:x.naoLidas ? W.verde : W.sec}}, horaLista(u.t))),
        e("span",{className:"mt-0.5 flex items-start gap-1"},
          dig.length ? e("span",{className:"min-w-0 flex-1 truncate text-[12px]", style:{color:W.verde}}, "digitando…") :
          e("span",{className:"flex min-w-0 flex-1 items-start gap-1 text-[11.5px] leading-snug", style:{color:W.sec}},
            minha && u.apag!=="todos" && e("span",{className:"mt-0.5"}, e(Tique,{status:u.status})),
            e("span",{className:"line-clamp-2 break-words"}, u ? ((x.conv.tipo!=="dm" && u.de!==eu && u.tipo!=="sistema" ? contato(u.de).nome.split(" ")[0]+": " : "")+textoPrevia(u)) : "Conversa nova")),
          x.fixa && e(Ph,{n:"push-pin", s:15, fill:true, style:{color:W.sec}}),
          x.marcado && e("span",{className:"grid size-5 place-items-center rounded-full text-[10px] font-bold text-white", style:{background:W.verde}, title:"Marcou você"}, "@"),
          devo(x) && e(EtiquetaEspera,{t:thDe[x.conv.id]}),
          x.pendentes>0 && e("span",{className:"flex items-center gap-1 rounded-full px-2 text-[10.5px] font-extrabold", style:{background:"#f59e0b", color:"#24180a", height:20}, title:"Aguardando a sua decisão"}, e(Ph,{n:"clock-countdown", s:12, fill:true}), x.pendentes),
          x.naoLidas>0 && e("span",{className:"grid min-w-5 place-items-center rounded-full px-1.5 text-[10px] font-bold", style:{background:W.verde, color:"#0b141a", height:20}}, x.naoLidas))));
  };
  var rolou = function(ev){ var a = ev.target; if(a.scrollHeight-a.scrollTop-a.clientHeight<120 && limite<filtrada.length) setLimite(limite+40); };
  var pg = p.paginas;
  var atalho = function(ic, txt, onClick, on, escuro, soIcone){ return e("button",{key:txt, onClick:onClick, title:txt, "aria-label":txt, className:"flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full text-[10.5px] font-bold "+(soIcone ? "w-7 justify-center" : "px-2.5"), style:{background:on ? OURO : escuro ? "#24180a" : W.campo, color:on ? OURO_TXT : escuro ? "#f6dc8c" : W.texto}}, e(Ph,{n:ic, s:16, fill:true}), !soIcone && txt); };
  var divisor = e("span",{key:"div", className:"mx-0.5 h-5 w-px shrink-0", style:{background:W.borda}});
  return e("div",{className:"flex h-full min-h-0 flex-col", style:{background:W.painel, color:W.texto}},
    !p.semBarra && e(BarraChat,{eu:eu, euReal:euReal, leitura:p.leitura, direcao:p.direcao, paginas:p.paginas, aoVoltarApp:p.aoVoltarApp, abrirCompleto:p.abrirCompleto, compacto:p.compacto, ajuda:p.ajuda, arqOn:filtro==="arq", arqN:arqs.length, aoArquivadas:function(){ setFiltro(filtro==="arq" ? "todas" : "arq"); setLimite(40); }}),
    // status de quem está usando (bolinha + nome, sem foto), Almoço (volta sozinho em 1h) e nova conversa — mais limpo, sem o "Conversas" grande (Marcus, 27/10/2026)
    e("div",{className:"relative flex shrink-0 items-center gap-2 px-3 py-1.5", style:{background:W.painel}},
      e("button",{onClick:function(){ if(!p.leitura){ setPerfil(!perfil); } }, "aria-label":p.leitura ? "Situação" : "Meu perfil", title:contato(eu).nome+" · "+(mostrarTodas ? "Todas as conversas da empresa" : contato(eu).setorCurto), className:"flex min-w-0 items-center gap-1.5"},
        e("span",{className:"size-2 shrink-0 rounded-full", style:{background:motivoOcupado(eu)==="almoco" ? "#f5c542" : estaOcupado(eu) ? "#f59e0b" : W.verde}}),
        e("span",{className:"min-w-0 truncate text-[12.5px] font-semibold"}, contato(eu).nome.split(" ")[0])),
      perfil && e(Perfil,{eu:eu, fechar:function(){ setPerfil(false); }}),
      e("div",{className:"ml-auto flex shrink-0 items-center gap-1.5"},
        p.leitura && e("button",{onClick:function(){ efem({verComo:null, conversaSel:null}); }, className:"rounded-full px-3 py-1 text-[11px] font-semibold", style:{background:OURO, color:OURO_TXT}}, "Voltar ao meu"),
        !p.leitura && e("button",{onClick:function(){ api.setBusy(eu, motivoOcupado(eu)!=="almoco", "almoco"); }, className:"flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", style:{background:motivoOcupado(eu)==="almoco" ? "rgba(245,197,66,.2)" : W.campo, color:motivoOcupado(eu)==="almoco" ? "#f5c542" : W.texto}}, e(Ph,{n:"fork-knife", s:13, fill:true}), motivoOcupado(eu)==="almoco" ? "Em almoço" : "Almoço"),
        e("button",{onClick:function(){ setMais(!mais); }, "aria-label":"Mais opções", title:"Decidir, espera, marcadas, arquivadas e grupos", className:"grid size-7 place-items-center rounded-full", style:{background:W.campo}}, e(Ph,{n:"dots-three-vertical", s:15, fill:true, style:{color:W.texto}})),
        e("button",{onClick:function(){ setNova(true); }, "aria-label":"Nova conversa", title:"Nova conversa", disabled:!!p.leitura, className:"grid size-7 place-items-center rounded-full disabled:opacity-30", style:{background:W.texto}}, e(Ph,{n:"plus", s:15, fill:true, style:{color:W.painel}}))),
      mais && e(Popover,{className:"right-2 top-10", fechar:function(){ setMais(false); }, largura:220},
        [["todas","Todas","stack",0],["decidir","Decidir","clock-countdown",urgentesTotal],["espera","Espera","hourglass-medium",aguardando],["marcado","Marcado","at",marcadoTotal],["arq","Arquivadas","archive-box",arqs.length],["grupos","Grupos","users-three",0]].map(function(f){
          return e(ItemMenu,{key:f[0], n:f[2], onClick:function(){ setFiltro(f[0]); setLimite(40); setMais(false); }}, f[1], f[3]>0 && e("span",{className:"ml-auto text-[11px]", style:{color:W.sec}}, f[3])); })),
      // "+" nova conversa: o painel abre colado no botão, dentro da MESMA faixa (antes abria solto lá embaixo da lista e bugava) — Marcus, 27/10/2026
      nova && e(VerComo,{nova:true, euReal:eu, className:"right-2 top-10", largura:280, fechar:function(){ setNova(false); }, aoPessoa:function(cid){ setNova(false); abrir(api.openDm(eu, cid)); }, aoGrupo:function(){ setNova(false); setGrupoNovo(true); }})),
    filtro!=="todas" && e("div",{className:"flex shrink-0 items-center justify-between gap-2 px-3 py-1 text-[11px]", style:{background:"#3a2f12", color:W.ouro}},
      "Filtro: "+({decidir:"Decidir", espera:"Espera", marcado:"Marcado", arq:"Arquivadas", grupos:"Grupos"}[filtro]||filtro),
      e("button",{onClick:function(){ setFiltro("todas"); }, "aria-label":"Tirar o filtro"}, e(Ph,{n:"x", s:14}))),
    p.leitura && e("div",{className:"flex shrink-0 items-center gap-2 px-3 py-1.5 text-[11px]", style:{background:"#3a2f12", color:W.ouro}}, e(Ph,{n:"eye", s:15, fill:true}), "Você está vendo o SorellyChat de "+contato(eu).nome+" (leitura; nas conversas das representantes com as revendedoras você pode responder)"),
    mostrarTodas && e("div",{className:"flex shrink-0 items-center gap-2 px-3 py-1.5 text-[11px]", style:{background:"#3a2f12", color:W.ouro}}, e(Ph,{n:"eye", s:15, fill:true}), "Todas as conversas da empresa (somente leitura)"),
    e("div",{className:"shrink-0 px-3 pb-2 pt-1"},
      e("div",{className:"flex h-8 items-center gap-2 rounded-lg px-3", style:{background:W.campo}}, e(Ph,{n:"magnifying-glass", s:15, style:{color:W.sec}}),
        e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Pesquisar", "aria-label":"Pesquisar", className:"min-w-0 flex-1 bg-transparent text-[12.5px] outline-none", style:{color:W.texto}}),
        busca && e("button",{onClick:function(){ setBusca(""); }, "aria-label":"Limpar busca"}, e(Ph,{n:"x", s:14, style:{color:W.sec}})))),
    filtro==="arq" && !q && e("p",{className:"shrink-0 px-4 pb-1 text-[11px] font-semibold", style:{color:W.ouro}}, "Conversas arquivadas. Abra uma e use \"Tirar das arquivadas\" nos dados dela."),
    e("div",{className:"min-h-0 flex-1 overflow-y-auto", onScroll:rolou},
      q ? e("div",null,
        porNome.length>0 && e("p",{className:"px-4 pb-1 pt-3 text-[11.5px] font-semibold", style:{color:W.ouro}}, "Conversas"), porNome.map(linha),
        porTexto.length>0 && e("p",{className:"px-4 pb-1 pt-3 text-[11.5px] font-semibold", style:{color:W.ouro}}, "Mensagens"),
        porTexto.map(function(r){ return e("button",{key:r.m.id, onClick:function(){ abrir(r.x.conv.id, r.m.id); }, className:"flex w-full flex-col px-4 py-2 text-left hover:bg-white/5", style:{borderBottom:"1px solid "+W.borda}},
          e("span",{className:"flex items-baseline justify-between gap-2"}, e("span",{className:"truncate text-[13px]"}, r.x.titulo), e("span",{className:"shrink-0 text-[10.5px]", style:{color:W.sec}}, horaLista(r.m.t))),
          e("span",{className:"line-clamp-2 text-[12px]", style:{color:W.sec}}, (r.m.de===eu ? "Você: " : contato(r.m.de).nome.split(" ")[0]+": ")+r.m.texto)); }),
        !porNome.length && !porTexto.length && e(Vazio,{n:"magnifying-glass"}, q.length<2 ? "Digite pelo menos 2 letras." : "Nada encontrado para \""+busca+"\".")) :
      !filtrada.length ? e(Vazio,{n:filtro==="naolidas" ? "checks" : "chat-circle-dots"}, filtro==="marcado" ? "Ninguém marcou você sem resposta." : filtro==="arq" ? "Nenhuma conversa arquivada." : filtro==="naolidas" ? "Nenhuma mensagem não lida." : "Nenhuma conversa ainda. Toque no ícone de mensagem para começar.") :
      e("div",null, filtro==="todas" && arqs.length>0 && e("button",{onClick:function(){ setFiltro("arq"); setLimite(40); }, className:"flex w-full items-center gap-3 px-3 py-2 text-left", style:{borderBottom:"1px solid "+W.borda}}, e("span",{className:"grid size-6 place-items-center"}, e(Ph,{n:"archive-box", s:18, style:{color:W.sec}})), e("span",{className:"flex-1 text-[12.5px] font-medium", style:{color:W.sec}}, "Arquivadas"), e("span",{className:"text-[11px]", style:{color:W.sec}}, arqs.length)), filtrada.slice(0,limite).map(linha), limite<filtrada.length && e("p",{className:"py-3 text-center text-[11px]", style:{color:W.sec}}, "Role para ver mais…"))),
    ctx && (function(){
      var it = ctx.it, arq = !!it.arq, motivo = it.pendencia, soDec = /decis/.test(motivo || ""), id = it.conv.id;
      var fecha = function(){ setCtx(null); };
      return e("div",{className:"fixed inset-0 z-[80]", onClick:fecha, onContextMenu:function(ev){ ev.preventDefault(); fecha(); }},
        e("div",{className:"absolute w-64 overflow-hidden rounded-lg py-1.5 shadow-2xl", onClick:function(ev){ ev.stopPropagation(); }, style:{left:Math.max(8, Math.min(ctx.px, window.innerWidth-270)), top:Math.max(8, Math.min(ctx.py, window.innerHeight-260)), background:W.cab, border:"1px solid "+W.ouro, color:W.texto}},
          e("p",{className:"truncate px-4 pb-1 pt-0.5 text-[11px] font-bold", style:{color:W.ouro}}, it.titulo),
          e(ItemMenu,{n:"push-pin", onClick:function(){ fecha(); api.pin.conversa(eu, id); }}, it.fixa ? "Desafixar" : "Fixar no topo"),
          arq ? e(ItemMenu,{n:"archive-box", onClick:function(){ fecha(); api.arquivar(eu, id); }}, "Tirar das arquivadas")
            : e(ItemMenu,{n:"archive-box", desligado:!!motivo, onClick:function(){ fecha(); api.arquivar(eu, id); }}, "Arquivar conversa"),
          !arq && motivo && e("p",{className:"px-4 pb-1 text-[11px] leading-snug", style:{color:"#f59e0b"}}, "Não dá para arquivar: "+motivo+". Resolva primeiro."),
          motivo && !soDec && e(ItemMenu,{n:"check-circle", onClick:function(){ fecha(); setResolvendo(id); }}, "Marcar como resolvida"),
          !motivo && e(ItemMenu,{n:"hourglass", onClick:function(){ fecha(); api.markPending(id, eu); }}, "Marcar como pendente")));
    })(),
    resolvendo && e(ResolverConversa,{id:resolvendo, eu:eu, fechar:function(){ setResolvendo(null); }}),
    grupoNovo && e(NovoGrupo,{eu:eu, fechar:function(){ setGrupoNovo(false); }, aoCriar:function(id){ setGrupoNovo(false); abrir(id); }}),
    escolhendo && e(VerComo,{euReal:euReal, modo:escolhendo, fechar:function(){ setEscolhendo(false); }}));
}
export { BarraChat, ListaConversas, OURO, OURO_TXT };
