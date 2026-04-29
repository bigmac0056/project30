/**
 * AuthPage.jsx — phantom-desktop-games
 * ──────────────────────────────────────
 * Login / Register form for the desktop app.
 */
import React, { useState } from 'react';
import { PH } from '../theme';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode,  setMode]  = useState('login'); // 'login' | 'register'
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email, password: pass });
      } else {
        if (!name.trim()) { setError('Введите имя'); setBusy(false); return; }
        await register({ name: name.trim(), email, password: pass });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={css.root}>
      {/* Brand */}
      <div style={css.brand}>
        Phantom<span style={{ color: PH.lime }}>.</span>
      </div>
      <div style={css.brandSub}>EMG Тренажёр · Desktop</div>

      {/* Card */}
      <form onSubmit={handleSubmit} style={css.card}>
        <div style={css.tabs}>
          <button type="button" style={{ ...css.tab, ...(mode === 'login' ? css.tabActive : {}) }} onClick={() => { setMode('login'); setError(''); }}>
            Войти
          </button>
          <button type="button" style={{ ...css.tab, ...(mode === 'register' ? css.tabActive : {}) }} onClick={() => { setMode('register'); setError(''); }}>
            Регистрация
          </button>
        </div>

        {mode === 'register' && (
          <div style={css.field}>
            <label style={css.label}>ИМЯ</label>
            <input style={css.input} type="text" placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} required />
          </div>
        )}

        <div style={css.field}>
          <label style={css.label}>EMAIL</label>
          <input style={css.input} type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div style={css.field}>
          <label style={css.label}>ПАРОЛЬ</label>
          <input style={css.input} type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required minLength={6} />
        </div>

        {error && <div style={css.error}>{error}</div>}

        <button type="submit" style={{ ...css.submit, opacity: busy ? 0.7 : 1 }} disabled={busy}>
          {busy ? '...' : mode === 'login' ? 'Войти →' : 'Создать аккаунт →'}
        </button>
      </form>

      <div style={css.footer}>
        Данные синхронизируются с мобильным приложением
      </div>
    </div>
  );
}

const css = {
  root: {
    width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: PH.bg,
    fontFamily: PH.fontSans, gap: 4,
  },
  brand: { fontSize: 42, fontWeight: 700, letterSpacing: '-0.04em', color: PH.ink, marginBottom: 2 },
  brandSub: { fontFamily: PH.fontMono, fontSize: 11, color: PH.inkFaint, letterSpacing: '0.1em', marginBottom: 32 },
  card: {
    width: 380, background: '#FFF', borderRadius: 20,
    border: `1px solid ${PH.hair}`, padding: 28,
    boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  tabs: {
    display: 'flex', gap: 4, background: PH.bgSoft,
    borderRadius: 10, padding: 4,
  },
  tab: {
    flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
    background: 'transparent', fontFamily: PH.fontSans, fontSize: 14,
    fontWeight: 500, color: PH.inkDim, cursor: 'pointer',
  },
  tabActive: {
    background: PH.ink, color: '#FFF',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.1em', color: PH.inkFaint },
  input: {
    padding: '12px 14px', borderRadius: 12, border: `1px solid ${PH.hair}`,
    fontFamily: PH.fontSans, fontSize: 15, color: PH.ink,
    background: PH.bgAlt, outline: 'none',
  },
  error: {
    padding: '10px 14px', borderRadius: 10,
    background: '#FFF0EE', border: `1px solid ${PH.coral}44`,
    fontFamily: PH.fontSans, fontSize: 13, color: PH.coral,
  },
  submit: {
    padding: '14px 0', borderRadius: 12, border: 'none',
    background: PH.ink, color: '#FFF', fontFamily: PH.fontSans,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  footer: {
    marginTop: 16, fontFamily: PH.fontMono, fontSize: 10,
    color: PH.inkFaint, letterSpacing: '0.06em',
  },
};
