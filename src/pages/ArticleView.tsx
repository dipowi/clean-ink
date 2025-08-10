import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import "./article-overrides.css";

interface Article {
  id: string;
  title: string;
  content: string;
  slug: string;
  author_name?: string;
  created_at: string;
  view_count: number;
}

interface TocItem {
  id: string;
  text: string;
  level: number; // 2 for h2, 3 for h3
}

export default function ArticleView() {
  const { slug } = useParams();
  const navigate = useNavigate();
const [article, setArticle] = useState<Article | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [toc, setToc] = useState<TocItem[]>([]);
const [activeId, setActiveId] = useState<string | null>(null);
const contentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!slug) return;

    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Article not found');
          } else {
            throw error;
          }
          return;
        }

        setArticle(data);

        // Increment view count
        await supabase
          .from('articles')
          .update({ view_count: data.view_count + 1 })
          .eq('id', data.id);

      } catch (error) {
        console.error('Error fetching article:', error);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

const optimizeArticleHTML = (html: string) => {
  if (!html) return '';
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    // Unwrap <font> tags but keep their children
    body.querySelectorAll('font').forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) {
        parent.insertBefore(el.firstChild, el);
      }
      parent.removeChild(el);
    });

    // Remove inline font declarations to enforce site font
    body.querySelectorAll('[style]').forEach((el) => {
      const element = el as HTMLElement;
      element.style.removeProperty('font');
      element.style.removeProperty('font-family');
      element.style.removeProperty('font-size');
      if (!element.getAttribute('style') || element.getAttribute('style')?.trim() === '') {
        element.removeAttribute('style');
      }
    });

    // Optimize images
    body.querySelectorAll('img').forEach((img) => {
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('fetchpriority', 'low');
      img.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      img.removeAttribute('width');
      img.removeAttribute('height');
      const prev = img.getAttribute('style') || '';
      img.setAttribute('style', `${prev}${prev && !prev.trim().endsWith(';') ? ';' : ''}height:auto;`);
    });

    // Optimize iframes
    body.querySelectorAll('iframe').forEach((ifr) => {
      ifr.setAttribute('loading', 'lazy');
    });

    // Optimize videos
    body.querySelectorAll('video').forEach((vid) => {
      vid.setAttribute('preload', 'metadata');
    });

    // Ensure headings have stable IDs for TOC
    const slugify = (s: string) =>
      s.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');

    body.querySelectorAll('h2, h3').forEach((h) => {
      if (!h.id || h.id.trim() === '') {
        const text = h.textContent || 'section';
        h.id = slugify(text);
      }
    });

    return body.innerHTML;
  } catch {
    // Fallback: regex-only optimizations
    html = html.replace(/<img\s/gi, '<img loading="lazy" decoding="async" fetchpriority="low" referrerpolicy="no-referrer-when-downgrade" ');
    html = html.replace(/<iframe\s/gi, '<iframe loading="lazy" ');
    html = html.replace(/<video\s/gi, '<video preload="metadata" ');
    html = html.replace(/<\/?font[^>]*>/gi, '');
    html = html.replace(/font-family:[^;\"]*;?/gi, '').replace(/font-size:[^;\"]*;?/gi, '');
    return html;
  }
};

const extractTOC = (html: string): TocItem[] => {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items: TocItem[] = [];
    doc.querySelectorAll('h2, h3').forEach((el) => {
      items.push({
        id: (el as HTMLElement).id || '',
        text: (el.textContent || '').trim(),
        level: el.tagName.toLowerCase() === 'h3' ? 3 : 2,
      });
    });
    return items;
  } catch {
    return [];
  }
};

const optimizedContent = useMemo(() => optimizeArticleHTML(article?.content || ''), [article?.content]);

useEffect(() => {
  setToc(extractTOC(optimizedContent));
}, [optimizedContent]);

useEffect(() => {
    if (!article) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = article.content || '';
    const text = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
    const description = text.slice(0, 160);

    document.title = article.title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
}, [article]);

useEffect(() => {
  if (!contentRef.current) return;
  const headings = Array.from(contentRef.current.querySelectorAll('h2, h3')) as HTMLElement[];
  if (headings.length === 0) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveId(entry.target.id);
      }
    });
  }, { rootMargin: '0px 0px -70% 0px', threshold: 0.1 });
  headings.forEach((h) => observer.observe(h));
  return () => observer.disconnect();
}, [optimizedContent]);

if (loading) return null;

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-background">
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20">
      <article>
        <header className="mb-6 md:mb-8">
          <h1 className="text-[32px] sm:text-[36px] md:text-[46px] font-bold text-foreground mb-2 md:mb-4 leading-[1.2] tracking-[-0.01em]">
            {article.title}
          </h1>
        </header>

        {toc.length > 0 && (
          <div className="lg:hidden mb-6">
            <Accordion type="single" collapsible>
              <AccordionItem value="toc">
                <AccordionTrigger className="text-base">Daftar Isi</AccordionTrigger>
                <AccordionContent>
                  <nav aria-label="Daftar Isi" className="text-sm">
                    <ul className="space-y-1">
                      {toc.map((item) => (
                        <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
                          <button
                            className="text-left text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => {
                              const el = document.getElementById(item.id);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                          >
                            {item.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <div 
            ref={contentRef}
            className="article-content text-[18px] md:text-[19px] leading-8 md:leading-9"
            dangerouslySetInnerHTML={{ __html: optimizedContent }}
          />
          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <nav aria-label="Table of contents" className="text-sm">
                  <p className="mb-2 font-medium text-foreground">Daftar Isi</p>
                  <ul className="space-y-1">
                    {toc.map((item) => (
                      <li key={item.id} className={item.level === 3 ? 'pl-4' : ''}>
                        <button
                          className={`text-left transition-colors ${activeId === item.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={() => {
                            const el = document.getElementById(item.id);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>
      </article>
    </div>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          datePublished: article.created_at,
          author: article.author_name ? { "@type": "Person", name: article.author_name } : undefined,
          mainEntityOfPage: { "@type": "WebPage", "@id": window.location.href },
          inLanguage: "id-ID",
        }),
      }}
    />
  </div>
);
}