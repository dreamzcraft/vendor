# Vendor Finder Web App

This project is a lightweight interactive web app that lets users:

1. Select a **product category**.
2. Move to another page to select a **brand**.
3. View all matching **vendors**.
4. Contact each vendor with:
   - **WhatsApp** button
   - **Email** button
5. Send a single email to **all vendors in the selected category**.

## CSV format

Use a CSV with the following required columns (header names are case-insensitive):

- `category`
- `brand`
- `vendor_name`
- `email`
- `whatsapp`

A sample `vendors.csv` is included.

## Run locally

Because browsers block `fetch()` from local files, run a local server:

```bash
python -m http.server 8000
```

Then open: <http://localhost:8000>

The app auto-loads `vendors.csv` from the root folder. You can also upload any CSV file using the file input.
