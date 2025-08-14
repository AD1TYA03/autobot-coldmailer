import { NextRequest, NextResponse } from 'next/server';
import { parsePDFServerSide } from '@/lib/pdfParser';
import { extractResumeWithAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Extract text from PDF first
    let text = '';
    // let parsingMethod = 'unknown';
    
    try {
      // Try server-side PDF text extraction
      text = await parsePDFServerSide(file);
      // parsingMethod = 'server-side';
      
      // Check if we got meaningful text
      if (text.length < 50 || !text.includes(' ') || text.includes('\x00')) {
        throw new Error('Insufficient text extracted');
      }
    } catch (pdfError) {
      console.warn('Server-side PDF parsing failed:', pdfError);
      
      // Return error to trigger client-side processing
      return NextResponse.json(
        { 
          error: 'PDF requires client-side processing',
          details: 'This PDF appears to be image-based and requires client-side processing. The client will automatically try alternative methods.',
          requiresClientProcessing: true,
          code: 'CLIENT_PROCESSING_REQUIRED'
        },
        { status: 200 }
      );
    }
    
    // Use AI to extract resume data from the text
    console.log('Using AI to extract resume data...');
    const resumeData = await extractResumeWithAI(text);

    // Validate that we extracted some data
    if (!resumeData.name || resumeData.name === 'Name not found' || resumeData.name === 'AI extraction failed') {
      return NextResponse.json(
        { 
          error: 'Could not extract resume information with AI',
          details: 'The AI was unable to extract meaningful information from your resume. Please try using the manual input option or ensure your resume contains clear text.',
          extractedData: resumeData,
          parsedText: text.substring(0, 500) + '...',
          parsingMethod: 'AI'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...resumeData,
      parsingMethod: 'AI'
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse resume',
        details: 'Please check that your PDF contains readable text. If the issue persists, try converting your PDF to a text-based format or use the manual input option.',
        technicalError: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 