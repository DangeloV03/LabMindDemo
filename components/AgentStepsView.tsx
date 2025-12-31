'use client'

import { useState } from 'react'

interface Step {
  step_number: number
  title: string
  description: string
  code: string
  dependencies: number[]
}

interface AgentStepsViewProps {
  steps: Step[]
  currentStep: number
  status: string
  onStepSelect?: (stepIndex: number) => void
  onStepExecute?: (stepIndex: number) => void
  onStepModify?: (stepIndex: number, modifiedStep: Step) => void
}

export default function AgentStepsView({
  steps,
  currentStep,
  status,
  onStepSelect,
  onStepExecute,
  onStepModify,
}: AgentStepsViewProps) {
  const [editingStep, setEditingStep] = useState<number | null>(null)
  const [modifiedSteps, setModifiedSteps] = useState<Record<number, Step>>({})

  const handleModify = (stepIndex: number) => {
    setEditingStep(stepIndex)
  }

  const handleSaveModification = (stepIndex: number, modifiedStep: Step) => {
    setModifiedSteps({
      ...modifiedSteps,
      [stepIndex]: modifiedStep,
    })
    if (onStepModify) {
      onStepModify(stepIndex, modifiedStep)
    }
    setEditingStep(null)
  }

  const getDisplayStep = (stepIndex: number): Step => {
    return modifiedSteps[stepIndex] || steps[stepIndex]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Research Plan</h2>
          <p className="text-gray-400">
            {steps.length} steps generated from your research goal
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'planning' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
          status === 'executing' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
          status === 'completed' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
          'bg-gray-500/10 text-gray-400 border border-gray-500/20'
        }`}>
          {status}
        </span>
      </div>

      {steps.map((step, index) => {
        const displayStep = getDisplayStep(index)
        const isCurrent = index === currentStep
        const isCompleted = index < currentStep
        const isEditable = editingStep === index

        return (
          <div
            key={index}
            className={`glass rounded-xl border p-6 ${
              isCurrent
                ? 'border-primary-500/50 bg-primary-500/5'
                : isCompleted
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isCurrent
                      ? 'bg-primary-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {step.step_number}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{displayStep.title}</h3>
                  {displayStep.dependencies && displayStep.dependencies.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Depends on: {displayStep.dependencies.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!isEditable && (
                  <button
                    onClick={() => handleModify(index)}
                    className="px-3 py-1 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {onStepExecute && !isCompleted && (
                  <button
                    onClick={() => onStepExecute(index)}
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Execute
                  </button>
                )}
              </div>
            </div>

            {isEditable ? (
              <StepEditor
                step={displayStep}
                onSave={(modified) => handleSaveModification(index, modified)}
                onCancel={() => setEditingStep(null)}
              />
            ) : (
              <>
                <p className="text-gray-300 mb-4">{displayStep.description}</p>
                <div className="bg-[#0a0a0a] rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">Python</span>
                    {onStepSelect && (
                      <button
                        onClick={() => onStepSelect(index)}
                        className="text-xs text-primary-400 hover:text-primary-300"
                      >
                        Use in Notebook
                      </button>
                    )}
                  </div>
                  <pre className="text-sm text-gray-200 font-mono overflow-x-auto">
                    <code>{displayStep.code}</code>
                  </pre>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepEditor({
  step,
  onSave,
  onCancel,
}: {
  step: Step
  onSave: (step: Step) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(step.title)
  const [description, setDescription] = useState(step.description)
  const [code, setCode] = useState(step.code)

  const handleSave = () => {
    onSave({
      ...step,
      title,
      description,
      code,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full p-2 bg-[#0d0d0d] border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          rows={10}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
