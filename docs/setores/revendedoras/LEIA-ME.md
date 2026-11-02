# Revendedoras (base de todos os setores)

> Resumo do setor, atualizado em 02/11/2026. Fontes: `CLAUDE.md`, `docs/negocio/FLUXO-DA-EMPRESA.md` e `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`. "(a confirmar)" = falta confirmar com o Marcus. Ao falar deste setor, o Claude lê este arquivo primeiro.

## 1. O que o setor faz
Lista das revendedoras lida da DevMaster (só leitura): só as que têm condicional aberto e previsão em 2026. É a base que todos os setores usam.

## 2. Quem
- **Líder:** Diretoria (por ora só a diretoria acessa)
- **Pessoas:** não é um setor da planilha do RH.

## 3. Telas no sistema
- Revendedoras ativas e ficha (`pages/RevendedorasAtivas.js`)

## 4. Integração com outros setores
- **Recebe de:** DevMaster API 2 (leitura)
- **Entrega para:** Todos os setores
- Mapa completo: `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`

## 5. Regras que valem
- Representante = vendedor do kit principal. Vendedor 04 (Expositor) e 91 (Encomendas) não são representantes.
- Só leitura da DevMaster: os POST gravam no ERP de verdade.

## 6. Documentos do setor
- `docs/negocio/REVENDEDORAS-E-PREVISAO.md`

## 7. Em aberto (principais)
- Etapa 2: situação, kits e vendas.
- Etapa 3: correção do tipo pela funcionária.
- Lista completa tirada do diário: `pendencias.md` desta pasta (13 itens, a conferir).

## 8. Arquivos desta pasta
- `decisoes.md`: 25 decisões copiadas do diário geral.
- `pendencias.md`: o que o diário diz que falta.
