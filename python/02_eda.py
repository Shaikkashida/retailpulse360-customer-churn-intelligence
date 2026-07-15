# ============================================================
# RetailPulse 360 | Customer Churn Intelligence Platform
# File: python/02_eda.py
# Description: Exploratory Data Analysis + Export Visual Assets
# ============================================================

# =========================
# IMPORTS
# =========================
import pandas as pd
import numpy as np
import plotly.express as px
from scipy import stats
from pathlib import Path

pd.set_option("display.float_format", "{:.2f}".format)

# =========================
# PATH CONFIGURATION
# =========================
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_PATH = BASE_DIR / "data" / "processed" / "cleaned_churn_base.csv"

SCREENSHOT_DIR = BASE_DIR / "assets" / "screenshots"
SCREENSHOT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

EXPORT_DIR = BASE_DIR / "data" / "exports"
EXPORT_DIR.mkdir(
    parents=True,
    exist_ok=True
)

# =========================
# LOAD DATA
# =========================
df = pd.read_csv(DATA_PATH)

print("\nDataset Shape:", df.shape)
print("Columns Loaded:\n", df.columns.tolist())

# =========================
# DARK THEME
# =========================
DARK_THEME = dict(
    template="plotly_dark",
    paper_bgcolor="#0D1117",
    plot_bgcolor="#0D1117",
)

# ============================================================
# EDA 1 — CONTRACT CHURN
# ============================================================

contract_stats = (
    df.groupby("Contract")["Churn_Flag"]
    .agg(
        Total="count",
        Churned="sum"
    )
    .assign(
        ChurnRate=lambda x:
        (x["Churned"] / x["Total"] * 100)
    )
    .round(2)
    .sort_values(
        "ChurnRate",
        ascending=False
    )
    .reset_index()
)

print("\nChurn by Contract:\n")
print(contract_stats)

fig = px.bar(
    contract_stats,
    x="Contract",
    y="ChurnRate",
    color="ChurnRate",
    text="ChurnRate",
    color_continuous_scale=[
        "#2563EB",
        "#F59E0B",
        "#DC2626"
    ],
    title="Churn Rate by Contract Type"
)

fig.update_traces(
    texttemplate="%{text:.1f}%",
    textposition="outside"
)

fig.update_layout(
    **DARK_THEME,
    height=450
)

fig.write_html(
    SCREENSHOT_DIR /
    "eda_contract_churn.html"
)

# ============================================================
# EDA 2 — MONTHLY CHARGES
# ============================================================

fig2 = px.histogram(
    df,
    x="MonthlyCharges",
    color="Churn",
    nbins=40,
    opacity=0.75,
    barmode="overlay",
    color_discrete_map={
        "Yes": "#DC2626",
        "No": "#10B981"
    },
    title="Monthly Charges Distribution"
)

fig2.update_layout(
    **DARK_THEME,
    height=450
)

fig2.write_html(
    SCREENSHOT_DIR /
    "eda_charges_distribution.html"
)

# ============================================================
# EDA 3 — TENURE VS CHARGES
# ============================================================

sample_df = df.sample(
    min(
        2000,
        len(df)
    ),
    random_state=42
)

fig3 = px.scatter(
    sample_df,
    x="tenure",
    y="MonthlyCharges",
    color="Churn",
    opacity=0.6,
    color_discrete_map={
        "Yes": "#DC2626",
        "No": "#10B981"
    },
    title="Tenure vs Charges"
)

fig3.update_layout(
    **DARK_THEME,
    height=500
)

fig3.write_html(
    SCREENSHOT_DIR /
    "eda_tenure_scatter.html"
)

# ============================================================
# EDA 4 — CORRELATION MATRIX
# ============================================================

numeric_df = df[
    [
        "tenure",
        "MonthlyCharges",
        "TotalCharges",
        "SeniorCitizen",
        "CLV",
        "Churn_Flag"
    ]
]

corr = numeric_df.corr()

fig4 = px.imshow(
    corr,
    text_auto=".2f",
    color_continuous_scale="RdBu_r",
    title="Feature Correlation Matrix"
)

fig4.update_layout(
    **DARK_THEME,
    height=500
)

fig4.write_html(
    SCREENSHOT_DIR /
    "eda_correlation.html"
)

print("\nCorrelation With Churn:\n")
print(
    corr["Churn_Flag"]
    .drop("Churn_Flag")
    .sort_values()
)

# ============================================================
# EDA 5 — COHORT TABLE
# ============================================================

cohort_kpi = (

    df.groupby(
        "TenureGroup",
        observed=True
    )

    .agg(

        Customers=("Churn_Flag","count"),

        Churned=("Churn_Flag","sum"),

        ChurnRate=("Churn_Flag","mean"),

        AvgMonthlyCharge=("MonthlyCharges","mean"),

        AvgCLV=("CLV","mean"),

        RevenueRisk=(

            "RevenueRisk",

            "sum"

        )

    )

    .round(2)

    .reset_index()

)

cohort_kpi["ChurnRatePct"] = (
    cohort_kpi["ChurnRate"] * 100
).round(1)

print("\nCohort KPI Table:\n")
print(cohort_kpi)

cohort_kpi.to_csv(
    EXPORT_DIR /
    "cohort_kpi.csv",
    index=False
)

# ============================================================
# EDA 6 — CHI SQUARE TEST
# ============================================================

cont_table = pd.crosstab(
    df["Contract"],
    df["Churn"]
)

chi2, p, dof, expected = stats.chi2_contingency(
    cont_table
)

print("\nChi Square Test")

print(
    f"Chi2={chi2:.3f}"
)

print(
    f"P Value={p:.8f}"
)

print(
    f"Degrees Freedom={dof}"
)

if p < 0.05:
    print(
        "Result: Significant relationship found"
    )
else:
    print(
        "Result: No significant relationship"
    )

# ============================================================
# COMPLETE
# ============================================================

print("\nEDA COMPLETED SUCCESSFULLY")

print(
    "\nSaved Visuals Location:\n",
    SCREENSHOT_DIR
)

print(
    "\nSaved KPI Export:\n",
    EXPORT_DIR
)