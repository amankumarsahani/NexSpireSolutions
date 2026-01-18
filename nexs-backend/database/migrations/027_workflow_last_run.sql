-- Migration: 027_workflow_last_run.sql
-- Description: Add last_run_at column to workflows for scheduled execution tracking

ALTER TABLE workflows ADD COLUMN last_run_at TIMESTAMP NULL;
