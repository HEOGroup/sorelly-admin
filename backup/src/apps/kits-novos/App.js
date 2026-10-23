// Sorelly Admin · kits novos Curitiba — App.js (casca)
//
// Mesma casca do HTML original (barra lateral, regiões, cabeçalho, diálogos).
// A tela ativa deixou de sair de um mapa `aba -> componente` daqui e passou a
// vir da rota: o conteúdo entra pelo <Outlet/>, e `listas` — que as telas
// recebiam como prop — viaja pelo contexto do Outlet e volta a ser prop na
// tabela de rotas.
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { e, useEffect, useMemo, useState, useReducer } from "@/shared/react";
import { abaDoCaminho, caminhoDaAba } from "@/apps/kits-novos/router/slugs";
import { useRotaAba } from "@/router/use-rota-aba";
import { Aviso } from "@/apps/kits-novos/components/aviso";
import { Dialogos } from "@/apps/kits-novos/components/dialogos";
import { ABAS, TILE } from "@/apps/kits-novos/navigation/abas";
import { USUARIOS, listaDe } from "@/apps/kits-novos/domain/config";
import { MESES } from "@/apps/kits-novos/lib/datas";
import { aberto, atrasado, mesDe } from "@/apps/kits-novos/domain/etapas";
import { CHAVE, inicial } from "@/apps/kits-novos/state/store";
import { Ctx } from "@/apps/kits-novos/state/context";
import { reducer } from "@/apps/kits-novos/state/reducer";
import { Icon } from "@/apps/kits-novos/ui/icon";
import { INPUT, MONO } from "@/apps/kits-novos/ui/input";

function App(){
  var r = useReducer(reducer, null, inicial), s = r[0], d = r[1];
  var navigate = useNavigate();
  var loc = useLocation();
  var aba = abaDoCaminho(loc.pathname).aba;
  useRotaAba({aba:aba, abaURL:aba, estado:s, dispatch:d, caminhoDaAba:caminhoDaAba});
  var mn = useState(false), menu = mn[0], setMenu = mn[1];
  useEffect(function(){ try{ localStorage.setItem(CHAVE, JSON.stringify(Object.assign({}, s, {aviso:null, dialogo:null}))); }catch(x){} }, [s.dados, s.cfg, s.usuario, s.aba, s.modo, s.abertos]);
  var listas = useMemo(function(){ return {reps:listaDe(s.dados,"rep"), cids:listaDe(s.dados,"cid"), ents:listaDe(s.dados,"ent"), meses:MESES.filter(function(m){return s.dados.some(function(c){return mesDe(c)===m;});})}; }, [s.dados]);
  var titulo = ABAS.find(function(a){return a[0]===aba;})[1], u = USUARIOS.find(function(x){return x.id===s.usuario;});
  var pendN = s.dados.filter(function(c){ return aberto(c) && (atrasado(c,s.cfg) || !c.rep); }).length;
  var grupo = function(t, ic, aberto){ return e("div",{className:"flex items-center gap-2 px-2.5 pb-1 pt-4"}, e(Icon,{n:ic, s:14, className:"text-primary"}), e("span",{className:"text-xs font-semibold uppercase tracking-wider text-muted-foreground"}, t), e(Icon,{n:aberto?"chevdown":"chevright", s:14, className:"ml-auto text-muted-foreground"})); };
  return e(Ctx.Provider,{value:{state:s, dispatch:d}},
    e("aside",{className:"fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-sidebar-border bg-sidebar "+(menu?"flex":"hidden md:flex")},
      e("div",{className:"flex h-14 items-center gap-2 border-b border-sidebar-border px-4"}, e("span",{className:"grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"}, e(Icon,{n:"gem", s:15})), e("span",{className:"font-heading text-sm font-semibold"},"Sorelly Admin")),
      e("nav",{className:"flex flex-1 flex-col overflow-y-auto px-3 pb-4"},
        grupo("Kit novo","box",true),
        ABAS.map(function(a){ var on = aba===a[0]; return e("button",{key:a[0], onClick:function(){navigate(caminhoDaAba(a[0])); setMenu(false);},
          className:"flex h-10 w-full items-center gap-2.5 rounded-lg px-2 text-left text-sm "+(on?"bg-sidebar-accent font-medium text-sidebar-accent-foreground":"text-muted-foreground hover:bg-muted/50 hover:text-foreground")},
          e("span",{className:"grid size-7 place-items-center rounded-md "+TILE[a[3]]}, e(Icon,{n:a[2], s:15})), a[1],
          a[0]==="pendencias" && pendN>0 && e("span",{className:MONO+" ml-auto rounded-md bg-destructive/15 px-1.5 text-xs text-destructive"}, pendN)); }),
        grupo("Regi\u00f5es","map",true),
        ["Curitiba","Litoral do Paran\u00e1","Ponta Grossa","Maring\u00e1","Joinville","Santa Catarina"].map(function(rg,i){ return e("span",{key:rg, className:"flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm "+(i===0?"bg-sidebar-accent font-medium text-sidebar-accent-foreground":"text-muted-foreground/60")}, rg, i>0 && e("span",{className:"ml-auto text-[11px]"},"em breve")); }),
        grupo("Bipagem de kits","scan",false), grupo("Sistema","settings",false),
        e("div",{className:"mt-auto px-2.5 pt-4"}, e("p",{className:"pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"},"Conectado como"),
          e("select",{className:INPUT+" h-9! w-full text-sm!", value:s.usuario, "aria-label":"Usu\u00e1rio", onChange:function(ev){d({type:"USUARIO", id:ev.target.value});}}, USUARIOS.map(function(x){return e("option",{key:x.id, value:x.id}, x.nome+", "+x.papel);}))))),
    menu && e("div",{className:"fixed inset-0 z-30 bg-black/60 md:hidden", onClick:function(){setMenu(false);}}),
    e("div",{className:"md:ml-60"},
      e("header",{className:"sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6"},
        e("button",{className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50 md:hidden", "aria-label":"Menu", onClick:function(){setMenu(!menu);}}, e(Icon,{n:"menu"})),
        e("span",{className:"text-sm text-muted-foreground"},"Kits e produ\u00e7\u00e3o", e("span",{className:"mx-1.5"},"/"), e("span",{className:"text-foreground"}, titulo)),
        e("span",{className:"ml-auto hidden text-sm text-muted-foreground sm:inline"}, new Date().toLocaleDateString("pt-BR",{weekday:"long", day:"numeric", month:"long"})),
        e("span",{className:"inline-flex h-9 items-center gap-1.5 rounded-lg border border-input px-3 text-sm"}, e(Icon,{n:"user", s:14, className:"text-primary"}), u.nome),
        e("button",{className:"grid size-9 place-items-center rounded-lg hover:bg-muted/50", "aria-label":"Alternar tema", onClick:function(){document.documentElement.classList.toggle("dark");}}, e(Icon,{n:"sunmoon"}))),
      e("main",{className:"flex flex-col gap-5 p-4 md:p-6"}, e(Outlet,{context:{listas:listas}}))),
    e(Dialogos,{listas:listas}), e(Aviso));
}
export default App;
