'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../../components/Navbar';
import Footer from '../../../../components/Footer';
import { supabase } from '../../../../lib/supabase';
import {
  getEvent,
  getCheckInPin,
  setCheckInPin,
  checkInOrder,
  getCheckInStats,
} from '../../../../lib/events';

const PIN_STORAGE_PREFIX = 'tb_checkin_pin_';

export default function CheckInPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  const [storedPin, setStoredPin] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [manualRef, setManualRef] = useState('');

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const ev = await getEvent(eventId);

        if (ev.organizer_id !== user.id) {
          router.push('/my-events');
          return;
        }

        setEvent(ev);

        const pin = await getCheckInPin(eventId);

        if (!pin) {
          setNeedsSetup(true);
        } else {
          const stored = localStorage.getItem(PIN_STORAGE_PREFIX + eventId);
          if (stored === pin) {
            setStoredPin(pin);
            loadStats();
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }
    if (eventId) load();
  }, [eventId, router]);

  async function loadStats() {
    try {
      const s = await getCheckInStats(eventId);
      setStats(s);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  async function handleSetupPin(e) {
    e.preventDefault();
    if (setupPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (setupPin !== setupConfirm) {
      setPinError('PINs do not match');
      return;
    }

    setSetupSaving(true);
    try {
      await setCheckInPin(eventId, setupPin);
      localStorage.setItem(PIN_STORAGE_PREFIX + eventId, setupPin);
      setStoredPin(setupPin);
      setNeedsSetup(false);
      setPinError('');
      loadStats();
    } catch (err) {
      setPinError(err.message || 'Failed to save PIN');
    } finally {
      setSetupSaving(false);
    }
  }

  function handleVerifyPin(e) {
    e.preventDefault();
    // We stored the pin locally; verify by fetching
    getCheckInPin(eventId).then((actualPin) => {
      if (actualPin === pinInput) {
        localStorage.setItem(PIN_STORAGE_PREFIX + eventId, pinInput);
        setStoredPin(pinInput);
        setPinError('');
        loadStats();
      } else {
        setPinError('Incorrect PIN');
      }
    });
  }

  async function startScanner() {
    setScanResult(null);
    setScanning(true);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Pause scanning while we process
          try {
            await scanner.pause(true);
          } catch (e) {}
          await handleDecoded(decodedText);
        },
        () => {
          // Ignore decode errors (happens every frame)
        }
      );
    } catch (err) {
      console.error('Scanner error:', err);
      setScanResult({
        status: 'camera_error',
        message:
          'Could not access the camera. Check permissions, or use manual entry below.',
      });
      setScanning(false);
    }
  }

  async function stopScanner() {
    const scanner = html5QrRef.current;
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch (e) {}
      html5QrRef.current = null;
    }
    setScanning(false);
  }

  async function handleDecoded(decodedText) {
    // Extract order reference from QR JSON, or use raw text
    let reference = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.orderId) reference = parsed.orderId;
    } catch (e) {
      // Not JSON — treat as raw reference
    }

    await processReference(reference);
  }

  async function processReference(reference) {
    try {
      const result = await checkInOrder(reference);
      setScanResult(result);
      loadStats();
    } catch (err) {
      setScanResult({
        status: 'error',
        message: err.message || 'Something went wrong',
      });
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualRef.trim()) return;
    setScanResult(null);
    processReference(manualRef.trim());
    setManualRef('');
  }

  async function handleScanNext() {
    setScanResult(null);
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.resume();
      } catch (e) {
        // If resume fails, restart
        await stopScanner();
        startScanner();
      }
    } else {
      startScanner();
    }
  }

  function formatTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="checkin-page">
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="checkin-page">
          <div className="auth-error">{error || 'Event not found'}</div>
          <Link href="/my-events" className="content-btn-secondary">
            Back to My Events
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // === PIN SETUP ===
  if (needsSetup) {
    return (
      <>
        <Navbar />
        <div className="checkin-page">
          <div className="checkin-header">
            <Link href="/my-events" className="analytics-back">
              ← Back to My Events
            </Link>
            <h1>Set up check-in</h1>
            <p className="analytics-subtitle">
              Create a PIN for scanning tickets at {event.title}. You&apos;ll
              share this with whoever is at the door.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSetupPin}>
            {pinError && <div className="auth-error">{pinError}</div>}

            <input
              type="text"
              inputMode="numeric"
              placeholder="4-digit PIN"
              value={setupPin}
              onChange={(e) =>
                setSetupPin(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              maxLength={6}
              required
              autoFocus
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="Confirm PIN"
              value={setupConfirm}
              onChange={(e) =>
                setSetupConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              maxLength={6}
              required
            />
            <button type="submit" disabled={setupSaving}>
              {setupSaving ? 'Saving...' : 'Save PIN'}
            </button>
          </form>

          <p className="field-hint" style={{ marginTop: 16 }}>
            This PIN protects your scanner page. Only people with the PIN can
            scan tickets.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  // === PIN VERIFICATION ===
  if (!storedPin) {
    return (
      <>
        <Navbar />
        <div className="checkin-page">
          <div className="checkin-header">
            <Link href="/my-events" className="analytics-back">
              ← Back to My Events
            </Link>
            <h1>Enter check-in PIN</h1>
            <p className="analytics-subtitle">{event.title}</p>
          </div>

          <form className="auth-form" onSubmit={handleVerifyPin}>
            {pinError && <div className="auth-error">{pinError}</div>}

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) =>
                setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              maxLength={6}
              required
              autoFocus
            />
            <button type="submit">Unlock scanner</button>
          </form>
        </div>
        <Footer />
      </>
    );
  }

  // === SCANNER ===
  return (
    <>
      <Navbar />
      <div className="checkin-page">
        <div className="checkin-header">
          <Link href="/my-events" className="analytics-back">
            ← Back to My Events
          </Link>
          <h1>Check-in</h1>
          <p className="analytics-subtitle">{event.title}</p>
        </div>

        {stats && (
          <div className="checkin-stats">
            <div className="checkin-stat">
              <div className="checkin-stat-label">Checked in</div>
              <div className="checkin-stat-value">
                {stats.checkedInTickets} / {stats.totalTickets}
              </div>
            </div>
            <div className="checkin-stat">
              <div className="checkin-stat-label">Orders scanned</div>
              <div className="checkin-stat-value">
                {stats.checkedInOrders} / {stats.ordersCount}
              </div>
            </div>
          </div>
        )}

        {/* Scanner viewport */}
        <div id="qr-reader" ref={scannerRef} className="qr-reader-box" />

        {!scanning && !scanResult && (
          <button
            type="button"
            className="checkin-scan-btn"
            onClick={startScanner}
          >
            📷 Start scanning
          </button>
        )}

        {scanning && !scanResult && (
          <button
            type="button"
            className="checkin-stop-btn"
            onClick={stopScanner}
          >
            Stop camera
          </button>
        )}

        {/* Scan result overlay */}
        {scanResult && (
          <div className={`scan-result scan-result-${scanResult.status}`}>
            {scanResult.status === 'success' && (
              <>
                <div className="scan-result-icon">✅</div>
                <div className="scan-result-title">Checked in!</div>
                <div className="scan-result-body">
                  <div>{scanResult.order.buyer_email}</div>
                  <div>
                    {scanResult.order.quantity} ticket
                    {scanResult.order.quantity === 1 ? '' : 's'}
                  </div>
                  <div className="scan-result-ref">
                    {scanResult.order.paystack_reference}
                  </div>
                </div>
              </>
            )}

            {scanResult.status === 'already_checked_in' && (
              <>
                <div className="scan-result-icon">⚠️</div>
                <div className="scan-result-title">Already checked in</div>
                <div className="scan-result-body">
                  <div>{scanResult.order.buyer_email}</div>
                  <div>
                    Scanned at{' '}
                    {formatTime(scanResult.order.checked_in_at)}
                  </div>
                </div>
              </>
            )}

            {scanResult.status === 'not_paid' && (
              <>
                <div className="scan-result-icon">❌</div>
                <div className="scan-result-title">Not paid</div>
                <div className="scan-result-body">
                  <div>{scanResult.order.buyer_email}</div>
                  <div>Status: {scanResult.order.status}</div>
                </div>
              </>
            )}

            {scanResult.status === 'not_found' && (
              <>
                <div className="scan-result-icon">❌</div>
                <div className="scan-result-title">Invalid ticket</div>
                <div className="scan-result-body">
                  No order found for this QR code.
                </div>
              </>
            )}

            {scanResult.status === 'camera_error' && (
              <>
                <div className="scan-result-icon">📷</div>
                <div className="scan-result-title">Camera error</div>
                <div className="scan-result-body">{scanResult.message}</div>
              </>
            )}

            {scanResult.status === 'error' && (
              <>
                <div className="scan-result-icon">⚠️</div>
                <div className="scan-result-title">Error</div>
                <div className="scan-result-body">{scanResult.message}</div>
              </>
            )}

            <button
              type="button"
              className="scan-next-btn"
              onClick={handleScanNext}
            >
              Scan next →
            </button>
          </div>
        )}

        {/* Manual entry */}
        <div className="checkin-manual">
          <label>Or enter order reference manually</label>
          <form onSubmit={handleManualSubmit} className="checkin-manual-form">
            <input
              type="text"
              placeholder="TB-..."
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
            />
            <button type="submit">Check in</button>
          </form>
        </div>

        {/* Recent check-ins */}
        {stats && stats.recent.length > 0 && (
          <div className="checkin-recent">
            <h2>Recently checked in</h2>
            <div className="checkin-recent-list">
              {stats.recent.map((o) => (
                <div key={o.id} className="checkin-recent-row">
                  <div>
                    <div className="checkin-recent-email">{o.buyer_email}</div>
                    <div className="checkin-recent-meta">
                      {o.quantity} ticket{o.quantity === 1 ? '' : 's'}
                    </div>
                  </div>
                  <div className="checkin-recent-time">
                    {formatTime(o.checked_in_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
    }
