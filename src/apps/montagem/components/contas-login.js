// Sorelly Admin — components/contas-login.js
// Lista de todas as contas (você, a diretoria e os funcionários) com usuário e senha, por setor. Só a diretoria vê (tela Acessos, em RH).
// Visual de 12/11/2026: bloco azul com planilha (BlocoPainel + TabelaPlanilha), igual ao Financeiro.
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { SETORES_LOGIN } from "@/apps/montagem/components/seletor-acesso";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { SENHA_PADRAO, usuarioDe } from "@/apps/montagem/components/tela-login";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { e } from "@/shared/react";

var COLS = [{k:"setor", t:"Setor"}, {k:"pessoa", t:"Pessoa"}, {k:"usuario", t:"Usuário"}, {k:"senha", t:"Senha"}];

function ContasLogin(p){
  var grupos = SETORES_LOGIN().filter(function(g){ return g[1].length; }), linhas = [];
  grupos.forEach(function(g){ g[1].forEach(function(p){ linhas.push({id:g[0]+"_"+p.id, setor:PAPEL_LB[g[0]], pessoa:p.nome, usuario:usuarioDe(p), senha:SENHA_PADRAO}); }); });
  return e(BlocoPainel,{titulo:"Contas de acesso", compacto:true, fechado:p && p.fechado, aoTitulo:p && p.aoTitulo},
    e(TabelaPlanilha,{semContagem:true, grade:true, chave:"id", linhas:linhas, cols:COLS, vazio:"Nenhuma conta"}));
}

export { ContasLogin };
