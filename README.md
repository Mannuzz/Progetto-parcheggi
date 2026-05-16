# Parcheggi Brescia — Smart City Parking

Sistema di gestione parcheggi intelligenti per la città di Brescia, sviluppato come progetto scolastico. Permette agli utenti di visualizzare i posti disponibili su mappa, prenotarli in tempo reale e gestire i pagamenti orari. Gli amministratori possono gestire zone, stalli, utenti e visualizzare gli incassi.

---

## Tecnologie utilizzate

- **React 18** — interfaccia utente
- **Vite** — bundler e ambiente di sviluppo
- **Supabase** — database PostgreSQL, autenticazione e realtime
- **React Router v6** — navigazione tra le pagine
- **React Leaflet** — mappa interattiva con OpenStreetMap
- **Bootstrap 5 + Bootstrap Icons** — stile e componenti UI

---

## Struttura del progetto

```
src/
├── App.jsx                  # Entry point, routing e schermata di login
├── main.jsx                 # Monta l'app con BrowserRouter e AuthProvider
├── supabase.js              # Client Supabase (URL + chiave anonima)
│
├── context/
│   └── AuthContext.jsx      # Stato globale autenticazione e profilo utente
│
├── components/
│   ├── CityParkingMap.jsx   # Mappa Leaflet con i posti colorati per stato
│   └── layout/
│       ├── header.jsx       # Barra superiore con nome utente e logout
│       └── sidebar.jsx      # Navigazione laterale (diversa per admin/utente)
│
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.jsx   # Statistiche live e storico prenotazioni
│   │   ├── GestioneStalli.jsx   # CRUD posti + manutenzione + tariffe
│   │   ├── GestioneZone.jsx     # CRUD zone parcheggio
│   │   ├── GestioneUtenti.jsx   # Lista utenti + cambio ruolo + elimina
│   │   └── incassi.jsx          # Report incassi con filtro per data
│   │
│   └── user/
│       ├── UserDashboard.jsx    # Mappa + prenotazioni attive + sidebar
│       ├── BookParking.jsx      # Form nuova prenotazione
│       ├── vehicles.jsx         # Gestione veicoli personali
│       └── profile.jsx          # Profilo utente
```

---

## Database (Supabase / PostgreSQL)

### Tabelle principali

| Tabella | Descrizione |
|---|---|
| `profili_utenti` | Dati anagrafici e ruolo (cittadino / admin) |
| `veicoli` | Veicoli registrati dagli utenti |
| `zone` | Zone di parcheggio con coordinate e tipo area |
| `tipologie_posto` | Tipi di posto (standard, disabili, elettrico, moto...) |
| `posti` | Singoli posti con stato, tariffa e coordinate |
| `regole_tariffarie` | Tariffe per giorno/orario per zona |
| `prenotazioni` | Prenotazioni con ingresso, uscita e costo |
| `incassi` | Registro dei pagamenti completati |

### Vista
- **`v_posti_mappa`** — join tra posti, zone e tipologie, usata dalla mappa per mostrare stato e colore di ogni posto

### Funzione SQL
- **`gestisci_scadenze()`** — funzione PostgreSQL chiamata dal client ogni 30 secondi che chiude automaticamente le prenotazioni scadute, libera i posti e registra gli incassi

### Tipi enum
- `stato_posto` — libero, occupato, manutenzione
- `stato_prenotazione` — attiva, conclusa, scaduta, annullata, penale_applicata
- `tipo_veicolo` — auto, moto, furgone
- `alimentazione_veicolo` — benzina, diesel, gpl, ibrida, elettrica

---

## Autenticazione

Gestita interamente da **Supabase Auth**:

- Registrazione con email e password (conferma email disabilitata per semplicità)
- Login con email e password hashata automaticamente con bcrypt
- Il ruolo (admin / cittadino) è salvato nella tabella `profili_utenti`
- Un **trigger PostgreSQL** (`on_auth_user_created`) crea automaticamente il profilo utente a ogni nuova registrazione
- `AuthContext.jsx` espone `user`, `profilo`, `login`, `register`, `logout` a tutta l'app

---

## Funzionalità per ruolo

### Utente (cittadino)

- **Mappa interattiva** — visualizza tutti i posti colorati per stato (verde = libero gratis, blu = libero a pagamento, giallo = limitazioni, rosso = occupato, grigio = manutenzione)
- **Filtri** — per stato, tipo posto, costo, veicolo selezionato
- **Compatibilità veicolo** — i posti incompatibili vengono nascosti (GPL, solo elettrici, permesso disabili/residente)
- **Prenotazione** — massimo una prenotazione attiva alla volta, con selezione veicolo, posto e orario
- **Costo stimato** — calcolato in tempo reale con arrotondamento per eccesso all'ora intera
- **Costo live** — durante la prenotazione il costo accumulato si aggiorna ogni minuto
- **Timer** — tempo rimanente mostrato con colori (verde → giallo → rosso)
- **Checkout** — conclude la prenotazione, calcola il costo finale e registra l'incasso
- **Annulla** — disponibile solo se la prenotazione non è ancora iniziata
- **Elimina** — rimuove la prenotazione in qualsiasi momento con conferma
- **Gestione veicoli** — aggiunta e rimozione veicoli con permessi (disabili, residente)

### Amministratore

- **Dashboard** — statistiche in tempo reale (prenotazioni oggi, sessioni attive, incasso giornaliero, utenti totali) con aggiornamento automatico via Supabase Realtime
- **Storico prenotazioni** — tabella completa con ingresso, uscita prevista, uscita effettiva, costo e stato
- **Gestione stalli** — aggiunta, modifica, eliminazione posti; cambio tariffa; messa in manutenzione
- **Gestione zone** — aggiunta e modifica zone con coordinate, tipo area, GPL e attivazione
- **Gestione utenti** — lista completa, cambio ruolo admin/cittadino, eliminazione profilo
- **Report incassi** — totale per periodo con filtro date, dettaglio per zona e tabella transazioni

---

## Logica di tariffazione

- Il costo viene calcolato con **arrotondamento per eccesso all'ora intera**
  - 10 minuti → fatturata 1 ora
  - 1 ora e 5 minuti → fatturate 2 ore
- La scadenza automatica avviene esattamente all'orario di uscita previsto (non dopo 1 ora)
- I posti gratuiti non generano incassi
- Gli incassi vengono registrati sia al checkout manuale sia alla scadenza automatica

---

## Realtime

Supabase Realtime è attivo sulle tabelle `prenotazioni`, `posti` e `incassi`:

- La **dashboard admin** si aggiorna automaticamente quando arrivano nuovi incassi o cambiano le prenotazioni
- La **mappa utente** si aggiorna quando un posto cambia stato
- Un **intervallo di 30 secondi** chiama `gestisci_scadenze()` come fallback per le scadenze automatiche

---

## Installazione locale

```bash
# Clona il repository
git clone https://github.com/tuonome/smart-city-parking.git
cd smart-city-parking

# Installa le dipendenze
npm install

# Crea il file .env nella root
VITE_SUPABASE_URL=https://tuoprogetto.supabase.co
VITE_SUPABASE_ANON_KEY=la_tua_anon_key

# Avvia il server di sviluppo
npm run dev
```

---

## Deploy

Il progetto è deployato su **Vercel** con collegamento automatico al repository GitHub. Ogni `git push` aggiorna automaticamente il sito online.

Le variabili d'ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sono configurate nel pannello Vercel e non vengono mai esposte nel codice sorgente.

---

## Credenziali di test

| Ruolo | Email | Password |
|---|---|---|
| Admin | admin@parcheggibrescia.it | (impostata in Supabase) |
| Utente | qualsiasi email registrata | password scelta in fase di registrazione |

---

## Autori

Progetto realizzato per l'anno scolastico 2025/2026.
