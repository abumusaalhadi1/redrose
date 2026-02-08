import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Flower2 } from 'lucide-react';

const TABLES = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 16, 17];

export default function TableSelection() {
  const navigate = useNavigate();
  const [selectedTable, setSelectedTable] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [peopleCount, setPeopleCount] = useState('');

  const handleTableSelect = (tableNum) => {
    setSelectedTable(tableNum);
    setShowDialog(true);
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

              <div>
                <Label className="text-base mb-3 block">Bill Type</Label>
                <RadioGroup value={billType} onValueChange={setBillType} data-testid="bill-type-radio">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="one" id="one-bill" data-testid="one-bill-radio" />
                    <Label htmlFor="one-bill" className="flex-1 cursor-pointer">
                      One Bill
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="split" id="split-bill" data-testid="split-bill-radio" />
                    <Label htmlFor="split-bill" className="flex-1 cursor-pointer">
                      Split Bill
                    </Label>
                  </div>
                </RadioGroup>
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