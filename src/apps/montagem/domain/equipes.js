import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/equipes.js
// Equipes / Departamentos (organograma), trazido do SorellyAdmin (docs/modulos/equipes.md, aba "Departamentos").
// No original o organograma é só um mapa mental: estar num departamento NÃO dá acesso a nada; o vínculo com o setor de acesso é só informativo.
// Aqui o acesso de verdade fica em RH → Acessos por setor (state.acessos); a aba "Usuários" do original (papel, senha, login) NÃO é portada.
// Estado s.eq (só neste navegador). Nasce com a ESTRUTURA dos departamentos (sem pessoas). Pessoas reais, se houver, vêm de domain/equipes.local.js (gitignored):
//   export default {departamentos:[{nome, setorAcesso, pai, pessoas:[{nome, papel:"SUPERVISOR"|"FUNCIONARIO"}]}]}   (pai = nome do departamento acima, opcional)
// As pessoas NÃO se duplicam: o membro guarda o nome em texto e, se quiser, o vínculo `pessoaId` (= slug do nome em domain/pessoas.js / RH).
// Datas ISO no fuso America/Sao_Paulo. Ações guardam `a.por` no histórico (s.eq.log).

import { hojeSP, agoraSP } from "./cadastro-leads";
import { funcionarios, FUNCIONARIOS_POR_SETOR } from "./pessoas";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/equipes.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).replace(/\s+/g, " ").trim(); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
var slug = function(t){ return norm(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
var vazio = function(v){ return v==null || v===""; };
var mesmo = function(a, b){ return String(a)===String(b); };

// ---------- vocabulário ----------
var PAPEIS = ["SUPERVISOR", "FUNCIONARIO"];
var ROTULO_PAPEL = {SUPERVISOR:"Supervisão", FUNCIONARIO:"Funcionário(a)"};
// Grupos de acesso do sistema (espelha PAPEL_LB de navigation/perfis.js; manter igual). É o "setor" que o departamento pode apontar (vínculo só informativo).
var SETORES_ACESSO = [["supervisao","Sócios (acesso total)"], ["familia","Direção e família (sem Configuradores)"], ["supervisora","Supervisão da montagem"], ["agendamento","Agendamento"],
  ["financeiro","Financeiro"], ["inadimplencia","Inadimplência"], ["bipadora","Atendimento e bipagem"], ["montadora","Montagem de kits"], ["listagens","Listagens e condicionais"],
  ["kitnovo","Kit novo"], ["cadastropecas","Cadastro de peças"], ["representante","Representantes"]];
// cor por posição do departamento de 1º nível (como no mapa mental do original)
var CORES = ["#D9A63A", "#3B82F6", "#A855F7", "#14B8A6", "#EC4899", "#F59E0B", "#22C55E", "#EF4444", "#0EA5E9", "#8B5CF6"];
// quem pode editar o organograma (original: só ADMIN). Aqui: diretoria + Anamaria (mesmos que editam Acessos). Compara pela 1ª palavra do nome.
var EDITORES_PADRAO = ["Marcus", "Nickolas", "Lucas", "Anamaria"];
var CONFIG_PADRAO = {nomeRaiz:"Sorelly", editores:EDITORES_PADRAO, nomeMax:80, logMax:300};

// ---------- estrutura inicial (do seed do original, SÓ nomes de departamento; "Verificar" ficou de fora de propósito) ----------
// [nome, setorAcesso (grupo daqui) ou null]
var SEED_DEPARTAMENTOS = [["Financeiro","financeiro"], ["Condicional","listagens"], ["Montagem de Kits","montadora"], ["Bipagem de Kits","bipadora"], ["Cadastro de Peças",null],
  ["Cadastro de Revendedoras","kitnovo"], ["Produção de Peças",null], ["Recursos Humanos",null], ["Diretoria","supervisao"], ["Marketing",null], ["Zeladoria",null],
  ["Segurança/Motorista",null], ["Link de Pagamento",null], ["Inadimplência","inadimplencia"], ["Kits Novos e Indicação","kitnovo"], ["Pós-Vendas",null], ["Encomendas",null],
  ["Trocas",null], ["Agendamento","agendamento"]];

// ---------- criação ----------
function proximoId(s){ s.seq = (s.seq||0)+1; return s.seq; }
function maiorOrdem(lista){ return lista.reduce(function(m, x){ return Math.max(m, x.ordem||0); }, -1); }
function novoDepto(s, d){
  return {id:d.id!=null ? d.id : proximoId(s), nome:trim(d.nome), ordem:d.ordem!=null ? d.ordem : maiorOrdem(s.departamentos)+1, setorAcesso:d.setorAcesso||null, paiId:d.paiId!=null ? d.paiId : null, arquivado:!!d.arquivado};
}
function novoMembro(s, d){
  return {id:d.id!=null ? d.id : proximoId(s), deptoId:d.deptoId, nome:trim(d.nome), papel:PAPEIS.indexOf(d.papel)>=0 ? d.papel : "FUNCIONARIO", pessoaId:vazio(d.pessoaId) ? null : String(d.pessoaId),
    ordem:d.ordem!=null ? d.ordem : maiorOrdem(s.membros.filter(function(m){ return mesmo(m.deptoId, d.deptoId); }))+1};
}
function eqDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), departamentos:[], membros:[], log:[]};
  if(LOCAL && (LOCAL.departamentos||[]).length){
    (LOCAL.departamentos||[]).forEach(function(d){ s.departamentos.push(novoDepto(s, {nome:d.nome, setorAcesso:setorValido(d.setorAcesso) ? d.setorAcesso : null})); });
    (LOCAL.departamentos||[]).forEach(function(d){
      var dep = achaPorNome(s.departamentos, d.nome); if(d.pai){ var pai = achaPorNome(s.departamentos, d.pai); if(pai && pai.id!==dep.id) dep.paiId = pai.id; }
      (d.pessoas||[]).forEach(function(p){ s.membros.push(novoMembro(s, {deptoId:dep.id, nome:p.nome, papel:p.papel, pessoaId:p.pessoaId})); });
    });
  } else {
    SEED_DEPARTAMENTOS.forEach(function(d){ s.departamentos.push(novoDepto(s, {nome:d[0], setorAcesso:d[1]})); });
  }
  return s;
}
// completa campos que faltarem (estado salvo antigo ou ausente)
function eqMigrar(eq){
  if(!eq) return eqDemo(); var base = eqDemo();
  Object.keys(base).forEach(function(k){ if(eq[k]===undefined) eq[k] = base[k]; });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(eq.config[k]===undefined) eq.config[k] = clone(CONFIG_PADRAO[k]); });
  eq.departamentos.forEach(function(d){ if(d.paiId===undefined) d.paiId = null; if(d.setorAcesso===undefined) d.setorAcesso = null; if(d.arquivado===undefined) d.arquivado = false; });
  eq.membros.forEach(function(m){ if(m.pessoaId===undefined) m.pessoaId = null; if(!m.papel) m.papel = "FUNCIONARIO"; });
  eq.v = 1; return eq;
}

// ---------- consultas básicas ----------
function achaPorNome(lista, nome){ var n = norm(nome); return lista.find(function(x){ return norm(x.nome)===n; }); }
function deptoPorId(s, id){ return s.eq.departamentos.find(function(d){ return mesmo(d.id, id); }); }
function membroPorId(s, id){ return s.eq.membros.find(function(m){ return mesmo(m.id, id); }); }
function setorValido(k){ return SETORES_ACESSO.some(function(x){ return x[0]===k; }); }
// rótulo do setor; chave que não existe mais cai para a chave crua (vínculo órfão, como no original)
function eqSetorRotulo(k){ if(!k) return null; var x = SETORES_ACESSO.find(function(y){ return y[0]===k; }); return x ? x[1] : k; }
function eqSetoresAcesso(){ return SETORES_ACESSO.map(function(x){ return {k:x[0], nome:x[1]}; }); }
var porOrdem = function(a, b){ return (a.ordem-b.ordem) || String(a.nome).localeCompare(String(b.nome), "pt-BR"); };
// supervisão primeiro, depois ordem, depois nome
var porMembro = function(a, b){ return (a.papel===b.papel ? 0 : a.papel==="SUPERVISOR" ? -1 : 1) || porOrdem(a, b); };
function filhosDe(s, paiId){ return s.eq.departamentos.filter(function(d){ return (d.paiId==null ? paiId==null : mesmo(d.paiId, paiId)); }).sort(porOrdem); }
// ids do departamento e de todos abaixo dele
function descendentes(s, id){ var r = [], fila = [id]; while(fila.length){ var x = fila.shift(); filhosDe(s, x).forEach(function(d){ r.push(d.id); fila.push(d.id); }); } return r; }
function caminhoDe(s, id){ var r = [], d = deptoPorId(s, id), guarda = 0; while(d && guarda++<50){ r.unshift(d); d = d.paiId!=null ? deptoPorId(s, d.paiId) : null; } return r; }
// escondido do mapa: arquivado ou dentro de um arquivado
function escondido(s, d){ return caminhoDe(s, d.id).some(function(x){ return x.arquivado; }); }
function eqPodeEditar(s, por){
  var p = norm(por); if(!p || p==="—") return true;   // sem identificação (chamada interna): não bloqueia
  var ed = (s.eq && s.eq.config && s.eq.config.editores) || EDITORES_PADRAO;
  return ed.some(function(x){ var n = norm(x); return p===n || p.indexOf(n+" ")===0; });
}

// ---------- pessoas (lidas de pessoas.js / RH; nunca duplicadas) ----------
function listaPessoas(s){
  var vistos = {}, r = [];
  funcionarios().forEach(function(f){ var id = slug(f.nome); if(vistos[id]) return; vistos[id] = 1; r.push({id:id, nome:f.nome, setor:f.setor, vinculo:f.vinculo}); });
  ((s.rh && s.rh.novos) || []).forEach(function(n){ var id = n.id || slug(n.nome); if(vistos[id]) return; vistos[id] = 1; r.push({id:id, nome:n.nome, setor:n.setor||"", vinculo:"clt"}); });
  return r;
}
// "Marcus Vinicius" casa com "Marcus Vinicius Hess de Oliveira": o nome curto precisa ser o começo do nome completo (mesma regra de nome aproximado do original, mais segura)
function casaPessoa(nomeMembro, p){ var a = norm(nomeMembro), b = norm(p.nome); return a && (a===b || b.indexOf(a+" ")===0); }
// pessoas que podem ser vinculadas (para o seletor), marcando as que já estão em algum departamento
function eqPessoasDisponiveis(s){
  var ja = {}; s.eq.membros.forEach(function(m){ if(m.pessoaId) ja[m.pessoaId] = 1; });
  return listaPessoas(s).map(function(p){ return {id:p.id, nome:p.nome, setor:p.setor, vinculo:p.vinculo, jaNoOrganograma:!!ja[p.id]}; }).sort(function(a, b){ return a.nome.localeCompare(b.nome, "pt-BR"); });
}
// pessoas do quadro que ainda não aparecem em nenhum departamento (por vínculo ou por nome)
function eqPessoasSemDepartamento(s){
  var ja = {}; s.eq.membros.forEach(function(m){ if(m.pessoaId) ja[m.pessoaId] = 1; });
  return listaPessoas(s).filter(function(p){ return !ja[p.id] && !s.eq.membros.some(function(m){ return casaPessoa(m.nome, p); }); });
}

// ---------- leitura para as telas ----------
function membrosDo(s, depId){ return s.eq.membros.filter(function(m){ return mesmo(m.deptoId, depId); }).sort(porMembro); }
function eqSupervisores(s, depId){ return membrosDo(s, depId).filter(function(m){ return m.papel==="SUPERVISOR"; }); }
// "Quem tem acesso a este setor": quem está em departamentos ligados ao mesmo grupo de acesso + os sócios (acesso total). Só leitura, informativo.
function eqQuemTemAcesso(s, depId){
  var d = deptoPorId(s, depId); if(!d || !d.setorAcesso) return [];
  var vistos = {}, r = [];
  var poe = function(nome, motivo){ var k = norm(nome); if(vistos[k]) return; vistos[k] = 1; r.push({nome:nome, motivo:motivo}); };
  s.eq.departamentos.filter(function(x){ return x.setorAcesso===d.setorAcesso; }).forEach(function(x){ membrosDo(s, x.id).forEach(function(m){ poe(m.nome, "Departamento "+x.nome); }); });
  funcionarios().filter(function(f){ return f.vinculo==="socio"; }).forEach(function(f){ poe(f.nome, "Sócio (acesso total)"); });
  return r;
}
function detalheDe(s, d, cor){
  var ms = membrosDo(s, d.id), sup = ms.filter(function(m){ return m.papel==="SUPERVISOR"; });
  return {id:d.id, nome:d.nome, ordem:d.ordem, paiId:d.paiId, arquivado:d.arquivado, setorAcesso:d.setorAcesso, setorRotulo:eqSetorRotulo(d.setorAcesso), setorOrfao:!!d.setorAcesso && !setorValido(d.setorAcesso),
    cor:cor, membros:ms, supervisores:sup, total:ms.length, temSupervisor:sup.length>0};
}
// Árvore do organograma: raiz (Sorelly) → departamentos de 1º nível → sub-departamentos. opt.arquivados=true mostra os arquivados (e o que está dentro deles).
// Cada nó: dados do departamento + membros (supervisão 1º) + supervisores + filhos + totalGeral (pessoas dele e abaixo) + nivel.
function eqArvore(s, opt){
  opt = opt||{}; var eq = s.eq, idx = 0;
  var monta = function(d, nivel, cor){
    var n = detalheDe(s, d, cor); n.nivel = nivel;
    n.filhos = filhosDe(s, d.id).filter(function(f){ return opt.arquivados || !f.arquivado; }).map(function(f){ return monta(f, nivel+1, cor); });
    n.totalGeral = n.total + n.filhos.reduce(function(t, f){ return t+f.totalGeral; }, 0);
    return n;
  };
  var filhos = filhosDe(s, null).filter(function(d){ return opt.arquivados || !d.arquivado; }).map(function(d){ var cor = CORES[idx++ % CORES.length]; return monta(d, 1, cor); });
  return {id:"raiz", nome:eq.config.nomeRaiz, nivel:0, filhos:filhos, totalDepartamentos:filhos.length, totalGeral:filhos.reduce(function(t, f){ return t+f.totalGeral; }, 0)};
}
// Lista plana por departamento (com caminho "Pai › Filho"). opt: {busca, arquivados, setorAcesso, soSemSupervisor}
function eqLista(s, opt){
  opt = opt||{}; var q = norm(opt.busca), r = [], idx = 0;
  var anda = function(d, cor){
    if(opt.arquivados || !d.arquivado){
      var det = detalheDe(s, d, cor); det.caminho = caminhoDe(s, d.id).map(function(x){ return x.nome; }).join(" › ");
      var ok = true;
      if(opt.setorAcesso && d.setorAcesso!==opt.setorAcesso) ok = false;
      if(opt.soSemSupervisor && det.temSupervisor) ok = false;
      if(ok && q){ ok = norm(d.nome).indexOf(q)>=0 || norm(eqSetorRotulo(d.setorAcesso)||"").indexOf(q)>=0;
        if(!ok){ det.membros = det.membros.filter(function(m){ return norm(m.nome).indexOf(q)>=0; }); ok = det.membros.length>0; } }   // achou só por pessoa: mostra só as pessoas que casaram
      if(ok) r.push(det);
      filhosDe(s, d.id).forEach(function(f){ anda(f, cor); });
    }
  };
  filhosDe(s, null).forEach(function(d){ anda(d, CORES[idx++ % CORES.length]); });
  return r;
}
// Busca sem acento por departamento, setor e pessoa. Devolve [{tipo:"depto"|"membro", id, nome, deptoId, deptoNome, papel?}]
function eqBusca(s, texto){
  var q = norm(texto), r = []; if(!q) return r;
  s.eq.departamentos.forEach(function(d){ if(norm(d.nome).indexOf(q)>=0 || norm(eqSetorRotulo(d.setorAcesso)||"").indexOf(q)>=0) r.push({tipo:"depto", id:d.id, nome:d.nome, deptoId:d.id, deptoNome:d.nome, arquivado:d.arquivado}); });
  s.eq.membros.forEach(function(m){ if(norm(m.nome).indexOf(q)>=0){ var d = deptoPorId(s, m.deptoId); r.push({tipo:"membro", id:m.id, nome:m.nome, papel:m.papel, deptoId:m.deptoId, deptoNome:d ? d.nome : "", arquivado:d ? d.arquivado : false}); } });
  return r;
}
// Onde cada pessoa aparece (pessoa em vários departamentos: ex. Marcus no original). pessoaId ou nome igual.
function eqDepartamentosDaPessoa(s, nomeOuPessoaId){
  var q = norm(nomeOuPessoaId);
  return s.eq.membros.filter(function(m){ return m.pessoaId===nomeOuPessoaId || norm(m.nome)===q; }).map(function(m){ var d = deptoPorId(s, m.deptoId); return {membroId:m.id, deptoId:m.deptoId, deptoNome:d ? d.nome : "", papel:m.papel}; });
}
function eqDepartamento(s, id){ var d = deptoPorId(s, id); if(!d) return null;
  var det = detalheDe(s, d, null); det.caminho = caminhoDe(s, id); det.subdepartamentos = filhosDe(s, id); det.quemTemAcesso = eqQuemTemAcesso(s, id); det.podeExcluirSemPerda = det.total===0 && det.subdepartamentos.length===0; return det; }
function eqIndicadores(s){
  var eq = s.eq, ativos = eq.departamentos.filter(function(d){ return !escondido(s, d); }), vis = {}; ativos.forEach(function(d){ vis[d.id] = 1; });
  var membros = eq.membros.filter(function(m){ return vis[m.deptoId]; }), unicos = {}; membros.forEach(function(m){ unicos[m.pessoaId || norm(m.nome)] = 1; });
  var temSup = function(d){ return eq.membros.some(function(m){ return mesmo(m.deptoId, d.id) && m.papel==="SUPERVISOR"; }); };
  return {departamentos:ativos.length, arquivados:eq.departamentos.length-ativos.length, membros:membros.length, pessoasUnicas:Object.keys(unicos).length,
    supervisores:membros.filter(function(m){ return m.papel==="SUPERVISOR"; }).length, vinculados:membros.filter(function(m){ return m.pessoaId; }).length,
    semSupervisor:ativos.filter(function(d){ return !temSup(d); }).length,
    vazios:ativos.filter(function(d){ return !eq.membros.some(function(m){ return mesmo(m.deptoId, d.id); }); }).length,
    semSetorAcesso:ativos.filter(function(d){ return !d.setorAcesso; }).length, setorOrfao:ativos.filter(function(d){ return d.setorAcesso && !setorValido(d.setorAcesso); }).length,
    pessoasSemDepartamento:eqPessoasSemDepartamento(s).length};
}
function eqHistorico(s, n){ return (s.eq.log||[]).slice(0, n||50); }

// ---------- escrita ----------
// Ações: dep_add, dep_edit, dep_arquivar, dep_del, dep_ordem, mem_add, mem_edit, mem_del, mem_ordem, importar_setores, vincular_auto, config. Todas aceitam por (quem fez) e agora.
function eqReduz(s, a){
  var eq = clone(s.eq), cfg = eq.config, por = a.por||"—", agora = a.agora||agoraSP();
  var st = {eq:eq};
  var recusa = function(t){ return {patch:{}, msg:t}; };
  var ok = function(msg, txt){ eq.log.unshift({em:agora, por:por, acao:a.op, txt:txt||msg}); if(eq.log.length>cfg.logMax) eq.log.length = cfg.logMax; return {patch:{eq:eq}, msg:msg}; };
  if(!eqPodeEditar(st, a.por)) return recusa("Só a diretoria edita o organograma.");
  var nomeRepetido = function(nome, exceto){ return eq.departamentos.some(function(d){ return !mesmo(d.id, exceto) && norm(d.nome)===norm(nome); }); };
  var checaSetor = function(k){ return !k || setorValido(k); };
  var dep = function(id){ return deptoPorId(st, id!=null ? id : a.id); };
  var mem = function(id){ return membroPorId(st, id!=null ? id : a.id); };
  var validaNome = function(n){ if(!n) return "Informe o nome."; if(n.length>cfg.nomeMax) return "Nome muito longo (máx. "+cfg.nomeMax+" letras)."; return ""; };
  // troca a ordem com o vizinho (dir -1 = sobe, 1 = desce) dentro da mesma lista
  var troca = function(lista, x, dir, cmp){ var ord = lista.slice().sort(cmp), i = ord.indexOf(x), j = i+(dir<0 ? -1 : 1); if(i<0 || j<0 || j>=ord.length) return false;
    var o = ord.slice(); o.splice(i, 1); o.splice(j, 0, x); o.forEach(function(y, k){ y.ordem = k; }); return true; };

  switch(a.op){
    case "dep_add": { var nome = trim(a.nome), er = validaNome(nome); if(er) return recusa(er);
      if(nomeRepetido(nome)) return recusa("Já existe um departamento chamado \""+nome+"\".");
      if(!checaSetor(a.setorAcesso)) return recusa("Setor de acesso inválido.");
      var pai = vazio(a.paiId) ? null : dep(a.paiId); if(!vazio(a.paiId) && !pai) return recusa("Departamento acima não encontrado.");
      var d = novoDepto(eq, {nome:nome, setorAcesso:a.setorAcesso||null, paiId:pai ? pai.id : null}); eq.departamentos.push(d);
      return ok("Departamento criado.", "Criou o departamento "+nome); }
    case "dep_edit": { var d1 = dep(); if(!d1) return recusa("Departamento não encontrado."); var antes = d1.nome, mud = [];
      if(a.nome!==undefined){ var n1 = trim(a.nome), e1 = validaNome(n1); if(e1) return recusa(e1); if(nomeRepetido(n1, d1.id)) return recusa("Já existe um departamento chamado \""+n1+"\"."); if(n1!==d1.nome){ mud.push("nome"); d1.nome = n1; } }
      if(a.setorAcesso!==undefined){ var k = a.setorAcesso||null; if(!checaSetor(k)) return recusa("Setor de acesso inválido."); if(k!==d1.setorAcesso){ mud.push("setor de acesso"); d1.setorAcesso = k; } }
      if(a.paiId!==undefined){ var pid = vazio(a.paiId) ? null : a.paiId;
        if(pid!=null){ var p1 = dep(pid); if(!p1) return recusa("Departamento acima não encontrado."); if(mesmo(pid, d1.id) || descendentes(st, d1.id).some(function(x){ return mesmo(x, pid); })) return recusa("Um departamento não pode ficar dentro dele mesmo."); }
        if(String(pid)!==String(d1.paiId)){ mud.push("posição"); d1.paiId = pid; d1.ordem = maiorOrdem(eq.departamentos)+1; } }
      if(a.ordem!==undefined && !isNaN(Number(a.ordem))){ d1.ordem = Number(a.ordem); mud.push("ordem"); }
      if(a.arquivado!==undefined && !!a.arquivado!==d1.arquivado){ d1.arquivado = !!a.arquivado; mud.push(d1.arquivado ? "arquivado" : "reativado"); }
      if(!mud.length) return recusa("Nada mudou.");
      return ok("Departamento salvo.", "Alterou "+antes+" ("+mud.join(", ")+")"); }
    case "dep_arquivar": { var d2 = dep(); if(!d2) return recusa("Departamento não encontrado."); var v = a.arquivado===undefined ? !d2.arquivado : !!a.arquivado; if(v===d2.arquivado) return recusa(v ? "Já está arquivado." : "Já está ativo.");
      d2.arquivado = v; return ok(v ? "Departamento arquivado." : "Departamento reativado.", (v ? "Arquivou " : "Reativou ")+d2.nome); }
    case "dep_del": { var d3 = dep(); if(!d3) return recusa("Departamento não encontrado.");
      // pessoas do departamento saem junto (como no original); sub-departamentos sobem para o nível do que foi excluído
      var qtd = eq.membros.filter(function(m){ return mesmo(m.deptoId, d3.id); }).length;
      filhosDe(st, d3.id).forEach(function(f){ f.paiId = d3.paiId; });
      eq.membros = eq.membros.filter(function(m){ return !mesmo(m.deptoId, d3.id); }); eq.departamentos = eq.departamentos.filter(function(x){ return x!==d3; });
      return ok("Departamento excluído.", "Excluiu "+d3.nome+(qtd ? " e "+qtd+(qtd===1 ? " pessoa" : " pessoas") : "")); }
    case "dep_ordem": { var d4 = dep(); if(!d4) return recusa("Departamento não encontrado.");
      var irmaos = eq.departamentos.filter(function(x){ return d4.paiId==null ? x.paiId==null : mesmo(x.paiId, d4.paiId); });
      if(!troca(irmaos, d4, a.dir, porOrdem)) return recusa("Já está no limite."); return ok("Ordem alterada.", "Moveu "+d4.nome+(a.dir<0 ? " para cima" : " para baixo")); }
    case "mem_add": { var d5 = dep(a.deptoId); if(!d5) return recusa("Departamento não encontrado."); var nm = trim(a.nome), e5 = validaNome(nm); if(e5) return recusa(e5);
      if(PAPEIS.indexOf(a.papel||"FUNCIONARIO")<0) return recusa("Papel inválido.");
      if(eq.membros.some(function(m){ return mesmo(m.deptoId, d5.id) && norm(m.nome)===norm(nm); })) return recusa(nm+" já está em "+d5.nome+".");
      eq.membros.push(novoMembro(eq, {deptoId:d5.id, nome:nm, papel:a.papel||"FUNCIONARIO", pessoaId:a.pessoaId}));
      return ok("Pessoa adicionada.", "Adicionou "+nm+" em "+d5.nome+((a.papel||"")==="SUPERVISOR" ? " (supervisão)" : "")); }
    case "mem_edit": { var m1 = mem(); if(!m1) return recusa("Pessoa não encontrada."); var mud2 = [], antesN = m1.nome;
      if(a.nome!==undefined){ var n2 = trim(a.nome), e2 = validaNome(n2); if(e2) return recusa(e2); if(n2!==m1.nome){ mud2.push("nome"); m1.nome = n2; } }
      if(a.papel!==undefined){ if(PAPEIS.indexOf(a.papel)<0) return recusa("Papel inválido."); if(a.papel!==m1.papel){ mud2.push("papel"); m1.papel = a.papel; } }
      if(a.pessoaId!==undefined){ var pv = vazio(a.pessoaId) ? null : String(a.pessoaId); if(pv!==m1.pessoaId){ mud2.push("vínculo"); m1.pessoaId = pv; } }
      if(a.deptoId!==undefined && !mesmo(a.deptoId, m1.deptoId)){ var dd = dep(a.deptoId); if(!dd) return recusa("Departamento de destino não encontrado.");
        if(eq.membros.some(function(x){ return x!==m1 && mesmo(x.deptoId, dd.id) && norm(x.nome)===norm(m1.nome); })) return recusa(m1.nome+" já está em "+dd.nome+".");
        m1.deptoId = dd.id; if(a.ordem===undefined) m1.ordem = maiorOrdem(eq.membros.filter(function(x){ return mesmo(x.deptoId, dd.id) && x!==m1; }))+1; mud2.push("departamento"); }
      if(a.ordem!==undefined && !isNaN(Number(a.ordem))){ m1.ordem = Number(a.ordem); mud2.push("ordem"); }
      if(!mud2.length) return recusa("Nada mudou.");
      return ok("Pessoa salva.", "Alterou "+antesN+" ("+mud2.join(", ")+")"); }
    case "mem_del": { var m2 = mem(); if(!m2) return recusa("Pessoa não encontrada."); var dn = deptoPorId(st, m2.deptoId);
      eq.membros = eq.membros.filter(function(x){ return x!==m2; }); return ok("Pessoa removida.", "Removeu "+m2.nome+(dn ? " de "+dn.nome : "")); }
    case "mem_ordem": { var m3 = mem(); if(!m3) return recusa("Pessoa não encontrada.");
      var colegas = eq.membros.filter(function(x){ return mesmo(x.deptoId, m3.deptoId) && x.papel===m3.papel; });
      if(!troca(colegas, m3, a.dir, porOrdem)) return recusa("Já está no limite."); return ok("Ordem alterada.", "Moveu "+m3.nome); }
    // cria departamentos e pessoas a partir dos setores de domain/pessoas.js (nomes completos, já vinculados); não duplica o que já existe
    case "importar_setores": { var novosD = 0, novosM = 0;
      FUNCIONARIOS_POR_SETOR.forEach(function(sx){ var nomeS = sx[0], d6 = achaPorNome(eq.departamentos, nomeS);
        if(!d6){ d6 = novoDepto(eq, {nome:nomeS}); eq.departamentos.push(d6); novosD++; }
        sx[1].forEach(function(f){ if(eq.membros.some(function(m){ return mesmo(m.deptoId, d6.id) && (norm(m.nome)===norm(f[0]) || casaPessoa(m.nome, {nome:f[0]})); })) return;
          eq.membros.push(novoMembro(eq, {deptoId:d6.id, nome:f[0], papel:"FUNCIONARIO", pessoaId:slug(f[0])})); novosM++; }); });
      if(!novosD && !novosM) return recusa("Os setores de Pessoas já estão no organograma.");
      return ok("Setores importados.", "Importou de Pessoas: "+novosD+" departamentos e "+novosM+" pessoas"); }
    // liga pelo nome (como o seed do original): só quando o nome casa com UMA pessoa; ambíguo fica sem vínculo
    case "vincular_auto": { var pessoas = listaPessoas(st), lig = 0;
      eq.membros.forEach(function(m){ if(m.pessoaId) return; var achadas = pessoas.filter(function(p){ return casaPessoa(m.nome, p); }); if(achadas.length===1){ m.pessoaId = achadas[0].id; lig++; } });
      if(!lig) return recusa("Nenhum nome casou sozinho com uma pessoa do quadro.");
      return ok(lig+(lig===1 ? " pessoa vinculada." : " pessoas vinculadas."), "Vinculou automaticamente "+lig+" pessoas"); }
    case "config": {
      if(a.nomeRaiz!==undefined){ var nr = trim(a.nomeRaiz); if(!nr) return recusa("Informe o nome do centro do mapa."); cfg.nomeRaiz = nr; }
      if(a.editores!==undefined){ var ed = (a.editores||[]).map(trim).filter(Boolean); if(!ed.length) return recusa("Deixe ao menos uma pessoa que edita."); cfg.editores = ed; }
      return ok("Configuração salva.", "Alterou a configuração de Equipes"); }
    default: return recusa("Ação desconhecida: "+a.op);
  }
}

export { PAPEIS, ROTULO_PAPEL, SETORES_ACESSO, CORES, EDITORES_PADRAO, CONFIG_PADRAO, SEED_DEPARTAMENTOS, hojeSP, agoraSP,
  eqDemo, eqMigrar, eqReduz, eqPodeEditar, eqSetorRotulo, eqSetoresAcesso, eqArvore, eqLista, eqBusca, eqDepartamento, eqSupervisores, eqQuemTemAcesso,
  eqDepartamentosDaPessoa, eqPessoasDisponiveis, eqPessoasSemDepartamento, eqIndicadores, eqHistorico, descendentes, caminhoDe };
