# Mentella - AI Video Medical Assistant

An AI-powered medical assistant that provides pre-assessments, mental therapy sessions, and persona generation using AI avatars and conversational AI.

## 🌟 Features

- **AI Video Avatar**: Interactive video avatar using LiveAvatar for human-like conversations
- **Pre-Assessment**: Comprehensive health questionnaire with AI-powered recommendations
- **Mental Therapy**: Real-time therapy sessions with empathetic AI responses
- **Persona Generation**: AI-generated user profiles using Gemini AI for better care
- **Session Tracking**: Complete conversation history and insights

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- MongoDB (local or Atlas)
- Gemini AI API Key ([Get one here](https://makersuite.google.com/app/apikey))
- LiveAvatar API Key ([Documentation](https://docs.liveavatar.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mentella
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local` and fill in your API keys:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/mentella
   GEMINI_API_KEY=your_gemini_api_key_here
   LIVEAVATAR_API_KEY=your_liveavatar_api_key_here
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Run the development server**
   ```bash
   bun dev
   # or
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
mentella/
├── app/
│   ├── api/              # API routes
│   │   ├── users/        # User management
│   │   ├── assessments/  # Pre-assessment endpoints
│   │   ├── therapy/      # Therapy session endpoints
│   │   ├── persona/      # Persona generation
│   │   └── avatar/       # LiveAvatar integration
│   ├── assessment/       # Assessment page
│   ├── therapy/          # Therapy session page
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── AvatarPlayer.tsx  # Video avatar component
│   ├── AssessmentForm.tsx
│   └── TherapyChat.tsx
├── lib/
│   ├── mongodb.ts        # Database connection
│   └── services/
│       ├── gemini.ts     # Gemini AI service
│       └── liveAvatar.ts # LiveAvatar service
└── models/               # Mongoose models
    ├── User.ts
    ├── Assessment.ts
    └── TherapySession.ts
```

## 🔑 API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users?email=` - Get user by email

### Assessments
- `POST /api/assessments` - Submit assessment
- `GET /api/assessments?userId=` - Get user assessments

### Therapy Sessions
- `POST /api/sessions` - Start new session
- `GET /api/sessions?userId=` - Get user sessions
- `POST /api/sessions/[id]/messages` - Send message
- `POST /api/sessions/[id]/end` - End session

### Persona
- `POST /api/persona` - Generate user persona
- `GET /api/persona?userId=` - Get user persona

### Avatar
- `POST /api/avatar/session` - Create avatar session
- `POST /api/avatar/speak` - Make avatar speak

## 🛠️ Technologies

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini AI
- **Avatar**: LiveAvatar API
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Runtime**: Bun / Node.js

## 🎯 User Flow

1. **Landing** → User visits home page
2. **Sign Up** → User provides basic information
3. **Assessment** → Complete 10-question health assessment
4. **Recommendations** → AI generates personalized recommendations
5. **Persona Generation** → AI creates comprehensive user profile
6. **Therapy Session** → User talks with AI avatar
7. **Session Complete** → Insights generated and saved

## 🔒 Environment Variables

Required environment variables:

```env
MONGODB_URI=          # MongoDB connection string
GEMINI_API_KEY=       # Google Gemini AI API key
LIVEAVATAR_API_KEY=   # LiveAvatar API key
```

## 📝 Development Notes

- The LiveAvatar WebRTC implementation is simplified in the current version
- For production, implement full WebRTC signaling based on LiveAvatar docs
- User authentication should be added before production deployment
- Consider adding rate limiting for API endpoints
- Implement proper error boundaries and fallbacks

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure your platform supports:
- Node.js 18+
- MongoDB connectivity
- Environment variables

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues or questions, please open a GitHub issue.

---

Built with ❤️ for better mental health and medical care

