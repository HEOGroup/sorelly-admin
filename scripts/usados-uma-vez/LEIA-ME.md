# Scripts usados uma vez

Scripts que fizeram uma tarefa única (criar a conta de uma pessoa, liberar um acesso, migrar dados, corrigir um registro). Separados em 02/11/2026 para a pasta `scripts` ficar só com o que se usa sempre.
Servem de modelo: para criar a conta de outra pessoa, copie um `criar-conta-*.mjs`. Os caminhos de `import` já foram ajustados para esta pasta.
Rodar: `node --env-file-if-exists=.env.local scripts/usados-uma-vez/<arquivo>` a partir da raiz do projeto.
