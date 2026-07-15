# Deployment Guide — RetailPulse 360

## Option 1: Deploy on Render (Recommended — Free Tier)

### Steps

1. **Push your repo to GitHub**
   ```bash
   git add .
   git commit -m "feat: complete RetailPulse 360 analytics platform"
   git push origin main
   ```

2. **Go to [render.com](https://render.com) → New → Web Service**

3. **Connect your GitHub repo**
   - Search for `Customer-churn-analysis-end-to-end`
   - Click Connect

4. **Configure the service:**
   ```
   Name:            retailpulse-360
   Region:          Singapore (closest to India)
   Branch:          main
   Runtime:         Python 3
   Build Command:   pip install -r deployment/requirements.txt
   Start Command:   streamlit run deployment/app.py --server.port $PORT --server.address 0.0.0.0 --server.headless true
   Instance Type:   Free
   ```

5. **Click Create Web Service** → wait ~3 minutes for build

6. **Your live URL will be:**
   ```
   https://retailpulse-360.onrender.com
   ```

7. **Add the URL to your README and resume.**

---

## Option 2: Run Locally

```bash
# Clone
git clone https://github.com/Shaikkashida/Customer-churn-analysis-end-to-end.git
cd Customer-churn-analysis-end-to-end

# Environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install
pip install -r deployment/requirements.txt

# Run
streamlit run deployment/app.py

# Opens at http://localhost:8501
```

---

## Option 3: GitHub Pages (Static — for README preview only)

The banner SVG and architecture diagrams will auto-render on GitHub.
No additional deployment needed for static docs.

---

## Troubleshooting

**Build fails on Render:**
- Check Python version is 3.11 in requirements
- Ensure `deployment/requirements.txt` path is correct

**App crashes on launch:**
- The app has a fallback synthetic dataset — it will run even without the CSV
- Add your CSV to `data/processed/telco_clean.csv` for real data

**Slow first load:**
- Render free tier spins down after 15 min inactivity
- First request takes ~30s to spin up — normal behavior
