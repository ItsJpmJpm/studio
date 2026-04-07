'use server';
/**
 * @fileOverview This file implements a Genkit flow for resolving ambiguous user queries based on conversation history.
 *
 * - resolveAmbiguity - An exported function that calls the Genkit flow for ambiguity resolution.
 * - AmbiguityResolutionInput - The input type for the resolveAmbiguity function.
 * - AmbiguityResolutionOutput - The return type for the resolveAmbiguity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AmbiguityResolutionInputSchema = z.object({
  currentQuery: z.string().describe('The short or ambiguous user query.'),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'model']).describe('The role of the message sender (user or model).'),
      content: z.string().describe('The content of the message.'),
    })
  ).describe('An array of previous messages in the conversation, ordered from oldest to newest.'),
});
export type AmbiguityResolutionInput = z.infer<typeof AmbiguityResolutionInputSchema>;

const AmbiguityResolutionOutputSchema = z.object({
  resolvedQuery: z.string().describe("The clarified, explicit version of the user's query, or a statement indicating inability to clarify if the ambiguity cannot be resolved."),
});
export type AmbiguityResolutionOutput = z.infer<typeof AmbiguityResolutionOutputSchema>;

export async function resolveAmbiguity(input: AmbiguityResolutionInput): Promise<AmbiguityResolutionOutput> {
  return ambiguityResolutionFlow(input);
}

const ambiguityResolutionPrompt = ai.definePrompt({
  name: 'ambiguityResolutionPrompt',
  input: { schema: AmbiguityResolutionInputSchema },
  output: { schema: AmbiguityResolutionOutputSchema },
  prompt: `You are an assistant specialized in resolving ambiguous user queries based on conversation history. Your goal is to interpret the user's short or vague question by leveraging the past messages, especially the last one. Do not invent information. If you cannot confidently resolve the ambiguity, set the 'resolvedQuery' field to 'I cannot clarify this query based on the history.'.

Conversation History (oldest to newest):
{{#each conversationHistory}}
{{this.role}}: {{{this.content}}}
{{/each}}

User's current ambiguous query: "{{{currentQuery}}}"

Considering the conversation history, clarify the user's current query and provide it in the following JSON format:
\`\`\`json
{{{json outputSchema}}}
\`\`\`
`,
});

const ambiguityResolutionFlow = ai.defineFlow(
  {
    name: 'ambiguityResolutionFlow',
    inputSchema: AmbiguityResolutionInputSchema,
    outputSchema: AmbiguityResolutionOutputSchema,
  },
  async (input) => {
    const { output } = await ambiguityResolutionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate a response for ambiguity resolution.');
    }
    return output;
  }
);
