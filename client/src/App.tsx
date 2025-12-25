import { Routes, Route } from 'react-router-dom';
import { TabletView } from './components/tablet/TabletView';
import { TVView } from './components/tv/TVView';
import { MobileView } from './components/mobile/MobileView';
import { useGame } from './context/GameContext';

function App() {
  const { isConnected, error, clearError } = useGame();

  return (
    <div className="app">
      {!isConnected && (
        <div className="connection-status">
          Connecting to server...
        </div>
      )}

      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
          <span className="close">&times;</span>
        </div>
      )}

      <Routes>
        <Route path="/" element={<TabletView />} />
        <Route path="/tv" element={<TVView />} />
        <Route path="/join/:code?" element={<MobileView />} />
      </Routes>
    </div>
  );
}

export default App;
