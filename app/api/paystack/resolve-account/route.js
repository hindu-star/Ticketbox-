import { NextResponse } from 'next/server';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

export async function POST(request) {
  try {
    const { account_number, bank_code } = await request.json();

    if (!account_number || !bank_code) {
      return NextResponse.json(
        { error: 'Account number and bank are required' },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(account_number)) {
      return NextResponse.json(
        { error: 'Account number must be 10 digits' },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${PAYSTACK_API}/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = await res.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || 'Could not resolve account' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      account_name: data.data.account_name,
      account_number: data.data.account_number,
    });
  } catch (err) {
    console.error('Resolve account error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to resolve account' },
      { status: 500 }
    );
  }
        }
