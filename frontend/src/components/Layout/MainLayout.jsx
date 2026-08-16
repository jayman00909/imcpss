import React from 'react';
import Navbar from './Navbar';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
