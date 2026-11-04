// Sorelly Admin · montagem — pages/ChavesPixBancos.js
// Financeiro → Bancos → Chaves Pix: TODAS as chaves Pix da Sorelly e da família. Ordem da barra: CNPJs, Fornecedores, Funcionários, Família, Prestadores de serviço. Todas da mesma cor.
// TUDO fica sempre aberto (sem seta, sem Abrir/Fechar todos). Sócios e Prestadores são separados por pessoa (Marcus, Anamaria, Marco Antonio, Ana Beatriz, Lucas); a Greice, usada por todos, fica num bloco "Universal".
// O botão "Editar" fica no alto: ligado, todas as linhas viram campos e gravam ao sair do campo (data e quem alterou).
// Gravação: contas bancárias em s.px (op "caixa_chave"; a mesma chave aparece no Caixa), funcionários e prestadores sem registro em s.cp.func, família/fornecedores/prestador da empresa em s.cp.chaves, prestadores pessoais do Financeiro familiar em s.ff.prest.
// A tela Funcionários (RH) mostra a chave daqui e manda para cá quem quiser editar (s.cpxFoco).
import { Pagina } from "@/apps/montagem/components/padrao";
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { AbasTela, Bloco, Botao, CAMPO, Segmentado, TabelaP } from "@/apps/montagem/components/padrao-fin";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { chaveAdminDaConta, contaDaCaixa, extraSeed, extrasSeed } from "@/apps/montagem/domain/pix-regras";
import { cnpjFormatado } from "@/apps/montagem/lib/mensagem-pix";
import { nomeDe } from "@/apps/montagem/domain/equipe";
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
var dh = function(ts){ if(!ts) return "—"; var d = new Date(ts); return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var palavras = function(t){ return norm(t).split(/\s+/).filter(function(w){ return w.length>2 && ["dos","das","del"].indexOf(w)<0; }); };
var ABAS = [["cnpjs", "CNPJs"], ["forn", "Fornecedores"], ["pes", "Sócios"], ["prest", "Prestadores de serviço"], ["rep", "Representantes"], ["func", "Funcionários"]];   // ordem do Marcus (04/11/2026)
var CAB = {cnpjs:["CNPJ", "Banco"], forn:["Tipo", "Fornecedor"], func:["", "Funcionário"], rep:["Vínculo", "Representante"], pes:["Banco", "Nome"], prest:["Serviço", "Prestador"]};
// ajustes do Marcus (20/10/2026) para os prestadores do Financeiro familiar: quem sai, nomes e serviços; a Greice é de todos (universal)
var OCULTAR = ["julia marketing", "marcus poupanca", "greicy anamaria", "greyci ana beatriz", "lucas castilho"];
var NOME_EXIBE = {"greicy":"Greice", "ulisses detran":"Serviço Detran"};
var SERVICO_EXIBE = {"rebel mode":"Carros Marcus", "68 gang performance":"Carros Marcus", "greicy":"Casa (todos)"};
var UNIVERSAL = ["greicy"];
var ORDEM_PESSOAS = ["marcus", "anamaria", "marco", "anabeatriz", "lucas"];
// favorecido (razão social) de cada CNPJ, como o Marcus passou em 04/11/2026
var FAV_EMPRESA = {"34":"Sorelly Comércio Atacadista de Semijoias", "46":"Mayz Comércio de Moda Praia, Lingeries e Acessórios Ltda", "59":"Serenity", "67":"Axis Comércio de Joias e Acessórios Ltda", "HO":"H&O Apps", "ho":"H&O Apps"};
var NOME_PESSOA = {"marcus":"Marcus", "anamaria":"Anamaria", "marco":"Marco Antonio", "anabeatriz":"Ana Beatriz Hess", "lucas":"Lucas"};

// uma linha da tabela (padrão: TabelaP com topo dourado, células centralizadas, nada abreviado). Com o botão Editar ligado, tipo e chave viram campos e gravam ao sair do campo (data e quem alterou).
var CEL = "h-8 border-b border-border px-2.5 py-1 text-center text-[13px] leading-snug";   // texto longo quebra em 2 linhas, nunca é cortado
// favorecido sempre resumido: as duas primeiras palavras (Marcus, 04/11/2026); o nome completo fica no title
var resumoFav = function(t){ return String(t||"").trim().split(/\s+/).slice(0, 2).join(" "); };
// grupo FECHADO: só uma barra dourada de largura inteira, resumo numa linha só começando pela esquerda (Marcus, 04/11/2026); aberto vira a tabela com as colunas
function BarraGrupo(p){
  return e("button",{type:"button", "aria-expanded":false, title:"Abrir o grupo", onClick:p.onClick, className:"flex h-8 w-full cursor-pointer items-center rounded-lg px-3 text-left text-[13px] font-semibold whitespace-nowrap text-[#1a1306]", style:{background:"linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)"}}, "▸ "+p.texto);
}
function LinhaChave(p){
  var r = p.r, ed = p.edita;
  var salvaChave = function(v){ v = v.trim(); if(v!==r.chave) r.salva({chave:v, tipo:r.tipo || tipoDe(v)}); };
  return e("tr",{className:p.i%2 ? "bg-white/[.03]" : ""},
    e("td",{className:CEL}, r.c1),
    e("td",{className:CEL+" font-semibold"}, r.c2),
    p.temBanco && e("td",{className:CEL}, r.banco || "—"),
    e("td",{className:CEL, title:r.fav || undefined}, resumoFav(r.fav) || "—"),
    e("td",{className:CEL}, ed ? e("select",{value:r.tipo, "aria-label":"Tipo de chave Pix de "+r.c2, className:CAMPO, onChange:function(ev){ r.salva({chave:r.chave, tipo:ev.target.value}); }}, TIPOS.map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })) : (ROTULO[r.tipo] || "—")),
    e("td",{className:CEL+" whitespace-nowrap"}, ed ? e("input",{key:r.id+"|"+r.chave, defaultValue:r.chave, placeholder:"chave Pix", "aria-label":"Chave Pix de "+r.c2, className:CAMPO, onBlur:function(ev){ salvaChave(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }})
      : e("span",{className:"inline-flex items-center justify-center gap-2"}, e("span",{className:"font-mono font-semibold", style:r.chave ? undefined : {color:"#FBBF24"}}, r.chave || "sem chave Pix"), r.chave && e(CopiarChave,{texto:r.chave, rot:"Pix"}))),
    e("td",{className:CEL}, dh(r.em)),
    e("td",{className:CEL}, r.por || "—"));
}

export function AbaChavesPixBancos(){
  var cx = use(), s = cx.state, sc = s.saldosContas, px = s.px, cpf = (s.cp && s.cp.func) || {}, cch0 = (s.cp && s.cp.chaves) || {}, eu = nomeDe(s.usuario), d = cx.dispatch, foco = s.cpxFoco;
  // completa com as chaves do arquivo local quando o estado salvo ainda não as tem (o estado do servidor manda, e pode estar atrás)
  var cch = Object.assign({}, cch0); extrasSeed().forEach(function(x){ var cur = cch[x[0]] || {}; cch[x[0]] = Object.assign({}, cur, {grupo:x[1], nome:cur.nome || x[2], banco:cur.banco || x[3], servico:cur.servico || x[4], favorecido:cur.favorecido || x[7] || ""}, cur.chave ? {} : {chaveTipo:x[5], chave:x[6]}); });
  var comSeed = function(k, nome){ return (k && k.chave) ? k : Object.assign({}, k, chaveAdminDaConta(nome) || {}); };
  var sb = useState(foco ? (foco.busca||"") : ""), busca = sb[0], setBusca = sb[1];
  var sa = useState({}), abertos = sa[0], setAbertos = sa[1];
  var st = useState(foco ? foco.aba : "cnpjs"), aba = st[0], setAba = st[1];
  var se = useState(false), edita = se[0], setEdita = se[1];
  var sm = useState("cnpj"), modoFunc = sm[0], setModoFunc = sm[1];
  useEffect(function(){ if(foco) d({type:"CHAVESPIX_LIMPA"}); }, []);
  var viewFam = temAutorizacao("financeiro_familia", s.usuario);
  var gravaFunc = function(nome){ return function(pt){ d({type:"CP", op:"func_set", nome:nome, por:eu, patch:{chave:pt.chave, chaveTipo:pt.tipo, chaveEm:Date.now(), chavePor:eu}}); }; };
  var gravaChave = function(id, base){ return function(pt){ d({type:"CP", op:"chave_set", id:id, por:eu, base:base, patch:{chave:pt.chave, chaveTipo:pt.tipo, chaveEm:Date.now(), chavePor:eu}}); }; };
  var rowDeChave = function(id, c1, c2, base){ var k = cch[id] || {}; if(!k.chave && id.indexOf("rep|")===0) k = Object.assign({}, k, extraSeed(id) || {}); return {id:id, c1:c1, c2:c2, banco:k.banco || (base && base.banco) || "", fav:k.favorecido || "", chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:gravaChave(id, base)}; };

  // ── CNPJs: contas bancárias (aplicações e dinheiro não têm chave Pix; retidos também não)
  var blocosCnpj = (sc.blocos||[]).map(function(b){
    var contas = (sc.contas||[]).filter(function(c){ return c.bloco===b.id && c.tipo!=="CAIXA" && !c.bloqueada && !/rotativo|garantida/i.test(c.nome); });   // Rotativo e Conta Garantida são limite de outra conta: não têm chave Pix própria (Marcus, 04/11/2026)
    return {id:b.id, nome:NOME_CNPJ[b.id] || b.nome, cor:COR[b.id]||"#64748B", rows:contas.map(function(c){ var k = comSeed(contaDaCaixa(px, c.id), c.nome); return {id:c.id, c1:NOME_CNPJ[b.id] || b.nome, c2:c.nome, chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:function(pt){ d({type:"PX", op:"caixa_chave", caixaId:c.id, nome:c.nome, cnpj:c.bloco, em:Date.now(), por:eu, chave:pt.chave, tipo:pt.tipo}); }}; })};
  }).filter(function(b){ return b.rows.length; });

  // coluna CNPJ: o número completo da empresa (Marcus, 04/11/2026); bloco sem CNPJ (Itaú Marco PJ, particular) mantém o nome
  blocosCnpj.forEach(function(b){ b.rows.forEach(function(r){ r.fav = FAV_EMPRESA[b.id] || ""; r.c2 = String(r.c2).replace(/\s+(34|46|59|67)$/, ""); });   // coluna Banco sem o número do CNPJ (já está na coluna CNPJ)
    var rc = b.rows.find(function(r){ return r.tipo==="CNPJ" && cnpjFormatado(r.chave); }); if(rc) b.rows.forEach(function(r){ r.c1 = "CNPJ "+cnpjFormatado(rc.chave); }); });

  // ── Fornecedores (nome e o que fornecem, como o Marcus passou); a chave fica guardada pelo nome
  var FORNECEDORES = [["Pontual", "Banho joias"], ["Ellos Galvânica", "Banho joias"], ["MegaSul", "Bruto joias"], ["Linda", "Bruto joias"], ["Tucano", "Bruto joias"], ["Charme", "Bruto joias"], ["Art Ello", "Bruto joias"], ["Xangai", "Bruto joias"], ["Point", "Peças"], ["Office Graf", "Gráfica"], ["Devmaster", "Sistema"], ["Ello Print", "Tintas"]];
  var rowsForn = FORNECEDORES.map(function(x){ return rowDeChave("forn|"+x[0], x[1], x[0], {grupo:"forn", nome:x[0], servico:x[1]}); });
  var blocosForn = [{id:"forn", nome:"Fornecedores", cor:"#EA580C", fixo:true, rows:rowsForn}];

  // ── Funcionários: como na tela Funcionários do RH (por CNPJ ou por setor)
  var cn = cnpjsDe(s.cnpjs), nomeCnpjDe = function(id){ var c = cn.find(function(x){ return x.id===id; }); return c ? (c.num ? "CNPJ "+c.num+" · " : "")+c.nome : "CNPJ a informar"; };
  var funcs = funcionarios(), rowDeFunc = function(f, c1){ var k = cpf[f.nome] || {}; return {id:f.nome, c1:c1, c2:f.nome, chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:gravaFunc(f.nome)}; };
  var blocosFunc = modoFunc==="setor"
    ? FUNCIONARIOS_POR_SETOR.map(function(st, i){ return {id:"s|"+st[0], nome:st[0], cor:["#B8892B", "#BE185D", "#0F766E", "#1D4ED8", "#6D28D9", "#0E7490", "#B45309", "#15803D", "#9333EA", "#DC2626"][i % 10], rows:funcs.filter(function(f){ return f.setor===st[0]; }).map(function(f){ return rowDeFunc(f, nomeCnpjDe(f.cnpj)); })}; })
    : cn.map(function(c){ return {id:"c|"+c.id, nome:(c.num ? "CNPJ "+c.num+" · " : "")+c.nome, cor:c.cor || "#64748B", rows:funcs.filter(function(f){ return f.cnpj===c.id; }).map(function(f){ return rowDeFunc(f, f.setor); })}; }).concat([{id:"c|", nome:"CNPJ a informar", cor:"#64748B", rows:funcs.filter(function(f){ return !f.cnpj; }).map(function(f){ return rowDeFunc(f, f.setor); })}]);
  blocosFunc = blocosFunc.filter(function(b){ return b.rows.length; });
  var palavrasFunc = funcs.map(function(f){ return palavras(f.nome); });
  var jaFunc = function(nome){ var pw = palavras(nome); return pw.length>0 && palavrasFunc.some(function(fw){ return pw.every(function(w){ return fw.indexOf(w)>=0; }); }); };

  // ── Representantes (04/11/2026, Marcus: todas as chaves Pix num lugar só): a lista vem de Pessoas; a chave fica guardada pelo nome em s.cp.chaves e o app da representante lê daqui (Pix representante)
  var rowsRep = REPRESENTANTES.map(function(r){ return rowDeChave("rep|"+r.nome, r.tambemFunc ? "Também funcionária" : "Representante", r.nome, {grupo:"rep", nome:r.nome}); });
  var blocosRep = [{id:"rep", nome:"Representantes", cor:"#0E7490", fixo:true, rows:rowsRep}];

  // ── Família: contas pessoais, um bloco por pessoa (sempre aberto)
  var personas = (s.ff && s.ff.personas) || [], idDaPessoa = function(nome){ var n = norm(nome); var p = personas.find(function(x){ return norm(x.nome)===n; }); return p ? p.id : n.split(" ")[0]; };
  var rowsPorPessoa = {};
  if(viewFam) Object.keys(cch).filter(function(k){ return cch[k].grupo==="pes"; }).forEach(function(k){ var pid = idDaPessoa(cch[k].nome); (rowsPorPessoa[pid] = rowsPorPessoa[pid] || []).push(rowDeChave(k, cch[k].banco || "", cch[k].nome, {grupo:"pes", nome:cch[k].nome, banco:cch[k].banco, servico:cch[k].servico})); });
  var blocosPes = viewFam ? ORDEM_PESSOAS.map(function(pid){ return {id:"pes|"+pid, nome:NOME_PESSOA[pid], cor:COR_PESSOA[pid], fixo:true, vazio:"Nenhuma chave cadastrada", rows:rowsPorPessoa[pid] || []}; }) : [];

  // ── Prestadores de serviço: empresa + particulares (por pessoa) + universal (Greice); quem já é funcionário não repete
  var rowsEmp = [];
  Object.keys(cch).filter(function(k){ return cch[k].grupo==="prest"; }).forEach(function(k){ rowsEmp.push(rowDeChave(k, cch[k].servico || "Prestador de serviço", cch[k].nome, {grupo:"prest", nome:cch[k].nome, banco:cch[k].banco, servico:cch[k].servico})); });
  Object.keys(cpf).filter(function(k){ return cpf[k].extra; }).forEach(function(k){ var x = cpf[k]; rowsEmp.push({id:"cp|"+k, c1:"Prestador sem registro", c2:k, chave:x.chave||"", tipo:x.chaveTipo || tipoDe(x.chave), em:x.chaveEm||0, por:x.chavePor||"", salva:gravaFunc(k)}); });
  var porDono = {}, universais = [];
  if(viewFam) ((s.ff && s.ff.prest) || []).filter(function(x){ var n = norm(x.nome); return x.ativo!==false && OCULTAR.indexOf(n)<0 && !jaFunc(x.nome); }).forEach(function(x){ var n = norm(x.nome);
    var sd = !x.chavePixEm ? extrasSeed().find(function(z){ return z[0]==="ffp|"+n; }) : null;   // chave do arquivo local vale enquanto ninguém editou a chave na tela
    var row = {id:"ff|"+x.id, c1:SERVICO_EXIBE[n] || x.servico || "Particular", c2:NOME_EXIBE[n] || x.nome, banco:sd ? sd[3] : "", fav:sd ? (sd[7] || "") : "", chave:sd ? sd[6] : (x.chavePix||""), tipo:sd ? sd[5] : (x.chavePixTipo || tipoDe(x.chavePix)), em:x.chavePixEm||0, por:x.chavePixPor||"", salva:function(pt){ d({type:"FF", op:"prest_set", id:x.id, por:eu, patch:{chavePix:pt.chave, chavePixTipo:pt.tipo, chavePixEm:Date.now(), chavePixPor:eu}}); }};
    if(UNIVERSAL.indexOf(n)>=0) universais.push(row); else { var dono = x.responsavelId || "marcus"; (porDono[dono] = porDono[dono] || []).push(row); } });
  var blocosPrest = [{id:"pr|empresa", nome:"Empresa (Sorelly)", cor:COR_PESSOA.empresa, fixo:true, vazio:"Nenhum prestador cadastrado", rows:rowsEmp}];
  if(viewFam) blocosPrest = blocosPrest.concat(["marcus", "anamaria", "marco", "anabeatriz"].map(function(pid){ return {id:"pr|"+pid, nome:NOME_PESSOA[pid]+" · particular", cor:COR_PESSOA[pid], fixo:true, vazio:"Nenhum prestador cadastrado", rows:porDono[pid] || []}; }), [{id:"pr|universal", nome:"Universal · usado por todos", cor:COR_PESSOA.universal, fixo:true, vazio:"Nenhum prestador cadastrado", rows:universais}]);

  var todos = {cnpjs:blocosCnpj, forn:blocosForn, func:blocosFunc, rep:blocosRep, pes:blocosPes, prest:blocosPrest}, blocos = todos[aba];
  var q = norm(busca);
  var visiveis = blocos.map(function(b){
    var casaB = !q || norm(b.nome).indexOf(q)>=0;
    return Object.assign({}, b, {rows:b.rows.filter(function(r){ return casaB || norm(r.c1+" "+r.c2+" "+r.chave+" "+r.por+" "+(ROTULO[r.tipo]||"")).indexOf(q)>=0; })});
  }).filter(function(b){ return b.rows.length || (b.fixo && !q); });
  var conta = function(bs){ return bs.reduce(function(t, b){ return t+b.rows.length; }, 0); };
  var total = conta(blocos), sem = blocos.reduce(function(t, b){ return t+b.rows.filter(function(r){ return !r.chave; }).length; }, 0);
  var geral = ABAS.reduce(function(t, a){ return t+conta(todos[a[0]]); }, 0), geralSem = ABAS.reduce(function(t, a){ return t+todos[a[0]].reduce(function(u, b){ return u+b.rows.filter(function(r){ return !r.chave; }).length; }, 0); }, 0);
  var abre = function(v){ var o = {}; blocos.forEach(function(b){ o[b.id] = v; }); setAbertos(o); };
  var temFechavel = blocos.some(function(b){ return !b.fixo; });
  var H = CAB[aba].slice(); if(aba==="func") H[0] = modoFunc==="cnpj" ? "Setor" : "CNPJ";
  // cada grupo é uma tabela com o resumo no topo dourado (nome, quantas chaves e quantas sem chave); clicar no topo abre/fecha; "Abrir todos" / "Fechar todos" na linha de cima
  var aberto = function(b){ return abertos[b.id]===undefined ? aba!=="func" : abertos[b.id]; };
  var alterna = function(id){ var o = Object.assign({}, abertos); o[id] = abertos[id]===undefined ? aba==="func" : !abertos[id]; setAbertos(o); };
  var todosAbertos = visiveis.length>0 && visiveis.every(aberto);
  var temBanco = aba!=="cnpjs" && aba!=="pes";
  var resumoDe = function(b){ var n = b.rows.length, sem = b.rows.filter(function(r){ return !r.chave; }).length; return b.nome+" · "+n+(aba==="cnpjs" ? (n===1 ? " conta" : " contas") : (n===1 ? " chave" : " chaves"))+(sem ? " · "+sem+" sem chave" : ""); };
  var colunasDe = function(b){ var ab = aberto(b), rs = resumoDe(b); return [{t:e("button",{type:"button", "aria-expanded":ab, onClick:function(){ alterna(b.id); }, className:"w-full cursor-pointer text-center font-semibold uppercase"}, (ab ? "▾ " : "▸ ")+rs), d:rs, w:"22rem"}, {t:H[1], w:"11rem"}].concat(temBanco ? [{t:"Banco", w:"8rem"}] : [], [{t:"Favorecido", w:"11rem"}, {t:"Tipo de chave", w:"7rem"}, {t:"Chave Pix"}, {t:"Data de alteração", w:"9rem"}, {t:"Quem alterou", w:"6.5rem"}]); };
  return e(Pagina,null,
    // UMA linha só (Marcus, 04/11/2026: compacto): abas visíveis, busca, organizar por (Funcionários) e Editar; o nome da tela já está na faixa do topo
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e(AbasTela,{abas:ABAS, atual:aba, onMudar:function(k){ setAba(k); setBusca(""); }}),
      e("input",{type:"search", value:busca, placeholder:"Buscar nome, banco, chave ou quem alterou", "aria-label":"Buscar", className:CAMPO+" ml-1 max-w-72", onChange:function(ev){ setBusca(ev.target.value); }}),
      aba==="func" && e(Segmentado,{opcoes:[["cnpj", "Por CNPJ"], ["setor", "Por setor"]], atual:modoFunc, onMudar:setModoFunc}),
      e("span",{className:"ml-auto flex gap-2"}, e(Botao,{onClick:function(){ abre(!todosAbertos); }, title:todosAbertos ? "Fechar todos os grupos" : "Abrir todos os grupos"}, todosAbertos ? "Fechar todos" : "Abrir todos"), e(Botao,{principal:edita, onClick:function(){ setEdita(!edita); }, title:edita ? "Terminar a edição" : "Abrir os campos para editar"}, edita ? "Concluir edição" : "Editar"))),
    edita && e("p",{className:"text-[13px] text-foreground"}, "Edição ligada: mude o tipo ou digite a chave e saia do campo (ou aperte Enter). Grava na hora, com a data e o seu nome."),
    visiveis.map(function(b){
      if(!aberto(b)) return e(BarraGrupo,{key:b.id, texto:resumoDe(b), onClick:function(){ alterna(b.id); }});
      return e(TabelaP,{key:b.id, minW:1400, cols:colunasDe(b)}, b.rows.length ? b.rows.map(function(r, i){ return e(LinhaChave,{key:r.id+"|"+r.chave+"|"+r.em+"|"+r.tipo, r:r, i:i, edita:edita, temBanco:temBanco}); }) : e("tr",null, e("td",{colSpan:temBanco ? 8 : 7, className:CEL}, b.vazio || "Nada aqui")));
    }),
    !visiveis.length && e("p",{className:"py-6 text-center text-[13px] text-foreground"}, (aba==="pes") && !viewFam ? "Esta parte só aparece para quem tem acesso à família (sócios)." : "Nada encontrado."));
}
