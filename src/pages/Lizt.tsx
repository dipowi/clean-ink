import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  created_at: string;
}

const PAGE_SIZE = 10;

export default function Lizt() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "Daftar Artikel - Telegraph";
    const desc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    desc.setAttribute('name', 'description');
    desc.setAttribute('content', 'Kumpulan judul artikel dengan pemuatan tak hingga (infinite scroll).');
    if (!desc.parentNode) document.head.appendChild(desc);
  }, []);

  const loadPage = async (pageIndex: number) => {
    if (loading || !hasMore) return;
    setLoading(true);
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('articles')
      .select('id,title,slug,created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error) {
      setArticles(prev => [...prev, ...(data || [])]);
      setPage(pageIndex + 1);
      if (!data || data.length < PAGE_SIZE) setHasMore(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    // initial load
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadPage(page);
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-10">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Daftar Artikel</h1>
        {articles.length === 0 && !loading ? (
          <p className="text-muted-foreground">Belum ada artikel.</p>
        ) : (
          <ul className="divide-y divide-border">
            {articles.map((a) => (
              <li key={a.id} className="py-4">
                <Link to={`/${a.slug}`} className="text-foreground hover:text-primary transition-colors">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div ref={sentinelRef} />
        {loading && (
          <p className="mt-4 text-sm text-muted-foreground">Memuat…</p>
        )}
        {!hasMore && articles.length > 0 && (
          <p className="mt-6 text-sm text-muted-foreground">Semua artikel telah dimuat.</p>
        )}
      </main>
    </div>
  );
}
