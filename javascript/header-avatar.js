/*
 * 顶部右侧账户入口：只显示头像。
 * 已登录：显示账户名首字母头像，点击头像弹出菜单（含退出登录）。
 * 未登录：显示默认头像，点击前往登录页。
 */
(function () {
    'use strict';

    // 通过脚本自身路径定位站点根目录，子页面也能正确找到 login.html
    const scriptEl = document.querySelector('script[src*="header-avatar.js"]');
    const scriptUrl = scriptEl ? scriptEl.src : window.location.href;
    const loginUrl = new URL('login.html', scriptUrl).href;

    function refresh() {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');

        // 顶部导航里旧的“登录 / 注册”文字链接不再显示，统一使用头像
        document.querySelectorAll(
            '#loginDisplay, .login_display, .top a[href*="login.html"], .top a[href*="register.html"]'
        ).forEach(function (el) {
            el.style.display = 'none';
        });

        let container = document.getElementById('userInfo');
        if (!container) {
            container = document.createElement('div');
            container.className = 'user-info';
            container.id = 'userInfo';
            const header = document.querySelector('header.top');
            (header || document.body).appendChild(container);
        }

        // 清掉旧的“欢迎，xxx”文字和退出登录按钮
        container.innerHTML = '';
        // 页面模板里带着 display:none 的行内样式，这里显式恢复显示
        container.style.display = 'flex';
        container.classList.toggle('is-logged-in', !!(token && username));

        if (token && username) {
            const wrap = document.createElement('div');
            wrap.className = 'avatar-wrap';

            const trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'avatar-trigger';
            trigger.setAttribute('aria-label', '用户菜单');
            trigger.setAttribute('aria-expanded', 'false');

            const avatar = document.createElement('span');
            avatar.className = 'avatar';
            avatar.textContent = username.trim().charAt(0).toUpperCase();
            trigger.appendChild(avatar);

            const menu = document.createElement('div');
            menu.className = 'avatar-menu';

            const name = document.createElement('div');
            name.className = 'avatar-menu-name';
            name.textContent = username;

            const logout = document.createElement('button');
            logout.type = 'button';
            logout.className = 'avatar-logout';
            logout.textContent = '退出登录';
            logout.addEventListener('click', function () {
                if (window.confirm('确定要退出登录吗？')) {
                    signOut();
                }
            });

            menu.appendChild(name);
            menu.appendChild(logout);
            wrap.appendChild(trigger);
            wrap.appendChild(menu);
            container.appendChild(wrap);

            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                const open = menu.classList.toggle('open');
                trigger.setAttribute('aria-expanded', String(open));
            });
        } else {
            const guest = document.createElement('a');
            guest.className = 'avatar-trigger avatar-guest';
            guest.href = loginUrl;
            guest.setAttribute('aria-label', '登录');
            guest.innerHTML = '<span class="avatar avatar-guest-icon">' +
                '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">' +
                '<path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6Z"/>' +
                '</svg></span>';
            container.appendChild(guest);
        }
    }

    function signOut() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        refresh();
    }

    // 点击页面其他位置关闭菜单
    document.addEventListener('click', function () {
        document.querySelectorAll('.avatar-menu.open').forEach(function (menu) {
            menu.classList.remove('open');
            const trigger = menu.parentElement.querySelector('.avatar-trigger');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('DOMContentLoaded', refresh);
    window.addEventListener('storage', refresh);

    // 供其他脚本在登录状态变化后调用
    window.refreshHeaderAuth = refresh;
    window.siteLogout = signOut;
})();
