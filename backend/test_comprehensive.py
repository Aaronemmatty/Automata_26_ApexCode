"""
Comprehensive API testing script for SAIS application.
Tests all features end-to-end including Ollama AI integration.
"""
import asyncio
import httpx
from datetime import date, datetime, timedelta

BASE_URL = "http://127.0.0.1:8000/api/v1"

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_test(name: str):
    """Print test name."""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BLUE}Testing: {name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_success(message: str):
    """Print success message."""
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_error(message: str):
    """Print error message."""
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_warning(message: str):
    """Print warning message."""
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.RESET}")


async def test_authentication():
    """Test user registration and login."""
    print_test("Authentication (Register & Login)")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test registration
        timestamp = int(datetime.now().timestamp() * 1000)  # Use milliseconds for uniqueness
        test_email = f"testuser{timestamp}@test.com"
        test_username = f"testuser{timestamp}"
        register_data = {
            "email": test_email,
            "username": test_username,
            "password": "TestPassword123!",
            "full_name": "Test User"
        }
        
        try:
            response =await client.post(f"{BASE_URL}/auth/register", json=register_data)
            if response.status_code == 201:
                print_success(f"Registration successful: {test_email}")
            else:
                print_error(f"Registration failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print_error(f"Registration error: {e}")
            return None
        
        # Test login
        login_data = {
            "email": test_email,
            "password": "TestPassword123!"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                token = response.json().get("access_token")
                print_success(f"Login successful, token received")
                return token
            else:
                print_error(f"Login failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print_error(f"Login error: {e}")
            return None


async def test_assignments(token: str):
    """Test assignment CRUD operations."""
    print_test("Assignments CRUD")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Create assignment with AI time estimation
        assignment_data = {
            "title": "Machine Learning Assignment",
            "description": "Implement a neural network from scratch using NumPy. " +
                         "Create a multi-layer perceptron with backpropagation. " +
                         "Test it on the MNIST dataset and achieve at least 90% accuracy. " +
                         "Write a report explaining the architecture and results.",
            "due_date": str(date.today() + timedelta(days=7)),
            "status": "pending",
            "priority": "high"
        }
        
        try:
            response = await client.post(f"{BASE_URL}/assignments/", 
                                        json=assignment_data, 
                                        headers=headers)
            if response.status_code in [200, 201]:
                assignment = response.json()
                assignment_id = assignment["id"]
                estimated_hours = assignment.get("ai_metrics", {}).get("estimated_hours", "N/A")
                provider = assignment.get("ai_metrics", {}).get("analysis_provider", "unknown")
                
                print_success(f"Assignment created: ID={assignment_id}")
                print_success(f"  AI estimated time: {estimated_hours} hours")
                print_success(f"  Analysis provider: {provider}")
                
                if provider == "ollama":
                    print_success("  ✓ Using Ollama AI (local)")
                elif provider == "heuristic":
                    print_warning("  ⚠ Using heuristic fallback")
                
                # Get all assignments
                response = await client.get(f"{BASE_URL}/assignments/", headers=headers)
                if response.status_code == 200:
                    assignments = response.json()
                    print_success(f"Retrieved {len(assignments)} assignments")
                
                # Update assignment
                update_data = {"status": "in_progress"}
                response = await client.patch(f"{BASE_URL}/assignments/{assignment_id}", 
                                             json=update_data, 
                                             headers=headers)
                if response.status_code == 200:
                    print_success(f"Assignment updated to 'in_progress'")
                
                # Delete assignment
                response = await client.delete(f"{BASE_URL}/assignments/{assignment_id}", 
                                              headers=headers)
                if response.status_code == 204:
                    print_success(f"Assignment deleted")
                
            else:
                print_error(f"Create assignment failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"Assignment test error: {e}")


async def test_attendance(token: str):
    """Test attendance tracking."""
    print_test("Attendance Tracking")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Create subject
        subject_data = {
            "name": "Artificial Intelligence",
            "code": "AI101",
            "total_classes": 30
        }
        
        try:
            response = await client.post(f"{BASE_URL}/attendance/subjects", 
                                        json=subject_data, 
                                        headers=headers)
            if response.status_code in [200, 201]:
                subject = response.json()
                subject_id = subject["id"]
                print_success(f"Subject created: {subject['name']} ({subject['code']})")
                
                # Mark attendance
                record_data = {
                    "subject_id": subject_id,
                    "date": str(date.today()),
                    "status": "present"
                }
                
                response = await client.post(f"{BASE_URL}/attendance/records", 
                                            json=record_data, 
                                            headers=headers)
                if response.status_code in [200, 201]:
                    print_success("Attendance marked as 'present'")
                
                # Get attendance stats
                response = await client.get(f"{BASE_URL}/attendance/stats/{subject_id}", 
                                          headers=headers)
                if response.status_code == 200:
                    stats = response.json()
                    print_success(f"Attendance stats: {stats.get('percentage', 0)}% present")
                
                # Delete subject
                response = await client.delete(f"{BASE_URL}/attendance/subjects/{subject_id}", 
                                              headers=headers)
                if response.status_code == 204:
                    print_success("Subject deleted")
                    
            else:
                print_error(f"Create subject failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"Attendance test error: {e}")


async def test_activities(token: str):
    """Test activities management."""
    print_test("Activities Management")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Create activity
        activity_data = {
            "title": "Study Group Session",
            "description": "Weekly study group for Data Structures",
            "activity_date": str(date.today()),
            "duration_minutes": 90
        }
        
        try:
            response = await client.post(f"{BASE_URL}/activities/", 
                                        json=activity_data, 
                                        headers=headers)
            if response.status_code in [200, 201]:
                activity = response.json()
                activity_id = activity["id"]
                print_success(f"Activity created: {activity['title']}")
                
                # Get all activities
                response = await client.get(f"{BASE_URL}/activities/", headers=headers)
                if response.status_code == 200:
                    activities = response.json()
                    print_success(f"Retrieved {len(activities)} activities")
                
                # Delete activity
                response = await client.delete(f"{BASE_URL}/activities/{activity_id}", 
                                              headers=headers)
                if response.status_code == 204:
                    print_success("Activity deleted")
                    
            else:
                print_error(f"Create activity failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"Activities test error: {e}")


async def test_college_events(token: str):
    """Test college events scraping."""
    print_test("College Events Scraping (FRCRCE)")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(f"{BASE_URL}/events?college=frcrce", 
                                       headers=headers)
            if response.status_code == 200:
                events = response.json()
                print_success(f"Retrieved {len(events)} college events from FRCRCE")
                
                if len(events) > 0:
                    print_success(f"  Sample event: {events[0].get('title', 'N/A')}")
                    print_success(f"  Date: {events[0].get('date', 'N/A')}")
            else:
                print_error(f"Get events failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"College events test error: {e}")


async def main():
    """Run all tests."""
    print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
    print(f"{Colors.GREEN}SAIS Comprehensive Testing Suite{Colors.RESET}")
    print(f"{Colors.GREEN}Testing with Ollama AI Integration{Colors.RESET}")
    print(f"{Colors.GREEN}{'='*60}{Colors.RESET}\n")
    
    # Test authentication
    token = await test_authentication()
    if not token:
        print_error("Authentication failed, cannot proceed with other tests")
        return
    
    # Run all tests
    await test_assignments(token)
    await test_attendance(token)
    await test_activities(token)
    await test_college_events(token)
    
    print(f"\n{Colors.GREEN}{'='*60}{Colors.RESET}")
    print(f"{Colors.GREEN}All tests completed!{Colors.RESET}")
    print(f"{Colors.GREEN}{'='*60}{Colors.RESET}\n")


if __name__ == "__main__":
    asyncio.run(main())
