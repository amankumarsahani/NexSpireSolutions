-- Migration: 025_automation_workflows.sql
-- Description: Automation workflow system tables

-- ============================================
-- WORKFLOWS (the automation definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS workflows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    
    -- Trigger configuration
    trigger_type ENUM(
        'lead_created', 
        'client_created', 
        'lead_status_changed',
        'client_status_changed',
        'task_due', 
        'form_submitted', 
        'scheduled', 
        'manual'
    ) NOT NULL,
    trigger_config JSON COMMENT 'Additional trigger settings like filters, schedule cron',
    
    -- Metadata
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_trigger (trigger_type),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- WORKFLOW NODES (steps in the workflow)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_id INT NOT NULL,
    node_uid VARCHAR(50) NOT NULL COMMENT 'Frontend node unique ID',
    
    -- Node type and action
    node_type ENUM('trigger', 'action', 'condition', 'delay') NOT NULL,
    action_type VARCHAR(50) COMMENT 'send_email, update_lead, create_task, etc.',
    
    -- Node configuration
    label VARCHAR(100),
    config JSON COMMENT 'Node-specific configuration',
    
    -- Visual position for editor
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_workflow (workflow_id),
    UNIQUE KEY uk_node_uid (workflow_id, node_uid),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- ============================================
-- WORKFLOW CONNECTIONS (edges between nodes)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_connections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_id INT NOT NULL,
    source_node_id INT NOT NULL,
    target_node_id INT NOT NULL,
    source_handle VARCHAR(50) DEFAULT 'default' COMMENT 'For conditions: yes, no, default',
    
    INDEX idx_workflow (workflow_id),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);

-- ============================================
-- WORKFLOW EXECUTIONS (execution instances)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_executions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workflow_id INT NOT NULL,
    
    -- Trigger context
    trigger_entity_type VARCHAR(50) COMMENT 'lead, client, task, etc.',
    trigger_entity_id INT,
    trigger_data JSON COMMENT 'Full trigger payload',
    
    -- Execution status
    status ENUM('pending', 'running', 'waiting', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    current_node_id INT COMMENT 'Currently executing or waiting node',
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    next_run_at TIMESTAMP COMMENT 'For delayed executions',
    
    error_message TEXT,
    
    INDEX idx_workflow (workflow_id),
    INDEX idx_status (status),
    INDEX idx_next_run (next_run_at),
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- ============================================
-- WORKFLOW EXECUTION LOGS (per-node logs)
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    execution_id INT NOT NULL,
    node_id INT NOT NULL,
    
    -- Node execution status
    status ENUM('pending', 'running', 'completed', 'failed', 'skipped') DEFAULT 'pending',
    
    -- Data
    input_data JSON,
    output_data JSON,
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    INDEX idx_execution (execution_id),
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES workflow_nodes(id) ON DELETE CASCADE
);
