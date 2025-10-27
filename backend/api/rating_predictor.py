import datetime
import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

def logistic(t, L, k, t0):
    """Logistic growth curve function"""
    return L / (1 + np.exp(-k * (t - t0)))

class RatingPredictor:
    def __init__(self):
        self.params = None
        self.is_trained = False
        self.t_min = None
        self.t_max = None
        self.max_rating_ceiling = 2700  # Set an appropriate upper limit for ratings

    def train(self, rating_points):
        if len(rating_points) < 5:
            raise ValueError("Not enough points to train model")

        df = pd.DataFrame(rating_points, columns=['year', 'month', 'day', 'rating'])
        df['month'] = df['month'] + 1  # Fix 0-based month
        df['date'] = df.apply(lambda r: datetime.datetime(r['year'], r['month'], r['day']), axis=1)
        df = df.sort_values('date').reset_index(drop=True)

        df['time_months'] = (df['date'] - df['date'].min()).dt.days / 30.0

        t = df['time_months'].values
        y = df['rating'].values

        max_rating = max(y)
        min_time, max_time = t.min(), t.max()

        # Store min/max training time for future predictions
        self.t_min = min_time
        self.t_max = max_time

        # Initial guess, bounds for parameters
        p0 = [min(max_rating + 100, self.max_rating_ceiling), 0.1, np.median(t)]
        bounds = ([max_rating, 0.0001, min_time], [self.max_rating_ceiling, 1.0, max_time])

        self.params, _ = curve_fit(logistic, t, y, p0=p0, bounds=bounds, maxfev=10000)
        self.is_trained = True

    def predict_next_n(self, n_months=60):
        if not self.is_trained:
            raise Exception("Model is not trained yet.")
        L, k, t0 = self.params

        # Generate future months after last training data
        t_future = np.linspace(self.t_max + 1, self.t_max + n_months, n_months)

        predictions = logistic(t_future, L, k, t0)
        # Clip predictions at maximum rating ceiling
        predictions = np.minimum(predictions, self.max_rating_ceiling)
        return predictions.tolist()
