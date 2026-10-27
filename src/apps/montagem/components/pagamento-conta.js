// Sorelly Admin · montagem — components/pagamento-conta.js
// Bloco grande que abre ao CLICAR numa conta de Financeiro → Contas a pagar (desenho aprovado pelo Marcus em 22/10/2026).
//  · Conta em aberto: topo com fornecedor/situação, faixa de totais que muda enquanto digita, dados da conta + pagamentos já feitos, formulário (data, forma, conta de saída do CNPJ, juros e multa, desconto, valor pago, comprovante, observação) e "Conta anterior / Próxima conta".
//  · Conta já paga: o mesmo bloco só para ler (quem pagou, quando, conta) com "Desfazer pagamento".
// Pagou menos que o devido = parcial (o que falta continua a pagar). A baixa vai para s.cpe.baixas (CPE_BAIXA / CPE_BAIXA_DESFAZ), como em registrar-pagamento.js.
import { Botao, CAMPO, FaixaTotais, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { contasDe, nomeFilial } from "@/apps/montagem/components/registrar-pagamento";
import { hojeIso } from "@/apps/montagem/domain/financeiro-familiar";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { BKC } from "@/apps/montagem/lib/format";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var dmy = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4) : "—"; };
var FORMAS = [["PIX","Pix"],["BOLETO","Boleto"],["DEBITO_CONTA","Débito em conta"],["TRANSF","Transferência"],["DINHEIRO","Dinheiro"],["CARTAO","Cartão"]];
var formaNome = function(k){ return (FORMAS.filter(function(x){ return x[0]===k; })[0] || [0, k || "—"])[1]; };
var din = function(valor, rot, onChange, ro){ return e(CampoDinheiro,{value:valor || null, label:rot, disabled:ro, className:CAMPO+" text-right tabular-nums", onChange:function(v){ onChange(v || 0); }}); };
// foto vira JPEG pequeno; PDF segue como está (mesmo cuidado do comprovante dos pagamentos do atendimento)
function lerComp(arq, fim){ if(!arq) return; var r = new FileReader(); r.onload = function(){ if(!/^image\//.test(arq.type)){ fim({nome:arq.name, url:r.result}); return; }
  var img = new Image(); img.onload = function(){ var k = Math.min(1, 900/Math.max(img.width, img.height)), c = document.createElement("canvas"); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); fim({nome:arq.name, url:c.toDataURL("image/jpeg", 0.6)}); }; img.src = r.result; }; r.readAsDataURL(arq); }

function KV(p){ return e("div",{className:"flex h-[26px] items-center justify-between gap-3 border-b border-border text-[12.5px]"}, e("span",{className:"shrink-0"}, p.k), e("span",{className:"min-w-0 truncate text-right", title:typeof p.v==="string" ? p.v : undefined}, p.v)); }
var Titulo = function(t){ return e("p",{className:"mb-1.5 text-[11px] font-medium uppercase tracking-[.05em]", style:{color:"#f5c14b"}}, t); };

function PagamentoConta(p){
  var s = p.s, i = p.item, pago = i.status==="pago", baixas = ((s.cpe||{}).baixas || []).filter(function(b){ return b.chave===i.chave; });
  var ra = useState(hojeIso()), data = ra[0], setData = ra[1], rb = useState("PIX"), forma = rb[0], setForma = rb[1], rc = useState(""), conta = rc[0], setConta = rc[1];
  var rd = useState(0), acr = rd[0], setAcr = rd[1], re = useState(0), desc = re[0], setDesc = re[1], rf = useState(null), pagoEd = rf[0], setPagoEd = rf[1];
  var rg = useState(""), obs = rg[0], setObs = rg[1], rh = useState(null), comp = rh[0], setComp = rh[1], ri = useState(""), erro = ri[0], setErro = ri[1];
  var contas = contasDe(s, i.filial), valor = i.valor;
  var devido = r2(valor+acr-desc), pagoV = pagoEd===null ? devido : pagoEd, principal = r2(Math.min(valor, Math.max(0, pagoV-acr+desc))), falta = r2(valor-principal), parcial = !pago && principal>0 && falta>0.004;
  var num = ((i.pref||"")+" "+(i.num||"")).trim();
  var salvar = function(){
    if(!data){ setErro("Informe a data do pagamento."); return; } if(data>hojeIso()){ setErro("A data não pode ser depois de hoje."); return; }
    if(!conta){ setErro("Escolha a conta de saída."); return; } if(!(pagoV>0) || principal<=0){ setErro("Informe o valor pago."); return; }
    if(pagoV>devido+0.004){ setErro("O valor pago é maior que o devido ("+BKC(devido)+")."); return; }
    var nomeConta = (contas.filter(function(x){ return x.id===conta; })[0] || {}).nome || "", agora = Date.now();
    p.salvar({id:"bx"+agora+"-0", chave:i.chave, data:data, forma:forma, conta:conta, contaNome:nomeConta, principal:principal, juros:acr, multa:0, desc:desc, obs:obs.trim(), comprovante:comp, por:s.usuario, em:agora, desc_txt:i.nome+" · "+(num || "—")+" · "+nomeFilial(i.filial)});
  };
  var idx = p.lista.indexOf(i), ant = idx>0 ? p.lista[idx-1] : null, prox = idx>=0 && idx<p.lista.length-1 ? p.lista[idx+1] : null;
  var situ = pago ? "Pago em "+dmy(i.baixa) : i.atraso>0 ? "Atrasada · "+i.atraso+" dias" : "A pagar";
  return e("div",{className:"fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-3 md:p-6", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:"w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#14171c] shadow-2xl"},
      e("div",{className:"flex items-start justify-between gap-3 border-b border-border px-4 py-3"},
        e("div",{className:"min-w-0"}, e("h3",{className:"truncate text-[16px] font-medium text-foreground"}, i.nome), e("p",{className:"truncate text-[12.5px] text-foreground"}, (num || "sem número")+(i.parc ? " · parcela "+i.parc : "")+" · "+nomeFilial(i.filial)+" · "+i.natNome)),
        e("div",{className:"shrink-0 text-right text-[12.5px]"}, e("p",{className:"font-medium "+(!pago && i.atraso>0 ? "text-warning" : pago ? "text-success" : "text-foreground")}, situ), e("p",{className:"text-foreground"}, "Vence "+dmy(i.venc)))),
      e(FaixaTotais,{itens:[{t:"Valor da conta", v:BKC(valor)},{t:"Juros e multa", v:BKC(pago ? 0 : acr)},{t:"Desconto", v:BKC(pago ? 0 : desc)},{t:pago ? "Valor pago" : "Total a pagar", v:BKC(pago ? i.valor : devido)},{t:"Falta depois", v:BKC(pago ? 0 : falta)}]}),
      e("div",{className:"grid grid-cols-1 md:grid-cols-[1fr_1.4fr]"},
        e("div",{className:"border-b border-border px-4 py-3 md:border-b-0 md:border-r"},
          Titulo("Dados da conta"),
          e(KV,{k:"Fornecedor", v:i.nome}), e(KV,{k:"Natureza", v:(i.nat ? i.nat+" · " : "")+i.natNome}), e(KV,{k:"Emissão", v:dmy(i.emissao)}), e(KV,{k:"Nota", v:i.nota==="sem" ? "Sem nota" : "Com nota"}), e(KV,{k:"Já pago", v:BKC(i.parcialPago || 0)}),
          e("div",{className:"mt-3"}, Titulo("Pagamentos desta conta"),
            baixas.length ? baixas.map(function(b){ return e("div",{key:b.id, className:"flex items-center justify-between gap-2 border-b border-border py-1 text-[12.5px]"},
              e("span",{className:"min-w-0 truncate", title:b.contaNome+" · "+nomeDe(b.por)}, dmy(b.data)+" · "+formaNome(b.forma)+" · "+b.contaNome), e("span",{className:"flex shrink-0 items-center gap-2"}, e("b",{className:"font-medium tabular-nums"}, BKC(b.principal+(b.juros||0)+(b.multa||0)-(b.desc||0))),
                b.comprovante && e("a",{href:b.comprovante.url, target:"_blank", rel:"noreferrer", className:"underline"}, "comprovante"),
                p.podePagar && e("button",{type:"button", onClick:function(){ if(window.confirm("Desfazer este pagamento? A conta volta para A pagar.")){ p.desfazer(b.id); } }, className:"h-6 rounded-md border border-border px-2 text-[11.5px] hover:bg-white/10"}, "Desfazer"))); })
              : e("p",{className:"text-[12.5px] text-foreground"}, "Nenhum pagamento ainda."))),
        e("div",{className:"px-4 py-3"},
          Titulo(pago ? "Pagamento registrado" : "Registrar pagamento"),
          pago ? e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Esta conta já está paga. O pagamento fica ao lado, com o botão Desfazer.")
          : !p.podePagar ? e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Só quem tem a autorização \"Registrar pagamento\" dá baixa. Você pode ver os dados.")
          : e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2"},
            e("div",{className:"min-w-0"}, e(Rotulo,{t:"Data", id:"pc-data"}), e("input",{id:"pc-data", type:"date", value:data, max:hojeIso(), onChange:function(ev){ setData(ev.target.value); setErro(""); }, className:CAMPO})),
            e("div",{className:"min-w-0"}, e(Rotulo,{t:"Forma", id:"pc-forma"}), e("select",{id:"pc-forma", value:forma, onChange:function(ev){ setForma(ev.target.value); }, className:CAMPO+" truncate"}, FORMAS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); }))),
            e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Conta de saída · "+nomeFilial(i.filial), id:"pc-conta"}), e("select",{id:"pc-conta", value:conta, onChange:function(ev){ setConta(ev.target.value); setErro(""); }, className:CAMPO+" truncate"}, [e("option",{key:"", value:""}, "Escolha a conta")].concat(contas.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); })))),
            e("div",{className:"min-w-0"}, e(Rotulo,{t:"Juros e multa", id:"pc-acr"}), din(acr, "Juros e multa", function(v){ setAcr(v); setPagoEd(null); setErro(""); })),
            e("div",{className:"min-w-0"}, e(Rotulo,{t:"Desconto", id:"pc-desc"}), din(desc, "Desconto", function(v){ setDesc(v); setPagoEd(null); setErro(""); })),
            e("div",{className:"min-w-0"}, e(Rotulo,{t:"Valor pago", id:"pc-pago"}), din(pagoV, "Valor pago", function(v){ setPagoEd(v); setErro(""); })),
            e("div",{className:"min-w-0"}, e(Rotulo,{t:"Comprovante", id:"pc-comp"}),
              e("label",{className:CAMPO+" flex cursor-pointer items-center truncate"}, comp ? "✓ "+comp.nome : "Anexar arquivo", e("input",{id:"pc-comp", type:"file", accept:"image/*,application/pdf", className:"sr-only", onChange:function(ev){ lerComp(ev.target.files[0], setComp); ev.target.value = ""; }}))),
            e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Observação", id:"pc-obs"}), e("input",{id:"pc-obs", type:"text", value:obs, placeholder:"Opcional", onChange:function(ev){ setObs(ev.target.value); }, className:CAMPO})),
            parcial && e("p",{className:"col-span-2 text-[13px] text-warning"}, "Pagamento parcial: o que falta ("+BKC(falta)+") continua a pagar."),
            erro && e("p",{className:"col-span-2 text-[13px] text-destructive"}, erro)))),
      e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5"},
        e("div",{className:"flex gap-2"}, e(Botao,{desabilitado:!ant, onClick:function(){ p.ir(ant); }}, "‹ Conta anterior"), e(Botao,{desabilitado:!prox, onClick:function(){ p.ir(prox); }}, "Próxima conta ›")),
        e("div",{className:"flex gap-2"}, e(Botao,{onClick:p.fechar}, pago || !p.podePagar ? "Fechar" : "Cancelar"), !pago && p.podePagar && e(Botao,{principal:true, onClick:salvar}, "Registrar pagamento")))));
}

export { PagamentoConta };
