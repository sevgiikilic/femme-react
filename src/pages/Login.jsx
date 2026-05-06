import { useState, useRef, useEffect } from 'react';
import './Login.css';

export default function Login({ auth }) {
  const [step, setStep] = useState('email'); // 'email' | 'pin'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const pinRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (step === 'pin') pinRefs[0].current?.focus();
  }, [step]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    const ok = await auth.requestPin(email.trim().toLowerCase());
    if (ok) setStep('pin');
  }

  function handlePinChange(i, val) {
    if (!/^\d*$/.test(val)) return;
    const next = [...pin];
    next[i] = val.slice(-1);
    setPin(next);
    if (val && i < 5) pinRefs[i + 1].current?.focus();
  }

  function handlePinKeyDown(i, e) {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      pinRefs[i - 1].current?.focus();
    }
  }

  function handlePinPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setPin(text.split(''));
      pinRefs[5].current?.focus();
      e.preventDefault();
    }
  }

  async function handlePinSubmit(e) {
    e.preventDefault();
    const code = pin.join('');
    if (code.length < 6) return;
    await auth.verifyPin(email, code);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">FEMME</div>
        <div className="login-subtitle">a session log of body, mood &amp; cycle</div>

        {step === 'email' ? (
          <form className="login-form" onSubmit={handleEmailSubmit}>
            <div className="login-eyebrow">giris</div>
            <p className="login-desc">Email adresine 6 haneli bir kod gonderecegiz.</p>
            <input
              type="email"
              className="login-input"
              placeholder="ornek@gmail.com"
              value={email}
              onChange={e => { setEmail(e.target.value); auth.setError(''); }}
              required
              autoFocus
            />
            {auth.error && <div className="login-error">{auth.error}</div>}
            <button type="submit" className="login-btn" disabled={auth.loading}>
              {auth.loading ? 'Gonderiliyor...' : 'Kod Gonder'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handlePinSubmit}>
            <div className="login-eyebrow">dogrulama</div>
            <p className="login-desc">
              <strong>{email}</strong> adresine gonderilen 6 haneli kodu gir.
            </p>
            <div className="pin-row" onPaste={handlePinPaste}>
              {pin.map((d, i) => (
                <input
                  key={i}
                  ref={pinRefs[i]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`pin-cell ${d ? 'filled' : ''}`}
                  value={d}
                  onChange={e => handlePinChange(i, e.target.value)}
                  onKeyDown={e => handlePinKeyDown(i, e)}
                />
              ))}
            </div>
            {auth.error && <div className="login-error">{auth.error}</div>}
            <button
              type="submit"
              className="login-btn"
              disabled={auth.loading || pin.join('').length < 6}
            >
              {auth.loading ? 'Dogrulanıyor...' : 'Giris Yap'}
            </button>
            <button
              type="button"
              className="login-back"
              onClick={() => { setStep('email'); setPin(['','','','','','']); auth.setError(''); }}
            >
              Baska email kullan
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
