import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { archiveApi } from '../services/api';

export default function ArchivesAdmin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [archives, setArchives] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterMatiere, setFilterMatiere] = useState('');
  const [filterPromotion, setFilterPromotion] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ file: null, matiere: '', promotion: '' });
  const [textPanel, setTextPanel] = useState({ archiveId: null, text: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const LIMIT = 10;

  const loadArchives = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (filterMatiere) params.matiere = filterMatiere;
      if (filterPromotion) params.promotion = filterPromotion;
      const result = await archiveApi.getAll(params);
      setArchives(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadArchives(); }, [page, filterMatiere, filterPromotion]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) { setError('Veuillez sélectionner un fichier.'); return; }
    setLoading(true);
    setError('');
    try {
      await archiveApi.upload(uploadForm.file, uploadForm.matiere, uploadForm.promotion);
      setNotice('Archive téléversée avec succès.');
      setUploadOpen(false);
      setUploadForm({ file: null, matiere: '', promotion: '' });
      loadArchives();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewText = async (id) => {
    if (textPanel.archiveId === id) {
      setTextPanel({ archiveId: null, text: '' });
      return;
    }
    try {
      const result = await archiveApi.getTexte(id);
      setTextPanel({ archiveId: id, text: result.texte ?? '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette archive ?')) return;
    try {
      await archiveApi.remove(id);
      if (textPanel.archiveId === id) setTextPanel({ archiveId: null, text: '' });
      loadArchives();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <DashboardLayout activePage="archives">
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">ARCHIVES</span>
          <h1>Gestion des archives</h1>
          <p>Gérez les documents uploadés et générez du contenu depuis vos archives.</p>
        </div>
        <button className="workspace-button" onClick={() => setUploadOpen((v) => !v)}>
          {uploadOpen ? '✕ Fermer' : '+ Téléverser une archive'}
        </button>
      </div>

      {notice && <p className="workspace-notice">{notice}</p>}
      {error && <p className="workspace-error">{error}</p>}

      {/* Upload form */}
      {uploadOpen && (
        <div className="workspace-editor" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Téléverser une archive</h2>
          <form onSubmit={handleUpload}>
            <div className="workspace-form-grid">
              <label>
                Fichier (PDF, DOC, DOCX) *
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files[0] ?? null }))}
                  required
                  style={{ padding: '8px 0' }}
                />
              </label>
              <label>
                Matière
                <input
                  type="text"
                  value={uploadForm.matiere}
                  onChange={(e) => setUploadForm((f) => ({ ...f, matiere: e.target.value }))}
                  placeholder="Ex: Mathématiques"
                />
              </label>
              <label>
                Promotion
                <input
                  type="text"
                  value={uploadForm.promotion}
                  onChange={(e) => setUploadForm((f) => ({ ...f, promotion: e.target.value }))}
                  placeholder="Ex: L3 Info"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" className="workspace-button" disabled={loading}>
                {loading ? 'Téléversement...' : 'Téléverser'}
              </button>
              <button type="button" className="workspace-button secondary" onClick={() => setUploadOpen(false)}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="workspace-filters">
        <label>
          Matière
          <input
            type="text"
            value={filterMatiere}
            onChange={(e) => { setFilterMatiere(e.target.value); setPage(1); }}
            placeholder="Filtrer par matière..."
          />
        </label>
        <label>
          Promotion
          <input
            type="text"
            value={filterPromotion}
            onChange={(e) => { setFilterPromotion(e.target.value); setPage(1); }}
            placeholder="Filtrer par promotion..."
          />
        </label>
        <label>
          &nbsp;
          <button
            className="workspace-button secondary"
            style={{ marginTop: 0 }}
            onClick={() => { setFilterMatiere(''); setFilterPromotion(''); setPage(1); }}
          >
            Réinitialiser
          </button>
        </label>
      </div>

      {loading && <p>Chargement...</p>}

      {!loading && archives.length === 0 && (
        <div className="workspace-empty">
          <span>📁</span>
          <h3>Aucune archive</h3>
          <p>Téléversez votre première archive pour commencer.</p>
        </div>
      )}

      <div className="workspace-cards">
        {archives.map((a) => (
          <div key={a.id} className="workspace-card">
            <div className="workspace-card-top">
              <span className="workspace-badge">{a.type ?? a.extension ?? 'fichier'}</span>
              {a.matiere && <span className="workspace-badge">{a.matiere}</span>}
              {a.promotion && <span className="workspace-badge">{a.promotion}</span>}
            </div>
            <h3 style={{ wordBreak: 'break-word' }}>{a.nom}</h3>
            <p>{a.taille ? Math.round(a.taille / 1024) + ' KB' : ''}</p>
            <small>{a.dateDepot ? new Date(a.dateDepot).toLocaleDateString('fr-FR') : ''}</small>

            {/* Extracted text panel */}
            {textPanel.archiveId === a.id && (
              <div className="archive-text-panel">
                {textPanel.text || '(Aucun texte extrait disponible)'}
              </div>
            )}

            <div className="workspace-card-actions">
              <button onClick={() => handleViewText(a.id)}>
                {textPanel.archiveId === a.id ? 'Masquer le texte' : 'Voir le texte extrait'}
              </button>
              <button onClick={() => navigate('/ai?archiveId=' + a.id)}>
                Générer depuis cette archive
              </button>
              <button className="delete" onClick={() => handleDelete(a.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, alignItems: 'center' }}>
          <button
            className="workspace-button secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Précédent
          </button>
          <span style={{ color: '#69647b', fontSize: 14 }}>Page {page} / {totalPages}</span>
          <button
            className="workspace-button secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Suivant →
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
