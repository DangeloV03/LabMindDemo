'use client'

import { useState } from 'react'

interface QuizFormProps {
  projectId: string
  initialResponses?: Record<string, any>
  onComplete: (responses: Record<string, any>) => void
  onCancel?: () => void
}

interface QuizState {
  currentStep: number
  responses: {
    researchField?: string
    researchQuestion?: string
    dataType?: string
    dataFormat?: string | string[]
    expectedOutcomes?: string
    constraints?: string
  }
}

const quizSteps = [
  {
    id: 'field',
    title: 'Research Field',
    question: 'What is your research field?',
    type: 'text',
    placeholder: 'e.g., Organic Chemistry, Quantum Physics, Materials Science',
    required: true,
  },
  {
    id: 'question',
    title: 'Research Question',
    question: 'Describe your research question or goal',
    type: 'textarea',
    placeholder: 'e.g., Analyze reaction kinetics from temperature-dependent data',
    required: true,
  },
  {
    id: 'dataType',
    title: 'Data Type',
    question: 'What type of data are you working with?',
    type: 'select',
    options: ['Experimental Data', 'Simulation Results', 'Literature Data', 'Mixed'],
    required: true,
  },
  {
    id: 'dataFormat',
    title: 'Data Format',
    question: 'What format is your data in? (Select all that apply)',
    type: 'multi-select',
    options: ['CSV', 'Excel', 'JSON', 'Text', 'HDF5', 'Parquet', 'Not sure yet'],
    required: false,
  },
  {
    id: 'outcomes',
    title: 'Expected Outcomes',
    question: 'What outcomes are you hoping to achieve?',
    type: 'textarea',
    placeholder: 'e.g., Identify trends, fit models, visualize relationships',
    required: false,
  },
  {
    id: 'constraints',
    title: 'Constraints or Requirements',
    question: 'Any specific constraints or requirements?',
    type: 'textarea',
    placeholder: 'e.g., Must use specific statistical methods, need real-time processing',
    required: false,
  },
]

export default function QuizForm({ projectId, initialResponses, onComplete, onCancel }: QuizFormProps) {
  const [state, setState] = useState<QuizState>({
    currentStep: 0,
    responses: initialResponses || {},
  })

  const currentStepData = quizSteps[state.currentStep]
  const isLastStep = state.currentStep === quizSteps.length - 1
  const currentValue = state.responses[currentStepData.id as keyof typeof state.responses]
  const canProceed = currentStepData.required
    ? currentValue && (typeof currentValue === 'string' ? currentValue.trim() : Array.isArray(currentValue) ? currentValue.length > 0 : false)
    : true

  const handleNext = () => {
    if (state.currentStep < quizSteps.length - 1) {
      setState({ ...state, currentStep: state.currentStep + 1 })
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (state.currentStep > 0) {
      setState({ ...state, currentStep: state.currentStep - 1 })
    }
  }

  const handleChange = (value: string) => {
    setState({
      ...state,
      responses: {
        ...state.responses,
        [currentStepData.id]: value,
      },
    })
  }

  const handleMultiSelectChange = (option: string) => {
    const currentFormats = Array.isArray(currentValue) ? currentValue : []
    const newFormats = currentFormats.includes(option)
      ? currentFormats.filter(f => f !== option)
      : [...currentFormats, option]
    
    setState({
      ...state,
      responses: {
        ...state.responses,
        [currentStepData.id]: newFormats,
      },
    })
  }

  const handleSubmit = () => {
    onComplete(state.responses)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">
            Step {state.currentStep + 1} of {quizSteps.length}
          </span>
          <span className="text-sm text-gray-400">{Math.round(((state.currentStep + 1) / quizSteps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((state.currentStep + 1) / quizSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      <div className="glass rounded-2xl border border-white/10 p-8 mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">{currentStepData.title}</h2>
        <p className="text-gray-400 mb-6">{currentStepData.question}</p>

        {currentStepData.type === 'select' ? (
          <div className="space-y-3">
            {currentStepData.options?.map((option) => (
              <button
                key={option}
                onClick={() => handleChange(option)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  state.responses[currentStepData.id as keyof typeof state.responses] === option
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : currentStepData.type === 'multi-select' ? (
          <div className="space-y-3">
            {currentStepData.options?.map((option) => {
              const currentFormats = Array.isArray(currentValue) ? currentValue : []
              const isSelected = currentFormats.includes(option)
              return (
                <button
                  key={option}
                  onClick={() => handleMultiSelectChange(option)}
                  className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-3 ${
                    isSelected
                      ? 'bg-primary-600/20 border-primary-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-gray-500'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span>{option}</span>
                </button>
              )
            })}
          </div>
        ) : currentStepData.type === 'text' ? (
          <input
            type="text"
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={currentStepData.placeholder}
            className="w-full p-4 bg-[#0d0d0d] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required={currentStepData.required}
          />
        ) : (
          <textarea
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={currentStepData.placeholder}
            className="w-full p-4 bg-[#0d0d0d] border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={6}
            required={currentStepData.required}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          )}
          {state.currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            >
              Previous
            </button>
          )}
        </div>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLastStep ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  )
}
