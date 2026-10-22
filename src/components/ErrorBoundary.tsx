import { Component, type ReactNode } from 'react';

/**
 * If a sheet or ritual throws, close it and keep the temple running, rather than letting
 * one broken panel blank the whole page.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; onReset?: () => void; fullPage?: boolean }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) {
    return { err };
  }
  componentDidCatch(err: Error) {
    console.error('[Phủ Vân Thủy]', err);
  }
  private reset = () => {
    this.setState({ err: null });
    if (this.props.fullPage) location.reload();
    else this.props.onReset?.();
  };
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className={`${this.props.fullPage ? 'fixed inset-0 bg-[#211a15]' : 'fixed inset-0 bg-black/40'} z-[80] flex items-center justify-center p-6`} role="alertdialog">
        <div className="dh-paper rounded-md p-6 max-w-sm text-center text-[#211a15] border-2 border-[#211a15]">
          <div className="dh-title text-xl">Gió thổi tắt nến</div>
          <p className="mt-2 text-sm italic">A gust blew this candle out. Nothing you have found is lost.</p>
          <button onClick={this.reset} className="mt-4 px-5 py-2 rounded-md dh-seal font-semibold cursor-pointer">
            {this.props.fullPage ? 'Light it again' : 'Back to the temple'}
          </button>
        </div>
      </div>
    );
  }
}
