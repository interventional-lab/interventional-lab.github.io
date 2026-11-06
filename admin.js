// Verwaltung: Konten, Übungen, Benutzergruppen, Evaluation, Live-Übersicht. Eingebunden von der
// Station (als Fenster über dem Fallmenü) und von admin.html (eigene Seite, als App installierbar).
// Die Seite, die einbindet, reicht Anmeldung und Abmeldung herein (mount); alles andere steckt hier.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  // Modulkennung: der Teil vor dem „·“ – so passen Gruppen auch nach einer Umbenennung des Modultitels.
  const modKey = (m) => String(m || '').split('·')[0].trim().toLowerCase();
  // Diese Version des Workers braucht die Seite.
  const SERVER_V = 10;
  const MARKUP = `<div id="admin">
  <div class="card glass" id="adminCard">
    <div class="mhead"><svg class="ic"><use href="#ic-users"/></svg><b>Verwaltung</b><span style="flex:1;color:var(--dim);font-size:11px" id="adminWho"></span><button id="adminToStation">Zur Station</button><button id="adminLogout" title="Abmelden"><svg class="ic"><use href="#ic-logout"/></svg></button></div>
    <div id="adminNote" class="gatenote" style="display:none;position:static;margin:10px 20px 0"></div>
    <div class="atabs"><button class="on" data-atab="accounts">Konten</button><button data-atab="done">Übungen</button><button data-atab="logins">Anmeldungen</button><button data-atab="comments">Kommentare</button><button data-atab="codes">Module und Benutzergruppen</button><button data-atab="survey">Evaluation</button><button data-atab="live">Live</button></div>
    <div class="mbody">
      <div class="apane on" data-apane="accounts">
        <h4>ANFRAGEN</h4>
        <div id="adminPending" class="acc"></div>
        <h4 style="margin-top:16px">FREIGESCHALTET</h4>
        <div id="adminApproved" class="acc"></div>
        <h4 style="margin-top:16px">ABGELEHNT</h4>
        <div id="adminDeclined" class="acc"></div>
        <div style="margin-top:20px;display:flex;gap:8px;align-items:center"><button id="adminClear" class="no">Alle Konten löschen</button><span style="font-size:11px;color:var(--dim)">entfernt alle Konten und Übungen; Gruppen und Codes bleiben</span><span id="adminClearState" style="font-size:11px;color:var(--ok)"></span></div>
      </div>
      <div class="apane" data-apane="done">
        <div class="s" style="color:var(--dim);margin-bottom:8px">Welche Übungen wer absolviert hat – je Person aufklappbar, mit Datum, Dauer, Durchleuchtung, Kontrastmittel und Komplikationen.</div>
        <div id="adminDone" class="acc"></div>
      </div>
      <div class="apane" data-apane="codes">
        <div class="s" style="color:var(--dim);margin-bottom:8px">Jede Benutzergruppe hat Zugang zu genau den Modulen, die bei ihr angehakt sind – alle anderen Module bleiben für ihre Mitglieder gesperrt. Jede Gruppe hat einen Zugangscode: Bei der Registrierung wählt man die Gruppe und gibt den Code ein; nachträglich geht es in den Einstellungen oder im Fallmenü. Der Zugang kann befristet und die Zahl der Konten begrenzt sein. In jeder Gruppe stehen ihre Mitglieder; von dort lassen sie sich aus der Gruppe nehmen.</div>
        <h4>NEUE BENUTZERGRUPPE</h4>
        <div class="codeform" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px">
          <input id="codeLabel" type="text" placeholder="Name der Benutzergruppe, z. B. Neuro-Kurs WS 26/27" style="flex:2;min-width:200px">
          <input id="codeCode" type="text" placeholder="Code (leer = zufällig)" style="flex:1;min-width:140px">
          <label style="display:flex;flex-direction:column;font-size:10px;color:var(--dim)">Höchstzahl Konten<input id="codeMax" type="number" min="0" placeholder="0 = unbegrenzt" style="width:150px"></label>
          <label style="display:flex;flex-direction:column;font-size:10px;color:var(--dim)">Zugang gültig bis<input id="codeExp" type="date" style="width:150px" disabled></label>
          <label class="ck" style="font-size:12px;align-self:flex-end;padding-bottom:6px"><input id="codeUnlimited" type="checkbox" checked> unbefristet</label>
          <label class="ck" style="font-size:12px;align-self:flex-end;padding-bottom:6px"><input id="codeSurvey" type="checkbox"> Evaluation nach erfolgreichem Fall</label>
        </div>
        <div id="codeModules" class="acc" style="margin-bottom:8px"></div>
        <div style="display:flex;gap:8px;align-items:center"><button class="primary" id="codeAdd">Gruppe mit Code anlegen</button><span id="codeState" style="font-size:11px;color:var(--dim)"></span></div>
        <h4 style="margin-top:16px">BENUTZERGRUPPEN UND CODES</h4>
        <div id="codeList" class="acc"></div>
        <div style="margin-top:12px"><button id="codeClear" class="no">Alle Benutzergruppen löschen</button></div>
      </div>
      <div class="apane" data-apane="access">
        <div class="s" style="color:var(--dim);margin-bottom:8px">Welche Fälle eine Organisation sieht. Ohne Auswahl sind alle Fälle frei; mit Auswahl nur die angehakten. Personen ohne Organisation (alte Namensliste) sehen alles.</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><select id="accessOrg"></select><button id="accessAll">alle</button><button id="accessNone">keine</button><span id="accessState" style="font-size:11px;color:var(--dim)"></span></div>
        <div id="accessList" class="acc"></div>
      </div>
      <div class="apane" data-apane="survey">
        <div class="s" style="color:var(--dim);margin-bottom:8px">Nach jedem erfolgreich abgeschlossenen Fall fragt das Handy (oder die Bilanz an der Station) kurz nach einer Bewertung von 1 bis 5 – aber nur bei Mitgliedern einer Benutzergruppe, bei der die Evaluation eingeschaltet ist (unter „Module und Benutzergruppen“).</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap"><select id="svGroup"><option value="">alle Gruppen</option></select><select id="svCase"><option value="">alle Fälle</option></select><button id="svCsv">Als CSV laden</button><button id="svClear" class="no">Alle Antworten löschen</button><span id="svState" style="font-size:11px;color:var(--dim)"></span></div>
        <div id="svSummary" class="svsum"></div>
        <h4 style="margin-top:16px">EINZELNE ANTWORTEN</h4>
        <div id="svList" class="acc"></div>
      </div>
      <div class="apane" data-apane="live">
        <div class="s" style="color:var(--dim);margin-bottom:8px">Wer gerade an einer Station angemeldet ist, welchen Fall er bearbeitet und welche Handys verbunden sind. Die Stationen melden sich bei jedem Wechsel und sonst alle paar Minuten; wer zehn Minuten nichts meldet, fällt heraus.</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><button id="liveRefresh">Aktualisieren</button><span id="liveState" style="font-size:11px;color:var(--dim)"></span></div>
        <div id="liveList" class="acc"></div>
      </div>
      <div class="apane" data-apane="logins"><div id="adminLogins" class="logins"></div></div>
      <div class="apane" data-apane="comments"><div id="adminComments" class="comments"></div></div>
      <div class="apane" data-apane="legacy">
        <div class="mside" style="flex:1">
          <h4>NAMEN OHNE REGISTRIERUNG</h4>
          <div class="s" style="color:var(--dim);margin-bottom:6px">Ein Name je Zeile. Diese Personen melden sich mit dem Namen und dem gemeinsamen Passwort an, ohne Registrierung.</div>
          <textarea id="adminUsers" spellcheck="false"></textarea>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="primary" id="adminSave">Speichern</button><span id="adminSaved" style="font-size:11px;color:var(--ok)"></span></div>
        </div>
        <div class="mside" style="flex:1">
          <h4>ORGANISATIONEN</h4>
          <div class="s" style="color:var(--dim);margin-bottom:6px">Eine je Zeile. Stehen bei der Registrierung zur Auswahl; neu eingetragene kommen von selbst dazu.</div>
          <textarea id="adminOrgs" spellcheck="false"></textarea>
          <div style="display:flex;gap:8px;align-items:center;margin-top:8px"><button class="primary" id="adminOrgsSave">Speichern</button><span id="adminOrgsSaved" style="font-size:11px;color:var(--ok)"></span></div>
        </div>
      </div>
    </div>
  </div>
</div>
`;
  const api = { ADM: { accounts: [], done: {}, codes: [], modules: [] }, modKey, SERVER_V };
  let D = null;
  const EP = () => D.EP(), token = () => D.token(), userName = () => D.userName(), logout = () => D.logout();
  async function checkServerNote() {
    const el = $('adminNote'); if (!el || !EP()) return;
    let v = null; try { const r = await fetch(EP() + '/version?x=' + Date.now(), { cache: 'no-store' }); v = r.ok ? ((await r.json()).v || 0) : 0; } catch (e) {}
    const note = v !== null && v < SERVER_V ? `Anmeldeserver veraltet (Version ${v}, die Seite braucht ${SERVER_V}) – die aktuelle Datei worker/worker.js aus dem Repo mit „wrangler deploy“ hochladen` : '';
    el.textContent = note; el.style.display = note ? '' : 'none';
  }
  // deps: { EP, token, userName, logout, toStation, toStationLabel?, loadCatalog?, postCatalog? }
  api.mount = function (deps) {
    D = deps;
    if (!$('admin')) document.body.insertAdjacentHTML('beforeend', MARKUP);
    if (deps.toStationLabel) $('adminToStation').textContent = deps.toStationLabel;
      async function adminGet(path) { const r = await fetch(EP() + path + '?x=' + Date.now(), { headers: { 'x-token': token() }, cache: 'no-store' }); if (!r.ok) { const e = new Error((await r.json().catch(() => ({}))).error || 'Fehler'); e.status = r.status; throw e; } return r.json(); }
      const fmtT = (t) => { const d = new Date(t); return `${d.getDate()}.${d.getMonth() + 1}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
      // Kommentare: offene oben, erledigte darunter abgeblendet; je Kommentar „erledigt“ und „löschen“.
      function renderComments(cs) {
        const key = (c) => `${c.t}|${c.name}`;
        const open = cs.filter(c => !c.done).slice().reverse(), done = cs.filter(c => c.done).slice().reverse();
        const item = (c) => `<div class="c${c.done ? ' done' : ''}"><div class="m"><b style="color:var(--fg)">${esc(c.name)}</b> · ${esc(c.caseTitle || 'Allgemein')} · ${fmtT(c.t)}${c.done && c.doneAt ? ` · erledigt ${fmtT(c.doneAt)}` : ''}</div><div class="tx">${esc(c.text).replace(/\n/g, '<br>')}</div>
          <div class="ca"><button data-cdone="${esc(key(c))}" data-v="${c.done ? 0 : 1}">${c.done ? 'wieder öffnen' : 'erledigt'}</button><button class="no" data-cdel="${esc(key(c))}">löschen</button></div></div>`;
        $('adminComments').innerHTML = cs.length ? `<div class="chead">${open.length} offen · ${done.length} erledigt</div>` + open.map(item).join('') + (done.length ? `<div class="chead" style="margin-top:12px">ERLEDIGT</div>` + done.map(item).join('') : '') : '<span style="color:var(--dim)">noch keine Kommentare</span>';
      }
      $('adminComments').addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-cdone], button[data-cdel]'); if (!b) return;
        if (b.dataset.cdel && !confirm('Kommentar endgültig löschen?')) return;
        b.disabled = true;
        try { renderComments(await adminPut('/admin/comments', b.dataset.cdel ? { key: b.dataset.cdel, remove: true } : { key: b.dataset.cdone, done: b.dataset.v === '1' })); }
        catch (err) { b.disabled = false; alert(err.message); }
      });
      const adminPut = async (path, body) => { const r = await fetch(EP() + path, { method: 'PUT', headers: { 'content-type': 'application/json', 'x-token': token() }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Fehler'); return j; };
      document.querySelectorAll('#adminCard .atabs button').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('#adminCard .atabs button').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('#adminCard .apane').forEach(p => p.classList.toggle('on', p.dataset.apane === b.dataset.atab)); }));
      const fmtD = (t) => { const d = new Date(t); return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; };
      const ADM = api.ADM;
      // Ein Konto aus einer Benutzergruppe nehmen (Konto bleibt, verliert nur die Module der Gruppe)
      async function kickMember(b) {
        if (!confirm(`${b.dataset.name} aus der Gruppe „${b.dataset.grp}“ entfernen? Das Konto bleibt bestehen.`)) return;
        try { const j = await adminPut('/admin/accounts', { email: b.dataset.kick, leaveGroup: b.dataset.grp }); ADM.accounts = j.accounts || ADM.accounts;
          for (const c of ADM.codes || []) c.uses = ADM.accounts.filter(a => (a.groups || []).some(g => g.toLowerCase() === c.label.toLowerCase())).length;
          renderCodes(); renderAccounts(); } catch (err) { alert(err.message); }
      }
      function renderAccounts() {
        const nDone = (a) => (ADM.done[a.email.toLowerCase()] || []).length;
        const row = (a, btns, extra = '') => `<div class="row2"><div class="who"><b>${esc(a.first)} ${esc(a.last)}</b><span>${esc(a.email)}${extra} · ${fmtT(a.t)}</span></div>${btns}</div>`;
        const by = (st) => ADM.accounts.filter(a => a.status === st);
        $('adminPending').innerHTML = by('pending').map(a => row(a, `<button class="ok" data-acc="${esc(a.email)}" data-st="approved">Freischalten</button><button class="no" data-acc="${esc(a.email)}" data-st="declined">Ablehnen</button>`, (a.groups || []).length ? ' · ' + esc(a.groups.join(', ')) : '')).join('') || '<div class="empty">keine offenen Anfragen</div>';
        // Freigeschaltete Konten nach Benutzergruppe sortiert; wer in mehreren Gruppen ist, steht bei jeder.
        const ok = by('approved'); const labels = (ADM.codes || []).map(c => c.label);
        for (const a of ok) for (const g of a.groups || []) if (!labels.some(l => l.toLowerCase() === g.toLowerCase())) labels.push(g);
        const member = (a, g) => (a.groups || []).some(x => x.toLowerCase() === g.toLowerCase());
        // Freigaben für einzelne Personen: Module zusätzlich zu denen ihrer Gruppen (z. B. die Testfälle nur für wenige).
    const own = (a) => (a.modules || []).filter(m => (ADM.modules || []).some(x => modKey(x) === modKey(m)));
    const grants = (a) => `<div class="accmods" data-for="${esc(a.email)}" style="display:none">${(ADM.modules || []).map(m => { const viaGroup = (a.effective || []).some(x => modKey(x) === modKey(m)) && !(a.modules || []).some(x => modKey(x) === modKey(m));
      return `<label class="ck"><input type="checkbox" data-grant="${esc(m)}" ${(a.modules || []).some(x => modKey(x) === modKey(m)) ? 'checked' : ''}> ${esc(m)}${viaGroup ? ' <span class="cnt">· über die Gruppe</span>' : ''}</label>`; }).join('') || '<div class="empty">Die Fallliste fehlt noch – einmal die Station starten.</div>'}</div>`;
    const line = (a, g) => row(a, `<button data-mods="${esc(a.email)}">Freigaben${own(a).length ? ' · ' + own(a).length : ''}</button>${g ? `<button data-kick="${esc(a.email)}" data-grp="${esc(g)}" data-name="${esc(a.first + ' ' + a.last)}">Aus der Gruppe entfernen</button>` : ''}<button data-acc="${esc(a.email)}" data-st="removed">Konto entfernen</button>`, ` · ${nDone(a)} Übung${nDone(a) === 1 ? '' : 'en'}${own(a).length ? ' · eigene Freigabe: ' + esc(own(a).map(m => m.split(' · ').slice(-1)[0]).join(', ')) : ''}`) + grants(a);
        const sections = labels.map(g => { const list = ok.filter(a => member(a, g)); if (!list.length) return ''; const c = (ADM.codes || []).find(x => x.label.toLowerCase() === g.toLowerCase());
          return `<div class="ghead"><b>${esc(g)}</b><span>${list.length} ${list.length === 1 ? 'Konto' : 'Konten'}${c ? ' · ' + esc((c.modules || []).map(m => m.replace(/^DeGIR(\/DGNR)? /, '').split(' · ')[0]).join(', ') || 'keine Module') : ' · Gruppe gibt es nicht mehr'}</span></div>` + list.map(a => line(a, g)).join(''); });
        const none = ok.filter(a => !(a.groups || []).length);
        if (none.length) sections.push(`<div class="ghead"><b>Ohne Benutzergruppe</b><span>${none.length} ${none.length === 1 ? 'Konto' : 'Konten'} · sieht keine Module</span></div>` + none.map(line).join(''));
        $('adminApproved').innerHTML = sections.join('') || '<div class="empty">noch niemand freigeschaltet</div>';
        document.querySelectorAll('#adminApproved button[data-kick]').forEach(b => b.addEventListener('click', () => kickMember(b)));
    // Freigaben auf- und zuklappen (alle Vorkommen eines Kontos – wer in mehreren Gruppen ist, steht mehrfach)
    document.querySelectorAll('#adminApproved button[data-mods]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll(`#adminApproved .accmods[data-for="${CSS.escape(b.dataset.mods)}"]`).forEach(d => { d.style.display = d.style.display === 'none' ? '' : 'none'; }); }));
    document.querySelectorAll('#adminApproved .accmods').forEach(d => d.addEventListener('change', async () => {
      const modules = [...d.querySelectorAll('input[data-grant]:checked')].map(x => x.dataset.grant);
      try { const j = await adminPut('/admin/accounts', { email: d.dataset.for, modules }); ADM.accounts = j.accounts || ADM.accounts; const open = d.dataset.for; renderAccounts();
        document.querySelectorAll(`#adminApproved .accmods[data-for="${CSS.escape(open)}"]`).forEach(x => { x.style.display = ''; }); } catch (err) { alert(err.message); } }));
        $('adminDeclined').innerHTML = by('declined').map(a => row(a, `<button class="ok" data-acc="${esc(a.email)}" data-st="approved">Doch freischalten</button><button data-acc="${esc(a.email)}" data-st="removed">Löschen</button>`)).join('') || '<div class="empty">–</div>';
      }
      function renderCodes() {
        // Jedes Modul der aktuellen Fallliste genau einmal; Haken = die Gruppe hat Zugang.
        const mods = [...new Set(ADM.modules || [])];
        const keepChecked = new Set([...document.querySelectorAll('#codeModules input[data-cmod]:checked')].map(x => x.dataset.cmod));
        $('codeModules').innerHTML = mods.length ? mods.map(m => `<label class="ck"><input type="checkbox" data-cmod="${esc(m)}" ${keepChecked.has(m) ? 'checked' : ''}> ${esc(m)}</label>`).join('') : '<div class="empty">Die Fallliste fehlt noch – einmal die Station starten, dann meldet sie die Module.</div>';
        const list = ADM.codes || [];
        const dateVal = (t) => t ? new Date(t).toISOString().slice(0, 10) : '';
        // Mitglieder einer Gruppe: Name, E-Mail, Übungen – und ein Knopf, um sie aus der Gruppe zu nehmen.
        const membersOf = (c) => { const list = (ADM.accounts || []).filter(a => (a.groups || []).some(g => g.toLowerCase() === (c.label || '').toLowerCase()));
          return `<div class="members"><h5>MITGLIEDER · ${list.length}</h5>` + (list.length ? list.map(a => { const n = (ADM.done[a.email.toLowerCase()] || []).length; return `<div class="row2"><div class="who"><b>${esc(a.first)} ${esc(a.last)}</b><span>${esc(a.email)} · ${a.status === 'approved' ? n + ' Übung' + (n === 1 ? '' : 'en') : (a.status === 'pending' ? 'wartet auf Freischaltung' : 'abgelehnt')}</span></div><button data-kick="${esc(a.email)}" data-grp="${esc(c.label)}" data-name="${esc(a.first + ' ' + a.last)}">Aus der Gruppe entfernen</button></div>`; }).join('') : '<div class="empty">noch keine Mitglieder</div>') + '</div>'; };
        $('codeList').innerHTML = list.length ? list.slice().reverse().map(c => `<details class="grp"><summary><div class="who"><b>${esc(c.label || '')} <code>${esc(c.code)}</code></b><span>${esc((c.modules || []).join(', ') || 'kein Modul')} · ${c.uses || 0}${c.max ? ' von ' + c.max : ''} Konten ${c.survey ? "· Evaluation an " : ""}· Zugang ${c.expires ? 'bis ' + fmtD(c.expires) : 'unbefristet'}</span></div></summary>
          <form class="grpform" data-grp="${esc(c.code)}">
            <label>Name der Benutzergruppe<input name="label" type="text" value="${esc(c.label || '')}"></label>
            <label>Zugangscode<input name="code" type="text" value="${esc(c.code)}"></label>
            <label>Zugang gültig bis<input name="expires" type="date" value="${dateVal(c.expires)}" ${c.expires ? '' : 'disabled'}></label>
            <label class="ck"><input type="checkbox" name="unlimited" ${c.expires ? '' : 'checked'}> unbefristet</label>
            <label>Höchstzahl Konten (0 = unbegrenzt)<input name="max" type="number" min="0" value="${c.max || 0}"></label>
            <label class="ck"><input type="checkbox" name="survey" ${c.survey ? 'checked' : ''}> Evaluation nach erfolgreichem Fall</label>
            <div class="mods">${mods.map(m => `<label class="ck"><input type="checkbox" name="mod" value="${esc(m)}" ${(c.modules || []).some(x => modKey(x) === modKey(m)) ? 'checked' : ''}> ${esc(m)}</label>`).join('')}</div>
            <div class="row" style="gap:8px"><button class="primary" type="submit">Speichern</button><button type="button" data-delcode="${esc(c.code)}">Gruppe löschen</button><span class="state" style="font-size:11px;color:var(--dim)"></span></div>
          </form>${membersOf(c)}</details>`).join('') : '<div class="empty">noch keine Benutzergruppen</div>';
        document.querySelectorAll('#codeList button[data-kick]').forEach(b => b.addEventListener('click', () => kickMember(b)));
        document.querySelectorAll('#codeList form.grpform').forEach(f => { f.elements.unlimited.addEventListener('change', () => { f.elements.expires.disabled = f.elements.unlimited.checked; if (f.elements.unlimited.checked) f.elements.expires.value = ''; });
          f.addEventListener('submit', async (ev) => { ev.preventDefault(); const st = f.querySelector('.state'); st.textContent = '…';
          const unlimited = f.elements.unlimited.checked || !f.elements.expires.value;
          const upd = { code: f.dataset.grp, newCode: f.elements.code.value.trim(), label: f.elements.label.value.trim(), modules: [...f.querySelectorAll('input[name=mod]:checked')].map(x => x.value), expires: unlimited ? 0 : new Date(f.elements.expires.value + 'T23:59:59').getTime(), max: +f.elements.max.value || 0, survey: f.elements.survey.checked };
          try { const j = await adminPut('/admin/codes', { update: upd }); ADM.codes = j.codes || []; renderCodes(); $('codeState').textContent = 'Gruppe gespeichert.'; } catch (err) { st.textContent = err.message; } }); });
      }
      $('adminClear').addEventListener('click', async () => { if (!confirm('Wirklich alle Konten und Übungen löschen?')) return; if (prompt('Zur Sicherheit LÖSCHEN eintippen:') !== 'LÖSCHEN') return; try { const j = await adminPut('/admin/accounts', { clear: true }); ADM.accounts = j.accounts || []; ADM.done = {}; renderAccounts(); renderDone(); $('adminClearState').textContent = 'Alle Konten gelöscht.'; } catch (err) { $('adminClearState').textContent = 'Fehler: ' + err.message + ' – Worker auf dem neuesten Stand?'; } });
      $('codeClear').addEventListener('click', async () => { if (!confirm('Wirklich alle Benutzergruppen löschen? Die Mitglieder verlieren die Module dieser Gruppen.')) return; try { const j = await adminPut('/admin/codes', { clearAll: true }); ADM.codes = j.codes || []; renderCodes(); $('codeState').textContent = 'Alle Benutzergruppen gelöscht.'; } catch (err) { $('codeState').textContent = err.message; } });
      $('codeUnlimited').addEventListener('change', () => { $('codeExp').disabled = $('codeUnlimited').checked; if ($('codeUnlimited').checked) $('codeExp').value = ''; });
      $('codeAdd').addEventListener('click', async () => {
        const modules = [...document.querySelectorAll('#codeModules input[data-cmod]:checked')].map(x => x.dataset.cmod);
        if (!$('codeLabel').value.trim()) { $('codeState').textContent = 'Der Gruppe einen Namen geben'; return; }
        const exp = (!$('codeUnlimited').checked && $('codeExp').value) ? new Date($('codeExp').value + 'T23:59:59').getTime() : 0;
        try { const j = await adminPut('/admin/codes', { add: { code: $('codeCode').value.trim(), label: $('codeLabel').value.trim(), modules, max: +$('codeMax').value || 0, expires: exp, survey: $('codeSurvey').checked } }); ADM.codes = j.codes || []; $('codeCode').value = ''; $('codeState').textContent = 'Code angelegt: ' + (ADM.codes.at(-1) || {}).code; renderCodes(); }
        catch (err) { $('codeState').textContent = err.message; }
      });
      $('codeList').addEventListener('click', async (e) => { const b = e.target.closest('button[data-delcode]'); if (!b) return; if (!confirm(`Benutzergruppe ${b.dataset.delcode} löschen? Die Mitglieder verlieren die Module dieser Gruppe.`)) return; try { const j = await adminPut('/admin/codes', { remove: b.dataset.delcode }); ADM.codes = j.codes || []; renderCodes(); } catch (err) { $('codeState').textContent = err.message; } });
      function renderDone() {
        const who = (key) => { const a = ADM.accounts.find(x => x.email.toLowerCase() === key); return a ? { name: `${a.first} ${a.last}`, org: a.org || '' } : { name: key.replace(/^name:/, ''), org: '' }; };
        const keys = Object.keys(ADM.done).sort((p, q) => (ADM.done[q].at(-1) || {}).t - (ADM.done[p].at(-1) || {}).t);
        const catMods = [...new Set((ADM.catalog || []).map(c => c.module || c.domain))];
        $('adminDone').innerHTML = keys.map(k => { const rows = ADM.done[k], w = who(k); const cases = new Set(rows.map(r => r.caseId)).size; const did = new Set(rows.map(r => r.caseId));
          const bars = catMods.map(m => { const inMod = (ADM.catalog || []).filter(c => (c.module || c.domain) === m), nm = inMod.filter(c => did.has(c.id)).length; return `<div class="pmod"><span>${esc(m.replace(/^DeGIR(\/DGNR)? /, ''))}</span><span class="mbar big"><i style="width:${inMod.length ? nm / inMod.length * 100 : 0}%"></i></span><span class="cnt">${nm} / ${inMod.length}</span></div>`; }).join('');
          return `<details><summary><div class="n"><b>${esc(w.name)}</b> <span class="cnt">${esc(w.org)}</span></div><span class="cnt">${cases} Fälle · ${rows.length} Durchgänge · zuletzt ${fmtD(rows.at(-1).t)}</span></summary><div class="pmods">${bars}</div><div class="ex"><span class="hd">FALL</span><span class="hd">DATUM</span><span class="hd">DAUER</span><span class="hd">DL</span><span class="hd">KM</span><span class="hd">KOMPL.</span>${rows.slice().reverse().map(r => `<b>${esc(r.caseTitle || r.caseId)}</b><span>${fmtT(r.t)}</span><span>${fmt(r.caseTime)}</span><span>${fmt(r.fluoro)}</span><span>${Math.round(r.km)} ml</span><span class="${r.dangers ? 'bad' : ''}">${r.dangers}</span>`).join('')}</div></details>`; }).join('') || '<div class="empty">noch keine absolvierten Übungen</div>';
      }
      function renderAccess() {
        const orgsAll = [...new Set((ADM.orgs || []).concat(ADM.accounts.map(a => a.org)).filter(Boolean))];
        const sel = $('accessOrg'); const cur = sel.value; sel.innerHTML = orgsAll.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join(''); if (cur) sel.value = cur;
        const org = sel.value; const list = org ? ADM.access[org.toLowerCase()] : undefined;
        if (!ADM.catalog.length) { $('accessList').innerHTML = '<div class="empty">Die Fallliste fehlt noch – einmal die Station starten, dann meldet sie die Fälle.</div>'; return; }
        $('accessState').textContent = !org ? '' : (Array.isArray(list) ? `${list.length} von ${ADM.catalog.length} Fällen frei` : 'alle Fälle frei (keine Einschränkung)');
        const mods = [...new Set(ADM.catalog.map(c => c.module || c.domain))];
        $('accessList').innerHTML = mods.map(m => `<div class="mod2">${esc(m)}</div>` + ADM.catalog.filter(c => (c.module || c.domain) === m).map(c => `<label class="ck"><input type="checkbox" data-case="${esc(c.id)}" ${!Array.isArray(list) || list.includes(c.id) ? 'checked' : ''}> ${esc(c.title)}</label>`).join('')).join('');
      }
      async function saveAccess(cases) {
        const org = $('accessOrg').value; if (!org) return;
        try { const j = await adminPut('/admin/access', { org, cases }); ADM.access = j.access; renderAccess(); } catch (e) { $('accessState').textContent = e.message; }
      }
      $('accessOrg').addEventListener('change', renderAccess);
      $('accessAll').onclick = () => saveAccess(null);
      $('accessNone').onclick = () => saveAccess([]);
      $('accessList').addEventListener('change', () => { const all = [...document.querySelectorAll('#accessList input[data-case]')]; const on = all.filter(i => i.checked).map(i => i.dataset.case); saveAccess(on.length === all.length ? null : on); });
      document.getElementById('admin').addEventListener('click', async (e) => {
        const b = e.target.closest('button[data-acc]'); if (!b) return;
        if (b.dataset.st === 'removed' && !confirm('Konto wirklich entfernen?')) return;
        try { const j = await adminPut('/admin/accounts', { email: b.dataset.acc, status: b.dataset.st }); ADM.accounts = j.accounts; renderAccounts(); } catch (err) { alert(err.message); }
      });
      $('adminOrgsSave').onclick = async () => {
        try { const j = await adminPut('/admin/orgs', { orgs: $('adminOrgs').value.split('\n').map(s => s.trim()).filter(Boolean) }); $('adminOrgs').value = j.orgs.join('\n'); $('adminOrgsSaved').textContent = 'gespeichert'; setTimeout(() => { $('adminOrgsSaved').textContent = ''; }, 3000); }
        catch (e) { $('adminOrgsSaved').textContent = e.message; }
      };
      async function openAdmin() {
        $('admin').classList.add('on'); $('adminWho').textContent = userName(); checkServerNote();
        try { const a = await adminGet('/admin/accounts'); ADM.accounts = a.accounts || []; $('adminOrgs').value = (a.orgs || []).join('\n'); $('adminUsers').value = (a.users || []).join('\n'); }
        catch (e) {
          // Die Sitzung gilt beim Worker nicht mehr als Admin (etwa nach einem Worker-Wechsel): neu anmelden.
          if (e.status === 401 || e.status === 403) { alert('Die Anmeldung ist nicht mehr gültig – bitte als Admin neu anmelden.'); logout(); return; }
          ADM.accounts = []; $('adminPending').innerHTML = `<div class="empty">${esc(e.message)} – Worker aktualisieren?</div>`;
        }
        try { ADM.done = await adminGet('/admin/done'); } catch (e) { ADM.done = {}; }
        try { const a = await adminGet('/admin/access'); ADM.access = a.access || {}; ADM.catalog = a.catalog || []; ADM.orgs = a.orgs || []; } catch (e) { ADM.access = {}; ADM.catalog = []; ADM.orgs = []; }
        try { const c = await adminGet('/admin/codes'); ADM.codes = c.codes || []; ADM.modules = c.modules || []; } catch (e) { ADM.codes = []; ADM.modules = []; }
        renderAccounts(); renderDone(); renderAccess(); renderCodes();
        // Fehlt die Modulliste (Worker kennt die Fallliste noch nicht), lädt die Verwaltung die Engine
        // selbst, meldet die Fälle und holt die Liste erneut.
        if (!ADM.modules.length || !ADM.catalog.length) {
          $('codeModules').innerHTML = '<div class="empty">Fallliste wird geladen …</div>';
          try { if (!D.loadCatalog) throw new Error('einmal eine Station öffnen – sie meldet dann die Fallliste'); await D.loadCatalog(); await D.postCatalog(true); const c = await adminGet('/admin/codes'); ADM.codes = c.codes || []; ADM.modules = c.modules || []; const a = await adminGet('/admin/access'); ADM.catalog = a.catalog || []; renderCodes(); renderAccess(); renderDone(); }
          catch (e) { $('codeModules').innerHTML = `<div class="empty">Fallliste konnte nicht geladen werden: ${esc(e.message)}</div>`; }
        }
        try {
          const rows = await adminGet('/admin/logins');
          $('adminLogins').innerHTML = rows.length ? rows.slice(-200).reverse().map(r => `<div><b>${esc(r.name)}</b> <span class="r">${r.role === 'controller' ? 'Handy' : (r.role === 'admin' ? 'Admin' : 'Station')} · ${fmtT(r.t)}</span></div>`).join('') : '<span style="color:var(--dim)">noch keine Anmeldungen</span>';
        } catch (e) { $('adminLogins').innerHTML = `<span style="color:var(--dim)">${esc(e.message)}</span>`; }
        try {
          renderComments(await adminGet('/admin/comments'));
        } catch (e) { $('adminComments').innerHTML = `<span style="color:var(--dim)">${esc(e.message)}</span>`; }
        try { const j = await adminGet('/admin/surveys'); ADM.surveys = j.rows || []; ADM.surveyQ = j.questions || []; } catch (e) { ADM.surveys = []; ADM.surveyQ = []; $('svState').textContent = e.message + ' – Worker aktualisieren?'; }
        renderSurveys(); loadPresence();
      }
      // ---------- Live: wer ist gerade angemeldet und an welchem Fall ----------
      async function loadPresence() {
        try { const rows = await adminGet('/admin/presence'); ADM.presence = Array.isArray(rows) ? rows : []; $('liveState').textContent = 'Stand ' + fmtT(Date.now()); }
        catch (e) { ADM.presence = []; $('liveState').textContent = e.message + ' – Worker aktualisieren?'; }
        const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'gerade eben' : 'vor ' + m + ' min'; };
        const dur = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; };
        const rows = ADM.presence;
        $('liveList').innerHTML = rows.length ? rows.map(r => `<div class="row2"><div class="who"><b>${esc(r.name)}</b><span>${esc(r.email || '')}</span></div>
          <div class="who" style="flex:2"><b>${r.state === 'case' ? esc(r.caseTitle || r.caseId) : '<span style="color:var(--dim)">im Fallmenü</span>'}</b><span>${r.state === 'case' ? esc(r.module || '') + ' · seit ' + dur(r.since) : ''}</span></div>
          <div class="who"><b>${(r.phones || []).length ? (r.phones || []).length + ' Handy' + ((r.phones || []).length === 1 ? '' : 's') : '–'}</b><span>${esc((r.phones || []).join(', '))}</span></div>
          <span class="cnt">${ago(r.t)}</span></div>`).join('') : '<div class="empty">gerade niemand angemeldet</div>';
      }
      $('liveRefresh').addEventListener('click', loadPresence);
      document.querySelector('#adminCard .atabs button[data-atab="live"]').addEventListener('click', loadPresence);
      setInterval(() => { const pane = document.querySelector('#adminCard .apane[data-apane="live"]'); if ($('admin').classList.contains('on') && pane && pane.classList.contains('on')) loadPresence(); }, 30000);
      // ---------- Evaluation: Mittelwerte je Frage, je Fall und die einzelnen Antworten ----------
      function svRows() { const g = $('svGroup').value, c = $('svCase').value; return (ADM.surveys || []).filter(r => (!g || (r.groups || []).includes(g)) && (!c || r.caseId === c)); }
      function renderSurveys() {
        const all = ADM.surveys || [], Q = ADM.surveyQ || [];
        const fill = (sel, opts, first) => { const cur = sel.value; sel.innerHTML = `<option value="">${first}</option>` + opts.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join(''); if (opts.some(o => o[0] === cur)) sel.value = cur; };
        fill($('svGroup'), [...new Set(all.flatMap(r => r.groups || []))].sort().map(g => [g, g]), 'alle Gruppen');
        const cases = new Map(); all.forEach(r => cases.set(r.caseId, r.caseTitle || r.caseId)); fill($('svCase'), [...cases].sort((a, b) => a[1].localeCompare(b[1])), 'alle Fälle');
        const rows = svRows();
        const mean = (rs, k) => { const v = rs.map(r => (r.answers || {})[k]).filter(x => x >= 1); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
        const bar = (m) => m == null ? '<span class="cnt">–</span>' : `<span class="mbar big"><i style="width:${(m - 1) / 4 * 100}%"></i></span><b>${m.toFixed(1).replace('.', ',')}</b>`;
        $('svState').textContent = all.length ? `${rows.length} von ${all.length} Antworten` : '';
        if (!rows.length) { $('svSummary').innerHTML = '<div class="empty">noch keine Antworten</div>'; $('svList').innerHTML = ''; return; }
        const byCase = new Map(); rows.forEach(r => { if (!byCase.has(r.caseId)) byCase.set(r.caseId, []); byCase.get(r.caseId).push(r); });
        $('svSummary').innerHTML = `<div class="svgrid">${Q.map(q => `<div class="svline"><span>${esc(q.text)}</span>${bar(mean(rows, q.key))}</div>`).join('')}</div>` +
          `<h4 style="margin-top:16px">JE FALL</h4><div class="svtab"><div class="hd">FALL</div><div class="hd">N</div>${Q.map(q => `<div class="hd" title="${esc(q.text)}">${esc(q.key.toUpperCase())}</div>`).join('')}` +
          [...byCase].map(([id, rs]) => `<div>${esc(rs[0].caseTitle || id)}</div><div>${rs.length}</div>${Q.map(q => { const m = mean(rs, q.key); return `<div>${m == null ? '–' : m.toFixed(1).replace('.', ',')}</div>`; }).join('')}`).join('') + '</div>';
        document.querySelectorAll('#svSummary .svtab').forEach(t => t.style.gridTemplateColumns = `minmax(160px,2fr) 40px repeat(${Q.length}, minmax(60px,1fr))`);
        $('svList').innerHTML = rows.slice().reverse().slice(0, 300).map(r => `<div class="row2"><div class="who"><b>${esc(r.name || '')}</b><span>${esc(r.caseTitle || r.caseId)} · ${esc(r.difficulty || '')} · ${fmtT(r.t)} · ${r.via === 'station' ? 'Station' : 'Handy'}${r.station && r.station !== r.name ? ' an der Station von ' + esc(r.station) : ''}${r.manual ? ' · von Hand gestartet' : ''}${(r.groups || []).length ? ' · ' + esc(r.groups.join(', ')) : ''}</span><span>${Q.map(q => `${esc(q.key)} ${(r.answers || {})[q.key] || '–'}`).join(' · ')}</span>${r.comment ? `<span class="svcm">„${esc(r.comment)}“</span>` : ''}</div><button data-svdel="${esc(r.t + '|' + r.name)}">Löschen</button></div>`).join('');
      }
      $('svGroup').addEventListener('change', renderSurveys); $('svCase').addEventListener('change', renderSurveys);
      $('svList').addEventListener('click', async (e) => { const b = e.target.closest('button[data-svdel]'); if (!b || !confirm('Diese Antwort löschen?')) return; try { const j = await adminPut('/admin/surveys', { remove: b.dataset.svdel }); ADM.surveys = j.rows || []; renderSurveys(); } catch (err) { $('svState').textContent = err.message; } });
      $('svClear').addEventListener('click', async () => { if (!confirm('Wirklich alle Antworten der Evaluation löschen?')) return; try { const j = await adminPut('/admin/surveys', { clear: true }); ADM.surveys = j.rows || []; renderSurveys(); } catch (err) { $('svState').textContent = err.message; } });
      $('svCsv').addEventListener('click', () => {
        const Q = ADM.surveyQ || [], q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const lines = [['Zeit', 'Name', 'E-Mail', 'Station', 'Gruppen', 'Fall', 'Modul', 'Schwierigkeit', 'Über', 'Von Hand', ...Q.map(x => x.text), 'Anmerkung'].map(q).join(';')]
          .concat(svRows().map(r => [new Date(r.t).toISOString(), r.name, r.email, r.station || '', (r.groups || []).join(', '), r.caseTitle, r.module, r.difficulty, r.via, r.manual ? 'ja' : '', ...Q.map(x => (r.answers || {})[x.key] || ''), r.comment].map(q).join(';')));
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv' })); a.download = 'evaluation.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      });
      $('adminSave').onclick = async () => {
        const users = $('adminUsers').value.split('\n').map(s => s.trim()).filter(Boolean);
        try { const r = await fetch(EP() + '/admin/users', { method: 'PUT', headers: { 'content-type': 'application/json', 'x-token': token() }, body: JSON.stringify({ users }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Fehler'); $('adminUsers').value = j.users.join('\n'); $('adminSaved').textContent = `gespeichert – ${j.users.length} Namen`; setTimeout(() => { $('adminSaved').textContent = ''; }, 3000); }
        catch (e) { $('adminSaved').textContent = e.message; }
      };
      $('adminToStation').onclick = () => D.toStation();
      $('adminLogout').onclick = () => logout();
      Object.assign(api, { open: openAdmin, get: adminGet, put: adminPut });
  };
  window.CathSimAdmin = api;
})();
