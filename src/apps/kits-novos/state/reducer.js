// Sorelly Admin · kits novos Curitiba — state/reducer.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { ETAPAS, aberto, etapaDe } from "@/apps/kits-novos/domain/etapas";
import { MESES, hojeISO } from "@/apps/kits-novos/lib/datas";
import { CHAVE, com, mapC, novo, quem, reg } from "@/apps/kits-novos/state/store";

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
    case "AVISO": return com(s, {}, a.txt, "atencao");
    case "LIMPAR_AVISO": return com(s, {aviso:null});
    case "AVANCAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || !aberto(c)) return s;
      var prox = ETAPAS[etapaDe(c).n]; if(!prox) return s;
      var data = a.data || hojeISO(), extra = a.extra || {};
      return com(s, {dados:mapC(s, a.id, function(x){ var p = Object.assign({st:prox.k}, extra); p[prox.campo] = data;
        return Object.assign(p, reg(x, s, "Avan\u00e7ou para "+prox.nome+(extra.retirada?", retirada "+extra.retirada:""))); }), dialogo:null}, c.nome+" agora est\u00e1 "+prox.nome.toLowerCase());
    }
    case "VOLTAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); var et = etapaDe(c); if(!c || !et || et.n<=1) return s;
      var ant = ETAPAS[et.n-2];
      return com(s, {dados:mapC(s, a.id, function(x){ var p = {st:ant.k}; p[et.campo] = null; return Object.assign(p, reg(x, s, "Voltou para "+ant.nome+": "+a.motivo)); }), dialogo:null}, c.nome+" voltou para "+ant.nome.toLowerCase(), "atencao");
    }
    case "CANCELAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c) return s;
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({st:"cancelado", stAnterior:x.st, ret:hojeISO(), obs:(x.obs?x.obs+" | ":"")+"Cancelado: "+a.motivo}, reg(x, s, "Cancelado: "+a.motivo)); }), dialogo:null}, c.nome+" cancelada", "atencao");
    }
    case "REATIVAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || c.st!=="cancelado") return s;
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({st:x.stAnterior||"cadastrada", ret:null}, reg(x, s, "Reativada")); }), dialogo:null}, c.nome+" reativada");
    }
    case "SALVAR": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c) return s;
      var mud = Object.keys(a.campos).filter(function(k){return a.campos[k]!==c[k];});
      if(!mud.length) return com(s, {dialogo:null});
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({}, a.campos, reg(x, s, "Editou: "+mud.join(", "))); }), dialogo:null}, "Altera\u00e7\u00f5es salvas");
    }
    case "NOVA": {
      var d = a.dados, n = {id:"N"+Date.now(), mes:MESES[new Date().getMonth()], cad:hojeISO(), lib:null, sol:null, bip:null, ret:null, st:"cadastrada",
        nome:d.nome.trim(), cid:d.cid||"", bai:d.bai||"", rep:d.rep||"", mod:d.mod||"Misto", val:d.val||s.cfg.valorPadrao, retirada:"", trab:d.trab||"", trabEnd:d.trabEnd||"",
        disp:d.disp||"", obs:d.obs||"", c1:false, c2:false, c3:false, c1n:d.c1n||"", c1t:d.c1t||"", c1r:d.c1r||"", c2n:"", c2t:"", c2r:"", c3n:"", c3t:"", c3r:"",
        tipo:d.tipo||"Vendedora", op:quem(s), ent:d.ent||"", entId:"", obs2:d.obs2||"", desm:0,
        hist:[{em:Date.now(), quem:quem(s), txt:"Cadastrada no sistema"}]};
      return com(s, {dados:[n].concat(s.dados), dialogo:null}, n.nome+" cadastrada");
    }
    // Representante recusou a revendedora (WhatsApp): tira a representante e mantém a etapa; a recusa em si é gravada pelo diálogo (lib/bridge-montagem)
    case "RECUSOU": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c || !c.rep) return s;
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({rep:""}, reg(x, s, c.rep+" recusou a revendedora: "+a.motivo)); }), dialogo:null},
        c.rep+" recusou "+c.nome+(a.bloqueou ? ". Com "+a.total+" recusas, a representante fica bloqueada para novos kits" : a.registrada===false ? ". Recusa não registrada na avaliação (abra o app de montagem uma vez)" : ". Recusa registrada"), a.bloqueou||a.registrada===false ? "alerta" : "atencao");
    }
    case "DESMARCOU": {
      c = s.dados.find(function(x){return x.id===a.id;}); if(!c) return s;
      var n = (c.desm||0)+1, ok = n>=s.cfg.maxDesmarcacoes;
      return com(s, {dados:mapC(s, a.id, function(x){ return Object.assign({desm:n}, reg(x, s, n+"\u00aa desmarca\u00e7\u00e3o com a representante"+(a.obs?": "+a.obs:""))); })},
        ok ? n+" desmarca\u00e7\u00f5es: pode cancelar" : n+"\u00aa desmarca\u00e7\u00e3o registrada", ok?"alerta":"atencao");
    }
    case "EXCLUIR": if(s.usuario!=="nickolas") return com(s, {}, "S\u00f3 o Nickolas pode excluir", "alerta");
      return com(s, {dados:s.dados.filter(function(x){return x.id!==a.id;}), dialogo:null}, "Registro exclu\u00eddo", "atencao");
    case "CFG": { var cfg = JSON.parse(JSON.stringify(s.cfg)); if(a.prazo) cfg.prazos[a.prazo]=a.valor; else if(a.campanha) cfg.campanhas[a.campanha]=a.valor; else if(a.lista) cfg[a.lista]=a.valor; else cfg[a.campo]=a.valor; return com(s, {cfg:cfg}); }
    case "RESET": try{ localStorage.removeItem(CHAVE); }catch(x){} return com(novo(), {}, "Planilha original recarregada");
    default: return s;
  }
}

export { reducer };
