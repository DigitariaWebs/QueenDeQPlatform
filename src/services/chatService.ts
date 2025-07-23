// Chat service for communicating with the Reine-Mère AI backend

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  mode?: string;
}

export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  mode?: 'default' | 'dreamsInterpreter' | 'mysticalGuide';
}

export interface ChatResponse {
  success: boolean;
  message?: {
    role: 'assistant';
    content: string;
    timestamp: string;
    mode: string;
  };
  error?: string;
  fallbackMessage?: string;
}

export interface StreamChunk {
  type: 'chunk' | 'complete' | 'error';
  content?: string;
  fullMessage?: string;
  error?: string;
  fallbackMessage?: string;
  timestamp: string;
  mode?: string;
}

export interface AssistantMode {
  id: string;
  name: string;
  isDefault: boolean;
}

const API_BASE = '/api/ai';

class ChatService {
  // Convert frontend messages to API format
  private convertMessagesToAPIFormat(messages: Message[]): ChatRequest['messages'] {
    return messages.map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
  }

  // Standard chat (non-streaming)
  async sendMessage(messages: Message[], mode: string = 'default'): Promise<ChatResponse> {
    try {
      console.log('Sending chat request:', {
        messages: this.convertMessagesToAPIFormat(messages),
        mode
      });

      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.convertMessagesToAPIFormat(messages),
          mode
        })
      });

      const data = await response.json();
      console.log('Chat response:', data);

      if (!response.ok) {
        console.error('Chat error response:', data);
        throw new Error(data.error || 'Erreur de communication avec la Reine-Mère');
      }

      return data;
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre quelques difficultés en ce moment. Peux-tu réessayer dans quelques instants ?"
      };
    }
  }

  // Streaming chat
  async sendMessageStream(
    messages: Message[], 
    mode: string = 'default',
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    try {
      console.log('Sending streaming request:', {
        messages: this.convertMessagesToAPIFormat(messages),
        mode
      });

      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.convertMessagesToAPIFormat(messages),
          mode
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
        fallbackMessage: "Pardonne-moi, ma chère âme, mais je rencontre quelques difficultés en ce moment. Peux-tu réessayer dans quelques instants ?",
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get available modes
  async getModes(): Promise<AssistantMode[]> {
    try {
      console.log('Fetching available modes');
      const response = await fetch(`${API_BASE}/modes`);
      const data = await response.json();

      if (!response.ok) {
        console.error('Modes error response:', data);
        throw new Error(data.error || 'Erreur lors du chargement des modes');
      }

      console.log('Available modes:', data.modes);
      return data.modes;
    } catch (error) {
      console.error('Get modes error:', error);
      // Return default mode if API fails
      return [
        { id: 'default', name: 'La Reine-Mère', isDefault: true }
      ];
    }
  }
}

export const chatService = new ChatService(); 