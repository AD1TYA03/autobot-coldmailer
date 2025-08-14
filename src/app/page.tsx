'use client';

import { useState, useEffect } from 'react';
import { ResumeData, Contact, EmailTemplate, EmailTracking } from '@/types';
import ResumeUpload from '@/components/ResumeUpload';
import ContactUpload from '@/components/ContactUpload';
import EmailGenerator from '@/components/EmailGenerator';
import EmailSender from '@/components/EmailSender';
import WelcomePage from '@/components/WelcomePage';
import { Rocket, FileText, Users, Mail, BarChart3 } from 'lucide-react';

// Custom hook for data persistence
function usePersistentState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setState(JSON.parse(item));
        }
        setIsInitialized(true);
      } catch (error) {
        console.error(`Error loading ${key} from localStorage:`, error);
        setIsInitialized(true);
      }
    }
  }, [key]);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  }, [key, state, isInitialized]);

  return [state, setState] as const;
}

export default function Home() {
  const [resumeData, setResumeData] = usePersistentState<ResumeData | null>('autobot-resume-data', null);
  const [contacts, setContacts] = usePersistentState<Contact[]>('autobot-contacts', []);
  const [emailTemplates, setEmailTemplates] = usePersistentState<EmailTemplate[]>('autobot-email-templates', []);
  const [emailTracking, setEmailTracking] = usePersistentState<EmailTracking[]>('autobot-email-tracking', []);
  const [currentStep, setCurrentStep] = usePersistentState<number>('autobot-current-step', 1);
  const [hasSeenWelcome, setHasSeenWelcome] = usePersistentState<boolean>('autobot-has-seen-welcome', false);
  
  // Note: We can't persist File objects, so we'll handle resumeFile separately
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Set client state to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if data was recovered on page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasRecoveredData = localStorage.getItem('autobot-resume-data') || 
                               localStorage.getItem('autobot-contacts') || 
                               localStorage.getItem('autobot-email-templates');
      
      if (hasRecoveredData) {
        setShowRecoveryMessage(true);
        // Hide the message after 5 seconds
        setTimeout(() => setShowRecoveryMessage(false), 5000);
      }
    }
  }, []);

  // Clear all data function
  const clearAllData = () => {
    setResumeData(null);
    setResumeFile(null);
    setContacts([]);
    setEmailTemplates([]);
    setEmailTracking([]);
    setCurrentStep(1);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('autobot-resume-data');
      localStorage.removeItem('autobot-contacts');
      localStorage.removeItem('autobot-email-templates');
      localStorage.removeItem('autobot-email-tracking');
      localStorage.removeItem('autobot-current-step');
    }
  };

  // Handle getting started from welcome page
  const handleGetStarted = () => {
    setHasSeenWelcome(true);
  };

  // Export data function
  const exportData = () => {
    const dataToExport = {
      resumeData,
      contacts,
      emailTemplates,
      emailTracking,
      currentStep,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autobot-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data function
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.resumeData) setResumeData(importedData.resumeData);
        if (importedData.contacts) setContacts(importedData.contacts);
        if (importedData.emailTemplates) setEmailTemplates(importedData.emailTemplates);
        if (importedData.emailTracking) setEmailTracking(importedData.emailTracking);
        if (importedData.currentStep) setCurrentStep(importedData.currentStep);
        
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResumeUpload = (data: ResumeData, file?: File) => {
    setResumeData(data);
    setResumeFile(file || null);
    setCurrentStep(2);
  };

  const handleContactsUpload = (data: Contact[]) => {
    setContacts(data);
    setCurrentStep(3);
  };

  const handleEmailGenerated = (templates: EmailTemplate[]) => {
    setEmailTemplates(templates);
    setCurrentStep(4);
  };

  const handleEmailsSent = (tracking: EmailTracking[]) => {
    setEmailTracking(tracking);
    setCurrentStep(5);
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepIcon = (step: number) => {
    switch (step) {
      case 1: return <FileText className="h-5 w-5" />;
      case 2: return <Users className="h-5 w-5" />;
      case 3: return <Mail className="h-5 w-5" />;
      case 4: return <Rocket className="h-5 w-5" />;
      case 5: return <BarChart3 className="h-5 w-5" />;
      default: return null;
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Upload Resume';
      case 2: return 'Upload Contacts';
      case 3: return 'Generate Emails';
      case 4: return 'Send Emails';
      case 5: return 'Track Results';
      default: return '';
    }
  };

  // Show welcome page if user hasn't seen it yet
  if (!hasSeenWelcome) {
    return <WelcomePage onGetStarted={handleGetStarted} />;
  }

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
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-sm text-gray-500">
                Powered by AI
              </div>
              
              {/* Back to Welcome button */}
              <button
                onClick={() => setHasSeenWelcome(false)}
                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50"
                title="Back to welcome page"
              >
                <span className="hidden sm:inline">Welcome</span>
                <span className="sm:hidden">←</span>
              </button>
              
              {/* Data management buttons */}
              {isClient && (resumeData || contacts.length > 0 || emailTemplates.length > 0) && (
                <div className="hidden sm:flex items-center space-x-2">
                  <button
                    onClick={exportData}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded-md hover:bg-blue-50"
                    title="Export data backup"
                  >
                    Export
                  </button>
                  <label className="text-xs text-green-600 hover:text-green-700 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50 cursor-pointer" title="Import data backup">
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={clearAllData}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 border border-red-200 rounded-md hover:bg-red-50"
                    title="Clear all data"
                  >
                    Clear
                  </button>
                </div>
              )}
              
              {/* Data persistence indicator */}
              {isClient && (resumeData || contacts.length > 0 || emailTemplates.length > 0) && (
                <div className="hidden sm:flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Data Saved</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Recovery Message */}
      {isClient && showRecoveryMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800 font-medium">
                  Data recovered! Your previous session has been restored.
                </span>
              </div>
              <button
                onClick={() => setShowRecoveryMessage(false)}
                className="text-green-600 hover:text-green-800"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          {/* Mobile Progress Steps */}
          <div className="sm:hidden">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    getStepStatus(step) === 'completed' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : getStepStatus(step) === 'current'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {getStepStatus(step) === 'completed' ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      getStepIcon(step)
                    )}
                  </div>
                  <p className={`text-xs font-medium mt-1 ${
                    getStepStatus(step) === 'completed' 
                      ? 'text-green-600' 
                      : getStepStatus(step) === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {step}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium ${
                getStepStatus(currentStep) === 'completed' 
                  ? 'text-green-600' 
                  : getStepStatus(currentStep) === 'current'
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}>
                {getStepTitle(currentStep)}
              </p>
            </div>
          </div>

          {/* Desktop Progress Steps */}
          <div className="hidden sm:flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  getStepStatus(step) === 'completed' 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : getStepStatus(step) === 'current'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {getStepStatus(step) === 'completed' ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    getStepIcon(step)
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    getStepStatus(step) === 'completed' 
                      ? 'text-green-600' 
                      : getStepStatus(step) === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {getStepTitle(step)}
                  </p>
                </div>
                {step < 5 && (
                  <div className={`ml-8 w-16 h-0.5 ${
                    getStepStatus(step) === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Step 1: Resume Upload */}
          {currentStep >= 1 && (
            <div className={currentStep === 1 ? 'block' : 'hidden'}>
              <ResumeUpload 
                onResumeUpload={handleResumeUpload} 
                onNext={() => setCurrentStep(2)}
              />
            </div>
          )}

          {/* Step 2: Contact Upload */}
          {currentStep >= 2 && (
            <div className={currentStep === 2 ? 'block' : 'hidden'}>
              <ContactUpload 
                onContactsUpload={handleContactsUpload}
                onPrevious={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            </div>
          )}

          {/* Step 3: Email Generation */}
          {currentStep >= 3 && (
            <div className={currentStep === 3 ? 'block' : 'hidden'}>
              <EmailGenerator 
                contacts={contacts}
                resumeData={resumeData}
                onEmailGenerated={handleEmailGenerated}
                onPrevious={() => setCurrentStep(2)}
                onNext={() => setCurrentStep(4)}
              />
            </div>
          )}

          {/* Step 4: Email Sending */}
          {currentStep >= 4 && (
            <div className={currentStep === 4 ? 'block' : 'hidden'}>
              <EmailSender 
                emailTemplates={emailTemplates}
                resumeFile={resumeFile}
                onEmailsSent={handleEmailsSent}
                onPrevious={() => setCurrentStep(3)}
                onNext={() => setCurrentStep(5)}
              />
            </div>
          )}

          {/* Step 5: Results Dashboard */}
          {currentStep === 5 && (
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-8 w-8 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-900">Campaign Results</h2>
                  </div>
                  <button
                    onClick={clearAllData}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Clear All Data
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {emailTracking.filter(t => t.status === 'sent').length}
                        </p>
                        <p className="text-sm text-green-600">Emails Sent</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">
                          {emailTracking.filter(t => t.status === 'failed').length}
                        </p>
                        <p className="text-sm text-red-600">Failed</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {emailTracking.length > 0 ? Math.round((emailTracking.filter(t => t.status === 'sent').length / emailTracking.length) * 100) : 0}%
                        </p>
                        <p className="text-sm text-blue-600">Success Rate</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Summary</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Total contacts processed: {contacts.length}</p>
                    <p>• Personalized emails generated: {emailTemplates.length}</p>
                    <p>• Emails sent successfully: {emailTracking.filter(t => t.status === 'sent').length}</p>
                    <p>• Campaign completed at: {new Date().toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Start New Campaign
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Export Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
