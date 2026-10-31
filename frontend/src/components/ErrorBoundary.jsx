import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep diagnostics local to the browser; do not expose user data in logs.
    console.error('UI rendering error', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" style={{ padding: '3rem', textAlign: 'center' }}>
          <h1>Không thể hiển thị màn hình này</h1>
          <p>Vui lòng tải lại trang để tiếp tục.</p>
          <button type="button" onClick={() => window.location.reload()}>Tải lại</button>
        </main>
      );
    }
    return this.props.children;
  }
}
