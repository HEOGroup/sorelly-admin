// Sorelly Admin · montagem — pages/encomendas/NovaSolicitacao.js
// Encomendas e reposições › Funil de pedidos › "Nova solicitação" (17/11/2026, Marcus): a revendedora pediu pelo WhatsApp e o Marcus lança aqui. Procura a revendedora na DevMaster (nome, representante, cidade e média das 3 últimas vendas
// vêm de lá), escolhe cobrar ou isentar a taxa de reposição (R$ 15,00 fixa; só a diretoria isenta) e quem do setor atende. O pedido entra em Novo e anda pelas etapas da entrega pelo João.
// A diretoria lança sem passar pelas regras de direito (Top 50, média, limite): quem decide é o Marcus (campo autorizada em domain/encomendas.js › ped_criar).
import { Janela } from "@/apps/montagem/components/padrao";
import { Bloco, Botao, CampoSel } from "@/apps/montagem/components/padrao-fin";
import { formatarReais } from "@/apps/montagem/domain/encomendas";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { CampoTexto } from "@/apps/montagem/pages/trafego/comum";
import { e, useEffect, useState } from "@/shared/react";

var EQUIPE = ["Agatha", "Elen", "Eduarda Gabriela"];
var semAcento = function(t){ return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var media3 = function(r){ var v = (r.vendas || []).slice(0, 3); return v.length ? Math.round(v.reduce(function(t, x){ return t+(Number(x.v) || 0); }, 0)/v.length*100)/100 : null; };
function Par(p){ return e("div",{className:"flex items-center justify-between gap-3 border-b border-border py-1 text-[13px]"}, e("span",{className:"font-medium"}, p.t), e("span",{className:"tabular-nums"}, p.v)); }

function NovaSolicitacao(p){
  var E = p.E, cfg = E.cfg, taxa = cfg.reposicao.taxa;
  var st = useState({tipo:"reposicao", busca:"", rev:null, taxa:"cobrar", resp:EQUIPE.indexOf(E.por)>=0 ? E.por : EQUIPE[0], obs:"", descricao:""}), f = st[0];
  var sl = useState(null), lista = sl[0];   // revendedoras da DevMaster (só a diretoria lê; as outras pessoas digitam o nome)
  var set = function(k, v){ st[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  useEffect(function(){
    if(!apiAtiva()) return undefined; var vivo = true;
    chamar("GET", "/revendedoras").then(function(j){ if(vivo) sl[1](j.itens || []); }).catch(function(){ if(vivo) sl[1]([]); });
    return function(){ vivo = false; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var q = semAcento(f.busca), achadas = lista && !f.rev && q.length>=3 ? lista.filter(function(r){ return semAcento(r.nome).indexOf(q)>=0; }).slice(0, 8) : [];
  var nome = f.rev ? f.rev.nome : f.busca.trim(), rep = f.rev ? f.rev.representante : "", media = f.rev ? media3(f.rev) : null, ult = f.rev && f.rev.vendas && f.rev.vendas[0] ? f.rev.vendas[0] : null;
  var rep1 = f.tipo==="reposicao";
  var registrar = function(){
    var ped = {tipo:f.tipo, revendedora:nome, representante:rep, media3m:media, valor:0, observacao:f.obs, descricao:f.tipo==="encomenda" ? f.descricao : "", responsavel:f.resp, autorizada:true, isenta:rep1 && f.taxa==="isentar",
      canal:rep1 ? "entrega" : "", cod:f.rev ? f.rev.cod : "", telefone:f.rev ? (f.rev.celular || "") : "", cidade:f.rev ? (f.rev.cidade || "") : ""};
    if(E.exec("ped_criar", {pedido:ped})) p.fechar();
  };
  var colRev = e(Bloco,{key:"r", t:"Revendedora"},
    e("div",{className:"flex flex-col gap-2 pt-1"},
      e(CampoTexto,{t:"Buscar pelo nome", id:"nsB", value:f.busca, placeholder:lista===null && apiAtiva() ? "Carregando a lista da DevMaster" : "Digite ao menos 3 letras", onChange:function(v){ st[1](function(o){ return Object.assign({}, o, {busca:v, rev:null}); }); }}),
      achadas.length>0 && e("div",{className:"flex flex-col gap-1"}, achadas.map(function(r){ return e("button",{key:r.cod, type:"button", onClick:function(){ st[1](function(o){ return Object.assign({}, o, {rev:r, busca:r.nome}); }); }, className:"h-8 w-full rounded-md border border-border bg-card px-2.5 text-left text-[13px] hover:bg-white/10"}, r.nome+" · "+(r.representante || "Sem representante")+(r.cidade ? " · "+r.cidade : "")); })),
      lista && !f.rev && q.length>=3 && !achadas.length && e("p",{className:"text-[13px]"}, "Ninguém com esse nome na DevMaster. Se continuar, o pedido leva o nome digitado."),
      f.rev && e("div",null,
        e(Par,{t:"Código", v:f.rev.cod}), e(Par,{t:"Representante", v:f.rev.representante || "—"}), e(Par,{t:"Cidade", v:(f.rev.cidade || "—")+(f.rev.uf ? "/"+f.rev.uf : "")}), e(Par,{t:"Telefone", v:f.rev.celular || "—"}),
        e(Par,{t:"Média das 3 últimas vendas", v:media!=null ? formatarReais(media) : "—"}), e(Par,{t:"Última venda", v:ult ? formatarReais(ult.v)+" em "+String(ult.d).slice(8, 10)+"/"+String(ult.d).slice(5, 7) : "—"}))));
  var colPed = e(Bloco,{key:"p", t:"Pedido"},
    e("div",{className:"grid grid-cols-1 gap-2 pt-1"},
      e(CampoSel,{t:"Tipo", id:"nsT", value:f.tipo, onChange:function(v){ set("tipo", v); }, opcoes:[["reposicao", "Reposição (entrega pelo João)"], ["encomenda", "Encomenda (kit)"]]}),
      rep1 && e(CampoSel,{t:"Taxa de reposição", id:"nsX", value:f.taxa, onChange:function(v){ set("taxa", v); }, opcoes:E.pode ? [["cobrar", "Cobrar "+formatarReais(taxa)], ["isentar", "Isentar"]] : [["cobrar", "Cobrar "+formatarReais(taxa)]]}),
      !rep1 && e(CampoTexto,{t:"Peça ou produto", id:"nsD", value:f.descricao, placeholder:"O que ela encomendou", onChange:function(v){ set("descricao", v); }}),
      e(CampoSel,{t:"Quem atende", id:"nsR", value:f.resp, onChange:function(v){ set("resp", v); }, opcoes:EQUIPE.map(function(n){ return [n, n]; })}),
      e(CampoTexto,{t:"O que ela pediu", id:"nsO", value:f.obs, placeholder:"Peças, cores, observações", onChange:function(v){ set("obs", v); }})),
    e("div",{className:"mt-3 flex justify-end gap-2"}, e(Botao,{onClick:p.fechar}, "Cancelar"), e(Botao,{principal:true, desabilitado:!nome || (!rep1 && !f.descricao.trim()), onClick:registrar}, "Registrar solicitação")));
  return e(Janela,{t:"Nova solicitação", sub:nome ? nome : "Procure a revendedora e escolha a taxa.", fechar:p.fechar, colunas:[colRev, colPed]});
}
export { NovaSolicitacao };
