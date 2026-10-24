// Sorelly Admin · montagem — pages/DirecionarPix.js
// Financeiro → Contas → Pagamentos → "Direcionar" e "Regras" (23/10/2026, layout 3 aprovado pelo Marcus, ampliado). O Lucas recebe os pedidos de conta do Pix, os de DENTRO da Sorelly (nunca têm conta fixa)
// e os das REPRESENTANTES (chegam do app), divide cada um em vários destinos e CONFIRMA sempre. O sistema sugere com o motivo escrito (regras em lista, com liga/desliga). Lógica em domain/direcionar-pix.js.
// Quando um destino tem orientação aberta (aba Orientações), confirmar também lança o Pix nela.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Botao, CAMPO, FaixaTotais, Rotulo, Segmentado, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { setBaixas, setClasse, setLancamentos, setPf, filtrar } from "@/apps/montagem/domain/contas-empresa";
import { TIPOS_DESTINO, direcionado, faltaDe, hojeIsoCp } from "@/apps/montagem/domain/controle-pagamentos";
import { sugerir } from "@/apps/montagem/domain/direcionar-pix";
import { descontoCartao, fornecedoresDoMes, geradoEm } from "@/apps/montagem/domain/pf-mes";
import { vinculoDeRep } from "@/apps/montagem/domain/link-pagamento";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { dataReferencia, posicaoEm } from "@/apps/montagem/domain/saldos-contas";
import { BKC } from "@/apps/montagem/lib/format";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var hm = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2, "0")+":"+String(d.getMinutes()).padStart(2, "0"); };
var haQuanto = function(ts){ var m = Math.max(0, Math.floor((Date.now()-ts)/60000)); return m<1 ? "agora" : m<60 ? "há "+m+" min" : "há "+Math.floor(m/60)+" h "+(m%60)+" min"; };
// urgência pela espera do Pix: até 30 min verde, até 1 h amarelo, depois vermelho (pedido do Marcus 24/10/2026: bater o olho e saber o que é urgente)
var COR_ESPERA = ["#4ade80", "#f5c14b", "#f87171"];
var nivelEspera = function(ts){ var m = (Date.now()-ts)/60000; return m<30 ? 0 : m<60 ? 1 : 2; };
var SELO_ORIGEM = {interno:["Interno", "#38bdf8"], rep:["Representante", "#c084fc"]};
var Selo = function(o){ var s = SELO_ORIGEM[o]; return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:s[1]+"26", color:s[1], border:"1px solid "+s[1]+"66"}}, s[0]); };
var SeloAlto = function(){ return e("span",{className:"inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-bold uppercase tracking-[.04em]", style:{background:"#f8717126", color:"#f87171", border:"1px solid #f8717166"}}, "Valor alto"); };
// CNPJ (34, 46, 59, 67) da maquininha ou do link que a representante tem, vindo do Link de pagamento
var nmRep = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(); };
var mesmaRep = function(a, b){ a = nmRep(a); b = nmRep(b); return a===b || a.indexOf(b+" ")===0 || b.indexOf(a+" ")===0; };
var cnpjDaRep = function(s, rep){ var lp = s.lp; if(!lp) return ""; var v = vinculoDeRep(lp, rep) || (lp.vinculos||[]).filter(function(x){ return mesmaRep(x.representante, rep); })[0]; if(!v) return ""; var m = (lp.meios||[]).find(function(x){ return x.id===v.maquininhaId || x.id===v.linkId; }); var q = m ? String(m.cnpjId||"").match(/(34|46|59|67)/) : null; return q ? q[1] : ""; };
var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };
var FORMA = {dinheiro:"Dinheiro", link:"Link de pagamento", getnet:"Crédito à vista (Getnet)", credito:"Crédito", pix:"Pix"};
var textoPago = function(p){ return (FORMA[p.forma] || p.forma)+(p.cnpj ? " ("+p.cnpj+")" : "")+(p.parc ? " em "+p.parc+"x" : ""); };
var soma = function(l){ return r2((l||[]).reduce(function(t, x){ return t+(x.valor||0); }, 0)); };
var Secao = function(t, dir, filhos, p){ return e(BlocoBarra,{t:t, dir:dir, compacto:true, fixo:true, cor:"azul"}, filhos); };

function useDP(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, dp:s.dp, cp:s.cp, por:nomeDe(s.usuario), edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario)}; }

// contas a pagar de cada CNPJ (atrasadas, hoje, amanhã) e quanto há disponível nas contas dele
function contextoCnpj(s){
  setClasse((s.cpe||{}).classe); setLancamentos((s.cpe||{}).lanc); setBaixas((s.cpe||{}).baixas); setPf(s.pf);
  var hoje = hojeIsoCp(), amanha = (function(){ var d = new Date(hoje+"T12:00:00"); d.setDate(d.getDate()+1); return d.toISOString().slice(0, 10); })();
  var abertos = filtrar("", "", "", "apagar", "sorelly", ""), sc = s.saldosContas, ref = sc ? dataReferencia(sc, hoje) : null, pos = ref ? posicaoEm(sc, ref) : {blocos:[]};
  return ["34", "46", "59", "67"].map(function(id){
    var l = abertos.filter(function(i){ return i.filial===id; }), b = pos.blocos.filter(function(x){ return x.id===id; })[0] || {real:0, disp:0};
    return {id:id, atras:soma(l.filter(function(i){ return i.venc<hoje; }).map(function(i){ return {valor:i.valor}; })), hoje:soma(l.filter(function(i){ return i.venc===hoje; }).map(function(i){ return {valor:i.valor}; })),
      amanha:soma(l.filter(function(i){ return i.venc===amanha; }).map(function(i){ return {valor:i.valor}; })), disp:r2(b.disp), saldo:r2(b.real)};
  });
}

function AbaDirecionar(){
  var c = useDP(), s = c.s, cp = c.cp, dp = c.dp, ctxCnpj = contextoCnpj(s);
  var so = useState("todos"), orig = so[0], setOrig = so[1], ss = useState(null), selId = ss[0], setSelId = ss[1], sd = useState({}), drafts = sd[0], setDrafts = sd[1], se = useState("");
  var erro = se[0], setErro = se[1];
  var limAlto = dp.limiteAlto || 7000;
  // valor alto passa na frente da fila; depois, o mais antigo (24/10/2026)
  var fila = dp.pix.filter(function(x){ return x.status==="fila" && (orig==="todos" || x.origem===orig); }).sort(function(a, b){ var ha = a.valor>=limAlto, hb = b.valor>=limAlto; if(ha!==hb) return ha ? -1 : 1; return a.recebidoEm-b.recebidoEm; });
  var feitos = dp.pix.filter(function(x){ return x.status==="direcionado"; }).sort(function(a, b){ return (b.confirmadoEm||0)-(a.confirmadoEm||0); });
  var todosFila = dp.pix.filter(function(x){ return x.status==="fila"; });
  var sel = dp.pix.filter(function(x){ return x.id===selId && x.status==="fila"; })[0] || fila[0] || null;
  var hojeDir = r2(feitos.filter(function(x){ return (x.confirmadoEm||0) > new Date().setHours(0, 0, 0, 0); }).reduce(function(t, x){ return t+x.valor; }, 0));
  var destinoDe = function(id){ return cp.destinos.filter(function(d){ return d.id===id; })[0] || {nome:"(removido)", tipo:"CNPJ"}; };
  var optDest = [["", "Escolha para quem enviar"]]; Object.keys(TIPOS_DESTINO).forEach(function(t){ cp.destinos.filter(function(d){ return d.ativo && d.tipo===t; }).forEach(function(d){ optDest.push([d.id, tipoNome(t)+" · "+d.nome]); }); });
  // fornecedores: o que FALTA para fechar o mês atual e a data limite (planilha, aba RESUMO MÊS; Marcus 24/10/2026). Clicar adiciona o fornecedor como destino.
  var fornAbertos = fornecedoresDoMes(cp).map(function(f){ return {id:f.id, nome:f.nome, total:f.saldo, dMin:f.ate, obs:f.obs, destinoId:f.destinoId}; });
  var totalFalta = r2(fornAbertos.reduce(function(tt, f){ return tt+f.total; }, 0));
  var faz = sel ? sugerir(sel, {pontual:fornAbertos.filter(function(f){ return /^Pontual/.test(f.nome); }), cp:cp, regras:dp.regras, cnpjs:ctxCnpj, contasRep:dp.contasRep||{}, limiteAlto:dp.limiteAlto||7000, cnpjDaRep:function(rep){ return cnpjDaRep(s, rep); }}) : null;
  var div = sel ? (drafts[sel.id] || []) : [], restante = sel ? r2(sel.valor-soma(div)) : 0;
  var setDiv = function(l){ var n = Object.assign({}, drafts); n[sel.id] = l; setDrafts(n); setErro(""); };
  var addDest = function(destinoId, valor, regra){ if(!sel) return; var l = div.slice(), i = l.findIndex(function(x){ return x.destinoId===destinoId; }), v = r2(Math.min(valor==null ? restante : valor, Math.max(restante, 0)));
    if(!(v>0)) return; if(i>=0) l[i] = Object.assign({}, l[i], {valor:r2(l[i].valor+v)}); else l.push({destinoId:destinoId, valor:v, regra:regra||0}); setDiv(l); };
  var usaSug = function(o){ addDest(o.destinoId, o.valor, o.regra); };
  var confirmar = function(){
    if(!sel) return; if(!div.length){ setErro("Escolha pelo menos um destino."); return; } if(Math.abs(restante)>0.009){ setErro("A soma dos destinos precisa fechar com "+BKC(sel.valor)+" (falta "+BKC(restante)+")."); return; }
    c.d({type:"DP", op:"divisao", id:sel.id, divisoes:div}); c.d({type:"DP", op:"confirma", id:sel.id, por:c.por});
    div.forEach(function(x){ var o = cp.orientacoes.filter(function(z){ return z.destinoId===x.destinoId && z.status==="aberta" && faltaDe(z)>0; })[0]; if(o) c.d({type:"CP", op:"orient_lanc", id:o.id, valor:Math.min(x.valor, faltaDe(o)), origem:sel.quem, por:c.por}); });
    var n = Object.assign({}, drafts); delete n[sel.id]; setDrafts(n); setSelId(null); setErro("");
  };
  // destinos que ainda faltam: orientações abertas + CNPJs com contas vencendo
  var faltam = cp.orientacoes.filter(function(o){ return o.status==="aberta" && faltaDe(o)>0; }).map(function(o){ var d = destinoDe(o.destinoId); return {id:d.id, nome:d.nome, tipo:d.tipo, falta:faltaDe(o), atrasada:!!(o.ate && o.ate<hojeIsoCp())}; });
  ctxCnpj.forEach(function(x){ var d = cp.destinos.filter(function(z){ return z.cnpjId===x.id; })[0]; if(d && (x.hoje+x.amanha)>0) faltam.push({id:d.id, nome:d.nome, tipo:"CNPJ", falta:r2(x.hoje+x.amanha), info:"vencem hoje e amanhã"}); });
  var porTipo = {interno:0, rep:0}; todosFila.forEach(function(x){ porTipo[x.origem] += x.valor; });
  var maisAntigo = todosFila.length ? Math.min.apply(null, todosFila.map(function(x){ return x.recebidoEm; })) : null;
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-wrap items-center justify-between gap-2"},
      e(Segmentado,{opcoes:[["todos", "Todos · "+todosFila.length], ["rep", "Representantes · "+todosFila.filter(function(x){ return x.origem==="rep"; }).length], ["interno", "Interno Sorelly · "+todosFila.filter(function(x){ return x.origem==="interno"; }).length]], atual:orig, onMudar:function(v){ setOrig(v); setSelId(null); }}),
      !c.edita && e("span",{className:"text-[13px] text-foreground"}, "Só quem direciona Pix confirma. Você pode ver.")),
    e(FaixaTotais,{itens:[{t:"Pix na fila", v:String(todosFila.length)},{t:"A direcionar", v:BKC(soma(todosFila))},{t:"Interno Sorelly", v:BKC(porTipo.interno)},{t:"Representantes", v:BKC(porTipo.rep)},{t:"Direcionado hoje", v:BKC(hojeDir), cor:hojeDir>0 ? "text-success" : ""},{t:"Mais antigo", v:maisAntigo ? haQuanto(maisAntigo) : "—", cor:maisAntigo ? ["text-success", "text-warning", "text-destructive"][nivelEspera(maisAntigo)] : ""}]}),
    e("div",{className:"grid grid-cols-1 items-start gap-3 min-[1100px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"},
      // ── fila
      Secao("Fila de pedidos", String(fila.length), fila.length ? e("div",{className:"flex flex-col"}, fila.map(function(x){ var on = sel && sel.id===x.id;
        return e("button",{key:x.id, type:"button", onClick:function(){ setSelId(x.id); setErro(""); }, style:{borderLeft:"5px solid "+COR_ESPERA[nivelEspera(x.recebidoEm)]}, className:"flex w-full items-start justify-between gap-2 border-b border-border px-3 py-2.5 text-left last:border-b-0 "+(on ? "bg-[#1f3a6e]" : "hover:bg-white/10")},
          e("span",{className:"min-w-0 flex flex-col gap-1"}, e("span",{className:"flex items-center gap-2"}, Selo(x.origem), x.valor>=limAlto && SeloAlto(), e("span",{className:"text-[12.5px] text-foreground"}, hm(x.recebidoEm))), e("span",{className:"block truncate text-[14.5px] font-semibold text-foreground"}, x.quem), e("span",{className:"block truncate text-[12.5px] text-foreground"}, x.origem==="interno" ? "Atendida por "+x.atendente : (x.maq||"")),
            (x.pagos||[]).length>0 && e("span",{className:"block truncate text-[12.5px] text-foreground"}, "Já pago: "+x.pagos.map(textoPago).join(" · "))),
          e("span",{className:"shrink-0 text-right"}, e("span",{className:"block text-[17px] font-bold tabular-nums text-foreground"}, BKC(x.valor)), e("span",{className:"block text-[13px] font-bold", style:{color:COR_ESPERA[nivelEspera(x.recebidoEm)]}}, haQuanto(x.recebidoEm)))); }))
        : e("p",{className:"px-3 py-6 text-center text-[13px] text-foreground"}, "Nenhum pedido na fila.")),
      // ── pedido aberto
      sel ? e("div",{className:"flex min-w-0 flex-col gap-3"},
        Secao("Direcionar este Pix", restante>0.009 ? "falta direcionar "+BKC(restante) : restante<-0.009 ? "passou "+BKC(-restante) : "tudo direcionado", e("div",{className:"flex flex-col"},
          // cabeçalho do pedido: tipo em selo, nome grande, quem atendeu e a hora (24/10/2026: melhorar o nome e os valores)
          fornAbertos.length>0 && e("div",{className:"border-b border-border"}, e("p",{className:"px-3 pt-2 text-[11px] font-medium uppercase tracking-[.05em]", style:{color:"#f5c14b"}}, "Falta para fechar o mês · fornecedores e data limite"+(totalFalta>0 ? " · total "+BKC(totalFalta) : "")),
            e("div",{className:"grid grid-cols-1 gap-1.5 px-3 py-2 sm:grid-cols-2 xl:grid-cols-3"}, fornAbertos.map(function(x){ var venc = x.dMin && x.dMin<hojeIsoCp(), pode = c.edita && x.destinoId && restante>0.004;
              return e("button",{key:x.id, type:"button", disabled:!pode, title:pode ? "Adicionar "+x.nome+" como destino" : x.nome, onClick:function(){ addDest(x.destinoId, Math.min(restante, x.total), 0); }, className:"flex min-w-0 items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-left "+(pode ? "hover:bg-white/10" : "")},
                e("span",{className:"min-w-0"}, e("span",{className:"block truncate text-[13px] font-semibold text-foreground"}, x.nome), e("span",{className:"block truncate text-[12px] "+(venc ? "text-warning" : "text-foreground"), title:x.obs||undefined}, (x.dMin ? "até "+x.dMin.slice(8,10)+"/"+x.dMin.slice(5,7) : (x.obs ? x.obs.toLowerCase() : "sem data"))+(venc ? " · vencido" : ""))),
                e("b",{className:"shrink-0 text-[14px] font-bold tabular-nums text-foreground"}, BKC(x.total))); })),
            e("p",{className:"px-3 pb-2 text-[12.5px] text-foreground"}, "Pontual: o Pix quita a parcela aberta mais antiga e o que passar vai para a próxima. O que passa no cartão quita o 1 a 10 do mês seguinte, com desconto estimado de "+String(descontoCartao()).replace(".", ",")+"% (média dos últimos 3 meses). Saldos da planilha de "+(geradoEm() ? geradoEm().slice(8,10)+"/"+geradoEm().slice(5,7) : "—")+".")),
          e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2.5"}, Selo(sel.origem), sel.valor>=limAlto && SeloAlto(), e("span",{className:"min-w-0 flex-1 truncate text-[22px] font-extrabold leading-tight text-foreground", title:sel.quem}, sel.quem),
            e("span",{className:"shrink-0 text-[13.5px] text-foreground"}, (sel.origem==="interno" ? "Atendida por "+sel.atendente : (sel.maq||""))+" · chegou às "+hm(sel.recebidoEm)+" · ", e("b",{style:{color:COR_ESPERA[nivelEspera(sel.recebidoEm)]}}, haQuanto(sel.recebidoEm)))),
          e("div",{className:"grid grid-cols-2 border-b border-border md:grid-cols-4"}, [["Valor de vendas", sel.vendas>0 ? BKC(sel.vendas) : "—", "#e5e7eb"], ["Valor a pagar", sel.vendas>0 ? BKC(sel.aPagar) : "—", "#f5c14b"], ["Já pago", BKC(soma(sel.pagos)), "#4ade80", true], ["Pix a direcionar", BKC(sel.valor), "#f5c14b"]].map(function(x, i){
            return e("div",{key:x[0], className:"min-w-0 px-2 py-2 text-center "+(i ? "md:border-l md:border-border" : ""), style:i===3 ? {background:"rgba(217,166,58,.12)"} : undefined}, e("div",{className:"truncate text-[12px] font-medium uppercase tracking-[.05em] text-foreground"}, x[0]), e("div",{className:"truncate font-extrabold tabular-nums "+(i===3 ? "text-[28px]" : x[3] ? "text-[30px]" : "text-[22px]"), style:{color:x[2]}}, x[1])); })),
          (sel.pagos||[]).length>0 && e("div",{className:"flex flex-wrap gap-x-5 gap-y-1 border-b border-border px-3 py-2 text-[15px] text-foreground"}, e("b",{className:"font-bold"}, "Já pagou:"), sel.pagos.map(function(p, i){ return e("span",{key:i, className:"font-semibold"}, textoPago(p)+" · ", e("b",{className:"tabular-nums text-success"}, BKC(p.valor))); })),
          sel.obs && e("p",{className:"border-b border-border px-3 py-1.5 text-[12.5px] text-foreground"}, "Obs.: "+sel.obs),
        // divisão
        e("div",{className:"border-t border-border"}, e("p",{className:"px-3 pt-2 text-[11px] font-medium uppercase tracking-[.05em]", style:{color:"#f5c14b"}}, "Para onde vai este Pix"), e("div",{className:"flex flex-col"},
          div.length ? e(TabelaP,{minW:560, cols:[{t:"Destino"},{t:"Valor", n:true, w:150},{t:"Motivo", w:190},{t:"", w:44}]}, div.map(function(x, i){ var d = destinoDe(x.destinoId);
            return e("tr",{key:x.destinoId},
              e(Td,{forte:true, title:tipoNome(d.tipo)+" · "+d.nome}, d.nome),
              e("td",{className:"border-b border-border px-1.5"}, e(CampoDinheiro,{value:x.valor || null, label:"Valor para "+d.nome, disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ var l = div.slice(); l[i] = Object.assign({}, x, {valor:v || 0}); setDiv(l); }})),
              e(Td,{title:x.regra ? "Regra "+x.regra : "Escolhido à mão"}, x.regra ? "Regra "+x.regra : "À mão"),
              e("td",{className:"border-b border-border px-1 text-center"}, c.edita ? e("button",{type:"button", "aria-label":"Tirar "+d.nome, onClick:function(){ setDiv(div.filter(function(z, k){ return k!==i; })); }, className:"h-7 w-7 rounded-md border border-border text-[12px] hover:bg-white/10"}, "✕") : null)); }))
          : e("p",{className:"px-3 py-4 text-center text-[13px] text-foreground"}, "Escolha em Enviar chave Pix, ou clique em Usar numa sugestão logo abaixo."),
          c.edita && e("div",{className:"flex flex-wrap items-end gap-2 border-t border-border px-3 py-2"},
            e("div",{className:"min-w-0 flex-1", style:{minWidth:220}}, e(Rotulo,{t:"Enviar chave Pix", id:"dp-add"}), e("select",{id:"dp-add", value:"", onChange:function(ev){ if(ev.target.value) addDest(ev.target.value, null, 0); }, className:CAMPO+" truncate"}, optDest.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
            e(Botao,{onClick:function(){ setDiv([]); }, desabilitado:!div.length}, "Limpar"), e(Botao,{principal:true, onClick:confirmar}, "Confirmar e enviar"))),
          erro && e("p",{className:"border-t border-border px-3 py-1.5 text-[13px] text-destructive"}, erro)),
        // sugestão (embaixo do "Para onde", Marcus 24/10/2026)
          e("div",{className:"border-t border-border px-3 py-2"}, e("p",{className:"mb-1 text-[11px] font-medium uppercase tracking-[.05em]", style:{color:"#f5c14b"}}, "Sugestão do sistema"+(sel.origem==="interno" ? " (sem conta fixa)" : "")),
            faz.opcoes.length ? e("div",{className:"flex flex-col gap-1.5"}, faz.opcoes.map(function(o, i){
              return e("div",{key:o.destinoId, className:"flex flex-wrap items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 "+(i===0 ? "border-[#d9a63a] bg-[#1b1810]" : "border-border")},
                e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate font-semibold text-foreground "+(i===0 ? "text-[15.5px]" : "text-[14px]")}, (i===0 ? "★ " : "")+o.nome), e("span",{className:"block text-[13px] text-foreground"}, o.motivo)),
                e("span",{className:"flex shrink-0 items-center gap-2"}, e("b",{className:"font-bold tabular-nums text-foreground "+(i===0 ? "text-[18px]" : "text-[15px]")}, BKC(o.valor)), c.edita && e("button",{type:"button", onClick:function(){ usaSug(o); }, className:(i===0 ? "h-9 px-4 text-[14px] font-bold " : "h-8 px-3 text-[13px] ")+"rounded-md border "+(i===0 ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground")+" hover:opacity-90"}, restante>0 ? "Usar" : "Cheio"))); }))
            : e("p",{className:"rounded-md border border-border px-3 py-2 text-[13px] text-foreground"}, "Nenhuma regra serviu. Escolha o destino à mão."))
,
        // regra usada (uma linha só)
        e("div",{className:"flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-3 py-2 text-[13.5px] text-foreground"},
          e("b",{className:"font-semibold"}, "Regra usada:"),
          faz.regras.some(function(r){ return r.estado==="usada" || r.estado==="info"; }) ? faz.regras.filter(function(r){ return r.estado==="usada" || r.estado==="info"; }).map(function(r){ return e("span",{key:r.n, title:r.texto, className:"rounded border border-border px-2 py-0.5 "+(r.estado==="info" ? "text-warning" : "text-success")}, (r.estado==="info" ? "! " : "✓ ")+r.n+" · "+r.texto); }) : e("span",null, "nenhuma"))))
      ) : e("div",{className:"rounded-lg border border-border px-4 py-10 text-center text-[13px] text-foreground"}, "Fila vazia. Quando chegar um pedido, ele aparece aqui.")),
    // ── destinos que faltam (clicar aloca)
    Secao("Destinos que ainda faltam", sel ? "clique para alocar o pedido aberto" : "", e("div",{className:"grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 xl:grid-cols-4"}, faltam.length ? faltam.map(function(f, i){
      return e("button",{key:f.id+i, type:"button", disabled:!sel || !c.edita || restante<=0.004, onClick:function(){ addDest(f.id, Math.min(restante, f.falta), 0); }, className:"flex min-w-0 flex-col rounded-md border border-border px-2.5 py-1.5 text-left "+((sel && c.edita && restante>0.004) ? "hover:bg-white/10" : "opacity-70")},
        e("span",{className:"truncate text-[13px] font-medium text-foreground", title:f.nome}, f.nome), e("span",{className:"truncate text-[12px] text-foreground"}, tipoNome(f.tipo)+(f.info ? " · "+f.info : "")),
        e("span",{className:"text-[13px] tabular-nums "+(f.atrasada ? "text-warning" : "text-foreground")}, "Falta "+BKC(f.falta)+(f.atrasada ? " · atrasado" : ""))); }) : e("p",{className:"col-span-full px-2 py-3 text-center text-[13px] text-foreground"}, "Nenhuma orientação aberta."))),
    // ── por CNPJ
    Secao("Por CNPJ, agora", "contas a pagar × disponível", e(TabelaP,{minW:640, cols:[{t:"CNPJ", w:90},{t:"Atrasadas", n:true},{t:"Vence hoje", n:true},{t:"Vence amanhã", n:true},{t:"Saldo", n:true},{t:"Disponível", n:true}]},
      ctxCnpj.map(function(x){ return e(Tr,{key:x.id}, e(Td,{forte:true}, "CNPJ "+x.id), e(Td,{n:true, cor:x.atras>0 ? "text-warning" : ""}, BKC(x.atras)), e(Td,{n:true}, BKC(x.hoje)), e(Td,{n:true}, BKC(x.amanha)), e(Td,{n:true, cor:x.saldo<0 ? "text-destructive" : ""}, x.saldo<0 ? "−"+BKC(-x.saldo) : BKC(x.saldo)), e(Td,{n:true}, BKC(x.disp))); }))),
    // ── feitos
    feitos.length>0 && Secao("Direcionados", String(feitos.length), e(TabelaP,{minW:720, cols:[{t:"Hora", w:70},{t:"De"},{t:"Valor", n:true, w:130},{t:"Destinos"},{t:"Quem confirmou", w:140},{t:"", w:90}]}, feitos.map(function(x){
      return e(Tr,{key:x.id}, e(Td,null, x.confirmadoEm ? hm(x.confirmadoEm) : "—"), e(Td,{forte:true}, x.quem), e(Td,{n:true}, BKC(x.valor)), e(Td,{title:x.divisoes.map(function(d){ return destinoDe(d.destinoId).nome+" "+BKC(d.valor); }).join(" · ")}, x.divisoes.map(function(d){ return destinoDe(d.destinoId).nome+" "+BKC(d.valor); }).join(" · ")), e(Td,null, x.confirmadoPor || "—"),
        e("td",{className:"h-8 border-b border-border px-2 text-right"}, c.edita ? e("button",{type:"button", onClick:function(){ c.d({type:"DP", op:"reabre", id:x.id}); }, className:"h-7 rounded-md border border-border px-2 text-[12px] hover:bg-white/10"}, "Reabrir") : null)); }))));
}

// ── Regras do Pix: lista em ordem de prioridade, com liga/desliga
function AbaRegrasPix(){
  var c = useDP(), regras = c.dp.regras;
  return e("div",{className:"flex flex-col gap-3"},
    e("p",{className:"text-[13px] text-foreground"}, "O sistema olha as regras de cima para baixo. A primeira que serve vira a sugestão, com o motivo escrito. O Lucas confirma sempre."),
    e(TabelaP,{minW:720, cols:[{t:"#", w:50},{t:"Se"},{t:"Então"},{t:"Ativa", w:100}]}, regras.map(function(r){ return e(Tr,{key:r.id, apagado:!r.ativa}, e(Td,null, String(r.n)), e(Td,{title:r.se}, r.se), e(Td,{title:r.entao}, r.entao),
      e("td",{className:"h-8 border-b border-border px-2.5"}, e("button",{type:"button", disabled:!c.edita, onClick:function(){ c.d({type:"DP", op:"regra", id:r.id, patch:{ativa:!r.ativa}}); }, className:"h-7 w-16 rounded-md border px-2 text-[12px] "+(r.ativa ? "border-success text-success" : "border-border text-foreground")+(c.edita ? " hover:bg-white/10" : "")}, r.ativa ? "Sim" : "Não"))); })),
    c.edita && e("div",{className:"flex justify-end"}, e(Botao,{onClick:function(){ c.d({type:"DP", op:"demo"}); }, title:"Volta os pedidos de teste para a fila"}, "Recarregar pedidos de teste")));
}

// ── Contas das representantes: o Lucas marca 1 ou 2 vezes por dia a conta de envio de cada representante (24/10/2026). Sem marca, vale o CNPJ da maquininha ou do link dela.
function AbaContasRep(){
  var c = useDP(), s = c.s, cp = c.cp, dp = c.dp, fixas = dp.contasRep || {};
  // todas as representantes que o sistema conhece: as do Link de pagamento (maquininha/link), as que já são destino e as que já mandaram Pix
  var vistos = {}, reps = [];
  var junta = function(n){ n = String(n||"").replace(/^Representante\s+/i, "").trim(); if(!n) return; var ja = reps.filter(function(r){ return mesmaRep(r.nome, n); })[0]; if(ja){ if(n.length>ja.nome.length){ ja.nome = n; ja.id = n; } return; } reps.push({id:n, nome:n}); };
  ((s.lp && s.lp.vinculos) || []).forEach(function(v){ junta(v.representante); });
  cp.destinos.filter(function(d){ return d.tipo==="REPRESENTANTE" && d.ativo; }).forEach(function(d){ junta(d.nome); });
  dp.pix.forEach(function(x){ if(x.origem==="rep") junta(x.repOrigem); });
  reps.sort(function(a, b){ return a.nome.localeCompare(b.nome); });
  var contas = cp.destinos.filter(function(d){ return d.ativo && (d.tipo==="CNPJ" || d.tipo==="FORNECEDOR" || d.tipo==="PRESTADOR"); });
  var chave = function(r){ return r.nome.replace(/^Representante\s+/i, ""); };
  var nFix = reps.filter(function(r){ return fixas[chave(r)] || fixas[r.nome]; }).length;
  var meiosDe = function(nome){ var lp = s.lp; if(!lp) return "—"; var v = vinculoDeRep(lp, nome); if(!v) return "—"; var l = []; (lp.meios||[]).forEach(function(m){ if(m.id===v.maquininhaId || m.id===v.linkId) l.push(m.nome); }); return l.length ? l.join(" · ") : "—"; };
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Representantes", v:String(reps.length)}, {t:"Com conta fixa", v:String(nFix), cor:nFix ? "text-success" : ""}, {t:"Automático (CNPJ da maquininha)", v:String(reps.length-nFix)}, {t:"Valor fora do normal", v:BKC(dp.limiteAlto || 7000), cor:"text-warning"}]}),
    Secao("Conta de cada representante", "marque a conta; vale para os próximos Pix dela", e("div",{className:"flex flex-col"},
      e("p",{className:"border-b border-border px-3 py-2 text-[13.5px] text-foreground"}, "Sem marca, o sistema sugere o CNPJ da maquininha ou do link da representante. Pix de valor fora do normal ignora a conta marcada e sobe para o Lucas definir."),
      e(TabelaP,{minW:760, cols:[{t:"Representante", w:200}, {t:"Maquininha ou link"}, {t:"CNPJ dela", w:90}, {t:"Conta de envio", w:280}, {t:"", w:90}]},
        reps.map(function(r){ var k = chave(r), fx = fixas[k] || fixas[r.nome] || "", cn = cnpjDaRep(s, k);
          return e(Tr,{key:r.id},
            e(Td,{forte:true, title:r.nome}, k), e(Td,{title:meiosDe(k)}, meiosDe(k)), e(Td,null, cn ? "CNPJ "+cn : "—"),
            e("td",{className:"border-b border-border px-1.5"}, e("select",{value:fx, disabled:!c.edita, "aria-label":"Conta de envio de "+k, onChange:function(ev){ c.d({type:"DP", op:"fixa", rep:k, destinoId:ev.target.value}); }, className:CAMPO+" truncate"},
              e("option",{value:""}, cn ? "Automático · CNPJ "+cn : "Automático"), contas.map(function(d){ return e("option",{key:d.id, value:d.id}, tipoNome(d.tipo)+" · "+d.nome); }))),
            e("td",{className:"border-b border-border px-1.5 text-center"}, fx ? e("span",{className:"inline-flex h-6 items-center rounded px-2 text-[12px] font-bold", style:{background:"#4ade8026", color:"#4ade80"}}, "FIXA") : e("span",{className:"text-[12px] text-foreground/70"}, "auto"))); })))),
    Secao("Valor fora do normal", "sobe para o Lucas e passa na frente da fila", e("div",{className:"flex flex-wrap items-end gap-3 px-3 py-3"},
      e("div",{style:{minWidth:220}}, e(Rotulo,{t:"A partir de (R$)", id:"dp-lim"}), e(CampoDinheiro,{value:dp.limiteAlto || 7000, label:"Valor fora do normal", disabled:!c.edita, className:CAMPO+" text-right tabular-nums", onChange:function(v){ if(v>0) c.d({type:"DP", op:"limite", valor:v}); }})),
      e("p",{className:"min-w-0 flex-1 text-[13.5px] text-foreground"}, "Um Pix desse valor, de qualquer representante, não usa a conta fixa. Ele passa na frente da fila e o Lucas escolhe a conta."))));
}

// Tela própria (1º do menu do Financeiro): Direcionar | Regras
function AbaDirecionarPix(){
  var sv = useState("dir"), v = sv[0], setV = sv[1];
  return e("div",{className:"flex flex-col gap-3"},
    e("div",{className:"flex h-10 items-center justify-between gap-2"}, e("h1",{className:"truncate text-[16px] font-semibold text-foreground"}, "Direcionar Pix"), e(Segmentado,{opcoes:[["dir","Direcionar"],["contas","Contas das representantes"],["regras","Regras do Pix"]], atual:v, onMudar:setV})),
    v==="dir" ? e(AbaDirecionar,null) : v==="contas" ? e(AbaContasRep,null) : e(AbaRegrasPix,null));
}
export { AbaDirecionar, AbaRegrasPix, AbaDirecionarPix };
