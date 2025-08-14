'use client';

import { useState } from 'react';
import { Mail, Sparkles, Eye, EyeOff, ChevronLeft, ChevronRight, Edit3, Save, X, CheckCircle, Users, Building } from 'lucide-react';
import { Contact, ResumeData, EmailTemplate } from '@/types';
import { generateBatchEmails, generateTemplateEmail } from '@/lib/gemini';

interface EmailGeneratorProps {
  contacts: Contact[];
  resumeData: ResumeData | null;
  onEmailGenerated: (templates: EmailTemplate[]) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function EmailGenerator({ 
  contacts, 
  resumeData, 
  onEmailGenerated,
  onPrevious,
  onNext
}: EmailGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState<EmailTemplate[]>([]);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditSubject, setBulkEditSubject] = useState('');
  const [bulkEditBody, setBulkEditBody] = useState('');
  const [quotaWarning, setQuotaWarning] = useState(false);
  const [useTemplateMode, setUseTemplateMode] = useState(false);

  const generateEmails = async () => {
    if (!resumeData || contacts.length === 0) return;

    setIsGenerating(true);
    setCurrentProgress(0);
    const templates: EmailTemplate[] = [];

    try {
      if (useTemplateMode) {
        // Use template mode (no AI, no API calls)
        contacts.forEach((contact, index) => {
          const templateEmail = generateTemplateEmail(contact, resumeData);
          const template: EmailTemplate = {
            id: `template-${index}`,
            subject: templateEmail.subject,
            body: templateEmail.body,
            company: contact.company,
            contact: contact
          };
          templates.push(template);
          setCurrentProgress(((index + 1) / contacts.length) * 100);
        });
      } else {
        // Use batch email generation with rate limiting and fallbacks
        const emailResults = await generateBatchEmails(
          contacts,
          resumeData,
          (current, total) => {
            setCurrentProgress((current / total) * 100);
          }
        );

        // Convert results to EmailTemplate format
        emailResults.forEach((result, index) => {
          const template: EmailTemplate = {
            id: `template-${index}`,
            subject: result.subject,
            body: result.body,
            company: result.contact.company,
            contact: result.contact
          };
          templates.push(template);
        });
      }

    } catch (error) {
      console.error('Error in batch email generation:', error);
      setQuotaWarning(true);
      
      // Fallback: generate template emails for all contacts
      contacts.forEach((contact, index) => {
        const fallbackEmail = generateTemplateEmail(contact, resumeData);
        const template: EmailTemplate = {
          id: `template-${index}`,
          subject: fallbackEmail.subject,
          body: fallbackEmail.body,
          company: contact.company,
          contact: contact
        };
        templates.push(template);
      });
    }

    setGeneratedTemplates(templates);
    setShowConfirmation(true); // Show confirmation after generation
    setIsGenerating(false);
  };

  const previewEmail = (template: EmailTemplate) => {
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
  };

  const startEditing = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.body);
  };

  const saveEdit = () => {
    if (editingTemplate) {
      const updatedTemplate = {
        ...editingTemplate,
        subject: editSubject,
        body: editBody
      };
      
      const updatedTemplates = generatedTemplates.map(t => 
        t.id === editingTemplate.id ? updatedTemplate : t
      );
      
      setGeneratedTemplates(updatedTemplates);
      setEditingTemplate(null);
    }
  };

  const cancelEdit = () => {
    setEditingTemplate(null);
  };

  const startBulkEdit = () => {
    setShowBulkEdit(true);
    setBulkEditSubject(generatedTemplates[0]?.subject || '');
    setBulkEditBody(generatedTemplates[0]?.body || '');
  };

  const saveBulkEdit = () => {
    const updatedTemplates = generatedTemplates.map(template => {
      // Replace placeholders with actual values
      const personalizedSubject = bulkEditSubject
        .replace(/\[Contact Name\]/g, template.contact.name)
        .replace(/\[Company Name\]/g, template.company)
        .replace(/\[Your Name\]/g, resumeData?.name || '[Your Name]')
        .replace(/\[Your Email\]/g, resumeData?.email || '[Your Email]')
        .replace(/\[Your Phone\]/g, resumeData?.phone || '[Your Phone]')
        .replace(/\[Your Experience\]/g, resumeData?.experience || '[Your Experience]')
        .replace(/\[Your Skills\]/g, resumeData?.skills?.slice(0, 3).join(', ') || '[Your Skills]');

      const personalizedBody = bulkEditBody
        .replace(/\[Contact Name\]/g, template.contact.name)
        .replace(/\[Company Name\]/g, template.company)
        .replace(/\[Your Name\]/g, resumeData?.name || '[Your Name]')
        .replace(/\[Your Email\]/g, resumeData?.email || '[Your Email]')
        .replace(/\[Your Phone\]/g, resumeData?.phone || '[Your Phone]')
        .replace(/\[Your Experience\]/g, resumeData?.experience || '[Your Experience]')
        .replace(/\[Your Skills\]/g, resumeData?.skills?.slice(0, 3).join(', ') || '[Your Skills]');

      return {
        ...template,
        subject: personalizedSubject,
        body: personalizedBody
      };
    });
    
    setGeneratedTemplates(updatedTemplates);
    setShowBulkEdit(false);
    setBulkEditSubject('');
    setBulkEditBody('');
  };

  const cancelBulkEdit = () => {
    setShowBulkEdit(false);
    setBulkEditSubject('');
    setBulkEditBody('');
  };

  const confirmEmails = () => {
    onEmailGenerated(generatedTemplates);
    setShowConfirmation(false);
  };

  const getCompanyStats = () => {
    const companies = [...new Set(contacts.map(c => c.company))];
    return {
      totalCompanies: companies.length,
      totalContacts: contacts.length,
      companies: companies
    };
  };

  const stats = getCompanyStats();

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="h-8 w-8 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900">Generate Cold Emails</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {stats.totalCompanies} companies • {stats.totalContacts} contacts
            </div>
          </div>
        </div>

        {!resumeData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Please upload your resume first to generate personalized emails.
            </p>
          </div>
        )}

        {contacts.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Please upload your contact list first to generate emails.
            </p>
          </div>
        )}

        {resumeData && contacts.length > 0 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-medium">AI-Powered Email Generation</span>
              </div>
              <p className="text-blue-700 text-sm">
                We&apos;ll generate personalized cold emails for all {contacts.length} contacts using AI.
                Each email will be tailored to the specific company and contact person.
              </p>
              
              {quotaWarning && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <span className="text-sm font-medium">⚠️ API Quota Notice:</span>
                    <span className="text-sm">Gemini API quota may be limited. We&apos;ll use fallback templates if needed.</span>
                  </div>
                  <button
                    onClick={() => setUseTemplateMode(true)}
                    className="mt-2 text-sm text-yellow-700 hover:text-yellow-800 underline"
                  >
                    Use template mode instead
                  </button>
                </div>
              )}
            </div>

            {useTemplateMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-2 text-green-800 mb-2">
                  <span className="font-medium">Template Mode Active</span>
                </div>
                <p className="text-green-700 text-sm">
                  Using pre-built email templates with personalization. This mode doesn&apos;t use AI and won&apos;t hit API limits.
                </p>
                <button
                  onClick={() => setUseTemplateMode(false)}
                  className="mt-2 text-sm text-green-700 hover:text-green-800 underline"
                >
                  Switch back to AI mode
                </button>
              </div>
            )}

            {generatedTemplates.length === 0 && !showConfirmation && (
              <button
                onClick={generateEmails}
                disabled={isGenerating}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>
                      {useTemplateMode ? 'Creating template emails...' : 'Generating emails...'} {Math.round(currentProgress)}%
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>
                      {useTemplateMode 
                        ? `Create ${contacts.length} Template Emails` 
                        : `Generate ${contacts.length} AI-Powered Emails`
                      }
                    </span>
                  </>
                )}
              </button>
            )}

            {isGenerating && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                ></div>
              </div>
            )}

            {showConfirmation && generatedTemplates.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium text-xl">
                      {generatedTemplates.length} emails generated successfully!
                    </span>
                  </div>
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>

                {/* Email Generation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{generatedTemplates.length}</div>
                    <div className="text-sm text-green-600">Emails Generated</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{stats.totalCompanies}</div>
                    <div className="text-sm text-green-600">Companies Targeted</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((generatedTemplates.length / stats.totalCompanies) * 10) / 10}
                    </div>
                    <div className="text-sm text-green-600">Avg Emails/Company</div>
                  </div>
                </div>

                {/* Sample Generated Emails */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-blue-500" />
                    Sample Generated Emails (First 3):
                  </h4>
                  <div className="space-y-3">
                    {generatedTemplates.slice(0, 3).map((template, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{template.contact.name}</span>
                            <span className="text-sm text-gray-500">({template.company})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => previewEmail(template)}
                              className="text-blue-600 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => startEditing(template)}
                              className="text-green-600 hover:text-green-700 text-sm px-2 py-1 rounded hover:bg-green-50"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Subject:</span>
                            <p className="text-sm text-gray-900 truncate">{template.subject}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Preview:</span>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {template.body.substring(0, 150)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {generatedTemplates.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {generatedTemplates.length - 3} more emails
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={startBulkEdit}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit All Emails</span>
                  </button>
                  <button
                    onClick={confirmEmails}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span>Confirm & Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {generatedTemplates.length > 0 && !showConfirmation && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Generated Email Templates ({generatedTemplates.length})
                  </h3>
                  <div className="text-sm text-gray-500">
                    Click on any company to view and edit the email
                  </div>
                </div>
                
                {/* Companies List */}
                <div className="grid grid-cols-1 gap-4">
                  {stats.companies.map((company) => {
                    const companyTemplates = generatedTemplates.filter(t => t.company === company);
                    const companyContacts = contacts.filter(c => c.company === company);
                    
                    return (
                      <div key={company} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-gray-900">{company}</h4>
                            <p className="text-sm text-gray-600">
                              {companyContacts.length} contact{companyContacts.length > 1 ? 's' : ''} • 
                              {companyContacts.map(c => c.name).join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => previewEmail(companyTemplates[0])}
                              className="text-blue-600 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50"
                              title="Preview Email"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => startEditing(companyTemplates[0])}
                              className="text-green-600 hover:text-green-700 p-2 rounded-md hover:bg-green-50"
                              title="Edit Email"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">Subject:</span>
                            <p className="text-sm text-gray-900 truncate">{companyTemplates[0].subject}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">Preview:</span>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {companyTemplates[0].body.substring(0, 150)}...
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onPrevious}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          {generatedTemplates.length > 0 && !showConfirmation && (
            <button
              onClick={() => {
                onEmailGenerated(generatedTemplates);
                onNext();
              }}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <span>Next: Send Emails</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Email Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Email Preview - {previewTemplate.contact.name}
                  </h3>
                  <button
                    onClick={closePreview}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">To:</span>
                    <p className="text-gray-900">{previewTemplate.contact.email}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">Subject:</span>
                    <p className="text-gray-900">{previewTemplate.subject}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-500">Body:</span>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                        {previewTemplate.body}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Edit Modal */}
        {editingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Email - {editingTemplate.contact.name} ({editingTemplate.company})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={saveEdit}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email subject..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Body
                    </label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter email body..."
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Tips:</strong> Use line breaks for paragraphs. The email will be sent as both text and HTML format.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Edit Modal */}
        {showBulkEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit All Emails ({generatedTemplates.length} emails)
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={saveBulkEdit}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                      <span>Apply to All</span>
                    </button>
                    <button
                      onClick={cancelBulkEdit}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <span className="text-sm font-medium">⚠️ Warning:</span>
                    <span className="text-sm">This will update the subject and body for ALL {generatedTemplates.length} emails. Individual contact names and companies will still be personalized.</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject Line Template
                    </label>
                    <input
                      type="text"
                      value={bulkEditSubject}
                      onChange={(e) => setBulkEditSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Job Application - [Your Name] for [Company Name]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use [Company Name] or [Contact Name] for personalization
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Body Template
                    </label>
                    <textarea
                      value={bulkEditBody}
                      onChange={(e) => setBulkEditBody(e.target.value)}
                      rows={15}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder={`Dear [Contact Name],

I hope this email finds you well. I am writing to express my interest in potential opportunities at [Company Name].

With my background in [Your Experience] and skills in [Your Skills], I believe I could be a valuable addition to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how my experience aligns with your company's needs.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Email]
[Your Phone]`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use [Contact Name], [Company Name], [Your Name], [Your Email], [Your Phone], [Your Experience], [Your Skills] for personalization
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Tips:</strong> 
                      <ul className="mt-1 space-y-1">
                        <li>• Use line breaks for paragraphs</li>
                        <li>• Use [Contact Name] and [Company Name] for personalization</li>
                        <li>• Use [Your Name], [Your Email], [Your Phone] for your details</li>
                        <li>• Use [Your Experience] and [Your Skills] for your background</li>
                      </ul>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 