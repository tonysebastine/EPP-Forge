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
  Search,
  Copy,
  Check,
  BookText,
  PlayCircle
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
  const [inspectorTab, setInspectorTab] = useState<'xml' | 'metadata' | 'raw'>('xml');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
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
    const key = [EppCommandType.LOGIN, EppCommandType.LOGOUT, EppCommandType.POLL].includes(selectedCommand)
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
                      {[
                        { id: 'xml', label: 'XML View' },
                        { id: 'metadata', label: 'Metadata' },
                        { id: 'raw', label: 'RAW Payload' }
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => setInspectorTab(t.id as any)}
                          className={`text-[10px] font-bold uppercase pb-1 transition-colors ${
                            inspectorTab === t.id ? 'text-brand border-b-2 border-brand' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-mono text-slate-600 uppercase">SYS-TIME: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 font-mono text-[13px] leading-relaxed overflow-auto text-slate-400 bg-[#000]/20">
                    {inspectorTab === 'xml' ? (
                      <>
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
                      </>
                    ) : inspectorTab === 'metadata' ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-white/5 border border-border-subtle rounded">
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Protocol Command</p>
                              <p className="text-white font-bold">{selectedCommand.toUpperCase()}</p>
                           </div>
                           <div className="p-4 bg-white/5 border border-border-subtle rounded">
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Registry Target</p>
                              <p className="text-brand font-bold">{selectedObject.toUpperCase()}</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-border-subtle pb-2">Active Namespaces</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {Array.from(requestXml.matchAll(/xmlns:?(\w*)="(.*?)"/g)).map((match, i) => (
                              <div key={i} className="text-[11px] font-mono flex gap-2 p-2 bg-white/2 rounded border border-white/5">
                                <span className="text-brand-light font-bold min-w-[80px]">{match[1] || 'default'}:</span>
                                <span className="text-slate-400 break-all">{match[2]}</span>
                              </div>
                            ))}
                            {response && Array.from(response.xml.matchAll(/xmlns:?(\w*)="(.*?)"/g)).map((match, i) => (
                              <div key={`res-${i}`} className="text-[11px] font-mono flex gap-2 p-2 bg-pink-500/5 rounded border border-pink-500/10">
                                <span className="text-pink-400 font-bold min-w-[80px]">{match[1] || 'default'}:</span>
                                <span className="text-slate-400 break-all">{match[2]}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-white/5 border border-border-subtle rounded">
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Client Transaction ID</p>
                              <p className="text-xs font-mono text-slate-300">{requestXml.match(/<clTRID>(.*?)<\/clTRID>/)?.[1] || 'NOT_SET'}</p>
                           </div>
                           <div className="p-4 bg-white/5 border border-border-subtle rounded">
                              <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Server Transaction ID</p>
                              <p className="text-xs font-mono text-slate-300">{response?.xml.match(/<svTRID>(.*?)<\/svTRID>/)?.[1] || 'WAITING...'}</p>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div>
                           <div className="text-[10px] text-slate-600 mb-4 font-bold uppercase flex items-center gap-2 border-b border-border-subtle pb-2">
                              <Send size={12} /> Request Fragment (Hex Dump)
                           </div>
                           <div className="grid grid-cols-8 gap-2 font-mono text-[11px]">
                              {Array.from(new TextEncoder().encode(requestXml).slice(0, 64)).map((byte, i) => (
                                <div key={i} className="bg-brand/5 p-1 text-center text-brand-light rounded border border-brand/10">
                                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                                </div>
                              ))}
                              <div className="col-span-8 text-center text-slate-700 py-2 italic text-[10px]">... truncated ...</div>
                           </div>
                        </div>

                        {response && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                             <div className="text-[10px] text-slate-600 mb-4 font-bold uppercase flex items-center gap-2 border-b border-border-subtle pb-2">
                                <Search size={12} /> Response Fragment (Hex Dump)
                             </div>
                             <div className="grid grid-cols-8 gap-2 font-mono text-[11px]">
                                {Array.from(new TextEncoder().encode(response.xml).slice(0, 64)).map((byte, i) => (
                                  <div key={i} className="bg-pink-500/5 p-1 text-center text-pink-400 rounded border border-pink-500/10">
                                    {byte.toString(16).padStart(2, '0').toUpperCase()}
                                  </div>
                                ))}
                                <div className="col-span-8 text-center text-slate-700 py-2 italic text-[10px]">... truncated ...</div>
                             </div>
                          </motion.div>
                        )}
                      </div>
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
                          <React.Fragment key={domain.name}>
                            <tr 
                              className={`data-grid-row group cursor-pointer transition-colors ${expandedDomain === domain.name ? 'bg-brand/5' : 'hover:bg-white/[0.03]'}`}
                              onClick={() => setExpandedDomain(expandedDomain === domain.name ? null : domain.name)}
                            >
                              <td className="px-6 py-4 font-bold text-white font-mono tracking-tight flex items-center gap-2">
                                {expandedDomain === domain.name ? <ChevronDown size={14} className="text-brand" /> : <ChevronRight size={14} className="text-slate-600" />}
                                {domain.name}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-1.5">
                                  {domain.status.map(s => (
                                    <span key={s} className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase border ${
                                      s === 'ok' ? 'bg-success/10 text-success border-success/20' : 'bg-white/5 text-slate-500 border-border-muted'
                                    }`}>{s}</span>
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
                                    onClick={(e) => {
                                      e.stopPropagation();
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
                            {expandedDomain === domain.name && (
                              <tr>
                                <td colSpan={6} className="px-12 py-6 bg-brand/[0.02] border-b border-border-subtle">
                                  <div className="grid grid-cols-3 gap-8">
                                    <div>
                                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Server size={12} /> Delegate Nameservers
                                      </h5>
                                      <div className="space-y-2">
                                        {domain.ns.map(ns => (
                                          <div key={ns} className="flex items-center justify-between p-2 bg-white/5 rounded border border-border-subtle">
                                            <span className="text-xs font-mono text-slate-300">{ns}</span>
                                            {registry.hosts.get(ns)?.addr.length ? (
                                              <span className="text-[9px] font-bold text-brand uppercase tracking-tighter">Glue Intact</span>
                                            ) : (
                                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">External</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Shield size={12} /> DNSSEC Configuration
                                      </h5>
                                      {domain.secDNS ? (
                                        <div className="space-y-2">
                                          {domain.secDNS.dsData.map((ds, i) => (
                                            <div key={i} className="p-3 bg-amber-500/5 rounded border border-amber-500/10 text-[10px]">
                                              <div className="flex justify-between font-bold text-amber-500 mb-1">
                                                <span>Key Tag: {ds.keyTag}</span>
                                                <span>Alg: {ds.alg}</span>
                                              </div>
                                              <p className="font-mono text-slate-500 truncate">{ds.digest}</p>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-20 border border-dashed border-border-muted rounded">
                                          <ShieldOff size={24} className="text-slate-800 mb-2" />
                                          <span className="text-[9px] text-slate-600 font-bold uppercase">No signed zones detected</span>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <User size={12} /> Contact Associations
                                      </h5>
                                      <div className="grid grid-cols-2 gap-2">
                                         <div className="p-2 bg-white/5 rounded border border-border-subtle">
                                            <p className="text-[8px] font-bold text-slate-500 uppercase">Registrant</p>
                                            <p className="text-[10px] font-mono text-brand truncate">{domain.registrant}</p>
                                         </div>
                                         <div className="p-2 bg-white/5 rounded border border-border-subtle opacity-50">
                                            <p className="text-[8px] font-bold text-slate-500 uppercase">Admin</p>
                                            <p className="text-[10px] font-mono text-white truncate">AUTH-ID-12</p>
                                         </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
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
                         <button 
                            onClick={() => {
                              setRequestXml(record.req);
                              setResponse(record.res);
                              setActiveTab('console');
                              setInspectorTab('xml');
                            }}
                            className="tech-button border-border-muted hover:border-brand h-9"
                         >
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

            {activeTab === 'scenarios' && (
              <motion.div key="scenarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-6">
                 {[
                   { 
                     title: "New Domain Onboarding", 
                     desc: "Full sequence: Check availability -> Create Contact -> Create Domain -> Nameserver Glue",
                     steps: ["Domain:Check", "Contact:Create", "Domain:Create", "Host:Create"],
                     severity: "Standard"
                   },
                   { 
                     title: "Security Hardening", 
                     desc: "Provision a domain with complete DNSSEC extensions and server-side locks.",
                     steps: ["Domain:Create", "Domain:Update (Add DS)", "Domain:Update (Lock)"],
                     severity: "Advanced"
                   },
                   { 
                     title: "Registry Handover", 
                     desc: "Simulate a cross-registrar transfer flow including authInfo validation.",
                     steps: ["Domain:Transfer (Request)", "Domain:Transfer (Approve)"],
                     severity: "Critical"
                   }
                 ].map((scenario, i) => (
                   <div key={i} className="glass-panel p-6 flex flex-col group hover:border-brand/50 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-sm border ${
                          scenario.severity === 'Critical' ? 'bg-error/10 text-error border-error/20' : 
                          scenario.severity === 'Advanced' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-success/10 text-success border-success/20'
                        }`}>
                          {scenario.severity} Scenario
                        </div>
                        <PlayCircle size={16} className="text-slate-700 group-hover:text-brand transition-colors" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-2">{scenario.title}</h3>
                      <p className="text-[11px] text-slate-500 mb-6 leading-relaxed flex-1">{scenario.desc}</p>
                      <div className="space-y-2 mb-6">
                        {scenario.steps.map((step, si) => (
                          <div key={si} className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-white/2 p-1.5 border border-white/5 rounded">
                             <div className="w-1 h-1 rounded-full bg-brand" />
                             {step}
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => {
                          const mapping: Record<string, { cmd: EppCommandType, obj?: EppObjectType }> = {
                            "New Domain Onboarding": { cmd: EppCommandType.CHECK, obj: EppObjectType.DOMAIN },
                            "Security Hardening": { cmd: EppCommandType.CREATE, obj: EppObjectType.DOMAIN },
                            "Registry Handover": { cmd: EppCommandType.TRANSFER, obj: EppObjectType.DOMAIN }
                          };
                          const conf = mapping[scenario.title];
                          if (conf) {
                            setSelectedCommand(conf.cmd);
                            if (conf.obj) setSelectedObject(conf.obj);
                          }
                          setActiveTab('console');
                        }}
                        className="tech-button w-full"
                      >
                        Launch Scenario Forge
                      </button>
                   </div>
                 ))}
                 <div className="glass-panel p-6 border-dashed border-slate-800 flex flex-col items-center justify-center text-center opacity-50 select-none">
                    <Terminal size={32} className="text-slate-700 mb-2" />
                    <p className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">Custom Scenarios</p>
                    <p className="text-[9px] text-slate-700 mt-1">Contact admin to provision automated templates</p>
                 </div>
              </motion.div>
            )}

            {activeTab === 'guide' && (
              <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-12 pb-20">
                <header className="space-y-4">
                  <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                    <BookText className="text-brand" />
                    Forge Integration SDK
                  </h2>
                  <p className="text-slate-400 leading-relaxed">
                    EPP Forge is designed to be fully interoperable with your existing EPP clients. 
                    Simply redirect your EPP client's transportation layer to point to this applet's API endpoint.
                  </p>
                </header>

                <div className="space-y-8">
                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">01</div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Node.js / Axios Integration</h3>
                    </div>
                    <div className="bg-black/30 p-6 rounded-lg border border-white/5 font-mono text-xs leading-relaxed">
                      <pre className="text-brand-light">
{`const axios = require('axios');

async function sendEpp(xmlPayload) {
  const FORGE_URL = "${window.location.origin}/api/epp";
  
  try {
    const response = await axios.post(FORGE_URL, xmlPayload, {
      headers: { 'Content-Type': 'application/xml' }
    });
    console.log("Registry Response:", response.data);
  } catch (error) {
    console.error("Transmission Error:", error.response?.data || error.message);
  }
}`}
                      </pre>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">02</div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Authentication Protocol</h3>
                    </div>
                    <div className="glass-panel p-6 space-y-4">
                       <p className="text-xs text-slate-400">
                         The Forge emulator uses the EPP <code className="text-brand">&lt;login&gt;</code> command for session validation. 
                         The following credentials are currently active for all developers:
                       </p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white/2 border border-border-subtle rounded">
                             <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">clID (Username)</p>
                             <p className="text-white font-mono">TEST-USER</p>
                          </div>
                          <div className="p-3 bg-white/2 border border-border-subtle rounded">
                             <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">pw (Password)</p>
                             <p className="text-white font-mono">password</p>
                          </div>
                       </div>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded bg-brand/10 flex items-center justify-center text-brand font-bold text-xs">03</div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Namespaces & Schemas</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       {[
                         { ns: 'epp-1.0', url: 'urn:ietf:params:xml:ns:epp-1.0' },
                         { ns: 'domain-1.0', url: 'urn:ietf:params:xml:ns:domain-1.0' },
                         { ns: 'host-1.0', url: 'urn:ietf:params:xml:ns:host-1.0' },
                         { ns: 'contact-1.0', url: 'urn:ietf:params:xml:ns:contact-1.0' },
                         { ns: 'secDNS-1.1', url: 'urn:ietf:params:xml:ns:secDNS-1.1' }
                       ].map(n => (
                         <div key={n.ns} className="p-3 bg-white/5 border border-border-subtle rounded-sm">
                            <p className="text-[10px] font-bold text-brand uppercase mb-1">{n.ns}</p>
                            <p className="text-[9px] font-mono text-slate-600 truncate">{n.url}</p>
                         </div>
                       ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const XMLContent = ({ xml, type }: { xml: string; type: 'request' | 'response' }) => {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = xml.split('\n');

  return (
    <div className="group relative flex font-mono text-[12px] leading-[1.6] bg-black/30 rounded-lg overflow-hidden border border-white/5">
       <button 
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 bg-white/5 border border-white/10 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 text-slate-500 hover:text-white z-10"
          title="Copy to clipboard"
       >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
       </button>
       <div className="bg-white/5 px-3 py-4 text-slate-600 text-right select-none border-r border-white/5 min-w-[40px]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
       </div>
       <pre 
         className="flex-1 p-4 overflow-x-auto selection:bg-brand/40 whitespace-pre"
         dangerouslySetInnerHTML={{ __html: highlight(xml) }}
       />
    </div>
  );
};
