// Sorelly Admin · montagem — pages/ChavesPixBancos.js
// Financeiro → Bancos → Chaves Pix: TODAS as chaves Pix da Sorelly e da família. Ordem da barra: CNPJs, Fornecedores, Funcionários, Família, Prestadores de serviço. Todas da mesma cor.
// TUDO fica sempre aberto (sem seta, sem Abrir/Fechar todos). Sócios e Prestadores são separados por pessoa (Marcus, Anamaria, Marco Antonio, Ana Beatriz, Lucas); a Greice, usada por todos, fica num bloco "Universal".
// O botão "Editar" fica no alto: ligado, todas as linhas viram campos e gravam ao sair do campo (data e quem alterou).
// Gravação: contas bancárias em s.px (op "caixa_chave"; a mesma chave aparece no Caixa), funcionários e prestadores sem registro em s.cp.func, família/fornecedores/prestador da empresa em s.cp.chaves, prestadores pessoais do Financeiro familiar em s.ff.prest.
// A tela Funcionários (RH) mostra a chave daqui e manda para cá quem quiser editar (s.cpxFoco).
import { Pagina } from "@/apps/montagem/components/padrao";
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { cnpjsDe } from "@/apps/montagem/domain/cnpjs";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { contaDaCaixa } from "@/apps/montagem/domain/pix-regras";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { FUNCIONARIOS_POR_SETOR, funcionarios } from "@/apps/montagem/domain/pessoas";
import { use } from "@/apps/montagem/state/context";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useEffect, useState } from "@/shared/react";

var NOME_CNPJ = {"34":"CNPJ 34 · Sorelly Atacadista", "46":"CNPJ 46 · Mayz Comércio de Moda", "59":"CNPJ 59 · Serenity Porta Joias", "67":"CNPJ 67 · Axis Comércio de Joias", "ho":"H&O Apps", "HO":"H&O Apps", "PART":"Particular", "ITM":"Itaú Marco PJ"};
var COR = {"34":"#B8892B", "46":"#BE185D", "59":"#0F766E", "67":"#1D4ED8", "ho":"#6D28D9", "HO":"#6D28D9", "PART":"#64748B", "ITM":"#0E7490"};
var COR_PESSOA = {"marcus":"#EF9F27", "anamaria":"#16A34A", "marco":"#2563EB", "anabeatriz":"#DB2777", "lucas":"#EA580C", "universal":"#7C3AED", "empresa":"#0D9488"};
var COR_ABA = "#3B82F6";   // todas as partes da barra têm a mesma cor
var TIPOS = [["", "—"], ["CNPJ", "CNPJ"], ["CPF", "CPF"], ["EMAIL", "E-mail"], ["TELEFONE", "Telefone"], ["ALEATORIA", "Aleatória"]];
var ROTULO = {CNPJ:"CNPJ", CPF:"CPF", EMAIL:"E-mail", TELEFONE:"Telefone", ALEATORIA:"Aleatória"};
var COR_TIPO = {CNPJ:"#F59E0B", CPF:"#60A5FA", EMAIL:"#34D399", TELEFONE:"#F472B6", ALEATORIA:"#A78BFA"};
var cpfValido = function(d){ if(d.length!==11 || /^(d)+$/.test(d)) return false; var c = function(n){ var s = 0; for(var i = 0; i<n; i++) s += Number(d[i])*(n+1-i); var r = (s*10)%11; return r===10 ? 0 : r; }; return c(9)===Number(d[9]) && c(10)===Number(d[10]); };
var tipoDe = function(ch){ var s = String(ch||"").trim(), d = s.replace(/D/g, ""); if(!s) return ""; if(s.indexOf("@")>=0) return "EMAIL"; if(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return "ALEATORIA"; if(d.length===14) return "CNPJ"; if(d.length===11) return (s.indexOf("+")>=0 || !cpfValido(d)) ? "TELEFONE" : "CPF"; if(d.length>=10 && d.length<=13) return "TELEFONE"; return "ALEATORIA"; };
var dh = function(ts){ if(!ts) return "—"; var d = new Date(ts); return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear()+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
var GRADE = "grid grid-cols-[15rem_14rem_7.5rem_minmax(15rem,1fr)_9.5rem_7.5rem] items-center gap-x-3 px-3";
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var palavras = function(t){ return norm(t).split(/\s+/).filter(function(w){ return w.length>2 && ["dos","das","del"].indexOf(w)<0; }); };
var BTN = "h-9 rounded-lg px-4 text-[13px] font-bold text-white ring-1 ring-white/25 hover:brightness-125";
var ABAS = [["cnpjs", "CNPJs"], ["forn", "Fornecedores"], ["func", "Funcionários"], ["pes", "Sócios"], ["prest", "Prestadores de serviço"]];
var CAB = {cnpjs:["CNPJ", "Banco"], forn:["Tipo", "Fornecedor"], func:["", "Funcionário"], pes:["Banco", "Nome"], prest:["Serviço", "Prestador"]};
// ajustes do Marcus (20/10/2026) para os prestadores do Financeiro familiar: quem sai, nomes e serviços; a Greice é de todos (universal)
var OCULTAR = ["julia marketing", "marcus poupanca", "greicy anamaria", "greyci ana beatriz", "lucas castilho"];
var NOME_EXIBE = {"greicy":"Greice", "ulisses detran":"Serviço Detran"};
var SERVICO_EXIBE = {"rebel mode":"Carros Marcus", "68 gang performance":"Carros Marcus", "greicy":"Casa (todos)"};
var UNIVERSAL = ["greicy"];
var ORDEM_PESSOAS = ["marcus", "anamaria", "marco", "anabeatriz", "lucas"];
var NOME_PESSOA = {"marcus":"Marcus", "anamaria":"Anamaria", "marco":"Marco Antonio", "anabeatriz":"Ana Beatriz Hess", "lucas":"Lucas"};

// uma linha: dados em colunas; com o botão Editar do alto ligado, tipo e chave viram campos
function LinhaChave(p){
  var r = p.r, ed = p.edita, cor = p.cor;
  var salvaChave = function(v){ v = v.trim(); if(v!==r.chave) r.salva({chave:v, tipo:r.tipo || tipoDe(v)}); };
  return e("div",{className:GRADE+" min-h-[2.6rem] py-1.5", style:{background:p.i%2 ? "#ffffff0d" : "#00000033"}},
    e("span",{className:"min-w-0 truncate text-left text-[13.5px] font-semibold text-white", title:r.c1}, r.c1),
    e("span",{className:"min-w-0 truncate text-left text-[14px] font-bold text-white", title:r.c2}, r.c2),
    ed ? e("select",{value:r.tipo, "aria-label":"Tipo de chave Pix de "+r.c2, className:INPUT+" h-8! w-full cursor-pointer px-1! text-[12.5px]!", onChange:function(ev){ r.salva({chave:r.chave, tipo:ev.target.value}); }}, TIPOS.map(function(t){ return e("option",{key:t[0], value:t[0]}, t[1]); }))
      : e("span",{className:"justify-self-center text-center text-[13px] font-semibold text-white"}, ROTULO[r.tipo] || "—"),
    ed ? e("input",{key:r.id+"|"+r.chave, defaultValue:r.chave, placeholder:"chave Pix", "aria-label":"Chave Pix de "+r.c2, className:INPUT+" h-8! w-full text-[13px]!", onBlur:function(ev){ salvaChave(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }})
      : e("div",{className:"flex min-w-0 items-center gap-2"}, e("span",{className:"min-w-0 truncate text-left font-mono text-[13.5px] font-bold", style:{color:r.chave ? "#fff" : "#FBBF24"}, title:r.chave}, r.chave || "sem chave Pix"), r.chave && e(CopiarChave,{texto:r.chave, rot:"Pix"})),
    e("span",{className:"text-center text-[12.5px] font-semibold text-white"}, dh(r.em)),
    e("span",{className:"truncate text-center text-[13px] font-semibold text-white"}, r.por || "—"));
}

export function AbaChavesPixBancos(){
  var cx = use(), s = cx.state, sc = s.saldosContas, px = s.px, cpf = (s.cp && s.cp.func) || {}, cch = (s.cp && s.cp.chaves) || {}, eu = nomeDe(s.usuario), d = cx.dispatch, foco = s.cpxFoco;
  var sb = useState(foco ? (foco.busca||"") : ""), busca = sb[0], setBusca = sb[1];
  var sa = useState({}), abertos = sa[0], setAbertos = sa[1];
  var st = useState(foco ? foco.aba : "cnpjs"), aba = st[0], setAba = st[1];
  var se = useState(false), edita = se[0], setEdita = se[1];
  var sm = useState("cnpj"), modoFunc = sm[0], setModoFunc = sm[1];
  useEffect(function(){ if(foco) d({type:"CHAVESPIX_LIMPA"}); }, []);
  var viewFam = temAutorizacao("financeiro_familia", s.usuario);
  var gravaFunc = function(nome){ return function(pt){ d({type:"CP", op:"func_set", nome:nome, por:eu, patch:{chave:pt.chave, chaveTipo:pt.tipo, chaveEm:Date.now(), chavePor:eu}}); }; };
  var gravaChave = function(id, base){ return function(pt){ d({type:"CP", op:"chave_set", id:id, por:eu, base:base, patch:{chave:pt.chave, chaveTipo:pt.tipo, chaveEm:Date.now(), chavePor:eu}}); }; };
  var rowDeChave = function(id, c1, c2, base){ var k = cch[id] || {}; return {id:id, c1:c1, c2:c2, chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:gravaChave(id, base)}; };

  // ── CNPJs: contas bancárias (aplicações e dinheiro não têm chave Pix; retidos também não)
  var blocosCnpj = (sc.blocos||[]).map(function(b){
    var contas = (sc.contas||[]).filter(function(c){ return c.bloco===b.id && c.tipo!=="CAIXA" && !c.bloqueada; });
    return {id:b.id, nome:NOME_CNPJ[b.id] || b.nome, cor:COR[b.id]||"#64748B", rows:contas.map(function(c){ var k = contaDaCaixa(px, c.id) || {}; return {id:c.id, c1:NOME_CNPJ[b.id] || b.nome, c2:c.nome, chave:k.chave||"", tipo:k.chaveTipo || tipoDe(k.chave), em:k.chaveEm||0, por:k.chavePor||"", salva:function(pt){ d({type:"PX", op:"caixa_chave", caixaId:c.id, nome:c.nome, cnpj:c.bloco, em:Date.now(), por:eu, chave:pt.chave, tipo:pt.tipo}); }}; })};
  }).filter(function(b){ return b.rows.length; });

  // ── Fornecedores (nome e o que fornecem, como o Marcus passou); a chave fica guardada pelo nome
  var FORNECEDORES = [["Pontual", "Banho joias"], ["Ellos Galvânica", "Banho joias"], ["MegaSul", "Bruto joias"], ["Linda", "Bruto joias"], ["Tucano", "Bruto joias"], ["Charme", "Bruto joias"], ["Art Ello", "Bruto joias"], ["Point", "Peças"], ["Office Graf", "Gráfica"], ["Devmaster", "Sistema"], ["Ello Print", "Tintas"]];
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
    var row = {id:"ff|"+x.id, c1:SERVICO_EXIBE[n] || x.servico || "Particular", c2:NOME_EXIBE[n] || x.nome, chave:x.chavePix||"", tipo:x.chavePixTipo || tipoDe(x.chavePix), em:x.chavePixEm||0, por:x.chavePixPor||"", salva:function(pt){ d({type:"FF", op:"prest_set", id:x.id, por:eu, patch:{chavePix:pt.chave, chavePixTipo:pt.tipo, chavePixEm:Date.now(), chavePixPor:eu}}); }};
    if(UNIVERSAL.indexOf(n)>=0) universais.push(row); else { var dono = x.responsavelId || "marcus"; (porDono[dono] = porDono[dono] || []).push(row); } });
  var blocosPrest = [{id:"pr|empresa", nome:"Empresa (Sorelly)", cor:COR_PESSOA.empresa, fixo:true, vazio:"Nenhum prestador cadastrado", rows:rowsEmp}];
  if(viewFam) blocosPrest = blocosPrest.concat(["marcus", "anamaria", "marco", "anabeatriz"].map(function(pid){ return {id:"pr|"+pid, nome:NOME_PESSOA[pid]+" · particular", cor:COR_PESSOA[pid], fixo:true, vazio:"Nenhum prestador cadastrado", rows:porDono[pid] || []}; }), [{id:"pr|universal", nome:"Universal · usado por todos", cor:COR_PESSOA.universal, fixo:true, vazio:"Nenhum prestador cadastrado", rows:universais}]);

  var todos = {cnpjs:blocosCnpj, forn:blocosForn, func:blocosFunc, pes:blocosPes, prest:blocosPrest}, blocos = todos[aba];
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
  var mbtn = function(k, t){ var on = modoFunc===k; return e("button",{key:k, type:"button", onClick:function(){ setModoFunc(k); }, className:"h-9 rounded-lg px-3 text-[13px] font-bold text-white ring-1 "+(on ? "ring-white/60" : "ring-white/15"), style:{background:on ? COR_ABA : "#ffffff0d"}}, t); };
  return e(Pagina,null,
    e("div",{className:"flex flex-wrap items-end justify-between gap-2"},
      e("div",null, e("h1",{className:"font-heading text-[24px] font-bold leading-tight text-white"}, "Chaves Pix"), e("p",{className:"text-[13.5px] font-semibold text-white"}, "CNPJs, fornecedores, funcionários, sócios e prestadores de serviço."))),
    // barra que troca de tela: todas da mesma cor
    e("div",{className:"flex flex-wrap items-center gap-2"}, ABAS.map(function(a){ var on = aba===a[0]; return e("button",{key:a[0], type:"button", onClick:function(){ setAba(a[0]); setBusca(""); }, className:"h-10 rounded-xl px-5 text-[14px] font-bold text-white ring-1 transition "+(on ? "ring-white/60" : "ring-white/15 hover:brightness-125"), style:{background:on ? COR_ABA : "#ffffff0d", boxShadow:on ? "0 0 0 1px "+COR_ABA : undefined}}, a[1]); })),
    // buscar, abrir/fechar e editar: à esquerda
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("input",{type:"search", value:busca, placeholder:"Buscar nome, banco, chave ou quem alterou", "aria-label":"Buscar", className:INPUT+" h-9! w-72 text-[13px]!", onChange:function(ev){ setBusca(ev.target.value); }}),
      aba==="func" && e("span",{className:"ml-2 text-[13px] font-semibold text-white"}, "Organizar por:"), aba==="func" && mbtn("cnpj", "CNPJ"), aba==="func" && mbtn("setor", "Setor"),
      e("button",{type:"button", onClick:function(){ setEdita(!edita); }, className:BTN, title:edita ? "Terminar a edição" : "Abrir os campos para editar", style:{background:edita ? "linear-gradient(135deg,#16A34A,#15803D)" : "linear-gradient(135deg,#3B82F6,#2563EB)"}}, edita ? "✓ Concluir edição" : "✏ Editar")),
    edita && e("p",{className:"rounded-lg px-3 py-1.5 text-[12.5px] font-semibold text-white", style:{background:"#2563EB33", boxShadow:"inset 0 0 0 1px #3B82F6"}}, "Edição ligada: mude o tipo ou digite a chave e saia do campo (ou aperte Enter). Grava na hora, com a data e o seu nome."),
    e("div",{className:"overflow-x-auto rounded-xl"}, e("div",{className:"flex min-w-[64rem] flex-col gap-2"},
      e("div",{className:GRADE+" rounded-lg py-2 text-[12px] font-bold uppercase tracking-wide text-[#F3D98B]", style:{background:"#00000066"}}, [[H[0], "text-left"], [H[1], "text-left"], ["Tipo de chave", "text-center"], ["Chave Pix", "text-left"], ["Data de alteração", "text-center"], ["Quem alterou", "text-center"]].map(function(h, i){ return e("span",{key:i, className:h[1]}, h[0]); })),
      visiveis.map(function(b){
        var ab = true;
        return e("div",{key:b.id, className:"overflow-hidden rounded-lg", style:{boxShadow:"inset 0 0 0 1px "+b.cor+"55"}},
          e("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-0.5 px-3 py-2", style:{background:"linear-gradient(90deg,"+b.cor+"66,"+b.cor+"14)"}},
            e("span",{className:"text-[15px] font-bold text-white"}, b.nome)),
          ab && (b.rows.length ? e("div",null, b.rows.map(function(r, i){ return e(LinhaChave,{key:r.id+"|"+r.chave+"|"+r.em+"|"+r.tipo, r:r, i:i, edita:edita, cor:b.cor}); })) : e("p",{className:"px-3 py-2 text-center text-[13px] font-semibold text-white", style:{background:b.cor+"14"}}, b.vazio || "Nada aqui")));
      }))),
    !visiveis.length && e("p",{className:"py-6 text-center text-[14px] text-white"}, (aba==="pes") && !viewFam ? "Esta parte só aparece para quem tem acesso à família (sócios)." : "Nada encontrado."));
}
