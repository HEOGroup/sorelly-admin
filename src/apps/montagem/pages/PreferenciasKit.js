// Sorelly Admin · montagem — pages/PreferenciasKit.js
// Kits → Preferências do kit: uma tela só, com abas. Os corpos ficam em pages/preferencias-kit/.
// Lógica e estado (s.pk, ação PK) em domain/preferencias-kit.js. O app da revendedora ainda não está ligado: respostas entram à mão ou por importação.
import { Abas } from "@/apps/montagem/components/padrao";
import { AbaPkAnalise } from "@/apps/montagem/pages/preferencias-kit/Analise";
import { AbaPkFormulario } from "@/apps/montagem/pages/preferencias-kit/Formulario";
import { AbaPkImportar } from "@/apps/montagem/pages/preferencias-kit/Importar";
import { AbaPkRevendedoras } from "@/apps/montagem/pages/preferencias-kit/Revendedoras";
import { COR_SETOR } from "@/apps/montagem/pages/preferencias-kit/visual";
import { PageHead } from "@/apps/montagem/ui/page";
import { Bt } from "@/apps/montagem/pages/preferencias-kit/visual";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var ABAS = [["rev","Revendedoras"], ["form","Formulário do app"], ["analise","Análise"], ["importar","Importar"]];

function AbaPreferenciasKit(){
  var st = useState("rev"), aba = st[0], d = use().dispatch;
  var verNoApp = function(){ window.__revTelaIni = "preferencias"; d({type:"ABA", aba:"apps"}); };   // abre o app da revendedora (dentro da tela Apps) já na tela de preferências
  var corpo = aba==="rev" ? e(AbaPkRevendedoras,null) : aba==="form" ? e(AbaPkFormulario,null) : aba==="analise" ? e(AbaPkAnalise,null) : e(AbaPkImportar,null);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Preferências do kit", sub:"Formulário do app, respostas das revendedoras e análise para a montagem."}, e(Bt,{tipo:"forte", ic:"device-mobile", onClick:verNoApp}, "Ver no app da revendedora")),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR_SETOR}),
    corpo);
}
export { AbaPreferenciasKit };
