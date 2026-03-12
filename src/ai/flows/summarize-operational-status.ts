'use server';
/**
 * @fileOverview Un flujo de Genkit que genera un resumen en lenguaje natural del estado operativo de vigilancia de una escuela.
 *
 * - summarizeOperationalStatus - Una función que maneja la generación del resumen del estado operativo.
 * - SummarizeOperationalStatusInput - El tipo de entrada para la función summarizeOperationalStatus.
 * - SummarizeOperationalStatusOutput - El tipo de retorno para la función summarizeOperationalStatus.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const CameraStatusSchema = z.object({
  id: z.string().describe('Identificador único para la cámara.'),
  name: z.string().describe('Nombre legible por humanos de la cámara.'),
  status: z.enum(['online', 'offline', 'error']).describe('Estado operativo actual de la cámara.'),
  lastActivity: z.string().describe('Marca de tiempo ISO 8601 de la última actividad detectada o transmisión de datos desde la cámara.').optional(),
  issues: z.array(z.string()).describe('Una lista de problemas o alertas específicos asociados con esta cámara.').optional(),
});

const SummarizeOperationalStatusInputSchema = z.object({
  schoolName: z.string().describe('El nombre de la escuela.'),
  cameraStatuses: z.array(CameraStatusSchema).describe('Un arreglo de objetos de estado para cada cámara en la escuela.'),
});
export type SummarizeOperationalStatusInput = z.infer<typeof SummarizeOperationalStatusInputSchema>;

// Output Schema
const SummarizeOperationalStatusOutputSchema = z.object({
  summary: z.string().describe("Un resumen conciso en lenguaje natural del estado operativo general de la vigilancia de la escuela."),
});
export type SummarizeOperationalStatusOutput = z.infer<typeof SummarizeOperationalStatusOutputSchema>;

// Wrapper function
export async function summarizeOperationalStatus(input: SummarizeOperationalStatusInput): Promise<SummarizeOperationalStatusOutput> {
  return summarizeOperationalStatusFlow(input);
}

// Prompt definition
const summarizeOperationalStatusPrompt = ai.definePrompt({
  name: 'summarizeOperationalStatusPrompt',
  input: { schema: SummarizeOperationalStatusInputSchema },
  output: { schema: SummarizeOperationalStatusOutputSchema },
  prompt: `Eres un asistente de IA encargado de proporcionar resúmenes concisos en lenguaje natural del estado operativo de la vigilancia de una escuela.
Analiza los datos de estado de las cámaras proporcionados y genera un resumen que destaque los problemas clave, el estado general del sistema y cualquier cámara que requiera atención.
Concéntrate en la legibilidad y en la información procesable.

Nombre de la Escuela: {{{schoolName}}}

Estados de las Cámaras:
{{#each cameraStatuses}}
- ID de Cámara: {{{id}}}, Nombre: {{{name}}}, Estado: {{{status}}}
  {{#if lastActivity}}Última Actividad: {{{lastActivity}}}{{/if}}
  {{#if issues}} Problemas: {{#each issues}} "{{{this}}}"{{/each}}{{/if}}
{{/each}}

Basado en la información anterior, proporciona un resumen conciso del estado operativo de vigilancia para {{{schoolName}}}.`,
});

// Flow definition
const summarizeOperationalStatusFlow = ai.defineFlow(
  {
    name: 'summarizeOperationalStatusFlow',
    inputSchema: SummarizeOperationalStatusInputSchema,
    outputSchema: SummarizeOperationalStatusOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeOperationalStatusPrompt(input);
    return output!;
  }
);
