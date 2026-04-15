# MBANZA BET — Backend API

Standalone FastAPI backend with MongoDB for the MBANZA BET sportsbook.

## Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt

# Copy and edit environment file
cp .env.example .env

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

## Requirements
- Python 3.11+
- MongoDB 6.0+
- Dependencies listed in requirements.txt

## Features
- JWT Authentication (register, login, profile)
- Wallet System (deposit, withdraw, balance, transactions)
- Sports & Fixtures (5 sports with seed data)
- Betting Engine (single & accumulator bets)
- KYC Document Upload
- Notifications System
- Promotions

## Auto-Seed
On startup, the server automatically seeds:
- Admin user (admin@mbanza.bet)
- Test user (test@mbanza.bet)
- 33 fixtures across Soccer, Rugby, Boxing, Cricket, MMA
- 4 promotions
- Sample transactions and notifications
