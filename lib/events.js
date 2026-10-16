import { supabase } from './supabase';

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getPublishedEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Published events that haven't ended yet.
 * Uses end_date if available, otherwise falls back to event_date.
 */
export async function getUpcomingPublishedEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('event_date', { ascending: true });

  if (error) throw error;

  const now = new Date();
  const events = (data || []).filter((e) => {
    const dateStr = e.end_date || e.event_date;
    if (!dateStr) return true;

    const endDT = e.end_time
      ? new Date(`${dateStr}T${e.end_time}`)
      : new Date(`${dateStr}T23:59:59`);

    return endDT >= now;
  });

  return events;
}

export async function getEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function getTicketTypes(eventId) {
  const { data, error } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId)
    .order('price', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMyEvents(userId) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function publishEvent(id) {
  const { error } = await supabase
    .from('events')
    .update({ status: 'published' })
    .eq('id', id);

  if (error) throw error;
}

export async function unpublishEvent(id) {
  const { error } = await supabase
    .from('events')
    .update({ status: 'draft' })
    .eq('id', id);

  if (error) throw error;
}

export function isEventEnded(event) {
  const dateStr = event.end_date || event.event_date;
  if (!dateStr) return false;

  const endDT = event.end_time
    ? new Date(`${dateStr}T${event.end_time}`)
    : new Date(`${dateStr}T23:59:59`);

  return endDT < new Date();
}

export async function addSoldOutFlags(events) {
  if (!events || events.length === 0) return events;

  const eventIds = events.map((e) => e.id);

  const { data: tickets, error } = await supabase
    .from('ticket_types')
    .select('*')
    .in('event_id', eventIds);

  if (error) throw error;

  const byEvent = {};
  for (const t of tickets || []) {
    if (!byEvent[t.event_id]) byEvent[t.event_id] = [];
    byEvent[t.event_id].push(t);
  }

  return events.map((e) => {
    const eventTickets = byEvent[e.id] || [];

    if (eventTickets.length === 0) {
      return { ...e, soldOut: false, ended: isEventEnded(e) };
    }

    const publicTickets = eventTickets.filter((t) => !t.is_invite_only);
    const relevant = publicTickets.length > 0 ? publicTickets : eventTickets;

    const soldOut = relevant.every((t) => {
      if (!t.capacity) return false;
      const remaining = t.capacity - (t.quantity_sold || 0);
      return remaining <= 0;
    });

    return { ...e, soldOut, ended: isEventEnded(e) };
  });
}

function buildTicketRow(eventId, t, includeSold = false) {
  const isInvite = !!t.is_invite_only;
  const kind = t.ticket_kind === 'free' ? 'free' : 'paid';

  const row = {
    event_id: eventId,
    name: t.name,
    description: t.description,
    price: kind === 'paid' ? Number(t.price) || 0 : 0,
    capacity: t.capacity ? Number(t.capacity) : null,
    ticket_kind: kind,
    is_invite_only: isInvite,
    order_limit: t.order_limit ? Number(t.order_limit) : 10,
    perks: Array.isArray(t.perks) ? t.perks.filter(Boolean) : [],
    invite_password:
      isInvite && t.invite_password
        ? String(t.invite_password).trim()
        : null,
  };
  if (includeSold) row.quantity_sold = 0;
  return row;
}

export async function createEvent(eventData, tickets) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (eventError) throw eventError;

  if (tickets && tickets.length > 0) {
    const ticketRows = tickets.map((t) => buildTicketRow(event.id, t, true));

    const { error: ticketError } = await supabase
      .from('ticket_types')
      .insert(ticketRows);

    if (ticketError) throw ticketError;
  }

  return event;
}

export async function updateEvent(id, eventData, tickets) {
  const { error: eventError } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id);

  if (eventError) throw eventError;

  const { data: existing, error: existingError } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', id);

  if (existingError) throw existingError;

  const existingMap = new Map((existing || []).map((t) => [t.id, t]));
  const keptIds = new Set();

  for (const t of tickets || []) {
    const payload = buildTicketRow(id, t, false);

    if (t.id && existingMap.has(t.id)) {
      const { error } = await supabase
        .from('ticket_types')
        .update(payload)
        .eq('id', t.id);
      if (error) throw error;
      keptIds.add(t.id);
    } else {
      const { error } = await supabase
        .from('ticket_types')
        .insert([{ ...payload, quantity_sold: 0 }]);
      if (error) throw error;
    }
  }

  const toDelete = (existing || [])
    .filter((t) => !keptIds.has(t.id))
    .map((t) => t.id);

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('ticket_types')
      .delete()
      .in('id', toDelete);
    if (error) throw error;
  }
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

export async function getEventStats(eventId) {
  const { data: tickets, error: ticketError } = await supabase
    .from('ticket_types')
    .select('quantity_sold')
    .eq('event_id', eventId);

  if (ticketError) throw ticketError;

  const ticketsSold = (tickets || []).reduce(
    (sum, t) => sum + (t.quantity_sold || 0),
    0
  );

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'paid');

  if (ordersError) throw ordersError;

  const allOrders = orders || [];
  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );
  const ordersCount = allOrders.length;
  const avgOrder =
    ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

  return {
    ticketsSold,
    revenue: totalRevenue,
    ordersCount,
    avgOrder,
  };
}

export async function getEventOrders(eventId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTicketSalesBreakdown(eventId) {
  const { data: tickets, error } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;

  return (tickets || []).map((t) => ({
    id: t.id,
    name: t.name,
    price: Number(t.price || 0),
    sold: t.quantity_sold || 0,
    capacity: t.capacity || null,
    revenue: (t.quantity_sold || 0) * Number(t.price || 0),
  }));
}

export async function createTicketsForOrder(orderId, eventId, quantity) {
  const rows = [];
  for (let i = 1; i <= quantity; i++) {
    rows.push({
      order_id: orderId,
      event_id: eventId,
      ticket_number: i,
    });
  }

  const { error } = await supabase.from('tickets').insert(rows);
  if (error) throw error;
}

export async function getTicketsForOrder(orderId) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('order_id', orderId)
    .order('ticket_number', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function checkInTicket(ticketId) {
  const trimmed = String(ticketId || '').trim();
  if (!trimmed) return { status: 'invalid' };

  const { data: ticket, error: fetchError } = await supabase
    .from('tickets')
    .select('*, orders(*), events(title, event_date, event_time, location)')
    .eq('id', trimmed)
    .single();

  if (fetchError || !ticket) {
    return { status: 'not_found' };
  }

  if (ticket.checked_in) {
    return {
      status: 'already_checked_in',
      ticket,
      order: ticket.orders,
    };
  }

  const order = ticket.orders;
  if (!order || order.status !== 'paid') {
    return {
      status: 'not_paid',
      ticket,
      order,
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('tickets')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', ticket.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return {
    status: 'success',
    ticket: updated,
    order,
    ticket_number: ticket.ticket_number,
  };
}

export async function getCheckInStatsByTickets(eventId) {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*, orders(buyer_email, quantity, paystack_reference)')
    .eq('event_id', eventId);

  if (error) throw error;

  const all = tickets || [];
  const checkedIn = all.filter((t) => t.checked_in);

  const recent = checkedIn
    .slice()
    .sort(
      (a, b) =>
        new Date(b.checked_in_at || 0) - new Date(a.checked_in_at || 0)
    )
    .slice(0, 20);

  return {
    totalTickets: all.length,
    checkedInTickets: checkedIn.length,
    recent,
  };
}

export async function getCheckInPin(eventId) {
  const { data, error } = await supabase
    .from('events')
    .select('checkin_pin')
    .eq('id', eventId)
    .single();

  if (error) throw error;
  return data?.checkin_pin || null;
}

export async function setCheckInPin(eventId, pin) {
  const { error } = await supabase
    .from('events')
    .update({ checkin_pin: pin || null })
    .eq('id', eventId);

  if (error) throw error;
}

export async function checkInOrder(reference) {
  const trimmed = String(reference || '').trim();
  if (!trimmed) throw new Error('Missing reference');

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('paystack_reference', trimmed)
    .single();

  if (fetchError || !order) {
    return { status: 'not_found' };
  }

  if (order.status !== 'paid') {
    return { status: 'not_paid', order };
  }

  if (order.checked_in) {
    return { status: 'already_checked_in', order };
  }

  const { data: updated, error: updateError } = await supabase
    .from('orders')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return { status: 'success', order: updated };
}

export async function getCheckInStats(eventId) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'paid');

  if (error) throw error;

  const all = orders || [];
  const checkedIn = all.filter((o) => o.checked_in);

  const totalTickets = all.reduce((s, o) => s + (o.quantity || 0), 0);
  const checkedInTickets = checkedIn.reduce(
    (s, o) => s + (o.quantity || 0),
    0
  );

  const recent = checkedIn
    .slice()
    .sort(
      (a, b) =>
        new Date(b.checked_in_at || 0) - new Date(a.checked_in_at || 0)
    )
    .slice(0, 20);

  return {
    ordersCount: all.length,
    checkedInOrders: checkedIn.length,
    totalTickets,
    checkedInTickets,
    recent,
  };
                       }
/**
 * Get revenue grouped by day for the last N days.
 * Returns an array like:
 *   [{ date: '2026-10-01', revenue: 5000, tickets: 2 }, ...]
 * Includes every day in the range (even days with 0 revenue).
 */
export async function getRevenueByDay(eventId, days = 30) {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1)
  );

  const { data: orders, error } = await supabase
    .from('orders')
    .select('total, quantity, created_at, status')
    .eq('event_id', eventId)
    .eq('status', 'paid');

  if (error) throw error;

  // Build a map of date -> { revenue, tickets }
  const buckets = {};

  // Pre-fill all days in the range with 0
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    buckets[key] = { date: key, revenue: 0, tickets: 0 };
  }

  // Aggregate orders into buckets
  (orders || []).forEach((o) => {
    if (!o.created_at) return;
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].revenue += Number(o.total || 0);
      buckets[key].tickets += o.quantity || 0;
    }
  });

  // Return as sorted array
  return Object.values(buckets).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}
