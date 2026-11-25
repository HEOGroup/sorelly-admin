// Sorelly Admin · kits novos Curitiba — state/reducer.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ETAPAS, aberto, estadoAtual, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { MESES, hojeISO } from "@/apps/kits-novos/lib/datas";
import { CHAVE, com, mapC, novo, quem, reg } from "@/apps/kits-novos/state/store";
import { ehAdmin } from "@/apps/montagem/lib/api";

// marcas de etiqueta na observação (Expositor e Falta ligar são lidas da observação: badges.js)
function comMarca(obs, marca, on){ var t = String(obs||"").replace(new RegExp("\\s*\\|?\\s*"+marca, "ig"), "").replace(/^\s*\|\s*/, "").trim(); return on ? (t ? t+" | "+marca : marca) : t; }

function reducer(s, a){
  var c;
  switch(a.type){
    case "ABA": return com(s, {aba:a.aba});
    case "MODO": return com(s, {modo:a.modo});
    case "GRUPO": { var ab = Object.assign({}, s.abertos); ab[a.k] = !ab[a.k]; return com(s, {abertos:ab}); }
    case "GRUPOS": { var ab2 = {}; ETAPAS.concat([{k:"cancelado"}]).forEach(function(x){ ab2[x.k]=a.v; }); return com(s, {abertos:ab2}); }
    case "USUARIO": return com(s, {usuario:a.id});
    case "FILTRO": { var ab3 = s.abertos; if(a.f.st){ ab3 = Object.assign({}, s.abertos); ab3[a.f.st] = true; }
      if(a.f.busca){ ab3 = {}; ETAPAS.concat([{k:"cancelado"}]).forEach(function(x){ ab3[x.k]=true; }); }
      return com(s, {filtro:Object.assign({}, s.filtro, a.f), abertos:ab3}); }
    case "DIALOGO": return com(s, {dialogo:a.d});
    case "SUBREP": return com(s, {subRep:a.sub});
    // mudança nos blocos de região (Representantes › Regiões): grava na hora e sem aviso a cada clique
    case "PERFIL_REGIAO": { var pr = Object.assign({}, s.perfis); pr[a.nome] = a.perfil; return com(s, {perfis:pr}); }
    case "PERFIL_SALVAR": { var pf = Object.assign({}, s.perfis); pf[a.nome] = a.perfil; return com(s, {perfis:pf, dialogo:null}, "Mapa de "+a.nome+" salvo"); }
    case "AVISO": return com(s, {}, a.txt, "atencao");
    case "LIMPAR_AVISO": return com(s, {aviso:null});
    // kits que chegaram do servidor (lib/sync-servidor.js): entram ou trocam o kit de mesmo id, sem aviso
    // excluido = kit excluído pela Diretoria (marca no servidor, 25/11/2026): sai da lista de todo mundo
    case "SYNC_SERVIDOR": { var ixS = {}, ndS = s.dados.slice(), fora = {}; ndS.forEach(function(x, i){ ixS[x.id] = i; }); (a.registros||[]).forEach(function(r0){ if(r0.excluido){ fora[r0.id] = 1; return; } var x = Object.assign({}, r0, {st:estadoAtual(r0.st), mod:r0.mod==="Misto" ? "Normal" : r0.mod}); if(ixS[x.id]===undefined){ ixS[x.id] = ndS.length; ndS.push(x); } else ndS[ixS[x.id]] = x; }); if(Object.keys(fora).length) ndS = ndS.filter(function(x){ return !fora[x.id]; }); return Object.assign({}, s, {dados:ndS}); }
    // Configurador guardado no servidor (kndados › cfg): o mesmo para todo mundo (antes ficava só no navegador de cada pessoa)
    case "CFG_SERVIDOR": return Object.assign({}, s, {cfg:a.cfg});
    case "SEGURAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || !aberto(c) || c.st==="entregue") return s;
      return com(s, {dados:mapC(s, a.id, function(x){ var p = a.on ? {ap:true, apEm:hojeISO()} : {ap:false, apEm:null}; return Object.assign(p, reg(x, s, a.on ? "Aguardando peça" : "Saiu de Aguardando peça")); })}, c.nome+(a.on ? " ficou em Aguardando peça" : " voltou para "+etapaDe(c).nome.toLowerCase()), a.on ? "atencao" : undefined);
    }
    case "AVANCAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || !aberto(c)) return s;
      var prox = ETAPAS[etapaDe(c).n]; if(!prox) return s;
      var data = a.data || hojeISO(), extra = a.extra || {};
      return com(s, {dados:mapC(s, a.id, function(x){ var p = Object.assign({st:prox.k, ap:false, apEm:null}, extra); p[prox.campo] = data;
        return Object.assign(p, reg(x, s, "Avan\u00e7ou para "+prox.nome+(extra.retirada?", retirada "+extra.retirada:""))); }), dialogo:null}, c.nome+" agora est\u00e1 "+prox.nome.toLowerCase());
    }
    case "VOLTAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); var et = etapaDe(c); if(!c || !et || et.n<=1) return s;
      var ant = ETAPAS[et.n-2];
      return com(s, {dados:mapC(s, a.id, function(x){ var p = {st:ant.k, ap:false, apEm:null}; p[et.campo] = null; return Object.assign(p, reg(x, s, "Voltou para "+ant.nome+": "+a.motivo)); }), dialogo:null}, c.nome+" voltou para "+ant.nome.toLowerCase(), "atencao");
    }
    case "CANCELAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c) return s;
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({st:"cancelado", stAnterior:x.st, ap:false, apEm:null, ret:hojeISO(), obs:(x.obs?x.obs+" | ":"")+"Cancelado: "+a.motivo}, reg(x, s, "Cancelado: "+a.motivo)); }), dialogo:null}, c.nome+" cancelada", "atencao");
    }
    case "REATIVAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || c.st!=="cancelado") return s;
      // como no admin antigo: volta para a etapa de antes; se era Solicitado, volta para Liberado (o kit saiu do app da representante e precisa ser direcionado de novo)
      return com(s, {dados:mapC(s, a.id, function(x){ var volta = x.stAnterior==="solicitado" ? "liberado" : (x.stAnterior||"liberado"), p = {st:volta, stAnterior:null, ret:null, obs:String(x.obs||"").replace(/\s*\|?\s*Cancelado: [^|]*$/, "").trim()}; if(volta==="liberado" && x.stAnterior==="solicitado"){ p.sol = null; p.rep = ""; }
        return Object.assign(p, reg(x, s, "Reativada"+(volta!==x.stAnterior ? " (volta para Liberado: direcione a representante de novo)" : ""))); }), dialogo:null}, c.nome+" reativada");
    }
    case "SALVAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c) return s;
      var mud = Object.keys(a.campos).filter(function(k){return a.campos[k]!==c[k];});
      if(!mud.length) return com(s, {dialogo:null});
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({}, a.campos, reg(x, s, "Editou: "+mud.join(", "))); }), dialogo:null}, "Altera\u00e7\u00f5es salvas");
    }
    case "NOVA": {
      // entra em Cadastrada (como no admin antigo e como chega da Kommo); telefone e endereço da casa vão para o app da representante
      var d = a.dados, obsN = comMarca(comMarca(d.obs||"", "EXPOSITOR", !!d.expositor), "FALTA LIGAR", !!d.faltaLigar);
      var n = {id:"N"+Date.now(), mes:MESES[new Date().getMonth()], cad:hojeISO(), lib:null, sol:null, bip:null, ret:null, st:"cadastrada",
        nome:d.nome.trim(), cid:d.cid||"", bai:d.bai||"", end:d.end||"", tel:String(d.tel||"").replace(/\D/g, ""), prof:d.prof||"", rep:d.vemEmpresa ? "Sorelly" : (d.rep||""), mod:d.mod||"Normal", val:d.val||s.cfg.valorPadrao, retirada:"", trab:d.trab||"", trabEnd:d.trabEnd||"",
        disp:d.disp||"", obs:obsN, c1:false, c2:false, c3:false, c1n:d.c1n||"", c1t:d.c1t||"", c1r:d.c1r||"", c2n:"", c2t:"", c2r:"", c3n:"", c3t:"", c3r:"",
        tipo:d.tipo||"Vendedora", op:quem(s), ent:d.ent||"", entId:d.entId||"", obs2:d.obs2||"", desm:0,
        hist:[{em:Date.now(), quem:quem(s), txt:"Cadastrada no sistema"}]};
      return com(s, {dados:[n].concat(s.dados), dialogo:null}, n.nome+" cadastrada");
    }
    // Representante recusou a revendedora (WhatsApp): tira a representante e mantém a etapa; a recusa em si é gravada pelo diálogo (lib/bridge-montagem)
    case "RECUSOU": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || !c.rep) return s;
      // a recusa fica no próprio kit (recs) para contar no bloqueio de todo mundo (servidor), além da avaliação da representante (montagem)
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({rep:"", recs:(x.recs||[]).concat([{rep:c.rep, iso:hojeISO(), motivo:a.motivo, via:"WhatsApp"}])}, reg(x, s, c.rep+" recusou a revendedora: "+a.motivo)); }), dialogo:null},
        c.rep+" recusou "+c.nome+(a.bloqueou ? ". Com "+a.total+" recusas, a representante fica bloqueada para novos kits" : a.registrada===false ? ". Recusa não registrada na avaliação (abra o app de montagem uma vez)" : ". Recusa registrada"), a.bloqueou||a.registrada===false ? "alerta" : "atencao");
    }
    case "DESMARCOU": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c) return s;
      var n = (c.desm||0)+1, ok = n>=s.cfg.maxDesmarcacoes;
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({desm:n}, reg(x, s, n+"\u00aa desmarca\u00e7\u00e3o com a representante"+(a.obs?": "+a.obs:""))); })},
        ok ? n+" desmarca\u00e7\u00f5es: pode cancelar" : n+"\u00aa desmarca\u00e7\u00e3o registrada", ok?"alerta":"atencao");
    }
    // excluir: s\u00f3 a Diretoria (conta ADMIN), como no admin antigo. A tela grava a marca no servidor (lib/sync-servidor.js \u203a excluirNoServidor)
    case "EXCLUIR": if(!ehAdmin() && s.usuario!=="nickolas") return com(s, {}, "S\u00f3 a Diretoria pode excluir", "alerta");
      return com(s, {dados:s.dados.filter(function(x){return x.id!==a.id;}), dialogo:null}, "Registro exclu\u00eddo", "atencao");
    case "CFG": { var cfg = JSON.parse(JSON.stringify(s.cfg)); if(a.prazo) cfg.prazos[a.prazo]=a.valor; else if(a.campanha) cfg.campanhas[a.campanha]=a.valor; else if(a.lista) cfg[a.lista]=a.valor; else cfg[a.campo]=a.valor; return com(s, {cfg:cfg}); }
    // bloqueio da representante para novos kits (Configurador), como no admin antigo: "bloquear" força o bloqueio; "desbloquear" zera a contagem de recusas
    // (conta só as de hoje em diante) e devolve para a regra automática
    case "REP_BLOQ": { var cfgB = JSON.parse(JSON.stringify(s.cfg)), rb = cfgB.repBloq || (cfgB.repBloq = {});
      rb[a.nome] = a.modo==="bloquear" ? {bloq:true, desde:(rb[a.nome]||{}).desde || ""} : {bloq:null, desde:hojeISO()};
      return com(s, {cfg:cfgB}, a.modo==="bloquear" ? a.nome+" bloqueada para novos kits" : a.nome+" desbloqueada, recusas zeradas"); }
    case "RESET": try{ localStorage.removeItem(CHAVE); }catch(x){} return com(novo(), {}, "Planilha original recarregada");
    default: return s;
  }
}

export { reducer };
