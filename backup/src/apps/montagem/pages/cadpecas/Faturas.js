// Sorelly Admin · montagem — pages/cadpecas/Faturas.js
// Cadastro de peças → "Faturas Pontual", "Faturas Ellos" (uma tela para cada galvânica, cada uma com os seus serviços) e "Retirar ouro".
// Quem lança: Nickolas (config.quem.faturas_banho); a diretoria sempre pode. Ligar a fatura aos pedidos de bruto muda o status deles para "Banhado".
// Retirar ouro: o envio é só registrado; quando a fatura vem com o desconto, registra-se qual fatura e quanto foi descontado.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { GALVANICAS, SERV, brl, mesesCpc, podeFazer, valorFatura } from "@/apps/montagem/domain/cadastro-pecas";
import { rotuloMes } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { Bt, Cel, Ic, NEUTRO, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var INP = "h-8 rounded-md bg-black/30 px-2 text-[12px] ring-1 ring-white/15 outline-none focus:ring-white/45";
var tdc = "px-1! py-0.5!";
function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : "—"; }

function AbaFaturas(p){
  var galv = p.galv, x = useCpc(), c = x.c, lista = galv==="ellos" ? c.fatE : c.fatP, pode = podeFazer(c, "faturas_banho", x.por, x.admin), serv = SERV[galv];
  var meses = mesesCpc(c), fm = useState(""), nv = useState({data:"", fatura:"", forn:""}), lig = useState(null), sel = useState([]);
  var vis = lista.filter(function(f){ return !fm[0] || f.data.slice(0, 7)===fm[0]; }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var tot = vis.reduce(function(t, f){ t.total += valorFatura(f); t.kg += (f.kgPrata||0) + (f.kgOuro||0); t.n++; return t; }, {total:0, kg:0, n:0});
  var set = function(f, campo){ return function(v){ x.exec("fat_edit", {galv:galv, id:f.id, campo:campo, valor:v}); }; };
  var v = nv[0];
  var abrirLigacao = function(f){ lig[1](lig[0]===f.id ? null : f.id); sel[1]((f.pedidos||[]).slice()); };
  var candidatos = function(f){ var k = f.forn.toLowerCase(); return c.pedidos.filter(function(q){ return q.forn.toLowerCase()===k || (f.pedidos||[]).indexOf(q.id)>=0; }).sort(function(a, b){ return a.data<b.data ? 1 : -1; }).slice(0, 14); };
  var nCols = 8 + serv.length + 3;
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Sl,{v:fm[0], set:fm[1], rot:"Mês da fatura", opcoes:[["", "Todos os meses"]].concat(meses.map(function(m){ return [m, rotuloMes(m)]; })), className:"w-48"}),
      !pode && e("span",{className:"text-[12px] font-bold text-white/70"}, "Somente quem lança as faturas edita")),
    e(Faixa,{n:3}, e(Indicador,{t:"Faturas", v:String(tot.n), cor:NEUTRO}), e(Indicador,{t:"Total de banho", v:brl(tot.total), cor:NEUTRO}), e(Indicador,{t:"Peso banhado (kg)", v:String(Math.round(tot.kg)), cor:NEUTRO})),
    pode && e(BlocoBarra,{cor:"azul", compacto:true, t:"Nova fatura da "+GALVANICAS[galv], dir:"lançar"},
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
        e("input",{type:"date", value:v.data, onChange:function(ev){ nv[1](Object.assign({}, v, {data:ev.target.value})); }, "aria-label":"Data da fatura", className:INP+" w-32 text-center"}),
        e("input",{value:v.fatura, onChange:function(ev){ nv[1](Object.assign({}, v, {fatura:ev.target.value})); }, placeholder:"Nº da fatura", "aria-label":"Número da fatura", className:INP+" w-28 text-center"}),
        e("input",{value:v.forn, list:"cpc-forns-f", onChange:function(ev){ nv[1](Object.assign({}, v, {forn:ev.target.value})); }, placeholder:"Fornecedor do bruto", "aria-label":"Fornecedor do bruto", className:INP+" w-40 text-center"}),
        e("datalist",{id:"cpc-forns-f"}, c.pedidos.map(function(q){ return q.forn; }).filter(function(n, i, a){ return a.indexOf(n)===i; }).map(function(n){ return e("option",{key:n, value:n}); })),
        e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ var hoje = new Date().toISOString().slice(0, 10); if(x.exec("fat_add", {galv:galv, data:v.data || hoje, mes:(v.data || hoje).slice(0, 7), fatura:v.fatura, forn:v.forn})) nv[1]({data:"", fatura:"", forn:""}); }}, "Criar fatura")),
      e("p",{className:"mt-1 text-center text-[11px] text-white/65"}, "Depois de criar, preencha os valores de cada serviço na tabela, como na planilha.")),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Faturas da "+GALVANICAS[galv], dir:vis.length},
      vis.length ? e(Tab,{cols:["Data", "Fatura", "Fornecedor", "CNPJ", "Desc."].concat(serv.map(function(s){ return s[1]; })).concat(["Total", "Kg prata", "Kg ouro", "Pedidos", ""]), className:"text-[12px]"},
        vis.map(function(f){ var aberto = lig[0]===f.id, cands = aberto ? candidatos(f) : [];
          return [e("tr",{key:f.id, className:"border-t border-white/5 hover:bg-white/5"},
            e(Td,{className:tdc}, e(Cel,{v:f.data, data:true, off:!pode, rot:"Data da fatura", w:"w-28", onSet:set(f, "data")})),
            e(Td,{className:tdc}, e(Cel,{v:f.fatura, texto:true, off:!pode, rot:"Nº da fatura", w:"w-16", onSet:set(f, "fatura")})),
            e(Td,{className:tdc}, e(Cel,{v:f.forn, texto:true, off:!pode, rot:"Fornecedor do bruto", w:"w-24", onSet:set(f, "forn")})),
            e(Td,{className:tdc}, e(Cel,{v:f.cnpj, texto:true, off:!pode, rot:"CNPJ faturado", w:"w-32", onSet:set(f, "cnpj")})),
            e(Td,{className:tdc, dinheiro:true}, e(Cel,{v:f.desc || "", dica:"0", off:!pode, rot:"Desconto de peça (valor negativo)", w:"w-16", onSet:set(f, "desc")})),
            serv.map(function(s){ return e(Td,{key:s[0], className:tdc, dinheiro:true}, e(Cel,{v:f.serv[s[0]] || "", dica:"—", off:!pode, rot:s[1], w:"w-16", onSet:set(f, "serv."+s[0])})); }),
            e(Td,{className:tdc, dinheiro:true, forte:true}, brl(valorFatura(f))),
            e(Td,{className:tdc}, e(Cel,{v:f.kgPrata || "", dica:"—", off:!pode, rot:"Kg de prata", w:"w-14", onSet:set(f, "kgPrata")})),
            e(Td,{className:tdc}, e(Cel,{v:f.kgOuro || "", dica:"—", off:!pode, rot:"Kg de ouro", w:"w-14", onSet:set(f, "kgOuro")})),
            e(Td,{className:tdc}, e("button",{type:"button", onClick:function(){ abrirLigacao(f); }, title:"Ligar aos pedidos de bruto", className:"h-7 rounded-md bg-white/10 px-2 text-[12px] font-bold hover:bg-white/20"}, (f.pedidos||[]).length || "ligar")),
            e(Td,{className:tdc}, pode && e(Ic,{ic:"x", perigo:true, titulo:"Remover a fatura", onClick:function(){ if(window.confirm("Remover a fatura "+f.fatura+"?")) x.exec("fat_del", {galv:galv, id:f.id}); }}))),
          aberto && e("tr",{key:f.id+"l", className:"bg-black/25"}, e("td",{colSpan:nCols, className:"px-3 py-2"},
            e("p",{className:"mb-1 text-center text-[12px] font-bold"}, "Pedidos de bruto desta fatura (de "+(f.forn || "qualquer fornecedor")+")"),
            cands.length ? e("div",{className:"flex flex-wrap items-center justify-center gap-x-4 gap-y-1"}, cands.map(function(q){ var on = sel[0].indexOf(q.id)>=0;
              return e("label",{key:q.id, className:"flex cursor-pointer items-center gap-1.5 text-[12px]"}, e("input",{type:"checkbox", checked:on, disabled:!pode, className:"size-4 accent-[#3B82F6]", onChange:function(){ sel[1](on ? sel[0].filter(function(i){ return i!==q.id; }) : sel[0].concat([q.id])); }}),
                dia(q.data).slice(0, 5)+" · "+(q.romaneio || q.nota || "sem romaneio")+" · "+brl(q.pagar)+" · "+q.status); })) : e("p",{className:"text-center text-[12px] text-white/65"}, "Nenhum pedido deste fornecedor. Lance o pedido de bruto primeiro."),
            pode && e("div",{className:"mt-2 flex justify-center"}, e(Bt,{tipo:"forte", ic:"check", onClick:function(){ if(x.exec("fat_pedidos", {galv:galv, id:f.id, pedidos:sel[0]})) lig[1](null); }}, "Salvar ligação (pedidos viram Banhado)"))))];
        }).reduce(function(a, b){ return a.concat(b); }, [])
        .concat([e("tr",{key:"tot", className:"border-t-2 border-white/25 bg-black/30"}, e(Td,{forte:true, colSpan:5}, "Total ("+tot.n+")"), serv.map(function(s){ return e(Td,{key:s[0], dinheiro:true, forte:true}, brl(vis.reduce(function(a, f){ return a + (f.serv[s[0]]||0); }, 0))); }), e(Td,{dinheiro:true, forte:true}, brl(tot.total)), e(Td,null), e(Td,null), e(Td,null), e(Td,null))])) :
      e(Vazio,{ic:"receipt"}, "Nenhuma fatura neste filtro.")));
}

function AbaRetirarOuro(){
  var x = useCpc(), c = x.c, pode = podeFazer(c, "faturas_banho", x.por, x.admin), nv = useState({data:"", galv:"pontual", kg:""}), v = nv[0];
  var set = function(en, k){ return function(val){ x.exec("env_edit", Object.assign({id:en.id}, (function(){ var o = {}; o[k] = val; return o; })())); }; };
  var kg = c.envios.reduce(function(s, en){ return s + en.kg; }, 0), desc = c.envios.reduce(function(s, en){ return s + en.valor; }, 0), aberto = c.envios.filter(function(en){ return !(en.valor>0); }).length;
  return e(Pagina,null,
    e(Faixa,{n:4}, e(Indicador,{t:"Envios", v:String(c.envios.length), cor:NEUTRO}), e(Indicador,{t:"Ouro enviado (kg)", v:String(Math.round(kg*100)/100), cor:NEUTRO}), e(Indicador,{t:"Descontado em fatura", v:brl(desc), cor:NEUTRO}), e(Indicador,{t:"Aguardando desconto", v:String(aberto), cor:aberto ? "alerta" : NEUTRO})),
    e("p",{className:"text-center text-[12px] text-white/75"}, "Peças quebradas de ouro juntam 3 kg e vão para a retirada de ouro com o Valdir; o valor é descontado em uma fatura da galvânica. Registre o envio agora e, quando a fatura vier com o desconto, o número dela e o valor."),
    pode && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e("input",{type:"date", value:v.data, onChange:function(ev){ nv[1](Object.assign({}, v, {data:ev.target.value})); }, "aria-label":"Data do envio", className:INP+" w-32 text-center"}),
      e(Sl,{v:v.galv, set:function(g){ nv[1](Object.assign({}, v, {galv:g})); }, rot:"Galvânica", opcoes:[["pontual", "Pontual"], ["ellos", "Ellos"]], className:"w-28 h-8!"}),
      e("input",{value:v.kg, onChange:function(ev){ nv[1](Object.assign({}, v, {kg:ev.target.value})); }, placeholder:"Peso (kg)", inputMode:"decimal", "aria-label":"Peso enviado em kg", className:INP+" w-24 text-center"}),
      e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ if(x.exec("env_add", {data:v.data || new Date().toISOString().slice(0, 10), galv:v.galv, kg:v.kg})) nv[1]({data:"", galv:v.galv, kg:""}); }}, "Registrar envio")),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Envios de ouro para retirada", dir:c.envios.length},
      c.envios.length ? e(Tab,{cols:["Envio", "Galvânica", "Peso (kg)", "Situação", "Fatura com o desconto", "Data da fatura", "Valor descontado", ""], className:"text-[12px]"},
        c.envios.slice().sort(function(a, b){ return a.data<b.data ? 1 : -1; }).map(function(en){ var feito = en.valor>0;
          return e("tr",{key:en.id, className:"border-t border-white/5 hover:bg-white/5"},
            e(Td,{className:tdc}, e(Cel,{v:en.data, data:true, off:!pode, rot:"Data do envio", w:"w-28", onSet:set(en, "data")})),
            e(Td,{className:tdc}, e(Sl,{v:en.galv, set:set(en, "galv"), off:!pode, rot:"Galvânica", opcoes:[["pontual", "Pontual"], ["ellos", "Ellos"]], className:"w-24 h-7!"})),
            e(Td,{className:tdc}, e(Cel,{v:en.kg, off:!pode, rot:"Peso em kg", w:"w-16", onSet:set(en, "kg")})),
            e(Td,{className:tdc, cor:feito ? "ok" : "alerta", forte:true}, feito ? "Descontado em fatura" : "Enviado"),
            e(Td,{className:tdc}, e(Cel,{v:en.faturaNum, texto:true, off:!pode, dica:"nº da fatura", rot:"Número da fatura com o desconto", w:"w-28", onSet:set(en, "faturaNum")})),
            e(Td,{className:tdc}, e(Cel,{v:en.dataFatura, data:true, off:!pode, rot:"Data da fatura", w:"w-28", onSet:set(en, "dataFatura")})),
            e(Td,{className:tdc, dinheiro:true}, e(Cel,{v:en.valor || "", dica:"R$", off:!pode, rot:"Valor descontado", w:"w-20", onSet:set(en, "valor")})),
            e(Td,{className:tdc}, pode && e(Ic,{ic:"x", perigo:true, titulo:"Remover o envio", onClick:function(){ if(window.confirm("Remover este envio?")) x.exec("env_del", {id:en.id}); }}))); })) :
      e(Vazio,{ic:"coins"}, "Nenhum envio registrado.")));
}
export { AbaFaturas, AbaRetirarOuro };
