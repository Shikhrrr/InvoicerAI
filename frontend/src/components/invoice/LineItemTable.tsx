import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { InvoiceItem, InvoiceItemCreate } from '../../types/invoice';
import { Button } from '../common/Button';

interface LineItemTableProps {
  items: InvoiceItem[];
  isEditable?: boolean;
  onAddItem?: (item: InvoiceItemCreate) => Promise<void>;
  onUpdateItem?: (itemId: string, data: Partial<InvoiceItemCreate>) => Promise<void>;
  onDeleteItem?: (itemId: string) => Promise<void>;
}

export const LineItemTable: React.FC<LineItemTableProps> = ({
  items,
  isEditable = false,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}) => {
  // Editing state for an existing item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<InvoiceItemCreate>({
    product_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
  });

  // Adding state for a new item
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newForm, setNewForm] = useState<InvoiceItemCreate>({
    product_name: '',
    quantity: 1,
    unit_price: 0,
    total_price: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (item: InvoiceItem) => {
    setEditingItemId(item.id);
    const qty = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
    const price = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price;
    setEditForm({
      product_name: item.product_name,
      quantity: qty || 1,
      unit_price: price || 0,
      total_price: Number(((qty || 1) * (price || 0)).toFixed(2)),
    });
  };

  const handleEditChange = (field: keyof InvoiceItemCreate, value: any) => {
    setEditForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? parseFloat(value) || 0 : prev.quantity;
        const price = field === 'unit_price' ? parseFloat(value) || 0 : prev.unit_price;
        updated.total_price = Number((qty * price).toFixed(2));
      }
      return updated;
    });
  };

  const saveEdit = async (itemId: string) => {
    if (!onUpdateItem) return;
    setIsSubmitting(true);
    try {
      await onUpdateItem(itemId, editForm);
      setEditingItemId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewChange = (field: keyof InvoiceItemCreate, value: any) => {
    setNewForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? parseFloat(value) || 0 : prev.quantity;
        const price = field === 'unit_price' ? parseFloat(value) || 0 : prev.unit_price;
        updated.total_price = Number((qty * price).toFixed(2));
      }
      return updated;
    });
  };

  const saveNew = async () => {
    if (!onAddItem || !newForm.product_name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddItem(newForm);
      setNewForm({ product_name: '', quantity: 1, unit_price: 0, total_price: 0 });
      setIsAddingNew(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(num || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-700">
          Line Items ({items.length})
        </h4>
        {isEditable && !isAddingNew && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingNew(true)}
            className="text-xs py-1 font-heading font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Item</span>
          </Button>
        )}
      </div>

      <div className="border-2 border-slate-900 rounded-lg overflow-x-auto bg-white shadow-[2px_2px_0px_#0f172a]">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-blue-50 border-b-2 border-slate-900 text-slate-900 uppercase font-heading font-bold tracking-wider">
              <th className="py-2.5 px-3">Item / Description</th>
              <th className="py-2.5 px-3 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              {isEditable && <th className="py-2.5 px-3 text-center w-20">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-dashed divide-slate-200 text-slate-800">
            {items.map((item) => {
              const isEditing = editingItemId === item.id;

              if (isEditing) {
                return (
                  <tr key={item.id} className="bg-yellow-50/70">
                    <td className="p-2">
                      <input
                        type="text"
                        value={editForm.product_name}
                        onChange={(e) => handleEditChange('product_name', e.target.value)}
                        className="w-full px-2 py-1 text-xs border-2 border-slate-900 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={editForm.quantity}
                        onChange={(e) => handleEditChange('quantity', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 text-xs border-2 border-slate-900 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={editForm.unit_price}
                        onChange={(e) => handleEditChange('unit_price', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 text-xs border-2 border-slate-900 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-2 text-right font-bold">
                      {formatCurrency(editForm.total_price)}
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => saveEdit(item.id)}
                          disabled={isSubmitting}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md border border-slate-900 shadow-[1px_1px_0px_#0f172a]"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="p-1 text-slate-500 hover:bg-slate-200 rounded-md border border-slate-900 shadow-[1px_1px_0px_#0f172a]"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-900">
                    {item.product_name}
                  </td>
                  <td className="py-2.5 px-3 text-right">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(item.total_price)}
                  </td>
                  {isEditable && (
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {onDeleteItem && (
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {/* Add New Line Item Row */}
            {isAddingNew && (
              <tr className="bg-yellow-50/80 border-t-2 border-slate-900">
                <td className="p-2">
                  <input
                    type="text"
                    autoFocus
                    value={newForm.product_name}
                    onChange={(e) => handleNewChange('product_name', e.target.value)}
                    className="w-full px-2 py-1 text-xs border-2 border-slate-900 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="E.g., Parle-G Biscuit 250g"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={newForm.quantity}
                    onChange={(e) => handleNewChange('quantity', parseFloat(e.target.value))}
                    className="w-16 px-2 py-1 text-xs border-2 border-slate-900 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </td>
                <td className="p-2 text-right">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newForm.unit_price}
                    onChange={(e) => handleNewChange('unit_price', parseFloat(e.target.value))}
                    className="w-20 px-2 py-1 text-xs border-2 border-slate-900 rounded-md bg-white text-right focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </td>
                <td className="p-2 text-right font-bold">
                  {formatCurrency(newForm.total_price)}
                </td>
                <td className="p-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={saveNew}
                      disabled={isSubmitting || !newForm.product_name.trim()}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded-md border border-slate-900 shadow-[1px_1px_0px_#0f172a]"
                      title="Add Item"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="p-1 text-slate-500 hover:bg-slate-200 rounded-md border border-slate-900 shadow-[1px_1px_0px_#0f172a]"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {items.length === 0 && !isAddingNew && (
              <tr>
                <td colSpan={isEditable ? 5 : 4} className="py-6 text-center text-slate-500 font-sans">
                  Koi line items nahi hain. Aap naya item jod sakte hain.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
