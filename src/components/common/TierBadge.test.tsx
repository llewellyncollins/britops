import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  it('renders Free label for free tier', () => {
    render(<TierBadge tier="free" />);
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('renders Signed In label for signed-in tier', () => {
    render(<TierBadge tier="signed-in" />);
    expect(screen.getByText('Signed In')).toBeInTheDocument();
  });

  it('renders Pro label for paid tier', () => {
    render(<TierBadge tier="paid" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<TierBadge tier="paid" className="extra-class" />);
    const badge = screen.getByText('Pro');
    expect(badge.className).toContain('extra-class');
  });
});
