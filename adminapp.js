// admin.html: die Verwaltung als eigene Seite – aufs Handy legbar wie eine App. Anmelden kann sich nur
// ein Admin; die Sitzung liegt unter eigenen Schlüsseln und meldet eine Station im selben Browser nicht ab.
(function () {
  const cfg = window.CATHSIM_CONFIG, $ = (id) => document.getElementById(id);
  const EP = () => (cfg.logEndpoint || '').replace(/\/$/, '');
  const K = { token: 'cathsim.admin.token', user: 'cathsim.admin.user' };
  const get = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
  const token = () => get(K.token), userName = () => get(K.user);
  function logout() { try { localStorage.removeItem(K.token); localStorage.removeItem(K.user); } catch (e) {} location.reload(); }
  CathSimAdmin.mount({ EP, token, userName, logout, toStation: () => { location.href = 'index.html'; }, toStationLabel: 'Station' });
  function showApp() { $('alogin').style.display = 'none'; CathSimAdmin.open(); }
  $('aGo').onclick = async () => {
    const email = $('aEmail').value.trim(), password = $('aPw').value, err = $('aErr');
    err.textContent = ''; if (!email || !password) { err.textContent = 'E-Mail und Passwort eingeben'; return; }
    if (!EP()) { err.textContent = 'Anmeldeserver nicht eingerichtet'; return; }
    $('aGo').disabled = true;
    try {
      const r = await fetch(EP() + '/auth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: email, password, role: 'station', build: window.CATHSIM_BUILD || 'dev' }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'Anmeldung fehlgeschlagen');
      if (j.role !== 'admin') throw new Error('Kein Admin-Konto – die Verwaltung ist nur für Admins');
      try { localStorage.setItem(K.token, j.token); localStorage.setItem(K.user, j.name || email); localStorage.setItem('cathsim.admin.email', email); } catch (e) {}
      $('aPw').value = ''; showApp();
    } catch (e) { err.textContent = e.message; }
    $('aGo').disabled = false;
  };
  $('aPw').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('aGo').click(); });
  $('aEmail').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('aPw').focus(); });
  // Neue Version veröffentlicht? Einmal frisch laden.
  (async () => { if (!window.CATHSIM_BUILD) return; try { const v = (await (await fetch('version.txt', { cache: 'no-store' })).text()).trim();
    if (v && v !== window.CATHSIM_BUILD && sessionStorage.getItem('cathsim.reloaded') !== v) { sessionStorage.setItem('cathsim.reloaded', v); location.reload(); } } catch (e) {} })();
  if (token()) showApp(); else { try { $('aEmail').value = get('cathsim.admin.email'); } catch (e) {} $('aEmail').focus(); }
})();
