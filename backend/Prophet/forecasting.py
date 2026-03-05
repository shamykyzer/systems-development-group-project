"""
Prophet forecasting implementation for Pink Cafe.
Renamed from prophet.py to avoid naming conflict with the Prophet library.
"""

import pandas as pd
import logging
from prophet import Prophet  # This now imports the library correctly
from prophet_settings import get_active_preset, get_preset

# Suppress Prophet's verbose output
logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)


class ForecastError(ValueError):
    """Raised when a forecast cannot be produced."""
    pass


def load_csv_with_dates(csv_path: str, date_column: str = 'Date') -> pd.DataFrame:
    """
    Load a CSV file and convert the date column from dd/mm/yyyy to datetime.
    
    Args:
        csv_path: Path to the CSV file
        date_column: Name of the date column (default: 'Date')
    
    Returns:
        DataFrame with dates properly converted to datetime
    
    Example:
        df = load_csv_with_dates('./CSV_Files/Pink CoffeeSales March - Oct 2025.csv')
    """
    df = pd.read_csv(csv_path)
    # Convert dates from dd/mm/yyyy format to datetime
    df[date_column] = pd.to_datetime(df[date_column], format='%d/%m/%Y')
    return df


def run_forecast(conn, dataset_id, item_id, algorithm, train_weeks, horizon_weeks=4):
    """
    Entry point called by routes.py to generate a forecast.
    
    Returns a dict ready to be JSON-serialized with forecast data.
    """
    if algorithm != "prophet":
        raise ForecastError(f"Algorithm '{algorithm}' not supported (use 'prophet')")
    
    if not (4 <= train_weeks <= 52):
        raise ForecastError("train_weeks must be between 4 and 52")
    
    if not (1 <= horizon_weeks <= 52):
        raise ForecastError("horizon_weeks must be between 1 and 52")
    
    # Fetch historical sales data from database
    query = """
        SELECT date, quantity
        FROM sales
        WHERE dataset_id = ? AND item_id = ?
        ORDER BY date
    """
    rows = conn.execute(query, (dataset_id, item_id)).fetchall()
    
    if not rows:
        raise ForecastError(f"No sales data found for dataset_id={dataset_id}, item_id={item_id}")
    
    # Convert to DataFrame in Prophet format (ds = date, y = value)
    history = pd.DataFrame([
        {"ds": pd.to_datetime(row["date"]), "y": float(row["quantity"])}
        for row in rows
    ])
    
    # Filter to last N weeks for training
    cutoff_date = history["ds"].max() - pd.Timedelta(weeks=train_weeks)
    history = history[history["ds"] >= cutoff_date].copy()
    
    if len(history) < 7:
        raise ForecastError(f"Insufficient data: only {len(history)} days available for training")
    
    # Run Prophet forecast
    horizon_days = horizon_weeks * 7
    forecast_df = _prophet_forecast(history, horizon_days, conn)
    
    # Convert to JSON-serializable format
    forecast_df["date"] = forecast_df["date"].astype(str)
    
    return {
        "success": True,
        "algorithm": "prophet",
        "train_weeks": train_weeks,
        "horizon_weeks": horizon_weeks,
        "forecast": forecast_df.to_dict(orient="records")
    }


def _prophet_forecast(history: pd.DataFrame, horizon_days: int, conn) -> pd.DataFrame:
    """
    Run Prophet forecast using settings from the database.
    
    Args:
        history: DataFrame with columns 'ds' (datetime) and 'y' (float)
        horizon_days: Number of days to forecast into the future
        conn: Database connection (required)
    
    Returns:
        DataFrame with columns: date, yhat, yhat_lower, yhat_upper
    """
    # Load active preset settings from database using prophet_settings functions
    active_name = get_active_preset(conn)
    cfg = get_preset(conn, active_name)
    
    # Build model with DB settings
    m = Prophet(
        growth=cfg["growth"],
        changepoint_prior_scale=cfg["changepoint_prior_scale"],
        seasonality_prior_scale=cfg["seasonality_prior_scale"],
        seasonality_mode=cfg["seasonality_mode"],
        yearly_seasonality=bool(cfg["yearly_seasonality"]),
        weekly_seasonality=bool(cfg["weekly_seasonality"]),
        daily_seasonality=bool(cfg["daily_seasonality"]),
        n_changepoints=cfg["n_changepoints"],
        changepoint_range=cfg["changepoint_range"],
        interval_width=cfg["interval_width"],
        holidays_prior_scale=cfg["holidays_prior_scale"]
    )
    
    # Handle logistic growth
    if cfg["growth"] == "logistic":
        history = history.copy()
        history["floor"] = cfg["floor_multiplier"] * history["y"].min()
        history["cap"] = cfg["cap_multiplier"] * history["y"].max()
    
    # Add custom seasonality if enabled
    if cfg["custom_seasonality_enabled"] and cfg.get("custom_seasonality_name"):
        m.add_seasonality(
            name=cfg["custom_seasonality_name"],
            period=cfg["custom_seasonality_period"],
            fourier_order=cfg["custom_seasonality_fourier_order"]
        )
    
    # Fit and predict
    m.fit(history)
    future = m.make_future_dataframe(periods=horizon_days, include_history=False)
    
    if cfg["growth"] == "logistic":
        future["floor"] = cfg["floor_multiplier"] * history["y"].min()
        future["cap"] = cfg["cap_multiplier"] * history["y"].max()
    
    forecast = m.predict(future)
    
    # Clamp predictions to non-negative values (sales can't be negative)
    forecast["yhat"] = forecast["yhat"].clip(lower=0)
    forecast["yhat_lower"] = forecast["yhat_lower"].clip(lower=0)
    forecast["yhat_upper"] = forecast["yhat_upper"].clip(lower=0)
    
    # Return required 4 columns
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].rename(
        columns={"ds": "date"}
    )

