/* mw-ha-temp-humidity-card — custom:mw-temp-humidity-card
 * Card de temperatura + umidade: dois sensores, uma bateria.
 * 🌡️ 23,4 °C  🔋 45%  60 % 💧 — a metade esquerda pinta pela temperatura,
 * a direita pela umidade, cada uma na sua faixa de cores.
 * Rodapé técnico opcional: protocolo, RSSI, LQI e roteador.
 * Da mesma família do mw-ha-door-window-card e do mw-ha-occupancy-motion-card,
 * e como eles: código próprio, nada compartilhado (ADR 0002).
 * JS puro + <ha-form>, arquivo único, sem build.
 * Repo: https://github.com/visaodeempresa/mw-ha-temp-humidity-card
 * Releases automáticas: merge na main → bump semântico → tag → HACS.
 */
(() => {
  "use strict";

  const DEFAULTS = {
    // --- entidades ---
    device: "",
    temp_entity: "",
    hum_entity: "",
    battery_entity: "",
    battery_auto: true,
    rssi_entity: "",
    lqi_entity: "",
    // --- conteúdo ---
    name: "",
    show_name: true,
    show_icons: true,
    show_battery: true,
    show_protocol: false,
    show_rssi: false,
    show_lqi: false,
    show_router: false,
    icon_temp: "mdi:thermometer",
    icon_hum: "mdi:water-percent",
    icon_unavailable: "mdi:help-rhombus-outline",
    protocol: "none",          // none | wifi | zigbee | bluetooth | zwave | thread | matter
    router: "none",            // none | HA | ZBT-2 | ZWA-2 | X5 | other
    router_label: "",          // sigla livre quando router = other
    temp_decimals: 1,
    hum_decimals: 0,
    // --- faixas de cor ---
    blend: true,               // degradê entre as faixas (false = faixas secas)
    seam_blend: 10,            // % de transição no meio do card (0 = corte seco)
    temp_stop_1: 16, temp_stop_2: 20, temp_stop_3: 24, temp_stop_4: 28,
    color_temp_1: "#3d7ebf",   // frio
    color_temp_2: "#4aa3c7",
    color_temp_3: "#4caf50",   // conforto
    color_temp_4: "#f2a33c",
    color_temp_5: "#e4572e",   // quente
    hum_stop_1: 30, hum_stop_2: 40, hum_stop_3: 60, hum_stop_4: 70,
    color_hum_1: "#d99a3f",    // seco
    color_hum_2: "#d9c14f",
    color_hum_3: "#4caf50",    // conforto
    color_hum_4: "#47a8c9",
    color_hum_5: "#2f7fb5",    // úmido
    color_unavailable: "rgba(120, 120, 120, 0.6)",
    // --- geometria ---
    icon_size: 22,
    value_size: 18,
    name_size: 10,
    battery_size: 12,
    battery_icon_size: 18,
    foot_size: 10,
    border_radius: 10,
    padding: 6,
    gap: 4,
    height: "",
    // --- efeitos ---
    gradient: true,
    shadow: true,
    lift: true,
    // --- texto ---
    text_auto_contrast: true,
    color_text_dark: "#1a1a1a",
    color_text_light: "#ffffff",
    color_name: "#ffffff",
    color_foot: "rgba(255, 255, 255, 0.85)",
    // --- bateria ---
    battery_show_percent: true,
    battery_rotate: false,
    battery_low: 20,
    battery_medium: 50,
    battery_high: 70,
    color_battery_low: "#e53935",
    color_battery_medium: "#fdd835",
    color_battery_high: "#9ccc65",
    color_battery_full: "#43a047",
    color_battery_text: "#ffffff",
    // --- ações ---
    tap_action: "auto",        // auto = cada metade abre o seu sensor
    hold_action: "none",
    double_tap_action: "none",
    navigation_path: "",
    url_path: "",
  };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const px = (v) => {
    if (v === "" || v === null || v === undefined) return "";
    const s = String(v).trim();
    return /^-?\d+(\.\d+)?$/.test(s) ? `${s}px` : s;
  };

  const PROTOCOLS = {
    wifi: ["mdi:wifi", "Wi-Fi"],
    zigbee: ["mdi:zigbee", "Zigbee"],
    bluetooth: ["mdi:bluetooth", "Bluetooth"],
    zwave: ["mdi:z-wave", "Z-Wave"],
    thread: ["mdi:hexagon-outline", "Thread"],
    matter: ["mdi:vector-triangle", "Matter"],
  };

  const ROUTERS = ["HA", "ZBT-2", "ZWA-2", "X5"];

  /* ---------------------------- cor por faixa ---------------------------- */

  const parseColor = (str) => {
    const s = String(str || "").trim();
    let m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    m = s.match(/^#([0-9a-f]{6})$/i);
    if (m) { const n = parseInt(m[1], 16); return { r: n >> 16, g: (n >> 8) & 255, b: n & 255, a: 1 }; }
    m = s.match(/^#([0-9a-f]{3})$/i);
    if (m) { const [r, g, b] = m[1].split("").map((x) => parseInt(x + x, 16)); return { r, g, b, a: 1 }; }
    return { r: 128, g: 128, b: 128, a: 1 };
  };
  const toHex = ({ r, g, b }) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
  const toRgba = ({ r, g, b, a }) => `rgba(${r}, ${g}, ${b}, ${a})`;
  const mix = (c1, c2, t) => toRgba({
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
    a: +(c1.a + (c2.a - c1.a) * t).toFixed(3),
  });

  // 4 limites → 5 faixas. Com blend, o valor caminha entre as cores âncora
  // (o centro de cada faixa); sem blend, cada faixa é uma cor seca.
  const bandColor = (value, stops, colors, blend) => {
    const v = Number(value);
    if (!Number.isFinite(v)) return null;
    let band = stops.findIndex((s) => v <= s);
    if (band === -1) band = stops.length;
    if (!blend) return colors[band];
    const widths = [];
    for (let i = 1; i < stops.length; i += 1) widths.push(stops[i] - stops[i - 1]);
    const w = widths.length ? widths.reduce((a, b) => a + b, 0) / widths.length : 1;
    // âncora de cada cor: centro da sua faixa (as pontas usam a largura média)
    const anchors = colors.map((_, i) => {
      if (i === 0) return stops[0] - w / 2;
      if (i === colors.length - 1) return stops[stops.length - 1] + w / 2;
      return (stops[i - 1] + stops[i]) / 2;
    });
    if (v <= anchors[0]) return colors[0];
    if (v >= anchors[anchors.length - 1]) return colors[colors.length - 1];
    for (let i = 1; i < anchors.length; i += 1) {
      if (v <= anchors[i]) {
        const t = (v - anchors[i - 1]) / (anchors[i] - anchors[i - 1] || 1);
        return mix(parseColor(colors[i - 1]), parseColor(colors[i]), t);
      }
    }
    return colors[colors.length - 1];
  };

  // luminância relativa (sRGB) — decide texto escuro ou claro sobre a faixa
  const isLight = (color) => {
    const { r, g, b } = parseColor(color);
    const ch = [r, g, b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2] > 0.45;
  };

  const batteryIcon = (v) => {
    if (v >= 95) return "mdi:battery";
    if (v < 5) return "mdi:battery-outline";
    const step = Math.max(10, Math.floor(v / 10) * 10);
    return `mdi:battery-${step}`;
  };

  /* ---------- descoberta de entidades (usada pelo card e pelo editor) ---------- */

  const hasClass = (hass, id, dc) => hass.states[id]?.attributes?.device_class === dc;
  const friendly = (hass, id) => hass.states[id]?.attributes?.friendly_name || id;
  const deviceOf = (hass, id) => hass?.entities?.[id]?.device_id || "";

  const deviceName = (hass, devId) => {
    const d = hass?.devices?.[devId];
    if (!d) return devId;
    const area = d.area_id && hass.areas?.[d.area_id]?.name;
    return (d.name_by_user || d.name || devId) + (area ? ` · ${area}` : "");
  };

  // dispositivos com temperatura E/OU umidade
  const climateDevices = (hass) => {
    if (!hass?.entities || !hass?.devices) return [];
    const ids = new Set();
    for (const id of Object.keys(hass.states)) {
      if (!id.startsWith("sensor.")) continue;
      if (!hasClass(hass, id, "temperature") && !hasClass(hass, id, "humidity")) continue;
      const d = deviceOf(hass, id);
      if (d) ids.add(d);
    }
    return [...ids]
      .map((d) => ({ value: d, label: deviceName(hass, d) }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  };

  // sensores de uma grandeza — do dispositivo escolhido; sem dispositivo, todos
  // daquela grandeza; sem nenhum, todos os sensores. Nunca lista vazia.
  const sensorsOf = (hass, devId, dc) => {
    const all = Object.keys(hass.states).filter((id) => id.startsWith("sensor.") && hasClass(hass, id, dc));
    let list = all;
    if (devId) {
      const own = all.filter((id) => deviceOf(hass, id) === devId);
      if (own.length) list = own;
    }
    if (!list.length) list = Object.keys(hass.states).filter((id) => id.startsWith("sensor."));
    return list
      .map((id) => ({ value: id, label: `${friendly(hass, id)} (${id})` }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  };

  // qualquer sensor do dispositivo (bateria, RSSI, LQI…), com queda por classe
  const deviceSensors = (hass, devId, refEntity, fallbackClass, nameHint) => {
    const dev = devId || deviceOf(hass, refEntity);
    let list = [];
    if (dev && hass.entities) {
      list = Object.keys(hass.entities).filter(
        (id) => hass.entities[id].device_id === dev && id.startsWith("sensor.") && hass.states[id]);
    }
    if (!list.length && fallbackClass) {
      list = Object.keys(hass.states).filter((id) => hasClass(hass, id, fallbackClass));
    }
    if (!list.length && nameHint) {
      list = Object.keys(hass.states).filter((id) => id.startsWith("sensor.") && id.endsWith(nameHint));
    }
    if (!list.length) list = Object.keys(hass.states).filter((id) => id.startsWith("sensor."));
    return list
      .map((id) => ({ value: id, label: `${friendly(hass, id)} (${id})` }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  };

  const autoBattery = (hass, refEntity) => {
    const dev = deviceOf(hass, refEntity);
    if (dev && hass.entities) {
      const found = Object.keys(hass.entities).find(
        (id) => hass.entities[id].device_id === dev && hasClass(hass, id, "battery") && hass.states[id]);
      if (found) return found;
    }
    const base = String(refEntity).split(".")[1] || "";
    // sensor.x_temperatura → tenta sensor.x_bateria, sensor.x_battery, …
    const stem = base.replace(/_(temperatura|temperature|umidade|humidity)$/, "");
    for (const suf of ["_bateria", "_battery", "_battery_level", "_nivel_da_bateria"]) {
      if (hass.states[`sensor.${stem}${suf}`]) return `sensor.${stem}${suf}`;
    }
    return Object.keys(hass.states).find(
      (id) => id.startsWith("sensor.") && hasClass(hass, id, "battery") && id.includes(stem)) || "";
  };

  /* ------------------------------- CARD ------------------------------- */

  class MwTempHumidityCard extends HTMLElement {
    setConfig(config) {
      if (!config || (!config.temp_entity && !config.hum_entity)) {
        throw new Error("mw-temp-humidity-card: defina ao menos 'temp_entity' ou 'hum_entity'");
      }
      this._config = { ...DEFAULTS, ...config };
      this._key = null;
      if (this._hass) this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._config) return;
      const c = this._config;
      const ids = [c.temp_entity, c.hum_entity, this._batteryEntity(), c.rssi_entity, c.lqi_entity];
      const key = ids.map((id) => (id && hass.states[id] ? hass.states[id].state : "·")).join("|");
      if (key !== this._key) { this._key = key; this._render(); }
    }

    getCardSize() { return 1; }

    static getConfigElement() { return document.createElement("mw-temp-humidity-card-editor"); }

    static getStubConfig(hass) {
      const temp = Object.keys(hass?.states || {}).find((id) => hasClass(hass, id, "temperature"));
      if (!temp) return { temp_entity: "", hum_entity: "" };
      const dev = deviceOf(hass, temp);
      const hum = dev
        ? Object.keys(hass.entities || {}).find((id) => hass.entities[id].device_id === dev && hasClass(hass, id, "humidity"))
        : "";
      return { temp_entity: temp, hum_entity: hum || "" };
    }

    _batteryEntity() {
      const c = this._config;
      if (c.battery_entity) return c.battery_entity;
      if (c.battery_auto === false || !this._hass) return "";
      const ref = c.temp_entity || c.hum_entity;
      if (this._autoBat === undefined || this._autoBatFor !== ref) {
        this._autoBatFor = ref;
        this._autoBat = autoBattery(this._hass, ref);
      }
      return this._autoBat;
    }

    _value(entityId, decimals) {
      const st = entityId ? this._hass.states[entityId] : null;
      if (!st) return { text: "—", num: null, unit: "" };
      const n = Number.parseFloat(st.state);
      const unit = st.attributes?.unit_of_measurement || "";
      if (!Number.isFinite(n)) return { text: "—", num: null, unit };
      let text;
      try {
        text = new Intl.NumberFormat(this._hass?.locale?.language || "pt-BR",
          { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
      } catch (e) {
        text = n.toFixed(decimals);
      }
      return { text, num: n, unit };
    }

    _batteryHtml(textColor) {
      const c = this._config;
      const id = this._batteryEntity();
      const v = Number.parseFloat(id ? this._hass.states[id]?.state : NaN);
      const size = px(c.battery_icon_size) || "18px";
      if (!Number.isFinite(v)) {
        return `<span class="bt"><span class="bp">--%</span><ha-icon icon="mdi:battery-unknown"
          style="color:${esc(textColor)};opacity:.75;width:${size};height:${size};--mdc-icon-size:${size};"></ha-icon></span>`;
      }
      const color = v <= c.battery_low ? c.color_battery_low
        : v <= c.battery_medium ? c.color_battery_medium
        : v <= c.battery_high ? c.color_battery_high
        : c.color_battery_full;
      const pct = c.battery_show_percent === false ? "" : `<span class="bp">${Math.round(v)}%</span>`;
      return `<span class="bt">${pct}<ha-icon icon="${esc(batteryIcon(v))}"
        style="color:${esc(color)};width:${size};height:${size};--mdc-icon-size:${size};
        filter:drop-shadow(0 1px 1px rgba(0,0,0,0.30));"></ha-icon></span>`;
    }

    _footHtml() {
      const c = this._config;
      const bits = [];
      if (c.show_protocol && c.protocol && c.protocol !== "none") {
        const p = PROTOCOLS[c.protocol];
        if (p) bits.push(`<ha-icon icon="${esc(p[0])}" title="${esc(p[1])}"></ha-icon>`);
      }
      if (c.show_rssi) {
        const v = this._value(c.rssi_entity, 0);
        bits.push(`<span>${esc(v.text)}${v.unit ? " " + esc(v.unit) : " dBm"}</span>`);
      }
      if (c.show_lqi) {
        const v = this._value(c.lqi_entity, 0);
        bits.push(`<span>LQI ${esc(v.text)}</span>`);
      }
      if (c.show_router) {
        const label = c.router === "other" ? (c.router_label || "?") : c.router;
        if (label && label !== "none") {
          bits.push(`<span class="rt"><ha-icon icon="mdi:router-wireless"></ha-icon>${esc(label)}</span>`);
        }
      }
      return bits.length ? `<div class="foot">${bits.join('<i class="sep">·</i>')}</div>` : "";
    }

    _render() {
      const c = this._config;
      const stops = (p) => [c[`${p}_stop_1`], c[`${p}_stop_2`], c[`${p}_stop_3`], c[`${p}_stop_4`]].map(Number);
      const colors = (p) => [1, 2, 3, 4, 5].map((i) => c[`color_${p}_${i}`]);

      const t = this._value(c.temp_entity, Number(c.temp_decimals) || 0);
      const h = this._value(c.hum_entity, Number(c.hum_decimals) || 0);
      const tempColor = bandColor(t.num, stops("temp"), colors("temp"), c.blend !== false) || c.color_unavailable;
      const humColor = bandColor(h.num, stops("hum"), colors("hum"), c.blend !== false) || c.color_unavailable;

      const auto = c.text_auto_contrast !== false;
      const tText = auto ? (isLight(tempColor) ? c.color_text_dark : c.color_text_light) : c.color_text_light;
      const hText = auto ? (isLight(humColor) ? c.color_text_dark : c.color_text_light) : c.color_text_light;
      // a bateria fica no meio: segue o lado mais escuro para não sumir
      const bText = auto ? (isLight(tempColor) && isLight(humColor) ? c.color_text_dark : c.color_text_light)
        : c.color_battery_text;

      const showIcons = c.show_icons !== false;
      const showBat = c.show_battery !== false;
      const cols = [];
      if (showIcons) cols.push("i1");
      cols.push("v1");
      if (showBat) cols.push("b");
      cols.push("v2");
      if (showIcons) cols.push("i2");
      const span = (area) => `"${cols.map(() => area).join(" ")}"`;
      const foot = this._footHtml();
      const rows = [];
      if (c.show_name !== false) rows.push(span("n"));
      rows.push(`"${cols.join(" ")}"`);
      if (foot) rows.push(span("f"));
      const colSizes = cols.map((col) => (col === "v1" || col === "v2" ? "1fr" : "min-content")).join(" ");

      const seam = Math.max(0, Math.min(40, Number(c.seam_blend) || 0));
      const halves = seam === 0
        ? `linear-gradient(90deg, ${tempColor} 0 50%, ${humColor} 50% 100%)`
        : `linear-gradient(90deg, ${tempColor} 0 ${50 - seam / 2}%, ${humColor} ${50 + seam / 2}% 100%)`;
      const glass = c.gradient === false ? ""
        : `linear-gradient(145deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.06) 42%, rgba(0,0,0,0.08) 100%), `;
      const shadow = c.shadow === false ? "none"
        : `inset 1px 1px 0 rgba(255,255,255,0.28), inset -1px -1px 0 rgba(0,0,0,0.10),
           0 2px 3px rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.14)`;
      const lift = c.lift === false ? "none" : "translateY(-1px)";
      const isz = px(c.icon_size) || "22px";
      const height = px(c.height);

      const dead = (v) => v.num === null;
      const tIcon = dead(t) ? c.icon_unavailable : c.icon_temp;
      const hIcon = dead(h) ? c.icon_unavailable : c.icon_hum;

      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `
        <style>
          ha-card{box-sizing:border-box;padding:${px(c.padding) || "6px"};
            border-radius:${px(c.border_radius) || "10px"};
            background-image:${glass}${halves};
            border:1px solid rgba(255,255,255,0.16) !important;
            transform:${lift};box-shadow:${shadow};${height ? `height:${height};` : ""}
            transition:transform 180ms ease, box-shadow 180ms ease, background-image 250ms ease;
            overflow:hidden;-webkit-tap-highlight-color:transparent;
            touch-action:manipulation;user-select:none;}
          .ct{display:grid;width:100%;height:100%;align-items:center;
            grid-template-areas:${rows.join(" ")};grid-template-columns:${colSizes};}
          .nm{grid-area:n;justify-self:center;font-size:${px(c.name_size) || "10px"};
            color:${esc(c.color_name)};text-shadow:0 1px 1px rgba(0,0,0,0.30);
            line-height:1.2;padding-bottom:2px;}
          .i1{grid-area:i1;justify-self:start;}
          .i2{grid-area:i2;justify-self:end;}
          .i1 ha-icon,.i2 ha-icon{width:${isz};height:${isz};--mdc-icon-size:${isz};
            filter:drop-shadow(0 1px 1px rgba(0,0,0,0.28));display:flex;}
          .i1 ha-icon{color:${esc(tText)};}
          .i2 ha-icon{color:${esc(hText)};}
          .v1,.v2{font-size:${px(c.value_size) || "18px"};font-weight:700;line-height:1.1;
            font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;
            text-shadow:0 1px 1px rgba(0,0,0,0.22);cursor:pointer;}
          .v1{grid-area:v1;justify-self:start;color:${esc(tText)};padding-left:${px(c.gap) || "4px"};}
          .v2{grid-area:v2;justify-self:end;color:${esc(hText)};padding-right:${px(c.gap) || "4px"};}
          .u{font-size:0.62em;font-weight:600;opacity:.8;padding-left:2px;}
          .bat{grid-area:b;justify-self:center;font-size:${px(c.battery_size) || "12px"};
            color:${esc(bText)};text-shadow:0 1px 1px rgba(0,0,0,0.25);cursor:pointer;}
          .bt{display:inline-flex;align-items:center;gap:1px;}
          .bp{display:inline-block;${c.battery_rotate === true ? "width:26px;transform:rotate(90deg);" : ""}}
          .foot{grid-area:f;justify-self:center;display:inline-flex;align-items:center;gap:5px;
            font-size:${px(c.foot_size) || "10px"};color:${esc(c.color_foot)};padding-top:2px;
            text-shadow:0 1px 1px rgba(0,0,0,0.30);}
          .foot ha-icon{width:1.25em;height:1.25em;--mdc-icon-size:1.25em;display:flex;}
          .foot .rt{display:inline-flex;align-items:center;gap:2px;font-weight:600;}
          .sep{font-style:normal;opacity:.5;}
        </style>
        <ha-card>
          <div class="ct">
            ${c.show_name !== false ? `<div class="nm">${esc(this._name())}</div>` : ""}
            ${showIcons ? `<div class="i1"><ha-icon icon="${esc(tIcon)}"></ha-icon></div>` : ""}
            <div class="v1" data-entity="${esc(c.temp_entity)}">${esc(t.text)}<span class="u">${esc(t.unit || "°C")}</span></div>
            ${showBat ? `<div class="bat" data-entity="${esc(this._batteryEntity())}">${this._batteryHtml(bText)}</div>` : ""}
            <div class="v2" data-entity="${esc(c.hum_entity)}">${esc(h.text)}<span class="u">${esc(h.unit || "%")}</span></div>
            ${showIcons ? `<div class="i2"><ha-icon icon="${esc(hIcon)}"></ha-icon></div>` : ""}
            ${foot}
          </div>
        </ha-card>`;

      this._wire();
    }

    _name() {
      const c = this._config;
      if (c.name) return c.name;
      const st = this._hass.states[c.temp_entity] || this._hass.states[c.hum_entity];
      const fn = st?.attributes?.friendly_name || c.temp_entity || c.hum_entity || "";
      // "Sala Temperatura" → "Sala": o nome do card é do ambiente, não da grandeza
      return String(fn).replace(/\s*(temperatura|temperature|umidade|humidity)\s*$/i, "").trim() || fn;
    }

    _moreInfo(entityId) {
      if (!entityId) return;
      this.dispatchEvent(new CustomEvent("hass-more-info",
        { bubbles: true, composed: true, detail: { entityId } }));
    }

    _wire() {
      const c = this._config;
      const root = this.shadowRoot;
      // tap_action "auto": cada pedaço abre o more-info do seu próprio sensor
      if ((c.tap_action || "auto") === "auto") {
        root.querySelectorAll("[data-entity]").forEach((el) =>
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            this._moreInfo(el.dataset.entity);
          }));
      }
      const card = root.querySelector("ha-card");
      let holdTimer = null, held = false;
      card.addEventListener("pointerdown", () => {
        held = false;
        holdTimer = setTimeout(() => { held = true; holdTimer = null; this._run(c.hold_action); }, 500);
      });
      ["pointerleave", "pointercancel"].forEach((t) => card.addEventListener(t, () => {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      }));
      card.addEventListener("pointerup", () => {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        if (!held && (c.tap_action || "auto") !== "auto") this._run(c.tap_action);
      });
    }

    _run(action) {
      const c = this._config;
      switch (action) {
        case "none": case undefined: return;
        case "navigate":
          if (!c.navigation_path) return;
          history.pushState(null, "", c.navigation_path);
          window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
          return;
        case "url":
          if (c.url_path) window.open(c.url_path, "_blank", "noopener"); return;
        case "more-info": default:
          this._moreInfo(c.temp_entity || c.hum_entity);
      }
    }
  }

  /* ------------------------------ EDITOR ------------------------------ */

  const LABELS = {
    device: "Dispositivo (temperatura/umidade)",
    temp_entity: "Sensor de temperatura",
    hum_entity: "Sensor de umidade",
    battery_entity: "Sensor de bateria",
    battery_auto: "Descobrir a bateria sozinho (quando o campo acima estiver vazio)",
    rssi_entity: "Sensor de RSSI",
    lqi_entity: "Sensor de LQI",
    name: "Nome (vazio = nome do sensor, sem a grandeza)",
    show_name: "Mostrar o nome",
    show_icons: "Mostrar os ícones das pontas",
    show_battery: "Mostrar a bateria",
    show_protocol: "Mostrar o protocolo",
    show_rssi: "Mostrar o RSSI",
    show_lqi: "Mostrar o LQI",
    show_router: "Mostrar o roteador",
    protocol: "Protocolo",
    router: "Roteador",
    router_label: "Sigla do roteador (quando «Outro»)",
    icon_temp: "Ícone da temperatura",
    icon_hum: "Ícone da umidade",
    icon_unavailable: "Ícone (sem leitura)",
    temp_decimals: "Casas decimais da temperatura",
    hum_decimals: "Casas decimais da umidade",
    blend: "Degradê entre as faixas (desligado = faixas secas)",
    seam_blend: "Transição no meio do card",
    temp_stop_1: "Temperatura: fim da faixa 1 (frio)",
    temp_stop_2: "Temperatura: fim da faixa 2",
    temp_stop_3: "Temperatura: fim da faixa 3 (conforto)",
    temp_stop_4: "Temperatura: fim da faixa 4",
    hum_stop_1: "Umidade: fim da faixa 1 (seco)",
    hum_stop_2: "Umidade: fim da faixa 2",
    hum_stop_3: "Umidade: fim da faixa 3 (conforto)",
    hum_stop_4: "Umidade: fim da faixa 4",
    icon_size: "Tamanho dos ícones",
    value_size: "Tamanho dos números",
    name_size: "Tamanho do nome",
    battery_size: "Tamanho do texto da bateria",
    battery_icon_size: "Tamanho do ícone da bateria",
    foot_size: "Tamanho do rodapé técnico",
    border_radius: "Arredondamento da borda",
    padding: "Folga interna",
    gap: "Recuo dos números",
    height: "Altura do card (vazio = automática)",
    gradient: "Brilho de vidro no fundo",
    shadow: "Sombra em relevo",
    lift: "Card levemente levantado",
    text_auto_contrast: "Escolher a cor do texto pelo fundo (contraste automático)",
    battery_show_percent: "Mostrar o percentual da bateria",
    battery_rotate: "Girar o percentual 90°",
    battery_low: "Bateria baixa até (%)",
    battery_medium: "Bateria média até (%)",
    battery_high: "Bateria alta até (%)",
    tap_action: "Toque",
    hold_action: "Toque longo",
    double_tap_action: "Toque duplo",
    navigation_path: "Caminho para navegar (ação Navegar)",
    url_path: "Endereço para abrir (ação Abrir link)",
    color_temp_1: "Temperatura faixa 1 (frio)",
    color_temp_2: "Temperatura faixa 2",
    color_temp_3: "Temperatura faixa 3 (conforto)",
    color_temp_4: "Temperatura faixa 4",
    color_temp_5: "Temperatura faixa 5 (quente)",
    color_hum_1: "Umidade faixa 1 (seco)",
    color_hum_2: "Umidade faixa 2",
    color_hum_3: "Umidade faixa 3 (conforto)",
    color_hum_4: "Umidade faixa 4",
    color_hum_5: "Umidade faixa 5 (úmido)",
    color_unavailable: "Sem leitura: fundo",
    color_text_dark: "Texto escuro (fundo claro)",
    color_text_light: "Texto claro (fundo escuro)",
    color_name: "Nome: texto",
    color_foot: "Rodapé técnico: texto",
    color_battery_text: "Bateria: texto (sem contraste automático)",
    color_battery_low: "Bateria baixa",
    color_battery_medium: "Bateria média",
    color_battery_high: "Bateria alta",
    color_battery_full: "Bateria cheia",
  };

  const COLOR_FIELDS = [
    "color_temp_1", "color_temp_2", "color_temp_3", "color_temp_4", "color_temp_5",
    "color_hum_1", "color_hum_2", "color_hum_3", "color_hum_4", "color_hum_5",
    "color_unavailable", "color_text_dark", "color_text_light", "color_name",
    "color_foot", "color_battery_text", "color_battery_low", "color_battery_medium",
    "color_battery_high", "color_battery_full",
  ];

  const ACTIONS = [
    { value: "auto", label: "Automático (cada metade abre o seu sensor)" },
    { value: "more-info", label: "Abrir detalhes (more-info)" },
    { value: "navigate", label: "Navegar para uma tela" },
    { value: "url", label: "Abrir um link" },
    { value: "none", label: "Nada" },
  ];

  const NONE = "__none__";

  class MwTempHumidityCardEditor extends HTMLElement {
    setConfig(config) { this._config = { ...config }; this._renderForm(); }
    set hass(hass) {
      this._hass = hass;
      if (this._form) { this._form.hass = hass; this._form.schema = this._schema(); }
    }

    _schema() {
      const hass = this._hass;
      const cfg = this._config || {};
      const num = (min, max, unit) => ({ number: { min, max, step: 1, mode: "box", unit_of_measurement: unit } });
      if (!hass) {
        return [
          { name: "temp_entity", selector: { entity: { domain: "sensor" } } },
          { name: "hum_entity", selector: { entity: { domain: "sensor" } } },
        ];
      }
      const ref = cfg.temp_entity || cfg.hum_entity;
      const devices = climateDevices(hass);
      const none = [{ value: NONE, label: "— nenhum —" }];
      const sel = (opts) => ({ select: { mode: "dropdown", options: opts } });

      return [
        ...(devices.length ? [{ name: "device", selector: sel(devices) }] : []),
        { name: "temp_entity", selector: sel(sensorsOf(hass, cfg.device, "temperature")) },
        { name: "hum_entity", selector: sel(sensorsOf(hass, cfg.device, "humidity")) },
        { name: "show_battery", selector: { boolean: {} } },
        ...(cfg.show_battery !== false ? [
          { name: "battery_entity", selector: sel(none.concat(deviceSensors(hass, cfg.device, ref, "battery"))) },
          { name: "battery_auto", selector: { boolean: {} } },
        ] : []),
        { name: "name", selector: { text: {} } },
        {
          name: "", type: "expandable", title: "Rodapé técnico (protocolo, sinal, roteador)", schema: [
            { name: "show_protocol", selector: { boolean: {} } },
            ...(cfg.show_protocol ? [{ name: "protocol", selector: sel([
              { value: "none", label: "Nenhum" },
              { value: "zigbee", label: "Zigbee" },
              { value: "zwave", label: "Z-Wave" },
              { value: "wifi", label: "Wi-Fi" },
              { value: "bluetooth", label: "Bluetooth" },
              { value: "thread", label: "Thread" },
              { value: "matter", label: "Matter" },
            ]) }] : []),
            { name: "show_rssi", selector: { boolean: {} } },
            ...(cfg.show_rssi ? [{ name: "rssi_entity",
              selector: sel(none.concat(deviceSensors(hass, cfg.device, ref, "signal_strength", "_rssi"))) }] : []),
            { name: "show_lqi", selector: { boolean: {} } },
            ...(cfg.show_lqi ? [{ name: "lqi_entity",
              selector: sel(none.concat(deviceSensors(hass, cfg.device, ref, null, "_lqi"))) }] : []),
            { name: "show_router", selector: { boolean: {} } },
            ...(cfg.show_router ? [
              { name: "router", selector: sel([{ value: "none", label: "Nenhum" }]
                .concat(ROUTERS.map((r) => ({ value: r, label: r })))
                .concat([{ value: "other", label: "Outro (informar sigla)" }])) },
              ...(cfg.router === "other" ? [{ name: "router_label", selector: { text: {} } }] : []),
            ] : []),
          ],
        },
        {
          name: "", type: "expandable", title: "Faixas de cor", schema: [
            { name: "blend", selector: { boolean: {} } },
            { name: "seam_blend", selector: num(0, 40, "%") },
            { name: "temp_stop_1", selector: num(-50, 80, "°") },
            { name: "temp_stop_2", selector: num(-50, 80, "°") },
            { name: "temp_stop_3", selector: num(-50, 80, "°") },
            { name: "temp_stop_4", selector: num(-50, 80, "°") },
            { name: "hum_stop_1", selector: num(0, 100, "%") },
            { name: "hum_stop_2", selector: num(0, 100, "%") },
            { name: "hum_stop_3", selector: num(0, 100, "%") },
            { name: "hum_stop_4", selector: num(0, 100, "%") },
          ],
        },
        {
          name: "", type: "expandable", title: "Ícones, textos e casas decimais", schema: [
            { name: "show_icons", selector: { boolean: {} } },
            { name: "show_name", selector: { boolean: {} } },
            { name: "icon_temp", selector: { icon: {} } },
            { name: "icon_hum", selector: { icon: {} } },
            { name: "icon_unavailable", selector: { icon: {} } },
            { name: "temp_decimals", selector: num(0, 3, "") },
            { name: "hum_decimals", selector: num(0, 3, "") },
            { name: "text_auto_contrast", selector: { boolean: {} } },
          ],
        },
        {
          name: "", type: "expandable", title: "Tamanhos e forma", schema: [
            { name: "icon_size", selector: num(8, 96, "px") },
            { name: "value_size", selector: num(8, 96, "px") },
            { name: "name_size", selector: num(6, 40, "px") },
            { name: "battery_size", selector: num(6, 40, "px") },
            { name: "battery_icon_size", selector: num(8, 60, "px") },
            { name: "foot_size", selector: num(6, 40, "px") },
            { name: "border_radius", selector: num(0, 60, "px") },
            { name: "padding", selector: num(0, 40, "px") },
            { name: "gap", selector: num(0, 40, "px") },
            { name: "height", selector: { text: {} } },
            { name: "gradient", selector: { boolean: {} } },
            { name: "shadow", selector: { boolean: {} } },
            { name: "lift", selector: { boolean: {} } },
          ],
        },
        {
          name: "", type: "expandable", title: "Bateria", schema: [
            { name: "battery_show_percent", selector: { boolean: {} } },
            { name: "battery_rotate", selector: { boolean: {} } },
            { name: "battery_low", selector: num(0, 100, "%") },
            { name: "battery_medium", selector: num(0, 100, "%") },
            { name: "battery_high", selector: num(0, 100, "%") },
          ],
        },
        {
          name: "", type: "expandable", title: "Ações", schema: [
            { name: "tap_action", selector: sel(ACTIONS) },
            { name: "hold_action", selector: sel(ACTIONS.filter((a) => a.value !== "auto")) },
            { name: "navigation_path", selector: { text: {} } },
            { name: "url_path", selector: { text: {} } },
          ],
        },
      ];
    }

    _renderForm() {
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (f) => LABELS[f.name] || f.name;
        this._form.addEventListener("value-changed", (ev) => this._onChange(ev));
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      this._form.schema = this._schema();
      const data = { ...DEFAULTS, ...this._config };
      for (const k of Object.keys(data)) if (data[k] === "") delete data[k];
      this._form.data = data;
      this._renderColors();
    }

    _renderColors() {
      if (!this._colorsEl) {
        this._colorsEl = document.createElement("details");
        this._colorsEl.style.cssText =
          "margin-top:16px;border:1px solid var(--divider-color);border-radius:8px;padding:8px 12px;";
        this.appendChild(this._colorsEl);
      }
      const rows = COLOR_FIELDS.map((name) => {
        const cur = this._config[name] ?? DEFAULTS[name] ?? "";
        const c = parseColor(cur || "rgba(128,128,128,1)");
        return `<div class="thc-crow" data-name="${name}">
          <span class="lbl">${LABELS[name] || name}</span>
          <input type="color" value="${toHex(c)}" title="cor">
          <input type="range" min="0" max="1" step="0.01" value="${c.a}" title="transparência (alfa)">
          <code>${cur || "—"}</code>
        </div>`;
      }).join("");
      this._colorsEl.innerHTML = `
        <summary style="cursor:pointer;font-weight:500;">Cores (faixas, texto e bateria)</summary>
        <style>
          .thc-crow{display:grid;grid-template-columns:1fr 44px 110px minmax(120px,1fr);gap:10px;
            align-items:center;padding:6px 0;}
          .thc-crow .lbl{font-size:13px;}
          .thc-crow input[type=color]{width:40px;height:28px;border:none;background:none;cursor:pointer;padding:0;}
          .thc-crow code{font-size:11px;opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        </style>${rows}`;
      this._colorsEl.querySelectorAll(".thc-crow").forEach((rowEl) => {
        const name = rowEl.dataset.name;
        const apply = () => {
          const hex = rowEl.querySelector("input[type=color]").value;
          const a = parseFloat(rowEl.querySelector("input[type=range]").value);
          const { r, g, b } = parseColor(hex);
          const value = a >= 1 ? hex : toRgba({ r, g, b, a });
          const clean = { ...this._config };
          if (value === DEFAULTS[name]) delete clean[name]; else clean[name] = value;
          this._config = clean;
          rowEl.querySelector("code").textContent = clean[name] || "—";
          this.dispatchEvent(new CustomEvent("config-changed",
            { bubbles: true, composed: true, detail: { config: clean } }));
        };
        rowEl.querySelector("input[type=color]").addEventListener("input", apply);
        rowEl.querySelector("input[type=range]").addEventListener("input", apply);
      });
    }

    _onChange(ev) {
      ev.stopPropagation();
      const v = { ...ev.detail.value };
      const clean = {};
      let noBattery = false;
      for (const [k, val] of Object.entries(v)) {
        if (val === undefined || val === null || val === "") continue;
        if (k === "battery_entity" && val === NONE) { noBattery = true; continue; }
        if ((k === "rssi_entity" || k === "lqi_entity") && val === NONE) continue;
        if (k === "temp_entity" || k === "hum_entity" || k === "device" || val !== DEFAULTS[k]) clean[k] = val;
      }
      if (noBattery) { delete clean.battery_entity; clean.battery_auto = false; }
      // trocar de dispositivo invalida o que era do dispositivo antigo
      if (clean.device && clean.device !== this._config.device) {
        for (const k of ["temp_entity", "hum_entity", "battery_entity", "rssi_entity", "lqi_entity"]) {
          if (clean[k] && deviceOf(this._hass, clean[k]) !== clean.device) delete clean[k];
        }
        if (!clean.temp_entity) {
          const first = sensorsOf(this._hass, clean.device, "temperature")[0];
          if (first && deviceOf(this._hass, first.value) === clean.device) clean.temp_entity = first.value;
        }
        if (!clean.hum_entity) {
          const first = sensorsOf(this._hass, clean.device, "humidity")[0];
          if (first && deviceOf(this._hass, first.value) === clean.device) clean.hum_entity = first.value;
        }
      }
      // campo que o esquema escondeu não vem no evento — sem isto sumiria do YAML
      for (const [k, val] of Object.entries(this._config)) {
        if (!(k in v) && !COLOR_FIELDS.includes(k) && clean[k] === undefined) clean[k] = val;
      }
      for (const k of COLOR_FIELDS) {
        if (this._config[k] !== undefined) clean[k] = this._config[k];
      }
      this._config = clean;
      this.dispatchEvent(new CustomEvent("config-changed",
        { bubbles: true, composed: true, detail: { config: clean } }));
      this._renderForm();
    }
  }

  customElements.define("mw-temp-humidity-card", MwTempHumidityCard);
  customElements.define("mw-temp-humidity-card-editor", MwTempHumidityCardEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "mw-temp-humidity-card",
    name: "MW Temperature / Humidity Card",
    description: "Temperatura e umidade lado a lado: cada metade pinta pela sua faixa, com bateria e rodapé técnico.",
    preview: true,
    documentationURL: "https://github.com/visaodeempresa/mw-ha-temp-humidity-card",
  });

  console.info("%c MW-TEMP-HUMIDITY-CARD %c 0.1.0 ",
    "background:#1a1a1a;color:#fdfaf3;font-weight:700;",
    "background:#4aa3c7;color:#1a1a1a;font-weight:700;");
})();
