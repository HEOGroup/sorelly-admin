// Sorelly Admin · montagem — pages/ContasAcesso.js
// RH → Acessos e autorizações → aba "Contas": quem criou conta no sistema. A Diretoria libera, liga a conta a uma pessoa do sistema e escolhe os setores.
// Uma tabela só (04/11/2026, pedido do Marcus: igual às outras telas, com as travas do padrão visual): topo dourado, tudo centralizado, nada abreviado e sem faixa de totais.
// Cada linha tem login, senha e as ações (Liberar, Bloquear, Copiar mensagem, Nova senha); clicar na linha abre os setores que a pessoa pode abrir.
// Só funciona com o servidor ligado (lib/api.js). Quem não é da Diretoria recebe aviso do próprio servidor. Código do servidor: src/server/contas.js e app/api/contas.
import { Botao, BlocoFiltros, CampoBusca, CampoSel, CAMPO } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { EQUIPE } from "@/apps/montagem/domain/equipe";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { apiAtiva, chamar } from "@/apps/montagem/lib/api";
import { e, useEffect, useState } from "@/shared/react";

// mesmos nomes do servidor (src/server/permissoes.js → SETORES_VALIDOS)
var SETORES = [["rh","RH"], ["cobranca","Cobrança"], ["socios","Sócios"], ["financeiro","Financeiro"], ["linkpag","Link de pagamento"], ["agendamento","Agendamento"], ["cadastro","Cadastro"], ["kitsnovos","Kits novos"], ["montagem","Montagem"], ["producao","Produção"], ["encomendas","Encomendas"], ["pecas","Peças"], ["marketing","Marketing"], ["garantia","Garantia"]];
var ROTULO_STATUS = {aguardando:"Aguardando", ativo:"Ativo", bloqueado:"Bloqueado"};
var COR_STATUS = {aguardando:"text-warning", ativo:"text-success", bloqueado:"text-destructive"};

var GRUPOS_ACESSO = ["supervisao","familia","supervisora","agendamento","financeiro","inadimplencia","bipadora","montadora","listagens","kitnovo","cadastropecas","encomendas","basico"];
var pessoasDoSistema = EQUIPE.map(function(p){ return {id:p.id, nome:p.nome}; }).sort(function(a, b){ return a.nome.localeCompare(b.nome); });
function dataCurta(t){ try { return new Date(t).toLocaleDateString("pt-BR"); } catch(x){ return ""; } }

var ENDERECO = "https://sorelly-admin.vercel.app/";
function mensagemAcesso(c){ var nome = (c.nome || "").split(" ")[0]; return "Oi, " + nome + "! Este é o seu acesso ao sistema da Sorelly.\n\nEndereço: " + ENDERECO + "\nUsuário: " + c.login + "\nSenha: " + c.senhaProvisoria + "\n\nSe esquecer a senha, é só falar comigo."; }
function novaSenha(){ return "sorelly" + (1000 + Math.floor(Math.random() * 9000)); }
var parar = function(ev){ ev.stopPropagation(); };   // mexer num campo da linha não abre nem fecha o detalhe

function AbaContas(){
  var sc = useState(null), contas = sc[0], setContas = sc[1], se = useState(""), erro = se[0], setErro = se[1], sp = useState(""), copiado = sp[0], setCopiado = sp[1], sb = useState(""), busca = sb[0], setBusca = sb[1], ss = useState(""), sit = ss[0];
  var carrega = function(){ chamar("GET", "/contas").then(function(j){ setContas(j.contas); setErro(""); }).catch(function(x){ setErro(x.message); }); };
  useEffect(function(){ if(apiAtiva()) carrega(); }, []);
  var muda = function(id, corpo){ chamar("PATCH", "/contas/"+id, corpo).then(function(j){ setContas(function(l){ return l.map(function(c){ return c.id===id ? j.conta : c; }); }); setErro(""); }).catch(function(x){ setErro(x.message); }); };
  var copia = function(c){ try { navigator.clipboard.writeText(mensagemAcesso(c)); setCopiado(c.id); setTimeout(function(){ setCopiado(""); }, 2000); } catch(x){} };
  if(!apiAtiva()) return e(Pagina,null, e("p",{className:"rounded-lg bg-warning/15 px-3 py-2 text-center text-[13px] font-semibold text-warning"}, "As contas só existem com o sistema ligado ao servidor (sem servidor não há login)."));
  var nomePessoa = function(id){ var x = pessoasDoSistema.find(function(p){ return p.id===id; }); return x ? x.nome : ""; };
  var linhas = (contas || []).map(function(c){ return {id:c.id, c:c, nome:c.nome, email:c.email, login:c.login || "", statusLb:ROTULO_STATUS[c.status] || c.status, pessoa:nomePessoa(c.pessoaId), grupo:c.grupo ? (PAPEL_LB[c.grupo] || c.grupo) : "Pela lista do sistema", perfil:c.perfil==="ADMIN" ? "Diretoria" : "Setor", cid:c.cid || "", senha:c.senhaProvisoria || "já trocou", criada:dataCurta(c.criadoEm), liberadaPor:c.status==="ativo" ? (c.aprovadoPor || "") : ""}; });
  // busca (05/11/2026, Marcus): por nome, usuário, e-mail, pessoa do sistema, grupo ou setor; e filtro de situação. A busca ignora acento e maiúscula.
  var norm = function(t){ return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  var termo = norm(busca).trim(), todasLinhas = linhas.length;
  linhas = linhas.filter(function(l){ return (!sit || l.c.status===sit) && (!termo || norm([l.nome, l.login, l.email, l.pessoa, l.grupo, l.perfil, (l.c.setores || []).join(" ")].join(" ")).indexOf(termo)>=0); });

  var cols = [
    {k:"nome", t:"Nome"},
    {k:"email", t:"E-mail"},
    {k:"login", t:"Usuário", render:function(v, l){ var c = l.c; return e("span",{onClick:parar}, e("input",{key:c.id+"-"+(c.login||""), className:CAMPO+" min-w-36 text-center", defaultValue:c.login||"", placeholder:"ex.: nickolas", maxLength:40, "aria-label":"Usuário de "+c.nome, onBlur:function(ev){ var x = ev.target.value.trim(); if(x!==(c.login||"")) muda(c.id, {login:x}); }})); }},
    {k:"statusLb", t:"Situação", cor:function(l){ return COR_STATUS[l.c.status]+" font-semibold"; }},
    {k:"pessoa", t:"Pessoa do sistema", render:function(v, l){ var c = l.c; return e("span",{onClick:parar}, e("select",{className:CAMPO+" min-w-52", value:c.pessoaId==null ? "" : String(c.pessoaId), "aria-label":"Pessoa do sistema de "+c.nome, onChange:function(ev){ muda(c.id, {pessoaId:ev.target.value==="" ? null : parseInt(ev.target.value)}); }},
      e("option",{value:""}, "Escolher"), pessoasDoSistema.map(function(x){ return e("option",{key:x.id, value:String(x.id)}, x.nome); }))); }},
    {k:"grupo", t:"Grupo de acesso", render:function(v, l){ var c = l.c; return e("span",{onClick:parar}, e("select",{className:CAMPO+" min-w-64", value:c.grupo||"", "aria-label":"Grupo de acesso de "+c.nome, onChange:function(ev){ muda(c.id, {grupo:ev.target.value || null}); }},
      e("option",{value:""}, "Pela lista do sistema"), GRUPOS_ACESSO.map(function(g){ return e("option",{key:g, value:g}, PAPEL_LB[g] || g); }))); }},
    {k:"perfil", t:"Perfil", render:function(v, l){ var c = l.c; return e("span",{onClick:parar}, e("select",{className:CAMPO+" min-w-28", value:c.perfil, "aria-label":"Perfil de "+c.nome, onChange:function(ev){ muda(c.id, {perfil:ev.target.value}); }},
      e("option",{value:"MEMBER"}, "Setor"), e("option",{value:"ADMIN"}, "Diretoria"))); }},
    {k:"cid", t:"Contato do chat", render:function(v, l){ var c = l.c; return e("span",{onClick:parar}, e("input",{key:c.id+"-cid-"+(c.cid||""), className:CAMPO+" min-w-40 text-center", defaultValue:c.cid||"", placeholder:"ex.: f_michelebrito", maxLength:80, "aria-label":"Contato do chat de "+c.nome, onBlur:function(ev){ var x = ev.target.value.trim(); if(x!==(c.cid||"")) muda(c.id, {cid:x}); }})); }},
    {k:"senha", t:"Senha", cor:function(l){ return l.c.senhaProvisoria ? "font-mono" : "text-muted-foreground"; }},
    {k:"criada", t:"Criada em"},
    {k:"liberadaPor", t:"Liberada por"},
    {k:"id", t:"Ações", render:function(v, l){ var c = l.c;
      return e("span",{onClick:parar, className:"flex items-center justify-center gap-1.5"},
        c.status!=="ativo" && e(Botao,{principal:true, desabilitado:c.pessoaId==null, title:c.pessoaId==null ? "Escolha a pessoa do sistema antes de liberar" : "Liberar o acesso", onClick:function(){ muda(c.id, {status:"ativo"}); }}, c.status==="bloqueado" ? "Reativar" : "Liberar"),
        c.status!=="bloqueado" && e(Botao,{onClick:function(){ muda(c.id, {status:"bloqueado"}); }}, "Bloquear"),
        c.login && c.senhaProvisoria && c.status!=="aguardando" && e(Botao,{onClick:function(){ copia(c); }}, copiado===c.id ? "Copiado" : "Copiar mensagem"),
        c.login && c.status!=="aguardando" && e(Botao,{onClick:function(){ if(window.confirm("Gerar uma senha nova para "+c.nome+"? A senha atual deixa de valer.")) muda(c.id, {senha:novaSenha()}); }}, "Nova senha")); }}
  ];

  // ao clicar na linha: os setores (módulos) que a pessoa abre no servidor; Diretoria abre todos
  var detalhe = function(l){ var c = l.c, alterna = function(k){ var s = c.setores.indexOf(k)>=0 ? c.setores.filter(function(x){ return x!==k; }) : c.setores.concat([k]); muda(c.id, {setores:s}); };
    return c.perfil==="ADMIN"
      ? e("p",{className:"px-3 py-2 text-center text-[13px]"}, "Diretoria abre todos os módulos. Os setores não mudam nada.")
      : e("div",{className:"flex flex-col items-center gap-1.5 px-3 py-2"},
          e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Setores que "+c.nome+" abre no servidor"),
          e("div",{className:"flex flex-wrap justify-center gap-1.5"}, SETORES.map(function(s){ var on = c.setores.indexOf(s[0])>=0;
            return e("button",{key:s[0], type:"button", "aria-pressed":on, onClick:function(){ alterna(s[0]); }, className:"h-8 rounded-md border px-3 text-[13px] "+(on ? "border-primary bg-primary/20 font-semibold text-primary" : "border-border bg-card text-foreground hover:bg-white/10")}, s[1]); }))); };

  return e(Pagina,null,
    erro && e("p",{role:"alert", className:"rounded-lg bg-destructive/15 px-3 py-2 text-center text-[13px] font-semibold text-destructive"}, erro),
    e(BlocoFiltros,{onLimpar:function(){ setBusca(""); ss[1](""); }},
      e(CampoBusca,{t:"Buscar pessoa", id:"ct-busca", value:busca, onChange:setBusca, placeholder:"Nome, usuário, e-mail ou setor"}),
      e(CampoSel,{t:"Situação", id:"ct-sit", value:sit, onChange:ss[1], opcoes:[["", "Todas"], ["aguardando", "Aguardando"], ["ativo", "Ativo"], ["bloqueado", "Bloqueado"]]})),
    contas===null && !erro ? e("p",{className:"p-3 text-center text-[13px]"}, "Carregando")
    : e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, semContagem:true, detalhe:detalhe, vazio:todasLinhas ? "Nenhuma conta com esse filtro. Use Limpar." : "Ninguém criou conta ainda. Quem criar na tela de entrada aparece aqui como Aguardando."}));
}
export { AbaContas };
