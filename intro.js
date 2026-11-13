// Animierte Szenen der kurzen Anleitung („So geht's“). Jede Karte zeigt eine kleine Bühne:
// das Stationsbild und das echte Handy-Bedienfeld (Gerätekopf, Instrument-Chips, Katheterfeld,
// Kacheln, Stepper, Vitalwerte) als SVG, Bewegung über requestAnimationFrame mit einer
// Zeitleiste je Szene. Nur ein Fenster (600 × 250), iOS-Stil: Schwarz, Systemblau, flache Flächen.
(function () {
  const B = '#0a84ff', CARD = '#1c1c1e', DIM = '#8e8e93', FILL = 'rgba(118,118,128,.24)', W = '#fff', GREEN = '#30d158', ORANGE = '#ff9f0a', RED = '#ff453a';
  const F = "-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif", MONO = "ui-monospace,'SF Mono',Menlo,monospace";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (u) => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  const lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const seg = (t, a, b) => ease(lin(t, a, b));
  // Sichtfenster mit weichen Rändern und kurzer Tipp-Puls
  const win = (t, a, b, f = .25) => t < a || t > b ? 0 : Math.min(1, (t - a) / f, (b - t) / f);
  const tap = (t, a, w = .35) => t < a || t > a + w ? 0 : Math.sin((t - a) / w * Math.PI);
  const mix = (a, b, u) => a + (b - a) * u;

  // ---------- Bausteine ----------
  const attrs = (o) => Object.entries(o || {}).filter(([, v]) => v != null && v !== '').map(([k, v]) => ` ${k}="${v}"`).join('');
  const T = (x, y, s, size, col = W, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${col}" font-family="${o.mono ? MONO : F}" font-weight="${o.w || 400}" text-anchor="${o.a || 'start'}"${attrs({ 'letter-spacing': o.ls, id: o.id, class: o.cls, opacity: o.op })}>${s}</text>`;
  const R = (x, y, w, h, r, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${attrs({ id: o.id, class: o.cls, stroke: o.stroke, 'stroke-width': o.sw, opacity: o.op, transform: o.tf })}/>`;
  const icon = (n, x, y, s, col = W, o = {}) => `<use href="#ic-${n}" x="${x}" y="${y}" width="${s}" height="${s}" style="stroke:${col};fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round"${attrs({ id: o.id, opacity: o.op })}/>`;
  const finger = (id, k = 1) => `<g id="${id}" opacity="0"><circle r="${15 * k}" fill="rgba(255,255,255,.28)"/><circle r="${7.5 * k}" fill="#fff"/></g>`;
  const path = (d, col, w, o = {}) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="${o.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round"${attrs({ id: o.id, class: o.cls, pathLength: o.pl, 'stroke-dasharray': o.da, 'stroke-dashoffset': o.doff, opacity: o.op, transform: o.tf })}/>`;

  // Handy: Rahmen mit Bildschirm (390 × 844 Einheiten), Inhalt beschnitten
  function phone(x, y, s, inner, id) {
    return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-12" y="-12" width="414" height="868" rx="58" fill="#000" stroke="#3a3a3c" stroke-width="3"/><clipPath id="${id}"><rect width="390" height="844" rx="48"/></clipPath><g clip-path="url(#${id})"><rect width="390" height="844" fill="#000"/>${inner}</g></g>`;
  }
  function tiles(y, list, pref, lit) {
    return list.map(([ic, l], i) => { const x = 24 + i * 75, on = lit === i; return R(x, y, 66, 58, 16, on ? B : FILL, { id: `${pref}${i}` }) + icon(ic, x + 22, y + 9, 22) + T(x + 33, y + 48, l, 11, W, { w: 590, a: 'middle' }); }).join('');
  }
  function stepper(x, y, label, zoom, id) {
    return R(x, y, 112, 40, 12, FILL) + icon(zoom ? 'zoomOut' : 'minus', x + 9, y + 11, 18) + `<path d="M${x + 36} ${y + 4}v32M${x + 76} ${y + 4}v32" stroke="rgba(255,255,255,.08)"/>` + T(x + 56, y + 25, label, 11, 'rgba(235,235,245,.6)', { a: 'middle', id }) + icon(zoom ? 'zoomIn' : 'plus', x + 85, y + 11, 18);
  }
  // Das Bedienfeld, wie es im Fall aussieht
  function phoneUI(o = {}) {
    const chips = o.chips || [['Führungskatheter', 'ACI links'], ['Mikrokatheter', 'im Sack'], ['Mikrodraht', '8 mm']], act = o.active == null ? 2 : o.active;
    let x = 24, s = '';
    chips.forEach(([a, b], i) => { const w = Math.round(a.length * 7.4 + 26); s += R(x, 146, w, 52, 14, i === act ? B : FILL, { id: `${o.pre}chip${i}` }) + T(x + w / 2, 167, a, 13, W, { w: 600, a: 'middle' }) + T(x + w / 2, 185, b, 11, i === act ? 'rgba(255,255,255,.8)' : 'rgba(235,235,245,.6)', { a: 'middle' }); x += w + 8; });
    const stH = o.acts ? 318 : 378, ax = 212 + stH / 2;
    const deck = o.deck === false ? '' : `${R(346, ax - 30, 26, 60, 8, 'rgba(255,255,255,.14)')}${R(150, ax - 11, 230, 22, 11, 'rgba(209,209,214,.7)')}${R(100, ax - 7, 280, 14, 7, '#d1d1d6')}${R(60, ax - 3, 320, 6, 3, B, { id: `${o.pre}dwire`, stroke: 'rgba(255,255,255,.85)', sw: 1.2 })}`;
    return `${R(12, 10, 366, 64, 16, CARD)}${R(24, 23, 38, 38, 10, '#3a3a3c')}${icon('monitor', 32, 31, 22)}<circle cx="59" cy="58" r="5.5" fill="${GREEN}" stroke="${CARD}" stroke-width="2"/>
      ${T(74, 47, 'Interventional Lab', 17, W, { w: 600 })}${T(74, 66, 'Angiographieanlage · Raum K7P2QD', 12, DIM)}
      <circle cx="312" cy="42" r="17" fill="${FILL}"/>${icon('sliders', 303, 33, 18)}<circle cx="353" cy="42" r="17" fill="${FILL}"/>${icon('logout', 344, 33, 18)}
      ${T(24, 100, o.who || 'Du steuerst', 13, B, { w: 600, id: `${o.pre}who` })}${T(24, 126, o.tip || chips[act][0], 15, W, { id: `${o.pre}tip` })}${s}
      ${R(24, 212, 342, stH, 20, CARD)}${T(38, 236, 'KATHETER', 10, DIM, { w: 600, ls: 1 })}${deck}${o.stage || ''}${T(195, 212 + stH - 14, o.hint || 'nach links = vor · senkrecht torquen', 12, DIM, { a: 'middle' })}
      ${o.acts ? R(24, 542, 342, 48, 16, FILL, { id: `${o.pre}act` }) + icon('scissors', 138, 555, 22) + T(168, 572, 'Coil ablösen', 14, W, { w: 600 }) : ''}
      ${tiles(602, [['link', 'koppeln'], ['eject', 'entfernen'], ['dial', 'grob'], ['table', 'Tisch'], ['target', 'Zentrieren']], o.pre + 'gen')}
      ${tiles(672, [['radiation', 'Fluoro'], ['drop', 'KM'], ['camera2', 'Serie'], ['route', 'Roadmap'], ['camera2', '3D']], o.pre + 'img', o.imgOn)}
      ${stepper(24, 742, 'LAO 20°', false, o.pre + 'lao')}${stepper(139, 742, 'CRAN 15°')}${stepper(254, 742, '22 cm', true)}
      ${R(24, 794, 342, 44, 14, CARD)}${['HF 72', 'RR 128/78', 'SpO₂ 98', 'KM 14 ml'].map((v, i) => T(40 + i * 88, 822, v, 13, 'rgba(235,235,245,.75)', { mono: true })).join('')}`;
  }
  // Verbindungsbildschirm des Handys
  function phoneConnect(pre) {
    return `<rect x="137" y="128" width="40" height="40" rx="10" fill="${CARD}"/><path d="M149 158 c0 -9 4 -15 12 -16.6 c2.5 -.5 4 .4 4.4 2.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>${T(188, 155, 'Interventional Lab', 22, W, { w: 600 })}
      ${R(55, 196, 280, 50, 12, FILL)}${T(195, 227, 'Dein Name', 17, 'rgba(235,235,245,.38)', { a: 'middle', id: pre + 'nameph' })}${T(195, 227, 'Anna', 17, W, { a: 'middle', id: pre + 'name', op: 0 })}
      ${R(55, 258, 280, 280, 20, '#0d0d0f')}<g id="${pre}cam" opacity="0" transform="translate(195,398)">${qr(-54, -54, 108, 'rgba(255,255,255,.9)')}</g>
      <path id="${pre}frame" d="M89 310v-12q0-12 12-12h12M277 286h12q12 0 12 12v12M89 486v12q0 12 12 12h12M277 510h12q12 0 12-12v-12" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round"/>
      ${T(195, 528, 'QR-Code der Station vor die Kamera halten', 11, W, { a: 'middle' })}
      ${T(195, 566, 'oder Code eintippen', 12, DIM, { a: 'middle' })}${R(55, 578, 280, 58, 12, FILL)}${T(195, 614, 'ABC123', 26, 'rgba(235,235,245,.38)', { a: 'middle', ls: 7 })}
      ${R(55, 648, 280, 50, 12, B)}${T(195, 679, 'Verbinden', 17, W, { w: 600, a: 'middle' })}`;
  }
  // QR-Muster: feste Pseudozufallsfolge, damit es bei jedem Aufruf gleich aussieht
  function qr(x, y, size, col) {
    const n = 21, c = size / n; let seed = 7, out = '', s = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    const eye = (i, j) => (i < 7 && j < 7) || (i < 7 && j >= n - 7) || (i >= n - 7 && j < 7);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      let on; if (eye(i, j)) { const a = i % (n - 7) < 7 ? i % (n - 7) : i, b = j % (n - 7) < 7 ? j % (n - 7) : j, ii = a >= 7 ? a - (n - 7) : a, jj = b >= 7 ? b - (n - 7) : b; on = ii === 0 || ii === 6 || jj === 0 || jj === 6 || (ii >= 2 && ii <= 4 && jj >= 2 && jj <= 4); } else on = s() < .45;
      if (on) out += `<rect x="${(x + j * c).toFixed(1)}" y="${(y + i * c).toFixed(1)}" width="${(c + .05).toFixed(2)}" height="${(c + .05).toFixed(2)}" fill="${col}"/>`;
    }
    return out;
  }
  // Stationsbildschirm: Rahmen, schwarze Fläche, Inhalt beschnitten
  function monitor(x, y, w, h, inner, id) {
    return `<g transform="translate(${x},${y})"><rect x="-6" y="-6" width="${w + 12}" height="${h + 12}" rx="12" fill="#0b0b0c" stroke="#2c2c2e" stroke-width="1.5"/><clipPath id="${id}"><rect width="${w}" height="${h}" rx="6"/></clipPath><g clip-path="url(#${id})"><rect width="${w}" height="${h}" fill="#000"/>${inner}</g></g>`;
  }
  const hud = (w, h, o = {}) => T(10, 15, o.tl || 'LAO 20° · CRAN 15°', 9, 'rgba(255,255,255,.5)', { mono: true }) + T(w - 10, 15, o.tr || 'FOV 22', 9, 'rgba(255,255,255,.5)', { mono: true, a: 'end' }) + T(10, h - 8, o.bl || '', 9, 'rgba(255,255,255,.5)', { mono: true, id: o.blId }) + T(w - 10, h - 8, o.br || '', 9, ORANGE, { mono: true, a: 'end', id: o.brId });

  // Gefäßbaum (Karotissiphon, Bifurkation, Media und Anterior) in einem 330 × 220-Feld;
  // je Ast Beginn und Ende der Kontrastfüllung (Anteil), damit das KM von unten nach oben läuft.
  const VES = [
    ['M160 225 C160 185 135 175 150 140 C165 108 150 102 172 92', 9, 0, .45],
    ['M172 92 C205 86 240 84 280 78', 7, .42, .68], ['M172 92 C150 80 120 76 96 72', 5.5, .42, .68],
    ['M280 78 C300 70 310 50 322 32', 5, .66, 1], ['M280 78 C298 90 312 108 318 130', 5, .66, 1],
    ['M96 72 C80 62 72 45 70 25', 4, .66, 1], ['M240 84 C245 70 250 60 258 45', 3, .6, .9], ['M140 160 C120 158 100 148 86 136', 3, .3, .6],
  ];
  const tree = (col, k, cls, extra = {}) => VES.map(([d, w], i) => path(d, col, w * k, Object.assign({ cls, pl: 100, da: 100 }, extra, { id: extra.id ? extra.id + i : null }))).join('');
  const WIRE = 'M160 225 C160 185 135 175 150 140 C165 108 150 102 172 92 C205 86 240 84 280 78', UP = 'M280 78 C300 70 310 50 322 32', DN = 'M280 78 C298 90 312 108 318 130';
  // Draht als Punktfolge entlang eines Pfads (plus Ast), mit abgewinkelter Spitze
  function wireD(trunk, branch, L, tipAng, tipLen = 11) {
    const Lt = trunk.getTotalLength(); const pts = []; const step = 3;
    for (let l = 0; l <= Math.min(L, Lt); l += step) { const p = trunk.getPointAtLength(l); pts.push([p.x, p.y]); }
    if (L > Lt && branch) { const Lb = Math.min(L - Lt, branch.getTotalLength()); for (let l = step; l <= Lb; l += step) { const p = branch.getPointAtLength(l); pts.push([p.x, p.y]); } }
    if (pts.length < 2) return '';
    const [ax, ay] = pts[pts.length - 2], [bx, by] = pts[pts.length - 1]; let dx = bx - ax, dy = by - ay; const n = Math.hypot(dx, dy) || 1; dx /= n; dy /= n;
    const c = Math.cos(tipAng), s = Math.sin(tipAng), tx = dx * c - dy * s, ty = dx * s + dy * c;
    return 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + ` Q${(bx + dx * tipLen * .6).toFixed(1)} ${(by + dy * tipLen * .6).toFixed(1)} ${(bx + tx * tipLen).toFixed(1)} ${(by + ty * tipLen).toFixed(1)}`;
  }
  // Kontrastfüllung: je Ast ein Zeitfenster (Anteil der Gesamtfüllung)
  function fillTree(q, pre, u, alpha) {
    VES.forEach(([, , a, b], i) => { const e = q(pre + i); if (!e) return; const f = lin(u, a, b); e.style.strokeDashoffset = 100 - 100 * f; e.setAttribute('opacity', f > 0 ? (alpha == null ? 1 : alpha) : 0); });
  }
  const setT = (e, s) => e && e.setAttribute('transform', s), setO = (e, v) => e && e.setAttribute('opacity', clamp(v, 0, 1).toFixed(3)), setF = (e, v) => e && e.setAttribute('fill', v);
  const fingerAt = (e, x, y, op) => { setT(e, `translate(${x.toFixed(1)},${y.toFixed(1)})`); setO(e, op); };

  // ---------- Szenen ----------
  const SCENES = {};

  // 1 · Überblick: Station links, Handy rechts, eine Wischbewegung schiebt den Draht
  SCENES.overview = { dur: 8,
    svg: () => `${monitor(14, 12, 330, 226, `<g transform="translate(0,3)">${tree('rgba(255,255,255,.16)', 1)}<path id="ov-trunk" d="${WIRE}" fill="none" stroke="none"/><path id="ov-up" d="${UP}" fill="none" stroke="none"/>${path('', '#f2f2f7', 2.2, { id: 'ov-wire' })}</g>${hud(330, 226, { br: 'ROADMAP' })}`, 'ov-m')}
      <path d="M352 125 H392" stroke="rgba(10,132,255,.55)" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round" id="ov-link"/>
      ${phone(404, 18, .2535, phoneUI({ pre: 'ov-' }) + finger('ov-f', 3.2), 'ov-p')}`,
    init: (q) => ({ trunk: q('ov-trunk'), up: q('ov-up'), wire: q('ov-wire'), f: q('ov-f'), link: q('ov-link'), dwire: q('ov-dwire') }),
    update: (t, r, q) => {
      const u1 = seg(t, 1, 2.2), u2 = seg(t, 4.5, 5.7); const Lt = r.trunk.getTotalLength();
      r.wire.setAttribute('d', wireD(r.trunk, r.up, Lt * (.55 + .2 * u1 + .22 * u2), .15)); setO(r.wire, 1 - lin(t, 7.5, 7.9));
      const w1 = win(t, .8, 2.4), w2 = win(t, 4.3, 5.9); fingerAt(r.f, 265 - 170 * (w1 ? u1 : u2), 430, Math.max(w1, w2));
      r.dwire.setAttribute('x', 60 - 30 * (u1 + u2));
      r.link.setAttribute('stroke-dashoffset', (-t * 24).toFixed(1));
    } };

  // 2 · Fall wählen: Menü der Station – Bereich, Fall, dann die Schritte Bedingungen, Material, Handy
  SCENES.choose = { dur: 12,
    svg: () => {
      const steps = [['Fall', 'list'], ['Bedingungen', 'sliders'], ['Material', 'tray'], ['Handy', 'phone']];
      let x = 150, head = R(0, 0, 600, 40, 0, '#141416') + `<rect x="18" y="12" width="16" height="16" rx="4" fill="${CARD}"/><path d="M22.5 25 c0 -4 2 -6.6 5.3 -7.3 c1 -.2 1.7 .2 1.9 1" fill="none" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>` + T(40, 25, 'Interventional Lab', 11, W, { w: 600 });
      steps.forEach(([l, ic], i) => { const w = l.length * 6.2 + 30; head += R(x, 9, w, 22, 11, i === 0 ? B : FILL, { id: 'ch-st' + i }) + icon(ic, x + 8, 13, 11) + T(x + 22, 24, l, 10, W, { w: 590 }); x += w + 14; if (i < 3) { head += icon('chevR', x - 12, 14, 10, 'rgba(255,255,255,.3)'); } });
      head += icon('users', 500, 14, 12, DIM) + T(516, 24, 'Anna Beispiel', 10, DIM);
      const seg3 = R(18, 56, 290, 30, 10, FILL) + R(21, 59, 94, 24, 8, '#636366', { id: 'ch-seg' }) + ['Angiographie', 'CT', 'Sono'].map((l, i) => T(68 + i * 96, 75, l, 11, W, { w: 590, a: 'middle' })).join('');
      const cards = [['Aneurysma-Coiling', 'schmalhalsig · ACom', false], ['Aneurysma-Coiling', 'breitbasig · Ballon oder Stent', false], ['Testfall 3', 'Original-Anatomie · MCA', true]];
      let list = ''; cards.forEach(([a, b, lock], i) => { const y = 98 + i * 34; list += R(18, y, 290, 28, 9, CARD, { id: 'ch-c' + i, op: lock ? .5 : 1 }) + icon(lock ? 'lock' : 'aneurysm', 26, y + 7, 14, lock ? DIM : W) + T(48, y + 13, a, 10.5, W, { w: 600 }) + T(48, y + 23.5, b, 8.5, DIM); });
      const detail = `<g id="ch-pg0">${seg3}${list}${T(330, 70, 'MODUL 2 · AKADEMIE', 8, DIM, { ls: 1.2, w: 700 })}
        <g id="ch-d0">${T(330, 92, 'Aneurysma-Coiling', 15, W, { w: 600 })}${T(330, 108, 'schmalhalsig · ACom', 10, DIM)}${T(330, 130, 'Mikrokatheter in den Sack, Coils bis', 9.5, 'rgba(235,235,245,.8)')}${T(330, 143, 'der Hals gedeckt ist.', 9.5, 'rgba(235,235,245,.8)')}</g>
        <g id="ch-d1" opacity="0">${T(330, 92, 'Aneurysma-Coiling', 15, W, { w: 600 })}${T(330, 108, 'breitbasig · Ballon oder Stent', 10, DIM)}${T(330, 130, 'Der Hals ist breit: Coils halten nur mit', 9.5, 'rgba(235,235,245,.8)')}${T(330, 143, 'Ballon-Remodeling oder Stent.', 9.5, 'rgba(235,235,245,.8)')}</g>
        ${R(330, 158, 110, 24, 8, FILL)}${icon('check', 338, 164, 12, GREEN)}${T(354, 174, 'Modul offen', 9.5, W)}</g>`;
      const opt = (x, y, l, on, id) => R(x, y, 250, 26, 9, on ? 'rgba(10,132,255,.2)' : CARD, { id, stroke: on ? 'rgba(10,132,255,.7)' : null, sw: 1.2 }) + T(x + 12, y + 17, l, 10.5, W, { w: on ? 600 : 500 });
      const pg1 = `<g id="ch-pg1" opacity="0">${T(18, 66, 'SCHWIERIGKEIT', 8, DIM, { ls: 1.2, w: 700 })}${opt(18, 76, 'Einsteiger – geduldige Gefäße', false)}${opt(18, 108, 'Standard – realistisches Verhalten', true)}${opt(18, 140, 'Fortgeschritten – Spasmus, Dissektion', false)}
        ${T(318, 66, 'STARTPUNKT', 8, DIM, { ls: 1.2, w: 700 })}${opt(318, 76, 'Leiste – vom Zugang an', false)}${opt(318, 108, 'ACI – Führungskatheter liegt', true, 'ch-o1')}${opt(318, 140, 'Am Ziel – Mikrokatheter im Sack', false)}</g>`;
      const tray = (x, y, a, b) => R(x, y, 172, 44, 10, CARD) + R(x + 10, y + 10, 40, 24, 5, 'rgba(118,118,128,.18)') + path(`M${x + 14} ${y + 22} h32`, '#d1d1d6', 2) + T(x + 60, y + 19, a, 10, W, { w: 600 }) + T(x + 60, y + 32, b, 8.5, DIM);
      const pg2 = `<g id="ch-pg2" opacity="0">${T(18, 66, 'MATERIALTISCH', 8, DIM, { ls: 1.2, w: 700 })}${tray(18, 76, 'Führungskatheter 6F', 'Envoy · 90 cm')}${tray(200, 76, 'Mikrokatheter', 'SL-10 · 1,7F')}${tray(382, 76, 'Mikrodraht', 'Synchro 14 · 200 cm')}${tray(18, 130, 'Coils', '3 mm × 6 cm · 2 mm × 4 cm')}${tray(200, 130, 'Ballon', 'Scepter XC 4 × 11')}${R(382, 130, 172, 44, 10, 'none', { stroke: 'rgba(255,255,255,.12)', sw: 1 })}${icon('plus', 452, 143, 14, DIM)}${T(468, 157, 'nachlegen', 10, DIM)}</g>`;
      const pg3 = `<g id="ch-pg3" opacity="0">${qr(60, 56, 120, 'rgba(255,255,255,.9)')}${R(60, 186, 120, 24, 8, FILL)}${T(120, 203, 'K7P2QD', 13, W, { mono: true, a: 'middle', ls: 3 })}${T(320, 66, 'HANDY ALS BEDIENFELD', 8, DIM, { ls: 1.2, w: 700 })}
        ${[['1', 'QR-Code mit der Kamera scannen'], ['2', 'Namen eingeben, Code kommt mit'], ['3', 'Hier antippen, wer steuern darf']].map(([n, l], i) => `<circle cx="328" cy="${86 + i * 24}" r="8" fill="${B}"/>` + T(328, 89.5 + i * 24, n, 9, W, { w: 700, a: 'middle' }) + T(344, 90 + i * 24, l, 10.5, 'rgba(235,235,245,.85)')).join('')}
        ${R(320, 160, 180, 26, 9, FILL)}${T(334, 177, 'Verbunden: Anna', 10.5, W)}</g>`;
      const foot = R(0, 212, 600, 38, 0, '#141416') + R(452, 219, 60, 24, 10, FILL, { id: 'ch-next' }) + T(474, 235, 'Weiter', 10.5, W, { w: 590 }) + icon('chevR', 497, 226, 11) + R(520, 219, 68, 24, 10, B, { id: 'ch-start' }) + icon('play', 528, 225, 12) + T(543, 235, 'Starten', 10.5, W, { w: 600 });
      return head + detail + pg1 + pg2 + pg3 + foot + finger('ch-f', 1);
    },
    init: (q) => ({ seg: q('ch-seg'), c: [0, 1, 2].map(i => q('ch-c' + i)), d0: q('ch-d0'), d1: q('ch-d1'), pg: [0, 1, 2, 3].map(i => q('ch-pg' + i)), st: [0, 1, 2, 3].map(i => q('ch-st' + i)), f: q('ch-f'), next: q('ch-next') }),
    update: (t, r) => {
      // Bereich: Segment gleitet von CT auf Angiographie
      const us = seg(t, .9, 1.5); r.seg.setAttribute('x', (117 - 96 * us).toFixed(1));
      // Fall antippen
      const sel = seg(t, 3.2, 3.6); setF(r.c[1], sel > .5 ? 'rgba(10,132,255,.2)' : CARD); r.c[1].setAttribute('stroke', sel > .5 ? 'rgba(10,132,255,.7)' : 'none'); r.c[1].setAttribute('stroke-width', 1.2);
      setO(r.d0, 1 - sel); setO(r.d1, sel);
      // Seiten: Fall 0–5,5 · Bedingungen 5,5–8 · Material 8–10 · Handy 10–12
      const bounds = [[0, 5.5], [5.5, 8], [8, 10], [10, 12.01]];
      bounds.forEach(([a, b], i) => { setO(r.pg[i], win(t, a, b, .3)); setF(r.st[i], t >= a && t < b ? B : FILL); });
      // Finger: Bereich (1,1 s), Fall (3,3 s), dreimal „Weiter“ (5,3 · 7,8 · 9,8 s)
      const taps = [[1.1, 68, 71], [3.3, 160, 146], [5.3, 482, 231], [7.8, 482, 231], [9.8, 482, 231]];
      let fo = 0, fx = 0, fy = 0; for (const [a, x, y] of taps) { const p = tap(t, a - .2, .6); if (p > fo) { fo = p; fx = x; fy = y; } }
      fingerAt(r.f, fx, fy, fo); setF(r.next, taps.some(([a]) => a >= 5 && Math.abs(t - a) < .18) ? 'rgba(118,118,128,.5)' : FILL);
    } };

  // 3 · Handy verbinden: QR scannen, Name, an der Station freigeben
  SCENES.link = { dur: 10,
    svg: () => `${monitor(14, 12, 320, 226, `<rect width="320" height="226" fill="#000"/>${qr(28, 34, 118, 'rgba(255,255,255,.92)')}${R(28, 164, 118, 24, 8, FILL)}${T(87, 181, 'K7P2QD', 13, W, { mono: true, a: 'middle', ls: 3 })}
        ${T(170, 44, 'HANDY ALS BEDIENFELD', 8, DIM, { ls: 1.2, w: 700 })}${[['1', 'QR-Code scannen'], ['2', 'Namen eingeben'], ['3', 'Antippen, wer steuert']].map(([n, l], i) => `<circle cx="178" cy="${62 + i * 22}" r="7" fill="${B}"/>` + T(178, 65 + i * 22, n, 8.5, W, { w: 700, a: 'middle' }) + T(192, 66 + i * 22, l, 10, 'rgba(235,235,245,.85)')).join('')}
        ${T(170, 142, 'VERBUNDEN', 8, DIM, { ls: 1.2, w: 700 })}<g id="lk-whog" opacity="0">${R(170, 150, 118, 26, 9, FILL, { id: 'lk-whobg' })}<circle cx="184" cy="163" r="4" fill="${GREEN}"/>${T(194, 167, 'Anna', 10.5, W, { w: 600 })}${T(244, 167, 'schaut zu', 9, DIM, { id: 'lk-role' })}</g>
        ${T(170, 196, 'Antippen = steuern', 8.5, 'rgba(235,235,245,.45)', { id: 'lk-hint' })}`, 'lk-m')}
      ${phone(396, 18, .2535, `<g id="lk-con">${phoneConnect('lk-')}</g><g id="lk-app" opacity="0">${phoneUI({ pre: 'lk-', who: 'Du schaust zu' })}</g>` + finger('lk-f', 3.2), 'lk-p')}${finger('lk-fm', 1)}`,
    init: (q) => ({ cam: q('lk-cam'), frame: q('lk-frame'), name: q('lk-name'), nameph: q('lk-nameph'), con: q('lk-con'), app: q('lk-app'), who: q('lk-whog'), whobg: q('lk-whobg'), role: q('lk-role'), pwho: q('lk-who'), f: q('lk-f'), fm: q('lk-fm'), hint: q('lk-hint') }),
    update: (t, r, q) => {
      // Kamera findet den Code: Rahmen atmet, Muster erscheint, Name wird eingetragen
      const breathe = 1 - .03 * Math.sin(t * 4); setT(r.frame, `translate(195 398) scale(${breathe.toFixed(3)}) translate(-195 -398)`);
      setO(r.cam, seg(t, .6, 1.2) * (1 - lin(t, 2.4, 2.7)));
      const nm = seg(t, 1.6, 2.1); setO(r.name, nm); setO(r.nameph, 1 - nm);
      // Antippen „Verbinden“, Wechsel ins Bedienfeld
      const go = tap(t, 2.5, .5); fingerAt(r.f, 195, 673, go);
      const sw = seg(t, 2.9, 3.3); setO(r.con, 1 - sw); setO(r.app, sw);
      // An der Station erscheint Anna; Antippen gibt die Steuerung frei
      setO(r.who, seg(t, 3.4, 3.9));
      const give = tap(t, 5.6, .6); fingerAt(r.fm, 14 + 230, 12 + 163, give);
      const on = t > 5.95; setF(r.whobg, on ? B : FILL); r.role.textContent = on ? 'steuert' : 'schaut zu'; r.role.setAttribute('fill', on ? 'rgba(255,255,255,.8)' : DIM);
      r.pwho.textContent = on ? 'Du steuerst' : 'Du schaust zu';
      setO(r.hint, on ? 0 : 1);
    } };

  // 4 · Draht führen: Wischen nach links schiebt, senkrecht torquet die Spitze in den Abgang
  SCENES.steer = { dur: 10,
    svg: () => `${monitor(14, 12, 296, 226, `<g transform="translate(-14,3)">${tree('rgba(255,255,255,.16)', 1)}<path id="st-trunk" d="${WIRE}" fill="none" stroke="none"/><path id="st-up" d="${UP}" fill="none" stroke="none"/><path id="st-dn" d="${DN}" fill="none" stroke="none"/>${path('', '#f2f2f7', 2.2, { id: 'st-wire' })}</g>${hud(296, 226, { br: 'ROADMAP' })}`, 'st-m')}
      ${phone(342, 16, .45, phoneUI({ pre: 'st-' }) + finger('st-f', 2.2), 'st-p')}`,
    init: (q) => ({ trunk: q('st-trunk'), up: q('st-up'), dn: q('st-dn'), wire: q('st-wire'), f: q('st-f'), dwire: q('st-dwire') }),
    update: (t, r, q) => {
      const u1 = seg(t, 1, 2.2), ut = seg(t, 3.6, 4.6), u2 = seg(t, 6.2, 7.6); const Lt = r.trunk.getTotalLength(), Lb = r.dn.getTotalLength();
      const L = Lt * (.6 + .36 * u1) + Lb * .8 * u2, ang = -.35 + 1.15 * ut;
      r.wire.setAttribute('d', wireD(r.trunk, ut > .5 ? r.dn : r.up, L, ang)); setO(r.wire, 1 - lin(t, 9.4, 9.8));
      const w1 = win(t, .8, 2.4), wt = win(t, 3.4, 4.8), w2 = win(t, 6, 7.8);
      if (wt) fingerAt(r.f, 195, 470 - 150 * ut, wt); else fingerAt(r.f, 265 - 170 * (w1 ? u1 : u2), 430, Math.max(w1, w2));
      r.dwire.setAttribute('x', 60 - 24 * (u1 + u2));
    } };

  // 5 · Bildgebung: KM füllt die Gefäße, Serie subtrahiert, Roadmap legt sie unters Livebild, C-Bogen dreht
  SCENES.imaging = { dur: 15,
    svg: () => `${monitor(14, 12, 330, 226, `<g id="im-rot"><g transform="translate(0,3)"><g id="im-road" opacity="0">${tree('rgba(255,255,255,.3)', 1)}</g>
        <g id="im-km">${tree('rgba(235,235,245,.9)', 1, '', { id: 'im-k', doff: 100 })}</g>
        <g id="im-dsa" opacity="0"><rect x="-10" y="-10" width="360" height="260" fill="#d6d6da"/>${tree('#111', 1, '', { id: 'im-d', doff: 100 })}</g>
        <path id="im-trunk" d="${WIRE}" fill="none" stroke="none"/><path id="im-up" d="${UP}" fill="none" stroke="none"/>${path('', '#f2f2f7', 2.2, { id: 'im-wire' })}</g></g>
        ${hud(330, 226, { tl: '', brId: 'im-mode', blId: 'im-ang' })}`, 'im-m')}
      <path d="M352 125 H392" stroke="rgba(10,132,255,.55)" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round" id="im-link"/>
      ${phone(404, 18, .2535, phoneUI({ pre: 'im-' }) + finger('im-f', 3.2), 'im-p')}`,
    init: (q) => ({ km: q('im-km'), dsa: q('im-dsa'), road: q('im-road'), trunk: q('im-trunk'), up: q('im-up'), wire: q('im-wire'), mode: q('im-mode'), ang: q('im-ang'), rot: q('im-rot'), f: q('im-f'), t1: q('im-img1'), t2: q('im-img2'), t3: q('im-img3'), lao: q('im-lao'), link: q('im-link') }),
    update: (t, r, q) => {
      // KM: Füllung 1,2–3,2 s, Auswaschen bis 4,8 s
      fillTree(q, 'im-k', seg(t, 1.2, 3.2), 1 - lin(t, 3.6, 4.8));
      // Serie: helles Bild mit schwarzen Gefäßen 5,2–8,6 s
      setO(r.dsa, win(t, 5.2, 8.8, .35)); fillTree(q, 'im-d', seg(t, 5.5, 7.4));
      // Roadmap ab 9,2 s, Draht läuft hinein
      setO(r.road, seg(t, 9.2, 9.8) * (1 - lin(t, 14.5, 14.9)));
      const Lt = r.trunk.getTotalLength(); r.wire.setAttribute('d', wireD(r.trunk, r.up, Lt * (.55 + .3 * seg(t, 10, 11.6)), .15)); setO(r.wire, (t < 5.2 || t > 8.8 ? 1 : 1 - win(t, 5.2, 8.8, .35)) * (1 - lin(t, 14.5, 14.9)));
      // C-Bogen: LAO 20° → 35°, das Bild dreht sich etwas
      const rot = seg(t, 12.2, 13.4); setT(r.rot, `translate(165 113) scale(${(1 - .12 * rot).toFixed(3)} 1) skewY(${(-4 * rot).toFixed(2)}) translate(-165 -113)`);
      const lao = Math.round(20 + 15 * rot); r.lao.textContent = `LAO ${lao}°`; r.ang.textContent = `LAO ${lao}° · CRAN 15°`;
      r.mode.textContent = t < 1 ? 'FLUORO' : t < 5.2 ? 'FLUORO · KM' : t < 8.8 ? 'DSA' : 'ROADMAP';
      // Kacheln und Finger: KM 1,0 · Serie 5,0 · Roadmap 9,0 · LAO+ 12,0
      setF(r.t1, win(t, .9, 3.4, .1) ? B : FILL); setF(r.t2, win(t, 4.9, 8.8, .1) ? B : FILL); setF(r.t3, t > 8.9 ? B : FILL);
      const taps = [[1, 132, 701], [5, 207, 701], [9, 282, 701], [12, 121, 762]]; let fo = 0, fx = 0, fy = 0;
      for (const [a, x, y] of taps) { const p = tap(t, a - .2, .6); if (p > fo) { fo = p; fx = x; fy = y; } } fingerAt(r.f, fx, fy, fo);
      r.link.setAttribute('stroke-dashoffset', (-t * 24).toFixed(1));
    } };

  // 6 · Behandeln: Coils ausschieben und ablösen, dann ein Stent über den Hals
  SCENES.treat = { dur: 14,
    svg: () => {
      // Sack als leicht unregelmäßige Form; Coils als vorgerechnete Schleifen darin
      const sac = 'M176 128 C150 126 138 108 140 86 C142 62 162 48 184 52 C206 56 220 76 214 98 C209 116 196 126 186 128 Z';
      const loops = (seed, n) => { let s = seed; const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647; const pts = []; for (let k = 0; k < n; k++) { const a = k * 2.4 + rnd() * .6, r = 8 + 16 * Math.sqrt(rnd()); pts.push([177 + r * Math.cos(a), 88 + r * .95 * Math.sin(a)]); } let d = `M178 112`; for (let k = 0; k < pts.length - 1; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[k + 1]; d += ` Q${x1.toFixed(1)} ${y1.toFixed(1)} ${((x1 + x2) / 2).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)}`; } return d; };
      const mesh = () => { let d = ''; for (let x = 112; x <= 236; x += 12) { d += `M${x} 118 L${x + 6} 138 M${x} 138 L${x + 6} 118 `; } return d; };
      return `${monitor(14, 12, 330, 226, `<g transform="translate(5,30)">${path('M0 148 C60 140 120 130 176 128 C230 126 270 134 330 150', 'rgba(255,255,255,.34)', 18)}${path('M166 128 h22 v-14 h-22z', 'rgba(255,255,255,.34)', 14, { fill: 'rgba(255,255,255,.34)' })}${path(sac, 'rgba(255,255,255,.34)', 2, { fill: 'rgba(255,255,255,.34)' })}
          <clipPath id="tr-clip"><rect id="tr-cr" x="240" y="110" width="0" height="36"/></clipPath><g clip-path="url(#tr-clip)"><g id="tr-stent" transform="translate(174 128) scale(1 .3) translate(-174 -128)">${path(mesh(), '#f2f2f7', 1.1)}${path('M112 118 H236 M112 138 H236', '#f2f2f7', 1.3)}</g></g>
          ${path('M0 150 C60 142 120 132 165 128 C176 122 173 108 178 100', '#d1d1d6', 3.5, { id: 'tr-mcA', pl: 100, da: 100 })}${path('M0 150 C60 142 120 132 176 128 C210 126 240 127 262 128', '#d1d1d6', 3.5, { id: 'tr-mcB', pl: 100, da: 100, doff: 100 })}
          ${path(loops(11, 26), B, 2.2, { id: 'tr-c1', pl: 100, da: 100, doff: 100 })}${path(loops(29, 26), B, 2.2, { id: 'tr-c2', pl: 100, da: 100, doff: 100 })}</g>${hud(330, 226, { br: 'ROADMAP', blId: 'tr-note' })}`, 'tr-m')}
        <path d="M352 125 H392" stroke="rgba(10,132,255,.55)" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round" id="tr-link"/>
        ${phone(404, 18, .2535, phoneUI({ pre: 'tr-', chips: [['Mikrokatheter', 'im Sack'], ['Coil', '3 mm × 6 cm']], active: 1, acts: true, hint: 'nach links = Coil ausschieben' }) + finger('tr-f', 3.2), 'tr-p')}`;
    },
    init: (q) => ({ c1: q('tr-c1'), c2: q('tr-c2'), mcA: q('tr-mcA'), mcB: q('tr-mcB'), cr: q('tr-cr'), stent: q('tr-stent'), act: q('tr-act'), f: q('tr-f'), note: q('tr-note'), chip0: q('tr-chip0'), chip1: q('tr-chip1'), link: q('tr-link') }),
    update: (t, r) => {
      // Coil 1: zwei Wischbewegungen 1–3,2 s, ablösen 3,7 s · Coil 2: 4,2–6,4 s, ablösen 6,9 s
      r.c1.style.strokeDashoffset = 100 - 100 * seg(t, 1, 3.2); r.c2.style.strokeDashoffset = 100 - 100 * seg(t, 4.2, 6.4);
      r.c1.setAttribute('stroke', t > 3.8 ? '#f2f2f7' : B); r.c2.setAttribute('stroke', t > 7 ? '#f2f2f7' : B);
      setF(r.act, tap(t, 3.6, .4) > .3 || tap(t, 6.8, .4) > .3 ? B : FILL);
      // Mikrokatheter: aus dem Sack ins Gefäß (7,4–8), dann über den Stent zurückziehen (8,6–10,6)
      const sw = seg(t, 7.4, 8); r.mcA.style.strokeDashoffset = 100 * sw * .4; setO(r.mcA, 1 - sw); setO(r.mcB, sw); r.mcB.style.strokeDashoffset = 0;
      const dep = seg(t, 8.6, 10.6); r.mcB.style.strokeDashoffset = 55 * dep; const x1 = 240 - 128 * dep; r.cr.setAttribute('x', x1.toFixed(1)); r.cr.setAttribute('width', (240 - x1).toFixed(1));
      setT(r.stent, `translate(174 128) scale(1 ${(.3 + .7 * seg(t, 8.6, 9.6)).toFixed(3)}) translate(-174 -128)`);
      setF(r.chip0, t > 7.4 ? B : FILL); setF(r.chip1, t > 7.4 ? FILL : B);
      r.note.textContent = t < 3.8 ? 'Coil 1 · 3 mm × 6 cm' : t < 7 ? 'Coil 2 · 2 mm × 4 cm' : t < 8.6 ? 'Stent · 4 × 20 mm' : dep < 1 ? `Stent ${Math.round(dep * 100)} %` : 'Stent entfaltet';
      // Finger: Wischen beim Coil, Tipp beim Ablösen, Rückzug nach rechts
      const sw1 = win(t, .9, 2.1), sw2 = win(t, 2.2, 3.3), sw3 = win(t, 4.1, 5.3), sw4 = win(t, 5.3, 6.5), back = win(t, 8.5, 10.7);
      const d1 = tap(t, 3.5, .5), d2 = tap(t, 6.7, .5);
      if (d1 || d2) fingerAt(r.f, 195, 566, Math.max(d1, d2));
      else if (back) fingerAt(r.f, 120 + 150 * seg(t, 8.6, 10.6), 400, back);
      else { const ws = [[sw1, seg(t, 1, 2.1)], [sw2, seg(t, 2.2, 3.3)], [sw3, seg(t, 4.1, 5.3)], [sw4, seg(t, 5.3, 6.5)]].find(w => w[0]); fingerAt(r.f, 265 - 170 * (ws ? ws[1] : 0), 400, ws ? ws[0] : 0); }
      r.link.setAttribute('stroke-dashoffset', (-t * 24).toFixed(1));
    } };

  // 7 · CT und Sono: Nadel in Schritten mit Dreischuss; Schallkopf, Kompression, Punktion
  SCENES.ctus = { dur: 12,
    svg: () => {
      const ct = `<g transform="translate(0,0)">${T(18, 24, 'CT', 9, DIM, { ls: 1.5, w: 700 })}<ellipse cx="150" cy="135" rx="124" ry="92" fill="#4a4a4e"/><ellipse cx="150" cy="135" rx="124" ry="92" fill="none" stroke="#8e8e93" stroke-width="1.2"/>
        <ellipse cx="104" cy="128" rx="62" ry="56" fill="#5a5a60"/><ellipse cx="222" cy="128" rx="22" ry="30" fill="#55555a"/><circle cx="150" cy="200" r="15" fill="#d8d8dc"/><circle cx="150" cy="176" r="8" fill="#7a7a80"/><rect x="128" y="186" width="44" height="10" rx="3" fill="#2e2e32"/>
        <circle cx="96" cy="116" r="10" fill="#2a2a2d" stroke="#6e6e73" stroke-width="1"/><circle cx="96" cy="116" r="3" fill="none" stroke="${ORANGE}" stroke-width="1.2"/>
        <g id="ct-needle">${path('M-54 0 H0', '#f2f2f7', 2.2)}${R(-74, -5, 22, 10, 3, B)}</g>
        <ellipse id="ct-flash" cx="150" cy="135" rx="124" ry="92" fill="#fff" opacity="0"/>
        ${[0, 1, 2].map(i => R(120 + i * 22, 236, 18, 5, 2, FILL, { id: 'ct-s' + i })).join('')}${T(206, 241, 'Dreischuss', 9, DIM, { id: 'ct-lbl', op: 0 })}${T(26, 241, '', 9, 'rgba(235,235,245,.6)', { mono: true, id: 'ct-mm' })}</g>`;
      const us = `<g transform="translate(300,0)">${T(18, 24, 'SONO', 9, DIM, { ls: 1.5, w: 700 })}<clipPath id="us-c"><path d="M150 18 L34 206 A160 160 0 0 0 266 206 Z"/></clipPath>
        <g clip-path="url(#us-c)"><rect width="300" height="250" fill="#1b1b1e"/>${[48, 78, 104, 140, 168].map((y, i) => `<path d="M0 ${y} Q150 ${y + (i % 2 ? 10 : -8)} 300 ${y}" stroke="rgba(255,255,255,${.06 + .03 * (i % 3)})" stroke-width="${6 + i * 2}" fill="none"/>`).join('')}
          <ellipse id="us-vein" cx="118" cy="146" rx="22" ry="15" fill="#070708"/><circle id="us-art" cx="172" cy="140" r="16" fill="#050506" stroke="rgba(255,255,255,.18)" stroke-width="1"/>
          ${path('M262 44 L172 140', '#f2f2f7', 2.2, { id: 'us-needle', pl: 100, da: 100, doff: 100 })}</g>
        <path d="M150 18 L34 206 A160 160 0 0 0 266 206 Z" fill="none" stroke="rgba(255,255,255,.14)"/>
        ${R(126, 10, 48, 10, 3, '#f2f2f7', { id: 'us-probe' })}${T(118, 222, 'V. femoralis', 8.5, DIM, { a: 'middle', id: 'us-lv' })}${T(172, 170, 'A. femoralis', 8.5, DIM, { a: 'middle' })}${T(150, 241, '', 9, RED, { mono: true, a: 'middle', id: 'us-note' })}</g>`;
      return ct + `<path d="M300 20 V232" stroke="rgba(255,255,255,.1)"/>` + us;
    },
    init: (q) => ({ needle: q('ct-needle'), flash: q('ct-flash'), s: [0, 1, 2].map(i => q('ct-s' + i)), lbl: q('ct-lbl'), mm: q('ct-mm'), vein: q('us-vein'), art: q('us-art'), un: q('us-needle'), probe: q('us-probe'), note: q('us-note') }),
    update: (t, r) => {
      // CT: Nadel von der Haut (70,64) zum Ziel (96,116) in vier Schritten, nach jedem ein Dreischuss
      const dir = [26, 52], n = Math.hypot(...dir), ux = dir[0] / n, uy = dir[1] / n, ang = Math.atan2(uy, ux) * 180 / Math.PI;
      const steps = [[1, 1.4], [2.6, 3], [4.2, 4.6], [5.8, 6.2]]; let depth = 0; steps.forEach(([a, b]) => depth += seg(t, a, b) * n / 4);
      setT(r.needle, `translate(${(70 + ux * depth).toFixed(1)} ${(64 + uy * depth).toFixed(1)}) rotate(${ang.toFixed(1)})`);
      const shots = [1.8, 3.4, 5, 6.6]; let fl = 0, lb = 0; r.s.forEach(e => setF(e, FILL));
      for (const a of shots) { for (let k = 0; k < 3; k++) { const p = tap(t, a + k * .14, .14); if (p > 0) { fl = Math.max(fl, p); setF(r.s[k], '#f2f2f7'); } } lb = Math.max(lb, win(t, a - .1, a + 1.2, .15)); }
      setO(r.flash, fl * .22); setO(r.lbl, lb);
      const left = Math.max(0, n - depth); r.mm.textContent = t < 1 ? 'Nadel an der Haut' : left < 1 ? 'Nadel im Ziel' : `noch ${Math.round(left * 1.2)} mm`;
      // Sono: Arterie pulsiert, Vene lässt sich wegdrücken, Nadel trifft die Arterie
      r.art.setAttribute('r', (16 + 1.3 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.1))).toFixed(2));
      const press = seg(t, 5.6, 6.4) * (1 - seg(t, 7.2, 7.8)); setT(r.vein, `translate(118 146) scale(1 ${(1 - .72 * press).toFixed(3)}) translate(-118 -146)`); r.probe.setAttribute('y', (10 + 4 * press).toFixed(1));
      r.un.style.strokeDashoffset = 100 - 100 * seg(t, 8, 9.8);
      const hit = t > 9.8 && t < 11.6; r.art.setAttribute('stroke', hit ? RED : 'rgba(255,255,255,.18)'); r.art.setAttribute('stroke-width', hit ? 1.8 : 1);
      r.note.textContent = press > .5 ? 'Vene komprimierbar' : hit ? 'pulsierendes Blut – arteriell' : ''; r.note.setAttribute('fill', hit ? RED : DIM);
    } };

  // 8 · Stand, Bilanz, Fortschritt: Haken erscheinen, Zahlen laufen hoch, Ziel erreicht, Feedback
  SCENES.progress = { dur: 10,
    svg: () => {
      const items = ['Mikrokatheter im Sack', 'Coils bis an den Hals', 'Kontrollserie ohne Einstrom', 'Keine Komplikation'];
      const rows = items.map((l, i) => `<g id="pr-r${i}" opacity=".35"><circle id="pr-k${i}" cx="48" cy="${74 + i * 28}" r="8" fill="${FILL}"/>${icon('check', 42, 68 + i * 28, 12, W, { id: 'pr-ck' + i, op: 0 })}${T(66, 78 + i * 28, l, 11, W)}</g>`).join('');
      const stat = (x, l, id) => R(x, 60, 92, 50, 12, CARD) + T(x + 12, 78, l, 8, DIM, { ls: 1, w: 700 }) + T(x + 12, 100, '0', 17, W, { w: 600, mono: true, id });
      return `${R(20, 18, 560, 214, 16, '#141416')}${icon('flag', 36, 30, 16, B)}${T(58, 43, 'Bilanz des Falls', 13, W, { w: 600 })}${T(176, 43, '· Aneurysma-Coiling, schmalhalsig', 11, DIM)}
        ${rows}${stat(330, 'ZEIT', 'pr-time')}${stat(430, 'DOSIS mGy', 'pr-dose')}${R(530, 60, 40, 50, 12, CARD)}${T(542, 78, 'KM', 8, DIM, { ls: 1, w: 700 })}${T(542, 100, '0', 17, W, { w: 600, mono: true, id: 'pr-km' })}
        ${T(330, 136, 'MODUL 2 · AKADEMIE', 8, DIM, { ls: 1, w: 700 })}${R(330, 144, 240, 8, 4, FILL)}${R(330, 144, 0, 8, 4, GREEN, { id: 'pr-bar' })}${T(330, 170, '2 von 5 Fällen', 10, 'rgba(235,235,245,.7)', { id: 'pr-cnt' })}
        <g id="pr-goal" opacity="0" transform="translate(330 190)">${R(0, 0, 124, 28, 10, 'rgba(48,209,88,.18)')}${icon('check', 10, 8, 13, GREEN)}${T(28, 19, 'Ziel erreicht', 11, GREEN, { w: 600 })}</g>
        <g id="pr-fb" opacity="0" transform="translate(470 190)">${R(0, 0, 100, 28, 10, FILL)}${icon('chat', 10, 8, 13)}${T(28, 19, 'Feedback', 11, W, { w: 590 })}</g>`;
    },
    init: (q) => ({ r: [0, 1, 2, 3].map(i => q('pr-r' + i)), k: [0, 1, 2, 3].map(i => q('pr-k' + i)), ck: [0, 1, 2, 3].map(i => q('pr-ck' + i)), time: q('pr-time'), dose: q('pr-dose'), km: q('pr-km'), bar: q('pr-bar'), cnt: q('pr-cnt'), goal: q('pr-goal'), fb: q('pr-fb') }),
    update: (t, r) => {
      [0, 1, 2, 3].forEach(i => { const u = seg(t, .8 + i * .9, 1.2 + i * .9); setO(r.r[i], .35 + .65 * u); setF(r.k[i], u > .5 ? GREEN : FILL); setO(r.ck[i], u > .5 ? 1 : 0); });
      const c = seg(t, .6, 4.4); const sec = Math.round(760 * c); r.time.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; r.dose.textContent = String(Math.round(240 * c)); r.km.textContent = String(Math.round(38 * c));
      const b = seg(t, 5, 6); r.bar.setAttribute('width', (240 * (.4 + .2 * b)).toFixed(1)); r.cnt.textContent = b > .5 ? '3 von 5 Fällen' : '2 von 5 Fällen';
      const g = seg(t, 6.6, 7.1); setO(r.goal, g); setT(r.goal, `translate(330 ${(196 - 6 * g).toFixed(1)})`);
      const f = seg(t, 8, 8.5); setO(r.fb, f); setT(r.fb, `translate(${(480 - 10 * f).toFixed(1)} 190)`);
    } };

  // ---------- Abspielen ----------
  let raf = 0, cur = null;
  function play(name, el) {
    stop(); const sc = SCENES[name]; if (!sc || !el) return;
    el.innerHTML = `<svg viewBox="0 0 600 250" width="100%" height="100%" aria-hidden="true">${sc.svg()}</svg>`;
    const q = (id) => el.querySelector('#' + id); const r = sc.init(q); const t0 = performance.now();
    cur = { sc, r, q, t0 };
    const frame = (now) => { if (!cur) return; const t = ((now - t0) / 1000) % sc.dur; try { sc.update(t, r, q); } catch (e) { console.error(e); cur = null; return; } raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; cur = null; }
  // Einzelbild zu einer festen Zeit (für Tests und Vorschauen)
  function seek(name, el, t) { stop(); const sc = SCENES[name]; if (!sc || !el) return; el.innerHTML = `<svg viewBox="0 0 600 250" width="100%" height="100%" aria-hidden="true">${sc.svg()}</svg>`; const q = (id) => el.querySelector('#' + id); sc.update(t % sc.dur, sc.init(q), q); }
  window.CathSimIntro = { play, stop, seek, scenes: Object.keys(SCENES) };
})();
