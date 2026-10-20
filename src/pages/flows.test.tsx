import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { initialState, useApp } from '@/store/useApp';

const renderAt = (path: string) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

beforeEach(() => { useApp.setState(initialState()); });

describe('user journeys', () => {
  it('orientation test: answer, skip, go back, and the answer is kept', async () => {
    const user = userEvent.setup();
    renderAt('/test?q=q1-pick');
    const first = await screen.findByRole('checkbox', { name: /same national migration policy/i });
    await user.click(first);
    expect(first).toBeChecked();
    // a follow-up question about that choice now exists
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByRole('heading', { name: /What draws you to it most/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /skip/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(useApp.getState().answers['q1-why-sc-munis'].skipped).toBe(true);
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(await screen.findByRole('checkbox', { name: /same national migration policy/i })).toBeChecked();
  });

  it('recommendations: a reaction changes state, and undo reverses it', async () => {
    const user = userEvent.setup();
    renderAt('/topics');
    const cards = await screen.findAllByRole('article');
    const title = within(cards[0]).getByRole('heading', { level: 2 }).textContent;
    await user.click(within(cards[0]).getByRole('button', { name: 'Not for me' }));
    expect(useApp.getState().feedbackLog).toHaveLength(1);
    expect(await screen.findByRole('heading', { name: /set aside/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /undo last reaction/i }));
    expect(useApp.getState().feedbackLog).toHaveLength(0);
    expect(within((await screen.findAllByRole('article'))[0]).getByRole('heading', { level: 2 }).textContent).toBe(title);
  });

  it('interface preferences change the real navigation order', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await screen.findByRole('heading', { level: 1 });
    const labels = () => within(screen.getByRole('navigation', { name: 'Main', hidden: true })).getAllByRole('link', { hidden: true }).map((a) => a.textContent?.replace(/\d+$/, ''));
    expect(labels().indexOf('Orientation')).toBeLessThan(labels().indexOf('Map'));
    await user.click(screen.getByRole('button', { name: /settings/i }));
    await user.click(await screen.findByRole('button', { name: 'Visual explorer' }));
    await user.click(screen.getByRole('button', { name: 'Guided discovery' }));
    expect(labels().indexOf('Map')).toBeLessThan(labels().indexOf('Orientation'));
  });

  it('shortlist: saving topics and an empty state on the dashboard', async () => {
    const user = userEvent.setup();
    const { unmount } = renderAt('/dashboard');
    expect(await screen.findByText('Nothing saved yet')).toBeInTheDocument();
    unmount();
    renderAt('/topics');
    const save = (await screen.findAllByRole('button', { name: /^Save “/ }))[0];
    await user.click(save);
    expect(useApp.getState().saved).toHaveLength(1);
  });
});
