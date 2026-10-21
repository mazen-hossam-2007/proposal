import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Lock, Calendar, Clock, MapPin, Utensils, MessageSquare, 
  RefreshCw, Check, Copy, Heart, Sparkles, AlertCircle, Download,
  Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, Phone,
  FileText, ShieldAlert, Trash2, Edit3, ExternalLink, User,
  Plus, ClipboardPaste
} from 'lucide-react';
import { DateSubmissionRecord, AdminStats, ProposalStatus } from '../types';
import { sound } from '../utils/sound';
import { ADMIN_CONFIG } from '../adminConfig';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminToken: string;
  onLogout?: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  adminToken,
  onLogout,
}) => {
  const [submissions, setSubmissions] = useState<DateSubmissionRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalAccepted: 0,
    statusCounts: { Confirmed: 0, Planning: 0, Completed: 0, Archived: 0 },
    totalRejectionsPrevented: 0,
    latestSubmission: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search, Filter, Sort, Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rejections' | 'date'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 6;

  // Selected Record for Details Modal
  const [selectedRecord, setSelectedRecord] = useState<DateSubmissionRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [editingAdminNote, setEditingAdminNote] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [contactPhoneInput, setContactPhoneInput] = useState('');
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  // Manual / WhatsApp Ticket Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPastedText, setImportPastedText] = useState('');
  const [importPartnerName, setImportPartnerName] = useState('Jana');
  const [importDate, setImportDate] = useState('');
  const [importTime, setImportTime] = useState('');
  const [importLocations, setImportLocations] = useState('Zamalek 🌳✨');
  const [importFood, setImportFood] = useState('Italian Cuisine 🍕🍝');
  const [importNote, setImportNote] = useState('');
  const [importRejections, setImportRejections] = useState(0);
  const [isSavingImport, setIsSavingImport] = useState(false);

  // Parse pasted ticket from WhatsApp or text
  const handleParsePastedText = (text: string) => {
    setImportPastedText(text);
    if (!text.trim()) return;

    const dateMatch = text.match(/Date:\s*([^\n\r]+)/i);
    if (dateMatch && dateMatch[1]) setImportDate(dateMatch[1].trim());

    const timeMatch = text.match(/Time:\s*([^\n\r]+)/i);
    if (timeMatch && timeMatch[1]) setImportTime(timeMatch[1].trim());

    const placeMatch = text.match(/Place:\s*([^\n\r]+)/i);
    if (placeMatch && placeMatch[1]) setImportLocations(placeMatch[1].trim());

    const foodMatch = text.match(/Food:\s*([^\n\r]+)/i);
    if (foodMatch && foodMatch[1]) setImportFood(foodMatch[1].trim());

    const noteMatch = text.match(/(?:Special Note from Jana|Note):\s*["“]?([^"”\n\r]+)["”]?/i);
    if (noteMatch && noteMatch[1]) setImportNote(noteMatch[1].trim());

    const rejectMatch = text.match(/reject you (\d+)/i);
    if (rejectMatch && rejectMatch[1]) setImportRejections(parseInt(rejectMatch[1], 10));
  };

  // Fetch Submissions from Secure Backend API (with local storage fallback & auto-sync)
  const fetchSubmissions = useCallback(async () => {
    if (!adminToken) return;
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        sort: sortBy,
        page: String(currentPage),
        limit: String(itemsPerPage),
      });

      const res = await fetch(`/api/admin/submissions?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (res.status === 401) {
        // Token was rejected: clear stale token and redirect to unlock modal
        try {
          localStorage.removeItem(ADMIN_CONFIG.tokenStorageKey);
        } catch {
          // ignore
        }
        if (onLogout) {
          onLogout();
        } else {
          onClose();
        }
        return;
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let list: DateSubmissionRecord[] = data.submissions || [];

          // Also check if this device has any local un-synced submissions and sync them
          try {
            const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
            if (raw) {
              const localList: DateSubmissionRecord[] = JSON.parse(raw);
              if (Array.isArray(localList)) {
                for (const localItem of localList) {
                  if (localItem && !list.some((s) => s.id === localItem.id || (s.date === localItem.date && s.customTime === localItem.customTime && s.specialNote === localItem.specialNote))) {
                    fetch('/api/submissions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(localItem),
                    }).catch(() => {});
                    list = [localItem, ...list];
                  }
                }
              }
            }
          } catch {
            // ignore
          }

          setSubmissions(list);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || list.length);
          if (data.stats) {
            setStats(data.stats);
          }
          setErrorBanner(null);
          setIsLoading(false);
          return;
        }
      }

      throw new Error('Server unreachable');
    } catch {
      // Offline fallback: load from local storage so proposals are visible
      try {
        const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const list: DateSubmissionRecord[] = Array.isArray(parsed) ? parsed : [parsed];
          setSubmissions(list);
          setTotalCount(list.length);
          setTotalPages(Math.max(1, Math.ceil(list.length / itemsPerPage)));
          setStats({
            totalAccepted: list.length,
            statusCounts: {
              Confirmed: list.filter((r) => (r.status || 'Confirmed') === 'Confirmed').length,
              Planning: list.filter((r) => r.status === 'Planning').length,
              Completed: list.filter((r) => r.status === 'Completed').length,
              Archived: list.filter((r) => r.status === 'Archived').length,
            },
            totalRejectionsPrevented: list.reduce((sum, r) => sum + (r.rejectionAttempts || 0), 0),
            latestSubmission: list[0]?.submittedAt || null,
          });
          setErrorBanner('Displaying local backup records from this device.');
        } else {
          setErrorBanner('Could not sync with live server. Please tap Refresh or check connection.');
        }
      } catch {
        setErrorBanner('Could not retrieve submissions.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminToken, searchQuery, statusFilter, sortBy, currentPage, onClose, onLogout]);

  useEffect(() => {
    if (isOpen && adminToken) {
      fetchSubmissions();
    }
  }, [isOpen, adminToken, fetchSubmissions]);

  // Handle Search Input Change (resets to page 1)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle Status Filter Change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle Sort Change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'newest' | 'oldest' | 'rejections' | 'date');
    setCurrentPage(1);
  };

  // Update Status on Record
  const handleUpdateRecordStatus = async (id: string, newStatus: ProposalStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        sound.playPop();
        const data = await res.json();
        // Update list in state
        setSubmissions((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedRecord && selectedRecord.id === id) {
          setSelectedRecord({ ...selectedRecord, status: newStatus });
        }
        fetchSubmissions();
      }
    } catch {
      // Failed to update
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Save Admin Notes & Phone
  const handleSaveDetails = async () => {
    if (!selectedRecord) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/submissions/${selectedRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          internalAdminNotes: adminNoteInput,
          contactPhone: contactPhoneInput,
        }),
      });

      if (res.ok) {
        sound.playPop();
        const updated = {
          ...selectedRecord,
          internalAdminNotes: adminNoteInput,
          contactPhone: contactPhoneInput,
        };
        setSelectedRecord(updated);
        setSubmissions((prev) =>
          prev.map((item) => (item.id === selectedRecord.id ? updated : item))
        );
        setEditingAdminNote(false);
      }
    } catch {
      // ignore
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this proposal record? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (res.ok) {
        sound.playPop();
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
        fetchSubmissions();
      }
    } catch {
      // ignore
    }
  };

  // Save Manual / Imported Proposal
  const handleSaveManualProposal = async () => {
    setIsSavingImport(true);
    try {
      const record: DateSubmissionRecord = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        partnerName: importPartnerName.trim() || 'Jana',
        status: 'Confirmed',
        hasSaidYes: true,
        rejectionAttempts: Number(importRejections) || 0,
        date: importDate.trim() || '2025-02-14',
        timeSlot: importTime.trim() || 'Evening',
        customTime: importTime.trim(),
        locations: importLocations ? importLocations.split(',').map((s) => s.trim()) : ['Zamalek 🌳✨'],
        foodCravings: importFood ? importFood.split(',').map((s) => s.trim()) : ['Italian Cuisine 🍕🍝'],
        specialNote: importNote.trim(),
        submittedAt: new Date().toISOString(),
      };

      // 1. Post to server
      try {
        await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
      } catch {
        // offline fallback
      }

      // 2. Save to local storage
      try {
        const raw = localStorage.getItem(ADMIN_CONFIG.storageKey);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift(record);
        localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(list));
      } catch {
        // ignore
      }

      sound.playCelebration();
      setIsImportModalOpen(false);
      setImportPastedText('');
      fetchSubmissions();
    } finally {
      setIsSavingImport(false);
    }
  };

  // Export to CSV (with server and client fallback)
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await fetch('/api/admin/export-csv', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (res.ok) {
        sound.playCelebration();
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `jana-date-proposals-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        setIsExportingCsv(false);
        return;
      }
    } catch {
      // client-side fallback below
    }

    // Client-side CSV export fallback
    if (submissions.length > 0) {
      sound.playCelebration();
      const headers = ['ID','Partner Name','Status','Submission Timestamp','Proposed Date','Time Slot','Custom Time','Destinations','Food Cravings','Personal Notes','Rejection Dodges Avoided','Contact Phone','Admin Notes'];
      const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const rows = submissions.map((r) => [
        escapeCsv(r.id),
        escapeCsv(r.partnerName || 'Jana'),
        escapeCsv(r.status || 'Confirmed'),
        escapeCsv(r.submittedAt),
        escapeCsv(r.date || 'TBD'),
        escapeCsv(r.timeSlot || ''),
        escapeCsv(r.customTime || ''),
        escapeCsv((r.locations || []).join(', ')),
        escapeCsv((r.foodCravings || []).join(', ')),
        escapeCsv(r.specialNote || ''),
        escapeCsv(r.rejectionAttempts || 0),
        escapeCsv(r.contactPhone || ''),
        escapeCsv(r.internalAdminNotes || '')
      ].join(','));
      const csv = [headers.join(','), ...rows].join('\n') + '\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `jana-date-proposals-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } else {
      alert('No proposal records available to export.');
    }
    setIsExportingCsv(false);
  };

  // Copy Single Ticket Text
  const handleCopyTicket = (record: DateSubmissionRecord) => {
    sound.playPop();
    const formatted = 
`💘 JANA'S CONFIRMED DATE TICKET 💘
Status: ${record.status || 'Confirmed'}
Partner: ${record.partnerName || 'Jana'}
📅 Date: ${record.date || 'TBD'}
⏰ Time: ${record.customTime || record.timeSlot || 'Evening'}
📍 Destination: ${record.locations.join(', ') || 'None'}
🍽️ Food Choices: ${record.foodCravings.join(', ') || 'None'}
💌 Personal Note: "${record.specialNote || 'None'}"
😼 Rejections Avoided: ${record.rejectionAttempts || 0} times
⏰ Submitted: ${new Date(record.submittedAt).toLocaleString()}
${record.contactPhone ? `📞 Contact: ${record.contactPhone}` : ''}`;

    navigator.clipboard.writeText(formatted);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Details Inspector
  const openDetails = (record: DateSubmissionRecord) => {
    sound.playPop();
    setSelectedRecord(record);
    setAdminNoteInput(record.internalAdminNotes || '');
    setContactPhoneInput(record.contactPhone || '');
    setEditingAdminNote(false);
  };

  // Status Badge Helper
  const renderStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Confirmed
          </span>
        );
      case 'Planning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Planning
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Check className="w-3 h-3 stroke-[3]" />
            Completed
          </span>
        );
      case 'Archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div 
        className="relative max-w-4xl w-full bg-white rounded-3xl p-4 sm:p-7 shadow-2xl border-2 border-rose-300 max-h-[92vh] flex flex-col overflow-hidden animate-dramatic-zoom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-rose-100 pb-3 mb-4 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-md shadow-rose-500/20">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif-romantic font-extrabold text-rose-950">
                  Admin Proposal Dashboard
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                  Secure Live
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Tracking all confirmed date choices &amp; resistance stats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paste / Add Ticket Button */}
            <button
              onClick={() => {
                sound.playPop();
                setIsImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Add proposal or paste ticket sent on WhatsApp"
            >
              <Plus className="w-3.5 h-3.5 text-rose-600" />
              <span>Paste / Add Ticket</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv || submissions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Download all proposals as CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isExportingCsv ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                sound.playPop();
                fetchSubmissions();
              }}
              disabled={isLoading}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 transition-all cursor-pointer"
              title="Refresh submissions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-500' : ''}`} />
            </button>

            {/* Lock / Sign Out Button */}
            <button
              onClick={() => {
                sound.playPop();
                try {
                  localStorage.removeItem(ADMIN_CONFIG.tokenStorageKey);
                } catch {
                  // ignore
                }
                if (onLogout) {
                  onLogout();
                } else {
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Lock dashboard & log out"
            >
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>Lock</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="p-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-600 hover:text-rose-600 transition-all cursor-pointer"
              title="Close dashboard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {/* Error Banner */}
          {errorBanner && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <button 
                onClick={fetchSubmissions}
                className="underline font-bold hover:text-rose-900 cursor-pointer text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Key Metrics / Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Total Accepted */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3 shadow-2xs">
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <Heart className="w-3 h-3 fill-rose-500" />
                <span>Total Accepted</span>
              </p>
              <p className="text-2xl font-black text-rose-950 mt-0.5">
                {stats.totalAccepted}
              </p>
              <p className="text-[10px] text-stone-500">Date Proposals</p>
            </div>

            {/* Confirmed Status */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 shadow-2xs">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Confirmed</span>
              </p>
              <p className="text-2xl font-black text-emerald-950 mt-0.5">
                {stats.statusCounts.Confirmed}
              </p>
              <p className="text-[10px] text-emerald-700">Ready to happen</p>
            </div>

            {/* Rejections Avoided */}
            <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 shadow-2xs">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600" />
                <span>&quot;No&quot; Dodges</span>
              </p>
              <p className="text-2xl font-black text-amber-950 mt-0.5">
                {stats.totalRejectionsPrevented}
              </p>
              <p className="text-[10px] text-amber-700">Cat defenses triggered</p>
            </div>

            {/* Planning / Active */}
            <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3 shadow-2xs">
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-600" />
                <span>In Planning</span>
              </p>
              <p className="text-2xl font-black text-purple-950 mt-0.5">
                {stats.statusCounts.Planning}
              </p>
              <p className="text-[10px] text-purple-700">Itineraries being refined</p>
            </div>
          </div>

          {/* Search, Filter & Sort Controls */}
          <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-3 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search destination, food, notes..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filters & Sorting */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                >
                  <option value="All">All Statuses ({stats.totalAccepted})</option>
                  <option value="Confirmed">Confirmed ({stats.statusCounts.Confirmed})</option>
                  <option value="Planning">Planning ({stats.statusCounts.Planning})</option>
                  <option value="Completed">Completed ({stats.statusCounts.Completed})</option>
                  <option value="Archived">Archived ({stats.statusCounts.Archived})</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="rejections">Most Rejections</option>
                  <option value="date">Date of Outing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submissions List / Table */}
          {isLoading ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500" />
              <p className="text-xs font-semibold">Loading real acceptance records from database...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center p-6 bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto text-xl">
                💌
              </div>
              <h3 className="text-base font-bold text-stone-800">
                {searchQuery || statusFilter !== 'All' 
                  ? 'No matching proposals found' 
                  : 'Awaiting Jana\'s confirmed date submission'}
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'All'
                  ? 'Try clearing the search term or status filter to view all records.'
                  : 'When Jana clicks "Lock In Our Date! ❤️", her confirmed date, destinations, food choices, and rejection count will appear here instantly!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submissions.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => openDetails(rec)}
                  className="group relative bg-white border border-rose-100 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-150 cursor-pointer text-left"
                >
                  {/* Card Top: Partner name, status badge, copy button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">
                        {rec.partnerName ? rec.partnerName[0] : 'J'}
                      </div>
                      <span className="font-bold text-stone-900 text-sm">
                        {rec.partnerName || 'Jana'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {renderStatusBadge(rec.status || 'Confirmed')}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTicket(rec);
                        }}
                        className="p-1 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                        title="Copy ticket summary"
                      >
                        {copiedId === rec.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-1 mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-stone-800 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{rec.date || 'TBD'}</span>
                      <span className="text-stone-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{rec.customTime || rec.timeSlot || 'Evening'}</span>
                    </div>

                    {/* Destinations */}
                    <div className="flex items-start gap-1.5 text-xs text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{rec.locations.join(' • ') || 'Surprise Spot'}</span>
                    </div>

                    {/* Food */}
                    <div className="flex items-start gap-1.5 text-xs text-stone-600">
                      <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{rec.foodCravings.join(' • ') || 'Any food'}</span>
                    </div>
                  </div>

                  {/* Card Bottom: Rejections count & submission time */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="font-semibold text-rose-600 flex items-center gap-1">
                      <span>😼 Avoided:</span>
                      <strong>{rec.rejectionAttempts || 0} times</strong>
                    </span>

                    <span>
                      {new Date(rec.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                      {new Date(rec.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-2 pb-1 flex items-center justify-between border-t border-stone-100 text-xs text-stone-600">
              <span>
                Showing {submissions.length} of {totalCount} records
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 py-1 font-bold text-stone-800">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-rose-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-400">
            Authenticated as Admin • Auto-saving database
          </span>

          <button
            onClick={() => {
              sound.playPop();
              // Remove token and close
              try {
                localStorage.removeItem(ADMIN_CONFIG.tokenStorageKey);
              } catch {
                // ignore
              }
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-700 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock &amp; Exit Admin</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* DETAILS MODAL FOR SELECTED RECORD */}
        {/* ========================================================= */}
        {selectedRecord && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
            onClick={() => setSelectedRecord(null)}
          >
            <div 
              className="relative max-w-lg w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-rose-300 max-h-[88vh] overflow-y-auto animate-dramatic-zoom text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm">
                    {selectedRecord.partnerName ? selectedRecord.partnerName[0] : 'J'}
                  </div>
                  <div>
                    <h3 className="font-serif-romantic font-bold text-base text-rose-950">
                      {selectedRecord.partnerName || 'Jana'}&apos;s Date Proposal Ticket
                    </h3>
                    <p className="text-[10px] text-stone-400">ID: {selectedRecord.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 rounded-full hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Selector */}
              <div className="mb-4 p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-700 block">Proposal Status:</span>
                  <p className="text-[10px] text-stone-400">Update the stage of this date</p>
                </div>

                <select
                  value={selectedRecord.status || 'Confirmed'}
                  disabled={isUpdatingStatus}
                  onChange={(e) =>
                    handleUpdateRecordStatus(selectedRecord.id, e.target.value as ProposalStatus)
                  }
                  className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white font-bold text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Planning">Planning</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Comprehensive Breakdown */}
              <div className="space-y-3 mb-4">
                {/* Date & Time */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Selected Date &amp; Time</span>
                  </span>
                  <p className="text-sm font-bold text-stone-900">
                    {selectedRecord.date || 'TBD'} • {selectedRecord.customTime || selectedRecord.timeSlot || 'Evening'}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Submitted on {new Date(selectedRecord.submittedAt).toLocaleString()}
                  </p>
                </div>

                {/* Destinations */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Chosen Destination(s)</span>
                  </span>
                  <p className="text-sm font-bold text-stone-900">
                    {selectedRecord.locations.join(' • ') || 'Surprise Destination'}
                  </p>
                </div>

                {/* Food */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Food &amp; Cravings</span>
                  </span>
                  <p className="text-sm font-bold text-stone-900">
                    {selectedRecord.foodCravings.join(' • ') || 'Any delicious food'}
                  </p>
                </div>

                {/* Personal Note */}
                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Jana&apos;s Personal Craving / Note</span>
                  </span>
                  <p className="text-xs font-medium text-stone-800 italic">
                    {selectedRecord.specialNote ? `"${selectedRecord.specialNote}"` : 'No note provided.'}
                  </p>
                </div>

                {/* Rejection Defense Stats */}
                <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      Rejection / Dodge Resistance
                    </span>
                    <p className="text-xs font-bold text-stone-800">
                      {selectedRecord.rejectionAttempts > 0
                        ? `Tried to say No ${selectedRecord.rejectionAttempts} times before accepting! 😂`
                        : 'Accepted immediately with 0 rejections! 🥰'}
                    </p>
                  </div>
                  <span className="text-2xl">😼</span>
                </div>

                {/* Contact Phone & Admin Notes Section */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-stone-500" />
                      <span>Contact &amp; Admin Notes</span>
                    </span>

                    {!editingAdminNote && (
                      <button
                        onClick={() => setEditingAdminNote(true)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>

                  {editingAdminNote ? (
                    <div className="space-y-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                          Phone Number (for WhatsApp / SMS):
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. +201234567890"
                          value={contactPhoneInput}
                          onChange={(e) => setContactPhoneInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-stone-500 block mb-0.5">
                          Private Admin Notes:
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Bought flowers, booked table at 7:30 PM..."
                          value={adminNoteInput}
                          onChange={(e) => setAdminNoteInput(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingAdminNote(false)}
                          className="px-2.5 py-1 rounded-lg text-xs text-stone-500 hover:bg-stone-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDetails}
                          disabled={isUpdatingStatus}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-600 space-y-1">
                      <p>
                        <strong className="text-stone-500 text-[11px]">Phone: </strong>
                        {selectedRecord.contactPhone || 'Not set'}
                      </p>
                      <p>
                        <strong className="text-stone-500 text-[11px]">Notes: </strong>
                        {selectedRecord.internalAdminNotes || 'No notes added yet.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-rose-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDeleteRecord(selectedRecord.id)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyTicket(selectedRecord)}
                    className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedId === selectedRecord.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual / WhatsApp Ticket Import Sub-modal */}
        {isImportModalOpen && (
          <div 
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn"
            onClick={() => setIsImportModalOpen(false)}
          >
            <div 
              className="relative max-w-lg w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-rose-300 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-rose-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
                    <ClipboardPaste className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif-romantic font-bold text-rose-950">
                      Import or Add Date Proposal
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Paste WhatsApp message or enter proposal choices manually
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Paste Field */}
              <div className="mb-4">
                <label className="text-xs font-bold text-rose-900 block mb-1">
                  Paste WhatsApp Message (Auto-Detects Choices):
                </label>
                <textarea
                  rows={3}
                  placeholder={`Paste message here, e.g.:\nHey Mazen! I said YES!\n📅 Date: 2025-02-14\n⏰ Time: 7:30 PM\n📍 Place: Zamalek...`}
                  value={importPastedText}
                  onChange={(e) => handleParsePastedText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-stone-50 font-mono"
                />
              </div>

              {/* Form Fields */}
              <div className="space-y-3 mb-5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Partner Name:</label>
                    <input
                      type="text"
                      value={importPartnerName}
                      onChange={(e) => setImportPartnerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                      placeholder="Jana"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Rejections Avoided:</label>
                    <input
                      type="number"
                      min={0}
                      value={importRejections}
                      onChange={(e) => setImportRejections(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Chosen Date:</label>
                    <input
                      type="text"
                      value={importDate}
                      onChange={(e) => setImportDate(e.target.value)}
                      placeholder="e.g. 2025-02-14 or Friday"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Chosen Time:</label>
                    <input
                      type="text"
                      value={importTime}
                      onChange={(e) => setImportTime(e.target.value)}
                      placeholder="e.g. 7:30 PM or Evening"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Places / Destinations:</label>
                  <input
                    type="text"
                    value={importLocations}
                    onChange={(e) => setImportLocations(e.target.value)}
                    placeholder="e.g. Zamalek, Maadi"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Food & Cravings:</label>
                  <input
                    type="text"
                    value={importFood}
                    onChange={(e) => setImportFood(e.target.value)}
                    placeholder="e.g. Italian Cuisine, Cheesecake"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-600 block mb-0.5">Special Note from Jana:</label>
                  <textarea
                    rows={2}
                    value={importNote}
                    onChange={(e) => setImportNote(e.target.value)}
                    placeholder="e.g. Let's take cute pictures! 🥰"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-stone-500 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveManualProposal}
                  disabled={isSavingImport}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingImport ? 'Saving...' : 'Save to Dashboard'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
