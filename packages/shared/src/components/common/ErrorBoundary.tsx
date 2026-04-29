import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-3xl text-center m-6">
          <h2 className="text-xl font-black text-red-500 uppercase tracking-widest mb-2">Критична помилка вкладки</h2>
          <p className="text-slate-400 text-sm mb-6">{this.state.errorMsg}</p>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            className="px-6 py-2 bg-red-500 text-white font-bold rounded-xl text-sm uppercase tracking-widest"
          >
            Перезавантажити модуль
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
