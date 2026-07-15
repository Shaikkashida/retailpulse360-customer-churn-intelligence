-- ============================================================
-- RetailPulse 360 | Customer Churn Intelligence Platform
-- File: 04_window_functions.sql
-- Description: Revenue ranking, segmentation, and percentile analysis
-- Advanced: RANK, NTILE, LAG, AVG OVER, ROW_NUMBER
-- ============================================================

USE retailpulse;

-- ── Window 1: Revenue rank within each contract type ─────────────────────────
SELECT
    customer_id,
    contract,
    tenure_group,
    monthly_charges,
    churn,
    RANK()   OVER (PARTITION BY contract ORDER BY monthly_charges DESC)  AS revenue_rank_in_contract,
    NTILE(4) OVER (PARTITION BY contract ORDER BY monthly_charges DESC)  AS revenue_quartile_in_contract,
    NTILE(4) OVER (ORDER BY monthly_charges DESC)                        AS overall_revenue_quartile,
    ROUND(AVG(monthly_charges) OVER (PARTITION BY contract), 2)          AS avg_charge_in_contract,
    ROUND(monthly_charges - AVG(monthly_charges) OVER (PARTITION BY contract), 2)
                                                                          AS diff_from_contract_avg,
    ROUND(100.0 * monthly_charges /
          SUM(monthly_charges) OVER (), 4)                                AS pct_of_total_revenue
FROM customers
ORDER BY contract, revenue_rank_in_contract;


-- ── Window 2: High-value churned customers (top 25% who left) ────────────────
WITH ranked_customers AS (
    SELECT
        customer_id,
        contract,
        monthly_charges,
        tenure,
        churn,
        churn_flag,
        NTILE(4) OVER (ORDER BY monthly_charges DESC) AS rev_quartile
    FROM customers
),
high_value_churned AS (
    SELECT *
    FROM ranked_customers
    WHERE rev_quartile = 1 AND churn_flag = 1
)
SELECT
    contract,
    COUNT(*)                                AS high_value_churned_count,
    ROUND(AVG(monthly_charges), 2)          AS avg_monthly_charges,
    ROUND(SUM(monthly_charges), 2)          AS total_monthly_rev_lost,
    ROUND(AVG(tenure), 1)                   AS avg_tenure_at_churn,
    ROW_NUMBER() OVER (ORDER BY SUM(monthly_charges) DESC) AS priority_rank
FROM high_value_churned
GROUP BY contract;


-- ── Window 3: Customer lifetime value percentile distribution ─────────────────
SELECT
    customer_id,
    contract,
    tenure,
    monthly_charges,
    clv,
    churn,
    PERCENT_RANK() OVER (ORDER BY clv)                     AS clv_percentile,
    CUME_DIST()    OVER (ORDER BY clv)                     AS clv_cumulative_dist,
    NTILE(10)      OVER (ORDER BY clv DESC)                AS clv_decile,
    LAG(clv, 1)    OVER (PARTITION BY contract ORDER BY clv) AS prev_customer_clv,
    ROUND(clv - LAG(clv, 1) OVER (
              PARTITION BY contract ORDER BY clv), 2)       AS clv_diff_from_prev
FROM customers
ORDER BY clv DESC
LIMIT 100;


-- ── Window 4: Churn flag running total — retention curve ─────────────────────
SELECT
    tenure,
    COUNT(*)                                                             AS customers_at_tenure,
    SUM(churn_flag)                                                      AS churned_at_tenure,
    ROUND(100.0 * SUM(churn_flag) / COUNT(*), 2)                         AS period_churn_rate,
    SUM(SUM(churn_flag)) OVER (ORDER BY tenure ROWS UNBOUNDED PRECEDING)  AS cumulative_churned,
    SUM(COUNT(*))        OVER (ORDER BY tenure ROWS UNBOUNDED PRECEDING)  AS cumulative_customers,
    ROUND(
        100.0 * SUM(SUM(churn_flag)) OVER (ORDER BY tenure ROWS UNBOUNDED PRECEDING) /
                SUM(COUNT(*))        OVER (ORDER BY tenure ROWS UNBOUNDED PRECEDING),
        2
    )                                                                    AS running_churn_rate
FROM customers
GROUP BY tenure
ORDER BY tenure;
