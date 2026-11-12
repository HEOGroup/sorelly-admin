import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/modelas.js
// Marketing › Modelos (criada em 11/11/2026 nas Encomendas; passou para o Marketing em 12/11/2026, pedido do Marcus): cadastro PARTICULAR das modelos para quem o Marcus manda joias.
// Cada modelo tem foto, rede social, telefone, endereço, valor de joias liberado por mês, data do último envio e situação.
// Abrem só Marcus e Castilho (autorização `modelos_ver`; no servidor o módulo "mod" é do Marketing e da Diretoria). Estado s.mod (módulo "mod" no servidor). Nasce VAZIO (repositório é público).
// Dados reais só em domain/modelas.local.js (gitignored): export default [{id, nome, insta, tel, endereco, valor, ultimoEnvio, situacao, foto}].
// Formato de s.mod: {v, seq, apagadas:[ids excluídos de propósito], itens:[{id, nome, insta, tel, endereco, valor, ultimoEnvio:"2026-11-10"|"", grupo:"Sorelly"|"Marcus"|"Influencers", naEmpresa:"2026-11-27"|"", link, meta, trouxe, premio, situacao, foto:"data:image/...", por, em}]}
// Influencers (ideia do Nickolas, 11/11/2026): cada uma recebe um LINK para postar com as joias; trouxe = revendedoras que se cadastraram por ele; meta = quantas precisa trazer; premio = o que ganha ao bater a meta. Por enquanto lançados à mão; depois o cadastro de revendedoras conta sozinho.
// Suposição a confirmar: "Liberado por mês" é o teto de joias que ela pode pegar no mês; ainda não há controle do quanto já pegou.

import { agoraSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/modelas.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

// Grupo (11/11/2026): Sorelly = modelos da Sorelly (fazem conteúdo, têm negociação e data para ir na empresa); Marcus = amigas do Marcus; Influencers = só enviamos kits.
var GRUPOS = ["Sorelly", "Marcus", "Influencers"];
var SITUACOES_POR_GRUPO = {Sorelly:["Negociação a confirmar", "Negociação confirmada", "Agendada na empresa", "Visitou a empresa", "Em pausa"], Marcus:["Cadastrada", "Ativa", "Enviada", "Em pausa"], Influencers:["Cadastrada", "Kit enviado", "Postou", "Em pausa"]};
var situacoesDe = function(grupo){ return SITUACOES_POR_GRUPO[grupo] || SITUACOES_POR_GRUPO.Marcus; };
// ID no app (etapa 2, 12/11/2026): o id da influencer no app da Sorelly. Com ele o link sai pronto e o sistema conta sozinho quantas revendedoras ela trouxe.
var FORM_BASE = "https://forms.sorellyjoias.com.br";   // mesmo valor padrão de INDICACOES_FORM_BASE_URL no app
var linkDe = function(m){ return m && m.idApp>0 ? FORM_BASE+"/?id="+m.idApp : (m && m.link) || ""; };
var inteiro = function(v){ var n = Math.floor(Number(v)); return isFinite(n) && n>0 ? n : 0; };
var num = function(v){ var n = Number(v); return isFinite(n) && n>0 ? Math.round(n*100)/100 : 0; };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var limpaInsta = function(v){ return trim(v).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, ""); };

function modMigrar(m){
  var out = (m && typeof m==="object") ? clone(m) : {v:1, seq:0, itens:(Array.isArray(LOCAL) ? clone(LOCAL) : [])};
  out.v = out.v || 1; out.seq = out.seq || 0; out.itens = Array.isArray(out.itens) ? out.itens : [];
  // dados reais locais (modelas.local.js): quem está no arquivo e sumiu do estado volta, a não ser que o Marcus a tenha EXCLUÍDA de propósito (apagadas).
  // Assim uma gravação de outra janela com lista velha não apaga ninguém de vez (12/11/2026: Letycia e Julhia sumiram do servidor).
  if(!Array.isArray(out.apagadas)) out.apagadas = [];
  delete out.semente; delete out.semeado;
  if(Array.isArray(LOCAL)) LOCAL.forEach(function(x){ if(out.apagadas.indexOf(x.id)<0 && !out.itens.some(function(y){ return y.id===x.id; })) out.itens.push(clone(x)); });
  out.itens.forEach(function(x){ if(!x.grupo) x.grupo = x.tipo==="Conteúdo" ? "Sorelly" : "Marcus"; delete x.tipo; if(x.naEmpresa===undefined) x.naEmpresa = ""; });   // antes do grupo existia o tipo (Só modelo / Conteúdo)
  return out;
}

// a = {op:"salvar", item:{id?, nome, insta, tel, endereco, valor, ultimoEnvio, situacao, foto}} · {op:"excluir", id}
function modReduz(s, a){
  var m = clone(modMigrar(s.mod)), por = a.por || "—", agora = a.agora || agoraSP();
  var recusa = function(t){ return {patch:{}, msg:t}; };
  if(a.op==="salvar"){
    var x = a.item || {}, nome = trim(x.nome);
    if(!nome) return recusa("Escreva o nome da modelo.");
    if(nome.length>80) return recusa("O nome passou de 80 letras.");
    if(x.ultimoEnvio && !/^\d{4}-\d{2}-\d{2}$/.test(x.ultimoEnvio)) return recusa("Data do último envio inválida.");
    var novo = {id:x.id || null, nome:nome, insta:limpaInsta(x.insta), tel:trim(x.tel), endereco:trim(x.endereco), valor:num(x.valor), ultimoEnvio:x.ultimoEnvio || "", grupo:GRUPOS.indexOf(x.grupo)>=0 ? x.grupo : GRUPOS[0], naEmpresa:x.naEmpresa || "", situacao:null, idApp:inteiro(x.idApp), link:trim(x.link), meta:inteiro(x.meta), trouxe:inteiro(x.trouxe), premio:trim(x.premio), foto:x.foto || "", por:por, em:agora};
    if(novo.naEmpresa && !/^\d{4}-\d{2}-\d{2}$/.test(novo.naEmpresa)) return recusa("Data de ida na empresa inválida.");
    novo.situacao = situacoesDe(novo.grupo).indexOf(x.situacao)>=0 ? x.situacao : situacoesDe(novo.grupo)[0];
    var i = novo.id ? m.itens.findIndex(function(t){ return t.id===novo.id; }) : -1;
    if(i===-1){ m.seq += 1; novo.id = "m"+(Date.now().toString(36))+m.seq; m.itens.push(novo); return {patch:{mod:m}, msg:"Modelo cadastrada"}; }
    m.itens[i] = novo; return {patch:{mod:m}, msg:"Modelo atualizada"};
  }
  if(a.op==="excluir"){
    var n0 = m.itens.length; m.itens = m.itens.filter(function(t){ return t.id!==a.id; });
    if(m.apagadas.indexOf(a.id)<0) m.apagadas.push(a.id);
    if(m.itens.length===n0) return recusa("Modelo não encontrada.");
    return {patch:{mod:m}, msg:"Modelo excluída"};
  }
  return recusa("Ação desconhecida.");
}

export { GRUPOS, situacoesDe, linkDe, FORM_BASE, modMigrar, modReduz, limpaInsta };
