import { Contact } from '@/types';

// Import PDF.js for better PDF parsing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

// Import Tesseract.js for OCR
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Tesseract: any = null;

// Dynamically import PDF.js (only on client side)
if (typeof window !== 'undefined') {
  import('pdfjs-dist').then((pdfjs) => {
    pdfjsLib = pdfjs;
    if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
  }).catch((error) => {
    console.error('Failed to load PDF.js:', error);
  });
}

// Initialize Tesseract.js when needed
async function initializeTesseract() {
  if (Tesseract) {
    return Tesseract;
  }

  if (typeof window === 'undefined') {
    throw new Error('Tesseract.js is only available on client-side');
  }

  try {
    console.log('Loading Tesseract.js...');
    const tesseractModule = await import('tesseract.js');
    Tesseract = tesseractModule;
    console.log('Tesseract.js loaded successfully');
    return Tesseract;
  } catch (error) {
    console.error('Failed to load Tesseract.js:', error);
    throw new Error('Tesseract.js could not be loaded');
  }
}

export async function parseContactsFromText(text: string): Promise<Contact[]> {
  const lines = text.split('\n').filter(line => line.trim());
  const contacts: Contact[] = [];
  
  // Enhanced parsing for table-structured data
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and headers
    if (!line || 
        line.toLowerCase().includes('sno') && line.toLowerCase().includes('name') ||
        line.toLowerCase().includes('serial') ||
        line.toLowerCase().includes('no.') ||
        line.toLowerCase().includes('name') && line.toLowerCase().includes('email') && line.toLowerCase().includes('title')) {
      continue;
    }
    
    // Try to parse the line using multiple strategies
    const contact = parseTableRow(line) || parseContactLine(line);
    if (contact) {
      contacts.push(contact);
    }
  }

  return contacts;
}

// CSV parsing function
export async function parseCSVFile(file: File): Promise<Contact[]> {
  try {
    console.log('Parsing CSV file:', file.name);
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log('CSV lines found:', lines.length);
    console.log('First few lines:', lines.slice(0, 3));
    
    const contacts: Contact[] = [];
    let headerFound = false;
    let headerIndex = -1;
    
    // Find header row
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('name') && line.includes('email') && (line.includes('company') || line.includes('title'))) {
        headerFound = true;
        headerIndex = i;
        console.log('Header found at line:', i + 1);
        break;
      }
    }
    
    // Parse contacts starting after header
    const startIndex = headerFound ? headerIndex + 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Parse CSV line
      const contact = parseCSVLine(line, i + 1);
      if (contact) {
        contact.sno = contacts.length + 1; // Ensure sequential numbering
        contacts.push(contact);
      }
    }
    
    console.log('Parsed contacts:', contacts.length);
    
    if (contacts.length === 0) {
      throw new Error('No valid contacts found in CSV file. Please check the format.');
    }
    
    return contacts;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function parseCSVLine(line: string, lineNumber: number): Contact | null {
  try {
    // Split by comma and handle quoted values
    const parts = parseCSVLineParts(line);
    
    console.log(`Line ${lineNumber} parts:`, parts);
    
    if (parts.length < 3) {
      console.log(`Line ${lineNumber}: Insufficient parts (${parts.length})`);
      return null;
    }
    
    // Try different parsing strategies based on number of parts
    let sno = 1;
    let name = '';
    let email = '';
    let title = '';
    let company = '';
    
    if (parts.length >= 5) {
      // Format: SNo, Name, Email, Title, Company
      sno = parseInt(parts[0]) || 1;
      name = parts[1] || '';
      email = parts[2] || '';
      title = parts[3] || '';
      company = parts[4] || '';
    } else if (parts.length === 4) {
      // Format: Name, Email, Title, Company (no SNo)
      name = parts[0] || '';
      email = parts[1] || '';
      title = parts[2] || '';
      company = parts[3] || '';
    } else if (parts.length === 3) {
      // Format: Name, Email, Company (no SNo, no Title)
      name = parts[0] || '';
      email = parts[1] || '';
      company = parts[2] || '';
    }
    
    // Clean and validate the parsed data
    name = name.trim().replace(/^["']|["']$/g, '');
    email = email.trim().replace(/^["']|["']$/g, '');
    title = title.trim().replace(/^["']|["']$/g, '');
    company = company.trim().replace(/^["']|["']$/g, '');
    
    // Validation
    if (!name || name.length < 2) {
      console.log(`Line ${lineNumber}: Invalid name: "${name}"`);
      return null;
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      console.log(`Line ${lineNumber}: Invalid email: "${email}"`);
      return null;
    }
    
    if (!company || company.length < 2) {
      console.log(`Line ${lineNumber}: Invalid company: "${company}"`);
      return null;
    }
    
    const contact: Contact = {
      sno,
      name,
      email,
      title: title || 'Not specified',
      company
    };
    
    console.log(`Line ${lineNumber}: Valid contact parsed:`, contact);
    return contact;
    
  } catch (error) {
    console.error(`Error parsing line ${lineNumber}:`, error);
    return null;
  }
}

function parseCSVLineParts(line: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last part
  parts.push(current.trim());
  
  // Clean up parts - remove empty quotes and normalize
  return parts.map(part => {
    // Remove surrounding quotes if they exist
    let cleaned = part.replace(/^["']+|["']+$/g, '');
    // Remove extra whitespace
    cleaned = cleaned.trim();
    return cleaned;
  });
}

function parseTableRow(line: string): Contact | null {
  // Remove extra whitespace and normalize
  const cleanLine = line.replace(/\s+/g, ' ').trim();
  
  // Split by multiple spaces (table format)
  const parts = cleanLine.split(/\s{2,}/);
  
  if (parts.length < 4) {
      // Try splitting by single spaces if multiple space split didn't work
  // const spaceParts = cleanLine.split(' ');
  return parseContactLine(cleanLine);
  }
  
  // For table format, we expect: SNo | Name | Email | Title | Company
  const sno = parseInt(parts[0]) || 1;
  const name = parts[1] || '';
  const email = parts[2] || '';
  const title = parts[3] || '';
  const company = parts[4] || '';
  
  // Validate the parsed data
  if (!name || !email || !company || !email.includes('@')) {
    return null;
  }
  
  return {
    sno,
    name: name.trim(),
    email: email.trim(),
    title: title.trim(),
    company: company.trim()
  };
}

function parseContactLine(line: string): Contact | null {
  // Remove extra whitespace and normalize
  const cleanLine = line.replace(/\s+/g, ' ').trim();
  
  // Split by spaces and look for email pattern
  const parts = cleanLine.split(' ');
  
  // Find email in the parts
  const emailIndex = parts.findIndex(part => 
    part.includes('@') && part.includes('.') && 
    !part.includes('http') && !part.includes('www')
  );
  
  if (emailIndex === -1) return null;
  
  const email = parts[emailIndex];
  
  // Try to find SNo (should be first part and numeric)
  let sno = 1;
  if (parts[0] && !isNaN(Number(parts[0]))) {
    sno = parseInt(parts[0]);
  }
  
  // Extract name (everything between SNo and email)
  const nameParts = parts.slice(1, emailIndex);
  const name = nameParts.join(' ');
  
  // Extract title and company (everything after email)
  const remainingParts = parts.slice(emailIndex + 1);
  
  // Try to identify company (usually the last part)
  let company = '';
  let title = '';
  
  if (remainingParts.length > 0) {
    // Look for common company indicators
    const companyIndicators = ['Technologies', 'Systems', 'Solutions', 'Ltd', 'Inc', 'Corp', 'Company', 'Group'];
    const lastPart = remainingParts[remainingParts.length - 1];
    
    if (companyIndicators.some(indicator => lastPart.includes(indicator))) {
      company = lastPart;
      title = remainingParts.slice(0, -1).join(' ');
    } else {
      // If no clear company indicator, assume last part is company
      company = lastPart;
      title = remainingParts.slice(0, -1).join(' ');
    }
  }
  
  // Validate the parsed data
  if (!name || !email || !company) {
    return null;
  }
  
  return {
    sno,
    name: name.trim(),
    email: email.trim(),
    title: title.trim(),
    company: company.trim()
  };
}

// Enhanced PDF parsing function specifically for table-structured PDFs
export async function parseTablePDF(file: File): Promise<Contact[]> {
  if (!pdfjsLib) {
    throw new Error('PDF.js not loaded');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const contacts: Contact[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extract text items with their positions
      const textItems = textContent.items.map((item: { str: string; transform: number[] }) => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5]
      }));
      
      // Group text items by rows (similar Y positions)
      const rows = groupTextByRows(textItems);
      
      // Parse each row
      for (const row of rows) {
        const contact = parseTableRowFromItems(row);
        if (contact) {
          contacts.push(contact);
        }
      }
    }
    
    return contacts;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
  }
}

function groupTextByRows(textItems: { text: string; x: number; y: number }[]) {
  // Group items by Y position (rows)
  const rowGroups: { [key: number]: { text: string; x: number; y: number }[] } = {};
  
  textItems.forEach(item => {
    const yKey = Math.round(item.y);
    if (!rowGroups[yKey]) {
      rowGroups[yKey] = [];
    }
    rowGroups[yKey].push(item);
  });
  
  // Convert to arrays and sort by X position
  return Object.values(rowGroups)
    .map(row => row.sort((a, b) => a.x - b.x))
    .sort((a, b) => b[0]?.y - a[0]?.y); // Sort by Y position (top to bottom)
}

function parseTableRowFromItems(rowItems: { text: string; x: number; y: number }[]): Contact | null {
  if (rowItems.length < 4) return null;
  
  // Join text items in the row
  const rowText = rowItems.map(item => item.text).join(' ').trim();
  
  // Skip header rows
  if (rowText.toLowerCase().includes('sno') || 
      rowText.toLowerCase().includes('name') && rowText.toLowerCase().includes('email')) {
    return null;
  }
  
  // Try to extract structured data
  const parts = rowText.split(/\s{2,}/);
  
  if (parts.length >= 4) {
    const sno = parseInt(parts[0]) || 1;
    const name = parts[1] || '';
    const email = parts[2] || '';
    const title = parts[3] || '';
    const company = parts[4] || '';
    
    if (name && email && company && email.includes('@')) {
      return {
        sno,
        name: name.trim(),
        email: email.trim(),
        title: title.trim(),
        company: company.trim()
      };
    }
  }
  
  return null;
}

export async function extractResumeData(text: string) {
  // Enhanced resume data extraction with better parsing logic
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract email with better regex
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone with multiple formats
  const phonePatterns = [
    /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // Standard US format
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/, // Simple format
    /\(\d{3}\)\s?\d{3}[-.\s]?\d{4}/, // (123) 456-7890
    /\+\d{1,3}\s?\d{1,4}\s?\d{1,4}\s?\d{1,4}/ // International format
  ];
  
  let phone = '';
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      phone = match[0];
      break;
    }
  }
  
  // Enhanced name extraction - look for patterns that indicate a name
  let name = '';
  const namePatterns = [
    /^[A-Z][a-z]+ [A-Z][a-z]+$/, // First Last
    /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/, // First M. Last
    /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/ // First Middle Last
  ];
  
  // Look in first 10 lines for name patterns
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    
    // Skip lines that are clearly not names
    if (line.toLowerCase().includes('email') || 
        line.toLowerCase().includes('phone') ||
        line.toLowerCase().includes('experience') ||
        line.toLowerCase().includes('education') ||
        line.toLowerCase().includes('resume') ||
        line.toLowerCase().includes('cv') ||
        line.toLowerCase().includes('objective') ||
        line.toLowerCase().includes('summary') ||
        line.length < 3 ||
        line.length > 50) {
      continue;
    }
    
    // Check if line matches name patterns
    for (const pattern of namePatterns) {
      if (pattern.test(line)) {
        name = line;
        break;
      }
    }
    
    // If no pattern match, try to find a line that looks like a name
    if (!name && line.split(' ').length >= 2 && line.split(' ').length <= 4) {
      const words = line.split(' ');
      const allWordsCapitalized = words.every(word => 
        word.length > 0 && word[0] === word[0].toUpperCase() && word.slice(1) === word.slice(1).toLowerCase()
      );
      
      if (allWordsCapitalized && !line.includes('@') && !line.includes('.com')) {
        name = line;
        break;
      }
    }
  }
  
  // Enhanced skills extraction
  const skillKeywords = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala',
    // Web Technologies
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express.js', 'Django', 'Flask', 'Spring', 'Laravel', 'ASP.NET',
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite', 'Cassandra', 'DynamoDB',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub', 'CI/CD', 'DevOps',
    // Tools & Frameworks
    'Git', 'Jira', 'Confluence', 'Slack', 'Trello', 'Asana', 'Figma', 'Adobe Creative Suite', 'Photoshop', 'Illustrator',
    // Data & AI
    'Machine Learning', 'Data Analysis', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn',
    // Methodologies
    'Agile', 'Scrum', 'Kanban', 'Waterfall', 'Lean', 'Six Sigma',
    // Soft Skills
    'Project Management', 'Team Leadership', 'Communication', 'Problem Solving', 'Critical Thinking', 'Time Management',
    // Design
    'UI/UX', 'User Experience', 'User Interface', 'Wireframing', 'Prototyping', 'Responsive Design',
    // Testing
    'Unit Testing', 'Integration Testing', 'Test-Driven Development', 'Jest', 'Mocha', 'Cypress', 'Selenium'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Extract experience summary
  let experience = '';
  const experienceKeywords = ['experience', 'work history', 'employment', 'career'];
  for (const keyword of experienceKeywords) {
    const index = text.toLowerCase().indexOf(keyword);
    if (index !== -1) {
      const startIndex = index + keyword.length;
      const endIndex = Math.min(startIndex + 200, text.length);
      experience = text.substring(startIndex, endIndex).trim();
      break;
    }
  }
  
  if (!experience) {
    experience = 'Professional experience extracted from resume';
  }
  
  // Extract education summary
  let education = '';
  const educationKeywords = ['education', 'academic', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
  for (const keyword of educationKeywords) {
    const index = text.toLowerCase().indexOf(keyword);
    if (index !== -1) {
      const startIndex = index + keyword.length;
      const endIndex = Math.min(startIndex + 150, text.length);
      education = text.substring(startIndex, endIndex).trim();
      break;
    }
  }
  
  if (!education) {
    education = 'Education background extracted from resume';
  }
  
  // If name is still not found, try a fallback approach
  if (!name) {
    // Look for the first line that has 2-4 capitalized words
    for (const line of lines.slice(0, 5)) {
      const words = line.split(' ').filter(word => word.length > 0);
      if (words.length >= 2 && words.length <= 4) {
        const capitalizedWords = words.filter(word => 
          word[0] === word[0].toUpperCase() && 
          word.length > 1 && 
          !word.includes('@') && 
          !word.includes('.com') &&
          !word.includes('.org') &&
          !word.includes('.edu')
        );
        
        if (capitalizedWords.length >= 2) {
          name = capitalizedWords.slice(0, 2).join(' ');
          break;
        }
      }
    }
  }
  
  // Final fallback for name
  if (!name) {
    name = 'Name extracted from resume';
  }
  
  return {
    name,
    email,
    phone,
    experience,
    skills: foundSkills,
    education
  };
}

// Server-side PDF parsing function for API routes
export async function parsePDFServerSide(file: File): Promise<string> {
  try {
    // For server-side PDF parsing, we'll use a different approach
    // First try to extract text using the file's text content
    const arrayBuffer = await file.arrayBuffer();
    
    // Try to decode as UTF-8 text first (works for some PDFs)
    try {
      const text = new TextDecoder('utf-8').decode(arrayBuffer);
      // If we get readable text, return it
      if (text.length > 100 && text.includes(' ') && !text.includes('\x00')) {
        return text;
      }
    } catch {
      // Continue to next method
    }
    
    // If that doesn't work, try different encodings
    const encodings = ['utf-8', 'latin1', 'ascii'];
    for (const encoding of encodings) {
      try {
        const text = new TextDecoder(encoding).decode(arrayBuffer);
        if (text.length > 100 && text.includes(' ') && !text.includes('\x00')) {
          return text;
        }
      } catch {
        continue;
      }
    }
    
    // If all else fails, return a basic extraction
    const basicText = new TextDecoder().decode(arrayBuffer);
    return basicText;
  } catch (error) {
    console.error('Error parsing PDF server-side:', error);
    throw new Error('Failed to parse PDF file');
  }
}

// Enhanced PDF parsing function using PDF.js (client-side only)
export async function parsePDFFile(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return parsePDFServerSide(file);
  }

  if (!pdfjsLib) {
    throw new Error('PDF.js not loaded');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: { str: string }) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    // Fallback to server-side parsing
    return parsePDFServerSide(file);
  }
} 

// OCR-based PDF parsing function
export async function parsePDFWithOCR(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('OCR is only available on client-side');
  }

  try {
    console.log('Starting OCR processing...');
    
    // Initialize Tesseract.js
    const tesseract = await initializeTesseract();
    
    // Convert PDF to images first
    const images = await convertPDFToImages(file);
    console.log(`Converted PDF to ${images.length} images`);
    
    let fullText = '';

    // Process each page with OCR
    for (let i = 0; i < images.length; i++) {
      console.log(`Processing page ${i + 1} with OCR...`);
      
      try {
        const result = await tesseract.recognize(
          images[i],
          'eng' // English language
        );

        console.log(`Page ${i + 1} OCR result:`, result.data.text.substring(0, 100) + '...');
        fullText += result.data.text + '\n';
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError);
        // Continue with other pages
        fullText += `[Error processing page ${i + 1}]\n`;
      }
    }

    console.log('OCR processing completed, total text length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw new Error(`Failed to process PDF with OCR: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Convert PDF to images for OCR processing
async function convertPDFToImages(file: File): Promise<string[]> {
  if (!pdfjsLib) {
    throw new Error('PDF.js not loaded');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Set viewport for rendering
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page to canvas
      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise;

      // Convert canvas to data URL
      const imageDataUrl = canvas.toDataURL('image/png');
      images.push(imageDataUrl);
    }

    return images;
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw new Error('Failed to convert PDF to images');
  }
}

// Enhanced PDF parsing with OCR fallback
export async function parsePDFWithOCRFallback(file: File): Promise<string> {
  try {
    // First try regular PDF text extraction
    console.log('Attempting regular PDF text extraction...');
    const regularText = await parsePDFServerSide(file);
    
    // Check if we got meaningful text
    if (regularText.length > 100 && regularText.includes(' ') && !regularText.includes('\x00')) {
      console.log('Regular PDF extraction successful');
      return regularText;
    }

    // If regular extraction failed, try OCR
    console.log('Regular extraction failed, trying OCR...');
    let ocrText = '';
    
    try {
      ocrText = await parsePDFWithOCR(file);
    } catch (ocrError) {
      console.log('Complex OCR failed, trying simple OCR...');
      try {
        ocrText = await simpleOCRExtraction(file);
      } catch (simpleOcrError) {
        console.error('Both OCR methods failed:', simpleOcrError);
        throw ocrError; // Throw the original error
      }
    }
    
    if (ocrText && ocrText.length > 50) {
      console.log('OCR extraction successful, extracted text length:', ocrText.length);
      return ocrText;
    }

    // If both failed, return the best we have
    console.log('Both methods failed, returning best available text');
    return regularText || ocrText || '';

  } catch (error) {
    console.error('Error in PDF parsing with OCR fallback:', error);
    // Fallback to basic text extraction
    try {
      const arrayBuffer = await file.arrayBuffer();
      return new TextDecoder().decode(arrayBuffer);
    } catch (fallbackError) {
      console.error('Even fallback extraction failed:', fallbackError);
      return '';
    }
  }
} 

// Simple fallback OCR method that doesn't rely on complex PDF.js conversion
export async function simpleOCRExtraction(file: File): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('OCR is only available on client-side');
  }

  try {
    console.log('Attempting simple OCR extraction...');
    
    // Check if it's a PDF file
    if (file.type === 'application/pdf') {
      console.log('PDF detected, trying direct text extraction first...');
      
      try {
        // Try direct PDF text extraction first using a simpler approach
        const arrayBuffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        
        // Look for text content in the PDF
        if (text.length > 100 && text.includes(' ') && !text.includes('\x00')) {
          console.log('Direct PDF text extraction completed, text length:', text.length);
          console.log('Sample text:', text.substring(0, 200));
          return text;
        } else {
          console.log('Direct PDF text extraction failed - insufficient text, trying OCR...');
        }
      } catch (pdfError) {
        console.warn('Direct PDF text extraction failed:', pdfError);
        console.log('Falling back to OCR for PDF...');
      }
      
      // If direct extraction failed, try a different approach
      console.log('Trying alternative PDF text extraction...');
      try {
        // Use a simpler PDF.js approach without external workers
        const { getDocument } = await import('pdfjs-dist');
        
        // Disable worker to avoid CDN issues
        const pdf = await getDocument({ 
          data: await file.arrayBuffer(),
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true
        }).promise;
        
        let extractedText = '';
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => 'str' in item ? item.str : '')
            .join(' ');
          extractedText += pageText + '\n';
        }
        
        if (extractedText.length > 50 && extractedText.includes(' ')) {
          console.log('PDF.js text extraction successful!');
          return extractedText;
        }
      } catch (pdfjsError) {
        console.warn('PDF.js extraction failed:', pdfjsError);
      }
      
      // If all PDF extraction methods failed, try basic text extraction
      console.log('All PDF extraction methods failed, trying basic text extraction...');
      try {
        const arrayBuffer = await file.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        
        // Extract readable text from the raw PDF data
        const textMatch = text.match(/\(([^)]+)\)/g);
        if (textMatch && textMatch.length > 10) {
          const extractedText = textMatch
            .map(match => match.replace(/[()]/g, ''))
            .filter(str => str.length > 3 && str.includes(' '))
            .join(' ');
          
          if (extractedText.length > 100) {
            console.log('Basic PDF text extraction successful!');
            return extractedText;
          }
        }
      } catch (basicError) {
        console.warn('Basic text extraction failed:', basicError);
      }
      
      // If all text extraction methods failed, throw an error
      throw new Error('All PDF text extraction methods failed. Please try uploading an image version of your resume.');
      
    } else {
      // For image files, use OCR directly
      console.log('Image file detected, using OCR directly...');
      
      // Initialize Tesseract.js
      const tesseract = await initializeTesseract();
      
      // Convert file to a simple image format first
      const imageUrl = URL.createObjectURL(file);
      
      try {
        console.log('Processing image with Tesseract...');
        const result = await tesseract.recognize(
          imageUrl,
          'eng'
        );
        
        console.log('OCR result:', result.data.text.substring(0, 100) + '...');
        URL.revokeObjectURL(imageUrl);
        return result.data.text;
      } catch (ocrError) {
        URL.revokeObjectURL(imageUrl);
        console.error('OCR processing error:', ocrError);
        throw ocrError;
      }
    }
  } catch (error) {
    console.error('Simple OCR extraction failed:', error);
    throw new Error(`Simple OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}