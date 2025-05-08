import {NextRequest, NextResponse} from "next/server";
import {google} from "googleapis";

type CoffeeSelection = {
  type: string;
  quantity: number;
  ice: {
    withIce: number;
    withoutIce: number;
  };
}

type SpotOrderForm = {
  uuid: string;
  date: string;
  name: string;
  phone: string;
  notes: string;
  pickupTime: string;
  coffeeSelections: CoffeeSelection[];
  totalPrice: number;
  bukti_pembayaran: string;
  status: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as SpotOrderForm;

  console.log(body)

  try {
    // auth
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({version: "v4", auth});

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const invoiceUrl = `${baseUrl}/invoice/${body.uuid}`

    // Initialize coffee quantities
    let PC0 = 0;  // Phista Coffee (no ice)
    let PC1 = 0;  // Phista Coffee (with ice)
    let PCM0 = 0; // Phicoffee Caramel Macchiato (no ice)
    let PCM1 = 0; // Phicoffee Caramel Macchiato (with ice)
    let PBS0 = 0; // Phicoffee Brown Sugar (no ice)
    let PBS1 = 0; // Phicoffee Brown Sugar (with ice)

    // Process coffee selections
    body.coffeeSelections.forEach(selection => {
      const coffeeType = selection.type.toLowerCase();
      
      if (coffeeType.includes('phista coffee')) {
        PC0 += selection.ice.withoutIce;
        PC1 += selection.ice.withIce;
      } else if (coffeeType.includes('caramel macchiato')) {
        PCM0 += selection.ice.withoutIce;
        PCM1 += selection.ice.withIce;
      } else if (coffeeType.includes('brown sugar')) {
        PBS0 += selection.ice.withoutIce;
        PBS1 += selection.ice.withIce;
      }
    });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "SPOT!A1:P1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          body.uuid,                                    // ORDER ID
          new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), // TANGGAL
          body.name,                                    // NAMA
          body.phone,                                   // NO TELFON
          body.notes,                                   // NOTES
          PC0,                                         // PC0
          PC1,                                         // PC1
          PCM0,                                        // PCM0
          PCM1,                                        // PCM1
          PBS0,                                        // PBS0
          PBS1,                                        // PBS1
          body.totalPrice,                             // TOTAL HARGA
          body.pickupTime,                             // PICKUP TIME
          "",                                          // MAPS (empty for spot orders)
          invoiceUrl,                                  // INVOICE
          body.bukti_pembayaran,                       // BUKTI PEMBAYARAN
          body.status,                                 // STATUS
        ]],
      },
    });

    return NextResponse.json({data: response.data}, {status: 200});

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({error: error.message ?? "Internal server error"}, {status: 500});
  }
} 