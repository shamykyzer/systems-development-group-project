from prophet import Prophet
import pandas as pd
import matplotlib.pyplot as plt
import os

# Load the CSV data
csv_path = os.path.join("CSV_Files", "Pink CoffeeSales March - Oct 2025.csv")
df = pd.read_csv(csv_path)

print("Data loaded successfully!")
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print("\nFirst few rows:")
print(df.head())

# Parse dates (format is DD/MM/YYYY)
df["Date"] = pd.to_datetime(df["Date"], format="%d/%m/%Y")

# Output directory
output_dir = r"/app/output"
if not os.path.exists(output_dir):
    output_dir = r"C:\Users\olive\OneDrive\Documentos"

# Forecast Cappuccino sales
print("\n" + "=" * 50)
print("FORECASTING CAPPUCCINO SALES")
print("=" * 50)

df_cappuccino = df[["Date", "Cappuccino"]].copy()
df_cappuccino.columns = ["ds", "y"]

# Add floor constraint to prevent unrealistic low predictions
df_cappuccino["floor"] = df_cappuccino["y"].min() * 0.5  # Floor at 50% of minimum

model_cappuccino = Prophet(
    growth="linear",
    daily_seasonality=False,  # Turn off daily - not enough daily variation
    weekly_seasonality=True,
    yearly_seasonality=True,
    seasonality_mode="multiplicative",  # Better for sales data
    changepoint_prior_scale=0.05,  # Lower = smoother trend, less volatile
    seasonality_prior_scale=10.0,  # Standard seasonality strength
)
model_cappuccino.fit(df_cappuccino)

# Forecast 365 days (1 year) into the future
future_cappuccino = model_cappuccino.make_future_dataframe(periods=365, freq="D")
future_cappuccino["floor"] = df_cappuccino["floor"].iloc[0]  # Apply floor to forecast
forecast_cappuccino = model_cappuccino.predict(future_cappuccino)

print("\nCappuccino Forecast (next 7 days):")
print(forecast_cappuccino[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(7))

# Plot and save
fig1 = model_cappuccino.plot(forecast_cappuccino)
plt.title("Cappuccino Sales Forecast")
fig1.savefig(
    os.path.join(output_dir, "cappuccino_forecast.png"), dpi=300, bbox_inches="tight"
)
print(f"\n✓ Saved: {os.path.join(output_dir, 'cappuccino_forecast.png')}")

fig2 = model_cappuccino.plot_components(forecast_cappuccino)
fig2.savefig(
    os.path.join(output_dir, "cappuccino_components.png"), dpi=300, bbox_inches="tight"
)
print(f"✓ Saved: {os.path.join(output_dir, 'cappuccino_components.png')}")

# Forecast Americano sales
print("\n" + "=" * 50)
print("FORECASTING AMERICANO SALES")
print("=" * 50)

df_americano = df[["Date", "Americano"]].copy()
df_americano.columns = ["ds", "y"]

# Add floor and cap constraints
df_americano["floor"] = df_americano["y"].quantile(0.25)  # 25th percentile as floor
df_americano["cap"] = (
    df_americano["y"].quantile(0.95) * 1.5
)  # Cap at 150% of 95th percentile

model_americano = Prophet(
    growth="linear",
    daily_seasonality=False,
    weekly_seasonality=False,  # Disable weekly to reduce volatility
    yearly_seasonality=True,
    seasonality_mode="additive",  # Changed to additive for more stability
    changepoint_prior_scale=0.01,  # Very low - prioritize smooth trend
    seasonality_prior_scale=5.0,  # Lower seasonality strength
)

# Add custom monthly seasonality instead of weekly
model_americano.add_seasonality(name="monthly", period=30.5, fourier_order=3)

model_americano.fit(df_americano)

future_americano = model_americano.make_future_dataframe(periods=365, freq="D")
future_americano["floor"] = df_americano["floor"].iloc[0]
future_americano["cap"] = df_americano["cap"].iloc[0]
forecast_americano = model_americano.predict(future_americano)

print("\nAmericano Forecast (next 7 days):")
print(forecast_americano[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(7))

# Plot and save
fig3 = model_americano.plot(forecast_americano)
plt.title("Americano Sales Forecast")
fig3.savefig(
    os.path.join(output_dir, "americano_forecast.png"), dpi=300, bbox_inches="tight"
)
print(f"\n✓ Saved: {os.path.join(output_dir, 'americano_forecast.png')}")

fig4 = model_americano.plot_components(forecast_americano)
fig4.savefig(
    os.path.join(output_dir, "americano_components.png"), dpi=300, bbox_inches="tight"
)
print(f"✓ Saved: {os.path.join(output_dir, 'americano_components.png')}")

# Combined comparison plot
print("\n" + "=" * 50)
print("CREATING COMPARISON PLOT")
print("=" * 50)

fig5, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))

# Cappuccino
ax1.plot(df_cappuccino["ds"], df_cappuccino["y"], "k.", label="Actual")
ax1.plot(forecast_cappuccino["ds"], forecast_cappuccino["yhat"], "b-", label="Forecast")
ax1.fill_between(
    forecast_cappuccino["ds"],
    forecast_cappuccino["yhat_lower"],
    forecast_cappuccino["yhat_upper"],
    alpha=0.3,
    color="blue",
)
ax1.set_title("Cappuccino Sales Forecast", fontsize=14, fontweight="bold")
ax1.set_xlabel("Date")
ax1.set_ylabel("Units Sold")
ax1.legend()
ax1.grid(True, alpha=0.3)

# Americano
ax2.plot(df_americano["ds"], df_americano["y"], "k.", label="Actual")
ax2.plot(forecast_americano["ds"], forecast_americano["yhat"], "r-", label="Forecast")
ax2.fill_between(
    forecast_americano["ds"],
    forecast_americano["yhat_lower"],
    forecast_americano["yhat_upper"],
    alpha=0.3,
    color="red",
)
ax2.set_title("Americano Sales Forecast", fontsize=14, fontweight="bold")
ax2.set_xlabel("Date")
ax2.set_ylabel("Units Sold")
ax2.legend()
ax2.grid(True, alpha=0.3)

plt.tight_layout()
fig5.savefig(
    os.path.join(output_dir, "combined_forecast.png"), dpi=300, bbox_inches="tight"
)
print(f"✓ Saved: {os.path.join(output_dir, 'combined_forecast.png')}")

print("\n" + "=" * 50)
print("FORECAST COMPLETE!")
print("=" * 50)
print(f"\nAll figures saved to: {output_dir}")
print("\nGenerated files:")
print("  - cappuccino_forecast.png")
print("  - cappuccino_components.png")
print("  - americano_forecast.png")
print("  - americano_components.png")
print("  - combined_forecast.png")
