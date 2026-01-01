'use client';

import React from 'react';
import AIDataAnalysis from '@/components/AIDataAnalysis';
import MolecularBackground from '@/components/MolecularBackground';
import Navbar from '@/components/Navbar';

export default function AnalyzePage() {
    return (
        <main className="min-h-screen bg-black text-white relative overflow-hidden">
            <div className="fixed inset-0 z-0 opacity-40">
                <MolecularBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <div className="sticky top-4 z-50">
                    <Navbar />
                </div>
                <div className="flex-1 container mx-auto px-4 py-8">
                    <AIDataAnalysis />
                </div>
            </div>
        </main>
    );
}
