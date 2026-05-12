#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class RedRoseAPITester:
    def __init__(self):
        # Use the public backend URL from frontend .env
        self.base_url = "https://tadka-app.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_order_id = None
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASSED"
        else:
            status = "❌ FAILED"
        
        print(f"\n{status} - {name}")
        if details:
            print(f"   Details: {details}")
            
        self.test_results.append({
            "test_name": name,
            "success": success,
            "details": details
        })
        return success

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            print(f"\n🔍 Testing {name}...")
            print(f"   URL: {url}")
            
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_details = response.json()
                    details += f", Response: {error_details}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            else:
                return None

        except Exception as e:
            details = f"Exception: {str(e)}"
            self.log_test(name, False, details)
            return None

    def test_menu_initialization(self):
        """Test menu initialization"""
        print("\n" + "="*50)
        print("TESTING MENU INITIALIZATION")
        print("="*50)
        
        # First check if menu exists
        result = self.run_test("Get Menu", "GET", "/menu", 200)
        
        if not result:
            print("Menu not found, trying to initialize...")
            result = self.run_test("Initialize Menu", "POST", "/menu/init", 200)
            if result:
                print(f"Menu initialized with {result.get('count', 'unknown')} items")
                # Get menu again after initialization
                result = self.run_test("Get Menu After Init", "GET", "/menu", 200)
        
        if result and isinstance(result, list):
            print(f"Menu loaded successfully with {len(result)} items")
            
            # Check menu categories
            categories = set(item.get('category') for item in result if item.get('category'))
            expected_categories = {'Set Meals', 'Starters', 'Tandoori Main Dishes', 'Biryani', 
                                'Traditional Curries', 'Rice', 'Naan Breads', 'Soft Drinks', 'Beers'}
            
            found_categories = categories.intersection(expected_categories)
            self.log_test(
                "Menu Categories Check",
                len(found_categories) >= 5,  # At least 5 expected categories
                f"Found categories: {sorted(found_categories)}"
            )
            
            # Check specific special items
            item_names = [item.get('name', '') for item in result]
            special_items = ['Papadams + Chutney', 'Leave It To Us', 'Banquet Night']
            
            for item in special_items:
                found = any(item in name for name in item_names)
                self.log_test(f"Special Item: {item}", found, f"Found: {found}")
        
        return result is not None

    def test_order_creation(self):
        """Test order creation flow"""
        print("\n" + "="*50)
        print("TESTING ORDER CREATION")
        print("="*50)
        
        # Create a test order
        test_order = {
            "table_number": 5,
            "people_count": 2,
            "bill_type": "one",
            "items": [
                {
                    "menu_item_id": "chicken_tikka_starter",
                    "name": "Chicken Tikka",
                    "quantity": 2,
                    "price": 5.95,
                    "notes": "Medium spice",
                    "spice_level": "medium"
                },
                {
                    "menu_item_id": "plain_naan",
                    "name": "Plain Naan",
                    "quantity": 1,
                    "price": 3.95,
                    "notes": ""
                }
            ],
            "order_notes": "Test order for kitchen"
        }
        
        result = self.run_test("Create Order", "POST", "/orders", 200, test_order)
        
        if result:
            self.test_order_id = result.get('id')
            self.log_test("Order ID Retrieved", bool(self.test_order_id), 
                         f"Order ID: {self.test_order_id}")
            return True
        return False

    def test_order_retrieval(self):
        """Test order retrieval"""
        print("\n" + "="*50)
        print("TESTING ORDER RETRIEVAL")
        print("="*50)
        
        if not self.test_order_id:
            self.log_test("Order Retrieval", False, "No test order ID available")
            return False
            
        # Get order by ID
        result = self.run_test("Get Order by ID", "GET", f"/orders/{self.test_order_id}", 200)
        
        if result:
            # Check order details
            self.log_test("Order Table Number", result.get('table_number') == 5, 
                         f"Table: {result.get('table_number')}")
            self.log_test("Order Items Count", len(result.get('items', [])) == 2,
                         f"Items: {len(result.get('items', []))}")
            
        # Get order by table number
        result2 = self.run_test("Get Order by Table", "GET", "/orders/table/5", 200)
        
        return result is not None

    def test_order_updates(self):
        """Test order updates"""
        print("\n" + "="*50)
        print("TESTING ORDER UPDATES")
        print("="*50)
        
        if not self.test_order_id:
            self.log_test("Order Update", False, "No test order ID available")
            return False
        
        # Update order with new items
        update_data = {
            "items": [
                {
                    "menu_item_id": "chicken_tikka_starter",
                    "name": "Chicken Tikka",
                    "quantity": 3,  # Updated quantity
                    "price": 5.95,
                    "notes": "Hot spice",  # Updated notes
                    "spice_level": "hot"
                },
                {
                    "menu_item_id": "garlic_naan",
                    "name": "Garlic Naan",  # Different item
                    "quantity": 2,
                    "price": 4.45,
                    "notes": ""
                }
            ],
            "order_notes": "Updated test order"
        }
        
        result = self.run_test("Update Order", "PATCH", f"/orders/{self.test_order_id}", 200, update_data)
        
        if result:
            # Verify the update
            order = self.run_test("Verify Update", "GET", f"/orders/{self.test_order_id}", 200)
            if order:
                items = order.get('items', [])
                self.log_test("Updated Items Count", len(items) == 2, f"Items: {len(items)}")
                if items:
                    self.log_test("Updated Quantity", items[0].get('quantity') == 3,
                                 f"Quantity: {items[0].get('quantity')}")
        
        return result is not None

    def test_printing_endpoints(self):
        """Test printing functionality"""
        print("\n" + "="*50)
        print("TESTING PRINT ENDPOINTS")
        print("="*50)
        
        if not self.test_order_id:
            self.log_test("Print Test", False, "No test order ID available")
            return False
        
        # Test kitchen print
        kitchen_print = self.run_test(
            "Kitchen Print", "POST", "/print", 500,  # Expected to fail due to no printer
            {"order_id": self.test_order_id, "print_type": "kitchen"}
        )
        
        # Print failure is expected in test environment
        self.log_test("Kitchen Print Expected Failure", kitchen_print is None,
                     "Printer connection should fail in test environment")
        
        # Test bill print
        bill_print = self.run_test(
            "Bill Print", "POST", "/print", 500,  # Expected to fail due to no printer
            {"order_id": self.test_order_id, "print_type": "bill"}
        )
        
        self.log_test("Bill Print Expected Failure", bill_print is None,
                     "Printer connection should fail in test environment")
        
        return True  # Both should fail as expected

    def test_split_bill(self):
        """Test split bill calculation"""
        print("\n" + "="*50)
        print("TESTING SPLIT BILL")
        print("="*50)
        
        if not self.test_order_id:
            self.log_test("Split Bill", False, "No test order ID available")
            return False
        
        # Test split bill calculation (selecting first item)
        split_data = {
            "order_id": self.test_order_id,
            "selected_item_ids": [0]  # Select first item only
        }
        
        result = self.run_test("Split Bill Calculation", "POST", "/split-bill", 200, split_data)
        
        if result:
            selected_total = result.get('selected_total', 0)
            remaining_total = result.get('remaining_total', 0)
            
            self.log_test("Split Totals Present", 
                         selected_total > 0 and remaining_total > 0,
                         f"Selected: £{selected_total}, Remaining: £{remaining_total}")
        
        return result is not None

    def test_admin_endpoints(self):
        """Test admin dashboard endpoints"""
        print("\n" + "="*50)
        print("TESTING ADMIN ENDPOINTS")
        print("="*50)
        
        # Test order history
        history = self.run_test("Order History", "GET", "/history?limit=10", 200)
        
        if history:
            self.log_test("History Contains Orders", len(history) > 0,
                         f"Found {len(history)} orders")
        
        # Test daily summary
        today = datetime.now().strftime('%Y-%m-%d')
        summary = self.run_test("Daily Summary", "GET", f"/summary/daily?date_str={today}", 200)
        
        if summary:
            expected_fields = ['date', 'total_sales', 'orders_count', 'tables_served', 'popular_items']
            has_all_fields = all(field in summary for field in expected_fields)
            self.log_test("Summary Fields Complete", has_all_fields,
                         f"Fields: {list(summary.keys())}")
        
        return history is not None and summary is not None

    def test_menu_price_update(self):
        """Test menu price updates"""
        print("\n" + "="*50)
        print("TESTING MENU PRICE UPDATES")
        print("="*50)
        
        # Try to update price of a menu item
        result = self.run_test("Update Menu Price", "PATCH", "/menu/plain_naan", 200, 
                             {"price": 4.25})
        
        if result:
            # Verify the price was updated
            menu = self.run_test("Get Updated Menu", "GET", "/menu", 200)
            if menu:
                plain_naan = next((item for item in menu if item.get('id') == 'plain_naan'), None)
                if plain_naan:
                    self.log_test("Price Update Verified", plain_naan.get('price') == 4.25,
                                 f"New price: £{plain_naan.get('price')}")
        
        return result is not None

    def test_complete_order(self):
        """Test order completion"""
        print("\n" + "="*50)
        print("TESTING ORDER COMPLETION")
        print("="*50)
        
        if not self.test_order_id:
            self.log_test("Complete Order", False, "No test order ID available")
            return False
        
        result = self.run_test("Complete Order", "POST", f"/orders/{self.test_order_id}/complete", 200)
        
        if result:
            # Verify order is marked as completed
            order = self.run_test("Verify Completion", "GET", f"/orders/{self.test_order_id}", 200)
            if order:
                self.log_test("Order Status Updated", order.get('status') == 'completed',
                             f"Status: {order.get('status')}")
        
        return result is not None

    def run_all_tests(self):
        """Run all backend API tests"""
        print("\n" + "🚀" * 20)
        print("RED ROSE RESTAURANT - BACKEND API TESTING")
        print("🚀" * 20)
        print(f"Testing against: {self.base_url}")
        print("\n")
        
        # Test sequence
        tests = [
            ("Menu System", self.test_menu_initialization),
            ("Order Creation", self.test_order_creation),
            ("Order Retrieval", self.test_order_retrieval),
            ("Order Updates", self.test_order_updates),
            ("Print System", self.test_printing_endpoints),
            ("Split Bill", self.test_split_bill),
            ("Admin Dashboard", self.test_admin_endpoints),
            ("Menu Management", self.test_menu_price_update),
            ("Order Completion", self.test_complete_order)
        ]
        
        for test_category, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_test(f"{test_category} - Exception", False, str(e))
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run} ({success_rate:.1f}%)")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED! Backend API is working correctly.")
            return 0
        else:
            failed_tests = [r for r in self.test_results if not r['success']]
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests[:10]:  # Show first 10 failures
                print(f"   • {test['test_name']}: {test['details']}")
            
            return 1

def main():
    tester = RedRoseAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())