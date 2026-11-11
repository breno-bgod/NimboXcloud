# P03 — Auditoria de streaming (2026-11-11)

## Escopo e política
Prioridade de código: confiabilidade da sessão, integridade das requisições, negociação WebRTC e diagnóstico. Não alegar aumento de resolução, FPS ou bitrate sem métricas reais. Não armazenar tokens, headers ou SDP completo nos relatórios.

## Inventário da base existente
- NET-001: wrapper fetch para login, play, sdp, ice, configuration, monitor de estado; XHR interceptado em módulo separado. Compatibilidade com a versão atual do site não comprovada.
- NET-002: preferências de região e data center, reordenação de offeringSettings.regions, histórico RTT. O servidor mantém a decisão final.
- NET-003: perfis de resolução, teto SDP de bitrate; teto não aumenta bitrate recebido.
- NET-004: filtros experimentais de candidatos ICE IPv4/IPv6; alteração pode impedir conexões em redes IPv6-only.
- NET-005: métricas inbound-rtp, candidato selecionado, bitrate, perda, jitter, FPS, frames descartados.
- NET-006: monitoramento passivo de etapas da sessão e falhas; não há recuperação automática garantida, nem deve haver reinício agressivo de WebRTC fora da lógica do site.

## Correções aplicadas
- `184b95ca` v4.11.23: remove métricas antigas quando a sessão é fechada, melhora seleção do fluxo inbound de vídeo e do par ICE.
- `3b41b238` v4.11.24: restringe reescrita SDP aos tipos offer/answer; mantém o SDP original quando não há alterações; impede publicação de QoS após fechamento da sessão; garante liberação do bloqueio de amostragem em erros.
- `6649b531`: testes de regressão para SDP, ciclo de vida QoS e seleção de relatórios.

## Pendências
- NET-001/002/003/004: revisão de compatibilidade de endpoints e SDP/ICE com versão atual do xCloud; segurança de alterações por servidor.
- NET-005: testes com WebRTC real e comparação de métricas.
- NET-006: mapear estados reais de reconexão, evitar loops de retry.
- AUD-03: aberta. P03 não está homologado.

## Lote adicional — 2026-11-11
- `59d0e275` v4.11.25: o filtro IPv4 experimental preserva o SDP/ICE original se a remoção de IPv6 deixaria zero candidatos de transporte; `patchPlayRequest` preserva `signal`, `referrerPolicy` e `keepalive`.
- `503e787a`: regressões estáticas para os dois casos.
- **Limites:** não garante conexão quando todos os candidatos são inválidos por outros motivos; a seleção efetiva continua com o navegador e o servidor. Não há evidência de ganhos de FPS/bitrate/latência sem testes reais.
- **Próxima revisão de código:** tratamento de cancelamento e falhas de rede sem alterar comportamento do fetch; confiabilidade de seleção de data center e sessão.

## Lote de região e falhas de sessão — 2026-11-11
- `98f3a5a3` v4.11.26: NET-002 limpa pin inválido quando data center solicitado não existe e evita reescrita redundante quando a região já é a padrão; NET-001 restringe injeção a HTTPS; NET-006 diferencia cancelamento explícito de falha de rede.
- `2ee55f1a`: regressões estáticas para fallback, idempotência e classificação de cancelamentos.
- **NET-006 não realiza reconexão automática:** o xCloud controla a negociação e reiniciar ICE arbitrariamente poderia quebrar a sessão. Diagnóstico passivo é deliberado.
- **Status de implementação:** NET-001..005 têm implementações e correções; NET-006 possui monitoramento e classificação, mas recuperação automática não implementada por falta de contrato seguro com o cliente atual. Auditoria real de endpoints, servidor e navegador permanece pendente. Não declarar P03 homologado.
