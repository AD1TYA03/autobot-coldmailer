'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, EyeOff, ChevronRight, User, Mail, Phone, Briefcase, Code, Plus, Eye } from 'lucide-react';
import { ResumeData } from '@/types';

interface ResumeUploadProps {
  onResumeUpload: (resumeData: ResumeData, resumeFile?: File) => void;
  onNext?: () => void;
}

export default function ResumeUpload({ onResumeUpload, onNext }: ResumeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualResume, setManualResume] = useState<ResumeData>({
    name: '',
    email: '',
    phone: '',
    skills: [],
    experience: '',
    education: '',
    title: '',
    location: '',
    linkedin: '',
    website: '',
    summary: ''
  });
  const [skillsInput, setSkillsInput] = useState('');

  // Memoize the PDF URL to prevent reloading on every render
  const pdfUrl = useMemo(() => {
    if (uploadedFile) {
      return URL.createObjectURL(uploadedFile);
    }
    return null;
  }, [uploadedFile]);

  // Cleanup function for the PDF URL
  const cleanupPdfUrl = useCallback(() => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
  }, [pdfUrl]);

  // Cleanup PDF URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      cleanupPdfUrl();
    };
  }, [cleanupPdfUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files.find(file => file.type === 'application/pdf');
    
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setShowManualInput(true);
    setShowPdfPreview(false); // Reset PDF preview when new file is uploaded
  };

  const removeFile = () => {
    // Clean up the PDF URL before removing the file
    cleanupPdfUrl();
    setUploadedFile(null);
    setResumeData(null);
    setShowPreview(false);
    setShowManualInput(false);
    setShowPdfPreview(false);
  };

  const confirmResume = () => {
    if (resumeData) {
      onResumeUpload(resumeData, uploadedFile || undefined);
      setShowPreview(false);
    }
  };

  const addManualResume = useCallback(() => {
    if (manualResume.name && manualResume.email) {
      const newResumeData: ResumeData = {
        name: manualResume.name,
        email: manualResume.email,
        phone: manualResume.phone,
        title: manualResume.title,
        location: manualResume.location,
        linkedin: manualResume.linkedin,
        website: manualResume.website,
        summary: manualResume.summary,
        experience: manualResume.experience || 'Professional experience',
        education: manualResume.education || 'Education background',
        skills: skillsInput ? skillsInput.split(',').map(s => s.trim()) : [],
        parsingMethod: isEditing ? 'Manual Edit' : 'Manual Input'
      };
      
      setResumeData(newResumeData);
      setShowPreview(true);
      setIsEditing(false);
      
      // Reset form
      setManualResume({
        name: '',
        email: '',
        phone: '',
        title: '',
        location: '',
        linkedin: '',
        website: '',
        summary: '',
        experience: '',
        education: '',
        skills: []
      });
      setSkillsInput('');
    }
  }, [manualResume, skillsInput, isEditing]);

  const togglePdfPreview = useCallback(() => {
    setShowPdfPreview(!showPdfPreview);
  }, [showPdfPreview]);

  const startEditing = useCallback(() => {
    if (resumeData) {
      // Populate the form with existing data
      setManualResume({
        name: resumeData.name || '',
        email: resumeData.email || '',
        phone: resumeData.phone || '',
        title: resumeData.title || '',
        location: resumeData.location || '',
        linkedin: resumeData.linkedin || '',
        website: resumeData.website || '',
        summary: resumeData.summary || '',
        experience: resumeData.experience || '',
        education: resumeData.education || '',
        skills: []
      });
      setSkillsInput(resumeData.skills ? resumeData.skills.join(', ') : '');
      setIsEditing(true);
      setShowManualInput(true);
      setShowPreview(false);
    }
  }, [resumeData]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setShowManualInput(false);
    setShowPreview(true);
    // Reset form to empty state
    setManualResume({
      name: '',
      email: '',
      phone: '',
      title: '',
      location: '',
      linkedin: '',
      website: '',
      summary: '',
      experience: '',
      education: '',
      skills: []
    });
    setSkillsInput('');
  }, []);

  const generateSampleEmail = () => {
    if (!resumeData) return '';
    
    return `Dear Hiring Manager,

I hope this email finds you well. I am writing to express my interest in potential opportunities at your company.

With my background in ${resumeData.experience} and skills in ${resumeData.skills.slice(0, 3).join(', ')}, I believe I could be a valuable addition to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how my experience aligns with your company's needs.

Thank you for your time and consideration.

Best regards,
${resumeData.name}
${resumeData.email}
${resumeData.phone ? resumeData.phone : ''}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Upload Your Resume</h2>
        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
          Upload your resume (PDF only) and enter your information manually. You can preview how your emails will look before proceeding.
        </p>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
          <div className="text-xs sm:text-sm text-gray-600">
            {resumeData && `Resume data loaded (${resumeData.parsingMethod || 'Manual Input'} method)`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Resume Manually</span>
              <span className="sm:hidden">Add Manually</span>
            </button>
          </div>
        </div>
        
        {!uploadedFile && !showPreview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
            <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Drop your resume here (PDF only)
            </p>
            <p className="text-gray-500 mb-3 sm:mb-4 text-sm">
              Upload your resume and enter your information manually
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Choose File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadedFile && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{uploadedFile.name}</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePdfPreview}
                      className="text-blue-600 hover:text-blue-700 px-2 sm:px-3 py-1 text-xs sm:text-sm border border-blue-200 rounded-md hover:bg-blue-50"
                    >
                      <span className="hidden sm:inline">{showPdfPreview ? 'Hide Preview' : 'Preview PDF'}</span>
                      <span className="sm:hidden">{showPdfPreview ? 'Hide' : 'Preview'}</span>
                    </button>
                    <button
                      onClick={removeFile}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                {/* PDF Preview */}
                {showPdfPreview && uploadedFile && pdfUrl && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 sm:px-4 py-2 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <h4 className="text-sm font-medium text-gray-700">PDF Preview</h4>
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                          >
                            <span className="hidden sm:inline">Open in New Tab</span>
                            <span className="sm:hidden">Open</span>
                          </a>
                          <a
                            href={pdfUrl}
                            download={uploadedFile.name}
                            className="text-xs text-green-600 hover:text-green-700 px-2 py-1 border border-green-200 rounded hover:bg-green-50"
                          >
                            <span className="hidden sm:inline">Download</span>
                            <span className="sm:hidden">Save</span>
                          </a>
                          <button
                            onClick={() => setShowPdfPreview(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="h-64 sm:h-96 overflow-auto">
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full border-0"
                        title="PDF Preview"
                        onError={(e) => {
                          // Fallback for browsers that don't support PDF preview
                          const target = e.target as HTMLIFrameElement;
                          target.style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'flex items-center justify-center h-full bg-gray-50';
                          fallback.innerHTML = `
                            <div class="text-center">
                              <div class="text-gray-400 mb-2">
                                <svg class="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
                                </svg>
                              </div>
                              <p class="text-sm text-gray-500">PDF preview not available</p>
                              <a href="${pdfUrl}" target="_blank" class="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">
                                Open in new tab
                              </a>
                            </div>
                          `;
                          target.parentNode?.appendChild(fallback);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {showPreview && resumeData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    <span className="font-medium text-xl">Resume information ready!</span>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>

                {/* Resume Data Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Personal Information */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2 text-blue-500" />
                      Personal Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-600">Name:</span>
                        <span className="text-sm text-gray-900">{resumeData.name}</span>
                      </div>
                      {resumeData.title && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">Title:</span>
                          <span className="text-sm text-gray-900">{resumeData.title}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{resumeData.email}</span>
                      </div>
                      {resumeData.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{resumeData.phone}</span>
                        </div>
                      )}
                      {resumeData.location && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">Location:</span>
                          <span className="text-sm text-gray-900">{resumeData.location}</span>
                        </div>
                      )}
                      {resumeData.linkedin && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">LinkedIn:</span>
                          <a href={resumeData.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-blue-500" />
                      Professional Summary
                    </h4>
                    <div className="space-y-2">
                      {resumeData.summary && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Summary:</span>
                          <p className="text-sm text-gray-900">{resumeData.summary}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">Experience:</span>
                        <p className="text-sm text-gray-900">{resumeData.experience}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Education:</span>
                        <p className="text-sm text-gray-900">{resumeData.education}</p>
                      </div>
                      {resumeData.website && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Website:</span>
                          <a href={resumeData.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800">
                            Visit Portfolio
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skills Section */}
                <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Code className="h-4 w-4 mr-2 text-blue-500" />
                    Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample Email Preview */}
                <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-blue-500" />
                    Sample Email Preview
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Subject:</span>
                        <p className="text-gray-900">Job Application - {resumeData.name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Body Preview:</span>
                        <pre className="text-gray-900 whitespace-pre-wrap font-sans text-sm">
                          {generateSampleEmail()}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 mb-2">How this will be used:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your name and contact information will be used in email signatures</li>
                    <li>• Your skills and experience will be referenced in personalized emails</li>
                    <li>• Your background will be tailored to match each company&apos;s needs</li>
                    <li>• This information will help generate compelling cold emails</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={startEditing}
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edit Resume Details</span>
                  </button>
                  <button
                    onClick={confirmResume}
                    className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <span>Confirm & Continue</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
           </div>
         )}

         {/* Manual Resume Input */}
         {showManualInput && (
           <div className="mt-6 p-4 sm:p-6 bg-gray-50 rounded-lg">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
               <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                 {isEditing ? 'Edit Professional Profile' : 'Professional Profile'}
               </h3>
               <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                 <div className="text-xs sm:text-sm text-gray-500">
                   Fill in your details to create personalized emails
                 </div>
                 {isEditing && (
                   <button
                     onClick={cancelEditing}
                     className="text-xs sm:text-sm text-red-600 hover:text-red-700 px-2 sm:px-3 py-1 border border-red-200 rounded-md hover:bg-red-50"
                   >
                     Cancel Edit
                   </button>
                 )}
               </div>
             </div>

             {/* Personal Information Section */}
             <div className="mb-6 sm:mb-8">
               <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                 <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                 Personal Information
               </h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                     Full Name <span className="text-red-500">*</span>
                     <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                   </label>
                   <input
                     type="text"
                     value={manualResume.name}
                     onChange={(e) => setManualResume({...manualResume, name: e.target.value})}
                     className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     placeholder="e.g., Sarah Johnson, Michael Chen, or Dr. Emily Rodriguez"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                     Professional Title
                     <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                   </label>
                   <input
                     type="text"
                     value={manualResume.title || ''}
                     onChange={(e) => setManualResume({...manualResume, title: e.target.value})}
                     className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     placeholder="e.g., Senior Software Engineer, Product Manager, Data Scientist"
                   />
                 </div>
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                     Email Address <span className="text-red-500">*</span>
                     <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                   </label>
                   <input
                     type="email"
                     value={manualResume.email}
                     onChange={(e) => setManualResume({...manualResume, email: e.target.value})}
                     className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     placeholder="sarah.johnson@gmail.com or michael.chen@company.com"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                     Phone Number
                     <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                   </label>
                   <input
                     type="tel"
                     value={manualResume.phone || ''}
                     onChange={(e) => setManualResume({...manualResume, phone: e.target.value})}
                     className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     placeholder="+1 (555) 123-4567 or (555) 123-4567"
                   />
                 </div>
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Location</label>
                   <input
                     type="text"
                     value={manualResume.location || ''}
                     onChange={(e) => setManualResume({...manualResume, location: e.target.value})}
                     className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     placeholder="e.g., San Francisco, CA or Remote"
                   />
                 </div>
                 <div>
                   <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                   <input
                     type="url"
                     value={manualResume.linkedin || ''}
                     onChange={(e) => setManualResume({...manualResume, linkedin: e.target.value})}
                     className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     placeholder="https://linkedin.com/in/yourprofile"
                   />
                 </div>
               </div>
             </div>

             {/* Professional Summary Section */}
             <div className="mb-6 sm:mb-8">
               <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                 <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                 Professional Summary
               </h4>
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Professional Summary</label>
                 <textarea
                   value={manualResume.summary || ''}
                   onChange={(e) => setManualResume({...manualResume, summary: e.target.value})}
                   rows={3}
                   className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   placeholder="e.g., Experienced software engineer with 5+ years building scalable web applications. Passionate about clean code, user experience, and mentoring junior developers. Led teams of 3-5 developers and delivered projects on time and under budget."
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   A brief overview of your professional background and key strengths
                 </p>
               </div>
             </div>

             {/* Skills Section */}
             <div className="mb-6 sm:mb-8">
               <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                 <Code className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                 Skills & Technologies
               </h4>
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                   Key Skills & Technologies
                   <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                 </label>
                 <input
                   type="text"
                   value={skillsInput}
                   onChange={(e) => setSkillsInput(e.target.value)}
                   className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   placeholder="e.g., JavaScript, React, Node.js, Python, AWS, Docker, Agile, Leadership, Project Management"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Separate skills with commas. Include both technical and soft skills.
                 </p>
               </div>
             </div>

             {/* Experience Section */}
             <div className="mb-6 sm:mb-8">
               <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                 <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                 Work Experience
               </h4>
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                   Professional Experience Summary
                   <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                 </label>
                 <textarea
                   value={manualResume.experience}
                   onChange={(e) => setManualResume({...manualResume, experience: e.target.value})}
                   rows={4}
                   className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   placeholder="e.g., 5+ years of full-stack development experience with expertise in React, Node.js, and cloud technologies. Led development of scalable web applications and mentored junior developers. Successfully delivered 10+ projects with 99.9% uptime."
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Highlight your most relevant experience, achievements, and impact
                 </p>
               </div>
             </div>

             {/* Education Section */}
             <div className="mb-6 sm:mb-8">
               <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                 <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                 Education & Certifications
               </h4>
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                   Education & Certifications
                   <span className="text-xs text-gray-500 ml-1">(Used in emails)</span>
                 </label>
                 <textarea
                   value={manualResume.education}
                   onChange={(e) => setManualResume({...manualResume, education: e.target.value})}
                   rows={3}
                   className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   placeholder="e.g., Bachelor's in Computer Science from Stanford University, AWS Certified Solutions Architect, Google Cloud Professional Developer, Certified Scrum Master"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Include degrees, certifications, and relevant training
                 </p>
               </div>
             </div>

             {/* Website Section */}
             <div className="mb-6">
               <h4 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4 flex items-center">
                 <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                 Additional Information
               </h4>
               <div>
                 <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Personal Website/Portfolio</label>
                 <input
                   type="url"
                   value={manualResume.website || ''}
                   onChange={(e) => setManualResume({...manualResume, website: e.target.value})}
                   className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   placeholder="https://yourportfolio.com or https://github.com/yourusername"
                 />
                 <p className="text-xs text-gray-500 mt-1">
                   Optional: Your portfolio, GitHub, or personal website
                 </p>
               </div>
             </div>

             {/* Action Buttons */}
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-gray-200 space-y-3 sm:space-y-0">
               <div className="text-xs sm:text-sm text-gray-500">
                 <span className="text-red-500">*</span> Required fields • <span className="text-blue-500">(Used in emails)</span> = Will appear in generated emails
               </div>
               <button
                 onClick={addManualResume}
                 disabled={!manualResume.name || !manualResume.email}
                 className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
               >
                 {isEditing ? 'Update Resume Data' : 'Preview Resume Data'}
               </button>
             </div>
           </div>
         )}

         {/* Navigation Button */}
         {resumeData && !showPreview && onNext && (
           <div className="flex justify-end mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
             <button
               onClick={() => {
                 onResumeUpload(resumeData, uploadedFile || undefined);
                 onNext();
               }}
               className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
             >
               <span>Next: Upload Contacts</span>
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
               </svg>
             </button>
           </div>
         )}
       </div>
     </div>
   );
 } 