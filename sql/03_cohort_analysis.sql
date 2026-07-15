-- ============================================================
-- RetailPulse 360 | Customer Churn Intelligence Platform
-- File: 03_cohort_analysis.sql
-- Description: Tenure-based cohort churn analysis
-- Advanced: CTEs + CASE + aggregation
-- ============================================================

USE retailpulse;

-- ── Cohort 1: Churn rate by tenure band ───────────────────────────────────────
WITH cohort_base AS (
    SELECT
        customer_id,
        churn_flag,
        monthly_charges,
        tenure,
        tenure_group
    FROM customers
),
cohort_stats AS (
    SELECT
        tenure_group,
        COUNT(*)                                              AS total_customers,
        SUM(churn_flag)                                       AS churned,
        COUNT(*) - SUM(churn_flag)                            AS retained,
        ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct,
        ROUND(AVG(monthly_charges), 2)                        AS avg_monthly_charge,
        ROUND(AVG(tenure), 1)                                 AS avg_tenure,
        ROUND(SUM(churn_flag * monthly_charges), 2)           AS monthly_rev_at_risk,
        ROUND(AVG(monthly_charges * tenure), 2)               AS avg_clv
    FROM cohort_base
    GROUP BY tenure_group
)
SELECT
    tenure_group,
    total_customers,
    churned,
    retained,
    churn_rate_pct,
    avg_monthly_charge,
    avg_tenure,
    monthly_rev_at_risk,
    avg_clv,
    -- % of total revenue at risk contributed by this cohort
    ROUND(
        100.0 * monthly_rev_at_risk /
        SUM(monthly_rev_at_risk) OVER (),
        1
    ) AS pct_of_total_risk
FROM cohort_stats
ORDER BY
    FIELD(tenure_group, 'New', 'Growing', 'Established', 'Loyal');


-- ── Cohort 2: Contract + Tenure cross-tab churn ───────────────────────────────
WITH cross_cohort AS (
    SELECT
        contract,
        tenure_group,
        COUNT(*)                                              AS total,
        SUM(churn_flag)                                       AS churned,
        ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)          AS churn_rate_pct
    FROM customers
    GROUP BY contract, tenure_group
)
SELECT
    contract,
    tenure_group,
    total,
    churned,
    churn_rate_pct,
    -- Flag the highest-risk combinations
    CASE
        WHEN churn_rate_pct >= 50 THEN '🔴 Critical'
        WHEN churn_rate_pct >= 30 THEN '🟡 High Risk'
        WHEN churn_rate_pct >= 15 THEN '🟢 Moderate'
        ELSE '✅ Low Risk'
    END AS risk_level
FROM cross_cohort
ORDER BY churn_rate_pct DESC;


-- ── Cohort 3: Monthly revenue loss trend (simulated by tenure as proxy) ───────
WITH monthly_proxy AS (
    SELECT
        tenure                                                AS month_number,
        COUNT(*)                                              AS active_customers,
        SUM(churn_flag)                                       AS churned_this_period,
        ROUND(SUM(churn_flag * monthly_charges), 2)           AS rev_lost_this_period
    FROM customers
    WHERE tenure <= 72                                        -- Focus on first 6 years
    GROUP BY tenure
),
cumulative AS (
    SELECT
        month_number,
        active_customers,
        churned_this_period,
        rev_lost_this_period,
        SUM(churned_this_period) OVER (ORDER BY month_number)  AS cumulative_churned,
        SUM(rev_lost_this_period) OVER (ORDER BY month_number) AS cumulative_rev_lost,
        ROUND(
            AVG(rev_lost_this_period) OVER (
                ORDER BY month_number ROWS BETWEEN 5 PRECEDING AND CURRENT ROW
            ), 2
        ) AS rolling_6m_avg_rev_loss
    FROM monthly_proxy
)
SELECT * FROM cumulative
ORDER BY month_number;
