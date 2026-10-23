// Sorelly Admin · montagem — domain/garantia.js
// Garantia, trazido do SorellyAdmin (docs/modulos/garantia.md). NO ORIGINAL NÃO EXISTE MÓDULO: é só um atalho do menu para o site externo de garantias (Garantify).
// O Admin de produção não guarda nada de garantia (sem tela, tabela, rota ou setor). Por isso aqui também só existe o mínimo honesto:
//   estado s.ga = {v, link, novaAba, restritoDiretoria, historico}  (nada de garantias dentro do sistema; nenhuma regra inventada)
// Regras do original: link único, sempre abre em nova aba, visível só para a diretoria (ou admin). Se trocar de fornecedor, só muda o link.
// Dados nascem como o padrão; se existir domain/garantia.local.js (gitignored), ele pode trocar o link: export default {link:"https://..."}
// Datas ISO no fuso America/Sao_Paulo.

import { agoraSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = import.meta.glob("./garantia.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var LINK_PADRAO = "https://sorellyjoias.garantify.com.br";   // GARANTIA_HREF do original
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };

// ---------- leitura (para a tela / menu) ----------
// link do atalho
function gaLink(s){ return (s && s.ga && s.ga.link) || LINK_PADRAO; }
// abre sempre em nova aba (rel noopener noreferrer fica por conta da tela)
function gaAbreEmNovaAba(s){ return !(s && s.ga) || s.ga.novaAba!==false; }
// só quem é da diretoria (ou admin) vê o atalho; ter um setor qualquer não basta. A tela passa os dois sinais já calculados
function gaPodeVer(s, ehDiretoria, ehAdmin){ var restrito = !(s && s.ga) || s.ga.restritoDiretoria!==false; return restrito ? !!(ehDiretoria || ehAdmin) : true; }
// o link é válido? (só http/https; o original só aceitava link externo)
function gaLinkValido(t){ return /^https?:\/\/[^\s/]+\.[^\s/]+/i.test(trim(t)); }
// o que o original afirma (para mostrar na tela do atalho, sem inventar nada)
function gaResumo(s){ return {link:gaLink(s), novaAba:gaAbreEmNovaAba(s), rotulo:"Garantia", subtitulo:"Site externo", guardaDados:false, historico:(s && s.ga && s.ga.historico) || []}; }

// ---------- estado ----------
function gaDemo(){
  var s = {v:1, link:LINK_PADRAO, novaAba:true, restritoDiretoria:true, historico:[]};
  if(LOCAL && gaLinkValido(LOCAL.link)) s.link = trim(LOCAL.link);
  return s;
}
function gaMigrar(ga){
  if(!ga) return gaDemo(); var base = gaDemo();
  Object.keys(base).forEach(function(k){ if(ga[k]===undefined) ga[k] = clone(base[k]); });
  return ga;
}

// ---------- operações ----------
// a.op: "link_set" {link}  ·  "nova_aba_set" {valor}  ·  "restrito_set" {valor}
function gaReduz(s, a){
  var ga = clone(gaMigrar(s.ga)), por = a.por||"—", agora = a.agora||agoraSP(), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{ga:ga}, msg:msg}; };
  switch(a.op){
    case "link_set": {
      var l = trim(a.link); if(!gaLinkValido(l)) return recusa("Informe um link completo (começando com https://).");
      if(l===ga.link) return recusa("O link já é esse.");
      ga.historico.push({em:agora, por:por, de:ga.link, para:l}); ga.link = l; return ok("Link da Garantia atualizado");
    }
    case "nova_aba_set": ga.novaAba = !!a.valor; return ok(ga.novaAba ? "O atalho abre em nova aba" : "O atalho abre na mesma aba");
    case "restrito_set": ga.restritoDiretoria = !!a.valor; return ok(ga.restritoDiretoria ? "Atalho só para a diretoria" : "Atalho liberado para todos");
    default: return recusa("Operação de Garantia desconhecida.");
  }
}

export { gaDemo, gaMigrar, gaReduz, gaLink, gaAbreEmNovaAba, gaPodeVer, gaLinkValido, gaResumo, LINK_PADRAO };
