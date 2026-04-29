# EPP Forge: Mock Registry Dashboard

EPP Forge is a comprehensive testing environment for Extensible Provisioning Protocol (EPP) integrations. It provides a mock registry environment that allows developers to test EPP client implementations without requiring a live registry connection.

## Features

- **Mock Registry State**: Persistent storage of domains, contacts, and hosts using Firestore.
- **EPP Command Templates**: Pre-configured XML templates for standard EPP operations (Login, Logout, Check, Info, Create, Update, Delete).
- **XML Visualization**: Syntax-highlighted request and response views for easy debugging.
- **Object Explorer**: Interactive dashboard to view and inspect domains, contacts, and hosts in real-time.
- **Protocol Support**:
  - `domain-1.0` (RFC 5731)
  - `contact-1.0` (RFC 5733)
  - `host-1.0` (RFC 5732)
- **Nameserver Support**: Full support for host objects (nameservers), including glue record management (IPv4/v6).

## Getting Started

1. **Select an Object & Command**: Use the sidebar to choose the EPP object and operation you want to perform.
2. **Review/Edit XML**: The XML template will be automatically populated. You can modify it to suit your test case.
3. **Execute**: Click "Execute Command" to send the request to the mock service.
4. **Inspect Results**: View the XML response and observe the updated registry state in the "Explorer" tab.

## Technical Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Express (Server-side EPP simulation).
- **Database**: Firebase Firestore (Real-time state tracking).
- **Auth**: Firebase Authentication (Anonymous session support).

## Development

```bash
npm install
npm run dev
```

The application runs on port 3000 by default.

## License

MIT
