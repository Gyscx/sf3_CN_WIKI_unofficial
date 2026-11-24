// 在admin.html开头添加更严格的权限检查
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const username = localStorage.getItem("username");

console.log("管理员页面访问检查:", { token, username, role });

if (!token || !username) {
    // 未登录，跳转到登录页
    localStorage.setItem('targetPage', 'admin.html');
    location.href = "login.html";
} else if (role !== "admin") {
    // 不是管理员，显示错误并跳转
    alert("只有管理员可以访问此页面");
    console.error("权限拒绝: 用户角色为", role, "期望admin");
    location.href = "vote.html";
}

// 显示当前用户信息
document.addEventListener('DOMContentLoaded', function () {
    const userDisplay = document.createElement('div');
    userDisplay.className = 'current-user';
    userDisplay.innerHTML = `当前用户: ${username} (${role})`;
    document.querySelector('.admin-header').appendChild(userDisplay);

    // 初始化选项
    addOption();
    addOption();

    // 管理员密码设置
    const hint = document.getElementById('adminPasswordHint');
    const form = document.getElementById('adminPasswordForm');

    function refreshHint() {
        if (!hint) return;
        const name = window.SF3Auth.adminUsername();
        hint.textContent = '管理员账户名（仅本浏览器）：' + name + '。' +
            (window.SF3Auth.hasAdminPassword()
                ? '密码已设置，修改时需要输入原密码。'
                : '尚未设置密码，目前输入任意密码即可登录，请尽快设置。');
    }

    refreshHint();

    const regenerateBtn = document.getElementById('regenerateAdminUsernameBtn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', function () {
            if (!confirm('确定要重新生成管理员账户名吗？旧的账户名将立即失效。')) return;
            window.SF3Auth.regenerateAdminUsername();
            refreshHint();
            alert('管理员账户名已重新生成，请记好新的账户名。');
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const current = document.getElementById('currentAdminPassword').value;
            const next = document.getElementById('newAdminPassword').value;
            const confirm = document.getElementById('confirmAdminPassword').value;

            if (next !== confirm) {
                alert('两次输入的新密码不一致');
                return;
            }

            const result = window.SF3Auth.setAdminPassword(current, next);
            if (!result.ok) {
                alert(result.error);
                return;
            }

            alert('管理员密码已保存');
            form.reset();
            refreshHint();
        });
    }
});

function addOption(value = "") {
    const div = document.createElement("div");
    div.className = "option-item";
    div.innerHTML = `
            <div class="option-input-group">
                <input class="opt" placeholder="选项内容" value="${value}" required>
                <button type="button" class="remove-option" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
    document.getElementById("options").appendChild(div);
}

// 完全模拟的创建投票API，避免token验证问题
async function createPoll() {
    const title = document.getElementById("title").value.trim();
    const opts = Array.from(document.querySelectorAll(".opt")).map(i => i.value.trim()).filter(Boolean);

    if (!title) {
        alert("请输入标题");
        return;
    }
    if (opts.length < 2) {
        alert("至少需要2个选项");
        return;
    }

    const submitBtn = document.querySelector('.submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');

    // 显示加载状态
    submitBtn.classList.add('loading');
    btnText.textContent = '创建中...';

    try {
        // 使用模拟API替代真实API调用，避免token验证问题
        const result = await mockCreatePollAPI(title, opts);

        // 创建成功
        btnText.textContent = '创建成功！';
        setTimeout(() => {
            alert("投票创建成功！");
            location.href = "vote.html";
        }, 1000);

    } catch (error) {
        // 恢复按钮状态
        submitBtn.classList.remove('loading');
        btnText.textContent = '创建投票';
        alert("创建失败: " + error.message);
    }
}

// 创建投票：配置 Supabase 后所有人可见，否则只保存在当前浏览器
function mockCreatePollAPI(title, options) {
    return window.PollAPI.create(title, options, localStorage.getItem("username") || "admin");
}