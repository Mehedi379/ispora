import { Component } from "react";

// Kono page er render error-e puro app blank hoye jeto — ekhane dhore
// reload/diagnose er upay dey
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ui] render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-navy-950 p-6 text-center">
          <div className="max-w-md">
            <h1 className="font-display text-xl font-bold text-white">Kichu ekta bhul hoyeche</h1>
            <p className="mt-2 break-words text-sm text-slate-400">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button onClick={() => window.location.reload()} className="btn-gold mt-5 px-5 py-2.5 text-sm">
              Reload korun
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
