import { randomUUID } from 'crypto';

interface CinetPayInitParams {
  amount: number;
  currency?: string;
  transactionId?: string;
  description: string;
  customerName: string;
  customerSurname: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerCity?: string;
  customerCountry?: string;
  returnUrl: string;
  notifyUrl: string;
  metadata?: string;
}

export async function initCinetPayPayment(params: CinetPayInitParams) {
  const siteId = process.env.CINETPAY_SITE_ID;
  const apiKey = process.env.CINETPAY_API_KEY;

  if (!siteId || !apiKey) {
    throw new Error("Les clés CinetPay ne sont pas configurées dans l'environnement.");
  }

  const transactionId = params.transactionId || randomUUID();

  const payload = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: transactionId,
    amount: params.amount,
    currency: params.currency || 'XOF',
    description: params.description,
    return_url: params.returnUrl,
    notify_url: params.notifyUrl,
    customer_name: params.customerName,
    customer_surname: params.customerSurname,
    customer_email: params.customerEmail || '',
    customer_phone_number: params.customerPhoneNumber || '',
    customer_address: '',
    customer_city: params.customerCity || 'Bamako',
    customer_country: params.customerCountry || 'ML',
    customer_state: '',
    customer_zip_code: '',
    metadata: params.metadata || '',
    channels: 'ALL',
  };

  try {
    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.code === '201') {
      return {
        success: true,
        paymentUrl: data.data.payment_url,
        transactionId: transactionId,
      };
    } else {
      console.error('CinetPay Init Error:', data);
      return {
        success: false,
        error: data.message || 'Erreur lors de l\'initialisation du paiement CinetPay',
      };
    }
  } catch (error) {
    console.error('CinetPay Request Error:', error);
    return {
      success: false,
      error: 'Erreur réseau lors du contact avec CinetPay',
    };
  }
}

export async function checkCinetPayPayment(transactionId: string) {
  const siteId = process.env.CINETPAY_SITE_ID;
  const apiKey = process.env.CINETPAY_API_KEY;

  if (!siteId || !apiKey) {
    throw new Error("Les clés CinetPay ne sont pas configurées dans l'environnement.");
  }

  const payload = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: transactionId,
  };

  try {
    const response = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.code === '00') {
      return {
        success: true,
        status: 'ACCEPTED',
        data: data.data,
      };
    } else {
      return {
        success: false,
        status: data.code === 'REFUSED' ? 'REFUSED' : 'PENDING',
        error: data.message,
      };
    }
  } catch (error) {
    console.error('CinetPay Check Error:', error);
    return {
      success: false,
      status: 'ERROR',
      error: 'Erreur réseau',
    };
  }
}
