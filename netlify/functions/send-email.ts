
import type { Handler } from '@netlify/functions';
import sgMail from '@sendgrid/mail';

const handler: Handler = async (event) => {
  // Apenas permitir POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verificar se a API Key existe
  if (!process.env.SENDGRID_API_KEY) {
    console.error("Falta a SENDGRID_API_KEY nas variáveis de ambiente");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configuração de email em falta no servidor.' }),
    };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    const data = JSON.parse(event.body || '{}');
    const { to, subject, html, replyTo } = data;

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltam dados obrigatórios (to, subject, html).' }),
      };
    }

    // Configuração da mensagem
    // NOTA: 'from' deve ser um email verificado no teu painel do SendGrid
    const msg = {
      to,
      from: 'ivo.pinto@calcconstru.pro', // Substitui pelo teu email verificado no SendGrid (Sender Identity)
      replyTo: replyTo || undefined, // Se fornecido (ex: formulário de contacto), permite responder ao utilizador
      subject,
      html,
    };

    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email enviado com sucesso!' }),
    };

  } catch (error: any) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao enviar email via SendGrid.', details: error.message }),
    };
  }
};

export { handler };
