// Sorelly Admin · montagem — pages/compras/EstoqueMovimentos.js
// Materiais & Estoque → aba "Movimentos": planilha de todos os lançamentos do estoque (contagem, entrada, saída, ajuste) com filtros, total do filtro, exportar CSV e estorno,
// e o dashboard geral do estoque (totais por aba, aguardando aprovação por responsável, maiores consumos do mês) em blocos num mosaico.
import { BarraFiltros, Faixa, Mosaico, Pagina, Tab, Td, ESTADO } from "@/apps/montagem/components/padrao";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ROTULO_MOV, TIPOS_MOV, consumoDoMes, dashboardGeral, formatarDataHora, formatarDia, hojeSP, somaDias } from "@/apps/montagem/domain/compras-estoque";
import { Bt, BtMini, Busca, Data, Editor, Ind, Painel, Sel, Selo, Vazio, baixarCsv, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR_MOV = {contagem:"info", entrada:"ok", saida:"alerta", ajuste:"neutro"};
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var sinal = function(n){ return (n>0 ? "+" : "")+n; };

function AbaEstoqueMovimentos(pr){
  var x = useCe(), ce = x.ce, hoje = hojeSP();
  var sDe = useState(somaDias(hoje, -30)), sAte = useState(hoje), sQ = useState(""), sTp = useState(""), sQm = useState(""), sLim = useState(50), sEst = useState((pr && pr.estIni) || null), sMes = useState(hoje.slice(0, 7));
  var mats = {}; ce.materiais.forEach(function(m){ mats[String(m.id)] = m; });
  var quems = []; ce.movimentos.forEach(function(m){ if(m.quem && quems.indexOf(m.quem)<0) quems.push(m.quem); }); quems.sort();
  var alvo = norm(sQ[0]);
  var linhas = ce.movimentos.filter(function(m){
    if(sDe[0] && m.data<sDe[0]) return false; if(sAte[0] && m.data>sAte[0]) return false; if(sTp[0] && m.tipo!==sTp[0]) return false; if(sQm[0] && m.quem!==sQm[0]) return false;
    return !alvo || norm(mats[String(m.materialId)] ? mats[String(m.materialId)].material : "").indexOf(alvo)>=0;
  }).sort(function(a, b){ return b.em.localeCompare(a.em) || (Number(b.id)-Number(a.id)); });
  var ent = 0, sai = 0, liq = 0; linhas.forEach(function(m){ if(m.delta>0) ent += m.delta; else sai += -m.delta; liq += m.delta; });
  var filtro = sQ[0] || sTp[0] || sQm[0] || sDe[0]!==somaDias(hoje, -30) || sAte[0]!==hoje;
  var limpar = function(){ sQ[1](""); sTp[1](""); sQm[1](""); sDe[1](somaDias(hoje, -30)); sAte[1](hoje); };
  var nomeMat = function(m){ var mt = mats[String(m.materialId)]; return mt ? mt.material : "(material excluído)"; };
  var exportar = function(){ baixarCsv("movimentos-estoque.csv", ["Data", "Material", "Tipo", "Quantidade", "Variação", "Saldo antes", "Saldo depois", "Quem", "Motivo", "Estornado", "Registrado por", "Registrado em"],
    linhas.map(function(m){ return [formatarDia(m.data), nomeMat(m), ROTULO_MOV[m.tipo], m.qtd, m.delta, m.saldoAntes, m.saldoApos, m.quem, m.motivo, m.estornado ? "Sim" : "Não", m.por, formatarDataHora(m.em)]; })); };
  var podeEstornar = x.pode("APROVACAO");
  var mv = sEst[0] ? ce.movimentos.filter(function(m){ return String(m.id)===String(sEst[0]); })[0] : null;

  var dash = dashboardGeral(x.s, sMes[0]), tipos = x.cfg.tipos;
  var comResp = dash.porResponsavel.filter(function(r){ return r.aguardandoAprovacao>0; });

  return e(Pagina,null,
    e(Faixa,{n:4}, e(Ind,{t:"Lançamentos no filtro", v:linhas.length, cor:"total"}), e(Ind,{t:"Entradas", v:ent, cor:"ok"}), e(Ind,{t:"Saídas", v:sai, cor:"alerta"}), e(Ind,{t:"Variação líquida", v:sinal(liq), cor:liq<0 ? "ruim" : "info"})),
    e(BarraFiltros,{ativo:!!filtro, onLimpar:limpar},
      e(Busca,{v:sQ[0], set:sQ[1], ph:"Buscar material"}),
      e(Data,{rot:"De", v:sDe[0], set:sDe[1], max:sAte[0]}), e(Data,{rot:"Até", v:sAte[0], set:sAte[1], min:sDe[0], max:hoje}),
      e(Sel,{v:sTp[0], set:sTp[1], rot:"Tipo", todos:"Todos os tipos", opcoes:TIPOS_MOV.map(function(k){ return [k, ROTULO_MOV[k]]; })}),
      e(Sel,{v:sQm[0], set:sQm[1], rot:"Pessoa", todos:"Todas as pessoas", opcoes:quems.map(function(q){ return [q, q]; })}),
      e(Bt,{tipo:"forte", ic:"download-simple", className:"h-9 py-0!", disabled:!linhas.length, onClick:exportar}, "Exportar CSV")),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Movimentos do estoque", dir:linhas.length},
      linhas.length ? e("div",{className:"p-2"}, e(Tab,{cols:["Data", "Material", "Tipo", "Variação", "Saldo", "Pessoa", "Motivo", "Ações"]}, linhas.slice(0, sLim[0]).map(function(m){
        return e("tr",{key:m.id, className:"border-t border-white/10 "+(m.estornado ? "opacity-55" : "")},
          e(Td,null, formatarDia(m.data)), e(Td,{forte:true}, nomeMat(m)), e(Td,null, e(Selo,{cor:COR_MOV[m.tipo]}, ROTULO_MOV[m.tipo])),
          e(Td,{dinheiro:true, cor:m.delta<0 ? "alerta" : m.delta>0 ? "ok" : undefined}, sinal(m.delta)), e(Td,{dinheiro:true}, m.saldoApos), e(Td,null, m.quem||"—"),
          e(Td,{className:"max-w-[16rem] whitespace-normal!"}, (m.motivo||"—")+(m.estornado ? " · Estornado" : "")),
          e(Td,null, m.tipo==="contagem" || m.estornado ? "—" : e(BtMini,{ic:"arrow-counter-clockwise", disabled:!podeEstornar, titulo:podeEstornar ? "Estornar este lançamento" : "Sem autorização", onClick:function(){ sEst[1](m.id); }}, "Estornar")));
      })), linhas.length>sLim[0] && e("div",{className:"mt-2 flex justify-center"}, e(Bt,{onClick:function(){ sLim[1](sLim[0]+50); }}, "Ver mais "+Math.min(50, linhas.length-sLim[0])))) : e("div",{className:"p-2"}, e(Vazio,{ic:"arrows-left-right"}, ce.movimentos.length ? "Nenhum movimento neste filtro." : "Nenhum movimento registrado."))),

    e(Faixa,{n:5},
      e(Ind,{t:"Itens no estoque", v:dash.totalItens, cor:"total"}), e(Ind,{t:"Críticos", v:dash.criticos, cor:"ruim"}), e(Ind,{t:"Em atenção", v:dash.atencao, cor:"alerta"}),
      e(Ind,{t:"Aguardando aprovação", v:dash.aguardandoAprovacao, cor:"cian"}), e(Ind,{t:"Compras chegando", v:dash.comprasChegando, cor:"info"})),
    e("div",{className:"flex justify-center"}, e(Data,{rot:"Mês do consumo", tipo:"month", v:sMes[0], set:function(v){ if(v) sMes[1](v); }, max:hoje.slice(0, 7)})),
    e(Mosaico,{min:"26rem"},
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Comparação por aba"}, dash.porAba.length ? e("div",{className:"p-2"}, e(Tab,{cols:["Aba", "Itens", "Críticos", "Atenção", "Em dia", "Aguardando", "Chegando"]}, dash.porAba.map(function(a){ return e("tr",{key:a.tipoId, className:"border-t border-white/10"},
        e(Td,{forte:true}, a.nome), e(Td,{dinheiro:true}, a.totalItens), e(Td,{dinheiro:true, cor:a.criticos ? "ruim" : undefined}, a.criticos), e(Td,{dinheiro:true, cor:a.atencao ? "alerta" : undefined}, a.atencao), e(Td,{dinheiro:true}, a.ok), e(Td,{dinheiro:true}, a.aguardandoAprovacao), e(Td,{dinheiro:true}, a.comprasChegando)); }))) : e("div",{className:"p-2"}, e(Vazio,null, "Nenhuma aba configurada."))),
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Aguardando aprovação por responsável"}, comResp.length ? e("div",{className:"p-2"}, e(Tab,{cols:["Responsável", "Solicitações"]}, comResp.map(function(r){ return e("tr",{key:r.responsavel, className:"border-t border-white/10"}, e(Td,{forte:true}, r.responsavel), e(Td,{dinheiro:true, cor:"alerta"}, r.aguardandoAprovacao)); }))) : e("div",{className:"p-2"}, e(Vazio,{ic:"check-circle"}, "Nenhuma solicitação aguardando aprovação."))),
      tipos.map(function(t){ var rk = consumoDoMes(x.s, t.id, sMes[0]);
        return e(BlocoBarra,{key:t.id, cor:"azul", compacto:true, t:"Maiores consumos · "+t.nome, dir:rk.length || undefined},
          rk.length ? e("div",{className:"p-2"}, e(Tab,{cols:["Material", "Categoria", "Consumo", "Compras"]}, rk.map(function(r){ return e("tr",{key:r.materialId, className:"border-t border-white/10"}, e(Td,{forte:true}, r.material), e(Td,null, r.categoria||"—"), e(Td,{dinheiro:true, cor:"alerta"}, r.consumoMes), e(Td,{dinheiro:true}, r.vezesComprado)); })))
            : e("div",{className:"p-2"}, e(Vazio,{ic:"chart-bar"}, "Sem consumo registrado em "+sMes[0].slice(5)+"/"+sMes[0].slice(0, 4)+".")));
      })),
    mv && e(Editor,{t:"Estornar lançamento", sub:nomeMat(mv)+" · "+ROTULO_MOV[mv.tipo], fechar:function(){ sEst[1](null); }, salvarRot:"Estornar lançamento", icSalvar:"arrow-counter-clockwise", semAut:!podeEstornar,
      dados:e("div",{className:"flex flex-col items-center gap-1.5"}, e("b",{className:"text-[14px]"}, nomeMat(mv)), e(Selo,{cor:COR_MOV[mv.tipo]}, ROTULO_MOV[mv.tipo]),
        e("b",{className:MONO+" text-[19px] leading-none", style:{color:mv.delta<0 ? ESTADO.alerta : ESTADO.ok}}, sinal(mv.delta)), e("span",{className:"text-[12px] text-white/70"}, "Saldo depois: "+mv.saldoApos),
        e("span",{className:"text-[12px] text-white/70"}, formatarDia(mv.data)+" · "+(mv.quem||"—")), mv.motivo && e("span",{className:"text-[12px] text-white/70"}, mv.motivo)),
      ini:{motivo:""}, campos:[{k:"motivo", rot:"Motivo do estorno", tipo:"area", obrig:true, ph:"Descreva por que o lançamento será estornado"}],
      lateral:function(){ return e(Painel,{t:"Efeito do estorno", estado:"atual"}, e("span",{className:"text-[12.5px] text-white/80"}, "É criado um ajuste contrário de "+sinal(-mv.delta)+". O lançamento original permanece registrado.")); },
      onSalvar:function(v){ return x.exec("estoque_mov_estornar", {id:mv.id, motivo:v.motivo}); }}));
}

export { AbaEstoqueMovimentos };
