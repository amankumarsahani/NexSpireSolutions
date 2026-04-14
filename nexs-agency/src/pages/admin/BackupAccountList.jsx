export default function BackupAccountList({ accounts, pageLoading, onEdit, onDelete, onRefresh }) {
    return (
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-2xl font-bold text-slate-900">Configured Accounts</h2>
                    <p className="mt-2 text-sm text-slate-600">Create, edit, or delete backup accounts from here.</p>
                </div>
                <button type="button" onClick={onRefresh} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
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
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${authType === 'oauth_personal' ? 'bg-[#2563EB]/10 text-[#2563EB]' : 'bg-purple-100 text-purple-700'}`}>
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
                                    <button type="button" onClick={() => onEdit(account)} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                                        Edit
                                    </button>
                                    <button type="button" onClick={() => onDelete(account.id, account.account_name)} className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
