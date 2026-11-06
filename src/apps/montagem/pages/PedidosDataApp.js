// Sorelly Admin · montagem — pages/PedidosDataApp.js
// Agendamento › Pedidos do app (05/11/2026): pedidos de mudança da data do acerto feitos no APP REAL da representante.
// Substitui a antiga "Plano 45/60 › Aprovação › Pedidos do app" (apagada; manual do app da representante, Revendedora › Alterar data do acerto).
// Regra: até 5 dias depois da data atual e sem prazo 45/60 o pedido já vale na hora ("Alterada na hora", status registrada); o resto
// espera a Diretoria. Sem aprovação vale a multa de remarcação. O pedido vive no backend do app (rotas /api/app-rep/pedidos-data).
import { Pagina } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, Segmentado, TabelaP, Td, Tr, Aviso } from "@/apps/montagem/components/padrao-fin";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { BKC } from "@/apps/montagem/lib/format";
import { DIRETORIA } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useEffect, useState } from "@/shared/react";

var dBR = function(i){ return i ? String(i).slice(8, 10)+"/"+String(i).slice(5, 7)+"/"+String(i).slice(0, 4) : "—"; };
var PRAZO = {so_data:"Só a data", "45":"45 dias", "60":"60 dias"};
var SITUACAO = {aguardando:"Aguardando a Diretoria", registrada:"Alterada na hora", aprovado:"Aprovada sem multa", reprovado:"Reprovada: vale a multa"};
var COR = {aguardando:"text-warning", registrada:"text-success", aprovado:"text-success", reprovado:"text-destructive"};
var VISOES = [["aguardando","Aguardando"], ["registrada","Alteradas na hora"], ["decididos","Decididos"]];

function AbaPedidosDataApp(){
  var cx = use(), s = cx.state, ehDiretoria = DIRETORIA.some(function(x){ return x.id===s.usuario; });   // decidir é só da Diretoria (o servidor confere de novo)
  var vs = useState("aguardando"), vis = vs[0], setVis = vs[1];
  var ds = useState({itens:[], pronto:false, msg:""}), d = ds[0], setD = ds[1];
  var rs = useState({id:null, motivo:"", enviando:false, erro:""}), rep = rs[0], setRep = rs[1];
  var carregar = function(){
    if(!apiAtiva()){ setD({itens:[], pronto:true, msg:"Precisa do servidor ligado."}); return; }
    var st = vis==="decididos" ? "" : vis;
    chamar("GET", "/app-rep/pedidos-data"+(st ? "?status="+st : "")).then(function(r){
      var it = r.itens || []; if(vis==="decididos") it = it.filter(function(x){ return x.status==="aprovado" || x.status==="reprovado"; });
      setD({itens:it, pronto:true, msg:""}); }).catch(function(x){ setD({itens:[], pronto:true, msg:x.message}); });
  };
  useEffect(function(){ carregar(); }, [vis]);
  var decidir = function(p, status){
    if(status==="reprovado" && !rep.motivo.trim()){ setRep(Object.assign({}, rep, {erro:"Escreva o motivo para reprovar."})); return; }
    setRep(Object.assign({}, rep, {enviando:true, erro:""}));
    chamar("PATCH", "/app-rep/pedidos-data/"+p.id, {status:status, motivo:status==="reprovado" ? rep.motivo : null})
      .then(function(){ setRep({id:null, motivo:"", enviando:false, erro:""}); carregar(); })
      .catch(function(x){ setRep(Object.assign({}, rep, {enviando:false, erro:x.message})); });
  };
  var cols = [{t:"Pedido em", w:96}, {t:"Revendedora"}, {t:"Representante", w:140}, {t:"Data atual", w:96}, {t:"Nova data", w:96}, {t:"Prazo", w:90},
    {t:"Mínimo", w:110}, {t:"Motivo"}, {t:"Situação", w:170}].concat(vis==="aguardando" && ehDiretoria ? [{t:"Decisão", w:250}] : []);
  return e(Pagina, null,
    e(PageHead, {t:"Pedidos do app", sub:"Mudança da data do acerto pedida pela representante no app"},
      e(Segmentado, {opcoes:VISOES, atual:vis, onMudar:setVis}), e(Botao, {onClick:carregar}, "Atualizar")),
    d.msg && e(Aviso, {tom:"vermelho"}, d.msg),
    rep.erro && e(Aviso, {tom:"vermelho"}, rep.erro),
    e(TabelaP, {cols:cols, minW:1100},
      !d.pronto ? e(Tr, null, e(Td, {c:true}, "Carregando…")) :
      !d.itens.length ? e(Tr, null, e(Td, {c:true}, vis==="aguardando" ? "Nenhum pedido aguardando." : "Nenhum pedido.")) :
      d.itens.map(function(p){
        var aberto = rep.id===p.id;
        return e(Tr, {key:p.id},
          e(Td, {c:true}, dBR(String(p.criadoEm||"").slice(0, 10))),
          e(Td, {c:true, forte:true}, p.revendedoraNome || "—"),
          e(Td, {c:true}, p.representanteNome || p.representanteCod || "—"),
          e(Td, {c:true}, dBR(p.dataAtual)),
          e(Td, {c:true, forte:true}, dBR(p.novaData)),
          e(Td, {c:true}, (PRAZO[p.prazo] || p.prazo)+(p.fixarPrazo ? " fixo" : "")),
          e(Td, {c:true}, p.minimoVendas ? BKC(p.minimoVendas) : "—"),
          e(Td, {c:true, title:p.observacao || p.motivo}, p.motivo+(p.observacao ? " · "+p.observacao : "")),
          e(Td, {c:true, cor:COR[p.status]||""}, SITUACAO[p.status] || p.status),
          vis==="aguardando" && ehDiretoria && e(Td, {c:true},
            aberto
              ? e("div", {className:"flex items-center justify-center gap-2"},
                  e("input", {value:rep.motivo, placeholder:"Motivo", "aria-label":"Motivo da reprovação", onChange:function(ev){ setRep(Object.assign({}, rep, {motivo:ev.target.value})); }, className:CAMPO+" max-w-[140px]"}),
                  e(Botao, {desabilitado:rep.enviando, onClick:function(){ decidir(p, "reprovado"); }}, "Reprovar"))
              : e("div", {className:"flex items-center justify-center gap-2"},
                  e(Botao, {principal:true, desabilitado:rep.enviando, onClick:function(){ decidir(p, "aprovado"); }}, "Aprovar"),
                  e(Botao, {desabilitado:rep.enviando, onClick:function(){ setRep({id:p.id, motivo:"", enviando:false, erro:""}); }}, "Reprovar"))));
      })));
}

export { AbaPedidosDataApp };
