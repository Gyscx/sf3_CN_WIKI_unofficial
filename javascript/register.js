// 注册：仅使用账户名 + 密码，无需邮箱验证码
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
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || '注册失败');
        }

        // 注册成功
        btnText.textContent = '注册成功！';
        setTimeout(() => {
            alert("注册成功，请使用账户名和密码登录");
            location.href = "login.html";
        }, 1000);

    } catch (error) {
        // 恢复按钮状态
        submitBtn.classList.remove('loading');
        btnText.textContent = '注册账户';
        alert(error.message);
    }
});
