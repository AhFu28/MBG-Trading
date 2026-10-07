/**
 * Tests for payment confirmation & admin approval edge endpoints.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestPost as paymentConfirmPost } from '../../../functions/api/account/payment-confirm.js';
import { onRequestGet as adminRequestsGet } from '../../../functions/api/account/admin/requests.js';
import { onRequestPost as adminApprovePost } from '../../../functions/api/account/admin/approve.js';
import { onRequestPost as adminRejectPost } from '../../../functions/api/account/admin/reject.js';
import { signJWT } from '../../../functions/api/_jwt.js';

const ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  JWT_SECRET: 'super-secure-test-jwt-secret-key-1234567890',
};

async function createAdminCookie(email = 'naufalarib60@gmail.com') {
  const token = await signJWT({ email, id: 'admin-uuid', role: 'admin' }, ENV.JWT_SECRET);
  return `mbg_session=${token}`;
}

async function createUserCookie(email = 'user@example.com') {
  const token = await signJWT({ email, id: 'user-uuid', role: 'user' }, ENV.JWT_SECRET);
  return `mbg_session=${token}`;
}

function postReq(url, body, cookie = '') {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify(body),
  });
}

function getReq(url, cookie = '') {
  return new Request(url, {
    method: 'GET',
    headers: {
      Cookie: cookie,
    },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('POST /api/account/payment-confirm', () => {
  it('rejects request with invalid or missing senderName', async () => {
    const req = postReq('https://x/api/account/payment-confirm', {
      senderName: '',
      paymentMethod: 'BCA',
      amount: 149000,
      email: 'buyer@test.com',
    });
    const res = await paymentConfirmPost({ env: ENV, request: req });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Nama pengirim');
  });

  it('rejects invalid email if not logged in', async () => {
    const req = postReq('https://x/api/account/payment-confirm', {
      senderName: 'Budi',
      paymentMethod: 'BCA',
      amount: 149000,
      email: 'invalid-email',
    });
    const res = await paymentConfirmPost({ env: ENV, request: req });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Email');
  });

  it('successfully creates payment request row', async () => {
    const mockRecord = {
      id: 'req-123',
      email: 'buyer@test.com',
      sender_name: 'Budi',
      amount: 149000,
      status: 'pending',
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => [mockRecord],
    }));

    const cookie = await createUserCookie('buyer@test.com');
    const req = postReq(
      'https://x/api/account/payment-confirm',
      {
        senderName: 'Budi',
        paymentMethod: 'Transfer Bank BCA',
        amount: 149000,
        notes: 'Ref 12345',
      },
      cookie,
    );

    const res = await paymentConfirmPost({ env: ENV, request: req });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.request.email).toBe('buyer@test.com');
  });
});

describe('Admin Desk RBAC & Actions', () => {
  it('refuses non-admin user on GET /api/account/admin/requests with 403', async () => {
    const cookie = await createUserCookie('regular_user@gmail.com');
    const req = getReq('https://x/api/account/admin/requests', cookie);
    const res = await adminRequestsGet({ env: ENV, request: req });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Akses ditolak');
  });

  it('allows Jendral Arib on GET /api/account/admin/requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { id: '1', email: 'user@test.com', status: 'pending' },
      ],
    }));

    const cookie = await createAdminCookie('naufalarib60@gmail.com');
    const req = getReq('https://x/api/account/admin/requests', cookie);
    const res = await adminRequestsGet({ env: ENV, request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.requests.length).toBe(1);
  });

  it('allows Kamerad Fuad to approve subscription via RPC', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchSpy);

    const cookie = await createAdminCookie('ahmfuadi28@gmail.com');
    const req = postReq(
      'https://x/api/account/admin/approve',
      {
        requestId: 'req-999',
        email: 'customer@test.com',
        days: 30,
      },
      cookie,
    );

    const res = await adminApprovePost({ env: ENV, request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.message).toContain('customer@test.com');

    // Verify RPC was invoked
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/rpc/activate_subscription'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('allows admin to reject subscription', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => '',
    });
    vi.stubGlobal('fetch', fetchSpy);

    const cookie = await createAdminCookie('naufalarib60@gmail.com');
    const req = postReq(
      'https://x/api/account/admin/reject',
      {
        requestId: 'req-999',
        reason: 'Bukti transfer tidak terbaca',
      },
      cookie,
    );

    const res = await adminRejectPost({ env: ENV, request: req });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
