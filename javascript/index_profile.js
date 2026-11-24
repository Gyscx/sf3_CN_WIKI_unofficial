/*
 * 首页登录弹窗与社区入口逻辑。
 * 顶部用户信息统一由 header-avatar.js 渲染（只显示头像）。
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const loginModal = document.getElementById('loginModal');
        const performLogin = document.getElementById('performLogin');
        const goToRegister = document.getElementById('goToRegister');
        const voteSystemLink = document.getElementById('voteSystemLink');
        const messageBoardLink = document.getElementById('messageBoardLink');

        function refreshHeader() {
            if (typeof window.refreshHeaderAuth === 'function') {
                window.refreshHeaderAuth();
            }
        }

        function openLoginModal(target) {
            if (!loginModal) return;
            if (target) localStorage.setItem('targetPage', target);
            loginModal.classList.add('active');
            loginModal.style.display = 'flex';
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
                    window.location.href = targetPage || 'index.html';
                } catch (error) {
                    alert('登录失败: ' + error.message);
                    performLogin.textContent = '登录';
                    performLogin.disabled = false;
                }
            });
        }

        if (goToRegister) {
            goToRegister.addEventListener('click', function () {
                window.location.href = 'register.html';
            });
        }

        if (voteSystemLink) {
            voteSystemLink.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem('token');
                const username = localStorage.getItem('username');
                if (!token || !username) {
                    openLoginModal('vote.html');
                } else {
                    window.location.href = 'vote.html';
                }
            });
        }

        if (messageBoardLink) {
            messageBoardLink.addEventListener('click', function (e) {
                e.preventDefault();
                const token = localStorage.getItem('token');
                const username = localStorage.getItem('username');
                if (!token || !username) {
                    openLoginModal('message_board.html');
                } else {
                    window.location.href = 'message_board.html';
                }
            });
        }

        refreshHeader();

        // 通过 ?target= 跳转过来且未登录时，显示登录弹窗
        const target = new URLSearchParams(window.location.search).get('target');
        if (target && !localStorage.getItem('token')) {
            openLoginModal(target);
        } else if (localStorage.getItem('token') && loginModal) {
            loginModal.classList.remove('active');
            loginModal.style.display = 'none';
        }
    });
})();
