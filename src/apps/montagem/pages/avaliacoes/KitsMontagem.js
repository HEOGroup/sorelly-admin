// Sorelly Admin · montagem — pages/avaliacoes/KitsMontagem.js
// Avaliações → Kits (o que as revendedoras acharam do kit) e Avaliações → Montagem (erros de bipagem e divergências, vindos da conferência).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Mosaico, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { PERIODOS, avKits, avMontagem, formatarDia, formatarMes, formatarNota, percentualDaNota } from "@/apps/montagem/domain/avaliacoes";
import { brl } from "@/apps/montagem/ui/input";
import { Chip } from "@/apps/montagem/pages/indicacoes/visual";
import { LinhaBarra, Serie, Vazio, corNota, useAv } from "@/apps/montagem/pages/avaliacoes/visual";
import { e, useState } from "@/shared/react";

// ---------- Kits ----------
function AbaAvKits(){
  var a = useAv(), k = avKits(a.s), cfg = a.av.config;
  var info = {}; k.medias.forEach(function(m){ info[m.perguntaId] = m; });
  var serie = k.historico.map(function(h){ var soma = 0, pt = 0; h.medias.forEach(function(m){ var i = info[m.perguntaId]; if(!i) return; soma += m.media/i.max*5*i.peso; pt += i.peso; }); return {r:formatarMes(h.mes), v:pt ? soma/pt : 0}; }).slice(-cfg.mesesEvolucao);
  var sem = k.total===0;
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:3}, e(Indicador,{t:"Avaliações do kit", v:k.total, cor:"info"}), e(Indicador,{t:"Revendedoras", v:k.revendedoras, cor:"total"}), e(Indicador,{t:"Nota geral do kit", v:formatarNota(k.mediaGeral), cor:corNota(k.mediaGeral, 5, cfg), sub:"Última avaliação de cada revendedora"})),
    sem ? e(BlocoBarra,{cor:"laranja", t:"Avaliações do kit", compacto:true}, e(Vazio,{ic:"package"}, "Nenhuma avaliação de kit lançada até o momento.")) :
    e(Mosaico,{min:"21rem"},
      e(BlocoBarra,{cor:"laranja", t:"Média por pergunta", compacto:true}, e("div",{className:"flex flex-col gap-2 p-2.5"}, k.medias.length ? k.medias.map(function(m){
        return e(LinhaBarra,{key:m.perguntaId, t:m.texto, v:formatarNota(m.media)+(m.max===10 ? " de 10" : ""), sub:"("+m.n+")", pct:percentualDaNota(m.media, m.max), cor:corNota(m.media, m.max, cfg)}); }) : e(Vazio,{ic:"chart-bar"}, "Sem notas para o kit."))),
      k.distribuicoes.length ? e(BlocoBarra,{cor:"laranja", t:"Distribuição das respostas", compacto:true}, e("div",{className:"flex flex-col gap-3 p-2.5"}, k.distribuicoes.map(function(x){
        return e("div",{key:x.perguntaId, className:"flex flex-col gap-1.5"}, e("b",{className:"text-center text-[12.5px]"}, x.texto.charAt(0).toUpperCase()+x.texto.slice(1)),
          x.opcoes.map(function(o){ return e(LinhaBarra,{key:o.opcao, t:o.opcao, v:o.count, pct:x.total ? o.count/x.total*100 : 0}); })); }))) : null,
      e(BlocoBarra,{cor:"laranja", t:"Evolução mensal", compacto:true}, serie.length ? e("div",{className:"flex flex-col gap-2 p-2.5"}, e(Serie,{pontos:serie}),
        e(Tab,{cols:["Mês", "Nota"]}, serie.map(function(x){ return e("tr",{key:x.r, className:LINHA}, e(Td,{forte:true}, x.r), e(Td,{dinheiro:true, forte:true, cor:corNota(x.v, 5, cfg)}, formatarNota(x.v))); }))) : e(Vazio,{ic:"calendar-blank"}, "Sem avaliações para mostrar a evolução."))));
}

// ---------- Montagem ----------
function TabelaGrupo(p){
  return p.lista.length ? e("div",{className:"p-1.5"}, e(Tab,{cols:[p.rot, "Registros", "Erros", "Faltas", "Sobras", "Taxa de erro"].concat(p.ver ? ["Desconto estimado"] : [])}, p.lista.map(function(x){
    return e("tr",{key:x.nome, className:LINHA}, e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true}, x.registros), e(Td,{dinheiro:true, cor:x.erros ? "ruim" : undefined}, x.erros), e(Td,{dinheiro:true}, x.faltas), e(Td,{dinheiro:true}, x.sobras),
      e(Td,{dinheiro:true}, x.taxaErro==null ? "—" : String(x.taxaErro).replace(".", ",")+"%"), p.ver && e(Td,{dinheiro:true}, brl(x.descontoEstimado))); }))) : e(Vazio,{ic:"list-magnifying-glass"}, "Sem registros no período.");
}
function AbaAvMontagem(){
  var a = useAv(), st = useState("mes_atual"), m = avMontagem(a.s, st[0]), t = m.totais, ver = a.ver, vazio = t.registros===0;
  var itens = [e(Indicador,{key:"r", t:"Registros", v:t.registros, cor:"info"}), e(Indicador,{key:"e", t:"Erros", v:t.erros, cor:t.erros ? "ruim" : "neutro"}), e(Indicador,{key:"f", t:"Faltas", v:t.faltas, cor:"alerta"}), e(Indicador,{key:"s", t:"Sobras", v:t.sobras, cor:"info"}),
    e(Indicador,{key:"x", t:"Taxa de erro", v:t.taxaErro==null ? "—" : String(t.taxaErro).replace(".", ",")+"%", cor:t.taxaErro ? "alerta" : "neutro", sub:t.pecasEsperadas+" peças esperadas"})];
  if(ver) itens.push(e(Indicador,{key:"d", t:"Desconto estimado", v:brl(t.descontoEstimado), cor:"total", sub:"Erros × valor da falta"}));
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"}, PERIODOS.map(function(x){ return e(Chip,{key:x.k, on:x.k===st[0], onClick:function(){ st[1](x.k); }}, x.rotulo); })),
    e(Faixa,{n:ver ? 6 : 5}, itens),
    vazio ? e(BlocoBarra,{cor:"laranja", t:"Erros de bipagem", compacto:true}, e(Vazio,{ic:"barcode"}, "Nenhum registro de conferência no período.")) :
    e(Mosaico,{min:"23rem"},
      e(BlocoBarra,{cor:"laranja", t:"Por bipadora", compacto:true}, e(TabelaGrupo,{lista:m.porBipadora, rot:"Bipadora", ver:ver})),
      e(BlocoBarra,{cor:"laranja", t:"Por montadora", compacto:true}, e(TabelaGrupo,{lista:m.porMontadora, rot:"Montadora", ver:ver})),
      e(BlocoBarra,{cor:"laranja", t:"Por representante", compacto:true}, e(TabelaGrupo,{lista:m.porRepresentante, rot:"Representante", ver:ver})),
      e(BlocoBarra,{cor:"laranja", t:"Peças mais faltantes", compacto:true}, m.pecasMaisFaltantes.length ? e("div",{className:"p-1.5"}, e(Tab,{cols:["Código", "Faltas"]}, m.pecasMaisFaltantes.map(function(x){
        return e("tr",{key:x.codigo, className:LINHA}, e(Td,{forte:true}, x.codigo), e(Td,{dinheiro:true}, x.qtd)); }))) : e(Vazio,{ic:"puzzle-piece"}, "Nenhuma peça em falta no período.")),
      m.porMes.length>1 ? e(BlocoBarra,{cor:"laranja", t:"Por mês", compacto:true}, e("div",{className:"p-1.5"}, e(Tab,{cols:["Mês", "Registros", "Erros"]}, m.porMes.map(function(x){
        return e("tr",{key:x.mes, className:LINHA}, e(Td,{forte:true}, formatarMes(x.mes)), e(Td,{dinheiro:true}, x.registros), e(Td,{dinheiro:true}, x.erros)); })))) : null,
      e(BlocoBarra,{cor:"laranja", t:"Últimos registros", compacto:true}, e("div",{className:"p-1.5"}, e(Tab,{cols:["Data", "Kit", "Representante", "Bipadora", "Erros"]}, m.ultimos.map(function(x, i){
        return e("tr",{key:x.id || i, className:LINHA}, e(Td,null, formatarDia(x.data)), e(Td,null, x.kitId || "—"), e(Td,null, x.rep || "—"), e(Td,null, x.bipadora || "—"), e(Td,{dinheiro:true, cor:x.erros ? "ruim" : undefined}, x.erros || 0)); }))))));
}

export { AbaAvKits, AbaAvMontagem };
