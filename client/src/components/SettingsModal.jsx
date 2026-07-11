import { useState, useRef } from 'react';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser, sendEmailVerification } from 'firebase/auth';
import { auth, storage } from '../firebase/config';
import { deleteOwnAccount } from '../api/users';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function SettingsModal({ onClose, dark, onToggleTheme }) {
  const [tab, setTab] = useState('akun');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('success');
  const fileRef = useRef(null);

  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [newEmail, setNewEmail] = useState('');
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showMsg = (text, type = 'success') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(null), 3000);
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL: url });
      showMsg('Foto profil berhasil diubah');
    } catch {
      showMsg('Gagal mengubah foto profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      showMsg('Nama berhasil diubah');
    } catch {
      showMsg('Gagal mengubah nama', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEmail = async () => {
    if (!newEmail.trim() || !curPassword) return;
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, curPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updateEmail(auth.currentUser, newEmail.trim());
      await sendEmailVerification(auth.currentUser);
      showMsg('Email berhasil diubah. Verifikasi telah dikirim.');
      setNewEmail('');
      setCurPassword('');
    } catch (e) {
      if (e.code === 'auth/wrong-password') showMsg('Password salah', 'error');
      else if (e.code === 'auth/requires-recent-login') showMsg('Silakan login ulang lalu coba lagi', 'error');
      else showMsg('Gagal mengubah email', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!curPassword || !newPassword) return;
    if (newPassword.length < 6) { showMsg('Password minimal 6 karakter', 'error'); return; }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, curPassword);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPassword);
      showMsg('Password berhasil diubah');
      setCurPassword('');
      setNewPassword('');
    } catch (e) {
      if (e.code === 'auth/wrong-password') showMsg('Password lama salah', 'error');
      else showMsg('Gagal mengubah password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setSaving(true);
    try {
      await deleteOwnAccount(auth.currentUser.uid);
      await deleteUser(auth.currentUser);
    } catch {
      showMsg('Gagal menghapus akun. Silakan login ulang lalu coba lagi.', 'error');
      setSaving(false);
    }
  };

  const inputClass = 'w-full p-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white transition';
  const btnClass = 'px-4 py-2 text-sm font-medium rounded-xl transition disabled:opacity-50';
  const tabs = [
    { key: 'akun', label: 'Akun' },
    { key: 'keamanan', label: 'Keamanan' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-base font-semibold dark:text-white">Pengaturan</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b dark:border-gray-700 px-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition -mb-px ${tab === t.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs font-medium ${msgType === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
            {msg}
          </div>
        )}

        <div className="p-4 space-y-5">
          {tab === 'akun' && (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Foto Profil</p>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
                    {auth.currentUser?.photoURL ? (
                      <img src={auth.currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (auth.currentUser?.displayName || auth.currentUser?.email || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <button onClick={() => fileRef.current?.click()} disabled={saving} className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium transition">
                      {saving ? 'Mengupload...' : 'Ganti Foto'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1">Maks 5MB, format JPG/PNG</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Nama</p>
                <div className="flex gap-2">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                  <button onClick={handleName} disabled={saving || !name.trim()} className={`${btnClass} bg-blue-500 text-white hover:bg-blue-600 shrink-0`}>
                    {saving ? '...' : 'Simpan'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Tema Gelap</span>
                </div>
                <button onClick={onToggleTheme} className={`relative w-11 h-6 rounded-full transition-colors ${dark ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${dark ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </>
          )}

          {tab === 'keamanan' && (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Ubah Email</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2">Email saat ini: {auth.currentUser?.email}</p>
                <div className="space-y-2">
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email baru" className={inputClass} />
                  <input type="password" value={curPassword} onChange={(e) => setCurPassword(e.target.value)} placeholder="Password saat ini" className={inputClass} />
                  <button onClick={handleEmail} disabled={saving || !newEmail.trim() || !curPassword} className={`${btnClass} bg-blue-500 text-white hover:bg-blue-600 w-full`}>
                    {saving ? 'Memproses...' : 'Ubah Email'}
                  </button>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Ubah Password</p>
                <div className="space-y-2">
                  <input type="password" value={curPassword} onChange={(e) => setCurPassword(e.target.value)} placeholder="Password saat ini" className={inputClass} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password baru (min 6 karakter)" className={inputClass} />
                  <button onClick={handlePassword} disabled={saving || !curPassword || !newPassword} className={`${btnClass} bg-blue-500 text-white hover:bg-blue-600 w-full`}>
                    {saving ? 'Memproses...' : 'Ubah Password'}
                  </button>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-xs font-medium text-red-500 mb-2">Zona Berbahaya</p>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} className={`${btnClass} bg-red-500 text-white hover:bg-red-600 w-full`}>
                    Hapus Akun
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-red-500">Semua data akan dihapus permanen. Yakin?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(false)} className={`${btnClass} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-1`}>
                        Batal
                      </button>
                      <button onClick={handleDeleteAccount} disabled={saving} className={`${btnClass} bg-red-500 text-white hover:bg-red-600 flex-1`}>
                        {saving ? 'Menghapus...' : 'Ya, Hapus'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
