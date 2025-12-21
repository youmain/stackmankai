#!/bin/bash

# Get Firebase project ID from .firebaserc
PROJECT_ID=$(grep -o '"default": "[^"]*"' .firebaserc | cut -d'"' -f4)

if [ -z "$PROJECT_ID" ]; then
  echo "Error: Could not find Firebase project ID"
  exit 1
fi

echo "Firebase Project ID: $PROJECT_ID"
echo "Updating player OB7QGplzjWSEAX0S39Uc storeName to 'テスト店舗'..."

# Update using Firestore REST API
curl -X PATCH \
  "https://firestore.googleapis.com/v1/projects/$PROJECT_ID/databases/(default)/documents/players/OB7QGplzjWSEAX0S39Uc?updateMask.fieldPaths=storeName" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "storeName": {
        "stringValue": "テスト店舗"
      }
    }
  }'

echo ""
echo "Update complete!"
