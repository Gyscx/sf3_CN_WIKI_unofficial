// 登录：账户名 + 密码，调用真实 API
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
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || '登录失败');
        }

        // 登录成功 - 保存服务端返回的账户信息与角色
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username || username);
        localStorage.setItem("role", data.role || 'user');

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
        alert('登录失败: ' + (error.message === 'Failed to fetch' ? '无法连接服务器，请稍后重试' : error.message));
    }
});
