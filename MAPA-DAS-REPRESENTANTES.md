# Mapa das representantes (regiões, horários e viagens)

Documento vivo. **Gerado em 26/10/2026 a partir do sistema** (`src/apps/kits-novos/domain/regioes-rep.js` e `viagens-rep.js`). Tudo que o Marcus passou pelo WhatsApp está aqui, para não se perder. Onde o sistema e este arquivo divergirem, vale o sistema; atualize este arquivo ao mudar o mapa.

Tela: Kits novos › Representantes (abas Regiões, Horários, Viagens e Indicação). Rota: `/montagem/revendedoras-novas`.

## 1. Como o sistema indica o kit novo

- Cobertura: bairro (50 pontos), cidade (40), cidade inteira (35). Prioridade de bairro +20.
- Horários em comum com a revendedora: +4 cada, até 40.
- Carga: até 120 revendedoras ganha pontos (quanto menos, mais); acima de 120 perde 25. "Fortalecer" = até 80 (valor provisório).
- −6 por kit em aberto e −8 por recusa. Representante bloqueada por muitas recusas fica fora.
- **"Não atende"** (região marcada pela própria representante) tira a representante da lista nessa região. Exemplo: Vanessa não quer Piraquara.
- Ao solicitar o kit, o sistema sugere até 3 representantes com o motivo escrito; a Michele confirma.
- Funcionárias (◆) só atendem **depois do expediente** (RH): Ana Maria, Nayale, Rayssa, Thalita. O horário de 18h às 21h delas é suposição até elas confirmarem.

## 2. Quem falta mandar

- **Falta região:** Nagela, Rayssa.
- **Falta horário:** Leticia Moroz, Mariana, Nagela.
- Ana Maria, Nayale e Rayssa: horário depois do expediente é suposição minha (18h às 21h). Confirmar com elas, inclusive sábado e domingo.
- Limite de kits novos por representante: nenhuma informou. Os números que aparecem (ex.: 3, 4, 5) vêm da simulação antiga.

## 3. Resumo por representante

| Representante | Região | Horário |
|---|---|---|
| Ana Claudia | sim | sim |
| Ana Maria ◆ | sim | sim |
| Anne | sim | sim |
| Bruna | sim | sim |
| Dayanne | sim | sim |
| Edlaine | sim | sim |
| Fabila | sim | sim |
| Francieli | sim | sim |
| Jessica Castro | sim | sim |
| Jessica Tobias | sim | sim |
| Leticia Alves | sim | sim |
| Leticia Moroz | sim | **falta** |
| Lysie | sim | sim |
| Marciane | sim | sim |
| Maria Eduarda | sim | sim |
| Mariana | sim | **falta** |
| Mayara | sim | sim |
| Nagela | **falta** | **falta** |
| Nayale ◆ | sim | sim |
| Rayssa ◆ | **falta** | sim |
| Thaina | sim | sim |
| Thalita ◆ | sim | sim |
| Vanessa | sim | sim |
| Veridiana | sim | sim |

◆ = também funcionária.

## 4. Detalhe de cada uma

### Ana Claudia (Ana Cláudia)
- **Curitiba:** Umbará, Sítio Cercado, Pinheirinho, Novo Mundo, Capão Raso, CIC, Fazendinha, Santa Cândida, Centro, Xaxim, Campo de Santana, São Braz, Cajuru, Guaíra, Boqueirão, Hauer
- **Região metropolitana:** São José dos Pinhais (cidade inteira); Pinhais (cidade inteira); Fazenda Rio Grande (cidade inteira)
- **Horários:** Seg: 8h às 16h · Ter: 8h às 16h · Qua: 8h às 16h · Qui: 8h às 16h · Sex: 8h às 16h · Sáb: 8h às 12h · Dom: não atendo
- **Obs.:** Pode começar a atender mais em Boqueirão, Xaxim, Sítio Cercado e Umbará

### Ana Maria ◆ (Ana Maria)
- **Região metropolitana:** Fazenda Rio Grande (Estados, Nações, Eucaliptos, Pioneiros, Santa Terezinha, Gralha Azul); Araucária (Iguaçu)
- **Horários:** Seg: 18h às 21h · Ter: 18h às 21h · Qua: 18h às 21h · Qui: 18h às 21h · Sex: 18h às 21h · Sáb: 8h às 12h · Dom: não atendo
- **Obs.:** Funcionária (Agendamento, 07h às 16h48): não atende durante o expediente. Sábado a confirmar

### Anne (Anne Asley de Souza Crispim)
- **Curitiba:** Capão Raso, Portão, CIC, Sítio Cercado, Umbará, Uberaba, Alto Boqueirão, Boqueirão, Xaxim, Lindóia, Cajuru, Bairro Alto, Fanny, Pinheirinho
- **Região metropolitana:** Pinhais (cidade inteira); Araucária (cidade inteira); Colombo (cidade inteira); Campo Largo (cidade inteira); Campo Magro (cidade inteira)
- **Ponta Grossa:** sim
- **Outras cidades:** Joinville (cidade inteira)
- **Horários:** Seg: manhã, tarde e noite (total disponibilidade) · Ter: manhã, tarde e noite (total disponibilidade) · Qua: manhã, tarde e noite (total disponibilidade) · Qui: 8:30 às 16:30 · Sex: 8:30 às 16:30 · Sáb: manhã, tarde e noite (total disponibilidade) · Dom: não atendo
- **Obs.:** Anne Ashley. Sábado: só 2 sábados por mês. Domingo não atende, só se a demanda for muito necessária

### Bruna (Bruna Ribeiro dos Santos)
- **Curitiba:** Cajuru, Uberaba, Centro
- **Região metropolitana:** São José dos Pinhais (cidade inteira); Pinhais (cidade inteira); Piraquara (cidade inteira)
- **Horários:** Seg: 10h às 20h · Ter: 10h às 20h · Qua: 10h às 20h · Qui: 10h às 20h · Sex: 10h às 20h · Sáb: se necessário · Dom: não atendo
- **Obs.:** Começa às 10h porque treina de manhã; em dia cheio começa mais cedo. Vai até as 20h se for perto de casa. Sexta: ela escreveu "20 às 20h"; entendi 10h às 20h. Sábado só se necessário

### Dayanne (Dayanne Ferreira Scapin)
- **Curitiba:** CIC, Fazendinha, Novo Mundo, Campo Comprido, Sítio Cercado, Boqueirão, Alto Boqueirão, Pinheirinho, Capão Raso, Xaxim
- **Região metropolitana:** Araucária (cidade inteira); Fazenda Rio Grande (cidade inteira)
- **Horários:** Seg: 8h às 18h · Ter: 8h às 18h · Qua: 8h às 18h · Qui: 8h às 18h · Sex: 8h às 18h · Sáb: 8h às 12h · Dom: não atendo
- **Obs.:** Já pegou kits novos em outubro. Viaja em novembro: segura kits novos agora e volta a atender depois da viagem

### Edlaine (Edlaine Guerra)
- **Curitiba:** CIC, Fazendinha, Campo de Santana, Vila Verde, Tatuquara, Vitória Régia, Campo Comprido, Pinheirinho, Novo Mundo, São Miguel
- **Região metropolitana:** Campina Grande do Sul (Sede); Quatro Barras (cidade inteira)
- **Horários:** Seg: 9h às 19h · Ter: 9h às 19h · Qua: 9h às 19h · Qui: 9h às 19h · Sex: 9h às 19h · Sáb: não atendo · Dom: não atendo
- **Obs.:** Sábado trabalha em outra empresa (loja). Região metropolitana: 1 vez no mês, tudo no mesmo dia. Pode começar a atender Sítio Cercado, Santa Quitéria e Capão Raso

### Fabila (Fabila Kerolaine Serra Sales)
- **Curitiba:** Cajuru, Uberaba, Santa Felicidade, Tatuquara, Campo de Santana, Sítio Cercado
- **Região metropolitana:** Almirante Tamandaré (cidade inteira); Rio Branco do Sul (cidade inteira); Itaperuçu (cidade inteira); São José dos Pinhais (cidade inteira); Pinhais (Weissópolis)
- **Prioridade:** Cajuru, Uberaba
- **Horários:** Seg: 10:00 às 17:00 · Ter: 10:00 às 16:00 · Qua: 10:00 às 17:00 · Qui: 10:00 às 17:00 · Sex: 10:00 às 17:00 · Sáb: manhã · Dom: não atendo
- **Obs.:** Quer receber mais leads de Cajuru e Uberaba (prioridade)

### Francieli (Francieli Almeida)
- **Curitiba:** Cajuru, Capão da Imbuia, Uberaba, Sítio Cercado, Ganchinho, Hauer, Boqueirão, Novo Mundo, Umbará, Campo de Santana, Tatuquara
- **Região metropolitana:** Pinhais (Weissópolis, Vargem Grande, Estância Pinhais); Piraquara (Vila Rosa, Vila Ipanema); São José dos Pinhais (Ipê, Iná); Fazenda Rio Grande (cidade inteira)
- **Horários:** Seg: 8h às 18h · Ter: 8h às 18h · Qua: 8h às 18h · Qui: 8h às 18h · Sex: 8h às 18h · Sáb: 8h às 12h · Dom: não atendo
- **Obs.:** Horário comercial (por causa da filha); sábado às vezes. Na semana de 26/10 não pode se comprometer. Falta dizer as regiões

### Jessica Castro (Jessica Castro Reis)
- **Curitiba:** inteira (33 bairros citados)
- **Região metropolitana:** inteira — Pinhais (cidade inteira); São José dos Pinhais (Pedro Moro, Iná, Cidade Jardim, Afonso Pena); Campo Largo (cidade inteira); Araucária (cidade inteira); Contenda (cidade inteira)
- **Horários:** Seg: 8h às 18h · Ter: 8h às 18h · Qua: 8h às 18h · Qui: 8h às 18h · Sex: 8h às 18h · Sáb: 9h às 14h · Dom: não atendo
- **Obs.:** Jéssica Félix (no WhatsApp). Sábado: só 2 no mês, o primeiro e o último. Às vezes tira um dia da semana para atender até as 21h. A partir do dia 20 trabalha até mais tarde, para entregar os kits dentro do mês

### Jessica Tobias (Jessica Tobias da Silva)
- **Curitiba:** Sítio Cercado, Ganchinho, Umbará, Pinheirinho, Capão Raso, Novo Mundo, Alto Boqueirão, Boqueirão, Xaxim, Tatuquara, Campo de Santana, Bairro Novo, Hauer, Portão, Água Verde, Mercês
- **Região metropolitana:** São José dos Pinhais (cidade inteira)
- **Horários:** Seg: 8h às 18h · Ter: 8h às 18h · Qua: 8h às 18h · Qui: 8h às 18h · Sex: 8h às 18h · Sáb: manhã · Dom: não atendo
- **Obs.:** Disse "horário comercial"; gravei 8h às 18h. Sábado de manhã. Não tem problema em passar do horário alguns dias. Indisponível de 12 a 15/11

### Leticia Alves (Letícia Alves)
- **Curitiba:** Xaxim, Sítio Cercado, Alto Boqueirão, Cajuru, Uberaba, Hauer, Boqueirão, CIC, Ganchinho, Santa Quitéria, Pinheirinho, Pilarzinho, Fazendinha, Butiatuvinha
- **Região metropolitana:** São José dos Pinhais (São Marcos, Ouro Fino, Parque da Fonte, Aristocrata, Rio Pequeno, São Roque, Cruzeiro, Santo Antônio, Cidade Jardim, Colônia Murici, Quississana, Jurema, Campo Largo da Roseira, Ipê, Jardim Independência); Colombo (Jd. Guaraituba, Fátima, Canguiri); Piraquara (Vila Rosa); Araucária (Capela Velha, Sabiá, Costeira)
- **Horários:** Seg: 8h às 18h · Ter: 8h às 21h · Qua: 8h às 18h · Qui: 8h às 18h · Sex: 8h às 18h · Sáb: 8h às 18h · Dom: não atendo
- **Obs.:** Segunda, quarta, quinta e sexta em horário comercial; terça até 21h; sábado intercalado

### Leticia Moroz (Leticia Adrielle Moroz)
- **Curitiba:** CIC, Fazendinha, Pinheirinho, Capão Raso, Umbará, Ganchinho
- **Região metropolitana:** Araucária (Capela Velha); São José dos Pinhais (Borda do Campo, Quissisana)
- **Outras cidades:** Joinville (Cubatão, Aventureiro, Iririu)
- **Horários:** ainda não mandou

### Lysie (Lysie Karine Lencioni)
- **Curitiba:** Boa Vista, Santa Cândida, Cajuru, Sítio Cercado
- **Região metropolitana:** Campina Grande do Sul (cidade inteira)
- **Horários:** Seg: 8h às 17h · Ter: 8h às 17h · Qua: 8h às 17h · Qui: 8h às 17h · Sex: 8h às 17h · Sáb: não atendo · Dom: não atendo
- **Obs.:** Horário comercial 8h às 17h. Há revendedoras atendidas às 7h e às 19h, conforme a rota do dia

### Marciane (Marciane)
- **Curitiba:** Boa Vista, Uberaba, Campo Comprido, CIC, Capão Raso, Cajuru, Guaíra, Bairro Alto, Centro, Rebouças, Boqueirão, Novo Mundo, Santa Cândida, Tatuquara, Sítio Cercado, Xaxim
- **Região metropolitana:** São José dos Pinhais (Quississana, Colônia Rio Grande, Cidade Jardim, Rio Pequeno, São Marcos); Quatro Barras (Jardim Patrícia, Menino Deus); Colombo (Paloma, Campo Pequeno, São Gabriel, Maracanã, Rio Verde, Monza, Guarani); Campo Magro (Jardim Boa Vista); Araucária (cidade inteira)
- **Horários:** Seg: 8h às 12h e das 14h às 16:00 · Ter: 8h às 12h e das 14h às 16:00 · Qua: 8h às 12h e das 14h às 16:00 · Qui: 8h às 12h e das 14h às 16:00 · Sex: 8h às 12h e das 14h às 16:00 · Sáb: não atendo · Dom: não atendo
- **Obs.:** Representante nova. Mandou a lista completa de bairros em 26/10/2026. Araucária: disse que pode começar a atender (sem bairros)

### Maria Eduarda (Maria Eduarda Antunes)
- **Curitiba:** Sítio Cercado, Xaxim, Hauer, Boqueirão, Novo Mundo, Alto Boqueirão, Umbará, Capão da Imbuia, CIC
- **Região metropolitana:** São José dos Pinhais (cidade inteira); Colombo (cidade inteira)
- **Horários:** Seg: 8h às 13h · Ter: 8h às 13h · Qua: 8h às 13h · Qui: 8h às 13h · Sex: 8h às 13h · Sáb: não atendo · Dom: não atendo
- **Obs.:** Horários provisórios, como já combinado

### Mariana (Mariana)
- **Outras cidades:** Maringá (cidade inteira)
- **Horários:** ainda não mandou
- **Obs.:** De Maringá. É a única representante que atende lá

### Mayara (Mayara)
- **Região metropolitana:** Fazenda Rio Grande (cidade inteira)
- **Horários:** Seg: manhã, tarde e noite · Ter: manhã, tarde e noite · Qua: manhã, tarde e noite · Qui: manhã, tarde e noite · Sex: manhã, tarde e noite · Sáb: manhã, tarde e noite · Dom: manhã, tarde e noite
- **Obs.:** Disse que atende qualquer horário e dia da semana para revendedora de Fazenda Rio Grande

### Nagela
- **Região:** ainda não mandou
- **Horários:** ainda não mandou

### Nayale ◆ (Nayale Emanuele Calixto)
- **Curitiba:** Cajuru, Capão da Imbuia
- **Região metropolitana:** São José dos Pinhais (cidade inteira); Piraquara (cidade inteira); Pinhais (cidade inteira)
- **Horários:** Seg: 18:00 às 21:00 · Ter: 18:00 às 21:00 · Qua: 18:00 às 21:00 · Qui: 18:00 às 21:00 · Sex: 18:00 às 21:00 · Sáb: não informado · Dom: não informado
- **Obs.:** Funcionária (Financeiro, 07h30 às 17h18): só depois do expediente. 18h às 21h é suposição; sábado e domingo a confirmar

### Rayssa ◆
- **Região:** ainda não mandou
- **Horários:** Seg: 18:00 às 21:00 · Ter: 18:00 às 21:00 · Qua: 18:00 às 21:00 · Qui: 18:00 às 21:00 · Sex: 18:00 às 21:00 · Sáb: não informado · Dom: não informado
- **Obs.:** Funcionária (Cadastro de Peças, 08h às 17h48): só depois do expediente. 18h às 21h é suposição; sábado e domingo a confirmar

### Thaina (Thaina Cristina Idalgo)
- **Curitiba:** Uberaba, Boqueirão, Xaxim, Hauer, Capão Raso, Novo Mundo
- **Região metropolitana:** São José dos Pinhais (Cidade Jardim, Guatupê, Iná, Independência, Centro); Pinhais (cidade inteira)
- **Horários:** Seg: 8h às 12h e das 14h às 18h · Ter: 14h30 às 20h · Qua: 14h30 às 20h · Qui: 14h30 às 20h · Sex: 8h às 12h e das 14h às 19h · Sáb: 8h às 12h · Dom: não atendo
- **Obs.:** Thainá Idalgo. De terça a quinta só depois das 14h, por causa do trabalho interno

### Thalita ◆ (Thalita Torazzi Arndt)
- **Curitiba:** Cajuru, Uberaba, Centro, Bairro Alto, Boqueirão, Alto Boqueirão, Pinheirinho, Capão Raso, CIC, Cristo Rei, Hauer, Jardim Social, Jardim das Américas
- **Região metropolitana:** São José dos Pinhais (cidade inteira); Colombo (cidade inteira); Quatro Barras (cidade inteira); Pinhais (cidade inteira); Araucária (cidade inteira); Piraquara (cidade inteira)
- **Outras cidades:** Matinhos (cidade inteira); Paranaguá (cidade inteira); Guaratuba (cidade inteira); Pontal do Paraná (cidade inteira); Itajaí (cidade inteira); Balneário Camboriú (cidade inteira); Camboriú (cidade inteira); Itapema (cidade inteira)
- **Horários:** Seg: 9:00 às 20:00 · Ter: 9:00 às 20:00 · Qua: a partir das 10:00 · Qui: 14:00 às 20:00 · Sex: não informado · Sáb: não informado · Dom: não informado
- **Obs.:** Atende por rota: segunda Paranaguá (até 20h/21h); terça Paranaguá, Matinhos, Pontal do Paraná e Guaratuba (até 20h/21h); quarta a partir das 10h em Quatro Barras e Campina Grande do Sul; quinta depois do almoço até 20h, para finalizar tudo do mês. Sexta, sábado e domingo vieram em branco: confirmar

### Vanessa (Vanessa)
- **Curitiba:** CIC, Tatuquara, Novo Mundo, Uberaba, Cajuru, Guabirotuba, Capão da Imbuia, Sítio Cercado, Fazendinha
- **Região metropolitana:** São José dos Pinhais (Parque da Fonte, Pedro Moro, Centro, Iná, Aviação); Araucária (Iguaçu, Costeira, Campina da Barra, Thomaz Coelho, Cachoeira); Pinhais (Centro, Maria Antonieta, Vargem Grande, Jardim Cláudia); Piraquara (Jd. Santa Mônica, Vila Juliana, Vila Ipanema)
- **Não atende (não indicar kit novo):** Piraquara (cidade inteira)
- **Horários:** Seg: 9h30 às 18h30 · Ter: 9h30 às 18h30 · Qua: 9h30 às 18h30 · Qui: 9h30 às 18h30 · Sex: 9h30 às 18h · Sáb: não atendo · Dom: não atendo
- **Obs.:** Sem almoço. Duas clientes às 19h30; o horário depende da cliente. Não gosta de atender Piraquara: não indicar kit novo para lá. Pode atender mais em Pinhais, Cajuru e São José dos Pinhais

### Veridiana (Veridiana)
- **Curitiba:** Campo de Santana, Barreirinha, Centro, Campo Comprido
- **Região metropolitana:** Pinhais (cidade inteira); Araucária (cidade inteira)
- **Horários:** Seg: 11:30 às 22:00 · Ter: 11:30 às 17:00 · Qua: 11:30 às 22:00 · Qui: 10:00 às 22:00 · Sex: 8:00 às 22:00 · Sáb: 8:00 às 18:00 · Dom: 13:00 às 20:00
- **Obs.:** Veri. Segunda a quinta tem aula de manhã (faculdade presencial). Terça para às 17h por causa da aula de vôlei às 19h. Domingo só depois do almoço (igreja de manhã)

## 5. Viagens (novembro e dezembro de 2026)

| Mês | Destino | Viagem | Dias | Retirada dos kits na empresa |
|---|---|---|---|---|
| Novembro | Ponta Grossa | 1ª viagem | 10, 11 e 12/11 | segunda 09/11 às 18:00 |
| Novembro | Joinville | Viagem | 14 e 15/11 | sexta 13/11 às 18:00 |
| Novembro | Ponta Grossa | 2ª viagem | 24 e 25/11 | segunda 23/11 às 18:00 |
| Dezembro | Ponta Grossa | 1ª viagem | 12, 13 e 14/12 | sexta 11/12 às 18:00 |
| Dezembro | Joinville | Viagem | 15 e 16/12 | segunda 14/12 às 18:00 |
| Dezembro | Ponta Grossa | 2ª viagem | 27 e 28/12 | sábado 26/12 às 12:00 |

- Quem atende Ponta Grossa no mapa: Anne. Joinville: Anne e Leticia Moroz. **Quem viaja em cada data ainda não foi definido.**
- Em aberto: a representante em viagem sair da indicação nesses dias; prazo dos kits para a retirada.

## 6. Cidades que a Sorelly atende (vistas no mapa)

- **Região metropolitana:** Almirante Tamandaré, Araucária, Campina Grande do Sul, Campo Largo, Campo Magro, Colombo, Contenda, Fazenda Rio Grande, Itaperuçu, Pinhais, Piraquara, Quatro Barras, Rio Branco do Sul, São José dos Pinhais.
- **Outras cidades:** Balneário Camboriú, Camboriú, Guaratuba, Itajaí, Itapema, Joinville, Maringá, Matinhos, Paranaguá, Ponta Grossa, Pontal do Paraná.
- Não existe lista oficial de cidades; são as que alguma representante citou.

## 7. Mensagens prontas e fluxo

- Telas: Cadastro de revendedoras › Mensagens prontas (abas Kits novos e Representantes, com Glossário que rola até a mensagem).
- Fluxo das representantes: aceitou o kit novo → combinou a entrega → uma semana depois (acompanhamento de vendas) → 5 a 1 dia antes do acerto (cobrança diária) → último dia para solicitar o kit (aviso de kit básico).
- Quando a representante aceita um kit novo no app, abre a conversa com a revendedora no SorellyChat com a mensagem de apresentação (texto sugerido por mim; o Marcus escolhe o padrão).
- Nenhuma mensagem automática vai ao app da representante; a ordem do Lucas fica só no sistema (REGRAS-DE-PIX.md).

## 8. Perguntas em aberto

- A partir de quanto um Pix é "fora do normal" (R$ 7.000?) e quem recebe o aviso de Pix novo.
- Quem viaja em cada viagem e se sai da indicação nos dias dela.
- Datas indisponíveis (Dayanne em novembro, Jessica Tobias 12 a 15/11, Francieli semana de 26/10) ainda só estão na observação; falta campo próprio.
- "Posso atender mais" e rota por dia da semana (Thalita) ainda só ficam na observação.
