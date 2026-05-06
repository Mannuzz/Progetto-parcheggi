import React from 'react';

const Footer = () => (
  <footer className="text-center text-muted small py-4 mt-5 border-top bg-white">
    <div className="container">
      <strong>🅿️ ParcheggiBS</strong> — Brescia Green Park &copy; {new Date().getFullYear()}<br />
      <span className="text-success">
        <i className="bi bi-leaf"></i> Progetto sostenibile per ridurre le emissioni CO₂ in città
      </span>
    </div>
  </footer>
);

export default Footer;