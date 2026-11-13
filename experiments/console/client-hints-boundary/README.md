# Fronteira Client Hints: perfil JavaScript não é identidade autenticada

Estado: simulação controlada aprovada. Nenhuma mudança no navegador do mantenedor ou no Nimbo oficial.

## Hipótese

O método UserAgent.spoof do Better xCloud muda a identificação visível ao JavaScript, mas depende dos descritores de propriedade existentes. A hipótese de esconder universalmente userAgentData é refutada se um próprio objeto existente permanecer visível. Alterar JavaScript não fornece evidência de headers HTTP, tokens ou reconhecimento Xbox.

## Fonte e execução

Referência primária: https://github.com/redphx/better-xcloud/blob/ea4d19f2800cee9cfa387a0c9c37b3711cf208c7/src/utils/user-agent.ts (MIT). SHA256 do texto normalizado (trimEnd + LF): e83cb1b50b266eaf1f8f5792e03ee24a8ed9588e27c6cb5f527b644068846880. O arquivo externo não é copiado ao repositório; fornecê-lo localmente. O teste extrai o corpo real de static spoof(), substituindo apenas a referência privada de configuração por uma dependência fornecida. Perfil/resolver e navigator são sintéticos; não se executa o restante do aplicativo. Fonte alterada é rejeitada.

```sh
BX_USER_AGENT_SOURCE=/caminho/user-agent.ts node --test --test-isolation=none experiments/console/client-hints-boundary/probe.test.cjs
node experiments/console/client-hints-boundary/probe.cjs /caminho/user-agent.ts
```

Cinco testes aprovados: propriedade herdada, própria, perfil default, UA não configurável e fonte alterada. result.json contém resultado da execução controlada, sem rede. Não é uma transcrição de sessão real.

## Achado e limites

- Com accessor herdado, defineProperty(..., {}) cria propriedade própria undefined e esconde o valor herdado; o UA JavaScript muda.
- Com userAgentData já próprio, descriptor vazio mantém o valor existente. Pode ocorrer após outras personalizações, mas não foi observado no Edge do mantenedor.
- Com UA não configurável, a operação lança TypeError após a alteração dos hints: mudança parcial, sem rollback no método examinado.
- Nenhuma chamada de rede é feita. Headers HTTP permanecem não observados; é incorreto afirmar que foram alterados ou preservados com base nesta VM.

Documentação: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData e https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-CH-UA-Platform. A propriedade JS e o header de requisição são superfícies distintas. O PSBox nativo não usa esse método JS: referência principal permanece src/xcloud/gssv.cpp e auth/xbox_live.cpp, auditadas no mapa de identidade. Nenhuma destas mudanças demonstra classificação Xbox ou autorização de jogo.

## Próxima tentativa

Em diagnóstico voluntário no navegador real, registrar apenas presença e tipo de descriptor (próprio/herdado/configurável), sem high-entropy values ou identificadores. Só então propor perfil com teste antes/depois; não inventar valor Xbox. Android/desktop Chromium e iOS/WebKit têm APIs/capacidades distintas; os objetos da VM não homologam nenhuma plataforma. Não exigir que esse experimento de identidade bloqueie um port Android autorizado: são frentes separadas.

Busca web de 13/11/2026 na janela 14/10–13/11 não trouxe confirmação nova de classificação Xbox. Pistas encontradas sem código inspecionado não foram promovidas a solução. CI/VM não comprovam sessão, mídia ou gameplay. Sem tokens, endpoints novos, alterações de autenticação ou imports no userscript.
