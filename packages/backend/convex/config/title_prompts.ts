/**
 * Title Generation Prompts Configuration
 *
 * Based on the requirements for generating concise, descriptive titles
 * for chat conversations using AI structured data generation.
 */

export const TITLE_GENERATION_PROMPT = `You are tasked with generating a concise, descriptive title for a chat conversation based on the initial messages. The title should:

1. Be 2-6 words long
2. Capture the main topic or question being discussed  
3. Be clear and specific
4. Use title case (capitalize first letter of each major word)
5. Not include quotation marks or special characters
6. Be professional and appropriate

Examples of good titles:
- "Python Data Analysis Help"
- "React Component Design"
- "Travel Planning Italy"
- "Budget Spreadsheet Formula"
- "Career Change Advice"
- "Database Schema Design"
- "API Development Guide"
- "Frontend Performance Tips"
- "DevOps Best Practices"
- "Mobile App Architecture"

Generate a title that accurately represents what this conversation is about based on the messages provided.`;

export const TITLE_GENERATION_SYSTEM_PROMPT = `You are an expert at analyzing conversations and creating concise, descriptive titles. Focus on the main topic or intent of the conversation. Keep titles professional and clear.`;

/**
 * Schema for title generation using AI SDK structured data
 * This can be used with generateObject from the AI SDK
 */
export const TITLE_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'A concise, descriptive title for the conversation (2-6 words)',
      minLength: 5,
      maxLength: 50,
    },
    category: {
      type: 'string',
      description: 'The category of the conversation',
      enum: [
        'technical-help',
        'code-review',
        'architecture',
        'debugging',
        'learning',
        'planning',
        'general',
        'brainstorming',
      ],
    },
    confidence: {
      type: 'number',
      description: 'Confidence level in the title accuracy (0-1)',
      minimum: 0,
      maximum: 1,
    },
  },
  required: ['title'],
};

/**
 * Fallback titles when AI generation fails
 */
export const FALLBACK_TITLES = [
  'New Chat',
  'Conversation',
  'Discussion',
  'Question & Answer',
  'Help Request',
  'Technical Discussion',
];

/**
 * Common topic patterns for quick title generation
 */
export const TOPIC_PATTERNS = {
  code: ['Code Review', 'Programming Help', 'Debug Session'],
  database: ['Database Design', 'SQL Query Help', 'Schema Planning'],
  frontend: ['UI Development', 'Frontend Design', 'Component Help'],
  backend: ['API Development', 'Server Setup', 'Backend Architecture'],
  devops: ['Deployment Help', 'Infrastructure Setup', 'DevOps Guide'],
  learning: ['Learning Session', 'Tutorial Request', 'Concept Explanation'],
  planning: ['Project Planning', 'Architecture Design', 'Strategy Discussion'],
};

/**
 * Extract key topics from message content
 */
export function extractTopics(messages: string[]): string[] {
  const allText = messages.join(' ').toLowerCase();
  const topics: string[] = [];

  // Technical keywords
  const keywords = {
    frontend: ['react', 'vue', 'angular', 'javascript', 'css', 'html', 'ui', 'component'],
    backend: ['api', 'server', 'node', 'express', 'database', 'endpoint', 'service'],
    mobile: ['react native', 'flutter', 'ios', 'android', 'mobile', 'app'],
    database: ['sql', 'mongodb', 'postgres', 'mysql', 'database', 'schema', 'query'],
    devops: ['docker', 'kubernetes', 'aws', 'deployment', 'ci/cd', 'infrastructure'],
    ai: ['ai', 'machine learning', 'llm', 'gpt', 'claude', 'openai', 'model'],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => allText.includes(word))) {
      topics.push(category);
    }
  }

  return topics;
}
