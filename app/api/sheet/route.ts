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

type SheetForm = {
  uuid: string;
  date: string;
  name: string;
  phone: string;
  notes: string;
  coffeeSelections: CoffeeSelection[];
  totalPrice: number;
  location: string;
  location_coordinates: string;
  bukti_pembayaran: string;
  status: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as SheetForm;

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

    // Format coffee selections into a readable string
    const coffeeSelectionsStr = body.coffeeSelections
      .filter(selection => selection.quantity > 0)
      .map(selection => {
        const withIce = selection.ice.withIce > 0 ? `${selection.ice.withIce} with ice` : '';
        const withoutIce = selection.ice.withoutIce > 0 ? `${selection.ice.withoutIce} without ice` : '';
        const iceDetails = [withIce, withoutIce].filter(Boolean).join(', ');
        return `${selection.type} (${iceDetails})`;
      })
      .join('; ');

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "A1:K1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          body.uuid,
          new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          body.name,
          body.phone,
          body.notes,
          coffeeSelectionsStr,
          body.totalPrice,
          body.location,
          body.location_coordinates,
          invoiceUrl,
          body.bukti_pembayaran,
          body.status,
        ]],
      },
    });

    return NextResponse.json({data: response.data}, {status: 200});

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({error: error.message ?? "Internal server error"}, {status: 500});
  }
}