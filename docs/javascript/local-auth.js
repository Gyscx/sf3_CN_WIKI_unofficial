/*
 * 纯静态登录：账户信息保存在浏览器 localStorage 中，不依赖任何后端。
 * 注意：这不是真正的账号安全机制，仅用于静态站点演示。
 */
(function () {
    'use strict';

    const USERS_KEY = 'sf3_users';
    const ADMIN_USERNAME_KEY = 'sf3_admin_username';

    // 清理旧版本手工设置的管理员密码，统一使用代码里的密码规则
    localStorage.removeItem('sf3_admin_password');

    // 随机生成管理员账户名，避免使用固定用户名被他人猜测
    function randomString(length) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const bytes = new Uint8Array(length);
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
        }
        let result = '';
        for (let i = 0; i < length; i++) result += chars[bytes[i] % chars.length];
        return result;
    }

    function getAdminUsername() {
        let name = localStorage.getItem(ADMIN_USERNAME_KEY);
        if (!name) {
            name = 'ADM-' + randomString(10);
            localStorage.setItem(ADMIN_USERNAME_KEY, name);
        }
        return name;
    }

    function regenerateAdminUsername() {
        const name = 'ADM-' + randomString(10);
        localStorage.setItem(ADMIN_USERNAME_KEY, name);
        return name;
    }

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

    // 管理员密码由账户名按固定规则生成，不在页面显示
    function adminPassword(name) {
        return '666' + name + '666';
    }

    function register(username, password) {
        const name = String(username || '').trim();
        if (!name || !password) {
            return { ok: false, error: '请输入账户名和密码' };
        }
        if (name === getAdminUsername()) {
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
        // 管理员账户使用随机账户名 + 代码规则生成的密码
        if (name === getAdminUsername()) {
            if (password !== adminPassword(name)) {
                return { ok: false, error: '管理员密码错误' };
            }
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

    window.SF3Auth = {
        register: register,
        login: login,
        readUsers: readUsers,
        adminUsername: getAdminUsername,
        regenerateAdminUsername: regenerateAdminUsername
    };
})();
