import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { quizApi, exportApi } from '../services/api';

// ── Inline question form ─────────────────────────────────────────────────────
function QuestionForm({ quizId, initial, onSaved, onCancel }) {
  const [q, setQ] = useState(
    initial || { enonce: '', choixA: '', choixB: '', choixC: '', choixD: '', reponseCorrecte: 'A', explication: '' }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (e) => setQ((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initial?.id) {
        await quizApi.updateQuestion(quizId, initial.id, q);
      } else {
        await quizApi.addQuestion(quizId, q);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="workspace-editor" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: '#45405f', display: 'block', marginBottom: 6 }}>
          Énoncé *
        </label>
        <textarea
          name="enonce"
          value={q.enonce}
          onChange={update}
          rows={3}
          required
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd9e7', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical' }}
        />
      </div>
      <div className="workspace-form-grid" style={{ marginBottom: 12 }}>
        {['A', 'B', 'C', 'D'].map((letter) => (
          <div key={letter} className="form-group">
            <label style={{ fontWeight: 600, fontSize: 13, color: '#45405f', display: 'block', marginBottom: 6 }}>
              Choix {letter} *
            </label>
            <input
              name={`choix${letter}`}
              value={q[`choix${letter}`]}
              onChange={update}
              required
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #dcd9e7', borderRadius: 8, font: 'inherit', fontSize: 14 }}
            />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#45405f', display: 'block', marginBottom: 8 }}>
          Réponse correcte *
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          {['A', 'B', 'C', 'D'].map((letter) => (
            <label key={letter} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 600, color: '#4c416d' }}>
              <input
                type="radio"
                name="reponseCorrecte"
                value={letter}
                checked={q.reponseCorrecte === letter}
                onChange={update}
              />
              {letter}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: '#45405f', display: 'block', marginBottom: 6 }}>
          Explication
        </label>
        <textarea
          name="explication"
          value={q.explication}
          onChange={update}
          rows={2}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #dcd9e7', borderRadius: 8, font: 'inherit', fontSize: 14, resize: 'vertical' }}
        />
      </div>
      {error && <p className="workspace-error">{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <button type="submit" className="workspace-button" disabled={saving}>
          {saving ? 'Enregistrement...' : initial?.id ? 'Mettre à jour' : 'Ajouter'}
        </button>
        <button type="button" className="workspace-button secondary" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}

// ── Quiz create / edit form ──────────────────────────────────────────────────
function QuizForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState(
    initial || { titre: '', theme: '', matiere: '', niveau: 'intermediaire', visibilite: 'prive' }
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
        await quizApi.update(initial.id, form);
      } else {
        await quizApi.create(form);
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
      <h2 style={{ marginBottom: 20 }}>{initial?.id ? 'Modifier le quiz' : 'Créer un quiz'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="workspace-form-grid">
          <label>
            Titre *
            <input name="titre" value={form.titre} onChange={update} required />
          </label>
          <label>
            Thème *
            <input name="theme" value={form.theme} onChange={update} required />
          </label>
          <label>
            Matière *
            <input name="matiere" value={form.matiere} onChange={update} required />
          </label>
          <label>
            Niveau
            <select name="niveau" value={form.niveau} onChange={update}>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </select>
          </label>
          <label>
            Visibilité
            <select name="visibilite" value={form.visibilite} onChange={update}>
              <option value="prive">Privé</option>
              <option value="public">Public</option>
            </select>
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

// ── Detail panel ─────────────────────────────────────────────────────────────
function QuizDetail({ quizId, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [questionForm, setQuestionForm] = useState(null); // null | 'new' | Question object

  const loadQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await quizApi.getOne(quizId);
      setQuiz(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuiz(); }, [quizId]);

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Supprimer cette question ?')) return;
    try {
      await quizApi.removeQuestion(quizId, questionId);
      loadQuiz();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="workspace-error">{error}</p>;
  if (!quiz) return null;

  const LABELS = ['A', 'B', 'C', 'D'];
  const CHOICES = ['choixA', 'choixB', 'choixC', 'choixD'];

  return (
    <div>
      <button className="workspace-button secondary" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Retour à la liste
      </button>

      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px' }}>{quiz.titre}</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="workspace-badge">{quiz.matiere}</span>
          <span className="workspace-badge">{quiz.niveau}</span>
          <span className={`workspace-badge${quiz.statut === 'valide' ? ' valid' : ''}`}>{quiz.statut}</span>
        </div>
      </div>

      <div className="workspace-section-heading">
        <h3 style={{ margin: 0 }}>Questions ({quiz.questions?.length ?? 0})</h3>
      </div>

      {quiz.questions?.map((q, idx) => (
        <div key={q.id} className="quiz-question-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <strong style={{ fontSize: 14, color: '#30247d' }}>Q{idx + 1}. {q.enonce}</strong>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
              <button
                className="workspace-button secondary"
                style={{ padding: '6px 10px', minHeight: 'auto', fontSize: 12 }}
                onClick={() => setQuestionForm(q)}
              >
                Modifier
              </button>
              <button
                className="workspace-button secondary delete"
                style={{ padding: '6px 10px', minHeight: 'auto', fontSize: 12, color: '#b43c47', borderColor: '#efd7da' }}
                onClick={() => handleDeleteQuestion(q.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
          <div className="quiz-question-choices">
            {CHOICES.map((key, i) => (
              <div
                key={key}
                className={`quiz-question-choice${q.reponseCorrecte === LABELS[i] ? ' correct' : ''}`}
              >
                <strong>{LABELS[i]}.</strong> {q[key]}
              </div>
            ))}
          </div>
          {q.explication && (
            <p style={{ marginTop: 10, fontSize: 13, color: '#69647b', fontStyle: 'italic' }}>
              💡 {q.explication}
            </p>
          )}
          {questionForm?.id === q.id && (
            <QuestionForm
              quizId={quizId}
              initial={q}
              onSaved={() => { setQuestionForm(null); loadQuiz(); }}
              onCancel={() => setQuestionForm(null)}
            />
          )}
        </div>
      ))}

      {questionForm === 'new' && (
        <QuestionForm
          quizId={quizId}
          initial={null}
          onSaved={() => { setQuestionForm(null); loadQuiz(); }}
          onCancel={() => setQuestionForm(null)}
        />
      )}

      {questionForm === null && (
        <button
          className="workspace-button secondary"
          style={{ width: '100%', marginBottom: 20, justifyContent: 'center' }}
          onClick={() => setQuestionForm('new')}
        >
          + Ajouter une question
        </button>
      )}

      {/* Export panel */}
      <div className="quiz-export-panel">
        <strong style={{ width: '100%', color: '#4c416d', fontSize: 14 }}>📥 Télécharger</strong>
        <button
          className="quiz-export-btn"
          onClick={() => exportApi.download(exportApi.quizPdfUrl(quizId, false))}
        >
          📄 PDF Étudiant
        </button>
        <button
          className="quiz-export-btn"
          onClick={() => exportApi.download(exportApi.quizWordUrl(quizId, false))}
        >
          📝 Word Étudiant
        </button>
        <button
          className="quiz-export-btn corrige"
          onClick={() => exportApi.download(exportApi.quizPdfUrl(quizId, true))}
        >
          📄 PDF Corrigé
        </button>
        <button
          className="quiz-export-btn corrige"
          onClick={() => exportApi.download(exportApi.quizWordUrl(quizId, true))}
        >
          📝 Word Corrigé
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function QuizManager() {
  const { user } = useAuth();

  const [panel, setPanel] = useState(null); // null | 'detail' | 'create' | 'edit'
  const [selectedId, setSelectedId] = useState(null);
  const [editInitial, setEditInitial] = useState(null);

  const [quizList, setQuizList] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [matiere, setMatiere] = useState('');
  const [statut, setStatut] = useState('');
  const [niveau, setNiveau] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const LIMIT = 10;

  const loadQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (matiere) params.matiere = matiere;
      if (statut) params.statut = statut;
      if (niveau) params.niveau = niveau;
      const result = await quizApi.getAll(params);
      setQuizList(result.data ?? []);
      setTotal(result.total ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuizzes(); }, [page, matiere, statut, niveau]);

  const handleAction = async (action, id) => {
    try {
      if (action === 'valider') await quizApi.valider(id);
      if (action === 'publier') await quizApi.publier(id);
      if (action === 'variante') await quizApi.creerVariante(id);
      loadQuizzes();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce quiz ?')) return;
    try {
      await quizApi.remove(id);
      loadQuizzes();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEdit = async (id) => {
    try {
      const q = await quizApi.getOne(id);
      setEditInitial(q);
      setPanel('edit');
    } catch (err) {
      alert(err.message);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <DashboardLayout activePage="quiz">
      <div className="workspace-header">
        <div>
          <span className="dashboard-eyebrow">GESTION</span>
          <h1>Mes Quiz</h1>
          <p>Créez, gérez et exportez vos quiz pédagogiques.</p>
        </div>
        {panel === null && (
          <button className="workspace-button" onClick={() => setPanel('create')}>
            + Créer un quiz
          </button>
        )}
      </div>

      {panel === 'create' && (
        <QuizForm
          initial={null}
          onSaved={() => { setPanel(null); loadQuizzes(); }}
          onCancel={() => setPanel(null)}
        />
      )}

      {panel === 'edit' && editInitial && (
        <QuizForm
          initial={editInitial}
          onSaved={() => { setPanel(null); setEditInitial(null); loadQuizzes(); }}
          onCancel={() => { setPanel(null); setEditInitial(null); }}
        />
      )}

      {panel === 'detail' && selectedId && (
        <QuizDetail
          quizId={selectedId}
          onBack={() => { setPanel(null); setSelectedId(null); }}
        />
      )}

      {panel === null && (
        <>
          {/* Filters */}
          <div className="workspace-filters">
            <label>
              Matière
              <input
                type="text"
                value={matiere}
                onChange={(e) => { setMatiere(e.target.value); setPage(1); }}
                placeholder="Filtrer par matière..."
              />
            </label>
            <label>
              Statut
              <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}>
                <option value="">Tous</option>
                <option value="brouillon">Brouillon</option>
                <option value="valide">Validé</option>
              </select>
            </label>
            <label>
              Niveau
              <select value={niveau} onChange={(e) => { setNiveau(e.target.value); setPage(1); }}>
                <option value="">Tous</option>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </label>
          </div>

          {error && <p className="workspace-error">{error}</p>}
          {loading && <p>Chargement...</p>}

          {!loading && quizList.length === 0 && (
            <div className="workspace-empty">
              <span>☑</span>
              <h3>Aucun quiz trouvé</h3>
              <p>Créez votre premier quiz en cliquant sur « + Créer un quiz ».</p>
            </div>
          )}

          <div className="workspace-cards">
            {quizList.map((q) => (
              <div key={q.id} className="workspace-card">
                <div className="workspace-card-top">
                  <span className="workspace-badge">{q.matiere}</span>
                  <span className="workspace-badge">{q.niveau}</span>
                  <span className={`workspace-badge${q.statut === 'valide' ? ' valid' : ''}`}>{q.statut}</span>
                </div>
                <h3>{q.titre}</h3>
                <p>{q.theme}</p>
                <small>{q.dateGeneration ? new Date(q.dateGeneration).toLocaleDateString('fr-FR') : ''}</small>
                <div className="workspace-card-actions">
                  <button onClick={() => { setSelectedId(q.id); setPanel('detail'); }}>Voir</button>
                  <button onClick={() => openEdit(q.id)}>Modifier</button>
                  <button onClick={() => handleAction('variante', q.id)}>Dupliquer</button>
                  {q.statut !== 'valide' && (
                    <button onClick={() => handleAction('valider', q.id)}>Valider</button>
                  )}
                  <button onClick={() => handleAction('publier', q.id)}>
                    {q.visibilite === 'public' ? 'Dépublier' : 'Publier'}
                  </button>
                  <button className="delete" onClick={() => handleDelete(q.id)}>Supprimer</button>
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
