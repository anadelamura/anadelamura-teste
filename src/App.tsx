/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  TrendingUp,
  Tag,
  Search,
  Filter,
  CreditCard,
  ChevronRight,
  TrendingDown,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Types
interface Account {
  id: string;
  description: string;
  value: number;
  dueDate: string;
  category: string;
  status: 'pending' | 'paid';
}

const CATEGORIES = [
  'Aluguel',
  'Energia',
  'Água',
  'Internet',
  'Alimentação',
  'Lazer',
  'Saúde',
  'Educação',
  'Outros'
];

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
  const [showForm, setShowForm] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('gestor_contas_pagar');
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load accounts', e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('gestor_contas_pagar', JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value || !dueDate) return;

    const newAccount: Account = {
      id: crypto.randomUUID(),
      description,
      value: parseFloat(value),
      dueDate,
      category,
      status: 'pending',
    };

    setAccounts([newAccount, ...accounts]);
    setDescription('');
    setValue('');
    setDueDate('');
    setCategory(CATEGORIES[0]);
    setShowForm(false);
  };

  const deleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const toggleStatus = (id: string) => {
    setAccounts(accounts.map(a => 
      a.id === id ? { ...a, status: a.status === 'pending' ? 'paid' : 'pending' } : a
    ));
  };

  // Calculations
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    return accounts.reduce((acc, curr) => {
      acc.total += curr.value;
      if (curr.status === 'paid') {
        acc.paid += curr.value;
      } else {
        acc.pending += curr.value;
        if (isAfter(today, parseISO(curr.dueDate))) {
          acc.overdue += curr.value;
        }
      }
      return acc;
    }, { total: 0, paid: 0, pending: 0, overdue: 0 });
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter(a => {
        const matchesSearch = a.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             a.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [accounts, searchTerm, filterStatus]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-[#3d3d33] font-sans p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="bg-[#fdfdfb] p-8 md:px-10 md:py-8 rounded-[32px] border border-[#dcdccf] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-serif italic text-[#5a5a40]">
              Folha & Fluxo
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5a5a40]"></span>
              <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#5a5a40] hover:bg-[#4a4a35] text-white px-8 py-3.5 rounded-full transition-all active:scale-95 shadow-md font-medium w-full md:w-auto justify-center"
            id="add-account-btn"
          >
            {showForm ? 'Fechar Cadastro' : <><Plus size={20} /> Registrar Conta</>}
          </button>
        </header>

        {/* Stats Dashboard */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="stats-dashboard">
          <StatCard 
            title="Total Geral" 
            amount={stats.total} 
            icon={<DollarSign size={20} className="text-[#5a5a40]" />} 
            color="bg-[#f5f5f0]"
          />
          <StatCard 
            title="Pendente" 
            amount={stats.pending} 
            icon={<Clock size={20} className="text-[#5a5a40]" />} 
            color="bg-[#f5f5f0]"
          />
          <StatCard 
            title="Pago" 
            amount={stats.paid} 
            icon={<CheckCircle2 size={20} className="text-[#4a7c59]" />} 
            color="bg-[#f0f4ef]"
          />
          <StatCard 
            title="Vencido" 
            amount={stats.overdue} 
            icon={<AlertCircle size={20} className="text-[#8c4b3e]" />} 
            color="bg-[#fdf5f3]"
          />
        </section>

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Left Column: Form & Filters */}
          <aside className="w-full lg:w-80 shrink-0 space-y-8">
            
            <AnimatePresence>
              {showForm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[32px] p-8 shadow-sm border border-[#e5e5d5]"
                >
                  <h3 className="text-lg font-serif italic mb-6 text-[#5a5a40]">Nova Conta</h3>
                  <form onSubmit={addAccount} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-wider opacity-60 font-bold ml-1">Descrição</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Aluguel, Internet..."
                        className="w-full bg-[#fcfcf9] border border-[#e5e5d5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5a5a40] transition-colors placeholder:text-gray-300"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-wider opacity-60 font-bold ml-1">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="0,00"
                        className="w-full bg-[#fcfcf9] border border-[#e5e5d5] rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#5a5a40] transition-colors placeholder:text-gray-300"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-wider opacity-60 font-bold ml-1">Vencimento</label>
                      <input 
                        type="date" 
                        className="w-full bg-[#fcfcf9] border border-[#e5e5d5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5a5a40] transition-colors"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[11px] uppercase tracking-wider opacity-60 font-bold ml-1">Categoria</label>
                      <select 
                        className="w-full bg-[#fcfcf9] border border-[#e5e5d5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#5a5a40] appearance-none cursor-pointer"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-[#5a5a40] text-white py-4 rounded-full font-medium hover:bg-[#4a4a35] transition-all active:scale-95 shadow-sm mt-2"
                    >
                      Cadastrar
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-[#e5e5d5] space-y-8">
              <div className="space-y-3">
                <h3 className="text-[11px] uppercase tracking-wider opacity-60 font-bold ml-1">Busca</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a40] opacity-40" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filtrar por nome..."
                    className="w-full bg-[#fcfcf9] border border-[#e5e5d5] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#5a5a40] transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-[11px] uppercase tracking-wider opacity-60 font-bold ml-1">Status</h3>
                <div className="flex flex-col gap-1.5">
                  <FilterButton 
                    active={filterStatus === 'all'} 
                    onClick={() => setFilterStatus('all')}
                    label="Todos os registros"
                    count={accounts.length}
                  />
                  <FilterButton 
                    active={filterStatus === 'pending'} 
                    onClick={() => setFilterStatus('pending')}
                    label="Pagamentos em aberto"
                    count={accounts.filter(a => a.status === 'pending').length}
                  />
                  <FilterButton 
                    active={filterStatus === 'paid'} 
                    onClick={() => setFilterStatus('paid')}
                    label="Registros quitados"
                    count={accounts.filter(a => a.status === 'paid').length}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: List */}
          <main className="flex-1 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-xl font-serif italic text-[#5a5a40]">Listagem de Fluxo</h2>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-[#e5e5d5] px-3 py-1 rounded-full text-[#5a5a40]">
                {filteredAccounts.length} Registros
              </span>
            </div>

            <div className="bg-white rounded-[32px] border border-[#e5e5d5] shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fcfcf9] border-b border-[#f5f5f0]">
                      <th className="px-8 py-5 text-[11px] uppercase tracking-widest opacity-50 font-bold">Vencimento</th>
                      <th className="px-8 py-5 text-[11px] uppercase tracking-widest opacity-50 font-bold">Descrição</th>
                      <th className="px-8 py-5 text-[11px] uppercase tracking-widest opacity-50 font-bold">Status</th>
                      <th className="px-8 py-5 text-[11px] uppercase tracking-widest opacity-50 font-bold text-right">Valor</th>
                      <th className="px-8 py-5 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f0]">
                    <AnimatePresence mode="popLayout">
                      {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => (
                          <motion.tr
                            layout
                            key={account.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="group hover:bg-[#fafaf7] transition-colors"
                          >
                            <td className="px-8 py-6 text-sm font-medium whitespace-nowrap">
                              {format(parseISO(account.dueDate), "dd 'de' MMM")}
                            </td>
                            <td className="px-8 py-6">
                              <span className={`text-sm block font-medium ${account.status === 'paid' ? 'text-[#86868B] line-through' : 'text-[#3d3d33]'}`}>
                                {account.description}
                              </span>
                              <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider">{account.category}</span>
                            </td>
                            <td className="px-8 py-6">
                              <button 
                                onClick={() => toggleStatus(account.id)}
                                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                                  account.status === 'paid' 
                                    ? 'bg-[#f0f4ef] text-[#4a7c59]' 
                                    : isAfter(startOfDay(new Date()), parseISO(account.dueDate))
                                      ? 'bg-[#fdf5f3] text-[#8c4b3e]'
                                      : 'bg-[#f5f5f0] text-[#5a5a40]'
                                }`}
                              >
                                {account.status === 'paid' ? 'Confirmado' : isAfter(startOfDay(new Date()), parseISO(account.dueDate)) ? 'Atrasado' : 'Pendente'}
                              </button>
                            </td>
                            <td className="px-8 py-6 text-sm text-right font-serif italic text-lg whitespace-nowrap">
                              {formatCurrency(account.value)}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button 
                                onClick={() => deleteAccount(account.id)}
                                className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-[#8c4b3e] rounded-lg transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-24">
                            <p className="text-gray-300 font-serif italic text-lg">O fluxo está limpo por enquanto.</p>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
              
              {/* Table Footer Summary */}
              <div className="bg-[#fcfcf9] px-8 py-6 border-t border-[#f5f5f0] flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold opacity-40 tracking-wider">
                  {filteredAccounts.length} registros exibidos
                </span>
                <div className="flex items-center gap-6">
                  <span className="text-[11px] uppercase font-bold opacity-60 tracking-wider">Subtotal</span>
                  <span className="text-2xl font-serif italic text-[#5a5a40]">
                    {formatCurrency(filteredAccounts.reduce((sum, a) => sum + a.value, 0))}
                  </span>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer Decorative */}
      <footer className="mt-12 py-8 flex flex-col items-center justify-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#5a5a40] opacity-40"></div>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold text-center">
            Consistência no fluxo de caixa é a base da prosperidade
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#5a5a40] opacity-40"></div>
        </div>
      </footer>
    </div>
  );
}

// Subcomponents
function StatCard({ title, amount, icon, color }: { title: string, amount: number, icon: React.ReactNode, color: string }) {
  return (
    <div className={`bg-white p-6 rounded-[32px] border border-[#e5e5d5] shadow-sm space-y-4`}>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider opacity-50 font-bold ml-1">{title}</p>
        <p className="text-2xl font-serif italic text-[#3d3d33] tracking-tight">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)}
        </p>
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, label, count }: { active: boolean, onClick: () => void, label: string, count: number }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center justify-between px-5 py-3 rounded-2xl text-[12px] font-medium transition-all border ${
        active 
          ? 'bg-[#5a5a40] text-white border-[#5a5a40] shadow-sm' 
          : 'bg-transparent text-[#3d3d33] border-transparent hover:bg-[#fcfcf9] hover:border-[#e5e5d5]'
      }`}
    >
      <span className={active ? 'opacity-100' : 'opacity-70'}>{label}</span>
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${active ? 'bg-white/20' : 'bg-[#f5f5f0] text-[#5a5a40]'}`}>
        {count}
      </span>
    </button>
  );
}

