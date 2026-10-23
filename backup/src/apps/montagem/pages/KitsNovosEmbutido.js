// Sorelly Admin · montagem e bipagem — pages/KitsNovosEmbutido.js
//
// O app Kits novos (cadastro, liberação, direcionamento — planilha de
// Curitiba) embutido aqui dentro: mesmo cabeçalho e mesma barra lateral do
// admin, só que dentro de "Cadastro de revendedoras → Kits novos" a coluna
// do meio lista as 5 telas que o app tinha (Kits novos, Pendências,
// Consolidado, Regras, Configurador) — cada uma monta o estado do Kits
// novos (reducer + Ctx próprios, persistidos à parte) igual a como já
// funcionava no app separado.
import { AbaKits } from "@/apps/kits-novos/pages/Kits";
import { AbaPendencias } from "@/apps/kits-novos/pages/Pendencias";
import { AbaConsolidado } from "@/apps/kits-novos/pages/Consolidado";
import { AbaRegras } from "@/apps/kits-novos/pages/Regras";
import { AbaConfig } from "@/apps/kits-novos/pages/Config";
import { Dialogos } from "@/apps/kits-novos/components/dialogos";
import { Aviso } from "@/apps/kits-novos/components/aviso";
import { listaDe } from "@/apps/kits-novos/domain/config";
import { MESES } from "@/apps/kits-novos/lib/datas";
import { mesDe } from "@/apps/kits-novos/domain/etapas";
import { CHAVE, inicial } from "@/apps/kits-novos/state/store";
import { Ctx } from "@/apps/kits-novos/state/context";
import { reducer } from "@/apps/kits-novos/state/reducer";
import { e, useEffect, useMemo, useReducer } from "@/shared/react";

function embutir(Pagina){
  return function(){
    var r = useReducer(reducer, null, inicial), s = r[0], d = r[1];
    useEffect(function(){ try{ localStorage.setItem(CHAVE, JSON.stringify(Object.assign({}, s, {aviso:null, dialogo:null}))); }catch(x){} }, [s.dados, s.cfg, s.usuario, s.modo, s.abertos]);
    var listas = useMemo(function(){ return {reps:listaDe(s.dados,"rep"), cids:listaDe(s.dados,"cid"), ents:listaDe(s.dados,"ent"),
      meses:MESES.filter(function(m){ return s.dados.some(function(c){ return mesDe(c)===m; }); })}; }, [s.dados]);
    return e(Ctx.Provider,{value:{state:s, dispatch:d}},
      e(Pagina,{listas:listas}),
      e(Dialogos,{listas:listas}),
      e(Aviso));
  };
}

var AbaKitsNovosEmbutido = embutir(AbaKits);
var AbaPendenciasEmbutido = embutir(AbaPendencias);
var AbaConsolidadoKNEmbutido = embutir(AbaConsolidado);
var AbaRegrasKNEmbutido = embutir(AbaRegras);
var AbaConfigKNEmbutido = embutir(AbaConfig);

export { AbaKitsNovosEmbutido, AbaPendenciasEmbutido, AbaConsolidadoKNEmbutido, AbaRegrasKNEmbutido, AbaConfigKNEmbutido };
