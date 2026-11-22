# 05 · Comprovante e pendências

## Regras (Marcus, 20/11/2026)
- **D-03:** o financeiro **pode lançar sem comprovante**. O lançamento fica **Pendente**.
- Motivo real: às 17h55 a representante pede a conta de um pagamento; o Lucas já lança o valor e o nome. O comprovante chega 2 horas depois; ele anexa **no dia seguinte**.
- **D-04:** a tela Contas a receber ganha a coluna **"Falta comprovante"**. Ela lista o que está sem anexo, para ele anexar no dia seguinte.
- Se o Lucas esquecer e outra pessoa lançar no sistema, o lançamento fica pendente no Admin até alguém anexar.
- O comprovante do Pix da revendedora vale para os dois efeitos do caso D (recebimento e pagamento).

## Estados de um lançamento
```
Lançado sem comprovante ─► PENDENTE (falta comprovante)
        │ anexa
        ▼
Com comprovante ─► ainda PENDENTE até a DevMaster registrar
        │ DevMaster bipa e fatura
        ▼
CRUZADO (um só registro)
```

## Aberto
- P-01: depois de quantos dias sem comprovante o sistema avisa?
- P-05: a coluna "Falta comprovante" também existe no Contas a pagar?
