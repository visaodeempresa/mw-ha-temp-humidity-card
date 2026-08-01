# Histórico — mw-ha-temp-humidity-card

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
