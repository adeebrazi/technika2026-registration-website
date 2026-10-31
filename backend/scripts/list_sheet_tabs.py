from googleapiclient.discovery import build
from google.oauth2 import service_account
from dotenv import dotenv_values

env = dotenv_values('z:/Technika 6.0/Registration/backend/.env')
key = env.get('GOOGLE_PRIVATE_KEY')
if key.startswith('"') and key.endswith('"'):
    key = key[1:-1]
key = key.replace('\\n', '\n')

creds = service_account.Credentials.from_service_account_info({
    'type': 'service_account',
    'client_email': env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    'private_key': key,
    'token_uri': 'https://oauth2.googleapis.com/token',
}, scopes=['https://www.googleapis.com/auth/spreadsheets'])

service = build('sheets', 'v4', credentials=creds)
meta = service.spreadsheets().get(spreadsheetId=env.get('GOOGLE_SPREADSHEET_ID')).execute()
sheets = meta.get('sheets', [])
for s in sheets:
    p = s['properties']
    print(f"Sheet: {p['title']} (id: {p['sheetId']}, rowCount: {p.get('gridProperties', {}).get('rowCount')})")
