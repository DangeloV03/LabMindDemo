import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import * as ss from 'simple-statistics';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const { data, analysisType, prompt } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Prepare context for the model
    const dataContext = JSON.stringify(data).slice(0, 10000); // Truncate if too large

    const systemPrompt = `You are an expert data analyst AI for LabMind. 
    You have access to specialized tools for statistical analysis.
    Your goal is to provide accurate, actionable insights based on the provided data.
    
    Current Analysis Type: ${analysisType}
    User Prompt: ${prompt || 'Analyze this data'}
    
    Data Context:
    ${dataContext}
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: 'Analyze this data using the available tools.' }
      ],
      tools: [
        {
          name: 'calculate_statistics',
          description: 'Calculate descriptive statistics for numeric data',
          input_schema: {
            type: 'object',
            properties: {
              values: { type: 'array', items: { type: 'number' } }
            },
            required: ['values']
          }
        },
        {
          name: 'detect_outliers',
          description: 'Detect outliers using IQR method',
          input_schema: {
            type: 'object',
            properties: {
              values: { type: 'array', items: { type: 'number' } }
            },
            required: ['values']
          }
        },
        {
          name: 'check_data_quality',
          description: 'Check for missing values and duplicates',
          input_schema: {
            type: 'object',
            properties: {
              values: { type: 'array', items: { type: 'any' } }
            },
            required: ['values']
          }
        },
        {
          name: 'suggest_visualizations',
          description: 'Suggest appropriate visualizations for the data',
          input_schema: {
            type: 'object',
            properties: {
              dataTypes: { type: 'array', items: { type: 'string' } },
              description: { type: 'string' }
            },
            required: ['dataTypes']
          }
        }
      ]
    });

    // Handle tool calls
    let finalResponse = response.content;
    const toolCalls = response.content.filter(c => c.type === 'tool_use');

    if (toolCalls.length > 0) {
      const toolResults = [];

      for (const toolCall of toolCalls) {
        // @ts-ignore
        const args: any = toolCall.input;
        let result: any = {};

        try {
          if (toolCall.name === 'calculate_statistics') {
            const values = args.values as number[];
            result = {
              mean: ss.mean(values),
              median: ss.median(values),
              min: ss.min(values),
              max: ss.max(values),
              stdDev: ss.standardDeviation(values),
              variance: ss.variance(values)
            };
          } else if (toolCall.name === 'detect_outliers') {
            const values = args.values as number[];
            const iqr = ss.interquartileRange(values);
            const q1 = ss.quantile(values, 0.25);
            const q3 = ss.quantile(values, 0.75);
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;

            const outliers = values.filter(v => v < lowerBound || v > upperBound);
            result = { outliers, lowerBound, upperBound };
          } else if (toolCall.name === 'check_data_quality') {
            const values = args.values as any[];
            // basic quality checks
            const nullCount = values.filter(v => v === null || v === undefined).length;
            const uniqueCount = new Set(values).size;
            result = {
              total: values.length,
              nullCount,
              duplicateCount: values.length - uniqueCount
            };
          } else if (toolCall.name === 'recommend_functions') {
            // In a real system, this might check a database of kernels
            // For now, we return a curated list based on the AI's intuition passed in args
            const chars = args.dataCharacteristics;
            result = {
              recommended: [
                "Linear Regression (if trend is linear)",
                "Polynomial Fit (if curved)",
                "Fourier Transform (if periodic)",
                "Gaussian Process (for uncertainty estimation)"
              ],
              note: `Based on: ${chars}`
            };
          } else if (toolCall.name === 'analyze_noise') {
            const values = args.values as number[];
            const mean = ss.mean(values);
            const stdDev = ss.standardDeviation(values);
            const cv = stdDev / Math.abs(mean); // Coefficient of Variation
            result = {
              stdDev,
              mean,
              coefficientOfVariation: cv,
              signalToNoiseEstimate: 1 / cv,
              interpretation: cv < 0.1 ? "Low Noise" : cv < 1.0 ? "Moderate Noise" : "High Noise"
            };
          } else if (toolCall.name === 'generate_and_run_script') {
            const { language, script } = args;
            const tempDir = os.tmpdir();

            let cmd = '';
            let ext = '';

            switch (language.toLowerCase()) {
              case 'python': cmd = 'python'; ext = '.py'; break;
              case 'javascript': cmd = 'node'; ext = '.js'; break;
              case 'r': cmd = 'Rscript'; ext = '.R'; break;
              case 'julia': cmd = 'julia'; ext = '.jl'; break;
              default: throw new Error(`Execution for ${language} not supported on this server`);
            }

            const tempFile = path.join(tempDir, `labmind_analysis_${Date.now()}${ext}`);
            fs.writeFileSync(tempFile, script);

            try {
              const { stdout, stderr } = await execAsync(`${cmd} "${tempFile}"`, { timeout: 10000 });
              result = {
                output: stdout,
                error: stderr,
                executed: true
              };
            } catch (execError: any) {
              result = {
                error: execError.message,
                stderr: execError.stderr,
                executed: false,
                note: "Failed to execute. Ensure the runtime is installed in PATH."
              };
            } finally {
              try { fs.unlinkSync(tempFile); } catch { }
            }
          } else if (toolCall.name === 'suggest_visualizations') {
            // Logic would map data types via a heuristic, here we just echo back a simple suggestion
            result = {
              suggestions: ["Bar Chart", "Histogram", "Box Plot"]
            };
          }
        } catch (error: any) {
          result = { error: error.message };
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Get final response with tool results
      const resultResponse = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: 'user', content: 'Analyze this data using the available tools.' },
          ...response.content.map(c => c as any), // Cast to handle typed messages
          ...toolResults.map(c => c as any)
        ],
        tools: response.tools // Pass tools again just in case
      });

      finalResponse = resultResponse.content;
    }

    // Extract text content
    const textContent = finalResponse
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n');

    return NextResponse.json({
      analysis: textContent,
      raw: finalResponse
    });

  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
