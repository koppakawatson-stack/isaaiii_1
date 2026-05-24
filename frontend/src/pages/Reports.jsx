import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { leadService } from '../services/leadService';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Download, FileSpreadsheet, Printer, Sparkles, SlidersHorizontal, Plus, Edit3, Trash2, X, AlertCircle } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#a855f7', '#f59e0b', '#ef4444'];

function Reports() {
  const { user } = useAuth();
  
  // Leads & stats data
  const [leads, setLeads] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Products Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Machinery',
    price: '',
    availability: true,
    description: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const leadsRes = await leadService.getAll();
      if (leadsRes.success) {
        setLeads(leadsRes.data);
      }
      
      const productsRes = await api.get('/products');
      if (productsRes.success) {
        setProducts(productsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve reports data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate Lead Source percentages
  const getLeadSourceData = () => {
    const sources = { Website: 0, Referral: 0, Exhibition: 0, ColdCall: 0, Others: 0 };
    leads.forEach(l => {
      const src = l.leadSource || 'Website';
      const key = src === 'Cold Call' ? 'ColdCall' : src;
      if (sources[key] !== undefined) {
        sources[key]++;
      } else {
        sources.Others++;
      }
    });

    const total = leads.length || 1;
    return [
      { name: 'Website', value: sources.Website, percentage: Math.round((sources.Website / total) * 100) },
      { name: 'Referral', value: sources.Referral, percentage: Math.round((sources.Referral / total) * 100) },
      { name: 'Exhibition', value: sources.Exhibition, percentage: Math.round((sources.Exhibition / total) * 100) },
      { name: 'Cold Call', value: sources.ColdCall, percentage: Math.round((sources.ColdCall / total) * 100) },
      { name: 'Others', value: sources.Others, percentage: Math.round((sources.Others / total) * 100) }
    ].filter(item => item.value > 0);
  };

  const leadSourceData = getLeadSourceData();

  // Export Leads to CSV
  const handleExportCsv = () => {
    if (leads.length === 0) return alert('No leads data to export.');
    
    // CSV headers
    const headers = ['Company Name', 'Contact Person', 'Email', 'Phone', 'Deal Amount ($)', 'Status', 'Priority', 'Lead Source', 'Expected Closing Date', 'AI Score (%)'];
    
    // CSV rows
    const rows = leads.map(l => [
      `"${l.companyName.replace(/"/g, '""')}"`,
      `"${l.contactPerson.replace(/"/g, '""')}"`,
      l.email,
      l.phone || '',
      l.dealAmount,
      l.status,
      l.priority || 'Medium',
      l.leadSource || 'Website',
      l.expectedClosingDate ? new Date(l.expectedClosingDate).toLocaleDateString() : '',
      l.aiScore || 50
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BDA_Leads_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Product CRUD Handlers
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Machinery',
      price: '',
      availability: true,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price: p.price,
      availability: p.availability,
      description: p.description || ''
    });
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price) || 0
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.success) {
          setProducts(products.map(p => p._id === editingProduct._id ? res.data : p));
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.success) {
          setProducts([res.data, ...products]);
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Product update failed');
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Delete this product entry?')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      if (res.success) {
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">Reports & Catalog</h1>
          <p className="text-slate-550 text-sm">Download spreadsheets, print analytics reports, and manage manufacturing product specifications.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition cursor-pointer text-xs shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl transition cursor-pointer text-xs shadow-sm"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></span>
            <span className="text-slate-500 text-sm font-semibold">Generating analytics tables...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Lead Source Analysis Donut Chart */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-80 lg:col-span-1 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Lead Source Analysis</h3>
            
            <div className="h-44 w-full relative">
              {leadSourceData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  No lead source records logged.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leadSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      formatter={(value, name, props) => [`${value} leads (${props.payload.percentage}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2 border-t border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
              {leadSourceData.map((item, idx) => (
                <span key={item.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                  {item.name} ({item.percentage}%)
                </span>
              ))}
            </div>
          </div>

          {/* Right: Manufacturing Products inventory */}
          <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col justify-between p-5 shadow-sm min-h-80">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Manufacturing Product Catalog</h3>
              {user.role !== 'BDA' && (
                <button
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-550 text-white font-bold rounded-xl transition cursor-pointer text-xs shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Product</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto flex-grow max-h-60 scrollbar-thin">
              <table className="w-full border-collapse text-left text-xs text-slate-650">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-550 font-bold uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3">Availability</th>
                    {user.role !== 'BDA' && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-bold text-slate-800">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-450 font-normal mt-0.5 line-clamp-1">{p.description}</div>
                      </td>
                      <td className="p-3 font-semibold text-slate-600">{p.category}</td>
                      <td className="p-3 font-bold text-slate-800">${p.price.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          p.availability 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-red-50 text-red-650 border-red-100'
                        }`}>
                          {p.availability ? 'Available' : 'Out of stock'}
                        </span>
                      </td>
                      {user.role !== 'BDA' && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                              title="Edit product spec"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleProductDelete(p._id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-slate-550 hover:text-red-650 transition cursor-pointer"
                              title="Delete product spec"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product Spec Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-850 mb-5 select-none">
              {editingProduct ? 'Modify Product Specifications' : 'Add Product to Catalog'}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Name</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Laser Cutter LC-3015"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                  >
                    <option value="Machinery">Machinery</option>
                    <option value="Tooling">Tooling</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Electrical">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Unit Price ($)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="85000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Product Availability</label>
                <select
                  value={productForm.availability}
                  onChange={(e) => setProductForm({ ...productForm, availability: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm cursor-pointer font-semibold"
                >
                  <option value="true">Available</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Provide units, capabilities, or physical description..."
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition text-slate-800 text-sm placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-650 text-sm font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-sm cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  Save spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
