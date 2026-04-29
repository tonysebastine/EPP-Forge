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
    <div className="flex h-screen w-full bg-surface-base text-slate-300 font-sans overflow-hidden">
      {/* Left Sidebar */}
      <nav className="w-64 bg-surface-raised flex flex-col border-r border-border-muted z-50">
        <div className="p-6 border-b border-border-muted">
          <h1 className="text-xl font-bold tracking-tight uppercase italic text-white flex items-center gap-2">
            <Terminal size={20} className="text-brand" />
            EPP FORGE
          </h1>
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">v4.2.1 Core Emulator</p>
        </div>
        
        <div className="flex-1 py-6 px-3">
          <div className="space-y-1">
            {[
              { id: 'console', label: 'Dashboard', icon: Terminal },
              { id: 'explorer', label: 'Domain Registry', icon: Globe },
              { id: 'history', label: 'Transaction Logs', icon: History },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`nav-item-btn w-full ${activeTab === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-brand' : 'text-slate-500'} />
                <span className="uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-surface-base/50">
          <div className="flex items-center mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] text-success uppercase font-bold tracking-widest">{registry.activeConnector} Connected</span>
          </div>
          <p className="text-[10px] text-slate-600 font-mono">ID: {registry.activeConnector.split(' ')[0].toUpperCase()}-PROD-9921</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 bg-surface-base border-b border-border-muted flex items-center justify-between px-8 min-h-[64px]">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Active Registry Connector</label>
              <select 
                value={registry.activeConnector}
                onChange={(e) => changeConnector(e.target.value as RegistryConnector)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer hover:text-brand transition-colors"
              >
                {Object.values(RegistryConnector).map(conn => (
                  <option key={conn} value={conn} className="bg-surface-raised">{conn}</option>
                ))}
              </select>
            </div>
            <div className="h-8 w-px bg-border-muted" />
            <div className="bg-white/5 px-3 py-1.5 rounded border border-border-subtle flex items-center gap-2">
               <span className="text-[10px] font-mono text-slate-400">Endpoint:</span>
               <span className="text-[10px] font-mono text-brand">127.0.0.1:700</span>
            </div>
            <div className="px-3 py-1 rounded text-[10px] font-bold uppercase border border-brand/20 bg-brand/5 text-brand-light tracking-wider">
               X-REGISTRAR-TEST-OK
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="tech-button"
            >
              <RotateCcw size={12} />
              Reset Session
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
                  <div className="glass-panel p-6">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand mb-6 flex items-center gap-2">
                      <Code2 size={14} />
                      Command Configuration
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 mt-4">Operation Type</label>
                        <select 
                          value={selectedCommand}
                          onChange={(e) => setSelectedCommand(e.target.value as EppCommandType)}
                          className="w-full bg-white/5 border border-border-muted p-2.5 text-xs text-white focus:outline-none focus:border-brand transition-colors font-medium rounded-sm"
                        >
                          {Object.values(EppCommandType).map(cmd => (
                            <option key={cmd} value={cmd} className="bg-surface-raised">{cmd.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      {[EppCommandType.CHECK, EppCommandType.INFO, EppCommandType.CREATE, EppCommandType.DELETE, EppCommandType.RENEW, EppCommandType.UPDATE, EppCommandType.TRANSFER].includes(selectedCommand) && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 mt-4">Target Object</label>
                          <div className="grid grid-cols-3 gap-1">
                            {Object.values(EppObjectType).map(obj => (
                              <button
                                key={obj}
                                onClick={() => setSelectedObject(obj as EppObjectType)}
                                className={`py-2 text-[10px] font-bold uppercase border transition-all rounded-sm ${
                                  selectedObject === obj 
                                    ? 'bg-brand/20 border-brand text-brand-light' 
                                    : 'border-border-muted text-slate-500 hover:border-border-strong hover:text-slate-300'
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
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 mt-4 flex items-center gap-2">
                            <Shield size={12} />
                            Security Extensions
                          </label>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => setRequestXml(EPP_TEMPLATES[selectedCommand === EppCommandType.CREATE ? 'DOMAIN-CREATE-DNSSEC' : 'DOMAIN-UPDATE-DNSSEC'])}
                              className="tech-button border-amber-500/30 text-amber-500 bg-amber-500/5 hover:border-amber-500 hover:text-amber-400"
                            >
                              <Shield size={10} />
                              {selectedCommand === EppCommandType.CREATE ? 'Provision with DNSSEC' : 'Append DS Record'}
                            </button>
                            {selectedCommand === EppCommandType.UPDATE && (
                              <button
                                onClick={() => setRequestXml(EPP_TEMPLATES['DOMAIN-UPDATE-DNSSEC-REMOVE'])}
                                className="tech-button"
                              >
                                <ShieldOff size={10} />
                                Purge DNSSEC State
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedObject === EppObjectType.HOST && selectedCommand === EppCommandType.CREATE && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2 mt-4 flex items-center gap-2">
                            <Server size={12} />
                            Host Definition
                          </label>
                          <button
                            onClick={() => setRequestXml(EPP_TEMPLATES['HOST-CREATE-GLUE'])}
                            className="tech-button border-brand/30 text-brand-light bg-brand/5"
                          >
                            <Server size={10} />
                            Apply Glue Record Template
                          </button>
                        </div>
                      )}

                      <div className="pt-6 mt-6 border-t border-border-muted">
                        <button 
                          onClick={handleSend}
                          className="w-full bg-brand hover:bg-brand-dark text-white py-4 font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-[0.98] rounded-sm"
                        >
                          Execute EPP Command
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 flex-1">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                       <Settings size={14} />
                       Authentication Context
                    </h2>
                    <div className="space-y-4">
                      <div className="p-3 bg-white/5 border border-border-subtle rounded-sm">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">clID Identifier</p>
                        <code className="text-xs font-mono font-bold text-brand italic">TEST-USER</code>
                      </div>
                      <div className="p-3 bg-white/5 border border-border-subtle rounded-sm">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Authorization Token</p>
                        <code className="text-xs font-mono font-bold text-brand italic">********</code>
                      </div>
                      <div className="p-3 bg-brand/5 border border-brand/20 rounded-sm">
                        <p className="text-[10px] font-bold text-brand-light uppercase mb-1">Public Endpoint</p>
                        <code className="text-[10px] font-mono font-bold text-slate-300 break-all">
                          {window.location.origin}/api/epp
                        </code>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Right: Inspector */}
                <section className="col-span-8 flex flex-col min-h-0 glass-panel overflow-hidden border-border-strong bg-surface-raised shadow-2xl">
                  <div className="bg-white/5 px-6 py-3 flex justify-between items-center border-b border-border-strong">
                    <div className="flex space-x-6">
                      <button className="text-[10px] font-bold uppercase text-brand border-b-2 border-brand pb-1">XML View</button>
                      <button className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 pb-1 transition-colors">Metadata</button>
                      <button className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300 pb-1 transition-colors">RAW Payload</button>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-mono text-slate-600 uppercase">SYS-TIME: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 font-mono text-[13px] leading-relaxed overflow-auto text-slate-400 bg-[#000]/20">
                    <div className="mb-8">
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase mb-4 tracking-widest border-b border-border-subtle pb-2">
                          <Send size={12} /> Registry Request (clTRID: {requestXml.match(/<clTRID>(.*?)<\/clTRID>/)?.[1] || '---'})
                       </div>
                       <XMLContent xml={requestXml} type="request" />
                    </div>
                    
                    {response && (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-t border-border-strong mt-8 pt-8"
                      >
                         <div className={`mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-sm text-[10px] font-bold uppercase ${response.code.startsWith('1') ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                           {response.code.startsWith('1') ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                           Protocol Response Code: {response.code}
                         </div>
                         <div className="text-white text-sm mb-4 font-sans">{response.msg}</div>
                         <XMLContent xml={response.xml} type="response" />
                      </motion.div>
                    )}
                  </div>

                  <div className="bg-surface-base/80 px-6 py-4 border-t border-border-strong">
                    <div className="flex items-center text-[10px] font-mono text-slate-600 space-x-8">
                      <span className="text-brand flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-brand animate-pulse" />
                        [TX] {selectedCommand.toUpperCase()}:{selectedObject.toUpperCase()}
                      </span>
                      {response && (
                        <span className="text-success flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-success" />
                          [RX] {response.code} STATUS_OK
                        </span>
                      )}
                      <span className="flex-1 text-right text-slate-700">MTU: 1500 | TLSv1.3 | AES-256-GCM</span>
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
                  <div className="glass-panel p-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 italic">Total Managed Domains</h4>
                    <p className="text-4xl font-bold font-mono text-white tracking-tighter">{registry.domains.size}</p>
                  </div>
                  <div className="glass-panel p-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 italic">Active Contacts</h4>
                    <p className="text-4xl font-bold font-mono text-white tracking-tighter">{registry.contacts.size}</p>
                  </div>
                  <div className="glass-panel p-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 italic">Registrar Hosts</h4>
                    <p className="text-4xl font-bold font-mono text-white tracking-tighter">{registry.hosts.size}</p>
                  </div>
                  <div className="glass-panel p-6">
                     <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 italic">Buffer Status</h4>
                     <p className="text-4xl font-bold font-mono text-success tracking-tighter">100%</p>
                  </div>
                </div>

                <div className="glass-panel overflow-hidden">
                  <div className="px-6 py-4 bg-white/5 border-b border-border-muted flex justify-between items-center">
                     <h3 className="text-xs font-bold uppercase tracking-widest text-white italic">Domain Repository</h3>
                     <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded border border-border-subtle">
                           <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sync Active</span>
                        </div>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-white/2 border-b border-border-muted text-[10px] font-bold tracking-widest text-slate-500 uppercase italic">
                        <tr>
                          <th className="px-6 py-4">Domain Object</th>
                          <th className="px-6 py-4">Registry Status</th>
                          <th className="px-6 py-4 text-center">DNSSEC</th>
                          <th className="px-6 py-4">Registrant Handle</th>
                          <th className="px-6 py-4">Ex-Date</th>
                          <th className="px-6 py-4 text-right">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle text-sm">
                        {(Array.from(registry.domains.values()) as DomainObject[]).map(domain => (
                          <tr key={domain.name} className="data-grid-row group cursor-pointer transition-colors hover:bg-white/[0.03]">
                            <td className="px-6 py-4 font-bold text-white font-mono tracking-tight">{domain.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-1.5">
                                {domain.status.map(s => (
                                  <span key={s} className="px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase bg-white/5 text-slate-500 border border-border-muted">{s}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {domain.secDNS ? (
                                <div className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/20 text-[9px] font-bold uppercase tracking-widest">
                                  <Shield size={10} /> Active
                                </div>
                              ) : (
                                <span className="text-slate-700 text-[9px] font-bold uppercase">Inactive</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-brand">{domain.registrant}</td>
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
                                  className="text-slate-500 hover:text-brand transition-colors p-2"
                               >
                                  <Search size={16} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {registry.contacts.size > 0 && (
                    <div className="glass-panel overflow-hidden">
                      <div className="px-6 py-4 bg-white/5 border-b border-border-muted">
                         <h3 className="text-xs font-bold uppercase tracking-widest text-white italic">Registry Contacts</h3>
                      </div>
                      <table className="w-full text-left">
                        <thead className="bg-white/2 border-b border-border-muted text-[10px] font-bold tracking-widest text-slate-500 uppercase italic">
                          <tr>
                            <th className="px-6 py-4">Handle</th>
                            <th className="px-6 py-4">Full Name</th>
                            <th className="px-6 py-4 text-right">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-sm">
                          {(Array.from(registry.contacts.values()) as ContactObject[]).map(contact => (
                            <tr key={contact.id} className="data-grid-row group hover:bg-white/[0.03] transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-brand">{contact.id}</td>
                              <td className="px-6 py-4 text-slate-300">{contact.name}</td>
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
                                    className="text-slate-500 hover:text-brand transition-colors p-1"
                                 >
                                    <Search size={14} />
                                 </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {registry.hosts.size > 0 && (
                    <div className="glass-panel overflow-hidden">
                      <div className="px-6 py-4 bg-white/5 border-b border-border-muted">
                         <h3 className="text-xs font-bold uppercase tracking-widest text-white italic">Registered Hosts</h3>
                      </div>
                      <table className="w-full text-left">
                        <thead className="bg-white/2 border-b border-border-muted text-[10px] font-bold tracking-widest text-slate-500 uppercase italic">
                          <tr>
                            <th className="px-6 py-4">Hostname</th>
                            <th className="px-6 py-4">IP Set</th>
                            <th className="px-6 py-4 text-right">Inspect</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle text-sm">
                          {(Array.from(registry.hosts.values()) as HostObject[]).map(host => (
                            <tr key={host.name} className="data-grid-row group hover:bg-white/[0.03] transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-brand">{host.name}</td>
                              <td className="px-6 py-4">
                                 <div className="flex gap-2">
                                    {host.addr.map(a => <span key={a} className="mono-tag">{a}</span>)}
                                 </div>
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
                                    className="text-slate-500 hover:text-brand transition-colors p-1"
                                 >
                                    <Search size={14} />
                                 </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                 {history.map((record, i) => (
                   <div key={i} className="glass-panel p-6 flex items-center justify-between group hover:border-brand/40 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-sm flex flex-col items-center justify-center font-bold font-mono text-[10px] border ${record.res.code.startsWith('1') ? 'bg-success/5 text-success border-success/20' : 'bg-error/5 text-error border-error/20'}`}>
                          <span className="opacity-50 text-[8px] mb-0.5">CODE</span>
                          {record.res.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <p className="text-sm font-bold text-white uppercase tracking-tight">EPP Transaction {Math.random().toString(36).substring(7).toUpperCase()}</p>
                             <div className="px-1.5 py-0.5 bg-white/5 border border-border-subtle rounded text-[8px] font-mono text-slate-500 uppercase">clTRID: {record.req.match(/<clTRID>(.*?)<\/clTRID>/)?.[1] || '---'}</div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-1.5 uppercase tracking-widest">{record.time} • SVTRID: SV-{i+9921}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                            <p className={`text-[10px] font-bold uppercase ${record.res.code.startsWith('1') ? 'text-success' : 'text-error'}`}>
                               {record.res.msg.split(' ')[0]}
                            </p>
                         </div>
                         <button className="tech-button border-border-muted hover:border-brand h-9">
                            Inspect XML
                         </button>
                      </div>
                   </div>
                 ))}
                 {history.length === 0 && (
                   <div className="glass-panel p-12 text-center">
                      <History size={48} className="mx-auto text-slate-700 mb-4 opacity-20" />
                      <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No transaction records detected in current session buffer</p>
                   </div>
                 )}
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
      .replace(/(&lt;\/?[\w:]+)/g, `<span class="${type === 'request' ? 'text-brand-light font-bold' : 'text-pink-400 font-bold'}">$1</span>`)
      .replace(/(\w+="[^"]*")/g, '<span class="text-emerald-500 italic">$1</span>')
      .replace(/(&lt;[\w:]+&gt;)(.*?)(&lt;\/[\w:]+&gt;)/g, (match, p1, p2, p3) => {
        if (p2.trim() === '') return match;
        return `${p1}<span class="text-white font-medium">${p2}</span>${p3}`;
      });
  };

  return (
    <pre 
      className="text-xs leading-[1.6] font-mono selection:bg-brand/40 whitespace-pre-wrap"
      dangerouslySetInnerHTML={{ __html: highlight(xml) }}
    />
  );
};
