// Sorelly Admin · montagem — pages/fiscal/Configuracao.js
// Fiscal → Configuração: metas e limites (ILF, sublimite) e cadastro das empresas/CNPJs do Fiscal. Só a diretoria edita; os demais veem em leitura.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, LINHA, Tab, Td } from "@/apps/montagem/components/padrao";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { fxLancamentosDe } from "@/apps/montagem/domain/fiscal";
import { Aviso, Bt, Campo, Chip, ENTRADA, Jan, Selo, Vazio, fmt, useFx } from "@/apps/montagem/pages/fiscal/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var pctTxt = function(r){ return String(Math.round(r*10000)/100); };
var pctNum = function(t){ var n = parseFloat(String(t).replace(",", ".")); return isFinite(n) ? Math.min(100, Math.max(0, n))/100 : 0; };
// campo de percentual (0 a 100)
function Pct(p){ return e(Campo,{t:p.t}, e("div",{className:"relative"}, e("input",{type:"number", min:0, max:100, step:"0.5", value:p.v, disabled:p.disabled, "aria-label":p.t, onChange:function(ev){ p.set(ev.target.value); }, className:ENTRADA+" "+MONO+" pr-8"}),
  e("span",{className:"pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60"}, "%")), p.dica && e("span",{className:"text-[11px] text-white/55"}, p.dica)); }

function BlocoLimites(p){
  var f = p.f, c = f.fx.config, st = useState({sub:c.sublimiteAnual, meta:pctTxt(c.metaIlf), crit:pctTxt(c.criticoIlf), min:c.minimoAtivo, risco:pctTxt(c.riscoPct), uso:pctTxt(c.usoLimitePct)}), v = st[0];
  var set = function(o){ st[1](Object.assign({}, v, o)); };
  var salvar = function(){ f.envia({op:"config_set", sublimiteAnual:Number(v.sub)||0, metaIlf:pctNum(v.meta), criticoIlf:pctNum(v.crit), minimoAtivo:Number(v.min)||0, riscoPct:pctNum(v.risco), usoLimitePct:pctNum(v.uso)}); };
  var d = !f.dir;
  return e(BlocoBarra,{cor:"turquesa", t:"Metas e limites", compacto:true},
    e("div",{className:"flex flex-col gap-2.5 p-2.5"},
      e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 12rem), 1fr))"}},
        e(Campo,{t:"Sublimite anual do Simples"}, e(Dinheiro,{value:v.sub, label:"Sublimite anual", disabled:d, onChange:function(n){ set({sub:n||0}); }})),
        e(Pct,{t:"Meta do ILF", v:v.meta, set:function(x){ set({meta:x}); }, disabled:d, dica:"Verde a partir daqui"}),
        e(Pct,{t:"Limite crítico do ILF", v:v.crit, set:function(x){ set({crit:x}); }, disabled:d, dica:"Vermelho abaixo daqui"}),
        e(Campo,{t:"Venda mínima para estar ativo"}, e(Dinheiro,{value:v.min, label:"Venda mínima", disabled:d, onChange:function(n){ set({min:n||0}); }}), e("span",{className:"text-[11px] text-white/55"}, "Abaixo disso, sem movimento")),
        e(Pct,{t:"Projeção em atenção", v:v.risco, set:function(x){ set({risco:x}); }, disabled:d, dica:"% do sublimite"}),
        e(Pct,{t:"Contas no limite", v:v.uso, set:function(x){ set({uso:x}); }, disabled:d, dica:"% do que ainda cabe"})),
      d ? e(Aviso,{cor:"info", ic:"lock-simple"}, "Somente a diretoria altera as metas e os limites.") : e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"floppy-disk", onClick:salvar}, "Salvar metas e limites"))));
}

// janela de cadastro/edição de empresa, em colunas
function JanelaEmpresa(p){
  var f = p.f, x = p.emp, cad = cnpjsDe(f.s.cnpjs), st = useState({nome:x ? x.nome : "", razao:x ? x.razao : "", cnpj:x ? x.cnpj : "", cnpjId:x ? x.cnpjId : ""}), v = st[0];
  var set = function(o){ st[1](Object.assign({}, v, o)); };
  var ligar = function(c){ if(v.cnpjId===c.id) return set({cnpjId:""}); set({cnpjId:c.id, nome:v.nome || c.nome, razao:v.razao || c.razao, cnpj:v.cnpj || c.cnpj}); };
  var salvar = function(){ if(!v.nome.trim()) return; f.envia(Object.assign({op:x ? "empresa_set" : "empresa_add", id:x ? x.id : undefined}, v)); p.fechar(); };
  return e(Jan,{t:x ? "Editar empresa" : "Nova empresa", sub:"Empresa acompanhada no Fiscal. Sem CNPJ, fica fora dos avisos e do resumo.", fechar:p.fechar,
    colunas:[
      e("div",{key:"a", className:"flex flex-col gap-2"}, e(Campo,{t:"Nome"}, e("input",{value:v.nome, "aria-label":"Nome", onChange:function(ev){ set({nome:ev.target.value}); }, className:ENTRADA})),
        e(Campo,{t:"Razão social"}, e("input",{value:v.razao, "aria-label":"Razão social", onChange:function(ev){ set({razao:ev.target.value}); }, className:ENTRADA}))),
      e("div",{key:"b", className:"flex flex-col gap-2"}, e(Campo,{t:"CNPJ"}, e("input",{value:v.cnpj, inputMode:"numeric", "aria-label":"CNPJ", onChange:function(ev){ set({cnpj:ev.target.value}); }, className:ENTRADA+" "+MONO, placeholder:"00.000.000/0000-00"}))),
      e("div",{key:"c", className:"flex flex-col gap-2"}, e(Campo,{t:"Ligar ao cadastro de CNPJs"}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, cad.map(function(c){ return e(Chip,{key:c.id, on:v.cnpjId===c.id, onClick:function(){ ligar(c); }}, c.nome); }))),
        e("p",{className:"text-center text-[11.5px] text-white/60"}, "A ligação permite que o Limite de faturamento e as Contas a pagar leiam os mesmos dados."))],
    rodape:[e(Bt,{key:"s", tipo:"forte", ic:"check-circle", disabled:!v.nome.trim(), onClick:salvar}, "Salvar empresa"), e(Bt,{key:"x", onClick:p.fechar}, "Cancelar")]});
}
// aviso formal antes de excluir
function JanelaExcluir(p){
  var f = p.f, x = p.emp, l = fxLancamentosDe(f.fx, x.id), tem = l.notas+l.saidas+l.contas;
  return e(Jan,{t:"Excluir empresa", sub:x.nome, fechar:p.fechar,
    colunas:[e("div",{key:"a", className:"flex flex-col items-center gap-2"}, e(Aviso,{cor:tem ? "ruim" : "alerta"}, tem ? "Esta empresa possui "+l.notas+" nota(s) de entrada, "+l.saidas+" lançamento(s) de saída e "+l.contas+" mês(es) de contas. A exclusão remove todos esses lançamentos e não pode ser desfeita." : "A empresa será removida do Fiscal. Esta ação não pode ser desfeita."))],
    rodape:[e(Bt,{key:"e", tipo:"perigo", ic:"trash", onClick:function(){ f.envia({op:"empresa_del", id:x.id, confirmar:true}); p.fechar(); }}, tem ? "Excluir empresa e lançamentos" : "Excluir empresa"), e(Bt,{key:"x", onClick:p.fechar}, "Cancelar")]});
}

function AbaFxConfig(){
  var f = useFx(), emps = f.fx.empresas, cad = cnpjsDe(f.s.cnpjs), jn = useState(null);   // jn: {tipo:"edit"|"del", emp}
  var nomeCad = function(id){ var c = cad.filter(function(k){ return k.id===id; })[0]; return c ? c.nome : "—"; };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(BlocoLimites,{f:f, key:JSON.stringify(f.fx.config)}),
    e(BlocoBarra,{cor:"turquesa", t:"Empresas e CNPJs do Fiscal", compacto:true, dir:emps.length},
      e("div",{className:"flex flex-col gap-2 p-2"},
        f.dir && e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ jn[1]({tipo:"edit", emp:null}); }}, "Nova empresa")),
        emps.length ? e(Tab,{cols:["Empresa","Razão social","CNPJ","Cadastro de CNPJs","Lançamentos"].concat(f.dir ? [""] : [])}, emps.map(function(x){ var l = fxLancamentosDe(f.fx, x.id);
          return e("tr",{key:x.id, className:LINHA}, e(Td,{forte:true}, x.nome), e(Td,null, x.razao || "—"), e(Td,{dinheiro:true}, x.cnpj || e(Selo,{cor:"alerta"}, "Sem CNPJ")), e(Td,null, x.cnpjId ? nomeCad(x.cnpjId) : "—"), e(Td,{dinheiro:true}, l.notas+l.saidas+l.contas),
            f.dir && e(Td,null, e("div",{className:"flex justify-center gap-1"}, e(Bt,{rotulo:"Editar empresa", titulo:"Editar", ic:"pencil-simple", onClick:function(){ jn[1]({tipo:"edit", emp:x}); }, className:"h-8 px-2"}), e(Bt,{tipo:"perigo", rotulo:"Excluir empresa", titulo:"Excluir", ic:"trash", onClick:function(){ jn[1]({tipo:"del", emp:x}); }, className:"h-8 px-2"})))); })) : e(Vazio,{ic:"buildings"}, "Nenhuma empresa cadastrada no Fiscal."),
        !f.dir && e(Aviso,{cor:"info", ic:"lock-simple"}, "Somente a diretoria cadastra e altera empresas."))),
    jn[0] && jn[0].tipo==="edit" && e(JanelaEmpresa,{f:f, emp:jn[0].emp, fechar:function(){ jn[1](null); }}),
    jn[0] && jn[0].tipo==="del" && e(JanelaExcluir,{f:f, emp:jn[0].emp, fechar:function(){ jn[1](null); }}));
}
export { AbaFxConfig, JanelaEmpresa, JanelaExcluir };
