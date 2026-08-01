---
name: mw-temp-humidity-card
description: Trabalhar no custom:mw-temp-humidity-card (card de temperatura + umidade do HA, duas metades coloridas por faixa, uma bateria e rodapé técnico). Use ao mexer nas faixas de cor, no contraste do texto, no rodapé de protocolo/RSSI/LQI/roteador, nos selects do editor, ou quando o dono disser "o card de temperatura", "a cor está saltando", "o número sumiu no fundo" ou "o HACS não mostra versão nova".
---

# mw-temp-humidity-card — fábrica

Arquivo único `dist/mw-temp-humidity-card.js` (fonte **e** artefato, sem build).
JS puro + `<ha-form>`. HACS tipo Dashboard.
Regras da família: `IA/rules/projects/mw-ha-cards.md` · ADR 0002 (por que cada
card é autocontido).

## Anatomia

- `DEFAULTS` — toda propriedade nasce aqui; o editor tira do YAML o que for
  igual ao default.
- `bandColor(v, stops, colors, blend)` — 4 limites → 5 faixas. Com `blend`,
  interpola entre as **âncoras** (centro de cada faixa), não entre os limites:
  é isso que evita o salto de cor a cada 0,1 °C.
- `isLight(color)` — luminância relativa sRGB; decide texto escuro/claro por
  metade. `text_auto_contrast: false` volta tudo para a cor clara.
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
node tools/probe.js                       # 32 verificações, card + editor
curl -s http://192.168.1.71:8123/hacsfiles/mw-ha-temp-humidity-card/mw-temp-humidity-card.js \
  | grep -o '%c [0-9.]*'
git log -1 --pretty='%G? %an'
```

Conferência **de tela** é do dono (regra global 30).

## Armadilhas (com sintoma)

| Sintoma | Causa | Correção |
|---|---|---|
| Cor "piscando" com variação mínima | `blend: false`, ou interpolação feita entre limites em vez de âncoras | manter a interpolação por âncora |
| Número some numa das metades | contraste automático desligado, ou cor fixa | `text_auto_contrast: true` |
| Metade sempre cinza | entidade não configurada ou estado não numérico | o cinza é `color_unavailable`, não bug |
| Bateria não encontrada sozinha | nome do sensor não segue o do sensor de grandeza | escolher no editor; `autoBattery` corta o sufixo, mas não adivinha tudo |
| Campo do rodapé some do YAML | `_onChange` só vê o que está no `ha-form`; os selects do rodapé são condicionais | o loop de preservação existe por isso |
| Seções do editor sumiram / config aninhada | `expandable` com `name` preenchido | usar `name: ""` |
| Repositório novo, zero releases | o primeiro push do repo não cria execução | v0.1.0 por tag assinada |
| HACS não vê a release nova | `available_version` em cache | `hacs/repository/download` com `version="vX.Y.Z"` |
| `curl` novo, tela velha | `.js.gz` antigo (deploy manual) | subir `.js` **e** `.js.gz` |
