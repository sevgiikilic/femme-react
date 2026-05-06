import { useState } from 'react';
import './Login.css';

export default function Login({ auth }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [isNew,    setIsNew]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    await auth.login(email.trim().toLowerCase(), password);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">FEMME</div>
        <div className="login-subtitle">a session log of body, mood &amp; cycle</div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-eyebrow">{isNew ? 'hesap oluştur' : 'giriş'}</div>
          <p className="login-desc">
            {isNew
              ? 'İlk kez giriyorsun — bu bilgilerle hesabın oluşturulacak.'
              : 'Email ve şifreni gir.'}
          </p>

          <input
            type="email"
            className="login-input"
            placeholder="ornek@gmail.com"
            value={email}
            onChange={e => { setEmail(e.target.value); auth.setError(''); }}
            required
            autoFocus
          />
          <input
            type="password"
            className="login-input"
            placeholder={isNew ? 'Şifre belirle (min. 6 karakter)' : 'Şifren'}
            value={password}
            onChange={e => { setPassword(e.target.value); auth.setError(''); }}
            required
            minLength={6}
          />

          {auth.error && <div className="login-error">{auth.error}</div>}

          <button type="submit" className="login-btn" disabled={auth.loading}>
            {auth.loading ? 'Bekleniyor...' : isNew ? 'Hesap Oluştur →' : 'Giriş Yap →'}
          </button>
        </form>

        <button
          type="button"
          className="login-back"
          onClick={() => { setIsNew(v => !v); auth.setError(''); }}
        >
          {isNew ? '← Zaten hesabım var' : 'İlk kez mi? Hesap oluştur →'}
        </button>
      </div>
    </div>
  );
}
