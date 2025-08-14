'use client';

import { Rocket, FileText, Users, Mail, BarChart3, ArrowRight, Zap, Shield, Clock } from 'lucide-react';

interface WelcomePageProps {
  onGetStarted: () => void;
}

export default function WelcomePage({ onGetStarted }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">AutoBot</h1>
                <span className="text-xs sm:text-sm text-gray-500">Cold Email Automation</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-6 sm:mb-8">
            <Rocket className="h-16 w-16 sm:h-20 sm:w-20 text-blue-600 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
              Automate Your Cold Email Campaigns
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Generate personalized cold emails at scale using AI. Upload your resume, add contacts, and let AutoBot create compelling emails that get responses.
            </p>
          </div>
          
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* How It Works */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12 px-4">How AutoBot Works</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">1. Upload Resume</h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Upload your PDF resume or manually enter your professional details
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">2. Add Contacts</h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Upload a CSV file with your target contacts or add them manually
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">3. Generate Emails</h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                AI creates personalized emails for each contact based on your profile
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 p-3 sm:p-4 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">4. Send & Track</h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Send emails directly and track your campaign performance
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-12 px-4">Why Choose AutoBot?</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-3 sm:mb-4">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mr-2 sm:mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">AI-Powered</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">
                Advanced AI generates personalized emails that resonate with each recipient
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-3 sm:mb-4">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-2 sm:mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Secure & Private</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">
                Your data stays on your device. No data is stored on our servers
              </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-3 sm:mb-4">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-2 sm:mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Time-Saving</h3>
              </div>
              <p className="text-gray-600 text-xs sm:text-sm">
                Generate hundreds of personalized emails in minutes, not hours
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Ready to Transform Your Outreach?</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">
            Join thousands of professionals who are already using AutoBot to scale their cold email campaigns
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
          >
            Start Your First Campaign
            <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 