import { ReactNode } from 'react';
import { Card as CardType, CardType as CardTypeEnum } from '../../types';
import './Card.css';

interface CardProps {
  card: CardType;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showPoints?: boolean;
}

const cardNames: Record<CardTypeEnum, string> = {
  tempura: 'Tempura',
  sashimi: 'Sashimi',
  dumpling: 'Dumpling',
  maki1: 'Maki - x1',
  maki2: 'Maki - x2',
  maki3: 'Maki - x3',
  nigiri_egg: 'Egg Nigiri',
  nigiri_salmon: 'Salmon Nigiri',
  nigiri_squid: 'Squid Nigiri',
  wasabi: 'Wasabi',
  pudding: 'Pudding',
  chopsticks: 'Chopsticks',
};

const cardEmojis: Record<CardTypeEnum, string> = {
  tempura: '🍤',
  sashimi: '🍣',
  dumpling: '🥟',
  maki1: '🍱',
  maki2: '🍱🍱',
  maki3: '🍱🍱🍱',
  nigiri_egg: '🥚',
  nigiri_salmon: '🐟',
  nigiri_squid: '🦑',
  wasabi: '🌿',
  pudding: '🍮',
  chopsticks: '🥢',
};

const cardPoints: Record<CardTypeEnum, ReactNode> = {
  tempura: (
    <>
      <strong>5 pts</strong> per pair
    </>
  ),
  sashimi: (
    <>
      <strong>10 pts</strong> per set of 3
    </>
  ),
  dumpling: (
    <>
      <strong>1/3/6/10/15</strong> pts
    </>
  ),
  maki1: (
    <>
      <br />
      Most: 6 pts
      <br /> 2nd: 3 pts
    </>
  ),
  maki2: (
    <>
      <br />
      Most: 6 pts
      <br /> 2nd: 3 pts
    </>
  ),
  maki3: (
    <>
      <br />
      Most: 6 pts
      <br /> 2nd: 3 pts
    </>
  ),
  nigiri_egg: (
    <>
      <strong>1 pt</strong>
    </>
  ),
  nigiri_salmon: (
    <>
      <strong>2 pts</strong>
    </>
  ),
  nigiri_squid: (
    <>
      <strong>3 pts</strong>
    </>
  ),
  wasabi: (
    <>
      <strong>×3 pts</strong> next Nigiri
    </>
  ),
  pudding: (
    <>
      <em>Scored at the end of the game</em>
      <br />
      Most: +6 · Least: −6
    </>
  ),
  chopsticks: (
    <>
      Swap to play
      <br />
      <strong>2 cards</strong> in one turn
    </>
  ),
};

export function Card({
  card,
  size = 'medium',
  selected = false,
  onClick,
  disabled = false,
  showPoints = true,
}: CardProps) {
  return (
    <div
      className={`card card-${card.type} card-${size} ${
        selected ? 'selected' : ''
      } ${onClick && !disabled ? 'clickable' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      <div className="card-emoji">{cardEmojis[card.type]}</div>
      <div className="card-name">{cardNames[card.type]}</div>
      {showPoints && <div className="card-points">{cardPoints[card.type]}</div>}
      {selected && <div className="card-checkmark">✓</div>}
    </div>
  );
}

export function CardBack({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  return (
    <div className={`card card-back card-${size}`}>
      <div className="card-emoji">🍱</div>
    </div>
  );
}
