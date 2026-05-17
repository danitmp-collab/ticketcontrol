export default async function handler(req, res) {
  // Permitir solicitudes CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) {
    return res.status(400).json({ error: 'Missing imageBase64 or mimeType' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'La variable de entorno GEMINI_API_KEY no está configurada en Vercel.' });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64
                }
              },
              {
                text: "Analiza la imagen de este ticket de compra o recibo y extrae la siguiente información estructurada de forma extremadamente precisa:\n" +
                      "- establishment: Nombre del comercio o establecimiento comercial principal (ej: Mercadona, DIA, Carrefour, Restaurante El Paso).\n" +
                      "- total_amount: El importe total final cobrado a pagar como número decimal (ej. 15.42). Omitir subtotales u otros importes.\n" +
                      "- ticket_date: La fecha de emisión del ticket en formato AAAA-MM-DD. Si solo viene el año abreviado, conviértelo (ej. 23 -> 2023).\n" +
                      "- ticket_reference: El número de ticket, número de operación, número de factura o referencia de compra si existe de forma clara. Si no existe o no es identificable, dejar en blanco (cadena vacía).\n" +
                      "- items: Lista de todos los artículos, productos o consumiciones del ticket. Para cada línea individual extrae:\n" +
                      "  * name: nombre del producto o plato (obligatorio).\n" +
                      "  * quantity: cantidad numérica si aparece explícitamente. Si no aparece, omite este campo.\n" +
                      "  * unit_price: precio unitario si aparece. Si no aparece, omite este campo.\n" +
                      "  * total_price: precio total de esa línea si aparece. Si no aparece, omite este campo.\n" +
                      "  * category: clasifica como 'comida', 'bebida', 'limpieza', 'hogar' u 'otros'. Si no se puede clasificar, omite este campo.\n" +
                      "  Ignora líneas de descuento global, IVA, subtotales y totales. Si el ticket no muestra detalle de artículos, devuelve items como array vacío []."
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              establishment: { type: "string" },
              total_amount: { type: "number" },
              ticket_date: { type: "string" },
              ticket_reference: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name:       { type: "string" },
                    quantity:   { type: "number" },
                    unit_price: { type: "number" },
                    total_price:{ type: "number" },
                    category:   { type: "string" }
                  },
                  required: ["name"]
                }
              }
            },
            required: ["establishment", "total_amount", "ticket_date"]
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      return res.status(500).json({ error: 'Error al llamar a la API de Gemini: ' + (errorData.error?.message || response.statusText) });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textOutput) {
      return res.status(500).json({ error: 'No se obtuvo respuesta del modelo Gemini.' });
    }

    const parsedResult = JSON.parse(textOutput);
    return res.status(200).json(parsedResult);
  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor proxy: ' + error.message });
  }
}
