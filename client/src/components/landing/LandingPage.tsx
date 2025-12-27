import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export function LandingPage() {
  const navigate = useNavigate();
  const [spectateCode, setSpectateCode] = useState('');

  const handleSpectate = () => {
    if (spectateCode.trim()) {
      navigate(`/spectate/${spectateCode.trim().toUpperCase()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSpectate();
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">Sushi Go!</h1>

        <div className="landing-section">
          <h2>Remote Play</h2>
          <p className="section-description">Play online with friends on separate devices</p>
          <button className="btn btn-success btn-large" onClick={() => navigate('/remote')}>
            Start Remote Game
          </button>
        </div>

        <div className="landing-section">
          <h2>Local Play</h2>
          <p className="section-description">Play together on shared screens</p>
          <div className="button-group">
            <button className="btn btn-primary btn-large" onClick={() => navigate('/tv')}>
              New Game (TV)
            </button>
            <button className="btn btn-primary btn-large" onClick={() => navigate('/tablet')}>
              New Game (Tablet)
            </button>
          </div>
        </div>

        <div className="landing-section">
          <h2>Spectate a Game</h2>
          <div className="spectate-form">
            <input
              type="text"
              placeholder="Enter game code"
              value={spectateCode}
              onChange={(e) => setSpectateCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              maxLength={4}
              className="code-input"
            />
            <button
              className="btn btn-secondary btn-large"
              onClick={handleSpectate}
              disabled={!spectateCode.trim()}
            >
              Spectate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
