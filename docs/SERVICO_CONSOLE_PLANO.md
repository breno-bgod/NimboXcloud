# Serviço de sessão/console — proposta de retomada

## Objetivo do mantenedor

Retomar a frente iniciada com a referência PSBox: tornar utilizáveis no navegador as capacidades de streaming autorizadas pelo Xbox e preparar testes futuros de GTA VI quando o título estiver efetivamente disponível à conta. Base JavaScript/navegador, sem reescrita C++/APK.

Esta proposta não declara integração concluída. A discussão de layout/áudio não deve substituir essa frente; corrigir antes apenas regressões que impeçam seus testes.

## O que foi verificado na main

Base: d5605713c6d65502e344c55e0fd547e57e24da74, versão 4.15.0.

- xCloud retail: o mantenedor testou Fortnite com mídia e entradas; isso não homologa outros títulos.
- NimboXboxTransport/NimboInputCoordinator já organizam o acesso ao SDK e os cinco modos. Reutilizar essa base.
- A preferência Fortnite Console é lida e apresentada, mas ainda não modifica sendTouchInputEnabledMessage. Não confundir selecionar controle com implementar esse patch.
- xHome: nxRemoteStartSession e os helpers de SDP/ICE, canais, mídia e entradas existem. Não há homologação com console autorizado, áudio e comandos em gameplay. O PR #21 corrige um ciclo de vida; não é prova de partida.
- O PR #23 trata HUD/apresentação e não implementa o serviço de console.

## Referências e conclusão técnica

1. PSBox src/xcloud/gssv.h: GssvClient usa xgpuweb para nuvem e xhome para console próprio.
2. PSBox src/xcloud/gssv.cpp: início cloud usa titleId; início home usa serverId de console. Os fluxos são separados; a implementação nativa não transforma uma conta sem console em um console remoto.
3. Better xCloud src/modules/patcher/patcher.ts, forceFortniteConsole: força e=false em sendTouchInputEnabledMessage(e) somente na rota /launch/fortnite/.
4. Better xCloud global-settings-storage/translation: a finalidade declarada é disponibilizar Salve o Mundo no mobile. Isso modifica a experiência de um título já oferecido e não comprova autorização de outro jogo.

Links:
- https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.h
- https://github.com/RafaelNGP/psbox-cloud-gaming/blob/main/src/xcloud/gssv.cpp
- https://github.com/redphx/better-xcloud/blob/typescript/src/modules/patcher/patcher.ts
- https://github.com/redphx/better-xcloud/blob/typescript/src/utils/settings-storages/global-settings-storage.ts

## Caminho escolhido para os testes disponíveis

Priorizar xCloud, pois os testes xHome ainda não dispõem de console homologado. Continuar no navegador, reaproveitando o cliente autenticado e os transportes existentes. Remote Play é uma segunda rota para console próprio e não substitui a autorização do catálogo cloud.

Não criar um seletor genérico Xbox 360/One/Series que prometa disponibilizar títulos. A pesquisa deve distinguir filtro de capacidade do cliente, autorização do serviço e falha de protocolo.

## Primeiro lote: Fortnite Console realmente aplicado

1. Localizar no cliente atual o ponto equivalente a sendTouchInputEnabledMessage, verificando se é acessível no SDK capturado. Não presumir que é um método público do objeto de sessão.
2. Reproduzir a sinalização original e construir um teste que falhe antes da alteração. Se o acesso exigir um patch de bundle, propor uma mudança restrita e verificável no alvo real, não um interceptor genérico de scripts.
3. Implementar experimento opt-in exclusivo do Fortnite, com identificação positiva da sessão, restauração do comportamento original e aplicação única por sessão. Respeitar a entrada manual; documentar incompatibilidade com toque nativo em vez de quebrá-lo silenciosamente.
4. Mostrar estado verificável: indisponível, não aplicado ou sinalização aplicada. Não mostrar sucesso apenas porque a preferência foi salva.
5. Validar na conta do mantenedor, num modo a que tenha direito, se a interface/capacidade esperada mudou e se áudio e comandos continuam funcionando. A mensagem alterada isoladamente não encerra o aceite.

Sem ponto verificável no cliente atual, registrar o bloqueio e propor experimento isolado; não inventar método/flag.

## Lotes seguintes, condicionados à evidência anterior

- Mapear a sequência PSBox → SDK retail: título/identificador, capacidade anunciada, aceitação da sessão, SDP/ICE, vídeo, áudio e comandos. Reutilizar o cliente autorizado; sem novas rotas de autenticação por suposição.
- Entregar uma camada fina de sessão sobre o que já existe, sem duplicar NimboXboxTransport ou reescrever xHome. Estados claros de catálogo, início, conexão, mídia recebida, falha e encerramento.
- Testar outro título já disponível à conta. Se o serviço rejeitar autorização/disponibilidade, apresentar a causa observada; identidade de navegador não é tratada como desbloqueio.
- Retomar xHome quando houver console/conta autorizados disponíveis para homologar. Validar separadamente descoberta, autorização, vídeo, áudio, comandos e recuperação.
- Testar GTA VI somente quando houver evidência de disponibilidade na rota utilizada. Sucesso no Fortnite ou em outro título não comprova suporte a GTA VI.

## Critério de conclusão de uma sessão utilizável

Título e rota autorizados; imagem em movimento recebida, áudio audível, comandos efetivamente aceitos no jogo e encerramento/reinício sem estados presos. Testes de VM/CI ou peer conectado não substituem esse teste.

Não alterar painel, perfis e layouts aprovados enquanto não bloquearem o experimento. Áudio/voz avançado e qualidade acima de 1080p ficam como frentes posteriores, sem reativação silenciosa.

## Situação desta proposta

Documento de planejamento: não contém patch do SDK, nova API ou validação de gameplay. Define o próximo lote para evitar nova dispersão para funcionalidades visuais. Arquitetura mais ampla exige revisão desta proposta antes de implementação.


## Referência adicional: Orbita — pesquisa de 2026-11-13

O site oficial apresenta o Orbita 1.1.0 como aplicativo XEX instalado no Xbox 360/Aurora. O console funciona como cliente: recebe imagem/som do xCloud e envia comandos. Essa evidência é de jogos da nuvem sendo usados no Xbox 360; não deve ser descrita como hospedagem de um Xbox 360 remoto ou desbloqueio de todo o acervo desse console.

A ajuda oficial vincula catálogo/permissões à conta Microsoft e relata recuperação de rede, menu rápido, configuração de controles e login por código. A página de jogos separa resultados testados, problemas e títulos ainda não testados. A distinção entre catálogo listado e gameplay confirmado é aplicável ao Nimbo.

### O que aproveitar na pesquisa

- Comparar descoberta de catálogo, identificação de título, início de sessão e motivos de encerramento com PSBox/Nimbo.
- Usar estados claros de reconexão e restabelecimento dos controles, com teste real de imagem, áudio e comandos.
- Preservar uma matriz de validação por jogo/rota, sem tratar título listado ou conexão provisionada como partida validada.
- Separar recursos nativos do Xbox 360 de APIs disponíveis no navegador. XEX/Aurora, controle/headset/Kinect e atualização do aplicativo não são recursos transferíveis diretamente para um userscript.

### Limite verificado

O link Código no GitHub do próprio site aponta para https://github.com/sergiolimasks/orbita. A abertura direta e a consulta à API GitHub retornaram 404 nesta pesquisa. A indexação de busca ainda mostra um README de uma versão ELF legada, mas isso não equivale a acesso ao código atual XEX. Não foi possível inspecionar os payloads, autenticação, oferta ou transporte da versão atual. Não inferir que ela usa uma identidade específica, libera títulos indisponíveis ou pode ser incorporada diretamente ao Nimbo.

Esta referência acrescenta evidência de cliente independente no hardware antigo; não altera os requisitos de disponibilidade/autorização do serviço nem comprova suporte a GTA VI.

Fontes primárias:
- https://x360.pistatrack.com/?lang=pt-BR
- https://x360.pistatrack.com/ajuda?lang=pt-BR
- https://x360.pistatrack.com/jogos
