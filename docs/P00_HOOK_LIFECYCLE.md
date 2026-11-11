# P00 — Mapa de hooks e ciclos de vida (v4.11.4)

Inventário estático obtido de `NimboXcloud.user.js` v4.11.4. Contagens por ocorrência textual, não por instância ativa.

| Área | Ocorrências | Localização | Risco / verificação seguinte |
|---|---:|---|---|
| Interceptores globais diretos (fetch, Pointer Lock, XHR send) | 3 | linhas ~693, 1065, 1152 | Ordem com outros scripts e reversibilidade |
| Subscrições `addEventListener` | 80 | dispersas | Remoção ao fechar UI, listeners duplicados |
| `setInterval` | 7 | ~2015, 4219, 4430, 4445, 4466, 4517, 4521 | Limpeza após troca SPA e fechamento |
| `setTimeout` | 3 | ~1768, 3248, 4322 | Cancelamento e descarte de elementos |
| Escritas `localStorage` | 22 | dispersas | Persistência, rollback e migração |

**Importante:** `navigator.getGamepads` também aparece no código e pode ser interceptado por atribuição indireta; a tabela de interceptores diretos não é exaustiva. Exige análise manual de `Object.defineProperty` e dos consumidores.

## Ciclo de vida: Pointer Lock

- Modo legado (padrão): intercepta `requestPointerLock`, controla recaptura por F9 e registra estado.
- Modo opt-out (`nx.pointerLockLegacyF9=0`): não substitui `requestPointerLock`, não consome F9, não afirma que F9 é exigido nos diagnósticos de captura.
- Testes isolados de DOM mock foram escritos, **não executados no navegador real**.
- O modo opt-out precisa de recarga, e não substitui um gerenciamento único de entradas.

## Lacunas para CORE-001

Identificar proprietários, teardown, colisões de cada listener/timer e confirmar no Chrome/Edge Android e desktop. CORE-001 permanece EM_ANDAMENTO.
