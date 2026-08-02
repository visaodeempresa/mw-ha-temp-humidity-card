# Histórico — mw-ha-temp-humidity-card

## 2026-08-02 — escala canônica vira o padrão (v0.2.0)

Pedido: o card tem de atender **como padrão** a faixa de cores dos templates
`temp_sensor_style` e `umid_sensor_style` — as mesmas que os `custom:button-card`
já usam nos dashboards —, e isso passa a valer para tudo que pinte temperatura
ou umidade (regra global 40).

Decisões:

- **A tabela virou lib**, não código colado: `IA/lib/mw-climate-scale/`,
  embutida aqui entre marcadores e vigiada pelo `check-embeds.sh`. Era isso ou
  ter a mesma tabela divergindo em silêncio no próximo card.
- **Escala livre continua existindo** (`color_scale: custom`), mas como opção.
  E YAML que já mexia em `color_temp_*`/`temp_stop_*` **cai nela sozinho**:
  quem ajustou cor na mão não acorda com outra escala.
- **Faixa seca e fundo chapado** viraram o padrão *dessa* escala (`blend` e
  `gradient` desligados) — o card tem de ficar indistinguível do button-card
  ao lado. Na escala livre nada muda. Como o default depende da escala,
  `SCALE_AWARE` é lido pelo card **e** pelo editor: dois lugares divergindo
  fariam o interruptor voltar sozinho ao ser mexido.
- **Texto passou a seguir o tema** na escala canônica. As cores têm alfa 0,50:
  a luminância que decidiria o contraste só existe depois da composição com o
  fundo do card, que muda com o tema. Contraste por luminância continua
  disponível em `text_mode: contrast`.
- **Vão morto do template corrigido.** No YAML a faixa de umidade é
  `{from:n, to:n.99}`, e `(n.99, n+1)` não casa com nenhuma — o laço cai no
  fallback, que é a cor de 100 % (preto). Sensor que reporte 58,995 % pisca
  preto. A lib fecha o vão; é a **única** divergência proposital contra o
  template, e está anotada no `knowledge`.
- Conferência: varredura de 0,01 em 0,01 (−20…60 °C, −5…105 %) contra a
  transcrição literal do template, e comparação de `getComputedStyle` no
  navegador em 422 amostras — zero divergências.

## 2026-08-01 — nascimento (v0.1.0)

Pedido: um card na linha dos de porta/janela e ocupação, mas com **dois
sensores e uma bateria só**; em vez de duas cores de estado, **faixas de cor** —
metade esquerda pela temperatura, direita pela umidade. Layout desejado:
`ícone 1 · sensor 1 · bateria · sensor 2 · ícone 2`. Flag para ocultar a
bateria e flags para protocolo, RSSI, LQI e roteador.

Decisões:

- **Fundo em duas metades** por `linear-gradient(90deg, …)` na própria
  `ha-card`, com costura ajustável (`seam_blend`, 10% por padrão) — corte seco
  fica duro demais em card pequeno, e 100% de mistura perderia a leitura de
  "cada lado é uma grandeza".
- **Cinco faixas por grandeza** (4 limites), com **degradê entre as âncoras**
  (centro de cada faixa) quando `blend: true`. Sem isso, a cor salta no limite
  e o card parece piscar com variação de 0,1 °C.
- **Contraste automático**: a cor do texto sai da luminância relativa (sRGB) do
  fundo daquela metade. Sem isso, o mesmo número que se lê no âmbar some no
  azul frio — e como o fundo muda com a leitura, fixar uma cor não resolve.
- **Quatro flags no rodapé**, não dois: o pedido citava quatro informações
  (protocolo, RSSI, LQI, roteador) agrupadas em "dois flags". Separados, dá
  para mostrar só o roteador sem arrastar o resto. Cada flag revela o seu campo
  no editor só quando ligado.
- **`tap_action: auto`** (padrão): cada pedaço abre o more-info do seu próprio
  sensor — é o comportamento que um card de duas grandezas pede.
- **Nome sem a grandeza**: `Sala Temperatura` vira `Sala`, porque o nome do
  card é do ambiente, não do sensor.
- Um sensor só também funciona; o outro lado fica `—` com fundo neutro.
- Já nasce com as armadilhas conhecidas da família resolvidas
  (`— nenhum —` desligando a descoberta automática, campo escondido que não
  some do YAML, release inicial por tag assinada).
