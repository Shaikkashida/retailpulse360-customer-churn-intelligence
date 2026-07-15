# RetailPulse 360
## Executive Customer Churn Analytics Platform

### End-to-End Data Analytics Project

---

## Author

**Shaik Kashida**

Data Analytics Portfolio Project

---

## Technologies Used

- Python
- SQL (MySQL)
- Power BI
- Streamlit
- R Programming
- Pandas
- Plotly
- Git & GitHub

---

## Project Duration

2025

---

# Executive Summary

Customer churn is one of the biggest challenges faced by subscription-based businesses. Every customer who leaves represents recurring revenue loss, increased acquisition costs, and reduced customer lifetime value.

This project develops an end-to-end analytics solution to identify the major drivers of customer churn, quantify revenue at risk, and provide actionable business recommendations through interactive dashboards and statistical analysis.

The solution combines data engineering, exploratory data analysis, SQL analytics, statistical validation in R, executive dashboards in Power BI, and an interactive Streamlit application to deliver insights for business decision-makers.

The project demonstrates the complete analytics lifecycle:

- Data Cleaning
- Feature Engineering
- Exploratory Data Analysis
- Business KPI Development
- SQL Analytics
- Statistical Testing
- Executive Dashboard Development
- Interactive Web Dashboard
- Business Storytelling
- Actionable Recommendations

The final outcome is a decision-support platform that enables executives to understand:

- Which customers are most likely to churn
- Which customer segments generate the highest revenue risk
- Which business factors contribute most to customer attrition
- What actions should be taken to improve customer retention

---

# Business Problem

Telecommunication companies lose a significant portion of recurring revenue every year due to customer churn.

Although customer information is collected continuously, organizations often lack a centralized analytics platform capable of transforming raw customer data into strategic business insights.

Without understanding why customers leave, businesses struggle to:

- Reduce churn
- Improve customer retention
- Prioritize high-value customers
- Allocate marketing budgets efficiently
- Increase customer lifetime value
- Protect recurring revenue

This project addresses these challenges by transforming customer-level transactional data into executive-level business intelligence.

---

# Business Objectives

The primary objectives of this project are:

- Measure overall customer churn performance.
- Identify high-risk customer segments.
- Quantify monthly revenue at risk.
- Understand how customer contracts influence churn.
- Evaluate customer lifetime value (CLV).
- Analyze customer tenure and retention patterns.
- Validate business assumptions using statistical testing.
- Build interactive dashboards for executive decision-making.
- Deliver actionable recommendations for reducing churn.

The project is designed to simulate a real-world analytics solution typically developed by a Business Intelligence or Data Analytics team.


# 2. Business Problem

Customer churn is one of the biggest challenges faced by subscription-based telecom companies. Every customer who leaves results in recurring revenue loss, increased acquisition costs, and reduced customer lifetime value (CLV).

Although the company continues acquiring new customers, a significant portion of them leave within the first year, reducing long-term profitability.

The objective of this project is to identify:

- Which customers are most likely to churn
- Which customer segments generate the highest revenue risk
- Which business factors contribute most to churn
- What actions management should take to improve customer retention

The final solution combines SQL, Python, R, Power BI, and Streamlit to build an executive decision-support platform.

---

# 3. Project Objectives

The primary objectives of this project are:

- Clean and prepare raw customer data
- Perform feature engineering to create business metrics
- Build SQL business KPIs
- Perform exploratory data analysis (EDA)
- Validate business assumptions using statistical testing
- Create executive Power BI dashboards
- Build an interactive Streamlit dashboard
- Quantify revenue at risk
- Generate actionable business recommendations

---

# 4. Dataset Overview

**Dataset Name**

Telco Customer Churn Dataset

**Source**

IBM Sample Telecom Customer Churn Dataset

**Total Records**

7,043 Customers

**Features**

27 Columns

### Customer Information

- Customer ID
- Gender
- Senior Citizen
- Partner
- Dependents

### Subscription Information

- Contract Type
- Internet Service
- Phone Service
- Payment Method
- Paperless Billing

### Financial Information

- Monthly Charges
- Total Charges

### Target Variable

- Churn

---

# 5. Data Cleaning Process

The raw dataset required several preprocessing steps before analysis.

The following operations were performed using Python:

- Removed duplicate records
- Converted TotalCharges to numeric values
- Handled missing values
- Standardized data types
- Validated customer records
- Saved cleaned dataset

After cleaning, the processed dataset became the foundation for all subsequent SQL, R, Power BI, and Streamlit analyses.

---

# 6. Feature Engineering

Several business-focused features were created to improve analytical capability.

### Churn Flag

Binary indicator:

- Yes = 1
- No = 0

Used for:

- SQL calculations
- Machine learning
- KPI development

---

### Customer Lifetime Value (CLV)

Calculated as:

CLV = Monthly Charges × Tenure

Purpose:

Estimate total revenue generated by each customer.

---

### Tenure Group

Customers were segmented into:

- New
- Growing
- Established
- Loyal

Purpose:

Analyze customer retention across lifecycle stages.

---

### High Value Customer

Customers paying more than the monthly charge threshold were classified as:

- High Value
- Standard Value

Purpose:

Prioritize retention campaigns.

---

### Revenue Risk

Calculated as:

Revenue Risk = Monthly Charges (only for churned customers)

Purpose:

Estimate monthly recurring revenue currently at risk.

---

### Contract Risk

Business rule:

Month-to-month customers

↓

High Risk

All other contracts

↓

Low Risk

Purpose:

Support retention strategy development.

---

# 7. Technology Stack

The complete analytics solution was built using multiple technologies.

| Tool | Purpose |
|-------|----------|
| Python | Data Cleaning & EDA |
| SQL | Business KPIs |
| R | Statistical Analysis |
| Power BI | Executive Dashboard |
| Streamlit | Interactive Dashboard |
| GitHub | Version Control |
| VS Code | Development |
| Excel | Data Validation |

---

# 8. Analytics Workflow

The complete workflow followed a modern analytics pipeline.

Raw Dataset

↓

Python Data Cleaning

↓

Feature Engineering

↓

Processed Dataset

↓

SQL KPI Analysis

↓

Python EDA

↓

R Statistical Validation

↓

Power BI Dashboard

↓

Streamlit Dashboard

↓

Business Insights

↓

Recommendations


# Business Recommendations

Based on the analysis, the following actions are recommended.

---

## Priority 1 — Convert Month-to-Month Customers

### Why

Month-to-month customers have the highest churn rate.

### Action

• Offer 12-month contract discounts

• Provide loyalty rewards after 6 months

• Bundle additional services

Expected Impact

✔ Lower churn

✔ Higher customer lifetime value

✔ Stable recurring revenue

---

## Priority 2 — Improve Payment Experience

### Why

Electronic Check customers churn more frequently.

### Action

• Encourage AutoPay migration

• Offer first-month incentives

• Improve payment reminders

Expected Impact

✔ Better payment success

✔ Reduced involuntary churn

---

## Priority 3 — Protect High Value Customers

### Why

Customers with high Monthly Charges generate the largest revenue.

### Action

Identify customers with:

• High CLV

• High Monthly Charges

• High Revenue Risk

Assign dedicated retention campaigns.

Expected Impact

✔ Reduced Revenue at Risk

✔ Increased profitability

---

## Priority 4 — Early Customer Retention

### Why

Customers within the first 12 months churn significantly more.

### Action

Launch onboarding campaigns during:

• Month 1

• Month 3

• Month 6

Include

• welcome emails

• onboarding support

• usage education

Expected Impact

✔ Better customer engagement

✔ Longer customer lifetime

---

## Priority 5 — Improve Fiber Optic Experience

### Why

Fiber customers show relatively higher churn.

### Action

Review

• service quality

• outages

• pricing

• customer support

Expected Impact

✔ Higher satisfaction

✔ Lower churn


# Business Impact

If the proposed recommendations are implemented, the business can expect:

• Lower customer churn

• Higher annual recurring revenue

• Better customer lifetime value

• Reduced revenue leakage

• Higher customer satisfaction

• Improved retention campaign efficiency

• Better executive decision making using dashboards

The dashboard enables business users to quickly identify:

✔ High Risk Customers

✔ Revenue at Risk

✔ Churn Drivers

✔ Customer Segments

✔ Retention Opportunities

without writing SQL queries.


# Skills Demonstrated

## SQL

• Joins

• Window Functions

• CTEs

• Aggregations

• Business KPI Queries

---

## Python

• Data Cleaning

• Feature Engineering

• Exploratory Data Analysis

• Plotly Visualizations

• Streamlit Dashboard

---

## Power BI

• Executive Dashboard

• KPI Cards

• DAX Measures

• Slicers

• Interactive Visualizations

---

## R Programming

• Hypothesis Testing

• Logistic Regression

• Statistical Analysis

---

## Business Analysis

• Customer Segmentation

• Revenue at Risk

• Customer Lifetime Value

• Churn Analytics

• Executive Reporting

---

## Tools

• Python

• SQL

• Power BI

• R

• Streamlit

• Git

• GitHub

• VS Code


# Conclusion

Customer churn has a direct impact on recurring revenue and customer lifetime value.

This project demonstrates a complete analytics workflow beginning with raw customer data and ending with actionable business recommendations.

The solution combines SQL, Python, R, Power BI, and Streamlit to build a production-style analytics project.

Key findings indicate that month-to-month contracts, electronic check payment methods, and newer customers contribute the highest churn risk.

The developed dashboard enables executives to monitor churn trends, identify revenue at risk, and prioritize retention strategies.

This project showcases end-to-end data analytics skills including data preparation, statistical analysis, dashboard development, storytelling, and business decision support.