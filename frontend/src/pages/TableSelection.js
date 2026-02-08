import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Flower2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TABLES = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 16, 17];

export default function TableSelection() {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [peopleCount, setPeopleCount] = useState('');
  const [activeTables, setActiveTables] = useState({});

  useEffect(() => {
    fetchActiveTables();
    const interval = setInterval(fetchActiveTables, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTables = async () => {
    try {
      const response = await axios.get(`${API}/orders/active`);
      const activeTableMap = {};
      response.data.forEach(order => {
        activeTableMap[order.table_number] = order.id;
      });
      setActiveTables(activeTableMap);
    } catch (error) {
      console.log('Failed to fetch active tables');
    }
  };

  const handleTableSelect = async (tableNum) => {
    // Check if table has active order
    if (activeTables[tableNum]) {
      // Navigate directly to existing order
      navigate(`/order/${tableNum}`, {
        state: { existingOrderId: activeTables[tableNum] }
      });
    } else {
      // Show people count dialog for new order
      setSelectedTable(tableNum);
      setShowDialog(true);
    }
  };

  const handleContinue = () => {
    if (peopleCount && parseInt(peopleCount) > 0) {
      navigate(`/order/${selectedTable}`, {
        state: { peopleCount: parseInt(peopleCount) }
      });
    }
  };

  const goToAdmin = () => {
    navigate('/admin');
  };

  return (
    <div className="min-h-screen rose-pattern p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Flower2 className="w-16 h-16 text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-2" data-testid="restaurant-name">
            Red Rose Restaurant
          </h1>
          <p className="text-lg text-gray-600">Staff Ordering System</p>
        </div>

        {/* Admin Button */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={goToAdmin}
            data-testid="admin-button"
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            Admin Dashboard
          </Button>
        </div>

        {/* Table Grid */}
        <Card className="p-8 shadow-lg border-red-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Select Table</h2>
          <div className="table-grid">
            {TABLES.map((table) => (
              <Button
                key={table}
                onClick={() => handleTableSelect(table)}
                data-testid={`table-${table}-button`}
                className="h-24 text-2xl font-bold bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 hover:scale-105 transition-all shadow-sm"
                variant="outline"
              >
                {table}
              </Button>
            ))}
          </div>
        </Card>

        {/* People Count Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent data-testid="people-count-dialog">
            <DialogHeader>
              <DialogTitle className="text-2xl">Table {selectedTable} Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div>
                <Label htmlFor="people-count" className="text-base mb-2 block">
                  Number of People *
                </Label>
                <Input
                  id="people-count"
                  type="number"
                  min="1"
                  placeholder="Enter number of people"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                  data-testid="people-count-input"
                  className="text-lg h-12"
                />
              </div>

              <Button
                onClick={handleContinue}
                disabled={!peopleCount || parseInt(peopleCount) < 1}
                data-testid="continue-button"
                className="w-full h-12 text-lg bg-red-500 hover:bg-red-600"
              >
                Continue to Menu
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}