/*
 * 各内容页的登录弹窗逻辑。
 * 顶部用户信息统一由 header-avatar.js 渲染（只显示头像）。
 */
(function () {
    'use strict';

    const scriptEl = document.querySelector('script[src*="profile.js"]');
    const scriptUrl = scriptEl ? scriptEl.src : window.location.href;
    const rootUrl = new URL('../', scriptUrl);

    document.addEventListener('DOMContentLoaded', function () {
        const loginModal = document.getElementById('loginModal');
        const performLogin = document.getElementById('performLogin');
        const goToRegister = document.getElementById('goToRegister');

        function refreshHeader() {
            if (typeof window.refreshHeaderAuth === 'function') {
                window.refreshHeaderAuth();
            }
        }

        // 纯静态登录：账户名 + 密码
        function login(username, password) {
            const result = window.SF3Auth.login(username, password);
            if (!result.ok) {
                throw new Error(result.error || '登录失败');
            }
            return result;
        }

        if (performLogin) {
            performLogin.addEventListener('click', async function () {
                const username = document.getElementById('loginUsername').value.trim();
                const password = document.getElementById('loginPassword').value;

                if (!username || !password) {
                    alert('请输入账户名和密码');
                    return;
                }

                performLogin.textContent = '登录中...';
                performLogin.disabled = true;

                try {
                    const result = await login(username, password);

                    localStorage.setItem('token', result.token);
                    localStorage.setItem('username', result.username || username);
                    localStorage.setItem('role', result.role || 'user');

                    refreshHeader();

                    const targetPage = localStorage.getItem('targetPage');
                    localStorage.removeItem('targetPage');
                    window.location.href = targetPage || new URL('index.html', rootUrl).href;
                } catch (error) {
                    alert('登录失败: ' + error.message);
                    performLogin.textContent = '登录';
                    performLogin.disabled = false;
                }
            });
        }

        if (goToRegister) {
            goToRegister.addEventListener('click', function () {
                window.location.href = new URL('register.html', rootUrl).href;
            });
        }

        // 已登录时关闭登录弹窗
        if (loginModal && localStorage.getItem('token')) {
            loginModal.style.display = 'none';
            loginModal.classList.remove('active');
        }

        refreshHeader();
    });
})();
