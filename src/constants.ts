import { EppCommandType, EppObjectType } from './types';

export const EPP_TEMPLATES: Record<string, string> = {
  [`${EppCommandType.LOGIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <login>
      <clID>TEST-USER</clID>
      <pw>password</pw>
      <options>
        <version>1.0</version>
        <lang>en</lang>
      </options>
      <svcs>
        <objURI>urn:ietf:params:xml:ns:domain-1.0</objURI>
        <objURI>urn:ietf:params:xml:ns:contact-1.0</objURI>
        <objURI>urn:ietf:params:xml:ns:host-1.0</objURI>
      </svcs>
    </login>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.CHECK}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <check>
      <domain:check xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
        <domain:name>google.com</domain:name>
      </domain:check>
    </check>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.INFO}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <info>
      <domain:info xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name hosts="all">example.com</domain:name>
        <domain:authInfo>
          <domain:pw>2fooBAR</domain:pw>
        </domain:authInfo>
      </domain:info>
    </info>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.CREATE}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <create>
      <domain:create xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>new-domain.com</domain:name>
        <domain:period unit="y">1</domain:period>
        <domain:ns>
          <domain:hostObj>ns1.example.com</domain:hostObj>
          <domain:hostObj>ns2.example.com</domain:hostObj>
        </domain:ns>
        <domain:registrant>CONTACT-123</domain:registrant>
        <domain:contact type="admin">CONTACT-123</domain:contact>
        <domain:authInfo>
          <domain:pw>2fooBAR</domain:pw>
        </domain:authInfo>
      </domain:create>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,
  [`${EppCommandType.RENEW}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <renew>
      <domain:renew xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
        <domain:curExpDate>2024-05-15</domain:curExpDate>
        <domain:period unit="y">1</domain:period>
      </domain:renew>
    </renew>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.UPDATE}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <update>
      <domain:update xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
        <domain:add>
          <domain:ns>
            <domain:hostObj>ns1.newdns.com</domain:hostObj>
          </domain:ns>
        </domain:add>
        <domain:rem>
          <domain:ns>
            <domain:hostObj>ns1.olddns.com</domain:hostObj>
          </domain:ns>
        </domain:rem>
      </domain:update>
    </update>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.TRANSFER}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <transfer op="request">
      <domain:transfer xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
        <domain:period unit="y">1</domain:period>
        <domain:authInfo>
          <domain:pw>2fooBAR</domain:pw>
        </domain:authInfo>
      </domain:transfer>
    </transfer>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.DELETE}-${EppObjectType.DOMAIN}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <delete>
      <domain:delete xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
      </domain:delete>
    </delete>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.CREATE}-${EppObjectType.CONTACT}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <create>
      <contact:create xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
        <contact:id>CONTACT-123</contact:id>
        <contact:postalInfo type="int">
          <contact:name>John Doe</contact:name>
          <contact:org>Test Corp</contact:org>
          <contact:addr>
            <contact:street>123 Test St</contact:street>
            <contact:city>London</contact:city>
            <contact:pc>SW1A 1AA</contact:pc>
            <contact:cc>GB</contact:cc>
          </contact:addr>
        </contact:postalInfo>
        <contact:voice>+44.2071234567</contact:voice>
        <contact:email>john@example.com</contact:email>
        <contact:authInfo>
          <contact:pw>2fooBAR</contact:pw>
        </contact:authInfo>
      </contact:create>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.INFO}-${EppObjectType.CONTACT}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <info>
      <contact:info xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
        <contact:id>CONTACT-123</contact:id>
      </contact:info>
    </info>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.CREATE}-${EppObjectType.HOST}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <create>
      <host:create xmlns:host="urn:ietf:params:xml:ns:host-1.0">
        <host:name>ns1.example.com</host:name>
        <host:addr ip="v4">192.168.1.1</host:addr>
      </host:create>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.INFO}-${EppObjectType.HOST}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <info>
      <host:info xmlns:host="urn:ietf:params:xml:ns:host-1.0">
        <host:name>ns1.example.com</host:name>
      </host:info>
    </info>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.CHECK}-${EppObjectType.HOST}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <check>
      <host:check xmlns:host="urn:ietf:params:xml:ns:host-1.0">
        <host:name>ns1.example.com</host:name>
        <host:name>ns2.example.com</host:name>
      </host:check>
    </check>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.UPDATE}-${EppObjectType.HOST}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <update>
      <host:update xmlns:host="urn:ietf:params:xml:ns:host-1.0">
        <host:name>ns1.example.com</host:name>
        <host:add>
          <host:addr ip="v4">192.0.2.2</host:addr>
        </host:add>
        <host:rem>
          <host:addr ip="v4">192.0.2.1</host:addr>
        </host:rem>
      </host:update>
    </update>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  [`${EppCommandType.DELETE}-${EppObjectType.HOST}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <delete>
      <host:delete xmlns:host="urn:ietf:params:xml:ns:host-1.0">
        <host:name>ns1.example.com</host:name>
      </host:delete>
    </delete>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,
  [`${EppCommandType.POLL}`]: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <poll op="req"/>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,
  
  'DOMAIN-UPDATE-DNSSEC': `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <update>
      <domain:update xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
      </domain:update>
      <extension>
        <secDNS:update xmlns:secDNS="urn:ietf:params:xml:ns:secDNS-1.1">
          <secDNS:add>
            <secDNS:dsData>
              <secDNS:keyTag>12345</secDNS:keyTag>
              <secDNS:alg>3</secDNS:alg>
              <secDNS:digestType>1</secDNS:digestType>
              <secDNS:digest>49FD46E6C4B45C55D4AC</secDNS:digest>
            </secDNS:dsData>
          </secDNS:add>
        </secDNS:update>
      </extension>
    </update>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  'DOMAIN-CREATE-DNSSEC': `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <create>
      <domain:create xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>secure-entry.com</domain:name>
        <domain:period unit="y">1</domain:period>
        <domain:registrant>CONTACT-123</domain:registrant>
        <domain:ns>
          <domain:hostObj>ns1.secure-entry.com</domain:hostObj>
        </domain:ns>
        <domain:authInfo>
          <domain:pw>2fooBAR</domain:pw>
        </domain:authInfo>
      </domain:create>
      <extension>
        <secDNS:create xmlns:secDNS="urn:ietf:params:xml:ns:secDNS-1.1">
          <secDNS:dsData>
            <secDNS:keyTag>12345</secDNS:keyTag>
            <secDNS:alg>13</secDNS:alg>
            <secDNS:digestType>2</secDNS:digestType>
            <secDNS:digest>49FD46E6C4B45C55D4AC</secDNS:digest>
          </secDNS:dsData>
        </secDNS:create>
      </extension>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  'DOMAIN-UPDATE-DNSSEC-REMOVE': `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <update>
      <domain:update xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
        <domain:name>example.com</domain:name>
      </domain:update>
      <extension>
        <secDNS:update xmlns:secDNS="urn:ietf:params:xml:ns:secDNS-1.1">
          <secDNS:rem>
            <secDNS:all>true</secDNS:all>
          </secDNS:rem>
        </secDNS:update>
      </extension>
    </update>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,

  'HOST-CREATE-GLUE': `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <command>
    <create>
      <host:create xmlns:host="urn:ietf:params:xml:ns:host-1.0">
        <host:name>ns1.example.com</host:name>
        <host:addr ip="v4">192.0.2.1</host:addr>
        <host:addr ip="v6">2001:db8::1</host:addr>
      </host:create>
    </create>
    <clTRID>ABC-12345</clTRID>
  </command>
</epp>`,
};

export const MOCK_INITIAL_DOMAINS = [
  {
    name: 'google.com',
    status: ['clientDeleteProhibited', 'clientTransferProhibited'],
    registrant: 'GOOGLE-CONTACT',
    contacts: [{ type: 'admin', id: 'GOOGLE-CONTACT' }],
    ns: ['ns1.google.com', 'ns2.google.com'],
    crDate: '2020-01-01T00:00:00Z',
    exDate: '2030-01-01T00:00:00Z',
  },
  {
    name: 'foundation.org',
    status: ['ok'],
    registrant: 'PIR-CONTACT',
    contacts: [{ type: 'admin', id: 'PIR-CONTACT' }],
    ns: ['ns1.pir.org'],
    crDate: '2021-03-22T00:00:00Z',
    exDate: '2025-03-22T00:00:00Z',
  },
  {
    name: 'test-nixi.in',
    status: ['ok'],
    registrant: 'NI-CONTACT',
    contacts: [{ type: 'admin', id: 'NI-CONTACT' }],
    ns: ['ns1.test-nixi.in', 'ns2.test-nixi.in'],
    crDate: '2023-05-15T12:00:00Z',
    exDate: '2024-05-15T12:00:00Z',
    secDNS: {
      dsData: [{
        keyTag: 12345,
        alg: 8,
        digestType: 2,
        digest: 'E2D3C1F431234567890ABCDEF'
      }]
    }
  },
  {
    name: 'central.tech',
    status: ['clientHold'],
    registrant: 'CNIC-CONTACT',
    contacts: [{ type: 'admin', id: 'CNIC-CONTACT' }],
    ns: ['ns1.centralnic.net'],
    crDate: '2022-11-10T09:00:00Z',
    exDate: '2023-11-10T09:00:00Z',
  }
];
