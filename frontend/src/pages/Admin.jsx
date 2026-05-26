import { useState, useEffect } from 'react';
import { 
  loginAdmin, 
  getAdminAlbums, 
  createAlbum, 
  updateAlbum, 
  togglePublishAlbum, 
  deleteAlbum, 
  getCoverUrl,
  bulkUpdatePhotoCounts,
} from '../services/api';
import { Lock, Plus, Upload, Link as LinkIcon, MapPin, Calendar, Type, Loader2, Image as ImageIcon, Eye, EyeOff, Trash2, Edit2, LogOut, BarChart3, FolderOpen, Mail, Hash, Settings as SettingsIcon, Tag, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Dashboard from './Dashboard';
import Leads from './Leads';
import AdminSettings from './AdminSettings';
import AdminPricing from './AdminPricing';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [albums, setAlbums] = useState([]);
  const [fetchingAlbums, setFetchingAlbums] = useState(false);
  const [tab, setTab] = useState('dashboard'); // 'dashboard' | 'events' | 'leads'

  // Bulk photo count states
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState({}); // { [albumId]: number }
  const [bulkSaving, setBulkSaving] = useState(false);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [formData, setFormData] = useState({
    event_name: '', event_date: '', location: '', album_url: '', is_published: false, photo_count: 0, face_slug: '',
  });
  const [coverImage, setCoverImage] = useState(null);

  useEffect(() => {
    if (token) {
      loadAlbums();
    }
  }, [token]);

  const loadAlbums = async () => {
    setFetchingAlbums(true);
    try {
      const data = await getAdminAlbums();
      setAlbums(data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setFetchingAlbums(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginAdmin(username, password);
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const openModal = (album = null) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        event_name: album.event_name,
        event_date: album.event_date,
        location: album.location,
        album_url: album.album_url,
        is_published: album.is_published,
        photo_count: album.photo_count || 0,
        face_slug: album.face_slug || '',
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        event_name: '', event_date: '', location: '', album_url: '', is_published: false, photo_count: 0, face_slug: '',
      });
    }
    setCoverImage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAlbum) {
        await updateAlbum(editingAlbum.id, formData, coverImage);
      } else {
        if (!coverImage) {
          alert("Cover image is required for new albums");
          setLoading(false);
          return;
        }
        await createAlbum(formData, coverImage);
      }
      setIsModalOpen(false);
      loadAlbums();
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || err.message || 'Error saving album';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await togglePublishAlbum(id);
      loadAlbums();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this album?")) {
      try {
        await deleteAlbum(id);
        loadAlbums();
      } catch (err) { console.error(err); }
    }
  };

  const openBulkPhotoCount = () => {
    const draft = {};
    albums.forEach(a => { draft[a.id] = a.photo_count || 0; });
    setBulkDraft(draft);
    setBulkOpen(true);
  };

  const saveBulkPhotoCount = async () => {
    setBulkSaving(true);
    try {
      const items = Object.entries(bulkDraft).map(([id, photo_count]) => ({
        id: parseInt(id),
        photo_count: parseInt(photo_count) || 0,
      }));
      await bulkUpdatePhotoCounts(items);
      setBulkOpen(false);
      loadAlbums();
    } catch (err) {
      console.error(err);
      alert('Error saving photo counts');
    } finally {
      setBulkSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white">
              <Lock className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center mb-2">Admin Access</h1>
          <p className="text-center text-gray-500 mb-8">Sign in to manage OhMaiShoot</p>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>
          <div className="mt-8 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-black">← Back to Site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white font-black">
               OM
             </div>
             <h1 className="text-xl font-bold">OhMaiShoot Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium text-gray-500 hover:text-black transition-colors hidden sm:block">View Live Site</Link>
            <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-8 bg-white border border-gray-200 rounded-xl p-1.5 w-fit shadow-sm">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === 'dashboard'
                ? 'bg-black text-white shadow'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Statistik
          </button>
          <button
            onClick={() => setTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === 'events'
                ? 'bg-black text-white shadow'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Event Albums
          </button>
          <button
            onClick={() => setTab('leads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === 'leads'
                ? 'bg-black text-white shadow'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Mail className="w-4 h-4" />
            Leads
          </button>
          <button
            onClick={() => setTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === 'pricing'
                ? 'bg-black text-white shadow'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Tag className="w-4 h-4" />
            Harga
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === 'settings'
                ? 'bg-black text-white shadow'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            Tetapan
          </button>
        </div>

        {tab === 'dashboard' && <Dashboard />}
        {tab === 'leads' && <Leads />}
        {tab === 'pricing' && <AdminPricing />}
        {tab === 'settings' && <AdminSettings />}

        {tab === 'events' && (
        <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-3xl font-black text-gray-900">Event Albums</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={openBulkPhotoCount}
              className="bg-white text-gray-900 border border-gray-200 px-4 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors"
              title="Set photo count untuk semua album sekali gus"
            >
              <Hash className="w-4 h-4" />
              Set Jumlah Gambar
            </button>
            <button 
              onClick={() => openModal()} 
              className="bg-black text-white px-5 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
            >
              <Plus className="w-5 h-5" />
              Add New Event
            </button>
          </div>
        </div>

        {fetchingAlbums ? (
           <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-black" /></div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="p-4 pl-6">Cover</th>
                    <th className="p-4">Event Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map(album => (
                    <tr key={album.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 w-32">
                        <img 
                          src={getCoverUrl(album.cover_image)} 
                          alt="cover" 
                          className="w-24 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-gray-900 mb-1">{album.event_name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {album.event_date}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {album.location}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleTogglePublish(album.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                            album.is_published 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {album.is_published ? <><Eye className="w-3 h-3"/> Published</> : <><EyeOff className="w-3 h-3"/> Hidden</>}
                        </button>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openModal(album)}
                            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <a 
                            href={album.album_url} target="_blank" rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Link"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleDelete(album.id)}
                            className="p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {albums.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-16 text-center text-gray-400">
                        No events found. Click "Add New Event" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}
      </main>

      {/* Bulk Photo Count Modal */}
      {bulkOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-2">
                  <Hash className="w-6 h-6" /> Set Jumlah Gambar
                </h3>
                <p className="text-sm text-gray-500 mt-1">Anggaran je pun ok — angka untuk hero counter di homepage.</p>
              </div>
              <button onClick={() => setBulkOpen(false)} className="text-gray-400 hover:text-black text-2xl font-light">&times;</button>
            </div>

            <div className="p-6 space-y-3">
              {albums.map(a => (
                <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <img src={getCoverUrl(a.cover_image)} alt="" className="w-14 h-10 object-cover rounded-lg border border-gray-200" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{a.event_name}</div>
                    <div className="text-xs text-gray-500 truncate">{a.location} · {a.event_date}</div>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={bulkDraft[a.id] ?? 0}
                    onChange={e => setBulkDraft({ ...bulkDraft, [a.id]: e.target.value })}
                    className="w-28 px-3 py-2 bg-white border border-gray-200 rounded-lg font-mono text-right focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  />
                </div>
              ))}
              {albums.length === 0 && (
                <div className="text-center text-gray-400 py-8">Tiada album.</div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3 sticky bottom-0 bg-white">
              <div className="text-sm text-gray-500">
                Jumlah: <span className="font-bold text-gray-900">{Object.values(bulkDraft).reduce((s, v) => s + (parseInt(v) || 0), 0).toLocaleString()}</span> gambar
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-black"
                >
                  Batal
                </button>
                <button
                  onClick={saveBulkPhotoCount}
                  disabled={bulkSaving}
                  className="bg-black text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {bulkSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                  Simpan Semua
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-black">{editingAlbum ? 'Edit Event Album' : 'Create New Event Album'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-2xl font-light">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Cover Image</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden relative">
                      {coverImage ? (
                        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${URL.createObjectURL(coverImage)})`}}>
                           <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                             <span className="text-white font-medium drop-shadow-md">Change Image</span>
                           </div>
                        </div>
                      ) : editingAlbum ? (
                        <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${getCoverUrl(editingAlbum.cover_image)})`}}>
                           <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                             <span className="text-white font-medium drop-shadow-md">Upload New Image to Replace</span>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 font-semibold">Click to upload cover</p>
                          <p className="text-xs text-gray-400 mb-1">JPEG, PNG, WEBP</p>
                          <p className="text-[11px] font-bold text-gray-400">Saiz Cadangan: 1920x1080 (16:9)</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => setCoverImage(e.target.files[0])} 
                      />
                    </label>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Type className="w-4 h-4"/> Event Name</label>
                  <input 
                    type="text" 
                    value={formData.event_name} 
                    onChange={e => setFormData({...formData, event_name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Date</label>
                  <input 
                    type="date" 
                    value={formData.event_date} 
                    onChange={e => setFormData({...formData, event_date: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</label>
                  <input 
                    type="text" 
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    required
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4"/> PhotoHawk Album URL</label>
                  <input 
                    type="url" 
                    value={formData.album_url} 
                    onChange={e => setFormData({...formData, album_url: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                    required
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Face-Search Event Slug (auto-sync)</label>
                  <input
                    type="text"
                    value={formData.face_slug || ''}
                    onChange={e => setFormData({...formData, face_slug: e.target.value})}
                    placeholder="e.g. larian-sawah-padi-sekinchan-2026-1l3l3e1i"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">Slug dari faces.ohmaishoot.com — bila set, photo count auto-update dari pipeline. Kosongkan kalau guna manual.</p>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Jumlah Gambar (untuk hero counter)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.photo_count || 0}
                    onChange={e => setFormData({...formData, photo_count: parseInt(e.target.value) || 0})}
                    placeholder="e.g. 1500"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">Anggaran je. Akan tambah ke "100K+ Gambar" counter di homepage.</p>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    id="publish"
                    checked={formData.is_published}
                    onChange={e => setFormData({...formData, is_published: e.target.checked})}
                    className="w-5 h-5 text-black rounded focus:ring-black accent-black"
                  />
                  <label htmlFor="publish" className="font-semibold text-gray-800 cursor-pointer select-none">
                    Publish immediately
                  </label>
                  <span className="text-gray-400 text-sm ml-auto hidden sm:block">Checked = Visible on homepage</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-black text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAlbum ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
