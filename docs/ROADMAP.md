# Roteiro de desenvolvimento — NimboXcloud

> Revisão incremental em 2026-11-12 · Referência: v4.12.88 · Este roteiro **não** significa que as tarefas estejam concluídas.
>
> **Documento central:** [Estado do projeto e decisões](./PROJECT_STATUS_AND_DECISIONS.md). Leia a matriz de funcionalidades congeladas, experimentais, mantidas e pendentes antes de desenvolver.

## Plano incremental vigente

A [avaliação comparativa e plano de atualização](./PLANO_ATUALIZACAO.md) detalha evidências, locais de mudança, riscos e critérios de aceite. Preservar sistemas funcionais, especialmente o mouse por toque. Ordem recomendada: servidores dinâmicos → consolidação da entrada existente → qualidade medida → áudio/voz → remapeamento avançado. Isso não torna todos os recursos do Better xCloud requisitos de paridade.

O lote 4.12.88 corrige a seleção de qualidade, perda negativa e cobertura ESM. O perfil HQ continua padrão sem preferência; escolhas Windows salvas passam a ser respeitadas. A necessidade de uma opção de negociação inteiramente nativa permanece em investigação, sem alterar silenciosamente esses perfis.

## P0 — Bloqueadores do beta público

- [ ] Confirmar CI do lote atual com sintaxe dos dois scripts, `node --test tests/*.test.cjs tests/*.test.mjs` e relatório estático. A base anterior tem CI aprovado; o lote atual passou localmente.
- [x] Recuperar o smoke legado para os contratos atuais e incluí-lo no CI (4.12.88); manter cobertura de novas regressões.
- [ ] Garantir que Automático preserve a identidade nativa do dispositivo, sem `osName` imposto por um preset de qualidade.
- [ ] Revisar interceptações de rede, WebRTC e Gamepad API; verificar segurança, recuperação e tratamento de preferências antigas.
- [ ] Validar inicialização, reprodução, reconexão e entrada nativa em sessões reais.

## P1 — Estabilização e testes

- [ ] Concluir ocultação do laboratório de identidade Xbox e do equalizador avançado, preservando volume básico.
- [ ] Verificar que recursos congelados anteriormente ativados não continuem aplicando transformações inesperadas.
- [ ] Testar Fortnite Console **como experimento opt-in**, registrando se a configuração de sessão foi alterada e se houve diferença visível no jogo.
- [ ] Testar giroscópio aplicado ao jogo no Android com controle físico e retorno ao modo nativo.
- [ ] Medir bitrate recebido com Windows/HQ, codec, resolução, FPS, RTT e perda. Limites legados de 5–50 Mbps não estão ativos; avaliar teto opcional somente em experimento separado.
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

