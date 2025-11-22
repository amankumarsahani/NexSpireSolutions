function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your project. All plans include our standard features with no hidden fees.
          </p>
          <div className="flex items-center justify-center mb-8">
            <span className="mr-3 text-gray-900 font-medium">Project-based</span>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors cursor-pointer">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
            </button>
            <span className="ml-3 text-gray-500">Retainer (Save 20%)</span>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">Perfect for small businesses and startups</p>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$2,999</span>
                  <span className="text-gray-500 ml-2">per project</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">2-3 weeks delivery</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Custom Website Design
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Up to 5 Pages
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Responsive Design
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Basic SEO Setup
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Contact Form Integration
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>3 Months Support
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>SSL Certificate
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Google Analytics Setup
                </li>
              </ul>
              <a
                className="w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap text-center block bg-gray-100 text-gray-900 hover:bg-gray-200"
                href="#contact"
              >
                Get Started
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg ring-2 ring-blue-600 relative hover:shadow-xl transition-shadow">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Professional</h3>
              <p className="text-gray-600 mb-6">Ideal for growing businesses with advanced needs</p>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$5,999</span>
                  <span className="text-gray-500 ml-2">per project</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">4-6 weeks delivery</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Custom Web Application
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Up to 15 Pages/Screens
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Advanced UI/UX Design
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Database Integration
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>User Authentication
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Admin Dashboard
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>6 Months Support
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>SEO Optimization
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Performance Optimization
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Social Media Integration
                </li>
              </ul>
              <a
                className="w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap text-center block bg-blue-600 text-white hover:bg-blue-700"
                href="#contact"
              >
                Most Popular
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">Comprehensive solution for large organizations</p>
              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">$12,999</span>
                  <span className="text-gray-500 ml-2">per project</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">8-12 weeks delivery</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Custom Software Solution
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Unlimited Pages/Features
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Advanced Architecture
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Third-party Integrations
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Advanced Security
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Cloud Infrastructure
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>12 Months Support
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Priority Support
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Performance Monitoring
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Team Training
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Documentation
                </li>
                <li className="flex items-center text-gray-700">
                  <i className="ri-check-line text-green-500 mr-3"></i>Dedicated Project Manager
                </li>
              </ul>
              <a
                className="w-full py-3 px-6 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap text-center block bg-gray-100 text-gray-900 hover:bg-gray-200"
                href="#contact"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Additional Services
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-semibold text-gray-900">Mobile App Development</h4>
                <p className="text-gray-600 text-sm">iOS and Android apps</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">$8,999</div>
                <div className="text-xs text-gray-500">starting at</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-semibold text-gray-900">E-commerce Solution</h4>
                <p className="text-gray-600 text-sm">Online store with payment integration</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">$4,999</div>
                <div className="text-xs text-gray-500">starting at</div>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <h4 className="font-semibold text-gray-900">API Development</h4>
                <p className="text-gray-600 text-sm">Custom REST/GraphQL APIs</p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">$2,999</div>
                <div className="text-xs text-gray-500">starting at</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Need a Custom Quote?</h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Every project is unique. Contact us for a detailed quote tailored to your specific requirements and budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              href="#contact"
            >
              Get Custom Quote
            </a>
            <a
              href="tel:+15551234567"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Call for Consultation
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Pricing