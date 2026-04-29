import { EppCommandType, EppObjectType, RegistryState, EppResponse, DomainObject, RegistryConnector, ContactObject, HostObject } from '../types';
import { MOCK_INITIAL_DOMAINS } from '../constants';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  query,
  limit
} from 'firebase/firestore';

class EppService {
  private state: RegistryState = {
    domains: new Map(),
    contacts: new Map(),
    hosts: new Map(),
    activeConnector: RegistryConnector.NIXI,
  };

  constructor() {
    // We'll initialize from Firestore later or on demand
  }

  private handleFirestoreError(error: unknown, operationType: string, path: string | null) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  public async initializeMockData() {
    // Only run if empty
    const registryId = 'DEFAULT';
    const domainsSnap = await getDocs(query(collection(db, 'registries', registryId, 'domains'), limit(1)));
    if (domainsSnap.empty) {
      console.log('Initializing mock data in Firestore...');
      for (const d of MOCK_INITIAL_DOMAINS) {
        await setDoc(doc(db, 'registries', registryId, 'domains', d.name), d);
      }
      
      const initialHosts = [
        {
          name: 'ns1.test-nixi.in',
          addr: ['192.168.1.1', '2001:db8::1'],
          status: ['ok']
        },
        {
          name: 'ns2.test-nixi.in',
          addr: ['192.168.1.2'],
          status: ['ok']
        }
      ];
      
      for (const h of initialHosts) {
        await setDoc(doc(db, 'registries', registryId, 'hosts', h.name), h);
      }
    }
  }

  public setConnector(connector: RegistryConnector) {
    this.state.activeConnector = connector;
  }

  public async getState(): Promise<RegistryState> {
    const registryId = 'DEFAULT';
    const domains = new Map<string, any>();
    const contacts = new Map<string, any>();
    const hosts = new Map<string, any>();

    const dSnap = await getDocs(collection(db, 'registries', registryId, 'domains'));
    dSnap.forEach(d => domains.set(d.id, d.data()));

    const cSnap = await getDocs(collection(db, 'registries', registryId, 'contacts'));
    cSnap.forEach(c => contacts.set(c.id, c.data()));

    const hSnap = await getDocs(collection(db, 'registries', registryId, 'hosts'));
    hSnap.forEach(h => hosts.set(h.id, h.data()));

    return {
      domains,
      contacts,
      hosts,
      activeConnector: this.state.activeConnector
    };
  }

  public getGreeting(): string {
    const registryPrefix = this.state.activeConnector.split(' ')[0].toUpperCase();
    const svTRID = `${registryPrefix}-SVTRID-${Math.random().toString(36).substring(7).toUpperCase()}`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <greeting>
    <svID>${registryPrefix} EPP Server</svID>
    <svDate>${new Date().toISOString()}</svDate>
    <svcMenu>
      <version>1.0</version>
      <lang>en</lang>
      <objURI>urn:ietf:params:xml:ns:domain-1.0</objURI>
      <objURI>urn:ietf:params:xml:ns:contact-1.0</objURI>
      <objURI>urn:ietf:params:xml:ns:host-1.0</objURI>
    </svcMenu>
    <dcp>
      <access><all/></access>
      <statement>
        <purpose><admin/><prov/></purpose>
        <recipient><ours/><public/></recipient>
        <retention><indefinite/></retention>
      </statement>
    </dcp>
  </greeting>
</epp>`;
  }

  public async processRequest(xml: string): Promise<EppResponse> {
    const registryId = 'DEFAULT';
    const lowerXml = xml.toLowerCase();
    const clTRID = this.extractClTRID(xml);
    
    // Auth Check simulation
    if (lowerXml.includes('<login>')) {
      const clID = this.extractValue(xml, 'clID');
      const pw = this.extractValue(xml, 'pw');
      if (clID === 'TEST-USER' && pw === 'password') {
        return this.generateResponse('1000', 'Command completed successfully', clTRID);
      } else {
        return this.generateResponse('2200', 'Authentication error', clTRID);
      }
    }

    if (lowerXml.includes('<logout>')) {
      return this.generateResponse('1500', 'Command completed successfully; ending session', clTRID);
    }

    if (lowerXml.includes('<check>')) {
      if (lowerXml.includes('domain:check')) {
        const names = this.extractValues(xml, 'domain:name');
        const checkResults = await Promise.all(names.map(async name => {
          const docSnap = await getDoc(doc(db, 'registries', registryId, 'domains', name));
          const exists = docSnap.exists();
          return `<domain:cd>
            <domain:name avail="${exists ? '0' : '1'}">${name}</domain:name>
            ${exists ? '<domain:reason>In use</domain:reason>' : ''}
          </domain:cd>`;
        }));

        return this.generateResponse('1000', 'Command completed successfully', clTRID, `
        <resData>
          <domain:chkData xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
            ${checkResults.join('')}
          </domain:chkData>
        </resData>`);
      }

      if (lowerXml.includes('host:check')) {
        const names = this.extractValues(xml, 'host:name');
        const checkResults = await Promise.all(names.map(async name => {
          const docSnap = await getDoc(doc(db, 'registries', registryId, 'hosts', name));
          const exists = docSnap.exists();
          return `<host:cd>
            <host:name avail="${exists ? '0' : '1'}">${name}</host:name>
            ${exists ? '<host:reason>In use</host:reason>' : ''}
          </host:cd>`;
        }));

        return this.generateResponse('1000', 'Command completed successfully', clTRID, `
        <resData>
          <host:chkData xmlns:host="urn:ietf:params:xml:ns:host-1.0">
            ${checkResults.join('')}
          </host:chkData>
        </resData>`);
      }
    }

    if (lowerXml.includes('<info>')) {
      if (lowerXml.includes('domain:info')) {
        const name = this.extractValue(xml, 'domain:name');
        const docSnap = await getDoc(doc(db, 'registries', registryId, 'domains', name));
        
        if (!docSnap.exists()) {
          return this.generateResponse('2303', 'Object does not exist', clTRID);
        }
        const domain = docSnap.data() as DomainObject;

        let extension = '';
        if (domain.secDNS) {
          extension = `
          <extension>
            <secDNS:infData xmlns:secDNS="urn:ietf:params:xml:ns:secDNS-1.1">
              ${domain.secDNS.dsData?.map(ds => `
              <secDNS:dsData>
                <secDNS:keyTag>${ds.keyTag}</secDNS:keyTag>
                <secDNS:alg>${ds.alg}</secDNS:alg>
                <secDNS:digestType>${ds.digestType}</secDNS:digestType>
                <secDNS:digest>${ds.digest}</secDNS:digest>
              </secDNS:dsData>`).join('')}
            </secDNS:infData>
          </extension>`;
        }

        return this.generateResponse('1000', 'Command completed successfully', clTRID, `
        <resData>
          <domain:infData xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
            <domain:name>${domain.name}</domain:name>
            <domain:roid>${domain.name.toUpperCase()}-ROID</domain:roid>
            ${domain.status.map(s => `<domain:status s="${s}"/>`).join('')}
            <domain:registrant>${domain.registrant}</domain:registrant>
            ${domain.contacts.map(c => `<domain:contact type="${c.type}">${c.id}</domain:contact>`).join('')}
            <domain:ns>
              ${domain.ns.map(n => `<domain:hostObj>${n}</domain:hostObj>`).join('')}
            </domain:ns>
            <domain:clID>REGISTRAR-1</domain:clID>
            <domain:crID>REGISTRAR-1</domain:crID>
            <domain:crDate>${domain.crDate}</domain:crDate>
            <domain:exDate>${domain.exDate}</domain:exDate>
          </domain:infData>
        </resData>${extension}`);
      }

      if (lowerXml.includes('contact:info')) {
        const id = this.extractValue(xml, 'contact:id');
        const docSnap = await getDoc(doc(db, 'registries', registryId, 'contacts', id));
        if (!docSnap.exists()) return this.generateResponse('2303', 'Object does not exist', clTRID);
        const contact = docSnap.data() as ContactObject;

        return this.generateResponse('1000', 'Command completed successfully', clTRID, `
        <resData>
          <contact:infData xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
            <contact:id>${contact.id}</contact:id>
            <contact:roid>${contact.id.toUpperCase()}-ROID</contact:roid>
            ${contact.status.map(s => `<contact:status s="${s}"/>`).join('')}
            <contact:postalInfo type="int">
              <contact:name>${contact.name}</contact:name>
              <contact:org>${contact.org || ''}</contact:org>
            </contact:postalInfo>
            <contact:voice>${contact.voice}</contact:voice>
            <contact:email>${contact.email}</contact:email>
          </contact:infData>
        </resData>`);
      }

      if (lowerXml.includes('host:info')) {
        const name = this.extractValue(xml, 'host:name');
        const docSnap = await getDoc(doc(db, 'registries', registryId, 'hosts', name));
        if (!docSnap.exists()) return this.generateResponse('2303', 'Object does not exist', clTRID);
        const host = docSnap.data() as HostObject;

        return this.generateResponse('1000', 'Command completed successfully', clTRID, `
        <resData>
          <host:infData xmlns:host="urn:ietf:params:xml:ns:host-1.0">
            <host:name>${host.name}</host:name>
            ${host.status.map(s => `<host:status s="${s}"/>`).join('')}
            ${host.addr.map(a => `<host:addr ip="v4">${a}</host:addr>`).join('')}
          </host:infData>
        </resData>`);
      }
    }

    if (lowerXml.includes('<create>')) {
        if (lowerXml.includes('domain:create')) {
            const name = this.extractValue(xml, 'domain:name');
            const docRef = doc(db, 'registries', registryId, 'domains', name);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return this.generateResponse('2302', 'Object exists', clTRID);
            }

            let secDNS = undefined;
            if (lowerXml.includes('secdns:create')) {
              const dsMatch = xml.match(/<secDNS:dsData>([\s\S]*?)<\/secDNS:dsData>/);
              if (dsMatch) {
                const dsData = {
                  keyTag: parseInt(this.extractValue(dsMatch[1], 'secDNS:keyTag')),
                  alg: parseInt(this.extractValue(dsMatch[1], 'secDNS:alg')),
                  digestType: parseInt(this.extractValue(dsMatch[1], 'secDNS:digestType')),
                  digest: this.extractValue(dsMatch[1], 'secDNS:digest'),
                };
                secDNS = { dsData: [dsData] };
              }
            }

            const newDomain: DomainObject = {
                name,
                status: ['ok'],
                registrant: this.extractValue(xml, 'domain:registrant') || 'UNKNOWN',
                contacts: [],
                ns: this.extractValues(xml, 'domain:hostObj'),
                crDate: new Date().toISOString(),
                exDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)).toISOString(),
                secDNS
            };
            await setDoc(docRef, newDomain);

            return this.generateResponse('1000', 'Command completed successfully', clTRID, `
            <resData>
              <domain:creData xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
                <domain:name>${name}</domain:name>
                <domain:crDate>${newDomain.crDate}</domain:crDate>
                <domain:exDate>${newDomain.exDate}</domain:exDate>
              </domain:creData>
            </resData>`);
        }

        if (lowerXml.includes('contact:create')) {
            const id = this.extractValue(xml, 'contact:id');
            const docRef = doc(db, 'registries', registryId, 'contacts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return this.generateResponse('2302', 'Object exists', clTRID);

            const newContact = {
                id,
                name: this.extractValue(xml, 'contact:name'),
                org: this.extractValue(xml, 'contact:org'),
                email: this.extractValue(xml, 'contact:email'),
                voice: this.extractValue(xml, 'contact:voice'),
                status: ['ok'],
            };
            await setDoc(docRef, newContact);

            return this.generateResponse('1000', 'Command completed successfully', clTRID, `
            <resData>
              <contact:creData xmlns:contact="urn:ietf:params:xml:ns:contact-1.0">
                <contact:id>${id}</contact:id>
                <contact:crDate>${new Date().toISOString()}</contact:crDate>
              </contact:creData>
            </resData>`);
        }

        if (lowerXml.includes('host:create')) {
            const name = this.extractValue(xml, 'host:name');
            const docRef = doc(db, 'registries', registryId, 'hosts', name);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) return this.generateResponse('2302', 'Object exists', clTRID);

            const newHost = {
                name,
                addr: this.extractValues(xml, 'host:addr'),
                status: ['ok'],
            };
            await setDoc(docRef, newHost);

            return this.generateResponse('1000', 'Command completed successfully', clTRID, `
            <resData>
              <host:creData xmlns:host="urn:ietf:params:xml:ns:host-1.0">
                <host:name>${name}</host:name>
                <host:crDate>${new Date().toISOString()}</host:crDate>
              </host:creData>
            </resData>`);
        }
    }

    if (lowerXml.includes('<renew>')) {
        if (lowerXml.includes('domain:renew')) {
            const name = this.extractValue(xml, 'domain:name');
            const docRef = doc(db, 'registries', registryId, 'domains', name);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return this.generateResponse('2303', 'Object does not exist', clTRID);
            
            const domain = docSnap.data() as DomainObject;
            const years = parseInt(this.extractValue(xml, 'domain:period')) || 1;
            const newExDate = new Date(new Date(domain.exDate).getTime() + (years * 365 * 24 * 60 * 60 * 1000)).toISOString();
            
            await setDoc(docRef, { ...domain, exDate: newExDate });
            
            return this.generateResponse('1000', 'Command completed successfully', clTRID, `
            <resData>
              <domain:renData xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
                <domain:name>${name}</domain:name>
                <domain:exDate>${newExDate}</domain:exDate>
              </domain:renData>
            </resData>`);
        }
    }

    if (lowerXml.includes('<transfer')) {
        const op = xml.match(/op="([^"]+)"/)?.[1] || 'query';
        const name = this.extractValue(xml, 'domain:name');
        const docRef = doc(db, 'registries', registryId, 'domains', name);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) return this.generateResponse('2303', 'Object does not exist', clTRID);
        const domain = docSnap.data() as DomainObject;

        if (op === 'request') {
            return this.generateResponse('1001', 'Command completed successfully; action pending', clTRID, `
            <resData>
              <domain:trnData xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
                <domain:name>${name}</domain:name>
                <domain:trStatus>pending</domain:trStatus>
                <domain:reID>REGISTRAR-NEW</domain:reID>
                <domain:reDate>${new Date().toISOString()}</domain:reDate>
                <domain:acID>REGISTRAR-1</domain:acID>
                <domain:acDate>${new Date(Date.now() + 86400000 * 5).toISOString()}</domain:acDate>
              </domain:trnData>
            </resData>`);
        }
        
        return this.generateResponse('1000', 'Command completed successfully', clTRID, `
        <resData>
          <domain:trnData xmlns:domain="urn:ietf:params:xml:ns:domain-1.0">
            <domain:name>${name}</domain:name>
            <domain:trStatus>clientApproved</domain:trStatus>
            <domain:reID>REGISTRAR-1</domain:reID>
            <domain:reDate>${domain.crDate}</domain:reDate>
            <domain:acID>REGISTRAR-1</domain:acID>
            <domain:acDate>${domain.crDate}</domain:acDate>
          </domain:trnData>
        </resData>`);
    }

    if (lowerXml.includes('<update>')) {
        if (lowerXml.includes('domain:update')) {
            const name = this.extractValue(xml, 'domain:name');
            const docRef = doc(db, 'registries', registryId, 'domains', name);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return this.generateResponse('2303', 'Object does not exist', clTRID);
            const domain = docSnap.data() as DomainObject;

            // Handle sub-tags for ns updates
            const addNs = xml.match(/<domain:add>[\s\S]*?<domain:ns>([\s\S]*?)<\/domain:ns>/);
            const remNs = xml.match(/<domain:rem>[\s\S]*?<domain:ns>([\s\S]*?)<\/domain:ns>/);

            let ns = [...domain.ns];
            if (addNs) {
                const newHosts = Array.from(addNs[1].matchAll(/<domain:hostObj>([^<]+)<\/domain:hostObj>/g)).map(m => m[1]);
                ns = Array.from(new Set([...ns, ...newHosts]));
            }
            if (remNs) {
                const oldHosts = Array.from(remNs[1].matchAll(/<domain:hostObj>([^<]+)<\/domain:hostObj>/g)).map(m => m[1]);
                ns = ns.filter(n => !oldHosts.includes(n));
            }

            let secDNS = domain.secDNS;
            // Handle secDNS updates
            if (lowerXml.includes('secdns:add')) {
              const dsMatch = xml.match(/<secDNS:dsData>([\s\S]*?)<\/secDNS:dsData>/);
              if (dsMatch) {
                const dsData = {
                  keyTag: parseInt(this.extractValue(dsMatch[1], 'secDNS:keyTag')),
                  alg: parseInt(this.extractValue(dsMatch[1], 'secDNS:alg')),
                  digestType: parseInt(this.extractValue(dsMatch[1], 'secDNS:digestType')),
                  digest: this.extractValue(dsMatch[1], 'secDNS:digest'),
                };
                secDNS = { dsData: [...(secDNS?.dsData || []), dsData] };
              }
            }
            if (lowerXml.includes('secdns:rem')) {
               secDNS = undefined; // Simple clear for mock
            }
            if (lowerXml.includes('secdns:all')) {
               const allVal = this.extractValue(xml, 'secDNS:all');
               if (allVal === 'true') secDNS = undefined;
            }

            await setDoc(docRef, { ...domain, ns, secDNS });

            return this.generateResponse('1000', 'Command completed successfully', clTRID);
        }

        if (lowerXml.includes('host:update')) {
            const name = this.extractValue(xml, 'host:name');
            const docRef = doc(db, 'registries', registryId, 'hosts', name);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return this.generateResponse('2303', 'Object does not exist', clTRID);
            const host = docSnap.data() as HostObject;

            const addAddr = xml.match(/<host:add>[\s\S]*?<host:addr[^>]*>([^<]+)<\/host:addr>/g);
            const remAddr = xml.match(/<host:rem>[\s\S]*?<host:addr[^>]*>([^<]+)<\/host:addr>/g);

            let addr = [...host.addr];
            if (addAddr) {
                const newAddrs = addAddr.map(a => a.match(/>([^<]+)</)![1]);
                addr = Array.from(new Set([...addr, ...newAddrs]));
            }
            if (remAddr) {
                const oldAddrs = remAddr.map(a => a.match(/>([^<]+)</)![1]);
                addr = addr.filter(a => !oldAddrs.includes(a));
            }

            await setDoc(docRef, { ...host, addr });
            return this.generateResponse('1000', 'Command completed successfully', clTRID);
        }
    }

    if (lowerXml.includes('<delete>')) {
        if (lowerXml.includes('domain:delete')) {
            const name = this.extractValue(xml, 'domain:name');
            const docRef = doc(db, 'registries', registryId, 'domains', name);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await deleteDoc(docRef);
                return this.generateResponse('1000', 'Command completed successfully', clTRID);
            }
            return this.generateResponse('2303', 'Object does not exist', clTRID);
        }

        if (lowerXml.includes('host:delete')) {
            const name = this.extractValue(xml, 'host:name');
            const docRef = doc(db, 'registries', registryId, 'hosts', name);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await deleteDoc(docRef);
                return this.generateResponse('1000', 'Command completed successfully', clTRID);
            }
            return this.generateResponse('2303', 'Object does not exist', clTRID);
        }
    }

    return this.generateResponse('2000', 'Unknown command', clTRID);
  }

  private generateResponse(code: string, msg: string, clTRID: string, resData: string = ''): EppResponse {
    const registryPrefix = this.state.activeConnector.split(' ')[0].toUpperCase();
    const svTRID = `${registryPrefix}-SVTRID-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<epp xmlns="urn:ietf:params:xml:ns:epp-1.0">
  <response>
    <result code="${code}">
      <msg>${msg}</msg>
    </result>
    ${resData}
    <trID>
      <clTRID>${clTRID}</clTRID>
      <svTRID>${svTRID}</svTRID>
    </trID>
  </response>
</epp>`;

    return { code, msg, xml };
  }

  private extractValue(xml: string, tag: string): string {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
    return match ? match[1] : '';
  }

  private extractValues(xml: string, tag: string): string[] {
    const matches = Array.from(xml.matchAll(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'g')));
    return matches.map(m => m[1]);
  }

  private extractClTRID(xml: string): string {
    return this.extractValue(xml, 'clTRID') || 'ABC-12345';
  }
}

export const eppService = new EppService();
