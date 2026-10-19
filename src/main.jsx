const { createContext, useContext, useEffect, useState } = React;
const ReadingListContext = createContext(null);
const AuthContext = createContext(null);
const READING_LIST_KEY = "library-reading-list-v1";
const AUTH_TOKEN_KEY = "library-auth-token";

function readSavedBooks() {
  try {
    const value = JSON.parse(localStorage.getItem(READING_LIST_KEY) || "[]");
    return Array.isArray(value) ? value.filter((book) => book && typeof book.id === "string") : [];
  } catch {
    return [];
  }
}

function ReadingListProvider({ children }) {
  const [books, setBooks] = useState(readSavedBooks);

  useEffect(() => {
    localStorage.setItem(READING_LIST_KEY, JSON.stringify(books));
  }, [books]);

  function add(book) {
    setBooks((current) => current.some((item) => item.id === book.id) ? current : [...current, book]);
  }

  function remove(id) {
    setBooks((current) => current.filter((book) => book.id !== id));
  }

  function clear() {
    setBooks([]);
  }

  return <ReadingListContext.Provider value={{ books, add, remove, clear }}>{children}</ReadingListContext.Provider>;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail || Object.values(data).flat().find((value) => typeof value === "string");
    throw new Error(detail || "The request could not be completed. Please try again.");
  }
  return data;
}

function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ loading: true, token: localStorage.getItem(AUTH_TOKEN_KEY), user: null });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setAuth({ loading: false, token: null, user: null });
      return;
    }
    apiRequest("/api/auth/me", { headers: { Authorization: `Token ${token}` } })
      .then((data) => setAuth({ loading: false, token, user: data.user }))
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setAuth({ loading: false, token: null, user: null });
      });
  }, []);

  async function authenticate(mode, fields) {
    const data = await apiRequest(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify(fields),
    });
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    setAuth({ loading: false, token: data.token, user: data.user });
    return data.user;
  }

  function logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setAuth({ loading: false, token: null, user: null });
  }

  return <AuthContext.Provider value={{ ...auth, authenticate, logout }}>{children}</AuthContext.Provider>;
}

function useReadingList() {
  return useContext(ReadingListContext);
}

function useAuth() {
  return useContext(AuthContext);
}

function App() {
  const auth = useAuth();
  const readingList = useReadingList();
  const [path, setPath] = useState(window.location.pathname);
  const [books, setBooks] = useState([]);
  const [catalogError, setCatalogError] = useState("");
  const [query, setQuery] = useState("");

  function navigate(destination, replace = false) {
    window.history[replace ? "replaceState" : "pushState"]({}, "", destination);
    setPath(window.location.pathname);
    window.scrollTo(0, 0);
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    apiRequest("/api/books/")
      .then(setBooks)
      .catch((error) => setCatalogError(error.message));
  }, []);

  useEffect(() => {
    if (path === "/booking" && !auth.loading && !auth.user) {
      navigate("/login?next=%2Fbooking", true);
    }
  }, [path, auth.loading, auth.user]);

  if (auth.loading) return <div className="loading-state">Opening your shelf…</div>;

  const filteredBooks = books.filter((book) => `${book.title} ${book.author} ${book.category}`.toLowerCase().includes(query.toLowerCase()));

  function bookCard(book, saved = false) {
    return <article className="book-card" key={book.id}>
      <div className="cover-wrap">
        <img src={book.cover_image} alt={`Cover of ${book.title}`} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} />
        <span className="cover-fallback" aria-hidden="true">{book.title.slice(0, 1)}</span>
      </div>
      <div className="book-info">
        <p className="eyebrow">{book.category}</p>
        <h2>{book.title}</h2>
        <p className="book-author">{book.author}</p>
        <p className="book-description">{book.description}</p>
        <button className={saved ? "text-button remove-action" : "button button-outline"} onClick={() => saved ? readingList.remove(book.id) : readingList.add(book)}>
          {saved ? "Remove from list" : readingList.books.some((item) => item.id === book.id) ? "On your list" : "Add to reading list"}
        </button>
      </div>
    </article>;
  }

  function accountPage(mode) {
    return <AuthPage mode={mode} navigate={navigate} />;
  }

  let content;
  if (path === "/login" || path === "/register") {
    content = accountPage(path === "/register" ? "register" : "login");
  } else if (path === "/booking") {
    content = auth.user ? <window.BookingForm /> : <div className="loading-state">Redirecting to sign in…</div>;
  } else if (path === "/reading-list") {
    content = <section className="page-section">
      <div className="section-heading">
        <div><p className="eyebrow">YOUR SHELF</p><h1>Reading list</h1><p>{readingList.books.length} {readingList.books.length === 1 ? "book" : "books"} saved on this device</p></div>
        {readingList.books.length > 0 && <button className="text-button" onClick={readingList.clear}>Clear list</button>}
      </div>
      {readingList.books.length ? <div className="book-grid">{readingList.books.map((book) => bookCard(book, true))}</div> : <div className="empty-state"><span className="empty-mark">O</span><h2>Your list is waiting.</h2><p>Save a book from the catalog and it will be here when you return.</p><button className="button button-primary" onClick={() => navigate("/")}>Browse the catalog</button></div>}
    </section>;
  } else {
    content = <>
      <section className="catalog-heading">
        <div><p className="eyebrow">THE NEIGHBORHOOD LIBRARY</p><h1>Find your next<br />favorite chapter.</h1><p>Stories to take home, ideas to bring back.</p></div>
        <div className="catalog-note"><span>OPEN SHELF</span><span>READ · RETURN · REPEAT</span></div>
      </section>
      <section className="page-section catalog-section">
        <div className="section-heading"><div><p className="eyebrow">THE COLLECTION</p><h2>Browse the shelves</h2></div><label className="search-field"><span className="sr-only">Search books</span><span aria-hidden="true">⌕</span><input type="search" placeholder="Title, author, or genre" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
        {catalogError ? <p className="form-notice error" role="alert">{catalogError}</p> : filteredBooks.length ? <div className="book-grid">{filteredBooks.map((book) => bookCard(book))}</div> : <p className="empty-search">No books match “{query}”.</p>}
      </section>
    </>;
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => navigate("/")} aria-label="Open Shelf home"><span className="brand-mark">O</span><span>open<span className="brand-light">shelf</span></span></button>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={path === "/" ? "nav-link active" : "nav-link"} onClick={() => navigate("/")}>Catalog</button>
        <button className={path === "/reading-list" ? "nav-link active" : "nav-link"} onClick={() => navigate("/reading-list")}>Reading list <span className="nav-count">{readingList.books.length}</span></button>
        {auth.user ? <button className={path === "/booking" ? "nav-link active" : "nav-link"} onClick={() => navigate("/booking")}>Book a space</button> : <button className="nav-link" onClick={() => navigate("/booking")}>Book a space</button>}
      </nav>
      <div className="account-actions">{auth.user ? <><span className="member-name">{auth.user.name}</span><button className="text-button" onClick={() => { auth.logout(); navigate("/"); }}>Sign out</button></> : <><button className="text-button" onClick={() => navigate("/login")}>Sign in</button><button className="button button-primary compact" onClick={() => navigate("/register")}>Create account</button></>}</div>
    </header>
    <main>{content}</main>
    <footer className="footer"><span>OPEN SHELF LIBRARY</span><span>Find a little space to read.</span></footer>
  </div>;
}

function AuthPage({ mode, navigate }) {
  const auth = useAuth();
  const [fields, setFields] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const registering = mode === "register";

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await auth.authenticate(mode, fields);
      const next = new URLSearchParams(window.location.search).get("next");
      navigate(next && next.startsWith("/") ? next : "/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="auth-layout">
    <div className="auth-art"><p className="eyebrow">A PLACE FOR READERS</p><div className="book-stack" aria-hidden="true"><span></span><span></span><span></span></div><p>Good stories make<br />good company.</p></div>
    <div className="auth-panel"><p className="eyebrow">MEMBER ACCOUNT</p><h1>{registering ? "Join the shelf." : "Welcome back."}</h1><p>{registering ? "Save the books you want to come back to." : "Your books and quiet corner are waiting."}</p>
      <form onSubmit={submit} className="auth-form">
        {registering && <label>Name<input autoComplete="name" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} required maxLength="150" /></label>}
        <label>Email<input type="email" autoComplete="email" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} required /></label>
        <label>Password<input type="password" autoComplete={registering ? "new-password" : "current-password"} value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} required minLength={registering ? 8 : undefined} /></label>
        {error && <p className="form-notice error" role="alert">{error}</p>}
        <button className="button button-primary full-width" disabled={submitting}>{submitting ? "Please wait…" : registering ? "Create account" : "Sign in"}</button>
      </form>
      <p className="auth-switch">{registering ? "Already a member?" : "New to Open Shelf?"} <button className="inline-link" onClick={() => navigate(registering ? "/login" : "/register")}>{registering ? "Sign in" : "Create account"}</button></p>
    </div>
  </section>;
}

function Root() {
  return <AuthProvider><ReadingListProvider><App /></ReadingListProvider></AuthProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);