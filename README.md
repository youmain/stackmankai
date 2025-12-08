# Stackmankai - Poker Stack Manager

A comprehensive poker game management application with AI-powered features using DeepSeek API.

## 🎯 Features

### Core Functionality
- **Game Management**: Create and manage poker games with real-time stack tracking
- **Player Management**: Track player statistics, rankings, and performance
- **Daily & Monthly Sales**: Comprehensive sales reporting and analytics
- **Ranking System**: Automatic ranking calculations based on game results
- **Receipt Management**: Track all financial transactions

### AI-Powered Features
- **AI Comment Generation**: Automatically generate insightful comments on posts using DeepSeek API
- **AI Players**: Pre-configured AI player profiles for testing and demonstration

### Technical Features
- **Firebase Integration**: Real-time database with Firestore
- **Firebase Admin SDK**: Server-side operations for secure data management
- **Stripe Integration**: Payment processing for premium features
- **Responsive Design**: Mobile-friendly UI built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **AI Integration**: DeepSeek API (via OpenAI SDK compatibility)
- **Payment**: Stripe

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Firebase project with Firestore enabled
- DeepSeek API key
- Stripe account (for payment features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/youmain/stackmankai.git
cd stackmankai
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
stackmankai/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── games/             # Game management pages
│   ├── players/           # Player management pages
│   ├── rankings/          # Rankings display
│   └── daily-sales/       # Sales reporting
├── components/            # React components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                   # Core business logic
│   ├── firestore.ts      # Firestore operations (87 functions)
│   ├── firebase-admin.ts # Firebase Admin SDK setup
│   └── auth.ts           # Authentication utilities
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🔑 Key Features Implementation

### AI Comment Generation

The application uses DeepSeek API to generate intelligent comments on posts:

```typescript
// app/api/generate-ai-comments/route.ts
const response = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: [
    { role: "system", content: "You are a poker expert..." },
    { role: "user", content: postContent }
  ]
});
```

### Automatic Ranking Updates

Rankings are automatically updated when games end:

```typescript
// lib/firestore.ts
export async function endGameWithFinalStacks(gameId: string, finalStacks: FinalStack[]) {
  // Update game status
  // Calculate profits/losses
  // Update provisional rankings
  await updateProvisionalRankingForToday();
}
```

## 🔒 Security

- Environment variables are excluded from Git via `.gitignore`
- Firebase Admin SDK credentials are server-side only
- API routes are protected with proper authentication
- Sensitive data is never exposed to the client

## 📝 License

This project is private and proprietary.

## 👤 Author

**youmain**

- GitHub: [@youmain](https://github.com/youmain)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [DeepSeek](https://www.deepseek.com/)
- Originally created with [v0.app](https://v0.dev/)
