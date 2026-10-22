// Sorelly Admin · montagem — pages/link-pagamento/visual.js
// Apoio das telas de Link de pagamento e maquininhas (Financeiro, azul #3B82F6). Peças visuais (Bt, Selo, Ind, Editor, Painel...) vêm de pages/compras/visualCompras.js (as mesmas do setor Financeiro/Compras).
//   useLp()   estado s.lp, quem está logado e exec(op, dados) → true se o domínio aceitou (a recusa aparece no aviso do sistema)
//   copiar(t) copia texto para a área de transferência (true se conseguiu)
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { lpReduz } from "@/apps/montagem/domain/link-pagamento";
import { use } from "@/apps/montagem/state/context";

function useLp(){
  var cx = use(), s = cx.state, d = cx.dispatch, por = nomeDe(s.usuario);
  var exec = function(op, dados){ var a = Object.assign({type:"LP", op:op, por:por}, dados||{}); var r = lpReduz(s, a); d(a); return !!(r.patch && r.patch.lp); };
  return {s:s, lp:s.lp, cfg:s.lp.config, por:por, exec:exec};
}
function copiar(t){
  try{ if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(t); return true; } }catch(x){}
  try{ var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove(); return true; }catch(x){ return false; }
}
var pct = function(n){ return (Math.round((Number(n)||0)*100)/100).toLocaleString("pt-BR")+"%"; };
export { useLp, copiar, pct };
