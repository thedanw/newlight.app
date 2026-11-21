import os
import sys
from googleapiclient.discovery import build

from google_auth import GoogleAuthConfigurationError, authenticate

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def list_files():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    log_path = os.path.join(script_dir, 'links.txt')
    
    creds = authenticate(SCOPES)
    service = build('drive', 'v3', credentials=creds)

    results = service.files().list(pageSize=5, fields="files(id, name, webViewLink)").execute()
    items = results.get('files', [])

    with open(log_path, 'w', encoding='utf-8') as f:
        for item in items:
            f.write(f"NAME: {item['name']}\n")
            f.write(f"LINK: {item['webViewLink']}\n")
            f.write("-" * 20 + "\n")

if __name__ == '__main__':
    try:
        list_files()
    except GoogleAuthConfigurationError as error:
        print(f"Configuration error: {error}")
        sys.exit(1)
