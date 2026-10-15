import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminBusinessAlert } from '../../../../lib/email';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API = 'https://api.paystack.co';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (
      !profile.bank_code ||
      !profile.account_number ||
      !profile.account_name
    ) {
      return NextResponse.json(
        { error: 'Bank details are incomplete' },
        { status: 400 }
      );
    }

    // Business account — needs manual review, don't create subaccount yet
    if (profile.account_type === 'business' && !profile.payout_verified) {
      // Send admin alert (fire-and-forget)
      try {
        // Get the organizer's email from auth.users
        const { data: authUser } = await supabase.auth.admin.getUserById(
          userId
        );

        await sendAdminBusinessAlert({
          organizerName:
            profile.display_name ||
            [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(' '),
          organizerEmail: authUser?.user?.email || '—',
          businessName: profile.display_name || '—',
          bankName: profile.bank_name,
          accountNumber: profile.account_number,
          accountName: profile.account_name,
          userId,
        });
      } catch (emailErr) {
        console.error('Admin alert email failed:', emailErr);
        // continue anyway
      }

      return NextResponse.json({
        success: false,
        pending_review: true,
        message:
          'Business account submitted. We will verify and approve within 24 hours.',
      });
    }

    // If subaccount already exists, skip
    if (profile.paystack_subaccount_code) {
      return NextResponse.json({
        subaccount_code: profile.paystack_subaccount_code,
        already_existed: true,
      });
    }

    // Build subaccount payload
    const businessName =
      profile.display_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.account_name;

    const body = {
      business_name: businessName,
      settlement_bank: profile.bank_code,
      account_number: profile.account_number,
      percentage_charge: 5,
      description: 'TicketBox organizer',
      primary_contact_name: profile.account_name,
    };

    const res = await fetch(`${PAYSTACK_API}/subaccount`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.status || !data.data) {
      console.error('Subaccount creation failed:', data);
      return NextResponse.json(
        { error: data.message || 'Failed to create subaccount' },
        { status: 400 }
      );
    }

    const subaccountCode = data.data.subaccount_code;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        paystack_subaccount_code: subaccountCode,
        payout_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to save subaccount code:', updateError);
      return NextResponse.json(
        { error: 'Subaccount created but could not be saved' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subaccount_code: subaccountCode,
      success: true,
    });
  } catch (err) {
    console.error('Subaccount route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create subaccount' },
      { status: 500 }
    );
  }
}
