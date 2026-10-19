// Sorelly Admin · montagem — pages/ChavesPix.js
// Financeiro → Chaves Pix e regras: cadastro das contas Pix (CNPJ, banco, chave), regras que decidem a conta sozinhas, maquininha única e vendas para dividir.
// Lógica em domain/pix-regras.js (s.px). As chaves ficam só neste computador (o repositório é público).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina } from "@/apps/montagem/components/padrao";
import { CNPJS, TIPOS_CONTA, pxDividir, pxRepEnviado } from "@/apps/montagem/domain/pix-regras";
import { REPRESENTANTES } from "@/apps/montagem/domain/pessoas";
import { nomeDe, podeConferirPag, podeFinanceiro } from "@/apps/montagem/domain/equipe";
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var IN = INPUT+" h-9! text-[13px]!";
function useX(){ var cx = use(), s = cx.state; return {s:s, px:s.px, edita:podeConferirPag(s.usuario) || podeFinanceiro(s.usuario), go:function(op, extra){ cx.dispatch(Object.assign({type:"PX", op:op, por:nomeDe(s.usuario)}, extra)); }}; }
function Campo(p){ return e("label",{className:"flex min-w-0 flex-col gap-1 text-center text-[11.5px] font-semibold text-white/70 "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, disabled:p.disabled, "aria-label":p.rot, className:IN+" cursor-pointer w-full", onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{key:p.k, defaultValue:p.value, type:p.type||"text", disabled:p.disabled, placeholder:p.ph||"", "aria-label":p.rot, className:IN+" text-center w-full", onBlur:function(ev){ if(ev.target.value!==String(p.value)) p.onChange(ev.target.value); }}); }

function Dividir(p){
  var X = p.X, lista = (X.s.lancFin||[]).map(function(lf){ return {lf:lf, d:pxDividir(X.px, lf)}; }).filter(function(o){ return o.d && !o.lf.cancelado; });
  if(!lista.length) return null;
  return e(BlocoBarra,{cor:"vermelho", t:"Vendas para dividir", sub:"Pix em CNPJ diferente do link/cartão: dividir a venda na Devmaster (faturamento)", dir:String(lista.length), compacto:true},
    e("div",{className:"flex flex-col gap-1.5 p-3"}, lista.map(function(o){ return e("div",{key:o.lf.id, className:"rounded-lg bg-black/25 px-3 py-2 text-center text-[13px]"}, e("b",null, o.lf.nome), " · cartão/link no CNPJ "+o.d.cartao.join(", ")+" · Pix no CNPJ "+o.d.pix.join(", ")); })));
}

function Regras(p){
  var X = p.X, px = X.px, st = useState({nome:"", dinheiroPctMin:"", pixMin:"", pixMax:"", totalMin:"", destino:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var ativas = px.contas.filter(function(c){ return c.ativa; });
  var optConta = function(){ return [e("option",{key:"_", value:""}, "Escolha a conta")].concat(ativas.map(function(c){ return e("option",{key:c.id, value:c.id}, c.label); })); };
  var quando = function(r){ var q = r.quando||{}, t = []; if(q.dinheiroPctMin!==undefined && q.dinheiroPctMin!=="") t.push("dinheiro ≥ "+q.dinheiroPctMin+"% do pago"); if(q.pixMin!==undefined && q.pixMin!=="") t.push("Pix ≥ R$ "+q.pixMin); if(q.pixMax!==undefined && q.pixMax!=="") t.push("Pix < R$ "+q.pixMax); if(q.totalMin!==undefined && q.totalMin!=="") t.push("total pago ≥ R$ "+q.totalMin); return t.join(" e ") || "sem condição"; };
  var salvar = function(){ var q = {}; ["dinheiroPctMin","pixMin","pixMax","totalMin"].forEach(function(k){ if(f[k]!=="") q[k] = Number(String(f[k]).replace(",", ".")); }); X.go("regra_add", {nome:f.nome, quando:q, destino:f.destino}); st[1]({nome:"", dinheiroPctMin:"", pixMin:"", pixMax:"", totalMin:"", destino:""}); };
  return e(BlocoBarra,{cor:"azul", t:"Regras automáticas", sub:"Valem na ordem: a primeira que combina decide a conta do Pix", dir:String(px.regras.length), compacto:true}, e("div",{className:"flex flex-col gap-2 p-3"},
    px.regras.length ? px.regras.map(function(r, i){ return e("div",{key:r.id, className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-[13px] "+(r.ativa===false ? "opacity-50" : "")},
      e("b",{className:"text-[#93C5FD]"}, (i+1)+"."), e("b",null, r.nome), e("span",{className:"text-white/75"}, "Se "+quando(r)+" → "), e("b",null, r.destino || "sem conta"),
      X.edita && e("div",{className:"flex items-center gap-1"},
        e(Btn,{v:"ghost", sm:true, disabled:i===0, onClick:function(){ X.go("regra_mover", {id:r.id, dir:-1}); }}, "↑"), e(Btn,{v:"ghost", sm:true, disabled:i===px.regras.length-1, onClick:function(){ X.go("regra_mover", {id:r.id, dir:1}); }}, "↓"),
        e(Btn,{v:"ghost", sm:true, onClick:function(){ X.go("regra_set", {id:r.id, patch:{ativa:r.ativa===false}}); }}, r.ativa===false ? "Ligar" : "Desligar"),
        e(Btn,{v:"ghost", sm:true, onClick:function(){ if(window.confirm("Excluir a regra "+r.nome+"?")) X.go("regra_del", {id:r.id}); }}, "Excluir"))); })
      : e("p",{className:"py-2 text-center text-[13px] text-white/60"}, "Nenhuma regra ainda. Crie abaixo (ex.: dinheiro ≥ 70% → PIX - ITAÚ PJ - MARCO)."),
    X.edita && e("div",{className:"grid gap-2 rounded-xl bg-black/25 p-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(9.5rem, 1fr))"}},
      e(Campo,{rot:"Nome da regra"}, e("input",{value:f.nome, "aria-label":"Nome da regra", className:IN+" text-center w-full", onChange:function(ev){ set({nome:ev.target.value}); }})),
      e(Campo,{rot:"Dinheiro a partir de (% do pago)"}, e("input",{value:f.dinheiroPctMin, inputMode:"decimal", "aria-label":"Dinheiro a partir de", className:IN+" text-center w-full", onChange:function(ev){ set({dinheiroPctMin:ev.target.value}); }})),
      e(Campo,{rot:"Pix a partir de (R$)"}, e("input",{value:f.pixMin, inputMode:"decimal", "aria-label":"Pix a partir de", className:IN+" text-center w-full", onChange:function(ev){ set({pixMin:ev.target.value}); }})),
      e(Campo,{rot:"Pix abaixo de (R$)"}, e("input",{value:f.pixMax, inputMode:"decimal", "aria-label":"Pix abaixo de", className:IN+" text-center w-full", onChange:function(ev){ set({pixMax:ev.target.value}); }})),
      e(Campo,{rot:"Total pago a partir de (R$)"}, e("input",{value:f.totalMin, inputMode:"decimal", "aria-label":"Total pago a partir de", className:IN+" text-center w-full", onChange:function(ev){ set({totalMin:ev.target.value}); }})),
      e(Campo,{rot:"Mandar o Pix para"}, e(Sel,{rot:"Conta", value:f.destino, onChange:function(v){ set({destino:v}); }}, optConta())),
      e("div",{className:"flex items-end justify-center"}, e(Btn,{v:"primary", ic:"plus", disabled:!f.nome.trim() || !f.destino || !["dinheiroPctMin","pixMin","pixMax","totalMin"].some(function(k){ return f[k]!==""; }), onClick:salvar}, "Criar regra")))));
}

// Conta fixa do Pix por representante: o Pix dela vai para essa conta (ou para a conta padrão do CNPJ da maquininha dela). Vale depois do "mesmo CNPJ do link/cartão da venda" e antes das regras gerais.
function RepsContaFixa(p){
  var X = p.X, px = X.px, reps = px.reps || [], ativas = px.contas.filter(function(c){ return c.ativa; });
  var de = function(nome){ return reps.find(function(r){ return r.representante===nome; }) || {representante:nome, cnpj:"", contaPix:"", obs:""}; };
  var ed = function(nome, patch){ X.go("rep_set", {representante:nome, patch:patch}); };
  var n = reps.filter(function(r){ return r.cnpj || r.contaPix; }).length;
  return e(BlocoBarra,{cor:"azul", t:"Representantes: conta fixa do Pix", sub:"Cada representante tem a sua maquininha: o Pix dela cai na conta marcada aqui (ou na conta padrão do CNPJ da maquininha)", dir:n+" de "+REPRESENTANTES.length, compacto:true},
    e("div",{className:"flex flex-col gap-2 p-3"},
      e("p",{className:"text-center text-[12px] text-white/60"}, "Ordem: 1) venda com link/cartão manda o Pix para o mesmo CNPJ · 2) conta fixa da representante · 3) regras automáticas · 4) fila para alguém definir."),
      e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fill, minmax(min(100%, 16rem), 1fr))"}}, REPRESENTANTES.map(function(rp){ var r = de(rp.nome), on = !!(r.cnpj || r.contaPix);
        return e("div",{key:rp.nome, className:"flex min-w-0 flex-col gap-1.5 rounded-xl bg-black/25 p-2.5 text-center "+(on ? "ring-1 ring-[#3B82F6]/60" : "")},
          e("b",{className:"break-words text-[13px] leading-tight"}, rp.nome),
          e(Sel,{rot:"CNPJ da maquininha", value:r.cnpj||"", disabled:!X.edita, onChange:function(v){ ed(rp.nome, {cnpj:v}); }}, e("option",{value:""}, "Maquininha: sem CNPJ"), CNPJS.map(function(k){ return e("option",{key:k, value:k}, "Maquininha CNPJ "+k); })),
          e(Sel,{rot:"Conta fixa do Pix", value:r.contaPix||"", disabled:!X.edita, onChange:function(v){ ed(rp.nome, {contaPix:v}); }}, e("option",{value:""}, r.cnpj ? "Conta padrão do CNPJ "+r.cnpj : "Sem conta fixa"), ativas.map(function(c){ return e("option",{key:c.id, value:c.id}, c.label); })),
          e("div",{className:"grid grid-cols-2 gap-1.5"},
            e(Campo,{rot:"Vale até (dia e hora)"}, e("input",{key:r.ate, type:"datetime-local", defaultValue:r.ate||"", disabled:!X.edita, "aria-label":"Vale até", className:IN+" text-center w-full", onBlur:function(ev){ if(ev.target.value!==(r.ate||"")) ed(rp.nome, {ate:ev.target.value}); }})),
            e(Campo,{rot:"Até quanto enviar (R$)"}, e(Txt,{k:r.valorMax, rot:"Até quanto enviar", ph:"Sem limite", value:r.valorMax||"", disabled:!X.edita, onChange:function(v){ var n = Number(String(v).replace(/./g, "").replace(",", ".")); ed(rp.nome, {valorMax:n>0 ? n : ""}); }}))),
          r.valorMax ? e("span",{className:"text-[11.5px] font-semibold text-white/70"}, "Já enviado: R$ "+pxRepEnviado(r, X.s.lancFin).toLocaleString("pt-BR",{minimumFractionDigits:2})+" de R$ "+Number(r.valorMax).toLocaleString("pt-BR",{minimumFractionDigits:2})) : null,
          r.ate && Date.now() > new Date(r.ate).getTime() ? e("span",{className:"text-[11.5px] font-bold text-warning"}, "Prazo vencido: o Pix volta para as regras gerais") : null,
          e(Txt,{k:r.obs, rot:"Observação", ph:"Observação", value:r.obs||"", disabled:!X.edita, onChange:function(v){ ed(rp.nome, {obs:v}); }})); }))));
}

function Maquininha(p){
  var X = p.X, m = X.px.maquininha || {};
  return e(BlocoBarra,{cor:"azul", t:"Maquininha única", sub:"Cartão passado nela já entra como pago, sem pedir conta", compacto:true}, e("div",{className:"flex flex-wrap items-center justify-center gap-3 p-3 text-[13px]"},
    e("label",{className:"flex cursor-pointer items-center gap-2 font-semibold"}, e("input",{type:"checkbox", checked:m.ativa!==false, disabled:!X.edita, className:"size-4", onChange:function(ev){ X.go("maq_set", {patch:{ativa:ev.target.checked}}); }}), "Usar uma só maquininha"),
    e("div",{className:"w-56"}, e(Txt,{k:m.nome, rot:"Nome da maquininha", value:m.nome||"", disabled:!X.edita, onChange:function(v){ X.go("maq_set", {patch:{nome:v.trim()}}); }})),
    e("span",{className:"text-white/60"}, "Hoje só a Getnet, da Pontual. Desligue quando houver mais de uma.")));
}

function Contas(p){
  var X = p.X, px = X.px, fl = useState(""), cn = fl[0], nv = useState({label:"", cnpj:"", tipo:"empresa"}), f = nv[0];
  var lista = px.contas.filter(function(c){ return !cn || (cn==="_" ? !c.cnpj : c.cnpj===cn); });
  var ed = function(c, patch){ X.go("conta_set", {id:c.id, patch:patch}); };
  var chip = function(k, rot){ var on = cn===k; return e("button",{key:k, type:"button", onClick:function(){ fl[1](k); }, className:"rounded-full px-3 py-1 text-[12.5px] font-bold "+(on ? "bg-[#3B82F6] text-black" : "bg-white/10 hover:bg-white/20")}, rot); };
  return e(BlocoBarra,{cor:"azul", t:"Contas Pix", sub:"Marque o CNPJ de cada conta. Em cada CNPJ, a conta padrão recebe o Pix da venda com link ou cartão desse CNPJ.", dir:String(px.contas.filter(function(c){ return c.ativa; }).length), compacto:true}, e("div",{className:"flex flex-col gap-2.5 p-3"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, chip("", "Todas"), CNPJS.map(function(c){ return chip(c, "CNPJ "+c); }), chip("_", "Sem CNPJ")),
    X.edita && e("div",{className:"flex flex-wrap items-end justify-center gap-2 rounded-xl bg-black/25 p-2.5"},
      e(Campo,{rot:"Nome oficial da conta", className:"w-64"}, e("input",{value:f.label, placeholder:"PIX - ITAÚ - 59", "aria-label":"Nome da conta", className:IN+" text-center w-full", onChange:function(ev){ nv[1](Object.assign({}, f, {label:ev.target.value})); }})),
      e(Campo,{rot:"CNPJ", className:"w-28"}, e(Sel,{rot:"CNPJ", value:f.cnpj, onChange:function(v){ nv[1](Object.assign({}, f, {cnpj:v})); }}, e("option",{value:""}, "Automático"), CNPJS.map(function(c){ return e("option",{key:c, value:c}, c); }))),
      e(Btn,{v:"primary", ic:"plus", disabled:!f.label.trim(), onClick:function(){ X.go("conta_add", {label:f.label, cnpj:f.cnpj}); nv[1]({label:"", cnpj:"", tipo:"empresa"}); }}, "Criar conta")),
    e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fill, minmax(min(100%, 17rem), 1fr))"}}, lista.map(function(c){ var cor = (TIPOS_CONTA[c.tipo]||[0,"#94A3B8"])[1];
      return e("div",{key:c.id, className:"flex min-w-0 flex-col gap-1.5 rounded-xl p-2.5 text-center "+(c.ativa ? "" : "opacity-50"), style:{background:"linear-gradient(135deg,"+cor+"26,"+cor+"08 70%)", boxShadow:"inset 0 0 0 1px "+cor+"55"}},
        e("b",{className:"break-words text-[13px] leading-tight"}, c.label),
        c.favorecido && e("span",{className:"text-[11.5px] leading-tight text-white/65"}, c.favorecido+(c.banco ? " · "+c.banco : "")+(c.tipoChave ? " · chave "+({PHONE:"telefone", EMAIL:"e-mail", CNPJ:"CNPJ", CPF:"CPF", RANDOM:"aleatória"}[c.tipoChave]||c.tipoChave) : "")),
        e("div",{className:"grid grid-cols-2 gap-1.5"},
          e(Sel,{rot:"CNPJ", value:c.cnpj, disabled:!X.edita, onChange:function(v){ ed(c, {cnpj:v}); }}, e("option",{value:""}, "Sem CNPJ"), CNPJS.map(function(k){ return e("option",{key:k, value:k}, "CNPJ "+k); })),
          e(Sel,{rot:"Tipo", value:c.tipo, disabled:!X.edita, onChange:function(v){ ed(c, {tipo:v}); }}, Object.keys(TIPOS_CONTA).map(function(k){ return e("option",{key:k, value:k}, TIPOS_CONTA[k][0]); }))),
        e(Txt,{k:c.banco, rot:"Banco", ph:"Banco", value:c.banco, disabled:!X.edita, onChange:function(v){ ed(c, {banco:v}); }}),
        e("div",{className:"flex items-center gap-1.5"}, e("div",{className:"min-w-0 flex-1"}, e(Txt,{k:c.chave, rot:"Chave Pix", ph:"Chave Pix (copiar ou editar)", value:c.chave, disabled:!X.edita, onChange:function(v){ ed(c, {chave:v}); }})), c.chave ? e(CopiarChave,{texto:c.chave}) : null),
        (c.agencia || c.numConta) && e("span",{className:"text-[11.5px] text-white/65"}, (c.agencia ? "Agência "+c.agencia : "")+(c.agencia && c.numConta ? " · " : "")+(c.numConta ? "Conta "+c.numConta : "")),
        e("div",{className:"flex items-center justify-between gap-2 text-[12.5px] font-semibold"},
          e("label",{className:"flex cursor-pointer items-center gap-1.5", title:"Recebe o Pix das vendas com link ou cartão deste CNPJ"}, e("input",{type:"checkbox", checked:!!c.padrao, disabled:!X.edita || !c.cnpj, className:"size-4", onChange:function(ev){ ed(c, {padrao:ev.target.checked}); }}), "Padrão do CNPJ"),
          e("label",{className:"flex cursor-pointer items-center gap-1.5"}, e("input",{type:"checkbox", checked:c.ativa, disabled:!X.edita, className:"size-4", onChange:function(ev){ ed(c, {ativa:ev.target.checked}); }}), "Ativa"))); })),
    e("p",{className:"text-center text-[12px] text-white/60"}, "As chaves Pix ficam só neste computador (não vão para o GitHub).")));
}

function AbaChavesPix(){
  var X = useX(), px = X.px;
  var div = (X.s.lancFin||[]).filter(function(lf){ return !lf.cancelado && pxDividir(px, lf); }).length;
  return e(Pagina,null,
    e(PageHead,{t:"Chaves Pix e regras", sub:"O sistema decide sozinho a conta de cada pagamento do atendimento interno e dos pedidos das representantes. O que não tiver regra cai em Controle de pagamentos para alguém definir."}),
    e(Faixa,{n:4}, e(Indicador,{t:"Contas Pix ativas", v:String(px.contas.filter(function(c){ return c.ativa; }).length), cor:"info"}), e(Indicador,{t:"Regras ligadas", v:String(px.regras.filter(function(r){ return r.ativa!==false; }).length), cor:"total"}),
      e(Indicador,{t:"Contas sem CNPJ", v:String(px.contas.filter(function(c){ return c.ativa && !c.cnpj; }).length), cor:"neutro"}), e(Indicador,{t:"Vendas para dividir", v:String(div), cor:div ? "ruim" : "ok"})),
    e(Contas,{X:X}), e(Dividir,{X:X}), e(Regras,{X:X}), e(Maquininha,{X:X}), e(RepsContaFixa,{X:X}));   // as chaves Pix (copiar/editar) vêm primeiro
}
export { AbaChavesPix };
