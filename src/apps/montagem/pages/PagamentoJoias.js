// Sorelly Admin · montagem — pages/PagamentoJoias.js
// RH › Pagamento em joias (17/11/2026, pedido do Marcus): toda joia dada como pagamento a funcionário ou prestador, de qualquer setor, num lugar só.
// Caminho: Pedido → Autorizado (diretoria) → Separado (cadastro de peças) → Retirado (a pessoa leva e assina). Mostra o valor a preço de venda e o custo (20%).
// Regras em domain/joias-pagamento.js; estado s.jp, ação JP. Tabelas em TabelaPlanilha (filtro e ordem em cada coluna).
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, Botao, CampoSel, brl } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { CUSTO_PADRAO, MOTIVOS, SETORES, custoDe, jpMigrar, jpRecibo, jpResumo, pctCusto } from "@/apps/montagem/domain/joias-pagamento";
import { CampoDin, CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useMemo, useState } from "@/shared/react";

var ABAS = [["pag", "Pagamentos"], ["resumo", "Resumo por mês e setor"]];
var VAZIO = {pessoa:"", setor:"Marketing", motivo:MOTIVOS[0], descricao:"", valor:null, custoPct:String(CUSTO_PADRAO), pecas:""};
var BTN = "h-[22px] rounded-full border border-primary/60 px-3 text-[11px] font-medium leading-none text-primary transition-colors hover:bg-primary hover:text-black";   // padrao-ok · botão pequeno dentro da linha, igual ao Marcar de Fotos de catálogo (aprovado pelo Marcus)
var COR_SIT = {Pedido:"", Autorizado:"text-amber-400", Separado:"text-amber-400", Retirado:"text-success", Cancelado:"text-destructive"};
var dia = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7)+"/"+String(iso).slice(0, 4) : "—"; };
var NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var mesTxt = function(m){ return m && m.length>=7 ? NOMES_MES[Number(m.slice(5, 7))-1]+"/"+m.slice(0, 4) : "—"; };

function AbaPagamentoJoias(){
  var cx = use(), s = cx.state, d = cx.dispatch, sa = useState("pag"), aba = sa[0], sf = useState(null), form = sf[0], sc = useState(""), copiado = sc[0];
  var j = useMemo(function(){ return jpMigrar(s.jp); }, [s.jp]);
  var autoriza = temAutorizacao("joias_autoriza", s.usuario);
  var op = function(o){ d(Object.assign({type:"JP", por:porDe(s)}, o)); };
  var set = function(p){ sf[1](Object.assign({}, form, p)); };
  var registrar = function(){ op({op:"add", item:Object.assign({}, form, {id:"jp"+Date.now().toString(36)})}); sf[1](null); };

  // uma linha por pagamento (a tabela filtra e ordena pelo valor; o desenho do botão vem do render)
  var linhas = useMemo(function(){ return j.itens.map(function(x){ return Object.assign({}, x, {custo:custoDe(x), custoPct:pctCusto(x.custoPct), acao:x.situacao}); }); }, [j]);
  var botoes = function(x){
    var b = function(txt, titulo, fn){ return e("button",{key:txt, type:"button", title:titulo, onClick:function(ev){ ev.stopPropagation(); fn(); }, className:BTN}, txt); };
    var out = [];
    if(x.situacao==="Pedido" && autoriza) out.push(b("Autorizar", "Autorizar a retirada destas joias", function(){ op({op:"etapa", id:x.id, para:"Autorizado"}); }));
    if(x.situacao==="Pedido" && !autoriza) out.push(e("span",{key:"esp", className:"text-[11px]"}, "Aguarda a diretoria"));
    if(x.situacao==="Autorizado") out.push(b("Separado", "O cadastro de peças separou as joias", function(){ var t = window.prompt("Códigos das peças separadas (um por espaço; pode deixar como está):", x.pecas || ""); if(t!==null) op({op:"etapa", id:x.id, para:"Separado", pecas:t}); }));
    if(x.situacao==="Separado") out.push(b("Retirado", "A pessoa levou as joias", function(){ var n = window.prompt("Quem retirou as joias?", x.pessoa); if(n!==null) op({op:"etapa", id:x.id, para:"Retirado", recebeu:n}); }));
    if(x.situacao==="Retirado") out.push(b(copiado===x.id ? "Copiado!" : "Copiar recibo", "Copia o recibo de retirada para mandar ou imprimir", function(){ try { navigator.clipboard.writeText(jpRecibo(x)); sc[1](x.id); setTimeout(function(){ sc[1](""); }, 2500); } catch(err){} }));
    if(x.situacao==="Pedido" || x.situacao==="Autorizado" || x.situacao==="Separado") out.push(b("Cancelar", "Cancelar este pagamento", function(){ if(window.confirm("Cancelar o pagamento em joias de "+x.pessoa+"?")) op({op:"cancelar", id:x.id}); }));
    if(x.situacao==="Cancelado") out.push(b("Apagar", "Apagar este registro", function(){ if(window.confirm("Apagar de vez o registro de "+x.pessoa+"?")) op({op:"apagar", id:x.id}); }));
    return e("span",{className:"inline-flex items-center gap-1.5"}, out);
  };
  var colunas = [
    {k:"criadoEm", t:"Data", fmt:function(v){ return dia(v); }},
    {k:"pessoa", t:"Pessoa"}, {k:"setor", t:"Setor"}, {k:"motivo", t:"Motivo"},
    {k:"valor", t:"Valor (preço de venda)", fmt:brl}, {k:"custo", t:"Custo", fmt:brl}, {k:"custoPct", t:"Custo %", fmt:function(v){ return v+"%"; }},
    {k:"pecas", t:"Peças", fmt:function(v){ return v || "—"; }}, {k:"autorizadoPor", t:"Autorizado por", fmt:function(v){ return v || "—"; }},
    {k:"situacao", t:"Situação", cor:function(l){ return "font-semibold "+(COR_SIT[l.situacao] || ""); }},
    {k:"acao", t:"Ação", render:function(v, l){ return botoes(l); }}];
  var somar = function(ls, k){ return ls.reduce(function(t, x){ return t+(x.situacao==="Cancelado" ? 0 : Number(x[k]) || 0); }, 0); };

  var resumo = useMemo(function(){ return jpResumo(j); }, [j]);
  var cab = e(PageHead,{t:"Pagamento em joias", sub:"Joias dadas como pagamento: autorizar, separar e retirar."}, e(Botao,{principal:!form, onClick:function(){ sf[1](form ? null : Object.assign({}, VAZIO)); }}, form ? "Fechar" : "Novo pagamento"));
  return e(Pagina,null, cab,
    form && e(Bloco,{t:"Novo pagamento em joias"},
      e("div",{className:"grid gap-x-3 gap-y-2 md:grid-cols-4"},
        e(CampoTexto,{t:"Pessoa", id:"jp-pessoa", value:form.pessoa, maxLength:80, onChange:function(v){ set({pessoa:v}); }}),
        e(CampoSel,{t:"Setor", id:"jp-setor", value:form.setor, onChange:function(v){ set({setor:v}); }, opcoes:SETORES.map(function(x){ return [x, x]; })}),
        e(CampoSel,{t:"Motivo", id:"jp-motivo", value:form.motivo, onChange:function(v){ set({motivo:v}); }, opcoes:MOTIVOS.map(function(x){ return [x, x]; })}),
        e(CampoDin,{t:"Valor a preço de venda", id:"jp-valor", value:form.valor, onChange:function(v){ set({valor:v}); }}),
        e(CampoTexto,{t:"Custo (% do valor)", id:"jp-custo", tipo:"number", min:0, max:100, value:form.custoPct, onChange:function(v){ set({custoPct:v}); }}),
        e(CampoTexto,{t:"Descrição", id:"jp-desc", value:form.descricao, maxLength:200, onChange:function(v){ set({descricao:v}); }, cls:"md:col-span-2"}),
        e(CampoTexto,{t:"Peças (códigos, se já souber)", id:"jp-pecas", value:form.pecas, onChange:function(v){ set({pecas:v}); }})),
      e("div",{className:"mt-2 flex justify-end gap-2"}, e(Botao,{onClick:function(){ sf[1](null); }}, "Cancelar"), e(Botao,{principal:true, desabilitado:!form.pessoa.trim() || !(Number(form.valor)>0), onClick:registrar}, "Registrar"))),
    e(AbasTela,{abas:ABAS, atual:aba, onMudar:sa[1]}),
    aba==="pag"
      ? e(TabelaPlanilha,{cols:colunas, linhas:linhas, chave:"id", grade:true, escura:true, vazio:"Nenhum pagamento em joias registrado.",
          totalLinha:function(ls){ return ["Total", "", "", "", brl(somar(ls, "valor")), brl(somar(ls, "custo")), "", "", "", "", ""]; }})
      : e(TabelaPlanilha,{cols:[{k:"mes", t:"Mês", fmt:mesTxt}, {k:"setor", t:"Setor"}, {k:"qtd", t:"Pagamentos", fmt:function(v){ return String(v); }}, {k:"valor", t:"Valor (preço de venda)", fmt:brl}, {k:"custo", t:"Custo", fmt:brl}, {k:"retirado", t:"Já retirado (preço de venda)", fmt:brl}],
          linhas:resumo, chave:"id", grade:true, escura:true, vazio:"Nenhum pagamento em joias registrado.",
          totalLinha:function(ls){ return ["Total", "", String(ls.reduce(function(t, x){ return t+x.qtd; }, 0)), brl(ls.reduce(function(t, x){ return t+x.valor; }, 0)), brl(ls.reduce(function(t, x){ return t+x.custo; }, 0)), brl(ls.reduce(function(t, x){ return t+x.retirado; }, 0))]; }}));
}

export { AbaPagamentoJoias };
