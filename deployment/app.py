import streamlit as st
import pandas as pd
import plotly.express as px
from pathlib import Path

# =====================================================
# PAGE CONFIG
# =====================================================

st.set_page_config(
    page_title="RetailPulse 360",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)
# =====================================================
# LOAD DATA
# =====================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = (
    BASE_DIR
    / "data"
    / "processed"
    / "cleaned_churn_base.csv"
)

@st.cache_data
def load_data():

    df = pd.read_csv(DATA_PATH)

    df["TotalCharges"] = pd.to_numeric(
        df["TotalCharges"],
        errors="coerce"
    )

    if "RevenueAtRisk" not in df.columns:
        df["RevenueAtRisk"] = df.apply(
            lambda x:
            x["MonthlyCharges"]
            if x["Churn"]=="Yes"
            else 0,
            axis=1
        )

    return df

df = load_data()

# =====================================================
# SIDEBAR
# =====================================================

st.sidebar.title("🎛 Executive Filters")

contract_filter = st.sidebar.multiselect(
    "Contract",
    sorted(df["Contract"].unique()),
    default=sorted(df["Contract"].unique())
)

internet_filter = st.sidebar.multiselect(
    "Internet Service",
    sorted(df["InternetService"].unique()),
    default=sorted(df["InternetService"].unique())
)

payment_filter = st.sidebar.multiselect(
    "Payment Method",
    sorted(df["PaymentMethod"].unique()),
    default=sorted(df["PaymentMethod"].unique())
)

tenure_filter = st.sidebar.slider(
    "Tenure (Months)",
    int(df["tenure"].min()),
    int(df["tenure"].max()),
    (
        int(df["tenure"].min()),
        int(df["tenure"].max())
    )
)

filtered_df = df[
    (df["Contract"].isin(contract_filter))
    &
    (df["InternetService"].isin(internet_filter))
    &
    (df["PaymentMethod"].isin(payment_filter))
    &
    (
        df["tenure"].between(
            tenure_filter[0],
            tenure_filter[1]
        )
    )
]

# =====================================================
# HERO HEADER
# =====================================================
st.markdown("""
<div style="
background: linear-gradient(135deg, #2563EB, #1E3A8A);
padding: 30px;
border-radius: 18px;
margin-bottom: 25px;
box-shadow: 0 8px 20px rgba(0,0,0,0.35);
">

<h1 style="color:white; margin-bottom:8px;">
📊 RetailPulse 360
</h1>

<h3 style="color:#E2E8F0; margin-top:0;">
Executive Customer Churn Intelligence Dashboard
</h3>

<p style="color:#F8FAFC; font-size:20px;">
End-to-End Customer Churn Analytics Project
</p>

<p style="color:#CBD5E1; font-size:15px;">
Excel • SQL • Python • Power BI • Streamlit • BigQuery
</p>

</div>
""", unsafe_allow_html=True)


# =====================================================
# EXECUTIVE KPI CALCULATIONS
# =====================================================

total_customers = len(filtered_df)

churned = (filtered_df["Churn"]=="Yes").sum()

retained = total_customers-churned

churn_rate = round((churned/total_customers)*100,1)

retention_rate = round(100-churn_rate,1)

revenue_risk = filtered_df["RevenueAtRisk"].sum()

avg_clv = filtered_df["CLV"].mean()

high_risk = len(

filtered_df[

filtered_df["Contract"]

=="Month-to-month"

]

)

# =====================================================
# KPI TITLE
# =====================================================

st.markdown("## 📈 Executive KPI Dashboard")

# =====================================================
# KPI ROW 1
# =====================================================

c1,c2,c3 = st.columns(3)

with c1:

    st.metric(

        "👥 Total Customers",

        f"{total_customers:,}"

    )

with c2:

    st.metric(

        "📉 Churn Rate",

        f"{churn_rate}%"

    )

with c3:

    st.metric(

        "🛡 Retention Rate",

        f"{retention_rate}%"

    )

# =====================================================
# KPI ROW 2
# =====================================================

c4,c5,c6 = st.columns(3)

with c4:

    st.metric(

        "💰 Revenue At Risk",

        f"${revenue_risk:,.0f}"

    )

with c5:

    st.metric(

        "⭐ Average CLV",

        f"${avg_clv:,.0f}"

    )

with c6:

    st.metric(

        "⚠ High-Risk Customers",

        f"{high_risk:,}"

    )

st.divider()

# =====================================================
# EXECUTIVE BUSINESS ANALYTICS
# =====================================================

st.markdown("## 📊 Executive Business Analytics")

chart1, chart2, chart3 = st.columns(3)

# =====================================================
# CHART 1
# CHURN RATE BY CONTRACT
# =====================================================

contract_df = (
    filtered_df
    .groupby("Contract")["Churn_Flag"]
    .mean()
    .reset_index()
)

contract_df["ChurnRate"] = (
    contract_df["Churn_Flag"] * 100
).round(1)

fig1 = px.bar(
    contract_df,
    x="Contract",
    y="ChurnRate",
    text="ChurnRate",
    color="Contract",
    color_discrete_sequence=[
        "#2563EB",
        "#10B981",
        "#F59E0B"
    ]
)

fig1.update_traces(
    textposition="outside"
)

fig1.update_layout(
    title="Churn Rate by Contract",
    template="plotly_dark",
    paper_bgcolor="#0B1220",
    plot_bgcolor="#0B1220",
    showlegend=False,
    height=420,
    margin=dict(l=10,r=10,t=50,b=10),
    xaxis_title="",
    yaxis_title="Churn %"
)

with chart1:
    st.plotly_chart(
        fig1,
        width="stretch"
    )

# =====================================================
# CHART 2
# REVENUE AT RISK
# =====================================================

payment_df = (
    filtered_df
    .groupby("PaymentMethod")["RevenueAtRisk"]
    .sum()
    .reset_index()
)

fig2 = px.bar(
    payment_df,
    x="PaymentMethod",
    y="RevenueAtRisk",
    color="RevenueAtRisk",
    color_continuous_scale="Blues",
    text_auto=".2s"
)

fig2.update_layout(
    title="Revenue At Risk",
    template="plotly_dark",
    paper_bgcolor="#0B1220",
    plot_bgcolor="#0B1220",
    height=420,
    coloraxis_showscale=False,
    margin=dict(l=10,r=10,t=50,b=10),
    xaxis_title="",
    yaxis_title="$"
)

with chart2:
    st.plotly_chart(
        fig2,
        width="stretch"
    )

# =====================================================
# CHART 3
# CUSTOMER SEGMENTATION
# =====================================================

fig3 = px.scatter(
    filtered_df,
    x="tenure",
    y="MonthlyCharges",
    color="Churn",
    size="MonthlyCharges",
    hover_data=[
        "Contract",
        "InternetService"
    ],
    color_discrete_map={
        "Yes":"#EF4444",
        "No":"#10B981"
    }
)

fig3.update_layout(
    title="Customer Segmentation",
    template="plotly_dark",
    paper_bgcolor="#0B1220",
    plot_bgcolor="#0B1220",
    height=420,
    margin=dict(l=10,r=10,t=50,b=10)
)

with chart3:
    st.plotly_chart(
        fig3,
        width="stretch"
    )

st.divider()

# =====================================================
# EXECUTIVE INSIGHTS
# =====================================================

st.markdown("## 💡 Executive Insights")

insight1, insight2 = st.columns(2)

with insight1:

    st.success("""

### Key Findings

• Month-to-Month contracts have the highest churn.

• Customers with shorter tenure are more likely to leave.

• Electronic Check users contribute the highest revenue risk.

• Long-term contracts significantly improve retention.

""")

with insight2:

    st.info("""

### Recommended Actions

✅ Convert Month-to-Month customers to annual plans.

✅ Introduce AutoPay incentives.

✅ Target customers within their first 12 months.

✅ Bundle premium services to increase customer loyalty.

""")

st.divider()

# =====================================================
# STRATEGIC RECOMMENDATIONS
# =====================================================

st.markdown("## 🚀 Strategic Business Recommendations")

r1, r2, r3 = st.columns(3)

with r1:
    st.warning("""
### 🎯 Priority 1

**Reduce Churn**

• Convert Month-to-Month customers into annual contracts.

• Offer contract renewal discounts.

• Launch personalized retention campaigns.
""")

with r2:
    st.info("""
### 💰 Priority 2

**Protect Revenue**

• Encourage AutoPay adoption.

• Provide loyalty rewards.

• Focus on high-value customers.
""")

with r3:
    st.success("""
### 📈 Priority 3

**Increase Customer Lifetime Value**

• Cross-sell premium services.

• Bundle Internet + Security.

• Improve onboarding during the first year.
""")

st.divider()

# =====================================================
# TECHNOLOGY STACK
# =====================================================

st.markdown("## 🛠 Technology Stack")

t1, t2, t3 = st.columns(3)

with t1:

    st.markdown("""
### 📊 Analytics

- Excel
- SQL
- Python
- Statistics
- Pandas
""")

with t2:

    st.markdown("""
### 📈 Visualization

- Power BI
- Streamlit
- Plotly
- HTML Dashboard
""")

with t3:

    st.markdown("""
### ☁ Deployment

- GitHub
- Streamlit Cloud
- BigQuery
- Looker Studio
""")

st.divider()

# =====================================================
# DATASET PREVIEW
# =====================================================

st.markdown("## 📂 Dataset Preview")

st.dataframe(
    filtered_df.head(20),
    width="stretch",
    height=350
)

# =====================================================
# DOWNLOAD DATA
# =====================================================

csv = filtered_df.to_csv(index=False).encode("utf-8")

st.download_button(
    label="⬇ Download Filtered Dataset",
    data=csv,
    file_name="RetailPulse360_Filtered_Data.csv",
    mime="text/csv"
)

st.divider()

# =====================================================
# PROJECT LINKS
# =====================================================

st.markdown("## 🔗 Project Links")

c1, c2, c3 = st.columns(3)

with c1:

    st.link_button(
        "💻 GitHub Repository",
        "https://github.com/Shaikkashida/retailpulse360-customer-churn-intelligence"
    )

with c2:

    st.link_button(
        "🌐 Live Streamlit Dashboard",
        "https://retailpulse360-customer-churn-intelligence-p4vrhkt5tbevse2gmuj.streamlit.app/"
    )

with c3:

    st.link_button(
    "📊 Interactive HTML Dashboard",
    "https://retailpulse360-dashboard.netlify.app/"
)

st.divider()

# =====================================================
# ABOUT PROJECT
# =====================================================

st.markdown("## 📖 About RetailPulse 360")

st.write("""
RetailPulse 360 is an end-to-end Customer Churn Analytics project
designed to simulate a real business scenario.

The project covers:

- Data Cleaning
- Feature Engineering
- Exploratory Data Analysis
- SQL Business Analysis
- Statistical Testing
- Interactive Dashboards
- Executive KPI Reporting
- Business Recommendations
- Cloud Deployment
""")

st.divider()

# =====================================================
# FOOTER
# =====================================================

st.markdown("""
---
### 👨‍💻 Created by Shaik Kashida Jabeen

RetailPulse 360 • Customer Churn Intelligence Platform

**Technology Stack**

Python | SQL | Excel | R | Power BI | Streamlit | BigQuery | Looker Studio

© 2025 RetailPulse 360
""")