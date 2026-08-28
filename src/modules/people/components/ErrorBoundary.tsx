import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Heading, Text } from '@/core/ui'

type ErrorBoundaryProps = {
  children: ReactNode
  /** Optional fallback title shown when an error is caught. */
  title?: string
}

type ErrorBoundaryState = {
  error: Error | null
}

/**
 * Catches render errors in the subtree and shows a friendly fallback with a
 * retry action instead of unmounting the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('People module error boundary caught:', error, info)
  }

  private handleRetry = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main>
          <Heading>{this.props.title ?? 'Something went wrong'}</Heading>
          <Text color="fg.muted">{this.state.error.message}</Text>
          <Button onClick={this.handleRetry}>Try again</Button>
        </main>
      )
    }
    return this.props.children
  }
}
