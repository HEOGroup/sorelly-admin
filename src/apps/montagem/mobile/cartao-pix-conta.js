// Sorelly Admin · montagem — mobile/cartao-pix-conta.js
// App da representante: quando o financeiro responde a conta de um Pix, o cartão mostra a chave Pix (banco, empresa, CNPJ e a chave) para ela passar à revendedora, com dois botões: copiar a mensagem pronta e copiar só a chave (Marcus, 04/11/2026).
import { AVISO_COMPROVANTE, mensagemPixPadrao } from "@/apps/montagem/lib/mensagem-pix";
import { BKC } from "@/apps/montagem/lib/format";
import { dadosDaConta } from "@/apps/montagem/lib/chave-da-parte";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var ROT_TIPO = {CNPJ:"CNPJ", CPF:"CPF", EMAIL:"E-mail", TELEFONE:"Telefone", ALEATORIA:"Aleatória"};
var BTN = "h-8 flex-1 rounded-lg text-[13px] font-bold ring-1 ring-[#CA8A04]";

function BotaoCopiar(p){
  var st = useState(0), ok = st[0];   // 0 normal, 1 copiou, 2 o aparelho não deixou
  var fim = function(v){ st[1](v); setTimeout(function(){ st[1](0); }, 1800); };
  var copiar = function(){
    var txt = p.texto;
    var antigo = function(){ var ta = document.createElement("textarea"), certo = false; ta.value = txt; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.focus(); ta.select(); try { certo = document.execCommand("copy"); } catch(x){} document.body.removeChild(ta); fim(certo ? 1 : 2); };
    try { navigator.clipboard.writeText(txt).then(function(){ fim(1); }, antigo); } catch(x){ antigo(); }
  };
  return e("button",{type:"button", onClick:copiar, className:BTN, style:{background:"#F6EFDF", color:"#7A5D12"}}, ok===1 ? "Copiado ✓" : ok===2 ? "Não copiou" : p.rot);
}

// 26/11/2026 (Marcus): conta da empresa OU destino do Direcionar (prestador, sócio, fornecedor, representante): a leitura é a mesma do Atendimento interno (lib/chave-da-parte.js).
var AVISO_SEM_NUM = "Numerário não ligado a esta conta. Avise o financeiro antes de pagar.";

function CartaoPixConta(p){
  var cx = use(), d = dadosDaConta(cx.state, p.rotulo);
  if(!d || d.semChave) return e("div",{className:"mt-1 flex flex-col gap-1 text-[13px]"}, e("span",null, "Conta: "+p.rotulo+". A chave Pix desta conta ainda não está cadastrada no Financeiro. Avise o financeiro."), p.lado && e("div",{className:"flex"}, p.lado));
  var msg = {numerario:d.numerario || "", valor:p.valor, favorecido:d.empresa, tipo:d.tipo, chave:d.chave};   // mesma mensagem padrão do Financeiro (lib/mensagem-pix.js)
  return e("div",{className:"mt-1 flex flex-col gap-1 rounded-lg border border-[#CA8A04]/60 px-2.5 py-1.5 text-[13px]"},
    e("b",{className:"font-semibold"}, AVISO_COMPROVANTE),
    e("span",{className:"font-semibold"}, "Escrever na folha/Sistema:"),
    e("span",{className:msg.numerario ? "" : "font-bold"}, msg.numerario || AVISO_SEM_NUM),
    msg.valor>0 && e("span",null, "Valor a pagar: "+BKC(msg.valor)),
    e("span",{className:"font-semibold"}, "Chave Pix:"),
    msg.favorecido && e("span",null, msg.favorecido),
    e("span",null, ROT_TIPO[d.tipo] || "Pix"),
    e("span",{className:"break-all font-mono text-[13px] font-bold", "aria-label":"Chave Pix"}, d.chave),
    e("div",{className:"mt-0.5 flex items-stretch gap-1.5"},
      e(BotaoCopiar,{texto:mensagemPixPadrao(msg), rot:"Copiar"}),
      p.lado));   // Copiar (a mensagem com a chave) e Anexar comprovante, numa linha só (Marcus, 04/11/2026)
}
export { CartaoPixConta };
