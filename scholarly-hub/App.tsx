
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserRole, School, SchoolClass, Resource, ResourceType } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  AcademicCapIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  CalendarIcon,
  ArrowLeftIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PhotoIcon,
  LinkIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// --- Components ---

const Navbar = ({ onHome }: { onHome: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass px-6 py-4 flex justify-between items-center">
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 cursor-pointer"
      onClick={onHome}
    >
      <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
        <AcademicCapIcon className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Scholarly</h1>
    </motion.div>
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
        Status: Online
      </div>
    </div>
  </nav>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
        >
          <div className="px-10 pt-10 pb-4 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">✕</button>
          </div>
          <div className="px-10 pb-10">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSchool, setActiveSchool] = useState<School | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.NONE);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState<School | null>(null);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddResource, setShowAddResource] = useState<SchoolClass | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ResourceType | 'ALL'>('ALL');
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  
  useEffect(() => {
    const saved = localStorage.getItem('scholarly_data_v1');
    if (saved) {
      try { setSchools(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scholarly_data_v1', JSON.stringify(schools));
  }, [schools]);

  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools;
    const lowerQuery = searchQuery.toLowerCase();
    return schools.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) || 
      s.description.toLowerCase().includes(lowerQuery)
    );
  }, [schools, searchQuery]);

  const filteredClasses = useMemo(() => {
    if (!activeSchool) return [];
    const lowerQuery = searchQuery.toLowerCase();
    
    return activeSchool.classes.map(cls => ({
      ...cls,
      resources: cls.resources.filter(res => {
        const matchesSearch = !searchQuery || 
          cls.name.toLowerCase().includes(lowerQuery) || 
          res.title.toLowerCase().includes(lowerQuery) ||
          res.description.toLowerCase().includes(lowerQuery);
        
        const matchesTab = activeTab === 'ALL' || res.type === activeTab;
        
        return matchesSearch && matchesTab;
      })
    })).filter(cls => cls.resources.length > 0 || !searchQuery);
  }, [activeSchool, searchQuery, activeTab]);

  const handleCreateSchool = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSchool: School = {
      id: crypto.randomUUID(),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      logoUrl: formData.get('logoUrl') as string || undefined,
      studentPassword: formData.get('studentPass') as string,
      adminPassword: formData.get('adminPass') as string,
      classes: []
    };
    setSchools(prev => [newSchool, ...prev]);
    setShowCreateSchool(false);
  };

  const verifyAndLogin = (val: string, school: School) => {
    if (val === school.adminPassword) {
      setActiveSchool(school);
      setUserRole(UserRole.ADMIN);
      setShowJoinModal(null);
      setCurrentPasswordInput("");
      setSearchQuery("");
      setActiveTab('ALL');
      return true;
    } else if (val === school.studentPassword) {
      setActiveSchool(school);
      setUserRole(UserRole.STUDENT);
      setShowJoinModal(null);
      setCurrentPasswordInput("");
      setSearchQuery("");
      setActiveTab('ALL');
      return true;
    }
    return false;
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showJoinModal) {
      const success = verifyAndLogin(currentPasswordInput, showJoinModal);
      if (!success) {
        alert("Invalid access code. Please try again.");
      }
    }
  };

  const deleteSchool = (schoolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = schools.find(s => s.id === schoolId);
    if (!target) return;
    const pass = prompt(`Confirm deletion of "${target.name}" by entering its ADMIN password:`);
    if (pass === target.adminPassword) {
      setSchools(prev => prev.filter(s => s.id !== schoolId));
    } else if (pass !== null) {
      alert("Unauthorized. Deletion failed.");
    }
  };

  const handleAddClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeSchool) return;
    const formData = new FormData(e.currentTarget);
    const newClass: SchoolClass = {
      id: crypto.randomUUID(),
      name: formData.get('className') as string,
      teacher: formData.get('teacher') as string,
      resources: []
    };
    setSchools(prev => prev.map(s => {
      if (s.id === activeSchool.id) {
        const updated = { ...s, classes: [newClass, ...s.classes] };
        setActiveSchool(updated);
        return updated;
      }
      return s;
    }));
    setShowAddClass(false);
  };

  const handleAddResource = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeSchool || !showAddResource) return;
    const formData = new FormData(e.currentTarget);
    const newResource: Resource = {
      id: crypto.randomUUID(),
      type: formData.get('type') as any,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      url: formData.get('url') as string,
      createdAt: Date.now()
    };
    setSchools(prev => prev.map(s => {
      if (s.id === activeSchool.id) {
        const updatedClasses = s.classes.map(c => {
          if (c.id === showAddResource.id) {
            return { ...c, resources: [newResource, ...c.resources] };
          }
          return c;
        });
        const updatedSchool = { ...s, classes: updatedClasses };
        setActiveSchool(updatedSchool);
        return updatedSchool;
      }
      return s;
    }));
    setShowAddResource(null);
  };

  const deleteResource = (classId: string, resourceId: string) => {
    if (userRole !== UserRole.ADMIN) return;
    setSchools(prev => prev.map(s => {
      if (s.id === activeSchool?.id) {
        const updatedClasses = s.classes.map(c => {
          if (c.id === classId) {
            return { ...c, resources: c.resources.filter(r => r.id !== resourceId) };
          }
          return c;
        });
        const updatedSchool = { ...s, classes: updatedClasses };
        setActiveSchool(updatedSchool);
        return updatedSchool;
      }
      return s;
    }));
  };

  const tabs: { label: string, value: ResourceType | 'ALL', icon: any }[] = [
    { label: 'All', value: 'ALL', icon: GlobeAltIcon },
    { label: 'Announcements', value: 'ANNOUNCEMENT', icon: MegaphoneIcon },
    { label: 'Timetables', value: 'TIMETABLE', icon: CalendarIcon },
    { label: 'Lessons', value: 'VIDEO', icon: VideoCameraIcon },
    { label: 'Classes', value: 'PDF', icon: DocumentTextIcon },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar onHome={() => { setActiveSchool(null); setUserRole(UserRole.NONE); setSearchQuery(""); }} />

      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        {!activeSchool ? (
          <div>
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6"
            >
              <div className="max-w-2xl">
                <h2 className="text-6xl font-black text-slate-900 leading-none tracking-tight">
                  Academic Freedom <br/><span className="text-indigo-600">Reimagined.</span>
                </h2>
                <p className="text-xl text-slate-500 mt-6 font-medium">
                  Welcome to Scholarly. Instant virtual classrooms with zero registration. Secure, private, and lightning fast.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search hubs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 font-bold transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateSchool(true)}
                  className="bg-indigo-600 text-white px-8 py-5 rounded-2xl shadow-2xl shadow-indigo-200 font-bold flex items-center justify-center gap-3 transition-all shrink-0"
                >
                  <PlusIcon className="h-6 w-6" /> Create Hub
                </motion.button>
              </div>
            </motion.section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredSchools.map((school, i) => (
                <motion.div 
                  key={school.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => { setShowJoinModal(school); setShowPass(false); setCurrentPasswordInput(""); }}
                  className="group bg-slate-50 p-10 rounded-[3rem] cursor-pointer hover:bg-slate-100/50 transition-all border border-slate-100 flex flex-col h-full relative"
                >
                  <button 
                    onClick={(e) => deleteSchool(school.id, e)}
                    className="absolute top-8 right-8 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Hub (Admin Only)"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                  <div className="bg-white p-2 rounded-2xl shadow-sm w-fit mb-8 group-hover:scale-110 transition-transform overflow-hidden flex items-center justify-center aspect-square min-w-[64px]">
                    {school.logoUrl ? (
                      <img src={school.logoUrl} alt={school.name} className="h-16 w-16 object-contain" />
                    ) : (
                      <AcademicCapIcon className="h-10 w-10 text-indigo-600" />
                    )}
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4">{school.name}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed mb-8 flex-grow">
                    {school.description || "Building the future of decentralized education."}
                  </p>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4" /> {school.classes.length} Rooms
                    </span>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter Hub
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 p-10 rounded-[3.5rem] text-white flex flex-col lg:flex-row justify-between items-center gap-8 shadow-2xl shadow-indigo-900/20"
            >
              <div className="flex items-center gap-8 w-full lg:w-auto">
                <button 
                  onClick={() => { setActiveSchool(null); setUserRole(UserRole.NONE); setSearchQuery(""); }}
                  className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-6 flex-1">
                  <div className="bg-white/10 p-2 rounded-xl h-16 w-16 flex items-center justify-center shrink-0">
                    {activeSchool.logoUrl ? (
                      <img src={activeSchool.logoUrl} alt="" className="h-12 w-12 object-contain rounded-md" />
                    ) : (
                      <AcademicCapIcon className="h-8 w-8 text-white/50" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-4xl font-black tracking-tight">{activeSchool.name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        userRole === UserRole.ADMIN ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`}>
                        {userRole === UserRole.ADMIN ? 'Staff Profile' : 'Student Access'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative group flex-1 lg:w-72">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-white transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search contents..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 rounded-2xl bg-white/10 border border-white/10 outline-none focus:ring-4 focus:ring-indigo-500/20 font-bold transition-all text-white placeholder:text-slate-500"
                  />
                </div>
                {userRole === UserRole.ADMIN && (
                  <button 
                    onClick={() => setShowAddClass(true)}
                    className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shrink-0"
                  >
                    <PlusIcon className="h-5 w-5" /> New Room
                  </button>
                )}
              </div>
            </motion.div>

            <div className="flex flex-wrap gap-2 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                    activeTab === tab.value 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-24">
              {filteredClasses.map((cls) => (
                <motion.div 
                  key={cls.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className="relative"
                >
                  <div className="flex items-baseline justify-between mb-10 border-l-4 border-indigo-600 pr-8 pl-8">
                    <div>
                      <h4 className="text-4xl font-black text-slate-900 tracking-tight">{cls.name}</h4>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mt-2 flex items-center gap-2">
                        <UserGroupIcon className="h-4 w-4" /> Instructor: <span className="text-slate-900">{cls.teacher}</span>
                      </p>
                    </div>
                    {userRole === UserRole.ADMIN && (
                      <button onClick={() => setShowAddResource(cls)} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <PlusIcon className="h-6 w-6" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cls.resources.map((res, ri) => (
                      <motion.div 
                        key={res.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: ri * 0.05 }}
                        className="p-8 bg-slate-50 rounded-[3rem] flex flex-col border border-transparent hover:border-slate-200 transition-all group/res relative overflow-hidden"
                      >
                        {res.type === 'VIDEO' && res.url?.includes('zoom.us') && (
                          <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                            Live Room
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-4 rounded-2xl shadow-lg ${
                            res.type === 'PDF' ? 'bg-indigo-500 text-white shadow-indigo-100' :
                            res.type === 'VIDEO' ? 'bg-rose-500 text-white shadow-rose-100' :
                            res.type === 'TIMETABLE' ? 'bg-emerald-500 text-white shadow-emerald-100' :
                            'bg-amber-500 text-white shadow-amber-100'
                          }`}>
                            {res.type === 'PDF' && <DocumentTextIcon className="h-6 w-6" />}
                            {res.type === 'VIDEO' && <VideoCameraIcon className="h-6 w-6" />}
                            {res.type === 'TIMETABLE' && <CalendarIcon className="h-6 w-6" />}
                            {res.type === 'ANNOUNCEMENT' && <MegaphoneIcon className="h-6 w-6" />}
                          </div>
                          {userRole === UserRole.ADMIN && (
                            <button onClick={() => deleteResource(cls.id, res.id)} className="opacity-0 group-hover/res:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                        <h5 className="text-xl font-black text-slate-900 mb-3">{res.title}</h5>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 line-clamp-3">{res.description}</p>
                        {res.url && (
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener" 
                            className={`mt-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                              res.url.includes('zoom.us') 
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                              : 'bg-white border border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white'
                            }`}
                          >
                            {res.url.includes('zoom.us') ? <LinkIcon className="h-4 w-4" /> : null}
                            {res.url.includes('zoom.us') ? 'Join Meeting' : 'Open Resource'}
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- Modals --- */}

      {/* Fix: Wrapped children inside Modal tags */}
      <Modal isOpen={showCreateSchool} onClose={() => setShowCreateSchool(false)} title="New Scholarly Hub">
        <form onSubmit={handleCreateSchool} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logo URL (Optional)</label>
            <div className="relative">
              <PhotoIcon className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
              <input name="logoUrl" placeholder="https://..." className="w-full pl-14 pr-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 font-bold" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hub Name</label>
            <input name="name" required placeholder="Academy of Excellence..." className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 font-bold" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vision</label>
            <textarea name="description" placeholder="A sanctuary for learning..." className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-50 font-bold" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Code</label>
              <input name="studentPass" required placeholder="STUDENT" className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Code</label>
              <input name="adminPass" required placeholder="FACULTY" className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
            </div>
          </div>
          <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-600 transition-all shadow-xl">
            Launch Hub
          </button>
        </form>
      </Modal>

      {/* Fix: Wrapped children inside Modal tags */}
      <Modal isOpen={!!showJoinModal} onClose={() => setShowJoinModal(null)} title={`Enter ${showJoinModal?.name}`}>
        <form onSubmit={handleJoinSubmit} className="space-y-8">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
              {showJoinModal?.logoUrl ? (
                <img src={showJoinModal.logoUrl} alt="" className="h-20 w-20 object-contain rounded-xl" />
              ) : (
                <AcademicCapIcon className="h-16 w-16 text-indigo-600" />
              )}
            </div>
          </div>
          <p className="text-center text-slate-500 font-bold text-sm">Enter your access code to enter</p>
          <div className="relative group">
            <input 
              autoFocus
              type={showPass ? "text" : "password"} 
              placeholder="••••••••"
              value={currentPasswordInput}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentPasswordInput(val);
                verifyAndLogin(val, showJoinModal!);
              }}
              className="w-full px-8 py-6 rounded-3xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-indigo-50 outline-none font-black text-2xl tracking-[0.4em] text-center" 
            />
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors"
            >
              {showPass ? <EyeSlashIcon className="h-8 w-8" /> : <EyeIcon className="h-8 w-8" />}
            </button>
          </div>
          <div className="space-y-4">
            <button 
              type="submit" 
              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              Enter Hub <CheckCircleIcon className="h-6 w-6" />
            </button>
            <div className="text-center">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] font-black text-slate-300 uppercase hover:text-indigo-600 transition-colors">
                Help / Documentation
              </a>
            </div>
          </div>
        </form>
      </Modal>

      {/* Fix: Wrapped children inside Modal tags */}
      <Modal isOpen={showAddClass} onClose={() => setShowAddClass(false)} title="Open Virtual Room">
        <form onSubmit={handleAddClass} className="space-y-6">
          <input name="className" required placeholder="Room Title (e.g. Advanced Bio)" className="w-full px-8 py-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
          <input name="teacher" required placeholder="Lead Instructor Name" className="w-full px-8 py-5 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
          <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black shadow-lg">Activate Room</button>
        </form>
      </Modal>

      {/* Fix: Wrapped children inside Modal tags */}
      <Modal isOpen={!!showAddResource} onClose={() => setShowAddResource(null)} title="Publish Content">
        <form onSubmit={handleAddResource} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
            <select name="type" className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-indigo-600 uppercase tracking-widest">
              <option value="ANNOUNCEMENT">Announcement</option>
              <option value="VIDEO">Lesson / Meeting</option>
              <option value="TIMETABLE">Schedule</option>
              <option value="PDF">General Material</option>
            </select>
          </div>
          <input name="title" required placeholder="Resource Title" className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
          <textarea name="description" required placeholder="Summary or instructions..." className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" rows={3} />
          <input name="url" placeholder="Resource or Zoom URL" className="w-full px-8 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
          <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black shadow-lg">Post to Room</button>
        </form>
      </Modal>
    </div>
  );
}
