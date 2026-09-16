/* app.js — Main app logic */
const App = {
  startSession() {
    document.getElementById('auth-root').style.display = 'none';
    document.getElementById('app-root').style.display = 'block';
    this.bindAll();
    this.renderAll();
    window.scrollTo(0, 0);
  },

  bindAll() {
    this.bindNavigation();
    this.bindActions();
    this.renderMarketplace();
    this.bindNotifications();
    this.bindHeaderUser();
    if (this._handler) window.removeEventListener('state-changed', this._handler);
    this._handler = () => this.renderAll();
    window.addEventListener('state-changed', this._handler);
  },

  renderAll() {
    this.renderHeader();
    this.renderBalance();
    this.renderTransactions();
    this.renderNotificationsBadge();
    this.renderMarketplace();
  },

  renderHeader() {
    const user = Store.getUser(Store.state.currentUser);
    if (!user) return;
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-surname').textContent = user.surname;
  },

  renderBalance() {
    const user = Store.getUser(Store.state.currentUser);
    if (!user) return;
    const el = document.getElementById('balance-amount');
    if (el.dataset.hidden === '1') { el.textContent = '.......'; return; }
    el.textContent = Store.formatNaira(user.balance);
    const acc = document.getElementById('account-number');
    if (acc) acc.textContent = user.accountNumber;
  },

  renderTransactions() {
    const user = Store.getUser(Store.state.currentUser);
    if (!user) return;
    this._renderTxList('activity-list', user.transactions.slice(0, 4));
    this._renderTxList('activity-list-full', user.transactions);
  },

  _renderTxList(id, txs) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!txs.length) {
      el.innerHTML =
        '<div class="activity-empty">' +
          '<div class="activity-icon">' +
            '<svg width="18" height="18" fill="none" stroke="#6a7b8c" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
          '</div>' +
          '<div class="activity-details"><h4>No transactions yet</h4><p>Your activities will appear here.</p></div>' +
        '</div>';
      return;
    }
    el.innerHTML = txs.map(tx =>
      '<div class="activity-row">' +
        '<div class="activity-icon ' + tx.type + '">' + (tx.type === 'credit' ? '+' : '-') + '</div>' +
        '<div class="activity-details">' +
          '<h4>' + tx.title + '</h4>' +
          '<p>' + tx.subtitle + ' . ' + new Date(tx.date).toLocaleDateString() + '</p>' +
        '</div>' +
        '<div class="activity-amount ' + tx.type + '">' +
          (tx.type === 'credit' ? '+' : '-') + Store.formatNaira(tx.amount) +
        '</div>' +
      '</div>'
    ).join('');
  },

  renderNotificationsBadge() {
    const user = Store.getUser(Store.state.currentUser);
    if (!user) return;
    const unread = (user.notifications || []).filter(n => !n.read).length;
    const badge = document.querySelector('.notification-badge');
    if (badge) badge.classList.toggle('hidden', unread === 0);
  },

  bindNavigation() {
    document.querySelectorAll('.nav-item[data-tab]').forEach(item => {
      item.onclick = (e) => { e.preventDefault(); this.switchTab(item.dataset.tab); };
    });
    const fab = document.querySelector('.nav-fab');
    if (fab) fab.onclick = () => this.actionAddFund();
  },

  switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.tab === tab));
    if (tab === 'profile') this.renderProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderProfile() {
    const user = Store.getUser(Store.state.currentUser);
    if (!user) return;
    const el = document.getElementById('profile-content');
    if (!el) return;
    el.innerHTML =
      '<div class="profile-row"><span>Full Name</span><span>' + user.surname + ' ' + user.username + '</span></div>' +
      '<div class="profile-row"><span>Account Number</span><span>' + user.accountNumber + '</span></div>' +
      '<div class="profile-row"><span>Phone</span><span>' + user.phone + '</span></div>' +
      '<div class="profile-row"><span>Email</span><span>' + user.email + '</span></div>' +
      '<div class="profile-row"><span>NIN</span><span>......' + user.nin.slice(-4) + '</span></div>' +
      '<div class="profile-row"><span>Face Verified</span><span style="color:#00e676;">Yes</span></div>' +
      '<div class="profile-row"><span>Balance</span><span>' + Store.formatNaira(user.balance) + '</span></div>' +
      '<div class="profile-row"><span>Member Since</span><span>' + new Date(user.createdAt).toLocaleDateString() + '</span></div>' +
      '<div style="margin-top:18px;"><button class="btn btn-danger btn-full" id="logout-btn">Logout</button></div>';

    document.getElementById('logout-btn').onclick = () => {
      UI.confirm('Logout', 'Are you sure you want to logout?', () => {
        Store.logout();
        document.getElementById('app-root').style.display = 'none';
        document.getElementById('auth-root').style.display = 'block';
        Auth.currentScreen = 'login';
        Auth.render();
      });
    };
  },

  bindActions() {
    const map = {
      'add-fund': () => this.actionAddFund(),
      'send-money': () => this.actionSend(),
      'withdraw': () => this.actionWithdraw(),
      'airtime': () => this.actionAirtime(),
      'data': () => this.actionData(),
      'betting': () => this.actionBetting(),
      'electricity': () => this.actionElectricity(),
      'invest': () => this.actionInvest(),
      'savings': () => this.actionSavings(),
      'history': () => this.switchTab('history'),
      'payment': () => this.actionPayment()
    };
    document.querySelectorAll('[data-action]').forEach(el => {
      const a = el.dataset.action;
      if (map[a]) el.onclick = map[a];
    });
    const eye = document.querySelector('.eye-icon');
    if (eye) eye.onclick = () => {
      const el = document.getElementById('balance-amount');
      el.dataset.hidden = el.dataset.hidden === '1' ? '0' : '1';
      this.renderBalance();
    };
  },

  actionAddFund() {
    UI.modal({
      title: 'Fund Wallet', submitLabel: 'Add Funds',
      body: '<label>Amount (NGN)</label><input name="amount" type="number" min="100" step="50" placeholder="5000" required>' +
            '<label>Payment Method</label><select name="method"><option>Debit Card</option><option>Bank Transfer</option><option>USSD</option></select>',
      onSubmit: ({ amount, method }) => {
        Store.addFunds(Store.state.currentUser, amount, method);
        UI.toast('Added ' + Store.formatNaira(amount), 'success');
      }
    });
  },

  actionSend() {
    UI.modal({
      title: 'Send Money', submitLabel: 'Send',
      body: '<label>Recipient Phone or Account</label><input name="recipient" required>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="50" step="50" required>' +
            '<label>Note (optional)</label><input name="note">',
      onSubmit: ({ recipient, amount, note }) => {
        Store.sendMoney(Store.state.currentUser, recipient, amount, note);
        UI.toast('Sent ' + Store.formatNaira(amount), 'success');
      }
    });
  },

  actionWithdraw() {
    UI.modal({
      title: 'Withdraw to Bank', submitLabel: 'Withdraw',
      body: '<label>Bank</label><select name="bank"><option>GTBank</option><option>Access Bank</option><option>First Bank</option><option>Zenith Bank</option><option>UBA</option><option>Opay</option><option>PalmPay</option></select>' +
            '<label>Account Number</label><input name="account" pattern="\\d{10}" placeholder="0123456789" required>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="100" step="50" required>',
      onSubmit: ({ bank, account, amount }) => {
        Store.withdraw(Store.state.currentUser, amount, bank, account);
        UI.toast('Withdrawal of ' + Store.formatNaira(amount) + ' initiated', 'success');
      }
    });
  },

  actionAirtime() {
    UI.modal({
      title: 'Buy Airtime', submitLabel: 'Buy Airtime',
      body: '<label>Network</label><select name="network"><option>MTN</option><option>Airtel</option><option>Glo</option><option>9mobile</option></select>' +
            '<label>Phone Number</label><input name="phone" pattern="\\d{11}" placeholder="09012345678" required>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="50" step="50" required>',
      onSubmit: ({ network, phone, amount }) => {
        Store.buyService(Store.state.currentUser, network + ' Airtime', amount, phone);
        UI.toast('Airtime ' + Store.formatNaira(amount) + ' sent', 'success');
      }
    });
  },

  actionData() {
    UI.modal({
      title: 'Buy Data', submitLabel: 'Buy Data',
      body: '<label>Network</label><select name="network"><option>MTN</option><option>Airtel</option><option>Glo</option><option>9mobile</option></select>' +
            '<label>Plan</label><select name="plan"><option value="500">1GB - NGN 500</option><option value="1000">2GB - NGN 1,000</option><option value="1500">3GB - NGN 1,500</option><option value="2500">6GB - NGN 2,500</option><option value="5000">20GB - NGN 5,000</option></select>' +
            '<label>Phone Number</label><input name="phone" pattern="\\d{11}" required>',
      onSubmit: ({ network, plan, phone }) => {
        Store.buyService(Store.state.currentUser, network + ' Data', plan, phone);
        UI.toast('Data bundle sent', 'success');
      }
    });
  },

  actionBetting() {
    UI.modal({
      title: 'Betting Top-up', submitLabel: 'Fund Account',
      body: '<label>Platform</label><select name="platform"><option>Bet9ja</option><option>SportyBet</option><option>1xBet</option><option>BetKing</option><option>NairaBet</option></select>' +
            '<label>User ID</label><input name="userId" required>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="100" step="100" required>',
      onSubmit: ({ platform, userId, amount }) => {
        Store.buyService(Store.state.currentUser, platform + ' Betting', amount, 'ID ' + userId);
        UI.toast('Betting account funded', 'success');
      }
    });
  },

  actionElectricity() {
    UI.modal({
      title: 'Pay Electricity', submitLabel: 'Pay Bill',
      body: '<label>Provider</label><select name="provider"><option>EEDC (Enugu)</option><option>IKEDC (Ikeja)</option><option>EKEDC (Eko)</option><option>AEDC (Abuja)</option><option>PHED (Port Harcourt)</option></select>' +
            '<label>Meter Number</label><input name="meter" required>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="500" step="100" required>',
      onSubmit: ({ provider, meter, amount }) => {
        Store.buyService(Store.state.currentUser, provider + ' Electricity', amount, 'Meter ' + meter);
        UI.toast('Bill paid successfully', 'success');
      }
    });
  },

  actionInvest() {
    UI.modal({
      title: 'Invest', submitLabel: 'Invest',
      body: '<label>Plan</label><select name="plan"><option value="10">Starter - 10% after 30 days</option><option value="15">Growth - 15% after 60 days</option><option value="25">Premium - 25% after 90 days</option></select>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="1000" step="500" required>',
      onSubmit: ({ plan, amount }) => {
        const pct = { '10': '10%', '15': '15%', '25': '25%' };
        Store.buyService(Store.state.currentUser, 'Investment (' + pct[plan] + ' return)', amount, 'Locked');
        UI.toast('Investment of ' + Store.formatNaira(amount) + ' started', 'success');
      }
    });
  },

  actionSavings() {
    UI.modal({
      title: 'Freeze Money / Savings', submitLabel: 'Lock Funds',
      body: '<label>Plan Name</label><input name="plan" placeholder="e.g. Rent Savings" required>' +
            '<label>Lock Duration</label><select name="duration"><option>30 days</option><option>60 days</option><option>90 days</option><option>180 days</option></select>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="500" step="100" required>',
      onSubmit: ({ plan, duration, amount }) => {
        Store.saveMoney(Store.state.currentUser, amount, plan + ' (' + duration + ')');
        UI.toast(Store.formatNaira(amount) + ' locked in savings', 'success');
      }
    });
  },

  actionPayment() {
    UI.modal({
      title: 'Make Payment', submitLabel: 'Pay',
      body: '<label>Merchant / Biller</label><input name="merchant" placeholder="e.g. DSTV, WAEC, JAMB" required>' +
            '<label>Reference / Customer ID</label><input name="ref" required>' +
            '<label>Amount (NGN)</label><input name="amount" type="number" min="100" step="50" required>',
      onSubmit: ({ merchant, ref, amount }) => {
        Store.buyService(Store.state.currentUser, 'Payment to ' + merchant, amount, 'Ref ' + ref);
        UI.toast('Payment successful', 'success');
      }
    });
  },

  renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    if (!grid) return;
    const items = Store.state.market;
    if (!items.length) {
      grid.innerHTML = '<div class="empty-msg" style="grid-column:1/-1;">No items available yet.</div>';
      return;
    }
    grid.innerHTML = items.map(item =>
      '<div class="service-item" data-market-id="' + item.id + '">' +
        '<div class="service-icon">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>' +
        '</div>' +
        '<div class="service-title">' + item.title + '</div>' +
        '<div class="service-price">' + Store.formatNaira(item.price) + '</div>' +
      '</div>'
    ).join('');
    grid.querySelectorAll('[data-market-id]').forEach(el => {
      el.onclick = () => this.handleMarketClick(el.dataset.marketId);
    });
  },

  handleMarketClick(id) {
    const user = Store.getUser(Store.state.currentUser);
    const item = Store.getMarketItem(id);
    if (!item) return;
    const purchased = user.transactions.some(t => t.marketId === id);

    if (purchased) {
      UI.modal({
        title: 'Your ' + item.title, submitLabel: 'Close',
        body: '<p style="font-size:12px;color:#8fa0b0;margin-bottom:10px;">Your credentials:</p>' +
              '<div class="card-box" style="background:#0b1017;">' +
                '<p style="font-size:11px;color:#8fa0b0;">Login / Email</p>' +
                '<p style="font-size:14px;font-weight:700;margin-bottom:10px;">' + item.email + '</p>' +
                '<p style="font-size:11px;color:#8fa0b0;">Password</p>' +
                '<p style="font-size:14px;font-weight:700;">' + item.password + '</p>' +
              '</div>',
        onSubmit: () => {}
      });
      return;
    }

    UI.modal({
      title: 'Buy ' + item.title, submitLabel: 'Pay ' + Store.formatNaira(item.price),
      body: '<p style="font-size:13px;color:#8fa0b0;line-height:1.5;">Purchase <strong>' + item.title + '</strong> for <strong>' + Store.formatNaira(item.price) + '</strong>. Credentials will be revealed after payment.</p>',
      onSubmit: () => {
        const p = Store.purchaseMarketItem(Store.state.currentUser, id);
        UI.toast(p.title + ' purchase successful', 'success');
      }
    });
  },

  bindNotifications() {
    const btn = document.querySelector('.notification-btn');
    if (!btn) return;
    btn.onclick = () => {
      const user = Store.getUser(Store.state.currentUser);
      const notifs = user.notifications || [];
      notifs.forEach(n => n.read = true);
      Store.save();
      const html =
        '<button class="drawer-close">&times;</button>' +
        '<h2>Notifications</h2>' +
        (notifs.length === 0
          ? '<div class="empty-msg">No notifications yet.</div>'
          : notifs.map(n =>
              '<div class="drawer-item">' +
                '<h4>' + n.title + '</h4>' +
                '<p>' + n.body + '</p>' +
                '<time>' + new Date(n.date).toLocaleString() + '</time>' +
              '</div>').join(''));
      UI.openDrawer(html);
      this.renderNotificationsBadge();
    };
  },

  bindHeaderUser() {
    const avatar = document.querySelector('.user-profile');
    if (avatar) avatar.onclick = () => this.switchTab('profile');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (Store.state.currentUser) {
    App.startSession();
  } else {
    Auth.mount();
  }
});
