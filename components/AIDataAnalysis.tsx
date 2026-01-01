'use client';

import React, { useState } from 'react';
import Papa from 'papaparse';

type AnalysisResult = {
    analysis: string;
    raw: any;
};

export default function AIDataAnalysis() {
    const [inputData, setInputData] = useState('');
    const [analysisType, setAnalysisType] = useState('statistical');
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            let parsedData;
            // Try parsing as JSON first
            try {
                parsedData = JSON.parse(inputData);
            } catch {
                // Fallback to CSV parsing using papaparse
                const csvResult = Papa.parse(inputData, { header: true, dynamicTyping: true });
                if (csvResult.errors.length > 0) {
                    // If CSV fails, try simple array splitting
                    const simpleArray = inputData.split(/[\s,]+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
                    if (simpleArray.length > 0) {
                        parsedData = simpleArray;
                    } else {
                        throw new Error('Could not parse data as JSON, CSV, or number list');
                    }
                } else {
                    parsedData = csvResult.data;
                }
            }

            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: parsedData,
                    analysisType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    AI Data Analysis
                </h1>
                <p className="text-gray-400">
                    Powered by Claude 3.5 Sonnet & Specialized Tools
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="glass-panel p-4 rounded-xl border border-white/10 bg-white/5">
                        <h3 className="font-semibold mb-3 text-white">Analysis Type</h3>
                        <div className="space-y-2">
                            {[
                                { id: 'statistical', label: 'Statistical Analysis' },
                                { id: 'quality', label: 'Data Quality' },
                                { id: 'outliers', label: 'Outlier Detection' },
                                { id: 'function_finding', label: 'Agentic Discovery' },
                                { id: 'noise', label: 'Noise Analysis' },
                                { id: 'polyglot', label: 'Polyglot Scripting' },
                                { id: 'visualization', label: 'Visualization' },
                                { id: 'insights', label: 'Key Insights' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setAnalysisType(type.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${analysisType === type.id
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'hover:bg-white/5 text-gray-400'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        {analysisType === 'polyglot' && (
                            <div className="mt-4 border-t border-white/10 pt-4 animate-in fade-in">
                                <h3 className="font-semibold mb-3 text-white">Target Language</h3>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-blue-500"
                                    onChange={(e) => {
                                        // We can pass this as part of the prompt in the future logic
                                        // For now it's a visual indicator that we can append to the prompt
                                        setInputData(prev => prev + `\n\n(Context: Use ${e.target.value} for analysis)`);
                                    }}
                                >
                                    <option value="python">Python</option>
                                    <option value="julia">Julia</option>
                                    <option value="r">R</option>
                                    <option value="matlab">MATLAB</option>
                                    <option value="javascript">JavaScript</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <div className="glass-panel p-4 rounded-xl border border-white/10 bg-white/5">
                        <h3 className="font-semibold mb-3 text-white">Input Data</h3>
                        <textarea
                            value={inputData}
                            onChange={(e) => setInputData(e.target.value)}
                            placeholder="Paste JSON, CSV, or comma-separated numbers here..."
                            className="w-full h-48 bg-black/20 border border-white/10 rounded-lg p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none"
                        />
                        <div className="mt-3 flex justify-between items-center">
                            <button
                                onClick={() => setInputData('[12, 15, 18, 14, 13, 15, 16, 22, 105]')}
                                className="text-xs text-blue-400 hover:text-blue-300"
                            >
                                Load Sample Data
                            </button>
                            <button
                                onClick={handleAnalyze}
                                disabled={loading || !inputData}
                                className={`px-6 py-2 rounded-lg font-medium transition-all ${loading || !inputData
                                    ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    }`}
                            >
                                {loading ? 'Analyzing...' : 'Run Analysis'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                </div>
            )}

            {result && (
                <div className="glass-panel p-6 rounded-xl border border-white/10 bg-white/5 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-semibold mb-4 text-xl text-white">Analysis Results</h3>
                    <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed">
                            {result.analysis}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
