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

export async function createEvent(eventData, tickets) {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();

  if (eventError) throw eventError;

  if (tickets && tickets.length > 0) {
    const ticketRows = tickets.map((t) => ({
      event_id: event.id,
      name: t.name,
      description: t.description,
      price: Number(t.price) || 0,
      capacity: t.capacity ? Number(t.capacity) : null,
    }));

    const { error: ticketError } = await supabase
      .from('ticket_types')
      .insert(ticketRows);

    if (ticketError) throw ticketError;
  }

  return event;
}

/**
 * Update an event and its tickets.
 * Preserves quantity_sold for tickets that already exist (matched by id).
 * Inserts new tickets with quantity_sold = 0.
 * Deletes tickets that are no longer in the list.
 */
export async function updateEvent(id, eventData, tickets) {
  // Update event fields
  const { error: eventError } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id);

  if (eventError) throw eventError;

  // Load existing tickets for this event
  const { data: existing, error: existingError } = await supabase
    .from('ticket_types')
    .select('*')
    .eq('event_id', id);

  if (existingError) throw existingError;

  const existingMap = new Map((existing || []).map((t) => [t.id, t]));

  // Figure out which existing tickets are being kept / updated
  const keptIds = new Set();

  for (const t of tickets || []) {
    const payload = {
      event_id: id,
      name: t.name,
      description: t.description,
      price: Number(t.price) || 0,
      capacity: t.capacity ? Number(t.capacity) : null,
    };

    if (t.id && existingMap.has(t.id)) {
      // Update existing ticket, preserving quantity_sold
      const { error } = await supabase
        .from('ticket_types')
        .update(payload)
        .eq('id', t.id);

      if (error) throw error;
      keptIds.add(t.id);
    } else {
      // New ticket — insert with sold = 0
      const { error } = await supabase
        .from('ticket_types')
        .insert([{ ...payload, quantity_sold: 0 }]);

      if (error) throw error;
    }
  }

  // Delete any existing tickets that were removed
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
