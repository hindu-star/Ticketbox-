import { supabase } from './supabase';

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
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

    const soldOut = eventTickets.every((t) => {
      if (!t.capacity) return false;
      const remaining = t.capacity - (t.quantity_sold || 0);
      return remaining <= 0;
    });

    return { ...e, soldOut };
  });
}

function buildTicketRow(eventId, t, includeSold = false) {
  const row = {
    event_id: eventId,
    name: t.name,
    description: t.description,
    price: Number(t.price) || 0,
    capacity: t.capacity ? Number(t.capacity) : null,
    ticket_kind: t.ticket_kind || 'paid',
    order_limit: t.order_limit ? Number(t.order_limit) : 10,
    perks: Array.isArray(t.perks) ? t.perks.filter(Boolean) : [],
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
