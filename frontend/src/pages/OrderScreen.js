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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { toast } from 'sonner';
import { ShoppingCart, Plus, Minus, Printer, ChefHat, Calculator, ArrowLeft, Trash2, Search, ChevronDown, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Order display categories
const CATEGORY_ORDER = {
  'Starters': 1,
  'Soft Drinks': 2,
  'Beers': 2,
  'Tandoori Main Dishes': 3,
  'Biryani': 3,
  'Traditional Curries': 3,
  'Red Rose Chef\'s Specialities': 3,
  'Exquisite Mild Blended Dishes': 3,
  'Balti Dishes': 3,
  'Vegetable Main Dishes': 3,
  'English Dishes': 3,
  'Vegetable Side Dishes': 4,
  'Sundries': 5,
  'Rice': 6,
  'Naan Breads': 7,
  'Set Meals': 0
};

const CATEGORY_DISPLAY_NAMES = {
  0: 'Set Meals',
  1: 'Starters (including Papadams)',
  2: 'Drinks',
  3: 'Main Dishes',
  4: 'Side Dishes',
  5: 'Sundries',
  6: 'Rice',
  7: 'Naan Breads'
};

// Curry type subcategories
const CURRY_TYPES = [
  'Korma', 'Madras', 'Vindaloo', 'Jalfrezi', 'Bhuna', 'Rogan Josh', 
  'Pathia', 'Dansak', 'Dupiaza', 'Karahi', 'Malaya', 'Kashmir', 
  'Jeerajal', 'Ceylon', 'Sagwala', 'Noorangi', 'Garlic Chilli'
];

export default function OrderScreen() {
  const { tableNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { peopleCount, existingOrderId } = location.state || { peopleCount: 1, existingOrderId: null };

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrinksDetail, setShowDrinksDetail] = useState(false);

  useEffect(() => {
    fetchMenu();
    if (existingOrderId) {
      loadExistingOrder(existingOrderId);
    } else {
      checkExistingOrder();
    }
  }, []);

  const loadExistingOrder = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      if (response.data) {
        setOrderId(response.data.id);
        setCart(response.data.items);
        setKitchenPrinted(response.data.kitchen_printed);
      }
    } catch (error) {
      toast.error('Failed to load order');
    }
  };

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
    'Soft Drinks',
    'Beers',
    'Set Meals',
    'Starters',
    'Tandoori Main Dishes',
    'Biryani',
    'Traditional Curries',
    'Red Rose Chef\'s Specialities',
    'Exquisite Mild Blended Dishes',
    'Balti Dishes',
    'Vegetable Main Dishes',
    'English Dishes',
    'Vegetable Side Dishes',
    'Sundries',
    'Rice',
    'Naan Breads',
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
      category: selectedItem.category,
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

  // Group cart items by display category
  const getGroupedCartItems = () => {
    const grouped = {};
    cart.forEach(item => {
      const orderNum = CATEGORY_ORDER[item.category] || 8;
      if (!grouped[orderNum]) {
        grouped[orderNum] = [];
      }
      grouped[orderNum].push(item);
    });
    return grouped;
  };

  const getDrinksTotal = () => {
    const drinks = cart.filter(item => 
      item.category === 'Soft Drinks' || item.category === 'Beers'
    );
    return drinks.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const getDrinksItems = () => {
    return cart.filter(item => 
      item.category === 'Soft Drinks' || item.category === 'Beers'
    );
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
          bill_type: 'one',
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
          bill_type: 'one',
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
    if (cart.length === 0) {
      toast.error('No items in order');
      return;
    }

    try {
      let currentOrderId = orderId;

      if (!currentOrderId) {
        // Create new order
        const response = await axios.post(`${API}/orders`, {
          table_number: parseInt(tableNumber),
          people_count: peopleCount,
          items: cart,
          order_notes: '',
        });
        currentOrderId = response.data.id;
      } else {
        // Update existing order
        await axios.patch(`${API}/orders/${currentOrderId}`, {
          items: cart,
        });
      }

      toast.success('Order saved!');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      toast.error('Failed to save order');
    }
  };

  const handleCloseTable = async () => {
    if (!orderId) {
      toast.error('No active order');
      return;
    }

    try {
      await axios.post(`${API}/orders/${orderId}/complete`);
      toast.success('Table closed!');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      toast.error('Failed to close table');
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

  // Get curry types from Traditional Curries category
  const getCurryTypeItems = (curryType) => {
    return menu.filter(item => 
      item.category === 'Traditional Curries' && 
      item.name.includes(curryType) &&
      item.available &&
      (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  // Filter menu items by search
  const getFilteredMenuItems = (category) => {
    return menu.filter(item => 
      item.category === category && 
      item.available &&
      (searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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
                {peopleCount} {peopleCount === 1 ? 'Person' : 'People'}
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
        {/* Search Bar */}
        <Card className="p-4 mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </Card>

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
              {category === 'Traditional Curries' ? (
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {CURRY_TYPES.map(curryType => {
                    const items = getCurryTypeItems(curryType);
                    if (items.length === 0) return null;
                    return (
                      <AccordionItem key={curryType} value={curryType} className="border rounded-lg px-4 bg-white">
                        <AccordionTrigger className="text-lg font-semibold text-gray-900 hover:no-underline">
                          {curryType} <Badge className="ml-2 bg-red-100 text-red-600">{items.length}</Badge>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="menu-grid pt-4">
                            {items.map((item) => (
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
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              ) : (
                <div className="menu-grid">
                  {getFilteredMenuItems(category).map((item) => (
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
              )}
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
            <DialogTitle className="text-2xl">Current Order - Table {tableNumber}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No items in cart</div>
            ) : (
              <div className="space-y-4">
                {Object.keys(CATEGORY_DISPLAY_NAMES).sort((a, b) => parseInt(a) - parseInt(b)).map(orderNum => {
                  const groupedItems = getGroupedCartItems();
                  if (!groupedItems[orderNum] || groupedItems[orderNum].length === 0) return null;
                  
                  const categoryName = CATEGORY_DISPLAY_NAMES[orderNum];
                  
                  // Special handling for drinks
                  if (orderNum === '2') {
                    const drinksTotal = getDrinksTotal();
                    const drinkItems = getDrinksItems();
                    if (drinkItems.length === 0) return null;
                    
                    return (
                      <div key={orderNum} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{categoryName}</h3>
                          <span className="font-bold text-red-600">£{drinksTotal.toFixed(2)}</span>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowDrinksDetail(!showDrinksDetail)}
                          className="w-full mb-2 border-red-200"
                        >
                          {showDrinksDetail ? 'Hide' : 'View'} Details <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                        {showDrinksDetail && (
                          <div className="space-y-2 pl-4">
                            {drinkItems.map((item, index) => {
                              const actualIndex = cart.indexOf(item);
                              return (
                                <Card key={actualIndex} className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-sm text-gray-900">{item.name}</h4>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeCartItem(actualIndex)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateCartItemQuantity(actualIndex, -1)}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="font-semibold w-6 text-center text-sm">
                                        {item.quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => updateCartItemQuantity(actualIndex, 1)}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <span className="font-semibold text-sm text-gray-900">
                                      £{(item.quantity * item.price).toFixed(2)}
                                    </span>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={orderNum} className="mb-4">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{categoryName}</h3>
                      <div className="space-y-2">
                        {groupedItems[orderNum].map((item, index) => {
                          const actualIndex = cart.indexOf(item);
                          return (
                            <Card key={actualIndex} data-testid={`cart-item-${actualIndex}`} className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                  {item.notes && <p className="text-sm text-gray-500 italic mt-1">{item.notes}</p>}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCartItem(actualIndex)}
                                  data-testid={`remove-item-${actualIndex}`}
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
                                    onClick={() => updateCartItemQuantity(actualIndex, -1)}
                                    data-testid={`decrease-cart-item-${actualIndex}`}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="font-semibold w-8 text-center" data-testid={`cart-item-quantity-${actualIndex}`}>
                                    {item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateCartItemQuantity(actualIndex, 1)}
                                    data-testid={`increase-cart-item-${actualIndex}`}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  £{(item.quantity * item.price).toFixed(2)}
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                disabled={cart.length === 0}
                data-testid="complete-order-button"
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete
              </Button>
            </div>
            {orderId && (
              <Button
                onClick={handleCloseTable}
                variant="outline"
                className="w-full mt-2 border-red-500 text-red-600 hover:bg-red-50"
              >
                Close Table & Finish Order
              </Button>
            )}
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
