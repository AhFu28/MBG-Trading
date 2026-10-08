import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChartPredictionModal from '../ChartPredictionModal.jsx';
import { loadAchievementContext } from '../../services/achievements.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    _map: map,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

describe('ChartPredictionModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<ChartPredictionModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog when open', () => {
    render(
      <ChartPredictionModal
        isOpen={true}
        onClose={() => {}}
        initialSymbol="BTCUSDT"
        initialPrice="65000"
      />
    );

    expect(screen.getByRole('dialog', { name: /Arena Prediksi Chart/i })).toBeDefined();
    expect(screen.getByText(/ARENA PREDIKSI CHART & SKOR STRATEGI/i)).toBeDefined();
  });

  it('rejects an invalid BULLISH setup where stop loss sits above entry', async () => {
    render(
      <ChartPredictionModal
        isOpen={true}
        onClose={() => {}}
        initialSymbol="BTCUSDT"
      />
    );

    const entryInput = screen.getByLabelText(/Harga Entri \/ Saat Ini/i);
    const slInput = screen.getByLabelText(/Stop Loss \(Proteksi\)/i);
    const tpInput = screen.getByLabelText(/Target Take Profit/i);

    fireEvent.change(entryInput, { target: { value: '100' } });
    fireEvent.change(slInput, { target: { value: '110' } }); // stop loss above entry
    fireEvent.change(tpInput, { target: { value: '120' } });

    const submitBtn = screen.getByRole('button', { name: /KUNCI PREDIKSI STRATEGI/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Stop Loss harus di bawah harga entri/i)).toBeDefined();
    });
  });

  it('locks a valid prediction, displays success banner, and records potential points', async () => {
    const handleSuccess = vi.fn();

    render(
      <ChartPredictionModal
        isOpen={true}
        onClose={() => {}}
        initialSymbol="SOLUSDT"
        onPredictionSubmitted={handleSuccess}
      />
    );

    const entryInput = screen.getByLabelText(/Harga Entri \/ Saat Ini/i);
    const slInput = screen.getByLabelText(/Stop Loss \(Proteksi\)/i);
    const tpInput = screen.getByLabelText(/Target Take Profit/i);
    const rationale = screen.getByLabelText(/Alasan & Analisa Kuantitatif/i);

    fireEvent.change(entryInput, { target: { value: '100' } });
    fireEvent.change(slInput, { target: { value: '95' } });
    fireEvent.change(tpInput, { target: { value: '115' } });
    fireEvent.change(rationale, {
      target: { value: 'Konfirmasi bullish engulfing pada 4h demand zone kuat' },
    });

    const submitBtn = screen.getByRole('button', { name: /KUNCI PREDIKSI STRATEGI/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/berhasil dikunci/i)).toBeDefined();
    });

    expect(handleSuccess).toHaveBeenCalled();
  });
});
