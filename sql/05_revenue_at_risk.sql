-- ============================================================
-- RetailPulse 360 | Customer Churn Intelligence Platform
-- File: 05_revenue_at_risk.sql
-- Description: CTE-based revenue risk quantification and customer segmentation
-- Advanced: Multi-level CTEs + business logic segmentation
-- ============================================================

USE retailpulse;

-- ── Revenue at Risk by Contract × Internet Service (detailed breakdown) ───────
WITH churned_base AS (
    -- Step 1: Isolate churned customers with key dimensions
    SELECT
        customer_id,
        contract,
        internet_service,
        payment_method,
        monthly_charges,
        tenure,
        senior_citizen,
        tenure_group,
        clv
    FROM customers
    WHERE churn_flag = 1
),
risk_by_segment AS (
    -- Step 2: Aggregate revenue risk by key business dimensions
    SELECT
        contract,
        internet_service,
        COUNT(*)                                AS churned_customers,
        ROUND(SUM(monthly_charges), 2)          AS monthly_rev_at_risk,
        ROUND(AVG(monthly_charges), 2)          AS avg_monthly_charge,
        ROUND(AVG(tenure), 1)                   AS avg_tenure_at_churn,
        ROUND(SUM(clv), 2)                      AS total_clv_lost,
        ROUND(AVG(clv), 2)                      AS avg_clv_lost
    FROM churned_base
    GROUP BY contract, internet_service
),
total_risk AS (
    -- Step 3: Calculate totals for percentage calculations
    SELECT SUM(monthly_rev_at_risk) AS grand_total_risk
    FROM risk_by_segment
)
-- Step 4: Final output with % contribution and priority tier
SELECT
    r.contract,
    r.internet_service,
    r.churned_customers,
    r.monthly_rev_at_risk,
    r.avg_monthly_charge,
    r.avg_tenure_at_churn,
    r.total_clv_lost,
    r.avg_clv_lost,
    ROUND(100.0 * r.monthly_rev_at_risk / t.grand_total_risk, 2)  AS pct_of_total_risk,
    -- Cumulative risk (running total ordered by revenue impact)
    ROUND(
        SUM(r.monthly_rev_at_risk) OVER (
            ORDER BY r.monthly_rev_at_risk DESC
            ROWS UNBOUNDED PRECEDING
        ), 2
    )                                                              AS cumulative_risk,
    -- Retention priority tier
    CASE
        WHEN r.monthly_rev_at_risk > 15000 THEN '🔴 Priority 1 — Act Immediately'
        WHEN r.monthly_rev_at_risk > 8000  THEN '🟡 Priority 2 — Plan Campaign'
        WHEN r.monthly_rev_at_risk > 3000  THEN '🟢 Priority 3 — Monitor'
        ELSE '⚪ Priority 4 — Low Urgency'
    END                                                            AS retention_priority
FROM risk_by_segment r
CROSS JOIN total_risk t
ORDER BY r.monthly_rev_at_risk DESC;


-- ── RFM-style Customer Segmentation ──────────────────────────────────────────
WITH customer_scores AS (
    SELECT
        customer_id,
        contract,
        tenure,
        monthly_charges,
        clv,
        churn,
        churn_flag,
        -- Recency proxy: inverse of tenure (lower tenure = less established)
        NTILE(5) OVER (ORDER BY tenure DESC)           AS recency_score,
        -- Frequency proxy: number of services (simplified to charges tier)
        NTILE(5) OVER (ORDER BY monthly_charges DESC)  AS monetary_score
    FROM customers
),
rfm_segments AS (
    SELECT
        customer_id,
        contract,
        tenure,
        monthly_charges,
        clv,
        churn,
        churn_flag,
        recency_score,
        monetary_score,
        (recency_score + monetary_score) AS rfm_total_score,
        CASE
            WHEN recency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
            WHEN recency_score >= 3 AND monetary_score >= 3 THEN 'Loyal Customers'
            WHEN recency_score >= 4 AND monetary_score < 3  THEN 'Recent Customers'
            WHEN recency_score < 3  AND monetary_score >= 4 THEN 'At Risk — High Value'
            WHEN recency_score < 2  AND monetary_score < 3  THEN 'Churning — Low Value'
            ELSE 'Potential Loyalists'
        END AS customer_segment
    FROM customer_scores
)
SELECT
    customer_segment,
    COUNT(*)                                              AS segment_size,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2)   AS pct_of_base,
    ROUND(AVG(monthly_charges), 2)                        AS avg_monthly_charges,
    ROUND(AVG(clv), 2)                                    AS avg_clv,
    SUM(churn_flag)                                       AS churned_count,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct,
    ROUND(SUM(churn_flag * monthly_charges), 2)           AS monthly_rev_at_risk
FROM rfm_segments
GROUP BY customer_segment
ORDER BY monthly_rev_at_risk DESC;
