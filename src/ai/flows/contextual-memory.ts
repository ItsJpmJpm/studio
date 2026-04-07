'use server';
/**
 * @fileOverview A Genkit flow for the Chatbot AI Assistant to provide contextually aware responses
 *               by remembering previous conversation turns.
 *
 * - contextualMemory - A function that processes user messages with conversation history
 *                        to generate a continuous and personalized response.
 * - ContextualMemoryInput - The input type for the contextualMemory function.
 * - ContextualMemoryOutput - The return type for the contextualMemory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContextualMemoryInputSchema = z
  .object({
    history:
      z.array(
        z.object({
          role: z.enum(['user', 'model']),
          content: z.string().describe('The content of the message.'),
        })
      )
      .describe(
        'An array of previous messages in the conversation, ordered from oldest to newest.'
      ),
    message: z.string().describe('The current message from the user.'),
  })
  .describe('Input for the contextualMemory flow, including conversation history and current message.');

export type ContextualMemoryInput = z.infer<typeof ContextualMemoryInputSchema>;

const ContextualMemoryOutputSchema = z
  .object({
    response:
      z.string()
      .describe('The AI assistant\'s contextually aware and Markdown-formatted response.'),
  })
  .describe('Output from the contextualMemory flow, containing the assistant\'s response.');

export type ContextualMemoryOutput = z.infer<typeof ContextualMemoryOutputSchema>;

export async function contextualMemory(
  input: ContextualMemoryInput
): Promise<ContextualMemoryOutput> {
  return contextualMemoryFlow(input);
}

const contextualMemoryPrompt = ai.definePrompt({
  name: 'contextualMemoryPrompt',
  input: {schema: ContextualMemoryInputSchema},
  output: {schema: ContextualMemoryOutputSchema},
  prompt: `[Rol y Propósito]
Eres un asistente virtual inteligente, empático y altamente eficiente. Tu principal objetivo es ayudar al usuario manteniendo una conversación fluida y natural. Tu mayor fortaleza es tu capacidad para recordar, analizar y utilizar el contexto de la conversación para ofrecer respuestas continuas y personalizadas.

[Directrices de Memoria y Contexto]
Prioridad de Historial: Lee y analiza SIEMPRE los mensajes anteriores antes de generar una respuesta.
Continuidad: Si el usuario hace referencia a un dato, nombre o problema mencionado previamente, recupéralo del historial automáticamente. No pidas al usuario que repita información que ya te ha dado.
Resolución de Ambigüedades: Si el mensaje actual del usuario es corto o ambiguo (ej. "¿y cómo lo hago?", "dime más"), utiliza el contexto inmediato del último mensaje para inferir de qué está hablando.
Naturalidad: No menciones tus procesos internos. No digas frases como "Según el historial de nuestra conversación..."; simplemente usa la información con naturalidad, como lo haría un humano con buena memoria.

[Tono y Estilo Visual]
Sé conversacional, resolutivo y profesional.
Estructura tu salida: Utiliza el formato Markdown para facilitar la lectura. Usa negritas para destacar conceptos clave, viñetas (*) para listas y saltos de línea para separar ideas.
Evita los bloques de texto densos. Prioriza la claridad y la capacidad de escaneo rápido.

[Restricciones y Reglas Estrictas]
Evita repetir saludos o introducciones formales en cada mensaje si el historial demuestra que la conversación ya está iniciada.
Si el usuario hace una pregunta cuya respuesta requiere información que no tienes o que no está en el contexto, admite honestamente que no lo sabes. No inventes (alucines) datos para rellenar vacíos.

Conversation History:
{{#each history}}
  {{#if (eq role 'user')}}
    User: {{{content}}}
  {{else}}
    Assistant: {{{content}}}
  {{/if}}
{{/each}}

User: {{{message}}}
Assistant: `,
});

const contextualMemoryFlow = ai.defineFlow(
  {
    name: 'contextualMemoryFlow',
    inputSchema: ContextualMemoryInputSchema,
    outputSchema: ContextualMemoryOutputSchema,
  },
  async input => {
    const {output} = await contextualMemoryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate response from contextualMemoryPrompt.');
    }
    return output;
  }
);
