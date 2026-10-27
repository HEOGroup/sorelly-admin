// Sorelly Admin · montagem — components/chat/chat-info.js
// Dados da conversa (contato ou grupo: nome, foto, membros, administradores, sair) e janelas "Nova conversa" / "Novo grupo".
import { api, fotoDe, guardarMidia, lerMidia, horarioDe, online, useChat } from "@/apps/montagem/domain/chat-store";
import { CONTATOS, contato, sem } from "@/apps/montagem/domain/chat-contatos";
import { Avatar, Ph, W, Janela, Vazio } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useRef, useState } from "@/shared/react";

// editor de foto estilo WhatsApp: arrastar para posicionar, zoom, círculo no centro
var AREA = 280;
function EditorFoto(p){
  var ur = useState(null), url = ur[0], setUrl = ur[1], zm = useState(1), zoom = zm[0], setZoom = zm[1], of = useState({x:0, y:0}), off = of[0], setOff = of[1];
  var im = useRef(null), arr = useRef(null), er = useState(null), erro = er[0], setErro = er[1], dim = useState(null), d = dim[0], setD = dim[1];
  useEffect(function(){ var r = new FileReader(); r.onerror = function(){ setErro("Não consegui abrir essa foto."); };
    r.onload = function(){ var i = new Image(); i.onerror = function(){ setErro("Esse arquivo não é uma imagem válida."); }; i.onload = function(){ im.current = i; setD({w:i.width, h:i.height}); setUrl(r.result); }; i.src = r.result; };
    r.readAsDataURL(p.arquivo); }, []);
  var k = d ? AREA/Math.min(d.w, d.h)*zoom : 1;
  var limitar = function(o, kk){ if(!d) return o; var mx = Math.max(0, (d.w*kk-AREA)/2), my = Math.max(0, (d.h*kk-AREA)/2); return {x:Math.max(-mx, Math.min(mx, o.x)), y:Math.max(-my, Math.min(my, o.y))}; };
  var mudarZoom = function(z){ z = Math.max(1, Math.min(4, z)); setZoom(z); setOff(function(o){ return limitar(o, AREA/Math.min(d.w,d.h)*z); }); };
  var baixar = function(ev){ ev.preventDefault(); arr.current = {x:ev.clientX, y:ev.clientY, o:off}; ev.currentTarget.setPointerCapture(ev.pointerId); };
  var mover = function(ev){ var a = arr.current; if(!a) return; setOff(limitar({x:a.o.x+ev.clientX-a.x, y:a.o.y+ev.clientY-a.y}, k)); };
  var soltar = function(){ arr.current = null; };
  var salvar = function(){
    var S = 320, f = S/AREA, c = document.createElement("canvas"); c.width = S; c.height = S; var x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0,0,S,S); x.drawImage(im.current, (AREA/2+off.x-d.w*k/2)*f, (AREA/2+off.y-d.h*k/2)*f, d.w*k*f, d.h*k*f);
    p.aoSalvar(c.toDataURL("image/jpeg", 0.88)); p.fechar();
  };
  return e(Janela,{titulo:"Arraste para ajustar a foto", fechar:p.fechar, largura:380},
    erro ? e("p",{className:"p-6 text-center text-[13px]", style:{color:W.vermelho}}, erro) : !url ? e(Vazio,{n:"image"}, "Abrindo a foto…") :
    e("div",{className:"flex flex-col items-center gap-4 p-5"},
      e("div",{className:"relative cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing", style:{width:AREA, height:AREA, background:"#000"}, onPointerDown:baixar, onPointerMove:mover, onPointerUp:soltar, onPointerCancel:soltar,
        onWheel:function(ev){ mudarZoom(zoom - ev.deltaY*0.002); }},
        e("img",{src:url, alt:"", draggable:false, className:"pointer-events-none absolute max-w-none", style:{width:d.w*k, height:d.h*k, left:AREA/2+off.x-d.w*k/2, top:AREA/2+off.y-d.h*k/2}}),
        e("div",{className:"pointer-events-none absolute inset-0 rounded-full", style:{boxShadow:"0 0 0 400px rgba(11,20,26,.72)", border:"2px solid rgba(255,255,255,.85)"}})),
      e("div",{className:"flex w-full items-center gap-3"}, e(Ph,{n:"image", s:16, style:{color:W.sec}}),
        e("input",{type:"range", min:100, max:400, value:Math.round(zoom*100), "aria-label":"Zoom da foto", className:"flex-1 accent-[#00a884]", onChange:function(ev){ mudarZoom(ev.target.value/100); }}), e(Ph,{n:"image", s:26, style:{color:W.sec}})),
      e("div",{className:"flex w-full justify-end gap-2"},
        e("button",{onClick:p.fechar, className:"rounded-full px-5 py-2 text-[13px] hover:bg-white/10"}, "Cancelar"),
        e("button",{onClick:salvar, className:"flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white", style:{background:W.verde}}, e(Ph,{n:"check", s:17}), "Salvar foto"))));
}
// clicar na foto: ver ampliada, trocar (abre o editor) ou remover. `trigger(abrir)` desenha o que se clica.
function FotoEditavel(p){
  var vr = useState(false), ver = vr[0], setVer = vr[1], ar = useState(null), arquivo = ar[0], setArquivo = ar[1], inp = useRef(null);
  // ajustar o enquadramento da foto que já está lá (sem escolher outro arquivo)
  var ajustar = function(){ setVer(false); fetch(p.fotoAtual).then(function(r){ return r.blob(); }).then(function(b){ setArquivo(new File([b], "foto.jpg", {type:b.type||"image/jpeg"})); }).catch(function(){}); };
  var abrir = function(){ if(p.fotoAtual) setVer(true); else if(p.pode) inp.current.click(); };
  var escolher = function(){ setVer(false); inp.current.click(); };
  return e("span",{className:"inline-flex"}, p.trigger(abrir),
    e("input",{ref:inp, type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ var f = ev.target.files[0]; if(f) setArquivo(f); ev.target.value = ""; }}),
    ver && e(Janela,{titulo:p.titulo||"Foto", fechar:function(){ setVer(false); }, largura:420},
      e("div",{className:"flex flex-col items-center gap-4 p-5"},
        e("img",{src:p.fotoAtual, alt:"", className:"max-h-[60vh] w-full max-w-[340px] rounded-2xl object-contain"}),
        p.pode && e("div",{className:"flex flex-wrap justify-center gap-2"},
          e("button",{onClick:ajustar, className:"flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold", style:{background:"linear-gradient(135deg,#b8892b,#f6dc8c)", color:"#24180a"}}, e(Ph,{n:"crop", s:17, fill:true}), "Ajustar enquadramento"),
          e("button",{onClick:escolher, className:"flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white", style:{background:W.verde}}, e(Ph,{n:"camera", s:17, fill:true}), "Trocar foto"),
          e("button",{onClick:function(){ p.aoRemover(); setVer(false); }, className:"flex items-center gap-2 rounded-full px-4 py-2 text-[13px]", style:{background:"#3b1f24", color:"#ffb4bd"}}, e(Ph,{n:"trash", s:17}), "Remover")))),
    arquivo && e(EditorFoto,{arquivo:arquivo, fechar:function(){ setArquivo(null); }, aoSalvar:p.aoSalvar}));
}
function contatosVisiveis(st, eu){ return CONTATOS.filter(function(c){ return c.id!==eu && (st.config.representantes || c.tipo!=="rep"); }); }
var campo = {background:W.campo, color:W.texto};

function SeletorPessoas(p){
  var bq = useState(""), busca = bq[0], setBusca = bq[1], q = sem(busca);
  var lista = p.lista.filter(function(c){ return !q || sem(c.completo).indexOf(q)>=0 || sem(c.setor).indexOf(q)>=0; });
  return e("div",{className:"flex flex-col"},
    e("div",{className:"p-3"}, e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar pessoa ou setor", "aria-label":"Buscar pessoa", className:"h-10 w-full rounded-lg px-3 text-[13px] outline-none", style:campo})),
    !lista.length ? e(Vazio,{n:"magnifying-glass"}, "Ninguém encontrado.") : lista.map(function(c){ return p.linha(c); }));
}

function NovaConversa(p){
  var st = useChat(), md = useState("lista"), modo = md[0], setModo = md[1];
  if(modo==="grupo") return e(NovoGrupo,{eu:p.eu, fechar:p.fechar, aoCriar:p.abrir});
  return e(Janela,{titulo:"Nova conversa", fechar:p.fechar, largura:420},
    e("button",{onClick:function(){ setModo("grupo"); }, className:"flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5"},
      e("span",{className:"grid size-10 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"users-three", s:22, fill:true, style:{color:"#fff"}})), e("span",{className:"text-[14px] font-medium"}, "Novo grupo")),
    e(SeletorPessoas,{lista:contatosVisiveis(st, p.eu), linha:function(c){
      return e("button",{key:c.id, onClick:function(){ p.abrir(api.openDm(p.eu, c.id)); }, className:"flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/5"},
        e(Avatar,{id:c.id, s:40, presenca:true}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[14px]"}, c.nome), e("span",{className:"block truncate text-[11.5px]", style:{color:W.sec}}, c.setor+(c.funcao ? " · "+c.funcao : "")))); }}));
}

function NovoGrupo(p){
  var st = useChat(), nm = useState(""), nome = nm[0], setNome = nm[1], ds = useState(""), descr = ds[0], setDescr = ds[1];
  var sl = useState([]), sel = sl[0], setSel = sl[1], ft = useState(null), foto = ft[0], setFoto = ft[1];
  var criar = function(){ if(!nome.trim() || !sel.length) return; var id = api.createGroup({eu:p.eu, nome:nome.trim(), descr:descr.trim(), foto:foto, membros:sel}); p.aoCriar(id); };
  return e(Janela,{titulo:"Novo grupo", fechar:p.fechar, largura:440},
    e("div",{className:"flex items-center gap-3 p-4"},
      e(FotoEditavel,{pode:true, fotoAtual:foto ? lerMidia(foto) : null, titulo:"Foto do grupo", aoSalvar:function(u){ setFoto(guardarMidia(u)); }, aoRemover:function(){ setFoto(null); }, trigger:function(abrir){ return e("button",{onClick:abrir, "aria-label":"Escolher foto do grupo", className:"relative"}, e(Avatar,{grupo:true, nome:nome||"Grupo", foto:foto, s:64}), e("span",{className:"absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"camera", s:13, fill:true, style:{color:"#fff"}}))); }}),
      e("div",{className:"flex min-w-0 flex-1 flex-col gap-2"},
        e("input",{value:nome, onChange:function(ev){ setNome(ev.target.value); }, maxLength:40, placeholder:"Nome do grupo", "aria-label":"Nome do grupo", className:"h-10 rounded-lg px-3 text-[13.5px] outline-none", style:campo}),
        e("input",{value:descr, onChange:function(ev){ setDescr(ev.target.value); }, maxLength:120, placeholder:"Descrição (opcional)", "aria-label":"Descrição do grupo", className:"h-9 rounded-lg px-3 text-[12px] outline-none", style:campo}))),
    e("p",{className:"px-4 pb-1 text-[11.5px] font-semibold uppercase tracking-wide", style:{color:W.verde}}, "Participantes ("+sel.length+")"),
    e(SeletorPessoas,{lista:contatosVisiveis(st, p.eu), linha:function(c){ var on = sel.indexOf(c.id)>=0;
      return e("button",{key:c.id, onClick:function(){ setSel(on ? sel.filter(function(i){ return i!==c.id; }) : sel.concat([c.id])); }, className:"flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/5"},
        e("span",{className:"grid size-5 place-items-center rounded border", style:{borderColor:on ? W.verde : W.sec, background:on ? W.verde : "transparent"}}, on && e(Ph,{n:"check", s:13, style:{color:"#fff"}})),
        e(Avatar,{id:c.id, s:36}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13.5px]"}, c.nome), e("span",{className:"block truncate text-[11px]", style:{color:W.sec}}, c.setor))); }}),
    e("div",{className:"sticky bottom-0 flex justify-end p-3", style:{background:W.painel, borderTop:"1px solid "+W.borda}},
      e("button",{onClick:criar, disabled:!nome.trim() || !sel.length, className:"flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-40", style:{background:W.verde}}, e(Ph,{n:"check", s:17}), "Criar grupo")));
}

// horário de trabalho e almoço da pessoa (a Direção ajusta; sem ajuste vale o padrão do Configurador)
function HorarioPessoa(p){
  var st = useChat(), h = horarioDe(p.cid), campo = {background:W.campo, color:W.texto};
  var cel = function(rot, k){ return e("label",{className:"flex flex-col gap-1 text-[11px]", style:{color:W.sec}}, rot,
    e("input",{type:"time", value:h[k], disabled:!p.pode, "aria-label":rot, className:"h-9 rounded-lg px-2 text-[13px] outline-none disabled:opacity-70", style:campo, onChange:function(ev){ var o = {}; o[k] = ev.target.value; api.setSchedule(p.cid, o); }})); };
  return e("div",{className:"flex flex-col gap-2 px-6 py-3", style:{borderTop:"1px solid "+W.borda}},
    e("p",{className:"flex items-center gap-2 text-[12px] font-semibold", style:{color:W.ouro}}, e(Ph,{n:"clock", s:16, fill:true}), "Horário de trabalho", h.proprio && e("span",{className:"rounded px-1.5 text-[9.5px] font-normal", style:{background:"#3a2f12"}}, "ajustado")),
    e("div",{className:"grid grid-cols-4 gap-2"}, cel("Entrada","ini"), cel("Almoço de","almIni"), cel("Almoço até","almFim"), cel("Saída","fim")),
    e("div",{className:"grid grid-cols-4 gap-2"}, cel("Sexta: entrada","sexIni"), e("span"), e("span"), cel("Sexta: saída","sexFim")),
    h.proprio && p.pode && e("button",{onClick:function(){ api.clearSchedule(p.cid); }, className:"self-start text-[11px] underline", style:{color:W.sec}}, h.temRh ? "Voltar ao horário do RH" : "Voltar ao horário padrão"));
}
function InfoConversa(p){
  var st = useChat(), conv = st.convs.find(function(c){ return c.id===p.conv.id; }) || p.conv, eu = p.eu;
  var ad = useState(false), adicionando = ad[0], setAdicionando = ad[1], ed = useState(false), editando = ed[0], setEditando = ed[1], nm = useState(conv.nome), nome = nm[0], setNome = nm[1];
  var ds = useState(conv.descr||""), descr = ds[0], setDescr = ds[1];
  var admin = conv.tipo!=="setor" && (conv.admins.indexOf(eu)>=0 || !!p.direcao), membro = conv.membros.indexOf(eu)>=0;
  var fixa = !!(conv.fixaPor && conv.fixaPor[eu]), arquivada = !!(conv.arqPor && conv.arqPor[eu]), av = useState(""), avisoArq = av[0], setAvisoArq = av[1];
  var arqBloco = function(){ return e("div",null,
    e("button",{onClick:function(){ if(!arquivada){ var mot = api.pendencia(eu, conv.id); if(mot){ setAvisoArq(mot); return; } } api.arquivar(eu, conv.id); p.fechar(); }, className:"flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/5"}, e(Ph,{n:"archive-box", s:20}), arquivada ? "Tirar das arquivadas" : "Arquivar conversa"),
    avisoArq && e("p",{className:"px-6 pb-2 text-[11.5px]", style:{color:"#f59e0b"}}, "Não dá para arquivar: "+avisoArq+". Marque como resolvida na barra da conversa primeiro.")); };
  if(conv.tipo==="dm"){
    var o = contato(conv.membros.find(function(x){ return x!==eu; }) || conv.membros[0]);
    return e(Janela,{titulo:"Dados do contato", fechar:p.fechar, largura:400},
      e("div",{className:"flex flex-col items-center gap-2 px-6 py-6"},
        e(FotoEditavel,{pode:!!p.direcao && !p.leitura, fotoAtual:fotoDe(o.id), titulo:"Foto de "+o.nome, aoSalvar:function(u){ api.setFoto(o.id, u); }, aoRemover:function(){ api.setFoto(o.id, null); },
          trigger:function(abrir){ return e("button",{onClick:abrir, "aria-label":"Foto de "+o.nome, className:"relative"}, e(Avatar,{id:o.id, s:96, presenca:true}), p.direcao && !p.leitura && e("span",{className:"absolute bottom-0 right-0 grid size-8 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"camera", s:16, fill:true, style:{color:"#fff"}}))); }}),
        e("p",{className:"text-[19px] font-semibold"}, o.completo),
        e("p",{className:"text-[13px]", style:{color:W.sec}}, o.setorCurto+(o.funcao && o.funcao!==o.setorCurto ? " · "+o.funcao : "")), e("p",{className:"text-[12px]", style:{color:online(o.id) ? W.verde : W.sec}}, online(o.id) ? "online" : "offline")),
      e("button",{onClick:function(){ api.pin.conversa(eu, conv.id); }, className:"flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/5"}, e(Ph,{n:"push-pin", s:20}), fixa ? "Desafixar conversa" : "Fixar conversa"),
      arqBloco());
  }
  var salvar = function(){ api.updateGroup(conv.id, {nome:nome.trim()||conv.nome, descr:descr.trim()}); setEditando(false); };
  var membrosL = conv.membros.map(contato).sort(function(a,b){ return (conv.admins.indexOf(b.id)>=0)-(conv.admins.indexOf(a.id)>=0) || a.nome.localeCompare(b.nome); });
  if(adicionando) return e(Janela,{titulo:"Adicionar participante", fechar:function(){ setAdicionando(false); }, largura:420},
    e(SeletorPessoas,{lista:contatosVisiveis(st, eu).filter(function(c){ return conv.membros.indexOf(c.id)<0; }), linha:function(c){
      return e("button",{key:c.id, onClick:function(){ api.addMember(conv.id, c.id, eu); setAdicionando(false); }, className:"flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-white/5"},
        e(Avatar,{id:c.id, s:38}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13.5px]"}, c.nome), e("span",{className:"block truncate text-[11px]", style:{color:W.sec}}, c.setor))); }}));
  return e(Janela,{titulo:conv.tipo==="setor" ? "Dados do setor" : "Dados do grupo", fechar:p.fechar, largura:440},
    e("div",{className:"flex flex-col items-center gap-2 px-6 pb-3 pt-6"},
      e(FotoEditavel,{pode:admin, fotoAtual:conv.foto ? lerMidia(conv.foto) : null, titulo:"Foto do grupo", aoSalvar:function(u){ api.updateGroup(conv.id, {foto:guardarMidia(u)}); }, aoRemover:function(){ api.updateGroup(conv.id, {foto:null}); },
        trigger:function(abrir){ return e("button",{onClick:abrir, "aria-label":"Foto do grupo", className:"relative"}, e(Avatar,{grupo:true, nome:conv.nome, foto:conv.foto, s:96}),
          admin && e("span",{className:"absolute bottom-0 right-0 grid size-8 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"camera", s:16, fill:true, style:{color:"#fff"}}))); }}),
      editando ? e("div",{className:"flex w-full flex-col gap-2"},
        e("input",{value:nome, onChange:function(ev){ setNome(ev.target.value); }, maxLength:40, "aria-label":"Nome do grupo", className:"h-10 rounded-lg px-3 text-[14px] outline-none", style:campo}),
        e("input",{value:descr, onChange:function(ev){ setDescr(ev.target.value); }, maxLength:120, placeholder:"Descrição", "aria-label":"Descrição", className:"h-9 rounded-lg px-3 text-[12px] outline-none", style:campo}),
        e("button",{onClick:salvar, className:"self-end rounded-full px-4 py-1.5 text-[12px] font-semibold text-white", style:{background:W.verde}}, "Salvar")) :
        e("div",{className:"flex w-full flex-col items-center gap-1 text-center"},
          e("p",{className:"flex items-center gap-2 text-[19px] font-semibold"}, conv.nome, admin && e("button",{onClick:function(){ setNome(conv.nome); setDescr(conv.descr||""); setEditando(true); }, "aria-label":"Editar nome e descrição"}, e(Ph,{n:"pencil-simple", s:17, style:{color:W.sec}}))),
          e("p",{className:"text-[12px]", style:{color:W.sec}}, (conv.tipo==="setor" ? "Setor · " : "Grupo · ")+conv.membros.length+" pessoas"), conv.descr && e("p",{className:"mt-1 text-[13px]"}, conv.descr))),
    e("button",{onClick:function(){ api.pin.conversa(eu, conv.id); }, className:"flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/5", style:{borderTop:"1px solid "+W.borda}}, e(Ph,{n:"push-pin", s:20}), fixa ? "Desafixar conversa" : "Fixar conversa"),
    arqBloco(),
    e("div",{className:"flex items-center justify-between px-6 pb-1 pt-3", style:{borderTop:"1px solid "+W.borda}}, e("span",{className:"text-[11.5px] font-semibold uppercase tracking-wide", style:{color:W.verde}}, membrosL.length+" participantes")),
    admin && e("button",{onClick:function(){ setAdicionando(true); }, className:"flex w-full items-center gap-3 px-6 py-2.5 text-left hover:bg-white/5"},
      e("span",{className:"grid size-10 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"user-plus", s:20, fill:true, style:{color:"#fff"}})), "Adicionar participante"),
    membrosL.map(function(c){ var ehAdmin = conv.admins.indexOf(c.id)>=0;
      return e("div",{key:c.id, className:"flex items-center gap-3 px-6 py-2"},
        e(FotoEditavel,{pode:!!p.direcao && !p.leitura, fotoAtual:fotoDe(c.id), titulo:"Foto de "+c.nome, aoSalvar:function(u){ api.setFoto(c.id, u); }, aoRemover:function(){ api.setFoto(c.id, null); }, trigger:function(abrir){ return e("button",{onClick:abrir, "aria-label":"Foto de "+c.nome}, e(Avatar,{id:c.id, s:40, presenca:true})); }}),
        e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13.5px]"}, c.id===eu ? "Você" : c.nome), e("span",{className:"block truncate text-[11px]", style:{color:W.sec}}, c.setorCurto)),
        (conv.supervisores||[]).indexOf(c.id)>=0 && e("span",{className:"rounded-full px-1.5 py-px text-[8.5px] font-extrabold uppercase", style:{background:"linear-gradient(135deg,#b8892b,#f6dc8c)", color:"#24180a"}}, "Supervisora"),
        ehAdmin && e("span",{className:"rounded px-1.5 py-0.5 text-[10px]", style:{border:"1px solid "+W.verde, color:W.verde}}, "admin"),
        admin && c.id!==eu && e("button",{onClick:function(){ api.toggleAdmin(conv.id, c.id); }, title:ehAdmin ? "Remover como admin" : "Tornar admin", "aria-label":ehAdmin ? "Remover como admin" : "Tornar admin", className:"grid size-8 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"shield-check", s:18, style:{color:ehAdmin ? W.verde : W.sec}})),
        admin && c.id!==eu && e("button",{onClick:function(){ api.removeMember(conv.id, c.id, eu); }, title:"Remover do grupo", "aria-label":"Remover do grupo", className:"grid size-8 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"user-minus", s:18, style:{color:W.vermelho}}))); }),
    membro && conv.tipo==="grupo" && e("button",{onClick:function(){ api.removeMember(conv.id, eu, eu); p.aoSair(); }, className:"mt-2 flex w-full items-center gap-3 px-6 py-3 text-left hover:bg-white/5", style:{color:W.vermelho, borderTop:"1px solid "+W.borda}}, e(Ph,{n:"sign-out", s:20}), "Sair do grupo"));
}
export { InfoConversa, NovaConversa, NovoGrupo, FotoEditavel, HorarioPessoa };
