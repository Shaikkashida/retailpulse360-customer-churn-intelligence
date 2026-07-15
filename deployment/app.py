import streamlit as st
import pandas as pd
import plotly.express as px
from pathlib import Path

# ==================================================
# PAGE CONFIG
# ==================================================

st.set_page_config(
    page_title="RetailPulse 360",
    page_icon="📊",
    layout="wide"
)

# ==================================================
# DARK THEME CSS
# ==================================================

st.markdown("""
<style>

.stApp{
    background-color:#0E1117;
}

section[data-testid="stSidebar"]{
    background-color:#161B22;
}

h1,h2,h3,h4,h5,h6{
    color:white !important;
}

p,div,label,span{
    color:#E6EDF3;
}

[data-testid="metric-container"]{
    background:linear-gradient(135deg,#1E293B,#111827);
    border:1px solid #334155;
    padding:18px;
    border-radius:15px;
}

[data-testid="metric-container"] label{
    color:#94A3B8 !important;
}

footer{
    visibility:hidden;
}

</style>
""", unsafe_allow_html=True)

# ==================================================
# PATHS
# ==================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "cleaned_churn_base.csv"
)

BANNER_PATH = (
    BASE_DIR
    / "assets"
    / "screenshots"
    / "banner.svg"
)

# ==================================================
# LOAD DATA
# ==================================================

@st.cache_data
def load_data():

    df = pd.read_csv(DATA_PATH)

    df["TotalCharges"] = pd.to_numeric(
        df["TotalCharges"],
        errors="coerce"
    )

    df["RevenueAtRisk"] = df.apply(
        lambda x:
        x["MonthlyCharges"]
        if x["Churn"] == "Yes"
        else 0,
        axis=1
    )

    return df

df = load_data()

# ==================================================
# BANNER
# ==================================================

if BANNER_PATH.exists():
    st.image(str(BANNER_PATH), use_container_width=True)

# ==================================================
# HEADER
# ==================================================

st.markdown("""
<div style="
background:linear-gradient(135deg,#2563EB,#0F172A);
padding:30px;
border-radius:20px;
margin-bottom:20px;
">

<h1 style="color:white;">
RetailPulse 360
</h1>

<h3 style="color:#CBD5E1;">
Customer Churn Intelligence Platform
</h3>

<p style="color:#E2E8F0;">
End-to-End Data Analytics Project using
Excel, SQL, Python, Statistics,
Power BI, Streamlit, BigQuery and Looker Studio
</p>

</div>
""", unsafe_allow_html=True)

# ==================================================
# SIDEBAR FILTERS
# ==================================================

st.sidebar.title("Filters")

contract_filter = st.sidebar.multiselect(
    "Contract",
    df["Contract"].unique(),
    default=df["Contract"].unique()
)

internet_filter = st.sidebar.multiselect(
    "Internet Service",
    df["InternetService"].unique(),
    default=df["InternetService"].unique()
)

payment_filter = st.sidebar.multiselect(
    "Payment Method",
    df["PaymentMethod"].unique(),
    default=df["PaymentMethod"].unique()
)

filtered_df = df[
    (df["Contract"].isin(contract_filter))
    &
    (df["InternetService"].isin(internet_filter))
    &
    (df["PaymentMethod"].isin(payment_filter))
]

# ==================================================
# BUSINESS PROBLEM
# ==================================================

st.subheader("Business Problem")

st.write("""
Customer churn reduces recurring revenue,
increases acquisition costs and impacts profitability.

The objective of this project is to identify:

• High-risk customer segments

• Revenue at risk

• Churn drivers

• Retention opportunities

• Business actions to reduce churn
""")

# ==================================================
# KPIs
# ==================================================

total_customers = len(filtered_df)

churned_customers = (
    filtered_df["Churn"] == "Yes"
).sum()

retained_customers = (
    total_customers -
    churned_customers
)

churn_rate = (
    churned_customers /
    total_customers
) * 100

retention_rate = 100 - churn_rate

revenue_at_risk = (
    filtered_df["RevenueAtRisk"]
    .sum()
)

avg_clv = (
    filtered_df["CLV"]
    .mean()
)

high_risk_customers = len(
    filtered_df[
        filtered_df["Contract"]
        ==
        "Month-to-month"
    ]
)

st.subheader("Executive KPIs")

c1,c2,c3 = st.columns(3)

with c1:
    st.metric(
        "Total Customers",
        f"{total_customers:,}"
    )

with c2:
    st.metric(
        "Churn Rate",
        f"{churn_rate:.1f}%"
    )

with c3:
    st.metric(
        "Retention Rate",
        f"{retention_rate:.1f}%"
    )

c4,c5,c6 = st.columns(3)

with c4:
    st.metric(
        "Revenue At Risk",
        f"${revenue_at_risk:,.0f}"
    )

with c5:
    st.metric(
        "Average CLV",
        f"${avg_clv:,.0f}"
    )

with c6:
    st.metric(
        "High Risk Customers",
        f"{high_risk_customers:,}"
    )

# ==================================================
# CHARTS
# ==================================================

st.subheader("Business Analysis")

col1,col2,col3 = st.columns(3)

# Contract Churn

contract_df = (
    filtered_df
    .groupby("Contract")
    ["Churn_Flag"]
    .mean()
    .reset_index()
)

contract_df["ChurnRate"] = (
    contract_df["Churn_Flag"] * 100
)

fig1 = px.bar(
    contract_df,
    x="Contract",
    y="ChurnRate",
    color="ChurnRate",
    text=contract_df["ChurnRate"].round(1)
)

fig1.update_layout(
    template="plotly_dark",
    paper_bgcolor="#0E1117",
    plot_bgcolor="#0E1117"
)

with col1:
    st.plotly_chart(
        fig1,
        use_container_width=True
    )

# Revenue Risk

payment_df = (
    filtered_df
    .groupby("PaymentMethod")
    ["RevenueAtRisk"]
    .sum()
    .reset_index()
)

fig2 = px.bar(
    payment_df,
    x="PaymentMethod",
    y="RevenueAtRisk",
    color="RevenueAtRisk"
)

fig2.update_layout(
    template="plotly_dark",
    paper_bgcolor="#0E1117",
    plot_bgcolor="#0E1117"
)

with col2:
    st.plotly_chart(
        fig2,
        use_container_width=True
    )

# Scatter

fig3 = px.scatter(
    filtered_df,
    x="tenure",
    y="MonthlyCharges",
    color="Churn",
    opacity=0.6
)

fig3.update_layout(
    template="plotly_dark",
    paper_bgcolor="#0E1117",
    plot_bgcolor="#0E1117"
)

with col3:
    st.plotly_chart(
        fig3,
        use_container_width=True
    )

# ==================================================
# STORYTELLING INSIGHTS
# ==================================================

st.subheader("Data Storytelling")

st.success("""
WHAT HAPPENED?

Month-to-Month customers have the highest churn rate.

WHY DID IT HAPPEN?

Flexible contracts make it easier for customers to switch providers.

WHO CAUSED IT?

New customers and month-to-month subscribers contribute most churn cases.

BUSINESS IMPACT

Recurring revenue loss and lower customer lifetime value.

WHAT SHOULD BE DONE NEXT?

Convert customers into annual contracts using loyalty discounts and retention campaigns.
""")

# ==================================================
# RECOMMENDATIONS
# ==================================================

st.subheader("Business Recommendations")

st.markdown("""
### Priority 1

Convert Month-to-Month Customers To Annual Contracts

### Priority 2

Offer AutoPay Incentives

### Priority 3

Target New Customers Within First 12 Months

### Priority 4

Bundle Security And Support Services

### Expected Outcome

Reduce churn by 10-15% and protect recurring revenue.
""")

# ==================================================
# TOOLS USED
# ==================================================

st.subheader("Project Stack")

st.markdown("""
### Data Analytics Tools

- Excel
- SQL
- Python
- Statistics
- Power BI
- Streamlit
- Google BigQuery
- Looker Studio

### Analytics Process

1. Data Collection
2. Data Cleaning
3. Feature Engineering
4. Exploratory Data Analysis
5. SQL KPI Analysis
6. Statistical Testing
7. Dashboard Development
8. Business Recommendations
""")

# ==================================================
# DATA PREVIEW
# ==================================================

st.subheader("Dataset Preview")

st.dataframe(
    filtered_df.head(20),
    use_container_width=True
)

# ==================================================
# FOOTER
# ==================================================

st.markdown("---")

st.caption(
    "Created by Shaik Kashida Jabeen | Customer Churn Analytics Portfolio Project"
)