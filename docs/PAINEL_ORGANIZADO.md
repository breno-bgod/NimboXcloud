# Organização do painel — 4.13.2

> A entrega 4.14.0 levou qualidade para Vídeo e imagem e colocou captura/tela cheia no topo do painel. Consulte [Vídeo e imagem](./VIDEO_E_IMAGEM.md) para a organização e verificação desses recursos.

Alteração solicitada pelo mantenedor: reduzir categorias, reunir ajustes relacionados e manter Estatísticas como página própria. O redesenho visual do Início fica para uma etapa posterior; neste lote, seus links apenas acompanham a nova organização.

| Página | Conteúdo e ordem |
| --- | --- |
| Início | Resumo e atalhos atualizados; estrutura visual preservada |
| Vídeo e imagem | Dispositivo e apresentação do vídeo acima; brilho, contraste, saturação e perfis locais abaixo; processamento avançado recolhido |
| Streaming | Servidores, qualidade solicitada e rede |
| Estatísticas | Métricas, gráficos e detalhes da transmissão; link para personalizar o monitor |
| Entradas | Seletor único dos cinco modos e editor de HUD; ajustes de controle físico e teclado/mouse em seções expansíveis |
| Áudio e voz | Microfone/voz primeiro; reprodução, volume, saída e efeitos depois |
| Remote Play | Destino independente existente |
| Interface | Aparência do painel NX e do monitor de estatísticas na mesma página |
| Sistema | Compatibilidade, informações do sistema, manutenção e diagnósticos técnicos |

## O que saiu da navegação

- Páginas separadas de Imagens, Voz, Compatibilidade, Controle físico e Teclado e mouse. Seus ajustes continuam nos destinos acima, sem apagar preferências ou layouts.
- Região da loja. O código antigo alterava mercado/território; não era o seletor de datacenter. Foi retirada da interface a pedido do mantenedor, sem mudar o comportamento de login/região já configurado. Os servidores continuam em Streaming. Não presumir que excluir a opção visual autoriza reescrever toda a negociação regional.
- Importação/exportação de JSON na tela de imagem. Salvar e selecionar perfis locais continua disponível; formatos e rotinas legadas de validação permanecem no código.
- Ativações duplicadas e contadores técnicos nas configurações de entrada. Conexão do controle, analógicos, vibração, giroscópio e atalhos continuam acessíveis; diagnóstico técnico fica em Sistema.

Destinos internos antigos são resolvidos para as páginas agrupadas. A busca aponta somente para categorias atuais: `microfone` → Áudio e voz; `brilho` → Vídeo e imagem; `zona morta` → Entradas; `identidade` → Sistema; `layout` → Interface.

## Correções encontradas durante a revisão

1. **Vídeo mostrava somente dispositivo:** enquadramento, tela cheia e economia eram procurados em Biblioteca de perfis, mas o construtor original os insere em Imagem. A extração usa o grupo correto e move esses controles para cima, sem duplicá-los em Imagem. Os mesmos nós e handlers são reutilizados.
2. **Brilho/contraste inconsistentes entre pipelines:** o shader GPU aplicava contraste antes de brilho, em ordem diferente do filtro CSS padrão. A ordem agora é brilho → contraste → saturação. Escalas, perfis, valores salvos e ativação opt-in da GPU não foram alterados. Isto corrige uma inconsistência de código; não comprova a causa de toda percepção ruim de brilho relatada pelo mantenedor.
3. **Monitor vertical:** trocado separador literal `\\n` por quebra de linha real.
4. **Restaurar/limpar:** corrigida a expressão que buscava um `\\b` literal em vez de uma fronteira de palavra; as ações passam a ser movidas corretamente para o fim da página.

## Verificação

- Sintaxe dos scripts verificada com Node.
- **277 testes locais: 274 PASS, zero FAIL, três TODO.** Nove testes novos executam os compositores reais; o teste de vídeo utiliza o construtor original de mídia em DOM controlado para detectar novamente a extração do grupo errado. Cobertura também inclui ordem voz/áudio, destinos agrupados, seções de entrada, Interface/Estatísticas, recuperação e monitor vertical.
- Shader verificado quanto à ordem de operações em valores de sombras, meios-tons e realces por referência matemática escalar; não equivale a renderização WebGL real nem a equivalência visual entre navegadores.
- Chromium/Playwright tentou iniciar e falhou em Crashpad com `setsockopt: Operation not permitted`. Não foi possível verificar aparência, overflow, foco/multitoque reais nem percepção do brilho em uma sessão Xbox.

## Aceite no dispositivo

1. Atualizar o userscript para 4.13.2 e recarregar `play.xbox.com`.
2. Conferir nove categorias e ausência de Região da loja; abrir Voz/Áudio e Vídeo/Imagem e conferir a ordem dos controles.
3. Em Vídeo e imagem, testar enquadramento/tela cheia durante uma partida. Ajustar brilho com GPU desligada; depois, se já utilizar GPU, repetir com os mesmos valores e restaurar a imagem. Registrar navegador e configuração se o resultado ainda incomodar.
4. Em Interface, mudar cor/transparência do painel e layout/escala do monitor; selecionar vertical e conferir que as métricas ocupam linhas separadas.
5. Em Entradas, selecionar um modo e expandir somente os ajustes necessários. Confirmar que os cinco modos, layouts existentes e atalhos continuam funcionando.

Este lote reorganiza a interface e corrige os erros citados. Não altera transporte de controles, resolução negociada, catálogo, autenticação nem a sinalização xHome.
