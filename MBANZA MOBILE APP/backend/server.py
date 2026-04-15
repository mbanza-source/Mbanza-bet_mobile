"""
MBANZA BET - Backend API Gateway
=================================
Structured to proxy to existing BetLab backend.
Currently using MongoDB mock data for prototype phase.
All wallet/betting logic will map to BetLab once integrated.
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional
from bson import ObjectId

# Configuration
MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ.get('DB_NAME', 'mbanza_bet')
JWT_SECRET = os.environ.get('JWT_SECRET', 'change_me_in_production')
JWT_ALGORITHM = "HS256"

# MongoDB
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# FastAPI
app = FastAPI(title="MBANZA BET API")
api_router = APIRouter(prefix="/api")
mobile_router = APIRouter(prefix="/api/mobile")  # BetLab mobile API contract

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        del user["_id"]
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== PYDANTIC MODELS ====================

class RegisterRequest(BaseModel):
    email: str
    phone: Optional[str] = None
    username: Optional[str] = None
    name: str
    password: str

class LoginRequest(BaseModel):
    identifier: str  # email, phone, or username
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class DepositRequest(BaseModel):
    amount: float
    method: str = "card"

class WithdrawRequest(BaseModel):
    amount: float
    method: str = "bank_transfer"
    account_details: Optional[str] = None

class PlaceBetRequest(BaseModel):
    selections: List[dict]
    stake: float
    bet_type: str = "single"

class KYCUploadRequest(BaseModel):
    document_type: str
    file_data: str  # base64

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None

# ==================== AUTH ENDPOINTS ====================
# NOTE: These will proxy to BetLab auth once integrated

@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.phone:
        existing_phone = await db.users.find_one({"phone": req.phone})
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")
    if req.username:
        existing_username = await db.users.find_one({"username": req.username.lower()})
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")

    user_doc = {
        "email": req.email.lower(),
        "phone": req.phone,
        "username": req.username.lower() if req.username else None,
        "name": req.name,
        "password_hash": hash_password(req.password),
        "role": "user",
        "kyc_status": "pending",
        "currency": "NAD",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create wallet for user
    await db.wallets.insert_one({
        "user_id": user_id,
        "balance": 0.0,
        "available_balance": 0.0,
        "bonus_balance": 0.0,
        "currency": "NAD",
        "updated_at": datetime.now(timezone.utc),
    })

    token = create_access_token(user_id, req.email.lower())
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": req.email.lower(),
            "phone": req.phone,
            "username": req.username,
            "name": req.name,
            "role": "user",
            "kyc_status": "pending",
            "currency": "NAD",
        }
    }

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    identifier = req.identifier.lower().strip()
    user = await db.users.find_one({
        "$or": [
            {"email": identifier},
            {"phone": identifier},
            {"username": identifier},
        ]
    })
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["email"])
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "phone": user.get("phone"),
            "username": user.get("username"),
            "name": user["name"],
            "role": user["role"],
            "kyc_status": user.get("kyc_status", "pending"),
            "currency": user.get("currency", "NAD"),
        }
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.put("/auth/profile")
async def update_profile(req: ProfileUpdateRequest, request: Request):
    user = await get_current_user(request)
    update_data = {}
    if req.name:
        update_data["name"] = req.name
    if req.phone:
        update_data["phone"] = req.phone
    if req.username:
        update_data["username"] = req.username.lower()
    if update_data:
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_data})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])}, {"password_hash": 0})
    updated["id"] = str(updated["_id"])
    del updated["_id"]
    return updated

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    import secrets
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "user_id": str(user["_id"]),
        "token": token,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False,
    })
    logger.info(f"Password reset token for {req.email}: {token}")
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/logout")
async def logout(request: Request):
    return {"message": "Logged out successfully"}

# ==================== WALLET ENDPOINTS ====================
# NOTE: Will proxy to BetLab wallet once integrated

@api_router.get("/wallet/balance")
async def get_wallet_balance(request: Request):
    user = await get_current_user(request)
    wallet = await db.wallets.find_one({"user_id": user["id"]}, {"_id": 0})
    if not wallet:
        return {"balance": 0.0, "available_balance": 0.0, "bonus_balance": 0.0, "currency": "NAD"}
    return wallet

@api_router.get("/wallet/transactions")
async def get_transactions(request: Request, type: Optional[str] = None, limit: int = 50, skip: int = 0):
    user = await get_current_user(request)
    query = {"user_id": user["id"]}
    if type and type != "all":
        query["type"] = type
    txns = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return txns

@api_router.post("/wallet/deposit")
async def initiate_deposit(req: DepositRequest, request: Request):
    user = await get_current_user(request)
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if req.amount < 10:
        raise HTTPException(status_code=400, detail="Minimum deposit is NAD 10")

    txn_id = str(uuid.uuid4())
    # For prototype: auto-complete deposit. In production: create pending, redirect to payment provider
    wallet = await db.wallets.find_one({"user_id": user["id"]})
    new_balance = (wallet["balance"] if wallet else 0) + req.amount

    await db.wallets.update_one(
        {"user_id": user["id"]},
        {"$set": {"balance": new_balance, "available_balance": new_balance, "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    await db.transactions.insert_one({
        "id": txn_id,
        "user_id": user["id"],
        "type": "deposit",
        "amount": req.amount,
        "balance_after": new_balance,
        "status": "completed",
        "method": req.method,
        "reference": f"DEP-{txn_id[:8].upper()}",
        "description": f"Deposit via {req.method.replace('_', ' ').title()}",
        "created_at": datetime.now(timezone.utc),
    })

    # Create notification
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": "Deposit Successful",
        "message": f"NAD {req.amount:.2f} has been added to your wallet",
        "type": "deposit",
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

    return {"id": txn_id, "amount": req.amount, "balance": new_balance, "status": "completed"}

@api_router.post("/wallet/withdraw")
async def request_withdrawal(req: WithdrawRequest, request: Request):
    user = await get_current_user(request)
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if req.amount < 50:
        raise HTTPException(status_code=400, detail="Minimum withdrawal is NAD 50")

    wallet = await db.wallets.find_one({"user_id": user["id"]})
    if not wallet or wallet["available_balance"] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Check KYC for withdrawals
    if user.get("kyc_status") != "approved":
        raise HTTPException(status_code=400, detail="KYC verification required for withdrawals")

    txn_id = str(uuid.uuid4())
    new_balance = wallet["balance"] - req.amount

    await db.wallets.update_one(
        {"user_id": user["id"]},
        {"$set": {"balance": new_balance, "available_balance": new_balance, "updated_at": datetime.now(timezone.utc)}},
    )
    await db.transactions.insert_one({
        "id": txn_id,
        "user_id": user["id"],
        "type": "withdrawal",
        "amount": -req.amount,
        "balance_after": new_balance,
        "status": "pending",
        "method": req.method,
        "reference": f"WDR-{txn_id[:8].upper()}",
        "description": f"Withdrawal via {req.method.replace('_', ' ').title()}",
        "created_at": datetime.now(timezone.utc),
    })

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": "Withdrawal Requested",
        "message": f"NAD {req.amount:.2f} withdrawal is being processed",
        "type": "withdrawal",
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

    return {"id": txn_id, "amount": req.amount, "balance": new_balance, "status": "pending"}

# ==================== SPORTS ENDPOINTS ====================
# NOTE: Will proxy to BetLab sports/odds feeds once integrated

@api_router.get("/sports")
async def get_sports():
    sports = await db.sports.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    for sport in sports:
        count = await db.fixtures.count_documents({"sport_id": sport["id"], "status": {"$in": ["upcoming", "live"]}})
        sport["fixture_count"] = count
    return sports

@api_router.get("/sports/{sport_id}/leagues")
async def get_leagues(sport_id: str):
    leagues = await db.leagues.find({"sport_id": sport_id}, {"_id": 0}).sort("order", 1).to_list(100)
    return leagues

@api_router.get("/sports/fixtures")
async def get_fixtures(sport_id: Optional[str] = None, league_id: Optional[str] = None, status: Optional[str] = None, limit: int = 50):
    query = {}
    if sport_id:
        query["sport_id"] = sport_id
    if league_id:
        query["league_id"] = league_id
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["upcoming", "live"]}
    fixtures = await db.fixtures.find(query, {"_id": 0}).sort("start_time", 1).limit(limit).to_list(limit)
    return fixtures

@api_router.get("/sports/live")
async def get_live_fixtures():
    fixtures = await db.fixtures.find({"status": "live"}, {"_id": 0}).to_list(100)
    return fixtures

@api_router.get("/sports/featured")
async def get_featured_fixtures():
    fixtures = await db.fixtures.find(
        {"status": {"$in": ["upcoming", "live"]}, "featured": True},
        {"_id": 0}
    ).sort("start_time", 1).limit(10).to_list(10)
    if len(fixtures) < 5:
        extras = await db.fixtures.find(
            {"status": {"$in": ["upcoming", "live"]}},
            {"_id": 0}
        ).sort("start_time", 1).limit(10).to_list(10)
        seen = {f["id"] for f in fixtures}
        for e in extras:
            if e["id"] not in seen:
                fixtures.append(e)
            if len(fixtures) >= 8:
                break
    return fixtures

@api_router.get("/sports/fixtures/{fixture_id}")
async def get_fixture_detail(fixture_id: str):
    fixture = await db.fixtures.find_one({"id": fixture_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return fixture

# ==================== BETTING ENDPOINTS ====================
# NOTE: Will proxy to BetLab betting engine once integrated

@api_router.post("/bets/place")
async def place_bet(req: PlaceBetRequest, request: Request):
    user = await get_current_user(request)
    if req.stake <= 0:
        raise HTTPException(status_code=400, detail="Stake must be positive")
    if req.stake < 5:
        raise HTTPException(status_code=400, detail="Minimum stake is NAD 5")
    if not req.selections:
        raise HTTPException(status_code=400, detail="No selections provided")

    wallet = await db.wallets.find_one({"user_id": user["id"]})
    if not wallet or wallet["available_balance"] < req.stake:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Calculate total odds
    total_odds = 1.0
    validated_selections = []
    for sel in req.selections:
        fixture = await db.fixtures.find_one({"id": sel.get("fixture_id")}, {"_id": 0})
        if not fixture:
            raise HTTPException(status_code=400, detail=f"Fixture not found: {sel.get('fixture_id')}")

        found_sel = None
        for market in fixture.get("markets", []):
            for s in market.get("selections", []):
                if s["id"] == sel.get("selection_id"):
                    found_sel = s
                    found_market = market
                    break
        if not found_sel:
            raise HTTPException(status_code=400, detail=f"Selection not found: {sel.get('selection_id')}")

        total_odds *= found_sel["odds"]
        validated_selections.append({
            "fixture_id": fixture["id"],
            "fixture_name": f"{fixture['home_team']} vs {fixture['away_team']}",
            "market_name": found_market["name"],
            "selection_id": found_sel["id"],
            "selection_name": found_sel["name"],
            "odds": found_sel["odds"],
        })

    total_odds = round(total_odds, 2)
    potential_return = round(req.stake * total_odds, 2)
    bet_id = str(uuid.uuid4())

    # Deduct stake from wallet
    new_balance = wallet["balance"] - req.stake
    await db.wallets.update_one(
        {"user_id": user["id"]},
        {"$set": {"balance": new_balance, "available_balance": new_balance, "updated_at": datetime.now(timezone.utc)}},
    )

    # Create bet
    bet_doc = {
        "id": bet_id,
        "user_id": user["id"],
        "selections": validated_selections,
        "bet_type": req.bet_type if len(validated_selections) > 1 else "single",
        "total_odds": total_odds,
        "stake": req.stake,
        "potential_return": potential_return,
        "status": "open",
        "winnings": 0.0,
        "placed_at": datetime.now(timezone.utc),
        "settled_at": None,
    }
    await db.bets.insert_one(bet_doc)
    del bet_doc["_id"]

    # Create stake transaction
    await db.transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "stake",
        "amount": -req.stake,
        "balance_after": new_balance,
        "status": "completed",
        "reference": f"BET-{bet_id[:8].upper()}",
        "description": f"Bet placed: {' + '.join([s['selection_name'] for s in validated_selections])}",
        "created_at": datetime.now(timezone.utc),
    })

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": "Bet Placed",
        "message": f"NAD {req.stake:.2f} bet placed at odds {total_odds}",
        "type": "bet",
        "read": False,
        "created_at": datetime.now(timezone.utc),
    })

    return {"bet": bet_doc, "wallet_balance": new_balance}

@api_router.get("/bets/open")
async def get_open_bets(request: Request):
    user = await get_current_user(request)
    bets = await db.bets.find({"user_id": user["id"], "status": "open"}, {"_id": 0}).sort("placed_at", -1).to_list(100)
    return bets

@api_router.get("/bets/settled")
async def get_settled_bets(request: Request):
    user = await get_current_user(request)
    bets = await db.bets.find(
        {"user_id": user["id"], "status": {"$in": ["won", "lost", "void"]}},
        {"_id": 0}
    ).sort("settled_at", -1).to_list(100)
    return bets

@api_router.get("/bets/{bet_id}")
async def get_bet_detail(bet_id: str, request: Request):
    user = await get_current_user(request)
    bet = await db.bets.find_one({"id": bet_id, "user_id": user["id"]}, {"_id": 0})
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet

# ==================== KYC ENDPOINTS ====================

@api_router.post("/kyc/upload")
async def upload_kyc(req: KYCUploadRequest, request: Request):
    user = await get_current_user(request)
    doc_id = str(uuid.uuid4())
    await db.kyc_documents.insert_one({
        "id": doc_id,
        "user_id": user["id"],
        "document_type": req.document_type,
        "file_data": req.file_data[:100] + "...",  # Don't store full base64 in prototype
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc),
        "reviewed_at": None,
    })
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"kyc_status": "submitted"}})
    return {"id": doc_id, "status": "pending", "message": "Document submitted for review"}

@api_router.get("/kyc/status")
async def get_kyc_status(request: Request):
    user = await get_current_user(request)
    docs = await db.kyc_documents.find({"user_id": user["id"]}, {"_id": 0, "file_data": 0}).sort("submitted_at", -1).to_list(100)
    return {"kyc_status": user.get("kyc_status", "pending"), "documents": docs}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(request: Request):
    user = await get_current_user(request)
    notifs = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return notifs

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, request: Request):
    user = await get_current_user(request)
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]},
        {"$set": {"read": True}},
    )
    return {"status": "ok"}

# ==================== PROMOTIONS ====================

@api_router.get("/promotions")
async def get_promotions():
    promos = await db.promotions.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return promos

# ==================== HEALTH CHECK ====================

@api_router.get("/health")
async def health_check():
    return {"status": "ok", "service": "MBANZA BET API", "version": "1.0.0"}

# ==================== SEED DATA ====================

async def seed_data():
    """Seed realistic African sportsbook data for prototype"""
    logger.info("Starting data seed...")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phone", sparse=True)
    await db.users.create_index("username", sparse=True)

    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@mbanza.bet")
    admin_password = os.environ.get("ADMIN_PASSWORD", "MbanzaAdmin2024!")
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        result = await db.users.insert_one({
            "email": admin_email,
            "phone": "+264811234567",
            "username": "admin",
            "name": "Admin User",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "kyc_status": "approved",
            "currency": "NAD",
            "created_at": datetime.now(timezone.utc),
        })
        admin_id = str(result.inserted_id)
        await db.wallets.insert_one({
            "user_id": admin_id,
            "balance": 10000.0,
            "available_balance": 10000.0,
            "bonus_balance": 500.0,
            "currency": "NAD",
            "updated_at": datetime.now(timezone.utc),
        })
        # Seed some transactions for admin
        for i, txn in enumerate([
            {"type": "deposit", "amount": 5000.0, "description": "Initial deposit via Card", "status": "completed"},
            {"type": "deposit", "amount": 3000.0, "description": "Deposit via Mobile Money", "status": "completed"},
            {"type": "stake", "amount": -200.0, "description": "Bet placed: Arsenal vs Chelsea", "status": "completed"},
            {"type": "winning", "amount": 520.0, "description": "Bet won: Arsenal vs Chelsea", "status": "completed"},
            {"type": "deposit", "amount": 2000.0, "description": "Deposit via Bank Transfer", "status": "completed"},
            {"type": "stake", "amount": -150.0, "description": "Bet placed: Hearts of Oak vs Kotoko", "status": "completed"},
            {"type": "withdrawal", "amount": -500.0, "description": "Withdrawal via Mobile Money", "status": "completed"},
        ]):
            await db.transactions.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": admin_id,
                "type": txn["type"],
                "amount": txn["amount"],
                "balance_after": 10000.0,
                "status": txn["status"],
                "reference": f"{txn['type'][:3].upper()}-{str(uuid.uuid4())[:8].upper()}",
                "description": txn["description"],
                "created_at": datetime.now(timezone.utc) - timedelta(days=7-i),
            })
        logger.info(f"Admin user created: {admin_email}")

    # Seed test user
    test_email = "test@mbanza.bet"
    existing_test = await db.users.find_one({"email": test_email})
    if not existing_test:
        result = await db.users.insert_one({
            "email": test_email,
            "phone": "+264819876543",
            "username": "testuser",
            "name": "Test User",
            "password_hash": hash_password("Test1234!"),
            "role": "user",
            "kyc_status": "pending",
            "currency": "NAD",
            "created_at": datetime.now(timezone.utc),
        })
        test_id = str(result.inserted_id)
        await db.wallets.insert_one({
            "user_id": test_id,
            "balance": 2500.0,
            "available_balance": 2500.0,
            "bonus_balance": 100.0,
            "currency": "NAD",
            "updated_at": datetime.now(timezone.utc),
        })
        logger.info(f"Test user created: {test_email}")

    # Write test credentials
    creds_path = Path("/app/memory/test_credentials.md")
    creds_path.parent.mkdir(parents=True, exist_ok=True)
    creds_path.write_text(
        "# MBANZA BET - Test Credentials\n\n"
        f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n"
        f"## Test User\n- Email: {test_email}\n- Password: Test1234!\n- Role: user\n\n"
        "## Auth Endpoints\n"
        "- POST /api/auth/register\n"
        "- POST /api/auth/login\n"
        "- GET /api/auth/me\n"
        "- POST /api/auth/logout\n"
        "- PUT /api/auth/profile\n"
        "- POST /api/auth/forgot-password\n"
    )

    # ================================================================
    # SPORT ARCHITECTURE NOTES:
    # - type "team": league -> fixture -> market -> odds (Soccer, Rugby, Cricket)
    # - type "individual": event -> fighter matchup -> market -> odds (Boxing, MMA)
    # - type "racing" (FUTURE): meeting -> race -> runners -> market -> odds (Horse Racing)
    # Horse Racing is NOT active in Phase 1. Architecture prepared for Phase 2.
    # ================================================================

    # Force-reseed sports data on every startup to pick up config changes
    import random
    await db.sports.drop()
    await db.leagues.drop()
    await db.fixtures.drop()
    await db.promotions.drop()
    await db.notifications.delete_many({})

    now = datetime.now(timezone.utc)

    # ---- SPORTS (Phase 1 Launch: Soccer, Rugby, Boxing, Cricket, MMA) ----
    sports_data = [
        {"id": "sport_soccer", "name": "Soccer", "icon": "football", "slug": "soccer", "type": "team", "active": True, "order": 1},
        {"id": "sport_rugby", "name": "Rugby", "icon": "american-football", "slug": "rugby", "type": "team", "active": True, "order": 2},
        {"id": "sport_boxing", "name": "Boxing", "icon": "fitness", "slug": "boxing", "type": "individual", "active": True, "order": 3},
        {"id": "sport_cricket", "name": "Cricket", "icon": "baseball", "slug": "cricket", "type": "team", "active": True, "order": 4},
        {"id": "sport_mma", "name": "MMA", "icon": "body", "slug": "mma", "type": "individual", "active": True, "order": 5},
        # FUTURE Phase 2: Horse Racing
        # {"id": "sport_horse_racing", "name": "Horse Racing", "icon": "speedometer", "slug": "horse-racing", "type": "racing", "active": False, "order": 6},
    ]
    await db.sports.insert_many(sports_data)

    # ---- LEAGUES / EVENTS per sport ----
    leagues_data = [
        # Soccer
        {"id": "league_npfl", "sport_id": "sport_soccer", "name": "Namibia Premier League", "country": "Namibia", "flag": "NA", "active": True, "order": 1},
        {"id": "league_gpl", "sport_id": "sport_soccer", "name": "Ghana Premier League", "country": "Ghana", "flag": "GH", "active": True, "order": 2},
        {"id": "league_kpl", "sport_id": "sport_soccer", "name": "Kenya Premier League", "country": "Kenya", "flag": "KE", "active": True, "order": 3},
        {"id": "league_epl", "sport_id": "sport_soccer", "name": "English Premier League", "country": "England", "flag": "GB", "active": True, "order": 4},
        {"id": "league_ucl", "sport_id": "sport_soccer", "name": "UEFA Champions League", "country": "Europe", "flag": "EU", "active": True, "order": 5},
        {"id": "league_laliga", "sport_id": "sport_soccer", "name": "La Liga", "country": "Spain", "flag": "ES", "active": True, "order": 6},
        # Rugby
        {"id": "league_super_rugby", "sport_id": "sport_rugby", "name": "Super Rugby", "country": "International", "flag": "INT", "active": True, "order": 1},
        {"id": "league_rugby_champ", "sport_id": "sport_rugby", "name": "Rugby Championship", "country": "International", "flag": "INT", "active": True, "order": 2},
        {"id": "league_six_nations", "sport_id": "sport_rugby", "name": "Six Nations", "country": "Europe", "flag": "EU", "active": True, "order": 3},
        # Boxing
        {"id": "league_wbc", "sport_id": "sport_boxing", "name": "WBC Championship", "country": "International", "flag": "INT", "active": True, "order": 1},
        {"id": "league_wba", "sport_id": "sport_boxing", "name": "WBA Title Fights", "country": "International", "flag": "INT", "active": True, "order": 2},
        {"id": "league_boxing_ppv", "sport_id": "sport_boxing", "name": "PPV Events", "country": "International", "flag": "INT", "active": True, "order": 3},
        # Cricket
        {"id": "league_ipl", "sport_id": "sport_cricket", "name": "Indian Premier League", "country": "India", "flag": "IN", "active": True, "order": 1},
        {"id": "league_t20_wc", "sport_id": "sport_cricket", "name": "T20 World Cup", "country": "International", "flag": "INT", "active": True, "order": 2},
        {"id": "league_test_cricket", "sport_id": "sport_cricket", "name": "Test Championship", "country": "International", "flag": "INT", "active": True, "order": 3},
        # MMA
        {"id": "league_ufc", "sport_id": "sport_mma", "name": "UFC", "country": "International", "flag": "INT", "active": True, "order": 1},
        {"id": "league_bellator", "sport_id": "sport_mma", "name": "Bellator MMA", "country": "International", "flag": "INT", "active": True, "order": 2},
    ]
    await db.leagues.insert_many(leagues_data)

    # ---- Market generators by sport type ----
    def make_soccer_markets(home, away):
        return [
            {"id": str(uuid.uuid4()), "name": "Match Result", "type": "1x2", "selections": [
                {"id": str(uuid.uuid4()), "name": home, "label": "1", "odds": round(random.uniform(1.5, 4.0), 2)},
                {"id": str(uuid.uuid4()), "name": "Draw", "label": "X", "odds": round(random.uniform(2.8, 4.5), 2)},
                {"id": str(uuid.uuid4()), "name": away, "label": "2", "odds": round(random.uniform(1.5, 4.0), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Over/Under 2.5 Goals", "type": "ou", "selections": [
                {"id": str(uuid.uuid4()), "name": "Over 2.5", "label": "Over", "odds": round(random.uniform(1.6, 2.2), 2)},
                {"id": str(uuid.uuid4()), "name": "Under 2.5", "label": "Under", "odds": round(random.uniform(1.6, 2.2), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Both Teams to Score", "type": "btts", "selections": [
                {"id": str(uuid.uuid4()), "name": "Yes", "label": "Yes", "odds": round(random.uniform(1.5, 2.1), 2)},
                {"id": str(uuid.uuid4()), "name": "No", "label": "No", "odds": round(random.uniform(1.5, 2.1), 2)},
            ]},
        ]

    def make_rugby_markets(home, away):
        return [
            {"id": str(uuid.uuid4()), "name": "Match Result", "type": "1x2", "selections": [
                {"id": str(uuid.uuid4()), "name": home, "label": "1", "odds": round(random.uniform(1.4, 3.5), 2)},
                {"id": str(uuid.uuid4()), "name": "Draw", "label": "X", "odds": round(random.uniform(15.0, 30.0), 2)},
                {"id": str(uuid.uuid4()), "name": away, "label": "2", "odds": round(random.uniform(1.4, 3.5), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Handicap", "type": "handicap", "selections": [
                {"id": str(uuid.uuid4()), "name": f"{home} -6.5", "label": "-6.5", "odds": round(random.uniform(1.7, 2.1), 2)},
                {"id": str(uuid.uuid4()), "name": f"{away} +6.5", "label": "+6.5", "odds": round(random.uniform(1.7, 2.1), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Over/Under 45.5 Points", "type": "ou", "selections": [
                {"id": str(uuid.uuid4()), "name": "Over 45.5", "label": "Over", "odds": round(random.uniform(1.7, 2.1), 2)},
                {"id": str(uuid.uuid4()), "name": "Under 45.5", "label": "Under", "odds": round(random.uniform(1.7, 2.1), 2)},
            ]},
        ]

    def make_fight_markets(fighter_a, fighter_b):
        """Markets for Boxing and MMA (individual / fighter-based)"""
        return [
            {"id": str(uuid.uuid4()), "name": "Fight Winner", "type": "winner", "selections": [
                {"id": str(uuid.uuid4()), "name": fighter_a, "label": fighter_a.split()[-1], "odds": round(random.uniform(1.2, 5.0), 2)},
                {"id": str(uuid.uuid4()), "name": fighter_b, "label": fighter_b.split()[-1], "odds": round(random.uniform(1.2, 5.0), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Method of Victory", "type": "method", "selections": [
                {"id": str(uuid.uuid4()), "name": "KO/TKO", "label": "KO/TKO", "odds": round(random.uniform(2.0, 4.5), 2)},
                {"id": str(uuid.uuid4()), "name": "Decision", "label": "Decision", "odds": round(random.uniform(2.0, 4.0), 2)},
                {"id": str(uuid.uuid4()), "name": "Submission", "label": "Sub", "odds": round(random.uniform(3.0, 8.0), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Over/Under Rounds", "type": "ou_rounds", "selections": [
                {"id": str(uuid.uuid4()), "name": "Over 3.5 Rounds", "label": "Over", "odds": round(random.uniform(1.6, 2.3), 2)},
                {"id": str(uuid.uuid4()), "name": "Under 3.5 Rounds", "label": "Under", "odds": round(random.uniform(1.6, 2.3), 2)},
            ]},
        ]

    def make_cricket_markets(home, away):
        return [
            {"id": str(uuid.uuid4()), "name": "Match Winner", "type": "winner", "selections": [
                {"id": str(uuid.uuid4()), "name": home, "label": home[:3].upper(), "odds": round(random.uniform(1.4, 3.5), 2)},
                {"id": str(uuid.uuid4()), "name": away, "label": away[:3].upper(), "odds": round(random.uniform(1.4, 3.5), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Over/Under 320.5 Runs", "type": "ou", "selections": [
                {"id": str(uuid.uuid4()), "name": "Over 320.5", "label": "Over", "odds": round(random.uniform(1.7, 2.1), 2)},
                {"id": str(uuid.uuid4()), "name": "Under 320.5", "label": "Under", "odds": round(random.uniform(1.7, 2.1), 2)},
            ]},
            {"id": str(uuid.uuid4()), "name": "Top Batsman", "type": "top_scorer", "selections": [
                {"id": str(uuid.uuid4()), "name": "Player A", "label": "P.A", "odds": round(random.uniform(3.0, 8.0), 2)},
                {"id": str(uuid.uuid4()), "name": "Player B", "label": "P.B", "odds": round(random.uniform(3.0, 8.0), 2)},
                {"id": str(uuid.uuid4()), "name": "Player C", "label": "P.C", "odds": round(random.uniform(3.0, 8.0), 2)},
            ]},
        ]

    # ---- FIXTURES ----
    fixtures_data = []

    # === SOCCER: Live ===
    for home, away, lid, lname, minute, score in [
        ("African Stars", "Black Africa SC", "league_npfl", "Namibia Premier League", 34, (1, 0)),
        ("Hearts of Oak", "Asante Kotoko", "league_gpl", "Ghana Premier League", 67, (2, 1)),
        ("Arsenal", "Chelsea", "league_epl", "English Premier League", 55, (1, 1)),
    ]:
        fixtures_data.append({
            "id": str(uuid.uuid4()), "league_id": lid, "league_name": lname,
            "sport_id": "sport_soccer", "sport_name": "Soccer", "sport_type": "team",
            "home_team": home, "away_team": away,
            "start_time": (now - timedelta(minutes=minute)).isoformat(),
            "status": "live", "score": {"home": score[0], "away": score[1]}, "minute": minute,
            "markets": make_soccer_markets(home, away), "featured": True,
        })

    # === SOCCER: Upcoming ===
    soccer_upcoming = [
        ("Blue Waters", "Citizens FC", "league_npfl", "Namibia Premier League", 2),
        ("Eleven Arrows", "Julinho Sporting", "league_npfl", "Namibia Premier League", 3),
        ("Medeama SC", "Dreams FC", "league_gpl", "Ghana Premier League", 4),
        ("Gor Mahia", "AFC Leopards", "league_kpl", "Kenya Premier League", 1),
        ("Tusker FC", "Bandari FC", "league_kpl", "Kenya Premier League", 6),
        ("Manchester United", "Liverpool", "league_epl", "English Premier League", 2),
        ("Manchester City", "Tottenham", "league_epl", "English Premier League", 3),
        ("Real Madrid", "Barcelona", "league_ucl", "UEFA Champions League", 4),
        ("Bayern Munich", "PSG", "league_ucl", "UEFA Champions League", 5),
        ("Atletico Madrid", "Sevilla", "league_laliga", "La Liga", 6),
    ]
    for i, (home, away, lid, lname, days) in enumerate(soccer_upcoming):
        fixtures_data.append({
            "id": str(uuid.uuid4()), "league_id": lid, "league_name": lname,
            "sport_id": "sport_soccer", "sport_name": "Soccer", "sport_type": "team",
            "home_team": home, "away_team": away,
            "start_time": (now + timedelta(days=days, hours=i % 5 + 14)).isoformat(),
            "status": "upcoming", "score": {"home": 0, "away": 0}, "minute": 0,
            "markets": make_soccer_markets(home, away), "featured": i < 4,
        })

    # === RUGBY: Live ===
    fixtures_data.append({
        "id": str(uuid.uuid4()), "league_id": "league_super_rugby", "league_name": "Super Rugby",
        "sport_id": "sport_rugby", "sport_name": "Rugby", "sport_type": "team",
        "home_team": "Stormers", "away_team": "Bulls",
        "start_time": (now - timedelta(minutes=52)).isoformat(),
        "status": "live", "score": {"home": 21, "away": 17}, "minute": 52,
        "markets": make_rugby_markets("Stormers", "Bulls"), "featured": True,
    })

    # === RUGBY: Upcoming ===
    for i, (home, away, lid, lname, days) in enumerate([
        ("Sharks", "Lions", "league_super_rugby", "Super Rugby", 2),
        ("South Africa", "New Zealand", "league_rugby_champ", "Rugby Championship", 5),
        ("Namibia", "Kenya", "league_rugby_champ", "Rugby Championship", 7),
        ("England", "France", "league_six_nations", "Six Nations", 10),
        ("Ireland", "Wales", "league_six_nations", "Six Nations", 10),
    ]):
        fixtures_data.append({
            "id": str(uuid.uuid4()), "league_id": lid, "league_name": lname,
            "sport_id": "sport_rugby", "sport_name": "Rugby", "sport_type": "team",
            "home_team": home, "away_team": away,
            "start_time": (now + timedelta(days=days, hours=i + 15)).isoformat(),
            "status": "upcoming", "score": {"home": 0, "away": 0}, "minute": 0,
            "markets": make_rugby_markets(home, away), "featured": i < 2,
        })

    # === BOXING: Upcoming (fighter-based) ===
    for i, (fighter_a, fighter_b, lid, lname, days) in enumerate([
        ("Tyson Fury", "Oleksandr Usyk", "league_wbc", "WBC Championship", 3),
        ("Canelo Alvarez", "Dmitry Bivol", "league_wba", "WBA Title Fights", 6),
        ("Naoya Inoue", "Stephen Fulton", "league_wbc", "WBC Championship", 10),
        ("Deontay Wilder", "Anthony Joshua", "league_boxing_ppv", "PPV Events", 14),
        ("Terence Crawford", "Errol Spence Jr", "league_boxing_ppv", "PPV Events", 21),
    ]):
        fixtures_data.append({
            "id": str(uuid.uuid4()), "league_id": lid, "league_name": lname,
            "sport_id": "sport_boxing", "sport_name": "Boxing", "sport_type": "individual",
            "home_team": fighter_a, "away_team": fighter_b,
            "start_time": (now + timedelta(days=days, hours=20 + i % 3)).isoformat(),
            "status": "upcoming", "score": {"home": 0, "away": 0}, "minute": 0,
            "markets": make_fight_markets(fighter_a, fighter_b), "featured": i < 2,
        })

    # === CRICKET: Upcoming ===
    for i, (home, away, lid, lname, days) in enumerate([
        ("Mumbai Indians", "Chennai Super Kings", "league_ipl", "Indian Premier League", 1),
        ("Royal Challengers", "Kolkata Knight Riders", "league_ipl", "Indian Premier League", 2),
        ("India", "Australia", "league_t20_wc", "T20 World Cup", 8),
        ("South Africa", "England", "league_test_cricket", "Test Championship", 12),
    ]):
        fixtures_data.append({
            "id": str(uuid.uuid4()), "league_id": lid, "league_name": lname,
            "sport_id": "sport_cricket", "sport_name": "Cricket", "sport_type": "team",
            "home_team": home, "away_team": away,
            "start_time": (now + timedelta(days=days, hours=10 + i)).isoformat(),
            "status": "upcoming", "score": {"home": 0, "away": 0}, "minute": 0,
            "markets": make_cricket_markets(home, away), "featured": i < 2,
        })

    # === MMA: Live ===
    fixtures_data.append({
        "id": str(uuid.uuid4()), "league_id": "league_ufc", "league_name": "UFC",
        "sport_id": "sport_mma", "sport_name": "MMA", "sport_type": "individual",
        "home_team": "Israel Adesanya", "away_team": "Dricus Du Plessis",
        "start_time": (now - timedelta(minutes=15)).isoformat(),
        "status": "live", "score": {"home": 1, "away": 1}, "minute": 3,
        "markets": make_fight_markets("Israel Adesanya", "Dricus Du Plessis"), "featured": True,
    })

    # === MMA: Upcoming (fighter-based) ===
    for i, (fighter_a, fighter_b, lid, lname, days) in enumerate([
        ("Jon Jones", "Stipe Miocic", "league_ufc", "UFC", 4),
        ("Islam Makhachev", "Charles Oliveira", "league_ufc", "UFC", 7),
        ("Alex Pereira", "Jamahal Hill", "league_ufc", "UFC", 14),
        ("Patricio Freire", "AJ McKee", "league_bellator", "Bellator MMA", 9),
    ]):
        fixtures_data.append({
            "id": str(uuid.uuid4()), "league_id": lid, "league_name": lname,
            "sport_id": "sport_mma", "sport_name": "MMA", "sport_type": "individual",
            "home_team": fighter_a, "away_team": fighter_b,
            "start_time": (now + timedelta(days=days, hours=22 + i % 2)).isoformat(),
            "status": "upcoming", "score": {"home": 0, "away": 0}, "minute": 0,
            "markets": make_fight_markets(fighter_a, fighter_b), "featured": i < 2,
        })

    await db.fixtures.insert_many(fixtures_data)
    logger.info(f"Seeded {len(fixtures_data)} fixtures across 5 sports")

    # ---- PROMOTIONS ----
    await db.promotions.insert_many([
        {"id": str(uuid.uuid4()), "title": "Welcome Bonus", "type": "welcome", "order": 1,
         "description": "Get 100% match on your first deposit up to NAD 1,000! Start your betting journey with double the funds.",
         "terms": "Minimum deposit NAD 50. 5x wagering requirement. Valid for 30 days.",
         "active": True, "start_date": now.isoformat(), "end_date": (now + timedelta(days=90)).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Accumulator Boost", "type": "deposit", "order": 2,
         "description": "Get up to 50% extra on your accumulator winnings! The more selections, the bigger the boost.",
         "terms": "Minimum 3 selections. Each selection must have odds of 1.40 or higher.",
         "active": True, "start_date": now.isoformat(), "end_date": (now + timedelta(days=60)).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Fight Night Bonus", "type": "free_bet", "order": 3,
         "description": "Get a NAD 50 free bet on every Boxing or MMA main event!",
         "terms": "One free bet per main event. Minimum odds 1.50. Free bet valid for 48 hours.",
         "active": True, "start_date": now.isoformat(), "end_date": (now + timedelta(days=365)).isoformat()},
        {"id": str(uuid.uuid4()), "title": "Cashback Special", "type": "cashback", "order": 4,
         "description": "Get 10% cashback on net losses up to NAD 500 every month.",
         "terms": "Minimum NAD 200 in qualifying bets. Cashback credited on the 1st of each month.",
         "active": True, "start_date": now.isoformat(), "end_date": (now + timedelta(days=365)).isoformat()},
    ])
    logger.info("Seeded promotions")

    # ---- NOTIFICATIONS for admin ----
    admin_user = await db.users.find_one({"email": admin_email})
    if admin_user:
        admin_id = str(admin_user["_id"])
        await db.notifications.insert_many([
            {"id": str(uuid.uuid4()), "user_id": admin_id, "title": "Welcome to MBANZA BET!", "message": "Start betting on Soccer, Rugby, Boxing, Cricket, and MMA. Fund your wallet to get started.", "type": "system", "read": False, "created_at": now - timedelta(days=5)},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "title": "Deposit Successful", "message": "NAD 5,000.00 has been added to your wallet", "type": "deposit", "read": True, "created_at": now - timedelta(days=4)},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "title": "Bet Won!", "message": "Your bet on Arsenal vs Chelsea has won! NAD 520.00 credited.", "type": "bet_settlement", "read": False, "created_at": now - timedelta(days=2)},
            {"id": str(uuid.uuid4()), "user_id": admin_id, "title": "Fight Night!", "message": "Tyson Fury vs Usyk is coming up! Place your bets now.", "type": "promotion", "read": False, "created_at": now - timedelta(days=1)},
        ])

    logger.info("Data seed complete!")

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# ==================== MOBILE API ROUTES ====================
# These mirror the exact BetLab /api/mobile/* contract.
# When BetLab server is connected, the mobile app only changes
# EXPO_PUBLIC_BACKEND_URL — same paths, same response formats.

# Auth
mobile_router.post("/auth/register")(register)
mobile_router.post("/auth/login")(login)
mobile_router.post("/auth/logout")(logout)
mobile_router.get("/auth/me")(get_me)
mobile_router.put("/auth/profile")(update_profile)
mobile_router.post("/auth/forgot-password")(forgot_password)

# Wallet
mobile_router.get("/wallet/balance")(get_wallet_balance)
mobile_router.get("/wallet/transactions")(get_transactions)
mobile_router.post("/wallet/deposit")(initiate_deposit)
mobile_router.post("/wallet/withdraw")(request_withdrawal)

# Sports
mobile_router.get("/sports")(get_sports)
mobile_router.get("/sports/{sport_id}/leagues")(get_leagues)
mobile_router.get("/sports/fixtures")(get_fixtures)
mobile_router.get("/sports/live")(get_live_fixtures)
mobile_router.get("/sports/featured")(get_featured_fixtures)
mobile_router.get("/sports/fixtures/{fixture_id}")(get_fixture_detail)

# Betting
mobile_router.post("/bets/place")(place_bet)
mobile_router.get("/bets/open")(get_open_bets)
mobile_router.get("/bets/settled")(get_settled_bets)
mobile_router.get("/bets/{bet_id}")(get_bet_detail)

# KYC
mobile_router.post("/kyc/upload")(upload_kyc)
mobile_router.get("/kyc/status")(get_kyc_status)

# Notifications
mobile_router.get("/notifications")(get_notifications)
mobile_router.put("/notifications/{notif_id}/read")(mark_notification_read)

# Promotions
mobile_router.get("/promotions")(get_promotions)

app.include_router(mobile_router)

