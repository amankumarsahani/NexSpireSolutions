export default function ServerSnapshot({ servers }) {
    return (
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
                            {server.is_primary ? <span className="rounded-full bg-[#0F766E]/10 px-3 py-1 text-xs font-semibold text-[#0F766E]">Primary</span> : null}
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
    );
}
