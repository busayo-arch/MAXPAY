/* auth.js — Signup, login, PIN, face verify */
const Auth = {
  currentScreen: 'login',

  mount() { this.render(); },

  render() {
    const root = document.getElementById('auth-root');
    if (!root) return;
    if (this.currentScreen === 'login') return this.renderLogin(root);
    if (this.currentScreen === 'signup') return this.renderSignup(root);
    if (this.currentScreen === 'pin') return this.renderPin(root);
  },

  renderLogin(root) {
    root.innerHTML =
      '<div class="auth-wrap">' +
        '<div class="auth-logo">' +
          '<svg viewBox="0 0 40 40" fill="none"><path d="M8 32V12L20 24L32 12V32" stroke="#00E676" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<h1>MAX<span>Pay</span></h1>' +
          '<p>Fast. Safe. Simple.</p>' +
        '</div>' +
        '<div class="auth-tabs">' +
          '<div class="auth-tab active" data-tab="login">Login</div>' +
          '<div class="auth-tab" data-tab="signup">Create Account</div>' +
        '</div>' +
        '<form class="auth-form" id="login-form">' +
          '<label>Phone Number</label>' +
          '<input type="tel" name="phone" placeholder="09012345678" required>' +
          '<label>Password</label>' +
          '<input type="password" name="password" placeholder="Enter password" required>' +
          '<button type="submit" class="btn btn-primary btn-full" style="margin-top:18px;">Login</button>' +
        '</form>' +
        '<div class="auth-toggle">New here?<a data-go="signup">Create account</a></div>' +
      '</div>';

    root.querySelector('[data-tab="signup"]').onclick = () => { this.currentScreen = 'signup'; this.render(); };
    root.querySelector('[data-go="signup"]').onclick = () => { this.currentScreen = 'signup'; this.render(); };

    root.querySelector('#login-form').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      try {
        const user = Store.login(data.phone, data.password);
        Store.setCurrentUser(user.phone);
        this.currentScreen = 'pin';
        this.render();
        UI.toast('Credentials verified', 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    };
  },

  renderSignup(root) {
    root.innerHTML =
      '<div class="auth-wrap">' +
        '<div class="auth-logo">' +
          '<svg viewBox="0 0 40 40" fill="none"><path d="M8 32V12L20 24L32 12V32" stroke="#00E676" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<h1>Create <span>Account</span></h1>' +
          '<p>Fill the details below</p>' +
        '</div>' +
        '<form class="auth-form" id="signup-form">' +
          '<label>Surname</label><input type="text" name="surname" placeholder="Your surname" required>' +
          '<label>Username</label><input type="text" name="username" placeholder="Choose a username" required>' +
          '<label>Phone Number</label><input type="tel" name="phone" placeholder="09012345678" pattern="\\d{11}" required>' +
          '<label>Email</label><input type="email" name="email" placeholder="you@example.com" required>' +
          '<label>NIN (11 digits)</label><input type="text" name="nin" placeholder="11 digit NIN" pattern="\\d{11}" required>' +
          '<label>Transaction PIN (4 digits)</label><input type="password" name="pin" placeholder="1234" pattern="\\d{4}" maxlength="4" required>' +
          '<label>Login Password (min 6 chars)</label><input type="password" name="password" placeholder="Create password" minlength="6" required>' +
          '<div class="face-verify">' +
            '<div class="face-circle" id="face-circle">' +
              '<svg width="40" height="40" fill="none" stroke="#000" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/></svg>' +
            '</div>' +
            '<div class="face-hint" id="face-hint">Tap to verify your face</div>' +
            '<button type="button" class="btn btn-ghost" id="face-btn">Start Face Verification</button>' +
          '</div>' +
          '<button type="submit" class="btn btn-primary btn-full" style="margin-top:18px;" disabled id="signup-submit">Create Account</button>' +
        '</form>' +
        '<div class="auth-toggle">Already have an account?<a data-go="login">Login</a></div>' +
      '</div>';

    let faceVerified = false;
    const faceCircle = root.querySelector('#face-circle');
    const faceHint = root.querySelector('#face-hint');
    const submitBtn = root.querySelector('#signup-submit');

    root.querySelector('[data-go="login"]').onclick = () => { this.currentScreen = 'login'; this.render(); };

    root.querySelector('#face-btn').onclick = () => {
      faceHint.textContent = 'Scanning...';
      setTimeout(() => {
        faceVerified = true;
        faceCircle.classList.add('verified');
        faceHint.textContent = 'Face verified successfully';
        submitBtn.disabled = false;
        UI.toast('Face verified', 'success');
      }, 1800);
    };

    root.querySelector('#signup-form').onsubmit = (e) => {
      e.preventDefault();
      if (!faceVerified) { UI.toast('Complete face verification first', 'error'); return; }
      const data = Object.fromEntries(new FormData(e.target));
      try {
        const user = Store.createUser(data);
        UI.toast('Account created. Acct: ' + user.accountNumber, 'success');
        this.currentScreen = 'login';
        this.render();
        setTimeout(() => {
          const p = document.querySelector('input[name="phone"]');
          if (p) p.value = user.phone;
        }, 50);
      } catch (err) { UI.toast(err.message, 'error'); }
    };
  },

  renderPin(root) {
    const phone = Store.state.currentUser;
    const user = Store.getUser(phone);
    if (!user) { this.currentScreen = 'login'; this.render(); return; }

    root.innerHTML =
      '<div class="pin-screen">' +
        '<div class="auth-logo">' +
          '<svg viewBox="0 0 40 40" fill="none" style="width:44px;height:44px;"><path d="M8 32V12L20 24L32 12V32" stroke="#00E676" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<h1 style="font-size:22px;">Welcome, <span>' + user.username + '</span></h1>' +
          '<p style="font-size:12px;color:#8fa0b0;margin-top:4px;">Enter your 4-digit PIN</p>' +
        '</div>' +
        '<div class="pin-dots" id="pin-dots">' +
          '<div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div><div class="pin-dot"></div>' +
        '</div>' +
        '<div class="pin-pad" id="pin-pad">' +
          [1,2,3,4,5,6,7,8,9].map(n => '<button class="pin-key" data-key="'+n+'">'+n+'</button>').join('') +
          '<button class="pin-key" data-key="clear">C</button>' +
          '<button class="pin-key" data-key="0">0</button>' +
          '<button class="pin-key" data-key="back">&#8592;</button>' +
        '</div>' +
        '<button class="btn btn-ghost" id="pin-logout">Cancel and logout</button>' +
      '</div>';

    let pin = '';
    const dots = root.querySelectorAll('.pin-dot');
    const updateDots = () => dots.forEach((d, i) => d.classList.toggle('filled', i < pin.length));

    const trySubmit = () => {
      if (pin.length !== 4) return;
      if (Store.verifyPin(phone, pin)) {
        UI.toast('Login successful', 'success');
        App.startSession();
      } else {
        UI.toast('Wrong PIN', 'error');
        pin = '';
        updateDots();
      }
    };

    root.querySelector('#pin-pad').onclick = (e) => {
      const key = e.target.dataset.key;
      if (!key) return;
      if (key === 'clear') { pin = ''; updateDots(); return; }
      if (key === 'back') { pin = pin.slice(0, -1); updateDots(); return; }
      if (pin.length < 4) {
        pin += key;
        updateDots();
        if (pin.length === 4) setTimeout(trySubmit, 200);
      }
    };

    root.querySelector('#pin-logout').onclick = () => {
      Store.logout();
      this.currentScreen = 'login';
      this.render();
    };
  }
};
