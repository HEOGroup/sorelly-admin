// Sorelly Admin · montagem — domain/seguranca-docs.js
// PGR e PCMSO por CNPJ (17/11/2026, pedido da Maria (RH) e do Marcus: "cada funcionário, por CNPJ, acessa a página somente com os documentos do seu CNPJ").
// Dois documentos por CNPJ: PGR (programa de gerenciamento de riscos) e PCMSO (controle médico de saúde ocupacional). Quem anexa e troca: RH e diretoria (autorização sg_gerir).
// Estado s.sg = {v, docs:{"<cnpj>|PGR": {key, nome, mime, tam, em, por}}}. O arquivo fica no servidor (/api/anexos, módulo sg); o estado guarda só a chave.
// Não é aconselhamento jurídico: o que cada CNPJ precisa o técnico de Segurança do Trabalho e o contador confirmam.
import { CNPJS0 } from "@/apps/montagem/domain/cnpjs";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { funcionarios } from "@/apps/montagem/domain/pessoas";

var TIPOS_SG = ["PGR", "PCMSO"];
var CNPJS_SG = ["34", "46", "59", "67"];   // Sorelly, Mayz, Serenity e Axis
var NOME_TIPO = {PGR:"Programa de gerenciamento de riscos", PCMSO:"Controle médico de saúde ocupacional"};
var chaveDoc = function(cnpj, tipo){ return cnpj+"|"+tipo; };
var sem = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " "); };
var agoraSP = function(){ return new Intl.DateTimeFormat("sv-SE", {timeZone:"America/Sao_Paulo", dateStyle:"short", timeStyle:"medium"}).format(new Date()).replace(" ", "T"); };
var empresaDe = function(cnpj){ var c = CNPJS0.find(function(x){ return x.id===cnpj; }); return c ? {id:c.id, nome:c.nome, razao:c.razao, cnpj:c.cnpj} : {id:cnpj, nome:"CNPJ "+cnpj, razao:"", cnpj:""}; };

function sgMigrar(g){
  var o = (g && typeof g==="object") ? JSON.parse(JSON.stringify(g)) : {v:1, docs:{}};
  o.v = o.v || 1; o.docs = o.docs && typeof o.docs==="object" ? o.docs : {};
  return o;
}

// de qual CNPJ é a pessoa logada: o nome curto do sistema ("Natalia") tem de bater com o começo de UM só nome completo da lista de funcionários.
// Devolve "34" | "46" | "59" | "67" ou "" quando não dá para ter certeza (aí a tela pede para falar com o RH).
var ALIAS_NOME = {"sthefany":"sthafany", "rakieli":"rakiely"};   // o nome curto do sistema escreve diferente da lista de funcionários
function cnpjDaPessoa(id){
  var nome = sem(nomeDe(id)); if(!nome || nome==="—") return ""; nome = ALIAS_NOME[nome] || nome;
  var achou = funcionarios().filter(function(f){ var n = sem(f.nome); return n===nome || n.indexOf(nome+" ")===0; });
  var cnpjs = achou.map(function(f){ return String(f.cnpj || ""); }).filter(function(c, i, a){ return c && a.indexOf(c)===i; });
  return achou.length>=1 && cnpjs.length===1 && CNPJS_SG.indexOf(cnpjs[0])>=0 ? cnpjs[0] : "";
}

// ação SG: {op:"doc_set", cnpj, tipo, anexo:{key, nome, mime, tam}} · {op:"doc_del", cnpj, tipo}. a.podeGerir vem da tela (autorização sg_gerir); o servidor também confere o módulo.
function sgReduz(s, a){
  var g = sgMigrar(s.sg), por = a.por || "—", recusa = function(t){ return {patch:{}, msg:t}; };
  if(!a.podeGerir) return recusa("Só o RH e a diretoria anexam ou tiram estes documentos.");
  if(CNPJS_SG.indexOf(a.cnpj)<0 || TIPOS_SG.indexOf(a.tipo)<0) return recusa("Escolha o CNPJ e o documento.");
  var k = chaveDoc(a.cnpj, a.tipo);
  if(a.op==="doc_set"){
    if(!a.anexo || !a.anexo.key) return recusa("Arquivo inválido.");
    g.docs[k] = {key:a.anexo.key, nome:String(a.anexo.nome || a.tipo), mime:a.anexo.mime || "", tam:a.anexo.tam || 0, em:agoraSP(), por:por};
    return {patch:{sg:g}, msg:a.tipo+" anexado"};
  }
  if(a.op==="doc_del"){ delete g.docs[k]; return {patch:{sg:g}, msg:a.tipo+" retirado"}; }
  return recusa("Ação desconhecida.");
}

export { TIPOS_SG, CNPJS_SG, NOME_TIPO, chaveDoc, empresaDe, sgMigrar, cnpjDaPessoa, sgReduz };
