// Sorelly Admin · montagem — pages/compras/CompraConfig.js
// Materiais & Estoque → aba "Configurações": alçadas e prazos de Compras, regras do estoque, abas do estoque, classificações ("entra no estoque?"), motivos de negativa, texto de regras,
// aprovadores e acesso ao estoque por pessoa. Tudo em blocos azuis lado a lado; valores em dinheiro com o campo Dinheiro. Regras no domínio (config_set, regras_set, motivo_*, acesso_set).
import { Dinheiro, Mosaico, Pagina } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { CAPS_ESTOQUE, ROTULO_CAP_ESTOQUE, textoOrcamentos } from "@/apps/montagem/domain/compras-estoque";
import { EQUIPE, nomeDe } from "@/apps/montagem/domain/equipe";
import { Bt, Campo, Painel, Selo, Vazio, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
var cx = INPUT+" w-full text-center";
var pessoaDe = function(id){ var p = EQUIPE.filter(function(z){ return String(z.id)===String(id); })[0]; return p ? p.nome : String(id); };
var corpo = function(){ return e.apply(null, ["div", {className:"flex flex-col gap-2 p-2.5"}].concat(Array.prototype.slice.call(arguments))); };

// bloco de campos simples com rascunho e botão Salvar. campos = [{k, rot, tipo:"dinheiro"|"num"|"texto"|"bool"|"dias", dica}]
function BlocoForm(p){
  var st = useState(function(){ var o = {}; p.campos.forEach(function(c){ o[c.k] = p.cfg[c.k]; }); return o; }), v = st[0];
  var set = function(k, x){ st[1](function(o){ var n = Object.assign({}, o); n[k] = x; return n; }); };
  var salvar = function(){ var d = {}; p.campos.forEach(function(c){ d[c.k] = c.tipo==="num" ? Number(v[c.k]) : v[c.k]; }); p.x.exec("config_set", d); };
  return e(BlocoBarra,{cor:"azul", compacto:true, t:p.t}, corpo(
    p.campos.map(function(c){
      if(c.tipo==="bool") return e("label",{key:c.k, className:"flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[13px] font-bold hover:bg-white/15"}, e("input",{type:"checkbox", checked:!!v[c.k], disabled:!p.ok, onChange:function(ev){ set(c.k, ev.target.checked); }}), c.rot);
      if(c.tipo==="dias") return e(Campo,{key:c.k, rot:c.rot, dica:c.dica}, e("div",{className:"flex flex-wrap justify-center gap-1.5"}, DIAS.map(function(d, i){ var on = (v[c.k]||[]).indexOf(i)>=0;
        return e("button",{key:i, type:"button", disabled:!p.ok, onClick:function(){ set(c.k, on ? v[c.k].filter(function(z){ return z!==i; }) : (v[c.k]||[]).concat([i]).sort()); }, className:"w-12 rounded-lg py-1.5 text-[12.5px] font-bold ring-1 transition "+(on ? "bg-[#3B82F6]/35 text-white ring-[#3B82F6]/80" : "bg-muted/40 text-white/80 ring-white/15 hover:bg-white/10")}, d); })));
      return e(Campo,{key:c.k, rot:c.rot, dica:typeof c.dica==="function" ? c.dica(v) : c.dica}, c.tipo==="dinheiro" ? e(Dinheiro,{value:v[c.k], label:c.rot, disabled:!p.ok, onChange:function(x){ set(c.k, x); }})
        : e("input",{type:c.tipo==="num" ? "number" : "text", step:c.tipo==="num" ? 1 : undefined, min:c.tipo==="num" ? 0 : undefined, disabled:!p.ok, value:v[c.k]==null ? "" : v[c.k], onChange:function(ev){ set(c.k, ev.target.value); }, className:cx}));
    }),
    e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.ok, semAut:true, onClick:salvar}, "Salvar")));
}

// lista editável (abas do estoque e classificações): rascunho com nome + extra, linhas novas e remoção; Salvar manda a lista toda
function BlocoLista(p){
  var st = useState(function(){ return JSON.parse(JSON.stringify(p.itens)); }), l = st[0];
  var troca = function(i, k, x){ st[1](function(o){ var n = JSON.parse(JSON.stringify(o)); n[i][k] = x; return n; }); };
  return e(BlocoBarra,{cor:"azul", compacto:true, t:p.t, dir:l.length}, corpo(
    p.dica && e("p",{className:"text-center text-[12px] text-white/65"}, p.dica),
    l.length ? l.map(function(it, i){ return e("div",{key:i, className:"flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
      e("input",{type:"text", value:it.nome, placeholder:"Nome", "aria-label":"Nome", disabled:!p.ok, onChange:function(ev){ troca(i, "nome", ev.target.value); }, className:cx+" min-w-36 flex-1 basis-40"}),
      p.extra(it, i, troca), e("button",{type:"button", "aria-label":"Remover", title:p.ok ? "Remover" : "Sem autorização", disabled:!p.ok, onClick:function(){ st[1](l.filter(function(z, j){ return j!==i; })); }, className:"grid size-9 place-items-center rounded-lg bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30 disabled:opacity-40"}, e(Ph,{n:"trash", s:15}))); })
      : e(Vazio,null, "Nenhum item cadastrado."),
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e(Bt,{ic:"plus", disabled:!p.ok, semAut:true, onClick:function(){ st[1](l.concat([p.novo()])); }}, p.novoRot), e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!p.ok, semAut:true, onClick:function(){ p.salvar(l); }}, "Salvar"))));
}

function AbaCompraConfig(){
  var x = useCe(), ce = x.ce, cfg = x.cfg, ok = x.cadastros;
  var sMot = useState(""), sReg = useState(ce.regras||""), sAp = useState(""), sAc = useState("");
  var key = function(o){ return JSON.stringify(o); };
  var aprovadores = cfg.aprovadores||[], acessos = ce.acessos.estoque||{}, chavesAc = Object.keys(acessos);
  var pessoas = EQUIPE.slice().sort(function(a, b){ return a.nome.localeCompare(b.nome); });

  var blocoMotivos = e(BlocoBarra,{key:"mot", cor:"azul", compacto:true, t:"Motivos de negativa", dir:ce.motivosNegativa.length}, corpo(
    ce.motivosNegativa.length ? e("div",{className:"flex flex-wrap justify-center gap-1.5"}, ce.motivosNegativa.map(function(m){ return e("span",{key:m, className:"inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-1.5 text-[12.5px] font-bold ring-1 ring-white/15"}, m,
      e("button",{type:"button", "aria-label":"Remover motivo "+m, title:ok ? "Remover" : "Sem autorização", disabled:!ok, onClick:function(){ x.exec("motivo_del", {nome:m}); }, className:"grid size-5 place-items-center rounded-full bg-black/30 hover:bg-[#EF4444]/50 disabled:opacity-40"}, e(Ph,{n:"x", s:11}))); })) : e(Vazio,null, "Nenhum motivo cadastrado."),
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e("input",{type:"text", value:sMot[0], placeholder:"Novo motivo", "aria-label":"Novo motivo de negativa", disabled:!ok, onChange:function(ev){ sMot[1](ev.target.value); }, className:cx+" min-w-40 flex-1 basis-48"}),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!ok || !sMot[0].trim(), semAut:true, onClick:function(){ if(x.exec("motivo_add", {nome:sMot[0]})) sMot[1](""); }}, "Adicionar"))));

  var blocoRegras = e(BlocoBarra,{key:"reg", cor:"azul", compacto:true, t:"Regras de compras e estoque"}, corpo(
    e("textarea",{value:sReg[0], rows:7, disabled:!ok, placeholder:"Texto das regras exibido a quem solicita compras e movimenta o estoque", "aria-label":"Texto das regras", onChange:function(ev){ sReg[1](ev.target.value); }, className:INPUT+" h-auto! w-full resize-y py-2"}),
    e(Bt,{tipo:"forte", ic:"floppy-disk", disabled:!ok, semAut:true, onClick:function(){ x.exec("regras_set", {texto:sReg[0]}); }}, "Salvar regras")));

  var blocoAprov = e(BlocoBarra,{key:"apr", cor:"azul", compacto:true, t:"Aprovadores de compras", dir:aprovadores.length || undefined}, corpo(
    aprovadores.length ? e("div",{className:"flex flex-wrap justify-center gap-1.5"}, aprovadores.map(function(id){ return e("span",{key:id, className:"inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6]/25 py-1 pl-3 pr-1.5 text-[12.5px] font-bold ring-1 ring-[#3B82F6]/60"}, pessoaDe(id),
      e("button",{type:"button", "aria-label":"Remover "+pessoaDe(id), title:ok ? "Remover" : "Sem autorização", disabled:!ok, onClick:function(){ x.exec("config_set", {aprovadores:aprovadores.filter(function(z){ return String(z)!==String(id); })}); }, className:"grid size-5 place-items-center rounded-full bg-black/30 hover:bg-[#EF4444]/50 disabled:opacity-40"}, e(Ph,{n:"x", s:11}))); }))
      : e(Vazio,{ic:"user-check"}, "Nenhum aprovador definido. Vale a autorização Aprovar compras."),
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e("select",{value:sAp[0], "aria-label":"Pessoa para aprovadora", disabled:!ok, onChange:function(ev){ sAp[1](ev.target.value); }, className:cx+" min-w-40 flex-1 basis-48 cursor-pointer"}, [e("option",{key:"", value:""}, "Adicionar pessoa")].concat(pessoas.filter(function(p){ return aprovadores.map(String).indexOf(String(p.id))<0; }).map(function(p){ return e("option",{key:p.id, value:String(p.id)}, p.nome); }))),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!ok || !sAp[0], semAut:true, onClick:function(){ if(x.exec("config_set", {aprovadores:aprovadores.concat([Number(sAp[0])])})) sAp[1](""); }}, "Adicionar")),
    e("p",{className:"text-center text-[11.5px] text-white/60"}, "Com a lista vazia, decidem as pessoas com a autorização Aprovar compras.")));

  var blocoAcesso = e(BlocoBarra,{key:"ace", cor:"azul", compacto:true, t:"Acesso ao estoque por pessoa", dir:chavesAc.length || undefined}, corpo(
    chavesAc.length ? chavesAc.map(function(q){ var caps = acessos[q]||[];
      return e("div",{key:q, className:"flex flex-col items-center gap-1.5 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"}, e("b",{className:"text-[13px]"}, pessoaDe(q)),
        e("div",{className:"flex flex-wrap justify-center gap-1.5"}, CAPS_ESTOQUE.map(function(c){ var on = caps.indexOf(c)>=0;
          return e("button",{key:c, type:"button", disabled:!ok, onClick:function(){ x.exec("acesso_set", {setor:"estoque", quem:q, papeis:on ? caps.filter(function(z){ return z!==c; }) : caps.concat([c])}); }, className:"rounded-lg px-3 py-1.5 text-[12.5px] font-bold ring-1 transition disabled:opacity-40 "+(on ? "bg-[#3B82F6]/35 text-white ring-[#3B82F6]/80" : "bg-muted/40 text-white/80 ring-white/15 hover:bg-white/10")}, ROTULO_CAP_ESTOQUE[c]); }),
          e("button",{type:"button", "aria-label":"Remover acesso de "+pessoaDe(q), title:ok ? "Remover acesso" : "Sem autorização", disabled:!ok, onClick:function(){ x.exec("acesso_set", {setor:"estoque", quem:q, papeis:[]}); }, className:"grid size-8 place-items-center rounded-lg bg-[#EF4444]/15 text-[#F87171] hover:bg-[#EF4444]/30 disabled:opacity-40"}, e(Ph,{n:"trash", s:14})))); })
      : e(Vazio,{ic:"users"}, "Nenhum acesso individual. A diretoria possui as três permissões."),
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e("select",{value:sAc[0], "aria-label":"Pessoa com acesso ao estoque", disabled:!ok, onChange:function(ev){ sAc[1](ev.target.value); }, className:cx+" min-w-40 flex-1 basis-48 cursor-pointer"}, [e("option",{key:"", value:""}, "Adicionar pessoa")].concat(pessoas.filter(function(p){ return chavesAc.indexOf(String(p.id))<0; }).map(function(p){ return e("option",{key:p.id, value:String(p.id)}, p.nome); }))),
      e(Bt,{tipo:"forte", ic:"plus", disabled:!ok || !sAc[0], semAut:true, onClick:function(){ if(x.exec("acesso_set", {setor:"estoque", quem:sAc[0], papeis:["CONTAGEM"]})) sAc[1](""); }}, "Adicionar")),
    e("p",{className:"text-center text-[11.5px] text-white/60"}, "Contagem: contar e movimentar. Compra: cadastrar materiais e pedir compra. Aprovação: decidir compras, estornar e marcar parado.")));

  return e(Pagina,null,
    e(Painel,{estado:"atual"}, e("p",{className:"flex items-center justify-center gap-2 text-center text-[12.5px] font-bold"}, e(Ph,{n:"info", s:16}), "As decisões de quem aprova compras ficam em RH → Acessos e autorizações."),
      !ok && e("p",{className:"text-center text-[12px] font-bold text-[#FBBF24]"}, "Configurações disponíveis para consulta. A alteração exige autorização de Compras ou do estoque.")),
    e(Mosaico,{min:"24rem"},
      e(BlocoForm,{key:"a"+key([cfg.limiteAutorizacao, cfg.autorizacoesNecessarias, cfg.slaHoras]), t:"Autorização de compras", x:x, ok:ok, cfg:cfg, campos:[
        {k:"limiteAutorizacao", rot:"Limite para autorização adicional", tipo:"dinheiro", dica:"Pedidos a partir deste valor exigem autorização extra"}, {k:"autorizacoesNecessarias", rot:"Número de autorizações", tipo:"num"}, {k:"slaHoras", rot:"Prazo de resposta (horas)", tipo:"num", dica:"Após este prazo a solicitação é marcada como atrasada"}]}),
      e(BlocoForm,{key:"o"+key([cfg.orcFaixa1Min, cfg.orcFaixa2Min]), t:"Faixas de orçamento", x:x, ok:ok, cfg:cfg, campos:[
        {k:"orcFaixa1Min", rot:"Início da faixa de 2 orçamentos", tipo:"dinheiro"}, {k:"orcFaixa2Min", rot:"Início da faixa de 3 orçamentos", tipo:"dinheiro", dica:function(v){ return textoOrcamentos({orcFaixa1Min:Number(v.orcFaixa1Min)||0, orcFaixa2Min:Number(v.orcFaixa2Min)||0}); }}]}),
      e(BlocoForm,{key:"p"+key([cfg.toleranciaPlano, cfg.parcelasMax, cfg.opcaoSemNota, cfg.motivoMax, cfg.paginaPedidos, cfg.pularFormaPagamento]), t:"Pagamento e registro", x:x, ok:ok, cfg:cfg, campos:[
        {k:"toleranciaPlano", rot:"Tolerância do plano de pagamento", tipo:"dinheiro", dica:"Diferença aceita entre a soma das partes e o total"}, {k:"parcelasMax", rot:"Máximo de parcelas no cartão", tipo:"num"}, {k:"opcaoSemNota", rot:"Texto da opção sem nota fiscal", tipo:"texto"},
        {k:"motivoMax", rot:"Limite de caracteres do motivo", tipo:"num"}, {k:"paginaPedidos", rot:"Compras por página", tipo:"num"}, {k:"pularFormaPagamento", rot:"Dispensar a etapa de conta pagadora", tipo:"bool"}]}),
      e(BlocoForm,{key:"e"+key([cfg.entradaAoReceber, cfg.bloquearContagemRetroativa, cfg.permitirSaldoNegativo, cfg.atencaoPct, cfg.topConsumo, cfg.diasContagem]), t:"Regras do estoque", x:x, ok:ok, cfg:cfg, campos:[
        {k:"atencaoPct", rot:"Atenção até (% do mínimo)", tipo:"num", dica:"Acima do mínimo e até este percentual, o material fica em atenção"}, {k:"topConsumo", rot:"Itens no ranking de consumo", tipo:"num"}, {k:"diasContagem", rot:"Dias de contagem", tipo:"dias", dica:"Lembrete de contagem periódica"},
        {k:"entradaAoReceber", rot:"Entrada no estoque ao receber a compra", tipo:"bool"}, {k:"bloquearContagemRetroativa", rot:"Bloquear contagem com data anterior à última", tipo:"bool"}, {k:"permitirSaldoNegativo", rot:"Permitir saldo negativo", tipo:"bool"}]}),
      e(BlocoLista,{key:"t"+key(cfg.tipos), t:"Abas do estoque", itens:cfg.tipos, ok:ok, dica:"Uma aba para cada grupo de materiais. O responsável é apenas informativo.", novoRot:"Nova aba", novo:function(){ return {id:"", nome:"", aprovador:""}; },
        extra:function(it, i, troca){ return e("input",{type:"text", value:it.aprovador||"", placeholder:"Responsável pela aprovação", "aria-label":"Responsável pela aprovação", disabled:!ok, onChange:function(ev){ troca(i, "aprovador", ev.target.value); }, className:cx+" min-w-36 flex-1 basis-40"}); },
        salvar:function(l){ x.exec("config_set", {tipos:l}); }}),
      e(BlocoLista,{key:"c"+key(cfg.classificacoes), t:"Classificações de compra", itens:cfg.classificacoes, ok:ok, dica:"Material e consumo entram no estoque; patrimônio e serviço não.", novoRot:"Nova classificação", novo:function(){ return {id:"", nome:"", entraEstoque:false}; },
        extra:function(it, i, troca){ return e("label",{className:"inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold transition "+(it.entraEstoque ? "bg-[#22C55E]/25 ring-1 ring-[#22C55E]/60" : "bg-white/10 hover:bg-white/15")}, e("input",{type:"checkbox", checked:!!it.entraEstoque, disabled:!ok, onChange:function(ev){ troca(i, "entraEstoque", ev.target.checked); }}), "Entra no estoque"); },
        salvar:function(l){ x.exec("config_set", {classificacoes:l}); }}),
      blocoMotivos, blocoAprov, blocoAcesso, blocoRegras));
}

export { AbaCompraConfig };
