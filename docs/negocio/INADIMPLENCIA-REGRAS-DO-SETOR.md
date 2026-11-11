# Setor de Inadimplência: regras de negócio (Módulo 2, passado pelo Marcus em 11/11/2026)

**Uso interno. NÃO entra em folder nem em PDF da revendedora** (Marcus, 11/11/2026). O folder só diz, em uma frase, que a dívida não negociada vai para o setor de cobrança.
Ligação com o acerto: `REGRA-CANCELAMENTO-E-REMARCACAO.md` (caminho 1 = negociação na hora para levar kit; caminho 2 = este setor). Ainda não construído; a tela atual de Inadimplência segue o fluxo antigo de 26/10/2026.

## 1. Quem cobra e a comissão da representante
- A representante avisa a direção ou o setor e tem **7 dias** para negociar (pagamento parcial, entrada ou previsão), informando valores, datas, parcelas e formas.
- Recuperou o pagamento: a comissão é identificada conforme as regras da empresa. Acompanhou certo e precisou de ajuda do setor: pode manter a comissão.
- **Passar dos 7 dias NÃO tira a comissão sozinho.** Manter ou perder depende de análise do setor (comprometimento e histórico).
- Sistema: mostrar a representante responsável, quem está cobrando, o prazo de 7 dias (sinalizar quando passar), a decisão sobre a comissão com justificativa, e em cada pagamento quem recuperou. Nunca cancelar comissão automaticamente.

## 2. Negociação e parcelamento
- **Sem cartão: até 3 vezes. Cartão de crédito: até 6 vezes, por link de pagamento.**
- Todo acordo tem datas e valores. Pagamento parcial reduz o saldo sozinho. O histórico fica guardado. Sem pagamento no mês: o setor pode rever ou desconsiderar o acordo.
- Sistema: valor original, valor negociado, forma, parcelas, vencimentos, pagas e pendentes, saldo automático, renegociar sem apagar o histórico.

## 3. Status
- **OK** (seguindo o combinado) · **Verificar** (acordo descumprido ou pagamento não feito na data) · **Não responde** · **Próximo mês**.
- **Automático:** parcela ou previsão vencida sem pagamento confirmado = status **Verificar**, com destaque, qual pagamento falta e há quantos dias. Mantém o histórico e deixa o setor regularizar ou renegociar.
- Verificar **não** aplica multa, **não** cancela acordo e **não** manda ao Serasa sozinho.

## 4. Rotina de cobrança
1. Primeiro contato quando o setor assume. 2. Segunda tentativa depois de 2 dias. 3. Terceira tentativa depois de 7 dias, com comunicação final e **48 horas** para ela se manifestar. 4. Acompanhar pagamentos e acordos. 5. Analisar medidas posteriores.
- Sistema: registrar tentativas (data, responsável, resultado), lembretes, devedoras sem retorno, próximas ações, reagendar.

## 5. Pagamentos
- Obrigatório: data, devedora, valor, conta de recebimento, quem recuperou, confirmação do pagamento, baixa na DevMaster.
- Integral ou parcial, com comprovante. O saldo só muda depois da confirmação. **Confirmação do recebimento e baixa na DevMaster são controles separados** (baixa por checkbox; lista dos não baixados).

## 6. Quitação automática
- Pagamento confirmado e saldo R$ 0,00 = dívida **QUITADA** sozinha, com a data. Comprovante sem confirmação não quita. Negativada no Serasa: a quitação gera pendência de regularizar a restrição. A dívida quitada continua nos relatórios históricos.

## 7. Serasa
- Prazo mínimo interno para **analisar** a negativação: **30 dias**. Acordo descumprido pode ir para análise. Kit não devolvido tem prioridade. Registrar data, valor e número da condicional; controlar notificações. Negativada pode ir para avaliação jurídica.
- **Nunca automático:** depende de análise e dos requisitos legais.

## 8. Encargos
- O sistema sinaliza vencidos. **Multa e juros não entram sozinhos**: só com autorização e documentação. Guardar o valor original e os acréscimos autorizados, com histórico.

## 9. Relatórios
- Mensal: novas inadimplências, valor originado, pagamentos, recuperado, em negociação, sem retorno, saldo aberto, % de recuperação. Geral: total histórico, recuperado, saldo, quitadas, em negociação, negativadas, evolução mensal. Separar a data de origem da dívida da data do pagamento.

## 10. Automático x análise
- **Automático:** saldo após pagamento confirmado, status Verificar, quitação com saldo zero, relatórios, tempo em aberto, avisos de prazo.
- **Só com análise ou autorização:** comissão da representante, troca de quem cobra, multas e juros, cancelar ou renegociar acordo, Serasa, Jurídico, baixas excepcionais.

## 11. Conflitos com as regras do acerto (a decidir com o Marcus)
1. Multa de 10% e +1% ao dia são automáticas no acerto; aqui encargo só com autorização. Sugestão: automático só no caminho 1; ao entrar no setor, congela.
2. Texto das regras diz "24 h sem negociar executa a nota"; aqui a rotina é 7 dias da representante + 3 contatos + 48 horas. Sugestão: vale a rotina.
3. Jurídico "no 30º dia útil" x Jurídico e Serasa só com análise. Sugestão: no 30º dia útil o sistema zera comissão e brinde e bloqueia o kit sozinho; Serasa e nota são decisão do setor.
4. Comissão da representante sobre dívida recuperada: hoje entra sozinha na remessa seguinte; aqui depende de quem recuperou e da análise.
5. Atendimento interno não tem representante: sugestão, vai direto ao setor.
6. Tela atual (No prazo, Atrasado, Jurídico, Retirar kit, Executar nota) x status novos (OK, Verificar, Não responde, Próximo mês).
