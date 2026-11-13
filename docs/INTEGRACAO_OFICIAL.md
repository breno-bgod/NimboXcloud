# Base oficial unificada — 4.15.4

Decisão expressa do mantenedor: uma base oficial, preservando interface e funcionalidades do PR #29, com giroscópio/touchpad reconciliados do PR #27 e desenvolvimento PSBox/Android do PR #24. O instalador para uso é o da main, não um instalador por PR.

## O que está incluído

- Userscript 4.15.4 e módulo oficial 1.4.1: Central de Entradas, tema, editor e preferências do PR #29; perfis FPS/Corrida em paisagem, composição de analógicos e touchpad de mira para controles. [Guia](GIROSCOPIO_E_TOUCHPAD.md).
- Fontes/experimentos/docs do PR #24, com histórico por SHA, licenças GPL e avisos, contrato de sessão, camada Android, Java/JNI/lifecycle, HTTP/MbedTLS, raízes públicas e builds ARM64/AAR. Código nativo fica em experiments/console/ e não é carregado pelo userscript.
- Histórico de ambas as frentes preservado no merge, sem force push e sem substituir a interface do PR #29 por arquivos antigos de produto do PR #24.

## Limites reais

**Unificação de código não é integração funcional de streaming PSBox.** Hoje existe biblioteca experimental compilada, sem APK, núcleo completo ligado, login manual no host, biblioteca de jogos, mídia ou gameplay validados. Um userscript não executa a biblioteca nativa. A interface única dos dois motores pertence ao futuro host APK; nenhum botão fictício de motor foi adicionado para representar algo ainda indisponível.

Entradas mistas, orientação/sensor físico, fullscreen e conforto do touchpad precisam de teste no aparelho. Touchpad de mira não implementa o protocolo específico PlayStation. O código não altera entitlement nem comprova identidade Xbox, e não promete suporte a GTA VI.

## Continuidade

A main unificada é a referência para novos PRs. PR #24 e #27 ficam como origens incorporadas, não versões de instalação paralelas. Automação passa a cada duas horas, preservando entradas, HUD/editor, autenticação e configurações. Trabalhar em branches/PRs, sem publicação automática. Próximos marcos: feedback do giroscópio/touchpad, host Android real, ligação de núcleo/transportes/mídia e partida autorizada com áudio/vídeo/controles.

Validação disponível antes da unificação: produto 402 testes (399 PASS, 0 FAIL, 3 TODO); contrato de sessão 9 PASS; testes C++ de armazenamento/lifecycle e teste Java de propriedade aprovados; transporte HTTP/CA offline e ARM64/AAR aprovados no CI do PR #24. O PR de unificação deve repetir os checks afetados. Nenhum resultado de build é descrito como instalação ou gameplay.
