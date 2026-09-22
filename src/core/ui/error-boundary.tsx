import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorDisplay } from '@/core/errors/ErrorPage'
import { useLocation } from 'react-router-dom'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  error: Error | null
}

function ErrorBoundaryDisplay({ error }: { error: Error }) {
  const location = useLocation()
  return <ErrorDisplay error={error} location={location} />
}

/**
 * Catches render errors in the subtree and shows a rich error display
 * instead of unmounting the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('App shell error boundary caught:', error, info)
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorBoundaryDisplay error={this.state.error} />
    }
    return this.props.children
  }
}
