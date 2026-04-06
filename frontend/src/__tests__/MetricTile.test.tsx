import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/utils';
import { MetricTile } from '../components/ui/MetricTile';

describe('MetricTile', () => {
  it('renders title and value', () => {
    render(<MetricTile title="Open Backlog" value={42} />);
    expect(screen.getByText('Open Backlog')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders subtitle and trend when provided', () => {
    render(<MetricTile title="Replay Success" value="88%" subtitle="Last 24h" trendText="+4.2%" />);
    expect(screen.getByText('Last 24h')).toBeInTheDocument();
    expect(screen.getByText('+4.2%')).toBeInTheDocument();
  });
});
