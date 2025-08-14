'use client';

import { useState } from 'react';
import { Upload, FileText, X, CheckCircle, Users, Plus, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Contact } from '@/types';
import { parseContactsFromText } from '@/lib/pdfParser';

interface ContactUploadProps {
  onContactsUpload: (contacts: Contact[]) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function ContactUpload({ onContactsUpload, onPrevious, onNext }: ContactUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [manualContact, setManualContact] = useState({
    name: '',
    email: '',
    title: '',
    company: ''
  });

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
    const file = files.find(file => 
      file.type === 'application/pdf' || file.name.endsWith('.csv')
    );
    
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.csv'))) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-contacts', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json() as { contacts: Contact[] };
        setContacts(data.contacts);
        setShowPreview(true); // Show preview after successful parsing
      } else {
        throw new Error('Failed to parse contacts');
      }
    } catch (error) {
      console.error('Error parsing contacts:', error);
      // Fallback to basic extraction
      const text = await file.text();
      const extractedContacts = await parseContactsFromText(text);
      setContacts(extractedContacts);
      setShowPreview(true); // Show preview after fallback parsing
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setContacts([]);
    setShowPreview(false);
  };

  const addManualContact = () => {
    if (manualContact.name && manualContact.email && manualContact.company) {
      const newContact: Contact = {
        sno: contacts.length + 1,
        name: manualContact.name,
        email: manualContact.email,
        title: manualContact.title,
        company: manualContact.company
      };
      
      const updatedContacts = [...contacts, newContact];
      setContacts(updatedContacts);
      
      // Reset form
      setManualContact({
        name: '',
        email: '',
        title: '',
        company: ''
      });
    }
  };

  const removeContact = (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    setContacts(updatedContacts);
  };

  const confirmContacts = () => {
    onContactsUpload(contacts);
    setShowPreview(false);
  };

  const loadSampleData = () => {
    const sampleContacts: Contact[] = [
      {
        sno: 1,
        name: "Akanksha Puri",
        email: "akanksha.puri@sourcefuse.com",
        title: "Associate Director HR",
        company: "SourceFuse Technologies"
      },
      {
        sno: 2,
        name: "Akhil Jogiparthi",
        email: "akhil@ibhubs.co",
        title: "Vice President - Talent Accelerator",
        company: "iB Hubs"
      },
      {
        sno: 3,
        name: "Akhila Chandan",
        email: "akhila@estuate.com",
        title: "Associate Vice President Human Resources",
        company: "Estuate"
      },
      {
        sno: 4,
        name: "Akshay Kumar",
        email: "akshay.kumar@techcorp.com",
        title: "Senior HR Manager",
        company: "TechCorp Solutions"
      },
      {
        sno: 5,
        name: "Anita Sharma",
        email: "anita.sharma@innovate.com",
        title: "HR Director",
        company: "InnovateTech"
      }
    ];
    setContacts(sampleContacts);
    setShowPreview(true);
  };

  const downloadSampleCSV = () => {
    const csvContent = `SNo,Name,Email,Title,Company
1,John Doe,john.doe@company.com,HR Manager,ABC Corp
2,Jane Smith,jane.smith@tech.com,Recruiter,Tech Solutions
3,Mike Johnson,mike.j@startup.com,HR Director,Startup Inc
4,Sarah Wilson,sarah.w@enterprise.com,Senior Recruiter,Enterprise Ltd
5,David Brown,david.b@consulting.com,HR Consultant,Consulting Group`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_contacts.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Contact List</h2>
        <p className="text-gray-600 mb-6">
          Upload a CSV file with contact information. The CSV should have columns for: Name, Email, Title (optional), and Company. 
          You can also upload a PDF with contact tables, or add contacts manually. Click &quot;Download Sample CSV&quot; to see the expected format.
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {contacts.length > 0 && `${contacts.length} contacts loaded`}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              <span>Add Contact Manually</span>
            </button>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <span>Download Sample CSV</span>
            </button>
            <button
              onClick={loadSampleData}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <span>Load Sample Data</span>
            </button>
          </div>
        </div>
        
        {!uploadedFile && !showPreview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your contacts PDF or CSV here
            </p>
            <p className="text-gray-500 mb-4">
              or click to browse files
            </p>
            <input
              type="file"
              accept=".pdf,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="contacts-upload"
            />
            <label
              htmlFor="contacts-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
            >
              Choose File
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadedFile && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Processing contacts...</span>
              </div>
            )}

            {showPreview && contacts.length > 0 && !isProcessing && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium text-lg">
                      {contacts.length} contacts processed successfully!
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <EyeOff className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Contact Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{stats.totalContacts}</div>
                    <div className="text-sm text-green-600">Total Contacts</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{stats.totalCompanies}</div>
                    <div className="text-sm text-green-600">Companies</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((stats.totalContacts / stats.totalCompanies) * 10) / 10}
                    </div>
                    <div className="text-sm text-green-600">Avg Contacts/Company</div>
                  </div>
                </div>

                {/* Company Breakdown */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Companies Found:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stats.companies.slice(0, 6).map((company) => {
                      const companyContacts = contacts.filter(c => c.company === company);
                      return (
                        <div key={company} className="flex justify-between items-center p-2 bg-white rounded border">
                          <span className="text-sm font-medium text-gray-900 truncate">{company}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {companyContacts.length} contact{companyContacts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                    {stats.companies.length > 6 && (
                      <div className="text-sm text-gray-500">
                        ... and {stats.companies.length - 6} more companies
                      </div>
                    )}
                  </div>
                </div>

                {/* Sample Contacts Preview */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Sample Contacts (First 5):</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {contacts.slice(0, 5).map((contact, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded border">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {contact.email}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {contact.title} at {contact.company}
                          </p>
                        </div>
                      </div>
                    ))}
                    {contacts.length > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {contacts.length - 5} more contacts
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirmation Button */}
                <div className="flex justify-end">
                  <button
                    onClick={confirmContacts}
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

         {/* Manual Contact Input */}
         {showManualInput && (
           <div className="mt-6 p-4 bg-gray-50 rounded-lg">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Contact Manually</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                 <input
                   type="text"
                   value={manualContact.name}
                   onChange={(e) => setManualContact({...manualContact, name: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Full Name"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                 <input
                   type="email"
                   value={manualContact.email}
                   onChange={(e) => setManualContact({...manualContact, email: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="email@company.com"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                 <input
                   type="text"
                   value={manualContact.title}
                   onChange={(e) => setManualContact({...manualContact, title: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Job Title"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                 <input
                   type="text"
                   value={manualContact.company}
                   onChange={(e) => setManualContact({...manualContact, company: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                   placeholder="Company Name"
                 />
               </div>
             </div>
             <button
               onClick={addManualContact}
               disabled={!manualContact.name || !manualContact.email || !manualContact.company}
               className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Add Contact
             </button>
           </div>
         )}

         {/* Contact List Display */}
         {contacts.length > 0 && !showPreview && (
           <div className="mt-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Loaded Contacts</h3>
             <div className="space-y-2 max-h-60 overflow-y-auto">
               {contacts.map((contact, index) => (
                 <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                   <div className="flex-1">
                     <p className="font-medium text-gray-900">{contact.name}</p>
                     <p className="text-sm text-gray-600">{contact.email}</p>
                     <p className="text-xs text-gray-500">{contact.title} at {contact.company}</p>
                   </div>
                   <button
                     onClick={() => removeContact(index)}
                     className="text-red-600 hover:text-red-700 p-1"
                     title="Remove contact"
                   >
                     <X className="h-4 w-4" />
                   </button>
                 </div>
               ))}
             </div>
             
             {/* Show Preview Button */}
             <div className="mt-4 flex justify-end">
               <button
                 onClick={() => setShowPreview(true)}
                 className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
               >
                 <Eye className="h-4 w-4" />
                 <span>Preview & Continue</span>
               </button>
             </div>
           </div>
         )}

         {/* Navigation Buttons */}
         {!showPreview && (
           <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
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
             
             {contacts.length > 0 && onNext && (
               <button
                 onClick={() => {
                   onContactsUpload(contacts);
                   onNext();
                 }}
                 className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 <span>Next: Generate Emails</span>
                 <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                 </svg>
               </button>
             )}
           </div>
         )}
       </div>
     </div>
   );
 } 