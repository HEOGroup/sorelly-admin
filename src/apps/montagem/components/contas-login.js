// Sorelly Admin — components/contas-login.js
// Lista de todas as contas (você, a diretoria e os funcionários) com usuário e senha, por setor. Só a diretoria vê (tela Acessos, em RH).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { SETORES_LOGIN } from "@/apps/montagem/components/seletor-acesso";
import { SENHA_PADRAO, usuarioDe } from "@/apps/montagem/components/tela-login";
import { PAPEL_LB } from "@/apps/montagem/navigation/perfis";
import { MONO } from "@/apps/montagem/ui/input";
import { e } from "@/shared/react";

function ContasLogin(){
  var grupos = SETORES_LOGIN().filter(function(g){ return g[1].length; }), total = grupos.reduce(function(t,g){ return t+g[1].length; },0);
  return e(BlocoBarra,{t:"Contas de acesso", sub:total+" pessoas com usuário e senha · senha padrão "+SENHA_PADRAO+" (até o login real da produção)"},
    e("div",{className:"grid grid-cols-1 gap-2 p-2 md:grid-cols-2 xl:grid-cols-3"}, grupos.map(function(g){
      return e("div",{key:g[0], className:"flex flex-col gap-1 rounded-xl bg-black/25 p-2.5"},
        e("b",{className:"text-[11px] uppercase tracking-wide text-primary"}, PAPEL_LB[g[0]]),
        g[1].map(function(p){ return e("div",{key:p.id, className:"flex items-center justify-between gap-2 text-[12.5px]"},
          e("span",{className:"min-w-0 truncate"}, p.nome), e("span",{className:MONO+" shrink-0 text-white/80"}, usuarioDe(p)+" · "+SENHA_PADRAO)); }));
    })));
}

export { ContasLogin };
