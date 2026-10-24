// Sorelly Admin · montagem — domain/base-revendedoras.js
// PLANILHA MÃE das revendedoras (23/10/2026): UMA linha por revendedora, juntando o que o sistema já sabe dela em cada lugar
// (Kits novos, aprovadas do Cadastro, Atendimento interno e listagens das representantes). A chave é o nome sem acento nem maiúscula.
// Hoje só entra quem já passou por uma dessas telas; a base completa (cerca de 2 mil) chega quando o sistema ligar com a DevMaster. Nada é gravado aqui: é só leitura.
import { ETAPA } from "@/apps/kits-novos/domain/etapas";
import { bairroDe } from "@/apps/montagem/domain/entrada-kits-novos";

var CHAVE_KN = "sorelly_kits_novos_curitiba_v2";
var chave = function(n){ return String(n||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
function lerKitsNovos(){ try{ var s = JSON.parse(localStorage.getItem(CHAVE_KN)||"null"); return (s && s.dados) || []; }catch(x){ return []; } }
var dia = function(iso){ return iso ? String(iso).slice(0, 10) : ""; };

function baseRevendedoras(s){
  var m = {};
  var linha = function(nome){ var k = chave(nome); if(!k) return null; return m[k] || (m[k] = {chave:k, nome:String(nome).trim(), canal:"", rep:"", cidade:"", bairro:"", prof:"", tel:"", situacao:"", desde:"", ultimo:"", kit:"", fontes:[]}); };
  var junta = function(r, d, fonte){ if(!r) return; Object.keys(d).forEach(function(k){ if(d[k] && !r[k]) r[k] = d[k]; }); if(r.fontes.indexOf(fonte)<0) r.fontes.push(fonte); };

  // 1) Atendimento interno: vêm à Sorelly (canal "Atendimento interno")
  (s.revInternas||[]).forEach(function(r){
    var ult = (r.hist||[]).find(function(h){ return h && h.data; });
    junta(linha(r.nome), {canal:"Atendimento interno", tel:(r.contatos&&r.contatos[0]&&r.contatos[0].fone)||"", situacao:"Ciclo de "+(r.ciclo||30)+" dias", ultimo:ult ? ult.data : "", kit:r.prata ? "100% Prata" : "Padrão"}, "Atendimento interno");
  });
  // 2) Listagens das representantes: revendedora com kit na listagem de uma representante
  var repDe = {}; (s.listagens||[]).forEach(function(l){ repDe[l.id] = l.rep; });
  (s.kits||[]).forEach(function(k){
    junta(linha(k.rev), {canal:"Representante", rep:repDe[k.lid]||"", bairro:k.bairro||"", cidade:/Curitiba/i.test(k.endereco||"") ? "Curitiba" : "", situacao:"Em listagem", kit:k.valor ? "R$ "+Number(k.valor).toLocaleString("pt-BR") : ""}, "Listagens");
  });
  // 3) Kits novos (estado do app Kits novos, neste navegador)
  lerKitsNovos().forEach(function(c){
    junta(linha(c.nome), {canal:"Kit novo", rep:c.rep, cidade:c.cid, bairro:c.bai, prof:c.prof, tel:c.tel, situacao:c.st==="cancelado" ? "Kit novo cancelado" : "Kit novo: "+((ETAPA[c.st]||{}).nome||c.st), desde:c.cad, kit:c.val ? "R$ "+Number(c.val).toLocaleString("pt-BR") : ""}, "Kits novos");
  });
  // 4) Aprovadas no Cadastro que ainda não entraram nas outras telas
  ((s.cl && s.cl.leads)||[]).filter(function(l){ return l.reviewStatus==="APPROVED"; }).forEach(function(l){
    junta(linha(l.nome), {canal:"Kit novo", cidade:l.cidade, bairro:bairroDe(l.endereco), prof:l.profissao, tel:l.telefone, situacao:"Aprovada no Cadastro", desde:dia(l.reviewedAt)}, "Cadastro");
  });
  return Object.keys(m).map(function(k){ return m[k]; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
}

export { baseRevendedoras };
