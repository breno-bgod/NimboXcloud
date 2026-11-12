# Roteiro de desenvolvimento — NimboXcloud

> Atualizado em 2026-11-11 · Referência: v4.12.27 · Este roteiro **não** significa que as tarefas estejam concluídas.
>
> **Documento central:** [Estado do projeto e decisões](./PROJECT_STATUS_AND_DECISIONS.md). Leia a matriz de funcionalidades congeladas, experimentais, mantidas e pendentes antes de desenvolver.

## P0 — Bloqueadores do beta público

- [ ] Fazer `node --check NimboXcloud.user.js`, `node --test tests/*.test.cjs` e `node tools/static-risk-report.cjs` passarem no CI.
- [ ] Atualizar testes legados para a interface e os perfis atuais sem eliminar cobertura útil.
- [ ] Garantir que Automático preserve a identidade nativa do dispositivo, sem `osName` imposto por um preset de qualidade.
- [ ] Revisar interceptações de rede, WebRTC e Gamepad API; verificar segurança, recuperação e tratamento de preferências antigas.
- [ ] Validar inicialização, reprodução, reconexão e entrada nativa em sessões reais.

## P1 — Estabilização e testes

- [ ] Concluir ocultação do laboratório de identidade Xbox e do equalizador avançado, preservando volume básico.
- [ ] Verificar que recursos congelados anteriormente ativados não continuem aplicando transformações inesperadas.
- [ ] Testar Fortnite Console **como experimento opt-in**, registrando se a configuração de sessão foi alterada e se houve diferença visível no jogo.
- [ ] Testar giroscópio aplicado ao jogo no Android com controle físico e retorno ao modo nativo.
- [ ] Medir bitrate efetivo com limites de 5/10/20/50 Mbps, junto a codec, resolução, FPS, RTT e perda.
- [ ] Validar seleção de servidor e fallback, diferenciando seleção configurada de data center efetivo.
- [ ] Medir custo de WebGL2, HUD e rotinas periódicas em dispositivos reais.
- [ ] Validar NX em Android, desktop e Samsung DeX quando disponível.

## P2 — Preparação da versão pública

- [ ] Separar código-fonte por módulos sem exigir múltiplos userscripts para o jogador.
- [ ] Criar build reproduzível e testes de integração por módulo.
- [ ] Atualizar README, documentação de arquitetura, notas de versão, licenças e guia de contribuição.
- [ ] Publicar beta com limitações explícitas, configuração segura e opção de restaurar padrões.

## Congelados ou em retomada controlada — não reativar interface sem evidência

- Remote Play: retomada técnica xHome autorizada pelo mantenedor em 2026-11-12; continuar desenvolvimento incremental, mantendo a interface oculta até sessão com vídeo, áudio e controles ser homologada em Xbox real.
- Laboratório de identidade Xbox: nenhuma identidade de hardware comprovada.
- Curvas de analógico: estudar interceptação da Gamepad API e regressões.
- Equalizador avançado: resultado considerado insatisfatório pelo mantenedor.

## Mantidos para testes experimentais

- Fortnite Console: sinalização de toque, não emulação de Xbox.
- Giroscópio aplicado: testar entrada, calibração, conflito e recuperação.
- GPU/WebGL2 e editor de HUD: manter sob avaliação, sem alegar homologação.

## Regras de atualização

1. Atualize a matriz em `PROJECT_STATUS_AND_DECISIONS.md` sempre que um recurso mudar de estado.
2. Atualize `CHANGELOG.md` quando o comportamento do usuário mudar.
3. Vincule evidências de testes/CI e commit; nunca confunda código presente com funcionalidade comprovada.
