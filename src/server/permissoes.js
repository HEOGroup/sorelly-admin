// Quem pode abrir cada módulo (provisório: por SETOR da pessoa; ajustar aqui com o Marcus).
// A Diretoria (perfil ADMIN) abre tudo. Os demais abrem o módulo se um dos setores da pessoa (usuario_login.setores) estiver na lista dele; "*" = todo mundo logado.
// ATENÇÃO: neste atalho a permissão é por MÓDULO inteiro. "Ver só os próprios pedidos" dentro de um módulo continua sendo regra da tela, não do servidor; por isso dados sensíveis ficam em módulos de setor restrito.
// Chaves = nomes do estado do sistema (s.rh, s.cf, s.ce ...).
export const SETORES_DO_MODULO = {
  rhsol: ["*"],   // solicitações de mudança de cadastro: quem pede (supervisão do setor) e quem confirma (RH) precisam ler e gravar
  rh: ["rh"], eq: ["rh"],
  cf: ["cobranca"], ff: ["socios"],
  inad: ["cobranca"],   // setor de Inadimplência (11/11/2026): dívidas, pagamentos, Serasa e kits em atraso; uma chave por registro. Só a Amanda de Miranda (setor cobranca) e a Diretoria
  ce: ["*"],
  pf: ["financeiro"], cp: ["financeiro"], px: ["financeiro"], lp: ["financeiro", "linkpag", "agendamento"],   // Link de pagamento: o Agendamento (atendimento interno) lê os links já pagos da revendedora e registra o link pago por fora (11/11/2026)
  contasEmpresa: ["financeiro"],
  agend: ["agendamento", "financeiro"],
  av: ["rh", "cadastro"], cl: ["cadastro"], ind: ["cadastro", "kitsnovos"],
  er: ["encomendas"],   // Encomendas e reposições (30/10/2026): pedidos, Top 50 e horários, compartilhados pelo setor Encomendas (Diretoria abre tudo)
  pk: ["montagem", "cadastro"], pr: ["producao", "montagem"], ex: ["encomendas", "montagem", "agendamento"], cpc: ["pecas"],   // agendamento dá baixa quando o expositor volta (09/11/2026); cpc = Cadastro de peças (a chave estava dentro do comentário e ficou sem efeito)
  mk: ["marketing"], gr: ["garantia"],
  fc: ["marketing"],   // Marketing › Fotos de catálogo (10/11/2026): controle das fotos das peças novas; só Marketing e Diretoria
  mod: [],   // Marketing › Modelos (veio das Encomendas em 12/11/2026): Diretoria e as pessoas de PESSOAS_DO_MODULO (Castilho); a tela também confere a autorização modelos_ver
  tp: ["marketing"],   // Marketing › Tráfego pago (05/11/2026): investimento em anúncios, leads e cadastradas do Diego; só Marketing e Diretoria
  rc: ["*"],   // quem é Kit 100% Prata (12/11/2026): todo mundo logado lê (atendimento, agendamento, representantes) e a marcação vale igual em todos os computadores
  sc: ["financeiro"],   // saldos das contas bancárias (Financeiro › Contas bancárias): compartilhados entre quem lança (Nayale, Marcus), 28/10/2026
  es: ["financeiro"],   // Estoque Sorelly (Financeiro, 09/11/2026): posição mensal do estoque de peças, números altos; só Financeiro e Diretoria
  fx: ["financeiro"],   // Fiscal (Financeiro, 09/11/2026): notas de entrada, saídas e contas por CNPJ, carregados do admin antigo; só Financeiro e Diretoria
  pfmes: ["financeiro"],   // resumo do mês dos fornecedores (planilha Pag Fornecedores, RESUMO MÊS): gravado por scripts/planilha-fornecedores.mjs, lido pelo Direcionar Pix (28/10/2026)
  agrev: ["agendamento"],   // alterações da Agenda de revendedoras (troca de representante, data do acerto, observação) feitas pela Ana Maria enquanto a DevMaster ainda manda (29/10/2026)
  ri: ["agendamento"],   // revendedoras do atendimento interno (lista, contatos e agenda da Tamara): Agendamento e Diretoria (28/10/2026)
  chathor: ["*"],   // horário de trabalho de cada colaborador para a faixa do alto da conversa do SorellyChat (só nome, entrada, saída e dias; sem salário nem CPF)
  kndados: ["kitsnovos", "cadastro"],   // planilha de kits novos da Michele (03/11/2026): dados reais só no servidor, nunca no Git
  lst: ["*"],   // listagens de retirada e os kits delas (05/11/2026, Marcus): a Montagem, a Bipagem, as Condicionais e as representantes veem a MESMA listagem em qualquer aparelho. Dados reais só no servidor, nunca no Git.
  aci: ["*"],   // registros de acerto do atendimento interno (10/11/2026): o Consolidado Sorelly precisa do mesmo registro em todos os computadores; uma chave por acerto
  int: ["*"],   // atendimentos do Atendimento interno (10/11/2026, Marcus): quem atende e quem acompanha veem o mesmo atendimento em andamento; uma chave por atendimento
  pag: ["*"],   // pedidos de conta (09/11/2026, Marcus): o atendimento interno e as representantes ENVIAM, e TODO o Financeiro recebe na fila do Direcionar; uma chave por pedido
  kn: ["*"],   // kits novos direcionados pela Michele às representantes (29/10/2026): todo mundo logado lê, para o kit chegar no app da representante em qualquer aparelho
  mel: ["*"],   // solicitações de melhorias (28/10/2026): todo funcionário lê e envia; quem responde (Diretoria e Desenvolvimento) é regra da tela
  inicio: ["*"],   // comunicados da página inicial (27/10/2026): todo mundo logado lê; quem publica é a Diretoria (regra da tela)
  revdia: ["*"],   // total de revendedoras do dia (automático, DevMaster): todo mundo logado pode ler
  contasreceber: ["financeiro"],   // tela Contas a receber (DevMaster, só leitura): Financeiro e Diretoria (27/10/2026)
  fd: ["financeiro"],   // faturamento e contas pagas por dia lançados pela equipe (corte do admin antigo, 29/10/2026): Financeiro e Diretoria
  fatdia: ["financeiro"],   // faturamento do dia anterior (automático, DevMaster): só financeiro (e Diretoria, que já abre tudo)
  // App real da representante (05/11/2026, src/server/estado-itens.js): uma linha por item, o app grava pelo servidor e a equipe pelo navegador.
  rpo: ["montagem", "kitsnovos", "cadastro", "agendamento", "encomendas", "financeiro", "producao"],   // operação: listagens e kits das representantes (sem valores de acerto)
  rpf: ["financeiro", "agendamento"],   // financeiro: acertos, entregas de kit novo e reposições registrados no app (Consolidado, Comissões, Inadimplência)
};

// Módulos que uma PESSOA específica abre além da Diretoria e dos setores da lista (Marcus, 12/11/2026): Castilho (47, Marketing) abre Modelos e Metas.
export const PESSOAS_DO_MODULO = { mod: [47], metas: [47] };

export function podeModulo(usuario, modulo) {
  if (usuario?.perfil === "ADMIN") return true;
  if ((PESSOAS_DO_MODULO[modulo] || []).includes(usuario?.pessoaId)) return true;
  const lista = SETORES_DO_MODULO[modulo];
  if (!lista) return false;
  if (lista.includes("*")) return true;
  return (usuario?.setores || []).some((s) => lista.includes(s));
}

export const SETORES_VALIDOS = ["rh", "cobranca", "socios", "financeiro", "linkpag", "agendamento", "cadastro", "kitsnovos", "montagem", "producao", "encomendas", "pecas", "marketing", "garantia"];

// Contas SÓ PARA VISUALIZAR (Marcus, 29/10/2026): veem os módulos que o setor deixa, mas não gravam nada, exceto onde a lista diz.
// chave = pessoaId; valor = setores em que a pessoa PODE alterar. Ana Beatriz (30): só Financeiro. Marco Antonio (31): em nenhum.
// Chat, perfil (foto e senha) e pedidos de melhoria continuam livres para todos.
const SOMENTE_LEITURA = { 30: ["financeiro"], 31: [] };
export const ehSomenteLeitura = (usuario) => usuario?.perfil !== "ADMIN" && usuario?.pessoaId != null && Object.prototype.hasOwnProperty.call(SOMENTE_LEITURA, usuario.pessoaId);
// true = a gravação deve ser recusada (caminho = pathname da rota; só chamar para métodos que alteram)
export function bloqueiaEscrita(usuario, caminho) {
  if (!ehSomenteLeitura(usuario)) return false;
  if (/^\/api\/(chat|perfil|auth)\//.test(caminho)) return false;
  const podem = SOMENTE_LEITURA[usuario.pessoaId];
  const m = /^\/api\/estado\/([^/]+)/.exec(caminho);
  if (m) {
    if (m[1] === "mel") return false;
    const lista = SETORES_DO_MODULO[m[1]] || [];
    return !lista.some((s) => podem.includes(s));
  }
  if (/^\/api\/faturamento\//.test(caminho)) return !podem.includes("financeiro");
  return true;
}
