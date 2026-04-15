"""
MBANZA BET Mobile API Tests (Phase 3)
Tests for /api/mobile/* endpoints matching BetLab mobile API contract
Tests: Auth, Wallet, Sports, Betting, Notifications, Promotions
"""
import pytest
import requests
import os

BASE_URL = os.environ['EXPO_PUBLIC_BACKEND_URL'].rstrip('/')

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "admin@mbanza.bet"
ADMIN_PASSWORD = "MbanzaAdmin2024!"
TEST_EMAIL = "test@mbanza.bet"
TEST_PASSWORD = "Test1234!"

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_token(api_client):
    """Get admin auth token via /api/mobile/auth/login"""
    response = api_client.post(f"{BASE_URL}/api/mobile/auth/login", json={
        "identifier": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.text}")
    return response.json()["token"]

@pytest.fixture
def test_user_token(api_client):
    """Get test user auth token via /api/mobile/auth/login"""
    response = api_client.post(f"{BASE_URL}/api/mobile/auth/login", json={
        "identifier": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Test user login failed: {response.text}")
    return response.json()["token"]

class TestMobileAuth:
    """Mobile auth endpoints /api/mobile/auth/*"""
    
    def test_mobile_admin_login_success(self, api_client):
        """POST /api/mobile/auth/login with admin credentials"""
        response = api_client.post(f"{BASE_URL}/api/mobile/auth/login", json={
            "identifier": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
    
    def test_mobile_test_user_login_success(self, api_client):
        """POST /api/mobile/auth/login with test user credentials"""
        response = api_client.post(f"{BASE_URL}/api/mobile/auth/login", json={
            "identifier": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["user"]["role"] == "user"
    
    def test_mobile_login_invalid_credentials(self, api_client):
        """POST /api/mobile/auth/login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/mobile/auth/login", json={
            "identifier": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_mobile_register_new_user(self, api_client):
        """POST /api/mobile/auth/register creates new user"""
        import uuid
        unique_email = f"mobile_test_{uuid.uuid4().hex[:8]}@mbanza.bet"
        
        response = api_client.post(f"{BASE_URL}/api/mobile/auth/register", json={
            "email": unique_email,
            "name": "Mobile Test User",
            "password": "MobilePass123!",
            "phone": f"+26481{uuid.uuid4().hex[:7]}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["role"] == "user"
        
        # Verify user can login via mobile endpoint
        login_response = api_client.post(f"{BASE_URL}/api/mobile/auth/login", json={
            "identifier": unique_email,
            "password": "MobilePass123!"
        })
        assert login_response.status_code == 200
    
    def test_mobile_get_profile(self, api_client, admin_token):
        """GET /api/mobile/auth/me returns user profile"""
        response = api_client.get(f"{BASE_URL}/api/mobile/auth/me", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"

class TestMobileWallet:
    """Mobile wallet endpoints /api/mobile/wallet/*"""
    
    def test_mobile_get_wallet_balance(self, api_client, admin_token):
        """GET /api/mobile/wallet/balance returns NAD balance"""
        response = api_client.get(f"{BASE_URL}/api/mobile/wallet/balance", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data
        assert "available_balance" in data
        assert "currency" in data
        assert data["currency"] == "NAD"
        assert isinstance(data["balance"], (int, float))
    
    def test_mobile_get_transactions(self, api_client, admin_token):
        """GET /api/mobile/wallet/transactions returns transaction list"""
        response = api_client.get(f"{BASE_URL}/api/mobile/wallet/transactions", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_mobile_deposit_creates_transaction_and_updates_balance(self, api_client, test_user_token):
        """POST /api/mobile/wallet/deposit creates deposit and updates balance"""
        # Get initial balance
        balance_response = api_client.get(f"{BASE_URL}/api/mobile/wallet/balance", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert balance_response.status_code == 200
        initial_balance = balance_response.json()["balance"]
        
        # Make deposit
        deposit_amount = 150.0
        deposit_response = api_client.post(f"{BASE_URL}/api/mobile/wallet/deposit", 
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"amount": deposit_amount, "method": "card"}
        )
        assert deposit_response.status_code == 200
        deposit_data = deposit_response.json()
        assert deposit_data["amount"] == deposit_amount
        assert deposit_data["status"] == "completed"
        assert deposit_data["balance"] == initial_balance + deposit_amount
        
        # Verify balance updated via GET
        new_balance_response = api_client.get(f"{BASE_URL}/api/mobile/wallet/balance", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert new_balance_response.status_code == 200
        new_balance = new_balance_response.json()["balance"]
        assert new_balance == initial_balance + deposit_amount
    
    def test_mobile_deposit_minimum_validation(self, api_client, test_user_token):
        """POST /api/mobile/wallet/deposit validates minimum NAD 10"""
        response = api_client.post(f"{BASE_URL}/api/mobile/wallet/deposit", 
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"amount": 5.0, "method": "card"}
        )
        assert response.status_code == 400

class TestMobileSports:
    """Mobile sports endpoints /api/mobile/sports/*"""
    
    def test_mobile_get_sports(self, api_client):
        """GET /api/mobile/sports returns 5 sports (Soccer, Rugby, Boxing, Cricket, MMA)"""
        response = api_client.get(f"{BASE_URL}/api/mobile/sports")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5
        
        # Verify all 5 launch sports are present
        sport_names = {sport["name"] for sport in data}
        expected_sports = {"Soccer", "Rugby", "Boxing", "Cricket", "MMA"}
        assert sport_names == expected_sports
        
        # Verify structure
        for sport in data:
            assert "id" in sport
            assert "name" in sport
            assert "slug" in sport
            assert "type" in sport
            assert sport["type"] in ["team", "individual"]
    
    def test_mobile_get_featured_fixtures(self, api_client):
        """GET /api/mobile/sports/featured returns featured fixtures"""
        response = api_client.get(f"{BASE_URL}/api/mobile/sports/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify fixture structure
        fixture = data[0]
        assert "id" in fixture
        assert "home_team" in fixture
        assert "away_team" in fixture
        assert "markets" in fixture
        assert isinstance(fixture["markets"], list)
        assert len(fixture["markets"]) > 0
        
        # Verify market structure
        market = fixture["markets"][0]
        assert "selections" in market
        assert len(market["selections"]) > 0
        
        # Verify selection has odds
        selection = market["selections"][0]
        assert "odds" in selection
        assert isinstance(selection["odds"], (int, float))
    
    def test_mobile_get_live_fixtures(self, api_client):
        """GET /api/mobile/sports/live returns live fixtures"""
        response = api_client.get(f"{BASE_URL}/api/mobile/sports/live")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # All fixtures should have status 'live'
        for fixture in data:
            assert fixture["status"] == "live"
            assert "minute" in fixture
            assert "score" in fixture

class TestMobileBetting:
    """Mobile betting endpoints /api/mobile/bets/*"""
    
    def test_mobile_place_bet_deducts_from_wallet_and_creates_bet(self, api_client, test_user_token):
        """POST /api/mobile/bets/place deducts from wallet and creates bet"""
        # Get initial balance
        balance_response = api_client.get(f"{BASE_URL}/api/mobile/wallet/balance", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        initial_balance = balance_response.json()["balance"]
        
        # Get a fixture with odds
        fixtures_response = api_client.get(f"{BASE_URL}/api/mobile/sports/featured")
        fixtures = fixtures_response.json()
        assert len(fixtures) > 0
        
        fixture = fixtures[0]
        assert len(fixture["markets"]) > 0
        market = fixture["markets"][0]
        assert len(market["selections"]) > 0
        selection = market["selections"][0]
        
        # Place bet
        stake = 75.0
        bet_response = api_client.post(f"{BASE_URL}/api/mobile/bets/place",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "selections": [{
                    "fixture_id": fixture["id"],
                    "selection_id": selection["id"]
                }],
                "stake": stake,
                "bet_type": "single"
            }
        )
        assert bet_response.status_code == 200
        bet_data = bet_response.json()
        assert "bet" in bet_data
        assert "wallet_balance" in bet_data
        assert bet_data["wallet_balance"] == initial_balance - stake
        
        # Verify bet was created
        bet = bet_data["bet"]
        assert bet["stake"] == stake
        assert bet["status"] == "open"
        assert len(bet["selections"]) == 1
        
        # Verify balance was deducted via GET
        new_balance_response = api_client.get(f"{BASE_URL}/api/mobile/wallet/balance", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        new_balance = new_balance_response.json()["balance"]
        assert new_balance == initial_balance - stake
    
    def test_mobile_get_open_bets(self, api_client, test_user_token):
        """GET /api/mobile/bets/open returns open bets"""
        # Place a bet first
        fixtures_response = api_client.get(f"{BASE_URL}/api/mobile/sports/featured")
        fixture = fixtures_response.json()[0]
        selection = fixture["markets"][0]["selections"][0]
        
        api_client.post(f"{BASE_URL}/api/mobile/bets/place",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "selections": [{"fixture_id": fixture["id"], "selection_id": selection["id"]}],
                "stake": 25.0,
                "bet_type": "single"
            }
        )
        
        # Get open bets
        response = api_client.get(f"{BASE_URL}/api/mobile/bets/open", headers={
            "Authorization": f"Bearer {test_user_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify all bets are open
        for bet in data:
            assert bet["status"] == "open"
    
    def test_mobile_bet_minimum_stake_validation(self, api_client, test_user_token):
        """POST /api/mobile/bets/place validates minimum NAD 5 stake"""
        fixtures_response = api_client.get(f"{BASE_URL}/api/mobile/sports/featured")
        fixture = fixtures_response.json()[0]
        selection = fixture["markets"][0]["selections"][0]
        
        response = api_client.post(f"{BASE_URL}/api/mobile/bets/place",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={
                "selections": [{"fixture_id": fixture["id"], "selection_id": selection["id"]}],
                "stake": 2.0,  # Below minimum of 5
                "bet_type": "single"
            }
        )
        assert response.status_code == 400

class TestMobileNotifications:
    """Mobile notifications endpoints /api/mobile/notifications"""
    
    def test_mobile_get_notifications(self, api_client, admin_token):
        """GET /api/mobile/notifications returns notifications"""
        response = api_client.get(f"{BASE_URL}/api/mobile/notifications", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestMobilePromotions:
    """Mobile promotions endpoints /api/mobile/promotions"""
    
    def test_mobile_get_promotions(self, api_client):
        """GET /api/mobile/promotions returns promotions"""
        response = api_client.get(f"{BASE_URL}/api/mobile/promotions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify structure
        promo = data[0]
        assert "id" in promo
        assert "title" in promo
        assert "description" in promo
        assert "active" in promo
