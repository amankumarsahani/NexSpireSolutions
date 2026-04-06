import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
    auth_type: 'oauth_personal',
    account_name: '',
    folder_id: '',
    subject_email: '',
    credentials_json: '{\n  \n}',
    oauth_client_id: '',
    oauth_client_secret: '',
    oauth_refresh_token: ''
};

function SignInPanel() {
    const { login, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError('');

        const result = await login(email, password);
        if (!result.success) {
            setError(result.message || 'Login failed');
        }

        setSubmitting(false);
    };

    return (
        <section className="min-h-screen bg-slate-950 px-6 pb-24 pt-36 text-white">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100">
                        <i className="ri-hard-drive-3-line" />
                        Backup admin
                    </div>
                    <h1 className="mt-6 font-display text-4xl font-bold leading-tight">Tenant backups to Google Drive.</h1>
                    <p className="mt-4 max-w-2xl text-slate-300">
                        Sign in with an admin account to configure Google Drive backup accounts and trigger the existing backend backup worker.
                    </p>
                </div>

                <div className="rounded-[2rem] bg-white p-8 text-slate-900 shadow-2xl shadow-slate-950/20">
                    <h2 className="font-display text-2xl font-bold">Admin Sign In</h2>
                    <p className="mt-2 text-sm text-slate-600">Uses the existing Nexspire admin API auth.</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                required
                            />
                        </div>

                        {error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading || submitting}
                            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {loading || submitting ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

function AccessDenied({ email, onLogout }) {
    return (
        <section className="min-h-screen bg-slate-950 px-6 pb-24 pt-36 text-white">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
                <h1 className="font-display text-4xl font-bold">Admin access required</h1>
                <p className="mt-4 text-slate-300">
                    Signed in as <span className="font-semibold text-white">{email}</span>, but this route is restricted to admin users.
                </p>
                <button
                    type="button"
                    onClick={onLogout}
                    className="mt-8 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold"
                >
                    Sign Out
                </button>
            </div>
        </section>
    );
}

function safePrettyJson(value) {
    if (!value) {
        return '{\n  \n}';
    }
    try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        return JSON.stringify(parsed, null, 2);
    } catch {
        return typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2);
    }
}

export default function AdminBackupsPage() {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [servers, setServers] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [running, setRunning] = useState(false);
    const [notice, setNotice] = useState({ type: '', message: '' });

    const isAdmin = user?.role === 'admin';

    const stats = useMemo(() => ({
        activeAccounts: accounts.filter((account) => account.is_active).length,
        totalUsage: accounts.reduce((sum, account) => sum + (Number(account.usage_count) || 0), 0),
        activeServers: servers.filter((server) => server.is_active).length
    }), [accounts, servers]);

    const resetForm = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const setMessage = (message, type = 'success') => {
        setNotice({ type, message });
    };

    const loadData = async () => {
        if (!isAuthenticated || !isAdmin) {
            setPageLoading(false);
            return;
        }

        setPageLoading(true);
        try {
            const [accountsResponse, serversResponse] = await Promise.all([
                adminAPI.getBackupAccounts(),
                adminAPI.getServers()
            ]);

            setAccounts(accountsResponse.data?.data || []);
            setServers(serversResponse.data?.data || []);
        } catch (error) {
            setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to load backup data', 'error');
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [isAuthenticated, isAdmin]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleEdit = (account) => {
        const authType = account.auth_type === 'oauth_personal' ? 'oauth_personal' : 'service_account';
        setEditingId(account.id);
        setForm({
            auth_type: authType,
            account_name: account.account_name || '',
            folder_id: account.folder_id || '',
            subject_email: account.subject_email || '',
            credentials_json: safePrettyJson(account.credentials_json),
            oauth_client_id: account.oauth_client_id || '',
            oauth_client_secret: account.oauth_client_secret || '',
            oauth_refresh_token: account.oauth_refresh_token || ''
        });
        setMessage(`Editing "${account.account_name}"`, 'info');
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete backup account "${name}"?`)) return;
        try {
            await adminAPI.deleteBackupAccount(id);
            setAccounts((prev) => prev.filter((account) => account.id !== id));
            if (editingId === id) resetForm();
            setMessage(`Deleted "${name}"`);
        } catch (error) {
            setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to delete backup account', 'error');
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setNotice({ type: '', message: '' });
        const authType = form.auth_type === 'oauth_personal' ? 'oauth_personal' : 'service_account';
        let credentials = null;

        if (authType === 'service_account') {
            try {
                credentials = JSON.parse(form.credentials_json);
            } catch {
                setSaving(false);
                setMessage('Credentials JSON is invalid', 'error');
                return;
            }
        }

        const payload = {
            auth_type: authType,
            account_name: form.account_name.trim(),
            folder_id: form.folder_id.trim(),
            subject_email: authType === 'service_account' ? form.subject_email.trim() : '',
            credentials_json: authType === 'service_account' ? credentials : null,
            oauth_client_id: authType === 'oauth_personal' ? form.oauth_client_id.trim() : '',
            oauth_client_secret: authType === 'oauth_personal' ? form.oauth_client_secret.trim() : '',
            oauth_refresh_token: authType === 'oauth_personal' ? form.oauth_refresh_token.trim() : ''
        };

        try {
            if (editingId) {
                await adminAPI.updateBackupAccount(editingId, payload);
                setMessage('Backup account updated');
            } else {
                await adminAPI.createBackupAccount(payload);
                setMessage('Backup account created');
            }

            resetForm();
            await loadData();
        } catch (error) {
            setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to save backup account', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRunNow = async () => {
        setRunning(true);
        setNotice({ type: '', message: '' });
        try {
            await adminAPI.runBackupsNow();
            setMessage('Backup process started in the background');
        } catch (error) {
            setMessage(error.response?.data?.message || error.response?.data?.error || 'Failed to trigger backup run', 'error');
        } finally {
            setRunning(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <>
                <Helmet>
                    <title>Backup Management | Nexspire Solutions</title>
                </Helmet>
                <SignInPanel />
            </>
        );
    }

    if (loading) {
        return <section className="min-h-screen px-6 pb-24 pt-36">Loading...</section>;
    }

    if (!isAdmin) {
        return (
            <>
                <Helmet>
                    <title>Backup Management | Nexspire Solutions</title>
                </Helmet>
                <AccessDenied email={user?.email} onLogout={logout} />
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Backup Management | Nexspire Solutions</title>
            </Helmet>

            <section className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_25%),linear-gradient(180deg,#f8fbff_0%,#eef6ff_50%,#f8fafc_100%)] px-6 pb-24 pt-32">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700">
                                <i className="ri-google-line" />
                                Google Drive backups
                            </div>
                            <h1 className="mt-5 font-display text-4xl font-bold text-slate-900 md:text-5xl">Backup Management</h1>
                            <p className="mt-4 max-w-3xl text-slate-600">
                                Configure backup accounts, verify server metadata, and trigger the backend backup worker without raw API calls.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleRunNow}
                                disabled={running}
                                className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {running ? 'Starting backup...' : 'Run Backup Now'}
                            </button>
                            <button
                                type="button"
                                onClick={logout}
                                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                            <p className="text-sm font-medium text-slate-600">Active backup accounts</p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.activeAccounts}</p>
                        </div>
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                            <p className="text-sm font-medium text-slate-600">Total usage count</p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalUsage}</p>
                        </div>
                        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                            <p className="text-sm font-medium text-slate-600">Active servers</p>
                            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.activeServers}</p>
                        </div>
                    </div>

                    {notice.message ? (
                        <div className={`mt-8 rounded-2xl border px-5 py-4 text-sm ${notice.type === 'error'
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : notice.type === 'info'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            }`}>
                            {notice.message}
                        </div>
                    ) : null}

                    <div className="mt-10 grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
                        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="font-display text-2xl font-bold text-slate-900">{editingId ? 'Edit Backup Account' : 'Add Backup Account'}</h2>
                                    <p className="mt-2 text-sm text-slate-600">Choose personal OAuth for normal Gmail Drive, or service-account mode for Shared Drive setups.</p>
                                </div>
                                {editingId ? (
                                    <button type="button" onClick={resetForm} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                        Cancel
                                    </button>
                                ) : null}
                            </div>

                            <div className="mt-8 space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Google auth mode</label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, auth_type: 'oauth_personal' }))}
                                            className={`rounded-2xl border px-4 py-3 text-left transition ${form.auth_type === 'oauth_personal'
                                                ? 'border-blue-500 bg-blue-50 text-blue-800'
                                                : 'border-slate-200 bg-white text-slate-700'
                                                }`}
                                        >
                                            <span className="block text-sm font-semibold">Personal Drive OAuth</span>
                                            <span className="mt-1 block text-xs text-slate-500">Use normal `@gmail.com` Drive with OAuth client ID, secret, and refresh token.</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, auth_type: 'service_account' }))}
                                            className={`rounded-2xl border px-4 py-3 text-left transition ${form.auth_type === 'service_account'
                                                ? 'border-blue-500 bg-blue-50 text-blue-800'
                                                : 'border-slate-200 bg-white text-slate-700'
                                                }`}
                                        >
                                            <span className="block text-sm font-semibold">Service Account</span>
                                            <span className="mt-1 block text-xs text-slate-500">Use Shared Drive / Workspace-style setup with service-account JSON.</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Account name</label>
                                    <input name="account_name" value={form.account_name} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Folder ID</label>
                                    <input name="folder_id" value={form.folder_id} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
                                </div>

                                {form.auth_type === 'oauth_personal' ? (
                                    <>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700">OAuth client ID</label>
                                                <input name="oauth_client_id" value={form.oauth_client_id} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700">OAuth client secret</label>
                                                <input name="oauth_client_secret" value={form.oauth_client_secret} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">OAuth refresh token</label>
                                            <textarea name="oauth_refresh_token" value={form.oauth_refresh_token} onChange={handleChange} rows={5} spellCheck={false} className="w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-sm text-cyan-100 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" required />
                                        </div>
                                        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                            Personal Google Drive requires OAuth. Generate a refresh token with Google Drive scope and paste it here. Do not use `Impersonate Email` for `@gmail.com` accounts.
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-700">Impersonate email</label>
                                                <input name="subject_email" value={form.subject_email} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                                            </div>
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                                Service-account mode is for Shared Drives or Google Workspace setups, not normal personal Gmail Drive folders.
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Service account JSON</label>
                                            <textarea name="credentials_json" value={form.credentials_json} onChange={handleChange} rows={14} spellCheck={false} className="w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-sm text-cyan-100 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" required />
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                            Use a Shared Drive or a folder already shared with the service account.
                                        </div>
                                    </>
                                )}
                                <button type="submit" disabled={saving} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                                    {saving ? 'Saving...' : editingId ? 'Update Backup Account' : 'Create Backup Account'}
                                </button>
                            </div>
                        </form>

                        <div className="space-y-8">
                            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-display text-2xl font-bold text-slate-900">Configured Accounts</h2>
                                        <p className="mt-2 text-sm text-slate-600">Create, edit, or delete backup accounts from here.</p>
                                    </div>
                                    <button type="button" onClick={loadData} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                                        Refresh
                                    </button>
                                </div>
                                <div className="mt-6 space-y-4">
                                    {pageLoading ? (
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                                            Loading backup accounts...
                                        </div>
                                    ) : accounts.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                                            No backup accounts configured yet.
                                        </div>
                                    ) : accounts.map((account) => {
                                        let clientEmail = '';
                                        const authType = account.auth_type === 'oauth_personal' ? 'oauth_personal' : 'service_account';
                                        try {
                                            const credentials = typeof account.credentials_json === 'string' ? JSON.parse(account.credentials_json) : account.credentials_json;
                                            clientEmail = credentials?.client_email || '';
                                        } catch {
                                            clientEmail = '';
                                        }

                                        return (
                                            <div key={account.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <h3 className="text-lg font-semibold text-slate-900">{account.account_name}</h3>
                                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                                {account.is_active ? 'Active' : 'Inactive'}
                                                            </span>
                                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${authType === 'oauth_personal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                {authType === 'oauth_personal' ? 'Personal Drive OAuth' : 'Service Account'}
                                                            </span>
                                                        </div>
                                                        <div className="grid gap-2 text-sm text-slate-600">
                                                            <p><span className="font-medium text-slate-800">Folder ID:</span> {account.folder_id || '-'}</p>
                                                            {authType === 'oauth_personal' ? (
                                                                <>
                                                                    <p><span className="font-medium text-slate-800">OAuth client ID:</span> {account.oauth_client_id || 'Not set'}</p>
                                                                    <p><span className="font-medium text-slate-800">Refresh token:</span> {account.oauth_refresh_token ? 'Stored' : 'Missing'}</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p><span className="font-medium text-slate-800">Service account:</span> {clientEmail || 'Hidden / unavailable'}</p>
                                                                    <p><span className="font-medium text-slate-800">Impersonate email:</span> {account.subject_email || 'Not set'}</p>
                                                                </>
                                                            )}
                                                            <p><span className="font-medium text-slate-800">Usage count:</span> {account.usage_count ?? 0}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button type="button" onClick={() => handleEdit(account)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                                                            Edit
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(account.id, account.account_name)} className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600">
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
                                <h2 className="font-display text-2xl font-bold text-slate-900">Server Snapshot</h2>
                                <p className="mt-2 text-sm text-slate-600">Quick check that the admin API is returning server metadata needed by backups.</p>
                                <div className="mt-6 grid gap-4">
                                    {servers.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                                            No servers returned by the admin API.
                                        </div>
                                    ) : servers.map((server) => (
                                        <div key={server.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-lg font-semibold text-slate-900">{server.name}</h3>
                                                {server.is_primary ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Primary</span> : null}
                                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${server.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                    {server.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                                                <p><span className="font-medium text-slate-800">Hostname:</span> {server.hostname}</p>
                                                <p><span className="font-medium text-slate-800">DB host:</span> {server.db_host || 'localhost'}</p>
                                                <p><span className="font-medium text-slate-800">Tenants:</span> {server.tenant_count ?? 0}</p>
                                                <p><span className="font-medium text-slate-800">Running processes:</span> {server.running_count ?? 0}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
