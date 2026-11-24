// 登录：账户名 + 密码，纯静态校验（不依赖后端）
document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');

    if (!username || !password) {
        alert('请输入账户名和密码');
        return;
    }

    // 显示加载状态
    submitBtn.classList.add('loading');
    btnText.textContent = '登录中...';

    try {
        const result = window.SF3Auth.login(username, password);

        if (!result.ok) {
            throw new Error(result.error || '登录失败');
        }

        // 登录成功 - 保存账户信息
        localStorage.setItem('token', result.token);
        localStorage.setItem('username', result.username);
        localStorage.setItem('role', result.role || 'user');

        btnText.textContent = '登录成功！';

        // 获取目标页面并跳转
        const targetPage = localStorage.getItem('targetPage') || 'index.html';
        localStorage.removeItem('targetPage');

        setTimeout(() => {
            window.location.href = targetPage;
        }, 1000);

    } catch (error) {
        // 恢复按钮状态
        submitBtn.classList.remove('loading');
        btnText.textContent = '登录';
        alert('登录失败: ' + error.message);
    }
});
