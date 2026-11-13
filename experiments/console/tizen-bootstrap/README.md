# Bootstrap Tizen: perfil declarado versus execução no navegador

## Hipótese

Uma interface HTML/JavaScript independente implica que a sessão será apresentada como console Xbox? O experimento verifica somente a requisição construída pelo cliente Tizen e as permissões declaradas no widget.

Fontes públicas de [deivid22srk/xcloud-tizen](https://github.com/deivid22srk/xcloud-tizen), commit 24f0861a3fe2114a7d80f378a7724606399af392 (04/11/2026), LICENSE MIT confirmado nesta execução:
- js/api/streaming.js, salvar como streaming.js.
- js/config.js, salvar como config.js.
- config.xml, salvar como config.xml.

Links fixos seguem https://github.com/deivid22srk/xcloud-tizen/blob/24f0861a3fe2114a7d80f378a7724606399af392/CAMINHO. sources.json contém SHA-256 e nomes locais; normalização UTF-8, LF e uma quebra final. Os arquivos externos não são copiados para o produto.

## O que é executado

As fontes reais config.js e streaming.js são avaliadas em VM com timeout. XC.Http.post é substituído por uma função que recebe o objeto e retorna uma resposta sintética. Nenhum endpoint é contatado. A região example.invalid, título, token e sessionPath são fictícios e não devem ser usados em login.

O relatório permite comparar settings.osName e X-MS-Device-Info, sem expor o token sintético ou identificadores da fixture. Não executa autenticação, CORS, SDP/ICE, decodificação, comandos ou a aplicação completa.

## Reprodução

Baixe os três arquivos dos commits indicados para um diretório local. Não forneça logs ou arquivos de conta.

`node --check experiments/console/tizen-bootstrap/probe.mjs`

`TIZEN_SOURCES=DIRETORIO node --test --test-isolation=none experiments/console/tizen-bootstrap/probe.test.mjs`

`node experiments/console/tizen-bootstrap/probe.mjs DIRETORIO`

Cinco testes aprovados: configuração web, diferença entre perfil Android e descritor Windows, rejeição simulada HTTP 403, HTTP 200 sem sessionPath e separação entre permissões declaradas e validação CORS/identidade. Resultado em result.json. Não houve tentativa de autenticação.

## Resultado e limite

O construtor real declara clientAppType browser, sdkType web, offering xgpuweb e descritor Windows. A opção osName android altera somente o pedido de perfil; o descritor permanece Windows. Isso é diferença entre campos enviados, não diagnóstico de rejeição pelo serviço.

config.xml declara access origin=* e privilégio internet. A [documentação Samsung](https://developer.samsung.com/smarttv/develop/faq/networking-and-connectivity.html) confirma que aplicações TV declaram acesso a servidores externos no manifesto. Essa declaração não transforma um HTML aberto no Edge em widget Tizen nem comprova que o servidor permitirá CORS ao navegador.

Estado: simulação controlada aprovada para montagem de requisição. Identidade/classificação do servidor, CORS em Android/iOS/desktop, áudio/vídeo/comandos e GTA VI permanecem não verificados.

## O que aproveitar no Nimbo

Separação entre interface, autenticação, API de sessão e transporte é útil para organizar o laboratório. Não copiar um descritor e tratá-lo como identidade Xbox. O próximo teste real deve usar o observador existente com jogo autorizado, registrando apenas dados permitidos, para comparar o descritor efetivo e o resultado de sessão. Uma comparação com cliente Xbox legítimo continua faltando.

Não portar o widget inteiro nem alterar o runtime oficial. Nenhum proxy, nova dependência, mudança de offering ou payload foi aplicado ao Nimbo. Green-NX #92 continua sem respostas na consulta desta execução.
