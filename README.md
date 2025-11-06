# 6 Month Catchup

A simple static website that helps you schedule two random catch-up calls throughout the year with a friend or colleague.

## How It Works

1. Enter two email addresses
2. Select a year
3. The app generates two deterministic random times throughout the year using MD5 hashing
4. Download .ics files or add events directly to Google Calendar

The magic: Both people will get the exact same times when they enter the same email addresses in any order!

## Technical Details

- Uses MD5 hash of `email1+email2+year` and `email2+email1+year`
- Converts hash to number and mods by hours in the year (8760 or 8784 for leap years)
- All processing happens client-side - no data is sent to any server
- Generates standard .ics calendar files
- Supports Google Calendar direct integration

## Development

`npm run dev`

## Privacy

All calculations happen in your browser. No email addresses or personal data are transmitted to any server.

## LICENSE

MIT
