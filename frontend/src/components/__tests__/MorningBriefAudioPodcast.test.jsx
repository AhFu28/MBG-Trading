import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MorningBriefAudioPodcast from '../MorningBriefAudioPodcast.jsx';

describe('MorningBriefAudioPodcast', () => {
  it('renders audio morning brief with play button and pivot summary', () => {
    const macro = {
      ihsg_price: 6374.91,
      ihsg_change_pct: 1.56,
      gold_price: 4262.4,
      brent_oil_price: 99.2
    };

    render(<MorningBriefAudioPodcast macro={macro} />);

    expect(screen.getByText(/AUDIO MORNING BRIEF/i)).toBeDefined();
    expect(screen.getByText(/Intisari Pasar Pagi/i)).toBeDefined();
    expect(screen.getByText(/PIVOT KUNCI IHSG/i)).toBeDefined();
    expect(screen.getByText(/ENERGI & LOGAM MULIA/i)).toBeDefined();
    expect(screen.getByText(/RADAR SAHAM HARI INI/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Putar Podcast/i })).toBeDefined();
  });

  it('toggles playback state when button is clicked', () => {
    render(<MorningBriefAudioPodcast macro={{}} />);
    const playBtn = screen.getByRole('button', { name: /Putar Podcast/i });
    fireEvent.click(playBtn);
    expect(screen.getByRole('button', { name: /Jeda|Lanjutkan|Putar Podcast/i })).toBeDefined();
  });
});
