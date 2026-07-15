import pandas as pd
import numpy as np
from pathlib import Path

# Current script location
BASE_DIR = Path(__file__).resolve().parent.parent

RAW_PATH = BASE_DIR / "data" / "raw" / "raw_data.csv"
OUTPUT_PATH = BASE_DIR / "data" / "processed" / "cleaned_churn_base.csv"

print("Reading from:")
print(RAW_PATH)

df = pd.read_csv(RAW_PATH)

# -----------------------------
# Cleaning
# -----------------------------

df.drop_duplicates(inplace=True)

df["TotalCharges"] = pd.to_numeric(
    df["TotalCharges"],
    errors="coerce"
)

df.fillna(0, inplace=True)

# -----------------------------
# Feature Engineering
# -----------------------------
df.fillna(0, inplace=True)

df["tenure"] = pd.to_numeric(df["tenure"], errors="coerce").fillna(0).astype(int)

df["Churn_Flag"] = df["Churn"].map({
    "Yes": 1,
    "No": 0
})

df["CLV"] = (
    df["MonthlyCharges"]
    * df["tenure"]
).round(2)

df["TenureGroup"] = np.select(
    [
        df["tenure"] <= 12,
        (df["tenure"] > 12) & (df["tenure"] <= 24),
        (df["tenure"] > 24) & (df["tenure"] <= 48),
        df["tenure"] > 48
    ],
    [
        "New",
        "Growing",
        "Established",
        "Loyal"
    ],
    default="New"
)

df["HighValueCustomer"] = np.where(
    df["MonthlyCharges"] > 70,
    "Yes",
    "No"
)

df["RevenueRisk"] = np.where(
    df["Churn_Flag"] == 1,
    df["MonthlyCharges"],
    0
)

df["ContractRisk"] = np.where(
    df["Contract"] == "Month-to-month",
    "High",
    "Low"
)

# Save processed data
OUTPUT_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nProcessed file created successfully")
print("Saved to:")
print(OUTPUT_PATH)

print("\nNew columns added:")
print([
    "Churn_Flag",
    "CLV",
    "TenureGroup",
    "HighValueCustomer",
    "RevenueRisk",
    "ContractRisk"
])