// Sorelly Admin · montagem — domain/clientes-rev.js
// Clientes da revendedora (app de celular). Fonte ÚNICA: a venda (mobile/catalogo-rev.js) e a tela Clientes leem e gravam aqui.
// Guardadas só neste navegador (chave sorelly_rev_clientes, formato {id, nome, fone}); o cadastro de verdade vem com o servidor.
import { CLIENTES_TESTE } from "@/apps/montagem/domain/catalogo-rev";

var CHAVE_CLIENTES = "sorelly_rev_clientes";
var digitos = function(t){ return String(t==null ? "" : t).replace(/\D/g, ""); };
function lerClientes(){ try { var v = JSON.parse(localStorage.getItem(CHAVE_CLIENTES) || "null"); return Array.isArray(v) && v.length ? v : CLIENTES_TESTE.slice(); } catch(x){ return CLIENTES_TESTE.slice(); } }
function gravarClientes(l){ try { localStorage.setItem(CHAVE_CLIENTES, JSON.stringify(l)); } catch(x){} }
// valida nome e WhatsApp; devolve o texto do erro ou null
function validarCliente(d){ if(!String(d.nome||"").trim()) return "Informe o nome."; var n = digitos(d.fone).length; if(n && n<10) return "WhatsApp incompleto (com DDD)."; return null; }
function adicionar(d){ var c = {id:"c"+Date.now().toString(36)+Math.random().toString(36).slice(2, 5), nome:String(d.nome).trim(), fone:String(d.fone||"").trim()}; var l = lerClientes().concat([c]); gravarClientes(l); return l; }
function editar(id, d){ var l = lerClientes().map(function(c){ return c.id===id ? Object.assign({}, c, {nome:String(d.nome).trim(), fone:String(d.fone||"").trim()}) : c; }); gravarClientes(l); return l; }
function excluir(id){ var l = lerClientes().filter(function(c){ return c.id!==id; }); gravarClientes(l); return l; }
// link do WhatsApp (só abre a conversa; nada é enviado sozinho). Texto opcional já preenchido.
function linkWhats(fone, texto){ var d = digitos(fone); if(d.length<10) return null; var n = d.slice(0,2)==="55" && d.length>=12 ? d : "55"+d; return "https://wa.me/"+n+(texto ? "?text="+encodeURIComponent(texto) : ""); }
function formatarFone(t){ var d = digitos(t); if(d.slice(0,2)==="55" && d.length>=12) d = d.slice(2); if(d.length===11) return "("+d.slice(0,2)+") "+d.slice(2,7)+"-"+d.slice(7); if(d.length===10) return "("+d.slice(0,2)+") "+d.slice(2,6)+"-"+d.slice(6); return String(t||""); }
export { CHAVE_CLIENTES, lerClientes, gravarClientes, validarCliente, adicionar, editar, excluir, linkWhats, formatarFone };
