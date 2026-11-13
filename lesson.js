// Lehrmodul „Akuter Schlaganfall“: ein Foliensatz in der Station – animierte Szenen (SVG, eine Zeitleiste je Folie),
// synthetische Schnittbilder (CT, CT-Perfusion, MRT; im Browser gerechnet, kein Patientenbild), Abstimmungen über
// die verbundenen Handys und am Ende der Thrombektomie-Fall zum Selbstbehandeln (Start mit dem Katheter in der ACI).
// Stil wie der Rest: Schwarz, Systemblau, flache Karten.
(function () {
  const B = '#0a84ff', CARD = '#1c1c1e', DIM = '#8e8e93', FILL = 'rgba(118,118,128,.24)', W = '#fff', GREEN = '#30d158', ORANGE = '#ff9f0a', RED = '#ff453a';
  const F = "-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif", MONO = "ui-monospace,'SF Mono',Menlo,monospace";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lin = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const ease = (u) => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, seg = (t, a, b) => ease(lin(t, a, b));
  const win = (t, a, b, f = .3) => t < a || t > b ? 0 : Math.min(1, (t - a) / f, (b - t) / f);
  const esc = (t) => String(t).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const at = (o) => Object.entries(o || {}).filter(([, v]) => v != null && v !== '').map(([k, v]) => ` ${k}="${v}"`).join('');
  const T = (x, y, s, size, col = W, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" fill="${col}" font-family="${o.mono ? MONO : F}" font-weight="${o.w || 400}" text-anchor="${o.a || 'start'}"${at({ id: o.id, opacity: o.op, 'letter-spacing': o.ls })}>${s}</text>`;
  const R = (x, y, w, h, r, fill, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${at({ id: o.id, stroke: o.stroke, 'stroke-width': o.sw, opacity: o.op })}/>`;
  const P = (d, col, w, o = {}) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="${o.fill || 'none'}" stroke-linecap="round" stroke-linejoin="round"${at({ id: o.id, opacity: o.op, 'stroke-dasharray': o.da, pathLength: o.pl, 'stroke-dashoffset': o.doff })}/>`;
  const setO = (e, v) => e && e.setAttribute('opacity', clamp(v, 0, 1).toFixed(3));

  // ---------- Synthetische Schnittbilder ----------
  // Ein axialer Schnitt durch das Großhirn auf Höhe der Stammganglien. Bildlinks = Patient rechts; der Befund liegt im
  // Mediastromgebiet rechts. mod: ct | dwi | adc | flair | cbf | cbv | tmax; les: none | early | dense | late | bleed | stroke
  const IMG = {};
  // Farbskala der Perfusionskarten: schwarz → blau → türkis → grün → gelb → rot
  const pcol = (v) => { v = clamp(v, 0, 1); const st = [[0, 0, 0, 0], [.12, 10, 20, 150], [.3, 0, 120, 255], [.45, 0, 210, 190], [.6, 60, 220, 40], [.78, 255, 235, 0], [1, 255, 30, 0]];
    for (let k = 1; k < st.length; k++) if (v <= st[k][0]) { const a = st[k - 1], b = st[k], t = (v - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; } return [255, 30, 0]; };
  // Wertrauschen und fraktale Summe – daraus entstehen Windungen, Furchen und unregelmäßige Befundgrenzen
  const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, a = xf * xf * (3 - 2 * xf), b = yf * yf * (3 - 2 * yf);
    return (h2(xi, yi) * (1 - a) + h2(xi + 1, yi) * a) * (1 - b) + (h2(xi, yi + 1) * (1 - a) + h2(xi + 1, yi + 1) * a) * b; };
  const fbm = (x, y, o = 4) => { let v = 0, am = .5, f = 1; for (let k = 0; k < o; k++) { v += am * vn(x * f, y * f); f *= 2.03; am *= .5; } return v / (1 - Math.pow(.5, o)); };
  const NA = 384; let AN = null;
  // Anatomie eines axialen Schnitts auf Höhe der Stammganglien, einmal gerechnet: Gewebeanteile je Bildpunkt.
  // Bildlinks = Patient rechts. Kalotte mit Diploe, Kopfschwarte, Liquorräume, Rinde entlang der Furchen, Insel und
  // Sylvische Fissur, Stammganglien, Thalamus, Ventrikel mit Plexusverkalkung, Falx.
  function anatomy() {
    if (AN) return AN; const N = NA, n2 = N * N;
    const A = { scalp: new Float32Array(n2), fat: new Float32Array(n2), bone: new Float32Array(n2), dip: new Float32Array(n2), csf: new Float32Array(n2), gm: new Float32Array(n2), brain: new Float32Array(n2), calc: new Float32Array(n2), falx: new Float32Array(n2), ves: new Float32Array(n2), terr: new Float32Array(n2), core: new Float32Array(n2), bleed: new Float32Array(n2), edema: new Float32Array(n2), lf: new Float32Array(n2) };
    for (const k of ['ivh', 'edh', 'sdh', 'sab', 'tsab', 'cont', 'contb', 'tum', 'tnec', 'ring', 'ted']) A[k] = new Float32Array(n2);
    const adiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
    const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
    const el = (u, v, cx, cy, rx, ry, rot = 0) => { const c = Math.cos(rot), s2 = Math.sin(rot), x = (u - cx) * c + (v - cy) * s2, y = -(u - cx) * s2 + (v - cy) * c; return Math.sqrt((x / rx) ** 2 + (y / ry) ** 2); };
    const ins = (d, w = .12) => 1 - ss(1 - w, 1 + w, d);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      // der Kopf liegt nie ganz gerade: 2,5° gedreht, 1 % nach rechts versetzt
      const u0 = x / N - .5 - .008, v0 = y / N - .5, cr = Math.cos(.044), sr = Math.sin(.044);
      const u = u0 * cr + v0 * sr, v = -u0 * sr + v0 * cr, i = y * N + x, au = Math.abs(u), sg = u < 0 ? -1 : 1;
      // Kopfumriss: Ei, hinten etwas breiter
      const ang0 = Math.atan2(v, u);
      const e = Math.sqrt((u / (.405 * (1 + .1 * v))) ** 2 + ((v - .005) / .468) ** 2) * (1 + .012 * Math.sin(ang0 * 3 + .7));
      if (e > 1.0) continue;
      // Kalotte: frontal und okzipital dicker, innen leicht wellig; Crista frontalis und Protuberantia occipitalis interna
      const sa = Math.abs(Math.sin(ang0));
      const inner = .886 - .026 * Math.pow(sa, 5) + .004 * Math.sin(ang0 * 9 + 1) - .03 * (1 - ss(.0, .02, au)) * ss(.9, 1, sa);
      const asym = .012 * fbm(u * 5 + 3, v * 5 + 9, 2);
      // Schichten von außen: Haut, Fett, Tabula externa, Diploe, Tabula interna
      A.scalp[i] = ss(1.0, .992, e) * (1 - ss(.958, .95, e));
      A.fat[i] = ss(.99, .98, e) * (1 - ss(.962, .955, e));
      const bone = ss(.955, .947, e) * (1 - ss(inner, inner - .008, e)); A.bone[i] = bone;
      A.dip[i] = bone * ss(.936, .928, e) * (1 - ss(inner + .024, inner + .016, e)) * (.55 + .45 * fbm(u * 60, v * 60, 2));
      if (e > inner) continue;
      // Hirn: Oberfläche leicht wellig, darunter Furchen als feine, verzweigte Liquorlinien
      const wx = au + asym, wy = v + asym * .7;
      const warp = fbm(wx * 6 + 11, wy * 6 + 5, 3) - .5;
      const rn = fbm(wx * 10.5 + warp * 3.6 + 2, wy * 10.5 + warp * 3.6 + 7, 3);       // Windungsmuster
      const surf = inner - .014 - .012 * fbm(wx * 20, wy * 20, 2);
      const depth = surf - e;                                                           // > 0 im Hirn
      const ridge = Math.abs(rn - .5);
      const reach = .11 + .2 * fbm(wx * 9 + 4, wy * 9, 2);                               // wie tief die Furchen reichen
      const tw = ss(reach, 0, depth);                                                    // 1 an der Oberfläche, 0 am Furchengrund
      const sulc = (1 - ss(.006 + .05 * tw * tw, .022 + .085 * tw, ridge)) * ss(reach, reach * .55, depth) * ss(-.005, .012, depth) * ss(.012, .045, au) * .82;
      const sub = ss(.006, -.004, depth);                                               // Subarachnoidalraum
      // Mittellinie: Interhemisphärenspalt vorn und hinten mit Falx
      const fiss = (1 - ss(.002, .006, au)) * Math.max(ss(-.09, -.13, v), ss(.2, .24, v)) * ss(-.01, .02, depth + .05);
      A.falx[i] = (1 - ss(.0015, .0045, au)) * Math.max(ss(-.1, -.14, v), ss(.21, .25, v));
      // Sylvische Fissur und Inselzisterne
      const sylT = clamp((au - .2) / .14, 0, 1), sylY = -.035 - .05 * sylT + .012 * Math.sin(au * 60);
      const syl = au > .195 && au < .345 ? (1 - ss(.005, .011, Math.abs(v - sylY))) : 0;
      const insc = (1 - ss(.004, .009, Math.abs(au - (.198 + .012 * Math.sin(v * 40))))) * ss(-.125, -.105, v) * (1 - ss(.075, .095, v));
      // Kerne: Caudatuskopf wölbt sich von lateral ins Vorderhorn, Linsenkern keilförmig, Thalamus
      const caud = ins(el(au, v, .072, -.088, .027, .05, .3), .18);
      const lent = ins(el(au, v, .142 - (v + .03) * .12, -.03, .036 * (1 - (v + .03) * 2.2), .08, .14), .16) * ss(.098, .108, au);
      const thal = ins(el(au, v, .056, .052, .038, .054, -.22), .18);
      // Ventrikel: Vorderhörner als Schmetterling (medial das Septum, lateral vom Caudatus eingedellt), Foramen Monroi,
      // III. Ventrikel als Schlitz, Trigonum und Hinterhorn gebogen
      const fhA = Math.max(ins(el(au, v, .034, -.108, .026, .058, .55), .16), ins(el(au, v, .022, -.062, .019, .04, .1), .2));
      const fh = fhA * ss(.0025, .006, au) * (1 - caud * .95);
      const v3 = Math.max(ins(el(u, v, 0, .03, .0065, .05), .3), ins(el(au, v, .012, -.022, .012, .008), .4));
      const oh = Math.max(ins(el(au, v, .104, .128, .021, .046, -.55), .2), ins(el(au, v, .137, .178, .012, .04, -.32), .25));
      const vent = Math.max(fh, v3, oh);
      // Capsula interna (vorderer und hinterer Schenkel mit Knie) und Capsula externa: Markstreifen zwischen den Kernen
      const dseg = (ax, ay, bx, by) => { const px = au - ax, py = v - ay, dx = bx - ax, dy = by - ay, t = clamp((px * dx + py * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(px - dx * t, py - dy * t); };
      const caps = Math.max(1 - ss(.006, .013, dseg(.058, -.135, .098, -.03)), 1 - ss(.007, .014, dseg(.098, -.03, .135, .085)), (1 - ss(.003, .007, dseg(.172, -.1, .176, .06))) * .7);
      const csf = clamp(Math.max(sulc, sub, fiss, syl, insc, vent), 0, 1);
      // Graue Substanz: Rinde folgt Oberfläche und Furchen; tief Caudatus, Linsenkern, Thalamus, Inselrinde
      const cortex = Math.max(ss(.06, .034, depth), (1 - ss(.05 + .06 * tw, .1 + .08 * tw, ridge)) * ss(reach + .035, reach - .02, depth), (1 - ss(.012, .022, au)) * Math.max(ss(-.09, -.13, v), ss(.2, .24, v)));
      const insgm = (1 - ss(.008, .016, Math.abs(au - .184))) * ss(-.12, -.1, v) * (1 - ss(.07, .09, v));
      const gm = clamp(Math.max(cortex, Math.max(caud * .8, lent * .72, thal * .62) * (1 - caps), insgm), 0, 1) * (1 - csf);
      A.lf[i] -= caps * .35 * (1 - csf);
      A.csf[i] = csf; A.gm[i] = gm; A.brain[i] = 1; A.lf[i] += fbm(u * 3 + 1, v * 3 + 2, 2) - .5;
      // Verkalkungen: Plexus im Trigonum, Glandula pinealis
      A.calc[i] = Math.max(ins(el(au, v, .1 + .004 * sg, .135, .006, .008), .4), ins(el(u, v, .003, .088, .005, .005), .4));
      // Gefäße in den Karten: Sylvische Äste und Oberflächengefäße
      A.ves[i] = Math.max(syl * .8, insc * .7, sub * (fbm(u * 40, v * 40, 2) > .62 ? .9 : 0));
      // Befunde. Rechts (bildlinks): Mediastromgebiet als Keil mit unregelmäßigem Rand, Kern um Insel und Linsenkern
      const irr = fbm(u * 9 + 5, v * 9 + 1, 3) - .5;
      if (u < 0) {
        const a2 = Math.atan2(v + .02, -(u + .03));
        A.terr[i] = ss(-.045, -.085, u + irr * .03) * (1 - ss(.74, .98, Math.abs(a2 + .08) + irr * .55)) * (1 - thal) * (1 - vent);
        A.core[i] = ins(el(u, v, -.158 + irr * .03, -.03, .07, .098) + irr * .5, .2) * (1 - vent);
      } else {
        // Stammganglienblutung links (bildrechts) mit Ödemsaum
        const hb = el(u, v, .128, -.02, .062, .082, -.15) + (fbm(u * 14 + 3, v * 14, 3) - .5) * .7;
        A.bleed[i] = (1 - ss(.9, 1.02, hb)) * (1 - vent * .6); A.edema[i] = (1 - ss(1.05, 1.5, hb)) * (1 - A.bleed[i]);
        // Raumforderung parietal links: Randsaum, Nekrose, fingerförmiges Marklagerödem (Rinde ausgespart)
        const td = el(u, v, .23, .2, .05, .046, .4) + irr * .35;
        A.tum[i] = 1 - ss(.9, 1.05, td); A.tnec[i] = 1 - ss(.4, .68, td); A.ring[i] = (1 - ss(.1, .24, Math.abs(td - .84)));
        const te = el(u, v, .21, .165, .15, .19, .2) + (fbm(u * 8 + 7, v * 8 + 3, 3) - .5) * 1.1;
        A.ted[i] = (1 - ss(.8, 1.1, te)) * (1 - cortex) * (1 - A.tum[i]) * (1 - vent);
      }
      // Blutspiegel in den Hinterhörnern (Ventrikeleinbruch)
      A.ivh[i] = oh * ss(.15, .175, v);
      // Epidural rechts temporoparietal: bikonvexe Linse an der Tabula interna
      { const dd = adiff(ang0, 2.75) / .4, th = Math.abs(dd) < 1 ? .15 * (1 - dd * dd) : 0; A.edh[i] = th > 0 ? ss(inner - th - .006, inner - th + .006, e) : 0; }
      // Subdural links frontotemporal: Sichel entlang der Konvexität
      { const dd = adiff(ang0, -.35) / 1.25, th = Math.abs(dd) < 1 ? .085 * Math.pow(1 - dd * dd, .6) : 0; A.sdh[i] = th > 0 ? ss(inner - th - .005, inner - th + .005, e) : 0; }
      // Subarachnoidal: Blut statt Liquor in Sylvischer Fissur, Inselzisterne, Interhemisphärenspalt und einem Teil der Furchen
      if (csf > .02) {
        A.sab[i] = clamp(Math.max(syl, insc, fiss, sulc * ss(.4, .5, fbm(u * 7 + 2, v * 7 + 4, 2))) / csf, 0, 1);
        A.tsab[i] = clamp(Math.max(sulc, sub, syl) * ss(.05, .15, u) * ss(.1, -.05, v) / csf, 0, 1);
      }
      // Kontusionen: frontopolar beidseits und temporal links – Blut und Ödem gesprenkelt
      { const cm = Math.max(ins(el(u, v, .075, -.33, .07, .06) + irr * .6, .2), ins(el(u, v, -.07, -.34, .05, .045) + irr * .6, .2), ins(el(u, v, .29, -.02, .045, .065) + irr * .6, .2));
        A.cont[i] = cm; A.contb[i] = cm * ss(.52, .6, fbm(u * 62 + 1, v * 62 + 8, 2)) * ss(.35, .7, cm); }
    }
    return (AN = A);
  }
  // Ein Bild aus der Anatomie: mod ct | dwi | adc | flair | cbf | cbv | tmax; les none | early | dense | stroke | late | bleed | edh | sdh | sab | trauma | tumor | tumorkm
  function brain(mod, les, g) {
    const key = mod + '|' + les + (g == null ? '' : '|' + g); if (IMG[key]) return IMG[key];
    const A = anatomy(), N = NA, cv = document.createElement('canvas'); cv.width = cv.height = N; const c = cv.getContext('2d'), im = c.createImageData(N, N), d = im.data;
    let sd = 7 + mod.length * 13; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) * 1.2;
    const map = mod === 'cbf' || mod === 'cbv' || mod === 'tmax', mix = (a, b, t) => a + (b - a) * t;
    const isch = les === 'early' || les === 'dense' || les === 'stroke', anyStroke = isch || les === 'late';
    // Wachstum (g = 0…1): die Blutung nimmt Raum ein und schiebt das Hirn vor sich her. SRC sagt für jeden Bildpunkt,
    // welche Stelle der unverdrängten Anatomie dort jetzt liegt; HEM ist der Blutanteil, EDM der Ödemsaum.
    let SRC = null, HEM = null, EDM = null; const G = g == null ? 1 : g;
    if (g != null && (les === 'edh' || les === 'sdh' || les === 'bleed')) {
      SRC = new Int32Array(N * N); HEM = new Float32Array(N * N); EDM = new Float32Array(N * N);
      const cr = Math.cos(.044), sr = Math.sin(.044), ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      for (let j = 0; j < N * N; j++) {
        SRC[j] = j; if (!A.brain[j] || g <= 0) continue;
        const u0 = (j % N) / N - .5 - .008, v0 = ((j / N) | 0) / N - .5, u = u0 * cr + v0 * sr, v = -u0 * sr + v0 * cr; let us = u, vs = v;
        if (les === 'bleed') {
          // radial: Fläche bleibt erhalten, das Gewebe weicht nach außen
          const cx = .128, cy = -.02, ex = u - cx, ey = (v - cy) * .78, dd = Math.hypot(ex, ey) || 1e-6, R = .088 * g * (1 + .22 * (fbm(ex / dd * 2 + 5, ey / dd * 2 + 3, 2) - .5));
          HEM[j] = 1 - ss(R - .006, R + .004, dd); EDM[j] = (1 - ss(R + .012 * g, R + .05 * g + .002, dd)) * (1 - HEM[j]);
          const k = dd > R ? Math.sqrt(dd * dd - R * R) / dd : 0; us = cx + ex * k; vs = cy + ey * k / .78;
        } else {
          // Zeile für Zeile: das Hämatom liegt an der Kalotte, das Hirn wird zur Gegenseite gestaucht – die Mittellinie wandert
          const side = les === 'edh' ? -1 : 1, q0 = ((v - .005) / .468), xr = .405 * (1 + .1 * v) * Math.sqrt(Math.max(0, .868 * .868 - q0 * q0));
          const q = les === 'edh' ? (v - .13) / .2 : (v + .06) / .36, T = Math.abs(q) < 1 ? (les === 'edh' ? .15 * (1 - q * q) : .075 * Math.pow(1 - q * q, .6)) * g : 0;
          if (xr > .02 && T > 0) { const sc = side * u; HEM[j] = ss(xr - T - .004, xr - T + .004, sc); const s2 = -xr + (sc + xr) * (2 * xr) / (2 * xr - T); us = side * Math.min(s2, xr); }
        }
        const xs = Math.round((us * cr - vs * sr + .508) * N), ys = Math.round((us * sr + vs * cr + .5) * N), js = clamp(ys, 0, N - 1) * N + clamp(xs, 0, N - 1);
        if (A.brain[js]) SRC[j] = js;
      }
    }
    for (let j = 0; j < N * N; j++) {
      const i = SRC ? SRC[j] : j, xx = j % N, yy = (j / N) | 0;
      const o = j * 4; d[o + 3] = 255; const br = A.brain[i], csf0 = A.csf[i], gm = A.gm[i], terr = A.terr[i], core = A.core[i];
      let g = 0, col = null;
      if (mod === 'ct') {
        // Hounsfield-Werte, Fenster W 80 / L 35
        let hu = -1000;
        if (A.scalp[i] > 0) hu = mix(-1000, mix(35, -85, A.fat[i]), A.scalp[i]);
        if (A.bone[i] > 0) hu = mix(hu, mix(1300, 520, A.dip[i]), A.bone[i]);
        if (br) {
          let csf = csf0;
          if (les === 'late') csf = csf * (1 - .85 * terr);                              // Furchen im Infarkt verstrichen
          const bld = HEM && les === 'bleed' ? HEM[j] : A.bleed[i], edm = HEM && les === 'bleed' ? EDM[j] : A.edema[i];
          if (les === 'bleed') csf = csf * (1 - .6 * edm);
          const tumor = les === 'tumor' || les === 'tumorkm';
          if (tumor) csf = csf * (1 - .7 * A.ted[i]);
          const sabw = g == null ? 1 : 1 - clamp((Math.hypot(xx / N - .508, yy / N - .46) - G * .5 + .05) / .05, 0, 1);
          const csfHU = les === 'sab' ? mix(9, 57, A.sab[i] * sabw) : les === 'trauma' ? mix(9, 55, A.tsab[i] * Math.min(1, G * 1.5)) : 9;
          hu = mix(mix(28, 36, gm), csfHU, csf) + A.lf[i] * 3;
          if (isch) hu = mix(hu, mix(28.5, 14, csf), core * (1 - csf * .5) * .92);       // Rinde und Mark nicht mehr zu trennen
          if (les === 'late') hu = mix(hu, 19 + A.lf[i] * 7, terr * .95);
          if (les === 'bleed') { hu = mix(hu, 19, edm * .9); hu = mix(hu, 68 + A.lf[i] * 8, bld); }
          if (les === 'bleed' || les === 'sab') hu = mix(hu, 62, A.ivh[i] * (les === 'sab' ? .7 : 1) * clamp((G - .7) / .3, 0, 1));
          if (les === 'edh') hu = mix(hu, 67 + A.lf[i] * 7, HEM ? HEM[j] : A.edh[i]);
          if (les === 'sdh') hu = mix(hu, 66 + A.lf[i] * 9, HEM ? HEM[j] : A.sdh[i]);
          if (les === 'trauma') { const cg = clamp((A.cont[i] - (1 - G) * .9) / .25, 0, 1); hu = mix(hu, 20, A.cont[i] * .85 * Math.min(1, G * 2) * cg); hu = mix(hu, 68, A.contb[i] * cg * Math.min(1, G * 1.4)); }
          if (tumor) { hu = mix(hu, 16, A.ted[i] * .9); hu = mix(hu, 40, A.tum[i]); hu = mix(hu, 24, A.tnec[i]); if (les === 'tumorkm') { hu = mix(hu, 82, A.ring[i]); hu += A.ves[i] * 28 + A.falx[i] * 22; } }
          hu = mix(hu, 48, A.falx[i] * .8); hu = mix(hu, 320, A.calc[i]);
        }
        hu += gauss() * (br ? 5.5 : 9) + (vn(xx / 1.9 + 31, yy / 1.9 + 7) - .5) * (br ? 15 : 16) + (vn(xx / 5.5 + 3, yy / 5.5 + 19) - .5) * 5;
        g = (hu + 5) / 80 * 255;
      } else if (!map) {
        const fat = A.fat[i] * A.scalp[i], skin = A.scalp[i] * (1 - A.fat[i]);
        if (!br && mod === 'adc') g = (A.scalp[i] + A.bone[i] > .2) ? (h2(xx * 1.3, yy * 1.7) > .45 ? 150 + 90 * h2(yy, xx) : 10) : 0;
        else if (!br) g = mod === 'flair' ? fat * 215 + skin * 70 + A.dip[i] * A.bone[i] * 120 : (mod === 'dwi' ? fat * 30 + skin * 18 : fat * 40 + skin * 30);
        else if (mod === 'dwi') { g = mix(mix(74, 88, gm), 10, csf0) + A.lf[i] * 14; if (anyStroke) g = mix(g, 205 + 50 * gm + A.lf[i] * 60, core * (1 - csf0 * .8)); }
        else if (mod === 'adc') { g = mix(mix(100, 110, gm), 240, csf0) + A.lf[i] * 8; if (anyStroke) g = mix(g, 46 + A.lf[i] * 30, core * (1 - csf0)); }
        else { g = mix(mix(104, 146, gm), 16, csf0) + A.lf[i] * 10; if (les === 'late') g = mix(g, 214, core * (1 - csf0 * .6)); }
        g += gauss() * (mod === 'dwi' ? 9 : 5) + (vn(xx / 2.2 + 5, yy / 2.2 + 11) - .5) * (mod === 'dwi' ? 16 : 9) + (br ? 0 : Math.abs(gauss()) * 5);
      } else {
        // grobe Matrix (128 × 128): alle Bildpunkte eines Blocks tragen den Wert der Blockmitte, stark gesprenkelt
        const xb = Math.min(N - 1, ((xx / 3) | 0) * 3 + 1), yb = Math.min(N - 1, ((yy / 3) | 0) * 3 + 1), ib = yb * N + xb;
        if (A.brain[ib]) {
          const cs = A.csf[ib], gmb = A.gm[ib], tb = A.terr[ib], cb = A.core[ib], r1 = h2(xb * .37 + 3, yb * .53 + (mod.length + mod.charCodeAt(1)) * 7), r2 = h2(xb * .91 + 11, yb * .29 + 5), lfb = A.lf[ib];
          let val;
          if (mod === 'cbf') val = mix(mix(.28, .6, gmb), .05, cs) * (.45 + 1.1 * r1) + A.ves[ib] * .5 + (r2 > .93 ? .3 : 0);
          else if (mod === 'cbv') val = mix(mix(.27, .55, gmb), .05, cs) * (.45 + 1.1 * r1) + A.ves[ib] * .65 + (r2 > .9 ? .35 : 0);
          else val = (.14 + .05 * gmb) * (.4 + 1.2 * r1) * (1 - cs * .5) + lfb * .06;
          if (les !== 'none') {
            if (mod === 'cbf') { val = mix(val, val * .3, tb); val = mix(val, .05 * (.4 + r1), cb); }
            else if (mod === 'cbv') { val = mix(val, Math.min(.98, val * 1.15), tb * (1 - cb)); val = mix(val, .07 * (.4 + r1), cb); }
            else { val = mix(val, (.5 + lfb * .3) * (.55 + .9 * r1), tb * (1 - cs * .4)); val = mix(val, .8 + .2 * r1, cb); }
          }
          col = pcol(val);
        }
      }

      if (col) { d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; } else d[o] = d[o + 1] = d[o + 2] = clamp(g, 0, 255);
    }
    // hyperdenses Mediazeichen: der Thrombus im M1-Segment, leicht gebogen im Sylvischen Stamm
    c.putImageData(im, 0, 0);
    if (mod === 'ct' && (les === 'dense' || les === 'stroke')) { c.strokeStyle = 'rgba(232,232,232,.95)'; c.lineWidth = N * .012; c.lineCap = 'round'; c.beginPath(); c.moveTo(N * .385, N * .462); c.quadraticCurveTo(N * .35, N * .452, N * .312, N * .458); c.stroke(); }
    // Rekonstruktionskern / Auflösung: CT leicht weich, DWI und Karten deutlich gröber
    const blur = mod === 'ct' ? 1.05 : mod === 'dwi' || mod === 'adc' ? 2.0 : mod === 'flair' ? 1.0 : 1.1;
    const c2 = document.createElement('canvas'); c2.width = c2.height = N; const x2 = c2.getContext('2d'); x2.fillStyle = '#000'; x2.fillRect(0, 0, N, N); x2.filter = `blur(${blur}px)`; x2.drawImage(cv, 0, 0); x2.filter = 'none';
    if (mod === 'ct') { x2.strokeStyle = 'rgba(150,150,150,.75)'; x2.lineWidth = N * .009; x2.beginPath(); x2.arc(N * .5, N * .47, N * .5, Math.PI * .22, Math.PI * .78); x2.stroke(); }   // Kopfschale
    // Bildbeschriftung wie am Gerät
    x2.font = `${Math.round(N * .026)}px ui-monospace, Menlo, monospace`; x2.fillStyle = 'rgba(255,255,255,.55)'; x2.textAlign = 'right';
    const tag = { ct: ['W 80  L 35', '5.0 mm · 120 kV'], dwi: ['b = 1000', '5.0 mm · 3 T'], adc: ['ADC', '5.0 mm · 3 T'], flair: ['TR 9000 TE 120', 'TI 2500'], cbf: ['CBF ml/100 g/min', '0 – 80'], cbv: ['CBV ml/100 g', '0 – 6'], tmax: ['Tmax s', '0 – 12'] }[mod];
    if (g == null) { x2.fillText(tag[0], N - 8, N - 22); x2.fillText(les === 'tumorkm' ? '5.0 mm · KM i.v.' : tag[1], N - 8, N - 8); }
    if (map) { for (let k = 0; k < 60; k++) { const cc = pcol(1 - k / 59); x2.fillStyle = `rgb(${cc[0] | 0},${cc[1] | 0},${cc[2] | 0})`; x2.fillRect(N - 16, N * .3 + k * (N * .3 / 60), 7, N * .3 / 60 + 1); } }
    return (IMG[key] = g == null ? c2.toDataURL() : c2.toDataURL('image/jpeg', .86));
  }
  const slice = (x, y, s, mod, les, label, o = {}) => `<g${at({ id: o.id, opacity: o.op })}><clipPath id="cl${o.id || (mod + les + x)}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14"/></clipPath><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14" fill="#000"/><image href="${brain(mod, les)}" x="${x}" y="${y}" width="${s}" height="${s}" clip-path="url(#cl${o.id || (mod + les + x)})"/>${T(x + 12, y + 20, label, 11, 'rgba(255,255,255,.75)', { w: 600 })}${T(x + 10, y + s / 2 + 4, 'R', 10, 'rgba(255,255,255,.45)', { w: 600 })}</g>`;
  // Ort im Schnittbild (Anteil der Kantenlänge) – Kern und Stromgebiet rechts
  const CORE = [.35, .48], TERR = [.27, .485];

  // ---------- Folien ----------
  const VESSEL = 'M40 330 C140 330 200 300 280 250 C350 208 420 200 520 196';
  // ---------- Fallfolien: Schritt für Schritt ----------
  // Jeder Fall baut sich mit „Weiter“ auf: Anamnese mit Szene → CT ohne Markierung → Befund → Schema und Merksätze.
  const IX = (f, s = 400, x0 = 60) => x0 + s * f, IY = (f, s = 400, y0 = 35) => y0 + s * f;
  const fade = (on) => on ? ' style="animation:lsfade .5s both"' : '';
  const skullArc = (a0, a1, e) => { let d = ''; for (let k = 0; k <= 24; k++) { const a = a0 + (a1 - a0) * k / 24; d += `${k ? 'L' : 'M'}${IX(.405 * e * Math.cos(a) + .508).toFixed(1)} ${IY(.468 * e * Math.sin(a) + .5).toFixed(1)}`; } return d; };
  // Szenen als flache Illustrationen (400 × 400): Figuren mit Gesicht und Kleidung, betroffene Seite orange markiert
  const SKIN = '#e9b999', SKIN2 = '#d9a27e', CH = (x1, y1, x2, y2, col, w) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const night = (win) => `<rect x="0" y="0" width="400" height="400" rx="18" fill="#101014"/><path d="M0 250 V170 H46 V120 H104 V190 H150 V96 H214 V160 H262 V130 H318 V186 H360 V150 H400 V250 Z" fill="#1c1c22"/>${win.map(([x, y]) => `<rect x="${x}" y="${y}" width="9" height="12" rx="1.5" fill="${ORANGE}" opacity=".75"/>`).join('')}<circle cx="338" cy="58" r="20" fill="#e5e5ea"/><circle cx="346" cy="52" r="18" fill="#101014"/><path d="M0 250 H400 V382 Q400 400 382 400 H18 Q0 400 0 382 Z" fill="#26262b"/><path d="M0 268 H400" stroke="#3a3a40" stroke-width="3" stroke-dasharray="26 18"/>`;
  // liegende Person, Kopf links: Haar, Oberteil, Hose
  const lying = (hair, top, legs, opt = {}) => `<ellipse cx="190" cy="336" rx="150" ry="10" fill="#000" opacity=".35"/>${CH(214, 306, 300, 312, legs, 24)}${CH(214, 316, 286, 330, legs, 24)}<ellipse cx="306" cy="312" rx="15" ry="9" fill="#1c1c1e"/><ellipse cx="292" cy="331" rx="15" ry="9" fill="#1c1c1e"/><rect x="112" y="284" width="116" height="46" rx="22" fill="${top}"/>${CH(140, 306, 172, 330, top, 18)}<circle cx="178" cy="332" r="9" fill="${SKIN}"/><circle cx="92" cy="304" r="25" fill="${SKIN}"/><path d="M68 300 A25 25 0 0 1 112 288 Q96 282 84 290 Q74 296 68 300 Z" fill="${hair}"/><path d="M80 308 q6 4 12 0" stroke="#5a3a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>${opt.moust ? `<path d="M72 316 q8 5 16 1" stroke="${hair}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` : `<path d="M76 318 h9" stroke="#5a3a2a" stroke-width="2.5" stroke-linecap="round"/>`}`;
  // sitzende Person von vorn; die schwache Seite (bildlinks) hängt, bei flip gespiegelt
  const sitting = (hair, top, legs, flip) => `<g${flip ? ' transform="translate(400 0) scale(-1 1)"' : ''}><ellipse cx="200" cy="364" rx="120" ry="9" fill="#000" opacity=".35"/><rect x="128" y="120" width="144" height="170" rx="14" fill="#3a3a3c"/><path d="M138 290 V356 M262 290 V356" stroke="#3a3a3c" stroke-width="12" stroke-linecap="round"/>
    <rect x="162" y="282" width="34" height="74" rx="14" fill="${legs}"/><rect x="204" y="282" width="34" height="74" rx="14" fill="${legs}"/><ellipse cx="177" cy="358" rx="20" ry="9" fill="#1c1c1e"/><ellipse cx="223" cy="358" rx="20" ry="9" fill="#1c1c1e"/><rect x="152" y="252" width="96" height="46" rx="20" fill="${legs}"/>
    <path d="M150 170 Q150 146 174 146 H226 Q250 146 250 170 V262 H150 Z" fill="${top}"/><rect x="190" y="128" width="20" height="24" fill="${SKIN2}"/>
    ${CH(244, 172, 258, 226, top, 22)}${CH(258, 226, 226, 256, top, 20)}<circle cx="222" cy="258" r="11" fill="${SKIN}"/>
    ${CH(154, 172, 132, 266, top, 22)}<circle cx="130" cy="282" r="11" fill="${SKIN}"/><path d="M104 196 q-10 12 0 24 M98 236 q-10 12 0 24" stroke="${ORANGE}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M136 300 q-10 12 0 24" stroke="${ORANGE}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="200" cy="104" r="32" fill="${SKIN}"/><path d="M168 100 A32 32 0 0 1 232 100 Q216 84 200 88 Q184 84 168 100 Z" fill="${hair}"/><circle cx="188" cy="106" r="3" fill="#3a2a22"/><circle cx="212" cy="106" r="3" fill="#3a2a22"/><path d="M186 124 Q198 120 214 119" stroke="#5a3a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M182 96 l12 2 M206 96 l12 -3" stroke="${hair}" stroke-width="3" stroke-linecap="round"/></g>`;
  const SCENE = {
    bike: () => `${night([[60, 190], [78, 190], [166, 120], [184, 140], [276, 150], [330, 200]])}<g transform="rotate(-14 300 300)"><circle cx="262" cy="300" r="44" fill="none" stroke="#aeaeb2" stroke-width="6"/><circle cx="352" cy="300" r="44" fill="none" stroke="#aeaeb2" stroke-width="6"/>${[0, 1, 2, 3, 4, 5].map(i => `<path d="M262 300 l${(42 * Math.cos(i * 1.05)).toFixed(0)} ${(42 * Math.sin(i * 1.05)).toFixed(0)} M352 300 l${(42 * Math.cos(i * 1.05 + .4)).toFixed(0)} ${(42 * Math.sin(i * 1.05 + .4)).toFixed(0)}" stroke="#636366" stroke-width="1.5"/>`).join('')}${P('M262 300 L296 244 L340 244 L352 300 M296 244 L318 300 L262 300 M340 244 L334 226 M320 224 H348 M288 234 H306', B, 7)}</g>${lying('#c7c7cc', '#8a5a3c', '#b9a27e', { moust: true })}<path d="M46 262 l8 12 M70 252 v14 M96 260 l-8 12" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round"/>`,
    bath: () => `<rect x="0" y="0" width="400" height="400" rx="18" fill="#15171a"/>${[60, 120, 180, 240].map(y => `<path d="M0 ${y} H400" stroke="#22252a" stroke-width="2"/>`).join('')}${[50, 110, 170, 230, 290, 350].map(x => `<path d="M${x} 0 V250" stroke="#22252a" stroke-width="2"/>`).join('')}<path d="M0 300 H400 V382 Q400 400 382 400 H18 Q0 400 0 382 Z" fill="#26262b"/>
      ${P('M92 214 V160 Q92 138 114 138 H128 V154', '#aeaeb2', 7)}<path d="M120 168 v10 M128 172 v12 M136 168 v10" stroke="${B}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="292" cy="182" r="27" fill="${SKIN}"/><path d="M268 176 A27 27 0 0 1 318 172 Q300 160 282 166 Z" fill="#d1d1d6"/><circle cx="318" cy="160" r="12" fill="#d1d1d6"/><path d="M280 186 q6 4 12 0" stroke="#5a3a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M284 198 h9" stroke="#5a3a2a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M44 214 H356 Q360 214 358 222 C352 300 330 330 286 330 H114 C70 330 48 300 42 222 Q40 214 44 214 Z" fill="#e5e5ea"/><path d="M58 226 H342 C336 286 318 312 282 312 H118 C82 312 64 286 58 226 Z" fill="#c7c7cc"/><path d="M62 240 H338 C332 290 316 312 282 312 H118 C84 312 68 290 62 240 Z" fill="${B}" opacity=".55"/><path d="M80 252 q14 -8 28 0 t28 0 t28 0" stroke="#fff" stroke-width="2.5" fill="none" opacity=".5"/>
      <path d="M112 330 l-10 32 M288 330 l10 32" stroke="#aeaeb2" stroke-width="9" stroke-linecap="round"/>${CH(266, 212, 222, 232, SKIN, 18)}${CH(314, 210, 352, 226, SKIN, 18)}${CH(352, 226, 356, 292, SKIN, 16)}<circle cx="356" cy="300" r="10" fill="${SKIN}"/>
      <rect x="30" y="352" width="92" height="14" rx="7" fill="#3a3a40"/><g transform="rotate(70 150 356)"><rect x="140" y="340" width="20" height="34" rx="6" fill="${ORANGE}"/><rect x="145" y="332" width="10" height="10" rx="2" fill="#aeaeb2"/></g>`,
    bar: () => `${night([[60, 200], [166, 130], [184, 150], [290, 150], [330, 210]])}<path d="M260 0 L330 0 L372 250 H216 Z" fill="#fff" opacity=".05"/><ellipse cx="74" cy="336" rx="42" ry="9" fill="${RED}" opacity=".85"/>${lying('#e3c16f', '#30b0c7', '#3d5a80')}<g transform="rotate(-10 310 350)"><rect x="240" y="344" width="140" height="11" rx="5.5" fill="#8e8e93"/><rect x="240" y="344" width="26" height="11" rx="5.5" fill="${RED}" opacity=".8"/></g><path d="M46 262 l8 12 M70 252 v14 M96 260 l-8 12" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round"/>`,
    hemiR: () => `<rect x="0" y="0" width="400" height="400" rx="18" fill="#15171a"/><path d="M0 330 H400 V382 Q400 400 382 400 H18 Q0 400 0 382 Z" fill="#26262b"/><rect x="290" y="60" width="74" height="96" rx="6" fill="#1f2937"/><path d="M327 60 V156 M290 108 H364" stroke="#15171a" stroke-width="4"/>${sitting('#c7c7cc', '#5b8fd9', '#6b4f3a', false)}`,
    head: () => `<rect x="0" y="0" width="400" height="400" rx="18" fill="#15171a"/><path d="M96 400 C100 318 140 296 200 296 C260 296 300 318 304 400 Z" fill="#30b0c7"/><rect x="186" y="262" width="28" height="44" fill="${SKIN2}"/>
      <path d="M130 196 C120 110 280 110 270 196 C276 250 262 270 262 270 H138 C138 270 124 250 130 196 Z" fill="#2c2520"/><ellipse cx="200" cy="204" rx="58" ry="68" fill="${SKIN}"/><path d="M142 190 C150 130 250 130 258 190 C236 164 164 164 142 190 Z" fill="#2c2520"/>
      <path d="M168 204 l20 8 M232 204 l-20 8" stroke="#3a2a22" stroke-width="4" stroke-linecap="round"/><path d="M164 190 l22 6 M236 190 l-22 6" stroke="#2c2520" stroke-width="4" stroke-linecap="round"/><ellipse cx="200" cy="246" rx="11" ry="7" fill="#7a3b33"/>
      ${CH(110, 392, 96, 300, '#30b0c7', 30)}${CH(96, 300, 140, 214, '#30b0c7', 26)}${CH(290, 392, 304, 300, '#30b0c7', 30)}${CH(304, 300, 260, 214, '#30b0c7', 26)}<ellipse cx="146" cy="200" rx="16" ry="22" fill="${SKIN}" transform="rotate(20 146 200)"/><ellipse cx="254" cy="200" rx="16" ry="22" fill="${SKIN}" transform="rotate(-20 254 200)"/>
      <path d="M200 30 l-16 34 h24 l-16 34 M108 62 l6 30 l20 -10 l6 28 M292 62 l-6 30 l-20 -10 l-6 28" stroke="${ORANGE}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M62 150 l22 8 M338 150 l-22 8 M70 110 l18 14 M330 110 l-18 14" stroke="${ORANGE}" stroke-width="4" stroke-linecap="round" opacity=".6"/>`,
    hemiL: () => `<rect x="0" y="0" width="400" height="400" rx="18" fill="#15171a"/><path d="M0 330 H400 V382 Q400 400 382 400 H18 Q0 400 0 382 Z" fill="#26262b"/><circle cx="70" cy="80" r="42" fill="#e5e5ea"/><circle cx="70" cy="80" r="36" fill="#15171a"/>${[0, 1, 2, 3].map(i => `<path d="M${70 + 30 * Math.cos(i * Math.PI / 2)} ${80 + 30 * Math.sin(i * Math.PI / 2)} L${70 + 35 * Math.cos(i * Math.PI / 2)} ${80 + 35 * Math.sin(i * Math.PI / 2)}" stroke="#e5e5ea" stroke-width="3"/>`).join('')}<path d="M70 80 L70 106 M70 80 L86 92" stroke="#e5e5ea" stroke-width="4" stroke-linecap="round"/>${T(70, 146, '16:30', 15, DIM, { a: 'middle', mono: true })}${sitting('#3a2a22', '#8e9aaf', '#2f3640', true)}`,
  };
  // Szenen, für die es eine generierte Illustration gibt (web/lesson/sc_*.jpg); die übrigen sind gezeichnet
  const SCIMG = { bike: 1, bath: 1, head: 1, bar: 1, hemiR: 1, hemiL: 1, men: 1, met: 1 };
  const scene = (k, x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 400})">${SCIMG[k] ? `<image href="lesson/sc_${k}.jpg" width="400" height="400"/>` : `<clipPath id="scl"><rect width="400" height="400" rx="18"/></clipPath><g clip-path="url(#scl)">${SCENE[k]()}</g>`}</g>`;
  // Schema im Frontalschnitt: Kalotte, Hirn, Ventrikel – der Befund rot
  const schema = (k, x, y) => { const el = (a, rx, ry) => `${(95 + rx * Math.cos(a)).toFixed(1)} ${(92 + ry * Math.sin(a)).toFixed(1)}`, arc = (a0, a1, rx, ry) => { let d = ''; for (let i = 0; i <= 16; i++) d += `${i ? 'L' : ''}${el(a0 + (a1 - a0) * i / 16, rx, ry)} `; return d; };
    let gyr = ''; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2, m = 1 - .055 * Math.pow(Math.abs(Math.sin(a * 7.5 + .4)), .5) * 1.6 + .09; gyr += `${i ? 'L' : 'M'}${el(a, 64 * m, 60 * m)} `; }
    const les = { edh: `<path d="M${arc(-1.25, -.25, 71, 67)} Q${el(-.75, 40, 38)} ${el(-1.25, 71, 67)} Z" fill="${RED}"/>`,
      sdh: `<path d="M${arc(-1.5, .35, 71, 67)} L${arc(.35, -1.5, 62, 58)} Z" fill="${RED}"/>`,
      sab: '',
      icb: `<circle cx="122" cy="96" r="15" fill="${RED}"/>`,
      cont: `<circle cx="140" cy="126" r="13" fill="${RED}" opacity=".85"/><circle cx="128" cy="138" r="6" fill="${RED}" opacity=".7"/><circle cx="52" cy="60" r="8" fill="${RED}" opacity=".7"/>`,
      tumor: `<circle cx="126" cy="74" r="30" fill="rgba(10,132,255,.35)"/><circle cx="130" cy="78" r="11" fill="none" stroke="${ORANGE}" stroke-width="5"/>`,
      isch: `<path d="M88 88 L${arc(Math.PI - .9, Math.PI + .75, 66, 62)} Z" fill="rgba(10,132,255,.55)"/>` }[k] || '';
    return `<g transform="translate(${x} ${y})">${R(0, 0, 190, 184, 16, CARD)}<ellipse cx="95" cy="92" rx="77" ry="73" fill="#1c1c1e" stroke="#aeaeb2" stroke-width="5"/>${k === 'sab' ? `<path d="M${arc(-1.5, .25, 66, 62)}" fill="none" stroke="${RED}" stroke-width="12"/>` : ''}<path d="${gyr}Z" fill="#636366"/><path d="M95 30 V64" stroke="${k === 'sab' ? RED : '#1c1c1e'}" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M95 88 C84 74 70 76 72 88 C76 98 88 98 95 104 C102 98 114 98 118 88 C120 76 106 74 95 88 Z" fill="rgba(10,132,255,.75)"/>${les}</g>`; };
  // Originalschnittbild (quadratisch, 512 px) – ohne Animation, als zentrales Element
  const photo = (x, y, s, key) => `<clipPath id="pc${key}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14"/></clipPath><image href="lesson/${key}.jpg" x="${x}" y="${y}" width="${s}" height="${s}" clip-path="url(#pc${key})"/>`;
  const ask = (x, y, w, s) => `${R(x, y, w, 64, 16, 'rgba(10,132,255,.16)', { stroke: 'rgba(10,132,255,.6)', sw: 1.5 })}${T(x + 22, y + 39, s, 19, W, { w: 600 })}`;
  // Synthetisches CT, in dem der Befund wächst und Raum fordert: neun Bilder, weich überblendet
  const GF = 9, SHIFT = { edh: 9, sdh: 6, bleed: 5 };
  const grow = (x, y, s, les) => { let im = ''; for (let k = 0; k < GF; k++) im += `<image class="gf" href="${brain('ct', les, k / (GF - 1))}" x="${x}" y="${y}" width="${s}" height="${s}" opacity="${k ? 0 : 1}"/>`;
    return `<clipPath id="gcl"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14"/></clipPath><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="14" fill="#000"/><g clip-path="url(#gcl)">${im}</g>${T(x + 12, y + 22, 'Modell · so entsteht es', 11, 'rgba(255,255,255,.75)', { w: 600 })}${T(x + 2, y + s + 19, '', 12.5, W, { w: 600, id: 'g-tx' })}${R(x, y + s + 28, s, 5, 2.5, 'rgba(255,255,255,.22)')}${R(x, y + s + 28, 0, 5, 2.5, B, { id: 'g-bar' })}`; };
  const growUpd = (t, q, el, les, s) => { const u = lin(t, 1, 7.5), f = u * (GF - 1); el.querySelectorAll('.gf').forEach((e, k) => e.setAttribute('opacity', clamp(f - k + 1, 0, 1).toFixed(3)));
    q('g-bar').setAttribute('width', (s * u).toFixed(1)); q('g-tx').textContent = SHIFT[les] ? `Mittellinie ${(SHIFT[les] * u * u).toFixed(0)} mm verlagert` : (les === 'sab' ? 'Blut verteilt sich im Liquor' : 'Kontusionen blühen auf'); };
  // Scrollbare Schichtstapel (web/lesson/ct/<key>/NN.jpg): Mausrad, Ziehen oder ↑ ↓. marks = Ellipse je Schicht.
  /*STACKS*/const STACKS = {"edh":{"n":37,"key":9,"a":0.791,"ov":[0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"label":"CT nativ","src":"BHSD / CQ500 \u00b7 CC BY-NC-SA 4.0"},"sdh":{"n":26,"key":4,"a":0.8633,"ov":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],"label":"CT nativ","src":"BHSD / CQ500 \u00b7 CC BY-NC-SA 4.0"},"trauma":{"n":27,"key":17,"a":0.8535,"ov":[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],"label":"CT nativ","src":"BHSD / CQ500 \u00b7 CC BY-NC-SA 4.0"},"icb":{"n":32,"key":10,"a":0.7168,"ov":[0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],"label":"CT nativ","src":"BHSD / CQ500 \u00b7 CC BY-NC-SA 4.0"},"sab":{"n":26,"key":14,"a":0.8164,"ov":[0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"label":"CT nativ","src":"BHSD / CQ500 \u00b7 CC BY-NC-SA 4.0"},"mca":{"n":32,"key":20,"a":0.8555,"ov":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0],"label":"","src":"ISLES 2024 \u00b7 CC BY-NC-SA 4.0"},"mca2":{"n":32,"key":16,"a":0.8555,"ov":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"label":"","src":"ISLES 2024 \u00b7 CC BY-NC-SA 4.0 \u00b7 Verlauf simuliert"},"cta":{"n":32,"key":19,"a":0.8555,"ov":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],"label":"","src":"ISLES 2024 \u00b7 CC BY-NC-SA 4.0"},"ancta":{"n":29,"key":19,"a":0.8223,"ov":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],"label":"","src":"ISLES 2024 \u00b7 CC BY-NC-SA 4.0 \u00b7 Aneurysma simuliert"},"gbm_f":{"n":35,"key":16,"a":0.7891,"ov":[0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],"label":"MRT \u00b7 FLAIR","src":"UPENN-GBM \u00b7 CC BY 4.0"},"gbm_t":{"n":35,"key":16,"a":0.7891,"ov":[0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"label":"MRT \u00b7 T1 mit Kontrastmittel","src":"UPENN-GBM \u00b7 CC BY 4.0"},"men_f":{"n":36,"key":21,"a":0.9219,"ov":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"label":"","src":"BraTS-MEN 2023 \u00b7 CC BY 4.0"},"men_t":{"n":36,"key":21,"a":0.9219,"ov":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],"label":"","src":"BraTS-MEN 2023 \u00b7 CC BY 4.0"}};/*END*/
  const SL = {}; let CUR = null; const pad2 = (i) => String(i).padStart(2, '0');
  // Stapel in einem Feld der Höhe s; mark = Befund eingefärbt (dann ohne Positionsbalken). Mehrere Stapel einer Folie laufen gekoppelt.
  const stack = (x, y, s, key, mark, grp) => { const k = STACKS[key], w = s * k.a, g = grp || key; if (SL[g] == null) SL[g] = k.key; for (let i = 0; i < k.n; i++) { const im = new Image(); im.src = `lesson/ct/${key}/${pad2(i)}.jpg`; }
    return `<clipPath id="pc${key}"><rect x="${x}" y="${y}" width="${w}" height="${s}" rx="14"/></clipPath>
      <g class="stk" data-key="${key}" data-grp="${g}" data-x="${x}" data-y="${y}" data-s="${s}" data-mark="${mark ? 1 : ''}" style="cursor:ns-resize" clip-path="url(#pc${key})"><image class="stk-im" x="${x}" y="${y}" width="${w}" height="${s}" preserveAspectRatio="none"/><image class="stk-ov" x="${x}" y="${y}" width="${w}" height="${s}" preserveAspectRatio="none"/></g>`; };
  function setSlice(i) { if (!CUR) return; const svg = document.getElementById('lsSvg'); i = clamp(Math.round(i), 0, CUR.n - 1); SL[CUR.grp] = CUR.i = i;
    svg.querySelectorAll('.stk').forEach(g => { const key = g.dataset.key, k = STACKS[key], y = +g.dataset.y, sz = +g.dataset.s, j = Math.min(i, k.n - 1);
      g.querySelector('.stk-im').setAttribute('href', `lesson/ct/${key}/${pad2(j)}.jpg`); const ov = g.querySelector('.stk-ov'), on = g.dataset.mark && k.ov[j]; ov.setAttribute('href', on ? `lesson/ct/${key}/o${pad2(j)}.png` : ''); ov.setAttribute('opacity', on ? 1 : 0);
    }); }
  const caseSlide = (c) => ({ k: 'Blutungen', fall: c.t, t: (st) => st === 0 ? 'Anamnese' : st === 1 ? 'CT nativ' : c.dx, steps: 4, dur: 9, vb: (st) => st === 3 ? '0 0 900 610' : '0 0 600 610', les: c.les,
    para: (st) => st === 0 ? c.anam : '', bullets: (st) => st < 2 ? [] : st === 2 ? [c.dxText] : [c.chips.join(' · '), ...c.teach],
    svg: (st) => { const k = STACKS[c.les], w = 580 * k.a; if (st === 2) SL[c.les] = k.key;
      return `${st === 0 ? `<g${fade(1)}>${scene(c.scene, 10, 15, 580)}</g>` : `<g${fade(st === 1)}>${stack(st === 3 ? 10 + (580 - w) / 2 : 300 - w / 2, 15, 580, c.les, st >= 2)}</g>`}
      ${st >= 3 ? `<g${fade(1)}>${grow(619, 160, 262, c.syn)}</g>` : ''}`; },
    update: (t, q, el, st) => { if (st === 3) growUpd(t, q, el, c.syn, 262); } });
  // MRT-Fall: Anamnese mit Szene, dann FLAIR und T1 mit Kontrastmittel nebeneinander (gekoppelt), dann der Befund eingefärbt
  const mriCase = (c) => ({ k: 'Raumforderung', fall: c.t, t: (st) => ['Anamnese', 'MRT · FLAIR und T1 mit Kontrastmittel', c.dx][st], steps: 3, vb: (st) => st ? '0 0 1010 610' : '0 0 600 610',
    para: (st) => st ? '' : c.anam, bullets: (st) => st === 2 ? c.teach : [],
    svg: (st) => { const k = STACKS[c.f], w = 580 * k.a; if (st === 2) SL[c.f] = k.key; return st === 0 ? `<g${fade(1)}>${scene(c.scene, 10, 15, 580)}</g>` : `<g${fade(st === 1)}>${stack(505 - w - 5, 15, 580, c.f, st === 2, c.f)}${stack(510, 15, 580, c.g, st === 2, c.f)}</g>`; } });
  const ring = (fx, fy, r, col = RED) => `<circle cx="${IX(fx)}" cy="${IY(fy)}" r="${r}" fill="none" stroke="${col}" stroke-width="2.2"/>`;

  const SLIDES = [
    { k: 'Neuroradiologie', wide: true, t: '', bullets: [],
      svg: () => { let who = ''; try { who = (localStorage.getItem('cathsim.user') || '').trim(); } catch (e) {}
        return `${T(500, 196, 'Neuroradiologie', 92, W, { w: 700, ls: -2.5, a: 'middle' })}${T(500, 250, 'Blutung · Tumor · Schlaganfall', 26, B, { w: 600, a: 'middle' })}${who ? `${P('M470 300 H530', 'rgba(255,255,255,.25)', 2)}${T(500, 346, esc(who), 24, W, { w: 600, a: 'middle' })}` : ''}`; } },

    { k: 'Neuroradiologie', wide: true, qr: true, t: '', bullets: [],
      svg: () => `${T(90, 120, 'Macht mit', 54, W, { w: 700, ls: -1.4 })}${T(92, 176, 'Code scannen, Namen eingeben.', 22, 'rgba(235,235,245,.85)')}${T(92, 208, 'Abstimmen, im Bild scrollen und zeigen – vom Handy aus.', 16, DIM)}
        <g id="e-list"></g>${R(620, 60, 300, 350, 22, CARD)}<foreignObject x="660" y="88" width="220" height="220"><div xmlns="http://www.w3.org/1999/xhtml" id="lsQR" style="width:220px;height:220px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center"></div></foreignObject>${T(770, 350, '', 30, W, { a: 'middle', w: 700, mono: true, id: 'e-code', ls: 5 })}${T(770, 384, '', 13, GREEN, { a: 'middle', w: 600, id: 'e-n' })}${T(770, 384, '', 1, DIM, { id: 'e-url', op: 0 })}` },

    { k: 'Neuroradiologie', wide: true, t: '', steps: 2, bullets: [],
      svg: (st) => `${T(110, 74, 'Inhalte', 34, W, { w: 700, ls: -.8 })}${[['Trauma und intrakranielle Blutungen', 'Fälle 1–4'], ['Raumforderungen', 'Fälle 5–6 · Meningeom, maligner Tumor'], ['Ischämischer Schlaganfall', 'Fall 7 · Bildgebung, Lyse, Thrombektomie'], ['Aneurysma und SAB', 'Fall 8 · und selbst coilen']].map(([a, b2], i) => `<circle cx="128" cy="${138 + i * 78}" r="19" fill="${FILL}"/>${T(128, 145 + i * 78, i + 1, 18, W, { a: 'middle', w: 700 })}${T(166, 136 + i * 78, a, 21, W, { w: 600 })}${T(166, 160 + i * 78, b2, 14.5, DIM)}`).join('')}
        ${st ? `<g${fade(1)}>${R(560, 40, 380, 390, 22, CARD)}${T(592, 84, 'LERNZIELE', 12, B, { w: 700, ls: 1.4 })}${T(592, 140, 'Blutungen unterscheiden', 20, W, { w: 700 })}${T(592, 170, 'epidural · subdural · subarachnoidal', 15, DIM)}${T(592, 192, 'intrazerebral – am typischen Bild', 15, DIM)}${P('M592 232 H908', 'rgba(255,255,255,.12)', 1.5)}${T(592, 290, 'Therapie aus dem Bild ableiten', 20, W, { w: 700 })}${T(592, 320, 'ischämischer und hämorrhagischer', 15, DIM)}${T(592, 342, 'Schlaganfall', 15, DIM)}</g>` : ''}` },

    caseSlide({ n: 1, t: 'Fall 1 · Horst K., 72 Jahre', anam: 'Horst K., Rentner, stürzt auf dem Heimweg mit dem Rad – ohne Helm. Zunächst ist er ansprechbar und will nach Hause. Im Rettungswagen trübt er ein, im Schockraum ist er bewusstlos.', scene: 'bike', les: 'edh', syn: 'edh', lines: ['72 Jahre, männlich', 'Mit dem Rad gestürzt', 'Jetzt bewusstlos'], ask: ['Was muss ausgeschlossen werden?'],
      marks: `<ellipse cx="${IX(.236)}" cy="${IY(.548)}" rx="34" ry="86" fill="none" stroke="${RED}" stroke-width="2.2"/>`, col: RED, dx: 'Epidurales Hämatom', dxText: 'Hyperdense Linse direkt unter der Kalotte.', schema: 'edh', chips: ['bikonvex', 'zwischen den Suturen', 'arteriell · Fraktur'],
      teach: ['Arteriell – es wächst schnell.', 'Freies Intervall, dann Eintrübung: Notfall-Entlastung.'] }),

    caseSlide({ n: 2, t: 'Fall 2 · Frau Funke, 76 Jahre', anam: 'Frau Funke lebt allein. Die Nachbarin findet sie gestürzt in der Badewanne, sie reagiert nicht auf Ansprache. Bekannt sind Bluthochdruck und eine KHK; sie nimmt ASS 100 und Bisoprolol.', scene: 'bath', les: 'sdh', syn: 'sdh', lines: ['76 Jahre, weiblich, alleinstehend', 'In der Badewanne gestürzt, bewusstlos', 'Hypertonie, KHK · ASS 100, Bisoprolol'], ask: ['Was ist anders als bei Fall 1?'],
      marks: P(`M${IX(.655)} ${IY(.125)} Q${IX(.775)} ${IY(.2)} ${IX(.775)} ${IY(.34)} L${IX(.79)} ${IY(.42)} Q${IX(.815)} ${IY(.55)} ${IX(.79)} ${IY(.66)}`, ORANGE, 2.2, { da: '5 5' }), col: ORANGE, dx: 'Subdurales Hämatom', dxText: 'Sichelförmiger Saum entlang der Hirnoberfläche.', schema: 'sdh', chips: ['sichelförmig', 'suturenüberschreitend', 'Brückenvenen'],
      teach: ['Venös – es breitet sich langsam über die Konvexität aus.', 'Oft Bagatelltrauma: Alter, Blutverdünnung.'] }),

    { k: 'Blutungen', fall: null, poll: true, t: 'Frage I', sub: 'Epidurales oder subdurales Hämatom im kranialen CT – was trifft am ehesten zu?', q: 'Epidural oder subdural?', opts: ['Epidurale Hämatome überschreiten die Suturen, subdurale nicht', 'Subdurale Hämatome sind bikonvex und durch Suturen begrenzt', 'Epidurale Hämatome sind sichelförmig über mehrere Lappen verteilt', 'Subdurale Hämatome folgen der Hirnoberfläche, auch über Suturen hinweg', 'Epidurale Hämatome kreuzen typischerweise die Falx'], ok: 3, why: 'Subdural: Sichel entlang der Hirnoberfläche, suturenüberschreitend. Epidural: bikonvexe Linse, an den Suturen begrenzt.' },

    caseSlide({ n: 3, t: 'Fall 3 · Lasse G., 21 Jahre', anam: 'Lasse G. wird auf dem Heimweg von hinten mit einer Eisenstange niedergeschlagen. Passanten finden ihn bewusstlos, mit stark blutender Wunde am Kopf.', scene: 'bar', les: 'trauma', syn: 'trauma', lines: ['21 Jahre, männlich', 'Schlag mit einer Eisenstange von hinten', 'Bewusstlos, starke Blutung am Kopf'], ask: ['Schlag von hinten – wo ist das Gehirn verletzt?'],
      marks: `<ellipse cx="${IX(.5)}" cy="${IY(.225)}" rx="60" ry="64" fill="none" stroke="${RED}" stroke-width="2.2"/>` + ring(.745, .485, 30), col: RED, dx: 'Kontusionen + traumatische SAB', dxText: 'Kontusionen frontobasal beidseits, dazu Blut in den Furchen.', schema: 'cont', chips: ['polar, oberflächennah', 'Coup und Contre-Coup', 'SAB in den Furchen'],
      teach: ['Kontusionen „blühen auf“ – Kontroll-CT.', 'SAB nach Trauma: an das Aneurysma denken.'] }),

    caseSlide({ n: 4, t: 'Fall 4 · Dr. Müller, 67 Jahre', anam: 'Dr. Müller, ehemaliger Chirurg, kann beim Frühstück plötzlich den rechten Arm und das rechte Bein nicht mehr bewegen. Kein Sturz, kein Trauma. Herzinfarkt vor drei Jahren, früher Raucher, keine Medikamente.', scene: 'hemiR', les: 'icb', syn: 'bleed', lines: ['67 Jahre, männlich', 'Plötzliche Hemiparese rechts', 'Früher Nikotin · keine Vormedikation'], q0: 'Welcher Schlaganfall?', ask: ['Ischämie oder Blutung – klinisch zu sagen?'],
      marks: `<ellipse cx="${IX(.615)}" cy="${IY(.46)}" rx="42" ry="64" fill="none" stroke="${RED}" stroke-width="2.2"/>` + ring(.345, .665, 15, ORANGE) + ring(.635, .67, 15, ORANGE), col: RED, dx: 'Stammganglienblutung links', dxText: 'Blutung in den Stammganglien links, Einbruch in die Ventrikel.', schema: 'icb', chips: ['loco typico', 'Hypertonie', 'Ventrikeleinbruch'],
      teach: ['Loco typico: Stammganglien, Thalamus, Pons, Kleinhirn.', 'Therapie: Blutdruck senken, überwachen.'] }),

    { k: 'Blutungen', fall: null, poll: true, t: 'Frage II', sub: 'Intrazerebrale Blutungen loco typico – was trifft am ehesten zu?', q: 'Blutung loco typico', opts: ['Putamenblutung: meist Amyloidangiopathie bei jungen Patienten', 'Loco typico heißt kortikal und meist posttraumatisch', 'Thalamusblutung: Symptome auf der Gegenseite', 'Kleinhirnblutungen sind nie loco typico, fast immer AVM', 'Stammganglienblutungen sind selten hypertensiv bedingt'], ok: 2, why: 'Loco typico = Stammganglien, Thalamus, Pons, Kleinhirn – hypertensiv. Die Bahnen kreuzen: Ausfälle auf der Gegenseite.' },

    mriCase({ t: 'Fall 5 · Frau Albers, 58 Jahre', scene: 'men', f: 'men_f', g: 'men_t', dx: 'Meningeom',
      anam: 'Frau Albers hat seit Monaten zunehmende Kopfschmerzen. Vor zwei Wochen hatte sie erstmals einen kurzen Krampfanfall. Sie ist sonst gesund und nimmt keine Medikamente.',
      teach: ['Sitzt breit der Dura auf, liegt außerhalb des Hirns.', 'Reichert kräftig und gleichmäßig an – kaum Ödem.', 'Wächst langsam, meist gutartig.'] }),

    mriCase({ t: 'Fall 6 · Herr Brandt, 64 Jahre', scene: 'met', f: 'gbm_f', g: 'gbm_t', dx: 'Maligner Tumor',
      anam: 'Herr Brandt, langjähriger Raucher, hat seit drei Wochen Kopfschmerzen und findet die Worte nicht mehr. Heute ist er im Flur zusammengesackt und hat gekrampft.',
      teach: ['Ödem (blau): viel größer als der Herd, Rinde ausgespart.', 'Ringförmige Anreicherung mit Nekrose (orange): Metastase oder Glioblastom – DD Abszess.', 'Solche Herde bluten gern ein: daran denken bei Blutung an untypischer Stelle.'] }),

    { fall: 'Fall 7 · Sven T., 53 Jahre', t: (st) => ['Anamnese', 'CT nativ', 'Dichtes Mediazeichen', 'Später: Demarkation', 'Zeit ist Hirn'][st], steps: 5, vb: (st) => st < 3 ? '0 0 600 610' : st === 3 ? '0 0 1010 610' : '0 0 1000 470',
      para: (st) => st ? '' : 'Sven T. hat keine Vorerkrankungen und nimmt keine Medikamente. Um 16:30 Uhr kann er plötzlich den linken Arm und das linke Bein nicht mehr bewegen. Seine linke Seite nimmt er nicht mehr wahr (Neglect).',
      bullets: (st) => st < 2 ? [] : st === 2 ? ['Keine Blutung, keine Demarkation.', 'Nur ein dezentes Zeichen: der Thrombus hell in der A. cerebri media rechts.'] : st === 3 ? ['Links bei Aufnahme, rechts Stunden später.', 'Hypodens, Furchen verstrichen: Dieses Gewebe ist verloren.'] : ['1,9 Millionen Nervenzellen pro Minute.', 'Diesen Fall behandelt ihr am Ende selbst.'],
      dur: 10, svg: (st) => { const k = STACKS.mca, w = 580 * k.a; if (st === 2) SL.mca = k.key; else if (st === 1 && SL.mca == null) SL.mca = Math.round(k.n * .45); if (st === 3) SL.mca = STACKS.mca2.key; return !st ? `<g${fade(1)}>${scene('hemiL', 10, 15, 580)}</g>` : st < 3 ? `<g${fade(st === 1)}>${stack(300 - w / 2, 15, 580, 'mca', st === 2)}</g>` : st === 3 ? `${stack(505 - w - 5, 15, 580, 'mca', false)}<g${fade(1)}>${stack(510, 15, 580, 'mca2', false, 'mca')}</g>` : `${slice(90, 40, 440, 'ct', 'none', 'CT nativ')}<g id="s-pulse"><circle cx="${90 + 440 * CORE[0]}" cy="${40 + 440 * CORE[1]}" r="40" fill="none" stroke="${RED}" stroke-width="2"/></g>
        ${R(600, 90, 320, 150, 18, CARD)}${T(624, 124, 'OHNE REPERFUSION', 11, DIM, { w: 700, ls: 1.2 })}${T(624, 186, '0', 54, W, { w: 700, mono: true, id: 's-n' })}${T(624, 218, 'Nervenzellen verloren', 13, DIM)}
        ${R(600, 262, 320, 96, 18, CARD)}${T(624, 296, 'ZEIT SEIT SYMPTOMBEGINN', 11, DIM, { w: 700, ls: 1.2 })}${T(624, 338, '0:00', 30, ORANGE, { w: 600, mono: true, id: 's-t' })}`; },
      update: (t, q, el, st) => { if (st !== 4) return; const m = t * 9; q('s-n').textContent = (m * 1.9).toFixed(0) + ' Mio'; q('s-t').textContent = `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')} h`; const p = (t * 1.1) % 1; q('s-pulse').firstChild.setAttribute('r', (22 + 60 * p).toFixed(1)); setO(q('s-pulse'), 1 - p); } },

    { t: 'Ischämie oder Blutung?', sub: 'Klinisch nicht zu unterscheiden', bullets: ['Klinisch nicht zu unterscheiden.', 'Therapie gegensätzlich – erst das Bild.'],
      dur: 9, svg: () => `${R(60, 30, 420, 220, 18, CARD)}${T(84, 62, 'ISCHÄMIE · 85 %', 11, B, { w: 700, ls: 1.2 })}
        <g transform="translate(80,-66) scale(.72)">${P(VESSEL, 'rgba(255,255,255,.22)', 26)}${P('M40 330 C140 330 200 300 262 262', B, 3, { id: 'i-flow', da: '2 16' })}<ellipse id="i-clot" cx="282" cy="249" rx="22" ry="12" fill="#7a1f1f" transform="rotate(-32 282 249)"/></g>${T(84, 232, 'Verschluss – dahinter kein Fluss', 13, 'rgba(235,235,245,.8)')}
        ${R(520, 30, 420, 220, 18, CARD)}${T(544, 62, 'BLUTUNG · 15 %', 11, RED, { w: 700, ls: 1.2 })}
        <g transform="translate(540,-66) scale(.72)">${P(VESSEL, 'rgba(255,255,255,.22)', 26)}${P(VESSEL, B, 3, { id: 'b-flow', da: '2 16' })}<circle id="b-bleed" cx="290" cy="262" r="6" fill="${RED}" opacity=".85"/></g>${T(544, 232, 'Ruptur – Blut tritt ins Gewebe', 13, 'rgba(235,235,245,.8)')}
        ${slice(170, 268, 200, 'ct', 'late', 'CT · Infarkt (Tag 1)')}${slice(630, 268, 200, 'ct', 'bleed', 'CT · Blutung')}`,
      update: (t, q) => { q('i-flow').setAttribute('stroke-dashoffset', (-t * 40).toFixed(1)); q('b-flow').setAttribute('stroke-dashoffset', (-t * 40).toFixed(1)); q('b-bleed').setAttribute('r', (6 + 34 * seg(t % 9, 1, 6)).toFixed(1)); } },

    { poll: true, t: 'Frage III', sub: 'Frühe Bildgebung bei Verdacht auf akuten Schlaganfall – welche Aussage trifft zu und hat unmittelbare Konsequenz?', q: 'Wozu die frühe Bildgebung?', opts: ['Natives CT schließt vor allem Tumoren aus – für die Akuttherapie egal', 'Umschriebene Hyperdensität = Ischämie, sofort lysieren', 'Thrombektomie nur, wenn schon das native CT den Verschluss zeigt', 'Sie trennt Ischämie von Blutung – danach richtet sich die Therapie', 'In den ersten 6 Stunden entbehrlich, wenn die Klinik eindeutig ist'], ok: 3, why: 'Ohne Bild keine Therapie: Erst das native CT schließt die Blutung aus – dann darf lysiert werden.' },

    { t: 'Natives CT', sub: 'Blutung ausschließen, Frühzeichen suchen', bullets: ['Hell = Blut → keine Lyse.', 'Frühzeichen: dichtes Mediazeichen, Inselrinde verstrichen.', 'ASPECTS: 10 Punkte, je Region einer weniger.'],
      dur: 12, svg: () => `${slice(60, 40, 280, 'ct', 'bleed', 'Blutung')}${slice(360, 40, 280, 'ct', 'none', 'unauffällig')}${slice(660, 40, 280, 'ct', 'stroke', 'Frühzeichen', { id: 'n-early' })}
        <g id="n-m1"><circle cx="${60 + 280 * .636}" cy="${40 + 280 * .485}" r="46" fill="none" stroke="${RED}" stroke-width="2"/>${T(60 + 140, 344, 'hyperdens = Blut → keine Lyse', 13, RED, { a: 'middle', w: 600 })}</g>
        <g id="n-m2"><circle cx="${660 + 280 * .37}" cy="${40 + 280 * .47}" r="16" fill="none" stroke="${ORANGE}" stroke-width="2"/>${T(660 + 140, 344, 'hyperdenses Mediazeichen', 13, ORANGE, { a: 'middle', w: 600 })}</g>
        <g id="n-m3"><ellipse cx="${660 + 280 * CORE[0]}" cy="${40 + 280 * CORE[1]}" rx="34" ry="44" fill="none" stroke="${B}" stroke-width="2" stroke-dasharray="4 4"/>${T(660 + 140, 366, 'Inselrinde verstrichen', 13, B, { a: 'middle', w: 600 })}</g>
        ${R(60, 392, 880, 56, 16, CARD)}${T(84, 426, 'ASPECTS', 13, W, { w: 700 })}${Array.from({ length: 10 }, (_, i) => `<circle id="n-a${i}" cx="${190 + i * 34}" cy="421" r="10" fill="${FILL}"/>`).join('')}${T(560, 426, '', 14, W, { w: 600, mono: true, id: 'n-as' })}`,
      update: (t, q) => { setO(q('n-m1'), win(t, .8, 12)); setO(q('n-m2'), win(t, 3, 12)); setO(q('n-m3'), win(t, 5, 12)); const lost = t > 7 ? Math.min(2, Math.floor((t - 7) / 1.2) + 1) : 0;
        for (let i = 0; i < 10; i++) q('n-a' + i).setAttribute('fill', i < 10 - lost ? GREEN : (t > 7 ? RED : FILL)); q('n-as').textContent = t > 7 ? `${10 - lost} von 10 – kleiner Infarktkern` : ''; } },

    { t: (st) => st === 1 ? 'M1-Verschluss rechts' : 'CT-Angiographie', sub: (st) => st ? '' : 'Wo sitzt der Verschluss?', steps: 3, vb: (st) => st < 2 ? '0 0 600 610' : '0 0 1000 470',
      bullets: (st) => st === 0 ? ['Großes Gefäß verschlossen? ACI, M1, M2, Basilaris.'] : st === 1 ? ['Die rechte A. cerebri media bricht im M1-Segment ab.', 'Links zum Vergleich: Media bis in die Peripherie.'] : ['Schema: Abbruch in M1 rechts.', 'Kollateralen halten das Gewebe am Leben.'],
      dur: 10, svg: (st) => { if (st < 2) { const k = STACKS.cta, w = 580 * k.a; if (st === 1) SL.cta = k.key; else if (SL.cta == null) SL.cta = Math.round(k.n * .5); return `<g${fade(st === 0)}>${stack(300 - w / 2, 15, 580, 'cta', st === 1)}</g>`; } const tree = (id, cut) => `<g id="${id}">${P('M0 250 C0 190 -20 170 -6 130 C6 100 -6 92 10 84', 'rgba(255,255,255,.9)', 9, { pl: 100, da: 100, doff: 100, id: id + '0' })}${P('M10 84 C-20 76 -44 74 -70 70 C-90 62 -98 40 -100 16', 'rgba(255,255,255,.9)', 5, { pl: 100, da: 100, doff: 100, id: id + '1' })}
          ${cut ? P('M10 84 C30 80 44 79 58 77', 'rgba(255,255,255,.9)', 7, { pl: 100, da: 100, doff: 100, id: id + '2' }) : P('M10 84 C50 78 90 76 130 70', 'rgba(255,255,255,.9)', 7, { pl: 100, da: 100, doff: 100, id: id + '2' })}
          ${cut ? '' : P('M130 70 C150 62 160 42 172 24 M130 70 C148 82 162 100 168 122', 'rgba(255,255,255,.9)', 4.5, { pl: 100, da: 100, doff: 100, id: id + '3' })}</g>`;
        return `${R(60, 30, 880, 400, 18, '#0b0b0c')}${T(84, 60, 'CTA · KORONAR (SCHEMA)', 11, DIM, { w: 700, ls: 1.2 })}${T(880, 250, 'L', 12, DIM, { w: 600 })}${T(110, 250, 'R', 12, DIM, { w: 600 })}
          <g transform="translate(620,70) scale(1.35)">${tree('a-l', false)}</g><g transform="translate(380,70) scale(-1.35,1.35)">${tree('a-r', true)}</g>
          <g id="a-mark"><circle cx="298" cy="174" r="22" fill="none" stroke="${RED}" stroke-width="2.5"/>${T(250, 140, 'M1-Verschluss rechts', 15, RED, { a: 'middle', w: 600 })}</g>
          <g id="a-coll">${P('M300 96 C262 110 232 140 222 176 M246 104 C216 124 196 156 192 190', ORANGE, 2, { da: '3 5', id: 'a-c1' })}${T(120, 214, 'Kollateralen', 13, ORANGE, { w: 600 })}</g>`; },
      update: (t, q, el, st) => { if (st !== 2) return; const u = seg(t, .5, 3.5); for (const s of ['a-l', 'a-r']) for (let i = 0; i < 4; i++) { const e = q(s + i); if (e) e.style.strokeDashoffset = 100 - 100 * lin(u, i * .22, i * .22 + .4); }
        setO(q('a-mark'), win(t, 4, 10)); const p = (t * 1.2) % 1; q('a-mark').firstChild.setAttribute('r', (20 + 6 * Math.sin(p * Math.PI)).toFixed(1)); setO(q('a-coll'), win(t, 6, 10)); q('a-c1').setAttribute('stroke-dashoffset', (t * 14).toFixed(1)); } },

    { t: 'CT-Perfusion – wie es funktioniert', sub: 'Ein Kontrastmittelbolus wird beim Durchlaufen gefilmt', bullets: ['Der Bolus wird 45 Sekunden gefilmt.', 'Gesund: früh, steil, hoch.', 'Penumbra: verspätet und flach. Kern: kaum Signal.'],
      dur: 12, svg: () => { const curve = (pk, hgt, wid) => { let d = ''; for (let x = 0; x <= 100; x += 2) { const y = hgt * Math.exp(-((x - pk) ** 2) / (2 * wid * wid)); d += `${x ? 'L' : 'M'}${(540 + x * 3.6).toFixed(1)} ${(380 - y).toFixed(1)}`; } return d; };
        return `${slice(60, 60, 330, 'ct', 'none', 'Serie · gleiche Schicht', { id: 'p-img' })}<rect id="p-bolus" x="60" y="60" width="330" height="330" rx="14" fill="#fff" opacity="0"/>
          <circle cx="${60 + 330 * .68}" cy="${60 + 330 * .47}" r="9" fill="none" stroke="${GREEN}" stroke-width="2.5"/><circle cx="${60 + 330 * TERR[0]}" cy="${60 + 330 * .36}" r="9" fill="none" stroke="${ORANGE}" stroke-width="2.5"/><circle cx="${60 + 330 * CORE[0]}" cy="${60 + 330 * CORE[1]}" r="9" fill="none" stroke="${RED}" stroke-width="2.5"/>
          ${T(60, 420, 'Bild 1 / 30', 12, DIM, { mono: true, id: 'p-fr' })}
          ${R(480, 60, 460, 360, 18, CARD)}${T(504, 92, 'ZEIT-DICHTE-KURVEN', 11, DIM, { w: 700, ls: 1.2 })}${P('M540 110 V380 H900', 'rgba(255,255,255,.25)', 1.5)}${T(900, 400, 'Zeit (s)', 11, DIM, { a: 'end' })}${T(528, 124, 'HU', 11, DIM, { a: 'end' })}
          <clipPath id="p-clip"><rect id="p-cr" x="540" y="100" width="0" height="290"/></clipPath><g clip-path="url(#p-clip)">${P(curve(32, 230, 9), GREEN, 3)}${P(curve(52, 120, 16), ORANGE, 3)}${P(curve(60, 22, 18), RED, 3)}</g>
          ${T(700, 150, 'gesund', 13, GREEN, { w: 600 })}${T(772, 250, 'Penumbra – verspätet', 13, ORANGE, { w: 600 })}${T(790, 350, 'Kern', 13, RED, { w: 600 })}<path id="p-now" d="M540 110 V380" stroke="rgba(255,255,255,.5)" stroke-width="1" stroke-dasharray="3 4"/>`; },
      update: (t, q) => { const u = lin(t % 12, .8, 9); q('p-cr').setAttribute('width', (360 * u).toFixed(1)); q('p-now').setAttribute('transform', `translate(${(360 * u).toFixed(1)} 0)`); q('p-fr').textContent = `Bild ${1 + Math.floor(u * 29)} / 30 · ${(u * 45).toFixed(0)} s`;
        setO(q('p-bolus'), .16 * Math.exp(-((u * 100 - 34) ** 2) / 300)); } },

    { t: 'Perfusionskarten lesen', sub: 'Kern und Penumbra – das Mismatch', bullets: ['Kern: CBF unter 30 % – verloren.', 'Penumbra: Tmax über 6 s – rettbar.', 'Großes Mismatch = viel zu gewinnen.'],
      dur: 11, svg: () => `${slice(60, 40, 280, 'cbf', 'stroke', 'CBF · Blutfluss')}${slice(360, 40, 280, 'cbv', 'stroke', 'CBV · Blutvolumen')}${slice(660, 40, 280, 'tmax', 'stroke', 'Tmax · Verzögerung')}
        <g id="m-core"><ellipse cx="${60 + 280 * CORE[0]}" cy="${40 + 280 * CORE[1]}" rx="36" ry="46" fill="none" stroke="#fff" stroke-width="2.2"/>${T(200, 346, 'Kern: CBF < 30 %', 13, W, { a: 'middle', w: 600 })}</g>
        <g id="m-pen"><path d="M${660 + 280 * .455} ${40 + 280 * .49} L${660 + 280 * .2} ${40 + 280 * .2} Q${660 + 280 * .03} ${40 + 280 * .49} ${660 + 280 * .2} ${40 + 280 * .79} Z" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="5 4"/>${T(800, 346, 'Penumbra: Tmax > 6 s', 13, W, { a: 'middle', w: 600 })}</g>
        ${T(500, 346, 'Volumen erhalten', 13, 'rgba(235,235,245,.7)', { a: 'middle', id: 'm-cbv' })}
        ${R(60, 380, 880, 70, 16, CARD)}${T(84, 422, 'MISMATCH', 12, DIM, { w: 700, ls: 1.2 })}${R(200, 404, 620, 22, 11, FILL)}${R(200, 404, 0, 22, 11, ORANGE, { id: 'm-bp' })}${R(200, 404, 0, 22, 11, RED, { id: 'm-bc' })}${T(840, 421, '', 14, W, { w: 600, mono: true, id: 'm-r' })}`,
      update: (t, q) => { setO(q('m-core'), win(t, 1, 11)); setO(q('m-cbv'), win(t, 3, 11)); setO(q('m-pen'), win(t, 4.5, 11)); q('m-bp').setAttribute('width', (620 * seg(t, 6, 7.5)).toFixed(0)); q('m-bc').setAttribute('width', (620 * .136 * seg(t, 7.5, 8.5)).toFixed(0)); q('m-r').textContent = t > 8.5 ? '110 : 15' : ''; } },

    { t: 'Und im MRT?', sub: 'Dieselbe Frage, andere Bilder', bullets: ['DWI hell + ADC dunkel = Kern.', 'FLAIR noch negativ → unter 4,5 Stunden.', 'PWI größer als DWI = Penumbra.'],
      dur: 11, svg: () => `${slice(40, 50, 215, 'dwi', 'stroke', 'DWI')}${slice(275, 50, 215, 'adc', 'stroke', 'ADC')}${slice(510, 50, 215, 'flair', 'stroke', 'FLAIR')}${slice(745, 50, 215, 'tmax', 'stroke', 'PWI · Tmax')}
        <g id="r-1">${T(147, 292, 'hell', 14, W, { a: 'middle', w: 600 })}${T(382, 292, 'dunkel', 14, W, { a: 'middle', w: 600 })}${P('M120 306 H410', B, 2)}${T(265, 328, 'Diffusionsstörung = Kern', 13, B, { a: 'middle', w: 600 })}</g>
        <g id="r-2">${T(617, 292, 'noch unauffällig', 14, W, { a: 'middle', w: 600 })}${T(617, 328, 'DWI/FLAIR-Mismatch → < 4,5 h', 13, GREEN, { a: 'middle', w: 600 })}</g>
        <g id="r-3">${T(852, 292, 'größer als DWI', 14, W, { a: 'middle', w: 600 })}${T(852, 328, 'PWI/DWI-Mismatch = Penumbra', 13, ORANGE, { a: 'middle', w: 600 })}</g>
        ${R(40, 366, 920, 76, 16, CARD)}${T(64, 398, 'CT', 13, W, { w: 700 })}${T(110, 398, 'nativ → CTA → Perfusion · 5–10 Minuten · überall, auch nachts', 13, 'rgba(235,235,245,.8)')}${T(64, 424, 'MRT', 13, W, { w: 700 })}${T(110, 424, 'DWI/ADC → FLAIR → MRA → PWI · 15–20 Minuten · genauer, aber seltener verfügbar', 13, 'rgba(235,235,245,.8)')}`,
      update: (t, q) => { setO(q('r-1'), win(t, 1, 11)); setO(q('r-2'), win(t, 3.5, 11)); setO(q('r-3'), win(t, 6, 11)); } },

    { poll: true, t: 'Abstimmung', sub: 'CT ohne Blutung · CTA: M1-Verschluss rechts · Perfusion: Kern 15 ml, Penumbra 110 ml', q: 'Was bedeutet dieser Befund?', opts: ['Das Gewebe ist schon verloren', 'Viel rettbares Gewebe – rasch rekanalisieren', 'Erst den Verlauf abwarten', 'Die Perfusion ist normal'], ok: 1, why: 'Kleiner Kern, große Penumbra: Das Gewebe dahinter lebt noch – jede Minute bis zur Wiedereröffnung zählt.' },

    { t: 'Systemische Lyse', sub: 'Das Gerinnsel medikamentös auflösen', bullets: ['rt-PA → Plasmin spaltet das Fibrin.', 'Bis 4,5 Stunden; Blutung vorher ausgeschlossen.', 'Risiko: Hirnblutung 3–6 %.'],
      dur: 12, svg: () => { let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647; let mesh = ''; const N = 46;
        for (let i = 0; i < N; i++) { const x = 400 + rnd() * 210, y = 150 + rnd() * 150, a = rnd() * Math.PI, l = 26 + rnd() * 40; mesh += `<path class="fb" data-x="${x.toFixed(0)}" d="M${(x - Math.cos(a) * l).toFixed(1)} ${clamp(y - Math.sin(a) * l, 142, 308).toFixed(1)} L${(x + Math.cos(a) * l).toFixed(1)} ${clamp(y + Math.sin(a) * l, 142, 308).toFixed(1)}" stroke="#c9a15a" stroke-width="2.4" stroke-linecap="round"/>`; }
        let cells = ''; for (let i = 0; i < 16; i++) cells += `<ellipse class="rc" data-x="${(410 + rnd() * 190).toFixed(0)}" cx="${(410 + rnd() * 190).toFixed(0)}" cy="${(160 + rnd() * 130).toFixed(0)}" rx="13" ry="9" fill="#8b1e1e"/>`;
        let tpa = ''; for (let i = 0; i < 14; i++) tpa += `<circle class="tp" data-i="${i}" data-y="${(160 + rnd() * 130).toFixed(0)}" r="6" fill="${B}"/>`;
        let fl = ''; for (let i = 0; i < 10; i++) fl += `<circle class="fl" data-i="${i}" data-y="${(160 + rnd() * 130).toFixed(0)}" r="5" fill="rgba(255,69,58,.75)"/>`;
        return `${R(60, 120, 880, 210, 0, 'rgba(255,255,255,.07)')}${P('M60 120 H940 M60 330 H940', 'rgba(255,255,255,.35)', 3)}${T(70, 100, 'ARTERIE (LÄNGSSCHNITT)', 11, DIM, { w: 700, ls: 1.2 })}
          <g id="l-fl">${fl}</g><g id="l-cells">${cells}</g><g id="l-mesh">${mesh}</g><g id="l-tpa">${tpa}</g>
          ${T(505, 86, 'Thrombus: Fibrinnetz mit Blutzellen', 14, '#c9a15a', { a: 'middle', w: 600 })}
          <circle cx="120" cy="392" r="7" fill="${B}"/>${T(136, 397, 'rt-PA aktiviert Plasminogen → Plasmin', 13, 'rgba(235,235,245,.85)')}<path d="M470 392 h26" stroke="#c9a15a" stroke-width="3" stroke-linecap="round"/>${T(506, 397, 'Fibrin wird gespalten', 13, 'rgba(235,235,245,.85)')}
          ${T(940, 397, '', 14, GREEN, { a: 'end', w: 600, id: 'l-st' })}`; },
      update: (t, q, el) => { const front = 380 + 260 * seg(t, 2.5, 9);
        el.querySelectorAll('.fb').forEach(e => { const x = +e.dataset.x; e.setAttribute('opacity', clamp((x - front) / 40 + .5, 0, 1).toFixed(2)); });
        el.querySelectorAll('.rc').forEach(e => { const x = +e.dataset.x; const free = clamp((front - x) / 30, 0, 1); e.setAttribute('transform', `translate(${(free * (t - 2.5) * 22 * free).toFixed(1)} 0)`); e.setAttribute('opacity', (1 - .5 * free).toFixed(2)); });
        el.querySelectorAll('.tp').forEach(e => { const i = +e.dataset.i; const x = 70 + ((t * 70 + i * 47) % Math.max(60, front - 70)); e.setAttribute('cx', x.toFixed(1)); e.setAttribute('cy', e.dataset.y); e.setAttribute('opacity', t > .6 ? .95 : 0); });
        el.querySelectorAll('.fl').forEach(e => { const i = +e.dataset.i; const lim = front < 630 ? 370 : 940; const x = 60 + ((t * 120 + i * 88) % (lim - 60)); e.setAttribute('cx', x.toFixed(1)); e.setAttribute('cy', e.dataset.y); });
        q('l-st').textContent = t > 9.2 ? 'Gefäß wieder offen' : ''; } },

    { t: 'Grenzen der Lyse', sub: 'Große Thromben in großen Gefäßen', bullets: ['Lange Thromben löst die Lyse kaum.', 'ACI und M1: nur 10–30 % öffnen sich.', 'Dafür gibt es die Thrombektomie.'],
      dur: 10, svg: () => { const rows = [['M3 / distal', 2, .78], ['M2', 4, .52], ['M1', 9, .26], ['ACI-T', 14, .09]];
        return `${T(60, 60, 'REKANALISATION UNTER LYSE ALLEIN', 11, DIM, { w: 700, ls: 1.2 })}` + rows.map(([n, len, r], i) => { const y = 90 + i * 84; return `${R(60, y, 880, 68, 16, CARD)}${T(84, y + 40, n, 16, W, { w: 600 })}<g transform="translate(230,${y + 34})">${P('M0 0 H250', 'rgba(255,255,255,.2)', 14 + i * 4)}<rect x="${110 - len * 3}" y="${-6 - i * 2}" width="${len * 6}" height="${12 + i * 4}" rx="6" fill="#7a1f1f"/></g>${T(500, y + 40, `Thrombus ~${len} mm`, 12, DIM, { mono: true })}
          ${R(640, y + 24, 220, 18, 9, FILL)}${R(640, y + 24, 0, 18, 9, r > .5 ? GREEN : (r > .2 ? ORANGE : RED), { id: 'g-b' + i })}${T(872, y + 39, '', 14, W, { w: 600, mono: true, id: 'g-t' + i })}`; }).join(''); },
      update: (t, q) => { [.78, .52, .26, .09].forEach((r, i) => { const u = seg(t, .8 + i * .9, 1.8 + i * .9); q('g-b' + i).setAttribute('width', (220 * r * u).toFixed(0)); q('g-t' + i).textContent = u > .05 ? Math.round(r * u * 100) + ' %' : ''; }); } },

    { t: 'Mechanische Thrombektomie', sub: 'Wann und wo?', bullets: ['Großes Gefäß + relevantes Defizit.', 'ACI, M1, proximales M2, A. basilaris.', 'Bis 6 Stunden regelhaft, bis 24 Stunden mit Mismatch.'],
      svg: () => '', v3: (st, t, M) => { const hi = {}, labels = []; const add = (ids, name, t0, dx, dy) => { if (t > t0) { ids.forEach(i => { hi[i] = B; }); labels.push({ p: M.mid(ids[0]), text: name, dx, dy }); } };
        add(['ica_r', 'ica_l'], 'ACI', 1, -90, 30); add(['m1_r', 'm1_l'], 'M1', 2.2, -70, -40); add(['m2sup_r', 'm2inf_r', 'm2sup_l', 'm2inf_l'], 'M2 proximal', 3.4, -60, -70); add(['ba'], 'A. basilaris', 4.6, 110, 60);
        return { cam: { c: [0, 286, 24], span: 190, pitch: .12 }, hi, labels }; } },

    { t: 'So läuft die Thrombektomie', sub: 'Vier Schritte', bullets: ['1 · 9F-Schleuse, 8F-Führungskatheter in die ACI', '2 · 5F-Aspirationskatheter, Mikrodraht, Mikrokatheter', '3 · Stent-Retriever entfalten', '4 · Unter Sog zurück, Kontrollserie'],
      svg: () => '', v3: (st, t, M) => { const tt = t % 18, Lg = M.at.ica_r + 35, Lo = M.at.m1_r + (M.occ ? M.occ.arc : 22), g = Lg * seg(tt, .4, 3.4), pull = seg(tt, 11, 13.6), clot = Lo - (Lo - Lg) * pull;
        const asp = tt < 11 ? Lg + (Lo - 10 - Lg) * seg(tt, 4.2, 6) : clot - 6, mic = tt < 8 ? Lg + (Lo + 16 - Lg) * seg(tt, 4.8, 7) : (tt < 11 ? Lo + 16 - 22 * seg(tt, 8, 9.4) : clot - 6), open = seg(tt, 8, 9.6), done = tt > 13.8;
        const step = tt < 4 ? 0 : tt < 8 ? 1 : tt < 11 ? 2 : 3;
        return { cam: tt < 3.6 ? { c: M.pos(g), span: 430 } : { c: M.pos(Lo - 14), span: 120, pitch: .1 }, dim: done ? null : new Set(M.desc('m1_r')),
          cath: [{ to: g, w: 2.7, col: '#8e8e93', min: 3.4 }].concat(tt > 4 ? [{ to: Math.max(Lg, asp), w: 1.7, col: '#c7c7cc', min: 2.4 }, { to: Math.max(Lg, mic), w: .8, col: '#fff', min: 1.3 }] : []),
          stent: tt > 8 && !done ? { a: clot - 12, b: clot + 13, open } : null, marks: done ? [] : [{ p: M.pos(clot), r: 2.3 * (1 - .3 * pull), col: '#b3261e' }],
          cap: done ? 'Gefäß offen · TICI 3' : ['1 · Führungskatheter', '2 · Aspiration und Mikrokatheter', '3 · Retriever entfaltet', '4 · Zurück unter Sog'][step] }; } },

    { poll: true, t: 'Abstimmung', sub: 'Welcher Befund ist das klassische Ziel der Thrombektomie?', q: 'Wo greift der Stent-Retriever?', opts: ['Lakunärer Infarkt im Thalamus', 'M1-Verschluss der A. cerebri media', 'Stammganglienblutung', 'Kleiner kortikaler M4-Ast'], ok: 1, why: 'Der Retriever braucht ein großes, erreichbares Gefäß: ACI, M1, proximales M2 oder die Basilaris.' },

    { t: (st) => 'TICI ' + ['0', '2a', '2b', '3'][st], sub: (st) => ['kein Fluss', 'weniger als die Hälfte des Stromgebiets', 'mehr als die Hälfte', 'vollständig'][st], steps: 4, bullets: (st) => st === 3 ? ['Ziel: mindestens 2b – am besten im ersten Manöver.'] : ['Wie viel vom Stromgebiet ist wieder durchblutet?'],
      svg: () => '', v3: (st, t, M) => { const D = M.desc('m1_r'), n = Math.ceil(D.length * [0, .34, .68, 1][st]), dim = new Set(D.slice(n)), hi = {}; D.slice(0, n).forEach(i => { hi[i] = '#d1d1d6'; });
        let c = [0, 0, 0]; D.forEach(i => { for (let k = 0; k < 3; k++) c[k] += M.seg[i].c[k] / D.length; });
        return { cam: { c, span: 150, yaw: -.5, pitch: .1 }, dim, hi, marks: st === 0 && M.occ ? [{ p: M.occ.p, r: 2.3, col: '#b3261e' }] : [], cap: 'TICI ' + ['0', '2a', '2b', '3'][st] }; } },

    { t: 'Unser Fall', sub: '53 Jahre · Hemiparese links, Neglect · NIHSS 14 · Beginn 16:30 Uhr, jetzt 17:55 Uhr', bullets: ['CT: keine Blutung, ASPECTS 8.', 'CTA: M1-Verschluss rechts.', 'Kern 15 ml, Penumbra 110 ml.', 'Lyse läuft → Thrombektomie.'],
      dur: 9, svg: () => `${slice(60, 50, 270, 'ct', 'stroke', 'CT nativ')}${slice(365, 50, 270, 'cbf', 'stroke', 'CBF')}${slice(670, 50, 270, 'tmax', 'stroke', 'Tmax')}
        ${['keine Blutung · ASPECTS 8', 'Kern 15 ml', 'Penumbra 110 ml'].map((s, i) => `<g id="u-${i}" opacity="0">${R(60 + i * 305, 336, 270, 40, 12, CARD)}${T(195 + i * 305, 362, s, 14, W, { a: 'middle', w: 600 })}</g>`).join('')}
        <g id="u-3" opacity="0">${R(60, 394, 880, 48, 14, 'rgba(10,132,255,.2)', { stroke: 'rgba(10,132,255,.7)', sw: 1.5 })}${T(500, 425, 'M1-Verschluss rechts · Lyse läuft · Thrombektomie', 16, W, { a: 'middle', w: 600 })}</g>`,
      update: (t, q) => { for (let i = 0; i < 4; i++) setO(q('u-' + i), seg(t, .8 + i * 1.2, 1.4 + i * 1.2)); } },

    { t: (st) => st ? 'Selber mal thrombektomieren?' : 'Wo wir sind', sub: (st) => st ? 'Ihr übernehmt' : 'Von der Leiste bis in die A. carotis interna', steps: 2,
      bullets: (st) => st ? ['Der Führungskatheter steht in der ACI rechts.', 'Mikrokatheter durch den Thrombus, Retriever, Sog, Kontrolle.'] : ['Zugang über die A. femoralis in der Leiste.', 'Durch die Aorta und den Bogen in die rechte A. carotis.'],
      start: 'mt_m1_r', diff: 1, svg: () => '', v3: (st, t, M) => { const Lg = M.at.ica_r + 35, g = st ? Lg : Lg * seg(t, .6, 4);
        return st ? { cam: { c: M.occ.p.map((v, i) => v + [12, -18, 0][i]), span: 150, pitch: .1 }, dim: new Set(M.desc('m1_r')), cath: [{ to: Lg, w: 2.7, col: B, min: 3.4 }], marks: [{ p: M.occ.p, r: 2.4, col: '#b3261e' }], labels: [{ p: M.occ.p, text: 'Thrombus in M1', dx: -90, dy: -50, col: RED }, { p: M.pos(Lg), text: 'Führungskatheter', dx: 90, dy: 30, col: B }] }
          : { cam: BODYCAM, still: true, cath: [{ to: g, w: 2.7, col: B, min: 3.4 }], labels: [{ p: M.pos(0), text: 'Leiste', dx: -80, dy: 0 }].concat(t > 4 ? [{ p: M.pos(Lg), text: 'A. carotis interna', dx: -110, dy: -10, col: B }] : []) }; } },

    caseSlide({ n: 5, t: 'Fall 8 · Frau Rossa, 51 Jahre', anam: 'Frau Rossa bekommt aus völligem Wohlbefinden schlagartig stärkste Kopfschmerzen – „wie noch nie“. Ihr wird übel, kurz darauf wird sie schläfrig und trübt ein.', scene: 'head', les: 'sab', syn: 'sab', lines: ['51 Jahre, weiblich', 'Schlagartig „Kopfschmerzen wie nie“', 'Jetzt eingetrübt'], q0: 'Woran denkt ihr zuerst?', ask: ['Welche Bildgebung zuerst – und welche danach?'],
      marks: ring(.5, .435, 46, ORANGE) + ring(.33, .42, 20, ORANGE) + ring(.685, .42, 20, ORANGE), col: ORANGE, dx: 'Subarachnoidalblutung', dxText: 'Blut statt Liquor – in den Fissuren und Furchen.', schema: 'sab', chips: ['Aneurysma > 80 %', 'weiter: CT-Angiographie', 'Reblutung droht'],
      teach: ['Das Blut verteilt sich im Liquorraum.', 'Nächster Schritt: CT-Angiographie.'] }),

    { k: 'Blutungen', t: (st) => ['CT-Angiographie', 'Aneurysma', 'Aneurysma ausschalten'][st], sub: (st) => st === 2 ? 'Ziel: die zweite Blutung verhindern' : '', steps: 3, vb: (st) => st < 2 ? '0 0 600 610' : '0 0 1000 470', bullets: (st) => st === 0 ? ['Woher kommt das Blut?'] : st === 1 ? ['Aneurysma der Basilarisspitze.', 'In über 80 % ist ein Aneurysma die Ursache der spontanen SAB.'] : ['Reblutung 8 % (Sterblichkeit 50–75 %), Hydrocephalus 15 %.', 'Ausschalten in den ersten 12 Stunden.', 'Coils oder WEB von innen – oder Clip von außen.'],
      dur: 12, svg: (st) => { if (st < 2) { const k = STACKS.ancta, w = 580 * k.a; if (st === 1) SL.ancta = k.key; return `<g${fade(st === 0)}>${stack(300 - w / 2, 15, 580, 'ancta', st === 1)}</g>`; } let coil = ''; let ca = 1.2; for (let k = 0; k <= 260; k++) { ca += .3 + .16 * Math.sin(k * .71); const rr = 16 + 30 * Math.abs(Math.sin(k * .043 + .6)) + 8 * Math.sin(k * .29), ox = 14 * Math.sin(k * .061 + 1), oy = 12 * Math.cos(k * .047); coil += `${k ? 'L' : 'M'}${(690 + ox + rr * Math.cos(ca)).toFixed(1)} ${(206 + oy + rr * Math.sin(ca) * (.8 + .2 * Math.sin(k * .09))).toFixed(1)}`; }
        let fl = ''; for (let i = 0; i < 9; i++) fl += `<circle class="af" data-i="${i}" r="4.5" fill="rgba(255,69,58,.8)"/>`;
        return `${stack(60 + (330 - 330 * STACKS.ancta.a) / 2, 35, 330, 'ancta', true)}<g id="k-m0" opacity="0">${T(225, 392, 'Aneurysma der Basilarisspitze', 13, ORANGE, { a: 'middle', w: 600 })}</g>
          ${R(430, 35, 510, 330, 18, '#0b0b0c')}${T(454, 65, 'ANEURYSMA · COILING (SCHEMA)', 11, DIM, { w: 700, ls: 1.2 })}
          ${P('M452 300 C560 300 640 296 918 290', '#2c2c2e', 36)}<circle cx="690" cy="208" r="72" fill="#2c2c2e"/><g id="a-fl">${fl}</g><g id="a-sw"><circle r="4.5" fill="rgba(255,69,58,.8)"/><circle r="4.5" fill="rgba(255,69,58,.8)"/><circle r="4.5" fill="rgba(255,69,58,.8)"/></g>
          ${P('M452 302 C540 302 620 300 660 288 C680 278 686 262 690 244', '#aeaeb2', 5, { id: 'a-mc', pl: 100, da: 100, doff: 100 })}${P(coil, '#f2f2f7', 1.8, { id: 'a-coil', pl: 100, da: 100, doff: 100 })}
          ${T(685, 392, '', 14, GREEN, { a: 'middle', w: 600, id: 'a-ok' })}`; },
      update: (t, q, el, st) => { if (st !== 2) return; setO(q('k-m0'), seg(t, 1.5, 2.2)); q('a-mc').style.strokeDashoffset = 100 - 100 * seg(t, 2, 4); const c = seg(t, 4.5, 10); q('a-coil').style.strokeDashoffset = 100 - 100 * c;
        el.querySelectorAll('.af').forEach(e => { const i = +e.dataset.i, f = (t * .16 + i / 9) % 1; e.setAttribute('cx', (452 + 466 * f).toFixed(1)); e.setAttribute('cy', (300 - 10 * f + ((i * 37) % 20) - 10).toFixed(1)); });
        [...q('a-sw').children].forEach((e, i) => { const a = t * 2.2 + i * 2.1, r = 44 - i * 10; e.setAttribute('cx', (690 + r * Math.cos(a)).toFixed(1)); e.setAttribute('cy', (208 + r * Math.sin(a)).toFixed(1)); }); setO(q('a-sw'), 1 - c * 1.3);
        q('a-ok').textContent = t > 10.3 ? 'Aneurysma ausgeschaltet' : (t > 4.5 ? 'Coils füllen den Sack von innen' : ''); q('a-ok').setAttribute('fill', t > 10.3 ? GREEN : DIM); } },

    { m3: 'coil_ba_kurs', t: (st) => st ? 'Selber mal coilen?' : 'Wo wir sind', sub: (st) => st ? 'Großes Aneurysma der Basilarisspitze – ihr übernehmt' : 'Von der Leiste über die A. vertebralis in die A. basilaris', steps: 2,
      bullets: (st) => st ? ['Der 5F-Sofia steht schon in der A. basilaris.', 'Mikrokatheter in den Sack, dann Coil für Coil: Framing, Filling, Finishing.', 'Kontrollserie: Aneurysma ausgeschaltet, beide P1 offen?'] : ['Führungskatheter in der linken A. vertebralis.', 'Darüber der 5F-Sofia bis in die A. basilaris.'],
      start: 'coil_ba_kurs', diff: 0, btn: 'Fall starten – Sofia liegt in der Basilaris', svg: () => '', v3: (st, t, M) => { const Lg = M.at.va_l + 35, Ls = M.at.ba + .55 * M.len('ba'), u = st ? 1 : seg(t, .6, 4.5), an = M.seg.aneurysm ? M.seg.aneurysm.c : M.mid('ba', 1);
        const cath = [{ to: Math.min(Lg, Ls * u), w: 2.7, col: '#8e8e93', min: 3.4 }, { to: Ls * u, w: 1.7, col: B, min: 2.4 }];
        return st ? { cam: { c: an.map((v, i) => v + [0, -22, 0][i]), span: 130, pitch: .25 }, hi: { aneurysm: ORANGE }, cath, labels: [{ p: an, text: 'Aneurysma', dx: 80, dy: -30, col: ORANGE }, { p: M.pos(Ls), text: 'SOFIA 5F', dx: -80, dy: 20, col: B }] }
          : { cam: BODYCAM, still: true, hi: { aneurysm: ORANGE }, cath, labels: [{ p: M.pos(0), text: 'Leiste', dx: -80 }].concat(t > 4.5 ? [{ p: M.pos(Ls), text: 'A. basilaris', dx: 100, dy: -10, col: B }] : []) }; } },

  ];

  { let cur = null; for (const s of SLIDES) { if ('fall' in s) cur = s.fall; s._fall = cur; } }

  // ---------- 3D-Modell aus dem Simulator ----------
  // Der Gefäßbaum des Falls (cs_tree: Mittellinien mit Kaliber) wird als Röhren gezeichnet, drehbar. Die Folie liefert je Bild
  // eine Szene: Kamera, hervorgehobene Gefäße, Katheter entlang des Wegs von der Leiste, Marken, Beschriftungen.
  const V3 = { M: {}, cam: null, uy: 0, up: 0, drag: null };
  function model(id) {
    if (V3.M[id]) return V3.M[id]; const C = window.CS; if (!C || !C.E || !C.E.ex || !C.E.ex.cs_tree || !C.S || !C.S.catalog) return null;
    const i = C.S.catalog.scenarios.findIndex(x => x.id === id); if (i < 0) return null; let d; try { C.E.ex.cs_tree(i); d = C.E.result(); } catch (e) { return null; } if (!d || !d.segs) return null;
    const seg = {}; for (const g of d.segs) { const n = g.p.length / 3; let c = [0, 0, 0], dm = 0; for (let k = 0; k < n; k++) { c[0] += g.p[k * 3]; c[1] += g.p[k * 3 + 1]; c[2] += g.p[k * 3 + 2]; dm += g.d[k]; }
      g.n = n; g.c = c.map(v => v / n); g.w = dm / n; g.kids = []; g.r = 0; for (let k = 0; k < n; k++) g.r = Math.max(g.r, Math.hypot(g.p[k * 3] - g.c[0], g.p[k * 3 + 1] - g.c[1], g.p[k * 3 + 2] - g.c[2])); seg[g.id] = g; }
    for (const g of d.segs) if (seg[g.par]) seg[g.par].kids.push(g.id);
    const P = [], Lc = [], at = {}; let L = 0;
    d.path.forEach((sid, k) => { const g = seg[sid], nx = seg[d.path[k + 1]]; let end = g.n; if (nx) { let best = 1e9; for (let j = 0; j < g.n; j++) { const dd = Math.hypot(g.p[j * 3] - nx.p[0], g.p[j * 3 + 1] - nx.p[1], g.p[j * 3 + 2] - nx.p[2]); if (dd < best) { best = dd; end = j + 1; } } }
      at[sid] = L; for (let j = 0; j < end; j++) { const q = [g.p[j * 3], g.p[j * 3 + 1], g.p[j * 3 + 2]]; if (P.length) L += Math.hypot(q[0] - P[P.length - 1][0], q[1] - P[P.length - 1][1], q[2] - P[P.length - 1][2]); P.push(q); Lc.push(L); } });
    const pos = (l) => { l = clamp(l, 0, L); let j = 1; while (j < Lc.length - 1 && Lc[j] < l) j++; const a = P[j - 1], b = P[j], f = (l - Lc[j - 1]) / Math.max(1e-6, Lc[j] - Lc[j - 1]); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
    const desc = (id) => { const out = []; const go = (x) => { for (const k of seg[x].kids) { out.push(k); go(k); } }; if (seg[id]) go(id); return out; };
    const mid = (id, f = .5) => { const g = seg[id]; if (!g) return [0, 290, 25]; const j = Math.min(g.n - 1, Math.round((g.n - 1) * f)); return [g.p[j * 3], g.p[j * 3 + 1], g.p[j * 3 + 2]]; };
    return (V3.M[id] = { seg, list: d.segs, P, Lc, at, total: L, occ: d.occ, pos, desc, mid, len: (id) => seg[id] ? (seg[id].n - 1) * d.step : 0 });
  }
  function draw3D(s, t, st) {
    const cv = $('ls3d'), r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2), W = Math.round(r.width * dpr), H = Math.round(r.height * dpr); if (!W || !H) return;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; } const c = cv.getContext('2d'); c.clearRect(0, 0, W, H);
    const M = model(s.m3 || 'mt_m1_r'); if (!M) { c.fillStyle = DIM; c.font = `${15 * dpr}px ${F}`; c.textAlign = 'center'; c.fillText('3D-Modell wird geladen …', W / 2, H / 2); return; }
    const sc = s.v3(st, t, M), tg = sc.cam; if (!V3.cam) V3.cam = { c: tg.c.slice(), span: tg.span, yaw: tg.yaw || 0, pitch: tg.pitch || 0 };
    const cm = V3.cam, k = .07; for (let i = 0; i < 3; i++) cm.c[i] += (tg.c[i] - cm.c[i]) * k; cm.span += (tg.span - cm.span) * k; cm.yaw += ((tg.yaw || 0) - cm.yaw) * k; cm.pitch += ((tg.pitch || 0) - cm.pitch) * k;
    const yaw = cm.yaw + V3.uy + (V3.drag || sc.still ? 0 : .22 * Math.sin(t * .45)), pit = cm.pitch + V3.up, cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pit), sp = Math.sin(pit), sc2 = H / cm.span;
    const pr = (x, y, z) => { x -= cm.c[0]; y -= cm.c[1]; z -= cm.c[2]; const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp; return [W / 2 + x1 * sc2, H / 2 - y1 * sc2, z2]; };
    const items = [];
    for (const g of M.list) { const w = g.w * sc2; if (w < .45 * dpr) continue; const q = pr(g.c[0], g.c[1], g.c[2]), m = g.r * sc2 + 20; if (q[0] < -m || q[0] > W + m || q[1] < -m || q[1] > H + m) continue; items.push([q[2], g, w]); }
    items.sort((a, b) => a[0] - b[0]); c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [z, g, w] of items) { c.beginPath(); for (let j = 0; j < g.n; j++) { const q = pr(g.p[j * 3], g.p[j * 3 + 1], g.p[j * 3 + 2]); if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
      const hi = sc.hi && sc.hi[g.id], dim = sc.dim && sc.dim.has(g.id), l = Math.round(34 + 30 * clamp((z + 70) / 140, 0, 1));
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = w + 2.2 * dpr; c.stroke(); c.strokeStyle = hi || (dim ? '#3d2626' : `hsl(240,4%,${l}%)`); c.lineWidth = Math.max(w, .8 * dpr); c.stroke(); }
    const along = (a, b, wmm, col, minpx) => { if (b <= a) return; c.beginPath(); const n = Math.max(2, Math.ceil((b - a) / 3)); for (let j = 0; j <= n; j++) { const p = M.pos(a + (b - a) * j / n), q = pr(p[0], p[1], p[2]); if (j) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
      const w = Math.max(wmm * sc2, minpx * dpr); c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = w + 2 * dpr; c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
    for (const k2 of sc.cath || []) along(k2.from || 0, k2.to, k2.w, k2.col, k2.min || 2.2);
    if (sc.stent && sc.stent.open > 0) { const { a, b, open } = sc.stent, n = Math.max(6, Math.round((b - a) / 2.2)), amp = 2.1 * open * sc2; c.beginPath(); for (let j = 0; j <= n; j++) { const l = a + (b - a) * j / n, p = M.pos(l), p2 = M.pos(l + 1), q = pr(p[0], p[1], p[2]), q2 = pr(p2[0], p2[1], p2[2]); let nx = -(q2[1] - q[1]), ny = q2[0] - q[0]; const nn = Math.hypot(nx, ny) || 1; nx /= nn; ny /= nn; const sg = j % 2 ? 1 : -1; if (j) c.lineTo(q[0] + nx * amp * sg, q[1] + ny * amp * sg); else c.moveTo(q[0] + nx * amp * sg, q[1] + ny * amp * sg); } c.strokeStyle = '#fff'; c.lineWidth = 1.6 * dpr; c.stroke(); }
    for (const m of sc.marks || []) { const q = pr(m.p[0], m.p[1], m.p[2]); c.beginPath(); c.arc(q[0], q[1], Math.max(m.r * sc2, 4 * dpr), 0, 7); c.fillStyle = m.col; c.globalAlpha = m.a == null ? 1 : m.a; c.fill(); c.globalAlpha = 1; }
    c.font = `600 ${15 * dpr}px ${F}`; c.textBaseline = 'middle';
    for (const lb of sc.labels || []) { const q = pr(lb.p[0], lb.p[1], lb.p[2]), dx = (lb.dx == null ? 60 : lb.dx) * dpr, dy = (lb.dy || 0) * dpr; c.strokeStyle = lb.col || W_; c.lineWidth = 1.5 * dpr; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + dx * .82, q[1] + dy); c.stroke(); c.beginPath(); c.arc(q[0], q[1], 3 * dpr, 0, 7); c.fillStyle = lb.col || W_; c.fill(); c.textAlign = dx < 0 ? 'right' : 'left'; c.fillText(lb.text, q[0] + dx, q[1] + dy); }
    if (sc.cap) { c.textAlign = 'left'; c.font = `700 ${26 * dpr}px ${F}`; c.fillStyle = W_; c.fillText(sc.cap, 22 * dpr, H - 30 * dpr); }
  }
  const W_ = '#fff', BODYCAM = { c: [-15, -60, 40], span: 900 };

  // ---------- Bühne ----------
  const ST = { at: 0, step: 0, ctrl: '', ptr: null, chips: '', open: false, raf: 0, votes: {}, reveal: {}, t0: 0 };
  const $ = (id) => document.getElementById(id);
  function ensureDOM() {
    if ($('lesson')) return;
    const d = document.createElement('div'); d.id = 'lesson';
    d.innerHTML = `<div class="lshead"><span class="lsk" id="lsK"></span><span style="flex:1"></span><span class="lsjoin" id="lsJoin"></span><span id="lsHQ"></span><button id="lsClose">Schließen</button></div>
      <div class="lsbody"><div class="lsstage"><canvas id="ls3d"></canvas><svg id="lsSvg" viewBox="0 0 1000 470" preserveAspectRatio="xMidYMid meet"></svg></div>
      <div class="lstext"><h2 id="lsT"></h2><div class="lssub" id="lsSub"></div><div id="lsBul"></div></div></div>
      <div class="lsfoot"><button id="lsPrev">Zurück</button><div class="lsdots" id="lsDots"></div><span id="lsNo" class="lsno"></span><button id="lsNext" class="primary">Weiter</button></div>`;
    document.body.appendChild(d);
    $('lsClose').onclick = close; $('lsPrev').onclick = prev; $('lsNext').onclick = next;
    document.addEventListener('keydown', (e) => { if (!ST.open) return; if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { next(); e.preventDefault(); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { prev(); e.preventDefault(); } else if (CUR && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { setSlice(CUR.i + (e.key === 'ArrowDown' ? 1 : -1)); e.preventDefault(); } else if (e.key === 'Escape') close(); }, true);
    // Schichten scrollen: Mausrad (Trackpad gesammelt) und Ziehen
    const c3 = $('ls3d'); c3.style.touchAction = 'none'; c3.addEventListener('pointerdown', (e) => { V3.drag = { x: e.clientX, y: e.clientY, uy: V3.uy, up: V3.up }; c3.setPointerCapture(e.pointerId); });
    c3.addEventListener('pointermove', (e) => { if (V3.drag) { V3.uy = V3.drag.uy + (e.clientX - V3.drag.x) * .008; V3.up = clamp(V3.drag.up + (e.clientY - V3.drag.y) * .006, -1.2, 1.2); } }); const up3 = () => { V3.drag = null; }; c3.addEventListener('pointerup', up3); c3.addEventListener('pointercancel', up3); c3.addEventListener('dblclick', () => { V3.uy = V3.up = 0; });
    const sv = $('lsSvg'); let acc = 0, drag = null; sv.style.touchAction = 'none'; sv.style.userSelect = 'none'; sv.style.webkitUserSelect = 'none';
    sv.addEventListener('wheel', (e) => { if (!CUR) return; e.preventDefault(); acc += e.deltaMode ? e.deltaY * 40 : e.deltaY; const n = Math.trunc(acc / 40); if (n) { acc -= n * 40; setSlice(CUR.i + n); } }, { passive: false });
    sv.addEventListener('pointerdown', (e) => { if (CUR && e.target.closest('.stk')) { drag = { y: e.clientY, i: CUR.i }; sv.setPointerCapture(e.pointerId); } });
    sv.addEventListener('pointermove', (e) => { if (drag && CUR) setSlice(drag.i + (e.clientY - drag.y) / 9); });
    sv.addEventListener('pointerup', () => { drag = null; }); sv.addEventListener('pointercancel', () => { drag = null; });
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-ls]'); if (!b) return; const a = b.dataset.ls;
      if (a === 'ctrl') { ST.ctrl = ST.ctrl === b.dataset.id ? '' : b.dataset.id; ST.chips = ''; ST.ptr = null; join(); } else if (a === 'reveal') { ST.reveal[ST.at] = true; render(); } else if (a === 'reset') { ST.votes[ST.at] = {}; ST.reveal[ST.at] = false; render(); } else if (a === 'start') startCase(SLIDES[ST.at]); else if (a === 'link') { if (window.CS && CS.openLink) CS.openLink(); } });
  }
  function go(i, last) { ST.at = clamp(i, 0, SLIDES.length - 1); const n = SLIDES[ST.at].steps || 1; ST.step = last ? n - 1 : 0; render(); }
  // „Weiter“ deckt erst die Schritte einer Folie auf, dann kommt die nächste Folie
  function next() { const s = SLIDES[ST.at]; if (ST.step < (s.steps || 1) - 1) { ST.step++; render(); } else if (ST.at < SLIDES.length - 1) go(ST.at + 1); }
  function prev() { if (ST.step > 0) { ST.step--; render(); } else if (ST.at > 0) go(ST.at - 1, true); }
  const tally = (i) => { const s = SLIDES[i], v = ST.votes[i] || {}, n = s.opts.map(() => 0); for (const k of Object.values(v)) if (n[k] != null) n[k]++; return n; };
  function render() {
    const s = SLIDES[ST.at], svg = $('lsSvg'); svg.setAttribute('viewBox', (typeof s.vb === 'function' ? s.vb(ST.step) : s.vb) || '0 0 1000 470'); CUR = null;
    $('lsK').textContent = s._fall || s.k || 'Ischämischer Schlaganfall'; $('lsK').classList.toggle('case', !!s._fall); $('lsT').textContent = typeof s.t === 'function' ? s.t(ST.step) : s.t; $('lsSub').textContent = (typeof s.sub === 'function' ? s.sub(ST.step) : s.sub) || '';
    $('lsNo').textContent = `${ST.at + 1} / ${SLIDES.length}${s.steps ? ` · Schritt ${ST.step + 1}/${s.steps}` : ''}`; ST.dots = SLIDES.map((x, i) => `<i class="${i === ST.at ? 'on' : ''}${x.poll ? ' poll' : ''}"></i>`).join(''); ST.chips = '';
    $('lsPrev').style.visibility = ST.at || ST.step ? '' : 'hidden'; $('lsNext').style.visibility = ST.at < SLIDES.length - 1 || ST.step < (s.steps || 1) - 1 ? '' : 'hidden'; $('lsNext').textContent = ST.step < (s.steps || 1) - 1 ? 'Aufdecken' : 'Weiter';
    $('lesson').classList.toggle('poll', !!s.poll); $('lesson').classList.toggle('wide', !!s.wide);
    if (s.poll) {
      const n = tally(ST.at), tot = n.reduce((a, b) => a + b, 0), rv = !!ST.reveal[ST.at];
      svg.innerHTML = `${T(500, 56, esc(s.q), 26, W, { a: 'middle', w: 700 })}` + s.opts.map((o, i) => { const five = s.opts.length > 4, st = five ? 66 : 78, bh = five ? 54 : 62, fs = five ? 16 : 18, y = (five ? 84 : 96) + i * st, f = rv && tot ? n[i] / tot : 0, good = rv && i === s.ok;
        return `${R(100, y, 800, bh, 16, good ? 'rgba(48,209,88,.2)' : CARD, { stroke: good ? GREEN : null, sw: 2 })}${R(100, y, Math.max(0, 800 * f), bh, 16, good ? 'rgba(48,209,88,.35)' : 'rgba(10,132,255,.3)')}<circle cx="134" cy="${y + bh / 2}" r="15" fill="${good ? GREEN : FILL}"/>${T(134, y + bh / 2 + 5, 'ABCDE'[i], 15, W, { a: 'middle', w: 700 })}${T(162, y + bh / 2 + 6, esc(o), fs, W, { w: 600 })}${T(880, y + bh / 2 + 6, rv && tot ? `${Math.round(f * 100)} %` : '', 18, W, { a: 'end', w: 600, mono: true })}`; }).join('')
        + T(500, 440, tot ? (rv ? `So habt ihr abgestimmt · ${tot} ${tot === 1 ? 'Stimme' : 'Stimmen'} · ${Math.round(100 * n[s.ok] / tot)} % richtig` : `${tot} ${tot === 1 ? 'Stimme' : 'Stimmen'} abgegeben`) : 'Abstimmen am Handy – dann auflösen', 14, rv && tot ? W : DIM, { a: 'middle', w: rv ? 600 : 400 });
      $('lsBul').innerHTML = `<div class="lsrow"><button data-ls="reveal" class="primary">Auflösen</button><button data-ls="reset">Neu abstimmen</button><button data-ls="link">Handys verbinden</button></div>${rv ? `<div class="lswhy">${esc(s.why)}</div>` : ''}`;
    } else {
      svg.innerHTML = s.svg(ST.step);
      const para = s.para ? s.para(ST.step) : '';
      $('lsBul').innerHTML = (para ? `<p class="lsp">${esc(para)}</p>` : '') + (typeof s.bullets === 'function' ? s.bullets(ST.step) : s.bullets).map((b, i) => `<div class="lsb"${s.hold && i >= (s.keep || 0) ? ` style="animation:lsin .5s ${s.hold + (i - (s.keep || 0)) * .5}s both"` : ''}>${esc(b)}</div>`).join('') + (s.start ? `<div class="lsrow" style="margin-top:14px"><button data-ls="start" class="primary">${esc(s.btn || 'Fall starten – Katheter liegt in der ACI')}</button><button data-ls="link">Handys verbinden</button></div>` : '');
      if (s.init) s.init((id) => svg.querySelector('#' + id), svg);
      const g = svg.querySelector('.stk'); if (g) { CUR = { grp: g.dataset.grp, n: STACKS[g.dataset.key].n }; setSlice(SL[CUR.grp]); }
      ST.ptr = null; $('ls3d').style.display = s.v3 ? 'block' : 'none'; svg.style.visibility = s.v3 ? 'hidden' : ''; if (s.v3 && V3.slide !== ST.at) { V3.slide = ST.at; V3.cam = null; V3.uy = V3.up = 0; } if (g) $('lsNo').textContent = STACKS[g.dataset.key].src + '   ·   ' + $('lsNo').textContent;
      if (s.start || s.qr) fillJoin();
    }
    ST.t0 = performance.now(); join();
  }
  // Raumcode oben rechts (und groß auf der letzten Folie), damit sich alle verbinden können
  const nameOf = (id) => String(id || '').replace(/#[a-z0-9]+$/i, '');
  const people = () => { const L = window.CS && CS.L; return L ? Object.keys(L.people || {}).sort() : []; };
  // Untere Leiste: alle Verbundenen als Namen; ein Klick gibt der Person die Steuerung (scrollen, zeigen), noch ein Klick nimmt sie zurück
  function join() { const L = window.CS && CS.L, pp = people(); $('lsJoin').textContent = L && L.code ? `Code ${L.code}` : '';
    const hq = $('lsHQ'); if (L && L.code && window.QRCode && hq.dataset.code !== L.code) { hq.dataset.code = L.code; hq.innerHTML = ''; try { new QRCode(hq, { text: `${location.origin}${location.pathname.replace(/[^/]*$/, '')}controller.html?code=${L.code}`, width: 132, height: 132, correctLevel: QRCode.CorrectLevel.L }); } catch (e) {} }
    if (ST.ctrl && !pp.some(p => nameOf(p) === nameOf(ST.ctrl))) ST.ctrl = '';
    const key = pp.join('|') + '>' + ST.ctrl + '>' + ST.at; if (key === ST.chips) return; ST.chips = key;
    $('lsDots').innerHTML = pp.length ? pp.map(p => `<button class="lschip${nameOf(p) === nameOf(ST.ctrl) ? ' on' : ''}" data-ls="ctrl" data-id="${esc(p)}">${esc(nameOf(p))}</button>`).join('') : ST.dots || ''; }
  // Was das Handy der steuernden Person braucht: welcher Stapel, welche Schicht
  function phoneState() { if (!ST.open) return null; const sl = SLIDES[ST.at], g = ST.ctrl && CUR && document.querySelector('#lsSvg .stk'); return { title: sl._fall || sl.k || 'Ischämischer Schlaganfall', ctrl: ST.ctrl, key: g ? g.dataset.key : '', a: g ? STACKS[g.dataset.key].a : 1, n: g ? CUR.n : 0, i: g ? CUR.i : 0 }; }
  function remote(m) { if (!ST.open || !ST.ctrl || nameOf(m.by) !== nameOf(ST.ctrl)) return;
    if (m.t === 'lsl' && CUR) setSlice(+m.i); else if (m.t === 'lpt') { ST.ptr = m.x < 0 ? null : { x: +m.x, y: +m.y, at: performance.now() }; drawPtr(); } }
  function drawPtr() { const svg = $('lsSvg'); svg.querySelectorAll('.ptr').forEach(e => e.remove()); const p = ST.ptr; if (!p) return;
    svg.querySelectorAll('.stk').forEach(g => { const x = +g.dataset.x, y = +g.dataset.y, s = +g.dataset.s, w = s * STACKS[g.dataset.key].a, cx = (x + w * p.x).toFixed(1), cy = (y + s * p.y).toFixed(1);
      svg.insertAdjacentHTML('beforeend', `<g class="ptr" pointer-events="none"><circle cx="${cx}" cy="${cy}" r="17" fill="rgba(10,132,255,.22)" stroke="${B}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="${B}"/></g>`); }); }
  function fillJoin() {
    try { if (window.CS && CS.ensureLink) CS.ensureLink(); } catch (e) {}
    const L = window.CS && CS.L; const svg = $('lsSvg'); const code = L && L.code; if (!code) return;
    const url = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}controller.html?code=${code}`;
    const box = $('lsQR'); if (box && window.QRCode && !box.dataset.code) { box.dataset.code = code; box.innerHTML = ''; try { new QRCode(box, { text: url, width: box.clientWidth > 200 ? 196 : 180, height: box.clientWidth > 200 ? 196 : 180, correctLevel: QRCode.CorrectLevel.M }); } catch (e) {} }
    const q = (id) => svg.querySelector('#' + id); const el = q('e-list'); if (el) { const pp = people(); el.innerHTML = pp.slice(0, 24).map((p, i) => `${R(92 + (i % 3) * 168, 250 + ((i / 3) | 0) * 44, 158, 34, 17, FILL)}${T(171 + (i % 3) * 168, 272 + ((i / 3) | 0) * 44, esc(nameOf(p).slice(0, 16)), 14, W, { a: 'middle', w: 600 })}`).join(''); }
    if (q('e-code')) { q('e-code').textContent = code; q('e-url').textContent = 'Kamera auf den Code – oder controller.html'; const n = Object.keys(L.people || {}).length; q('e-n').textContent = n ? `${n} ${n === 1 ? 'Handy' : 'Handys'} verbunden` : 'noch kein Handy verbunden'; }
  }
  function frame(now) {
    if (!ST.open) return; const s = SLIDES[ST.at], svg = $('lsSvg');
    if (!s.poll && s.update) { const t = ((now - ST.t0) / 1000) % (s.dur + 2.5); try { s.update(Math.min(t, s.dur), (id) => svg.querySelector('#' + id), svg, ST.step); } catch (e) { } }
    if ((now | 0) % 1000 < 17) { join(); if (s.start || s.qr) fillJoin(); }
    if (s.v3 && !s.poll) { try { draw3D(s, (now - ST.t0) / 1000, ST.step); } catch (e) { } }
    if (ST.ptr && now - ST.ptr.at > 6000) { ST.ptr = null; drawPtr(); }
    ST.raf = requestAnimationFrame(frame);
  }
  let pollDirty = 0;
  function open() { ensureDOM(); { const k = $('lsBack'); if (k) k.style.display = 'none'; } ST.open = true; $('lesson').classList.add('on'); try { if (window.CS && CS.ensureLink) CS.ensureLink(); } catch (e) {} render(); cancelAnimationFrame(ST.raf); ST.raf = requestAnimationFrame(frame); }
  function close() { ST.open = false; cancelAnimationFrame(ST.raf); const d = $('lesson'); if (d) d.classList.remove('on'); }
  // Abstimmung: die Station schickt die Frage im Wartestatus mit; die Handys antworten mit {t:'vote', id, k}
  function pollForPhones() { if (!ST.open) return null; const s = SLIDES[ST.at]; if (!s.poll) return null; const rv = !!ST.reveal[ST.at], n = tally(ST.at), tot = n.reduce((a, b) => a + b, 0); return { id: 'stroke' + ST.at, q: s.q, sub: s.sub, opts: s.opts, done: rv, ok: rv ? s.ok : -1, pct: rv && tot ? n.map(x => Math.round(100 * x / tot)) : null }; }
  function vote(m) { if (!ST.open) return; const i = +String(m.id || '').replace('stroke', ''); const s = SLIDES[i]; if (!s || !s.poll || ST.reveal[i]) return; (ST.votes[i] = ST.votes[i] || {})[m.by || 'anon'] = +m.k; if (i === ST.at) { clearTimeout(vote.tm); if (performance.now() - pollDirty > 250) { pollDirty = performance.now(); render(); } else vote.tm = setTimeout(() => { if (ST.open && ST.at === i) render(); }, 300); } }
  // Der Beispielfall: M1-Verschluss rechts, Start „Zugang liegt“ – der Führungskatheter steht in der ACI
  function startCase(sl) {
    const S = window.CS && CS.S; if (!S || !S.catalog) return; const i = S.catalog.scenarios.findIndex(x => x.id === sl.start); if (i < 0) return;
    close(); S.domain = S.catalog.scenarios[i].domain; S.scenario = i; S.picked = true; S.difficulty = sl.diff || 0; S.stage = 1; S.tray = [...(S.catalog.scenarios[i].recommended || [])];
    const b = $('start'); b.disabled = false; b.click();
    // Im Simulator bleibt ein Knopf, der in die Vorlesung zurückführt (auf die nächste Folie)
    let k = $('lsBack'); if (!k) { k = document.createElement('button'); k.id = 'lsBack'; k.className = 'primary'; k.textContent = 'Zurück zum Kurs'; document.body.appendChild(k);
      k.onclick = () => { k.style.display = 'none'; const ch = $('change'); if (ch) { try { ch.click(); } catch (e) {} } open(); if (ST.at < SLIDES.length - 1) go(ST.at + 1); }; }
    k.style.display = 'block';
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-lesson]')) open(); });
  window.CathSimLesson = { brain, open, close, pollForPhones, vote, phoneState, remote, slides: SLIDES, go, next, prev, get isOpen() { return ST.open; } };
})();
