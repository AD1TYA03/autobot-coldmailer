# AutoBot - Cold Email Automation Platform

A beautiful, AI-powered web application for automating cold email campaigns for job applications. Built with Next.js, TypeScript, Tailwind CSS, and powered by Google's Gemini AI. This is a standard Next.js application that can be deployed to any platform.

## 🚀 Features

- **Resume Upload & Parsing**: Upload your resume PDF and automatically extract key information
- **Contact List Processing**: Upload PDF files with contact information and extract structured data
- **AI-Powered Email Generation**: Uses Gemini AI to create personalized cold emails for each contact
- **Email Automation**: Send personalized emails with your resume attached
- **Real-time Tracking**: Monitor email sending status and campaign performance
- **Beautiful UI**: Modern, responsive design with step-by-step workflow

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **AI**: Google Gemini API
- **Email**: Nodemailer with Gmail SMTP
- **UI Components**: Lucide React, Headless UI
- **PDF Processing**: Custom text extraction (basic implementation)

## 📋 Prerequisites

Before running this application, you'll need:

1. **Google Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Gmail Account**: For sending emails (with App Password enabled)
3. **Node.js**: Version 18 or higher

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd AutoBot
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Gemini API Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key to your `.env.local` file

### 4. Set Up Gmail App Password

For sending emails, you'll need a Gmail App Password:

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to [Google Account settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification
   - Follow the setup process

2. **Generate App Password**:
   - Go to [Google Account settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification
   - Scroll down and click "App passwords"
   - Select "Mail" as the app and "Other" as the device
   - Click "Generate"
   - Copy the 16-character password (e.g., "abcd efgh ijkl mnop")

3. **Use the App Password**:
   - In the email sending step, use your Gmail address
   - Use the 16-character App Password (without spaces)
   - **Never use your regular Gmail password**

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 How to Use

### Step 1: Upload Your Resume
- Drag and drop your resume PDF or click to browse
- The system will extract your name, email, skills, and experience
- Review the extracted information

### Step 2: Upload Contact List
- Upload a PDF containing contact information in this format:
  ```
  SNo Name Email Title Company
  1 Akanksha Puri akanksha.puri@sourcefuse.com Associate Director HR SourceFuse Technologies
  2 Akhil Jogiparthi akhil@ibhubs.co Vice President - Talent Accelerator iB Hubs
  ```

### Step 3: Generate Emails
- Click "Generate Personalized Emails"
- The AI will create unique emails for each contact
- Preview and review the generated emails

### Step 4: Send Emails
- Enter your Gmail credentials (email + app password)
- Click "Send Emails" to start the campaign
- Monitor real-time sending progress

### Step 5: Track Results
- View campaign statistics and success rates
- Export reports for your records

## 🔧 Configuration

### Email Settings

The application uses Gmail SMTP for sending emails. Make sure to:

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password specifically for this application
3. Use the App Password instead of your regular Gmail password

### Rate Limiting

The application includes built-in delays to respect API rate limits:
- 1 second delay between email generation requests
- 2 second delay between email sending requests

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── parse-resume/     # Resume parsing API
│   │   ├── parse-contacts/   # Contact parsing API
│   │   └── send-email/       # Email sending API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ResumeUpload.tsx      # Resume upload component
│   ├── ContactUpload.tsx     # Contact upload component
│   ├── EmailGenerator.tsx    # AI email generation
│   └── EmailSender.tsx       # Email sending interface
├── lib/
│   ├── gemini.ts            # Gemini AI integration
│   └── pdfParser.ts         # PDF text extraction
└── types/
    └── index.ts             # TypeScript type definitions
```

## 🚨 Important Notes

### Security
- Never commit your `.env.local` file to version control
- Use Gmail App Passwords instead of your regular password
- The application runs client-side, so API keys are visible in the browser

### Limitations
- PDF parsing is basic and may not work perfectly with all formats
- Email sending requires Gmail SMTP configuration
- Rate limits apply to both Gemini API and Gmail SMTP

### Production Considerations
- Add proper error handling and validation
- Implement database storage for tracking
- Add email templates and customization options
- Consider using a dedicated email service (SendGrid, Mailgun, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Troubleshooting

### Common Issues:

#### Gmail Authentication Errors
If you see "Username and Password not accepted" errors:

1. **Make sure 2-Step Verification is enabled** on your Google Account
2. **Use App Password, not your regular password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a new App Password for "Mail"
   - Use the 16-character password (remove spaces)
3. **Check your email address** is correct
4. **Wait a few minutes** after generating a new App Password

#### Gemini API Errors
If email generation fails:

1. **Verify your API key** is correct and active
2. **Check your API quota** at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Ensure the API key** is in your `.env.local` file

#### PDF Parsing Issues
If contact/resume extraction fails:

1. **Check PDF format** - ensure it's text-based, not scanned images
2. **Verify contact format** matches: `SNo Name Email Title Company`
3. **Try a different PDF** if the current one doesn't work

#### General Issues
1. Check the browser console for error messages
2. Restart the development server: `npm run dev`
3. Clear browser cache and try again

## 🚀 Deployment

This is a standard Next.js application that can be deployed to any platform:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Upload the .next folder to Netlify
```

### Railway
```bash
# Connect your GitHub repository to Railway
# Railway will automatically detect Next.js and deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
Make sure to set these environment variables in your deployment platform:
- `NEXT_PUBLIC_GEMINI_API_KEY`: Your Google Gemini API key

## 🔮 Future Enhancements

- [ ] Advanced PDF parsing with OCR
- [ ] Email template customization
- [ ] Database integration for persistent storage
- [ ] Email tracking and analytics
- [ ] Multi-language support
- [ ] Integration with job boards
- [ ] A/B testing for email templates
