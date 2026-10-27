// Libera as contas combinadas com o Marcus em 27/10/2026 e bloqueia as de teste. Mostra o que mudou. Só mexe nestes e-mails.
//   node --env-file-if-exists=.env.local scripts/liberar-contas.mjs
// Rodar DEPOIS de scripts/migrar-perfil.mjs (precisa das colunas login, abas e ocultar).
import { consulta, pool } from "../src/server/db.js";

// pessoaId = id em domain/equipe.js (Marcus 16, Nickolas 17, Michele 18, Lucas 28, Camilly 46)
const LIBERAR = [
  { email: "contato@sorellyjoias.com.br", login: "nickolas", pessoaId: 17, perfil: "MEMBER",
    setores: ["cadastro", "kitsnovos", "financeiro", "linkpag"],
    // Cadastro de revendedoras (setor inteiro) + Negociações + Link de pagamento (setor) + Compras de peças + Inadimplência
    abas: ["set_cadastro", "set_linkpag", "pfneg", "compras", "inadfin", "inadimp", "cominad"], ocultar: null },
  { email: "adminstrativo@sorellyjoias.com.br", login: "lucas", pessoaId: 28, perfil: "ADMIN", setores: [],
    // igual ao Marcus (tudo), sem Atendimento interno, Cadastro de peças, Encomendas e RH
    abas: null, ocultar: ["atendimento", "cadpecas", "encomendas", "rh"] },
  { email: "kitsnovos.sorellyjoais@gmail.com", login: "michele brito", pessoaId: 18, perfil: "MEMBER", setores: ["kitsnovos", "cadastro"], abas: null, ocultar: null },
  { email: "cadastrosorelly2@gmail.com", login: "camilly sousa", pessoaId: 46, perfil: "MEMBER", setores: ["cadastro"], abas: null, ocultar: null },
];
// nickolasleal678@gmail.com (segunda conta do Nickolas) fica aguardando até o Marcus decidir
const BLOQUEAR = ["robot@robot.com", "seuemail@sorellyjoias.com.br"];

for (const c of LIBERAR) {
  const r = await consulta(
    `update sorelly.conta set status='ativo', perfil=$2, setores=$3, pessoa_id=$4, login=$5, abas=$6, ocultar=$7, aprovado_por='Marcus', atualizado_em=now()
      where lower(email)=lower($1) returning nome, email, login, perfil, setores, abas, ocultar`,
    [c.email, c.perfil, c.setores, c.pessoaId, c.login, c.abas, c.ocultar]);
  console.log(r.rows[0] ? "LIBERADA  " + JSON.stringify(r.rows[0]) : "NÃO ACHEI  " + c.email);
}
for (const email of BLOQUEAR) {
  const r = await consulta("update sorelly.conta set status='bloqueado', atualizado_em=now() where lower(email)=lower($1) returning nome, email, status", [email]);
  console.log(r.rows[0] ? "BLOQUEADA " + JSON.stringify(r.rows[0]) : "NÃO ACHEI  " + email);
}
await pool().end();
