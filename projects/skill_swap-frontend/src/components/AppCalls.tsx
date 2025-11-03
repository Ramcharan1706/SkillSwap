import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { SkillSwapFactory } from '../contracts/SkillSwap'
import { OnSchemaBreak, OnUpdate } from '@algorandfoundation/algokit-utils/types/app'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

interface AppCallsProps {
  openModal: boolean
  setModalState: (value: boolean) => void
}
type ActionType = 'register' | 'list_skill' | 'book_session' | 'complete_session'

const AppCalls: React.FC<AppCallsProps> = ({ openModal, setModalState }) => {
  const { enqueueSnackbar } = useSnackbar()
  const { transactionSigner, activeAddress } = useWallet()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [action, setAction] = useState<ActionType>('register')
  const [form, setForm] = useState({
    name: '',
    skillName: '',
    description: '',
    rate: 0,
    skillId: 0,
    hours: 1,
    sessionId: 0,
  })
  const [loading, setLoading] = useState(false)

  // Memoize AlgorandClient for efficiency
  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const indexerConfig = getIndexerConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
    if (transactionSigner) {
      client.setDefaultSigner(transactionSigner)
    }
    return client
  }, [transactionSigner])

  // Validate form inputs based on current action
  const isFormValid = (): boolean => {
    switch (action) {
      case 'register':
        return form.name.trim().length > 0
      case 'list_skill':
        return form.skillName.trim().length > 0 && form.description.trim().length > 0 && form.rate > 0
      case 'book_session':
        return form.skillId > 0 && form.hours > 0
      case 'complete_session':
        return form.sessionId > 0
      default:
        return false
    }
  }

  // Update form state helper
  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm(prev => ({
      ...prev,
      [key]: typeof value === 'string' ? value : Number(value),
    }))
  }

  // Handle app call submission
  const sendAppCall = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Wallet not connected', { variant: 'warning' })
      return
    }

    setLoading(true)

    try {
      const factory = new SkillSwapFactory({
        defaultSender: activeAddress,
        algorand,
      })

      const deployResult = await factory.deploy({
        onSchemaBreak: OnSchemaBreak.AppendApp,
        onUpdate: OnUpdate.AppendApp,
      })

      const { appClient } = deployResult

      switch (action) {
        case 'register': {
          const response = await appClient.send.register_user({ name: form.name.trim() })
          enqueueSnackbar(`User registered: ${response.return}`, { variant: 'success' })
          break
        }

        case 'list_skill': {
          const response = await appClient.send.list_skill({
            name: form.skillName.trim(),
            description: form.description.trim(),
            hourly_rate: form.rate,
          })
          enqueueSnackbar(`Skill listed with ID: ${response.return}`, { variant: 'success' })
          break
        }

        case 'book_session': {
          const response = await appClient.send.book_session({
            skill_id: form.skillId,
            hours: form.hours,
          })
          enqueueSnackbar(`Session booked with ID: ${response.return}`, { variant: 'success' })
          break
        }

        case 'complete_session': {
          await appClient.send.complete_session({ session_id: form.sessionId })
          enqueueSnackbar('Session completed', { variant: 'success' })
          break
        }
      }
    } catch (e: any) {
      enqueueSnackbar(`Error: ${e.message || e.toString()}`, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Close modal on ESC key press for better UX
  useEffect(() => {
    if (!openModal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalState(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openModal, setModalState])

  return (
    <dialog
      id="appcalls_modal"
      className={`modal ${openModal ? 'modal-open' : ''} bg-black/50 backdrop-blur-sm`}
      onClose={() => setModalState(false)}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      ref={dialogRef}
      open={openModal}
      style={{ background: 'linear-gradient(to bottom right, #581c87, #3730a3)' }}
    >
      <form
        method="dialog"
        className="modal-box bg-transparent backdrop-blur-sm border border-white/20 shadow-2xl max-w-2xl"
        onSubmit={e => {
          e.preventDefault()
          if (!loading && isFormValid()) sendAppCall()
        }}
      >
        {/* Header */}
        <header className="mb-6">
          <h3 id="modal-title" className="font-bold text-xl text-gray-800">
            SkillSwap Contract Calls
          </h3>
        </header>

        {/* Select Action */}
        <div className="space-y-6">
          <label htmlFor="action-select" className="block text-sm font-medium text-gray-700 mb-3">
            Select Action
          </label>
          <select
            id="action-select"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-transparent"
            value={action}
            onChange={(e) => setAction(e.target.value as ActionType)}
            disabled={loading}
            aria-controls="form-fields"
          >
            <option value="register">Register User</option>
            <option value="list_skill">List Skill</option>
            <option value="book_session">Book Session</option>
            <option value="complete_session">Complete Session</option>
          </select>

          {/* Form Fields Group */}
          <fieldset id="form-fields" className="space-y-4" aria-live="polite" disabled={loading}>
            {action === 'register' && (
              <InputField
                label="Name"
                placeholder="Enter your name"
                value={form.name}
                onChange={(val) => handleChange('name', val)}
                type="text"
              />
            )}

            {action === 'list_skill' && (
              <>
                <InputField
                  label="Skill Name"
                  placeholder="e.g., Python Programming"
                  value={form.skillName}
                  onChange={(val) => handleChange('skillName', val)}
                  type="text"
                />
                <InputField
                  label="Hourly Rate (tokens)"
                  placeholder="e.g., 10"
                  value={form.rate}
                  onChange={(val) => handleChange('rate', val)}
                  type="number"
                  min={1}
                />
                <TextAreaField
                  label="Description"
                  placeholder="Describe your skill and what you'll teach"
                  value={form.description}
                  onChange={(val) => handleChange('description', val)}
                  rows={3}
                />
              </>
            )}

            {action === 'book_session' && (
              <>
                <InputField
                  label="Skill ID"
                  placeholder="Enter skill ID"
                  value={form.skillId}
                  onChange={(val) => handleChange('skillId', val)}
                  type="number"
                  min={1}
                />
                <InputField
                  label="Hours"
                  placeholder="Number of hours"
                  value={form.hours}
                  onChange={(val) => handleChange('hours', val)}
                  type="number"
                  min={1}
                />
              </>
            )}

            {action === 'complete_session' && (
              <InputField
                label="Session ID"
                placeholder="Enter session ID"
                value={form.sessionId}
                onChange={(val) => handleChange('sessionId', val)}
                type="number"
                min={1}
              />
            )}
          </fieldset>
        </div>

        {/* Buttons */}
        <footer className="modal-action mt-8 flex justify-end gap-4">
          <button
            type="button"
            className="btn btn-outline border-gray-300 text-gray-700 hover:bg-transparent px-6 py-2"
            onClick={() => setModalState(false)}
            disabled={loading}
          >
            Close
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !isFormValid()}
            aria-disabled={loading || !isFormValid()}
          >
            {loading ? 'Sending...' : 'Send Call'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}

// Reusable Input component
interface InputFieldProps {
  label: string
  placeholder?: string
  value: string | number
  onChange: (value: string | number) => void
  type?: React.HTMLInputTypeAttribute
  min?: number
  disabled?: boolean
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  min,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      min={min}
      disabled={disabled}
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
      aria-label={label}
    />
  </div>
)

// Reusable TextArea component
interface TextAreaFieldProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  disabled?: boolean
}

const TextAreaField: React.FC<TextAreaFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  rows = 3,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      placeholder={placeholder}
      value={value}
      rows={rows}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-y"
      aria-label={label}
    />
  </div>
)

export default AppCalls
