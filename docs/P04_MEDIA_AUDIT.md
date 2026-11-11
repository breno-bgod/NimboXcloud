# P04 — Vídeo e Áudio: auditoria de implementação

## Estado inicial — 2026-11-11
- **MEDIA-001 — Ciclo de vida do vídeo:** parcialmente implementado. O monitor existente identifica o vídeo ativo a cada 2,5 s; a v4.12.0 restaura filtros locais ao trocar o elemento. Ainda precisa de testes em Chrome/Edge e vídeo recriado pelo React.
- **MEDIA-002 — Qualidade visual:** parcialmente implementado. Filtros CSS de contraste e saturação preservam e restauram o filtro inline do host. **Não são CAS, nitidez real, upscaling ou geração de quadros.** Nenhum processamento pesado de quadros foi adicionado.
- **MEDIA-003 — Perfis visuais:** pendente; opções legadas de contraste e cor já existem, mas não representam perfis novos de processamento.
- **MEDIA-004 — Tela cheia e proporção:** revisão pendente.
- **MEDIA-005 — Áudio:** equalização Web Audio opcional já existe; revisão de segurança, retomada e troca de mídia pendente.
- **MEDIA-006 — Desempenho e bateria:** revisão pendente.
- **AUD-04:** aberta; testes reais e suíte Node não executados nesta etapa.

## Commits
- `016b38bb`: userscript v4.12.0, restauração de filtros e preservação da apresentação original do site.
- `24171983`: testes estáticos MEDIA-001/002.

## Regras
- Preservar WebRTC, áudio e vídeo nativos; efeitos locais opt-in.
- Não anunciar melhorias reais de resolução, bitrate ou FPS sem medição.
- Reabrir P03 caso um problema de negociação de streaming seja observado.

## Segunda etapa — MEDIA-003 (2026-11-11)
- `db301c36` v4.12.1: perfis Original, Equilibrado, Vívido e Manual no painel; sem CAS ou upscaling.
- `a8c1e98e` v4.12.2: perfil inicial Manual para preservar ajustes legados já salvos.
- `d9d9490e` v4.12.3: reavalia aplicação de Equilibrado/Vívido quando o host reseta o estilo do elemento.
- MEDIA-003: implementação inicial concluída; teste de interação real pendente. MEDIA-001/002 permanecem parciais até homologação. MEDIA-004..006 exigem revisão de código.
