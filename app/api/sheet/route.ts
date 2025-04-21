import {NextRequest, NextResponse} from "next/server";
import {google} from "googleapis";

type SheetForm = {
  name: string,
  phone: string,
  notes: string,
  location: string,
  size: string,
  sugar: string,
  ice: string,
}

export async function POST(req: NextRequest) {
  const body = await req.json() as SheetForm;

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

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "A1:I1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          body.name,
          body.phone,
          body.notes,
          body.location,
          body.size,
          body.sugar,
          body.ice,
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