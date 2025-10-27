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

<img width="1903" height="873" alt="Screenshot 2025-10-27 214128" src="https://github.com/user-attachments/assets/fe76caa1-97c4-47ce-b857-1c08b6994cc5" />

<img width="1871" height="862" alt="Screenshot 2025-10-27 214154" src="https://github.com/user-attachments/assets/c32c9616-1940-4e23-8b96-cdf303a1543e" />

<img width="1898" height="856" alt="Screenshot 2025-10-27 214217" src="https://github.com/user-attachments/assets/345f6e8a-ecec-4422-890f-d694ea8354dc" />

<img width="1718" height="733" alt="Screenshot 2025-10-27 214240" src="https://github.com/user-attachments/assets/9f5fa6d2-28ac-4b62-bbb2-65d8630c6abf" />

<img width="1857" height="862" alt="Screenshot 2025-10-27 214315" src="https://github.com/user-attachments/assets/f2baaed8-3071-4a58-a8be-0df08a85b31b" />

<img width="1845" height="861" alt="Screenshot 2025-10-27 214338" src="https://github.com/user-attachments/assets/8ab2208f-6b08-4477-9657-f94f3f8ae722" />

<img width="1822" height="853" alt="Screenshot 2025-10-27 214400" src="https://github.com/user-attachments/assets/d5e2cb4a-6846-4494-94f1-fd5f5dec67ba" />

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

***

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

***
