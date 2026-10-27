// Sorelly Admin · montagem — components/chat/chat-fotos.js
// "Fotos da equipe": um lugar só para colocar e trocar a foto de qualquer funcionário, representante ou grupo, sem entrar nas conversas.
// Quem acessa: Direção e Marketing (podeEditarFotos em chat-contatos.js).
import { api, fotoDe, guardarMidia, lerMidia, useChat } from "@/apps/montagem/domain/chat-store";
import { CONTATOS, sem } from "@/apps/montagem/domain/chat-contatos";
import { FotoEditavel } from "@/apps/montagem/components/chat/chat-info";
import { Avatar, Ph, W, Vazio } from "@/apps/montagem/components/chat/chat-ui";
import { e, useState } from "@/shared/react";

function Cartao(p){
  var tem = !!p.foto;
  return e(FotoEditavel,{pode:true, fotoAtual:p.foto, titulo:p.titulo, aoSalvar:p.aoSalvar, aoRemover:p.aoRemover, trigger:function(abrir){
    return e("button",{onClick:abrir, className:"group flex w-full flex-col items-center gap-2 rounded-xl p-3 text-center transition-colors hover:bg-white/5", style:{background:W.painel, border:"1px solid "+W.borda}, "aria-label":(tem ? "Trocar a foto de " : "Colocar foto em ")+p.nome},
      e("span",{className:"relative"}, p.avatar, e("span",{className:"absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:tem ? "pencil-simple" : "camera", s:14, fill:true, style:{color:"#fff"}}))),
      e("span",{className:"w-full truncate text-[12.5px] font-semibold"}, p.nome), e("span",{className:"w-full truncate text-[10.5px]", style:{color:W.sec}}, p.sub),
      e("span",{className:"rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold", style:{background:tem ? "#103529" : "#3a2f12", color:tem ? "#25d366" : W.ouro}}, tem ? "Trocar foto" : "Colocar foto")); }});
}

function FotosEquipe(){
  var st = useChat(), bq = useState(""), busca = bq[0], setBusca = bq[1], sf = useState("todos"), setor = sf[0], setSetor = sf[1], so = useState(false), soSem = so[0], setSoSem = so[1];
  var q = sem(busca);
  var setores = Array.from(new Set(CONTATOS.map(function(c){ return c.setorCurto; }))).sort(function(a,b){ return a.localeCompare(b); });
  var lista = CONTATOS.filter(function(c){ return (setor==="todos" || c.setorCurto===setor) && (!q || sem(c.completo).indexOf(q)>=0 || sem(c.setorCurto).indexOf(q)>=0) && (!soSem || !fotoDe(c.id)); });
  var grupos = st.convs.filter(function(c){ return c.tipo==="grupo" && (!q || sem(c.nome).indexOf(q)>=0) && (!soSem || !c.foto) && setor==="todos"; });
  var comFoto = CONTATOS.filter(function(c){ return fotoDe(c.id); }).length;
  var campo = {background:W.campo, color:W.texto};
  return e("div",{className:"flex flex-col gap-4", style:{color:W.texto}},
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("div",{className:"flex h-10 min-w-56 flex-1 items-center gap-2 rounded-lg px-3", style:campo}, e(Ph,{n:"magnifying-glass", s:17, style:{color:W.sec}}),
        e("input",{value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar pessoa, setor ou grupo", "aria-label":"Buscar", className:"min-w-0 flex-1 bg-transparent text-[13px] outline-none"})),
      e("select",{value:setor, onChange:function(ev){ setSetor(ev.target.value); }, "aria-label":"Filtrar por setor", className:"h-10 rounded-lg px-3 text-[13px] outline-none", style:campo},
        e("option",{value:"todos"}, "Todos os setores"), setores.map(function(s){ return e("option",{key:s, value:s}, s); })),
      e("button",{onClick:function(){ setSoSem(!soSem); }, className:"flex h-10 items-center gap-2 rounded-lg px-3 text-[13px]", style:{background:soSem ? "#3a2f12" : W.campo, color:soSem ? W.ouro : W.texto}}, e(Ph,{n:soSem ? "check-square" : "square", s:17}), "Só quem está sem foto")),
    e("p",{className:"text-[12px]", style:{color:W.sec}}, comFoto+" de "+CONTATOS.length+" pessoas já têm foto. Clique em quem quiser para colocar ou trocar; dá para arrastar e dar zoom antes de salvar."),
    grupos.length>0 && e("section",{className:"flex flex-col gap-2"}, e("h3",{className:"text-[11.5px] font-semibold uppercase tracking-wide", style:{color:W.ouro}}, "Grupos"),
      e("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"}, grupos.map(function(g){
        return e(Cartao,{key:g.id, nome:g.nome, sub:g.membros.length+" participantes", foto:g.foto ? lerMidia(g.foto) : null, titulo:"Foto do grupo "+g.nome, avatar:e(Avatar,{grupo:true, nome:g.nome, foto:g.foto, s:72}),
          aoSalvar:function(u){ api.updateGroup(g.id, {foto:guardarMidia(u)}); }, aoRemover:function(){ api.updateGroup(g.id, {foto:null}); }}); }))),
    e("section",{className:"flex flex-col gap-2"}, e("h3",{className:"text-[11.5px] font-semibold uppercase tracking-wide", style:{color:W.ouro}}, "Equipe e representantes ("+lista.length+")"),
      !lista.length ? e(Vazio,{n:"image"}, "Ninguém encontrado.") :
      e("div",{className:"grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"}, lista.map(function(c){
        return e(Cartao,{key:c.id, nome:c.nome, sub:c.setorCurto, foto:fotoDe(c.id), titulo:"Foto de "+c.nome, avatar:e(Avatar,{id:c.id, s:72}),
          aoSalvar:function(u){ api.setFoto(c.id, u); }, aoRemover:function(){ api.setFoto(c.id, null); }}); }))));
}
export { FotosEquipe };
