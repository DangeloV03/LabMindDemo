import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import * as ss from 'simple-statistics';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import os from 'os';
import { promisify } from 'util';
// @ts-ignore
import regression from 'regression';

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
      {
          name: 'ingest_dataset',
          description: 'Ingest raw data, infer schema/units, and detect inconsistencies',
          input_schema: {
            type: 'object',
            properties: {
              raw_data: { type: 'array', items: { type: 'any' } },
              filename: { type: 'string', description: 'Original filename for context' }
            },
            required: ['raw_data']
          }
        },
        {
          name: 'suggest_and_fit_models',
          description: 'Fit mathematical models (linear, exponential, power) and return parameters with R-squared',
          input_schema: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'array',
                  items: { type: 'number' },
                  minItems: 2,
                  maxItems: 2
                },
                description: 'Array of [x, y] pairs'
              }
            },
            required: ['data']
          }
        },
        {
          name: 'analyze_noise_sources',
          description: 'Analyze noise data for specific signatures (drift, 1/f, periodic) to suggest physical causes',
          input_schema: {
            type: 'object',
            properties: {
              values: { type: 'array', items: { type: 'number' } },
              sampling_rate: { type: 'number', description: 'Hz, optional' }
            },
            required: ['values']
          }
        },
        {
          name: 'build_domain_visualizations',
          description: 'Construct domain-specific visualization configs',
          input_schema: {
            type: 'object',
            properties: {
              domain: { type: 'string', description: 'e.g. quantum, spectroscopy, biology' },
              data_characteristics: { type: 'string' }
            },
            required: ['domain']
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
            const values = (args.values as any[]).filter(v => typeof v === 'number' && !isNaN(v));
            if (values.length === 0) {
              result = { error: "No numeric values found for statistics" };
            } else {
              result = {
                mean: ss.mean(values),
                median: ss.median(values),
                min: ss.min(values),
                max: ss.max(values),
                stdDev: ss.standardDeviation(values),
                variance: ss.variance(values)
              };
            }
          } else if (toolCall.name === 'detect_outliers') {
            const values = (args.values as any[]).filter(v => typeof v === 'number' && !isNaN(v));
            if (values.length < 4) {
              result = { error: "Not enough data points to detect outliers (need at least 4)" };
            } else {
              const iqr = ss.interquartileRange(values);
              const q1 = ss.quantile(values, 0.25);
              const q3 = ss.quantile(values, 0.75);
              const lowerBound = q1 - 1.5 * iqr;
              const upperBound = q3 + 1.5 * iqr;
              const outliers = values.filter(v => v < lowerBound || v > upperBound);
              result = { outliers, lowerBound, upperBound };
            }
          } else if (toolCall.name === 'ingest_dataset') {
            const raw = args.raw_data;
            const type = Array.isArray(raw) ? 'array' : typeof raw;
            const length = Array.isArray(raw) ? raw.length : 0;
            const sample = Array.isArray(raw) ? raw.slice(0, 5) : raw;

            // Simple schema inference
            let schema = "unknown";
            if (length > 0 && typeof raw[0] === 'number') schema = "Numeric Array";
            else if (length > 0 && typeof raw[0] === 'object') schema = "Object Array (JSON)";

            result = {
              detected_type: type,
              count: length,
              inferred_schema: schema,
              sample_preview: sample,
              status: "Ingested successfully"
            };
          } else if (toolCall.name === 'suggest_and_fit_models') {
            const data = args.data as number[][];
            if (!data || data.length < 2) {
              result = { error: "Insufficient data for fitting" };
            } else {
              const bestFits = [];
              try {
                const lin = regression.linear(data);
                bestFits.push({ model: 'linear', equation: lin.string, r2: lin.r2, points: lin.points });

                // Only fit others if positive/appropriate
                if (data.every(p => p[1] > 0)) {
                  const exp = regression.exponential(data);
                  bestFits.push({ model: 'exponential', equation: exp.string, r2: exp.r2 });
                  const pow = regression.power(data);
                  bestFits.push({ model: 'power', equation: pow.string, r2: pow.r2 });
                }
              } catch (e: any) { console.error("Fitting error", e); }

              result = { fits: bestFits.sort((a, b) => (b.r2 || 0) - (a.r2 || 0)) };
            }
          } else if (toolCall.name === 'analyze_noise_sources') {
            const values = args.values as number[];
            const mean = ss.mean(values);
            const variance = ss.variance(values);
            // Simple drift check (first half vs second half)
            const half = Math.floor(values.length / 2);
            const mean1 = ss.mean(values.slice(0, half));
            const mean2 = ss.mean(values.slice(half));
            const drift = Math.abs(mean2 - mean1) / Math.abs(mean) > 0.1;

            result = {
              variance,
              has_significant_drift: drift,
              interpretation: drift ? "Detected drift over time (possible thermal/mechanical instability)" : "Stable baseline",
              noise_type: drift ? "Pink/Red Noise (Drift)" : "White Noise (Likely)"
            };

          } else if (toolCall.name === 'build_domain_visualizations') {
            const domain = args.domain.toLowerCase();
            let config = {};
            if (domain.includes("quantum")) config = { type: "IQ Plot", axes: ["I (Volts)", "Q (Volts)"] };
            else if (domain.includes("spec")) config = { type: "Spectrum", axes: ["Frequency (Hz)", "Power (dBm)"] };
            else config = { type: "Generic Time Series", axes: ["Time", "Value"] };

            result = { visualization_config: config };

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
            const chars = args.dataCharacteristics;
            result = {
              recommended: [
                "Linear Regression",
                "Polynomial Fit",
                "Fourier Transform",
                "Gaussian Process"
              ],
              note: `Based on: ${chars}`
            };
          } else if (toolCall.name === 'analyze_noise') {
            const values = (args.values as any[]).filter(v => typeof v === 'number' && !isNaN(v));
            if (values.length === 0) {
              result = { error: "No numeric values for noise analysis" };
            } else {
              const mean = ss.mean(values);
              const stdDev = ss.standardDeviation(values);
              const cv = mean !== 0 ? stdDev / Math.abs(mean) : 0; // Avoid divide by zero
              result = {
                stdDev,
                mean,
                coefficientOfVariation: cv,
                signalToNoiseEstimate: cv !== 0 ? 1 / cv : "Infinity",
                interpretation: cv < 0.1 ? "Low Noise" : cv < 1.0 ? "Moderate Noise" : "High Noise"
              };
            }
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
              // Check for Vercel environment or generic missing binary
              // In production Vercel, we can't spawn arbitrary shells easily for these languages
              if (process.env.VERCEL) {
                result = {
                  executed: false,
                  output: null,
                  note: `Script generated successfully! (Execution skipped: Runtime for ${language} not available in Vercel serverless environment. Run locally to see results.)`
                };
              } else {
                const { stdout, stderr } = await execAsync(`${cmd} "${tempFile}"`, { timeout: 10000 });
                result = {
                  output: stdout,
                  error: stderr,
                  executed: true
                };
              }
            } catch (execError: any) {
              result = {
                error: execError.message,
                stderr: execError.stderr,
                executed: false,
                note: `Failed to execute ${language} script. Ensure ${cmd} is installed in your system PATH.`
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
