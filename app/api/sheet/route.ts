import {NextRequest, NextResponse} from "next/server";
import {google} from "googleapis";

type SheetForm = {
  uuid: string,
  name: string,
  phone: string,
  notes: string,
  location: string,
  size: string,
  sugar: string,
  ice: string,
  bukti_pembayaran: string,
  invoice: string,
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

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "A1:L1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          body.uuid,
          new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          body.name,
          body.phone,
          body.notes,
          body.location,
          body.size,
          body.sugar,
          body.ice,
          invoiceUrl,
          body.bukti_pembayaran,
          "Pending"
        ]],
      },  
    });

    return NextResponse.json({data: response.data}, {status: 200});

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({error: error.message ?? "Internal server error"}, {status: 500});
  }
}