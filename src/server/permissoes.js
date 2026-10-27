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
  inicio: ["*"],   // comunicados da página inicial (27/10/2026): todo mundo logado lê; quem publica é a Diretoria (regra da tela)
  revdia: ["*"],   // total de revendedoras do dia (automático, DevMaster): todo mundo logado pode ler
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
