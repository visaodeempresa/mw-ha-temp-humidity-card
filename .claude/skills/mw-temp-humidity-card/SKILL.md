---
name: mw-temp-humidity-card
description: Trabalhar no custom:mw-temp-humidity-card (card de temperatura + umidade do HA, duas metades coloridas por faixa, uma bateria e rodapé técnico). Use ao mexer nas faixas de cor, na escala canônica de clima (mw-climate-scale, regra global 40), no contraste do texto, no rodapé de protocolo/RSSI/LQI/roteador, nos selects do editor, ou quando o dono disser "o card de temperatura", "a cor está saltando", "o número sumiu no fundo", "a cor não bate com o button-card" ou "o HACS não mostra versão nova".
---

# mw-temp-humidity-card — fábrica

Arquivo único `dist/mw-temp-humidity-card.js` (fonte **e** artefato, sem build).
JS puro + `<ha-form>`. HACS tipo Dashboard.
Regras da família: `IA/rules/projects/mw-ha-cards.md` · ADR 0002 (por que cada
card é autocontido).

## Anatomia

- `DEFAULTS` — toda propriedade nasce aqui; o editor tira do YAML o que for
  igual ao default.
- **Bloco `mw-climate-scale v1`** — a escala canônica (19 faixas de
  temperatura, 101 de umidade, alfa 0,50), **embutida** de
  `IA/lib/mw-climate-scale/`. É o padrão (`color_scale: mw`, regra global 40).
  Editar na lib e rodar `IA/tools/check-embeds.sh --fix`; editar aqui dentro
  quebra o check.
- `bandColor(v, scale, blend)` — `scale` é `{stops, colors, clamp}`: N limites
  → N+1 cores, serve para a canônica e para a livre. Com `blend`, interpola
  entre as **âncoras** (centro de cada faixa), não entre os limites: é isso
  que evita o salto de cor a cada 0,1 °C.
- `SCALE_AWARE` — defaults que dependem da escala (`blend`, `gradient`:
  desligados na canônica, ligados na livre). **Card e editor leem a mesma
  tabela** via `resolvedDefault()`; se divergirem, o interruptor volta sozinho
  ao ser mexido, porque o `_onChange` tira do YAML o que for igual ao default.
- `isLight(color)` — luminância relativa sRGB; só vale para cor **opaca**. Na
  escala canônica (translúcida) o texto segue `var(--primary-text-color)` —
  `text_mode`: `auto` | `theme` | `contrast` | `fixed`.
- `sensorsOf` / `deviceSensors` / `autoBattery` — descoberta em cascata
  (dispositivo → grandeza → sufixo do nome → todos). Nenhuma pode devolver
  lista vazia. `autoBattery` corta o sufixo da grandeza antes de tentar
  `_bateria`/`_battery` (`sensor.x_temperatura` → `sensor.x_bateria`).
- `_render()` — colunas `i1 v1 b v2 i2` (bateria e ícones opcionais), linha do
  nome e linha do rodapé abrindo/fechando a grade; o fundo são dois
  `linear-gradient` empilhados (vidro + metades).
- `_schema()` — campos de topo + seis seções `{ name: "", type: "expandable" }`.
  **`name` vazio é obrigatório**, senão o `ha-form` aninha o `data`.

## Fluxo

`feature/** → develop → release → main`; merge na `main` tocando `dist/**`
dispara o auto-release → tag → Release → HACS avisa. **Merge é do dono.**

## Verificação

```bash
node --check dist/mw-temp-humidity-card.js
node tools/probe.js                       # 47 verificações, card + editor
/Volumes/SSD-T1-01/CLAUDE-SSD/IA/tools/check-embeds.sh   # bloco da escala
curl -s http://192.168.1.71:8123/hacsfiles/mw-ha-temp-humidity-card/mw-temp-humidity-card.js \
  | grep -o '%c [0-9.]*'
git log -1 --pretty='%G? %an'
```

Para conferir cor **na tela** sem HA: `memoria-ia/harness/` (gitignored) —
página com stubs de `ha-card`/`ha-icon` que desenha o card e compara a tira da
escala com a transcrição literal do template, cor a cor por
`getComputedStyle`. Não substitui a conferência no HA de verdade.

Conferência **de tela** é do dono (regra global 30).

## Armadilhas (com sintoma)

| Sintoma | Causa | Correção |
|---|---|---|
| Cor "piscando" com variação mínima | faixa seca (padrão da canônica), ou interpolação feita entre limites em vez de âncoras | `blend: true`, e manter a interpolação por âncora |
| Número some numa das metades | `text_mode: contrast` sobre cor translúcida — a luminância só existe depois da composição | `text_mode: auto` |
| Interruptor (blend/vidro) volta sozinho ao ser desligado | comparação com `DEFAULTS` em vez de `resolvedDefault()` no `_onChange` | as duas pontas têm de ler o `SCALE_AWARE` |
| Umidade pisca preto perto do inteiro | vão morto `(n.99, n+1)` do template original | a lib fecha o vão; não "consertar" copiando o YAML de volta |
| Card mais claro que o button-card ao lado | vidro (`gradient`) ligado por cima da escala translúcida | `gradient: false` — é o padrão na canônica |
| Metade sempre cinza | entidade não configurada ou estado não numérico | o cinza é `color_unavailable`, não bug |
| Bateria não encontrada sozinha | nome do sensor não segue o do sensor de grandeza | escolher no editor; `autoBattery` corta o sufixo, mas não adivinha tudo |
| Campo do rodapé some do YAML | `_onChange` só vê o que está no `ha-form`; os selects do rodapé são condicionais | o loop de preservação existe por isso |
| Seções do editor sumiram / config aninhada | `expandable` com `name` preenchido | usar `name: ""` |
| Repositório novo, zero releases | o primeiro push do repo não cria execução | v0.1.0 por tag assinada |
| HACS não vê a release nova | `available_version` em cache | `hacs/repository/download` com `version="vX.Y.Z"` |
| `curl` novo, tela velha | `.js.gz` antigo (deploy manual) | subir `.js` **e** `.js.gz` |
