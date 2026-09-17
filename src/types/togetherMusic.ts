import { Contact } from './phone';

export interface TogetherMessage {
  id: string;
  sender: 'user' | 'contact';
  text: string;
  timestamp: number;
  songName?: string;
  artistName?: string;
}

export interface TogetherSession {
  contact: Contact;
  startTime: number;
  lastCommentTime: number;
}
