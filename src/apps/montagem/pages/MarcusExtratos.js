// Sorelly Admin · montagem — pages/MarcusExtratos.js
// Sistema pessoal do Marcus → Extratos (22/10/2026). Ele sobe o CSV do banco de cada mês (por ora Nubank) e a tela mostra, lado a lado, o que ENTROU e o que SAIU,
// tudo somado por pessoa/estabelecimento (ex.: quanto foi enviado a cada pessoa). Clicar numa linha abre os lançamentos logo embaixo. Dados só neste navegador.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Pagina } from "@/apps/montagem/components/padrao";
import { agrupar, carregar, ehDe, incluir, lerCsvNubank, norm, r2, salvar } from "@/apps/montagem/domain/marcus-extratos";
import { ESTILO } from "@/apps/montagem/pages/MarcusPessoal";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var rotMes = function(m){ return m ? MESES[parseInt(m.slice(5), 10)-1]+"/"+m.slice(0, 4) : "Todos os meses"; };
var br = function(iso){ return iso.slice(8, 10)+"/"+iso.slice(5, 7); };
var OURO = "#E3B341";

function Extratos(){
  var sd = useState(function(){ return carregar(); }), dados = sd[0], setDados = sd[1], sm = useState(""), mesSel = sm[0], setMes = sm[1], sq = useState(""), q = sq[0], setQ = sq[1], sa = useState({}), ab = sa[0], setAb = sa[1], sg = useState(""), msg = sg[0], setMsg = sg[1], sc = useState(false), cfg = sc[0], setCfg = sc[1];
  var meses = Object.keys(dados.meses).sort(), mes = meses.indexOf(mesSel)>=0 || mesSel==="todos" ? mesSel : (meses[meses.length-1] || "");
  var todas = []; (mes==="todos" ? meses : (mes ? [mes] : [])).forEach(function(m){ Object.keys(dados.meses[m]||{}).forEach(function(b){ dados.meses[m][b].forEach(function(l){ todas.push(Object.assign({banco:b}, l)); }); }); });
  var nq = norm(q), linhas = nq ? todas.filter(function(l){ return norm(l.n+" "+l.x).indexOf(nq)>=0; }) : todas;
  var alterna = function(k){ var o = Object.assign({}, ab); o[k] = !ab[k]; setAb(o); };
  var subir = function(ev){ var arq = ev.target.files && ev.target.files[0]; if(!arq) return; var fr = new FileReader();
    fr.onload = function(){ var r = lerCsvNubank(fr.result); if(r.erro){ setMsg(r.erro); return; } var o = carregar(), ms = incluir(o, "Nubank", r.linhas); if(!salvar(o)){ setMsg("Não consegui guardar neste navegador (espaço cheio)."); return; } setDados(o); setMes(ms[ms.length-1]); setMsg(r.linhas.length+" lançamentos de "+ms.map(rotMes).join(", ")+" carregados (o mês que já existia foi substituído)."); };
    fr.readAsText(arq, "utf-8"); ev.target.value = ""; };
  var apagar = function(){ if(!mes || mes==="todos" || !window.confirm("Apagar o extrato de "+rotMes(mes)+" deste navegador?")) return; var o = carregar(); delete o.meses[mes]; salvar(o); setDados(o); setMes(""); setMsg("Mês apagado."); };
  var salvaLista = function(k, txt){ var o = carregar(); o[k] = txt.split(",").map(function(x){ return x.trim(); }).filter(Boolean); salvar(o); setDados(o); };
  var soma = function(l){ return r2(l.reduce(function(s, x){ return s+x.v; }, 0)); };
  // entradas e saídas
  var ent = linhas.filter(function(l){ return l.v>0; }), sai = linhas.filter(function(l){ return l.v<0; });
  var recebidos = ent.filter(function(l){ return l.t==="recebido"; });
  var gEnt = [["Revendedoras e clientes", recebidos.filter(function(l){ return !ehDe(dados.familia, l.n) && !ehDe(dados.empresa, l.n); })], ["Família (Pix pessoal)", recebidos.filter(function(l){ return ehDe(dados.familia, l.n); })], ["Sorelly (pró-labore)", recebidos.filter(function(l){ return ehDe(dados.empresa, l.n); })], ["Outras entradas", ent.filter(function(l){ return l.t!=="recebido"; })]];
  var pixEnv = sai.filter(function(l){ return l.t==="pix_enviado"; });
  var gSai = [["Pix enviados, por pessoa", pixEnv.filter(function(l){ return !ehDe(dados.familia, l.n); }), true], ["Pix para família e minhas contas", pixEnv.filter(function(l){ return ehDe(dados.familia, l.n); }), false], ["Boletos", sai.filter(function(l){ return l.t==="boleto"; })], ["Compras no débito", sai.filter(function(l){ return l.t==="compra"; })], ["Fatura do cartão", sai.filter(function(l){ return l.t==="fatura"; })], ["Outras saídas", sai.filter(function(l){ return ["pix_enviado", "boleto", "compra", "fatura"].indexOf(l.t)<0; })]];
  var grupo = function(lado, titulo, ls, abertoPadrao){
    if(!ls.length) return null; var k = lado+"|"+titulo, aberto = ab[k]===undefined ? (!!nq || !!abertoPadrao) : ab[k], pess = agrupar(ls);
    return e("div",{key:k, className:"border-t", style:{borderColor:"#B8862B55"}},
      e("button",{type:"button", onClick:function(){ var o = Object.assign({}, ab); o[k] = !aberto; setAb(o); }, className:"flex w-full items-baseline justify-between gap-3 px-2 py-2 text-left hover:bg-white/5"}, e("span",{className:"font-bold"}, e("span",{className:"mr-1.5 text-[12px]", style:{color:OURO}}, aberto ? "▾" : "▸"), titulo, e("span",{className:"ml-2 text-[13px] font-normal text-white/60"}, pess.length+" "+(pess.length===1 ? "nome" : "nomes")+" · "+ls.length+" lanç.")), e("b",{className:MONO}, BK(Math.abs(soma(ls))))),
      aberto && e("div",{className:"pb-1"}, pess.map(function(p){ var kp = k+"|"+norm(p.nome), abp = ab[kp];
        return e("div",{key:kp}, e("button",{type:"button", onClick:function(){ alterna(kp); }, className:"flex w-full items-baseline justify-between gap-3 rounded px-2 py-1 pl-6 text-left text-[15px] hover:bg-white/10"}, e("span",null, e("span",{className:"mr-1.5 text-[11px]", style:{color:OURO}}, abp ? "▾" : "▸"), p.nome, e("span",{className:"ml-2 text-[13px] text-white/55"}, p.n+"×")), e("b",{className:MONO}, BK(Math.abs(p.v)))),
          abp && e("div",{className:"mb-1 ml-14 mr-2 flex flex-col rounded-md bg-black/30 px-2 py-1 text-[13.5px]"}, p.itens.slice().sort(function(a, b){ return b.d.localeCompare(a.d); }).map(function(it, i){ return e("div",{key:i, className:"flex justify-between gap-3 text-white/85"}, e("span",null, br(it.d)+" · "+it.banco), e("span",{className:MONO}, BK(Math.abs(it.v)))); }))); })));
  };
  var totEnt = soma(ent), totSai = Math.abs(soma(sai));
  // COMO FOI O MÊS: de fora entrou × pra fora saiu (o que vai e volta entre família e contas próprias não conta), e para onde foi o dinheiro
  var famEntrou = soma(gEnt[1][1]), famSaiu = Math.abs(soma(gSai[1][1])), entFora = r2(totEnt-famEntrou), saiFora = r2(totSai-famSaiu), sobrou = r2(entFora-saiFora);
  var linhaMes = function(rot, v, cor, forte, pc){ return e("div",{key:rot, className:"flex items-baseline justify-between gap-3 py-0.5 "+(forte ? "text-[16px] font-bold" : "text-[14.5px]")}, e("span",null, rot, pc!=null && e("span",{className:"ml-2 text-[12.5px] font-normal text-white/55"}, pc+"%")), e("b",{className:MONO, style:{color:cor}}, BK(Math.abs(v)))); };
  var pcS = function(v){ return saiFora>0 ? Math.round(Math.abs(v)/saiFora*100) : 0; };
  var topN = function(ls, n){ return agrupar(ls).slice(0, n).map(function(p){ return e("div",{key:p.nome, className:"flex items-baseline justify-between gap-3 text-[14px]"}, e("span",null, p.nome, e("span",{className:"ml-2 text-[12.5px] text-white/55"}, p.n+"×")), e("b",{className:MONO}, BK(Math.abs(p.v)))); }); };
  var comoFoi = e(BlocoBarra,{cor:"ouro", compacto:true, t:"Como foi o mês · "+rotMes(mes), dir:(sobrou>=0 ? "sobrou " : "faltou ")+BK(Math.abs(sobrou))}, e("div",{className:"grid grid-cols-1 gap-x-8 gap-y-3 p-3 lg:grid-cols-3"},
    e("div",{className:"flex flex-col"}, linhaMes("Entrou de fora", entFora, "#4ade80", true), linhaMes("Revendedoras e clientes", soma(gEnt[0][1]), null, false), linhaMes("Sorelly (pró-labore)", soma(gEnt[2][1]), null, false), linhaMes("Outras entradas", soma(gEnt[3][1]), null, false),
      e("div",{className:"my-1 border-t", style:{borderColor:"#B8862B55"}}), linhaMes("Saiu para fora", saiFora, "#fca5a5", true), linhaMes("Pix para pessoas", soma(gSai[0][1]), null, false, pcS(soma(gSai[0][1]))), linhaMes("Boletos", soma(gSai[2][1]), null, false, pcS(soma(gSai[2][1]))), linhaMes("Compras no débito", soma(gSai[3][1]), null, false, pcS(soma(gSai[3][1]))), linhaMes("Fatura do cartão", soma(gSai[4][1]), null, false, pcS(soma(gSai[4][1]))), linhaMes("Outras saídas", soma(gSai[5][1]), null, false, pcS(soma(gSai[5][1]))),
      e("div",{className:"my-1 border-t", style:{borderColor:"#B8862B55"}}), linhaMes(sobrou>=0 ? "Sobrou no mês" : "Faltou no mês", Math.abs(sobrou), sobrou>=0 ? "#4ade80" : "#fca5a5", true), e("p",{className:"mt-1 text-[12.5px] text-white/55"}, "Pix entre você e a família ("+BK(famEntrou)+" que entrou, "+BK(famSaiu)+" que saiu) não entra na conta de sobrou ou faltou.")),
    e("div",{className:"flex flex-col gap-0.5"}, e("b",{className:"mb-1 text-[15px]", style:{color:OURO}}, "Quem mais recebeu de você"), topN(gSai[0][1], 10)),
    e("div",{className:"flex flex-col gap-0.5"}, e("b",{className:"mb-1 text-[15px]", style:{color:OURO}}, "Onde mais gastou no débito"), topN(gSai[3][1], 10), e("b",{className:"mb-1 mt-3 text-[15px]", style:{color:OURO}}, "Boletos"), topN(gSai[2][1], 6))));
  var topo = e("div",{className:"flex flex-wrap items-center gap-2"},
    e("label",{className:"inline-flex h-10 cursor-pointer items-center rounded-lg px-4 text-[14px] font-bold", style:{background:OURO, color:"#1a1204"}}, "Subir extrato (CSV)", e("input",{type:"file", accept:".csv,text/csv", className:"hidden", onChange:subir})),
    e("select",{value:mes, "aria-label":"Mês", className:INPUT+" h-10! w-52 cursor-pointer", onChange:function(ev){ setMes(ev.target.value); }}, meses.length ? meses.map(function(m){ return e("option",{key:m, value:m}, rotMes(m)); }).concat(meses.length>1 ? [e("option",{key:"t", value:"todos"}, "Todos os meses")] : []) : e("option",{value:""}, "Nenhum extrato")),
    e("input",{value:q, placeholder:"Buscar pessoa ou lugar (ex.: Igor, Lucas, Amanda)", "aria-label":"Buscar", className:INPUT+" h-10! w-80", onChange:function(ev){ setQ(ev.target.value); }}),
    e("span",{className:"flex-1"}), mes && mes!=="todos" && e("button",{type:"button", onClick:apagar, className:"h-10 rounded-lg px-3 text-[13px] font-bold ring-1 ring-white/20 hover:bg-white/10"}, "Apagar este mês"), e("button",{type:"button", onClick:function(){ setCfg(!cfg); }, className:"h-10 rounded-lg px-3 text-[13px] font-bold ring-1 ring-white/20 hover:bg-white/10"}, "Quem é família"));
  var resumoBusca = nq && e("div",{className:"rounded-lg px-4 py-2 text-[15px]", style:{background:"#ffffff0d", boxShadow:"inset 0 0 0 1.5px #B8862B88"}}, "Busca “"+q+"”: ", e("b",null, linhas.length+" lançamentos"), " · enviei ", e("b",{className:MONO, style:{color:"#fca5a5"}}, BK(Math.abs(soma(sai)))), " · recebi ", e("b",{className:MONO, style:{color:"#4ade80"}}, BK(soma(ent))));
  var config = cfg && e("div",{className:"grid grid-cols-1 gap-2 rounded-lg p-3 md:grid-cols-2", style:{background:"#ffffff0d"}},
    e("label",{className:"flex flex-col gap-1 text-[13px] font-bold"}, "Família e próprios (nomes separados por vírgula)", e("input",{key:"f"+dados.familia.join(), defaultValue:dados.familia.join(", "), className:INPUT+" h-10!", onBlur:function(ev){ salvaLista("familia", ev.target.value); }})),
    e("label",{className:"flex flex-col gap-1 text-[13px] font-bold"}, "Empresa (pró-labore)", e("input",{key:"e"+dados.empresa.join(), defaultValue:dados.empresa.join(", "), className:INPUT+" h-10!", onBlur:function(ev){ salvaLista("empresa", ev.target.value); }})));
  var vazio = !todas.length;
  return e(Pagina,null, e("style",null, ESTILO), e("div",{className:"mx flex flex-col gap-3", style:{background:"radial-gradient(900px 320px at 50% -60px, rgba(217,166,58,.16), transparent)"}},
    e(PageHead,{t:"Extratos", sub:"Suba o CSV do banco de cada mês: entradas e saídas somadas por pessoa"}), topo, msg && e("p",{className:"text-[14px]", style:{color:OURO}}, msg), config, resumoBusca,
    vazio ? e("p",{className:"rounded-xl bg-white/5 px-4 py-8 text-center text-[16px]"}, "Nenhum extrato ainda. Clique em “Subir extrato (CSV)” e escolha o arquivo do mês (Nubank).") :
    e("div",{className:"flex flex-col gap-3"}, comoFoi, e("div",{className:"grid grid-cols-1 items-start gap-3 lg:grid-cols-2"},
      e(BlocoBarra,{cor:"ouro", compacto:true, t:"ENTROU · "+rotMes(mes), dir:BK(totEnt)}, e("div",{className:"flex flex-col p-1.5"}, gEnt.map(function(g){ return grupo("e", g[0], g[1], false); }))),
      e(BlocoBarra,{cor:"ouro", compacto:true, t:"SAIU · "+rotMes(mes), dir:BK(totSai)}, e("div",{className:"flex flex-col p-1.5"}, gSai.map(function(g){ return grupo("s", g[0], g[1], g[2]); })))))));
}

var AbaMarcusExtratos = function(){ return e(Extratos, null); };
export { AbaMarcusExtratos };
