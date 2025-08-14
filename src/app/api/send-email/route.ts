import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get('to') as string;
    const subject = formData.get('subject') as string;
    const emailBody = formData.get('body') as string;
    const senderEmail = formData.get('senderEmail') as string;
    const senderPassword = formData.get('senderPassword') as string;
    const resumeFile = formData.get('resumeFile') as File | null;

    if (!to || !subject || !emailBody || !senderEmail || !senderPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter for Vercel (no Cloudflare restrictions)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: senderEmail,
        pass: senderPassword,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    try {
      console.log('Verifying SMTP connection...');
      await transporter.verify();
      console.log('SMTP verification successful');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      return NextResponse.json(
        { 
          error: 'Email configuration failed',
          details: 'Please check your Gmail settings. Make sure you have enabled 2-Step Verification and are using an App Password, not your regular Gmail password.',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      );
    }

    // Email options
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${senderEmail.split('@')[0]}" <${senderEmail}>`,
      to: to,
      subject: subject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    // Add resume attachment if available
    if (resumeFile) {
      try {
        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        mailOptions.attachments = [{
          filename: resumeFile.name,
          content: buffer,
          contentType: resumeFile.type
        }];
      } catch (attachmentError) {
        console.error('Error processing attachment:', attachmentError);
        // Continue without attachment rather than failing
      }
    }

    // Send email
    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info);

    return NextResponse.json({
      success: true,
      messageId: (info as { messageId?: string }).messageId,
      message: 'Email sent successfully'
    });

  } catch (error: unknown) {
    console.error('Error sending email:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    let errorDetails = '';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      errorCode = code;
      
      if (code === 'EAUTH') {
        errorMessage = 'Gmail authentication failed';
        errorDetails = 'Please check your email and App Password. Make sure you have enabled 2-Step Verification and are using an App Password, not your regular Gmail password.';
      } else if (code === 'ECONNECTION') {
        errorMessage = 'Connection to Gmail failed';
        errorDetails = 'Please check your internet connection and try again.';
      } else if (code === 'ETIMEDOUT') {
        errorMessage = 'Email sending timed out';
        errorDetails = 'The request took too long to complete. Please try again.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: errorCode
      },
      { status: 500 }
    );
  }
} 