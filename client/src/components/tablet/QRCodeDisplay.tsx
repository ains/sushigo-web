import { QRCodeSVG } from 'qrcode.react';
import './QRCodeDisplay.css';

interface QRCodeDisplayProps {
  code: string;
  serverUrl: string;
}

export function QRCodeDisplay({ code, serverUrl }: QRCodeDisplayProps) {
  const joinUrl = `${serverUrl}/join/${code}`;

  return (
    <div className="qr-display">
      <div className="qr-code-wrapper">
        <QRCodeSVG
          value={joinUrl}
          size={280}
          level="M"
          includeMargin
          bgColor="#ffffff"
          fgColor="#1a1a2e"
        />
      </div>
      <div className="join-info">
        <p className="scan-text">Scan to join!</p>
        <div className="game-code">
          <span className="code-label">Game Code:</span>
          <span className="code-value">{code}</span>
        </div>
        <p className="url-text">{joinUrl}</p>
      </div>
    </div>
  );
}
