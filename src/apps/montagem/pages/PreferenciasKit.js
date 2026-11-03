// Sorelly Admin · montagem — pages/PreferenciasKit.js
// Kits → Preferências do kit: uma tela só, com abas. Os corpos ficam em pages/preferencias-kit/.
// Lógica e estado (s.pk, ação PK) em domain/preferencias-kit.js.
// Revendedoras e Análise leem TODAS as revendedoras direto do app (GET /api/preferencias-app, só leitura; src/server/preferencias-app.js). Os dados ficam só em memória:
// não vão para o navegador salvo nem para o servidor de módulos. Formulário e Importar continuam no estado local (s.pk).
import { Abas } from "@/apps/montagem/components/padrao";
import { AbaPkAnalise } from "@/apps/montagem/pages/preferencias-kit/Analise";
import { AbaPkFormulario } from "@/apps/montagem/pages/preferencias-kit/Formulario";
import { AbaPkImportar } from "@/apps/montagem/pages/preferencias-kit/Importar";
import { AbaPkRevendedoras } from "@/apps/montagem/pages/preferencias-kit/Revendedoras";
import { COR_SETOR } from "@/apps/montagem/pages/preferencias-kit/visual";
import { PageHead } from "@/apps/montagem/ui/page";
import { Bt } from "@/apps/montagem/pages/preferencias-kit/visual";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { Ctx, use } from "@/apps/montagem/state/context";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var ABAS = [["rev","Revendedoras"], ["form","Formulário do app"], ["analise","Análise"], ["importar","Importar"]];

var hora = function(ms){ var x = new Date(ms); return String(x.getDate()).padStart(2, "0")+"/"+String(x.getMonth()+1).padStart(2, "0")+" às "+String(x.getHours()).padStart(2, "0")+":"+String(x.getMinutes()).padStart(2, "0"); };

// lê do servidor; enquanto o servidor lê o app em segundo plano, pergunta de novo a cada 3 s
function useDadosApp(){
  var sd = useState(null), sx = useState(""), sn = useState(0);
  useEffect(function(){
    if(!apiAtiva()) return undefined;
    var vivo = true, tempo = null;
    var carrega = function(forcar){ chamar("GET", "/preferencias-app"+(forcar ? "?atualizar=1" : "")).then(function(j){ if(!vivo) return; sd[1](j); sx[1](""); if(j.status && j.status.rodando) tempo = setTimeout(function(){ carrega(false); }, 3000); }).catch(function(x){ if(vivo) sx[1](x.message || "Não foi possível ler o app."); }); };
    carrega(sn[0]>0);
    return function(){ vivo = false; if(tempo) clearTimeout(tempo); };
  }, [sn[0]]);   // eslint-disable-line react-hooks/exhaustive-deps -- sd/sx/sn são estados fixos
  return {dados:sd[0], erro:sx[0], atualizar:function(){ sn[1](sn[0]+1); }};
}

function AbaPreferenciasKit(){
  var st = useState("rev"), aba = st[0], c = use(), d = c.dispatch, s = c.state;
  var app = useDadosApp(), dados = app.dados, rodando = !!(dados && dados.status && dados.status.rodando);
  var sApp = useMemo(function(){
    if(!dados || !dados.revendedoras || !dados.revendedoras.length) return null;
    var pk = Object.assign({}, s.pk, {deApp:true, registros:(s.pk && s.pk.registros) || [], revendedoras:dados.revendedoras.map(function(r){ return Object.assign({telefone:"", email:"", criadoEm:""}, r, r.preferencias ? {preferencias:Object.assign({versaoConfig:s.pk.config.versao}, r.preferencias)} : {}); })});
    return Object.assign({}, s, {pk:pk, kits:[], revInternas:[]});   // sem as listagens de demonstração: só as do app
  }, [dados, s]);
  var sub = !apiAtiva() ? "Sem servidor ligado: mostrando só os dados deste navegador."
    : app.erro ? "Não foi possível ler o app: "+app.erro
    : !dados ? "Lendo as revendedoras do app…"
    : rodando ? "Lendo o app: "+dados.status.feitos+" de "+dados.status.total+" respostas."
    : "Direto do app, somente leitura · "+dados.revendedoras.length+" revendedoras com kit ativo"+(dados.foraDoKit ? " ("+dados.foraDoKit+" do app sem kit ativo não aparecem nem contam)" : "")+(dados.status.concluidaEm ? " · lido em "+hora(dados.status.concluidaEm) : "")+".";
  var verNoApp = function(){ window.__revTelaIni = "preferencias"; d({type:"ABA", aba:"apps"}); };   // abre o app da revendedora (dentro da tela Apps) já na tela de preferências
  var doApp = function(corpo){ return sApp ? e(Ctx.Provider,{value:{state:sApp, dispatch:d}}, corpo) : corpo; };
  var corpo = aba==="rev" ? doApp(e(AbaPkRevendedoras,null)) : aba==="form" ? e(AbaPkFormulario,null) : aba==="analise" ? doApp(e(AbaPkAnalise,null)) : e(AbaPkImportar,null);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Preferências do kit", sub:sub}, apiAtiva() && e(Bt,{tipo:"normal", ic:"refresh", onClick:app.atualizar}, "Atualizar do app"), e(Bt,{tipo:"forte", ic:"device-mobile", onClick:verNoApp}, "Ver no app da revendedora")),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR_SETOR}),
    corpo);
}
export { AbaPreferenciasKit };
