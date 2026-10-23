// Sorelly Admin · montagem — components/registrar-pagamento.js
// Janela "Registrar pagamento" do Financeiro → Contas a pagar (22/10/2026). Dá baixa em uma ou várias contas do MESMO CNPJ de uma vez.
// Por conta: juros e multa, desconto e valor pago; se pagar menos, a conta fica "parcial" com o que falta. Antes de salvar mostra o resumo para conferir.
// A baixa vira s.cpe.baixas (ação CPE_BAIXA); desfazer = CPE_BAIXA_DESFAZ. O saldo das contas bancárias NÃO muda sozinho (vem do Open Finance, depois).
import { Botao, CAMPO, Rotulo, TabelaP, Td, Tr, FaixaTotais, brl } from "@/apps/montagem/components/padrao-fin";
import { CONTAS_LISTA } from "@/apps/montagem/domain/saldos-contas";
import { FILIAIS } from "@/apps/montagem/domain/contas-empresa";
import { hojeIso } from "@/apps/montagem/domain/financeiro-familiar";
import { BKC } from "@/apps/montagem/lib/format";
import { e, useState } from "@/shared/react";

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var num = function(t){ var v = parseFloat(String(t||"").replace(/\./g, "").replace(",", ".")); return isFinite(v) ? v : 0; };
var FORMAS = [["PIX","Pix"],["BOLETO","Boleto"],["DEBITO_CONTA","Débito em conta"],["TRANSF","Transferência"],["DINHEIRO","Dinheiro"],["CARTAO","Cartão"]];
var nomeFilial = function(id){ var f = FILIAIS.filter(function(x){ return x[0]===id; })[0]; return f ? f[1] : id; };
var dm = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7) : "—"; };

// contas de saída do CNPJ (as do bloco dele + dinheiro); sem bloco próprio (67, Por fora...) mostra todas as de empresa
function contasDe(s, filial){
  var lista = ((s.saldosContas||{}).contas || []).length ? s.saldosContas.contas.map(function(c){ return {id:c.id, nome:c.nome, bloco:c.bloco, bloqueada:c.bloqueada}; }) : CONTAS_LISTA.map(function(c){ return {id:c[0], nome:c[1], bloco:c[2], bloqueada:c[4]}; });
  lista = lista.filter(function(c){ return !c.bloqueada && c.bloco!=="BLOQ"; });
  var proprias = lista.filter(function(c){ return c.bloco===filial || c.bloco==="DIN"; });
  return proprias.length>1 ? proprias : lista;
}

function CampoNum(p){
  return e("input",{type:"text", inputMode:"decimal", value:p.value, onChange:function(ev){ p.onChange(ev.target.value); }, "aria-label":p.rotulo, placeholder:p.placeholder||"0,00", className:CAMPO+" text-right tabular-nums"});
}

function RegistrarPagamento(p){
  var s = p.s, itens = p.itens, filial = itens[0].filial;
  var contas = contasDe(s, filial);
  var a = useState(hojeIso()), data = a[0], setData = a[1], b = useState("PIX"), forma = b[0], setForma = b[1], c = useState(""), conta = c[0], setConta = c[1];
  var d = useState(""), obs = d[0], setObs = d[1], f = useState({}), ln = f[0], setLn = f[1], g = useState(false), resumo = g[0], setResumo = g[1], h = useState(""), erro = h[0], setErro = h[1];
  var campo = function(i, k){ return (ln[i.id] || {})[k]; };
  var muda = function(i, k, v){ var n = Object.assign({}, ln), x = Object.assign({}, n[i.id]); x[k] = v; if(k!=="pago") { /* mudar juros ou desconto refaz o valor pago sozinho */ delete x.pago; } n[i.id] = x; setLn(n); setErro(""); };
  var calc = function(i){
    var acr = num(campo(i, "acr")), desc = num(campo(i, "desc")), devido = r2(i.valor+acr-desc), pT = campo(i, "pago"), pago = pT===undefined ? devido : num(pT);
    var principal = r2(Math.min(i.valor, Math.max(0, pago-acr+desc)));
    return {acr:acr, desc:desc, devido:devido, pago:pago, principal:principal, falta:r2(i.valor-principal), parcial:principal<i.valor-0.004};
  };
  var linhas = itens.map(function(i){ return {i:i, c:calc(i)}; });
  var totPago = r2(linhas.reduce(function(t, x){ return t+x.c.pago; }, 0)), totConta = r2(itens.reduce(function(t, i){ return t+i.valor; }, 0)), nParc = linhas.filter(function(x){ return x.c.parcial; }).length;
  var contaNome = (contas.filter(function(x){ return x.id===conta; })[0] || {}).nome || "";
  var conferir = function(){
    if(!data){ setErro("Informe a data do pagamento."); return; }
    if(data>hojeIso()){ setErro("A data não pode ser depois de hoje."); return; }
    if(!conta){ setErro("Escolha a conta de saída."); return; }
    for(var k = 0; k<linhas.length; k++){ var x = linhas[k]; if(!(x.c.pago>0) || x.c.principal<=0){ setErro("Informe o valor pago de "+x.i.nome+"."); return; } if(x.c.pago>x.c.devido+0.004){ setErro("O valor pago de "+x.i.nome+" é maior que o devido ("+BKC(x.c.devido)+")."); return; } }
    setErro(""); setResumo(true);
  };
  var salvar = function(){
    var agora = Date.now();
    var baixas = linhas.map(function(x, k){ return {id:"bx"+agora+"-"+k, chave:x.i.chave, data:data, forma:forma, conta:conta, contaNome:contaNome, principal:x.c.principal, juros:x.c.acr, multa:0, desc:x.c.desc, obs:obs.trim(), por:s.usuario, em:agora, desc_txt:x.i.nome+" · "+((x.i.pref||"")+" "+(x.i.num||"")).trim()+" · "+nomeFilial(filial)}; });
    p.salvar(baixas);
  };
  var box = "w-full max-w-4xl rounded-2xl border border-white/15 bg-[#14171c] p-4 shadow-2xl";
  var formaNome = (FORMAS.filter(function(x){ return x[0]===forma; })[0] || [])[1];
  return e("div",{className:"fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4", onClick:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }},
    e("div",{className:box},
      e("div",{className:"mb-3 flex items-center"}, e("h3",{className:"text-[16px] font-semibold text-foreground"}, resumo ? "Conferir pagamento" : "Registrar pagamento"), e("button",{type:"button", onClick:p.fechar, className:"ml-auto h-8 rounded-md border border-border px-3 text-[13px] text-foreground hover:bg-white/10"}, "Fechar")),
      !resumo ? e("div",{className:"flex flex-col gap-3"},
        e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
          e("div",{className:"min-w-0"}, e(Rotulo,{t:"Data", id:"rp-data"}), e("input",{id:"rp-data", type:"date", value:data, max:hojeIso(), onChange:function(ev){ setData(ev.target.value); setErro(""); }, className:CAMPO})),
          e("div",{className:"min-w-0"}, e(Rotulo,{t:"Forma", id:"rp-forma"}), e("select",{id:"rp-forma", value:forma, onChange:function(ev){ setForma(ev.target.value); }, className:CAMPO+" truncate"}, FORMAS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); }))),
          e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Conta de saída · "+nomeFilial(filial), id:"rp-conta"}), e("select",{id:"rp-conta", value:conta, onChange:function(ev){ setConta(ev.target.value); setErro(""); }, className:CAMPO+" truncate"}, [e("option",{key:"", value:""}, "Escolha a conta")].concat(contas.map(function(x){ return e("option",{key:x.id, value:x.id}, x.nome); })))),
          e("div",{className:"col-span-2 min-w-0 md:col-span-4"}, e(Rotulo,{t:"Observação", id:"rp-obs"}), e("input",{id:"rp-obs", type:"text", value:obs, onChange:function(ev){ setObs(ev.target.value); }, placeholder:"Opcional", className:CAMPO}))),
        e(TabelaP,{minW:820, cols:[{t:"Vence", w:70},{t:"Fornecedor"},{t:"Número", w:140},{t:"Valor", n:true, w:120},{t:"Juros e multa", n:true, w:140},{t:"Desconto", n:true, w:110},{t:"Pago", n:true, w:130}]},
          linhas.map(function(x){ var i = x.i; return e("tr",{key:i.id},
            e(Td,null, dm(i.venc)), e(Td,{forte:true}, i.nome), e(Td,null, ((i.pref||"")+" "+(i.num||"")).trim() || "—"), e(Td,{n:true}, BKC(i.valor)),
            e("td",{className:"border-b border-border px-1.5"}, e(CampoNum,{rotulo:"Juros e multa", value:campo(i, "acr")||"", onChange:function(v){ muda(i, "acr", v); }})),
            e("td",{className:"border-b border-border px-1.5"}, e(CampoNum,{rotulo:"Desconto", value:campo(i, "desc")||"", onChange:function(v){ muda(i, "desc", v); }})),
            e("td",{className:"border-b border-border px-1.5"}, e(CampoNum,{rotulo:"Valor pago", value:campo(i, "pago")!==undefined ? campo(i, "pago") : String(x.c.devido.toFixed(2)).replace(".", ","), onChange:function(v){ var n = Object.assign({}, ln), y = Object.assign({}, n[i.id]); y.pago = v; n[i.id] = y; setLn(n); setErro(""); }}))); }),
          e(Tr,{key:"t", total:true}, e(Td,null, ""), e(Td,null, linhas.length+" "+(linhas.length>1 ? "contas" : "conta")), e(Td,null, ""), e(Td,{n:true}, BKC(totConta)), e(Td,null, ""), e(Td,null, ""), e(Td,{n:true}, BKC(totPago)))),
        nParc>0 && e("p",{className:"text-[13px] text-warning"}, nParc+(nParc>1 ? " contas ficam parciais (o que falta continua a pagar)." : " conta fica parcial (o que falta continua a pagar).")),
        erro && e("p",{className:"text-[13px] text-destructive"}, erro),
        e("div",{className:"flex justify-end gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, onClick:conferir}, "Conferir")))
      : e("div",{className:"flex flex-col gap-3"},
        e(FaixaTotais,{itens:[{t:"CNPJ", v:nomeFilial(filial)},{t:"Contas", v:String(linhas.length)},{t:"Data", v:data.slice(8)+"/"+data.slice(5,7)+"/"+data.slice(0,4)},{t:"Forma", v:formaNome||""},{t:"Total pago", v:BKC(totPago)}]}),
        e("p",{className:"text-[13px] text-foreground"}, "Sai da conta: ", e("b",null, contaNome), obs.trim() ? " · "+obs.trim() : ""),
        e(TabelaP,{minW:640, cols:[{t:"Fornecedor"},{t:"Número", w:110},{t:"Valor", n:true, w:120},{t:"Pago", n:true, w:120},{t:"Situação", w:150}]},
          linhas.map(function(x){ return e(Tr,{key:x.i.id}, e(Td,{forte:true}, x.i.nome), e(Td,null, ((x.i.pref||"")+" "+(x.i.num||"")).trim() || "—"), e(Td,{n:true}, BKC(x.i.valor)), e(Td,{n:true}, BKC(x.c.pago)), e(Td,{cor:x.c.parcial ? "text-warning" : ""}, x.c.parcial ? "Parcial · falta "+BKC(x.c.falta) : "Quita a conta")); })),
        e("div",{className:"flex justify-end gap-2"}, e(Botao,{onClick:function(){ setResumo(false); }}, "Voltar"), e(Botao,{principal:true, onClick:salvar}, "Confirmar pagamento")))));
}

export { RegistrarPagamento, nomeFilial };
