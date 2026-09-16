/* admin.js — Admin panel */
const Admin = {
  currentTab: 'dashboard',
  mount() {
    const root = document.getElementById('admin-root');
    if (!Store.state.adminSession) return this.renderLogin(root);
    this.renderPanel(root);
  },
  renderLogin(root) {
    root.innerHTML =
      '<div class="admin-card" style="max-width:420px;margin:60px auto;">' +
        '<h2 style="margin-bottom:16px;">MAX<span style="color:#00e676;">Pay</span> Admin</h2>' +
        '<form id="admin-login-form">' +
          '<label style="display:block;font-size:12px;color:#8fa0b0;margin-bottom:6px;">Phone Number</label>' +
          '<input class="admin-input" name="phone" type="tel" required>' +
          '<label style="display:block;font-size:12px;color:#8fa0b0;margin-bottom:6px;">Password</label>' +
          '<input class="admin-input" name="password" type="password" required>' +
          '<button type="submit" class="btn-sm btn-green" style="width:100%;padding:14px;">Login</button>' +
        '</form>' +
      '</div>';
    root.querySelector('#admin-login-form').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      try {
        Store.adminLogin(data.phone, data.password);
        UI.toast('Admin logged in', 'success');
        this.mount();
      } catch (err) { UI.toast(err.message, 'error'); }
    };
  },
  renderPanel(root) {
    root.innerHTML =
      '<div class="admin-header">' +
        '<h1>MAX<span>Pay</span> Admin</h1>' +
        '<button class="btn-ghost-sm" id="admin-logout">Logout</button>' +
      '</div>' +
      '<div class="admin-tabs">' +
        '<div class="admin-tab active" data-tab="dashboard">Dashboard</div>' +
        '<div class="admin-tab" data-tab="market">Marketplace</div>' +
        '<div class="admin-tab" data-tab="users">Users</div>' +
        '<div class="admin-tab" data-tab="notify">Notify</div>' +
        '<div class="admin-tab" data-tab="app">App Update</div>' +
      '</div>' +
      '<div id="admin-content"></div>';
    root.querySelector('#admin-logout').onclick = () => { Store.logout(); this.mount(); };
    root.querySelectorAll('.admin-tab').forEach(tab => {
      tab.onclick = () => {
        root.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t === tab));
        this.currentTab = tab.dataset.tab;
        this.renderTab();
      };
    });
    this.renderTab();
  },
  renderTab() {
    const c = document.getElementById('admin-content');
    if (this.currentTab === 'dashboard') this.renderDashboard(c);
    if (this.currentTab === 'market') this.renderMarket(c);
    if (this.currentTab === 'users') this.renderUsers(c);
    if (this.currentTab === 'notify') this.renderNotify(c);
    if (this.currentTab === 'app') this.renderAppUpdate(c);
  },
  renderDashboard(c) {
    const users = Store.getAllUsers();
    const totalBalance = users.reduce((s, u) => s + u.balance, 0);
    const totalTx = users.reduce((s, u) => s + u.transactions.length, 0);
    c.innerHTML =
      '<div class="stat-grid">' +
        '<div class="stat"><h4>Total Users</h4><p>' + users.length + '</p></div>' +
        '<div class="stat"><h4>Total Balance</h4><p style="font-size:16px;">' + Store.formatNaira(totalBalance) + '</p></div>' +
        '<div class="stat"><h4>Transactions</h4><p>' + totalTx + '</p></div>' +
        '<div class="stat"><h4>Market Items</h4><p>' + Store.state.market.length + '</p></div>' +
      '</div>' +
      '<div class="admin-card"><h3>Recent Users</h3>' +
      (users.slice(-5).reverse().map(u =>
        '<div class="user-row">' +
          '<div class="info"><h4>' + u.surname + ' ' + u.username + '</h4><p>' + u.phone + ' . Acct ' + u.accountNumber + '</p></div>' +
          '<div style="font-weight:700;">' + Store.formatNaira(u.balance) + '</div>' +
        '</div>').join('') || '<div class="empty-msg">No users yet.</div>') +
      '</div>';
  },
  renderMarket(c) {
    c.innerHTML =
      '<div class="admin-card">' +
        '<h3>Add New Market Item</h3>' +
        '<form id="add-market-form">' +
          '<select class="admin-input" name="type" required>' +
            '<option value="Email">Email Account</option>' +
            '<option value="Netflix">Netflix Account</option>' +
            '<option value="Other">Other Login</option>' +
          '</select>' +
          '<input class="admin-input" name="title" placeholder="Title" required>' +
          '<input class="admin-input" name="email" placeholder="Login Email / Username" required>' +
          '<input class="admin-input" name="password" placeholder="Login Password" required>' +
          '<input class="admin-input" name="price" type="number" min="100" placeholder="Price in NGN" required>' +
          '<button type="submit" class="btn-sm btn-green">Add Item</button>' +
        '</form>' +
      '</div>' +
      '<div class="admin-card"><h3>Marketplace Items (' + Store.state.market.length + ')</h3><div id="market-list"></div></div>';
    document.getElementById('add-market-form').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      data.price = Number(data.price);
      Store.addMarketItem(data);
      Store.notify('all', 'New ' + data.type + ' Added', data.title + ' is now available for ' + Store.formatNaira(data.price) + '.');
      UI.toast('Item added and users notified', 'success');
      this.renderTab();
    };
    this.renderMarketList();
  },
  renderMarketList() {
    const list = document.getElementById('market-list');
    if (!list) return;
    const items = Store.state.market;
    if (!items.length) { list.innerHTML = '<div class="empty-msg">No items yet.</div>'; return; }
    list.innerHTML = items.map(item =>
      '<div class="market-row">' +
        '<div class="info">' +
          '<h4>' + item.title + ' <span style="color:#00e676;font-size:11px;">' + item.type + '</span></h4>' +
          '<p>Email: ' + item.email + '</p>' +
          '<p>Password: ' + item.password + '</p>' +
          '<p>Price: ' + Store.formatNaira(item.price) + '</p>' +
        '</div>' +
        '<button class="btn-sm btn-red" data-del="' + item.id + '">Delete</button>' +
      '</div>').join('');
    list.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => {
        UI.confirm('Delete Item', 'Remove this item?', () => {
          Store.removeMarketItem(btn.dataset.del);
          UI.toast('Item removed', 'success');
          this.renderTab();
        });
      };
    });
  },
  renderUsers(c) {
    const users = Store.getAllUsers();
    c.innerHTML = '<div class="admin-card"><h3>All Users (' + users.length + ')</h3><div id="users-list"></div></div>';
    const list = document.getElementById('users-list');
    if (!users.length) { list.innerHTML = '<div class="empty-msg">No users yet.</div>'; return; }
    list.innerHTML = users.map(u =>
      '<div class="user-row">' +
        '<div class="info">' +
          '<h4>' + u.surname + ' ' + u.username + '</h4>' +
          '<p>Phone: ' + u.phone + ' . Email: ' + u.email + '</p>' +
          '<p>Acct: ' + u.accountNumber + ' . Balance: ' + Store.formatNaira(u.balance) + '</p>' +
        '</div>' +
        '<button class="btn-sm btn-blue" data-notify="' + u.phone + '">Notify</button>' +
      '</div>').join('');
    list.querySelectorAll('[data-notify]').forEach(btn => {
      btn.onclick = () => this.openNotifyModal(btn.dataset.notify);
    });
  },
  renderNotify(c) {
    c.innerHTML =
      '<div class="admin-card">' +
        '<h3>Send Notification</h3>' +
        '<form id="notify-form">' +
          '<select class="admin-input" name="target" required>' +
            '<option value="all">All Users</option>' +
            Store.getAllUsers().map(u => '<option value="' + u.phone + '">' + u.username + ' (' + u.phone + ')</option>').join('') +
          '</select>' +
          '<input class="admin-input" name="title" placeholder="Notification Title" required>' +
          '<textarea class="admin-input" name="body" placeholder="Notification body..." required></textarea>' +
          '<button type="submit" class="btn-sm btn-green">Send</button>' +
        '</form>' +
      '</div>';
    document.getElementById('notify-form').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      Store.notify(data.target, data.title, data.body);
      UI.toast('Notification sent', 'success');
      e.target.reset();
    };
  },
  renderAppUpdate(c) {
    c.innerHTML =
      '<div class="admin-card">' +
        '<h3>Broadcast App Update</h3>' +
        '<p style="font-size:12px;color:#8fa0b0;margin-bottom:12px;">Notify all users of a new app version.</p>' +
        '<form id="app-update-form">' +
          '<input class="admin-input" name="version" placeholder="New Version (e.g. 2.1.0)" required>' +
          '<textarea class="admin-input" name="notes" placeholder="What is new in this update..." required></textarea>' +
          '<button type="submit" class="btn-sm btn-green">Publish Update</button>' +
        '</form>' +
      '</div>';
    document.getElementById('app-update-form').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      Store.state.appVersion = data.version;
      Store.notify('all', 'App Update v' + data.version, data.notes);
      Store.save();
      UI.toast('Update published', 'success');
      e.target.reset();
    };
  },
  openNotifyModal(phone) {
    UI.modal({
      title: 'Notify User', submitLabel: 'Send',
      body: '<label>Title</label><input name="title" required>' +
            '<label>Message</label><textarea name="body" required style="min-height:80px;"></textarea>',
      onSubmit: ({ title, body }) => {
        Store.notify(phone, title, body);
        UI.toast('Sent', 'success');
      }
    });
  }
};
document.addEventListener('DOMContentLoaded', () => Admin.mount());
