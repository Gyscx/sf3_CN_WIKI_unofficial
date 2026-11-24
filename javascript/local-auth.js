/*
 * 纯静态登录：账户信息保存在浏览器 localStorage 中，不依赖任何后端。
 * 注意：这不是真正的账号安全机制，仅用于静态站点演示。
 */
(function () {
    'use strict';

    const USERS_KEY = 'sf3_users';
    const ADMIN_USER = 'OP_GXC';

    function readUsers() {
        try {
            const raw = localStorage.getItem(USERS_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function writeUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function register(username, password) {
        const name = String(username || '').trim();
        if (!name || !password) {
            return { ok: false, error: '请输入账户名和密码' };
        }
        if (name === ADMIN_USER) {
            return { ok: false, error: '该账户名不可用' };
        }
        if (readUsers().some(function (u) { return u.username === name; })) {
            return { ok: false, error: '账户名已存在' };
        }
        const users = readUsers();
        users.push({ username: name, password: password, role: 'user' });
        writeUsers(users);
        return { ok: true, username: name };
    }

    function login(username, password) {
        const name = String(username || '').trim();
        if (!name || !password) {
            return { ok: false, error: '请输入账户名和密码' };
        }
        // 管理员账户沿用原有约定：任意非空密码即可进入管理页
        if (name === ADMIN_USER) {
            return { ok: true, username: name, role: 'admin', token: 'mock_token_' + Date.now() };
        }
        const user = readUsers().find(function (u) { return u.username === name; });
        if (!user || user.password !== password) {
            return { ok: false, error: '账户名或密码错误' };
        }
        return {
            ok: true,
            username: name,
            role: user.role || 'user',
            token: 'mock_token_' + Date.now()
        };
    }

    window.SF3Auth = { register: register, login: login, readUsers: readUsers };
})();
