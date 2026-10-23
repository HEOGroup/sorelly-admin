// Sorelly Admin · kits novos Curitiba — state/store.js
// Extraído de sorelly_admin_kits_novos_curitiba.html sem alterar o corpo das funções.
import { DADOS } from "@/apps/kits-novos/data/dados";
import { CFG0, USUARIOS } from "@/apps/kits-novos/domain/config";

var CHAVE = "sorelly_kits_novos_curitiba_v2";
function novo(){ return {v:2, cfg:JSON.parse(JSON.stringify(CFG0)), dados:DADOS.map(function(x){ return Object.assign({}, x, {hist:[]}); }),
  usuario:"michele", aba:"kits", modo:"quadro", abertos:{cadastrada:true, liberado:true, solicitado:true, bipado:true, entregue:false, cancelado:false}, filtro:{busca:"", st:"", rep:"", cid:"", mes:"", ent:"", so:""}, dialogo:null, aviso:null}; }
function inicial(){ try{ var j = localStorage.getItem(CHAVE); if(j){ var s = JSON.parse(j); if(s && s.v===2 && s.dados && s.dados.length){ s.aviso=null; s.dialogo=null; return s; } } }catch(x){} return novo(); }
function com(s, patch, txt, tom){ var n = Object.assign({}, s, patch); if(txt) n.aviso = {txt:txt, tom:tom||"ok", t:Date.now()}; return n; }
function mapC(s, id, fn){ return s.dados.map(function(c){ return c.id===id ? Object.assign({}, c, fn(c)) : c; }); }
function quem(s){ return USUARIOS.find(function(u){return u.id===s.usuario;}).nome; }
function reg(c, s, txt){ return {hist:(c.hist||[]).concat([{em:Date.now(), quem:quem(s), txt:txt}])}; }

export { CHAVE, novo, inicial, com, mapC, quem, reg };
