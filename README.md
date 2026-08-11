<!-- MW-BRAND:BEGIN — gerado por IA/tools/mw-brand.sh · não editar à mão -->
<p align="center">
  <a href="https://github.com/visaodeempresa">
    <img src="docs/brand/logo.png" alt="Visão de Empresa — MAYCON WILLIAN OLIVEIRA" width="96">
  </a>
  <br>
  <sub><b>Visão de Empresa</b> · componente de Home Assistant por MAYCON WILLIAN OLIVEIRA</sub>
</p>
<!-- MW-BRAND:END -->

# MW Temperature / Humidity Card

[![CI](https://github.com/visaodeempresa/mw-ha-temp-humidity-card/actions/workflows/ci.yml/badge.svg)](https://github.com/visaodeempresa/mw-ha-temp-humidity-card/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/visaodeempresa/mw-ha-temp-humidity-card?sort=semver)](https://github.com/visaodeempresa/mw-ha-temp-humidity-card/releases)
[![HACS](https://img.shields.io/badge/HACS-Dashboard-41BDF5.svg)](https://hacs.xyz)

Card do Lovelace para **temperatura e umidade**: dois sensores, **uma** bateria.

```
┌───────────────────────────────────────┐
│              SALA DE TV               │
│  🌡 23,4 °C     🔋45%      58 % 💧     │
│         zigbee · -62 dBm · ⌂ ZBT-2    │
└───────────────────────────────────────┘
   └── cor pela temperatura ──┴── cor pela umidade ──┘
```

A **metade esquerda** pinta pela faixa de temperatura, a **direita** pela faixa
de umidade — na **escala canônica da casa**, a mesma dos `custom:button-card`
dos dashboards (19 faixas de temperatura, 101 de umidade). Arquivo único, sem
build: `dist/mw-temp-humidity-card.js` é fonte e artefato. JS puro +
`<ha-form>`, sem dependências.

## Parentesco (e independência)

Mesma família do
[door-window](https://github.com/visaodeempresa/mw-ha-door-window-card) e do
[occupancy-motion](https://github.com/visaodeempresa/mw-ha-occupancy-motion-card),
e como eles: **código próprio, nada compartilhado**. Aqui a diferença é
estrutural — dois sensores no mesmo card, uma bateria só, e cor **contínua por
faixa** em vez de duas cores de estado.

## Instalação

### HACS (recomendado)

1. HACS → **⋮** → **Repositórios personalizados**
2. URL: `https://github.com/visaodeempresa/mw-ha-temp-humidity-card` ·
   Categoria: **Dashboard**
3. Instalar **MW Temperature / Humidity Card** e recarregar a página (⌘⇧R).

### Manual

`dist/mw-temp-humidity-card.js` em `/config/www/` e o recurso
`/local/mw-temp-humidity-card.js` (Módulo JavaScript) em
**Configurações → Painéis → ⋮ → Recursos**.

## Uso mínimo

```yaml
type: custom:mw-temp-humidity-card
temp_entity: sensor.t_h_lux_da_sala_temperatura
hum_entity: sensor.t_h_lux_da_sala_umidade
```

A bateria é descoberta pelo dispositivo dos sensores; o nome sai do
`friendly_name` **sem a grandeza** (`Sala Temperatura` → `Sala`); as unidades
vêm das próprias entidades.

Um sensor só também funciona: informe apenas `temp_entity` **ou** `hum_entity`
— o outro lado mostra `—` com o fundo neutro.

## Editor visual

| Campo | O que faz |
|---|---|
| **Dispositivo** | Lista só os dispositivos que têm temperatura e/ou umidade. |
| **Sensor de temperatura / de umidade** | Filtrados pelo dispositivo. Sem dispositivo, todos os da grandeza; em último caso, todos os sensores. |
| **Sensor de bateria** | Só aparece com a bateria ligada. Lista os sensores do dispositivo; **— nenhum —** limpa **e** desliga a descoberta automática. |
| **Rodapé técnico** | Quatro flags independentes — protocolo, RSSI, LQI e roteador. Cada um revela o seu campo só quando ligado. |

> Você pediu "mais dois flags"; entreguei **quatro independentes** — dá para
> mostrar só o roteador, ou só o RSSI, sem carregar o resto junto.

Trocar de dispositivo limpa o que era do antigo e já seleciona a temperatura e
a umidade do novo. O editor **não grava defaults no YAML**.

## Propriedades

### Entidades

| Propriedade | Tipo | Padrão | Descrição |
|---|---|---|---|
| `temp_entity` | string | `""` | Sensor de temperatura (ao menos um dos dois é obrigatório). |
| `hum_entity` | string | `""` | Sensor de umidade. |
| `device` | string | `""` | ID do dispositivo; só o editor usa, para filtrar. |
| `battery_entity` | string | `""` | Vazio = descoberta automática. |
| `battery_auto` | bool | `true` | Procurar a bateria no mesmo dispositivo (ou por nome parecido). |
| `rssi_entity` / `lqi_entity` | string | `""` | Sensores do rodapé técnico. |

### Conteúdo e rodapé

| Propriedade | Tipo | Padrão | Descrição |
|---|---|---|---|
| `name` | string | `""` | Vazio = nome do sensor sem a grandeza. |
| `show_name` / `show_icons` / `show_battery` | bool | `true` | O que desenhar. |
| `show_protocol` / `show_rssi` / `show_lqi` / `show_router` | bool | `false` | Ligam o rodapé técnico (item a item). |
| `protocol` | `none` \| `zigbee` \| `zwave` \| `wifi` \| `bluetooth` \| `thread` \| `matter` | `none` | Ícone do protocolo. |
| `router` | `none` \| `HA` \| `ZBT-2` \| `ZWA-2` \| `X5` \| `other` | `none` | Roteador/coordenador. |
| `router_label` | string | `""` | Sigla livre quando `router: other`. |
| `icon_temp` / `icon_hum` | ícone | `mdi:thermometer` / `mdi:water-percent` | Ícones das pontas. |
| `icon_unavailable` | ícone | `mdi:help-rhombus-outline` | Ponta sem leitura. |
| `temp_decimals` / `hum_decimals` | número | `1` / `0` | Casas decimais. |

### Faixas de cor

| Propriedade | Padrão | Descrição |
|---|---|---|
| `color_scale` | `mw` | `mw` = escala canônica da casa · `custom` = as cinco faixas livres. |
| `scale_alpha` | `0.5` | Opacidade das cores da escala canônica (0..1). |
| `blend` | pela escala | Degradê entre as faixas. Padrão: **desligado** na `mw`, ligado na `custom`. |
| `seam_blend` | `10` | % de transição no meio do card. `0` = corte seco no meio. |
| `color_unavailable` | `rgba(120,120,120,0.6)` | Metade sem leitura. |
| `temp_stop_1..4` | `16`, `20`, `24`, `28` | *(só na `custom`)* limites das 5 faixas de temperatura (°C). |
| `hum_stop_1..4` | `30`, `40`, `60`, `70` | *(só na `custom`)* limites das 5 faixas de umidade (%). |
| `color_temp_1..5` | `#3d7ebf` `#4aa3c7` `#4caf50` `#f2a33c` `#e4572e` | *(só na `custom`)* frio → conforto → quente. |
| `color_hum_1..5` | `#d99a3f` `#d9c14f` `#4caf50` `#47a8c9` `#2f7fb5` | *(só na `custom`)* seco → conforto → úmido. |

#### Escala canônica (`color_scale: mw`, o padrão)

É a tabela dos templates `temp_sensor_style` / `umid_sensor_style` usados nos
`custom:button-card` da casa: **19 faixas** de temperatura (mais estreitas
entre 19 e 27 °C, que é onde a casa vive) e **101 faixas** de umidade, uma por
ponto percentual. As cores nascem com alfa `0.50` — são compostas com o fundo
do card, e é por isso que o texto segue a cor do tema.

Não é enfeite: 23 °C tem de ser a mesma cor neste card, no button-card ao lado
e na planta baixa, senão o morador lê o número em vez de bater o olho.

O padrão nesta escala é **faixa seca e fundo chapado** (`blend` e `gradient`
desligados), para o card ficar idêntico ao button-card. Ligar o `blend`
interpola entre as faixas: fica mais bonito e a fronteira dos 40 % e 60 % de
umidade some.

#### Escala livre (`color_scale: custom`)

Cinco faixas por grandeza, limites e cores à sua escolha — para o caso em que
a escala da casa não serve (adega, estufa, geladeira). YAML anterior à escala
canônica que já mexia em `color_temp_*`, `color_hum_*`, `temp_stop_*` ou
`hum_stop_*` **continua na escala livre sozinho**: quem ajustou cor na mão não
acorda com outra escala.

### Texto, tamanhos e efeitos

`text_mode` decide a cor do texto:

| Valor | O que faz |
|---|---|
| `auto` *(padrão)* | Cor do tema na escala canônica; contraste por luminância na livre. |
| `theme` | Sempre `var(--primary-text-color)`. |
| `contrast` | Escolhe entre `color_text_dark` (`#1a1a1a`) e `color_text_light` (`#ffffff`) pela luminância do fundo daquela metade. |
| `fixed` | Sempre a cor clara. |

Contraste por luminância só funciona com cor **opaca**: a escala canônica é
translúcida, e a luminância que vale só existe depois da composição com o
fundo do card — que muda com o tema claro/escuro. Por isso o padrão ali é
seguir o tema, como fazem os button-cards. `text_auto_contrast: false` (chave
antiga) continua valendo como `text_mode: fixed`.

Tamanhos (px): `icon_size` 22 · `value_size` 18 · `name_size` 10 ·
`battery_size` 12 · `battery_icon_size` 18 · `foot_size` 10 ·
`border_radius` 10 · `padding` 6 · `gap` 4 · `height` `""` (automática).
Efeitos: `gradient` / `shadow` / `lift` (`true`).
Cores de texto: `color_name`, `color_foot`, `color_battery_text`.

### Bateria

`battery_show_percent` (`true`), `battery_rotate` (`false`), limites
`battery_low` 20 / `battery_medium` 50 / `battery_high` 70 e as cores
`color_battery_low` `#e53935` · `medium` `#fdd835` · `high` `#9ccc65` ·
`full` `#43a047`. Sem leitura vira `--%` com `mdi:battery-unknown`.

### Ações

`tap_action` padrão **`auto`**: cada pedaço abre o *more-info* do seu próprio
sensor — toque na temperatura, na umidade ou na bateria. Trocando para
`more-info`, `navigate`, `url` ou `none`, o card inteiro passa a ter uma ação
só. `hold_action` (500 ms) aceita os mesmos valores, com `navigation_path` e
`url_path`.

## Exemplos

### 1. Sala, o básico

```yaml
type: custom:mw-temp-humidity-card
temp_entity: sensor.t_h_lux_da_sala_temperatura
hum_entity: sensor.t_h_lux_da_sala_umidade
name: SALA
```

### 2. Com rodapé técnico completo

```yaml
type: custom:mw-temp-humidity-card
temp_entity: sensor.qualidade_do_ar_da_cozinha_temperatura
hum_entity: sensor.qualidade_do_ar_da_cozinha_umidade
name: COZINHA
show_protocol: true
protocol: zigbee
show_rssi: true
rssi_entity: sensor.qualidade_do_ar_da_cozinha_rssi
show_lqi: true
lqi_entity: sensor.qualidade_do_ar_da_cozinha_lqi
show_router: true
router: ZBT-2
```

### 3. Corte seco no meio e sem bateria (sensor alimentado por tomada)

```yaml
type: custom:mw-temp-humidity-card
temp_entity: sensor.organizar_qualidade_do_ar_do_escritorio_temperatura
hum_entity: sensor.organizar_qualidade_do_ar_do_escritorio_umidade
name: ESCRITÓRIO
show_battery: false
seam_blend: 0
```

### 4. Faixas próprias (adega: frio e úmido é o certo)

```yaml
type: custom:mw-temp-humidity-card
temp_entity: sensor.adega_temperatura
hum_entity: sensor.adega_umidade
name: ADEGA
color_scale: custom
temp_stop_1: 10
temp_stop_2: 12
temp_stop_3: 14
temp_stop_4: 16
hum_stop_1: 50
hum_stop_2: 60
hum_stop_3: 75
hum_stop_4: 80
```

Mais exemplos em [`examples/`](examples/).

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "Custom element doesn't exist" | recurso não carregado | ⌘⇧R (o `?hacstag=` é fixo por versão). |
| Um lado mostra `—` | entidade não configurada ou sem número | Escolha o sensor no editor. |
| Número ilegível numa das metades | modo de texto errado para a escala | `text_mode: auto` (tema na canônica, contraste na livre). |
| Cores "saltando" a cada 0,1 °C | faixa seca (padrão da canônica) | `blend: true` — ao custo de borrar as fronteiras. |
| Card mais claro que o button-card ao lado | vidro ligado por cima da escala | `gradient: false` (é o padrão na escala canônica). |
| Cores diferentes do resto do dashboard | escala livre ligada por YAML antigo | `color_scale: mw`, e apague `color_temp_*` / `temp_stop_*`. |
| Bateria em `--%` | sensor não encontrado | Escolha no editor, ou `show_battery: false`. |
| HACS não mostra versão nova | commit ainda não chegou na `main` | O release só sai no merge para a `main`. |

## Desenvolvimento (DevOps)

```
feature/<assunto> ──PR──► develop ──PR──► release ──PR──► main ──► auto-release ──► HACS
```

```bash
node --check dist/mw-temp-humidity-card.js && node tools/probe.js
```

O probe instancia card e editor fora do navegador (47 verificações: grade,
escala canônica e livre, rodapé, filtros do editor, defaults fora do YAML).

O bloco da escala canônica é **embutido** a partir de
`IA/lib/mw-climate-scale/`: editar lá e rodar `IA/tools/check-embeds.sh --fix`,
nunca o contrário.

Commits em inglês, assinados (GPG), autoria
`MAYCON WILLIAN OLIVEIRA <visaodeempresa@gmail.com>`.

## Licença

MIT © MAYCON WILLIAN OLIVEIRA
