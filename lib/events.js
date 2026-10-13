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
      return { ...e, soldOut: false };
    }

    const publicTickets = eventTickets.filter((t) => !t.is_invite_only);
    const relevant = publicTickets.length > 0 ? publicTickets : eventTickets;

    const soldOut = relevant.every((t) => {
      if (!t.capacity) return false;
      const remaining = t.capacity - (t.quantity_sold || 0);
      return remaining <= 0;
    });

    return { ...e, soldOut };
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
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'paid');

  if (error) throw error;

  const allOrders = orders || [];
  const totalTickets = allOrders.reduce(
    (sum, o) => sum + (o.quantity || 0),
    0
  );
  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + Number(o.total || 0),
    0
  );
  const ordersCount = allOrders.length;
  const avgOrder =
    ordersCount > 0 ? Math.round(totalRevenue / ordersCount) : 0;

  return {
    ticketsSold: totalTickets,
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
