import React, { ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to show fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    // Example: logErrorToService(error, info)
    // For now, just console.error:
    console.error('Uncaught error:', error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      const isEnvError = error?.message.includes('Attempt to get default algod configuration')

      return (
        <div className="hero min-h-screen bg-teal-400 px-4" style={{ background: '#1e40af' }}>
          <div className="hero-content text-center rounded-lg p-8 max-w-lg bg-white mx-auto shadow-lg">
            <h1 className="text-4xl font-extrabold mb-4 text-red-600">Oops! Something went wrong.</h1>
            <p
              role="alert"
              className="mb-6 text-gray-700 whitespace-pre-line"
              data-testid="error-message"
            >
              {isEnvError
                ? `It looks like your environment variables are not set up correctly.\n\nPlease create a .env file based on .env.template and fill in the required Algod and Indexer configurations to connect to the Algorand network.`
                : error?.message || 'An unexpected error occurred.'}
            </p>

            <button
              onClick={this.handleReset}
              className="btn bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Try again"
              data-testid="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
