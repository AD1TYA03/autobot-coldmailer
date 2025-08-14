import { GoogleGenerativeAI } from '@google/generative-ai';
import { Contact, ResumeData } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Rate limiting and quota management
let requestCount = 0;
let lastRequestTime = 0;
const MAX_REQUESTS_PER_MINUTE = 15; // Conservative limit
const MIN_REQUEST_INTERVAL = 4000; // 4 seconds between requests

// Check if we should throttle requests
function shouldThrottle(): boolean {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return true;
  }
  if (requestCount >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  return false;
}

// Update request tracking
function updateRequestTracking() {
  requestCount++;
  lastRequestTime = Date.now();
  
  // Reset counter after a minute
  setTimeout(() => {
    requestCount = Math.max(0, requestCount - 1);
  }, 60000);
}

// Wait function for rate limiting
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// AI-powered resume extraction function
export async function extractResumeWithAI(pdfText: string): Promise<ResumeData> {
  try {
    // Check rate limiting
    if (shouldThrottle()) {
      console.warn('Rate limit reached, using fallback extraction');
      return extractResumeWithRegex(pdfText);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
You are an expert at extracting structured information from resumes. Please analyze the following resume text and extract the key information in a structured format.

RESUME TEXT:
${pdfText}

Please extract and return the following information in JSON format:

{
  "name": "Full name of the person",
  "email": "Email address",
  "phone": "Phone number (if available)",
  "experience": "Brief summary of work experience (2-3 sentences)",
  "education": "Educational background (degree, institution, etc.)",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"]
}

Guidelines:
- Extract the most relevant skills (focus on technical and professional skills)
- For experience, provide a concise summary of their work background
- For education, include degree and institution
- If any field is not found, use appropriate default values
- Ensure the name is properly extracted from the resume
- Look for email addresses in various formats
- Extract phone numbers in any format

Return ONLY the JSON object, no additional text.
`;

    updateRequestTracking();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      
      // Validate and provide defaults for missing fields
      return {
        name: parsed.name || 'Name not found',
        email: parsed.email || 'email@example.com',
        phone: parsed.phone || '',
        experience: parsed.experience || 'Professional experience',
        education: parsed.education || 'Education background',
        skills: Array.isArray(parsed.skills) ? parsed.skills : ['General skills'],
        parsingMethod: 'AI'
      };
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      
      // Fallback: try to extract basic information using regex
      const emailMatch = pdfText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      const phoneMatch = pdfText.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      
      return {
        name: 'Name extracted by AI',
        email: emailMatch ? emailMatch[0] : 'email@example.com',
        phone: phoneMatch ? phoneMatch[0] : '',
        experience: 'Experience extracted by AI',
        education: 'Education extracted by AI',
        skills: ['Skills extracted by AI'],
        parsingMethod: 'AI (fallback)'
      };
    }
  } catch (error) {
    console.error('Error in AI resume extraction:', error);
    
    // Check if it's a quota/rate limit error
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('limit')) {
      console.warn('Gemini API quota exceeded, using regex fallback');
      return extractResumeWithRegex(pdfText);
    }
    
    // Ultimate fallback
    return {
      name: 'AI extraction failed',
      email: 'ai@example.com',
      phone: '',
      experience: 'AI extraction failed',
      education: 'AI extraction failed',
      skills: ['AI extraction failed'],
      parsingMethod: 'AI (error)'
    };
  }
}

// Fallback function to extract resume data using regex patterns when AI is unavailable
export function extractResumeWithRegex(text: string): ResumeData {
  try {
    console.log('Using regex fallback for resume extraction...');
    
    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    const email = emailMatch ? emailMatch[0] : '';
    
    // Extract phone number
    const phoneMatch = text.match(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';
    
    // Extract name (look for patterns like "Name: John Doe" or "John Doe" at the beginning)
    let name = '';
    const namePatterns = [
      /(?:name|full name|fullname)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/m,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)(?=\s*[A-Za-z0-9._%+-]+@)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        name = match[1].trim();
        break;
      }
    }
    
    // Extract skills (look for common skill keywords)
    const skillKeywords = [
      'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go',
      'TypeScript', 'Angular', 'Vue.js', 'Express.js', 'Django', 'Flask', 'Spring', 'Laravel',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'Docker', 'Kubernetes',
      'Git', 'GitHub', 'CI/CD', 'REST API', 'GraphQL', 'Microservices', 'Machine Learning',
      'Data Science', 'SQL', 'NoSQL', 'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind',
      'Webpack', 'Babel', 'Jest', 'Mocha', 'Chai', 'Selenium', 'JUnit', 'PyTest'
    ];
    
    const foundSkills = skillKeywords.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    
    // Extract experience (look for experience-related sections)
    let experience = '';
    const experiencePatterns = [
      /(?:experience|work experience|professional experience|employment)[:\s]*([^]*?)(?=\n\s*(?:education|skills|projects|achievements|$))/i,
      /(?:experience|work experience|professional experience|employment)[:\s]*([^]*?)(?=\n\s*[A-Z][^]*?)/i
    ];
    
    for (const pattern of experiencePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        experience = match[1].trim().substring(0, 200) + (match[1].length > 200 ? '...' : '');
        break;
      }
    }
    
    // Extract education
    let education = '';
    const educationPatterns = [
      /(?:education|academic|degree)[:\s]*([^]*?)(?=\n\s*(?:experience|skills|projects|achievements|$))/i,
      /(?:bachelor|master|phd|degree)[:\s]*([^]*?)(?=\n\s*[A-Z][^]*?)/i
    ];
    
    for (const pattern of educationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        education = match[1].trim().substring(0, 150) + (match[1].length > 150 ? '...' : '');
        break;
      }
    }
    
    return {
      name: name || 'Resume Name',
      email: email || 'resume@example.com',
      phone: phone,
      experience: experience || 'Professional experience extracted from resume',
      education: education || 'Education background extracted from resume',
      skills: foundSkills.length > 0 ? foundSkills : ['General Skills'],
      parsingMethod: 'Regex Fallback'
    };
  } catch (error) {
    console.error('Error in regex fallback:', error);
    return {
      name: 'Resume Name',
      email: 'resume@example.com',
      phone: '',
      experience: 'Professional experience extracted from resume',
      education: 'Education background extracted from resume',
      skills: ['General Skills'],
      parsingMethod: 'Regex Fallback (Error)'
    };
  }
}

// Generate cold email with better error handling and rate limiting
export async function generateColdEmail(
  contact: Contact,
  resumeData: ResumeData
): Promise<{ subject: string; body: string }> {
  try {
    // Check rate limiting
    if (shouldThrottle()) {
      console.warn('Rate limit reached, using template-based email generation');
      return generateTemplateEmail(contact, resumeData);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
You are an expert at writing compelling cold emails for job applications. 
Please write a personalized cold email for the following:

CONTACT INFORMATION:
- Name: ${contact.name}
- Title: ${contact.title}
- Company: ${contact.company}
- Email: ${contact.email}

CANDIDATE INFORMATION:
- Name: ${resumeData.name}
- Experience: ${resumeData.experience}
- Skills: ${resumeData.skills.join(', ')}
- Education: ${resumeData.education}

Please create:
1. A compelling subject line (max 60 characters)
2. A personalized email body (max 300 words) that:
   - Shows you've researched the company
   - Highlights relevant skills and experience
   - Explains why you're interested in the company
   - Includes a clear call to action
   - Is professional but not overly formal
   - Mentions that you're attaching your resume

Format the response as JSON:
{
  "subject": "Your subject line here",
  "body": "Your email body here"
}
`;

    updateRequestTracking();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      return {
        subject: parsed.subject || 'Job Application - Your Name',
        body: parsed.body || 'Default email body'
      };
    } catch {
      // Fallback if JSON parsing fails
      const lines = text.split('\n');
      const subject = lines.find(line => line.includes('Subject:') || line.includes('subject:'))?.replace(/.*[Ss]ubject:\s*/, '') || 'Job Application - Your Name';
      const body = text.replace(/.*[Ss]ubject:.*\n/, '').trim();
      
      return {
        subject: subject.substring(0, 60),
        body: body.substring(0, 1500)
      };
    }
  } catch (error) {
    console.error('Error generating cold email:', error);
    
    // Check if it's a quota/rate limit error
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('limit')) {
      console.warn('Gemini API quota exceeded, using template-based email generation');
      return generateTemplateEmail(contact, resumeData);
    }
    
    // Fallback to template-based email
    return generateTemplateEmail(contact, resumeData);
  }
}

// Template-based email generation (fallback when AI is unavailable)
export function generateTemplateEmail(
  contact: Contact,
  resumeData: ResumeData
): { subject: string; body: string } {
  const templates = [
    {
      subject: `Job Application - ${resumeData.name} for ${contact.company}`,
      body: `Dear ${contact.name},

I hope this email finds you well. I am writing to express my interest in potential opportunities at ${contact.company}.

With my background in ${resumeData.experience} and skills in ${resumeData.skills.slice(0, 3).join(', ')}, I believe I could be a valuable addition to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how my experience aligns with your company's needs.

Thank you for your time and consideration.

Best regards,
${resumeData.name}
${resumeData.email}
${resumeData.phone ? resumeData.phone : ''}`
    },
    {
      subject: `Interested in joining ${contact.company} - ${resumeData.name}`,
      body: `Dear ${contact.name},

I hope you're having a great day. I'm reaching out because I'm very interested in the work ${contact.company} is doing and would love to explore potential opportunities to contribute to your team.

My experience in ${resumeData.experience} has equipped me with the skills needed to make an immediate impact. I'm particularly excited about ${contact.company}'s mission and believe my background in ${resumeData.skills.slice(0, 2).join(' and ')} would be valuable to your organization.

I've attached my resume and would appreciate the opportunity to discuss how I can contribute to ${contact.company}'s continued success.

Thank you for considering my application.

Best regards,
${resumeData.name}
${resumeData.email}`
    },
    {
      subject: `Career Opportunity at ${contact.company}`,
      body: `Dear ${contact.name},

I hope this message reaches you well. I am writing to express my strong interest in career opportunities at ${contact.company}.

With my background in ${resumeData.experience} and expertise in ${resumeData.skills.slice(0, 3).join(', ')}, I am confident I can bring valuable contributions to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how my skills and experience align with ${contact.company}'s needs.

Thank you for your time and consideration.

Best regards,
${resumeData.name}
${resumeData.email}
${resumeData.phone ? resumeData.phone : ''}`
    }
  ];

  // Randomly select a template
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

// Batch email generation with rate limiting
export async function generateBatchEmails(
  contacts: Contact[],
  resumeData: ResumeData,
  onProgress?: (current: number, total: number) => void
): Promise<Array<{ contact: Contact; subject: string; body: string }>> {
  const results = [];
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    
    try {
      // Rate limiting delay
      if (i > 0) {
        await wait(MIN_REQUEST_INTERVAL);
      }
      
      const emailData = await generateColdEmail(contact, resumeData);
      results.push({
        contact,
        subject: emailData.subject,
        body: emailData.body
      });
      
      // Update progress
      if (onProgress) {
        onProgress(i + 1, contacts.length);
      }
      
    } catch (error) {
      console.error(`Error generating email for ${contact.name}:`, error);
      
      // Use fallback template
      const fallbackEmail = generateTemplateEmail(contact, resumeData);
      results.push({
        contact,
        subject: fallbackEmail.subject,
        body: fallbackEmail.body
      });
      
      // Update progress
      if (onProgress) {
        onProgress(i + 1, contacts.length);
      }
    }
  }
  
  return results;
} 