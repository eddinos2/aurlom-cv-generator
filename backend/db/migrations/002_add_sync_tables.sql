-- Migration 002: Additional sync and mapping tables

-- Table de mapping des champs entre systèmes
CREATE TABLE IF NOT EXISTS field_mappings (
    id SERIAL PRIMARY KEY,
    source_system VARCHAR(50) NOT NULL, -- hubspot, meta, docuseal
    target_system VARCHAR(50) NOT NULL, -- dashboard, hubspot, docuseal
    source_field VARCHAR(255) NOT NULL,
    target_field VARCHAR(255) NOT NULL,
    transformation_type VARCHAR(50), -- direct, transform, lookup
    transformation_config JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_system, target_system, source_field, target_field)
);

CREATE INDEX IF NOT EXISTS idx_field_mappings_source_target ON field_mappings(source_system, target_system);

-- Table de configuration des automatisations
CREATE TABLE IF NOT EXISTS automation_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    automation_type VARCHAR(50) NOT NULL, -- zapier, make, internal
    trigger_event VARCHAR(100) NOT NULL,
    trigger_conditions JSONB,
    actions JSONB NOT NULL, -- Array of actions to execute
    is_active BOOLEAN DEFAULT TRUE,
    last_executed_at TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_configs_type ON automation_configs(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_configs_active ON automation_configs(is_active);

-- Table d'exécution des automatisations
CREATE TABLE IF NOT EXISTS automation_executions (
    id SERIAL PRIMARY KEY,
    automation_config_id INTEGER NOT NULL REFERENCES automation_configs(id) ON DELETE CASCADE,
    trigger_event_id VARCHAR(255), -- ID de l'événement qui a déclenché
    status VARCHAR(50) NOT NULL, -- running, success, error, cancelled
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_config_id ON automation_executions(automation_config_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_started_at ON automation_executions(started_at);

-- Trigger pour updated_at sur field_mappings
CREATE TRIGGER update_field_mappings_updated_at BEFORE UPDATE ON field_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_configs_updated_at BEFORE UPDATE ON automation_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
