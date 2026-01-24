export default function AuthorBio({
    name,
    role = 'Author',
    bio = '',
    avatar = null,
    linkedin = '',
    twitter = ''
}) {
    const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={name}
                            className="w-20 h-20 rounded-2xl object-cover shadow-lg"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {initials}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">Written by</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
                    <p className="text-sm text-gray-500 font-medium mb-3">{role}</p>
                    {bio && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{bio}</p>
                    )}

                    {/* Social Links */}
                    <div className="flex items-center gap-3">
                        {linkedin && (
                            <a
                                href={linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#0077B5] hover:border-[#0077B5] transition-all"
                            >
                                <i className="ri-linkedin-fill text-lg"></i>
                            </a>
                        )}
                        {twitter && (
                            <a
                                href={twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black hover:border-black transition-all"
                            >
                                <i className="ri-twitter-x-fill text-lg"></i>
                            </a>
                        )}
                        <a
                            href={`mailto:hello@nexspiresolutions.co.in`}
                            className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-600 transition-all"
                        >
                            <i className="ri-mail-line text-lg"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
