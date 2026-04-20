'use client'

import { Component } from 'react'

export class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[CanvasErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#0a0a12',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: '#c0c0d0', fontFamily: 'Georgia, serif',
        }}>
          <h2 style={{ color: '#ff6b6b', marginBottom: 12 }}>Rendering Error</h2>
          <p style={{ maxWidth: 400, textAlign: 'center', opacity: 0.7, fontSize: 14 }}>
            The 3D scene encountered an error and cannot continue.
          </p>
          <pre style={{
            background: '#1a1a2e', padding: '12px 20px', borderRadius: 8,
            fontSize: 12, maxWidth: 500, overflow: 'auto', margin: '16px 0',
            color: '#ff8a8a',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#2a2a4a', border: '1px solid #4a4a6a',
              color: '#e0e0f0', padding: '10px 28px', borderRadius: 6,
              cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 14,
            }}
          >
            Restart
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export class UIErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[UIErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', bottom: 16, left: 16,
          background: 'rgba(20, 10, 10, 0.9)',
          border: '1px solid #ff4444',
          borderRadius: 8, padding: '12px 20px',
          color: '#ff8a8a', fontFamily: 'Georgia, serif',
          fontSize: 13, maxWidth: 350, zIndex: 9999,
        }}>
          <strong>UI Error</strong>
          <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: 12 }}>
            {this.state.error?.message || 'A UI component crashed.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: '#2a1a1a', border: '1px solid #4a2a2a',
              color: '#e0c0c0', padding: '4px 14px', borderRadius: 4,
              cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 12,
              marginTop: 8,
            }}
          >
            Dismiss
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
