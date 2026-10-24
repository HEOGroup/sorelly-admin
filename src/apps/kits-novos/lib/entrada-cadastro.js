// Sorelly Admin · kits novos Curitiba — lib/entrada-cadastro.js
// FLUXO CONTÍNUO Cadastro → Kits novos (23/10/2026): a coluna CADASTRADAS do quadro de Aprovação de cadastros (montagem › s.cl) é a mesma coluna Cadastrada da Michele.
// Todo cadastro aprovado que chegou em Cadastradas aparece aqui sozinho (uma vez só, id "L<número>"). Se o Cadastro desfaz a decisão antes de a Michele mexer, o cartão sai daqui.
// Lê o estado do app de montagem direto do navegador (sem servidor ainda). Só LÊ; o que a Michele faz fica no estado de Kits novos.
import { bairroDe } from "@/apps/montagem/domain/entrada-kits-novos";
import { kitNaEmpresa, valorDoKit } from "@/apps/montagem/domain/cadastro-leads";
import { MESES, diasDesde, hojeISO } from "@/apps/kits-novos/lib/datas";

var CHAVE_MONTAGEM = "sorelly_montagem_v9";
function leadsCadastradas(){
  try { var s = JSON.parse(localStorage.getItem(CHAVE_MONTAGEM)||"null"); return ((s && s.cl && s.cl.leads) || []).filter(function(l){ return l.reviewStatus==="APPROVED" && l.desempenho==="cadastradas"; }); }
  catch(x){ return []; }
}

function registroDe(l, cfg){
  var dia = String(l.etapaCriadaEm || l.reviewedAt || l.criadoEm || "").slice(0, 10), cad = dia && diasDesde(dia)<=3 ? dia : hojeISO();   // cadastro antigo "entra" hoje no fluxo da Michele
  var empresa = kitNaEmpresa(l.kitOpcao), exp = /expositor$/.test(l.kitOpcao||"");
  return {id:"L"+l.id, mes:MESES[+cad.split("-")[1]-1], cad:cad, lib:null, sol:null, bip:null, ret:null, st:"cadastrada",
    nome:l.nome, cid:l.cidade||"", bai:bairroDe(l.endereco), prof:l.profissao||"", rep:empresa ? "Sorelly" : "", mod:"Misto", val:valorDoKit(l.kitOpcao, l.kitValorCasa, l.kitValorEmpresa) || cfg.valorPadrao, retirada:"",
    trab:l.empresa||"", trabEnd:"", disp:"", obs:exp ? "EXPOSITOR" : "", c1:false, c2:false, c3:false, c1n:"", c1t:"", c1r:"", c2n:"", c2t:"", c2r:"", c3n:"", c3t:"", c3r:"",
    tel:l.telefone||"", tipo:"Vendedora", op:l.reviewedBy||"Cadastro", ent:"Kommo", entId:"", obs2:"", desm:0,
    hist:[{em:Date.now(), quem:l.reviewedBy||"Cadastro", txt:"Chegou em Cadastradas no quadro do Cadastro (lead "+l.id+")"}]};
}

function absorver(s){
  if(typeof localStorage==="undefined") return s;
  var leads = leadsCadastradas(), noCadastro = {}; leads.forEach(function(l){ noCadastro["L"+l.id] = 1; });
  var tem = {}; s.dados.forEach(function(c){ tem[c.id] = 1; });
  var novos = leads.filter(function(l){ return !tem["L"+l.id]; }).map(function(l){ return registroDe(l, s.cfg); });
  // o Cadastro desfez e a Michele ainda não mexeu (continua em Cadastrada, sem histórico dela): sai daqui
  var dados = s.dados.filter(function(c){ return !(/^L\d+$/.test(c.id) && c.st==="cadastrada" && !noCadastro[c.id] && (c.hist||[]).length<=1); });
  if(!novos.length && dados.length===s.dados.length) return s;
  return Object.assign({}, s, {dados:novos.concat(dados)});
}

// (a fila antiga deixou de existir; mantido só para não quebrar quem ainda chama)
function limpar(){}

export { absorver, limpar };
