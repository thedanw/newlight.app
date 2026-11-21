import os
import sys
from googleapiclient.discovery import build

from google_auth import GoogleAuthConfigurationError, authenticate

SCOPES = ['https://www.googleapis.com/auth/drive.file']

def list_files():
    creds = authenticate(SCOPES)
    service = build('drive', 'v3', credentials=creds)

    results = service.files().list(
        pageSize=5, fields="nextPageToken, files(id, name, webViewLink)").execute()
    items = results.get('files', [])

    if not items:
        print('No files found.')
    else:
        print('Files:')
        for item in items:
            print(f"{item['name']} ({item['id']})")
            print(f"URL: {item['webViewLink']}")
            print("-" * 20)

if __name__ == '__main__':
    try:
        list_files()
    except GoogleAuthConfigurationError as error:
        print(f"Configuration error: {error}")
        sys.exit(1)
