import React, { useMemo, useState } from 'react';
import Nav from '../components/Nav';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { optimize as optimizeApi } from '../utils/api';

// Registering Chart.js components to prevent errors
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- MOCK DATA (Unchanged) ---
const SAMPLE_ORDERS = [
    { order_id: 'ORD-101', material: 'HR Coil', quantity: 420, due_date: '2025-10-14', priority: 'High', mode: 'Rail', destination: 'Ranchi Warehouse', transport_mode: 'Rail' },
    { order_id: 'ORD-102', material: 'CR Sheet', quantity: 280, due_date: '2025-10-16', priority: 'High', mode: 'Rail', destination: 'Jamshedpur Hub', transport_mode: 'Rail' },
    { order_id: 'ORD-103', material: 'Wire Rod', quantity: 190, due_date: '2025-10-15', priority: 'Medium', mode: 'Road', destination: 'Kolkata Yard', transport_mode: 'Road' },
    { order_id: 'ORD-104', material: 'HR Coil', quantity: 260, due_date: '2025-10-18', priority: 'Medium', mode: 'Rail', destination: 'Dhanbad Depot', transport_mode: 'Rail' },
    { order_id: 'ORD-105', material: 'Plates', quantity: 160, due_date: '2025-10-17', priority: 'Low', mode: 'Rail', destination: 'Patna Stockyard', transport_mode: 'Rail' },
];
const SAMPLE_STOCKYARDS = [
    { stockyard: 'Yard-A', material: 'HR Coil', quantity_available: 800, loading_point: 'LP-1', replenishment_eta: '2025-10-20', transport_cost_per_ton: 17 },
    { stockyard: 'Yard-B', material: 'CR Sheet', quantity_available: 380, loading_point: 'LP-2', replenishment_eta: '2025-10-19', transport_cost_per_ton: 19 },
    { stockyard: 'Yard-C', material: 'Wire Rod', quantity_available: 260, loading_point: 'LP-3', replenishment_eta: '2025-10-21', transport_cost_per_ton: 18 },
    { stockyard: 'Yard-A', material: 'Plates', quantity_available: 210, loading_point: 'LP-1', replenishment_eta: '2025-10-22', transport_cost_per_ton: 16 },
];
const SAMPLE_LOADING_POINTS = [
    { loading_point: 'LP-1', siding: 'Siding-Alpha', daily_capacity_ton: 600, shift_window_start: '06:00', shift_window_end: '22:00', modes: ['Rail'] },
    { loading_point: 'LP-2', siding: 'Siding-Beta', daily_capacity_ton: 480, shift_window_start: '05:00', shift_window_end: '21:00', modes: ['Rail'] },
    { loading_point: 'LP-3', siding: 'Siding-Gamma', daily_capacity_ton: 320, shift_window_start: '08:00', shift_window_end: '18:00', modes: ['Road', 'Rail'] },
];
const SAMPLE_RAKES_WAGONS = [
    { rake_id: 'Rake-01', wagon_type: 'BOXN', wagons_available: 40, wagon_capacity_ton: 58, home_depot: 'Bokaro', available_date: '2025-10-14', loading_point: 'LP-1' },
    { rake_id: 'Rake-02', wagon_type: 'BOXNHL', wagons_available: 45, wagon_capacity_ton: 60, home_depot: 'Bokaro', available_date: '2025-10-14', loading_point: 'LP-2' },
    { rake_id: 'Rake-03', wagon_type: 'BRN', wagons_available: 35, wagon_capacity_ton: 55, home_depot: 'Bokaro', available_date: '2025-10-15', loading_point: 'LP-3' },
];
const SAMPLE_COSTS = [
    { material: 'HR Coil', destination: 'Ranchi Warehouse', transport_cost_per_ton: 22, loading_cost_per_ton: 4, penalty_cost_per_ton: 12 },
    { material: 'CR Sheet', destination: 'Jamshedpur Hub', transport_cost_per_ton: 26, loading_cost_per_ton: 5, penalty_cost_per_ton: 14 },
    { material: 'Wire Rod', destination: 'Kolkata Yard', transport_cost_per_ton: 18, loading_cost_per_ton: 4, penalty_cost_per_ton: 10 },
    { material: 'Plates', destination: 'Patna Stockyard', transport_cost_per_ton: 20, loading_cost_per_ton: 3, penalty_cost_per_ton: 9 },
    { material: 'HR Coil', destination: 'Dhanbad Depot', transport_cost_per_ton: 19, loading_cost_per_ton: 4, penalty_cost_per_ton: 11 },
];

// --- CORE LOGIC & HELPER FUNCTIONS ---

const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return { data: [], columns: [] };
    const headers = lines[0].split(',').map((h) => h.trim());
    const data = lines.slice(1).filter(Boolean).map((line) => {
        const cells = line.split(',').map((c) => c.trim());
        return headers.reduce((acc, header, index) => {
            const value = cells[index] ?? '';
            const numberValue = Number(value);
            acc[header] = Number.isFinite(numberValue) && value !== '' ? numberValue : value;
            return acc;
        }, {});
    });
    return { data, columns: headers };
};

const normalizeGeminiResponse = (raw) => {
    const plan = Array.isArray(raw?.plan) ? raw.plan : [];
    const totalCost = Number(raw?.total_cost ?? raw?.totals?.totalCost ?? 0);
    const beforeCost = Number(raw?.before_cost ?? raw?.totals?.beforeCost ?? totalCost);
    const savings = Math.max(0, beforeCost - totalCost);
    const savingsPercent = beforeCost ? Math.round((savings / beforeCost) * 100) : 0;

    return {
        plan,
        totals: {
            totalCost,
            beforeCost,
            savings,
            savingsPercent,
        },
        costByDestination: raw?.cost_by_destination ?? raw?.analytics?.cost_by_destination ?? {},
        utilization: raw?.utilization ?? raw?.analytics?.utilization ?? [],
        dispatchSchedule: raw?.dispatch_schedule ?? raw?.analytics?.dispatch_schedule ?? [],
        matrix: raw?.matrix ?? raw?.analytics?.matrix ?? {},
        suggestions: raw?.suggestions ?? raw?.analytics?.suggestions ?? [],
        unfulfilledOrders: raw?.unfulfilled_orders ?? raw?.analytics?.unfulfilled_orders ?? [],
    };
};

const computeMaterialBalance = (orders, stockyards) => {
    const required = orders.reduce((acc, order) => {
        acc[order.material] = (acc[order.material] || 0) + (Number(order.quantity) || 0);
        return acc;
    }, {});
    const available = stockyards.reduce((acc, stock) => {
        acc[stock.material] = (acc[stock.material] || 0) + (Number(stock.quantity_available) || 0);
        return acc;
    }, {});
    const materials = new Set([...Object.keys(required), ...Object.keys(available)]);
    return [...materials].map((material) => ({ material, required: required[material] || 0, available: available[material] || 0, balance: (available[material] || 0) - (required[material] || 0) }));
};


// --- UI COMPONENTS (Modernized) ---

const DatasetUploader = ({ title, description, onUpload, onShowSample, onLoadSample, datasetKey, sampleData }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
        <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <label className="flex-grow text-center px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    onUpload(datasetKey, parseCSV(text));
                    e.target.value = '';
                }} />
            </label>
            <button onClick={() => onShowSample(datasetKey, sampleData)} className="flex-grow px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                Sample
            </button>
            <button onClick={() => onLoadSample(datasetKey, sampleData)} className="flex-grow px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Load
            </button>
        </div>
    </div>
);

const DataTable = ({ title, columns, rows }) => {
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });

    const sortedRows = useMemo(() => {
        const filtered = search ? rows.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(search.toLowerCase()))) : rows;
        if (!sortConfig.column) return filtered;
        return [...filtered].sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            const valA = a[sortConfig.column];
            const valB = b[sortConfig.column];
            if (valA === null || valA === undefined) return -dir;
            if (valB === null || valB === undefined) return dir;
            if (typeof valA === 'number' && typeof valB === 'number') return (valA - valB) * dir;
            return String(valA).localeCompare(String(valB)) * dir;
        });
    }, [rows, search, sortConfig]);
    
    const handleSort = (column) => {
        setSortConfig(prev => ({ column, direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h3 className="text-2xl font-bold text-slate-800">{title}</h3>
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-64 border border-slate-300 rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Search table..."/>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-base">
                    <thead className="bg-slate-50 text-slate-600 font-semibold text-sm uppercase">
                        <tr>
                            {columns.map(col => (
                                <th key={col} className="px-4 py-3 text-left cursor-pointer select-none group" onClick={() => handleSort(col)}>
                                    <span className="flex items-center gap-2">
                                        {col.replace(/_/g, ' ')}
                                        <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                                            {sortConfig.column === col ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '◆'}
                                        </span>
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {sortedRows.length === 0 ? (
                            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">No data found. Please upload or load sample data.</td></tr>
                        ) : sortedRows.map((row, idx) => (
                            <tr key={`${title}-${idx}`} className="hover:bg-slate-50">
                                {columns.map(col => <td key={col} className="px-4 py-3 text-slate-700 whitespace-nowrap">{String(row[col] ?? '')}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const GaugeCard = ({ label, value }) => {
    const gaugeData = {
        labels: ['Utilized', 'Available'],
        datasets: [{ data: [value, Math.max(0, 100 - value)], backgroundColor: ['#2563eb', '#e2e8f0'], borderWidth: 0 }],
    };
    const options = { cutout: '80%', plugins: { legend: { display: false }, tooltip: { enabled: false } } };
    
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 text-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">{label}</h3>
            <div className="relative w-32 h-32 mx-auto">
                <Doughnut data={gaugeData} options={options} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-2xl font-bold text-blue-700">{value}%</p>
                </div>
            </div>
        </div>
    );
};


// --- Main Dashboard Component ---
export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('Data Overview');
    const [datasets, setDatasets] = useState({
        orders: { data: [], columns: [] }, stockyards: { data: [], columns: [] }, loadingPoints: { data: [], columns: [] }, rakes: { data: [], columns: [] }, costs: { data: [], columns: [] },
    });
    const [sampleModal, setSampleModal] = useState({ open: false, dataset: '', rows: [] });
    const [constraints, setConstraints] = useState({ minRakeTonnage: 1800, sidingCapacity: 600 });
    const [wagonAvailability, setWagonAvailability] = useState({ BOXN: true, BOXNHL: true, BRN: true });
    const [planResult, setPlanResult] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Welcome! Please load or upload data to begin.');

    const handleUpload = (key, parsed) => {
        setDatasets(prev => ({ ...prev, [key]: { data: parsed.data, columns: parsed.columns } }));
        setStatusMessage(`Successfully uploaded and parsed data for ${key}.`);
    };
    const handleShowSample = (dataset, sampleRows) => setSampleModal({ open: true, dataset, rows: sampleRows.slice(0, 5) });
    const handleLoadSample = (key, sampleRows) => {
        const columns = sampleRows.length ? Object.keys(sampleRows[0]) : [];
        setDatasets(prev => ({ ...prev, [key]: { data: sampleRows, columns } }));
        setStatusMessage(`Loaded sample data for ${key}.`);
    };

    const runOptimization = async () => {
        const requiredKeys = ['orders', 'stockyards', 'loadingPoints', 'rakes', 'costs'];
        const missingDataKey = requiredKeys.find(key => datasets[key].data.length === 0);

        if (missingDataKey) {
            setStatusMessage(`Error: Please upload or load data for "${missingDataKey}" before running the optimization.`);
            setPlanResult(null);
            return;
        }

    setStatusMessage('Calling Gemini optimizer...');

        try {
            const payload = {
                orders: datasets.orders.data,
                stockyards: datasets.stockyards.data,
                loading_points: datasets.loadingPoints.data,
                rakes: datasets.rakes.data,
                costs: datasets.costs.data,
                constraints,
                wagon_availability: wagonAvailability,
            };

            const response = await optimizeApi(payload);
            const normalized = normalizeGeminiResponse(response);

            setPlanResult(normalized);
            setStatusMessage('Optimization complete. Review the updated tabs for insights.');
            setActiveTab('Rake Plan Output');
        } catch (error) {
            setPlanResult(null);
            setStatusMessage(`Gemini optimization failed: ${error.message}`);
        }
    };

    const resetDashboard = () => {
        setDatasets({ orders: { data: [], columns: [] }, stockyards: { data: [], columns: [] }, loadingPoints: { data: [], columns: [] }, rakes: { data: [], columns: [] }, costs: { data: [], columns: [] } });
        setPlanResult(null);
        setStatusMessage('Dashboard reset. Load datasets to continue.');
        setActiveTab('Data Overview');
    };
    
    const materialBalance = useMemo(() => computeMaterialBalance(datasets.orders.data, datasets.stockyards.data), [datasets.orders.data, datasets.stockyards.data]);

    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } };
    const barChartData = (label, data, backgroundColor) => ({
        labels: Object.keys(data),
        datasets: [{ label, data: Object.values(data), backgroundColor, borderRadius: 4 }],
    });

    const costVsDestinationData = useMemo(() => planResult ? barChartData('Logistics Cost (₹)', planResult.costByDestination, '#2563eb') : null, [planResult]);
    const utilizationDataset = useMemo(() => planResult ? { labels: planResult.utilization.map(item => item.rake_id), datasets: [{ label: 'Fill %', data: planResult.utilization.map(item => item.fill_percent), backgroundColor: '#22c55e', borderRadius: 4 }] } : null, [planResult]);
    const stockyardAvailabilityData = useMemo(() => {
        if (datasets.stockyards.data.length === 0) return null;
        const materials = datasets.stockyards.data.reduce((acc, row) => {
            acc[row.material] = (acc[row.material] || 0) + (Number(row.quantity_available) || 0);
            return acc;
        }, {});
        return barChartData('Available Tonnage', materials, ['#0ea5e9', '#6366f1', '#14b8a6', '#f97316']);
    }, [datasets.stockyards.data]);

    const downloadPlan = () => {
        if (!planResult) return;
        const headers = ['rake_id', 'wagon_type', 'loading_point', 'destinations', 'materials', 'total_tonnage', 'total_cost', 'dispatch_date', 'fill_percent'];
        const csvLines = planResult.plan.map((row) => {
            const destinationText = Array.isArray(row.destinations)
                ? row.destinations.join(' | ')
                : (row.destinations ?? '');
            const materialsText = row.materials
                ? Object.entries(row.materials).map(([mat, tons]) => `${mat}:${tons}`).join('|')
                : '';

            return [
                row.rake_id ?? '',
                row.wagon_type ?? '',
                row.loading_point ?? '',
                destinationText,
                materialsText,
                row.total_tonnage ?? '',
                row.total_cost ?? '',
                row.dispatch_date ?? '',
                row.fill_percent ?? '',
            ].join(',');
        });
        const csvContent = [headers.join(','), ...csvLines].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'optimized_rake_plan.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const tabButtonClass = (tab) => `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === tab ? 'bg-blue-600 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100'}`;

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-800 text-base md:text-lg">
            <Nav />
            <main className="pt-24 pb-12">
                <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* --- Sidebar --- */}
                        <aside className="lg:w-80 space-y-4 flex-shrink-0">
                            <div className="bg-slate-800 text-white rounded-xl p-5 shadow-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-bold">Rake Formation Hub</h2>
                                    <button onClick={resetDashboard} className="px-3 py-1 text-xs font-semibold bg-white/10 rounded-full hover:bg-white/20 transition-colors">Reset</button>
                                </div>
                                <p className="text-sm text-slate-300">Upload daily data feeds or load samples to simulate AI-guided rake plans.</p>
                            </div>
                            
                            <div className="space-y-4">
                                <DatasetUploader title="Customer Orders" description="orders.csv — Material, quantity, due date." datasetKey="orders" sampleData={SAMPLE_ORDERS} onUpload={handleUpload} onShowSample={handleShowSample} onLoadSample={handleLoadSample} />
                                <DatasetUploader title="Stockyards" description="stockyards.csv — Material availability." datasetKey="stockyards" sampleData={SAMPLE_STOCKYARDS} onUpload={handleUpload} onShowSample={handleShowSample} onLoadSample={handleLoadSample} />
                                <DatasetUploader title="Loading Points" description="loading_points.csv — Daily capacity." datasetKey="loadingPoints" sampleData={SAMPLE_LOADING_POINTS} onUpload={handleUpload} onShowSample={handleShowSample} onLoadSample={handleLoadSample} />
                                <DatasetUploader title="Rakes & Wagons" description="rakes_wagons.csv — Availability, capacity." datasetKey="rakes" sampleData={SAMPLE_RAKES_WAGONS} onUpload={handleUpload} onShowSample={handleShowSample} onLoadSample={handleLoadSample} />
                                <DatasetUploader title="Cost Model" description="costs.csv — Transport, loading, penalties." datasetKey="costs" sampleData={SAMPLE_COSTS} onUpload={handleUpload} onShowSample={handleShowSample} onLoadSample={handleLoadSample} />
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900">Operational Constraints</h3>
                                    <p className="text-sm text-slate-500">Tune limits to simulate yard realities.</p>
                                </div>
                                <label className="block text-sm font-semibold text-slate-600">Minimum rake tonnage
                                    <input type="number" value={constraints.minRakeTonnage} onChange={(e) => setConstraints(p => ({ ...p, minRakeTonnage: Number(e.target.value) }))} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-base focus:ring-blue-500 focus:border-blue-500"/>
                                </label>
                                <label className="block text-sm font-semibold text-slate-600">Loading point capacity (tons)
                                    <input type="number" value={constraints.sidingCapacity} onChange={(e) => setConstraints(p => ({ ...p, sidingCapacity: Number(e.target.value) }))} className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-base focus:ring-blue-500 focus:border-blue-500"/>
                                </label>
                            </div>

                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                <h3 className="text-xl font-semibold text-slate-900 mb-3">Wagon Type Availability</h3>
                                <div className="space-y-2">
                                    {['BOXN', 'BOXNHL', 'BRN'].map(type => (
                                        <label key={type} className="flex items-center justify-between text-base font-semibold text-slate-700">
                                            <span>{type}</span>
                                            <input type="checkbox" checked={wagonAvailability[type] !== false} onChange={(e) => setWagonAvailability(p => ({ ...p, [type]: e.target.checked }))} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"/>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-3 sticky top-20">
                                <button onClick={runOptimization} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow transition-transform hover:scale-105">
                                    Run Optimization
                                </button>
                                <p className="text-sm text-slate-500 text-center">Gemini engine prioritizes high-priority orders, lowest logistics cost, and wagon utilization.</p>
                                {statusMessage && <p className="text-sm text-blue-700 font-semibold text-center p-2 bg-blue-50 rounded-md">{statusMessage}</p>}
                            </div>
                        </aside>

                        {/* --- Main Content --- */}
                        <section className="flex-1 space-y-6">
                            <header className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
                                <h1 className="text-2xl font-bold text-slate-900">SAIL Rake Optimization Command Center</h1>
                                <p className="text-sm text-slate-600">AI/ML-ready workflow for Bokaro Steel Plant logistics orchestration.</p>
                            </header>

                            <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                {['Data Overview', 'Optimization Dashboard', 'Rake Plan Output', 'Visual Analytics', 'Production Suggestions'].map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)} className={tabButtonClass(tab)}>{tab}</button>
                                ))}
                            </div>
                            
                            {/* --- TAB CONTENT --- */}
                            <div className="space-y-6">
                                {activeTab === 'Data Overview' && (
                                    <>
                                        <DataTable title="Orders" columns={datasets.orders.columns.length ? datasets.orders.columns : (SAMPLE_ORDERS[0] ? Object.keys(SAMPLE_ORDERS[0]) : [])} rows={datasets.orders.data} />
                                        <DataTable title="Stockyards" columns={datasets.stockyards.columns.length ? datasets.stockyards.columns : (SAMPLE_STOCKYARDS[0] ? Object.keys(SAMPLE_STOCKYARDS[0]) : [])} rows={datasets.stockyards.data} />
                                        <DataTable title="Loading Points" columns={datasets.loadingPoints.columns.length ? datasets.loadingPoints.columns : (SAMPLE_LOADING_POINTS[0] ? Object.keys(SAMPLE_LOADING_POINTS[0]) : [])} rows={datasets.loadingPoints.data} />
                                        <DataTable title="Rakes & Wagons" columns={datasets.rakes.columns.length ? datasets.rakes.columns : (SAMPLE_RAKES_WAGONS[0] ? Object.keys(SAMPLE_RAKES_WAGONS[0]) : [])} rows={datasets.rakes.data} />
                                        <DataTable title="Cost Model" columns={datasets.costs.columns.length ? datasets.costs.columns : (SAMPLE_COSTS[0] ? Object.keys(SAMPLE_COSTS[0]) : [])} rows={datasets.costs.data} />
                                    </>
                                )}
                                
                                {activeTab === 'Optimization Dashboard' && (
                                  <div className="space-y-6">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                              <h3 className="text-sm font-semibold text-slate-600">Orders Loaded</h3>
                                              <p className="text-3xl font-bold text-slate-900">{datasets.orders.data.length}</p>
                                          </div>
                                          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                              <h3 className="text-sm font-semibold text-slate-600">Total Stock (tons)</h3>
                                              <p className="text-3xl font-bold text-slate-900">{datasets.stockyards.data.reduce((s, r) => s + (Number(r.quantity_available) || 0), 0).toLocaleString()}</p>
                                          </div>
                                          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                              <h3 className="text-sm font-semibold text-slate-600">Loading Points Active</h3>
                                              <p className="text-3xl font-bold text-slate-900">{datasets.loadingPoints.data.length}</p>
                                          </div>
                                      </div>
                                      {planResult && (
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                                  <h3 className="text-sm font-semibold text-slate-600">Optimized Logistics Cost</h3>
                                                  <p className="text-3xl font-bold text-green-600">₹{planResult.totals.totalCost.toLocaleString()}</p>
                                              </div>
                                              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                                  <h3 className="text-sm font-semibold text-slate-600">Savings vs Baseline</h3>
                                                  <p className="text-3xl font-bold text-blue-700">₹{planResult.totals.savings.toLocaleString()}</p>
                                              </div>
                                              <GaugeCard label="Average Rake Utilization" value={planResult.utilization.length > 0 ? Math.round(planResult.utilization.reduce((s, i) => s + i.fill_percent, 0) / planResult.utilization.length) : 0} />
                                          </div>
                                      )}
                                      {materialBalance.length > 0 && <DataTable title="Material Balancing" columns={['material', 'required', 'available', 'balance']} rows={materialBalance} />}
                                  </div>
                                )}


                                {activeTab === 'Rake Plan Output' && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">Daily Rake Formation Plan</h3>
                                                <p className="text-sm text-slate-600">Aligns wagons, loading windows, and destination priorities.</p>
                                            </div>
                                            <button onClick={downloadPlan} disabled={!planResult} className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:bg-slate-300 hover:bg-blue-800 transition-colors">Download CSV</button>
                                        </div>
                                        {planResult ? (
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
                                                <table className="min-w-full text-sm">
                                                    <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase">
                                                        <tr>
                                                            {['Rake ID', 'Wagon Type', 'Loading Point', 'Destinations', 'Material Mix', 'Tonnage', 'Dispatch', 'Fill %', 'Meets Min'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {planResult.plan.map((row, index) => {
                                                            const destinationText = Array.isArray(row.destinations)
                                                                ? row.destinations.join(', ')
                                                                : (row.destinations ?? '—');
                                                            const materialsText = row.materials
                                                                ? Object.entries(row.materials).map(([m, t]) => `${m}: ${t}t`).join(', ')
                                                                : '—';
                                                            const fillPercent = row.fill_percent ?? 0;
                                                            const meetsMin = Boolean(row.meets_min_size);

                                                            return (
                                                                <tr key={row.rake_id || `rake-${index}`} className="hover:bg-slate-50">
                                                                    <td className="px-4 py-3 font-semibold text-slate-900">{row.rake_id ?? `Rake ${index + 1}`}</td>
                                                                    <td className="px-4 py-3">{row.wagon_type ?? '—'}</td>
                                                                    <td className="px-4 py-3">{row.loading_point ?? '—'}</td>
                                                                    <td className="px-4 py-3">{destinationText}</td>
                                                                    <td className="px-4 py-3 text-xs">{materialsText}</td>
                                                                    <td className="px-4 py-3 font-medium">{row.total_tonnage ?? '—'}</td>
                                                                    <td className="px-4 py-3">{row.dispatch_date ?? '—'}</td>
                                                                    <td className="px-4 py-3">{typeof fillPercent === 'number' ? `${fillPercent}%` : fillPercent}</td>
                                                                    <td className="px-4 py-3">
                                                                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${meetsMin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                            {meetsMin ? 'Yes' : 'No'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : <div className="bg-white rounded-xl p-10 shadow-sm border border-slate-200 text-center text-slate-500">Run the optimization to generate a rake plan.</div>}
                                    </div>
                                )}
                                
                                {activeTab === 'Visual Analytics' && (
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 min-h-[300px]">
                                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cost vs Destination</h3>
                                          {planResult && costVsDestinationData ? <div className="h-80"><Bar options={chartOptions} data={costVsDestinationData} /></div> : <p className="text-sm text-slate-500 text-center pt-10">Run optimization to see cost distribution.</p>}
                                      </div>
                                      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 min-h-[300px]">
                                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Rake Utilization</h3>
                                          {planResult && utilizationDataset ? <div className="h-80"><Bar options={chartOptions} data={utilizationDataset} /></div> : <p className="text-sm text-slate-500 text-center pt-10">Run optimization to see utilization data.</p>}
                                      </div>
                                      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 min-h-[300px] lg:col-span-2">
                                          <h3 className="text-lg font-semibold text-slate-900 mb-4">Stockyard Material Availability</h3>
                                          {stockyardAvailabilityData ? <div className="h-80"><Bar options={chartOptions} data={stockyardAvailabilityData} /></div>: <p className="text-sm text-slate-500 text-center pt-10">Load stockyard data to see availability.</p>}
                                      </div>
                                  </div>
                                )}


                                {activeTab === 'Production Suggestions' && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                                            <h3 className="text-xl font-bold text-slate-900 mb-4">AI/ML-Ready Recommendations</h3>
                                            {planResult ? (
                                                <div className="space-y-4">
                                                    {planResult.suggestions.map((s, i) => (
                                                        <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                                                            <h4 className="text-base font-semibold text-slate-800">{s.title}</h4>
                                                            <p className="text-sm text-slate-600">{s.reason}</p>
                                                            <p className="text-sm font-semibold text-blue-700 mt-2">Action: {s.action}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-sm text-slate-600">Run optimization to unlock production-side insights.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            
            {/* --- MODAL --- */}
            {sampleModal.open && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-4xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Sample Preview: <span className="font-bold">{sampleModal.dataset}</span></h3>
                            <button onClick={() => setSampleModal({ open: false, dataset: '', rows: [] })} className="text-slate-500 hover:text-slate-800">&times;</button>
                        </div>
                        <div className="overflow-x-auto text-sm max-h-[60vh]">
                            <table className="min-w-full">
                                <thead className="bg-slate-100 text-slate-700 uppercase text-xs tracking-wide sticky top-0">
                                    <tr>{sampleModal.rows.length > 0 && Object.keys(sampleModal.rows[0]).map(col => <th key={col} className="px-4 py-3 text-left">{col.replace(/_/g, ' ')}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {sampleModal.rows.map((row, idx) => <tr key={idx}>{Object.values(row).map((val, i) => <td key={i} className="px-4 py-3 whitespace-nowrap">{String(val)}</td>)}</tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

