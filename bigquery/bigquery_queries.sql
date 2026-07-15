SELECT
Contract,
COUNT(*) Customers,
SUM(Churn_Flag) Churned,
ROUND(
SUM(Churn_Flag)*100/COUNT(*),
2
) ChurnRate
FROM customer_churn
GROUP BY Contract;