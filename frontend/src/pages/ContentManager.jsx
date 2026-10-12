import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { contentApi, exportApi } from '../services/api';

const CONTENT_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'cours', label: 'Cours' },
  { value: 'resume', label: 'Résumé' },
  { value: 'serie', label: "Série d'exercices" },
  { value: 'examen', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
];

// ── Content form ──────────────────────────────────────────────────────────────
function ContentForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { titre: initial.titre || '', type: initial.type || 'cours', matiere: initial.matiere || '', theme: initial.theme || '', contenu: initial.contenu || '' }
      : { titre: '', type: 'cours', matiere: '', theme: '', contenu: '' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (e) => setForm((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initial?.id) {
        await contentApi.update(initial.id, form);
      } else {
        await contentApi.create(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-editor">
      <h2 style={{ marginBottom: 20 }}>{initial?.id ? 'Modifier le contenu' : 'Créer un contenu'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="workspace-form-grid">
          <label>
            Titre *
            <input name="titre" value={form.titre} onChange={update} required />
          </label>
          <label>
            Type *
            <select name="type" value={form.type} onChange={update}>
              <option value="cours">Cours</option>
              <option value="resume">Résumé</option>
              <option value="serie">Série d'exercices</option>
              <option value="examen">Examen</option>
              <option value="quiz">Quiz</option>
            </select>
          </label>
          <label>
            Matière *
            <input name="matiere" value={form.matiere} onChange={update} required />
          </label>
          <label>
            Thème
            <input name="theme" value={form.theme} onChange={update} />
          </label>
        </div>
        <div className="workspace-body-field">
          <label>
            Contenu
            <textarea name="contenu" value={form.contenu} onChange={update} rows={14} />
          </label>
        </div>
        {error && <p className="workspace-error" style={{ marginTop: 12 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="submit" className="workspace-button" disabled={saving}>
            {saving ? 'Enregistrement...' : initial?.id ? 'Enregistrer' : 'Créer'}
          </button>
          <button type="button" className="workspace-button secondary" onClick={onCancel}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

// ── View panel ────────────────────────────────────────────────────────────────
function ContentView({ item, onBack }) {
  return (
    <div>
      <button className="workspace-button secondary" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Retour à la liste
      </button>
      <div className="workspace-preview">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="workspace-badge">{item.type}</span>
          <span className="workspace-badge">{item.matiere}</span>
          <span className={`workspace-badge${item.statut === 'valide' ? ' valid' : ''}`}>{item.statut}</span>
        </div>
        <h2>{item.titre}</h2>
        <div className="workspace-preview-body">{item.contenu}</div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ContentManager() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('mes-contenus');
  const [panel, setPanel] = useState(null); // null | 'view' | 'create' | 'edit'
  const [selected, setSelected] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const LIMIT = 10;

  const loadContents = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (typeFilter) params.type = typeFilter;
      const apiFn = activeTab === 'public' ? contentApi.getPublic : contentApi.getMesContenus;
      const result = await apiFn(params);
      const raw = result.data ?? [];
      // Client-side filter by search text
      const filtered = search.trim()
        ? raw.filter(
            (c) =>
              c.titre?.toLowerCase().includes(search.toLowerCase()) ||
              c.theme?.toLowerCase().includes(search.toLowerCase())
          )
        : raw;
      // Client-side filter by statut
      const withStatut = statutFilter
        ? filtered.filter((c) => c.statut === statutFilter)
        : filtered;
      setItems(withStatut);
      setTotal(result.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContents(); }, [page, activeTab, typeFilter]);

  // Re-filter locally when search/statut changes without re-fetching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setPanel(null);
    setSelected(null);
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'valider') await contentApi.valider(id);
      if (action === 'publier') await contentApi.publier(id);
      if (action === 'dupliquer') await contentApi.dupliquer(id);
      loadContents();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce contenu ?')) return;
    try {
      await contentApi.remove(id);
      loadContents();
    } catch (err) {
      alert(err.message);
    }
  };

  const openView = async (id) => {
    try {
      const data = await contentApi.getOne(id);
      setSelected(data);
      setPanel('view');
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  // Derived list with client-side filters applied
  const displayItems = items
    .filter((c) =>
      search.trim()
        ? c.titre?.toLowerCase().includes(search.toLowerCase()) ||
          c.theme?.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .filter((c) => (statutFilter ? c.statut === statutFilter : true));

  return (
    <DashboardLayout activePage="contents">
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">CONTENUS</span>
          <h1>Gestion des contenus</h1>
          <p>Créez, organisez et exportez vos contenus pédagogiques.</p>
        </div>
        {panel === null && activeTab === 'mes-contenus' && (
          <button className="workspace-button" onClick={() => setPanel('create')}>
            + Créer un contenu
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-row">
        <button
          className={`tab-btn${activeTab === 'mes-contenus' ? ' active' : ''}`}
          onClick={() => handleTabChange('mes-contenus')}
        >
          Mes contenus
        </button>
        <button
          className={`tab-btn${activeTab === 'public' ? ' active' : ''}`}
          onClick={() => handleTabChange('public')}
        >
          Contenus publics
        </button>
      </div>

      {panel === 'create' && (
        <ContentForm
          initial={null}
          onSaved={() => { setPanel(null); loadContents(); }}
          onCancel={() => setPanel(null)}
        />
      )}

      {panel === 'edit' && selected && (
        <ContentForm
          initial={selected}
          onSaved={() => { setPanel(null); setSelected(null); loadContents(); }}
          onCancel={() => { setPanel(null); setSelected(null); }}
        />
      )}

      {panel === 'view' && selected && (
        <ContentView
          item={selected}
          onBack={() => { setPanel(null); setSelected(null); }}
        />
      )}

      {panel === null && (
        <>
          {/* Filters */}
          <div className="workspace-filters">
            <label>
              Recherche
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre ou thème..."
              />
            </label>
            <label>
              Type
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>
            <label>
              Statut
              <select value={statutFilter} onChange={(e) => setStatutFilter(e.target.value)}>
                <option value="">Tous</option>
                <option value="brouillon">Brouillon</option>
                <option value="valide">Validé</option>
              </select>
            </label>
          </div>

          {error && <p className="workspace-error">{error}</p>}
          {loading && <p>Chargement...</p>}

          {!loading && displayItems.length === 0 && (
            <div className="workspace-empty">
              <span>📄</span>
              <h3>Aucun contenu trouvé</h3>
              <p>
                {activeTab === 'mes-contenus'
                  ? 'Créez votre premier contenu en cliquant sur « + Créer un contenu ».'
                  : 'Aucun contenu public disponible pour le moment.'}
              </p>
            </div>
          )}

          <div className="workspace-cards">
            {displayItems.map((c) => (
              <div key={c.id} className="workspace-card">
                <div className="workspace-card-top">
                  <span className="workspace-badge">{c.type}</span>
                  <span className={`workspace-badge${c.statut === 'valide' ? ' valid' : ''}`}>{c.statut}</span>
                </div>
                <h3>{c.titre}</h3>
                <p>{c.matiere}</p>
                <small>{c.dateCreation ? new Date(c.dateCreation).toLocaleDateString('fr-FR') : ''}</small>
                <div className="workspace-card-actions">
                  <button onClick={() => openView(c.id)}>Voir</button>
                  {activeTab === 'mes-contenus' && (
                    <button
                      onClick={async () => {
                        try {
                          const data = await contentApi.getOne(c.id);
                          setSelected(data);
                          setPanel('edit');
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                    >
                      Modifier
                    </button>
                  )}
                  <button onClick={() => handleAction('dupliquer', c.id)}>Dupliquer</button>
                  {c.statut !== 'valide' && (
                    <button onClick={() => handleAction('valider', c.id)}>Valider</button>
                  )}
                  <button onClick={() => handleAction('publier', c.id)}>
                    {c.visibilite === 'public' ? 'Dépublier' : 'Publier'}
                  </button>
                  <button onClick={() => exportApi.download(exportApi.contentPdfUrl(c.id))}>
                    📄 PDF
                  </button>
                  <button onClick={() => exportApi.download(exportApi.contentWordUrl(c.id))}>
                    📝 Word
                  </button>
                  {activeTab === 'mes-contenus' && (
                    <button className="delete" onClick={() => handleDelete(c.id)}>Supprimer</button>
                  )}
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
        </>
      )}
    </DashboardLayout>
  );
}
