// 注册：账户名 + 密码，账户信息仅保存在当前浏览器中
document.getElementById('registerForm').addEventListener('submit', async function (e) {
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
    btnText.textContent = '注册中...';

    try {
        const result = window.SF3Auth.register(username, password);

        if (!result.ok) {
            throw new Error(result.error || '注册失败');
        }

        // 注册成功
        btnText.textContent = '注册成功！';
        setTimeout(() => {
            alert('注册成功，请使用账户名和密码登录（账户信息保存在当前浏览器）');
            location.href = 'login.html';
        }, 1000);

    } catch (error) {
        // 恢复按钮状态
        submitBtn.classList.remove('loading');
        btnText.textContent = '注册账户';
        alert(error.message);
    }
});
