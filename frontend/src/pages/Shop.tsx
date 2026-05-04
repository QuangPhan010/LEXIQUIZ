import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  ShoppingBag, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sparkles,
  Frame,
  Palette,
  Award
} from 'lucide-react';

interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  item_type: 'FRAME' | 'THEME' | 'BADGE';
  image: string | null;
  config: any;
}

const Shop: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, invRes] = await Promise.all([
          api.get('/shop/'),
          api.get('/inventory/')
        ]);
        setItems(itemsRes.data);
        setInventory(invRes.data);
      } catch (err) {
        console.error('Failed to fetch shop data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBuy = async (itemId: number) => {
    setBuying(itemId);
    setMessage(null);
    try {
      const res = await api.post(`/shop/${itemId}/buy/`);
      setMessage({ type: 'success', text: res.data.message });
      refreshUser();
      // Update inventory
      const invRes = await api.get('/inventory/');
      setInventory(invRes.data);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Purchase failed' });
    } finally {
      setBuying(null);
    }
  };

  const isOwned = (itemId: number) => {
    return inventory.some(inv => inv.item.id === itemId);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="h-12 w-12 animate-spin border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-mesh text-slate-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center space-x-6">
            <div className="h-16 w-16 rounded-[2rem] bg-gradient-to-tr from-primary-600 to-accent-violet flex items-center justify-center text-white shadow-2xl shadow-primary-500/20">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">LexiShop</h1>
              <p className="text-slate-500 font-medium">Sắm ngay vật phẩm 'xịn xò' để nâng tầm hồ sơ của bạn!</p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-4 px-8 rounded-[2rem] shadow-xl flex items-center space-x-4">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ví tiền</p>
              <p className="text-2xl font-black text-slate-900">{user?.coins || 0} Xu</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-8 p-6 rounded-3xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-4 ${
            message.type === 'success' ? 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20' : 'bg-rose-50 text-rose-500 border border-rose-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
            <span className="font-bold">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.length > 0 ? (
            items.map((item) => {
              const owned = isOwned(item.id);
              const canAfford = (user?.coins || 0) >= item.price;
              
              const icons = {
                FRAME: Frame,
                THEME: Palette,
                BADGE: Award
              };
              const IconComponent = icons[item.item_type] || Sparkles;

              return (
                <Card key={item.id} className="group overflow-hidden border-0 shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col">
                  <div className="h-48 bg-gradient-to-br from-slate-50 to-slate-100 relative flex items-center justify-center p-8 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full object-contain drop-shadow-2xl" />
                    ) : (
                      <div className="h-24 w-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary-500 group-hover:rotate-12 transition-transform duration-500">
                        <IconComponent className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.item_type}
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-black text-slate-900 mb-2">{item.name}</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center space-x-2">
                        <Coins className="h-5 w-5 text-amber-500" />
                        <span className="text-xl font-black text-slate-900">{item.price}</span>
                      </div>
                      
                      {owned ? (
                        <div className="flex items-center space-x-2 text-accent-emerald font-black">
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Đã vào kho</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleBuy(item.id)}
                          disabled={buying === item.id || !canAfford}
                          className={`rounded-2xl px-8 h-12 font-bold ${!canAfford ? 'bg-slate-200 text-slate-400' : ''}`}
                        >
                          {buying === item.id ? (
                            <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                          ) : canAfford ? (
                            'Chốt đơn!'
                          ) : (
                            <div className="flex items-center">
                              <Lock className="h-4 w-4 mr-2" />
                              Cháy túi rồi
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-200">
              <ShoppingBag className="h-16 w-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-bold text-xl">Shop đang cháy hàng.</p>
              <p className="text-slate-400">Hãy quay lại sau để xem các vật phẩm mới nhé!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Shop;
