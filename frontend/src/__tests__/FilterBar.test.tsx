import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/utils';
import { FilterBar } from '../components/ui/FilterBar';

describe('FilterBar', () => {
  it('renders children and action area', () => {
    render(
      <FilterBar actions={<button>Reset</button>}>
        <input aria-label="search" />
      </FilterBar>
    );

    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByLabelText('search')).toBeInTheDocument();
    expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
  });
});
