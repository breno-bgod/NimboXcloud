# P00 — Inventário estático de módulos (2026-11-11)

Fonte: `NimboXcloud.user.js` v4.11.2, 4.520 linhas. Contagens abaixo são **linhas com correspondência lexical**, não números de módulos ou de bugs. Não houve sessão xCloud.

| Área | Linhas com ocorrências | Primeiras linhas | Proprietário/risco a revisar |
|---|---:|---|---|
| Pointer Lock | 9 | 1039, 1057, 1059, 1067, 1096 | Override global de Element.prototype; CORE-001.F01 |
| Gamepad | 62 | 202, 235, 2770, 2839, 2840 | Coordenador nxInputBridge e scripts concorrentes; INPUT-001/006 |
| Touch/pointer | 20 | 1211, 1231, 1245, 1257 | Arrasto do painel e editor versus jogo; INPUT-004 |
| Rede | 12 | 190, 455, 691, 693, 809 | fetch/XHR/WebRTC; NET-001 |
| Armazenamento | 45 | 111, 148, 220, 243, 253 | Perfis e migração; CORE-005/HUD-006 |
| HUD | 72 | 1830, 1831, 1832, 1838 | Prévia, persistência e descoberta passiva; HUD-001/002 |
| Diagnóstico | 39 | 73, 196, 218, 336 | Observabilidade e privacidade; DIAG |

## Dependências e ordem

1. CORE-001/002: documentar hooks e histórico antes de alterar entradas.
2. CORE-004: manter teste de sintaxe, metadados e marcadores de risco no CI.
3. INPUT-001/002/004: reproduzir comportamento antes de remover interceptações.
4. HUD-002: observar HUD real antes de tentar aplicar posições do editor.
5. NET-001: preservar a camada de interceptação de sessão ao alterar rede.

## Riscos não resolvidos

- **CORE-001.F01:** override de `requestPointerLock` pode bloquear recaptura nativa.
- **CORE-001.F02:** o editor atual não deve ser confundido com editor de controles reais.
- **CORE-001.F03:** coexistência de hooks globais com outros userscripts precisa ser verificada.
- A existência de código de giroscópio ou gamepad não confirma que funciona no Android.

## Critério de encerramento CORE-001

Mapa de cada hook global com instalação, desinstalação, prioridade, fallback, conflitos, dono e testes reais. Este documento é um **inventário preliminar**; CORE-001 permanece em andamento.
