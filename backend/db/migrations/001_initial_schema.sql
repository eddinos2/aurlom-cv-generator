-- Migration 001: Initial Schema
-- Création des tables de base pour Admiss-Flow

-- Table des candidats (synchronisée avec HubSpot)
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    hubspot_contact_id VARCHAR(255) UNIQUE,
    hubspot_deal_id VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    program VARCHAR(100), -- BTS MCO, BTS NDRC, etc.
    source VARCHAR(100), -- Meta Ad, Instagram, LinkedIn, etc.
    campus VARCHAR(100), -- Paris 17, Lyon, Marseille, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'Nouveau', -- Nouveau, Contacté, RDV fixé, Admis, No-show
    appointment_date TIMESTAMP,
    meta_lead_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_with_hubspot_at TIMESTAMP,
    synced_with_dashboard_at TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_candidates_hubspot_contact_id ON candidates(hubspot_contact_id);
CREATE INDEX IF NOT EXISTS idx_candidates_hubspot_deal_id ON candidates(hubspot_deal_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_meta_lead_id ON candidates(meta_lead_id);

-- Table d'historique des changements de statut
CREATE TABLE IF NOT EXISTS status_history (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255), -- User ID ou système (hubspot, meta, etc.)
    change_source VARCHAR(50), -- hubspot, dashboard, meta, docuseal, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_candidate_id ON status_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON status_history(created_at);

-- Table des documents DocuSeal
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    docuseal_document_id VARCHAR(255) UNIQUE NOT NULL,
    docuseal_submitter_id VARCHAR(255),
    document_type VARCHAR(100) NOT NULL, -- contrat_alternance, dossier_admission, etc.
    template_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, sent, viewed, signed, completed, declined
    file_url TEXT,
    signed_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_candidate_id ON documents(candidate_id);
CREATE INDEX IF NOT EXISTS idx_documents_docuseal_document_id ON documents(docuseal_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Table des logs de synchronisation
CREATE TABLE IF NOT EXISTS sync_logs (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE SET NULL,
    sync_type VARCHAR(50) NOT NULL, -- hubspot_to_db, db_to_hubspot, meta_to_hubspot, etc.
    direction VARCHAR(20) NOT NULL, -- inbound, outbound
    status VARCHAR(50) NOT NULL, -- success, error, pending
    source_system VARCHAR(50) NOT NULL, -- hubspot, meta, docuseal, dashboard
    target_system VARCHAR(50) NOT NULL,
    data_snapshot JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_candidate_id ON sync_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- Table des événements webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- hubspot, meta, docuseal
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
