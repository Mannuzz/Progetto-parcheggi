import React from 'react';

const KpiCard = ({ title, value, color = "success", icon, isGreenBg = false }) => {
  return (
    <div className="col-12 col-md-6 col-lg-3 mb-3">
      <div className={`card p-3 border-start border-4 border-${color} shadow-sm ${isGreenBg ? 'bg-success bg-opacity-10' : ''}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="text-muted small fw-semibold text-uppercase">{title}</div>
            <div className={`fs-2 fw-bold text-${color}`}>{value}</div>
          </div>
          {icon && (
            <div className={`fs-1 text-${color} opacity-50`}>
              <i className={`bi bi-${icon}`}></i>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KpiCard;