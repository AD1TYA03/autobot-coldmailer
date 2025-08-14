import { NextRequest, NextResponse } from 'next/server';
import { parseContactsFromText, parseTablePDF, parseCSVFile } from '@/lib/pdfParser';

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

    if (file.type !== 'application/pdf' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a PDF or CSV' },
        { status: 400 }
      );
    }

    let contacts = [];
    let parsingMethod = '';

    try {
      if (file.name.endsWith('.csv')) {
        // Parse CSV file
        contacts = await parseCSVFile(file);
        parsingMethod = 'csv';
      } else {
        // Parse PDF file
        try {
          // First try the enhanced table parsing
          contacts = await parseTablePDF(file);
          parsingMethod = 'table';
        } catch (tableError) {
          console.log('Table parsing failed, trying text parsing:', tableError);
          
          // Fallback to basic text parsing
          const arrayBuffer = await file.arrayBuffer();
          const text = new TextDecoder().decode(arrayBuffer);
          contacts = await parseContactsFromText(text);
          parsingMethod = 'text';
        }
      }
    } catch (parseError) {
      console.error('Parsing error:', parseError);
      return NextResponse.json(
        { 
          error: 'Failed to parse file',
          details: 'Please ensure your file contains contact information in the correct format. You can also use the manual input option to add contacts.'
        },
        { status: 400 }
      );
    }

    // Validate that we found contacts
    if (contacts.length === 0) {
      return NextResponse.json(
        { 
          error: 'No contacts found in the file',
          details: 'Please ensure your file contains contact information in the format: SNo, Name, Email, Title, Company. You can also use the manual input option to add contacts.'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      contacts,
      message: `Successfully parsed ${contacts.length} contacts using ${parsingMethod} parsing`,
      parsingMethod
    });
  } catch (error) {
    console.error('Error parsing contacts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to parse contacts',
        details: 'Please check that your file contains readable text in the correct format. You can use the manual input option to add contacts.'
      },
      { status: 500 }
    );
  }
} 