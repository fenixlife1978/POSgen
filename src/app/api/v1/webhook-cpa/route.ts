
import { NextResponse } from 'next/server';

/**
 * Webhook de recepción de conversiones CPA (v1).
 * Recibe peticiones POST de redes como Cpamerchant, Alpha Leads, etc.
 */

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload) {
      return NextResponse.json({ error: 'Payload empty' }, { status: 400 });
    }

    const { conversion_id, sub_id, offer_id, status, payout } = payload;

    if (!conversion_id || !sub_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Mock de persistencia para evitar errores de conexión inexistente
    console.log(`Webhook recibido: ${conversion_id} para sub_id ${sub_id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Lead processed successfully (Mock)' 
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error during webhook processing' }, { status: 500 });
  }
}
