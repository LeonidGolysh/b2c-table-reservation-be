export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
}
