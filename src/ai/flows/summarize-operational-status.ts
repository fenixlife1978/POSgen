'use server';
/**
 * @fileOverview A Genkit flow that generates a natural language summary of a school's surveillance operational status.
 *
 * - summarizeOperationalStatus - A function that handles the generation of the operational status summary.
 * - SummarizeOperationalStatusInput - The input type for the summarizeOperationalStatus function.
 * - SummarizeOperationalStatusOutput - The return type for the summarizeOperationalStatus function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const CameraStatusSchema = z.object({
  id: z.string().describe('Unique identifier for the camera.'),
  name: z.string().describe('Human-readable name of the camera.'),
  status: z.enum(['online', 'offline', 'error']).describe('Current operational status of the camera.'),
  lastActivity: z.string().describe('ISO 8601 timestamp of the last detected activity or data transmission from the camera.').optional(),
  issues: z.array(z.string()).describe('A list of specific issues or alerts associated with this camera.').optional(),
});

const SummarizeOperationalStatusInputSchema = z.object({
  schoolName: z.string().describe('The name of the school.'),
  cameraStatuses: z.array(CameraStatusSchema).describe('An array of status objects for each camera in the school.'),
});
export type SummarizeOperationalStatusInput = z.infer<typeof SummarizeOperationalStatusInputSchema>;

// Output Schema
const SummarizeOperationalStatusOutputSchema = z.object({
  summary: z.string().describe('A concise natural language summary of the school\'s overall surveillance operational status.'),
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
  prompt: `You are an AI assistant tasked with providing concise, natural language summaries of a school's surveillance operational status.
Analyze the provided camera status data and generate a summary that highlights key issues, overall system health, and any cameras requiring attention.
Focus on readability and actionable insights.

School Name: {{{schoolName}}}

Camera Statuses:
{{#each cameraStatuses}}
- Camera ID: {{{id}}}, Name: {{{name}}}, Status: {{{status}}}
  {{#if lastActivity}}Last Activity: {{{lastActivity}}}{{/if}}
  {{#if issues}} Issues: {{#each issues}} "{{{this}}}"{{/each}}{{/if}}
{{/each}}

Based on the above information, provide a concise summary of the surveillance operational status for {{{schoolName}}}.`,
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
