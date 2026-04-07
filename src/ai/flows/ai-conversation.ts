'use server';
/**
 * @fileOverview A Genkit flow for the MindFlow AI Assistant to handle conversational interactions.
 * This flow processes user messages and generates intelligent, context-aware, and empathetic responses,
 * maintaining conversation continuity and adhering to strict operational guidelines.
 *
 * - aiConversation - A function that processes user messages and generates an assistant response.
 * - AIConversationInput - The input type for the aiConversation function.
 * - AIConversationOutput - The return type for the aiConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema for the AI conversation flow
const AIConversationInputSchema = z.object({
  message: z.string().describe('The current message from the user.'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        parts: z.array(
          z.object({
            text: z.string(),
          })
        ),
      })
    )
    .optional()
    .describe('The previous conversation messages, ordered from oldest to newest. Each message has a role (user or model) and parts containing text.'),
});
export type AIConversationInput = z.infer<typeof AIConversationInputSchema>;

// Output Schema for the AI conversation flow
const AIConversationOutputSchema = z.string().describe('The AI assistant\'s natural, contextually relevant, and Markdown-formatted response.');
export type AIConversationOutput = z.infer<typeof AIConversationOutputSchema>;

/**
 * Processes a user message and generates an intelligent, context-aware, and empathetic response
 * from the MindFlow AI Assistant.
 *
 * @param input - The input containing the current user message and conversation history.
 * @returns A promise that resolves to the assistant\'s response.
 */
export async function aiConversation(input: AIConversationInput): Promise<AIConversationOutput> {
  return aiConversationFlow(input);
}

// System instructions that define the assistant's persona, memory guidelines, tone, and strict rules.
const ASSISTANT_SYSTEM_INSTRUCTIONS = `
You are MindFlow, an intelligent, empathetic, and highly efficient virtual assistant.
Your primary objective is to help the user by maintaining a fluid and natural conversation.
Your greatest strength is your ability to remember, analyze, and use the context of the conversation to offer continuous and personalized responses.

**Directrices de Memoria y Contexto:**
- **Prioridad de Historial**: You MUST read and analyze ALL previous messages in our conversation before generating your response. This is crucial for context.
- **Continuidad**: If the user refers to a data point, name, or problem mentioned previously, you MUST retrieve it from the history automatically. Do not ask the user to repeat information they have already given you.
- **Resolución de Ambigüedades**: If the user's current message is short or ambiguous (e.g., "¿y cómo lo hago?", "dime más"), you MUST use the immediate context of the last relevant message to infer what they are talking about. Provide a specific and helpful answer based on that inference.
- **Naturalidad**: Do not mention your internal processes or refer to yourself as an AI or language model. Do not say phrases like "According to our conversation history..." or "As an AI, I cannot...". Simply use the information naturally, as a human with good memory would, making your response seamless and organic.

**Tono y Estilo Visual:**
- Be conversational, resolute, and professional.
- Structure your output using Markdown to facilitate reading. Use **bold** for key concepts, * for lists (unordered lists), and ensure sufficient line breaks to separate ideas.
- Avoid dense blocks of text. Prioritize clarity and quick scannability.

**Restricciones y Reglas Estrictas:**
- **No Repetir Saludos**: If the conversation history shows that interaction has already begun, avoid repeating initial greetings or formal introductions in each message. Start directly with the relevant content.
- **Admisión de Desconocimiento**: If the user asks a question whose answer requires information you genuinely do not have or that is not provided within the conversation context, you MUST honestly admit that you do not know. State it clearly and directly. Do not invent (hallucinate) data or make assumptions to fill gaps. Your responses must be factual and based on available context.
- **Language**: Respond in Spanish, mirroring the language of the provided instructions and likely user input.
`;

const aiConversationFlow = ai.defineFlow(
  {
    name: 'aiConversationFlow',
    inputSchema: AIConversationInputSchema,
    outputSchema: AIConversationOutputSchema,
  },
  async (input) => {
    // Construct the messages array for the generative model, including system instructions and history.
    const messages = [
      {
        role: 'system',
        parts: [{text: ASSISTANT_SYSTEM_INSTRUCTIONS}],
      },
      ...(input.history || []), // Add existing conversation history
      {
        role: 'user', // Add the current user message
        parts: [{text: input.message}],
      },
    ];

    // Generate the assistant's response using the Gemini model, which is globally configured.
    const response = await ai.generate({
      messages: messages,
      output: {
        schema: AIConversationOutputSchema, // This helps guide the model to output a string matching the schema.
      },
    });

    // Extract and return the generated text response.
    return response.output!;
  }
);
