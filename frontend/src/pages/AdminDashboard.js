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
import { toast } from 'sonner';
import { ArrowLeft, TrendingUp, Users, Receipt, Calendar, Edit2, Check, X } from 'lucide-react';
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

  useEffect(() => {
    fetchMenu();
    fetchHistory();
    fetchDailySummary();
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

  const categories = [...new Set(menu.map((item) => item.category))];

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
              Manage Prices
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">
              <Receipt className="w-4 h-4 mr-2" />
              Order History
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
              <h2 className="text-xl font-semibold mb-6">Menu Price Management</h2>
              <Tabs defaultValue={categories[0]} className="w-full">
                <TabsList className="flex-wrap h-auto bg-gray-50 p-2 gap-2">
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
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
        </Tabs>
      </div>
    </div>
  );
}