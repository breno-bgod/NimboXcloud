# NimboXcloud — backend experimental MSA (referência PSBox)

Este protótipo **não é um login Xbox funcional**. Implementa somente o fluxo de código de dispositivo do PSBox (`login.live.com/oauth20_connect.srf` e `oauth20_token.srf`) e verifica se a Microsoft emite um token para um **Client ID autorizado de propriedade do projeto**.

## Executar localmente

Requer Node.js 22+.

```sh
NIMBO_MSA_CLIENT_ID=SEU_CLIENT_ID node experiments/auth-backend/server.mjs
```

Teste `http://127.0.0.1:8787/health`. Para iniciar o fluxo faça `POST /auth/start` usando um cliente HTTP que mantenha cookies; abra `verificationUri` e insira `userCode` na Microsoft; consulte `POST /auth/status` respeitando o intervalo informado.

**Atenção:** o registro SPA existente não necessariamente autoriza o escopo legado MSA `service::user.auth.xboxlive.com::MBI_SSL`. Uma recusa é um resultado válido e não deve ser contornada usando identificadores de outros aplicativos.

## Segurança e limites

- Escuta apenas em 127.0.0.1 por padrão; não publique como está.
- Não grava nem retorna tokens; o token MSA é descartado após a prova de emissão.
- Estado efêmero em memória e cookie HttpOnly SameSite=Strict; sem persistência.
- Sem proxy de tokens, sem coleta de senhas, sem acesso GSSV.
- Para disponibilizar remotamente: TLS, proteção CSRF, rate limiting por IP, controle de sessões e auditoria de segurança são obrigatórios.

## Próximas etapas condicionais

1. Validar a emissão MSA para um aplicativo autorizado.
2. Adicionar troca Xbox User Token (prefixos t=/d=) e XSTS para GSSV, mantendo tokens no backend.
3. Verificar login GSSV e consulta de catálogo, sem prometer autorização para streaming.
4. Só então conectar ao frontend PSBox Web.

Referências PSBox: `src/auth/msa.cpp`, `src/auth/auth_manager.cpp`, `src/auth/xbox_live.cpp` e `src/xcloud/gssv.cpp` no repositório RafaelNGP/psbox-cloud-gaming.
