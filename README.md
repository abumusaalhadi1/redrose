# Red Rose Restaurant POS System

A professional staff-facing Point of Sale (POS) ordering system built for Red Rose Restaurant. This PWA (Progressive Web App) is designed for Android tablets and allows waiters to efficiently take orders, manage tables, print kitchen tickets and bills, and track daily sales.

## 🌹 Features

### Waiter Interface
- **Table Selection**: Quick access to specific tables (1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 16, 17)
- **People Count & Bill Type**: Track number of guests and set bill type (One Bill / Split Bill)
- **Comprehensive Menu**: 96+ items across 9 categories
  - Set Meals (Set Meal for Two, Set Meal for Four, Leave It To Us, Banquet Night)
  - Starters
  - Tandoori Main Dishes
  - Biryani
  - Traditional Curries
  - Rice
  - Naan Breads
  - Soft Drinks
  - Beers

### Order Management
- **Item Customization**: Add quantity, notes (e.g., "Medium hot", "No garlic")
- **Cart Management**: View, edit, remove items with real-time total calculation
- **Kitchen Printing**: Send orders to kitchen (prints once only, excludes drinks and prices)
- **Bill Printing**: Print customer bills (2 copies, includes all items with prices)
- **Split Bill Calculator**: Select specific items to calculate individual bills
- **Order Completion**: Mark orders as complete and clear table

### Admin Dashboard
- **Daily Summary**: 
  - Total sales for selected date
  - Number of orders
  - Tables served
  - Top 10 popular items with quantity and revenue
- **Price Management**: Edit menu item prices in real-time
- **Order History**: View recent orders with full details

### Special Items
- **Papadams + Chutney**: £0.85 per person/piece (calculated based on people count)
- **Set Meals**: Pre-configured meal packages
- **Banquet Night**: Thursday special at £16.95 per person
- **Leave It To Us**: £26.95 per person - chef's choice meal

## 🎨 Design

- **Theme**: Light red and white color scheme
- **Logo**: Red rose icon
- **Responsive**: Optimized for tablets (1920x1080) and mobile devices
- **Touch-Friendly**: Large buttons and intuitive navigation
- **PWA**: Installable as a native app on Android devices

## 🖨️ Printer Configuration

**Printer**: Sunmi NT311 (or compatible thermal printer)
**Connection**: Wi-Fi via TCP socket
**IP Address**: 192.168.1.146
**Port**: 9100
**Protocol**: ESC/POS

### Kitchen Ticket Format
- Table number and people count
- Item quantities and names
- Item notes (in italic)
- Order-level notes
- **Excludes**: Prices and drinks

### Bill Format
- Restaurant header
- Table number and people count
- All items with quantities, prices, and notes
- Total amount
- Prints 2 copies automatically

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.9+
- MongoDB

### Installation

1. **Clone the repository**
```bash
cd /app
```

2. **Install Backend Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

3. **Install Frontend Dependencies**
```bash
cd frontend
yarn install
```

4. **Configure Environment Variables**

Backend `.env`:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=red_rose_pos
CORS_ORIGINS=*
```

Frontend `.env`:
```
REACT_APP_BACKEND_URL=http://your-backend-url
```

5. **Initialize Menu**
```bash
curl -X POST http://your-backend-url/api/menu/init
```

6. **Start Services**
```bash
# Backend
cd backend
python server.py

# Frontend
cd frontend
yarn start
```

## 📱 Installation as PWA

### On Android Tablet:
1. Open the app in Chrome browser
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. Confirm installation
5. The app will appear as a native app icon

## 🛠️ Technology Stack

### Frontend
- React 19
- React Router for navigation
- Axios for API calls
- Shadcn/UI component library
- Tailwind CSS for styling
- Lucide React for icons
- Sonner for toast notifications

### Backend
- FastAPI (Python web framework)
- Motor (async MongoDB driver)
- Pydantic for data validation
- Python-escpos for thermal printing

### Database
- MongoDB for data persistence

## 📊 API Endpoints

### Menu Management
- `POST /api/menu/init` - Initialize menu with default items
- `GET /api/menu` - Get all menu items
- `PATCH /api/menu/{item_id}` - Update menu item price/availability

### Order Management
- `POST /api/orders` - Create new order
- `GET /api/orders/{order_id}` - Get order details
- `GET /api/orders/table/{table_number}` - Get active order for table
- `PATCH /api/orders/{order_id}` - Update order
- `POST /api/orders/{order_id}/complete` - Mark order as complete

### Printing
- `POST /api/print` - Send print command (kitchen or bill)

### Analytics
- `GET /api/history?limit=50` - Get recent order history
- `GET /api/summary/daily?date_str=YYYY-MM-DD` - Get daily summary
- `POST /api/split-bill` - Calculate split bill totals

## 🔒 Security Notes

- This system is designed for internal staff use only
- No authentication required for basic ordering (as specified)
- Admin dashboard accessible to all staff
- Printer connection uses direct TCP socket (ensure network security)
- All data stored locally in MongoDB

## 🐛 Troubleshooting

### Printer Not Working
- Verify printer IP address (192.168.1.146) is correct
- Ensure printer is on the same network
- Check printer port (9100) is open
- Test printer connectivity: `telnet 192.168.1.146 9100`

### Menu Not Loading
- Check backend is running
- Verify MongoDB is running
- Initialize menu: `POST /api/menu/init`

### Orders Not Saving
- Check MongoDB connection
- Verify backend logs for errors
- Ensure sufficient disk space

## 📝 Notes

- Kitchen orders can only be printed once per order
- Bills can be printed multiple times
- Drinks are never sent to kitchen
- Local storage used for offline capability
- All prices in GBP (£)

## 🎯 Future Enhancements

Potential improvements (not currently implemented):
- User authentication for different waiter accounts
- Real-time order status updates
- Table reservation system
- Ingredient stock tracking
- Multi-language support
- Receipt email functionality
- Payment integration
- Delivery management

## 📄 License

Proprietary - Red Rose Restaurant

## 👨‍💻 Support

For technical support or feature requests, contact your system administrator.

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Built with**: ❤️ for Red Rose Restaurant
