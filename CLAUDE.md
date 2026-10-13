# Sorelly Admin

Painel interno da Sorelly Joias (semijoias em consignação). Responda sempre em português do Brasil.
Usuário: Marcus (dono, não programador): explique em linguagem simples e sem jargão.

## Stack e comandos
Vite 6 + React 18 + React Router 6 + Tailwind 4. Alias `@` = `src/`. Sem testes automatizados.
- `npm run dev` (http://localhost:5173, config em `.claude/launch.json`, porta automática), `npm run build`, `npm run preview`.
- Verificar mudança: abrir no navegador embutido, exercitar o fluxo, checar o console. Mostrar o sistema rodando, nunca mostrar código.
- Depois de testar, limpar o localStorage (`sorelly_montagem_v9`) e não deixar acertos de teste em revendedoras de demonstração. Não abrir este projeto e os HTMLs antigos no mesmo navegador (mesma chave).

## Como o código é escrito
- Telas usam `React.createElement` (`import { e } from "@/shared/react"`), não JSX. Siga o estilo do arquivo.
- Dois apps independentes, cada um com `ui/`, `state/`, `domain/` próprios: `src/apps/montagem/` (principal) e `src/apps/kits-novos/`. Não unifique os `ui/`.
- Rotas: `src/router/rotas.js`. Menu: `apps/montagem/navigation/{abas,setores}.js` + `router/slugs.js`. Passo a passo no README.md.
- Estado: reducer + `localStorage`; `state.aba` é a tela ativa e a URL acompanha. Mudou o formato do estado? Suba a versão salva.
- Números e regras ficam em `apps/montagem/domain/` e no Configurador; nunca valor fixo dentro de tela. O que muda no admin muda no app.

## Regras detalhadas (carregadas só quando você trabalha na pasta)
- `src/apps/montagem/domain/CLAUDE.md`: faturamento, acerto, brindes, taxas, Kit 100% Prata, peças do próximo mês.
- `src/apps/montagem/pages/CLAUDE.md`: menu de Kits, listagens, calculadora, análise de vendas, condicionais, peças por kit.
- `src/apps/kits-novos/CLAUDE.md`: fluxo da Michele, indicações, recusas.

## Economia de tokens
- NÃO leia arquivos grandes inteiros: Grep e depois Read com `offset`/`limit`. Maiores: `mobile/representante.js` (104 KB), `reducer.js` (37 KB), `AtendimentoInternoCalculadora.js` (36 KB), `PrevisaoFaturamento.js` (25 KB), `revendedoras-diario.js` (21 KB), `consignado.js` (20 KB).
- NUNCA abra `referencia/` (HTMLs originais de 1,2 MB), `public/dados/*.json`, `dist/` nem `node_modules/`.
- Prefira Edit em trechos pequenos. Não reescreva arquivos.

## Pessoas e setores
**Acesso é por setor/perfil, não por pessoa.** Cada setor enxerga só o que é dele. No código use perfil/setor; o nome é só quem ocupa o cargo hoje e pode mudar (ex.: condicionais era Gabi, agora Marjory).
- **Diretoria:** Marcus (dono), Nickolas, Lucas. Veem tudo. Definem preço de peças.
- **Montagem e bipagem de kits:** responsável do setor Deysiane (supervisão). Montadoras (8) e bipadoras (6, ex.: Natasha).
- **Condicionais:** responsável hoje Marjory (antes Gabi).
- **Kits novos e Indicação:** Michele (supervisor Nickolas).
- **Cadastro de peças:** Rayssa (supervisora) e Graziella.
- **Faturamento diário:** Amanda lança.
- **Desenvolvimento:** Leonardo e devs (levam o sistema para produção; aqui só se definem regras e telas).
- **Dinheiro** (valor do kit, vendas, comissões): só a supervisão da montagem e a diretoria. Montadora e bipadora nunca veem valor; bipadora nunca vê o valor esperado. Kits novos vê só a tela de Kit novo, com o valor do kit.

## Setores do menu (`navigation/setores.js`)
Legenda: **pronto** = tela existe · **a trazer** = existe no admin antigo, falta integrar · **em breve** = só placeholder.
- **Visão geral**: pronto. **Chamados**: em breve.
- **Financeiro**: Previsão de faturamento e Contas a pagar = pronto. A trazer: histórico de contas, saldos bancários, saldo das contas (PIX), fiscal, financeiro familiar, cobrança. Em breve: link de pagamento, maquininhas, leilão.
- **Cadastro de revendedoras**: Kits novos (5 telas) e Avaliação das representantes = pronto. A trazer: ficha única, revendedoras diárias, aprovação, origem e campanhas, métricas, indicações, avaliações.
- **Kits**: pronto (Listagens, Calculadora de acertos, Painel, Condicionais, Calculadora de kits, Análise de vendas, Consolidado, Regras, Equipe, Registros, Relatórios, App da representante, Regras e Configurações das representantes). A trazer: Metas. Em breve: Produção.
- **Materiais e estoque**: Estoque Sorelly a trazer; cadastro de peças, materiais e compras em breve.
- **Encomendas e reposições**: só a página "Regras" está pronta (reposição NÃO é oferecida às revendedoras por ora; o sistema abre direto nela por pedido do Marcus, 07/10/2026, trocar em `router/rotas.js` quando ele pedir). Encomendas e Reposições = em breve.
- **RH**: "Funcionários e representantes" = pronto (só leitura; lista em `domain/pessoas.js`, 70 funcionários por setor e CNPJ + 24 representantes sem CPF/CNPJ ainda; CPF só a diretoria vê; totais na Visão geral). Total da operação = 70 CLT + 5 sócios/família + 3 PJ (H&O Apps) = 78; representantes à parte. **Acessos por setor** (RH, `pages/Acessos.js`, `navigation/perfis.js`, `state.acessos`): matriz setor × tela, só diretoria e Anamaria editam; acesso total = Marcus, Anamaria (mãe), Nickolas, Lucas, Amanda de Miranda e Deysiane; família (Marco Antonio, Ana Beatriz) = tudo menos Configuradores; comissões com valores só diretoria e Nayale. Pendente: representantes só com dados próprios (precisa de login) e tirar as demonstrações Marcus Hess, Priscila e Rosana. Ponto e horas extras = em breve.
- **Garantia, Segurança e limpeza, Marketing, Equipes**: em breve.
- **Tecnologia**: Configurador geral = pronto (um só para todos os configuradores).
- **Apps de celular simulados** (ícones no topo): representante, revendedora, montagem, bipagem, condicionais. **Métricas**: usa Relatórios.

## Fluxo da empresa, pessoas e acessos
**Documento completo e atualizado: `FLUXO-DA-EMPRESA.md` (raiz). Leia antes de mexer em RH, Acessos, Diretoria ou fluxos; atualize ao decidir algo novo.** O resumo abaixo é o rascunho antigo; vale o documento.
Marketing (artes, conteúdo, tráfego pago com o Diego) gera leads → Cadastro de revendedoras → Michele (Kits novos) distribui: para uma representante OU para ir na Sorelly. Daí dois fluxos:
- **Representante (rua):** acerto no app dela; os kits voltam à empresa, muitas vezes 20, 30, 50 quase juntos (acumulam). Quem bipa os RETORNOS: meninas da bipagem de envios, do cadastro de revendedoras, a Michele (kit novo), a Hellen (link de pagamento) e a Rayssa (cadastro de peças). Elas usam o Consolidado das representantes só para conferir o que a representante bipou na rua (nome, pagamentos, brindes, peças do próximo mês); depois agendamento confere dinheiro/condicional e o financeiro concilia (Comissões). Bipar retorno é setor difícil e deve entrar no comissionamento.
- **Atendimento interno (revendedora vem à Sorelly):** uma funcionária bipa o acerto (~20 min); ao clicar "terminei de bipar" começa o ATENDIMENTO de montagem do kit (Leci ou meninas da produção acompanham a revendedora); na volta, a funcionária clica para bipar o kit novo. Medir tempo de cada etapa; a revendedora avalia (notificação) quem bipou e quem atendeu; bonificação para quem atende e quem bipa (ninguém quer atender). Quem atende muda sempre e é flexível: quem quiser atender entra no comissionamento.
- **Ciclo:** Cadastro de peças libera peças para a Produção → montagem de kits → volta ao começo (fluxo infinito).
- **Criado (08/10/2026):** Diretoria → Fluxo da empresa (`pages/FluxoEmpresa.js`, aba `fluxo`, só sócios/direção/família; blocos clicáveis com as pessoas do setor, setas animadas ilustrativas, sem números ao vivo ainda). "Comissões e desempenho" ainda é "em breve".
- Decidido em 08/10/2026: setor novo no menu **Diretoria**, com "Fluxo da empresa" e "Comissões e desempenho" (escolhe o setor; a Deysiane vê só as funcionárias dela). RH fica só com pessoas e acessos.
- **Comissionamento geral:** TODO mundo pode ser comissionado pelas atividades (bipar retorno, atender, montar etc.); quem tem comissão em dois lugares SOMA. Integração depois, valores no Configurador.
- **Fluxograma:** caixas por setor, coloridas, com ícone e bonequinhos dos funcionários; setas animadas (kits/revendedoras "passando" entre setores); clicar na caixa abre a tela do setor; números ao vivo em cada caixa (fase 2).

## Entrada (login) — 09/10/2026
Tela de usuário e senha (`components/tela-login.js`) é a porta de entrada do site e também aparece dentro do celular de Montagem, Bipagem e Condicionais. É o MESMO site no celular de todas; muda só o que cada setor enxerga. Apps de representante e revendedora são apps de iPhone à parte (não passam por aqui). **A senha é ignorada** (protótipo; contas reais já existem na produção, segurança é do Leonardo): o usuário só precisa bater com uma pessoa (ex.: "marcushess"). Depois de entrar cada pessoa cai direto no seu setor (`LOGIN` em reducer.js: montadora → app da montadora, bipadora → app da bipagem, condicionais → app das condicionais, agendamento/financeiro → Consolidado, diretoria → Visão geral). Nos celulares simulados a diretoria vê a tela de entrada e a lista "Conectar como" ao lado; quem já entrou pelo site vai direto para o app. "Sair" fica no seletor de acesso do topo (`SAIR`). "Criar agora" só avisa que o acesso é liberado pelo RH/diretoria.

## Cadastro de peças (só levantamento, nada criado)
Hoje a peça chega por foto e texto no WhatsApp (modelo, custo, quantidade, fornecedor, preço, markup). Objetivo: fazer dentro do Admin. Rayssa/Graziella lançam, a diretoria define o preço, cadastro POR MODELO. Fase 1 simples: lançar e gerar relatório. Não criar nada antes de alinhar com o Marcus. Ainda a confirmar: o que é peça "de luxo" e como se calcula o markup.

## Como o Marcus quer trabalhar
- Perguntas curtas, poucas por vez (3), por escrito no chat; nada de blocos de múltipla escolha.
- "Anote, não faça ainda" = só anotar e perguntar. "Me dá um norte" = não criar nada, perguntar primeiro.
- Antes de agir, confirmar qual tela é; ele se irrita quando misturo abas ou faço sem entender.
- Um assunto por conversa, pedidos agrupados, poucos testes visuais. Respostas rápidas e diretas.
- Não adicionar nada que ele não pediu. Menos texto explicativo na tela, mais ícones e leitura limpa.
- Visual: letras brancas (não cinza), tema dourado. Apps: cores sólidas, sem degradê. Admin: degradê dourado leve. Dinheiro como `R$ 7.000,00`; campo de dinheiro digitado "subindo" os dígitos.

## Git
Branch `master`, 2 commits e várias alterações não commitadas. Só commitar quando o Marcus pedir.
