import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, Users, Receipt, Edit2, Check, X, Settings, Printer, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [history, setHistory] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingItem, setEditingItem] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [printerIP, setPrinterIP] = useState('192.168.1.146');
  const [printerPort, setPrinterPort] = useState(9100);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', description: '' });
  const [categories, setCategories] = useState([]);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddReservationDialog, setShowAddReservationDialog] = useState(false);
  const [newReservation, setNewReservation] = useState({
    table_number: '',
    customer_name: '',
    phone: '',
    people_count: '',
    reservation_time: '',
    notes: ''
  });
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    fetchMenu();
    fetchHistory();
    fetchDailySummary();
    fetchPrinterConfig();
    fetchCategories();
    fetchReservations();
  }, []);

  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate]);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenu(response.data);
    } catch (error) {
      toast.error('Failed to load menu');
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history?limit=100`);
      setHistory(response.data);
    } catch (error) {
      toast.error('Failed to load history');
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await axios.get(`${API}/summary/daily?date_str=${selectedDate}`);
      setDailySummary(response.data);
    } catch (error) {
      toast.error('Failed to load summary');
    }
  };

  const fetchPrinterConfig = async () => {
    try {
      const response = await axios.get(`${API}/printer/config`);
      setPrinterIP(response.data.printer_ip);
      setPrinterPort(response.data.printer_port);
    } catch (error) {
      console.log('Failed to fetch printer config');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data.categories);
    } catch (error) {
      console.log('Failed to fetch categories');
    }
  };

  const handleSavePrinterConfig = async () => {
    try {
      await axios.post(`${API}/printer/config`, {
        printer_ip: printerIP,
        printer_port: parseInt(printerPort),
      });
      toast.success('Printer configuration saved');
    } catch (error) {
      toast.error('Failed to save printer configuration');
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await axios.post(`${API}/menu/item`, {
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        description: newItem.description,
      });
      toast.success('Item added successfully');
      setShowAddItemDialog(false);
      setNewItem({ name: '', price: '', category: '', description: '' });
      fetchMenu();
      fetchCategories();
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API}/menu/${itemId}`);
      toast.success('Item deleted');
      fetchMenu();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) {
      toast.error('Please enter category name');
      return;
    }
    try {
      await axios.post(`${API}/categories`, { name: newCategoryName });
      toast.success('Category will be available when items are added');
      setShowAddCategoryDialog(false);
      setNewCategoryName('');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to add category');
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API}/reservations`);
      setReservations(response.data);
    } catch (error) {
      console.log('Failed to fetch reservations');
    }
  };

  const handleAddReservation = async () => {
    if (!newReservation.table_number || !newReservation.customer_name || !newReservation.reservation_time) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await axios.post(`${API}/reservations`, {
        table_number: parseInt(newReservation.table_number),
        customer_name: newReservation.customer_name,
        phone: newReservation.phone,
        people_count: parseInt(newReservation.people_count) || 2,
        reservation_time: new Date(newReservation.reservation_time).toISOString(),
        notes: newReservation.notes
      });
      toast.success('Reservation created');
      setShowAddReservationDialog(false);
      setNewReservation({
        table_number: '',
        customer_name: '',
        phone: '',
        people_count: '',
        reservation_time: '',
        notes: ''
      });
      fetchReservations();
    } catch (error) {
      toast.error('Failed to create reservation');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await axios.delete(`${API}/reservations/${reservationId}`);
      toast.success('Reservation cancelled');
      fetchReservations();
    } catch (error) {
      toast.error('Failed to cancel reservation');
    }
  };

  const handleReprintOrder = async (order) => {
    try {
      await axios.post(`${API}/print`, {
        order_id: order.id,
        print_type: 'bill'
      });
      toast.success('Bill reprinted (2 copies)');
    } catch (error) {
      toast.error('Failed to reprint bill');
    }
  };

  const handleEditPrice = (item) => {
    setEditingItem(item.id);
    setEditPrice(item.price.toString());
  };

  const handleSavePrice = async (itemId) => {
    try {
      await axios.patch(`${API}/menu/${itemId}`, {
        price: parseFloat(editPrice),
      });
      toast.success('Price updated');
      setEditingItem(null);
      fetchMenu();
    } catch (error) {
      toast.error('Failed to update price');
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditPrice('');
  };

  const menuCategories = [...new Set(menu.map((item) => item.category))];

  return (
    <div className="min-h-screen rose-pattern">
      {/* Header */}
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              data-testid="back-to-home-button"
              className="text-gray-600 hover:text-red-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="bg-white border border-red-100 mb-6" data-testid="admin-tabs">
            <TabsTrigger value="summary" data-testid="summary-tab">
              <TrendingUp className="w-4 h-4 mr-2" />
              Daily Summary
            </TabsTrigger>
            <TabsTrigger value="prices" data-testid="prices-tab">
              <Edit2 className="w-4 h-4 mr-2" />
              Manage Menu
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">
              <Receipt className="w-4 h-4 mr-2" />
              Order History
            </TabsTrigger>
            <TabsTrigger value="reservations" data-testid="reservations-tab">
              <Users className="w-4 h-4 mr-2" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab">\n              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Daily Summary Tab */}
          <TabsContent value="summary">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Label htmlFor="date-picker" className="text-base font-semibold">
                    Select Date:
                  </Label>
                  <Input
                    id="date-picker"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    data-testid="date-picker"
                    className="w-48"
                  />
                </div>

                {dailySummary && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Card className="p-6 bg-gradient-to-br from-red-50 to-white border-red-200">
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp className="w-5 h-5 text-red-600" />
                          <span className="text-sm text-gray-600">Total Sales</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900" data-testid="total-sales">
                          £{dailySummary.total_sales.toFixed(2)}
                        </p>
                      </Card>

                      <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Receipt className="w-5 h-5 text-blue-600" />
                          <span className="text-sm text-gray-600">Orders</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900" data-testid="orders-count">
                          {dailySummary.orders_count}
                        </p>
                      </Card>

                      <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Users className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-gray-600">Tables Served</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900" data-testid="tables-served">
                          {dailySummary.tables_served.length}
                        </p>
                      </Card>
                    </div>

                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Top 10 Popular Items</h3>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {dailySummary.popular_items.map((item, index) => (
                            <div
                              key={index}
                              data-testid={`popular-item-${index}`}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Badge className="bg-red-500">{index + 1}</Badge>
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {item.quantity} sold
                                </p>
                                <p className="text-sm text-gray-500">
                                  £{item.revenue.toFixed(2)} revenue
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </Card>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Manage Prices Tab */}
          <TabsContent value="prices">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Menu Management</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddCategoryDialog(true)} variant="outline" className="border-red-200">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                  <Button onClick={() => setShowAddItemDialog(true)} className="bg-red-500 hover:bg-red-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <Tabs defaultValue={menuCategories[0]} className="w-full">
                <TabsList className="flex-wrap h-auto bg-gray-50 p-2 gap-2">
                  {menuCategories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {menuCategories.map((category) => (
                  <TabsContent key={category} value={category}>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-2">
                        {menu
                          .filter((item) => item.category === category)
                          .map((item) => (
                            <div
                              key={item.id}
                              data-testid={`price-item-${item.id}`}
                              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                            >
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                {editingItem === item.id ? (
                                  <>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      data-testid={`edit-price-input-${item.id}`}
                                      className="w-24"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleSavePrice(item.id)}
                                      data-testid={`save-price-${item.id}`}
                                      className="bg-green-500 hover:bg-green-600"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={handleCancelEdit}
                                      data-testid={`cancel-price-${item.id}`}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-lg font-bold text-gray-900 w-20 text-right">
                                      £{item.price.toFixed(2)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditPrice(item)}
                                      data-testid={`edit-price-${item.id}`}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </TabsContent>

          {/* Order History Tab */}
          <TabsContent value="history">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Recent Orders</h2>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {history.map((order) => (
                    <Card key={order.id} data-testid={`history-order-${order.id}`} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-semibold">Table {order.table_number}</h4>
                            <Badge
                              className={order.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {order.people_count} {order.people_count === 1 ? 'person' : 'people'} •{' '}
                            {order.bill_type === 'one' ? 'One bill' : 'Split bill'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            £
                            {order.items
                              .reduce((sum, item) => sum + item.quantity * item.price, 0)
                              .toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {order.items.length} items
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleReprintOrder(order)}
                            className="mt-2 bg-blue-500 hover:bg-blue-600"
                          >
                            <Printer className="w-3 h-3 mr-1" />
                            Reprint
                          </Button>
                        </div>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.quantity}x {item.name}
                                {item.notes && (
                                  <span className="text-gray-400 italic ml-2">({item.notes})</span>
                                )}
                              </span>
                              <span className="font-medium text-gray-900">
                                £{(item.quantity * item.price).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Printer className="w-6 h-6 text-red-600" />
                  <h2 className="text-xl font-semibold">Printer Configuration</h2>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Update printer IP address when it changes. Both the app and printer should be on the same WiFi network.
                </p>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="printer-ip" className="mb-2 block">
                      Printer IP Address
                    </Label>
                    <Input
                      id="printer-ip"
                      placeholder="192.168.1.146"
                      value={printerIP}
                      onChange={(e) => setPrinterIP(e.target.value)}
                      data-testid="printer-ip-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="printer-port" className="mb-2 block">
                      Printer Port
                    </Label>
                    <Input
                      id="printer-port"
                      type="number"
                      placeholder="9100"
                      value={printerPort}
                      onChange={(e) => setPrinterPort(e.target.value)}
                      data-testid="printer-port-input"
                    />
                  </div>
                  <Button 
                    onClick={handleSavePrinterConfig}
                    data-testid="save-printer-config"
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Save Printer Configuration
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Item Dialog */}
        <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="item-name">Item Name *</Label>
                <Input
                  id="item-name"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Chicken Tikka Masala"
                />
              </div>
              <div>
                <Label htmlFor="item-price">Price (£) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="9.95"
                />
              </div>
              <div>
                <Label htmlFor="item-category">Category *</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <Button onClick={handleAddItem} className="w-full bg-red-500 hover:bg-red-600">
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Chef Specials"
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full bg-red-500 hover:bg-red-600">
                Add Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}