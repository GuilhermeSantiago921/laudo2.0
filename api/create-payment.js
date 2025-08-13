// Importa o SDK do Mercado Pago
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Handler da Serverless Function da Vercel
export default async function handler(request, response) {
    // Permite apenas requisições do tipo POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Pega os dados enviados pelo frontend
        const { planName, planPrice, plate } = request.body;

        // Validação básica dos dados recebidos
        if (!planName || !planPrice || !plate) {
            return response.status(400).json({ error: 'Dados incompletos. Verifique o plano e a placa.' });
        }

        // Inicializa o cliente do Mercado Pago com o seu Access Token
        // IMPORTANTE: O Access Token deve ser guardado como uma variável de ambiente na Vercel
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN 
        });
        const preference = new Preference(client);

        // Cria a preferência de pagamento
        const result = await preference.create({
            body: {
                // Itens do carrinho
                items: [
                    {
                        id: plate.toUpperCase(),
                        title: `${planName} - Placa ${plate.toUpperCase()}`,
                        description: 'Consulta de histórico veicular Laudo Car',
                        quantity: 1,
                        unit_price: Number(planPrice), // Garante que o preço é um número
                        currency_id: 'BRL', // Moeda: Real Brasileiro
                    },
                ],
                // URLs de retorno após o pagamento
                back_urls: {
                    success: 'https://seusite.vercel.app/pagamento-sucesso', // Crie esta página
                    failure: 'https://seusite.vercel.app/pagamento-falha',   // Crie esta página
                    pending: 'https://seusite.vercel.app/pagamento-pendente', // Crie esta página
                },
                auto_return: 'approved', // Retorna automaticamente para o site após pagamento aprovado
            },
        });

        // Retorna o link de pagamento para o frontend
        response.status(200).json({ paymentUrl: result.init_point });

    } catch (error) {
        // Em caso de erro, loga no console da Vercel e envia uma mensagem de erro
        console.error('Erro ao criar preferência no Mercado Pago:', error);
        response.status(500).json({ error: 'Falha ao comunicar com o sistema de pagamento.' });
    }
}
