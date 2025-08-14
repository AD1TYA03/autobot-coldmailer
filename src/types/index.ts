export interface Contact {
  sno: number;
  name: string;
  email: string;
  title: string;
  company: string;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  body: string;
  company: string;
  contact: Contact;
}

export interface EmailTracking {
  id: string;
  contact: Contact;
  emailTemplate: EmailTemplate;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'replied';
  sentAt?: Date;
  openedAt?: Date;
  repliedAt?: Date;
  error?: string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  experience: string;
  skills: string[];
  education: string;
  parsingMethod?: string;
  title?: string;
  location?: string;
  linkedin?: string;
  website?: string;
  summary?: string;
}

export interface ApplicationState {
  resume: ResumeData | null;
  contacts: Contact[];
  emailTemplates: EmailTemplate[];
  emailTracking: EmailTracking[];
  isLoading: boolean;
  error: string | null;
} 