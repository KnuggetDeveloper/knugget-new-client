'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowRight, 
  Youtube, 
  Linkedin, 
  Globe, 
  Twitter,
  Sparkles,
  Clock,
  Brain,
  Shield,
  Check,
  Star,
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/additional'

const features = [
  {
    icon: Youtube,
    title: "YouTube Summaries",
    description: "Get AI-powered summaries of any YouTube video in seconds",
    color: "text-red-500"
  },
  {
    icon: Linkedin,
    title: "LinkedIn Posts",
    description: "Save and organize important LinkedIn content with smart insights",
    color: "text-blue-500"
  },
  {
    icon: Globe,
    title: "Web Articles",
    description: "Extract key insights from any article or blog post",
    color: "text-green-500"
  },
  {
    icon: Twitter,
    title: "Social Content",
    description: "Capture and summarize content from across social platforms",
    color: "text-blue-400"
  }
]

const benefits = [
  {
    icon: Clock,
    title: "Save Time",
    description: "Get the essence of long-form content in minutes, not hours"
  },
  {
    icon: Brain,
    title: "AI-Powered",
    description: "Advanced AI extracts key insights and actionable takeaways"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is secure and never shared with third parties"
  }
]

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    content: "Knugget has transformed how I consume content. I can now stay up-to-date with industry trends without spending hours reading.",
    rating: 5
  },
  {
    name: "Marcus Johnson",
    role: "Content Creator",
    company: "Independent",
    content: "The YouTube summaries are incredibly accurate. It's like having a personal assistant that watches videos for me.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Research Lead",
    company: "Innovation Labs",
    content: "Perfect for research. I can quickly extract insights from dozens of articles and organize them efficiently.",
    rating: 5
  }
]

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "10 AI summaries per month",
      "Chrome extension access",
      "Basic transcript viewing",
      "Community support"
    ],
    cta: "Get Started Free",
    popular: false
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "per month",
    features: [
      "Unlimited AI summaries",
      "Advanced summarization",
      "Export to multiple formats",
      "Search and organize summaries",
      "Priority support",
      "Early access to new features"
    ],
    cta: "Start Free Trial",
    popular: true
  }
]

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/')
    } else {
      router.push('/signup')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-950/95 backdrop-blur-md border-b border-gray-800' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg knugget-gradient flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold">Knugget AI</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="#testimonials" className="text-gray-300 hover:text-white transition-colors">
                Reviews
              </Link>
              {isAuthenticated ? (
                <Button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-600">
                  Go to Dashboard
                </Button>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                    Sign In
                  </Link>
                  <Button onClick={handleGetStarted} className="bg-orange-500 hover:bg-orange-600">
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              <div className="space-y-4">
                <Link 
                  href="#features" 
                  className="block text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link 
                  href="#pricing" 
                  className="block text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link 
                  href="#testimonials" 
                  className="block text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reviews
                </Link>
                {isAuthenticated ? (
                  <Button onClick={() => router.push('/')} className="w-full bg-orange-500 hover:bg-orange-600">
                    Go to Dashboard
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Link 
                      href="/login" 
                      className="block text-gray-300 hover:text-white transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Button 
                      onClick={handleGetStarted} 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Content Intelligence
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Turn Any Content Into
            <span className="block knugget-gradient-text">Actionable Insights</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get AI-powered summaries of YouTube videos, LinkedIn posts, articles, and more. 
            Save hours of reading and never miss important insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-6"
            >
              Start for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>

          {/* Platform Icons */}
          <div className="flex justify-center items-center space-x-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <Youtube className="w-6 h-6 text-red-500" />
              <span className="text-sm">YouTube</span>
            </div>
            <div className="flex items-center space-x-2">
              <Linkedin className="w-6 h-6 text-blue-500" />
              <span className="text-sm">LinkedIn</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-6 h-6 text-green-500" />
              <span className="text-sm">Websites</span>
            </div>
            <div className="flex items-center space-x-2">
              <Twitter className="w-6 h-6 text-blue-400" />
              <span className="text-sm">Twitter</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Stay Informed
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powerful AI tools to help you consume and organize content more efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <feature.icon className={`w-12 h-12 ${feature.color} mx-auto mb-4`} />
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <benefit.icon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-3 text-white">{benefit.title}</h3>
                <p className="text-gray-400 text-lg">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Professionals Worldwide
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See how Knugget is helping people save time and stay informed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free and upgrade when you need more power
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-gray-800 border-gray-700 ${
                  plan.popular ? 'border-orange-500 ring-1 ring-orange-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400 ml-2">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    onClick={handleGetStarted}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-orange-500 hover:bg-orange-600' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Transform How You Consume Content?
          </h2>
          <p className="text-xl mb-8 text-orange-100">
            Join thousands of professionals who use Knugget to stay informed and save time.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg"
            className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-8 py-6"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg knugget-gradient flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-xl font-bold">Knugget AI</span>
              </Link>
              <p className="text-gray-400">
                AI-powered content intelligence for the modern professional.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/chrome-extension" className="hover:text-white transition-colors">Chrome Extension</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Knugget AI. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top indicator */}
      <Link 
        href="#" 
        className="fixed bottom-8 right-8 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 opacity-75 hover:opacity-100"
        onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      >
        <ChevronDown className="w-5 h-5 rotate-180" />
      </Link>
    </div>
  )
}