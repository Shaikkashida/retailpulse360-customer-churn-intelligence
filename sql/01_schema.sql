-- ============================================================
-- RetailPulse 360 | Customer Churn Intelligence Platform
-- File: 01_schema.sql
-- Description: Database schema creation for churn analysis
-- Author: Shaik Kashida
-- ============================================================

CREATE DATABASE IF NOT EXISTS retailpulse;
USE retailpulse;

-- ── Customers master table ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    customer_id       VARCHAR(20)    PRIMARY KEY,
    gender            ENUM('Male','Female')    NOT NULL,
    senior_citizen    TINYINT(1)     NOT NULL DEFAULT 0,  -- 0 = No, 1 = Yes
    partner           ENUM('Yes','No') NOT NULL,
    dependents        ENUM('Yes','No') NOT NULL,
    tenure            INT            NOT NULL CHECK (tenure >= 0),
    phone_service     ENUM('Yes','No') NOT NULL,
    multiple_lines    VARCHAR(20),
    internet_service  VARCHAR(20),
    online_security   VARCHAR(20),
    online_backup     VARCHAR(20),
    device_protection VARCHAR(20),
    tech_support      VARCHAR(20),
    streaming_tv      VARCHAR(20),
    streaming_movies  VARCHAR(20),
    contract          ENUM('Month-to-month','One year','Two year') NOT NULL,
    paperless_billing ENUM('Yes','No') NOT NULL,
    payment_method    VARCHAR(40)    NOT NULL,
    monthly_charges   DECIMAL(10,2)  NOT NULL CHECK (monthly_charges >= 0),
    total_charges     DECIMAL(12,2),
    churn             ENUM('Yes','No') NOT NULL,
    -- Derived columns (populated via Python ETL)
    churn_flag        TINYINT(1)     GENERATED ALWAYS AS (IF(churn='Yes',1,0)) STORED,
    clv               DECIMAL(14,2)  GENERATED ALWAYS AS (monthly_charges * tenure) STORED,
    tenure_group      VARCHAR(20)    GENERATED ALWAYS AS (
                          CASE
                              WHEN tenure BETWEEN  0 AND 12 THEN 'New'
                              WHEN tenure BETWEEN 13 AND 24 THEN 'Growing'
                              WHEN tenure BETWEEN 25 AND 48 THEN 'Established'
                              ELSE 'Loyal'
                          END
                      ) STORED,
    revenue_quartile  TINYINT,       -- populated post-load
    created_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes for query performance ──────────────────────────────────────────────
CREATE INDEX idx_churn         ON customers(churn);
CREATE INDEX idx_contract      ON customers(contract);
CREATE INDEX idx_tenure        ON customers(tenure);
CREATE INDEX idx_tenure_group  ON customers(tenure_group);
CREATE INDEX idx_churn_contract ON customers(churn, contract);

-- ── Revenue quartile update (run after data load) ──────────────────────────────
-- UPDATE customers c
-- JOIN (
--     SELECT customer_id,
--            NTILE(4) OVER (ORDER BY monthly_charges DESC) AS q
--     FROM customers
-- ) q ON c.customer_id = q.customer_id
-- SET c.revenue_quartile = q.q;
