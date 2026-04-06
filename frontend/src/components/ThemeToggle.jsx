import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  // Initialize state by checking if they previously saved a preference
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Whenever isDark changes, update the HTML tag and save to localStorage
  useEffect(() => {
    const root = document.documentElement; // Targets the <html> tag
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      style={{
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-main)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontWeight: 'bold'
      }}
    >
      {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
    </button>
  );
}