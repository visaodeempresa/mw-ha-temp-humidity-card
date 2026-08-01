/* Probe headless — instancia o card e o editor fora do navegador.
 * Pega erro de template, grade quebrada, faixa de cor errada e campo sumido
 * do editor sem depender do HA. Roda no CI:  node tools/probe.js
 */
"use strict";
const fs = require("fs");
const path = require("path");

const stub = {
  style: {}, dataset: {},
  addEventListener() {}, appendChild() {}, querySelector() { return stub; },
  querySelectorAll() { return []; }, dispatchEvent() {},
};
global.HTMLElement = class {
  constructor() { this.children = []; }
  attachShadow() {
    this.shadowRoot = {
      innerHTML: "",
      querySelector: () => stub,
      querySelectorAll: () => [],
    };
    return this.shadowRoot;
  }
  appendChild(el) { this.children.push(el); return el; }
  dispatchEvent() {}
  addEventListener() {}
};
const reg = {};
global.customElements = { define: (n, c) => (reg[n] = c) };
global.document = {
  createElement: () => ({
    style: { cssText: "" }, dataset: {},
    addEventListener() {}, appendChild() {}, dispatchEvent() {},
    querySelector: () => stub, querySelectorAll: () => [],
  }),
};
global.window = {};
global.CustomEvent = class { constructor(t, d) { this.type = t; Object.assign(this, d); } };
console.info = () => {};

eval(fs.readFileSync(path.join(__dirname, "..", "dist", "mw-temp-humidity-card.js"), "utf8"));

const S = (state, attrs) => ({ state: String(state), attributes: attrs });
const hass = {
  states: {
    "sensor.sala_temperatura": S(23.4, { device_class: "temperature", unit_of_measurement: "°C", friendly_name: "Sala Temperatura" }),
    "sensor.sala_umidade": S(58, { device_class: "humidity", unit_of_measurement: "%", friendly_name: "Sala Umidade" }),
    "sensor.sala_bateria": S(45, { device_class: "battery", unit_of_measurement: "%", friendly_name: "Sala Bateria" }),
    "sensor.sala_rssi": S(-62, { device_class: "signal_strength", unit_of_measurement: "dBm", friendly_name: "Sala RSSI" }),
    "sensor.sala_lqi": S(108, { friendly_name: "Sala LQI" }),
    "sensor.quarto_temperatura": S(15, { device_class: "temperature", unit_of_measurement: "°C", friendly_name: "Quarto Temperatura" }),
    "sensor.quarto_umidade": S(82, { device_class: "humidity", unit_of_measurement: "%", friendly_name: "Quarto Umidade" }),
  },
  entities: {
    "sensor.sala_temperatura": { device_id: "dev1" },
    "sensor.sala_umidade": { device_id: "dev1" },
    "sensor.sala_bateria": { device_id: "dev1" },
    "sensor.sala_rssi": { device_id: "dev1" },
    "sensor.sala_lqi": { device_id: "dev1" },
    "sensor.quarto_temperatura": { device_id: "dev2" },
    "sensor.quarto_umidade": { device_id: "dev2" },
  },
  devices: { dev1: { name: "Sensor da sala", area_id: "a1" }, dev2: { name: "Sensor do quarto" } },
  areas: { a1: { name: "Sala" } },
  locale: { language: "pt-BR" },
  callService() {},
};

let fails = 0;
const check = (label, cond, extra = "") => {
  if (cond) { console.log(`  ok   ${label}`); return; }
  fails += 1;
  console.log(`  FAIL ${label}${extra ? " — " + extra : ""}`);
};
const mk = (cfg) => {
  const el = new reg["mw-temp-humidity-card"]();
  el.setConfig(cfg);
  el.hass = hass;
  return el.shadowRoot.innerHTML;
};

const base = { temp_entity: "sensor.sala_temperatura", hum_entity: "sensor.sala_umidade" };

console.log("card:");
const html = mk(base);
check("grade i1 v1 b v2 i2", /grid-template-areas:.*"i1 v1 b v2 i2"/.test(html), html.slice(0, 260));
check("temperatura com 1 casa (pt-BR)", html.includes(">23,4<"));
check("umidade sem casa decimal", html.includes(">58<"));
check("unidades das próprias entidades", html.includes(">°C<") && html.includes(">%<"));
check("bateria automática pelo dispositivo", html.includes("45%") && html.includes("mdi:battery-40"));
check("duas metades no fundo", /linear-gradient\(90deg, rgba?\([^)]*\)[^,]*, rgba?\(/.test(html) ||
  html.includes("linear-gradient(90deg,"), html.slice(0, 200));
check("nome sem a grandeza", html.includes(">Sala<"));
check("ícones das pontas", html.includes("mdi:thermometer") && html.includes("mdi:water-percent"));
check("sem rodapé por padrão", !html.includes('class="foot"'));

// 23,4 °C cai entre a faixa 3 (conforto) e a 4 → com blend, cor interpolada
const frio = mk({ ...base, temp_entity: "sensor.quarto_temperatura", blend: false });
check("blend desligado usa a cor seca da faixa", frio.includes("#3d7ebf"), frio.slice(0, 200));
const quente = mk({ ...base, temp_entity: "sensor.quarto_temperatura", hum_entity: "sensor.quarto_umidade", blend: false });
check("umidade 82% cai na faixa 5", quente.includes("#2f7fb5"));

const semBat = mk({ ...base, show_battery: false });
check("grade sem bateria", /grid-template-areas:.*"i1 v1 v2 i2"/.test(semBat) && !semBat.includes("mdi:battery"));

const foot = mk({ ...base, show_protocol: true, protocol: "zigbee", show_rssi: true,
  rssi_entity: "sensor.sala_rssi", show_lqi: true, lqi_entity: "sensor.sala_lqi",
  show_router: true, router: "ZBT-2" });
check("rodapé com protocolo", foot.includes("mdi:zigbee"));
check("rodapé com RSSI e unidade", foot.includes("-62 dBm"));
check("rodapé com LQI", foot.includes("LQI 108"));
check("rodapé com roteador", foot.includes("ZBT-2") && foot.includes("mdi:router-wireless"));
check("linha do rodapé na grade", /grid-template-areas:.*"f f f f f"/.test(foot));

const outro = mk({ ...base, show_router: true, router: "other", router_label: "SLZB-06" });
check("roteador «outro» usa a sigla informada", outro.includes("SLZB-06"));

const semLeitura = mk({ temp_entity: "sensor.nao_existe", hum_entity: "sensor.sala_umidade" });
check("sem leitura não quebra", semLeitura.includes(">—<") && semLeitura.includes("mdi:help-rhombus-outline"));

const contraste = mk({ ...base, temp_entity: "sensor.quarto_temperatura" });
check("texto claro sobre o azul frio", contraste.includes("#ffffff"));

let threw = false;
try { new reg["mw-temp-humidity-card"]().setConfig({}); } catch (e) { threw = true; }
check("setConfig sem sensor nenhum falha", threw);

console.log("editor:");
const ed = new reg["mw-temp-humidity-card-editor"]();
ed.hass = hass;
ed.setConfig({ ...base, device: "dev1" });
let schema = ed._schema();
const byName = (s, n) => s.find((f) => f.name === n);
const opts = (s, n) => byName(s, n)?.selector?.select?.options?.map((o) => o.value);
check("select de dispositivo", opts(schema, "device")?.length === 2);
check("temperatura filtrada pelo dispositivo",
  JSON.stringify(opts(schema, "temp_entity")) === JSON.stringify(["sensor.sala_temperatura"]),
  JSON.stringify(opts(schema, "temp_entity")));
check("umidade filtrada pelo dispositivo",
  JSON.stringify(opts(schema, "hum_entity")) === JSON.stringify(["sensor.sala_umidade"]));
check("bateria lista os sensores do dispositivo", opts(schema, "battery_entity")[0] === "__none__" &&
  opts(schema, "battery_entity").includes("sensor.sala_bateria"));
check("seções expansíveis", schema.filter((f) => f.type === "expandable").length === 6);

const foco = (cfg) => { const e = new reg["mw-temp-humidity-card-editor"](); e.hass = hass; e.setConfig(cfg);
  return e._schema().find((f) => f.type === "expandable" && /Rodapé/.test(f.title)).schema; };
check("RSSI escondido enquanto o flag está desligado", !byName(foco(base), "rssi_entity"));
check("flag ligado revela o select de RSSI", !!byName(foco({ ...base, show_rssi: true }), "rssi_entity"));
check("sigla só aparece com roteador «outro»",
  !byName(foco({ ...base, show_router: true, router: "ZBT-2" }), "router_label") &&
  !!byName(foco({ ...base, show_router: true, router: "other" }), "router_label"));
const semBatEd = new reg["mw-temp-humidity-card-editor"]();
semBatEd.hass = hass;
semBatEd.setConfig({ ...base, show_battery: false });
check("show_battery=false esconde bateria/auto",
  !byName(semBatEd._schema(), "battery_entity") && !byName(semBatEd._schema(), "battery_auto"));

const edAll = new reg["mw-temp-humidity-card-editor"]();
edAll.hass = hass;
edAll.setConfig(base);
const captured = [];
edAll.dispatchEvent = (ev) => captured.push(ev.detail.config);
edAll._onChange({
  stopPropagation() {},
  detail: { value: { ...base, padding: 6, value_size: 22, battery_entity: "__none__", height: null } },
});
const out = captured[0];
check("defaults fora do YAML", JSON.stringify(out) === JSON.stringify(
  { temp_entity: base.temp_entity, hum_entity: base.hum_entity, value_size: 22, battery_auto: false }),
  JSON.stringify(out));

const edKeep = new reg["mw-temp-humidity-card-editor"]();
edKeep.hass = hass;
edKeep.setConfig({ ...base, rssi_entity: "sensor.sala_rssi" });
const kept = [];
edKeep.dispatchEvent = (ev) => kept.push(ev.detail.config);
edKeep._onChange({ stopPropagation() {}, detail: { value: { ...base } } });
check("chave fora do formulário continua no YAML", kept[0].rssi_entity === "sensor.sala_rssi",
  JSON.stringify(kept[0]));

console.log(fails ? `\n${fails} verificação(ões) falharam` : "\ntudo ok");
process.exit(fails ? 1 : 0);
