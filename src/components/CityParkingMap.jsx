import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function getColor(statoMappa) {
  switch (statoMappa) {
    case 'libero_gratis': return '#10b981'
    case 'libero_pagamento': return '#3b82f6'
    case 'libero_limitazioni': return '#f59e0b'
    case 'occupato': return '#ef4444'
    default: return '#6b7280'
  }
}

export default function CityParkingMap({ posti }) {
  // Filtra solo i posti con coordinate valide
  const postiValidi = posti.filter(p => p.lat != null && p.lng != null)

  return (
    <MapContainer center={[45.5415, 10.2192]} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {postiValidi.map((posto) => (
        <CircleMarker
          key={posto.id}
          center={[Number(posto.lat), Number(posto.lng)]}
          radius={10}
          pathOptions={{ color: getColor(posto.stato_mappa), fillColor: getColor(posto.stato_mappa), fillOpacity: 0.85, weight: 2 }}
        >
          <Popup>
            <div style={{ fontFamily: 'sans-serif', minWidth: '180px' }}>
              <p style={{ margin: '0 0 6px', fontWeight: 'bold', fontSize: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
                {posto.codice_posto}
              </p>
              <p style={{ margin: '3px 0' }}>📍 {posto.zona_nome} — {posto.quartiere}</p>
              <p style={{ margin: '3px 0' }}>🏷️ {posto.tipologia_nome}</p>
              <p style={{ margin: '3px 0' }}>💶 {posto.tariffa_oraria > 0 ? `€ ${posto.tariffa_oraria}/h` : 'Gratuito'}</p>
              {posto.solo_elettriche && <p style={{ margin: '3px 0', color: '#3b82f6' }}>⚡ Colonnina ricarica</p>}
              {posto.richiede_permesso_disabili && <p style={{ margin: '3px 0', color: '#8b5cf6' }}>♿ Solo disabili</p>}
              {posto.richiede_permesso_residente && <p style={{ margin: '3px 0', color: '#f59e0b' }}>🏠 Solo residenti</p>}
              {posto.limite_minuti && <p style={{ margin: '3px 0', color: '#ef4444' }}>⏱ Max {posto.limite_minuti} min</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}