/**
 * AuthPage.jsx — phantom-desktop-games
 * ──────────────────────────────────────
 * Login / Register form for the desktop app.
 */
import React, { useState } from 'react';
import { PH } from '../theme';
import { useAuth } from '../context/AuthContext';

/* ── Feature pill ── */
function FeaturePill({ icon, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 14px', borderRadius: 999,
      background: 'rgba(255,255,255,0.55)',
      border: `1px solid ${PH.hair}`,
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontFamily: PH.fontMono, fontSize: 10, color: PH.inkDim, letterSpacing: '0.06em' }}>{label}</span>
    </div>
  );
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode,  setMode]  = useState('login');
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

      {/* ── Decorative background orbs ── */}
      <div style={css.orbGreen} />
      <div style={css.orbViolet} />
      <div style={css.orbCoral} />

      {/* ── Left panel ── */}
      <div style={css.leftPanel} className="anim-fade-in">
        <div style={css.logoWrap}>
          <div style={css.logoIcon}>⚡</div>
          <span style={css.logoText}>Phantom<span style={{ color: PH.limeBright }}>.</span></span>
        </div>

        <div style={css.tagline}>
          <div style={css.taglineHead}>EMG Тренажёр</div>
          <div style={css.taglineSub}>
            Реабилитационная платформа для восстановления управления мышцами через игровые упражнения.
          </div>
        </div>

        <div style={css.pills}>
          <FeaturePill icon="🎮" label="3 игровых режима" />
          <FeaturePill icon="📊" label="Аналитика прогресса" />
          <FeaturePill icon="📄" label="Отчёт для врача" />
          <FeaturePill icon="🔗" label="Синхронизация с телефоном" />
        </div>

        <div style={css.versionBadge}>
          <span style={{ fontFamily: PH.fontMono, fontSize: 9, color: PH.inkFaint, letterSpacing: '0.12em' }}>
            PHANTOM EMG · v0.5 · DESKTOP
          </span>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div style={css.rightPanel}>
        <form onSubmit={handleSubmit} style={css.card} className="anim-pop-in">

          {/* Card header */}
          <div style={css.cardHeader}>
            <div style={css.cardTitle}>
              {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
            </div>
            <div style={css.cardSub}>
              {mode === 'login'
                ? 'Войдите, чтобы продолжить тренировки'
                : 'Зарегистрируйтесь для начала работы'}
            </div>
          </div>

          {/* Tabs */}
          <div style={css.tabs}>
            <button
              type="button"
              style={{ ...css.tab, ...(mode === 'login' ? css.tabActive : {}) }}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Войти
            </button>
            <button
              type="button"
              style={{ ...css.tab, ...(mode === 'register' ? css.tabActive : {}) }}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Регистрация
            </button>
          </div>

          {/* Fields */}
          {mode === 'register' && (
            <div style={css.field}>
              <label style={css.label}>ИМЯ</label>
              <input
                className="ph-input" style={css.input}
                type="text" placeholder="Ваше имя"
                value={name} onChange={e => setName(e.target.value)} required
              />
            </div>
          )}

          <div style={css.field}>
            <label style={css.label}>EMAIL</label>
            <input
              className="ph-input" style={css.input}
              type="email" placeholder="name@example.com"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
          </div>

          <div style={css.field}>
            <label style={css.label}>ПАРОЛЬ</label>
            <input
              className="ph-input" style={css.input}
              type="password" placeholder="••••••••"
              value={pass} onChange={e => setPass(e.target.value)} required minLength={6}
            />
          </div>

          {error && (
            <div style={css.error}>
              <span style={{ marginRight: 6 }}>⚠️</span>{error}
            </div>
          )}

          <button
            type="submit"
            style={{ ...css.submit, opacity: busy ? 0.7 : 1 }}
            disabled={busy}
          >
            {busy
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={css.btnSpinner} /> Подождите...
                </span>
              : mode === 'login' ? 'Войти в систему →' : 'Создать аккаунт →'
            }
          </button>

          <div style={css.cardFooterNote}>
            <span style={{ fontSize: 11 }}>🔒</span>
            <span>Данные защищены и синхронизируются с мобильным приложением</span>
          </div>
        </form>
      </div>
    </div>
  );
}

const css = {
  root: {
    width: '100vw', height: '100vh',
    display: 'flex', flexDirection: 'row',
    background: PH.bg, fontFamily: PH.fontSans,
    position: 'relative', overflow: 'hidden',
  },

  /* ── Orbs ── */
  orbGreen: {
    position: 'absolute', width: 520, height: 520, borderRadius: '50%',
    background: `radial-gradient(circle, ${PH.limeSoft} 0%, transparent 70%)`,
    top: -160, left: -120, pointerEvents: 'none', zIndex: 0,
  },
  orbViolet: {
    position: 'absolute', width: 380, height: 380, borderRadius: '50%',
    background: `radial-gradient(circle, ${PH.violetSoft} 0%, transparent 70%)`,
    bottom: -100, left: 160, pointerEvents: 'none', zIndex: 0,
  },
  orbCoral: {
    position: 'absolute', width: 300, height: 300, borderRadius: '50%',
    background: `radial-gradient(circle, #FCE0D8 0%, transparent 70%)`,
    top: 80, right: -80, pointerEvents: 'none', zIndex: 0,
  },

  /* ── Left panel ── */
  leftPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', padding: '60px 56px',
    position: 'relative', zIndex: 1,
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48,
  },
  logoIcon: {
    width: 44, height: 44, borderRadius: 12,
    background: PH.ink, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22,
  },
  logoText: {
    fontFamily: PH.fontSans, fontSize: 28, fontWeight: 800,
    letterSpacing: '-0.04em', color: PH.ink,
  },
  tagline: { marginBottom: 36 },
  taglineHead: {
    fontFamily: PH.fontSans, fontSize: 36, fontWeight: 800,
    letterSpacing: '-0.04em', color: PH.ink, lineHeight: 1.15, marginBottom: 14,
  },
  taglineSub: {
    fontFamily: PH.fontSans, fontSize: 15, color: PH.inkDim,
    lineHeight: 1.6, maxWidth: 340,
  },
  pills: {
    display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start',
    marginBottom: 40,
  },
  versionBadge: {
    padding: '5px 0',
    borderTop: `1px solid ${PH.hair}`,
  },

  /* ── Right panel ── */
  rightPanel: {
    width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 48px', position: 'relative', zIndex: 1,
    borderLeft: `1px solid ${PH.hair}`,
    background: 'rgba(255,255,255,0.45)',
    backdropFilter: 'blur(12px)',
  },
  card: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 16,
  },
  cardHeader: { marginBottom: 4 },
  cardTitle: {
    fontFamily: PH.fontSans, fontSize: 24, fontWeight: 800,
    letterSpacing: '-0.03em', color: PH.ink, marginBottom: 6,
  },
  cardSub: {
    fontFamily: PH.fontSans, fontSize: 13, color: PH.inkFaint, lineHeight: 1.5,
  },
  tabs: {
    display: 'flex', gap: 4, background: PH.bgSoft,
    borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
    background: 'transparent', fontFamily: PH.fontSans, fontSize: 14,
    fontWeight: 500, color: PH.inkDim, cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  tabActive: {
    background: PH.ink, color: '#FFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontFamily: PH.fontMono, fontSize: 9, letterSpacing: '0.12em',
    color: PH.inkFaint, fontWeight: 600,
  },
  input: {
    padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${PH.hair}`,
    fontFamily: PH.fontSans, fontSize: 15, color: PH.ink,
    background: 'rgba(255,255,255,0.8)', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  error: {
    padding: '11px 14px', borderRadius: 10,
    background: '#FFF0EE', border: `1.5px solid ${PH.coral}44`,
    fontFamily: PH.fontSans, fontSize: 13, color: PH.coral,
    display: 'flex', alignItems: 'center', gap: 4,
  },
  submit: {
    padding: '15px 0', borderRadius: 12, border: 'none',
    background: PH.ink, color: '#FFF', fontFamily: PH.fontSans,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  btnSpinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#FFF',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  cardFooterNote: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: PH.fontMono, fontSize: 10, color: PH.inkFaint,
    letterSpacing: '0.04em', paddingTop: 4,
  },
};
