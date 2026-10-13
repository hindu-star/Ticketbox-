import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '../../../../lib/email';

export async function POST(request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    console.log('Sending welcome email to:', email);

    const result = await sendWelcomeEmail({
      to: email,
      name: name || email.split('@')[0],
    });

    console.log('Welcome email result:', JSON.stringify(result));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Welcome email failed:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Welcome email failed' },
      { status: 500 }
    );
  }
}
