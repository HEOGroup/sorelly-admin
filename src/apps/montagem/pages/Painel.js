// Sorelly Admin · montagem e bipagem — pages/Painel.js  (Representantes & Kits → Montagem → Listagens)
// Refeita em 16/11/2026 no padrão azul do Financeiro (Marcus: "a tela de listagens do dia no padrão azul, conforme as novas regras"): bloco com barra azul (BlocoPainel),
// menu de Dia com caixa de marcar (um dia, vários ou todos; abre em hoje), UMA tabela (components/fila-planilha.js) agrupada por listagem, filtro e ordem no cabeçalho das colunas.
// Saíram: título grande, faixa "Hoje na empresa" (contagens; continua na Visão da bipagem), busca e seleções no topo, chips de situação e o botão Por representante | Tabela.
// A fila antiga (components/fila.js) continua no projeto só porque o app da representante usa o ETAPA dela.
import { BarraBipadora } from "@/apps/montagem/components/barra-bipadora";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { DlgNovoKit, DlgRetirada } from "@/apps/montagem/components/dialogos";
import { BlocoErrosBipagem } from "@/apps/montagem/components/erros-bipagem";
import { FilaPlanilha, chaveGrupo } from "@/apps/montagem/components/fila-planilha";
import { MenuDias } from "@/apps/montagem/components/menu-dias";
import { MontarKit } from "@/apps/montagem/pages/fila-montagem/Montar";
import { Pagina } from "@/apps/montagem/components/padrao";
import { papelDe } from "@/apps/montagem/domain/equipe";
import { BK, isoDia } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

// botão pequeno de contorno branco para a barra azul (como o seletor do Contas a pagar)
var BTN_BARRA = "inline-flex h-7 items-center justify-center whitespace-nowrap rounded-md border border-white/50 bg-[#14233f] px-2.5 text-[13px] font-semibold normal-case text-white hover:bg-white/15";   // padrao-ok: controle de 28 px na barra azul, como o Contas a pagar (Marcus aprovou 28 px em 16/11/2026)

function AbaPainel(){
  var cx = use(), s = cx.state;
  var hojeISO = isoDia(new Date());
  var abertas = s.listagens.filter(function(l){ return !l.fechada && (!l.data || l.data>=hojeISO); });
  var diaDe = function(l){ return String(l.data||"sem-data").slice(0, 10); };
  var dias = []; abertas.forEach(function(l){ if(dias.indexOf(diaDe(l))<0) dias.push(diaDe(l)); }); dias.sort();
  var ds = useState(null), diaSel = ds[0], setDiaSel = ds[1], fs = useState({}), fechadas = fs[0], setFechadas = fs[1];
  var dg = useState({tipo:null, lid:null}), dlg = dg[0], setDlg = dg[1];
  var sm = useState(null), montar = sm[0];   // ficha das preferências aberta pela linha da listagem: {id da revendedora no app, id do kit}
  var abrir = function(t, lid){ setDlg({tipo:t, lid:lid}); }, fechar = function(){ setDlg({tipo:null, lid:null}); };
  var diaPadrao = dias.indexOf(hojeISO)>=0 ? hojeISO : (dias.filter(function(x){ return x>=hojeISO; })[0] || dias[0]);   // abre em hoje (ou no próximo dia com listagem)
  var diasAtivos = (diaSel||[]).filter(function(x){ return dias.indexOf(x)>=0; }); if(!diasAtivos.length && diaPadrao) diasAtivos = [diaPadrao];
  var doDia = abertas.filter(function(l){ return diasAtivos.indexOf(diaDe(l))>=0; })
    .sort(function(a, b){ return chaveGrupo(a).localeCompare(chaveGrupo(b)); });
  var conferir = s.kits.filter(function(k){ return k.status==="supervisao"; }).length;
  var abreTodas = function(v){ var o = {}; if(!v) doDia.forEach(function(l){ o[chaveGrupo(l)] = true; }); setFechadas(o); };   // v=true: abre todas; v=false: fecha todas
  if(montar) return e(Pagina,null, e(MontarKit,{key:montar.id, id:montar.id, kitId:montar.kit, voltar:function(){ sm[1](null); }}));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoErrosBipagem),
    papelDe(s.usuario)==="bipadora" && e(BarraBipadora),
    e(BlocoPainel,{titulo:"Listagens", compacto:true, alta:true,
        acao:dias.length>0 ? e(MenuDias,{dias:dias, sel:diasAtivos, onChange:setDiaSel}) : null,
        dir:e("div",{className:"flex items-center gap-1.5"}, e("button",{type:"button", className:BTN_BARRA, onClick:function(){ abreTodas(true); }}, "Abrir todas"), e("button",{type:"button", className:BTN_BARRA, onClick:function(){ abreTodas(false); }}, "Fechar todas"))},
      conferir>0 && e("p",{className:"border-b border-border px-3 py-1 text-center text-[13px] font-semibold text-warning"}, conferir+(conferir>1 ? " kits acima de " : " kit acima de ")+BK(s.cfg.limiteAtencao)+" esperando a conferência da Deysiane"),
      e("div",{className:"flex min-h-0 flex-1 flex-col bg-[#0f1729]"}, e(FilaPlanilha,{listagens:doDia, fechadas:fechadas, setFechadas:setFechadas, abrir:abrir, abrirMontar:function(id, kit){ sm[1]({id:id, kit:kit}); }}))),
    e(DlgNovoKit,{lid: dlg.tipo==="kit" ? dlg.lid : null, fechar:fechar}),
    e(DlgRetirada,{lid: dlg.tipo==="ret" ? dlg.lid : null, fechar:fechar}));
}

export { AbaPainel };
