'use server';
/**
 * @fileOverview Arquitectura de 3 Agentes:
 * 1. Agente Web (Next.js/React) - Interfaz de usuario.
 * 2. Agente Controlador (Genkit Flow) - Orquestador central.
 * 3. Agente de Datos (Genkit Tool) - Especialista en persistencia.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- AGENTE DE BASE DE DATOS (Tool) ---
// Este agente se encarga exclusivamente de interactuar con la lógica de datos.
const databaseAgent = ai.defineTool(
  {
    name: 'databaseAgent',
    description: 'Agente especializado en consultar y persistir información en la base de datos.',
    inputSchema: z.object({
      action: z.enum(['query', 'save']).describe('La acción a realizar en la base de datos.'),
      query: z.string().describe('La descripción de lo que se desea buscar o guardar.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      data: z.string(),
      message: z.string(),
    }),
  },
  async (input) => {
    // Simulación de interacción con DB
    console.log(`[Agente DB] Ejecutando: ${input.action} - ${input.query}`);
    
    // Aquí iría la lógica real de Firebase o SQL
    if (input.action === 'query') {
      return {
        success: true,
        data: "Resultado simulado de la base de datos para: " + input.query,
        message: "Consulta completada con éxito.",
      };
    }
    return {
      success: true,
      data: "ID_SIMULADO_123",
      message: "Datos guardados correctamente.",
    };
  }
);

// --- AGENTE CONTROLADOR (Orquestador Flow) ---
// Actúa como el cerebro (similar a un controlador HuggingFace/Llama) que decide cuándo usar el Agente de Datos.
const MultiAgentInputSchema = z.object({
  message: z.string().describe('Mensaje del usuario enviado desde el Agente Web.'),
  history: z.array(z.any()).optional(),
});

export type MultiAgentInput = z.infer<typeof MultiAgentInputSchema>;

export async function multiAgentOrchestrator(input: MultiAgentInput): Promise<string> {
  return multiAgentFlow(input);
}

const multiAgentFlow = ai.defineFlow(
  {
    name: 'multiAgentFlow',
    inputSchema: MultiAgentInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await ai.generate({
      model: 'googleai/gemini-2.5-flash', // Usamos Gemini como motor del controlador
      tools: [databaseAgent],
      system: `Eres el Agente Controlador de un sistema multi-agente.
      Tu arquitectura consiste en:
      1. Agente Web: Recibe las peticiones (ya estás conectado a él).
      2. Agente de Datos: Una herramienta experta para DB.
      
      Si el usuario pide información, guardar algo o consultar datos, DEBES delegar esa tarea al databaseAgent.
      Analiza la respuesta del databaseAgent y preséntala de forma clara al Agente Web.
      Habla siempre en español de forma profesional y eficiente.`,
      messages: [
        ...(input.history || []),
        { role: 'user', parts: [{ text: input.message }] }
      ],
    });

    return response.text;
  }
);
