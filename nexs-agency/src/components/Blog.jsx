// TODO: Replace console.error with Sentry or proper error tracking
import { useState, useEffect, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { blogAPI } from '../services/api'
import { siteConfig } from '../constants/siteConfig'
import Icon from './ui/Icon';
import { RiArrowRightLine, RiCalendarLine, RiHeartLine, RiShareCircleLine, RiShareLine, RiTimeLine } from 'react-icons/ri';

const dummyPosts = [
  {
    title: "Mobile App Development: Native vs Cross-Platform in 2024",
    category: "Mobile Development",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&fm=webp",
    description: "A comprehensive comparison of native and cross-platform development approaches to help you make the right choice.",
    tags: ["React Native", "Flutter", "iOS", "Android"],
    author: "Anu Kumar",
    date: "March 12, 2025",
    readTime: "7 min read",
    color: "from-[#2563EB] to-[#1D4ED8]",
    slug: "mobile-app-development-native-vs-cross-platform"
  },
  {
    title: "UI/UX Design Principles for Modern Web Applications",
    category: "Design",
    image: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400&h=250&fit=crop&fm=webp",
    description: "Discover essential design principles that create intuitive and engaging user experiences in modern web applications.",
    tags: ["UX Design", "UI Design", "Figma", "Prototyping"],
    author: "Anu Kumar",
    date: "March 8, 2025",
    readTime: "6 min read",
    color: "from-orange-500 to-orange-600",
    slug: "ui-ux-design-principles"
  },
  {
    title: "Cybersecurity Best Practices for Web Applications",
    category: "Security",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=250&fit=crop&fm=webp",
    description: "Essential security measures every developer should implement to protect web applications from common vulnerabilities.",
    tags: ["Security", "OWASP", "Authentication", "Encryption"],
    author: "Anu Kumar",
    date: "March 5, 2025",
    readTime: "9 min read",
    color: "from-red-500 to-red-600",
    slug: "cybersecurity-best-practices"
  }
]

const categories = ["All", "Web Development", "Mobile Development", "Cloud & DevOps", "Design", "Security", "AI & Technology"]

const Blog = memo(function Blog() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [blogPosts, setBlogPosts] = useState([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchBlogs = async () => {
      try {
        setLoading(true)
        const response = await blogAPI.getAll({ status: 'published', limit: 3 })
        if (cancelled) return
        const blogs = response.data?.blogs || []

        if (blogs.length > 0) {
          const colors = [
            "from-[#2563EB] to-[#1D4ED8]",
            "from-[#2563EB] to-[#1D4ED8]",
            "from-emerald-500 to-emerald-600",
            "from-orange-500 to-orange-600",
            "from-[#2563EB] to-[#1D4ED8]",
            "from-red-500 to-red-600"
          ]
          const transformedPosts = blogs.map((blog, index) => ({
            title: blog.title,
            category: blog.category || "Technology",
            image: blog.imageUrl || `https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=250&fit=crop&fm=webp`,
            description: blog.excerpt || blog.title,
            tags: blog.category ? [blog.category] : ["Technology"],
            author: blog.author || "Nexspire Team",
            date: new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            readTime: blog.readTime || "5 min read",
            color: colors[index % colors.length],
            slug: blog.slug
          }))
          setBlogPosts(transformedPosts)
        } else {
          setBlogPosts(dummyPosts)
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error fetching blogs:', error)
        setBlogPosts(dummyPosts)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBlogs()
    return () => { cancelled = true }
  }, [])

  const filteredPosts = useMemo(() => activeCategory === "All"
    ? blogPosts
    : blogPosts.filter(post => post.category === activeCategory), [blogPosts, activeCategory])

  return (
    <section id="blog" className="relative py-20 bg-slate-50 overflow-hidden">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Header */}
        <div className="text-center mb-16 transition-all duration-1000 transform translate-y-0 opacity-100">
          <div className="inline-flex items-center bg-[#6366F1]/10 backdrop-blur-xl border border-white/20 text-gray-800 text-sm font-bold px-8 py-4 rounded-full mb-8 shadow-2xl hover:shadow-lg transition-all duration-500">
            <div className="w-3 h-3 bg-[#6366F1] rounded-full mr-3 animate-pulse shadow-lg"></div>
            Latest Insights
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6 leading-tight tracking-tight">
            <span className="block text-gray-800 font-bold">Insights &</span>
            <span className="block text-[#2563EB] mt-2 font-bold">
              Tech Articles
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Stay ahead with expert insights, cutting-edge trends, and practical tips from our development team
          </p>
        </div>

        {/* Modern Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 transition-all duration-1000 delay-300 transform translate-y-0 opacity-100">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap backdrop-blur-sm border ${activeCategory === category
                ? 'bg-[#2563EB] text-white shadow-lg shadow-lg border-emerald-400/50'
                : 'bg-white/60 text-slate-600 hover:bg-white/80 border-white/30 hover:shadow-lg'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Premium Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 transition-all duration-1000 delay-500 transform translate-y-0 opacity-100">
          {filteredPosts.map((post, index) => {
            const delays = ['delay-0', 'delay-100', 'delay-200', 'delay-300', 'delay-400', 'delay-500'];

            return (
              <article key={post.slug || post.title || index} className={`group relative ${delays[index % delays.length]}`}>
                {/* Floating Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${post.color} rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-700`}></div>

                {/* Main Card Container */}
                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-white/40 group-hover:shadow-3xl transition-all duration-500 transform group-hover:-translate-y-3 group-hover:scale-[1.02] h-[600px] flex flex-col">

                  {/* Image Section */}
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group- transition-all duration-700"
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
                        <RiTimeLine className="mr-1" />
                        {post.readTime}
                      </span>
                    </div>

                    {/* Hover Action Button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <Link to={`/blog/${post.slug}`} className="bg-white/20 backdrop-blur-lg text-white px-6 py-3 rounded-2xl font-semibold border border-white/30 hover:bg-white/30 transition-all duration-300 transform ">
                        <RiArrowRightLine className="mr-2" />
                        Read Article
                      </Link>
                    </div>
                  </div>

                  {/* Enhanced Content Section */}
                  <div className="p-7 flex-1 flex flex-col">
                    {/* Article Title */}
                    <h3 className="text-xl font-bold mb-4 line-clamp-2 text-slate-800 leading-tight group-hover:text-gray-800 transition-colors duration-300">
                      {post.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-600 mb-5 leading-relaxed text-sm line-clamp-3 flex-1">
                      {post.description}
                    </p>

                    {/* Enhanced Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {post.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-[#F8FAFC] text-slate-600 px-3 py-2 rounded-xl border border-slate-200/60 hover:bg-gray-100 transition-colors duration-200 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-xs bg-[#F8FAFC] text-slate-500 px-3 py-2 rounded-xl border border-slate-200/60">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Enhanced Author Section */}
                    <div className="flex items-center justify-between pt-5 border-t border-slate-200 mt-auto">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-r ${post.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-sm font-bold text-white">{post.author.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-sm">{post.author}</div>
                          <div className="text-slate-500 text-xs flex items-center">
                            <RiCalendarLine className="mr-1" />
                            {post.date}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Read More */}
                      <div className="flex items-center space-x-2">
                        <button className="group/like w-9 h-9 rounded-xl bg-[#F8FAFC] hover:bg-red-50 flex items-center justify-center transition-all duration-300 ">
                          <RiHeartLine className="text-slate-400 group-hover/like:text-red-500 transition-colors" />
                        </button>
                        <button className="group/share w-9 h-9 rounded-xl bg-[#F8FAFC] hover:bg-[#F8FAFC] flex items-center justify-center transition-all duration-300 ">
                          <RiShareLine className="text-slate-400 group-hover/share:text-[#2563EB] transition-colors" />
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
        <div className="text-center mb-16 transition-all duration-1000 delay-700 transform translate-y-0 opacity-100">
          <Link to="/blog" className="group relative bg-[#2563EB] text-white px-10 py-4 rounded-2xl font-bold shadow-2xl shadow-lg hover:shadow-lg transition-all duration-300 transform  overflow-hidden inline-block">
            <span className="relative z-10 flex items-center">
              View All Articles
              <RiArrowRightLine className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
            <div className="absolute inset-0 bg-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        {/* Social Media CTA Banner */}
        <div className="transition-all duration-1000 delay-900 transform translate-y-0 opacity-100">
          <div className="relative overflow-hidden">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 rounded-[3rem] blur-3xl animate-pulse [animation-duration:4s]"></div>

            <div className="relative bg-[#2563EB] backdrop-blur-2xl backdrop-saturate-150 backdrop-brightness-110 rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:via-transparent before:to-white/2 before:rounded-3xl">

              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-transparent to-purple-600/30"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/20 via-transparent to-cyan-500/20"></div>
              </div>

              <div className="relative z-10 max-w-4xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">

                  <div className="text-center lg:text-left lg:flex-1">
                    <div className="flex items-center justify-center lg:justify-start mb-4 group">
                      <div className="w-14 h-14 bg-white/15 backdrop-blur-2xl backdrop-saturate-200 rounded-2xl flex items-center justify-center mr-4 border border-white/40 shadow-lg shadow-white/10 group- group-hover:bg-white/25 transition-all duration-500">
                        <RiShareCircleLine className="text-2xl text-white drop-shadow-sm" />
                      </div>
                      <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                          Stay In The Loop
                        </h3>
                        <p className="text-white/90 text-sm drop-shadow-md">
                          Follow us on social media
                        </p>
                      </div>
                    </div>
                    <p className="text-white/85 text-lg leading-relaxed max-w-md mx-auto lg:mx-0 drop-shadow-md">
                      Get the latest tech trends, development tips, and industry insights by following us on your favorite platform.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {siteConfig.social.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-white/15 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/30 shadow-lg hover:bg-white/30  transition-all duration-300"
                      >
                        <Icon name={social.icon} className="text-2xl text-white" />
                      </a>
                    ))}
                  </div>

                </div>
              </div>

              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default Blog