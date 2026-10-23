// Sorelly Admin · montagem — pages/cadpecas/Pedidos.js
// Cadastro de peças → "Pedidos de bruto": cada compra do Marcus com o fornecedor, o romaneio, as chegadas (Pontual, Ellos, Sorelly), o status e as peças por categoria.
// Quem lança: Rayssa e Graziella (config.quem.pedidos_bruto); a diretoria sempre pode. O status "Banhado" entra sozinho quando uma fatura de banho é ligada ao pedido.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { CATS, STATUS_PED, brl, mesesCpc, pecasPedido, podeFazer } from "@/apps/montagem/domain/cadastro-pecas";
import { Bt, Cel, Ic, Sl, useCpc } from "@/apps/montagem/pages/cadpecas/visualCad";
import { Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useState } from "@/shared/react";

var INP = "h-8 rounded-md bg-black/30 px-2 text-[12px] ring-1 ring-white/15 outline-none focus:ring-white/45";
var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
function rotuloMes(m){ var p = String(m).split("-"); return p.length===2 ? MESES[+p[1]-1]+" de "+p[0] : "Todos os meses"; }
function dia(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : "—"; }
// estado do pedido em cor (só estado): finalizado verde, a caminho/aguardando amarelo
function corStatus(s){ return s==="Finalizado" ? "ok" : s==="Montando pedido" ? "info" : undefined; }

function AbaPedidos(){
  var x = useCpc(), c = x.c, meses = mesesCpc(c), pode = podeFazer(c, "pedidos_bruto", x.por, x.admin);
  var fl = useState({mes:meses[0] || "", forn:"", st:""}), f = fl[0], ab = useState(null), nv = useState({forn:"", data:"", nota:"", romaneio:"", valor:"", desc:""});
  var forns = c.pedidos.map(function(p){ return p.forn; }).filter(function(v, i, a){ return a.indexOf(v)===i; }).sort();
  var vis = c.pedidos.filter(function(p){ return (!f.mes || p.data.slice(0, 7)===f.mes) && (!f.forn || p.forn===f.forn) && (!f.st || p.status===f.st); }).sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
  var tot = vis.reduce(function(t, p){ t.valor += p.valor; t.pagar += p.pagar; t.pecas += pecasPedido(p); return t; }, {valor:0, pagar:0, pecas:0});
  var set = function(p, k){ return function(v){ x.exec("ped_edit", Object.assign({id:p.id}, (function(){ var o = {}; o[k] = v; return o; })())); }; };
  var v = nv[0], tdc = "px-1! py-0.5!";
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Sl,{v:f.mes, set:function(m){ fl[1](Object.assign({}, f, {mes:m})); }, rot:"Mês da compra", opcoes:[["", "Todos os meses"]].concat(meses.map(function(m){ return [m, rotuloMes(m)]; })), className:"w-48"}),
      e(Sl,{v:f.forn, set:function(m){ fl[1](Object.assign({}, f, {forn:m})); }, rot:"Fornecedor", opcoes:[["", "Todos os fornecedores"]].concat(forns.map(function(n){ return [n, n]; })), className:"w-48"}),
      e(Sl,{v:f.st, set:function(m){ fl[1](Object.assign({}, f, {st:m})); }, rot:"Status", opcoes:[["", "Todos os status"]].concat(STATUS_PED.map(function(n){ return [n, n]; })), className:"w-48"}),
      !pode && e("span",{className:"text-[12px] font-bold text-white/70"}, "Somente quem lança os pedidos edita")),
    pode && e(BlocoBarra,{cor:"azul", compacto:true, t:"Novo pedido de bruto", dir:"lançar"},
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
        e("input",{value:v.forn, list:"cpc-forns", onChange:function(ev){ nv[1](Object.assign({}, v, {forn:ev.target.value})); }, placeholder:"Fornecedor", "aria-label":"Fornecedor", className:INP+" w-36 text-center"}),
        e("datalist",{id:"cpc-forns"}, forns.map(function(n){ return e("option",{key:n, value:n}); })),
        e("input",{type:"date", value:v.data, onChange:function(ev){ nv[1](Object.assign({}, v, {data:ev.target.value})); }, "aria-label":"Data da compra", className:INP+" w-32 text-center"}),
        e("input",{value:v.nota, onChange:function(ev){ nv[1](Object.assign({}, v, {nota:ev.target.value})); }, placeholder:"Nota", "aria-label":"Nota", className:INP+" w-20 text-center"}),
        e("input",{value:v.romaneio, onChange:function(ev){ nv[1](Object.assign({}, v, {romaneio:ev.target.value})); }, placeholder:"Romaneio", "aria-label":"Romaneio", className:INP+" w-24 text-center"}),
        e("input",{value:v.valor, onChange:function(ev){ nv[1](Object.assign({}, v, {valor:ev.target.value})); }, placeholder:"Valor R$", inputMode:"decimal", "aria-label":"Valor do pedido", className:INP+" w-24 text-center"}),
        e("input",{value:v.desc, onChange:function(ev){ nv[1](Object.assign({}, v, {desc:ev.target.value})); }, placeholder:"Desc. %", inputMode:"decimal", "aria-label":"Desconto em porcentagem", className:INP+" w-20 text-center"}),
        e(Bt,{tipo:"forte", ic:"plus", onClick:function(){ if(x.exec("ped_add", {forn:v.forn, data:v.data || new Date().toISOString().slice(0, 10), nota:v.nota, romaneio:v.romaneio, valor:v.valor, desc:numPct(v.desc), status:"Montando pedido"})) nv[1]({forn:"", data:"", nota:"", romaneio:"", valor:"", desc:""}); }}, "Lançar"))),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Pedidos de bruto", dir:vis.length},
      vis.length ? e(Tab,{cols:["Compra", "Fornecedor", "Nota", "Romaneio", "Valor", "Desc.", "A pagar", "Pontual", "Ellos", "Sorelly", "Peças", "Status", ""], className:"text-[12px]"},
        vis.map(function(p){ var aberto = ab[0]===p.id;
          return [e("tr",{key:p.id, className:"border-t border-white/5 hover:bg-white/5"},
            e(Td,{className:tdc}, e(Cel,{v:p.data, data:true, off:!pode, rot:"Data da compra", w:"w-28", onSet:set(p, "data")})),
            e(Td,{className:tdc}, e(Cel,{v:p.forn, texto:true, off:!pode, rot:"Fornecedor", w:"w-24", onSet:set(p, "forn")})),
            e(Td,{className:tdc}, e(Cel,{v:p.nota, texto:true, off:!pode, rot:"Nota", w:"w-16", onSet:set(p, "nota")})),
            e(Td,{className:tdc}, e(Cel,{v:p.romaneio, texto:true, off:!pode, rot:"Romaneio", w:"w-20", onSet:set(p, "romaneio")})),
            e(Td,{className:tdc, dinheiro:true}, e(Cel,{v:p.valor, off:!pode, rot:"Valor do pedido", w:"w-20", onSet:set(p, "valor")})),
            e(Td,{className:tdc}, e(Cel,{v:Math.round(p.desc*10000)/100, off:!pode, rot:"Desconto em %", w:"w-12", onSet:set(p, "desc")})),
            e(Td,{className:tdc, dinheiro:true, forte:true}, brl(p.pagar)),
            e(Td,{className:tdc}, e(Cel,{v:p.chegPontual, data:true, off:!pode, rot:"Chegada na Pontual", w:"w-28", onSet:set(p, "chegPontual")})),
            e(Td,{className:tdc}, e(Cel,{v:p.chegEllos, data:true, off:!pode, rot:"Chegada na Ellos", w:"w-28", onSet:set(p, "chegEllos")})),
            e(Td,{className:tdc}, e(Cel,{v:p.chegSorelly, data:true, off:!pode, rot:"Chegada na Sorelly", w:"w-28", onSet:set(p, "chegSorelly")})),
            e(Td,{className:tdc}, e("button",{type:"button", onClick:function(){ ab[1](aberto ? null : p.id); }, title:"Peças por categoria", className:"h-7 rounded-md bg-white/10 px-2 text-[12px] font-bold hover:bg-white/20"}, pecasPedido(p) || "—")),
            e(Td,{className:tdc, cor:corStatus(p.status)}, e(Sl,{v:p.status, set:set(p, "status"), off:!pode, rot:"Status do pedido", opcoes:STATUS_PED.map(function(s){ return [s, s]; }), className:"w-44 h-7!"})),
            e(Td,{className:tdc}, pode && e(Ic,{ic:"x", perigo:true, titulo:"Remover o pedido", onClick:function(){ if(window.confirm("Remover o pedido de "+p.forn+"?")) x.exec("ped_del", {id:p.id}); }}))),
          aberto && e("tr",{key:p.id+"c", className:"bg-black/25"}, e("td",{colSpan:13, className:"px-2 py-2"},
            e("div",{className:"flex flex-wrap items-center justify-center gap-2"}, CATS.map(function(k){
              return e("label",{key:k[0], className:"flex items-center gap-1 text-[11px] font-semibold"}, k[1], e(Cel,{v:p.cats[k[0]] || "", dica:"0", off:!pode, rot:k[1], w:"w-12", onSet:function(q){ x.exec("ped_edit", {id:p.id, cat:k[0], qtd:q}); }})); }),
              p.obs && e("span",{className:"text-[11px] text-white/70"}, "Obs.: "+p.obs))))];
        }).reduce(function(a, b){ return a.concat(b); }, [])
        .concat([e("tr",{key:"total", className:"border-t-2 border-white/25 bg-black/30"}, e(Td,{forte:true, colSpan:4}, "Total ("+vis.length+" pedido"+(vis.length===1 ? "" : "s")+")"), e(Td,{dinheiro:true, forte:true}, brl(tot.valor)),
          e(Td,{forte:true}, tot.valor>0 ? Math.round((1-tot.pagar/tot.valor)*1000)/10+"%" : "—"), e(Td,{dinheiro:true, forte:true}, brl(tot.pagar)), e(Td,null), e(Td,null), e(Td,null), e(Td,{forte:true}, tot.pecas), e(Td,null), e(Td,null))])) :
      e(Vazio,{ic:"package"}, "Nenhum pedido neste filtro.")));
}
function numPct(t){ return String(t||"").trim()==="" ? 0 : parseFloat(String(t).replace(",", "."))/100 || 0; }
export { AbaPedidos, rotuloMes, dia };
