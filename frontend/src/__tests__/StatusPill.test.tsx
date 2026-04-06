import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/utils';
import { StatusPill } from '../components/ui/StatusPill';

describe('StatusPill', () => {
  it('renders canonical state labels', () => {
    render(<StatusPill state="blocked" />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('supports explicit label override', () => {
    render(<StatusPill state="failed" label="Errored" />);
    expect(screen.getByText('Errored')).toBeInTheDocument();
  });
});
