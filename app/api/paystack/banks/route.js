import { NextResponse } from 'next/server';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

export async function GET() {
  try {
    const res = await fetch(
      `${PAYSTACK_API}/bank?country=nigeria&currency=NGN&perPage=200`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
        next: { revalidate: 86400 },
      }
    );

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch banks' },
        { status: 500 }
      );
    }

    const banks = (data.data || [])
      .map((b) => ({ name: b.name, code: b.code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ banks });
  } catch (err) {
    console.error('Banks fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch banks' },
      { status: 500 }
    );
  }
}
