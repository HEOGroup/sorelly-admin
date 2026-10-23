// Sorelly Admin · montagem — pages/producao/ProdDiaria.js
// Produção → aba "Produção diária": lançamento do dia (uma linha por peça), salvamento automático 600 ms depois de editar (remover linha salva na hora),
// resumo do dia com variação contra o dia anterior e texto de WhatsApp. O dia só é salvo depois de carregado (nunca apaga o dia por engano).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Dinheiro, Faixa, Janela, Mosaico, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { ROTULO_UNIDADE, UNIDADES, categoriaDaLinha, diaAnterior, diaDaSemana, diaSeguinte, formatarDia, formatarInteiro, formatarReais, hojeSP, limparLinhas, nomesParaLancamento, resumoDoDia, valorLinha } from "@/apps/montagem/domain/producao";
import { Bt, COR, Ic, IndT, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { Data, Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";

var seq = 0;
var comChave = function(ls){ return (ls||[]).map(function(l){ return Object.assign({k:"l"+(++seq)}, l); }); };
var semChave = function(ls){ return ls.map(function(l){ return {func:l.func, codigo:l.codigo, qtd:l.qtd, valor:l.valor, unidade:l.unidade}; }); };
var C = "h-9! text-[13px]! px-2! text-center ";

function AbaProdDiaria(){
  var x = usePr(), pr = x.pr;
  // dia aberto, linhas em edição e situação do salvamento; carregado = o dia já foi lido do estado (só então pode gravar)
  var st = useState(function(){ var d = hojeSP(); return {dia:d, linhas:comChave(pr.lancamentos[d]), carregado:true}; }), ed = st[0];
  var sSalvo = useState(""), sCod = useState(false), sCopia = useState(false);
  var timer = useRef(null), pend = useRef(null), execRef = useRef(x.exec);
  execRef.current = x.exec;

  var gravar = function(dia, linhas){ execRef.current("dia_salvar", {dia:dia, linhas:semChave(linhas)}); sSalvo[1]("salvo"); };
  var descarregar = function(){ if(timer.current){ clearTimeout(timer.current); timer.current = null; } if(pend.current){ var p = pend.current; pend.current = null; gravar(p.dia, p.linhas); } };
  useEffect(function(){ return function(){ if(timer.current){ clearTimeout(timer.current); timer.current = null; } if(pend.current){ var p = pend.current; pend.current = null; execRef.current("dia_salvar", {dia:p.dia, linhas:semChave(p.linhas)}); } }; }, []);

  var agendar = function(linhas, imediato){
    if(!ed.carregado) return;
    pend.current = {dia:ed.dia, linhas:linhas}; sSalvo[1]("pendente");
    if(timer.current){ clearTimeout(timer.current); timer.current = null; }
    if(imediato) descarregar(); else timer.current = setTimeout(descarregar, 600);
  };
  var mudar = function(linhas, imediato){ st[1](Object.assign({}, ed, {linhas:linhas})); agendar(linhas, imediato); };
  var ir = function(dia){ if(!dia || dia===ed.dia) return; descarregar(); sSalvo[1](""); st[1]({dia:dia, linhas:comChave(pr.lancamentos[dia]), carregado:true}); };

  var edita = function(k, campo, v){ mudar(ed.linhas.map(function(l){ if(l.k!==k) return l; var n = Object.assign({}, l); n[campo] = v; return n; })); };
  var remove = function(k){ mudar(ed.linhas.filter(function(l){ return l.k!==k; }), true); };
  var adiciona = function(){ var u = ed.linhas.length ? ed.linhas[ed.linhas.length-1] : null; st[1](Object.assign({}, ed, {linhas:ed.linhas.concat(comChave([{func:u ? u.func : "", codigo:"", qtd:0, valor:0, unidade:u ? u.unidade : "SORELLY"}]))})); };

  // resumo calculado com o que está na tela (sem esperar o salvamento)
  var ls = {}; Object.keys(pr.lancamentos).forEach(function(d){ ls[d] = pr.lancamentos[d]; });
  var limpas = limparLinhas(semChave(ed.linhas)); if(limpas.length) ls[ed.dia] = limpas; else delete ls[ed.dia];
  var rs = resumoDoDia(Object.assign({}, pr, {lancamentos:ls}), ed.dia, null), a = rs.agg;
  var nomes = nomesParaLancamento(pr), sugestoes = "prod-nomes";
  var copiar = function(){
    var t = rs.texto, ok = function(){ sCopia[1](true); setTimeout(function(){ sCopia[1](false); }, 1800); };
    try{ navigator.clipboard.writeText(t).then(ok, function(){ fallback(t); ok(); }); }catch(er){ fallback(t); ok(); }
  };
  var fallback = function(t){ try{ var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }catch(er){} };
  var total = ed.linhas.reduce(function(t, l){ return t+valorLinha(l); }, 0);

  var linha = function(l){
    var cat = categoriaDaLinha(pr, l.codigo);
    return e("div",{key:l.k, className:"flex flex-wrap items-center justify-center gap-1.5 border-t border-white/10 px-2 py-1.5"},
      e("input",{list:sugestoes, value:l.func, placeholder:"Funcionária", "aria-label":"Funcionária", onChange:function(ev){ edita(l.k, "func", ev.target.value); }, className:INPUT+" "+C+"w-44"}),
      e("input",{value:l.codigo, placeholder:"Código", "aria-label":"Código", onChange:function(ev){ edita(l.k, "codigo", ev.target.value.toUpperCase()); }, className:INPUT+" "+C+MONO+" w-28"}),
      e("select",{value:l.unidade, "aria-label":"Unidade", onChange:function(ev){ edita(l.k, "unidade", ev.target.value); }, className:INPUT+" "+C+"w-28 cursor-pointer"}, UNIDADES.map(function(u){ return e("option",{key:u, value:u}, ROTULO_UNIDADE[u]); })),
      e("input",{type:"number", min:0, inputMode:"numeric", value:l.qtd || "", placeholder:"Qtd.", "aria-label":"Quantidade", onChange:function(ev){ edita(l.k, "qtd", Math.max(0, parseInt(ev.target.value, 10) || 0)); }, className:INPUT+" "+C+MONO+" w-20"}),
      e("div",{className:"w-32"}, e(Dinheiro,{value:l.valor || 0, label:"Valor unitário", className:"w-full h-9! text-[13px]!", onChange:function(v){ edita(l.k, "valor", v || 0); }})),
      e("span",{className:"inline-flex w-36 justify-center"}, l.codigo ? e(Selo,{cor:cat.desconhecida ? "alerta" : COR, titulo:cat.desconhecida ? "Código sem categoria cadastrada. Cadastre em Configurações." : "Categoria do código"}, cat.desconhecida ? "Sem categoria" : cat.rotulo) : e("span",{className:"text-[12px] text-white/40"}, "—")),
      e("b",{className:MONO+" w-28 text-center text-[13px]"}, formatarReais(valorLinha(l))),
      e(Ic,{ic:"trash", perigo:true, titulo:"Remover linha", onClick:function(){ remove(l.k); }}));
  };

  var corpoCodigos = pr.codigos.length ? e(Tab,{cols:["Prefixo", "Categoria"]}, pr.codigos.slice().sort(function(p, q){ return p.codigo<q.codigo ? -1 : 1; }).map(function(c){ return e("tr",{key:c.id, className:"border-t border-white/10"}, e(Td,{forte:true, dinheiro:true}, c.codigo), e(Td,null, c.rotulo)); }))
    : e(Vazio,{ic:"list-bullets"}, "Nenhum código cadastrado. A diretoria cadastra em Configurações.");

  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-center justify-center gap-2 rounded-xl bg-black/25 px-3 py-2 ring-1 ring-white/10"},
      e(Ic,{ic:"caret-left", titulo:"Dia anterior", onClick:function(){ ir(diaAnterior(ed.dia)); }}),
      e(Data,{rot:"Data", v:ed.dia, set:ir}),
      e(Ic,{ic:"caret-right", titulo:"Próximo dia", onClick:function(){ ir(diaSeguinte(ed.dia)); }}),
      e(Bt,{ic:"calendar-blank", className:"h-9 py-0!", disabled:ed.dia===hojeSP(), onClick:function(){ ir(hojeSP()); }}, "Hoje"),
      e("span",{className:"inline-flex h-9 items-center rounded-lg bg-white/5 px-3 text-[12.5px] font-bold capitalize ring-1 ring-white/10"}, formatarDia(ed.dia)+" · "+diaDaSemana(ed.dia)),
      e("span",{className:"inline-flex h-9 items-center gap-1 px-2 text-[12px] font-bold "+(sSalvo[0]==="pendente" ? "text-[#FBBF24]" : sSalvo[0]==="salvo" ? "text-[#4ADE80]" : "text-white/45"), "aria-live":"polite"},
        e(Ph,{n:sSalvo[0]==="pendente" ? "arrows-clockwise" : "cloud-check", s:15}), sSalvo[0]==="pendente" ? "Salvando" : sSalvo[0]==="salvo" ? "Salvo" : "Salvamento automático")),
    e(Faixa,{n:4},
      e(IndT,{t:"Peças do dia", v:formatarInteiro(a.pecas), cor:COR, tend:rs.tendPecas, rotTend:"vs. dia anterior"}),
      e(IndT,{t:"Valor do dia", v:formatarReais(a.valor), cor:COR, tend:rs.tendValor, rotTend:"vs. dia anterior"}),
      e(IndT,{t:"Modelos", v:formatarInteiro(a.modelos), cor:"info"}),
      e(IndT,{t:"Funcionárias", v:formatarInteiro(a.ativas), cor:"ok"})),
    e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Lançamentos do dia", dir:ed.linhas.length ? formatarReais(total) : undefined},
      e("datalist",{id:sugestoes}, nomes.map(function(n){ return e("option",{key:n, value:n}); })),
      e("div",{className:"p-2"},
        ed.linhas.length ? e("div",{className:"hidden flex-wrap justify-center gap-1.5 px-2 pb-1 text-[10.5px] font-bold uppercase tracking-wide text-white/60 lg:flex"},
          [["w-44","Funcionária"], ["w-28","Código"], ["w-28","Unidade"], ["w-20","Qtd."], ["w-32","Valor unitário"], ["w-36","Categoria"], ["w-28","Valor"], ["w-8",""]].map(function(c, i){ return e("span",{key:i, className:c[0]+" text-center"}, c[1]); })) : null,
        ed.linhas.length ? ed.linhas.map(linha) : e(Vazio,{ic:"factory"}, "Nenhuma linha lançada neste dia."),
        e("div",{className:"mt-2 flex flex-wrap justify-center gap-2"},
          e(Bt,{tipo:"forte", ic:"plus", onClick:adiciona}, "Adicionar linha"),
          e(Bt,{ic:"list-bullets", onClick:function(){ sCod[1](true); }}, "Referência de códigos"),
          e(Bt,{tipo:"marca", ic:sCopia[0] ? "check-circle" : "copy", disabled:!a.pecas && !a.valor, onClick:copiar}, sCopia[0] ? "Copiado" : "Resumo do dia")))),
    (rs.categorias.length || rs.funcionarias.length) ? e(Mosaico,{min:"24rem"},
      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Por categoria", dir:rs.categorias.length},
        e("div",{className:"p-2"}, e(Tab,{cols:["Categoria", "Peças", "Valor"]}, rs.categorias.map(function(c){ return e("tr",{key:c.nome, className:"border-t border-white/10"}, e(Td,{forte:true}, c.nome), e(Td,{dinheiro:true}, formatarInteiro(c.pecas)), e(Td,{dinheiro:true}, formatarReais(c.valor))); })))),
      e(BlocoBarra,{cor:"turquesa", compacto:true, t:"Por funcionária", dir:rs.funcionarias.length},
        e("div",{className:"p-2"}, e(Tab,{cols:["Funcionária", "Peças", "Valor"]}, rs.funcionarias.map(function(c){ return e("tr",{key:c.nome, className:"border-t border-white/10"}, e(Td,{forte:true}, c.nome), e(Td,{dinheiro:true}, formatarInteiro(c.pecas)), e(Td,{dinheiro:true}, formatarReais(c.valor))); }))))) : null,
    sCod[0] && e(Janela,{t:"Referência de códigos", sub:"Prefixo do código e categoria", fechar:function(){ sCod[1](false); }, colunas:[corpoCodigos]}));
}
export { AbaProdDiaria };
