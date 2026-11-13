// Sorelly Admin · montagem — components/pagamento-conta.js
// Janela que abre ao CLICAR numa conta de Financeiro › Contas › A pagar / Pagas. REFEITA NO PADRÃO NOVO em 12/11/2026 (Marcus: "o bloco de pagamento da conta precisa estar no padrão"):
// blocos com barra azul (BlocoPainel), tabelas da peça única (TabelaPlanilha), campos de 32 px, texto branco, sem faixa de totais e sem título dourado.
// FORMATO B2 (escolhido pelo Marcus em 12/11/2026): uma barra azul; faixa de células com os dados da conta (4 por linha); valores em texto corrido; duas colunas: Registrar pagamento | Pagamentos desta conta.
// Registrar pagamento: data, forma, conta de saída do CNPJ, juros e multa, desconto, valor pago, comprovante (opcional), observação. Pagou menos que o devido = parcial.
// Origem: conta lançada à mão no Admin mostra "Só no Admin" (falta lançar na DevMaster). A baixa vai para s.cpe.baixas (CPE_BAIXA / CPE_BAIXA_DESFAZ), como em registrar-pagamento.js.
import { Botao, CAMPO, Rotulo } from "@/apps/montagem/components/padrao-fin";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { contasDe, nomeFilial } from "@/apps/montagem/components/registrar-pagamento";
import { FILIAIS } from "@/apps/montagem/domain/contas-empresa";
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

function PagamentoConta(p){
  var s = p.s, i = p.item, pago = i.status==="pago", baixas = ((s.cpe||{}).baixas || []).filter(function(b){ return b.chave===i.chave; });
  var ra = useState(hojeIso()), data = ra[0], setData = ra[1], rb = useState("PIX"), forma = rb[0], setForma = rb[1], rc = useState(""), conta = rc[0], setConta = rc[1];
  var rd = useState(0), acr = rd[0], setAcr = rd[1], re = useState(0), desc = re[0], setDesc = re[1], rf = useState(null), pagoEd = rf[0], setPagoEd = rf[1];
  var cn = useState(""), cnpjNovo = cn[0], setCnpjNovo = cn[1], rg = useState(""), obs = rg[0], setObs = rg[1], rh = useState(null), comp = rh[0], setComp = rh[1], ri = useState(""), erro = ri[0], setErro = ri[1];
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
  var corSit = !pago && i.atraso>0 ? "text-warning" : pago ? "text-success" : "";

  // FORMATO B2 (Marcus, 12/11/2026): UMA janela = UM bloco, uma barra azul. Dentro: faixa de células com os dados da conta (4 por linha), valores em TEXTO corrido, e duas colunas: registrar pagamento | pagamentos desta conta.
  var cel = function(rot, valor, cor){ return e("div",{key:rot, className:"min-w-0 border-b border-r border-border px-3 py-1"}, e("p",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, rot), e("p",{className:"text-[13px] font-semibold "+(cor || "")}, valor)); };
  var celulas = e("div",{className:"grid grid-cols-2 md:grid-cols-4 [&>div:nth-child(4n)]:md:border-r-0 [&>div:nth-last-child(-n+4)]:md:border-b-0 border-b border-border"},
    cel("Fornecedor", i.nome), cel("Natureza", (i.nat ? i.nat+" · " : "")+i.natNome), cel("CNPJ", nomeFilial(i.filial)), cel("Origem", i.manual ? "Só no Admin (falta lançar na DevMaster)" : "DevMaster"),
    cel("Emissão", dmy(i.emissao)), cel("Vence", dmy(i.venc)), cel("Nota", i.nota==="sem" ? "Sem nota" : "Com nota"), cel("Já pago", BKC(i.parcialPago || 0)));
  var vlr = function(rot, v, cls){ return e("span",{key:rot, className:"text-[13px] font-normal"}, rot, e("b",{className:"ml-1.5 text-[13px] font-semibold tabular-nums "+(cls || "")}, BKC(v))); };
  var valores = e("div",{className:"flex flex-wrap gap-x-5 gap-y-1 border-b border-border px-3 py-1.5"}, vlr("Valor", valor), vlr("Juros e multa", pago ? 0 : acr), vlr("Desconto", pago ? 0 : desc), vlr(pago ? "Valor pago" : "Total a pagar", pago ? i.valor : devido, "text-primary"), vlr("Falta depois", pago ? 0 : falta));

  // PAGAMENTOS DESTA CONTA (coluna da direita)
  var linhasPag = baixas.map(function(b){ return {id:b.id, b:b, data:dmy(b.data), forma:formaNome(b.forma), saida:b.contaNome || "—", valor:b.principal+(b.juros||0)+(b.multa||0)-(b.desc||0), por:nomeDe(b.por), acao:p.podePagar ? "Desfazer" : ""}; });
  var blocoPag = e("div",{className:"min-w-0 p-3"}, e("p",{className:"mb-1.5 text-[11px] font-semibold uppercase tracking-[.05em]"}, "Pagamentos desta conta"),
    linhasPag.length ? e(TabelaPlanilha,{semContagem:true, semFiltro:true, grade:true, chave:"id", linhas:linhasPag,
      cols:[{k:"data", t:"Data"}, {k:"forma", t:"Forma"}, {k:"saida", t:"Conta de saída"}, {k:"valor", t:"Valor", fmt:BKC}, {k:"comp", t:"Comprovante", render:function(v, l){ return l.b.comprovante ? e("a",{href:l.b.comprovante.url, target:"_blank", rel:"noreferrer", className:"underline"}, "Ver") : "—"; }}, {k:"por", t:"Pago por"}]
        .concat(p.podePagar ? [{k:"acao", t:"Desfazer", render:function(v, l){ return e("button",{type:"button", onClick:function(){ if(window.confirm("Desfazer este pagamento? A conta volta para A pagar.")){ p.desfazer(l.b.id); } }, className:"h-8 rounded-md border border-border px-2 text-[13px] hover:bg-white/10"}, "Desfazer"); }}] : [])})
      : e("p",{className:"rounded-md border border-border px-3 py-4 text-center text-[13px]"}, "Nenhum pagamento ainda."),
    p.podePagar && p.trocarFilial ? e("div",{className:"mt-3 flex flex-wrap items-end gap-2"}, e("div",{className:"min-w-0 flex-1"}, e(Rotulo,{t:"CNPJ da conta", id:"pc-cnpj"}), e("select",{id:"pc-cnpj", value:cnpjNovo || i.filial, onChange:function(ev){ setCnpjNovo(ev.target.value); }, className:CAMPO}, FILIAIS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]+(x[0]==="fora" ? "" : " · "+x[2])); }))),
      e(Botao,{desabilitado:!cnpjNovo || cnpjNovo===i.filial, onClick:function(){ if(window.confirm("Trocar o CNPJ desta conta para "+nomeFilial(cnpjNovo)+"?")){ p.trocarFilial(i, cnpjNovo); } }}, "Trocar CNPJ"), i.filialOrig && e(Botao,{onClick:function(){ p.trocarFilial(i, ""); }}, "Voltar ao original")) : null);

  // REGISTRAR PAGAMENTO (coluna da esquerda)
  var campo = function(rot, id, filho, cls){ return e("div",{className:"min-w-0 "+(cls || "")}, e(Rotulo,{t:rot, id:id}), filho); };
  var form = pago ? e("p",{className:"rounded-md border border-border px-3 py-6 text-center text-[13px]"}, "Esta conta já está paga. O pagamento aparece ao lado, com o botão Desfazer.")
    : !p.podePagar ? e("p",{className:"rounded-md border border-border px-3 py-6 text-center text-[13px]"}, "Só quem tem a autorização \"Registrar pagamento\" dá baixa. Você pode ver os dados.")
    : e("div",{className:"grid grid-cols-2 gap-x-2 gap-y-1.5"},
      campo("Data", "pc-data", e("input",{id:"pc-data", type:"date", value:data, max:hojeIso(), onChange:function(ev){ setData(ev.target.value); setErro(""); }, className:CAMPO})),
      campo("Forma", "pc-forma", e("select",{id:"pc-forma", value:forma, onChange:function(ev){ setForma(ev.target.value); }, className:CAMPO}, FORMAS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); }))),
      campo("Conta de saída · "+nomeFilial(i.filial), "pc-conta", e("select",{id:"pc-conta", value:conta, onChange:function(ev){ setConta(ev.target.value); setErro(""); }, className:CAMPO}, [e("option",{key:"", value:""}, "Escolha a conta")].concat(contas.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); }))), "col-span-2"),
      campo("Juros e multa", "pc-acr", din(acr, "Juros e multa", function(v){ setAcr(v); setPagoEd(null); setErro(""); })),
      campo("Desconto", "pc-desc", din(desc, "Desconto", function(v){ setDesc(v); setPagoEd(null); setErro(""); })),
      campo("Valor pago", "pc-pago", din(pagoV, "Valor pago", function(v){ setPagoEd(v); setErro(""); })),
      campo("Comprovante (opcional)", "pc-comp", e("label",{className:CAMPO+" flex cursor-pointer items-center"}, comp ? "✓ "+comp.nome : "Anexar arquivo", e("input",{id:"pc-comp", type:"file", accept:"image/*,application/pdf", className:"sr-only", onChange:function(ev){ lerComp(ev.target.files[0], setComp); ev.target.value = ""; }}))),
      campo("Observação", "pc-obs", e("input",{id:"pc-obs", type:"text", value:obs, placeholder:"Opcional", onChange:function(ev){ setObs(ev.target.value); }, className:CAMPO}), "col-span-2"),
      parcial && e("p",{className:"col-span-2 text-[13px] text-warning"}, "Pagamento parcial: o que falta ("+BKC(falta)+") continua a pagar."),
      erro && e("p",{className:"col-span-2 text-[13px] text-destructive"}, erro));
  var blocoForm = e("div",{className:"min-w-0 p-3"}, e("p",{className:"mb-1.5 text-[11px] font-semibold uppercase tracking-[.05em]"}, pago ? "Pagamento registrado" : "Registrar pagamento"), form);

  return e("div",{className:"fixed inset-0 z-[80] flex justify-center overflow-y-auto bg-black/70 p-3 md:p-6", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:PADRAO_BLOCOS+" m-auto w-full max-w-5xl rounded-lg bg-[#14171c] text-[13px] [&>section]:!bg-[#14171c]"},
      e(BlocoPainel,{titulo:i.nome+" · "+(num || "sem número")+(i.parc ? " · parcela "+i.parc : ""), dir:e("span",{className:corSit}, situ)},
        celulas, valores,
        e("div",{className:"grid grid-cols-1 items-start md:grid-cols-[1.2fr_1fr] md:[&>div+div]:border-l md:[&>div+div]:border-border"}, blocoForm, blocoPag),
        e("div",{className:"flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2"},
          e("div",{className:"flex gap-2"}, e(Botao,{desabilitado:!ant, onClick:function(){ p.ir(ant); }}, "‹ Conta anterior"), e(Botao,{desabilitado:!prox, onClick:function(){ p.ir(prox); }}, "Próxima conta ›"),
            i.manual && p.podePagar && p.excluir && e(Botao,{onClick:function(){ if(window.confirm("Excluir este lançamento? Ele sai da lista e os pagamentos dele também.")){ p.excluir(String(i.chave).slice(2)); } }}, "Excluir lançamento")),
          e("div",{className:"flex gap-2"}, e(Botao,{onClick:p.fechar}, pago || !p.podePagar ? "Fechar" : "Cancelar"), !pago && p.podePagar && e(Botao,{principal:true, onClick:salvar}, "Registrar pagamento"))))));
}

export { PagamentoConta };
