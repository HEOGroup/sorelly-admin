// Sorelly Admin · montagem — domain/autorizacoes.js
// AUTORIZAÇÕES: quem pode FAZER cada coisa (decidir, conferir, configurar, bipar...). Um catálogo só; o RH ajusta em RH → Acessos e autorizações → "Quem pode fazer o quê".
// A lista de cada autorização fica em s.autoriz[chave] (ids de pessoas); sem ajuste vale o padrão abaixo.
// Duas autorizações já tinham lista própria e continuam lá: gerenciar o Agendamento (s.agend.config.gerentes) e bipar retornos (s.bipaRetorno).
var CATALOGO = [
  {k:"cadastro_decide", setor:"Cadastro de revendedoras", t:"Aprovar ou reprovar cadastros", desc:"Decide a fila de Aprovação de cadastros e desfaz decisões.", padrao:[16,17,28]},
  {k:"financeiro_confere", setor:"Financeiro", t:"Conferir pagamentos e definir contas", desc:"Define as contas e confirma os pagamentos do atendimento interno.", padrao:[16,28,29,17,37]},
  {k:"compra_aprova", setor:"Materiais e estoque · Compras", t:"Aprovar, reprovar e liberar para compra", desc:"Decide as solicitações de compra (aprova ou reprova com motivo), libera a compra aprovada (só liberação, ou já definindo como comprar) e cancela compras já aprovadas.", padrao:[16,28,29,17,37]},
  {k:"compra_efetua", setor:"Materiais e estoque · Compras", t:"Efetuar compras liberadas", desc:"Marca a compra efetuada depois que o financeiro liberou. Quando a liberação foi só um OK, define como comprar (plano de pagamento, parcelas no cartão).", padrao:[27,28,16,17,37]},
  {k:"comissao_config", setor:"Financeiro · Comissões", t:"Alterar regras e valores das comissões", desc:"Abre a configuração das comissões das representantes.", padrao:[16,17,37]},
  {k:"financeiro_familia", setor:"Financeiro", t:"Ver o Financeiro da família", desc:"Mostra Família e Sorelly + Família em Contas a pagar. Sem esta liberação a pessoa só vê a Sorelly.", padrao:[16,28,29,27,37]},
  {k:"pagamento_registra", setor:"Financeiro", t:"Registrar pagamento no Contas a pagar", desc:"Mostra as caixas de seleção e o botão Registrar pagamento (dar baixa nos boletos) e o Desfazer baixa em Contas a pagar. Sem esta liberação a tela só mostra.", padrao:[16,27,29,17,37]},
  {k:"faturamento_edita", setor:"Financeiro", t:"Editar o Consolidado do faturamento", desc:"Mostra o botão Editar no Consolidado do faturamento (revendedoras, acertos, faturamento e contas de cada mês). Sem esta liberação a tela só mostra os valores.", padrao:[16,17,37]},
  {k:"rh_presenca_chat", setor:"RH", t:"Ver a presença dos colaboradores no chat", desc:"Mostra, na conversa com cada colaborador, as bolinhas dos últimos 10 dias de trabalho (presença, atraso, atestado e falta) e o resumo do mês. O horário de trabalho todos podem ver. Lista fixa (Marcus, 27/10/2026): Marcus, Maria (RH), Anamaria, Nickolas e Lucas, só isso.", padrao:[16,38,29,17,28]},
  {k:"pf_limite_aprova", setor:"Financeiro · Pagamentos a fornecedores", t:"Aprovar pedido acima do limite mensal", desc:"Pedido que estoura o teto de R$ 300 mil do mês (ou o da categoria: Banho, Bruto, Serviços) fica pendente até esta pessoa aprovar. Também ajusta o limite e a classificação dos fornecedores.", padrao:[16,17,37]},
  {k:"p45_aprova", setor:"Agendamento · Plano 45/60", t:"Aprovar, reprovar e importar o plano 45/60", desc:"Decide a fila de Aprovação (fixa o mínimo de vendas), desfaz decisões, importa a planilha e ajusta a meta do Agendamento. Aprovada e mudando de mês, a revendedora sai da meta de um mês e entra no outro.", padrao:[16,17,28]},
  {k:"p45_lanca", setor:"Agendamento · Plano 45/60", t:"Lançar e corrigir indicações do plano 45/60", desc:"Lança a indicação das representantes (nome completo, datas, média), corrige linhas e registra o contato. Quem aprova também lança. Acrescente aqui a pós-venda que coordena a lista.", padrao:[24,25,26]},
  {k:"agend_gerencia", setor:"Agendamento", t:"Gerenciar o mês, as cotas e o configurador", desc:"Abrir e fechar o mês, mudar cotas e configurar. A diretoria sempre pode.", especial:"agend"},
  {k:"retorno_bipa", setor:"Representantes", t:"Bipar os retornos dos kits", desc:"Dar o OK de cada retorno bipado e abrir o Consolidado.", especial:"bipa"}
];
var OVR = {};   // ajustes vindos do estado (App.js chama definirAutorizacoes a cada mudança)
function definirAutorizacoes(o){ OVR = o || {}; }
function listaDe(k){ if(OVR[k]) return OVR[k]; var c = CATALOGO.filter(function(x){ return x.k===k; })[0]; return c && c.padrao ? c.padrao : []; }
function temAutorizacao(k, id){ return listaDe(k).indexOf(id)>=0; }
export { CATALOGO, definirAutorizacoes, listaDe, temAutorizacao };
