import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogAPI } from '../services/api'

function Blog() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [isVisible, setIsVisible] = useState(false)
  const [blogPosts, setBlogPosts] = useState([])
  const [loading, setLoading] = useState(true)

  // Dummy/fallback blog posts when API returns empty or fails
  const dummyPosts = [
    {
      title: "Mobile App Development: Native vs Cross-Platform in 2024",
      category: "Mobile Development",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop",
      description: "A comprehensive comparison of native and cross-platform development approaches to help you make the right choice.",
      tags: ["React Native", "Flutter", "iOS", "Android"],
      author: "Anu Kumar",
      date: "March 12, 2025",
      readTime: "7 min read",
      color: "from-purple-500 to-pink-500",
      slug: "mobile-app-development-native-vs-cross-platform"
    },
    {
      title: "UI/UX Design Principles for Modern Web Applications",
      category: "Design",
      image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=250&fit=crop",
      description: "Discover essential design principles that create intuitive and engaging user experiences in modern web applications.",
      tags: ["UX Design", "UI Design", "Figma", "Prototyping"],
      author: "Anu Kumar",
      date: "March 8, 2025",
      readTime: "6 min read",
      color: "from-orange-500 to-red-500",
      slug: "ui-ux-design-principles"
    },
    {
      title: "Cybersecurity Best Practices for Web Applications",
      category: "Security",
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop",
      description: "Essential security measures every developer should implement to protect web applications from common vulnerabilities.",
      tags: ["Security", "OWASP", "Authentication", "Encryption"],
      author: "Anu Kumar",
      date: "March 5, 2025",
      readTime: "9 min read",
      color: "from-red-500 to-pink-500",
      slug: "cybersecurity-best-practices"
    }
  ]

  useEffect(() => {
    setIsVisible(true)
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await blogAPI.getAll({ status: 'published', limit: 6 })
      const blogs = response.data?.blogs || []

      if (blogs.length > 0) {
        // Transform API data to match component format
        const transformedPosts = blogs.map((blog, index) => {
          const colors = [
            "from-blue-500 to-cyan-500",
            "from-purple-500 to-pink-500",
            "from-green-500 to-emerald-500",
            "from-orange-500 to-red-500",
            "from-indigo-500 to-purple-500",
            "from-red-500 to-pink-500"
          ]
          return {
            title: blog.title,
            category: blog.category || "Technology",
            image: blog.image || `https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=250&fit=crop`,
            description: blog.excerpt || blog.title,
            tags: blog.category ? [blog.category] : ["Technology"],
            author: blog.author || "Nexspire Team",
            date: new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            readTime: blog.read_time || "5 min read",
            color: colors[index % colors.length],
            slug: blog.slug
          }
        })
        setBlogPosts(transformedPosts)
      } else {
        // Use dummy posts if API returns empty
        setBlogPosts(dummyPosts)
      }
    } catch (error) {
      console.error('Error fetching blogs:', error)
      // Use dummy posts on error
      setBlogPosts(dummyPosts)
    } finally {
      setLoading(false)
    }
  }

  const categories = ["All", "Web Development", "Mobile Development", "Cloud & DevOps", "Design", "Security", "AI & Technology"]

  const filteredPosts = activeCategory === "All"
    ? blogPosts
    : blogPosts.filter(post => post.category === activeCategory)

  return (
    <section id="blog" className="relative py-20 bg-gradient-to-br from-gray-50 via-slate-50 to-indigo-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/3 via-transparent to-cyan-500/3"></div>

        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/15 to-cyan-200/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/12 to-pink-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-indigo-200/10 to-violet-200/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className={`text-center mb-16 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 backdrop-blur-xl border border-white/20 text-gray-800 text-sm font-bold px-8 py-4 rounded-full mb-8 shadow-2xl hover:shadow-emerald-500/20 transition-all duration-500">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mr-3 animate-pulse shadow-lg"></div>
            Latest Insights
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
            <span className="block text-gray-800 font-bold">Insights &</span>
            <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mt-2 font-bold">
              Tech Articles
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with expert insights, cutting-edge trends, and practical tips from our development team
          </p>
        </div>

        {/* Modern Filter Buttons */}
        <div className={`flex flex-wrap justify-center gap-3 mb-16 transition-all duration-1000 delay-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap backdrop-blur-sm border ${activeCategory === category
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-400/50'
                : 'bg-white/60 text-gray-700 hover:bg-white/80 border-white/30 hover:shadow-lg'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Premium Blog Grid */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          {filteredPosts.map((post, index) => {
            const delays = ['delay-0', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'];

            return (
              <article key={index} className={`group relative ${delays[index % delays.length]}`}>
                {/* Floating Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${post.color} rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-700`}></div>

                {/* Main Card Container */}
                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/40 group-hover:shadow-3xl transition-all duration-500 transform group-hover:-translate-y-3 group-hover:scale-[1.02] h-[600px] flex flex-col">

                  {/* Image Section */}
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                    />

                    {/* Dynamic Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${post.color.replace('from-', 'from-').replace('to-', 'to-')}/20 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>

                    {/* Floating Category Badge */}
                    <div className="absolute top-4 left-4 transform group-hover:-translate-y-1 transition-transform duration-300">
                      <span
                        className="text-xs font-bold text-white px-4 py-2 rounded-full backdrop-blur-lg border border-white/30 shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${post.color.replace('from-', '').replace('to-', '').split(' ')[0]}, ${post.color.replace('from-', '').replace('to-', '').split(' ')[1]})`
                        }}
                      >
                        {post.category}
                      </span>
                    </div>

                    {/* Read Time with Icon */}
                    <div className="absolute top-4 right-4 transform group-hover:-translate-y-1 transition-transform duration-300">
                      <span className="text-xs bg-black/70 text-white px-3 py-2 rounded-full backdrop-blur-sm border border-white/20 flex items-center">
                        <i className="ri-time-line mr-1"></i>
                        {post.readTime}
                      </span>
                    </div>

                    {/* Hover Action Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Link to={`/blog/${post.slug}`} className="bg-white/20 backdrop-blur-lg text-white px-6 py-3 rounded-2xl font-semibold border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                        <i className="ri-arrow-right-line mr-2"></i>
                        Read Article
                      </Link>
                    </div>
                  </div>

                  {/* Enhanced Content Section */}
                  <div className="p-7 flex-1 flex flex-col">
                    {/* Article Title */}
                    <h3 className="text-xl font-bold mb-4 line-clamp-2 text-gray-900 leading-tight group-hover:text-gray-800 transition-colors duration-300">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 mb-5 leading-relaxed text-sm line-clamp-3 flex-1">
                      {post.description}
                    </p>

                    {/* Enhanced Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {post.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-gray-50 text-gray-700 px-3 py-2 rounded-xl border border-gray-200/60 hover:bg-gray-100 transition-colors duration-200 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs bg-gray-50 text-gray-500 px-3 py-2 rounded-xl border border-gray-200/60">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Enhanced Author Section */}
                    <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-auto">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${post.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-sm font-bold text-white">{post.author.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{post.author}</div>
                          <div className="text-gray-500 text-xs flex items-center">
                            <i className="ri-calendar-line mr-1"></i>
                            {post.date}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Read More */}
                      <div className="flex items-center space-x-2">
                        <button className="group/like w-9 h-9 rounded-xl bg-gray-50 hover:bg-red-50 flex items-center justify-center transition-all duration-300 hover:scale-110">
                          <i className="ri-heart-line text-gray-400 group-hover/like:text-red-500 transition-colors"></i>
                        </button>
                        <button className="group/share w-9 h-9 rounded-xl bg-gray-50 hover:bg-blue-50 flex items-center justify-center transition-all duration-300 hover:scale-110">
                          <i className="ri-share-line text-gray-400 group-hover/share:text-blue-500 transition-colors"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Animated Bottom Border */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent">
                    <div
                      className="h-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-x-0 group-hover:scale-x-100"
                      style={{
                        background: `linear-gradient(90deg, ${post.color.replace('from-', '').replace('to-', '').split(' ')[0]}, ${post.color.replace('from-', '').replace('to-', '').split(' ')[1]})`
                      }}
                    ></div>
                  </div>

                  {/* Corner Accent */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${post.color} opacity-5 group-hover:opacity-20 transition-opacity duration-500`}></div>
                </div>
              </article>
            )
          })}
        </div>

        {/* View All Button */}
        <div className={`text-center mb-16 transition-all duration-1000 delay-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <button className="group relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <span className="relative z-10 flex items-center">
              View All Articles
              <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Glass Newsletter Banner */}
        <div className={`transition-all duration-1000 delay-900 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}>
          <div className="relative overflow-hidden">
            {/* Enhanced Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-[3rem] blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute -inset-6 bg-gradient-to-r from-purple-600/15 to-cyan-600/15 rounded-[4rem] blur-2xl animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>

            {/* Ultra Glass Container */}
            <div className="relative bg-gradient-to-br from-blue-600/85 via-indigo-600/80 to-purple-700/90 backdrop-blur-2xl backdrop-saturate-150 backdrop-brightness-110 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-white/2 before:rounded-3xl">

              {/* Complex Background Texture */}
              <div className="absolute inset-0">
                {/* Gradient Mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-purple-600/30"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/20 via-transparent to-cyan-500/20"></div>

                {/* Noise Texture Pattern */}
                <div className="absolute inset-0 opacity-[0.15]">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="noise-texture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="3" cy="5" r="0.5" fill="currentColor" opacity="0.4" />
                        <circle cx="8" cy="2" r="0.3" fill="currentColor" opacity="0.6" />
                        <circle cx="15" cy="8" r="0.4" fill="currentColor" opacity="0.3" />
                        <circle cx="12" cy="15" r="0.2" fill="currentColor" opacity="0.5" />
                        <circle cx="18" cy="12" r="0.3" fill="currentColor" opacity="0.4" />
                        <circle cx="5" cy="18" r="0.4" fill="currentColor" opacity="0.3" />
                        <circle cx="1" cy="12" r="0.2" fill="currentColor" opacity="0.5" />
                        <circle cx="10" cy="7" r="0.3" fill="currentColor" opacity="0.4" />
                        <path d="M2 1l16 16M18 3L4 17" stroke="currentColor" strokeWidth="0.1" opacity="0.2" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#noise-texture)" className="text-white" />
                  </svg>
                </div>

                {/* Geometric Grid */}
                <div className="absolute inset-0 opacity-[0.08]">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
                    <defs>
                      <pattern id="geometric-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                        <circle cx="30" cy="30" r="2" fill="currentColor" opacity="0.4" />
                        <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.3" />
                        <circle cx="45" cy="45" r="1" fill="currentColor" opacity="0.3" />
                        <circle cx="45" cy="15" r="1" fill="currentColor" opacity="0.2" />
                        <circle cx="15" cy="45" r="1" fill="currentColor" opacity="0.2" />
                        <path d="M30 0v60M0 30h60M15 15l30 30M45 15L15 45" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
                        <rect x="14" y="14" width="2" height="2" fill="currentColor" opacity="0.1" />
                        <rect x="44" y="44" width="2" height="2" fill="currentColor" opacity="0.1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#geometric-grid)" className="text-white" />
                  </svg>
                </div>

                {/* Animated Wave Overlay */}
                <div className="absolute inset-0 opacity-[0.06]">
                  <svg className="w-full h-full animate-pulse" style={{ animationDuration: '8s' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
                    <defs>
                      <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path d="M0,100 Q100,50 200,100 T400,100 L400,200 L0,200 Z" fill="url(#wave-gradient)" className="text-white" />
                    <path d="M0,120 Q100,80 200,120 T400,120 L400,200 L0,200 Z" fill="url(#wave-gradient)" className="text-white" opacity="0.5" />
                  </svg>
                </div>
              </div>

              {/* Enhanced Floating Elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-white/40 rounded-full animate-pulse shadow-lg"></div>
              <div className="absolute bottom-6 left-6 w-1 h-1 bg-white/30 rounded-full animate-ping shadow-sm"></div>
              <div className="absolute top-8 left-1/3 w-1.5 h-1.5 bg-white/35 rounded-full animate-bounce shadow-md" style={{ animationDelay: '2s', animationDuration: '4s' }}></div>
              <div className="absolute bottom-4 right-1/3 w-1 h-1 bg-cyan-300/30 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }}></div>
              <div className="absolute top-1/2 right-8 w-0.5 h-0.5 bg-purple-300/40 rounded-full animate-ping" style={{ animationDelay: '3s' }}></div>

              <div className="relative z-10 max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                  {/* Left Content */}
                  <div className="text-center lg:text-left lg:flex-1">
                    <div className="flex items-center justify-center lg:justify-start mb-4 group">
                      <div className="w-14 h-14 bg-white/15 backdrop-blur-2xl backdrop-saturate-200 rounded-2xl flex items-center justify-center mr-4 border border-white/40 shadow-lg shadow-white/10 group-hover:scale-110 group-hover:bg-white/25 group-hover:shadow-xl group-hover:shadow-white/20 transition-all duration-500">
                        <i className="ri-mail-line text-2xl text-white group-hover:animate-pulse drop-shadow-sm"></i>
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                          Stay In The Loop
                        </h3>
                        <p className="text-white/90 text-sm drop-shadow-md">
                          Weekly insights & updates
                        </p>
                      </div>
                    </div>
                    <p className="text-white/85 text-lg leading-relaxed max-w-md mx-auto lg:mx-0 drop-shadow-md">
                      Get the latest tech trends, development tips, and industry insights delivered to your inbox every week.
                    </p>
                  </div>

                  {/* Right Form */}
                  <div className="lg:flex-1 w-full max-w-lg">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1 group">
                        <input
                          type="email"
                          placeholder="Enter your email address"
                          className="w-full px-4 py-3 rounded-2xl text-gray-900 placeholder-gray-400 bg-white/80 backdrop-blur-3xl backdrop-saturate-150 border border-white/50 shadow-lg shadow-black/5 focus:outline-none focus:ring-2 focus:ring-white/70 focus:bg-white/90 focus:border-white/70 focus:shadow-xl transition-all duration-500 group-hover:bg-white/85"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      </div>
                      <button className="group relative bg-white/85 backdrop-blur-3xl backdrop-saturate-150 text-blue-600 px-6 py-3 rounded-2xl font-semibold border border-white/50 shadow-lg shadow-black/5 hover:bg-white/95 hover:border-white/70 hover:shadow-xl hover:scale-105 transition-all duration-500 whitespace-nowrap overflow-hidden">
                        <span className="relative z-10 flex items-center">
                          Subscribe Free
                          <i className="ri-arrow-right-line ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/30 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </button>
                    </div>

                    {/* Trust Line */}
                    <div className="flex items-center justify-center sm:justify-start mt-4 text-white/80 text-sm">
                      <i className="ri-shield-check-line mr-2 animate-pulse drop-shadow-sm"></i>
                      <span className="hover:text-white transition-colors duration-300 drop-shadow-sm">
                        No spam • Unsubscribe anytime • 10,000+ subscribers
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Enhanced Glass Highlights */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
              <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

              {/* Inner Glass Reflection */}
              <div className="absolute inset-2 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Blog