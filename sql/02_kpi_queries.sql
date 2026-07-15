-- ============================================================
-- RetailPulse 360 | Customer Churn Intelligence Platform
-- File: 02_kpi_queries.sql
-- Description: Core business KPI calculations
-- ============================================================

USE retailpulse;

-- ── KPI 1: Overall churn summary ──────────────────────────────────────────────
SELECT
    COUNT(*)                                                          AS total_customers,
    SUM(churn_flag)                                                   AS churned_customers,
    COUNT(*) - SUM(churn_flag)                                        AS retained_customers,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)                      AS churn_rate_pct,
    ROUND(100.0 * (COUNT(*) - SUM(churn_flag)) / COUNT(*), 2)         AS retention_rate_pct,
    ROUND(SUM(churn_flag * monthly_charges), 2)                       AS monthly_rev_at_risk,
    ROUND(SUM(churn_flag * total_charges), 2)                         AS historic_rev_lost,
    ROUND(AVG(monthly_charges * tenure), 2)                           AS avg_customer_clv
FROM customers;

-- ── KPI 2: Churn by contract type ─────────────────────────────────────────────
SELECT
    contract,
    COUNT(*)                                              AS total,
    SUM(churn_flag)                                       AS churned,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct,
    ROUND(AVG(monthly_charges), 2)                        AS avg_monthly_charge,
    ROUND(SUM(churn_flag * monthly_charges), 2)           AS monthly_rev_at_risk,
    ROUND(AVG(tenure), 1)                                 AS avg_tenure_months
FROM customers
GROUP BY contract
ORDER BY churn_rate_pct DESC;

-- ── KPI 3: Churn by payment method ───────────────────────────────────────────
SELECT
    payment_method,
    COUNT(*)                                              AS total,
    SUM(churn_flag)                                       AS churned,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct,
    ROUND(SUM(churn_flag * monthly_charges), 2)           AS monthly_rev_at_risk
FROM customers
GROUP BY payment_method
ORDER BY churn_rate_pct DESC;

-- ── KPI 4: Churn by internet service type ────────────────────────────────────
SELECT
    internet_service,
    COUNT(*)                                              AS total,
    SUM(churn_flag)                                       AS churned,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct,
    ROUND(AVG(monthly_charges), 2)                        AS avg_monthly_charge,
    ROUND(SUM(churn_flag * monthly_charges), 2)           AS monthly_rev_at_risk
FROM customers
GROUP BY internet_service
ORDER BY churn_rate_pct DESC;

-- ── KPI 5: Senior citizen churn comparison ───────────────────────────────────
SELECT
    CASE senior_citizen WHEN 1 THEN 'Senior' ELSE 'Non-Senior' END AS customer_segment,
    COUNT(*)                                              AS total,
    SUM(churn_flag)                                       AS churned,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct
FROM customers
GROUP BY senior_citizen
ORDER BY churn_rate_pct DESC;
