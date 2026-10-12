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

export async function updateEvent(id, eventData, tickets) {
  const { error: eventError } = await supabase
    .from('events')
    .update(eventData)
    .eq('id', id);

  if (eventError) throw eventError;

  await supabase.from('ticket_types').delete().eq('event_id', id);

  if (tickets && tickets.length > 0) {
    const ticketRows = tickets.map((t) => ({
      event_id: id,
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
}

export async function deleteEvent(id) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
      }
