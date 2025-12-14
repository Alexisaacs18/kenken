"""
Quick test script to verify the API is working
"""
import requests
import json

BASE_URL = "http://localhost:5001"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        print(f"Health check status: {response.status_code}")
        print(f"Response text: {response.text}")
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Health check data: {data}")
                return True
            except ValueError as e:
                print(f"Failed to parse JSON: {e}")
                print(f"Response was: {response.text}")
                return False
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"Connection failed: {e}")
        print(f"Make sure the backend is running on {BASE_URL}")
        return False
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_generate():
    """Test puzzle generation"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/generate",
            json={"size": 4, "algorithm": "FC+MRV"},
            headers={"Content-Type": "application/json"}
        )
        print(f"Generate puzzle: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Puzzle size: {data['puzzle']['size']}")
            print(f"Cages: {len(data['puzzle']['cages'])}")
            print(f"Stats: {data['stats']}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Generate failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing KenKen API...")
    print("=" * 50)
    
    if test_health():
        print("\n✓ Health check passed")
    else:
        print("\n✗ Health check failed - is the backend running?")
        exit(1)
    
    print("\n" + "=" * 50)
    if test_generate():
        print("\n✓ Generate puzzle passed")
    else:
        print("\n✗ Generate puzzle failed")
        exit(1)
    
    print("\n" + "=" * 50)
    print("All tests passed!")
