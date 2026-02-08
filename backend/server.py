from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date
import socket

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class MenuItem(BaseModel):
    id: str
    name: str
    price: float
    category: str
    description: Optional[str] = ""
    available: bool = True

class MenuItemCreate(BaseModel):
    name: str
    price: float
    category: str
    description: Optional[str] = ""

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    available: Optional[bool] = None

class PrinterConfig(BaseModel):
    printer_ip: str
    printer_port: int = 9100

class CategoryCreate(BaseModel):
    name: str

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    price: float
    notes: Optional[str] = ""
    spice_level: Optional[str] = ""

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: int
    people_count: int
    items: List[OrderItem]
    order_notes: Optional[str] = ""
    status: str = "active"  # active, completed
    kitchen_printed: bool = False
    bill_printed_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

class OrderCreate(BaseModel):
    table_number: int
    people_count: int
    items: List[OrderItem]
    order_notes: Optional[str] = ""

class OrderUpdate(BaseModel):
    items: Optional[List[OrderItem]] = None
    order_notes: Optional[str] = None
    status: Optional[str] = None

class PrintRequest(BaseModel):
    order_id: str
    print_type: str  # "kitchen" or "bill"

class SplitBillRequest(BaseModel):
    order_id: str
    selected_item_ids: List[int]  # indices of items selected

class DailySummary(BaseModel):
    date: str
    total_sales: float
    orders_count: int
    tables_served: List[int]
    popular_items: List[Dict[str, Any]]

# Initialize menu in database
@api_router.post("/menu/init")
async def initialize_menu():
    """Initialize the menu with all items from Red Rose Restaurant"""
    existing = await db.menu.count_documents({})
    if existing > 0:
        return {"message": "Menu already initialized", "count": existing}
    
    menu_items = [
        # Set Meals & Special Offers
        {"id": "set_meal_two", "name": "Set Meal for Two", "price": 44.95, "category": "Set Meals", "description": "Includes: Papadum, Onion Bhaji, Samosa, Chicken Tikka Masala, Lamb Bhuna, Sag Aloo, Pilau Rice, Any Naan Bread"},
        {"id": "set_meal_four", "name": "Set Meal for Four", "price": 84.95, "category": "Set Meals", "description": "Includes: Papadum, Mixed Kebabs, Onion Bhaji, Chicken Tikka Masala, Lamb Bhuna, Nawabi Chicken, Prawn Dupiaza, Mushroom Bhaji, Sag Aloo, 2 Pilau Rice, Any 2 Naan Bread"},
        {"id": "leave_it_to_us", "name": "Leave It To Us", "price": 26.95, "category": "Set Meals", "description": "Per person - Complete meal with assorted starters, main course, side vegetable, rice and naan bread"},
        {"id": "banquet_night", "name": "Banquet Night", "price": 16.95, "category": "Set Meals", "description": "Thursday only - Starter, main course, side dish, pilau rice or naan bread per person"},
        {"id": "papadams_chutney", "name": "Papadams + Chutney", "price": 0.85, "category": "Extras", "description": "Per person/piece"},
        
        # Starters
        {"id": "indian_mix_two", "name": "Indian Mix (for two)", "price": 16.95, "category": "Starters"},
        {"id": "mixed_kebabs", "name": "Mixed Kebabs", "price": 6.95, "category": "Starters"},
        {"id": "sheek_kebabs", "name": "Sheek Kebabs", "price": 5.95, "category": "Starters"},
        {"id": "shami_kebabs_starter", "name": "Shami Kebabs", "price": 6.95, "category": "Starters"},
        {"id": "chicken_tikka_starter", "name": "Chicken Tikka", "price": 5.95, "category": "Starters"},
        {"id": "aloo_chaat", "name": "Aloo Chaat", "price": 4.95, "category": "Starters"},
        {"id": "chicken_chaat", "name": "Chicken Chaat", "price": 5.95, "category": "Starters"},
        {"id": "tandoori_chicken_starter", "name": "Tandoori Chicken", "price": 5.95, "category": "Starters"},
        {"id": "royal_chicken", "name": "Royal Chicken", "price": 6.95, "category": "Starters"},
        {"id": "begoon_cutlet", "name": "Begoon Cutlet", "price": 4.95, "category": "Starters"},
        {"id": "onion_bhaji", "name": "Onion Bhaji", "price": 4.95, "category": "Starters"},
        {"id": "garlic_mushroom", "name": "Garlic Mushroom", "price": 4.95, "category": "Starters"},
        {"id": "chicken_tikka_puree", "name": "Chicken Tikka Puree", "price": 5.95, "category": "Starters"},
        {"id": "lamb_tikka_puree", "name": "Lamb Tikka Puree", "price": 5.95, "category": "Starters"},
        {"id": "tandoori_king_prawns_starter", "name": "Tandoori King Prawns", "price": 6.95, "category": "Starters"},
        {"id": "tandoori_king_prawn_puree", "name": "Tandoori King Prawn Puree", "price": 9.95, "category": "Starters"},
        {"id": "paneer_tikka_starter", "name": "Paneer Tikka", "price": 6.95, "category": "Starters"},
    ]
    
    # Add more categories (truncated for brevity - full menu to be added)
    # Tandoori Main Dishes
    tandoori_mains = [
        {"id": "fish_sizzler", "name": "Fish Sizzler", "price": 15.95, "category": "Tandoori Main Dishes"},
        {"id": "special_shashlik", "name": "Special Shashlik", "price": 14.95, "category": "Tandoori Main Dishes"},
        {"id": "chicken_shashlik", "name": "Chicken Shashlik", "price": 12.95, "category": "Tandoori Main Dishes"},
        {"id": "paneer_shashlik", "name": "Paneer Shashlik", "price": 13.95, "category": "Tandoori Main Dishes"},
        {"id": "lamb_shashlik", "name": "Lamb Shashlik", "price": 13.95, "category": "Tandoori Main Dishes"},
        {"id": "tandoori_chicken_main", "name": "Tandoori Chicken", "price": 10.95, "category": "Tandoori Main Dishes"},
        {"id": "chicken_tikka_main", "name": "Chicken Tikka", "price": 10.95, "category": "Tandoori Main Dishes"},
        {"id": "tandoori_paneer_tikka", "name": "Tandoori Paneer Tikka", "price": 12.95, "category": "Tandoori Main Dishes"},
        {"id": "tandoori_king_prawn_main", "name": "Tandoori King Prawn", "price": 18.95, "category": "Tandoori Main Dishes"},
        {"id": "tandoori_king_prawn_shashlik", "name": "Tandoori King Prawn Shashlik", "price": 18.95, "category": "Tandoori Main Dishes"},
        {"id": "tandoori_mixed_grill", "name": "Tandoori Mixed Grill", "price": 14.95, "category": "Tandoori Main Dishes"},
        {"id": "sheek_kebabs_main", "name": "Sheek Kebabs", "price": 11.95, "category": "Tandoori Main Dishes"},
        {"id": "shami_kebabs_main", "name": "Shami Kebabs", "price": 12.95, "category": "Tandoori Main Dishes"},
    ]
    menu_items.extend(tandoori_mains)
    
    # Biryani Dishes  
    biryanis = [
        {"id": "red_rose_biryani", "name": "Red Rose Special Biryani", "price": 15.95, "category": "Biryani", "description": "Lamb Tikka, Chicken Tikka, Egg and Spinach"},
        {"id": "chicken_tikka_biryani", "name": "Chicken Tikka Biryani", "price": 14.95, "category": "Biryani"},
        {"id": "chicken_lamb_biryani", "name": "Chicken or Lamb Biryani", "price": 13.95, "category": "Biryani"},
        {"id": "prawn_biryani", "name": "Prawn Biryani", "price": 14.95, "category": "Biryani"},
        {"id": "king_prawn_biryani", "name": "King Prawn Biryani", "price": 18.95, "category": "Biryani"},
        {"id": "chef_special_biryani", "name": "Chef's Special Biryani", "price": 14.95, "category": "Biryani", "description": "Chicken, Lamb, Prawn"},
        {"id": "vegetable_biryani", "name": "Vegetable Biryani", "price": 12.95, "category": "Biryani"},
        {"id": "mushroom_biryani", "name": "Mushroom Biryani", "price": 12.95, "category": "Biryani"},
        {"id": "keema_biryani", "name": "Keema Biryani", "price": 13.95, "category": "Biryani", "description": "Minced Lamb"},
    ]
    menu_items.extend(biryanis)
    
    # Traditional Curries - adding a sample of each type
    curry_types = [
        ("Medium Curry", [9.95, 9.95, 10.95, 16.95, 10.95, 8.95, 10.95]),
        ("Korma", [9.95, 9.95, 11.95, 16.95, 10.95, 8.95, 10.95]),
        ("Madras", [9.95, 9.95, 10.95, 16.95, 10.95, 8.95, 10.95]),
        ("Tikka Masala", [10.95, 10.95, 11.95, 18.95, 10.95, 9.95, 11.95]),
    ]
    
    proteins = ["Chicken", "Lamb", "Prawn", "King Prawn", "Tikka (Chicken)", "Vegetable", "Paneer"]
    
    for curry_name, prices in curry_types:
        for protein, price in zip(proteins, prices):
            menu_items.append({
                "id": f"{curry_name.lower().replace(' ', '_')}_{protein.lower().replace(' ', '_').replace('(', '').replace(')', '')}",
                "name": f"{protein} {curry_name}",
                "price": price,
                "category": "Traditional Curries"
            })
    
    # Rice & Sundries
    rice_items = [
        {"id": "pilau_rice", "name": "Pilau Rice", "price": 3.75, "category": "Rice"},
        {"id": "boiled_rice", "name": "Boiled Rice", "price": 3.75, "category": "Rice"},
        {"id": "garlic_rice", "name": "Garlic Rice", "price": 4.45, "category": "Rice"},
        {"id": "egg_fried_rice", "name": "Egg Fried Rice", "price": 4.45, "category": "Rice"},
        {"id": "mushroom_rice", "name": "Mushroom Rice", "price": 4.45, "category": "Rice"},
        {"id": "vegetable_rice", "name": "Vegetable Rice", "price": 4.45, "category": "Rice"},
        {"id": "keema_rice", "name": "Keema Rice", "price": 4.95, "category": "Rice"},
        {"id": "special_rice", "name": "Special Rice", "price": 4.45, "category": "Rice"},
    ]
    menu_items.extend(rice_items)
    
    # Naan Breads
    naans = [
        {"id": "plain_naan", "name": "Plain Naan", "price": 3.95, "category": "Naan Breads"},
        {"id": "garlic_naan", "name": "Garlic Naan", "price": 4.45, "category": "Naan Breads"},
        {"id": "cheese_naan", "name": "Cheese Naan", "price": 4.45, "category": "Naan Breads"},
        {"id": "peshwari_naan", "name": "Peshwari Naan", "price": 4.45, "category": "Naan Breads"},
        {"id": "keema_naan", "name": "Keema Naan", "price": 4.45, "category": "Naan Breads"},
        {"id": "tikka_naan", "name": "Tikka Naan", "price": 4.45, "category": "Naan Breads"},
        {"id": "cheese_garlic_naan", "name": "Cheese Garlic Naan", "price": 4.95, "category": "Naan Breads"},
        {"id": "roti", "name": "Roti", "price": 3.95, "category": "Naan Breads"},
        {"id": "paratha", "name": "Paratha", "price": 2.95, "category": "Naan Breads"},
        {"id": "chapati", "name": "Chapati", "price": 2.95, "category": "Naan Breads"},
    ]
    menu_items.extend(naans)
    
    # Drinks
    drinks = [
        {"id": "coke", "name": "Coke", "price": 3.95, "category": "Soft Drinks"},
        {"id": "diet_coke", "name": "Diet Coke", "price": 3.95, "category": "Soft Drinks"},
        {"id": "lemonade", "name": "Lemonade", "price": 3.95, "category": "Soft Drinks"},
        {"id": "kingfisher_half", "name": "KingFisher (Half)", "price": 3.95, "category": "Beers"},
        {"id": "kingfisher_pint", "name": "KingFisher (Pint)", "price": 6.45, "category": "Beers"},
        {"id": "cobra_beer", "name": "Cobra Beer", "price": 6.95, "category": "Beers"},
    ]
    menu_items.extend(drinks)
    
    for item in menu_items:
        item["available"] = True
    
    await db.menu.insert_many(menu_items)
    return {"message": "Menu initialized successfully", "count": len(menu_items)}

@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu = await db.menu.find({}, {"_id": 0}).to_list(1000)
    return menu

@api_router.post("/menu/item")
async def create_menu_item(item: MenuItemCreate):
    item_id = item.name.lower().replace(' ', '_').replace('(', '').replace(')', '')
    new_item = {
        "id": item_id,
        "name": item.name,
        "price": item.price,
        "category": item.category,
        "description": item.description,
        "available": True
    }
    await db.menu.insert_one(new_item)
    return {"message": "Menu item created", "id": item_id}

@api_router.patch("/menu/{item_id}")
async def update_menu_item(item_id: str, update: MenuItemUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(400, "No fields to update")
    
    result = await db.menu.update_one({"id": item_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(404, "Menu item not found")
    
    return {"message": "Menu item updated"}

@api_router.delete("/menu/{item_id}")
async def delete_menu_item(item_id: str):
    result = await db.menu.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Menu item not found")
    return {"message": "Menu item deleted"}

@api_router.get("/categories")
async def get_categories():
    categories = await db.menu.distinct("category")
    return {"categories": sorted(categories)}

@api_router.post("/categories")
async def create_category(category: CategoryCreate):
    # Just return success - categories are created automatically when items are added
    return {"message": "Category will be created when items are added", "name": category.name}

# Printer Configuration
@api_router.get("/printer/config")
async def get_printer_config():
    config = await db.settings.find_one({"type": "printer"}, {"_id": 0})
    if not config:
        # Return default
        return {"printer_ip": "192.168.1.146", "printer_port": 9100}
    return {"printer_ip": config.get("printer_ip"), "printer_port": config.get("printer_port", 9100)}

@api_router.post("/printer/config")
async def update_printer_config(config: PrinterConfig):
    await db.settings.update_one(
        {"type": "printer"},
        {"$set": {"printer_ip": config.printer_ip, "printer_port": config.printer_port}},
        upsert=True
    )
    return {"message": "Printer configuration updated"}

@api_router.patch("/menu/{item_id}")
async def update_menu_item(item_id: str, update: MenuItemUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(400, "No fields to update")
    
    result = await db.menu.update_one({"id": item_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(404, "Menu item not found")
    
    return {"message": "Menu item updated"}

@api_router.post("/orders", response_model=Order)
async def create_order(order_create: OrderCreate):
    order = Order(**order_create.model_dump())
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    return order

@api_router.get("/orders/active")
async def get_active_orders():
    """Get all active orders"""
    orders = await db.orders.find({"status": "active"}, {"_id": 0, "id": 1, "table_number": 1}).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if order.get('completed_at') and isinstance(order['completed_at'], str):
        order['completed_at'] = datetime.fromisoformat(order['completed_at'])
    return order

@api_router.get("/orders/table/{table_number}")
async def get_active_order_by_table(table_number: int):
    order = await db.orders.find_one(
        {"table_number": table_number, "status": "active"},
        {"_id": 0}
    )
    if not order:
        return None
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    return order

@api_router.patch("/orders/{order_id}")
async def update_order(order_id: str, update: OrderUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(400, "No fields to update")
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(404, "Order not found")
    
    return {"message": "Order updated"}

@api_router.post("/orders/{order_id}/complete")
async def complete_order(order_id: str):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return {"message": "Order completed"}

@api_router.post("/print")
async def print_ticket(request: PrintRequest):
    """Send print command to thermal printer"""
    order = await db.orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    
    # Get printer configuration
    printer_config = await db.settings.find_one({"type": "printer"}, {"_id": 0})
    if printer_config:
        PRINTER_IP = printer_config.get("printer_ip", "192.168.1.146")
        PRINTER_PORT = printer_config.get("printer_port", 9100)
    else:
        PRINTER_IP = "192.168.1.146"
        PRINTER_PORT = 9100
    
    try:
        # ESC/POS commands
        ESC = b'\x1B'
        GS = b'\x1D'
        
        # Initialize printer
        printer_data = ESC + b'@'
        
        if request.print_type == "kitchen":
            # Kitchen ticket - no prices, no drinks
            printer_data += ESC + b'!\x30'  # Double height and width
            printer_data += b'KITCHEN COPY\n'
            printer_data += ESC + b'!\x00'  # Normal
            printer_data += b'=' * 32 + b'\n'
            printer_data += f"TABLE: {order['table_number']}     PEOPLE: {order['people_count']}\n".encode()
            printer_data += b'=' * 32 + b'\n\n'
            
            for item in order['items']:
                # Skip drinks
                if 'drink' in item['name'].lower() or 'coke' in item['name'].lower() or 'beer' in item['name'].lower():
                    continue
                
                qty_name = f"{item['quantity']} x {item['name']}\n"
                printer_data += qty_name.encode()
                
                if item.get('notes'):
                    printer_data += ESC + b'!\x01'  # Italic
                    printer_data += f"  *{item['notes']}*\n".encode()
                    printer_data += ESC + b'!\x00'  # Normal
            
            if order.get('order_notes'):
                printer_data += b'\n' + b'-' * 32 + b'\n'
                printer_data += f"NOTE: {order['order_notes']}\n".encode()
            
            # Update kitchen printed flag
            await db.orders.update_one(
                {"id": request.order_id},
                {"$set": {"kitchen_printed": True}}
            )
        
        else:  # bill
            # Customer bill - with prices
            printer_data += ESC + b'!\x30'  # Double height
            printer_data += b'RED ROSE RESTAURANT\n'
            printer_data += ESC + b'!\x00'
            printer_data += b'=' * 32 + b'\n'
            printer_data += f"TABLE: {order['table_number']}     PEOPLE: {order['people_count']}\n".encode()
            printer_data += b'=' * 32 + b'\n\n'
            
            total = 0
            for item in order['items']:
                item_total = item['quantity'] * item['price']
                total += item_total
                
                # Format with price alignment
                qty_name = f"{item['quantity']} x {item['name']}"
                price_str = f"£{item_total:.2f}"
                line = f"{qty_name:<22}{price_str:>10}\n".encode()
                printer_data += line
                
                if item.get('notes'):
                    printer_data += f"  ({item['notes']})\n".encode()
            
            printer_data += b'\n' + b'-' * 32 + b'\n'
            total_line = f"TOTAL{' ' * 21}£{total:.2f}\n"
            printer_data += ESC + b'!\x30'  # Double
            printer_data += total_line.encode()
            printer_data += ESC + b'!\x00'
            printer_data += b'=' * 32 + b'\n\n'
            printer_data += b'Thank you for dining with us!\n'
            
            # Update bill printed count
            await db.orders.update_one(
                {"id": request.order_id},
                {"$inc": {"bill_printed_count": 1}}
            )
        
        # Cut paper
        printer_data += GS + b'V\x00'
        
        # Send to printer
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((PRINTER_IP, PRINTER_PORT))
        sock.sendall(printer_data)
        sock.close()
        
        return {
            "message": f"Print sent successfully", 
            "type": request.print_type,
            "printer": f"{PRINTER_IP}:{PRINTER_PORT}"
        }
    
    except Exception as e:
        logging.error(f"Print error: {str(e)}")
        raise HTTPException(500, f"Print failed: {str(e)}")

@api_router.post("/split-bill", response_model=Dict[str, float])
async def calculate_split_bill(request: SplitBillRequest):
    """Calculate bill for selected items"""
    order = await db.orders.find_one({"id": request.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(404, "Order not found")
    
    selected_total = 0
    remaining_total = 0
    
    for idx, item in enumerate(order['items']):
        item_total = item['quantity'] * item['price']
        if idx in request.selected_item_ids:
            selected_total += item_total
        else:
            remaining_total += item_total
    
    return {
        "selected_total": round(selected_total, 2),
        "remaining_total": round(remaining_total, 2)
    }

@api_router.get("/history")
async def get_order_history(limit: int = 50):
    """Get recent order history"""
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if order.get('completed_at') and isinstance(order['completed_at'], str):
            order['completed_at'] = datetime.fromisoformat(order['completed_at'])
    return orders

@api_router.get("/summary/daily")
async def get_daily_summary(date_str: Optional[str] = None):
    """Get summary for a specific date"""
    if not date_str:
        date_str = date.today().isoformat()
    
    target_date = datetime.fromisoformat(date_str).date()
    start_datetime = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_datetime = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    orders = await db.orders.find({
        "created_at": {
            "$gte": start_datetime.isoformat(),
            "$lte": end_datetime.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    total_sales = 0
    tables_served = set()
    item_counts = {}
    
    for order in orders:
        tables_served.add(order['table_number'])
        for item in order['items']:
            item_total = item['quantity'] * item['price']
            total_sales += item_total
            
            item_name = item['name']
            if item_name not in item_counts:
                item_counts[item_name] = {'name': item_name, 'quantity': 0, 'revenue': 0}
            item_counts[item_name]['quantity'] += item['quantity']
            item_counts[item_name]['revenue'] += item_total
    
    popular_items = sorted(item_counts.values(), key=lambda x: x['quantity'], reverse=True)[:10]
    
    return {
        "date": date_str,
        "total_sales": round(total_sales, 2),
        "orders_count": len(orders),
        "tables_served": sorted(list(tables_served)),
        "popular_items": popular_items
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()