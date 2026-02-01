-- Migration: Add comprehensive custom domain columns to tenants table
-- This migration adds separate columns for CRM, Storefront, and API custom domains

ALTER TABLE tenants 
    ADD COLUMN IF NOT EXISTS custom_domain_crm VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS custom_domain_storefront VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS custom_domain_api VARCHAR(255) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS custom_domain_verified TINYINT(1) DEFAULT 0;

-- Migrate existing custom_domain data to custom_domain_crm (if any)
UPDATE tenants SET custom_domain_crm = custom_domain WHERE custom_domain IS NOT NULL AND custom_domain_crm IS NULL;
