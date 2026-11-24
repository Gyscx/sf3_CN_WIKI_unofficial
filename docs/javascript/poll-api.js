/*
 * 投票数据访问层：
 * - 配置了 Supabase：所有人共享同一份投票数据
 * - 未配置：退回浏览器 localStorage（每人只能看到自己的）
 */
(function () {
    'use strict';

    const POLLS_KEY = 'shadowFightPolls';
    const VOTES_KEY = 'userVotes';

    function readPolls() {
        try {
            const stored = localStorage.getItem(POLLS_KEY);
            const list = stored ? JSON.parse(stored) : [];
            return Array.isArray(list) ? list : [];
        } catch (e) {
            return [];
        }
    }

    function writePolls(polls) {
        localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
    }

    function readVotes() {
        try {
            return JSON.parse(localStorage.getItem(VOTES_KEY) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeVotes(votes) {
        localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
    }

    function currentUser() {
        return localStorage.getItem('username') || '';
    }

    function isAdmin() {
        return localStorage.getItem('role') === 'admin';
    }

    function useSupabase() {
        return window.SupabaseDB && window.SupabaseDB.isConfigured();
    }

    async function list() {
        if (useSupabase()) {
            const rows = await window.SupabaseDB.request('polls', {
                query: '?select=id,title,description,created_by,created_at&order=created_at.desc'
            });
            return rows.map(function (row) {
                return {
                    id: Number(row.id),
                    title: row.title,
                    description: row.description || '',
                    createdBy: row.created_by || '',
                    createdAt: row.created_at
                };
            });
        }
        return readPolls().map(function (poll) {
            return {
                id: poll.id,
                title: poll.title,
                description: poll.description || '',
                createdBy: poll.createdBy,
                createdAt: poll.createdAt
            };
        });
    }

    async function get(id) {
        if (useSupabase()) {
            const polls = await window.SupabaseDB.request('polls', {
                query: '?id=eq.' + id + '&select=id,title,description'
            });
            if (!polls.length) throw new Error('投票不存在');
            const options = await window.SupabaseDB.request('poll_options', {
                query: '?poll_id=eq.' + id + '&select=id,text&order=id.asc'
            });
            const user = currentUser();
            let voted = false;
            if (user) {
                const votes = await window.SupabaseDB.request('votes', {
                    query: '?poll_id=eq.' + id + '&username=eq.' + encodeURIComponent(user) + '&select=id&limit=1'
                });
                voted = votes.length > 0;
            }
            return {
                poll: { id: Number(polls[0].id), title: polls[0].title, description: polls[0].description || '' },
                options: options.map(function (o) { return { id: Number(o.id), text: o.text }; }),
                voted: voted
            };
        }

        const poll = readPolls().find(function (p) { return p.id === id; });
        if (!poll) throw new Error('投票不存在');
        const votes = readVotes();
        return {
            poll: { id: poll.id, title: poll.title, description: poll.description || '' },
            options: poll.options || [],
            voted: !!(votes[currentUser()] && votes[currentUser()][id])
        };
    }

    async function vote(id, optionId) {
        const user = currentUser();
        if (!user) throw new Error('用户未登录');

        if (useSupabase()) {
            try {
                await window.SupabaseDB.request('votes', {
                    method: 'POST',
                    body: { poll_id: id, option_id: optionId, username: user }
                });
            } catch (e) {
                if (e.code === '23505' || /duplicate/i.test(e.message)) {
                    throw new Error('您已经投过票了');
                }
                throw e;
            }
            return { success: true, message: '投票成功' };
        }

        const votes = readVotes();
        if (!votes[user]) votes[user] = {};
        if (votes[user][id]) throw new Error('您已经投过票了');
        votes[user][id] = optionId;
        writeVotes(votes);

        const polls = readPolls();
        const poll = polls.find(function (p) { return p.id === id; });
        if (poll) {
            if (!poll.votes) poll.votes = [];
            poll.votes.push({ username: user, optionId: optionId, timestamp: new Date().toISOString() });
            writePolls(polls);
        }
        return { success: true, message: '投票成功' };
    }

    async function results(id) {
        if (useSupabase()) {
            const options = await window.SupabaseDB.request('poll_options', {
                query: '?poll_id=eq.' + id + '&select=id,text&order=id.asc'
            });
            const votes = await window.SupabaseDB.request('votes', {
                query: '?poll_id=eq.' + id + '&select=option_id'
            });
            return options.map(function (o) {
                return {
                    id: Number(o.id),
                    text: o.text,
                    count: votes.filter(function (v) { return Number(v.option_id) === Number(o.id); }).length
                };
            });
        }

        const poll = readPolls().find(function (p) { return p.id === id; });
        if (!poll) throw new Error('投票不存在');
        const votes = poll.votes || [];
        return (poll.options || []).map(function (option) {
            return {
                id: option.id,
                text: option.text,
                count: votes.filter(function (v) { return v.optionId === option.id; }).length
            };
        });
    }

    async function remove(id) {
        if (!isAdmin()) throw new Error('只有管理员可以删除投票');

        if (useSupabase()) {
            const before = await window.SupabaseDB.request('polls', {
                query: '?id=eq.' + id + '&select=id,title'
            });
            if (!before.length) throw new Error('投票不存在');
            await window.SupabaseDB.request('polls', {
                method: 'DELETE',
                query: '?id=eq.' + id,
                prefer: 'return=minimal'
            });
            return {
                success: true,
                message: '投票删除成功',
                deletedPoll: { id: Number(before[0].id), title: before[0].title }
            };
        }

        const polls = readPolls();
        const index = polls.findIndex(function (p) { return p.id === id; });
        if (index === -1) throw new Error('投票不存在');
        const deleted = polls.splice(index, 1)[0];
        writePolls(polls);

        const votes = readVotes();
        for (const user in votes) {
            if (votes[user]) delete votes[user][id];
        }
        writeVotes(votes);
        return { success: true, message: '投票删除成功', deletedPoll: deleted };
    }

    async function create(title, options, createdBy) {
        if (useSupabase()) {
            const rows = await window.SupabaseDB.request('polls', {
                method: 'POST',
                body: { title: title, description: '', created_by: createdBy || currentUser() || 'admin' }
            });
            const pollId = Number(rows[0].id);
            for (const text of options) {
                await window.SupabaseDB.request('poll_options', {
                    method: 'POST',
                    body: { poll_id: pollId, text: text }
                });
            }
            return { success: true, message: '投票创建成功', pollId: pollId, title: title, options: options };
        }

        const polls = readPolls();
        const newId = polls.length ? Math.max.apply(null, polls.map(function (p) { return p.id; })) + 1 : 1;
        const poll = {
            id: newId,
            title: title,
            description: '',
            options: options.map(function (text, index) { return { id: index + 1, text: text }; }),
            votes: [],
            createdAt: new Date().toISOString(),
            createdBy: createdBy || currentUser() || 'admin'
        };
        polls.push(poll);
        writePolls(polls);
        return { success: true, message: '投票创建成功', pollId: newId, title: title, options: options };
    }

    window.PollAPI = {
        list: list,
        get: get,
        vote: vote,
        results: results,
        remove: remove,
        create: create
    };
})();
