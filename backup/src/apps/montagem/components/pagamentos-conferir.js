// Sorelly Admin · montagem — components/pagamentos-conferir.js
// Pagamentos do atendimento interno para conferir (definir contas, enviar ao atendimento, comprovantes e conferência). É UM só registro (s.lancFin):
// aparece na Visão geral e dentro do cartão do pedido no SorellyChat (grupo Atendimento Interno), sempre sincronizado.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Mosaico } from "@/apps/montagem/components/padrao";
import { contasDefinidas, contasEnviadas, statusLinhaFin } from "@/apps/montagem/domain/atendimento-interno";
import { formasPagamentoPadrao } from "@/apps/montagem/domain/consignado";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { cnpjDaConta } from "@/apps/montagem/domain/pix-regras";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { MONO } from "@/apps/montagem/ui/input";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";
import React from "react";

// ── Pagamentos do atendimento interno para conferir: a diretoria e a Ana Maria definem a conta de cada pagamento, esperam o comprovante e confirmam ──
var hm = function(ts){ var n = new Date(ts); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
// Props opcionais (usadas pelo SorellyChat, que mostra o MESMO registro dentro do cartão do pedido):
//   soId = só esse lançamento (aberto, mesmo conferido) · ro = só leitura (quem não pode definir contas) · anexa = pode anexar comprovante e enviar para conferência
//   quemNome = nome de quem está agindo (registro das decisões) · tituloSemBloco = sem faixa de título
function PagamentosAConferir(p){
  var cx = use(), s = cx.state, d = cx.dispatch, quem = p.quemNome || nomeDe(s.usuario), ro = !!p.ro;
  var formas = (s.formasPagamento || formasPagamentoPadrao()).filter(function(f){ return f.k!=="pix_representante"; });
  var formaDe = function(k){ return formas.find(function(f){ return f.k===k; }) || {k:k, label:k, descricoes:[]}; };
  // da representante: entram os pedidos feitos pelo app (pedidoRep) e os antigos que ainda estão sem conta; os antigos já com conta seguem só no cartão do chat
  var lista = (s.lancFin || []).filter(function(x){ return x.origem!=="rep" || x.pedidoRep || x.linhas.some(function(l){ return !l.isento && !contasDefinidas(l); }); }), pend = p.soId ? lista.filter(function(x){ return x.id===p.soId; }) : lista.filter(function(x){ return !x.conferido && !x.cancelado; }), feitos = lista.filter(function(x){ return x.conferido; });
  // comprovante: foto vira JPEG pequeno; PDF segue como está
  var lerComp = function(arq, fim){ if(!arq) return; var r = new FileReader(); r.onload = function(){ if(!/^image\//.test(arq.type)){ fim({nome:arq.name, url:r.result}); return; }
    var img = new Image(); img.onload = function(){ var k = Math.min(1, 900/Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); fim({nome:arq.name, url:c.toDataURL("image/jpeg", 0.6)}); }; img.src = r.result; }; r.readAsDataURL(arq); };
  var CP = INPUT+" h-9! w-full text-[13px]!";
  // pedidos de conta da representante (app dela): mostra há quanto tempo ela espera; atualiza a cada 30 s
  var tq = React.useState(0), tick = tq[0], setTick = tq[1];
  React.useEffect(function(){ var iv = setInterval(function(){ setTick(function(n){ return n+1; }); }, 30000); return function(){ clearInterval(iv); }; }, []);
  var minEsp = function(ts){ return Math.max(0, Math.floor((Date.now()-ts)/60000)); };
  var maisAntigo = function(ls, x){ return ls.reduce(function(m, l){ return Math.min(m, l.pedidoTs || x.enviadoTs || Date.now()); }, Date.now()); };
  var txtEsp = function(ts){ var m = minEsp(ts); return m<1 ? "agora" : m<60 ? "há "+m+" min" : "há "+Math.floor(m/60)+" h "+(m%60)+" min"; };
  // etapas do ponto de vista do financeiro: definir contas → OK, enviar ao atendimento → (atendimento anexa) → confirmar
  var SK = {definir:["Definir as contas","#F59E0B"], enviar:["Pronto: enviar ao atendimento","#E5E7EB"], enviado:["Enviado ao atendimento","#E5E7EB"], recebido:["Comprovante recebido","#E5E7EB"], ok:["✓ Conferido","#22C55E"], isento:["Isento","#9CA3AF"]};
  var etapaFin = function(l){
    if(l.isento) return "isento";
    if(!contasDefinidas(l)) return "definir";
    if(statusLinhaFin(l)==="ok") return "ok";
    if(!contasEnviadas(l)) return "enviar";
    return (l.partes||[]).every(function(q){ return q.comprovante; }) ? "recebido" : "enviado";
  };
  // todas as formas de pagamento com todas as contas (a da própria linha vem primeiro)
  // Pix: se a venda tem link ou cartão, o Pix tem de cair no MESMO CNPJ (aparecem só as contas desse CNPJ)
  var cnpjsDaVenda = function(x){ var o = {}; x.linhas.forEach(function(l){ if(l.forma==='link' || l.forma==='credito' || l.forma==='debito') (l.partes||[]).forEach(function(q){ var c = q.descricao ? cnpjDaConta(s.px, q.descricao) : ''; if(c) o[c] = 1; }); }); return Object.keys(o); };
  var opcoesContas = function(forma, x){ var cn = forma==='pix' && x ? cnpjsDaVenda(x) : [], serve = function(c){ return !cn.length || cn.indexOf(cnpjDaConta(s.px, c))>=0; };
    var ordem = formas.filter(function(fm){ return fm.k===forma; }).concat(formas.filter(function(fm){ return fm.k!==forma; }));
    return ordem.map(function(fm){ return e("optgroup",{key:fm.k, label:fm.label}, (fm.descricoes||[]).filter(serve).map(function(c){ return e("option",{key:fm.k+c, value:c}, c); })); }).filter(function(g){ return g.props.children.length>0; }); };
  // uma linha enviada (ex.: Pix R$ 7.000) pode ser dividida em várias contas; o comprovante quem anexa é a funcionária que bipa
  var linha = function(x, l, i){
    var sk = etapaFin(l), brinde = l.tipo==="brinde", ps = l.partes || [];
    var soma = ps.reduce(function(t,q){ return t+(q.valor||0); }, 0), somaDef = ps.filter(function(q){ return q.descricao && q.pend!==true; }).reduce(function(t,q){ return t+(q.valor||0); }, 0), difere = Math.abs(soma-l.valor)>0.009;
    var linhaPatch = function(pt){ d({type:"FIN_LINHA", id:x.id, i:i, patch:pt, por:quem}); };
    // mexer nas contas (trocar, mudar valor, dividir, remover) cancela o envio: precisa de novo OK; confirmar/desfazer não mexe no envio
    var marca = function(){ return {enviada:false, alterado:l.enviada===true || l.alterado===true}; };   // mexeu depois de enviar = "alterado" (volta a precisar de OK)
    var partePatch = function(j, pt){ var mexeu = !("ok" in pt); linhaPatch(Object.assign({partes:ps.map(function(q,k){ return k===j ? Object.assign({}, q, pt) : q; })}, mexeu ? marca() : {})); };
    // o bloco muda de cor conforme a etapa: amarelo = falta definir a conta, roxo = conta definida, azul = aguardando comprovante, verde = conferido
    return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-lg px-3 py-2 text-left text-[13px]", style:{background:SK[sk][1]+"1F", boxShadow:"inset 4px 0 0 "+SK[sk][1]}},
      e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"},
        e("b",{className:"text-[14px]"}, brinde ? "Diferença do brinde" : formaDe(l.forma).label+(l.forma==="credito" && l.parcelas>1 ? " "+l.parcelas+"x" : "")), e("b",{className:MONO+" text-[15px] text-primary"}, BK(l.valor)),
        x.origem==="rep" && l.pedidoTs && e("span",{className:"text-[11.5px] text-foreground"}, "pedido às "+hm(l.pedidoTs)+(sk==="definir" ? " · aguarda "+txtEsp(l.pedidoTs) : "")),
        e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold", style:{background:SK[sk][1]+"26", color:SK[sk][1]}}, SK[sk][0]),
        brinde && sk!=="ok" && e(Btn,{v:l.isento ? "secondary" : "ghost", sm:true, onClick:function(){ linhaPatch({isento:!l.isento}); }}, l.isento ? "Desfazer isenção" : "Isentar")),
      l.forma==='pix' && cnpjsDaVenda(x).length>0 && !l.isento && e("span",{className:"text-[11.5px] font-semibold text-foreground"}, "Pix só nas contas do CNPJ "+cnpjsDaVenda(x).join(" e ")+" (o mesmo do link ou cartão desta venda)"),
      l.auto && !l.manual && e("span",{className:"text-[11.5px] font-semibold text-foreground"}, "⚡ Conta definida sozinha · "+l.auto),
      !l.isento && ps.map(function(q,j){ var fechado = q.ok || ro, edit = !fechado && (q.pend===true || !q.descricao);
        // conta e valor na MESMA linha; "Confirmar conta" sobe o valor. Se sobrou, nasce outra linha pendente com o resto até fechar o total
        var outras = ps.reduce(function(t,z,k){ return k===j ? t : t+(z.valor||0); }, 0), resto = Math.round((l.valor-outras)*100)/100, cabe = q.valor>0 && q.valor<=resto+0.009;
        var confirmarConta = function(){ var novo = ps.map(function(z,k){ return k===j ? Object.assign({}, z, {pend:false}) : z; }), s2 = novo.reduce(function(t,z){ return t+(z.valor||0); }, 0), falta = Math.round((l.valor-s2)*100)/100;
          if(falta>0.009) novo = novo.concat([{descricao:"", valor:falta, comprovante:null, ok:false, pend:true}]); linhaPatch(Object.assign({partes:novo}, marca())); };
        return e("div",{key:j, className:"flex min-w-0 flex-col gap-1.5 rounded-lg bg-black/20 p-2"},
          edit ? e("div",{className:"flex min-w-0 flex-wrap items-center gap-2"},
              e("select",{value:q.descricao||"", "aria-label":"Conta de entrada", className:CP+" min-w-48 flex-1", onChange:function(ev){ partePatch(j, {descricao:ev.target.value, pend:true}); }},
                e("option",{value:""},"Definir a conta…"), opcoesContas(l.forma || (formas[0] && formas[0].k), x)),
              e("div",{className:"w-36 shrink-0"}, e(CampoDinheiro,{value:q.valor, label:"Valor desta conta", className:CP+" font-mono", onChange:function(v){ partePatch(j, {valor:v||0, pend:true}); }})),
              ro ? e("span",{className:"text-[12px] text-foreground"}, "Aguardando a definição da conta")
                : e(Btn,{v:"primary", sm:true, ic:"check", disabled:!(q.descricao && cabe), onClick:confirmarConta}, "Confirmar conta"),
              !ro && ps.length>1 && e("button",{onClick:function(){ linhaPatch(Object.assign({partes:ps.filter(function(z,k){ return k!==j; })}, marca())); }, "aria-label":"Remover esta conta", className:"grid size-7 place-items-center rounded-full bg-muted text-base font-bold text-foreground hover:bg-destructive/20 hover:text-destructive"},"×"),
              !ro && q.descricao && q.valor>0 && !cabe && e("span",{className:"w-full text-[12px] font-semibold text-destructive"}, "O valor passa do que falta ("+BK(Math.max(0,resto))+")."))
            : e("div",{className:"flex min-w-0 flex-wrap items-center gap-2"},
              e("b",{className:"min-w-0 flex-1 text-[13px]"}, q.descricao), e("b",{className:MONO+" text-[14px] text-primary"}, BK(q.valor)),
              q.comprovante && e("a",{href:q.comprovante.url, target:"_blank", rel:"noreferrer", className:"text-[12px] font-semibold text-primary underline"},"Ver comprovante"),
              fechado ? (q.ok ? e(React.Fragment,null, e("span",{className:"font-bold text-success"},"✓ Conferido"), !ro && e("button",{onClick:function(){ partePatch(j, {ok:false}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/15"},"Desfazer")) : null)
              : e(React.Fragment,null,
                  e("button",{onClick:function(){ partePatch(j, {pend:true}); }, className:"rounded-md bg-white/10 px-2 py-0.5 text-[12px] font-semibold hover:bg-white/15"},"Editar"),
                  e(Btn,{v:"primary", sm:true, ic:"check", disabled:!(x.finalizado && q.descricao && q.comprovante && q.valor>0 && !difere && contasDefinidas(l)), onClick:function(){ partePatch(j, {ok:true}); }}, "Conferir pagamento"))));
      }),
      // quem atende anexa o comprovante de cada conta (foto ou PDF) depois que a conta foi enviada
      p.anexa && !l.isento && sk!=="ok" && contasEnviadas(l) && ps.map(function(q,j){ return q.ok ? null : e("label",{key:"cmp"+j, className:"inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[12px] font-semibold hover:bg-white/15"},
        q.comprovante ? "✓ Comprovante · trocar" : "Anexar comprovante"+(ps.length>1 ? " da conta "+(j+1) : ""),
        e("input",{type:"file", accept:"image/*,application/pdf", className:"sr-only", "aria-label":"Anexar comprovante", onChange:function(ev){ lerComp(ev.target.files[0], function(cmp){ linhaPatch({partes:ps.map(function(z,k){ return k===j ? Object.assign({}, z, {comprovante:cmp}) : z; })}); }); ev.target.value = ""; }})); }),
      !ro && !l.isento && sk!=="ok" && e("div",{className:"flex flex-wrap items-center gap-x-3 gap-y-1"},
        e("b",{className:MONO+" text-[12.5px] "+(contasDefinidas(l) ? "text-success" : "text-destructive")}, "Definido "+BK(somaDef)+" / "+BK(l.valor)+(contasDefinidas(l) ? "" : " · falta "+BK(Math.max(0, Math.round((l.valor-somaDef)*100)/100)))),
        // contas definidas e somando certo: o financeiro dá o OK e as contas seguem para o atendimento anexar os comprovantes
        sk==="enviar" && e(Btn,{v:"primary", sm:true, ic:"check", onClick:function(){ linhaPatch({enviada:true, alterado:false, reenviadoEm:l.alterado ? Date.now() : l.reenviadoEm}); }}, "OK, enviar ao atendimento")));
  };
  // cada acerto é um dropdown fechado (resumo na linha); clica para abrir e definir as contas
  // situação de cada conta (para o resumo do bloco fechado)
  var sitParte = function(l, q){ return q.ok ? ["Conferido", "#22C55E"] : !q.descricao || q.pend===true ? ["Falta definir", "#F59E0B"] : q.comprovante ? ["Comprovante recebido", "#E5E7EB"] : contasEnviadas(l) ? ["Aguardando comprovante", "#E5E7EB"] : ["Conta definida · falta enviar", "#E5E7EB"]; };
  var card = function(x, aberto){
    var nDef = x.linhas.filter(function(l){ return etapaFin(l)==="definir"; }).length, nEnv = x.linhas.filter(function(l){ return etapaFin(l)==="enviar"; }).length;
    var nCmp = x.linhas.filter(function(l){ return etapaFin(l)==="enviado"; }).length;
    var total = x.linhas.reduce(function(t,l){ return l.isento ? t : t+l.valor; },0);
    return e("details",{key:x.id, open:aberto || undefined, className:"group rounded-xl border border-border bg-card/60"},
      e("summary",{className:"flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 [&::-webkit-details-marker]:hidden"},
        e("span",{className:"text-primary transition-transform group-open:rotate-90"},"▶"), e("b",{className:"text-[14px]"}, x.nome),
        x.origem==="rep" && e("span",{className:"rounded-md bg-white/10 px-2 py-0.5 text-[11.5px] font-bold text-foreground"}, "Representante "+(x.por||"")),
        x.origem==="func" && e("span",{className:"rounded-md bg-white/10 px-2 py-0.5 text-[11.5px] font-bold text-foreground"}, "Cobrança de funcionária"),
        x.origem==="rep" ? e("span",{className:"text-[12px] text-foreground"}, "pedido às "+hm(maisAntigo(x.linhas, x))+(nDef>0 ? " · aguarda "+txtEsp(maisAntigo(x.linhas.filter(function(l){ return etapaFin(l)==="definir"; }), x)) : ""))
          : e("span",{className:"text-[12px] text-foreground"},"enviado às "+hm(x.enviadoTs)+(x.por ? " por "+x.por : "")),
        (function(){ var sel = x.cancelado ? ["cancelado", "bg-destructive/20 text-destructive"] : x.conferido ? ["✓ conferido", "bg-success/20 text-success"] : nDef>0 ? [nDef+(nDef===1 ? " forma sem conta" : " formas sem conta"), "bg-warning/20 text-warning"] : nEnv>0 ? ["falta enviar ao atendimento", "bg-white/10 text-foreground"] : nCmp>0 ? ["com o atendimento", "bg-white/10 text-foreground"] : x.finalizado ? ["Pronto para conferir", "bg-white/10 text-foreground"] : ["Bipagem ainda não finalizou", "bg-white/10 text-foreground"]; return e("span",{className:"rounded-md px-2 py-0.5 text-[11.5px] font-bold "+sel[1]}, sel[0]); })(),
        e("b",{className:MONO+" ml-auto text-primary"}, BK(total)),
        // com o bloco fechado: cada conta com valor e situação; avisa se houve mudança depois do envio
        e("div",{className:"flex w-full flex-wrap gap-1.5 pt-0.5"},
          x.linhas.filter(function(l){ return !l.isento; }).map(function(l, i){ return (l.partes||[]).map(function(q, j){ var st = sitParte(l, q);
            return e("span",{key:i+"-"+j, className:"inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-semibold", style:{background:st[1]+"22", boxShadow:"inset 0 0 0 1px "+st[1]+"55"}},
              e("span",null, formaDe(l.forma).label+" · "+(q.descricao||"sem conta")+" · "+BK(q.valor)), e("b",{style:{color:st[1]}}, st[0])); }); }),
          x.linhas.some(function(l){ return l.alterado; }) && e("span",{className:"rounded-md bg-warning/25 px-2 py-0.5 text-[11.5px] font-bold text-warning"}, "Houve mudança: enviar de novo"),
          !x.linhas.some(function(l){ return l.alterado; }) && x.linhas.some(function(l){ return l.reenviadoEm; }) && e("span",{className:"rounded-md bg-white/10 px-2 py-0.5 text-[11.5px] font-bold text-foreground"}, "Reenviado com mudança às "+hm(Math.max.apply(null, x.linhas.map(function(l){ return l.reenviadoEm||0; })))),
          x.obs && e("span",{className:"w-full text-[12px] italic text-foreground"}, "Obs.: "+x.obs))),
      e("div",{className:"flex flex-col gap-1.5 px-2.5 pb-2.5"}, x.linhas.map(function(l,i){ return linha(x,l,i); }),
        // observação do financeiro sobre este pagamento (aparece no resumo do bloco fechado)
        e("input",{key:"obs"+(x.obs||""), defaultValue:x.obs||"", placeholder:"Observação (ex.: cliente vai pagar o resto amanhã)", "aria-label":"Observação do pagamento", disabled:ro, className:CP+" text-[12.5px]!", onBlur:function(ev){ if(ev.target.value!==(x.obs||"")) d({type:"FIN_ETAPA", id:x.id, patch:{obs:ev.target.value.trim()}}); }}),
        p.anexa && !x.conferido && !x.finalizado && x.linhas.some(function(l){ return !l.isento; }) && x.linhas.every(function(l){ return l.isento || ((l.partes||[]).length>0 && (l.partes||[]).every(function(q){ return q.comprovante; })); }) &&
          e(Btn,{v:"primary", sm:true, ic:"check", onClick:function(){ d({type:"FIN_ETAPA", id:x.id, patch:{etapaComprovantes:true, finalizado:true}}); }}, "Comprovantes anexados · enviar para conferência")));
  };
  var corpo = e("div",{className:"flex min-w-0 flex-col gap-2 "+(p.soId ? "p-1" : "p-2")},
    !p.soId && e("p",{className:"text-center text-[13px] font-semibold"}, pend.length ? pend.length+(pend.length===1 ? " acerto pendente" : " acertos pendentes") : "Nada pendente por enquanto."),
    p.soId ? pend.map(function(x){ return card(x, true); }) : pend.length ? e(Mosaico,{min:"20rem"}, pend.map(function(x){ return card(x, false); })) : null);
  if(p.soId || p.simples) return corpo;
  // p.dentro: faz parte do bloco do Atendimento interno (mesmo setor), só com uma faixa de título; senão, bloco próprio
  if(p.dentro) return e("div",{className:"flex flex-col border-t border-[#E8B84B]/30"},
    e("div",{className:"flex flex-col items-center bg-black/25 px-3 py-1.5 text-center"}, e("b",{className:"font-heading text-[14px] leading-tight text-primary"},"Pagamentos para conferir"),
      e("span",{className:"text-[11px] text-white/65"},"Defina as contas e envie ao atendimento")), corpo);
  return e(BlocoBarra,{t:"Pagamentos para conferir", sub:"Defina as contas e envie ao atendimento; após a conferência, o registro segue para o Consolidado do atendimento"}, corpo);
}


export { PagamentosAConferir };
