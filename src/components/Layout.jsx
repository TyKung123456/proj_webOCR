// src/components/Layout.jsx (ตรวจสอบให้แน่ใจว่าเป็นโค้ดนี้)

import React from 'react';
import { LayoutDashboard, Search, BarChart2, Menu, X, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Layout = ({
    children,
    currentDate,
    currentTime,
    currentPage,
    setCurrentPage,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed
}) => {
    const pageTitles = {
        home: 'Customer Files',
        groups: 'Detection',
        dashboard: 'Analytics'
    };

    return (
        <div className="flex w-full min-h-screen bg-slate-50 font-sans">
            <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 lg:flex lg:flex-col border-r border-slate-200 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
                <div className={`flex items-center justify-between p-4 h-20 border-b border-slate-200 ${sidebarCollapsed && 'lg:justify-center'}`}>
                    {!sidebarCollapsed && <span className="text-xl font-bold text-indigo-600">Dashboard</span>}
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-2 hover:bg-slate-100 rounded-lg">
                        {sidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                    </button>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { name: 'Home', icon: LayoutDashboard, page: 'home' },
                        { name: 'Anomaly Detection', icon: Search, page: 'groups' },
                        { name: 'Dashboard', icon: BarChart2, page: 'dashboard' },
                    ].map(item => (
                        <button key={item.name} onClick={() => { setCurrentPage(item.page); setSidebarOpen(false); }} title={sidebarCollapsed ? item.name : ''}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentPage === item.page ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'} ${sidebarCollapsed && 'justify-center'}`} >
                            <item.icon size={20} />
                            {!sidebarCollapsed && <span>{item.name}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="flex items-center justify-between px-8 h-20 bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2"><Menu size={24} /></button>
                        <h1 className="text-2xl font-bold text-slate-800">{pageTitles[currentPage] || 'Dashboard'}</h1>
                    </div>
                    <div className="text-right">
                        <div className="font-semibold text-slate-700">{currentDate}</div>
                        <div className="text-sm text-slate-500">{currentTime} น.</div>
                    </div>
                </header>

                {/* Children (HomePage, DashboardPage) will be rendered here */}
                {children}
            </div>
        </div>
    );
};

export default Layout;