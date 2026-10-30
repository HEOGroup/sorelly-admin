// Sorelly Admin · montagem — pages/Melhorias.js
// Solicitações de melhorias (28/10/2026): todo funcionário pede uma mudança (título, o que mudar, tela, print opcional); Diretoria e Desenvolvimento respondem.
// Lógica em domain/melhorias.js (estado s.mel, ação MEL; o servidor guarda no módulo "mel", um pedido por chave). Peças do padrão do Financeiro (components/padrao-fin.js).
import { Botao, CAMPO, Segmentado, TabelaP, Tr } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { TIPOS, melTipoNome, SITUACOES, melAberta, melCaminho, melEspera, melFotos, melLista, melMsgs, melPodeGerir } from "@/apps/montagem/domain/melhorias";
import { DIRETORIA, grupoDe, nomeDe } from "@/apps/montagem/domain/equipe";
import { Avatar, Ph, W, hora } from "@/apps/montagem/components/chat/chat-ui";
import { contatoDoLogin } from "@/apps/montagem/domain/chat-contatos";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";
import { useNavigate } from "react-router-dom";
import React from "react";

var COR_SIT = {"Em análise":"text-yellow-400", "Mudança feita, testar":"text-sky-400", "Precisa de melhoria":"text-orange-400", "Concluída":"text-success", "Recusada":"text-destructive"};
// dica curta de cada situação, no menu
var OPCOES_RESP = [["Em análise", "Ainda estou vendo o pedido"], ["Mudança feita, testar", "Já executei: ela pode testar"], ["Recusada", "Não vai ser feita"]];   // o que quem gerencia escolhe; Concluída e Precisa de melhoria vêm do teste de quem pediu
// a lista mostra só o começo do que a pessoa escreveu: no máximo 74 letras e "..." no final (Marcus, 29/10/2026); o texto inteiro fica no chat do pedido
var LIMITE_DESC = 74;
var resumo = function(t){ var v = String(t||"").replace(/\s+/g, " ").trim(); return v.length>LIMITE_DESC ? v.slice(0, LIMITE_DESC).trim()+"..." : v; };
var quando = function(iso){ try { return new Date(iso).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"}); } catch(x){ return iso; } };

var quandoCurto = function(iso){ try { return new Date(iso).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}); } catch(x){ return iso; } };

// reduz o print para um JPEG pequeno (até ~1000 px de largura e ~150 KB), para caber no estado compartilhado do servidor
function reduzirPrint(arquivo){
  return new Promise(function(ok, falha){
    var leitor = new FileReader();
    leitor.onerror = function(){ falha(new Error("Não consegui ler o arquivo.")); };
    leitor.onload = function(){
      var img = new Image();
      img.onerror = function(){ falha(new Error("Este arquivo não é uma imagem.")); };
      img.onload = function(){
        var f = Math.min(1, 1000/img.width), c = document.createElement("canvas"); c.width = Math.round(img.width*f); c.height = Math.round(img.height*f);
        var cx = c.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, c.width, c.height); cx.drawImage(img, 0, 0, c.width, c.height);
        var q = 0.72, r = c.toDataURL("image/jpeg", q);
        while(r.length > 200000 && q > 0.3){ q -= 0.1; r = c.toDataURL("image/jpeg", q); }
        if(r.length > 260000) falha(new Error("A imagem ainda ficou grande. Envie um print menor.")); else ok(r);
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  });
}

// Ctrl+V: se a área de transferência tem uma imagem (print), devolve o arquivo
function imagemColada(ev){
  var it = ev.clipboardData && ev.clipboardData.items; if(!it) return null;
  for(var i=0;i<it.length;i++){ if(it[i].type && it[i].type.indexOf("image/")===0) return it[i].getAsFile(); }
  return null;
}

// nova solicitação = o mesmo chat de quem responde (Marcus, 29/10/2026): fixo no alto só o link da tela; o print colado (Ctrl+V) já aparece na conversa; escreve e envia, e o pedido nasce com esse chat
function NovaConversa(p){
  var s = p.s, d = p.d, nome = nomeDe(s.usuario), setor = DIRETORIA.some(function(x){ return x.id===s.usuario; }) ? "Diretoria" : (PAPEL_LB[grupoDe(s.usuario)] || "");
  var t = useState(""), txt = t[0], setTxt = t[1], im = useState([]), imgs = im[0], setImgs = im[1], er = useState(""), erro = er[0], setErro = er[1], u = useState(window.__ultimaTela || ""), url = u[0], setUrl = u[1], tp = useState(""), tipo = tp[0], setTipo = tp[1];
  var fim = React.useRef(null);
  useEffect(function(){ if(fim.current) fim.current.scrollIntoView({block:"end"}); }, [imgs.length]);
  var anexar = function(f){ if(!f) return; setErro(""); if(imgs.length>=4){ setErro("No máximo 4 prints."); return; } reduzirPrint(f).then(function(r){ setImgs(function(l){ return l.length<4 ? l.concat([r]) : l; }); }).catch(function(y){ setErro(y.message); }); };
  var colar = function(ev){ var f = imagemColada(ev); if(f){ ev.preventDefault(); anexar(f); } };
  var enviar = function(){
    if(!tipo){ setErro("Marque o que é: não sei como fazer, melhoria do layout ou algo que falta."); return; }
    if(!txt.trim()){ setErro(imgs.length ? "Escreva também o que você quer mudar." : "Escreva o que você quer mudar."); return; }
    var id = Date.now().toString(36)+Math.random().toString(36).slice(2, 5);
    d({type:"MEL", op:"enviar", id:id, tipo:tipo, titulo:"", desc:txt, url:url, imgs:imgs, porId:s.usuario, por:nome, setor:setor});
    p.onEnviou(id);
  };
  return e("div",{onPaste:colar, className:"relative flex h-[min(88vh,680px)] min-w-0 flex-col overflow-hidden rounded-2xl border-2 bg-card text-foreground shadow-2xl", style:{borderColor:"rgba(232,184,75,.55)"}},
    e("div",{className:"flex items-center gap-2 border-b border-border px-3 py-2"},
      e("b",{className:"min-w-0 flex-1 text-[13px]"}, "Novo chamado"),
      e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", title:"Fechar", className:"grid size-8 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, e(Ph,{n:"x", s:16}))),
    // fixo no alto: só o link da tela
    e("div",{className:"flex items-center gap-2 border-b border-border px-3 py-1.5 text-[13px]"},
      e("span",null, "Tela"), e("input",{value:url, maxLength:300, placeholder:"/financeiro/contas-a-pagar (link da tela do pedido)", "aria-label":"Link da tela", onChange:function(ev){ setUrl(ev.target.value); }, className:CAMPO+" min-w-0 flex-1"})),
    // tipo obrigatório (Marcus, 30/10/2026): o que a pessoa está pedindo
    e("div",{className:"flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5 text-[13px]"},
      e("span",null, "O que é?"),
      TIPOS.map(function(x){ var on = tipo===x[0]; return e("button",{key:x[0], type:"button", onClick:function(){ setTipo(x[0]); setErro(""); }, "aria-pressed":on, className:"h-8 rounded-full border px-3 text-[13px] font-semibold "+(on ? "border-primary bg-primary/20 text-primary" : "border-border bg-card hover:bg-white/10")}, x[1]); })),
    e("div",{className:"flex min-h-0 min-w-0 flex-1 flex-col", style:{background:W.fundo}},
      e("div",{className:"flex items-center gap-2 px-3 py-1.5", style:{background:W.cab, color:W.texto}},
        e(Avatar,{id:contatoDoLogin(s.usuario), nome:nome, s:32}),
        e("div",{className:"min-w-0 leading-tight"}, e("div",{className:"truncate text-[13px] font-semibold"}, nome+(setor ? " · "+setor : "")), e("div",{className:"truncate text-[11px]", style:{color:W.sec}}, "Marcus e Leonardo respondem aqui"))),
      e("div",{className:"flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3", style:{backgroundImage:"radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize:"14px 14px"}},
        e("div",{className:"max-w-[88%] rounded-xl rounded-bl-sm px-2.5 py-1.5 text-[13px] shadow-sm", style:{background:W.cab, color:W.texto}},
          e("div",{className:"text-[12px] font-semibold", style:{color:W.ouro}}, "Sorelly"),
          "Conte aqui o que você quer mudar, do seu jeito. Cole o print da tela com Ctrl+V e ele já aparece na conversa. Só falta o link da tela, no alto."),
        // o print colado já aparece aqui, como mensagem sua
        imgs.length>0 && e("div",{className:"flex items-end gap-1.5 flex-row-reverse"},
          e(Avatar,{id:contatoDoLogin(s.usuario), nome:nome, s:28}),
          e("div",{className:"flex max-w-[80%] min-w-0 flex-col gap-1.5 rounded-xl rounded-br-sm px-2.5 py-1.5 text-[13px] shadow-sm", style:{background:W.saida, color:W.texto}},
            imgs.map(function(im2, i){ return e("div",{key:i, className:"relative"},
              e("img",{src:im2, alt:"Print "+(i+1), className:"max-h-64 w-full rounded-md object-contain", style:{background:"#000"}}),
              e("button",{type:"button", "aria-label":"Remover print "+(i+1), title:"Remover este print", onClick:function(){ setImgs(imgs.filter(function(y, j){ return j!==i; })); }, className:"absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-card text-[13px] ring-1 ring-border"}, e(Ph,{n:"x", s:13}))); }),
            e("div",{className:"text-right text-[10.5px]", style:{color:W.sec}}, imgs.length+(imgs.length===1 ? " print anexado" : " prints anexados")))),
        e("div",{ref:fim})),
      e("div",{className:"flex flex-col gap-1.5 px-2 py-2", style:{background:W.cab}},
        erro && e("span",{className:"truncate text-[12px]", style:{color:W.vermelho}, title:erro}, erro),
        e("div",{className:"flex items-end gap-2"},
          e("label",{className:"grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[13px] hover:bg-white/10", title:"Anexar um print", style:{color:W.sec}}, e(Ph,{n:"paperclip", s:20}),
            e("input",{type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; anexar(f); }})),
          e("textarea",{autoFocus:true, value:txt, rows:1, maxLength:3000, onChange:function(ev){ setTxt(ev.target.value); },
            onKeyDown:function(ev){ if(ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); enviar(); } },
            placeholder:"Escreva o que você quer mudar (Ctrl+V cola o print)", className:"max-h-28 min-h-9 min-w-0 flex-1 resize-none rounded-lg px-3 py-2 text-[13px] outline-none", style:{background:W.campo, color:W.texto}}),
          e("button",{type:"button", onClick:enviar, "aria-label":"Enviar", title:"Enviar (Enter)", className:"grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white hover:brightness-110", style:{background:W.verde}}, e(Ph,{n:"paper-plane-right", s:18, fill:true}))))));
}

// ícone que abre direto a tela do pedido (no lugar do endereço escrito): um clique e já está lá
function AbrirTela(p){
  var ir = useNavigate();
  if(!p.url) return e("span",null, "—");
  var caminho = melCaminho(p.url);
  return e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); if(p.antes) p.antes(); ir(caminho); }, title:"Abrir a tela "+caminho, "aria-label":"Abrir a tela "+caminho, className:"inline-grid size-7 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, e(Ph,{n:"arrow-square-out", s:15}));
}

// foto do pedido: ampliar, copiar (para colar no Claude) e salvar com o nome da tela no arquivo (Marcus, 29/10/2026)
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
// "/financeiro/resultado" vira "financeiro-resultado"; sem tela, usa o título do pedido
var nomeArq = function(x, i){
  var base = semAcento(melCaminho(x.url) || x.titulo).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "pedido";
  var ext = /^data:image\/png|\.png($|\?)/i.test(melFotos(x)[i] || "") ? "png" : "jpg";
  return "chamado-"+base+"-foto-"+(i+1)+"."+ext;
};
function baixarFoto(b, nome){ var u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 4000); return "Baixado ✓ (pasta Downloads)"; }
// salva a foto: no Chrome abre a janela de salvar já com o nome da tela; sem isso, baixa direto
function salvarFoto(src, nome){
  return fetch(src).then(function(r){ return r.blob(); }).then(function(b){
    if(!window.showSaveFilePicker) return baixarFoto(b, nome);
    var ext = nome.split(".").pop(), tipo = {}; tipo[b.type || "image/jpeg"] = ["."+ext];
    return window.showSaveFilePicker({suggestedName:nome, types:[{description:"Imagem", accept:tipo}]})
      .then(function(h){ return h.createWritable(); }).then(function(w){ return w.write(b).then(function(){ return w.close(); }); }).then(function(){ return "Salvo ✓"; })
      .catch(function(x){ if(x && x.name==="AbortError") return ""; return baixarFoto(b, nome); });
  });
}
// o clipboard só aceita PNG: desenha a foto num canvas e copia como PNG
function copiarFoto(src){
  return new Promise(function(ok, falha){
    var im = new Image(); im.crossOrigin = "anonymous";
    im.onerror = function(){ falha(new Error("Não consegui abrir a foto.")); };
    im.onload = function(){
      var c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0);
      c.toBlob(function(b){
        if(!b || !navigator.clipboard || !window.ClipboardItem){ falha(new Error("Este navegador não copia imagem. Use Salvar.")); return; }
        navigator.clipboard.write([new window.ClipboardItem({"image/png":b})]).then(ok).catch(function(){ falha(new Error("O navegador não deixou copiar. Use Salvar.")); });
      }, "image/png");
    };
    im.src = src;
  });
}
function BotoesFoto(p){
  var c = useState(""), msg = c[0], setMsg = c[1];
  var copiar = function(ev){ ev.stopPropagation(); setMsg("Copiando…"); copiarFoto(p.src).then(function(){ setMsg("Copiado ✓"); setTimeout(function(){ setMsg(""); }, 2500); }).catch(function(x){ setMsg(x.message); }); };
  var salvar = function(ev){ ev.stopPropagation(); setMsg("Salvando…"); salvarFoto(p.src, p.nome).then(function(m){ setMsg(m); setTimeout(function(){ setMsg(""); }, 3500); }).catch(function(){ setMsg("Não consegui salvar. Clique com o botão direito na foto e escolha Salvar imagem."); }); };
  var btn = "h-8 rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10";
  return e("span",{className:"flex flex-wrap items-center gap-1.5", onClick:function(ev){ ev.stopPropagation(); }},
    p.ampliar && e("button",{type:"button", onClick:p.ampliar, className:btn, title:"Ver a foto em tela cheia"}, "Ampliar"),
    e("button",{type:"button", onClick:copiar, className:btn, title:"Copia a foto para colar (Ctrl+V) no Claude ou em outro lugar"}, "Copiar"),
    e("button",{type:"button", onClick:salvar, className:btn, title:"Salva a foto com o nome "+p.nome}, "Salvar"),
    msg && e("span",{className:"text-[12px]"}, msg));
}

// uma mensagem do chat, no estilo do WhatsApp: balão do outro lado à esquerda com a foto da pessoa (a mesma do app normal), o meu à direita em verde; hora no canto
function Balao(p){
  var m = p.m, meu = m.porId===p.eu, resposta = melPodeGerir(m.porId) && m.porId!==p.dono, nome = String(m.por||"").split(" · ")[0];
  var t = new Date(m.em).getTime();
  return e("div",{className:"flex items-end gap-1.5 "+(meu ? "flex-row-reverse" : "")},
    e(Avatar,{id:contatoDoLogin(m.porId), nome:nome, s:28}),
    e("div",{className:"max-w-[80%] min-w-0 px-2.5 py-1.5 text-[13px] shadow-sm "+(meu ? "rounded-xl rounded-br-sm" : "rounded-xl rounded-bl-sm"), style:{background:meu ? W.saida : W.cab, color:W.texto}},
      !meu && e("div",{className:"text-[12px] font-semibold", style:{color:resposta ? W.ouro : W.verde}}, m.por+(resposta ? " · Resposta" : "")),
      m.txt && e("div",{className:"whitespace-pre-wrap break-words"}, m.txt),
      (m.imgs || (m.img ? [m.img] : [])).map(function(src, k){ return e(React.Fragment,{key:k},
        e("button",{type:"button", onClick:function(){ p.zoom(src); }, title:"Clique para ampliar", className:"mt-1 block w-full cursor-zoom-in"}, e("img",{src:src, alt:"Print da tela", className:"max-h-64 w-full rounded-md object-contain", style:{background:"#000"}})),
        p.nomeFoto && e("div",{className:"mt-1"}, e(BotoesFoto,{src:src, nome:p.nomeFoto(src), ampliar:function(){ p.zoom(src); }}))); }),
      e("div",{className:"mt-0.5 text-right text-[10.5px]", style:{color:W.sec}}, isNaN(t) ? "" : hora(t))));
}

// situação do pedido (só Marcus e Leonardo): mostra a situação atual; ao clicar abre para baixo, escolhe a situação e escreve o que fez (vai para o chat)
function MenuSituacao(p){
  var x = p.x, o = useState(false), aberto = o[0], setAberto = o[1], z = useState(x.situacao), sit = z[0], setSit = z[1], tx = useState(""), fez = tx[0], setFez = tx[1];
  var mudou = sit!==x.situacao || fez.trim();
  var salvar = function(){
    if(sit!==x.situacao) p.d({type:"MEL", op:"situacao", id:x.id, situacao:sit, porId:p.s.usuario});
    if(fez.trim()) p.d({type:"MEL", op:"msg", id:x.id, txt:fez, img:"", porId:p.s.usuario, por:nomeDe(p.s.usuario)});
    setFez(""); setAberto(false);
  };
  return e("div",{className:"relative"},
    e("button",{type:"button", onClick:function(){ setSit(x.situacao); setAberto(!aberto); }, "aria-expanded":aberto, title:"Mudar a situação e contar o que foi feito", className:"flex h-8 items-center gap-2 rounded-md border border-border bg-card px-3 text-[13px] hover:bg-white/10"},
      e("span",{className:"font-semibold"}, x.situacao), e(Ph,{n:aberto ? "caret-up" : "caret-down", s:12})),
    aberto && e("div",{className:"absolute right-0 top-full z-20 mt-1 flex max-h-[75vh] w-[22rem] flex-col overflow-y-auto gap-2 rounded-xl border border-border bg-card p-3 shadow-2xl"},
      e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "Situação"),
      OPCOES_RESP.map(function(o){ var n = o[0]; return e("label",{key:n, className:"flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-0.5 text-[13px] hover:bg-white/10 "+(sit===n ? "bg-white/10" : "")},
        e("input",{type:"radio", name:"mel-sit", checked:sit===n, onChange:function(){ setSit(n); }}),
        e("span",{className:"min-w-0 flex-1 leading-tight"}, e("span",{className:"block "+(sit===n ? "font-semibold" : "")}, n), e("span",{className:"block text-[11.5px] opacity-80"}, o[1]))); }),
      e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, "O que foi feito (vai para o chat)"),
      e("textarea",{value:fez, rows:3, maxLength:2000, onChange:function(ev){ setFez(ev.target.value); }, placeholder:"Conte o que você fez neste pedido", className:"w-full resize-none rounded-md border border-border bg-card px-2.5 py-1.5 text-[13px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"}),
      e("div",{className:"flex items-center gap-2"},
        e("button",{type:"button", onClick:function(){ setAberto(false); p.excluir(); }, className:"h-8 whitespace-nowrap rounded-md px-2 text-[13px] text-destructive hover:bg-destructive/15"}, "Excluir pedido"),
        e("span",{className:"flex-1"}),
        e(Botao,{onClick:function(){ setAberto(false); }}, "Cancelar"), e(Botao,{principal:true, desabilitado:!mudou, onClick:salvar}, "Salvar"))));
}

// do lado de quem pediu: a mudança foi feita, agora é testar e dizer se ficou bom ou se precisa melhorar
function BarraTeste(p){
  var x = p.x, a = useState(false), falta = a[0], setFalta = a[1], tx = useState(""), txt = tx[0], setTxt = tx[1];
  var enviar = function(ok){ p.d({type:"MEL", op:"teste", id:x.id, ok:ok, txt:txt, porId:p.s.usuario, por:nomeDe(p.s.usuario)}); };
  return e("div",{className:"flex flex-wrap items-center gap-2 border-b border-border px-3 py-2"},
    e("b",{className:"text-[13px]"}, "A mudança foi feita. Teste e diga o que achou:"),
    !falta && e(Botao,{principal:true, onClick:function(){ enviar(true); }}, "✓ Testei e aprovei"),
    !falta && e(Botao,{onClick:function(){ setFalta(true); }}, "Testei, precisa melhorar"),
    falta && e("input",{autoFocus:true, value:txt, maxLength:2000, placeholder:"O que ainda precisa melhorar?", onChange:function(ev){ setTxt(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter" && txt.trim()) enviar(false); }, className:CAMPO+" min-w-0 flex-1"}),
    falta && e(Botao,{principal:true, desabilitado:!txt.trim(), onClick:function(){ enviar(false); }}, "Enviar"),
    falta && e(Botao,{onClick:function(){ setFalta(false); }}, "Voltar"));
}

// janela do pedido (layout 1): à esquerda quem pediu, a tela com link e as fotos (botão para ver a próxima); à direita o chat estilo WhatsApp, que começa com o que a pessoa escreveu
function Detalhe(p){
  var x = p.x, s = p.s, d = p.d, gere = melPodeGerir(s.usuario), msgs = melMsgs(s, x.id);
  var t = useState(""), txt = t[0], setTxt = t[1], im = useState(""), img = im[0], setImg = im[1], er = useState(""), erro = er[0], setErro = er[1], cf = useState(false), confirma = cf[0], setConfirma = cf[1];
  var fim = React.useRef(null);
  useEffect(function(){ if(fim.current) fim.current.scrollIntoView({block:"end"}); }, [msgs.length, x.id]);
  var anexar = function(f){ if(!f) return; setErro(""); reduzirPrint(f).then(setImg).catch(function(y){ setErro(y.message); }); };
  var colar = function(ev){ var f = imagemColada(ev); if(f){ ev.preventDefault(); anexar(f); } };
  var enviar = function(){ if(!txt.trim() && !img) return; d({type:"MEL", op:"msg", id:x.id, txt:txt, img:img, porId:s.usuario, por:nomeDe(s.usuario)}); setTxt(""); setImg(""); setErro(""); };
  var info = function(rot, cont){ return e("div",{className:"min-w-0 shrink-0"}, e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot), cont); };
  // todas as fotos do pedido: as do pedido e as mandadas no chat, em ordem
  var fotos = melFotos(x).concat(msgs.map(function(m){ return m.img; }).filter(Boolean));
  var n = fotos.length;
  var iniciar = new Date(x.em).getTime();
  var zoomar = function(src){ var i = fotos.indexOf(src); p.zoom(src, nomeArq(x, i<0 ? 0 : i)); };
  var nomeFoto = function(src){ var i = fotos.indexOf(src); return nomeArq(x, i<0 ? 0 : i); };
  return e("div",{className:"relative flex h-[min(88vh,680px)] min-w-0 flex-col overflow-hidden rounded-2xl border-2 bg-card text-foreground shadow-2xl", style:{borderColor:"rgba(232,184,75,.55)"}},
    e("div",{className:"flex flex-wrap items-center gap-2 border-b border-border px-3 py-2"},
      e("b",{className:"min-w-0 flex-1 break-words text-[13px] leading-tight"}, x.titulo),
      gere ? e(MenuSituacao,{key:x.id+x.situacao, x:x, s:s, d:d, excluir:function(){ setConfirma(true); }}) : e("span",{className:"font-semibold"}, x.situacao),
      e("button",{type:"button", onClick:p.fechar, "aria-label":"Fechar", title:"Fechar", className:"grid size-8 place-items-center rounded-md border border-border bg-card text-[13px] hover:bg-white/10"}, e(Ph,{n:"x", s:16}))),
    x.porId===s.usuario && x.situacao==="Mudança feita, testar" && e(BarraTeste,{x:x, s:s, d:d}),
    // fixo no alto: só o link da tela e o lugar da conversa do Claude (só Marcus e Leonardo veem)
    e("div",{className:"flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-3 py-1.5 text-[13px]"},
      e("span",{className:"flex items-center gap-2"}, "Tela", e(AbrirTela,{url:x.url, antes:p.fechar}), x.url && e("span",{className:"text-[12px] opacity-80"}, melCaminho(x.url))),
      gere && e("span",{className:"flex min-w-0 items-center gap-2"}, "Conversa do Claude", e(CelClaude,{key:x.id+(x.claude||""), x:x, s:s, d:d, gere:gere}))),
      e("div",{className:"flex min-h-0 min-w-0 flex-1 flex-col", style:{background:W.fundo}},
        e("div",{className:"flex items-center gap-2 px-3 py-1.5", style:{background:W.cab, color:W.texto}},
          e(Avatar,{id:contatoDoLogin(x.porId), nome:x.por, s:32}),
          e("div",{className:"min-w-0 leading-tight"}, e("div",{className:"truncate text-[13px] font-semibold"}, x.por), e("div",{className:"truncate text-[11px]", style:{color:W.sec}}, x.setor+" · chamado"+(melTipoNome(x.tipo) ? " · "+melTipoNome(x.tipo) : "")))),
        e("div",{className:"flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3", style:{backgroundImage:"radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)", backgroundSize:"14px 14px"}},
          e("div",{className:"mx-auto rounded-md px-2.5 py-0.5 text-[11.5px]", style:{background:W.cab, color:W.sec}}, isNaN(iniciar) ? "Pedido" : new Date(iniciar).toLocaleDateString("pt-BR")),
          e(Balao,{m:{porId:x.porId, por:x.por, em:x.em, txt:x.desc, imgs:melFotos(x)}, eu:s.usuario, dono:x.porId, zoom:zoomar, nomeFoto:nomeFoto}),   // o chat começa com o que a pessoa escreveu no pedido
          msgs.map(function(m, i){ return e(Balao,{key:i, m:m, eu:s.usuario, dono:x.porId, zoom:zoomar, nomeFoto:nomeFoto}); }),
          e("div",{ref:fim})),
        e("div",{className:"flex flex-col gap-1.5 px-2 py-2", style:{background:W.cab}},
          img && e("div",{className:"flex items-end gap-2"}, e("img",{src:img, alt:"Print a enviar", className:"h-14 rounded border border-border"}), e(Botao,{onClick:function(){ setImg(""); }}, "Remover")),
          erro && e("span",{className:"truncate text-[12px]", style:{color:W.vermelho}, title:erro}, erro),
          e("div",{className:"flex items-end gap-2"},
            e("label",{className:"grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[13px] hover:bg-white/10", title:"Anexar uma imagem", style:{color:W.sec}}, e(Ph,{n:"paperclip", s:20}),
              e("input",{type:"file", accept:"image/*", className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; anexar(f); }})),
            e("textarea",{value:txt, rows:1, maxLength:2000, onChange:function(ev){ setTxt(ev.target.value); }, onPaste:colar,
              onKeyDown:function(ev){ if(ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); enviar(); } },
              placeholder:"Digite uma mensagem", className:"max-h-24 min-h-9 min-w-0 flex-1 resize-none rounded-lg px-3 py-2 text-[13px] outline-none", style:{background:W.campo, color:W.texto}}),
            e("button",{type:"button", onClick:enviar, "aria-label":"Enviar", title:"Enviar (Enter)", className:"grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white hover:brightness-110", style:{background:W.verde}}, e(Ph,{n:"paper-plane-right", s:18, fill:true}))))),
    confirma && e("div",{className:"absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4"},
      e("div",{className:"flex w-full max-w-sm flex-col gap-3 rounded-xl border border-border bg-card p-4 text-center"},
        e("b",{className:"text-[13px]"}, "Tem certeza que quer excluir?"),
        e("p",{className:"text-[13px]"}, "O pedido \""+x.titulo+"\" sai da lista de todo mundo."),
        e("div",{className:"flex justify-center gap-2"},
          e(Botao,{onClick:function(){ setConfirma(false); }}, "Não, voltar"),
          e("button",{type:"button", onClick:function(){ d({type:"MEL", op:"excluir", id:x.id, porId:s.usuario}); setConfirma(false); p.fechar(); }, className:"h-8 min-w-24 rounded-md border border-destructive bg-destructive/20 px-3.5 text-[13px] font-semibold text-destructive hover:bg-destructive/30"}, "Sim, excluir")))));
}

// conversa do Claude (link ou nome) de cada pedido: só o Marcus e o Leonardo preenchem; os outros não veem a coluna
function CelClaude(p){
  var ed = useState(false), editando = ed[0], setEd = ed[1], vt = useState(p.x.claude || ""), v = vt[0], setV = vt[1];
  var parar = function(ev){ ev.stopPropagation(); };
  var salvar = function(){ p.d({type:"MEL", op:"claude", id:p.x.id, claude:v, porId:p.s.usuario}); setEd(false); };
  var atual = p.x.claude || "", link = /^https?:\/\//.test(atual);
  if(editando) return e("span",{className:"flex items-center gap-1", onClick:parar},
    e("input",{autoFocus:true, value:v, placeholder:"Link ou nome da conversa", maxLength:300, onChange:function(ev){ setV(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvar(); if(ev.key==="Escape"){ setV(atual); setEd(false); } }, className:CAMPO+" h-7 min-w-0"}),
    e("button",{type:"button", onClick:salvar, className:"h-7 rounded-md border border-primary px-2 text-[12px] font-semibold text-primary"}, "OK"));
  return e("span",{className:"flex items-center justify-center gap-1.5", onClick:parar},
    atual ? (link ? e("a",{href:atual, target:"_blank", rel:"noreferrer", title:atual, className:"text-primary underline"}, "Abrir conversa ↗") : e("span",{className:"truncate", title:atual}, atual)) : null,
    e("button",{type:"button", onClick:function(){ setV(atual); setEd(true); }, title:atual ? "Trocar a conversa do Claude" : "Anexar a conversa do Claude", className:"h-6 shrink-0 rounded border border-border px-1.5 text-[12px] hover:bg-white/10"}, atual ? "✎" : "+ conversa"));
}

var ORDENS = [["d-", "Data · mais novo primeiro"], ["d+", "Data · mais antigo primeiro"], ["q+", "Funcionária · A a Z"], ["q-", "Funcionária · Z a A"], ["s+", "Setor · A a Z"], ["sit+", "Situação"]];

// cartão compacto do topo
function Cartao(p){ return e("section",{className:"min-w-0 rounded-lg border border-border bg-card/60 px-2.5 py-1"}, e("div",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), p.children); }
// barras do topo: cada item é um botão que filtra a tabela
function Ranking(p){
  var mx = p.itens.length ? p.itens[0][1] : 1;
  return e(Cartao,{t:p.t},
    p.itens.length===0 ? e("p",{className:"py-1 text-[13px]"}, "Sem pedidos.")
    : e("div",{className:"flex flex-col"}, p.itens.map(function(it){
        return e("button",{key:it[0], type:"button", onClick:function(){ p.onEscolher(it[0]); }, title:"Filtrar por "+it[0], className:"grid min-h-6 w-full grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_1.25rem] items-center gap-2 rounded py-0.5 text-left text-[13px] leading-tight hover:bg-white/10"},
          e("span",{className:"break-words"}, it[0]),
          e("span",{className:"h-1.5 overflow-hidden rounded bg-white/10"}, e("span",{className:"block h-1.5 rounded bg-primary", style:{width:Math.round(it[1]/mx*100)+"%"}})),
          e("b",{className:"text-right tabular-nums"}, it[1])); })));
}
var ranking = function(lista, campo){
  var m = {}; lista.forEach(function(x){ var k = campo==="url" ? melCaminho(x.url) : x[campo]; if(k) m[k] = (m[k]||0)+1; });
  return Object.keys(m).map(function(k){ return [k, m[k]]; }).sort(function(a, b){ return b[1]-a[1] || (a[0]<b[0] ? -1 : 1); }).slice(0, 3);
};

function AbaMelhorias(){
  var cx = use(), s = cx.state, d = cx.dispatch, gere = melPodeGerir(s.usuario);
  // quem responde (Marcus e Leonardo) abre em Todas; os demais só veem os próprios pedidos
  var v = useState(gere ? "todas" : "minhas"), vis = v[0], setVis = v[1], nv = useState(false), novo = nv[0], setNovo = nv[1], sl = useState(null), sel = sl[0], setSel = sl[1];
  var fb = useState(""), busca = fb[0], setBusca = fb[1], fs = useState(""), fSit = fs[0], setFSit = fs[1], ft = useState(""), fSet = ft[0], setFSet = ft[1], fq = useState(""), fQ = fq[0], setFQ = fq[1];
  var od = useState("d-"), ord = od[0], setOrd = od[1], gr = useState(""), grupo = gr[0], setGrupo = gr[1], fc = useState({}), fechados = fc[0], setFechados = fc[1];
  var todas = melLista(s), minhas = todas.filter(function(x){ return x.porId===s.usuario; });
  var base = gere && vis==="todas" ? todas : minhas, q = busca.trim().toLowerCase();
  var lista = base.filter(function(x){ return (!fSit || x.situacao===fSit) && (!fSet || x.setor===fSet) && (!fQ || x.por===fQ) && (!q || (x.titulo+" "+x.desc+" "+x.por+" "+x.url+" "+x.setor).toLowerCase().indexOf(q)>=0); });
  var campoOrd = ord.slice(0, -1), sentido = ord.slice(-1)==="-" ? -1 : 1;
  var valor = function(x){ return campoOrd==="d" ? x.em : campoOrd==="q" ? (x.por||"").toLowerCase() : campoOrd==="s" ? (x.setor||"").toLowerCase() : SITUACOES.indexOf(x.situacao); };
  lista = lista.slice().sort(function(a, b){ var va = valor(a), vb = valor(b); return (va<vb ? -1 : va>vb ? 1 : 0)*sentido || (a.em<b.em ? 1 : -1); });
  var setores = Array.from(new Set(base.map(function(x){ return x.setor; }).filter(Boolean))).sort(), pessoas = Array.from(new Set(base.map(function(x){ return x.por; }).filter(Boolean))).sort();
  var aberto = sel && todas.find(function(x){ return x.id===sel && (gere || x.porId===s.usuario); });
  var limpa = busca || fSit || fSet || fQ;
  var zm = useState(null), zoom = zm[0], setZoom = zm[1];
  useEffect(function(){ if(!zoom) return undefined; var f = function(ev){ if(ev.key==="Escape") setZoom(null); }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [zoom]);
  useEffect(function(){ if(!novo && !aberto) return undefined; var f = function(ev){ if(ev.key==="Escape" && !zoom){ setNovo(false); setSel(null); } }; window.addEventListener("keydown", f); return function(){ window.removeEventListener("keydown", f); }; }, [novo, aberto, zoom]);
  // o pedido abre em janela grande: pedido e print pequeno à esquerda, chat à direita; o print amplia com um clique
  var abrir = function(id){ setNovo(false); setSel(id); };
  var agora = Date.now();
  var fila = gere && vis==="todas" ? base.map(function(x){ return {x:x, dias:melEspera(s, x, agora)}; }).filter(function(y){ return y.dias!==null; }).sort(function(a, b){ return b.dias-a.dias; }).slice(0, 3) : [];
  var janela = (novo || aberto) && e("div",{className:"fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-3 md:p-6", role:"dialog", "aria-modal":"true", onMouseDown:function(ev){ if(ev.target===ev.currentTarget){ setNovo(false); setSel(null); } }},
    e("div",{className:"my-auto w-full max-w-[780px]"},
      novo ? e(NovaConversa,{s:s, d:d, fechar:function(){ setNovo(false); }, onEnviou:function(id){ setNovo(false); setSel(id); }}) : e(Detalhe,{x:aberto, s:s, d:d, zoom:function(src, nome){ setZoom({src:src, nome:nome}); }, fechar:function(){ setSel(null); }})));
  var cols = [{t:"Data", w:104, c:true}, {t:"Setor", w:150, c:true}, {t:"Funcionária", w:160, c:true}, {t:"Tipo", w:150, c:true}, {t:"Situação", w:190, c:true}, {t:"Tela", w:70, c:true}, {t:"Descrição", c:true}].concat(gere ? [{t:"Conversa do Claude", w:185, c:true}] : []);
  var quandoCurto2 = function(iso){ try { return new Date(iso).toLocaleString("pt-BR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"}); } catch(x){ return iso; } };
  // célula centralizada que quebra a linha: o texto aparece inteiro, nada fica resumido com "…"
  var cel = function(cls, filho){ return e("td",{className:"h-9 whitespace-nowrap border-b border-border px-2.5 text-center align-middle "+(cls||"")}, filho); };
  var etiqueta = function(z){ return e("span",{className:"inline-flex h-6 items-center whitespace-nowrap rounded-full border px-2.5 text-[12px] font-semibold "+COR_SIT[z]}, z); };
  var tabela = function(itens, semCol){
    var uso = cols.filter(function(c){ return c.t!==semCol; });
    return e(TabelaP,{minW:gere ? 1485 : 1300, cols:uso, cab:"bg-[#2b4a73]"},
      itens.map(function(x){
        return e(Tr,{key:x.id, onClick:function(){ abrir(x.id); }},
          cel("", quandoCurto2(x.em)), semCol!=="Setor" && cel("", x.setor), semCol!=="Funcionária" && cel("", e("span",{className:"inline-flex items-center gap-1.5"}, e(Avatar,{id:contatoDoLogin(x.porId), nome:x.por, s:24}), x.por)),
          cel("", melTipoNome(x.tipo) || "—"), cel("", etiqueta(x.situacao)), cel("", e(AbrirTela,{url:x.url})), cel("", resumo(x.desc || x.titulo)),
          gere && cel("", e(CelClaude,{key:x.id+(x.claude||""), x:x, s:s, d:d, gere:gere}))); }));
  };
  var corpo;
  if(!lista.length) corpo = e("p",{className:"py-4 text-center text-[13px]"}, base.length ? "Nenhum chamado com este filtro." : "Nenhum chamado ainda.");
  else if(!grupo) corpo = tabela(lista, "");
  else {
    var campoG = grupo==="s" ? "setor" : "por", semC = grupo==="s" ? "Setor" : "Funcionária", gs = {};
    lista.forEach(function(x){ var k = x[campoG] || "Sem "+(grupo==="s" ? "setor" : "nome"); (gs[k] = gs[k] || []).push(x); });
    corpo = e("div",{className:"flex flex-col gap-2"}, Object.keys(gs).sort().map(function(k){ var it = gs[k], fechado = !!fechados[k], abertos = it.filter(function(x){ return melAberta(x.situacao); }).length;
      return e("section",{key:k, className:"flex flex-col gap-1"},
        e("button",{type:"button", onClick:function(){ var o = Object.assign({}, fechados); o[k] = !fechado; setFechados(o); }, "aria-expanded":!fechado, className:"flex h-9 items-center gap-3 rounded-md border border-border bg-card px-3 text-left text-[13px] hover:bg-white/10"},
          e("b",null, (fechado ? "▸ " : "▾ ")+k), grupo==="q" && e("span",null, it[0].setor), e("span",{className:"ml-auto"}, it.length+(it.length===1 ? " pedido" : " pedidos")+" · "+abertos+" em aberto")),
        !fechado && tabela(it, semC)); }));
  }
  return e(Pagina,null,
    zoom && e("div",{className:"fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/85 p-4", role:"dialog", "aria-modal":"true", onClick:function(){ setZoom(null); }},
      e("img",{src:zoom.src, alt:"Print ampliado", className:"max-h-full max-w-full rounded-lg border border-border object-contain"}),
      e("div",{className:"absolute right-4 top-4 flex items-center gap-1.5"}, e(BotoesFoto,{src:zoom.src, nome:zoom.nome||"foto.jpg"}), e("button",{type:"button", onClick:function(){ setZoom(null); }, className:"h-8 rounded-md bg-card px-3 text-[13px] font-semibold ring-1 ring-border"}, "Fechar ✕"))),
    janela,
    e(PageHead,{t:"Chamados", sub:gere ? "Só você e o Leonardo respondem." : "Quem responde: Marcus e Leonardo."},
      gere && e(Segmentado,{opcoes:[["todas","Todas"], ["minhas","Minhas"]], atual:vis, onMudar:setVis}),
      e(Botao,{principal:true, onClick:function(){ setSel(null); setNovo(true); }}, "Novo chamado")),
    gere && vis==="todas" && e("div",{className:"grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-4"},
      e(Ranking,{t:"Setores que mais pedem", itens:ranking(base, "setor"), onEscolher:setFSet}),
      e(Ranking,{t:"Funcionárias que mais pedem", itens:ranking(base, "por"), onEscolher:setFQ}),
      e(Ranking,{t:"Telas mais pedidas", itens:ranking(base, "url"), onEscolher:setBusca}),
      e(Cartao,{t:"Esperando resposta"},
        fila.length===0 ? e("p",{className:"py-1 text-[13px]"}, "Nada esperando resposta.")
        : e("div",{className:"flex flex-col"}, fila.map(function(y){
            return e("button",{key:y.x.id, type:"button", onClick:function(){ abrir(y.x.id); }, title:y.x.titulo, className:"grid min-h-6 w-full grid-cols-[4.25rem_minmax(0,1fr)] items-center gap-2 rounded py-0.5 text-left text-[13px] leading-tight hover:bg-white/10"},
              e("b",{className:y.dias>=3 ? "text-destructive" : "text-yellow-400"}, y.dias ? "há "+y.dias+(y.dias===1 ? " dia" : " dias") : "hoje"), e("span",{className:"break-words"}, y.x.titulo)); })))),
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("input",{type:"search", "aria-label":"Buscar", value:busca, placeholder:"Buscar descrição, pessoa, setor ou tela", onChange:function(ev){ setBusca(ev.target.value); }, className:CAMPO+" min-w-72 flex-1"}),
      e("select",{"aria-label":"Situação", title:"Situação", value:fSit, onChange:function(ev){ setFSit(ev.target.value); }, className:CAMPO+" w-auto! min-w-32"}, [["", "Todas as situações"]].concat(SITUACOES.map(function(z){ return [z, z]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      e("select",{"aria-label":"Setor", title:"Setor", value:fSet, onChange:function(ev){ setFSet(ev.target.value); }, className:CAMPO+" w-auto! min-w-32"}, [["", "Todos os setores"]].concat(setores.map(function(z){ return [z, z]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      e("select",{"aria-label":"Funcionária", title:"Funcionária", value:fQ, onChange:function(ev){ setFQ(ev.target.value); }, className:CAMPO+" w-auto! min-w-32"}, [["", "Todas as funcionárias"]].concat(pessoas.map(function(z){ return [z, z]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      e("select",{"aria-label":"Ordenar por", title:"Ordenar por", value:ord, onChange:function(ev){ setOrd(ev.target.value); }, className:CAMPO+" w-auto! min-w-32"}, ORDENS.map(function(o){ return [o[0], "Ordenar: "+o[1]]; }).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      e("select",{"aria-label":"Agrupar por", title:"Agrupar por", value:grupo, onChange:function(ev){ setGrupo(ev.target.value); }, className:CAMPO+" w-auto! min-w-32"}, [["", "Sem agrupar"], ["s", "Agrupar por setor"], ["q", "Agrupar por funcionária"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
      limpa && e(Botao,{onClick:function(){ setBusca(""); setFSit(""); setFSet(""); setFQ(""); }}, "Limpar")),
    corpo);
}

export { AbaMelhorias, NovaConversa };
