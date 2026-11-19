// Teste de fumaça da tela RH › Cadastro de colaboradores: desenha no servidor e confere o padrão (topo, tabela com filtro na coluna). Uso: node scripts/testar-tela-colaboradores.mjs
import { createJiti } from "jiti";
import path from "node:path";
const raiz = process.argv[2] || process.cwd();
globalThis.localStorage = { getItem(){ return null; }, setItem(){}, removeItem(){} };
globalThis.window = globalThis.window || { localStorage: globalThis.localStorage, addEventListener(){}, removeEventListener(){}, location:{ search:"" }, matchMedia(){ return { matches:false, addEventListener(){}, removeEventListener(){} }; } };
const jiti = createJiti(path.join(raiz, "x.js"), { alias: { "@": path.join(raiz, "src") }, interopDefault: true });
const React = (await jiti.import("react")).default || (await jiti.import("react"));
const { renderToString } = await jiti.import("react-dom/server");
const { Ctx } = await jiti.import("@/apps/montagem/state/context");
const { AbaRhColab } = await jiti.import("@/apps/montagem/pages/RH");
const { rhDemo } = await jiti.import("@/apps/montagem/domain/rh");
let ok = 0, falha = 0;
const t = (nome, cond, extra) => { if(cond){ ok++; console.log("  OK   "+nome); } else { falha++; console.log("  FALHA "+nome+(extra ? " -> "+extra : "")); } };
let h = "";
try { h = renderToString(React.createElement(Ctx.Provider, {value:{state:{usuario:16, rh:rhDemo()}, dispatch(){}}}, React.createElement(AbaRhColab))); t("desenha a tela sem erro", h.length>1000); } catch(x){ t("desenha a tela sem erro", false, String(x && x.stack || x).slice(0, 400)); }
t("título e botão no topo", /Cadastro de colaboradores/.test(h) && /Nova colaboradora/.test(h));
t("visões Ativos, Desligados e Todos", ["Ativos", "Desligados", "Todos"].every(n => h.includes(">"+n+"<")));
t("colunas da tabela", ["Nome", "Setor", "Função", "Empresa", "Situação", "Admissão", "Escala", "Horário atual", "Equipe 42h", "Salário"].every(n => h.includes(n)));
t("sem bloco Filtros nem busca no topo", !/Filtros/.test(h) && !/Buscar nome ou setor/.test(h));
// ficha completa de uma colaboradora NOVA: todos os blocos abertos e o botão Cadastrar (sem o mini formulário de 4 campos)
const { FormColab } = await jiti.import("@/apps/montagem/pages/RH");
const rhD = rhDemo(), cc = { s:{usuario:16, rh:rhD}, d(){}, rh:rhD, por:"Teste", veSalario:true };
try {
  const hn = renderToString(React.createElement(FormColab, { c:cc, criar:true, fechar(){}, x:{ id:"__novo", nome:"", setor:"Agendamento", cnpj:"", admissao:"", status:"ATIVO", entrada:rhD.config.entradaPadrao, escalaId:rhD.config.escalaPadrao, novo:true } }));
  t("nova colaboradora abre a ficha completa", /Nova colaboradora · ficha completa/.test(hn) && /Trabalho/.test(hn) && /Pessoal/.test(hn) && /Nome completo/.test(hn) && /Empresa \(CNPJ\)/.test(hn));
  t("campos do Trabalho e do Pessoal já abertos", ["Função", "Admissão", "Entrada", "Saída", "Escala", "Plano de experiência", "Telefone", "Cidade", "Nascimento", "Salário", "CPF"].every(n => hn.includes(n)));
  t("botões Cadastrar e Cancelar, sem Editar por bloco", /Cadastrar/.test(hn) && /Cancelar/.test(hn) && !/>Editar</.test(hn));
} catch(x){ t("ficha nova desenha", false, String(x && x.stack || x).slice(0, 300)); }
// cadastro de pessoa nova com a ficha completa: o domínio grava tudo de uma vez
const { rhReduz, colaboradoresRh } = await jiti.import("@/apps/montagem/domain/rh");
const novoR = rhReduz({ rh:rhD }, { type:"RH", op:"colab_add", por:"Teste", nome:"Pessoa de Teste Ficha", setor:"Agendamento", cnpj:"46", admissao:"2026-11-18", dados:{ funcao:"Assistente", telefone:"41999990000", cidade:"Curitiba", salario:2500, entrada:"08:30", cpf:"12345678900" } });
const achada = novoR.patch.rh ? colaboradoresRh({ rh:novoR.patch.rh }).find((x) => x.nome==="Pessoa de Teste Ficha") : null;
t("colab_add grava a ficha completa de uma vez", !!achada && achada.funcao==="Assistente" && achada.cidade==="Curitiba" && achada.salario===2500 && achada.entrada==="08:30" && achada.cnpj==="46" && achada.admissao==="2026-11-18");
// mais dados no cadastro: contato e endereço, mais dados pessoais, documentos e contrato e banco
try {
  const hn2 = renderToString(React.createElement(FormColab, { c:cc, criar:true, fechar(){}, x:{ id:"__novo", nome:"", setor:"Agendamento", cnpj:"", admissao:"", status:"ATIVO", entrada:rhD.config.entradaPadrao, escalaId:rhD.config.escalaPadrao, novo:true } }));
  t("cadastro novo traz os quatro blocos de dados a mais", ["Contato e endereço", "Mais dados pessoais", "Documentos", "Contrato e banco"].every(n => hn2.includes(n)));
  t("campos de endereço, documentos e banco", ["E-mail", "CEP", "Rua", "Contato de emergência", "Estado civil", "Nome da mãe", "RG", "PIS/NIS", "CTPS número", "Tipo de contrato", "Exame admissional (ASO)", "Banco", "Agência", "Chave Pix"].every(n => hn2.includes(n)));
  const semSal = { ...cc, veSalario:false };
  const hn3 = renderToString(React.createElement(FormColab, { c:semSal, criar:true, fechar(){}, x:{ id:"__novo", nome:"", setor:"Agendamento", cnpj:"", admissao:"", status:"ATIVO", entrada:rhD.config.entradaPadrao, escalaId:rhD.config.escalaPadrao, novo:true } }));
  t("quem não vê salário não vê Documentos nem Contrato e banco", !hn3.includes("Documentos") && !hn3.includes("Contrato e banco") && hn3.includes("Contato e endereço"));
} catch(x){ t("blocos de dados a mais desenham", false, String(x && x.stack || x).slice(0, 300)); }
const novo2 = rhReduz({ rh:rhD }, { type:"RH", op:"colab_add", por:"Teste", nome:"Pessoa Dados Completos", setor:"Agendamento", cnpj:"34", dados:{ email:"a@b.com", cep:"80000000", rua:"Rua A", emergNome:"Mae", rg:"123", pis:"456", banco:"Sicredi", pix:"a@b.com", tipoContrato:"CLT", asoData:"2026-11-01" } });
const ach2 = novo2.patch.rh ? colaboradoresRh({ rh:novo2.patch.rh }).find((x) => x.nome==="Pessoa Dados Completos") : null;
t("colab_add grava endereço, documentos e banco", !!ach2 && ach2.email==="a@b.com" && ach2.rua==="Rua A" && ach2.emergNome==="Mae" && ach2.rg==="123" && ach2.banco==="Sicredi" && ach2.tipoContrato==="CLT" && ach2.asoData==="2026-11-01");
// Negociações › Todas: quem tem negociação de joias aparece junto com a hora extra, com a coluna Forma
try {
  const jv = await jiti.import("@/apps/montagem/pages/rh/JoiasVisao");
  const rhJ = JSON.parse(JSON.stringify(rhD)); rhJ.negoc = rhJ.negoc || {pessoas:[], grupos:[]}; rhJ.negoc.joias = [{nome:"Ana Paula Teste Joias", motivo:"Joias", valor:500, periodo:"Mensal"}];
  const cj = { s:{usuario:16, rh:rhJ}, rh:rhJ, d(){}, por:"Teste", veSalario:true };
  const td = jv.negTodas(cj, [{id:"x1", nome:"Fulana Hora Extra", setor:"Agendamento", h1:20, h2:"", h3:"", sab:50}]);
  const ana = td.linhas.find((l) => l.nome==="Ana Paula Teste Joias"), ful = td.linhas.find((l) => l.nome==="Fulana Hora Extra");
  t("Negociações › Todas mostra quem só tem joias, com Forma = Joias", !!ana && ana.forma==="Joias" && /500/.test(ana.joias) && !ana.heId);
  t("Negociações › Todas: só hora extra = Dinheiro, com as colunas Forma, Hora extra e Joias", !!ful && ful.forma==="Dinheiro" && ["Forma", "Hora extra (dinheiro)", "Joias (combinado)"].every((n) => td.cols.some((c2) => c2.t===n)));
  const td2 = jv.negTodas(cj, [{id:"x2", nome:"Beltrana Brinde", setor:"Agendamento", h1:20, h2:"", h3:"", sab:"", forma:"Dinheiro + joias"}]);
  t("Negociações › Todas: a forma escolhida na ficha vale", td2.linhas.find((l) => l.nome==="Beltrana Brinde").forma==="Dinheiro + joias");
} catch(x){ t("Negociações › Todas", false, String(x && x.stack || x).slice(0, 300)); }
console.log("\n"+ok+" verificações OK, "+falha+" com falha.");
process.exit(falha ? 1 : 0);
