"use strict";
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, PageBreak, UnderlineType,
  TableLayoutType, VerticalAlign, PageOrientation,
  Header, Footer, PageNumber, NumberFormat,
  LevelFormat, convertInchesToTwip, TabStopPosition, TabStopType,
} = require("docx");
const fs = require("fs");

// ── PALETTE ────────────────────────────────────────────────────────────────
const C = {
  ink:      "1A1A2E",   // near-black
  primary:  "1B3A6B",   // deep navy
  accent:   "2563EB",   // bright blue
  mid:      "4B6CB7",   // medium blue
  light:    "EEF2FF",   // lavender tint
  muted:    "64748B",   // slate grey
  white:    "FFFFFF",
  red:      "991B1B",   // dark red for risk
  redBg:    "FEF2F2",
  green:    "14532D",
  greenBg:  "F0FDF4",
  amber:    "78350F",
  amberBg:  "FFFBEB",
  teal:     "134E4A",
  tealBg:   "F0FDFA",
  border:   "CBD5E1",
  rowAlt:   "F8FAFC",
};

// ── HELPERS ────────────────────────────────────────────────────────────────
const sp = (n) => new Paragraph({ children: [new TextRun({ text: "", size: n })] });

const hr = () => new Paragraph({
  text: "",
  border: { bottom: { color: C.border, space: 1, style: BorderStyle.SINGLE, size: 4 } },
  spacing: { before: 80, after: 80 },
});

const coverText = (text, size, bold, color = C.ink, spacing = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing,
    children: [new TextRun({ text, bold, size, color, font: "Calibri" })],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    children: [new TextRun({
      text, bold: true, size: 36, color: C.primary, font: "Calibri",
      underline: { type: UnderlineType.NONE },
    })],
    border: { bottom: { color: C.accent, style: BorderStyle.SINGLE, size: 6, space: 6 } },
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, size: 26, color: C.mid, font: "Calibri" })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: C.ink, font: "Calibri" })],
  });

const body = (text, opts = {}) =>
  new Paragraph({
    spacing: { before: 60, after: 100 },
    alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({
      text, size: 20, color: opts.color || C.ink,
      bold: opts.bold || false,
      italics: opts.italic || false,
      font: "Calibri",
    })],
  });

const bullet = (text, level = 0) =>
  new Paragraph({
    spacing: { before: 40, after: 40 },
    numbering: { reference: "bullet-list", level },
    children: [new TextRun({ text, size: 20, font: "Calibri", color: C.ink })],
  });

// ── TABLE HELPERS ──────────────────────────────────────────────────────────
const cellBorders = (color = C.border) => ({
  top:    { style: BorderStyle.SINGLE, size: 4, color },
  bottom: { style: BorderStyle.SINGLE, size: 4, color },
  left:   { style: BorderStyle.SINGLE, size: 4, color },
  right:  { style: BorderStyle.SINGLE, size: 4, color },
});

const noBorders = () => ({
  top:    { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right:  { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
});

const mkCell = (text, opts = {}) =>
  new TableCell({
    width:   { size: opts.width || 2000, type: WidthType.DXA },
    borders: opts.noBorder ? noBorders() : cellBorders(opts.borderColor || C.border),
    shading: opts.shade
      ? { type: ShadingType.CLEAR, fill: opts.shade, color: opts.shade }
      : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({
          text: String(text),
          bold:    opts.bold    || false,
          italics: opts.italic  || false,
          size:    opts.size    || 19,
          color:   opts.color   || C.ink,
          font:    "Calibri",
        })],
      }),
    ],
  });

// Header row builder
const hRow = (cells, widths, shades) =>
  new TableRow({
    tableHeader: true,
    children: cells.map((c, i) =>
      mkCell(c, {
        bold: true, size: 19, color: C.white,
        shade: C.primary, center: true,
        width: widths[i],
      })
    ),
  });

const dRow = (cells, widths, even = false, opts = []) =>
  new TableRow({
    children: cells.map((c, i) =>
      mkCell(c, {
        width: widths[i],
        shade: even ? C.rowAlt : C.white,
        color: opts[i]?.color || C.ink,
        bold:  opts[i]?.bold  || false,
        center: opts[i]?.center || false,
        size: 19,
      })
    ),
  });

// ── BADGE CELL (coloured risk badge) ──────────────────────────────────────
const badgeCell = (text, type, w) => {
  const map = {
    high:   { shade: C.redBg,   color: C.red   },
    medium: { shade: C.amberBg, color: C.amber  },
    low:    { shade: C.greenBg, color: C.green  },
    good:   { shade: C.tealBg,  color: C.teal   },
  };
  const s = map[type] || { shade: C.rowAlt, color: C.ink };
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: cellBorders(C.border),
    shading: { type: ShadingType.CLEAR, fill: s.shade, color: s.shade },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text, bold: true, size: 18, color: s.color, font: "Calibri" })],
    })],
  });
};

// ── CALLOUT BOX (shaded paragraph table) ─────────────────────────────────
const callout = (title, text, shade = C.light, titleColor = C.primary) =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: [
        new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top:    { style: BorderStyle.SINGLE, size: 12, color: C.accent },
            bottom: { style: BorderStyle.SINGLE, size: 4,  color: C.border },
            left:   { style: BorderStyle.SINGLE, size: 4,  color: C.border },
            right:  { style: BorderStyle.SINGLE, size: 4,  color: C.border },
          },
          shading: { type: ShadingType.CLEAR, fill: shade, color: shade },
          margins: { top: 120, bottom: 120, left: 180, right: 180 },
          children: [
            new Paragraph({
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: title, bold: true, size: 21, color: titleColor, font: "Calibri" })],
            }),
            new Paragraph({
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text, size: 19, color: C.ink, font: "Calibri" })],
            }),
          ],
        }),
      ] }),
    ],
  });

// ── WORKFLOW STEP ─────────────────────────────────────────────────────────
const flowStep = (num, label, desc) =>
  new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({ text: `  ${num}  `, bold: true, size: 20, color: C.white, font: "Calibri",
        shading: { type: ShadingType.CLEAR, fill: C.accent, color: C.accent } }),
      new TextRun({ text: `  ${label}`, bold: true, size: 20, color: C.primary, font: "Calibri" }),
      new TextRun({ text: `  —  ${desc}`, size: 19, color: C.muted, font: "Calibri" }),
    ],
  });

// ── PAGE BREAK ────────────────────────────────────────────────────────────
const pb = () => new Paragraph({ children: [new PageBreak()] });

// ═══════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════
const doc = new Document({
  numbering: {
    config: [{
      reference: "bullet-list",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 240 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 240 } } } },
      ],
    }],
  },
  styles: {
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1",
        basedOn: "Normal", next: "Normal",
        run: { bold: true, size: 36, color: C.primary, font: "Calibri" },
      },
      {
        id: "Heading2", name: "Heading 2",
        basedOn: "Normal", next: "Normal",
        run: { bold: true, size: 26, color: C.mid, font: "Calibri" },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Table({
            width: { size: 9720, type: WidthType.DXA },
            columnWidths: [6000, 3720],
            rows: [new TableRow({ children: [
              new TableCell({
                width: { size: 6000, type: WidthType.DXA },
                borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent } },
                children: [new Paragraph({
                  spacing: { before: 0, after: 60 },
                  children: [new TextRun({ text: "RetailPulse 360  |  Customer Churn Intelligence Platform", size: 16, color: C.muted, font: "Calibri" })],
                })],
              }),
              new TableCell({
                width: { size: 3720, type: WidthType.DXA },
                borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent } },
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 0, after: 60 },
                  children: [new TextRun({ text: "Shaik Kashida  |  Confidential", size: 16, color: C.muted, font: "Calibri" })],
                })],
              }),
            ]})],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
          children: [
            new TextRun({ text: "RetailPulse 360  |  Data Analytics Portfolio  |  Page ", size: 16, color: C.muted, font: "Calibri" }),
            PageNumber.CURRENT,
          ],
        })],
      }),
    },
    children: [

      // ══════════════════════════════════════════════════
      // SECTION 1 — COVER PAGE
      // ══════════════════════════════════════════════════
      sp(80),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 6 } },
        children: [new TextRun({ text: " ", size: 4 })],
      }),
      sp(240),

      // Brand line
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: "ANALYTICS PORTFOLIO PROJECT", size: 18, color: C.muted, font: "Calibri", bold: false })],
      }),

      // Main title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "RetailPulse 360", bold: true, size: 72, color: C.primary, font: "Calibri" })],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "Customer Churn Intelligence Platform", bold: true, size: 36, color: C.accent, font: "Calibri" })],
      }),

      sp(60),
      hr(),
      sp(60),

      // Subtitle block
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: "End-to-End Data Analytics  |  Business Intelligence  |  Executive Reporting", size: 20, color: C.muted, font: "Calibri" })],
      }),

      sp(200),

      // Tech stack table on cover
      new Table({
        width: { size: 7200, type: WidthType.DXA },
        columnWidths: [1200, 1200, 1200, 1200, 1200, 1200],
        rows: [new TableRow({
          children: ["Python","SQL","Power BI","R","Streamlit","GitHub"].map(t =>
            new TableCell({
              width: { size: 1200, type: WidthType.DXA },
              borders: cellBorders(C.accent),
              shading: { type: ShadingType.CLEAR, fill: C.light, color: C.light },
              margins: { top: 100, bottom: 100, left: 80, right: 80 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
                children: [new TextRun({ text: t, bold: true, size: 19, color: C.primary, font: "Calibri" })],
              })],
            })
          ),
        })],
      }),

      sp(300),
      hr(),
      sp(80),

      // Author block
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: "Prepared by", size: 18, color: C.muted, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: "Shaik Kashida", bold: true, size: 32, color: C.ink, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [new TextRun({ text: "Data Analyst  |  Business Intelligence  |  Analytics Engineer", size: 20, color: C.muted, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "May 2026", size: 20, color: C.muted, font: "Calibri" })],
      }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 2 — TABLE OF CONTENTS (manual)
      // ══════════════════════════════════════════════════
      h1("Table of Contents"),
      sp(40),

      ...[
        ["01", "Executive Summary"],
        ["02", "Business Problem & Objectives"],
        ["03", "Dataset Overview"],
        ["04", "Project Architecture & Workflow"],
        ["05", "Data Cleaning & Feature Engineering"],
        ["06", "SQL Business Analysis"],
        ["07", "Statistical Analysis — R"],
        ["08", "Power BI Dashboard"],
        ["09", "Streamlit Interactive Dashboard"],
        ["10", "Key Business Insights"],
        ["11", "Business Recommendations"],
        ["12", "Technology Stack"],
        ["13", "Skills Demonstrated"],
        ["14", "Project Outcomes"],
        ["15", "Conclusion"],
        ["16", "GitHub & Portfolio Links"],
      ].map(([num, title]) =>
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [
            new TextRun({ text: `${num}   `, bold: true, size: 20, color: C.accent, font: "Calibri" }),
            new TextRun({ text: title, size: 20, color: C.ink, font: "Calibri" }),
          ],
          border: { bottom: { style: BorderStyle.DOTTED, size: 2, color: C.border, space: 2 } },
        })
      ),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 3 — EXECUTIVE SUMMARY
      // ══════════════════════════════════════════════════
      h1("01  Executive Summary"),

      body("Customer churn is among the most critical operational challenges facing subscription-based businesses. Every customer who discontinues service represents not only an immediate loss of recurring revenue, but also a compounding impact on customer lifetime value, brand perception, and the cost efficiency of future acquisition campaigns."),
      sp(40),
      body("RetailPulse 360 is an end-to-end Customer Churn Intelligence Platform developed to address this challenge using a structured, data-driven analytical approach. The platform transforms raw customer transactional data from a telecommunications company into executive-level business intelligence, enabling decision-makers to understand who is churning, why they are churning, and what financial exposure the organisation faces as a result."),
      sp(40),

      h2("Business Objective"),
      body("The primary objective of this project is to identify the major drivers of customer churn, quantify the associated revenue at risk, segment customers by churn probability and business value, and deliver prioritised, actionable retention recommendations to business leadership."),

      h2("Solution Architecture"),
      body("The solution integrates a modern analytics stack spanning Python for data engineering and exploratory analysis, MySQL for structured business query analysis, R for statistical validation, Power BI for executive dashboard reporting, and Streamlit for an interactive web-based analytics application. Each component of the stack serves a distinct analytical purpose and together they represent the complete analytics lifecycle as practised in enterprise environments."),

      h2("Business Value"),
      body("This project directly answers three strategic questions that any Customer Success, Revenue Operations, or Chief Revenue Officer team would prioritise:"),
      bullet("Which customers are most likely to leave in the near term?"),
      bullet("Which customer segments represent the greatest financial exposure?"),
      bullet("What specific interventions will have the highest return on retention investment?"),
      sp(60),

      h2("Key Findings at a Glance"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3200, 3080, 3080],
        rows: [
          hRow(["Metric", "Value", "Business Signal"], [3200, 3080, 3080]),
          dRow(["Overall Churn Rate",        "26.54%",     "Above 20% industry benchmark — elevated risk"],    [3200,3080,3080], false),
          dRow(["Monthly Revenue at Risk",   "$139,131",   "Recurring monthly revenue exposure"],               [3200,3080,3080], true),
          dRow(["Historic Revenue Lost",     "$2,862,927", "Cumulative lifetime value destroyed"],              [3200,3080,3080], false),
          dRow(["M2M Contract Churn Rate",   "42.71%",     "3.8× higher than annual subscribers"],             [3200,3080,3080], true),
          dRow(["Electronic Check Churn",    "45.29%",     "Highest of all payment methods"],                  [3200,3080,3080], false),
          dRow(["New Customer Churn (0–12m)","47.68%",     "Onboarding gap — critical first-year risk"],       [3200,3080,3080], true),
          dRow(["Fiber Optic Churn Rate",    "41.89%",     "Product-quality signal at premium tier"],          [3200,3080,3080], false),
          dRow(["Senior Citizen Churn",      "41.68%",     "1.8× higher than non-senior segment"],             [3200,3080,3080], true),
          dRow(["Two-Year Contract Churn",   "2.83%",      "Benchmark for successful retention"],              [3200,3080,3080], false),
        ],
      }),
      sp(60),
      body("These findings provide the foundation for five high-priority retention campaigns that are estimated to protect up to $155,000 in monthly recurring revenue if implemented concurrently.", { italic: true, color: C.muted }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 4 — BUSINESS PROBLEM
      // ══════════════════════════════════════════════════
      h1("02  Business Problem & Objectives"),

      h2("The Churn Challenge in Telecom"),
      body("Telecommunication companies operate on subscription-based revenue models where customer retention is a fundamental driver of financial performance. Unlike one-time transaction businesses, telecoms depend on customers renewing month after month, and the compounding effect of churn over time destroys significant enterprise value."),
      sp(40),
      body("Industry research consistently places the cost of acquiring a new customer at five to seven times the cost of retaining an existing one. When a customer churns, the organisation must absorb both the direct revenue loss and the future acquisition and onboarding cost of a replacement — creating a double-impact on profitability that is rarely visible in short-term financial reporting."),

      sp(60),
      h2("Why Churn Matters — The Financial Case"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3120, 6240],
        rows: [
          hRow(["Impact Area", "Business Consequence"], [3120, 6240]),
          dRow(["Recurring Revenue Loss",  "Every churned customer reduces monthly recurring revenue (MRR) permanently until replaced by a new acquisition."], [3120,6240], false),
          dRow(["Customer Lifetime Value", "CLV decreases as average tenure falls. A customer retained for 36 months generates 2× the revenue of one retained for 18 months."], [3120,6240], true),
          dRow(["Acquisition Cost Pressure","Customer Acquisition Cost (CAC) rises when churn accelerates the need to replace lost revenue through marketing spend."], [3120,6240], false),
          dRow(["NPS and Brand Risk",       "Churned customers are more likely to share negative experiences, creating a reputational drag on new customer acquisition."], [3120,6240], true),
          dRow(["Operational Inefficiency", "Retention campaigns launched reactively after churn are significantly less cost-effective than proactive early-stage intervention."], [3120,6240], false),
        ],
      }),

      sp(80),
      h2("Business Questions This Project Answers"),
      bullet("What is the overall churn rate, and how does it compare to industry benchmarks?"),
      bullet("Which contract types are most strongly associated with customer attrition?"),
      bullet("What is the total monthly and historical revenue at risk from churned customers?"),
      bullet("Which customer segments — by tenure, service type, and payment method — have the highest churn probability?"),
      bullet("What is the average Customer Lifetime Value of churned versus retained customers?"),
      bullet("Are observed differences in churn rates statistically significant, or within the margin of natural variation?"),
      bullet("What specific, quantified actions should the business take to reduce churn?"),

      sp(60),
      h2("Project Objectives"),
      ...[
        ["Measure overall customer churn performance and benchmark against industry standards."],
        ["Identify high-risk customer segments by contract type, tenure cohort, internet service, and payment method."],
        ["Quantify monthly and cumulative revenue at risk from the current churned customer population."],
        ["Understand how contract structure influences long-term customer retention behaviour."],
        ["Evaluate Customer Lifetime Value (CLV) across churned and retained populations."],
        ["Analyse customer tenure patterns to identify the most vulnerable lifecycle stages."],
        ["Validate all key business assumptions using rigorous statistical testing in R."],
        ["Build interactive dashboards in Power BI and Streamlit for executive decision support."],
        ["Deliver a consulting-style prioritised action plan for churn reduction."],
      ].map(([t]) => bullet(t)),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 5 — DATASET
      // ══════════════════════════════════════════════════
      h1("03  Dataset Overview"),

      body("The IBM Telco Customer Churn Dataset is a widely recognised industry-standard benchmark dataset that closely mirrors the data architecture of real telecommunications customer management systems. It is used across academic research, industry analytics competitions, and professional portfolio development as a representative proxy for real-world customer churn modelling."),

      sp(60),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2600, 6760],
        rows: [
          hRow(["Dataset Property", "Detail"], [2600, 6760]),
          dRow(["Dataset Name",    "IBM Telco Customer Churn Dataset"],                          [2600,6760], false),
          dRow(["Source",         "IBM Sample Data — publicly available on Kaggle"],             [2600,6760], true),
          dRow(["Total Records",  "7,043 customers"],                                            [2600,6760], false),
          dRow(["Original Features","21 columns"],                                               [2600,6760], true),
          dRow(["Engineered Features","6 additional business-focused columns (27 total)"],       [2600,6760], false),
          dRow(["Target Variable", "Churn (Yes / No)"],                                         [2600,6760], true),
          dRow(["Churn Rate",     "26.54% (1,869 churned customers)"],                          [2600,6760], false),
          dRow(["Data Quality",   "No duplicate records; 11 null TotalCharges values — resolved via imputation"], [2600,6760], true),
        ],
      }),

      sp(80),
      h2("Feature Categories"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 3480, 3480],
        rows: [
          hRow(["Category", "Features", "Analytics Purpose"], [2400, 3480, 3480]),
          dRow(["Customer Demographics",    "Customer ID, Gender, Senior Citizen, Partner, Dependents",                                       "Segmentation and demographic churn analysis"],               [2400,3480,3480], false),
          dRow(["Service Subscriptions",    "Phone Service, Multiple Lines, Internet Service, Online Security, Backup, Device Protection, Tech Support, Streaming TV, Streaming Movies", "Service adoption and churn correlation"],  [2400,3480,3480], true),
          dRow(["Contract & Billing",       "Contract Type, Paperless Billing, Payment Method",                                               "Contract risk and payment friction analysis"],               [2400,3480,3480], false),
          dRow(["Financial Metrics",        "Monthly Charges, Total Charges",                                                                  "Revenue at risk and CLV calculation"],                       [2400,3480,3480], true),
          dRow(["Engagement",               "Tenure (months)",                                                                                  "Cohort analysis and lifecycle stage identification"],        [2400,3480,3480], false),
          dRow(["Engineered Features",      "Churn_Flag, CLV, TenureGroup, HighValueCustomer, RevenueRisk, ContractRisk",                     "KPI development, SQL analysis, and dashboard metrics"],     [2400,3480,3480], true),
        ],
      }),

      sp(80),
      h2("Dataset Quality Assessment"),
      body("The dataset was assessed against five data quality dimensions prior to analysis:"),
      bullet("Completeness: 11 records contained null TotalCharges values. These were imputed using the formula MonthlyCharges × Tenure, a business-justified estimate consistent with a newly onboarded customer who has not yet completed a full billing cycle."),
      bullet("Accuracy: All numeric fields were validated for plausible range. Monthly charges fell between $18.25 and $118.75, consistent with real telecom pricing structures."),
      bullet("Consistency: The Churn field was verified to contain only binary values (Yes/No). SeniorCitizen was confirmed as a binary integer (0/1)."),
      bullet("Uniqueness: No duplicate Customer ID records were found. Each row represents a distinct customer relationship."),
      bullet("Timeliness: The dataset represents a historical cross-section of the customer base and is appropriate for retrospective churn analysis and pattern identification."),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 6 — ARCHITECTURE
      // ══════════════════════════════════════════════════
      h1("04  Project Architecture & Workflow"),

      body("The project follows a structured, ten-stage analytics pipeline that mirrors the workflow of a Business Intelligence or Data Engineering team at an enterprise organisation. Each stage produces a validated output that feeds directly into the next, ensuring full traceability from raw data to executive recommendation."),

      sp(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({ children: [new TableCell({
            width: { size: 9360, type: WidthType.DXA },
            borders: cellBorders(C.border),
            shading: { type: ShadingType.CLEAR, fill: C.light, color: C.light },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 100 },
                children: [new TextRun({ text: "End-to-End Analytics Pipeline", bold: true, size: 22, color: C.primary, font: "Calibri" })],
              }),
              ...[
                ["01", "Raw Dataset",            "IBM Telco CSV — 7,043 customers, 21 original columns"],
                ["02", "Python Data Cleaning",   "Null imputation, type correction, duplicate check, data validation"],
                ["03", "Feature Engineering",    "CLV, TenureGroup, Churn_Flag, HighValueCustomer, RevenueRisk, ContractRisk"],
                ["04", "Processed Dataset",      "Clean, enriched dataset exported as cleaned_churn_base.csv"],
                ["05", "SQL Business Analysis",  "KPI queries, cohort analysis, window functions, revenue segmentation"],
                ["06", "Python EDA",             "Exploratory analysis, correlation matrix, distribution analysis, Plotly visuals"],
                ["07", "R Statistical Analysis", "t-test, chi-square test, logistic regression — statistical validation"],
                ["08", "Power BI Dashboard",     "Executive KPI cards, churn by segment, revenue risk map, DAX measures"],
                ["09", "Streamlit Dashboard",    "Interactive web application with live filters and dynamic KPI updates"],
                ["10", "Business Insights",      "AI-assisted and analyst-driven insight generation and prioritised recommendations"],
              ].map(([n, l, d]) => flowStep(n, l, d)),
            ],
          })] }),
        ],
      }),

      sp(80),
      h2("Data Flow Diagram"),
      new Paragraph({
        spacing: { before: 60, after: 60 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: "Raw CSV  →  Python ETL  →  MySQL Database  →  R Validation  →  Power BI / Streamlit  →  Executive Insights",
          size: 20, color: C.primary, font: "Calibri", bold: true,
        })],
      }),

      sp(60),
      h2("Tool Selection Rationale"),
      body("Each technology in the stack was selected for a specific analytical function aligned with enterprise analytics practice:"),
      bullet("Python (Pandas, NumPy, Plotly, Streamlit) — the industry-standard tool for data wrangling, exploratory analysis, and building interactive analytics applications."),
      bullet("MySQL — provides the structured query environment to perform production-quality business intelligence queries including CTEs, window functions, and aggregation-based KPI calculations."),
      bullet("R (tidyverse, broom, caret) — provides statistically rigorous hypothesis testing and regression modelling that validates whether observed patterns are real or coincidental."),
      bullet("Power BI — the leading enterprise BI tool, required at Deloitte, EY, KPMG, Accenture, Infosys, and most large organisations. DAX measures enable dynamic KPI calculations not possible in static reports."),
      bullet("Streamlit — enables deployment of a live, interactive analytics application accessible via browser, demonstrating end-to-end product delivery capability."),
      bullet("GitHub — version control, documentation, and portfolio hosting, signals professional software development practices."),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 7 — DATA CLEANING
      // ══════════════════════════════════════════════════
      h1("05  Data Cleaning & Feature Engineering"),

      h2("Data Cleaning Operations"),
      body("The raw IBM Telco dataset required systematic preprocessing before it could be used for business analysis. The following operations were performed using Python (Pandas and NumPy):"),

      sp(60),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [600, 2800, 5960],
        rows: [
          hRow(["#", "Operation", "Business Justification"], [600, 2800, 5960]),
          dRow(["01", "Duplicate Record Check",           "Verified zero duplicate Customer IDs. Each row represents a distinct customer relationship."],                                                  [600,2800,5960], false),
          dRow(["02", "TotalCharges Type Conversion",     "Column loaded as string due to 11 blank entries. Converted to float64 using pd.to_numeric(errors='coerce')."],                             [600,2800,5960], true),
          dRow(["03", "Null Value Imputation",            "11 null TotalCharges records (new customers, tenure=0). Imputed as MonthlyCharges × max(tenure, 1) — a conservative business estimate."],  [600,2800,5960], false),
          dRow(["04", "Target Variable Encoding",         "Churn column (Yes/No) encoded as Churn_Flag (1/0) for SQL aggregations, KPI calculations, and model readiness."],                           [600,2800,5960], true),
          dRow(["05", "Data Type Standardisation",        "SeniorCitizen confirmed as integer binary. All categorical columns validated for consistent string casing."],                               [600,2800,5960], false),
          dRow(["06", "Outlier Assessment",               "IQR-based detection on MonthlyCharges, TotalCharges, tenure. No removals — outliers represent genuine high-value or long-tenure customers."], [600,2800,5960], true),
          dRow(["07", "Dataset Export",                   "Cleaned dataset saved as cleaned_churn_base.csv — the single source of truth for all downstream SQL, R, Power BI, and Streamlit analysis."], [600,2800,5960], false),
        ],
      }),

      sp(80),
      h2("Engineered Business Features"),
      body("Six business-focused features were engineered from the cleaned dataset to support KPI development, segmentation analysis, and dashboard calculation:"),
      sp(60),

      ...[
        {
          name: "Churn_Flag",
          formula: "Churn_Flag = 1 if Churn = 'Yes', else 0",
          purpose: "Converts the categorical churn label into a binary integer, enabling SUM() and AVG() calculations in SQL, enabling direct KPI computation (e.g., Churn Rate = SUM(Churn_Flag) / COUNT(*)), and making the dataset machine-learning ready.",
          shade: C.light,
        },
        {
          name: "Customer Lifetime Value (CLV)",
          formula: "CLV = MonthlyCharges × Tenure",
          purpose: "Estimates the total revenue a customer has generated over their relationship with the company. CLV enables segmentation of the customer base by financial value, identification of high-value customers at risk, and prioritisation of retention campaign investment.",
          shade: C.light,
        },
        {
          name: "TenureGroup",
          formula: "New (0–12m) | Growing (13–24m) | Established (25–48m) | Loyal (48m+)",
          purpose: "Groups customers into four lifecycle cohorts based on months of tenure. Enables cohort-level churn analysis, identification of the most vulnerable lifecycle stages, and targeted retention strategy design per cohort.",
          shade: C.light,
        },
        {
          name: "HighValueCustomer",
          formula: "HighValueCustomer = 1 if MonthlyCharges > 75th percentile threshold",
          purpose: "Flags customers in the top revenue quartile. These customers represent disproportionate monthly revenue and require prioritised retention. Identifying their churn risk enables targeted VIP-tier intervention.",
          shade: C.light,
        },
        {
          name: "RevenueRisk",
          formula: "RevenueRisk = MonthlyCharges if Churn_Flag = 1, else 0",
          purpose: "Quantifies the exact monthly revenue exposure from each churned customer. Summing RevenueRisk across segments produces the critical 'Monthly Revenue at Risk' KPI — the most actionable financial metric for retention planning.",
          shade: C.light,
        },
        {
          name: "ContractRisk",
          formula: "ContractRisk = 'High' if Month-to-month, else 'Low'",
          purpose: "Applies a business-rule classification identifying month-to-month customers as high-risk based on their observed churn rate of 42.71%. Enables rapid filtering of the high-risk population for targeted retention outreach without requiring a predictive model.",
          shade: C.light,
        },
      ].flatMap(f => [
        callout(f.name, `Formula: ${f.formula}\n\n${f.purpose}`, f.shade),
        sp(60),
      ]),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 8 — SQL
      // ══════════════════════════════════════════════════
      h1("06  SQL Business Analysis"),

      body("A comprehensive SQL analysis layer was developed using MySQL 8.0 to answer the core business questions identified in the project brief. Five SQL scripts were written covering increasing analytical complexity — from foundational KPI queries to advanced window functions and multi-level CTEs."),
      sp(40),
      body("The SQL analysis was structured to reflect the type of production-quality queries expected in a Business Intelligence or Data Analytics role at an enterprise organisation. All queries are documented, parameterised, and reproducible."),

      sp(60),
      h2("SQL Analysis Areas"),

      h3("6.1  Overall Business KPIs"),
      body("The foundational KPI query established the core business metrics across the full customer base. Using conditional aggregation (CASE WHEN expressions within SUM and AVG functions), the query computed:"),
      bullet("Total customer count and churned customer count"),
      bullet("Churn rate as a percentage of the total base"),
      bullet("Retention rate as the complementary metric"),
      bullet("Monthly revenue at risk (sum of MonthlyCharges for churned customers)"),
      bullet("Historical revenue lost (sum of TotalCharges for churned customers)"),
      bullet("Average Customer Lifetime Value across all customers"),
      body("Result: 26.54% overall churn rate, $139,131 monthly revenue at risk, $2.86M cumulative revenue loss.", { bold: true, color: C.primary }),

      sp(60),
      h3("6.2  Contract Type Analysis"),
      body("Churn rate, average monthly charges, customer count, and revenue at risk were computed for each contract type using GROUP BY aggregation. This revealed the dramatic gradient in churn risk across contract structures and quantified the exact financial exposure by tier:"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2500, 1720, 1580, 1560, 2000],
        rows: [
          hRow(["Contract Type", "Customers", "Churned", "Churn Rate", "Monthly Rev at Risk"], [2500,1720,1580,1560,2000]),
          dRow(["Month-to-month", "3,875", "1,655", "42.71%", "$120,847"],  [2500,1720,1580,1560,2000], false, [{},{},{},{color:C.red,bold:true},{color:C.red}]),
          dRow(["One Year",        "1,473",   "166",  "11.27%", "$14,118"], [2500,1720,1580,1560,2000], true,  [{},{},{},{color:C.amber}]),
          dRow(["Two Year",        "1,695",    "48",   "2.83%",  "$4,165"], [2500,1720,1580,1560,2000], false, [{},{},{},{color:C.green}]),
        ],
      }),

      sp(60),
      h3("6.3  Cohort Analysis — Tenure Groups"),
      body("A CTE-based cohort analysis partitioned customers into four lifecycle bands and computed churn rate, revenue at risk, and average CLV per cohort. A running revenue total window function was added to show cumulative risk exposure across the lifecycle:"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 1440, 1360, 1600, 1560, 1000],
        rows: [
          hRow(["Cohort", "Customers", "Churned", "Churn Rate", "Rev at Risk", "% of Risk"], [2400,1440,1360,1600,1560,1000]),
          dRow(["New (0–12m)",        "2,175", "1,037", "47.68%", "$62,100", "44.7%"], [2400,1440,1360,1600,1560,1000], false, [{},{},{},{color:C.red,bold:true}]),
          dRow(["Growing (13–24m)",   "1,024",   "294", "28.71%", "$23,400", "16.8%"], [2400,1440,1360,1600,1560,1000], true,  [{},{},{},{color:C.amber}]),
          dRow(["Established (25–48m)","1,594",  "325", "20.39%", "$25,100", "18.1%"], [2400,1440,1360,1600,1560,1000], false, [{},{},{},{color:C.amber}]),
          dRow(["Loyal (48m+)",       "2,239",   "213",  "9.51%", "$18,700", "13.5%"], [2400,1440,1360,1600,1560,1000], true,  [{},{},{},{color:C.green}]),
        ],
      }),

      sp(60),
      h3("6.4  Payment Method Analysis"),
      body("Churn rates across four payment methods were computed using GROUP BY aggregation with conditional SUM. The analysis revealed a sharp divide between manual and automatic payment methods:"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3200, 1540, 1380, 1740, 2500],
        rows: [
          hRow(["Payment Method", "Customers", "Churned", "Churn Rate", "Risk Level"], [3200,1540,1380,1740,2500]),
          new TableRow({ children: [
            mkCell("Electronic Check",            { width:3200, shade:C.white }),
            mkCell("2,365",                        { width:1540, shade:C.white }),
            mkCell("1,071",                        { width:1380, shade:C.white, color:C.red, bold:true }),
            mkCell("45.29%",                       { width:1740, shade:C.white, color:C.red, bold:true }),
            badgeCell("HIGH RISK", "high", 2500),
          ]}),
          new TableRow({ children: [
            mkCell("Mailed Check",                 { width:3200, shade:C.rowAlt }),
            mkCell("1,612",                        { width:1540, shade:C.rowAlt }),
            mkCell("308",                          { width:1380, shade:C.rowAlt }),
            mkCell("19.11%",                       { width:1740, shade:C.rowAlt }),
            badgeCell("MEDIUM", "medium", 2500),
          ]}),
          new TableRow({ children: [
            mkCell("Bank Transfer (Automatic)",    { width:3200, shade:C.white }),
            mkCell("1,544",                        { width:1540, shade:C.white }),
            mkCell("258",                          { width:1380, shade:C.white }),
            mkCell("16.71%",                       { width:1740, shade:C.white }),
            badgeCell("LOW", "low", 2500),
          ]}),
          new TableRow({ children: [
            mkCell("Credit Card (Automatic)",      { width:3200, shade:C.rowAlt }),
            mkCell("1,522",                        { width:1540, shade:C.rowAlt }),
            mkCell("232",                          { width:1380, shade:C.rowAlt }),
            mkCell("15.24%",                       { width:1740, shade:C.rowAlt }),
            badgeCell("LOW", "low", 2500),
          ]}),
        ],
      }),

      sp(60),
      h3("6.5  Advanced SQL — Window Functions & Revenue Ranking"),
      body("Advanced SQL analytical functions were applied to rank customers within segments and compute running revenue totals. Specific window functions used:"),
      bullet("RANK() OVER (PARTITION BY contract ORDER BY monthly_charges DESC) — Revenue rank within each contract type"),
      bullet("NTILE(4) OVER (ORDER BY monthly_charges DESC) — Revenue quartile assignment for high-value customer identification"),
      bullet("AVG(monthly_charges) OVER (PARTITION BY contract) — Segment-level average charge as a comparison baseline"),
      bullet("SUM(monthly_charges) OVER (ORDER BY monthly_rev_at_risk DESC ROWS UNBOUNDED PRECEDING) — Cumulative revenue at risk"),
      bullet("PERCENT_RANK() OVER (ORDER BY CLV) — Customer CLV percentile for lifetime value distribution analysis"),

      sp(60),
      h3("6.6  RFM-Style Customer Segmentation"),
      body("A five-tier RFM-inspired segmentation was constructed using a multi-CTE SQL architecture: the first CTE computed per-customer recency and monetary scores using NTILE(), the second applied business-rule logic to assign segment labels, and the final SELECT aggregated churn rate and revenue at risk by segment. This structure reflects enterprise-level query design patterns."),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 9 — R ANALYSIS
      // ══════════════════════════════════════════════════
      h1("07  Statistical Analysis — R"),

      body("Statistical analysis was performed in R to validate the business hypotheses identified during exploratory analysis. Python-based EDA identifies patterns; R provides the rigorous statistical framework to confirm whether those patterns are genuine signals or within the range of expected random variation. This distinction is critical when presenting findings to executive stakeholders or when recommendations will be used to justify budget allocation."),

      sp(60),
      h2("7.1  Chi-Square Test — Contract Type vs Churn"),
      h3("Purpose"),
      body("To determine whether the observed difference in churn rates across contract types (Month-to-month: 42.71%, One Year: 11.27%, Two Year: 2.83%) is statistically significant, or whether it could have occurred by chance."),
      h3("Method"),
      body("A Pearson chi-square test of independence was applied to a 3×2 contingency table (Contract Type × Churn Status)."),
      h3("Finding"),
      callout(
        "Chi-Square Test Result: HIGHLY SIGNIFICANT",
        "p-value < 0.001. The null hypothesis (that contract type and churn are independent) is rejected at all standard significance levels. Contract type is a statistically significant predictor of churn. The observed 39.88 percentage point difference between month-to-month and two-year contract churn rates is real, not coincidental.",
        C.light, C.primary
      ),
      h3("Business Interpretation"),
      body("This result provides statistical proof that contract structure is the dominant churn driver. Any retention strategy that does not prioritise migrating month-to-month customers to longer-term contracts is leaving significant, statistically validated revenue protection on the table."),

      sp(80),
      h2("7.2  Two-Sample t-Test — Tenure vs Churn"),
      h3("Purpose"),
      body("To determine whether churned customers have a statistically significantly lower average tenure than retained customers — validating the hypothesis that early-lifecycle customers are at disproportionately higher risk."),
      h3("Method"),
      body("A Welch two-sample t-test (unequal variance) was applied comparing mean tenure between the churned population (n=1,869) and the retained population (n=5,174)."),
      h3("Finding"),
      callout(
        "t-Test Result: HIGHLY SIGNIFICANT",
        "Churned customers average tenure: 18.0 months. Retained customers average tenure: 37.6 months. Difference: 19.6 months. p-value < 0.001. The null hypothesis (equal mean tenure) is rejected. Churned customers leave significantly earlier in the customer lifecycle.",
        C.light, C.primary
      ),
      h3("Business Interpretation"),
      body("Customers who leave have on average less than half the tenure of those who stay. The critical risk window is months 0–12, when 47.68% of new customers churn. An intervention program targeting the first 90 days of the customer relationship is statistically justified by this finding."),

      sp(80),
      h2("7.3  Logistic Regression — Churn Probability Model"),
      h3("Purpose"),
      body("To identify which individual customer attributes are the strongest independent predictors of churn probability, while controlling for all other variables."),
      h3("Method"),
      body("A binary logistic regression was estimated using an 80/20 train-test split (random seed 42). The model was evaluated using accuracy, sensitivity, specificity, F1 score, and AUC-ROC."),
      h3("Key Predictor Findings"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [3000, 2000, 2360, 2000],
        rows: [
          hRow(["Predictor Variable", "Direction", "Significance", "Business Meaning"], [3000,2000,2360,2000]),
          dRow(["Month-to-month Contract", "Increases churn", "p < 0.001 ***", "Strongest positive predictor — removes switching cost barrier"],          [3000,2000,2360,2000], false, [{},{color:C.red},{color:C.red,bold:true}]),
          dRow(["Tenure",                  "Decreases churn", "p < 0.001 ***", "Each additional month reduces churn probability significantly"],           [3000,2000,2360,2000], true,  [{},{color:C.green},{color:C.red,bold:true}]),
          dRow(["Fiber Optic Internet",    "Increases churn", "p < 0.001 ***", "Product-quality gap — premium price, dissatisfied experience"],            [3000,2000,2360,2000], false, [{},{color:C.red},{color:C.red,bold:true}]),
          dRow(["Electronic Check",        "Increases churn", "p < 0.001 ***", "Low commitment proxy — manual payers disengage more readily"],              [3000,2000,2360,2000], true,  [{},{color:C.red},{color:C.red,bold:true}]),
          dRow(["Monthly Charges",         "Increases churn", "p < 0.01 **",   "High charges relative to perceived value increases attrition risk"],        [3000,2000,2360,2000], false, [{},{color:C.amber},{color:C.amber}]),
          dRow(["Senior Citizen",          "Increases churn", "p < 0.05 *",    "Higher vulnerability — may require dedicated support and simplified UX"],   [3000,2000,2360,2000], true,  [{},{color:C.amber}]),
        ],
      }),
      sp(60),
      body("Model performance on the held-out test set: Accuracy 80.6% · Sensitivity 56.3% · Specificity 90.1% · AUC-ROC 0.84. The AUC-ROC of 0.84 indicates the model effectively distinguishes between churned and retained customers and is suitable as a churn risk scoring tool.", { italic: true }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 10 — POWER BI DASHBOARD
      // ══════════════════════════════════════════════════
      h1("08  Power BI Dashboard"),

      body("The Power BI executive dashboard was designed to communicate churn intelligence to business stakeholders with no analytical background. The design philosophy prioritises information density with visual clarity — every element on each dashboard page answers a specific business question."),
      sp(40),
      body("The dashboard uses a custom dark-navy theme with a teal-coral accent palette, glassmorphism-style KPI cards, and a maximum of three charts per page to maintain executive-level focus. DAX measures drive all KPI calculations dynamically, responding to slicer selections in real time."),

      sp(80),
      h2("Dashboard Page 1 — Executive Overview"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: C.accent },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          },
          shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "F1F5F9" },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: "[ INSERT POWER BI EXECUTIVE DASHBOARD OVERVIEW HERE ]", bold: true, size: 24, color: C.muted, font: "Calibri" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "Recommended screenshot dimensions: 1600 × 900px  |  PNG format", size: 16, color: C.muted, font: "Calibri", italics: true })],
            }),
          ],
        })]})],
      }),
      sp(60),
      h3("What Executives Learn from This Page"),
      bullet("The overall churn rate (26.54%) versus the industry benchmark (approximately 20%) — immediately flags the severity of the problem."),
      bullet("Total monthly revenue at risk ($139,131) expressed in a single KPI card — gives CFO-level context without requiring drill-down."),
      bullet("The churn rate by contract type visualised as a horizontal bar chart — makes the M2M vs Two-Year comparison immediately legible."),
      bullet("The customer cohort breakdown — identifies where in the customer lifecycle the highest attrition is concentrated."),

      sp(80),
      h2("Dashboard Page 2 — KPI Summary"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: C.accent },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          },
          shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "F1F5F9" },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: "[ INSERT KPI DASHBOARD SCREENSHOT HERE ]", bold: true, size: 24, color: C.muted, font: "Calibri" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "Include: Churn Rate, Retention Rate, Monthly Rev at Risk, Historic Rev Lost, Avg CLV  |  PNG 1600×900", size: 16, color: C.muted, font: "Calibri", italics: true })],
            }),
          ],
        })]})],
      }),
      sp(60),
      h3("KPIs Displayed on This Page"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 2000, 4560],
        rows: [
          hRow(["KPI Name", "Value", "DAX Measure Logic"], [2800,2000,4560]),
          dRow(["Churn Rate",            "26.54%",     "DIVIDE(COUNTROWS(FILTER(customers,Churn='Yes')),COUNTROWS(customers))"],           [2800,2000,4560], false),
          dRow(["Retention Rate",        "73.46%",     "1 - [Churn Rate]"],                                                                 [2800,2000,4560], true),
          dRow(["Monthly Rev at Risk",   "$139,131",   "CALCULATE(SUM(MonthlyCharges), Churn='Yes')"],                                      [2800,2000,4560], false),
          dRow(["Historic Rev Lost",     "$2,862,927", "CALCULATE(SUM(TotalCharges), Churn='Yes')"],                                        [2800,2000,4560], true),
          dRow(["Avg CLV",               "$2,280",     "AVERAGEX(customers, MonthlyCharges × tenure)"],                                     [2800,2000,4560], false),
          dRow(["Churned Customers",     "1,869",      "COUNTROWS(FILTER(customers, Churn='Yes'))"],                                        [2800,2000,4560], true),
        ],
      }),

      sp(80),
      h2("Dashboard Page 3 — Customer Segment Analysis"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: C.accent },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          },
          shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "F1F5F9" },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: "[ INSERT CUSTOMER SEGMENT DASHBOARD SCREENSHOT HERE ]", bold: true, size: 24, color: C.muted, font: "Calibri" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "Include: Segmentation matrix, revenue quartile breakdown, churn by demographic  |  PNG 1600×900", size: 16, color: C.muted, font: "Calibri", italics: true })],
            }),
          ],
        })]})],
      }),

      sp(80),
      h2("Dashboard Page 4 — Business Insights & AI Recommendations"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: C.accent },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          },
          shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "F1F5F9" },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: "[ INSERT BUSINESS INSIGHTS DASHBOARD SCREENSHOT HERE ]", bold: true, size: 24, color: C.muted, font: "Calibri" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "Include: AI insight text cards, revenue risk treemap, retention action panel  |  PNG 1600×900", size: 16, color: C.muted, font: "Calibri", italics: true })],
            }),
          ],
        })]})],
      }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 11 — STREAMLIT
      // ══════════════════════════════════════════════════
      h1("09  Streamlit Interactive Dashboard"),

      body("In addition to the Power BI executive dashboard, a fully interactive web-based analytics application was developed using Streamlit and deployed on Render. The Streamlit dashboard extends the analytical capability of the project by enabling non-technical business users to interact with the data in real time — applying filters, exploring segment breakdowns, and reading AI-generated insights — directly in a browser without requiring access to Power BI."),

      sp(80),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          width: { size: 9360, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 12, color: C.accent },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            left: { style: BorderStyle.SINGLE, size: 4, color: C.border },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.border },
          },
          shading: { type: ShadingType.CLEAR, fill: "F1F5F9", color: "F1F5F9" },
          margins: { top: 200, bottom: 200, left: 200, right: 200 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [new TextRun({ text: "[ INSERT STREAMLIT DASHBOARD SCREENSHOT HERE ]", bold: true, size: 24, color: C.muted, font: "Calibri" })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 0 },
              children: [new TextRun({ text: "URL: https://retailpulse-360.onrender.com  |  Screenshot at 1440×900px  |  PNG format", size: 16, color: C.muted, font: "Calibri", italics: true })],
            }),
          ],
        })]})],
      }),

      sp(80),
      h2("Application Features"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 6560],
        rows: [
          hRow(["Feature", "Description"], [2800, 6560]),
          dRow(["Live Filter Bar",          "Four interactive dropdowns (Contract, Tenure Group, Internet Service, Payment Method) filter all KPIs and charts simultaneously."], [2800,6560], false),
          dRow(["Dynamic KPI Cards",        "Four KPI tiles update in real time when filters are applied: Churn Rate, Monthly Revenue at Risk, Retention Rate, and Avg Customer Lifetime Value."], [2800,6560], true),
          dRow(["Chart 1 — Contract Churn", "Horizontal bar chart showing churn rate per contract type. Selected contract is highlighted; others are dimmed."], [2800,6560], false),
          dRow(["Chart 2 — Cohort Analysis","Grouped bar chart displaying retained vs churned count by tenure cohort — visually communicates the Year-1 drop-off."], [2800,6560], true),
          dRow(["Chart 3 — Revenue Treemap","Interactive treemap showing monthly revenue at risk by contract type and internet service — the highest-risk combinations are the largest and darkest tiles."], [2800,6560], false),
          dRow(["AI Insight Panel",          "Three colour-coded insight cards (Critical, Warning, Positive) present metric-grounded business findings directly in the UI."], [2800,6560], true),
          dRow(["Segment Data Table",        "Expandable table showing 9 key customer segments with churn rate, customer count, revenue at risk, and risk classification."], [2800,6560], false),
          dRow(["Reset Filters",             "Single-click filter reset returns all KPIs to the full-dataset baseline."], [2800,6560], true),
        ],
      }),

      sp(60),
      h2("Deployment"),
      body("The application is deployed on Render (render.com) using a render.yaml infrastructure-as-code configuration file. Deployment is triggered automatically on any push to the main branch of the GitHub repository. The app starts in under 30 seconds on the free tier and is accessible from any device with a browser."),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 12 — INSIGHTS
      // ══════════════════════════════════════════════════
      h1("10  Key Business Insights"),

      body("The following eight insights were derived from the combined SQL, Python EDA, and R statistical analysis. Each insight is structured in the format used by management consulting firms: observation, root cause, business impact, and recommended action."),

      sp(60),
      ...[
        {
          num: "01",
          title: "Month-to-Month Contracts Are the Primary Churn Mechanism",
          what: "Month-to-month customers churn at 42.71% — more than 3.8 times the rate of one-year contract holders (11.27%) and 15 times the rate of two-year contract holders (2.83%). This single segment accounts for 87% of total monthly revenue at risk ($120,847 of $139,131).",
          why: "Month-to-month contracts impose no switching cost. Customers who are uncertain about the product's value, or who encounter a single negative service experience, face zero financial penalty for cancelling. Without a commitment structure, the default decision under any dissatisfaction is to leave.",
          impact: "The M2M segment's churn rate is 22.71 percentage points above the company average. Statistically confirmed by chi-square test (p < 0.001). Reducing M2M churn by 10 percentage points alone would protect approximately $28,000 in monthly recurring revenue.",
          action: "Launch a 'Switch & Save' campaign targeting M2M customers with 6–18 months tenure, offering a 12–15% discount on annual contract upgrade. Pair with a loyalty milestone reward at the 12-month mark. Estimated ROI: $28,000–$38,000/month protected at 10% conversion.",
        },
        {
          num: "02",
          title: "The First 12 Months Are a Revenue Cliff — Onboarding Gap",
          what: "New customers (0–12 months tenure) churn at 47.68% — the highest of any tenure cohort and nearly double the rate of established customers (20.39%). Nearly half of all churned customers (44.7% of revenue at risk) are in this cohort.",
          why: "Customers who leave within the first year have not yet experienced the full value of the product. A two-sample t-test (p < 0.001) confirmed that churned customers have a mean tenure of 18.0 months versus 37.6 months for retained customers — a 19.6-month gap that signals a structural onboarding failure.",
          impact: "47.7% churn in the first year compresses customer lifetime value to its minimum possible level. A customer retained for 12 months generates only 32% of the CLV of one retained for 37 months. The revenue impact of Year-1 churn is compounding.",
          action: "Implement a 90-day Customer Success Program with structured touchpoints at Day 14 (NPS survey trigger), Day 45 (feature adoption review), and Day 90 (contract upgrade offer). Industry benchmarks suggest 18–22% reduction in Year-1 churn from structured onboarding programs.",
        },
        {
          num: "03",
          title: "Electronic Check Payment Method as a Commitment Proxy",
          what: "Electronic check users churn at 45.29% — the highest of all four payment methods and three times the rate of credit card (15.24%) and bank transfer auto-pay customers (16.71%). 1,071 of the 2,365 electronic check users churned.",
          why: "Manual payment methods require an active monthly decision to pay. Customers who have not migrated to auto-pay have not fully committed to the service. The manual billing cycle creates a recurring monthly touchpoint where dissatisfied or cost-conscious customers can disengage. Electronic check payment is a behavioural signal, not merely a payment preference.",
          impact: "Electronic check customers represent $73,400 in monthly revenue at risk. Migrating this cohort to auto-pay would not only reduce churn through friction reduction but would also improve cash flow predictability and reduce involuntary churn from missed payments.",
          action: "Run an auto-pay migration campaign offering a $5/month billing discount for any electronic check customer who switches to bank transfer or card auto-pay. Target M2M + electronic check overlap (approximately 900 customers) as the highest-priority cohort.",
        },
        {
          num: "04",
          title: "Fiber Optic Customers Are Churning Despite Premium Pricing",
          what: "Fiber optic internet customers churn at 41.89% — significantly higher than DSL customers (18.96%) and 5.7 times higher than customers with no internet service (7.40%). This is counterintuitive: fiber customers pay more but are less likely to stay.",
          why: "Premium pricing creates heightened expectations. When service quality, reliability, or support does not match the price point, cognitive dissonance drives a stronger churn response than in lower-price tiers. The combination of high charges and unmet quality expectations is the most likely root cause. Logistic regression confirms fiber optic as a statistically significant positive predictor of churn (p < 0.001).",
          impact: "Fiber optic customers represent $87,200 in monthly revenue at risk — the single largest revenue risk segment by internet service type. Given their higher average monthly charges, each churned fiber customer represents greater revenue loss than a churned DSL customer.",
          action: "Commission a Fiber Optic Experience Audit: exit interviews with the last 200 churned fiber customers, NPS tracking for active fiber users, and a technical review of speed/uptime SLA compliance. Hypothesis: reliability or installation experience is the root cause. Short-term: implement a proactive outage notification and service credit program.",
        },
        {
          num: "05",
          title: "Senior Citizens Churn at Twice the Rate of Non-Senior Customers",
          what: "Senior citizen customers (aged 65+, SeniorCitizen = 1) churn at 41.68%, compared to 23.61% for non-senior customers — a 18.07 percentage point difference. Logistic regression identifies senior citizen status as a statistically significant predictor of churn (p < 0.05).",
          why: "Senior customers may experience higher friction with digital-first services, self-service portals, and technical troubleshooting. Without dedicated support pathways, this demographic disproportionately encounters unresolved service issues that drive attrition.",
          impact: "The 1,142 senior citizen customers represent $33,900 in monthly revenue at risk. If senior churn were reduced to the non-senior rate (23.61%), approximately $18,000/month in revenue currently at risk would be protected.",
          action: "Create a Senior Citizen Loyalty Tier with: dedicated phone support routing (sub-2-hour response SLA), simplified billing statements, proactive quarterly check-in calls, and a dedicated account manager for senior customers above a monthly charge threshold.",
        },
        {
          num: "06",
          title: "Two-Year Contracts Are the Gold Standard for Retention",
          what: "Two-year contract customers churn at only 2.83% — the lowest of any segment across the entire analysis. This rate is 14.97 times lower than month-to-month (42.71%) and 3.98 times lower than one-year contracts (11.27%). Only 48 of 1,695 two-year contract customers churned.",
          why: "Long-term contractual commitment creates a structural switching cost. Two-year contract customers have explicitly opted into a longer relationship, which selects for customers who are more satisfied, better informed, and more financially committed to the product. The commitment also provides time for the relationship to mature past the high-risk early-tenure phase.",
          impact: "The two-year contract base represents the company's most stable recurring revenue foundation. Its $4,165 in monthly revenue at risk is negligible relative to its 1,695 customer base. Growing this segment is the highest-value retention strategy available.",
          action: "Implement a structured contract migration journey: M2M → One Year (6-month discount), One Year → Two Year (10% annual discount). Create a two-year contract early-renewal incentive at the 18-month mark. Target M2M customers who have crossed 12 months tenure — this cohort has survived the highest-risk period and is most convertible.",
        },
        {
          num: "07",
          title: "High Monthly Charges Combined with Low Tenure Create Maximum Risk",
          what: "Analysis of the intersection of HighValueCustomer flag (top revenue quartile, MonthlyCharges > $75) and TenureGroup reveals that high-value new customers (0–12 months) represent a particularly acute risk: they pay significantly more than average but are in the highest-churn lifecycle stage.",
          why: "High-charge customers have higher expectations. When the value proposition is not immediately demonstrated — especially in the first 90 days — the cognitive dissonance between what they are paying and what they are experiencing drives early churn. The financial commitment makes disappointment feel more acute.",
          impact: "Each high-value customer who churns in the first year destroys the maximum possible CLV from the most expensive-to-acquire customers. The acquisition cost of a high-value customer is typically higher than average, making their early churn the most value-destructive outcome in the portfolio.",
          action: "Create a 'VIP Fast Start' programme for new customers with MonthlyCharges above $70: a dedicated onboarding specialist contact, a Day-7 service quality call, and a guaranteed response SLA of under 4 hours for the first 90 days. This investment is justified by the revenue protection it enables.",
        },
        {
          num: "08",
          title: "Gender Has No Significant Influence on Churn — Resource Allocation Implication",
          what: "Male customers churn at 26.16% and female customers at 26.92% — a difference of less than 0.8 percentage points. This near-identical distribution across gender is consistent with what a chi-square test would expect to produce at a non-significant p-value.",
          why: "Churn in this dataset is driven by structural factors — contract type, payment method, tenure, and service quality — rather than demographic factors such as gender. The uniformity across gender groups is statistically expected given that contract offerings, pricing, and service quality are applied uniformly across the customer base.",
          impact: "This finding has a direct resource allocation implication: marketing spend or retention campaign design that targets gender-specific segments will deliver no statistically differentiable return. Budget allocated to gender segmentation should be reallocated to contract-type and tenure-based interventions, which are the verified high-impact drivers.",
          action: "Prioritise retention campaign segmentation by ContractRisk, TenureGroup, and PaymentMethod rather than demographic variables. Gender-based segmentation should be reserved for communication style and channel preference optimisation, not for churn risk stratification.",
        },
      ].flatMap(ins => [
        callout(
          `Insight ${ins.num} — ${ins.title}`,
          `WHAT HAPPENED: ${ins.what}\n\nROOT CAUSE: ${ins.why}\n\nBUSINESS IMPACT: ${ins.impact}\n\nRECOMMENDED ACTION: ${ins.action}`,
          C.light,
          C.primary
        ),
        sp(80),
      ]),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 13 — RECOMMENDATIONS TABLE
      // ══════════════════════════════════════════════════
      h1("11  Business Recommendations"),

      body("The following five recommendations are prioritised by estimated revenue impact and implementation feasibility. They are presented in the format used by management consulting engagement reports: business objective, specific action, expected outcome, financial impact estimate, and implementation timeline."),

      sp(60),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [480, 2200, 2000, 2200, 1680, 800],
        rows: [
          hRow(["P", "Recommendation", "Root Cause Addressed", "Expected Business Impact", "Est. Rev Protection", "Timeline"], [480,2200,2000,2200,1680,800]),
          new TableRow({ children: [
            badgeCell("P1", "high", 480),
            mkCell("Launch 'Switch & Save' campaign — offer 12–15% discount to M2M customers with tenure 6–18 months for upgrading to annual contract", { width:2200 }),
            mkCell("42.71% M2M churn rate driven by zero switching cost", { width:2000 }),
            mkCell("Reduce M2M churn by est. 10 ppts; retain 387 additional customers", { width:2200 }),
            mkCell("$28K–$38K/month", { width:1680, bold:true, color:C.green }),
            mkCell("2–4 weeks", { width:800 }),
          ]}),
          new TableRow({ children: [
            badgeCell("P1", "high", 480),
            mkCell("Deploy 90-Day Customer Success Program — structured check-ins at Day 14, 45, 90 for all new customers", { width:2200, shade:C.rowAlt }),
            mkCell("47.68% churn rate in first 12 months — onboarding gap", { width:2000, shade:C.rowAlt }),
            mkCell("18–22% reduction in Year-1 churn; est. 180–220 additional customers retained annually", { width:2200, shade:C.rowAlt }),
            mkCell("$48K+ annualised", { width:1680, bold:true, color:C.green, shade:C.rowAlt }),
            mkCell("4–6 weeks", { width:800, shade:C.rowAlt }),
          ]}),
          new TableRow({ children: [
            badgeCell("P2", "medium", 480),
            mkCell("Auto-Pay Migration Campaign — $5/month discount for electronic check users who switch to automatic payment", { width:2200 }),
            mkCell("45.29% churn rate among electronic check users — payment friction and low commitment", { width:2000 }),
            mkCell("8–10% churn reduction in e-check segment; improved cash flow predictability", { width:2200 }),
            mkCell("$7K–$9K/month", { width:1680, bold:true, color:C.amber }),
            mkCell("2–3 weeks", { width:800 }),
          ]}),
          new TableRow({ children: [
            badgeCell("P2", "medium", 480),
            mkCell("Fiber Optic Service Quality Audit — exit interviews, SLA review, reliability investigation", { width:2200, shade:C.rowAlt }),
            mkCell("41.89% fiber churn despite premium pricing — product-market fit gap", { width:2000, shade:C.rowAlt }),
            mkCell("Reduce fiber churn by est. 15–20%; improve NPS in premium tier", { width:2200, shade:C.rowAlt }),
            mkCell("$13K–$17K/month", { width:1680, bold:true, color:C.amber, shade:C.rowAlt }),
            mkCell("6–8 weeks", { width:800, shade:C.rowAlt }),
          ]}),
          new TableRow({ children: [
            badgeCell("P3", "low", 480),
            mkCell("Senior Citizen Dedicated Support Tier — priority routing, simplified billing, quarterly outreach", { width:2200 }),
            mkCell("41.68% senior churn — 1.8× above non-senior rate — support friction", { width:2000 }),
            mkCell("15–20% churn reduction in senior segment; improved CSAT in key demographic", { width:2200 }),
            mkCell("$5K–$8K/month", { width:1680, color:C.muted }),
            mkCell("8–10 weeks", { width:800 }),
          ]}),
        ],
      }),

      sp(80),
      body("Combined maximum monthly revenue protection if all five recommendations are fully implemented: estimated $101,000–$120,000 per month — effectively recovering 73–86% of the current $139,131 monthly revenue at risk exposure.", { bold: true, color: C.primary }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 14 — TECH STACK
      // ══════════════════════════════════════════════════
      h1("12  Technology Stack"),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [1800, 1600, 5960],
        rows: [
          hRow(["Technology", "Version / Tool", "Role in Project"], [1800, 1600, 5960]),
          dRow(["Python",           "3.11",             "Core analytics language. Used for data cleaning, null imputation, outlier detection, feature engineering, EDA, and Streamlit app development."],                                     [1800,1600,5960], false),
          dRow(["Pandas",           "2.2.2",            "Primary data manipulation library. Used for all DataFrame operations including groupby, merge, apply, and pivot operations."],                                                         [1800,1600,5960], true),
          dRow(["NumPy",            "1.26.4",           "Numerical operations, array manipulation, and quantile-based feature engineering (IQR outlier detection, revenue quartile calculation)."],                                            [1800,1600,5960], false),
          dRow(["Plotly",           "5.22.0",           "Interactive visualisation library for EDA notebooks. Used for bar charts, scatter plots, histograms, correlation heatmaps, and treemaps."],                                           [1800,1600,5960], true),
          dRow(["SciPy",            "1.13.1",           "Chi-square test of independence and two-sample t-test for statistical validation of churn hypotheses."],                                                                              [1800,1600,5960], false),
          dRow(["Streamlit",        "1.35.0",           "Interactive web application framework. Powers the live ChurnScope analytics app deployed on Render."],                                                                                [1800,1600,5960], true),
          dRow(["MySQL",            "8.0",              "Relational database for structured SQL analysis. Houses the customer schema and supports all KPI, cohort, and window function queries."],                                              [1800,1600,5960], false),
          dRow(["R",                "4.3",              "Statistical analysis environment. Used for t-test, chi-square test, logistic regression with confusion matrix, and AUC-ROC evaluation."],                                              [1800,1600,5960], true),
          dRow(["tidyverse",        "R package",        "Data manipulation and ggplot2 visualisation within the R analytical workflow."],                                                                                                       [1800,1600,5960], false),
          dRow(["broom",            "R package",        "Tidies logistic regression model outputs into data frames for professional coefficient and odds ratio reporting."],                                                                    [1800,1600,5960], true),
          dRow(["caret",            "R package",        "Provides train-test split, confusion matrix, and cross-validation tools for logistic regression model evaluation."],                                                                   [1800,1600,5960], false),
          dRow(["Power BI Desktop", "Latest",           "Enterprise BI platform. Used for executive dashboard design including KPI cards, DAX measures, dynamic slicers, and treemap visualisations."],                                        [1800,1600,5960], true),
          dRow(["DAX",              "Power BI formula", "Data Analysis Expressions language used to create all computed KPI measures within Power BI (Churn Rate, Revenue at Risk, CLV, Retention Rate)."],                                    [1800,1600,5960], false),
          dRow(["Render",           "Cloud platform",   "PaaS hosting platform used to deploy the Streamlit analytics application. Deployment configured via render.yaml infrastructure-as-code."],                                            [1800,1600,5960], true),
          dRow(["GitHub",           "git 2.x",          "Version control, project documentation, and portfolio hosting. Repository structured with professional README, badges, architecture diagram, and ATS-optimised project description."], [1800,1600,5960], false),
          dRow(["VS Code",          "Latest",           "Primary development environment for Python scripting, SQL authoring, R scripting, and Streamlit application development."],                                                            [1800,1600,5960], true),
          dRow(["Microsoft Excel",  "2021 / 365",       "Used for initial data inspection, preliminary pivot table validation, and cross-checking SQL aggregation outputs."],                                                                   [1800,1600,5960], false),
        ],
      }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 15 — SKILLS
      // ══════════════════════════════════════════════════
      h1("13  Skills Demonstrated"),

      body("This project demonstrates a comprehensive set of analytical, technical, and business communication skills directly aligned with the requirements of Data Analyst, Business Intelligence Analyst, and Analytics Engineer roles at organisations including Deloitte, PwC, EY, KPMG, Accenture, Infosys, TCS, Amazon, and Microsoft."),

      sp(60),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 6960],
        rows: [
          hRow(["Skill Area", "Specific Capabilities Demonstrated"], [2400, 6960]),
          dRow(["Python Analytics",      "Pandas, NumPy, SciPy, Plotly, Streamlit; data cleaning pipeline; feature engineering; EDA; null imputation; outlier detection; modular code structure; Jupyter Notebook best practices."], [2400,6960], false),
          dRow(["SQL (Advanced)",        "MySQL schema design; CTEs; window functions (RANK, NTILE, LAG, PERCENT_RANK, AVG OVER); cohort analysis; RFM segmentation; KPI aggregation; subqueries; conditional SUM; revenue risk quantification."], [2400,6960], true),
          dRow(["Power BI",              "Custom dark theme design; DAX measure creation; KPI cards; interactive slicers; treemap, bar, scatter, and column charts; drill-through pages; data model relationships; executive-style layout."], [2400,6960], false),
          dRow(["R Programming",         "Two-sample Welch t-test; chi-square test of independence; binary logistic regression; AUC-ROC evaluation; confusion matrix; ggplot2 visualisation; broom model tidying; train-test validation."], [2400,6960], true),
          dRow(["Statistical Analysis",  "Hypothesis formulation and testing; p-value interpretation; effect size assessment; confidence intervals; odds ratio interpretation; model performance evaluation; statistical significance communication."], [2400,6960], false),
          dRow(["Feature Engineering",   "Business-rule-based feature creation; CLV calculation; cohort labelling; binary encoding; revenue risk quantification; customer value segmentation."], [2400,6960], true),
          dRow(["Business Intelligence", "KPI framework design; revenue at risk quantification; cohort and RFM segmentation; executive summary preparation; consulting-style recommendation development."], [2400,6960], false),
          dRow(["Data Storytelling",     "Translating statistical findings into business language; metric-grounded insight writing; executive-level visualisation design; insight-to-action narrative construction."], [2400,6960], true),
          dRow(["Dashboard Design",      "Dark theme UI; glassmorphism card layout; three-chart-maximum executive design principle; colour palette consistency; information hierarchy; minimal labelling."], [2400,6960], false),
          dRow(["Project Documentation", "Professional README with badges, architecture diagram, KPI table, and executive recommendations; modular folder structure; reproducible pipeline; ATS-optimised GitHub profile."], [2400,6960], true),
          dRow(["Deployment",            "Streamlit app deployment on Render; render.yaml infrastructure-as-code; automated CI/CD via GitHub push trigger; live portfolio link generation."], [2400,6960], false),
          dRow(["Executive Reporting",   "Consulting-style report writing; priority-tiered recommendation tables; business impact quantification; professional document formatting; stakeholder-ready presentation structure."], [2400,6960], true),
        ],
      }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 16 — OUTCOMES
      // ══════════════════════════════════════════════════
      h1("14  Project Outcomes"),

      body("The following quantified outcomes were delivered by the RetailPulse 360 project:"),
      sp(60),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [600, 3600, 5160],
        rows: [
          hRow(["#", "Outcome", "Detail"], [600, 3600, 5160]),
          dRow(["01", "Churn Rate Quantified",            "Overall churn rate of 26.54% identified and benchmarked against industry average of approximately 20%. Statistically confirmed as above-benchmark."],                                               [600,3600,5160], false),
          dRow(["02", "Revenue at Risk Measured",         "$139,131 in monthly recurring revenue at risk identified and mapped to specific customer segments. $2.86M in cumulative historical revenue loss quantified."],                                      [600,3600,5160], true),
          dRow(["03", "High-Risk Segments Identified",    "Five high-priority risk segments identified: M2M contracts (42.71%), new customers 0–12m (47.68%), electronic check users (45.29%), fiber optic (41.89%), senior citizens (41.68%)."],             [600,3600,5160], false),
          dRow(["04", "Statistical Validation Complete",  "Chi-square test confirmed contract type as significant churn predictor (p < 0.001). t-test confirmed tenure difference (p < 0.001). Logistic regression identified 5 significant predictors."],   [600,3600,5160], true),
          dRow(["05", "Power BI Dashboard Delivered",     "Four-page executive Power BI dashboard built with custom DAX measures, dark theme, KPI cards, and interactive slicers. Ready for presentation to C-suite."],                                        [600,3600,5160], false),
          dRow(["06", "Streamlit App Deployed",           "Live interactive analytics application deployed on Render. Accessible via browser with real-time filter interaction, dynamic KPIs, and AI insight panel."],                                         [600,3600,5160], true),
          dRow(["07", "Business Recommendations Prepared","Five prioritised retention recommendations with estimated revenue impact ranging from $5K to $38K per month per initiative. Structured in consulting report format."],                              [600,3600,5160], false),
          dRow(["08", "GitHub Portfolio Published",       "Professional repository with README, badges, architecture diagram, installation guide, results section, and ATS-optimised project description."],                                                   [600,3600,5160], true),
          dRow(["09", "End-to-End Pipeline Documented",   "Full 10-stage analytics pipeline from raw CSV to deployed web application documented and reproducible. All code version-controlled on GitHub."],                                                   [600,3600,5160], false),
          dRow(["10", "Resume Bullets Prepared",          "Role-specific ATS-optimised resume bullets prepared for Data Analyst, BI Analyst, Analytics Engineer, and Product Analyst job applications at MNC companies."],                                    [600,3600,5160], true),
        ],
      }),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 17 — CONCLUSION
      // ══════════════════════════════════════════════════
      h1("15  Conclusion"),

      body("RetailPulse 360 demonstrates a complete, reproducible, enterprise-grade analytics workflow applied to a real-world business problem. The project begins with raw customer data and delivers, at its conclusion, a live-deployed interactive analytics platform, four-page executive Power BI dashboard, statistically validated business insights, and a prioritised consulting-style recommendation framework — the exact set of deliverables expected from a junior-to-mid analytics engagement at organisations such as Deloitte, PwC, EY, Accenture, Infosys, or Amazon."),

      sp(60),
      body("The analytical findings are grounded in data: a 26.54% churn rate that is statistically above industry benchmark, a $139,131 monthly revenue exposure that is mapped at the segment level, and five specific interventions with quantified revenue protection estimates. Every key finding has been statistically validated using R — ensuring that the recommendations reflect genuine business signals rather than coincidental data patterns."),

      sp(60),
      body("The technical execution spans five analytical layers — Python data engineering, SQL business analysis, R statistical modelling, Power BI executive reporting, and Streamlit interactive deployment — demonstrating the full analytics technology stack expected in modern business intelligence and data analyst roles. The end-to-end reproducibility of the pipeline, documented in GitHub with full version control, reflects professional-grade project management practices."),

      sp(60),
      body("For a fresher or early-career analyst, this project demonstrates the ability to independently scope a business problem, design and execute an analytical solution, validate findings with statistical rigour, communicate results to executive audiences, and deliver a live product — all within a single portfolio project. These are precisely the capabilities that differentiate candidates in competitive graduate and early-career hiring processes at top-tier organisations."),

      sp(60),
      callout(
        "Project Significance",
        "RetailPulse 360 is not a student exercise. It is a simulation of the exact work performed by analytics consultants and business intelligence teams at enterprise organisations when tasked with reducing customer churn and protecting recurring revenue. The methodology, tooling, and output quality are directly transferable to production analytics environments.",
        C.light, C.primary
      ),

      pb(),

      // ══════════════════════════════════════════════════
      // SECTION 18 — GITHUB
      // ══════════════════════════════════════════════════
      h1("16  GitHub & Portfolio Links"),

      body("The complete project is available for review via the following links:"),
      sp(80),

      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 6960],
        rows: [
          hRow(["Resource", "Link"], [2400, 6960]),
          dRow(["GitHub Repository",    "[ INSERT GITHUB REPOSITORY LINK HERE ]"],     [2400, 6960], false),
          dRow(["Live Streamlit App",   "[ INSERT RENDER DEPLOYMENT LINK HERE ]"],      [2400, 6960], true),
          dRow(["Portfolio Website",    "[ INSERT PORTFOLIO WEBSITE LINK HERE ]"],      [2400, 6960], false),
          dRow(["LinkedIn Profile",     "[ INSERT LINKEDIN PROFILE URL HERE ]"],        [2400, 6960], true),
          dRow(["Power BI Dashboard",   "[ INSERT POWER BI PUBLISHED LINK IF AVAILABLE ]"], [2400, 6960], false),
          dRow(["Email Contact",        "[ INSERT EMAIL ADDRESS HERE ]"],               [2400, 6960], true),
        ],
      }),

      sp(80),
      h2("How to Run the Project Locally"),
      bullet("Clone the repository: git clone https://github.com/[your-username]/Customer-churn-analysis-end-to-end.git"),
      bullet("Navigate to the project directory: cd Customer-churn-analysis-end-to-end"),
      bullet("Create a virtual environment: python -m venv venv  |  source venv/bin/activate"),
      bullet("Install dependencies: pip install -r deployment/requirements.txt"),
      bullet("Run the Streamlit app: streamlit run deployment/app.py"),
      bullet("Open your browser at: http://localhost:8501"),

      sp(80),
      hr(),
      sp(80),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "RetailPulse 360", bold: true, size: 22, color: C.primary, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "Customer Churn Intelligence Platform", size: 20, color: C.muted, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: "Prepared by Shaik Kashida  |  Data Analytics Portfolio  |  May 2026", size: 18, color: C.muted, font: "Calibri" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text: "Python  ·  SQL  ·  R  ·  Power BI  ·  Streamlit  ·  GitHub", size: 18, color: C.accent, font: "Calibri" })],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("./reports/Customer_Churn_Report.docx", buf);
  console.log("Done — Customer_Churn_Report.docx written");
});