const PageLoader = () => (
    <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <p className="text-gray-500 text-sm font-medium animate-pulse">Loading...</p>
        </div>
    </div>
);

export default PageLoader;
