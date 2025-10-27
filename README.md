# Chess Analytics Dashboard

A powerful web application for analyzing Lichess chess data with AI-powered insights. This project provides rich visualizations and tools to help chess players better understand their playing strength, opening repertoire, and performance trends.

***

## Features

- **User Chess Profile Analysis:** Fetch and display user profile and playing statistics from Lichess.
- **Rating History Visualization:** Interactive charts showing rating progression across different time controls.
- **Opening Repertoire Insights:** Analyze and visualize success rates and games played on individual openings.
- **Rating Prediction:** AI-based prediction of future ratings with monthly forecast charts.
- **Recent Games Summary:** Displays the last 100 games with detailed info (opponent, color, result, variant, time control).
- **Activity Heatmap:** Shows day/time of week when user plays most games.
- **Performance Milestones:** Badges indicating when user crosses key rating thresholds (e.g., 1500, 1800, 2000).
- **Admin Dashboard:** Accessible only by admin users, with user management and site analytics.
- **Premium Features:** Some features gated for premium users with upgrade prompt.

***

## Tech Stack

- **Frontend:** React
- **Backend:** Django
- **APIs:** Lichess

***

## Screenshots




### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jaisonkumar/chess-analytics-dashboard.git
   cd chess-analytics-dashboard
   ```

2. Backend setup:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. Frontend setup (in a separate terminal):

   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

4. Open `http://localhost:5173` (or whichever port is assigned) in your browser.

***

## Usage

- Enter a Lichess username and click **Analyze**.
- Explore user ratings, predictions, openings, recent games, and activity heatmap.
- Log in or register to access premium features and admin dashboard if applicable.

***

## Contributing

Contributions are welcome! Please fork the repo and submit a pull request with improvements or bug fixes.

***

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

***
