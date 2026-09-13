import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ImagePlus, LogIn, LogOut, Moon, Pencil, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Sun, Trash2, Upload, X, Zap } from 'lucide-react';
import { supabase, ADMIN_EMAIL, STORAGE_BUCKET } from './supabase';
import './styles.css';

const money = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : new Intl.NumberFormat('id-ID').format(n);
};

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tama-theme') || 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tama-theme', theme);
  }, [theme]);
  return [theme, () => setTheme(t => t === 'dark' ? 'light' : 'dark')];
}

function AppShell({ children }) {
  const [theme, toggleTheme] = useTheme();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); };

  return <div className="app">
    <header className="topbar">
      <Link className="brand" to="/">
        <span className="brand-mark"><ShoppingBag size={20}/></span>
        <span><b>TAMA</b><small>ACCOUNT STORE</small></span>
      </Link>
      <nav className="nav-links">
        <Link className={location.pathname === '/' ? 'active' : ''} to="/">Produk</Link>
        {isAdmin && <Link className={location.pathname.startsWith('/admin') ? 'active' : ''} to="/admin">Admin</Link>}
      </nav>
      <div className="top-actions">
        <button className="icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
        {isAdmin && <button className="icon-btn" onClick={logout} title="Keluar"><LogOut size={18}/></button>}
        {!user && <Link className="login-btn" to="/admin"><LogIn size={17}/> Admin</Link>}
      </div>
    </header>
    {children}
    <footer className="footer">TAMA Account Store <span>•</span> Katalog akun digital</footer>
  </div>;
}

function ProductCard({ product }) {
  const sold = product.status === 'sold';
  return <article className="product-card">
    <div className="product-image-wrap">
      {product.image_url ? <img src={product.image_url} alt={product.title}/> : <div className="image-placeholder"><ImagePlus size={34}/><span>Belum ada gambar</span></div>}
      <span className={`status-pill ${sold ? 'sold' : 'ready'}`}>{sold ? 'SOLD' : 'READY'}</span>
    </div>
    <div className="product-body">
      <div className="eyebrow">AKUN DIGITAL</div>
      <h3>{product.title}</h3>
      {product.price !== null && product.price !== '' && <div className="price">Rp {money(product.price)}</div>}
      <p>{product.description || 'Tidak ada deskripsi.'}</p>
      <div className="product-bottom"><span className="status-dot"><i className={sold ? 'sold' : ''}></i>{sold ? 'Sudah terjual' : 'Masih tersedia'}</span></div>
    </div>
  </article>;
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true); setError('');
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message); else setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => products.filter(p => {
    const matchText = `${p.title} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filter === 'all' || p.status === filter;
    return matchText && matchStatus;
  }), [products, query, filter]);

  const readyCount = products.filter(p => p.status === 'ready').length;
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <div className="hero-badge"><Zap size={15}/> KOLEKSI TERBARU</div>
        <h1>Temukan akun yang<br/><span>siap kamu pilih.</span></h1>
        <p>Katalog akun digital TAMA dengan detail, status, dan gambar yang diperbarui langsung dari panel admin.</p>
        <div className="hero-stats"><div><b>{products.length}</b><span>Total akun</span></div><div><b>{readyCount}</b><span>Masih ready</span></div><div><b>24/7</b><span>Katalog online</span></div></div>
      </div>
      <div className="hero-card"><ShieldCheck size={28}/><b>Informasi jelas</b><span>Lihat status Ready / Sold sebelum membeli.</span></div>
    </section>
    <section className="catalog-section">
      <div className="section-head"><div><div className="eyebrow">KATALOG</div><h2>Semua akun</h2></div><button className="refresh-btn" onClick={loadProducts}><RefreshCw size={17}/> Refresh</button></div>
      <div className="filters"><div className="searchbox"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari akun..."/></div><div className="filter-group">{[['all','Semua'],['ready','Ready'],['sold','Sold']].map(([v,l]) => <button key={v} className={filter === v ? 'selected' : ''} onClick={() => setFilter(v)}>{l}</button>)}</div></div>
      {error && <div className="alert error">Gagal memuat katalog: {error}</div>}
      {loading ? <div className="loading-grid">{[1,2,3].map(i => <div className="skeleton" key={i}/>)}</div> : filtered.length ? <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p}/>)}</div> : <div className="empty"><ShoppingBag size={40}/><b>Belum ada akun</b><span>Produk yang diposting admin akan muncul di sini.</span></div>}
    </section>
  </main>;
}

function AdminGate({ children }) {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => listener.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <div className="center-loader"><RefreshCw className="spin"/> Memeriksa sesi...</div>;
  if (!session) return <Navigate to="/admin/login" replace/>;
  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) return <Navigate to="/admin/login?unauthorized=1" replace/>;
  return children;
}

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const params = new URLSearchParams(useLocation().search);
  const unauthorized = params.get('unauthorized');

  const submit = async e => {
    e.preventDefault(); setLoading(true); setError('');
    if (email.toLowerCase() !== ADMIN_EMAIL) { setError('Email admin tidak sesuai.'); setLoading(false); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message); else navigate('/admin');
    setLoading(false);
  };
  return <main className="login-page"><div className="login-card">
    <div className="login-logo"><ShoppingBag size={25}/></div><div className="eyebrow">ADMIN PANEL</div><h1>Masuk ke dashboard</h1><p>Kelola katalog akun dari satu tempat.</p>
    {unauthorized && <div className="alert error">Akun ini bukan akun admin yang diizinkan.</div>}
    {error && <div className="alert error">{error}</div>}
    <form onSubmit={submit}>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required/></label>
      <label>Password<div className="password-wrap"><input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required/><button type="button" onClick={() => setShow(v => !v)}>{show ? 'Sembunyikan' : 'Lihat'}</button></div></label>
      <button className="primary-btn" disabled={loading}>{loading ? <><RefreshCw size={17} className="spin"/> Memproses...</> : <><LogIn size={17}/> Masuk</>}</button>
    </form>
    <Link to="/" className="back-link"><ArrowLeft size={16}/> Kembali ke katalog</Link>
  </div></main>;
}

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = async () => { setLoading(true); const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }); if (error) setError(error.message); else setProducts(data || []); setLoading(false); };
  useEffect(() => { load(); }, []);

  const startNew = () => setEditing({ id:null, title:'', description:'', price:'', status:'ready', image_url:'', image_path:'' });
  const save = async form => {
    setSaving(true); setMsg(''); setError('');
    let image_url = form.image_url || null; let image_path = form.image_path || null;
    try {
      if (form.file) {
        const ext = (form.file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `products/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, form.file, { cacheControl:'3600', upsert:false, contentType: form.file.type || 'image/*' });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        image_url = data.publicUrl; image_path = path;
      }
      const payload = { title: form.title.trim(), description: form.description.trim(), price: form.price === '' ? null : Number(form.price), status: form.status, image_url, image_path };
      if (!payload.title) throw new Error('Judul wajib diisi.');
      if (form.id) { const { error } = await supabase.from('products').update(payload).eq('id', form.id); if (error) throw error; }
      else { const { error } = await supabase.from('products').insert(payload); if (error) throw error; }
      setMsg(form.id ? 'Produk berhasil diperbarui.' : 'Produk berhasil diposting.'); setEditing(null); await load();
    } catch (e) { setError(e.message || 'Terjadi kesalahan.'); }
    setSaving(false);
  };
  const remove = async p => {
    if (!confirm(`Hapus "${p.title}"?`)) return;
    setError(''); const { error } = await supabase.from('products').delete().eq('id', p.id); if (error) { setError(error.message); return; }
    if (p.image_path) await supabase.storage.from(STORAGE_BUCKET).remove([p.image_path]); setMsg('Produk dihapus.'); load();
  };
  const toggleStatus = async p => { const { error } = await supabase.from('products').update({ status:p.status === 'ready' ? 'sold' : 'ready' }).eq('id', p.id); if (error) setError(error.message); else load(); };

  return <main className="admin-page"><div className="admin-head"><div><div className="eyebrow">ADMIN PANEL</div><h1>Kelola akun</h1><p>Posting, ubah, tandai sold, atau hapus produk.</p></div><button className="primary-btn compact" onClick={startNew}><Plus size={18}/> Tambah akun</button></div>
    {msg && <div className="alert success"><Check size={17}/>{msg}</div>}{error && <div className="alert error">{error}</div>}
    {editing && <ProductForm initial={editing} saving={saving} onCancel={() => setEditing(null)} onSave={save}/>} 
    <div className="admin-table-wrap"><div className="table-head"><b>Daftar akun</b><span>{products.length} produk</span></div>{loading ? <div className="table-loading"><RefreshCw className="spin"/> Memuat...</div> : products.length ? <div className="admin-list">{products.map(p => <div className="admin-row" key={p.id}><div className="row-main"><div className="thumb">{p.image_url ? <img src={p.image_url} alt=""/> : <ImagePlus size={20}/>}</div><div><b>{p.title}</b><span>{p.price !== null && p.price !== '' ? `Rp ${money(p.price)}` : 'Tanpa harga'} • {p.status === 'ready' ? 'Ready' : 'Sold'}</span></div></div><div className="row-actions"><button className="small-btn" onClick={() => toggleStatus(p)}><Check size={15}/>{p.status === 'ready' ? 'Tandai Sold' : 'Tandai Ready'}</button><button className="icon-btn small" onClick={() => setEditing({...p})}><Pencil size={16}/></button><button className="icon-btn small danger" onClick={() => remove(p)}><Trash2 size={16}/></button></div></div>)}</div> : <div className="empty"><ShoppingBag size={40}/><b>Belum ada produk</b><span>Gunakan tombol “Tambah akun” untuk posting.</span></div>}</div>
  </main>;
}

function ProductForm({ initial, saving, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const [preview, setPreview] = useState(initial.image_url || '');
  const change = (k,v) => setForm(f => ({...f,[k]:v}));
  const fileChange = e => { const file = e.target.files?.[0]; if (!file) return; change('file',file); setPreview(URL.createObjectURL(file)); };
  return <div className="form-panel"><div className="form-head"><div><b>{form.id ? 'Edit akun' : 'Tambah akun'}</b><span>Lengkapi detail yang akan terlihat di katalog.</span></div><button className="icon-btn" onClick={onCancel}><X size={18}/></button></div><div className="form-grid">
    <div className="upload-box"><label className="upload-label"><input type="file" accept="image/*" onChange={fileChange}/>{preview ? <img src={preview} alt="Preview"/> : <div className="upload-empty"><Upload size={28}/><b>Upload gambar</b><span>PNG, JPG, WEBP</span></div>}</label></div>
    <div className="fields"><label>Judul<input value={form.title} onChange={e => change('title',e.target.value)} placeholder="Contoh: Akun Roblox #01"/></label><label>Deskripsi<textarea rows="5" value={form.description} onChange={e => change('description',e.target.value)} placeholder="Tulis detail akun..."/></label><div className="two"><label>Harga<input type="number" min="0" value={form.price} onChange={e => change('price',e.target.value)} placeholder="25000"/></label><label>Status<div className="select-wrap"><select value={form.status} onChange={e => change('status',e.target.value)}><option value="ready">Ready</option><option value="sold">Sold</option></select><ChevronDown size={16}/></div></label></div><div className="form-actions"><button className="secondary-btn" onClick={onCancel}>Batal</button><button className="primary-btn" disabled={saving} onClick={() => onSave(form)}>{saving ? <><RefreshCw size={16} className="spin"/> Menyimpan...</> : <><Check size={16}/> {form.id ? 'Simpan perubahan' : 'Posting akun'}</>}</button></div></div>
  </div></div>;
}

function App() { return <AppShell><Routes><Route path="/" element={<Home/>}/><Route path="/admin/login" element={<AdminLogin/>}/><Route path="/admin" element={<AdminGate><AdminDashboard/></AdminGate>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></AppShell>; }

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
