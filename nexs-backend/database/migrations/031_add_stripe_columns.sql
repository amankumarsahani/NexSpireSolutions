-- Add Stripe integration columns to tenants, plans, subscriptions, payments tables

-- tenants: stripe_customer_id
ALTER TABLE tenants
ADD COLUMN stripe_customer_id VARCHAR(100) NULL AFTER razorpay_customer_id;

-- plans: stripe_plan_id
ALTER TABLE plans
ADD COLUMN stripe_plan_id VARCHAR(100) NULL AFTER razorpay_plan_id;

-- subscriptions: stripe_subscription_id
ALTER TABLE subscriptions
ADD COLUMN stripe_subscription_id VARCHAR(100) NULL AFTER razorpay_subscription_id;

-- payments: stripe_payment_intent_id, stripe_invoice_id
ALTER TABLE payments
ADD COLUMN stripe_payment_intent_id VARCHAR(100) NULL AFTER razorpay_payment_id,
ADD COLUMN stripe_invoice_id VARCHAR(100) NULL AFTER stripe_payment_intent_id;
