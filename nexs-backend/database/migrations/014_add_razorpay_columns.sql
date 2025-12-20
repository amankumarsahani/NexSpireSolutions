-- Add Razorpay integration columns to plans and tenants tables

-- Add razorpay_plan_id to plans table
ALTER TABLE plans 
ADD COLUMN razorpay_plan_id VARCHAR(100) NULL AFTER features;

-- Add razorpay_customer_id to tenants table
ALTER TABLE tenants 
ADD COLUMN razorpay_customer_id VARCHAR(100) NULL AFTER cf_dns_record_id;

-- Add index for faster lookups
CREATE INDEX idx_plans_razorpay ON plans(razorpay_plan_id);
CREATE INDEX idx_tenants_razorpay ON tenants(razorpay_customer_id);
