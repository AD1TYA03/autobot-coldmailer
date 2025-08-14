'use client';

import { useState } from 'react';
import { Send, CheckCircle, XCircle, Clock, Mail, Eye, EyeOff, ChevronRight, Users, Building } from 'lucide-react';
import { EmailTemplate, EmailTracking } from '@/types';

interface EmailSenderProps {
  emailTemplates: EmailTemplate[];
  resumeFile?: File | null;
  onEmailsSent: (tracking: EmailTracking[]) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function EmailSender({ emailTemplates, resumeFile, onEmailsSent, onPrevious, onNext }: EmailSenderProps) {
  const [isSending, setIsSending] = useState(false);
  const [emailTracking, setEmailTracking] = useState<EmailTracking[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sendEmails = async () => {
    if (!senderEmail || !senderPassword || emailTemplates.length === 0) return;

    setIsSending(true);
    setCurrentProgress(0);
    const tracking: EmailTracking[] = [];

    for (let i = 0; i < emailTemplates.length; i++) {
      const template = emailTemplates[i];
      setCurrentProgress(((i + 1) / emailTemplates.length) * 100);

      const trackingItem: EmailTracking = {
        id: `tracking-${i}`,
        contact: template.contact,
        emailTemplate: template,
        status: 'pending',
        sentAt: new Date()
      };

      tracking.push(trackingItem);

      try {
        const formData = new FormData();
        formData.append('to', template.contact.email);
        formData.append('subject', template.subject);
        formData.append('body', template.body);
        formData.append('senderEmail', senderEmail);
        formData.append('senderPassword', senderPassword);
        formData.append('contactName', template.contact.name);
        formData.append('company', template.company);
        
        // Add resume file as attachment if available
        if (resumeFile) {
          formData.append('resumeFile', resumeFile);
        }

        const response = await fetch('/api/send-email', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          trackingItem.status = 'sent';
          trackingItem.sentAt = new Date();
        } else {
          const errorData = await response.json() as { error?: string; details?: string; code?: string };
          trackingItem.status = 'failed';
          trackingItem.error = errorData.error || 'Failed to send email';
        }
      } catch (error) {
        console.error(`Error sending email to ${template.contact.email}:`, error);
        trackingItem.status = 'failed';
        trackingItem.error = error instanceof Error ? error.message : 'Unknown error';
      }

      // Add a small delay between emails
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setEmailTracking(tracking);
    setShowConfirmation(true); // Show confirmation after sending
    setIsSending(false);
  };

  const confirmSending = () => {
    onEmailsSent(emailTracking);
    setShowConfirmation(false);
  };

  const getStatusIcon = (status: EmailTracking['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: EmailTracking['status']) => {
    switch (status) {
      case 'sent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCompanyStats = () => {
    const companies = [...new Set(emailTemplates.map(t => t.company))];
    return {
      totalCompanies: companies.length,
      totalEmails: emailTemplates.length,
      companies: companies
    };
  };

  const stats = getCompanyStats();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Send className="h-8 w-8 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900">Send Cold Emails</h2>
        </div>

        {emailTemplates.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Please generate email templates first before sending emails.
            </p>
          </div>
        )}

        {emailTemplates.length > 0 && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-800 mb-2">
                <Send className="h-5 w-5" />
                <span className="font-medium">Email Sending Configuration</span>
              </div>
              <p className="text-green-700 text-sm">
                Configure your email settings to send {emailTemplates.length} personalized emails.
              </p>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Note:</strong> Make sure you have enabled 2-Step Verification in your Google account and are using an App Password, not your regular Gmail password.
              </div>
            </div>

            {/* Email Configuration Form */}
            {!showPreview && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email Address
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    App Password
                  </label>
                  <input
                    type="password"
                    value={senderPassword}
                    onChange={(e) => setSenderPassword(e.target.value)}
                    placeholder="Your app password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use Gmail App Password for security
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800 font-medium mb-1">How to get Gmail App Password:</p>
                    <ol className="text-xs text-blue-700 space-y-1">
                      <li>1. <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Go to Google App Passwords</a></li>
                      <li>2. Sign in with your Google account</li>
                      <li>3. Create an App Password for &quot;Mail&quot;</li>
                      <li>4. Use the 16-character password here</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Configuration */}
            {showPreview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Eye className="h-5 w-5" />
                    <span className="font-medium text-lg">Email Configuration Preview</span>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Sender Information</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">From Email:</span>
                        <p className="text-sm text-gray-900">{senderEmail}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <span className="text-sm text-green-600 font-medium">✓ Configured</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Campaign Summary</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Total Emails:</span>
                        <p className="text-sm text-gray-900">{stats.totalEmails}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Companies:</span>
                        <p className="text-sm text-gray-900">{stats.totalCompanies}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample Recipients */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-blue-500" />
                    Sample Recipients (First 5):
                  </h4>
                  <div className="space-y-2">
                    {emailTemplates.slice(0, 5).map((template, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{template.contact.name}</p>
                            <p className="text-xs text-gray-500">{template.contact.email}</p>
                            <p className="text-xs text-gray-400">{template.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Subject:</p>
                          <p className="text-xs text-gray-900 truncate max-w-xs">{template.subject}</p>
                        </div>
                      </div>
                    ))}
                    {emailTemplates.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {emailTemplates.length - 5} more recipients
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirmation Button */}
                <div className="flex justify-end">
                  <button
                    onClick={sendEmails}
                    disabled={isSending}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send {emailTemplates.length} Emails</span>
                  </button>
                </div>
              </div>
            )}

            {/* Send Button */}
            {!showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                disabled={!senderEmail || !senderPassword}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-5 w-5" />
                <span>Preview & Send {emailTemplates.length} Emails</span>
              </button>
            )}

            {isSending && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
            )}

            {/* Sending Confirmation */}
            {showConfirmation && emailTracking.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium text-xl">Email Campaign Completed!</span>
                  </div>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>

                {/* Campaign Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {emailTracking.filter(t => t.status === 'sent').length}
                    </div>
                    <div className="text-sm text-green-600">Successfully Sent</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-red-600">
                      {emailTracking.filter(t => t.status === 'failed').length}
                    </div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((emailTracking.filter(t => t.status === 'sent').length / emailTracking.length) * 100)}%
                    </div>
                    <div className="text-sm text-green-600">Success Rate</div>
                  </div>
                </div>

                {/* Sample Results */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-blue-500" />
                    Sample Results (First 5):
                  </h4>
                  <div className="space-y-2">
                    {emailTracking.slice(0, 5).map((tracking) => (
                      <div 
                        key={tracking.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(tracking.status)}`}
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(tracking.status)}
                          <div>
                            <p className="font-medium text-sm">{tracking.contact.name}</p>
                            <p className="text-xs opacity-75">{tracking.contact.email}</p>
                            <p className="text-xs opacity-75">{tracking.contact.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium capitalize">{tracking.status}</p>
                          {tracking.sentAt && (
                            <p className="text-xs opacity-75">
                              {tracking.sentAt.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {emailTracking.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {emailTracking.length - 5} more results
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirmation Button */}
                <div className="flex justify-end">
                  <button
                    onClick={confirmSending}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span>View Full Results</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Email Tracking Display */}
            {emailTracking.length > 0 && !showConfirmation && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Email Sending Status ({emailTracking.length})
                </h3>
                
                <div className="space-y-3">
                  {emailTracking.map((tracking) => (
                    <div 
                      key={tracking.id} 
                      className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor(tracking.status)}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(tracking.status)}
                        <div>
                          <p className="font-medium">{tracking.contact.name}</p>
                          <p className="text-sm opacity-75">{tracking.contact.email}</p>
                          <p className="text-xs opacity-75">{tracking.contact.company}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium capitalize">{tracking.status}</p>
                        {tracking.sentAt && (
                          <p className="text-xs opacity-75">
                            {tracking.sentAt.toLocaleTimeString()}
                          </p>
                        )}
                        {tracking.error && (
                          <p className="text-xs opacity-75">{tracking.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 font-medium">
                        {emailTracking.filter(t => t.status === 'sent').length} Sent
                      </span>
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">
                        {emailTracking.filter(t => t.status === 'failed').length} Failed
                      </span>
                    </div>
                    <div>
                      <span className="text-yellow-600 font-medium">
                        {emailTracking.filter(t => t.status === 'pending').length} Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
              )}
              
              {emailTracking.length > 0 && !showConfirmation && onNext && (
                <button
                  onClick={() => {
                    onEmailsSent(emailTracking);
                    onNext();
                  }}
                  className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>Next: View Results</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 