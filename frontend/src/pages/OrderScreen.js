import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Printer, ChefHat, Receipt, Calculator, ArrowLeft, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OrderScreen() {
  const { tableNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { peopleCount, billType } = location.state || { peopleCount: 1, billType: 'one' };

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [kitchenPrinted, setKitchenPrinted] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [selectedItemsForSplit, setSelectedItemsForSplit] = useState([]);
  const [splitTotal, setSplitTotal] = useState({ selected: 0, remaining: 0 });

  useEffect(() => {
    fetchMenu();
    checkExistingOrder();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API}/menu`);
      setMenu(response.data);
    } catch (error) {
      toast.error('Failed to load menu');
    }
  };

  const checkExistingOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/table/${tableNumber}`);
      if (response.data) {
        setOrderId(response.data.id);
        setCart(response.data.items);
        setKitchenPrinted(response.data.kitchen_printed);
      }
    } catch (error) {
      console.log('No existing order');
    }
  };

  const categories = [...new Set(menu.map((item) => item.category))];
  const categoryOrder = [
    'Set Meals',
    'Starters',
    'Tandoori Main Dishes',
    'Biryani',
    'Traditional Curries',
    'Rice',
    'Naan Breads',
    'Soft Drinks',
    'Beers',
  ];
  const sortedCategories = categories.sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  const handleAddToCart = (item) => {
    setSelectedItem(item);
    setItemQuantity(1);
    setItemNotes('');
    setShowItemDialog(true);
  };

  const confirmAddToCart = () => {
    const orderItem = {
      menu_item_id: selectedItem.id,
      name: selectedItem.name,
      quantity: itemQuantity,
      price: selectedItem.price,
      notes: itemNotes,
    };
    setCart([...cart, orderItem]);
    setShowItemDialog(false);
    toast.success('Item added to order');
  };

  const updateCartItemQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity = Math.max(1, newCart[index].quantity + delta);
    setCart(newCart);
  };

  const removeCartItem = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
    toast.info('Item removed');
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error('Add items to order first');
      return;
    }

    if (kitchenPrinted) {
      toast.error('Kitchen order already sent');
      return;
    }

    try {
      let currentOrderId = orderId;

      if (!currentOrderId) {
        const response = await axios.post(`${API}/orders`, {
          table_number: parseInt(tableNumber),
          people_count: peopleCount,
          bill_type: billType,
          items: cart,
          order_notes: '',
        });
        currentOrderId = response.data.id;
        setOrderId(currentOrderId);
      } else {
        await axios.patch(`${API}/orders/${currentOrderId}`, {
          items: cart,
        });
      }

      await axios.post(`${API}/print`, {
        order_id: currentOrderId,
        print_type: 'kitchen',
      });

      setKitchenPrinted(true);
      toast.success('Kitchen order sent!');
    } catch (error) {
      toast.error('Failed to send kitchen order');
      console.error(error);
    }
  };

  const handlePrintBill = async () => {
    if (cart.length === 0) {
      toast.error('No items in order');
      return;
    }

    try {
      let currentOrderId = orderId;

      if (!currentOrderId) {
        const response = await axios.post(`${API}/orders`, {
          table_number: parseInt(tableNumber),
          people_count: peopleCount,
          bill_type: billType,
          items: cart,
          order_notes: '',
        });
        currentOrderId = response.data.id;
        setOrderId(currentOrderId);
      } else {
        await axios.patch(`${API}/orders/${currentOrderId}`, {
          items: cart,
        });
      }

      await axios.post(`${API}/print`, {
        order_id: currentOrderId,
        print_type: 'bill',
      });

      toast.success('Bill printed (2 copies)');
    } catch (error) {
      toast.error('Failed to print bill');
      console.error(error);
    }
  };

  const handleCompleteOrder = async () => {
    if (!orderId) {
      toast.error('No active order');
      return;
    }

    try {
      await axios.post(`${API}/orders/${orderId}/complete`);
      toast.success('Order completed!');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      toast.error('Failed to complete order');
    }
  };

  const handleSplitBill = () => {
    setShowSplitDialog(true);
    setSelectedItemsForSplit([]);
    setSplitTotal({ selected: 0, remaining: 0 });
  };

  const toggleItemForSplit = (index) => {
    const newSelected = selectedItemsForSplit.includes(index)
      ? selectedItemsForSplit.filter((i) => i !== index)
      : [...selectedItemsForSplit, index];
    setSelectedItemsForSplit(newSelected);

    let selected = 0;
    let remaining = 0;
    cart.forEach((item, idx) => {
      const itemTotal = item.quantity * item.price;
      if (newSelected.includes(idx)) {
        selected += itemTotal;
      } else {
        remaining += itemTotal;
      }
    });
    setSplitTotal({ selected, remaining });
  };

  return (
    <div className="min-h-screen rose-pattern">
      {/* Header */}
      <div className="bg-white border-b border-red-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              data-testid="back-button"
              className="text-gray-600 hover:text-red-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="table-header">
                Table {tableNumber}
              </h1>
              <p className="text-sm text-gray-500">
                {peopleCount} {peopleCount === 1 ? 'Person' : 'People'} • {billType === 'one' ? 'One Bill' : 'Split Bill'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCartDialog(true)}
            data-testid="view-cart-button"
            className="bg-red-500 hover:bg-red-600"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart ({cart.length})
          </Button>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue={sortedCategories[0]} className="w-full">
          <TabsList className="w-full flex-wrap h-auto bg-white border border-red-100 p-2 gap-2" data-testid="category-tabs">
            {sortedCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                data-testid={`category-tab-${category}`}
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedCategories.map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="menu-grid">
                {menu
                  .filter((item) => item.category === category && item.available)
                  .map((item) => (
                    <Card
                      key={item.id}
                      data-testid={`menu-item-${item.id}`}
                      className="p-4 hover:shadow-lg transition-shadow border-red-100"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                        <Badge className="ml-2 bg-red-500">£{item.price.toFixed(2)}</Badge>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        data-testid={`add-item-${item.id}`}
                        className="w-full bg-red-500 hover:bg-red-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Order
                      </Button>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent data-testid="item-dialog">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Quantity</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  data-testid="decrease-quantity"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-semibold w-12 text-center" data-testid="item-quantity">
                  {itemQuantity}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  data-testid="increase-quantity"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="notes" className="mb-2 block">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g., Medium hot, No garlic"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                data-testid="item-notes"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-lg font-semibold">
                Total: £{(itemQuantity * (selectedItem?.price || 0)).toFixed(2)}
              </span>
              <Button onClick={confirmAddToCart} data-testid="confirm-add-item" className="bg-red-500 hover:bg-red-600">
                Add to Cart
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="cart-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl">Current Order</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No items in cart</div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <Card key={index} data-testid={`cart-item-${index}`} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        {item.notes && <p className="text-sm text-gray-500 italic mt-1">{item.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCartItem(index)}
                        data-testid={`remove-item-${index}`}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(index, -1)}
                          data-testid={`decrease-cart-item-${index}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-semibold w-8 text-center" data-testid={`cart-item-quantity-${index}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCartItemQuantity(index, 1)}
                          data-testid={`increase-cart-item-${index}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-gray-900">
                        £{(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
          <Separator />
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span data-testid="cart-total">£{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleSendToKitchen}
                disabled={kitchenPrinted || cart.length === 0}
                data-testid="send-kitchen-button"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                {kitchenPrinted ? 'Kitchen Sent' : 'Send Kitchen'}
              </Button>
              <Button
                onClick={handlePrintBill}
                disabled={cart.length === 0}
                data-testid="print-bill-button"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Bill
              </Button>
              <Button
                onClick={handleSplitBill}
                disabled={cart.length === 0}
                data-testid="split-bill-button"
                variant="outline"
                className="border-red-200"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Split Bill
              </Button>
              <Button
                onClick={handleCompleteOrder}
                disabled={!orderId}
                data-testid="complete-order-button"
                className="bg-green-500 hover:bg-green-600"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Bill Dialog */}
      <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
        <DialogContent className="max-w-2xl" data-testid="split-bill-dialog">
          <DialogHeader>
            <DialogTitle>Split Bill Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">Select items for Person/Group A:</p>
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {cart.map((item, index) => (
                <div
                  key={index}
                  onClick={() => toggleItemForSplit(index)}
                  data-testid={`split-item-${index}`}
                  className={`p-3 mb-2 rounded-lg cursor-pointer border-2 transition-all ${
                    selectedItemsForSplit.includes(index)
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">
                        {item.quantity}x {item.name}
                      </span>
                      {item.notes && <p className="text-sm text-gray-500 italic">{item.notes}</p>}
                    </div>
                    <span className="font-semibold">£{(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span>Person/Group A Total:</span>
                <span className="font-bold text-red-600" data-testid="split-selected-total">
                  £{splitTotal.selected.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span>Remaining Total:</span>
                <span className="font-bold" data-testid="split-remaining-total">
                  £{splitTotal.remaining.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}