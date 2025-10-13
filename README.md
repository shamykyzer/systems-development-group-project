# 🥐 SDGP – Bakery Sales Prediction System

Welcome to the official repository for **Bristol-Pink's Bakery Sales Prediction Dashboard** — a standalone AI-powered system designed to help reduce food waste and optimize daily inventory across five bakery cafés.

## Project Overview

Bristol-Pink is a growing bakery chain serving families near school academies and nearby office workers. To minimize food waste and improve operational efficiency, this system uses machine learning algorithms to forecast daily sales of key products.

The dashboard provides interactive visualizations of historical sales data and predictive analytics to guide purchasing decisions for the next four weeks.

## Objectives

- Analyze historical sales data of top-selling items.
- Predict future sales using AI/ML models.
- Minimize food waste and financial loss.
- Provide flexible, user-driven data exploration.

## Features

- **CSV Data Ingestion**: Upload and process sales data in CSV format.
- **Top Sellers Analysis**:
  - Identify top 3 selling foods and coffees.
  - Visualize their sales fluctuations over the past 4 weeks.
- **Sales Prediction**:
  - Apply AI/ML algorithms to forecast sales for the next 4 weeks.
  - Display predictions in separate, item-specific graphs.
- **Zoom & Focus**:
  - Select a custom date range to zoom into detailed predictions.
- **Training Period Control**:
  - Choose training data length (4–8 weeks).
  - Compare prediction accuracy across different training windows.
  - View results in both tabular and graphical formats.
- **Model Evaluation**:
  - Optional dashboard view to assess algorithm performance and accuracy.

## Technologies Used

- Python (Pandas, NumPy, Scikit-learn, TensorFlow/PyTorch)
- Dash or Streamlit for interactive dashboard
- Matplotlib / Plotly for visualizations
- CSV file handling and preprocessing

## Folder Structure

```
├── data/                  # Sample and user-uploaded CSV files
├── models/                # Trained ML models and evaluation scripts
├── dashboard/             # UI components and visualization logic
├── utils/                 # Helper functions for data processing
├── README.md              # Project documentation
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/bakery-sales-predictor.git
   cd bakery-sales-predictor
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Launch the dashboard:
   ```bash
   streamlit run dashboard/app.py
   ```

4. Upload your CSV file and start exploring!

## Sample Visuals

-  Historical sales trends
-  Predicted sales per item
-  Accuracy comparison across models
-  Zoomed-in views for selected date ranges

## Model Evaluation

The dashboard includes an optional tab to compare the performance of different algorithms (e.g., Linear Regression, Random Forest, LSTM). Metrics such as MAE, RMSE, and R² are displayed to help users choose the most reliable model.

## Future Enhancements

- Real-time data integration
- Automated retraining pipeline
- Inventory optimization recommendations
- Mobile-friendly dashboard
