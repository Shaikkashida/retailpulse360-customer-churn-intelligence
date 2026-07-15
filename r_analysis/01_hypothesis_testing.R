# ============================================================
# RetailPulse 360 | Customer Churn Intelligence Platform
# File: 01_hypothesis_testing.R
# Description: Statistical validation of churn drivers
# Author: Shaik Kashida
# ============================================================

library(tidyverse)
library(broom)
library(scales)
library(ggplot2)

# ── Load data ─────────────────────────────────────────────────────────────────
df <- read_csv("../data/processed/cleaned_churn_base.csv", show_col_types = FALSE)

cat("═══════════════════════════════════════════════════════\n")
cat("  RetailPulse 360 — Statistical Analysis Report\n")
cat("═══════════════════════════════════════════════════════\n\n")

# ── Descriptive statistics ────────────────────────────────────────────────────
cat("── Descriptive Statistics ──────────────────────────────\n")
df %>%
  select(tenure, MonthlyCharges, TotalCharges, Churn_Flag) %>%
  summary() %>%
  print()


# ── TEST 1: Two-Sample t-test ─────────────────────────────────────────────────
# H0: Churned and retained customers have equal mean tenure
# H1: Churned customers have significantly lower tenure (directional)
cat("\n── TEST 1: Tenure vs Churn (Two-Sample t-test) ─────────\n")

churned_tenure  <- df %>% filter(Churn == "Yes") %>% pull(tenure)
retained_tenure <- df %>% filter(Churn == "No")  %>% pull(tenure)

t_result <- t.test(churned_tenure, retained_tenure,
                   alternative = "less",
                   var.equal   = FALSE)   # Welch's t-test

cat(sprintf("  Churned customers  — Avg tenure: %.1f months\n", mean(churned_tenure)))
cat(sprintf("  Retained customers — Avg tenure: %.1f months\n", mean(retained_tenure)))
cat(sprintf("  Difference:           %.1f months\n",
            mean(retained_tenure) - mean(churned_tenure)))
cat(sprintf("  t-statistic: %.4f\n", t_result$statistic))
cat(sprintf("  p-value:     %.6f\n", t_result$p.value))
cat(sprintf("  95%% CI:     [%.2f, %.2f]\n",
            t_result$conf.int[1], t_result$conf.int[2]))
cat(if (t_result$p.value < 0.05)
    "  ✅ SIGNIFICANT — churned customers leave significantly earlier (p < 0.05)\n"
    else
    "  ❌ Not significant at 0.05 level\n")


# ── TEST 2: Chi-square test ───────────────────────────────────────────────────
# H0: Contract type and churn are independent
# H1: Contract type significantly affects churn probability
cat("\n── TEST 2: Contract Type vs Churn (Chi-Square Test) ────\n")

contingency_table <- table(df$Contract, df$Churn)
print(contingency_table)

chi_result <- chisq.test(contingency_table)
cat(sprintf("\n  Chi-square statistic: %.4f\n", chi_result$statistic))
cat(sprintf("  Degrees of freedom:   %d\n",    chi_result$parameter))
cat(sprintf("  p-value:              %.2e\n",  chi_result$p.value))
cat(if (chi_result$p.value < 0.001)
    "  ✅ SIGNIFICANT — contract type is a highly significant predictor of churn\n"
    else
    "  ❌ Not significant\n")


# ── TEST 3: Monthly charges comparison (churned vs retained) ──────────────────
cat("\n── TEST 3: Monthly Charges vs Churn (t-test) ───────────\n")

churned_charges  <- df %>% filter(Churn == "Yes") %>% pull(MonthlyCharges)
retained_charges <- df %>% filter(Churn == "No")  %>% pull(MonthlyCharges)

charges_test <- t.test(churned_charges, retained_charges)

cat(sprintf("  Churned avg charge:  $%.2f\n", mean(churned_charges)))
cat(sprintf("  Retained avg charge: $%.2f\n", mean(retained_charges)))
cat(sprintf("  p-value: %.6f\n", charges_test$p.value))
cat(if (charges_test$p.value < 0.05)
    "  ✅ SIGNIFICANT — churned customers pay significantly higher monthly charges\n"
    else
    "  ❌ Not significant\n")


# ── Visualization: Tenure distribution by churn status ───────────────────────
p1 <- ggplot(df, aes(x = tenure, fill = Churn)) +
  geom_density(alpha = 0.6, adjust = 1.2) +
  scale_fill_manual(values = c("No" = "#4ECDC4", "Yes" = "#FF6B6B")) +
  labs(
    title    = "Customer Tenure Distribution: Churned vs Retained",
    subtitle = "Churned customers are concentrated in lower tenure bands",
    x        = "Tenure (months)",
    y        = "Density",
    fill     = "Churn Status"
  ) +
  theme_minimal(base_size = 13) +
  theme(
    plot.title    = element_text(face = "bold"),
    plot.subtitle = element_text(color = "grey50"),
    panel.grid.minor = element_blank()
  )

ggsave("../docs/screenshots/r_tenure_density.png", p1,
       width = 10, height = 6, dpi = 150)
cat("\n  📊 Saved: docs/screenshots/r_tenure_density.png\n")


cat("\n═══════════════════════════════════════════════════════\n")
cat("  Analysis Complete. See r_analysis/02_logistic_regression.R\n")
cat("  for churn probability modeling.\n")
cat("═══════════════════════════════════════════════════════\n")
