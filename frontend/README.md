# MBANZA BET - Mobile Sportsbook App

Premium dark-themed (black/gold/white) wallet-based mobile sportsbook application.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54, Expo Router)
- **Backend**: Python FastAPI + MongoDB
- **State Management**: Zustand
- **Sports**: Soccer, Rugby, Boxing, Cricket, MMA

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Yarn
- Python 3.11+
- MongoDB running locally
- Expo Go app on your phone (for mobile testing)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your MongoDB URL
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
cp .env.example .env  # Edit with your backend URL
npx expo start
```

Scan the QR code with Expo Go to test on your phone.

## Building Android APK & AAB

See [BUILD_GUIDE.md](./BUILD_GUIDE.md) for complete instructions.

**Quick version:**
1. Push to GitHub
2. Go to Actions tab -> "Build Android APK & AAB"
3. Click "Run workflow"
4. Download artifacts when complete (~15-20 min)

## Project Structure
```
frontend/
  app/              # Screen routes (Expo Router file-based routing)
    (auth)/         # Login, Register screens
    (tabs)/         # Main tab navigation (Home, Sports, Live, Wallet, Profile)
    event/[id].tsx  # Event detail
    betslip.tsx     # Bet slip modal
    deposit.tsx     # Deposit screen
    withdraw.tsx    # Withdrawal screen
    kyc.tsx         # KYC verification
    ...
  src/
    components/     # Reusable UI components
    constants/      # Theme colors, config
    services/       # API client
    store/          # Zustand state management
    types/          # TypeScript types
  .github/
    workflows/      # GitHub Actions CI/CD
  assets/           # Images, fonts

backend/
  server.py         # FastAPI app (auth, wallet, betting, sports)
  requirements.txt  # Python dependencies
  .env              # Environment config
```

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/wallet/balance` | GET | Get wallet balance |
| `/api/wallet/deposit` | POST | Deposit funds |
| `/api/wallet/withdraw` | POST | Request withdrawal |
| `/api/sports` | GET | List all sports |
| `/api/sports/fixtures` | GET | Get fixtures |
| `/api/sports/live` | GET | Live fixtures |
| `/api/bets/place` | POST | Place a bet |
| `/api/bets/open` | GET | Open bets |
| `/api/bets/settled` | GET | Settled bets |
| `/api/kyc/upload` | POST | Upload KYC document |
| `/api/promotions` | GET | Get promotions |

## Test Credentials
- **Admin**: admin@mbanza.bet / MbanzaAdmin2024!
- **User**: test@mbanza.bet / Test1234!

## License
Proprietary - MBANZA BET
