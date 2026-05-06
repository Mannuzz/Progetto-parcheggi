import React from 'react';

const StatusBadge = ({ type, status }) => {
  // Configurazione degli stili per tipo di dato
  const config = {
    // Stati Prenotazione
    prenotazione: {
      attiva: { bg: 'bg-success', label: 'Attiva' },
      conclusa: { bg: 'bg-secondary', label: 'Conclusa' },
      penale_applicata: { bg: 'bg-danger', label: 'Penale' },
    },
    // Stati Stallo
    stallo: {
      libero: { bg: 'bg-success-subtle text-success', label: 'Libero' },
      occupato: { bg: 'bg-danger-subtle text-danger', label: 'Occupato' },
      manutenzione: { bg: 'bg-warning-subtle text-warning-emphasis', label: 'In Manutenzione' },
    },
    // Ruoli Utente
    ruolo: {
      admin: { bg: 'bg-dark', label: 'Admin' },
      cliente: { bg: 'bg-success', label: 'Cliente' },
    }
  };

  const currentStatus = config[type]?.[status] || { bg: 'bg-light text-dark', label: status };

  return (
    <span className={`badge ${currentStatus.bg} px-2 py-1`}>
      {currentStatus.label}
    </span>
  );
};

export default StatusBadge;