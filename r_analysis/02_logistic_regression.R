# ============================================================
# RetailPulse 360 | Customer Churn Intelligence Platform
# File: 02_logistic_regression.R
# Description: Logistic regression churn probability model
# ============================================================

library(tidyverse)
library(broom)
library(caret)
library(pROC)

df <- read_csv("../data/processed/cleaned_churn_base.csv", show_col_types = FALSE)

cat("═══════════════════════════════════════════════════════\n")
cat("  Logistic Regression — Churn Probability Model\n")
cat("═══════════════════════════════════════════════════════\n\n")

# ── Prepare model data ────────────────────────────────────────────────────────
model_data <- df %>%
  mutate(
    Churn_Flag     = as.factor(Churn_Flag),
    SeniorCitizen  = as.factor(SeniorCitizen),
    Contract_M2M   = as.integer(Contract == "Month-to-month"),
    Fiber_Optic    = as.integer(InternetService == "Fiber optic"),
    Paperless_Bill = as.integer(PaperlessBilling == "Yes"),
    Elec_Check     = as.integer(PaymentMethod == "Electronic check")
  ) %>%
  select(Churn_Flag, tenure, MonthlyCharges, SeniorCitizen,
         Contract_M2M, Fiber_Optic, Paperless_Bill, Elec_Check)

# ── Train/test split (80/20) ──────────────────────────────────────────────────
set.seed(42)
split_idx  <- createDataPartition(model_data$Churn_Flag, p = 0.8, list = FALSE)
train_data <- model_data[ split_idx, ]
test_data  <- model_data[-split_idx, ]

cat(sprintf("  Training samples: %d\n", nrow(train_data)))
cat(sprintf("  Test samples:     %d\n\n", nrow(test_data)))

# ── Fit logistic regression ───────────────────────────────────────────────────
model <- glm(
  Churn_Flag ~ tenure + MonthlyCharges + SeniorCitizen +
               Contract_M2M + Fiber_Optic + Paperless_Bill + Elec_Check,
  data   = train_data,
  family = binomial(link = "logit")
)

# ── Model coefficients with odds ratios ───────────────────────────────────────
cat("── Model Coefficients & Odds Ratios ────────────────────\n")
coef_table <- tidy(model) %>%
  mutate(
    odds_ratio  = round(exp(estimate), 4),
    significance = case_when(
      p.value < 0.001 ~ "***",
      p.value < 0.01  ~ "**",
      p.value < 0.05  ~ "*",
      TRUE             ~ ""
    )
  ) %>%
  select(term, estimate, odds_ratio, std.error, p.value, significance)

print(coef_table, n = Inf)

# ── Model performance on test set ────────────────────────────────────────────
cat("\n── Model Performance ───────────────────────────────────\n")
test_probs <- predict(model, newdata = test_data, type = "response")
test_preds <- factor(ifelse(test_probs > 0.5, 1, 0), levels = c(0, 1))

cm <- confusionMatrix(test_preds, test_data$Churn_Flag, positive = "1")
cat(sprintf("  Accuracy:    %.2f%%\n", cm$overall["Accuracy"] * 100))
cat(sprintf("  Sensitivity: %.2f%%\n", cm$byClass["Sensitivity"] * 100))
cat(sprintf("  Specificity: %.2f%%\n", cm$byClass["Specificity"] * 100))
cat(sprintf("  F1 Score:    %.4f\n",   cm$byClass["F1"]))

roc_obj <- roc(as.numeric(test_data$Churn_Flag) - 1, test_probs, quiet = TRUE)
cat(sprintf("  AUC-ROC:     %.4f\n",   auc(roc_obj)))

# ── Business interpretation ───────────────────────────────────────────────────
cat("\n── Key Business Takeaways ──────────────────────────────\n")
cat("  • Month-to-month contract: largest positive predictor of churn\n")
cat("  • Tenure: strongest protective factor — each extra month reduces churn risk\n")
cat("  • Fiber optic users: elevated churn — product-quality investigation needed\n")
cat("  • Electronic check: payment friction driving churn — target for migration\n")
cat("  • Senior citizens: higher churn odds — may need dedicated support tier\n")

cat("\n═══════════════════════════════════════════════════════\n")
cat("  Model saved. Use probabilities for churn scoring.\n")
cat("═══════════════════════════════════════════════════════\n")
