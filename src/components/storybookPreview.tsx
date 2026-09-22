import type { ReactNode } from 'react';

export const PreviewFrame = ({ children }: { children: ReactNode }) => (
  <div style={{ minHeight: '12rem', padding: '2rem' }}>{children}</div>
);

export const BoundaryNote = ({ children }: { children: ReactNode }) => (
  <p className="eyebrow" style={{ marginBottom: '1rem' }}>
    {children}
  </p>
);
