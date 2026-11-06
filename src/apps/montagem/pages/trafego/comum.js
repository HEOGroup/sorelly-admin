// Sorelly Admin · montagem — pages/trafego/comum.js
// Peças pequenas do Tráfego pago (formatos, coluna de tabela, campo de número, quem lançou). Contas em domain/trafego.js (estado s.tp, ação TP).
import { CAMPO, Rotulo, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { e } from "@/shared/react";

// valor que não existe (conta sem denominador, dado não lançado) aparece como "—", nunca como 0
var R$ = function(v){ return v==null ? "—" : brl(v); };
var PCT = function(v){ return v==null ? "—" : v.toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%"; };
var N = function(v){ return v==null ? "—" : inteiro(v); };
// coluna da TabelaPlanilha: f(valor, linha) formata; o mesmo texto vale para a célula e para a lista do filtro. sep = linha grossa à esquerda (separa grupos)
function col(k, t, f, sep){ return {k:k, t:t, sep:sep, fmt:f, render:f}; }

// quem está logado (para gravar "por")
function porDe(s){ try { return nomeDe(s.usuario); } catch(x){ return "—"; } }

// campo de número inteiro com rótulo em cima (mesma altura dos outros campos: 32 px)
function CampoNum(p){
  return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t, id:p.id}),
    e("input",{id:p.id, type:"number", min:0, step:1, inputMode:"numeric", value:p.value, onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}
function CampoTexto(p){
  return e("div",{className:"min-w-0 "+(p.cls||"")}, e(Rotulo,{t:p.t, id:p.id}),
    e("input",{id:p.id, type:p.tipo||"text", value:p.value, max:p.max, maxLength:p.maxLength, placeholder:p.placeholder||"", onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}
// campo de dinheiro (digita só números, o valor sobe: 195000 vira R$ 1.950,00), com rótulo e a altura de 32 px dos outros campos
function CampoDin(p){
  return e("div",{className:"min-w-0"}, e(Rotulo,{t:p.t, id:p.id}),
    e(CampoDinheiro,{value:p.value, label:p.t, className:CAMPO+" text-center tabular-nums", onChange:p.onChange}));
}
var diaAnterior = function(iso){ var d = new Date(iso+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()-1); return d.toISOString().slice(0, 10); };

export { R$, PCT, N, col, porDe, CampoNum, CampoTexto, CampoDin, diaAnterior };
