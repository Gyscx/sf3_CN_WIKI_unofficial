// 极简 Supabase REST 客户端（不需要安装 SDK，静态站可直接使用）
(function () {
    'use strict';

    function isConfigured() {
        const url = String(window.SUPABASE_URL || '');
        const key = String(window.SUPABASE_ANON_KEY || '');
        return url.indexOf('YOUR_PROJECT_ID') === -1 &&
            key.indexOf('YOUR_PUBLISHABLE_KEY') === -1 &&
            url.length > 0 && key.length > 0;
    }

    async function request(path, options = {}) {
        const base = String(window.SUPABASE_URL || '').replace(/\/+$/, '');
        const key = window.SUPABASE_ANON_KEY || '';
        if (!isConfigured()) {
            throw new Error('Supabase 尚未配置');
        }

        const url = base + '/rest/v1/' + path + (options.query || '');
        const res = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                'apikey': key,
                'Authorization': 'Bearer ' + key,
                'Content-Type': 'application/json',
                'Prefer': options.prefer || 'return=representation'
            },
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const text = await res.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = text;
        }

        if (!res.ok) {
            const error = new Error((data && data.message) || ('Supabase 请求失败: HTTP ' + res.status));
            error.status = res.status;
            error.code = data && data.code;
            throw error;
        }
        return data;
    }

    window.SupabaseDB = { isConfigured: isConfigured, request: request };
})();
