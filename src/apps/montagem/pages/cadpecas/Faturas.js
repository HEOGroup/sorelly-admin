// Sorelly Admin · montagem — pages/cadpecas/Faturas.js
// Cadastro de peças → "Faturas Pontual", "Faturas Ellos" (uma tela para cada galvânica, cada uma com os seus serviços) e "Retirar ouro".
// Quem lança: Nickolas (config.quem.faturas_banho); a diretoria sempre pode. Ligar a fatura aos pedidos de bruto muda o status deles para "Enviado para Sorelly".
// Retirar ouro: o envio é só registrado; quando a fatura vem com o desconto, registra-se qual fatura e quanto foi descontado.
// REFEITAS NO PADRÃO AZUL (Marcus, 16/11/2026), igual a Pedidos: bloco com barra azul, faixa azul com os menus, tabela única (TabelaPlanilha, filtro em cada coluna, total no fim) e
// uma janela azul para EDITAR: clicar na linha abre a fatura (ou o envio). Nada de planilha editável direto na tabela, nada de faixa de totais no topo e nenhum texto explicativo.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { GALVANICAS, SERV, brl, podeFazer, valorFatura } from "@/apps/montagem/domain/cadastro-pecas";
import { BlocoF, CampoF, JanelaAzul, Resumo, rotuloMes } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var CLS_FAIXA = "flex flex-nowrap items-center gap-x-1.5 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 [&>*]:shrink-0 [&>*]:whitespace-nowrap [&_button]:!h-7 [&_select]:!h-7 [&_input]:!h-7 [&_button]:!px-2 [&_button]:!text-[11px] [&_select]:!text-[11px] [&_input]:!text-[11px]";   // padrao-ok: controles de 28 px numa linha só, igual ao Pedidos (pedido do Marcus, 16/11/2026)
var CAMPO = "h-8 rounded-md border border-border bg-card px-2.5 text-center text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-primary";
function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : "—"; }
function cap(t){ return t ? t.charAt(0).toUpperCase()+t.slice(1) : t; }
var rotulo = "text-[11px] font-medium uppercase tracking-[.05em]";
var kg = function(v){ return v ? (Math.round(v*100)/100).toLocaleString("pt-BR") : "—"; };
var somar = function(ls, k){ return ls.reduce(function(s, l){ return s+(Number(l[k]) || 0); }, 0); };

function AbaFaturas(p){
  var gs = useState(p.galv || "pontual"), galv = gs[0], x = useCpc(), c = x.c, lista = galv==="ellos" ? c.fatE : c.fatP, pode = podeFazer(c, "faturas_banho", x.por, x.admin), serv = SERV[galv];
  var meses = lista.map(function(f){ return f.data.slice(0, 7); }).filter(function(m, i, a){ return m && a.indexOf(m)===i; }).sort().reverse(), fm = useState(""), nv = useState({data:"", fatura:"", forn:""}), novo = useState(false), ed = useState(null), sel = useState([]);
  var v = nv[0];
  var vis = lista.filter(function(f){ return !fm[0] || f.data.slice(0, 7)===fm[0]; }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var f = ed[0] ? lista.find(function(o){ return o.id===ed[0]; }) : null;
  var set = function(campo){ return function(val){ x.exec("fat_edit", {galv:galv, id:f.id, campo:campo, valor:val}); }; };
  var abrir = function(l){ var o = lista.find(function(q){ return q.id===l.id; }); sel[1]((o.pedidos||[]).slice()); ed[1](l.id); };
  var candidatos = function(fa){ var k = fa.forn.toLowerCase(); return c.pedidos.filter(function(q){ return q.forn.toLowerCase()===k || (fa.pedidos||[]).indexOf(q.id)>=0; }).sort(function(a, b){ return a.data<b.data ? 1 : -1; }).slice(0, 14); };

  var linhas = vis.map(function(fa){ var o = {id:fa.id, data:fa.data, fatura:fa.fatura || "—", forn:fa.forn || "—", cnpj:fa.cnpj || "—", desc:fa.desc || 0, total:valorFatura(fa), kgPrata:fa.kgPrata || 0, kgOuro:fa.kgOuro || 0, npedidos:(fa.pedidos||[]).length};
    serv.forEach(function(s){ o["s_"+s[0]] = fa.serv[s[0]] || 0; }); return o; });
  // grupos por COR no título das colunas (Marcus, 16/11/2026), sem escrever o nome do grupo: Fatura | Serviços | Prata | Ouro | Totais
  var grupoDe = function(k){ return k==="prata" ? "Prata" : /^ouro/.test(k) ? "Ouro" : "Serviços"; };
  var COR_GRUPO = {"Fatura":"rgba(91,141,239,.50)", "Serviços":"rgba(167,139,250,.45)", "Prata":"rgba(203,213,225,.45)", "Ouro":"rgba(232,184,75,.50)", "Totais":"rgba(45,212,191,.45)"};
  var colunas = [["Fatura", {k:"data", t:"Data", fmt:dia}], ["Fatura", {k:"fatura", t:"Fatura"}], ["Fatura", {k:"forn", t:"Fornecedor"}], ["Fatura", {k:"cnpj", t:"CNPJ"}], ["Fatura", {k:"desc", t:"Desc.", fmt:brl}]]
    .concat(serv.map(function(s){ return [grupoDe(s[0]), {k:"s_"+s[0], t:s[1], fmt:brl}]; }), [["Totais", {k:"total", t:"Total", fmt:brl}], ["Totais", {k:"kgPrata", t:"Kg prata", fmt:kg}], ["Totais", {k:"kgOuro", t:"Kg ouro", fmt:kg}], ["Totais", {k:"npedidos", t:"Pedidos", fmt:function(n){ return n ? String(n) : "—"; }}]]);
  var cols = colunas.map(function(g, i){ return Object.assign({}, g[1], {corFundo:COR_GRUPO[g[0]]}); });
  var totalTopo = function(ls){ return ["Total", ls.length+(ls.length===1 ? " fatura" : " faturas"), "", "", brl(somar(ls, "desc"))].concat(serv.map(function(s){ return brl(somar(ls, "s_"+s[0])); }), [brl(somar(ls, "total")), kg(somar(ls, "kgPrata")), kg(somar(ls, "kgOuro")), ""]); };

  // DOIS BLOCOS no topo, com as informações gerais do período escolhido (mês ou todos), que mudam junto com o menu do mês e com a galvânica (Marcus, 16/11/2026)
  var soma = function(fn){ return vis.reduce(function(t, fa){ return t+fn(fa); }, 0); };
  var sPrata = soma(function(fa){ return fa.serv.prata || 0; }), sOuro = soma(function(fa){ return Object.keys(fa.serv||{}).reduce(function(t, k){ return t+(/^ouro/.test(k) ? (fa.serv[k] || 0) : 0); }, 0); });
  var sTotal = soma(function(fa){ return valorFatura(fa); }), sDesc = soma(function(fa){ return fa.desc || 0; }), sServ = Math.round((sTotal-sDesc-sPrata-sOuro)*100)/100, sBruto = sPrata+sOuro+sServ;   // arredonda para não aparecer -0,00
  var pct = function(v){ return sBruto>0 ? (Math.round(v/sBruto*1000)/10).toLocaleString("pt-BR")+"%" : "—"; };
  var nomePeriodo = fm[0] ? cap(rotuloMes(fm[0])) : "Todos os meses";
  var linhaInfo = function(r, v, pp, cor){ return e("div",{key:r, className:"grid grid-cols-[1.4fr_1fr_.6fr] items-center gap-2 border-b border-border px-3 py-1 text-[13px] last:border-b-0"}, e("span",{className:"text-[11px] font-medium uppercase tracking-[.05em]"}, r), e("b",{className:"text-right tabular-nums", style:cor ? {color:cor} : undefined}, v), e("span",{className:"text-right text-[11px] tabular-nums"}, pp || "")); };
  var blocosInfo = e("div",{className:"grid grid-cols-1 gap-2 md:grid-cols-2"},
    e(BlocoPainel,{titulo:"Resumo · "+GALVANICAS[galv]+" · "+nomePeriodo, compacto:true},
      [linhaInfo("Faturas", String(vis.length)), linhaInfo("Total de banho", brl(sTotal)), linhaInfo("Desconto de peças", brl(sDesc), "", sDesc<0 ? "#F87171" : undefined), linhaInfo("Média por fatura", vis.length ? brl(sTotal/vis.length) : "—"), linhaInfo("Maior fatura", vis.length ? brl(Math.max.apply(null, vis.map(function(fa){ return valorFatura(fa); }))) : "—")]),
    e(BlocoPainel,{titulo:"Por metal e serviço · "+nomePeriodo, compacto:true},
      [linhaInfo("Prata", brl(sPrata), pct(sPrata), "#CBD5E1"), linhaInfo("Ouro", brl(sOuro), pct(sOuro), "#E8B84B"), linhaInfo("Outros serviços", brl(sServ), pct(sServ)), linhaInfo("Kg de prata", kg(soma(function(fa){ return fa.kgPrata || 0; }))), linhaInfo("Kg de ouro", kg(soma(function(fa){ return fa.kgOuro || 0; })))]));
  var faixa = e("div",{className:CLS_FAIXA},
    pode && e(Botao,{principal:true, onClick:function(){ novo[1](true); }}, "Nova fatura"),
    e("select",{id:"fat-galv", "aria-label":"Galvânica", value:galv, onChange:function(ev){ gs[1](ev.target.value); fm[1](""); ed[1](null); }, className:CAMPO+" w-28 cursor-pointer"},
      [["pontual", "Pontual"], ["ellos", "Ellos"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
    e("select",{id:"fat-mes", "aria-label":"Mês da fatura", value:fm[0], onChange:function(ev){ fm[1](ev.target.value); }, className:CAMPO+" w-40 cursor-pointer"},
      [["", "Todos os meses"]].concat(meses.map(function(m){ return [m, cap(rotuloMes(m))]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),
    !pode && e("span",{className:"text-[11px] font-semibold"}, "Somente quem lança as faturas edita"));

  // janela de edição (clicar na linha): blocos azuis Fatura, Serviços e Peso, mais os pedidos de bruto ligados
  var cands = f ? candidatos(f) : [];
  var editor = f && e(JanelaAzul,{t:"Fatura "+(f.fatura || "sem número")+" · "+GALVANICAS[galv], sub:f.forn || "", fechar:function(){ ed[1](null); }, larga:true,
    colunas:[
      e(BlocoF,{key:"f", t:"Fatura", cor:"#5B8DEF", nota:dia(f.data)},
        e("div",{className:"grid grid-cols-2 gap-2"},
          e(CampoF,{t:"Data", v:f.data, data:true, off:!pode, onSet:set("data")}), e(CampoF,{t:"Nº da fatura", v:f.fatura, texto:true, off:!pode, onSet:set("fatura")}),
          e(CampoF,{t:"Fornecedor do bruto", v:f.forn, texto:true, off:!pode, onSet:set("forn")}), e(CampoF,{t:"CNPJ faturado", v:f.cnpj, texto:true, off:!pode, onSet:set("cnpj")}),
          e(CampoF,{t:"Desconto de peça R$", v:f.desc || "", dica:"0", off:!pode, onSet:set("desc"), cls:"col-span-2"}))),
      e(BlocoF,{key:"s", t:"Serviços", cor:"#A78BFA", nota:serv.length+" serviços", resumo:[e(Resumo,{key:"t", t:"Total da fatura", v:brl(valorFatura(f)), grande:true})]},
        e("div",{className:"grid grid-cols-2 gap-2"}, serv.map(function(s){ return e(CampoF,{key:s[0], t:s[1], v:f.serv[s[0]] || "", dica:"0", off:!pode, onSet:set("serv."+s[0])}); }))),
      e(BlocoF,{key:"k", t:"Peso banhado", cor:"#2DD4BF", nota:"kg"},
        e("div",{className:"grid grid-cols-2 gap-2"}, e(CampoF,{t:"Kg de prata", v:f.kgPrata || "", dica:"0", off:!pode, onSet:set("kgPrata")}), e(CampoF,{t:"Kg de ouro", v:f.kgOuro || "", dica:"0", off:!pode, onSet:set("kgOuro")}))),
      e(BlocoF,{key:"p", t:"Pedidos de bruto desta fatura", cor:"#5B8DEF", nota:"de "+(f.forn || "qualquer fornecedor")},
        cands.length ? e("div",{className:"flex flex-col gap-1"}, cands.map(function(q){ var on = sel[0].indexOf(q.id)>=0;
          return e("label",{key:q.id, className:"flex min-h-8 cursor-pointer items-center gap-2 rounded-md border px-2 text-[13px] "+(on ? "border-primary bg-primary/10" : "border-border")},
            e("input",{type:"checkbox", checked:on, disabled:!pode, "aria-label":"Pedido "+(q.romaneio || q.nota || "sem romaneio"), onChange:function(){ sel[1](on ? sel[0].filter(function(i){ return i!==q.id; }) : sel[0].concat([q.id])); }}),
            e("span",{className:"tabular-nums"}, dia(q.data).slice(0, 5)+" · "+(q.romaneio || q.nota || "sem romaneio")+" · "+brl(q.pagar)+" · "+q.status)); }))
          : e("p",{className:"text-center text-[13px]"}, "Nenhum pedido deste fornecedor. Lance o pedido de bruto primeiro."),
        pode && e(Botao,{onClick:function(){ x.exec("fat_pedidos", {galv:galv, id:f.id, pedidos:sel[0]}); }}, "Salvar ligação"),
        pode && e("p",{className:"text-center text-[11px]"}, "Os pedidos ligados viram Enviado para Sorelly."))],
    rodape:[pode && e(Botao,{key:"r", onClick:function(){ if(window.confirm("Remover a fatura "+f.fatura+"?")){ x.exec("fat_del", {galv:galv, id:f.id}); ed[1](null); } }}, "Remover fatura"), e(Botao,{key:"c", principal:true, onClick:function(){ ed[1](null); }}, "Fechar")]});

  var janelaNova = novo[0] && e(JanelaAzul,{t:"Nova fatura da "+GALVANICAS[galv], fechar:function(){ novo[1](false); },
    rodape:[e(Botao,{key:"c", onClick:function(){ novo[1](false); }}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:function(){ var hoje = new Date().toISOString().slice(0, 10); if(x.exec("fat_add", {galv:galv, data:v.data || hoje, mes:(v.data || hoje).slice(0, 7), fatura:v.fatura, forn:v.forn})){ nv[1]({data:"", fatura:"", forn:""}); novo[1](false); } }}, "Criar fatura")]},
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-3"},
      e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:rotulo}, "Data da fatura"), e("input",{type:"date", value:v.data, onChange:function(ev){ nv[1](Object.assign({}, v, {data:ev.target.value})); }, "aria-label":"Data da fatura", className:CAMPO+" w-full"})),
      e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:rotulo}, "Nº da fatura"), e("input",{value:v.fatura, onChange:function(ev){ nv[1](Object.assign({}, v, {fatura:ev.target.value})); }, "aria-label":"Número da fatura", className:CAMPO+" w-full"})),
      e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:rotulo}, "Fornecedor do bruto"), e("input",{value:v.forn, list:"cpc-forns-f", onChange:function(ev){ nv[1](Object.assign({}, v, {forn:ev.target.value})); }, "aria-label":"Fornecedor do bruto", className:CAMPO+" w-full"}))),
    e("datalist",{id:"cpc-forns-f"}, c.pedidos.map(function(q){ return q.forn; }).filter(function(n, i, a){ return a.indexOf(n)===i; }).map(function(n){ return e("option",{key:n, value:n}); })));

  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    blocosInfo,
    e(BlocoPainel,{titulo:"Faturas da "+GALVANICAS[galv]+" · "+vis.length+(vis.length===1 ? " fatura" : " faturas"), compacto:true},
      faixa,
      linhas.length ? e(TabelaPlanilha,{key:galv+fm[0], cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalCab:totalTopo, aoClicar:abrir}) : e(Vazio,{ic:"receipt"}, "Nenhuma fatura neste filtro.")),
    editor, janelaNova);
}

function AbaRetirarOuro(){
  var x = useCpc(), c = x.c, pode = podeFazer(c, "faturas_banho", x.por, x.admin), nv = useState({data:"", galv:"pontual", kg:""}), v = nv[0], novo = useState(false), ed = useState(null);
  var en = ed[0] ? c.envios.find(function(o){ return o.id===ed[0]; }) : null;
  var set = function(k){ return function(val){ x.exec("env_edit", Object.assign({id:en.id}, (function(){ var o = {}; o[k] = val; return o; })())); }; };
  var linhas = c.envios.slice().sort(function(a, b){ return a.data<b.data ? 1 : -1; }).map(function(o){ return {id:o.id, data:o.data, galv:GALVANICAS[o.galv] || o.galv, kg:o.kg || 0, sit:o.valor>0 ? "Descontado em fatura" : "Enviado", fatura:o.faturaNum || "—", dataFatura:o.dataFatura || "", valor:o.valor || 0}; });
  var cols = [{k:"data", t:"Envio", fmt:dia}, {k:"galv", t:"Galvânica"}, {k:"kg", t:"Peso (kg)", fmt:kg}, {k:"sit", t:"Situação", cor:function(l){ return l.sit==="Enviado" ? "text-warning" : "text-success"; }}, {k:"fatura", t:"Fatura com o desconto"}, {k:"dataFatura", t:"Data da fatura", fmt:function(d){ return d ? dia(d) : "—"; }}, {k:"valor", t:"Valor descontado", fmt:brl}];
  var totalTopo = function(ls){ return ["Total", ls.length+(ls.length===1 ? " envio" : " envios"), kg(somar(ls, "kg")), "", "", "", brl(somar(ls, "valor"))]; };
  var faixa = e("div",{className:CLS_FAIXA}, pode && e(Botao,{principal:true, onClick:function(){ novo[1](true); }}, "Registrar envio"));
  var janelaNova = novo[0] && e(JanelaAzul,{t:"Registrar envio de ouro", fechar:function(){ novo[1](false); },
    rodape:[e(Botao,{key:"c", onClick:function(){ novo[1](false); }}, "Cancelar"), e(Botao,{key:"s", principal:true, onClick:function(){ if(x.exec("env_add", {data:v.data || new Date().toISOString().slice(0, 10), galv:v.galv, kg:v.kg})){ nv[1]({data:"", galv:v.galv, kg:""}); novo[1](false); } }}, "Registrar envio")]},
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-3"},
      e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:rotulo}, "Data do envio"), e("input",{type:"date", value:v.data, onChange:function(ev){ nv[1](Object.assign({}, v, {data:ev.target.value})); }, "aria-label":"Data do envio", className:CAMPO+" w-full"})),
      e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:rotulo}, "Galvânica"), e("select",{value:v.galv, onChange:function(ev){ nv[1](Object.assign({}, v, {galv:ev.target.value})); }, "aria-label":"Galvânica", className:CAMPO+" w-full cursor-pointer"}, e("option",{value:"pontual"}, "Pontual"), e("option",{value:"ellos"}, "Ellos"))),
      e("label",{className:"flex flex-col gap-0.5"}, e("span",{className:rotulo}, "Peso (kg)"), e("input",{value:v.kg, inputMode:"decimal", onChange:function(ev){ nv[1](Object.assign({}, v, {kg:ev.target.value})); }, "aria-label":"Peso enviado em kg", className:CAMPO+" w-full"}))));
  var editor = en && e(JanelaAzul,{t:"Envio de ouro · "+dia(en.data), sub:(GALVANICAS[en.galv] || en.galv)+" · "+kg(en.kg)+" kg", fechar:function(){ ed[1](null); },
    rodape:[pode && e(Botao,{key:"r", onClick:function(){ if(window.confirm("Remover este envio?")){ x.exec("env_del", {id:en.id}); ed[1](null); } }}, "Remover envio"), e(Botao,{key:"c", principal:true, onClick:function(){ ed[1](null); }}, "Fechar")]},
    e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-3"},
      e(CampoF,{t:"Data do envio", v:en.data, data:true, off:!pode, onSet:set("data")}),
      e(CampoF,{t:"Galvânica", v:en.galv, off:!pode, opcoes:[["pontual", "Pontual"], ["ellos", "Ellos"]], onSet:set("galv")}),
      e(CampoF,{t:"Peso (kg)", v:en.kg, off:!pode, onSet:set("kg")}),
      e(CampoF,{t:"Fatura com o desconto", v:en.faturaNum, texto:true, dica:"nº da fatura", off:!pode, onSet:set("faturaNum")}),
      e(CampoF,{t:"Data da fatura", v:en.dataFatura, data:true, off:!pode, onSet:set("dataFatura")}),
      e(CampoF,{t:"Valor descontado R$", v:en.valor || "", dica:"0", off:!pode, onSet:set("valor")})));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Envios de ouro para retirada · "+c.envios.length, compacto:true},
      faixa,
      linhas.length ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalCab:totalTopo, aoClicar:function(l){ ed[1](l.id); }}) : e(Vazio,{ic:"coins"}, "Nenhum envio registrado.")),
    editor, janelaNova);
}
export { AbaFaturas, AbaRetirarOuro };
