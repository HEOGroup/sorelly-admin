// Sorelly Admin · montagem — pages/MarcusExtratos.js
// Sistema pessoal do Marcus → Extratos (22/10/2026). Ele sobe o CSV do banco de cada mês (por ora Nubank) e a tela mostra o que ENTROU e o que SAIU,
// tudo somado por pessoa/estabelecimento (ex.: quanto foi enviado a cada pessoa). Clicar numa linha abre os lançamentos logo embaixo. Dados só neste navegador.
// LAYOUT NOVO (23/10/2026): padrão do Financeiro (components/padrao-fin.js): Filtros no topo · faixa de totais · abas Resumo | Entrou | Saiu · tabelas com R$ à direita.
import { AbasTela, Bloco, BlocoFiltros, Botao, COR, CampoBusca, CampoSel, FaixaTotais, TabelaP, Td, Tr, corSinal, brl as R, H } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { agrupar, carregar, ehDe, incluir, lerCsvNubank, norm, r2, salvar } from "@/apps/montagem/domain/marcus-extratos";
import { ESTILO } from "@/apps/montagem/pages/MarcusPessoal";
import { e, useState } from "@/shared/react";

var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var rotMes = function(m){ return m==="todos" ? "Todos os meses" : (m ? MESES[parseInt(m.slice(5), 10)-1]+"/"+m.slice(0, 4) : "Nenhum extrato"); };
var br = function(iso){ return iso.slice(8, 10)+"/"+iso.slice(5, 7); };
var ABAS = [["resumo","Resumo"],["entrou","Entrou"],["saiu","Saiu"]];

function Extratos(){
  var sd = useState(function(){ return carregar(); }), dados = sd[0], setDados = sd[1], sm = useState(""), mesSel = sm[0], setMes = sm[1], sq = useState(""), q = sq[0], setQ = sq[1], sa = useState({}), ab = sa[0], setAb = sa[1], sg = useState(""), msg = sg[0], setMsg = sg[1], sc = useState(false), cfg = sc[0], setCfg = sc[1], st = useState("resumo"), aba = st[0], setAba = st[1];
  var meses = Object.keys(dados.meses).sort(), mes = meses.indexOf(mesSel)>=0 || mesSel==="todos" ? mesSel : (meses[meses.length-1] || "");
  var todas = []; (mes==="todos" ? meses : (mes ? [mes] : [])).forEach(function(m){ Object.keys(dados.meses[m]||{}).forEach(function(b){ dados.meses[m][b].forEach(function(l){ todas.push(Object.assign({banco:b}, l)); }); }); });
  var nq = norm(q), linhas = nq ? todas.filter(function(l){ return norm(l.n+" "+l.x).indexOf(nq)>=0; }) : todas;
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
  var gSai = [["Pix enviados, por pessoa", pixEnv.filter(function(l){ return !ehDe(dados.familia, l.n); })], ["Pix para família e minhas contas", pixEnv.filter(function(l){ return ehDe(dados.familia, l.n); })], ["Boletos", sai.filter(function(l){ return l.t==="boleto"; })], ["Compras no débito", sai.filter(function(l){ return l.t==="compra"; })], ["Fatura do cartão", sai.filter(function(l){ return l.t==="fatura"; })], ["Outras saídas", sai.filter(function(l){ return ["pix_enviado", "boleto", "compra", "fatura"].indexOf(l.t)<0; })]];
  var totEnt = soma(ent), totSai = Math.abs(soma(sai));
  // COMO FOI O MÊS: de fora entrou × pra fora saiu (o que vai e volta entre família e contas próprias não conta)
  var famEntrou = soma(gEnt[1][1]), famSaiu = Math.abs(soma(gSai[1][1])), entFora = r2(totEnt-famEntrou), saiFora = r2(totSai-famSaiu), sobrou = r2(entFora-saiFora);
  var pcS = function(v){ return saiFora>0 ? Math.round(Math.abs(v)/saiFora*100)+"%" : "—"; };
  var vazio = !todas.length;

  // grupo expansível: linha do grupo (total) → linhas por pessoa → lançamentos
  var grupo = function(lado, titulo, ls, abertoPadrao){
    if(!ls.length) return [];
    var k = lado+"|"+titulo, aberto = ab[k]===undefined ? (!!nq || !!abertoPadrao) : ab[k], pess = agrupar(ls), out = [];
    out.push(e(Tr,{key:k, total:true, onClick:function(){ var o = Object.assign({}, ab); o[k] = !aberto; setAb(o); }}, e(Td,{title:titulo}, (aberto ? "▾ " : "▸ ")+titulo+" · "+pess.length+(pess.length===1 ? " nome" : " nomes")), e(Td,{n:true, cor:lado==="e" ? COR.entra : COR.sai}, R(Math.abs(soma(ls))))));
    if(aberto) pess.forEach(function(p){ var kp = k+"|"+norm(p.nome), abp = ab[kp];
      out.push(e(Tr,{key:kp, onClick:function(){ var o = Object.assign({}, ab); o[kp] = !abp; setAb(o); }}, e(Td,{title:p.nome}, "   "+(abp ? "▾ " : "▸ ")+p.nome+" · "+p.n+"×"), e(Td,{n:true}, R(Math.abs(p.v)))));
      if(abp) p.itens.slice().sort(function(a, b){ return b.d.localeCompare(a.d); }).forEach(function(it, i){ out.push(e(Tr,{key:kp+"|"+i, apagado:true}, e(Td,null, "        "+br(it.d)+" · "+it.banco), e(Td,{n:true}, R(Math.abs(it.v))))); }); });
    return out;
  };
  var tabelaGrupos = function(lado, gs){ return e(TabelaP,{cols:[{t:lado==="e" ? "Entrou" : "Saiu"}, {t:"Valor", n:true, w:150}], minW:380}, gs.reduce(function(a, g){ return a.concat(grupo(lado, g[0], g[1], lado==="s" && g[0]===gSai[0][0])); }, [])); };
  var topN = function(ls, n){ return agrupar(ls).slice(0, n).map(function(p){ return e(Tr,{key:p.nome}, e(Td,{title:p.nome}, p.nome+" · "+p.n+"×"), e(Td,{n:true}, R(Math.abs(p.v)))); }); };
  var cab2 = function(t){ return [{t:t}, {t:"Valor", n:true, w:130}]; };

  var resumo = e("div",{className:"grid grid-cols-1 items-start gap-3 lg:grid-cols-2"},
    e(Bloco,{t:"Como foi o mês · "+rotMes(mes)}, e(TabelaP,{cols:[{t:"Item"}, {t:"Valor", n:true, w:140}, {t:"Parte", n:true, w:70}], minW:360},
      e(Tr,{total:true}, e(Td,null, "Entrou de fora"), e(Td,{n:true, cor:COR.entra}, R(entFora)), e(Td,null, "")),
      e(Tr,null, e(Td,null, "Revendedoras e clientes"), e(Td,{n:true}, R(soma(gEnt[0][1]))), e(Td,null, "")),
      e(Tr,null, e(Td,null, "Sorelly (pró-labore)"), e(Td,{n:true}, R(soma(gEnt[2][1]))), e(Td,null, "")),
      e(Tr,null, e(Td,null, "Outras entradas"), e(Td,{n:true}, R(soma(gEnt[3][1]))), e(Td,null, "")),
      e(Tr,{total:true}, e(Td,null, "Saiu para fora"), e(Td,{n:true, cor:COR.sai}, R(-saiFora)), e(Td,null, "")),
      [["Pix para pessoas", 0], ["Boletos", 2], ["Compras no débito", 3], ["Fatura do cartão", 4], ["Outras saídas", 5]].map(function(x){ var v = soma(gSai[x[1]][1]); return e(Tr,{key:x[0]}, e(Td,null, x[0]), e(Td,{n:true}, R(v)), e(Td,{n:true}, pcS(v))); }),
      e(Tr,{total:true}, e(Td,null, sobrou>=0 ? "Sobrou no mês" : "Faltou no mês"), e(Td,{n:true, cor:corSinal(sobrou)}, R(sobrou)), e(Td,null, "")))),
    e("div",{className:"flex flex-col gap-3"},
      e(Bloco,{t:"Quem mais recebeu de você"}, e(TabelaP,{cols:cab2("Pessoa"), minW:300}, topN(gSai[0][1], 10))),
      e(Bloco,{t:"Onde mais gastou no débito"}, e(TabelaP,{cols:cab2("Lugar"), minW:300}, topN(gSai[3][1], 10))),
      e(Bloco,{t:"Boletos"}, e(TabelaP,{cols:cab2("Boleto"), minW:300}, topN(gSai[2][1], 6)))),
    e("p",{className:"text-[13px] text-foreground lg:col-span-2"}, "Pix entre você e a família ("+R(famEntrou)+" que entrou, "+R(famSaiu)+" que saiu) não entra na conta de sobrou ou faltou."));

  return e(Pagina,null, e("style",null, ESTILO), e("div",{className:"mx flex flex-col gap-3"},
    e("div",{className:"flex h-10 items-center justify-between gap-2"}, e("h1",{className:"truncate text-[16px] font-semibold text-foreground"}, "Extratos"),
      e("div",{className:"flex items-center gap-2"},
        mes && mes!=="todos" && e(Botao,{onClick:apagar}, "Apagar mês"),
        e(Botao,{onClick:function(){ setCfg(!cfg); }}, "Quem é família"),
        e("label",{className:H+" inline-flex min-w-24 cursor-pointer items-center justify-center rounded-md border border-primary bg-primary/20 px-3.5 text-[13px] font-semibold text-primary hover:bg-primary/30"}, "Subir CSV", e("input",{type:"file", accept:".csv,text/csv", className:"hidden", onChange:subir})))),
    msg && e("p",{className:"text-[13px] text-foreground"}, msg),
    e(BlocoFiltros,{onLimpar:q ? function(){ setQ(""); } : null},
      e(CampoSel,{t:"Mês", id:"mx-mes", value:mes, onChange:setMes, opcoes:meses.length ? meses.map(function(m){ return [m, rotMes(m)]; }).concat(meses.length>1 ? [["todos","Todos os meses"]] : []) : [["","Nenhum extrato"]]}),
      e(CampoBusca,{t:"Buscar pessoa ou lugar", id:"mx-q", placeholder:"Igor, Lucas, Amanda", value:q, onChange:setQ})),
    cfg && e(BlocoFiltros,{titulo:"Quem é família"},
      e("div",{className:"col-span-2 min-w-0"}, e("label",{className:"mb-0.5 block h-4 truncate text-[11px] font-medium uppercase tracking-[.05em]"}, "Família e próprios (vírgula)"), e("input",{key:"f"+dados.familia.join(), defaultValue:dados.familia.join(", "), className:"h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px]", onBlur:function(ev){ salvaLista("familia", ev.target.value); }})),
      e("div",{className:"col-span-2 min-w-0"}, e("label",{className:"mb-0.5 block h-4 truncate text-[11px] font-medium uppercase tracking-[.05em]"}, "Empresa (pró-labore)"), e("input",{key:"e"+dados.empresa.join(), defaultValue:dados.empresa.join(", "), className:"h-8 w-full rounded-md border border-border bg-card px-2.5 text-[13px]", onBlur:function(ev){ salvaLista("empresa", ev.target.value); }}))),
    nq && e(FaixaTotais,{itens:[{t:"Lançamentos", v:String(linhas.length)}, {t:"Enviei", v:R(-Math.abs(soma(sai))), cor:COR.sai}, {t:"Recebi", v:R(soma(ent)), cor:COR.entra}]}),
    vazio ? e("p",{className:"rounded-lg border border-border px-4 py-8 text-center text-[13px]"}, "Nenhum extrato ainda. Use “Subir CSV” e escolha o arquivo do mês (Nubank).") : e("div",{className:"flex flex-col gap-3"},
      e(FaixaTotais,{itens:[{t:"Entrou", v:R(totEnt), cor:COR.entra}, {t:"Saiu", v:R(-totSai), cor:COR.sai}, {t:"Entrou de fora", v:R(entFora), cor:COR.entra}, {t:"Saiu para fora", v:R(-saiFora), cor:COR.sai}, {t:sobrou>=0 ? "Sobrou" : "Faltou", v:R(sobrou), cor:corSinal(sobrou)}]}),
      e(AbasTela,{abas:ABAS, atual:aba, onMudar:setAba}),
      aba==="resumo" && resumo,
      aba==="entrou" && tabelaGrupos("e", gEnt),
      aba==="saiu" && tabelaGrupos("s", gSai))));
}

var AbaMarcusExtratos = function(){ return e(Extratos, null); };
export { AbaMarcusExtratos };
