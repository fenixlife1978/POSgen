import { NextResponse } from 'next/server';

/**
 * Webhook de recepción de conversiones CPA (v1).
 * Recibe peticiones POST de redes como Cpamerchant, Alpha Leads, etc.
 * 
 * Payload esperado:
 * {
 *   "conversion_id": "CPA-12345",
 *   "sub_id": "CM-01",
 *   "offer_id": "1500",
 *   "status": "approved" | "pending" | "rejected",
 *   "payout": 2.50
 * }
 */

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { conversion_id, sub_id, offer_id, status, payout } = payload;

    if (!conversion_id || !sub_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verificar si la conversión ya existe en la DB activa
    // const existingLead = await db.leads.findUnique({ conversionId: conversion_id });
    const existingLead = false; // Mock

    if (existingLead) {
      // 2. Si existe, actualizar el estado
      // await db.leads.update({ conversionId: conversion_id }, { status });
      console.log(`Lead ${conversion_id} actualizado a ${status}`);
    } else {
      // 3. Si no existe, buscar al trabajador por sub_id
      // const worker = await db.workers.findFirst({ subIds: { contains: sub_id } });
      
      // 4. Buscar los detalles de la campaña por offer_id
      // const campaign = await db.campaigns.findUnique({ externalOfferId: offer_id });

      // 5. Registrar el nuevo Lead
      console.log(`Nuevo lead registrado: ${conversion_id} para sub_id ${sub_id}`);
      /*
      await db.leads.create({
        conversionId: conversion_id,
        subId: sub_id,
        status: status || 'pending',
        amount: payout || 0,
        createdAt: new Date(),
        // workerId: worker?.id,
        // campaignId: campaign?.id
      });
      */
    }

    return NextResponse.json({ 
      success: true, 
      message: existingLead ? 'Lead updated' : 'Lead created' 
    });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
