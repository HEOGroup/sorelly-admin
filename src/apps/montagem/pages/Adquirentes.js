// Sorelly Admin · montagem — pages/Adquirentes.js
// Financeiro → Dinheiro e bancos → Adquirentes e taxas: taxas, antecipação, aluguéis, alertas e pendências da Sicredi (por CNPJ), Getnet e Cielo (Pontual). Só leitura: os dados vêm de domain/adquirentes.local.js
// (gitignored). "Não informado" aparece como está e nunca vira zero. As taxas de crédito da Sicredi já alimentam o simulador do Link de pagamento (aba Taxas).
// Layout: blocos de 2 em 2 (lado a lado e descendo); dentro de cada bloco, tudo em linhas "título · valor" ou em tabelas, nada de texto solto.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, LINHA, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { ADQ } from "@/apps/montagem/domain/adquirentes";
import { formatarReais } from "@/apps/montagem/domain/link-pagamento";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

var NI = "Não informado";
var pc = function(v){ return /^[0-9]/.test(String(v)) ? v+"%" : v; };
var AMARELO = "#F59E0B", VERMELHO = "#EF4444", AZUL = "#3B82F6";
var Grade = function(filhos){ return e("div",{className:"grid grid-cols-1 items-start gap-2.5 xl:grid-cols-2"}, filhos); };
// título pequeno dentro do bloco
var Sub = function(t){ return e("h3",{className:"border-b border-white/10 pb-1 text-center text-[11.5px] font-bold uppercase tracking-wide text-white/65"}, t); };
// linha "título · valor"; "Não informado" fica em amarelo para chamar atenção
var Par = function(k, v, i){ var ni = String(v).indexOf(NI)===0 || String(v).indexOf("não informad")>=0; return e("div",{key:i==null ? k : k+i, className:"flex items-baseline justify-between gap-3 rounded-lg bg-black/25 px-3 py-1.5 text-[13px]"}, e("span",{className:"text-white/70"}, k), e("b",{className:"text-right "+(ni ? "text-warning" : "")}, v)); };
var Caixa = function(cor, t, itens){ return e("div",{className:"flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-[12.5px]", style:{background:cor+"1F", boxShadow:"inset 3px 0 0 "+cor}}, t && e("b",{className:"text-[12px] uppercase tracking-wide"}, t), itens.map(function(x, i){ return e("span",{key:i}, x); })); };
// equipamento "Clover Flex CLF0FE3C: R$ 60,00/mês" vira par (nome · valor); o que não tem ":" vira nota
var Equip = function(t, i){ var k = t.indexOf(": "); return k>0 ? Par(t.slice(0, k), t.slice(k+2), i) : e("span",{key:i, className:"px-1 text-center text-[12px] text-white/65"}, t); };

function Comparativo(){
  var linhas = [];
  ADQ.fichas.filter(function(f){ return f.cnpj; }).forEach(function(f){ f.tabelas.forEach(function(t){ var d = t.linhas.find(function(l){ return l.mod==="Débito"; }), c = t.linhas.find(function(l){ return l.mod==="Crédito à vista"; });
    linhas.push({k:f.id+t.rot, cnpj:f.cnpj, nome:f.nome+(f.tabelas.length>1 ? " · "+t.rot.toLowerCase() : ""), d:d, c:c}); }); });
  return e(BlocoBarra,{cor:"azul", t:"Comparativo por CNPJ", sub:"Taxa de transação em débito e crédito à vista (sem antecipação)", compacto:true}, e("div",{className:"p-2"},
    e(Tab,{cols:["CNPJ", "Débito Visa/Master", "Débito demais", "Crédito à vista Visa/Master", "Crédito à vista demais"]}, linhas.map(function(l){ return e("tr",{key:l.k, className:LINHA},
      e(Td,{forte:true}, "CNPJ "+l.cnpj+" · "+l.nome), e(Td,null, l.d ? pc(l.d.vm) : "—"), e(Td,null, l.d ? pc(l.d.dem) : "—"), e(Td,null, l.c ? pc(l.c.vm) : "—"), e(Td,null, l.c ? pc(l.c.dem) : "—")); }))));
}

function Ficha(p){
  var f = p.f, cor = f.pontual ? "laranja" : "azul";
  return e(BlocoBarra,{cor:cor, t:(f.cnpj ? "CNPJ "+f.cnpj+" · " : "")+f.nome, sub:f.adq+(f.identificador ? " · "+f.identificador : ""), compacto:true}, e("div",{className:"flex flex-col gap-3 p-3"},
    e("section",{className:"flex flex-col gap-1.5"}, Sub("Taxas de transação"),
      f.tabelas.length ? f.tabelas.map(function(t){ return e("div",{key:t.rot, className:"flex flex-col gap-1"}, f.tabelas.length>1 || t.rot!=="Taxas" ? e("b",{className:"text-center text-[12.5px] text-[#93C5FD]"}, t.rot) : null,
          e(Tab,{cols:["Modalidade", "Visa/Master", "Demais", "Prazo"]}, t.linhas.map(function(l){ return e("tr",{key:l.mod, className:LINHA}, e(Td,{forte:true}, l.mod), e(Td,null, pc(l.vm)), e(Td,null, pc(l.dem)), e(Td,null, l.prazo || "—")); })),
          t.linhas.filter(function(l){ return l.conferir; }).map(function(l){ return e("div",{key:l.mod}, Caixa(AMARELO, "Conferir · "+l.mod, [l.conferir])); })); })
        : Caixa(AMARELO, "Taxas ainda não informadas", ["Aguardando a negociação com a Pontual. Não aplicar as condições da Sicredi."])),
    e("section",{className:"flex flex-col gap-1.5"}, Sub("Antecipação (separada da taxa)"), f.antecipacao.map(function(a){ return Par(a.rot, pc(a.pct)); })),
    e("section",{className:"flex flex-col gap-1.5"}, Sub("Equipamentos e aluguel"), f.equipamentos.map(Equip)),
    (f.link || f.faturamentoMinimo) && e("section",{className:"flex flex-col gap-1.5"}, Sub("Link e condições"),
      f.link && Par(f.link.nome, f.link.status, "l"), f.link && f.link.obs ? e("span",{className:"px-1 text-center text-[12px] text-white/65"}, f.link.obs) : null,
      f.faturamentoMinimo && Par("Faturamento mínimo", f.faturamentoMinimo, "m")),
    f.alertas.length ? e("section",{className:"flex flex-col gap-1.5"}, Sub("Alertas"), f.alertas.map(function(a, i){ return e("div",{key:i}, Caixa(AMARELO, null, [a])); })) : null));
}

function BlocoLista(cor, t, itens, opc){ opc = opc || {};
  return e(BlocoBarra,{cor:cor, t:t, sub:opc.sub, dir:opc.dir, compacto:true}, e("div",{className:"flex flex-col gap-1.5 p-3"}, itens.map(function(x, i){ return e("div",{key:i, className:"flex items-start gap-2 rounded-lg bg-black/25 px-3 py-1.5 text-left text-[13px]", style:opc.faixa ? {boxShadow:"inset 3px 0 0 "+opc.faixa} : undefined},
    e("b",{className:"mt-px w-5 shrink-0 text-center text-white/60"}, opc.numerar ? (i+1)+"." : "•"), e("span",null, x)); })));
}

function AbaAdquirentes(){
  if(!ADQ) return e(Pagina,null, e(PageHead,{t:"Adquirentes e taxas", sub:"Sicredi, Getnet e Cielo."}), e("p",{className:"py-8 text-center text-[13px] text-white/60"}, "Os dados das adquirentes ficam só no computador do Marcus (arquivo local, fora do GitHub). Este computador não tem o arquivo."));
  var mensal = ADQ.fichas.reduce(function(t, f){ return t+(f.aluguelValor||0); }, 0), alertas = ADQ.fichas.reduce(function(t, f){ return t+f.alertas.length; }, 0), dia = function(iso){ return iso.split("-").reverse().join("/"); };
  var sicredi = ADQ.fichas.filter(function(f){ return !f.pontual; }), pontual = ADQ.fichas.filter(function(f){ return f.pontual; });
  return e(Pagina,null,
    e(PageHead,{t:"Adquirentes e taxas", sub:"Taxas de "+dia(ADQ.taxasEm)+", consolidadas em "+dia(ADQ.consolidadoEm)+". Só leitura."}),
    Caixa(AMARELO, "Atenção", [ADQ.aviso]),
    e(Faixa,{n:4}, e(Indicador,{t:"Aluguel mensal conhecido", v:formatarReais(mensal), cor:"info", sub:"Anual projetado: "+formatarReais(mensal*12)+" (não é o custo total)"}), e(Indicador,{t:"Alertas", v:String(alertas), cor:alertas ? "alerta" : "ok"}),
      e(Indicador,{t:"Prioridade alta", v:String(ADQ.prioridades.alta.length), cor:"ruim"}), e(Indicador,{t:"A conferir", v:String(ADQ.conferir.length), cor:"alerta"})),
    e(Comparativo,null),
    e("h2",{className:"text-center text-[13px] font-bold uppercase tracking-wide text-white/70"}, "Sicredi · um bloco por CNPJ"),
    Grade(sicredi.map(function(f){ return e(Ficha,{key:f.id, f:f}); })),
    e("h2",{className:"text-center text-[13px] font-bold uppercase tracking-wide text-white/70"}, "Pontual · Getnet e Cielo (negociação própria, separada da Sicredi)"),
    Grade(pontual.map(function(f){ return e(Ficha,{key:f.id, f:f}); })),
    e("h2",{className:"text-center text-[13px] font-bold uppercase tracking-wide text-white/70"}, "Pendências"),
    Grade([BlocoLista("vermelho", "Prioridade alta", ADQ.prioridades.alta, {dir:String(ADQ.prioridades.alta.length), faixa:VERMELHO, numerar:true, sub:"Resolver primeiro"}),
      BlocoLista("laranja", "Prioridade média", ADQ.prioridades.media, {dir:String(ADQ.prioridades.media.length), faixa:AMARELO, numerar:true, sub:"Resolver depois"}),
      BlocoLista("azul", "A conferir", ADQ.conferir, {dir:String(ADQ.conferir.length), faixa:AMARELO, sub:"Divergências sinalizadas; nada foi corrigido em silêncio"}),
      e(BlocoBarra,{key:"portal", cor:"azul", t:"Acesso aos links", sub:ADQ.portal.nome, compacto:true}, e("div",{className:"flex flex-col gap-1.5 p-3"}, Par("Portal", ADQ.portal.nome), Par("Login", ADQ.portal.login), Par("Responsáveis pelo acesso", ADQ.portal.responsaveis), Caixa(VERMELHO, "Senhas", [ADQ.portal.senhas])))]),
    BlocoLista("azul", "Histórico das condições", ADQ.historico.map(function(h){ return dia(h.em)+" · "+h.txt; })));
}
export { AbaAdquirentes };
