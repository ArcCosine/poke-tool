import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppProvider } from '../../context/AppContext';
import { PartySearch } from './PartySearch';

describe('PartySearch Component', () => {
  const mockParties = [
    { id: '1', name: 'ガチ対戦パ' },
    { id: '2', name: '雨パ' },
  ];

  it('renders editing party status and saved parties count', () => {
    render(
      <AppProvider>
        <PartySearch
          partyName="ガチ対戦パ"
          parties={mockParties}
          onSelectParty={vi.fn()}
          onPartyNameChange={vi.fn()}
        />
      </AppProvider>
    );

    expect(screen.getAllByText('ガチ対戦パ').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/全 2 個のパーティ中/)).toBeDefined();
  });

  it('triggers onPartyNameChange immediately when user types in the party name input', () => {
    const onSelectParty = vi.fn();
    const onPartyNameChange = vi.fn();

    render(
      <AppProvider>
        <PartySearch
          partyName=""
          parties={mockParties}
          onSelectParty={onSelectParty}
          onPartyNameChange={onPartyNameChange}
        />
      </AppProvider>
    );

    const input = screen.getByLabelText(/^パーティ名$/i);
    fireEvent.change(input, { target: { value: '晴れパ' } });

    expect(onPartyNameChange).toHaveBeenCalledWith('晴れパ');
  });

  it('triggers onSelectParty when choosing a party from the saved parties select dropdown', () => {
    const onSelectParty = vi.fn();
    const onPartyNameChange = vi.fn();

    render(
      <AppProvider>
        <PartySearch
          partyName="ガチ対戦パ"
          parties={mockParties}
          onSelectParty={onSelectParty}
          onPartyNameChange={onPartyNameChange}
        />
      </AppProvider>
    );

    const select = screen.getByLabelText(/保存済みパーティから選択/i);
    fireEvent.change(select, { target: { value: '2' } });

    expect(onSelectParty).toHaveBeenCalledWith('2');
  });
});
