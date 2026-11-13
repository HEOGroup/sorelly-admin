// Sorelly Admin · montagem — pages/ChavesPixBancos.js
// Financeiro → Bancos → Chaves Pix: TODAS as chaves Pix da Sorelly e da família. Ordem da barra: CNPJs, Fornecedores, Funcionários, Família, Prestadores de serviço. Todas da mesma cor.
// TUDO fica sempre aberto (sem seta, sem Abrir/Fechar todos). Sócios e Prestadores são separados por pessoa (Marcus, Anamaria, Marco Antonio, Ana Beatriz, Lucas); a Greice, usada por todos, fica num bloco "Universal".
// O botão "Editar" fica no alto: ligado, todas as linhas viram campos e gravam ao sair do campo (data e quem alterou).
// Gravação: contas bancárias em s.px (op "caixa_chave"; a mesma chave aparece no Caixa), funcionários e prestadores sem registro em s.cp.func, família/fornecedores/prestador da empresa em s.cp.chaves, prestadores pessoais do Financeiro familiar em s.ff.prest.
// A tela Funcionários (RH) mostra a chave daqui e manda para cá quem quiser editar (s.cpxFoco).
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { AbasTela, Bloco, Botao, CAMPO, Segmentado } from "@/apps/montagem/components/padrao-fin";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { chaveAdminDaConta, contaDaCaixa, extraSeed, extrasSeed, funcSeed } from "@/apps/montagem/domain/pix-regras";
import { bancoDaConta, cnpjFormatado } from "@/apps/montagem/lib/mensagem-pix";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { rotuloCnpj } from "@/apps/montagem/lib/nome-conta";
import { FUNCIONARIOS_POR_SETOR, REPRESENTANTES, funcionarios } from "@/apps/montagem/domain/pessoas";
import { use } from "@/apps/montagem/state/context";
import { e, useEffect, useState } from "@/shared/react";

var NOME_CNPJ = {"34":"CNPJ 34 · Sorelly Atacadista", "46":"CNPJ 46 · Mayz Comércio de Moda", "59":"CNPJ 59 · Serenity Porta Joias", "67":"CNPJ 67 · Axis Comércio de Joias", "ho":"H&O Apps", "HO":"H&O Apps", "PART":"Particular", "ITM":"Itaú Marco PJ"};
var COR = {"34":"#B8892B", "46":"#BE185D", "59":"#0F766E", "67":"#1D4ED8", "ho":"#6D28D9", "HO":"#6D28D9", "PART":"#64748B", "ITM":"#0E7490"};
var COR_PESSOA = {"marcus":"#EF9F27", "anamaria":"#16A34A", "marco":"#2563EB", "anabeatriz":"#DB2777", "lucas":"#EA580C", "universal":"#7C3AED", "empresa":"#0D9488"};
var TIPOS = [["", "—"], ["CNPJ", "CNPJ"], ["CPF", "CPF"], ["EMAIL", "E-mail"], ["TELEFONE", "Telefone"], ["ALEATORIA", "Aleatória"]];
var ROTULO = {CNPJ:"CNPJ", CPF:"CPF", EMAIL:"E-mail", TELEFONE:"Telefone", ALEATORIA:"Aleatória"};
var COR_TIPO = {CNPJ:"#F59E0B", CPF:"#60A5FA", EMAIL:"#34D399", TELEFONE:"#F472B6", ALEATORIA:"#A78BFA"};
var cpfValido = function(d){ if(d.length!==11 || /^(d)+$/.test(d)) return false; var c = function(n){ var s = 0; for(var i = 0; i<n; i++) s += Number(d[i])*(n+1-i); var r = (s*10)%11; return r===10 ? 0 : r; }; return c(9)===Number(d[9]) && c(10)===Number(d[10]); };
var tipoDe = function(ch){ var s = String(ch||"").trim(), d = s.replace(/D/g, ""); if(!s) return ""; if(s.indexOf("@")>=0) return "EMAIL"; if(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return "ALEATORIA"; if(d.length===14) return "CNPJ"; if(d.length===11) return (s.indexOf("+")>=0 || !cpfValido(d)) ? "TELEFONE" : "CPF"; if(d.length>=10 && d.length<=13) return "TELEFONE"; return "ALEATORIA"; };
// data de alteração: só o DIA, sem horário (Marcus, 04/11/2026); toda chave mostra no mínimo o dia da carga (04/11/2026), e uma edição feita depois mostra o dia dela
var DATA_CARGA = new Date(2026, 10, 4).getTime();
var dh = function(ts){ if(!ts) return "—"; var d = new Date(ts); return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear(); };
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var palavras = function(t){ return norm(t).split(/\s+/).filter(function(w){ return w.length>2 && ["dos","das","del"].indexOf(w)<0; }); };
var ABAS = [["cnpjs", "CNPJs"], ["forn", "Fornecedores"], ["pes", "Sócios"], ["rep", "Representantes"], ["func", "Funcionários"]];   // ordem do Marcus (04/11/2026)
var CAB = {cnpjs:["CNPJ", "Banco"], forn:["Tipo", "Fornecedor"], func:["", "Funcionário"], rep:["Vínculo", "Representante"], pes:["Tipo", "Nome"], prest:["Serviço", "Prestador"]};
// ajustes do Marcus (20/10/2026) para os prestadores do Financeiro familiar: quem sai, nomes e serviços; a Greice é de todos (universal)
var OCULTAR = ["julia marketing", "marcus poupanca", "greicy anamaria", "greyci ana beatriz", "lucas castilho", "ulisses detran"];
var NOME_EXIBE = {"greicy":"Greice", "ulisses detran":"Serviço Detran"};
var SERVICO_EXIBE = {"rebel mode":"Carros Marcus", "68 gang performance":"Carros Marcus", "greicy":"Casa (todos)"};
var UNIVERSAL = ["greicy"];
var ORDEM_PESSOAS = ["marcus", "anamaria", "marco", "anabeatriz", "lucas"];
// favorecido (razão social) de cada CNPJ, como o Marcus passou em 04/11/2026
var FAV_EMPRESA = {"34":"Sorelly Comércio Atacadista de Semijoias", "46":"Mayz Comércio de Moda Praia, Lingeries e Acessórios Ltda", "59":"Serenity", "67":"Axis Comércio de Joias e Acessórios Ltda", "HO":"H&O Apps", "ho":"H&O Apps"};
var NOME_PESSOA = {"marcus":"Marcus", "anamaria":"Anamaria", "marco":"Marco Antonio", "anabeatriz":"Ana Beatriz Hess", "lucas":"Lucas"};

// uma linha da tabela (padrão: TabelaP com topo dourado, células centralizadas, nada abreviado). Com o botão Editar ligado, tipo e chave viram campos e gravam ao sair do campo (data e quem alterou).
var CEL = "h-8 whitespace-nowrap border-b border-border px-2.5 py-1 text-center text-[13px] leading-snug";   // nenhuma linha quebra (Marcus, 04/11/2026): as colunas têm largura para o texto inteiro
// favorecido sempre resumido: as duas primeiras palavras (Marcus, 04/11/2026); o nome completo fica no title
var PARTICULAS = ["de", "da", "do", "dos", "das", "e"];
var nome3 = function(t){ var ws = String(t||"").trim().split(/\s+/), n = 0, out = []; for(var i = 0; i<ws.length; i++){ var sig = PARTICULAS.indexOf(ws[i].toLowerCase())<0; if(sig && n===3) break; if(sig) n++; out.push(ws[i]); } while(out.length && PARTICULAS.indexOf(out[out.length-1].toLowerCase())>=0) out.pop(); return out.join(" "); };
var resumoFav = function(t){ return String(t||"").trim().split(/\s+/).slice(0, 2).join(" "); };
export function AbaChavesPixBancos(){
  var cx = use(), s = cx.state, sc = s.saldosContas, px = s.px, cpf = (s.cp && s.cp.func) || {}, cch0 = (s.cp && s.cp.chaves) || {}, eu = nomeDe(s.usuario), d = cx.dispatch, foco = s.cpxFoco;
  // completa com as chaves do arquivo local quando o estado salvo ainda não as tem (o estado do servidor manda, e pode estar atrás)
  var cch = Object.assign({}, cch0); extrasSeed().forEach(function(x){ var cur = cch[x[0]] || {}; if(/@exemplo\.com$/i.test(String(cur.chave||""))) cur = Object.assign({}, cur, {chave:"", chaveTipo:""});   // sobra de teste: chave de exemplo nunca vale
    cch[x[0]] = Object.assign({}, cur, {grupo:x[1], nome:x[2] || cur.nome, banco:x[3] || cur.banco, servico:x[4] || cur.servico, favorecido:x[7] || cur.favorecido || ""}, cur.chave ? {} : {chaveTipo:x[5], chave:x[6]}); });   // nome, banco, serviço e favorecido do arquivo valem sobre o estado salvo (o Marcus acerta os textos aqui)
  var comSeed = function(k, nome){ return (k && k.chave) ? k : Object.assign({}, k, chaveAdminDaConta(nome) || {}); };
  var sb = useState(foco ? (foco.busca||"") : ""), busca = sb[0], setBusca = sb[1];
  var st = useState(foco ? (foco.aba==="prest" ? "forn" : foco.aba) : "cnpjs"), aba = st[0], setAba = st[1];
  var edita = false;   // sem botão Editar (Marcus, 12/11/2026): a tela é só de leitura
  var modoFunc = "cnpj";   // Funcionários: só por CNPJ, com os 5 CNPJs (Marcus, 12/11/2026)
  useEffect(function(){ if(foco) d({type:"CHAVESPIX_LIMPA"}); }, []);
  var viewFam = temAutorizacao("financeiro_familia", s.usuario);
  var gravaFunc = function(nome){ return function(pt){ d({type:"CP", op:"func_set", nome:nome, por:eu, patch:{chave:pt.chave, chaveTipo:pt.tipo, chaveEm:Date.now(), chavePor:eu}}); }; };
  var gravaChave = function(id, base){ return function(pt){ d({type:"CP", op:"chave_set", id:id, por:eu, base:base, patch:{chave:pt.chave, chaveTipo:pt.tipo, chaveEm:Date.now(), chavePor:eu}}); }; };
  var rowDeChave = function(id, c1, c2, base){ var k = cch[id] || {}; if(!k.chave && id.indexOf("rep|")===0) k = Object.assign({}, k, extraSeed(id) || {}); return {id:id, c1:c1, c2:c2, banco:k.banco || (base && base.banco) || "", fav:k.favorecido || "", chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:gravaChave(id, base)}; };

  // ── CNPJs: contas bancárias (aplicações e dinheiro não têm chave Pix; retidos também não)
  var blocosCnpj = (sc.blocos||[]).map(function(b){
    var contas = (sc.contas||[]).filter(function(c){ return c.bloco===b.id && c.tipo!=="CAIXA" && !c.bloqueada && !/rotativo|garantida/i.test(c.nome); });   // Rotativo e Conta Garantida são limite de outra conta: não têm chave Pix própria (Marcus, 04/11/2026)
    return {id:b.id, cnpjId:b.id, nome:NOME_CNPJ[b.id] || b.nome, cor:COR[b.id]||"#64748B", rows:contas.map(function(c){ var k = comSeed(contaDaCaixa(px, c.id), c.nome); return {id:c.id, c1:NOME_CNPJ[b.id] || b.nome, c2:c.nome, chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:function(pt){ d({type:"PX", op:"caixa_chave", caixaId:c.id, nome:c.nome, cnpj:c.bloco, em:Date.now(), por:eu, chave:pt.chave, tipo:pt.tipo}); }}; })};
  }).filter(function(b){ return b.rows.length; });

  // coluna CNPJ: o número completo da empresa (Marcus, 04/11/2026); bloco sem CNPJ (Itaú Marco PJ, particular) mantém o nome
  blocosCnpj.forEach(function(b){ b.rows.forEach(function(r){ r.fav = FAV_EMPRESA[b.id] || ""; r.c2 = bancoDaConta(r.c2); });   // coluna Banco: SÓ o nome do banco (Sicredi, Itaú, Caixa Econômica, Safra, Unicred, Stone, Bradesco), sem empresa nem número do CNPJ (Marcus, 04/11/2026)
    var rc = b.rows.find(function(r){ return r.tipo==="CNPJ" && cnpjFormatado(r.chave); }); if(rc) b.rows.forEach(function(r){ r.c1 = cnpjFormatado(rc.chave); }); });

  // ── Fornecedores (nome e o que fornecem, como o Marcus passou); a chave fica guardada pelo nome
  var FORNECEDORES = [["Pontual", "Banho"], ["Ellos Galvânica", "Banho"], ["MegaSul", "Bruto"], ["Art Ello", "Bruto"], ["Xangai", "Bruto"], ["Point", "Peças"], ["Office Graf", "Gráfica"], ["Devmaster", "Sistema"], ["Ello Print", "Tintas"], ["Madeira Cor", "—"]];
  var rowsForn = FORNECEDORES.map(function(x){ return rowDeChave("forn|"+x[0], x[1], x[0], {grupo:"forn", nome:x[0], servico:x[1]}); });
  var blocosForn = [{id:"forn", nome:"Fornecedores", cor:"#EA580C", fixo:true, rows:rowsForn}];

  // ── Funcionários: como na tela Funcionários do RH (por CNPJ ou por setor)
  var cn = cnpjsDe(s.cnpjs), nomeCnpjDe = function(id){ var c = cn.find(function(x){ return x.id===id; }); return c ? (c.num ? rotuloCnpj(c.num, c.nome) : c.nome) : "CNPJ a informar"; };
  var funcs = funcionarios(), rowDeFunc = function(f, c1){ var k = cpf[f.nome] || {}, sd = !k.chave ? funcSeed(f.nome) : null; if(sd) k = Object.assign({}, k, {chave:sd[2], chaveTipo:sd[1], banco:sd[3]}); return {id:f.nome, c1:c1, c2:f.nome, banco:k.banco || "", chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:gravaFunc(f.nome)}; };
  var blocosFunc = modoFunc==="setor"
    ? FUNCIONARIOS_POR_SETOR.map(function(st, i){ return {id:"s|"+st[0], nome:st[0], cor:["#B8892B", "#BE185D", "#0F766E", "#1D4ED8", "#6D28D9", "#0E7490", "#B45309", "#15803D", "#9333EA", "#DC2626"][i % 10], rows:funcs.filter(function(f){ return f.setor===st[0]; }).map(function(f){ return rowDeFunc(f, nomeCnpjDe(f.cnpj)); })}; })
    : cn.map(function(c){ return {id:"c|"+c.id, cnpjId:c.id, nome:(c.num ? rotuloCnpj(c.num, c.nome) : c.nome), cor:c.cor || "#64748B", rows:funcs.filter(function(f){ return f.cnpj===c.id; }).map(function(f){ return rowDeFunc(f, f.setor); })}; }).concat([{id:"c|", cnpjId:"", nome:"CNPJ a informar", cor:"#64748B", rows:funcs.filter(function(f){ return !f.cnpj; }).map(function(f){ return rowDeFunc(f, f.setor); })}]);
  blocosFunc = blocosFunc.filter(function(b){ return b.rows.length; });
  var palavrasFunc = funcs.map(function(f){ return palavras(f.nome); });
  var jaFunc = function(nome){ var pw = palavras(nome); return pw.length>0 && palavrasFunc.some(function(fw){ return pw.every(function(w){ return fw.indexOf(w)>=0; }); }); };

  // ── Representantes (04/11/2026, Marcus: todas as chaves Pix num lugar só): a lista vem de Pessoas; a chave fica guardada pelo nome em s.cp.chaves e o app da representante lê daqui (Pix representante)
  var rowsRep = REPRESENTANTES.map(function(r){ return rowDeChave("rep|"+r.nome, r.tambemFunc ? "Também funcionária" : "Representante", r.nome, {grupo:"rep", nome:r.nome}); });
  var blocosRep = [{id:"rep", nome:"Representantes", cor:"#0E7490", fixo:true, rows:rowsRep}];

  // ── Família: contas pessoais, um bloco por pessoa (sempre aberto)
  var personas = (s.ff && s.ff.personas) || [], idDaPessoa = function(nome){ var n = norm(nome); var p = personas.find(function(x){ return norm(x.nome)===n; }); return p ? p.id : n.split(" ")[0]; };
  var rowsPorPessoa = {};
  if(viewFam) Object.keys(cch).filter(function(k){ return cch[k].grupo==="pes"; }).forEach(function(k){ var pid = idDaPessoa(cch[k].nome); (rowsPorPessoa[pid] = rowsPorPessoa[pid] || []).push(Object.assign(rowDeChave(k, "Conta pessoal", cch[k].nome, {grupo:"pes", nome:cch[k].nome, banco:cch[k].banco, servico:cch[k].servico}), pid==="marcus" ? {fav:"Marcus Hess"} : {})); });   // favorecido das contas do Marcus: Marcus Hess em todas (12/11/2026)
  var blocosPes = viewFam ? ORDEM_PESSOAS.map(function(pid){ return {id:"pes|"+pid, nome:NOME_PESSOA[pid], cor:COR_PESSOA[pid], fixo:true, vazio:"Nenhuma chave cadastrada", rows:rowsPorPessoa[pid] || []}; }) : [];

  // ── Prestadores de serviço: empresa + particulares (por pessoa) + universal (Greice); quem já é funcionário não repete
  var rowsEmp = [];
  Object.keys(cch).filter(function(k){ return cch[k].grupo==="prest"; }).forEach(function(k){ rowsEmp.push(rowDeChave(k, cch[k].servico || "Prestador de serviço", cch[k].nome, {grupo:"prest", nome:cch[k].nome, banco:cch[k].banco, servico:cch[k].servico})); });
  Object.keys(cpf).filter(function(k){ return cpf[k].extra; }).forEach(function(k){ var x = cpf[k]; rowsEmp.push({id:"cp|"+k, c1:"Prestador sem registro", c2:k, chave:x.chave||"", tipo:x.chaveTipo || tipoDe(x.chave), em:x.chaveEm||0, por:x.chavePor||"", salva:gravaFunc(k)}); });
  var porDono = {}, universais = [];
  if(viewFam) ((s.ff && s.ff.prest) || []).filter(function(x){ var n = norm(x.nome); return x.ativo!==false && OCULTAR.indexOf(n)<0 && !jaFunc(x.nome); }).forEach(function(x){ var n = norm(x.nome);
    var sd = !x.chavePixEm ? extrasSeed().find(function(z){ return z[0]==="ffp|"+n; }) : null;   // chave do arquivo local vale enquanto ninguém editou a chave na tela
    var comPessoa = !!(sd && sd[7]);   // prestador com a pessoa conhecida: 1ª coluna = nome do prestador (ex.: Show Banca), 2ª = nome da pessoa (ex.: João Paulo Feitoza da Silva) (Marcus, 04/11/2026)
    var row = {id:"ff|"+x.id, c1:comPessoa ? (NOME_EXIBE[n] || x.nome) : (SERVICO_EXIBE[n] || x.servico || "Particular"), c2:comPessoa ? sd[7] : (NOME_EXIBE[n] || x.nome), banco:sd ? sd[3] : "", fav:sd ? (sd[7] || "") : "", chave:sd ? sd[6] : (x.chavePix||""), tipo:sd ? sd[5] : (x.chavePixTipo || tipoDe(x.chavePix)), em:x.chavePixEm||0, por:x.chavePixPor||"", salva:function(pt){ d({type:"FF", op:"prest_set", id:x.id, por:eu, patch:{chavePix:pt.chave, chavePixTipo:pt.tipo, chavePixEm:Date.now(), chavePixPor:eu}}); }};
    if(UNIVERSAL.indexOf(n)>=0) universais.push(row); else { var dono = x.responsavelId || "marcus"; (porDono[dono] = porDono[dono] || []).push(row); } });
  var blocosPrest = [{id:"pr|empresa", cab:"prest", nome:"Prestadores de serviço", cor:COR_PESSOA.empresa, fixo:true, vazio:"Nenhum prestador cadastrado", rows:rowsEmp}];
  // os prestadores particulares ficam na aba Sócios, dentro do grupo de cada sócio; a aba Prestadores fica só com os da empresa (Marcus, 04/11/2026)
  // a Greice é o mesmo Pix do Marcus, da mãe e da irmã: a linha dela aparece no grupo de cada um (Marcus, 04/11/2026); não há mais grupo "Universal"
  var COM_GREICE = ["marcus", "anamaria", "anabeatriz"];
  if(viewFam){ blocosPes = blocosPes.map(function(b){ var pid = b.id.slice(4); return Object.assign({}, b, {vazio:"Nenhuma chave cadastrada", rows:b.rows.concat(porDono[pid] || [], COM_GREICE.indexOf(pid)>=0 ? universais : [])}); }); }

  var todos = {cnpjs:blocosCnpj, forn:blocosForn.concat(blocosPrest), func:blocosFunc, rep:blocosRep, pes:blocosPes, prest:blocosPrest}, blocos = todos[aba];
  var q = norm(busca);
  var visiveis = blocos.map(function(b){
    var casaB = !q || norm(b.nome).indexOf(q)>=0;
    return Object.assign({}, b, {rows:b.rows.filter(function(r){ return casaB || norm(r.c1+" "+r.c2+" "+r.chave+" "+r.por+" "+(ROTULO[r.tipo]||"")).indexOf(q)>=0; })});
  }).filter(function(b){ return b.rows.length || (b.fixo && !q); });
  var conta = function(bs){ return bs.reduce(function(t, b){ return t+b.rows.length; }, 0); };
  var total = conta(blocos), sem = blocos.reduce(function(t, b){ return t+b.rows.filter(function(r){ return !r.chave; }).length; }, 0);
  var geral = ABAS.reduce(function(t, a){ return t+conta(todos[a[0]]); }, 0), geralSem = ABAS.reduce(function(t, a){ return t+todos[a[0]].reduce(function(u, b){ return u+b.rows.filter(function(r){ return !r.chave; }).length; }, 0); }, 0);
  var H = CAB[aba].slice(); if(aba==="func") H[0] = modoFunc==="cnpj" ? "Setor" : "CNPJ";
  // cada grupo é uma tabela com o resumo no topo dourado (nome, quantas chaves e quantas sem chave); clicar no topo abre/fecha; "Abrir todos" / "Fechar todos" na linha de cima
  var aberto = function(){ return true; };   // tudo aberto 100% do tempo (Marcus, 12/11/2026)
  var temBanco = aba!=="cnpjs";
  var resumoDe = function(b){ var n = b.rows.length, sem = b.rows.filter(function(r){ return !r.chave; }).length; return b.nome+" · "+n+(aba==="cnpjs" ? (n===1 ? " conta" : " contas") : (n===1 ? " chave" : " chaves"))+(sem ? " · "+sem+" sem chave" : ""); };
  // título do bloco centralizado, só o nome curto do CNPJ (Sorelly, Mayz, Serenity, Axis, H&O) e, do lado, a quantidade (Marcus, 12/11/2026); a letra maiúscula vem do BlocoPainel
  var NOME_BARRA = {"34":"Sorelly", "46":"Mayz", "59":"Serenity", "67":"Axis", "ho":"H&O", "HO":"H&O"};
  var tituloDe = function(b){ return resumoDe(b.cnpjId!==undefined && NOME_BARRA[b.cnpjId] ? Object.assign({}, b, {nome:NOME_BARRA[b.cnpjId]}) : b); };
  // Padrão do Financeiro (Marcus, 12/11/2026): cada grupo é um BLOCO de barra azul (clicar na barra abre e fecha; fechado mostra só a barra), linhas brancas, letra de 11 px e a tabela com filtro nas colunas.
  var salvaChave = function(r, v){ v = v.trim(); if(v!==r.chave) r.salva({chave:v, tipo:r.tipo || tipoDe(v)}); };
  var linhaDe = function(r){ return {id:r.id, c1:r.c1, c2:nome3(r.c2), banco:r.banco || "—", fav:resumoFav(r.fav) || "—", tipo:ROTULO[r.tipo] || "—", chave:r.chave || "sem chave", em:dh(r.chave ? Math.max(r.em || 0, DATA_CARGA) : 0), por:r.chave ? (!r.por || /carga|importa|sistema/i.test(r.por) ? "Marcus" : r.por) : "—", r:r}; };   // "Carga" não é pessoa: mostra Marcus (12/11/2026)
  var colunasDe = function(H){ return [{k:"c1", t:H[0], w:"9.5rem"}, {k:"c2", t:H[1], w:"13rem", render:function(v, l){ return e("span",{title:l.r.c2, className:"font-semibold"}, v); }}].concat(temBanco ? [{k:"banco", t:"Banco", w:"7rem"}] : [], [{k:"fav", t:"Favorecido", w:"9rem"},
    {k:"tipo", t:"Tipo", w:"6rem", render:function(v, l){ var r = l.r; return edita ? e("select",{value:r.tipo, "aria-label":"Tipo de chave Pix de "+r.c2, className:CAMPO, onChange:function(ev){ r.salva({chave:r.chave, tipo:ev.target.value}); }}, TIPOS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })) : v; }},
    {k:"chave", t:"Chave Pix", w:"22rem", render:function(v, l){ var r = l.r; return edita ? e("input",{key:r.id+"|"+r.chave, defaultValue:r.chave, placeholder:"chave Pix", "aria-label":"Chave Pix de "+r.c2, className:CAMPO, onBlur:function(ev){ salvaChave(r, ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }})
      : e("span",{className:"relative flex w-full items-center justify-center pr-14"}, e("span",{className:"font-mono font-semibold", style:r.chave ? undefined : {color:"#FBBF24"}}, r.chave || "sem chave"), r.chave && e("span",{className:"absolute right-0 top-1/2 -translate-y-1/2"}, e(CopiarChave,{texto:r.chave, rot:"Copiar", pequeno:true, dados:{nome:r.c2, banco:r.banco, favorecido:r.fav, tipo:r.tipo}}))); }},
    {k:"em", t:"Data de alteração", w:"9rem"}, {k:"por", t:"Quem alterou", w:"7.5rem"}]); };
  return e("div",{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 flex flex-col gap-1.5 pl-3 md:-mx-3 md:-mb-3 md:pl-4"},   // mesma posição das outras telas de Pagamentos
    // UMA linha só (Marcus, 04/11/2026: compacto): abas visíveis, busca, organizar por (Funcionários) e Editar; o nome da tela já está na faixa do topo
    e("section",{className:"flex min-h-6 flex-wrap items-center gap-1 rounded-lg border-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-0.5 text-white"},   // barra azul do padrão: abas + busca dentro dela (Marcus, 12/11/2026)
      e("div",{role:"tablist", className:"flex flex-wrap items-center gap-1"}, ABAS.map(function(x){ var on = x[0]===aba; return e("button",{key:x[0], type:"button", role:"tab", "aria-selected":on, onClick:function(){ setAba(x[0]); setBusca(""); }, className:"h-[22px] whitespace-nowrap rounded-md px-3 text-[13px] uppercase hover:bg-white/20 "+(on ? "bg-white/25 font-bold" : "font-semibold")}, x[1]); })),
      e("input",{type:"search", value:busca, placeholder:"Buscar nome, banco, chave ou quem alterou", "aria-label":"Buscar", className:"ml-auto h-[22px] w-80 rounded-md border border-white/40 bg-white/10 px-2 text-[11px] text-white placeholder:text-white", onChange:function(ev){ setBusca(ev.target.value); }})),
    visiveis.map(function(b){ return e(BlocoPainel,{key:b.id, titulo:tituloDe(b), compacto:true}, e(TabelaPlanilha,{semContagem:true, grade:true, chave:"id", vazio:b.vazio || "Nada aqui", linhas:b.rows.map(linhaDe), cols:colunasDe(b.cab ? CAB[b.cab] : H)})); }),
    !visiveis.length && e("p",{className:"py-6 text-center text-[13px] text-foreground"}, (aba==="pes") && !viewFam ? "Esta parte só aparece para quem tem acesso à família (sócios)." : "Nada encontrado."));
}
