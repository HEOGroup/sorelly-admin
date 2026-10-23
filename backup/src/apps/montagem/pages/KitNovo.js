// Sorelly Admin · montagem e bipagem — pages/KitNovo.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { TabelaEquipe } from "@/apps/montagem/components/equipe-blocos";
import { foraDoPrazo } from "@/apps/montagem/components/kits-novos-rep";
import { DIRETORIA, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, kitsNaListagem, listagemCheia } from "@/apps/montagem/domain/regras";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { badge } from "@/apps/montagem/ui/badge";
import { Btn } from "@/apps/montagem/ui/button";
import { KPI } from "@/apps/montagem/ui/card";
import { MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { TD, TR } from "@/apps/montagem/ui/table";
import { e, useState } from "@/shared/react";
import React from "react";

function AbaKitNovo(){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var papel = papelDe(s.usuario), euDiretoria = DIRETORIA.some(function(x){return x.id===s.usuario;});
  var novas = s.novas || [], abertas = s.listagens.filter(function(l){return !l.fechada;});
  var reps = s.listagens.map(function(l){return l.rep;}).filter(function(r,i,a){return a.indexOf(r)===i;});
  var fs = useState({}), form = fs[0], setForm = fs[1];
  var campo = function(id, k, v){ var o = Object.assign({}, form); o[id] = Object.assign({}, o[id]); o[id][k] = v; setForm(o); };
  var cont = function(st){ return novas.filter(function(n){return n.status===st;}).length; };
  var C = "py-2! px-2! text-center! ";
  var sel = "h-8 rounded-lg border border-input bg-input/30 px-2 text-[13px] outline-none";
  var ST = {aguardando:["Aguardando","warning"], direcionada:["Com a representante","info"], "na listagem":["Na listagem","success"]};
  return e(React.Fragment,null,
    e(PageHead,{t:"Kit novo", sub:"Revendedoras novas que chegam do cadastro, sem vendas anteriores, já com o valor do kit definido. A Michele direciona para a representante ou coloca direto numa listagem."}),
    e("div",{className:"grid grid-cols-2 gap-2 md:grid-cols-4"},
      e(KPI,{compacto:true, l:"Aguardando", v:cont("aguardando"), tom: cont("aguardando")?"text-warning":"", sub:"sem representante"}),
      e(KPI,{compacto:true, l:"Com a representante", v:cont("direcionada"), sub:"ela coloca na listagem"}),
      e(KPI,{compacto:true, l:"Nas listagens", v:cont("na listagem"), tom:"text-success", sub:"entram na fila de montagem"}),
      e(KPI,{compacto:true, l:"Prazo do pedido", v:s.cfg.prazoPedidoHoras+" h", sub:"depois disso precisa de autorização"})),
    e("div",{className:"rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-[13px]"},
      e("b",{className:"text-primary"},"Integração: "), "o cadastro das revendedoras novas virá do sistema do setor Kit novo (HTML que será enviado). Aqui fica a parte de direcionar e colocar nas listagens."),
    e(TabelaEquipe,{min:"min-w-[72rem]", larg:[150,130,70,90,76,130,90,430],
        cols:["Revendedora","Cidade · bairro","Cadastro","Valor do kit","Expositor","Situação","Representante","Ação"]},
      novas.map(function(n){
        var f = form[n.id] || {}, lsRep = abertas.filter(function(l){return !n.rep || l.rep===n.rep;});
        var lidSel = f.lid || (lsRep[0] && lsRep[0].id), lsel = lidSel && s.listagens.find(function(x){return x.id===lidSel;});
        var fora = lsel && foraDoPrazo(lsel, s), aut = euDiretoria ? s.usuario : (f.aut ? +f.aut : null);
        var cheia = lsel && listagemCheia(s, lsel.id);
        return e("tr",{key:n.id, className:TR},
          e(TD,{className:C+"font-medium truncate"}, n.nome),
          e(TD,{className:C+"truncate text-muted-foreground"}, n.cidade+" · "+n.bairro),
          e(TD,{className:C+MONO}, n.cadastro),
          e(TD,{className:C+MONO+" font-semibold text-primary"}, BK(n.valor)),
          e(TD,{className:C}, n.expositor ? badge("Sim","purple") : e("span",{className:"text-muted-foreground"},"Não")),
          e(TD,{className:C+"whitespace-nowrap"}, badge(ST[n.status][0], ST[n.status][1]),
            n.recusadaPor && n.recusadaPor.length>0 && e("span",{className:"ml-1.5 rounded bg-destructive/20 px-1.5 py-0.5 text-[11px] font-semibold text-destructive", title:"Recusada por "+n.recusadaPor.join(", ")}, "recusada por "+n.recusadaPor.join(", "))),
          e(TD,{className:C}, n.rep || e("span",{className:"text-muted-foreground"},"—")),
          e(TD,{className:C},
            n.status==="aguardando"
              ? e("div",{className:"flex items-center justify-center gap-1.5"},
                  e("select",{value:f.rep||"", onChange:function(ev){campo(n.id,"rep",ev.target.value);}, className:sel+" w-36", "aria-label":"Representante"},
                    e("option",{value:""},"Representante"), reps.map(function(r){ var bq = (s.bloqueioNovas||{})[r];
                      return e("option",{key:r, value:r, disabled:bq}, r+(bq ? " (recusa kits novos)" : "")); })),
                  e(Btn,{sm:true, v:"primary", ic:"send", disabled:!f.rep, onClick:function(){d({type:"NOVA_DIRECIONAR", id:n.id, rep:f.rep});}},"Direcionar"))
            : n.status==="direcionada"
              ? e("div",{className:"flex flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap"},
                  e("select",{value:lidSel||"", onChange:function(ev){campo(n.id,"lid",ev.target.value);}, className:sel+" w-28", "aria-label":"Listagem"},
                    lsRep.map(function(l){ var cheiaL = listagemCheia(s, l.id);
                      return e("option",{key:l.id, value:l.id, disabled:cheiaL}, l.rep+" "+l.horario+" ("+kitsNaListagem(s,l.id)+"/"+capacidadeListagem(l)+")"+(cheiaL?" · Lotada":"")); })),
                  fora && !euDiretoria && e("select",{value:f.aut||"", onChange:function(ev){campo(n.id,"aut",ev.target.value);}, className:sel+" w-32 shrink-0 border-warning/60", "aria-label":"Autorizado por", title:"Fora do prazo: precisa de autorização"},
                    e("option",{value:""},"Autorizado por"), DIRETORIA.map(function(x){return e("option",{key:x.id, value:x.id}, x.nome);})),
                  e(Btn,{sm:true, v:"primary", ic:"plus", disabled:!lidSel || cheia || (fora && !aut), title: cheia ? "Listagem cheia" : fora ? "Fora do prazo de "+s.cfg.prazoPedidoHoras+" h" : "",
                    onClick:function(){ d({type:"NOVA_INCLUIR", id:n.id, lid:lidSel, foraPrazo:fora, quem:"kitnovo", autorizador: fora ? aut : null}); }}, fora ? "Colocar (fora do prazo)" : "Colocar na listagem"))
              : e("span",{className:"text-[13px] text-success"}, "Na listagem de "+n.rep+(n.autorizadoPor ? " · aut. "+nomeDe(n.autorizadoPor) : ""))));
      })));
}

export { AbaKitNovo };
