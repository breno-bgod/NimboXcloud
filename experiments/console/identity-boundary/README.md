# Limites de identidade do Nimbo atual

Objetivo: verificar o que o código real do Nimbo faz hoje, sem confundir perfil de mídia com reconhecimento como Xbox.

Base fixa: [main 3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd](https://github.com/breno-bgod/NimboXcloud/blob/3c122b0b728b5f2ef25ffd244a50ce7f9e7f60bd/NimboXcloud.user.js). Baixe esse arquivo público para um caminho local, sem dados de sessão, e execute:

`NX_IDENTITY_SOURCE=/caminho/NimboXcloud.user.js node --test --test-isolation=none experiments/console/identity-boundary/probe.test.cjs`

O teste lê o snapshot indicado e extrai funções reais para VM, com dependências substituídas por objetos locais. Request/Headers são reais do Node, mas fetch não é chamado. O endereço example.invalid e o título synthetic-title são fixtures sintéticas; nenhum endpoint ou login é utilizado.

Quatro testes aprovados nesta execução: perfil windows/tizen preservando descritor/SDK/toque; requisição abortada; perfis Xbox históricos migrando para off; descritor xHome browser/web. A saída resumida está em result.json.

A verificação do descritor é limitada aos campos presentes na fixture. Os testes não executam o navegador, o SDK, o PSBox ou o Xbox. Um resultado aprovado confirma limites do código, não classificação no servidor, autenticação, mídia ou gameplay.

O caminho de fonte é obrigatório para evitar usar acidentalmente uma cópia local de outra branch. Símbolos ausentes provocam falha e exigem revisar o snapshot. Fontes diferentes do commit indicado precisam ser registradas explicitamente ao repetir o teste.

Mapa, evidências, lacunas e próximos passos: [CONSOLE_IDENTITY_MAP.md](../../../docs/research/CONSOLE_IDENTITY_MAP.md).
