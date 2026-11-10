# Roteiro de desenvolvimento

Este documento reúne prioridades de trabalho, **não** funcionalidades já entregues.

## Prioridade alta
- [ ] Validar em sessão real do xCloud os perfis de qualidade 1080p HQ, 1080p e 720p.
- [ ] Verificar a resolução efetiva recebida em Android, Samsung DeX e Windows, em janela e tela cheia.
- [ ] Investigar negociações que ainda resultem em aproximadamente 640p.
- [ ] Confirmar que toque e gamepad continuam operando sem regressões.
- [x] Corrigir consistência de versão e prevenção de inicialização duplicada no código (v3.4.0).\n- [ ] Testar alternância dinâmica entre toque, gamepad e teclado/mouse em sessões reais.

## Prioridade média
- [ ] Melhorar mensagens de erro e diagnóstico de negociação WebRTC.
- [ ] Criar testes automatizados para transformações de requisições e respostas, quando possível.
- [ ] Verificar compatibilidade com atualizações do `play.xbox.com`.
- [ ] Definir estratégia segura de distribuição e atualização para repositório público.

## Antes de abrir o código ao público
- [ ] Revisar direitos autorais e incluir o texto integral das licenças aplicáveis.
- [ ] Fazer revisão de segurança e privacidade do userscript.
- [ ] Documentar versões de navegadores e ambientes efetivamente testados.
- [ ] Publicar uma versão estável com notas de lançamento e instruções verificadas.
