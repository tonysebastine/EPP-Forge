/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Database, 
  Send, 
  RotateCcw, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Globe,
  User,
  Server,
  Code2,
  Settings,
  ChevronRight,
  ChevronDown,
  Shield,
  ShieldOff,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EppCommandType, 
  EppObjectType, 
  EppResponse, 
  RegistryState, 
  DomainObject, 
  ContactObject, 
  HostObject,
  RegistryConnector
} from './types';
import { EPP_TEMPLATES } from './constants';
import { eppService } from './services/eppService';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'explorer' | 'history'>('console');
  const [selectedCommand, setSelectedCommand] = useState<EppCommandType>(EppCommandType.LOGIN);
  const [selectedObject, setSelectedObject] = useState<EppObjectType>(EppObjectType.DOMAIN);
  const [requestXml, setRequestXml] = useState(EPP_TEMPLATES[EppCommandType.LOGIN]);
  const [response, setResponse] = useState<EppResponse | null>(null);
  const [history, setHistory] = useState<{ req: string; res: EppResponse; time: string }[]>([]);
  const [registry, setRegistry] = useState<RegistryState>({
    domains: new Map(),
    contacts: new Map(),
    hosts: new Map(),
    activeConnector: RegistryConnector.NIXI
  });
  const [isAuthReady, setIsAuthReady] = useState(true);

  useEffect(() => {
    // Auth is skipped as rules are public
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    
    const registryId = 'DEFAULT';
    
    // Listen to Domains
    const unsubDomains = onSnapshot(collection(db, 'registries', registryId, 'domains'), (snapshot) => {
      setRegistry(prev => {
        const domains = new Map(prev.domains);
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') domains.delete(change.doc.id);
          else domains.set(change.doc.id, change.doc.data() as DomainObject);
        });
        return { ...prev, domains };
      });
    }, (err) => console.error('Firestore Domain Error:', err));

    // Listen to Contacts
    const unsubContacts = onSnapshot(collection(db, 'registries', registryId, 'contacts'), (snapshot) => {
      setRegistry(prev => {
        const contacts = new Map(prev.contacts);
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') contacts.delete(change.doc.id);
          else contacts.set(change.doc.id, change.doc.data() as ContactObject);
        });
        return { ...prev, contacts };
      });
    }, (err) => console.error('Firestore Contact Error:', err));

    // Listen to Hosts
    const unsubHosts = onSnapshot(collection(db, 'registries', registryId, 'hosts'), (snapshot) => {
      setRegistry(prev => {
        const hosts = new Map(prev.hosts);
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') hosts.delete(change.doc.id);
          else hosts.set(change.doc.id, change.doc.data() as HostObject);
        });
        return { ...prev, hosts };
      });
    }, (err) => console.error('Firestore Host Error:', err));

    return () => {
      unsubDomains();
      unsubContacts();
      unsubHosts();
    };
  }, [isAuthReady]);

  useEffect(() => {
    const key = selectedCommand === EppCommandType.LOGIN || selectedCommand === EppCommandType.LOGOUT
      ? selectedCommand
      : `${selectedCommand}-${selectedObject}`;
    
    if (EPP_TEMPLATES[key]) {
      setRequestXml(EPP_TEMPLATES[key]);
    }
  }, [selectedCommand, selectedObject]);

  const handleSend = async () => {
    try {
      const res = await eppService.processRequest(requestXml);
      setResponse(res);
      setHistory(prev => [{ req: requestXml, res, time: new Date().toLocaleTimeString() }, ...prev]);
    } catch (err) {
      console.error('EPP Error:', err);
      // Fallback/Error state if needed
    }
  };

  const changeConnector = (connector: RegistryConnector) => {
    eppService.setConnector(connector);
    setRegistry(prev => ({ ...prev, activeConnector: connector }));
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <nav className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-700 z-50">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight uppercase italic text-white flex items-center gap-2">
            <Terminal size={20} className="text-blue-400" />
            EPP FORGE
          </h1>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-1">v4.2.1 Core Emulator</p>
        </div>
        
        <div className="flex-1 py-4">
          <ul className="space-y-1">
            {[
              { id: 'console', label: 'Dashboard', icon: Terminal },
              { id: 'explorer', label: 'Domain Registry', icon: Globe },
              { id: 'history', label: 'Transaction Logs', icon: History },
            ].map((tab) => (
              <li 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 cursor-pointer flex items-center gap-3 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white font-bold border-l-4 border-blue-400' 
                    : 'text-slate-400 hover:bg-slate-800 border-l-4 border-transparent'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-slate-600'} />
                <span className="text-sm uppercase tracking-wide">{tab.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-slate-950">
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></div>
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-widest">{registry.activeConnector} Connected</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">ID: {registry.activeConnector.split(' ')[0].toUpperCase()}-PROD-9921</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 min-h-[64px]">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Registry Connector</label>
              <select 
                value={registry.activeConnector}
                onChange={(e) => changeConnector(e.target.value as RegistryConnector)}
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                {Object.values(RegistryConnector).map(conn => (
                  <option key={conn} value={conn}>{conn}</option>
                ))}
              </select>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="bg-slate-100 px-3 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Endpoint: 127.0.0.1:700
            </div>
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded text-[10px] font-bold uppercase border border-blue-100">
               X-REGISTRAR-TEST-OK
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => window.location.reload()}
              className="bg-slate-900 text-white px-4 py-2 text-[10px] font-bold rounded-sm uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              New Session
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 min-h-0 overflow-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'console' && (
              <motion.div 
                key="console" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-6 h-full"
              >
                {/* Left: Command Builder */}
                <section className="col-span-4 flex flex-col space-y-6">
                  <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-sm">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                      <Code2 size={14} />
                      Command Builder
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Operation Type</label>
                        <select 
                          value={selectedCommand}
                          onChange={(e) => setSelectedCommand(e.target.value as EppCommandType)}
                          className="w-full border border-slate-200 p-2.5 text-xs focus:outline-none focus:border-blue-500 bg-slate-50 font-medium"
                        >
                          {Object.values(EppCommandType).map(cmd => (
                            <option key={cmd} value={cmd}>{cmd.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {[EppCommandType.CHECK, EppCommandType.INFO, EppCommandType.CREATE, EppCommandType.DELETE, EppCommandType.RENEW, EppCommandType.UPDATE, EppCommandType.TRANSFER].includes(selectedCommand) && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Target Object</label>
                          <div className="grid grid-cols-3 gap-1">
                            {Object.values(EppObjectType).map(obj => (
                              <button
                                key={obj}
                                onClick={() => setSelectedObject(obj as EppObjectType)}
                                className={`py-2 text-[10px] font-bold uppercase border transition-all ${
                                  selectedObject === obj 
                                    ? 'bg-slate-900 border-slate-900 text-white' 
                                    : 'border-slate-200 text-slate-400 hover:bg-slate-100'
                                }`}
                              >
                                {obj}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedObject === EppObjectType.DOMAIN && (selectedCommand === EppCommandType.CREATE || selectedCommand === EppCommandType.UPDATE) && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-2">
                            <Shield size={12} />
                            Available Extensions
                          </label>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setRequestXml(EPP_TEMPLATES[selectedCommand === EppCommandType.CREATE ? 'DOMAIN-CREATE-DNSSEC' : 'DOMAIN-UPDATE-DNSSEC'])}
                              className="w-full py-2 text-[10px] font-bold uppercase border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all rounded-sm flex items-center justify-center gap-2"
                            >
                              <Shield size={10} />
                              {selectedCommand === EppCommandType.CREATE ? 'Create with DNSSEC' : 'Add DS Record'}
                            </button>
                            {selectedCommand === EppCommandType.UPDATE && (
                              <button
                                onClick={() => setRequestXml(EPP_TEMPLATES['DOMAIN-UPDATE-DNSSEC-REMOVE'])}
                                className="w-full py-2 text-[10px] font-bold uppercase border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all rounded-sm flex items-center justify-center gap-2"
                              >
                                <ShieldOff size={10} />
                                Remove DNSSEC
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedObject === EppObjectType.HOST && selectedCommand === EppCommandType.CREATE && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-2">
                            <Server size={12} />
                            Host Options
                          </label>
                          <button
                            onClick={() => setRequestXml(EPP_TEMPLATES['HOST-CREATE-GLUE'])}
                            className="w-full py-2 text-[10px] font-bold uppercase border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all rounded-sm flex items-center justify-center gap-2"
                          >
                            <Server size={10} />
                            Load Glue (IPv4/v6) Template
                          </button>
                        </div>
                      )}

                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <button 
                          onClick={handleSend}
                          className="w-full bg-blue-600 text-white py-4 font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98]"
                        >
                          Execute EPP Call
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 border border-slate-200 shadow-sm flex-1 rounded-sm">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                       <Settings size={14} />
                       API Credentials
                    </h2>
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">clID / Username</p>
                        <code className="text-xs font-mono font-bold text-blue-600 underline">TEST-USER</code>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">pw / Password / API Key</p>
                        <code className="text-xs font-mono font-bold text-blue-600 underline">password</code>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded">
                        <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Endpoint (POST XML)</p>
                        <code className="text-[10px] font-mono font-bold text-blue-700 whitespace-pre-wrap break-all">
                          {window.location.origin}/api/epp
                        </code>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase mb-2">Integration Guide</h4>
                        <p className="text-[10px] leading-relaxed text-slate-500">
                          Send a <code className="bg-slate-100 px-1">POST</code> request with <code className="bg-slate-100 px-1">Content-Type: application/xml</code>. 
                          Remember to <code className="text-blue-600">login</code> first to verify credentials.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-sm">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Execution Stats</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Avg Response Time</span>
                        <span className="text-xs font-mono font-bold">42ms</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1">
                        <div className="bg-blue-600 h-full w-[42%]"></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Mock Payload Load</span>
                        <span className="text-xs font-mono font-bold">12%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1">
                        <div className="bg-emerald-500 h-full w-[12%]"></div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <p className="text-[10px] leading-relaxed text-slate-400 italic">
                          NIXI EPP v1.0 schema active. Mapping detected for auto-dns-proxy-v2 emulator.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Right: Inspector */}
                <section className="col-span-8 flex flex-col min-h-0 bg-slate-900 rounded-sm shadow-xl overflow-hidden">
                  <div className="bg-slate-800 px-6 py-3 flex justify-between items-center border-b border-slate-700">
                    <div className="flex space-x-6">
                      <button className="text-[10px] font-bold uppercase text-white border-b-2 border-blue-500 pb-1">Live XML Stream</button>
                      <button className="text-[10px] font-bold uppercase text-slate-400 hover:text-white pb-1 transition-colors">Stack Trace</button>
                      <button className="text-[10px] font-bold uppercase text-slate-400 hover:text-white pb-1 transition-colors">RAW Hex</button>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Snapshot: {new Date().toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="flex-1 p-8 font-mono text-[13px] leading-relaxed overflow-auto text-slate-300">
                    <div className="mb-8">
                       <XMLContent xml={requestXml} type="request" />
                    </div>
                    
                    {response && (
                      <div className="border-t border-slate-800 mt-8 pt-8">
                         <div className={`mb-4 inline-flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${response.code.startsWith('1') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                           {response.code.startsWith('1') ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                           SERVER RESPONSE: {response.code} {response.msg}
                         </div>
                         <XMLContent xml={response.xml} type="response" />
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-950 px-6 py-3 border-t border-slate-800">
                    <div className="flex items-center text-[10px] font-mono text-slate-500 space-x-6">
                      <span className="text-blue-400 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400 group-hover:animate-ping" />
                        [SENT] EPP:{selectedCommand.toUpperCase()}
                      </span>
                      {response && (
                        <span className="text-emerald-400 flex items-center gap-2 border-l border-slate-800 pl-6">
                          <div className="w-1 h-1 rounded-full bg-emerald-400" />
                          [RECV] 1000 OK
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'explorer' && (
              <motion.div 
                key="explorer" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6 pb-20"
              >
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Managed Domains</h4>
                    <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{registry.domains.size}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Contacts</h4>
                    <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{registry.contacts.size}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registrar Hosts</h4>
                    <p className="text-4xl font-bold font-mono text-slate-900 tracking-tighter">{registry.hosts.size}</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-6 shadow-sm rounded-sm">
                     <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Buffer Status</h4>
                     <p className="text-4xl font-bold font-mono text-emerald-600 tracking-tighter">OK</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Domain Repository</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-200 uppercase text-[10px] font-bold tracking-widest text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Domain Object</th>
                        <th className="px-6 py-4">Registry Status</th>
                        <th className="px-6 py-4">DNS Information</th>
                        <th className="px-6 py-4">Registrant Handle</th>
                        <th className="px-6 py-4">Ex-Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {(Array.from(registry.domains.values()) as DomainObject[]).map(domain => (
                        <tr key={domain.name} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900">{domain.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1.5">
                              {domain.status.map(s => (
                                <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">{s}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {domain.ns.map((ns) => {
                                const host = registry.hosts.get(ns);
                                return (
                                  <div key={ns} className="group relative">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-mono border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-help">
                                      {ns}
                                      {host && host.addr.length > 0 && " •"}
                                    </span>
                                    {host && host.addr.length > 0 && (
                                      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-slate-900 text-white text-[8px] p-1 rounded shadow-lg whitespace-nowrap z-50">
                                        {host.addr.join(', ')} (Glue)
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {domain.secDNS && (
                                <div className="group relative">
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 cursor-help">
                                    <Shield size={8} />
                                    DNSSEC
                                  </span>
                                  {domain.secDNS.dsData && domain.secDNS.dsData.length > 0 && (
                                    <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-amber-900 text-white text-[8px] p-2 rounded shadow-lg whitespace-nowrap z-50">
                                      <p className="font-bold border-b border-amber-800 mb-1 pb-1">DS Data</p>
                                      {domain.secDNS.dsData.map((ds, i) => (
                                        <div key={i} className="font-mono">
                                          Tag: {ds.keyTag} | Alg: {ds.alg} | Type: {ds.digestType}
                                          <div className="opacity-70 text-[7px] truncate max-w-[150px]">{ds.digest}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-blue-600">{domain.registrant}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-500">{new Date(domain.exDate).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                             <button 
                                onClick={() => {
                                  setSelectedObject(EppObjectType.DOMAIN);
                                  setSelectedCommand(EppCommandType.INFO);
                                  const template = EPP_TEMPLATES[`${EppCommandType.INFO}-${EppObjectType.DOMAIN}`]
                                    .replace('example.com', domain.name);
                                  setRequestXml(template);
                                  setActiveTab('console');
                                }}
                                className="text-slate-300 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded"
                                title="Inspect Object"
                             >
                                <Search size={16} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {registry.contacts.size > 0 && (
                  <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Registry Contacts</h3>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-200 uppercase text-[10px] font-bold tracking-widest text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Handle</th>
                          <th className="px-6 py-4">Full Name</th>
                          <th className="px-6 py-4">Email Address</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {(Array.from(registry.contacts.values()) as ContactObject[]).map(contact => (
                          <tr key={contact.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{contact.id}</td>
                            <td className="px-6 py-4">{contact.name}</td>
                            <td className="px-6 py-4 text-slate-500">{contact.email}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-400">{contact.voice}</td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                  onClick={() => {
                                    setSelectedObject(EppObjectType.CONTACT);
                                    setSelectedCommand(EppCommandType.INFO);
                                    const template = EPP_TEMPLATES[`${EppCommandType.INFO}-${EppObjectType.CONTACT}`]
                                      .replace('CONTACT-123', contact.id);
                                    setRequestXml(template);
                                    setActiveTab('console');
                                  }}
                                  className="text-slate-300 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100"
                                  title="Inspect Object"
                               >
                                  <Search size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {registry.hosts.size > 0 && (
                  <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Registered Hosts</h3>
                    </div>
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 border-b border-slate-200 uppercase text-[10px] font-bold tracking-widest text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Hostname</th>
                          <th className="px-6 py-4">IP Addresses</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {(Array.from(registry.hosts.values()) as HostObject[]).map(host => (
                          <tr key={host.name} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{host.name}</td>
                            <td className="px-6 py-4">
                               <div className="flex gap-2">
                                  {host.addr.map(a => <span key={a} className="text-xs font-mono bg-slate-100 px-1 border border-slate-200">{a}</span>)}
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               {host.status.map(s => <span key={s} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500">{s}</span>)}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                  onClick={() => {
                                    setSelectedObject(EppObjectType.HOST);
                                    setSelectedCommand(EppCommandType.INFO);
                                    const template = EPP_TEMPLATES[`${EppCommandType.INFO}-${EppObjectType.HOST}`]
                                      .replace('ns1.example.com', host.name);
                                    setRequestXml(template);
                                    setActiveTab('console');
                                  }}
                                  className="text-slate-300 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100"
                                  title="Inspect Object"
                               >
                                  <Search size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                 {history.map((record, i) => (
                   <div key={i} className="bg-white border border-slate-200 p-6 flex items-center justify-between shadow-sm group hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`w-10 h-10 rounded flex items-center justify-center font-bold font-mono text-xs ${record.res.code.startsWith('1') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                          {record.res.code}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">EPP Transaction {Math.random().toString(36).substring(7).toUpperCase()}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase tracking-widest">{record.time} • Mapped via Registry-Connector-Default</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">ProcessID</p>
                            <p className="text-xs font-mono text-slate-600">SVTRID-{i+1002}</p>
                         </div>
                         <button className="px-4 py-2 border border-slate-200 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Inspect XML</button>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const XMLContent = ({ xml, type }: { xml: string; type: 'request' | 'response' }) => {
  const highlight = (xmlStr: string) => {
    return xmlStr
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?[\w:]+)/g, `<span class="${type === 'request' ? 'text-blue-400' : 'text-pink-400'}">$1</span>`)
      .replace(/(\w+="[^"]*")/g, '<span class="text-emerald-400">$1</span>')
      .replace(/(&lt;domain:name&gt;)(.*?)(&lt;\/domain:name&gt;)/g, '$1<span class="text-white">$2</span>$3')
      .replace(/(&lt;msg&gt;)(.*?)(&lt;\/msg&gt;)/g, '$1<span class="text-white">$2</span>$3');
  };

  return (
    <pre 
      className="text-xs leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlight(xml) }}
    />
  );
};
