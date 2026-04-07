
'use server';
/**
 * @fileOverview Arquitectura de 3 Agentes:
 * 1. Agente Web (Next.js/React) - Interfaz de usuario.
 * 2. Agente Controlador (Hugging Face - Llama) - Orquestador central que procesa la lógica.
 * 3. Agente de Datos (Genkit Tool) - Especialista en persistencia y consultas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- AGENTE DE BASE DE DATOS (Tool) ---
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
    console.log(`[Agente DB] Ejecutando: ${input.action} - ${input.query}`);
    // Simulación de interacción con DB
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

// --- UTILIDAD HUGGING FACE ---
async function callHuggingFace(messages: any[]) {
  const model = "meta-llama/Llama-3.2-3B-Instruct";
  const token = process.env.HUGGINGFACE_TOKEN;

  if (!token) {
    throw new Error("HUGGINGFACE_TOKEN no configurado en .env");
  }

  const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Error de Hugging Face: ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// --- AGENTE CONTROLADOR (Orquestador Flow) ---
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
    const systemPrompt = `Eres el Agente Controlador (basado en Llama via Hugging Face).
    Tu arquitectura:
    1. Agente Web: Recibe peticiones del usuario.
    2. Agente de Datos: Herramienta experta en DB (databaseAgent).

    REGLA DE ORO:
    Si el usuario pide guardar o consultar algo, debes usar la herramienta databaseAgent.
    Para usar la herramienta, responde EXCLUSIVAMENTE con el formato JSON:
    {"tool": "databaseAgent", "action": "query" o "save", "query": "descripción"}

    Si ya tienes la respuesta o es una charla general, responde normalmente en español profesional.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(input.history || []).map((h: any) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
      })),
      { role: "user", content: input.message }
    ];

    // Llamada inicial a Hugging Face (Llama)
    let llamaResponse = await callHuggingFace(messages);

    // Intento de parsear si Llama decidió usar la herramienta
    try {
      if (llamaResponse.includes('{"tool":')) {
        const jsonMatch = llamaResponse.match(/\{.*\}/s);
        if (jsonMatch) {
          const toolCall = JSON.parse(jsonMatch[0]);
          
          if (toolCall.tool === 'databaseAgent') {
            // Ejecutamos el Agente de Datos (Genkit Tool)
            const toolResult = await databaseAgent({
              action: toolCall.action,
              query: toolCall.query
            });

            // Volvemos a llamar a Llama con el resultado del Agente de Datos
            messages.push({ role: "assistant", content: llamaResponse });
            messages.push({ role: "user", content: `Resultado del Agente de Datos: ${JSON.stringify(toolResult)}. Ahora da la respuesta final al usuario.` });
            
            llamaResponse = await callHuggingFace(messages);
          }
        }
      }
    } catch (e) {
      console.error("Error procesando orquestación:", e);
    }

    return llamaResponse;
  }
);
