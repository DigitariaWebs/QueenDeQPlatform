// Chat service for communicating with the Reine-Mère AI backend

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatRequest {
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  chatType?: 'poiche' | 'reine_mere_Diademe' | 'reine_mere_Couronne' | 'miroir_free' | 'miroir_paid';
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  message?: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
  usage?: any;
  error?: string;
  fallbackMessage?: string;
}

export interface ChatSessionSummary {
  _id?: string;
  id?: string;
  title: string;
  chatType?: 'poiche' | 'reine_mere_Diademe' | 'reine_mere_Couronne' | 'miroir_free' | 'miroir_paid';
  messageCount?: number;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
}

export interface ChatSessionWithMessages {
  _id?: string;
  id?: string;
  title: string;
  chatType?: 'poiche' | 'reine_mere_Diademe' | 'reine_mere_Couronne' | 'miroir_free' | 'miroir_paid';
  messages: Array<{
    _id?: string;
    content: string;
    sender: 'user' | 'assistant';
    createdAt?: string;
  }>;
}

export interface StreamChunk {
  type: 'chunk' | 'complete' | 'error';
  content?: string;
  fullMessage?: string;
  error?: string;
  fallbackMessage?: string;
  timestamp?: string;
}

const API_BASE = '/api/ai';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const userJson = localStorage.getItem('auth_user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.id) headers['x-user-id'] = String(user.id);
    }
  } catch {}
  return headers;
}

class ChatService {
  // Convert frontend messages to API format
  private convertMessagesToAPIFormat(messages: Message[]): ChatRequest['messages'] {
    return messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  async createSession(chatType: 'poiche' | 'reine_mere_Diademe' | 'reine_mere_Couronne' | 'miroir_free' | 'miroir_paid', title?: string): Promise<ChatSessionSummary> {
    const response = await fetch(`/api/ai/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, chatType })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to create session');
    return data.session as ChatSessionSummary;
  }

  async listSessions(): Promise<ChatSessionSummary[]> {
    const response = await fetch(`/api/ai/sessions`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch sessions');
    return data.sessions as ChatSessionSummary[];
  }

  async getSession(sessionId: string): Promise<ChatSessionWithMessages> {
    const response = await fetch(`/api/ai/sessions/${sessionId}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch session');
    return data.session as ChatSessionWithMessages;
  }

  async deleteSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/ai/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete session');
    return data;
  }

  // Standard chat (non-streaming)
  async sendMessage(
    messages: Message[],
  chatType: 'poiche' | 'reine_mere_Diademe' | 'reine_mere_Couronne' | 'miroir_free' | 'miroir_paid' = 'poiche',
    sessionId?: string
  ): Promise<ChatResponse> {
    try {
      console.log('Sending chat request:', {
        messages: this.convertMessagesToAPIFormat(messages),
        chatType: chatType,
        sessionId
      });

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          messages: this.convertMessagesToAPIFormat(messages),
          chatType: chatType,
          sessionId
        })
      });

      let data: ChatResponse;
      try { data = await response.json(); } catch { data = { success: false, error: 'Invalid server response' }; }
      console.log('Chat response:', data);

      if (!response.ok || !data.success) {
        console.error('Chat error response:', data);
        // Always return a user-friendly error response
        return {
          success: false,
          error: data.error || 'Erreur de communication avec la Reine-Mère',
          fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre une difficulté en ce moment. Peux-tu réessayer dans un instant ?"
        };
      }

      return data;
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre une difficulté en ce moment. Peux-tu réessayer dans un instant ?"
      };
    }
  }

  // Streaming chat
  async sendMessageStream(
    messages: Message[],
    onChunk: (chunk: StreamChunk) => void,
  chatType: 'poiche' | 'reine_mere_Diademe' | 'reine_mere_Couronne' | 'miroir_free' | 'miroir_paid' = 'poiche',
    sessionId?: string
  ): Promise<void> {
    try {
      console.log('Sending streaming request:', {
        messages: this.convertMessagesToAPIFormat(messages),
        chatType: chatType,
        sessionId
      });

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          messages: this.convertMessagesToAPIFormat(messages),
          chatType: chatType,
          sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Stream error response:', errorData);
        throw new Error(errorData.error || 'Erreur de communication avec la Reine-Mère');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming non supporté');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data: StreamChunk = JSON.parse(line);
            console.log('Stream chunk:', data);
            onChunk(data);
          } catch (e) {
            console.warn('Invalid JSON in stream:', line);
          }
        }
      }
    } catch (error) {
      console.error('Stream service error:', error);
      onChunk({
        type: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre une difficulté en ce moment. Peux-tu réessayer dans un instant ?",
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const chatService = new ChatService(); 