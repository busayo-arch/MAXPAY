/* store.js — Data layer */
const Store = {
  KEY: 'maxpay_v2',
  state: {
    users: {},
    currentUser: null,
    adminSession: false,
    market: [],
    notifications: [],
    appVersion: '2.0.0'
  },
  load() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) { try { this.state = { ...this.state, ...JSON.parse(raw) }; } catch(e){} }
    return this.state;
  },
  save() {
    localStorage.setItem(this.KEY, JSON.stringify(this.state));
    window.dispatchEvent(new Event('state-changed'));
  },
  createUser({ surname, username, phone, email, nin, pin, password }) {
    if (this.state.users[phone]) throw new Error('Phone number already registered');
    const accountNumber = this._generateAccountNumber();
    const user = {
      surname, username, phone, email, nin,
      pin: this._hash(pin), password: this._hash(password),
      accountNumber, balance: 0, faceVerified: true,
      transactions: [], notifications: [],
      createdAt: new Date().toISOString()
    };
    this.state.users[phone] = user;
    this.save();
    return user;
  },
  getUser(phone) { return this.state.users[phone] || null; },
  updateUser(phone, patch) { Object.assign(this.state.users[phone], patch); this.save(); },
  getAllUsers() { return Object.values(this.state.users); },
  _generateAccountNumber() {
    let num;
    do { num = '30' + Math.floor(10000000 + Math.random()*89999999); }
    while (Object.values(this.state.users).some(u => u.accountNumber === num));
    return num;
  },
  _hash(str) {
    let h = 0;
    for (let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0; }
    return 'h' + Math.abs(h).toString(36) + '_' + btoa(str).slice(0,8);
  },
  verifyHash(plain, hash) { return this._hash(plain) === hash; },
  login(phone, password) {
    const user = this.state.users[phone];
    if (!user) throw new Error('Account not found');
    if (!this.verifyHash(password, user.password)) throw new Error('Wrong password');
    return user;
  },
  verifyPin(phone, pin) {
    const user = this.state.users[phone];
    return user ? this.verifyHash(pin, user.pin) : false;
  },
  setCurrentUser(phone) { this.state.currentUser = phone; this.save(); },
  logout() { this.state.currentUser = null; this.state.adminSession = false; this.save(); },
  addFunds(phone, amount, method='Card') {
    amount = Number(amount);
    if (!amount || amount <= 0) throw new Error('Invalid amount');
    const u = this.state.users[phone];
    u.balance += amount;
    this._log(phone, 'credit', 'Wallet Funding', amount, method);
    this.save();
  },
  sendMoney(phone, recipient, amount, note) {
    amount = Number(amount);
    const u = this.state.users[phone];
    if (!amount || amount <= 0) throw new Error('Invalid amount');
    if (amount > u.balance) throw new Error('Insufficient balance');
    u.balance -= amount;
    this._log(phone, 'debit', 'Transfer to ' + recipient, amount, note || 'Transfer');
    this.save();
  },
  withdraw(phone, amount, bank, account) {
    amount = Number(amount);
    const u = this.state.users[phone];
    if (!amount || amount <= 0) throw new Error('Invalid amount');
    if (amount > u.balance) throw new Error('Insufficient balance');
    u.balance -= amount;
    this._log(phone, 'debit', 'Withdraw to ' + bank, amount, 'Acct ...' + account.slice(-4));
    this.save();
  },
  buyService(phone, serviceName, price, meta) {
    const u = this.state.users[phone];
    price = Number(price);
    if (price > u.balance) throw new Error('Insufficient balance');
    u.balance -= price;
    this._log(phone, 'debit', serviceName, price, meta || 'Purchase');
    this.save();
  },
  saveMoney(phone, amount, planName) {
    const u = this.state.users[phone];
    amount = Number(amount);
    if (amount > u.balance) throw new Error('Insufficient balance');
    u.balance -= amount;
    if (!u.savings) u.savings = [];
    u.savings.push({ id: Date.now(), plan: planName, amount, date: new Date().toISOString() });
    this._log(phone, 'debit', 'Savings Lock: ' + planName, amount, 'Locked');
    this.save();
  },
  _log(phone, type, title, amount, subtitle) {
    const u = this.state.users[phone];
    u.transactions.unshift({
      id: Date.now() + Math.random(), type, title, amount, subtitle,
      date: new Date().toISOString()
    });
    u.transactions = u.transactions.slice(0, 100);
  },
  formatNaira(n) {
    return 'NGN ' + Number(n || 0).toLocaleString('en-NG', {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  },
  addMarketItem(item) {
    item.id = 'm_' + Date.now();
    item.addedAt = new Date().toISOString();
    this.state.market.push(item);
    this.save();
  },
  removeMarketItem(id) {
    this.state.market = this.state.market.filter(m => m.id !== id);
    this.save();
  },
  getMarketItem(id) { return this.state.market.find(m => m.id === id); },
  purchaseMarketItem(phone, marketId) {
    const item = this.getMarketItem(marketId);
    const u = this.state.users[phone];
    if (!item) throw new Error('Item not found');
    if (item.price > u.balance) throw new Error('Insufficient balance');
    u.balance -= item.price;
    u.transactions.unshift({
      id: Date.now(), type: 'debit', title: 'Bought ' + item.title,
      amount: item.price, subtitle: item.type, marketId: item.id,
      date: new Date().toISOString()
    });
    this.save();
    return item;
  },
  notify(targetPhone, title, body) {
    if (targetPhone === 'all') {
      Object.values(this.state.users).forEach(u => {
        if (!u.notifications) u.notifications = [];
        u.notifications.unshift({ id: Date.now()+Math.random(), title, body, date: new Date().toISOString(), read: false });
      });
    } else {
      const u = this.state.users[targetPhone];
      if (u) {
        if (!u.notifications) u.notifications = [];
        u.notifications.unshift({ id: Date.now(), title, body, date: new Date().toISOString(), read: false });
      }
    }
    this.state.notifications.unshift({ id: Date.now(), title, body, target: targetPhone, date: new Date().toISOString() });
    this.save();
  },
  adminLogin(phone, password) {
    if (phone === '09072088859' && password === '200007') {
      this.state.adminSession = true;
      this.save();
      return true;
    }
    throw new Error('Invalid admin credentials');
  }
};
Store.load();
