# NimboXcloud — plano mestre, histórico e retomada

**Atualizado:** 2026-11-14  
**Estado:** investigação e portabilidade; nenhuma solução completa comprovada.  
**Branch de trabalho:** `experiment/psbox-web-port`. **Não alterar `main` sem pedido explícito.**  
**Regra de continuidade:** antes de programar, ler este arquivo, conferir o estado atual do GitHub e atualizar a seção de progresso após cada teste.

## 1. Objetivo inegociável

Construir **NimboXcloud**, um cliente alternativo, gratuito e principalmente **mobile/Android**, capaz de autenticar o usuário na Microsoft/Xbox, consultar catálogo Game Pass, solicitar sessões Xbox Cloud Gaming e receber vídeo/áudio e enviar comandos diretamente à infraestrutura da Microsoft. O jogo é executado nos servidores Xbox, **não no celular**. Não construir um serviço próprio de cloud gaming, nem hospedar consoles, nem exigir instalação do PSBox original, nem exigir que o mantenedor pague por um servidor permanente.

A interface pode ser Web ou APK, mas **Web puro sem instalação é preferível se tecnicamente viável**. APK próprio Android é alternativa, sujeita a aprovação do usuário. A disponibilidade do serviço depende de conta, elegibilidade, região e regras Microsoft.

## 2. Fontes primárias e licença

- **PSBox (principal):** https://github.com/RafaelNGP/psbox-cloud-gaming — GPL-3.0-or-later; PS4, PS5 e Linux/Steam Deck. Leia o README e os arquivos de código antes de alterações.
- **Orbita (comparador):** https://github.com/sergiolimasks/orbita — README público descreve cliente xCloud nativo Xbox 360 RGH/JTAG, sem PC intermediário; projeto ELF legado encerrado, desenvolvimento XEX fora desse repositório. GPL-3.0. **Limitação em 2026-11-14:** consulta de arquivos internos pelo conector GitHub retornou 404. O README foi consultado via busca pública, mas **não foi possível inspecionar o código interno do Orbita**. Não afirmar comparação de implementação até conseguir os arquivos.
- PSBox: `src/auth/msa.h`, `src/auth/msa.cpp`, `src/auth/auth_manager.cpp`, `src/auth/xbox_live.cpp`, `src/xcloud/gssv.cpp` foram efetivamente lidos no GitHub em 2026-11-14.
- O repositório NimboXcloud contém uma cópia upstream em `experiments/upstream/psbox-cloud-gaming/`; verificar versão e licença antes de reutilizar.

**Licenciamento:** atribuir autoria, preservar avisos e cumprir GPL e licenças de dependências; não apresentar PSBox/Orbita como produtos próprios ou afiliados à Microsoft.

## 3. Arquitetura verificada do PSBox

1. `MsaClient` usa POST `https://login.live.com/oauth20_connect.srf` com `response_type=device_code`, `client_id` e escopo; faz polling em `https://login.live.com/oauth20_token.srf` com grant de device code. Código consultado: `src/auth/msa.cpp`.
2. Configuração padrão no `src/auth/msa.h`: escopo legado `service::user.auth.xboxlive.com::MBI_SSL` e identificador público pertencente à família de clientes Xbox. **Não presumir autorização para reutilizar o ID de outro aplicativo**.
3. `AuthManager::xboxChain` chama Xbox User Token com ticket `t=` e tenta `d=` após falha HTTP; pede XSTS de perfil e XSTS GSSV. Código: `src/auth/auth_manager.cpp`.
4. `src/auth/xbox_live.cpp` implementa `/user/authenticate` e `/xsts/authorize`, com `SandboxId=RETAIL` e `UserTokens`. Trata erros XErr (sem perfil Xbox, região, conta infantil etc.).
5. `src/xcloud/gssv.cpp` usa XSTS GSSV para login de serviço, obtendo token de sessão para catálogo/sessões. Precisa estudar ainda em detalhe a sequência de negociação WebRTC, áudio, vídeo e controle.
6. O PSBox usa camada HTTP nativa `net::perform`; essa diferença explica por que copiar chamadas para `fetch` de uma página estática não é portabilidade equivalente.

**Orbita:** somente o README foi validado: login por código, catálogo, sessão, WebRTC, H.264, Opus e controles no Xbox 360; NÃO foi feita auditoria de seus módulos internos.

## 4. Histórico factual de tentativas e problemas

| ID | Tentativa / problema | Evidência observada | Estado / consequência |
|---|---|---|---|
| P01 | Fork de BetterXcloud / novo xCloud | Usuário relatou mudanças frequentes e regressões na base | Histórico relatado; exige regressão documentada |
| P02 | Redimensionamento de tela | Usuário relatou dimensionamento incorreto | Aberto, sem teste reproduzível arquivado |
| P03 | Seleção de região JP a partir do Brasil | Usuário relatou servidor regional sendo forçado ao local | Aberto; diferenciar UI, roteamento e restrições do serviço |
| P04 | Conflitos de controle/gamepad | Usuário relatou como bloqueador crítico | Aberto; definir matriz de dispositivos e mapeamentos |
| P05 | Acessibilidade/toggles sem efeito | Usuário relatou várias tentativas | Aberto; não adicionar toggles sem teste |
| P06 | Herdar bugs da base e instabilidade crescente | Relato de sucessivas regressões | Aberto; testes automatizados e baseline |
| P07 | Port PSBox no navegador usando `fetch` | Erro `MSA_NETWORK_OR_CORS_ERROR` em `login.live.com` | Bloqueio CORS/rede; não confundir com rejeição Xbox |
| P08 | Registro de aplicativo Microsoft Entra SPA + PKCE | `openid profile` funcionou no diagnóstico Web | **Somente OAuth Microsoft básico comprovado** |
| P09 | Escopo `XboxLive.signin` em Entra PKCE | HTTP 400 `invalid_grant`, AADSTS70000: escopo não autorizado/expirado | Falha antes de Xbox User Token e XSTS; não inferir que o usuário recusou acesso |
| P10 | Fluxo Xbox User Token/XSTS em JS | Código experimental implementado, mas não alcançado no teste P09 | Não validado |
| P11 | GSSV e catálogo reais no Web | Não foram comprovados em execução | Não validados |
| P12 | Prova backend Node de device code | `experiments/auth-backend/server.mjs` criado; exige `NIMBO_MSA_CLIENT_ID` próprio e autorizado | Código não testado com login real; sem hospedagem |
| P13 | Modelo com servidor pago | Rejeitado pelo usuário por custo e desvio de objetivo | **Não recomendar como arquitetura final** |
| P14 | Instalar PSBox no dispositivo do usuário | Rejeitado: torna NimboXcloud redundante | Não é solução de produto |
| P15 | Streaming e gamepad no Android/Web | Sem sessão ponta a ponta demonstrada | Principal risco futuro; transporte WebRTC é parte do cliente, não serviço de streaming próprio |
| P16 | Auditoria de código Orbita | Conector GitHub respondeu 404 para arquivos internos; README público acessível | **Pendente**; não inventar conclusões |

**Importante:** a lista representa os problemas conhecidos até esta data, não afirma cobertura absoluta de todos os bugs de todos os commits. Para inventário completo, auditar Issues, PRs, testes e histórico do repositório.

## 5. Diagnóstico e propostas de correção (priorizadas)

### Fase A — congelar evidências e escolher ambiente
- [ ] Inventariar branches, PRs (#31 oficial e #34 experimento), workflows, commits, testes, issues e logs sem alterar `main`.
- [ ] Criar matriz de compatibilidade: Android Chrome/WebView, Android nativo (NDK), desktop apenas como bancada de teste.
- [ ] Obter acesso verificável ao código Orbita (clone/arquivo/URL acessível) e inspecionar autenticação, sessão e transporte. Marcar diferenças com caminhos/linhas.
- [ ] Inspecionar o código PSBox de sessão, catálogo, WebRTC, controle e dependências; mapear plataforma e componentes portáveis.

### Fase B — autenticação: provar a cadeia, sem suposições
- [ ] Teste isolado MSA device code em ambiente nativo controlado usando **cliente autorizado**, sem publicar tokens.
- [ ] Verificar Xbox User Token, XSTS de perfil, XSTS GSSV e login GSSV separadamente; registrar status e erro sanitizado.
- [ ] Distinguir CORS, OAuth `invalid_grant`, XErr, elegibilidade de conta, restrições regionais e alteração de API.
- [ ] Não tentar contornar autorização por uso indevido de Client IDs de terceiros; se não houver caminho autorizado, registrar impedimento real e avaliar integração com Web oficial.

### Fase C — catálogo e sessão
- [ ] Verificar autenticação GSSV e catálogo real com conta elegível.
- [ ] Documentar sequência exata de endpoints, headers, token lifetimes, offering, região, criação e encerramento de sessão.
- [ ] Testar seleção de região apenas dentro das capacidades permitidas pelo serviço.

### Fase D — cliente Android / WebRTC
- [ ] Avaliar viabilidade do Web puro **sem proxy**: CORS, WebRTC, codecs, controle, permissões e políticas de navegador.
- [ ] Se Web puro não for viável, prototipar **APK próprio NimboXcloud** com motor C++/NDK e interface WebView/Compose; sem instalação do PSBox e sem servidor próprio. Exige decisão do usuário.
- [ ] Estudar portabilidade de `libdatachannel`, FFmpeg/MediaCodec, Opus, sockets, certificados e threading.
- [ ] Testar sessão WebRTC real, latência, áudio, vídeo, desconexão e reconexão.
- [ ] Validar controles Bluetooth/USB, touch, Gamepad API/Android Input, vibração, conflito e remapeamento.

### Fase E — qualidade, segurança e entrega
- [ ] Não registrar tokens, refresh tokens, códigos de login nem credenciais em logs/CI.
- [ ] Armazenamento seguro Android (Keystore) se persistência for necessária; limpar sessão no logout.
- [ ] Testes automatizados unitários + integração com mocks + testes reais opt-in.
- [ ] GitHub Actions para builds e releases gratuitos, respeitando limites; GitHub Pages apenas para arquivos estáticos.
- [ ] Documentar conformidade com GPL e riscos de mudança/indisponibilidade das APIs Microsoft.

## 6. Critérios de aprovação (gates)

**G0:** código-fonte e dependências auditados com referências verificáveis.  
**G1:** autenticação MSA autorizada, Xbox User Token, XSTS e GSSV demonstrados no dispositivo/ambiente-alvo.  
**G2:** catálogo real consultado sem tokens expostos.  
**G3:** sessão criada e transporte WebRTC negociado.  
**G4:** vídeo + áudio + controle em Android, com medições e reconexão.  
**G5:** pacote NimboXcloud utilizável, sem infraestrutura paga do mantenedor.

Não declarar etapa concluída só porque o código foi escrito ou o OAuth básico funcionou.

## 7. Arquivos existentes / referências do projeto

- `experiments/web-engine/auth-test.html`: teste Entra PKCE; erro AADSTS70000 com `XboxLive.signin`.
- `experiments/web-engine/msa-web-auth.mjs`: port MSA para navegador; sujeito a CORS.
- `experiments/web-engine/xbox-web-auth.mjs`: Xbox User Token/XSTS JS ainda não validado em navegador.
- `experiments/auth-backend/server.mjs`: prova local de MSA, **não solução final**.
- `.github/workflows/psbox-pages.yml`: publica laboratório estático; não executa backend.
- `experiments/upstream/psbox-cloud-gaming/`: snapshot PSBox; verificar sincronização com upstream.
- Repositórios originais: links na seção 2.

## 8. Registro de decisões

- D01: NimboXcloud é **cliente** xCloud, não plataforma de cloud gaming.
- D02: zero servidor pago permanente; jogos e streaming são infraestrutura Microsoft.
- D03: PSBox é referência técnica primária, Orbita secundária; respeitar licenças.
- D04: não exigir PSBox instalado no dispositivo do usuário.
- D05: preferir Web sem instalação, mas avaliar APK Android próprio como alternativa, **não decidir sem consultar usuário**.
- D06: manter versão oficial `main` intacta; trabalhar na branch experimental.
- D07: preservar logs e resultados sanitizados e não confundir protótipo com validação.

## 9. Próxima ação concreta

1. Recuperar código do Orbita por fonte acessível e verificar módulos; se indisponível, registrar limitação.
2. Mapear arquivos de catálogo/sessão/WebRTC e plataforma do PSBox e escrever tabela arquivo → responsabilidade → dependências → possibilidade Android/Web.
3. Fazer inventário de issues/PRs/testes NimboXcloud para completar lista de problemas.
4. Definir um experimento **mínimo e verificável**: autenticação autorizada + GSSV + catálogo, sem servidor próprio, em Android nativo ou outro ambiente controlado.
5. Registrar resultado, commit, dispositivo, logs sanitizados e próxima ação aqui.

## 10. Modelo obrigatório para futuras atualizações

```
### YYYY-MM-DD — tarefa
- Branch/commit:
- Hipótese:
- Código-fonte examinado (links e linhas):
- Alteração:
- Testes executados:
- Resultado comprovado:
- Erros/limitações:
- Próximo passo:
```

**Instrução para futuras sessões/Codex:** começar por este arquivo; verificar o repositório real; nunca inferir sucesso de implementação; preservar decisões do usuário; atualizar este documento junto de cada mudança significativa.
