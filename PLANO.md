# Plano — mw-ha-temp-humidity-card

Card de temperatura + umidade: **dois sensores, uma bateria**, cada metade
pintando pela sua faixa de cor. Fábrica de cards MW (arquivo único, sem build;
editor `<ha-form>`; HACS tipo Dashboard).

**Componente separado** — como os irmãos, nada de código compartilhado
(ADR 0002 na área de IA).

## Entrega 1 — v0.1.0 (fechada)

- [x] Card `custom:mw-temp-humidity-card`: grade `i1 v1 b v2 i2`, nome acima,
      rodapé técnico abaixo.
- [x] Duas metades: fundo esquerdo pela faixa de temperatura, direito pela de
      umidade, com costura ajustável (`seam_blend`).
- [x] Cinco faixas por grandeza, com limites e cores configuráveis, e degradê
      entre elas (`blend`).
- [x] Contraste automático do texto pela luminância de cada metade.
- [x] Uma bateria só, com descoberta automática e flag para ocultar.
- [x] Rodapé técnico com quatro flags independentes: protocolo (7 opções),
      RSSI, LQI e roteador (HA · ZBT-2 · ZWA-2 · X5 · outro com sigla).
- [x] Editor: dispositivo → temperatura/umidade/bateria/RSSI/LQI filtrados.
- [x] `tap_action: auto` — cada pedaço abre o more-info do seu sensor.
- [x] Probe headless (32 verificações) no CI.
- [x] DevOps `feature/** → develop → release → main` + auto-release.

## Próximas (só com pedido do dono)

- [ ] Sensação térmica / ponto de orvalho calculado a partir dos dois.
- [ ] Seta de tendência (subindo/descendo) por comparação com o histórico.
- [ ] Terceiro sensor opcional no rodapé (CO₂, PM2.5) — o hardware do dono já
      tem qualidade do ar.
- [ ] Faixa de conforto desenhada como marca no card (mini-escala).
- [ ] Modo compacto de uma linha só (sem nome, sem rodapé) para grades densas.

## Regras deste repositório

- Nunca commitar direto na `main`; merge é do dono.
- Versão no banner `console.info` não se mexe à mão — quem sobe é o workflow.
- Um lote de trabalho = uma branch nova.
- `memoria-ia/` é ignorada pelo git.
