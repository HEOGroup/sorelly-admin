// Sorelly Admin · montagem — components/chat/chat-config.js
// Configurações do SorellyChat: sons (volume, mudo), chave das representantes, expediente e prazo de resposta por setor.
import { api, estaOcupado, fotoDe, restaurarDemo, useChat } from "@/apps/montagem/domain/chat-store";
import { FotoEditavel } from "@/apps/montagem/components/chat/chat-info";
import { CONTATOS, contato } from "@/apps/montagem/domain/chat-contatos";
import * as sons from "@/apps/montagem/lib/sons";
import { SeletorFundo } from "@/apps/montagem/components/chat/chat-fundos";
import { Avatar, Ph, W } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useState } from "@/shared/react";

var SETORES = Array.from(new Set(CONTATOS.map(function(c){ return c.setor; }))).sort(function(a,b){ return a.localeCompare(b); });
var DIAS = [["D",0],["S",1],["T",2],["Q",3],["Q",4],["S",5],["S",6]];
function Bloco(p){ return e("section",{className:"flex flex-col gap-3 rounded-xl p-4", style:{background:W.painel, border:"1px solid "+W.borda}}, e("h3",{className:"flex items-center gap-2 text-[14px] font-semibold"}, e(Ph,{n:p.ic, s:18, fill:true, style:{color:W.verde}}), p.t), p.children); }
function Chave(p){ return e("button",{role:"switch", "aria-checked":p.on, onClick:function(){ p.set(!p.on); }, disabled:p.desligado, className:"relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40", style:{background:p.on ? W.verde : "#3b4a54"}}, e("span",{className:"absolute top-0.5 size-5 rounded-full bg-white transition-all", style:{left:p.on ? 22 : 2}})); }
var campo = {background:W.campo, color:W.texto};

function ConfigChat(p){
  var st = useChat(), cfg = st.config, direcao = p.direcao;
  var sc = useState(sons.config()), s = sc[0], setS = sc[1];
  useEffect(function(){ return sons.assinar(function(){ setS(sons.config()); }); }, []);
  var linhaAjuste = function(t, sub, ctrl){ return e("div",{className:"flex items-center justify-between gap-4"}, e("div",{className:"min-w-0"}, e("p",{className:"text-[13.5px]"}, t), sub && e("p",{className:"text-[11.5px]", style:{color:W.sec}}, sub)), ctrl); };
  var teste = [["enviar","Enviar"],["receber","Receber"],["mencao","@Menção"],["atraso","Atraso"],["concluir","Concluir"],["erro","Erro"],["clique","Clique"]];
  return e("div",{className:"grid gap-4 lg:grid-cols-2", style:{color:W.texto}},
    p.modo!=="admin" && p.eu && e(Bloco,{t:"Meu perfil", ic:"user-circle"},
      e("div",{className:"flex items-center gap-4"},
        e(FotoEditavel,{pode:true, fotoAtual:fotoDe(p.eu), titulo:"Minha foto", aoSalvar:function(u){ api.setFoto(p.eu, u); }, aoRemover:function(){ api.setFoto(p.eu, null); }, trigger:function(abrir){ return e("button",{onClick:abrir, "aria-label":"Ver ou trocar minha foto", className:"relative"}, e(Avatar,{id:p.eu, s:72}), e("span",{className:"absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full", style:{background:W.verde}}, e(Ph,{n:"camera", s:14, fill:true, style:{color:"#fff"}}))); }}),
        e("div",{className:"min-w-0"}, e("p",{className:"text-[15px] font-semibold"}, contato(p.eu).completo), e("p",{className:"text-[12px]", style:{color:W.sec}}, contato(p.eu).setorCurto))),
      linhaAjuste("Ficar ocupado", "Pausa o relógio das marcações enquanto você está ocupado.", e(Chave,{on:estaOcupado(p.eu), set:function(v){ api.setBusy(p.eu, v); }}))),
    p.modo==="admin" && e(Bloco,{t:"Outras telas do SorellyChat", ic:"squares-four"},
      e("div",{className:"flex flex-wrap gap-2"}, [["tempo","Tempo de resposta","timer"],["fotos","Fotos da equipe","image"]].map(function(a){ return e("button",{key:a[0], onClick:function(){ p.irPara(a[0]); }, className:"flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold", style:campo}, e(Ph,{n:a[2], s:18, fill:true, style:{color:W.ouro}}), a[1]); }))),
    p.modo!=="admin" && e(Bloco,{t:"Sons do sistema", ic:"speaker-high"},
      linhaAjuste("Mudo", "Desliga todos os sons.", e(Chave,{on:s.mudo, set:function(v){ sons.mudar({mudo:v}); }})),
      linhaAjuste("Volume", Math.round(s.volume*100)+"%", e("input",{type:"range", min:0, max:100, value:Math.round(s.volume*100), "aria-label":"Volume", className:"w-44 accent-[#00a884]", onChange:function(ev){ sons.mudar({volume:ev.target.value/100}); }, onMouseUp:function(){ sons.tocar("receber"); }, onTouchEnd:function(){ sons.tocar("receber"); }})),
      linhaAjuste("Som de clique nos botões", "Um toque leve em todo botão do sistema.", e(Chave,{on:s.clique, set:function(v){ sons.mudar({clique:v}); }})),
      e("div",{className:"flex flex-wrap gap-2 pt-1"}, teste.map(function(t){ return e("button",{key:t[0], onClick:function(){ sons.tocar(t[0]); }, className:"flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px]", style:campo}, e(Ph,{n:"play", s:13, fill:true}), t[1]); })),
      e("p",{className:"text-[11px]", style:{color:W.sec}}, "O @menção (três notas subindo) e o atraso (sirene grave) são bem diferentes de propósito. Seu ajuste fica salvo neste navegador.")),
    p.modo!=="admin" && e(Bloco,{t:"Fundo das conversas", ic:"image"}, e("p",{className:"text-[11.5px]", style:{color:W.sec}}, "Cada pessoa escolhe o seu. A escolha vale só para você."), e(SeletorFundo)),
    p.modo==="admin" && e(Bloco,{t:"Representantes no chat", ic:"users-three"},
      linhaAjuste("Habilitar representantes", direcao ? "Liga ou desliga o chat para as representantes. Desligado, elas somem dos contatos e dos grupos." : "Só a Direção muda isto.", e(Chave,{on:cfg.representantes, set:function(v){ api.setConfig({representantes:v}); }, desligado:!direcao})),
      e("p",{className:"text-[11.5px]", style:{color:W.sec}}, cfg.representantes ? "Representantes ligadas: aparecem nas conversas e no grupo das representantes." : "Representantes desligadas: nada delas aparece (nem para a Direção).")),
    p.modo==="admin" && e(Bloco,{t:"Expediente (para o relógio das marcações)", ic:"clock"},
      e("div",{className:"flex items-center gap-3"}, e("input",{type:"time", value:cfg.expediente.ini, disabled:!direcao, "aria-label":"Início do expediente", className:"h-10 rounded-lg px-3 text-[13px] outline-none", style:campo, onChange:function(ev){ api.setConfig({expediente:Object.assign({}, cfg.expediente, {ini:ev.target.value})}); }}),
        e("span",{style:{color:W.sec}}, "até"), e("input",{type:"time", value:cfg.expediente.fim, disabled:!direcao, "aria-label":"Fim do expediente", className:"h-10 rounded-lg px-3 text-[13px] outline-none", style:campo, onChange:function(ev){ api.setConfig({expediente:Object.assign({}, cfg.expediente, {fim:ev.target.value})}); }})),
      e("div",{className:"flex items-center gap-3"}, e("span",{className:"text-[12px]", style:{color:W.sec}}, "Almoço"), e("input",{type:"time", value:(cfg.expediente.almoco||{ini:"12:00"}).ini, disabled:!direcao, "aria-label":"Início do almoço", className:"h-10 rounded-lg px-3 text-[13px] outline-none", style:campo, onChange:function(ev){ api.setConfig({expediente:Object.assign({}, cfg.expediente, {almoco:Object.assign({ini:"12:00", fim:"13:00"}, cfg.expediente.almoco, {ini:ev.target.value})})}); }}),
        e("span",{style:{color:W.sec}}, "até"), e("input",{type:"time", value:(cfg.expediente.almoco||{fim:"13:00"}).fim, disabled:!direcao, "aria-label":"Fim do almoço", className:"h-10 rounded-lg px-3 text-[13px] outline-none", style:campo, onChange:function(ev){ api.setConfig({expediente:Object.assign({}, cfg.expediente, {almoco:Object.assign({ini:"12:00", fim:"13:00"}, cfg.expediente.almoco, {fim:ev.target.value})})}); }})),
      e("div",{className:"flex gap-1.5"}, DIAS.map(function(d, i){ var on = cfg.expediente.dias.indexOf(d[1])>=0;
        return e("button",{key:i, disabled:!direcao, onClick:function(){ api.setConfig({expediente:Object.assign({}, cfg.expediente, {dias:on ? cfg.expediente.dias.filter(function(x){ return x!==d[1]; }) : cfg.expediente.dias.concat([d[1]])})}); },
          className:"grid size-9 place-items-center rounded-full text-[12px] font-semibold disabled:opacity-60", style:{background:on ? W.verde : W.campo, color:on ? "#0b141a" : W.sec}}, d[0]); })),
      e("p",{className:"text-[11.5px]", style:{color:W.sec}}, "Fora desse horário (noite, fim de semana) e enquanto a pessoa está \"ocupada\", o relógio da marcação não anda.")),
    p.modo==="admin" && e(Bloco,{t:"Prazo de resposta por setor", ic:"timer"},
      linhaAjuste("Prazo padrão", "Vale para os setores sem prazo próprio.", e("span",{className:"flex items-center gap-2"}, e("input",{type:"number", min:1, max:480, value:cfg.prazoPadrao, disabled:!direcao, "aria-label":"Prazo padrão em minutos", className:"h-9 w-20 rounded-lg px-2 text-center text-[13px] outline-none", style:campo, onChange:function(ev){ api.setConfig({prazoPadrao:Math.max(1, +ev.target.value||30)}); }}), "min")),
      e("div",{className:"grid max-h-72 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2"}, SETORES.map(function(sv){ var v = cfg.prazos[sv];
        return e("label",{key:sv, className:"flex items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-[12px]", style:{background:W.campo}}, e("span",{className:"truncate"}, sv),
          e("input",{type:"number", min:1, max:480, value:v!=null ? v : "", placeholder:String(cfg.prazoPadrao), disabled:!direcao, "aria-label":"Prazo do setor "+sv, className:"h-8 w-16 rounded-md bg-black/25 px-1 text-center outline-none",
            onChange:function(ev){ var n = Object.assign({}, cfg.prazos); if(ev.target.value==="") delete n[sv]; else n[sv] = Math.max(1, +ev.target.value); api.setConfig({prazos:n}); }})); })),
      e("p",{className:"text-[11.5px]", style:{color:W.sec}}, "O prazo de cada marcação é fixado na hora em que a pessoa é marcada. Alertas visuais e sonoros quando estoura.")),
    p.modo==="admin" && direcao && e(Bloco,{t:"Dados de demonstração", ic:"arrow-clockwise"},
      e("p",{className:"text-[12px]", style:{color:W.sec}}, "As conversas deste teste ficam só neste navegador. Para começar do zero com os dados de exemplo:"),
      e("button",{onClick:function(){ if(window.confirm("Apagar as conversas de teste e voltar aos dados de exemplo?")) restaurarDemo(); }, className:"self-start rounded-lg px-4 py-2 text-[12.5px] font-semibold", style:{background:"#3b1f24", color:"#ffb4bd"}}, "Restaurar dados de exemplo")));
}
export { ConfigChat };
