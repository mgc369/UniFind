
# UniFind - University Guidance Platform

UniFind is an AI-powered web application designed to help students navigate university selection, career paths, and academic planning. The platform offers personalized recommendations, GPA calculations, and direct chat with an AI advisor.

Link to Product Hunt to [support us](https://www.producthunt.com/posts/unifind?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-unifind)

## Features

- 🎓 University Recommendations based on profile
- 💼 Career Path Analysis with skill requirements
- 📊 GPA Calculator with multiple grading systems
- 🤖 AI Chat Advisor for academic support
- 🔐 Firebase Authentication
- 🌐 Responsive Web Design
- 📚 Integrated with Google Gemini AI and Custom Search

## Installation

### Prerequisites
- Python 3.8+
- Node.js (for Firebase tools)
- Google account (for API keys)
- Firebase project

### Steps
1. Clone repository:
```bash
git clone https://github.com/mgc369/UniFind.git
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Set up Firebase:
- Create project at [Firebase Console](https://console.firebase.google.com/)
- Generate service account key (`servicekey.json`) and place in project root
- Enable Authentication and Firestore

4. Get API keys:
- [Google Gemini API Key](https://ai.google.dev/)
- [Google Custom Search API Key](https://developers.google.com/custom-search/v1/overview)
- [Google CSE ID](https://programmablesearchengine.google.com/)

## Configuration

Create `.env` file in root directory:
```env
GEMINI_API_KEY=your_gemini_api_key
IMAGE_API_KEY=your_image_api_key
FIREBASE_CONFIG={"apiKey": "...", "authDomain": "...", "projectId": "...", ...}
```

## Running the Application

```bash
python app.py
```
App will run on `http://localhost:10000`

## Project Structure
```
Directory structure:
└── mgc369-unifind/
    ├── README.md
    ├── ProcFile
    ├── app.py
    ├── data.html
    ├── dbrules.json
    ├── firebase.json
    ├── package.json
    ├── requirements.txt
    ├── .firebaserc
    ├── images/
    │   └── DALL·E 2025-01-18 12.43.48 - A minimalist favicon.webp
    ├── static/
    │   ├── scripts/
    │   │   ├── advisor.js
    │   │   ├── career_advisor.js
    │   │   ├── gpa_calculator.js
    │   │   ├── index.js
    │   │   ├── login.js
    │   │   ├── mainpage.js
    │   │   ├── navigation.js
    │   │   ├── quiz.js
    │   │   ├── register.js
    │   │   └── specialty.js
    │   └── styles/
    │       ├── advisor.css
    │       ├── career_advisor.css
    │       ├── career_path.css
    │       ├── gpa_calculator.css
    │       ├── index.css
    │       ├── login.css
    │       ├── mainpage.css
    │       ├── quiz.css
    │       ├── register.css
    │       └── specialty.css
    └── templates/
        ├── 404.html
        ├── 500.html
        ├── advisor.html
        ├── career_advisor.html
        ├── career_path.html
        ├── gpa_calculator.html
        ├── index.html
        ├── login.html
        ├── mainpage.html
        ├── quiz.html
        ├── register.html
        ├── specialty.html
        ├── user.html
        └── partials/
            ├── firebaseconfig.html
            └── navigation.html

```

## Technologies Used
- **Backend**: Python Flask, Firebase Admin SDK
- **AI**: Google Gemini API
- **Search**: Google Custom Search JSON API
- **Auth**: Firebase Authentication
- **Database**: Firestore
- **Frontend**: Tailwind CSS, Vanilla JS
- **Deployment**: Heroku (via Procfile)

## Contributing
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## License
MIT License

## Troubleshooting
- **Missing API Keys**: Ensure all keys are set in `.env`
- **Firebase Errors**: Verify service account key and Firestore rules
- **Module Not Found**: Run `pip install -r requirements.txt`
- **CORS Issues**: Check Firebase auth domain whitelisting

---

**Note**: This application is for educational purposes. Always verify university information from official sources.
