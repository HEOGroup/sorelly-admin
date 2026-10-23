// Sorelly Admin · montagem e bipagem — domain/vendas.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { tabelaAtual } from "@/apps/montagem/domain/config";

function comissaoRev(v, c){ return (c.comissoesRev||[]).slice().sort(function(a,b){return b.min-a.min;}).find(function(x){return v>=x.min;}) || null; }
function media3(v){ if(!v || !v.length) return null; return v.reduce(function(t,x){return t+x;},0)/v.length; }
function sugerido(vendas, c){
  var m = media3(vendas); if(m===null) return c.kitInicial;
  var f = tabelaAtual(c).slice().sort(function(a,b){return b.min-a.min;}).find(function(x){return m>=x.min;});
  return f ? f.kit : c.kitInicial;
}
var FAIXA_VENDA = {20000:[5000,6400],17000:[4000,4900],15000:[2500,3900],12000:[1600,2450],
  10000:[1000,1550],8000:[700,980],6000:[400,680],5000:[180,390]};
function vendasPara(alvo, n, s){
  var f = FAIXA_VENDA[alvo] || FAIXA_VENDA[8000], out = [];
  for(var i=0;i<n;i++){ var r = ((s*37 + i*53) % 100)/100; out.push(Math.round((f[0]+(f[1]-f[0])*r)/10)*10); }
  return out;
}

export { comissaoRev, media3, sugerido, FAIXA_VENDA, vendasPara };
