// Quem pode abrir cada módulo (provisório: por SETOR da pessoa; ajustar aqui com o Marcus).
// A Diretoria (perfil ADMIN) abre tudo. Os demais abrem o módulo se um dos setores da pessoa (usuario_login.setores) estiver na lista dele; "*" = todo mundo logado.
// ATENÇÃO: neste atalho a permissão é por MÓDULO inteiro. "Ver só os próprios pedidos" dentro de um módulo continua sendo regra da tela, não do servidor; por isso dados sensíveis ficam em módulos de setor restrito.
// Chaves = nomes do estado do sistema (s.rh, s.cf, s.ce ...).
export const SETORES_DO_MODULO = {
  rh: ["rh"], eq: ["rh"],
  cf: ["cobranca"], ff: ["socios"],
  ce: ["*"],
  pf: ["financeiro"], cp: ["financeiro"], px: ["financeiro"], lp: ["financeiro", "linkpag"], contasEmpresa: ["financeiro"],
  agend: ["agendamento", "financeiro"],
  av: ["rh", "cadastro"], cl: ["cadastro"], ind: ["cadastro", "kitsnovos"],
  pk: ["montagem", "cadastro"], pr: ["producao", "montagem"], ex: ["encomendas", "montagem"], cpc: ["pecas"],
  mk: ["marketing"], gr: ["garantia"],
  sc: ["financeiro"],   // saldos das contas bancárias (Financeiro › Contas bancárias): compartilhados entre quem lança (Nayale, Marcus), 28/10/2026
  pfmes: ["financeiro"],   // resumo do mês dos fornecedores (planilha Pag Fornecedores, RESUMO MÊS): gravado por scripts/planilha-fornecedores.mjs, lido pelo Direcionar Pix (28/10/2026)
  ri: ["agendamento"],   // revendedoras do atendimento interno (lista, contatos e agenda da Tamara): Agendamento e Diretoria (28/10/2026)
  chathor: ["*"],   // horário de trabalho de cada colaborador para a faixa do alto da conversa do SorellyChat (só nome, entrada, saída e dias; sem salário nem CPF)
  kn: ["*"],   // kits novos direcionados pela Michele às representantes (29/10/2026): todo mundo logado lê, para o kit chegar no app da representante em qualquer aparelho
  mel: ["*"],   // solicitações de melhorias (28/10/2026): todo funcionário lê e envia; quem responde (Diretoria e Desenvolvimento) é regra da tela
  inicio: ["*"],   // comunicados da página inicial (27/10/2026): todo mundo logado lê; quem publica é a Diretoria (regra da tela)
  revdia: ["*"],   // total de revendedoras do dia (automático, DevMaster): todo mundo logado pode ler
  contasreceber: ["financeiro"],   // tela Contas a receber (DevMaster, só leitura): Financeiro e Diretoria (27/10/2026)
  fatdia: ["financeiro"],   // faturamento do dia anterior (automático, DevMaster): só financeiro (e Diretoria, que já abre tudo)
};

export function podeModulo(usuario, modulo) {
  if (usuario?.perfil === "ADMIN") return true;
  const lista = SETORES_DO_MODULO[modulo];
  if (!lista) return false;
  if (lista.includes("*")) return true;
  return (usuario?.setores || []).some((s) => lista.includes(s));
}

export const SETORES_VALIDOS = ["rh", "cobranca", "socios", "financeiro", "linkpag", "agendamento", "cadastro", "kitsnovos", "montagem", "producao", "encomendas", "pecas", "marketing", "garantia"];
