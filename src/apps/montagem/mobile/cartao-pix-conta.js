// Sorelly Admin · montagem — mobile/cartao-pix-conta.js
// App da representante: quando o financeiro responde a conta de um Pix, o cartão mostra a chave Pix (banco, empresa, CNPJ e a chave) para ela passar à revendedora, com dois botões: copiar a mensagem pronta e copiar só a chave (Marcus, 04/11/2026).
import { contaPadrao, mensagemPixPadrao } from "@/apps/montagem/lib/mensagem-pix";
import { dadosDaConta } from "@/apps/montagem/lib/chave-da-parte";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var ROT_TIPO = {CNPJ:"CNPJ", CPF:"CPF", EMAIL:"E-mail", TELEFONE:"Telefone", ALEATORIA:"Aleatória"};
var BTN = "h-8 flex-1 rounded-lg text-[13px] ring-1 ring-[#C9A13B]/60";

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
  var msg = {conta:p.rotulo, numerario:d.numerario || "", valor:p.valor, favorecido:d.empresa, tipo:d.tipo, chave:d.chave};   // mesma mensagem padrão do Financeiro (lib/mensagem-pix.js)
  var pc = String(p.rotulo||"").split(" - "), contaCurta = contaPadrao(p.rotulo) || p.rotulo;
  var lin = function(r, v, mono){ return e("div",{className:"box-border flex min-h-[26px] w-full items-center justify-between gap-3 border-b border-[#C9A13B]/30 px-2 text-[13px]"}, e("span",{className:"shrink-0 text-[#6B7280]"}, r), e("span",{className:"min-w-0 text-right text-[#111827]"+(mono ? " break-all font-mono" : "")}, v)); };
  return e("div",{className:"box-border flex w-full min-w-0 flex-col bg-white text-[#111827]"},
    lin("Conta", contaCurta), lin("Beneficiário", msg.favorecido || "—"), lin("Tipo de chave", ROT_TIPO[d.tipo] || "Pix"), lin("Chave Pix", d.chave, true),
    !msg.numerario && e("span",{className:"px-2 py-1 text-[13px]"}, AVISO_SEM_NUM),
    e("div",{className:"box-border flex w-full min-w-0 items-stretch gap-1.5 p-1.5"},
      e(BotaoCopiar,{texto:mensagemPixPadrao(msg), rot:"Copiar Pix"}),
      p.lado));
}
export { CartaoPixConta };
