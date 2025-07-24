import axios from 'axios';

export interface AIResponse {
  content: string;
  success: boolean;
  error?: string;
}

export interface GPTMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GPTRequest {
  model: string;
  messages: GPTMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface GPTResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

class AIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Set VITE_OPENAI_API_KEY environment variable.');
    }
  }

  async askGPT(question: string): Promise<AIResponse> {
    if (!this.apiKey) {
      return {
        content: '',
        success: false,
        error: 'OpenAI API key not configured. Please set VITE_OPENAI_API_KEY environment variable.'
      };
    }

    try {
      const request: GPTRequest = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      };

      const response = await axios.post<GPTResponse>(
        `${this.baseURL}/chat/completions`,
        request,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.choices && response.data.choices.length > 0) {
        return {
          content: response.data.choices[0].message.content,
          success: true
        };
      } else {
        return {
          content: '',
          success: false,
          error: 'No response from GPT'
        };
      }
    } catch (error) {
      let errorMessage = 'Unknown error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Invalid API key';
        } else if (error.response?.status === 429) {
          errorMessage = 'Rate limit exceeded';
        } else if (error.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        } else {
          errorMessage = error.message;
        }
      }

      return {
        content: '',
        success: false,
        error: errorMessage
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const aiService = new AIService();
