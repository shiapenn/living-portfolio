import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { BookingCreateSchema } from '@living-portfolio/core';

export function createBookRoutes(repo: IPortfolioRepository) {
  const router = new Hono();

  // Create booking request (§6.1, §6.2, UX-11)
  router.post('/', async (c) => {
    const body = await c.req.json();
    const parsed = BookingCreateSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid booking request', details: parsed.error.issues }, 400);
    }

    const { topic, visitor_name, visitor_contact, facets, preferred_time, notes } = parsed.data;

    const booking = await repo.saveBooking({
      topic,
      visitor_name: visitor_name || null,
      visitor_contact,
      facets: facets || {},
      preferred_time: preferred_time || null,
      notes: notes || null,
      status: 'pending',
    });

    return c.json(
      {
        success: true,
        booking,
        message: 'Consultation request received. The owner will reach out within 24 hours.',
      },
      201
    );
  });

  // List bookings (Admin/internal query)
  router.get('/', async (c) => {
    const status = c.req.query('status') || undefined;
    const bookings = await repo.getBookings(status);
    return c.json({ bookings });
  });

  return router;
}
