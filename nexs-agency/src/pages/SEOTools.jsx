import { useState, useEffect } from 'react';
import { seoAPI } from '../services/seoAPI';
import { clientAPI } from '../services/api';

export default function SEOTools() {
    const [url, setUrl] = useState('');
    const [clientId, setClientId] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [currentReport, setCurrentReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [activeTab, setActiveTab] = useState('analyze');

    // Load clients and reports on mount
    useEffect(() => {
        loadClients();
        loadReports();
    }, []);

    const loadClients = async () => {
        try {
            const response = await clientAPI.getAll();
            setClients(response.data.clients || []);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const loadReports = async () => {
        setLoading(true);
        try {
            const response = await seoAPI.getAllReports();
            setReports(response.data.data || []);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (e) => {
        e.preventDefault();

        if (!url) {
            alert('Please enter a URL');
            return;
        }

        setAnalyzing(true);
        setCurrentReport(null);

        try {
            const response = await seoAPI.analyze(url, clientId || null);
            setCurrentReport(response.data.data);
            setActiveTab('results');
            loadReports(); // Refresh reports list
            alert('SEO Analysis completed successfully!');
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Failed to analyze website: ' + (error.response?.data?.message || error.message));
        } finally {
            setAnalyzing(false);
        }
    };

    const handleViewReport = async (reportId) => {
        try {
            const response = await seoAPI.getReport(reportId);
            setCurrentReport(response.data.data);
            setActiveTab('results');
        } catch (error) {
            console.error('Error loading report:', error);
            alert('Failed to load report');
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?')) {
            return;
        }

        try {
            await seoAPI.deleteReport(reportId);
            alert('Report deleted successfully');
            loadReports();
            if (currentReport?.id === reportId) {
                setCurrentReport(null);
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getScoreBadge = (score) => {
        if (score >= 80) return { text: 'Excellent', color: 'bg-green-500' };
        if (score >= 60) return { text: 'Good', color: 'bg-yellow-500' };
        if (score >= 40) return { text: 'Needs Work', color: 'bg-orange-500' };
        return { text: 'Poor', color: 'bg-red-500' };
    };

    const categorizeIssues = (issues) => {
        return {
            critical: issues.filter(i => i.type === 'critical'),
            warning: issues.filter(i => i.type === 'warning'),
            info: issues.filter(i => i.type === 'info')
        };
    };

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">SEO Analysis Tool</h1>
                <p className="text-gray-600">Analyze website on-page SEO and get actionable recommendations</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('analyze')}
                        className={`pb-3 px-2 border-b-2 font-medium transition-colors ${activeTab === 'analyze'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <i className="ri-search-line mr-2"></i>
                        New Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 px-2 border-b-2 font-medium transition-colors ${activeTab === 'history'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <i className="ri-history-line mr-2"></i>
                        Audit History
                    </button>
                    {currentReport && (
                        <button
                            onClick={() => setActiveTab('results')}
                            className={`pb-3 px-2 border-b-2 font-medium transition-colors ${activeTab === 'results'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <i className="ri-file-chart-line mr-2"></i>
                            Results
                        </button>
                    )}
                </nav>
            </div>

            {/* Analyze Tab */}
            {activeTab === 'analyze' && (
                <div className="max-w-3xl">
                    <div className="bg-white rounded-xl shadow-sm p-6 border">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <i className="ri-global-line text-blue-600"></i>
                            Analyze Website
                        </h3>

                        <form onSubmit={handleAnalyze} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Website URL *
                                </label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                    disabled={analyzing}
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Enter the full URL including https://
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Link to Client (Optional)
                                </label>
                                <select
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    disabled={analyzing}
                                >
                                    <option value="">-- No Client --</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.companyName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={analyzing}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <i className="ri-search-2-line"></i>
                                        Run SEO Analysis
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div>
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <i className="ri-folder-history-line text-purple-600"></i>
                                Audit History ({reports.length})
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                                <p className="mt-4 text-gray-600">Loading reports...</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <i className="ri-file-list-2-line text-6xl mb-4 text-gray-300"></i>
                                <p>No SEO audits yet</p>
                                <p className="text-sm">Run your first analysis to get started</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {reports.map(report => (
                                    <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-lg text-gray-800">
                                                        {report.url}
                                                    </h4>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(report.seo_score)}`}>
                                                        Score: {report.seo_score}/100
                                                    </span>
                                                </div>

                                                {report.client_name && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <i className="ri-building-line mr-1"></i>
                                                        Client: {report.client_name}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span>
                                                        <i className="ri-calendar-line mr-1"></i>
                                                        {new Date(report.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span>
                                                        <i className="ri-error-warning-line mr-1"></i>
                                                        {report.issues?.length || 0} issues
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleViewReport(report.id)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                                >
                                                    <i className="ri-eye-line mr-1"></i>
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReport(report.id)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                                                >
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && currentReport && (
                <div className="space-y-6">
                    {/* Score Overview */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                    {currentReport.url}
                                </h3>
                                <p className="text-gray-600">
                                    Analyzed on {new Date(currentReport.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div className="text-center">
                                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreColor(currentReport.seo_score)} border-8`}>
                                    <div>
                                        <div className="text-4xl font-bold">{currentReport.seo_score}</div>
                                        <div className="text-sm font-medium">/ 100</div>
                                    </div>
                                </div>
                                <div className={`mt-3 inline-block px-4 py-1 rounded-full text-white text-sm font-medium ${getScoreBadge(currentReport.seo_score).color}`}>
                                    {getScoreBadge(currentReport.seo_score).text}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow-sm p-4 border">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <i className="ri-file-text-line text-2xl text-blue-600"></i>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Title</p>
                                    <p className="text-lg font-bold">{currentReport.title_length} chars</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4 border">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <i className="ri-h-1 text-2xl text-green-600"></i>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">H1 Tags</p>
                                    <p className="text-lg font-bold">{currentReport.h1_count}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4 border">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <i className="ri-image-line text-2xl text-purple-600"></i>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Images</p>
                                    <p className="text-lg font-bold">{currentReport.total_images}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4 border">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-3 rounded-lg">
                                    <i className="ri-link-m text-2xl text-orange-600"></i>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Links</p>
                                    <p className="text-lg font-bold">{currentReport.internal_links + currentReport.external_links}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Issues */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <i className="ri-error-warning-line text-red-600"></i>
                                Issues Found ({currentReport.issues?.length || 0})
                            </h3>
                        </div>

                        {currentReport.issues && currentReport.issues.length > 0 ? (
                            <div className="p-6 space-y-3">
                                {categorizeIssues(currentReport.issues).critical.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                                            <i className="ri-alert-line"></i>
                                            Critical Issues ({categorizeIssues(currentReport.issues).critical.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {categorizeIssues(currentReport.issues).critical.map((issue, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-red-50 p-3 rounded-lg border border-red-200">
                                                    <i className="ri-close-circle-line text-red-600 text-xl mt-0.5"></i>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{issue.message}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">Category:</span> {issue.category} •
                                                            <span className="font-medium"> Impact:</span> {issue.impact}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {categorizeIssues(currentReport.issues).warning.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-yellow-600 mb-2 flex items-center gap-2">
                                            <i className="ri-error-warning-line"></i>
                                            Warnings ({categorizeIssues(currentReport.issues).warning.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {categorizeIssues(currentReport.issues).warning.map((issue, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                    <i className="ri-error-warning-line text-yellow-600 text-xl mt-0.5"></i>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{issue.message}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">Category:</span> {issue.category} •
                                                            <span className="font-medium"> Impact:</span> {issue.impact}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {categorizeIssues(currentReport.issues).info.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
                                            <i className="ri-information-line"></i>
                                            Info ({categorizeIssues(currentReport.issues).info.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {categorizeIssues(currentReport.issues).info.map((issue, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                                    <i className="ri-information-line text-blue-600 text-xl mt-0.5"></i>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{issue.message}</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            <span className="font-medium">Category:</span> {issue.category} •
                                                            <span className="font-medium"> Impact:</span> {issue.impact}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-green-600">
                                <i className="ri-checkbox-circle-line text-6xl mb-4"></i>
                                <p className="font-medium">No issues found! Perfect SEO!</p>
                            </div>
                        )}
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-xl shadow-sm border">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <i className="ri-lightbulb-line text-yellow-500"></i>
                                Recommendations ({currentReport.recommendations?.length || 0})
                            </h3>
                        </div>

                        {currentReport.recommendations && currentReport.recommendations.length > 0 ? (
                            <div className="p-6 space-y-4">
                                {currentReport.recommendations.map((rec, idx) => (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border">
                                        <div className="flex items-start gap-3">
                                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${rec.priority === 'high' ? 'bg-red-500' :
                                                    rec.priority === 'medium' ? 'bg-yellow-500' :
                                                        'bg-blue-500'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-semibold text-gray-800">{rec.action}</h4>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {rec.priority.toUpperCase()} PRIORITY
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">Category:</span> {rec.category}
                                                </p>
                                                {rec.example && (
                                                    <div className="bg-white p-3 rounded border mt-2">
                                                        <p className="text-xs text-gray-500 mb-1">Example:</p>
                                                        <code className="text-sm text-gray-800">{rec.example}</code>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <p>No specific recommendations at this time</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
