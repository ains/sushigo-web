import { Routes, Route } from 'react-router-dom';
import { TabletView } from './components/tablet/TabletView';
import { TVView } from './components/tv/TVView';
import { MobileView } from './components/mobile/MobileView';
import { SpectatorView } from './components/spectator/SpectatorView';
import { DebugView } from './components/debug/DebugView';
import { useGame } from './context/GameContext';

function App() {
  const { isConnected, error, clearError } = useGame();

  return (
    <div className="app">
      {!isConnected && <div className="connection-status">Connecting to server...</div>}

      {error && (
        <div className="error-toast" onClick={clearError}>
          {error}
          <span className="close">&times;</span>
        </div>
      )}

      <Routes>
        <Route path="/" element={<TabletView />} />
        <Route path="/tv" element={<TVView />} />
        <Route path="/spectate/:code" element={<SpectatorView />} />
        <Route path="/join/:code?" element={<MobileView />} />
        <Route path="/debug/:view?" element={<DebugView />} />
      </Routes>
    </div>
  );
}

export default App;
