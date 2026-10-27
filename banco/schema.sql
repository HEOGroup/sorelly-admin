-- Banco novo do Sorelly Admin (teste): estrutura VAZIA no schema "sorelly", copiada do admin antigo (mesmos nomes e tipos, para os dados entrarem 1 para 1 na troca)
-- Fora: Leilão, Chamados, Metas das revendedoras, tabelas de desenvolvimento e as de login (usa o "user" do schema public).
-- Novas: rotina_item e rotina_registro (o que cada setor lança por dia). Gerado em 21/10/2026.
CREATE SCHEMA IF NOT EXISTS sorelly;
SET search_path TO sorelly, public;

-- enums
CREATE TYPE sorelly."UserRole" AS ENUM ('ADMIN', 'MEMBER');
CREATE TYPE sorelly."MarketingBadge" AS ENUM ('FERIADO', 'CAMPANHA', 'SAZONAL', 'LANCAMENTO', 'PROMOCAO', 'DATA_COMEMORATIVA');
CREATE TYPE sorelly."KitBlockType" AS ENUM ('id', 'slider', 'filhos', 'letras', 'vend', 'vendsimple', 'vendmetal');
CREATE TYPE sorelly."MarketingImageSource" AS ENUM ('UPLOADED', 'EXTERNAL');
CREATE TYPE sorelly."MuralNovidadeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE sorelly."MuralNovidadeCategoria" AS ENUM ('LANCAMENTO', 'FUNCIONALIDADE', 'COMUNICADO');
CREATE TYPE sorelly."PushAcaoTipo" AS ENUM ('NENHUMA', 'DEEP_LINK', 'URL');
CREATE TYPE sorelly."PushAgendamentoModo" AS ENUM ('UNICO', 'RECORRENTE');
CREATE TYPE sorelly."PushFrequencia" AS ENUM ('DIARIA', 'SEMANAL', 'MENSAL', 'SEMANAL_DIAS');
CREATE TYPE sorelly."PushTermino" AS ENUM ('INDEFINIDO', 'POR_OCORRENCIAS', 'POR_SEMANAS');
CREATE TYPE sorelly."PushAgendamentoStatus" AS ENUM ('PENDENTE', 'ATIVO', 'CONCLUIDO', 'CANCELADO', 'FALHO');
CREATE TYPE sorelly."PushEnvioTipo" AS ENUM ('INSTANTANEO', 'AGENDADO');
CREATE TYPE sorelly."PushEnvioStatus" AS ENUM ('NA_FILA', 'PROCESSANDO', 'CONCLUIDO', 'CONCLUIDO_COM_FALHAS', 'FALHO', 'CANCELADO');
CREATE TYPE sorelly."FinanceAccountType" AS ENUM ('PJ', 'PF', 'CAIXA');
CREATE TYPE sorelly."AvaliacaoCategoria" AS ENUM ('REPRESENTANTE', 'KIT');
CREATE TYPE sorelly."AvaliacaoTipoResposta" AS ENUM ('ESTRELA_5', 'NOTA_10', 'MULTIPLA_ESCOLHA', 'TEXTO_LIVRE');
CREATE TYPE sorelly."KommoLeadReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE sorelly."KommoLeadImageStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'EMPTY');
CREATE TYPE sorelly."ProducaoUnidade" AS ENUM ('SORELLY', 'SERENITY');
CREATE TYPE sorelly."CalculadoraKitTipo" AS ENUM ('NORMAL', 'POUCA_PECA');
CREATE TYPE sorelly."FinanceFamiliarPersonaTipo" AS ENUM ('SOCIO', 'FAMILIAR');
CREATE TYPE sorelly."FinanceFamiliarFormaPagamento" AS ENUM ('BOLETO', 'DINHEIRO', 'PIX', 'DEBITO_CONTA', 'CARTAO_CREDITO', 'TED', 'DESCONTO', 'PIX_REVENDEDORAS');
CREATE TYPE sorelly."FinanceFamiliarParcelaStatus" AS ENUM ('PENDENTE', 'PAGO', 'PARCIAL');
CREATE TYPE sorelly."FinanceFamiliarPixAuditoria" AS ENUM ('CONFIRMADO', 'PENDENTE', 'REJEITADO');
CREATE TYPE sorelly."FinanceFamiliarAlertaTipo" AS ENUM ('CONTAS_MES_ACIMA', 'SALDO_PRESTADOR_ACIMA', 'PIX_ABAIXO_META', 'ATRASADAS_ACIMA');
CREATE TYPE sorelly."ComprasStatus" AS ENUM ('NAO_VERIFICADA', 'APROVADA', 'AGUARDANDO_AUTORIZACAO', 'AGUARDANDO', 'COMPRADA', 'EM_TRANSITO', 'RECEBIDA', 'ENTREGUE', 'NEGADA', 'AGUARDANDO_ORCAMENTO', 'AGUARDANDO_CNPJ', 'AGUARDANDO_FORMA_PAGAMENTO');
CREATE TYPE sorelly."ComprasUrgency" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE sorelly."ComprasUnit" AS ENUM ('UNID', 'CX', 'KIT', 'PAR', 'ROLO', 'PACOTE');
CREATE TYPE sorelly."ComprasDeliveryType" AS ENUM ('PADRAO', 'FINANCEIRO', 'RETIRADA');
CREATE TYPE sorelly."ComprasPaymentType" AS ENUM ('CARTAO', 'PIX', 'DINHEIRO', 'BOLETO');
CREATE TYPE sorelly."ComprasRole" AS ENUM ('SOLICITANTE', 'FINANCEIRO', 'AUTORIZADOR', 'FATURAMENTO', 'LOGISTICA');
CREATE TYPE sorelly."ConsignadoOrigem" AS ENUM ('APP', 'MANUAL');
CREATE TYPE sorelly."ConsignadoConciliacaoStatus" AS ENUM ('AGUARDANDO', 'CONFIRMADO', 'CONTA_ERRADA', 'CALOTE');
CREATE TYPE sorelly."ConsignadoTipoMovimento" AS ENUM ('ACERTO', 'ENTREGA_KIT', 'REPOSICAO');
CREATE TYPE sorelly."ConsignadoEtapaBancaria" AS ENUM ('PENDENTE', 'CONFIRMADO', 'DIVERGENTE');
CREATE TYPE sorelly."EstoqueInternoTipo" AS ENUM ('MATERIAIS_EMBALAGENS', 'LIMPEZA', 'MATERIAIS_PRODUCAO');
CREATE TYPE sorelly."EstoqueInternoCompraStatus" AS ENUM ('SOLICITADO', 'APROVADO', 'RECUSADO', 'SEGURAR', 'RECEBIDO');
CREATE TYPE sorelly."EstoqueInternoRole" AS ENUM ('CONTAGEM', 'COMPRA', 'APROVACAO');
CREATE TYPE sorelly."EstoqueInternoSituacao" AS ENUM ('NAO_PRECISA_COMPRAR', 'SOLICITADO', 'AGUARDANDO_APROVACAO', 'AGUARDAR', 'AGUARDANDO_ENTREGA', 'VERIFICAR', 'VERIFICAR_UNIDADE');
CREATE TYPE sorelly."EstoqueInternoItemLogAcao" AS ENUM ('CRIADO', 'EDITADO', 'EXCLUIDO', 'OBSERVACAO');
CREATE TYPE sorelly."FiscalClassificacaoEntrada" AS ENUM ('LASTRO', 'NÃO LASTRO', 'OPERACIONAL');
CREATE TYPE sorelly."FinanceFamiliarChavePixTipo" AS ENUM ('PHONE', 'CPF', 'CNPJ', 'EMAIL', 'RANDOM');
CREATE TYPE sorelly."FaturamentoFechamentoLogAcao" AS ENUM ('FECHADO', 'REABERTO');
CREATE TYPE sorelly."ExpositorCondicionalStatus" AS ENUM ('BIPADO', 'ESTA_COM_CLIENTE', 'DEVOLVIDO');
CREATE TYPE sorelly."ExpositorCondicaoDevolucao" AS ENUM ('NOVO', 'BOM', 'COM_MARCAS_DE_USO', 'DANIFICADO', 'NAO_DEVOLVIDO');
CREATE TYPE sorelly."MarketingDivulgacaoTipo" AS ENUM ('STORY', 'FEED', 'REELS');
CREATE TYPE sorelly."MarketingDivulgacaoCanal" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'TIKTOK');
CREATE TYPE sorelly."MarketingDivulgacaoStatus" AS ENUM ('EM_PRODUCAO', 'AGENDADO', 'POSTADO');
CREATE TYPE sorelly."MuralAvisoTipo" AS ENUM ('GERAL', 'SETOR');
CREATE TYPE sorelly."AcertosRole" AS ENUM ('MANAGER', 'MEMBER');
CREATE TYPE sorelly."AcertosMonthAction" AS ENUM ('FECHADO', 'REABERTO');
CREATE TYPE sorelly."DepartamentoMembroPapel" AS ENUM ('SUPERVISOR', 'FUNCIONARIO');
CREATE TYPE sorelly."RhColaboradorStatus" AS ENUM ('ATIVO', 'FERIAS', 'AFASTADO', 'DESLIGADO');
CREATE TYPE sorelly."RhPresencaCodigo" AS ENUM ('P', 'F', 'AJ', 'AT', 'FE', 'FO', 'AF');
CREATE TYPE sorelly."ComprasFulfillmentStatus" AS ENUM ('RETIRADO_ESTOQUE', 'CONFIRMAR_ENTREGA', 'ENTREGUE');
CREATE TYPE sorelly."RhContratoTipo" AS ENUM ('CLT', 'TERCEIRO', 'PARTICULAR', 'REPRESENTANTE');
CREATE TYPE sorelly."RhContratoAnexoTipo" AS ENUM ('CONTRATO', 'ADITIVO', 'ENCERRAMENTO', 'EQUIPAMENTO');
CREATE TYPE sorelly."ExpositorTipoAvaria" AS ENUM ('QUEBRADO', 'RISCADO', 'PECA_FALTANTE', 'AMASSADO', 'OUTRO');
CREATE TYPE sorelly."ExpositorAvariaStatus" AS ENUM ('ABERTO', 'EM_REPARO', 'RESOLVIDO');
CREATE TYPE sorelly."KommoLeadKitOpcao" AS ENUM ('KIT_NORMAL', 'KIT_NORMAL_EXPOSITOR', 'VIR_EMPRESA', 'VIR_EMPRESA_EXPOSITOR');
CREATE TYPE sorelly."AtendimentoModalidade" AS ENUM ('PADRAO', 'PRATA');
CREATE TYPE sorelly."AtendimentoSituacao" AS ENUM ('CONTATAR', 'CONTATO', 'AGENDADA', 'CONFIRMADA', 'LEMBRETE');
CREATE TYPE sorelly."AtendimentoTipo" AS ENUM ('ACERTO', 'KIT_NOVO', 'REPOSICAO', 'PREMIO', 'INDICACAO');
CREATE TYPE sorelly."AtendimentoStatus" AS ENUM ('AGENDADO', 'ATENDENDO', 'ACERTADO');
CREATE TYPE sorelly."AtendimentoContinua" AS ENUM ('SIM', 'NAO_REGRAS', 'NAO_QUER');
CREATE TYPE sorelly."AtendimentoLinhaTipo" AS ENUM ('PAGAMENTO', 'BRINDE');
CREATE TYPE sorelly."KitNovoEtapa" AS ENUM ('CADASTRADA', 'LIBERADO', 'SOLICITADO', 'BIPADO', 'ENTREGUE', 'CANCELADO');
CREATE TYPE sorelly."KitNovoModelo" AS ENUM ('MISTO', 'PRATA');
CREATE TYPE sorelly."KitNovoTipo" AS ENUM ('VENDEDORA', 'RETORNANDO');
CREATE TYPE sorelly."KitNovoAppStatus" AS ENUM ('AGUARDANDO', 'AGENDADO', 'RECUSADO', 'RETIRADO');
CREATE TYPE sorelly."ListagemStatus" AS ENUM ('ABERTA', 'CONCLUIDA');
CREATE TYPE sorelly."ListagemOrigem" AS ENUM ('APP', 'PAINEL');
CREATE TYPE sorelly."ListagemItemTipo" AS ENUM ('ACERTO_KIT', 'ACERTO_KIT_EXP', 'KIT_NOVO', 'KIT_NOVO_EXP', 'REPOSICAO', 'CONDICIONAL', 'SAIDA');
CREATE TYPE sorelly."ListagemItemStatus" AS ENUM ('PRECOND', 'SEMVALOR', 'PENDENTE', 'CONDICIONAL', 'MONTANDO', 'SUPERVISAO', 'AJUSTE', 'MONTADO', 'BIPANDO', 'BIPADO', 'RETIRADO', 'REMOVIDO');
CREATE TYPE sorelly."ListagemRetiradaModo" AS ENUM ('BALCAO', 'SOZINHA', 'APP');
CREATE TYPE sorelly."ListagemRetiradaStatus" AS ENUM ('PENDENTE', 'CONFIRMADA', 'RECUSADA');

-- tabelas
CREATE TABLE sorelly."acertos_daily_entry" (
  "id" text NOT NULL,
  "yearMonth" text NOT NULL,
  "dia" integer NOT NULL,
  "acumulado" integer NOT NULL,
  "lancadoPorNome" text NOT NULL,
  "lancadoPorEmail" text NOT NULL,
  "lancadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."acertos_funcionaria_bonus" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "ativa" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."acertos_member" (
  "id" text NOT NULL,
  "userId" text NOT NULL,
  "role" "AcertosRole" DEFAULT 'MEMBER'::"AcertosRole" NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."acertos_meta_faixa" (
  "id" text NOT NULL,
  "pct" numeric(5,2) NOT NULL,
  "bonus" numeric(10,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."acertos_month" (
  "yearMonth" text NOT NULL,
  "revendedorasComKit" integer DEFAULT 0 NOT NULL,
  "acertosPrevistos" integer DEFAULT 0 NOT NULL,
  "pagamentoDataPrevista" date,
  "pagamentoDataConfirmada" date,
  "pagamentoConfirmadoPorNome" text,
  "pagamentoConfirmadoPorEmail" text,
  "fechadoEm" timestamp(3),
  "fechadoPorNome" text,
  "fechadoPorEmail" text,
  "snapshotFechamento" jsonb,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."acertos_month_close_log" (
  "id" text NOT NULL,
  "yearMonth" text NOT NULL,
  "action" "AcertosMonthAction" NOT NULL,
  "actorNome" text NOT NULL,
  "actorEmail" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."acertos_representante" (
  "id" text NOT NULL,
  "codigo" text NOT NULL,
  "nome" text NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."acertos_representante_daily_balance" (
  "id" text NOT NULL,
  "representanteMonthId" text NOT NULL,
  "dia" integer NOT NULL,
  "saldo" integer NOT NULL,
  "lancadoPorNome" text NOT NULL,
  "lancadoPorEmail" text NOT NULL,
  "lancadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."acertos_representante_month" (
  "id" text NOT NULL,
  "yearMonth" text NOT NULL,
  "representanteId" text NOT NULL,
  "cota" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."anexo" (
  "id" text NOT NULL,
  "escopo" text NOT NULL,
  "donoId" text NOT NULL,
  "objectKey" text NOT NULL,
  "url" text NOT NULL,
  "nome" text NOT NULL,
  "contentType" text NOT NULL,
  "tamanho" integer NOT NULL,
  "criadoPorId" text NOT NULL,
  "criadoPorNome" text NOT NULL,
  "criadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."atendimento" (
  "id" text NOT NULL,
  "tipo" "AtendimentoTipo" DEFAULT 'ACERTO'::"AtendimentoTipo" NOT NULL,
  "revendedoraId" text,
  "nome" text NOT NULL,
  "fone" text,
  "devmaster" text,
  "data" date NOT NULL,
  "hora" text,
  "condicionais" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "obs" text,
  "remarcacoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" "AtendimentoStatus" DEFAULT 'AGENDADO'::"AtendimentoStatus" NOT NULL,
  "regrasVersaoId" text,
  "modalidade" "AtendimentoModalidade" DEFAULT 'PADRAO'::"AtendimentoModalidade" NOT NULL,
  "criadoPorId" text,
  "criadoPorNome" text,
  "chegada" text,
  "inicioEm" timestamp(3),
  "fimEm" timestamp(3),
  "escolhaIniEm" timestamp(3),
  "escolhaFimEm" timestamp(3),
  "bipouNome" text,
  "bipouUserId" text,
  "atendeuNome" text,
  "atendeuUserId" text,
  "vendaApp" numeric(12,2) DEFAULT 0 NOT NULL,
  "vendaFonte" text,
  "vendasAnt" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "vendidasTotal" integer,
  "encomenda" text,
  "kitNovo" boolean DEFAULT false NOT NULL,
  "continua" "AtendimentoContinua",
  "novaCond" text,
  "rascunho" jsonb,
  "acertadoEm" timestamp(3),
  "formSnapshot" jsonb,
  "acerto" jsonb,
  "vendaBruta" numeric(12,2),
  "vendaLiquida" numeric(12,2),
  "comissaoPct" numeric(5,2),
  "valorAcerto" numeric(12,2),
  "valorDevido" numeric(12,2),
  "valorPago" numeric(12,2),
  "acertoAssinado" boolean DEFAULT false NOT NULL,
  "assinatura" text,
  "regrasPassadas" text[] DEFAULT ARRAY[]::text[],
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."atendimento_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "regraVersaoAtualId" text,
  "limiteMediaAlta" numeric(12,2) DEFAULT 4000 NOT NULL,
  "limiteAnaliseVendas" numeric(12,2) DEFAULT 2500 NOT NULL,
  "tabelaKitAtiva" text DEFAULT 'alto'::text NOT NULL,
  "tabelaKitAlto" jsonb NOT NULL,
  "tabelaKitBaixo" jsonb NOT NULL,
  "toleranciaChegadaMin" integer DEFAULT 30 NOT NULL,
  "descontoBrindeAtraso" numeric(5,4) DEFAULT 0.10 NOT NULL,
  "diasAlerta" integer DEFAULT 5 NOT NULL,
  "alertaMediaAltaSetores" text[] DEFAULT ARRAY['atendimento-interno'::text],
  "alertaPagamentoSetores" text[] DEFAULT ARRAY['financeiro'::text],
  "alertaContasSetores" text[] DEFAULT ARRAY['atendimento-interno'::text],
  "supervisorIds" text[] DEFAULT ARRAY[]::text[],
  "acessoTelas" jsonb NOT NULL,
  "atualizadoEm" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."atendimento_lancamento" (
  "id" text NOT NULL,
  "atendimentoId" text NOT NULL,
  "nome" text NOT NULL,
  "enviadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "enviadoPorNome" text,
  "etapaComprovantes" boolean DEFAULT false NOT NULL,
  "finalizado" boolean DEFAULT false NOT NULL,
  "finalizadoEm" timestamp(3),
  "conferido" boolean DEFAULT false NOT NULL,
  "conferidoEm" timestamp(3),
  "conferidoPorId" text,
  "conferidoPorNome" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."atendimento_lancamento_linha" (
  "id" text NOT NULL,
  "lancamentoId" text NOT NULL,
  "ordem" integer NOT NULL,
  "tipo" "AtendimentoLinhaTipo" NOT NULL,
  "forma" text DEFAULT ''::text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "isento" boolean DEFAULT false NOT NULL,
  "enviada" boolean DEFAULT false NOT NULL
);
CREATE TABLE sorelly."atendimento_lancamento_parte" (
  "id" text NOT NULL,
  "linhaId" text NOT NULL,
  "ordem" integer NOT NULL,
  "descricao" text DEFAULT ''::text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "ok" boolean DEFAULT false NOT NULL,
  "okPorNome" text,
  "okEm" timestamp(3)
);
CREATE TABLE sorelly."atendimento_modalidade_hist" (
  "id" text NOT NULL,
  "revendedoraId" text NOT NULL,
  "de" "AtendimentoModalidade" NOT NULL,
  "para" "AtendimentoModalidade" NOT NULL,
  "em" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "porNome" text NOT NULL,
  "origem" text DEFAULT 'interno'::text NOT NULL
);
CREATE TABLE sorelly."atendimento_regra_versao" (
  "id" text NOT NULL,
  "vigenciaDesde" date NOT NULL,
  "anteriorId" text,
  "faixas" jsonb NOT NULL,
  "remarcacao" jsonb NOT NULL,
  "pagamentoBrinde" jsonb NOT NULL,
  "gerais" jsonb NOT NULL,
  "prata" jsonb NOT NULL,
  "criadoPorId" text,
  "criadoPorNome" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."atendimento_revendedora" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "codigoExterno" text,
  "ciclo" integer DEFAULT 30 NOT NULL,
  "proximoManual" date,
  "situacao" "AtendimentoSituacao" DEFAULT 'CONTATAR'::"AtendimentoSituacao" NOT NULL,
  "agendData" date,
  "agendHora" text,
  "modalidade" "AtendimentoModalidade" DEFAULT 'PADRAO'::"AtendimentoModalidade" NOT NULL,
  "contatos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "ativa" boolean DEFAULT true NOT NULL,
  "atendimentoId" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."atendimento_revendedora_hist" (
  "id" text NOT NULL,
  "revendedoraId" text NOT NULL,
  "data" date NOT NULL,
  "venda" numeric(12,2),
  "acerto" numeric(12,2),
  "atendimentoId" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."atendimento_termo" (
  "id" text NOT NULL,
  "revendedoraId" text NOT NULL,
  "assinatura" text NOT NULL,
  "regras" text[],
  "versaoId" text,
  "porNome" text NOT NULL,
  "origem" text DEFAULT 'interno'::text NOT NULL,
  "assinadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."avaliacao" (
  "id" text NOT NULL,
  "revendedoraUserId" integer NOT NULL,
  "revendedoraNome" varchar(200) NOT NULL,
  "representanteCod" varchar(50),
  "representanteNome" varchar(200),
  "condicionalCodigo" varchar(50) NOT NULL,
  "enviadaEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."avaliacao_pergunta" (
  "id" text NOT NULL,
  "categoria" "AvaliacaoCategoria" NOT NULL,
  "texto" varchar(300) NOT NULL,
  "tipo" "AvaliacaoTipoResposta" NOT NULL,
  "opcoes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "ordem" integer NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."avaliacao_resposta" (
  "id" text NOT NULL,
  "avaliacaoId" text NOT NULL,
  "perguntaId" text NOT NULL,
  "valorNumerico" integer,
  "valorTexto" text
);
CREATE TABLE sorelly."cadastro_daily_reseller" (
  "id" text NOT NULL,
  "date" date NOT NULL,
  "note" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "total" integer NOT NULL
);
CREATE TABLE sorelly."cadastro_goal" (
  "id" text NOT NULL,
  "targetDate" date NOT NULL,
  "target" integer NOT NULL,
  "label" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."cadastro_settings" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "baseline" integer DEFAULT 0 NOT NULL,
  "baselineDate" date,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."calculadora_comissao_tier" (
  "id" text NOT NULL,
  "minValor" numeric(10,2) NOT NULL,
  "comissaoPct" numeric(5,2) NOT NULL,
  "brindesNormal" numeric(10,2) NOT NULL,
  "brindesBB" numeric(10,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."calculadora_kit_settings" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "kitNovo" numeric(10,2) DEFAULT 7000 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "limiteAvisarMarcus" numeric(10,2) DEFAULT 4000 NOT NULL
);
CREATE TABLE sorelly."calculadora_kit_tier" (
  "id" text NOT NULL,
  "tipo" "CalculadoraKitTipo" NOT NULL,
  "minValor" numeric(10,2) NOT NULL,
  "kitValor" numeric(10,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."compras_catalog_item" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "categoryId" text,
  "unit" "ComprasUnit" DEFAULT 'UNID'::"ComprasUnit" NOT NULL,
  "refPrice" numeric(10,2),
  "aliases" text[] DEFAULT ARRAY[]::text[],
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."compras_category" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."compras_deny_reason" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."compras_member" (
  "id" text NOT NULL,
  "userId" text NOT NULL,
  "role" "ComprasRole" DEFAULT 'SOLICITANTE'::"ComprasRole" NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."compras_payment_account" (
  "id" text NOT NULL,
  "type" "ComprasPaymentType" NOT NULL,
  "document" text,
  "bank" text,
  "holder" text NOT NULL,
  "endingOrKey" text,
  "active" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "label" text
);
CREATE TABLE sorelly."compras_request" (
  "id" text NOT NULL,
  "title" text NOT NULL,
  "catalogItemId" text,
  "categoryId" text,
  "brandRef" text,
  "quantity" integer DEFAULT 1 NOT NULL,
  "unit" "ComprasUnit" DEFAULT 'UNID'::"ComprasUnit" NOT NULL,
  "productLink" text,
  "requesterUserId" text,
  "requesterName" text,
  "sectorId" text,
  "urgency" "ComprasUrgency" DEFAULT 'MEDIA'::"ComprasUrgency" NOT NULL,
  "deliveryType" "ComprasDeliveryType" DEFAULT 'PADRAO'::"ComprasDeliveryType" NOT NULL,
  "estimatedValue" numeric(10,2) DEFAULT 0 NOT NULL,
  "note" text,
  "status" "ComprasStatus" DEFAULT 'NAO_VERIFICADA'::"ComprasStatus" NOT NULL,
  "approvedByName" text,
  "deniedReason" text,
  "waitUntil" timestamp(3),
  "authorizedBy" text[] DEFAULT ARRAY[]::text[],
  "purchaseValue" numeric(10,2),
  "buyerName" text,
  "paymentType" "ComprasPaymentType",
  "paymentAccountId" text,
  "deliveryForecast" timestamp(3),
  "deliveryKeyword" text,
  "isPaid" boolean DEFAULT false NOT NULL,
  "paidAt" timestamp(3),
  "requestedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "respondedAt" timestamp(3),
  "purchasedAt" timestamp(3),
  "receivedAt" timestamp(3),
  "deliveredAt" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "invoiceDocument" text,
  "assinaturaConfirmada" boolean DEFAULT false NOT NULL,
  "assinaturaObjectKey" text,
  "assinaturaUrl" text,
  "entregueParaNome" text,
  "formasPagamentoAceitas" "ComprasPaymentType"[] DEFAULT ARRAY[]::"ComprasPaymentType"[],
  "parcelas" integer,
  "receivedByName" text,
  "temJuros" boolean,
  "valorJuros" numeric(10,2),
  "quantidadeParcelas" integer,
  "valorParcela" numeric(10,2),
  "notaFiscalObjectKey" text,
  "notaFiscalUrl" text,
  "unitValue" numeric(10,2),
  "fulfillmentStatus" "ComprasFulfillmentStatus"
);
CREATE TABLE sorelly."compras_request_event" (
  "id" text NOT NULL,
  "requestId" text NOT NULL,
  "label" text NOT NULL,
  "at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."compras_request_message" (
  "id" text NOT NULL,
  "requestId" text NOT NULL,
  "authorName" text NOT NULL,
  "body" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."compras_rules" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "text" text DEFAULT ''::text NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."compras_sector" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "color" text
);
CREATE TABLE sorelly."compras_settings" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "quoteTier1Min" numeric(10,2) DEFAULT 500 NOT NULL,
  "quoteTier2Min" numeric(10,2) DEFAULT 2000 NOT NULL,
  "slaHours" integer DEFAULT 24 NOT NULL,
  "dualAuthThreshold" numeric(10,2) DEFAULT 3000 NOT NULL,
  "dualAuthApprovers" text[] DEFAULT ARRAY['Anamaria'::text, 'Marcus'::text],
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_acerto" (
  "id" text NOT NULL,
  "origemId" text,
  "origem" "ConsignadoOrigem" DEFAULT 'MANUAL'::"ConsignadoOrigem" NOT NULL,
  "dataAcerto" date NOT NULL,
  "hora" text NOT NULL,
  "revendedoraNome" text NOT NULL,
  "representanteNome" text NOT NULL,
  "funcionariaInterna" text,
  "situacao" text NOT NULL,
  "assinatura" text DEFAULT ''::text NOT NULL,
  "condicionalAntiga" text DEFAULT ''::text NOT NULL,
  "condicionalNova" text DEFAULT ''::text NOT NULL,
  "numCondicionais" integer DEFAULT 0 NOT NULL,
  "totalPecas" integer DEFAULT 0 NOT NULL,
  "pecasVendidas" integer DEFAULT 0 NOT NULL,
  "pecasRetornadas" integer DEFAULT 0 NOT NULL,
  "vendaBruta" numeric(12,2) DEFAULT 0 NOT NULL,
  "credito" numeric(12,2) DEFAULT 0 NOT NULL,
  "vendaLiquida" numeric(12,2) DEFAULT 0 NOT NULL,
  "diasAtraso" integer DEFAULT 0 NOT NULL,
  "reagAntecipado" integer DEFAULT 0 NOT NULL,
  "reagEmCima" integer DEFAULT 0 NOT NULL,
  "taxaBase" numeric(5,2) DEFAULT 0 NOT NULL,
  "taxaFinal" numeric(5,2) DEFAULT 0 NOT NULL,
  "descontoPontos" integer DEFAULT 0 NOT NULL,
  "comissao" numeric(12,2) DEFAULT 0 NOT NULL,
  "valorAcerto" numeric(12,2) DEFAULT 0 NOT NULL,
  "totalPago" numeric(12,2) DEFAULT 0 NOT NULL,
  "saldoAberto" numeric(12,2) DEFAULT 0 NOT NULL,
  "excedentePago" numeric(12,2) DEFAULT 0 NOT NULL,
  "brindeNormal" numeric(12,2) DEFAULT 0 NOT NULL,
  "brindeSelect" numeric(12,2) DEFAULT 0 NOT NULL,
  "excedenteBrinde" numeric(12,2) DEFAULT 0 NOT NULL,
  "descontoBrindePct" integer DEFAULT 0 NOT NULL,
  "dividaAntiga" numeric(12,2) DEFAULT 0 NOT NULL,
  "observacao" text DEFAULT ''::text NOT NULL,
  "dinheiroConferido" boolean DEFAULT false NOT NULL,
  "quemRecebeu" text,
  "dataEntrega" date,
  "condicionalAssinada" boolean DEFAULT false NOT NULL,
  "acertoComLoja" boolean DEFAULT false NOT NULL,
  "recebidoDiretoComb" numeric(12,2) DEFAULT 0 NOT NULL,
  "comissaoEditada" numeric(12,2),
  "conciliacaoStatus" "ConsignadoConciliacaoStatus" DEFAULT 'AGUARDANDO'::"ConsignadoConciliacaoStatus" NOT NULL,
  "comissaoStatus" text,
  "fechamentoId" text,
  "custom" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "tipoMovimento" "ConsignadoTipoMovimento",
  "cargaApp" jsonb,
  "criadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "atualizadoEm" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_ajuste_pendente" (
  "representanteNome" text NOT NULL,
  "valor" numeric(12,2) DEFAULT 0 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_caso_cobranca" (
  "id" text NOT NULL,
  "acertoId" text NOT NULL,
  "revendedoraNome" text NOT NULL,
  "representanteNome" text NOT NULL,
  "dataAcerto" date NOT NULL,
  "dividaOriginal" numeric(12,2) NOT NULL,
  "valorNegociado" numeric(12,2),
  "etapa" text NOT NULL,
  "kitRecuperado" boolean DEFAULT false NOT NULL,
  "condicionalAssinada" boolean DEFAULT false NOT NULL,
  "gerarComissao" boolean,
  "baixadoContasReceber" boolean DEFAULT false NOT NULL,
  "parcelasPlano" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "contatos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "regras" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "colunas" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "camposCustom" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "funis" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "templates" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "atualizadoEm" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_fechamento_comissao" (
  "id" text NOT NULL,
  "representanteNome" text NOT NULL,
  "total" numeric(12,2) NOT NULL,
  "ajusteIncluido" numeric(12,2) DEFAULT 0 NOT NULL,
  "fechadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "fechadoPor" text NOT NULL,
  "pagamentos" jsonb DEFAULT '[]'::jsonb NOT NULL
);
CREATE TABLE sorelly."consignado_interna" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_km_periodo" (
  "id" text NOT NULL,
  "representanteNome" text NOT NULL,
  "periodo" text NOT NULL,
  "km" numeric(10,2) DEFAULT 0 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."consignado_pagamento" (
  "id" text NOT NULL,
  "acertoId" text NOT NULL,
  "forma" text NOT NULL,
  "conta" text,
  "cnpj" text,
  "valor" numeric(12,2) NOT NULL,
  "data" date,
  "conciliado" boolean DEFAULT false NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "etapaBancaria" "ConsignadoEtapaBancaria" DEFAULT 'PENDENTE'::"ConsignadoEtapaBancaria" NOT NULL,
  "valorReal" numeric(12,2),
  "dataReal" date,
  "divergenciaCategoria" text,
  "divergenciaDetalhe" text
);
CREATE TABLE sorelly."consignado_pagamento_cobranca" (
  "id" text NOT NULL,
  "casoId" text NOT NULL,
  "data" date NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."consignado_representante" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "pct" numeric(5,2) DEFAULT 0 NOT NULL,
  "grupo" integer DEFAULT 1 NOT NULL,
  "placa" text,
  "mei" boolean DEFAULT false NOT NULL,
  "interno" boolean DEFAULT false NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "representanteCod" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."credito_peca_compra" (
  "id" text NOT NULL,
  "funcionarioId" text NOT NULL,
  "data" date NOT NULL,
  "valorOriginal" numeric(10,2) NOT NULL,
  "promocao" boolean DEFAULT false NOT NULL,
  "portaJoias" boolean DEFAULT false NOT NULL,
  "descontoPct" numeric(5,2) NOT NULL,
  "valorCobrado" numeric(10,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "codigosPeca" text[] NOT NULL,
  "luxo" boolean DEFAULT false NOT NULL,
  "dataPrevisaoPagamento" date,
  "multaAtrasoAplicada" boolean DEFAULT false NOT NULL
);
CREATE TABLE sorelly."credito_peca_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "descontoAte200" numeric(5,2) NOT NULL,
  "desconto200a300" numeric(5,2) NOT NULL,
  "desconto300a400" numeric(5,2) NOT NULL,
  "descontoAcima400" numeric(5,2) NOT NULL,
  "descontoPromocaoPortaJoias" numeric(5,2) NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "descontoPecaLuxo" numeric(5,2) NOT NULL,
  "penalidadeAtrasoPct" numeric(5,2) DEFAULT 15 NOT NULL,
  "pagamentoMinimo100a199" numeric(10,2) DEFAULT 75 NOT NULL,
  "pagamentoMinimo200a299" numeric(10,2) DEFAULT 100 NOT NULL,
  "pagamentoMinimo300a399" numeric(10,2) DEFAULT 125 NOT NULL,
  "pagamentoMinimo400a500" numeric(10,2) DEFAULT 150 NOT NULL,
  "pagamentoMinimoAte99" numeric(10,2) DEFAULT 50 NOT NULL
);
CREATE TABLE sorelly."credito_peca_funcionario" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "cnpj" text,
  "setor" text,
  "admissao" date,
  "bloqueado" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL
);
CREATE TABLE sorelly."credito_peca_negociacao" (
  "id" text NOT NULL,
  "funcionarioId" text NOT NULL,
  "data" date NOT NULL,
  "dataAcordada" date,
  "observacao" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."credito_peca_negociacao_compra" (
  "id" text NOT NULL,
  "negociacaoId" text NOT NULL,
  "compraId" text NOT NULL
);
CREATE TABLE sorelly."credito_peca_pagamento" (
  "id" text NOT NULL,
  "funcionarioId" text NOT NULL,
  "data" date NOT NULL,
  "valor" numeric(10,2) NOT NULL,
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "comprovanteUrl" text,
  "comprovanteObjectKey" text
);
CREATE TABLE sorelly."departamento" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "sectorKey" text,
  "arquivado" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."departamento_membro" (
  "id" text NOT NULL,
  "departamentoId" text NOT NULL,
  "nome" text NOT NULL,
  "userId" text,
  "papel" "DepartamentoMembroPapel" DEFAULT 'FUNCIONARIO'::"DepartamentoMembroPapel" NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."estoque_faturamento" (
  "id" text NOT NULL,
  "ano" integer NOT NULL,
  "mes" integer NOT NULL,
  "vendido" numeric(14,2),
  "recebido" numeric(14,2),
  "custoVendido" numeric(14,2),
  "brindeValor" numeric(14,2),
  "brindeCusto" numeric(14,2),
  "revInicio" integer,
  "revEntraram" integer,
  "revSairam" integer,
  "simulados" text[] DEFAULT ARRAY[]::text[],
  "travado" boolean DEFAULT false NOT NULL,
  "criadoPorNome" text NOT NULL,
  "criadoPorEmail" text NOT NULL,
  "editadoPorNome" text,
  "editadoPorEmail" text,
  "editadoEm" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."estoque_interno_categoria" (
  "id" text NOT NULL,
  "tipo" "EstoqueInternoTipo" NOT NULL,
  "nome" text NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."estoque_interno_compra" (
  "id" text NOT NULL,
  "itemId" text NOT NULL,
  "quantidade" integer NOT NULL,
  "status" "EstoqueInternoCompraStatus" DEFAULT 'SOLICITADO'::"EstoqueInternoCompraStatus" NOT NULL,
  "solicitadoPor" text NOT NULL,
  "decididoPor" text,
  "decididoEm" timestamp(3),
  "observacao" text,
  "dataCompra" date,
  "dataPrevisaoChegada" date,
  "dataRecebimento" date,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."estoque_interno_contagem" (
  "id" text NOT NULL,
  "itemId" text NOT NULL,
  "valor" integer NOT NULL,
  "contadoPor" text NOT NULL,
  "data" date NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."estoque_interno_item" (
  "id" text NOT NULL,
  "categoriaId" text NOT NULL,
  "numero" integer NOT NULL,
  "material" text NOT NULL,
  "unidade" text NOT NULL,
  "fornecedor" text,
  "estoqueMinimo" integer NOT NULL,
  "estoqueAtual" integer DEFAULT 0 NOT NULL,
  "atualizadoEm" timestamp(3),
  "parado" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "situacao" "EstoqueInternoSituacao" DEFAULT 'NAO_PRECISA_COMPRAR'::"EstoqueInternoSituacao" NOT NULL,
  "observacoes" text
);
CREATE TABLE sorelly."estoque_interno_item_log" (
  "id" text NOT NULL,
  "itemId" text,
  "itemNumero" integer NOT NULL,
  "itemMaterial" text NOT NULL,
  "acao" "EstoqueInternoItemLogAcao" NOT NULL,
  "detalhe" text,
  "autorNome" text NOT NULL,
  "autorEmail" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."estoque_interno_member" (
  "id" text NOT NULL,
  "userId" text NOT NULL,
  "role" "EstoqueInternoRole" NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."estoque_posicao" (
  "id" text NOT NULL,
  "ano" integer NOT NULL,
  "mes" integer NOT NULL,
  "dia" integer DEFAULT 1 NOT NULL,
  "qtdRevendedoras" integer,
  "internoPecas" integer,
  "internoCusto" numeric(14,2),
  "internoVenda" numeric(14,2),
  "revPecas" integer,
  "revCusto" numeric(14,2),
  "revVenda" numeric(14,2),
  "simulados" text[] DEFAULT ARRAY[]::text[],
  "travado" boolean DEFAULT false NOT NULL,
  "criadoPorNome" text NOT NULL,
  "criadoPorEmail" text NOT NULL,
  "editadoPorNome" text,
  "editadoPorEmail" text,
  "editadoEm" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."estoque_settings" (
  "id" text NOT NULL,
  "recebimentoPct" numeric(5,2) DEFAULT 55 NOT NULL,
  "comissaoRepPct" numeric(5,2) DEFAULT 15 NOT NULL,
  "metaKitMedio" numeric(12,2) DEFAULT 0 NOT NULL,
  "ajuda" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."expositor_cliente" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "telefone" text NOT NULL,
  "telefoneKey" text NOT NULL,
  "endereco" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."expositor_condicional" (
  "id" text NOT NULL,
  "numero" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "status" "ExpositorCondicionalStatus" DEFAULT 'BIPADO'::"ExpositorCondicionalStatus" NOT NULL,
  "nome" text NOT NULL,
  "telefone" text NOT NULL,
  "endereco" text,
  "dataSaida" timestamp(3),
  "retiradoPorNome" text,
  "retiradoPorEmail" text,
  "fotoEnderecoUrl" text,
  "fotoEnderecoObjectKey" text,
  "fotoExpositorUrl" text,
  "fotoExpositorObjectKey" text,
  "quantidadeTotalPecas" integer DEFAULT 0 NOT NULL,
  "valorTotal" numeric(12,2) DEFAULT 0 NOT NULL,
  "observacoes" text,
  "pedirDeVolta" boolean DEFAULT false NOT NULL,
  "pedirDeVoltaMotivo" text,
  "pedirDeVoltaData" timestamp(3),
  "dataDevolucao" timestamp(3),
  "condicaoDevolucao" "ExpositorCondicaoDevolucao",
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "observacaoDevolucao" text,
  "fotoAvariaUrl" text,
  "fotoAvariaObjectKey" text,
  "fotoAvaria2Url" text,
  "fotoAvaria2ObjectKey" text,
  "motivoDevolucao" text,
  "responsavelDevolucao" text,
  "tipoAvaria" "ExpositorTipoAvaria",
  "descricaoAvaria" text,
  "valorEstimadoReparo" numeric(12,2),
  "statusAvaria" "ExpositorAvariaStatus",
  "codigoDevmaster" integer
);
CREATE TABLE sorelly."expositor_condicional_item" (
  "id" text NOT NULL,
  "condicionalId" text NOT NULL,
  "estoqueItemId" text NOT NULL,
  "quantidade" integer NOT NULL,
  "valorUnitario" numeric(10,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."expositor_estoque_item" (
  "id" text NOT NULL,
  "codigo" text NOT NULL,
  "nome" text NOT NULL,
  "valorUnitario" numeric(10,2) NOT NULL,
  "quantidade" integer DEFAULT 0 NOT NULL,
  "estoqueMinimo" integer DEFAULT 3 NOT NULL,
  "fotoUrl" text,
  "fotoObjectKey" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."expositor_fila" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "telefone" text NOT NULL,
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "dataAcerto" date
);
CREATE TABLE sorelly."faturamento_ajuste_sazonal" (
  "mes" integer NOT NULL,
  "percentual" double precision DEFAULT 0 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "ratio" double precision DEFAULT 0.92 NOT NULL,
  "mult" double precision DEFAULT 1.1 NOT NULL,
  "fillPct" double precision DEFAULT 0.95 NOT NULL,
  "windowDays" integer DEFAULT 30 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_contas_diario" (
  "id" text NOT NULL,
  "date" date NOT NULL,
  "pago" numeric(14,2) DEFAULT 0 NOT NULL,
  "faturado" numeric(14,2) DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "valores" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "recebido" numeric(14,2) DEFAULT 0 NOT NULL
);
CREATE TABLE sorelly."faturamento_contas_diario_colunas" (
  "id" text NOT NULL,
  "chave" text NOT NULL,
  "nome" text NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_contas_mes" (
  "yearMonth" text NOT NULL,
  "pagas" numeric(14,2),
  "apagar" numeric(14,2),
  "previstas" numeric(14,2),
  "efetivas" numeric(14,2),
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_credito" (
  "id" text NOT NULL,
  "yearMonth" text NOT NULL,
  "valorLiquido" numeric(14,2) NOT NULL,
  "dataEntrada" date NOT NULL,
  "incluirResultado" boolean DEFAULT true NOT NULL,
  "descricao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_current_input" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "yearMonth" text NOT NULL,
  "vendaTotal" numeric(14,2) DEFAULT 0 NOT NULL,
  "valorRecebido" numeric(14,2) DEFAULT 0 NOT NULL,
  "acertosReal" integer DEFAULT 1 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "referenteA" date
);
CREATE TABLE sorelly."faturamento_fechamento_draft" (
  "yearMonth" text NOT NULL,
  "faturadoReal" numeric(14,2),
  "retidoPenhorSafra" numeric(14,2),
  "retidoMaquinas" numeric(14,2),
  "precoVendaSemBrinde" numeric(14,2),
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_fechamento_log" (
  "id" text NOT NULL,
  "yearMonth" text NOT NULL,
  "acao" "FaturamentoFechamentoLogAcao" NOT NULL,
  "detalhe" text,
  "snapshot" jsonb NOT NULL,
  "autorNome" text NOT NULL,
  "autorEmail" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."faturamento_fixed_month" (
  "yearMonth" text NOT NULL,
  "snapshot" jsonb NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "revendedorasFinal" integer,
  "acertosRealFechamento" integer,
  "faturadoRealFechamento" numeric(14,2),
  "precoVendaSemBrinde" numeric(14,2),
  "retidoPenhorSafra" numeric(14,2),
  "retidoMaquinas" numeric(14,2),
  "fechadoPorNome" text,
  "fechadoPorEmail" text,
  "fechadoEm" timestamp(3),
  "recebidoRealFechamento" numeric(14,2),
  "despesaAdministrativa" numeric(14,2),
  "despesaFamilia" numeric(14,2),
  "incluirFamiliaResultado" boolean DEFAULT true NOT NULL
);
CREATE TABLE sorelly."faturamento_month_fill" (
  "yearMonth" text NOT NULL,
  "total" integer,
  "prevMes" integer,
  "realizar" integer,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."faturamento_saldo_mes" (
  "yearMonth" text NOT NULL,
  "saldoFim" numeric(14,2),
  "saldoFimPreenchidoEm" timestamp(3),
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_account" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "blockId" text NOT NULL,
  "type" "FinanceAccountType" DEFAULT 'PJ'::"FinanceAccountType" NOT NULL,
  "limit" numeric(12,2) DEFAULT 0 NOT NULL,
  "blocked" boolean DEFAULT false NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_balance" (
  "id" text NOT NULL,
  "accountId" text NOT NULL,
  "date" date NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_block" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_chave_pix" (
  "id" text NOT NULL,
  "financeAccountId" text,
  "grupo" text NOT NULL,
  "codigoFolha" text NOT NULL,
  "banco" text NOT NULL,
  "chavePixTipo" "FinanceFamiliarChavePixTipo" NOT NULL,
  "chavePix" text NOT NULL,
  "favorecido" text NOT NULL,
  "posicao" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_alerta_regra" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "tipo" "FinanceFamiliarAlertaTipo" NOT NULL,
  "limite" numeric(14,2) NOT NULL,
  "personaId" text,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_categoria_config" (
  "id" text NOT NULL,
  "chave" text NOT NULL,
  "nome" text NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "sistema" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_colunas_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "visiveis" text[],
  "customizadas" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_conta" (
  "id" text NOT NULL,
  "personaId" text NOT NULL,
  "descricao" text NOT NULL,
  "categoria" text NOT NULL,
  "contaBancariaId" text,
  "diaVencimento" integer NOT NULL,
  "formaPagamento" "FinanceFamiliarFormaPagamento" DEFAULT 'PIX'::"FinanceFamiliarFormaPagamento" NOT NULL,
  "beneficiario" text,
  "observacao" text,
  "encerraEm" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "camposExtras" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE sorelly."finance_familiar_conta_bancaria" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "banco" text NOT NULL,
  "tipo" text NOT NULL,
  "personaId" text,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "prestadorId" text,
  "chavePix" text,
  "chavePixTipo" "FinanceFamiliarChavePixTipo"
);
CREATE TABLE sorelly."finance_familiar_conta_parcela" (
  "id" text NOT NULL,
  "contaId" text NOT NULL,
  "yearMonth" text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "status" "FinanceFamiliarParcelaStatus" DEFAULT 'PENDENTE'::"FinanceFamiliarParcelaStatus" NOT NULL,
  "pagoEm" date,
  "formaPagamento" "FinanceFamiliarFormaPagamento",
  "contaUtilizada" text,
  "observacaoPagamento" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "valorPago" numeric(12,2) DEFAULT 0 NOT NULL
);
CREATE TABLE sorelly."finance_familiar_conta_parcela_pagamento" (
  "id" text NOT NULL,
  "parcelaId" text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "pagoEm" date NOT NULL,
  "formaPagamento" "FinanceFamiliarFormaPagamento" NOT NULL,
  "contaUtilizada" text,
  "observacaoPagamento" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."finance_familiar_historico" (
  "id" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "userId" text,
  "usuarioNome" text NOT NULL,
  "usuarioEmail" text,
  "area" text NOT NULL,
  "acao" text NOT NULL,
  "alvo" text NOT NULL,
  "detalhe" text,
  "personaId" text,
  "metodo" text NOT NULL,
  "rota" text NOT NULL,
  "dados" jsonb
);
CREATE TABLE sorelly."finance_familiar_hora_extra" (
  "id" text NOT NULL,
  "personaId" text NOT NULL,
  "yearMonth" text NOT NULL,
  "semana" text NOT NULL,
  "horas" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_leilao_conferencia" (
  "id" text NOT NULL,
  "leilaoSaleId" text NOT NULL,
  "status" "FinanceFamiliarPixAuditoria" DEFAULT 'PENDENTE'::"FinanceFamiliarPixAuditoria" NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_mes_liberado" (
  "yearMonth" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."finance_familiar_persona" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "cor" text NOT NULL,
  "tipo" "FinanceFamiliarPersonaTipo" DEFAULT 'SOCIO'::"FinanceFamiliarPersonaTipo" NOT NULL,
  "posicao" integer DEFAULT 0 NOT NULL,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "mostrarProlabore" boolean DEFAULT true NOT NULL,
  "mostrarContas" boolean DEFAULT true NOT NULL,
  "mostrarPix" boolean DEFAULT true NOT NULL,
  "podePreencherContas" boolean DEFAULT true NOT NULL,
  "podePreencherPix" boolean DEFAULT true NOT NULL,
  "podeCriarPrestador" boolean DEFAULT false NOT NULL,
  "userEmail" text,
  "mostrarLeilao" boolean DEFAULT true NOT NULL
);
CREATE TABLE sorelly."finance_familiar_pix_lancamento" (
  "id" text NOT NULL,
  "personaId" text NOT NULL,
  "yearMonth" text NOT NULL,
  "semana" text NOT NULL,
  "data" date NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "origem" text NOT NULL,
  "forma" "FinanceFamiliarFormaPagamento" DEFAULT 'PIX'::"FinanceFamiliarFormaPagamento" NOT NULL,
  "auditoria" "FinanceFamiliarPixAuditoria" DEFAULT 'PENDENTE'::"FinanceFamiliarPixAuditoria" NOT NULL,
  "auditadoPor" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "contaBancariaId" text
);
CREATE TABLE sorelly."finance_familiar_pix_meta" (
  "id" text NOT NULL,
  "personaId" text NOT NULL,
  "yearMonth" text NOT NULL,
  "meta" numeric(12,2) DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_prestador" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "servico" text,
  "chavePix" text,
  "responsavelId" text,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "observacoes" text
);
CREATE TABLE sorelly."finance_familiar_prestador_divida" (
  "id" text NOT NULL,
  "prestadorId" text NOT NULL,
  "descricao" text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "data" date NOT NULL,
  "prazo" date,
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_prestador_repasse" (
  "id" text NOT NULL,
  "prestadorId" text NOT NULL,
  "data" date NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "origem" text,
  "forma" "FinanceFamiliarFormaPagamento" DEFAULT 'PIX'::"FinanceFamiliarFormaPagamento" NOT NULL,
  "conta" text,
  "origemPixPersonaId" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "origemPixLancamentoId" text,
  "chavePixDestino" text,
  "observacao" text,
  "origemLeilaoSaleId" text
);
CREATE TABLE sorelly."finance_familiar_prolabore" (
  "personaId" text NOT NULL,
  "empresa" text NOT NULL,
  "cnpj" text,
  "horaExtraAtivo" boolean DEFAULT false NOT NULL,
  "horaExtraValor" numeric(10,2) DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_prolabore_vigencia" (
  "id" text NOT NULL,
  "personaId" text NOT NULL,
  "vigenciaDesde" text NOT NULL,
  "bruto" numeric(12,2) NOT NULL,
  "inss" numeric(12,2) DEFAULT 0 NOT NULL,
  "irrf" numeric(12,2) DEFAULT 0 NOT NULL,
  "liquido" numeric(12,2) NOT NULL,
  "splitDia1" integer,
  "splitValor1" numeric(12,2),
  "splitDia2" integer,
  "splitValor2" numeric(12,2),
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."finance_familiar_relatorio_fechamento" (
  "yearMonth" text NOT NULL,
  "snapshot" jsonb NOT NULL,
  "criadoPorNome" text NOT NULL,
  "criadoPorEmail" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."finance_familiar_transferencia" (
  "id" text NOT NULL,
  "contaOrigemId" text NOT NULL,
  "contaDestinoId" text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "data" date NOT NULL,
  "status" "FinanceFamiliarParcelaStatus" DEFAULT 'PENDENTE'::"FinanceFamiliarParcelaStatus" NOT NULL,
  "pagoEm" date,
  "formaPagamento" "FinanceFamiliarFormaPagamento",
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."fiscal_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "sublimiteAnual" numeric(14,2) DEFAULT 3600000 NOT NULL,
  "metaIlf" numeric(5,4) DEFAULT 0.30 NOT NULL,
  "criticoIlf" numeric(5,4) DEFAULT 0.15 NOT NULL
);
CREATE TABLE sorelly."fiscal_conta_mensal" (
  "id" text NOT NULL,
  "empresaId" text NOT NULL,
  "yearMonth" text NOT NULL,
  "totalContasAPagar" numeric(12,2) DEFAULT 0 NOT NULL
);
CREATE TABLE sorelly."fiscal_empresa" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "razao" text NOT NULL,
  "cnpj" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."fiscal_nota_entrada" (
  "id" text NOT NULL,
  "empresaId" text NOT NULL,
  "data" date NOT NULL,
  "nf" text NOT NULL,
  "fornecedor" text NOT NULL,
  "cfop" text NOT NULL,
  "uf" text NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "classificacao" "FiscalClassificacaoEntrada" NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."fiscal_saida_periodo" (
  "id" text NOT NULL,
  "empresaId" text NOT NULL,
  "yearMonth" text NOT NULL,
  "periodo" integer NOT NULL,
  "venda" numeric(12,2) DEFAULT 0 NOT NULL,
  "brindes" numeric(12,2) DEFAULT 0 NOT NULL,
  "trocas" numeric(12,2) DEFAULT 0 NOT NULL
);
CREATE TABLE sorelly."indicacao_historico_legado" (
  "id" text NOT NULL,
  "linhaPlanilha" integer NOT NULL,
  "revendedoraChave" text NOT NULL,
  "nomeRevendedora" text NOT NULL,
  "telefoneRevendedora" text,
  "categoria" text NOT NULL,
  "dataIndicacao" date,
  "nomeIndicada" text,
  "telefoneIndicada" text,
  "status" text NOT NULL,
  "dataAprovacao" date,
  "dataKitEntregue" date,
  "contaMoedas" boolean NOT NULL,
  "aVerificar" boolean DEFAULT false NOT NULL,
  "motivo" text,
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."indicacao_resgate_operacao" (
  "id" text NOT NULL,
  "resgateId" integer NOT NULL,
  "codigosPecas" text[] DEFAULT ARRAY[]::text[],
  "responsavelNome" text,
  "observacao" text,
  "dataAgendada" timestamp(3),
  "vendidoSistema" boolean DEFAULT false NOT NULL,
  "emContato" boolean DEFAULT false NOT NULL,
  "emContatoEm" timestamp(3),
  "atualizadoPor" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "valorVendaCentavos" integer,
  "valorDiferencaBrindeCentavos" integer,
  "retiradaMaleta" boolean DEFAULT false NOT NULL,
  "dataAcertoMaleta" timestamp(3),
  "representanteMaleta" text,
  "vendidoSistemaEm" timestamp(3),
  "pecasNaoVendidas" boolean DEFAULT false NOT NULL,
  "pecasNaoVendidasEm" timestamp(3)
);
CREATE TABLE sorelly."kit_block" (
  "id" text NOT NULL,
  "key" text NOT NULL,
  "title" text NOT NULL,
  "accent" text NOT NULL,
  "type" "KitBlockType" NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "position" integer NOT NULL,
  "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."kit_novo" (
  "id" text NOT NULL,
  "codigo" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "etapa" "KitNovoEtapa" DEFAULT 'CADASTRADA'::"KitNovoEtapa" NOT NULL,
  "etapaAnterior" "KitNovoEtapa",
  "nome" text NOT NULL,
  "telefone" text,
  "cidade" text NOT NULL,
  "bairro" text,
  "enderecoResidencial" text,
  "profissao" text,
  "trabalhoNome" text,
  "trabalhoEndereco" text,
  "disponibilidade" text,
  "observacao" text,
  "origem" text,
  "entrada" text,
  "campanhaId" text,
  "modelo" "KitNovoModelo" DEFAULT 'MISTO'::"KitNovoModelo" NOT NULL,
  "valor" numeric(12,2) NOT NULL,
  "expositor" boolean DEFAULT false NOT NULL,
  "vemNaEmpresa" boolean DEFAULT false NOT NULL,
  "faltaLigar" boolean DEFAULT false NOT NULL,
  "tipo" "KitNovoTipo" DEFAULT 'VENDEDORA'::"KitNovoTipo" NOT NULL,
  "representanteCod" text,
  "representanteNome" text,
  "retirada" text,
  "desmarcacoes" integer DEFAULT 0 NOT NULL,
  "contatos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "cadastradaEm" date NOT NULL,
  "liberadoEm" date,
  "solicitadoEm" date,
  "bipadoEm" date,
  "retornoEm" date,
  "motivoCancelamento" text,
  "operadorNome" text NOT NULL,
  "operadorId" text,
  "kommoLeadId" integer,
  "appStatus" "KitNovoAppStatus",
  "appAgendadoPara" date,
  "appPeriodo" text,
  "appEnviadoEm" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."kit_novo_config" (
  "id" text DEFAULT 'singleton'::text NOT NULL,
  "prazoCadastrada" integer DEFAULT 1 NOT NULL,
  "prazoLiberado" integer DEFAULT 1 NOT NULL,
  "prazoSolicitado" integer DEFAULT 1 NOT NULL,
  "prazoBipado" integer DEFAULT 3 NOT NULL,
  "metaDias" integer DEFAULT 7 NOT NULL,
  "maxDesmarcacoes" integer DEFAULT 3 NOT NULL,
  "ocultarAposDias" integer DEFAULT 7 NOT NULL,
  "valorPadrao" numeric(12,2) DEFAULT 7000 NOT NULL,
  "recusasBloqueio" integer DEFAULT 2 NOT NULL,
  "motivosCancelamento" text[] DEFAULT ARRAY['Revendedora não responde'::text, 'Não tem mais interesse'::text, 'Fica desmarcando com a representante'::text, 'Cadastro reprovado'::text, 'Endereço inválido'::text],
  "campanhas" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "appCursor" timestamp(3),
  "appSincronizadoEm" timestamp(3),
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."kit_novo_historico" (
  "id" text NOT NULL,
  "kitNovoId" text NOT NULL,
  "autorNome" text NOT NULL,
  "autorId" text,
  "texto" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."kit_novo_recusa" (
  "id" text NOT NULL,
  "kitNovoId" text NOT NULL,
  "representanteCod" text NOT NULL,
  "representanteNome" text NOT NULL,
  "motivo" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."kit_novo_representante" (
  "cod" text NOT NULL,
  "bloqueadaManual" boolean,
  "desbloqueadaEm" timestamp(3),
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."kommo_lead" (
  "id" integer NOT NULL,
  "accountId" integer NOT NULL,
  "kommoName" text,
  "pipelineId" integer,
  "statusId" integer,
  "responsibleUserId" integer,
  "nome" text,
  "cidade" text,
  "endereco" text,
  "cep" text,
  "profissao" text,
  "empresaNome" text,
  "empresaTempoAtuacao" text,
  "empresaEndereco" text,
  "conferenciaAt" timestamp(3),
  "reviewStatus" "KommoLeadReviewStatus" DEFAULT 'PENDING'::"KommoLeadReviewStatus" NOT NULL,
  "reviewedAt" timestamp(3),
  "reviewedBy" text,
  "reviewNote" text,
  "rawPayload" jsonb NOT NULL,
  "kommoCreatedAt" timestamp(3),
  "kommoUpdatedAt" timestamp(3),
  "syncedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "lastOutboundWriteAt" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "observacoes" text,
  "tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "desempenho" text,
  "kitOpcao" "KommoLeadKitOpcao",
  "kitValorCasa" numeric(12,2),
  "kitValorEmpresa" numeric(12,2)
);
CREATE TABLE sorelly."kommo_lead_image" (
  "leadId" integer NOT NULL,
  "fieldId" integer NOT NULL,
  "slug" text NOT NULL,
  "fileUuid" uuid,
  "versionUuid" uuid,
  "originalName" text,
  "mimeType" text,
  "sizeBytes" bigint,
  "width" integer,
  "height" integer,
  "urlThumb" text,
  "urlCard" text,
  "urlFull" text,
  "lqip" text,
  "status" "KommoLeadImageStatus" DEFAULT 'PENDING'::"KommoLeadImageStatus" NOT NULL,
  "error" text,
  "syncedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."listagem" (
  "id" text NOT NULL,
  "codigo" integer GENERATED BY DEFAULT AS IDENTITY NOT NULL,
  "representanteCod" text NOT NULL,
  "representanteNome" text NOT NULL,
  "data" date NOT NULL,
  "horario" text NOT NULL,
  "destino" text NOT NULL,
  "viagem" boolean DEFAULT false NOT NULL,
  "status" "ListagemStatus" DEFAULT 'ABERTA'::"ListagemStatus" NOT NULL,
  "concluidaEm" timestamp(3),
  "codigoRetirada" text NOT NULL,
  "origem" "ListagemOrigem" DEFAULT 'APP'::"ListagemOrigem" NOT NULL,
  "criadoPorNome" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."listagem_config" (
  "id" text DEFAULT 'singleton'::text NOT NULL,
  "maxItens" integer DEFAULT 15 NOT NULL,
  "prazoHoras" integer DEFAULT 48 NOT NULL,
  "limiteConferencia" numeric(12,2) DEFAULT 15000 NOT NULL,
  "limiteAnalise" numeric(12,2) DEFAULT 2500 NOT NULL,
  "divergenciaPct" integer DEFAULT 20 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."listagem_evento" (
  "id" text NOT NULL,
  "listagemId" text NOT NULL,
  "itemId" text,
  "autorNome" text NOT NULL,
  "autorId" text,
  "texto" text NOT NULL,
  "em" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."listagem_item" (
  "id" text NOT NULL,
  "listagemId" text NOT NULL,
  "revendedoraId" integer,
  "kitNovoId" text,
  "nome" text NOT NULL,
  "bairro" text,
  "tipo" "ListagemItemTipo" NOT NULL,
  "status" "ListagemItemStatus" NOT NULL,
  "ordem" integer DEFAULT 0 NOT NULL,
  "horaAtendimento" text,
  "atrasado" boolean DEFAULT false NOT NULL,
  "ultimaHora" boolean DEFAULT false NOT NULL,
  "prioritario" boolean DEFAULT false NOT NULL,
  "vendas" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "media" numeric(12,2),
  "valor" numeric(12,2),
  "valorDefinidoPor" text,
  "valorDefinidoEm" timestamp(3),
  "analiseObrigatoria" boolean DEFAULT false NOT NULL,
  "montadoraNome" text,
  "montagemIniciadaEm" timestamp(3),
  "montagemConcluidaEm" timestamp(3),
  "montagemRegistroId" text,
  "conferidoPor" text,
  "conferidoEm" timestamp(3),
  "motivoAjuste" text,
  "ajustes" integer DEFAULT 0 NOT NULL,
  "bipadoraNome" text,
  "bipagemIniciadaEm" timestamp(3),
  "bipagemConcluidaEm" timestamp(3),
  "valorReal" numeric(12,2),
  "divergente" boolean DEFAULT false NOT NULL,
  "novaCondicional" text,
  "retiradaId" text,
  "retiradoEm" timestamp(3),
  "removidoEm" timestamp(3),
  "removidoPor" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."listagem_retirada" (
  "id" text NOT NULL,
  "listagemId" text NOT NULL,
  "modo" "ListagemRetiradaModo" NOT NULL,
  "status" "ListagemRetiradaStatus" DEFAULT 'CONFIRMADA'::"ListagemRetiradaStatus" NOT NULL,
  "itens" text[],
  "porNome" text NOT NULL,
  "assinatura" text,
  "codigoConferido" boolean DEFAULT false NOT NULL,
  "em" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "respondidaEm" timestamp(3)
);
CREATE TABLE sorelly."marketing_divulgacao_anexo" (
  "id" text NOT NULL,
  "arteId" text NOT NULL,
  "url" text NOT NULL,
  "objectKey" text NOT NULL,
  "mime" text NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."marketing_divulgacao_arte" (
  "id" text NOT NULL,
  "nome" varchar(200) NOT NULL,
  "data" date NOT NULL,
  "tipo" "MarketingDivulgacaoTipo" NOT NULL,
  "canais" "MarketingDivulgacaoCanal"[] DEFAULT ARRAY[]::"MarketingDivulgacaoCanal"[],
  "status" "MarketingDivulgacaoStatus" DEFAULT 'EM_PRODUCAO'::"MarketingDivulgacaoStatus" NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "videoLink" varchar(500)
);
CREATE TABLE sorelly."marketing_group" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "coverUrl" text,
  "badges" "MarketingBadge"[] DEFAULT ARRAY[]::"MarketingBadge"[],
  "createdById" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "slug" text NOT NULL
);
CREATE TABLE sorelly."marketing_image" (
  "id" text NOT NULL,
  "groupId" text NOT NULL,
  "url" text NOT NULL,
  "name" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "source" "MarketingImageSource" DEFAULT 'EXTERNAL'::"MarketingImageSource" NOT NULL,
  "objectKey" text,
  "format" text
);
CREATE TABLE sorelly."montagem_bonus_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "limiteKitEspecial" numeric(10,2) DEFAULT 12000 NOT NULL,
  "metaKitsNormal" integer DEFAULT 8 NOT NULL,
  "bonusBaseNormal" numeric(10,2) DEFAULT 15 NOT NULL,
  "bonusExtraNormal" numeric(10,2) DEFAULT 2 NOT NULL,
  "metaKitsEspecial" integer DEFAULT 6 NOT NULL,
  "bonusBaseEspecial" numeric(10,2) DEFAULT 15 NOT NULL,
  "bonusExtraEspecial" numeric(10,2) DEFAULT 3 NOT NULL,
  "usarFiltroAvaliacao" boolean DEFAULT true NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."montagem_kit_registro" (
  "id" text NOT NULL,
  "resellerId" integer NOT NULL,
  "resellerNome" text NOT NULL,
  "valorKit" numeric(10,2) DEFAULT 0 NOT NULL,
  "usouPreferencias" boolean NOT NULL,
  "iniciadoEm" timestamp(3) NOT NULL,
  "concluidoEm" timestamp(3) NOT NULL,
  "montadoPorNome" text NOT NULL,
  "montadoPorEmail" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "staffNome" text DEFAULT ''::text NOT NULL
);
CREATE TABLE sorelly."montagem_staff" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."mural_aviso" (
  "id" text NOT NULL,
  "titulo" varchar(200) NOT NULL,
  "corpo" text NOT NULL,
  "tipo" "MuralAvisoTipo" DEFAULT 'GERAL'::"MuralAvisoTipo" NOT NULL,
  "setores" text[] DEFAULT ARRAY[]::text[],
  "ativo" boolean DEFAULT true NOT NULL,
  "createdById" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."mural_novidade" (
  "id" text NOT NULL,
  "titulo" varchar(200) NOT NULL,
  "resumo" varchar(400),
  "conteudo" text NOT NULL,
  "imagemUrl" text,
  "objectKey" text,
  "categoria" "MuralNovidadeCategoria" DEFAULT 'COMUNICADO'::"MuralNovidadeCategoria" NOT NULL,
  "status" "MuralNovidadeStatus" DEFAULT 'DRAFT'::"MuralNovidadeStatus" NOT NULL,
  "prioridade" integer DEFAULT 0 NOT NULL,
  "botaoTexto" varchar(100),
  "botaoLink" varchar(500),
  "publicadoEm" timestamp(3),
  "expiraEm" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."notificacao" (
  "id" text NOT NULL,
  "userId" text NOT NULL,
  "tipo" text NOT NULL,
  "titulo" text NOT NULL,
  "mensagem" text,
  "link" text,
  "referencia" text NOT NULL,
  "lidaEm" timestamp(3),
  "resolvidaEm" timestamp(3),
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."producao_bonus_override" (
  "id" text NOT NULL,
  "staffName" text NOT NULL,
  "ano" integer NOT NULL,
  "mes" integer NOT NULL,
  "valor" numeric(10,2) NOT NULL,
  "editadoPorNome" text NOT NULL,
  "editadoPorEmail" text NOT NULL,
  "editadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."producao_bonus_tier" (
  "id" text NOT NULL,
  "minPieces" integer NOT NULL,
  "maxPieces" integer,
  "value" numeric(10,2) DEFAULT 0 NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."producao_code" (
  "id" text NOT NULL,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."producao_entry" (
  "id" text NOT NULL,
  "date" date NOT NULL,
  "staffName" text NOT NULL,
  "code" text NOT NULL,
  "qty" integer DEFAULT 0 NOT NULL,
  "unitValue" numeric(10,2) DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "unidade" "ProducaoUnidade" DEFAULT 'SORELLY'::"ProducaoUnidade" NOT NULL
);
CREATE TABLE sorelly."producao_staff" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."push_agendamento" (
  "id" text NOT NULL,
  "titulo" varchar(65) NOT NULL,
  "mensagem" varchar(240) NOT NULL,
  "acaoTipo" "PushAcaoTipo" DEFAULT 'NENHUMA'::"PushAcaoTipo" NOT NULL,
  "acaoValor" varchar(500),
  "modo" "PushAgendamentoModo" NOT NULL,
  "frequencia" "PushFrequencia",
  "primeiraOcorrencia" timestamp(3) NOT NULL,
  "proximaOcorrencia" timestamp(3),
  "terminoTipo" "PushTermino" NOT NULL,
  "totalOcorrencias" integer,
  "ocorrenciasRealizadas" integer DEFAULT 0 NOT NULL,
  "status" "PushAgendamentoStatus" DEFAULT 'PENDENTE'::"PushAgendamentoStatus" NOT NULL,
  "scheduleName" text,
  "criadoPorId" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "diasSemana" integer[] DEFAULT ARRAY[]::integer[],
  "totalSemanas" integer,
  "destinatarios" jsonb
);
CREATE TABLE sorelly."push_envio" (
  "id" text NOT NULL,
  "titulo" varchar(65) NOT NULL,
  "mensagem" varchar(240) NOT NULL,
  "acaoTipo" "PushAcaoTipo" DEFAULT 'NENHUMA'::"PushAcaoTipo" NOT NULL,
  "acaoValor" varchar(500),
  "tipo" "PushEnvioTipo" NOT NULL,
  "agendamentoId" text,
  "status" "PushEnvioStatus" DEFAULT 'NA_FILA'::"PushEnvioStatus" NOT NULL,
  "elegiveis" integer,
  "aceitos" integer,
  "confirmados" integer,
  "falhas" integer,
  "motivoFalha" varchar(300),
  "disparadoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "contadoresSincronizadosEm" timestamp(3),
  "criadoPorId" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "canceladoEm" timestamp(3),
  "falhasRecuperaveis" integer,
  "motivosFalha" jsonb,
  "destinatarios" jsonb
);
CREATE TABLE sorelly."representante_resumo_ia" (
  "representanteCod" varchar(50) NOT NULL,
  "resumo" text NOT NULL,
  "geradoEm" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "baseAvaliacoes" integer NOT NULL,
  "geracaoIniciadaEm" timestamp(3)
);
CREATE TABLE sorelly."rh_advertencia" (
  "id" text NOT NULL,
  "colaboradorId" text NOT NULL,
  "data" date NOT NULL,
  "tipoId" text NOT NULL,
  "motivoId" text NOT NULL,
  "diasSuspensao" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_advertencia_motivo" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_advertencia_tipo" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "geraSuspensao" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_anp_preco_combustivel_cache" (
  "id" text NOT NULL,
  "municipio" text NOT NULL,
  "uf" text NOT NULL,
  "produto" text NOT NULL,
  "precoMedioRevenda" numeric(10,3) NOT NULL,
  "semanaInicio" date NOT NULL,
  "semanaFim" date NOT NULL,
  "aproximado" boolean NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_cargo" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "nivel" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_colaborador" (
  "id" text NOT NULL,
  "empresaId" text NOT NULL,
  "nome" text NOT NULL,
  "cargoId" text NOT NULL,
  "salario" numeric(10,2) NOT NULL,
  "escalaId" text NOT NULL,
  "horarioEntrada" text NOT NULL,
  "dataAdmissao" date NOT NULL,
  "planoExperienciaId" text,
  "status" "RhColaboradorStatus" DEFAULT 'ATIVO'::"RhColaboradorStatus" NOT NULL,
  "efetivadoEm" date,
  "efetivadoAutorId" text,
  "desligamentoData" date,
  "desligamentoTipo" text,
  "desligamentoMotivo" text,
  "desligamentoObs" text,
  "desligamentoAutorId" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "setorId" text NOT NULL,
  "feriasInicio" date,
  "feriasFim" date,
  "afastamentoMotivo" text,
  "cargaHoraria" numeric(4,2)
);
CREATE TABLE sorelly."rh_config" (
  "id" text DEFAULT 'default'::text NOT NULL,
  "socios" integer DEFAULT 0 NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_contrato" (
  "id" text NOT NULL,
  "tipo" "RhContratoTipo" NOT NULL,
  "status" text NOT NULL,
  "colaboradorId" text,
  "acertosRepresentanteId" text,
  "nome" text NOT NULL,
  "cpf" text,
  "cnpj" text,
  "documento" text,
  "valor" numeric(10,2),
  "vigenciaInicio" date,
  "vigenciaFim" date,
  "obs" text,
  "extra" jsonb,
  "modeloId" text,
  "conteudoGerado" jsonb,
  "documentoUrl" text,
  "documentoObjectKey" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_contrato_anexo" (
  "id" text NOT NULL,
  "contratoId" text NOT NULL,
  "tipo" "RhContratoAnexoTipo" NOT NULL,
  "nomeArquivo" text NOT NULL,
  "url" text NOT NULL,
  "objectKey" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE sorelly."rh_contrato_modelo" (
  "id" text NOT NULL,
  "tipo" "RhContratoTipo" NOT NULL,
  "nome" text NOT NULL,
  "conteudo" text NOT NULL,
  "variaveis" jsonb NOT NULL,
  "updatedAt" timestamp(3) NOT NULL,
  "updatedByEmail" text
);
CREATE TABLE sorelly."rh_empresa" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "cnpj" text,
  "cidade" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_escala" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "diasSemana" integer[] DEFAULT ARRAY[]::integer[],
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_feriado" (
  "id" text NOT NULL,
  "empresaId" text,
  "data" date NOT NULL,
  "nome" text NOT NULL,
  "abrangencia" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_hora_extra" (
  "id" text NOT NULL,
  "colaboradorId" text NOT NULL,
  "data" date NOT NULL,
  "horas" numeric(5,2) NOT NULL,
  "tipoId" text NOT NULL,
  "observacao" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_hora_extra_tipo" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "adicionalPct" numeric(5,2) NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_plano_experiencia" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "marco1" integer NOT NULL,
  "marco2" integer NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_presenca" (
  "id" text NOT NULL,
  "colaboradorId" text NOT NULL,
  "data" date NOT NULL,
  "codigo" "RhPresencaCodigo",
  "atrasoHorario" text,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_representante" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "codigo" text,
  "ativo" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE sorelly."rh_setor" (
  "id" text NOT NULL,
  "nome" text NOT NULL,
  "createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamp(3) NOT NULL
);

-- pk
ALTER TABLE sorelly."acertos_daily_entry" ADD CONSTRAINT "acertos_daily_entry_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_funcionaria_bonus" ADD CONSTRAINT "acertos_funcionaria_bonus_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_member" ADD CONSTRAINT "acertos_member_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_meta_faixa" ADD CONSTRAINT "acertos_meta_faixa_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_month_close_log" ADD CONSTRAINT "acertos_month_close_log_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_month" ADD CONSTRAINT "acertos_month_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."acertos_representante_daily_balance" ADD CONSTRAINT "acertos_representante_daily_balance_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_representante_month" ADD CONSTRAINT "acertos_representante_month_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."acertos_representante" ADD CONSTRAINT "acertos_representante_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."anexo" ADD CONSTRAINT "anexo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_config" ADD CONSTRAINT "atendimento_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_lancamento_linha" ADD CONSTRAINT "atendimento_lancamento_linha_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_lancamento_parte" ADD CONSTRAINT "atendimento_lancamento_parte_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_lancamento" ADD CONSTRAINT "atendimento_lancamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_modalidade_hist" ADD CONSTRAINT "atendimento_modalidade_hist_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento" ADD CONSTRAINT "atendimento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_regra_versao" ADD CONSTRAINT "atendimento_regra_versao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_revendedora_hist" ADD CONSTRAINT "atendimento_revendedora_hist_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_revendedora" ADD CONSTRAINT "atendimento_revendedora_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."atendimento_termo" ADD CONSTRAINT "atendimento_termo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."avaliacao_pergunta" ADD CONSTRAINT "avaliacao_pergunta_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."avaliacao" ADD CONSTRAINT "avaliacao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."avaliacao_resposta" ADD CONSTRAINT "avaliacao_resposta_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."cadastro_daily_reseller" ADD CONSTRAINT "cadastro_daily_reseller_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."cadastro_goal" ADD CONSTRAINT "cadastro_goal_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."cadastro_settings" ADD CONSTRAINT "cadastro_settings_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."calculadora_comissao_tier" ADD CONSTRAINT "calculadora_comissao_tier_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."calculadora_kit_settings" ADD CONSTRAINT "calculadora_kit_settings_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."calculadora_kit_tier" ADD CONSTRAINT "calculadora_kit_tier_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_catalog_item" ADD CONSTRAINT "compras_catalog_item_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_category" ADD CONSTRAINT "compras_category_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_deny_reason" ADD CONSTRAINT "compras_deny_reason_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_member" ADD CONSTRAINT "compras_member_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_payment_account" ADD CONSTRAINT "compras_payment_account_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_request_event" ADD CONSTRAINT "compras_request_event_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_request_message" ADD CONSTRAINT "compras_request_message_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_request" ADD CONSTRAINT "compras_request_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_rules" ADD CONSTRAINT "compras_rules_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_sector" ADD CONSTRAINT "compras_sector_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."compras_settings" ADD CONSTRAINT "compras_settings_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_acerto" ADD CONSTRAINT "consignado_acerto_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_ajuste_pendente" ADD CONSTRAINT "consignado_ajuste_pendente_pkey" PRIMARY KEY ("representanteNome");
ALTER TABLE sorelly."consignado_caso_cobranca" ADD CONSTRAINT "consignado_caso_cobranca_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_config" ADD CONSTRAINT "consignado_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_fechamento_comissao" ADD CONSTRAINT "consignado_fechamento_comissao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_interna" ADD CONSTRAINT "consignado_interna_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_km_periodo" ADD CONSTRAINT "consignado_km_periodo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_pagamento_cobranca" ADD CONSTRAINT "consignado_pagamento_cobranca_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_pagamento" ADD CONSTRAINT "consignado_pagamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."consignado_representante" ADD CONSTRAINT "consignado_representante_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."credito_peca_compra" ADD CONSTRAINT "credito_peca_compra_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."credito_peca_config" ADD CONSTRAINT "credito_peca_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."credito_peca_funcionario" ADD CONSTRAINT "credito_peca_funcionario_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."credito_peca_negociacao_compra" ADD CONSTRAINT "credito_peca_negociacao_compra_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."credito_peca_negociacao" ADD CONSTRAINT "credito_peca_negociacao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."credito_peca_pagamento" ADD CONSTRAINT "credito_peca_pagamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."departamento_membro" ADD CONSTRAINT "departamento_membro_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."departamento" ADD CONSTRAINT "departamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_faturamento" ADD CONSTRAINT "estoque_faturamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_interno_categoria" ADD CONSTRAINT "estoque_interno_categoria_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_interno_compra" ADD CONSTRAINT "estoque_interno_compra_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_interno_contagem" ADD CONSTRAINT "estoque_interno_contagem_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_interno_item_log" ADD CONSTRAINT "estoque_interno_item_log_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_interno_item" ADD CONSTRAINT "estoque_interno_item_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_interno_member" ADD CONSTRAINT "estoque_interno_member_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_posicao" ADD CONSTRAINT "estoque_posicao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."estoque_settings" ADD CONSTRAINT "estoque_settings_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."expositor_cliente" ADD CONSTRAINT "expositor_cliente_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."expositor_condicional_item" ADD CONSTRAINT "expositor_condicional_item_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."expositor_condicional" ADD CONSTRAINT "expositor_condicional_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."expositor_estoque_item" ADD CONSTRAINT "expositor_estoque_item_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."expositor_fila" ADD CONSTRAINT "expositor_fila_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_ajuste_sazonal" ADD CONSTRAINT "faturamento_ajuste_sazonal_pkey" PRIMARY KEY (mes);
ALTER TABLE sorelly."faturamento_config" ADD CONSTRAINT "faturamento_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_contas_diario_colunas" ADD CONSTRAINT "faturamento_contas_diario_colunas_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_contas_diario" ADD CONSTRAINT "faturamento_contas_diario_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_contas_mes" ADD CONSTRAINT "faturamento_contas_mes_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."faturamento_credito" ADD CONSTRAINT "faturamento_credito_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_current_input" ADD CONSTRAINT "faturamento_current_input_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_fechamento_draft" ADD CONSTRAINT "faturamento_fechamento_draft_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."faturamento_fechamento_log" ADD CONSTRAINT "faturamento_fechamento_log_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."faturamento_fixed_month" ADD CONSTRAINT "faturamento_fixed_month_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."faturamento_month_fill" ADD CONSTRAINT "faturamento_month_fill_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."faturamento_saldo_mes" ADD CONSTRAINT "faturamento_saldo_mes_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."finance_account" ADD CONSTRAINT "finance_account_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_balance" ADD CONSTRAINT "finance_balance_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_block" ADD CONSTRAINT "finance_block_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_chave_pix" ADD CONSTRAINT "finance_chave_pix_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_alerta_regra" ADD CONSTRAINT "finance_familiar_alerta_regra_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_categoria_config" ADD CONSTRAINT "finance_familiar_categoria_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_colunas_config" ADD CONSTRAINT "finance_familiar_colunas_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_conta_bancaria" ADD CONSTRAINT "finance_familiar_conta_bancaria_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_conta_parcela_pagamento" ADD CONSTRAINT "finance_familiar_conta_parcela_pagamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_conta_parcela" ADD CONSTRAINT "finance_familiar_conta_parcela_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_conta" ADD CONSTRAINT "finance_familiar_conta_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_historico" ADD CONSTRAINT "finance_familiar_historico_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_hora_extra" ADD CONSTRAINT "finance_familiar_hora_extra_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_leilao_conferencia" ADD CONSTRAINT "finance_familiar_leilao_conferencia_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_mes_liberado" ADD CONSTRAINT "finance_familiar_mes_liberado_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."finance_familiar_persona" ADD CONSTRAINT "finance_familiar_persona_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_pix_lancamento" ADD CONSTRAINT "finance_familiar_pix_lancamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_pix_meta" ADD CONSTRAINT "finance_familiar_pix_meta_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_prestador_divida" ADD CONSTRAINT "finance_familiar_prestador_divida_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_prestador" ADD CONSTRAINT "finance_familiar_prestador_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_prestador_repasse" ADD CONSTRAINT "finance_familiar_prestador_repasse_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_prolabore" ADD CONSTRAINT "finance_familiar_prolabore_pkey" PRIMARY KEY ("personaId");
ALTER TABLE sorelly."finance_familiar_prolabore_vigencia" ADD CONSTRAINT "finance_familiar_prolabore_vigencia_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."finance_familiar_relatorio_fechamento" ADD CONSTRAINT "finance_familiar_relatorio_fechamento_pkey" PRIMARY KEY ("yearMonth");
ALTER TABLE sorelly."finance_familiar_transferencia" ADD CONSTRAINT "finance_familiar_transferencia_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."fiscal_config" ADD CONSTRAINT "fiscal_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."fiscal_conta_mensal" ADD CONSTRAINT "fiscal_conta_mensal_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."fiscal_empresa" ADD CONSTRAINT "fiscal_empresa_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."fiscal_nota_entrada" ADD CONSTRAINT "fiscal_nota_entrada_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."fiscal_saida_periodo" ADD CONSTRAINT "fiscal_saida_periodo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."indicacao_historico_legado" ADD CONSTRAINT "indicacao_historico_legado_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."indicacao_resgate_operacao" ADD CONSTRAINT "indicacao_resgate_operacao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."kit_block" ADD CONSTRAINT "kit_block_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."kit_novo_config" ADD CONSTRAINT "kit_novo_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."kit_novo_historico" ADD CONSTRAINT "kit_novo_historico_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."kit_novo" ADD CONSTRAINT "kit_novo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."kit_novo_recusa" ADD CONSTRAINT "kit_novo_recusa_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."kit_novo_representante" ADD CONSTRAINT "kit_novo_representante_pkey" PRIMARY KEY (cod);
ALTER TABLE sorelly."kommo_lead_image" ADD CONSTRAINT "kommo_lead_image_pkey" PRIMARY KEY ("leadId", "fieldId");
ALTER TABLE sorelly."kommo_lead" ADD CONSTRAINT "kommo_lead_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."listagem_config" ADD CONSTRAINT "listagem_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."listagem_evento" ADD CONSTRAINT "listagem_evento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."listagem_item" ADD CONSTRAINT "listagem_item_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."listagem" ADD CONSTRAINT "listagem_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."listagem_retirada" ADD CONSTRAINT "listagem_retirada_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."marketing_divulgacao_anexo" ADD CONSTRAINT "marketing_divulgacao_anexo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."marketing_divulgacao_arte" ADD CONSTRAINT "marketing_divulgacao_arte_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."marketing_group" ADD CONSTRAINT "marketing_group_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."marketing_image" ADD CONSTRAINT "marketing_image_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."montagem_bonus_config" ADD CONSTRAINT "montagem_bonus_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."montagem_kit_registro" ADD CONSTRAINT "montagem_kit_registro_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."montagem_staff" ADD CONSTRAINT "montagem_staff_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."mural_aviso" ADD CONSTRAINT "mural_aviso_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."mural_novidade" ADD CONSTRAINT "mural_novidade_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."notificacao" ADD CONSTRAINT "notificacao_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."producao_bonus_override" ADD CONSTRAINT "producao_bonus_override_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."producao_bonus_tier" ADD CONSTRAINT "producao_bonus_tier_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."producao_code" ADD CONSTRAINT "producao_code_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."producao_entry" ADD CONSTRAINT "producao_entry_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."producao_staff" ADD CONSTRAINT "producao_staff_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."push_agendamento" ADD CONSTRAINT "push_agendamento_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."push_envio" ADD CONSTRAINT "push_envio_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."representante_resumo_ia" ADD CONSTRAINT "representante_resumo_ia_pkey" PRIMARY KEY ("representanteCod");
ALTER TABLE sorelly."rh_advertencia_motivo" ADD CONSTRAINT "rh_advertencia_motivo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_advertencia" ADD CONSTRAINT "rh_advertencia_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_advertencia_tipo" ADD CONSTRAINT "rh_advertencia_tipo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_anp_preco_combustivel_cache" ADD CONSTRAINT "rh_anp_preco_combustivel_cache_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_cargo" ADD CONSTRAINT "rh_cargo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_colaborador" ADD CONSTRAINT "rh_colaborador_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_config" ADD CONSTRAINT "rh_config_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_contrato_anexo" ADD CONSTRAINT "rh_contrato_anexo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_contrato_modelo" ADD CONSTRAINT "rh_contrato_modelo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_contrato" ADD CONSTRAINT "rh_contrato_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_empresa" ADD CONSTRAINT "rh_empresa_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_escala" ADD CONSTRAINT "rh_escala_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_feriado" ADD CONSTRAINT "rh_feriado_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_hora_extra" ADD CONSTRAINT "rh_hora_extra_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_hora_extra_tipo" ADD CONSTRAINT "rh_hora_extra_tipo_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_plano_experiencia" ADD CONSTRAINT "rh_plano_experiencia_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_presenca" ADD CONSTRAINT "rh_presenca_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_representante" ADD CONSTRAINT "rh_representante_pkey" PRIMARY KEY (id);
ALTER TABLE sorelly."rh_setor" ADD CONSTRAINT "rh_setor_pkey" PRIMARY KEY (id);

-- uniq


-- check


-- idx
CREATE UNIQUE INDEX IF NOT EXISTS marketing_group_slug_key ON sorelly.marketing_group USING btree (slug);
CREATE UNIQUE INDEX IF NOT EXISTS kit_block_key_key ON sorelly.kit_block USING btree (key);
CREATE UNIQUE INDEX IF NOT EXISTS "indicacao_historico_legado_linhaPlanilha_key" ON sorelly.indicacao_historico_legado USING btree ("linhaPlanilha");
CREATE INDEX IF NOT EXISTS avaliacao_pergunta_categoria_ordem_idx ON sorelly.avaliacao_pergunta USING btree (categoria, ordem);
CREATE UNIQUE INDEX IF NOT EXISTS "push_agendamento_scheduleName_key" ON sorelly.push_agendamento USING btree ("scheduleName");
CREATE INDEX IF NOT EXISTS "push_agendamento_status_proximaOcorrencia_idx" ON sorelly.push_agendamento USING btree (status, "proximaOcorrencia");
CREATE INDEX IF NOT EXISTS "push_envio_disparadoEm_idx" ON sorelly.push_envio USING btree ("disparadoEm" DESC);
CREATE INDEX IF NOT EXISTS "push_envio_agendamentoId_idx" ON sorelly.push_envio USING btree ("agendamentoId");
CREATE INDEX IF NOT EXISTS "finance_account_blockId_idx" ON sorelly.finance_account USING btree ("blockId");
CREATE INDEX IF NOT EXISTS finance_balance_date_idx ON sorelly.finance_balance USING btree (date);
CREATE UNIQUE INDEX IF NOT EXISTS "finance_balance_accountId_date_key" ON sorelly.finance_balance USING btree ("accountId", date);
CREATE UNIQUE INDEX IF NOT EXISTS cadastro_daily_reseller_date_key ON sorelly.cadastro_daily_reseller USING btree (date);
CREATE INDEX IF NOT EXISTS "avaliacao_revendedoraUserId_enviadaEm_idx" ON sorelly.avaliacao USING btree ("revendedoraUserId", "enviadaEm" DESC);
CREATE INDEX IF NOT EXISTS "avaliacao_representanteCod_enviadaEm_idx" ON sorelly.avaliacao USING btree ("representanteCod", "enviadaEm" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "avaliacao_revendedoraUserId_condicionalCodigo_key" ON sorelly.avaliacao USING btree ("revendedoraUserId", "condicionalCodigo");
CREATE INDEX IF NOT EXISTS "avaliacao_resposta_perguntaId_idx" ON sorelly.avaliacao_resposta USING btree ("perguntaId");
CREATE UNIQUE INDEX IF NOT EXISTS "avaliacao_resposta_avaliacaoId_perguntaId_key" ON sorelly.avaliacao_resposta USING btree ("avaliacaoId", "perguntaId");
CREATE INDEX IF NOT EXISTS "kommo_lead_reviewStatus_kommoUpdatedAt_idx" ON sorelly.kommo_lead USING btree ("reviewStatus", "kommoUpdatedAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "kommo_lead_image_fileUuid_versionUuid_key" ON sorelly.kommo_lead_image USING btree ("fileUuid", "versionUuid") WHERE (("fileUuid" IS NOT NULL) AND ("versionUuid" IS NOT NULL));
CREATE INDEX IF NOT EXISTS "kommo_lead_reviewedAt_idx" ON sorelly.kommo_lead USING btree ("reviewedAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS producao_code_code_key ON sorelly.producao_code USING btree (code);
CREATE INDEX IF NOT EXISTS producao_entry_date_idx ON sorelly.producao_entry USING btree (date);
CREATE UNIQUE INDEX IF NOT EXISTS estoque_posicao_ano_mes_key ON sorelly.estoque_posicao USING btree (ano, mes);
CREATE UNIQUE INDEX IF NOT EXISTS estoque_faturamento_ano_mes_key ON sorelly.estoque_faturamento USING btree (ano, mes);
CREATE UNIQUE INDEX IF NOT EXISTS "indicacao_resgate_operacao_resgateId_key" ON sorelly.indicacao_resgate_operacao USING btree ("resgateId");
CREATE INDEX IF NOT EXISTS "calculadora_kit_tier_tipo_minValor_idx" ON sorelly.calculadora_kit_tier USING btree (tipo, "minValor");
CREATE INDEX IF NOT EXISTS "calculadora_comissao_tier_minValor_idx" ON sorelly.calculadora_comissao_tier USING btree ("minValor");
CREATE INDEX IF NOT EXISTS "finance_familiar_conta_bancaria_personaId_idx" ON sorelly.finance_familiar_conta_bancaria USING btree ("personaId");
CREATE INDEX IF NOT EXISTS "finance_familiar_conta_parcela_yearMonth_idx" ON sorelly.finance_familiar_conta_parcela USING btree ("yearMonth");
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_conta_parcela_contaId_yearMonth_key" ON sorelly.finance_familiar_conta_parcela USING btree ("contaId", "yearMonth");
CREATE INDEX IF NOT EXISTS "finance_familiar_conta_personaId_idx" ON sorelly.finance_familiar_conta USING btree ("personaId");
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_prolabore_vigencia_personaId_vigenciaDesde_key" ON sorelly.finance_familiar_prolabore_vigencia USING btree ("personaId", "vigenciaDesde");
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_hora_extra_personaId_yearMonth_semana_key" ON sorelly.finance_familiar_hora_extra USING btree ("personaId", "yearMonth", semana);
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_pix_meta_personaId_yearMonth_key" ON sorelly.finance_familiar_pix_meta USING btree ("personaId", "yearMonth");
CREATE INDEX IF NOT EXISTS "finance_familiar_pix_lancamento_personaId_yearMonth_idx" ON sorelly.finance_familiar_pix_lancamento USING btree ("personaId", "yearMonth");
CREATE INDEX IF NOT EXISTS "finance_familiar_prestador_responsavelId_idx" ON sorelly.finance_familiar_prestador USING btree ("responsavelId");
CREATE INDEX IF NOT EXISTS "finance_familiar_prestador_divida_prestadorId_idx" ON sorelly.finance_familiar_prestador_divida USING btree ("prestadorId");
CREATE INDEX IF NOT EXISTS "finance_familiar_prestador_repasse_prestadorId_idx" ON sorelly.finance_familiar_prestador_repasse USING btree ("prestadorId");
CREATE INDEX IF NOT EXISTS "finance_familiar_prestador_repasse_origemPixPersonaId_idx" ON sorelly.finance_familiar_prestador_repasse USING btree ("origemPixPersonaId");
CREATE INDEX IF NOT EXISTS "finance_familiar_alerta_regra_personaId_idx" ON sorelly.finance_familiar_alerta_regra USING btree ("personaId");
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_persona_userEmail_key" ON sorelly.finance_familiar_persona USING btree ("userEmail");
CREATE INDEX IF NOT EXISTS "finance_familiar_conta_bancaria_prestadorId_idx" ON sorelly.finance_familiar_conta_bancaria USING btree ("prestadorId");
CREATE INDEX IF NOT EXISTS "finance_familiar_pix_lancamento_contaBancariaId_idx" ON sorelly.finance_familiar_pix_lancamento USING btree ("contaBancariaId");
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_prestador_repasse_origemPixLancamentoId_key" ON sorelly.finance_familiar_prestador_repasse USING btree ("origemPixLancamentoId");
CREATE UNIQUE INDEX IF NOT EXISTS "producao_bonus_override_staffName_ano_mes_key" ON sorelly.producao_bonus_override USING btree ("staffName", ano, mes);
CREATE INDEX IF NOT EXISTS compras_request_status_idx ON sorelly.compras_request USING btree (status);
CREATE INDEX IF NOT EXISTS "compras_request_requestedAt_idx" ON sorelly.compras_request USING btree ("requestedAt");
CREATE INDEX IF NOT EXISTS "compras_request_sectorId_idx" ON sorelly.compras_request USING btree ("sectorId");
CREATE INDEX IF NOT EXISTS "compras_request_message_requestId_createdAt_idx" ON sorelly.compras_request_message USING btree ("requestId", "createdAt");
CREATE INDEX IF NOT EXISTS "compras_request_event_requestId_at_idx" ON sorelly.compras_request_event USING btree ("requestId", at);
CREATE UNIQUE INDEX IF NOT EXISTS "compras_member_userId_key" ON sorelly.compras_member USING btree ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS consignado_representante_nome_key ON sorelly.consignado_representante USING btree (nome);
CREATE UNIQUE INDEX IF NOT EXISTS "consignado_acerto_origemId_key" ON sorelly.consignado_acerto USING btree ("origemId");
CREATE INDEX IF NOT EXISTS "consignado_acerto_dataAcerto_idx" ON sorelly.consignado_acerto USING btree ("dataAcerto");
CREATE INDEX IF NOT EXISTS "consignado_acerto_representanteNome_idx" ON sorelly.consignado_acerto USING btree ("representanteNome");
CREATE INDEX IF NOT EXISTS "consignado_acerto_conciliacaoStatus_idx" ON sorelly.consignado_acerto USING btree ("conciliacaoStatus");
CREATE INDEX IF NOT EXISTS "consignado_pagamento_acertoId_idx" ON sorelly.consignado_pagamento USING btree ("acertoId");
CREATE UNIQUE INDEX IF NOT EXISTS "consignado_caso_cobranca_acertoId_key" ON sorelly.consignado_caso_cobranca USING btree ("acertoId");
CREATE INDEX IF NOT EXISTS consignado_caso_cobranca_etapa_idx ON sorelly.consignado_caso_cobranca USING btree (etapa);
CREATE INDEX IF NOT EXISTS "consignado_pagamento_cobranca_casoId_idx" ON sorelly.consignado_pagamento_cobranca USING btree ("casoId");
CREATE INDEX IF NOT EXISTS "consignado_fechamento_comissao_representanteNome_idx" ON sorelly.consignado_fechamento_comissao USING btree ("representanteNome");
CREATE UNIQUE INDEX IF NOT EXISTS "consignado_km_periodo_representanteNome_periodo_key" ON sorelly.consignado_km_periodo USING btree ("representanteNome", periodo);
CREATE INDEX IF NOT EXISTS estoque_interno_categoria_tipo_idx ON sorelly.estoque_interno_categoria USING btree (tipo);
CREATE UNIQUE INDEX IF NOT EXISTS estoque_interno_categoria_tipo_nome_key ON sorelly.estoque_interno_categoria USING btree (tipo, nome);
CREATE INDEX IF NOT EXISTS "estoque_interno_item_categoriaId_idx" ON sorelly.estoque_interno_item USING btree ("categoriaId");
CREATE INDEX IF NOT EXISTS "estoque_interno_contagem_itemId_data_idx" ON sorelly.estoque_interno_contagem USING btree ("itemId", data);
CREATE INDEX IF NOT EXISTS "estoque_interno_compra_itemId_status_idx" ON sorelly.estoque_interno_compra USING btree ("itemId", status);
CREATE UNIQUE INDEX IF NOT EXISTS "estoque_interno_member_userId_role_key" ON sorelly.estoque_interno_member USING btree ("userId", role);
CREATE INDEX IF NOT EXISTS "estoque_interno_item_log_itemId_createdAt_idx" ON sorelly.estoque_interno_item_log USING btree ("itemId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS finance_familiar_categoria_config_chave_key ON sorelly.finance_familiar_categoria_config USING btree (chave);
CREATE INDEX IF NOT EXISTS "fiscal_nota_entrada_empresaId_data_idx" ON sorelly.fiscal_nota_entrada USING btree ("empresaId", data);
CREATE INDEX IF NOT EXISTS "fiscal_saida_periodo_yearMonth_idx" ON sorelly.fiscal_saida_periodo USING btree ("yearMonth");
CREATE UNIQUE INDEX IF NOT EXISTS "fiscal_saida_periodo_empresaId_yearMonth_periodo_key" ON sorelly.fiscal_saida_periodo USING btree ("empresaId", "yearMonth", periodo);
CREATE INDEX IF NOT EXISTS "fiscal_conta_mensal_yearMonth_idx" ON sorelly.fiscal_conta_mensal USING btree ("yearMonth");
CREATE UNIQUE INDEX IF NOT EXISTS "fiscal_conta_mensal_empresaId_yearMonth_key" ON sorelly.fiscal_conta_mensal USING btree ("empresaId", "yearMonth");
CREATE INDEX IF NOT EXISTS "finance_familiar_transferencia_contaOrigemId_idx" ON sorelly.finance_familiar_transferencia USING btree ("contaOrigemId");
CREATE INDEX IF NOT EXISTS "finance_familiar_transferencia_contaDestinoId_idx" ON sorelly.finance_familiar_transferencia USING btree ("contaDestinoId");
CREATE INDEX IF NOT EXISTS finance_familiar_transferencia_data_idx ON sorelly.finance_familiar_transferencia USING btree (data);
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_prestador_repasse_origemLeilaoSaleId_key" ON sorelly.finance_familiar_prestador_repasse USING btree ("origemLeilaoSaleId");
CREATE UNIQUE INDEX IF NOT EXISTS compras_deny_reason_name_key ON sorelly.compras_deny_reason USING btree (name);
CREATE INDEX IF NOT EXISTS "faturamento_credito_yearMonth_idx" ON sorelly.faturamento_credito USING btree ("yearMonth");
CREATE INDEX IF NOT EXISTS "faturamento_fechamento_log_yearMonth_createdAt_idx" ON sorelly.faturamento_fechamento_log USING btree ("yearMonth", "createdAt");
CREATE INDEX IF NOT EXISTS "expositor_fila_createdAt_idx" ON sorelly.expositor_fila USING btree ("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS expositor_estoque_item_codigo_key ON sorelly.expositor_estoque_item USING btree (codigo);
CREATE INDEX IF NOT EXISTS expositor_estoque_item_codigo_idx ON sorelly.expositor_estoque_item USING btree (codigo);
CREATE UNIQUE INDEX IF NOT EXISTS expositor_condicional_numero_key ON sorelly.expositor_condicional USING btree (numero);
CREATE INDEX IF NOT EXISTS expositor_condicional_status_idx ON sorelly.expositor_condicional USING btree (status);
CREATE INDEX IF NOT EXISTS "expositor_condicional_pedirDeVolta_idx" ON sorelly.expositor_condicional USING btree ("pedirDeVolta");
CREATE INDEX IF NOT EXISTS expositor_condicional_nome_idx ON sorelly.expositor_condicional USING btree (nome);
CREATE INDEX IF NOT EXISTS "expositor_condicional_item_condicionalId_idx" ON sorelly.expositor_condicional_item USING btree ("condicionalId");
CREATE INDEX IF NOT EXISTS "expositor_condicional_item_estoqueItemId_idx" ON sorelly.expositor_condicional_item USING btree ("estoqueItemId");
CREATE INDEX IF NOT EXISTS credito_peca_funcionario_nome_idx ON sorelly.credito_peca_funcionario USING btree (nome);
CREATE INDEX IF NOT EXISTS "credito_peca_compra_funcionarioId_idx" ON sorelly.credito_peca_compra USING btree ("funcionarioId");
CREATE INDEX IF NOT EXISTS credito_peca_compra_data_idx ON sorelly.credito_peca_compra USING btree (data);
CREATE INDEX IF NOT EXISTS "credito_peca_pagamento_funcionarioId_idx" ON sorelly.credito_peca_pagamento USING btree ("funcionarioId");
CREATE INDEX IF NOT EXISTS "credito_peca_negociacao_funcionarioId_idx" ON sorelly.credito_peca_negociacao USING btree ("funcionarioId");
CREATE INDEX IF NOT EXISTS "credito_peca_negociacao_compra_compraId_idx" ON sorelly.credito_peca_negociacao_compra USING btree ("compraId");
CREATE UNIQUE INDEX IF NOT EXISTS "credito_peca_negociacao_compra_negociacaoId_compraId_key" ON sorelly.credito_peca_negociacao_compra USING btree ("negociacaoId", "compraId");
CREATE INDEX IF NOT EXISTS "kommo_lead_desempenho_kommoCreatedAt_idx" ON sorelly.kommo_lead USING btree (desempenho, "kommoCreatedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "finance_familiar_leilao_conferencia_leilaoSaleId_key" ON sorelly.finance_familiar_leilao_conferencia USING btree ("leilaoSaleId");
CREATE UNIQUE INDEX IF NOT EXISTS faturamento_contas_diario_date_key ON sorelly.faturamento_contas_diario USING btree (date);
CREATE INDEX IF NOT EXISTS "finance_chave_pix_financeAccountId_idx" ON sorelly.finance_chave_pix USING btree ("financeAccountId");
CREATE INDEX IF NOT EXISTS faturamento_contas_diario_date_idx ON sorelly.faturamento_contas_diario USING btree (date);
CREATE UNIQUE INDEX IF NOT EXISTS "expositor_cliente_telefoneKey_key" ON sorelly.expositor_cliente USING btree ("telefoneKey");
CREATE INDEX IF NOT EXISTS expositor_cliente_nome_idx ON sorelly.expositor_cliente USING btree (nome);
CREATE UNIQUE INDEX IF NOT EXISTS "acertos_member_userId_key" ON sorelly.acertos_member USING btree ("userId");
CREATE INDEX IF NOT EXISTS acertos_meta_faixa_pct_idx ON sorelly.acertos_meta_faixa USING btree (pct);
CREATE UNIQUE INDEX IF NOT EXISTS acertos_representante_codigo_key ON sorelly.acertos_representante USING btree (codigo);
CREATE INDEX IF NOT EXISTS acertos_representante_ativo_idx ON sorelly.acertos_representante USING btree (ativo);
CREATE INDEX IF NOT EXISTS "acertos_month_fechadoEm_idx" ON sorelly.acertos_month USING btree ("fechadoEm");
CREATE UNIQUE INDEX IF NOT EXISTS "acertos_daily_entry_yearMonth_dia_key" ON sorelly.acertos_daily_entry USING btree ("yearMonth", dia);
CREATE INDEX IF NOT EXISTS "acertos_representante_month_representanteId_idx" ON sorelly.acertos_representante_month USING btree ("representanteId");
CREATE UNIQUE INDEX IF NOT EXISTS "acertos_representante_month_yearMonth_representanteId_key" ON sorelly.acertos_representante_month USING btree ("yearMonth", "representanteId");
CREATE UNIQUE INDEX IF NOT EXISTS "acertos_representante_daily_balance_representanteMonthId_dia_ke" ON sorelly.acertos_representante_daily_balance USING btree ("representanteMonthId", dia);
CREATE INDEX IF NOT EXISTS "acertos_month_close_log_yearMonth_createdAt_idx" ON sorelly.acertos_month_close_log USING btree ("yearMonth", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS departamento_nome_key ON sorelly.departamento USING btree (nome);
CREATE INDEX IF NOT EXISTS "departamento_membro_departamentoId_idx" ON sorelly.departamento_membro USING btree ("departamentoId");
CREATE INDEX IF NOT EXISTS "departamento_membro_userId_idx" ON sorelly.departamento_membro USING btree ("userId");
CREATE INDEX IF NOT EXISTS "montagem_kit_registro_resellerId_idx" ON sorelly.montagem_kit_registro USING btree ("resellerId");
CREATE INDEX IF NOT EXISTS "montagem_kit_registro_concluidoEm_idx" ON sorelly.montagem_kit_registro USING btree ("concluidoEm");
CREATE INDEX IF NOT EXISTS "montagem_kit_registro_staffNome_idx" ON sorelly.montagem_kit_registro USING btree ("staffNome");
CREATE INDEX IF NOT EXISTS "rh_feriado_empresaId_data_idx" ON sorelly.rh_feriado USING btree ("empresaId", data);
CREATE INDEX IF NOT EXISTS "rh_colaborador_empresaId_status_idx" ON sorelly.rh_colaborador USING btree ("empresaId", status);
CREATE INDEX IF NOT EXISTS "rh_presenca_colaboradorId_idx" ON sorelly.rh_presenca USING btree ("colaboradorId");
CREATE UNIQUE INDEX IF NOT EXISTS "rh_presenca_colaboradorId_data_key" ON sorelly.rh_presenca USING btree ("colaboradorId", data);
CREATE INDEX IF NOT EXISTS "rh_advertencia_colaboradorId_data_idx" ON sorelly.rh_advertencia USING btree ("colaboradorId", data);
CREATE INDEX IF NOT EXISTS "rh_hora_extra_colaboradorId_data_idx" ON sorelly.rh_hora_extra USING btree ("colaboradorId", data);
CREATE INDEX IF NOT EXISTS "expositor_condicional_condicaoDevolucao_idx" ON sorelly.expositor_condicional USING btree ("condicaoDevolucao");
CREATE INDEX IF NOT EXISTS "finance_familiar_conta_parcela_pagamento_parcelaId_idx" ON sorelly.finance_familiar_conta_parcela_pagamento USING btree ("parcelaId");
CREATE UNIQUE INDEX IF NOT EXISTS rh_setor_nome_key ON sorelly.rh_setor USING btree (nome);
CREATE UNIQUE INDEX IF NOT EXISTS "expositor_condicional_codigoDevmaster_key" ON sorelly.expositor_condicional USING btree ("codigoDevmaster");
CREATE INDEX IF NOT EXISTS "indicacao_historico_legado_contaMoedas_idx" ON sorelly.indicacao_historico_legado USING btree ("contaMoedas");
CREATE INDEX IF NOT EXISTS rh_contrato_tipo_status_idx ON sorelly.rh_contrato USING btree (tipo, status);
CREATE INDEX IF NOT EXISTS "rh_contrato_anexo_contratoId_idx" ON sorelly.rh_contrato_anexo USING btree ("contratoId");
CREATE UNIQUE INDEX IF NOT EXISTS "anexo_objectKey_key" ON sorelly.anexo USING btree ("objectKey");
CREATE INDEX IF NOT EXISTS "anexo_escopo_donoId_idx" ON sorelly.anexo USING btree (escopo, "donoId");
CREATE UNIQUE INDEX IF NOT EXISTS rh_anp_preco_combustivel_cache_municipio_uf_produto_key ON sorelly.rh_anp_preco_combustivel_cache USING btree (municipio, uf, produto);
CREATE INDEX IF NOT EXISTS "finance_familiar_historico_createdAt_idx" ON sorelly.finance_familiar_historico USING btree ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "finance_familiar_historico_personaId_createdAt_idx" ON sorelly.finance_familiar_historico USING btree ("personaId", "createdAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS faturamento_contas_diario_colunas_chave_key ON sorelly.faturamento_contas_diario_colunas USING btree (chave);
CREATE INDEX IF NOT EXISTS rh_representante_ativo_idx ON sorelly.rh_representante USING btree (ativo);
CREATE INDEX IF NOT EXISTS "notificacao_userId_resolvidaEm_createdAt_idx" ON sorelly.notificacao USING btree ("userId", "resolvidaEm", "createdAt");
CREATE INDEX IF NOT EXISTS notificacao_referencia_idx ON sorelly.notificacao USING btree (referencia);
CREATE UNIQUE INDEX IF NOT EXISTS "atendimento_revendedora_atendimentoId_key" ON sorelly.atendimento_revendedora USING btree ("atendimentoId");
CREATE INDEX IF NOT EXISTS atendimento_revendedora_nome_idx ON sorelly.atendimento_revendedora USING btree (nome);
CREATE INDEX IF NOT EXISTS atendimento_revendedora_situacao_idx ON sorelly.atendimento_revendedora USING btree (situacao);
CREATE INDEX IF NOT EXISTS "atendimento_revendedora_hist_revendedoraId_data_idx" ON sorelly.atendimento_revendedora_hist USING btree ("revendedoraId", data);
CREATE INDEX IF NOT EXISTS "atendimento_modalidade_hist_revendedoraId_em_idx" ON sorelly.atendimento_modalidade_hist USING btree ("revendedoraId", em);
CREATE UNIQUE INDEX IF NOT EXISTS "atendimento_termo_revendedoraId_key" ON sorelly.atendimento_termo USING btree ("revendedoraId");
CREATE INDEX IF NOT EXISTS atendimento_data_idx ON sorelly.atendimento USING btree (data);
CREATE INDEX IF NOT EXISTS atendimento_status_data_idx ON sorelly.atendimento USING btree (status, data);
CREATE INDEX IF NOT EXISTS "atendimento_revendedoraId_idx" ON sorelly.atendimento USING btree ("revendedoraId");
CREATE UNIQUE INDEX IF NOT EXISTS "atendimento_lancamento_atendimentoId_key" ON sorelly.atendimento_lancamento USING btree ("atendimentoId");
CREATE INDEX IF NOT EXISTS atendimento_lancamento_conferido_idx ON sorelly.atendimento_lancamento USING btree (conferido);
CREATE INDEX IF NOT EXISTS "atendimento_lancamento_linha_lancamentoId_idx" ON sorelly.atendimento_lancamento_linha USING btree ("lancamentoId");
CREATE INDEX IF NOT EXISTS "atendimento_lancamento_parte_linhaId_idx" ON sorelly.atendimento_lancamento_parte USING btree ("linhaId");
CREATE UNIQUE INDEX IF NOT EXISTS kit_novo_codigo_key ON sorelly.kit_novo USING btree (codigo);
CREATE UNIQUE INDEX IF NOT EXISTS "kit_novo_kommoLeadId_key" ON sorelly.kit_novo USING btree ("kommoLeadId");
CREATE INDEX IF NOT EXISTS kit_novo_etapa_idx ON sorelly.kit_novo USING btree (etapa);
CREATE INDEX IF NOT EXISTS "kit_novo_cadastradaEm_idx" ON sorelly.kit_novo USING btree ("cadastradaEm");
CREATE INDEX IF NOT EXISTS "kit_novo_representanteCod_idx" ON sorelly.kit_novo USING btree ("representanteCod");
CREATE INDEX IF NOT EXISTS "kit_novo_historico_kitNovoId_createdAt_idx" ON sorelly.kit_novo_historico USING btree ("kitNovoId", "createdAt");
CREATE INDEX IF NOT EXISTS "kit_novo_recusa_representanteCod_createdAt_idx" ON sorelly.kit_novo_recusa USING btree ("representanteCod", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS listagem_codigo_key ON sorelly.listagem USING btree (codigo);
CREATE INDEX IF NOT EXISTS listagem_data_status_idx ON sorelly.listagem USING btree (data, status);
CREATE INDEX IF NOT EXISTS "listagem_representanteCod_status_idx" ON sorelly.listagem USING btree ("representanteCod", status);
CREATE INDEX IF NOT EXISTS "listagem_item_listagemId_status_idx" ON sorelly.listagem_item USING btree ("listagemId", status);
CREATE INDEX IF NOT EXISTS "listagem_item_revendedoraId_idx" ON sorelly.listagem_item USING btree ("revendedoraId");
CREATE INDEX IF NOT EXISTS "listagem_retirada_listagemId_idx" ON sorelly.listagem_retirada USING btree ("listagemId");
CREATE INDEX IF NOT EXISTS "listagem_evento_listagemId_idx" ON sorelly.listagem_evento USING btree ("listagemId");

-- extra
CREATE TABLE sorelly.rotina_item (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  setor text NOT NULL,
  nome text NOT NULL,
  descricao text,
  frequencia text NOT NULL DEFAULT 'DIARIA' CHECK (frequencia IN ('DIARIA','SEMANAL','MENSAL')),
  rota text,
  responsavel_user_id text REFERENCES public."user"(id) ON DELETE SET NULL,
  horario_limite time,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sorelly.rotina_registro (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  item_id text NOT NULL REFERENCES sorelly.rotina_item(id) ON DELETE CASCADE,
  data date NOT NULL,
  feito boolean NOT NULL DEFAULT false,
  user_id text REFERENCES public."user"(id) ON DELETE SET NULL,
  feito_em timestamptz,
  observacao text,
  UNIQUE (item_id, data)
);
CREATE INDEX rotina_registro_data_idx ON sorelly.rotina_registro (data);

-- fk
ALTER TABLE sorelly."acertos_daily_entry" ADD CONSTRAINT "acertos_daily_entry_yearMonth_fkey" FOREIGN KEY ("yearMonth") REFERENCES acertos_month("yearMonth") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."acertos_month_close_log" ADD CONSTRAINT "acertos_month_close_log_yearMonth_fkey" FOREIGN KEY ("yearMonth") REFERENCES acertos_month("yearMonth") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."acertos_representante_daily_balance" ADD CONSTRAINT "acertos_representante_daily_balance_representanteMonthId_fkey" FOREIGN KEY ("representanteMonthId") REFERENCES acertos_representante_month(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."acertos_representante_month" ADD CONSTRAINT "acertos_representante_month_representanteId_fkey" FOREIGN KEY ("representanteId") REFERENCES acertos_representante(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."acertos_representante_month" ADD CONSTRAINT "acertos_representante_month_yearMonth_fkey" FOREIGN KEY ("yearMonth") REFERENCES acertos_month("yearMonth") ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."atendimento_lancamento" ADD CONSTRAINT "atendimento_lancamento_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES atendimento(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."atendimento_lancamento_linha" ADD CONSTRAINT "atendimento_lancamento_linha_lancamentoId_fkey" FOREIGN KEY ("lancamentoId") REFERENCES atendimento_lancamento(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."atendimento_lancamento_parte" ADD CONSTRAINT "atendimento_lancamento_parte_linhaId_fkey" FOREIGN KEY ("linhaId") REFERENCES atendimento_lancamento_linha(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."atendimento_modalidade_hist" ADD CONSTRAINT "atendimento_modalidade_hist_revendedoraId_fkey" FOREIGN KEY ("revendedoraId") REFERENCES atendimento_revendedora(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."atendimento" ADD CONSTRAINT "atendimento_revendedoraId_fkey" FOREIGN KEY ("revendedoraId") REFERENCES atendimento_revendedora(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."atendimento_revendedora" ADD CONSTRAINT "atendimento_revendedora_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES atendimento(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."atendimento_revendedora_hist" ADD CONSTRAINT "atendimento_revendedora_hist_revendedoraId_fkey" FOREIGN KEY ("revendedoraId") REFERENCES atendimento_revendedora(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."atendimento_termo" ADD CONSTRAINT "atendimento_termo_revendedoraId_fkey" FOREIGN KEY ("revendedoraId") REFERENCES atendimento_revendedora(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."avaliacao_resposta" ADD CONSTRAINT "avaliacao_resposta_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES avaliacao(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."avaliacao_resposta" ADD CONSTRAINT "avaliacao_resposta_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES avaliacao_pergunta(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."compras_catalog_item" ADD CONSTRAINT "compras_catalog_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES compras_category(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."compras_request" ADD CONSTRAINT "compras_request_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES compras_catalog_item(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."compras_request" ADD CONSTRAINT "compras_request_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES compras_category(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."compras_request_event" ADD CONSTRAINT "compras_request_event_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES compras_request(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."compras_request_message" ADD CONSTRAINT "compras_request_message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES compras_request(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."compras_request" ADD CONSTRAINT "compras_request_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES compras_payment_account(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."compras_request" ADD CONSTRAINT "compras_request_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES compras_sector(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."consignado_acerto" ADD CONSTRAINT "consignado_acerto_fechamentoId_fkey" FOREIGN KEY ("fechamentoId") REFERENCES consignado_fechamento_comissao(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."consignado_caso_cobranca" ADD CONSTRAINT "consignado_caso_cobranca_acertoId_fkey" FOREIGN KEY ("acertoId") REFERENCES consignado_acerto(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."consignado_pagamento" ADD CONSTRAINT "consignado_pagamento_acertoId_fkey" FOREIGN KEY ("acertoId") REFERENCES consignado_acerto(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."consignado_pagamento_cobranca" ADD CONSTRAINT "consignado_pagamento_cobranca_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES consignado_caso_cobranca(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."credito_peca_compra" ADD CONSTRAINT "credito_peca_compra_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES credito_peca_funcionario(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."credito_peca_negociacao_compra" ADD CONSTRAINT "credito_peca_negociacao_compra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES credito_peca_compra(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."credito_peca_negociacao_compra" ADD CONSTRAINT "credito_peca_negociacao_compra_negociacaoId_fkey" FOREIGN KEY ("negociacaoId") REFERENCES credito_peca_negociacao(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."credito_peca_negociacao" ADD CONSTRAINT "credito_peca_negociacao_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES credito_peca_funcionario(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."credito_peca_pagamento" ADD CONSTRAINT "credito_peca_pagamento_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES credito_peca_funcionario(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."departamento_membro" ADD CONSTRAINT "departamento_membro_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES departamento(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."departamento_membro" ADD CONSTRAINT "departamento_membro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."estoque_interno_compra" ADD CONSTRAINT "estoque_interno_compra_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES estoque_interno_item(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."estoque_interno_contagem" ADD CONSTRAINT "estoque_interno_contagem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES estoque_interno_item(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."estoque_interno_item" ADD CONSTRAINT "estoque_interno_item_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES estoque_interno_categoria(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."estoque_interno_item_log" ADD CONSTRAINT "estoque_interno_item_log_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES estoque_interno_item(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."expositor_condicional_item" ADD CONSTRAINT "expositor_condicional_item_condicionalId_fkey" FOREIGN KEY ("condicionalId") REFERENCES expositor_condicional(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."expositor_condicional_item" ADD CONSTRAINT "expositor_condicional_item_estoqueItemId_fkey" FOREIGN KEY ("estoqueItemId") REFERENCES expositor_estoque_item(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."finance_account" ADD CONSTRAINT "finance_account_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES finance_block(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."finance_balance" ADD CONSTRAINT "finance_balance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES finance_account(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_chave_pix" ADD CONSTRAINT "finance_chave_pix_financeAccountId_fkey" FOREIGN KEY ("financeAccountId") REFERENCES finance_account(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_alerta_regra" ADD CONSTRAINT "finance_familiar_alerta_regra_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_conta_bancaria" ADD CONSTRAINT "finance_familiar_conta_bancaria_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_conta_bancaria" ADD CONSTRAINT "finance_familiar_conta_bancaria_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES finance_familiar_prestador(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_conta" ADD CONSTRAINT "finance_familiar_conta_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES finance_familiar_conta_bancaria(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_conta_parcela" ADD CONSTRAINT "finance_familiar_conta_parcela_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES finance_familiar_conta(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_conta_parcela_pagamento" ADD CONSTRAINT "finance_familiar_conta_parcela_pagamento_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES finance_familiar_conta_parcela(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_conta" ADD CONSTRAINT "finance_familiar_conta_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."finance_familiar_hora_extra" ADD CONSTRAINT "finance_familiar_hora_extra_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_leilao_conferencia" ADD CONSTRAINT "finance_familiar_leilao_conferencia_leilaoSaleId_fkey" FOREIGN KEY ("leilaoSaleId") REFERENCES leilao_sale(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_pix_lancamento" ADD CONSTRAINT "finance_familiar_pix_lancamento_contaBancariaId_fkey" FOREIGN KEY ("contaBancariaId") REFERENCES finance_familiar_conta_bancaria(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_pix_lancamento" ADD CONSTRAINT "finance_familiar_pix_lancamento_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_pix_meta" ADD CONSTRAINT "finance_familiar_pix_meta_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_prestador_divida" ADD CONSTRAINT "finance_familiar_prestador_divida_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES finance_familiar_prestador(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_prestador_repasse" ADD CONSTRAINT "finance_familiar_prestador_repasse_origemLeilaoSaleId_fkey" FOREIGN KEY ("origemLeilaoSaleId") REFERENCES leilao_sale(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_prestador_repasse" ADD CONSTRAINT "finance_familiar_prestador_repasse_origemPixLancamentoId_fkey" FOREIGN KEY ("origemPixLancamentoId") REFERENCES finance_familiar_pix_lancamento(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_prestador_repasse" ADD CONSTRAINT "finance_familiar_prestador_repasse_origemPixPersonaId_fkey" FOREIGN KEY ("origemPixPersonaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_prestador_repasse" ADD CONSTRAINT "finance_familiar_prestador_repasse_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES finance_familiar_prestador(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_prestador" ADD CONSTRAINT "finance_familiar_prestador_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."finance_familiar_prolabore" ADD CONSTRAINT "finance_familiar_prolabore_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_persona(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_prolabore_vigencia" ADD CONSTRAINT "finance_familiar_prolabore_vigencia_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES finance_familiar_prolabore("personaId") ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."finance_familiar_transferencia" ADD CONSTRAINT "finance_familiar_transferencia_contaDestinoId_fkey" FOREIGN KEY ("contaDestinoId") REFERENCES finance_familiar_conta_bancaria(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."finance_familiar_transferencia" ADD CONSTRAINT "finance_familiar_transferencia_contaOrigemId_fkey" FOREIGN KEY ("contaOrigemId") REFERENCES finance_familiar_conta_bancaria(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."fiscal_conta_mensal" ADD CONSTRAINT "fiscal_conta_mensal_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES fiscal_empresa(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."fiscal_nota_entrada" ADD CONSTRAINT "fiscal_nota_entrada_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES fiscal_empresa(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."fiscal_saida_periodo" ADD CONSTRAINT "fiscal_saida_periodo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES fiscal_empresa(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."kit_novo_historico" ADD CONSTRAINT "kit_novo_historico_kitNovoId_fkey" FOREIGN KEY ("kitNovoId") REFERENCES kit_novo(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."kit_novo_recusa" ADD CONSTRAINT "kit_novo_recusa_kitNovoId_fkey" FOREIGN KEY ("kitNovoId") REFERENCES kit_novo(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."kommo_lead_image" ADD CONSTRAINT "kommo_lead_image_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES kommo_lead(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."listagem_evento" ADD CONSTRAINT "listagem_evento_listagemId_fkey" FOREIGN KEY ("listagemId") REFERENCES listagem(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."listagem_item" ADD CONSTRAINT "listagem_item_listagemId_fkey" FOREIGN KEY ("listagemId") REFERENCES listagem(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."listagem_retirada" ADD CONSTRAINT "listagem_retirada_listagemId_fkey" FOREIGN KEY ("listagemId") REFERENCES listagem(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."marketing_divulgacao_anexo" ADD CONSTRAINT "marketing_divulgacao_anexo_arteId_fkey" FOREIGN KEY ("arteId") REFERENCES marketing_divulgacao_arte(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."marketing_group" ADD CONSTRAINT "marketing_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."marketing_image" ADD CONSTRAINT "marketing_image_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES marketing_group(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."mural_aviso" ADD CONSTRAINT "mural_aviso_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."notificacao" ADD CONSTRAINT "notificacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."push_agendamento" ADD CONSTRAINT "push_agendamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."push_envio" ADD CONSTRAINT "push_envio_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES push_agendamento(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."push_envio" ADD CONSTRAINT "push_envio_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "user"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_advertencia" ADD CONSTRAINT "rh_advertencia_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES rh_colaborador(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."rh_advertencia" ADD CONSTRAINT "rh_advertencia_motivoId_fkey" FOREIGN KEY ("motivoId") REFERENCES rh_advertencia_motivo(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_advertencia" ADD CONSTRAINT "rh_advertencia_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES rh_advertencia_tipo(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_colaborador" ADD CONSTRAINT "rh_colaborador_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES rh_cargo(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_colaborador" ADD CONSTRAINT "rh_colaborador_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES rh_empresa(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_colaborador" ADD CONSTRAINT "rh_colaborador_escalaId_fkey" FOREIGN KEY ("escalaId") REFERENCES rh_escala(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_colaborador" ADD CONSTRAINT "rh_colaborador_planoExperienciaId_fkey" FOREIGN KEY ("planoExperienciaId") REFERENCES rh_plano_experiencia(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."rh_colaborador" ADD CONSTRAINT "rh_colaborador_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES rh_setor(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_contrato" ADD CONSTRAINT "rh_contrato_acertosRepresentanteId_fkey" FOREIGN KEY ("acertosRepresentanteId") REFERENCES acertos_representante(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."rh_contrato_anexo" ADD CONSTRAINT "rh_contrato_anexo_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES rh_contrato(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."rh_contrato" ADD CONSTRAINT "rh_contrato_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES rh_colaborador(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."rh_contrato" ADD CONSTRAINT "rh_contrato_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES rh_contrato_modelo(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE sorelly."rh_feriado" ADD CONSTRAINT "rh_feriado_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES rh_empresa(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."rh_hora_extra" ADD CONSTRAINT "rh_hora_extra_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES rh_colaborador(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE sorelly."rh_hora_extra" ADD CONSTRAINT "rh_hora_extra_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES rh_hora_extra_tipo(id) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE sorelly."rh_presenca" ADD CONSTRAINT "rh_presenca_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES rh_colaborador(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- ajustes feitos junto com o servidor (21/10/2026): Rotina do dia guarda as pessoas do sistema novo e o login tem tabela própria
ALTER TABLE sorelly.rotina_item ADD COLUMN IF NOT EXISTS pessoas jsonb NOT NULL DEFAULT '[]';
ALTER TABLE sorelly.rotina_item ADD COLUMN IF NOT EXISTS dias integer[] NOT NULL DEFAULT '{1,2,3,4,5,6}';
ALTER TABLE sorelly.rotina_registro ADD COLUMN IF NOT EXISTS pessoa_id integer;
ALTER TABLE sorelly.rotina_registro ADD COLUMN IF NOT EXISTS por_nome text;
CREATE TABLE IF NOT EXISTS sorelly.usuario_login (
  user_id text PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  senha_hash text NOT NULL,
  pessoa_id integer,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- estado dos módulos guardado como JSON (atalho combinado com o Leonardo: depois cada módulo vai para as tabelas finais)
CREATE TABLE IF NOT EXISTS sorelly.estado_modulo (
  modulo text PRIMARY KEY,
  conteudo jsonb NOT NULL DEFAULT '{}',
  versao integer NOT NULL DEFAULT 0,
  atualizado_por text,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- setores de cada pessoa (define quais módulos ela abre no servidor; ver servidor/src/permissoes.js)
ALTER TABLE sorelly.usuario_login ADD COLUMN IF NOT EXISTS setores text[] NOT NULL DEFAULT '{}';

-- contas de acesso do sistema novo (23/10/2026): a pessoa cria a conta, fica "aguardando"; a Diretoria libera, liga a uma pessoa do sistema e escolhe os setores
CREATE TABLE IF NOT EXISTS sorelly.conta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  senha_hash text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'ativo', 'bloqueado')),
  perfil text NOT NULL DEFAULT 'MEMBER' CHECK (perfil IN ('ADMIN', 'MEMBER')),
  setores text[] NOT NULL DEFAULT '{}',
  pessoa_id integer,
  aprovado_por text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS conta_email_uq ON sorelly.conta (lower(email));
-- Perfil (27/10/2026): foto e situação de cada pessoa, mostradas na barra de cima e na página inicial. Rodar scripts/migrar-perfil.mjs.
ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS foto text;
ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS situacao text NOT NULL DEFAULT 'disponivel';
ALTER TABLE sorelly.conta ADD COLUMN IF NOT EXISTS perfil_em timestamptz NOT NULL DEFAULT now();
