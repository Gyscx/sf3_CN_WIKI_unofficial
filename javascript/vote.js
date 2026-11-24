// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function () {
    initializeData();
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    let role = localStorage.getItem("role");

    console.log("登录状态检查:", { token, username, role });

    // 特殊处理：如果用户是OP_GXC但角色不正确，强制修复
    if (username === "OP_GXC" && role !== "admin") {
        console.log("检测到OP_GXC账户但角色不正确，正在修复...");
        role = "admin";
        localStorage.setItem("role", "admin");
    }

    // 如果未登录，保存目标页面并跳转到登录页
    if (!token || !username) {
        localStorage.setItem('targetPage', window.location.pathname);
        window.location.href = "login.html";
        return;
    }

    // 已登录，显示用户信息并继续加载页面内容
    showUserInfo(username);
    initializePage();
});

// 添加数据初始化函数
function initializeData() {
    const storedPolls = localStorage.getItem('shadowFightPolls');
    if (!storedPolls) {
        // 如果没有数据，初始化默认投票
        const defaultPolls = [
            {
                id: 1,
                title: "你最喜欢的派系是？",
                description: "选择你最喜爱的Shadow Fight 3派系",
                options: [
                    { id: 1, text: "军团 (Legion)" },
                    { id: 2, text: "王朝 (Dynasty)" },
                    { id: 3, text: "先锋 (Heralds)" }
                ],
                votes: [],
                createdAt: new Date().toISOString(),
                createdBy: "admin"
            },
            {
                id: 2,
                title: "你最喜欢的暗影形态是？",
                description: "选择你最强大的暗影形态",
                options: [
                    { id: 4, text: "军团暗影形态" },
                    { id: 5, text: "王朝暗影形态" },
                    { id: 6, text: "先锋暗影形态" }
                ],
                votes: [],
                createdAt: new Date().toISOString(),
                createdBy: "admin"
            }
        ];
        localStorage.setItem('shadowFightPolls', JSON.stringify(defaultPolls));
        console.log("初始化默认投票数据完成");
    }
}

// 用户信息由 header-avatar.js 统一渲染（右上角只显示头像）
function showUserInfo(username) {
    if (typeof window.refreshHeaderAuth === 'function') {
        window.refreshHeaderAuth();
    }
}

// 退出登录（入口在头像菜单中）
function logout() {
    if (typeof window.siteLogout === 'function') {
        window.siteLogout();
    } else {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
    }
    window.location.href = "index.html";
}

function initializePage() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");

    console.log("权限检查详情:", {
        token: !!token,
        username: username,
        role: role,
        isAdmin: role === "admin",
        allConditions: role === "admin" && token && username
    });

    // 显示管理员链接
    if (role === "admin" && token && username) {
        document.getElementById("adminLink").innerHTML =
            '<a href="admin.html" class="admin-link">创建新投票</a>';
        console.log("✅ 管理员权限已授予，显示创建投票按钮");
    } else {
        document.getElementById("adminLink").innerHTML = '';
        console.log("❌ 管理员权限检查失败", {
            reason: !role ? "缺少role" :
                role !== "admin" ? "角色不是admin" :
                    !token ? "缺少token" : "缺少username",
            actualRole: role
        });
    }

    // 加载投票列表
    loadPolls();
}

function getStoredPolls() {
    const stored = localStorage.getItem('shadowFightPolls');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("解析投票数据失败:", e);
            return [];
        }
    }
    return [];
}

// 模拟用户投票记录
const userVotes = {};

// 更新模拟API函数，使用localStorage
async function api(path, options = {}) {
    console.log("模拟API调用:", { path, options });

    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("未授权访问，请先登录");
    }

    // 从localStorage获取数据
    let polls = getStoredPolls();
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    // 解析路径
    const pathParts = path.split('/').filter(p => p);

    // 修复：首先检查是否为DELETE请求
    if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'polls' && options.method === "DELETE") {
        try {
            const pollId = parseInt(pathParts[2]);
            console.log("尝试删除投票:", { pollId, role });

            if (role !== "admin") {
                throw new Error("只有管理员可以删除投票");
            }

            // 获取当前投票数据
            let polls = getStoredPolls();
            if (!Array.isArray(polls)) {
                console.error("投票数据不是数组，重置为空数组");
                polls = [];
            }

            console.log("当前投票数量:", polls.length, "要删除的投票ID:", pollId);

            const pollIndex = polls.findIndex(p => p.id === pollId);

            if (pollIndex === -1) {
                throw new Error(`投票不存在 (ID: ${pollId})`);
            }

            // 删除投票
            const deletedPoll = polls.splice(pollIndex, 1)[0];

            // 保存更新后的投票数据
            localStorage.setItem('shadowFightPolls', JSON.stringify(polls));

            // 同时删除该投票的用户投票记录
            try {
                const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
                for (const user in userVotes) {
                    if (userVotes[user] && userVotes[user][pollId] !== undefined) {
                        delete userVotes[user][pollId];
                    }
                }
                localStorage.setItem('userVotes', JSON.stringify(userVotes));
            } catch (e) {
                console.error("清理用户投票记录时出错:", e);
            }

            console.log("投票已删除:", deletedPoll.title);
            return {
                success: true,
                message: "投票删除成功",
                deletedPoll: deletedPoll
            };
        } catch (error) {
            console.error("删除投票时发生错误:", error);
            throw new Error("删除失败: " + error.message);
        }
    }

    // 然后是其他GET请求
    else if (path === '/api/polls' || pathParts.join('/') === 'api/polls') {
        // 返回投票列表（不包含投票详情）
        return polls.map(poll => ({
            id: poll.id,
            title: poll.title,
            description: poll.description || '',
            createdAt: poll.createdAt,
            createdBy: poll.createdBy
        }));
    }

    else if (pathParts.length === 3 && pathParts[0] === 'api' && pathParts[1] === 'polls') {
        const pollId = parseInt(pathParts[2]);
        const poll = polls.find(p => p.id === pollId);

        if (!poll) {
            throw new Error("投票不存在");
        }

        // 检查用户是否已投票
        const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        const hasVoted = userVotes[username] && userVotes[username][pollId];

        return {
            poll: {
                id: poll.id,
                title: poll.title,
                description: poll.description || ''
            },
            options: poll.options,
            voted: !!hasVoted
        };
    }

    else if (pathParts.length === 4 && pathParts[0] === 'api' && pathParts[1] === 'polls' && pathParts[3] === 'vote') {
        const pollId = parseInt(pathParts[2]);
        const body = JSON.parse(options.body || '{}');
        const optionId = body.optionId;

        if (!optionId) {
            throw new Error("请选择投票选项");
        }

        if (!username) {
            throw new Error("用户未登录");
        }

        // 记录用户投票
        const userVotes = JSON.parse(localStorage.getItem('userVotes') || '{}');
        if (!userVotes[username]) {
            userVotes[username] = {};
        }
        userVotes[username][pollId] = optionId;
        localStorage.setItem('userVotes', JSON.stringify(userVotes));

        // 记录到投票数据
        polls = getStoredPolls();
        const pollIndex = polls.findIndex(p => p.id === pollId);
        if (pollIndex !== -1) {
            if (!polls[pollIndex].votes) {
                polls[pollIndex].votes = [];
            }
            polls[pollIndex].votes.push({
                username: username,
                optionId: optionId,
                timestamp: new Date().toISOString()
            });

            // 保存更新后的投票数据
            localStorage.setItem('shadowFightPolls', JSON.stringify(polls));
        }

        return { success: true, message: "投票成功" };
    }

    else if (pathParts.length === 4 && pathParts[0] === 'api' && pathParts[1] === 'polls' && pathParts[3] === 'results') {
        const pollId = parseInt(pathParts[2]);
        polls = getStoredPolls();
        const poll = polls.find(p => p.id === pollId);

        if (!poll) {
            throw new Error("投票不存在");
        }

        // 统计投票结果
        const votes = poll.votes || [];
        const results = poll.options.map(option => {
            const count = votes.filter(vote => vote.optionId === option.id).length;
            return {
                id: option.id,
                text: option.text,
                count: count
            };
        });

        return results;
    }

    throw new Error("API路径不存在: " + path);
}

async function loadPolls() {
    try {
        console.log("开始加载投票列表...");
        const polls = await api("/api/polls");
        const ul = document.getElementById("pollList");
        ul.innerHTML = "";

        if (polls.length === 0) {
            ul.innerHTML = '<li class="no-polls">暂无投票活动</li>';
            // 同时清空详情区域
            document.getElementById("pollDetail").innerHTML = "";
            return;
        }

        // 获取当前用户角色
        const role = localStorage.getItem("role");
        const isAdmin = role === "admin";

        polls.forEach(p => {
            const li = document.createElement("li");
            li.className = "poll-item";

            // 管理员显示删除按钮
            li.innerHTML = `
                    <div class="poll-item-content">
                        <a href="#" onclick="showPoll(${p.id})" class="poll-link">
                            <span class="poll-title">${escapeHtml(p.title)}</span>
                            <span class="poll-description">${escapeHtml(p.description || '')}</span>
                            <span class="poll-arrow">→</span>
                        </a>
                        ${isAdmin ? `
                            <button class="delete-poll-btn" onclick="deletePoll(${p.id}, '${escapeHtml(p.title)}')" title="删除投票">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                `;
            ul.appendChild(li);
        });

        console.log("投票列表加载成功，共", polls.length, "个投票");

    } catch (error) {
        console.error("加载投票列表失败:", error);
        document.getElementById("pollList").innerHTML =
            '<li class="error">加载失败: ' + error.message + '</li>';
    }
}

// 工具函数：转义HTML特殊字符
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 修复：删除投票函数
async function deletePoll(pollId, pollTitle) {
    // 检查pollId是否为有效数字
    if (isNaN(pollId) || pollId <= 0) {
        console.error("无效的投票ID:", pollId);
        alert("无效的投票ID");
        return;
    }

    if (!confirm(`确定要删除投票"${pollTitle}"吗？此操作不可撤销！`)) {
        return;
    }

    const deleteBtn = event && event.target;
    let originalHTML = "";
    if (deleteBtn) {
        originalHTML = deleteBtn.innerHTML;
        // 显示加载状态
        deleteBtn.innerHTML = '删除中...';
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.7';
    }

    try {
        console.log("开始删除投票:", { pollId, pollTitle });

        // 调用API删除投票
        const result = await api(`/api/polls/${pollId}`, {
            method: "DELETE"
        });

        console.log("删除投票API响应:", result);

        if (result && result.success) {
            // 显示成功消息
            alert("投票删除成功！");

            // 重新加载投票列表
            await loadPolls();

            // 清空投票详情区域
            document.getElementById("pollDetail").innerHTML = "";

            console.log("投票删除成功:", result.deletedPoll);
        } else {
            throw new Error(result ? result.message : "未知错误");
        }

    } catch (error) {
        console.error("删除投票失败详情:", error);

        // 提供更详细的错误信息
        let errorMessage = "删除失败";
        if (error.message.includes("只有管理员可以删除投票")) {
            errorMessage = "您没有删除投票的权限";
        } else if (error.message.includes("投票不存在")) {
            errorMessage = "要删除的投票不存在，可能已被其他管理员删除";
        } else if (error.message.includes("未授权访问")) {
            errorMessage = "请先登录";
        } else {
            errorMessage = "删除失败: " + error.message;
        }

        alert(errorMessage);

    } finally {
        // 恢复按钮状态
        if (deleteBtn) {
            deleteBtn.innerHTML = originalHTML || "🗑️";
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
        }
    }
}

async function showPoll(id) {
    try {
        const data = await api(`/api/polls/${id}`);

        let html = `
                <div class="poll-header">
                    <h2>${escapeHtml(data.poll.title)}</h2>
                    <div class="poll-description">${escapeHtml(data.poll.description || '')}</div>
                    <div class="poll-status ${data.voted ? 'voted' : 'not-voted'}">
                        ${data.voted ? '已投票' : '未投票'}
                    </div>
                </div>
            `;

        if (!data.voted) {
            html += `
                    <div class="vote-form">
                        <h4>请选择一个选项投票：</h4>
                        <div class="options-list">
                `;

            data.options.forEach(o => {
                html += `
                        <label class="option-radio">
                            <input type="radio" name="opt" value="${o.id}">
                            <span class="radio-custom"></span>
                            <span class="option-text">${escapeHtml(o.text)}</span>
                        </label>
                    `;
            });

            html += `
                        </div>
                        <button class="vote-btn" onclick="vote(${id})">提交投票</button>
                    </div>
                `;
        } else {
            html += `
                    <div class="poll-results">
                        <button class="results-btn" onclick="loadResults(${id})">查看结果</button>
                        <div id="results" class="results-container"></div>
                    </div>
                `;
        }

        document.getElementById("pollDetail").innerHTML = html;

        if (data.voted) {
            await loadResults(id);
        }
    } catch (error) {
        console.error("加载投票详情失败:", error);
        document.getElementById("pollDetail").innerHTML =
            '<div class="error">加载失败: ' + error.message + '</div>';
    }
}

async function vote(pollId) {
    const selected = document.querySelector('input[name="opt"]:checked');
    if (!selected) {
        alert("请选择一个选项");
        return;
    }

    try {
        await api(`/api/polls/${pollId}/vote`, {
            method: "POST",
            body: JSON.stringify({ optionId: parseInt(selected.value) })
        });

        alert("投票成功！");
        showPoll(pollId);
    } catch (error) {
        alert("投票失败: " + error.message);
    }
}

async function loadResults(pollId) {
    try {
        const rows = await api(`/api/polls/${pollId}/results`);
        const total = rows.reduce((sum, r) => sum + r.count, 0);

        let html = `<h4>投票结果（总票数：${total}）</h4>`;
        rows.forEach(r => {
            const pct = total ? ((r.count / total) * 100).toFixed(1) : 0;
            const width = total ? (r.count / total) * 100 : 0;

            html += `
                    <div class="result-item">
                        <div class="result-info">
                            <span class="result-text">${escapeHtml(r.text)}</span>
                            <span class="result-stats">${r.count} 票（${pct}%）</span>
                        </div>
                        <div class="result-bar">
                            <div class="result-fill" style="width: ${width}%"></div>
                        </div>
                    </div>
                `;
        });

        document.getElementById("results").innerHTML = html;
    } catch (error) {
        console.error("加载结果失败:", error);
        document.getElementById("results").innerHTML =
            '<div class="error">加载结果失败: ' + error.message + '</div>';
    }
}