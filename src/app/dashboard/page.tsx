'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Ticket, Calendar, QrCode, BarChart3, Plus, Loader2, MapPin } from 'lucide-react';
import api from '@/lib/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  tickets: {
    id: string;
    qrCodeHash: string;
    isUsed: boolean;
    tier: {
      name: string;
      price: number;
      event: {
        id: string;
        title: string;
        startDate: string;
        venue: string;
        coverImageUrl?: string;
        category: string;
      };
    };
  }[];
}

const CATEGORY_IMAGES: Record<string, string> = {
  MUSIC: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
  BUSINESS: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
  CONFERENCE: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=80',
  SPORTS: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80',
  ART: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80',
  FOOD: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  OTHER: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
};

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'events'>('tickets');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/users/me/tickets')
        .then(res => setOrders(res.data.data || []))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }
  }, [isAuthenticated]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  const totalTickets = orders.reduce((acc, o) => acc + o.tickets.length, 0);
  const upcomingEvents = orders.filter(o =>
    o.tickets.some(t => new Date(t.tier.event.startDate) > new Date())
  ).length;
  const totalSpent = orders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const scannedTickets = orders.reduce((acc, o) => acc + o.tickets.filter(t => t.isUsed).length, 0);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* HEADER */}
      <div className="border-b py-8" style={{ background: 'var(--bg2)', borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--accent)' }}>Welcome back</p>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--accent)' }}>{user?.email}</p>
            </div>
            <Link href="/events/create"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              <Plus size={16} /> Create Event
            </Link>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Tickets', value: totalTickets, icon: <Ticket size={20} />, color: '#5cb87a' },
              { label: 'Upcoming Events', value: upcomingEvents, icon: <Calendar size={20} />, color: 'var(--text-bright)' },
              { label: 'Amount Spent', value: `₦${totalSpent.toLocaleString()}`, icon: <BarChart3 size={20} />, color: '#9BA8AB' },
              { label: 'Tickets Scanned', value: scannedTickets, icon: <QrCode size={20} />, color: '#e05555' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--accent)' }}>{stat.label}</p>
                  <div style={{ color: stat.color }}>{stat.icon}</div>
                </div>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: 'var(--bg2)' }}>
          {(['tickets', 'events'] as const).map(tab => (
            <button key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-md text-sm font-semibold transition-all capitalize"
              style={{
                background: activeTab === tab ? 'var(--text-bright)' : 'transparent',
                color: activeTab === tab ? 'var(--bg)' : 'var(--accent)',
              }}>
              My {tab}
            </button>
          ))}
        </div>

        {/* MY TICKETS */}
        {activeTab === 'tickets' && (
          orders.length === 0 ? (
            <div className="text-center py-20">
              <Ticket size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
              <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>No tickets yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>Browse events and grab your first ticket</p>
              <Link href="/events" className="inline-block font-bold text-sm px-6 py-3 rounded-lg"
                style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order =>
                order.tickets.map(ticket => {
                  const event = ticket.tier.event;
                  const image = event.coverImageUrl || CATEGORY_IMAGES[event.category] || CATEGORY_IMAGES.OTHER;
                  const isPast = new Date(event.startDate) < new Date();
                  return (
                    <div key={ticket.id} className="rounded-xl border overflow-hidden flex"
                      style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                      <div className="relative w-32 flex-shrink-0">
                        <img src={image} alt={event.title} className="w-full h-full object-cover opacity-70" />
                        {isPast && (
                          <div className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(6,20,27,0.7)' }}>
                            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>PAST</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold mb-1" style={{ color: 'var(--text-bright)' }}>{event.title}</p>
                            <p className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                              <Calendar size={10} />
                              {new Date(event.startDate).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                              <MapPin size={10} /> {event.venue}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-block text-xs px-2 py-1 rounded-full mb-2"
                              style={{
                                background: ticket.isUsed ? 'rgba(224,85,85,0.1)' : 'rgba(92,184,122,0.1)',
                                color: ticket.isUsed ? '#e05555' : '#5cb87a',
                              }}>
                              {ticket.isUsed ? 'Used' : 'Valid'}
                            </span>
                            <p className="text-xs" style={{ color: 'var(--accent)' }}>{ticket.tier.name}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center px-4 border-l" style={{ borderColor: 'var(--border)' }}>
                        <QrCode size={32} style={{ color: ticket.isUsed ? 'var(--accent)' : 'var(--text-bright)' }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        )}

        {/* MY EVENTS */}
        {activeTab === 'events' && (
          <div className="text-center py-20">
            <Calendar size={48} className="mx-auto mb-4" style={{ color: 'var(--accent)' }} />
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-bright)' }}>No events created yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--accent)' }}>Start hosting your own events</p>
            <Link href="/events/create"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-lg"
              style={{ background: 'var(--text-bright)', color: 'var(--bg)' }}>
              <Plus size={16} /> Create Your First Event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
