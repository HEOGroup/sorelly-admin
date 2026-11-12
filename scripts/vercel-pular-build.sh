#!/bin/sh
# Vercel "Ignored Build Step" (vercel.json, ignoreCommand), 11/11/2026: commit que só mexe em documento, teste ou material não gera build (custo de build da Vercel).
# Saída 0 = PULA o build; saída 1 = faz o build. Se algo der erro (ex.: commit anterior fora do clone), faz o build.
# Os dois .md importados pelo código (PadraoVisual.js) continuam gerando build.
BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git diff --quiet "$BASE" HEAD -- . ':(exclude)docs' ':(exclude,glob)**/*.md' ':(exclude)tests' ':(exclude).claude' ':(exclude).github' ':(exclude)admin-antigo' ':(exclude)materiais-do-app' || exit 1
git diff --quiet "$BASE" HEAD -- docs/prompts/PROMPT-MESTRE.md docs/design/PADRAO-VISUAL.md || exit 1
echo "Só documentos mudaram: build pulado."
exit 0
