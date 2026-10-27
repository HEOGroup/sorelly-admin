// Sorelly Admin · montagem — pages/encomendas/janelas.js
// Janelas do setor reunidas em um componente só (usado pelas telas Ida na empresa, Top 50 e Representantes). O Funil usa as mesmas janelas direto.
//   <Janelas E={useEr()} modal={estado} ir={fn(m)}/>   tipos: novo, motivo, agendar, atender, detalhe, revs, bloquear
import { Dinheiro, Janela } from "@/apps/montagem/components/padrao";
import { linkPedidos, mensagemSolicitacao } from "@/apps/montagem/domain/encomendas";
import { Agendar, Atender, Detalhe, Motivo, NovoPedido, Revendedoras } from "@/apps/montagem/pages/encomendas/Quadro";
import { Bt, Escolha, Painel, copiar } from "@/apps/montagem/pages/encomendas/visual";
import { Campo } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var CAMPO = INPUT+" w-full text-center";

// bloqueio manual (ex.: insistiu em áudio): motivo e meses
function Bloquear(p){
  var r = p.E.er.revendedoras.find(function(x){ return x.id===p.id; }), st = useState({motivo:"Insistiu em áudio", meses:3}), v = st[0];
  if(!r) return null;
  var ok = function(){ if(p.E.exec("bloqueio_manual", {id:p.id, motivo:v.motivo, meses:v.meses})) p.fechar(); };
  return e(Janela,{t:"Bloquear revendedora", sub:r.nome, fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Bloqueio", ic:"lock-key", estado:"atual"},
        e(Campo,{rot:"Motivo *"}, e("input",{type:"text", value:v.motivo, onChange:function(ev){ st[1](Object.assign({}, v, {motivo:ev.target.value})); }, className:CAMPO})),
        e(Campo,{rot:"Meses de bloqueio"}, e(Escolha,{v:v.meses, set:function(m){ st[1](Object.assign({}, v, {meses:m})); }, ops:[[1, "1"], [3, "3"], [6, "6"], [12, "12"]]}))),
      e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"perigo", ic:"lock-key", disabled:!v.motivo.trim(), onClick:ok}, "Bloquear"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// caixa com a mensagem pronta para copiar (pedido de autorização ao Marcus)
function CaixaMensagem(p){
  var st = useState(false);
  return e("div",{className:"flex flex-col gap-2"},
    e("pre",{className:"whitespace-pre-wrap break-words rounded-lg bg-black/30 p-2.5 text-left font-sans text-[12.5px] leading-snug text-white/90"}, p.texto),
    e(Bt,{tipo:"forte", ic:st[0] ? "check" : "copy", onClick:function(){ if(copiar(p.texto)){ st[1](true); setTimeout(function(){ st[1](false); }, 2000); } }}, st[0] ? "Copiado" : "Copiar mensagem"));
}

// retirar do Top 50: pede o motivo; se a revendedora é do Marcus, vira pedido de autorização com mensagem pronta
var MOTIVOS = ["Média baixa", "Não faz solicitações", "Só manda áudios"];
function Retirar(p){
  var r = p.E.er.revendedoras.find(function(x){ return x.id===p.id; }), st = useState({motivo:"", enviado:false}), v = st[0];
  if(!r) return null;
  var pedido = !p.E.pode;   // só a diretoria tira direto; o setor sempre pede ao Marcus
  var texto = mensagemSolicitacao(p.E.cfg, {tipo:"sair", nome:r.nome, telefone:r.telefone, representante:r.representante, media:r.media3m, motivo:v.motivo, por:p.E.por}, linkPedidos());
  var ok = function(){ if(p.E.exec("top50_retirar", {id:r.id, motivo:v.motivo})){ if(pedido) st[1](Object.assign({}, v, {enviado:true})); else p.fechar(); } };
  return e(Janela,{t:"Retirar do Top 50", sub:r.nome+(r.marcus ? " · selecionada pelo Marcus" : ""), fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Motivo", ic:"note-pencil", estado:v.enviado ? "feito" : "atual"},
        e(Escolha,{v:"", set:function(m){ st[1](Object.assign({}, v, {motivo:m})); }, ops:MOTIVOS.map(function(m){ return [m, m]; })}),
        e(Campo,{rot:"Escreva o motivo *"}, e("textarea",{value:v.motivo, rows:4, disabled:v.enviado, placeholder:"Ex.: média abaixo de R$ 3.000, só manda áudios...", onChange:function(ev){ st[1](Object.assign({}, v, {motivo:ev.target.value})); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"})),
        pedido && e("p",{className:"text-[12px] text-white/70"}, "A saída do Top 50 precisa da autorização do Marcus: escreva o motivo e envie a mensagem com o link.")),
      v.enviado ? e(Painel,{key:"m", t:"Mensagem para o Marcus", ic:"paper-plane-tilt", estado:"atual"}, e(CaixaMensagem,{texto:texto}), e(Bt,{ic:"check", onClick:p.fechar}, "Concluir"))
        : e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"perigo", ic:"sign-out", disabled:!v.motivo.trim(), onClick:ok}, pedido ? "Pedir autorização" : "Retirar do Top 50"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// pedir entrada no Top 50: nome, telefone, representante, média e motivo; gera a mensagem para o Marcus autorizar
function Solicitar(p){
  var base = p.id ? p.E.er.revendedoras.find(function(x){ return x.id===p.id; }) : null;
  var st = useState({nome:base ? base.nome : "", telefone:base ? (base.telefone || "") : "", representante:base ? (base.representante || "") : "", media:base ? (base.media3m || 0) : 0, motivo:"", enviado:false}), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var texto = mensagemSolicitacao(p.E.cfg, {tipo:"entrar", nome:v.nome, telefone:v.telefone, representante:v.representante, media:v.media, motivo:v.motivo, por:p.E.por}, linkPedidos());
  var ok = function(){ if(p.E.exec("top50_solicitar", {nome:v.nome, telefone:v.telefone, representante:v.representante, media:v.media, motivo:v.motivo})) set("enviado", true); };
  var txt = function(k, rot, obrig){ return e(Campo,{rot:rot+(obrig ? " *" : "")}, e("input",{type:"text", value:v[k], disabled:v.enviado, onChange:function(ev){ set(k, ev.target.value); }, className:CAMPO})); };
  return e(Janela,{t:"Pedir entrada no Top 50", sub:"Preencha e envie a mensagem para o Marcus autorizar.", fechar:p.fechar,
    colunas:[e(Painel,{key:"a", t:"Revendedora", ic:"user-circle", estado:v.enviado ? "feito" : "atual"},
        txt("nome", "Nome", true), txt("telefone", "Telefone"), txt("representante", "Representante", true),
        e(Campo,{rot:"Média de vendas"}, e(Dinheiro,{value:v.media, label:"Média", onChange:function(x){ set("media", x); }})),
        e(Campo,{rot:"Motivo *"}, e("textarea",{value:v.motivo, rows:3, disabled:v.enviado, placeholder:"Por que ela deve entrar?", onChange:function(ev){ set("motivo", ev.target.value); }, className:INPUT+" h-auto! w-full resize-none py-2 text-center"}))),
      v.enviado ? e(Painel,{key:"m", t:"Mensagem para o Marcus", ic:"paper-plane-tilt", estado:"atual"}, e(CaixaMensagem,{texto:texto}), e(Bt,{ic:"check", onClick:p.fechar}, "Concluir"))
        : e(Painel,{key:"b", t:"Ações", ic:"gear"}, e(Bt,{tipo:"forte", ic:"paper-plane-tilt", disabled:!v.nome.trim() || !v.representante.trim() || !v.motivo.trim(), onClick:ok}, "Registrar e gerar mensagem"), e(Bt,{ic:"x", onClick:p.fechar}, "Cancelar"))]});
}

// ver a mensagem de um pedido já registrado
function MsgSol(p){
  var so = p.E.er.top50Sol.find(function(x){ return x.id===p.id; }); if(!so) return null;
  return e(Janela,{t:so.tipo==="entrar" ? "Pedido de entrada no Top 50" : "Pedido de saída do Top 50", sub:so.nome, fechar:p.fechar,
    colunas:[e(Painel,{key:"m", t:"Mensagem para o Marcus", ic:"paper-plane-tilt", estado:"atual"}, e(CaixaMensagem,{texto:mensagemSolicitacao(p.E.cfg, so, linkPedidos())}), e(Bt,{ic:"x", onClick:p.fechar}, "Fechar"))]});
}

function Janelas(p){
  var E = p.E, m = p.modal, ir = p.ir, fechar = function(){ ir(null); };
  if(!m) return null;
  if(m.tipo==="novo") return e(NovoPedido,{E:E, fechar:fechar});
  if(m.tipo==="motivo") return e(Motivo,{E:E, id:m.id, fechar:fechar});
  if(m.tipo==="agendar") return e(Agendar,{E:E, id:m.id, mover:m.mover, fechar:fechar});
  if(m.tipo==="atender") return e(Atender,{E:E, id:m.id, fechar:fechar});
  if(m.tipo==="detalhe") return e(Detalhe,{E:E, id:m.id, ir:ir, fechar:fechar});
  if(m.tipo==="revs") return e(Revendedoras,{E:E, fechar:fechar});
  if(m.tipo==="bloquear") return e(Bloquear,{E:E, id:m.id, fechar:fechar});
  if(m.tipo==="retirar") return e(Retirar,{E:E, id:m.id, fechar:fechar});
  if(m.tipo==="solicitar") return e(Solicitar,{E:E, id:m.id, fechar:fechar});
  if(m.tipo==="msgsol") return e(MsgSol,{E:E, id:m.id, fechar:fechar});
  return null;
}
export { Janelas, Bloquear };
