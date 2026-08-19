# Follow-ups do piloto `vehicle` — migração dos 19 DAOs restantes

> Extraído do ledger de execução (`.superpowers/sdd/progress.md`, scratch ignorado
> pelo git) para não se perder. Origem: revisão final da branch
> `feat/data-layer-base-dao`, fundida em `main` @ 8711b32.

FOLLOW-UPS p/ o plano das 19 restantes:
  1. defaultOrderField como 5o argumento do construtor (admins usa createdAt camelCase; orderBy exclui docs sem o campo).
  2. Indices compostos: o emulador NAO os valida. Enumerar query shapes por DAO e fazer deploy ANTES do codigo.
  3. Classificar cada DAO: full / partial / excluded. promotion e withdrawal tem invariantes de atomicidade (CLAUDE.md) e o motor nao tem seam para transacoes. auth/file/pushNotification nao sao CRUD Firestore. appConfig e documento singleton.
  4. Testar os contratos do motor contra um 2o converter nao-trivial.
  5. Cursor apagado lanca AppError (decisao deliberada do dono na Task 6) -- consumidores de paginacao tem de apanhar e reiniciar.
