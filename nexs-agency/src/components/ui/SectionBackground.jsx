export default function SectionBackground({ gridId }) {
    return (
        <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/3 via-transparent to-cyan-500/3"></div>

            <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/12 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/10 to-violet-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>

            {gridId && (
                <div className="absolute inset-0 opacity-5">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <defs>
                            <pattern id={gridId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="10" cy="10" r="1" fill="currentColor" />
                                <path d="M10 0v20M0 10h20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill={`url(#${gridId})`} className="text-indigo-400" />
                    </svg>
                </div>
            )}
        </div>
    );
}
